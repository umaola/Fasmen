import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/dal";
import { listAllCourses, type Course } from "@/lib/courses";
import { listAllUsers, listAllTutors, listAllStudents, type UserProfile } from "@/lib/users";
import { listAllPayments, type Payment } from "@/lib/payments";
import { listAllEnrollments, type Enrollment } from "@/lib/enrollments";
import { listAllCertificates, type Certificate } from "@/lib/certificates";
import { formatNaira } from "@/lib/currency";
import {
  ClipboardCheckIcon,
  BookIcon,
  UserCircleIcon,
  WalletIcon,
  CertificateIcon,
  CheckCircleIcon,
} from "@/components/icons";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminOverviewPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    redirect("/admin/login");
  }

  const [courses, allUsers, tutors, students, payments, enrollments, certificates] =
    await Promise.all([
      listAllCourses(),
      listAllUsers(),
      listAllTutors(),
      listAllStudents(),
      listAllPayments(),
      listAllEnrollments(),
      listAllCertificates(),
    ]);

  const pendingCourses = courses.filter((c: Course) => c && c.status === "pending-review");
  const publishedCourses = courses.filter((c: Course) => c && c.status === "published");
  const draftCourses = courses.filter((c: Course) => c && c.status === "draft");
  const unverifiedTutors = tutors.filter((t: UserProfile) => !t.tutorProfile?.verified);

  const successfulPayments = payments.filter((p: Payment) => p.status === "success");
  const grossRevenueKobo = successfulPayments.reduce((sum: number, p: Payment) => sum + p.amount, 0);
  const platformRevenueKobo = successfulPayments.reduce(
    (sum: number, p: Payment) => sum + p.platformFeeAmount,
    0
  );
  const tutorPayoutsKobo = successfulPayments.reduce(
    (sum: number, p: Payment) => sum + p.tutorPayoutAmount,
    0
  );

  const unpaidPayouts = successfulPayments.filter((p: Payment) => p.payoutStatus === "unpaid");
  const unpaidTotalKobo = unpaidPayouts.reduce((sum: number, p: Payment) => sum + p.tutorPayoutAmount, 0);

  const recentCourses = courses.slice(0, 5);
  const recentPayments = successfulPayments.slice(0, 5);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <span className="text-xs font-semibold uppercase tracking-wider text-accent-600">
          Executive Control Panel
        </span>
        <h1 className="font-heading text-2xl sm:text-3xl font-bold text-primary-900 mt-1">
          Platform Overview
        </h1>
        <p className="mt-1 text-sm text-neutral-700">
          Real-time health, monetization metrics, review pipelines, and operational governance for FASMEN.
        </p>
      </div>

      {/* Action Required Banner Section */}
      {(pendingCourses.length > 0 || unverifiedTutors.length > 0 || unpaidPayouts.length > 0) && (
        <div className="rounded-lg border border-amber-200 bg-[#fcf3e1] p-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="flex h-2.5 w-2.5 rounded-full bg-warning-600 animate-pulse" />
            <h2 className="font-heading text-sm font-bold uppercase tracking-wider text-warning-600">
              Immediate Attention Required
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {pendingCourses.length > 0 && (
              <Link
                href="/admin/review"
                className="flex items-center justify-between rounded-md bg-white p-3.5 shadow-sm border border-amber-300/60 transition hover:border-primary-700"
              >
                <div>
                  <span className="block text-xs font-medium text-neutral-700">Pending Courses</span>
                  <span className="font-heading text-lg font-bold text-primary-900">
                    {pendingCourses.length} awaiting review
                  </span>
                </div>
                <span className="text-xs font-semibold text-primary-700">Inspect →</span>
              </Link>
            )}

            {unverifiedTutors.length > 0 && (
              <Link
                href="/admin/tutors"
                className="flex items-center justify-between rounded-md bg-white p-3.5 shadow-sm border border-amber-300/60 transition hover:border-primary-700"
              >
                <div>
                  <span className="block text-xs font-medium text-neutral-700">Unverified Instructors</span>
                  <span className="font-heading text-lg font-bold text-primary-900">
                    {unverifiedTutors.length} pending verification
                  </span>
                </div>
                <span className="text-xs font-semibold text-primary-700">Verify →</span>
              </Link>
            )}

            {unpaidPayouts.length > 0 && (
              <Link
                href="/admin/finance"
                className="flex items-center justify-between rounded-md bg-white p-3.5 shadow-sm border border-amber-300/60 transition hover:border-primary-700"
              >
                <div>
                  <span className="block text-xs font-medium text-neutral-700">Pending Payouts</span>
                  <span className="font-heading text-lg font-bold text-primary-900">
                    {formatNaira(unpaidTotalKobo)} ({unpaidPayouts.length} tx)
                  </span>
                </div>
                <span className="text-xs font-semibold text-primary-700">Disburse →</span>
              </Link>
            )}
          </div>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg bg-white p-5 shadow-[0_1px_3px_rgba(18,22,28,0.08)] border border-neutral-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-700">Gross Marketplace Vol</span>
            <WalletIcon className="h-5 w-5 text-primary-700" />
          </div>
          <p className="font-heading text-2xl font-bold text-primary-900 mt-2">
            {formatNaira(grossRevenueKobo)}
          </p>
          <span className="text-xs text-neutral-700 mt-1 block">
            {successfulPayments.length} paid enrollment transactions
          </span>
        </div>

        <div className="rounded-lg bg-white p-5 shadow-[0_1px_3px_rgba(18,22,28,0.08)] border border-neutral-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-700">Platform Revenue (30%)</span>
            <span className="rounded bg-accent-100 px-2 py-0.5 text-[10px] font-bold text-accent-600">
              NET SHARE
            </span>
          </div>
          <p className="font-heading text-2xl font-bold text-primary-900 mt-2">
            {formatNaira(platformRevenueKobo)}
          </p>
          <span className="text-xs text-neutral-700 mt-1 block">
            Direct platform commissions
          </span>
        </div>

        <div className="rounded-lg bg-white p-5 shadow-[0_1px_3px_rgba(18,22,28,0.08)] border border-neutral-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-700">Learners & Tutors</span>
            <UserCircleIcon className="h-5 w-5 text-primary-700" />
          </div>
          <p className="font-heading text-2xl font-bold text-primary-900 mt-2">
            {allUsers.length} Users
          </p>
          <span className="text-xs text-neutral-700 mt-1 block">
            {students.length} students · {tutors.length} instructors
          </span>
        </div>

        <div className="rounded-lg bg-white p-5 shadow-[0_1px_3px_rgba(18,22,28,0.08)] border border-neutral-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-700">Published Courses</span>
            <BookIcon className="h-5 w-5 text-primary-700" />
          </div>
          <p className="font-heading text-2xl font-bold text-primary-900 mt-2">
            {publishedCourses.length} Live
          </p>
          <span className="text-xs text-neutral-700 mt-1 block">
            {courses.length} total · {certificates.length} certificates issued
          </span>
        </div>
      </div>

      {/* Control Quick Links */}
      <div>
        <h2 className="font-heading text-lg font-semibold text-primary-900 mb-4">
          Admin Management Modules
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link
            href="/admin/review"
            className="group rounded-lg bg-white p-5 shadow-[0_1px_3px_rgba(18,22,28,0.08)] border border-neutral-200 transition hover:border-primary-700"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary-100 text-primary-700">
                <ClipboardCheckIcon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-heading text-base font-bold text-primary-900 group-hover:text-primary-700">
                  Course Review Queue
                </h3>
                <p className="text-xs text-neutral-700">
                  {pendingCourses.length} pending moderation
                </p>
              </div>
            </div>
          </Link>

          <Link
            href="/admin/courses"
            className="group rounded-lg bg-white p-5 shadow-[0_1px_3px_rgba(18,22,28,0.08)] border border-neutral-200 transition hover:border-primary-700"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary-100 text-primary-700">
                <BookIcon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-heading text-base font-bold text-primary-900 group-hover:text-primary-700">
                  Course Catalog
                </h3>
                <p className="text-xs text-neutral-700">
                  Manage all {courses.length} courses & pricing
                </p>
              </div>
            </div>
          </Link>

          <Link
            href="/admin/tutors"
            className="group rounded-lg bg-white p-5 shadow-[0_1px_3px_rgba(18,22,28,0.08)] border border-neutral-200 transition hover:border-primary-700"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary-100 text-primary-700">
                <UserCircleIcon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-heading text-base font-bold text-primary-900 group-hover:text-primary-700">
                  Instructors & IDs
                </h3>
                <p className="text-xs text-neutral-700">
                  {tutors.length} tutors ({unverifiedTutors.length} unverified)
                </p>
              </div>
            </div>
          </Link>

          <Link
            href="/admin/students"
            className="group rounded-lg bg-white p-5 shadow-[0_1px_3px_rgba(18,22,28,0.08)] border border-neutral-200 transition hover:border-primary-700"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary-100 text-primary-700">
                <UserCircleIcon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-heading text-base font-bold text-primary-900 group-hover:text-primary-700">
                  Student Management
                </h3>
                <p className="text-xs text-neutral-700">
                  {students.length} students & quiz attempt resets
                </p>
              </div>
            </div>
          </Link>

          <Link
            href="/admin/finance"
            className="group rounded-lg bg-white p-5 shadow-[0_1px_3px_rgba(18,22,28,0.08)] border border-neutral-200 transition hover:border-primary-700"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary-100 text-primary-700">
                <WalletIcon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-heading text-base font-bold text-primary-900 group-hover:text-primary-700">
                  Finance & Payouts
                </h3>
                <p className="text-xs text-neutral-700">
                  Reconcile payments & run instructor payouts
                </p>
              </div>
            </div>
          </Link>

          <Link
            href="/admin/certificates"
            className="group rounded-lg bg-white p-5 shadow-[0_1px_3px_rgba(18,22,28,0.08)] border border-neutral-200 transition hover:border-primary-700"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary-100 text-primary-700">
                <CertificateIcon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-heading text-base font-bold text-primary-900 group-hover:text-primary-700">
                  Certificates Registry
                </h3>
                <p className="text-xs text-neutral-700">
                  {certificates.length} credentials issued & verifiable
                </p>
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* Dual Activity Tables: Recent Course Submissions & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Courses */}
        <div className="rounded-lg bg-white p-6 shadow-[0_1px_3px_rgba(18,22,28,0.08)] border border-neutral-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading text-base font-bold text-primary-900">
              Recent Course Activity
            </h2>
            <Link href="/admin/courses" className="text-xs font-semibold text-primary-700 hover:underline">
              View all →
            </Link>
          </div>

          <div className="space-y-3">
            {recentCourses.map((c: Course) => (
              <div
                key={c.id}
                className="flex items-center justify-between border-b border-neutral-200 pb-3 last:border-0 last:pb-0"
              >
                <div className="min-w-0 pr-3">
                  <p className="font-medium text-sm text-neutral-900 truncate">{c.title}</p>
                  <p className="text-xs text-neutral-700">
                    by {c.tutorName} · {formatNaira(c.price)}
                  </p>
                </div>
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize shrink-0 ${
                    c.status === "published"
                      ? "bg-[#e4f5ec] text-success-600"
                      : c.status === "pending-review"
                      ? "bg-[#fcf3e1] text-warning-600"
                      : c.status === "rejected"
                      ? "bg-[#fbe9e7] text-error-600"
                      : "bg-neutral-200 text-neutral-700"
                  }`}
                >
                  {c.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Payments */}
        <div className="rounded-lg bg-white p-6 shadow-[0_1px_3px_rgba(18,22,28,0.08)] border border-neutral-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading text-base font-bold text-primary-900">
              Recent Transactions
            </h2>
            <Link href="/admin/finance" className="text-xs font-semibold text-primary-700 hover:underline">
              View ledger →
            </Link>
          </div>

          <div className="space-y-3">
            {recentPayments.map((p: Payment) => (
              <div
                key={p.id}
                className="flex items-center justify-between border-b border-neutral-200 pb-3 last:border-0 last:pb-0"
              >
                <div className="min-w-0 pr-3">
                  <p className="font-medium text-sm text-neutral-900 truncate">{p.courseTitle}</p>
                  <p className="text-xs text-neutral-700">
                    Ref: {p.providerReference.slice(0, 18)}...
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-heading text-sm font-bold text-primary-900">
                    {formatNaira(p.amount)}
                  </p>
                  <span className="text-[11px] text-success-600 font-medium capitalize">
                    {p.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
