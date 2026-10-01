import os
import math
from PIL import Image, ImageDraw, ImageFilter, ImageFont

def make_ball():
    size = 128
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Outer circle & 3D gradient
    r = 56
    cx, cy = size // 2, size // 2
    
    # Subtle drop shadow below
    for i in range(12):
        alpha = int(120 * (1 - i / 12))
        draw.ellipse([cx - r + i, cy - r + i + 8, cx + r - i, cy + r - i + 8], fill=(10, 20, 30, alpha // 4))
        
    # Main ball circle
    for rad in range(r, 0, -1):
        # Light coming from top-left (offset center)
        ratio = (r - rad) / r
        lx = int(cx - 16 * ratio)
        ly = int(cy - 16 * ratio)
        # Gradient from pure white to soft cool gray
        val = int(220 + 35 * ratio)
        b_val = int(225 + 30 * ratio)
        draw.ellipse([lx - rad, ly - rad, lx + rad, ly + rad], fill=(val, val, b_val, 255))
        
    # Golf ball dimples (subtle small circular impressions)
    dimple_draw = ImageDraw.Draw(img)
    dimple_coords = [
        (-25, -20), (0, -32), (25, -22),
        (-35, 0), (-12, -10), (14, -12), (36, -2),
        (-26, 18), (0, 10), (24, 16),
        (-14, 30), (12, 32), (0, -2)
    ]
    for dx, dy in dimple_coords:
        px, py = cx + dx, cy + dy
        # Shadow arc
        dimple_draw.ellipse([px - 4, py - 4, px + 4, py + 4], fill=(185, 195, 205, 160))
        # Highlight rim
        dimple_draw.ellipse([px - 4, py - 4, px + 2, py + 2], fill=(245, 250, 255, 180))
        
    # Crisp ball outline
    draw.ellipse([cx - r, cy - r, cx + r, cy + r], outline=(70, 90, 110, 200), width=3)
    # Bright specular highlight
    draw.ellipse([cx - 28, cy - 28, cx - 12, cy - 12], fill=(255, 255, 255, 220))
    
    img.save('images/ball.png')
    print('Created images/ball.png')

def make_club():
    w, h = 180, 480
    img = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Club dimensions:
    # Grip at top (h: 30 to 180)
    # Steel shaft (h: 180 to 410)
    # Club head at bottom (h: 410 to 470, w: 20 to 140)
    
    # Shaft (sleek chrome steel tube)
    shaft_top_x = 90
    shaft_bot_x = 70
    draw.polygon([(86, 170), (94, 170), (74, 420), (66, 420)], fill=(210, 220, 230, 255))
    draw.polygon([(88, 170), (92, 170), (72, 420), (68, 420)], fill=(245, 250, 255, 255)) # highlight
    draw.polygon([(86, 170), (88, 170), (68, 420), (66, 420)], fill=(120, 135, 150, 255)) # shadow edge
    
    # Grip (red textured rubber with orange trim)
    # Grip body
    draw.polygon([(83, 30), (97, 30), (95, 175), (85, 175)], fill=(215, 45, 30, 255))
    # Grip gold/orange rim
    draw.polygon([(83, 30), (97, 30), (97, 36), (83, 36)], fill=(240, 160, 20, 255))
    draw.polygon([(84, 170), (96, 170), (95, 175), (85, 175)], fill=(240, 160, 20, 255))
    # White grip dots
    for y in range(48, 165, 14):
        draw.ellipse([88, y, 92, y + 4], fill=(255, 255, 255, 230))
        
    # Hosel / neck connection
    draw.polygon([(65, 415), (75, 415), (65, 445), (55, 440)], fill=(40, 50, 60, 255))
    
    # Iron / putter head
    # Outer dark contour
    head_points = [
        (55, 440), (45, 450), (25, 455), (15, 445), 
        (20, 430), (55, 420), (120, 415), (145, 430),
        (150, 445), (135, 460), (90, 465), (55, 440)
    ]
    draw.polygon(head_points, fill=(25, 35, 45, 255))
    # Inner face metal gradient
    face_points = [
        (50, 440), (25, 445), (30, 435), 
        (60, 427), (115, 422), (138, 434), 
        (130, 450), (85, 455), (50, 440)
    ]
    draw.polygon(face_points, fill=(195, 215, 230, 255))
    # Grooves on club face
    for offset_y in [-6, -2, 2, 6, 10]:
        draw.arc([40, 430 + offset_y, 125, 455 + offset_y], start=10, end=170, fill=(70, 95, 120, 255), width=2)
        
    img.save('images/club.png')
    print('Created images/club.png')

def make_flag():
    w, h = 120, 200
    img = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Flagpole (white rod with subtle shadow)
    pole_x = 75
    draw.rectangle([pole_x - 3, 20, pole_x + 3, 190], fill=(245, 245, 250, 255))
    draw.rectangle([pole_x - 3, 20, pole_x - 1, 190], fill=(210, 215, 220, 255))
    # Top golden ball cap
    draw.ellipse([pole_x - 6, 14, pole_x + 6, 26], fill=(255, 200, 40, 255))
    
    # Red triangular flag
    # Triangular flag pointing left (towards the green)
    flag_pts = [(pole_x, 22), (pole_x - 62, 52), (pole_x, 82)]
    draw.polygon(flag_pts, fill=(225, 35, 25, 255))
    # Flag 3D wave shading
    draw.polygon([(pole_x - 30, 37), (pole_x - 62, 52), (pole_x - 30, 67)], fill=(185, 20, 15, 255))
    draw.polygon([(pole_x, 22), (pole_x - 30, 37), (pole_x - 30, 67), (pole_x, 82)], fill=(240, 50, 35, 255))
    # Flag attachment grommets
    draw.ellipse([pole_x - 2, 24, pole_x + 2, 28], fill=(180, 190, 200, 255))
    draw.ellipse([pole_x - 2, 76, pole_x + 2, 80], fill=(180, 190, 200, 255))
    
    img.save('images/flag.png')
    print('Created images/flag.png')

def make_hole():
    w, h = 140, 90
    img = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Dark hole cup (U-shape / rounded rect)
    # The cup drops below the platform
    # Dark slate navy interior
    cup_pts = [
        (25, 0), (115, 0),
        (115, 55), (105, 80), (35, 80), (25, 55)
    ]
    draw.polygon(cup_pts, fill=(15, 28, 40, 255))
    # Shadow gradient inside
    draw.ellipse([25, 45, 115, 85], fill=(8, 16, 24, 255))
    # Hole rim green highlights (where the grass meets the cup)
    draw.rectangle([18, 0, 28, 14], fill=(145, 220, 50, 255))
    draw.rectangle([112, 0, 122, 14], fill=(145, 220, 50, 255))
    
    img.save('images/hole.png')
    print('Created images/hole.png')

def make_obstacle():
    # Crisp 168x164 block (2x of 84x82)
    w, h = 168, 164
    img = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Outer white/light-lime stroke
    draw.rectangle([4, 4, w - 4, h], fill=(225, 255, 180, 255))
    # Main green body
    draw.rectangle([10, 10, w - 10, h], fill=(78, 196, 16, 255))
    # Inner subtle bevel/gradient
    draw.rectangle([16, 16, w - 16, h], fill=(92, 212, 24, 255))
    draw.rectangle([22, 22, w - 22, h], fill=(82, 202, 20, 255))
    
    img.save('images/obstacle.png')
    print('Created images/obstacle.png')

def make_grass_tufts():
    w, h = 120, 80
    img = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Draw several graceful curved grass blades
    blades = [
        # (base_x, curve_ctrl_x, tip_x, tip_y, width, color)
        [(30, 80), (25, 40), (15, 15), (72, 183, 4, 255)],
        [(45, 80), (50, 35), (60, 10), (105, 215, 25, 255)],
        [(60, 80), (75, 45), (95, 25), (78, 190, 8, 255)],
        [(75, 80), (82, 55), (88, 40), (95, 205, 20, 255)],
    ]
    for b in blades:
        p0, p1, p2, col = b
        # approximate quadratic bezier
        pts_left = []
        pts_right = []
        for i in range(21):
            t = i / 20.0
            x = (1-t)**2 * p0[0] + 2*(1-t)*t * p1[0] + t**2 * p2[0]
            y = (1-t)**2 * p0[1] + 2*(1-t)*t * p1[1] + t**2 * p2[1]
            hw = 5 * (1 - t)
            pts_left.append((x - hw, y))
            pts_right.insert(0, (x + hw, y))
        draw.polygon(pts_left + pts_right, fill=col)
        
    img.save('images/grass_tuft.png')
    print('Created images/grass_tuft.png')

def make_ui_buttons():
    # Button size 168x168
    size = 168
    r = 72
    cx, cy = size // 2, size // 2
    
    # 1. Base button circle helper
    def create_btn_base():
        img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)
        # Drop shadow / bottom rim
        draw.ellipse([cx - r, cy - r + 8, cx + r, cy + r + 8], fill=(180, 225, 235, 255))
        # Main white disc
        draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(255, 255, 255, 255))
        # Subtle rim
        draw.ellipse([cx - r, cy - r, cx + r, cy + r], outline=(225, 240, 245, 255), width=3)
        return img, draw

    # 1. Home button
    img_home, draw_home = create_btn_base()
    # Orange house icon
    house_pts = [(cx, cy - 38), (cx - 36, cy - 8), (cx + 36, cy - 8)]
    draw_home.polygon(house_pts, fill=(235, 88, 12, 255))
    draw_home.rectangle([cx - 28, cy - 8, cx + 28, cy + 32], fill=(235, 88, 12, 255))
    # Window / door cutout
    draw_home.rectangle([cx - 12, cy + 4, cx + 12, cy + 28], fill=(255, 255, 255, 255))
    img_home.save('images/ui_btn_home.png')
    print('Created images/ui_btn_home.png')

    # 2. Levels button (4 dots)
    img_lvl, draw_lvl = create_btn_base()
    dot_r = 14
    for dx in [-24, 24]:
        for dy in [-24, 24]:
            draw_lvl.ellipse([cx + dx - dot_r, cy + dy - dot_r, cx + dx + dot_r, cy + dy + dot_r], fill=(235, 88, 12, 255))
    img_lvl.save('images/ui_btn_levels.png')
    print('Created images/ui_btn_levels.png')

    # 3. Restart button (circular arrow)
    img_rst, draw_rst = create_btn_base()
    # Draw arc
    draw_rst.arc([cx - 36, cy - 36, cx + 36, cy + 36], start=45, end=330, fill=(235, 88, 12, 255), width=14)
    # Draw arrow head
    arrow_pts = [(cx + 16, cy - 36), (cx + 44, cy - 14), (cx + 42, cy - 42)]
    draw_rst.polygon(arrow_pts, fill=(235, 88, 12, 255))
    img_rst.save('images/ui_btn_restart.png')
    print('Created images/ui_btn_restart.png')

def make_ui_banner():
    w, h = 600, 180
    img = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Red ribbon with swallowtails
    # Left swallowtail ribbon fold
    draw.polygon([(40, 60), (120, 60), (120, 130), (40, 130), (80, 95)], fill=(160, 30, 20, 255))
    # Right swallowtail ribbon fold
    draw.polygon([(w - 40, 60), (w - 120, 60), (w - 120, 130), (w - 40, 130), (w - 80, 95)], fill=(160, 30, 20, 255))
    
    # Cyan highlight beneath ribbon
    draw.rectangle([100, 130, w - 100, 142], fill=(130, 230, 245, 255))
    
    # Main ribbon center bar
    draw.rectangle([90, 45, w - 90, 130], fill=(225, 65, 30, 255))
    # White border around ribbon
    draw.rectangle([90, 45, w - 90, 130], outline=(255, 255, 255, 255), width=4)
    
    img.save('images/ui_banner.png')
    print('Created images/ui_banner.png')

def make_ui_hold_badge():
    w, h = 420, 140
    img = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Crossed clubs above badge
    cx = w // 2
    cy_clubs = 45
    # Club 1 (slanted right)
    draw.line([cx - 45, cy_clubs - 25, cx + 45, cy_clubs + 25], fill=(30, 35, 40, 255), width=5)
    draw.ellipse([cx + 38, cy_clubs + 18, cx + 54, cy_clubs + 30], fill=(30, 35, 40, 255))
    # Club 2 (slanted left)
    draw.line([cx + 45, cy_clubs - 25, cx - 45, cy_clubs + 25], fill=(30, 35, 40, 255), width=5)
    draw.ellipse([cx - 54, cy_clubs + 18, cx - 38, cy_clubs + 30], fill=(30, 35, 40, 255))
    
    # Black pill badge: Y from 70 to 125
    r = 27
    bx0, by0, bx1, by1 = cx - 180, 70, cx + 180, 125
    draw.rounded_rectangle([bx0, by0, bx1, by1], radius=r, fill=(22, 27, 34, 255))
    draw.rounded_rectangle([bx0, by0, bx1, by1], radius=r, outline=(50, 60, 70, 255), width=2)
    
    img.save('images/ui_hold_badge.png')
    print('Created images/ui_hold_badge.png')

def make_particles():
    # 1. Hit dust puff
    size = 96
    img_dust = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw_dust = ImageDraw.Draw(img_dust)
    cx, cy = size // 2, size // 2
    for r in range(size // 2, 0, -1):
        alpha = int(180 * (1 - r / (size // 2))**1.5)
        draw_dust.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(255, 255, 255, alpha))
    img_dust.save('images/particle_dust.png')
    print('Created images/particle_dust.png')

    # 2. Sparkle star
    img_star = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw_star = ImageDraw.Draw(img_star)
    # Center glow
    for r in range(24, 0, -1):
        alpha = int(220 * (1 - r / 24))
        draw_star.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(255, 250, 180, alpha))
    # 4-pointed diamond star
    star_pts = [
        (cx, cy - 42), (cx + 10, cy - 10), (cx + 42, cy),
        (cx + 10, cy + 10), (cx, cy + 42), (cx - 10, cy + 10),
        (cx - 42, cy), (cx - 10, cy - 10)
    ]
    draw_star.polygon(star_pts, fill=(255, 255, 255, 255))
    draw_star.ellipse([cx - 8, cy - 8, cx + 8, cy + 8], fill=(255, 230, 80, 255))
    img_star.save('images/particle_sparkle.png')
    print('Created images/particle_sparkle.png')

def make_backgrounds():
    # 1. Sky BG with hill curve (1080x420)
    w, h = 1080, 420
    img_sky = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    draw_sky = ImageDraw.Draw(img_sky)
    
    # Sky gradient from light cyan to pale blue
    for y in range(h):
        ratio = y / h
        r = int(191 + (225 - 191) * ratio)
        g = int(247 + (252 - 247) * ratio)
        b = int(251 + (255 - 251) * ratio)
        draw_sky.line([(0, y), (w, y)], fill=(r, g, b, 255))
        
    # Gentle white hills curve at bottom
    hill_pts = [(0, h)]
    for x in range(0, w + 10, 10):
        # smooth curve matching video
        hy = h - 60 - 30 * math.sin(x * 0.005) - 20 * math.cos(x * 0.009)
        hill_pts.append((x, hy))
    hill_pts.append((w, h))
    draw_sky.polygon(hill_pts, fill=(255, 255, 255, 255))
    img_sky.save('images/sky_bg.png')
    print('Created images/sky_bg.png')

    # 2. Net pattern (diamond lattice grid)
    nw, nh = 1080, 450
    img_net = Image.new('RGBA', (nw, nh), (0, 0, 0, 0))
    draw_net = ImageDraw.Draw(img_net)
    
    spacing = 54
    # Diagonal 1 (\)
    for offset in range(-nw, nw + nh, spacing):
        draw_net.line([(offset, 0), (offset + nh, nh)], fill=(60, 170, 230, 65), width=2)
    # Diagonal 2 (/)
    for offset in range(0, nw + nh * 2, spacing):
        draw_net.line([(offset, 0), (offset - nh, nh)], fill=(60, 170, 230, 65), width=2)
        
    # Vertical fade mask
    mask = Image.new('L', (nw, nh), 0)
    draw_mask = ImageDraw.Draw(mask)
    for y in range(nh):
        alpha = int(255 * max(0, 1 - (y / (nh * 0.85))**1.5))
        draw_mask.line([(0, y), (nw, y)], fill=alpha)
    img_net.putalpha(mask)
    img_net.save('images/net_pattern.png')
    print('Created images/net_pattern.png')

def make_app_icons():
    # App icon 512x512
    size = 512
    img = Image.new('RGBA', (size, size), (33, 68, 98, 255))
    draw = ImageDraw.Draw(img)
    # Sky top
    draw.rectangle([0, 0, size, 260], fill=(191, 247, 251, 255))
    # Green grass platform
    draw.rectangle([0, 260, size, 320], fill=(72, 183, 4, 255))
    # Ball
    ball_img = Image.open('images/ball.png').resize((120, 120))
    img.paste(ball_img, (80, 180), ball_img)
    # Flag
    flag_img = Image.open('images/flag.png').resize((120, 200))
    img.paste(flag_img, (340, 120), flag_img)
    # Hole
    hole_img = Image.open('images/hole.png').resize((120, 70))
    img.paste(hole_img, (320, 260), hole_img)
    img.save('images/icon-512.png')
    
    img.resize((128, 128)).save('images/icon-128.png')
    print('Created app icons')

if __name__ == '__main__':
    make_ball()
    make_club()
    make_flag()
    make_hole()
    make_obstacle()
    make_grass_tufts()
    make_ui_buttons()
    make_ui_banner()
    make_ui_hold_badge()
    make_particles()
    make_backgrounds()
    make_app_icons()
    print('All assets successfully generated!')
