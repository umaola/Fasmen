"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/authz";
import { SubscribeFormSchema, type SubscribeState } from "@/lib/definitions";
import {
  SUBSCRIPTION_PLANS,
  calculateSubscriptionPriceNaira,
  createSubscription,
  cancelSubscription,
  type BillingPeriodOption,
} from "@/lib/subscriptions";

export async function subscribeToPlanAction(
  _state: SubscribeState,
  formData: FormData
): Promise<SubscribeState> {
  const user = await requireRole("tutor");
  if (!user) {
    return { message: "Only tutor accounts can subscribe to a plan." };
  }

  const validatedFields = SubscribeFormSchema.safeParse({
    plan: formData.get("plan"),
    billingPeriodMonths: formData.get("billingPeriodMonths"),
  });

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }

  const { plan, billingPeriodMonths } = validatedFields.data;
  const planConfig = SUBSCRIPTION_PLANS[plan];
  const amountPaidNaira = calculateSubscriptionPriceNaira(
    planConfig,
    billingPeriodMonths as BillingPeriodOption["months"]
  );

  await createSubscription({
    tutorId: user.id,
    plan,
    billingPeriodMonths: billingPeriodMonths as BillingPeriodOption["months"],
    amountPaidNaira,
  });

  revalidatePath("/dashboard/subscription");
  revalidatePath("/dashboard");
  return undefined;
}

export async function cancelSubscriptionAction(): Promise<void> {
  const user = await requireRole("tutor");
  if (!user) return;

  await cancelSubscription(user.id);
  revalidatePath("/dashboard/subscription");
}
