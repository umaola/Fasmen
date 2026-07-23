import "server-only";
import { randomUUID } from "crypto";
import { readCollection, withCollection } from "./json-store";
import { findCourseById } from "./courses";
import { recordAssessmentAttempt } from "./enrollments";

const QUESTIONS_FILE = "questions.json";
const ATTEMPTS_FILE = "quiz-attempts.json";

export type QuestionType = "single-choice" | "multi-choice";

// Mirrors courses/{courseId}/assessmentQuestions/{questionId} from
// firestore-schema.md — correctOptionIndexes is never sent to the client
// during an in-progress attempt (see listQuestionsForAttempt).
export interface Question {
  id: string;
  courseId: string;
  order: number;
  questionText: string;
  type: QuestionType;
  options: string[];
  correctOptionIndexes: number[];
  points: number;
  createdAt: string;
}

export interface QuizAnswer {
  questionId: string;
  selectedOptionIndexes: number[];
  correct: boolean;
}

export interface QuizAttempt {
  id: string;
  enrollmentId: string;
  studentId: string;
  courseId: string;
  attemptNumber: number;
  scorePercent: number;
  answers: QuizAnswer[];
  submittedAt: string;
}

export async function listQuestionsByCourse(courseId: string): Promise<Question[]> {
  const questions = await readCollection<Question>(QUESTIONS_FILE);
  return questions.filter((q) => q.courseId === courseId).sort((a, b) => a.order - b.order);
}

export async function listQuestionsForAttempt(
  courseId: string
): Promise<Omit<Question, "correctOptionIndexes">[]> {
  const questions = await listQuestionsByCourse(courseId);
  return questions.map((q) => ({
    id: q.id,
    courseId: q.courseId,
    order: q.order,
    questionText: q.questionText,
    type: q.type,
    options: q.options,
    points: q.points,
    createdAt: q.createdAt,
  }));
}

export async function addQuestion(input: {
  courseId: string;
  questionText: string;
  type: QuestionType;
  options: string[];
  correctOptionIndexes: number[];
  points: number;
}): Promise<Question> {
  const existing = await listQuestionsByCourse(input.courseId);
  const question: Question = {
    id: randomUUID(),
    courseId: input.courseId,
    order: existing.length,
    questionText: input.questionText,
    type: input.type,
    options: input.options,
    correctOptionIndexes: input.correctOptionIndexes,
    points: input.points,
    createdAt: new Date().toISOString(),
  };

  await withCollection<Question>(QUESTIONS_FILE, (questions) => [...questions, question]);
  return question;
}

export async function deleteQuestion(id: string): Promise<void> {
  await withCollection<Question>(QUESTIONS_FILE, (questions) =>
    questions.filter((q) => q.id !== id)
  );
}

export async function deleteQuestionsByCourse(courseId: string): Promise<void> {
  await withCollection<Question>(QUESTIONS_FILE, (questions) =>
    questions.filter((q) => q.courseId !== courseId)
  );
}

export async function listAttemptsByEnrollment(enrollmentId: string): Promise<QuizAttempt[]> {
  const attempts = await readCollection<QuizAttempt>(ATTEMPTS_FILE);
  return attempts
    .filter((a) => a.enrollmentId === enrollmentId)
    .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
}

// Server-only grading — mirrors the planned gradeAssessment callable function.
// Never expose this to a Client Component; only submitAssessmentAction calls it.
export async function gradeAssessment(input: {
  courseId: string;
  studentId: string;
  enrollmentId: string;
  attemptNumber: number;
  answers: { questionId: string; selectedOptionIndexes: number[] }[];
}): Promise<{ scorePercent: number; passed: boolean; attempt: QuizAttempt }> {
  const questions = await listQuestionsByCourse(input.courseId);
  const course = await findCourseById(input.courseId);

  const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);
  let earnedPoints = 0;

  const answers: QuizAnswer[] = questions.map((question) => {
    const answer = input.answers.find((a) => a.questionId === question.id);
    const selected = answer?.selectedOptionIndexes ?? [];
    const correct =
      selected.length === question.correctOptionIndexes.length &&
      selected.every((i) => question.correctOptionIndexes.includes(i));
    if (correct) earnedPoints += question.points;
    return { questionId: question.id, selectedOptionIndexes: selected, correct };
  });

  const scorePercent = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
  const passed = scorePercent >= (course?.passThresholdPercent ?? 100);

  const attempt: QuizAttempt = {
    id: randomUUID(),
    enrollmentId: input.enrollmentId,
    studentId: input.studentId,
    courseId: input.courseId,
    attemptNumber: input.attemptNumber,
    scorePercent,
    answers,
    submittedAt: new Date().toISOString(),
  };

  await withCollection<QuizAttempt>(ATTEMPTS_FILE, (attempts) => [...attempts, attempt]);
  await recordAssessmentAttempt(input.studentId, input.courseId, { scorePercent, passed });

  return { scorePercent, passed, attempt };
}
