import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/dal";
import { listCoursesByTutor } from "@/lib/courses";
import { listReviewsByTutor } from "@/lib/reviews";
import { ReviewsTable } from "./ReviewsTable";

export default async function TutorReviewsPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "tutor") {
    redirect("/dashboard");
  }

  const [courses, reviews] = await Promise.all([
    listCoursesByTutor(user.id),
    listReviewsByTutor(user.id),
  ]);

  const averageRating = user.tutorProfile?.averageRating ?? 0;

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-primary-900">Reviews</h1>
      <p className="mt-1 text-sm text-neutral-700">
        What students are saying across all of your courses.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-2 sm:gap-4">
        <div className="min-w-0 rounded-lg bg-white p-4 shadow-[0_1px_3px_rgba(18,22,28,0.08)] sm:p-5">
          <p className="truncate text-xs text-neutral-700 sm:text-sm">Average rating</p>
          <p className="font-heading mt-1 truncate text-xl font-extrabold text-primary-900 sm:text-2xl sm:font-bold">
            {averageRating > 0 ? `★ ${averageRating.toFixed(1)}` : "No ratings yet"}
          </p>
        </div>
        <div className="min-w-0 rounded-lg bg-white p-4 shadow-[0_1px_3px_rgba(18,22,28,0.08)] sm:p-5">
          <p className="truncate text-xs text-neutral-700 sm:text-sm">Total reviews</p>
          <p className="font-heading mt-1 truncate text-xl font-extrabold text-primary-900 sm:text-2xl sm:font-bold">
            {reviews.length}
          </p>
        </div>
      </div>

      <div className="mt-8">
        <ReviewsTable reviews={reviews} courses={courses.map((c) => ({ id: c.id, title: c.title }))} />
      </div>
    </div>
  );
}
