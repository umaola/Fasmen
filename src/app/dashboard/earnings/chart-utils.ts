import type { Payment } from "@/lib/payments";

export type RangeKey = "7d" | "30d" | "90d" | "all";

export const RANGE_OPTIONS: { key: RangeKey; label: string }[] = [
  { key: "7d", label: "Last 7 days" },
  { key: "30d", label: "Last 30 days" },
  { key: "90d", label: "Last 90 days" },
  { key: "all", label: "All time" },
];

export interface Bucket {
  label: string;
  value: number;
  rangeStart: Date;
  rangeEnd: Date;
}

function startOfDay(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export function filterPaymentsByRange(payments: Payment[], range: RangeKey): Payment[] {
  const successful = payments.filter((p) => p.status === "success");
  if (range === "all") return successful;

  const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;
  const cutoff = startOfDay(new Date());
  cutoff.setDate(cutoff.getDate() - (days - 1));
  return successful.filter((p) => new Date(p.createdAt) >= cutoff);
}

export function bucketPayments(payments: Payment[], range: RangeKey): Bucket[] {
  const inRange = filterPaymentsByRange(payments, range);
  const today = startOfDay(new Date());

  if (range === "7d" || range === "30d") {
    const days = range === "7d" ? 7 : 30;
    const buckets: Bucket[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const start = new Date(today);
      start.setDate(start.getDate() - i);
      const end = new Date(start);
      end.setHours(23, 59, 59, 999);
      buckets.push({
        rangeStart: start,
        rangeEnd: end,
        label: start.toLocaleDateString("en-NG", { month: "short", day: "numeric" }),
        value: 0,
      });
    }
    for (const p of inRange) {
      const d = new Date(p.createdAt);
      const bucket = buckets.find((b) => d >= b.rangeStart && d <= b.rangeEnd);
      if (bucket) bucket.value += p.tutorPayoutAmount;
    }
    return buckets;
  }

  if (range === "90d") {
    const weeks = 13;
    const buckets: Bucket[] = [];
    for (let i = weeks - 1; i >= 0; i--) {
      const end = new Date(today);
      end.setDate(end.getDate() - i * 7);
      end.setHours(23, 59, 59, 999);
      const start = new Date(end);
      start.setDate(start.getDate() - 6);
      start.setHours(0, 0, 0, 0);
      buckets.push({
        rangeStart: start,
        rangeEnd: end,
        label: start.toLocaleDateString("en-NG", { month: "short", day: "numeric" }),
        value: 0,
      });
    }
    for (const p of inRange) {
      const d = new Date(p.createdAt);
      const bucket = buckets.find((b) => d >= b.rangeStart && d <= b.rangeEnd);
      if (bucket) bucket.value += p.tutorPayoutAmount;
    }
    return buckets;
  }

  // "all" — one bucket per calendar month, from the earliest payment to this month.
  if (inRange.length === 0) {
    const start = new Date(today.getFullYear(), today.getMonth(), 1);
    const end = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);
    return [
      {
        rangeStart: start,
        rangeEnd: end,
        label: start.toLocaleDateString("en-NG", { month: "short", year: "numeric" }),
        value: 0,
      },
    ];
  }

  const earliest = inRange.reduce(
    (min, p) => (new Date(p.createdAt) < min ? new Date(p.createdAt) : min),
    new Date(inRange[0].createdAt)
  );
  const buckets: Bucket[] = [];
  const cursor = new Date(earliest.getFullYear(), earliest.getMonth(), 1);
  const endCursor = new Date(today.getFullYear(), today.getMonth(), 1);
  while (cursor <= endCursor) {
    const start = new Date(cursor);
    const end = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0, 23, 59, 59, 999);
    buckets.push({
      rangeStart: start,
      rangeEnd: end,
      label: start.toLocaleDateString("en-NG", { month: "short", year: "numeric" }),
      value: 0,
    });
    cursor.setMonth(cursor.getMonth() + 1);
  }
  for (const p of inRange) {
    const d = new Date(p.createdAt);
    const bucket = buckets.find((b) => d >= b.rangeStart && d <= b.rangeEnd);
    if (bucket) bucket.value += p.tutorPayoutAmount;
  }
  return buckets;
}

// Rounds up to a "clean" axis max: the smallest 1/2/5 * 10^n at or above value.
export function niceMax(value: number): number {
  if (value <= 0) return 100;
  const exponent = Math.floor(Math.log10(value));
  const magnitude = 10 ** exponent;
  const steps = [1, 2, 5, 10];
  for (const step of steps) {
    if (value <= step * magnitude) return step * magnitude;
  }
  return 10 * magnitude;
}

export function formatCompactNaira(kobo: number): string {
  const naira = kobo / 100;
  if (naira >= 1_000_000) return `₦${(naira / 1_000_000).toFixed(1)}M`;
  if (naira >= 1_000) return `₦${(naira / 1_000).toFixed(naira % 1000 === 0 ? 0 : 1)}K`;
  return `₦${naira.toFixed(0)}`;
}
