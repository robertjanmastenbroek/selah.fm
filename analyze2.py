from PIL import Image
img = Image.open('/var/folders/b7/z9kf1r_j6n144zdvhjxktzj80000gn/T/TemporaryItems/NSIRD_screencaptureui_QOyWwm/Screenshot 2026-05-11 at 16.09.43.png')
w, h = img.size

# Top section detail
for y in range(0, 300, 4):
    left = img.getpixel((20, y))
    ctr = img.getpixel((w//2, y))
    right = img.getpixel((w-20, y))
    l_b = sum(left)/3
    c_b = sum(ctr)/3
    r_b = sum(right)/3
    if l_b < 200 or c_b < 200 or r_b < 200 or y < 80:
        print(f'y={y:3d} L({left[0]:3d},{left[1]:3d},{left[2]:3d} b={l_b:.0f}) C({ctr[0]:3d},{ctr[1]:3d},{ctr[2]:3d} b={c_b:.0f}) R({right[0]:3d},{right[1]:3d},{right[2]:3d} b={r_b:.0f})')

print('\n--- Bottom section ---')
for y in range(300, h, 4):
    left = img.getpixel((20, y))
    ctr = img.getpixel((w//2, y))
    right = img.getpixel((w-20, y))
    l_b = sum(left)/3
    c_b = sum(ctr)/3
    r_b = sum(right)/3
    if l_b < 200 or r_b < 200 or c_b < 180:
        print(f'y={y:3d} L({left[0]:3d},{left[1]:3d},{left[2]:3d} b={l_b:.0f}) C({ctr[0]:3d},{ctr[1]:3d},{ctr[2]:3d} b={c_b:.0f}) R({right[0]:3d},{right[1]:3d},{right[2]:3d} b={r_b:.0f})')
