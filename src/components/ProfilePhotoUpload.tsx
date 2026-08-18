"use client";

import { useActionState, useRef } from "react";
import { ImagePlaceholderIcon } from "@/components/icons";
import type { ImageUploadState } from "@/lib/definitions";
import { FormAlert } from "@/components/FormAlert";

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
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="flex flex-col items-center gap-3 rounded-lg bg-white p-6 text-center shadow-[0_1px_3px_rgba(18,22,28,0.08)]"
    >
      <p className="text-sm font-medium text-neutral-900">Profile image</p>
      <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-neutral-100">
        {photoURL ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photoURL} alt="Profile" className="h-full w-full object-cover" />
        ) : (
          <ImagePlaceholderIcon className="h-8 w-8 text-neutral-400" />
        )}
      </div>
      <label className="cursor-pointer rounded-md border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100">
        {pending ? "Uploading..." : "Select profile image"}
        <input
          type="file"
          name={fieldName}
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="hidden"
          onChange={() => formRef.current?.requestSubmit()}
        />
      </label>
      <p className="max-w-xs text-xs text-neutral-400">
        Tap to change/upload your profile image, only valid image files less than 5MB are
        accepted.
      </p>
      <FormAlert message={state?.message} />
    </form>
  );
}
