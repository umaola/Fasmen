import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/dal";
import { listWishlistedCourses } from "@/lib/wishlist";
import { CourseCard } from "@/components/CourseCard";
import { HeartIcon, ArrowRightIcon } from "@/components/icons";

export default async function SavedCoursesPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const savedCourses = await listWishlistedCourses(user.id);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-primary-900">Saved Courses</h1>
          <p className="text-sm text-neutral-600">
            Keep track of courses you&apos;re planning to take next.
          </p>
        </div>
        <Link
          href="/courses"
          className="inline-flex h-9 items-center gap-1.5 self-start rounded-lg bg-primary-900 px-4 text-xs font-semibold text-white transition hover:bg-primary-800 sm:self-auto"
        >
          <span>Browse Catalog</span>
          <ArrowRightIcon className="h-3.5 w-3.5" />
        </Link>
      </div>

      {savedCourses.length === 0 ? (
        <div className="mx-auto flex w-full max-w-md flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-300 bg-white p-12 text-center shadow-sm">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 text-rose-500">
            <HeartIcon className="h-7 w-7" />
          </div>
          <h2 className="font-heading mt-4 text-lg font-bold text-primary-900">
            Your wishlist is empty
          </h2>
          <p className="mt-2 text-sm text-neutral-600">
            Save interesting courses while browsing the catalog to easily find them when you&apos;re ready to start.
          </p>
          <Link
            href="/courses"
            className="mt-6 inline-flex h-10 items-center gap-2 rounded-xl bg-accent-600 px-6 text-sm font-semibold text-white transition hover:brightness-105"
          >
            Explore Courses
            <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {savedCourses.map((course) => (
            <CourseCard key={course.id} course={course} isWishlisted={true} />
          ))}
        </div>
      )}
    </div>
  );
}
