import Link from "next/link";
import Image from "next/image";
import type { Course } from "@/lib/courses";
import { categoryName } from "@/lib/categories";

export function CourseCard({ course }: { course: Course }) {
  if (!course) return null;

  const title = course.title || "Untitled Course";
  const slug = course.slug || course.id || "";
  const tutorName = course.tutorName || "Instructor";
  const category = course.category || "";
  const reviewCount = Number(course.reviewCount) || 0;
  const averageRating = Number(course.averageRating) || 0;
  const price = typeof course.price === "number" ? course.price : 0;
  const initial = title.charAt(0).toUpperCase() || "C";

  return (
    <Link
      href={`/courses/${slug}`}
      className="block overflow-hidden rounded-lg bg-white shadow-[0_1px_3px_rgba(18,22,28,0.08)] transition hover:shadow-[0_4px_12px_rgba(18,22,28,0.10)] hover:scale-[1.01]"
    >
      <div className="relative flex aspect-video items-center justify-center bg-primary-100 overflow-hidden">
        {course.thumbnailUrl ? (
          <Image
            src={course.thumbnailUrl}
            alt={title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover"
          />
        ) : (
          <span className="font-heading text-3xl font-bold text-primary-700">
            {initial}
          </span>
        )}
      </div>
      <div className="p-4">
        <span className="inline-flex rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-700">
          {categoryName(category)}
        </span>
        <h3 className="font-heading mt-2 text-lg font-semibold text-primary-900 line-clamp-1">
          {title}
        </h3>
        <p className="mt-1 text-sm text-neutral-700">by {tutorName}</p>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-sm text-neutral-700">
            {reviewCount > 0
              ? `★ ${averageRating.toFixed(1)} (${reviewCount})`
              : "No reviews yet"}
          </span>
          <span className="font-semibold text-primary-900">
            {(price / 100).toLocaleString("en-NG", {
              style: "currency",
              currency: "NGN",
              maximumFractionDigits: 0,
            })}
          </span>
        </div>
      </div>
    </Link>
  );
}
