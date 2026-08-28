import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { findCourseBySlug, listLessonsByCourse, type Lesson } from "@/lib/courses";
import { categoryName } from "@/lib/categories";
import { findUserById } from "@/lib/users";
import { getCurrentUser } from "@/lib/dal";
import { findEnrollment } from "@/lib/enrollments";
import { enrollInCourse } from "@/app/actions/enrollments";
import { listReviewsByCourse, findReviewByStudentAndCourse, type Review } from "@/lib/reviews";
import { deleteReviewAction } from "@/app/actions/reviews";
import { formatNaira } from "@/lib/currency";
import { isCourseWishlisted } from "@/lib/wishlist";
import { ReviewForm } from "./ReviewForm";
import { CurriculumAccordion } from "./CurriculumAccordion";
import { WishlistButton } from "@/components/WishlistButton";
import {
  StarIcon,
  CheckCircleIcon,
  AcademicCapIcon,
  BookIcon,
  ShieldCheckIcon,
  ClockIcon,
  CheckIcon,
  PlayIcon,
} from "@/components/icons";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const course = await findCourseBySlug(slug);

  if (!course || course.status !== "published") {
    notFound();
  }

  const [lessons, tutor, user] = await Promise.all([
    listLessonsByCourse(course.id).catch(() => [] as Lesson[]),
    findUserById(course.tutorId).catch(() => undefined),
    getCurrentUser().catch(() => null),
  ]);

  const enrollment =
    user?.role === "student" ? await findEnrollment(user.id, course.id).catch(() => undefined) : undefined;

  const isWishlisted =
    user?.role === "student" ? await isCourseWishlisted(user.id, course.id).catch(() => false) : false;

  const [reviews, myReview] = await Promise.all([
    listReviewsByCourse(course.id).catch(() => [] as Review[]),
    user?.role === "student" ? findReviewByStudentAndCourse(user.id, course.id).catch(() => undefined) : undefined,
  ]);

  const reviewCount = Number(course.reviewCount) || 0;
  const averageRating = Number(course.averageRating) || 0;
  const price = typeof course.price === "number" ? course.price : 0;
  const title = course.title || "Untitled Course";
  const level = course.level || "beginner";
  const isEnrolled = Boolean(enrollment);

  // Derive "What you will learn" key takeaways from description or tags
  const takeaways = [
    `Master practical, job-ready competencies in ${categoryName(course.category || "")}.`,
    `Step-by-step video guidance designed for ${level} learners.`,
    `Complete hands-on assignments and test your mastery with final assessments.`,
    `Earn an official, cryptographically verifiable FASMEN certificate for your portfolio.`,
  ];

  return (
    <main className="min-h-screen bg-neutral-100/70 pb-24">
      {/* Hero Header Section */}
      <section className="relative overflow-hidden bg-primary-950 text-white pt-10 pb-16 px-4 sm:px-6 lg:px-8 border-b border-primary-800/40">
        {/* Subtle Ambient Radial Glows */}
        <div className="absolute top-0 right-1/4 -mt-10 h-80 w-80 rounded-full bg-primary-600/15 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 -mb-10 h-72 w-72 rounded-full bg-accent-500/10 blur-3xl pointer-events-none" />

        <div className="relative mx-auto max-w-6xl">
          {/* Breadcrumb Bar */}
          <div className="flex flex-wrap items-center gap-2 text-xs text-primary-200/80 mb-6">
            <Link href="/" className="hover:text-white transition">Home</Link>
            <span>/</span>
            <Link href="/courses" className="hover:text-white transition">Courses</Link>
            <span>/</span>
            <Link
              href={`/courses?category=${course.category}`}
              className="hover:text-white transition"
            >
              {categoryName(course.category || "")}
            </Link>
            <span>/</span>
            <span className="text-white font-medium truncate max-w-xs">{title}</span>
          </div>

          <div className="lg:grid lg:grid-cols-12 lg:gap-8 items-start">
            {/* Main Header Text */}
            <div className="lg:col-span-8">
              {/* Category & Level Badges */}
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="rounded-full bg-white/95 backdrop-blur-md px-3 py-1 text-xs font-semibold text-primary-900 shadow-sm">
                  {categoryName(course.category || "")}
                </span>
                <span className="rounded-full bg-primary-900/80 backdrop-blur-md px-3 py-1 text-xs font-medium capitalize text-primary-100 border border-primary-700/60">
                  {level} Level
                </span>
              </div>

              {/* Title */}
              <h1 className="font-heading text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-white leading-tight">
                {title}
              </h1>

              {/* Short Tagline / Excerpt */}
              {course.description && (
                <p className="mt-3 text-sm sm:text-base text-primary-100/90 leading-relaxed max-w-3xl line-clamp-3">
                  {course.description}
                </p>
              )}

              {/* Social Proof & Instructor Attribution Bar */}
              <div className="mt-6 flex flex-wrap items-center gap-4 text-xs sm:text-sm text-primary-200 border-t border-primary-800/60 pt-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-800">
                    {(course.tutorName || "Tutor").slice(0, 2).toUpperCase()}
                  </div>
                  <span className="text-white font-medium">Created by {course.tutorName || "Instructor"}</span>
                  <CheckCircleIcon className="h-4 w-4 text-accent-400" />
                </div>

                <div className="flex items-center gap-1.5 text-amber-400">
                  <StarIcon className="h-4 w-4 fill-amber-400" />
                  <span className="font-bold text-white">
                    {averageRating > 0 ? averageRating.toFixed(1) : "New"}
                  </span>
                  {reviewCount > 0 && (
                    <span className="text-primary-300">({reviewCount} review{reviewCount === 1 ? "" : "s"})</span>
                  )}
                </div>

                <div className="flex items-center gap-1.5 text-primary-200">
                  <BookIcon className="h-4 w-4 text-primary-300" />
                  <span>{lessons.length} Lesson{lessons.length === 1 ? "" : "s"}</span>
                </div>

                <div className="inline-flex items-center gap-1 text-accent-300 font-medium">
                  <AcademicCapIcon className="h-4 w-4" />
                  <span>Certificate Included</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Body (Split 2-Column on Desktop) */}
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 mt-8">
        <div className="lg:grid lg:grid-cols-12 lg:gap-8 items-start">
          {/* Left Column: Details, Takeaways, Curriculum, Instructor, Reviews */}
          <div className="lg:col-span-8 space-y-8">
            {/* "What You'll Learn" Highlight Box */}
            <div className="rounded-2xl bg-white p-6 sm:p-8 border border-neutral-200/80 shadow-[0_1px_3px_rgba(18,22,28,0.06)]">
              <div className="flex items-center gap-2 mb-4">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#e4f5ec] text-success-600">
                  <CheckIcon className="h-4 w-4" />
                </div>
                <h2 className="font-heading text-lg sm:text-xl font-bold text-primary-900">
                  What You Will Learn
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                {takeaways.map((item, i) => (
                  <div key={i} className="flex items-start gap-2.5 text-xs sm:text-sm text-neutral-700 leading-relaxed">
                    <CheckCircleIcon className="h-4 w-4 text-success-600 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Course Overview / In-depth Description */}
            <div className="rounded-2xl bg-white p-6 sm:p-8 border border-neutral-200/80 shadow-[0_1px_3px_rgba(18,22,28,0.06)]">
              <h2 className="font-heading text-lg sm:text-xl font-bold text-primary-900 mb-4">
                Course Description
              </h2>
              <div className="text-sm sm:text-base text-neutral-700 leading-relaxed whitespace-pre-line space-y-4">
                {course.description || "No full description provided for this course."}
              </div>

              {course.tags && course.tags.length > 0 && (
                <div className="mt-6 border-t border-neutral-100 pt-4">
                  <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500 block mb-2">
                    Course Focus Tags
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {course.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-lg bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-700"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Curriculum Accordion Section */}
            <div className="rounded-2xl bg-white p-6 sm:p-8 border border-neutral-200/80 shadow-[0_1px_3px_rgba(18,22,28,0.06)]">
              <div className="flex items-center justify-between gap-4 mb-4">
                <h2 className="font-heading text-lg sm:text-xl font-bold text-primary-900">
                  Curriculum Outline
                </h2>
                <span className="text-xs font-semibold text-primary-700 bg-primary-50 px-2.5 py-1 rounded-full">
                  {lessons.length} Modules
                </span>
              </div>

              <CurriculumAccordion
                lessons={lessons}
                libraryId={process.env.BUNNY_STREAM_LIBRARY_ID || ""}
              />
            </div>

            {/* Instructor Profile Card */}
            <div className="rounded-2xl bg-white p-6 sm:p-8 border border-neutral-200/80 shadow-[0_1px_3px_rgba(18,22,28,0.06)]">
              <span className="text-xs font-semibold uppercase tracking-wider text-accent-600 block mb-1">
                Faculty Instructor
              </span>
              <h2 className="font-heading text-lg sm:text-xl font-bold text-primary-900 mb-4">
                Meet Your Instructor
              </h2>

              <div className="flex flex-col sm:flex-row items-start gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-100 text-primary-800 font-bold text-lg shrink-0">
                  {(course.tutorName || "Tutor").slice(0, 2).toUpperCase()}
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-heading text-base font-bold text-neutral-900">
                      {course.tutorName || "Instructor"}
                    </h3>
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#e4f5ec] px-2 py-0.5 text-[10px] font-bold text-success-600">
                      <CheckCircleIcon className="h-3 w-3" />
                      <span>Verified Instructor</span>
                    </span>
                  </div>

                  <p className="mt-2 text-xs sm:text-sm text-neutral-700 leading-relaxed whitespace-pre-line">
                    {tutor?.bio ||
                      `${course.tutorName || "This instructor"} is an experienced industry specialist and accredited educator on the FASMEN platform.`}
                  </p>

                  {tutor?.tutorProfile?.username && (
                    <div className="mt-3">
                      <Link
                        href={`/tutors/${tutor.tutorProfile.username}`}
                        className="text-xs font-semibold text-primary-700 hover:text-accent-600 underline"
                      >
                        Profile →
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Student Reviews & Ratings */}
            <div className="rounded-2xl bg-white p-6 sm:p-8 border border-neutral-200/80 shadow-[0_1px_3px_rgba(18,22,28,0.06)]">
              <div className="flex items-center justify-between gap-4 mb-4">
                <div>
                  <h2 className="font-heading text-lg sm:text-xl font-bold text-primary-900">
                    Student Reviews & Feedback
                  </h2>
                  <p className="text-xs text-neutral-600 mt-0.5">
                    Real feedback from enrolled learners who completed this curriculum.
                  </p>
                </div>

                <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 rounded-xl px-3 py-1.5">
                  <StarIcon className="h-4 w-4 text-amber-500 fill-amber-500" />
                  <span className="font-bold text-amber-900 text-sm">
                    {averageRating > 0 ? averageRating.toFixed(1) : "5.0"}
                  </span>
                  <span className="text-amber-800 text-xs">/ 5.0</span>
                </div>
              </div>

              {/* Review Submission Form for Enrolled Students */}
              {isEnrolled && (
                <div className="mb-6 rounded-xl bg-neutral-50 p-4 border border-neutral-200/80">
                  <h3 className="font-heading text-sm font-semibold text-neutral-900 mb-2">
                    {myReview ? "Update Your Review" : "Leave a Student Review"}
                  </h3>
                  <ReviewForm
                    courseId={course.id}
                    existingReview={
                      myReview
                        ? { id: myReview.id, rating: myReview.rating, comment: myReview.comment }
                        : undefined
                    }
                  />
                  {myReview && (
                    <form action={deleteReviewAction.bind(null, myReview.id, course.id)} className="mt-2">
                      <button
                        type="submit"
                        className="text-xs font-medium text-error-600 hover:underline cursor-pointer"
                      >
                        Delete my review
                      </button>
                    </form>
                  )}
                </div>
              )}

              {/* Reviews List */}
              {reviews.length === 0 ? (
                <div className="rounded-xl border border-dashed border-neutral-300 p-6 text-center text-xs text-neutral-600">
                  No student reviews submitted yet. Be the first enrolled student to review this course!
                </div>
              ) : (
                <div className="divide-y divide-neutral-100">
                  {reviews.map((rev) => (
                    <div key={rev.id} className="py-4 first:pt-0 last:pb-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-100 text-primary-800 font-bold text-xs">
                            {(rev.studentName || "S").slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-semibold text-neutral-900 text-xs sm:text-sm">
                              {rev.studentName || "Verified Student"}
                            </span>
                            <span className="text-[10px] text-neutral-500 ml-2">
                              {new Date(rev.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center text-amber-500">
                          {"★".repeat(Math.max(1, Math.min(5, Math.floor(Number(rev.rating) || 5))))}
                        </div>
                      </div>

                      <p className="mt-2 text-xs sm:text-sm text-neutral-700 leading-relaxed whitespace-pre-line">
                        {rev.comment}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Sticky Purchase & Enrollment Card (Desktop) */}
          <div className="mt-8 lg:mt-0 lg:col-span-4 lg:sticky lg:top-6">
            <div className="rounded-2xl bg-white p-6 border border-neutral-200/80 shadow-[0_8px_30px_rgba(11,37,69,0.08)]">
              {/* 16:9 Thumbnail Preview */}
              <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-primary-950 shadow-inner">
                {course.thumbnailUrl ? (
                  <Image
                    src={course.thumbnailUrl}
                    alt={title}
                    fill
                    priority
                    sizes="(max-width: 1024px) 100vw, 400px"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary-900 via-primary-800 to-primary-950 text-white font-heading text-3xl font-bold">
                    {title.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="absolute inset-0 bg-black/25 flex items-center justify-center pointer-events-none">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 text-primary-900 shadow-lg">
                    <PlayIcon className="h-5 w-5 ml-0.5" />
                  </div>
                </div>
              </div>

              {/* Price Display */}
              <div className="mt-5">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                  Course Enrollment Fee
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  {price === 0 ? (
                    <span className="font-heading text-3xl font-bold text-success-600">
                      Free
                    </span>
                  ) : (
                    <span className="font-heading text-3xl font-bold text-primary-900">
                      {formatNaira(price)}
                    </span>
                  )}
                  <span className="text-xs text-neutral-500 font-medium">One-time payment</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-5 space-y-3">
                {!user && (
                  <Link
                    href={`/login?redirect=/courses/${course.slug}`}
                    className="flex h-12 w-full items-center justify-center rounded-xl bg-primary-700 font-semibold text-sm text-white shadow-md transition hover:bg-primary-800 cursor-pointer"
                  >
                    Login →
                  </Link>
                )}

                {user?.role === "student" && !isEnrolled && (
                  <form action={enrollInCourse.bind(null, course.id)}>
                    <button
                      type="submit"
                      className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-accent-600 font-semibold text-sm text-white shadow-md transition hover:bg-accent-700 cursor-pointer"
                    >
                      <AcademicCapIcon className="h-5 w-5" />
                      <span>Enroll</span>
                    </button>
                  </form>
                )}

                {user?.role === "student" && isEnrolled && (
                  <Link
                    href={`/dashboard/learn/${course.slug}`}
                    className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-success-600 font-semibold text-sm text-white shadow-md transition hover:bg-success-700 cursor-pointer"
                  >
                    <span>Continue</span>
                    <span>→</span>
                  </Link>
                )}

                {user && user.role !== "student" && (
                  <div className="rounded-lg bg-neutral-100 p-3 text-center text-xs text-neutral-600">
                    Logged in as <strong className="capitalize">{user.role}</strong>. Switch to a student account to enroll.
                  </div>
                )}

                {user?.role === "student" && !isEnrolled && (
                  <WishlistButton
                    courseId={course.id}
                    courseSlug={course.slug}
                    initialWishlisted={isWishlisted}
                    showLabel={true}
                    className="flex h-11 w-full items-center justify-center rounded-xl border border-neutral-300 bg-white text-xs font-semibold text-neutral-700 shadow-xs hover:bg-neutral-50"
                  />
                )}
              </div>

              {/* Feature Highlights Checklist */}
              <div className="mt-6 border-t border-neutral-100 pt-5 space-y-3 text-xs text-neutral-700">
                <span className="font-semibold text-neutral-900 block uppercase tracking-wider text-[11px]">
                  This Course Includes:
                </span>
                <div className="flex items-center gap-2.5">
                  <PlayIcon className="h-4 w-4 text-primary-600 shrink-0" />
                  <span>{lessons.length} on-demand video & reading modules</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <AcademicCapIcon className="h-4 w-4 text-primary-600 shrink-0" />
                  <span>Official Certificate of Completion</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <ClockIcon className="h-4 w-4 text-primary-600 shrink-0" />
                  <span>Full lifetime access with self-paced study</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <ShieldCheckIcon className="h-4 w-4 text-primary-600 shrink-0" />
                  <span>Final assessment quiz & grade verification</span>
                </div>
              </div>

              <div className="mt-5 rounded-xl bg-neutral-50 p-3 text-center border border-neutral-200/60">
                <span className="text-[11px] text-neutral-500 font-medium">
                  🔒 Secure Instant Enrollment · Instant Access
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Bottom Bar for Mobile Screen Viewports (< lg:) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-neutral-200 p-3.5 shadow-2xl">
        <div className="mx-auto max-w-md flex items-center justify-between gap-3">
          <div>
            <span className="text-[10px] text-neutral-500 uppercase font-semibold block">Total Price</span>
            <span className="font-heading text-lg font-bold text-primary-900">
              {price === 0 ? "Free" : formatNaira(price)}
            </span>
          </div>

          {!user && (
            <Link
              href={`/login?redirect=/courses/${course.slug}`}
              className="rounded-lg bg-primary-700 px-5 py-2.5 text-xs font-semibold text-white shadow hover:bg-primary-800"
            >
              Login
            </Link>
          )}

          {user?.role === "student" && !isEnrolled && (
            <form action={enrollInCourse.bind(null, course.id)}>
              <button
                type="submit"
                className="rounded-lg bg-accent-600 px-5 py-2.5 text-xs font-semibold text-white shadow hover:bg-accent-700 cursor-pointer"
              >
                Enroll
              </button>
            </form>
          )}

          {user?.role === "student" && isEnrolled && (
            <Link
              href={`/dashboard/learn/${course.slug}`}
              className="rounded-lg bg-success-600 px-5 py-2.5 text-xs font-semibold text-white shadow hover:bg-success-700"
            >
              Continue
            </Link>
          )}
        </div>
      </div>
    </main>
  );
}
