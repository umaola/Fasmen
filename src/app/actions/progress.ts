"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/authz";
import { findEnrollment, markLessonComplete } from "@/lib/enrollments";
import { listLessonsByCourse } from "@/lib/courses";

export async function completeLessonAction(
  courseId: string,
  slug: string,
  lessonId: string
): Promise<void> {
  const user = await requireRole("student");
  if (!user) return;

  const enrollment = await findEnrollment(user.id, courseId);
  if (!enrollment) return;

  const lessons = await listLessonsByCourse(courseId);
  await markLessonComplete(user.id, courseId, lessonId, lessons.length);

  revalidatePath(`/dashboard/learn/${slug}`);
  revalidatePath("/dashboard");
}
