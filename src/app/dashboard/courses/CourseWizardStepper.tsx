"use client";

import Link from "next/link";
import { CheckCircleIcon } from "@/components/icons";

export const COURSE_WIZARD_STEPS = [
  { number: 1, id: "details", title: "Course details", shortTitle: "Details" },
  { number: 2, id: "media", title: "Cover media", shortTitle: "Media" },
  { number: 3, id: "lessons", title: "Lessons", shortTitle: "Lessons" },
  { number: 4, id: "assessment", title: "Assessment", shortTitle: "Quiz" },
  { number: 5, id: "review", title: "Review & publish", shortTitle: "Review" },
] as const;

export function CourseWizardStepper({
  currentStep,
  courseId,
  completedStepThreshold,
}: {
  currentStep: number;
  courseId?: string;
  completedStepThreshold?: number;
}) {
  const threshold = completedStepThreshold ?? currentStep;
  const progressPercent = Math.min(100, Math.max(10, ((currentStep - 1) / (COURSE_WIZARD_STEPS.length - 1)) * 100));

  return (
    <div className="w-full rounded-xl bg-white p-4 sm:p-6 shadow-[0_1px_3px_rgba(18,22,28,0.08)] border border-neutral-200/80 mb-8">
      {/* Top Header info */}
      <div className="flex items-center justify-between gap-4 mb-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-primary-700">
            Step {currentStep} of {COURSE_WIZARD_STEPS.length}
          </span>
          <h2 className="font-heading text-lg font-bold text-primary-900">
            {COURSE_WIZARD_STEPS[currentStep - 1]?.title || "Course builder"}
          </h2>
        </div>
        <div className="text-right">
          <span className="text-xs font-medium text-neutral-700">
            {Math.round((currentStep / COURSE_WIZARD_STEPS.length) * 100)}% Complete
          </span>
        </div>
      </div>

      {/* Progress Bar Track */}
      <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-100">
        <div
          className="h-full bg-primary-700 transition-all duration-300 ease-out rounded-full"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Stepper Buttons / Badges */}
      <nav aria-label="Course creation progress" className="mt-5 grid grid-cols-5 gap-1 sm:gap-2">
        {COURSE_WIZARD_STEPS.map((step) => {
          const isCompleted = step.number < threshold;
          const isCurrent = step.number === currentStep;
          const isClickable = Boolean(courseId);

          const StepContent = (
            <div
              className={`group flex flex-col items-center text-center p-2 rounded-lg transition ${
                isCurrent
                  ? "bg-primary-100/50 font-semibold"
                  : isClickable
                  ? "hover:bg-neutral-50 cursor-pointer"
                  : "opacity-60 cursor-not-allowed"
              }`}
            >
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition ${
                  isCurrent
                    ? "bg-primary-700 text-white shadow-xs"
                    : isCompleted
                    ? "bg-success-600 text-white"
                    : "bg-neutral-200 text-neutral-700"
                }`}
              >
                {isCompleted ? (
                  <CheckCircleIcon className="h-4 w-4" />
                ) : (
                  <span>{step.number}</span>
                )}
              </div>
              <span
                className={`mt-1.5 text-xs truncate max-w-full hidden sm:block ${
                  isCurrent
                    ? "text-primary-900 font-semibold"
                    : isCompleted
                    ? "text-neutral-900 font-medium"
                    : "text-neutral-700"
                }`}
              >
                {step.shortTitle}
              </span>
            </div>
          );

          if (isClickable) {
            return (
              <Link
                key={step.number}
                href={`/dashboard/courses/${courseId}?step=${step.number}`}
                className="focus:outline-none"
                title={`Go to ${step.title}`}
              >
                {StepContent}
              </Link>
            );
          }

          return <div key={step.number}>{StepContent}</div>;
        })}
      </nav>
    </div>
  );
}
