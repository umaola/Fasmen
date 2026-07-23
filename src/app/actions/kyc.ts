"use server";

import { revalidatePath } from "next/cache";
import { TutorVerificationFormSchema, type TutorVerificationState } from "@/lib/definitions";
import { requireRole } from "@/lib/authz";
import { findUserByUsername, completeTutorVerification } from "@/lib/users";

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

  revalidatePath("/dashboard/verification");
  revalidatePath("/dashboard");
  revalidatePath(`/tutors/${username}`);
  return { success: true };
}
