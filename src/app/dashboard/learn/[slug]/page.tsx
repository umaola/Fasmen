import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { requireRole } from "@/lib/authz";
import { findCourseBySlug, listLessonsByCourse } from "@/lib/courses";
import { findEnrollment } from "@/lib/enrollments";
import { completeLessonAction } from "@/app/actions/progress";
import { getBunnyEmbedUrl } from "@/lib/bunny";
import { formatDuration } from "@/lib/format";

export default async function LearnPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await requireRole("student");
  if (!user) {
    redirect("/login");
  }

  const course = await findCourseBySlug(slug);
  if (!course) {
    notFound();
  }

  const enrollment = await findEnrollment(user.id, course.id);
  if (!enrollment) {
    redirect(`/courses/${slug}`);
  }

  const lessons = await listLessonsByCourse(course.id);
  const percentComplete = enrollment.progress.percentComplete;
  const allComplete = lessons.length > 0 && enrollment.progress.completedLessonIds.length === lessons.length;

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/dashboard" className="text-sm font-medium text-primary-700">
        ← My courses
      </Link>
      <h1 className="font-heading mt-2 text-2xl font-bold text-primary-900">{course.title}</h1>

      <div className="mt-6">
        <div className="flex items-center justify-between text-sm">
          <span className="text-neutral-700">
            You&apos;re {percentComplete}% through this course
          </span>
        </div>
        <div className="mt-2 h-2 w-full rounded-full bg-neutral-200">
          <div
            className="h-2 rounded-full bg-primary-500"
            style={{ width: `${percentComplete}%` }}
          />
        </div>
      </div>

      <ul className="mt-6 flex flex-col gap-3">
        {lessons.map((lesson, index) => {
          const completed = enrollment.progress.completedLessonIds.includes(lesson.id);
          return (
            <li
              key={lesson.id}
              className="rounded-lg bg-white p-4 shadow-[0_1px_3px_rgba(18,22,28,0.08)]"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-neutral-900">
                  {index + 1}. {lesson.title}
                  {lesson.type === "video" && lesson.videoDurationSeconds ? (
                    <span className="ml-2 text-xs font-normal text-neutral-500">
                      · {formatDuration(lesson.videoDurationSeconds)}
                    </span>
                  ) : null}
                </span>
                {completed ? (
                  <span className="rounded-full bg-[#e4f5ec] px-2 py-0.5 text-xs font-medium text-success-600">
                    Completed
                  </span>
                ) : (
                  <form action={completeLessonAction.bind(null, course.id, slug, lesson.id)}>
                    <button
                      type="submit"
                      className="h-8 rounded-md border border-primary-700 px-3 text-xs font-medium text-primary-700 transition hover:bg-primary-100"
                    >
                      Mark complete
                    </button>
                  </form>
                )}
              </div>
              {lesson.type === "video" &&
                (lesson.videoGuid ? (
                  <div className="mt-3 aspect-video w-full overflow-hidden rounded-md">
                    <iframe
                      src={getBunnyEmbedUrl(lesson.videoGuid)}
                      loading="lazy"
                      allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
                      allowFullScreen
                      className="h-full w-full border-0"
                    />
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-neutral-700">
                    This lesson&apos;s video hasn&apos;t been uploaded yet.
                  </p>
                ))}
              {lesson.content && (
                <p className="mt-3 whitespace-pre-line text-sm text-neutral-700">
                  {lesson.content}
                </p>
              )}
            </li>
          );
        })}
      </ul>

      <div className="mt-8 rounded-lg bg-white p-6 shadow-[0_1px_3px_rgba(18,22,28,0.08)]">
        <h2 className="font-heading text-lg font-semibold text-primary-900">Assessment</h2>
        {allComplete ? (
          <>
            {enrollment.assessment.passed ? (
              <p className="mt-2 text-sm text-success-600">
                You passed with {enrollment.assessment.bestScorePercent}%.
              </p>
            ) : (
              <p className="mt-2 text-sm text-neutral-700">
                You&apos;ve completed all the lessons — take the assessment when you&apos;re ready.
              </p>
            )}
            <Link
              href={`/dashboard/learn/${slug}/assessment`}
              className="mt-3 inline-flex h-10 items-center rounded-md border border-primary-700 px-5 text-sm font-medium text-primary-700 transition hover:bg-primary-100"
            >
              {enrollment.assessment.passed ? "View result" : "Take assessment"}
            </Link>
          </>
        ) : (
          <p className="mt-2 text-sm text-neutral-700">
            Complete all lessons to unlock the course assessment.
          </p>
        )}
      </div>
    </div>
  );
}
