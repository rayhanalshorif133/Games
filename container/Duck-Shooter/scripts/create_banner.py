import os
import math
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageEnhance

W, H = 1000, 600
banner = Image.new('RGBA', (W, H), (15, 8, 3, 255))

def load_img(name):
    p = os.path.join('assets', 'images', name)
    if os.path.exists(p):
        return Image.open(p).convert('RGBA')
    return None

def paste_with_shadow(base, img, pos, offset=(0, 6), blur=10, alpha=180):
    if not img: return base
    a = img.split()[-1]
    shadow = Image.new('RGBA', img.size, (0, 0, 0, 0))
    black = Image.new('RGBA', img.size, (0, 0, 0, alpha))
    shadow.paste(black, (0, 0), a)
    if blur > 0:
        shadow = shadow.filter(ImageFilter.GaussianBlur(blur))
    
    layer = Image.new('RGBA', base.size, (0, 0, 0, 0))
    layer.paste(shadow, (pos[0] + offset[0], pos[1] + offset[1]), shadow)
    base = Image.alpha_composite(base, layer)
    
    img_layer = Image.new('RGBA', base.size, (0, 0, 0, 0))
    img_layer.paste(img, pos, img)
    return Image.alpha_composite(base, img_layer)

def draw_star(draw, cx, cy, r_outer, r_inner, fill_color):
    points = []
    for i in range(10):
        r = r_outer if i % 2 == 0 else r_inner
        ang = i * math.pi / 5 - math.pi / 2
        points.append((cx + r * math.cos(ang), cy + r * math.sin(ang)))
    draw.polygon(points, fill=fill_color)

def draw_target_icon(draw, cx, cy, r, color):
    draw.ellipse([cx - r, cy - r, cx + r, cy + r], outline=color, width=2)
    draw.ellipse([cx - r * 0.5, cy - r * 0.5, cx + r * 0.5, cy + r * 0.5], fill=color)

def generate():
    global banner
    # 1. Background
    bg = load_img('background-default-000.png')
    if bg:
        bg = bg.resize((W, H), Image.Resampling.LANCZOS)
        enhancer = ImageEnhance.Brightness(bg)
        bg = enhancer.enhance(0.92)
        banner.paste(bg, (0, 0))

    # 2. Carnival Theatre Top Festoon & Drapes
    curtain_layer = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    d_curt = ImageDraw.Draw(curtain_layer)

    num_swags = 7
    swag_w = W / num_swags
    for i in range(num_swags):
        sx = i * swag_w
        scallop_pts = [(sx, 0), (sx + swag_w, 0)]
        for step in range(21):
            t = step / 20.0
            x = sx + t * swag_w
            y = 35 + math.sin(t * math.pi) * 45
            scallop_pts.append((x, y))
        d_curt.polygon(scallop_pts, fill=(185, 20, 30, 255))
        
        fringe_pts = []
        for step in range(21):
            t = step / 20.0
            x = sx + t * swag_w
            y = 35 + math.sin(t * math.pi) * 45
            fringe_pts.append((x, y))
        d_curt.line(fringe_pts, fill=(255, 215, 0, 255), width=4)
        draw_star(d_curt, sx, 35, 6, 3, (255, 223, 0, 255))

    d_curt.rectangle([0, 0, W, 32], fill=(150, 15, 22, 255))
    d_curt.line([(0, 32), (W, 32)], fill=(255, 215, 0, 255), width=3)

    d_curt.polygon([(0, 0), (60, 0), (35, H), (0, H)], fill=(160, 18, 26, 235))
    d_curt.line([(60, 0), (35, H)], fill=(212, 175, 55, 255), width=3)
    d_curt.polygon([(W, 0), (W - 60, 0), (W - 35, H), (W, H)], fill=(160, 18, 26, 235))
    d_curt.line([(W - 60, 0), (W - 35, H)], fill=(212, 175, 55, 255), width=3)

    c_shadow = curtain_layer.filter(ImageFilter.GaussianBlur(10))
    cs_layer = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    cs_layer.paste(Image.new('RGBA', (W, H), (0, 0, 0, 140)), (0, 8), c_shadow.split()[-1])
    banner = Image.alpha_composite(banner, cs_layer)
    banner = Image.alpha_composite(banner, curtain_layer)

    # 3. Sunlight Rays
    sun = load_img('sunlight-default-000.png')
    if sun:
        sun_res = sun.resize((900, 900), Image.Resampling.LANCZOS)
        sun_layer = Image.new('RGBA', (W, H), (0, 0, 0, 0))
        sun_layer.paste(sun_res, (50, -250), sun_res)
        r, g, b, a = sun_layer.split()
        a = a.point(lambda v: int(v * 0.40))
        sun_layer.putalpha(a)
        banner = Image.alpha_composite(banner, sun_layer)

    # 4. Bullet holes
    hole = load_img('bullet_hole-default-001.png')
    if hole:
        hole_res = hole.resize((42, 38), Image.Resampling.LANCZOS)
        for bx, by in [(160, 260), (220, 320), (740, 270), (840, 310), (510, 230)]:
            hl = Image.new('RGBA', (W, H), (0, 0, 0, 0))
            hl.paste(hole_res, (bx, by), hole_res)
            banner = Image.alpha_composite(banner, hl)

    # 5. Mechanical Gallery Shelf
    shelf_y = 430
    shelf_layer = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    d_shelf = ImageDraw.Draw(shelf_layer)

    d_shelf.rectangle([0, shelf_y - 12, W, shelf_y], fill=(0, 0, 0, 80))
    d_shelf.rectangle([0, shelf_y, W, shelf_y + 16], fill=(255, 215, 0, 255))
    d_shelf.rectangle([0, shelf_y + 3, W, shelf_y + 7], fill=(255, 250, 230, 255))
    d_shelf.rectangle([0, shelf_y + 14, W, shelf_y + 16], fill=(180, 140, 0, 255))
    d_shelf.rectangle([0, shelf_y + 16, W, shelf_y + 110], fill=(65, 28, 12, 255))
    d_shelf.rectangle([0, shelf_y + 16, W, shelf_y + 22], fill=(95, 45, 20, 255))
    d_shelf.rectangle([0, shelf_y + 105, W, shelf_y + 110], fill=(30, 12, 5, 255))

    poles_x = [135, 305, 490, 680, 855]
    for px in poles_x:
        d_shelf.rectangle([px - 5, shelf_y - 65, px + 5, shelf_y], fill=(45, 22, 10, 255))
        d_shelf.ellipse([px - 7, shelf_y - 70, px + 7, shelf_y - 56], fill=(255, 202, 40, 255))

    banner = Image.alpha_composite(banner, shelf_layer)

    # 6. Targets on Shelf
    d1 = load_img('duck-duck_1-000.png')
    if d1:
        d1_res = d1.resize((145, 145), Image.Resampling.LANCZOS)
        banner = paste_with_shadow(banner, d1_res, (65, 315))

    d2 = load_img('duck-duck_2-000.png')
    if d2:
        d2_res = d2.resize((150, 150), Image.Resampling.LANCZOS)
        banner = paste_with_shadow(banner, d2_res, (230, 310))

    d3 = load_img('duck-duck_3-000.png')
    if d3:
        aura = Image.new('RGBA', (320, 320), (0, 0, 0, 0))
        d_aura = ImageDraw.Draw(aura)
        for r in range(150, 0, -8):
            alpha_val = int(85 * (1 - r / 150))
            d_aura.ellipse([160 - r, 160 - r, 160 + r, 160 + r], fill=(255, 215, 0, alpha_val))
        aura = aura.filter(ImageFilter.GaussianBlur(18))
        al = Image.new('RGBA', (W, H), (0, 0, 0, 0))
        al.paste(aura, (330, 225), aura)
        banner = Image.alpha_composite(banner, al)

        d3_res = d3.resize((175, 175), Image.Resampling.LANCZOS)
        banner = paste_with_shadow(banner, d3_res, (405, 285), offset=(0, 10), blur=16)

    egg = load_img('eggs-default-000.png')
    if egg:
        eaura = Image.new('RGBA', (200, 200), (0, 0, 0, 0))
        d_eaura = ImageDraw.Draw(eaura)
        for r in range(90, 0, -8):
            alpha_val = int(75 * (1 - r / 90))
            d_eaura.ellipse([100 - r, 100 - r, 100 + r, 100 + r], fill=(0, 229, 255, alpha_val))
        eaura = eaura.filter(ImageFilter.GaussianBlur(12))
        eal = Image.new('RGBA', (W, H), (0, 0, 0, 0))
        eal.paste(eaura, (585, 270), eaura)
        banner = Image.alpha_composite(banner, eal)

        egg_res = egg.resize((115, 150), Image.Resampling.LANCZOS)
        banner = paste_with_shadow(banner, egg_res, (630, 305))

    exp = load_img('explosion-detonation-002.png')
    d5 = load_img('duck-duck_5-000.png')
    if d5:
        d5_res = d5.resize((150, 150), Image.Resampling.LANCZOS)
        banner = paste_with_shadow(banner, d5_res, (780, 315))

    if exp:
        exp_res = exp.resize((160, 130), Image.Resampling.LANCZOS)
        banner = paste_with_shadow(banner, exp_res, (775, 310), offset=(0, 0), blur=14, alpha=150)

    # 7. Crosshair on Center Duck
    crosshair = load_img('cursor-default-001.png')
    if crosshair:
        ch_res = crosshair.resize((110, 110), Image.Resampling.LANCZOS)
        banner = paste_with_shadow(banner, ch_res, (448, 320), offset=(0, 4), blur=8)

    # 8. Main Game Logo
    logo = load_img('gamelogo-default-000.png')
    if logo:
        lw = 450
        lh = int(lw * (logo.height / logo.width))
        logo_res = logo.resize((lw, lh), Image.Resampling.LANCZOS)
        banner = paste_with_shadow(banner, logo_res, (int((W - lw) / 2), 20), offset=(0, 10), blur=20, alpha=230)

    # 9. UI Typography & Badges
    ui_layer = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    d_ui = ImageDraw.Draw(ui_layer)

    try:
        font_tag = ImageFont.truetype('trebucbd.ttf', 16)
        font_hit = ImageFont.truetype('impact.ttf', 20)
        font_pill = ImageFont.truetype('trebucbd.ttf', 14)
    except:
        font_tag = ImageFont.load_default()
        font_hit = font_tag
        font_pill = font_tag

    # Tagline Banner under Logo
    tag_txt = 'INFINITE 2D CARNIVAL ARCADE  •  1080x1920 READY'
    tbox = font_tag.getbbox(tag_txt)
    tw = tbox[2] - tbox[0]
    tag_x = int((W - tw) / 2)
    tag_y = 232

    d_ui.rounded_rectangle([tag_x - 30, tag_y - 4, tag_x + tw + 30, tag_y + 26], radius=15, fill=(18, 8, 3, 230), outline=(255, 193, 7, 255), width=2)
    draw_star(d_ui, tag_x - 14, tag_y + 11, 8, 4, (255, 215, 0, 255))
    draw_star(d_ui, tag_x + tw + 14, tag_y + 11, 8, 4, (255, 215, 0, 255))
    d_ui.text((tag_x, tag_y), tag_txt, font=font_tag, fill=(255, 224, 130, 255))

    # Target Accuracy Lock Bubble
    bx, by = 550, 305
    bw, bh = 190, 38
    d_ui.rounded_rectangle([bx, by, bx + bw, by + bh], radius=10, fill=(10, 22, 12, 235), outline=(0, 230, 118, 255), width=2)
    draw_target_icon(d_ui, bx + 22, by + 19, 10, (0, 230, 118, 255))
    d_ui.text((bx + 40, by + 6), 'BULLSEYE: 10 PTS!', font=font_hit, fill=(0, 230, 118, 255))

    # PLAY NOW button at center of shelf
    play_btn = load_img('btnplay-default-000.png')
    if play_btn:
        pglow = Image.new('RGBA', (140, 140), (0, 0, 0, 0))
        d_pglow = ImageDraw.Draw(pglow)
        for r in range(65, 0, -5):
            d_pglow.ellipse([70 - r, 70 - r, 70 + r, 70 + r], fill=(255, 215, 0, int(60 * (1 - r / 65))))
        pglow = pglow.filter(ImageFilter.GaussianBlur(10))
        pgl = Image.new('RGBA', (W, H), (0, 0, 0, 0))
        pgl.paste(pglow, (430, 415), pglow)
        banner = Image.alpha_composite(banner, pgl)

        pb_res = play_btn.resize((100, 100), Image.Resampling.LANCZOS)
        banner = paste_with_shadow(banner, pb_res, (450, 435), offset=(0, 6), blur=12)

    # Feature Badges across the bottom
    feats = [
        ('ACCURACY SCORING', '#00e676'),
        ('FRENZY COMBOS', '#ff9800'),
        ('BOMBS & BONUS EGGS', '#00e5ff'),
        ('ONLINE LEADERBOARD', '#ffd700')
    ]
    f_w = 215
    f_start = 35
    f_y = 552

    for i, (f_title, f_col) in enumerate(feats):
        fx = f_start + i * (f_w + 22)
        d_ui.rounded_rectangle([fx, f_y, fx + f_w, f_y + 34], radius=17, fill=(28, 12, 5, 235), outline=(255, 193, 7, 220), width=2)
        d_ui.ellipse([fx + 10, f_y + 8, fx + 26, f_y + 24], fill=f_col)
        d_ui.text((fx + 34, f_y + 7), f_title, font=font_pill, fill=(255, 248, 225, 255))

    d_ui.rectangle([4, 4, W - 5, H - 5], outline=(255, 193, 7, 230), width=3)
    d_ui.rectangle([7, 7, W - 8, H - 8], outline=(255, 235, 59, 110), width=1)

    banner = Image.alpha_composite(banner, ui_layer)
    banner.convert('RGB').save('banner.png', quality=98)
    print('Generated banner.png (1000x600)')

if __name__ == '__main__':
    generate()

