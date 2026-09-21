import os
import math
from PIL import Image, ImageDraw, ImageFont

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

# 1. Generate Dot Tiles (256x256)
DOT_COLORS = {
    'blue': (110, 168, 254, 255),      # #6EA8FE
    'purple': (157, 93, 229, 255),     # #9D5DE5
    'red': (238, 89, 101, 255),        # #EE5965
    'yellow': (248, 207, 71, 255)      # #F8CF47
}

for color_name, rgba in DOT_COLORS.items():
    tile = create_rounded_rect((256, 256), rgba, 68, top_highlight=True)
    tile.save(f'images/dot_{color_name}.png')

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

