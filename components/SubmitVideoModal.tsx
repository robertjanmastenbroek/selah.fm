'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Video, Music, ExternalLink, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Props {
  open: boolean;
  onClose: () => void;
  tracks: any[];
  artistSlug: string;
  artistName: string;
}

export default function SubmitVideoModal({ open, onClose, tracks, artistSlug, artistName }: Props) {
  const [selectedTrack, setSelectedTrack] = useState<string>('');
  const [contentUrl, setContentUrl] = useState('');
  const [platform, setPlatform] = useState('tiktok');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (open && tracks.length > 0 && !selectedTrack) {
      setSelectedTrack(tracks[0].id);
    }
    setError('');
    setSuccess(false);
    setContentUrl('');
  }, [open]);

  const detectPlatform = (url: string) => {
    if (url.includes('tiktok.com')) setPlatform('tiktok');
    else if (url.includes('instagram.com') || url.includes('reels')) setPlatform('instagram');
    else if (url.includes('youtube.com') || url.includes('youtu.be')) setPlatform('youtube');
    else if (url.includes('facebook.com')) setPlatform('facebook');
  };

  const handleSubmit = async () => {
    if (!selectedTrack || !contentUrl.trim()) return;
    setSending(true);
    setError('');
    try {
      const res = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trackId: selectedTrack,
          contentUrl: contentUrl.trim(),
          platform,
        }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setSuccess(true);
        setTimeout(() => { onClose(); setSuccess(false); }, 1500);
      }
    } catch { setError('Network error. Try again.'); }
    finally { setSending(false); }
  };

  const selectedTrackData = tracks.find((t: any) => t.id === selectedTrack);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            className="w-full max-w-md rounded-2xl bg-[#0F0F23] border border-white/[0.08] shadow-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
              <div>
                <h2 className="text-sm font-bold">Make a video for {artistName}</h2>
                <p className="text-[10px] text-muted-foreground mt-0.5">Pick a track and submit your video link</p>
              </div>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/[0.06] text-muted-foreground">
                <X size={16} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {success ? (
                <div className="text-center py-8 space-y-2">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto">
                    <Video size={20} className="text-emerald-400" />
                  </div>
                  <p className="font-semibold">Video submitted!</p>
                  <p className="text-xs text-muted-foreground">The artist will review it shortly.</p>
                </div>
              ) : (
                <>
                  {/* Track selector */}
                  {tracks.length > 1 && (
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Track</label>
                      <div className="grid gap-1.5 max-h-32 overflow-y-auto">
                        {tracks.map((t: any) => (
                          <button key={t.id}
                            onClick={() => setSelectedTrack(t.id)}
                            className={`flex items-center gap-2 p-2 rounded-lg border text-xs transition-all ${
                              selectedTrack === t.id
                                ? 'border-primary/40 bg-primary/[0.06] text-foreground'
                                : 'border-white/[0.06] bg-white/[0.02] text-muted-foreground hover:border-white/[0.12]'
                            }`}
                          >
                            {t.cover_art_url ? (
                              <img src={t.cover_art_url} alt="" className="w-8 h-8 rounded object-cover" />
                            ) : (
                              <Music size={14} className="text-muted-foreground shrink-0" />
                            )}
                            <span className="truncate">{t.track_title || t.title}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedTrackData && (
                    <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3 flex items-center gap-3">
                      {selectedTrackData.cover_art_url ? (
                        <img src={selectedTrackData.cover_art_url} alt="" className="w-10 h-10 rounded-lg object-cover" />
                      ) : (
                        <Music size={18} className="text-muted-foreground" />
                      )}
                      <div>
                        <p className="text-sm font-semibold">{selectedTrackData.track_title || selectedTrackData.title}</p>
                        <p className="text-[10px] text-muted-foreground">
                          ${(selectedTrackData.cpm_rate_cents / 100).toFixed(2)} CPM
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Video URL */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Your video URL</label>
                    <Input value={contentUrl}
                      onChange={e => { setContentUrl(e.target.value); detectPlatform(e.target.value); }}
                      placeholder="https://tiktok.com/@user/video/..."
                      className="text-sm" />
                    <p className="text-[10px] text-muted-foreground/40 flex items-center gap-1">
                      <ExternalLink size={10} />
                      Paste your TikTok, Instagram Reel, or YouTube Short link
                    </p>
                  </div>

                  {/* Platform badge */}
                  {platform && (
                    <div className="text-[10px] text-muted-foreground/40 flex items-center gap-1">
                      Detected platform:
                      <span className="font-medium text-foreground/60 uppercase">{platform}</span>
                    </div>
                  )}

                  {/* Error */}
                  {error && (
                    <div className="rounded-xl bg-red-500/5 border border-red-500/10 p-3 text-xs text-red-400 flex items-start gap-2">
                      <AlertCircle size={12} className="shrink-0 mt-0.5" />{error}
                    </div>
                  )}

                  {/* Submit */}
                  <Button onClick={handleSubmit}
                    disabled={sending || !selectedTrack || !contentUrl.trim() || success}
                    className="w-full py-6 rounded-2xl text-base font-bold
                               bg-gradient-to-r from-emerald-500 to-emerald-600
                               hover:shadow-[0_0_40px_rgba(34,197,94,0.3)]
                               disabled:opacity-50 transition-all active:scale-[0.98]">
                    {sending ? (
                      <span className="flex items-center gap-2"><Loader2 size={16} className="animate-spin" /> Submitting...</span>
                    ) : (
                      <span className="flex items-center gap-2"><Video size={18} /> Submit video</span>
                    )}
                  </Button>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
