import "server-only";
import { promises as fs } from "fs";
import path from "path";
import { getDb, hasFirestoreCredentials } from "./firestore";

const DATA_DIR = path.join(process.cwd(), "data");

// Backed by Firestore when credentials are configured in .env.local, with
// an automatic fallback to local data/*.json files for offline / local dev.
// The module keeps its original name and API — callers still pass "users.json"
// and get an array back — so data modules on top of it require no changes.
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

// Serializes reads/writes per collection so two mutations in the same server
// instance can't interleave a read-modify-write.
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
    return raw.trim() ? (JSON.parse(raw) as T[]) : [];
  } catch {
    try {
      await ensureFile(fullPath);
      const raw = await fs.readFile(fullPath, "utf8");
      return raw.trim() ? (JSON.parse(raw) as T[]) : [];
    } catch {
      return [];
    }
  }
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
      console.warn(`Firestore DB instance not available for ${file}, falling back to local file`);
      return await readFileRaw<T>(file);
    }
    const snapshot = await db.collection(name).get();
    return snapshot.docs.map((doc) => {
      const data = doc.data() as Record<string, unknown>;
      return { id: doc.id, ...data } as T;
    });
  } catch (error) {
    console.error(`Failed to read collection from Firestore (${file}), falling back to local file:`, error);
    try {
      return await readFileRaw<T>(file);
    } catch {
      return [];
    }
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
      console.error(`readCollection error for ${file}:`, error);
      return [];
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
        if (!db) {
          throw new Error(`Firestore DB instance not available for ${file}`);
        }
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

        await batch.commit();
        return updated;
      }

      const current = await readFileRaw<T>(file);
      const updated = await mutate(current);
      await writeFileRaw(file, updated);
      return updated;
    } catch (err) {
      console.error(`withCollection error for ${file}:`, err);
      return [];
    }
  });
}
