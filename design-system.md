# Design System — E-Learning Platform

**Version:** 1.0
**Purpose:** A single reference for color, type, spacing, components, and interaction patterns across web and mobile.

---

## 1. Foundations

### 1.1 Design principles

1. **Trust first.** This platform handles people's money and their certifications — every screen should look and feel credible, especially checkout, assessments, and the certificate itself.
2. **Data-conscious.** Many students are on limited mobile data. Design decisions (image weight, video defaults, page weight) should default to the lighter option, not the flashiest one.
3. **Clarity over decoration.** Courses, progress, and pricing need to be scannable in seconds. Avoid the dense, slider-heavy, everything-above-the-fold pattern common on small-business template sites — this product needs calmer, more confident pacing.
4. **One system, two audiences.** Tutors need dashboard-density and control; students need a simpler, more visual, more encouraging experience. The system should flex between the two without feeling like two different products.

### 1.2 Relationship to existing brand

Fasmen Communications' current site leans on a conventional blue corporate palette with a warm accent, consistent with a Nigerian ICT-training and IT-services company. This system keeps that same underlying trust signal (blue = credibility, warmth accent = approachability) but replaces the dated WordPress-template execution with a cleaner, more deliberate visual language suited to a modern learning product.

---

## 2. Color

### 2.1 Primary palette

| Token | Hex | Usage |
|---|---|---|
| `color-primary-900` | `#0B2545` | Headers on light backgrounds, high-emphasis text |
| `color-primary-700` | `#123C73` | Primary buttons, links, active nav state |
| `color-primary-500` | `#1D5DAD` | Default primary actions, focus rings |
| `color-primary-100` | `#DCEBFA` | Light backgrounds, selected states, info banners |

### 2.2 Accent palette

| Token | Hex | Usage |
|---|---|---|
| `color-accent-600` | `#E0862A` | Secondary CTAs, highlights, "most popular" badges |
| `color-accent-100` | `#FCEBD8` | Accent backgrounds, subtle highlight chips |

The accent is warm on purpose — it's the color used for encouragement moments (course completion, certificate issued, streaks), never for errors or destructive actions.

### 2.3 Semantic colors

| Token | Hex | Usage |
|---|---|---|
| `color-success-600` | `#1E8E5A` | Payment success, assessment passed, published status |
| `color-warning-600` | `#B8790A` | Pending review, low attempts remaining |
| `color-error-600` | `#C6362C` | Failed payment, rejected course, destructive actions |
| `color-info-600` | `#2678B5` | Informational banners, tips |

### 2.4 Neutrals

| Token | Hex | Usage |
|---|---|---|
| `color-neutral-900` | `#12161C` | Body text |
| `color-neutral-700` | `#3D4550` | Secondary text |
| `color-neutral-400` | `#8A93A3` | Disabled text, placeholders |
| `color-neutral-200` | `#E3E7ED` | Borders, dividers |
| `color-neutral-100` | `#F4F6F9` | Page background |
| `color-neutral-0` | `#FFFFFF` | Card/surface background |

### 2.5 Accessibility rule

All text/background pairings must meet **WCAG AA contrast (4.5:1 for body text, 3:1 for large text/UI elements)**. `color-primary-500` on `color-neutral-0` passes for large text/buttons but body copy should default to `color-neutral-900` on light surfaces, not colored text, to guarantee readability on low-quality screens common on budget Android devices.

---

## 3. Typography

### 3.1 Typefaces

| Role | Font | Fallback |
|---|---|---|
| Headings | **Sora** (geometric, modern, good at large sizes) | system-ui, sans-serif |
| Body & UI | **Inter** (excellent readability at small sizes, wide language support) | system-ui, sans-serif |
| Numeric/data (prices, scores) | **Inter** with tabular figures | monospace fallback |

Both are free (Google Fonts), variable-weight, and render well on low-end Android — an important constraint given the target market.

### 3.2 Type scale

| Token | Size / Line-height | Weight | Use |
|---|---|---|---|
| `text-display` | 40px / 48px | 700 | Landing/marketing hero only |
| `text-h1` | 32px / 40px | 700 | Page titles |
| `text-h2` | 24px / 32px | 600 | Section headers |
| `text-h3` | 20px / 28px | 600 | Card titles, modal headers |
| `text-body-lg` | 16px / 24px | 400 | Primary body copy |
| `text-body` | 14px / 20px | 400 | Secondary copy, form labels |
| `text-caption` | 12px / 16px | 400 | Metadata, timestamps, helper text |

Never go below `text-caption` (12px) — this is a firm floor given real-world screen quality in-market.

---

## 4. Spacing & layout

### 4.1 Spacing scale (4px base unit)

`4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 96`

Use multiples of this scale for all padding/margin — no arbitrary values. Card interiors default to `16` or `24` padding; page-level section spacing defaults to `48` or `64`.

### 4.2 Grid

- **Desktop:** 12-column grid, 24px gutters, max content width 1200px.
- **Tablet:** 8-column grid, 20px gutters.
- **Mobile:** 4-column grid, 16px gutters, single-column stacking for all card grids.

### 4.3 Radius

| Token | Value | Use |
|---|---|---|
| `radius-sm` | 6px | Inputs, chips, small buttons |
| `radius-md` | 10px | Cards, modals |
| `radius-lg` | 16px | Hero panels, feature sections |
| `radius-full` | 999px | Pills, avatar, badges |

### 4.4 Elevation

| Token | Shadow | Use |
|---|---|---|
| `elevation-0` | none | Flat inline elements |
| `elevation-1` | `0 1px 3px rgba(18,22,28,0.08)` | Cards at rest |
| `elevation-2` | `0 4px 12px rgba(18,22,28,0.10)` | Hover state, dropdowns |
| `elevation-3` | `0 12px 32px rgba(18,22,28,0.14)` | Modals, popovers |

Keep shadows subtle throughout — avoid the heavy drop-shadows and gradient overlays typical of older template-based sites.

---

## 5. Components

### 5.1 Buttons

| Variant | Background | Text | Use |
|---|---|---|---|
| Primary | `color-primary-700` | White | Main CTA per screen (Enroll, Checkout, Submit) |
| Secondary | White, `1px` `color-primary-700` border | `color-primary-700` | Secondary actions |
| Accent | `color-accent-600` | White | Celebratory/encouraging actions (Get certificate, Start course) |
| Destructive | `color-error-600` | White | Reject course, delete, refund |
| Ghost | Transparent | `color-neutral-700` | Tertiary/low-emphasis actions |

Rules: one primary button per screen/section maximum. Buttons never rely on color alone — icon or label always clarifies intent (important for color-blind accessibility and low-quality screens).

### 5.2 Cards

**Course card** (student-facing catalog):
- Thumbnail (16:9), title (`text-h3`), tutor name (`text-body`, `color-neutral-700`), star rating + review count, price (bold, `color-primary-900`), and a category chip.
- Hover state: `elevation-2`, slight scale (1.01) — subtle, never jarring.

**Tutor course-management card:**
- Same base layout, plus a status chip (`Draft` / `Pending review` / `Published` / `Rejected`) using semantic colors, and enrollment count + earnings inline.

### 5.3 Status chips

| Status | Color | Token |
|---|---|---|
| Draft | Neutral | `color-neutral-400` bg, `color-neutral-900` text |
| Pending review | Warning | `color-warning-600` text on `#FCF3E1` bg |
| Published | Success | `color-success-600` text on `#E4F5EC` bg |
| Rejected | Error | `color-error-600` text on `#FBE9E7` bg |

### 5.4 Forms

- Input height: 44px minimum (touch-friendly for mobile-first usage).
- Labels always above the field, never placeholder-only (placeholder-as-label fails accessibility and disappears the moment a user starts typing, which is confusing on unfamiliar forms like checkout).
- Error state: red border (`color-error-600`) + inline message below field, never a modal or toast alone.
- OTP/phone input: large, spaced digit boxes — this is a primary auth path in this market and deserves dedicated, generous styling, not a cramped default text field.

### 5.5 Progress indicators

- **Course progress bar:** `color-primary-500` fill on `color-neutral-200` track, radius-full, with percentage label.
- **Assessment score result:** large numeral (`text-h1` or larger), color-coded (`color-success-600` if passed, `color-warning-600` if below threshold), with the pass threshold shown alongside for context — never just a bare number.

### 5.6 Certificate

The certificate is a trust artifact and effectively a marketing surface (students share it). It should:
- Use `color-primary-900` and `color-accent-600` as the two dominant colors — distinct from generic gray/blue template certificates.
- Include the verification code and URL prominently, not as fine print — this is a credibility feature and should look like one.
- Avoid clip-art laurels/ribbons — use clean geometric border treatment consistent with the rest of the system.

### 5.7 Navigation

- **Student:** persistent bottom nav on mobile (Home, My Courses, Search, Profile); top nav on desktop.
- **Tutor:** dashboard-style left sidebar on desktop (Courses, Earnings, Reviews, Profile); collapses to a bottom nav on mobile.
- **Admin:** left sidebar, denser layout, no mobile-first constraint — admins are assumed to work primarily on desktop.

### 5.8 Empty & loading states

- Every list (courses, enrollments, reviews) needs a designed empty state with a clear next action — never a blank white screen.
- Use skeleton loaders (not spinners) for course lists and dashboards, since perceived performance matters more on slower connections.

---

## 6. Imagery & iconography

- **Icons:** single icon set throughout (e.g., Lucide or Phosphor) — outlined style, 1.5–2px stroke, never mixing filled and outlined icons in the same context.
- **Photography:** authentic, Nigerian-context imagery over generic global stock photos where possible — this is a meaningful trust and relatability signal for the target market, and a clear improvement over generic template stock imagery.
- **Illustration (empty states, onboarding):** simple, flat, two-color (primary + accent) illustrations — avoid busy multi-color clip-art styles.

---

## 7. Motion

- Default transition: 150–200ms ease-out for hover/press states.
- Page-level transitions: 250ms, no more — this is a utility product, not a marketing showcase; motion should feel responsive, not decorative.
- Respect `prefers-reduced-motion` throughout.

---

## 8. Voice & tone (brief)

- **Student-facing copy:** encouraging, plain-language, never patronizing. "You're 80% through this course" rather than "Course progress: 80%."
- **Tutor-facing copy:** direct and operational — tutors are running a small business on this platform and want clarity over friendliness in dashboards.
- **Error messages:** always state what happened and what to do next — never a bare "Something went wrong."

---

## 9. What this changes from the current Fasmen site

| Current site pattern | This system instead |
|---|---|
| Slider Revolution hero carousels | Single, purposeful hero section per page — carousels hide content and hurt data-conscious mobile users |
| Dense stat/percentage bars ("Web Design 82%") | Reserved for genuine, meaningful progress (course completion), not marketing decoration |
| Generic WordPress pricing-table cards | Purpose-built course cards with rating, tutor identity, and category — richer and more scannable |
| Mixed icon styles and stock imagery | One consistent icon set; imagery guidelines favor authentic, local context |
| Heavy footer with many low-value links | Lean footer focused on trust (verification, support, legal) and real navigation, not link-padding |
