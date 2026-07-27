"use client";

import { useActionState } from "react";
import { updateProfile } from "@/app/actions/profile";
import type { UpdateProfileState } from "@/lib/definitions";

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

  return (
    <form
      action={action}
      className="mt-4 flex flex-col gap-5 rounded-lg bg-white p-6 shadow-[0_1px_3px_rgba(18,22,28,0.08)]"
    >
      <div>
        <label htmlFor="displayName" className="block text-sm font-medium text-neutral-900">
          Name
        </label>
        <input
          id="displayName"
          name="displayName"
          type="text"
          defaultValue={displayName}
          className="mt-1 h-11 w-full rounded-sm border border-neutral-200 px-3 text-base outline-none focus:border-primary-500"
        />
        {state?.errors?.displayName && (
          <p className="mt-1 text-sm text-error-600">{state.errors.displayName[0]}</p>
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
          defaultValue={bio}
          placeholder="Tell students about your background and expertise — this shows up on your course pages."
          className="mt-1 w-full rounded-sm border border-neutral-200 px-3 py-2 text-base outline-none focus:border-primary-500"
        />
        {state?.errors?.bio && <p className="mt-1 text-sm text-error-600">{state.errors.bio[0]}</p>}
      </div>

      {state?.message && <p className="text-sm text-error-600">{state.message}</p>}
      {state?.success && <p className="text-sm text-success-600">Profile updated.</p>}

      <button
        type="submit"
        disabled={pending}
        className="h-11 rounded-md bg-primary-700 font-medium text-white transition hover:bg-primary-900 disabled:opacity-60"
      >
        {pending ? "Saving..." : "Save changes"}
      </button>
    </form>
  );
}
