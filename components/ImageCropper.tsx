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
  const [crop, setCrop] = useState({ x: 0, y: 0, scale: 1 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, px: 0, py: 0 });

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imgRef.current = img;
      setImgNatural({ w: img.naturalWidth, h: img.naturalHeight });
      // Calculate fit scale
      const containerW = containerRef.current?.clientWidth || 600;
      const containerH = containerW / aspectRatio;
      const fitScale = Math.max(containerW / img.naturalWidth, containerH / img.naturalHeight);
      setCrop({ x: 0, y: 0, scale: fitScale });
      setImgLoaded(true);
    };
    img.onerror = () => setImgLoaded(true); // Show error state
    img.src = src;
    return () => { img.onload = null; img.onerror = null; };
  }, [src, aspectRatio]);

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
    setDragStart({ x: pos.x, y: pos.y, px: crop.x, py: crop.y });
  };

  const handlePointerMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!dragging) return;
    const pos = getEventPos(e);
    setCrop(prev => ({
      ...prev,
      x: dragStart.px + (pos.x - dragStart.x),
      y: dragStart.py + (pos.y - dragStart.y),
    }));
  };

  const handlePointerUp = () => setDragging(false);

  const zoom = (delta: number) => {
    setCrop(prev => ({ ...prev, scale: Math.max(0.3, Math.min(4, prev.scale + delta)) }));
  };

  const handleCrop = () => {
    const img = imgRef.current;
    if (!img) return;

    const canvas = document.createElement('canvas');
    const outH = Math.round(outputWidth / aspectRatio);
    canvas.width = outputWidth;
    canvas.height = outH;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#0D0D0D';
    ctx.fillRect(0, 0, outputWidth, outH);

    const containerW = containerRef.current?.clientWidth || 600;
    const containerH = containerW / aspectRatio;
    const scaleFactor = outputWidth / containerW;
    const drawW = img.naturalWidth * crop.scale * scaleFactor;
    const drawH = img.naturalHeight * crop.scale * scaleFactor;
    const drawX = ((containerW - img.naturalWidth * crop.scale) / 2 + crop.x) * scaleFactor;
    const drawY = ((containerH - img.naturalHeight * crop.scale) / 2 + crop.y) * scaleFactor;

    ctx.drawImage(img, drawX, drawY, drawW, drawH);
    onCrop(canvas.toDataURL('image/jpeg', 0.85));
  };

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

  const containerW = 600; // Base width for calculation
  const imgW = imgNatural.w * crop.scale;
  const imgH = imgNatural.h * crop.scale;
  const translateX = ((containerW - imgW) / 2 + crop.x) / containerW * 100;
  const translateY = ((containerW / aspectRatio - imgH) / 2 + crop.y) / (containerW / aspectRatio) * 100;

  return (
    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4">
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
          onWheel={(e) => { e.preventDefault(); zoom(e.deltaY > 0 ? -0.1 : 0.1); }}
        >
          {/* Image with CSS transform — always visible, no canvas rendering issues */}
          <img
            src={src}
            alt="Crop preview"
            className="absolute pointer-events-none"
            style={{
              width: `${crop.scale * 100}%`,
              height: `${crop.scale * 100}%`,
              objectFit: 'contain',
              left: '50%',
              top: '50%',
              transform: `translate(calc(-50% + ${crop.x}px), calc(-50% + ${crop.y}px))`,
              transformOrigin: 'center center',
            }}
            draggable={false}
          />

          {/* Rule of thirds grid overlay */}
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
        <button onClick={() => zoom(-0.1)} disabled={crop.scale <= 0.3}
          className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/[0.06] transition-colors disabled:opacity-30 active:scale-[0.95]">
          <ZoomOut size={16} />
        </button>
        <div className="text-xs text-muted-foreground tabular-nums w-12 text-center">{Math.round(crop.scale * 100)}%</div>
        <button onClick={() => zoom(0.1)} disabled={crop.scale >= 4}
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
