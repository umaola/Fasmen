"use client";

import { useState } from "react";
import { useActionState } from "react";
import { submitAssessmentAction, type SubmitAssessmentResult } from "@/app/actions/assessments";
import type { Question } from "@/lib/assessments";
import { FormAlert } from "@/components/FormAlert";

type ClientQuestion = Omit<Question, "correctOptionIndexes">;

export function QuizForm({
  courseId,
  slug,
  questions,
  passThresholdPercent,
  attemptsRemaining,
}: {
  courseId: string;
  slug: string;
  questions: ClientQuestion[];
  passThresholdPercent: number;
  attemptsRemaining: number;
}) {
  const [answers, setAnswers] = useState<Record<string, number[]>>({});
  const boundAction = submitAssessmentAction.bind(null, courseId, slug);
  const [state, action, pending] = useActionState<SubmitAssessmentResult | undefined, FormData>(
    boundAction,
    undefined
  );

  if (state && "scorePercent" in state) {
    return (
      <div className="mt-6 rounded-lg bg-white p-6 shadow-[0_1px_3px_rgba(18,22,28,0.08)]">
        <p
          className={`font-heading text-3xl font-bold ${
            state.passed ? "text-success-600" : "text-warning-600"
          }`}
        >
          {state.scorePercent}%
        </p>
        <p className="mt-2 text-sm text-neutral-700">
          Pass threshold: {passThresholdPercent}% —{" "}
          {state.passed ? "you passed!" : `${state.attemptsRemaining} attempt(s) remaining.`}
        </p>
      </div>
    );
  }

  function toggleAnswer(question: ClientQuestion, optionIndex: number) {
    setAnswers((prev) => {
      const current = prev[question.id] ?? [];
      if (question.type === "single-choice") {
        return { ...prev, [question.id]: [optionIndex] };
      }
      const next = current.includes(optionIndex)
        ? current.filter((i) => i !== optionIndex)
        : [...current, optionIndex];
      return { ...prev, [question.id]: next };
    });
  }

  const answersPayload = questions.map((q) => ({
    questionId: q.id,
    selectedOptionIndexes: answers[q.id] ?? [],
  }));

  return (
    <form action={action} className="mt-6 flex flex-col gap-4">
      <input type="hidden" name="answersJson" value={JSON.stringify(answersPayload)} readOnly />

      {questions.map((question, index) => (
        <div
          key={question.id}
          className="rounded-lg bg-white p-5 shadow-[0_1px_3px_rgba(18,22,28,0.08)]"
        >
          <p className="font-medium text-neutral-900">
            {index + 1}. {question.questionText}
          </p>
          <div className="mt-3 flex flex-col gap-2">
            {question.options.map((option, i) => (
              <label key={i} className="flex items-center gap-2 text-sm text-neutral-700">
                <input
                  type={question.type === "single-choice" ? "radio" : "checkbox"}
                  name={`q-${question.id}`}
                  checked={(answers[question.id] ?? []).includes(i)}
                  onChange={() => toggleAnswer(question, i)}
                />
                {option}
              </label>
            ))}
          </div>
        </div>
      ))}

      {state && "error" in state && <FormAlert message={state.error} />}

      <button
        type="submit"
        disabled={pending}
        className="h-11 self-start rounded-md bg-primary-700 px-6 font-medium text-white transition hover:bg-primary-900 disabled:opacity-60"
      >
        {pending ? "Submitting..." : `Submit (${attemptsRemaining} attempt(s) remaining)`}
      </button>
    </form>
  );
}
