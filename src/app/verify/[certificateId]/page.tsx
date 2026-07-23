import Link from "next/link";
import { notFound } from "next/navigation";
import { findCertificateById } from "@/lib/certificates";

export default async function VerifyCertificatePage({
  params,
}: {
  params: Promise<{ certificateId: string }>;
}) {
  const { certificateId } = await params;
  const certificate = await findCertificateById(certificateId);

  if (!certificate) {
    notFound();
  }

  return (
    <main className="flex-1 px-6 py-12">
      <div className="mx-auto max-w-2xl">
        <div className="rounded-lg border-2 border-primary-900 p-1">
          <div className="rounded-md border border-accent-600 px-8 py-12 text-center">
            <p className="font-heading text-sm font-semibold tracking-wide text-primary-900 uppercase">
              Certificate of completion
            </p>
            <p className="mt-6 text-sm text-neutral-700">This certifies that</p>
            <p className="font-heading mt-2 text-3xl font-bold text-primary-900">
              {certificate.studentName}
            </p>
            <p className="mt-4 text-sm text-neutral-700">has successfully completed</p>
            <p className="font-heading mt-2 text-2xl font-bold text-accent-600">
              {certificate.courseTitle}
            </p>
            <p className="mt-4 text-sm text-neutral-700">
              Instructor: {certificate.tutorName} · Score: {certificate.scorePercent}% · Issued:{" "}
              {new Date(certificate.issuedAt).toLocaleDateString("en-NG", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>

            <div className="mt-8 rounded-md bg-primary-100 px-4 py-3">
              <p className="text-xs font-medium text-primary-900">Verification code</p>
              <p className="font-mono text-sm text-primary-900">{certificate.id}</p>
            </div>

            <Link
              href={`/verify/${certificate.id}/pdf`}
              className="mt-6 inline-flex h-11 items-center rounded-md bg-primary-700 px-6 font-medium text-white transition hover:bg-primary-900"
            >
              Download PDF
            </Link>
          </div>
        </div>

        <p className="mt-6 text-center text-sm text-neutral-700">
          This certificate is independently verifiable at this URL — anyone can confirm its
          authenticity by visiting <span className="font-medium text-primary-900">/verify/{certificate.id}</span>.
        </p>
      </div>
    </main>
  );
}
