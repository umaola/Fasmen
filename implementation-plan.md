# Implementation Plan — E-Learning Platform (Nigeria MVP)

## Where we've landed so far

- **Market**: Nigeria first, global expansion later
- **Stack**: Firebase (Auth, Firestore, Cloud Functions, Storage) + a dedicated video CDN (Bunny.net or Mux)
- **Payments**: Paystack and/or Flutterwave, pay-per-course at launch, subscriptions deferred
- **Learning flow**: lessons → auto-graded assessment → auto-issued certificate with public verification
- **Schema and core Cloud Functions** (grading, certificate generation, payment webhooks) are already drafted

This plan sequences the remaining work into phases, with a rough timeline, team needs, and the risks worth watching.

---

## Phase 0 — Foundations (Week 1–2)

Get the unglamorous plumbing right before writing feature code — this is the phase most teams are tempted to skip, and the one that costs the most later if skipped.

| Task | Notes |
|---|---|
| Firebase project setup (dev, staging, prod environments) | Use separate Firebase projects per environment, not just separate collections |
| Firestore security rules + emulator testing | Write rules alongside schema, not after |
| Paystack + Flutterwave test/sandbox accounts | Apply for live accounts early — Nigerian payment providers sometimes take days to approve business accounts |
| Bunny.net or Mux account + test video upload pipeline | Confirm actual cost per GB delivered before committing |
| CI/CD basics (GitHub Actions or similar) for Functions deploy | Even a simple lint + deploy pipeline prevents "it worked on my machine" bugs |
| Domain, hosting, and basic legal (terms of service, privacy policy, tutor agreement) | Tutor payout terms especially need to be clear in writing before anyone uploads content |

**Deliverable:** empty-but-wired project — you can sign up, log in, and see a blank dashboard, with payments and video pipelines proven end-to-end on test data.

---

## Phase 1 — Core marketplace (Week 3–7)

The minimum needed for a tutor to upload a course and a student to buy and watch it.

| Feature | Priority |
|---|---|
| Auth: email + phone/OTP sign-up, role selection (student/tutor) | Must-have |
| Tutor dashboard: create course, add lessons, upload video, set price | Must-have |
| Admin review queue: approve/reject courses before publish | Must-have — protects platform trust from day one |
| Course catalog: browse, search, category filters | Must-have |
| Course detail page: preview lesson, description, tutor profile, reviews | Must-have |
| Checkout: Paystack/Flutterwave one-time payment → enrollment | Must-have |
| Student dashboard: "my courses," resume where left off | Must-have |
| Video playback with quality selection (data-saver mode) | Must-have, given Nigerian data costs |
| Reviews and ratings | Should-have — can slip to Phase 2 if time-pressured |

**Deliverable:** a working, closed-beta marketplace — real tutors can upload, real students can pay and watch, end to end.

---

## Phase 2 — Assessments & certificates (Week 8–10)

Builds directly on the Cloud Functions already drafted.

| Feature | Notes |
|---|---|
| Tutor UI to build quiz questions per course | Needs a simple form builder — question, options, correct answer, points |
| Student quiz-taking UI | Calls the `gradeAssessment` callable function — never grade client-side |
| Certificate auto-issuance | Already wired via the `onEnrollmentPassed` trigger |
| Public certificate verification page (`/verify/{certificateId}`) | No auth required — this is what makes the certificate credible to a third party |
| Retry / attempt limit UX | Show attempts remaining, clear pass-threshold messaging |

**Deliverable:** a student can complete a course, pass an assessment, and receive a verifiable certificate — the full core loop is now real.

---

## Phase 3 — Payments hardening & tutor payouts (Week 11–13)

This phase is where a lot of platforms under-invest, and it shows up later as trust and legal problems.

| Task | Notes |
|---|---|
| Tutor payout automation | Either split-payment at checkout (Paystack/Flutterwave subaccounts) or a scheduled payout batch job |
| Payment reconciliation dashboard (admin) | You need to be able to answer "did every successful charge result in an enrollment?" without manually checking Firestore |
| Refund / dispute handling process | Decide your refund policy now, not when the first complaint arrives |
| Failed payment retry / abandoned checkout handling | Common in Nigeria due to bank/network payment failures — don't silently lose these students |

**Deliverable:** money moves reliably in both directions — student to platform, platform to tutor — with visibility when something breaks.

---

## Phase 4 — Closed beta & hardening (Week 14–16)

| Task | Notes |
|---|---|
| Recruit 15–30 tutors before public launch | Solves the cold-start problem — see note below |
| Recruit a small beta student group (existing network, niche community) | Real usage surfaces bugs no amount of internal QA finds |
| Load-test video delivery and Firestore reads at realistic scale | Confirm CDN costs match your model before scaling traffic |
| Security rules audit | Specifically re-test that quiz answers and payment status truly can't be read/written by clients |
| Analytics instrumentation (signup, purchase, completion funnels) | You'll want this data from day one of public launch, not three months in |

**Deliverable:** a platform that's been used by real people, with the rough edges from Phase 1–3 found and fixed.

---

## Phase 5 — Public launch and beyond (Week 17+)

- Public launch, marketing push
- Subscription billing (deferred from earlier phases — now layer this in with a clear tutor royalty-pool formula)
- Discussion forums / Q&A per course
- Mobile app parity, if web launched first
- Localization (Yoruba, Hausa, Igbo) if usage data supports it

---

## Team shape (minimum viable)

| Role | Why |
|---|---|
| 1 full-stack developer (Firebase/Node comfortable) | Core build |
| 1 frontend developer (if budget allows a second person) | Speeds up Phase 1–2 considerably; one person can do this alone but slower |
| 1 designer (part-time/contract is fine) | UI, certificate template, marketing site — design quality affects trust in a new marketplace more than people expect |
| You / a product owner | Tutor recruitment, admin review, business decisions |

A solo technical founder can realistically execute this plan alone in roughly double the timeline above — the phase order doesn't change, just the pace.

---

## Cold-start plan (don't skip this)

The single biggest risk to this project isn't technical — it's launching to an empty catalog or an empty student base. Concretely:

1. Before Phase 4 beta, personally recruit tutors — don't wait for organic sign-ups. Target people already teaching informally (WhatsApp groups, YouTube channels, Twitter/X threads) who'd benefit from a monetization channel.
2. Pick 2–3 course categories to be genuinely excellent in at launch rather than thin coverage across everything — density beats breadth for a new marketplace.
3. Consider offering the first cohort of tutors a better revenue split (e.g., 80/20 instead of 70/30) for their first few months, in exchange for being early and helping you find bugs.

---

## Risks to watch

| Risk | Mitigation |
|---|---|
| Payment provider approval delays | Apply for live Paystack/Flutterwave accounts in Phase 0, not Phase 3 |
| Video/CDN costs scaling faster than revenue | Cap free previews, monitor cost-per-GB weekly during beta |
| Low-quality course content damaging trust early | Admin review queue is non-negotiable pre-launch |
| Firestore read costs at scale | Denormalization strategy already reflected in the schema — revisit if bills spike |
| Certificate fraud/credibility concerns | Public verification page addresses this — consider adding it to your marketing copy as a trust signal |
| Tutor payout disputes | Clear written tutor agreement + payout dashboard from Phase 3 |

---

## Rough timeline summary

```
Week 1–2    Phase 0: Foundations
Week 3–7    Phase 1: Core marketplace
Week 8–10   Phase 2: Assessments & certificates
Week 11–13  Phase 3: Payments hardening & payouts
Week 14–16  Phase 4: Closed beta & hardening
Week 17+    Phase 5: Public launch & beyond
```

~16 weeks (4 months) to a public launch with a small, focused team — longer if solo, shorter only if you cut scope (e.g., defer reviews or data-saver video modes), which I wouldn't recommend given how much they matter for trust and cost in this specific market.
