"use client";

import { useActionState, useState } from "react";
import { updateLessonAction } from "@/app/actions/courses";
import type { AddLessonState } from "@/lib/definitions";
import type { Lesson } from "@/lib/courses";
import { VideoUploadButton } from "@/components/VideoUploadButton";

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
  const [type, setType] = useState<"reading" | "video">(lesson.type);

  return (
    <form action={action} className="mt-3 flex flex-col gap-4 rounded-lg bg-neutral-100 p-5">
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
          defaultValue={lesson.title}
          className="mt-1 h-11 w-full rounded-sm border border-neutral-200 bg-white px-3 text-base outline-none focus:border-primary-500"
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
            defaultValue={lesson.type === "reading" ? lesson.content : ""}
            className="mt-1 w-full rounded-sm border border-neutral-200 bg-white px-3 py-2 text-base outline-none focus:border-primary-500"
          />
          {state?.errors?.content && (
            <p className="mt-1 text-sm text-error-600">{state.errors.content[0]}</p>
          )}
        </div>
      ) : (
        <>
          <div>
            <span className="block text-sm font-medium text-neutral-900">Video</span>
            <div className="mt-1">
              <VideoUploadButton courseId={courseId} defaultGuid={lesson.videoGuid} />
            </div>
            {state?.errors?.videoGuid && (
              <p className="mt-1 text-sm text-error-600">{state.errors.videoGuid[0]}</p>
            )}
          </div>
          <div>
            <label
              htmlFor={`lesson-video-duration-${lesson.id}`}
              className="block text-sm font-medium text-neutral-900"
            >
              Duration (seconds)
            </label>
            <input
              id={`lesson-video-duration-${lesson.id}`}
              name="videoDurationSeconds"
              type="number"
              min={1}
              defaultValue={lesson.videoDurationSeconds ?? undefined}
              className="mt-1 h-11 w-full rounded-sm border border-neutral-200 bg-white px-3 text-base outline-none focus:border-primary-500"
            />
            {state?.errors?.videoDurationSeconds && (
              <p className="mt-1 text-sm text-error-600">{state.errors.videoDurationSeconds[0]}</p>
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
              defaultValue={lesson.type === "video" ? lesson.content : ""}
              className="mt-1 w-full rounded-sm border border-neutral-200 bg-white px-3 py-2 text-base outline-none focus:border-primary-500"
            />
          </div>
        </>
      )}

      <label className="flex items-center gap-2 text-sm text-neutral-700">
        <input type="checkbox" name="isPreview" defaultChecked={lesson.isPreview} className="h-4 w-4" />
        Make this a free preview lesson
      </label>

      {state?.message && <p className="text-sm text-error-600">{state.message}</p>}
      {state?.success && <p className="text-sm text-success-600">Lesson saved.</p>}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={pending}
          className="h-10 rounded-md bg-primary-700 px-5 text-sm font-medium text-white transition hover:bg-primary-900 disabled:opacity-60"
        >
          {pending ? "Saving..." : "Save lesson"}
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
