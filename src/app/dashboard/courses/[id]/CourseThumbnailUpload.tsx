"use client";

import { useActionState, useRef } from "react";
import { uploadCourseThumbnailAction } from "@/app/actions/courses";
import { ImagePlaceholderIcon } from "@/components/icons";
import type { ImageUploadState } from "@/lib/definitions";
import { FormAlert } from "@/components/FormAlert";

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
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex flex-col gap-6">
      <form
        ref={formRef}
        action={action}
        className="flex flex-col sm:flex-row items-center gap-6 rounded-xl bg-white p-6 sm:p-8 shadow-[0_1px_3px_rgba(18,22,28,0.08)] border border-neutral-200/80"
      >
        {/* Cover Preview */}
        <div className="relative flex aspect-video w-full sm:w-64 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-neutral-100 border border-neutral-200 shadow-xs">
          {thumbnailUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={thumbnailUrl}
              alt="Course thumbnail"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center gap-2 p-4 text-center">
              <ImagePlaceholderIcon className="h-10 w-10 text-neutral-400" />
              <span className="text-xs text-neutral-500 font-medium">No cover image uploaded</span>
            </div>
          )}
          {pending && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-white text-xs font-semibold backdrop-blur-xs">
              Uploading...
            </div>
          )}
        </div>

        {/* Upload Controls */}
        <div className="flex-1 w-full text-left">
          <h3 className="text-base font-semibold text-primary-900">Course cover image</h3>
          <p className="mt-1 text-xs sm:text-sm text-neutral-700">
            Upload a clear, high-resolution thumbnail that represents your course. Recommended size: 1280x720 (16:9 ratio).
          </p>
          <p className="mt-1 text-xs text-neutral-400">Supported formats: PNG, JPEG, WEBP, or GIF (max 5MB).</p>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <input
              ref={fileInputRef}
              type="file"
              name="thumbnail"
              accept="image/png,image/jpeg,image/webp,image/gif"
              onChange={() => formRef.current?.requestSubmit()}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={pending}
              className="inline-flex h-10 items-center justify-center rounded-lg bg-primary-700 px-5 text-sm font-medium text-white shadow-xs transition hover:bg-primary-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-60 cursor-pointer"
            >
              {thumbnailUrl ? "Replace cover image" : "Upload cover image"}
            </button>
            {pending && <span className="text-xs font-medium text-primary-700">Uploading new image...</span>}
          </div>

          <FormAlert message={state?.message} className="mt-3" />
        </div>
      </form>
    </div>
  );
}
