import { SignJWT, jwtVerify, type JWTPayload } from "jose";

export const COOKIE_NAME = "fasmen_session";
export const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export type Role = "student" | "tutor" | "admin";

export interface SessionPayload extends JWTPayload {
  userId: string;
  role: Role;
  email?: string;
}

export function getEncodedKey(): Uint8Array {
  const secretKey = process.env.SESSION_SECRET;
  if (!secretKey) {
    return new TextEncoder().encode("dev-secret-key-must-be-at-least-32-characters-long-12345");
  }
  return new TextEncoder().encode(secretKey);
}

export async function encrypt(payload: SessionPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getEncodedKey());
}

export async function decrypt(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null;

  try {
    const { payload } = await jwtVerify<SessionPayload>(token, getEncodedKey(), {
      algorithms: ["HS256"],
    });
    return payload;
  } catch {
    return null;
  }
}
