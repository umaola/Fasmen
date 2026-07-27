import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/dal";
import { findCourseById, listLessonsByCourse } from "@/lib/courses";
import { listQuestionsByCourse } from "@/lib/assessments";
import { listEnrollmentsByCourse } from "@/lib/enrollments";
import { submitForReview } from "@/app/actions/courses";
import { deleteQuestionAction } from "@/app/actions/assessments";
import { StatusChip } from "@/components/StatusChip";
import { categoryName } from "@/lib/categories";
import { AddLessonForm } from "./AddLessonForm";
import { AddQuestionForm } from "./AddQuestionForm";
import { CourseDetailsSection } from "./CourseDetailsSection";
import { CourseThumbnailUpload } from "./CourseThumbnailUpload";
import { LessonsList } from "./LessonsList";
import { DeleteCourseButton } from "./DeleteCourseButton";

export default async function CourseDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ edit?: string }>;
}) {
  const { id } = await params;
  const { edit } = await searchParams;
  const user = await getCurrentUser();
  if (!user || user.role !== "tutor") {
    redirect("/dashboard");
  }

  const course = await findCourseById(id);
  if (!course || course.tutorId !== user.id) {
    notFound();
  }

  const [lessons, questions, enrollments] = await Promise.all([
    listLessonsByCourse(course.id),
    listQuestionsByCourse(course.id),
    listEnrollmentsByCourse(course.id),
  ]);
  const isVerified = Boolean(user.tutorProfile?.verified);
  const canSubmit = course.status === "draft" || course.status === "rejected";
  const submitBlockedReason =
    lessons.length === 0
      ? "Add at least one lesson first"
      : !isVerified
        ? "Complete tutor verification before submitting"
        : undefined;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-primary-900">{course.title}</h1>
          <p className="mt-1 text-sm text-neutral-700">
            {categoryName(course.category)} · {course.level} ·{" "}
            {(course.price / 100).toLocaleString("en-NG", {
              style: "currency",
              currency: "NGN",
            })}{" "}
            · {course.enrollmentCount} enrolled
          </p>
        </div>
        <StatusChip status={course.status} />
      </div>

      {course.status === "rejected" && course.rejectionFeedback && (
        <div className="mt-4 rounded-md bg-[#fbe9e7] p-4 text-sm text-error-600">
          <p className="font-medium">Feedback from review:</p>
          <p className="mt-1">{course.rejectionFeedback}</p>
        </div>
      )}

      <p className="mt-4 text-neutral-700">{course.description}</p>

      <div className="mt-6">
        <CourseThumbnailUpload courseId={course.id} thumbnailUrl={course.thumbnailUrl} />
      </div>

      <CourseDetailsSection course={course} initialEditing={edit === "true"} />

      <div className="mt-10 flex items-center justify-between">
        <h2 className="font-heading text-lg font-semibold text-primary-900">
          Lessons ({lessons.length})
        </h2>
        {canSubmit && (
          <form action={submitForReview.bind(null, course.id)}>
            <button
              type="submit"
              disabled={submitBlockedReason !== undefined}
              title={submitBlockedReason}
              className="h-10 rounded-md bg-accent-600 px-5 text-sm font-medium text-white transition hover:brightness-95 disabled:opacity-50"
            >
              Submit for review
            </button>
          </form>
        )}
        {course.status === "pending-review" && (
          <span className="text-sm text-warning-600">Awaiting admin approval</span>
        )}
      </div>

      <LessonsList courseId={course.id} lessons={lessons} editable />

      {course.status !== "published" && (
        <div className="mt-6">
          <h3 className="text-sm font-medium text-neutral-900">Add a lesson</h3>
          <AddLessonForm courseId={course.id} />
        </div>
      )}

      <div className="mt-10">
        <h2 className="font-heading text-lg font-semibold text-primary-900">
          Enrollments ({enrollments.length})
        </h2>
        {enrollments.length === 0 ? (
          <p className="mt-2 text-sm text-neutral-700">No students enrolled yet.</p>
        ) : (
          <ul className="mt-4 flex flex-col gap-2">
            {enrollments.map((enrollment) => (
              <li
                key={enrollment.id}
                className="flex items-center justify-between rounded-md bg-white px-4 py-3 shadow-[0_1px_3px_rgba(18,22,28,0.08)]"
              >
                <span className="text-sm text-neutral-900">
                  Enrolled{" "}
                  {new Date(enrollment.enrolledAt).toLocaleDateString("en-NG", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
                <span className="text-sm text-neutral-700">
                  {enrollment.progress.percentComplete}% complete
                  {enrollment.assessment.passed &&
                    ` · passed (${enrollment.assessment.bestScorePercent}%)`}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-10">
        <h2 className="font-heading text-lg font-semibold text-primary-900">
          Assessment ({questions.length} question{questions.length === 1 ? "" : "s"})
        </h2>
        <p className="mt-1 text-sm text-neutral-700">
          Students must score at least {course.passThresholdPercent}% to pass, with up to{" "}
          {course.maxAttempts} attempt{course.maxAttempts === 1 ? "" : "s"}.
        </p>

        {questions.length > 0 && (
          <ul className="mt-4 flex flex-col gap-2">
            {questions.map((question, index) => (
              <li
                key={question.id}
                className="rounded-md bg-white px-4 py-3 shadow-[0_1px_3px_rgba(18,22,28,0.08)]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-neutral-900">
                      {index + 1}. {question.questionText}
                    </p>
                    <ul className="mt-1 text-sm text-neutral-700">
                      {question.options.map((option, i) => (
                        <li key={i}>
                          {question.correctOptionIndexes.includes(i) ? "✓ " : "— "}
                          {option}
                        </li>
                      ))}
                    </ul>
                  </div>
                  {course.status !== "published" && (
                    <form action={deleteQuestionAction.bind(null, course.id, question.id)}>
                      <button
                        type="submit"
                        className="shrink-0 text-sm font-medium text-error-600 hover:underline"
                      >
                        Delete
                      </button>
                    </form>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}

        {course.status !== "published" && (
          <div className="mt-4">
            <h3 className="text-sm font-medium text-neutral-900">Add a question</h3>
            <AddQuestionForm courseId={course.id} />
          </div>
        )}
      </div>

      <div className="mt-10 rounded-lg border border-[#fbe9e7] bg-white p-6">
        <h2 className="font-heading text-lg font-semibold text-primary-900">Danger zone</h2>
        <p className="mt-1 text-sm text-neutral-700">
          Deleting a course removes it, its lessons, and its assessment permanently.
        </p>
        <div className="mt-4">
          <DeleteCourseButton
            courseId={course.id}
            courseTitle={course.title}
            disabled={course.enrollmentCount > 0}
            disabledReason={
              course.enrollmentCount > 0
                ? "Courses with enrolled students can't be deleted"
                : undefined
            }
          />
        </div>
      </div>
    </div>
  );
}
