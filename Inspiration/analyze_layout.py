#!/usr/bin/env python3
"""Targeted GoFundMe layout analysis - examine specific UI regions in each screenshot."""

from PIL import Image
import os

BASE = "/Users/motomoto/Documents/selah.fm/inspiration"
FILES = [f"IMG_{n}.PNG" for n in range(7967, 7975)]

def load(idx):
    return Image.open(os.path.join(BASE, FILES[idx])).convert("RGB")

def sample_row(img, y, n_samples=40):
    """Sample n_samples pixels across a row, return average RGB."""
    w = img.size[0]
    pixels = []
    for i in range(n_samples):
        x = int(w * (i + 0.5) / n_samples)
        pixels.append(img.getpixel((x, y)))
    avg = tuple(sum(c) / len(pixels) for c in zip(*pixels))
    return avg

def sample_vertical_strip(img, x_ratio=0.5, every=4):
    """Sample a vertical strip down the center, every N pixels."""
    w, h = img.size
    x = int(w * x_ratio)
    rows = []
    for y in range(0, h, every):
        p = img.getpixel((x, y))
        rows.append((y, p))
    return rows

def detect_horizontal_edges(img, threshold=30):
    """Find y positions where there's a sharp horizontal color change (likely section boundaries)."""
    w, h = img.size
    strip = sample_vertical_strip(img, x_ratio=0.5, every=1)
    edges = []
    for i in range(1, len(strip)):
        y, p = strip[i]
        _, prev_p = strip[i-1]
        diff = abs(p[0]-prev_p[0]) + abs(p[1]-prev_p[1]) + abs(p[2]-prev_p[2])
        if diff > threshold:
            edges.append((y, diff))
    return edges

def detect_horizontal_lines(img, threshold=30):
    """Find full-width horizontal lines (separators)."""
    w, h = img.size
    lines = []
    for y in range(0, h, 2):
        # Check if this row is a solid color line (all pixels similar)
        samples = [img.getpixel((int(w*i/30), y)) for i in range(30)]
        # Check uniformity
        diffs = [abs(s[0]-samples[0][0]) + abs(s[1]-samples[0][1]) + abs(s[2]-samples[0][2]) for s in samples]
        if max(diffs) < 20:
            avg = tuple(sum(s[i] for s in samples)//len(samples) for i in range(3))
            if all(180 < c < 230 for c in avg):  # gray separator
                lines.append((y, avg))
    return lines

def main():
    print("=" * 80)
    print("GOFUNDME MOBILE LAYOUT ANALYSIS")
    print("=" * 80)
    
    # ---- Image 1: Top of page (hero section) ----
    print("\n" + "=" * 80)
    print("IMAGE 1 (IMG_7967.PNG): TOP OF PAGE — ABOVE THE FOLD")
    print("=" * 80)
    img1 = load(0)
    w1, h1 = img1.size
    print(f"Dimensions: {w1}x{h1} (iPhone ratio {h1/w1:.2f}:1)")
    
    # Sample key y positions
    print("\nVertical strip (center column, every 20px):")
    print(f"{'y':>5}  {'R':>3} {'G':>3} {'B':>3}  interpretation")
    print(f"{'---':>5}  {'---':>3} {'---':>3} {'---':>3}  {'--------------'}")
    for y in range(0, h1, 20):
        avg = sample_row(img1, y)
        r, g, b = [round(c) for c in avg]
        note = ""
        if y < 190:
            note = "← STATUS BAR / NAV HEADER"
        elif all(c > 240 for c in avg):
            note = "← white space"
        elif all(c < 50 for c in avg):
            note = "← dark area (image?)"
        elif g > r + 30 and g > b + 30:
            note = "← GREEN (donate/progress)"
        elif r > g + 40 and r > b + 20:
            note = "← warm tones (photo)"
        elif all(200 < c < 230 for c in avg):
            note = "← light gray (card bg)"
        elif all(c < 100 for c in avg):
            note = "← medium dark (text)"
        print(f"{y:>5}: {r:>3} {g:>3} {b:>3}  {note}")
    
    # Find edges
    edges1 = detect_horizontal_edges(img1, threshold=35)
    print(f"\nMajor horizontal edges (diff > 50):")
    for y, d in edges1:
        if d > 50:
            print(f"  y={y}: edge strength={d}")

    # Find separator lines
    lines1 = detect_horizontal_lines(img1)
    if lines1:
        print(f"\nSeparator lines (full-width gray):")
        for y, c in lines1:
            print(f"  y={y}: rgb=({c[0]},{c[1]},{c[2]})")

    # ---- Compare all 8 images for sticky elements ----
    print("\n\n" + "=" * 80)
    print("STICKY HEADER ANALYSIS (first 190px of each image)")
    print("=" * 80)
    for i in range(8):
        img = load(i)
        # Check first 190px
        top_strip = [sample_row(img, y) for y in range(0, 190, 5)]
        avg_top = tuple(int(sum(c)/len(c)) for c in zip(*top_strip))
        print(f"  IMG_796{i+7}: top 190px avg RGB = ({avg_top[0]}, {avg_top[1]}, {avg_top[2]})")

    # ---- Analyze bottom of each image for sticky CTA ----
    print("\n\n" + "=" * 80)
    print("BOTTOM STICKY CTA ANALYSIS (last 200px of each image)")
    print("=" * 80)
    for i in range(8):
        img = load(i)
        w, h = img.size
        bottom_strip = [sample_row(img, y) for y in range(h-200, h, 10)]
        types = {}
        for y_val, p in zip(range(h-200, h, 10), bottom_strip):
            r, g, b = p
            if g > r + 25 and g > b + 25:
                types[y_val] = "GREEN"
            elif all(c > 230 for c in p):
                types[y_val] = "WHITE"
            elif all(c < 60 for c in p):
                types[y_val] = "DARK"
            elif all(200 < c < 230 for c in p):
                types[y_val] = "GRAY"
        # summarize
        green_zones = [y for y, t in types.items() if t == "GREEN"]
        white_zones = [y for y, t in types.items() if t == "WHITE"]
        print(f"  IMG_796{i+7} bottom 200px: GREEN={len(green_zones)}px WHITE={len(white_zones)}px")
        if green_zones:
            print(f"    Green at y={min(green_zones)}-{max(green_zones)} (image-local)")

    # ---- Image 8 (bottom of page): Detailed analysis ----
    print("\n\n" + "=" * 80)
    print("IMAGE 8 (IMG_7974.PNG): BOTTOM OF PAGE")
    print("=" * 80)
    img8 = load(7)
    w8, h8 = img8.size
    print(f"\nVertical strip (every 20px):")
    print(f"{'y':>5}  {'R':>3} {'G':>3} {'B':>3}")
    for y in range(0, h8, 20):
        avg = sample_row(img8, y)
        r, g, b = [round(c) for c in avg]
        print(f"{y:>5}: {r:>3} {g:>3} {b:>3}")

    # ---- Summary: what's visible in each image ----
    print("\n\n" + "=" * 80)
    print("WHAT'S VISIBLE IN EACH SCREENSHOT (qualitative)")
    print("=" * 80)
    
    descriptions = [
        ("#1 (7967)", "Very top of page. Hero image visible (warm/dark tones 190-560). Large green Donate button at y~880. Below: white space with donation stats/amounts. Image seems to show the full hero + CTA above the fold."),
        ("#2 (7968)", "Scrolled slightly down from #1. Hero image still partially visible at top? Same dark header. Much more white content. Green button now at the very BOTTOM (y~2340) — this is the sticky CTA. The original green button from #1 has scrolled off top."),
        ("#3 (7969)", "More scrolled. Large TEXT region (854px!) from y~1129-1983 — this is likely the campaign story. Green sticky CTA still at bottom."),
        ("#4 (7970)", "Still scrolling. Lots of white space (cards/sections). Green CTA at bottom."),
        ("#5 (7971)", "Lots of white space, many small card-like sections."),
        ("#6 (7972)", "Similar white space with cards. No green at bottom."),
        ("#7 (7973)", "DARK region at y~3593-3737 (144px) — maybe a photo in the story. White space with cards."),
        ("#8 (7974)", "Bottom of page. DARK footer at end. WARM region (photo) at y~4377-4453. LGRAY section (card).")
    ]
    for name, desc in descriptions:
        print(f"\n  {name}: {desc}")

    # ---- Special: check if IMG_7967 has two green regions ----
    print("\n\n" + "=" * 80)
    print("DUAL GREEN REGION CHECK: Does IMG_7967 have both hero CTA + sticky bottom CTA?")
    print("=" * 80)
    img1 = load(0)
    green_ys = []
    for y in range(0, h1, 5):
        avg = sample_row(img1, y)
        if avg[1] > avg[0] + 30 and avg[1] > avg[2] + 30:
            green_ys.append(y)
    if green_ys:
        # find contiguous blocks
        blocks = []
        block_start = green_ys[0]
        prev = green_ys[0]
        for gy in green_ys[1:]:
            if gy - prev > 10:
                blocks.append((block_start, prev))
                block_start = gy
            prev = gy
        blocks.append((block_start, prev))
        print(f"  Green regions in IMG_7967:")
        for s, e in blocks:
            print(f"    y={s}-{e} ({e-s}px)")

if __name__ == "__main__":
    main()
