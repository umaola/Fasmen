"use client";

import { useState } from "react";
import { cancelSubscriptionAction } from "@/app/actions/subscriptions";

export function CancelSubscriptionButton({ planName }: { planName: string }) {
  const [confirming, setConfirming] = useState(false);

  if (confirming) {
    return (
      <div className="flex flex-col gap-3 rounded-lg border border-error-600 bg-white p-5">
        <p className="text-sm text-error-600">
          {`Cancel your ${planName} plan? You'll keep its features until the current period ends, then drop to Free.`}
        </p>
        <div className="flex gap-3">
          <form action={cancelSubscriptionAction}>
            <button
              type="submit"
              className="h-9 rounded-md bg-error-600 px-4 text-sm font-medium text-white transition hover:brightness-95"
            >
              Cancel
            </button>
          </form>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            className="h-9 rounded-md border border-neutral-200 px-4 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100"
          >
            Keep
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-error-600 bg-white p-5">
      <p className="text-sm text-neutral-700">Cancel your subscription</p>
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="shrink-0 text-sm font-medium text-error-600 hover:underline"
      >
        Cancel
      </button>
    </div>
  );
}
