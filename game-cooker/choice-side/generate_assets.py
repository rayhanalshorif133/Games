"""
Asset generator for Choice Side game.
Generates ultra high-quality, crisp assets matching demo.mp4 at 1080x1920 layout scale.
"""

import os
import math
import random
from PIL import Image, ImageDraw, ImageFilter, ImageEnhance

os.makedirs('images', exist_ok=True)
os.makedirs('icons', exist_ok=True)

def create_canyon_background():
    # 1080 x 1920 background with canyon chasm, distant rope bridges and distant crags
    w, h = 1080, 1920
    img = Image.new('RGB', (w, h))
    draw = ImageDraw.Draw(img)
    
    # Canyon chasm vertical atmospheric gradient
    # Top: #f8dfc2 (warm light peach)
    # Mid: #e6a76c (golden canyon sandstone)
    # Bottom: #be7038 (deep chasm depth)
    for y in range(h):
        t = y / h
        if t < 0.5:
            lt = t / 0.5
            r = int(248 * (1 - lt) + 230 * lt)
            g = int(223 * (1 - lt) + 167 * lt)
            b = int(194 * (1 - lt) + 108 * lt)
        else:
            lt = (t - 0.5) / 0.5
            r = int(230 * (1 - lt) + 190 * lt)
            g = int(167 * (1 - lt) + 112 * lt)
            b = int(108 * (1 - lt) + 56 * lt)
        draw.line([(0, y), (w, y)], fill=(r, g, b))
        
    # Draw distant canyon bridges spanning the canyon (at y = 450, 1100, 1750)
    # Each bridge has an arch, suspension ropes, and silhouette trees
    for bridge_y in [450, 1100, 1750]:
        # Distant canyon wall arch
        arch_pts = []
        for x in range(150, 930, 20):
            arch_sag = math.sin((x - 150) / 780.0 * math.pi) * 85
            arch_pts.append((x, bridge_y + arch_sag))
        
        # Bridge thickness
        for offset in range(0, 32, 2):
            pts = [(x, y + offset) for (x, y) in arch_pts]
            draw.line(pts, fill=(210, 145, 85, 180), width=3)
            
        # Vertical rope posts & silhouette pine trees on bridge
        for x_tree in range(220, 860, 90):
            arch_sag = math.sin((x_tree - 150) / 780.0 * math.pi) * 85
            ty = bridge_y + arch_sag
            # Tiny distant pine tree
            tree_pts = [
                (x_tree, ty - 38),
                (x_tree - 12, ty),
                (x_tree + 12, ty)
            ]
            draw.polygon(tree_pts, fill=(185, 120, 65))
            draw.line([(x_tree, ty), (x_tree, ty + 15)], fill=(160, 100, 50), width=2)
            
    # Add subtle distant canyon mountain crags in background
    for crag_x, crag_y in [(200, 250), (880, 750), (220, 1350), (850, 1600)]:
        pts = [
            (crag_x, crag_y - 120),
            (crag_x + 90, crag_y + 40),
            (crag_x - 90, crag_y + 40)
        ]
        draw.polygon(pts, fill=(215, 150, 90))

    img.save('images/bg_canyon.png', 'PNG')
    print("Created images/bg_canyon.png")


def create_wall(side='left'):
    # Seamless vertical looping cliff wall: width 180, height 1920
    w, h = 180, 1920
    img = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Left wall goes from x=0 inward to x=180.
    # Base dark rock tone: #381a0e, mid: #68371c, highlight: #ba6d3f, rock edges: #200e07
    num_segments = 8
    seg_h = h // num_segments
    
    for seg in range(num_segments):
        sy = seg * seg_h
        ey = sy + seg_h
        
        # Outer border strip
        draw.rectangle([(0, sy), (40, ey)], fill=(32, 14, 7, 255))
        
        # Jagged polygon facets
        pts1 = [(0, sy), (130, sy + 30), (165, sy + 110), (95, sy + 180), (150, ey), (0, ey)]
        draw.polygon(pts1, fill=(58, 28, 15, 255))
        
        pts2 = [(40, sy + 20), (120, sy + 50), (155, sy + 105), (80, sy + 160), (40, ey - 20)]
        draw.polygon(pts2, fill=(104, 55, 28, 255))
        
        # Sun-lit faceted ledge
        pts_lit = [(80, sy + 45), (145, sy + 90), (110, sy + 130)]
        draw.polygon(pts_lit, fill=(186, 109, 63, 255))
        
        # High-contrast edge contour
        draw.line([(130, sy + 30), (165, sy + 110), (95, sy + 180), (150, ey)], fill=(20, 9, 4, 255), width=4)
        
        # Ledge shelves
        ledge_y = sy + 105
        draw.line([(30, ledge_y), (160, ledge_y)], fill=(225, 145, 88, 255), width=3)
        
        # Stylized Pine Tree on the rock shelf (exactly as seen in demo.mp4!)
        tree_x = 105
        tree_y = ledge_y - 10
        # Tree trunk
        draw.rectangle([(tree_x - 4, tree_y - 12), (tree_x + 4, tree_y)], fill=(78, 42, 22, 255))
        # 3-tier bright green pine foliage
        # Tier 3 (bottom)
        draw.polygon([(tree_x, tree_y - 65), (tree_x - 32, tree_y - 12), (tree_x + 32, tree_y - 12)], fill=(16, 185, 129, 255))
        # Tier 2 (mid)
        draw.polygon([(tree_x, tree_y - 85), (tree_x - 26, tree_y - 32), (tree_x + 26, tree_y - 32)], fill=(34, 197, 94, 255))
        # Tier 1 (top)
        draw.polygon([(tree_x, tree_y - 110), (tree_x - 18, tree_y - 55), (tree_x + 18, tree_y - 55)], fill=(74, 222, 128, 255))
        # Neon green tree highlights
        draw.line([(tree_x, tree_y - 105), (tree_x - 14, tree_y - 60)], fill=(187, 247, 208, 255), width=2)
        draw.line([(tree_x, tree_y - 80), (tree_x - 20, tree_y - 38)], fill=(187, 247, 208, 255), width=2)

    if side == 'right':
        img = img.transpose(Image.FLIP_LEFT_RIGHT)
        img.save('images/wall_right.png', 'PNG')
        print("Created images/wall_right.png")
    else:
        img.save('images/wall_left.png', 'PNG')
        print("Created images/wall_left.png")


def create_player_climb(frame_idx=0):
    # Horned Ninja Hero climbing wall: 200 x 200
    w, h = 200, 200
    img = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Center of character
    cx, cy = 100, 100
    
    # 1. Baton / Scroll on back (diagonal cylinder)
    baton_angle = -0.4
    bx1 = cx - 40 * math.cos(baton_angle)
    by1 = cy - 40 * math.sin(baton_angle)
    bx2 = cx + 45 * math.cos(baton_angle)
    by2 = cy + 45 * math.sin(baton_angle)
    draw.line([(bx1, by1), (bx2, by2)], fill=(217, 163, 76, 255), width=14)
    draw.line([(bx1, by1), (bx2, by2)], fill=(120, 75, 20, 255), width=18)
    draw.line([(bx1, by1), (bx2, by2)], fill=(245, 200, 110, 255), width=10)
    
    # 2. Hero Torso (Orange-Red Warrior Tunic)
    torso_rect = [cx - 26, cy - 10, cx + 26, cy + 45]
    draw.rounded_rectangle(torso_rect, radius=12, fill=(234, 88, 12, 255), outline=(154, 52, 18, 255), width=3)
    # Tunic fold / inner armor
    draw.polygon([(cx - 15, cy - 5), (cx + 15, cy - 5), (cx, cy + 25)], fill=(194, 65, 12, 255))
    # White waist sash
    draw.rectangle([(cx - 25, cy + 26), (cx + 25, cy + 34)], fill=(245, 245, 245, 255), outline=(100, 100, 100, 255), width=2)
    
    # 3. Head & Cowl
    head_cx, head_cy = cx, cy - 35
    # Hood base
    draw.ellipse([(head_cx - 30, head_cy - 28), (head_cx + 30, head_cy + 28)], fill=(235, 235, 235, 255), outline=(100, 100, 100, 255), width=3)
    
    # Red ninja eye mask
    draw.polygon([
        (head_cx - 28, head_cy - 6),
        (head_cx + 28, head_cy - 6),
        (head_cx + 26, head_cy + 16),
        (head_cx - 26, head_cy + 16)
    ], fill=(185, 28, 28, 255), outline=(127, 29, 29, 255), width=2)
    
    # Fierce White Eyes & Pupils
    # Left eye
    draw.polygon([(head_cx - 20, head_cy), (head_cx - 8, head_cy + 4), (head_cx - 16, head_cy + 10)], fill=(255, 255, 255, 255))
    draw.ellipse([(head_cx - 16, head_cy + 3), (head_cx - 12, head_cy + 7)], fill=(20, 20, 20, 255))
    # Right eye
    draw.polygon([(head_cx + 8, head_cy + 4), (head_cx + 20, head_cy), (head_cx + 16, head_cy + 10)], fill=(255, 255, 255, 255))
    draw.ellipse([(head_cx + 12, head_cy + 3), (head_cx + 16, head_cy + 7)], fill=(20, 20, 20, 255))
    
    # Golden Ram Horns (Curled gracefully on sides of head)
    # Left Horn
    horn_l = [
        (head_cx - 22, head_cy - 12),
        (head_cx - 48, head_cy - 30),
        (head_cx - 62, head_cy - 10),
        (head_cx - 44, head_cy + 12),
        (head_cx - 28, head_cy)
    ]
    draw.line(horn_l, fill=(245, 185, 45, 255), width=16, joint="curve")
    draw.line(horn_l, fill=(180, 120, 20, 255), width=4, joint="curve")
    
    # Right Horn
    horn_r = [
        (head_cx + 22, head_cy - 12),
        (head_cx + 48, head_cy - 30),
        (head_cx + 62, head_cy - 10),
        (head_cx + 44, head_cy + 12),
        (head_cx + 28, head_cy)
    ]
    draw.line(horn_r, fill=(245, 185, 45, 255), width=16, joint="curve")
    draw.line(horn_r, fill=(180, 120, 20, 255), width=4, joint="curve")
    
    # 4. Arms & Legs (Climbing animation variation based on frame_idx)
    leg_offset = 12 if frame_idx == 0 else -12
    arm_offset = -12 if frame_idx == 0 else 12
    
    # Left Arm
    draw.line([(cx - 22, cy), (cx - 55, cy - 25 + arm_offset)], fill=(234, 88, 12, 255), width=14)
    # Bandaged hand
    draw.ellipse([(cx - 64, cy - 34 + arm_offset), (cx - 48, cy - 18 + arm_offset)], fill=(245, 245, 245, 255), outline=(100, 100, 100, 255), width=2)
    
    # Right Arm
    draw.line([(cx + 22, cy), (cx + 55, cy - 25 - arm_offset)], fill=(234, 88, 12, 255), width=14)
    # Bandaged hand
    draw.ellipse([(cx + 48, cy - 34 - arm_offset), (cx + 64, cy - 18 - arm_offset)], fill=(245, 245, 245, 255), outline=(100, 100, 100, 255), width=2)
    
    # Left Leg (Bandaged shin)
    draw.line([(cx - 16, cy + 40), (cx - 36, cy + 75 + leg_offset)], fill=(245, 245, 245, 255), width=12)
    draw.line([(cx - 36, cy + 75 + leg_offset), (cx - 50, cy + 78 + leg_offset)], fill=(30, 30, 30, 255), width=10)
    
    # Right Leg (Bandaged shin)
    draw.line([(cx + 16, cy + 40), (cx + 36, cy + 75 - leg_offset)], fill=(245, 245, 245, 255), width=12)
    draw.line([(cx + 36, cy + 75 - leg_offset), (cx + 50, cy + 78 - leg_offset)], fill=(30, 30, 30, 255), width=10)
    
    filename = f'images/player_climb_{frame_idx}.png'
    img.save(filename, 'PNG')
    print(f"Created {filename}")


def create_player_jump():
    # Somersault / Flip Spin aerodynamic tuck pose: 200 x 200
    w, h = 200, 200
    img = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    cx, cy = 100, 100
    
    # Spinning Katana Blade Aura / Trail glint
    draw.ellipse([(cx - 85, cy - 85), (cx + 85, cy + 85)], outline=(255, 255, 255, 120), width=6)
    draw.arc([(cx - 90, cy - 90), (cx + 90, cy + 90)], start=30, end=180, fill=(254, 240, 138, 220), width=8)
    
    # Curled Ball Body
    draw.ellipse([(cx - 45, cy - 40), (cx + 45, cy + 40)], fill=(234, 88, 12, 255), outline=(154, 52, 18, 255), width=4)
    # Mask & Head tucked in center
    draw.ellipse([(cx - 32, cy - 35), (cx + 25, cy + 20)], fill=(245, 245, 245, 255), outline=(100, 100, 100, 255), width=3)
    draw.rectangle([(cx - 28, cy - 18), (cx + 20, cy)], fill=(185, 28, 28, 255))
    # Eye slashes
    draw.polygon([(cx - 20, cy - 12), (cx - 10, cy - 10), (cx - 16, cy - 4)], fill=(255, 255, 255, 255))
    draw.polygon([(cx + 2, cy - 10), (cx + 12, cy - 12), (cx + 8, cy - 4)], fill=(255, 255, 255, 255))
    
    # Coiled Horns along circumference
    horn_curl1 = [(cx - 20, cy - 38), (cx - 60, cy - 30), (cx - 65, cy + 15), (cx - 40, cy + 35)]
    draw.line(horn_curl1, fill=(245, 185, 45, 255), width=16, joint="curve")
    draw.line(horn_curl1, fill=(180, 120, 20, 255), width=4, joint="curve")
    
    horn_curl2 = [(cx + 20, cy - 38), (cx + 60, cy - 30), (cx + 65, cy + 15), (cx + 40, cy + 35)]
    draw.line(horn_curl2, fill=(245, 185, 45, 255), width=16, joint="curve")
    draw.line(horn_curl2, fill=(180, 120, 20, 255), width=4, joint="curve")
    
    # Bandaged limbs tucked
    draw.ellipse([(cx - 52, cy + 20), (cx - 25, cy + 55)], fill=(245, 245, 245, 255), outline=(100, 100, 100, 255), width=3)
    draw.ellipse([(cx + 25, cy + 20), (cx + 52, cy + 55)], fill=(245, 245, 245, 255), outline=(100, 100, 100, 255), width=3)
    
    img.save('images/player_jump.png', 'PNG')
    print("Created images/player_jump.png")


def create_player_hurt():
    # Recoil / Stunned frame with red tint and impact stars: 200 x 200
    w, h = 200, 200
    img = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    cx, cy = 100, 100
    
    # Red damage impact flash ring
    draw.ellipse([(cx - 80, cy - 80), (cx + 80, cy + 80)], outline=(239, 68, 68, 200), width=6)
    
    # Torso knocked back
    draw.rounded_rectangle([(cx - 26, cy - 10), (cx + 26, cy + 45)], radius=12, fill=(220, 38, 38, 255), outline=(127, 29, 29, 255), width=4)
    # Head tilted
    head_cx, head_cy = cx - 5, cy - 35
    draw.ellipse([(head_cx - 30, head_cy - 28), (head_cx + 30, head_cy + 28)], fill=(255, 200, 200, 255), outline=(180, 50, 50, 255), width=3)
    # Mask
    draw.rectangle([(head_cx - 26, head_cy - 6), (head_cx + 26, head_cy + 16)], fill=(185, 28, 28, 255))
    # Hurt "X X" eyes
    for eye_x in [head_cx - 14, head_cx + 14]:
        draw.line([(eye_x - 6, head_cy + 2), (eye_x + 6, head_cy + 12)], fill=(255, 255, 255, 255), width=3)
        draw.line([(eye_x + 6, head_cy + 2), (eye_x - 6, head_cy + 12)], fill=(255, 255, 255, 255), width=3)
        
    # Horns
    horn_l = [(head_cx - 22, head_cy - 12), (head_cx - 48, head_cy - 30), (head_cx - 62, head_cy - 10)]
    draw.line(horn_l, fill=(245, 185, 45, 255), width=14, joint="curve")
    horn_r = [(head_cx + 22, head_cy - 12), (head_cx + 48, head_cy - 30), (head_cx + 62, head_cy - 10)]
    draw.line(horn_r, fill=(245, 185, 45, 255), width=14, joint="curve")
    
    img.save('images/player_hurt.png', 'PNG')
    print("Created images/player_hurt.png")


def create_saw_blade():
    # 220 x 220 Circular Razor Saw Blade
    w, h = 220, 220
    img = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    cx, cy = 110, 110
    
    # 16 Sharp triangular cutting teeth
    num_teeth = 16
    outer_r = 104
    inner_r = 78
    teeth_pts = []
    
    for i in range(num_teeth * 2):
        angle = i * (math.pi / num_teeth)
        # Alternate tip and gullet
        r = outer_r if (i % 2 == 0) else inner_r
        # Slant angle for aggressive saw blade look
        slant = 0.15 if (i % 2 == 0) else -0.1
        px = cx + r * math.cos(angle + slant)
        py = cy + r * math.sin(angle + slant)
        teeth_pts.append((px, py))
        
    # Draw saw blade steel body
    draw.polygon(teeth_pts, fill=(229, 231, 235, 255), outline=(107, 114, 128, 255))
    
    # Inner circular brushed metal ring
    draw.ellipse([(cx - 72, cy - 72), (cx + 72, cy + 72)], fill=(209, 213, 219, 255), outline=(75, 85, 99, 255), width=4)
    draw.ellipse([(cx - 50, cy - 50), (cx + 50, cy + 50)], fill=(156, 163, 175, 255), outline=(55, 65, 81, 255), width=3)
    
    # Air cutouts / weight reduction holes (4 circular slots)
    for hole_idx in range(4):
        h_angle = hole_idx * (math.pi / 2) + math.pi / 4
        hx = cx + 32 * math.cos(h_angle)
        hy = cy + 32 * math.sin(h_angle)
        draw.ellipse([(hx - 10, hy - 10), (hx + 10, hy + 10)], fill=(107, 114, 128, 255), outline=(31, 41, 55, 255), width=2)
        
    # Central axle nut & bolt
    draw.ellipse([(cx - 18, cy - 18), (cx + 18, cy + 18)], fill=(75, 85, 99, 255), outline=(17, 24, 39, 255), width=3)
    draw.ellipse([(cx - 8, cy - 8), (cx + 8, cy + 8)], fill=(31, 41, 55, 255))
    
    img.save('images/saw_blade.png', 'PNG')
    print("Created images/saw_blade.png")


def create_boulder():
    # 180 x 180 Polygonal tumbling meteorite / boulder
    w, h = 180, 180
    img = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    cx, cy = 90, 90
    
    # Outer dark outline polygon
    poly_pts = [
        (cx - 15, cy - 78),
        (cx + 55, cy - 65),
        (cx + 80, cy - 10),
        (cx + 65, cy + 60),
        (cx + 10, cy + 82),
        (cx - 60, cy + 65),
        (cx - 82, cy + 5),
        (cx - 65, cy - 55)
    ]
    draw.polygon(poly_pts, fill=(35, 24, 46, 255), outline=(18, 12, 24, 255))
    
    # Facets for 3D crystalline chiseled rock look
    # Facet 1 (top highlight)
    draw.polygon([(cx - 15, cy - 78), (cx + 55, cy - 65), (cx + 20, cy - 20), (cx - 25, cy - 30)], fill=(115, 85, 145, 255))
    # Facet 2 (right midtone)
    draw.polygon([(cx + 55, cy - 65), (cx + 80, cy - 10), (cx + 65, cy + 60), (cx + 15, cy + 15), (cx + 20, cy - 20)], fill=(85, 60, 110, 255))
    # Facet 3 (center shadow)
    draw.polygon([(cx - 25, cy - 30), (cx + 20, cy - 20), (cx + 15, cy + 15), (cx - 20, cy + 20)], fill=(60, 42, 80, 255))
    # Facet 4 (bottom deep shadow)
    draw.polygon([(cx + 65, cy + 60), (cx + 10, cy + 82), (cx - 60, cy + 65), (cx - 20, cy + 20), (cx + 15, cy + 15)], fill=(40, 26, 55, 255))
    # Facet 5 (left midtone)
    draw.polygon([(cx - 60, cy + 65), (cx - 82, cy + 5), (cx - 65, cy - 55), (cx - 25, cy - 30), (cx - 20, cy + 20)], fill=(75, 52, 98, 255))
    
    # Crack lines & crevices
    draw.line([(cx - 10, cy - 30), (cx + 5, cy + 10), (cx - 15, cy + 45)], fill=(20, 14, 28, 255), width=3)
    
    img.save('images/boulder.png', 'PNG')
    print("Created images/boulder.png")


def create_fireball():
    # 160 x 240 Falling Comet Fireball
    w, h = 160, 240
    img = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    cx, cy = 80, 150
    
    # Outer Crimson Flame Shell
    flame_pts = [
        (cx, 15),                 # flame tail top
        (cx - 35, 75),
        (cx - 15, 100),
        (cx - 65, 140),
        (cx - 65, 180),
        (cx, 225),                # round bottom leading head
        (cx + 65, 180),
        (cx + 65, 140),
        (cx + 15, 100),
        (cx + 35, 75)
    ]
    draw.polygon(flame_pts, fill=(239, 68, 68, 255))
    
    # Mid Fiery Orange Core
    mid_flame = [
        (cx, 45),
        (cx - 22, 90),
        (cx - 10, 115),
        (cx - 48, 150),
        (cx - 48, 180),
        (cx, 215),
        (cx + 48, 180),
        (cx + 48, 150),
        (cx + 10, 115),
        (cx + 22, 90)
    ]
    draw.polygon(mid_flame, fill=(249, 115, 22, 255))
    
    # Inner Brilliant Yellow Flame Core
    inner_flame = [
        (cx, 85),
        (cx - 12, 125),
        (cx - 30, 160),
        (cx, 202),
        (cx + 30, 160),
        (cx + 12, 125)
    ]
    draw.polygon(inner_flame, fill=(254, 240, 138, 255))
    
    # Blazing White Center
    draw.ellipse([(cx - 18, 160), (cx + 18, 196)], fill=(255, 255, 255, 255))
    
    # Small trailing spark teardrop at top
    draw.polygon([(cx, 5), (cx - 8, 22), (cx + 8, 22)], fill=(250, 204, 21, 255))
    
    img.save('images/fireball.png', 'PNG')
    print("Created images/fireball.png")


def create_apple(color_name='green'):
    # 140 x 150 Crisp Juicy Apple with Stem, Leaf, and White Outline
    w, h = 140, 150
    img = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    cx, cy = 70, 85
    
    # Palette definition
    if color_name == 'green':
        main_c = (34, 197, 94, 255)
        shade_c = (22, 163, 74, 255)
        light_c = (134, 239, 172, 255)
    elif color_name == 'yellow':
        main_c = (234, 179, 8, 255)
        shade_c = (202, 138, 4, 255)
        light_c = (254, 240, 138, 255)
    else: # purple
        main_c = (190, 24, 93, 255)
        shade_c = (157, 23, 77, 255)
        light_c = (244, 114, 182, 255)

    # 1. White border outline pass (drawn slightly enlarged for crisp sticker look!)
    # Stem outline
    draw.line([(cx, cy - 35), (cx + 15, cy - 65)], fill=(255, 255, 255, 255), width=16)
    # Leaf outline
    draw.ellipse([(cx - 36, cy - 68), (cx + 5, cy - 38)], fill=(255, 255, 255, 255))
    # Body outline
    draw.ellipse([(cx - 56, cy - 42), (cx + 8, cy + 42)], fill=(255, 255, 255, 255))
    draw.ellipse([(cx - 8, cy - 42), (cx + 56, cy + 42)], fill=(255, 255, 255, 255))
    draw.ellipse([(cx - 45, cy + 10), (cx + 45, cy + 48)], fill=(255, 255, 255, 255))
    
    # 2. Wooden Brown Stem
    draw.line([(cx, cy - 35), (cx + 15, cy - 65)], fill=(120, 53, 15, 255), width=8)
    
    # 3. Green Leaf
    leaf_pts = [(cx - 2, cy - 42), (cx - 32, cy - 64), (cx - 28, cy - 44)]
    draw.polygon(leaf_pts, fill=(74, 222, 128, 255), outline=(22, 101, 52, 255), width=2)
    
    # 4. Apple Main Body
    draw.ellipse([(cx - 50, cy - 38), (cx + 4, cy + 38)], fill=main_c)
    draw.ellipse([(cx - 4, cy - 38), (cx + 50, cy + 38)], fill=main_c)
    draw.ellipse([(cx - 40, cy + 12), (cx + 40, cy + 44)], fill=shade_c)
    
    # Apple Top Indentation
    draw.ellipse([(cx - 14, cy - 40), (cx + 14, cy - 30)], fill=shade_c)
    
    # Glossy Specular Highlight Reflection
    draw.ellipse([(cx - 34, cy - 25), (cx - 14, cy - 5)], fill=light_c)
    draw.ellipse([(cx - 30, cy - 22), (cx - 18, cy - 10)], fill=(255, 255, 255, 200))
    
    filename = f'images/apple_{color_name}.png'
    img.save(filename, 'PNG')
    print(f"Created {filename}")


def create_apple_slices():
    # Left and right sliced half apple halves: 90 x 150 each
    w, h = 90, 150
    
    for side in ['left', 'right']:
        img = Image.new('RGBA', (w, h), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)
        cx = 75 if side == 'left' else 15
        cy = 85
        
        # White sticker outline
        draw.ellipse([(cx - 60, cy - 42), (cx + 15, cy + 44)], fill=(255, 255, 255, 255))
        
        # Outer Colored Skin Rim (Golden Yellow)
        draw.ellipse([(cx - 54, cy - 38), (cx + 10, cy + 40)], fill=(234, 179, 8, 255))
        
        # Inner Juicy Creamy Pulp
        draw.ellipse([(cx - 46, cy - 32), (cx + 4, cy + 34)], fill=(254, 249, 195, 255))
        
        # Cut Flat Face Line
        face_x = cx if side == 'left' else cx + 2
        draw.line([(face_x, cy - 36), (face_x, cy + 38)], fill=(255, 255, 255, 255), width=4)
        
        # Apple Seed in core
        seed_x = cx - 12 if side == 'left' else cx + 12
        draw.ellipse([(seed_x - 4, cy - 6), (seed_x + 4, cy + 6)], fill=(120, 53, 15, 255))
        
        filename = f'images/apple_slice_{side}.png'
        img.save(filename, 'PNG')
        print(f"Created {filename}")


def create_heart():
    # 150 x 140 Heart with ECG pulse cardiogram wave and white glow
    w, h = 150, 140
    img = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    cx, cy = 75, 70
    
    # Outer white sticker glow
    heart_pts_glow = [
        (cx, cy + 54),
        (cx - 64, cy - 8),
        (cx - 64, cy - 42),
        (cx - 30, cy - 56),
        (cx, cy - 28),
        (cx + 30, cy - 56),
        (cx + 64, cy - 42),
        (cx + 64, cy - 8),
        (cx, cy + 54)
    ]
    draw.polygon(heart_pts_glow, fill=(255, 255, 255, 255))
    
    # Outer dark shadow
    heart_pts_dark = [
        (cx, cy + 48),
        (cx - 58, cy - 8),
        (cx - 58, cy - 38),
        (cx - 28, cy - 50),
        (cx, cy - 25),
        (cx + 28, cy - 50),
        (cx + 58, cy - 38),
        (cx + 58, cy - 8),
        (cx, cy + 48)
    ]
    draw.polygon(heart_pts_dark, fill=(127, 29, 29, 255))
    
    # Rich Crimson Heart Body
    heart_pts = [
        (cx, cy + 44),
        (cx - 54, cy - 8),
        (cx - 54, cy - 35),
        (cx - 26, cy - 46),
        (cx, cy - 23),
        (cx + 26, cy - 46),
        (cx + 54, cy - 35),
        (cx + 54, cy - 8),
        (cx, cy + 44)
    ]
    draw.polygon(heart_pts, fill=(220, 38, 38, 255))
    
    # Glossy top-left sheen
    draw.ellipse([(cx - 46, cy - 36), (cx - 18, cy - 14)], fill=(248, 113, 113, 255))
    draw.ellipse([(cx - 42, cy - 32), (cx - 24, cy - 18)], fill=(255, 255, 255, 220))
    
    # Electric ECG Cardiogram Pulse Wave
    pulse_pts = [
        (cx - 50, cy),
        (cx - 20, cy),
        (cx - 12, cy - 24),
        (cx - 4, cy + 24),
        (cx + 4, cy - 14),
        (cx + 12, cy),
        (cx + 50, cy)
    ]
    draw.line(pulse_pts, fill=(255, 255, 255, 255), width=5)
    draw.line(pulse_pts, fill=(254, 205, 211, 255), width=3)
    
    img.save('images/heart.png', 'PNG')
    print("Created images/heart.png")


def create_slash_trail():
    # 240 x 140 Katana slash crescent swoosh
    w, h = 240, 140
    img = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    crescent_pts = [
        (15, 70),
        (70, 20),
        (150, 10),
        (225, 45),
        (160, 35),
        (80, 50),
        (15, 70)
    ]
    draw.polygon(crescent_pts, fill=(255, 255, 255, 230))
    
    # Cyan outer glow
    for off in range(1, 6):
        draw.line([(15, 70), (70, 20 - off), (150, 10 - off), (225, 45)], fill=(56, 189, 248, 80), width=4)
        
    img.save('images/slash_trail.png', 'PNG')
    print("Created images/slash_trail.png")


def create_ui_buttons():
    # Home button (140x140)
    for btn_type in ['home', 'audio', 'audio_off']:
        w, h = 140, 140
        img = Image.new('RGBA', (w, h), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)
        cx, cy = 70, 70
        
        # Outer Golden Beveled Ring
        draw.ellipse([(5, 5), (135, 135)], fill=(245, 158, 11, 255), outline=(180, 83, 9, 255), width=5)
        # Inner Orange Face
        draw.ellipse([(14, 14), (126, 126)], fill=(251, 146, 60, 255))
        # Recessed Chocolate Brown Center
        draw.ellipse([(28, 28), (112, 112)], fill=(69, 26, 3, 255), outline=(120, 53, 15, 255), width=3)
        
        if btn_type == 'home':
            # House silhouette
            # Left roof/wall dark, right roof/wall white (exactly like demo.mp4!)
            roof_l = [(70, 42), (44, 68), (70, 68)]
            draw.polygon(roof_l, fill=(20, 10, 5, 255))
            roof_r = [(70, 42), (96, 68), (70, 68)]
            draw.polygon(roof_r, fill=(255, 255, 255, 255))
            
            body_l = [(48, 68), (70, 68), (70, 98), (48, 98)]
            draw.polygon(body_l, fill=(20, 10, 5, 255))
            body_r = [(70, 68), (92, 68), (92, 98), (70, 98)]
            draw.polygon(body_r, fill=(255, 255, 255, 255))
            
            # 4 small window squares on right side
            for wx, wy in [(74, 76), (82, 76), (74, 84), (82, 84)]:
                draw.rectangle([(wx, wy), (wx + 5, wy + 5)], fill=(69, 26, 3, 255))
                
        elif btn_type == 'audio':
            # Musical note silhouette
            note_pts = [
                (76, 45), (86, 45), (86, 80),
                (60, 80), (60, 94), (82, 94), (82, 58), (98, 55), (98, 45)
            ]
            draw.ellipse([(52, 78), (74, 98)], fill=(245, 158, 11, 255))
            draw.polygon([(70, 45), (96, 45), (96, 56), (70, 56)], fill=(245, 158, 11, 255))
            draw.line([(70, 45), (70, 88)], fill=(245, 158, 11, 255), width=8)
            draw.line([(96, 45), (96, 82)], fill=(245, 158, 11, 255), width=6)
            draw.ellipse([(78, 72), (98, 90)], fill=(245, 158, 11, 255))
            
        elif btn_type == 'audio_off':
            # Audio off with red diagonal line
            draw.ellipse([(52, 78), (74, 98)], fill=(180, 120, 80, 255))
            draw.line([(70, 45), (70, 88)], fill=(180, 120, 80, 255), width=8)
            draw.line([(32, 32), (108, 108)], fill=(239, 68, 68, 255), width=8)

        filename = f'images/ui_{btn_type}.png'
        img.save(filename, 'PNG')
        print(f"Created {filename}")


def create_hud_badges():
    # Apple badge for HUD (110 x 110)
    w, h = 110, 110
    img = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    cx, cy = 55, 55
    # Sliced purple apple with white diagonal slash
    draw.ellipse([(cx - 38, cy - 35), (cx + 38, cy + 35)], fill=(255, 255, 255, 255))
    draw.ellipse([(cx - 34, cy - 31), (cx + 34, cy + 31)], fill=(190, 24, 93, 255))
    draw.line([(cx - 40, cy + 10), (cx + 40, cy - 14)], fill=(255, 255, 255, 255), width=6)
    draw.polygon([(cx - 8, cy - 42), (cx - 24, cy - 50), (cx - 18, cy - 35)], fill=(74, 222, 128, 255))
    img.save('images/ui_apple_badge.png', 'PNG')
    print("Created images/ui_apple_badge.png")
    
    # Mascot life badge (120 x 110): Blue horned ninja helmet with pink horn tips
    img_m = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    draw_m = ImageDraw.Draw(img_m)
    # Blue Cowl
    draw_m.ellipse([(cx - 32, cy - 25), (cx + 32, cy + 30)], fill=(37, 99, 235, 255), outline=(29, 78, 216, 255), width=3)
    # Pink Horns
    draw_m.line([(cx - 25, cy - 15), (cx - 45, cy - 35), (cx - 35, cy - 45)], fill=(236, 72, 153, 255), width=12, joint="curve")
    draw_m.line([(cx + 25, cy - 15), (cx + 45, cy - 35), (cx + 35, cy - 45)], fill=(236, 72, 153, 255), width=12, joint="curve")
    # Red Mask
    draw_m.rectangle([(cx - 28, cy - 6), (cx + 28, cy + 12)], fill=(220, 38, 38, 255))
    # Fierce white eyes
    draw_m.polygon([(cx - 20, cy), (cx - 8, cy + 4), (cx - 14, cy + 8)], fill=(255, 255, 255, 255))
    draw_m.polygon([(cx + 8, cy + 4), (cx + 20, cy), (cx + 14, cy + 8)], fill=(255, 255, 255, 255))
    img_m.save('images/ui_life_badge.png', 'PNG')
    print("Created images/ui_life_badge.png")


def create_icons():
    # Construct 3 Icons: 16, 32, 64, 128, 256, 512, and loading-logo
    base_size = 512
    img = Image.new('RGBA', (base_size, base_size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    cx, cy = 256, 256
    
    # Rounded dark canyon badge
    draw.rounded_rectangle([(20, 20), (492, 492)], radius=90, fill=(45, 23, 14, 255), outline=(245, 158, 11, 255), width=16)
    
    # Horned Ninja Face + Sliced Apple
    # Sliced Apple
    draw.ellipse([(cx - 120, cy - 40), (cx + 120, cy + 160)], fill=(234, 179, 8, 255), outline=(255, 255, 255, 255), width=12)
    draw.line([(cx - 150, cy + 90), (cx + 150, cy + 30)], fill=(255, 255, 255, 255), width=18)
    
    # Horned Mask
    draw.rounded_rectangle([(cx - 110, cy - 140), (cx + 110, cy + 30)], radius=45, fill=(234, 88, 12, 255), outline=(154, 52, 18, 255), width=8)
    # Horns
    draw.line([(cx - 80, cy - 110), (cx - 170, cy - 180), (cx - 150, cy - 90)], fill=(245, 185, 45, 255), width=32, joint="curve")
    draw.line([(cx + 80, cy - 110), (cx + 170, cy - 180), (cx + 150, cy - 90)], fill=(245, 185, 45, 255), width=32, joint="curve")
    # Red ninja mask
    draw.rectangle([(cx - 95, cy - 85), (cx + 95, cy - 10)], fill=(220, 38, 38, 255))
    # Fierce white eyes
    draw.polygon([(cx - 70, cy - 60), (cx - 25, cy - 45), (cx - 45, cy - 30)], fill=(255, 255, 255, 255))
    draw.polygon([(cx + 25, cy - 45), (cx + 70, cy - 60), (cx + 45, cy - 30)], fill=(255, 255, 255, 255))
    
    img.save('icons/loading-logo.png', 'PNG')
    img.save('icons/icon-512.png', 'PNG')
    print("Created loading-logo.png and icon-512.png")
    
    for sz in [16, 32, 64, 128, 256]:
        resized = img.resize((sz, sz), Image.Resampling.LANCZOS)
        resized.save(f'icons/icon-{sz}.png', 'PNG')
        print(f"Created icons/icon-{sz}.png")


if __name__ == '__main__':
    print("Starting Asset Generation for Choice Side...")
    create_canyon_background()
    create_wall('left')
    create_wall('right')
    create_player_climb(0)
    create_player_climb(1)
    create_player_jump()
    create_player_hurt()
    create_saw_blade()
    create_boulder()
    create_fireball()
    create_apple('green')
    create_apple('yellow')
    create_apple('purple')
    create_apple_slices()
    create_heart()
    create_slash_trail()
    create_ui_buttons()
    create_hud_badges()
    create_icons()
    print("ALL ASSETS GENERATED SUCCESSFULLY!")

