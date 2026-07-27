// Small fixed reference list for now — matches categories/{categoryId} in
// firestore-schema.md in spirit, but doesn't need its own store yet since
// there's no admin UI for managing categories in this phase.
export const CATEGORIES = [
  { slug: "web-development", name: "Web Development" },
  { slug: "design", name: "Design" },
  { slug: "business", name: "Business" },
  { slug: "marketing", name: "Marketing" },
  { slug: "data", name: "Data & Analytics" },
] as const;

export type CategorySlug = (typeof CATEGORIES)[number]["slug"];

export function categoryName(slug: string): string {
  return CATEGORIES.find((c) => c.slug === slug)?.name ?? slug;
}

const CATEGORY_BADGE_CLASSES: Record<CategorySlug, string> = {
  "web-development": "bg-primary-100 text-primary-700",
  design: "bg-accent-100 text-accent-600",
  business: "bg-success-600/10 text-success-600",
  marketing: "bg-error-600/10 text-error-600",
  data: "bg-info-600/10 text-info-600",
};

export function categoryBadgeClass(slug: string): string {
  return CATEGORY_BADGE_CLASSES[slug as CategorySlug] ?? "bg-neutral-100 text-neutral-700";
}
