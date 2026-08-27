import { getCurrentUser } from "@/lib/dal";
import { adminLogoutAction } from "@/app/actions/admin-auth";
import { Sidebar, type SidebarNavItem } from "@/components/Sidebar";
import {
  HomeIcon,
  ClipboardCheckIcon,
  BookIcon,
  UserCircleIcon,
  WalletIcon,
  CertificateIcon,
  ShieldCheckIcon,
} from "@/components/icons";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const iconClass = "h-5 w-5 shrink-0";

const ADMIN_NAV_ITEMS: SidebarNavItem[] = [
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
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (user && user.role === "admin") {
    return (
      <div className="flex flex-1 flex-col lg:min-h-screen lg:flex-row bg-neutral-100">
        <Sidebar
          navItems={ADMIN_NAV_ITEMS}
          displayName={user.displayName || "Stanley Anyaehie"}
          roleLabel="System Admin"
          logoutAction={adminLogoutAction}
        />
        <div className="flex flex-1 flex-col min-w-0">
          <main className="flex-1 px-4 sm:px-6 lg:px-8 py-8 sm:py-10 max-w-7xl w-full mx-auto">
            {children}
          </main>
        </div>
      </div>
    );
  }

  return <main className="flex-1 bg-neutral-100 flex flex-col">{children}</main>;
}
