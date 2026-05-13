'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, Music2, Loader2, Check } from 'lucide-react';
import type { Toast } from './ToastBar';

interface QueueArtist {
  id: string;
  artist_name: string;
  latest_track_name?: string;
  latest_track_cover_url?: string;
  instagram_handle?: string;
  tiktok_handle?: string;
  campaign_slug?: string;
}

interface OutreachQueueProps {
  count: number;
  actionLoading: string;
  setActionLoading: (v: string) => void;
  addToast: (type: Toast['type'], title: string, detail?: string) => void;
  fetchPipeline: () => void;
  onLogOutreach: (artistId: string) => void;
}

export default function OutreachQueue({ count, actionLoading, setActionLoading, addToast, fetchPipeline, onLogOutreach }: OutreachQueueProps) {
  const [queue, setQueue] = useState<QueueArtist[]>([]);
  const [loaded, setLoaded] = useState(false);
  const isGlobalBusy = actionLoading === 'discover' || actionLoading === 'batch-audit' || actionLoading === 'repair-images' || actionLoading === 'refresh';

  useEffect(() => {
    if (count > 0 && !loaded) {
      fetch('/api/admin/outreach', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get_outreach_queue' }),
      })
        .then(r => r.json())
        .then(data => {
          if (!data.error) setQueue(data);
          setLoaded(true);
        })
        .catch(() => setLoaded(true));
    }
  }, [count, loaded]);

  if (count <= 0) return null;

  const dmArtist = async (artist: QueueArtist) => {
    const id = `dm-${artist.id}`;
    if (!artist.instagram_handle && !artist.tiktok_handle) {
      addToast('info', `No social handles for ${artist.artist_name}`);
      return;
    }
    setActionLoading(id);
    try {
      const res = await fetch('/api/admin/outreach', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'render_outreach', artistId: artist.id }),
      });
      const data = await res.json();
      if (data.error) { addToast('error', 'Failed', data.error); setActionLoading(''); return; }
      await navigator.clipboard.writeText(data.message);
      const ig = data.instagram_handle || artist.instagram_handle;
      const tt = data.tiktok_handle || artist.tiktok_handle;
      if (ig) window.open(`https://ig.me/m/${ig}`, '_blank');
      if (tt) window.open(`https://www.tiktok.com/@${tt}`, '_blank');
      const channels = [ig && `📸 IG: https://ig.me/m/${ig}`, tt && `🎵 TikTok: https://www.tiktok.com/@${tt}`].filter(Boolean).join(' · ');
      addToast('success', `Message copied — ${artist.artist_name}`, `📋 Copied · ${channels}`);
    } catch (e: any) {
      addToast('error', 'Failed', e.message);
    }
    setActionLoading('');
  };

  return (
    <div className="rounded-2xl border border-[#22C55E]/10 p-5" style={{ background: 'linear-gradient(135deg, rgba(34,197,94,0.04) 0%, transparent 100%)' }}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold flex items-center gap-2">
          <Send size={14} className="text-[#22C55E]" />
          Ready for Outreach
          <span className="text-[10px] text-muted-foreground font-normal">{count} waiting</span>
        </h2>
        <span className="text-[10px] text-muted-foreground">Click any row → copies message + opens IG DM</span>
      </div>

      {queue.length === 0 ? (
        <p className="text-[11px] text-muted-foreground text-center py-4">Loading queue...</p>
      ) : (
        <div className="space-y-2">
          {queue.map((artist) => {
            const isBusy = actionLoading === `dm-${artist.id}` || actionLoading === `outreach-${artist.id}` || actionLoading === `log-${artist.id}` || isGlobalBusy;
            return (
              <motion.div
                key={artist.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.01 }}
                onClick={() => !isBusy && dmArtist(artist)}
                className={`group rounded-xl bg-white/[0.03] border border-white/[0.06] p-3 flex items-center gap-3 cursor-pointer 
                  hover:bg-white/[0.05] hover:border-[#22C55E]/20 transition-all duration-150 ${isBusy ? 'opacity-50 pointer-events-none' : ''}`}
              >
                {artist.latest_track_cover_url ? (
                  <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-white/[0.04]">
                    <img src={artist.latest_track_cover_url} alt="" className="w-full h-full object-cover" loading="lazy" />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-lg shrink-0 bg-white/[0.04] flex items-center justify-center">
                    <Music2 size={16} className="text-muted-foreground/20" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm truncate">{artist.artist_name}</span>
                    {artist.instagram_handle && <span className="text-[10px] text-pink-400 shrink-0">📸 @{artist.instagram_handle}</span>}
                    {artist.tiktok_handle && <span className="text-[10px] text-blue-400 shrink-0">🎵 @{artist.tiktok_handle}</span>}
                  </div>
                  <div className="text-[10px] text-muted-foreground truncate mt-0.5">
                    {artist.latest_track_name ? `🎵 ${artist.latest_track_name}` : 'Click to copy message'}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {isBusy && actionLoading !== `log-${artist.id}` ? (
                    <Loader2 size={14} className="animate-spin text-[#22C55E]" />
                  ) : (
                    <>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={(e) => { e.stopPropagation(); dmArtist(artist); }}
                        disabled={actionLoading === `log-${artist.id}`}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#22C55E]/10 text-[#22C55E] text-[11px] font-semibold
                          hover:bg-[#22C55E]/20 transition-colors disabled:opacity-40"
                      >
                        <Send size={11} />
                        Message
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={(e) => { e.stopPropagation(); onLogOutreach(artist.id); }}
                        disabled={isBusy}
                        title="✓ Mark DM as sent"
                        className="flex items-center justify-center w-7 h-7 rounded-lg
                          border border-white/[0.06] text-muted-foreground
                          hover:bg-emerald-500/10 hover:text-emerald-400 hover:border-emerald-500/20
                          transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        {actionLoading === `log-${artist.id}` ? <Loader2 size={11} className="animate-spin" /> : <Check size={12} />}
                      </motion.button>
                    </>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
