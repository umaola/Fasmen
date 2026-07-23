import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/dal";
import { SettingsForm } from "./SettingsForm";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "tutor") {
    redirect("/dashboard");
  }

  const tutorProfile = user.tutorProfile;

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-primary-900">Profile</h1>
      <p className="mt-1 text-sm text-neutral-700">
        Your name and bio are shown to students on your course pages.
      </p>

      <div className="mt-4 max-w-xl rounded-md bg-primary-100 px-4 py-3 text-sm">
        {tutorProfile?.verified && tutorProfile.username ? (
          <>
            <span className="text-primary-900">Your portfolio: </span>
            <Link href={`/tutors/${tutorProfile.username}`} className="font-medium text-primary-700 hover:underline">
              /tutors/{tutorProfile.username}
            </Link>
            <span className="text-neutral-700"> · </span>
            <Link href="/dashboard/verification" className="font-medium text-primary-700 hover:underline">
              Manage
            </Link>
          </>
        ) : (
          <>
            <span className="text-primary-900">You don&apos;t have a public portfolio yet. </span>
            <Link href="/dashboard/verification" className="font-medium text-primary-700 hover:underline">
              Complete verification
            </Link>
          </>
        )}
      </div>

      <SettingsForm displayName={user.displayName} bio={user.bio ?? ""} />
    </div>
  );
}
