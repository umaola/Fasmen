"use client";

import { useActionState, useState } from "react";
import { editCourse } from "@/app/actions/courses";
import { CATEGORIES } from "@/lib/categories";
import type { CreateCourseState } from "@/lib/definitions";
import type { Course } from "@/lib/courses";
import { FormAlert } from "@/components/FormAlert";

import { CourseWizardNav } from "../CourseWizardNav";

export function EditCourseForm({
  course,
  showWizardNav = true,
}: {
  course: Course;
  showWizardNav?: boolean;
}) {
  const boundAction = editCourse.bind(null, course.id);
  const [state, action, pending] = useActionState<CreateCourseState, FormData>(
    boundAction,
    undefined
  );

  const [title, setTitle] = useState(course.title);
  const [description, setDescription] = useState(course.description);
  const [category, setCategory] = useState(course.category);
  const [level, setLevel] = useState(course.level);
  const [tags, setTags] = useState(course.tags.join(", "));
  const [priceNaira, setPriceNaira] = useState(String(course.price / 100));
  const [language, setLanguage] = useState(course.language);
  const [passThresholdPercent, setPassThresholdPercent] = useState(
    String(course.passThresholdPercent)
  );
  const [maxAttempts, setMaxAttempts] = useState(String(course.maxAttempts));

  return (
    <form
      action={action}
      className="flex flex-col gap-5 rounded-xl bg-white p-6 sm:p-8 shadow-[0_1px_3px_rgba(18,22,28,0.08)] border border-neutral-200/80"
    >
      <div>
        <h2 className="font-heading text-xl font-bold text-primary-900">Step 1: Course details</h2>
        <p className="mt-1 text-sm text-neutral-700">
          Update the basic info, categories, and assessment criteria for this course.
        </p>
      </div>

      <FormAlert message={state?.message} />
      {state?.success && <FormAlert type="success" message="Course details saved successfully." />}

      <Field label="Course title" name="title" error={state?.errors?.title?.[0]}>
        <input
          id="title"
          name="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          aria-invalid={!!state?.errors?.title}
          className={`mt-1 h-11 w-full rounded-md border px-3 text-base outline-none transition focus:ring-2 ${
            state?.errors?.title
              ? "border-error-600 focus:border-error-600 focus:ring-error-600/30"
              : "border-neutral-200 focus:border-primary-500 focus:ring-primary-500/20"
          }`}
        />
      </Field>

      <Field label="Course description" name="description" error={state?.errors?.description?.[0]}>
        <textarea
          id="description"
          name="description"
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          aria-invalid={!!state?.errors?.description}
          className={`mt-1 w-full rounded-md border px-3 py-2 text-base outline-none transition focus:ring-2 ${
            state?.errors?.description
              ? "border-error-600 focus:border-error-600 focus:ring-error-600/30"
              : "border-neutral-200 focus:border-primary-500 focus:ring-primary-500/20"
          }`}
        />
      </Field>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Category" name="category" error={state?.errors?.category?.[0]}>
          <select
            id="category"
            name="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            aria-invalid={!!state?.errors?.category}
            className={`mt-1 h-11 w-full rounded-md border px-3 text-base outline-none transition focus:ring-2 ${
              state?.errors?.category
                ? "border-error-600 focus:border-error-600 focus:ring-error-600/30"
                : "border-neutral-200 focus:border-primary-500 focus:ring-primary-500/20"
            }`}
          >
            {CATEGORIES.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Experience level" name="level" error={state?.errors?.level?.[0]}>
          <select
            id="level"
            name="level"
            value={level}
            onChange={(e) => setLevel(e.target.value as Course["level"])}
            aria-invalid={!!state?.errors?.level}
            className={`mt-1 h-11 w-full rounded-md border px-3 text-base outline-none transition focus:ring-2 ${
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
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="e.g. react, frontend, javascript"
          aria-invalid={!!state?.errors?.tags}
          className={`mt-1 h-11 w-full rounded-md border px-3 text-base outline-none transition focus:ring-2 ${
            state?.errors?.tags
              ? "border-error-600 focus:border-error-600 focus:ring-error-600/30"
              : "border-neutral-200 focus:border-primary-500 focus:ring-primary-500/20"
          }`}
        />
      </Field>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Price in Naira (NGN)" name="priceNaira" error={state?.errors?.priceNaira?.[0]}>
          <input
            id="priceNaira"
            name="priceNaira"
            type="number"
            min="0"
            step="1"
            value={priceNaira}
            onChange={(e) => setPriceNaira(e.target.value)}
            aria-invalid={!!state?.errors?.priceNaira}
            className={`mt-1 h-11 w-full rounded-md border px-3 text-base outline-none transition focus:ring-2 ${
              state?.errors?.priceNaira
                ? "border-error-600 focus:border-error-600 focus:ring-error-600/30"
                : "border-neutral-200 focus:border-primary-500 focus:ring-primary-500/20"
            }`}
          />
        </Field>

        <Field label="Course language" name="language" error={state?.errors?.language?.[0]}>
          <select
            id="language"
            name="language"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            aria-invalid={!!state?.errors?.language}
            className={`mt-1 h-11 w-full rounded-md border px-3 text-base outline-none transition focus:ring-2 ${
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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field
          label="Assessment pass threshold (%)"
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
            className={`mt-1 h-11 w-full rounded-md border px-3 text-base outline-none transition focus:ring-2 ${
              state?.errors?.passThresholdPercent
                ? "border-error-600 focus:border-error-600 focus:ring-error-600/30"
                : "border-neutral-200 focus:border-primary-500 focus:ring-primary-500/20"
            }`}
          />
        </Field>

        <Field
          label="Assessment attempt limit"
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
            className={`mt-1 h-11 w-full rounded-md border px-3 text-base outline-none transition focus:ring-2 ${
              state?.errors?.maxAttempts
                ? "border-error-600 focus:border-error-600 focus:ring-error-600/30"
                : "border-neutral-200 focus:border-primary-500 focus:ring-primary-500/20"
            }`}
          />
        </Field>
      </div>

      {showWizardNav ? (
        <CourseWizardNav
          courseId={course.id}
          currentStep={1}
          proceedType="submit"
          proceedLabel={state?.success ? "Proceed to Media" : "Save & proceed to Media"}
          proceedHref={`/dashboard/courses/${course.id}?step=2`}
          pending={pending}
        />
      ) : (
        <button
          type="submit"
          disabled={pending}
          className="h-11 self-start rounded-md bg-primary-700 px-6 font-medium text-white transition hover:bg-primary-900 disabled:opacity-60 cursor-pointer"
        >
          {pending ? "Saving..." : "Save changes"}
        </button>
      )}
    </form>
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
