import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/dal";
import { listPaymentsByTutor } from "@/lib/payments";
import { formatNaira } from "@/lib/currency";
import { PayoutAccountForm } from "./PayoutAccountForm";
import { EarningsAnalytics } from "./EarningsAnalytics";

export default async function EarningsPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "tutor") {
    redirect("/dashboard");
  }

  const payments = await listPaymentsByTutor(user.id);
  const successful = payments.filter((p) => p.status === "success");
  const paidOut = successful.filter((p) => p.payoutStatus === "paid");
  const pending = successful.filter((p) => p.payoutStatus === "unpaid");

  const totalRevenue = successful.reduce((sum, p) => sum + p.amount, 0);
  const paidOutAmount = paidOut.reduce((sum, p) => sum + p.tutorPayoutAmount, 0);
  const pendingAmount = pending.reduce((sum, p) => sum + p.tutorPayoutAmount, 0);

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-primary-900">Earnings</h1>
      <p className="mt-1 text-sm text-neutral-700">
        Enrollments are simulated locally until a real payment provider is wired up — an admin
        marks payouts as sent from the reconciliation dashboard until real bank transfers exist.
      </p>

      <div className="mt-6">
        <PayoutAccountForm
          payoutAccount={user.tutorProfile?.payoutAccount ?? null}
          isVerified={Boolean(user.tutorProfile?.verified)}
        />
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg bg-white p-5 shadow-[0_1px_3px_rgba(18,22,28,0.08)]">
          <p className="text-sm text-neutral-700">Total revenue</p>
          <p className="font-heading mt-1 text-2xl font-bold text-primary-900">
            {formatNaira(totalRevenue)}
          </p>
        </div>
        <div className="rounded-lg bg-white p-5 shadow-[0_1px_3px_rgba(18,22,28,0.08)]">
          <p className="text-sm text-neutral-700">Paid out</p>
          <p className="font-heading mt-1 text-2xl font-bold text-success-600">
            {formatNaira(paidOutAmount)}
          </p>
        </div>
        <div className="rounded-lg bg-white p-5 shadow-[0_1px_3px_rgba(18,22,28,0.08)]">
          <p className="text-sm text-neutral-700">Pending payout</p>
          <p className="font-heading mt-1 text-2xl font-bold text-warning-600">
            {formatNaira(pendingAmount)}
          </p>
        </div>
      </div>

      <div className="mt-8">
        <EarningsAnalytics payments={payments} />
      </div>
    </div>
  );
}
