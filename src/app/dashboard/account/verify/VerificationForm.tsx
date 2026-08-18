"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { submitTutorVerification } from "@/app/actions/kyc";
import type { TutorVerificationState } from "@/lib/definitions";
import type { TutorIdType } from "@/lib/users";
import { FormAlert } from "@/components/FormAlert";

const ID_TYPE_LABELS: Record<TutorIdType, string> = {
  nin: "National Identification Number (NIN)",
  "voters-card": "Voter's Card",
  passport: "International Passport",
  "drivers-license": "Driver's License",
};

const USERNAME_PATTERN = /^[a-z0-9-]{3,30}$/i;

type AvailabilityStatus =
  | { kind: "idle" }
  | { kind: "checking" }
  | { kind: "available" }
  | { kind: "taken"; suggestion: string | null };

interface AvailabilityResult {
  username: string;
  taken: boolean;
  suggestion: string | null;
}

function useUsernameAvailability(
  username: string,
  savedUsername: string | null
): AvailabilityStatus {
  // Only the async fetch result lives in state; everything else is derived
  // during render, so the effect never sets state synchronously.
  const [result, setResult] = useState<AvailabilityResult | null>(null);

  const trimmed = username.trim();
  // Nothing typed, unchanged from their saved name, or not yet a valid
  // shape — the format error is the schema's job at submit, not ours.
  const shouldCheck = !!trimmed && trimmed !== savedUsername && USERNAME_PATTERN.test(trimmed);

  useEffect(() => {
    if (!shouldCheck) return;

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/username-availability?username=${encodeURIComponent(trimmed)}`,
          { signal: controller.signal }
        );
        if (!res.ok) return;
        const data = await res.json();
        if (data.invalid) return;
        setResult({ username: trimmed, taken: !data.available, suggestion: data.suggestion ?? null });
      } catch {
        // Aborted by a newer keystroke, or network hiccup — stay quiet.
      }
    }, 400);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [shouldCheck, trimmed]);

  if (!shouldCheck) return { kind: "idle" };
  if (!result || result.username !== trimmed) return { kind: "checking" };
  return result.taken
    ? { kind: "taken", suggestion: result.suggestion }
    : { kind: "available" };
}

// Identity numbers are sensitive, so the saved value is shown the same way
// the payout account shows an account number — last 4 digits only.
function maskIdNumber(value: string): string {
  const visible = value.slice(-4);
  return `•••• ${visible}`;
}

function DetailCard({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg bg-white p-5 shadow-[0_1px_3px_rgba(18,22,28,0.08)]">
      <p className="text-sm text-neutral-700">{label}</p>
      <div className="mt-1 font-medium break-words text-neutral-900">{children}</div>
    </div>
  );
}

export function VerificationForm({
  idType,
  idNumber,
  bio,
  username,
  verified,
}: {
  idType: TutorIdType | null;
  idNumber: string | null;
  bio: string;
  username: string | null;
  verified: boolean;
}) {
  const [state, action, pending] = useActionState<TutorVerificationState, FormData>(
    submitTutorVerification,
    undefined
  );
  const [idTypeValue, setIdTypeValue] = useState<string>(idType ?? "");
  const [idNumberValue, setIdNumberValue] = useState<string>(idNumber ?? "");
  const [bioValue, setBioValue] = useState<string>(bio ?? "");
  const [usernameValue, setUsernameValue] = useState(username ?? "");
  const availability = useUsernameAvailability(usernameValue, username);

  // Sync state when props change (React-recommended pattern instead of useEffect)
  const [prevProps, setPrevProps] = useState({ idType, idNumber, bio, username });
  if (
    prevProps.idType !== idType ||
    prevProps.idNumber !== idNumber ||
    prevProps.bio !== bio ||
    prevProps.username !== username
  ) {
    setPrevProps({ idType, idNumber, bio, username });
    setIdTypeValue(idType ?? "");
    setIdNumberValue(idNumber ?? "");
    setBioValue(bio ?? "");
    setUsernameValue(username ?? "");
  }

  // Unverified tutors land straight in the form; verified ones see their
  // saved details until they choose to edit.
  const [editing, setEditing] = useState(!verified);
  const [successOpen, setSuccessOpen] = useState(false);

  // Derived-state-during-render (React's recommended alternative to an
  // effect): the render right after a successful save, drop out of edit mode
  // and raise the confirmation dialog.
  const [handledSuccess, setHandledSuccess] = useState(false);
  if (state?.success && !handledSuccess) {
    setHandledSuccess(true);
    setEditing(false);
    setSuccessOpen(true);
  } else if (!state?.success && handledSuccess) {
    setHandledSuccess(false);
  }

  // An ID that's already on file is fixed — changing it would invalidate the
  // verification it was accepted for.
  const idLocked = !!idType && !!idNumber;

  const successDialog = successOpen && (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-6">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="verification-success-title"
        className="w-full max-w-md rounded-lg bg-white p-8 text-center shadow-[0_1px_3px_rgba(18,22,28,0.08)]"
      >
        <h2
          id="verification-success-title"
          className="font-heading text-xl font-bold text-primary-900"
        >
          You&apos;re verified
        </h2>
        <p className="mt-2 text-sm text-neutral-700">
          Your details are saved and your public portfolio is live at{" "}
          <span className="font-medium text-primary-900">
            fasmen.com/tutors/{usernameValue.trim()}
          </span>
          .
        </p>
        <div className="mt-6 flex flex-col gap-3">
          <button
            type="button"
            onClick={() => setSuccessOpen(false)}
            className="h-11 rounded-md bg-primary-700 font-medium text-white transition hover:bg-primary-900"
          >
            Done
          </button>
          <Link
            href={`/tutors/${usernameValue.trim()}`}
            className="inline-flex h-11 items-center justify-center rounded-md text-sm font-medium text-neutral-700 transition hover:bg-neutral-100"
          >
            View my portfolio
          </Link>
        </div>
      </div>
    </div>
  );

  if (!editing) {
    return (
      <>
        <div className="mt-6 flex items-center justify-between gap-4">
          <h3 className="font-heading text-base font-semibold text-primary-900">Your details</h3>
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="h-9 shrink-0 rounded-md border border-primary-700 px-4 text-sm font-medium text-primary-700 transition hover:bg-primary-100"
          >
            Edit
          </button>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <DetailCard label="ID type">{idType ? ID_TYPE_LABELS[idType] : "—"}</DetailCard>
          <DetailCard label="ID number">{idNumber ? maskIdNumber(idNumber) : "—"}</DetailCard>
          <DetailCard label="Username">{username ?? "—"}</DetailCard>
          <DetailCard label="Portfolio link">
            {username ? (
              <Link href={`/tutors/${username}`} className="text-primary-700 hover:underline">
                fasmen.com/tutors/{username}
              </Link>
            ) : (
              "—"
            )}
          </DetailCard>
          <div className="sm:col-span-2">
            <DetailCard label="Bio">
              <span className="whitespace-pre-line">{bio || "—"}</span>
            </DetailCard>
          </div>
        </div>

        {successDialog}
      </>
    );
  }

  return (
    <>
      <form
        action={action}
        className="mt-6 flex flex-col gap-6 rounded-lg bg-white p-6 shadow-[0_1px_3px_rgba(18,22,28,0.08)]"
      >
        <FormAlert message={state?.message} />

        {idLocked ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <span className="block text-sm font-medium text-neutral-900">ID type</span>
              <p className="mt-1 text-base text-neutral-700">{ID_TYPE_LABELS[idType]}</p>
            </div>
            <div>
              <span className="block text-sm font-medium text-neutral-900">ID number</span>
              <p className="mt-1 text-base text-neutral-700">{maskIdNumber(idNumber)}</p>
            </div>
            <p className="text-xs text-neutral-400 sm:col-span-2">
              Your ID can&apos;t be changed once it&apos;s been verified. Contact support if it
              needs correcting.
            </p>
            <input type="hidden" name="idType" value={idType} />
            <input type="hidden" name="idNumber" value={idNumber} />
          </div>
        ) : (
          <>
            <div>
              <label htmlFor="idType" className="block text-sm font-medium text-neutral-900">
                ID type
              </label>
              <select
                id="idType"
                name="idType"
                autoFocus
                value={idTypeValue}
                onChange={(e) => setIdTypeValue(e.target.value)}
                aria-invalid={!!state?.errors?.idType}
                className={`mt-1 h-11 w-full rounded-sm border px-3 text-base outline-none transition focus:ring-1 ${
                  state?.errors?.idType
                    ? "border-error-600 focus:border-error-600 focus:ring-error-600/30"
                    : "border-neutral-200 focus:border-primary-500 focus:ring-primary-500/20"
                }`}
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
                <p className="mt-1 text-sm font-medium text-error-600">{state.errors.idType[0]}</p>
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
                value={idNumberValue}
                onChange={(e) => setIdNumberValue(e.target.value)}
                aria-invalid={!!state?.errors?.idNumber}
                className={`mt-1 h-11 w-full rounded-sm border px-3 text-base outline-none transition focus:ring-1 ${
                  state?.errors?.idNumber
                    ? "border-error-600 focus:border-error-600 focus:ring-error-600/30"
                    : "border-neutral-200 focus:border-primary-500 focus:ring-primary-500/20"
                }`}
              />
              <p className="mt-1 text-xs text-neutral-400">
                Used only to verify your account — never shown publicly.
              </p>
              {state?.errors?.idNumber && (
                <p className="mt-1 text-sm font-medium text-error-600">{state.errors.idNumber[0]}</p>
              )}
            </div>
          </>
        )}

        <div>
          <label htmlFor="bio" className="block text-sm font-medium text-neutral-900">
            Bio
          </label>
          <textarea
            id="bio"
            name="bio"
            rows={4}
            value={bioValue}
            onChange={(e) => setBioValue(e.target.value)}
            placeholder="Tell students about your background and expertise."
            aria-invalid={!!state?.errors?.bio}
            className={`mt-1 w-full rounded-sm border px-3 py-2 text-base outline-none transition focus:ring-1 ${
              state?.errors?.bio
                ? "border-error-600 focus:border-error-600 focus:ring-error-600/30"
                : "border-neutral-200 focus:border-primary-500 focus:ring-primary-500/20"
            }`}
          />
          <p className="mt-1 text-xs text-neutral-400">This appears on your public portfolio.</p>
          {state?.errors?.bio && <p className="mt-1 text-sm font-medium text-error-600">{state.errors.bio[0]}</p>}
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
            aria-invalid={!!state?.errors?.username}
            className={`mt-1 h-11 w-full rounded-sm border px-3 text-base outline-none transition focus:ring-1 ${
              state?.errors?.username
                ? "border-error-600 focus:border-error-600 focus:ring-error-600/30"
                : "border-neutral-200 focus:border-primary-500 focus:ring-primary-500/20"
            }`}
          />
          <p className="mt-1 text-xs text-neutral-700">
            Your portfolio link:{" "}
            <span className="font-medium text-primary-900">
              fasmen.com/tutors/{usernameValue || "your-username"}
            </span>
          </p>
          {availability.kind === "checking" && (
            <p className="mt-1 text-xs text-neutral-400">Checking availability...</p>
          )}
          {availability.kind === "available" && (
            <p className="mt-1 text-sm text-success-600">
              &ldquo;{usernameValue.trim()}&rdquo; is available.
            </p>
          )}
          {availability.kind === "taken" && (
            <p className="mt-1 text-sm text-error-600">
              That username is already taken.
              {availability.suggestion && (
                <>
                  {" "}
                  Try{" "}
                  <button
                    type="button"
                    onClick={() => setUsernameValue(availability.suggestion!)}
                    className="font-medium underline"
                  >
                    {availability.suggestion}
                  </button>
                  ?
                </>
              )}
            </p>
          )}
          {state?.errors?.username && (
            <p className="mt-1 text-sm font-medium text-error-600">{state.errors.username[0]}</p>
          )}
        </div>

        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={pending}
            className="h-11 rounded-md bg-primary-700 px-6 font-medium text-white transition hover:bg-primary-900 disabled:opacity-60"
          >
            {pending ? "Saving..." : verified ? "Save changes" : "Complete registration"}
          </button>
          {verified ? (
            <button
              type="button"
              onClick={() => {
                setIdTypeValue(idType ?? "");
                setIdNumberValue(idNumber ?? "");
                setBioValue(bio ?? "");
                setUsernameValue(username ?? "");
                setEditing(false);
              }}
              className="text-sm font-medium text-neutral-700 hover:text-primary-700"
            >
              Cancel
            </button>
          ) : (
            <Link
              href="/dashboard"
              className="text-sm font-medium text-neutral-700 hover:text-primary-700"
            >
              Skip for now
            </Link>
          )}
        </div>
      </form>

      {successDialog}
    </>
  );
}
