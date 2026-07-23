"use client";

import { useActionState } from "react";
import { addQuestionAction } from "@/app/actions/assessments";
import type { AddQuestionState } from "@/lib/definitions";

export function AddQuestionForm({ courseId }: { courseId: string }) {
  const boundAction = addQuestionAction.bind(null, courseId);
  const [state, action, pending] = useActionState<AddQuestionState, FormData>(
    boundAction,
    undefined
  );

  return (
    <form action={action} className="mt-4 flex flex-col gap-4 rounded-lg bg-white p-5">
      <div>
        <label htmlFor="questionText" className="block text-sm font-medium text-neutral-900">
          Question
        </label>
        <input
          id="questionText"
          name="questionText"
          type="text"
          className="mt-1 h-11 w-full rounded-sm border border-neutral-200 px-3 text-base outline-none focus:border-primary-500"
        />
        {state?.errors?.questionText && (
          <p className="mt-1 text-sm text-error-600">{state.errors.questionText[0]}</p>
        )}
      </div>

      <div>
        <span className="block text-sm font-medium text-neutral-900">Type</span>
        <div className="mt-1 flex gap-4">
          <label className="flex items-center gap-2 text-sm text-neutral-700">
            <input type="radio" name="type" value="single-choice" defaultChecked />
            Single choice
          </label>
          <label className="flex items-center gap-2 text-sm text-neutral-700">
            <input type="radio" name="type" value="multi-choice" />
            Multiple choice
          </label>
        </div>
        {state?.errors?.type && <p className="mt-1 text-sm text-error-600">{state.errors.type[0]}</p>}
      </div>

      <div>
        <label htmlFor="optionsRaw" className="block text-sm font-medium text-neutral-900">
          Options (one per line)
        </label>
        <textarea
          id="optionsRaw"
          name="optionsRaw"
          rows={4}
          placeholder={"Option A\nOption B\nOption C"}
          className="mt-1 w-full rounded-sm border border-neutral-200 px-3 py-2 text-base outline-none focus:border-primary-500"
        />
        {state?.errors?.optionsRaw && (
          <p className="mt-1 text-sm text-error-600">{state.errors.optionsRaw[0]}</p>
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
          placeholder="e.g. 0 for the first option, or 0,2 for multiple"
          className="mt-1 h-11 w-full rounded-sm border border-neutral-200 px-3 text-base outline-none focus:border-primary-500"
        />
        <p className="mt-1 text-xs text-neutral-400">
          Options are numbered from 0 in the order you listed them above.
        </p>
        {state?.errors?.correctIndexesRaw && (
          <p className="mt-1 text-sm text-error-600">{state.errors.correctIndexesRaw[0]}</p>
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
          defaultValue={1}
          className="mt-1 h-11 w-full rounded-sm border border-neutral-200 px-3 text-base outline-none focus:border-primary-500"
        />
        {state?.errors?.points && <p className="mt-1 text-sm text-error-600">{state.errors.points[0]}</p>}
      </div>

      {state?.message && <p className="text-sm text-error-600">{state.message}</p>}

      <button
        type="submit"
        disabled={pending}
        className="h-11 rounded-md border border-primary-700 font-medium text-primary-700 transition hover:bg-primary-100 disabled:opacity-60"
      >
        {pending ? "Adding..." : "Add question"}
      </button>
    </form>
  );
}
