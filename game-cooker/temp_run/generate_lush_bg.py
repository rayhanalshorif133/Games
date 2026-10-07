import math
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

def generate_lush_background():
    w, h = 1080, 1920
    # Create base canvas
    img = Image.new('RGBA', (w, h), (18, 38, 28, 255))
    
    # Gradient sky through canopy (0 to 1100 px)
    sky = Image.new('RGBA', (w, 1100), (0, 0, 0, 0))
    d_sky = ImageDraw.Draw(sky)
    for y in range(1100):
        t = y / 1100.0
        # Deep forest green top (20, 50, 35) -> misty sunlit clearing (110, 175, 145) -> warm horizon mist (160, 205, 175)
        if t < 0.6:
            st = t / 0.6
            r = int(24 * (1 - st) + 95 * st)
            g = int(62 * (1 - st) + 160 * st)
            b = int(42 * (1 - st) + 130 * st)
        else:
            st = (t - 0.6) / 0.4
            r = int(95 * (1 - st) + 175 * st)
            g = int(160 * (1 - st) + 215 * st)
            b = int(130 * (1 - st) + 185 * st)
        d_sky.line([(0, y), (w, y)], fill=(r, g, b, 255))
    
    img.paste(sky, (0, 0))
    
    # Layer 1: Distant misty trees (soft blur)
    dist_trees = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    d_dt = ImageDraw.Draw(dist_trees)
    np.random.seed(42)
    for x in range(-50, w + 100, 45):
        tree_h = int(550 + np.sin(x * 0.02) * 120 + np.random.randint(-30, 40))
        base_y = 1050
        # Trunk
        d_dt.rectangle([x + 15, base_y - tree_h, x + 28, base_y], fill=(45, 95, 75, 180))
        # Layered pine foliage
        for step in range(5):
            py = base_y - tree_h + (step * 50)
            pw = 35 + step * 18
            d_dt.polygon([(x + 21, py - 40), (x + 21 + pw, py + 25), (x + 21 - pw, py + 25)], fill=(38, 90, 68, 200))
    dist_trees = dist_trees.filter(ImageFilter.GaussianBlur(radius=3))
    img = Image.alpha_composite(img, dist_trees)
    
    # Layer 2: God rays / Sun beams (glowing transparent polygons)
    god_rays = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    d_gr = ImageDraw.Draw(god_rays)
    ray_coords = [
        (220, 0, 120, 1150, 70, 220, 45),
        (380, 0, 310, 1150, 90, 260, 60),
        (540, 0, 520, 1150, 110, 290, 75),
        (720, 0, 760, 1150, 80, 240, 55),
        (880, 0, 950, 1150, 70, 200, 40),
    ]
    for rx0, ry0, rx1, ry1, w0, w1, alpha in ray_coords:
        pts = [
            (rx0 - w0/2, ry0),
            (rx0 + w0/2, ry0),
            (rx1 + w1/2, ry1),
            (rx1 - w1/2, ry1)
        ]
        d_gr.polygon(pts, fill=(255, 255, 215, alpha))
    god_rays = god_rays.filter(ImageFilter.GaussianBlur(radius=8))
    img = Image.alpha_composite(img, god_rays)
    
    # Layer 3: Giant redwood trunks on left & right
    trunks = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    d_tr = ImageDraw.Draw(trunks)
    
    # Left giant trunk
    d_tr.polygon([(-60, 0), (220, 0), (280, 1150), (-40, 1150)], fill=(92, 54, 34, 255))
    d_tr.polygon([(-60, 0), (40, 0), (60, 1150), (-40, 1150)], fill=(62, 34, 20, 255))
    # Bark fissures
    for bx in [80, 140, 190]:
        d_tr.line([(bx, 0), (bx + 35, 1150)], fill=(50, 28, 16, 200), width=6)
        d_tr.line([(bx + 12, 0), (bx + 47, 1150)], fill=(120, 75, 48, 180), width=4)
        
    # Right giant trunk
    d_tr.polygon([(w - 240, 0), (w + 60, 0), (w + 80, 1150), (w - 300, 1150)], fill=(92, 54, 34, 255))
    d_tr.polygon([(w - 90, 0), (w + 60, 0), (w + 80, 1150), (w - 70, 1150)], fill=(62, 34, 20, 255))
    for bx in [w - 200, w - 150, w - 100]:
        d_tr.line([(bx, 0), (bx - 30, 1150)], fill=(50, 28, 16, 200), width=6)
        d_tr.line([(bx + 10, 0), (bx - 20, 1150)], fill=(120, 75, 48, 180), width=4)
        
    # Hanging vines from canopy
    for vx in range(0, w, 40):
        vh = int(140 + np.sin(vx * 0.15) * 60 + np.cos(vx * 0.08) * 40)
        d_tr.polygon([(vx, 0), (vx + 28, 0), (vx + 16, vh), (vx + 6, vh)], fill=(32, 85, 42, 255))
        # Leaf buds
        d_tr.ellipse([vx - 5, vh - 25, vx + 25, vh + 15], fill=(48, 125, 58, 255))
        d_tr.ellipse([vx, vh - 45, vx + 22, vh - 15], fill=(62, 148, 72, 255))
        
    img = Image.alpha_composite(img, trunks)
    
    # Save lush forest background
    img.save('images/bg_forest_canopy.png')
    print('Generated lush images/bg_forest_canopy.png')

generate_lush_background()

