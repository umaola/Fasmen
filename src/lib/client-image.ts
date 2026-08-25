/**
 * Client-side image compressor and validator.
 * Automatically resizes and compresses high-resolution photos (e.g. 5MB–15MB phone photos)
 * down to ~200KB-400KB WebP/JPEG in milliseconds before sending to the server.
 */

export interface OptimizeImageOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  mimeType?: "image/webp" | "image/jpeg";
}

export async function optimizeImageFile(
  file: File,
  options: OptimizeImageOptions = {}
): Promise<{ file: File; previewUrl: string }> {
  const {
    maxWidth = 1600,
    maxHeight = 1200,
    quality = 0.85,
    mimeType = "image/webp",
  } = options;

  // Basic format check
  const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/heic", "image/heif"];
  if (file.type && !validTypes.includes(file.type.toLowerCase()) && !file.name.match(/\.(jpg|jpeg|png|webp|gif|heic|heif)$/i)) {
    throw new Error("Please select a valid image file (PNG, JPEG, WEBP, or GIF).");
  }

  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let { width, height } = img;

      // Calculate scaled dimensions while preserving aspect ratio
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        // If canvas context fails, fallback to original file
        resolve({ file, previewUrl: URL.createObjectURL(file) });
        return;
      }

      // Smooth resizing
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, 0, 0, width, height);

      // Export compressed blob
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve({ file, previewUrl: URL.createObjectURL(file) });
            return;
          }

          const ext = mimeType === "image/webp" ? "webp" : "jpg";
          const newName = file.name.replace(/\.[^/.]+$/, "") + `.${ext}`;
          const compressedFile = new File([blob], newName, { type: mimeType });
          const previewUrl = URL.createObjectURL(blob);

          resolve({ file: compressedFile, previewUrl });
        },
        mimeType,
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Unable to read image file. Please try a different image."));
    };

    img.src = objectUrl;
  });
}
