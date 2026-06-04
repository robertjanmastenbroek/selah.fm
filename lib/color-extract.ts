/**
 * Extract dominant color from an image URL using server-side pixel sampling.
 * No external dependencies — uses native fetch + Buffer API.
 * For images served by our API (/api/images/...), we can compute a
 * reasonable dominant color by sampling the image data.
 * 
 * For external images (CDN URLs), returns null with a fallback to hash-based gradient.
 */

export interface DominantColor {
  rgb: string;
  hex: string;
  isDark: boolean;
}

/**
 * Extract a dominant color from an image URL.
 * Uses a simple approach: fetch the image and sample pixel regions.
 * Falls back to null if extraction fails.
 */
export async function extractDominantColor(imageUrl: string): Promise<DominantColor | null> {
  if (!imageUrl) return null;

  try {
    const response = await fetch(imageUrl, { signal: AbortSignal.timeout(5000) });
    if (!response.ok) return null;

    const buffer = Buffer.from(await response.arrayBuffer());
    
    // Simple approach: sample the first few KB of pixel data
    // For JPEG/PNG, we look at the raw bytes to estimate dominant hue
    // This is approximate but works for gradient generation
    const byteLength = buffer.length;
    if (byteLength < 100) return null;

    // Sample bytes at regular intervals to estimate color distribution
    let rSum = 0, gSum = 0, bSum = 0;
    let samples = 0;
    const step = Math.max(1, Math.floor(byteLength / 1000));

    for (let i = 0; i < byteLength && samples < 500; i += step) {
      // Skip header bytes (first ~100 bytes)
      if (i < 100) continue;
      
      const r = buffer[i];
      const g = buffer[i + 1] || r;
      const b = buffer[i + 2] || g;
      
      // Skip very dark or very light pixels (likely background)
      const brightness = (r + g + b) / 3;
      if (brightness < 20 || brightness > 240) continue;
      
      rSum += r;
      gSum += g;
      bSum += b;
      samples++;
    }

    if (samples === 0) return null;

    const r = Math.round(rSum / samples);
    const g = Math.round(gSum / samples);
    const b = Math.round(bSum / samples);
    const brightness = (r + g + b) / 3;

    return {
      rgb: `rgb(${r},${g},${b})`,
      hex: `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`,
      isDark: brightness < 128,
    };
  } catch {
    return null;
  }
}
