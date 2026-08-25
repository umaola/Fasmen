"use server";

import { redirect } from "next/navigation";
import { LoginFormSchema, type LoginState } from "@/lib/definitions";
import { findUserByEmail, createUserProfile, isSystemAdminEmail } from "@/lib/users";
import { createSession, deleteSession } from "@/lib/session";
import { hasFirestoreCredentials } from "@/lib/firestore";

export async function adminLoginAction(
  _state: LoginState,
  formData: FormData
): Promise<LoginState> {
  const validatedFields = LoginFormSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }

  const { email, password } = validatedFields.data;
  const normalizedEmail = email.trim().toLowerCase();

  // 1. Check Master Admin Credentials (guaranteed instant access on live Vercel & localhost)
  const isMasterAdminEmail =
    isSystemAdminEmail(normalizedEmail) ||
    normalizedEmail === "admin@fasmen.com" ||
    normalizedEmail === "admin@test.local" ||
    normalizedEmail === "admin@fasmen.ng";

  const isMasterPassword =
    password === "Admin@Fasmen2026!" ||
    password === "FasmenAdmin2026!" ||
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
    redirect("/admin/review");
  }

  // 2. Check standard Firebase Auth credentials if configured
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY;
  if (apiKey && hasFirestoreCredentials()) {
    try {
      const verifyRes = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: normalizedEmail, password, returnSecureToken: true }),
        }
      );

      if (!verifyRes.ok) {
        return { message: "Invalid administrator credentials. Please check your email and password." };
      }

      const profile = await findUserByEmail(normalizedEmail);
      if (!profile || profile.role !== "admin") {
        return { message: "Access denied. This account does not have administrator privileges." };
      }

      await createSession(profile.id, "admin", normalizedEmail);
      redirect("/admin/review");
    } catch (err) {
      if (err instanceof Error && err.message.includes("NEXT_REDIRECT")) {
        throw err;
      }
      console.error("Admin login error:", err);
      return { message: "Authentication service unavailable. Please try master credentials." };
    }
  }

  return { message: "Invalid administrator credentials. Please check your email and password." };
}

export async function adminLogoutAction(): Promise<void> {
  await deleteSession();
  redirect("/admin/login");
}
