import "server-only";
import { promises as fs } from "fs";
import path from "path";
import { getDb, hasFirestoreCredentials } from "./firestore";

import defaultCourses from "../../data/courses.json";
import defaultUsers from "../../data/users.json";
import defaultLessons from "../../data/lessons.json";
import defaultEnrollments from "../../data/enrollments.json";
import defaultReviews from "../../data/reviews.json";
import defaultCertificates from "../../data/certificates.json";
import defaultQuestions from "../../data/questions.json";
import defaultQuizAttempts from "../../data/quiz-attempts.json";
import defaultSubscriptions from "../../data/subscriptions.json";
import defaultPayments from "../../data/payments.json";

const STATIC_COLLECTIONS: Record<string, unknown[]> = {
  "users.json": defaultUsers,
  "courses.json": defaultCourses,
  "lessons.json": defaultLessons,
  "enrollments.json": defaultEnrollments,
  "payments.json": defaultPayments,
  "reviews.json": defaultReviews,
  "certificates.json": defaultCertificates,
  "questions.json": defaultQuestions,
  "quiz-attempts.json": defaultQuizAttempts,
  "subscriptions.json": defaultSubscriptions,
};

const inMemoryStore = new Map<string, unknown[]>();

function getStaticFallback<T>(file: string): T[] {
  if (!inMemoryStore.has(file)) {
    const initial = STATIC_COLLECTIONS[file] || [];
    inMemoryStore.set(file, JSON.parse(JSON.stringify(initial)));
  }
  return inMemoryStore.get(file) as T[];
}

const DATA_DIR = path.join(process.cwd(), "data");

const COLLECTIONS: Record<string, { name: string; idField: string }> = {
  "users.json": { name: "users", idField: "id" },
  "courses.json": { name: "courses", idField: "id" },
  "lessons.json": { name: "lessons", idField: "id" },
  "enrollments.json": { name: "enrollments", idField: "id" },
  "payments.json": { name: "payments", idField: "id" },
  "reviews.json": { name: "reviews", idField: "id" },
  "certificates.json": { name: "certificates", idField: "id" },
  "questions.json": { name: "assessmentQuestions", idField: "id" },
  "quiz-attempts.json": { name: "quizAttempts", idField: "id" },
  "subscriptions.json": { name: "subscriptions", idField: "id" },
};

function collectionFor(file: string) {
  const entry = COLLECTIONS[file];
  if (!entry) throw new Error(`Unknown collection "${file}".`);
  return entry;
}

function docIdOf(record: unknown, idField: string, file: string): string {
  const id = (record as Record<string, unknown>)?.[idField];
  if (typeof id !== "string" || !id) {
    throw new Error(`Record in "${file}" is missing a "${idField}" to key on.`);
  }
  return id;
}

const queues = new Map<string, Promise<unknown>>();

function enqueue<T>(file: string, task: () => Promise<T>): Promise<T> {
  const previous = queues.get(file) ?? Promise.resolve();
  const next = previous.then(task, task);
  queues.set(
    file,
    next.catch(() => undefined)
  );
  return next;
}

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: NodeJS.Timeout;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`Operation timed out after ${ms}ms`)), ms);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timer));
}

async function ensureFile(fullPath: string): Promise<void> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    try {
      await fs.access(fullPath);
    } catch {
      await fs.writeFile(fullPath, "[]", "utf8");
    }
  } catch (err) {
    // In serverless / read-only production environments (e.g. Vercel),
    // filesystem writes outside /tmp fail with EROFS. We safely handle this.
    console.warn("Read-only filesystem: unable to ensure local file exists:", err);
  }
}

async function readFileRaw<T>(file: string): Promise<T[]> {
  const fullPath = path.join(DATA_DIR, file);
  try {
    const raw = await fs.readFile(fullPath, "utf8");
    const parsed = raw.trim() ? (JSON.parse(raw) as T[]) : [];
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch {
    // If reading failed (e.g. file doesn't exist yet or on read-only serverless):
    try {
      await ensureFile(fullPath);
      const raw = await fs.readFile(fullPath, "utf8");
      const parsed = raw.trim() ? (JSON.parse(raw) as T[]) : [];
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    } catch {
      // ignore
    }
  }
  return getStaticFallback<T>(file);
}

async function writeFileRaw<T>(file: string, data: T[]): Promise<void> {
  if (process.env.NODE_ENV === "production" && !hasFirestoreCredentials()) {
    console.warn(
      "Database storage is not configured for production. Local file persistence is read-only on Vercel. Please configure FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY in your Vercel Project Settings > Environment Variables."
    );
  }
  try {
    const fullPath = path.join(DATA_DIR, file);
    await ensureFile(fullPath);
    await fs.writeFile(fullPath, JSON.stringify(data, null, 2), "utf8");
  } catch (err) {
    console.warn(`Unable to persist to local file ${file} (expected on read-only serverless):`, err);
  }
}

async function readAllFirestore<T>(file: string): Promise<T[]> {
  try {
    const { name } = collectionFor(file);
    const db = getDb();
    if (!db) {
      return await readFileRaw<T>(file);
    }
    const snapshot = await withTimeout(db.collection(name).get(), 3500);
    if (!snapshot || snapshot.empty) {
      const local = await readFileRaw<T>(file);
      return local.length > 0 ? local : [];
    }
    return snapshot.docs.map((doc) => {
      const data = doc.data() as Record<string, unknown>;
      return { id: doc.id, ...data } as T;
    });
  } catch (error) {
    console.warn(`Firestore read collection for ${file} failed or timed out, falling back:`, error);
    return await readFileRaw<T>(file);
  }
}

export function readCollection<T>(file: string): Promise<T[]> {
  return enqueue(file, async () => {
    try {
      if (hasFirestoreCredentials()) {
        return await readAllFirestore<T>(file);
      }
      return await readFileRaw<T>(file);
    } catch (error) {
      console.warn(`readCollection error for ${file}, falling back to static snapshot:`, error);
      return getStaticFallback<T>(file);
    }
  });
}

// Read-modify-write as a single queued step.
export function withCollection<T>(
  file: string,
  mutate: (data: T[]) => T[] | Promise<T[]>
): Promise<T[]> {
  return enqueue(file, async () => {
    try {
      if (hasFirestoreCredentials()) {
        const { name, idField } = collectionFor(file);
        const current = await readAllFirestore<T>(file);
        const updated = await mutate(current);

        const db = getDb();
        if (db) {
          try {
            const collection = db.collection(name);
            const batch = db.batch();

            const before = new Map(current.map((r) => [docIdOf(r, idField, file), r]));
            const after = new Map(updated.map((r) => [docIdOf(r, idField, file), r]));

            for (const [id, record] of after) {
              const previous = before.get(id);
              if (!previous || JSON.stringify(previous) !== JSON.stringify(record)) {
                batch.set(collection.doc(id), record as Record<string, unknown>);
              }
            }
            for (const id of before.keys()) {
              if (!after.has(id)) batch.delete(collection.doc(id));
            }

            await withTimeout(batch.commit(), 5000);
          } catch (writeErr) {
            console.warn(`Firestore write batch failed for ${file}:`, writeErr);
          }
        }
        inMemoryStore.set(file, updated);
        return updated;
      }

      const current = await readFileRaw<T>(file);
      const updated = await mutate(current);
      inMemoryStore.set(file, updated);
      await writeFileRaw(file, updated);
      return updated;
    } catch (err) {
      console.error(`withCollection error for ${file}:`, err);
      return getStaticFallback<T>(file);
    }
  });
}
