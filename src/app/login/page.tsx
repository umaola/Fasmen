"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { login, loginWithFirebaseTokenAction } from "@/app/actions/auth";
import { signInWithGooglePopup } from "@/lib/firebase";
import type { LoginState } from "@/lib/definitions";
import { FormAlert } from "@/components/FormAlert";

export default function LoginPage() {
  const router = useRouter();
  const [state, action, pending] = useActionState<LoginState, FormData>(login, undefined);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [googlePending, setGooglePending] = useState(false);
  const [googleError, setGoogleError] = useState<string | null>(null);

  async function handleGoogleSignIn() {
    setGooglePending(true);
    setGoogleError(null);
    try {
      const res = await signInWithGooglePopup();
      if (!res?.idToken) {
        setGoogleError("Failed to sign in with Google.");
        setGooglePending(false);
        return;
      }
      const authRes = await loginWithFirebaseTokenAction({ idToken: res.idToken });
      if (!authRes.success) {
        setGoogleError(authRes.error || "Google authentication failed.");
        setGooglePending(false);
        return;
      }
      window.location.href = authRes.redirectUrl || "/dashboard";
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : "Google sign-in was cancelled or failed.";
      setGoogleError(msg);
      setGooglePending(false);
    }
  }

  return (
    <main className="flex-1 flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-[0_1px_3px_rgba(18,22,28,0.08)]">
        <h1 className="font-heading text-2xl font-semibold text-primary-900">Welcome back</h1>
        <p className="mt-1 text-sm text-neutral-700">Log in to continue your learning or teaching.</p>

        {googleError && (
          <div className="mt-4">
            <FormAlert message={googleError} />
          </div>
        )}

        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={googlePending || pending}
          className="mt-6 flex h-11 w-full items-center justify-center gap-3 rounded-md border border-neutral-200 bg-white text-sm font-medium text-neutral-700 transition hover:bg-neutral-50 disabled:opacity-60"
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
          {googlePending ? "Signing in..." : "Google"}
        </button>

        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-neutral-200" />
          <span className="text-xs uppercase tracking-wider text-neutral-400">or</span>
          <div className="h-px flex-1 bg-neutral-200" />
        </div>

        <form action={action} className="flex flex-col gap-4">
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
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
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
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="block text-sm font-medium text-neutral-900">
                Password
              </label>
              <Link
                href="/forgot-password"
                className="text-xs font-medium text-primary-700 hover:underline"
              >
                Forgot password?
              </Link>
            </div>
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
            disabled={pending || googlePending}
            className="mt-2 h-11 rounded-md bg-primary-700 font-medium text-white transition hover:bg-primary-900 disabled:opacity-60"
          >
            {pending ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-neutral-700">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="font-medium text-primary-700">
            Signup
          </Link>
        </p>
      </div>
    </main>
  );
}

