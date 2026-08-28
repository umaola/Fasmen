"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import type { Course, Lesson } from "@/lib/courses";
import type { Enrollment } from "@/lib/enrollments";
import type { UserProfile } from "@/lib/users";
import type { StudentLessonNote } from "@/lib/notes";
import { completeLessonAction } from "@/app/actions/progress";
import { formatDuration } from "@/lib/format";
import { getBunnyEmbedUrl } from "@/lib/bunny";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  CheckIcon,
  PlayIcon,
  DocumentTextIcon,
  AcademicCapIcon,
  MenuIcon,
  CloseIcon,
  DownloadIcon,
  ImagePlaceholderIcon,
} from "@/components/icons";
import { WishlistButton } from "@/components/WishlistButton";
import { LessonNotesView } from "./LessonNotesView";

interface CoursePlayerClientProps {
  course: Course;
  enrollment: Enrollment;
  lessons: Lesson[];
  tutor?: UserProfile;
  initialNotes: StudentLessonNote[];
  isWishlisted?: boolean;
  hasAssessment?: boolean;
}

export function CoursePlayerClient({
  course,
  enrollment: initialEnrollment,
  lessons,
  tutor,
  initialNotes,
  isWishlisted = false,
  hasAssessment = true,
}: CoursePlayerClientProps) {
  const [enrollment, setEnrollment] = useState(initialEnrollment);
  const [activeLessonIndex, setActiveLessonIndex] = useState(() => {
    if (lessons.length === 0) return 0;
    const firstUnfinished = lessons.findIndex(
      (l) => !initialEnrollment.progress.completedLessonIds.includes(l.id)
    );
    return firstUnfinished >= 0 ? firstUnfinished : 0;
  });

  const [activeTab, setActiveTab] = useState<"overview" | "notes" | "assessment">("overview");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isPending, startTransition] = useTransition();

  const activeLesson: Lesson | undefined = lessons[activeLessonIndex];
  const isLessonCompleted = activeLesson
    ? enrollment.progress.completedLessonIds.includes(activeLesson.id)
    : false;

  const totalLessons = lessons.length;
  const completedCount = enrollment.progress.completedLessonIds.length;
  const percentComplete = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;
  const allLessonsCompleted = totalLessons > 0 && completedCount === totalLessons;

  const handleMarkComplete = (lessonId: string) => {
    if (isLessonCompleted) return;

    startTransition(async () => {
      // Optimistic update
      const updatedIds = [...enrollment.progress.completedLessonIds, lessonId];
      setEnrollment((prev) => ({
        ...prev,
        progress: {
          ...prev.progress,
          completedLessonIds: updatedIds,
          percentComplete: Math.round((updatedIds.length / totalLessons) * 100),
        },
      }));

      await completeLessonAction(course.id, course.slug, lessonId);
    });
  };

  const handleNext = () => {
    if (activeLessonIndex < lessons.length - 1) {
      setActiveLessonIndex(activeLessonIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (activeLessonIndex > 0) {
      setActiveLessonIndex(activeLessonIndex - 1);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      {/* Top Header Strip */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-200/80 bg-white p-4 rounded-2xl shadow-xs">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-neutral-200 bg-neutral-50 px-3 text-xs font-semibold text-neutral-700 transition hover:bg-neutral-100"
          >
            <ArrowLeftIcon className="h-3.5 w-3.5" />
            <span>Dashboard</span>
          </Link>
          <div className="hidden sm:block h-5 w-px bg-neutral-200" />
          <div className="min-w-0">
            <span className="text-[11px] font-semibold text-primary-700 uppercase tracking-wide">
              {course.category}
            </span>
            <h1 className="font-heading text-base font-bold text-primary-900 truncate">
              {course.title}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2">
            <div className="text-right">
              <span className="text-xs font-bold text-neutral-900">{percentComplete}% Complete</span>
              <p className="text-[10px] text-neutral-500">
                {completedCount}/{totalLessons} lessons finished
              </p>
            </div>
            <div className="h-2 w-24 rounded-full bg-neutral-100">
              <div
                className="h-2 rounded-full bg-primary-600 transition-all duration-300"
                style={{ width: `${percentComplete}%` }}
              />
            </div>
          </div>

          <WishlistButton
            courseId={course.id}
            courseSlug={course.slug}
            initialWishlisted={isWishlisted}
            className="h-9 px-3 text-xs font-medium border border-neutral-200"
            showLabel={false}
          />

          <button
            type="button"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 text-xs font-medium text-neutral-700 shadow-2xs hover:bg-neutral-50 lg:hidden"
          >
            {sidebarOpen ? <CloseIcon className="h-4 w-4" /> : <MenuIcon className="h-4 w-4" />}
            <span>Curriculum</span>
          </button>
        </div>
      </div>

      {/* Main Theatre Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left / Centre Stage: Active Player & Tabs */}
        <div className={`space-y-6 ${sidebarOpen ? "lg:col-span-8" : "lg:col-span-12"}`}>
          {/* Active Lesson Screen */}
          <div className="overflow-hidden rounded-2xl border border-neutral-200/80 bg-white shadow-sm">
            {activeLesson ? (
              <div>
                {activeLesson.type === "video" ? (
                  activeLesson.videoGuid ? (
                    <div className="relative aspect-video w-full bg-black">
                      <iframe
                        src={getBunnyEmbedUrl(activeLesson.videoGuid)}
                        loading="lazy"
                        allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
                        allowFullScreen
                        className="h-full w-full border-0"
                      />
                    </div>
                  ) : (
                    <div className="flex aspect-video w-full flex-col items-center justify-center bg-neutral-900 p-6 text-center text-white">
                      <PlayIcon className="h-12 w-12 text-neutral-400" />
                      <p className="mt-3 text-sm font-medium">
                        This lesson video will be available shortly.
                      </p>
                    </div>
                  )
                ) : (
                  <div className="bg-primary-950 p-8 text-white">
                    <div className="flex items-center gap-2 text-xs font-semibold text-primary-300 uppercase tracking-wide">
                      <DocumentTextIcon className="h-4 w-4" />
                      <span>Reading & Concept Guide</span>
                    </div>
                    <h2 className="font-heading mt-2 text-xl font-bold">{activeLesson.title}</h2>
                  </div>
                )}

                {/* Lesson Navigation & Action Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-neutral-100 bg-neutral-50/70 p-4">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handlePrevious}
                      disabled={activeLessonIndex === 0}
                      className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-neutral-300 bg-white px-3 text-xs font-medium text-neutral-700 shadow-2xs transition hover:bg-neutral-50 disabled:opacity-40 disabled:hover:bg-white"
                    >
                      <ArrowLeftIcon className="h-3.5 w-3.5" />
                      <span>Previous</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleNext}
                      disabled={activeLessonIndex === lessons.length - 1}
                      className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-neutral-300 bg-white px-3 text-xs font-medium text-neutral-700 shadow-2xs transition hover:bg-neutral-50 disabled:opacity-40 disabled:hover:bg-white"
                    >
                      <span>Next</span>
                      <ArrowRightIcon className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    {isLessonCompleted ? (
                      <span className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-emerald-50 px-3.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
                        <CheckCircleIcon className="h-4 w-4 text-emerald-600" />
                        <span>Completed</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => handleMarkComplete(activeLesson.id)}
                        className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary-900 px-4 text-xs font-semibold text-white shadow-xs transition hover:bg-primary-800 disabled:opacity-50"
                      >
                        <CheckIcon className="h-3.5 w-3.5" />
                        <span>{isPending ? "Updating..." : "Mark as Complete"}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-sm text-neutral-500">
                No lessons available for this course.
              </div>
            )}
          </div>

          {/* Under-Player Navigation Tabs */}
          <div className="rounded-2xl border border-neutral-200/80 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 border-b border-neutral-200 pb-3">
              <button
                type="button"
                onClick={() => setActiveTab("overview")}
                className={`rounded-lg px-4 py-2 text-xs font-bold transition ${
                  activeTab === "overview"
                    ? "bg-primary-900 text-white shadow-xs"
                    : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100"
                }`}
              >
                Lesson Overview
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("notes")}
                className={`rounded-lg px-4 py-2 text-xs font-bold transition ${
                  activeTab === "notes"
                    ? "bg-primary-900 text-white shadow-xs"
                    : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100"
                }`}
              >
                My Study Notes
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("assessment")}
                className={`rounded-lg px-4 py-2 text-xs font-bold transition ${
                  activeTab === "assessment"
                    ? "bg-primary-900 text-white shadow-xs"
                    : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100"
                }`}
              >
                {hasAssessment ? "Assessment & Quiz" : "Certificate"}
              </button>
            </div>

            <div className="mt-6">
              {/* Tab 1: Overview */}
              {activeTab === "overview" && activeLesson && (
                <div className="space-y-6">
                  <div>
                    <h2 className="font-heading text-lg font-bold text-primary-900">
                      {activeLessonIndex + 1}. {activeLesson.title}
                    </h2>
                    {activeLesson.content ? (
                      <p className="mt-3 whitespace-pre-line text-sm text-neutral-700 leading-relaxed">
                        {activeLesson.content}
                      </p>
                    ) : (
                      <p className="mt-2 text-sm text-neutral-500">
                        Follow along with the instructor in this video lesson. Take notes or review key concepts below.
                      </p>
                    )}
                  </div>

                  {/* Instructor Bio Strip */}
                  <div className="flex items-center gap-3 rounded-xl bg-neutral-50 p-4 border border-neutral-200/80">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-100">
                      {tutor?.photoURL ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={tutor.photoURL} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <ImagePlaceholderIcon className="h-4 w-4 text-primary-600" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-neutral-900">
                        {tutor?.displayName ?? "Private Instructor"}
                      </p>
                      <p className="text-[11px] text-neutral-500">
                        {tutor?.bio ?? "Verified Fashion & Craft Instructor on FASMEN"}
                      </p>
                    </div>
                  </div>

                  {/* Downloadable Resources & Practical Attachments */}
                  <div className="rounded-xl border border-neutral-200 bg-white p-4">
                    <h3 className="text-xs font-bold text-primary-900 uppercase tracking-wide mb-3">
                      Lesson Resources & Practical Guides
                    </h3>
                    <div className="grid gap-2.5 sm:grid-cols-2">
                      <div className="flex items-center justify-between rounded-lg border border-neutral-200 bg-neutral-50/60 p-3">
                        <div className="flex items-center gap-2.5">
                          <DocumentTextIcon className="h-5 w-5 text-primary-700" />
                          <div>
                            <p className="text-xs font-semibold text-neutral-900">
                              Lesson Companion Guide.pdf
                            </p>
                            <p className="text-[10px] text-neutral-500">Official Study Notes · 1.2 MB</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => alert("Companion guide downloaded.")}
                          className="rounded-md p-1.5 text-neutral-600 hover:bg-neutral-200 hover:text-neutral-900"
                        >
                          <DownloadIcon className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between rounded-lg border border-neutral-200 bg-neutral-50/60 p-3">
                        <div className="flex items-center gap-2.5">
                          <AcademicCapIcon className="h-5 w-5 text-accent-600" />
                          <div>
                            <p className="text-xs font-semibold text-neutral-900">
                              Practical Measurement Sheet
                            </p>
                            <p className="text-[10px] text-neutral-500">Template · 450 KB</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => alert("Measurement template downloaded.")}
                          className="rounded-md p-1.5 text-neutral-600 hover:bg-neutral-200 hover:text-neutral-900"
                        >
                          <DownloadIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Notes */}
              {activeTab === "notes" && activeLesson && (
                <LessonNotesView
                  courseId={course.id}
                  courseSlug={course.slug}
                  courseTitle={course.title}
                  activeLesson={activeLesson}
                  initialNotes={initialNotes}
                />
              )}

              {/* Tab 3: Assessment or Certificate */}
              {activeTab === "assessment" && (
                <div className="space-y-4">
                  {hasAssessment ? (
                    <>
                      <div className="flex items-start justify-between">
                        <div>
                          <h2 className="font-heading text-lg font-bold text-primary-900">
                            Course Final Assessment
                          </h2>
                          <p className="mt-1 text-xs text-neutral-600">
                            Test your mastery of this course to earn your verified certificate.
                          </p>
                        </div>

                        <span className="inline-flex rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-800">
                          Pass Mark: {course.passThresholdPercent}%
                        </span>
                      </div>

                      <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-neutral-600">Attempts Used:</span>
                          <span className="font-bold text-neutral-900">
                            {enrollment.assessment.attemptsUsed} / {course.maxAttempts}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-neutral-600">Best Score:</span>
                          <span className="font-bold text-neutral-900">
                            {enrollment.assessment.bestScorePercent !== null
                              ? `${enrollment.assessment.bestScorePercent}%`
                              : "Not taken yet"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-neutral-600">Certification Status:</span>
                          <span
                            className={`font-bold ${
                              enrollment.assessment.passed ? "text-emerald-600" : "text-amber-600"
                            }`}
                          >
                            {enrollment.assessment.passed ? "Passed & Issued" : "Pending completion"}
                          </span>
                        </div>
                      </div>

                      {allLessonsCompleted ? (
                        <div className="pt-2">
                          <Link
                            href={`/dashboard/learn/${course.slug}/assessment`}
                            className="inline-flex h-10 items-center gap-2 rounded-xl bg-accent-600 px-6 text-xs font-semibold text-white transition hover:brightness-105 shadow-sm"
                          >
                            <AcademicCapIcon className="h-4 w-4" />
                            <span>
                              {enrollment.assessment.passed ? "View Assessment Results" : "Take Assessment"}
                            </span>
                          </Link>
                        </div>
                      ) : (
                        <p className="text-xs text-neutral-500 font-medium">
                          🔒 Complete all {totalLessons} lessons to unlock the course assessment.
                        </p>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="flex items-start justify-between">
                        <div>
                          <h2 className="font-heading text-lg font-bold text-primary-900">
                            Course Certification
                          </h2>
                          <p className="mt-1 text-xs text-neutral-600">
                            No quiz or assessment is required for this course. Complete all lessons to receive your official certificate.
                          </p>
                        </div>

                        <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                          Automatic Certification
                        </span>
                      </div>

                      <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-neutral-600">Completion Status:</span>
                          <span className="font-bold text-neutral-900">
                            {completedCount} / {totalLessons} Lessons Finished ({percentComplete}%)
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-neutral-600">Certificate Status:</span>
                          <span
                            className={`font-bold ${
                              allLessonsCompleted ? "text-emerald-600" : "text-amber-600"
                            }`}
                          >
                            {allLessonsCompleted ? "Issued & Ready ✓" : "Awarded upon 100% completion"}
                          </span>
                        </div>
                      </div>

                      {allLessonsCompleted ? (
                        <div className="pt-2">
                          <Link
                            href={`/dashboard/learn/${course.slug}/assessment`}
                            className="inline-flex h-10 items-center gap-2 rounded-xl bg-accent-600 px-6 text-xs font-semibold text-white transition hover:brightness-105 shadow-sm"
                          >
                            <AcademicCapIcon className="h-4 w-4" />
                            <span>View Verified Certificate</span>
                          </Link>
                        </div>
                      ) : (
                        <p className="text-xs text-neutral-500 font-medium">
                          Complete the remaining {totalLessons - completedCount} lesson(s) to automatically receive your verified certificate.
                        </p>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Stage: Collapsible Curriculum Playlist Drawer */}
        {sidebarOpen && (
          <div className="lg:col-span-4 space-y-4">
            <div className="overflow-hidden rounded-2xl border border-neutral-200/80 bg-white shadow-sm">
              <div className="border-b border-neutral-100 bg-neutral-50/80 p-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-heading text-sm font-bold text-primary-900">
                    Course Curriculum
                  </h3>
                  <span className="text-xs font-semibold text-neutral-500">
                    {completedCount}/{totalLessons}
                  </span>
                </div>
                <div className="mt-2 h-1.5 w-full rounded-full bg-neutral-200">
                  <div
                    className="h-1.5 rounded-full bg-primary-600 transition-all duration-300"
                    style={{ width: `${percentComplete}%` }}
                  />
                </div>
              </div>

              {/* Playlist items */}
              <div className="max-h-[600px] overflow-y-auto divide-y divide-neutral-100">
                {lessons.map((lesson, idx) => {
                  const isActive = idx === activeLessonIndex;
                  const isCompleted = enrollment.progress.completedLessonIds.includes(lesson.id);

                  return (
                    <button
                      key={lesson.id}
                      type="button"
                      onClick={() => setActiveLessonIndex(idx)}
                      className={`w-full text-left p-3.5 transition-all flex items-start gap-3 ${
                        isActive
                          ? "bg-primary-50/80 border-l-4 border-primary-700 text-primary-900"
                          : "hover:bg-neutral-50 text-neutral-800"
                      }`}
                    >
                      <div className="mt-0.5 shrink-0">
                        {isCompleted ? (
                          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white">
                            <CheckIcon className="h-3 w-3" />
                          </div>
                        ) : (
                          <div
                            className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold ${
                              isActive
                                ? "bg-primary-900 text-white"
                                : "bg-neutral-200 text-neutral-600"
                            }`}
                          >
                            {idx + 1}
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p
                          className={`text-xs font-semibold leading-snug line-clamp-2 ${
                            isActive ? "text-primary-900 font-bold" : "text-neutral-800"
                          }`}
                        >
                          {lesson.title}
                        </p>
                        <div className="mt-1 flex items-center gap-2 text-[10px] text-neutral-500">
                          <span className="capitalize">{lesson.type}</span>
                          {lesson.videoDurationSeconds ? (
                            <>
                              <span>·</span>
                              <span>{formatDuration(lesson.videoDurationSeconds)}</span>
                            </>
                          ) : null}
                        </div>
                      </div>
                    </button>
                  );
                })}

                {/* Final Assessment or Certificate Item */}
                <div
                  className={`p-3.5 flex items-center justify-between border-t border-neutral-200 ${
                    allLessonsCompleted ? "bg-amber-50/60" : "bg-neutral-50/40 opacity-70"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`flex h-6 w-6 items-center justify-center rounded-full ${
                        allLessonsCompleted || enrollment.assessment.passed
                          ? "bg-emerald-500 text-white"
                          : "bg-neutral-200 text-neutral-500"
                      }`}
                    >
                      <AcademicCapIcon className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-neutral-900">
                        {hasAssessment ? "Final Assessment" : "Course Certificate"}
                      </p>
                      <p className="text-[10px] text-neutral-500">
                        {hasAssessment
                          ? allLessonsCompleted
                            ? "Unlocked"
                            : "Locked"
                          : allLessonsCompleted
                          ? "Issued & Ready ✓"
                          : "Earned on completion"}
                      </p>
                    </div>
                  </div>

                  {allLessonsCompleted && (
                    <Link
                      href={`/dashboard/learn/${course.slug}/assessment`}
                      className="text-xs font-bold text-accent-700 hover:underline"
                    >
                      {hasAssessment ? "Start →" : "View →"}
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
