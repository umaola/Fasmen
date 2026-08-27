import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/dal";
import { listAllPayments, type Payment } from "@/lib/payments";
import { listAllTutors, type UserProfile } from "@/lib/users";
import { formatNaira } from "@/lib/currency";
import { processTutorPayoutBatchAction } from "@/app/actions/admin-management";
import { WalletIcon, CheckCircleIcon } from "@/components/icons";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminFinancePage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    redirect("/admin/login");
  }

  const [payments, tutors] = await Promise.all([listAllPayments(), listAllTutors()]);

  const tutorMap = new Map<string, UserProfile>();
  for (const t of tutors) {
    if (t) tutorMap.set(t.id, t);
  }

  const successfulPayments = payments.filter((p: Payment) => p.status === "success");
  const grossKobo = successfulPayments.reduce((sum, p) => sum + p.amount, 0);
  const platformKobo = successfulPayments.reduce((sum, p) => sum + p.platformFeeAmount, 0);
  const tutorKobo = successfulPayments.reduce((sum, p) => sum + p.tutorPayoutAmount, 0);

  // Group pending unpaid payouts by tutor
  const unpaidByTutor = new Map<
    string,
    { tutor: UserProfile | undefined; count: number; totalKobo: number }
  >();

  for (const p of successfulPayments) {
    if (p.payoutStatus !== "unpaid") continue;
    const entry = unpaidByTutor.get(p.tutorId) || {
      tutor: tutorMap.get(p.tutorId),
      count: 0,
      totalKobo: 0,
    };
    entry.count += 1;
    entry.totalKobo += p.tutorPayoutAmount;
    unpaidByTutor.set(p.tutorId, entry);
  }

  const unpaidGrandTotalKobo = Array.from(unpaidByTutor.values()).reduce(
    (sum, entry) => sum + entry.totalKobo,
    0
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <span className="text-xs font-semibold uppercase tracking-wider text-accent-600">
          Financial Governance
        </span>
        <h1 className="font-heading text-2xl sm:text-3xl font-bold text-primary-900 mt-1">
          Reconciliation & Payouts
        </h1>
        <p className="mt-1 text-sm text-neutral-700">
          Track gross platform volume, platform 30% take rates, and disburse 70% revenue shares to instructors.
        </p>
      </div>

      {/* Financial Metrics Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg bg-white p-5 border border-neutral-200 shadow-[0_1px_3px_rgba(18,22,28,0.08)]">
          <span className="text-xs font-medium text-neutral-700">Gross Marketplace Volume</span>
          <p className="font-heading text-2xl font-bold text-primary-900 mt-2">{formatNaira(grossKobo)}</p>
          <span className="text-xs text-neutral-700 mt-1 block">All completed transactions</span>
        </div>

        <div className="rounded-lg bg-white p-5 border border-neutral-200 shadow-[0_1px_3px_rgba(18,22,28,0.08)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-700">Platform Revenue (30%)</span>
            <span className="rounded bg-accent-100 px-2 py-0.5 text-[10px] font-bold text-accent-600">
              NET SHARE
            </span>
          </div>
          <p className="font-heading text-2xl font-bold text-primary-900 mt-2">
            {formatNaira(platformKobo)}
          </p>
          <span className="text-xs text-neutral-700 mt-1 block">Net commissions retained</span>
        </div>

        <div className="rounded-lg bg-white p-5 border border-neutral-200 shadow-[0_1px_3px_rgba(18,22,28,0.08)]">
          <span className="text-xs font-medium text-neutral-700">Tutor Share (70%)</span>
          <p className="font-heading text-2xl font-bold text-primary-900 mt-2">{formatNaira(tutorKobo)}</p>
          <span className="text-xs text-neutral-700 mt-1 block">Total instructor allocations</span>
        </div>

        <div className="rounded-lg bg-white p-5 border border-neutral-200 shadow-[0_1px_3px_rgba(18,22,28,0.08)]">
          <span className="text-xs font-medium text-neutral-700">Pending Payout Due</span>
          <p className="font-heading text-2xl font-bold text-warning-600 mt-2">
            {formatNaira(unpaidGrandTotalKobo)}
          </p>
          <span className="text-xs text-neutral-700 mt-1 block">
            Across {unpaidByTutor.size} instructor{unpaidByTutor.size === 1 ? "" : "s"}
          </span>
        </div>
      </div>

      {/* Pending Payouts Action Box */}
      {unpaidByTutor.size > 0 ? (
        <div className="rounded-lg bg-white p-6 border border-neutral-200 shadow-[0_1px_3px_rgba(18,22,28,0.08)]">
          <div className="flex items-center gap-2 mb-4">
            <WalletIcon className="h-5 w-5 text-primary-700" />
            <h2 className="font-heading text-lg font-bold text-primary-900">
              Instructors with Pending Payouts
            </h2>
          </div>

          <div className="space-y-3">
            {Array.from(unpaidByTutor.entries()).map(([tutorId, entry]) => {
              const bank = entry.tutor?.tutorProfile?.payoutAccount;

              return (
                <div
                  key={tutorId}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-md bg-neutral-100 p-4 border border-neutral-200"
                >
                  <div>
                    <h3 className="font-medium text-neutral-900">
                      {entry.tutor?.displayName || `Instructor ID: ${tutorId}`}
                    </h3>
                    <p className="text-xs text-neutral-700">
                      {bank
                        ? `${bank.bankName} (••••${bank.accountNumberLast4}) · ${entry.count} unpaid transaction${entry.count === 1 ? "" : "s"}`
                        : `No bank details linked · ${entry.count} transactions`}
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="font-heading text-lg font-bold text-primary-900">
                      {formatNaira(entry.totalKobo)}
                    </span>

                    <form action={processTutorPayoutBatchAction.bind(null, tutorId)}>
                      <button
                        type="submit"
                        className="rounded-md bg-primary-700 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-primary-900 cursor-pointer"
                      >
                        Process Payout →
                      </button>
                    </form>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="rounded-lg bg-white p-6 border border-neutral-200 text-center shadow-[0_1px_3px_rgba(18,22,28,0.08)]">
          <div className="flex justify-center mb-2 text-success-600">
            <CheckCircleIcon className="h-6 w-6" />
          </div>
          <h2 className="font-heading text-base font-bold text-primary-900">All Payouts Settled</h2>
          <p className="text-xs text-neutral-700 mt-1">There are no pending balances waiting for disbursement.</p>
        </div>
      )}

      {/* Complete Transactions Ledger */}
      <div>
        <h2 className="font-heading text-lg font-semibold text-primary-900 mb-4">
          All Transactions Ledger
        </h2>

        {payments.length === 0 ? (
          <div className="rounded-lg bg-white p-8 border border-neutral-200 text-center text-sm text-neutral-700">
            No payments recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg bg-white shadow-[0_1px_3px_rgba(18,22,28,0.08)] border border-neutral-200">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-200 text-neutral-700 text-xs font-semibold uppercase">
                  <th className="px-4 py-3">Course Title</th>
                  <th className="px-4 py-3">Total Paid</th>
                  <th className="px-4 py-3">Platform 30%</th>
                  <th className="px-4 py-3">Tutor 70%</th>
                  <th className="px-4 py-3">Payment Status</th>
                  <th className="px-4 py-3">Payout State</th>
                  <th className="px-4 py-3 text-right">Date</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p: Payment) => (
                  <tr key={p.id} className="border-b border-neutral-200 last:border-0 hover:bg-neutral-50 transition">
                    <td className="px-4 py-3.5">
                      <p className="font-medium text-neutral-900">{p.courseTitle}</p>
                      <p className="text-xs text-neutral-700 font-mono">Ref: {p.providerReference}</p>
                    </td>
                    <td className="px-4 py-3.5 font-heading font-bold text-primary-900">
                      {formatNaira(p.amount)}
                    </td>
                    <td className="px-4 py-3.5 text-neutral-700">
                      {formatNaira(p.platformFeeAmount)}
                    </td>
                    <td className="px-4 py-3.5 text-neutral-700">
                      {formatNaira(p.tutorPayoutAmount)}
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
                          p.status === "success"
                            ? "bg-[#e4f5ec] text-success-600"
                            : p.status === "pending"
                            ? "bg-[#fcf3e1] text-warning-600"
                            : "bg-[#fbe9e7] text-error-600"
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
                          p.payoutStatus === "paid"
                            ? "bg-[#e4f5ec] text-success-600"
                            : "bg-[#fcf3e1] text-warning-600"
                        }`}
                      >
                        {p.payoutStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right text-xs text-neutral-700">
                      {new Date(p.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
