"use server";

import { revalidatePath } from "next/cache";
import { ReviewFormSchema, type ReviewState } from "@/lib/definitions";
import { requireRole } from "@/lib/authz";
import { findEnrollment } from "@/lib/enrollments";
import { findCourseById } from "@/lib/courses";
import {
  findReviewByStudentAndCourse,
  createReview,
  updateReview,
  deleteReview,
} from "@/lib/reviews";

export async function submitReview(
  courseId: string,
  _state: ReviewState,
  formData: FormData
): Promise<ReviewState> {
  const user = await requireRole("student");
  if (!user) {
    return { message: "You need to be logged in as a student to leave a review." };
  }

  const enrollment = await findEnrollment(user.id, courseId);
  if (!enrollment) {
    return { message: "You need to be enrolled in this course to leave a review." };
  }

  const existing = await findReviewByStudentAndCourse(user.id, courseId);
  if (existing) {
    return { message: "You've already reviewed this course — edit your existing review instead." };
  }

  const validatedFields = ReviewFormSchema.safeParse({
    rating: formData.get("rating"),
    comment: formData.get("comment"),
  });

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }

  await createReview({
    courseId,
    studentId: user.id,
    studentName: user.displayName,
    rating: validatedFields.data.rating,
    comment: validatedFields.data.comment,
  });

  const course = await findCourseById(courseId);
  if (course) revalidatePath(`/courses/${course.slug}`);
  return { success: true };
}

export async function editReview(
  reviewId: string,
  courseId: string,
  _state: ReviewState,
  formData: FormData
): Promise<ReviewState> {
  const user = await requireRole("student");
  if (!user) {
    return { message: "You need to be logged in to edit your review." };
  }

  const existing = await findReviewByStudentAndCourse(user.id, courseId);
  if (!existing || existing.id !== reviewId) {
    return { message: "You can only edit your own review." };
  }

  const validatedFields = ReviewFormSchema.safeParse({
    rating: formData.get("rating"),
    comment: formData.get("comment"),
  });

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }

  await updateReview(reviewId, validatedFields.data);

  const course = await findCourseById(courseId);
  if (course) revalidatePath(`/courses/${course.slug}`);
  return { success: true };
}

export async function deleteReviewAction(reviewId: string, courseId: string): Promise<void> {
  const user = await requireRole("student");
  if (!user) return;

  const existing = await findReviewByStudentAndCourse(user.id, courseId);
  if (!existing || existing.id !== reviewId) return;

  await deleteReview(reviewId);

  const course = await findCourseById(courseId);
  if (course) revalidatePath(`/courses/${course.slug}`);
}
