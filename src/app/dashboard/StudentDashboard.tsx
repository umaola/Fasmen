import Link from "next/link";
import { findCourseById, listLessonsByCourse, type Lesson } from "@/lib/courses";
import { listEnrollmentsByStudent } from "@/lib/enrollments";
import { findUserById } from "@/lib/users";
import { categoryName, categoryBadgeClass } from "@/lib/categories";
import { ImagePlaceholderIcon, ArrowRightIcon, HeartIcon } from "@/components/icons";
import { StudentSearch } from "./StudentSearch";

function nextLesson(lessons: Lesson[], completedLessonIds: string[]): Lesson | null {
  return lessons.find((l) => !completedLessonIds.includes(l.id)) ?? lessons[lessons.length - 1] ?? null;
}

export async function StudentDashboard({ studentId }: { studentId: string }) {
  const enrollments = await listEnrollmentsByStudent(studentId);

  if (enrollments.length === 0) {
    return (
      <div className="mx-auto max-w-md rounded-lg border border-dashed border-neutral-200 bg-white p-10 text-center">
        <h2 className="font-heading text-lg font-semibold text-primary-900">No courses yet</h2>
        <p className="mt-2 text-sm text-neutral-700">
          You haven&apos;t enrolled in any courses. Browse the catalog to find something to learn.
        </p>
        <Link
          href="/courses"
          className="mt-6 inline-flex h-11 items-center rounded-md bg-accent-600 px-6 font-medium text-white transition hover:brightness-95"
        >
          Browse courses
        </Link>
      </div>
    );
  }

  const enriched = await Promise.all(
    enrollments.map(async (enrollment) => {
      const [course, lessons] = await Promise.all([
        findCourseById(enrollment.courseId),
        listLessonsByCourse(enrollment.courseId),
      ]);
      const tutor = course ? await findUserById(course.tutorId) : undefined;
      return { enrollment, course, tutor, lessons };
    })
  );

  const pillStats = [...enriched]
    .sort((a, b) => b.enrollment.progress.percentComplete - a.enrollment.progress.percentComplete)
    .slice(0, 3);

  const inProgress = enriched.filter((e) => e.enrollment.progress.percentComplete < 100);
  const continueWatching = (inProgress.length > 0 ? inProgress : enriched).slice(0, 6);

  return (
    <div className="flex flex-col gap-8">
      <StudentSearch
        courses={enriched.map((e) => ({
          slug: e.enrollment.courseSlug,
          title: e.enrollment.courseTitle,
        }))}
      />

      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#6D5BD0] to-[#4A3AA8] p-8 text-white">
        <div className="max-w-md">
          <span className="text-xs font-semibold tracking-wide text-[#D6CFFA] uppercase">
            Online course
          </span>
          <h2 className="font-heading mt-2 text-2xl font-bold sm:text-3xl">
            Sharpen your skills with more courses
          </h2>
          <Link
            href="/courses"
            className="mt-5 inline-flex h-11 items-center gap-2 rounded-full bg-[#12101F] px-5 text-sm font-medium text-white transition hover:brightness-110"
          >
            Browse courses
            <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </div>
        <svg
          viewBox="0 0 100 100"
          className="pointer-events-none absolute top-1/2 right-6 h-28 w-28 -translate-y-1/2 text-white/25 sm:h-36 sm:w-36"
          aria-hidden="true"
        >
          <path
            fill="currentColor"
            d="M50 0c3 25 22 44 47 47-25 3-44 22-47 47-3-25-22-44-47-47 25-3 44-22 47-47z"
          />
        </svg>
      </div>

      {pillStats.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-3">
          {pillStats.map(({ enrollment, course }) => (
            <Link
              key={enrollment.id}
              href={`/dashboard/learn/${enrollment.courseSlug}`}
              className="flex items-center gap-3 rounded-full bg-white px-4 py-3 shadow-[0_1px_3px_rgba(18,22,28,0.08)] transition hover:shadow-[0_4px_12px_rgba(18,22,28,0.10)]"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-100">
                <ImagePlaceholderIcon className="h-4 w-4 text-primary-700" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-neutral-700">
                  {enrollment.progress.completedLessonIds.length}/{course?.totalLessons ?? 0}{" "}
                  watched
                </p>
                <p className="truncate text-sm font-medium text-neutral-900">
                  {enrollment.courseTitle}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}

      <div>
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-lg font-semibold text-primary-900">
            Continue watching
          </h2>
        </div>
        <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {continueWatching.map(({ enrollment, course, tutor }) => (
            <Link
              key={enrollment.id}
              href={`/dashboard/learn/${enrollment.courseSlug}`}
              className="block overflow-hidden rounded-lg bg-white shadow-[0_1px_3px_rgba(18,22,28,0.08)] transition hover:shadow-[0_4px_12px_rgba(18,22,28,0.10)]"
            >
              <div className="relative flex aspect-video items-center justify-center bg-primary-100">
                {course?.thumbnailUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={course.thumbnailUrl}
                    alt={enrollment.courseTitle}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="font-heading text-2xl font-bold text-primary-700">
                    {enrollment.courseTitle.charAt(0).toUpperCase()}
                  </span>
                )}
                <span className="absolute top-3 right-3 flex h-7 w-7 items-center justify-center rounded-full bg-white/80 text-neutral-700">
                  <HeartIcon className="h-3.5 w-3.5" />
                </span>
              </div>
              <div className="p-4">
                {course && (
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium uppercase ${categoryBadgeClass(course.category)}`}
                  >
                    {categoryName(course.category)}
                  </span>
                )}
                <h3 className="font-heading mt-2 line-clamp-2 text-sm font-semibold text-primary-900">
                  {enrollment.courseTitle}
                </h3>
                <div className="mt-3 h-1.5 rounded-full bg-neutral-200">
                  <div
                    className="h-1.5 rounded-full bg-primary-500"
                    style={{ width: `${enrollment.progress.percentComplete}%` }}
                  />
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-neutral-100">
                    {tutor?.photoURL ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={tutor.photoURL} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <ImagePlaceholderIcon className="h-3.5 w-3.5 text-neutral-400" />
                    )}
                  </div>
                  <div className="min-w-0 leading-tight">
                    <p className="truncate text-xs font-medium text-neutral-900">
                      {tutor?.displayName ?? "Mentor"}
                    </p>
                    <p className="text-xs text-neutral-700">Mentor</p>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-lg font-semibold text-primary-900">Your lesson</h2>
          <Link
            href="/courses"
            className="text-sm font-medium text-primary-700 hover:text-primary-900"
          >
            See all
          </Link>
        </div>
        <div className="mt-4 overflow-x-auto rounded-lg bg-white shadow-[0_1px_3px_rgba(18,22,28,0.08)]">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-200 text-neutral-700">
                <th className="px-4 py-3 font-medium">Tutor</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Description</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {enriched.map(({ enrollment, tutor, lessons }) => {
                const lesson = nextLesson(lessons, enrollment.progress.completedLessonIds);
                if (!lesson) return null;
                return (
                  <tr key={enrollment.id} className="border-b border-neutral-200 last:border-0">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-neutral-100">
                          {tutor?.photoURL ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={tutor.photoURL}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <ImagePlaceholderIcon className="h-3.5 w-3.5 text-neutral-400" />
                          )}
                        </div>
                        <span className="text-neutral-900">{tutor?.displayName ?? "Tutor"}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="inline-flex rounded-full bg-primary-100 px-2.5 py-0.5 text-xs font-medium text-primary-700 capitalize">
                        {lesson.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-neutral-700">{lesson.title}</td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/dashboard/learn/${enrollment.courseSlug}`}
                        aria-label={`Continue ${enrollment.courseTitle}`}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full text-primary-700 transition hover:bg-primary-100"
                      >
                        <ArrowRightIcon className="h-4 w-4" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
