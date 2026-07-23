"use client";

import { useActionState, useState } from "react";
import { rejectCourseAction } from "@/app/actions/courses";
import type { RejectCourseState } from "@/lib/definitions";

export function RejectCourseForm({ courseId }: { courseId: string }) {
  const [open, setOpen] = useState(false);
  const boundAction = rejectCourseAction.bind(null, courseId);
  const [state, action, pending] = useActionState<RejectCourseState, FormData>(
    boundAction,
    undefined
  );

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
        <textarea
          name="feedback"
          rows={2}
          placeholder="Explain what needs to change before this can be approved..."
          className="w-full rounded-sm border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-primary-500"
        />
        {state?.errors?.feedback && (
          <p className="mt-1 text-sm text-error-600">{state.errors.feedback[0]}</p>
        )}
        {state?.message && <p className="mt-1 text-sm text-error-600">{state.message}</p>}
      </div>
      <button
        type="submit"
        disabled={pending}
        className="h-10 shrink-0 rounded-md bg-error-600 px-5 text-sm font-medium text-white transition hover:brightness-95 disabled:opacity-60"
      >
        {pending ? "Sending..." : "Confirm reject"}
      </button>
    </form>
  );
}
