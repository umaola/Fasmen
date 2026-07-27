import Link from "next/link";
import type { Course } from "@/lib/courses";
import { categoryName } from "@/lib/categories";

export function CourseCard({ course }: { course: Course }) {
  return (
    <Link
      href={`/courses/${course.slug}`}
      className="block overflow-hidden rounded-lg bg-white shadow-[0_1px_3px_rgba(18,22,28,0.08)] transition hover:shadow-[0_4px_12px_rgba(18,22,28,0.10)] hover:scale-[1.01]"
    >
      <div className="flex aspect-video items-center justify-center bg-primary-100">
        {course.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={course.thumbnailUrl}
            alt={course.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="font-heading text-3xl font-bold text-primary-700">
            {course.title.charAt(0).toUpperCase()}
          </span>
        )}
      </div>
      <div className="p-4">
        <span className="inline-flex rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-700">
          {categoryName(course.category)}
        </span>
        <h3 className="font-heading mt-2 text-lg font-semibold text-primary-900">
          {course.title}
        </h3>
        <p className="mt-1 text-sm text-neutral-700">by {course.tutorName}</p>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-sm text-neutral-700">
            {course.reviewCount > 0
              ? `★ ${course.averageRating.toFixed(1)} (${course.reviewCount})`
              : "No reviews yet"}
          </span>
          <span className="font-semibold text-primary-900">
            {(course.price / 100).toLocaleString("en-NG", {
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
