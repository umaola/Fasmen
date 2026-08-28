"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/authz";
import { findEnrollment, markLessonComplete, setCertificateId, recordAssessmentAttempt } from "@/lib/enrollments";
import { findCourseById, listLessonsByCourse } from "@/lib/courses";
import { listQuestionsByCourse } from "@/lib/assessments";
import { issueCertificate } from "@/lib/certificates";
import { logStudyActivity } from "@/lib/studentActivity";

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
  const updatedEnrollment = await markLessonComplete(user.id, courseId, lessonId, lessons.length);
  await logStudyActivity(user.id, 15);

  // If all lessons are completed, check if assessment is required
  const completedCount = updatedEnrollment?.progress.completedLessonIds.length ?? 0;
  const isAllComplete = lessons.length > 0 && completedCount >= lessons.length;

  if (isAllComplete) {
    const questions = await listQuestionsByCourse(courseId);
    // If no assessment questions were added by the tutor, certify immediately upon 100% completion!
    if (questions.length === 0 && !enrollment.certificateId) {
      const course = await findCourseById(courseId);
      if (course) {
        const certificate = await issueCertificate({
          studentId: user.id,
          studentName: user.displayName,
          courseId,
          courseTitle: course.title,
          tutorName: course.tutorName,
          scorePercent: 100,
        });
        await setCertificateId(user.id, courseId, certificate.id);
        await recordAssessmentAttempt(user.id, courseId, { scorePercent: 100, passed: true });
        revalidatePath("/dashboard/certificates");
      }
    }
  }

  revalidatePath(`/dashboard/learn/${slug}`);
  revalidatePath("/dashboard");
}
