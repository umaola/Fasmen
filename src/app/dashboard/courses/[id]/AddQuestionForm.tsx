"use client";

import { useActionState, useState } from "react";
import { addQuestionAction } from "@/app/actions/assessments";
import type { AddQuestionState } from "@/lib/definitions";
import { FormAlert } from "@/components/FormAlert";

export function AddQuestionForm({ courseId }: { courseId: string }) {
  const boundAction = addQuestionAction.bind(null, courseId);
  const [state, action, pending] = useActionState<AddQuestionState, FormData>(
    boundAction,
    undefined
  );

  const [questionText, setQuestionText] = useState("");
  const [type, setType] = useState<"single-choice" | "multi-choice">("single-choice");
  const [optionsRaw, setOptionsRaw] = useState("");
  const [correctIndexesRaw, setCorrectIndexesRaw] = useState("");
  const [points, setPoints] = useState("1");

  // Derived state pattern: reset inputs only after a successful addition
  const [handledSuccess, setHandledSuccess] = useState(false);
  if (state?.success && !handledSuccess) {
    setHandledSuccess(true);
    setQuestionText("");
    setType("single-choice");
    setOptionsRaw("");
    setCorrectIndexesRaw("");
    setPoints("1");
  } else if (!state?.success && handledSuccess) {
    setHandledSuccess(false);
  }

  return (
    <form action={action} className="mt-4 flex flex-col gap-4 rounded-lg bg-white p-5 shadow-[0_1px_3px_rgba(18,22,28,0.08)]">
      <FormAlert message={state?.message} />

      <div>
        <label htmlFor="questionText" className="block text-sm font-medium text-neutral-900">
          Question
        </label>
        <input
          id="questionText"
          name="questionText"
          type="text"
          value={questionText}
          onChange={(e) => setQuestionText(e.target.value)}
          aria-invalid={!!state?.errors?.questionText}
          className={`mt-1 h-11 w-full rounded-sm border px-3 text-base outline-none transition focus:ring-1 ${
            state?.errors?.questionText
              ? "border-error-600 focus:border-error-600 focus:ring-error-600/30"
              : "border-neutral-200 focus:border-primary-500 focus:ring-primary-500/20"
          }`}
        />
        {state?.errors?.questionText && (
          <p className="mt-1 text-sm font-medium text-error-600">{state.errors.questionText[0]}</p>
        )}
      </div>

      <div>
        <span className="block text-sm font-medium text-neutral-900">Type</span>
        <div className="mt-1 flex gap-4">
          <label className="flex items-center gap-2 text-sm text-neutral-700 cursor-pointer">
            <input
              type="radio"
              name="type"
              value="single-choice"
              checked={type === "single-choice"}
              onChange={() => setType("single-choice")}
            />
            Single choice
          </label>
          <label className="flex items-center gap-2 text-sm text-neutral-700 cursor-pointer">
            <input
              type="radio"
              name="type"
              value="multi-choice"
              checked={type === "multi-choice"}
              onChange={() => setType("multi-choice")}
            />
            Multiple choice
          </label>
        </div>
        {state?.errors?.type && <p className="mt-1 text-sm font-medium text-error-600">{state.errors.type[0]}</p>}
      </div>

      <div>
        <label htmlFor="optionsRaw" className="block text-sm font-medium text-neutral-900">
          Options (one per line)
        </label>
        <textarea
          id="optionsRaw"
          name="optionsRaw"
          rows={4}
          value={optionsRaw}
          onChange={(e) => setOptionsRaw(e.target.value)}
          placeholder={"Option A\nOption B\nOption C"}
          aria-invalid={!!state?.errors?.optionsRaw}
          className={`mt-1 w-full rounded-sm border px-3 py-2 text-base outline-none transition focus:ring-1 ${
            state?.errors?.optionsRaw
              ? "border-error-600 focus:border-error-600 focus:ring-error-600/30"
              : "border-neutral-200 focus:border-primary-500 focus:ring-primary-500/20"
          }`}
        />
        {state?.errors?.optionsRaw && (
          <p className="mt-1 text-sm font-medium text-error-600">{state.errors.optionsRaw[0]}</p>
        )}
      </div>

      <div>
        <label htmlFor="correctIndexesRaw" className="block text-sm font-medium text-neutral-900">
          Correct option number(s)
        </label>
        <input
          id="correctIndexesRaw"
          name="correctIndexesRaw"
          type="text"
          value={correctIndexesRaw}
          onChange={(e) => setCorrectIndexesRaw(e.target.value)}
          placeholder="e.g. 0 for the first option, or 0,2 for multiple"
          aria-invalid={!!state?.errors?.correctIndexesRaw}
          className={`mt-1 h-11 w-full rounded-sm border px-3 text-base outline-none transition focus:ring-1 ${
            state?.errors?.correctIndexesRaw
              ? "border-error-600 focus:border-error-600 focus:ring-error-600/30"
              : "border-neutral-200 focus:border-primary-500 focus:ring-primary-500/20"
          }`}
        />
        <p className="mt-1 text-xs text-neutral-400">
          Options are numbered from 0 in the order you listed them above.
        </p>
        {state?.errors?.correctIndexesRaw && (
          <p className="mt-1 text-sm font-medium text-error-600">{state.errors.correctIndexesRaw[0]}</p>
        )}
      </div>

      <div>
        <label htmlFor="points" className="block text-sm font-medium text-neutral-900">
          Points
        </label>
        <input
          id="points"
          name="points"
          type="number"
          min={1}
          value={points}
          onChange={(e) => setPoints(e.target.value)}
          aria-invalid={!!state?.errors?.points}
          className={`mt-1 h-11 w-full rounded-sm border px-3 text-base outline-none transition focus:ring-1 ${
            state?.errors?.points
              ? "border-error-600 focus:border-error-600 focus:ring-error-600/30"
              : "border-neutral-200 focus:border-primary-500 focus:ring-primary-500/20"
          }`}
        />
        {state?.errors?.points && <p className="mt-1 text-sm font-medium text-error-600">{state.errors.points[0]}</p>}
      </div>

      <button
        type="submit"
        disabled={pending}
        className="h-11 rounded-md border border-primary-700 font-medium text-primary-700 transition hover:bg-primary-100 disabled:opacity-60"
      >
        {pending ? "Adding..." : "Add"}
      </button>
    </form>
  );
}
