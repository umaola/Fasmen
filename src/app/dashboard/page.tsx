import Link from "next/link";
import { verifySession, getCurrentUser } from "@/lib/dal";
import { listCoursesByTutor, listPendingReviewCourses, describeCourseActivity } from "@/lib/courses";
import { listEnrollmentsByTutor } from "@/lib/enrollments";
import { listPaymentsByTutor, listAllPayments } from "@/lib/payments";
import { listReviewsByTutor } from "@/lib/reviews";
import { formatNaira } from "@/lib/currency";
import { WelcomeModal } from "./WelcomeModal";
import { PerformanceChart } from "./PerformanceChart";
import { StudentDashboard } from "./StudentDashboard";

function EmptyState({
  title,
  body,
  actionHref,
  actionLabel,
}: {
  title: string;
  body: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <div className="mx-auto max-w-md rounded-lg border border-dashed border-neutral-200 bg-white p-10 text-center">
      <h2 className="font-heading text-lg font-semibold text-primary-900">{title}</h2>
      <p className="mt-2 text-sm text-neutral-700">{body}</p>
      {actionHref && actionLabel && (
        <Link
          href={actionHref}
          className="mt-6 inline-flex h-11 items-center rounded-md bg-accent-600 px-6 font-medium text-white transition hover:brightness-95"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  );
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ justSignedUp?: string }>;
}) {
  await verifySession();
  const user = await getCurrentUser();
  const { justSignedUp } = await searchParams;

  if (!user) {
    return null;
  }

  const showWelcomeModal =
    justSignedUp !== undefined && user.role === "tutor" && !user.tutorProfile?.verified;

  if (user.role === "student") {
    return <StudentDashboard studentId={user.id} />;
  }

  return (
    <div>
      {showWelcomeModal && <WelcomeModal />}

      <h1 className="font-heading text-2xl font-bold text-primary-900">
        Welcome, {user.displayName}
      </h1>

      <div className="mt-8">
        {user.role === "tutor" && (
          <TutorOverview
            tutorId={user.id}
            isVerified={Boolean(user.tutorProfile?.verified)}
          />
        )}

        {user.role === "admin" && <AdminOverview />}
      </div>
    </div>
  );
}

async function TutorOverview({
  tutorId,
  isVerified,
}: {
  tutorId: string;
  isVerified: boolean;
}) {
  const courses = await listCoursesByTutor(tutorId);

  if (courses.length === 0) {
    if (!isVerified) {
      return (
        <EmptyState
          title="Complete your registration"
          body="Complete your tutor verification details before creating your first course on FASMEN."
          actionHref="/dashboard/account/verify"
          actionLabel="Complete registration"
        />
      );
    }

    return (
      <EmptyState
        title="No courses yet"
        body="Create your first course draft, add a few lessons, and submit it for admin review."
        actionHref="/dashboard/courses/new"
        actionLabel="Create a course"
      />
    );
  }

  const totalStudents = courses.reduce((sum, c) => sum + c.enrollmentCount, 0);
  const [payments, enrollments, reviews] = await Promise.all([
    listPaymentsByTutor(tutorId),
    listEnrollmentsByTutor(tutorId),
    listReviewsByTutor(tutorId),
  ]);
  const totalPayout = payments
    .filter((p) => p.status === "success")
    .reduce((sum, p) => sum + p.tutorPayoutAmount, 0);

  const recentActivity = courses
    .map(describeCourseActivity)
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, 5);

  const recentTransactions = payments.filter((p) => p.status === "success").slice(0, 5);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <StatTile label="Total enrollments" value={String(totalStudents)} />
        <StatTile label="Total courses" value={String(courses.length)} />
        <StatTile label="Total earnings" value={formatNaira(totalPayout)} />
      </div>

      <PerformanceChart enrollments={enrollments} payments={payments} reviews={reviews} />

      <div className="grid min-w-0 gap-6 lg:grid-cols-2">
        <div className="min-w-0 rounded-lg bg-white p-5 shadow-[0_1px_3px_rgba(18,22,28,0.08)]">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-base font-semibold text-primary-900">
              Recent activity
            </h2>
            <Link
              href="/dashboard/courses"
              className="shrink-0 pl-4 text-xs font-medium text-primary-700 underline hover:text-primary-900"
            >
              Manage
            </Link>
          </div>
          <ul className="mt-2 flex flex-col divide-y divide-neutral-200">
            {recentActivity.map((item, i) => (
              <li key={i} className="flex items-center justify-between gap-2 py-2.5 text-sm">
                <span className="min-w-0 truncate text-neutral-900">{item.message}</span>
                <span className="shrink-0 text-xs text-neutral-700">
                  {new Date(item.at).toLocaleDateString("en-NG", {
                    day: "numeric",
                    month: "short",
                  })}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="min-w-0 rounded-lg bg-white p-5 shadow-[0_1px_3px_rgba(18,22,28,0.08)]">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-base font-semibold text-primary-900">
              Transaction history
            </h2>
            <Link
              href="/dashboard/earnings"
              className="shrink-0 pl-4 text-xs font-medium text-primary-700 underline hover:text-primary-900"
            >
              View all
            </Link>
          </div>
          {recentTransactions.length === 0 ? (
            <p className="mt-2 text-sm text-neutral-700">No transactions yet.</p>
          ) : (
            <ul className="mt-2 flex flex-col divide-y divide-neutral-200">
              {recentTransactions.map((payment) => (
                <li key={payment.id} className="flex items-center justify-between gap-2 py-2.5 text-sm">
                  <div className="min-w-0">
                    <p className="truncate text-neutral-900">{payment.courseTitle}</p>
                    <p className="truncate text-xs text-neutral-700">
                      {new Date(payment.createdAt).toLocaleDateString("en-NG", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <span className="shrink-0 font-medium text-primary-900">
                    {formatNaira(payment.tutorPayoutAmount)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function StatTile({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="min-w-0 rounded-lg bg-white p-4 shadow-[0_1px_3px_rgba(18,22,28,0.08)] sm:p-5">
      <p className="truncate text-xs text-neutral-700 sm:text-sm">{label}</p>
      <p className="font-heading mt-1 truncate text-xl font-extrabold text-primary-900 sm:text-2xl sm:font-bold">
        {value}
      </p>
      {hint && <p className="mt-1 truncate text-xs text-neutral-400">{hint}</p>}
    </div>
  );
}

async function AdminOverview() {
  const [pending, payments] = await Promise.all([listPendingReviewCourses(), listAllPayments()]);
  const successful = payments.filter((p) => p.status === "success");
  const totalRevenue = successful.reduce((sum, p) => sum + p.amount, 0);
  const pendingPayouts = successful
    .filter((p) => p.payoutStatus === "unpaid")
    .reduce((sum, p) => sum + p.tutorPayoutAmount, 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile label="Pending review" value={String(pending.length)} />
        <StatTile label="Platform revenue" value={formatNaira(totalRevenue)} />
        <StatTile label="Pending tutor payouts" value={formatNaira(pendingPayouts)} />
      </div>

      <div className="rounded-lg bg-white p-6 shadow-[0_1px_3px_rgba(18,22,28,0.08)]">
        {pending.length === 0 ? (
          <p className="text-neutral-700">No courses are waiting for approval right now.</p>
        ) : (
          <p className="text-neutral-700">
            <span className="font-semibold text-warning-600">{pending.length}</span> course
            {pending.length === 1 ? "" : "s"} waiting for review.
          </p>
        )}
        <div className="mt-4 flex gap-3">
          <Link
            href="/dashboard/admin/review"
            className="inline-flex h-10 items-center rounded-md bg-primary-700 px-5 text-sm font-medium text-white transition hover:bg-primary-900"
          >
            Open review queue
          </Link>
          <Link
            href="/dashboard/admin/reconciliation"
            className="inline-flex h-10 items-center rounded-md border border-primary-700 px-5 text-sm font-medium text-primary-700 transition hover:bg-primary-100"
          >
            Open reconciliation
          </Link>
        </div>
      </div>
    </div>
  );
}
