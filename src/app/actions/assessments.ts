"use server";

import { revalidatePath } from "next/cache";
import { AddQuestionFormSchema, type AddQuestionState } from "@/lib/definitions";
import { requireRole } from "@/lib/authz";
import { requireCourseOwner } from "@/app/actions/courses";
import { findCourseById } from "@/lib/courses";
import { findEnrollment, setCertificateId } from "@/lib/enrollments";
import { addQuestion, deleteQuestion, gradeAssessment } from "@/lib/assessments";
import { issueCertificate } from "@/lib/certificates";

export async function addQuestionAction(
  courseId: string,
  _state: AddQuestionState,
  formData: FormData
): Promise<AddQuestionState> {
  const course = await requireCourseOwner(courseId);
  if (!course) {
    return { message: "You don't have access to this course." };
  }

  const validatedFields = AddQuestionFormSchema.safeParse({
    questionText: formData.get("questionText"),
    type: formData.get("type"),
    optionsRaw: formData.get("optionsRaw"),
    correctIndexesRaw: formData.get("correctIndexesRaw"),
    points: formData.get("points"),
  });

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }

  const { questionText, type, optionsRaw, correctIndexesRaw, points } = validatedFields.data;
  const options = optionsRaw
    .split("\n")
    .map((o) => o.trim())
    .filter(Boolean);

  if (options.length < 2) {
    return { errors: { optionsRaw: ["Add at least two options, one per line."] } };
  }

  const correctOptionIndexes = correctIndexesRaw
    .split(",")
    .map((s) => Number.parseInt(s.trim(), 10))
    .filter((n) => Number.isInteger(n) && n >= 0 && n < options.length);

  if (correctOptionIndexes.length === 0) {
    return {
      errors: {
        correctIndexesRaw: ["Enter valid option numbers (comma-separated, matching the options above)."],
      },
    };
  }

  await addQuestion({ courseId, questionText, type, options, correctOptionIndexes, points });
  revalidatePath(`/dashboard/courses/${courseId}`);
  return { success: true };
}

export async function deleteQuestionAction(courseId: string, questionId: string): Promise<void> {
  const course = await requireCourseOwner(courseId);
  if (!course) return;

  await deleteQuestion(questionId);
  revalidatePath(`/dashboard/courses/${courseId}`);
}

export type SubmitAssessmentResult =
  | { error: string }
  | { scorePercent: number; passed: boolean; attemptsRemaining: number };

export async function submitAssessmentAction(
  courseId: string,
  slug: string,
  _state: SubmitAssessmentResult | undefined,
  formData: FormData
): Promise<SubmitAssessmentResult> {
  const user = await requireRole("student");
  if (!user) {
    return { error: "You need to be logged in as a student to take this assessment." };
  }

  const course = await findCourseById(courseId);
  if (!course) {
    return { error: "Course not found." };
  }

  const enrollment = await findEnrollment(user.id, courseId);
  if (!enrollment) {
    return { error: "You need to be enrolled in this course to take the assessment." };
  }

  if (enrollment.progress.percentComplete < 100) {
    return { error: "Complete all lessons before taking the assessment." };
  }

  if (enrollment.assessment.attemptsUsed >= course.maxAttempts) {
    return { error: "You've used all your attempts for this assessment." };
  }

  let answers: { questionId: string; selectedOptionIndexes: number[] }[] = [];
  try {
    answers = JSON.parse(String(formData.get("answersJson") ?? "[]"));
  } catch {
    return { error: "Something went wrong submitting your answers — please try again." };
  }

  const result = await gradeAssessment({
    courseId,
    studentId: user.id,
    enrollmentId: enrollment.id,
    attemptNumber: enrollment.assessment.attemptsUsed + 1,
    answers,
  });

  if (result.passed && !enrollment.certificateId) {
    const certificate = await issueCertificate({
      studentId: user.id,
      studentName: user.displayName,
      courseId,
      courseTitle: course.title,
      tutorName: course.tutorName,
      scorePercent: result.scorePercent,
    });
    await setCertificateId(user.id, courseId, certificate.id);
    revalidatePath("/dashboard/certificates");
  }

  revalidatePath(`/dashboard/learn/${slug}`);
  revalidatePath(`/dashboard/learn/${slug}/assessment`);

  return {
    scorePercent: result.scorePercent,
    passed: result.passed,
    attemptsRemaining: course.maxAttempts - (enrollment.assessment.attemptsUsed + 1),
  };
}
