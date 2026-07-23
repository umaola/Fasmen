import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/dal";
import { listCertificatesByStudent } from "@/lib/certificates";

export default async function CertificatesPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "student") {
    redirect("/dashboard");
  }

  const certificates = await listCertificatesByStudent(user.id);

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-primary-900">Certificates</h1>
      <p className="mt-1 text-sm text-neutral-700">
        Certificates you&apos;ve earned by passing a course assessment.
      </p>

      {certificates.length === 0 ? (
        <p className="mt-6 text-sm text-neutral-700">
          You haven&apos;t earned any certificates yet — pass a course assessment to get one.
        </p>
      ) : (
        <ul className="mt-6 flex flex-col gap-3">
          {certificates.map((certificate) => (
            <li
              key={certificate.id}
              className="flex items-center justify-between rounded-lg bg-white p-5 shadow-[0_1px_3px_rgba(18,22,28,0.08)]"
            >
              <div>
                <p className="font-medium text-neutral-900">{certificate.courseTitle}</p>
                <p className="text-sm text-neutral-700">
                  Score: {certificate.scorePercent}% · Issued{" "}
                  {new Date(certificate.issuedAt).toLocaleDateString("en-NG", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <Link
                  href={`/verify/${certificate.id}`}
                  className="h-9 rounded-md border border-primary-700 px-4 text-sm font-medium leading-9 text-primary-700 transition hover:bg-primary-100"
                >
                  View
                </Link>
                <Link
                  href={`/verify/${certificate.id}/pdf`}
                  className="h-9 rounded-md bg-primary-700 px-4 text-sm font-medium leading-9 text-white transition hover:bg-primary-900"
                >
                  Download
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
