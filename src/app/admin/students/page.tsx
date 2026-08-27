import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/dal";
import { listAllStudents, type UserProfile } from "@/lib/users";
import { listAllEnrollments, type Enrollment } from "@/lib/enrollments";
import { listAllCertificates, type Certificate } from "@/lib/certificates";
import { resetStudentQuizAttemptsAdminAction } from "@/app/actions/admin-management";
import { UserCircleIcon, CheckCircleIcon } from "@/components/icons";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminStudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    redirect("/admin/login");
  }

  const { q } = await searchParams;
  const [students, enrollments, certificates] = await Promise.all([
    listAllStudents(),
    listAllEnrollments(),
    listAllCertificates(),
  ]);

  const enrollmentsByStudent = new Map<string, Enrollment[]>();
  for (const e of enrollments) {
    const list = enrollmentsByStudent.get(e.studentId) || [];
    list.push(e);
    enrollmentsByStudent.set(e.studentId, list);
  }

  const certificatesByStudent = new Map<string, Certificate[]>();
  for (const c of certificates) {
    const list = certificatesByStudent.get(c.studentId) || [];
    list.push(c);
    certificatesByStudent.set(c.studentId, list);
  }

  const filtered = students.filter((s: UserProfile) => {
    if (!s) return false;
    if (q) {
      const matchName = s.displayName.toLowerCase().includes(q.toLowerCase());
      const matchEmail = s.email.toLowerCase().includes(q.toLowerCase());
      if (!matchName && !matchEmail) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <span className="text-xs font-semibold uppercase tracking-wider text-accent-600">
          Learner Management
        </span>
        <h1 className="font-heading text-2xl sm:text-3xl font-bold text-primary-900 mt-1">
          Student Directory & Progress
        </h1>
        <p className="mt-1 text-sm text-neutral-700">
          Search registered students, inspect course completion rates, and reset exhausted assessment attempts.
        </p>
      </div>

      {/* Metric Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-lg bg-white p-5 border border-neutral-200 shadow-[0_1px_3px_rgba(18,22,28,0.08)]">
          <span className="text-xs font-medium text-neutral-700">Registered Students</span>
          <p className="font-heading text-2xl font-bold text-primary-900 mt-1">{students.length}</p>
        </div>
        <div className="rounded-lg bg-white p-5 border border-neutral-200 shadow-[0_1px_3px_rgba(18,22,28,0.08)]">
          <span className="text-xs font-medium text-neutral-700">Active Course Enrollments</span>
          <p className="font-heading text-2xl font-bold text-primary-700 mt-1">{enrollments.length}</p>
        </div>
        <div className="rounded-lg bg-white p-5 border border-neutral-200 shadow-[0_1px_3px_rgba(18,22,28,0.08)]">
          <span className="text-xs font-medium text-neutral-700">Certificates Earned</span>
          <p className="font-heading text-2xl font-bold text-success-600 mt-1">{certificates.length}</p>
        </div>
      </div>

      {/* Search Toolbar */}
      <div className="rounded-lg bg-white p-4 border border-neutral-200 shadow-[0_1px_3px_rgba(18,22,28,0.08)]">
        <form method="GET" className="flex gap-3 items-center">
          <input
            name="q"
            defaultValue={q || ""}
            placeholder="Search by student name or email address..."
            className="h-10 flex-1 rounded-md border border-neutral-200 px-3.5 text-sm outline-none transition focus:border-primary-500"
          />
          <button
            type="submit"
            className="h-10 rounded-md bg-primary-700 px-5 text-sm font-medium text-white transition hover:bg-primary-900"
          >
            Search
          </button>
        </form>
      </div>

      {/* Students Card / Table List */}
      {filtered.length === 0 ? (
        <div className="rounded-lg bg-white p-10 text-center border border-dashed border-neutral-200">
          <p className="text-sm text-neutral-700">No students match your query.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((s: UserProfile) => {
            const studentEnrollments = enrollmentsByStudent.get(s.id) || [];
            const studentCertificates = certificatesByStudent.get(s.id) || [];

            return (
              <div
                key={s.id}
                className="rounded-lg bg-white p-5 border border-neutral-200 shadow-[0_1px_3px_rgba(18,22,28,0.08)]"
              >
                {/* Student Info Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-200 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-primary-700 font-bold text-sm">
                      {s.displayName.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h2 className="font-heading text-base font-bold text-primary-900">{s.displayName}</h2>
                      <p className="text-xs text-neutral-700">
                        {s.email} · Member since {new Date(s.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-neutral-700">
                    <span className="rounded bg-neutral-100 px-2 py-1 font-medium text-neutral-900">
                      {studentEnrollments.length} Enrollment{studentEnrollments.length === 1 ? "" : "s"}
                    </span>
                    <span className="rounded bg-[#e4f5ec] px-2 py-1 font-medium text-success-600">
                      {studentCertificates.length} Certificate{studentCertificates.length === 1 ? "" : "s"}
                    </span>
                  </div>
                </div>

                {/* Enrolled Courses & Attempts Breakdown */}
                {studentEnrollments.length === 0 ? (
                  <p className="text-xs text-neutral-700 mt-3 italic">No active enrollments yet.</p>
                ) : (
                  <div className="mt-3 space-y-2.5">
                    {studentEnrollments.map((e: Enrollment) => (
                      <div
                        key={e.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-md bg-neutral-100 p-3 text-xs"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-neutral-900 truncate">{e.courseTitle}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="h-1.5 w-28 rounded-full bg-neutral-200 overflow-hidden">
                              <div
                                className="h-full bg-primary-500 rounded-full"
                                style={{ width: `${e.progress.percentComplete}%` }}
                              />
                            </div>
                            <span className="text-neutral-700 font-medium">{e.progress.percentComplete}% done</span>
                          </div>
                        </div>

                        {/* Assessment Details & Reset Action */}
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <span className="block text-neutral-700">
                              Quiz Attempts: <strong className="text-neutral-900">{e.assessment.attemptsUsed}</strong>
                            </span>
                            {e.assessment.passed ? (
                              <span className="text-success-600 font-medium">Passed ({e.assessment.bestScorePercent}%)</span>
                            ) : (
                              <span className="text-neutral-700">
                                Best: {e.assessment.bestScorePercent !== null ? `${e.assessment.bestScorePercent}%` : "Not taken"}
                              </span>
                            )}
                          </div>

                          {e.assessment.attemptsUsed > 0 && (
                            <form action={resetStudentQuizAttemptsAdminAction.bind(null, s.id, e.courseId)}>
                              <button
                                type="submit"
                                className="rounded border border-neutral-300 bg-white px-2.5 py-1 text-[11px] font-medium text-neutral-700 hover:bg-neutral-50 hover:text-primary-700 transition cursor-pointer"
                              >
                                Reset Quiz Retries
                              </button>
                            </form>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
