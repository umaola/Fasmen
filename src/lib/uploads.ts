import "server-only";
import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5MB, matches the reference upload UI's stated limit
const ALLOWED_MIME_TO_EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
};

export class UploadError extends Error {}

// Saves an uploaded image to disk under public/uploads/<subdir>/ and returns
// the public URL path to store on the record. There's no cloud storage in
// this phase, but writing to local disk (like the JSON "database" files)
// gives a genuinely working upload instead of a stand-in URL field.
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

  const filename = `${randomUUID()}.${ext}`;
  const dir = path.join(process.cwd(), "public", "uploads", subdir);
  await mkdir(dir, { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(dir, filename), buffer);

  return `/uploads/${subdir}/${filename}`;
}
