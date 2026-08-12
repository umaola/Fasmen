"use client";

import { Suspense, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { logEvent } from "firebase/analytics";
import { getFirebaseAnalytics } from "@/lib/firebase";

// Next.js App Router navigations don't trigger full page loads, so Firebase
// Analytics' automatic page_view tracking never fires on route changes —
// this logs one manually whenever the pathname or query string changes.
function PageViewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const query = searchParams.toString();
    const pagePath = query ? `${pathname}?${query}` : pathname;

    getFirebaseAnalytics().then((analytics) => {
      if (!analytics) return;
      logEvent(analytics, "page_view", { page_path: pagePath });
    });
  }, [pathname, searchParams]);

  return null;
}

export function FirebaseAnalytics() {
  return (
    <Suspense fallback={null}>
      <PageViewTracker />
    </Suspense>
  );
}
