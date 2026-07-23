import Link from "next/link";
import { getCurrentUser } from "@/lib/dal";
import { logout } from "@/app/actions/auth";
import { Sidebar, type SidebarNavItem } from "@/components/Sidebar";
import {
  HomeIcon,
  BookIcon,
  ClipboardCheckIcon,
  WalletIcon,
  UserCircleIcon,
  ShieldCheckIcon,
  StarIcon,
  CreditCardIcon,
} from "@/components/icons";

const ROLE_LABELS: Record<string, string> = {
  student: "Student",
  tutor: "Private instructor",
  admin: "Admin",
};

// Tutor and admin get the dashboard-density left sidebar (design-system.md 5.7);
// student keeps a simple top nav — students need a lighter, less operational feel.
const iconClass = "h-5 w-5 shrink-0";

const SIDEBAR_NAV: Record<"tutor" | "admin", SidebarNavItem[]> = {
  tutor: [
    { href: "/dashboard", label: "Dashboard", icon: <HomeIcon className={iconClass} /> },
    { href: "/dashboard/courses", label: "Your courses", icon: <BookIcon className={iconClass} /> },
    { href: "/dashboard/earnings", label: "Earnings", icon: <WalletIcon className={iconClass} /> },
    { href: "/dashboard/reviews", label: "Reviews", icon: <StarIcon className={iconClass} /> },
    {
      href: "/dashboard/subscription",
      label: "Subscription",
      icon: <CreditCardIcon className={iconClass} />,
    },
    {
      href: "/dashboard/verification",
      label: "Verification",
      icon: <ShieldCheckIcon className={iconClass} />,
    },
    {
      href: "/dashboard/settings",
      label: "Profile",
      icon: <UserCircleIcon className={iconClass} />,
    },
  ],
  admin: [
    { href: "/dashboard", label: "Dashboard", icon: <HomeIcon className={iconClass} /> },
    {
      href: "/dashboard/admin/review",
      label: "Review queue",
      icon: <ClipboardCheckIcon className={iconClass} />,
    },
    {
      href: "/dashboard/admin/reconciliation",
      label: "Reconciliation",
      icon: <WalletIcon className={iconClass} />,
    },
  ],
};

const STUDENT_NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/courses", label: "Browse courses" },
  { href: "/dashboard/certificates", label: "Certificates" },
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  if (user && (user.role === "tutor" || user.role === "admin")) {
    const showVerificationBanner = user.role === "tutor" && !user.tutorProfile?.verified;

    return (
      <div className="flex flex-1 flex-col lg:min-h-screen lg:flex-row">
        <Sidebar
          navItems={SIDEBAR_NAV[user.role]}
          displayName={user.displayName}
          roleLabel={ROLE_LABELS[user.role]}
          logoutAction={logout}
        />
        <div className="flex flex-1 flex-col">
          {showVerificationBanner && (
            <div className="flex flex-wrap items-center justify-between gap-2 bg-[#fcf3e1] px-6 py-3 text-sm text-warning-600">
              <span>
                Complete your tutor verification to unlock course submission and get your public
                portfolio link.
              </span>
              <Link href="/dashboard/verification" className="font-medium underline">
                Complete now
              </Link>
            </div>
          )}
          <main className="flex-1 bg-neutral-100 px-6 py-10">{children}</main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between border-b border-neutral-200 bg-white px-6 py-4">
        <div className="flex items-center gap-6">
          <span className="font-heading text-lg font-semibold text-primary-900">Fasmen</span>
          {user && (
            <nav className="hidden gap-4 sm:flex">
              {STUDENT_NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm font-medium text-neutral-700 hover:text-primary-700"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          )}
        </div>
        <div className="flex items-center gap-4">
          {user && (
            <span className="hidden text-sm text-neutral-700 sm:inline">
              {user.displayName} ·{" "}
              <span className="font-medium text-primary-700">{ROLE_LABELS[user.role]}</span>
            </span>
          )}
          <form action={logout}>
            <button
              type="submit"
              className="h-9 rounded-sm border border-neutral-200 px-4 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100"
            >
              Log out
            </button>
          </form>
        </div>
      </header>
      <main className="flex-1 bg-neutral-100 px-6 py-10">{children}</main>
    </div>
  );
}
