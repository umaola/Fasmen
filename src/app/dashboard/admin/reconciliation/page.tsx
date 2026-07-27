import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/dal";
import { listAllPayments } from "@/lib/payments";
import { formatNaira } from "@/lib/currency";
import { runPayoutForTutor } from "@/app/actions/payouts";

export default async function ReconciliationPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    redirect("/dashboard");
  }

  const payments = await listAllPayments();

  const byTutor = new Map<string, { name: string; unpaidAmount: number; unpaidCount: number }>();
  for (const payment of payments) {
    if (payment.status !== "success" || payment.payoutStatus !== "unpaid") continue;
    const entry = byTutor.get(payment.tutorId) ?? { name: "", unpaidAmount: 0, unpaidCount: 0 };
    entry.unpaidAmount += payment.tutorPayoutAmount;
    entry.unpaidCount += 1;
    byTutor.set(payment.tutorId, entry);
  }

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-primary-900">Reconciliation</h1>
      <p className="mt-1 text-sm text-neutral-700">
        Every simulated enrollment payment, with tutor payout status. There&apos;s no real
        settlement to reconcile against yet — this is a ledger view until a payment provider is
        wired up.
      </p>

      {byTutor.size > 0 && (
        <div className="mt-6 rounded-lg bg-white p-5 shadow-[0_1px_3px_rgba(18,22,28,0.08)]">
          <h2 className="font-heading text-lg font-semibold text-primary-900">Pending payouts</h2>
          <ul className="mt-3 flex flex-col gap-2">
            {Array.from(byTutor.entries()).map(([tutorId, entry]) => (
              <li key={tutorId} className="flex items-center justify-between text-sm">
                <span className="text-neutral-900">
                  {entry.unpaidCount} unpaid enrollment{entry.unpaidCount === 1 ? "" : "s"} —{" "}
                  {formatNaira(entry.unpaidAmount)}
                </span>
                <form action={runPayoutForTutor.bind(null, tutorId)}>
                  <button
                    type="submit"
                    className="h-9 rounded-md bg-primary-700 px-4 text-sm font-medium text-white transition hover:bg-primary-900"
                  >
                    Run payout
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </div>
      )}

      <h2 className="font-heading mt-8 text-lg font-semibold text-primary-900">All payments</h2>
      {payments.length === 0 ? (
        <p className="mt-2 text-sm text-neutral-700">No payments yet.</p>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-lg bg-white shadow-[0_1px_3px_rgba(18,22,28,0.08)]">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-200 text-neutral-700">
                <th className="px-4 py-3 font-medium">Course</th>
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Platform fee</th>
                <th className="px-4 py-3 font-medium">Tutor payout</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Payout</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr key={payment.id} className="border-b border-neutral-200 last:border-0">
                  <td className="px-4 py-3 text-neutral-900">{payment.courseTitle}</td>
                  <td className="px-4 py-3">{formatNaira(payment.amount)}</td>
                  <td className="px-4 py-3">{formatNaira(payment.platformFeeAmount)}</td>
                  <td className="px-4 py-3">{formatNaira(payment.tutorPayoutAmount)}</td>
                  <td className="px-4 py-3 capitalize">{payment.status}</td>
                  <td className="px-4 py-3 capitalize">{payment.payoutStatus}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
