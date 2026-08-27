"use client";

import { useActionState, useState } from "react";
import { rejectCourseAction } from "@/app/actions/courses";
import type { RejectCourseState } from "@/lib/definitions";
import { FormAlert } from "@/components/FormAlert";

export function RejectCourseForm({ courseId }: { courseId: string }) {
  const [open, setOpen] = useState(false);
  const [feedback, setFeedback] = useState("");
  const boundAction = rejectCourseAction.bind(null, courseId);
  const [state, action, pending] = useActionState<RejectCourseState, FormData>(
    boundAction,
    undefined
  );

  // Derived state pattern: close or reset on success
  const [handledSuccess, setHandledSuccess] = useState(false);
  if (state?.success && !handledSuccess) {
    setHandledSuccess(true);
    setFeedback("");
    setOpen(false);
  } else if (!state?.success && handledSuccess) {
    setHandledSuccess(false);
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="h-10 rounded-md border border-error-600 px-5 text-sm font-medium text-error-600 transition hover:bg-[#fbe9e7]"
      >
        Reject
      </button>
    );
  }

  return (
    <form action={action} className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-start">
      <div className="flex-1">
        <FormAlert message={state?.message} className="mb-2" />
        <textarea
          name="feedback"
          rows={2}
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="Explain what needs to change before this can be approved..."
          aria-invalid={!!state?.errors?.feedback}
          className={`w-full rounded-sm border px-3 py-2 text-sm outline-none transition focus:ring-1 ${
            state?.errors?.feedback
              ? "border-error-600 focus:border-error-600 focus:ring-error-600/30"
              : "border-neutral-200 focus:border-primary-500 focus:ring-primary-500/20"
          }`}
        />
        {state?.errors?.feedback && (
          <p className="mt-1 text-sm font-medium text-error-600">{state.errors.feedback[0]}</p>
        )}
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="h-10 shrink-0 rounded-md bg-error-600 px-5 text-sm font-medium text-white transition hover:brightness-95 disabled:opacity-60"
        >
          {pending ? "Rejecting..." : "Reject"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="h-10 shrink-0 rounded-md border border-neutral-200 bg-white px-3 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
