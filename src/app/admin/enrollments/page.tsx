import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/dal";
import { listAllEnrollments, type Enrollment } from "@/lib/enrollments";
import { listAllUsers, type UserProfile } from "@/lib/users";
import { BookIcon, CheckCircleIcon } from "@/components/icons";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminEnrollmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    redirect("/admin/login");
  }

  const { q } = await searchParams;
  const [enrollments, users] = await Promise.all([listAllEnrollments(), listAllUsers()]);

  const userMap = new Map<string, UserProfile>();
  for (const u of users) {
    if (u) userMap.set(u.id, u);
  }

  const filtered = enrollments.filter((e: Enrollment) => {
    if (!e) return false;
    const student = userMap.get(e.studentId);
    if (q) {
      const matchCourse = e.courseTitle.toLowerCase().includes(q.toLowerCase());
      const matchStudent = student ? student.displayName.toLowerCase().includes(q.toLowerCase()) || student.email.toLowerCase().includes(q.toLowerCase()) : false;
      if (!matchCourse && !matchStudent) return false;
    }
    return true;
  });

  const completedCount = enrollments.filter((e: Enrollment) => e.progress.percentComplete === 100).length;
  const certifiedCount = enrollments.filter((e: Enrollment) => Boolean(e.certificateId)).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <span className="text-xs font-semibold uppercase tracking-wider text-accent-600">
          Enrollment Governance
        </span>
        <h1 className="font-heading text-2xl sm:text-3xl font-bold text-primary-900 mt-1">
          Master Enrollment Ledger
        </h1>
        <p className="mt-1 text-sm text-neutral-700">
          Audit trail of student course access, progress checkpoints, and linked certificate grants.
        </p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-lg bg-white p-5 border border-neutral-200 shadow-[0_1px_3px_rgba(18,22,28,0.08)]">
          <span className="text-xs font-medium text-neutral-700">Total Enrollments</span>
          <p className="font-heading text-2xl font-bold text-primary-900 mt-1">{enrollments.length}</p>
        </div>
        <div className="rounded-lg bg-white p-5 border border-neutral-200 shadow-[0_1px_3px_rgba(18,22,28,0.08)]">
          <span className="text-xs font-medium text-neutral-700">Completed (100%)</span>
          <p className="font-heading text-2xl font-bold text-primary-700 mt-1">{completedCount}</p>
        </div>
        <div className="rounded-lg bg-white p-5 border border-neutral-200 shadow-[0_1px_3px_rgba(18,22,28,0.08)]">
          <span className="text-xs font-medium text-neutral-700">Certificates Awarded</span>
          <p className="font-heading text-2xl font-bold text-success-600 mt-1">{certifiedCount}</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="rounded-lg bg-white p-4 border border-neutral-200 shadow-[0_1px_3px_rgba(18,22,28,0.08)]">
        <form method="GET" className="flex gap-3 items-center">
          <input
            name="q"
            defaultValue={q || ""}
            placeholder="Search by student name, email, or course title..."
            className="h-10 flex-1 rounded-md border border-neutral-200 px-3.5 text-sm outline-none transition focus:border-primary-500"
          />
          <button
            type="submit"
            className="h-10 rounded-md bg-primary-700 px-5 text-sm font-medium text-white transition hover:bg-primary-900"
          >
            Filter
          </button>
        </form>
      </div>

      {/* Enrollments Table */}
      {filtered.length === 0 ? (
        <div className="rounded-lg bg-white p-10 text-center border border-dashed border-neutral-200">
          <p className="text-sm text-neutral-700">No enrollment records found.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg bg-white shadow-[0_1px_3px_rgba(18,22,28,0.08)] border border-neutral-200">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-200 text-neutral-700 text-xs font-semibold uppercase">
                <th className="px-4 py-3">Student</th>
                <th className="px-4 py-3">Course</th>
                <th className="px-4 py-3">Enrolled On</th>
                <th className="px-4 py-3">Progress</th>
                <th className="px-4 py-3">Assessment</th>
                <th className="px-4 py-3 text-right">Certificate</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((e: Enrollment) => {
                const student = userMap.get(e.studentId);
                return (
                  <tr key={e.id} className="border-b border-neutral-200 last:border-0 hover:bg-neutral-50 transition">
                    <td className="px-4 py-3.5">
                      <p className="font-medium text-neutral-900">{student?.displayName || "Student"}</p>
                      <p className="text-xs text-neutral-700">{student?.email || e.studentId}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <Link
                        href={`/courses/${e.courseSlug}`}
                        target="_blank"
                        className="font-medium text-neutral-900 hover:text-primary-700 hover:underline"
                      >
                        {e.courseTitle}
                      </Link>
                    </td>
                    <td className="px-4 py-3.5 text-neutral-700 text-xs">
                      {new Date(e.enrolledAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-20 rounded-full bg-neutral-200 overflow-hidden">
                          <div
                            className="h-full bg-primary-500 rounded-full"
                            style={{ width: `${e.progress.percentComplete}%` }}
                          />
                        </div>
                        <span className="text-xs text-neutral-700 font-medium">{e.progress.percentComplete}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      {e.assessment.passed ? (
                        <span className="inline-flex items-center gap-1 rounded bg-[#e4f5ec] px-2 py-0.5 text-xs font-medium text-success-600">
                          <CheckCircleIcon className="h-3 w-3" />
                          <span>Passed ({e.assessment.bestScorePercent}%)</span>
                        </span>
                      ) : e.assessment.attemptsUsed > 0 ? (
                        <span className="text-xs text-neutral-700">
                          {e.assessment.attemptsUsed} attempt{e.assessment.attemptsUsed === 1 ? "" : "s"} ({e.assessment.bestScorePercent ?? 0}%)
                        </span>
                      ) : (
                        <span className="text-xs text-neutral-400">Not attempted</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      {e.certificateId ? (
                        <Link
                          href={`/verify/${e.certificateId}`}
                          target="_blank"
                          className="rounded bg-accent-600 px-2.5 py-1 text-xs font-medium text-white hover:brightness-95"
                        >
                          Verify ↗
                        </Link>
                      ) : (
                        <span className="text-xs text-neutral-400">None</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
