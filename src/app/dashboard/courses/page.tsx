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

  const courses = await listCoursesByTutor(user.id);

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-heading text-2xl font-bold text-primary-900">Your courses</h1>
        <Link
          href="/dashboard/courses/new"
          aria-label="Create a course"
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-accent-600 font-medium text-white transition hover:brightness-95 sm:w-auto sm:px-6"
        >
          <PlusIcon className="h-5 w-5 sm:hidden" />
          <span className="hidden sm:inline">Create a course</span>
        </Link>
      </div>

      <div className="mt-6">
        <CoursesTable courses={courses} />
      </div>
    </div>
  );
}
