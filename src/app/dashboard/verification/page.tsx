import Link from "next/link";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/authz";
import { VerificationForm } from "./VerificationForm";

export default async function VerificationPage() {
  const user = await requireRole("tutor");
  if (!user) {
    redirect("/dashboard");
  }

  const tutorProfile = user.tutorProfile;

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="font-heading text-2xl font-bold text-primary-900">
        Get your public portfolio link
      </h1>
      <p className="mt-1 text-sm text-neutral-700">
        A couple of quick details and you&apos;ll have a shareable page students can visit to see
        your courses.
      </p>

      {tutorProfile?.verified && tutorProfile.username && (
        <div className="mt-4 rounded-md bg-primary-100 px-4 py-3 text-sm">
          <span className="text-primary-900">Your portfolio is live: </span>
          <Link
            href={`/tutors/${tutorProfile.username}`}
            className="font-medium text-primary-700 hover:underline"
          >
            /tutors/{tutorProfile.username}
          </Link>
        </div>
      )}

      <VerificationForm
        idType={tutorProfile?.idType ?? null}
        idNumber={tutorProfile?.idNumber ?? null}
        bio={user.bio ?? ""}
        username={tutorProfile?.username ?? null}
      />
    </div>
  );
}
