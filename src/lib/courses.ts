import "server-only";
import { randomUUID } from "crypto";
import { readCollection, withCollection } from "./json-store";

const COURSES_FILE = "courses.json";
const LESSONS_FILE = "lessons.json";

export type CourseStatus = "draft" | "pending-review" | "published" | "rejected";
export type CourseLevel = "beginner" | "intermediate" | "advanced";

export interface Course {
  id: string;
  title: string;
  slug: string;
  description: string;
  tutorId: string;
  tutorName: string;
  category: string;
  tags: string[];
  price: number; // kobo
  currency: "NGN";
  status: CourseStatus;
  language: string;
  level: CourseLevel;
  thumbnailUrl: string | null;
  totalLessons: number;
  enrollmentCount: number;
  averageRating: number;
  reviewCount: number;
  passThresholdPercent: number;
  maxAttempts: number;
  rejectionFeedback: string | null;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
}

export type LessonType = "reading" | "video";

export interface Lesson {
  id: string;
  courseId: string;
  title: string;
  order: number;
  type: LessonType;
  content: string;
  videoGuid: string | null;
  videoDurationSeconds: number | null;
  isPreview: boolean;
  createdAt: string;
}

function slugify(title: string): string {
  return (title || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function uniqueSlug(title: string): Promise<string> {
  const courses = await readCollection<Course>(COURSES_FILE);
  const base = slugify(title) || "course";
  let candidate = base;
  let suffix = 1;
  while (courses.some((c) => c && c.slug === candidate)) {
    suffix += 1;
    candidate = `${base}-${suffix}`;
  }
  return candidate;
}

export async function createCourseDraft(input: {
  title: string;
  description: string;
  tutorId: string;
  tutorName: string;
  category: string;
  tags: string[];
  priceNaira: number;
  language: string;
  level: CourseLevel;
  passThresholdPercent: number;
  maxAttempts: number;
}): Promise<Course> {
  const now = new Date().toISOString();
  const course: Course = {
    id: randomUUID(),
    title: input.title || "Untitled Course",
    slug: await uniqueSlug(input.title),
    description: input.description || "",
    tutorId: input.tutorId,
    tutorName: input.tutorName || "Instructor",
    category: input.category,
    tags: Array.isArray(input.tags) ? input.tags : [],
    price: Math.round((Number(input.priceNaira) || 0) * 100),
    currency: "NGN",
    status: "draft",
    language: input.language || "en",
    level: input.level || "beginner",
    thumbnailUrl: null,
    totalLessons: 0,
    enrollmentCount: 0,
    averageRating: 0,
    reviewCount: 0,
    passThresholdPercent: Number(input.passThresholdPercent) || 70,
    maxAttempts: Number(input.maxAttempts) || 3,
    rejectionFeedback: null,
    createdAt: now,
    updatedAt: now,
    publishedAt: null,
  };

  await withCollection<Course>(COURSES_FILE, (courses) => [...courses, course]);
  return course;
}

export async function listCoursesByTutor(tutorId: string): Promise<Course[]> {
  try {
    const courses = await readCollection<Course>(COURSES_FILE);
    return courses
      .filter((c) => Boolean(c && c.tutorId === tutorId))
      .sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || ""));
  } catch (err) {
    console.error("listCoursesByTutor error:", err);
    return [];
  }
}

export async function listPublishedCourses(filters?: {
  category?: string;
  search?: string;
}): Promise<Course[]> {
  try {
    const courses = await readCollection<Course>(COURSES_FILE);
    const search = filters?.search?.trim().toLowerCase();

    return courses
      .filter((c) => Boolean(c && c.status === "published"))
      .filter((c) => !filters?.category || c.category === filters.category)
      .filter((c) => {
        if (!search) return true;
        const titleMatch = typeof c.title === "string" && c.title.toLowerCase().includes(search);
        const tagMatch = Array.isArray(c.tags) && c.tags.some((tag) => typeof tag === "string" && tag.toLowerCase().includes(search));
        return titleMatch || tagMatch;
      })
      .sort((a, b) => (Number(b.enrollmentCount) || 0) - (Number(a.enrollmentCount) || 0));
  } catch (err) {
    console.error("listPublishedCourses error:", err);
    return [];
  }
}

export async function listPendingReviewCourses(): Promise<Course[]> {
  try {
    const courses = await readCollection<Course>(COURSES_FILE);
    return courses
      .filter((c) => Boolean(c && c.status === "pending-review"))
      .sort((a, b) => (a.updatedAt || "").localeCompare(b.updatedAt || ""));
  } catch (err) {
    console.error("listPendingReviewCourses error:", err);
    return [];
  }
}

export async function listAllCourses(): Promise<Course[]> {
  try {
    return await readCollection<Course>(COURSES_FILE);
  } catch (err) {
    console.error("listAllCourses error:", err);
    return [];
  }
}

export async function findCourseById(id: string): Promise<Course | undefined> {
  try {
    const courses = await readCollection<Course>(COURSES_FILE);
    return courses.find((c) => Boolean(c && c.id === id));
  } catch (err) {
    console.error("findCourseById error:", err);
    return undefined;
  }
}

export async function findCourseBySlug(slug: string): Promise<Course | undefined> {
  try {
    const courses = await readCollection<Course>(COURSES_FILE);
    return courses.find((c) => Boolean(c && c.slug === slug));
  } catch (err) {
    console.error("findCourseBySlug error:", err);
    return undefined;
  }
}

async function updateCourse(id: string, patch: Partial<Course>): Promise<Course | null> {
  let updated: Course | null = null;
  await withCollection<Course>(COURSES_FILE, (courses) =>
    courses.map((c) => {
      if (!c || c.id !== id) return c;
      updated = { ...c, ...patch, updatedAt: new Date().toISOString() };
      return updated;
    })
  );
  return updated;
}

export async function submitCourseForReview(id: string): Promise<Course | null> {
  return updateCourse(id, { status: "pending-review", rejectionFeedback: null });
}

export async function approveCourse(id: string): Promise<Course | null> {
  return updateCourse(id, { status: "published", publishedAt: new Date().toISOString() });
}

export async function rejectCourse(id: string, feedback: string): Promise<Course | null> {
  return updateCourse(id, { status: "rejected", rejectionFeedback: feedback });
}

export async function updateCourseDetails(
  courseId: string,
  patch: {
    title: string;
    description: string;
    category: string;
    tags: string[];
    priceNaira: number;
    language: string;
    level: CourseLevel;
    passThresholdPercent: number;
    maxAttempts: number;
  }
): Promise<Course | null> {
  const { priceNaira, ...rest } = patch;
  return updateCourse(courseId, { ...rest, price: Math.round((Number(priceNaira) || 0) * 100) });
}

export async function updateCourseThumbnail(
  courseId: string,
  thumbnailUrl: string
): Promise<Course | null> {
  return updateCourse(courseId, { thumbnailUrl });
}

export async function deleteCourse(courseId: string): Promise<void> {
  await withCollection<Course>(COURSES_FILE, (courses) => courses.filter((c) => Boolean(c && c.id !== courseId)));
}

export async function deleteLessonsByCourse(courseId: string): Promise<void> {
  await withCollection<Lesson>(LESSONS_FILE, (lessons) =>
    lessons.filter((l) => Boolean(l && l.courseId !== courseId))
  );
}

export async function incrementEnrollmentCount(courseId: string): Promise<void> {
  const course = await findCourseById(courseId);
  if (!course) return;
  await updateCourse(courseId, { enrollmentCount: (Number(course.enrollmentCount) || 0) + 1 });
}

export async function updateCourseRatingStats(
  courseId: string,
  stats: { averageRating: number; reviewCount: number }
): Promise<void> {
  await updateCourse(courseId, stats);
}

export async function listLessonsByCourse(courseId: string): Promise<Lesson[]> {
  try {
    const lessons = await readCollection<Lesson>(LESSONS_FILE);
    return lessons
      .filter((l) => Boolean(l && l.courseId === courseId))
      .sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));
  } catch (err) {
    console.error("listLessonsByCourse error:", err);
    return [];
  }
}

export function describeCourseActivity(course: Course): { message: string; at: string } {
  if (!course) {
    return { message: "Course updated", at: new Date().toISOString() };
  }
  const title = course.title || "Course";
  switch (course.status) {
    case "published":
      return { message: `"${title}" was approved and published`, at: course.publishedAt || course.updatedAt || new Date().toISOString() };
    case "rejected":
      return { message: `"${title}" was rejected`, at: course.updatedAt || new Date().toISOString() };
    case "pending-review":
      return { message: `"${title}" was submitted for review`, at: course.updatedAt || new Date().toISOString() };
    default:
      return { message: `"${title}" was created as a draft`, at: course.createdAt || new Date().toISOString() };
  }
}

export async function addLesson(input: {
  courseId: string;
  title: string;
  type: LessonType;
  content: string;
  videoGuid?: string;
  videoDurationSeconds?: number;
  isPreview: boolean;
}): Promise<Lesson> {
  const existing = await listLessonsByCourse(input.courseId);
  const lesson: Lesson = {
    id: randomUUID(),
    courseId: input.courseId,
    title: input.title || "Untitled Lesson",
    order: existing.length,
    type: input.type,
    content: input.content || "",
    videoGuid: input.type === "video" ? (input.videoGuid ?? null) : null,
    videoDurationSeconds: input.type === "video" ? (input.videoDurationSeconds ?? null) : null,
    isPreview: Boolean(input.isPreview),
    createdAt: new Date().toISOString(),
  };

  await withCollection<Lesson>(LESSONS_FILE, (lessons) => [...lessons, lesson]);
  await updateCourse(input.courseId, { totalLessons: existing.length + 1 });
  return lesson;
}

export async function updateLesson(
  lessonId: string,
  patch: {
    title: string;
    type: LessonType;
    content: string;
    videoGuid?: string;
    videoDurationSeconds?: number;
    isPreview: boolean;
  }
): Promise<Lesson | null> {
  const all = await withCollection<Lesson>(LESSONS_FILE, (lessons) =>
    lessons.map((l) =>
      l && l.id === lessonId
        ? {
            ...l,
            title: patch.title,
            type: patch.type,
            content: patch.content,
            videoGuid: patch.type === "video" ? (patch.videoGuid ?? null) : null,
            videoDurationSeconds: patch.type === "video" ? (patch.videoDurationSeconds ?? null) : null,
            isPreview: patch.isPreview,
          }
        : l
    )
  );
  return all.find((l) => Boolean(l && l.id === lessonId)) ?? null;
}

export async function moveLesson(
  courseId: string,
  lessonId: string,
  direction: "up" | "down"
): Promise<void> {
  const lessons = await listLessonsByCourse(courseId);
  const index = lessons.findIndex((l) => l && l.id === lessonId);
  if (index === -1) return;

  const swapIndex = direction === "up" ? index - 1 : index + 1;
  if (swapIndex < 0 || swapIndex >= lessons.length) return;

  const current = lessons[index];
  const swapWith = lessons[swapIndex];

  await withCollection<Lesson>(LESSONS_FILE, (all) =>
    all.map((l) => {
      if (!l) return l;
      if (l.id === current.id) return { ...l, order: swapWith.order };
      if (l.id === swapWith.id) return { ...l, order: current.order };
      return l;
    })
  );
}
