// One-time migration: uploads data/*.json into Firestore so the existing
// courses, lessons, users and test logins survive the move off local files.
//
//   node scripts/seed-firestore.mjs
//
// Safe to re-run: documents are keyed by their own id, so a second run
// overwrites rather than duplicating. It does not delete anything already in
// Firestore that's absent from the JSON.
import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), "..");

// Mirrors COLLECTIONS in src/lib/json-store.ts — keep the two in step.
const COLLECTIONS = {
  "users.json": { name: "users", idField: "id" },
  "credentials.json": { name: "credentials", idField: "userId" },
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

function loadEnvLocal() {
  const path = join(projectRoot, ".env.local");
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const match = line.match(/^([A-Z0-9_]+)=([\s\S]*)$/);
    if (match && !process.env[match[1]]) process.env[match[1]] = match[2].trim();
  }
}

loadEnvLocal();

const { FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY } = process.env;
if (!FIREBASE_PROJECT_ID || !FIREBASE_CLIENT_EMAIL || !FIREBASE_PRIVATE_KEY) {
  console.error(
    "Missing FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY in .env.local."
  );
  process.exit(1);
}

const app = initializeApp({
  credential: cert({
    projectId: FIREBASE_PROJECT_ID,
    clientEmail: FIREBASE_CLIENT_EMAIL,
    privateKey: FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  }),
});
const db = getFirestore(app);
db.settings({ ignoreUndefinedProperties: true });

let total = 0;

for (const [file, { name, idField }] of Object.entries(COLLECTIONS)) {
  const path = join(projectRoot, "data", file);
  if (!existsSync(path)) {
    console.log(`${name.padEnd(20)} skipped (no ${file})`);
    continue;
  }

  const records = JSON.parse(readFileSync(path, "utf8"));
  if (!Array.isArray(records) || records.length === 0) {
    console.log(`${name.padEnd(20)} 0 documents`);
    continue;
  }

  const batch = db.batch();
  for (const record of records) {
    const id = record[idField];
    if (typeof id !== "string" || !id) {
      throw new Error(`A record in ${file} has no "${idField}" to key on.`);
    }
    batch.set(db.collection(name).doc(id), record);
  }
  await batch.commit();

  total += records.length;
  console.log(`${name.padEnd(20)} ${records.length} documents`);
}

console.log(`\nDone — ${total} documents written to project ${FIREBASE_PROJECT_ID}.`);
process.exit(0);
