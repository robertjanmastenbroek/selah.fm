// ── Shared components extracted from CampaignDetailClient.tsx ──────────
// Used by both campaign pages (/c/[id]) and track pages (/artist/.../tracks/[id])

import { motion } from 'framer-motion';
import Link from 'next/link';
import { DollarSign, Shield, BadgeCheck, Heart, ChevronDown, Check, X, Copy, Share2 } from 'lucide-react';
import { useState } from 'react';

// ═══════════════════════════════════════════════════════════════════════
// SUPPORTER GRID
// ═══════════════════════════════════════════════════════════════════════

export function SupporterGrid({ supporters, totalCount }: { supporters: any[]; totalCount: number }) {
  if (!supporters || supporters.length === 0) {
    return (
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span className="text-muted-foreground/50">Be the first to support this campaign</span>
      </div>
    );
  }

  const visible = supporters.slice(0, 8);
  const extra = totalCount - visible.length;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex -space-x-2">
        {visible.map((s: any, i: number) => (
          <div
            key={i}
            className="w-7 h-7 rounded-full border-2 border-[#0F0F23] bg-gradient-to-br from-indigo-500 to-purple-600 
              flex items-center justify-center text-[9px] font-bold text-white shrink-0"
            title={`${s.donor_name || 'Anonymous'}${s.amount_cents ? ` · $${(s.amount_cents / 100).toFixed(2)}` : ''}`}
          >
            {(s.donor_name || '?')[0].toUpperCase()}
          </div>
        ))}
        {extra > 0 && (
          <div className="w-7 h-7 rounded-full border-2 border-[#0F0F23] bg-white/[0.06] flex items-center justify-center text-[9px] text-muted-foreground shrink-0">
            +{extra}
          </div>
        )}
      </div>
      <span className="text-xs text-muted-foreground">
        <strong className="text-white font-semibold">{totalCount}</strong> supporter{totalCount !== 1 ? 's' : ''}
      </span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// FAQ ACCORDION
// ═══════════════════════════════════════════════════════════════════════

export function FAQAccordion() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  
  const faqs = [
    { q: 'How do I earn money promoting this track?', a: 'Create a short video (15-60 seconds) featuring the track on TikTok, Instagram Reels, or YouTube Shorts. Submit your video. If the artist approves it, you earn per verified view — paid automatically via Stripe.' },
    { q: 'How much will I actually earn?', a: 'Use the calculator above. Your earnings depend on the CPM rate the artist set and how many verified views your video gets. You keep 80% of the earnings (platform fee is 20%). Payouts are automatic via Stripe Connect.' },
    { q: 'Do I need a following to participate?', a: 'No. CPM-based promotion pays per view, not per follower. A creator with 500 followers who makes engaging content can earn more than someone with 100K followers posting low-engagement videos.' },
    { q: 'How do I get paid?', a: 'Connect your Stripe account to Selah.fm. When your video is approved and views are verified, earnings are automatically deposited. No invoices. No manual requests.' },
    { q: 'What platforms are supported?', a: 'TikTok, Instagram Reels, and YouTube Shorts. Post wherever your audience is — views count across all platforms as long as they use the official audio.' },
    { q: 'What if my video isn\'t approved?', a: 'Artists review every submission. If rejected, you\'ll get feedback on why. You can fix the issue and resubmit. Unused campaign budget never gets charged.' },
  ];

  return (
    <div className="space-y-2">
      {faqs.map((faq, i) => (
        <div key={i} className="rounded-xl border border-white/[0.04] bg-white/[0.01] overflow-hidden">
          <button
            onClick={() => setOpenFaq(openFaq === i ? null : i)}
            className="flex items-center justify-between w-full px-4 py-3 text-xs font-medium text-left text-muted-foreground hover:text-white transition-colors"
          >
            <span className="pr-2">{faq.q}</span>
            <ChevronDown size={14} className={`shrink-0 transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
          </button>
          {openFaq === i && (
            <div className="px-4 pb-3 text-[11px] text-muted-foreground/60 leading-relaxed">
              {faq.a}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// SHARE MODAL
// ═══════════════════════════════════════════════════════════════════════

export function ShareModal({ open, onClose, url, title }: {
  open: boolean; onClose: () => void; url: string; title: string;
}) {
  if (!open) return null;
  const shareUrl = encodeURIComponent(url);
  const shareText = encodeURIComponent(title);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}>
      <div className="relative w-full max-w-sm rounded-2xl bg-[#11112A] border border-white/[0.08] p-6 shadow-2xl"
        onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 p-1 rounded-lg hover:bg-white/[0.06] text-muted-foreground">
          <X size={16} />
        </button>
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <Share2 size={14} /> Share this track
        </h3>
        <div className="flex items-center gap-3 mb-5">
          <a href={`https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}`} target="_blank" rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-xs font-medium transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231z"/></svg>
            X
          </a>
          <a href={`https://wa.me/?text=${shareText}%20${shareUrl}`} target="_blank" rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-xs font-medium transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            WhatsApp
          </a>
          <button onClick={() => navigator.clipboard.writeText(url)}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-xs font-medium transition-colors">
            <Copy size={14} /> Copy
          </button>
        </div>
        <div className="flex items-center gap-2 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
          <input readOnly value={url} className="flex-1 bg-transparent text-xs text-muted-foreground outline-none truncate" />
          <button onClick={() => navigator.clipboard.writeText(url)} className="text-primary text-[10px] font-semibold hover:underline shrink-0">
            Copy
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// TRUST BAR
// ═══════════════════════════════════════════════════════════════════════

export function TrustBar() {
  const items = [
    { icon: DollarSign, label: 'Free to start', sub: 'No upfront cost' },
    { icon: Shield, label: 'You keep 80%', sub: '20% platform fee' },
    { icon: BadgeCheck, label: 'Verified views', sub: 'Fraud detection' },
    { icon: Heart, label: 'You stay in control', sub: 'Approve every video' },
  ];
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
      {items.map((item, i) => (
        <div key={i} className="rounded-xl border border-white/[0.03] p-3 text-center backdrop-blur-sm bg-white/[0.01]">
          <item.icon size={16} className="mx-auto mb-1.5 text-emerald-400/60" />
          <p className="text-[11px] text-white/30 font-semibold">{item.label}</p>
          <p className="text-[9px] text-white/15">{item.sub}</p>
        </div>
      ))}
    </div>
  );
}
