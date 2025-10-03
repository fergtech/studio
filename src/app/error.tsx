'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to console
    console.error('Application error:', error);
  }, [error]);

  // Check if it's a URI malformed error
  const isURIError = error.message?.includes('URI malformed') || error.name === 'URIError';

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="max-w-md text-center space-y-4">
        <h2 className="text-2xl font-bold text-foreground">
          {isURIError ? 'Invalid Data Detected' : 'Something went wrong'}
        </h2>
        <p className="text-muted-foreground">
          {isURIError
            ? 'The page contains invalid data. This usually happens with corrupted links or special characters.'
            : error.message || 'An unexpected error occurred'}
        </p>
        <div className="flex gap-4 justify-center">
          <Button
            onClick={() => reset()}
            variant="default"
          >
            Try again
          </Button>
          <Button
            onClick={() => window.location.href = '/'}
            variant="outline"
          >
            Go home
          </Button>
        </div>
      </div>
    </div>
  );
}
