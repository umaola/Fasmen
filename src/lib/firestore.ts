import { initializeApp, getApps, getApp, cert } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { getStorage, type Storage } from 'firebase-admin/storage';

export function hasFirestoreCredentials(): boolean {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  return !!(
    projectId &&
    projectId.trim() &&
    clientEmail &&
    clientEmail.trim() &&
    privateKey &&
    privateKey.includes('PRIVATE KEY')
  );
}

export function ensureAdminApp() {
  try {
    const existingApps = getApps();
    if (existingApps.length > 0) {
      return getApp();
    }

    if (!hasFirestoreCredentials()) {
      return null;
    }

    let privateKey = process.env.FIREBASE_PRIVATE_KEY || '';
    privateKey = privateKey
      .trim()
      .replace(/^["']|["']$/g, '')
      .replace(/\\n/g, '\n');

    const credential = cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: privateKey,
    });

    return initializeApp({
      credential,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });
  } catch (err) {
    console.warn('Firebase Admin app initialization failed, falling back to local storage:', err);
    return null;
  }
}

export function getDb(): Firestore | null {
  try {
    const app = ensureAdminApp();
    if (!app) return null;
    return getFirestore(app);
  } catch (err) {
    console.warn('Failed to get Firestore instance:', err);
    return null;
  }
}

export function getAdminAuth(): Auth | null {
  try {
    const app = ensureAdminApp();
    if (!app) return null;
    return getAuth(app);
  } catch (err) {
    console.warn('Failed to get Firebase Admin Auth instance:', err);
    return null;
  }
}

export function getAdminStorage(): Storage | null {
  try {
    const app = ensureAdminApp();
    if (!app) return null;
    return getStorage(app);
  } catch (err) {
    console.warn('Failed to get Firebase Admin Storage instance:', err);
    return null;
  }
}
