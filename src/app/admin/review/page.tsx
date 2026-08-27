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
    <div className="space-y-6">
      {/* Header & Metrics */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-accent-600">
            Moderation Workflow
          </span>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-primary-900 mt-1">
            Course Review Queue
          </h1>
          <p className="mt-1 text-sm text-neutral-700">
            Inspect curriculum quality, verify lesson materials, and approve or reject submissions from instructors.
          </p>
        </div>

        {/* Quick Stats Pills */}
        <div className="flex items-center gap-2">
          <div className="rounded-lg border border-amber-200 bg-[#fcf3e1] px-3.5 py-2 text-center shadow-sm">
            <span className="block text-xs font-medium text-warning-600">Pending Review</span>
            <span className="font-heading text-lg font-bold text-neutral-900">{pending.length}</span>
          </div>
          <div className="rounded-lg border border-neutral-200 bg-white px-3.5 py-2 text-center shadow-sm">
            <span className="block text-xs font-medium text-success-600">Live Published</span>
            <span className="font-heading text-lg font-bold text-neutral-900">{publishedCount}</span>
          </div>
          <div className="rounded-lg border border-neutral-200 bg-white px-3.5 py-2 text-center shadow-sm">
            <span className="block text-xs font-medium text-neutral-700">Drafts</span>
            <span className="font-heading text-lg font-bold text-neutral-900">{draftCount}</span>
          </div>
        </div>
      </div>

      {/* Queue Content */}
      {withLessonCounts.length === 0 ? (
        <div className="mx-auto mt-12 max-w-md rounded-lg border border-dashed border-neutral-300 bg-white p-10 text-center shadow-[0_1px_3px_rgba(18,22,28,0.08)]">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#e4f5ec] text-success-600 mb-3">
            <CheckCircleIcon className="h-6 w-6" />
          </div>
          <h2 className="font-heading text-lg font-bold text-primary-900">Review Queue is Clear</h2>
          <p className="mt-1.5 text-xs text-neutral-700">
            There are currently no courses waiting for review. All instructor submissions have been processed.
          </p>
          <div className="mt-5 flex justify-center">
            <Link
              href="/admin/courses"
              className="inline-flex items-center gap-2 rounded-md bg-primary-700 px-4 py-2 text-xs font-medium text-white transition hover:bg-primary-900"
            >
              <BookIcon className="h-4 w-4" />
              <span>Explore Course Catalog</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {withLessonCounts.map(({ course, lessons, lessonCount, videoCount, readingCount }: CourseQueueItem) => (
            <div
              key={course.id}
              className="rounded-lg border border-neutral-200 bg-white p-6 shadow-[0_1px_3px_rgba(18,22,28,0.08)]"
            >
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                {/* Course Main Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="rounded bg-primary-100 px-2.5 py-0.5 text-xs font-medium text-primary-900">
                      {categoryName(course.category)}
                    </span>
                    <span className="rounded bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-700 capitalize">
                      {course.level} level
                    </span>
                    <span className="rounded bg-[#fcf3e1] px-2.5 py-0.5 text-xs font-semibold text-warning-600">
                      ⏳ Pending Decision
                    </span>
                  </div>

                  <h2 className="font-heading text-xl font-bold text-primary-900">
                    {course.title}
                  </h2>

                  <p className="mt-1 text-sm text-neutral-700">
                    Instructor: <strong className="text-neutral-900">{course.tutorName}</strong> · Price:{" "}
                    <strong className="text-primary-900 font-heading">
                      {course.price === 0 ? "Free" : formatNaira(course.price)}
                    </strong>
                  </p>

                  <p className="mt-3 text-sm text-neutral-700 leading-relaxed">
                    {course.description || "No description provided."}
                  </p>

                  {/* Course Structure Metadata */}
                  <div className="mt-4 flex flex-wrap items-center gap-4 rounded-md bg-neutral-100 p-3 text-xs text-neutral-700">
                    <div className="flex items-center gap-1.5 font-medium">
                      <BookIcon className="h-4 w-4 text-primary-700" />
                      <span>{lessonCount} Lesson{lessonCount === 1 ? "" : "s"}</span>
                    </div>
                    <div className="flex items-center gap-1.5 font-medium">
                      <span>🎬 {videoCount} Video{videoCount === 1 ? "" : "s"}</span>
                    </div>
                    <div className="flex items-center gap-1.5 font-medium">
                      <span>📖 {readingCount} Reading{readingCount === 1 ? "" : "s"}</span>
                    </div>
                    {course.tags && course.tags.length > 0 && (
                      <div className="flex items-center gap-1 text-neutral-700">
                        <span>Tags: {course.tags.join(", ")}</span>
                      </div>
                    )}
                  </div>

                  {/* Lesson Preview List */}
                  {lessons.length > 0 && (
                    <div className="mt-4 border-t border-neutral-200 pt-3">
                      <span className="text-xs font-semibold uppercase tracking-wider text-neutral-700">
                        Curriculum Outline:
                      </span>
                      <ul className="mt-2 space-y-1.5 max-h-48 overflow-y-auto">
                        {lessons.map((lesson: Lesson, idx: number) => (
                          <li
                            key={lesson.id}
                            className="flex items-center justify-between text-xs text-neutral-700 bg-neutral-50 border border-neutral-200 rounded px-3 py-1.5"
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-neutral-400 font-mono">#{idx + 1}</span>
                              <span className="font-medium text-neutral-900">{lesson.title}</span>
                            </div>
                            <span className="text-[11px] uppercase tracking-wider text-neutral-700 bg-neutral-200 px-2 py-0.5 rounded">
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
                    <div className="relative aspect-video w-full overflow-hidden rounded-md border border-neutral-200 bg-neutral-100">
                      <Image
                        src={course.thumbnailUrl}
                        alt={course.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="flex aspect-video w-full items-center justify-center rounded-md border border-dashed border-neutral-200 bg-neutral-100 text-neutral-400 text-xs">
                      No thumbnail uploaded
                    </div>
                  )}

                  {/* Decision CTAs */}
                  <div className="flex flex-col gap-2 pt-1">
                    <form action={approveCourseAction.bind(null, course.id)}>
                      <button
                        type="submit"
                        className="flex h-10 w-full items-center justify-center gap-2 rounded-md bg-success-600 font-medium text-sm text-white shadow-sm transition hover:bg-success-700 cursor-pointer"
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
