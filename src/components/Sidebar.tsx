"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MenuIcon, CloseIcon, LogOutIcon } from "./icons";

export interface SidebarNavItem {
  href: string;
  label: string;
  // A rendered element, not a component reference — component references
  // aren't serializable across the server/client boundary this prop crosses.
  icon: React.ReactNode;
}

export function Sidebar({
  navItems,
  displayName,
  roleLabel,
  logoutAction,
}: {
  navItems: SidebarNavItem[];
  displayName: string;
  roleLabel: string;
  logoutAction: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const navContent = (
    <>
      <div className="px-5 pt-5 pb-4">
        <span className="font-heading text-lg font-semibold text-white">Fasmen</span>
        <p className="mt-3 text-sm font-medium text-white">{displayName}</p>
        <p className="text-xs text-primary-100">{roleLabel}</p>
      </div>
      <nav className="flex-1 space-y-1 px-3">
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition ${
                active
                  ? "bg-accent-600 text-white"
                  : "text-primary-100 hover:bg-white/10 hover:text-white"
              }`}
            >
              {item.icon}
              {item.label}
            </Link>
          );
        })}
      </nav>
      <form action={logoutAction} className="px-3 pt-2 pb-5">
        <button
          type="submit"
          className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-primary-100 transition hover:bg-white/10 hover:text-white"
        >
          <LogOutIcon className="h-5 w-5 shrink-0" />
          Logout
        </button>
      </form>
    </>
  );

  return (
    <>
      <div className="flex items-center justify-between border-b border-neutral-200 bg-white px-4 py-3 lg:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          className="rounded-md p-2 text-neutral-700 hover:bg-neutral-100"
        >
          <MenuIcon className="h-6 w-6" />
        </button>
        <span className="font-heading text-lg font-semibold text-primary-900">Fasmen</span>
        <div className="w-10" />
      </div>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close menu backdrop"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/40"
          />
          <div className="relative flex h-full w-64 flex-col bg-primary-900">
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
              className="absolute top-4 right-3 rounded-md p-2 text-primary-100 hover:bg-white/10"
            >
              <CloseIcon className="h-5 w-5" />
            </button>
            {navContent}
          </div>
        </div>
      )}

      <div className="hidden lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-60 lg:shrink-0 lg:flex-col lg:overflow-y-auto lg:bg-primary-900">
        {navContent}
      </div>
    </>
  );
}
