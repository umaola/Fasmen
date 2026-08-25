"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { Course } from "@/lib/courses";
import { deleteCourseAction } from "@/app/actions/courses";
import { MoreVerticalIcon } from "@/components/icons";

export function CourseRowActions({ course }: { course: Course }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  return (
    <>
      <div className="relative inline-block" ref={menuRef}>
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Row actions"
          className="flex h-8 w-8 items-center justify-center rounded-md text-neutral-700 transition hover:bg-neutral-100"
        >
          <MoreVerticalIcon className="h-5 w-5" />
        </button>

        {menuOpen && (
          <div className="absolute right-0 bottom-full z-10 mb-1 w-36 rounded-md border border-neutral-200 bg-white py-1 shadow-[0_4px_16px_rgba(18,22,28,0.12)]">
            <Link
              href={`/dashboard/courses/${course.id}?step=5`}
              className="block w-full px-4 py-2 text-left text-sm text-neutral-900 hover:bg-neutral-100"
            >
              View summary
            </Link>
            <Link
              href={`/dashboard/courses/${course.id}?step=1`}
              className="block w-full px-4 py-2 text-left text-sm text-neutral-900 hover:bg-neutral-100"
            >
              Edit course
            </Link>
            <button
              type="button"
              onClick={() => {
                setDeleteOpen(true);
                setMenuOpen(false);
              }}
              className="block w-full px-4 py-2 text-left text-sm text-error-600 hover:bg-neutral-100"
            >
              Delete
            </button>
          </div>
        )}
      </div>

      {deleteOpen && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-[rgba(18,22,28,0.4)] p-4"
          onClick={() => setDeleteOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-lg bg-white p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-heading text-lg font-semibold text-primary-900">Delete course</h2>
            {course.enrollmentCount > 0 ? (
              <>
                <p className="mt-2 text-sm text-neutral-700">
                  &ldquo;{course.title}&rdquo; has enrolled students, so it can&apos;t be deleted.
                </p>
                <button
                  type="button"
                  onClick={() => setDeleteOpen(false)}
                  className="mt-5 h-10 w-full rounded-md border border-neutral-200 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100"
                >
                  Close
                </button>
              </>
            ) : (
              <>
                <p className="mt-2 text-sm text-neutral-700">
                  Delete &ldquo;{course.title}&rdquo; permanently? This can&apos;t be undone.
                </p>
                <div className="mt-5 flex gap-3">
                  <form action={deleteCourseAction.bind(null, course.id)} className="flex-1">
                    <button
                      type="submit"
                      className="h-10 w-full rounded-md bg-error-600 text-sm font-medium text-white transition hover:brightness-95"
                    >
                      Yes, delete it
                    </button>
                  </form>
                  <button
                    type="button"
                    onClick={() => setDeleteOpen(false)}
                    className="h-10 flex-1 rounded-md border border-neutral-200 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
