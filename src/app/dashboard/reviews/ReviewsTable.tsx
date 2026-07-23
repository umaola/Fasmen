"use client";

import { useState } from "react";
import type { TutorReview } from "@/lib/reviews";

function Stars({ rating }: { rating: number }) {
  return (
    <span className="text-primary-700" aria-label={`${rating} out of 5 stars`}>
      {"★".repeat(rating)}
      <span className="text-neutral-200">{"★".repeat(5 - rating)}</span>
    </span>
  );
}

export function ReviewsTable({
  reviews,
  courses,
}: {
  reviews: TutorReview[];
  courses: { id: string; title: string }[];
}) {
  const [courseId, setCourseId] = useState("all");

  const filtered = courseId === "all" ? reviews : reviews.filter((r) => r.courseId === courseId);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <label htmlFor="courseFilter" className="text-sm font-medium text-neutral-900">
          Course
        </label>
        <select
          id="courseFilter"
          value={courseId}
          onChange={(e) => setCourseId(e.target.value)}
          className="h-10 rounded-sm border border-neutral-200 bg-white px-3 text-sm outline-none focus:border-primary-500"
        >
          <option value="all">All courses</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <p className="mt-6 text-sm text-neutral-700">
          {courseId === "all" ? "No reviews yet." : "No reviews for this course yet."}
        </p>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-lg bg-white shadow-[0_1px_3px_rgba(18,22,28,0.08)]">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-neutral-200 text-neutral-700">
                <th className="px-4 py-3 font-medium">Student</th>
                <th className="px-4 py-3 font-medium">Rating</th>
                <th className="px-4 py-3 font-medium">Review</th>
                <th className="px-4 py-3 font-medium">Course</th>
                <th className="px-4 py-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((review) => (
                <tr key={review.id} className="border-b border-neutral-200 last:border-0 align-top">
                  <td className="px-4 py-3 whitespace-nowrap text-neutral-900">
                    {review.studentName}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <Stars rating={review.rating} />
                  </td>
                  <td className="px-4 py-3 text-neutral-700">{review.comment || "—"}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-neutral-700">
                    {review.courseTitle}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-neutral-700">
                    {new Date(review.createdAt).toLocaleDateString("en-NG", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
