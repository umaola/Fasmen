import "server-only";
import { readCollection, withCollection } from "./json-store";
import { findCourseById, type Course } from "./courses";

const WISHLISTS_FILE = "wishlists.json";

export interface WishlistItem {
  id: string; // ${studentId}_${courseId}
  studentId: string;
  courseId: string;
  addedAt: string;
}

function itemKey(studentId: string, courseId: string): string {
  return `${studentId}_${courseId}`;
}

export async function getStudentWishlist(studentId: string): Promise<WishlistItem[]> {
  const items = await readCollection<WishlistItem>(WISHLISTS_FILE);
  return items
    .filter((w) => w.studentId === studentId)
    .sort((a, b) => b.addedAt.localeCompare(a.addedAt));
}

export async function getStudentWishlistCourseIds(studentId: string): Promise<string[]> {
  const items = await getStudentWishlist(studentId);
  return items.map((i) => i.courseId);
}

export async function isCourseWishlisted(studentId: string, courseId: string): Promise<boolean> {
  const items = await readCollection<WishlistItem>(WISHLISTS_FILE);
  return items.some((w) => w.id === itemKey(studentId, courseId));
}

export async function toggleWishlist(
  studentId: string,
  courseId: string
): Promise<{ wishlisted: boolean }> {
  const key = itemKey(studentId, courseId);
  let wishlisted = false;

  await withCollection<WishlistItem>(WISHLISTS_FILE, (items) => {
    const exists = items.some((i) => i.id === key);
    if (exists) {
      wishlisted = false;
      return items.filter((i) => i.id !== key);
    } else {
      wishlisted = true;
      const newItem: WishlistItem = {
        id: key,
        studentId,
        courseId,
        addedAt: new Date().toISOString(),
      };
      return [...items, newItem];
    }
  });

  return { wishlisted };
}

export async function listWishlistedCourses(studentId: string): Promise<Course[]> {
  const items = await getStudentWishlist(studentId);
  const courses = await Promise.all(items.map((i) => findCourseById(i.courseId)));
  return courses.filter((c): c is Course => c !== undefined && c.status === "published");
}
