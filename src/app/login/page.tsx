"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { login } from "@/app/actions/auth";
import type { LoginState } from "@/lib/definitions";
import { FormAlert } from "@/components/FormAlert";

export default function LoginPage() {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, undefined);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  return (
    <main className="flex-1 flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-[0_1px_3px_rgba(18,22,28,0.08)]">
        <h1 className="font-heading text-2xl font-semibold text-primary-900">Welcome back</h1>
        <p className="mt-1 text-sm text-neutral-700">Log in to continue your learning or teaching.</p>

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

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-neutral-900">
              Password
            </label>
            <div className="relative mt-1">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-invalid={!!state?.errors?.password}
                className={`h-11 w-full rounded-sm border px-3 pr-10 text-base outline-none transition focus:ring-1 ${
                  state?.errors?.password
                    ? "border-error-600 focus:border-error-600 focus:ring-error-600/30"
                    : "border-neutral-200 focus:border-primary-500 focus:ring-primary-500/20"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 focus:outline-none"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </button>
            </div>
            {state?.errors?.password && (
              <p className="mt-1 text-sm text-error-600">{state.errors.password[0]}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={pending}
            className="mt-2 h-11 rounded-md bg-primary-700 font-medium text-white transition hover:bg-primary-900 disabled:opacity-60"
          >
            {pending ? "Logging in..." : "Log in"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-neutral-700">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="font-medium text-primary-700">
            Sign up
          </Link>
        </p>
      </div>
    </main>
  );
}
