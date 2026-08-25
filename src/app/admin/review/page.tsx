import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getCurrentUser } from "@/lib/dal";
import {
  listPendingReviewCourses,
  listLessonsByCourse,
  listAllCourses,
  type Course,
  type Lesson,
} from "@/lib/courses";
import { approveCourseAction } from "@/app/actions/courses";
import { categoryName } from "@/lib/categories";
import { formatNaira } from "@/lib/currency";
import { RejectCourseForm } from "@/app/dashboard/admin/review/RejectCourseForm";
import { ClipboardCheckIcon, CheckCircleIcon, BookIcon } from "@/components/icons";

interface CourseQueueItem {
  course: Course;
  lessons: Lesson[];
  lessonCount: number;
  videoCount: number;
  readingCount: number;
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminReviewPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    redirect("/admin/login");
  }

  const [pending, allCourses] = await Promise.all([
    listPendingReviewCourses(),
    listAllCourses(),
  ]);

  const publishedCount = allCourses.filter((c: Course) => c && c.status === "published").length;
  const draftCount = allCourses.filter((c: Course) => c && c.status === "draft").length;

  const withLessonCounts: CourseQueueItem[] = await Promise.all(
    pending.map(async (course: Course) => {
      const lessons = await listLessonsByCourse(course.id);
      return {
        course,
        lessons,
        lessonCount: lessons.length,
        videoCount: lessons.filter((l: Lesson) => l.type === "video").length,
        readingCount: lessons.filter((l: Lesson) => l.type === "reading").length,
      };
    })
  );

  return (
    <div className="mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      {/* Header & Metrics */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-neutral-200/80 pb-6">
        <div>
          <div className="flex items-center gap-2 text-primary-700 font-semibold text-xs uppercase tracking-wider mb-1">
            <ClipboardCheckIcon className="h-4 w-4" />
            <span>Course Moderation</span>
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-primary-900">
            Review Queue
          </h1>
          <p className="mt-1 text-sm text-neutral-600">
            Inspect, approve, or send constructive feedback on courses submitted by private instructors.
          </p>
        </div>

        {/* Quick Stats Pills */}
        <div className="flex items-center gap-2">
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2 text-center">
            <span className="block text-xs font-medium text-amber-800">Pending Review</span>
            <span className="font-heading text-lg font-bold text-amber-950">{pending.length}</span>
          </div>
          <div className="rounded-xl border border-success-200 bg-success-50 px-3.5 py-2 text-center">
            <span className="block text-xs font-medium text-success-800">Live Published</span>
            <span className="font-heading text-lg font-bold text-success-950">{publishedCount}</span>
          </div>
          <div className="rounded-xl border border-neutral-200 bg-white px-3.5 py-2 text-center">
            <span className="block text-xs font-medium text-neutral-600">Drafts</span>
            <span className="font-heading text-lg font-bold text-neutral-900">{draftCount}</span>
          </div>
        </div>
      </div>

      {/* Queue Content */}
      {withLessonCounts.length === 0 ? (
        <div className="mx-auto mt-12 max-w-md rounded-2xl border border-dashed border-neutral-300 bg-white p-10 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-success-50 text-success-600 mb-4">
            <CheckCircleIcon className="h-7 w-7" />
          </div>
          <h2 className="font-heading text-xl font-bold text-primary-900">Queue is Clear!</h2>
          <p className="mt-2 text-sm text-neutral-600">
            There are currently no courses waiting for review. All submissions have been approved or returned to tutors.
          </p>
          <div className="mt-6 flex justify-center">
            <Link
              href="/courses"
              target="_blank"
              className="inline-flex items-center gap-2 rounded-lg bg-primary-700 px-4 py-2 text-xs font-medium text-white transition hover:bg-primary-900"
            >
              <BookIcon className="h-4 w-4" />
              <span>Browse Live Course Catalog</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="mt-8 flex flex-col gap-6">
          {withLessonCounts.map(({ course, lessons, lessonCount, videoCount, readingCount }: CourseQueueItem) => (
            <div
              key={course.id}
              className="rounded-2xl border border-neutral-200 bg-white p-6 sm:p-7 shadow-[0_2px_8px_rgba(18,22,28,0.06)] transition hover:shadow-md"
            >
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                {/* Course Main Details */}
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2.5 mb-2">
                    <span className="rounded-full bg-primary-50 px-2.5 py-0.5 text-xs font-medium text-primary-700">
                      {categoryName(course.category)}
                    </span>
                    <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-700 capitalize">
                      {course.level} level
                    </span>
                    <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                      ⏳ Pending Decision
                    </span>
                  </div>

                  <h2 className="font-heading text-xl sm:text-2xl font-bold text-primary-900">
                    {course.title}
                  </h2>

                  <p className="mt-1 text-sm font-medium text-neutral-600">
                    Instructor: <span className="text-neutral-900 font-semibold">{course.tutorName}</span> · Pricing:{" "}
                    <span className="text-primary-800 font-bold">
                      {course.price === 0 ? "Free" : formatNaira(course.price)}
                    </span>
                  </p>

                  <p className="mt-3 text-sm text-neutral-700 leading-relaxed max-w-3xl">
                    {course.description || "No description provided."}
                  </p>

                  {/* Course Structure Metadata */}
                  <div className="mt-4 flex flex-wrap items-center gap-4 rounded-xl bg-neutral-50 border border-neutral-200/60 p-3 text-xs text-neutral-700">
                    <div className="flex items-center gap-1.5 font-medium">
                      <BookIcon className="h-4 w-4 text-primary-600" />
                      <span>{lessonCount} Total Lesson{lessonCount === 1 ? "" : "s"}</span>
                    </div>
                    <div className="flex items-center gap-1.5 font-medium text-blue-700">
                      <span>🎬 {videoCount} Video{videoCount === 1 ? "" : "s"}</span>
                    </div>
                    <div className="flex items-center gap-1.5 font-medium text-purple-700">
                      <span>📖 {readingCount} Reading Lesson{readingCount === 1 ? "" : "s"}</span>
                    </div>
                    {course.tags && course.tags.length > 0 && (
                      <div className="flex items-center gap-1 text-neutral-500">
                        <span>Tags:</span>
                        <span className="font-medium text-neutral-700">{course.tags.join(", ")}</span>
                      </div>
                    )}
                  </div>

                  {/* Lesson Preview List (Collapsible / Readable) */}
                  {lessons.length > 0 && (
                    <div className="mt-4 border-t border-neutral-100 pt-3">
                      <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                        Curriculum Outline:
                      </span>
                      <ul className="mt-2 space-y-1.5">
                        {lessons.map((lesson: Lesson, idx: number) => (
                          <li
                            key={lesson.id}
                            className="flex items-center justify-between text-xs text-neutral-700 bg-white border border-neutral-200/60 rounded-md px-3 py-1.5"
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-neutral-400 font-mono">#{idx + 1}</span>
                              <span className="font-medium text-neutral-900">{lesson.title}</span>
                            </div>
                            <span className="text-[11px] uppercase tracking-wider text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded">
                              {lesson.type}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Thumbnail & Decision Actions */}
                <div className="w-full lg:w-72 shrink-0 flex flex-col gap-4">
                  {course.thumbnailUrl ? (
                    <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-neutral-200 bg-neutral-100">
                      <Image
                        src={course.thumbnailUrl}
                        alt={course.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="flex aspect-video w-full items-center justify-center rounded-xl border border-dashed border-neutral-300 bg-neutral-50 text-neutral-400 text-xs">
                      No thumbnail uploaded
                    </div>
                  )}

                  {/* Decision CTAs */}
                  <div className="flex flex-col gap-2.5 pt-2">
                    <form action={approveCourseAction.bind(null, course.id)}>
                      <button
                        type="submit"
                        className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-success-600 font-semibold text-white shadow-sm transition hover:bg-success-700 focus:outline-none focus:ring-2 focus:ring-success-500 focus:ring-offset-2 cursor-pointer"
                      >
                        <CheckCircleIcon className="h-4 w-4" />
                        <span>Approve & Publish Live</span>
                      </button>
                    </form>

                    <div className="w-full">
                      <RejectCourseForm courseId={course.id} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
