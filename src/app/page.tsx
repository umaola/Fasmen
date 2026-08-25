export const dynamic = 'force-dynamic';

import Link from "next/link";
import { listPublishedCourses, type Course } from "@/lib/courses";
import { CATEGORIES, categoryBadgeClass } from "@/lib/categories";
import { CourseCard } from "@/components/CourseCard";
import {
  ArrowRightIcon,
  CompassIcon,
  BookIcon,
  CertificateIcon,
  ShieldCheckIcon,
} from "@/components/icons";

const STEPS = [
  {
    icon: CompassIcon,
    title: "Browse and enroll",
    body: "Explore courses across web development, design, business, marketing, and data, then enroll in the ones that fit your goals.",
  },
  {
    icon: BookIcon,
    title: "Learn at your pace",
    body: "Work through lessons and assessments whenever it suits your schedule, on any device.",
  },
  {
    icon: CertificateIcon,
    title: "Get certified",
    body: "Pass the course assessment and receive a verifiable certificate you can share.",
  },
];

export default async function LandingPage() {
  let featured: Course[] = [];
  try {
    featured = await listPublishedCourses();
  } catch (err) {
    console.error("LandingPage: failed to load published courses:", err);
  }

  const previewA = featured[0];
  const previewB = featured[1];

  return (
    <div className="flex flex-1 flex-col">
      <header className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-6">
        <span className="font-heading text-lg font-semibold text-primary-900">Fasmen</span>
        <nav className="flex items-center gap-6">
          <Link
            href="/courses"
            className="hidden text-sm font-medium text-neutral-700 transition hover:text-primary-700 sm:inline"
          >
            Browse courses
          </Link>
          <Link
            href="/login"
            className="text-sm font-medium text-neutral-700 transition hover:text-primary-700"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="inline-flex h-10 items-center rounded-md bg-primary-700 px-4 text-sm font-medium text-white transition hover:bg-primary-900"
          >
            Get started
          </Link>
        </nav>
      </header>

      <section className="mx-auto grid w-full max-w-7xl gap-12 px-6 pt-12 pb-20 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:pt-16">
        <div className="max-w-xl">
          <h1 className="font-heading text-4xl font-bold text-primary-900 sm:text-5xl">
            Learn practical skills from instructors who&apos;ve done the work
          </h1>
          <p className="mt-4 text-lg text-neutral-700">
            Browse courses from independent instructors, learn at your pace, and earn a
            verifiable certificate when you finish.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link
              href="/signup"
              className="inline-flex h-11 items-center rounded-md bg-primary-700 px-6 font-medium text-white transition hover:bg-primary-900"
            >
              Get started
              <ArrowRightIcon className="ml-2 h-4 w-4" />
            </Link>
            <Link
              href="/courses"
              className="inline-flex h-11 items-center rounded-md border border-primary-700 px-6 font-medium text-primary-700 transition hover:bg-primary-100"
            >
              Browse courses
            </Link>
          </div>
        </div>

        {previewA && (
          <div className="relative hidden lg:block">
            {previewB && (
              <div className="absolute -top-6 -right-2 w-56 rotate-3">
                <CourseCard course={previewB} />
              </div>
            )}
            <div className="relative mx-auto w-56 -rotate-2">
              <CourseCard course={previewA} />
            </div>
          </div>
        )}
      </section>

      <section className="mx-auto w-full max-w-7xl px-6 py-16">
        <h2 className="font-heading text-2xl font-bold text-primary-900">Browse by category</h2>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {CATEGORIES.map((c) => (
            <Link
              key={c.slug}
              href={`/courses?category=${c.slug}`}
              className="rounded-lg border border-neutral-200 bg-white p-5 text-center transition hover:border-primary-500 hover:shadow-[0_4px_12px_rgba(18,22,28,0.10)]"
            >
              <span
                className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium uppercase ${categoryBadgeClass(c.slug)}`}
              >
                {c.name}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {featured.length > 0 && (
        <section className="mx-auto w-full max-w-7xl px-6 py-16">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="font-heading text-2xl font-bold text-primary-900">
                Featured courses
              </h2>
              <p className="mt-1 text-sm text-neutral-700">A few courses to get you started.</p>
            </div>
            <Link
              href="/courses"
              className="hidden text-sm font-medium text-primary-700 transition hover:text-primary-900 sm:inline"
            >
              Browse all
            </Link>
          </div>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featured.slice(0, 3).map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        </section>
      )}

      <section className="mx-auto w-full max-w-7xl px-6 py-16">
        <h2 className="font-heading text-2xl font-bold text-primary-900">How Fasmen works</h2>
        <div className="mt-8 grid gap-10 divide-y divide-neutral-200 sm:grid-cols-3 sm:divide-x sm:divide-y-0 sm:gap-0">
          {STEPS.map((step, i) => (
            <div key={step.title} className={`pt-8 sm:pt-0 ${i > 0 ? "sm:pl-8" : ""}`}>
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100">
                <step.icon className="h-5 w-5 text-primary-700" />
              </span>
              <h3 className="font-heading mt-4 text-lg font-semibold text-primary-900">
                {step.title}
              </h3>
              <p className="mt-2 text-sm text-neutral-700">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-primary-900">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-start gap-6 px-6 py-16 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4 sm:items-center">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent-600">
              <CertificateIcon className="h-5 w-5 text-white" />
            </span>
            <div>
              <h2 className="font-heading text-xl font-bold text-white">
                A certificate worth sharing
              </h2>
              <p className="mt-1 max-w-md text-sm text-primary-100">
                Every completed course includes a verifiable certificate with a unique code, so
                anyone can confirm it&apos;s real.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-primary-100">
            <ShieldCheckIcon className="h-4 w-4" />
            Verified on request, no login required
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-6 py-20 text-center">
        <h2 className="font-heading text-2xl font-bold text-primary-900 sm:text-3xl">
          Ready to start learning?
        </h2>
        <Link
          href="/signup"
          className="mt-6 inline-flex h-11 items-center rounded-md bg-primary-700 px-6 font-medium text-white transition hover:bg-primary-900"
        >
          Get started
          <ArrowRightIcon className="ml-2 h-4 w-4" />
        </Link>
      </section>

      <footer className="border-t border-neutral-200">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-6 py-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="font-heading text-sm font-semibold text-primary-900">Fasmen</span>
            <p className="mt-1 text-sm text-neutral-700">
              A marketplace for private instructors to teach and students to learn.
            </p>
          </div>
          <nav className="flex items-center gap-6">
            <Link
              href="/courses"
              className="text-sm font-medium text-neutral-700 transition hover:text-primary-700"
            >
              Browse courses
            </Link>
            <Link
              href="/login"
              className="text-sm font-medium text-neutral-700 transition hover:text-primary-700"
            >
              Log in
            </Link>
          </nav>
          <p className="text-xs text-neutral-400">
            &copy; {new Date().getFullYear()} Fasmen. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
