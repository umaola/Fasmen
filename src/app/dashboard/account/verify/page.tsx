import Link from "next/link";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/authz";
import { uploadVerificationPhotoAction } from "@/app/actions/kyc";
import { ProfilePhotoUpload } from "@/components/ProfilePhotoUpload";
import { VerificationForm } from "./VerificationForm";

export default async function VerifyIdentityPage() {
  const user = await requireRole("tutor");
  if (!user) {
    redirect("/dashboard");
  }

  const tutorProfile = user.tutorProfile;

  return (
    <div>
      <h2 className="font-heading text-lg font-semibold text-primary-900">Verify identity</h2>
      <p className="mt-1 text-sm text-neutral-700">
        A couple of quick details and you&apos;ll have a shareable portfolio page students can
        visit to see your courses.
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

      <div className="mt-4">
        <ProfilePhotoUpload
          action={uploadVerificationPhotoAction}
          photoURL={user.photoURL}
          fieldName="photo"
        />
      </div>

      <VerificationForm
        idType={tutorProfile?.idType ?? null}
        idNumber={tutorProfile?.idNumber ?? null}
        bio={user.bio ?? ""}
        username={tutorProfile?.username ?? null}
        verified={tutorProfile?.verified ?? false}
      />
    </div>
  );
}
