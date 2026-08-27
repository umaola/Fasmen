"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/authz";
import {
  setTutorVerificationStatus,
  createAdminUser,
  removeAdminUser,
} from "@/lib/users";
import { resetStudentQuizAttempts } from "@/lib/enrollments";
import { listUnpaidPayoutsByTutor, markTutorPaid } from "@/lib/payments";
import { updateCourse, findCourseById } from "@/lib/courses";
import { revokeCertificate } from "@/lib/certificates";

export async function addNewAdminAction(input: {
  displayName: string;
  email: string;
}): Promise<{ success: boolean; error?: string }> {
  const currentAdmin = await requireRole("admin");
  if (!currentAdmin) {
    return { success: false, error: "Unauthorized. Administrator privileges required." };
  }

  const displayName = (input.displayName || "").trim();
  const email = (input.email || "").trim().toLowerCase();

  if (!displayName) {
    return { success: false, error: "Administrator full name is required." };
  }

  if (!email || !email.includes("@")) {
    return { success: false, error: "A valid email address is required." };
  }

  try {
    await createAdminUser({ displayName, email });
    revalidatePath("/admin");
    revalidatePath("/admin/admins");
    return { success: true };
  } catch (err: unknown) {
    console.error("addNewAdminAction error:", err);
    const msg = err instanceof Error ? err.message : "Failed to add administrator.";
    return { success: false, error: msg };
  }
}

export async function revokeAdminAction(userId: string): Promise<void> {
  const currentAdmin = await requireRole("admin");
  if (!currentAdmin) return;

  try {
    await removeAdminUser(userId);
    revalidatePath("/admin");
    revalidatePath("/admin/admins");
  } catch (err: unknown) {
    console.error("revokeAdminAction error:", err);
  }
}

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
