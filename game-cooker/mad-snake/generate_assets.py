import os
import math
from PIL import Image, ImageDraw, ImageFilter

def create_smooth_image(size, draw_func):
    scale = 4
    high_res_size = (size[0] * scale, size[1] * scale)
    img = Image.new('RGBA', high_res_size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    draw_func(draw, high_res_size, scale)
    return img.resize(size, Image.Resampling.LANCZOS)

# 1. Snake Head (Player Green)
def draw_snake_head(draw, size, s):
    w, h = size
    # Head base (rounded rectangle)
    # Direction is facing up by default (can be rotated in code)
    margin = 8 * s
    draw.rounded_rectangle([margin, margin + 12*s, w - margin, h - margin], radius=24*s, fill=(74, 222, 128, 255), outline=(34, 197, 94, 255), width=3*s)
    
    # Cute bifurcated tongue
    tongue_color = (239, 68, 68, 255)
    tw = 4 * s
    draw.line([w//2, margin + 12*s, w//2, margin + 2*s], fill=tongue_color, width=tw)
    draw.line([w//2, margin + 2*s, w//2 - 6*s, margin - 4*s], fill=tongue_color, width=tw)
    draw.line([w//2, margin + 2*s, w//2 + 6*s, margin - 4*s], fill=tongue_color, width=tw)
    
    # Eyes (Big googly eyes)
    eye_r = 18 * s
    # Left eye
    lex, ley = w * 0.32, h * 0.45
    draw.ellipse([lex - eye_r, ley - eye_r, lex + eye_r, ley + eye_r], fill=(255, 255, 255, 255), outline=(22, 101, 52, 255), width=2*s)
    # Pupil
    pr = 8 * s
    draw.ellipse([lex - pr, ley - pr - 2*s, lex + pr, ley + pr - 2*s], fill=(15, 23, 42, 255))
    # Eye shine
    sr = 3 * s
    draw.ellipse([lex - pr + 2*s, ley - pr, lex - pr + 2*s + 2*sr, ley - pr + 2*sr], fill=(255, 255, 255, 255))

    # Right eye
    rex, rey = w * 0.68, h * 0.45
    draw.ellipse([rex - eye_r, rey - eye_r, rex + eye_r, rey + eye_r], fill=(255, 255, 255, 255), outline=(22, 101, 52, 255), width=2*s)
    draw.ellipse([rex - pr, rey - pr - 2*s, rex + pr, rey + pr - 2*s], fill=(15, 23, 42, 255))
    draw.ellipse([rex - pr + 2*s, rey - pr, rex - pr + 2*s + 2*sr, rey - pr + 2*sr], fill=(255, 255, 255, 255))

# 2. Snake Body (Green)
def draw_snake_body(draw, size, s):
    w, h = size
    m = 6 * s
    draw.rounded_rectangle([m, m, w - m, h - m], radius=16*s, fill=(74, 222, 128, 255), outline=(34, 197, 94, 255), width=3*s)
    # Subtle inner highlight
    draw.rounded_rectangle([m + 4*s, m + 4*s, w - m - 4*s, h - m - 8*s], radius=12*s, fill=(134, 239, 172, 255))
    draw.rounded_rectangle([m + 6*s, m + 8*s, w - m - 6*s, h - m - 4*s], radius=10*s, fill=(74, 222, 128, 255))

# 3. Enemy Head (Orange)
def draw_enemy_head(draw, size, s):
    w, h = size
    margin = 8 * s
    draw.rounded_rectangle([margin, margin + 12*s, w - margin, h - margin], radius=24*s, fill=(249, 115, 22, 255), outline=(194, 65, 12, 255), width=3*s)
    
    # Tongue
    tongue_color = (220, 38, 38, 255)
    tw = 4 * s
    draw.line([w//2, margin + 12*s, w//2, margin + 2*s], fill=tongue_color, width=tw)
    draw.line([w//2, margin + 2*s, w//2 - 6*s, margin - 4*s], fill=tongue_color, width=tw)
    draw.line([w//2, margin + 2*s, w//2 + 6*s, margin - 4*s], fill=tongue_color, width=tw)
    
    # Eyes
    eye_r = 18 * s
    lex, ley = w * 0.32, h * 0.45
    draw.ellipse([lex - eye_r, ley - eye_r, lex + eye_r, ley + eye_r], fill=(255, 255, 255, 255), outline=(154, 52, 18, 255), width=2*s)
    pr = 8 * s
    draw.ellipse([lex - pr, ley - pr - 2*s, lex + pr, ley + pr - 2*s], fill=(15, 23, 42, 255))
    sr = 3 * s
    draw.ellipse([lex - pr + 2*s, ley - pr, lex - pr + 2*s + 2*sr, ley - pr + 2*sr], fill=(255, 255, 255, 255))

    rex, rey = w * 0.68, h * 0.45
    draw.ellipse([rex - eye_r, rey - eye_r, rex + eye_r, rey + eye_r], fill=(255, 255, 255, 255), outline=(154, 52, 18, 255), width=2*s)
    draw.ellipse([rex - pr, rey - pr - 2*s, rex + pr, rey + pr - 2*s], fill=(15, 23, 42, 255))
    draw.ellipse([rex - pr + 2*s, rey - pr, rex - pr + 2*s + 2*sr, rey - pr + 2*sr], fill=(255, 255, 255, 255))

# 4. Enemy Body (Orange)
def draw_enemy_body(draw, size, s):
    w, h = size
    m = 6 * s
    draw.rounded_rectangle([m, m, w - m, h - m], radius=16*s, fill=(249, 115, 22, 255), outline=(194, 65, 12, 255), width=3*s)
    draw.rounded_rectangle([m + 4*s, m + 4*s, w - m - 4*s, h - m - 8*s], radius=12*s, fill=(253, 186, 116, 255))
    draw.rounded_rectangle([m + 6*s, m + 8*s, w - m - 6*s, h - m - 4*s], radius=10*s, fill=(249, 115, 22, 255))

# 5. Red Apple
def draw_apple_red(draw, size, s):
    w, h = size
    cx, cy = w // 2, int(h * 0.55)
    # Stem
    draw.arc([cx - 10*s, cy - 38*s, cx + 14*s, cy - 10*s], start=220, end=350, fill=(120, 53, 15, 255), width=4*s)
    # Leaf
    draw.chord([cx + 2*s, cy - 32*s, cx + 22*s, cy - 18*s], start=20, end=200, fill=(34, 197, 94, 255), outline=(22, 101, 52, 255), width=1*s)
    # Apple Body (double lobed)
    r = 24 * s
    draw.ellipse([cx - r - 6*s, cy - r, cx + 6*s, cy + r], fill=(239, 68, 68, 255))
    draw.ellipse([cx - 6*s, cy - r, cx + r + 6*s, cy + r], fill=(220, 38, 38, 255))
    draw.ellipse([cx - r, cy - r + 4*s, cx + r, cy + r + 4*s], fill=(239, 68, 68, 255))
    # Specular shine
    draw.ellipse([cx - 18*s, cy - 16*s, cx - 6*s, cy - 6*s], fill=(254, 202, 202, 220))

# 6. Green Apple
def draw_apple_green(draw, size, s):
    w, h = size
    cx, cy = w // 2, int(h * 0.55)
    # Stem
    draw.arc([cx - 10*s, cy - 38*s, cx + 14*s, cy - 10*s], start=220, end=350, fill=(120, 53, 15, 255), width=4*s)
    # Leaf
    draw.chord([cx + 2*s, cy - 32*s, cx + 22*s, cy - 18*s], start=20, end=200, fill=(74, 222, 128, 255), outline=(22, 101, 52, 255), width=1*s)
    # Apple Body
    r = 24 * s
    draw.ellipse([cx - r - 6*s, cy - r, cx + 6*s, cy + r], fill=(132, 204, 22, 255))
    draw.ellipse([cx - 6*s, cy - r, cx + r + 6*s, cy + r], fill=(101, 163, 13, 255))
    draw.ellipse([cx - r, cy - r + 4*s, cx + r, cy + r + 4*s], fill=(132, 204, 22, 255))
    # Specular shine
    draw.ellipse([cx - 18*s, cy - 16*s, cx - 6*s, cy - 6*s], fill=(236, 252, 203, 220))

# 7. Taco
def draw_taco(draw, size, s):
    w, h = size
    cx, cy = w // 2, h // 2
    # Taco Shell (semi-circle folded)
    box = [cx - 36*s, cy - 24*s, cx + 36*s, cy + 32*s]
    # Filling (meat, lettuce, tomato chunks)
    draw.pieslice(box, 180, 360, fill=(180, 83, 9, 255))
    # Lettuce crinkles
    for ox in range(-28, 30, 8):
        draw.ellipse([cx + ox*s - 6*s, cy - 16*s, cx + ox*s + 6*s, cy - 4*s], fill=(34, 197, 94, 255))
    # Tomatoes
    draw.ellipse([cx - 16*s, cy - 14*s, cx - 6*s, cy - 6*s], fill=(239, 68, 68, 255))
    draw.ellipse([cx + 10*s, cy - 15*s, cx + 20*s, cy - 7*s], fill=(239, 68, 68, 255))
    # Shell outer
    draw.arc(box, 180, 360, fill=(234, 179, 8, 255), width=7*s)
    draw.chord([cx - 36*s, cy, cx + 36*s, cy + 24*s], 0, 180, fill=(245, 158, 11, 255), outline=(217, 119, 6, 255), width=2*s)

# 8. Sushi (Salmon Nigiri)
def draw_sushi(draw, size, s):
    w, h = size
    cx, cy = w // 2, h // 2
    # White Rice Base
    draw.rounded_rectangle([cx - 34*s, cy - 4*s, cx + 34*s, cy + 22*s], radius=12*s, fill=(248, 250, 252, 255), outline=(203, 213, 225, 255), width=2*s)
    # Salmon Slice
    draw.rounded_rectangle([cx - 36*s, cy - 18*s, cx + 36*s, cy + 4*s], radius=10*s, fill=(244, 63, 94, 255))
    # Salmon fat lines
    for ox in [-20, -5, 10, 25]:
        draw.line([cx + ox*s - 6*s, cy - 16*s, cx + ox*s + 4*s, cy + 2*s], fill=(254, 205, 211, 220), width=2*s)
    # Nori Seaweed Belt
    draw.rectangle([cx - 8*s, cy - 19*s, cx + 8*s, cy + 23*s], fill=(15, 23, 42, 255))

# 9. Fire Icon
def draw_fire_icon(draw, size, s):
    w, h = size
    cx, cy = w // 2, int(h * 0.55)
    # Outer Red Flame
    red_flame = [
        (cx, cy - 38*s),
        (cx + 16*s, cy - 18*s),
        (cx + 26*s, cy + 4*s),
        (cx + 18*s, cy + 28*s),
        (cx, cy + 32*s),
        (cx - 18*s, cy + 28*s),
        (cx - 26*s, cy + 4*s),
        (cx - 16*s, cy - 18*s),
    ]
    draw.polygon(red_flame, fill=(239, 68, 68, 255))
    # Orange Mid Flame
    orange_flame = [
        (cx, cy - 22*s),
        (cx + 12*s, cy - 6*s),
        (cx + 18*s, cy + 12*s),
        (cx + 12*s, cy + 24*s),
        (cx, cy + 26*s),
        (cx - 12*s, cy + 24*s),
        (cx - 18*s, cy + 12*s),
        (cx - 12*s, cy - 6*s),
    ]
    draw.polygon(orange_flame, fill=(245, 158, 11, 255))
    # Yellow Inner Core
    yellow_flame = [
        (cx, cy - 8*s),
        (cx + 8*s, cy + 6*s),
        (cx, cy + 18*s),
        (cx - 8*s, cy + 6*s),
    ]
    draw.polygon(yellow_flame, fill=(254, 240, 138, 255))

# 10. Obstacle: Potted Plant
def draw_obstacle_plant(draw, size, s):
    w, h = size
    cx = w // 2
    # Leaves (Lush green foliage)
    leaf_c = (34, 197, 94, 255)
    leaf_c2 = (22, 163, 74, 255)
    # Center top leaf
    draw.ellipse([cx - 14*s, h*0.15, cx + 14*s, h*0.48], fill=leaf_c, outline=(20, 83, 45, 255), width=2*s)
    # Left leaf
    draw.ellipse([cx - 42*s, h*0.25, cx - 4*s, h*0.52], fill=leaf_c2, outline=(20, 83, 45, 255), width=2*s)
    # Right leaf
    draw.ellipse([cx + 4*s, h*0.25, cx + 42*s, h*0.52], fill=leaf_c2, outline=(20, 83, 45, 255), width=2*s)
    # Pot Rim
    draw.rounded_rectangle([cx - 30*s, h*0.48, cx + 30*s, h*0.58], radius=4*s, fill=(234, 88, 12, 255), outline=(154, 52, 18, 255), width=2*s)
    # Pot Body (tapered)
    pot_body = [
        (cx - 26*s, h*0.58),
        (cx + 26*s, h*0.58),
        (cx + 20*s, h*0.85),
        (cx - 20*s, h*0.85),
    ]
    draw.polygon(pot_body, fill=(194, 65, 12, 255), outline=(154, 52, 18, 255))
    # Pot highlight
    draw.line([cx - 16*s, h*0.62, cx - 12*s, h*0.82], fill=(251, 146, 60, 200), width=4*s)

# 11. Obstacle: Cactus
def draw_obstacle_cactus(draw, size, s):
    w, h = size
    cx = w // 2
    c_color = (74, 222, 128, 255)
    c_outline = (22, 101, 52, 255)
    c_rib = (34, 197, 94, 255)
    # Left arm
    draw.rounded_rectangle([cx - 42*s, h*0.35, cx - 22*s, h*0.58], radius=8*s, fill=c_color, outline=c_outline, width=2*s)
    draw.rectangle([cx - 32*s, h*0.48, cx - 12*s, h*0.60], fill=c_color)
    # Right arm
    draw.rounded_rectangle([cx + 22*s, h*0.25, cx + 42*s, h*0.48], radius=8*s, fill=c_color, outline=c_outline, width=2*s)
    draw.rectangle([cx + 12*s, h*0.38, cx + 32*s, h*0.50], fill=c_color)
    # Main trunk
    draw.rounded_rectangle([cx - 18*s, h*0.12, cx + 18*s, h*0.88], radius=14*s, fill=c_color, outline=c_outline, width=2*s)
    # Vertical rib lines
    draw.line([cx - 8*s, h*0.18, cx - 8*s, h*0.85], fill=c_rib, width=2*s)
    draw.line([cx + 8*s, h*0.18, cx + 8*s, h*0.85], fill=c_rib, width=2*s)

# 12. Obstacle: Cherry Blossom (Sakura)
def draw_obstacle_sakura(draw, size, s):
    w, h = size
    cx, cy = w // 2, h // 2
    # 5 Petals
    num_petals = 5
    petal_len = 34 * s
    petal_w = 20 * s
    for i in range(num_petals):
        angle = i * (2 * math.pi / num_petals) - math.pi / 2
        px = cx + math.cos(angle) * (petal_len * 0.6)
        py = cy + math.sin(angle) * (petal_len * 0.6)
        # Petal ellipse
        draw.ellipse([px - petal_w, py - petal_w, px + petal_w, py + petal_w], fill=(244, 114, 182, 255), outline=(219, 39, 119, 255), width=2*s)
        # Inner gradient tone
        draw.ellipse([px - petal_w*0.6, py - petal_w*0.6, px + petal_w*0.6, py + petal_w*0.6], fill=(251, 207, 232, 255))
    # Center core
    draw.ellipse([cx - 14*s, cy - 14*s, cx + 14*s, cy + 14*s], fill=(219, 39, 119, 255))
    draw.ellipse([cx - 7*s, cy - 7*s, cx + 7*s, cy + 7*s], fill=(254, 240, 138, 255))
    # Pistils
    for j in range(8):
        p_ang = j * (2 * math.pi / 8)
        tx = cx + math.cos(p_ang) * 11 * s
        ty = cy + math.sin(p_ang) * 11 * s
        draw.line([cx, cy, tx, ty], fill=(254, 240, 138, 255), width=2*s)
        draw.ellipse([tx - 2*s, ty - 2*s, tx + 2*s, ty + 2*s], fill=(245, 158, 11, 255))

# 13. UI: Heart Icon
def draw_heart(draw, size, s):
    w, h = size
    cx, cy = w // 2, int(h * 0.45)
    r = 18 * s
    draw.ellipse([cx - r - 4*s, cy - r, cx + 4*s, cy + r], fill=(239, 68, 68, 255))
    draw.ellipse([cx - 4*s, cy - r, cx + r + 4*s, cy + r], fill=(239, 68, 68, 255))
    triangle = [
        (cx - r - 4*s, cy + 6*s),
        (cx + r + 4*s, cy + 6*s),
        (cx, cy + 34*s)
    ]
    draw.polygon(triangle, fill=(239, 68, 68, 255))
    # Highlight
    draw.ellipse([cx - 14*s, cy - 10*s, cx - 4*s, cy], fill=(254, 202, 202, 220))

# 14. UI: Fire Button (Big Glowing Circle)
def draw_btn_fire(draw, size, s):
    w, h = size
    cx, cy = w // 2, h // 2
    # Outer Glow Ring
    draw.ellipse([8*s, 8*s, w - 8*s, h - 8*s], fill=(67, 20, 7, 255), outline=(245, 158, 11, 255), width=6*s)
    # Inner Button Circle
    draw.ellipse([16*s, 16*s, w - 16*s, h - 16*s], fill=(234, 88, 12, 255), outline=(251, 191, 36, 255), width=3*s)
    # Flame in center
    draw_fire_icon(draw, size, s)

# 15. UI: Gamepad Button
def draw_btn_gamepad(draw, size, s):
    w, h = size
    cx, cy = w // 2, h // 2
    # Circular dark plate
    draw.ellipse([6*s, 6*s, w - 6*s, h - 6*s], fill=(39, 39, 42, 255), outline=(63, 63, 70, 255), width=3*s)
    # Gamepad body
    gw, gh = 28 * s, 16 * s
    draw.rounded_rectangle([cx - gw, cy - gh, cx + gw, cy + gh], radius=8*s, fill=(255, 255, 255, 255))
    # D-pad cross (left)
    draw.rectangle([cx - 18*s, cy - 7*s, cx - 10*s, cy + 7*s], fill=(39, 39, 42, 255))
    draw.rectangle([cx - 21*s, cy - 3*s, cx - 7*s, cy + 3*s], fill=(39, 39, 42, 255))
    # Action buttons (right)
    draw.ellipse([cx + 14*s - 3*s, cy - 4*s - 3*s, cx + 14*s + 3*s, cy - 4*s + 3*s], fill=(239, 68, 68, 255))
    draw.ellipse([cx + 9*s - 3*s, cy + 2*s - 3*s, cx + 9*s + 3*s, cy + 2*s + 3*s], fill=(59, 130, 246, 255))

# 16. UI: Pause Button
def draw_btn_pause(draw, size, s):
    w, h = size
    cx, cy = w // 2, h // 2
    draw.ellipse([6*s, 6*s, w - 6*s, h - 6*s], fill=(39, 39, 42, 255), outline=(63, 63, 70, 255), width=3*s)
    # Two vertical bars
    bw, bh = 7 * s, 22 * s
    draw.rounded_rectangle([cx - 11*s, cy - bh//2, cx - 11*s + bw, cy + bh//2], radius=3*s, fill=(255, 255, 255, 255))
    draw.rounded_rectangle([cx + 4*s, cy - bh//2, cx + 4*s + bw, cy + bh//2], radius=3*s, fill=(255, 255, 255, 255))

# 17. UI: Lock Icon
def draw_icon_lock(draw, size, s):
    w, h = size
    cx, cy = w // 2, int(h * 0.55)
    # Shackle
    draw.arc([cx - 16*s, cy - 32*s, cx + 16*s, cy], start=180, end=360, fill=(203, 213, 225, 255), width=6*s)
    # Body
    draw.rounded_rectangle([cx - 20*s, cy - 8*s, cx + 20*s, cy + 26*s], radius=6*s, fill=(241, 245, 249, 255), outline=(148, 163, 184, 255), width=2*s)
    # Keyhole
    draw.ellipse([cx - 5*s, cy + 2*s, cx + 5*s, cy + 12*s], fill=(30, 41, 59, 255))
    draw.polygon([(cx - 3*s, cy + 8*s), (cx + 3*s, cy + 8*s), (cx + 4*s, cy + 18*s), (cx - 4*s, cy + 18*s)], fill=(30, 41, 59, 255))

# 18. UI: Checkmark
def draw_icon_check(draw, size, s):
    w, h = size
    cx, cy = w // 2, h // 2
    # Green Circle
    draw.ellipse([6*s, 6*s, w - 6*s, h - 6*s], fill=(34, 197, 94, 255), outline=(255, 255, 255, 255), width=4*s)
    # Check mark
    points = [
        (cx - 16*s, cy + 2*s),
        (cx - 4*s, cy + 14*s),
        (cx + 16*s, cy - 10*s),
    ]
    draw.line(points[:2], fill=(255, 255, 255, 255), width=7*s)
    draw.line(points[1:], fill=(255, 255, 255, 255), width=7*s)

# 19. UI: Crown Icon
def draw_icon_crown(draw, size, s):
    w, h = size
    cx, cy = w // 2, int(h * 0.52)
    # Golden base plate
    draw.rounded_rectangle([6*s, 6*s, w - 6*s, h - 6*s], radius=14*s, fill=(245, 158, 11, 255), outline=(252, 211, 77, 255), width=3*s)
    # Crown shape
    crown = [
        (cx - 24*s, cy + 16*s),
        (cx - 28*s, cy - 14*s),
        (cx - 10*s, cy),
        (cx, cy - 20*s),
        (cx + 10*s, cy),
        (cx + 28*s, cy - 14*s),
        (cx + 24*s, cy + 16*s),
    ]
    draw.polygon(crown, fill=(255, 255, 255, 255))
    # Jewels
    for tx, ty in [(cx - 28*s, cy - 14*s), (cx, cy - 20*s), (cx + 28*s, cy - 14*s)]:
        draw.ellipse([tx - 3*s, ty - 3*s, tx + 3*s, ty + 3*s], fill=(239, 68, 68, 255))

# 20. UI: Home Icon
def draw_icon_home(draw, size, s):
    w, h = size
    cx, cy = w // 2, h // 2
    draw.ellipse([6*s, 6*s, w - 6*s, h - 6*s], fill=(255, 255, 255, 255), outline=(226, 232, 240, 255), width=3*s)
    # House roof
    roof = [(cx, cy - 22*s), (cx - 22*s, cy - 2*s), (cx + 22*s, cy - 2*s)]
    draw.polygon(roof, fill=(34, 197, 94, 255))
    # House body
    draw.rectangle([cx - 16*s, cy - 2*s, cx + 16*s, cy + 20*s], fill=(34, 197, 94, 255))
    # Door
    draw.rounded_rectangle([cx - 6*s, cy + 6*s, cx + 6*s, cy + 20*s], radius=2*s, fill=(255, 255, 255, 255))

# Generate all
sprites = [
    ('images/sprites/snake_head.png', (96, 96), draw_snake_head),
    ('images/sprites/snake_body.png', (96, 96), draw_snake_body),
    ('images/sprites/enemy_head.png', (96, 96), draw_enemy_head),
    ('images/sprites/enemy_body.png', (96, 96), draw_enemy_body),
    ('images/sprites/apple_red.png', (96, 96), draw_apple_red),
    ('images/sprites/apple_green.png', (96, 96), draw_apple_green),
    ('images/sprites/taco.png', (96, 96), draw_taco),
    ('images/sprites/sushi.png', (96, 96), draw_sushi),
    ('images/sprites/fire_icon.png', (96, 96), draw_fire_icon),
    ('images/sprites/obstacle_plant.png', (128, 128), draw_obstacle_plant),
    ('images/sprites/obstacle_cactus.png', (128, 128), draw_obstacle_cactus),
    ('images/sprites/obstacle_sakura.png', (128, 128), draw_obstacle_sakura),
    
    ('images/ui/btn_fire.png', (128, 128), draw_btn_fire),
    ('images/ui/btn_gamepad.png', (96, 96), draw_btn_gamepad),
    ('images/ui/btn_pause.png', (96, 96), draw_btn_pause),
    ('images/ui/heart.png', (96, 96), draw_heart),
    ('images/ui/icon_lock.png', (96, 96), draw_icon_lock),
    ('images/ui/icon_check.png', (96, 96), draw_icon_check),
    ('images/ui/icon_crown.png', (96, 96), draw_icon_crown),
    ('images/ui/icon_home.png', (96, 96), draw_icon_home),
]

for path, size, func in sprites:
    img = create_smooth_image(size, func)
    img.save(path)
    print(f'Generated {path}')

# Generate Icons
icon_sizes = [16, 32, 64, 128, 256, 512]
base_logo = create_smooth_image((512, 512), draw_snake_head)
for sz in icon_sizes:
    resized = base_logo.resize((sz, sz), Image.Resampling.LANCZOS)
    resized.save(f'images/icons/icon-{sz}.png')
    print(f'Generated images/icons/icon-{sz}.png')

print('All assets created successfully!')
