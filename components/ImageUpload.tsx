'use client';

import { useState, useRef } from 'react';

interface ImageUploadProps {
  onImage: (url: string) => void;
  currentImage?: string;
}

export default function ImageUpload({ onImage, currentImage }: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentImage || null);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const url = e.target?.result as string;
      setPreview(url);
      onImage(url);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  return (
    <div
      onClick={() => fileRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={`relative rounded-2xl border-2 border-dashed transition-all cursor-pointer overflow-hidden
        ${preview ? 'border-transparent' : dragging ? 'border-accent bg-accent/5' : 'border-border hover:border-muted-foreground/30'}
        ${preview ? 'aspect-[16/9]' : 'h-48'}`}
    >
      {preview ? (
        <>
          <img src={preview} alt="Campaign cover" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/30 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
            <span className="text-white text-sm font-semibold bg-black/50 px-4 py-2 rounded-xl">Change image</span>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
          <div className="text-3xl mb-2">🖼️</div>
          <div className="text-sm font-medium">Drop cover art here</div>
          <div className="text-xs mt-1 text-muted-foreground/60">or click to browse</div>
        </div>
      )}
      <input ref={fileRef} type="file" accept="image/*" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
    </div>
  );
}
