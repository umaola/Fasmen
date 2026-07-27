"use client";

import { useRouter } from "next/navigation";

export function BackButton() {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.back()}
      className="text-sm font-medium text-primary-700"
    >
      ← Back
    </button>
  );
}
