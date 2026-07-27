import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/dal";
import { listEnrollmentsByStudent } from "@/lib/enrollments";
import { listCertificatesByStudent } from "@/lib/certificates";
import { SettingsForm } from "./SettingsForm";
import { StudentProfileForm } from "./StudentProfileForm";

export default async function AccountProfilePage() {
  const user = await getCurrentUser();
  if (!user || (user.role !== "tutor" && user.role !== "student")) {
    redirect("/dashboard");
  }

  if (user.role === "student") {
    const [enrollments, certificates] = await Promise.all([
      listEnrollmentsByStudent(user.id),
      listCertificatesByStudent(user.id),
    ]);
    const memberSince = new Date(user.createdAt).toLocaleDateString("en-NG", {
      month: "long",
      year: "numeric",
    });

    return (
      <div>
        <div className="-mx-6 -mt-10 h-32 bg-gradient-to-br from-primary-700 to-primary-900 sm:h-40" />

        <StudentProfileForm displayName={user.displayName} photoURL={user.photoURL} />

        <p className="mt-2 text-center text-sm text-neutral-700">
          {user.email} &middot; Member since {memberSince}
        </p>

        <div className="mx-auto mt-8 grid max-w-sm grid-cols-2 gap-4">
          <div className="rounded-xl bg-white p-5 text-center shadow-[0_1px_3px_rgba(18,22,28,0.08)] sm:text-left">
            <p className="font-heading text-3xl font-bold text-primary-900">
              {enrollments.length}
            </p>
            <p className="mt-1 text-sm text-neutral-700">
              {enrollments.length === 1 ? "Course enrolled" : "Courses enrolled"}
            </p>
          </div>
          <div className="rounded-xl bg-white p-5 text-center shadow-[0_1px_3px_rgba(18,22,28,0.08)] sm:text-left">
            <p className="font-heading text-3xl font-bold text-accent-600">
              {certificates.length}
            </p>
            <p className="mt-1 text-sm text-neutral-700">
              {certificates.length === 1 ? "Certificate earned" : "Certificates earned"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const tutorProfile = user.tutorProfile;

  return (
    <div>
      <h2 className="font-heading text-lg font-semibold text-primary-900">Profile</h2>
      <p className="mt-1 text-sm text-neutral-700">
        Your name and bio are shown to students on your course pages.
      </p>

      <div className="mt-4 rounded-md bg-primary-100 px-4 py-3 text-sm">
        {tutorProfile?.verified && tutorProfile.username ? (
          <>
            <span className="text-primary-900">Your portfolio: </span>
            <Link
              href={`/tutors/${tutorProfile.username}`}
              className="font-medium text-primary-700 hover:underline"
            >
              /tutors/{tutorProfile.username}
            </Link>
            <span className="text-neutral-700"> · </span>
            <Link
              href="/dashboard/account/verify"
              className="font-medium text-primary-700 hover:underline"
            >
              Manage
            </Link>
          </>
        ) : (
          <>
            <span className="text-primary-900">You don&apos;t have a public portfolio yet. </span>
            <Link
              href="/dashboard/account/verify"
              className="font-medium text-primary-700 hover:underline"
            >
              Complete verification
            </Link>
          </>
        )}
      </div>

      <SettingsForm displayName={user.displayName} bio={user.bio ?? ""} />
    </div>
  );
}
