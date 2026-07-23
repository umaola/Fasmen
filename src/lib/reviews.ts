import "server-only";
import { randomUUID } from "crypto";
import { readCollection, withCollection } from "./json-store";
import { findCourseById, listCoursesByTutor, updateCourseRatingStats } from "./courses";
import { updateTutorAverageRating } from "./users";

const REVIEWS_FILE = "reviews.json";

// Mirrors courses/{courseId}/reviews/{reviewId} from firestore-schema.md,
// flattened into one collection since there are no Firestore subcollections
// here.
export interface Review {
  id: string;
  courseId: string;
  studentId: string;
  studentName: string;
  rating: number;
  comment: string;
  createdAt: string;
  updatedAt: string;
}

export async function findReviewByStudentAndCourse(
  studentId: string,
  courseId: string
): Promise<Review | undefined> {
  const reviews = await readCollection<Review>(REVIEWS_FILE);
  return reviews.find((r) => r.studentId === studentId && r.courseId === courseId);
}

export async function listReviewsByCourse(courseId: string): Promise<Review[]> {
  const reviews = await readCollection<Review>(REVIEWS_FILE);
  return reviews
    .filter((r) => r.courseId === courseId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export interface TutorReview extends Review {
  courseTitle: string;
}

// All reviews across every course a tutor owns, for the reviews table —
// enriched with courseTitle since Review only stores courseId.
export async function listReviewsByTutor(tutorId: string): Promise<TutorReview[]> {
  const [reviews, tutorCourses] = await Promise.all([
    readCollection<Review>(REVIEWS_FILE),
    listCoursesByTutor(tutorId),
  ]);
  const titleByCourseId = new Map(tutorCourses.map((c) => [c.id, c.title]));

  return reviews
    .filter((r) => titleByCourseId.has(r.courseId))
    .map((r) => ({ ...r, courseTitle: titleByCourseId.get(r.courseId)! }))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

// Recomputes course.averageRating/reviewCount and the tutor's
// tutorProfile.averageRating (weighted by each course's reviewCount) — this
// stands in for the Firestore trigger described in FR-29 since there's no
// real trigger infrastructure here.
async function recalculateCourseRating(courseId: string): Promise<void> {
  const reviews = await listReviewsByCourse(courseId);
  const reviewCount = reviews.length;
  const averageRating = reviewCount > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount : 0;
  await updateCourseRatingStats(courseId, { averageRating, reviewCount });

  const course = await findCourseById(courseId);
  if (!course) return;

  const tutorCourses = await listCoursesByTutor(course.tutorId);
  const totalReviews = tutorCourses.reduce((sum, c) => sum + c.reviewCount, 0);
  const weightedAverage =
    totalReviews > 0
      ? tutorCourses.reduce((sum, c) => sum + c.averageRating * c.reviewCount, 0) / totalReviews
      : 0;
  await updateTutorAverageRating(course.tutorId, weightedAverage);
}

export async function createReview(input: {
  courseId: string;
  studentId: string;
  studentName: string;
  rating: number;
  comment: string;
}): Promise<Review> {
  const now = new Date().toISOString();
  const review: Review = {
    id: randomUUID(),
    courseId: input.courseId,
    studentId: input.studentId,
    studentName: input.studentName,
    rating: input.rating,
    comment: input.comment,
    createdAt: now,
    updatedAt: now,
  };

  await withCollection<Review>(REVIEWS_FILE, (reviews) => [...reviews, review]);
  await recalculateCourseRating(input.courseId);
  return review;
}

export async function updateReview(
  id: string,
  patch: { rating: number; comment: string }
): Promise<Review | null> {
  const all = await withCollection<Review>(REVIEWS_FILE, (reviews) =>
    reviews.map((r) => (r.id === id ? { ...r, ...patch, updatedAt: new Date().toISOString() } : r))
  );
  const updated = all.find((r) => r.id === id) ?? null;
  if (updated) await recalculateCourseRating(updated.courseId);
  return updated;
}

export async function deleteReview(id: string): Promise<void> {
  const reviews = await readCollection<Review>(REVIEWS_FILE);
  const review = reviews.find((r) => r.id === id);
  if (!review) return;

  await withCollection<Review>(REVIEWS_FILE, (all) => all.filter((r) => r.id !== id));
  await recalculateCourseRating(review.courseId);
}
