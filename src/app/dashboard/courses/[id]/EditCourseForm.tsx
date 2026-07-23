"use client";

import { useActionState } from "react";
import { editCourse } from "@/app/actions/courses";
import { CATEGORIES } from "@/lib/categories";
import type { CreateCourseState } from "@/lib/definitions";
import type { Course } from "@/lib/courses";

export function EditCourseForm({ course }: { course: Course }) {
  const boundAction = editCourse.bind(null, course.id);
  const [state, action, pending] = useActionState<CreateCourseState, FormData>(
    boundAction,
    undefined
  );

  return (
    <form
      action={action}
      className="mt-4 flex flex-col gap-5 rounded-lg bg-white p-6 shadow-[0_1px_3px_rgba(18,22,28,0.08)]"
    >
      <Field label="Title" name="title" error={state?.errors?.title?.[0]}>
        <input
          id="title"
          name="title"
          type="text"
          defaultValue={course.title}
          className="mt-1 h-11 w-full rounded-sm border border-neutral-200 px-3 text-base outline-none focus:border-primary-500"
        />
      </Field>

      <Field label="Description" name="description" error={state?.errors?.description?.[0]}>
        <textarea
          id="description"
          name="description"
          rows={4}
          defaultValue={course.description}
          className="mt-1 w-full rounded-sm border border-neutral-200 px-3 py-2 text-base outline-none focus:border-primary-500"
        />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Category" name="category" error={state?.errors?.category?.[0]}>
          <select
            id="category"
            name="category"
            defaultValue={course.category}
            className="mt-1 h-11 w-full rounded-sm border border-neutral-200 px-3 text-base outline-none focus:border-primary-500"
          >
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
            defaultValue={course.level}
            className="mt-1 h-11 w-full rounded-sm border border-neutral-200 px-3 text-base outline-none focus:border-primary-500"
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
          defaultValue={course.tags.join(", ")}
          placeholder="e.g. react, frontend, javascript"
          className="mt-1 h-11 w-full rounded-sm border border-neutral-200 px-3 text-base outline-none focus:border-primary-500"
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
            defaultValue={course.price / 100}
            className="mt-1 h-11 w-full rounded-sm border border-neutral-200 px-3 text-base outline-none focus:border-primary-500"
          />
        </Field>

        <Field label="Language" name="language" error={state?.errors?.language?.[0]}>
          <select
            id="language"
            name="language"
            defaultValue={course.language}
            className="mt-1 h-11 w-full rounded-sm border border-neutral-200 px-3 text-base outline-none focus:border-primary-500"
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
            defaultValue={course.passThresholdPercent}
            className="mt-1 h-11 w-full rounded-sm border border-neutral-200 px-3 text-base outline-none focus:border-primary-500"
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
            defaultValue={course.maxAttempts}
            className="mt-1 h-11 w-full rounded-sm border border-neutral-200 px-3 text-base outline-none focus:border-primary-500"
          />
        </Field>
      </div>

      {state?.message && <p className="text-sm text-error-600">{state.message}</p>}
      {state?.success && <p className="text-sm text-success-600">Course details saved.</p>}

      <button
        type="submit"
        disabled={pending}
        className="h-11 self-start rounded-md bg-primary-700 px-6 font-medium text-white transition hover:bg-primary-900 disabled:opacity-60"
      >
        {pending ? "Saving..." : "Save changes"}
      </button>
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
      {error && <p className="mt-1 text-sm text-error-600">{error}</p>}
    </div>
  );
}
