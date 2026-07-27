"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/authz";
import { listUnpaidPayoutsByTutor, markTutorPaid } from "@/lib/payments";
import { connectPayoutAccount } from "@/lib/users";
import { PayoutAccountFormSchema, type PayoutAccountState } from "@/lib/definitions";

export async function connectPayoutAccountAction(
  _state: PayoutAccountState,
  formData: FormData
): Promise<PayoutAccountState> {
  const user = await requireRole("tutor");
  if (!user) {
    return { message: "Only tutor accounts can connect a payout account." };
  }
  if (!user.tutorProfile?.verified) {
    return { message: "Complete tutor verification before connecting a payout account." };
  }

  const validatedFields = PayoutAccountFormSchema.safeParse({
    provider: formData.get("provider"),
    bankName: formData.get("bankName"),
    accountNumber: formData.get("accountNumber"),
  });

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }

  const { provider, bankName, accountNumber } = validatedFields.data;
  await connectPayoutAccount(user.id, {
    provider,
    bankName,
    accountNumberLast4: accountNumber.slice(-4),
  });

  revalidatePath("/dashboard/account/bank");
  revalidatePath("/dashboard/earnings");
  return { success: true };
}

export async function runPayoutForTutor(tutorId: string): Promise<void> {
  const admin = await requireRole("admin");
  if (!admin) return;

  const unpaid = await listUnpaidPayoutsByTutor(tutorId);
  if (unpaid.length === 0) return;

  await markTutorPaid(unpaid.map((p) => p.id));
  revalidatePath("/dashboard/admin/reconciliation");
  revalidatePath("/dashboard/earnings");
}
