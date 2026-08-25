"use client";

import { useActionState, useRef, useState, useTransition } from "react";
import { ImagePlaceholderIcon } from "@/components/icons";
import type { ImageUploadState } from "@/lib/definitions";
import { FormAlert } from "@/components/FormAlert";
import { optimizeImageFile } from "@/lib/client-image";

export function ProfilePhotoUpload({
  action,
  photoURL,
  fieldName = "photo",
}: {
  action: (state: ImageUploadState, formData: FormData) => Promise<ImageUploadState>;
  photoURL: string | null;
  fieldName?: string;
}) {
  const [state, formAction, pending] = useActionState<ImageUploadState, FormData>(
    action,
    undefined
  );
  const [isCompressing, startTransition] = useTransition();
  const [preview, setPreview] = useState<string | null>(null);
  const [clientError, setClientError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const displayImage = preview || photoURL;
  const isBusy = pending || isCompressing;

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setClientError(null);

    if (file.size > 20 * 1024 * 1024) {
      setClientError("File is too large (maximum 20MB). Please select a smaller photo.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    try {
      const { file: optimizedFile, previewUrl } = await optimizeImageFile(file, {
        maxWidth: 512,
        maxHeight: 512,
        quality: 0.85,
        mimeType: "image/webp",
      });

      setPreview(previewUrl);

      const formData = new FormData();
      formData.append(fieldName, optimizedFile);

      startTransition(async () => {
        await formAction(formData);
      });
    } catch (err) {
      console.error("Profile photo processing error:", err);
      setClientError(err instanceof Error ? err.message : "Failed to process image.");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  const activeError = clientError || state?.message;

  return (
    <div className="flex flex-col items-center gap-3 rounded-lg bg-white p-6 text-center shadow-[0_1px_3px_rgba(18,22,28,0.08)]">
      <p className="text-sm font-medium text-neutral-900">Profile image</p>
      <div className="relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-neutral-100 border border-neutral-200">
        {displayImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={displayImage} alt="Profile" className="h-full w-full object-cover" />
        ) : (
          <ImagePlaceholderIcon className="h-8 w-8 text-neutral-400" />
        )}
        {isBusy && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white text-xs font-semibold backdrop-blur-xs">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          </div>
        )}
      </div>
      <label className="cursor-pointer rounded-md border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100 disabled:opacity-60">
        {isBusy ? (isCompressing ? "Preparing..." : "Uploading...") : "Select profile image"}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif,image/heic,image/heif"
          className="hidden"
          disabled={isBusy}
          onChange={handleFileSelect}
        />
      </label>
      <p className="max-w-xs text-xs text-neutral-400">
        Auto-optimized on upload. PNG, JPEG, WEBP, or GIF supported.
      </p>
      {state?.success && !isBusy && (
        <p className="text-xs font-semibold text-success-600">✓ Photo updated</p>
      )}
      {activeError && <FormAlert message={activeError} />}
    </div>
  );
}

