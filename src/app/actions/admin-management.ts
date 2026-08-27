"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/authz";
import { setTutorVerificationStatus } from "@/lib/users";
import { resetStudentQuizAttempts } from "@/lib/enrollments";
import { listUnpaidPayoutsByTutor, markTutorPaid } from "@/lib/payments";
import { updateCourse, findCourseById } from "@/lib/courses";
import { revokeCertificate } from "@/lib/certificates";

export async function verifyTutorAdminAction(
  userId: string,
  verified: boolean
): Promise<void> {
  const admin = await requireRole("admin");
  if (!admin) return;

  try {
    await setTutorVerificationStatus(userId, verified);
    revalidatePath("/admin");
    revalidatePath("/admin/tutors");
    revalidatePath("/dashboard");
  } catch (err) {
    console.error("verifyTutorAdminAction error:", err);
  }
}

export async function resetStudentQuizAttemptsAdminAction(
  studentId: string,
  courseId: string
): Promise<void> {
  const admin = await requireRole("admin");
  if (!admin) return;

  try {
    await resetStudentQuizAttempts(studentId, courseId);
    revalidatePath("/admin/students");
    revalidatePath(`/dashboard/learn`);
  } catch (err) {
    console.error("resetStudentQuizAttemptsAdminAction error:", err);
  }
}

export async function processTutorPayoutBatchAction(
  tutorId: string
): Promise<void> {
  const admin = await requireRole("admin");
  if (!admin) return;

  try {
    const unpaid = await listUnpaidPayoutsByTutor(tutorId);
    if (unpaid.length === 0) return;

    const paymentIds = unpaid.map((p) => p.id);
    await markTutorPaid(paymentIds);

    revalidatePath("/admin");
    revalidatePath("/admin/finance");
    revalidatePath("/dashboard/earnings");
  } catch (err) {
    console.error("processTutorPayoutBatchAction error:", err);
  }
}

export async function toggleCoursePublishAdminAction(
  courseId: string,
  publish: boolean
): Promise<void> {
  const admin = await requireRole("admin");
  if (!admin) return;

  try {
    const course = await findCourseById(courseId);
    if (!course) return;

    const nextStatus = publish ? "published" : "draft";
    await updateCourse(courseId, {
      status: nextStatus,
      publishedAt: publish ? (course.publishedAt || new Date().toISOString()) : null,
    });

    revalidatePath("/admin");
    revalidatePath("/admin/courses");
    revalidatePath("/admin/review");
    revalidatePath("/courses");
  } catch (err) {
    console.error("toggleCoursePublishAdminAction error:", err);
  }
}

export async function revokeCertificateAdminAction(
  certificateId: string
): Promise<void> {
  const admin = await requireRole("admin");
  if (!admin) return;

  try {
    await revokeCertificate(certificateId);
    revalidatePath("/admin/certificates");
  } catch (err) {
    console.error("revokeCertificateAdminAction error:", err);
  }
}
