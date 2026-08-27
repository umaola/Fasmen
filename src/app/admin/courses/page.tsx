import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getCurrentUser } from "@/lib/dal";
import { listAllCourses, type Course } from "@/lib/courses";
import { categoryName } from "@/lib/categories";
import { formatNaira } from "@/lib/currency";
import { StatusChip } from "@/components/StatusChip";
import { toggleCoursePublishAdminAction } from "@/app/actions/admin-management";
import { BookIcon, ClipboardCheckIcon } from "@/components/icons";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminCoursesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; category?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    redirect("/admin/login");
  }

  const { q, status, category } = await searchParams;
  const allCourses = await listAllCourses();

  const filtered = allCourses.filter((course: Course) => {
    if (!course) return false;
    if (q) {
      const matchTitle = course.title.toLowerCase().includes(q.toLowerCase());
      const matchTutor = course.tutorName.toLowerCase().includes(q.toLowerCase());
      if (!matchTitle && !matchTutor) return false;
    }
    if (status && status !== "all" && course.status !== status) {
      return false;
    }
    if (category && category !== "all" && course.category !== category) {
      return false;
    }
    return true;
  });

  const publishedCount = allCourses.filter((c: Course) => c && c.status === "published").length;
  const pendingCount = allCourses.filter((c: Course) => c && c.status === "pending-review").length;
  const draftCount = allCourses.filter((c: Course) => c && c.status === "draft").length;
  const rejectedCount = allCourses.filter((c: Course) => c && c.status === "rejected").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-accent-600">
            Course Management
          </span>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-primary-900 mt-1">
            Master Course Catalog
          </h1>
          <p className="mt-1 text-sm text-neutral-700">
            Monitor, inspect, publish/unpublish, and govern all {allCourses.length} courses on FASMEN.
          </p>
        </div>

        {pendingCount > 0 && (
          <Link
            href="/admin/review"
            className="inline-flex items-center gap-2 rounded-md bg-warning-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:brightness-95"
          >
            <ClipboardCheckIcon className="h-4 w-4" />
            <span>Review Queue ({pendingCount})</span>
          </Link>
        )}
      </div>

      {/* Metric Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-lg bg-white p-4 border border-neutral-200 shadow-[0_1px_3px_rgba(18,22,28,0.08)]">
          <span className="text-xs font-medium text-neutral-700">Published Live</span>
          <p className="font-heading text-xl font-bold text-success-600 mt-1">{publishedCount}</p>
        </div>
        <div className="rounded-lg bg-white p-4 border border-neutral-200 shadow-[0_1px_3px_rgba(18,22,28,0.08)]">
          <span className="text-xs font-medium text-neutral-700">Pending Review</span>
          <p className="font-heading text-xl font-bold text-warning-600 mt-1">{pendingCount}</p>
        </div>
        <div className="rounded-lg bg-white p-4 border border-neutral-200 shadow-[0_1px_3px_rgba(18,22,28,0.08)]">
          <span className="text-xs font-medium text-neutral-700">Drafts</span>
          <p className="font-heading text-xl font-bold text-neutral-900 mt-1">{draftCount}</p>
        </div>
        <div className="rounded-lg bg-white p-4 border border-neutral-200 shadow-[0_1px_3px_rgba(18,22,28,0.08)]">
          <span className="text-xs font-medium text-neutral-700">Rejected</span>
          <p className="font-heading text-xl font-bold text-error-600 mt-1">{rejectedCount}</p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="rounded-lg bg-white p-4 border border-neutral-200 shadow-[0_1px_3px_rgba(18,22,28,0.08)]">
        <form method="GET" className="flex flex-col sm:flex-row gap-3 items-center">
          <input
            name="q"
            defaultValue={q || ""}
            placeholder="Search by title or instructor..."
            className="h-10 w-full sm:flex-1 rounded-md border border-neutral-200 px-3.5 text-sm outline-none transition focus:border-primary-500 focus:ring-1 focus:ring-primary-500/20"
          />

          <select
            name="status"
            defaultValue={status || "all"}
            className="h-10 w-full sm:w-44 rounded-md border border-neutral-200 px-3 text-sm bg-white outline-none focus:border-primary-500"
          >
            <option value="all">All Statuses</option>
            <option value="published">Published</option>
            <option value="pending-review">Pending Review</option>
            <option value="draft">Draft</option>
            <option value="rejected">Rejected</option>
          </select>

          <button
            type="submit"
            className="h-10 w-full sm:w-auto rounded-md bg-primary-700 px-5 text-sm font-medium text-white transition hover:bg-primary-900"
          >
            Filter
          </button>
        </form>
      </div>

      {/* Courses Table */}
      {filtered.length === 0 ? (
        <div className="rounded-lg bg-white p-10 text-center border border-dashed border-neutral-200">
          <p className="text-sm text-neutral-700">No courses match your filter criteria.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg bg-white shadow-[0_1px_3px_rgba(18,22,28,0.08)] border border-neutral-200">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-200 text-neutral-700 text-xs font-semibold uppercase">
                <th className="px-4 py-3">Course</th>
                <th className="px-4 py-3">Instructor</th>
                <th className="px-4 py-3">Category & Level</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Enrollments</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c: Course) => (
                <tr key={c.id} className="border-b border-neutral-200 last:border-0 hover:bg-neutral-50 transition">
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      {c.thumbnailUrl ? (
                        <div className="relative h-11 w-16 shrink-0 overflow-hidden rounded border border-neutral-200 bg-neutral-100">
                          <Image src={c.thumbnailUrl} alt={c.title} fill className="object-cover" />
                        </div>
                      ) : (
                        <div className="flex h-11 w-16 shrink-0 items-center justify-center rounded border border-neutral-200 bg-neutral-100 text-neutral-400">
                          <BookIcon className="h-4 w-4" />
                        </div>
                      )}
                      <div>
                        <Link
                          href={`/courses/${c.slug}`}
                          target="_blank"
                          className="font-medium text-neutral-900 hover:text-primary-700 hover:underline"
                        >
                          {c.title}
                        </Link>
                        <p className="text-xs text-neutral-700">{c.totalLessons} lesson{c.totalLessons === 1 ? "" : "s"}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-neutral-900">{c.tutorName}</td>
                  <td className="px-4 py-3.5">
                    <span className="block text-neutral-900">{categoryName(c.category)}</span>
                    <span className="text-xs text-neutral-700 capitalize">{c.level}</span>
                  </td>
                  <td className="px-4 py-3.5 font-medium text-neutral-900">
                    {c.price === 0 ? "Free" : formatNaira(c.price)}
                  </td>
                  <td className="px-4 py-3.5 text-neutral-900">
                    {c.enrollmentCount} {c.enrollmentCount === 1 ? "student" : "students"}
                  </td>
                  <td className="px-4 py-3.5">
                    <StatusChip status={c.status} />
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/courses/${c.slug}`}
                        target="_blank"
                        className="rounded border border-neutral-200 px-2.5 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-100"
                      >
                        Preview
                      </Link>

                      {c.status === "published" ? (
                        <form action={toggleCoursePublishAdminAction.bind(null, c.id, false)}>
                          <button
                            type="submit"
                            className="rounded border border-error-600 px-2.5 py-1 text-xs font-medium text-error-600 hover:bg-[#fbe9e7] cursor-pointer"
                          >
                            Unpublish
                          </button>
                        </form>
                      ) : (
                        <form action={toggleCoursePublishAdminAction.bind(null, c.id, true)}>
                          <button
                            type="submit"
                            className="rounded bg-primary-700 px-2.5 py-1 text-xs font-medium text-white hover:bg-primary-900 cursor-pointer"
                          >
                            Publish
                          </button>
                        </form>
                      )}
                    </div>
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
