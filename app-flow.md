# App Flow — E-Learning Platform (Nigeria MVP)

This document lays out the end-to-end flow for each user type: **Student**, **Tutor**, and **Admin**. Student and Tutor flows are linear journeys through the product. Admin's role is ongoing and parallel rather than a single path, so it's laid out as a set of responsibilities radiating from a central dashboard.

---

## 1. Student flow

1. **Sign up / log in**
   Email or phone number + OTP (phone auth matters for Nigerian users who may not trust email-only accounts).

2. **Browse & search courses**
   Category filters, search bar, sorting by rating/popularity/newest.

3. **View course details**
   Course description, tutor profile, price, reviews, and a free preview lesson before committing to buy.

4. **Checkout**
   Pay via Paystack or Flutterwave — card, bank transfer, or USSD. On successful payment (confirmed by webhook, not the client), an enrollment is created.

5. **Access enrolled course**
   Student dashboard shows "my courses," resume-where-you-left-off, and progress indicators.

6. **Complete lessons**
   Video lessons with quality/data-saver controls; progress is tracked lesson by lesson.

7. **Take assessment**
   Auto-graded quiz at the end of the course. Grading happens entirely server-side — the student never sees correct answers, only their score.

8. **Branch — pass or fail**
   - **Below pass threshold:** student sees their score, can review material, and retakes the assessment (up to a set attempt limit).
   - **At or above pass threshold:** certificate generation is triggered automatically.

9. **Certificate issued**
   PDF certificate with a public verification link (`yourapp.com/verify/{certificateId}`). Student is prompted to leave a rating/review for the course.

---

## 2. Tutor flow

1. **Apply as tutor**
   Complete a profile: bio, expertise, and payout details (bank account via Paystack/Flutterwave subaccount).

2. **Create course draft**
   Title, category, description, price, language, level.

3. **Upload lessons**
   Video (uploaded to the CDN — Bunny.net/Mux, not raw Firebase Storage) plus downloadable resources per lesson.

4. **Add assessment**
   Build quiz questions with options and correct answers, and set the course's pass threshold.

5. **Submit for review**
   Course status moves to `pending-review`. Tutor sees a clear "awaiting approval" state.

6. **Branch — admin decision**
   - **Rejected:** tutor receives specific feedback and revises the course, then resubmits.
   - **Approved:** course status flips to `published` and becomes visible in the catalog.

7. **Monitor enrollments**
   Dashboard shows enrollment counts, earnings, ratings, and reviews per course.

8. **Receive payouts**
   Revenue is split automatically at the point of sale (or via a scheduled payout job) into the tutor's Paystack/Flutterwave subaccount.

---

## 3. Admin flow

Admin work isn't a single journey — it's four ongoing responsibilities accessed from one dashboard.

1. **Admin logs in**
   Role-restricted access, separate from student/tutor accounts.

2. **Admin dashboard (central hub)**
   Snapshot view: pending reviews, recent payments, open disputes, platform-wide metrics.

From the dashboard, admin moves between:

| Responsibility | What it covers |
|---|---|
| **Course review queue** | Approve or reject newly submitted courses, with feedback sent back to the tutor. This is the gate that protects catalog quality. |
| **Payment reconciliation** | Confirm every successful charge resulted in an enrollment; investigate any mismatches between Paystack/Flutterwave records and Firestore payment docs. |
| **Tutor & user management** | Verify tutor accounts, suspend accounts if needed, handle support requests. |
| **Dispute & refund handling** | Process refund requests and resolve complaints from either students or tutors. |

---

## Where flows intersect

- **Tutor "submit for review" ↔ Admin "course review queue"** — the same event from two sides. Build the notification (tutor learns the outcome) and feedback mechanism (admin's rejection reason) as one connected feature, not two separate ones.
- **Student "leave a review" → feeds back into course discovery** for future students browsing that course.
- **Tutor "receive payouts" → natural moment to prompt starting a new course**, keeping supply growing alongside demand.
