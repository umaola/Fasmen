"use client";

import { useActionState, useRef } from "react";
import { updateProfilePhotoAction } from "@/app/actions/profile";
import type { ImageUploadState } from "@/lib/definitions";
import { ImagePlaceholderIcon } from "@/components/icons";

export function StudentProfileForm({
  displayName,
  photoURL,
}: {
  displayName: string;
  photoURL: string | null;
}) {
  const [photoState, photoAction, photoPending] = useActionState<ImageUploadState, FormData>(
    updateProfilePhotoAction,
    undefined
  );
  const photoFormRef = useRef<HTMLFormElement>(null);

  return (
    <div className="relative -mt-14 flex flex-col items-center">
      <form ref={photoFormRef} action={photoAction} className="group relative">
        <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-neutral-100 shadow-[0_4px_12px_rgba(18,22,28,0.14)] transition group-hover:scale-[1.02]">
          {photoURL ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photoURL} alt="Profile" className="h-full w-full object-cover" />
          ) : (
            <ImagePlaceholderIcon className="h-10 w-10 text-neutral-400" />
          )}
        </div>
        <label className="absolute right-0 bottom-0 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-accent-600 text-white shadow-[0_1px_3px_rgba(18,22,28,0.2)] transition hover:brightness-105">
          <span className="text-xs font-bold">{photoPending ? "…" : "+"}</span>
          <input
            type="file"
            name="photo"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="hidden"
            onChange={() => photoFormRef.current?.requestSubmit()}
          />
        </label>
        {photoState?.message && (
          <p className="absolute top-full left-1/2 mt-2 w-48 -translate-x-1/2 text-center text-xs text-error-600">
            {photoState.message}
          </p>
        )}
      </form>

      <h2 className="font-heading mt-4 text-xl font-bold text-primary-900">{displayName}</h2>
    </div>
  );
}
