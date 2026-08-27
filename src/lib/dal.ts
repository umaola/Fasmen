import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { getSession } from "./session";
import { findUserById, findUserByEmail, isSystemAdminEmail, createUserProfile, type UserProfile } from "./users";

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

    let user = await findUserById(session.userId);
    if (!user && session.email) {
      user = await findUserByEmail(session.email);
    }

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

    // Resilient auto-recovery for student and tutor accounts on live Vercel
    if (session.userId) {
      const email = session.email || `${session.userId}@user.fasmen.local`;
      const rawName = email.split("@")[0] || "User";
      const displayName = rawName.charAt(0).toUpperCase() + rawName.slice(1);
      const role = session.role || "student";

      const fallbackUser: UserProfile = {
        id: session.userId,
        displayName,
        email,
        phoneNumber: null,
        photoURL: null,
        role,
        bio: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tutorProfile:
          role === "tutor"
            ? {
                totalStudents: 0,
                averageRating: 0,
                verified: false,
                username: rawName.toLowerCase().replace(/[^a-z0-9]/g, "-"),
                idType: null,
                idNumber: null,
                payoutAccount: null,
              }
            : null,
      };

      // Asynchronously ensure profile is saved in Firestore/store
      createUserProfile(fallbackUser).catch(() => {});

      return fallbackUser;
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
