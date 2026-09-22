import os
import math
from PIL import Image, ImageDraw, ImageFilter

OUTPUT_DIR = "images"
os.makedirs(OUTPUT_DIR, exist_ok=True)

SCALE = 4

def create_canvas(w, h):
    return Image.new("RGBA", (w * SCALE, h * SCALE), (0, 0, 0, 0))

def finalize(img, w, h, filepath):
    resized = img.resize((w, h), Image.Resampling.LANCZOS)
    resized.save(filepath, "PNG")
    print(f"Generated: {filepath} ({w}x{h})")

def s(val):
    if isinstance(val, (int, float)):
        return int(val * SCALE)
    return [int(v * SCALE) for v in val]

# -------------------------------------------------------------
# 1. WOODEN CRATE
# -------------------------------------------------------------
def generate_crate(filepath, is_gold=False):
    W, H = 360, 160
    img = create_canvas(W, H)
    draw = ImageDraw.Draw(img)

    # Cartoon Crate Palette matching demo video
    border_col = (35, 20, 10, 255) if not is_gold else (70, 45, 10, 255)
    main_wood = (140, 85, 42, 255) if not is_gold else (235, 175, 35, 255)
    light_wood = (165, 105, 55, 255) if not is_gold else (255, 210, 65, 255)
    dark_wood = (115, 68, 30, 255) if not is_gold else (195, 135, 20, 255)
    shadow_wood = (75, 42, 18, 255) if not is_gold else (150, 95, 12, 255)
    nail_col = (25, 20, 18, 255) if not is_gold else (90, 60, 10, 255)
    nail_hl = (180, 180, 180, 255) if not is_gold else (255, 255, 180, 255)

    x0, y0, x1, y1 = s(12), s(12), s(W - 12), s(H - 12)

    # Base shape
    draw.rectangle([x0, y0, x1, y1], fill=main_wood, outline=border_col, width=s(7))

    # Horizontal Planks
    plank_h = (y1 - y0) / 3
    for i in range(3):
        py0 = y0 + i * plank_h
        py1 = py0 + plank_h
        col = light_wood if i == 0 else (main_wood if i == 1 else dark_wood)
        draw.rectangle([x0 + s(3), py0 + s(2), x1 - s(3), py1 - s(2)], fill=col)
        # Inner wood grains
        draw.line([x0 + s(30), py0 + plank_h * 0.35, x1 - s(30), py0 + plank_h * 0.35], fill=shadow_wood, width=s(2))
        draw.line([x0 + s(50), py0 + plank_h * 0.7, x1 - s(40), py0 + plank_h * 0.7], fill=shadow_wood, width=s(2))
        if i > 0:
            draw.line([x0, py0, x1, py0], fill=border_col, width=s(6))

    # Diagonal Wood Slat Bracing (Single diagonal like video or X)
    brace_w = s(34)
    diag1 = [
        (x0 + s(8), y0 + s(6)),
        (x0 + s(8) + brace_w, y0 + s(6)),
        (x1 - s(8), y1 - s(6)),
        (x1 - s(8) - brace_w, y1 - s(6))
    ]
    draw.polygon(diag1, fill=light_wood, outline=border_col)
    
    diag2 = [
        (x1 - s(8), y0 + s(6)),
        (x1 - s(8) - brace_w, y0 + s(6)),
        (x0 + s(8), y1 - s(6)),
        (x0 + s(8) + brace_w, y1 - s(6))
    ]
    draw.polygon(diag2, fill=main_wood, outline=border_col)

    # Re-trace outer border
    draw.rectangle([x0, y0, x1, y1], outline=border_col, width=s(7))

    # Top highlight
    draw.line([x0 + s(7), y0 + s(4), x1 - s(7), y0 + s(4)], fill=(255, 255, 255, 110), width=s(4))
    # Bottom shadow
    draw.line([x0 + s(7), y1 - s(4), x1 - s(7), y1 - s(4)], fill=(0, 0, 0, 90), width=s(4))

    # Corner nails
    corners = [
        (x0 + s(20), y0 + s(20)),
        (x1 - s(20), y0 + s(20)),
        (x0 + s(20), y1 - s(20)),
        (x1 - s(20), y1 - s(20)),
        ((x0 + x1)/2, (y0 + y1)/2)
    ]
    for cx, cy in corners:
        r = s(8)
        draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=nail_col, outline=border_col, width=s(2))
        draw.ellipse([cx - r + s(2), cy - r + s(2), cx - r + s(5), cy - r + s(5)], fill=nail_hl)

    finalize(img, W, H, filepath)

# -------------------------------------------------------------
# 2. MR. BEAN SPRITES (Detailed Cartoon Art)
# -------------------------------------------------------------
def draw_bean_head_refined(draw, cx, cy, expression="smile"):
    skin = (248, 218, 180, 255)
    skin_dark = (226, 188, 148, 255)
    outline = (40, 28, 20, 255)
    hair_col = (25, 20, 18, 255)

    # 1. Ears
    ear_w, ear_h = s(16), s(26)
    draw.ellipse([cx - s(42) - ear_w, cy - ear_h/2, cx - s(42) + ear_w, cy + ear_h/2], fill=skin, outline=outline, width=s(3))
    draw.arc([cx - s(42) - ear_w/2, cy - ear_h/3, cx - s(42) + ear_w/2, cy + ear_h/3], 30, 210, fill=skin_dark, width=s(3))
    
    draw.ellipse([cx + s(42) - ear_w, cy - ear_h/2, cx + s(42) + ear_w, cy + ear_h/2], fill=skin, outline=outline, width=s(3))
    draw.arc([cx + s(42) - ear_w/2, cy - ear_h/3, cx + s(42) + ear_w/2, cy + ear_h/3], 330, 150, fill=skin_dark, width=s(3))

    # 2. Head Shape (Egg-shaped cartoon Mr Bean head)
    head_pts = [
        (cx - s(38), cy - s(25)),
        (cx - s(36), cy - s(48)),
        (cx - s(20), cy - s(62)),
        (cx, cy - s(65)),
        (cx + s(20), cy - s(62)),
        (cx + s(36), cy - s(48)),
        (cx + s(38), cy - s(25)),
        (cx + s(34), cy + s(20)),
        (cx + s(20), cy + s(46)),
        (cx, cy + s(52)),
        (cx - s(20), cy + s(46)),
        (cx - s(34), cy + s(20))
    ]
    draw.polygon(head_pts, fill=skin, outline=outline)

    # 3. Hair (Neat combed cartoon hair)
    hair_pts = [
        (cx - s(40), cy - s(25)),
        (cx - s(38), cy - s(50)),
        (cx - s(22), cy - s(64)),
        (cx, cy - s(67)),
        (cx + s(22), cy - s(64)),
        (cx + s(38), cy - s(50)),
        (cx + s(40), cy - s(25)),
        (cx + s(30), cy - s(42)),
        (cx + s(10), cy - s(50)),
        (cx - s(12), cy - s(46)),
        (cx - s(30), cy - s(35))
    ]
    draw.polygon(hair_pts, fill=hair_col, outline=outline)
    # Sideburns & front curl
    draw.line([cx - s(38), cy - s(30), cx - s(34), cy - s(15)], fill=hair_col, width=s(6))
    draw.line([cx + s(38), cy - s(30), cx + s(34), cy - s(15)], fill=hair_col, width=s(6))
    draw.arc([cx - s(20), cy - s(56), cx + s(5), cy - s(38)], 180, 360, fill=hair_col, width=s(6))

    # 4. Eyebrows
    if expression == "fall":
        draw.line([cx - s(30), cy - s(28), cx - s(10), cy - s(18)], fill=hair_col, width=s(6))
        draw.line([cx + s(10), cy - s(18), cx + s(30), cy - s(28)], fill=hair_col, width=s(6))
    else:
        # Signature quirky eyebrows
        draw.arc([cx - s(32), cy - s(38), cx - s(6), cy - s(14)], 190, 350, fill=hair_col, width=s(6))
        draw.arc([cx + s(6), cy - s(32), cx + s(32), cy - s(10)], 190, 340, fill=hair_col, width=s(6))

    # 5. Eyes
    eye_r = s(16)
    lx, ly = cx - s(16), cy - s(10)
    rx, ry = cx + s(16), cy - s(10)

    draw.ellipse([lx - eye_r, ly - eye_r, lx + eye_r, ly + eye_r], fill=(255, 255, 255, 255), outline=outline, width=s(3))
    draw.ellipse([rx - eye_r, ry - eye_r, rx + eye_r, ry + eye_r], fill=(255, 255, 255, 255), outline=outline, width=s(3))

    if expression == "fall":
        # Spiral dizzy
        draw.arc([lx - s(8), ly - s(8), lx + s(8), ly + s(8)], 0, 270, fill=hair_col, width=s(4))
        draw.arc([rx - s(8), ry - s(8), rx + s(8), ry + s(8)], 0, 270, fill=hair_col, width=s(4))
    else:
        # Pupils
        pr = s(7)
        draw.ellipse([lx - pr + s(2), ly - pr, lx + pr + s(2), ly + pr], fill=(20, 20, 20, 255))
        draw.ellipse([lx + s(1), ly - s(3), lx + s(4), ly], fill=(255, 255, 255, 255))

        draw.ellipse([rx - pr + s(2), ry - pr, rx + pr + s(2), ry + pr], fill=(20, 20, 20, 255))
        draw.ellipse([rx + s(1), ry - s(3), rx + s(4), ry], fill=(255, 255, 255, 255))

    # 6. Big Pointy Mr. Bean Nose
    nose = [
        (cx - s(2), cy - s(12)),
        (cx + s(18), cy + s(4)),
        (cx - s(2), cy + s(10))
    ]
    draw.polygon(nose, fill=skin, outline=outline)
    draw.line([(cx + s(18), cy + s(4)), (cx - s(2), cy + s(10))], fill=skin_dark, width=s(3))

    # 7. Mouth
    if expression in ["jump_open", "celebrate"]:
        draw.pieslice([cx - s(18), cy + s(12), cx + s(18), cy + s(38)], 0, 180, fill=(160, 35, 35, 255), outline=outline, width=s(3))
        draw.rectangle([cx - s(12), cy + s(13), cx + s(12), cy + s(20)], fill=(255, 255, 255, 255))
        draw.pieslice([cx - s(10), cy + s(24), cx + s(10), cy + s(38)], 0, 180, fill=(245, 120, 130, 255))
    elif expression == "fall":
        draw.arc([cx - s(16), cy + s(18), cx + s(16), cy + s(34)], 0, 180, fill=outline, width=s(4))
    else:
        # Classic Bean smirk
        draw.arc([cx - s(18), cy + s(10), cx + s(18), cy + s(30)], 15, 165, fill=outline, width=s(4))
        draw.line([cx + s(16), cy + s(18), cx + s(22), cy + s(12)], fill=outline, width=s(4))

    # Chin line
    draw.arc([cx - s(8), cy + s(38), cx + s(8), cy + s(48)], 30, 150, fill=skin_dark, width=s(3))


def generate_mrbean_idle(filepath):
    W, H = 260, 380
    img = create_canvas(W, H)
    draw = ImageDraw.Draw(img)

    cx = s(W / 2)
    cy_head = s(75)

    jacket_col = (135, 118, 92, 255)
    jacket_dark = (105, 90, 70, 255)
    border_col = (35, 28, 22, 255)
    pants_col = (34, 36, 40, 255)
    shirt_col = (255, 255, 255, 255)
    tie_col = (220, 32, 32, 255)
    shoe_col = (15, 15, 15, 255)
    skin = (248, 218, 180, 255)

    # Slender neck
    draw.rectangle([cx - s(10), cy_head + s(40), cx + s(10), cy_head + s(58)], fill=skin, outline=border_col, width=s(3))

    # Slender legs
    y_hip = s(205)
    leg_w = s(16)
    leg_h = s(105)
    draw.rectangle([cx - s(22), y_hip, cx - s(22) + leg_w, y_hip + leg_h], fill=pants_col, outline=border_col, width=s(3))
    draw.rectangle([cx + s(6), y_hip, cx + s(6) + leg_w, y_hip + leg_h], fill=pants_col, outline=border_col, width=s(3))

    # Shoes
    shoe_y = y_hip + leg_h
    draw.rounded_rectangle([cx - s(32), shoe_y - s(6), cx - s(4), shoe_y + s(16)], radius=s(6), fill=shoe_col, outline=border_col, width=s(3))
    draw.rounded_rectangle([cx + s(4), shoe_y - s(6), cx + s(32), shoe_y + s(16)], radius=s(6), fill=shoe_col, outline=border_col, width=s(3))

    # Torso (Tweed Jacket)
    torso_top = cy_head + s(52)
    torso_w, torso_h = s(70), s(85)
    draw.rounded_rectangle([cx - torso_w/2, torso_top, cx + torso_w/2, torso_top + torso_h], radius=s(8), fill=jacket_col, outline=border_col, width=s(4))

    # Shirt & Tie
    draw.polygon([(cx - s(16), torso_top), (cx + s(16), torso_top), (cx, torso_top + s(38))], fill=shirt_col, outline=border_col)
    
    tie = [
        (cx - s(5), torso_top + s(6)),
        (cx + s(5), torso_top + s(6)),
        (cx + s(8), torso_top + s(58)),
        (cx, torso_top + s(70)),
        (cx - s(8), torso_top + s(58))
    ]
    draw.polygon(tie, fill=tie_col, outline=border_col)
    draw.polygon([(cx - s(5), torso_top + s(3)), (cx + s(5), torso_top + s(3)), (cx + s(4), torso_top + s(12)), (cx - s(4), torso_top + s(12))], fill=(175, 20, 20, 255), outline=border_col)

    # Lapel lines
    draw.line([cx - s(20), torso_top, cx - s(6), torso_top + s(45)], fill=jacket_dark, width=s(4))
    draw.line([cx + s(20), torso_top, cx + s(6), torso_top + s(45)], fill=jacket_dark, width=s(4))
    draw.ellipse([cx - s(3), torso_top + s(56), cx + s(3), torso_top + s(62)], fill=border_col)

    # Arms (Slight ready stance with bent elbows)
    draw.line([cx - torso_w/2 + s(4), torso_top + s(8), cx - s(48), torso_top + s(45)], fill=jacket_col, width=s(14))
    draw.line([cx - s(48), torso_top + s(45), cx - s(38), torso_top + s(75)], fill=jacket_col, width=s(14))
    draw.ellipse([cx - s(45), torso_top + s(70), cx - s(30), torso_top + s(85)], fill=skin, outline=border_col, width=s(3))

    draw.line([cx + torso_w/2 - s(4), torso_top + s(8), cx + s(48), torso_top + s(45)], fill=jacket_col, width=s(14))
    draw.line([cx + s(48), torso_top + s(45), cx + s(38), torso_top + s(75)], fill=jacket_col, width=s(14))
    draw.ellipse([cx + s(30), torso_top + s(70), cx + s(45), torso_top + s(85)], fill=skin, outline=border_col, width=s(3))

    # Head
    draw_bean_head_refined(draw, cx, cy_head, expression="smile")

    finalize(img, W, H, filepath)


def generate_mrbean_jump1(filepath):
    """Dynamic Jump Pose - knees bent up, arms out balancing"""
    W, H = 280, 380
    img = create_canvas(W, H)
    draw = ImageDraw.Draw(img)

    cx = s(W / 2)
    cy_head = s(75)

    jacket_col = (135, 118, 92, 255)
    border_col = (35, 28, 22, 255)
    pants_col = (34, 36, 40, 255)
    shirt_col = (255, 255, 255, 255)
    tie_col = (220, 32, 32, 255)
    shoe_col = (15, 15, 15, 255)
    skin = (248, 218, 180, 255)

    # Slender neck
    draw.rectangle([cx - s(10), cy_head + s(40), cx + s(10), cy_head + s(58)], fill=skin, outline=border_col, width=s(3))

    # Bent Jump Legs
    y_hip = s(205)
    # Left leg bent up
    draw.line([cx - s(15), y_hip, cx - s(50), y_hip + s(35)], fill=pants_col, width=s(16))
    draw.line([cx - s(50), y_hip + s(35), cx - s(30), y_hip + s(75)], fill=pants_col, width=s(16))
    draw.rounded_rectangle([cx - s(45), y_hip + s(70), cx - s(15), y_hip + s(90)], radius=s(6), fill=shoe_col, outline=border_col, width=s(3))

    # Right leg bent up
    draw.line([cx + s(15), y_hip, cx + s(50), y_hip + s(35)], fill=pants_col, width=s(16))
    draw.line([cx + s(50), y_hip + s(35), cx + s(30), y_hip + s(75)], fill=pants_col, width=s(16))
    draw.rounded_rectangle([cx + s(15), y_hip + s(70), cx + s(45), y_hip + s(90)], radius=s(6), fill=shoe_col, outline=border_col, width=s(3))

    # Torso
    torso_top = cy_head + s(52)
    torso_w, torso_h = s(70), s(85)
    draw.rounded_rectangle([cx - torso_w/2, torso_top, cx + torso_w/2, torso_top + torso_h], radius=s(8), fill=jacket_col, outline=border_col, width=s(4))

    # Shirt & Flying Tie
    draw.polygon([(cx - s(16), torso_top), (cx + s(16), torso_top), (cx, torso_top + s(38))], fill=shirt_col, outline=border_col)
    
    tie = [
        (cx - s(5), torso_top + s(6)),
        (cx + s(5), torso_top + s(6)),
        (cx + s(20), torso_top + s(50)),
        (cx + s(28), torso_top + s(65)),
        (cx + s(10), torso_top + s(58))
    ]
    draw.polygon(tie, fill=tie_col, outline=border_col)

    # Dynamic Outstretched Arms
    draw.line([cx - torso_w/2, torso_top + s(12), cx - s(55), torso_top - s(5)], fill=jacket_col, width=s(14))
    draw.line([cx - s(55), torso_top - s(5), cx - s(70), torso_top - s(35)], fill=jacket_col, width=s(14))
    draw.ellipse([cx - s(80), torso_top - s(45), cx - s(62), torso_top - s(28)], fill=skin, outline=border_col, width=s(3))

    draw.line([cx + torso_w/2, torso_top + s(12), cx + s(55), torso_top - s(5)], fill=jacket_col, width=s(14))
    draw.line([cx + s(55), torso_top - s(5), cx + s(70), torso_top - s(35)], fill=jacket_col, width=s(14))
    draw.ellipse([cx + s(62), torso_top - s(45), cx + s(80), torso_top - s(28)], fill=skin, outline=border_col, width=s(3))

    # Head
    draw_bean_head_refined(draw, cx, cy_head, expression="jump_open")

    finalize(img, W, H, filepath)


def generate_mrbean_jump2(filepath):
    """Celebration / Hooray Pose - Frame 00:02 style"""
    W, H = 280, 380
    img = create_canvas(W, H)
    draw = ImageDraw.Draw(img)

    cx = s(W / 2)
    cy_head = s(95)

    jacket_col = (135, 118, 92, 255)
    border_col = (35, 28, 22, 255)
    pants_col = (34, 36, 40, 255)
    shirt_col = (255, 255, 255, 255)
    tie_col = (220, 32, 32, 255)
    shoe_col = (15, 15, 15, 255)
    skin = (248, 218, 180, 255)

    # Neck
    draw.rectangle([cx - s(10), cy_head + s(40), cx + s(10), cy_head + s(58)], fill=skin, outline=border_col, width=s(3))

    # Arms straight up in V
    torso_top = cy_head + s(52)
    draw.line([cx - s(25), torso_top + s(10), cx - s(60), cy_head - s(65)], fill=jacket_col, width=s(14))
    draw.ellipse([cx - s(70), cy_head - s(80), cx - s(50), cy_head - s(60)], fill=skin, outline=border_col, width=s(3))

    draw.line([cx + s(25), torso_top + s(10), cx + s(60), cy_head - s(65)], fill=jacket_col, width=s(14))
    draw.ellipse([cx + s(50), cy_head - s(80), cx + s(70), cy_head - s(60)], fill=skin, outline=border_col, width=s(3))

    # Legs tucked / kicking back
    y_hip = s(220)
    draw.line([cx - s(12), y_hip, cx - s(25), y_hip + s(50)], fill=pants_col, width=s(16))
    draw.line([cx + s(12), y_hip, cx + s(25), y_hip + s(50)], fill=pants_col, width=s(16))
    draw.rounded_rectangle([cx - s(40), y_hip + s(45), cx + s(40), y_hip + s(65)], radius=s(6), fill=shoe_col, outline=border_col, width=s(3))

    # Torso
    torso_w, torso_h = s(70), s(85)
    draw.rounded_rectangle([cx - torso_w/2, torso_top, cx + torso_w/2, torso_top + torso_h], radius=s(8), fill=jacket_col, outline=border_col, width=s(4))

    # Shirt & Tie
    draw.polygon([(cx - s(16), torso_top), (cx + s(16), torso_top), (cx, torso_top + s(38))], fill=shirt_col, outline=border_col)
    
    tie = [
        (cx - s(5), torso_top + s(6)),
        (cx + s(5), torso_top + s(6)),
        (cx + s(6), torso_top + s(58)),
        (cx, torso_top + s(70)),
        (cx - s(6), torso_top + s(58))
    ]
    draw.polygon(tie, fill=tie_col, outline=border_col)

    # Head
    draw_bean_head_refined(draw, cx, cy_head, expression="celebrate")

    finalize(img, W, H, filepath)


def generate_mrbean_jump3(filepath):
    """Iconic Mid-Air Leg Splits - Frame 00:14 style!"""
    W, H = 360, 380
    img = create_canvas(W, H)
    draw = ImageDraw.Draw(img)

    cx = s(W / 2)
    cy_head = s(85)

    jacket_col = (135, 118, 92, 255)
    border_col = (35, 28, 22, 255)
    pants_col = (34, 36, 40, 255)
    shirt_col = (255, 255, 255, 255)
    tie_col = (220, 32, 32, 255)
    shoe_col = (15, 15, 15, 255)
    skin = (248, 218, 180, 255)

    # Slender Neck
    draw.rectangle([cx - s(10), cy_head + s(40), cx + s(10), cy_head + s(58)], fill=skin, outline=border_col, width=s(3))

    # Perfect Horizontal Split Legs!
    y_hip = s(215)
    # Left leg out
    draw.line([cx - s(10), y_hip, cx - s(130), y_hip + s(10)], fill=pants_col, width=s(16))
    draw.rounded_rectangle([cx - s(155), y_hip - s(2), cx - s(125), y_hip + s(22)], radius=s(6), fill=shoe_col, outline=border_col, width=s(3))

    # Right leg out
    draw.line([cx + s(10), y_hip, cx + s(130), y_hip + s(10)], fill=pants_col, width=s(16))
    draw.rounded_rectangle([cx + s(125), y_hip - s(2), cx + s(155), y_hip + s(22)], radius=s(6), fill=shoe_col, outline=border_col, width=s(3))

    # Torso
    torso_top = cy_head + s(52)
    torso_w, torso_h = s(70), s(85)
    draw.rounded_rectangle([cx - torso_w/2, torso_top, cx + torso_w/2, torso_top + torso_h], radius=s(8), fill=jacket_col, outline=border_col, width=s(4))

    # Shirt & Tie
    draw.polygon([(cx - s(16), torso_top), (cx + s(16), torso_top), (cx, torso_top + s(38))], fill=shirt_col, outline=border_col)
    
    tie = [
        (cx - s(5), torso_top + s(6)),
        (cx + s(5), torso_top + s(6)),
        (cx + s(7), torso_top + s(58)),
        (cx, torso_top + s(70)),
        (cx - s(7), torso_top + s(58))
    ]
    draw.polygon(tie, fill=tie_col, outline=border_col)

    # Comical OK Hands tucked at sides / chest (frame 00:14)
    draw.line([cx - torso_w/2, torso_top + s(12), cx - s(48), torso_top + s(32)], fill=jacket_col, width=s(14))
    draw.ellipse([cx - s(58), torso_top + s(24), cx - s(40), torso_top + s(44)], fill=skin, outline=border_col, width=s(3))

    draw.line([cx + torso_w/2, torso_top + s(12), cx + s(48), torso_top + s(32)], fill=jacket_col, width=s(14))
    draw.ellipse([cx + s(40), torso_top + s(24), cx + s(58), torso_top + s(44)], fill=skin, outline=border_col, width=s(3))

    # Head
    draw_bean_head_refined(draw, cx, cy_head, expression="celebrate")

    finalize(img, W, H, filepath)


def generate_mrbean_fall(filepath):
    """Dizzy / Knocked Over Reaction Pose"""
    W, H = 340, 360
    img = create_canvas(W, H)
    draw = ImageDraw.Draw(img)

    cx = s(W / 2 + 10)
    cy_head = s(160)

    jacket_col = (135, 118, 92, 255)
    border_col = (35, 28, 22, 255)
    pants_col = (34, 36, 40, 255)
    shirt_col = (255, 255, 255, 255)
    tie_col = (220, 32, 32, 255)
    shoe_col = (15, 15, 15, 255)
    skin = (248, 218, 180, 255)

    # Flailing Tilted Legs
    draw.line([cx - s(10), s(110), cx - s(60), s(45)], fill=pants_col, width=s(16))
    draw.rounded_rectangle([cx - s(80), s(30), cx - s(45), s(55)], radius=s(6), fill=shoe_col, outline=border_col, width=s(3))

    draw.line([cx + s(10), s(110), cx + s(65), s(55)], fill=pants_col, width=s(16))
    draw.rounded_rectangle([cx + s(55), s(40), cx + s(90), s(65)], radius=s(6), fill=shoe_col, outline=border_col, width=s(3))

    # Tilted Torso
    torso_top = s(95)
    draw.rounded_rectangle([cx - s(35), torso_top, cx + s(35), torso_top + s(75)], radius=s(8), fill=jacket_col, outline=border_col, width=s(4))

    # Wild flying tie
    draw.polygon([(cx, torso_top + s(8)), (cx - s(50), torso_top + s(15)), (cx - s(60), torso_top + s(5)), (cx - s(10), torso_top + s(25))], fill=tie_col, outline=border_col)

    # Flailing arms
    draw.line([cx - s(30), torso_top + s(20), cx - s(75), torso_top + s(60)], fill=jacket_col, width=s(14))
    draw.ellipse([cx - s(88), torso_top + s(55), cx - s(68), torso_top + s(75)], fill=skin, outline=border_col, width=s(3))

    # Head tilted down with dizzy expression
    draw_bean_head_refined(draw, cx, cy_head + s(40), expression="fall")

    finalize(img, W, H, filepath)

if __name__ == "__main__":
    print("Re-generating polished character and environment assets...")
    generate_crate(os.path.join(OUTPUT_DIR, "crate.png"), is_gold=False)
    generate_crate(os.path.join(OUTPUT_DIR, "crate_gold.png"), is_gold=True)
    generate_mrbean_idle(os.path.join(OUTPUT_DIR, "mrbean_idle.png"))
    generate_mrbean_jump1(os.path.join(OUTPUT_DIR, "mrbean_jump1.png"))
    generate_mrbean_jump2(os.path.join(OUTPUT_DIR, "mrbean_jump2.png"))
    generate_mrbean_jump3(os.path.join(OUTPUT_DIR, "mrbean_jump3.png"))
    generate_mrbean_fall(os.path.join(OUTPUT_DIR, "mrbean_fall.png"))
    print("Character sprites updated successfully!")

