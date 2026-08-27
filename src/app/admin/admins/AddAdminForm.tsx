"use client";

import { useState } from "react";
import { addNewAdminAction } from "@/app/actions/admin-management";
import { FormAlert } from "@/components/FormAlert";
import { ShieldCheckIcon, CheckCircleIcon } from "@/components/icons";

export function AddAdminForm() {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await addNewAdminAction({ displayName, email });
      if (res.success) {
        setSuccessMsg(`Administrator access successfully granted to ${displayName} (${email}). They can now log in at /admin/login.`);
        setDisplayName("");
        setEmail("");
      } else {
        setError(res.error || "Failed to add administrator.");
      }
    } catch (err) {
      console.error(err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="rounded-lg bg-white p-6 border border-neutral-200 shadow-[0_1px_3px_rgba(18,22,28,0.08)]">
      <div className="flex items-center gap-2.5 mb-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary-100 text-primary-700">
          <ShieldCheckIcon className="h-4 w-4" />
        </div>
        <h2 className="font-heading text-lg font-bold text-primary-900">
          Add New Administrator
        </h2>
      </div>
      <p className="text-xs text-neutral-700 mb-4">
        Grant administrator privileges to a team member. There is no public signup — only Stanley Anyaehie and provisioned administrators can authorize access.
      </p>

      {successMsg && (
        <div className="mb-4 flex items-start gap-2 rounded-md bg-[#e4f5ec] p-3 text-xs font-medium text-success-600 border border-success-200">
          <CheckCircleIcon className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{successMsg}</span>
        </div>
      )}

      <FormAlert message={error} className="mb-4" />

      <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="admin-name" className="block text-xs font-semibold uppercase tracking-wider text-neutral-700">
            Full Name
          </label>
          <input
            id="admin-name"
            type="text"
            required
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="e.g. Chinedu Eze"
            className="mt-1 h-10 w-full rounded-md border border-neutral-200 px-3 text-sm text-neutral-900 outline-none transition focus:border-primary-500 focus:ring-1 focus:ring-primary-500/20"
          />
        </div>

        <div>
          <label htmlFor="admin-new-email" className="block text-xs font-semibold uppercase tracking-wider text-neutral-700">
            Email Address
          </label>
          <input
            id="admin-new-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="e.g. chinedu@fasmen.com"
            className="mt-1 h-10 w-full rounded-md border border-neutral-200 px-3 text-sm text-neutral-900 outline-none transition focus:border-primary-500 focus:ring-1 focus:ring-primary-500/20"
          />
        </div>

        <div className="sm:col-span-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          <p className="text-xs text-neutral-500">
            Initial password will be default: <code className="bg-neutral-100 px-1.5 py-0.5 rounded font-mono text-neutral-700">Admin@Fasmen2026!</code>
          </p>

          <button
            type="submit"
            disabled={pending}
            className="h-10 rounded-md bg-primary-700 px-6 text-sm font-medium text-white shadow-sm transition hover:bg-primary-900 disabled:opacity-60 cursor-pointer shrink-0"
          >
            {pending ? "Granting Access..." : "Authorize Administrator"}
          </button>
        </div>
      </form>
    </div>
  );
}
