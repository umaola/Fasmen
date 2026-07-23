"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signup } from "@/app/actions/auth";
import type { SignupState } from "@/lib/definitions";

export default function SignupPage() {
  const [state, action, pending] = useActionState<SignupState, FormData>(signup, undefined);

  return (
    <main className="flex-1 flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-[0_1px_3px_rgba(18,22,28,0.08)]">
        <h1 className="font-heading text-2xl font-semibold text-primary-900">Create your account</h1>
        <p className="mt-1 text-sm text-neutral-700">
          Join as a student to start learning, or a private instructor to start teaching.
        </p>

        <form action={action} className="mt-6 flex flex-col gap-4">
          <div>
            <label htmlFor="displayName" className="block text-sm font-medium text-neutral-900">
              Full name
            </label>
            <input
              id="displayName"
              name="displayName"
              type="text"
              autoComplete="name"
              className="mt-1 h-11 w-full rounded-sm border border-neutral-200 px-3 text-base outline-none focus:border-primary-500"
            />
            {state?.errors?.displayName && (
              <p className="mt-1 text-sm text-error-600">{state.errors.displayName[0]}</p>
            )}
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-neutral-900">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              className="mt-1 h-11 w-full rounded-sm border border-neutral-200 px-3 text-base outline-none focus:border-primary-500"
            />
            {state?.errors?.email && (
              <p className="mt-1 text-sm text-error-600">{state.errors.email[0]}</p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-neutral-900">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              className="mt-1 h-11 w-full rounded-sm border border-neutral-200 px-3 text-base outline-none focus:border-primary-500"
            />
            {state?.errors?.password && (
              <ul className="mt-1 text-sm text-error-600">
                {state.errors.password.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            )}
          </div>

          <fieldset>
            <legend className="block text-sm font-medium text-neutral-900">I am a...</legend>
            <div className="mt-1 grid grid-cols-2 gap-3">
              <label className="flex h-11 items-center justify-center rounded-sm border border-neutral-200 text-sm font-medium has-[:checked]:border-primary-500 has-[:checked]:bg-primary-100 has-[:checked]:text-primary-900">
                <input type="radio" name="role" value="student" defaultChecked className="sr-only" />
                Student
              </label>
              <label className="flex h-11 items-center justify-center rounded-sm border border-neutral-200 text-sm font-medium has-[:checked]:border-primary-500 has-[:checked]:bg-primary-100 has-[:checked]:text-primary-900">
                <input type="radio" name="role" value="tutor" className="sr-only" />
                Private instructor
              </label>
            </div>
            {state?.errors?.role && (
              <p className="mt-1 text-sm text-error-600">{state.errors.role[0]}</p>
            )}
          </fieldset>

          {state?.message && <p className="text-sm text-error-600">{state.message}</p>}

          <button
            type="submit"
            disabled={pending}
            className="mt-2 h-11 rounded-md bg-primary-700 font-medium text-white transition hover:bg-primary-900 disabled:opacity-60"
          >
            {pending ? "Creating account..." : "Sign up"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-neutral-700">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-primary-700">
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}
