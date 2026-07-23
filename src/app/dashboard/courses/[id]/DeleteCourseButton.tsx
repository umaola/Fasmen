"use client";

import { useState } from "react";
import { deleteCourseAction } from "@/app/actions/courses";

export function DeleteCourseButton({
  courseId,
  courseTitle,
  disabled,
  disabledReason,
}: {
  courseId: string;
  courseTitle: string;
  disabled: boolean;
  disabledReason?: string;
}) {
  const [confirming, setConfirming] = useState(false);

  if (confirming) {
    return (
      <div className="flex flex-col gap-3 rounded-md bg-[#fbe9e7] p-4">
        <p className="text-sm text-error-600">
          Delete &ldquo;{courseTitle}&rdquo; permanently? This can&apos;t be undone.
        </p>
        <div className="flex gap-3">
          <form action={deleteCourseAction.bind(null, courseId)}>
            <button
              type="submit"
              className="h-9 rounded-md bg-error-600 px-4 text-sm font-medium text-white transition hover:brightness-95"
            >
              Yes, delete it
            </button>
          </form>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            className="h-9 rounded-md border border-neutral-200 px-4 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      disabled={disabled}
      title={disabledReason}
      onClick={() => setConfirming(true)}
      className="h-10 rounded-md bg-error-600 px-5 text-sm font-medium text-white transition hover:brightness-95 disabled:opacity-50"
    >
      Delete course
    </button>
  );
}
