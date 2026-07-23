import type { Enrollment } from "@/lib/enrollments";
import type { Payment } from "@/lib/payments";
import type { TutorReview } from "@/lib/reviews";

export type PerfRangeKey = "7d" | "30d" | "6m" | "12m";

export const PERF_RANGE_OPTIONS: { key: PerfRangeKey; label: string }[] = [
  { key: "12m", label: "12 Months" },
  { key: "6m", label: "6 Months" },
  { key: "30d", label: "30 Days" },
  { key: "7d", label: "7 Days" },
];

export interface PerformanceBucket {
  label: string;
  enrollments: number;
  earnings: number; // kobo, new in this bucket
  rating: number | null; // cumulative average (0-5) as of this bucket's end; null before any reviews exist
}

function startOfDay(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

// Enrollments/earnings are per-bucket flow (new activity in that window,
// matching the earnings chart's convention); rating is a cumulative snapshot
// since "new reviews this week" is too sparse to read as a trend.
export function buildPerformanceBuckets(
  enrollments: Enrollment[],
  payments: Payment[],
  reviews: TutorReview[],
  range: PerfRangeKey
): PerformanceBucket[] {
  const today = startOfDay(new Date());
  const successfulPayments = payments.filter((p) => p.status === "success");
  const bucketDefs: { start: Date; end: Date; label: string }[] = [];

  if (range === "7d" || range === "30d") {
    const days = range === "7d" ? 7 : 30;
    for (let i = days - 1; i >= 0; i--) {
      const start = new Date(today);
      start.setDate(start.getDate() - i);
      const end = new Date(start);
      end.setHours(23, 59, 59, 999);
      bucketDefs.push({
        start,
        end,
        label: start.toLocaleDateString("en-NG", { month: "short", day: "numeric" }),
      });
    }
  } else if (range === "6m") {
    const weeks = 26;
    for (let i = weeks - 1; i >= 0; i--) {
      const end = new Date(today);
      end.setDate(end.getDate() - i * 7);
      end.setHours(23, 59, 59, 999);
      const start = new Date(end);
      start.setDate(start.getDate() - 6);
      start.setHours(0, 0, 0, 0);
      bucketDefs.push({
        start,
        end,
        label: start.toLocaleDateString("en-NG", { month: "short", day: "numeric" }),
      });
    }
  } else {
    for (let i = 11; i >= 0; i--) {
      const start = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const end = new Date(today.getFullYear(), today.getMonth() - i + 1, 0, 23, 59, 59, 999);
      bucketDefs.push({ start, end, label: start.toLocaleDateString("en-NG", { month: "short" }) });
    }
  }

  return bucketDefs.map(({ start, end, label }) => {
    const enrollmentsInBucket = enrollments.filter((e) => {
      const d = new Date(e.enrolledAt);
      return d >= start && d <= end;
    }).length;

    const earningsInBucket = successfulPayments
      .filter((p) => {
        const d = new Date(p.createdAt);
        return d >= start && d <= end;
      })
      .reduce((sum, p) => sum + p.tutorPayoutAmount, 0);

    const reviewsUpToBucket = reviews.filter((r) => new Date(r.createdAt) <= end);
    const rating =
      reviewsUpToBucket.length > 0
        ? reviewsUpToBucket.reduce((sum, r) => sum + r.rating, 0) / reviewsUpToBucket.length
        : null;

    return { label, enrollments: enrollmentsInBucket, earnings: earningsInBucket, rating };
  });
}

// Indexes a flow series to % of its own peak in the period, so it can share
// one axis with metrics on a completely different scale (naira vs. a head
// count vs. a 0-5 rating) — see dataviz skill: never dual-axis, index instead.
export function indexToPeak(values: number[]): number[] {
  const max = Math.max(...values, 0);
  if (max <= 0) return values.map(() => 0);
  return values.map((v) => (v / max) * 100);
}

// Rating indexes against its fixed 0-5 ceiling, not the period's own peak —
// a period peak would make small rating differences read as huge swings.
export function indexRating(rating: number | null): number | null {
  return rating === null ? null : (rating / 5) * 100;
}
