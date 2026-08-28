import "server-only";
import { randomUUID } from "crypto";
import { readCollection, withCollection } from "./json-store";

const NOTES_FILE = "notes.json";

export interface StudentLessonNote {
  id: string;
  studentId: string;
  courseId: string;
  courseSlug: string;
  lessonId: string;
  lessonTitle: string;
  timestampSeconds: number | null;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export async function listNotesByStudentAndCourse(
  studentId: string,
  courseId: string
): Promise<StudentLessonNote[]> {
  const notes = await readCollection<StudentLessonNote>(NOTES_FILE);
  return notes
    .filter((n) => n.studentId === studentId && n.courseId === courseId)
    .sort((a, b) => {
      // Sort by lessonId, then timestampSeconds, then createdAt
      if (a.lessonId !== b.lessonId) return a.lessonId.localeCompare(b.lessonId);
      if (a.timestampSeconds !== null && b.timestampSeconds !== null) {
        return a.timestampSeconds - b.timestampSeconds;
      }
      return b.createdAt.localeCompare(a.createdAt);
    });
}

export async function listNotesByStudent(studentId: string): Promise<StudentLessonNote[]> {
  const notes = await readCollection<StudentLessonNote>(NOTES_FILE);
  return notes
    .filter((n) => n.studentId === studentId)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function saveLessonNote(input: {
  noteId?: string;
  studentId: string;
  courseId: string;
  courseSlug: string;
  lessonId: string;
  lessonTitle: string;
  timestampSeconds?: number | null;
  content: string;
}): Promise<StudentLessonNote> {
  const now = new Date().toISOString();
  let savedNote: StudentLessonNote;

  if (input.noteId) {
    let found = false;
    await withCollection<StudentLessonNote>(NOTES_FILE, (notes) =>
      notes.map((n) => {
        if (n.id === input.noteId && n.studentId === input.studentId) {
          found = true;
          savedNote = {
            ...n,
            content: input.content.trim(),
            timestampSeconds: input.timestampSeconds ?? n.timestampSeconds,
            lessonTitle: input.lessonTitle || n.lessonTitle,
            updatedAt: now,
          };
          return savedNote;
        }
        return n;
      })
    );
    if (found) return savedNote!;
  }

  const newNote: StudentLessonNote = {
    id: input.noteId || randomUUID(),
    studentId: input.studentId,
    courseId: input.courseId,
    courseSlug: input.courseSlug,
    lessonId: input.lessonId,
    lessonTitle: input.lessonTitle,
    timestampSeconds: input.timestampSeconds ?? null,
    content: input.content.trim(),
    createdAt: now,
    updatedAt: now,
  };

  await withCollection<StudentLessonNote>(NOTES_FILE, (notes) => [newNote, ...notes]);
  return newNote;
}

export async function deleteLessonNote(studentId: string, noteId: string): Promise<boolean> {
  let deleted = false;
  await withCollection<StudentLessonNote>(NOTES_FILE, (notes) => {
    const next = notes.filter((n) => !(n.id === noteId && n.studentId === studentId));
    if (next.length !== notes.length) deleted = true;
    return next;
  });
  return deleted;
}
