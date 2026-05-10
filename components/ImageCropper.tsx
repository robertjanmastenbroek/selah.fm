'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ZoomIn, ZoomOut, Check, X } from 'lucide-react';

interface ImageCropperProps {
  src: string;              // Source image (data URL or URL)
  onCrop: (croppedDataUrl: string) => void;
  onCancel: () => void;
  aspectRatio?: number;     // Default 16/9 for campaign covers
  outputWidth?: number;     // Output pixel width (default 1200)
}

interface CropState {
  x: number;       // Pan offset X (px)
  y: number;       // Pan offset Y (px)
  scale: number;   // Zoom level (1 = fit to crop area)
}

export default function ImageCropper({
  src,
  onCrop,
  onCancel,
  aspectRatio = 16 / 9,
  outputWidth = 1200,
}: ImageCropperProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgNatural, setImgNatural] = useState({ w: 0, h: 0 });
  const [containerSize, setContainerSize] = useState({ w: 0, h: 0 });

  const [crop, setCrop] = useState<CropState>({ x: 0, y: 0, scale: 1 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, cx: 0, cy: 0 });

  // Load image
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imgRef.current = img;
      setImgNatural({ w: img.naturalWidth, h: img.naturalHeight });
      setImgLoaded(true);
    };
    img.src = src;
    return () => { img.onload = null; };
  }, [src]);

  // Measure container on mount and resize
  useEffect(() => {
    const measure = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      // Constrain to aspect ratio
      const maxW = rect.width - 4;
      let w = maxW;
      let h = w / aspectRatio;
      if (h > 500) { h = 500; w = h * aspectRatio; }
      setContainerSize({ w, h });
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [aspectRatio]);

  // Calculate initial scale to fit image within crop area
  useEffect(() => {
    if (!imgLoaded || containerSize.w === 0) return;
    const fitScale = Math.max(
      containerSize.w / imgNatural.w,
      containerSize.h / imgNatural.h
    );
    setCrop({ x: 0, y: 0, scale: fitScale });
  }, [imgLoaded, containerSize, imgNatural]);

  // Render the canvas
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img || containerSize.w === 0) return;

    const ctx = canvas.getContext('2d')!;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = containerSize.w * dpr;
    canvas.height = containerSize.h * dpr;
    canvas.style.width = `${containerSize.w}px`;
    canvas.style.height = `${containerSize.h}px`;
    ctx.scale(dpr, dpr);

    // Dark background
    ctx.fillStyle = '#0A0A0A';
    ctx.fillRect(0, 0, containerSize.w, containerSize.h);

    // Draw image with pan and zoom
    const scaledW = img.naturalWidth * crop.scale;
    const scaledH = img.naturalHeight * crop.scale;
    const drawX = (containerSize.w - scaledW) / 2 + crop.x;
    const drawY = (containerSize.h - scaledH) / 2 + crop.y;

    ctx.save();
    // Clip to crop area
    ctx.beginPath();
    ctx.rect(0, 0, containerSize.w, containerSize.h);
    ctx.clip();
    ctx.drawImage(img, drawX, drawY, scaledW, scaledH);
    ctx.restore();

    // Grid overlay
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1;
    const thirdsW = containerSize.w / 3;
    const thirdsH = containerSize.h / 3;
    for (let i = 1; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(thirdsW * i, 0);
      ctx.lineTo(thirdsW * i, containerSize.h);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, thirdsH * i);
      ctx.lineTo(containerSize.w, thirdsH * i);
      ctx.stroke();
    }

    // Border
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, containerSize.w, containerSize.h);
  }, [containerSize, crop]);

  useEffect(() => { renderCanvas(); }, [renderCanvas]);

  // Mouse/touch handlers
  const getEventPos = (e: React.MouseEvent | React.TouchEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    if ('touches' in e) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const handlePointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const pos = getEventPos(e);
    setDragging(true);
    setDragStart({ x: pos.x, y: pos.y, cx: crop.x, cy: crop.y });
  };

  const handlePointerMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!dragging) return;
    const pos = getEventPos(e);
    setCrop(prev => ({
      ...prev,
      x: dragStart.cx + (pos.x - dragStart.x),
      y: dragStart.cy + (pos.y - dragStart.y),
    }));
  };

  const handlePointerUp = () => { setDragging(false); };

  // Zoom
  const zoom = (delta: number) => {
    setCrop(prev => ({
      ...prev,
      scale: Math.max(0.5, Math.min(3, prev.scale + delta)),
    }));
  };

  // Output cropped image
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

    const scaleFactor = outputWidth / containerSize.w;
    const drawW = img.naturalWidth * crop.scale * scaleFactor;
    const drawH = img.naturalHeight * crop.scale * scaleFactor;
    const drawX = -((img.naturalWidth * crop.scale - containerSize.w) / 2 - crop.x) * scaleFactor;
    const drawY = -((img.naturalHeight * crop.scale - containerSize.h) / 2 - crop.y) * scaleFactor;

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
          className="relative rounded-2xl overflow-hidden cursor-grab active:cursor-grabbing select-none touch-none border border-white/[0.08]"
          style={{ width: '100%', maxHeight: 500, aspectRatio: `${aspectRatio}` }}
          onMouseDown={handlePointerDown}
          onMouseMove={handlePointerMove}
          onMouseUp={handlePointerUp}
          onMouseLeave={handlePointerUp}
          onTouchStart={handlePointerDown}
          onTouchMove={handlePointerMove}
          onTouchEnd={handlePointerUp}
          onWheel={(e) => { e.preventDefault(); zoom(e.deltaY > 0 ? -0.1 : 0.1); }}
        >
          <canvas ref={canvasRef} className="w-full h-full block" />
        </div>
      </div>

      {/* Zoom controls */}
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={() => zoom(-0.1)}
          disabled={crop.scale <= 0.5}
          className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/[0.06] transition-colors disabled:opacity-30 active:scale-[0.95]"
        >
          <ZoomOut size={16} />
        </button>
        <div className="text-xs text-muted-foreground tabular-nums w-12 text-center">
          {Math.round(crop.scale * 100)}%
        </div>
        <button
          onClick={() => zoom(0.1)}
          disabled={crop.scale >= 3}
          className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/[0.06] transition-colors disabled:opacity-30 active:scale-[0.95]"
        >
          <ZoomIn size={16} />
        </button>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={onCancel}
          className="flex-1 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-white/[0.05] transition-all active:scale-[0.98] flex items-center justify-center gap-1.5"
        >
          <X size={16} /> Cancel
        </button>
        <button
          onClick={handleCrop}
          className="flex-[2] py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-all active:scale-[0.98] flex items-center justify-center gap-1.5 hover:shadow-[0_0_24px_rgba(91,127,255,0.25)]"
        >
          <Check size={16} /> Apply crop
        </button>
      </div>
    </motion.div>
  );
}
