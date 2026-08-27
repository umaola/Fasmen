import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/dal";
import { listCoursesByTutor } from "@/lib/courses";
import { PlusIcon } from "@/components/icons";
import { CoursesTable } from "./CoursesTable";

export default async function TutorCoursesPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "tutor") {
    redirect("/dashboard");
  }

  const isVerified = Boolean(user.tutorProfile?.verified);
  const courses = await listCoursesByTutor(user.id);

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-heading text-2xl font-bold text-primary-900">Your courses</h1>
        <Link
          href={isVerified ? "/dashboard/courses/new" : "/dashboard/account/verify"}
          aria-label="Create a course"
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-accent-600 font-medium text-white transition hover:brightness-95 sm:w-auto sm:px-6"
        >
          <PlusIcon className="h-5 w-5 sm:hidden" />
          <span className="hidden sm:inline">Create</span>
        </Link>
      </div>

      {!isVerified && (
        <div className="mt-6 rounded-lg bg-[#fcf3e1] p-5 text-sm text-warning-600">
          Complete{" "}
          <Link href="/dashboard/account/verify" className="font-medium underline">
            tutor registration
          </Link>{" "}
          to create and publish courses.
        </div>
      )}

      <div className="mt-6">
        <CoursesTable courses={courses} />
      </div>
    </div>
  );
}
