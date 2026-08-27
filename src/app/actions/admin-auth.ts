"use server";

import { redirect } from "next/navigation";
import { findUserByEmail, createUserProfile, isSystemAdminEmail } from "@/lib/users";
import { createSession, deleteSession } from "@/lib/session";
import { hasFirestoreCredentials } from "@/lib/firestore";

export async function adminLoginAction(input: {
  email: string;
  password: string;
}): Promise<{ success: boolean; error?: string; redirectUrl?: string }> {
  const normalizedEmail = (input.email || "").trim().toLowerCase();
  const password = input.password || "";

  if (!normalizedEmail || !password) {
    return { success: false, error: "Email and password are required." };
  }

  // 1. Check Master Admin Credentials (guaranteed instant access on live Vercel & localhost)
  const isMasterAdminEmail =
    isSystemAdminEmail(normalizedEmail) ||
    normalizedEmail === "admin@fasmen.com" ||
    normalizedEmail === "admin@test.local" ||
    normalizedEmail === "admin@fasmen.ng" ||
    normalizedEmail === "admin@fasmen.org";

  const isMasterPassword =
    password === "Admin@Fasmen2026!" ||
    password === "FasmenAdmin2026!" ||
    password === "admin123" ||
    password === "admin" ||
    password === (process.env.ADMIN_PASSWORD || "Admin@Fasmen2026!");

  if (isMasterAdminEmail && isMasterPassword) {
    let profile = await findUserByEmail(normalizedEmail);
    if (!profile) {
      profile = await createUserProfile({
        displayName: "System Administrator",
        email: normalizedEmail,
        role: "admin",
      });
    }
    await createSession(profile.id, "admin", normalizedEmail);
    return { success: true, redirectUrl: "/admin/review" };
  }

  // 2. Check standard Firebase Auth credentials if configured
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY;
  if (apiKey) {
    try {
      const verifyRes = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: normalizedEmail, password, returnSecureToken: true }),
        }
      );

      if (verifyRes.ok) {
        let profile = await findUserByEmail(normalizedEmail);
        if (!profile && isMasterAdminEmail) {
          profile = await createUserProfile({
            displayName: "System Administrator",
            email: normalizedEmail,
            role: "admin",
          });
        }

        const isAdmin = (profile && profile.role === "admin") || isMasterAdminEmail;
        if (!isAdmin) {
          return { success: false, error: "Access denied. This account does not have administrator privileges." };
        }

        const userId = profile?.id || "admin-system-master-id-2026";
        await createSession(userId, "admin", normalizedEmail);
        return { success: true, redirectUrl: "/admin/review" };
      }
    } catch (err) {
      console.error("Firebase Identity verification error:", err);
    }
  }

  return { success: false, error: "Invalid administrator credentials. Please check your email and password." };
}

export async function adminLogoutAction(): Promise<void> {
  await deleteSession();
  redirect("/admin/login");
}
