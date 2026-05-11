'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Play, X } from 'lucide-react';

interface CarouselItem {
  type: 'image' | 'video';
  url: string;      // image data URL or CDN URL, or YouTube URL for videos
  thumbnail?: string; // pre-computed thumbnail for videos
}

interface MediaCarouselProps {
  items: CarouselItem[];
  autoplay?: boolean;
}

export default function MediaCarousel({ items, autoplay = false }: MediaCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [videoOpen, setVideoOpen] = useState<string | null>(null);
  const [imageExpanded, setImageExpanded] = useState<string | null>(null);

  if (!items || items.length === 0) return null;

  const scrollTo = (index: number) => {
    const container = scrollRef.current;
    if (!container) return;
    const child = container.children[index] as HTMLElement;
    if (!child) return;
    container.scrollTo({ left: child.offsetLeft - container.offsetLeft, behavior: 'smooth' });
    setActiveIndex(index);
  };

  const handleScroll = () => {
    const container = scrollRef.current;
    if (!container) return;
    const scrollLeft = container.scrollLeft;
    const children = Array.from(container.children);
    let closest = 0;
    let minDist = Infinity;
    children.forEach((child, i) => {
      const el = child as HTMLElement;
      const dist = Math.abs(el.offsetLeft - scrollLeft);
      if (dist < minDist) { minDist = dist; closest = i; }
    });
    setActiveIndex(closest);
  };

  const extractYoutubeId = (url: string): string | null => {
    if (url.includes('youtube.com/watch?v=')) {
      return new URL(url).searchParams.get('v');
    }
    if (url.includes('youtu.be/')) {
      return url.split('youtu.be/')[1]?.split('?')[0] || null;
    }
    return null;
  };

  const getVideoThumbnail = (url: string): string => {
    const id = extractYoutubeId(url);
    return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : '';
  };

  const prev = () => { if (activeIndex > 0) scrollTo(activeIndex - 1); };
  const next = () => { if (activeIndex < items.length - 1) scrollTo(activeIndex + 1); };

  return (
    <div className="relative">
      {/* Carousel container */}
      <div className="relative group">
        {/* Scrollable strip */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex gap-3 overflow-x-auto snap-x snap-mandatory scrollbar-none scroll-smooth pb-4"
        >
          {items.map((item, i) => (
            <div
              key={i}
              className="shrink-0 snap-start w-[280px] sm:w-[360px]"
            >
              {item.type === 'image' ? (
                /* Image card */
                <button
                  onClick={() => setImageExpanded(item.url)}
                  className="w-full aspect-video rounded-2xl overflow-hidden bg-white/[0.04] border border-white/[0.08] cursor-pointer hover:border-white/[0.15] transition-colors group/image"
                >
                  <img
                    src={item.url}
                    alt=""
                    className="w-full h-full object-cover group-hover/image:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/image:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="bg-white/10 backdrop-blur-sm rounded-full p-3">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
                    </div>
                  </div>
                </button>
              ) : (
                /* Video card */
                <button
                  onClick={() => setVideoOpen(item.url)}
                  className="w-full aspect-video rounded-2xl overflow-hidden bg-white/[0.04] border border-white/[0.08] cursor-pointer hover:border-white/[0.15] transition-colors group/video relative"
                >
                  <img
                    src={item.thumbnail || getVideoThumbnail(item.url)}
                    alt=""
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <div className="w-14 h-14 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center group-hover/video:bg-white/25 group-hover/video:scale-105 transition-all">
                      <Play size={22} className="text-white ml-0.5" fill="white" />
                    </div>
                  </div>
                  <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm rounded-lg px-2 py-1 text-[10px] text-white/80">
                    YouTube
                  </div>
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Navigation arrows (visible on hover) */}
        {items.length > 1 && (
          <>
            {activeIndex > 0 && (
              <button
                onClick={prev}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 backdrop-blur-sm border border-white/[0.1] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80 active:scale-95 z-10"
              >
                <ChevronLeft size={18} className="text-white" />
              </button>
            )}
            {activeIndex < items.length - 1 && (
              <button
                onClick={next}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 backdrop-blur-sm border border-white/[0.1] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80 active:scale-95 z-10"
              >
                <ChevronRight size={18} className="text-white" />
              </button>
            )}
          </>
        )}
      </div>

      {/* Dot indicators */}
      {items.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-2">
          {items.map((_, i) => (
            <button
              key={i}
              onClick={() => scrollTo(i)}
              className={`w-1.5 h-1.5 rounded-full transition-all ${
                i === activeIndex ? 'bg-white w-4' : 'bg-white/20 hover:bg-white/40'
              }`}
            />
          ))}
        </div>
      )}

      {/* Image lightbox */}
      <AnimatePresence>
        {imageExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm"
            onClick={() => setImageExpanded(null)}
          >
            <button
              onClick={() => setImageExpanded(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors z-10"
            >
              <X size={22} className="text-white" />
            </button>
            <motion.img
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              src={imageExpanded}
              alt=""
              className="max-w-full max-h-[90vh] object-contain rounded-xl"
              onClick={e => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* YouTube video modal */}
      <AnimatePresence>
        {videoOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm"
            onClick={() => setVideoOpen(null)}
          >
            <button
              onClick={() => setVideoOpen(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors z-10"
            >
              <X size={22} className="text-white" />
            </button>
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="relative w-full max-w-3xl aspect-video rounded-xl overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <iframe
                src={`https://www.youtube.com/embed/${extractYoutubeId(videoOpen)}?autoplay=1&rel=0`}
                className="absolute inset-0 w-full h-full"
                allow="autoplay; encrypted-media"
                allowFullScreen
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
