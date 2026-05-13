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
    console.error('Page error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(67,56,202,0.2) 0%, #0F0F23 60%), #0F0F23' }}>
      <div className="text-center max-w-sm space-y-5">
        <img src="/images/error-state.png" alt="" className="mx-auto w-32 h-32 object-contain opacity-80" />
        <div>
          <h2 className="text-lg font-semibold mb-1">Something went sideways</h2>
          <p className="text-sm text-muted-foreground">
            A hiccup on our end. Nothing you did — we&apos;ll have it sorted in a moment.
          </p>
        </div>
        <div className="flex gap-3 justify-center">
          <Button variant="outline" onClick={() => window.location.href = '/'}>
            Go home
          </Button>
          <Button onClick={() => reset()}>
            Try again
          </Button>
        </div>
        {error.digest && (
          <p className="text-[10px] text-muted-foreground/50">
            Ref: {error.digest}
          </p>
        )}
      </div>
    </div>
  );
}
