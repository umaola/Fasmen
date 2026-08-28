"use client";

import { useState, useTransition } from "react";
import { HeartIcon } from "@/components/icons";
import { toggleWishlistAction } from "@/app/actions/wishlist";

interface WishlistButtonProps {
  courseId: string;
  courseSlug?: string;
  initialWishlisted?: boolean;
  className?: string;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
}

export function WishlistButton({
  courseId,
  courseSlug,
  initialWishlisted = false,
  className = "",
  showLabel = false,
  size = "md",
}: WishlistButtonProps) {
  const [wishlisted, setWishlisted] = useState(initialWishlisted);
  const [isPending, startTransition] = useTransition();

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const nextState = !wishlisted;
    setWishlisted(nextState);

    startTransition(async () => {
      const res = await toggleWishlistAction(courseId, courseSlug);
      if (!res.success) {
        // Revert on failure
        setWishlisted(!nextState);
      } else {
        setWishlisted(res.wishlisted);
      }
    });
  };

  const iconSizes = {
    sm: "h-3.5 w-3.5",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={isPending}
      title={wishlisted ? "Remove from saved courses" : "Save course"}
      aria-label={wishlisted ? "Remove from saved courses" : "Save course"}
      className={`inline-flex items-center justify-center gap-1.5 rounded-full transition-all duration-200 active:scale-95 disabled:opacity-60 ${
        wishlisted
          ? "bg-rose-50 text-rose-600 hover:bg-rose-100"
          : "bg-white/90 text-neutral-600 hover:bg-white hover:text-rose-600 shadow-sm"
      } ${className}`}
    >
      <HeartIcon
        className={`${iconSizes[size]} transition-transform duration-200 ${
          wishlisted ? "fill-rose-500 text-rose-500 scale-110" : ""
        }`}
      />
      {showLabel && (
        <span className="text-xs font-medium">
          {wishlisted ? "Saved" : "Save for later"}
        </span>
      )}
    </button>
  );
}
