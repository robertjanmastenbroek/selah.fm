'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, ExternalLink, Check, Copy } from 'lucide-react';
import { useToast } from '@/components/Toast';

interface Props {
  artistSlug: string;
  artistName: string;
}

export default function ArtistEmbed({ artistSlug, artistName }: Props) {
  const [copied, setCopied] = useState(false);
  const { addToast } = useToast();

  const embedCode = `<iframe 
  src="https://selah.fm/artist/${artistSlug}/embed" 
  width="300" 
  height="400" 
  style="border:none;border-radius:12px;max-width:100%"
  title="Support ${artistName} on Selah.fm">
</iframe>`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(embedCode);
      setCopied(true);
      addToast('Embed code copied!', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      addToast('Failed to copy', 'error');
    }
  };

  return (
    <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Heart size={14} className="text-primary" />
          Embeddable widget
        </h3>
        <a
          href={`/artist/${artistSlug}/embed`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] text-primary hover:underline flex items-center gap-1"
        >
          Preview <ExternalLink size={10} />
        </a>
      </div>
      <p className="text-xs text-muted-foreground">
        Add this widget to your website or Linktree so fans can find and support you on Selah.fm.
      </p>
      <div className="relative">
        <pre className="text-[10px] font-mono bg-black/30 rounded-xl p-4 overflow-x-auto text-muted-foreground/80 leading-relaxed whitespace-pre-wrap">
          {embedCode}
        </pre>
        <button
          onClick={handleCopy}
          className="absolute top-3 right-3 p-2 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] transition-colors"
          title="Copy embed code"
        >
          {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} className="text-muted-foreground" />}
        </button>
      </div>
    </div>
  );
}
