'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Global application error:', error);
  }, [error]);

  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col items-center justify-center bg-neutral-50 px-6 py-16 text-center font-sans">
        <div className="mx-auto max-w-md">
          <h1 className="text-2xl font-bold text-neutral-900 sm:text-3xl">Application Error</h1>
          <p className="mt-3 text-sm text-neutral-600">
            An unexpected error occurred. Please try reloading the page.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => reset()}
              className="inline-flex h-11 items-center rounded-md bg-blue-600 px-6 font-medium text-white transition hover:bg-blue-700"
            >
              Retry
            </button>
            <Link
              href="/"
              className="inline-flex h-11 items-center rounded-md border border-neutral-300 bg-white px-6 font-medium text-neutral-700 transition hover:bg-neutral-100"
            >
              Home
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}
