import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/dal";
import { listAllCertificates, type Certificate } from "@/lib/certificates";
import { revokeCertificateAdminAction } from "@/app/actions/admin-management";
import { CertificateIcon, CheckCircleIcon } from "@/components/icons";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminCertificatesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    redirect("/admin/login");
  }

  const { q } = await searchParams;
  const certificates = await listAllCertificates();

  const filtered = certificates.filter((c: Certificate) => {
    if (!c) return false;
    if (q) {
      const matchId = c.id.toLowerCase().includes(q.toLowerCase());
      const matchStudent = c.studentName.toLowerCase().includes(q.toLowerCase());
      const matchCourse = c.courseTitle.toLowerCase().includes(q.toLowerCase());
      if (!matchId && !matchStudent && !matchCourse) return false;
    }
    return true;
  });

  const uniqueStudents = new Set(certificates.map((c) => c.studentId)).size;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <span className="text-xs font-semibold uppercase tracking-wider text-accent-600">
          Credential Governance
        </span>
        <h1 className="font-heading text-2xl sm:text-3xl font-bold text-primary-900 mt-1">
          Certificate Registry
        </h1>
        <p className="mt-1 text-sm text-neutral-700">
          Master registry of all verified certificates issued to graduating students across the FASMEN platform.
        </p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-lg bg-white p-5 border border-neutral-200 shadow-[0_1px_3px_rgba(18,22,28,0.08)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-700">Total Issued Certificates</span>
            <CertificateIcon className="h-5 w-5 text-primary-700" />
          </div>
          <p className="font-heading text-2xl font-bold text-primary-900 mt-2">{certificates.length}</p>
        </div>
        <div className="rounded-lg bg-white p-5 border border-neutral-200 shadow-[0_1px_3px_rgba(18,22,28,0.08)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-700">Unique Certified Learners</span>
            <CheckCircleIcon className="h-5 w-5 text-success-600" />
          </div>
          <p className="font-heading text-2xl font-bold text-success-600 mt-2">{uniqueStudents}</p>
        </div>
      </div>

      {/* Search Toolbar */}
      <div className="rounded-lg bg-white p-4 border border-neutral-200 shadow-[0_1px_3px_rgba(18,22,28,0.08)]">
        <form method="GET" className="flex gap-3 items-center">
          <input
            name="q"
            defaultValue={q || ""}
            placeholder="Search by certificate code, student name, or course title..."
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

      {/* Certificates Table */}
      {filtered.length === 0 ? (
        <div className="rounded-lg bg-white p-10 text-center border border-dashed border-neutral-200">
          <p className="text-sm text-neutral-700">No certificates match your search query.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg bg-white shadow-[0_1px_3px_rgba(18,22,28,0.08)] border border-neutral-200">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-200 text-neutral-700 text-xs font-semibold uppercase">
                <th className="px-4 py-3">Certificate ID</th>
                <th className="px-4 py-3">Student Name</th>
                <th className="px-4 py-3">Course & Instructor</th>
                <th className="px-4 py-3">Score</th>
                <th className="px-4 py-3">Issue Date</th>
                <th className="px-4 py-3 text-right">Verification & Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c: Certificate) => (
                <tr key={c.id} className="border-b border-neutral-200 last:border-0 hover:bg-neutral-50 transition">
                  <td className="px-4 py-3.5 font-mono text-xs text-primary-900 font-semibold">
                    {c.id}
                  </td>
                  <td className="px-4 py-3.5 font-medium text-neutral-900">{c.studentName}</td>
                  <td className="px-4 py-3.5">
                    <p className="font-medium text-neutral-900">{c.courseTitle}</p>
                    <p className="text-xs text-neutral-700">Taught by {c.tutorName}</p>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="inline-flex rounded-full bg-[#e4f5ec] px-2.5 py-0.5 text-xs font-bold text-success-600">
                      {c.scorePercent}%
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-xs text-neutral-700">
                    {new Date(c.issuedAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/verify/${c.id}`}
                        target="_blank"
                        className="rounded border border-primary-700 bg-white px-2.5 py-1 text-xs font-medium text-primary-700 hover:bg-primary-100/40"
                      >
                        Verify
                      </Link>

                      <Link
                        href={`/verify/${c.id}/pdf`}
                        target="_blank"
                        className="rounded bg-primary-700 px-2.5 py-1 text-xs font-medium text-white hover:bg-primary-900"
                      >
                        PDF
                      </Link>

                      <form action={revokeCertificateAdminAction.bind(null, c.id)}>
                        <button
                          type="submit"
                          className="rounded border border-error-600 px-2.5 py-1 text-xs font-medium text-error-600 hover:bg-[#fbe9e7] cursor-pointer"
                        >
                          Revoke
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
