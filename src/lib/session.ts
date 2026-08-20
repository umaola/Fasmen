import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import { cookies } from "next/headers";
import type { Role } from "./users";
import { getAdminAuth, hasFirestoreCredentials } from "./firestore";

const COOKIE_NAME = "fasmen_session";
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function getEncodedKey(): Uint8Array {
  const secretKey = process.env.SESSION_SECRET;
  if (!secretKey) {
    return new TextEncoder().encode("dev-secret-key-must-be-at-least-32-characters-long-12345");
  }
  return new TextEncoder().encode(secretKey);
}

export interface SessionPayload extends JWTPayload {
  userId: string;
  role: Role;
  email?: string;
}

async function encrypt(payload: SessionPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getEncodedKey());
}

export async function decrypt(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null;

  // 1. Check with Firebase Admin if Firebase is configured
  if (hasFirestoreCredentials()) {
    try {
      const auth = getAdminAuth();
      if (auth) {
        try {
          const decoded = await auth.verifySessionCookie(token, false);
          return {
            userId: decoded.uid,
            role: (decoded.role as Role) || "student",
            email: decoded.email,
          };
        } catch {
          try {
            const decoded = await auth.verifyIdToken(token);
            return {
              userId: decoded.uid,
              role: (decoded.role as Role) || "student",
              email: decoded.email,
            };
          } catch {
            // Continue to JWT fallback
          }
        }
      }
    } catch {
      // Continue to JWT fallback if Firebase Admin check fails
    }
  }

  // 2. Fallback to custom JWT verify
  try {
    const { payload } = await jwtVerify<SessionPayload>(token, getEncodedKey(), {
      algorithms: ["HS256"],
    });
    return payload;
  } catch {
    return null;
  }
}

export async function createSession(userId: string, role: Role, idToken?: string): Promise<void> {
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
  let sessionToken: string | null = null;

  // If Firebase idToken is provided, generate a Firebase Admin Session Cookie
  if (idToken && hasFirestoreCredentials()) {
    const auth = getAdminAuth();
    if (auth) {
      try {
        sessionToken = await auth.createSessionCookie(idToken, { expiresIn: SESSION_DURATION_MS });
        try {
          await auth.setCustomUserClaims(userId, { role });
        } catch {
          // Custom claims optional
        }
      } catch (err) {
        console.error("Failed to create Firebase session cookie, using JWT fallback:", err);
      }
    }
  }

  if (!sessionToken) {
    sessionToken = await encrypt({ userId, role });
  }

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
  const cookieStore = await cookies();
  return decrypt(cookieStore.get(COOKIE_NAME)?.value);
}

export async function deleteSession(): Promise<void> {
  try {
    const cookieStore = await cookies();
    cookieStore.delete(COOKIE_NAME);
  } catch {
    // Cookie deletion is only supported in Server Actions / Route Handlers
  }
}

export { COOKIE_NAME };

