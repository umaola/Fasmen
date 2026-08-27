import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/dal";
import { findCourseById, listLessonsByCourse } from "@/lib/courses";
import { listQuestionsByCourse } from "@/lib/assessments";
import { listEnrollmentsByCourse } from "@/lib/enrollments";
import { submitForReview } from "@/app/actions/courses";
import { deleteQuestionAction } from "@/app/actions/assessments";
import { StatusChip } from "@/components/StatusChip";
import { categoryName } from "@/lib/categories";
import { formatNaira } from "@/lib/currency";
import {
  AlertCircleIcon,
  BookIcon,
  CheckCircleIcon,
  ClipboardCheckIcon,
  ImagePlaceholderIcon,
  ShieldCheckIcon,
} from "@/components/icons";
import { CourseWizardStepper } from "../CourseWizardStepper";
import { CourseWizardNav } from "../CourseWizardNav";
import { EditCourseForm } from "./EditCourseForm";
import { CourseThumbnailUpload } from "./CourseThumbnailUpload";
import { LessonsList } from "./LessonsList";
import { AddLessonForm } from "./AddLessonForm";
import { AddQuestionForm } from "./AddQuestionForm";
import { DeleteCourseButton } from "./DeleteCourseButton";

export default async function CourseDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ step?: string }>;
}) {
  const { id } = await params;
  const { step } = await searchParams;
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

  const parsedStep = parseInt(step || "1", 10);
  const activeStep = Math.min(5, Math.max(1, isNaN(parsedStep) ? 1 : parsedStep));

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
      {/* Top Header info */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/courses"
              className="text-xs font-medium text-neutral-700 hover:text-primary-700 hover:underline"
            >
              ← Courses
            </Link>
            <span className="text-neutral-300">/</span>
            <span className="text-xs text-neutral-700 font-medium truncate max-w-[200px] sm:max-w-none">
              {course.title}
            </span>
          </div>
          <h1 className="font-heading mt-1 text-2xl font-bold text-primary-900">{course.title}</h1>
          <p className="mt-1 text-xs sm:text-sm text-neutral-700">
            {categoryName(course.category)} · {course.level} · {formatNaira(course.price)} ·{" "}
            {course.enrollmentCount} enrolled
          </p>
        </div>
        <div className="self-start sm:self-auto">
          <StatusChip status={course.status} />
        </div>
      </div>

      {/* Stepper Progress Bar */}
      <CourseWizardStepper currentStep={activeStep} courseId={course.id} />

      {/* STEP 1: COURSE DETAILS */}
      {activeStep === 1 && (
        <div>
          <EditCourseForm course={course} showWizardNav={true} />
        </div>
      )}

      {/* STEP 2: MEDIA & COVER THUMBNAIL */}
      {activeStep === 2 && (
        <div className="flex flex-col gap-6">
          <div className="rounded-xl bg-white p-6 sm:p-8 shadow-[0_1px_3px_rgba(18,22,28,0.08)] border border-neutral-200/80">
            <div className="mb-6">
              <h2 className="font-heading text-xl font-bold text-primary-900">
                Step 2: Course cover media
              </h2>
              <p className="mt-1 text-sm text-neutral-700">
                Upload a cover image that captures student interest in search and catalog listings.
              </p>
            </div>

            <CourseThumbnailUpload courseId={course.id} thumbnailUrl={course.thumbnailUrl} />

            <CourseWizardNav
              courseId={course.id}
              currentStep={2}
              proceedHref={`/dashboard/courses/${course.id}?step=3`}
              proceedLabel="Next"
            />
          </div>
        </div>
      )}

      {/* STEP 3: CURRICULUM & LESSONS */}
      {activeStep === 3 && (
        <div className="rounded-xl bg-white p-6 sm:p-8 shadow-[0_1px_3px_rgba(18,22,28,0.08)] border border-neutral-200/80">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-200/80 pb-4">
            <div>
              <h2 className="font-heading text-xl font-bold text-primary-900">
                Step 3: Curriculum & Lessons ({lessons.length})
              </h2>
              <p className="mt-1 text-sm text-neutral-700">
                Structure your course content. Add video lessons or reading materials.
              </p>
            </div>
            <span className="self-start rounded-full bg-primary-100 px-3 py-1 text-xs font-semibold text-primary-900">
              {lessons.length === 0 ? "1 required to publish" : `${lessons.length} lesson(s)`}
            </span>
          </div>

          <div className="mt-6">
            <LessonsList courseId={course.id} lessons={lessons} editable={course.status !== "published"} />

            {lessons.length === 0 && (
              <div className="my-6 rounded-lg border border-dashed border-neutral-300 p-8 text-center bg-neutral-50/50">
                <BookIcon className="mx-auto h-8 w-8 text-neutral-400" />
                <h3 className="mt-2 text-sm font-semibold text-neutral-900">No lessons added yet</h3>
                <p className="mt-1 text-xs text-neutral-700">
                  Use the form below to create your first video or reading lesson.
                </p>
              </div>
            )}

            {course.status !== "published" && (
              <div className="mt-8 border-t border-neutral-200/80 pt-6">
                <h3 className="text-base font-semibold text-primary-900">Add a new lesson</h3>
                <AddLessonForm courseId={course.id} />
              </div>
            )}
          </div>

          <CourseWizardNav
            courseId={course.id}
            currentStep={3}
            proceedHref={`/dashboard/courses/${course.id}?step=4`}
            proceedLabel="Proceed to Assessment"
          />
        </div>
      )}

      {/* STEP 4: ASSESSMENT & QUIZ */}
      {activeStep === 4 && (
        <div className="rounded-xl bg-white p-6 sm:p-8 shadow-[0_1px_3px_rgba(18,22,28,0.08)] border border-neutral-200/80">
          <div className="border-b border-neutral-200/80 pb-4">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-xl font-bold text-primary-900">
                Step 4: Assessment & Grading ({questions.length})
              </h2>
              <span className="rounded-full bg-accent-100 px-3 py-1 text-xs font-semibold text-accent-600">
                Pass Mark: {course.passThresholdPercent}%
              </span>
            </div>
            <p className="mt-1 text-sm text-neutral-700">
              Students must score at least {course.passThresholdPercent}% to pass and earn their certificate (up to {course.maxAttempts} attempt{course.maxAttempts === 1 ? "" : "s"}).
            </p>
          </div>

          <div className="mt-6">
            {questions.length > 0 ? (
              <ul className="flex flex-col gap-3">
                {questions.map((question, index) => (
                  <li
                    key={question.id}
                    className="rounded-lg border border-neutral-200 bg-white p-4 shadow-xs"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                          Question {index + 1} ({question.type})
                        </span>
                        <p className="mt-1 text-sm font-semibold text-neutral-900">
                          {question.questionText}
                        </p>
                        <ul className="mt-2 space-y-1 text-xs text-neutral-700">
                          {question.options.map((option, i) => {
                            const isCorrect = question.correctOptionIndexes.includes(i);
                            return (
                              <li
                                key={i}
                                className={`flex items-center gap-1.5 ${
                                  isCorrect ? "font-semibold text-success-600" : ""
                                }`}
                              >
                                {isCorrect ? "✓" : "•"} {option}
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                      {course.status !== "published" && (
                        <form action={deleteQuestionAction.bind(null, course.id, question.id)}>
                          <button
                            type="submit"
                            className="shrink-0 text-xs font-medium text-error-600 hover:underline cursor-pointer"
                          >
                            Delete
                          </button>
                        </form>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="my-6 rounded-lg border border-dashed border-neutral-300 p-8 text-center bg-neutral-50/50">
                <ClipboardCheckIcon className="mx-auto h-8 w-8 text-neutral-400" />
                <h3 className="mt-2 text-sm font-semibold text-neutral-900">No quiz questions yet</h3>
                <p className="mt-1 text-xs text-neutral-700">
                  Assessments test student comprehension before issuing certificates.
                </p>
              </div>
            )}

            {course.status !== "published" && (
              <div className="mt-8 border-t border-neutral-200/80 pt-6">
                <h3 className="text-base font-semibold text-primary-900">Add a quiz question</h3>
                <AddQuestionForm courseId={course.id} />
              </div>
            )}
          </div>

          <CourseWizardNav
            courseId={course.id}
            currentStep={4}
            proceedHref={`/dashboard/courses/${course.id}?step=5`}
            proceedLabel="Next"
          />
        </div>
      )}

      {/* STEP 5: REVIEW & SUBMIT */}
      {activeStep === 5 && (
        <div className="flex flex-col gap-6">
          {/* Rejection Alert */}
          {course.status === "rejected" && course.rejectionFeedback && (
            <div className="rounded-xl border border-error-600/30 bg-[#fbe9e7] p-5 text-sm text-error-600">
              <p className="font-semibold">Feedback from admin review:</p>
              <p className="mt-1">{course.rejectionFeedback}</p>
            </div>
          )}

          {/* Status Message */}
          {course.status === "pending-review" && (
            <div className="rounded-xl border border-warning-600/30 bg-[#fff8e1] p-5 text-sm text-warning-600 flex items-center gap-3">
              <ShieldCheckIcon className="h-5 w-5 shrink-0 text-warning-600" />
              <div>
                <p className="font-semibold">Course is awaiting admin approval</p>
                <p className="mt-0.5 text-xs text-neutral-700">
                  Our review team will verify your course content shortly. You will be notified when it goes live.
                </p>
              </div>
            </div>
          )}

          {/* Pre-flight Readiness Checklist */}
          <div className="rounded-xl bg-white p-6 sm:p-8 shadow-[0_1px_3px_rgba(18,22,28,0.08)] border border-neutral-200/80">
            <h2 className="font-heading text-xl font-bold text-primary-900">
              Step 5: Review & Submit for Review
            </h2>
            <p className="mt-1 text-sm text-neutral-700">
              Review your course details and ensure all publishing requirements are met.
            </p>

            <div className="mt-6 rounded-lg border border-neutral-200 bg-neutral-50/70 p-5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-3">
                Publishing Readiness Checklist
              </h3>
              <ul className="space-y-2.5 text-sm">
                <li className="flex items-center gap-2 text-neutral-900 font-medium">
                  <CheckCircleIcon className="h-4 w-4 text-success-600 shrink-0" />
                  <span>Course details completed ({course.title})</span>
                </li>

                <li className="flex items-center gap-2">
                  {course.thumbnailUrl ? (
                    <>
                      <CheckCircleIcon className="h-4 w-4 text-success-600 shrink-0" />
                      <span className="text-neutral-900 font-medium">Cover thumbnail uploaded</span>
                    </>
                  ) : (
                    <>
                      <AlertCircleIcon className="h-4 w-4 text-warning-600 shrink-0" />
                      <span className="text-neutral-700">
                        No cover thumbnail uploaded{" "}
                        <Link href={`/dashboard/courses/${course.id}?step=2`} className="text-primary-700 underline text-xs">
                          (Add cover)
                        </Link>
                      </span>
                    </>
                  )}
                </li>

                <li className="flex items-center gap-2">
                  {lessons.length > 0 ? (
                    <>
                      <CheckCircleIcon className="h-4 w-4 text-success-600 shrink-0" />
                      <span className="text-neutral-900 font-medium">
                        {lessons.length} lesson{lessons.length === 1 ? "" : "s"} added
                      </span>
                    </>
                  ) : (
                    <>
                      <AlertCircleIcon className="h-4 w-4 text-error-600 shrink-0" />
                      <span className="text-error-600 font-medium">
                        No lessons added yet — at least 1 lesson is required{" "}
                        <Link href={`/dashboard/courses/${course.id}?step=3`} className="underline text-xs">
                          (Add lesson)
                        </Link>
                      </span>
                    </>
                  )}
                </li>

                <li className="flex items-center gap-2 text-neutral-700">
                  <CheckCircleIcon className="h-4 w-4 text-success-600 shrink-0" />
                  <span>
                    Assessment: {questions.length} question{questions.length === 1 ? "" : "s"} ({course.passThresholdPercent}% pass mark)
                  </span>
                </li>

                <li className="flex items-center gap-2">
                  {isVerified ? (
                    <>
                      <CheckCircleIcon className="h-4 w-4 text-success-600 shrink-0" />
                      <span className="text-neutral-900 font-medium">Tutor identity verified</span>
                    </>
                  ) : (
                    <>
                      <AlertCircleIcon className="h-4 w-4 text-error-600 shrink-0" />
                      <span className="text-error-600 font-medium">
                        Tutor verification incomplete —{" "}
                        <Link href="/dashboard/account/verify" className="underline text-xs font-semibold">
                          Complete verification
                        </Link>
                      </span>
                    </>
                  )}
                </li>
              </ul>
            </div>

            {/* Course Summary Card */}
            <div className="mt-6 flex flex-col sm:flex-row gap-5 rounded-lg border border-neutral-200 bg-white p-5 shadow-xs">
              <div className="flex aspect-video w-full sm:w-48 shrink-0 items-center justify-center overflow-hidden rounded-md bg-neutral-100">
                {course.thumbnailUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={course.thumbnailUrl} alt="Thumbnail" className="h-full w-full object-cover" />
                ) : (
                  <ImagePlaceholderIcon className="h-8 w-8 text-neutral-400" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-primary-100 px-2 py-0.5 text-xs font-semibold text-primary-900">
                    {categoryName(course.category)}
                  </span>
                  <span className="text-xs text-neutral-500 capitalize">{course.level}</span>
                </div>
                <h3 className="mt-2 font-heading text-lg font-bold text-primary-900">{course.title}</h3>
                <p className="mt-1 line-clamp-2 text-xs text-neutral-700">{course.description}</p>
                <div className="mt-3 flex items-center gap-4 text-xs text-neutral-900 font-medium">
                  <span>Price: {formatNaira(course.price)}</span>
                  <span>·</span>
                  <span>Lessons: {lessons.length}</span>
                  <span>·</span>
                  <span>Quiz: {questions.length} questions</span>
                </div>
              </div>
            </div>

            {/* Submit for Review Action */}
            {canSubmit && (
              <div className="mt-8 border-t border-neutral-200/80 pt-6">
                <form action={submitForReview.bind(null, course.id)} className="flex flex-col gap-3">
                  <button
                    type="submit"
                    disabled={submitBlockedReason !== undefined}
                    className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-accent-600 text-sm font-semibold text-white shadow-xs transition hover:bg-accent-600/90 focus:outline-none focus:ring-2 focus:ring-accent-600 focus:ring-offset-2 disabled:opacity-50 cursor-pointer"
                  >
                    <span>Submit</span>
                    <ShieldCheckIcon className="h-4 w-4" />
                  </button>
                  {submitBlockedReason && (
                    <p className="text-center text-xs font-medium text-error-600">
                      Cannot submit: {submitBlockedReason}
                    </p>
                  )}
                </form>
              </div>
            )}

            <CourseWizardNav
              courseId={course.id}
              currentStep={5}
              proceedType="button"
              proceedDisabled={true}
            />
          </div>

          {/* Enrollments if published */}
          {course.status === "published" && (
            <div className="rounded-xl bg-white p-6 sm:p-8 shadow-[0_1px_3px_rgba(18,22,28,0.08)] border border-neutral-200/80">
              <h2 className="font-heading text-lg font-bold text-primary-900">
                Enrollments ({enrollments.length})
              </h2>
              {enrollments.length === 0 ? (
                <p className="mt-2 text-sm text-neutral-700">No students enrolled yet.</p>
              ) : (
                <ul className="mt-4 flex flex-col gap-2">
                  {enrollments.map((enrollment) => (
                    <li
                      key={enrollment.id}
                      className="flex items-center justify-between rounded-md bg-neutral-50 px-4 py-3 text-sm"
                    >
                      <span className="text-neutral-900 font-medium">
                        Enrolled{" "}
                        {new Date(enrollment.enrolledAt).toLocaleDateString("en-NG", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                      <span className="text-neutral-700">
                        {enrollment.progress.percentComplete}% complete
                        {enrollment.assessment.passed &&
                          ` · passed (${enrollment.assessment.bestScorePercent}%)`}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Danger Zone */}
          <div className="rounded-xl border border-error-600/30 bg-white p-6 shadow-[0_1px_3px_rgba(18,22,28,0.08)]">
            <h2 className="font-heading text-base font-bold text-primary-900">Danger zone</h2>
            <p className="mt-1 text-xs text-neutral-700">
              Deleting this course will permanently remove its lessons, media, and quiz questions.
            </p>
            <div className="mt-4">
              <DeleteCourseButton
                courseId={course.id}
                courseTitle={course.title}
                disabled={course.enrollmentCount > 0}
                disabledReason={
                  course.enrollmentCount > 0
                    ? "Courses with enrolled students cannot be deleted"
                    : undefined
                }
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

