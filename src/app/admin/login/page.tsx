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

  function handleFillMasterAdmin() {
    setEmail("admin@fasmen.com");
    setPassword("Admin@Fasmen2026!");
    setError(null);
  }

  function handleFillOwnerAdmin() {
    setEmail("umaolamma@gmail.com");
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
    <div className="min-h-screen bg-[#0d131f] text-neutral-100 flex flex-col justify-center items-center px-4 py-12">
      {/* Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary-700/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md bg-[#131b2c] border border-neutral-800 rounded-2xl p-8 shadow-2xl">
        {/* Portal Header */}
        <div className="text-center mb-8">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-900/60 border border-primary-500/30 text-primary-400 mb-4 shadow-inner">
            <ShieldCheckIcon className="h-7 w-7 text-primary-400" />
          </div>
          <span className="inline-block px-3 py-1 rounded-full bg-primary-950/80 border border-primary-700/40 text-[11px] font-semibold tracking-wider uppercase text-primary-300 mb-2">
            Control Center
          </span>
          <h1 className="font-heading text-2xl font-bold text-white tracking-tight">
            FASMEN Admin Portal
          </h1>
          <p className="mt-1.5 text-xs text-neutral-400">
            Sign in with administrator credentials to manage courses, tutors, and reviews.
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <FormAlert message={error} />

          <div>
            <label htmlFor="admin-email" className="block text-xs font-semibold uppercase tracking-wider text-neutral-300">
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
              className="mt-1.5 h-11 w-full rounded-lg bg-[#0b101b] border border-neutral-700/80 px-3.5 text-sm text-white placeholder-neutral-500 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
            />
          </div>

          <div>
            <label htmlFor="admin-password" className="block text-xs font-semibold uppercase tracking-wider text-neutral-300">
              Password
            </label>
            <div className="relative mt-1.5">
              <input
                id="admin-password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                className="h-11 w-full rounded-lg bg-[#0b101b] border border-neutral-700/80 px-3.5 pr-10 text-sm text-white placeholder-neutral-500 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-200 focus:outline-none cursor-pointer"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                  </svg>
                ) : (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
            className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary-600 font-semibold text-white shadow-md transition hover:bg-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-[#131b2c] disabled:opacity-60 cursor-pointer"
          >
            <ShieldCheckIcon className="h-4 w-4" />
            <span>{pending ? "Authenticating..." : "Sign In to Admin Portal"}</span>
          </button>
        </form>

        {/* Quick Fill Helpers */}
        <div className="mt-6 border-t border-neutral-800 pt-4 flex flex-col gap-2 text-center">
          <span className="text-[11px] text-neutral-400 uppercase tracking-wider font-semibold">
            Quick Auto-Fill (1-Click)
          </span>
          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={handleFillMasterAdmin}
              className="text-xs text-primary-400 hover:text-primary-300 underline cursor-pointer"
            >
              admin@fasmen.com
            </button>
            <span className="text-neutral-600">·</span>
            <button
              type="button"
              onClick={handleFillOwnerAdmin}
              className="text-xs text-primary-400 hover:text-primary-300 underline cursor-pointer"
            >
              umaolamma@gmail.com
            </button>
          </div>
        </div>

        {/* Security Warning Notice */}
        <div className="mt-5 rounded-lg bg-neutral-900/50 border border-neutral-800 p-3 text-center">
          <p className="text-[11px] text-neutral-400">
            🔒 Restricted Area · All administrator access is monitored and logged for security compliance.
          </p>
        </div>
      </div>
    </div>
  );
}
