'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ZoomIn, ZoomOut, Check, X } from 'lucide-react';

interface ImageCropperProps {
  src: string;
  onCrop: (croppedDataUrl: string) => void;
  onCancel: () => void;
  aspectRatio?: number;
  outputWidth?: number;
}

export default function ImageCropper({
  src,
  onCrop,
  onCancel,
  aspectRatio = 16 / 9,
  outputWidth = 1200,
}: ImageCropperProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgNatural, setImgNatural] = useState({ w: 0, h: 0 });
  // zoom: 1.0 = image exactly covers container (no black bars)
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, px: 0, py: 0 });

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imgRef.current = img;
      setImgNatural({ w: img.naturalWidth, h: img.naturalHeight });
      setImgLoaded(true);
    };
    img.onerror = () => setImgLoaded(true);
    img.src = src;
    return () => { img.onload = null; img.onerror = null; };
  }, [src]);

  // ── Cover scale: scale needed to make image cover the container ──
  const getContainerSize = useCallback(() => {
    const w = containerRef.current?.clientWidth || 600;
    const h = w / aspectRatio;
    return { w, h };
  }, [aspectRatio]);

  const coverScale = imgNatural.w > 0 && imgNatural.h > 0
    ? Math.max(getContainerSize().w / imgNatural.w, getContainerSize().h / imgNatural.h)
    : 1;

  // ── Pixel size of displayed image ──
  const displayW = imgNatural.w * coverScale * zoom;
  const displayH = imgNatural.h * coverScale * zoom;

  // ── Pointer handling ──
  const getEventPos = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    if ('touches' in e) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }, []);

  const handlePointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const pos = getEventPos(e);
    setDragging(true);
    setDragStart({ x: pos.x, y: pos.y, px: pan.x, py: pan.y });
  };

  const handlePointerMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!dragging) return;
    const pos = getEventPos(e);
    setPan({
      x: dragStart.px + (pos.x - dragStart.x),
      y: dragStart.py + (pos.y - dragStart.y),
    });
  };

  const handlePointerUp = () => setDragging(false);

  const handleZoom = (delta: number) => {
    const container = getContainerSize();
    setZoom(prev => {
      const next = Math.max(1, Math.min(5, prev + delta));
      // Adjust pan so zoom centers on container midpoint
      const scaleFactor = next / prev;
      setPan(p => ({
        x: container.w / 2 - (container.w / 2 - p.x) * scaleFactor,
        y: container.h / 2 - (container.h / 2 - p.y) * scaleFactor,
      }));
      return next;
    });
  };

  // ── Crop: use the visible image as-is, scaled to output size ──
  const handleCrop = () => {
    const img = imgRef.current;
    if (!img) {
      convertSrcToDataUrl(src).then(onCrop).catch(() => onCrop(src));
      return;
    }

    const container = getContainerSize();

    try {
      const canvas = document.createElement('canvas');
      canvas.width = outputWidth;
      canvas.height = Math.round(outputWidth / aspectRatio);
      const ctx = canvas.getContext('2d');
      if (!ctx) { fallback(); return; }

      ctx.fillStyle = '#0D0D0D';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Source pixel coordinates of the top-left of the visible area
      const srcX = (displayW / 2 - container.w / 2 - pan.x) / (coverScale * zoom);
      const srcY = (displayH / 2 - container.h / 2 - pan.y) / (coverScale * zoom);
      const srcW = container.w / (coverScale * zoom);
      const srcH = container.h / (coverScale * zoom);

      ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, canvas.width, canvas.height);
      onCrop(canvas.toDataURL('image/jpeg', 0.85));
    } catch {
      fallback();
    }

    function fallback() {
      convertSrcToDataUrl(src).then(onCrop).catch(() => onCrop(src));
    }
  };

  const convertSrcToDataUrl = (imageSrc: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const c = document.createElement('canvas');
          c.width = img.naturalWidth;
          c.height = img.naturalHeight;
          const ctx = c.getContext('2d');
          if (!ctx) { reject(new Error('No context')); return; }
          ctx.drawImage(img, 0, 0);
          resolve(c.toDataURL('image/jpeg', 0.85));
        } catch { reject(new Error('Canvas error')); }
      };
      img.onerror = () => reject(new Error('Image load failed'));
      img.src = imageSrc;
    });
  };

  // ── Render ───────────────────────────────────────────────────
  if (!imgLoaded) {
    return (
      <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] aspect-video flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!imgRef.current) {
    return (
      <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] aspect-video flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Could not load image. Try a different file.</p>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4">
      {/* Crop area */}
      <div className="space-y-1">
        <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
          <span>Drag to reposition</span>
          <span className="text-muted-foreground/40">·</span>
          <span>Scroll to zoom</span>
        </p>
        <div
          ref={containerRef}
          className="relative rounded-2xl overflow-hidden cursor-grab active:cursor-grabbing select-none touch-none bg-[#0A0A0A] border border-white/[0.08]"
          style={{ aspectRatio: `${aspectRatio}` }}
          onMouseDown={handlePointerDown}
          onMouseMove={handlePointerMove}
          onMouseUp={handlePointerUp}
          onMouseLeave={handlePointerUp}
          onTouchStart={handlePointerDown}
          onTouchMove={handlePointerMove}
          onTouchEnd={handlePointerUp}
          onWheel={(e) => { e.preventDefault(); handleZoom(e.deltaY > 0 ? -0.15 : 0.15); }}
        >
          {/* The image — sized to cover container at current zoom */}
          <img
            src={src}
            alt="Crop preview"
            className="absolute pointer-events-none"
            style={{
              width: `${displayW}px`,
              height: `${displayH}px`,
              maxWidth: 'none',
              left: '50%',
              top: '50%',
              transform: `translate(calc(-50% + ${pan.x}px), calc(-50% + ${pan.y}px))`,
            }}
            draggable={false}
          />

          {/* Rule of thirds grid */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute left-1/3 top-0 bottom-0 w-px bg-white/10" />
            <div className="absolute left-2/3 top-0 bottom-0 w-px bg-white/10" />
            <div className="absolute top-1/3 left-0 right-0 h-px bg-white/10" />
            <div className="absolute top-2/3 left-0 right-0 h-px bg-white/10" />
          </div>
        </div>
      </div>

      {/* Zoom controls */}
      <div className="flex items-center justify-center gap-3">
        <button onClick={() => handleZoom(-0.15)} disabled={zoom <= 1}
          className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/[0.06] transition-colors disabled:opacity-30 active:scale-[0.95]">
          <ZoomOut size={16} />
        </button>
        <div className="text-xs text-muted-foreground tabular-nums w-12 text-center">{Math.round(zoom * 100)}%</div>
        <button onClick={() => handleZoom(0.15)} disabled={zoom >= 5}
          className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/[0.06] transition-colors disabled:opacity-30 active:scale-[0.95]">
          <ZoomIn size={16} />
        </button>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button onClick={onCancel}
          className="flex-1 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-white/[0.05] transition-all active:scale-[0.98] flex items-center justify-center gap-1.5">
          <X size={16} /> Cancel
        </button>
        <button onClick={handleCrop}
          className="flex-[2] py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-all active:scale-[0.98] flex items-center justify-center gap-1.5 hover:shadow-[0_0_24px_rgba(91,127,255,0.25)]">
          <Check size={16} /> Apply crop
        </button>
      </div>
    </motion.div>
  );
}
