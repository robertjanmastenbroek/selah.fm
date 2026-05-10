'use client';

import { useState, useRef, useCallback } from 'react';
import ImageCropper from '@/components/ImageCropper';

interface ImageUploadProps {
  onImage: (url: string) => void;
  currentImage?: string;
}

// Format bytes to human-readable
function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / 1048576).toFixed(1)}MB`;
}

export default function ImageUpload({ onImage, currentImage }: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentImage || null);
  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  const MAX_SIZE = 10 * 1024 * 1024;

  const handleFile = useCallback((file: File) => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError('Please use JPEG, PNG, WebP, or GIF images.');
      return;
    }
    if (file.size > MAX_SIZE) {
      setError(`Image too large (${formatBytes(file.size)}). Max 10MB.`);
      return;
    }
    setError(null);
    setProcessing(true);
    setFileName(file.name);
    setFileSize(formatBytes(file.size));

    // Create object URL for the cropper
    const url = URL.createObjectURL(file);
    setCropSrc(url);
    setProcessing(false);
  }, []);

  const handleCrop = useCallback((croppedDataUrl: string) => {
    // Only revoke the blob URL if the cropped result is different (i.e., it was converted to data URL)
    if (cropSrc && cropSrc !== croppedDataUrl) URL.revokeObjectURL(cropSrc);
    setCropSrc(null);
    setPreview(croppedDataUrl);
    onImage(croppedDataUrl);

    // Show compressed size
    const compressedBytes = Math.round((croppedDataUrl.length * 3) / 4);
    setFileSize(prev => {
      const original = prev?.split(' → ')[0] || '';
      return original ? `${original} → ${formatBytes(compressedBytes)} cropped` : formatBytes(compressedBytes);
    });
  }, [cropSrc, onImage]);

  const handleCancelCrop = useCallback(() => {
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    setCropSrc(null);
    setFileName(null);
    setFileSize(null);
  }, [cropSrc]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  // Check if currentImage is a data URL (already processed) or a file path
  const showCropper = cropSrc !== null;

  return (
    <div className="space-y-3">
      {showCropper ? (
        <ImageCropper
          src={cropSrc}
          onCrop={handleCrop}
          onCancel={handleCancelCrop}
          aspectRatio={16 / 9}
          outputWidth={1200}
        />
      ) : (
        <>
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
                <div className="text-sm">Processing...</div>
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

          {error && (
            <p className="text-xs text-destructive flex items-center gap-1.5">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
              {error}
            </p>
          )}

          <div className="rounded-xl bg-white/[0.02] border border-white/[0.04] p-3 text-[10px] text-muted-foreground/60 leading-relaxed">
            <p className="font-medium text-muted-foreground mb-1">Cover image guidelines</p>
            <p>Recommended: <strong className="text-muted-foreground">1200 × 675px</strong> (16:9 landscape) · JPEG or WebP · Under 10MB</p>
            <p className="mt-0.5">Drag to reposition and scroll to zoom after uploading.</p>
          </div>
        </>
      )}
    </div>
  );
}
