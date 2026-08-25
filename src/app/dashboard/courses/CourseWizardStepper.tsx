"use client";

export const COURSE_WIZARD_STEPS = [
  { number: 1, id: "details", title: "Course details", shortTitle: "Details" },
  { number: 2, id: "media", title: "Cover media", shortTitle: "Media" },
  { number: 3, id: "lessons", title: "Lessons", shortTitle: "Lessons" },
  { number: 4, id: "assessment", title: "Assessment", shortTitle: "Quiz" },
  { number: 5, id: "review", title: "Review & publish", shortTitle: "Review" },
] as const;

export function CourseWizardStepper({
  currentStep,
}: {
  currentStep: number;
  courseId?: string;
  completedStepThreshold?: number;
}) {
  const progressPercent = Math.min(
    100,
    Math.max(10, ((currentStep - 1) / (COURSE_WIZARD_STEPS.length - 1)) * 100)
  );

  return (
    <div className="w-full rounded-xl bg-white p-5 sm:p-6 shadow-[0_1px_3px_rgba(18,22,28,0.08)] border border-neutral-200/80 mb-8">
      {/* Top Header info */}
      <div className="flex items-center justify-between gap-4 mb-3">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-primary-700">
            Step {currentStep} of {COURSE_WIZARD_STEPS.length}
          </span>
          <h2 className="font-heading text-lg font-bold text-primary-900">
            {COURSE_WIZARD_STEPS[currentStep - 1]?.title || "Course builder"}
          </h2>
        </div>
        <div className="text-right">
          <span className="text-xs font-semibold text-primary-700">
            {Math.round((currentStep / COURSE_WIZARD_STEPS.length) * 100)}% Complete
          </span>
        </div>
      </div>

      {/* Progress Bar Track */}
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-neutral-100">
        <div
          className="h-full bg-primary-700 transition-all duration-300 ease-out rounded-full"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  );
}

