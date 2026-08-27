"use client";

import { useActionState, useState } from "react";
import { updateLessonAction } from "@/app/actions/courses";
import type { AddLessonState } from "@/lib/definitions";
import type { Lesson } from "@/lib/courses";
import { VideoUploadButton } from "@/components/VideoUploadButton";
import { FormAlert } from "@/components/FormAlert";
import { formatDuration } from "@/lib/format";

export function EditLessonForm({
  courseId,
  lesson,
  onDone,
}: {
  courseId: string;
  lesson: Lesson;
  onDone: () => void;
}) {
  const boundAction = updateLessonAction.bind(null, courseId, lesson.id);
  const [state, action, pending] = useActionState<AddLessonState, FormData>(
    boundAction,
    undefined
  );
  const [title, setTitle] = useState(lesson.title);
  const [type, setType] = useState<"reading" | "video">(lesson.type);
  const [content, setContent] = useState(lesson.content);
  const [videoDurationSeconds, setVideoDurationSeconds] = useState(
    lesson.videoDurationSeconds ? String(lesson.videoDurationSeconds) : ""
  );
  const [isPreview, setIsPreview] = useState(lesson.isPreview);

  return (
    <form action={action} className="mt-3 flex flex-col gap-4 rounded-lg bg-neutral-100 p-5">
      <FormAlert message={state?.message} />
      {state?.success && <FormAlert type="success" message="Lesson saved." />}

      <div>
        <label
          htmlFor={`lesson-title-${lesson.id}`}
          className="block text-sm font-medium text-neutral-900"
        >
          Lesson title
        </label>
        <input
          id={`lesson-title-${lesson.id}`}
          name="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          aria-invalid={!!state?.errors?.title}
          className={`mt-1 h-11 w-full rounded-sm border bg-white px-3 text-base outline-none transition focus:ring-1 ${
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
          <label
            htmlFor={`lesson-content-${lesson.id}`}
            className="block text-sm font-medium text-neutral-900"
          >
            Content
          </label>
          <textarea
            id={`lesson-content-${lesson.id}`}
            name="content"
            rows={4}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            aria-invalid={!!state?.errors?.content}
            className={`mt-1 w-full rounded-sm border bg-white px-3 py-2 text-base outline-none transition focus:ring-1 ${
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
              <VideoUploadButton
                courseId={courseId}
                defaultGuid={lesson.videoGuid}
                onDurationChange={(seconds) => setVideoDurationSeconds(String(seconds))}
              />
            </div>
            {state?.errors?.videoGuid && (
              <p className="mt-1 text-sm font-medium text-error-600">{state.errors.videoGuid[0]}</p>
            )}
          </div>
          <div>
            <label
              htmlFor={`lesson-video-duration-${lesson.id}`}
              className="block text-sm font-medium text-neutral-900"
            >
              Duration
            </label>
            <input
              type="hidden"
              id={`lesson-video-duration-${lesson.id}`}
              name="videoDurationSeconds"
              value={videoDurationSeconds}
            />
            <div
              className={`mt-1 flex h-11 w-full items-center justify-between rounded-sm border px-3 text-sm transition ${
                state?.errors?.videoDurationSeconds
                  ? "border-error-600 bg-error-50 text-error-900"
                  : "border-neutral-200 bg-white text-neutral-700"
              }`}
            >
              <span className={videoDurationSeconds ? "font-medium text-neutral-900" : "text-neutral-500"}>
                {videoDurationSeconds
                  ? `${formatDuration(Number(videoDurationSeconds))} (${videoDurationSeconds}s)`
                  : "Auto-detected when you upload a video"}
              </span>
              {videoDurationSeconds ? (
                <span className="inline-flex items-center rounded-full bg-success-600/10 px-2 py-0.5 text-xs font-medium text-success-700">
                  ✓ Auto-calculated
                </span>
              ) : (
                <span className="text-xs text-neutral-400">Read-only (auto-calculated)</span>
              )}
            </div>
            {state?.errors?.videoDurationSeconds && (
              <p className="mt-1 text-sm font-medium text-error-600">{state.errors.videoDurationSeconds[0]}</p>
            )}
          </div>
          <div>
            <label
              htmlFor={`lesson-caption-${lesson.id}`}
              className="block text-sm font-medium text-neutral-900"
            >
              Caption / description (optional)
            </label>
            <textarea
              id={`lesson-caption-${lesson.id}`}
              name="content"
              rows={3}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="mt-1 w-full rounded-sm border border-neutral-200 bg-white px-3 py-2 text-base outline-none focus:border-primary-500"
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

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={pending}
          className="h-10 rounded-md bg-primary-700 px-5 text-sm font-medium text-white transition hover:bg-primary-900 disabled:opacity-60"
        >
          {pending ? "Saving..." : "Save"}
        </button>
        <button
          type="button"
          onClick={onDone}
          className="h-10 rounded-md border border-neutral-200 bg-white px-5 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
