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

  return (
    <form
      ref={formRef}
      action={action}
      className="flex items-center gap-4 rounded-lg bg-white p-5 shadow-[0_1px_3px_rgba(18,22,28,0.08)]"
    >
      <div className="flex h-24 w-40 shrink-0 items-center justify-center overflow-hidden rounded-md bg-neutral-100">
        {thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={thumbnailUrl} alt="Course thumbnail" className="h-full w-full object-cover" />
        ) : (
          <ImagePlaceholderIcon className="h-8 w-8 text-neutral-400" />
        )}
      </div>
      <div>
        <p className="text-sm font-medium text-neutral-900">Course thumbnail</p>
        <p className="mt-1 text-xs text-neutral-400">PNG, JPEG, WEBP, or GIF — under 5MB.</p>
        <div className="mt-2 flex items-center gap-3">
          <input
            type="file"
            name="thumbnail"
            accept="image/png,image/jpeg,image/webp,image/gif"
            onChange={() => formRef.current?.requestSubmit()}
            className="text-sm text-neutral-700 file:mr-3 file:h-9 file:rounded-md file:border file:border-neutral-200 file:bg-white file:px-4 file:text-sm file:font-medium file:text-neutral-700 hover:file:bg-neutral-100"
          />
          {pending && <span className="text-xs text-neutral-700">Uploading...</span>}
        </div>
        <FormAlert message={state?.message} className="mt-2" />
      </div>
    </form>
  );
}
