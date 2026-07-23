"use client";

import { useState } from "react";
import type { Course } from "@/lib/courses";
import { categoryName } from "@/lib/categories";
import { formatNaira } from "@/lib/currency";
import { EditCourseForm } from "./EditCourseForm";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-NG", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function CourseDetailsSection({
  course,
  initialEditing,
}: {
  course: Course;
  initialEditing: boolean;
}) {
  const [editing, setEditing] = useState(initialEditing);

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-lg font-semibold text-primary-900">Course details</h2>
        {!editing && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="h-9 rounded-md border border-primary-700 px-4 text-sm font-medium text-primary-700 transition hover:bg-primary-100"
          >
            Edit
          </button>
        )}
      </div>

      {editing ? (
        <>
          <EditCourseForm course={course} />
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="mt-3 text-sm font-medium text-neutral-700 hover:underline"
          >
            Done editing
          </button>
        </>
      ) : (
        <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 rounded-lg bg-white p-6 text-sm shadow-[0_1px_3px_rgba(18,22,28,0.08)]">
          <div>
            <dt className="text-neutral-700">Category</dt>
            <dd className="font-medium text-neutral-900">{categoryName(course.category)}</dd>
          </div>
          <div>
            <dt className="text-neutral-700">Level</dt>
            <dd className="font-medium text-neutral-900 capitalize">{course.level}</dd>
          </div>
          <div>
            <dt className="text-neutral-700">Language</dt>
            <dd className="font-medium text-neutral-900">{course.language}</dd>
          </div>
          <div>
            <dt className="text-neutral-700">Price</dt>
            <dd className="font-medium text-neutral-900">{formatNaira(course.price)}</dd>
          </div>
          <div>
            <dt className="text-neutral-700">Pass threshold</dt>
            <dd className="font-medium text-neutral-900">{course.passThresholdPercent}%</dd>
          </div>
          <div>
            <dt className="text-neutral-700">Quiz attempts</dt>
            <dd className="font-medium text-neutral-900">{course.maxAttempts}</dd>
          </div>
          <div>
            <dt className="text-neutral-700">Rating</dt>
            <dd className="font-medium text-neutral-900">
              {course.reviewCount > 0
                ? `★ ${course.averageRating.toFixed(1)} (${course.reviewCount})`
                : "No ratings yet"}
            </dd>
          </div>
          <div>
            <dt className="text-neutral-700">Date created</dt>
            <dd className="font-medium text-neutral-900">{formatDate(course.createdAt)}</dd>
          </div>
          {course.publishedAt && (
            <div>
              <dt className="text-neutral-700">Published</dt>
              <dd className="font-medium text-neutral-900">{formatDate(course.publishedAt)}</dd>
            </div>
          )}
          {course.tags.length > 0 && (
            <div className="col-span-2">
              <dt className="text-neutral-700">Tags</dt>
              <dd className="font-medium text-neutral-900">{course.tags.join(", ")}</dd>
            </div>
          )}
        </dl>
      )}
    </div>
  );
}
