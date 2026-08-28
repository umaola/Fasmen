"use server";

import { redirect } from "next/navigation";
import { decodeJwt } from "jose";
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
  type UserProfile,
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
  const normalizedEmail = email.trim().toLowerCase();

  let destination: string | null = null;
  try {
    const existing = await findUserByEmail(normalizedEmail);
    if (existing) {
      return { message: "An account with this email already exists. Please log in instead." };
    }

    let uid: string | undefined;

    // 1. Try Firebase Admin Auth SDK first
    if (hasFirestoreCredentials()) {
      const auth = await getAdminAuth();
      if (auth) {
        try {
          const authUser = await auth.createUser({
            email: normalizedEmail,
            password,
            displayName,
          });
          uid = authUser.uid;
        } catch (err: unknown) {
          const error = err as { code?: string; message?: string };
          if (error.code === "auth/email-already-exists") {
            return { message: "An account with this email already exists. Please log in." };
          }
          console.warn("Firebase Admin createUser warning:", err);
        }
      }
    }

    // 2. Fallback to Firebase REST API if Admin SDK was unavailable
    const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY;
    if (!uid && apiKey) {
      try {
        const signUpRes = await fetch(
          `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: normalizedEmail,
              password,
              displayName,
              returnSecureToken: true,
            }),
          }
        );
        const signUpData = await signUpRes.json();
        if (signUpRes.ok && signUpData.localId) {
          uid = signUpData.localId;
        } else if (signUpData?.error?.message === "EMAIL_EXISTS") {
          return { message: "An account with this email already exists. Please log in." };
        }
      } catch (restErr) {
        console.warn("Firebase REST signUp warning:", restErr);
      }
    }

    const profile = await createUserProfile({
      id: uid,
      displayName,
      email: normalizedEmail,
      role: isSystemAdminEmail(normalizedEmail) ? "admin" : role,
    });

    await createSession(profile.id, profile.role, normalizedEmail);
    destination = profile.role === "tutor" ? "/dashboard?justSignedUp=1" : "/dashboard";
  } catch (error) {
    if (
      (typeof error === "object" && error !== null && "digest" in error) ||
      (error instanceof Error && error.message === "NEXT_REDIRECT")
    ) {
      throw error;
    }
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

  // 1. Enforce admin isolation: Administrators MUST log in via the dedicated Admin Portal (/admin/login)
  const isAdminEmail = isSystemAdminEmail(normalizedEmail);
  const existingProfile = await findUserByEmail(normalizedEmail);

  if (isAdminEmail || existingProfile?.role === "admin") {
    return {
      message: "Administrator accounts must sign in via the Admin Portal at /admin/login.",
    };
  }

  let destination: string | null = null;
  try {
    let userId: string | undefined;
    let authDisplayName: string | undefined;

    const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY;

    // 2. Verify with Firebase Identity Toolkit REST API (Works on Vercel with just the Web API Key)
    if (apiKey) {
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
        console.warn("Firebase signInWithPassword response:", data?.error?.message);
        const errorCode = data?.error?.message;

        // Check if user exists in local/fallback database
        const fallbackProfile = await findUserByEmail(normalizedEmail);
        if (fallbackProfile) {
          if (fallbackProfile.role === "admin") {
            return {
              message: "Administrator accounts must sign in via the Admin Portal at /admin/login.",
            };
          }
          await createSession(fallbackProfile.id, fallbackProfile.role, normalizedEmail);
          destination = "/dashboard";
        } else {
          if (errorCode === "CONFIGURATION_NOT_FOUND" || errorCode === "PROJECT_NOT_FOUND") {
            return {
              message:
                "Firebase Authentication is not enabled for this project yet. Please go to Firebase Console (https://console.firebase.google.com) > Build > Authentication > 'Sign-in method' and click 'Get Started' then enable 'Email/Password'.",
            };
          } else if (errorCode === "OPERATION_NOT_ALLOWED") {
            return {
              message:
                "Email/Password sign-in is disabled in Firebase Console. Please enable Email/Password in Firebase Console > Authentication > Sign-in method.",
            };
          } else if (errorCode === "API_KEY_INVALID") {
            return {
              message: "Firebase API key is invalid. Please verify NEXT_PUBLIC_FIREBASE_API_KEY.",
            };
          } else if (errorCode === "EMAIL_NOT_FOUND") {
            return {
              message: "No account found with this email. Please click 'Signup' to create an account or sign in with Google.",
            };
          } else if (errorCode === "INVALID_PASSWORD" || errorCode === "INVALID_LOGIN_CREDENTIALS") {
            return {
              message: "Incorrect password. Please verify your credentials or click 'Forgot password?'.",
            };
          } else if (errorCode === "TOO_MANY_ATTEMPTS_TRY_LATER") {
            return {
              message: "Access temporarily disabled due to too many failed attempts. Please try again later.",
            };
          } else {
            return { message: data?.error?.message || "Incorrect email or password." };
          }
        }
      } else {
        userId = data.localId;
        authDisplayName = data.displayName;
      }
    }

    // 3. Resolve or Auto-Synthesize Profile
    if (!destination) {
      let profile: UserProfile | undefined = userId
        ? ((await findUserById(userId)) ?? (await findUserByEmail(normalizedEmail)))
        : await findUserByEmail(normalizedEmail);

      if (profile?.role === "admin") {
        return {
          message: "Administrator accounts must sign in via the Admin Portal at /admin/login.",
        };
      }

      if (!profile) {
        profile = await createUserProfile({
          id: userId,
          displayName: authDisplayName || normalizedEmail.split("@")[0],
          email: normalizedEmail,
          role: "student",
        });
      }

      await createSession(profile.id, profile.role, normalizedEmail);
      destination = "/dashboard";
    }
  } catch (error) {
    if (
      (typeof error === "object" && error !== null && "digest" in error) ||
      (error instanceof Error && error.message === "NEXT_REDIRECT")
    ) {
      throw error;
    }
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
    let uid: string | undefined;
    let email: string | undefined;
    let displayName: string | undefined;
    let photoURL: string | null = null;

    // 1. Try Firebase Admin SDK verification
    try {
      const auth = await getAdminAuth();
      if (auth) {
        const decoded = await auth.verifyIdToken(input.idToken);
        uid = decoded.uid;
        email = decoded.email;
        displayName = decoded.name;
        photoURL = decoded.picture || null;
      }
    } catch (adminErr) {
      console.warn("Admin SDK verifyIdToken failed, attempting fallback:", adminErr);
    }

    // 2. Fallback: Verify via Google tokeninfo endpoint
    if (!uid || !email) {
      try {
        const tokenInfoRes = await fetch(
          `https://oauth2.googleapis.com/tokeninfo?id_token=${input.idToken}`
        );
        if (tokenInfoRes.ok) {
          const info = await tokenInfoRes.json();
          uid = info.user_id || info.sub;
          email = info.email;
          displayName = info.name;
          photoURL = info.picture || null;
        }
      } catch (tokenInfoErr) {
        console.warn("Google tokeninfo fallback failed:", tokenInfoErr);
      }
    }

    // 3. Fallback: Parse decoded JWT payload
    if (!uid || !email) {
      try {
        const payload = decodeJwt(input.idToken) as {
          sub?: string;
          user_id?: string;
          email?: string;
          name?: string;
          picture?: string;
        };
        uid = payload.user_id || payload.sub;
        email = payload.email;
        displayName = payload.name;
        photoURL = payload.picture || null;
      } catch (jwtErr) {
        console.warn("JWT decode fallback failed:", jwtErr);
      }
    }

    if (!uid || !email) {
      return { success: false, error: "Failed to authenticate Google identity token." };
    }

    const normalizedEmail = email.trim().toLowerCase();
    const isAdminEmail = isSystemAdminEmail(normalizedEmail);
    let profile = (await findUserById(uid)) ?? (await findUserByEmail(normalizedEmail));

    if (isAdminEmail || profile?.role === "admin") {
      return {
        success: false,
        error: "Administrator accounts must sign in via the Admin Portal at /admin/login.",
      };
    }

    let isNew = false;
    if (!profile) {
      isNew = true;
      profile = await createUserProfile({
        id: uid,
        displayName: displayName || normalizedEmail.split("@")[0],
        email: normalizedEmail,
        role: input.roleIfNewUser || "student",
        photoURL,
      });
    }

    await createSession(profile.id, profile.role, normalizedEmail);

    const redirectUrl =
      isNew && profile.role === "tutor"
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
  const normalizedEmail = email.trim().toLowerCase();

  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY;
  if (apiKey) {
    try {
      await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            requestType: "PASSWORD_RESET",
            email: normalizedEmail,
          }),
        }
      );
    } catch (err) {
      console.warn("sendPasswordReset error:", err);
    }
  }

  return { success: true };
}

export async function logout(): Promise<void> {
  await deleteSession();
  redirect("/login");
}
