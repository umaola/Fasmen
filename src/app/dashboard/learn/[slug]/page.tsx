import { redirect, notFound } from "next/navigation";
import { requireRole } from "@/lib/authz";
import { findCourseBySlug, listLessonsByCourse } from "@/lib/courses";
import { findEnrollment } from "@/lib/enrollments";
import { findUserById } from "@/lib/users";
import { listNotesByStudentAndCourse } from "@/lib/notes";
import { isCourseWishlisted } from "@/lib/wishlist";
import { listQuestionsByCourse } from "@/lib/assessments";
import { CoursePlayerClient } from "./CoursePlayerClient";

export default async function LearnPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const user = await requireRole("student");
  if (!user) {
    redirect("/login");
  }

  const course = await findCourseBySlug(slug);
  if (!course) {
    notFound();
  }

  const enrollment = await findEnrollment(user.id, course.id);
  if (!enrollment) {
    redirect(`/courses/${slug}`);
  }

  const [lessons, tutor, notes, wishlisted, questions] = await Promise.all([
    listLessonsByCourse(course.id),
    findUserById(course.tutorId),
    listNotesByStudentAndCourse(user.id, course.id),
    isCourseWishlisted(user.id, course.id),
    listQuestionsByCourse(course.id),
  ]);

  return (
    <CoursePlayerClient
      course={course}
      enrollment={enrollment}
      lessons={lessons}
      tutor={tutor}
      initialNotes={notes}
      isWishlisted={wishlisted}
      hasAssessment={questions.length > 0}
    />
  );
}
