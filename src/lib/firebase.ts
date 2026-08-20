import { initializeApp, getApps, getApp, type FirebaseOptions } from "firebase/app";
import { getAnalytics, isSupported, type Analytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider, signInWithPopup, type Auth } from "firebase/auth";

// Safe to run on both client and server — this only sets up the app handle,
// no Auth/Firestore/Storage usage yet. The getApps() guard avoids a
// "Firebase app already initialized" crash from Next.js dev hot-reload.
const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

function getFirebaseApp() {
  if (getApps().length) return getApp();
  if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY) return null;
  try {
    return initializeApp(firebaseConfig);
  } catch (err) {
    console.error("Failed to initialize Firebase client app:", err);
    return null;
  }
}

export const firebaseApp = typeof window !== "undefined" ? getFirebaseApp() : null;

export function getFirebaseAuth(): Auth | null {
  if (typeof window === "undefined") return null;
  const app = getFirebaseApp();
  if (!app) return null;
  try {
    return getAuth(app);
  } catch (err) {
    console.error("Failed to get Firebase client auth:", err);
    return null;
  }
}

export async function signInWithGooglePopup(): Promise<{ idToken: string } | null> {
  const auth = getFirebaseAuth();
  if (!auth) throw new Error("Firebase Auth is not available.");

  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });

  const result = await signInWithPopup(auth, provider);
  const idToken = await result.user.getIdToken();
  return { idToken };
}

// Analytics only works in a browser (uses IndexedDB/gtag) and isn't
// supported in every browser, so this is async and cached rather than a
// plain export — callers must handle a null result.
let analyticsPromise: Promise<Analytics | null> | null = null;

export function getFirebaseAnalytics(): Promise<Analytics | null> {
  if (typeof window === "undefined") return Promise.resolve(null);
  const app = getFirebaseApp();
  if (!app) return Promise.resolve(null);
  if (!analyticsPromise) {
    analyticsPromise = isSupported()
      .then((supported) => (supported ? getAnalytics(app) : null))
      .catch(() => null);
  }
  return analyticsPromise;
}

