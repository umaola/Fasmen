"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signup, loginWithFirebaseTokenAction } from "@/app/actions/auth";
import { signInWithGooglePopup } from "@/lib/firebase";
import type { SignupState } from "@/lib/definitions";
import { FormAlert } from "@/components/FormAlert";

export default function SignupPage() {
  const router = useRouter();
  const [state, action, pending] = useActionState<SignupState, FormData>(signup, undefined);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"student" | "tutor">("student");
  const [showCriteria, setShowCriteria] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [googlePending, setGooglePending] = useState(false);
  const [googleError, setGoogleError] = useState<string | null>(null);

  async function handleGoogleSignUp() {
    setGooglePending(true);
    setGoogleError(null);
    try {
      const res = await signInWithGooglePopup();
      if (!res?.idToken) {
        setGoogleError("Failed to sign up with Google.");
        setGooglePending(false);
        return;
      }
      const authRes = await loginWithFirebaseTokenAction({
        idToken: res.idToken,
        roleIfNewUser: role,
      });
      if (!authRes.success) {
        setGoogleError(authRes.error || "Google sign-up failed.");
        setGooglePending(false);
        return;
      }
      router.push(authRes.redirectUrl || "/dashboard");
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : "Google sign-up was cancelled or failed.";
      setGoogleError(msg);
      setGooglePending(false);
    }
  }

  const passwordCriteria = [
    {
      id: "length",
      label: "At least 8 characters",
      met: password.length >= 8,
    },
    {
      id: "letter",
      label: "At least one letter (a-z, A-Z)",
      met: /[a-zA-Z]/.test(password),
    },
    {
      id: "number",
      label: "At least one number (0-9)",
      met: /[0-9]/.test(password),
    },
  ];

  return (
    <main className="flex-1 flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-[0_1px_3px_rgba(18,22,28,0.08)]">
        <h1 className="font-heading text-2xl font-semibold text-primary-900">Create your account</h1>
        <p className="mt-1 text-sm text-neutral-700">
          Join as a student to start learning, or a private instructor to start teaching.
        </p>

        {googleError && (
          <div className="mt-4">
            <FormAlert message={googleError} />
          </div>
        )}

        <div className="mt-6">
          <fieldset>
            <legend className="block text-sm font-medium text-neutral-900">I am joining as a...</legend>
            <div className="mt-1 grid grid-cols-2 gap-3">
              <label
                className={`flex h-11 items-center justify-center rounded-sm border text-sm font-medium transition cursor-pointer ${
                  role === "student"
                    ? "border-primary-500 bg-primary-100 text-primary-900"
                    : "border-neutral-200 bg-white text-neutral-700 hover:border-primary-500"
                }`}
              >
                <input
                  type="radio"
                  name="roleSelector"
                  value="student"
                  checked={role === "student"}
                  onChange={() => setRole("student")}
                  className="sr-only"
                />
                Student
              </label>
              <label
                className={`flex h-11 items-center justify-center rounded-sm border text-sm font-medium transition cursor-pointer ${
                  role === "tutor"
                    ? "border-primary-500 bg-primary-100 text-primary-900"
                    : "border-neutral-200 bg-white text-neutral-700 hover:border-primary-500"
                }`}
              >
                <input
                  type="radio"
                  name="roleSelector"
                  value="tutor"
                  checked={role === "tutor"}
                  onChange={() => setRole("tutor")}
                  className="sr-only"
                />
                Private instructor
              </label>
            </div>
          </fieldset>

          <button
            type="button"
            onClick={handleGoogleSignUp}
            disabled={googlePending || pending}
            className="mt-4 flex h-11 w-full items-center justify-center gap-3 rounded-md border border-neutral-200 bg-white text-sm font-medium text-neutral-700 transition hover:bg-neutral-50 disabled:opacity-60"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            {googlePending ? "Signing up..." : "Sign up with Google"}
          </button>
        </div>

        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-neutral-200" />
          <span className="text-xs uppercase tracking-wider text-neutral-400">or with email</span>
          <div className="h-px flex-1 bg-neutral-200" />
        </div>

        <form action={action} className="flex flex-col gap-4">
          <input type="hidden" name="role" value={role} />
          <FormAlert message={state?.message} />

          <div>
            <label htmlFor="displayName" className="block text-sm font-medium text-neutral-900">
              Full name
            </label>
            <input
              id="displayName"
              name="displayName"
              type="text"
              autoComplete="name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              aria-invalid={!!state?.errors?.displayName}
              className={`mt-1 h-11 w-full rounded-sm border px-3 text-base outline-none transition focus:ring-1 ${
                state?.errors?.displayName
                  ? "border-error-600 focus:border-error-600 focus:ring-error-600/30"
                  : "border-neutral-200 focus:border-primary-500 focus:ring-primary-500/20"
              }`}
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
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setShowCriteria(true)}
                onClick={() => setShowCriteria(true)}
                placeholder="Create a password"
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

            {showCriteria && (
              <div className="mt-2 rounded-md border border-neutral-200 bg-neutral-100/70 p-3 text-xs">
                <p className="font-medium text-neutral-700 mb-2">Password must contain:</p>
                <ul className="space-y-1.5">
                  {passwordCriteria.map((item) => (
                    <li
                      key={item.id}
                      className={`flex items-center gap-2 transition-colors ${
                        item.met ? "text-success-600 font-medium" : "text-neutral-700"
                      }`}
                    >
                      {item.met ? (
                        <svg
                          className="h-4 w-4 shrink-0 text-success-600"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                            clipRule="evenodd"
                          />
                        </svg>
                      ) : (
                        <span className="h-4 w-4 shrink-0 flex items-center justify-center">
                          <span className="h-1.5 w-1.5 rounded-full bg-neutral-400" />
                        </span>
                      )}
                      <span>{item.label}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {state?.errors?.password && (
              <ul className="mt-1 text-sm text-error-600">
                {state.errors.password.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            )}
            {state?.errors?.role && (
              <p className="mt-1 text-sm text-error-600">{state.errors.role[0]}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={pending || googlePending}
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
