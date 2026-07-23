import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="flex-1 flex items-center justify-center px-6 py-24">
      <div className="max-w-2xl text-center">
        <p className="font-heading text-sm font-semibold tracking-wide text-primary-700 uppercase">
          Fasmen
        </p>
        <h1 className="font-heading mt-3 text-4xl font-bold text-primary-900 sm:text-5xl">
          Learn practical skills from private instructors
        </h1>
        <p className="mt-4 text-lg text-neutral-700">
          Discover courses from independent instructors, track your progress, and
          earn a verifiable certificate when you finish.
        </p>
        <div className="mt-8 flex items-center justify-center gap-4">
          <Link
            href="/signup"
            className="inline-flex h-11 items-center rounded-md bg-primary-700 px-6 font-medium text-white transition hover:bg-primary-900"
          >
            Get started
          </Link>
          <Link
            href="/login"
            className="inline-flex h-11 items-center rounded-md border border-primary-700 px-6 font-medium text-primary-700 transition hover:bg-primary-100"
          >
            Log in
          </Link>
        </div>
        <Link href="/courses" className="mt-6 inline-block text-sm font-medium text-primary-700">
          Browse the course catalog →
        </Link>
      </div>
    </main>
  );
}
