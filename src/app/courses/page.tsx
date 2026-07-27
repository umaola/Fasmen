import { listPublishedCourses } from "@/lib/courses";
import { CATEGORIES } from "@/lib/categories";
import { CourseCard } from "@/components/CourseCard";
import { BackButton } from "./BackButton";

export default async function CourseCatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  const { q, category } = await searchParams;
  const courses = await listPublishedCourses({ search: q, category });

  return (
    <main className="flex-1 px-6 py-12">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center justify-between">
          <h1 className="font-heading text-2xl font-bold text-primary-900">Browse courses</h1>
          <BackButton />
        </div>

        <form method="GET" className="mt-6 flex flex-col gap-3 sm:flex-row">
          <input
            type="text"
            name="q"
            defaultValue={q ?? ""}
            placeholder="Search by keyword..."
            className="h-11 flex-1 rounded-sm border border-neutral-200 bg-white px-3 text-base outline-none focus:border-primary-500"
          />
          <select
            name="category"
            defaultValue={category ?? ""}
            className="h-11 rounded-sm border border-neutral-200 bg-white px-3 text-base outline-none focus:border-primary-500"
          >
            <option value="">All categories</option>
            {CATEGORIES.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="h-11 rounded-md bg-primary-700 px-6 font-medium text-white transition hover:bg-primary-900"
          >
            Search
          </button>
        </form>

        {courses.length === 0 ? (
          <div className="mx-auto mt-16 max-w-md rounded-lg border border-dashed border-neutral-200 bg-white p-10 text-center">
            <h2 className="font-heading text-lg font-semibold text-primary-900">
              No courses found
            </h2>
            <p className="mt-2 text-sm text-neutral-700">
              {q || category
                ? "Try a different search term or category."
                : "No courses have been published yet — check back soon."}
            </p>
          </div>
        ) : (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
