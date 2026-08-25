import "server-only";
import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { getAdminStorage, hasFirestoreCredentials } from "./firestore";

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5MB, matches the reference upload UI's stated limit
const ALLOWED_MIME_TO_EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
};

export class UploadError extends Error {}

// Saves an uploaded image to Firebase Storage (or fallback to local/data-url).
// Returns the permanent public CDN URL to store on the user or course record.
export async function saveUploadedImage(file: File, subdir: string): Promise<string> {
  if (file.size === 0) {
    throw new UploadError("Choose an image file.");
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new UploadError("Image must be smaller than 5MB.");
  }
  const ext = ALLOWED_MIME_TO_EXT[file.type];
  if (!ext) {
    throw new UploadError("Only PNG, JPEG, WEBP, or GIF images are accepted.");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const filename = `${randomUUID()}.${ext}`;

  // If Firebase credentials are configured, upload to Firebase Storage bucket
  if (hasFirestoreCredentials()) {
    try {
      const storage = await getAdminStorage();
      if (storage) {
        const bucket = storage.bucket();
        const destination = `${subdir}/${filename}`;
        const storageFile = bucket.file(destination);
        const downloadToken = randomUUID();

        await storageFile.save(buffer, {
          metadata: {
            contentType: file.type,
            metadata: {
              firebaseStorageDownloadTokens: downloadToken,
            },
          },
        });

        const bucketName = bucket.name || process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
        return `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodeURIComponent(destination)}?alt=media&token=${downloadToken}`;
      }
    } catch (err) {
      console.error("Firebase Storage upload failed, falling back:", err);
    }
  }

  // In production / Vercel serverless functions, the local filesystem is read-only.
  // Converting to a base64 data URL ensures uploads work seamlessly in offline or fallback environments.
  if (process.env.NODE_ENV === "production" || process.env.VERCEL) {
    return `data:${file.type};base64,${buffer.toString("base64")}`;
  }

  try {
    const dir = path.join(process.cwd(), "public", "uploads", subdir);
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, filename), buffer);
    return `/uploads/${subdir}/${filename}`;
  } catch {
    // Fallback to data URL if writing to local disk fails (e.g. read-only filesystem)
    return `data:${file.type};base64,${buffer.toString("base64")}`;
  }
}
