"use server";

import { revalidatePath } from "next/cache";
import { UpdateProfileFormSchema, type UpdateProfileState } from "@/lib/definitions";
import { getCurrentUser } from "@/lib/dal";
import { updateUserProfile } from "@/lib/users";

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

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard");
  return { success: true };
}
