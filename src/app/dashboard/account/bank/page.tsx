import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/dal";
import { PayoutAccountForm } from "./PayoutAccountForm";

export default async function BankAccountPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "tutor") {
    redirect("/dashboard");
  }

  return (
    <div>
      <h2 className="font-heading text-lg font-semibold text-primary-900">Bank account</h2>
      <p className="mt-1 text-sm text-neutral-700">
        Where we send your course earnings — see the Earnings page for revenue and payout
        history.
      </p>

      <div className="mt-4">
        <PayoutAccountForm
          payoutAccount={user.tutorProfile?.payoutAccount ?? null}
          isVerified={Boolean(user.tutorProfile?.verified)}
        />
      </div>
    </div>
  );
}
