"use client";

import { useState } from "react";
import type { Lesson } from "@/lib/courses";
import { formatDuration } from "@/lib/format";
import { PlayIcon, BookIcon, ChevronDownIcon, ChevronUpIcon } from "@/components/icons";

export interface CurriculumLessonItem extends Lesson {
  embedUrl?: string | null;
}

export function CurriculumAccordion({
  lessons,
  libraryId,
}: {
  lessons: CurriculumLessonItem[];
  libraryId?: string;
}) {
  const [activePreviewId, setActivePreviewId] = useState<string | null>(null);

  if (!lessons || lessons.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-6 text-center text-xs text-neutral-600">
        No curriculum lessons published yet.
      </div>
    );
  }

  const videoLessons = lessons.filter((l) => l.type === "video");
  const readingLessons = lessons.filter((l) => l.type === "reading");

  return (
    <div className="space-y-4">
      {/* Curriculum Summary Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-neutral-600 pb-2">
        <span>
          {lessons.length} Lesson{lessons.length === 1 ? "" : "s"} ({videoLessons.length} Video{videoLessons.length === 1 ? "" : "s"}, {readingLessons.length} Reading{readingLessons.length === 1 ? "" : "s"})
        </span>
        <span className="text-neutral-500 font-medium">Self-Paced Progression</span>
      </div>

      {/* Lesson List */}
      <div className="divide-y divide-neutral-200/80 rounded-xl border border-neutral-200/80 bg-white overflow-hidden shadow-sm">
        {lessons.map((lesson, idx) => {
          const isOpen = activePreviewId === lesson.id;
          const isVideo = lesson.type === "video";
          const videoEmbedUrl =
            lesson.embedUrl ||
            (lesson.videoGuid && libraryId
              ? `https://iframe.mediadelivery.net/embed/${libraryId}/${lesson.videoGuid}`
              : null);

          return (
            <div key={lesson.id} className="transition-colors hover:bg-neutral-50/60">
              <div className="flex items-center justify-between p-4 gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-100 text-xs font-semibold text-neutral-700 shrink-0 font-mono">
                    {idx + 1}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-neutral-900 truncate">
                        {lesson.title}
                      </p>
                      {lesson.isPreview && (
                        <span className="rounded-full bg-[#e4f5ec] px-2 py-0.5 text-[10px] font-bold text-success-600 uppercase tracking-wider">
                          Free Preview
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-0.5 text-xs text-neutral-500">
                      {isVideo ? (
                        <span className="inline-flex items-center gap-1">
                          <PlayIcon className="h-3 w-3 text-primary-600" />
                          <span>Video</span>
                          {lesson.videoDurationSeconds ? (
                            <span>· {formatDuration(lesson.videoDurationSeconds)}</span>
                          ) : null}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1">
                          <BookIcon className="h-3 w-3 text-accent-600" />
                          <span>Reading Material</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Free Preview Toggle Button */}
                {lesson.isPreview ? (
                  <button
                    type="button"
                    onClick={() => setActivePreviewId(isOpen ? null : lesson.id)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-primary-600 px-3 py-1.5 text-xs font-semibold text-primary-700 hover:bg-primary-50 transition shrink-0 cursor-pointer"
                  >
                    <span>{isOpen ? "Close" : "Preview"}</span>
                    {isOpen ? (
                      <ChevronUpIcon className="h-3.5 w-3.5" />
                    ) : (
                      <ChevronDownIcon className="h-3.5 w-3.5" />
                    )}
                  </button>
                ) : (
                  <span className="text-xs text-neutral-400 font-medium shrink-0">
                    🔒 Locked
                  </span>
                )}
              </div>

              {/* Collapsible Preview Body */}
              {isOpen && lesson.isPreview && (
                <div className="border-t border-neutral-100 bg-neutral-50/80 p-4 sm:p-5">
                  {isVideo && videoEmbedUrl ? (
                    <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black shadow-md">
                      <iframe
                        src={videoEmbedUrl}
                        loading="lazy"
                        allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
                        allowFullScreen
                        className="h-full w-full border-0"
                      />
                    </div>
                  ) : null}

                  {lesson.content && (
                    <div className="mt-3 rounded-lg bg-white p-4 border border-neutral-200/80 text-xs sm:text-sm text-neutral-700 leading-relaxed whitespace-pre-line">
                      {lesson.content}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
