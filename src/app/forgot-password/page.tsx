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
    <main className="flex-1 flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-[0_1px_3px_rgba(18,22,28,0.08)]">
        <h1 className="font-heading text-2xl font-semibold text-primary-900">Reset your password</h1>
        <p className="mt-1 text-sm text-neutral-700">
          Enter the email associated with your account and we will send you a password reset link.
        </p>

        {state?.success ? (
          <div className="mt-6">
            <div className="rounded-md bg-success-50 p-4 text-sm text-success-700">
              {state.message}
            </div>
            <Link
              href="/login"
              className="mt-6 flex h-11 w-full items-center justify-center rounded-md bg-primary-700 font-medium text-white transition hover:bg-primary-900"
            >
              Back to log in
            </Link>
          </div>
        ) : (
          <form action={action} className="mt-6 flex flex-col gap-4">
            <FormAlert message={state?.message} />

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-neutral-900">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={!!state?.errors?.email}
                className={`mt-1 h-11 w-full rounded-sm border px-3 text-base outline-none transition focus:ring-1 ${
                  state?.errors?.email
                    ? "border-error-600 focus:border-error-600 focus:ring-error-600/30"
                    : "border-neutral-200 focus:border-primary-500 focus:ring-primary-500/20"
                }`}
              />
              {state?.errors?.email && (
                <p className="mt-1 text-sm text-error-600">{state.errors.email[0]}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={pending}
              className="mt-2 h-11 rounded-md bg-primary-700 font-medium text-white transition hover:bg-primary-900 disabled:opacity-60"
            >
              {pending ? "Sending reset link..." : "Send reset link"}
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-neutral-700">
          Remember your password?{" "}
          <Link href="/login" className="font-medium text-primary-700">
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}
