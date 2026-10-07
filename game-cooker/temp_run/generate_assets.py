import math
import os
from PIL import Image, ImageDraw, ImageFilter

def create_supersampled(width, height, scale=4):
    """Create a supersampled image for ultra-smooth antialiasing."""
    img = Image.new('RGBA', (width * scale, height * scale), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    return img, draw, scale

def downsample(img, target_size):
    return img.resize(target_size, Image.Resampling.LANCZOS)

# ==========================================
# 1. PLAYER SPRITES (Chibi Ninja Runner)
# ==========================================
def draw_ninja(w=256, h=320, pose='run0'):
    img, d, s = create_supersampled(w, h, scale=3)
    
    cx = (w * s) / 2
    cy = (h * s) * 0.45
    
    # Shadow beneath
    shadow_y = (h * s) * 0.90
    shadow_rx = 50 * s
    shadow_ry = 18 * s
    d.ellipse([cx - shadow_rx, shadow_y - shadow_ry, cx + shadow_rx, shadow_y + shadow_ry], fill=(0, 0, 0, 70))
    
    # Body parameters
    skin_color = (255, 222, 192, 255)
    gi_color = (248, 248, 252, 255)
    gi_shadow = (205, 210, 225, 255)
    belt_color = (25, 25, 30, 255)
    hair_color = (35, 38, 45, 255)
    headband_color = (240, 35, 50, 255)
    headband_dark = (190, 20, 35, 255)
    
    # Offsets based on pose
    leg_l_y = 0
    leg_r_y = 0
    arm_l_y = 0
    arm_r_y = 0
    body_bob = 0
    ribbon_angle = 0
    
    if pose == 'run0':
        body_bob = -4 * s
        leg_l_y = 18 * s
        leg_r_y = -14 * s
        arm_l_y = -12 * s
        arm_r_y = 14 * s
        ribbon_angle = -12
    elif pose == 'run1':
        body_bob = 4 * s
        leg_l_y = 0
        leg_r_y = 0
        arm_l_y = 0
        arm_r_y = 0
        ribbon_angle = -4
    elif pose == 'run2':
        body_bob = -4 * s
        leg_l_y = -14 * s
        leg_r_y = 18 * s
        arm_l_y = 14 * s
        arm_r_y = -12 * s
        ribbon_angle = 12
    elif pose == 'run3':
        body_bob = 6 * s
        leg_l_y = -6 * s
        leg_r_y = -6 * s
        arm_l_y = 4 * s
        arm_r_y = 4 * s
        ribbon_angle = 6
    elif pose == 'jump':
        body_bob = -20 * s
        leg_l_y = -22 * s
        leg_r_y = -26 * s
        arm_l_y = -24 * s
        arm_r_y = -24 * s
        ribbon_angle = -25
    elif pose == 'slide':
        body_bob = 40 * s
        leg_l_y = 10 * s
        leg_r_y = 20 * s
        arm_l_y = 15 * s
        arm_r_y = 15 * s
        ribbon_angle = -45
    elif pose == 'crash':
        body_bob = 10 * s
        ribbon_angle = 70
        
    by = cy + body_bob
    
    # 1. Legs
    leg_width = 18 * s
    # Left Leg
    ll_top = by + 40 * s
    ll_bottom = by + 85 * s + leg_l_y
    if pose != 'slide':
        d.rectangle([cx - 28 * s - leg_width/2, ll_top, cx - 28 * s + leg_width/2, ll_bottom], fill=gi_color)
        d.rectangle([cx - 28 * s - leg_width/2, ll_top, cx - 28 * s - leg_width/4, ll_bottom], fill=gi_shadow)
        # Foot
        d.ellipse([cx - 30 * s - 10 * s, ll_bottom - 6 * s, cx - 26 * s + 10 * s, ll_bottom + 10 * s], fill=skin_color)
    
        # Right Leg
        rl_top = by + 40 * s
        rl_bottom = by + 85 * s + leg_r_y
        d.rectangle([cx + 28 * s - leg_width/2, rl_top, cx + 28 * s + leg_width/2, rl_bottom], fill=gi_color)
        d.rectangle([cx + 28 * s + leg_width/4, rl_top, cx + 28 * s + leg_width/2, rl_bottom], fill=gi_shadow)
        # Foot
        d.ellipse([cx + 26 * s - 10 * s, rl_bottom - 6 * s, cx + 30 * s + 10 * s, rl_bottom + 10 * s], fill=skin_color)
    else:
        # Sliding legs extended forward/low
        d.polygon([
            (cx - 35 * s, by + 30 * s),
            (cx + 45 * s, by + 50 * s),
            (cx + 40 * s, by + 70 * s),
            (cx - 40 * s, by + 50 * s)
        ], fill=gi_color)
        d.ellipse([cx + 35 * s, by + 45 * s, cx + 55 * s, by + 65 * s], fill=skin_color)
    
    # 2. Torso (White Gi)
    torso_top = by - 15 * s
    torso_bot = by + 45 * s
    tw = 42 * s
    if pose != 'slide':
        d.polygon([
            (cx - tw, torso_top),
            (cx + tw, torso_top),
            (cx + tw * 0.85, torso_bot),
            (cx - tw * 0.85, torso_bot)
        ], fill=gi_color)
        # Shading
        d.polygon([
            (cx + tw * 0.5, torso_top),
            (cx + tw, torso_top),
            (cx + tw * 0.85, torso_bot),
            (cx + tw * 0.4, torso_bot)
        ], fill=gi_shadow)
    else:
        # Lean forward in slide
        d.polygon([
            (cx - tw, torso_top + 10 * s),
            (cx + tw * 0.8, torso_top - 5 * s),
            (cx + tw * 0.7, torso_bot),
            (cx - tw * 0.8, torso_bot)
        ], fill=gi_color)

    # 3. Arms
    arm_w = 14 * s
    # Left Arm
    d.polygon([
        (cx - tw + 2*s, torso_top + 4*s),
        (cx - tw - 18*s, torso_top + 28*s + arm_l_y),
        (cx - tw - 18*s + arm_w, torso_top + 28*s + arm_l_y),
        (cx - tw + arm_w, torso_top + 12*s)
    ], fill=gi_color)
    d.ellipse([cx - tw - 22*s, torso_top + 24*s + arm_l_y, cx - tw - 8*s, torso_top + 38*s + arm_l_y], fill=skin_color)
    
    # Right Arm
    d.polygon([
        (cx + tw - 2*s, torso_top + 4*s),
        (cx + tw + 18*s, torso_top + 28*s + arm_r_y),
        (cx + tw + 18*s - arm_w, torso_top + 28*s + arm_r_y),
        (cx + tw - arm_w, torso_top + 12*s)
    ], fill=gi_color)
    d.ellipse([cx + tw + 8*s, torso_top + 24*s + arm_r_y, cx + tw + 22*s, torso_top + 38*s + arm_r_y], fill=skin_color)

    # 4. Black Belt
    belt_y = by + 28 * s
    d.rectangle([cx - tw * 0.88, belt_y, cx + tw * 0.88, belt_y + 12 * s], fill=belt_color)
    # Belt knot dangling
    d.polygon([
        (cx - 8 * s, belt_y + 10 * s),
        (cx + 8 * s, belt_y + 10 * s),
        (cx + 6 * s, belt_y + 28 * s),
        (cx - 10 * s, belt_y + 26 * s)
    ], fill=belt_color)

    # 5. Head (Viewed from back / cute chibi ninja)
    head_cy = by - 52 * s
    head_rx = 48 * s
    head_ry = 42 * s
    
    # Ears
    d.ellipse([cx - head_rx - 4*s, head_cy - 4*s, cx - head_rx + 10*s, head_cy + 14*s], fill=skin_color)
    d.ellipse([cx + head_rx - 10*s, head_cy - 4*s, cx + head_rx + 4*s, head_cy + 14*s], fill=skin_color)
    
    # Head base (skin/neck)
    d.ellipse([cx - head_rx, head_cy - head_ry, cx + head_rx, head_cy + head_ry], fill=skin_color)
    
    # Black Hair / Cap (covering upper & back half of head)
    d.chord([cx - head_rx, head_cy - head_ry - 2*s, cx + head_rx, head_cy + head_ry * 0.6], 160, 380, fill=hair_color)
    # Smooth hair crown
    d.ellipse([cx - head_rx * 0.95, head_cy - head_ry * 1.05, cx + head_rx * 0.95, head_cy + 5 * s], fill=hair_color)
    
    # 6. Red Headband (thick vibrant band across back of head)
    hb_y = head_cy - 6 * s
    hb_h = 16 * s
    d.rectangle([cx - head_rx * 0.98, hb_y, cx + head_rx * 0.98, hb_y + hb_h], fill=headband_color)
    d.rectangle([cx - head_rx * 0.98, hb_y + hb_h - 3*s, cx + head_rx * 0.98, hb_y + hb_h], fill=headband_dark)
    
    # 7. Dual Red Headband Ribbons trailing behind in the wind!
    rib_rad = math.radians(ribbon_angle)
    # Knot on center back of headband
    d.ellipse([cx - 9*s, hb_y + 2*s, cx + 9*s, hb_y + 18*s], fill=headband_dark)
    
    # Trailing ribbon 1 (longer)
    r1_x = cx + math.sin(rib_rad) * 40 * s
    r1_y = hb_y + 12*s + math.cos(rib_rad) * 55 * s
    d.polygon([
        (cx - 5*s, hb_y + 10*s),
        (cx + 6*s, hb_y + 10*s),
        (r1_x + 12*s, r1_y),
        (r1_x - 3*s, r1_y + 8*s)
    ], fill=headband_color)
    
    # Trailing ribbon 2 (slightly offset)
    r2_x = cx + math.sin(rib_rad + 0.3) * 32 * s
    r2_y = hb_y + 12*s + math.cos(rib_rad + 0.3) * 45 * s
    d.polygon([
        (cx - 3*s, hb_y + 12*s),
        (cx + 7*s, hb_y + 12*s),
        (r2_x + 10*s, r2_y),
        (r2_x - 2*s, r2_y + 6*s)
    ], fill=headband_dark)

    # Crash effect
    if pose == 'crash':
        # Stars around head
        for ang in [0, 72, 144, 216, 288]:
            sx = cx + math.cos(math.radians(ang)) * 60 * s
            sy = head_cy + math.sin(math.radians(ang)) * 40 * s
            d.polygon([
                (sx, sy - 12*s), (sx + 4*s, sy - 4*s),
                (sx + 12*s, sy), (sx + 4*s, sy + 4*s),
                (sx, sy + 12*s), (sx - 4*s, sy + 4*s),
                (sx - 12*s, sy), (sx - 4*s, sy - 4*s)
            ], fill=(255, 220, 40, 255))
            
    return downsample(img, (w, h))

# ==========================================
# 2. SMILING SUN COIN
# ==========================================
def draw_sun_coin(w=160, h=160, angle=0):
    img, d, s = create_supersampled(w, h, scale=4)
    cx = (w * s) / 2
    cy = (h * s) / 2
    r_core = 36 * s
    
    # Rays
    ray_count = 10
    ray_len = 22 * s
    ray_w = 11 * s
    
    gold_outline = (210, 120, 10, 255)
    gold_fill = (255, 205, 30, 255)
    gold_hi = (255, 240, 90, 255)
    face_color = (70, 30, 5, 255)
    blush_color = (255, 140, 100, 180)
    
    # Draw rays with angle
    for i in range(ray_count):
        theta = math.radians(angle + (i * 360 / ray_count))
        # ray base
        bx = cx + math.cos(theta) * r_core
        by = cy + math.sin(theta) * r_core
        # ray tip
        tx = cx + math.cos(theta) * (r_core + ray_len)
        ty = cy + math.sin(theta) * (r_core + ray_len)
        # normal
        nx = -math.sin(theta) * (ray_w / 2)
        ny = math.cos(theta) * (ray_w / 2)
        
        # Outline ray
        d.polygon([
            (bx - nx * 1.3, by - ny * 1.3),
            (bx + nx * 1.3, by + ny * 1.3),
            (tx + nx * 0.4, ty + ny * 0.4),
            (tx, ty + (2*s if ty > cy else -2*s)),
            (tx - nx * 0.4, ty - ny * 0.4)
        ], fill=gold_outline)
        
        # Inner ray
        d.polygon([
            (bx - nx, by - ny),
            (bx + nx, by + ny),
            (tx + nx * 0.2, ty + ny * 0.2),
            (tx - nx * 0.2, ty - ny * 0.2)
        ], fill=gold_fill)
    
    # Center circle outline
    d.ellipse([cx - r_core - 4*s, cy - r_core - 4*s, cx + r_core + 4*s, cy + r_core + 4*s], fill=gold_outline)
    # Center circle body
    d.ellipse([cx - r_core, cy - r_core, cx + r_core, cy + r_core], fill=gold_fill)
    # Highlight crescent
    d.ellipse([cx - r_core + 3*s, cy - r_core + 2*s, cx + r_core - 6*s, cy + r_core * 0.4], fill=gold_hi)
    
    # Cute Anime Face!
    eye_dx = 13 * s
    eye_y = cy - 4 * s
    eye_r = 4.5 * s
    # Eyes
    d.ellipse([cx - eye_dx - eye_r, eye_y - eye_r, cx - eye_dx + eye_r, eye_y + eye_r], fill=face_color)
    d.ellipse([cx + eye_dx - eye_r, eye_y - eye_r, cx + eye_dx + eye_r, eye_y + eye_r], fill=face_color)
    # Eye highlights
    d.ellipse([cx - eye_dx - eye_r/2, eye_y - eye_r/2, cx - eye_dx + eye_r/4, eye_y + eye_r/4], fill=(255, 255, 255, 255))
    d.ellipse([cx + eye_dx - eye_r/2, eye_y - eye_r/2, cx + eye_dx + eye_r/4, eye_y + eye_r/4], fill=(255, 255, 255, 255))
    
    # Cheerful Smile
    smile_y = cy + 4 * s
    d.arc([cx - 14*s, smile_y - 8*s, cx + 14*s, smile_y + 12*s], start=10, end=170, fill=face_color, width=int(3*s))
    
    # Cheeks Blush
    d.ellipse([cx - 20*s, cy + 2*s, cx - 10*s, cy + 10*s], fill=blush_color)
    d.ellipse([cx + 10*s, cy + 2*s, cx + 20*s, cy + 10*s], fill=blush_color)
    
    return downsample(img, (w, h))

# ==========================================
# 3. OBSTACLES
# ==========================================
def draw_obstacle_hurdle(w=240, h=160):
    """Low barrier hurdle - JUMP OVER with blue chevron pointing UP"""
    img, d, s = create_supersampled(w, h, scale=3)
    cx = (w * s) / 2
    
    wood_dark = (110, 65, 30, 255)
    wood_light = (185, 135, 75, 255)
    wood_grain = (160, 110, 55, 255)
    blue_chevron = (20, 140, 220, 255)
    blue_border = (240, 245, 255, 255)
    
    # Ground shadow
    d.ellipse([cx - 95*s, (h*s)*0.92, cx + 95*s, (h*s)*0.98], fill=(0, 0, 0, 80))
    
    # Two vertical posts
    for px in [cx - 85*s, cx + 65*s]:
        d.rectangle([px, 40*s, px + 20*s, (h*s)*0.94], fill=wood_dark)
        d.rectangle([px + 3*s, 40*s, px + 17*s, (h*s)*0.94], fill=wood_light)
        # Cap
        d.rectangle([px - 2*s, 36*s, px + 22*s, 42*s], fill=wood_grain)
        
    # Main Crossbar board
    bx0, by0, bx1, by1 = cx - 100*s, 45*s, cx + 100*s, 105*s
    d.rectangle([bx0, by0, bx1, by1], fill=wood_dark)
    d.rectangle([bx0 + 3*s, by0 + 3*s, bx1 - 3*s, by1 - 3*s], fill=wood_light)
    # Grain lines
    d.line([bx0 + 6*s, by0 + 20*s, bx1 - 6*s, by0 + 20*s], fill=wood_grain, width=int(2*s))
    d.line([bx0 + 6*s, by0 + 40*s, bx1 - 6*s, by0 + 40*s], fill=wood_grain, width=int(2*s))
    
    # Triangular chevrons pointing UP (JUMP!)
    for off in [-45*s, 0, 45*s]:
        tx = cx + off
        ty = (by0 + by1) / 2
        # White backing border
        d.polygon([(tx, ty - 18*s), (tx + 18*s, ty + 15*s), (tx - 18*s, ty + 15*s)], fill=blue_border)
        # Blue triangle
        d.polygon([(tx, ty - 14*s), (tx + 14*s, ty + 12*s), (tx - 14*s, ty + 12*s)], fill=blue_chevron)
        
    return downsample(img, (w, h))

def draw_obstacle_barrier(w=240, h=280):
    """High barrier on legs - SLIDE UNDER with red triangles pointing DOWN"""
    img, d, s = create_supersampled(w, h, scale=3)
    cx = (w * s) / 2
    
    wood_dark = (100, 60, 25, 255)
    wood_board = (195, 175, 130, 255)
    wood_board_hi = (220, 205, 165, 255)
    red_chevron = (210, 40, 40, 255)
    white_border = (250, 250, 250, 255)
    
    # Tall legs with clearance underneath
    leg_w = 20 * s
    for px in [cx - 75*s, cx + 55*s]:
        d.rectangle([px, 30*s, px + leg_w, (h*s)*0.95], fill=wood_dark)
        d.rectangle([px + 3*s, 30*s, px + leg_w - 3*s, (h*s)*0.95], fill=(130, 85, 45, 255))
        
    # Large overhead wooden notice board (high up)
    bx0, by0, bx1, by1 = cx - 95*s, 20*s, cx + 95*s, 160*s
    d.rectangle([bx0, by0, bx1, by1], fill=wood_dark)
    d.rectangle([bx0 + 4*s, by0 + 4*s, bx1 - 4*s, by1 - 4*s], fill=wood_board)
    d.rectangle([bx0 + 7*s, by0 + 7*s, bx1 - 7*s, by0 + 18*s], fill=wood_board_hi)
    
    # Two large red triangles pointing DOWN (SLIDE!)
    for ty in [60*s, 115*s]:
        # White border
        d.polygon([(cx - 36*s, ty - 16*s), (cx + 36*s, ty - 16*s), (cx, ty + 22*s)], fill=white_border)
        # Red fill
        d.polygon([(cx - 30*s, ty - 13*s), (cx + 30*s, ty - 13*s), (cx, ty + 18*s)], fill=red_chevron)
        
    return downsample(img, (w, h))

def draw_obstacle_rock(w=200, h=180):
    """Mossy stone boulder"""
    img, d, s = create_supersampled(w, h, scale=3)
    cx = (w * s) / 2
    cy = (h * s) * 0.55
    
    # Ground shadow
    d.ellipse([cx - 75*s, cy + 50*s, cx + 75*s, cy + 75*s], fill=(0, 0, 0, 90))
    
    rock_dark = (50, 58, 62, 255)
    rock_mid = (85, 98, 102, 255)
    rock_light = (130, 145, 148, 255)
    moss_green = (75, 125, 45, 255)
    
    # Boulder facet polygons
    pts_main = [
        (cx - 70*s, cy + 55*s),
        (cx - 80*s, cy + 10*s),
        (cx - 45*s, cy - 50*s),
        (cx + 15*s, cy - 65*s),
        (cx + 65*s, cy - 25*s),
        (cx + 75*s, cy + 45*s),
        (cx + 30*s, cy + 65*s),
        (cx - 30*s, cy + 68*s)
    ]
    d.polygon(pts_main, fill=rock_mid)
    
    # Top highlight facets
    d.polygon([
        (cx - 45*s, cy - 50*s),
        (cx + 15*s, cy - 65*s),
        (cx + 35*s, cy - 15*s),
        (cx - 10*s, cy - 5*s)
    ], fill=rock_light)
    
    # Right shaded facets
    d.polygon([
        (cx + 15*s, cy - 65*s),
        (cx + 65*s, cy - 25*s),
        (cx + 75*s, cy + 45*s),
        (cx + 25*s, cy + 20*s),
        (cx + 35*s, cy - 15*s)
    ], fill=rock_dark)
    
    # Moss accents on top crevices
    d.ellipse([cx - 40*s, cy - 55*s, cx + 5*s, cy - 35*s], fill=moss_green)
    d.ellipse([cx - 5*s, cy - 68*s, cx + 35*s, cy - 45*s], fill=moss_green)
    
    # Cracks
    d.line([(cx - 10*s, cy - 5*s), (cx + 5*s, cy + 25*s), (cx - 15*s, cy + 55*s)], fill=(30, 35, 38, 255), width=int(3*s))
    
    return downsample(img, (w, h))

def draw_obstacle_truck(w=260, h=300):
    """Logging truck / train cabin (red cab, silver grill, headlights)"""
    img, d, s = create_supersampled(w, h, scale=3)
    cx = (w * s) / 2
    
    # Shadow
    d.ellipse([cx - 110*s, 240*s, cx + 110*s, 285*s], fill=(0, 0, 0, 95))
    
    cab_red = (185, 45, 45, 255)
    cab_red_dark = (130, 25, 25, 255)
    cab_red_hi = (225, 75, 75, 255)
    glass_color = (60, 110, 150, 255)
    glass_hi = (140, 195, 235, 255)
    grill_color = (210, 215, 220, 255)
    grill_dark = (40, 45, 50, 255)
    yellow_light = (255, 230, 80, 255)
    
    # Cab main body
    bx0, by0, bx1, by1 = cx - 95*s, 40*s, cx + 95*s, 250*s
    d.rectangle([bx0, by0, bx1, by1], fill=cab_red)
    # Shading on sides
    d.rectangle([bx0, by0, bx0 + 18*s, by1], fill=cab_red_dark)
    d.rectangle([bx1 - 18*s, by0, bx1, by1], fill=cab_red_dark)
    # Top roof highlight
    d.rectangle([bx0 + 18*s, by0, bx1 - 18*s, by0 + 12*s], fill=cab_red_hi)
    
    # Windshield / Front Window
    wx0, wy0, wx1, wy1 = cx - 72*s, 65*s, cx + 72*s, 150*s
    d.rectangle([wx0, wy0, wx1, wy1], fill=glass_color)
    d.rectangle([wx0 + 3*s, wy0 + 3*s, wx1 - 3*s, wy0 + 18*s], fill=glass_hi)
    
    # Center grill
    gx0, gy0, gx1, gy1 = cx - 38*s, 170*s, cx + 38*s, 245*s
    d.rectangle([gx0 - 4*s, gy0 - 4*s, gx1 + 4*s, gy1 + 4*s], fill=grill_color)
    d.rectangle([gx0, gy0, gx1, gy1], fill=grill_dark)
    for lx in range(int(gx0 + 10*s), int(gx1), int(14*s)):
        d.line([(lx, gy0 + 4*s), (lx, gy1 - 4*s)], fill=grill_color, width=int(5*s))
        
    # Headlights
    for lx in [cx - 68*s, cx + 68*s]:
        d.ellipse([lx - 16*s, 190*s, lx + 16*s, 222*s], fill=grill_color)
        d.ellipse([lx - 12*s, 194*s, lx + 12*s, 218*s], fill=yellow_light)
        d.ellipse([lx - 6*s, 198*s, lx + 2*s, 206*s], fill=(255, 255, 255, 255))
        
    return downsample(img, (w, h))

def draw_train_wagon_with_logs(w=260, h=280):
    """Lumber train car stacked with large cylindrical logs"""
    img, d, s = create_supersampled(w, h, scale=3)
    cx = (w * s) / 2
    
    # Shadow
    d.ellipse([cx - 110*s, 230*s, cx + 110*s, 275*s], fill=(0, 0, 0, 95))
    
    bark_color = (95, 60, 35, 255)
    bark_dark = (60, 38, 20, 255)
    wood_cut = (185, 140, 85, 255)
    wood_ring = (140, 100, 55, 255)
    strap_iron = (55, 55, 60, 255)
    
    # Cart base
    d.rectangle([cx - 100*s, 200*s, cx + 100*s, 240*s], fill=(70, 75, 80, 255))
    d.rectangle([cx - 96*s, 204*s, cx + 96*s, 215*s], fill=(110, 115, 120, 255))
    
    # Stacked logs (3 logs in pyramid: 2 bottom, 1 top)
    log_r = 38 * s
    log_positions = [
        (cx - 45*s, 175*s),
        (cx + 45*s, 175*s),
        (cx, 105*s)
    ]
    
    for lx, ly in log_positions:
        # Log outer bark cylinder
        d.ellipse([lx - log_r - 3*s, ly - log_r - 3*s, lx + log_r + 3*s, ly + log_r + 3*s], fill=bark_dark)
        d.ellipse([lx - log_r, ly - log_r, lx + log_r, ly + log_r], fill=wood_cut)
        # Tree rings
        for r_step in [26*s, 16*s, 7*s]:
            d.ellipse([lx - r_step, ly - r_step, lx + r_step, ly + r_step], outline=wood_ring, width=int(3*s))
            
    # Metal retaining straps holding logs
    d.arc([cx - 95*s, 60*s, cx + 95*s, 230*s], start=190, end=350, fill=strap_iron, width=int(8*s))
    
    return downsample(img, (w, h))

def draw_obstacle_ramp(w=220, h=200):
    """Inclined ramp with teal/green arrow allowing jumping onto train/bridge"""
    img, d, s = create_supersampled(w, h, scale=3)
    cx = (w * s) / 2
    
    # Ramp 3D wedge
    wood_top = (175, 140, 95, 255)
    wood_top_hi = (210, 175, 130, 255)
    wood_side = (105, 75, 45, 255)
    arrow_teal = (25, 185, 165, 255)
    arrow_white = (255, 255, 255, 255)
    
    # Ramp wedge polygon
    # Bottom wide front: (cx - 85*s, 175*s) to (cx + 85*s, 175*s)
    # Top narrow rear: (cx - 55*s, 45*s) to (cx + 55*s, 45*s)
    d.polygon([
        (cx - 85*s, 175*s),
        (cx + 85*s, 175*s),
        (cx + 55*s, 45*s),
        (cx - 55*s, 45*s)
    ], fill=wood_top)
    
    # Shading stripe
    d.polygon([
        (cx - 85*s, 175*s),
        (cx - 65*s, 175*s),
        (cx - 40*s, 45*s),
        (cx - 55*s, 45*s)
    ], fill=wood_top_hi)
    
    # Planks lines
    for py in range(int(55*s), int(170*s), int(25*s)):
        t = (py - 45*s) / (130*s)
        x0 = (cx - 55*s) + (-30*s) * t
        x1 = (cx + 55*s) + (30*s) * t
        d.line([(x0, py), (x1, py)], fill=wood_side, width=int(3*s))
        
    # Large teal arrow pointing forward
    ay = 105 * s
    d.polygon([(cx, ay - 35*s), (cx + 38*s, ay + 20*s), (cx - 38*s, ay + 20*s)], fill=arrow_white)
    d.polygon([(cx, ay - 28*s), (cx + 30*s, ay + 15*s), (cx - 30*s, ay + 15*s)], fill=arrow_teal)
    
    return downsample(img, (w, h))

def draw_obstacle_crates(w=200, h=220):
    """Purple / wooden stacked crates"""
    img, d, s = create_supersampled(w, h, scale=3)
    cx = (w * s) / 2
    
    # Shadow
    d.ellipse([cx - 80*s, 185*s, cx + 80*s, 215*s], fill=(0, 0, 0, 80))
    
    crate_purple = (155, 95, 175, 255)
    crate_light = (195, 135, 215, 255)
    crate_dark = (115, 65, 135, 255)
    slat_wood = (225, 185, 135, 255)
    
    def draw_box(bx, by, bw, bh):
        d.rectangle([bx, by, bx + bw, by + bh], fill=crate_purple)
        d.rectangle([bx + 4*s, by + 4*s, bx + bw - 4*s, by + bh - 4*s], outline=crate_dark, width=int(4*s))
        # Diagonal braces
        d.line([(bx + 4*s, by + 4*s), (bx + bw - 4*s, by + bh - 4*s)], fill=slat_wood, width=int(6*s))
        d.line([(bx + bw - 4*s, by + 4*s), (bx + 4*s, by + bh - 4*s)], fill=slat_wood, width=int(6*s))
        # Edge highlights
        d.line([(bx, by), (bx + bw, by)], fill=crate_light, width=int(4*s))
        d.line([(bx, by), (bx, by + bh)], fill=crate_light, width=int(4*s))
        
    # Stack: 2 crates (one on bottom, one slightly offset on top)
    draw_box(cx - 70*s, 100*s, 140*s, 95*s)
    draw_box(cx - 60*s, 20*s, 120*s, 85*s)
    
    return downsample(img, (w, h))

# ==========================================
# 4. ENVIRONMENT ELEMENTS
# ==========================================
def draw_floating_log(w=300, h=120):
    """River log floating in water"""
    img, d, s = create_supersampled(w, h, scale=3)
    cx = (w * s) / 2
    cy = (h * s) / 2
    
    # Water ripples around log
    water_glow = (120, 220, 240, 140)
    d.ellipse([cx - 135*s, cy - 25*s, cx + 135*s, cy + 45*s], outline=water_glow, width=int(4*s))
    
    bark_color = (115, 75, 45, 255)
    bark_dark = (75, 45, 25, 255)
    bark_hi = (155, 105, 65, 255)
    wood_cut = (195, 150, 95, 255)
    wood_ring = (150, 110, 65, 255)
    
    # Log body (cylinder)
    lx0, ly0, lx1, ly1 = cx - 120*s, cy - 28*s, cx + 80*s, cy + 28*s
    d.rectangle([lx0, ly0, lx1, ly1], fill=bark_color)
    d.rectangle([lx0, ly0, lx1, ly0 + 12*s], fill=bark_hi)
    d.rectangle([lx0, ly1 - 14*s, lx1, ly1], fill=bark_dark)
    
    # Cut end face (right oval)
    d.ellipse([lx1 - 25*s, ly0, lx1 + 25*s, ly1], fill=wood_cut)
    d.ellipse([lx1 - 15*s, ly0 + 8*s, lx1 + 15*s, ly1 - 8*s], outline=wood_ring, width=int(3*s))
    d.ellipse([lx1 - 7*s, ly0 + 18*s, lx1 + 7*s, ly1 - 18*s], outline=wood_ring, width=int(2*s))
    
    return downsample(img, (w, h))

def draw_bridge_planks(w=360, h=180):
    """Suspension bridge plank section with rope rails"""
    img, d, s = create_supersampled(w, h, scale=3)
    cx = (w * s) / 2
    cy = (h * s) / 2
    
    wood_plank = (145, 125, 105, 255)
    wood_plank_dark = (95, 80, 65, 255)
    rope_color = (210, 185, 140, 255)
    
    # Horizontal planks
    for py in range(int(20*s), int((h*s) - 20*s), int(22*s)):
        d.rectangle([cx - 150*s, py, cx + 150*s, py + 16*s], fill=wood_plank)
        d.line([(cx - 150*s, py + 16*s), (cx + 150*s, py + 16*s)], fill=wood_plank_dark, width=int(3*s))
        
    # Side ropes
    d.line([(cx - 145*s, 0), (cx - 145*s, h*s)], fill=rope_color, width=int(8*s))
    d.line([(cx + 145*s, 0), (cx + 145*s, h*s)], fill=rope_color, width=int(8*s))
    
    return downsample(img, (w, h))

def draw_redwood_tree(w=200, h=400):
    """Giant forest tree"""
    img, d, s = create_supersampled(w, h, scale=2)
    cx = (w * s) / 2
    
    bark_color = (105, 55, 30, 255)
    bark_dark = (65, 30, 15, 255)
    leaf_dark = (35, 95, 45, 255)
    leaf_mid = (55, 135, 60, 255)
    leaf_light = (85, 175, 85, 255)
    
    # Huge trunk
    d.polygon([(cx - 35*s, h*s), (cx + 35*s, h*s), (cx + 22*s, 100*s), (cx - 22*s, 100*s)], fill=bark_color)
    d.polygon([(cx - 35*s, h*s), (cx - 18*s, h*s), (cx - 10*s, 100*s), (cx - 22*s, 100*s)], fill=bark_dark)
    
    # Foliage clumps
    for cy, r, col in [(150*s, 70*s, leaf_dark), (100*s, 65*s, leaf_mid), (55*s, 55*s, leaf_light)]:
        d.ellipse([cx - r, cy - r*0.7, cx + r, cy + r*0.7], fill=col)
        d.ellipse([cx - r*0.8, cy - r*0.4, cx + r*0.2, cy + r*0.8], fill=col)
        
    return downsample(img, (w, h))

def draw_mushroom(w=120, h=120):
    """Red spotted fairy toadstool"""
    img, d, s = create_supersampled(w, h, scale=4)
    cx = (w * s) / 2
    cy = (h * s) / 2
    
    # Stem
    d.rectangle([cx - 12*s, cy + 5*s, cx + 12*s, cy + 42*s], fill=(240, 235, 220, 255))
    d.ellipse([cx - 14*s, cy + 35*s, cx + 14*s, cy + 45*s], fill=(225, 215, 195, 255))
    
    # Cap (bright red)
    cap_top = cy - 35*s
    cap_bot = cy + 12*s
    d.chord([cx - 42*s, cap_top, cx + 42*s, cap_bot + 20*s], 180, 360, fill=(230, 45, 45, 255))
    d.ellipse([cx - 42*s, cap_bot - 8*s, cx + 42*s, cap_bot + 8*s], fill=(245, 240, 230, 255))
    
    # White dots
    dots = [(cx, cy - 20*s, 7*s), (cx - 22*s, cy - 10*s, 6*s), (cx + 22*s, cy - 10*s, 6*s), (cx - 10*s, cy - 2*s, 5*s), (cx + 12*s, cy - 2*s, 5*s)]
    for dx, dy, dr in dots:
        d.ellipse([dx - dr, dy - dr, dx + dr, dy + dr], fill=(255, 255, 255, 255))
        
    return downsample(img, (w, h))

# ==========================================
# 5. POWER-UP ICONS
# ==========================================
def draw_powerup_rocket(w=140, h=140):
    """Rocket / Firecracker booster icon with lightning bolt"""
    img, d, s = create_supersampled(w, h, scale=4)
    cx = (w * s) / 2
    cy = (h * s) / 2
    
    # Outer circular badge
    d.ellipse([cx - 62*s, cy - 62*s, cx + 62*s, cy + 62*s], fill=(24, 30, 50, 240), outline=(255, 210, 40, 255), width=int(6*s))
    
    # Rocket cylinder angled at 45 deg
    # Body colors: top red, bottom cyan
    r_red = (225, 45, 60, 255)
    r_blue = (25, 150, 240, 255)
    
    # Rocket body
    d.polygon([(cx - 22*s, cy + 28*s), (cx - 8*s, cy - 32*s), (cx + 18*s, cy - 26*s), (cx + 4*s, cy + 34*s)], fill=r_blue)
    d.polygon([(cx - 14*s, cy - 6*s), (cx - 8*s, cy - 32*s), (cx + 18*s, cy - 26*s), (cx + 12*s, cy - 2*s)], fill=r_red)
    
    # Nosecone
    d.polygon([(cx - 8*s, cy - 32*s), (cx + 5*s, cy - 48*s), (cx + 18*s, cy - 26*s)], fill=(255, 200, 30, 255))
    
    # Gold Lightning Bolt overlay
    d.polygon([
        (cx - 2*s, cy - 22*s),
        (cx + 16*s, cy - 22*s),
        (cx + 4*s, cy - 2*s),
        (cx + 18*s, cy - 2*s),
        (cx - 12*s, cy + 30*s),
        (cx - 4*s, cy + 6*s),
        (cx - 16*s, cy + 6*s)
    ], fill=(255, 235, 40, 255), outline=(220, 120, 10, 255))
    
    return downsample(img, (w, h))

def draw_powerup_2x(w=140, h=140):
    """Bold golden 'x2' multiplier icon"""
    img, d, s = create_supersampled(w, h, scale=4)
    cx = (w * s) / 2
    cy = (h * s) / 2
    
    d.ellipse([cx - 62*s, cy - 62*s, cx + 62*s, cy + 62*s], fill=(80, 25, 90, 240), outline=(255, 215, 50, 255), width=int(6*s))
    
    # Stylized 'X'
    xw = 12 * s
    d.polygon([(cx - 45*s, cy - 28*s), (cx - 30*s, cy - 28*s), (cx - 10*s, cy + 28*s), (cx - 25*s, cy + 28*s)], fill=(255, 220, 40, 255))
    d.polygon([(cx - 10*s, cy - 28*s), (cx - 25*s, cy - 28*s), (cx - 45*s, cy + 28*s), (cx - 30*s, cy + 28*s)], fill=(255, 200, 30, 255))
    
    # Stylized '2'
    pts_2 = [
        (cx + 2*s, cy - 24*s),
        (cx + 28*s, cy - 28*s),
        (cx + 42*s, cy - 12*s),
        (cx + 38*s, cy + 6*s),
        (cx + 4*s, cy + 20*s),
        (cx + 44*s, cy + 20*s),
        (cx + 44*s, cy + 32*s),
        (cx - 2*s, cy + 32*s),
        (cx - 2*s, cy + 18*s),
        (cx + 22*s, cy + 4*s),
        (cx + 24*s, cy - 14*s),
        (cx + 8*s, cy - 14*s)
    ]
    d.polygon(pts_2, fill=(255, 235, 60, 255), outline=(190, 110, 10, 255))
    
    return downsample(img, (w, h))

def draw_powerup_magnet(w=140, h=140):
    """Horseshoe Magnet icon"""
    img, d, s = create_supersampled(w, h, scale=4)
    cx = (w * s) / 2
    cy = (h * s) / 2
    
    d.ellipse([cx - 62*s, cy - 62*s, cx + 62*s, cy + 62*s], fill=(20, 45, 65, 240), outline=(255, 215, 50, 255), width=int(6*s))
    
    mag_r = 38 * s
    mag_w = 16 * s
    # Red horseshoe curve
    d.arc([cx - mag_r, cy - 20*s, cx + mag_r, cy + 40*s], start=0, end=180, fill=(225, 45, 50, 255), width=int(mag_w))
    # Vertical arms
    d.rectangle([cx - mag_r - mag_w/2, cy - 25*s, cx - mag_r + mag_w/2, cy + 10*s], fill=(225, 45, 50, 255))
    d.rectangle([cx + mag_r - mag_w/2, cy - 25*s, cx + mag_r + mag_w/2, cy + 10*s], fill=(225, 45, 50, 255))
    # Silver tips
    d.rectangle([cx - mag_r - mag_w/2, cy - 35*s, cx - mag_r + mag_w/2, cy - 20*s], fill=(220, 225, 230, 255))
    d.rectangle([cx + mag_r - mag_w/2, cy - 35*s, cx + mag_r + mag_w/2, cy - 20*s], fill=(220, 225, 230, 255))
    
    return downsample(img, (w, h))

# ==========================================
# 6. UI BUTTONS & BADGES
# ==========================================
def draw_ui_pause(w=128, h=128):
    img, d, s = create_supersampled(w, h, scale=3)
    cx, cy = (w * s) / 2, (h * s) / 2
    r = 54 * s
    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(20, 180, 215, 255), outline=(255, 255, 255, 220), width=int(6*s))
    # Inner glow ring
    d.ellipse([cx - r + 8*s, cy - r + 8*s, cx + r - 8*s, cy + r - 8*s], outline=(60, 215, 245, 255), width=int(3*s))
    # Pause bars
    pw, ph = 12 * s, 38 * s
    d.rectangle([cx - 18*s - pw/2, cy - ph/2, cx - 18*s + pw/2, cy + ph/2], fill=(255, 255, 255, 255))
    d.rectangle([cx + 18*s - pw/2, cy - ph/2, cx + 18*s + pw/2, cy + ph/2], fill=(255, 255, 255, 255))
    return downsample(img, (w, h))

def draw_ui_play(w=128, h=128):
    img, d, s = create_supersampled(w, h, scale=3)
    cx, cy = (w * s) / 2, (h * s) / 2
    r = 54 * s
    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(40, 205, 95, 255), outline=(255, 255, 255, 220), width=int(6*s))
    # Triangle play
    d.polygon([(cx - 14*s, cy - 26*s), (cx + 26*s, cy), (cx - 14*s, cy + 26*s)], fill=(255, 255, 255, 255))
    return downsample(img, (w, h))

def draw_ui_restart(w=128, h=128):
    img, d, s = create_supersampled(w, h, scale=3)
    cx, cy = (w * s) / 2, (h * s) / 2
    r = 54 * s
    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(245, 140, 25, 255), outline=(255, 255, 255, 220), width=int(6*s))
    # Circular reload arrow
    d.arc([cx - 28*s, cy - 28*s, cx + 28*s, cy + 28*s], start=45, end=320, fill=(255, 255, 255, 255), width=int(8*s))
    # Arrowhead
    d.polygon([(cx + 12*s, cy - 35*s), (cx + 34*s, cy - 22*s), (cx + 16*s, cy - 12*s)], fill=(255, 255, 255, 255))
    return downsample(img, (w, h))

# ==========================================
# 7. GENERATE AND SAVE ALL ASSETS
# ==========================================
print('Generating player sprites...')
draw_ninja(256, 320, 'run0').save('images/player_run_0.png')
draw_ninja(256, 320, 'run1').save('images/player_run_1.png')
draw_ninja(256, 320, 'run2').save('images/player_run_2.png')
draw_ninja(256, 320, 'run3').save('images/player_run_3.png')
draw_ninja(256, 320, 'jump').save('images/player_jump.png')
draw_ninja(256, 320, 'slide').save('images/player_slide.png')
draw_ninja(256, 320, 'crash').save('images/player_crash.png')

print('Generating smiling sun coins...')
draw_sun_coin(160, 160, 0).save('images/coin_sun_0.png')
draw_sun_coin(160, 160, 45).save('images/coin_sun_1.png')
draw_sun_coin(160, 160, 90).save('images/coin_sun_2.png')
draw_sun_coin(160, 160, 135).save('images/coin_sun_3.png')
draw_sun_coin(160, 160, 0).save('images/ui_sun_badge.png')

print('Generating obstacle sprites...')
draw_obstacle_hurdle(240, 160).save('images/obstacle_hurdle.png')
draw_obstacle_barrier(240, 280).save('images/obstacle_barrier.png')
draw_obstacle_rock(200, 180).save('images/obstacle_rock.png')
draw_obstacle_truck(260, 300).save('images/obstacle_truck.png')
draw_train_wagon_with_logs(260, 280).save('images/obstacle_train_wagon.png')
draw_obstacle_ramp(220, 200).save('images/obstacle_ramp.png')
draw_obstacle_crates(200, 220).save('images/obstacle_crates.png')

print('Generating environment sprites...')
draw_floating_log(300, 120).save('images/env_floating_log.png')
draw_bridge_planks(360, 180).save('images/env_bridge_planks.png')
draw_redwood_tree(200, 400).save('images/env_tree_redwood.png')
draw_mushroom(120, 120).save('images/env_mushroom.png')

print('Generating powerups...')
draw_powerup_rocket(140, 140).save('images/powerup_rocket.png')
draw_powerup_2x(140, 140).save('images/powerup_2x.png')
draw_powerup_magnet(140, 140).save('images/powerup_magnet.png')

print('Generating UI controls...')
draw_ui_pause(128, 128).save('images/ui_pause.png')
draw_ui_play(128, 128).save('images/ui_play.png')
draw_ui_restart(128, 128).save('images/ui_restart.png')

print('Generating app icons...')
icon_master = draw_ninja(512, 512, 'run1')
for size in [16, 32, 64, 128, 256, 512]:
    icon_master.resize((size, size), Image.Resampling.LANCZOS).save(f'icons/icon-{size}.png')
icon_master.save('icons/loading-logo.png')

print('All assets generated successfully!')

