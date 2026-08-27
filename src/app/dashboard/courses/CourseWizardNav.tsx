"use client";

import Link from "next/link";
import { ArrowLeftIcon, ArrowRightIcon } from "@/components/icons";

export function CourseWizardNav({
  courseId,
  currentStep,
  totalSteps = 5,
  proceedLabel,
  proceedHref,
  proceedType = "button",
  proceedDisabled = false,
  pending = false,
  cancelHref = "/dashboard/courses",
  onProceed,
}: {
  courseId?: string;
  currentStep: number;
  totalSteps?: number;
  proceedLabel?: string;
  proceedHref?: string;
  proceedType?: "button" | "submit";
  proceedDisabled?: boolean;
  pending?: boolean;
  cancelHref?: string;
  onProceed?: () => void;
}) {
  const isLastStep = currentStep === totalSteps;
  const prevStepHref =
    currentStep > 1 && courseId
      ? `/dashboard/courses/${courseId}?step=${currentStep - 1}`
      : undefined;

  const nextStepHref =
    proceedHref ||
    (courseId && currentStep < totalSteps
      ? `/dashboard/courses/${courseId}?step=${currentStep + 1}`
      : undefined);

  const defaultProceedLabel = isLastStep ? "Submit" : "Next";

  const label = proceedLabel || defaultProceedLabel;

  return (
    <div className="mt-8 flex flex-col-reverse sm:flex-row items-center justify-between gap-4 border-t border-neutral-200/80 pt-6">
      {/* Cancel / Exit */}
      <Link
        href={cancelHref}
        className="text-sm font-medium text-neutral-700 hover:text-neutral-900 transition underline-offset-4 hover:underline"
      >
        Cancel
      </Link>

      {/* Back and Proceed buttons */}
      <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
        {prevStepHref && (
          <Link
            href={prevStepHref}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-neutral-200 bg-white px-5 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50 hover:border-neutral-300"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            <span>Back</span>
          </Link>
        )}

        {proceedType === "submit" ? (
          <button
            type="submit"
            disabled={proceedDisabled || pending}
            className="inline-flex h-11 flex-1 sm:flex-none items-center justify-center gap-2 rounded-lg bg-primary-700 px-6 text-sm font-medium text-white shadow-xs transition hover:bg-primary-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 cursor-pointer"
          >
            <span>{pending ? "Saving..." : label}</span>
            <ArrowRightIcon className="h-4 w-4" />
          </button>
        ) : nextStepHref ? (
          <Link
            href={nextStepHref}
            onClick={onProceed}
            className={`inline-flex h-11 flex-1 sm:flex-none items-center justify-center gap-2 rounded-lg bg-primary-700 px-6 text-sm font-medium text-white shadow-xs transition hover:bg-primary-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
              proceedDisabled ? "pointer-events-none opacity-50" : ""
            }`}
          >
            <span>{label}</span>
            <ArrowRightIcon className="h-4 w-4" />
          </Link>
        ) : null}
      </div>
    </div>
  );
}
