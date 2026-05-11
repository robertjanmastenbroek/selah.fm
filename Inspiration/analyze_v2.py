#!/usr/bin/env python3
"""Robust scroll detection using SIFT-like approach: find matching rows between images."""

from PIL import Image
import os

BASE = "/Users/motomoto/Documents/selah.fm/inspiration"
FILES = [f"IMG_{n}.PNG" for n in range(7967, 7975)]

def load(idx):
    return Image.open(os.path.join(BASE, FILES[idx])).convert("RGB")

def row_hash(img, y, n=50):
    """Compute a hash of a row for fast comparison."""
    w = img.size[0]
    pixels = [img.getpixel((int(w*(i+0.5)/n), y)) for i in range(n)]
    # Simple hash: quantize RGB
    h = 0
    for r, g, b in pixels:
        h = h * 31 + (r//16) * 256 + (g//16) * 16 + (b//16)
    return h

def find_best_match(img_above, img_below, search_range=800):
    """Find where the bottom of img_above matches in img_below using row hashes."""
    ah = img_above.size[1]
    bh = img_below.size[1]
    
    # Hash bottom 400px of above image every 4px
    above_hashes = []
    for y in range(ah-400, ah, 4):
        above_hashes.append(row_hash(img_above, y))
    
    # Hash top portion of below image
    below_hashes = []
    for y in range(0, min(bh, search_range+400), 4):
        below_hashes.append(row_hash(img_below, y))
    
    # Find offset where above_hashes matches below_hashes
    best_offset = 0
    best_matches = 0
    
    for offset in range(0, min(search_range, len(below_hashes) - len(above_hashes)), 1):
        matches = sum(1 for i in range(0, len(above_hashes), 5) 
                      if above_hashes[i] == below_hashes[offset + i])
        if matches > best_matches:
            best_matches = matches
            best_offset = offset * 4
    
    # The new content shown = ah - (bh - best_offset)
    # Actually: if bottom of above matches offset px from top of below,
    # then the scroll distance = ah - offset (the amount scrolled down)
    scroll_distance = ah - best_offset
    return scroll_distance, best_matches

def row_avg_rgb(img, y):
    """Average RGB across a row."""
    w = img.size[0]
    pixels = [img.getpixel((int(w*i/40), y)) for i in range(40)]
    return tuple(int(sum(c)/len(c)) for c in zip(*pixels))

def main():
    print("=" * 80)
    print("ROBUST SCROLL DETECTION VIA ROW HASHING")
    print("=" * 80)
    
    imgs = [load(i) for i in range(8)]
    
    # Test each consecutive pair
    scroll_distances = [0]
    for i in range(7):
        dist, matches = find_best_match(imgs[i], imgs[i+1])
        scroll_distances.append(dist)
        print(f"  {i+1}->{i+2}: scroll_distance={dist}px (matches={matches})")
    
    # Cumulative page positions
    page_ys = [0]
    for d in scroll_distances[1:]:
        page_ys.append(page_ys[-1] + d)
    
    print(f"\nPage positions:")
    for i, (f, py) in enumerate(zip(FILES, page_ys)):
        print(f"  {f}: top at page y = {py}")
    
    total = page_ys[-1] + imgs[-1].size[1]
    print(f"  Estimated total page: {total}px")
    
    # Now do a detailed structural analysis with absolute page coordinates
    print(f"\n\n{'='*80}")
    print(f"COMPREHENSIVE PAGE STRUCTURE")
    print(f"{'='*80}")
    
    # Build a combined timeline by combining all images at their page positions
    # For each absolute page y, find the best pixel from overlapping images
    
    # First, find approximate boundaries by analyzing color transitions
    # across all images in absolute coordinates
    
    # Let's analyze each screenshot in its page context
    for idx, (img, page_y) in enumerate(zip(imgs, page_ys)):
        h = img.size[1]
        print(f"\n--- Screenshot #{idx+1} overlaps page y={page_y} to {page_y+h} ---")
        
        # Skip detailed analysis here; let's focus on key boundaries
        # Look for: hero image end, story start, donations start, footer start
        
        # Detect major color transitions
        prev_rgb = None
        for y in range(0, h, 10):
            rgb = row_avg_rgb(img, y)
            abs_y = page_y + y
            if prev_rgb:
                dr = abs(rgb[0] - prev_rgb[0])
                dg = abs(rgb[1] - prev_rgb[1])
                db = abs(rgb[2] - prev_rgb[2])
                if dr + dg + db > 120:
                    # Major transition
                    pass  # We'll collect these
    
    # Manual analysis based on the data we already have
    print(f"\n\n{'='*80}")
    print(f"LAYOUT STRUCTURE SUMMARY (from all data)")
    print(f"{'='*80}")
    
    print("""
Based on pixel analysis of all 8 screenshots:

=== STICKY ELEMENTS (always present) ===
- TOP: Dark header bar (y=0 to ~190px in every screenshot)
  Average RGB: (58, 60, 61) — dark gray
  Contains: iOS status bar + GoFundMe navigation (back arrow, title, share icon)

- BOTTOM: Green "Donate" CTA button (appears at bottom of screenshots 2-4)
  Position when visible: roughly local y=2340-2480
  Disappears in screenshots 5-8 (bottom portion of page)

=== IMG_7967: TOP OF PAGE (page y=0 to 2556) ===
  y=0-190:     STICKY HEADER (dark gray)
  y=190-560:   HERO IMAGE (warm tones, photo of person/campaign)
  y=560-880:   CAMPAIGN TITLE + BRIEF STATS (white bg with text)
  y=880-1000:  GREEN "DONATE" BUTTON (large CTA, ~120px tall)
  y=1000-2340: DONATION STATS + PROGRESS BAR area
               (white bg, repeated rows of stats — amount raised, goal, donor count)
  y=2340-2556: Bottom of this viewport (dark area — possibly the nav bar with 
               sticky elements appearing as the user scrolls)

=== IMG_7968: SCROLLED SLIGHTLY (still top area) ===
  y=0-190:     STICKY HEADER
  y=190-560:   HERO IMAGE (still partially visible? Wait...)
  
  ACTUALLY: Looking at the data more carefully, IMG_7968 has:
  y=0-190:     DARK (header)
  y=238-888:   WHITE (lots of white content)
  y=928-1074:  WHITE
  y=2344-2480: GREEN (sticky donate at bottom!)

  Wait - IMG_7968 might NOT start at page y=0. The row hash matching
  said scroll_distance=232? Let me re-check.

  From the first analysis: scroll between #1 and #2 came back as 0 with high error.
  The second analysis should give us better results.
""")

if __name__ == "__main__":
    main()
