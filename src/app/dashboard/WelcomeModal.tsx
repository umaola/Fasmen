"use client";

import { useState } from "react";
import Link from "next/link";

export function WelcomeModal() {
  const [open, setOpen] = useState(true);
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-6">
      <div className="w-full max-w-md rounded-lg bg-white p-8 text-center shadow-[0_1px_3px_rgba(18,22,28,0.08)]">
        <h2 className="font-heading text-xl font-bold text-primary-900">
          Welcome to Fasmen!
        </h2>
        <p className="mt-2 text-sm text-neutral-700">
          Want to finish setting up your instructor profile now and get your public portfolio
          link, or explore the dashboard first?
        </p>
        <div className="mt-6 flex flex-col gap-3">
          <Link
            href="/dashboard/account/verify"
            className="inline-flex h-11 items-center justify-center rounded-md bg-primary-700 font-medium text-white transition hover:bg-primary-900"
          >
            Verify
          </Link>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="h-11 rounded-md text-sm font-medium text-neutral-700 transition hover:bg-neutral-100"
          >
            Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
