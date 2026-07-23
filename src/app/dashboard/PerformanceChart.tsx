"use client";

import { useState } from "react";
import type { Enrollment } from "@/lib/enrollments";
import type { Payment } from "@/lib/payments";
import type { TutorReview } from "@/lib/reviews";
import { formatNaira } from "@/lib/currency";
import {
  PERF_RANGE_OPTIONS,
  buildPerformanceBuckets,
  indexToPeak,
  indexRating,
  type PerfRangeKey,
} from "./performance-chart-utils";

const VIEW_W = 720;
const VIEW_H = 280;
const PAD = { top: 16, right: 12, bottom: 32, left: 12 };
const CHART_W = VIEW_W - PAD.left - PAD.right;
const CHART_H = VIEW_H - PAD.top - PAD.bottom;
const GRID_COLOR = "#E3E7ED"; // neutral-200
const AXIS_TEXT_COLOR = "#3D4550"; // neutral-700

// Categorical trio validated with the dataviz palette validator (light mode):
// lightness band, chroma floor, and CVD separation all pass.
const SERIES = [
  { key: "enrollments" as const, label: "Enrollments", color: "#1D5DAD" }, // primary-500
  { key: "earnings" as const, label: "Earnings", color: "#E0862A" }, // accent-600
  { key: "rating" as const, label: "Rating", color: "#1E8E5A" }, // success-600
];

function linePath(points: { x: number; y: number }[]): string {
  return points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
}

export function PerformanceChart({
  enrollments,
  payments,
  reviews,
}: {
  enrollments: Enrollment[];
  payments: Payment[];
  reviews: TutorReview[];
}) {
  const [range, setRange] = useState<PerfRangeKey>("12m");
  const [hovered, setHovered] = useState<number | null>(null);

  const buckets = buildPerformanceBuckets(enrollments, payments, reviews, range);
  const n = buckets.length;
  const slotWidth = CHART_W / Math.max(n - 1, 1);
  const labelStride = n > 20 ? Math.ceil(n / 10) : n > 10 ? 2 : 1;

  const indexedEnrollments = indexToPeak(buckets.map((b) => b.enrollments));
  const indexedEarnings = indexToPeak(buckets.map((b) => b.earnings));
  const indexedRating = buckets.map((b) => indexRating(b.rating));

  const seriesData = [
    { ...SERIES[0], values: indexedEnrollments },
    { ...SERIES[1], values: indexedEarnings },
    { ...SERIES[2], values: indexedRating },
  ];

  const scaleX = (i: number) => PAD.left + i * slotWidth;
  const scaleY = (value: number) => PAD.top + CHART_H - (CHART_H * value) / 100;

  const gridTicks = [0, 25, 50, 75, 100];

  return (
    <div className="rounded-lg bg-white p-6 shadow-[0_1px_3px_rgba(18,22,28,0.08)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-heading text-lg font-semibold text-primary-900">Analytics</h2>
        <div className="flex flex-wrap gap-1" role="group" aria-label="Time range">
          {PERF_RANGE_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => setRange(opt.key)}
              aria-pressed={range === opt.key}
              className={`h-9 rounded-md px-3 text-sm font-medium transition ${
                range === opt.key
                  ? "border border-primary-700 text-primary-700"
                  : "text-neutral-700 hover:bg-neutral-100"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-4">
        {seriesData.map((s) => (
          <div key={s.key} className="flex items-center gap-2 text-sm text-neutral-700">
            <span className="h-0.5 w-4 rounded-full" style={{ backgroundColor: s.color }} />
            {s.label}
          </div>
        ))}
      </div>

      <div className="relative mt-3">
        <svg
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
          className="w-full"
          role="img"
          aria-label={`Performance chart for ${PERF_RANGE_OPTIONS.find((o) => o.key === range)?.label}, showing enrollments, earnings, and rating`}
        >
          {gridTicks.map((tick, i) => (
            <line
              key={i}
              x1={PAD.left}
              y1={scaleY(tick)}
              x2={VIEW_W - PAD.right}
              y2={scaleY(tick)}
              stroke={GRID_COLOR}
              strokeWidth={1}
            />
          ))}

          {seriesData.map((s) => {
            const points = s.values.map((v, i) => ({ x: scaleX(i), y: scaleY(v ?? 0) }));
            const definedSegments: { x: number; y: number }[][] = [];
            let current: { x: number; y: number }[] = [];
            s.values.forEach((v, i) => {
              if (v === null) {
                if (current.length > 0) definedSegments.push(current);
                current = [];
              } else {
                current.push(points[i]);
              }
            });
            if (current.length > 0) definedSegments.push(current);

            return (
              <g key={s.key}>
                {definedSegments.map((seg, i) => (
                  <path
                    key={i}
                    d={linePath(seg)}
                    fill="none"
                    stroke={s.color}
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                ))}
                {hovered !== null && s.values[hovered] !== null && (
                  <circle
                    cx={scaleX(hovered)}
                    cy={scaleY(s.values[hovered]!)}
                    r={5}
                    fill={s.color}
                    stroke="#ffffff"
                    strokeWidth={2}
                  />
                )}
              </g>
            );
          })}

          {buckets.map((bucket, i) => (
            <g key={i}>
              <rect
                x={scaleX(i) - slotWidth / 2}
                y={PAD.top}
                width={slotWidth}
                height={CHART_H}
                fill="transparent"
                tabIndex={0}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
                onFocus={() => setHovered(i)}
                onBlur={() => setHovered(null)}
              />
              {i % labelStride === 0 && (
                <text
                  x={scaleX(i)}
                  y={VIEW_H - PAD.bottom + 16}
                  textAnchor="middle"
                  fontSize={10}
                  fill={AXIS_TEXT_COLOR}
                >
                  {bucket.label}
                </text>
              )}
            </g>
          ))}

          {hovered !== null && (
            <line
              x1={scaleX(hovered)}
              y1={PAD.top}
              x2={scaleX(hovered)}
              y2={PAD.top + CHART_H}
              stroke={GRID_COLOR}
              strokeWidth={1}
            />
          )}
        </svg>

        {hovered !== null && (
          <div
            className="pointer-events-none absolute rounded-md bg-primary-900 px-3 py-2 text-xs whitespace-nowrap text-white shadow-lg"
            style={{
              left: `${(scaleX(hovered) / VIEW_W) * 100}%`,
              top: 0,
              transform:
                hovered > n / 2 ? "translate(-100%, 0)" : "translate(0, 0)",
            }}
          >
            <p className="font-semibold">{buckets[hovered].label}</p>
            <p style={{ color: SERIES[0].color }}>
              Enrollments: {buckets[hovered].enrollments}
            </p>
            <p style={{ color: SERIES[1].color }}>
              Earnings: {formatNaira(buckets[hovered].earnings)}
            </p>
            <p style={{ color: SERIES[2].color }}>
              Rating:{" "}
              {buckets[hovered].rating !== null
                ? `★ ${buckets[hovered].rating!.toFixed(1)}`
                : "No ratings yet"}
            </p>
          </div>
        )}
      </div>

      <p className="mt-2 text-xs text-neutral-400">
        Enrollments and earnings are indexed to their peak in this period; rating is
        indexed to a perfect 5 — so all three are comparable on one scale. Hover for
        real values.
      </p>
    </div>
  );
}
