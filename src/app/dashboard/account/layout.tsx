import { AccountNav } from "./AccountNav";
import { getCurrentUser } from "@/lib/dal";

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  if (user?.role === "student") {
    return <div>{children}</div>;
  }

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-primary-900">Account</h1>
      <div className="mt-6 flex flex-col gap-6 lg:flex-row">
        <AccountNav />
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}
