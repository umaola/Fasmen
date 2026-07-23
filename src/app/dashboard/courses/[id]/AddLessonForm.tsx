"use client";

import { useActionState, useState } from "react";
import { createLesson } from "@/app/actions/courses";
import type { AddLessonState } from "@/lib/definitions";

export function AddLessonForm({ courseId }: { courseId: string }) {
  const boundAction = createLesson.bind(null, courseId);
  const [state, action, pending] = useActionState<AddLessonState, FormData>(
    boundAction,
    undefined
  );
  const [type, setType] = useState<"reading" | "video">("reading");

  return (
    <form action={action} className="mt-4 flex flex-col gap-4 rounded-lg bg-white p-5">
      <div>
        <label htmlFor="lesson-title" className="block text-sm font-medium text-neutral-900">
          Lesson title
        </label>
        <input
          id="lesson-title"
          name="title"
          type="text"
          className="mt-1 h-11 w-full rounded-sm border border-neutral-200 px-3 text-base outline-none focus:border-primary-500"
        />
        {state?.errors?.title && (
          <p className="mt-1 text-sm text-error-600">{state.errors.title[0]}</p>
        )}
      </div>

      <div>
        <span className="block text-sm font-medium text-neutral-900">Lesson type</span>
        <div className="mt-1 flex gap-4">
          <label className="flex items-center gap-2 text-sm text-neutral-700">
            <input
              type="radio"
              name="type"
              value="reading"
              checked={type === "reading"}
              onChange={() => setType("reading")}
            />
            Reading
          </label>
          <label className="flex items-center gap-2 text-sm text-neutral-700">
            <input
              type="radio"
              name="type"
              value="video"
              checked={type === "video"}
              onChange={() => setType("video")}
            />
            Video
          </label>
        </div>
        {state?.errors?.type && <p className="mt-1 text-sm text-error-600">{state.errors.type[0]}</p>}
      </div>

      {type === "reading" ? (
        <div>
          <label htmlFor="lesson-content" className="block text-sm font-medium text-neutral-900">
            Content
          </label>
          <textarea
            id="lesson-content"
            name="content"
            rows={4}
            placeholder="Reading-based lesson content."
            className="mt-1 w-full rounded-sm border border-neutral-200 px-3 py-2 text-base outline-none focus:border-primary-500"
          />
          {state?.errors?.content && (
            <p className="mt-1 text-sm text-error-600">{state.errors.content[0]}</p>
          )}
        </div>
      ) : (
        <>
          <div>
            <label htmlFor="lesson-video-url" className="block text-sm font-medium text-neutral-900">
              Video URL
            </label>
            <input
              id="lesson-video-url"
              name="videoUrl"
              type="text"
              placeholder="https://cdn.example.com/lesson-1.mp4"
              className="mt-1 h-11 w-full rounded-sm border border-neutral-200 px-3 text-base outline-none focus:border-primary-500"
            />
            <p className="mt-1 text-xs text-neutral-400">
              No video CDN is wired up yet — every video lesson plays the same sample clip in the
              meantime, but the URL you enter here is stored as the record.
            </p>
            {state?.errors?.videoUrl && (
              <p className="mt-1 text-sm text-error-600">{state.errors.videoUrl[0]}</p>
            )}
          </div>
          <div>
            <label
              htmlFor="lesson-video-duration"
              className="block text-sm font-medium text-neutral-900"
            >
              Duration (seconds)
            </label>
            <input
              id="lesson-video-duration"
              name="videoDurationSeconds"
              type="number"
              min={1}
              className="mt-1 h-11 w-full rounded-sm border border-neutral-200 px-3 text-base outline-none focus:border-primary-500"
            />
            {state?.errors?.videoDurationSeconds && (
              <p className="mt-1 text-sm text-error-600">{state.errors.videoDurationSeconds[0]}</p>
            )}
          </div>
          <div>
            <label htmlFor="lesson-caption" className="block text-sm font-medium text-neutral-900">
              Caption / description (optional)
            </label>
            <textarea
              id="lesson-caption"
              name="content"
              rows={3}
              className="mt-1 w-full rounded-sm border border-neutral-200 px-3 py-2 text-base outline-none focus:border-primary-500"
            />
          </div>
        </>
      )}

      <label className="flex items-center gap-2 text-sm text-neutral-700">
        <input type="checkbox" name="isPreview" className="h-4 w-4" />
        Make this a free preview lesson
      </label>

      {state?.message && <p className="text-sm text-error-600">{state.message}</p>}

      <button
        type="submit"
        disabled={pending}
        className="h-11 rounded-md border border-primary-700 font-medium text-primary-700 transition hover:bg-primary-100 disabled:opacity-60"
      >
        {pending ? "Adding..." : "Add lesson"}
      </button>
    </form>
  );
}
