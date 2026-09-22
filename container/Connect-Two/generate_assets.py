import os
import math
from PIL import Image, ImageDraw, ImageFont, ImageFilter

os.makedirs('images', exist_ok=True)

def create_rounded_rect(size, bg_color, corner_radius, top_highlight=True):
    # 4x supersampling for ultra smooth anti-aliased curves
    factor = 4
    w, h = size[0] * factor, size[1] * factor
    r = corner_radius * factor
    
    img = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Base rounded rect
    draw.rounded_rectangle([0, 0, w - 1, h - 1], radius=r, fill=bg_color)
    
    if top_highlight:
        # Create subtle top gloss specular highlight
        highlight = Image.new('RGBA', (w, h), (0, 0, 0, 0))
        hdraw = ImageDraw.Draw(highlight)
        for y in range(h // 2):
            alpha = int(70 * (1.0 - y / (h // 2)))
            hdraw.line([(0, y), (w, y)], fill=(255, 255, 255, alpha))
            
        # Mask highlight to rounded rectangle
        mask = Image.new('L', (w, h), 0)
        mdraw = ImageDraw.Draw(mask)
        mdraw.rounded_rectangle([0, 0, w - 1, h - 1], radius=r, fill=255)
        
        img = Image.composite(Image.alpha_composite(img, highlight), img, mask)
        
    return img.resize(size, Image.Resampling.LANCZOS)

# 1. Generate Dot Tiles (256x256) - 5 Colors + Mixed
DOT_COLORS = {
    'red': (235, 87, 87, 255),        # #EB5757
    'yellow': (242, 201, 76, 255),    # #F2C94C
    'green': (39, 174, 96, 255),      # #27AE60
    'orange': (242, 153, 74, 255),    # #F2994A
    'purple': (155, 81, 224, 255)     # #9B51E0
}

for color_name, rgba in DOT_COLORS.items():
    tile = create_rounded_rect((256, 256), rgba, 68, top_highlight=True)
    tile.save(f'images/dot_{color_name}.png')

# Football Dot Tile
def create_football_dot_tile(size=(256, 256)):
    factor = 4
    w, h = size[0] * factor, size[1] * factor
    r = 68 * factor

    img = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    draw.rounded_rectangle([0, 0, w - 1, h - 1], radius=r, fill=(245, 247, 250, 255))
    draw.rounded_rectangle([0, 0, w - 1, h - 1], radius=r, outline=(203, 213, 225, 255), width=4*factor)

    cx, cy = w // 2, h // 2
    ball_r = 95 * factor

    ball_img = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    bdraw = ImageDraw.Draw(ball_img)
    bdraw.ellipse([cx - ball_r, cy - ball_r, cx + ball_r, cy + ball_r], fill=(255, 255, 255, 255), outline=(30, 41, 59, 255), width=6*factor)

    p1_r = 32 * factor
    center_pentagon = []
    for i in range(5):
        ang = i * 2 * math.pi / 5 - math.pi / 2
        center_pentagon.append((cx + p1_r * math.cos(ang), cy + p1_r * math.sin(ang)))
    bdraw.polygon(center_pentagon, fill=(30, 41, 59, 255))

    p2_r = 62 * factor
    for i in range(5):
        vx, vy = center_pentagon[i]
        ang = i * 2 * math.pi / 5 - math.pi / 2
        ox = cx + p2_r * math.cos(ang)
        oy = cy + p2_r * math.sin(ang)
        bdraw.line([(vx, vy), (ox, oy)], fill=(30, 41, 59, 255), width=6*factor)

        next_ang = (i + 1) * 2 * math.pi / 5 - math.pi / 2
        nox = cx + p2_r * math.cos(next_ang)
        noy = cy + p2_r * math.sin(next_ang)
        bdraw.line([(ox, oy), (nox, noy)], fill=(30, 41, 59, 255), width=6*factor)

        p_edge_r = 95 * factor
        ang_mid1 = ang - 0.28
        ang_mid2 = ang + 0.28
        patch_pts = [
            (ox, oy),
            (cx + p_edge_r * math.cos(ang_mid1), cy + p_edge_r * math.sin(ang_mid1)),
            (cx + p_edge_r * math.cos(ang), cy + p_edge_r * math.sin(ang)),
            (cx + p_edge_r * math.cos(ang_mid2), cy + p_edge_r * math.sin(ang_mid2))
        ]
        bdraw.polygon(patch_pts, fill=(30, 41, 59, 255))

    ball_mask = Image.new('L', (w, h), 0)
    bmdraw = ImageDraw.Draw(ball_mask)
    bmdraw.ellipse([cx - ball_r, cy - ball_r, cx + ball_r, cy + ball_r], fill=255)

    masked_ball = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    masked_ball.paste(ball_img, (0, 0), ball_mask)

    mb_draw = ImageDraw.Draw(masked_ball)
    mb_draw.ellipse([cx - ball_r, cy - ball_r, cx + ball_r, cy + ball_r], outline=(30, 41, 59, 255), width=6*factor)

    tile_mask = Image.new('L', (w, h), 0)
    tmdraw = ImageDraw.Draw(tile_mask)
    tmdraw.rounded_rectangle([0, 0, w - 1, h - 1], radius=r, fill=255)

    img = Image.alpha_composite(img, masked_ball)

    highlight = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    hdraw = ImageDraw.Draw(highlight)
    for y in range(h // 2):
        alpha = int(70 * (1.0 - y / (h // 2)))
        hdraw.line([(0, y), (w, y)], fill=(255, 255, 255, alpha))
    img = Image.alpha_composite(img, highlight)

    final_img = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    final_img.paste(img, (0, 0), tile_mask)
    return final_img.resize(size, Image.Resampling.LANCZOS)

football_tile = create_football_dot_tile((256, 256))
football_tile.save('images/dot_football.png')

# Mixed / Wildcard Color Dot Tile (Beautified 4-Quadrant Design: Red, Yellow, Green, Purple)
def create_mixed_box_tile(size=(256, 256)):
    factor = 4
    w, h = size[0] * factor, size[1] * factor
    r = 68 * factor
    cx, cy = w // 2, h // 2

    # 1. Base Tile Mask (Rounded Rect)
    tile_mask = Image.new('L', (w, h), 0)
    tmdraw = ImageDraw.Draw(tile_mask)
    tmdraw.rounded_rectangle([0, 0, w - 1, h - 1], radius=r, fill=255)

    # 2. Quadrants Canvas
    quad_img = Image.new('RGBA', (w, h), (0, 0, 0, 0))

    # Quadrant 1: Top-Left -> Red (#EB5757)
    tl_img = Image.new('RGBA', (cx, cy), (0, 0, 0, 0))
    tl_draw = ImageDraw.Draw(tl_img)
    for y in range(cy):
        ny = y / cy
        r_col = int(245 - 20 * ny)
        g_col = int(92 - 20 * ny)
        b_col = int(92 - 20 * ny)
        tl_draw.line([(0, y), (cx, y)], fill=(r_col, g_col, b_col, 255))
    quad_img.paste(tl_img, (0, 0))

    # Quadrant 2: Top-Right -> Yellow (#F2C94C)
    tr_img = Image.new('RGBA', (w - cx, cy), (0, 0, 0, 0))
    tr_draw = ImageDraw.Draw(tr_img)
    for y in range(cy):
        ny = y / cy
        r_col = int(250 - 15 * ny)
        g_col = int(212 - 25 * ny)
        b_col = int(80 - 25 * ny)
        tr_draw.line([(0, y), (w - cx, y)], fill=(r_col, g_col, b_col, 255))
    quad_img.paste(tr_img, (cx, 0))

    # Quadrant 3: Bottom-Left -> Green (#27AE60)
    bl_img = Image.new('RGBA', (cx, h - cy), (0, 0, 0, 0))
    bl_draw = ImageDraw.Draw(bl_img)
    for y in range(h - cy):
        ny = y / (h - cy)
        r_col = int(45 - 15 * ny)
        g_col = int(185 - 25 * ny)
        b_col = int(105 - 20 * ny)
        bl_draw.line([(0, y), (cx, y)], fill=(r_col, g_col, b_col, 255))
    quad_img.paste(bl_img, (0, cy))

    # Quadrant 4: Bottom-Right -> Purple (#9B51E0)
    br_img = Image.new('RGBA', (w - cx, h - cy), (0, 0, 0, 0))
    br_draw = ImageDraw.Draw(br_img)
    for y in range(h - cy):
        ny = y / (h - cy)
        r_col = int(165 - 25 * ny)
        g_col = int(88 - 20 * ny)
        b_col = int(230 - 20 * ny)
        br_draw.line([(0, y), (w - cx, y)], fill=(r_col, g_col, b_col, 255))
    quad_img.paste(br_img, (cx, cy))

    # 3. Clean divider lines with subtle 3D seam
    seam_img = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    sdraw = ImageDraw.Draw(seam_img)
    sdraw.line([(cx, 0), (cx, h)], fill=(0, 0, 0, 50), width=2*factor)
    sdraw.line([(0, cy), (w, cy)], fill=(0, 0, 0, 50), width=2*factor)
    quad_img = Image.alpha_composite(quad_img, seam_img)

    # 4. Center Golden/White Diamond Spark
    star_img = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    st_draw = ImageDraw.Draw(star_img)
    star_r = 16 * factor
    pts = [
        (cx, cy - star_r),
        (cx + star_r*0.25, cy - star_r*0.25),
        (cx + star_r, cy),
        (cx + star_r*0.25, cy + star_r*0.25),
        (cx, cy + star_r),
        (cx - star_r*0.25, cy + star_r*0.25),
        (cx - star_r, cy),
        (cx - star_r*0.25, cy - star_r*0.25)
    ]
    st_draw.polygon(pts, fill=(255, 255, 255, 250))
    st_draw.ellipse([cx - star_r*0.35, cy - star_r*0.35, cx + star_r*0.35, cy + star_r*0.35], fill=(255, 245, 180, 255))
    quad_img = Image.alpha_composite(quad_img, star_img)

    # 5. Top Specular Gloss Highlight (Signature game 3D pill gloss)
    highlight = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    hdraw = ImageDraw.Draw(highlight)
    for y in range(h // 2):
        alpha = int(75 * (1.0 - y / (h // 2)))
        hdraw.line([(0, y), (w, y)], fill=(255, 255, 255, alpha))
    quad_img = Image.alpha_composite(quad_img, highlight)

    # 6. Inner Border / Edge Glow
    out_draw = ImageDraw.Draw(quad_img)
    out_draw.rounded_rectangle([1*factor, 1*factor, w - 1 - 1*factor, h - 1 - 1*factor], radius=r, outline=(255, 255, 255, 190), width=4*factor)

    # 7. Mask to rounded tile
    final_img = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    final_img.paste(quad_img, (0, 0), tile_mask)
    return final_img.resize(size, Image.Resampling.LANCZOS)

mixed_box_tile = create_mixed_box_tile((256, 256))
mixed_box_tile.save('images/mixed_box.png')
mixed_box_tile.save('images/dot_mixed.png')

# Highlight tile (translucent white/pale box)
hl = create_rounded_rect((256, 256), (255, 255, 255, 120), 72, top_highlight=False)
hl.save('images/dot_highlight.png')

# Button Green BG (256x256)
btn_g = create_rounded_rect((256, 256), (37, 196, 131, 255), 72, top_highlight=True)
btn_g.save('images/btn_green.png')

# 2. Helper for drawing antialiased icons
def create_icon_canvas(size=(256, 256)):
    factor = 4
    w, h = size[0] * factor, size[1] * factor
    img = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    return img, ImageDraw.Draw(img), factor

# Icon: Moves (4-direction grid arrows)
img, draw, f = create_icon_canvas()
# Center circle
draw.ellipse([110*f, 110*f, 146*f, 146*f], fill=(255, 255, 255, 255))
# Cross lines
lw = 14 * f
draw.line([(40*f, 128*f), (216*f, 128*f)], fill=(255, 255, 255, 255), width=lw)
draw.line([(128*f, 40*f), (128*f, 216*f)], fill=(255, 255, 255, 255), width=lw)
# Arrows
draw.polygon([(40*f, 128*f), (70*f, 100*f), (70*f, 156*f)], fill=(255, 255, 255, 255))
draw.polygon([(216*f, 128*f), (186*f, 100*f), (186*f, 156*f)], fill=(255, 255, 255, 255))
draw.polygon([(128*f, 40*f), (100*f, 70*f), (156*f, 70*f)], fill=(255, 255, 255, 255))
draw.polygon([(128*f, 216*f), (100*f, 186*f), (156*f, 186*f)], fill=(255, 255, 255, 255))
img.resize((256, 256), Image.Resampling.LANCZOS).save('images/icon_moves.png')

# Icon: Trophy (Golden)
img, draw, f = create_icon_canvas()
gold = (241, 196, 15, 255)
# Cup body
draw.polygon([(64*f, 50*f), (192*f, 50*f), (168*f, 140*f), (88*f, 140*f)], fill=gold)
# Handles
lw = 12 * f
draw.arc([40*f, 55*f, 95*f, 115*f], 90, 270, fill=gold, width=lw)
draw.arc([161*f, 55*f, 216*f, 115*f], 270, 90, fill=gold, width=lw)
# Stem & Base
draw.rectangle([116*f, 140*f, 140*f, 185*f], fill=gold)
draw.rounded_rectangle([75*f, 185*f, 181*f, 215*f], radius=10*f, fill=gold)
img.resize((256, 256), Image.Resampling.LANCZOS).save('images/icon_trophy.png')

# Icon: Coin (3D Gold Coin)
img, draw, f = create_icon_canvas()
draw.ellipse([20*f, 20*f, 236*f, 236*f], fill=(243, 156, 18, 255))
draw.ellipse([34*f, 34*f, 222*f, 222*f], fill=(241, 196, 15, 255))
draw.ellipse([54*f, 54*f, 202*f, 202*f], outline=(243, 156, 18, 255), width=8*f)
# Star / symbol in center
star_pts = []
for i in range(10):
    r = (56 if i % 2 == 0 else 26) * f
    ang = i * math.pi / 5 - math.pi / 2
    star_pts.append((128*f + r * math.cos(ang), 128*f + r * math.sin(ang)))
draw.polygon(star_pts, fill=(214, 137, 16, 255))
img.resize((256, 256), Image.Resampling.LANCZOS).save('images/icon_coin.png')

# Icon: Check badge
img, draw, f = create_icon_canvas()
draw.ellipse([20*f, 20*f, 236*f, 236*f], fill=(45, 55, 72, 255))
# Checkmark
draw.line([(65*f, 125*f), (105*f, 168*f), (190*f, 85*f)], fill=(37, 196, 131, 255), width=24*f, joint='curve')
img.resize((256, 256), Image.Resampling.LANCZOS).save('images/icon_check.png')

# Icon: Pause
img, draw, f = create_icon_canvas()
draw.rounded_rectangle([60*f, 45*f, 105*f, 211*f], radius=16*f, fill=(255, 255, 255, 255))
draw.rounded_rectangle([151*f, 45*f, 196*f, 211*f], radius=16*f, fill=(255, 255, 255, 255))
img.resize((256, 256), Image.Resampling.LANCZOS).save('images/icon_pause.png')

# Icon: Sound On
img, draw, f = create_icon_canvas()
draw.polygon([(45*f, 95*f), (85*f, 95*f), (135*f, 50*f), (135*f, 206*f), (85*f, 161*f), (45*f, 161*f)], fill=(255, 255, 255, 255))
draw.arc([115*f, 75*f, 185*f, 181*f], 300, 60, fill=(255, 255, 255, 255), width=16*f)
draw.arc([105*f, 45*f, 220*f, 211*f], 305, 55, fill=(255, 255, 255, 255), width=16*f)
img.resize((256, 256), Image.Resampling.LANCZOS).save('images/icon_sound_on.png')

# Icon: Sound Off
img, draw, f = create_icon_canvas()
draw.polygon([(45*f, 95*f), (85*f, 95*f), (135*f, 50*f), (135*f, 206*f), (85*f, 161*f), (45*f, 161*f)], fill=(255, 255, 255, 255))
draw.line([(165*f, 95*f), (225*f, 155*f)], fill=(255, 255, 255, 255), width=18*f)
draw.line([(225*f, 95*f), (165*f, 155*f)], fill=(255, 255, 255, 255), width=18*f)
img.resize((256, 256), Image.Resampling.LANCZOS).save('images/icon_sound_off.png')

# Icon: Play Triangle
img, draw, f = create_icon_canvas()
draw.polygon([(70*f, 45*f), (205*f, 128*f), (70*f, 211*f)], fill=(255, 255, 255, 255))
img.resize((256, 256), Image.Resampling.LANCZOS).save('images/icon_play.png')

# Icon: Close X
img, draw, f = create_icon_canvas()
draw.ellipse([20*f, 20*f, 236*f, 236*f], fill=(56, 211, 159, 255))
draw.line([(80*f, 80*f), (176*f, 176*f)], fill=(255, 255, 255, 255), width=22*f)
draw.line([(176*f, 80*f), (80*f, 176*f)], fill=(255, 255, 255, 255), width=22*f)
img.resize((256, 256), Image.Resampling.LANCZOS).save('images/icon_close.png')

# Icon: Video Reel / Ad
img, draw, f = create_icon_canvas()
green_v = (46, 204, 113, 255)
draw.rounded_rectangle([35*f, 45*f, 221*f, 211*f], radius=24*f, fill=green_v)
# Play symbol inside
draw.polygon([(105*f, 85*f), (175*f, 128*f), (105*f, 171*f)], fill=(255, 255, 255, 255))
img.resize((256, 256), Image.Resampling.LANCZOS).save('images/icon_video.png')

# Star: Filled (Gold)
img, draw, f = create_icon_canvas()
star_pts = []
for i in range(10):
    r = (105 if i % 2 == 0 else 44) * f
    ang = i * math.pi / 5 - math.pi / 2
    star_pts.append((128*f + r * math.cos(ang), 128*f + r * math.sin(ang)))
draw.polygon(star_pts, fill=(241, 196, 15, 255))
img.resize((256, 256), Image.Resampling.LANCZOS).save('images/star_filled.png')

# Star: Empty (Gray)
img, draw, f = create_icon_canvas()
draw.polygon(star_pts, fill=(203, 213, 225, 255))
img.resize((256, 256), Image.Resampling.LANCZOS).save('images/star_empty.png')

print("All game image assets generated successfully in images/!")

