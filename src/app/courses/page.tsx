import Link from "next/link";
import { listPublishedCourses, type Course } from "@/lib/courses";
import { CATEGORIES } from "@/lib/categories";
import { CourseCard } from "@/components/CourseCard";
import { SearchIcon, BookIcon, SparklesIcon } from "@/components/icons";
import { getCurrentUser } from "@/lib/dal";
import { getStudentWishlistCourseIds } from "@/lib/wishlist";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function CourseCatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; level?: string; price?: string }>;
}) {
  const { q, category, level, price } = await searchParams;
  let allPublished: Course[] = [];
  let wishlistCourseIds: string[] = [];

  try {
    const [courses, user] = await Promise.all([
      listPublishedCourses({ search: q, category }),
      getCurrentUser().catch(() => null),
    ]);
    allPublished = courses;
    if (user?.role === "student") {
      wishlistCourseIds = await getStudentWishlistCourseIds(user.id);
    }
  } catch (err) {
    console.error("CourseCatalogPage: failed to load courses:", err);
  }

  // Client / runtime filter for level and price
  const filteredCourses = allPublished.filter((c) => {
    if (level && level !== "all" && c.level !== level) return false;
    if (price === "free" && c.price !== 0) return false;
    if (price === "paid" && c.price === 0) return false;
    return true;
  });

  const hasActiveFilters = Boolean(q || category || (level && level !== "all") || (price && price !== "all"));

  return (
    <main className="min-h-screen bg-neutral-100/70 pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-primary-950 text-white pt-10 pb-12 px-4 sm:px-6 lg:px-8 border-b border-primary-800/40">
        {/* Subtle Ambient Radial Glows */}
        <div className="absolute top-0 right-1/4 -mt-12 h-96 w-96 rounded-full bg-primary-600/15 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-12 h-80 w-80 rounded-full bg-accent-500/10 blur-3xl pointer-events-none" />

        <div className="relative mx-auto max-w-6xl">
          {/* Top Breadcrumb */}
          <div className="flex items-center gap-2 text-xs text-primary-200/80 mb-5">
            <Link href="/" className="hover:text-white transition">Home</Link>
            <span>/</span>
            <span className="text-white font-medium">Courses</span>
          </div>

          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary-900/80 border border-primary-700/60 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-accent-400 mb-3.5 shadow-inner">
              <SparklesIcon className="h-3.5 w-3.5" />
              <span>Certified Industry Education</span>
            </div>

            <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white leading-tight">
              Explore Certified Courses & Master Real-World Skills
            </h1>

            <p className="mt-3.5 text-base sm:text-lg text-primary-100/90 leading-relaxed font-normal">
              Learn directly from vetted instructors with video lessons, practical assignments, and verifiable certificates of completion upon graduation.
            </p>
          </div>

          {/* Search Input Box */}
          <div className="mt-7 max-w-2xl">
            <form method="GET" className="relative flex items-center">
              <input type="hidden" name="category" value={category || ""} />
              <input type="hidden" name="level" value={level || ""} />
              <input type="hidden" name="price" value={price || ""} />

              <div className="relative flex-1">
                <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400 pointer-events-none" />
                <input
                  type="text"
                  name="q"
                  defaultValue={q ?? ""}
                  placeholder="Search courses by topic, skill, or keyword..."
                  className="h-12 w-full rounded-xl bg-white pl-12 pr-4 text-sm text-neutral-900 placeholder-neutral-400 shadow-md outline-none transition focus:ring-2 focus:ring-accent-500"
                />
              </div>

              <button
                type="submit"
                className="absolute right-1.5 h-9 rounded-lg bg-primary-700 px-4 text-xs font-semibold text-white transition hover:bg-primary-800 shadow-sm cursor-pointer"
              >
                Search
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Main Content Area: Category Filter Pills & Catalog */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Horizontal Category Filter Pills Card */}
        <div className="rounded-xl bg-white p-3 shadow-[0_1px_4px_rgba(11,37,69,0.06)] border border-neutral-200/80">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <Link
              href={`/courses?${new URLSearchParams({
                ...(q ? { q } : {}),
                ...(level ? { level } : {}),
                ...(price ? { price } : {}),
              }).toString()}`}
              className={`shrink-0 rounded-lg px-4 py-2 text-xs font-semibold transition ${
                !category
                  ? "bg-primary-900 text-white shadow-sm"
                  : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200/80 hover:text-neutral-900"
              }`}
            >
              All Categories
            </Link>

            {CATEGORIES.map((cat) => {
              const isActive = category === cat.slug;
              const params = new URLSearchParams({
                category: cat.slug,
                ...(q ? { q } : {}),
                ...(level ? { level } : {}),
                ...(price ? { price } : {}),
              });

              return (
                <Link
                  key={cat.slug}
                  href={`/courses?${params.toString()}`}
                  className={`shrink-0 rounded-lg px-4 py-2 text-xs font-semibold transition ${
                    isActive
                      ? "bg-primary-900 text-white shadow-sm"
                      : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200/80 hover:text-neutral-900"
                  }`}
                >
                  {cat.name}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Level & Price Refinement Toolbar */}
        <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-neutral-900">
              {filteredCourses.length} Course{filteredCourses.length === 1 ? "" : "s"} Available
            </span>
            {hasActiveFilters && (
              <Link
                href="/courses"
                className="text-xs font-medium text-accent-600 hover:text-accent-700 underline ml-2"
              >
                Reset all filters
              </Link>
            )}
          </div>

          {/* Quick Level Filter Tabs */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-neutral-500 font-medium">Difficulty:</span>
            {["all", "beginner", "intermediate", "advanced"].map((lvl) => {
              const isActive = (level || "all") === lvl;
              const params = new URLSearchParams({
                ...(q ? { q } : {}),
                ...(category ? { category } : {}),
                ...(lvl !== "all" ? { level: lvl } : {}),
                ...(price ? { price } : {}),
              });

              return (
                <Link
                  key={lvl}
                  href={`/courses?${params.toString()}`}
                  className={`capitalize px-2.5 py-1 rounded-md font-medium transition ${
                    isActive
                      ? "bg-primary-100 text-primary-900 font-semibold"
                      : "text-neutral-600 hover:text-neutral-900 hover:bg-white"
                  }`}
                >
                  {lvl}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Courses Grid */}
        {filteredCourses.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-dashed border-neutral-300 bg-white p-12 text-center shadow-sm max-w-lg mx-auto">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-50 text-primary-700 mb-4">
              <BookIcon className="h-7 w-7" />
            </div>
            <h2 className="font-heading text-lg font-bold text-primary-900">
              No matching courses found
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-neutral-600 leading-relaxed">
              {hasActiveFilters
                ? "No published courses match your current filter combination. Try adjusting your keyword or category."
                : "No courses are currently published in the catalog. Check back shortly for new releases."}
            </p>
            {hasActiveFilters && (
              <div className="mt-6">
                <Link
                  href="/courses"
                  className="inline-flex items-center gap-2 rounded-lg bg-primary-700 px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-primary-900"
                >
                  Clear All Filters
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 sm:gap-8">
            {filteredCourses.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                isWishlisted={wishlistCourseIds.includes(course.id)}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
