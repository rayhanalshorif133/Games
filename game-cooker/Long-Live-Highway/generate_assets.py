"""
Asset Generator for "LONG LIVE THE TRUE" Construct 3 Style Game (V2 - Ultra Polished)
Generates pixel-perfect, centered 2D flat-vector assets matching demo.gif styling.
"""

import os
import math
from PIL import Image, ImageDraw

OUTPUT_DIR = r"e:\Rayhan\Practice\Games\game-cooker\images"
ICONS_DIR = r"e:\Rayhan\Practice\Games\game-cooker\icons"
os.makedirs(OUTPUT_DIR, exist_ok=True)
os.makedirs(ICONS_DIR, exist_ok=True)

def create_supersampled(width, height, draw_func, factor=4):
    """Render at 4x resolution and downscale with Lanczos for smooth antialiasing."""
    sw, sh = width * factor, height * factor
    img = Image.new("RGBA", (sw, sh), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    draw_func(draw, sw, sh, factor)
    return img.resize((width, height), Image.Resampling.LANCZOS)

# ==========================================
# 1. CAR ASSETS (Player & Traffic)
# ==========================================

def draw_player_car(draw, w, h, f):
    body_color = (228, 58, 62)       # Red body
    body_dark = (195, 45, 48)        # Darker red trim
    roof_color = (220, 52, 56)       # Roof
    glass_color = (48, 76, 94)       # Glass
    glass_highlight = (78, 110, 134) # Glass glare
    headlight_color = (252, 241, 182)# Warm cream yellow
    mirror_color = (235, 75, 78)     # Mirrors
    shadow_color = (72, 82, 40, 130) # Olive ground shadow
    taillight_color = (180, 25, 30)  # Taillights

    # Margins & Centering
    cw = 60 * f
    ch = 136 * f
    cx = w / 2
    cy = h / 2

    # Drop shadow (offset to left and bottom)
    sx_off = -10 * f
    sy_off = 14 * f
    draw.rounded_rectangle(
        [cx - cw/2 + sx_off, cy - ch/2 + sy_off, cx + cw/2 + sx_off, cy + ch/2 + sy_off],
        radius=14 * f, fill=shadow_color
    )

    # Main Car Body
    bx0, by0, bx1, by1 = cx - cw/2, cy - ch/2, cx + cw/2, cy + ch/2
    draw.rounded_rectangle([bx0, by0, bx1, by1], radius=14 * f, fill=body_color)

    # Mirrors
    my0, my1 = by0 + 44 * f, by0 + 58 * f
    draw.rounded_rectangle([bx0 - 7 * f, my0, bx0, my1], radius=3 * f, fill=mirror_color)
    draw.rounded_rectangle([bx1, my0, bx1 + 7 * f, my1], radius=3 * f, fill=mirror_color)

    # Headlight yellow corner accents
    draw.polygon([(bx0 + 2 * f, by0 + 2 * f), (bx0 + 10 * f, by0 + 2 * f), (bx0 + 2 * f, by0 + 10 * f)], fill=headlight_color)
    draw.polygon([(bx1 - 2 * f, by0 + 2 * f), (bx1 - 10 * f, by0 + 2 * f), (bx1 - 2 * f, by0 + 10 * f)], fill=headlight_color)

    # Front Windshield
    wx0, wy0, wx1, wy1 = bx0 + 5 * f, by0 + 34 * f, bx1 - 5 * f, by0 + 58 * f
    draw.rounded_rectangle([wx0, wy0, wx1, wy1], radius=5 * f, fill=glass_color)
    draw.line([(wx0 + 4 * f, wy0 + 3 * f), (wx1 - 4 * f, wy0 + 3 * f)], fill=glass_highlight, width=int(2 * f))

    # Roof
    rx0, ry0, rx1, ry1 = bx0 + 5 * f, by0 + 58 * f, bx1 - 5 * f, by0 + 94 * f
    draw.rectangle([rx0, ry0, rx1, ry1], fill=roof_color)

    # Rear Window
    rwx0, rwy0, rwx1, rwy1 = bx0 + 5 * f, by0 + 94 * f, bx1 - 5 * f, by0 + 122 * f
    draw.rounded_rectangle([rwx0, rwy0, rwx1, rwy1], radius=5 * f, fill=glass_color)

    # Rear Trunk
    draw.rounded_rectangle([bx0, by0 + 120 * f, bx1, by1], radius=12 * f, fill=body_dark)

    # Taillights
    draw.rectangle([bx0 + 4 * f, by1 - 5 * f, bx0 + 16 * f, by1 - 2 * f], fill=taillight_color)
    draw.rectangle([bx1 - 16 * f, by1 - 5 * f, bx1 - 4 * f, by1 - 2 * f], fill=taillight_color)

def draw_traffic_blue(draw, w, h, f):
    body_color = (60, 94, 116)
    body_dark = (42, 70, 80)
    roof_color = (50, 80, 100)
    glass_color = (25, 40, 50)
    glass_highlight = (100, 140, 160)
    headlight_color = (252, 241, 182)
    shadow_color = (72, 82, 40, 130)

    cw, ch = 58 * f, 132 * f
    cx, cy = w / 2, h / 2
    sx_off, sy_off = -10 * f, 14 * f

    draw.rounded_rectangle([cx - cw/2 + sx_off, cy - ch/2 + sy_off, cx + cw/2 + sx_off, cy + ch/2 + sy_off], radius=14 * f, fill=shadow_color)

    bx0, by0, bx1, by1 = cx - cw/2, cy - ch/2, cx + cw/2, cy + ch/2
    draw.rounded_rectangle([bx0, by0, bx1, by1], radius=14 * f, fill=body_color)

    # Mirrors
    draw.rounded_rectangle([bx0 - 6 * f, by0 + 40 * f, bx0, by0 + 54 * f], radius=2 * f, fill=body_dark)
    draw.rounded_rectangle([bx1, by0 + 40 * f, bx1 + 6 * f, by0 + 54 * f], radius=2 * f, fill=body_dark)

    # Headlights
    draw.rectangle([bx0 + 3 * f, by0 + 2 * f, bx0 + 12 * f, by0 + 6 * f], fill=headlight_color)
    draw.rectangle([bx1 - 12 * f, by0 + 2 * f, bx1 - 3 * f, by0 + 6 * f], fill=headlight_color)

    # Front Glass
    draw.rounded_rectangle([bx0 + 5 * f, by0 + 30 * f, bx1 - 5 * f, by0 + 54 * f], radius=5 * f, fill=glass_color)
    # Roof
    draw.rectangle([bx0 + 5 * f, by0 + 54 * f, bx1 - 5 * f, by0 + 96 * f], fill=roof_color)
    # Roof rack slats
    for ry in [by0 + 64 * f, by0 + 75 * f, by0 + 86 * f]:
        draw.line([(bx0 + 10 * f, ry), (bx1 - 10 * f, ry)], fill=(30, 50, 60), width=int(2.5 * f))
    # Rear Glass
    draw.rounded_rectangle([bx0 + 5 * f, by0 + 96 * f, bx1 - 5 * f, by0 + 120 * f], radius=5 * f, fill=glass_color)
    # Rear bumper
    draw.rounded_rectangle([bx0, by0 + 118 * f, bx1, by1], radius=12 * f, fill=body_dark)

def draw_traffic_yellow(draw, w, h, f):
    body_color = (235, 175, 45)
    body_dark = (200, 140, 30)
    stripe_color = (35, 35, 40)
    glass_color = (35, 45, 55)
    shadow_color = (72, 82, 40, 130)

    cw, ch = 58 * f, 132 * f
    cx, cy = w / 2, h / 2
    sx_off, sy_off = -10 * f, 14 * f

    draw.rounded_rectangle([cx - cw/2 + sx_off, cy - ch/2 + sy_off, cx + cw/2 + sx_off, cy + ch/2 + sy_off], radius=14 * f, fill=shadow_color)

    bx0, by0, bx1, by1 = cx - cw/2, cy - ch/2, cx + cw/2, cy + ch/2
    draw.rounded_rectangle([bx0, by0, bx1, by1], radius=14 * f, fill=body_color)

    # Racing Stripes down the center
    mid = (bx0 + bx1) / 2
    draw.rectangle([mid - 8 * f, by0, mid - 2 * f, by1], fill=stripe_color)
    draw.rectangle([mid + 2 * f, by0, mid + 8 * f, by1], fill=stripe_color)

    # Front Glass
    draw.rounded_rectangle([bx0 + 5 * f, by0 + 32 * f, bx1 - 5 * f, by0 + 56 * f], radius=5 * f, fill=glass_color)
    # Rear Glass
    draw.rounded_rectangle([bx0 + 5 * f, by0 + 96 * f, bx1 - 5 * f, by0 + 120 * f], radius=5 * f, fill=glass_color)

def draw_traffic_truck(draw, w, h, f):
    cab_color = (210, 80, 50)
    trailer_color = (245, 240, 225)
    shadow_color = (72, 82, 40, 140)
    glass_color = (30, 40, 50)

    cw, ch = 74 * f, 240 * f
    cx, cy = w / 2, h / 2
    sx_off, sy_off = -12 * f, 16 * f

    draw.rounded_rectangle([cx - cw/2 + sx_off, cy - ch/2 + sy_off, cx + cw/2 + sx_off, cy + ch/2 + sy_off], radius=10 * f, fill=shadow_color)

    # Front Cab
    cx0, cy0, cx1, cy1 = cx - cw/2, cy - ch/2, cx + cw/2, cy - ch/2 + 65 * f
    draw.rounded_rectangle([cx0, cy0, cx1, cy1], radius=10 * f, fill=cab_color)
    # Windshield
    draw.rounded_rectangle([cx0 + 5 * f, cy0 + 24 * f, cx1 - 5 * f, cy0 + 50 * f], radius=5 * f, fill=glass_color)

    # Big Trailer Box
    tx0, ty0, tx1, ty1 = cx - cw/2 - 2 * f, cy - ch/2 + 70 * f, cx + cw/2 + 2 * f, cy + ch/2
    draw.rounded_rectangle([tx0, ty0, tx1, ty1], radius=6 * f, fill=trailer_color)
    for gy in range(int(ty0 + 16 * f), int(ty1 - 16 * f), int(22 * f)):
        draw.line([(tx0 + 6 * f, gy), (tx1 - 6 * f, gy)], fill=(205, 200, 185), width=int(2.5 * f))

def draw_police_car(draw, w, h, f):
    body_color = (245, 245, 250)
    hood_color = (30, 30, 35)
    glass_color = (30, 40, 50)
    shadow_color = (72, 82, 40, 130)

    cw, ch = 58 * f, 132 * f
    cx, cy = w / 2, h / 2
    sx_off, sy_off = -10 * f, 14 * f

    draw.rounded_rectangle([cx - cw/2 + sx_off, cy - ch/2 + sy_off, cx + cw/2 + sx_off, cy + ch/2 + sy_off], radius=14 * f, fill=shadow_color)

    bx0, by0, bx1, by1 = cx - cw/2, cy - ch/2, cx + cw/2, cy + ch/2
    draw.rounded_rectangle([bx0, by0, bx1, by1], radius=14 * f, fill=body_color)
    draw.rounded_rectangle([bx0, by0, bx1, by0 + 32 * f], radius=12 * f, fill=hood_color)
    draw.rounded_rectangle([bx0, by1 - 30 * f, bx1, by1], radius=12 * f, fill=hood_color)

    # Windshields
    draw.rounded_rectangle([bx0 + 5 * f, by0 + 32 * f, bx1 - 5 * f, by0 + 54 * f], radius=5 * f, fill=glass_color)
    draw.rounded_rectangle([bx0 + 5 * f, by0 + 94 * f, bx1 - 5 * f, by0 + 118 * f], radius=5 * f, fill=glass_color)

    # Siren bar (Blue / Red flashing)
    s_mid = (by0 + 54 * f + by0 + 94 * f) / 2
    draw.rectangle([cx - 16 * f, s_mid - 6 * f, cx - 2 * f, s_mid + 6 * f], fill=(230, 40, 40))
    draw.rectangle([cx + 2 * f, s_mid - 6 * f, cx + 16 * f, s_mid + 6 * f], fill=(40, 110, 240))

# ==========================================
# 2. SCENERY HOUSES
# ==========================================

def draw_house_terracotta(draw, w, h, f):
    compound_bg = (233, 211, 124)
    compound_border = (252, 241, 182)
    roof_main = (177, 108, 74)
    roof_dark = (157, 90, 62)
    roof_detail = (122, 62, 42)
    shadow_col = (72, 82, 40, 160)

    draw.rectangle([12 * f, 12 * f, w - 12 * f, h - 12 * f], fill=compound_bg)
    draw.line([(12 * f, 12 * f), (w - 12 * f, 12 * f)], fill=compound_border, width=int(4 * f))
    draw.line([(12 * f, 12 * f), (12 * f, h - 12 * f)], fill=compound_border, width=int(4 * f))

    # Pathway
    draw.rectangle([w - 60 * f, 60 * f, w - 12 * f, 120 * f], fill=compound_border)

    # House Shadow
    hx0, hy0, hx1, hy1 = 40 * f, 40 * f, w - 90 * f, h - 60 * f
    sx_off, sy_off = -16 * f, 20 * f
    draw.rectangle([hx0 + sx_off, hy0 + sy_off, hx1 + sx_off, hy1 + sy_off], fill=shadow_col)

    # House Roof
    draw.rectangle([hx0, hy0, hx1, hy1], fill=roof_main)
    draw.rectangle([hx0, hy0, hx0 + (hx1 - hx0) * 0.45, hy1], fill=roof_dark)

    ix0 = hx0 + (hx1 - hx0) * 0.55
    iy0 = hy0 + (hy1 - hy0) * 0.2
    ix1 = hx1 - 20 * f
    iy1 = hy1 - (hy1 - hy0) * 0.2
    draw.rectangle([ix0, iy0, ix1, iy1], fill=roof_detail)

    # Bushes in yard
    bush_color = (107, 114, 44)
    bush_shadow = (72, 82, 40)
    for bx, by, br in [(w - 40 * f, 40 * f, 16 * f), (w - 40 * f, h - 40 * f, 18 * f), (w - 40 * f, h - 90 * f, 14 * f)]:
        draw.ellipse([bx - br - 5 * f, by - br + 6 * f, bx + br - 5 * f, by + br + 6 * f], fill=bush_shadow)
        draw.ellipse([bx - br, by - br, bx + br, by + br], fill=bush_color)

def draw_house_blue_hip(draw, w, h, f):
    compound_bg = (233, 211, 124)
    compound_border = (252, 241, 182)
    roof_main = (60, 94, 116)
    roof_left = (42, 70, 80)
    roof_top = (70, 105, 128)
    roof_bottom = (35, 55, 65)
    shadow_col = (72, 82, 40, 160)

    draw.rectangle([12 * f, 12 * f, w - 12 * f, h - 12 * f], fill=compound_bg)
    draw.line([(12 * f, 12 * f), (w - 12 * f, 12 * f)], fill=compound_border, width=int(4 * f))

    hx0, hy0, hx1, hy1 = 45 * f, 45 * f, w - 45 * f, h - 45 * f
    sx_off, sy_off = -16 * f, 20 * f
    draw.rectangle([hx0 + sx_off, hy0 + sy_off, hx1 + sx_off, hy1 + sy_off], fill=shadow_col)

    cx, cy = (hx0 + hx1) / 2, (hy0 + hy1) / 2
    draw.polygon([(hx0, hy0), (hx1, hy0), (cx + 20 * f, cy), (cx - 20 * f, cy)], fill=roof_top)
    draw.polygon([(hx0, hy1), (hx1, hy1), (cx + 20 * f, cy), (cx - 20 * f, cy)], fill=roof_bottom)
    draw.polygon([(hx0, hy0), (hx0, hy1), (cx - 20 * f, cy)], fill=roof_left)
    draw.polygon([(hx1, hy0), (hx1, hy1), (cx + 20 * f, cy)], fill=roof_main)
    draw.line([(cx - 20 * f, cy), (cx + 20 * f, cy)], fill=(90, 130, 155), width=int(4 * f))

def draw_crops_field(draw, w, h, f):
    base_color = (137, 134, 48)
    stripe_color = (185, 167, 49)
    border_color = (252, 241, 182)

    draw.rectangle([0, 0, w, h], fill=base_color)
    stripe_w = 22 * f
    spacing = 38 * f
    for x in range(-int(w), int(w * 2), int(spacing)):
        p1 = (x, 0)
        p2 = (x + stripe_w, 0)
        p3 = (x + stripe_w + h * 0.25, h)
        p4 = (x + h * 0.25, h)
        draw.polygon([p1, p2, p3, p4], fill=stripe_color)

    draw.line([(0, 0), (w, 0)], fill=border_color, width=int(3 * f))
    draw.line([(0, 0), (0, h)], fill=border_color, width=int(3 * f))

# ==========================================
# 3. TREES & BIRDS
# ==========================================

def draw_tree_large(draw, w, h, f):
    tree_color = (107, 114, 44)
    tree_highlight = (130, 140, 52)
    tree_dark = (86, 90, 38)
    shadow_col = (72, 82, 40, 170)

    cx, cy = w / 2, h / 2
    radius = (min(w, h) / 2) - 20 * f

    draw.ellipse([cx - radius - 14 * f, cy - radius + 18 * f, cx + radius - 14 * f, cy + radius + 18 * f], fill=shadow_col)
    draw.ellipse([cx - radius, cy - radius, cx + radius, cy + radius], fill=tree_color)
    draw.ellipse([cx - radius + 4 * f, cy - radius + 10 * f, cx + radius - 8 * f, cy + radius + 4 * f], fill=tree_dark)
    draw.ellipse([cx - radius * 0.6, cy - radius * 0.7, cx + radius * 0.4, cy + radius * 0.3], fill=tree_highlight)

def draw_tree_medium(draw, w, h, f):
    tree_color = (107, 114, 44)
    tree_highlight = (135, 145, 55)
    shadow_col = (72, 82, 40, 170)

    cx, cy = w / 2, h / 2
    radius = (min(w, h) / 2) - 14 * f

    draw.ellipse([cx - radius - 10 * f, cy - radius + 14 * f, cx + radius - 10 * f, cy + radius + 14 * f], fill=shadow_col)
    draw.ellipse([cx - radius, cy - radius, cx + radius, cy + radius], fill=tree_color)
    draw.ellipse([cx - radius * 0.5, cy - radius * 0.6, cx + radius * 0.3, cy + radius * 0.2], fill=tree_highlight)

def draw_bird_frame1(draw, w, h, f):
    # Wings V-shape Up
    bird_col = (250, 248, 245)
    cx, cy = w / 2, h / 2 - 2 * f
    # Soft bird shadow
    shadow_col = (72, 82, 40, 90)
    draw.ellipse([cx - 20 * f - 8 * f, cy + 16 * f, cx + 20 * f - 8 * f, cy + 28 * f], fill=shadow_col)

    # Body
    draw.ellipse([cx - 4 * f, cy - 14 * f, cx + 4 * f, cy + 14 * f], fill=bird_col)
    # Head
    draw.ellipse([cx - 3 * f, cy - 18 * f, cx + 3 * f, cy - 12 * f], fill=bird_col)
    # Wings angled up
    draw.polygon([(cx - 24 * f, cy - 8 * f), (cx - 10 * f, cy + 2 * f), (cx, cy), (cx + 10 * f, cy + 2 * f), (cx + 24 * f, cy - 8 * f), (cx + 14 * f, cy + 7 * f), (cx, cy + 3 * f), (cx - 14 * f, cy + 7 * f)], fill=bird_col)
    # Tail
    draw.polygon([(cx - 4 * f, cy + 10 * f), (cx + 4 * f, cy + 10 * f), (cx + 7 * f, cy + 20 * f), (cx - 7 * f, cy + 20 * f)], fill=bird_col)

def draw_bird_frame2(draw, w, h, f):
    # Wings Flat Gliding
    bird_col = (250, 248, 245)
    cx, cy = w / 2, h / 2 - 2 * f
    shadow_col = (72, 82, 40, 90)
    draw.ellipse([cx - 22 * f - 8 * f, cy + 16 * f, cx + 22 * f - 8 * f, cy + 28 * f], fill=shadow_col)

    draw.ellipse([cx - 4 * f, cy - 14 * f, cx + 4 * f, cy + 14 * f], fill=bird_col)
    draw.ellipse([cx - 3 * f, cy - 18 * f, cx + 3 * f, cy - 12 * f], fill=bird_col)
    # Wings straight out
    draw.polygon([(cx - 26 * f, cy), (cx - 10 * f, cy - 2 * f), (cx, cy), (cx + 10 * f, cy - 2 * f), (cx + 26 * f, cy), (cx + 14 * f, cy + 5 * f), (cx, cy + 2 * f), (cx - 14 * f, cy + 5 * f)], fill=bird_col)
    draw.polygon([(cx - 4 * f, cy + 10 * f), (cx + 4 * f, cy + 10 * f), (cx + 7 * f, cy + 20 * f), (cx - 7 * f, cy + 20 * f)], fill=bird_col)

def draw_bird_frame3(draw, w, h, f):
    # Wings Curved Down
    bird_col = (250, 248, 245)
    cx, cy = w / 2, h / 2 - 2 * f
    shadow_col = (72, 82, 40, 90)
    draw.ellipse([cx - 18 * f - 8 * f, cy + 16 * f, cx + 18 * f - 8 * f, cy + 28 * f], fill=shadow_col)

    draw.ellipse([cx - 4 * f, cy - 14 * f, cx + 4 * f, cy + 14 * f], fill=bird_col)
    draw.ellipse([cx - 3 * f, cy - 18 * f, cx + 3 * f, cy - 12 * f], fill=bird_col)
    # Wings angled down
    draw.polygon([(cx - 22 * f, cy + 8 * f), (cx - 10 * f, cy - 2 * f), (cx, cy), (cx + 10 * f, cy - 2 * f), (cx + 22 * f, cy + 8 * f), (cx + 12 * f, cy + 12 * f), (cx, cy + 3 * f), (cx - 12 * f, cy + 12 * f)], fill=bird_col)
    draw.polygon([(cx - 4 * f, cy + 10 * f), (cx + 4 * f, cy + 10 * f), (cx + 7 * f, cy + 20 * f), (cx - 7 * f, cy + 20 * f)], fill=bird_col)

# ==========================================
# 4. PICKUPS & COLLECTIBLES
# ==========================================

def draw_fuel_canister(draw, w, h, f):
    can_col = (235, 60, 40)
    cap_col = (250, 210, 50)
    dark_col = (180, 40, 30)
    shadow_col = (72, 82, 40, 140)

    cx, cy = w / 2, h / 2 + 2 * f
    draw.rounded_rectangle([cx - 20 * f - 6 * f, cy - 22 * f + 8 * f, cx + 20 * f - 6 * f, cy + 22 * f + 8 * f], radius=6 * f, fill=shadow_col)
    draw.rounded_rectangle([cx - 20 * f, cy - 18 * f, cx + 20 * f, cy + 22 * f], radius=6 * f, fill=can_col)
    draw.rectangle([cx - 15 * f, cy - 26 * f, cx - 5 * f, cy - 18 * f], fill=cap_col)
    draw.rectangle([cx - 3 * f, cy - 24 * f, cx + 15 * f, cy - 18 * f], fill=dark_col)
    # Fuel icon
    draw.polygon([(cx, cy - 8 * f), (cx + 8 * f, cy + 4 * f), (cx, cy + 10 * f), (cx - 8 * f, cy + 4 * f)], fill=(255, 255, 255))

def draw_coin_star(draw, w, h, f):
    coin_outer = (245, 185, 25)
    coin_inner = (255, 215, 60)
    shadow_col = (72, 82, 40, 140)

    cx, cy = w / 2, h / 2
    r = 22 * f

    draw.ellipse([cx - r - 5 * f, cy - r + 7 * f, cx + r - 5 * f, cy + r + 7 * f], fill=shadow_col)
    draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=coin_outer)
    draw.ellipse([cx - r * 0.8, cy - r * 0.8, cx + r * 0.8, cy + r * 0.8], fill=coin_inner)

    # Star
    pts = []
    for i in range(10):
        angle = i * math.pi / 5 - math.pi / 2
        dist = (r * 0.55) if i % 2 == 0 else (r * 0.25)
        pts.append((cx + dist * math.cos(angle), cy + dist * math.sin(angle)))
    draw.polygon(pts, fill=(245, 170, 20))

def draw_nitro_boost(draw, w, h, f):
    bottle_col = (0, 180, 240)
    nozzle_col = (220, 230, 240)
    shadow_col = (72, 82, 40, 140)

    cx, cy = w / 2, h / 2 + 2 * f
    draw.rounded_rectangle([cx - 16 * f - 6 * f, cy - 22 * f + 8 * f, cx + 16 * f - 6 * f, cy + 22 * f + 8 * f], radius=8 * f, fill=shadow_col)
    draw.rounded_rectangle([cx - 16 * f, cy - 18 * f, cx + 16 * f, cy + 22 * f], radius=8 * f, fill=bottle_col)
    draw.rectangle([cx - 8 * f, cy - 26 * f, cx + 8 * f, cy - 18 * f], fill=nozzle_col)

    bolt = [(cx + 2 * f, cy - 10 * f), (cx - 6 * f, cy + 1 * f), (cx - 1 * f, cy + 1 * f), (cx - 3 * f, cy + 12 * f), (cx + 6 * f, cy - 1 * f), (cx + 1 * f, cy - 1 * f)]
    draw.polygon(bolt, fill=(255, 255, 255))

def draw_shield_badge(draw, w, h, f):
    shield_col = (75, 195, 110)
    inner_col = (110, 220, 140)
    shadow_col = (72, 82, 40, 140)

    cx, cy = w / 2, h / 2
    pts = [(cx, cy - 22 * f), (cx + 20 * f, cy - 12 * f), (cx + 14 * f, cy + 12 * f), (cx, cy + 24 * f), (cx - 14 * f, cy + 12 * f), (cx - 20 * f, cy - 12 * f)]
    s_pts = [(p[0] - 5 * f, p[1] + 7 * f) for p in pts]
    draw.polygon(s_pts, fill=shadow_col)
    draw.polygon(pts, fill=shield_col)
    in_pts = [(p[0] * 0.75 + cx * 0.25, p[1] * 0.75 + cy * 0.25) for p in pts]
    draw.polygon(in_pts, fill=inner_col)
    draw.line([(cx - 6 * f, cy), (cx - 2 * f, cy + 6 * f), (cx + 8 * f, cy - 6 * f)], fill=(255, 255, 255), width=int(3 * f))

def draw_oil_slick(draw, w, h, f):
    oil_col = (45, 45, 50, 210)
    cx, cy = w / 2, h / 2
    draw.ellipse([cx - 24 * f, cy - 16 * f, cx + 24 * f, cy + 16 * f], fill=oil_col)
    draw.ellipse([cx - 12 * f, cy - 22 * f, cx + 18 * f, cy + 6 * f], fill=oil_col)
    draw.ellipse([cx - 22 * f, cy - 6 * f, cx + 8 * f, cy + 20 * f], fill=oil_col)

# ==========================================
# 5. ROAD TEXTURE & APP ICON
# ==========================================

def draw_road_texture(draw, w, h, f):
    asphalt_color = (215, 179, 101)
    curb_color = (252, 241, 182)

    draw.rectangle([0, 0, w, h], fill=asphalt_color)
    curb_w = 16 * f
    draw.rectangle([0, 0, curb_w, h], fill=curb_color)
    draw.rectangle([w - curb_w, 0, w, h], fill=curb_color)

    center_x = w / 2
    dash_w = 8 * f
    dash_len = 48 * f
    gap = 48 * f
    for y in range(0, int(h), int(dash_len + gap)):
        draw.rectangle([center_x - dash_w / 2, y, center_x + dash_w / 2, y + dash_len], fill=curb_color)

def draw_game_icon(draw, w, h, f):
    bg_green = (137, 134, 48)
    road_gold = (215, 179, 101)
    curb_cream = (252, 241, 182)

    draw.rectangle([0, 0, w, h], fill=bg_green)
    rw = w * 0.55
    rx0 = (w - rw) / 2
    rx1 = rx0 + rw
    draw.rectangle([rx0, 0, rx1, h], fill=road_gold)
    draw.rectangle([rx0, 0, rx0 + 8 * f, h], fill=curb_cream)
    draw.rectangle([rx1 - 8 * f, 0, rx1, h], fill=curb_cream)

    for y in range(0, int(h), int(50 * f)):
        draw.rectangle([w / 2 - 3 * f, y, w / 2 + 3 * f, y + 30 * f], fill=curb_cream)

    cw, ch = 54 * f, 120 * f
    cx, cy = w / 2, h / 2
    draw.rounded_rectangle([cx - cw / 2 - 8 * f, cy - ch / 2 + 10 * f, cx + cw / 2 - 8 * f, cy + ch / 2 + 10 * f], radius=12 * f, fill=(72, 82, 40, 160))
    draw.rounded_rectangle([cx - cw / 2, cy - ch / 2, cx + cw / 2, cy + ch / 2], radius=12 * f, fill=(228, 58, 62))
    draw.rounded_rectangle([cx - cw / 2 + 4 * f, cy - ch / 2 + 25 * f, cx + cw / 2 - 4 * f, cy - ch / 2 + 45 * f], radius=4 * f, fill=(48, 76, 94))
    draw.rounded_rectangle([cx - cw / 2 + 4 * f, cy + 16 * f, cx + cw / 2 - 4 * f, cy + 42 * f], radius=4 * f, fill=(48, 76, 94))
    draw.polygon([(cx - cw / 2 + 2 * f, cy - ch / 2 + 2 * f), (cx - cw / 2 + 10 * f, cy - ch / 2 + 2 * f), (cx - cw / 2 + 2 * f, cy - ch / 2 + 10 * f)], fill=(252, 241, 182))
    draw.polygon([(cx + cw / 2 - 2 * f, cy - ch / 2 + 2 * f), (cx + cw / 2 - 10 * f, cy - ch / 2 + 2 * f), (cx + cw / 2 - 2 * f, cy - ch / 2 + 10 * f)], fill=(252, 241, 182))

ASSETS = [
    ("car_red.png", 100, 190, draw_player_car),
    ("car_blue.png", 95, 180, draw_traffic_blue),
    ("car_yellow.png", 95, 180, draw_traffic_yellow),
    ("car_truck.png", 115, 300, draw_traffic_truck),
    ("car_police.png", 95, 180, draw_police_car),

    ("house_terracotta.png", 360, 320, draw_house_terracotta),
    ("house_blue.png", 280, 280, draw_house_blue_hip),
    ("crops_field.png", 340, 480, draw_crops_field),
    ("tree_large.png", 220, 220, draw_tree_large),
    ("tree_medium.png", 140, 140, draw_tree_medium),

    ("bird_f1.png", 70, 60, draw_bird_frame1),
    ("bird_f2.png", 70, 60, draw_bird_frame2),
    ("bird_f3.png", 70, 60, draw_bird_frame3),

    ("pickup_fuel.png", 70, 70, draw_fuel_canister),
    ("pickup_coin.png", 70, 70, draw_coin_star),
    ("pickup_nitro.png", 70, 70, draw_nitro_boost),
    ("pickup_shield.png", 70, 70, draw_shield_badge),
    ("hazard_oil.png", 90, 70, draw_oil_slick),

    ("road_texture.png", 480, 480, draw_road_texture),
]

print("Regenerating all game assets with refined parameters...")
for filename, w, h, func in ASSETS:
    path = os.path.join(OUTPUT_DIR, filename)
    img = create_supersampled(w, h, func, factor=4)
    img.save(path, "PNG")
    print(f"-> Saved {filename}")

ICON_SIZES = [("icon-128.png", 128), ("icon-256.png", 256), ("icon-512.png", 512)]
for filename, sz in ICON_SIZES:
    path = os.path.join(ICONS_DIR, filename)
    img = create_supersampled(sz, sz, draw_game_icon, factor=4)
    img.save(path, "PNG")
    img.save(os.path.join(OUTPUT_DIR, filename), "PNG")

print("All refined assets created successfully!")
