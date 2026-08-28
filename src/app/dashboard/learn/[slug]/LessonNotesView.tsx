"use client";

import { useState, useTransition } from "react";
import type { Lesson } from "@/lib/courses";
import type { StudentLessonNote } from "@/lib/notes";
import { saveLessonNoteAction, deleteLessonNoteAction } from "@/app/actions/notes";
import {
  ClockIcon,
  TrashIcon,
  DownloadIcon,
  PlusIcon,
  CheckIcon,
  DocumentTextIcon,
} from "@/components/icons";

interface LessonNotesViewProps {
  courseId: string;
  courseSlug: string;
  courseTitle: string;
  activeLesson: Lesson;
  initialNotes: StudentLessonNote[];
}

function formatSeconds(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

export function LessonNotesView({
  courseId,
  courseSlug,
  courseTitle,
  activeLesson,
  initialNotes,
}: LessonNotesViewProps) {
  const [notes, setNotes] = useState<StudentLessonNote[]>(initialNotes);
  const [content, setContent] = useState("");
  const [timestampInput, setTimestampInput] = useState("");
  const [includeTimestamp, setIncludeTimestamp] = useState(false);
  const [filterMode, setFilterMode] = useState<"current" | "all">("current");
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setErrorMsg("");
    setSuccessMsg("");

    let parsedSeconds: number | null = null;
    if (includeTimestamp && timestampInput.trim()) {
      const parts = timestampInput.trim().split(":");
      if (parts.length === 2) {
        const m = parseInt(parts[0], 10);
        const s = parseInt(parts[1], 10);
        if (!isNaN(m) && !isNaN(s)) {
          parsedSeconds = m * 60 + s;
        }
      } else {
        const s = parseInt(timestampInput.trim(), 10);
        if (!isNaN(s)) parsedSeconds = s;
      }
    }

    startTransition(async () => {
      const res = await saveLessonNoteAction({
        courseId,
        courseSlug,
        lessonId: activeLesson.id,
        lessonTitle: activeLesson.title,
        timestampSeconds: parsedSeconds,
        content: content.trim(),
      });

      if (res.success && res.note) {
        setNotes((prev) => [res.note!, ...prev]);
        setContent("");
        setTimestampInput("");
        setIncludeTimestamp(false);
        setSuccessMsg("Note saved successfully!");
        setTimeout(() => setSuccessMsg(""), 3000);
      } else {
        setErrorMsg(res.error || "Failed to save note.");
      }
    });
  };

  const handleDelete = (noteId: string) => {
    if (!confirm("Are you sure you want to delete this note?")) return;

    startTransition(async () => {
      const res = await deleteLessonNoteAction(noteId, courseSlug);
      if (res.success) {
        setNotes((prev) => prev.filter((n) => n.id !== noteId));
      }
    });
  };

  const exportNotesAsMarkdown = () => {
    const lines = [
      `# Study Notes: ${courseTitle}`,
      `Exported on ${new Date().toLocaleDateString("en-NG")}`,
      "",
      ...notes.map((n) => {
        const timeStr = n.timestampSeconds !== null ? ` [${formatSeconds(n.timestampSeconds)}]` : "";
        return `### ${n.lessonTitle}${timeStr}\n*Saved: ${new Date(n.createdAt).toLocaleDateString()}*\n\n${n.content}\n`;
      }),
    ];

    const blob = new Blob([lines.join("\n")], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${courseSlug}-study-notes.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredNotes =
    filterMode === "current"
      ? notes.filter((n) => n.lessonId === activeLesson.id)
      : notes;

  return (
    <div className="flex flex-col gap-6">
      {/* Note Creation Form */}
      <form
        onSubmit={handleAddNote}
        className="rounded-xl border border-neutral-200 bg-neutral-50/70 p-4 shadow-xs"
      >
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-bold text-primary-900 uppercase tracking-wide">
            Add Note for &ldquo;{activeLesson.title}&rdquo;
          </label>
          <button
            type="button"
            onClick={() => setIncludeTimestamp(!includeTimestamp)}
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition ${
              includeTimestamp
                ? "bg-primary-100 text-primary-800"
                : "bg-neutral-200/80 text-neutral-600 hover:bg-neutral-200"
            }`}
          >
            <ClockIcon className="h-3 w-3" />
            <span>{includeTimestamp ? "Timestamp Active" : "+ Add Timestamp"}</span>
          </button>
        </div>

        {includeTimestamp && (
          <div className="mb-2.5 flex items-center gap-2">
            <span className="text-xs text-neutral-600 font-medium">Time (MM:SS):</span>
            <input
              type="text"
              placeholder="e.g. 03:45"
              value={timestampInput}
              onChange={(e) => setTimestampInput(e.target.value)}
              className="w-24 rounded-lg border border-neutral-300 bg-white px-2.5 py-1 text-xs text-neutral-900 focus:border-primary-500 focus:outline-none"
            />
          </div>
        )}

        <textarea
          rows={3}
          placeholder="Type key insights, personal summaries, or reminders..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full rounded-xl border border-neutral-300 bg-white p-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary-600 focus:outline-none focus:ring-1 focus:ring-primary-600"
        />

        {errorMsg && <p className="mt-1.5 text-xs text-rose-600 font-medium">{errorMsg}</p>}
        {successMsg && (
          <p className="mt-1.5 inline-flex items-center gap-1 text-xs text-emerald-600 font-medium">
            <CheckIcon className="h-3.5 w-3.5" />
            <span>{successMsg}</span>
          </p>
        )}

        <div className="mt-3 flex items-center justify-between">
          <span className="text-[11px] text-neutral-500">
            Notes are synced privately to your student profile.
          </span>
          <button
            type="submit"
            disabled={isPending || !content.trim()}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary-900 px-4 text-xs font-semibold text-white shadow-xs transition hover:bg-primary-800 disabled:opacity-50"
          >
            <PlusIcon className="h-3.5 w-3.5" />
            <span>{isPending ? "Saving..." : "Save Note"}</span>
          </button>
        </div>
      </form>

      {/* Filter and Export Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 pb-3">
        <div className="flex items-center gap-1 rounded-lg bg-neutral-100 p-0.5 text-xs">
          <button
            type="button"
            onClick={() => setFilterMode("current")}
            className={`rounded-md px-3 py-1.5 font-medium transition ${
              filterMode === "current"
                ? "bg-white text-primary-900 shadow-xs"
                : "text-neutral-600 hover:text-neutral-900"
            }`}
          >
            This Lesson ({notes.filter((n) => n.lessonId === activeLesson.id).length})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode("all")}
            className={`rounded-md px-3 py-1.5 font-medium transition ${
              filterMode === "all"
                ? "bg-white text-primary-900 shadow-xs"
                : "text-neutral-600 hover:text-neutral-900"
            }`}
          >
            All Course Notes ({notes.length})
          </button>
        </div>

        {notes.length > 0 && (
          <button
            type="button"
            onClick={exportNotesAsMarkdown}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-neutral-300 bg-white px-3 text-xs font-medium text-neutral-700 shadow-2xs transition hover:bg-neutral-50"
          >
            <DownloadIcon className="h-3.5 w-3.5" />
            <span>Export Markdown</span>
          </button>
        )}
      </div>

      {/* Notes List */}
      {filteredNotes.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-neutral-200 bg-white p-8 text-center">
          <DocumentTextIcon className="h-8 w-8 text-neutral-300" />
          <p className="mt-2 text-xs font-medium text-neutral-600">
            {filterMode === "current"
              ? "No notes saved for this lesson yet."
              : "You haven't written any notes for this course yet."}
          </p>
          <p className="text-[11px] text-neutral-400">
            Use the form above to jot down key points as you learn.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotes.map((note) => (
            <div
              key={note.id}
              className="group relative rounded-xl border border-neutral-200 bg-white p-4 shadow-xs transition hover:border-neutral-300"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-primary-900">
                    {note.lessonTitle}
                  </span>
                  {note.timestampSeconds !== null && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary-50 px-2 py-0.5 font-mono text-[11px] font-medium text-primary-700">
                      <ClockIcon className="h-3 w-3" />
                      {formatSeconds(note.timestampSeconds)}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-neutral-400">
                    {new Date(note.createdAt).toLocaleDateString("en-NG", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDelete(note.id)}
                    title="Delete Note"
                    className="rounded p-1 text-neutral-400 opacity-0 transition group-hover:opacity-100 hover:bg-rose-50 hover:text-rose-600"
                  >
                    <TrashIcon className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <p className="mt-2.5 whitespace-pre-line text-xs text-neutral-700 leading-relaxed">
                {note.content}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
