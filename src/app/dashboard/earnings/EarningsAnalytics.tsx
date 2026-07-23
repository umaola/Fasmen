"use client";

import { useState } from "react";
import type { Payment } from "@/lib/payments";
import { formatNaira } from "@/lib/currency";
import {
  RANGE_OPTIONS,
  bucketPayments,
  filterPaymentsByRange,
  niceMax,
  formatCompactNaira,
  type RangeKey,
} from "./chart-utils";

const VIEW_W = 720;
const VIEW_H = 280;
const PAD = { top: 16, right: 12, bottom: 32, left: 64 };
const CHART_W = VIEW_W - PAD.left - PAD.right;
const CHART_H = VIEW_H - PAD.top - PAD.bottom;
const BAR_COLOR = "#1D5DAD"; // primary-500 — single sequential hue, this is a one-series chart
const GRID_COLOR = "#E3E7ED"; // neutral-200
const AXIS_TEXT_COLOR = "#3D4550"; // neutral-700

function roundedTopRectPath(x: number, width: number, yTop: number, yBottom: number): string {
  const height = yBottom - yTop;
  if (height <= 0) return "";
  const r = Math.min(4, width / 2, height);
  return `M ${x} ${yBottom} L ${x} ${yTop + r} Q ${x} ${yTop} ${x + r} ${yTop} L ${x + width - r} ${yTop} Q ${x + width} ${yTop} ${x + width} ${yTop + r} L ${x + width} ${yBottom} Z`;
}

export function EarningsAnalytics({ payments }: { payments: Payment[] }) {
  const [range, setRange] = useState<RangeKey>("30d");
  const [hovered, setHovered] = useState<number | null>(null);

  const buckets = bucketPayments(payments, range);
  const maxValue = niceMax(Math.max(...buckets.map((b) => b.value), 1));
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(maxValue * f));

  const n = buckets.length;
  const slotWidth = CHART_W / n;
  const barWidth = Math.min(24, slotWidth * 0.6);
  const gap = slotWidth - barWidth;
  const scaleY = (value: number) => (CHART_H * value) / maxValue;
  const labelStride = n > 20 ? Math.ceil(n / 10) : n > 10 ? 2 : 1;

  const transactions = filterPaymentsByRange(payments, range).sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt)
  );

  return (
    <div>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Date range">
        {RANGE_OPTIONS.map((opt) => (
          <button
            key={opt.key}
            type="button"
            onClick={() => setRange(opt.key)}
            aria-pressed={range === opt.key}
            className={`h-9 rounded-md px-4 text-sm font-medium transition ${
              range === opt.key
                ? "bg-primary-700 text-white"
                : "border border-neutral-200 text-neutral-700 hover:bg-neutral-100"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="relative mt-4 rounded-lg bg-white p-4 shadow-[0_1px_3px_rgba(18,22,28,0.08)]">
        <h3 className="text-sm font-medium text-neutral-900">Earnings</h3>
        <div className="relative mt-2">
          <svg
            viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
            className="w-full"
            role="img"
            aria-label={`Earnings bar chart for ${RANGE_OPTIONS.find((o) => o.key === range)?.label}`}
          >
            {yTicks.map((tick, i) => {
              const y = PAD.top + CHART_H - scaleY(tick);
              return (
                <g key={i}>
                  <line
                    x1={PAD.left}
                    y1={y}
                    x2={VIEW_W - PAD.right}
                    y2={y}
                    stroke={GRID_COLOR}
                    strokeWidth={1}
                  />
                  <text
                    x={PAD.left - 8}
                    y={y}
                    textAnchor="end"
                    dominantBaseline="middle"
                    fontSize={11}
                    fill={AXIS_TEXT_COLOR}
                  >
                    {formatCompactNaira(tick)}
                  </text>
                </g>
              );
            })}

            {buckets.map((bucket, i) => {
              const x = PAD.left + i * slotWidth + gap / 2;
              const yTop = PAD.top + CHART_H - scaleY(bucket.value);
              const yBottom = PAD.top + CHART_H;
              return (
                <g key={i}>
                  <path
                    d={roundedTopRectPath(x, barWidth, yTop, yBottom)}
                    fill={BAR_COLOR}
                    opacity={hovered === null || hovered === i ? 1 : 0.55}
                    style={{ transition: "opacity 120ms" }}
                  />
                  <rect
                    x={x - gap / 2}
                    y={PAD.top}
                    width={barWidth + gap}
                    height={CHART_H}
                    fill="transparent"
                    tabIndex={0}
                    role="img"
                    aria-label={`${bucket.label}: ${formatNaira(bucket.value)}`}
                    onMouseEnter={() => setHovered(i)}
                    onMouseLeave={() => setHovered(null)}
                    onFocus={() => setHovered(i)}
                    onBlur={() => setHovered(null)}
                  >
                    <title>{`${bucket.label}: ${formatNaira(bucket.value)}`}</title>
                  </rect>
                  {i % labelStride === 0 && (
                    <text
                      x={x + barWidth / 2}
                      y={VIEW_H - PAD.bottom + 16}
                      textAnchor="middle"
                      fontSize={10}
                      fill={AXIS_TEXT_COLOR}
                    >
                      {bucket.label}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>

          {hovered !== null && (
            <div
              className="pointer-events-none absolute rounded-md bg-primary-900 px-3 py-2 text-xs whitespace-nowrap text-white shadow-lg"
              style={{
                left: `${((PAD.left + hovered * slotWidth + slotWidth / 2) / VIEW_W) * 100}%`,
                top: `${((PAD.top + CHART_H - scaleY(buckets[hovered].value)) / VIEW_H) * 100}%`,
                transform: "translate(-50%, -100%)",
                marginTop: -8,
              }}
            >
              <p className="font-semibold">{formatNaira(buckets[hovered].value)}</p>
              <p className="text-primary-100">{buckets[hovered].label}</p>
            </div>
          )}
        </div>
      </div>

      <h2 className="font-heading mt-8 text-lg font-semibold text-primary-900">
        Transaction history
      </h2>
      {transactions.length === 0 ? (
        <p className="mt-2 text-sm text-neutral-700">No transactions in this period.</p>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-lg bg-white shadow-[0_1px_3px_rgba(18,22,28,0.08)]">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-neutral-200 text-neutral-700">
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Course</th>
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Your payout</th>
                <th className="px-4 py-3 font-medium">Payout status</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((payment) => (
                <tr key={payment.id} className="border-b border-neutral-200 last:border-0">
                  <td className="px-4 py-3 whitespace-nowrap text-neutral-700">
                    {new Date(payment.createdAt).toLocaleDateString("en-NG", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </td>
                  <td className="px-4 py-3 text-neutral-900">{payment.courseTitle}</td>
                  <td className="px-4 py-3">{formatNaira(payment.amount)}</td>
                  <td className="px-4 py-3 font-medium text-primary-900">
                    {formatNaira(payment.tutorPayoutAmount)}
                  </td>
                  <td className="px-4 py-3 capitalize">{payment.payoutStatus}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
