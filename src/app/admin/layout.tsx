import Link from "next/link";
import { getCurrentUser } from "@/lib/dal";
import { adminLogoutAction } from "@/app/actions/admin-auth";
import { ShieldCheckIcon, ClipboardCheckIcon, LogOutIcon, BookIcon } from "@/components/icons";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      {/* Top Navigation Bar for Authenticated Admin */}
      {user && user.role === "admin" && (
        <header className="sticky top-0 z-50 bg-[#0f172a] text-white border-b border-neutral-800 shadow-sm">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
            {/* Logo & Portal Identity */}
            <div className="flex items-center gap-6">
              <Link href="/admin/review" className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-600 text-white font-bold">
                  <ShieldCheckIcon className="h-5 w-5" />
                </div>
                <div className="flex flex-col">
                  <span className="font-heading text-base font-bold tracking-tight text-white leading-none">
                    FASMEN
                  </span>
                  <span className="text-[10px] font-semibold tracking-wider uppercase text-primary-400">
                    Admin Portal
                  </span>
                </div>
              </Link>

              {/* Navigation Links */}
              <nav className="hidden md:flex items-center gap-1 border-l border-neutral-700/60 pl-6">
                <Link
                  href="/admin/review"
                  className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium bg-neutral-800/80 text-white transition hover:bg-neutral-800"
                >
                  <ClipboardCheckIcon className="h-4 w-4 text-primary-400" />
                  <span>Review Queue</span>
                </Link>
                <Link
                  href="/courses"
                  target="_blank"
                  className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium text-neutral-300 transition hover:bg-neutral-800 hover:text-white"
                >
                  <BookIcon className="h-4 w-4 text-neutral-400" />
                  <span>Live Catalog ↗</span>
                </Link>
              </nav>
            </div>

            {/* Admin User Info & Log Out */}
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-semibold text-white">
                  {user.displayName || "Administrator"}
                </span>
                <span className="text-[11px] text-primary-400 font-mono">
                  {user.email}
                </span>
              </div>

              <form action={adminLogoutAction}>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 rounded-md border border-neutral-700 bg-neutral-800/80 px-3 py-1.5 text-xs font-medium text-neutral-200 transition hover:bg-error-950 hover:border-error-700 hover:text-error-300 cursor-pointer"
                >
                  <LogOutIcon className="h-3.5 w-3.5" />
                  <span>Sign out</span>
                </button>
              </form>
            </div>
          </div>
        </header>
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col">{children}</main>
    </div>
  );
}
