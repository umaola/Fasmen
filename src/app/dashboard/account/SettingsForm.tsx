"use client";

import { useActionState, useState } from "react";
import { updateProfile } from "@/app/actions/profile";
import type { UpdateProfileState } from "@/lib/definitions";
import { FormAlert } from "@/components/FormAlert";

export function SettingsForm({
  displayName,
  bio,
}: {
  displayName: string;
  bio: string;
}) {
  const [state, action, pending] = useActionState<UpdateProfileState, FormData>(
    updateProfile,
    undefined
  );
  const [nameValue, setNameValue] = useState(displayName);
  const [bioValue, setBioValue] = useState(bio);

  return (
    <form
      action={action}
      className="mt-4 flex flex-col gap-5 rounded-lg bg-white p-6 shadow-[0_1px_3px_rgba(18,22,28,0.08)]"
    >
      <FormAlert message={state?.message} />
      {state?.success && <FormAlert type="success" message="Profile updated." />}

      <div>
        <label htmlFor="displayName" className="block text-sm font-medium text-neutral-900">
          Name
        </label>
        <input
          id="displayName"
          name="displayName"
          type="text"
          value={nameValue}
          onChange={(e) => setNameValue(e.target.value)}
          aria-invalid={!!state?.errors?.displayName}
          className={`mt-1 h-11 w-full rounded-sm border px-3 text-base outline-none transition focus:ring-1 ${
            state?.errors?.displayName
              ? "border-error-600 focus:border-error-600 focus:ring-error-600/30"
              : "border-neutral-200 focus:border-primary-500 focus:ring-primary-500/20"
          }`}
        />
        {state?.errors?.displayName && (
          <p className="mt-1 text-sm font-medium text-error-600">{state.errors.displayName[0]}</p>
        )}
      </div>

      <div>
        <label htmlFor="bio" className="block text-sm font-medium text-neutral-900">
          Bio
        </label>
        <textarea
          id="bio"
          name="bio"
          rows={5}
          value={bioValue}
          onChange={(e) => setBioValue(e.target.value)}
          placeholder="Tell students about your background and expertise — this shows up on your course pages."
          aria-invalid={!!state?.errors?.bio}
          className={`mt-1 w-full rounded-sm border px-3 py-2 text-base outline-none transition focus:ring-1 ${
            state?.errors?.bio
              ? "border-error-600 focus:border-error-600 focus:ring-error-600/30"
              : "border-neutral-200 focus:border-primary-500 focus:ring-primary-500/20"
          }`}
        />
        {state?.errors?.bio && <p className="mt-1 text-sm font-medium text-error-600">{state.errors.bio[0]}</p>}
      </div>

      <button
        type="submit"
        disabled={pending}
        className="h-11 rounded-md bg-primary-700 font-medium text-white transition hover:bg-primary-900 disabled:opacity-60"
      >
        {pending ? "Saving..." : "Save"}
      </button>
    </form>
  );
}
