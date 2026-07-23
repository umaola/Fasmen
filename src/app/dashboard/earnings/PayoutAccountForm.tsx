"use client";

import { useState, useActionState } from "react";
import Link from "next/link";
import { connectPayoutAccountAction } from "@/app/actions/payouts";
import { NIGERIAN_BANKS } from "@/lib/banks";
import { CloseIcon } from "@/components/icons";
import type { PayoutAccountState } from "@/lib/definitions";
import type { PayoutAccount } from "@/lib/users";

export function PayoutAccountForm({
  payoutAccount,
  isVerified,
}: {
  payoutAccount: PayoutAccount | null;
  isVerified: boolean;
}) {
  const [panelOpen, setPanelOpen] = useState(false);
  const [state, action, pending] = useActionState<PayoutAccountState, FormData>(
    connectPayoutAccountAction,
    undefined
  );

  // Derived-state-during-render pattern (React's recommended alternative to an
  // effect here): close the panel the render right after a successful save,
  // without re-triggering on every render.
  const [handledSuccess, setHandledSuccess] = useState(false);
  if (state?.success && !handledSuccess) {
    setHandledSuccess(true);
    setPanelOpen(false);
  } else if (!state?.success && handledSuccess) {
    setHandledSuccess(false);
  }

  if (!isVerified) {
    return (
      <div className="rounded-lg bg-white p-5 shadow-[0_1px_3px_rgba(18,22,28,0.08)]">
        <h2 className="font-heading text-lg font-semibold text-primary-900">Payout account</h2>
        <p className="mt-2 text-sm text-neutral-700">
          Complete tutor verification before connecting a bank account for payouts.
        </p>
        <Link
          href="/dashboard/verification"
          className="mt-3 inline-flex h-10 items-center rounded-md bg-primary-700 px-5 text-sm font-medium text-white transition hover:bg-primary-900"
        >
          Complete verification
        </Link>
      </div>
    );
  }

  return (
    <>
      {payoutAccount ? (
        <div className="rounded-lg bg-white p-5 shadow-[0_1px_3px_rgba(18,22,28,0.08)]">
          <h2 className="font-heading text-lg font-semibold text-primary-900">Payout account</h2>
          <p className="mt-2 text-sm text-neutral-700">
            {payoutAccount.bankName} · •••• {payoutAccount.accountNumberLast4} ·{" "}
            {payoutAccount.provider === "paystack" ? "Paystack" : "Flutterwave"}
          </p>
          <button
            type="button"
            onClick={() => setPanelOpen(true)}
            className="mt-3 h-9 rounded-md border border-primary-700 px-4 text-sm font-medium text-primary-700 transition hover:bg-primary-100"
          >
            Update account
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-4 rounded-lg bg-primary-100 p-5">
          <div>
            <h2 className="font-heading text-lg font-semibold text-primary-900">
              Connect your payout account
            </h2>
            <p className="mt-1 text-sm text-neutral-700">
              Add your bank details so we know where to send your earnings.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setPanelOpen(true)}
            className="h-10 shrink-0 rounded-md bg-primary-700 px-5 text-sm font-medium text-white transition hover:bg-primary-900"
          >
            Connect account
          </button>
        </div>
      )}

      {/* Backdrop */}
      <div
        aria-hidden={!panelOpen}
        onClick={() => setPanelOpen(false)}
        className={`fixed inset-0 z-50 bg-black/40 transition-opacity duration-300 ease-out ${
          panelOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      {/* Slide-over panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Connect payout account"
        className={`fixed top-0 right-0 z-50 flex h-full w-full max-w-md flex-col bg-white shadow-xl transition-transform duration-300 ease-out ${
          panelOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4">
          <h2 className="font-heading text-lg font-semibold text-primary-900">
            {payoutAccount ? "Update payout account" : "Connect your payout account"}
          </h2>
          <button
            type="button"
            onClick={() => setPanelOpen(false)}
            aria-label="Close"
            className="rounded-md p-2 text-neutral-700 hover:bg-neutral-100"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          <p className="text-sm text-neutral-700">
            Add your bank details so we know where to send your earnings.
          </p>

          <form action={action} className="mt-4 flex flex-col gap-4">
            <div>
              <label htmlFor="provider" className="block text-sm font-medium text-neutral-900">
                Payout provider
              </label>
              <select
                id="provider"
                name="provider"
                defaultValue="paystack"
                className="mt-1 h-11 w-full rounded-sm border border-neutral-200 px-3 text-base outline-none focus:border-primary-500"
              >
                <option value="paystack">Paystack</option>
                <option value="flutterwave">Flutterwave</option>
              </select>
              {state?.errors?.provider && (
                <p className="mt-1 text-sm text-error-600">{state.errors.provider[0]}</p>
              )}
            </div>

            <div>
              <label htmlFor="bankName" className="block text-sm font-medium text-neutral-900">
                Bank
              </label>
              <select
                id="bankName"
                name="bankName"
                defaultValue=""
                className="mt-1 h-11 w-full rounded-sm border border-neutral-200 px-3 text-base outline-none focus:border-primary-500"
              >
                <option value="" disabled>
                  Choose your bank
                </option>
                {NIGERIAN_BANKS.map((bank) => (
                  <option key={bank} value={bank}>
                    {bank}
                  </option>
                ))}
              </select>
              {state?.errors?.bankName && (
                <p className="mt-1 text-sm text-error-600">{state.errors.bankName[0]}</p>
              )}
            </div>

            <div>
              <label htmlFor="accountNumber" className="block text-sm font-medium text-neutral-900">
                Account number
              </label>
              <input
                id="accountNumber"
                name="accountNumber"
                type="text"
                inputMode="numeric"
                maxLength={10}
                className="mt-1 h-11 w-full rounded-sm border border-neutral-200 px-3 text-base outline-none focus:border-primary-500"
              />
              <p className="mt-1 text-xs text-neutral-400">
                We only keep the last 4 digits on file once connected.
              </p>
              {state?.errors?.accountNumber && (
                <p className="mt-1 text-sm text-error-600">{state.errors.accountNumber[0]}</p>
              )}
            </div>

            {state?.message && <p className="text-sm text-error-600">{state.message}</p>}
            {state?.success && (
              <p className="text-sm text-success-600">Payout account connected.</p>
            )}

            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={pending}
                className="h-10 rounded-md bg-primary-700 px-5 text-sm font-medium text-white transition hover:bg-primary-900 disabled:opacity-60"
              >
                {pending ? "Connecting..." : "Connect account"}
              </button>
              <button
                type="button"
                onClick={() => setPanelOpen(false)}
                className="text-sm font-medium text-neutral-700 hover:text-primary-700"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
