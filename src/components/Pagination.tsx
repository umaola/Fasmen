"use client";

// Numbered pages with an ellipsis when there are more than 7 — always shows
// first, last, and a window around the current page.
function pageNumbers(current: number, total: number): (number | "ellipsis")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages = new Set<number>([1, total, current, current - 1, current + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);

  const result: (number | "ellipsis")[] = [];
  let prev = 0;
  for (const p of sorted) {
    if (prev && p - prev > 1) result.push("ellipsis");
    result.push(p);
    prev = p;
  }
  return result;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-2 sm:gap-4">
      <p className="shrink-0 text-xs text-neutral-700 sm:text-sm">
        Page {currentPage} of {totalPages}
      </p>

      <div className="flex items-center gap-1 sm:gap-4">
        <div className="flex items-center gap-0.5 sm:gap-1">
          {pageNumbers(currentPage, totalPages).map((p, i) =>
            p === "ellipsis" ? (
              <span key={`e-${i}`} className="px-1 text-xs text-neutral-700 sm:px-2 sm:text-sm">
                …
              </span>
            ) : (
              <button
                key={p}
                type="button"
                onClick={() => onPageChange(p)}
                className={`h-7 w-7 rounded-md text-xs font-medium transition sm:h-9 sm:w-9 sm:text-sm ${
                  p === currentPage
                    ? "border border-accent-600 text-accent-600"
                    : "text-neutral-700 hover:bg-neutral-100"
                }`}
              >
                {p}
              </button>
            )
          )}
        </div>

        <div className="flex gap-1 sm:gap-2">
          <button
            type="button"
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            aria-label="Previous page"
            className="h-7 rounded-md border border-neutral-200 px-2 text-xs font-medium text-neutral-700 transition hover:bg-neutral-100 disabled:opacity-50 sm:h-9 sm:px-4 sm:text-sm"
          >
            <span className="sm:hidden">←</span>
            <span className="hidden sm:inline">Previous</span>
          </button>
          <button
            type="button"
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            aria-label="Next page"
            className="h-7 rounded-md border border-neutral-200 px-2 text-xs font-medium text-neutral-700 transition hover:bg-neutral-100 disabled:opacity-50 sm:h-9 sm:px-4 sm:text-sm"
          >
            <span className="sm:hidden">→</span>
            <span className="hidden sm:inline">Next</span>
          </button>
        </div>
      </div>
    </div>
  );
}
