"""
MAKE 7 - Video-Accurate 1080x1920 Asset Generator
Generates clean modern 2D flat-vector assets matching make7 demo.mp4.
"""

import os
import math
from PIL import Image, ImageDraw, ImageFont, ImageFilter

SPRITES_DIR = os.path.join("assets", "sprites_v2")
UI_DIR = os.path.join("assets", "ui_v2")
os.makedirs(SPRITES_DIR, exist_ok=True)
os.makedirs(UI_DIR, exist_ok=True)

FONT_BOLD = "C:/Windows/Fonts/segoeuib.ttf"
FONT_REGULAR = "C:/Windows/Fonts/segoeui.ttf"

def get_font(size, bold=True):
    try:
        font_path = FONT_BOLD if bold else FONT_REGULAR
        return ImageFont.truetype(font_path, size)
    except Exception:
        return ImageFont.load_default()

def get_pointy_hex_points(cx, cy, R, rc, steps=10):
    """Calculates smooth rounded pointy-topped hexagon contour."""
    pts = []
    d = R - rc / math.sin(math.radians(60))
    for i in range(6):
        alpha = math.radians(60 * i + 30)
        ccx = cx + d * math.cos(alpha)
        ccy = cy + d * math.sin(alpha)
        for s in range(steps + 1):
            theta = alpha - math.radians(30) + math.radians(60) * (s / steps)
            px = ccx + rc * math.cos(theta)
            py = ccy + rc * math.sin(theta)
            pts.append((px, py))
    return pts

def generate_tile(number, fill_color, size=256, is_rainbow=False):
    """Generate a sleek, modern, flat-vector tile matching the video."""
    scale = 3
    w, h = size * scale, size * scale
    cx, cy = w / 2, h / 2
    r = w * 0.44
    corner_r = r * 0.18

    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Subtle drop shadow
    shadow_layer = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    s_draw = ImageDraw.Draw(shadow_layer)
    s_pts = get_pointy_hex_points(cx, cy + 8 * scale, r, corner_r)
    s_draw.polygon(s_pts, fill=(0, 0, 0, 95))
    shadow_layer = shadow_layer.filter(ImageFilter.GaussianBlur(radius=6 * scale))
    img = Image.alpha_composite(img, shadow_layer)
    draw = ImageDraw.Draw(img)

    if not is_rainbow:
        # Subtle darker bottom rim for 3D tactile depth
        rf, gf, bf = fill_color
        dark_rim = (int(rf * 0.82), int(gf * 0.82), int(bf * 0.82), 255)
        outer_pts = get_pointy_hex_points(cx, cy, r, corner_r)
        draw.polygon(outer_pts, fill=dark_rim)

        # Main tile body
        body_pts = get_pointy_hex_points(cx, cy - 2 * scale, r * 0.96, corner_r * 0.94)
        draw.polygon(body_pts, fill=(rf, gf, bf, 255))

        # Soft top-left highlight
        top_hl_pts = body_pts[35:60]
        if len(top_hl_pts) > 2:
            draw.line(top_hl_pts, fill=(255, 255, 255, 110), width=int(4 * scale))

        # Number Typography (bold, crisp black with slight shadow)
        font_size = int(96 * scale)
        font = get_font(font_size, bold=True)
        text = str(number)

        bbox = draw.textbbox((0, 0), text, font=font)
        tw = bbox[2] - bbox[0]
        th = bbox[3] - bbox[1]
        tx = cx - tw / 2 - bbox[0]
        ty = cy - th / 2 - bbox[1] - 4 * scale

        # Drop shadow on number
        draw.text((tx, ty + 2 * scale), text, font=font, fill=(0, 0, 0, 60))
        # Crisp black number
        draw.text((tx, ty), text, font=font, fill=(18, 18, 22, 255))
    else:
        # Rainbow Target 7 Tile:
        # Shimmering rainbow border, pure white inner face, colorful rainbow 7!
        outer_pts = get_pointy_hex_points(cx, cy, r, corner_r)
        draw.polygon(outer_pts, fill=(255, 215, 0, 255)) # Gold rim

        # Rainbow gradient simulated on outer rim
        rainbow_colors = [
            (237, 76, 106),  # Red/Pink
            (240, 130, 37),  # Orange
            (242, 192, 38),  # Yellow
            (28, 191, 166),  # Teal
            (43, 179, 232),  # Blue
            (155, 61, 179)   # Purple
        ]
        # Draw outer segments with rainbow hues
        for i in range(6):
            c_idx = i % len(rainbow_colors)
            seg = outer_pts[i * 11 : (i + 1) * 11 + 2]
            if len(seg) > 1:
                draw.line(seg, fill=(*rainbow_colors[c_idx], 255), width=int(8 * scale))

        # Inner white face
        inner_pts = get_pointy_hex_points(cx, cy, r * 0.90, corner_r * 0.90)
        draw.polygon(inner_pts, fill=(255, 255, 255, 255))

        # Rainbow 7 Number
        font_size = int(98 * scale)
        font = get_font(font_size, bold=True)
        text = "7"
        bbox = draw.textbbox((0, 0), text, font=font)
        tw = bbox[2] - bbox[0]
        th = bbox[3] - bbox[1]
        tx = cx - tw / 2 - bbox[0]
        ty = cy - th / 2 - bbox[1] - 4 * scale

        # Draw 7 with multi-tone effect
        draw.text((tx, ty + 2 * scale), text, font=font, fill=(0, 0, 0, 40))
        draw.text((tx, ty), text, font=font, fill=(28, 191, 166, 255)) # Teal/Rainbow core

        # Sparkle dots
        for sx, sy in [(cx - r*0.4, cy - r*0.35), (cx + r*0.4, cy + r*0.35), (cx + r*0.45, cy - r*0.3)]:
            draw.ellipse([sx - 4*scale, sy - 4*scale, sx + 4*scale, sy + 4*scale], fill=(255, 215, 0, 240))

    return img.resize((size, size), Image.Resampling.LANCZOS)

def generate_board_slot(size=256):
    """Generate recessed dark slate hexagon socket matching video."""
    scale = 3
    w, h = size * scale, size * scale
    cx, cy = w / 2, h / 2
    r = w * 0.44
    corner_r = r * 0.18

    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Outer socket rim (dark slate border #1c202d)
    outer_pts = get_pointy_hex_points(cx, cy, r, corner_r)
    draw.polygon(outer_pts, fill=(28, 32, 45, 255))

    # Inner recessed socket floor (#242938)
    inner_pts = get_pointy_hex_points(cx, cy + 2 * scale, r * 0.94, corner_r * 0.92)
    draw.polygon(inner_pts, fill=(36, 41, 56, 255))

    # Top inset shadow
    top_shadow = inner_pts[35:60]
    if len(top_shadow) > 2:
        draw.line(top_shadow, fill=(18, 21, 30, 200), width=int(6 * scale))

    return img.resize((size, size), Image.Resampling.LANCZOS)

def generate_rotation_arrows(size=256):
    """Generate the circular rotation arrows surrounding double pieces."""
    scale = 3
    w, h = size * scale, size * scale
    cx, cy = w / 2, h / 2
    r = w * 0.42

    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    color = (60, 68, 88, 220)
    # Draw two curved arcs with arrow heads
    draw.arc([cx - r, cy - r, cx + r, cy + r], 20, 160, fill=color, width=int(10 * scale))
    draw.arc([cx - r, cy - r, cx + r, cy + r], 200, 340, fill=color, width=int(10 * scale))

    # Arrowheads
    for angle in (160, 340):
        rad = math.radians(angle)
        ax = cx + r * math.cos(rad)
        ay = cy + r * math.sin(rad)
        # Arrow triangle
        tangent = rad + math.pi / 2
        pts = [
            (ax + 18 * scale * math.cos(tangent), ay + 18 * scale * math.sin(tangent)),
            (ax - 10 * scale * math.cos(tangent) + 14 * scale * math.cos(rad), ay - 10 * scale * math.sin(tangent) + 14 * scale * math.sin(rad)),
            (ax - 10 * scale * math.cos(tangent) - 14 * scale * math.cos(rad), ay - 10 * scale * math.sin(tangent) - 14 * scale * math.sin(rad))
        ]
        draw.polygon(pts, fill=color)

    return img.resize((size, size), Image.Resampling.LANCZOS)

def generate_booster_btn(icon_type, size=180):
    """Generate bottom booster buttons (Trash, Hammer, Undo) with cost 100."""
    scale = 3
    w, h = size * scale, size * scale
    cx, cy = w / 2, h / 2
    r_corner = int(28 * scale)

    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Shadow
    s_layer = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    s_draw = ImageDraw.Draw(s_layer)
    s_draw.rounded_rectangle([10*scale, 10*scale, w - 10*scale, h - 2*scale], radius=r_corner, fill=(0, 0, 0, 110))
    s_layer = s_layer.filter(ImageFilter.GaussianBlur(radius=6 * scale))
    img = Image.alpha_composite(img, s_layer)
    draw = ImageDraw.Draw(img)

    # Outer dark border
    draw.rounded_rectangle([6*scale, 4*scale, w - 6*scale, h - 8*scale], radius=r_corner, fill=(24, 28, 38, 255))
    # Inner body (#333a4c)
    draw.rounded_rectangle([10*scale, 8*scale, w - 10*scale, h - 14*scale], radius=r_corner - 2*scale, fill=(51, 58, 76, 255))

    # Icon
    icon_color = (200, 210, 230, 255)
    if icon_type == "trash":
        # Trash bin
        bx, by = cx - 18*scale, cy - 26*scale
        draw.rectangle([bx, by + 12*scale, bx + 36*scale, by + 46*scale], fill=icon_color)
        draw.rectangle([bx - 4*scale, by + 6*scale, bx + 40*scale, by + 12*scale], fill=icon_color)
        draw.rectangle([cx - 8*scale, by, cx + 8*scale, by + 6*scale], fill=icon_color)
    elif icon_type == "hammer":
        # Hammer
        hx, hy = cx - 22*scale, cy - 24*scale
        draw.rectangle([hx, hy, hx + 44*scale, hy + 20*scale], fill=icon_color)
        draw.rectangle([cx - 6*scale, hy + 20*scale, cx + 6*scale, hy + 54*scale], fill=(160, 170, 190, 255))
    elif icon_type == "undo":
        # Curved undo arrow
        arc_r = int(24 * scale)
        draw.arc([cx - arc_r, cy - arc_r - 2*scale, cx + arc_r, cy + arc_r - 2*scale], 60, 310, fill=icon_color, width=int(8 * scale))
        ax = cx + arc_r * math.cos(math.radians(60))
        ay = cy - 2*scale + arc_r * math.sin(math.radians(60))
        draw.polygon([(ax, ay - 12*scale), (ax + 16*scale, ay), (ax - 2*scale, ay + 14*scale)], fill=icon_color)

    # Cost pill at bottom
    font = get_font(int(24 * scale), bold=True)
    draw.text((cx - 24*scale, h - 34*scale), "100", font=font, fill=(255, 215, 0, 255))
    # Coin circle
    draw.ellipse([cx - 38*scale, h - 32*scale, cx - 26*scale, h - 20*scale], fill=(255, 200, 40, 255))

    # Little '?' info badge on top right
    badge_x, badge_y = w - 24*scale, 22*scale
    draw.ellipse([badge_x - 12*scale, badge_y - 12*scale, badge_x + 12*scale, badge_y + 12*scale], fill=(30, 180, 160, 255))
    draw.text((badge_x - 4*scale, badge_y - 8*scale), "?", font=get_font(int(14 * scale), bold=True), fill=(255, 255, 255, 255))

    return img.resize((size, size), Image.Resampling.LANCZOS)

def generate_gift_box(size=200):
    """Generate red gift box with yellow ribbon from 7-Day Event."""
    scale = 3
    w, h = size * scale, size * scale
    cx, cy = w / 2, h / 2
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Shadow
    draw.ellipse([cx - 40*scale, cy + 45*scale, cx + 40*scale, cy + 62*scale], fill=(0, 0, 0, 80))
    # Red box body
    draw.rounded_rectangle([cx - 42*scale, cy - 20*scale, cx + 42*scale, cy + 50*scale], radius=8*scale, fill=(225, 45, 55, 255))
    # Lid
    draw.rounded_rectangle([cx - 48*scale, cy - 35*scale, cx + 48*scale, cy - 18*scale], radius=6*scale, fill=(245, 55, 65, 255))

    # Yellow ribbon vertical
    draw.rectangle([cx - 8*scale, cy - 35*scale, cx + 8*scale, cy + 50*scale], fill=(255, 210, 30, 255))
    # Yellow ribbon horizontal
    draw.rectangle([cx - 42*scale, cy + 10*scale, cx + 42*scale, cy + 22*scale], fill=(255, 210, 30, 255))

    # Ribbon bow on top
    draw.arc([cx - 24*scale, cy - 54*scale, cx - 2*scale, cy - 32*scale], 180, 360, fill=(255, 210, 30, 255), width=int(7 * scale))
    draw.arc([cx + 2*scale, cy - 54*scale, cx + 24*scale, cy - 32*scale], 180, 360, fill=(255, 210, 30, 255), width=int(7 * scale))

    return img.resize((size, size), Image.Resampling.LANCZOS)

print("Generating video-accurate sprites...")

tiles_palette = [
    (1, (155, 61, 179), False),  # Purple
    (2, (240, 130, 37), False),  # Orange
    (3, (237, 76, 106), False),  # Coral Pink-Red
    (4, (43, 179, 232), False),  # Cyan Blue
    (5, (28, 191, 166), False),  # Teal Green
    (6, (242, 192, 38), False),  # Bright Yellow
    (7, (255, 255, 255), True),  # Target Rainbow 7
]

for num, col, is_rb in tiles_palette:
    t = generate_tile(num, col, is_rainbow=is_rb)
    fname = f"tile_{num}.png" if not is_rb else "tile_7_rainbow.png"
    t.save(os.path.join(SPRITES_DIR, fname))
    print(f" [OK] {fname}")

slot = generate_board_slot(256)
slot.save(os.path.join(SPRITES_DIR, "board_slot_dark.png"))
print(" [OK] board_slot_dark.png")

arrows = generate_rotation_arrows(256)
arrows.save(os.path.join(UI_DIR, "icon_rotate_arrows.png"))
print(" [OK] icon_rotate_arrows.png")

for b_type in ("trash", "hammer", "undo"):
    btn = generate_booster_btn(b_type, 180)
    btn.save(os.path.join(UI_DIR, f"booster_{b_type}.png"))
    print(f" [OK] booster_{b_type}.png")

gift = generate_gift_box(200)
gift.save(os.path.join(UI_DIR, "gift_box.png"))
print(" [OK] gift_box.png")

print("All video-accurate sprites generated successfully!")
