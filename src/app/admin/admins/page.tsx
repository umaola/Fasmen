import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/dal";
import { listAllAdmins, type UserProfile } from "@/lib/users";
import { revokeAdminAction } from "@/app/actions/admin-management";
import { AddAdminForm } from "./AddAdminForm";
import { ShieldCheckIcon, UserCircleIcon, CheckCircleIcon } from "@/components/icons";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminManagementPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    redirect("/admin/login");
  }

  const admins = await listAllAdmins();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <span className="text-xs font-semibold uppercase tracking-wider text-accent-600">
          Access Governance
        </span>
        <h1 className="font-heading text-2xl sm:text-3xl font-bold text-primary-900 mt-1">
          Administrator Team
        </h1>
        <p className="mt-1 text-sm text-neutral-700">
          Stanley Anyaehie and provisioned team administrators authorized to access the FASMEN control panel.
        </p>
      </div>

      {/* Add New Admin Form */}
      <AddAdminForm />

      {/* Current Administrators Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-lg font-bold text-primary-900">
            Active Administrators ({admins.length})
          </h2>
          <span className="text-xs text-neutral-500">
            🔒 Strictly no public signup · Internal provision only
          </span>
        </div>

        <div className="overflow-x-auto rounded-lg bg-white shadow-[0_1px_3px_rgba(18,22,28,0.08)] border border-neutral-200">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-200 text-neutral-700 text-xs font-semibold uppercase">
                <th className="px-4 py-3">Administrator</th>
                <th className="px-4 py-3">Email Address</th>
                <th className="px-4 py-3">Access Tier</th>
                <th className="px-4 py-3">Added Date</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {admins.map((a: UserProfile) => {
                const isStanley =
                  a.email.toLowerCase() === "admin@fasmen.com" ||
                  a.email.toLowerCase() === "stanley@fasmen.com" ||
                  a.displayName.toLowerCase().includes("stanley");

                return (
                  <tr key={a.id} className="border-b border-neutral-200 last:border-0 hover:bg-neutral-50 transition">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-100 text-primary-700 font-bold text-xs shrink-0">
                          {a.displayName.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-neutral-900">{a.displayName}</p>
                          {isStanley && (
                            <span className="text-[10px] font-semibold text-accent-600 uppercase tracking-wider">
                              Primary Owner
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3.5 font-mono text-xs text-neutral-700">
                      {a.email}
                    </td>

                    <td className="px-4 py-3.5">
                      {isStanley ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-primary-100 px-2.5 py-0.5 text-xs font-bold text-primary-900">
                          <ShieldCheckIcon className="h-3 w-3 text-primary-700" />
                          <span>Master Admin</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#e4f5ec] px-2.5 py-0.5 text-xs font-medium text-success-600">
                          <CheckCircleIcon className="h-3 w-3" />
                          <span>Provisioned Admin</span>
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3.5 text-xs text-neutral-700">
                      {new Date(a.createdAt).toLocaleDateString()}
                    </td>

                    <td className="px-4 py-3.5 text-right">
                      {isStanley ? (
                        <span className="text-xs text-neutral-400 italic">Protected</span>
                      ) : (
                        <form action={revokeAdminAction.bind(null, a.id)}>
                          <button
                            type="submit"
                            className="rounded border border-error-600 px-2.5 py-1 text-xs font-medium text-error-600 hover:bg-[#fbe9e7] transition cursor-pointer"
                          >
                            Revoke Access
                          </button>
                        </form>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
