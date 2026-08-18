"use client";

import { useActionState, useState } from "react";
import { createCourse } from "@/app/actions/courses";
import { CATEGORIES } from "@/lib/categories";
import type { CreateCourseState } from "@/lib/definitions";
import { FormAlert } from "@/components/FormAlert";

export function NewCourseForm() {
  const [state, action, pending] = useActionState<CreateCourseState, FormData>(
    createCourse,
    undefined
  );

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [level, setLevel] = useState("beginner");
  const [tags, setTags] = useState("");
  const [priceNaira, setPriceNaira] = useState("0");
  const [language, setLanguage] = useState("en");
  const [passThresholdPercent, setPassThresholdPercent] = useState("70");
  const [maxAttempts, setMaxAttempts] = useState("3");

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-heading text-2xl font-bold text-primary-900">Create a course</h1>
      <p className="mt-1 text-sm text-neutral-700">
        Start with a draft — you can add lessons and submit it for review once it&apos;s ready.
      </p>

      <form action={action} className="mt-8 flex flex-col gap-5 rounded-lg bg-white p-6 shadow-[0_1px_3px_rgba(18,22,28,0.08)]">
        <FormAlert message={state?.message} />

        <Field label="Title" name="title" error={state?.errors?.title?.[0]}>
          <input
            id="title"
            name="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            aria-invalid={!!state?.errors?.title}
            className={`mt-1 h-11 w-full rounded-sm border px-3 text-base outline-none transition focus:ring-1 ${
              state?.errors?.title
                ? "border-error-600 focus:border-error-600 focus:ring-error-600/30"
                : "border-neutral-200 focus:border-primary-500 focus:ring-primary-500/20"
            }`}
          />
        </Field>

        <Field label="Description" name="description" error={state?.errors?.description?.[0]}>
          <textarea
            id="description"
            name="description"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            aria-invalid={!!state?.errors?.description}
            className={`mt-1 w-full rounded-sm border px-3 py-2 text-base outline-none transition focus:ring-1 ${
              state?.errors?.description
                ? "border-error-600 focus:border-error-600 focus:ring-error-600/30"
                : "border-neutral-200 focus:border-primary-500 focus:ring-primary-500/20"
            }`}
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Category" name="category" error={state?.errors?.category?.[0]}>
            <select
              id="category"
              name="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              aria-invalid={!!state?.errors?.category}
              className={`mt-1 h-11 w-full rounded-sm border px-3 text-base outline-none transition focus:ring-1 ${
                state?.errors?.category
                  ? "border-error-600 focus:border-error-600 focus:ring-error-600/30"
                  : "border-neutral-200 focus:border-primary-500 focus:ring-primary-500/20"
              }`}
            >
              <option value="" disabled>
                Choose a category
              </option>
              {CATEGORIES.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Level" name="level" error={state?.errors?.level?.[0]}>
            <select
              id="level"
              name="level"
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              aria-invalid={!!state?.errors?.level}
              className={`mt-1 h-11 w-full rounded-sm border px-3 text-base outline-none transition focus:ring-1 ${
                state?.errors?.level
                  ? "border-error-600 focus:border-error-600 focus:ring-error-600/30"
                  : "border-neutral-200 focus:border-primary-500 focus:ring-primary-500/20"
              }`}
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </Field>
        </div>

        <Field label="Tags (comma-separated)" name="tags" error={state?.errors?.tags?.[0]}>
          <input
            id="tags"
            name="tags"
            type="text"
            placeholder="e.g. react, frontend, javascript"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            aria-invalid={!!state?.errors?.tags}
            className={`mt-1 h-11 w-full rounded-sm border px-3 text-base outline-none transition focus:ring-1 ${
              state?.errors?.tags
                ? "border-error-600 focus:border-error-600 focus:ring-error-600/30"
                : "border-neutral-200 focus:border-primary-500 focus:ring-primary-500/20"
            }`}
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Price (NGN)" name="priceNaira" error={state?.errors?.priceNaira?.[0]}>
            <input
              id="priceNaira"
              name="priceNaira"
              type="number"
              min="0"
              step="1"
              value={priceNaira}
              onChange={(e) => setPriceNaira(e.target.value)}
              aria-invalid={!!state?.errors?.priceNaira}
              className={`mt-1 h-11 w-full rounded-sm border px-3 text-base outline-none transition focus:ring-1 ${
                state?.errors?.priceNaira
                  ? "border-error-600 focus:border-error-600 focus:ring-error-600/30"
                  : "border-neutral-200 focus:border-primary-500 focus:ring-primary-500/20"
              }`}
            />
          </Field>

          <Field label="Language" name="language" error={state?.errors?.language?.[0]}>
            <select
              id="language"
              name="language"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              aria-invalid={!!state?.errors?.language}
              className={`mt-1 h-11 w-full rounded-sm border px-3 text-base outline-none transition focus:ring-1 ${
                state?.errors?.language
                  ? "border-error-600 focus:border-error-600 focus:ring-error-600/30"
                  : "border-neutral-200 focus:border-primary-500 focus:ring-primary-500/20"
              }`}
            >
              <option value="en">English</option>
              <option value="yo">Yoruba</option>
              <option value="ha">Hausa</option>
              <option value="ig">Igbo</option>
            </select>
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field
            label="Pass threshold (%)"
            name="passThresholdPercent"
            error={state?.errors?.passThresholdPercent?.[0]}
          >
            <input
              id="passThresholdPercent"
              name="passThresholdPercent"
              type="number"
              min="1"
              max="100"
              value={passThresholdPercent}
              onChange={(e) => setPassThresholdPercent(e.target.value)}
              aria-invalid={!!state?.errors?.passThresholdPercent}
              className={`mt-1 h-11 w-full rounded-sm border px-3 text-base outline-none transition focus:ring-1 ${
                state?.errors?.passThresholdPercent
                  ? "border-error-600 focus:border-error-600 focus:ring-error-600/30"
                  : "border-neutral-200 focus:border-primary-500 focus:ring-primary-500/20"
              }`}
            />
          </Field>

          <Field
            label="Quiz attempts allowed"
            name="maxAttempts"
            error={state?.errors?.maxAttempts?.[0]}
          >
            <input
              id="maxAttempts"
              name="maxAttempts"
              type="number"
              min="1"
              value={maxAttempts}
              onChange={(e) => setMaxAttempts(e.target.value)}
              aria-invalid={!!state?.errors?.maxAttempts}
              className={`mt-1 h-11 w-full rounded-sm border px-3 text-base outline-none transition focus:ring-1 ${
                state?.errors?.maxAttempts
                  ? "border-error-600 focus:border-error-600 focus:ring-error-600/30"
                  : "border-neutral-200 focus:border-primary-500 focus:ring-primary-500/20"
              }`}
            />
          </Field>
        </div>

        <button
          type="submit"
          disabled={pending}
          className="h-11 rounded-md bg-primary-700 font-medium text-white transition hover:bg-primary-900 disabled:opacity-60"
        >
          {pending ? "Creating..." : "Create draft"}
        </button>
      </form>
    </div>
  );
}

function Field({
  label,
  name,
  error,
  children,
}: {
  label: string;
  name: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-neutral-900">
        {label}
      </label>
      {children}
      {error && <p className="mt-1 text-sm font-medium text-error-600">{error}</p>}
    </div>
  );
}
