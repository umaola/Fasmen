import type { CourseStatus } from "@/lib/courses";

const STYLES: Record<CourseStatus, string> = {
  draft: "bg-neutral-400/20 text-neutral-900",
  "pending-review": "text-warning-600 bg-[#fcf3e1]",
  published: "text-success-600 bg-[#e4f5ec]",
  rejected: "text-error-600 bg-[#fbe9e7]",
};

const LABELS: Record<CourseStatus, string> = {
  draft: "Draft",
  "pending-review": "Pending review",
  published: "Published",
  rejected: "Rejected",
};

export function StatusChip({ status }: { status: CourseStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${STYLES[status]}`}
    >
      {LABELS[status]}
    </span>
  );
}
