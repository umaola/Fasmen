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
  StarIcon,
  CreditCardIcon,
  CertificateIcon,
  ShieldCheckIcon,
  HeartIcon,
} from "@/components/icons";

const ROLE_LABELS: Record<string, string> = {
  student: "Student",
  tutor: "Private instructor",
  admin: "Admin",
};

const iconClass = "h-5 w-5 shrink-0";

const SIDEBAR_NAV: Record<"student" | "tutor" | "admin", SidebarNavItem[]> = {
  student: [
    { href: "/dashboard", label: "Dashboard", icon: <HomeIcon className={iconClass} /> },
    {
      href: "/dashboard/saved",
      label: "Saved courses",
      icon: <HeartIcon className={iconClass} />,
    },
    {
      href: "/dashboard/certificates",
      label: "Certificates",
      icon: <CertificateIcon className={iconClass} />,
    },
    {
      href: "/dashboard/account",
      label: "Account",
      icon: <UserCircleIcon className={iconClass} />,
    },
  ],
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
      href: "/dashboard/account",
      label: "Account",
      icon: <UserCircleIcon className={iconClass} />,
    },
  ],
  admin: [
    { href: "/admin", label: "Overview", icon: <HomeIcon className={iconClass} /> },
    {
      href: "/admin/review",
      label: "Review Queue",
      icon: <ClipboardCheckIcon className={iconClass} />,
    },
    { href: "/admin/courses", label: "Course Catalog", icon: <BookIcon className={iconClass} /> },
    { href: "/admin/tutors", label: "Instructors", icon: <UserCircleIcon className={iconClass} /> },
    { href: "/admin/students", label: "Students", icon: <UserCircleIcon className={iconClass} /> },
    { href: "/admin/enrollments", label: "Enrollments", icon: <BookIcon className={iconClass} /> },
    {
      href: "/admin/finance",
      label: "Finance & Payouts",
      icon: <WalletIcon className={iconClass} />,
    },
    {
      href: "/admin/certificates",
      label: "Certificates",
      icon: <CertificateIcon className={iconClass} />,
    },
    {
      href: "/admin/admins",
      label: "Admin Team",
      icon: <ShieldCheckIcon className={iconClass} />,
    },
  ],
};

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  if (user) {
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
                Complete your tutor verification to unlock course creation and get your public
                portfolio link.
              </span>
              <Link href="/dashboard/account/verify" className="font-medium underline">
                Complete now
              </Link>
            </div>
          )}
          <main className="flex-1 bg-neutral-100 px-6 py-10">{children}</main>
        </div>
      </div>
    );
  }

  return <main className="flex-1 bg-neutral-100 px-6 py-10">{children}</main>;
}
