'use client';

import { useState } from 'react';
import { Share2, Check } from 'lucide-react';
import { useToast } from '@/components/Toast';

interface Props {
  url: string;
  title: string;
  description?: string;
  compact?: boolean;
}

export default function ShareButton({ url, title, description, compact }: Props) {
  const [copied, setCopied] = useState(false);
  const { addToast } = useToast();

  const shareData = { url, title, text: description || `Check this out on Selah.fm` };

  const share = async () => {
    // Try native share API first (mobile)
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch {}
    }

    // Fallback: copy link
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      addToast('Link copied!', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      addToast('Failed to copy', 'error');
    }
  };

  if (compact) {
    return (
      <button onClick={share} className="p-2 rounded-lg hover:bg-white/[0.06] transition-colors" title="Share">
        {copied ? <Check size={16} className="text-emerald-400" /> : <Share2 size={16} className="text-muted-foreground" />}
      </button>
    );
  }

  return (
    <button onClick={share}
      className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/[0.08] bg-white/[0.02] text-xs font-medium hover:bg-white/[0.04] transition-all">
      {copied ? <Check size={14} className="text-emerald-400" /> : <Share2 size={14} />}
      {copied ? 'Copied!' : 'Share'}
    </button>
  );
}
