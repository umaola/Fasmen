"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { submitTutorVerification } from "@/app/actions/kyc";
import type { TutorVerificationState } from "@/lib/definitions";
import type { TutorIdType } from "@/lib/users";

const ID_TYPE_LABELS: Record<TutorIdType, string> = {
  nin: "National Identification Number (NIN)",
  "voters-card": "Voter's Card",
  passport: "International Passport",
  "drivers-license": "Driver's License",
};

export function VerificationForm({
  idType,
  idNumber,
  bio,
  username,
}: {
  idType: TutorIdType | null;
  idNumber: string | null;
  bio: string;
  username: string | null;
}) {
  const [state, action, pending] = useActionState<TutorVerificationState, FormData>(
    submitTutorVerification,
    undefined
  );
  const [usernameValue, setUsernameValue] = useState(username ?? "");

  return (
    <form action={action} className="mt-8 flex max-w-xl flex-col gap-6">
      <div>
        <label htmlFor="idType" className="block text-sm font-medium text-neutral-900">
          ID type
        </label>
        <select
          id="idType"
          name="idType"
          autoFocus
          defaultValue={idType ?? ""}
          className="mt-1 h-11 w-full rounded-sm border border-neutral-200 px-3 text-base outline-none focus:border-primary-500"
        >
          <option value="" disabled>
            Choose an ID type
          </option>
          {Object.entries(ID_TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        {state?.errors?.idType && (
          <p className="mt-1 text-sm text-error-600">{state.errors.idType[0]}</p>
        )}
      </div>

      <div>
        <label htmlFor="idNumber" className="block text-sm font-medium text-neutral-900">
          ID number
        </label>
        <input
          id="idNumber"
          name="idNumber"
          type="text"
          inputMode="numeric"
          defaultValue={idNumber ?? ""}
          className="mt-1 h-11 w-full rounded-sm border border-neutral-200 px-3 text-base outline-none focus:border-primary-500"
        />
        <p className="mt-1 text-xs text-neutral-400">
          Used only to verify your account — never shown publicly.
        </p>
        {state?.errors?.idNumber && (
          <p className="mt-1 text-sm text-error-600">{state.errors.idNumber[0]}</p>
        )}
      </div>

      <div>
        <label htmlFor="bio" className="block text-sm font-medium text-neutral-900">
          Bio
        </label>
        <textarea
          id="bio"
          name="bio"
          rows={4}
          defaultValue={bio}
          placeholder="Tell students about your background and expertise."
          className="mt-1 w-full rounded-sm border border-neutral-200 px-3 py-2 text-base outline-none focus:border-primary-500"
        />
        <p className="mt-1 text-xs text-neutral-400">This appears on your public portfolio.</p>
        {state?.errors?.bio && <p className="mt-1 text-sm text-error-600">{state.errors.bio[0]}</p>}
      </div>

      <div>
        <label htmlFor="username" className="block text-sm font-medium text-neutral-900">
          Username
        </label>
        <input
          id="username"
          name="username"
          type="text"
          autoComplete="off"
          value={usernameValue}
          onChange={(e) => setUsernameValue(e.target.value)}
          className="mt-1 h-11 w-full rounded-sm border border-neutral-200 px-3 text-base outline-none focus:border-primary-500"
        />
        <p className="mt-1 text-xs text-neutral-700">
          Your portfolio link:{" "}
          <span className="font-medium text-primary-900">
            fasmen.com/tutors/{usernameValue || "your-username"}
          </span>
        </p>
        {state?.errors?.username && (
          <p className="mt-1 text-sm text-error-600">{state.errors.username[0]}</p>
        )}
      </div>

      {state?.message && <p className="text-sm text-error-600">{state.message}</p>}
      {state?.success && <p className="text-sm text-success-600">Verification complete.</p>}

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={pending}
          className="h-11 rounded-md bg-primary-700 px-6 font-medium text-white transition hover:bg-primary-900 disabled:opacity-60"
        >
          {pending ? "Saving..." : "Complete registration"}
        </button>
        <Link href="/dashboard" className="text-sm font-medium text-neutral-700 hover:text-primary-700">
          Skip for now
        </Link>
      </div>
    </form>
  );
}
