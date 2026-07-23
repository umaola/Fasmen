# Technical Requirements Document (TRD)
## E-Learning Platform — Nigeria MVP

**Version:** 1.0
**Status:** Draft, based on product discussion to date
**Related documents:** `firestore-schema.md`, `implementation-plan.md`, `app-flow.md`

---

## 1. Purpose

This document defines the functional and non-functional requirements for the e-learning marketplace platform, where tutors upload and sell courses and students purchase or subscribe to access them. It consolidates decisions made during planning into a single reference for engineering, design, and product stakeholders.

---

## 2. Project overview

| | |
|---|---|
| **Product type** | Two-sided course marketplace (tutor-uploaded content, student purchase/subscription) |
| **Initial market** | Nigeria (global expansion planned post-MVP) |
| **Reference platforms** | Udemy (marketplace model), Kobo Course (regional case study) |
| **Core loop** | Tutor uploads course → admin approves → student purchases → student completes lessons → student passes assessment → certificate issued |
| **Backend** | Firebase (Auth, Firestore, Cloud Functions, Storage) |
| **Video delivery** | Dedicated CDN — Bunny.net or Mux (not Firebase Storage) |
| **Payments** | Paystack and/or Flutterwave |

---

## 3. Scope

### 3.1 In scope for MVP

- Student and tutor account creation and role management
- Course creation, upload, and admin-gated publishing
- Course discovery: browse, search, category filters
- One-time (pay-per-course) purchases
- Video streaming with adjustable quality
- Per-course assessments with server-side auto-grading
- Automatic certificate generation with public verification
- Course ratings and reviews
- Admin dashboard: course review, payment reconciliation, user management, dispute handling
- Tutor payout processing

### 3.2 Explicitly out of scope for MVP (deferred)

- Subscription billing (all-you-can-learn tier)
- Discussion forums / Q&A per course
- Native mobile app (if web ships first)
- Multi-language localization (Yoruba, Hausa, Igbo)
- Gamification (badges, streaks, leaderboards)
- AI-based content recommendations

Deferring these is a deliberate scope decision — see `implementation-plan.md` for phase sequencing and rationale (particularly around subscription billing, which introduces payout-splitting complexity best solved after the one-time-purchase model is proven).

---

## 4. User roles

| Role | Description |
|---|---|
| **Student** | Browses, purchases/enrolls, completes lessons, takes assessments, receives certificates, leaves reviews |
| **Tutor** | Applies, creates and uploads courses, submits for review, monitors enrollments/earnings, receives payouts |
| **Admin** | Reviews and approves/rejects courses, reconciles payments, manages users, resolves disputes |

A single user account may hold both `student` and `tutor` roles.

---

## 5. Functional requirements

### 5.1 Authentication & accounts

- FR-1: Users register via email/password or phone number + OTP.
- FR-2: Users select or are assigned a role (`student`, `tutor`, or both) at signup or later via a tutor application.
- FR-3: Tutor accounts require additional profile data: bio, expertise, and a payout account (bank details via Paystack/Flutterwave subaccount) before they can submit a course for review.
- FR-4: Admin accounts are provisioned manually or via a separate internal process — no public admin signup.

### 5.2 Course management (tutor-facing)

- FR-5: Tutors can create a course draft with title, description, category, tags, price, currency, language, and difficulty level.
- FR-6: Tutors can add lessons to a course, each with an order, type (video/reading/quiz), and associated video asset reference (CDN, not raw file storage) or text content.
- FR-7: Tutors can mark a lesson as a free preview, viewable without purchase.
- FR-8: Tutors can build an end-of-course assessment: multiple questions, each with options and a designated correct answer (or answers, for multi-select).
- FR-9: Tutors set a pass threshold percentage for the assessment (default 70%, configurable).
- FR-10: Submitting a course changes its status from `draft` to `pending-review`; it is not visible to students until approved.
- FR-11: Tutors receive rejection feedback and can revise and resubmit a rejected course.
- FR-12: Tutors can view enrollment counts, average rating, review count, and earnings per course.

### 5.3 Course discovery & purchase (student-facing)

- FR-13: Students can browse courses by category and search by keyword.
- FR-14: Only courses with `status == published` are visible in discovery and search.
- FR-15: The course detail page shows description, tutor profile, price, average rating, reviews, and any free preview lesson.
- FR-16: Students purchase a course via Paystack or Flutterwave checkout (card, bank transfer, or USSD).
- FR-17: Payment success is confirmed exclusively via signature-verified provider webhooks — client-side confirmation is never trusted to mark a payment or enrollment as complete.
- FR-18: A successful payment creates or updates an enrollment record linking the student to the course.

### 5.4 Learning experience

- FR-19: Enrolled students see a "my courses" dashboard with resume-where-left-off functionality.
- FR-20: Video playback supports multiple quality levels, with an explicit data-saver/lower-quality option given regional data cost sensitivity.
- FR-21: Lesson completion updates the student's progress record (`completedLessonIds`, `percentComplete`).
- FR-22: Students can submit assessment answers; grading occurs entirely server-side, and correct answers are never exposed to the client at any point, before or after grading.
- FR-23: Students below the pass threshold may retry the assessment up to a configured attempt limit.
- FR-24: A passing score automatically and immediately triggers certificate generation — no manual admin step required.

### 5.5 Certificates

- FR-25: Certificates are generated as a PDF containing student name, course title, tutor name, score, and issue date.
- FR-26: Each certificate has a unique verification code and a public verification page (no login required) so third parties can confirm authenticity.
- FR-27: Certificate records persist independently of the course's later state (e.g., if a course title is later edited, the certificate keeps its original snapshot values).

### 5.6 Reviews

- FR-28: Students who are enrolled in a course may submit a rating (1–5) and written review.
- FR-29: A course's average rating and review count are recalculated automatically when reviews are added, edited, or removed.

### 5.7 Payments & payouts

- FR-30: Every payment attempt is recorded with status (`pending`, `success`, `failed`, `refunded`) before the student is redirected to the payment provider.
- FR-31: Webhook handlers must be idempotent — a webhook firing more than once for the same transaction must not create duplicate enrollments or double-count revenue.
- FR-32: Platform fee and tutor payout amounts are calculated and stored per transaction (default split 70% tutor / 30% platform, configurable).
- FR-33: Tutor payouts are processed via provider subaccounts (split-at-checkout) or a scheduled payout job.
- FR-34: Admins can view a reconciliation view confirming that every successful charge corresponds to an active enrollment.

### 5.8 Admin

- FR-35: Admins can view and act on a queue of courses with `status == pending-review`, approving or rejecting with written feedback.
- FR-36: Admins can view, suspend, or verify tutor and student accounts.
- FR-37: Admins can view and act on refund/dispute requests.
- FR-38: Admins can view platform-wide metrics: total enrollments, revenue, active courses, pending reviews.

---

## 6. Non-functional requirements

### 6.1 Performance

- NFR-1: Course catalog and search pages must render primarily from denormalized fields on the `courses` collection — avoiding subcollection reads (lessons, reviews) on list views, to control Firestore read costs at scale.
- NFR-2: Video playback must begin within an acceptable startup time on 3G/4G mobile connections typical of the Nigerian market; adaptive bitrate streaming is required, not a single fixed-quality file.

### 6.2 Security

- NFR-3: Assessment correct answers must never be readable by an authenticated client under any Firestore security rule path.
- NFR-4: All writes to `enrollments`, `payments`, and `certificates` must be blocked at the security-rules level for direct client writes; only Cloud Functions (via the Admin SDK) may write to these collections.
- NFR-5: Payment webhook endpoints must verify provider signatures (`x-paystack-signature` HMAC-SHA512, Flutterwave `verif-hash`) before processing any event.
- NFR-6: Sensitive payout details (full bank account numbers) are not stored in Firestore; only what's needed for display (e.g., last 4 digits) is retained, with the provider holding full payout credentials.

### 6.3 Reliability

- NFR-7: Payment confirmation logic must be idempotent, tolerating duplicate webhook delivery without side effects (see FR-31).
- NFR-8: Certificate issuance must not depend on any single synchronous request-response cycle — it is Firestore-trigger-based so it cannot be lost due to a dropped client connection.

### 6.4 Cost management

- NFR-9: Video hosting cost per GB delivered must be evaluated and monitored against actual usage during the beta phase (see `implementation-plan.md`, Phase 4).
- NFR-10: Firestore read volume should be monitored; denormalized counters (enrollment counts, ratings) must be updated via Cloud Functions triggers rather than computed on read.

### 6.5 Compliance

- NFR-11: The platform must comply with Nigeria's Data Protection Act / NDPR requirements for handling personal data (student and tutor PII, payment metadata).
- NFR-12: The platform does not directly handle or store card data — all card entry occurs on Paystack/Flutterwave-hosted checkout pages, keeping the platform outside direct PCI-DSS scope.

### 6.6 Accessibility & localization (partial for MVP)

- NFR-13: UI text should be structured to support future localization (Yoruba, Hausa, Igbo) even though translation itself is deferred post-MVP.

---

## 7. System architecture summary

```
Client apps (Web / Mobile)
        │
        ▼
Backend services (Firebase)
 ├─ Auth & users
 ├─ Course catalog (Firestore)
 ├─ Payments engine (Cloud Functions)
 └─ Video delivery (reference only — actual files on CDN)
        │
        ▼
Nigeria-specific integrations
 ├─ Paystack / Flutterwave (cards, bank transfer, USSD)
 ├─ Bunny.net or Mux (video CDN)
 └─ Termii (SMS / WhatsApp notifications)
```

Full data model: see `firestore-schema.md`. Full Cloud Functions implementation (grading, certificate generation, webhook handlers): delivered separately as `functions/`.

---

## 8. Third-party integrations

| Service | Purpose | Key requirement |
|---|---|---|
| Paystack | Payment processing | Webhook signature verification, subaccount split payments |
| Flutterwave | Payment processing (alternate/parallel) | Webhook signature verification, subaccount split payments |
| Bunny.net or Mux | Video hosting & adaptive streaming | Cost-per-GB monitored; quality selection exposed to student |
| Termii (or similar) | SMS / WhatsApp notifications | Used for OTP and key transactional alerts |
| Firebase | Auth, database, functions, storage, hosting | Core backend platform |

---

## 9. Data model reference

Full schema is defined in `firestore-schema.md`, covering: `users`, `courses` (with `lessons`, `reviews`, `assessmentQuestions` subcollections), `enrollments` (with `quizAttempts` subcollection), `certificates`, `payments`, and `categories`. Security rules are defined alongside the schema and summarized in NFR-3 through NFR-6 above.

---

## 10. Assumptions & constraints

- Firebase's pricing model (per-document-read billing) is accepted as a tradeoff for development speed; denormalization strategy is designed specifically to manage this.
- Paystack and/or Flutterwave business account approval is assumed to take several business days and must be initiated early (see `implementation-plan.md`, Phase 0).
- The MVP targets a small, focused team (1–2 developers, part-time design support); timeline estimates in `implementation-plan.md` assume this team shape.

---

## 11. Success metrics (MVP)

| Metric | Why it matters |
|---|---|
| Number of approved, published courses at launch | Cold-start health — see `implementation-plan.md` |
| Course completion rate (lessons finished ÷ enrollments) | Signals content quality and engagement |
| Assessment pass rate on first attempt | Signals whether assessments are well-calibrated |
| Payment success rate (successful charges ÷ initiated checkouts) | Signals payment UX and provider reliability in-market |
| Certificate issuance rate (certificates issued ÷ course completions) | Confirms the core loop is functioning end-to-end |
| Tutor payout accuracy (reconciled payouts ÷ total payouts due) | Directly affects tutor trust and retention |

---

## 12. Open questions for stakeholder input

- Final tutor/platform revenue split percentage (default assumed 70/30 in this document)
- Refund policy specifics (window, eligibility, process)
- Whether phone OTP or email is the primary/default signup method
- Whether both Paystack and Flutterwave launch simultaneously or Paystack first, with Flutterwave added later
