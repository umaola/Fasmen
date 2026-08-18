"use client";

import { useActionState, useState } from "react";
import { submitReview, editReview } from "@/app/actions/reviews";
import type { ReviewState } from "@/lib/definitions";
import { FormAlert } from "@/components/FormAlert";

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

  const [rating, setRating] = useState(existingReview?.rating ?? 5);
  const [comment, setComment] = useState(existingReview?.comment ?? "");

  // Reset comment on new review creation success only
  const [handledSuccess, setHandledSuccess] = useState(false);
  if (state?.success && !handledSuccess) {
    setHandledSuccess(true);
    if (!existingReview) {
      setComment("");
      setRating(5);
    }
  } else if (!state?.success && handledSuccess) {
    setHandledSuccess(false);
  }

  return (
    <form action={action} className="mt-4 flex flex-col gap-3 rounded-lg bg-white p-5 shadow-[0_1px_3px_rgba(18,22,28,0.08)]">
      <FormAlert message={state?.message} />
      {state?.success && <FormAlert type="success" message="Review saved." />}

      <div>
        <label htmlFor="rating" className="block text-sm font-medium text-neutral-900">
          Rating
        </label>
        <select
          id="rating"
          name="rating"
          value={rating}
          onChange={(e) => setRating(Number(e.target.value))}
          aria-invalid={!!state?.errors?.rating}
          className={`mt-1 h-11 w-full rounded-sm border px-3 text-base outline-none transition focus:ring-1 ${
            state?.errors?.rating
              ? "border-error-600 focus:border-error-600 focus:ring-error-600/30"
              : "border-neutral-200 focus:border-primary-500 focus:ring-primary-500/20"
          }`}
        >
          {[5, 4, 3, 2, 1].map((n) => (
            <option key={n} value={n}>
              {n} star{n === 1 ? "" : "s"}
            </option>
          ))}
        </select>
        {state?.errors?.rating && (
          <p className="mt-1 text-sm font-medium text-error-600">{state.errors.rating[0]}</p>
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
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share what you learned and what you thought of the course."
          aria-invalid={!!state?.errors?.comment}
          className={`mt-1 w-full rounded-sm border px-3 py-2 text-base outline-none transition focus:ring-1 ${
            state?.errors?.comment
              ? "border-error-600 focus:border-error-600 focus:ring-error-600/30"
              : "border-neutral-200 focus:border-primary-500 focus:ring-primary-500/20"
          }`}
        />
        {state?.errors?.comment && (
          <p className="mt-1 text-sm font-medium text-error-600">{state.errors.comment[0]}</p>
        )}
      </div>

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
