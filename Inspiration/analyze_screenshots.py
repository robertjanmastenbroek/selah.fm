#!/usr/bin/env python3
"""Analyze 8 GoFundMe mobile screenshots for layout structure."""

from PIL import Image
import os

BASE = "/Users/motomoto/Documents/selah.fm/inspiration"
FILES = [f"IMG_{n}.PNG" for n in range(7967, 7975)]

def load(path):
    return Image.open(path)

def analyze_image(path, idx):
    """Return structured info about one screenshot."""
    img = Image.open(path)
    w, h = img.size
    info = {
        "index": idx + 1,
        "file": os.path.basename(path),
        "width": w,
        "height": h,
    }
    # Sample horizontal stripes every 50px to detect content vs whitespace
    stripes = []
    for y in range(0, h, 20):
        # Sample the center 60% of the row
        row_pixels = [img.getpixel((x, y)) for x in range(w//5, 4*w//5, 5)]
        # Average RGB
        avg = tuple(sum(c)/len(c) for c in zip(*row_pixels))
        # Detect if mostly white (all channels > 240)
        is_white = all(c > 235 for c in avg)
        is_light_gray = all(c > 220 for c in avg) and not is_white
        is_green = avg[1] > avg[0] + 20 and avg[1] > avg[2] + 20
        is_blue = avg[2] > avg[0] + 20 and avg[2] > avg[1] + 20
        is_dark = all(c < 80 for c in avg)
        is_warm = avg[0] > avg[2] + 30 and avg[0] > avg[1] + 10
        stripes.append({
            "y": y,
            "avg_rgb": tuple(round(c) for c in avg),
            "is_white": is_white,
            "is_light_gray": is_light_gray,
            "is_green": is_green,
            "is_blue": is_blue,
            "is_dark": is_dark,
            "is_warm": is_warm,
        })
    info["stripes"] = stripes

    # Find contiguous regions of similar type
    regions = []
    current_type = None
    region_start = 0
    for s in stripes:
        if s["is_green"]:
            t = "GREEN (progress/donate button)"
        elif s["is_blue"]:
            t = "BLUE (link/button)"
        elif s["is_dark"]:
            t = "DARK (text heavy / image)"
        elif s["is_warm"]:
            t = "WARM (image/skin tones)"
        elif s["is_white"]:
            t = "WHITE (background/spacing)"
        elif s["is_light_gray"]:
            t = "LIGHT_GRAY (card bg / section)"
        else:
            t = f"MIXED avg={s['avg_rgb']}"
        
        if t != current_type:
            if current_type is not None:
                regions.append({
                    "y_start": region_start,
                    "y_end": s["y"] - 20,
                    "height": s["y"] - region_start,
                    "type": current_type,
                })
            current_type = t
            region_start = s["y"]
    # Close last region
    if current_type is not None:
        regions.append({
            "y_start": region_start,
            "y_end": h,
            "height": h - region_start,
            "type": current_type,
        })
    info["regions"] = regions

    # Merge tiny regions (< 30px) into neighbors
    merged = []
    for r in regions:
        if merged and r["type"] == merged[-1]["type"]:
            merged[-1]["y_end"] = r["y_end"]
            merged[-1]["height"] += r["height"]
        else:
            merged.append(r)
    info["merged_regions"] = merged

    return info

def print_analysis(info):
    """Pretty-print the analysis for one screenshot."""
    print(f"\n{'='*80}")
    print(f"SCREENSHOT #{info['index']}: {info['file']}  ({info['width']}x{info['height']}px)")
    print(f"{'='*80}")
    
    print(f"\n--- Region map (top -> bottom) ---")
    print(f"{'y_start':>6} {'y_end':>6} {'height':>6}  {'type'}")
    print(f"{'------':>6} {'------':>6} {'------':>6}  {'----'}")
    for r in info["merged_regions"]:
        print(f"{r['y_start']:>6} {r['y_end']:>6} {r['height']:>6}  {r['type']}")

    # Summary stats
    total = info["height"]
    print(f"\n--- Summary ---")
    print(f"Total height: {total}px")
    for r in info["merged_regions"]:
        if r["height"] > 20:
            pct = r["height"] / total * 100
            print(f"  {r['type']}: {r['height']}px ({pct:.0f}%)  y={r['y_start']}-{r['y_end']}")

def main():
    all_infos = []
    for idx, fname in enumerate(FILES):
        path = os.path.join(BASE, fname)
        info = analyze_image(path, idx)
        all_infos.append(info)
        print_analysis(info)

    # Cross-screenshot comparison
    print(f"\n\n{'='*80}")
    print("CROSS-SCREENSHOT COMPARISON (scroll flow)")
    print(f"{'='*80}")
    print(f"{'#':>3} {'File':>12} {'Size':>12} {'Top region':>40} {'Bottom region':>40}")
    for info in all_infos:
        top_r = info["merged_regions"][0] if info["merged_regions"] else {"type": "?"}
        bot_r = info["merged_regions"][-1] if info["merged_regions"] else {"type": "?"}
        print(f"{info['index']:>3} {info['file']:>12} {info['width']}x{info['height']:<6} {top_r['type'][:38]:>40} {bot_r['type'][:38]:>40}")
    
    # Check what's common across all screenshots
    print(f"\n--- Height changes indicate scroll distance ---")
    for i in range(1, len(all_infos)):
        dh = all_infos[i]["height"] - all_infos[i-1]["height"]
        print(f"  #{i}->#{i+1}: height delta = {dh:+d}px")

if __name__ == "__main__":
    main()
