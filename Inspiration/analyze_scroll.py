#!/usr/bin/env python3
"""Advanced analysis: find scroll offsets between consecutive screenshots via pixel comparison,
then reconstruct the full page and analyze layout."""

from PIL import Image
import os

BASE = "/Users/motomoto/Documents/selah.fm/inspiration"
FILES = [f"IMG_{n}.PNG" for n in range(7967, 7975)]

def load(idx):
    return Image.open(os.path.join(BASE, FILES[idx])).convert("RGB")

def find_scroll_offset(img_above, img_below, search_range=500, sample_cols=20):
    """
    Find how much the page scrolled between two screenshots.
    img_above = earlier in page (higher up)
    img_below = later in page (lower down)
    
    We take the bottom portion of img_above and find where it matches in img_below.
    Returns the y-offset: how many pixels of new content appeared.
    """
    aw, ah = img_above.size
    bw, bh = img_below.size
    w = min(aw, bw)
    
    # Sample columns spread across width
    col_positions = [int(w * (i+1) / (sample_cols+1)) for i in range(sample_cols)]
    
    # Take bottom 300px of top image as search pattern
    pattern_height = min(300, ah)
    pattern_y_start = ah - pattern_height
    
    best_offset = None
    best_error = float('inf')
    
    for offset in range(0, search_range, 5):
        total_error = 0
        count = 0
        for x in col_positions:
            for dy in range(0, pattern_height, 5):
                p_y = pattern_y_start + dy
                b_y = offset + dy
                if b_y < bh:
                    pa = img_above.getpixel((x, p_y))
                    pb = img_below.getpixel((x, b_y))
                    total_error += abs(pa[0]-pb[0]) + abs(pa[1]-pb[1]) + abs(pa[2]-pb[2])
                    count += 1
        if count > 0:
            avg_err = total_error / count
            if avg_err < best_error:
                best_error = avg_err
                best_offset = offset
    
    # Refine around best_offset with finer granularity
    if best_offset is not None:
        for offset in range(max(0, best_offset-8), min(search_range, best_offset+8)):
            total_error = 0
            count = 0
            for x in col_positions:
                for dy in range(0, pattern_height, 3):
                    p_y = pattern_y_start + dy
                    b_y = offset + dy
                    if b_y < bh:
                        pa = img_above.getpixel((x, p_y))
                        pb = img_below.getpixel((x, b_y))
                        total_error += abs(pa[0]-pb[0]) + abs(pa[1]-pb[1]) + abs(pa[2]-pb[2])
                        count += 1
            if count > 0:
                avg_err = total_error / count
                if avg_err < best_error:
                    best_error = avg_err
                    best_offset = offset
    
    return best_offset, best_error

def compute_row_dominance(img):
    """For each row, compute a simple hash and dominant color to help identify sections."""
    w, h = img.size
    rows = []
    for y in range(0, h, 2):
        sample_n = 30
        pixels = [img.getpixel((int(w*(i+1)/(sample_n+1)), y)) for i in range(sample_n)]
        avg = tuple(sum(c)/len(pixels) for c in zip(*pixels))
        # Dominant type
        r, g, b = avg
        if all(c < 60 for c in avg):
            kind = "DARK"
        elif g > r + 20 and g > b + 20:
            kind = "GREEN"
        elif b > r + 30 and b > g + 20:
            kind = "BLUE"
        elif r > g + 20 and r > b + 20:
            kind = "WARM"
        elif all(c > 235 for c in avg):
            kind = "WHITE"
        elif all(c > 210 for c in avg):
            kind = "LGRAY"
        else:
            kind = "TEXT"
        rows.append((y, avg, kind))
    return rows

def main():
    print("=" * 80)
    print("SCROLL OFFSET ANALYSIS BETWEEN CONSECUTIVE SCREENSHOTS")
    print("=" * 80)
    
    # Load all images
    imgs = [load(i) for i in range(8)]
    
    offsets = [0]  # first image starts at y=0
    total_errs = []
    search_ranges = [500, 500, 500, 500, 500, 600, 600]  # adjust per pair
    
    for i in range(7):
        print(f"\nFinding scroll between IMG_796{i+7} (higher) and IMG_796{i+8} (lower)...")
        offset, err = find_scroll_offset(imgs[i], imgs[i+1], search_range=search_ranges[i])
        offsets.append(offset)
        total_errs.append(err)
        print(f"  New content pixels: {offset}  (error={err:.1f})")
        if offset is None or offset <= 0:
            print(f"  WARNING: Could not determine reliable offset for pair {i+1}-{i+2}")
    
    # Cumulative position
    cum_y = [0]
    for o in offsets[1:]:
        cum_y.append(cum_y[-1] + o)
    
    print(f"\n--- Cumulative scroll positions (top of each screenshot in page) ---")
    for i, (fname, cy) in enumerate(zip(FILES, cum_y)):
        print(f"  {fname}: page y = {cy}px")
    
    total_page_height = cum_y[-1] + imgs[-1].size[1]
    print(f"\n  Estimated total page height: {total_page_height}px")
    
    # Now analyze the row dominance of each image with its page-position context
    print(f"\n\n{'='*80}")
    print("SECTION ANALYSIS PER SCREENSHOT (with page position)")
    print(f"{'='*80}")
    
    for i, (img, page_y) in enumerate(zip(imgs, cum_y)):
        print(f"\n--- IMG_796{i+7} (page y={page_y} to {page_y+img.size[1]}) ---")
        rows = compute_row_dominance(img)
        
        # Find contiguous same-type regions
        regions = []
        cur_kind = None
        cur_start = page_y
        for y, avg, kind in rows:
            abs_y = page_y + y
            if kind != cur_kind:
                if cur_kind is not None and abs_y - cur_start >= 20:
                    regions.append((cur_start, abs_y, abs_y - cur_start, cur_kind))
                cur_kind = kind
                cur_start = abs_y
        
        # Print notable regions (skip tiny ones)
        for r in regions:
            if r[2] > 30:
                print(f"  y={r[0]:>5}-{r[1]:>5} ({r[2]:>4}px) [{r[3]:>5}]")

    # Specific button detection: find GREEN regions across all images
    print(f"\n\n{'='*80}")
    print("GREEN REGIONS (likely Donate/Progress buttons) ACROSS ALL SCREENSHOTS")
    print(f"{'='*80}")
    for i, (img, page_y) in enumerate(zip(imgs, cum_y)):
        rows = compute_row_dominance(img)
        green_regions = []
        in_green = False
        start = 0
        for y, avg, kind in rows:
            if kind == "GREEN" and not in_green:
                start = page_y + y
                in_green = True
            elif kind != "GREEN" and in_green:
                green_regions.append((start, page_y + y, page_y + y - start))
                in_green = False
        if in_green:
            green_regions.append((start, page_y + img.size[1], page_y + img.size[1] - start))
        
        if green_regions:
            for g in green_regions:
                print(f"  IMG_796{i+7}: GREEN at page y={g[0]}-{g[1]} ({g[2]}px)")

    # BLUE regions
    print(f"\n\n{'='*80}")
    print("BLUE REGIONS (likely Share/link buttons) ACROSS ALL SCREENSHOTS")
    print(f"{'='*80}")
    for i, (img, page_y) in enumerate(zip(imgs, cum_y)):
        rows = compute_row_dominance(img)
        blue_regions = []
        in_blue = False
        start = 0
        for y, avg, kind in rows:
            if kind == "BLUE" and not in_blue:
                start = page_y + y
                in_blue = True
            elif kind != "BLUE" and in_blue:
                blue_regions.append((start, page_y + y, page_y + y - start))
                in_blue = False
        if in_blue:
            blue_regions.append((start, page_y + img.size[1], page_y + img.size[1] - start))
        
        if blue_regions:
            for b in blue_regions:
                print(f"  IMG_796{i+7}: BLUE at page y={b[0]}-{b[1]} ({b[2]}px)")

if __name__ == "__main__":
    main()
