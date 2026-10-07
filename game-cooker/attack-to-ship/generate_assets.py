"""
Asset generator for Attack to Ship game.
Generates high-resolution, crisp sprites and textures matching demo.mp4 at 1080x1920 layout scale.
"""

from PIL import Image, ImageDraw, ImageFilter
import math
import os

os.makedirs('images', exist_ok=True)

def create_background():
    # 1080 x 1920 full background
    width, height = 1080, 1920
    waterline_y = 576
    
    img = Image.new('RGB', (width, height))
    draw = ImageDraw.Draw(img)
    
    # Sky: Y=0 to 576 (pale sky blue gradient)
    # top: #f0f7fd, bottom near waterline: #ffffff
    for y in range(waterline_y):
        t = y / waterline_y
        r = int(240 + (255 - 240) * t)
        g = int(247 + (255 - 247) * t)
        b = int(253 + (255 - 253) * t)
        draw.line([(0, y), (width, y)], fill=(r, g, b))
        
    # Ocean: Y=576 to 1920 (rich ocean gradient from cyan/azure to deep navy blue)
    # y=576: #70d6f4 (RGB 112, 214, 244)
    # y=1200: #429bd6 (RGB 66, 155, 214)
    # y=1920: #2a588c (RGB 42, 88, 140)
    ocean_h = height - waterline_y
    for y in range(waterline_y, height):
        t = (y - waterline_y) / ocean_h
        # smooth 3-point color interpolation
        if t < 0.4:
            lt = t / 0.4
            r = int(112 * (1 - lt) + 72 * lt)
            g = int(214 * (1 - lt) + 160 * lt)
            b = int(244 * (1 - lt) + 218 * lt)
        else:
            lt = (t - 0.4) / 0.6
            r = int(72 * (1 - lt) + 42 * lt)
            g = int(160 * (1 - lt) + 90 * lt)
            b = int(218 * (1 - lt) + 145 * lt)
        draw.line([(0, y), (width, y)], fill=(r, g, b))
        
    # Subtle waterline accent line
    draw.line([(0, waterline_y), (width, waterline_y)], fill=(130, 222, 248), width=3)
    img.save('images/bg_sky_water.png', 'PNG')
    print("Created images/bg_sky_water.png")


def create_ship():
    # Size 320 x 140
    w, h = 320, 140
    img = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Warship layout:
    # Submerged hull (bottom 25px): dark steel grey #47525d
    # Main deck hull (middle 35px): medium warship grey #8292a1
    # Deck superstructure & bridge: #9eacba
    # Masts, radar & antennas: dark grey #3b4249
    
    # Submerged keel / lower hull
    # Hull points: from x=20 to x=305
    lower_hull = [
        (25, 75), (295, 75), (312, 95), (290, 112),
        (190, 114), (160, 114), # center bomb moonpool gap
        (45, 112), (20, 85)
    ]
    draw.polygon(lower_hull, fill=(65, 76, 88, 255))
    
    # Moonpool hatch in lower hull (bomb bay cutout)
    draw.rectangle([155, 95, 175, 114], fill=(40, 48, 56, 255))
    draw.rectangle([158, 98, 172, 114], fill=(25, 30, 36, 255))
    
    # Upper main hull
    main_hull = [
        (15, 62), (305, 62), (315, 75), (20, 75)
    ]
    draw.polygon(main_hull, fill=(125, 140, 155, 255))
    draw.line([(15, 62), (305, 62)], fill=(160, 175, 190, 255), width=2)
    
    # Bow flair and stern step
    draw.polygon([(290, 48), (308, 62), (250, 62), (250, 48)], fill=(145, 160, 175, 255))
    # Windows on bridge front
    for wx in [260, 275, 290]:
        draw.rectangle([wx, 53, wx + 8, 59], fill=(45, 55, 65, 255))
        
    # Central superstructure (Command Bridge)
    draw.rectangle([105, 42, 215, 62], fill=(155, 170, 185, 255))
    draw.rectangle([165, 25, 195, 42], fill=(135, 150, 165, 255))
    
    # Mast & radar on bridge
    draw.line([(172, 5), (172, 25)], fill=(60, 68, 76, 255), width=4)
    draw.line([(178, 2), (178, 25)], fill=(60, 68, 76, 255), width=3)
    draw.line([(165, 10), (185, 10)], fill=(60, 68, 76, 255), width=2)
    
    # Rear communication mast
    draw.line([(240, 22), (240, 48)], fill=(60, 68, 76, 255), width=3)
    draw.line([(235, 28), (245, 28)], fill=(60, 68, 76, 255), width=2)
    
    # Gun turret on forward deck
    draw.rectangle([70, 52, 100, 62], fill=(110, 122, 135, 255))
    draw.line([(55, 54), (70, 56)], fill=(50, 58, 65, 255), width=4)
    
    img.save('images/ship.png', 'PNG')
    print("Created images/ship.png")


def create_shield():
    # 400 x 200 force field dome
    w, h = 400, 200
    img = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Multi-layer glowing ellipse
    for r_expand, alpha in [(12, 35), (8, 60), (4, 90), (0, 130)]:
        bbox = [15 - r_expand, 10 - r_expand, w - 15 + r_expand, h - 10 + r_expand]
        draw.ellipse(bbox, fill=(50, 190, 255, alpha), outline=(130, 230, 255, int(alpha * 1.5)), width=3)
        
    # Hexagonal / honeycomb pattern overlay
    hex_size = 24
    for row in range(-1, 8):
        for col in range(-1, 14):
            cx = col * hex_size * 1.5 + (hex_size * 0.75 if row % 2 else 0)
            cy = row * hex_size * math.sqrt(3) / 2
            # Check if point is inside ellipse
            nx = (cx - w/2) / (w/2 - 25)
            ny = (cy - h/2) / (h/2 - 20)
            if nx*nx + ny*ny < 0.85:
                # draw subtle hexagon outline
                pts = []
                for a in range(6):
                    angle = math.radians(60 * a + 30)
                    px = cx + hex_size * 0.5 * math.cos(angle)
                    py = cy + hex_size * 0.5 * math.sin(angle)
                    pts.append((px, py))
                draw.polygon(pts, outline=(180, 240, 255, 55))
                
    img.save('images/shield.png', 'PNG')
    print("Created images/shield.png")


def create_depth_charge():
    # 48 x 80 purple bomb pointing downwards
    w, h = 48, 80
    img = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Tail fins at top (y=6 to 26)
    draw.polygon([(10, 6), (38, 6), (32, 26), (16, 26)], fill=(110, 30, 195, 255))
    draw.polygon([(4, 10), (14, 24), (14, 6)], fill=(85, 20, 160, 255))
    draw.polygon([(44, 10), (34, 24), (34, 6)], fill=(85, 20, 160, 255))
    
    # Bomb cylinder body (y=24 to 60)
    draw.rectangle([12, 22, 36, 58], fill=(135, 38, 230, 255))
    # Warning stripes (orange/yellow)
    draw.rectangle([12, 34, 36, 39], fill=(255, 170, 0, 255))
    draw.rectangle([12, 45, 36, 50], fill=(255, 170, 0, 255))
    
    # Rounded nose cone pointing downwards (y=56 to 74)
    draw.chord([12, 44, 36, 74], 0, 180, fill=(115, 25, 200, 255), outline=(90, 15, 160, 255))
    draw.ellipse([20, 70, 28, 76], fill=(60, 10, 120, 255)) # fuse tip
    
    img.save('images/bomb.png', 'PNG')
    print("Created images/bomb.png")


def create_torpedo():
    # 40 x 80 red torpedo pointing upwards
    w, h = 40, 80
    img = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Pointed nose cone at top (y=6 to 26)
    draw.polygon([(20, 4), (10, 26), (30, 26)], fill=(225, 45, 45, 255))
    
    # Main cylinder body (y=26 to 62)
    draw.rectangle([10, 26, 30, 62], fill=(210, 35, 35, 255))
    # Yellow hazard stripes
    draw.rectangle([10, 34, 30, 39], fill=(255, 215, 0, 255))
    draw.rectangle([10, 47, 30, 52], fill=(255, 215, 0, 255))
    
    # Tail fins at bottom (y=60 to 76)
    draw.polygon([(10, 62), (30, 62), (36, 76), (4, 76)], fill=(175, 20, 20, 255))
    draw.polygon([(18, 74), (22, 74), (24, 78), (16, 78)], fill=(120, 15, 15, 255)) # propeller hub
    
    img.save('images/torpedo.png', 'PNG')
    print("Created images/torpedo.png")


def create_sub_scout():
    # Red scout sub: 160 x 90
    w, h = 160, 90
    img = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Hull body (rounded bean / submarine shape)
    draw.rounded_rectangle([25, 28, 130, 68], radius=20, fill=(185, 35, 35, 255))
    draw.ellipse([15, 30, 45, 66], fill=(185, 35, 35, 255))
    
    # Front glass dome / porthole (cyan/teal glow)
    draw.chord([10, 32, 42, 64], 90, 270, fill=(35, 210, 235, 255), outline=(15, 140, 170, 255), width=2)
    draw.ellipse([16, 38, 26, 48], fill=(160, 245, 255, 220)) # reflection shine
    
    # Conning tower snorkel (top)
    draw.rectangle([65, 12, 85, 28], fill=(155, 25, 25, 255))
    draw.rectangle([68, 6, 76, 12], fill=(120, 20, 20, 255))
    draw.line([(76, 6), (82, 6)], fill=(120, 20, 20, 255), width=3)
    
    # Tail fin & Propeller (rear)
    draw.polygon([(125, 36), (145, 26), (140, 48)], fill=(140, 20, 20, 255))
    draw.polygon([(125, 60), (145, 70), (140, 48)], fill=(140, 20, 20, 255))
    draw.rectangle([138, 45, 146, 51], fill=(80, 80, 80, 255))
    # Propeller blades
    draw.ellipse([144, 34, 152, 62], outline=(245, 180, 30, 255), fill=(225, 160, 20, 255), width=2)
    
    img.save('images/sub_scout.png', 'PNG')
    print("Created images/sub_scout.png")


def create_sub_patrol():
    # Olive patrol sub: 230 x 95
    w, h = 230, 95
    img = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Hull body: streamlined oval
    draw.ellipse([20, 32, 195, 75], fill=(108, 138, 65, 255))
    draw.rectangle([45, 34, 175, 73], fill=(108, 138, 65, 255))
    
    # Front glass cockpit dome
    draw.chord([25, 33, 65, 55], 180, 360, fill=(40, 215, 245, 255), outline=(20, 150, 175, 255), width=2)
    draw.ellipse([34, 36, 44, 42], fill=(190, 248, 255, 220))
    
    # Conning tower (center top)
    draw.rectangle([105, 14, 125, 36], fill=(70, 75, 80, 255))
    draw.line([(115, 6), (115, 14)], fill=(40, 45, 50, 255), width=3)
    
    # Large vertical tail fin / rudder
    draw.polygon([(170, 34), (202, 16), (200, 52), (180, 52)], fill=(88, 115, 52, 255))
    draw.polygon([(178, 62), (205, 82), (195, 84), (170, 68)], fill=(88, 115, 52, 255))
    
    # Row of square observation windows / hatches
    for wx in range(55, 170, 18):
        draw.rectangle([wx, 48, wx + 11, 58], fill=(68, 88, 42, 255))
        
    img.save('images/sub_patrol.png', 'PNG')
    print("Created images/sub_patrol.png")


def create_sub_military():
    # Long military sub: 420 x 90
    w, h = 420, 90
    img = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Long sleek hull
    draw.rounded_rectangle([30, 40, 395, 74], radius=16, fill=(112, 135, 85, 255))
    draw.chord([380, 40, 412, 74], 270, 90, fill=(112, 135, 85, 255))
    
    # Stern horizontal stabilizers
    draw.polygon([(15, 48), (35, 42), (35, 68), (15, 62)], fill=(90, 110, 68, 255))
    
    # Tall conning tower (forward-center)
    draw.ellipse([215, 30, 280, 48], fill=(100, 122, 76, 255))
    draw.rectangle([240, 12, 256, 38], fill=(55, 62, 68, 255))
    # Dual periscopes / radar masts
    draw.line([(244, 2), (244, 12)], fill=(40, 45, 50, 255), width=2)
    draw.line([(252, 4), (252, 12)], fill=(40, 45, 50, 255), width=2)
    
    # 3 vertical missile silos behind tower
    for sx in [85, 115, 145]:
        draw.rectangle([sx, 26, sx + 18, 42], fill=(65, 72, 78, 255))
        draw.line([(sx + 3, 26), (sx + 15, 26)], fill=(85, 95, 102, 255), width=2)
        
    # Subtle hull hatches
    for hx in range(45, 210, 16):
        draw.rectangle([hx, 52, hx + 8, 58], fill=(90, 110, 68, 255))
        
    img.save('images/sub_military.png', 'PNG')
    print("Created images/sub_military.png")


def create_boss_shark():
    # Giant Mecha Shark Boss: 580 x 250
    w, h = 580, 250
    img = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Main robotic green hull
    hull_pts = [
        (40, 130), (80, 105), (200, 105), (250, 50), (320, 50), (360, 105),
        (510, 105), (550, 125), (450, 175), (420, 215), (380, 215), (370, 175),
        (260, 175), (220, 145), (140, 145), (80, 185), (50, 185), (65, 140)
    ]
    draw.polygon(hull_pts, fill=(35, 155, 75, 255))
    
    # Magenta / hot pink high-tech angular armor trim
    pink_line = [
        (65, 105), (280, 105), (320, 125), (380, 125), (410, 105), (530, 105),
        (530, 115), (410, 115), (380, 135), (320, 135), (280, 115), (65, 115)
    ]
    draw.polygon(pink_line, fill=(235, 25, 120, 255))
    
    # Three orange missile launch batteries on top deck
    for bx in [80, 120, 160]:
        draw.rectangle([bx, 60, bx + 30, 105], fill=(255, 140, 20, 255), outline=(200, 95, 10, 255), width=2)
        draw.rectangle([bx + 4, 64, bx + 26, 75], fill=(255, 190, 50, 255))
        
    # Orange and pink ventral booster pod
    ventral_pod = [
        (130, 145), (240, 145), (260, 165), (150, 165), (130, 180), (115, 160)
    ]
    draw.polygon(ventral_pod, fill=(255, 140, 20, 255), outline=(235, 25, 120, 255), width=3)
    
    # Front shark-like jaw / acoustic sonar grill (silver/white with horizontal slats)
    jaw_pts = [(420, 120), (515, 120), (445, 168), (420, 168)]
    draw.polygon(jaw_pts, fill=(215, 225, 235, 255), outline=(175, 185, 195, 255), width=2)
    for ly in [132, 144, 156]:
        draw.line([(425, ly), (480 - (ly - 132)*1.2, ly)], fill=(120, 135, 150, 255), width=3)
        
    # Vertical magenta side gills
    for gx in [395, 415, 435]:
        draw.rectangle([gx, 135, gx + 8, 155], fill=(235, 25, 120, 255))
        
    # Fins
    draw.polygon([(260, 50), (285, 20), (320, 50)], fill=(25, 125, 55, 255)) # dorsal fin
    draw.polygon([(340, 175), (370, 215), (320, 175)], fill=(25, 125, 55, 255)) # ventral fin
    
    img.save('images/boss_shark.png', 'PNG')
    print("Created images/boss_shark.png")


def create_boss_dreadnought():
    # Giant Yellow/Purple Dreadnought Boss: 580 x 250
    w, h = 580, 250
    img = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Heavy yellow cyber hull
    yellow_pts = [
        (60, 130), (120, 85), (360, 85), (410, 35), (480, 35), (510, 85),
        (560, 125), (510, 185), (200, 185), (140, 175), (60, 150)
    ]
    draw.polygon(yellow_pts, fill=(245, 195, 30, 255))
    
    # Massive conning tower superstructure
    draw.rectangle([340, 60, 480, 85], fill=(225, 175, 20, 255))
    draw.rectangle([390, 30, 440, 60], fill=(195, 150, 15, 255))
    draw.rectangle([440, 15, 460, 60], fill=(130, 100, 10, 255)) # periscope tower
    
    # Heavy purple torpedo launcher battery pod
    pod_pts = [
        (180, 120), (490, 120), (510, 140), (510, 175), (490, 195),
        (180, 195), (160, 175), (160, 140)
    ]
    draw.polygon(pod_pts, fill=(105, 25, 155, 255), outline=(75, 15, 115, 255), width=3)
    
    # Orange torpedo silo bay housing giant red/gold super torpedo
    draw.rectangle([210, 130, 460, 185], fill=(255, 130, 20, 255))
    # Giant super torpedo inside bay
    draw.ellipse([220, 138, 260, 177], fill=(220, 30, 30, 255))
    draw.rectangle([250, 138, 430, 177], fill=(245, 185, 25, 255))
    draw.polygon([(430, 145), (450, 135), (450, 180), (430, 170)], fill=(180, 20, 20, 255))
    
    # Industrial armor plating lines
    for lx in range(140, 340, 45):
        draw.line([(lx, 85), (lx, 120)], fill=(190, 145, 15, 255), width=3)
        
    img.save('images/boss_dreadnought.png', 'PNG')
    print("Created images/boss_dreadnought.png")


def create_badge_shield():
    # Golden winged shield: 160 x 80
    w, h = 160, 80
    img = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Golden wings spread left and right
    left_wing = [(70, 40), (15, 25), (10, 40), (25, 52), (50, 52), (70, 48)]
    right_wing = [(90, 40), (145, 25), (150, 40), (135, 52), (110, 52), (90, 48)]
    draw.polygon(left_wing, fill=(255, 210, 45, 255), outline=(215, 160, 15, 255), width=2)
    draw.polygon(right_wing, fill=(255, 210, 45, 255), outline=(215, 160, 15, 255), width=2)
    
    # Center heraldic shield
    shield_pts = [
        (60, 22), (100, 22), (104, 45), (80, 68), (56, 45)
    ]
    draw.polygon(shield_pts, fill=(240, 175, 20, 255), outline=(180, 115, 10, 255), width=3)
    
    # Inner glowing shield crest
    inner_shield = [
        (66, 28), (94, 28), (97, 44), (80, 60), (63, 44)
    ]
    draw.polygon(inner_shield, fill=(255, 235, 90, 255))
    
    # Star crest
    draw.polygon([(80, 32), (83, 40), (92, 40), (85, 45), (88, 54), (80, 48), (72, 54), (75, 45), (68, 40), (77, 40)], fill=(215, 120, 10, 255))
    
    img.save('images/badge_shield.png', 'PNG')
    print("Created images/badge_shield.png")


def create_explosion_sheet():
    # 6 frames of fiery explosive blast, 100x100 each -> 600 x 100 sheet
    fw, fh = 100, 100
    img = Image.new('RGBA', (fw * 6, fh), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    for f in range(6):
        ox = f * fw + fw / 2
        oy = fh / 2
        # Progress 0.0 to 1.0
        prog = (f + 1) / 6.0
        radius = int(12 + 34 * math.sin(prog * math.pi * 0.8))
        alpha = int(255 * (1.0 - (f / 6.0) * 0.7))
        
        # Outer smoke / fire burst
        draw.ellipse([ox - radius, oy - radius, ox + radius, oy + radius], fill=(240, 80, 20, alpha))
        
        # Middle fiery orange blast
        mid_r = int(radius * 0.7)
        if mid_r > 3:
            draw.ellipse([ox - mid_r, oy - mid_r, ox + mid_r, oy + mid_r], fill=(255, 175, 25, alpha))
            
        # Core intense white-yellow hot center
        core_r = int(radius * 0.4)
        if core_r > 2:
            draw.ellipse([ox - core_r, oy - core_r, ox + core_r, oy + core_r], fill=(255, 250, 180, alpha))
            
        # Fiery shock sparks
        for a in range(8):
            angle = a * (math.pi / 4) + f * 0.3
            dist = radius + int(8 * prog * (a % 3 + 1))
            sp_r = max(2, int(4 * (1.0 - prog)))
            sx = ox + dist * math.cos(angle)
            sy = oy + dist * math.sin(angle)
            draw.ellipse([sx - sp_r, sy - sp_r, sx + sp_r, sy + sp_r], fill=(255, 195, 30, alpha))
            
    img.save('images/explosion.png', 'PNG')
    print("Created images/explosion.png")


def create_ui_buttons():
    # Left and Right arrows: 160 x 130
    w, h = 160, 130
    
    # Left arrow
    img_left = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    d_left = ImageDraw.Draw(img_left)
    pts_left = [
        (15, 65), (75, 15), (75, 42), (145, 42), (145, 88), (75, 88), (75, 115)
    ]
    d_left.polygon(pts_left, fill=(235, 238, 242, 210), outline=(160, 170, 180, 240), width=6)
    img_left.save('images/btn_left.png', 'PNG')
    
    # Right arrow
    img_right = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    d_right = ImageDraw.Draw(img_right)
    pts_right = [
        (145, 65), (85, 15), (85, 42), (15, 42), (15, 88), (85, 88), (85, 115)
    ]
    d_right.polygon(pts_right, fill=(235, 238, 242, 210), outline=(160, 170, 180, 240), width=6)
    img_right.save('images/btn_right.png', 'PNG')
    
    # Bomb button: 160 x 160 Hexagon
    bw, bh = 160, 160
    img_bomb = Image.new('RGBA', (bw, bh), (0, 0, 0, 0))
    d_bomb = ImageDraw.Draw(img_bomb)
    
    # Hexagon points
    hex_pts = []
    for i in range(6):
        angle = math.radians(60 * i + 30)
        hx = 80 + 70 * math.cos(angle)
        hy = 80 + 70 * math.sin(angle)
        hex_pts.append((hx, hy))
    d_bomb.polygon(hex_pts, fill=(180, 190, 200, 180), outline=(130, 140, 150, 220), width=6)
    
    # Bomb silhouette inside
    # Tail fins
    d_bomb.polygon([(58, 45), (102, 45), (94, 65), (66, 65)], fill=(95, 102, 110, 230))
    # Body
    d_bomb.ellipse([64, 55, 96, 115], fill=(95, 102, 110, 230))
    # Nose
    d_bomb.chord([64, 90, 96, 122], 0, 180, fill=(95, 102, 110, 230))
    img_bomb.save('images/btn_bomb.png', 'PNG')
    
    # Gamepad button (Top-left): 100 x 100
    img_pad = Image.new('RGBA', (100, 100), (0, 0, 0, 0))
    d_pad = ImageDraw.Draw(img_pad)
    d_pad.rounded_rectangle([6, 6, 94, 94], radius=20, fill=(72, 192, 235, 255), outline=(255, 255, 255, 220), width=3)
    # White gamepad shape
    d_pad.rounded_rectangle([20, 34, 80, 72], radius=14, fill=(255, 255, 255, 255))
    # Grips
    d_pad.ellipse([18, 48, 38, 76], fill=(255, 255, 255, 255))
    d_pad.ellipse([62, 48, 82, 76], fill=(255, 255, 255, 255))
    # D-pad cross (cyan)
    d_pad.rectangle([28, 46, 42, 54], fill=(72, 192, 235, 255))
    d_pad.rectangle([32, 42, 38, 58], fill=(72, 192, 235, 255))
    # Action buttons (cyan dots)
    d_pad.ellipse([66, 44, 72, 50], fill=(72, 192, 235, 255))
    d_pad.ellipse([74, 48, 80, 54], fill=(72, 192, 235, 255))
    img_pad.save('images/btn_gamepad.png', 'PNG')
    
    # Pause button (Top-right): 100 x 100
    img_pause = Image.new('RGBA', (100, 100), (0, 0, 0, 0))
    d_pause = ImageDraw.Draw(img_pause)
    d_pause.rounded_rectangle([6, 6, 94, 94], radius=20, fill=(235, 240, 245, 190), outline=(255, 255, 255, 200), width=3)
    # Pause bars
    d_pause.rounded_rectangle([32, 26, 44, 74], radius=4, fill=(160, 172, 185, 240))
    d_pause.rounded_rectangle([56, 26, 68, 74], radius=4, fill=(160, 172, 185, 240))
    img_pause.save('images/btn_pause.png', 'PNG')
    
    # Icons: 128x128 and 512x512
    icon512 = Image.new('RGBA', (512, 512), (35, 120, 185, 255))
    d_ico = ImageDraw.Draw(icon512)
    # Sky and water in icon
    d_ico.rectangle([0, 0, 512, 220], fill=(225, 245, 255, 255))
    d_ico.rectangle([0, 220, 512, 512], fill=(45, 140, 210, 255))
    # Mini ship in icon
    d_ico.polygon([(60, 210), (452, 210), (410, 260), (100, 260)], fill=(75, 88, 102, 255))
    d_ico.rectangle([160, 160, 360, 210], fill=(130, 145, 160, 255))
    d_ico.line([(260, 110), (260, 160)], fill=(50, 60, 70, 255), width=8)
    # Bomb dropping
    d_ico.ellipse([240, 300, 272, 350], fill=(140, 40, 220, 255))
    # Submarine below
    d_ico.rounded_rectangle([120, 390, 400, 460], radius=30, fill=(90, 125, 60, 255))
    d_ico.rectangle([230, 350, 280, 390], fill=(60, 70, 75, 255))
    
    icon512.save('images/icon-512.png', 'PNG')
    icon128 = icon512.resize((128, 128), Image.Resampling.LANCZOS)
    icon128.save('images/icon-128.png', 'PNG')
    
def create_hearts():
    def render_pretty_heart(filled=True):
        S = 256
        img = Image.new('RGBA', (S, S), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)
        pts = []
        r = 54
        for a in range(130, 315, 5):
            rad = math.radians(a)
            pts.append((82 + r * math.cos(rad), 95 + r * math.sin(rad)))
        for a in range(225, 410, 5):
            rad = math.radians(a)
            pts.append((174 + r * math.cos(rad), 95 + r * math.sin(rad)))
        pts.append((128, 228))
        
        if filled:
            draw.polygon(pts, fill=(255, 23, 68, 255), outline=(255, 220, 230, 255), width=6)
            high_pts = []
            for a in range(140, 300, 10):
                rad = math.radians(a)
                high_pts.append((82 + (r - 14) * math.cos(rad), 95 + (r - 14) * math.sin(rad)))
            high_pts.append((82, 95))
            draw.polygon(high_pts, fill=(255, 130, 160, 190))
            draw.ellipse([58, 62, 88, 86], fill=(255, 255, 255, 240))
            draw.ellipse([92, 84, 104, 96], fill=(255, 255, 255, 180))
        else:
            draw.polygon(pts, fill=(35, 45, 55, 150), outline=(130, 140, 155, 220), width=8)
            draw.line([(128, 65), (122, 100), (134, 140), (128, 225)], fill=(110, 120, 135, 220), width=4)
            
        return img.resize((128, 128), Image.Resampling.LANCZOS)

    render_pretty_heart(True).save('images/heart.png', 'PNG')
    render_pretty_heart(False).save('images/heart_empty.png', 'PNG')
    print("Created images/heart.png and images/heart_empty.png")

if __name__ == '__main__':
    create_background()
    create_ship()
    create_shield()
    create_depth_charge()
    create_torpedo()
    create_sub_scout()
    create_sub_patrol()
    create_sub_military()
    create_boss_shark()
    create_boss_dreadnought()
    create_badge_shield()
    create_explosion_sheet()
    create_ui_buttons()
    create_hearts()
    print("All assets generated successfully!")

