import "server-only";
import { getApps, initializeApp, cert, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

// The Admin SDK, not the client SDK in src/lib/firebase.ts. All data access
// happens server-side, and the client SDK would need security rules open to
// unauthenticated writes to work here — the Admin SDK authenticates as a
// service account instead and bypasses rules entirely.
//
// Initialization is lazy so a missing env var surfaces as a request-time
// error rather than breaking `next build`.
let cached: Firestore | null = null;

export function hasFirestoreCredentials(): boolean {
  return Boolean(
    process.env.FIREBASE_PROJECT_ID &&
      process.env.FIREBASE_CLIENT_EMAIL &&
      process.env.FIREBASE_PRIVATE_KEY
  );
}

function credentials() {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY are required — " +
        "see .env.local.example (Firebase console > Project settings > Service accounts)."
    );
  }

  return {
    projectId,
    clientEmail,
    // Env vars can't hold real newlines, so the key is stored with escaped
    // \n sequences and restored here.
    privateKey: privateKey.replace(/\\n/g, "\n"),
  };
}

export function getDb(): Firestore {
  if (cached) return cached;

  // getApps() guards against re-initializing across dev hot reloads.
  const existing = getApps();
  const app: App = existing.length
    ? existing[0]
    : initializeApp({ credential: cert(credentials()) });

  const db = getFirestore(app);
  // Records carry optional fields that are simply absent rather than null
  // (an older lesson with no video, say); without this Firestore rejects
  // the whole write.
  db.settings({ ignoreUndefinedProperties: true });

  cached = db;
  return db;
}
