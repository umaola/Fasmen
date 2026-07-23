"use client";

import { useActionState, useState } from "react";
import { subscribeToPlanAction } from "@/app/actions/subscriptions";
import { formatNaira } from "@/lib/currency";
import {
  BILLING_PERIODS,
  SUBSCRIPTION_PLANS,
  calculateSubscriptionPriceNaira,
  type SubscriptionPlanId,
  type BillingPeriodOption,
} from "@/lib/subscriptionPlans";
import type { SubscribeState } from "@/lib/definitions";

const PLAN_ORDER: SubscriptionPlanId[] = ["free", "creator", "enterprise"];

export function PlanSelector({ currentPlanId }: { currentPlanId: SubscriptionPlanId }) {
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlanId>(
    currentPlanId === "free" ? "creator" : currentPlanId
  );
  const [months, setMonths] = useState<BillingPeriodOption["months"]>(1);
  const [state, action, pending] = useActionState<SubscribeState, FormData>(
    subscribeToPlanAction,
    undefined
  );

  const plan = SUBSCRIPTION_PLANS[selectedPlan];
  const totalNaira =
    selectedPlan === "free" ? 0 : calculateSubscriptionPriceNaira(plan, months);
  const expiryDate = new Date();
  expiryDate.setMonth(expiryDate.getMonth() + months);

  return (
    <div>
      <h2 className="font-heading text-lg font-semibold text-primary-900">Change or renew plan</h2>
      <p className="mt-1 text-sm text-neutral-700">Select a billing period and plan tier.</p>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_320px]">
        <div>
          <p className="text-sm font-medium text-neutral-900">Billing period</p>
          <div className="mt-2 flex flex-wrap gap-1 rounded-lg bg-neutral-100 p-1">
            {BILLING_PERIODS.map((period) => (
              <button
                key={period.months}
                type="button"
                onClick={() => setMonths(period.months)}
                className={`flex h-11 flex-1 flex-col items-center justify-center rounded-md px-3 text-sm font-medium transition ${
                  months === period.months
                    ? "bg-white text-primary-900 shadow-[0_1px_3px_rgba(18,22,28,0.08)]"
                    : "text-neutral-700 hover:text-primary-900"
                }`}
              >
                <span>{period.label}</span>
                {period.discountPercent > 0 && (
                  <span className="text-xs text-success-600">Save {period.discountPercent}%</span>
                )}
              </button>
            ))}
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {PLAN_ORDER.filter((id) => id !== "free").map((planId) => {
              const p = SUBSCRIPTION_PLANS[planId];
              const selected = selectedPlan === planId;
              return (
                <button
                  key={planId}
                  type="button"
                  onClick={() => setSelectedPlan(planId)}
                  className={`relative rounded-lg border p-5 text-left transition ${
                    selected
                      ? "border-primary-500 bg-white shadow-[0_1px_3px_rgba(18,22,28,0.08)]"
                      : "border-neutral-200 bg-white hover:border-primary-500"
                  }`}
                >
                  {p.mostPopular && (
                    <span className="absolute top-4 right-4 rounded-full bg-accent-600 px-2.5 py-0.5 text-xs font-medium text-white">
                      Most popular
                    </span>
                  )}
                  <p className="font-heading font-semibold text-primary-900">{p.name}</p>
                  <p className="font-heading mt-2 text-2xl font-bold text-primary-900">
                    {formatNaira(p.monthlyPriceNaira * 100)}
                    <span className="text-sm font-normal text-neutral-700">/mo</span>
                  </p>
                  <ul className="mt-3 flex flex-col gap-1 text-sm text-neutral-700">
                    {p.features.map((f) => (
                      <li key={f}>{f}</li>
                    ))}
                  </ul>
                </button>
              );
            })}
          </div>
        </div>

        <div className="h-fit rounded-lg bg-white p-6 shadow-[0_1px_3px_rgba(18,22,28,0.08)]">
          <p className="text-xs font-medium tracking-wide text-neutral-700 uppercase">
            Order summary
          </p>
          <p className="font-heading mt-2 text-lg font-semibold text-primary-900">{plan.name}</p>
          <p className="text-sm text-neutral-700">
            {BILLING_PERIODS.find((p) => p.months === months)?.label} billing
          </p>

          <div className="mt-4 flex items-center justify-between border-t border-neutral-200 pt-4">
            <span className="text-sm text-neutral-700">Total today</span>
            <span className="font-heading text-lg font-bold text-primary-900">
              {formatNaira(totalNaira * 100)}
            </span>
          </div>
          <div className="mt-1 flex items-center justify-between">
            <span className="text-sm text-neutral-700">Expires</span>
            <span className="text-sm font-medium text-neutral-900">
              {expiryDate.toLocaleDateString("en-NG", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
          </div>

          <ul className="mt-4 flex flex-col gap-1.5 border-t border-neutral-200 pt-4 text-sm text-neutral-700">
            {plan.features.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>

          {state?.message && <p className="mt-3 text-sm text-error-600">{state.message}</p>}

          <form action={action} className="mt-5">
            <input type="hidden" name="plan" value={selectedPlan} />
            <input type="hidden" name="billingPeriodMonths" value={months} />
            <button
              type="submit"
              disabled={pending}
              className="h-11 w-full rounded-md bg-accent-600 font-medium text-white transition hover:brightness-95 disabled:opacity-60"
            >
              {pending ? "Processing..." : "Subscribe"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
