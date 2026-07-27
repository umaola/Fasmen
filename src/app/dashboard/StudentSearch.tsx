"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { SearchIcon } from "@/components/icons";

export function StudentSearch({
  courses,
}: {
  courses: { slug: string; title: string }[];
}) {
  const [query, setQuery] = useState("");

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return courses.filter((c) => c.title.toLowerCase().includes(q));
  }, [courses, query]);

  const trimmedQuery = query.trim();

  return (
    <form action="/courses" method="GET" className="relative w-full">
      <SearchIcon className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-neutral-700" />
      <input
        type="text"
        name="q"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search courses..."
        className="h-12 w-full rounded-full border border-neutral-200 bg-white pl-11 pr-4 text-sm outline-none focus:border-primary-500"
      />
      {trimmedQuery && (
        <div className="absolute top-full right-0 left-0 z-10 mt-1 overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-[0_4px_16px_rgba(18,22,28,0.12)]">
          {matches.length > 0 && (
            <div>
              <p className="px-4 pt-3 text-xs font-medium text-neutral-400 uppercase">
                Your courses
              </p>
              {matches.map((c) => (
                <Link
                  key={c.slug}
                  href={`/dashboard/learn/${c.slug}`}
                  className="block px-4 py-2.5 text-sm text-neutral-900 hover:bg-neutral-100"
                >
                  {c.title}
                </Link>
              ))}
            </div>
          )}
          <Link
            href={`/courses?q=${encodeURIComponent(trimmedQuery)}`}
            className="block border-t border-neutral-200 px-4 py-2.5 text-sm font-medium text-primary-700 hover:bg-neutral-100"
          >
            Browse all courses for &ldquo;{trimmedQuery}&rdquo;
          </Link>
        </div>
      )}
    </form>
  );
}
