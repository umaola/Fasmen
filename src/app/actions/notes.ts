"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/dal";
import { saveLessonNote, deleteLessonNote, type StudentLessonNote } from "@/lib/notes";
import { logStudyActivity } from "@/lib/studentActivity";

export async function saveLessonNoteAction(input: {
  noteId?: string;
  courseId: string;
  courseSlug: string;
  lessonId: string;
  lessonTitle: string;
  timestampSeconds?: number | null;
  content: string;
}): Promise<{ success: boolean; note?: StudentLessonNote; error?: string }> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: "Please log in to save notes." };
    }

    if (!input.content || !input.content.trim()) {
      return { success: false, error: "Note content cannot be empty." };
    }

    const note = await saveLessonNote({
      noteId: input.noteId,
      studentId: user.id,
      courseId: input.courseId,
      courseSlug: input.courseSlug,
      lessonId: input.lessonId,
      lessonTitle: input.lessonTitle,
      timestampSeconds: input.timestampSeconds,
      content: input.content,
    });

    // Award 5 minutes of study activity for active note-taking
    await logStudyActivity(user.id, 5);

    revalidatePath(`/dashboard/learn/${input.courseSlug}`);
    revalidatePath("/dashboard");

    return { success: true, note };
  } catch (error) {
    console.error("saveLessonNoteAction error:", error);
    return { success: false, error: "Failed to save note." };
  }
}

export async function deleteLessonNoteAction(
  noteId: string,
  courseSlug: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: "Unauthorized." };
    }

    const deleted = await deleteLessonNote(user.id, noteId);
    if (deleted) {
      revalidatePath(`/dashboard/learn/${courseSlug}`);
    }

    return { success: deleted };
  } catch (error) {
    console.error("deleteLessonNoteAction error:", error);
    return { success: false, error: "Failed to delete note." };
  }
}
