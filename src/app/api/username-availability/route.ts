import { NextResponse } from "next/server";
import { requireRole } from "@/lib/authz";
import { findUserByUsername } from "@/lib/users";

const USERNAME_PATTERN = /^[a-z0-9-]{3,30}$/i;
const MAX_USERNAME_LENGTH = 30;

// Tries numbered variants of the taken name (ada-2, ada-3, ...) and falls
// back to a random 3-digit suffix, returning the first one nobody holds.
async function suggestAvailable(base: string, currentUserId: string): Promise<string | null> {
  const candidates: string[] = [];
  for (let i = 2; i <= 5; i++) candidates.push(`${base}-${i}`);
  for (let i = 0; i < 3; i++) {
    candidates.push(`${base}-${Math.floor(100 + Math.random() * 900)}`);
  }

  for (const raw of candidates) {
    const candidate = raw.slice(0, MAX_USERNAME_LENGTH);
    const holder = await findUserByUsername(candidate);
    if (!holder || holder.id === currentUserId) return candidate;
  }
  return null;
}

export async function GET(request: Request) {
  try {
    const user = await requireRole("tutor");
    if (!user) {
      return NextResponse.json({ message: "Not authorized." }, { status: 403 });
    }

    const username = new URL(request.url).searchParams.get("username")?.trim() ?? "";
    if (!USERNAME_PATTERN.test(username)) {
      return NextResponse.json({ available: false, invalid: true });
    }

    const holder = await findUserByUsername(username);
    // The tutor's own current username counts as available to them.
    if (!holder || holder.id === user.id) {
      return NextResponse.json({ available: true });
    }

    const suggestion = await suggestAvailable(username, user.id);
    return NextResponse.json({ available: false, suggestion });
  } catch (error) {
    console.error("username-availability GET error:", error);
    return NextResponse.json({ message: "Unable to check username availability" }, { status: 500 });
  }
}
