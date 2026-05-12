'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ClaimButton({ claimCode, artistName, campaignSlug }: {
  claimCode: string;
  artistName: string;
  campaignSlug: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [claimed, setClaimed] = useState(false);
  const router = useRouter();

  const handleClaim = async () => {
    setLoading(true);
    setError('');

    try {
      // First check if user is logged in
      const meRes = await fetch('/api/auth/me', { credentials: 'include' });
      const meData = await meRes.json();

      if (!meData.user?.id) {
        // Not logged in — redirect to signup with claim code in redirect
        router.push(`/login?redirect=/claim/${claimCode}`);
        return;
      }

      // User is logged in — claim the campaign
      const res = await fetch('/api/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          claim_code: claimCode,
          user_id: meData.user.id,
          verification_method: 'email',
        }),
      });

      const data = await res.json();

      if (data.error) {
        setError(data.error);
      } else {
        setClaimed(true);
        // Redirect to their new campaign page after a brief celebration
        setTimeout(() => {
          router.push(`/c/${campaignSlug}`);
        }, 2000);
      }
    } catch (e: any) {
      setError(e.message || 'Something went wrong');
    }
    setLoading(false);
  };

  if (claimed) {
    return (
      <div className="text-center space-y-4">
        <div className="text-5xl">🎉</div>
        <h2 className="text-xl font-bold">Campaign claimed!</h2>
        <p className="text-muted-foreground">
          Welcome to Selah.fm, {artistName}. Redirecting to your campaign...
        </p>
      </div>
    );
  }

  return (
    <div className="text-center space-y-4">
      <button
        onClick={handleClaim}
        disabled={loading}
        className="w-full max-w-xs px-8 py-4 bg-primary text-primary-foreground rounded-xl font-bold text-lg hover:opacity-90 disabled:opacity-50 transition-all"
      >
        {loading ? 'Claiming...' : '🎵 Claim this campaign'}
      </button>
      <p className="text-xs text-muted-foreground">
        You'll create an account (or log in) and the campaign will be yours instantly.
      </p>
      {error && (
        <p className="text-sm text-red-400">{error}</p>
      )}
    </div>
  );
}
