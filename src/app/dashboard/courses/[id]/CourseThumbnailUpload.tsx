"use client";

import { useActionState, useRef, useState, useTransition } from "react";
import { uploadCourseThumbnailAction } from "@/app/actions/courses";
import { ImagePlaceholderIcon } from "@/components/icons";
import type { ImageUploadState } from "@/lib/definitions";
import { FormAlert } from "@/components/FormAlert";
import { optimizeImageFile } from "@/lib/client-image";

export function CourseThumbnailUpload({
  courseId,
  thumbnailUrl,
}: {
  courseId: string;
  thumbnailUrl: string | null;
}) {
  const boundAction = uploadCourseThumbnailAction.bind(null, courseId);
  const [state, action, pending] = useActionState<ImageUploadState, FormData>(
    boundAction,
    undefined
  );
  const [isCompressing, startTransition] = useTransition();
  const [preview, setPreview] = useState<string | null>(null);
  const [clientError, setClientError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const displayImage = preview || thumbnailUrl;
  const isBusy = pending || isCompressing;

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setClientError(null);

    // Validate size before anything
    if (file.size > 20 * 1024 * 1024) {
      setClientError("File is too large (maximum 20MB). Please select a smaller image.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    try {
      // 1. Instant client-side compression and WebP conversion
      const { file: optimizedFile, previewUrl } = await optimizeImageFile(file, {
        maxWidth: 1280,
        maxHeight: 720,
        quality: 0.85,
        mimeType: "image/webp",
      });

      setPreview(previewUrl);

      // 2. Submit optimized payload via Server Action
      const formData = new FormData();
      formData.append("thumbnail", optimizedFile);

      startTransition(async () => {
        await action(formData);
      });
    } catch (err) {
      console.error("Image optimization/upload error:", err);
      setClientError(err instanceof Error ? err.message : "Failed to process image.");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  const activeError = clientError || state?.message;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row items-center gap-6 rounded-xl bg-white p-6 sm:p-8 shadow-[0_1px_3px_rgba(18,22,28,0.08)] border border-neutral-200/80">
        {/* Cover Preview */}
        <div className="relative flex aspect-video w-full sm:w-64 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-neutral-100 border border-neutral-200 shadow-xs">
          {displayImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={displayImage}
              alt="Course thumbnail"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center gap-2 p-4 text-center">
              <ImagePlaceholderIcon className="h-10 w-10 text-neutral-400" />
              <span className="text-xs text-neutral-500 font-medium">No cover image uploaded</span>
            </div>
          )}
          {isBusy && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white text-xs font-semibold backdrop-blur-xs">
              <div className="flex flex-col items-center gap-1.5">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>{isCompressing ? "Optimizing..." : "Uploading..."}</span>
              </div>
            </div>
          )}
        </div>

        {/* Upload Controls */}
        <div className="flex-1 w-full text-left">
          <h3 className="text-base font-semibold text-primary-900">Course cover image</h3>
          <p className="mt-1 text-xs sm:text-sm text-neutral-700">
            Upload a high-resolution thumbnail that represents your course. Recommended size: 1280x720 (16:9 ratio).
          </p>
          <p className="mt-1 text-xs text-neutral-400">
            Auto-optimized on upload. Supported formats: PNG, JPEG, WEBP, or GIF.
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif,image/heic,image/heif"
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isBusy}
              className="inline-flex h-10 items-center justify-center rounded-lg bg-primary-700 px-5 text-sm font-medium text-white shadow-xs transition hover:bg-primary-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-60 cursor-pointer"
            >
              {displayImage ? "Replace" : "Upload"}
            </button>
            {isBusy && (
              <span className="text-xs font-medium text-primary-700">
                {isCompressing ? "Preparing image..." : "Saving image..."}
              </span>
            )}
            {state?.success && !isBusy && (
              <span className="text-xs font-semibold text-success-600">✓ Image saved</span>
            )}
          </div>

          {activeError && <FormAlert message={activeError} className="mt-3" />}
        </div>
      </div>
    </div>
  );
}

