// Plan config and pure pricing math — no "server-only" here so client
// components (the plan picker) can import it directly. The Subscription
// record CRUD (which does need the server-only data store) lives in
// subscriptions.ts and imports these types/constants from this file.

export type SubscriptionPlanId = "free" | "creator" | "enterprise";

export interface PlanConfig {
  id: SubscriptionPlanId;
  name: string;
  monthlyPriceNaira: number;
  maxPublishedCourses: number | null; // null = unlimited
  tutorSharePercent: number; // this plan's revenue split, replaces the flat TUTOR_SHARE
  catalogPlacement: "standard" | "featured" | "top-featured";
  mostPopular?: boolean;
  features: string[];
}

// Tier design: display-only for now (subscribe/upgrade/cancel management UI).
// None of these limits are enforced elsewhere yet — course-count caps and
// revenue-share percentages are meant to eventually plug into course
// creation and payments.ts, but that wiring is deferred.
export const SUBSCRIPTION_PLANS: Record<SubscriptionPlanId, PlanConfig> = {
  free: {
    id: "free",
    name: "Free",
    monthlyPriceNaira: 0,
    maxPublishedCourses: 2,
    tutorSharePercent: 70,
    catalogPlacement: "standard",
    features: [
      "Up to 2 published courses",
      "Standard catalog placement",
      "70% revenue share",
      "Basic earnings dashboard",
    ],
  },
  creator: {
    id: "creator",
    name: "Creator",
    monthlyPriceNaira: 15000,
    maxPublishedCourses: 15,
    tutorSharePercent: 80,
    catalogPlacement: "featured",
    mostPopular: true,
    features: [
      "Up to 15 published courses",
      "Featured catalog placement",
      "80% revenue share",
      "Portfolio highlight badge",
      "Priority admin review",
    ],
  },
  enterprise: {
    id: "enterprise",
    name: "Enterprise",
    monthlyPriceNaira: 40000,
    maxPublishedCourses: null,
    tutorSharePercent: 85,
    catalogPlacement: "top-featured",
    features: [
      "Unlimited published courses",
      "Top-featured catalog placement",
      "85% revenue share",
      '"Verified Pro" portfolio badge',
      "Priority admin review",
      "Early access to new features",
    ],
  },
};

export interface BillingPeriodOption {
  months: 1 | 12;
  label: string;
  discountPercent: number;
}

export const BILLING_PERIODS: BillingPeriodOption[] = [
  { months: 1, label: "Monthly", discountPercent: 0 },
  { months: 12, label: "Yearly", discountPercent: 20 },
];

export function calculateSubscriptionPriceNaira(
  plan: PlanConfig,
  months: BillingPeriodOption["months"]
): number {
  const period = BILLING_PERIODS.find((p) => p.months === months)!;
  const fullPrice = plan.monthlyPriceNaira * months;
  return Math.round(fullPrice * (1 - period.discountPercent / 100));
}
