import math
import os
from PIL import Image, ImageDraw, ImageFilter

def create_background():
    # Width 1080, Height 1920 (matching layout size)
    w, h = 1080, 1920
    img = Image.new('RGBA', (w, h), (0, 0, 0, 255))
    draw = ImageDraw.Draw(img)
    
    # 1. Sky / Upper Canopy gradient
    # Deep forest emerald green to misty teal sky
    for y in range(int(h * 0.55)):
        t = y / (h * 0.55)
        # Gradient: Top dense canopy (15, 45, 30) -> Mid mist (75, 140, 115) -> Horizon (145, 195, 170)
        if t < 0.5:
            s = t / 0.5
            r = int(18 * (1-s) + 55 * s)
            g = int(50 * (1-s) + 120 * s)
            b = int(32 * (1-s) + 95 * s)
        else:
            s = (t - 0.5) / 0.5
            r = int(55 * (1-s) + 130 * s)
            g = int(120 * (1-s) + 185 * s)
            b = int(95 * (1-s) + 160 * s)
        draw.line([(0, y), (w, y)], fill=(r, g, b, 255))
        
    # 2. God Rays / Sunlight Beams filtering down through trees
    overlay = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    d_over = ImageDraw.Draw(overlay)
    rays = [
        (w * 0.25, 0, w * 0.15, h * 0.6, 60),
        (w * 0.45, 0, w * 0.38, h * 0.65, 80),
        (w * 0.65, 0, w * 0.62, h * 0.6, 70),
        (w * 0.85, 0, w * 0.90, h * 0.55, 50),
    ]
    for rx0, ry0, rx1, ry1, alpha in rays:
        beam_w_top = 40
        beam_w_bot = 180
        poly = [
            (rx0 - beam_w_top, ry0),
            (rx0 + beam_w_top, ry0),
            (rx1 + beam_w_bot, ry1),
            (rx1 - beam_w_bot, ry1)
        ]
        d_over.polygon(poly, fill=(255, 255, 210, alpha))
        
    # 3. Distant Silhouette Trees
    tree_col_dist = (35, 75, 55, 255)
    for tx in range(0, w, 110):
        th = int(280 + (tx % 170))
        ty = int(h * 0.45)
        # trunk
        d_over.rectangle([tx + 40, ty - th, tx + 65, ty], fill=tree_col_dist)
        # crown
        d_over.ellipse([tx, ty - th - 90, tx + 105, ty - th + 50], fill=tree_col_dist)

    # 4. Midground Sequoia Tree Trunks on the sides
    trunk_col = (75, 42, 25, 255)
    trunk_dark = (48, 26, 15, 255)
    # Left giant trunks
    for lx, tw in [(20, 110), (-30, 90), (140, 80)]:
        d_over.polygon([(lx, 0), (lx + tw, 0), (lx + tw + 30, int(h * 0.55)), (lx - 20, int(h * 0.55))], fill=trunk_col)
        d_over.polygon([(lx, 0), (lx + 25, 0), (lx + 10, int(h * 0.55)), (lx - 20, int(h * 0.55))], fill=trunk_dark)
    # Right giant trunks
    for rx, tw in [(w - 130, 110), (w - 30, 90), (w - 220, 80)]:
        d_over.polygon([(rx, 0), (rx + tw, 0), (rx + tw + 20, int(h * 0.55)), (rx - 30, int(h * 0.55))], fill=trunk_col)
        d_over.polygon([(rx + tw - 25, 0), (rx + tw, 0), (rx + tw + 20, int(h * 0.55)), (rx + tw - 10, int(h * 0.55))], fill=trunk_dark)
        
    # 5. Hanging Vines & Leaves at top
    vine_col = (25, 80, 35, 255)
    for vx in range(0, w, 60):
        vh = int(90 + (math.sin(vx * 0.1) * 40))
        d_over.polygon([(vx, 0), (vx + 45, 0), (vx + 25, vh), (vx + 15, vh)], fill=vine_col)
        # Leaves
        d_over.ellipse([vx, vh - 20, vx + 40, vh + 30], fill=(45, 120, 50, 255))
        
    # Composite overlay
    img = Image.alpha_composite(img, overlay)
    img.save('images/bg_forest_canopy.png')
    print('Created images/bg_forest_canopy.png')

create_background()

