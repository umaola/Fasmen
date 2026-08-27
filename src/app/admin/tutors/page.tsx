import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/dal";
import { listAllTutors, type UserProfile } from "@/lib/users";
import { listAllCourses, type Course } from "@/lib/courses";
import { verifyTutorAdminAction } from "@/app/actions/admin-management";
import { UserCircleIcon, CheckCircleIcon } from "@/components/icons";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminTutorsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; verified?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    redirect("/admin/login");
  }

  const { q, verified } = await searchParams;
  const [tutors, courses] = await Promise.all([listAllTutors(), listAllCourses()]);

  const courseCountByTutor = new Map<string, number>();
  for (const c of courses) {
    if (!c) continue;
    courseCountByTutor.set(c.tutorId, (courseCountByTutor.get(c.tutorId) || 0) + 1);
  }

  const filtered = tutors.filter((t: UserProfile) => {
    if (!t) return false;
    if (q) {
      const matchName = t.displayName.toLowerCase().includes(q.toLowerCase());
      const matchEmail = t.email.toLowerCase().includes(q.toLowerCase());
      if (!matchName && !matchEmail) return false;
    }
    if (verified === "true" && !t.tutorProfile?.verified) return false;
    if (verified === "false" && t.tutorProfile?.verified) return false;
    return true;
  });

  const verifiedCount = tutors.filter((t: UserProfile) => t.tutorProfile?.verified).length;
  const unverifiedCount = tutors.length - verifiedCount;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <span className="text-xs font-semibold uppercase tracking-wider text-accent-600">
          Faculty Management
        </span>
        <h1 className="font-heading text-2xl sm:text-3xl font-bold text-primary-900 mt-1">
          Instructors & ID Verification
        </h1>
        <p className="mt-1 text-sm text-neutral-700">
          Review government ID verification requests, inspect banking credentials, and manage teaching rights.
        </p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-lg bg-white p-5 border border-neutral-200 shadow-[0_1px_3px_rgba(18,22,28,0.08)]">
          <span className="text-xs font-medium text-neutral-700">Total Registered Instructors</span>
          <p className="font-heading text-2xl font-bold text-primary-900 mt-1">{tutors.length}</p>
        </div>
        <div className="rounded-lg bg-white p-5 border border-neutral-200 shadow-[0_1px_3px_rgba(18,22,28,0.08)]">
          <span className="text-xs font-medium text-neutral-700">Verified & Active</span>
          <p className="font-heading text-2xl font-bold text-success-600 mt-1">{verifiedCount}</p>
        </div>
        <div className="rounded-lg bg-white p-5 border border-neutral-200 shadow-[0_1px_3px_rgba(18,22,28,0.08)]">
          <span className="text-xs font-medium text-neutral-700">Pending ID Verification</span>
          <p className="font-heading text-2xl font-bold text-warning-600 mt-1">{unverifiedCount}</p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="rounded-lg bg-white p-4 border border-neutral-200 shadow-[0_1px_3px_rgba(18,22,28,0.08)]">
        <form method="GET" className="flex flex-col sm:flex-row gap-3 items-center">
          <input
            name="q"
            defaultValue={q || ""}
            placeholder="Search by instructor name or email..."
            className="h-10 w-full sm:flex-1 rounded-md border border-neutral-200 px-3.5 text-sm outline-none transition focus:border-primary-500"
          />

          <select
            name="verified"
            defaultValue={verified || "all"}
            className="h-10 w-full sm:w-48 rounded-md border border-neutral-200 px-3 text-sm bg-white outline-none focus:border-primary-500"
          >
            <option value="all">All Verification Status</option>
            <option value="true">Verified Only</option>
            <option value="false">Unverified / Pending</option>
          </select>

          <button
            type="submit"
            className="h-10 w-full sm:w-auto rounded-md bg-primary-700 px-5 text-sm font-medium text-white transition hover:bg-primary-900"
          >
            Filter
          </button>
        </form>
      </div>

      {/* Instructors Table */}
      {filtered.length === 0 ? (
        <div className="rounded-lg bg-white p-10 text-center border border-dashed border-neutral-200">
          <p className="text-sm text-neutral-700">No instructors match your search criteria.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg bg-white shadow-[0_1px_3px_rgba(18,22,28,0.08)] border border-neutral-200">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-200 text-neutral-700 text-xs font-semibold uppercase">
                <th className="px-4 py-3">Instructor</th>
                <th className="px-4 py-3">ID Verification</th>
                <th className="px-4 py-3">Government Document</th>
                <th className="px-4 py-3">Payout Account</th>
                <th className="px-4 py-3">Courses</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t: UserProfile) => {
                const isVerified = Boolean(t.tutorProfile?.verified);
                const count = courseCountByTutor.get(t.id) || 0;
                const payout = t.tutorProfile?.payoutAccount;

                return (
                  <tr key={t.id} className="border-b border-neutral-200 last:border-0 hover:bg-neutral-50 transition">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-100 text-primary-700 font-semibold text-xs shrink-0">
                          {t.displayName.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-neutral-900">{t.displayName}</p>
                          <p className="text-xs text-neutral-700">{t.email}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      {isVerified ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#e4f5ec] px-2.5 py-0.5 text-xs font-medium text-success-600">
                          <CheckCircleIcon className="h-3 w-3" />
                          <span>Verified</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-[#fcf3e1] px-2.5 py-0.5 text-xs font-medium text-warning-600">
                          Pending ID
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3.5">
                      {t.tutorProfile?.idType ? (
                        <div>
                          <span className="font-medium text-neutral-900 uppercase text-xs">
                            {t.tutorProfile.idType.replace("-", " ")}
                          </span>
                          <p className="text-xs text-neutral-700 font-mono">
                            {t.tutorProfile.idNumber ? `••••${t.tutorProfile.idNumber.slice(-4)}` : "Submitted"}
                          </p>
                        </div>
                      ) : (
                        <span className="text-xs text-neutral-700">Not submitted</span>
                      )}
                    </td>

                    <td className="px-4 py-3.5">
                      {payout ? (
                        <div>
                          <p className="text-xs font-medium text-neutral-900">{payout.bankName}</p>
                          <p className="text-xs text-neutral-700">••••{payout.accountNumberLast4}</p>
                        </div>
                      ) : (
                        <span className="text-xs text-neutral-700">No bank linked</span>
                      )}
                    </td>

                    <td className="px-4 py-3.5">
                      <span className="font-medium text-neutral-900">{count}</span>
                      <span className="text-xs text-neutral-700"> course{count === 1 ? "" : "s"}</span>
                    </td>

                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {t.tutorProfile?.username && (
                          <Link
                            href={`/tutors/${t.tutorProfile.username}`}
                            target="_blank"
                            className="rounded border border-neutral-200 px-2.5 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-100"
                          >
                            Portfolio
                          </Link>
                        )}

                        {!isVerified ? (
                          <form action={verifyTutorAdminAction.bind(null, t.id, true)}>
                            <button
                              type="submit"
                              className="rounded bg-success-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-success-700 cursor-pointer"
                            >
                              Approve
                            </button>
                          </form>
                        ) : (
                          <form action={verifyTutorAdminAction.bind(null, t.id, false)}>
                            <button
                              type="submit"
                              className="rounded border border-error-600 px-2.5 py-1 text-xs font-medium text-error-600 hover:bg-[#fbe9e7] cursor-pointer"
                            >
                              Revoke
                            </button>
                          </form>
                        )}
                      </div>
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
