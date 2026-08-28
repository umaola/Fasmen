import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { requireRole } from "@/lib/authz";
import { findCourseBySlug } from "@/lib/courses";
import { findEnrollment, setCertificateId, recordAssessmentAttempt } from "@/lib/enrollments";
import { listQuestionsForAttempt } from "@/lib/assessments";
import { issueCertificate } from "@/lib/certificates";
import { CertificateIcon, ArrowRightIcon } from "@/components/icons";
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

  let enrollment = await findEnrollment(user.id, course.id);
  if (!enrollment || enrollment.progress.percentComplete < 100) {
    redirect(`/dashboard/learn/${slug}`);
  }

  const questions = await listQuestionsForAttempt(course.id);
  const hasAssessment = questions.length > 0;

  // If no assessment was added by the tutor, ensure certificate is issued on 100% completion
  if (!hasAssessment && !enrollment.certificateId) {
    const certificate = await issueCertificate({
      studentId: user.id,
      studentName: user.displayName,
      courseId: course.id,
      courseTitle: course.title,
      tutorName: course.tutorName,
      scorePercent: 100,
    });
    await setCertificateId(user.id, course.id, certificate.id);
    await recordAssessmentAttempt(user.id, course.id, { scorePercent: 100, passed: true });
    enrollment = (await findEnrollment(user.id, course.id)) ?? enrollment;
  }

  const attemptsRemaining = course.maxAttempts - enrollment.assessment.attemptsUsed;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link href={`/dashboard/learn/${slug}`} className="text-xs font-semibold text-primary-700 hover:underline">
        ← Return to {course.title}
      </Link>

      <div>
        <h1 className="font-heading text-2xl font-bold text-primary-900">
          {hasAssessment ? "Course Assessment" : "Course Completion & Certification"}
        </h1>
        <p className="mt-1 text-sm text-neutral-600">
          {hasAssessment
            ? `Score at least ${course.passThresholdPercent}% on this quiz to receive your verified certificate.`
            : "Congratulations on finishing all the lessons in this course! Your verified certificate is ready."}
        </p>
      </div>

      {!hasAssessment || enrollment.assessment.passed ? (
        <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50/80 to-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-sm">
            <CertificateIcon className="h-8 w-8" />
          </div>
          <h2 className="font-heading mt-4 text-2xl font-bold text-primary-900">
            {hasAssessment ? `You Passed with ${enrollment.assessment.bestScorePercent}%!` : "Course Completed Successfully!"}
          </h2>
          <p className="mt-2 text-sm text-neutral-600 max-w-md mx-auto">
            {hasAssessment
              ? "You demonstrated full mastery of the material. Your official certificate of completion has been issued."
              : "You have completed 100% of the lessons in this course. Your verified certificate has been issued."}
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            {enrollment.certificateId && (
              <Link
                href={`/verify/${enrollment.certificateId}`}
                className="inline-flex h-11 items-center gap-2 rounded-xl bg-accent-600 px-6 text-sm font-bold text-white shadow-sm transition hover:brightness-105"
              >
                <span>View Certificate</span>
                <ArrowRightIcon className="h-4 w-4" />
              </Link>
            )}
            <Link
              href="/dashboard/certificates"
              className="inline-flex h-11 items-center rounded-xl border border-neutral-300 bg-white px-5 text-sm font-semibold text-neutral-700 shadow-2xs transition hover:bg-neutral-50"
            >
              All Certificates
            </Link>
          </div>
        </div>
      ) : attemptsRemaining <= 0 ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50/60 p-6 text-center shadow-sm">
          <p className="font-heading text-lg font-bold text-rose-700">You&apos;ve used all your assessment attempts</p>
          <p className="mt-1 text-xs text-neutral-600">
            Your best score was {enrollment.assessment.bestScorePercent ?? 0}%. Contact your instructor or platform support if you need an attempt reset.
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
