import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/dal";
import { getEffectivePlan } from "@/lib/subscriptions";
import { PlanSelector } from "./PlanSelector";
import { CancelSubscriptionButton } from "./CancelSubscriptionButton";

export default async function SubscriptionPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "tutor") {
    redirect("/dashboard");
  }

  const { plan, subscription } = await getEffectivePlan(user.id);
  const isVerified = Boolean(user.tutorProfile?.verified);
  const hasLapsed = subscription && new Date(subscription.currentPeriodEnd) <= new Date();

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-primary-900">Subscription</h1>
      <p className="mt-1 text-sm text-neutral-700">Manage your plan and billing.</p>

      {!isVerified && (
        <div className="mt-6 rounded-lg bg-[#fcf3e1] p-5 text-sm text-warning-600">
          Complete{" "}
          <Link href="/dashboard/account/verify" className="font-medium underline">
            tutor verification
          </Link>{" "}
          before subscribing to a paid plan.
        </div>
      )}

      <div className="mt-6 rounded-lg bg-white p-6 shadow-[0_1px_3px_rgba(18,22,28,0.08)]">
        <p className="text-sm text-neutral-700">Current plan</p>
        <p className="font-heading mt-1 text-2xl font-bold text-primary-900">{plan.name}</p>
        {plan.id !== "free" && subscription && !hasLapsed && (
          <p className="mt-1 text-sm text-neutral-700">
            {subscription.status === "canceled" ? "Access ends" : "Renews"}{" "}
            {new Date(subscription.currentPeriodEnd).toLocaleDateString("en-NG", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        )}
        <ul className="mt-4 flex flex-col gap-1 text-sm text-neutral-700">
          {plan.features.map((f) => (
            <li key={f}>✓ {f}</li>
          ))}
        </ul>
      </div>

      <div className="mt-10">
        <PlanSelector currentPlanId={plan.id} />
      </div>

      {plan.id !== "free" && subscription && !hasLapsed && subscription.status === "active" && (
        <div className="mt-10">
          <CancelSubscriptionButton planName={plan.name} />
        </div>
      )}
    </div>
  );
}
