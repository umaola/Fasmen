"use client";

import { useState } from "react";
import type { Lesson } from "@/lib/courses";
import { moveLessonAction } from "@/app/actions/courses";
import { ChevronUpIcon, ChevronDownIcon } from "@/components/icons";
import { EditLessonForm } from "./EditLessonForm";

export function LessonsList({
  courseId,
  lessons,
  editable,
}: {
  courseId: string;
  lessons: Lesson[];
  editable: boolean;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);

  if (lessons.length === 0) return null;

  return (
    <ul className="mt-4 flex flex-col gap-2">
      {lessons.map((lesson, index) => (
        <li
          key={lesson.id}
          className="rounded-md bg-white px-4 py-3 shadow-[0_1px_3px_rgba(18,22,28,0.08)]"
        >
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm text-neutral-900">
              {index + 1}. {lesson.title}
            </span>
            <div className="flex shrink-0 items-center gap-2">
              {lesson.isPreview && (
                <span className="rounded-full bg-primary-100 px-2 py-0.5 text-xs font-medium text-primary-700">
                  Free preview
                </span>
              )}
              {editable && (
                <>
                  <form action={moveLessonAction.bind(null, courseId, lesson.id, "up")}>
                    <button
                      type="submit"
                      disabled={index === 0}
                      aria-label="Move lesson up"
                      className="flex h-7 w-7 items-center justify-center rounded-md text-neutral-700 transition hover:bg-neutral-100 disabled:opacity-30"
                    >
                      <ChevronUpIcon className="h-4 w-4" />
                    </button>
                  </form>
                  <form action={moveLessonAction.bind(null, courseId, lesson.id, "down")}>
                    <button
                      type="submit"
                      disabled={index === lessons.length - 1}
                      aria-label="Move lesson down"
                      className="flex h-7 w-7 items-center justify-center rounded-md text-neutral-700 transition hover:bg-neutral-100 disabled:opacity-30"
                    >
                      <ChevronDownIcon className="h-4 w-4" />
                    </button>
                  </form>
                  <button
                    type="button"
                    onClick={() => setEditingId(editingId === lesson.id ? null : lesson.id)}
                    className="h-7 rounded-md border border-neutral-200 px-3 text-xs font-medium text-neutral-700 transition hover:bg-neutral-100"
                  >
                    {editingId === lesson.id ? "Close" : "Edit"}
                  </button>
                </>
              )}
            </div>
          </div>

          {editingId === lesson.id && (
            <EditLessonForm
              courseId={courseId}
              lesson={lesson}
              onDone={() => setEditingId(null)}
            />
          )}
        </li>
      ))}
    </ul>
  );
}
