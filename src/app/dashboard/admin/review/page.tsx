import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/dal";
import { listPendingReviewCourses, listLessonsByCourse } from "@/lib/courses";
import { approveCourseAction } from "@/app/actions/courses";
import { categoryName } from "@/lib/categories";
import { RejectCourseForm } from "./RejectCourseForm";

export default async function AdminReviewPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    redirect("/dashboard");
  }

  const pending = await listPendingReviewCourses();
  const withLessonCounts = await Promise.all(
    pending.map(async (course) => ({
      course,
      lessonCount: (await listLessonsByCourse(course.id)).length,
    }))
  );

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-heading text-2xl font-bold text-primary-900">Course review queue</h1>
      <p className="mt-1 text-sm text-neutral-700">
        {pending.length} course{pending.length === 1 ? "" : "s"} waiting for a decision.
      </p>

      {withLessonCounts.length === 0 ? (
        <div className="mx-auto mt-10 max-w-md rounded-lg border border-dashed border-neutral-200 bg-white p-10 text-center">
          <h2 className="font-heading text-lg font-semibold text-primary-900">All caught up</h2>
          <p className="mt-2 text-sm text-neutral-700">No courses are waiting for review.</p>
        </div>
      ) : (
        <ul className="mt-8 flex flex-col gap-4">
          {withLessonCounts.map(({ course, lessonCount }) => (
            <li
              key={course.id}
              className="rounded-lg bg-white p-5 shadow-[0_1px_3px_rgba(18,22,28,0.08)]"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-heading text-lg font-semibold text-primary-900">
                    {course.title}
                  </h3>
                  <p className="mt-1 text-sm text-neutral-700">
                    by {course.tutorName} · {categoryName(course.category)} · {lessonCount} lesson
                    {lessonCount === 1 ? "" : "s"}
                  </p>
                  <p className="mt-2 text-sm text-neutral-700">{course.description}</p>
                </div>
                <form action={approveCourseAction.bind(null, course.id)}>
                  <button
                    type="submit"
                    className="h-10 shrink-0 rounded-md bg-success-600 px-5 text-sm font-medium text-white transition hover:brightness-95"
                  >
                    Approve
                  </button>
                </form>
              </div>

              <div className="mt-4 flex justify-end">
                <RejectCourseForm courseId={course.id} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
