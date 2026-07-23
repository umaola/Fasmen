import "server-only";
import bcrypt from "bcryptjs";
import { readCollection, withCollection } from "./json-store";

const CREDENTIALS_FILE = "credentials.json";
const SALT_ROUNDS = 10;

// Deliberately kept out of the user profile store: this is the one piece of
// this whole auth setup that gets deleted, not migrated, once Firebase Auth
// takes over password storage.
interface Credential {
  userId: string;
  email: string;
  passwordHash: string;
}

export async function credentialsExistForEmail(email: string): Promise<boolean> {
  const all = await readCollection<Credential>(CREDENTIALS_FILE);
  const normalized = email.trim().toLowerCase();
  return all.some((c) => c.email.toLowerCase() === normalized);
}

export async function createCredential(userId: string, email: string, password: string): Promise<void> {
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  await withCollection<Credential>(CREDENTIALS_FILE, (all) => [
    ...all,
    { userId, email: email.trim().toLowerCase(), passwordHash },
  ]);
}

export async function verifyCredential(email: string, password: string): Promise<string | null> {
  const all = await readCollection<Credential>(CREDENTIALS_FILE);
  const normalized = email.trim().toLowerCase();
  const match = all.find((c) => c.email.toLowerCase() === normalized);
  if (!match) return null;

  const valid = await bcrypt.compare(password, match.passwordHash);
  return valid ? match.userId : null;
}
