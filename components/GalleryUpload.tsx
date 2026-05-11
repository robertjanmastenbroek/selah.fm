'use client';

import { useState } from 'react';
import ImageUpload from '@/components/ImageUpload';
import { Input } from '@/components/ui/input';

export interface GalleryItem {
  id: string;
  type: 'image' | 'video';
  url: string; // data URL for images, YouTube URL for videos
}

interface GalleryUploadProps {
  items: GalleryItem[];
  onChange: (items: GalleryItem[]) => void;
}

export default function GalleryUpload({ items, onChange }: GalleryUploadProps) {
  const [expandedImage, setExpandedImage] = useState<string | null>(null); // which item id is uploading

  const addImageSlot = () => {
    const id = crypto.randomUUID();
    setExpandedImage(id);
    onChange([...items, { id, type: 'image', url: '' }]);
  };

  const addVideoSlot = () => {
    const id = crypto.randomUUID();
    onChange([...items, { id, type: 'video', url: '' }]);
  };

  const updateImage = (id: string, url: string) => {
    onChange(items.map(item => item.id === id ? { ...item, url } : item));
    setExpandedImage(null);
  };

  const updateVideoUrl = (id: string, url: string) => {
    onChange(items.map(item => item.id === id ? { ...item, url } : item));
  };

  const removeItem = (id: string) => {
    onChange(items.filter(item => item.id !== id));
    if (expandedImage === id) setExpandedImage(null);
  };

  // Convert items to flat arrays for PATCH API
  const imageUrls = items.filter(i => i.type === 'image' && i.url).map(i => i.url);
  const videoUrls = items.filter(i => i.type === 'video' && i.url).map(i => i.url);

  return (
    <div className="space-y-3">
      {/* Grid of existing items */}
      {items.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {items.map(item => (
            <div key={item.id} className="relative group">
              {item.type === 'image' ? (
                item.url ? (
                  /* Filled image slot */
                  <div className="relative aspect-video rounded-xl overflow-hidden bg-white/[0.04] border border-white/[0.06]">
                    <img src={item.url} alt="" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); setExpandedImage(item.id); }}
                        className="bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-lg px-3 py-1.5 text-[10px] text-white font-medium transition-colors"
                      >
                        Replace
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); removeItem(item.id); }}
                        className="bg-red-500/20 hover:bg-red-500/30 backdrop-blur-sm rounded-lg px-3 py-1.5 text-[10px] text-red-400 font-medium transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : expandedImage === item.id ? (
                  /* Uploading state — show ImageUpload */
                  <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3">
                    <ImageUpload
                      onImage={(url) => updateImage(item.id, url)}
                    />
                    <button
                      onClick={() => setExpandedImage(null)}
                      className="mt-2 w-full text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  /* Empty image slot */
                  <button
                    onClick={() => setExpandedImage(item.id)}
                    className="w-full aspect-video rounded-xl border-2 border-dashed border-white/[0.08] hover:border-primary/30 bg-white/[0.02] hover:bg-primary/[0.02] transition-all flex flex-col items-center justify-center gap-1.5"
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-muted-foreground/40">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <path d="M21 15l-5-5L5 21" />
                    </svg>
                    <span className="text-[10px] text-muted-foreground">Upload image</span>
                  </button>
                )
              ) : (
                /* Video slot */
                item.url ? (
                  /* Filled video slot */
                  <div className="relative aspect-video rounded-xl overflow-hidden bg-white/[0.04] border border-white/[0.06]">
                    {/* Show YouTube thumbnail if it's a YouTube URL */}
                    {item.url.includes('youtube.com/watch?v=') || item.url.includes('youtu.be/') ? (
                      (() => {
                        const videoId = item.url.includes('youtube.com/watch?v=')
                          ? new URL(item.url).searchParams.get('v')
                          : item.url.split('youtu.be/')[1]?.split('?')[0];
                        return videoId ? (
                          <img
                            src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : null;
                      })()
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" className="text-white/20">
                          <path d="M8 5v14l11-7z"/>
                        </svg>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button
                        onClick={(e) => { e.stopPropagation(); removeItem(item.id); }}
                        className="bg-red-500/20 hover:bg-red-500/30 backdrop-blur-sm rounded-lg px-3 py-1.5 text-[10px] text-red-400 font-medium transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Empty video slot — show URL input */
                  <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-red-400/60 shrink-0">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                      <span className="text-[10px] font-medium text-muted-foreground">YouTube video</span>
                    </div>
                    <Input
                      value={item.url || ''}
                      onChange={e => updateVideoUrl(item.id, e.target.value)}
                      placeholder="https://youtube.com/watch?v=..."
                      className="text-xs h-8"
                    />
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-[10px] text-red-400 hover:text-red-300"
                    >
                      Remove
                    </button>
                  </div>
                )
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add buttons */}
      <div className="flex gap-2">
        <button
          onClick={addImageSlot}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.06] hover:border-white/[0.12] transition-colors text-xs text-muted-foreground"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
          Add image
        </button>
        <button
          onClick={addVideoSlot}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.06] hover:border-white/[0.12] transition-colors text-xs text-muted-foreground"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-red-400/60"><path d="M8 5v14l11-7z"/></svg>
          Add video
        </button>
      </div>

      <p className="text-[10px] text-muted-foreground/50">Images will appear as a carousel on your campaign page. Videos show as YouTube embeds.</p>
    </div>
  );
}
