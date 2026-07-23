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
