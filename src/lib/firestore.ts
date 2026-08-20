import { initializeApp, getApps, getApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getStorage } from 'firebase-admin/storage';

export function ensureAdminApp() {
  if (getApps().length === 0) {
    const privateKey = process.env.FIREBASE_PRIVATE_KEY
      ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
      : undefined;

    if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !privateKey) {
      console.error('Firebase Admin credentials missing or incomplete in environment variables.');
      return null;
    }

    try {
      initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: privateKey,
        }),
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      });
    } catch (err) {
      console.error('Failed to initialize Firebase Admin app:', err);
      return null;
    }
  }

  return getApp();
}

export function getDb() {
  const app = ensureAdminApp();
  if (!app) return null;
  try {
    return getFirestore(app);
  } catch (err) {
    console.error('Failed to get Firestore instance:', err);
    return null;
  }
}

export function getAdminAuth() {
  const app = ensureAdminApp();
  if (!app) return null;
  try {
    return getAuth(app);
  } catch (err) {
    console.error('Failed to get Firebase Admin Auth instance:', err);
    return null;
  }
}

export function getAdminStorage() {
  const app = ensureAdminApp();
  if (!app) return null;
  try {
    return getStorage(app);
  } catch (err) {
    console.error('Failed to get Firebase Admin Storage instance:', err);
    return null;
  }
}

export function hasFirestoreCredentials(): boolean {
  return !!(
    process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_CLIENT_EMAIL &&
    process.env.FIREBASE_PRIVATE_KEY
  );
}



