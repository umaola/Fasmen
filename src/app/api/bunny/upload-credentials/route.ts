import { NextResponse } from "next/server";
import { requireCourseOwner } from "@/app/actions/courses";
import { createBunnyVideo, getBunnyUploadCredentials, BunnyError } from "@/lib/bunny";

// Called by the browser before a video upload starts. Verifies the caller
// owns the course (so a tutor can't rack up storage on someone else's
// account), registers the video with Bunny, and hands back a short-lived
// presigned signature so the actual file bytes go straight from the
// browser to Bunny — this route never sees the video file itself.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const courseId = body?.courseId;
  const title = body?.title;

  if (typeof courseId !== "string" || typeof title !== "string" || !title.trim()) {
    return NextResponse.json({ message: "Missing courseId or title." }, { status: 400 });
  }

  const course = await requireCourseOwner(courseId);
  if (!course) {
    return NextResponse.json(
      { message: "You don't have access to this course." },
      { status: 403 }
    );
  }

  try {
    const { guid } = await createBunnyVideo(title.trim());
    const credentials = getBunnyUploadCredentials(guid);
    return NextResponse.json({ guid, ...credentials });
  } catch (err) {
    if (err instanceof BunnyError) {
      return NextResponse.json({ message: err.message }, { status: 502 });
    }
    throw err;
  }
}
