import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { getSession } from "./session";
import { findUserById } from "./users";

// Also guards against a session cookie that outlived its user record (e.g.
// the local JSON store was reset during development) — without this check,
// the page would render with a null user instead of bouncing to /login.
export const verifySession = cache(async () => {
  const session = await getSession();
  if (!session?.userId) {
    redirect("/login");
  }

  const user = await findUserById(session.userId);
  if (!user) {
    redirect("/login");
  }

  return session;
});

export const getCurrentUser = cache(async () => {
  try {
    const session = await getSession();
    if (!session?.userId) return null;
    return (await findUserById(session.userId)) ?? null;
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "digest" in error &&
      (error as { digest?: string }).digest === "DYNAMIC_SERVER_USAGE"
    ) {
      throw error;
    }
    console.error("getCurrentUser error:", error);
    return null;
  }
});
