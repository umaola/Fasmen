"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/dal";
import { toggleWishlist, isCourseWishlisted } from "@/lib/wishlist";

export async function toggleWishlistAction(
  courseId: string,
  slug?: string
): Promise<{ success: boolean; wishlisted: boolean; error?: string }> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, wishlisted: false, error: "Please log in to save courses." };
    }

    const result = await toggleWishlist(user.id, courseId);

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/saved");
    revalidatePath("/courses");
    if (slug) {
      revalidatePath(`/courses/${slug}`);
    }

    return { success: true, wishlisted: result.wishlisted };
  } catch (error) {
    console.error("toggleWishlistAction error:", error);
    return { success: false, wishlisted: false, error: "Could not update saved courses." };
  }
}

export async function checkIsWishlistedAction(courseId: string): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;
  return isCourseWishlisted(user.id, courseId);
}
