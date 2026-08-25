'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled route error:', error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 py-16 text-center">
      <div className="mx-auto max-w-md">
        <h2 className="font-heading text-2xl font-bold text-primary-900 sm:text-3xl">
          Something went wrong
        </h2>
        <p className="mt-3 text-sm text-neutral-700">
          We encountered an unexpected issue while loading this page. Please try again or return to the homepage.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
          <button
            onClick={() => reset()}
            className="inline-flex h-11 items-center rounded-md bg-primary-700 px-6 font-medium text-white transition hover:bg-primary-900"
          >
            Try again
          </button>
          <Link
            href="/"
            className="inline-flex h-11 items-center rounded-md border border-neutral-300 bg-white px-6 font-medium text-neutral-700 transition hover:bg-neutral-50"
          >
            Go to homepage
          </Link>
        </div>
      </div>
    </div>
  );
}
