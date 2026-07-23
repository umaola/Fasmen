import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { requireRole } from "@/lib/authz";
import { findCourseBySlug } from "@/lib/courses";
import { findEnrollment } from "@/lib/enrollments";
import { listQuestionsForAttempt } from "@/lib/assessments";
import { QuizForm } from "./QuizForm";

export default async function AssessmentPage({ params }: { params: Promise<{ slug: string }> }) {
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
  if (!enrollment || enrollment.progress.percentComplete < 100) {
    redirect(`/dashboard/learn/${slug}`);
  }

  const questions = await listQuestionsForAttempt(course.id);
  const attemptsRemaining = course.maxAttempts - enrollment.assessment.attemptsUsed;

  return (
    <div className="mx-auto max-w-3xl">
      <Link href={`/dashboard/learn/${slug}`} className="text-sm font-medium text-primary-700">
        ← {course.title}
      </Link>
      <h1 className="font-heading mt-2 text-2xl font-bold text-primary-900">Assessment</h1>
      <p className="mt-1 text-sm text-neutral-700">
        Score at least {course.passThresholdPercent}% to pass.
      </p>

      {enrollment.assessment.passed ? (
        <div className="mt-6 rounded-lg bg-white p-6 shadow-[0_1px_3px_rgba(18,22,28,0.08)]">
          <p className="font-heading text-2xl font-bold text-success-600">
            You passed with {enrollment.assessment.bestScorePercent}%
          </p>
          {enrollment.certificateId && (
            <Link
              href={`/verify/${enrollment.certificateId}`}
              className="mt-3 inline-flex h-10 items-center rounded-md bg-accent-600 px-5 text-sm font-medium text-white transition hover:brightness-95"
            >
              View your certificate
            </Link>
          )}
        </div>
      ) : questions.length === 0 ? (
        <p className="mt-6 text-sm text-neutral-700">
          This course doesn&apos;t have an assessment yet.
        </p>
      ) : attemptsRemaining <= 0 ? (
        <div className="mt-6 rounded-lg bg-white p-6 shadow-[0_1px_3px_rgba(18,22,28,0.08)]">
          <p className="font-medium text-error-600">You&apos;ve used all your attempts.</p>
          <p className="mt-1 text-sm text-neutral-700">
            Best score so far: {enrollment.assessment.bestScorePercent ?? 0}%.
          </p>
        </div>
      ) : (
        <QuizForm
          courseId={course.id}
          slug={slug}
          questions={questions}
          passThresholdPercent={course.passThresholdPercent}
          attemptsRemaining={attemptsRemaining}
        />
      )}
    </div>
  );
}
