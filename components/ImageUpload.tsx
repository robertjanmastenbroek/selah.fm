'use client';

import { useState, useRef, useCallback } from 'react';

interface ImageUploadProps {
  onImage: (url: string) => void;
  currentImage?: string;
}

// Compress and resize image via canvas before converting to base64
async function compressImage(file: File, maxWidth = 1200, quality = 0.8): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      // Calculate dimensions: max 1200px wide, maintain aspect ratio
      let { width, height } = img;
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d')!;

      // Fill background with a dark color (for transparent PNGs)
      ctx.fillStyle = '#0D0D0D';
      ctx.fillRect(0, 0, width, height);

      // Draw image centered
      ctx.drawImage(img, 0, 0, width, height);

      // Convert to JPEG base64 (smaller than PNG)
      resolve(canvas.toDataURL('image/jpeg', quality));
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
}

// Format bytes to human-readable
function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / 1048576).toFixed(1)}MB`;
}

// Crop position state
interface CropPosition {
  x: number; // 0-100 percentage offset from center
  y: number;
  scale: number; // 1-2 zoom
}

export default function ImageUpload({ onImage, currentImage }: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentImage || null);
  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  const MAX_SIZE = 10 * 1024 * 1024; // 10MB

  const handleFile = useCallback(async (file: File) => {
    // Validate type
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError('Please use JPEG, PNG, WebP, or GIF images.');
      return;
    }

    // Validate size
    if (file.size > MAX_SIZE) {
      setError(`Image too large (${formatBytes(file.size)}). Maximum is 10MB.`);
      return;
    }

    setError(null);
    setProcessing(true);
    setFileName(file.name);
    setFileSize(formatBytes(file.size));

    try {
      // Compress and convert to base64
      const compressed = await compressImage(file);
      setPreview(compressed);
      onImage(compressed);

      // Show compressed size
      const compressedBytes = Math.round((compressed.length * 3) / 4);
      setFileSize(`${formatBytes(file.size)} → ${formatBytes(compressedBytes)} after compression`);
    } catch {
      setError('Failed to process image. Try a different file.');
    } finally {
      setProcessing(false);
    }
  }, [onImage]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  return (
    <div className="space-y-3">
      {/* Upload area */}
      <div
        onClick={() => fileRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`relative rounded-2xl border-2 border-dashed transition-all cursor-pointer overflow-hidden
          ${preview ? 'border-transparent' : dragging ? 'border-primary/40 bg-primary/[0.04]' : 'border-white/[0.08] hover:border-white/[0.15]'}
          ${preview ? 'aspect-[16/9]' : 'h-52'}`}
      >
        {preview ? (
          <>
            <img src={preview} alt="Campaign cover" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="text-white text-sm font-semibold bg-black/60 px-5 py-2.5 rounded-xl backdrop-blur-sm">
                Change cover image
              </span>
            </div>
            {fileName && (
              <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-sm rounded-lg px-3 py-1.5 text-[10px] text-white/70">
                {fileName} · {fileSize}
              </div>
            )}
          </>
        ) : processing ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mb-3" />
            <div className="text-sm">Processing image...</div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="mb-3 opacity-30">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="M21 15l-5-5L5 21" />
            </svg>
            <div className="text-sm font-medium">Drop cover art here</div>
            <div className="text-xs mt-1 text-muted-foreground/50">or click to browse</div>
          </div>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
        />
      </div>

      {/* Error message */}
      {error && (
        <p className="text-xs text-destructive flex items-center gap-1.5">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
          {error}
        </p>
      )}

      {/* Guidelines */}
      <div className="rounded-xl bg-white/[0.02] border border-white/[0.04] p-3 text-[10px] text-muted-foreground/60 leading-relaxed">
        <p className="font-medium text-muted-foreground mb-1">Cover image guidelines</p>
        <p>Recommended: <strong className="text-muted-foreground">1200 × 675px</strong> (16:9 landscape) · JPEG or WebP · Under 10MB</p>
        <p className="mt-0.5">Images are automatically compressed and resized for fast loading.</p>
      </div>
    </div>
  );
}
