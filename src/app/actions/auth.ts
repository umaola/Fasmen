"use server";

import { redirect } from "next/navigation";
import {
  SignupFormSchema,
  LoginFormSchema,
  type SignupState,
  type LoginState,
} from "@/lib/definitions";
import { createUserProfile, findUserByEmail, findUserById } from "@/lib/users";
import { createCredential, credentialsExistForEmail, verifyCredential } from "@/lib/credentials";
import { createSession, deleteSession } from "@/lib/session";

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
    if (await credentialsExistForEmail(email)) {
      return { message: "An account with this email already exists." };
    }

    const profile = await createUserProfile({ displayName, email, role });
    await createCredential(profile.id, email, password);
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

  let destination: string | null = null;
  try {
    const userId = await verifyCredential(email, password);
    if (!userId) {
      return { message: "Incorrect email or password." };
    }

    const profile = (await findUserById(userId)) ?? (await findUserByEmail(email));
    if (!profile) {
      return { message: "Incorrect email or password." };
    }

    await createSession(profile.id, profile.role);
    destination = "/dashboard";
  } catch (error) {
    console.error("Login error:", error);
    const errMessage = error instanceof Error ? error.message : "Failed to log in.";
    return { message: errMessage };
  }

  if (destination) {
    redirect(destination);
  }
}

export async function logout(): Promise<void> {
  await deleteSession();
  redirect("/login");
}
