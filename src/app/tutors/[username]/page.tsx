import Link from "next/link";
import { notFound } from "next/navigation";
import { findUserByUsername } from "@/lib/users";
import { listCoursesByTutor } from "@/lib/courses";
import { CourseCard } from "@/components/CourseCard";

export default async function TutorPortfolioPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const tutor = await findUserByUsername(username);

  if (!tutor || tutor.role !== "tutor") {
    notFound();
  }

  const courses = (await listCoursesByTutor(tutor.id)).filter((c) => c.status === "published");

  return (
    <main className="flex-1 px-6 py-12">
      <div className="mx-auto max-w-6xl">
        <Link href="/courses" className="text-sm font-medium text-primary-700">
          ← Back to catalog
        </Link>

        <div className="mt-4 rounded-lg bg-white p-6 shadow-[0_1px_3px_rgba(18,22,28,0.08)]">
          <h1 className="font-heading text-2xl font-bold text-primary-900">{tutor.displayName}</h1>
          <p className="mt-1 text-sm text-neutral-700">
            {tutor.tutorProfile?.averageRating
              ? `★ ${tutor.tutorProfile.averageRating.toFixed(1)} · `
              : ""}
            {tutor.tutorProfile?.totalStudents ?? 0} student
            {tutor.tutorProfile?.totalStudents === 1 ? "" : "s"}
          </p>
          {tutor.bio && (
            <p className="mt-4 whitespace-pre-line text-neutral-700">{tutor.bio}</p>
          )}
        </div>

        <h2 className="font-heading mt-10 text-lg font-semibold text-primary-900">Courses</h2>
        {courses.length === 0 ? (
          <div className="mx-auto mt-6 max-w-md rounded-lg border border-dashed border-neutral-200 bg-white p-10 text-center">
            <h3 className="font-heading text-lg font-semibold text-primary-900">
              No published courses yet
            </h3>
            <p className="mt-2 text-sm text-neutral-700">Check back soon.</p>
          </div>
        ) : (
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
