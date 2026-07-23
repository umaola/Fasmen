// Default split from technical-requirements-document.md FR-32 — configurable later,
// hardcoded for now since there's no admin settings UI yet.
export const TUTOR_SHARE = 0.7;

export function formatNaira(kobo: number): string {
  return (kobo / 100).toLocaleString("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  });
}
