import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/dal";
import { ShieldCheckIcon } from "@/components/icons";
import { NewCourseForm } from "./NewCourseForm";

export default async function NewCoursePage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "tutor") {
    redirect("/dashboard");
  }

  if (!user.tutorProfile?.verified) {
    return (
      <div className="mx-auto max-w-lg rounded-lg bg-white p-8 text-center shadow-[0_1px_3px_rgba(18,22,28,0.08)]">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent-100 text-accent-600">
          <ShieldCheckIcon className="h-7 w-7" />
        </div>
        <h1 className="font-heading mt-4 text-xl font-bold text-primary-900">
          Complete registration required
        </h1>
        <p className="mt-2 text-sm text-neutral-700">
          You need to complete your tutor verification and profile details before you can create
          courses on FASMEN.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/dashboard/account/verify"
            className="inline-flex h-11 items-center justify-center rounded-md bg-primary-700 px-6 font-medium text-white transition hover:bg-primary-900"
          >
            Complete registration
          </Link>
          <Link
            href="/dashboard/courses"
            className="inline-flex h-11 items-center justify-center rounded-md border border-neutral-200 px-6 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100"
          >
            Back to courses
          </Link>
        </div>
      </div>
    );
  }

  return <NewCourseForm />;
}
