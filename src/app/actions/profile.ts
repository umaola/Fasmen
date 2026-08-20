"use server";

import { revalidatePath } from "next/cache";
import {
  UpdateProfileFormSchema,
  type UpdateProfileState,
  type ImageUploadState,
} from "@/lib/definitions";
import { getCurrentUser } from "@/lib/dal";
import { updateUserProfile, updateUserPhoto } from "@/lib/users";
import { saveUploadedImage, UploadError } from "@/lib/uploads";

export async function updateProfile(
  _state: UpdateProfileState,
  formData: FormData
): Promise<UpdateProfileState> {
  const user = await getCurrentUser();
  if (!user) {
    return { message: "You need to be logged in to update your profile." };
  }

  const validatedFields = UpdateProfileFormSchema.safeParse({
    displayName: formData.get("displayName"),
    bio: formData.get("bio"),
  });

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }

  const { displayName, bio } = validatedFields.data;
  await updateUserProfile(user.id, { displayName, bio: bio || null });

  revalidatePath("/dashboard/account");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateProfilePhotoAction(
  _state: ImageUploadState,
  formData: FormData
): Promise<ImageUploadState> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { message: "You need to be logged in to update your profile photo." };
    }

    const file = formData.get("photo");
    if (!(file instanceof File)) {
      return { message: "Choose an image file." };
    }

    const photoURL = await saveUploadedImage(file, "avatars");
    await updateUserPhoto(user.id, photoURL);

    revalidatePath("/dashboard/account");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (err) {
    console.error("Profile photo upload error:", err);
    if (err instanceof UploadError) {
      return { message: err.message };
    }
    const errMessage = err instanceof Error ? err.message : "Failed to update profile photo.";
    return { message: errMessage };
  }
}
