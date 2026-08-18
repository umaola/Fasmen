"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  CreateCourseFormSchema,
  AddLessonFormSchema,
  RejectCourseFormSchema,
  type CreateCourseState,
  type AddLessonState,
  type RejectCourseState,
  type ImageUploadState,
} from "@/lib/definitions";
import { getCurrentUser } from "@/lib/dal";
import { requireRole } from "@/lib/authz";
import {
  createCourseDraft,
  submitCourseForReview,
  approveCourse,
  rejectCourse,
  addLesson,
  updateLesson,
  moveLesson,
  findCourseById,
  updateCourseDetails,
  updateCourseThumbnail,
  deleteCourse,
  deleteLessonsByCourse,
} from "@/lib/courses";
import { deleteQuestionsByCourse } from "@/lib/assessments";
import { saveUploadedImage, UploadError } from "@/lib/uploads";

export async function createCourse(
  _state: CreateCourseState,
  formData: FormData
): Promise<CreateCourseState> {
  const user = await requireRole("tutor");
  if (!user) {
    return { message: "Only tutor accounts can create courses." };
  }
  if (!user.tutorProfile?.verified) {
    return { message: "You must complete tutor registration before creating a course." };
  }

  const validatedFields = CreateCourseFormSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    category: formData.get("category"),
    tags: formData.get("tags"),
    priceNaira: formData.get("priceNaira"),
    language: formData.get("language"),
    level: formData.get("level"),
    passThresholdPercent: formData.get("passThresholdPercent"),
    maxAttempts: formData.get("maxAttempts"),
  });

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }

  const { tags, ...rest } = validatedFields.data;

  const course = await createCourseDraft({
    ...rest,
    tutorId: user.id,
    tutorName: user.displayName,
    tags: tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean),
  });

  redirect(`/dashboard/courses/${course.id}`);
}

export async function editCourse(
  courseId: string,
  _state: CreateCourseState,
  formData: FormData
): Promise<CreateCourseState> {
  const course = await requireCourseOwner(courseId);
  if (!course) {
    return { message: "You don't have access to this course." };
  }

  const validatedFields = CreateCourseFormSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    category: formData.get("category"),
    tags: formData.get("tags"),
    priceNaira: formData.get("priceNaira"),
    language: formData.get("language"),
    level: formData.get("level"),
    passThresholdPercent: formData.get("passThresholdPercent"),
    maxAttempts: formData.get("maxAttempts"),
  });

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }

  const { tags, ...rest } = validatedFields.data;
  await updateCourseDetails(courseId, {
    ...rest,
    tags: tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean),
  });

  revalidatePath(`/dashboard/courses/${courseId}`);
  revalidatePath("/dashboard/courses");
  revalidatePath(`/courses/${course.slug}`);
  return { success: true };
}

export async function uploadCourseThumbnailAction(
  courseId: string,
  _state: ImageUploadState,
  formData: FormData
): Promise<ImageUploadState> {
  const course = await requireCourseOwner(courseId);
  if (!course) {
    return { message: "You don't have access to this course." };
  }

  const file = formData.get("thumbnail");
  if (!(file instanceof File)) {
    return { message: "Choose an image file." };
  }

  try {
    const thumbnailUrl = await saveUploadedImage(file, "courses");
    await updateCourseThumbnail(courseId, thumbnailUrl);
  } catch (err) {
    if (err instanceof UploadError) {
      return { message: err.message };
    }
    throw err;
  }

  revalidatePath(`/dashboard/courses/${courseId}`);
  revalidatePath("/dashboard/courses");
  revalidatePath(`/courses/${course.slug}`);
  revalidatePath("/courses");
  return { success: true };
}

export async function deleteCourseAction(courseId: string): Promise<void> {
  const course = await requireCourseOwner(courseId);
  if (!course) return;
  if (course.enrollmentCount > 0) return;

  await deleteCourse(courseId);
  await deleteLessonsByCourse(courseId);
  await deleteQuestionsByCourse(courseId);

  revalidatePath("/dashboard/courses");
  redirect("/dashboard/courses");
}

export async function requireCourseOwner(courseId: string) {
  const user = await getCurrentUser();
  const course = await findCourseById(courseId);
  if (!user || !course || course.tutorId !== user.id) {
    return null;
  }
  return course;
}

export async function submitForReview(courseId: string): Promise<void> {
  const course = await requireCourseOwner(courseId);
  if (!course) return;

  const user = await getCurrentUser();
  if (!user?.tutorProfile?.verified) return;

  await submitCourseForReview(courseId);
  revalidatePath(`/dashboard/courses/${courseId}`);
  revalidatePath("/dashboard/courses");
}

export async function createLesson(
  courseId: string,
  _state: AddLessonState,
  formData: FormData
): Promise<AddLessonState> {
  const course = await requireCourseOwner(courseId);
  if (!course) {
    return { message: "You don't have access to this course." };
  }

  const validatedFields = AddLessonFormSchema.safeParse({
    title: formData.get("title"),
    type: formData.get("type"),
    content: formData.get("content"),
    videoGuid: formData.get("videoGuid") ?? undefined,
    videoDurationSeconds: formData.get("videoDurationSeconds") || undefined,
    isPreview: formData.get("isPreview") ?? undefined,
  });

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }

  const { title, type, content, videoGuid, videoDurationSeconds, isPreview } = validatedFields.data;
  await addLesson({
    courseId,
    title,
    type,
    content,
    videoGuid,
    videoDurationSeconds,
    isPreview: isPreview === "on",
  });
  revalidatePath(`/dashboard/courses/${courseId}`);
  return { success: true };
}

export async function updateLessonAction(
  courseId: string,
  lessonId: string,
  _state: AddLessonState,
  formData: FormData
): Promise<AddLessonState> {
  const course = await requireCourseOwner(courseId);
  if (!course) {
    return { message: "You don't have access to this course." };
  }

  const validatedFields = AddLessonFormSchema.safeParse({
    title: formData.get("title"),
    type: formData.get("type"),
    content: formData.get("content"),
    videoGuid: formData.get("videoGuid") ?? undefined,
    videoDurationSeconds: formData.get("videoDurationSeconds") || undefined,
    isPreview: formData.get("isPreview") ?? undefined,
  });

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }

  const { title, type, content, videoGuid, videoDurationSeconds, isPreview } = validatedFields.data;
  await updateLesson(lessonId, {
    title,
    type,
    content,
    videoGuid,
    videoDurationSeconds,
    isPreview: isPreview === "on",
  });
  revalidatePath(`/dashboard/courses/${courseId}`);
  return { success: true };
}

export async function moveLessonAction(
  courseId: string,
  lessonId: string,
  direction: "up" | "down"
): Promise<void> {
  const course = await requireCourseOwner(courseId);
  if (!course) return;

  await moveLesson(courseId, lessonId, direction);
  revalidatePath(`/dashboard/courses/${courseId}`);
}

export async function approveCourseAction(courseId: string): Promise<void> {
  if (!(await requireRole("admin"))) return;
  await approveCourse(courseId);
  revalidatePath("/dashboard/admin/review");
  revalidatePath("/courses");
}

export async function rejectCourseAction(
  courseId: string,
  _state: RejectCourseState,
  formData: FormData
): Promise<RejectCourseState> {
  if (!(await requireRole("admin"))) {
    return { message: "Admin access required." };
  }

  const validatedFields = RejectCourseFormSchema.safeParse({
    feedback: formData.get("feedback"),
  });

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }

  await rejectCourse(courseId, validatedFields.data.feedback);
  revalidatePath("/dashboard/admin/review");
  return { success: true };
}
