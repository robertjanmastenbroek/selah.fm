from PIL import Image
import os

path = '/var/folders/b7/z9kf1r_j6n144zdvhjxktzj80000gn/T/TemporaryItems/NSIRD_screencaptureui_QOyWwm/Screenshot 2026-05-11 at 16.09.43.png'
if not os.path.exists(path):
    print('File not found')
    exit(1)

img = Image.open(path)
w, h = img.size
print(f'Dimensions: {w}x{h}\n')

# Row-by-row zone detection
prev_zone = None
for y in range(0, h, 8):
    pixels = [img.getpixel((int(w*j/40), y)) for j in range(40)]
    r = sum(p[0] for p in pixels) // len(pixels)
    g = sum(p[1] for p in pixels) // len(pixels)
    b = sum(p[2] for p in pixels) // len(pixels)
    bright = (r + g + b) / 3
    zone = 'WHITE' if bright > 200 else 'LIGHT' if bright > 130 else 'MID' if bright > 60 else 'DARK'
    if zone != prev_zone:
        pct = y/h * 100
        print(f'y={y:4d} ({pct:5.1f}%) [{r:3d},{g:3d},{b:3d}] {zone}')
    prev_zone = zone

# Key positions
print('\nKey positions:')
for check_y in [0, h//6, h//3, h//2, h*2//3, h-1]:
    pixels = [img.getpixel((int(w*j/40), check_y)) for j in range(40)]
    r = sum(p[0] for p in pixels)//len(pixels)
    g = sum(p[1] for p in pixels)//len(pixels)
    b = sum(p[2] for p in pixels)//len(pixels)
    bright = (r+g+b)/3
    is_blue = b > r + 15 and b > g + 10
    is_green = g > r + 15 and g > b + 10
    markers = []
    if is_blue: markers.append('BLUE')
    if is_green: markers.append('GREEN')
    print(f'  y={check_y:4d} [{r:3d},{g:3d},{b:3d}] b={bright:.0f}  {" ".join(markers)}')
