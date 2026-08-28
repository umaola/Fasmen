import "server-only";
import { randomUUID } from "crypto";
import { readCollection, withCollection } from "./json-store";

const USERS_FILE = "users.json";

export type Role = "student" | "tutor" | "admin";

// No real ID-verification provider exists in this phase — idType/idNumber are
// captured and instantly trusted (verified: true) rather than checked against
// a government API.
export type TutorIdType = "nin" | "voters-card" | "passport" | "drivers-license";

export type PayoutProvider = "paystack" | "flutterwave";

// Mirrors tutorProfile.payoutAccount from firestore-schema.md exactly —
// the full account number is deliberately never persisted, only the last 4
// digits, since there's no real Paystack/Flutterwave integration to hand it
// off to.
export interface PayoutAccount {
  provider: PayoutProvider;
  subaccountCode: string;
  bankName: string;
  accountNumberLast4: string;
}

// Mirrors the `users/{userId}` document shape from firestore-schema.md.
// When Firebase lands, this becomes the Firestore document written on signup.
export interface UserProfile {
  id: string;
  displayName: string;
  email: string;
  phoneNumber: string | null;
  photoURL: string | null;
  role: Role;
  bio: string | null;
  createdAt: string;
  updatedAt: string;
  tutorProfile: {
    totalStudents: number;
    averageRating: number;
    verified: boolean;
    username: string | null;
    idType: TutorIdType | null;
    idNumber: string | null;
    payoutAccount: PayoutAccount | null;
  } | null;
}

import { getDb, hasFirestoreCredentials } from "./firestore";

export async function findUserByEmail(email: string): Promise<UserProfile | undefined> {
  const normalized = email.trim().toLowerCase();
  if (hasFirestoreCredentials()) {
    const db = await getDb();
    if (db) {
      try {
        const snap = await db.collection("users").where("email", "==", normalized).limit(1).get();
        if (!snap.empty) {
          const doc = snap.docs[0];
          const data = doc.data() as Omit<UserProfile, "id">;
          const role: Role = isSystemAdminEmail(normalized) ? "admin" : data.role;
          return { id: doc.id, ...data, role };
        }
      } catch (err) {
        console.warn("Firestore findUserByEmail query failed, falling back:", err);
      }
    }
  }
  const users = await readCollection<UserProfile>(USERS_FILE);
  const found = users.find((u) => u.email.toLowerCase() === normalized);
  if (found) {
    const role: Role = isSystemAdminEmail(found.email) ? "admin" : found.role;
    return { ...found, role };
  }
  return undefined;
}

export async function findUserById(id: string): Promise<UserProfile | undefined> {
  if (hasFirestoreCredentials()) {
    const db = await getDb();
    if (db) {
      try {
        const doc = await db.collection("users").doc(id).get();
        if (doc.exists) {
          const data = doc.data() as Omit<UserProfile, "id">;
          const role: Role = isSystemAdminEmail(data.email) ? "admin" : data.role;
          return { id: doc.id, ...data, role };
        }
      } catch (err) {
        console.warn("Firestore findUserById query failed, falling back:", err);
      }
    }
  }
  const users = await readCollection<UserProfile>(USERS_FILE);
  const found = users.find((u) => u.id === id);
  if (found) {
    const role: Role = isSystemAdminEmail(found.email) ? "admin" : found.role;
    return { ...found, role };
  }
  return undefined;
}

export async function updateUserProfile(
  userId: string,
  patch: { displayName: string; bio: string | null }
): Promise<UserProfile | null> {
  let updated: UserProfile | null = null;
  if (hasFirestoreCredentials()) {
    const db = await getDb();
    if (db) {
      try {
        const now = new Date().toISOString();
        await db.collection("users").doc(userId).update({
          ...patch,
          updatedAt: now,
        });
      } catch (err) {
        console.warn("Firestore updateUserProfile update failed:", err);
      }
    }
  }
  await withCollection<UserProfile>(USERS_FILE, (users) =>
    users.map((u) => {
      if (u.id !== userId) return u;
      updated = { ...u, ...patch, updatedAt: new Date().toISOString() };
      return updated;
    })
  );
  return updated;
}

export async function updateUserPhoto(userId: string, photoURL: string): Promise<UserProfile | null> {
  let updated: UserProfile | null = null;
  if (hasFirestoreCredentials()) {
    const db = await getDb();
    if (db) {
      try {
        const now = new Date().toISOString();
        await db.collection("users").doc(userId).update({
          photoURL,
          updatedAt: now,
        });
      } catch (err) {
        console.warn("Firestore updateUserPhoto update failed:", err);
      }
    }
  }
  await withCollection<UserProfile>(USERS_FILE, (users) =>
    users.map((u) => {
      if (u.id !== userId) return u;
      updated = { ...u, photoURL, updatedAt: new Date().toISOString() };
      return updated;
    })
  );
  return updated;
}

export async function incrementTutorTotalStudents(tutorId: string): Promise<void> {
  await withCollection<UserProfile>(USERS_FILE, (users) =>
    users.map((u) => {
      if (u.id !== tutorId || !u.tutorProfile) return u;
      return {
        ...u,
        tutorProfile: { ...u.tutorProfile, totalStudents: u.tutorProfile.totalStudents + 1 },
        updatedAt: new Date().toISOString(),
      };
    })
  );
}

export async function updateTutorAverageRating(tutorId: string, averageRating: number): Promise<void> {
  await withCollection<UserProfile>(USERS_FILE, (users) =>
    users.map((u) => {
      if (u.id !== tutorId || !u.tutorProfile) return u;
      return { ...u, tutorProfile: { ...u.tutorProfile, averageRating } };
    })
  );
}

export const DEFAULT_ADMIN_EMAILS = [
  "admin@fasmen.com",
  "stanley@fasmen.com",
  "stanley.anyaehie@fasmen.com",
  "admin@fasmen.org",
  "admin@fasmen.ng",
  "admin@test.local",
  "umaolamma@gmail.com",
  "umaolamma@mail.com",
  "umaolla@gmail.com",
  "umaolla@mail.com",
  "umaola@gmail.com",
];

export function isSystemAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  const configured = process.env.ADMIN_EMAIL
    ? process.env.ADMIN_EMAIL.toLowerCase()
        .split(",")
        .map((e) => e.trim())
    : [];
  return DEFAULT_ADMIN_EMAILS.includes(normalized) || configured.includes(normalized);
}

export async function createUserProfile(input: {
  id?: string;
  displayName: string;
  email: string;
  role: Role;
  photoURL?: string | null;
}): Promise<UserProfile> {
  const now = new Date().toISOString();
  const id = input.id || randomUUID();
  const email = input.email.trim().toLowerCase();
  const role: Role = isSystemAdminEmail(email) ? "admin" : input.role;

  const profile: UserProfile = {
    id,
    displayName: input.displayName,
    email,
    phoneNumber: null,
    photoURL: input.photoURL || null,
    role,
    bio: null,
    createdAt: now,
    updatedAt: now,
    tutorProfile:
      role === "tutor"
        ? {
            totalStudents: 0,
            averageRating: 0,
            verified: false,
            username: null,
            idType: null,
            idNumber: null,
            payoutAccount: null,
          }
        : null,
  };

  if (hasFirestoreCredentials()) {
    const db = await getDb();
    if (db) {
      try {
        await db.collection("users").doc(id).set(profile);
      } catch (err) {
        console.warn("Firestore direct set in createUserProfile failed:", err);
      }
    }
  }

  await withCollection<UserProfile>(USERS_FILE, (users) => {
    const filtered = users.filter((u) => u.id !== id);
    return [...filtered, profile];
  });
  return profile;
}

export async function findUserByUsername(username: string): Promise<UserProfile | undefined> {
  const users = await readCollection<UserProfile>(USERS_FILE);
  const normalized = username.trim().toLowerCase();
  return users.find((u) => u.tutorProfile?.username?.toLowerCase() === normalized);
}

export async function connectPayoutAccount(
  userId: string,
  input: { provider: PayoutProvider; bankName: string; accountNumberLast4: string }
): Promise<UserProfile | null> {
  const all = await withCollection<UserProfile>(USERS_FILE, (users) =>
    users.map((u) => {
      if (u.id !== userId || !u.tutorProfile) return u;
      return {
        ...u,
        updatedAt: new Date().toISOString(),
        tutorProfile: {
          ...u.tutorProfile,
          payoutAccount: {
            provider: input.provider,
            bankName: input.bankName,
            accountNumberLast4: input.accountNumberLast4,
            // Stands in for the subaccount code a real Paystack/Flutterwave
            // "create subaccount" API call would return.
            subaccountCode: `SUB-${randomUUID()}`,
          },
        },
      };
    })
  );
  return all.find((u) => u.id === userId) ?? null;
}

export async function completeTutorVerification(
  userId: string,
  input: { username: string; idType: TutorIdType; idNumber: string; bio: string }
): Promise<UserProfile | null> {
  const all = await withCollection<UserProfile>(USERS_FILE, (users) =>
    users.map((u) => {
      if (u.id !== userId || !u.tutorProfile) return u;
      return {
        ...u,
        bio: input.bio,
        updatedAt: new Date().toISOString(),
        tutorProfile: {
          ...u.tutorProfile,
          verified: true,
          username: input.username,
          idType: input.idType,
          idNumber: input.idNumber,
        },
      };
    })
  );
  return all.find((u) => u.id === userId) ?? null;
}

export async function listAllUsers(): Promise<UserProfile[]> {
  const users = await readCollection<UserProfile>(USERS_FILE);
  return users.map((u) => {
    const role: Role = isSystemAdminEmail(u.email) ? "admin" : u.role;
    return { ...u, role };
  });
}

export async function listAllTutors(): Promise<UserProfile[]> {
  const users = await listAllUsers();
  return users.filter((u) => u.role === "tutor" || u.tutorProfile !== null);
}

export async function listAllStudents(): Promise<UserProfile[]> {
  const users = await listAllUsers();
  return users.filter((u) => u.role === "student");
}

export async function listAllAdmins(): Promise<UserProfile[]> {
  const users = await listAllUsers();
  return users.filter((u) => u.role === "admin" || isSystemAdminEmail(u.email));
}

export async function createAdminUser(input: {
  displayName: string;
  email: string;
}): Promise<UserProfile> {
  const normalizedEmail = input.email.trim().toLowerCase();
  const existing = await findUserByEmail(normalizedEmail);

  if (existing) {
    if (hasFirestoreCredentials()) {
      const db = await getDb();
      if (db) {
        try {
          await db.collection("users").doc(existing.id).update({
            role: "admin",
            displayName: input.displayName.trim() || existing.displayName,
            updatedAt: new Date().toISOString(),
          });
        } catch (err) {
          console.warn("Firestore createAdminUser update failed:", err);
        }
      }
    }

    await withCollection<UserProfile>(USERS_FILE, (users) =>
      users.map((u) =>
        u.id === existing.id
          ? {
              ...u,
              role: "admin",
              displayName: input.displayName.trim() || u.displayName,
              updatedAt: new Date().toISOString(),
            }
          : u
      )
    );

    return {
      ...existing,
      role: "admin",
      displayName: input.displayName.trim() || existing.displayName,
    };
  }

  return await createUserProfile({
    displayName: input.displayName.trim(),
    email: normalizedEmail,
    role: "admin",
  });
}

export async function removeAdminUser(userId: string): Promise<boolean> {
  const user = await findUserById(userId);
  if (!user) return false;

  // Protect Stanley Anyaehie / Primary root admin from being removed
  const normalized = user.email.toLowerCase();
  if (normalized === "admin@fasmen.com" || normalized === "stanley@fasmen.com") {
    throw new Error("The primary root administrator (Stanley Anyaehie) cannot be removed.");
  }

  if (hasFirestoreCredentials()) {
    const db = await getDb();
    if (db) {
      try {
        await db.collection("users").doc(userId).update({
          role: "student",
          updatedAt: new Date().toISOString(),
        });
      } catch (err) {
        console.warn("Firestore removeAdminUser update failed:", err);
      }
    }
  }

  await withCollection<UserProfile>(USERS_FILE, (users) =>
    users.map((u) =>
      u.id === userId
        ? {
            ...u,
            role: "student",
            updatedAt: new Date().toISOString(),
          }
        : u
    )
  );

  return true;
}

export async function setTutorVerificationStatus(
  userId: string,
  verified: boolean
): Promise<UserProfile | null> {
  let updated: UserProfile | null = null;
  if (hasFirestoreCredentials()) {
    const db = await getDb();
    if (db) {
      try {
        const now = new Date().toISOString();
        await db.collection("users").doc(userId).update({
          "tutorProfile.verified": verified,
          updatedAt: now,
        });
      } catch (err) {
        console.warn("Firestore setTutorVerificationStatus update failed:", err);
      }
    }
  }

  const all = await withCollection<UserProfile>(USERS_FILE, (users) =>
    users.map((u) => {
      if (u.id !== userId) return u;
      const tutorProfile = u.tutorProfile || {
        totalStudents: 0,
        averageRating: 0,
        verified,
        username: u.displayName.toLowerCase().replace(/[^a-z0-9]/g, "-"),
        idType: null,
        idNumber: null,
        payoutAccount: null,
      };
      updated = {
        ...u,
        updatedAt: new Date().toISOString(),
        tutorProfile: {
          ...tutorProfile,
          verified,
        },
      };
      return updated;
    })
  );
  return all.find((u) => u.id === userId) ?? updated;
}
