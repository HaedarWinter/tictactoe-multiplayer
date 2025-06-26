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
    // Log the error to an error reporting service
    console.error('Unhandled error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-red-900 border border-red-700 text-white px-6 py-4 rounded-lg max-w-lg">
        <h2 className="text-xl font-bold mb-4">Something went wrong</h2>
        <p className="mb-4">
          An error occurred while rendering this page. You can try refreshing or returning to the home page.
        </p>
        {error.message && (
          <pre className="bg-red-950 p-3 rounded overflow-auto text-sm mb-4">
            {error.message}
          </pre>
        )}
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={() => reset()}
            className="bg-blue-700 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Try again
          </button>
          <Link href="/" className="bg-red-700 text-white px-4 py-2 rounded hover:bg-red-600 text-center">
            Return to Home
          </Link>
        </div>
      </div>
    </div>
  );
} 