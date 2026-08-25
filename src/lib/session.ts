import { cookies } from "next/headers";
import {
  COOKIE_NAME,
  SESSION_DURATION_MS,
  type Role,
  type SessionPayload,
  encrypt,
  decrypt,
} from "./session-token";

export async function createSession(userId: string, role: Role, email?: string): Promise<void> {
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
  const sessionToken = await encrypt({ userId, role, email });

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: expiresAt,
    path: "/",
  });
}

export async function getSession(): Promise<SessionPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    return await decrypt(token);
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "digest" in error &&
      (error as { digest?: string }).digest === "DYNAMIC_SERVER_USAGE"
    ) {
      throw error;
    }
    console.error("getSession error:", error);
    return null;
  }
}

export async function deleteSession(): Promise<void> {
  try {
    const cookieStore = await cookies();
    cookieStore.delete(COOKIE_NAME);
  } catch {
    // Cookie deletion is only supported in Server Actions / Route Handlers
  }
}

export {
  COOKIE_NAME,
  SESSION_DURATION_MS,
  type Role,
  type SessionPayload,
  encrypt,
  decrypt,
};
