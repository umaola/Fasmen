import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { getSession } from "./session";
import { findUserById, isSystemAdminEmail, type UserProfile } from "./users";

// Also guards against a session cookie that outlived its user record (e.g.
// the local JSON store was reset during development) — without this check,
// the page would render with a null user instead of bouncing to /login.
export const verifySession = cache(async () => {
  const session = await getSession();
  if (!session?.userId) {
    redirect("/login");
  }

  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  return session;
});

export const getCurrentUser = cache(async (): Promise<UserProfile | null> => {
  try {
    const session = await getSession();
    if (!session?.userId) return null;

    const user = await findUserById(session.userId);
    if (user) {
      if (
        session.role === "admin" ||
        (user.email && isSystemAdminEmail(user.email)) ||
        (session.email && isSystemAdminEmail(session.email))
      ) {
        return {
          ...user,
          role: "admin",
        };
      }
      return user;
    }

    // Resilient fallback for Stanley Anyaehie or embedded session identity
    if (session.role === "admin" || (session.email && isSystemAdminEmail(session.email))) {
      return {
        id: session.userId,
        displayName: "Stanley Anyaehie",
        email: session.email || "admin@fasmen.com",
        phoneNumber: null,
        photoURL: null,
        role: "admin",
        bio: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tutorProfile: null,
      };
    }

    return null;
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

