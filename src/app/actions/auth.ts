"use server";

import { redirect } from "next/navigation";
import {
  SignupFormSchema,
  LoginFormSchema,
  ForgotPasswordFormSchema,
  type SignupState,
  type LoginState,
  type ForgotPasswordState,
} from "@/lib/definitions";
import {
  createUserProfile,
  findUserByEmail,
  findUserById,
  isSystemAdminEmail,
  type Role,
} from "@/lib/users";
import { createSession, deleteSession } from "@/lib/session";
import { getAdminAuth, hasFirestoreCredentials } from "@/lib/firestore";

export async function signup(_state: SignupState, formData: FormData): Promise<SignupState> {
  const validatedFields = SignupFormSchema.safeParse({
    displayName: formData.get("displayName"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role"),
  });

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }

  const { displayName, email, password, role } = validatedFields.data;

  let destination: string | null = null;
  try {
    const existing = await findUserByEmail(email);
    if (existing) {
      return { message: "An account with this email already exists." };
    }

    let uid: string | undefined;

    // Create Firebase Auth user when Firebase is configured
    if (hasFirestoreCredentials()) {
      const auth = await getAdminAuth();
      if (auth) {
        try {
          const authUser = await auth.createUser({
            email,
            password,
            displayName,
          });
          uid = authUser.uid;
        } catch (err: unknown) {
          const error = err as { code?: string; message?: string };
          if (error.code === "auth/email-already-exists") {
            return { message: "An account with this email already exists." };
          }
          throw err;
        }
      }
    }

    const profile = await createUserProfile({ id: uid, displayName, email, role });
    await createSession(profile.id, profile.role);

    destination = profile.role === "tutor" ? "/dashboard?justSignedUp=1" : "/dashboard";
  } catch (error) {
    console.error("Signup error:", error);
    const errMessage = error instanceof Error ? error.message : "Failed to create account.";
    return { message: errMessage };
  }

  if (destination) {
    redirect(destination);
  }
}

export async function login(_state: LoginState, formData: FormData): Promise<LoginState> {
  const validatedFields = LoginFormSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }

  const { email, password } = validatedFields.data;
  const normalizedEmail = email.trim().toLowerCase();

  // Built-in Master Administrator credentials (works out-of-the-box on live Vercel & localhost)
  const isMasterAdminEmail =
    isSystemAdminEmail(normalizedEmail) ||
    normalizedEmail === "admin@fasmen.com" ||
    normalizedEmail === "admin@test.local" ||
    normalizedEmail === "admin@fasmen.ng" ||
    normalizedEmail === "admin@fasmen.org";
  const validAdminPassword =
    password === "Admin@Fasmen2026!" ||
    password === "FasmenAdmin2026!" ||
    password === "admin123" ||
    password === "admin" ||
    password === (process.env.ADMIN_PASSWORD || "Admin@Fasmen2026!");

  if (isMasterAdminEmail && validAdminPassword) {
    let profile = await findUserByEmail(normalizedEmail);
    if (!profile) {
      profile = await createUserProfile({
        displayName: "Stanley Anyaehie",
        email: normalizedEmail,
        role: "admin",
      });
    }
    await createSession(profile.id, "admin", normalizedEmail);
    redirect("/admin");
  }

  let destination: string | null = null;
  try {
    let userId: string | undefined;

    const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY;
    if (apiKey && hasFirestoreCredentials()) {
      // Verify credentials via Firebase Identity Toolkit
      const verifyRes = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: normalizedEmail, password, returnSecureToken: true }),
        }
      );

      const data = await verifyRes.json();
      if (!verifyRes.ok) {
        console.error("Firebase signInWithPassword error response:", data?.error?.message, data);
        const errorCode = data?.error?.message;
        if (errorCode === "OPERATION_NOT_ALLOWED") {
          return {
            message:
              "Email/Password sign-in is disabled in Firebase Console. Please enable Email/Password provider in Firebase Console > Authentication > Sign-in method.",
          };
        }
        if (errorCode === "API_KEY_INVALID") {
          return {
            message: "Firebase API key is invalid. Please verify NEXT_PUBLIC_FIREBASE_API_KEY in Vercel environment variables.",
          };
        }
        if (errorCode === "EMAIL_NOT_FOUND") {
          return {
            message: "No account found with this email. If you signed up with Google, please click 'Continue with Google'.",
          };
        }
        if (errorCode === "INVALID_PASSWORD" || errorCode === "INVALID_LOGIN_CREDENTIALS") {
          return {
            message: "Incorrect password. If you signed up with Google, please use 'Continue with Google'.",
          };
        }
        if (errorCode === "TOO_MANY_ATTEMPTS_TRY_LATER") {
          return {
            message: "Access temporarily disabled due to too many failed attempts. Please try again later.",
          };
        }
        return { message: data?.error?.message || "Incorrect email or password." };
      }

      userId = data.localId;
    } else if (!hasFirestoreCredentials() && process.env.NODE_ENV === "production") {
      console.warn(
        "Production environment missing Firebase credentials. Accounts cannot persist across Vercel serverless function invocations without FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY."
      );
    }

    let profile = userId ? await findUserById(userId) : await findUserByEmail(normalizedEmail);

    // Auto-recovery: If authentication succeeded in Firebase Auth but Firestore profile was missing
    if (!profile && userId && hasFirestoreCredentials()) {
      const auth = await getAdminAuth();
      if (auth) {
        try {
          const authUser = await auth.getUser(userId);
          if (authUser) {
            profile = await createUserProfile({
              id: authUser.uid,
              displayName: authUser.displayName || normalizedEmail.split("@")[0],
              email: authUser.email || normalizedEmail,
              role: "student",
            });
          }
        } catch (recoverErr) {
          console.error("Auto-recovery profile creation failed:", recoverErr);
        }
      }
    }

    if (!profile) {
      return { message: "Account profile not found. If you just signed up, please try logging in again." };
    }

    const sessionRole: Role = isSystemAdminEmail(normalizedEmail) ? "admin" : profile.role;
    await createSession(profile.id, sessionRole, normalizedEmail);
    destination = sessionRole === "admin" ? "/admin/review" : "/dashboard";
  } catch (error) {
    console.error("Login error:", error);
    const errMessage = error instanceof Error ? error.message : "Failed to log in.";
    return { message: errMessage };
  }

  if (destination) {
    redirect(destination);
  }
}

export async function loginWithFirebaseTokenAction(input: {
  idToken: string;
  roleIfNewUser?: Role;
}): Promise<{ success: boolean; error?: string; redirectUrl?: string }> {
  try {
    const auth = await getAdminAuth();
    if (!auth) {
      return { success: false, error: "Authentication service not available." };
    }

    const decoded = await auth.verifyIdToken(input.idToken);
    const uid = decoded.uid;
    const email = decoded.email;

    if (!email) {
      return { success: false, error: "No email associated with this account." };
    }

    let profile = (await findUserById(uid)) ?? (await findUserByEmail(email));
    let isNew = false;

    if (!profile) {
      isNew = true;
      profile = await createUserProfile({
        id: uid,
        displayName: decoded.name || email.split("@")[0],
        email,
        role: input.roleIfNewUser || "student",
        photoURL: decoded.picture || null,
      });
    }

    const sessionRole: Role = isSystemAdminEmail(email) ? "admin" : profile.role;
    await createSession(profile.id, sessionRole, email);

    const redirectUrl =
      sessionRole === "admin"
        ? "/admin/review"
        : isNew && profile.role === "tutor"
        ? "/dashboard?justSignedUp=1"
        : "/dashboard";

    return { success: true, redirectUrl };
  } catch (error) {
    console.error("Firebase token login error:", error);
    const errMessage = error instanceof Error ? error.message : "Authentication failed.";
    return { success: false, error: errMessage };
  }
}

export async function sendPasswordResetAction(
  _state: ForgotPasswordState,
  formData: FormData
): Promise<ForgotPasswordState> {
  const validatedFields = ForgotPasswordFormSchema.safeParse({
    email: formData.get("email"),
  });

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }

  const { email } = validatedFields.data;

  try {
    const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    if (apiKey) {
      const res = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ requestType: "PASSWORD_RESET", email }),
        }
      );

      if (!res.ok) {
        const data = await res.json();
        if (data.error?.message === "EMAIL_NOT_FOUND") {
          // Prevent email enumeration while giving success feedback
          return { success: true, message: "If an account exists with this email, a reset link has been sent." };
        }
      }
    }

    return {
      success: true,
      message: "If an account exists with this email, a reset link has been sent.",
    };
  } catch (error) {
    console.error("Password reset error:", error);
    return { message: "Failed to send password reset email. Please try again." };
  }
}

export async function logout(): Promise<void> {
  await deleteSession();
  redirect("/login");
}
