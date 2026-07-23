"use client";

import { useMemo, useState } from "react";
import type { Course } from "@/lib/courses";
import { StatusChip } from "@/components/StatusChip";
import { Pagination } from "@/components/Pagination";
import { SearchIcon } from "@/components/icons";
import { categoryName } from "@/lib/categories";
import { formatNaira } from "@/lib/currency";
import { CourseRowActions } from "./CourseRowActions";

const PAGE_SIZE = 8;

export function CoursesTable({ courses }: { courses: Course[] }) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return courses;
    return courses.filter((c) => c.title.toLowerCase().includes(q));
  }, [courses, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div>
      <div className="relative max-w-md">
        <SearchIcon className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-neutral-700" />
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search here..."
          className="h-11 w-full rounded-md border border-neutral-200 bg-white pl-10 pr-4 text-sm outline-none focus:border-primary-500"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="mx-auto mt-10 max-w-md rounded-lg border border-dashed border-neutral-200 bg-white p-10 text-center">
          <h2 className="font-heading text-lg font-semibold text-primary-900">
            {courses.length === 0 ? "No courses yet" : "No courses match your search"}
          </h2>
          <p className="mt-2 text-sm text-neutral-700">
            {courses.length === 0
              ? "Create your first course draft to get started."
              : "Try a different search term."}
          </p>
        </div>
      ) : (
        <div className="mt-6 overflow-hidden overflow-x-auto rounded-lg bg-white shadow-[0_1px_3px_rgba(18,22,28,0.08)]">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-200 text-neutral-700">
                <th className="px-4 py-3 font-medium">Course ID</th>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Level</th>
                <th className="px-4 py-3 font-medium">Date created</th>
                <th className="px-4 py-3 font-medium">Price</th>
                <th className="px-4 py-3 font-medium">Students</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((course) => (
                <tr key={course.id} className="border-b border-neutral-200 last:border-0">
                  <td className="px-4 py-3 whitespace-nowrap text-neutral-700">
                    {course.id.slice(0, 8)}
                  </td>
                  <td className="px-4 py-3 font-medium whitespace-nowrap text-neutral-900">
                    {course.title}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-neutral-700">
                    {categoryName(course.category)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-neutral-700 capitalize">
                    {course.level}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-neutral-700">
                    {new Date(course.createdAt).toLocaleDateString("en-NG", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-neutral-700">
                    {formatNaira(course.price)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-neutral-700">
                    {course.enrollmentCount}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <StatusChip status={course.status} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <CourseRowActions course={course} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-6">
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setPage} />
      </div>
    </div>
  );
}
