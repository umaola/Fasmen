# Firestore schema — e-learning platform (Nigeria MVP)

This schema covers users, courses, enrollments, assessments, certificates, and payments. It's designed for Firestore's document model — some data is duplicated across documents on purpose (denormalization) to avoid expensive reads at scale.

---

## 1. `users/{userId}`

One document per user, whether student, tutor, or both. `userId` = Firebase Auth UID.

```
users/{userId}
{
  displayName: string,
  email: string | null,
  phoneNumber: string | null,        // for Nigeria: many users prefer phone auth
  photoURL: string | null,
  role: "student" | "tutor" | "admin",  // or array if a user can be both: ["student", "tutor"]
  bio: string | null,                // tutor bio, shown on course pages
  createdAt: timestamp,
  updatedAt: timestamp,

  // Tutor-only fields (present only if role includes "tutor")
  tutorProfile: {
    payoutAccount: {
      provider: "paystack" | "flutterwave",
      subaccountCode: string,        // Paystack/Flutterwave subaccount for split payments
      bankName: string,
      accountNumberLast4: string     // never store full account number here
    } | null,
    totalStudents: number,           // denormalized count, updated via Cloud Function
    averageRating: number,           // denormalized, updated when reviews change
    verified: boolean                // admin-approved tutor badge
  } | null
}
```

**Notes:**
- Don't store full bank account numbers in Firestore — keep only what's needed for display, and let Paystack/Flutterwave hold the sensitive payout details via their subaccount APIs.
- `role` as an array (`["student","tutor"]`) is more flexible if you expect users to switch between buying and teaching.

---

## 2. `courses/{courseId}`

```
courses/{courseId}
{
  title: string,
  slug: string,                      // URL-friendly, unique
  description: string,
  tutorId: string,                   // references users/{userId}
  tutorName: string,                 // denormalized — avoids a join to display on course cards
  category: string,                  // e.g. "web-development", "business"
  tags: array<string>,
  thumbnailURL: string,
  price: number,                     // in kobo (smallest currency unit) to avoid float issues
  currency: "NGN",
  billingType: "one-time" | "subscription-only" | "both",
  status: "draft" | "pending-review" | "published" | "rejected",
  language: string,                  // e.g. "en", "yo", "ha", "ig"
  level: "beginner" | "intermediate" | "advanced",

  // Denormalized aggregates — updated by Cloud Functions, not read from subcollections directly
  totalLessons: number,
  totalDurationSeconds: number,
  enrollmentCount: number,
  averageRating: number,
  reviewCount: number,

  passThresholdPercent: number,      // e.g. 70 — used for certificate eligibility

  createdAt: timestamp,
  updatedAt: timestamp,
  publishedAt: timestamp | null
}
```

### 2a. `courses/{courseId}/lessons/{lessonId}` (subcollection)

```
{
  title: string,
  order: number,                     // for sequencing lessons
  type: "video" | "reading" | "quiz",
  videoAssetId: string | null,       // ID/reference from Bunny.net or Mux — NOT the raw file
  videoDurationSeconds: number | null,
  content: string | null,            // for "reading" type lessons, markdown or HTML
  resources: array<{ name: string, url: string }>,  // downloadable PDFs, etc.
  isPreview: boolean,                 // free preview lesson, visible before purchase
  createdAt: timestamp
}
```

### 2b. `courses/{courseId}/reviews/{reviewId}` (subcollection)

```
{
  studentId: string,
  studentName: string,               // denormalized
  rating: number,                    // 1-5
  comment: string,
  createdAt: timestamp
}
```
A Cloud Function updates `courses/{courseId}.averageRating` and `.reviewCount` whenever a review is added, edited, or deleted — don't compute this on every read.

### 2c. `courses/{courseId}/assessmentQuestions/{questionId}` (subcollection — restricted read)

```
{
  order: number,
  questionText: string,
  type: "single-choice" | "multi-choice",
  options: array<string>,
  correctOptionIndexes: array<number>,  // NEVER exposed to client reads — see security rules
  points: number
}
```

**Critical:** this subcollection must be locked down so students can never read `correctOptionIndexes` directly. Grading happens exclusively through a Cloud Function (callable function), which reads the answers server-side and returns only the score. See security rules section below.

---

## 3. `enrollments/{enrollmentId}`

Document ID pattern: `{userId}_{courseId}` — this makes lookups and duplicate-prevention trivial (no need to query, just try to read the exact doc).

```
enrollments/{userId}_{courseId}
{
  studentId: string,
  courseId: string,
  courseTitle: string,               // denormalized, for "my courses" list without extra reads
  tutorId: string,

  purchaseType: "one-time" | "subscription",
  paymentId: string,                 // references payments/{paymentId}

  enrolledAt: timestamp,

  progress: {
    completedLessonIds: array<string>,
    lastLessonId: string | null,
    percentComplete: number,          // 0-100, updated as lessons complete
    lastAccessedAt: timestamp
  },

  assessment: {
    attemptsUsed: number,
    bestScorePercent: number | null,
    passed: boolean,
    lastAttemptAt: timestamp | null
  },

  certificateId: string | null        // set once issued, references certificates/{certificateId}
}
```

### 3a. `enrollments/{enrollmentId}/quizAttempts/{attemptId}` (subcollection)

Keep a history of every attempt for audit/analytics purposes, separate from the summary above.

```
{
  attemptNumber: number,
  scorePercent: number,
  answers: array<{ questionId: string, selectedOptionIndexes: array<number>, correct: boolean }>,
  submittedAt: timestamp
}
```

---

## 4. `certificates/{certificateId}`

Use a short, non-guessable ID (e.g. a UUID or nanoid) — this doubles as the public verification code.

```
certificates/{certificateId}
{
  studentId: string,
  studentName: string,               // denormalized — snapshot at time of issue
  courseId: string,
  courseTitle: string,               // denormalized — snapshot, so it stays correct even if course title changes later
  tutorName: string,
  scorePercent: number,
  issuedAt: timestamp,
  pdfURL: string,                    // Firebase Storage URL for the generated PDF
  verificationCode: string           // same as certificateId, shown on the PDF and public verify page
}
```

Public verification page at `/verify/{certificateId}` reads this document with public, read-only rules (see below) — no auth required, so anyone (an employer, for instance) can confirm a certificate is genuine.

---

## 5. `payments/{paymentId}`

```
payments/{paymentId}
{
  studentId: string,
  courseId: string | null,           // null if this is a subscription payment, not tied to one course
  type: "one-time" | "subscription-initial" | "subscription-renewal",
  provider: "paystack" | "flutterwave",
  providerReference: string,         // transaction reference from Paystack/Flutterwave
  amount: number,                    // in kobo
  currency: "NGN",
  status: "pending" | "success" | "failed" | "refunded",
  platformFeeAmount: number,         // your cut
  tutorPayoutAmount: number,         // amount owed to tutor
  createdAt: timestamp,
  confirmedAt: timestamp | null
}
```

Payment status should only ever be written by a Cloud Function responding to a verified Paystack/Flutterwave webhook — never trust a client-side write to mark a payment as successful.

---

## 6. `categories/{categoryId}`

Small reference collection for course categories, used to populate filters/navigation.

```
{
  name: string,
  slug: string,
  order: number,
  courseCount: number    // denormalized
}
```

---

## Indexes you'll need

Firestore requires composite indexes for compound queries. Set these up early (`firestore.indexes.json` or via console) for:

- `courses`: `status == "published"` + `category ==` + `orderBy(enrollmentCount desc)` — for browsing/discovery
- `courses`: `status == "published"` + `orderBy(publishedAt desc)` — for "newest courses"
- `enrollments`: `studentId ==` + `orderBy(enrolledAt desc)` — for "my courses" list
- `payments`: `studentId ==` + `orderBy(createdAt desc)` — for payment history

---

## Security rules — key principles

```
// Simplified example — expand per collection
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    match /users/{userId} {
      allow read: if true;                          // public profile info
      allow write: if request.auth.uid == userId;   // users edit only their own doc
    }

    match /courses/{courseId} {
      allow read: if resource.data.status == "published" || 
                     (request.auth != null && request.auth.uid == resource.data.tutorId);
      allow write: if request.auth != null && request.auth.uid == resource.data.tutorId;

      match /assessmentQuestions/{questionId} {
        allow read: if false;   // NEVER readable by clients — only Cloud Functions via Admin SDK
        allow write: if false;  // only written via Cloud Functions or trusted admin tooling
      }

      match /reviews/{reviewId} {
        allow read: if true;
        allow create: if request.auth.uid == request.resource.data.studentId;
      }
    }

    match /enrollments/{enrollmentId} {
      allow read: if request.auth.uid == resource.data.studentId;
      allow write: if false;   // all writes go through Cloud Functions (progress, quiz results, payments)
    }

    match /certificates/{certificateId} {
      allow read: if true;     // public verification page needs this
      allow write: if false;   // only Cloud Functions issue certificates
    }

    match /payments/{paymentId} {
      allow read: if request.auth.uid == resource.data.studentId;
      allow write: if false;   // only Cloud Functions, triggered by verified webhooks
    }
  }
}
```

The pattern throughout: **students and tutors can read what's theirs, but almost nothing is client-writable.** Progress updates, quiz grading, payment confirmation, and certificate issuance all go through Cloud Functions using the Admin SDK, which bypasses these rules safely — this is what stops someone from, say, editing their own Firestore document to mark a course as "completed" or a payment as "successful."

---

## A note on cost/read patterns

Firestore bills per document read. A few habits that matter as you scale past a few hundred users:

- Course listing pages should read from `courses` directly (with the denormalized fields above) — never loop through `lessons` or `reviews` subcollections just to render a course card.
- Use the denormalized counters (`enrollmentCount`, `averageRating`, etc.) and keep them updated via Cloud Functions triggers, rather than computing aggregates on every page load.
- For the "my courses" dashboard, `enrollments` alone should have everything needed to render the list — that's why `courseTitle` is duplicated there.
