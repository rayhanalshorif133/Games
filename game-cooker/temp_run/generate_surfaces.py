import math
import numpy as np
from PIL import Image, ImageDraw

def generate_surfaces():
    # 1. Water surface (512x512 tileable)
    w_img = Image.new('RGBA', (512, 512), (32, 115, 128, 255))
    d_w = ImageDraw.Draw(w_img)
    # Caustics & highlights
    for y in range(0, 512, 16):
        for x in range(0, 512, 32):
            wave_off = math.sin((x + y * 2) * 0.05) * 8
            d_w.ellipse([x + wave_off, y, x + wave_off + 24, y + 8], fill=(60, 165, 175, 180))
            d_w.ellipse([x + wave_off + 4, y + 2, x + wave_off + 16, y + 5], fill=(120, 220, 235, 160))
    w_img.save('images/surface_water.png')
    
    # 2. Dirt path (512x512 tileable)
    d_img = Image.new('RGBA', (512, 512), (218, 178, 138, 255))
    d_d = ImageDraw.Draw(d_img)
    # Soil grain and wheel tracks
    d_d.rectangle([100, 0, 160, 512], fill=(200, 160, 120, 255))
    d_d.rectangle([352, 0, 412, 512], fill=(200, 160, 120, 255))
    np.random.seed(99)
    for _ in range(400):
        px = np.random.randint(0, 512)
        py = np.random.randint(0, 512)
        pr = np.random.randint(2, 6)
        col = (185, 145, 105, 200) if np.random.rand() > 0.5 else (235, 200, 160, 220)
        d_d.ellipse([px, py, px + pr, py + pr], fill=col)
    d_img.save('images/surface_dirt.png')

    # 3. Wooden bridge planks (512x512)
    b_img = Image.new('RGBA', (512, 512), (135, 105, 75, 255))
    d_b = ImageDraw.Draw(b_img)
    for y in range(0, 512, 32):
        d_b.line([(0, y), (512, y)], fill=(85, 60, 40, 255), width=4)
        d_b.line([(0, y + 4), (512, y + 4)], fill=(160, 125, 90, 255), width=2)
        # Nail heads
        d_b.ellipse([30, y + 12, 38, y + 20], fill=(55, 55, 60, 255))
        d_b.ellipse([474, y + 12, 482, y + 20], fill=(55, 55, 60, 255))
    b_img.save('images/surface_bridge.png')
    
    print('Surfaces generated.')

generate_surfaces()

