"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/authz";
import { findCourseById, incrementEnrollmentCount } from "@/lib/courses";
import { incrementTutorTotalStudents } from "@/lib/users";
import { createDummySuccessfulPayment } from "@/lib/payments";
import { findEnrollment, createEnrollment } from "@/lib/enrollments";

export async function enrollInCourse(courseId: string): Promise<void> {
  const user = await requireRole("student");
  if (!user) {
    redirect("/login");
  }

  const course = await findCourseById(courseId);
  if (!course || course.status !== "published") {
    redirect("/courses");
  }

  const existing = await findEnrollment(user.id, courseId);
  if (existing) {
    redirect(`/dashboard/learn/${course.slug}`);
  }

  const payment = await createDummySuccessfulPayment({
    studentId: user.id,
    courseId: course.id,
    courseTitle: course.title,
    tutorId: course.tutorId,
    amount: course.price,
  });

  await createEnrollment({
    studentId: user.id,
    courseId: course.id,
    courseTitle: course.title,
    courseSlug: course.slug,
    tutorId: course.tutorId,
    paymentId: payment.id,
  });

  await incrementEnrollmentCount(course.id);
  await incrementTutorTotalStudents(course.tutorId);

  revalidatePath(`/courses/${course.slug}`);
  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/learn/${course.slug}`);

  redirect(`/dashboard/learn/${course.slug}`);
}
