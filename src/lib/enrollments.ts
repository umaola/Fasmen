import "server-only";
import { readCollection, withCollection } from "./json-store";

const ENROLLMENTS_FILE = "enrollments.json";

export interface EnrollmentProgress {
  completedLessonIds: string[];
  lastLessonId: string | null;
  percentComplete: number;
  lastAccessedAt: string;
}

export interface EnrollmentAssessment {
  attemptsUsed: number;
  bestScorePercent: number | null;
  passed: boolean;
  lastAttemptAt: string | null;
}

// Mirrors enrollments/{userId}_{courseId} from firestore-schema.md — a
// deterministic id doubles as the dedup key, so a student can't be enrolled
// in the same course twice.
export interface Enrollment {
  id: string;
  studentId: string;
  courseId: string;
  courseTitle: string;
  courseSlug: string;
  tutorId: string;
  paymentId: string;
  enrolledAt: string;
  progress: EnrollmentProgress;
  assessment: EnrollmentAssessment;
  certificateId: string | null;
}

function enrollmentId(studentId: string, courseId: string): string {
  return `${studentId}_${courseId}`;
}

export async function findEnrollment(
  studentId: string,
  courseId: string
): Promise<Enrollment | undefined> {
  const enrollments = await readCollection<Enrollment>(ENROLLMENTS_FILE);
  return enrollments.find((e) => e.id === enrollmentId(studentId, courseId));
}

export async function listEnrollmentsByStudent(studentId: string): Promise<Enrollment[]> {
  const enrollments = await readCollection<Enrollment>(ENROLLMENTS_FILE);
  return enrollments
    .filter((e) => e.studentId === studentId)
    .sort((a, b) => b.enrolledAt.localeCompare(a.enrolledAt));
}

export async function listEnrollmentsByCourse(courseId: string): Promise<Enrollment[]> {
  const enrollments = await readCollection<Enrollment>(ENROLLMENTS_FILE);
  return enrollments.filter((e) => e.courseId === courseId);
}

export async function listEnrollmentsByTutor(tutorId: string): Promise<Enrollment[]> {
  const enrollments = await readCollection<Enrollment>(ENROLLMENTS_FILE);
  return enrollments
    .filter((e) => e.tutorId === tutorId)
    .sort((a, b) => b.enrolledAt.localeCompare(a.enrolledAt));
}

export async function createEnrollment(input: {
  studentId: string;
  courseId: string;
  courseTitle: string;
  courseSlug: string;
  tutorId: string;
  paymentId: string;
}): Promise<Enrollment> {
  const now = new Date().toISOString();
  const enrollment: Enrollment = {
    id: enrollmentId(input.studentId, input.courseId),
    studentId: input.studentId,
    courseId: input.courseId,
    courseTitle: input.courseTitle,
    courseSlug: input.courseSlug,
    tutorId: input.tutorId,
    paymentId: input.paymentId,
    enrolledAt: now,
    progress: {
      completedLessonIds: [],
      lastLessonId: null,
      percentComplete: 0,
      lastAccessedAt: now,
    },
    assessment: {
      attemptsUsed: 0,
      bestScorePercent: null,
      passed: false,
      lastAttemptAt: null,
    },
    certificateId: null,
  };

  await withCollection<Enrollment>(ENROLLMENTS_FILE, (enrollments) => [...enrollments, enrollment]);
  return enrollment;
}

async function updateEnrollment(
  id: string,
  patch: Partial<Enrollment>
): Promise<Enrollment | null> {
  let updated: Enrollment | null = null;
  await withCollection<Enrollment>(ENROLLMENTS_FILE, (enrollments) =>
    enrollments.map((e) => {
      if (e.id !== id) return e;
      updated = { ...e, ...patch };
      return updated;
    })
  );
  return updated;
}

export async function markLessonComplete(
  studentId: string,
  courseId: string,
  lessonId: string,
  totalLessons: number
): Promise<Enrollment | null> {
  const enrollment = await findEnrollment(studentId, courseId);
  if (!enrollment) return null;

  const completedLessonIds = enrollment.progress.completedLessonIds.includes(lessonId)
    ? enrollment.progress.completedLessonIds
    : [...enrollment.progress.completedLessonIds, lessonId];

  return updateEnrollment(enrollment.id, {
    progress: {
      completedLessonIds,
      lastLessonId: lessonId,
      percentComplete: totalLessons > 0 ? Math.round((completedLessonIds.length / totalLessons) * 100) : 0,
      lastAccessedAt: new Date().toISOString(),
    },
  });
}

export async function recordAssessmentAttempt(
  studentId: string,
  courseId: string,
  result: { scorePercent: number; passed: boolean }
): Promise<Enrollment | null> {
  const enrollment = await findEnrollment(studentId, courseId);
  if (!enrollment) return null;

  return updateEnrollment(enrollment.id, {
    assessment: {
      attemptsUsed: enrollment.assessment.attemptsUsed + 1,
      bestScorePercent: Math.max(enrollment.assessment.bestScorePercent ?? 0, result.scorePercent),
      passed: enrollment.assessment.passed || result.passed,
      lastAttemptAt: new Date().toISOString(),
    },
  });
}

export async function setCertificateId(
  studentId: string,
  courseId: string,
  certificateId: string
): Promise<Enrollment | null> {
  const enrollment = await findEnrollment(studentId, courseId);
  if (!enrollment) return null;
  return updateEnrollment(enrollment.id, { certificateId });
}

export async function listAllEnrollments(): Promise<Enrollment[]> {
  const enrollments = await readCollection<Enrollment>(ENROLLMENTS_FILE);
  return enrollments.sort((a, b) => b.enrolledAt.localeCompare(a.enrolledAt));
}

export async function resetStudentQuizAttempts(
  studentId: string,
  courseId: string
): Promise<Enrollment | null> {
  const enrollment = await findEnrollment(studentId, courseId);
  if (!enrollment) return null;

  return updateEnrollment(enrollment.id, {
    assessment: {
      attemptsUsed: 0,
      bestScorePercent: enrollment.assessment.bestScorePercent,
      passed: enrollment.assessment.passed,
      lastAttemptAt: enrollment.assessment.lastAttemptAt,
    },
  });
}
