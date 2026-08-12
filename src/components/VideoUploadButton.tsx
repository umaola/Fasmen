"use client";

import { useRef, useState } from "react";
import * as tus from "tus-js-client";

// Deliberately shows the tutor nothing about how/where the video is stored —
// just an upload button and a progress percentage. The resulting Bunny video
// GUID is written into a hidden `videoGuid` field so it rides along with the
// rest of the lesson form on submit.
export function VideoUploadButton({
  courseId,
  defaultGuid,
}: {
  courseId: string;
  defaultGuid?: string | null;
}) {
  const [guid, setGuid] = useState<string | null>(defaultGuid ?? null);
  const [status, setStatus] = useState<"idle" | "uploading" | "done" | "error">(
    defaultGuid ? "done" : "idle"
  );
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setStatus("uploading");
    setProgress(0);
    setError(null);

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
          retryDelays: [0, 1000, 3000, 5000],
          headers: {
            AuthorizationSignature: creds.authorizationSignature,
            AuthorizationExpire: String(creds.authorizationExpire),
            VideoId: creds.videoId,
            LibraryId: creds.libraryId,
          },
          metadata: {
            filetype: file.type,
            title: file.name,
          },
          onError: reject,
          onProgress: (bytesUploaded, bytesTotal) => {
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
      setError(err instanceof Error ? err.message : "Upload failed.");
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
        className="h-11 rounded-md border border-neutral-200 bg-white px-4 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100 disabled:opacity-60"
      >
        {status === "uploading"
          ? `Uploading... ${progress}%`
          : status === "done"
            ? "Replace video"
            : "Upload video"}
      </button>
      {status === "done" && <p className="mt-1 text-xs text-success-600">Video uploaded</p>}
      {status === "error" && error && <p className="mt-1 text-sm text-error-600">{error}</p>}
    </div>
  );
}
