import Link from "next/link";
import { findCourseById, listLessonsByCourse, type Lesson } from "@/lib/courses";
import { listEnrollmentsByStudent } from "@/lib/enrollments";
import { findUserById } from "@/lib/users";
import { categoryName, categoryBadgeClass } from "@/lib/categories";
import { getStudentActivityStats } from "@/lib/studentActivity";
import { getStudentWishlistCourseIds } from "@/lib/wishlist";
import {
  ImagePlaceholderIcon,
  ArrowRightIcon,
  FlameIcon,
  SparklesIcon,
  CertificateIcon,
  AcademicCapIcon,
  BookIcon,
  StarIcon,
  ClockIcon,
  HeartIcon,
} from "@/components/icons";
import { WishlistButton } from "@/components/WishlistButton";
import { StudentSearch } from "./StudentSearch";

function nextLesson(lessons: Lesson[], completedLessonIds: string[]): Lesson | null {
  return lessons.find((l) => !completedLessonIds.includes(l.id)) ?? lessons[lessons.length - 1] ?? null;
}

export async function StudentDashboard({ studentId }: { studentId: string }) {
  const [enrollments, activityStats, wishlistedCourseIds] = await Promise.all([
    listEnrollmentsByStudent(studentId),
    getStudentActivityStats(studentId),
    getStudentWishlistCourseIds(studentId),
  ]);

  if (enrollments.length === 0) {
    return (
      <div className="flex flex-col gap-8">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#6D5BD0] to-[#4A3AA8] p-8 text-white">
          <div className="max-w-md">
            <span className="text-xs font-semibold tracking-wide text-[#D6CFFA] uppercase">
              Welcome to FASMEN
            </span>
            <h2 className="font-heading mt-2 text-2xl font-bold sm:text-3xl">
              Start your learning journey today
            </h2>
            <p className="mt-2 text-sm text-[#E0DBFB]">
              Explore practical masterclasses taught by top industry instructors.
            </p>
            <Link
              href="/courses"
              className="mt-5 inline-flex h-11 items-center gap-2 rounded-full bg-[#12101F] px-5 text-sm font-medium text-white transition hover:brightness-110"
            >
              Explore Courses
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className="mx-auto max-w-md rounded-2xl border border-dashed border-neutral-300 bg-white p-10 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary-50 text-primary-700">
            <BookIcon className="h-6 w-6" />
          </div>
          <h3 className="font-heading mt-3 text-lg font-semibold text-primary-900">
            No enrolled courses yet
          </h3>
          <p className="mt-2 text-sm text-neutral-600">
            You haven&apos;t enrolled in any courses. Browse the catalog or check your saved courses.
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <Link
              href="/courses"
              className="inline-flex h-10 items-center rounded-xl bg-accent-600 px-5 text-sm font-medium text-white transition hover:brightness-95"
            >
              Browse Catalog
            </Link>
            <Link
              href="/dashboard/saved"
              className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-neutral-300 bg-white px-4 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50"
            >
              <HeartIcon className="h-4 w-4 text-rose-500" />
              <span>Saved Courses</span>
            </Link>
          </div>
        </div>
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

  const badgeIcons = {
    sparkles: <SparklesIcon className="h-4 w-4" />,
    fire: <FlameIcon className="h-4 w-4" />,
    certificate: <CertificateIcon className="h-4 w-4" />,
    academic: <AcademicCapIcon className="h-4 w-4" />,
    book: <BookIcon className="h-4 w-4" />,
    star: <StarIcon className="h-4 w-4" />,
  };

  return (
    <div className="flex flex-col gap-8">
      <StudentSearch
        courses={enriched.map((e) => ({
          slug: e.enrollment.courseSlug,
          title: e.enrollment.courseTitle,
        }))}
      />

      {/* Gamification & Streak Activity Widget */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Streak card */}
        <div className="flex items-center gap-3.5 rounded-2xl border border-orange-200/80 bg-gradient-to-br from-amber-50 to-orange-50/70 p-4 shadow-sm">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-500 text-white shadow-sm">
            <FlameIcon className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <span className="text-xs font-semibold text-orange-800 uppercase tracking-wide">
              Learning Streak
            </span>
            <p className="font-heading text-lg font-bold text-neutral-900">
              {activityStats.currentStreakDays} {activityStats.currentStreakDays === 1 ? "Day" : "Days"} 🔥
            </p>
            <p className="text-[11px] text-neutral-600 truncate">
              {activityStats.currentStreakDays > 0 ? "Keep it up today!" : "Start a streak today!"}
            </p>
          </div>
        </div>

        {/* Daily Goal Card */}
        <div className="flex flex-col justify-between rounded-2xl border border-neutral-200/80 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-600 uppercase tracking-wide">
              Daily Target
            </span>
            <span className="text-xs font-bold text-primary-700">
              {activityStats.todayMinutes}/{activityStats.dailyGoalMinutes} mins
            </span>
          </div>
          <div className="mt-2">
            <div className="h-2 w-full rounded-full bg-neutral-100">
              <div
                className="h-2 rounded-full bg-primary-600 transition-all duration-500"
                style={{ width: `${activityStats.todayGoalPercent}%` }}
              />
            </div>
          </div>
          <p className="mt-2 text-[11px] text-neutral-500">
            {activityStats.todayGoalPercent >= 100
              ? "Goal achieved for today! 🎉"
              : `${activityStats.dailyGoalMinutes - activityStats.todayMinutes} mins remaining`}
          </p>
        </div>

        {/* Weekly Activity Mini-Grid */}
        <div className="flex flex-col justify-between rounded-2xl border border-neutral-200/80 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-600 uppercase tracking-wide">
              Weekly Activity
            </span>
            <ClockIcon className="h-3.5 w-3.5 text-neutral-400" />
          </div>
          <div className="mt-2 flex items-end justify-between gap-1">
            {activityStats.weeklyDays.map((day) => (
              <div key={day.date} className="flex flex-1 flex-col items-center gap-1">
                <div
                  title={`${day.dayLabel}: ${day.minutes} mins`}
                  className={`w-full max-w-[20px] rounded-t transition-all ${
                    day.hasActivity
                      ? day.isToday
                        ? "bg-accent-600 h-6"
                        : "bg-primary-500 h-4"
                      : "bg-neutral-100 h-1.5"
                  }`}
                />
                <span
                  className={`text-[10px] font-medium ${
                    day.isToday ? "font-bold text-primary-900" : "text-neutral-500"
                  }`}
                >
                  {day.dayLabel.charAt(0)}
                </span>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-neutral-500">
            {activityStats.totalCompletedLessons} lessons completed
          </p>
        </div>

        {/* Certificates & Badges Card */}
        <div className="flex items-center gap-3.5 rounded-2xl border border-neutral-200/80 bg-white p-4 shadow-sm">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
            <CertificateIcon className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <span className="text-xs font-semibold text-neutral-600 uppercase tracking-wide">
              Certificates
            </span>
            <p className="font-heading text-lg font-bold text-neutral-900">
              {activityStats.totalCertificates} Earned
            </p>
            <Link
              href="/dashboard/certificates"
              className="text-[11px] font-semibold text-primary-700 hover:underline"
            >
              View certificates →
            </Link>
          </div>
        </div>
      </div>

      {/* Milestone Badges Strip */}
      <div className="rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SparklesIcon className="h-4 w-4 text-accent-500" />
            <h3 className="font-heading text-sm font-bold text-primary-900">
              Milestones & Achievements
            </h3>
          </div>
          <span className="text-xs text-neutral-500 font-medium">
            {activityStats.milestones.filter((m) => m.unlocked).length} of {activityStats.milestones.length} unlocked
          </span>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {activityStats.milestones.map((milestone) => (
            <div
              key={milestone.id}
              className={`flex flex-col items-center justify-center rounded-xl p-3 text-center transition-all ${
                milestone.unlocked
                  ? "border border-amber-200 bg-gradient-to-b from-amber-50/50 to-white shadow-xs"
                  : "border border-neutral-200/70 bg-neutral-50/50 opacity-60"
              }`}
            >
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-full ${
                  milestone.unlocked
                    ? "bg-amber-500 text-white shadow-sm"
                    : "bg-neutral-200 text-neutral-500"
                }`}
              >
                {badgeIcons[milestone.icon]}
              </div>
              <span className="mt-2 text-xs font-bold text-neutral-900 leading-tight">
                {milestone.title}
              </span>
              <span className="mt-0.5 text-[10px] text-neutral-500 leading-tight line-clamp-1">
                {milestone.description}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Promo Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#6D5BD0] to-[#4A3AA8] p-8 text-white">
        <div className="max-w-md">
          <span className="text-xs font-semibold tracking-wide text-[#D6CFFA] uppercase">
            Online course
          </span>
          <h2 className="font-heading mt-2 text-2xl font-bold sm:text-3xl">
            Sharpen your skills with more courses
          </h2>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Link
              href="/courses"
              className="inline-flex h-11 items-center gap-2 rounded-full bg-[#12101F] px-5 text-sm font-medium text-white transition hover:brightness-110"
            >
              Explore Catalog
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
            <Link
              href="/dashboard/saved"
              className="inline-flex h-11 items-center gap-1.5 rounded-full bg-white/15 px-5 text-sm font-medium text-white backdrop-blur-sm transition hover:bg-white/25"
            >
              <HeartIcon className="h-4 w-4" />
              <span>Saved Courses</span>
            </Link>
          </div>
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

      {/* Continue Watching Section */}
      <div>
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-lg font-semibold text-primary-900">
            Continue watching
          </h2>
          <span className="text-xs text-neutral-500 font-medium">
            {continueWatching.length} active {continueWatching.length === 1 ? "course" : "courses"}
          </span>
        </div>
        <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {continueWatching.map(({ enrollment, course, tutor }) => {
            const isWishlisted = wishlistedCourseIds.includes(enrollment.courseId);
            return (
              <div
                key={enrollment.id}
                className="group relative block overflow-hidden rounded-xl border border-neutral-200/80 bg-white shadow-sm transition hover:shadow-md hover:-translate-y-0.5"
              >
                <Link
                  href={`/dashboard/learn/${enrollment.courseSlug}`}
                  className="block"
                >
                  <div className="relative flex aspect-video items-center justify-center bg-primary-100">
                    {course?.thumbnailUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={course.thumbnailUrl}
                        alt={enrollment.courseTitle}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <span className="font-heading text-2xl font-bold text-primary-700">
                        {enrollment.courseTitle.charAt(0).toUpperCase()}
                      </span>
                    )}
                    <div className="absolute top-3 right-3 z-10">
                      <WishlistButton
                        courseId={enrollment.courseId}
                        courseSlug={enrollment.courseSlug}
                        initialWishlisted={isWishlisted}
                        className="h-7 w-7 p-1 shadow-md hover:scale-105"
                        size="sm"
                      />
                    </div>
                  </div>
                  <div className="p-4">
                    {course && (
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase ${categoryBadgeClass(
                          course.category
                        )}`}
                      >
                        {categoryName(course.category)}
                      </span>
                    )}
                    <h3 className="font-heading mt-2 line-clamp-2 text-sm font-semibold text-primary-900 group-hover:text-primary-700 transition-colors">
                      {enrollment.courseTitle}
                    </h3>
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs text-neutral-500 mb-1">
                        <span>{enrollment.progress.percentComplete}% Complete</span>
                        <span>
                          {enrollment.progress.completedLessonIds.length}/{course?.totalLessons || 0} Lessons
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-neutral-100">
                        <div
                          className="h-1.5 rounded-full bg-primary-600 transition-all duration-300"
                          style={{ width: `${enrollment.progress.percentComplete}%` }}
                        />
                      </div>
                    </div>
                    <div className="mt-3.5 flex items-center justify-between pt-2.5 border-t border-neutral-100">
                      <div className="flex items-center gap-2">
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-full bg-neutral-100">
                          {tutor?.photoURL ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={tutor.photoURL} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <ImagePlaceholderIcon className="h-3 w-3 text-neutral-400" />
                          )}
                        </div>
                        <p className="truncate text-xs font-medium text-neutral-700">
                          {tutor?.displayName ?? "Instructor"}
                        </p>
                      </div>

                      <span className="text-xs font-semibold text-primary-700 group-hover:translate-x-0.5 transition-transform">
                        Resume →
                      </span>
                    </div>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      </div>

      {/* Up Next Lessons Table */}
      <div>
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-lg font-semibold text-primary-900">Next lessons</h2>
          <Link
            href="/courses"
            className="text-sm font-medium text-primary-700 hover:text-primary-900"
          >
            Explore all
          </Link>
        </div>
        <div className="mt-4 overflow-x-auto rounded-xl border border-neutral-200/80 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-neutral-200/80 bg-neutral-50 text-neutral-700">
                <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider">Instructor</th>
                <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider">Type</th>
                <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider">Lesson Title</th>
                <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {enriched.map(({ enrollment, tutor, lessons }) => {
                const lesson = nextLesson(lessons, enrollment.progress.completedLessonIds);
                if (!lesson) return null;
                return (
                  <tr key={enrollment.id} className="hover:bg-neutral-50/60 transition-colors">
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
                        <span className="text-neutral-900 font-medium text-xs">
                          {tutor?.displayName ?? "Instructor"}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="inline-flex rounded-full bg-primary-50 px-2.5 py-0.5 text-xs font-medium text-primary-700 capitalize">
                        {lesson.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-neutral-800 text-xs font-medium">
                      <span className="text-neutral-400 mr-1.5">[{enrollment.courseTitle}]</span>
                      {lesson.title}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/dashboard/learn/${enrollment.courseSlug}`}
                        aria-label={`Continue ${enrollment.courseTitle}`}
                        className="inline-flex h-8 items-center gap-1 rounded-lg bg-primary-50 px-3 text-xs font-semibold text-primary-700 transition hover:bg-primary-100 hover:text-primary-900"
                      >
                        <span>Learn</span>
                        <ArrowRightIcon className="h-3.5 w-3.5" />
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
