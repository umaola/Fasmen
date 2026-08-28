"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { sendPasswordResetAction } from "@/app/actions/auth";
import type { ForgotPasswordState } from "@/lib/definitions";
import { FormAlert } from "@/components/FormAlert";

export default function ForgotPasswordPage() {
  const [state, action, pending] = useActionState<ForgotPasswordState, FormData>(
    sendPasswordResetAction,
    undefined
  );
  const [email, setEmail] = useState("");

  return (
    <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-8 sm:py-16">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 sm:p-8 shadow-[0_2px_12px_rgba(18,22,28,0.08)] border border-neutral-200/80">
        <h1 className="font-heading text-xl sm:text-2xl font-bold text-primary-900">Reset your password</h1>
        <p className="mt-1 text-xs sm:text-sm text-neutral-600">
          Enter the email associated with your account and we will send you a password reset link.
        </p>

        {state?.success ? (
          <div className="mt-6">
            <div className="rounded-xl bg-success-50 p-4 text-xs sm:text-sm text-success-700 border border-success-200">
              {state.message}
            </div>
            <Link
              href="/login"
              className="mt-6 flex h-11 w-full items-center justify-center rounded-xl bg-primary-700 font-semibold text-white shadow-sm transition hover:bg-primary-900"
            >
              Back to log in
            </Link>
          </div>
        ) : (
          <form action={action} className="mt-6 flex flex-col gap-4">
            <FormAlert message={state?.message} />

            <div>
              <label htmlFor="email" className="block text-xs sm:text-sm font-medium text-neutral-900">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={!!state?.errors?.email}
                className={`mt-1 h-11 w-full rounded-xl border px-3.5 text-sm sm:text-base outline-none transition focus:ring-1 ${
                  state?.errors?.email
                    ? "border-error-600 focus:border-error-600 focus:ring-error-600/30"
                    : "border-neutral-200 focus:border-primary-500 focus:ring-primary-500/20"
                }`}
              />
              {state?.errors?.email && (
                <p className="mt-1 text-xs sm:text-sm text-error-600">{state.errors.email[0]}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={pending}
              className="mt-2 h-11 rounded-xl bg-primary-700 font-semibold text-white shadow-sm transition hover:bg-primary-900 disabled:opacity-60 cursor-pointer"
            >
              {pending ? "Sending..." : "Reset"}
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-xs sm:text-sm text-neutral-600">
          Remember your password?{" "}
          <Link href="/login" className="font-semibold text-primary-700 hover:underline">
            Login
          </Link>
        </p>
      </div>
    </main>
  );
}
