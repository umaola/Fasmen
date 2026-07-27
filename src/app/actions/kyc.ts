"use server";

import { revalidatePath } from "next/cache";
import {
  TutorVerificationFormSchema,
  type TutorVerificationState,
  type ImageUploadState,
} from "@/lib/definitions";
import { requireRole } from "@/lib/authz";
import { findUserByUsername, completeTutorVerification, updateUserPhoto } from "@/lib/users";
import { saveUploadedImage, UploadError } from "@/lib/uploads";

export async function submitTutorVerification(
  _state: TutorVerificationState,
  formData: FormData
): Promise<TutorVerificationState> {
  const user = await requireRole("tutor");
  if (!user) {
    return { message: "Only tutor accounts can complete verification." };
  }

  const validatedFields = TutorVerificationFormSchema.safeParse({
    idType: formData.get("idType"),
    idNumber: formData.get("idNumber"),
    bio: formData.get("bio"),
    username: formData.get("username"),
  });

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }

  const { idType, idNumber, bio, username } = validatedFields.data;

  const existing = await findUserByUsername(username);
  if (existing && existing.id !== user.id) {
    return { errors: { username: ["That username is already taken."] } };
  }

  await completeTutorVerification(user.id, { username, idType, idNumber, bio });

  revalidatePath("/dashboard/account/verify");
  revalidatePath("/dashboard");
  revalidatePath(`/tutors/${username}`);
  return { success: true };
}

export async function uploadVerificationPhotoAction(
  _state: ImageUploadState,
  formData: FormData
): Promise<ImageUploadState> {
  const user = await requireRole("tutor");
  if (!user) {
    return { message: "Only tutor accounts can upload a verification photo." };
  }

  const file = formData.get("photo");
  if (!(file instanceof File)) {
    return { message: "Choose an image file." };
  }

  try {
    const photoURL = await saveUploadedImage(file, "avatars");
    await updateUserPhoto(user.id, photoURL);
  } catch (err) {
    if (err instanceof UploadError) {
      return { message: err.message };
    }
    throw err;
  }

  revalidatePath("/dashboard/account/verify");
  revalidatePath("/dashboard/account");
  if (user.tutorProfile?.username) {
    revalidatePath(`/tutors/${user.tutorProfile.username}`);
  }
  return { success: true };
}
