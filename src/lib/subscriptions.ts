import "server-only";
import { randomUUID } from "crypto";
import { readCollection, withCollection } from "./json-store";
import { SUBSCRIPTION_PLANS, type SubscriptionPlanId, type BillingPeriodOption, type PlanConfig } from "./subscriptionPlans";

export * from "./subscriptionPlans";

const SUBSCRIPTIONS_FILE = "subscriptions.json";

export type SubscriptionStatus = "active" | "canceled";

// One record per purchase/renewal — the tutor's *current* plan is whichever
// record is most recent and not yet past its currentPeriodEnd (see
// getEffectivePlan). Canceling doesn't delete/backdate the record — it just
// stops it from being treated as renewable, mirroring "Expires: <date>" in
// typical subscription UIs: benefits continue until the period actually ends.
export interface Subscription {
  id: string;
  tutorId: string;
  plan: SubscriptionPlanId;
  billingPeriodMonths: BillingPeriodOption["months"];
  amountPaidNaira: number;
  status: SubscriptionStatus;
  startedAt: string;
  currentPeriodEnd: string;
  canceledAt: string | null;
  createdAt: string;
}

export async function listSubscriptionsByTutor(tutorId: string): Promise<Subscription[]> {
  const subs = await readCollection<Subscription>(SUBSCRIPTIONS_FILE);
  return subs
    .filter((s) => s.tutorId === tutorId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function findLatestSubscription(tutorId: string): Promise<Subscription | undefined> {
  const subs = await listSubscriptionsByTutor(tutorId);
  return subs[0];
}

// Resolves what the tutor actually gets right now: their most recent paid
// subscription if it hasn't lapsed, otherwise Free — regardless of whether
// that record is "active" or "canceled" (canceled just means it won't renew).
export async function getEffectivePlan(
  tutorId: string
): Promise<{ plan: PlanConfig; subscription: Subscription | null }> {
  const latest = await findLatestSubscription(tutorId);
  if (latest && new Date(latest.currentPeriodEnd) > new Date()) {
    return { plan: SUBSCRIPTION_PLANS[latest.plan], subscription: latest };
  }
  return { plan: SUBSCRIPTION_PLANS.free, subscription: latest ?? null };
}

export async function createSubscription(input: {
  tutorId: string;
  plan: SubscriptionPlanId;
  billingPeriodMonths: BillingPeriodOption["months"];
  amountPaidNaira: number;
}): Promise<Subscription> {
  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setMonth(periodEnd.getMonth() + input.billingPeriodMonths);

  const subscription: Subscription = {
    id: randomUUID(),
    tutorId: input.tutorId,
    plan: input.plan,
    billingPeriodMonths: input.billingPeriodMonths,
    amountPaidNaira: input.amountPaidNaira,
    status: "active",
    startedAt: now.toISOString(),
    currentPeriodEnd: periodEnd.toISOString(),
    canceledAt: null,
    createdAt: now.toISOString(),
  };

  await withCollection<Subscription>(SUBSCRIPTIONS_FILE, (subs) => [...subs, subscription]);
  return subscription;
}

export async function cancelSubscription(tutorId: string): Promise<Subscription | null> {
  const latest = await findLatestSubscription(tutorId);
  if (!latest || latest.status === "canceled") return null;

  const all = await withCollection<Subscription>(SUBSCRIPTIONS_FILE, (subs) =>
    subs.map((s) => (s.id === latest.id ? { ...s, status: "canceled", canceledAt: new Date().toISOString() } : s))
  );
  return all.find((s) => s.id === latest.id) ?? null;
}
