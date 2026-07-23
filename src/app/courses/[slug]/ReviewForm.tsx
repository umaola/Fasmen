"use client";

import { useActionState } from "react";
import { submitReview, editReview } from "@/app/actions/reviews";
import type { ReviewState } from "@/lib/definitions";

export function ReviewForm({
  courseId,
  existingReview,
}: {
  courseId: string;
  existingReview?: { id: string; rating: number; comment: string };
}) {
  const boundAction = existingReview
    ? editReview.bind(null, existingReview.id, courseId)
    : submitReview.bind(null, courseId);
  const [state, action, pending] = useActionState<ReviewState, FormData>(boundAction, undefined);

  return (
    <form action={action} className="mt-4 flex flex-col gap-3 rounded-lg bg-white p-5 shadow-[0_1px_3px_rgba(18,22,28,0.08)]">
      <div>
        <label htmlFor="rating" className="block text-sm font-medium text-neutral-900">
          Rating
        </label>
        <select
          id="rating"
          name="rating"
          defaultValue={existingReview?.rating ?? 5}
          className="mt-1 h-11 w-full rounded-sm border border-neutral-200 px-3 text-base outline-none focus:border-primary-500"
        >
          {[5, 4, 3, 2, 1].map((n) => (
            <option key={n} value={n}>
              {n} star{n === 1 ? "" : "s"}
            </option>
          ))}
        </select>
        {state?.errors?.rating && (
          <p className="mt-1 text-sm text-error-600">{state.errors.rating[0]}</p>
        )}
      </div>

      <div>
        <label htmlFor="comment" className="block text-sm font-medium text-neutral-900">
          Your review
        </label>
        <textarea
          id="comment"
          name="comment"
          rows={3}
          defaultValue={existingReview?.comment}
          placeholder="Share what you learned and what you thought of the course."
          className="mt-1 w-full rounded-sm border border-neutral-200 px-3 py-2 text-base outline-none focus:border-primary-500"
        />
        {state?.errors?.comment && (
          <p className="mt-1 text-sm text-error-600">{state.errors.comment[0]}</p>
        )}
      </div>

      {state?.message && <p className="text-sm text-error-600">{state.message}</p>}
      {state?.success && <p className="text-sm text-success-600">Review saved.</p>}

      <button
        type="submit"
        disabled={pending}
        className="h-10 self-start rounded-md bg-primary-700 px-5 text-sm font-medium text-white transition hover:bg-primary-900 disabled:opacity-60"
      >
        {pending ? "Saving..." : existingReview ? "Update review" : "Submit review"}
      </button>
    </form>
  );
}
