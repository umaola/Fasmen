import Link from "next/link";
import Image from "next/image";
import type { Course } from "@/lib/courses";
import { categoryName } from "@/lib/categories";
import { formatNaira } from "@/lib/currency";
import { StarIcon, AcademicCapIcon, CheckCircleIcon } from "@/components/icons";

export function CourseCard({ course }: { course: Course }) {
  if (!course) return null;

  const title = course.title || "Untitled Course";
  const slug = course.slug || course.id || "";
  const tutorName = course.tutorName || "Instructor";
  const category = course.category || "";
  const reviewCount = Number(course.reviewCount) || 0;
  const averageRating = Number(course.averageRating) || 0;
  const price = typeof course.price === "number" ? course.price : 0;
  const initial = title.charAt(0).toUpperCase() || "F";
  const totalLessons = course.totalLessons || 0;
  const level = course.level || "beginner";

  return (
    <Link
      href={`/courses/${slug}`}
      className="group flex flex-col overflow-hidden rounded-xl bg-white border border-neutral-200/80 shadow-[0_1px_3px_rgba(18,22,28,0.06)] transition-all duration-300 hover:shadow-[0_12px_24px_rgba(11,37,69,0.10)] hover:-translate-y-1"
    >
      {/* 16:9 Thumbnail Shell with Overlays */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-primary-950">
        {course.thumbnailUrl ? (
          <Image
            src={course.thumbnailUrl}
            alt={title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary-900 via-primary-800 to-primary-950 text-white">
            <span className="font-heading text-4xl font-bold tracking-wider text-primary-200/90">
              {initial}
            </span>
          </div>
        )}

        {/* Subtle Dark Gradient Overlay at Bottom */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />

        {/* Category Pill (Top-Left) */}
        <div className="absolute top-3 left-3">
          <span className="inline-flex items-center rounded-full bg-white/95 backdrop-blur-md px-2.5 py-1 text-[11px] font-semibold text-primary-900 shadow-sm">
            {categoryName(category)}
          </span>
        </div>

        {/* Difficulty Level (Top-Right) */}
        <div className="absolute top-3 right-3">
          <span className="inline-flex items-center rounded-full bg-primary-900/80 backdrop-blur-md px-2.5 py-0.5 text-[11px] font-medium capitalize text-primary-100 border border-primary-700/50">
            {level}
          </span>
        </div>

        {/* Certificate Badge (Bottom-Left) */}
        <div className="absolute bottom-2.5 left-3">
          <span className="inline-flex items-center gap-1 rounded-md bg-black/40 backdrop-blur-md px-2 py-0.5 text-[10px] font-medium text-white/90 border border-white/10">
            <AcademicCapIcon className="h-3 w-3 text-accent-400" />
            <span>Certificate Included</span>
          </span>
        </div>
      </div>

      {/* Card Content Body */}
      <div className="flex flex-1 flex-col p-5">
        {/* Instructor Byline */}
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-100 text-[11px] font-bold text-primary-800 shrink-0">
            {tutorName.slice(0, 2).toUpperCase()}
          </div>
          <span className="text-xs font-medium text-neutral-600 truncate">
            {tutorName}
          </span>
          <CheckCircleIcon className="h-3.5 w-3.5 text-primary-600 shrink-0" />
        </div>

        {/* Course Title */}
        <h3 className="font-heading mt-2 text-base font-bold text-primary-900 group-hover:text-primary-700 transition-colors line-clamp-2 leading-snug">
          {title}
        </h3>

        {/* Course Description Preview */}
        {course.description && (
          <p className="mt-1.5 text-xs text-neutral-600 line-clamp-2 leading-relaxed">
            {course.description}
          </p>
        )}

        {/* Metadata Strip: Lessons & Rating */}
        <div className="mt-4 flex items-center justify-between text-xs text-neutral-600 border-t border-neutral-100 pt-3">
          <span className="font-medium text-neutral-700">
            {totalLessons} {totalLessons === 1 ? "Lesson" : "Lessons"}
          </span>

          <div className="flex items-center gap-1">
            <StarIcon className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
            <span className="font-semibold text-neutral-900">
              {averageRating > 0 ? averageRating.toFixed(1) : "New"}
            </span>
            {reviewCount > 0 && (
              <span className="text-neutral-500">({reviewCount})</span>
            )}
          </div>
        </div>

        {/* Price & Action Row */}
        <div className="mt-3 flex items-center justify-between pt-2 border-t border-neutral-100">
          <div>
            {price === 0 ? (
              <span className="font-heading text-lg font-bold text-success-600">
                Free
              </span>
            ) : (
              <span className="font-heading text-lg font-bold text-primary-900">
                {formatNaira(price)}
              </span>
            )}
          </div>

          <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary-700 group-hover:text-accent-600 transition-colors">
            <span>View</span>
            <span className="transition-transform duration-300 group-hover:translate-x-0.5">→</span>
          </span>
        </div>
      </div>
    </Link>
  );
}
