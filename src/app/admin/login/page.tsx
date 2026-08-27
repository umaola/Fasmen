"use client";

import { useState } from "react";
import { adminLoginAction } from "@/app/actions/admin-auth";
import { FormAlert } from "@/components/FormAlert";
import { ShieldCheckIcon } from "@/components/icons";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleFillStanleyAdmin() {
    setEmail("admin@fasmen.com");
    setPassword("Admin@Fasmen2026!");
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);

    try {
      const res = await adminLoginAction({ email, password });
      if (res.success && res.redirectUrl) {
        // Direct browser navigation guarantees the session cookie is transmitted and the review queue loads cleanly
        window.location.href = res.redirectUrl;
      } else {
        setError(res.error || "Invalid administrator credentials.");
        setPending(false);
      }
    } catch (err) {
      console.error("Admin login submission error:", err);
      setError("An unexpected error occurred. Please try again.");
      setPending(false);
    }
  }

  return (
    <main className="min-h-screen bg-neutral-100 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-[0_1px_3px_rgba(18,22,28,0.08)] border border-neutral-200">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 text-primary-700 mb-3">
            <ShieldCheckIcon className="h-6 w-6" />
          </div>
          <span className="inline-block px-2.5 py-0.5 rounded-full bg-accent-100 text-[11px] font-bold tracking-wider uppercase text-accent-600 mb-1.5">
            Restricted Control Center
          </span>
          <h1 className="font-heading text-2xl font-bold text-primary-900">
            FASMEN Admin Portal
          </h1>
          <p className="mt-1.5 text-xs text-neutral-700">
            Sign in as <strong>Stanley Anyaehie</strong> or an administrator authorized by him. There is no public registration.
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <FormAlert message={error} />

          <div>
            <label htmlFor="admin-email" className="block text-sm font-medium text-neutral-900">
              Admin Email
            </label>
            <input
              id="admin-email"
              name="email"
              type="email"
              autoComplete="email"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@fasmen.com"
              required
              className="mt-1 h-11 w-full rounded-md border border-neutral-200 px-3 text-base text-neutral-900 placeholder-neutral-400 outline-none transition focus:border-primary-500 focus:ring-1 focus:ring-primary-500/20"
            />
          </div>

          <div>
            <label htmlFor="admin-password" className="block text-sm font-medium text-neutral-900">
              Password
            </label>
            <div className="relative mt-1">
              <input
                id="admin-password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                className="h-11 w-full rounded-md border border-neutral-200 px-3 pr-10 text-base text-neutral-900 placeholder-neutral-400 outline-none transition focus:border-primary-500 focus:ring-1 focus:ring-primary-500/20"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 focus:outline-none cursor-pointer"
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
          </div>

          <button
            type="submit"
            disabled={pending}
            className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-md bg-primary-700 font-medium text-white shadow-sm transition hover:bg-primary-900 disabled:opacity-60 cursor-pointer"
          >
            <ShieldCheckIcon className="h-4 w-4" />
            <span>{pending ? "Authenticating..." : "Sign In to Control Center"}</span>
          </button>
        </form>

        {/* 1-Click Quick Auto-Fill for Stanley Anyaehie */}
        <div className="mt-6 border-t border-neutral-200 pt-4 text-center">
          <button
            type="button"
            onClick={handleFillStanleyAdmin}
            className="text-xs font-medium text-primary-700 hover:underline cursor-pointer"
          >
            Auto-fill Master Admin Credentials (Stanley Anyaehie)
          </button>
        </div>
      </div>
    </main>
  );
}
