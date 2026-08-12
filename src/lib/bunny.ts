import "server-only";
import { createHash } from "crypto";

const API_BASE = "https://video.bunnycdn.com/library";
const TUS_ENDPOINT = "https://video.bunnycdn.com/tusupload";
const UPLOAD_AUTH_TTL_SECONDS = 60 * 60; // 1 hour — Bunny's own recommended minimum

export class BunnyError extends Error {}

function libraryId(): string {
  const id = process.env.BUNNY_STREAM_LIBRARY_ID;
  if (!id) throw new BunnyError("BUNNY_STREAM_LIBRARY_ID env var is required.");
  return id;
}

function apiKey(): string {
  const key = process.env.BUNNY_STREAM_API_KEY;
  if (!key) throw new BunnyError("BUNNY_STREAM_API_KEY env var is required.");
  return key;
}

// Creates the video "slot" in Bunny Stream — this doesn't upload the file
// itself, just registers a video object and returns its GUID, which the
// client then uploads the actual bytes to via TUS (see
// getBunnyUploadCredentials below).
export async function createBunnyVideo(title: string): Promise<{ guid: string }> {
  const res = await fetch(`${API_BASE}/${libraryId()}/videos`, {
    method: "POST",
    headers: {
      AccessKey: apiKey(),
      accept: "application/json",
      "content-type": "application/json",
    },
    body: JSON.stringify({ title }),
  });

  if (!res.ok) {
    throw new BunnyError(`Bunny Stream create-video failed: ${res.status} ${await res.text()}`);
  }

  const data = (await res.json()) as { guid: string };
  return { guid: data.guid };
}

export async function deleteBunnyVideo(guid: string): Promise<void> {
  const res = await fetch(`${API_BASE}/${libraryId()}/videos/${guid}`, {
    method: "DELETE",
    headers: { AccessKey: apiKey() },
  });

  if (!res.ok) {
    throw new BunnyError(`Bunny Stream delete-video failed: ${res.status} ${await res.text()}`);
  }
}

export interface BunnyUploadCredentials {
  endpoint: string;
  libraryId: string;
  videoId: string;
  authorizationSignature: string;
  authorizationExpire: number;
}

// Generates a short-lived, presigned signature so the browser can upload
// the video file directly to Bunny via TUS without ever seeing the API key.
// Algorithm per Bunny's docs: SHA256(libraryId + apiKey + expire + videoId),
// fields concatenated with no separator.
export function getBunnyUploadCredentials(videoGuid: string): BunnyUploadCredentials {
  const lib = libraryId();
  const key = apiKey();
  const authorizationExpire = Math.floor(Date.now() / 1000) + UPLOAD_AUTH_TTL_SECONDS;

  const authorizationSignature = createHash("sha256")
    .update(`${lib}${key}${authorizationExpire}${videoGuid}`)
    .digest("hex");

  return {
    endpoint: TUS_ENDPOINT,
    libraryId: lib,
    videoId: videoGuid,
    authorizationSignature,
    authorizationExpire,
  };
}

// Iframe embed URL — Bunny's hosted player, which handles adaptive-bitrate
// quality selection and the data-saver option out of the box (no custom
// player build needed to meet the TRD's streaming requirements).
export function getBunnyEmbedUrl(videoGuid: string): string {
  return `https://iframe.mediadelivery.net/embed/${libraryId()}/${videoGuid}`;
}
