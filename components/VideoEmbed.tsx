'use client';

import { useState, useEffect } from 'react';

interface VideoEmbedProps {
  url: string;
  className?: string;
}

/**
 * Embeds YouTube, TikTok, or Instagram videos from a URL.
 * Uses platform oEmbed APIs for TikTok/Instagram.
 * YouTube uses iframe embed directly.
 */
export default function VideoEmbed({ url, className = '' }: VideoEmbedProps) {
  const [embedHtml, setEmbedHtml] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!url) return;

    // YouTube: match watch, shorts, youtu.be, or embed URLs
    const ytMatch = url.match(
      /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
    );
    if (ytMatch) {
      setEmbedHtml(
        `<iframe src="https://www.youtube.com/embed/${ytMatch[1]}" 
          frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
          allowfullscreen class="w-full aspect-video rounded-xl"></iframe>`
      );
      return;
    }

    // TikTok: use oEmbed
    const tiktokMatch = url.match(/tiktok\.com\/@[\w.-]+\/video\/(\d+)/i);
    if (tiktokMatch) {
      setLoading(true);
      fetch(`https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`)
        .then(r => r.json())
        .then(d => {
          if (d.html) setEmbedHtml(d.html);
          else setEmbedHtml(null);
          setLoading(false);
        })
        .catch(() => { setLoading(false); setEmbedHtml(null); });
      return;
    }

    // Instagram: use oEmbed
    const igMatch = url.match(/instagram\.com\/(reel|p)\/([^/?]+)/i);
    if (igMatch) {
      setLoading(true);
      fetch(`https://api.instagram.com/oembed?url=${encodeURIComponent(url)}`)
        .then(r => r.json())
        .then(d => {
          if (d.html) setEmbedHtml(d.html);
          else setEmbedHtml(null);
          setLoading(false);
        })
        .catch(() => { setLoading(false); setEmbedHtml(null); });
      return;
    }

    // Not a recognized video URL
    setEmbedHtml(null);
  }, [url]);

  if (!url) return null;
  if (loading) return <div className={`rounded-xl bg-white/[0.03] border border-white/[0.06] aspect-video flex items-center justify-center ${className}`}><div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /></div>;
  if (!embedHtml) return null;

  return (
    <div
      className={`overflow-hidden rounded-xl ${className}`}
      dangerouslySetInnerHTML={{ __html: embedHtml }}
    />
  );
}
