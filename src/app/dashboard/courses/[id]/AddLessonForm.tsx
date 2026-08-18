"use client";

import { useActionState, useState } from "react";
import { createLesson } from "@/app/actions/courses";
import type { AddLessonState } from "@/lib/definitions";
import { VideoUploadButton } from "@/components/VideoUploadButton";
import { FormAlert } from "@/components/FormAlert";

export function AddLessonForm({ courseId }: { courseId: string }) {
  const boundAction = createLesson.bind(null, courseId);
  const [state, action, pending] = useActionState<AddLessonState, FormData>(
    boundAction,
    undefined
  );

  const [title, setTitle] = useState("");
  const [type, setType] = useState<"reading" | "video">("reading");
  const [content, setContent] = useState("");
  const [videoDurationSeconds, setVideoDurationSeconds] = useState("");
  const [isPreview, setIsPreview] = useState(false);

  // Derived state pattern: reset inputs only after a successful addition
  const [handledSuccess, setHandledSuccess] = useState(false);
  if (state?.success && !handledSuccess) {
    setHandledSuccess(true);
    setTitle("");
    setContent("");
    setVideoDurationSeconds("");
    setIsPreview(false);
    setType("reading");
  } else if (!state?.success && handledSuccess) {
    setHandledSuccess(false);
  }

  return (
    <form action={action} className="mt-4 flex flex-col gap-4 rounded-lg bg-white p-5 shadow-[0_1px_3px_rgba(18,22,28,0.08)]">
      <FormAlert message={state?.message} />

      <div>
        <label htmlFor="lesson-title" className="block text-sm font-medium text-neutral-900">
          Lesson title
        </label>
        <input
          id="lesson-title"
          name="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          aria-invalid={!!state?.errors?.title}
          className={`mt-1 h-11 w-full rounded-sm border px-3 text-base outline-none transition focus:ring-1 ${
            state?.errors?.title
              ? "border-error-600 focus:border-error-600 focus:ring-error-600/30"
              : "border-neutral-200 focus:border-primary-500 focus:ring-primary-500/20"
          }`}
        />
        {state?.errors?.title && (
          <p className="mt-1 text-sm font-medium text-error-600">{state.errors.title[0]}</p>
        )}
      </div>

      <div>
        <span className="block text-sm font-medium text-neutral-900">Lesson type</span>
        <div className="mt-1 flex gap-4">
          <label className="flex items-center gap-2 text-sm text-neutral-700 cursor-pointer">
            <input
              type="radio"
              name="type"
              value="reading"
              checked={type === "reading"}
              onChange={() => setType("reading")}
            />
            Reading
          </label>
          <label className="flex items-center gap-2 text-sm text-neutral-700 cursor-pointer">
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
        {state?.errors?.type && <p className="mt-1 text-sm font-medium text-error-600">{state.errors.type[0]}</p>}
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
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Reading-based lesson content."
            aria-invalid={!!state?.errors?.content}
            className={`mt-1 w-full rounded-sm border px-3 py-2 text-base outline-none transition focus:ring-1 ${
              state?.errors?.content
                ? "border-error-600 focus:border-error-600 focus:ring-error-600/30"
                : "border-neutral-200 focus:border-primary-500 focus:ring-primary-500/20"
            }`}
          />
          {state?.errors?.content && (
            <p className="mt-1 text-sm font-medium text-error-600">{state.errors.content[0]}</p>
          )}
        </div>
      ) : (
        <>
          <div>
            <span className="block text-sm font-medium text-neutral-900">Video</span>
            <div className="mt-1">
              <VideoUploadButton courseId={courseId} />
            </div>
            {state?.errors?.videoGuid && (
              <p className="mt-1 text-sm font-medium text-error-600">{state.errors.videoGuid[0]}</p>
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
              value={videoDurationSeconds}
              onChange={(e) => setVideoDurationSeconds(e.target.value)}
              aria-invalid={!!state?.errors?.videoDurationSeconds}
              className={`mt-1 h-11 w-full rounded-sm border px-3 text-base outline-none transition focus:ring-1 ${
                state?.errors?.videoDurationSeconds
                  ? "border-error-600 focus:border-error-600 focus:ring-error-600/30"
                  : "border-neutral-200 focus:border-primary-500 focus:ring-primary-500/20"
              }`}
            />
            {state?.errors?.videoDurationSeconds && (
              <p className="mt-1 text-sm font-medium text-error-600">{state.errors.videoDurationSeconds[0]}</p>
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
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="mt-1 w-full rounded-sm border border-neutral-200 px-3 py-2 text-base outline-none focus:border-primary-500"
            />
          </div>
        </>
      )}

      <label className="flex items-center gap-2 text-sm text-neutral-700 cursor-pointer">
        <input
          type="checkbox"
          name="isPreview"
          checked={isPreview}
          onChange={(e) => setIsPreview(e.target.checked)}
          className="h-4 w-4 rounded text-primary-700"
        />
        Make this a free preview lesson
      </label>

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
