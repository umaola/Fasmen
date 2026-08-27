import type { App } from 'firebase-admin/app';
import type { Firestore } from 'firebase-admin/firestore';
import type { Auth } from 'firebase-admin/auth';
import type { Storage } from 'firebase-admin/storage';

export function hasFirestoreCredentials(): boolean {
  // Check JSON service account string first
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY || process.env.FIREBASE_SERVICE_ACCOUNT;
  if (serviceAccountJson && serviceAccountJson.trim()) {
    return true;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
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

    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY || process.env.FIREBASE_SERVICE_ACCOUNT;
    if (serviceAccountJson && serviceAccountJson.trim()) {
      try {
        let raw = serviceAccountJson.trim();
        // Check if base64 encoded
        if (raw.startsWith('ey')) {
          raw = Buffer.from(raw, 'base64').toString('utf8');
        }
        const parsed = JSON.parse(raw);
        cachedApp = initializeApp({
          credential: cert(parsed),
          storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || parsed.project_id + '.appspot.com',
        });
        return cachedApp;
      } catch (jsonErr) {
        console.warn('Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY JSON:', jsonErr);
      }
    }

    const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '';
    const clientEmail = (process.env.FIREBASE_CLIENT_EMAIL || '').trim();
    let privateKey = (process.env.FIREBASE_PRIVATE_KEY || '').trim();

    if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
      privateKey = privateKey.slice(1, -1);
    }
    if (privateKey.startsWith("'") && privateKey.endsWith("'")) {
      privateKey = privateKey.slice(1, -1);
    }
    privateKey = privateKey.replace(/\\n/g, '\n').replace(/\\r/g, '');

    const credential = cert({
      projectId,
      clientEmail,
      privateKey,
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
