import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/dal";
import { listCertificatesByStudent } from "@/lib/certificates";
import { CertificateIcon, LinkedInIcon, DownloadIcon, ArrowRightIcon } from "@/components/icons";
import { ShareCertificateButton } from "./ShareCertificateButton";

export default async function CertificatesPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "student") {
    redirect("/dashboard");
  }

  const certificates = await listCertificatesByStudent(user.id);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-primary-900">Certificates</h1>
          <p className="text-sm text-neutral-600">
            Verified credentials earned by completing courses and passing assessments.
          </p>
        </div>
        <Link
          href="/courses"
          className="inline-flex h-9 items-center gap-1.5 self-start rounded-lg bg-primary-900 px-4 text-xs font-semibold text-white transition hover:bg-primary-800 sm:self-auto"
        >
          <span>Earn More</span>
          <ArrowRightIcon className="h-3.5 w-3.5" />
        </Link>
      </div>

      {certificates.length === 0 ? (
        <div className="mx-auto flex w-full max-w-md flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-300 bg-white p-12 text-center shadow-sm">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-50 text-primary-700">
            <CertificateIcon className="h-7 w-7" />
          </div>
          <h2 className="font-heading mt-4 text-lg font-bold text-primary-900">
            No certificates earned yet
          </h2>
          <p className="mt-2 text-sm text-neutral-600">
            Complete all lessons in an enrolled course and pass the final assessment to receive your verified digital certificate.
          </p>
          <Link
            href="/dashboard"
            className="mt-6 inline-flex h-10 items-center gap-2 rounded-xl bg-accent-600 px-6 text-sm font-semibold text-white transition hover:brightness-105"
          >
            Continue Learning
            <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {certificates.map((certificate) => {
            const issueDate = new Date(certificate.issuedAt);
            const issueYear = issueDate.getFullYear();
            const issueMonth = issueDate.getMonth() + 1;
            const certVerifyUrl = `https://fasmen.com/verify/${certificate.id}`;
            const linkedInUrl = `https://www.linkedin.com/profile/add?startTask=CERTIFICATION_NAME&name=${encodeURIComponent(
              certificate.courseTitle
            )}&organizationName=FASMEN&issueYear=${issueYear}&issueMonth=${issueMonth}&certUrl=${encodeURIComponent(
              certVerifyUrl
            )}&certId=${certificate.id}`;

            return (
              <div
                key={certificate.id}
                className="flex flex-col justify-between gap-4 rounded-xl border border-neutral-200/80 bg-white p-6 shadow-sm transition hover:border-neutral-300 md:flex-row md:items-center"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-sm">
                    <CertificateIcon className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-heading text-base font-bold text-primary-900">
                        {certificate.courseTitle}
                      </h2>
                      <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                        Score: {certificate.scorePercent}%
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-neutral-500">
                      Credential ID: <span className="font-mono text-neutral-700">{certificate.id}</span> · Issued{" "}
                      {issueDate.toLocaleDateString("en-NG", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 border-t border-neutral-100 pt-3 md:border-t-0 md:pt-0">
                  <Link
                    href={`/verify/${certificate.id}`}
                    className="inline-flex h-9 items-center rounded-lg border border-neutral-300 bg-white px-3 text-xs font-semibold text-neutral-700 shadow-sm transition hover:bg-neutral-50 hover:text-neutral-900"
                  >
                    View
                  </Link>

                  <Link
                    href={`/verify/${certificate.id}/pdf`}
                    className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-neutral-300 bg-white px-3 text-xs font-semibold text-neutral-700 shadow-sm transition hover:bg-neutral-50 hover:text-neutral-900"
                  >
                    <DownloadIcon className="h-3.5 w-3.5" />
                    <span>PDF</span>
                  </Link>

                  <a
                    href={linkedInUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#0077b5] px-3.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#006396]"
                  >
                    <LinkedInIcon className="h-3.5 w-3.5" />
                    <span>Add to LinkedIn</span>
                  </a>

                  <ShareCertificateButton
                    certificateId={certificate.id}
                    courseTitle={certificate.courseTitle}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
