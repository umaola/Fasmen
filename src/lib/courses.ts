import "server-only";
import { randomUUID } from "crypto";
import { readCollection, withCollection } from "./json-store";

const COURSES_FILE = "courses.json";
const LESSONS_FILE = "lessons.json";

export type CourseStatus = "draft" | "pending-review" | "published" | "rejected";
export type CourseLevel = "beginner" | "intermediate" | "advanced";

// Mirrors courses/{courseId} from firestore-schema.md. videoAssetId / CDN
// fields are omitted for now — no video CDN is wired up yet, so lessons are
// reading-only until that integration lands.
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

// Every video lesson plays this one public-domain sample clip regardless of
// the stored videoUrl, until a real video CDN is wired up.
export const DUMMY_VIDEO_SRC =
  "https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";

// Mirrors courses/{courseId}/lessons/{lessonId}. videoUrl is stored/displayed
// as if it were the real CDN link, but playback uses one shared sample clip
// until a real video CDN is wired up (see courses/[slug]/page.tsx).
export interface Lesson {
  id: string;
  courseId: string;
  title: string;
  order: number;
  type: LessonType;
  content: string;
  videoUrl: string | null;
  videoDurationSeconds: number | null;
  isPreview: boolean;
  createdAt: string;
}

function slugify(title: string): string {
  return title
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
  while (courses.some((c) => c.slug === candidate)) {
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
    title: input.title,
    slug: await uniqueSlug(input.title),
    description: input.description,
    tutorId: input.tutorId,
    tutorName: input.tutorName,
    category: input.category,
    tags: input.tags,
    price: Math.round(input.priceNaira * 100),
    currency: "NGN",
    status: "draft",
    language: input.language,
    level: input.level,
    thumbnailUrl: null,
    totalLessons: 0,
    enrollmentCount: 0,
    averageRating: 0,
    reviewCount: 0,
    passThresholdPercent: input.passThresholdPercent,
    maxAttempts: input.maxAttempts,
    rejectionFeedback: null,
    createdAt: now,
    updatedAt: now,
    publishedAt: null,
  };

  await withCollection<Course>(COURSES_FILE, (courses) => [...courses, course]);
  return course;
}

export async function listCoursesByTutor(tutorId: string): Promise<Course[]> {
  const courses = await readCollection<Course>(COURSES_FILE);
  return courses
    .filter((c) => c.tutorId === tutorId)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function listPublishedCourses(filters?: {
  category?: string;
  search?: string;
}): Promise<Course[]> {
  const courses = await readCollection<Course>(COURSES_FILE);
  const search = filters?.search?.trim().toLowerCase();

  return courses
    .filter((c) => c.status === "published")
    .filter((c) => !filters?.category || c.category === filters.category)
    .filter(
      (c) =>
        !search ||
        c.title.toLowerCase().includes(search) ||
        c.tags.some((tag) => tag.toLowerCase().includes(search))
    )
    .sort((a, b) => b.enrollmentCount - a.enrollmentCount);
}

export async function listPendingReviewCourses(): Promise<Course[]> {
  const courses = await readCollection<Course>(COURSES_FILE);
  return courses
    .filter((c) => c.status === "pending-review")
    .sort((a, b) => a.updatedAt.localeCompare(b.updatedAt));
}

export async function findCourseById(id: string): Promise<Course | undefined> {
  const courses = await readCollection<Course>(COURSES_FILE);
  return courses.find((c) => c.id === id);
}

export async function findCourseBySlug(slug: string): Promise<Course | undefined> {
  const courses = await readCollection<Course>(COURSES_FILE);
  return courses.find((c) => c.slug === slug);
}

async function updateCourse(id: string, patch: Partial<Course>): Promise<Course | null> {
  let updated: Course | null = null;
  await withCollection<Course>(COURSES_FILE, (courses) =>
    courses.map((c) => {
      if (c.id !== id) return c;
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
  return updateCourse(courseId, { ...rest, price: Math.round(priceNaira * 100) });
}

export async function updateCourseThumbnail(
  courseId: string,
  thumbnailUrl: string
): Promise<Course | null> {
  return updateCourse(courseId, { thumbnailUrl });
}

export async function deleteCourse(courseId: string): Promise<void> {
  await withCollection<Course>(COURSES_FILE, (courses) => courses.filter((c) => c.id !== courseId));
}

export async function deleteLessonsByCourse(courseId: string): Promise<void> {
  await withCollection<Lesson>(LESSONS_FILE, (lessons) =>
    lessons.filter((l) => l.courseId !== courseId)
  );
}

export async function incrementEnrollmentCount(courseId: string): Promise<void> {
  const course = await findCourseById(courseId);
  if (!course) return;
  await updateCourse(courseId, { enrollmentCount: course.enrollmentCount + 1 });
}

export async function updateCourseRatingStats(
  courseId: string,
  stats: { averageRating: number; reviewCount: number }
): Promise<void> {
  await updateCourse(courseId, stats);
}

export async function listLessonsByCourse(courseId: string): Promise<Lesson[]> {
  const lessons = await readCollection<Lesson>(LESSONS_FILE);
  return lessons.filter((l) => l.courseId === courseId).sort((a, b) => a.order - b.order);
}

// There's no dedicated activity/event log yet, so this derives one entry per
// course from its current status — a reasonable proxy until real history
// (submission events, lesson adds, etc.) gets its own log.
export function describeCourseActivity(course: Course): { message: string; at: string } {
  switch (course.status) {
    case "published":
      return { message: `"${course.title}" was approved and published`, at: course.publishedAt! };
    case "rejected":
      return { message: `"${course.title}" was rejected`, at: course.updatedAt };
    case "pending-review":
      return { message: `"${course.title}" was submitted for review`, at: course.updatedAt };
    default:
      return { message: `"${course.title}" was created as a draft`, at: course.createdAt };
  }
}

export async function addLesson(input: {
  courseId: string;
  title: string;
  type: LessonType;
  content: string;
  videoUrl?: string;
  videoDurationSeconds?: number;
  isPreview: boolean;
}): Promise<Lesson> {
  const existing = await listLessonsByCourse(input.courseId);
  const lesson: Lesson = {
    id: randomUUID(),
    courseId: input.courseId,
    title: input.title,
    order: existing.length,
    type: input.type,
    content: input.content,
    videoUrl: input.type === "video" ? (input.videoUrl ?? null) : null,
    videoDurationSeconds: input.type === "video" ? (input.videoDurationSeconds ?? null) : null,
    isPreview: input.isPreview,
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
    videoUrl?: string;
    videoDurationSeconds?: number;
    isPreview: boolean;
  }
): Promise<Lesson | null> {
  const all = await withCollection<Lesson>(LESSONS_FILE, (lessons) =>
    lessons.map((l) =>
      l.id === lessonId
        ? {
            ...l,
            title: patch.title,
            type: patch.type,
            content: patch.content,
            videoUrl: patch.type === "video" ? (patch.videoUrl ?? null) : null,
            videoDurationSeconds: patch.type === "video" ? (patch.videoDurationSeconds ?? null) : null,
            isPreview: patch.isPreview,
          }
        : l
    )
  );
  return all.find((l) => l.id === lessonId) ?? null;
}

// Swaps `order` with the adjacent lesson — simpler and less error-prone than
// renumbering the whole list for a single-step move.
export async function moveLesson(
  courseId: string,
  lessonId: string,
  direction: "up" | "down"
): Promise<void> {
  const lessons = await listLessonsByCourse(courseId);
  const index = lessons.findIndex((l) => l.id === lessonId);
  if (index === -1) return;

  const swapIndex = direction === "up" ? index - 1 : index + 1;
  if (swapIndex < 0 || swapIndex >= lessons.length) return;

  const current = lessons[index];
  const swapWith = lessons[swapIndex];

  await withCollection<Lesson>(LESSONS_FILE, (all) =>
    all.map((l) => {
      if (l.id === current.id) return { ...l, order: swapWith.order };
      if (l.id === swapWith.id) return { ...l, order: current.order };
      return l;
    })
  );
}
