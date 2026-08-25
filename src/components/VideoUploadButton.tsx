"use client";

import { useRef, useState } from "react";
import * as tus from "tus-js-client";

export function extractVideoDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    let resolved = false;
    const done = (val: number) => {
      if (!resolved) {
        resolved = true;
        resolve(val);
      }
    };

    // 3-second safety timeout so large files never hang before upload starts
    const timeout = setTimeout(() => {
      done(0);
    }, 3000);

    try {
      const video = document.createElement("video");
      video.preload = "metadata";
      const objectUrl = URL.createObjectURL(file);

      video.onloadedmetadata = () => {
        clearTimeout(timeout);
        URL.revokeObjectURL(objectUrl);
        const duration = Math.round(video.duration);
        done(Number.isFinite(duration) && duration > 0 ? duration : 0);
      };

      video.onerror = () => {
        clearTimeout(timeout);
        URL.revokeObjectURL(objectUrl);
        done(0);
      };

      video.src = objectUrl;
    } catch {
      clearTimeout(timeout);
      done(0);
    }
  });
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 MB";
  const mb = bytes / (1024 * 1024);
  if (mb < 1000) return `${mb.toFixed(1)} MB`;
  return `${(mb / 1024).toFixed(2)} GB`;
}

// Deliberately shows the tutor nothing about internal Bunny configuration —
// just an upload button, live progress bar, and chunked transfer. The resulting Bunny video
// GUID is written into a hidden `videoGuid` field so it rides along with the
// rest of the lesson form on submit.
export function VideoUploadButton({
  courseId,
  defaultGuid,
  onDurationChange,
}: {
  courseId: string;
  defaultGuid?: string | null;
  onDurationChange?: (durationSeconds: number) => void;
}) {
  const [guid, setGuid] = useState<string | null>(defaultGuid ?? null);
  const [status, setStatus] = useState<"idle" | "uploading" | "done" | "error">(
    defaultGuid ? "done" : "idle"
  );
  const [progress, setProgress] = useState(0);
  const [uploadedBytes, setUploadedBytes] = useState(0);
  const [totalBytes, setTotalBytes] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setStatus("uploading");
    setProgress(0);
    setUploadedBytes(0);
    setTotalBytes(file.size);
    setError(null);

    // Non-blocking duration extraction directly from the local file
    extractVideoDuration(file)
      .then((durationSeconds) => {
        if (durationSeconds > 0 && onDurationChange) {
          onDurationChange(durationSeconds);
        }
      })
      .catch(() => {});

    try {
      const res = await fetch("/api/bunny/upload-credentials", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ courseId, title: file.name }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.message ?? "Could not start the upload.");
      }
      const creds = await res.json();

      await new Promise<void>((resolve, reject) => {
        const upload = new tus.Upload(file, {
          endpoint: creds.endpoint,
          // 5MB chunk size — essential for Bunny Stream TUS resilience and large video stability
          chunkSize: 5 * 1024 * 1024,
          retryDelays: [0, 1000, 3000, 5000, 10000, 20000],
          headers: {
            AuthorizationSignature: creds.authorizationSignature,
            AuthorizationExpire: String(creds.authorizationExpire),
            VideoId: creds.videoId,
            LibraryId: creds.libraryId,
          },
          metadata: {
            filetype: file.type || "video/mp4",
            title: file.name,
          },
          onError: (err) => {
            console.error("TUS upload error:", err);
            reject(err);
          },
          onProgress: (bytesUploaded, bytesTotal) => {
            setUploadedBytes(bytesUploaded);
            setTotalBytes(bytesTotal);
            setProgress(Math.round((bytesUploaded / bytesTotal) * 100));
          },
          onSuccess: () => resolve(),
        });
        upload.start();
      });

      setGuid(creds.guid);
      setStatus("done");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Upload failed. Please try again.");
    }
  }

  return (
    <div>
      <input type="hidden" name="videoGuid" value={guid ?? ""} />
      <input
        ref={inputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={status === "uploading"}
        className="h-11 rounded-md border border-neutral-200 bg-white px-4 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100 disabled:opacity-60 cursor-pointer"
      >
        {status === "uploading"
          ? `Uploading... ${progress}%`
          : status === "done"
            ? "Replace video"
            : "Upload video"}
      </button>

      {/* Progress bar and byte indicator for large uploads */}
      {status === "uploading" && (
        <div className="mt-3 w-full max-w-md space-y-1.5">
          <div className="flex items-center justify-between text-xs text-neutral-700">
            <span className="font-semibold text-primary-900">Uploading: {progress}%</span>
            {totalBytes > 0 && (
              <span className="text-neutral-500 font-mono">
                {formatBytes(uploadedBytes)} / {formatBytes(totalBytes)}
              </span>
            )}
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-200">
            <div
              className="h-full bg-primary-700 transition-all duration-150 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-[11px] text-neutral-500">
            Chunked upload active (5MB chunks) — please keep this window open.
          </p>
        </div>
      )}

      {status === "done" && (
        <p className="mt-2 text-xs font-semibold text-success-600 flex items-center gap-1.5">
          <span>✓</span> Video uploaded successfully
        </p>
      )}

      {status === "error" && error && (
        <p className="mt-2 text-xs font-medium text-error-600">{error}</p>
      )}
    </div>
  );
}

