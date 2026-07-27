import Link from "next/link";
import { notFound } from "next/navigation";
import { findCourseBySlug, listLessonsByCourse, DUMMY_VIDEO_SRC } from "@/lib/courses";
import { categoryName } from "@/lib/categories";
import { findUserById } from "@/lib/users";
import { getCurrentUser } from "@/lib/dal";
import { findEnrollment } from "@/lib/enrollments";
import { enrollInCourse } from "@/app/actions/enrollments";
import { listReviewsByCourse, findReviewByStudentAndCourse } from "@/lib/reviews";
import { deleteReviewAction } from "@/app/actions/reviews";
import { ReviewForm } from "./ReviewForm";

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const course = await findCourseBySlug(slug);

  if (!course || course.status !== "published") {
    notFound();
  }

  const [lessons, tutor, user] = await Promise.all([
    listLessonsByCourse(course.id),
    findUserById(course.tutorId),
    getCurrentUser(),
  ]);

  const enrollment =
    user?.role === "student" ? await findEnrollment(user.id, course.id) : undefined;

  const [reviews, myReview] = await Promise.all([
    listReviewsByCourse(course.id),
    user?.role === "student" ? findReviewByStudentAndCourse(user.id, course.id) : undefined,
  ]);

  return (
    <main className="flex-1 px-6 py-12">
      <div className="mx-auto max-w-3xl">
        <Link href="/courses" className="text-sm font-medium text-primary-700">
          ← Back to catalog
        </Link>

        {course.thumbnailUrl && (
          <div className="mt-4 aspect-video w-full overflow-hidden rounded-lg bg-primary-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={course.thumbnailUrl}
              alt={course.title}
              className="h-full w-full object-cover"
            />
          </div>
        )}

        <div className="mt-4 flex items-start justify-between gap-6">
          <div>
            <span className="inline-flex rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-700">
              {categoryName(course.category)}
            </span>
            <h1 className="font-heading mt-2 text-3xl font-bold text-primary-900">
              {course.title}
            </h1>
            <p className="mt-2 text-neutral-700">
              by {course.tutorName} · {course.level} · {lessons.length} lesson
              {lessons.length === 1 ? "" : "s"}
            </p>
            <p className="mt-1 text-sm text-neutral-700">
              {course.reviewCount > 0
                ? `★ ${course.averageRating.toFixed(1)} (${course.reviewCount} reviews)`
                : "No reviews yet"}
            </p>
          </div>

          <div className="shrink-0 text-right">
            <p className="font-heading text-2xl font-bold text-primary-900">
              {(course.price / 100).toLocaleString("en-NG", {
                style: "currency",
                currency: "NGN",
                maximumFractionDigits: 0,
              })}
            </p>
            {!user && (
              <Link
                href="/login"
                className="mt-3 inline-flex h-11 items-center rounded-md bg-primary-700 px-6 font-medium text-white transition hover:bg-primary-900"
              >
                Log in to enroll
              </Link>
            )}
            {user?.role === "student" && !enrollment && (
              <form action={enrollInCourse.bind(null, course.id)}>
                <button
                  type="submit"
                  className="mt-3 h-11 rounded-md bg-primary-700 px-6 font-medium text-white transition hover:bg-primary-900"
                >
                  Enroll
                </button>
              </form>
            )}
            {user?.role === "student" && enrollment && (
              <Link
                href={`/dashboard/learn/${course.slug}`}
                className="mt-3 inline-flex h-11 items-center rounded-md border border-primary-700 px-6 font-medium text-primary-700 transition hover:bg-primary-100"
              >
                Continue learning
              </Link>
            )}
            {user && user.role !== "student" && (
              <button
                disabled
                title="Only student accounts can enroll"
                className="mt-3 h-11 rounded-md bg-primary-700 px-6 font-medium text-white opacity-50"
              >
                Enroll
              </button>
            )}
          </div>
        </div>

        <p className="mt-6 whitespace-pre-line text-neutral-700">{course.description}</p>

        <h2 className="font-heading mt-10 text-lg font-semibold text-primary-900">Curriculum</h2>
        <ul className="mt-4 flex flex-col gap-3">
          {lessons.map((lesson, index) => (
            <li key={lesson.id} className="rounded-lg bg-white p-4 shadow-[0_1px_3px_rgba(18,22,28,0.08)]">
              <div className="flex items-center justify-between">
                <span className="font-medium text-neutral-900">
                  {index + 1}. {lesson.title}
                </span>
                {lesson.isPreview ? (
                  <span className="rounded-full bg-primary-100 px-2 py-0.5 text-xs font-medium text-primary-700">
                    Free preview
                  </span>
                ) : (
                  <span className="text-xs text-neutral-400">Locked until enrolled</span>
                )}
              </div>
              {lesson.isPreview && lesson.type === "video" && (
                <video controls className="mt-3 w-full rounded-md" src={DUMMY_VIDEO_SRC} />
              )}
              {lesson.isPreview && (
                <p className="mt-3 whitespace-pre-line text-sm text-neutral-700">
                  {lesson.content}
                </p>
              )}
            </li>
          ))}
        </ul>

        {tutor?.bio && (
          <>
            <h2 className="font-heading mt-10 text-lg font-semibold text-primary-900">
              About the instructor
            </h2>
            <div className="mt-4 rounded-lg bg-white p-5 shadow-[0_1px_3px_rgba(18,22,28,0.08)]">
              <p className="font-medium text-neutral-900">{course.tutorName}</p>
              <p className="mt-2 whitespace-pre-line text-sm text-neutral-700">{tutor.bio}</p>
            </div>
          </>
        )}

        <h2 className="font-heading mt-10 text-lg font-semibold text-primary-900">Reviews</h2>

        {enrollment && (
          <>
            <ReviewForm
              courseId={course.id}
              existingReview={
                myReview ? { id: myReview.id, rating: myReview.rating, comment: myReview.comment } : undefined
              }
            />
            {myReview && (
              <form action={deleteReviewAction.bind(null, myReview.id, course.id)} className="mt-2">
                <button type="submit" className="text-sm font-medium text-error-600 hover:underline">
                  Delete my review
                </button>
              </form>
            )}
          </>
        )}

        {reviews.length === 0 ? (
          <p className="mt-4 text-sm text-neutral-700">No reviews yet.</p>
        ) : (
          <ul className="mt-4 flex flex-col gap-3">
            {reviews.map((review) => (
              <li
                key={review.id}
                className="rounded-lg bg-white p-4 shadow-[0_1px_3px_rgba(18,22,28,0.08)]"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-neutral-900">{review.studentName}</span>
                  <span className="text-sm text-primary-700">{"★".repeat(review.rating)}</span>
                </div>
                <p className="mt-2 whitespace-pre-line text-sm text-neutral-700">
                  {review.comment}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
