import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/dal";
import { listCoursesByTutor } from "@/lib/courses";
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
          className="inline-flex h-11 items-center rounded-md bg-accent-600 px-6 font-medium text-white transition hover:brightness-95"
        >
          Create a course
        </Link>
      </div>

      <div className="mt-6">
        <CoursesTable courses={courses} />
      </div>
    </div>
  );
}
