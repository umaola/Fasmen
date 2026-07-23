import "server-only";
import { getCurrentUser } from "./dal";
import type { Role, UserProfile } from "./users";

export async function requireRole(...roles: Role[]): Promise<UserProfile | null> {
  const user = await getCurrentUser();
  if (!user || !roles.includes(user.role)) return null;
  return user;
}
