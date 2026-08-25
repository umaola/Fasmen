import type { App } from 'firebase-admin/app';
import type { Firestore } from 'firebase-admin/firestore';
import type { Auth } from 'firebase-admin/auth';
import type { Storage } from 'firebase-admin/storage';

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

let cachedApp: App | null = null;
let cachedDb: Firestore | null = null;
let cachedAuth: Auth | null = null;
let cachedStorage: Storage | null = null;

export async function ensureAdminApp(): Promise<App | null> {
  if (cachedApp) return cachedApp;
  if (!hasFirestoreCredentials()) return null;

  try {
    const { initializeApp, getApps, getApp, cert } = await import('firebase-admin/app');
    const existingApps = getApps();
    if (existingApps.length > 0) {
      cachedApp = getApp();
      return cachedApp;
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

    cachedApp = initializeApp({
      credential,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });
    return cachedApp;
  } catch (err) {
    console.warn('Firebase Admin app initialization failed, falling back to local storage:', err);
    return null;
  }
}

export async function getDb(): Promise<Firestore | null> {
  if (cachedDb) return cachedDb;
  try {
    const app = await ensureAdminApp();
    if (!app) return null;
    const { getFirestore } = await import('firebase-admin/firestore');
    cachedDb = getFirestore(app);
    return cachedDb;
  } catch (err) {
    console.warn('Failed to get Firestore instance:', err);
    return null;
  }
}

export async function getAdminAuth(): Promise<Auth | null> {
  if (cachedAuth) return cachedAuth;
  try {
    const app = await ensureAdminApp();
    if (!app) return null;
    const { getAuth } = await import('firebase-admin/auth');
    cachedAuth = getAuth(app);
    return cachedAuth;
  } catch (err) {
    console.warn('Failed to get Firebase Admin Auth instance:', err);
    return null;
  }
}

export async function getAdminStorage(): Promise<Storage | null> {
  if (cachedStorage) return cachedStorage;
  try {
    const app = await ensureAdminApp();
    if (!app) return null;
    const { getStorage } = await import('firebase-admin/storage');
    cachedStorage = getStorage(app);
    return cachedStorage;
  } catch (err) {
    console.warn('Failed to get Firebase Admin Storage instance:', err);
    return null;
  }
}
