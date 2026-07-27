"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserCircleIcon, ShieldCheckIcon, WalletIcon } from "@/components/icons";

const ACCOUNT_NAV = [
  { href: "/dashboard/account", label: "Profile", icon: UserCircleIcon },
  { href: "/dashboard/account/verify", label: "Verify identity", icon: ShieldCheckIcon },
  { href: "/dashboard/account/bank", label: "Bank account", icon: WalletIcon },
];

export function AccountNav() {
  const pathname = usePathname();

  return (
    <nav className="flex w-full shrink-0 flex-col gap-1 rounded-lg bg-white p-2 shadow-[0_1px_3px_rgba(18,22,28,0.08)] lg:w-56">
      {ACCOUNT_NAV.map((item) => {
        const active = pathname === item.href;
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition ${
              active ? "bg-primary-100 text-primary-700" : "text-neutral-700 hover:bg-neutral-100"
            }`}
          >
            <Icon className="h-5 w-5 shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
