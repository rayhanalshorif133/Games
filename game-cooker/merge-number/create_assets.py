import os
import math
from PIL import Image, ImageDraw, ImageFilter, ImageFont

os.makedirs('images', exist_ok=True)
os.makedirs('icons', exist_ok=True)
os.makedirs('scripts', exist_ok=True)

FONT_BOLD_PATH = None
for f in ['C:/Windows/Fonts/segoeuib.ttf', 'C:/Windows/Fonts/arialbd.ttf', 'C:/Windows/Fonts/tahomabd.ttf']:
    if os.path.exists(f):
        FONT_BOLD_PATH = f
        break

FONT_TITLE_PATH = None
for f in ['C:/Windows/Fonts/comicbd.ttf', 'C:/Windows/Fonts/impact.ttf', FONT_BOLD_PATH]:
    if f and os.path.exists(f):
        FONT_TITLE_PATH = f
        break

def get_font(size, is_title=False):
    path = FONT_TITLE_PATH if is_title else FONT_BOLD_PATH
    if path:
        try:
            return ImageFont.truetype(path, size)
        except Exception:
            pass
    return ImageFont.load_default()

def draw_rounded_rect(draw, bbox, radius, fill=None, outline=None, width=1):
    draw.rounded_rectangle(bbox, radius=radius, fill=fill, outline=outline, width=width)

TILE_CONFIGS = {
    2: {
        'top': (245, 195, 10),
        'bottom': (207, 152, 0),
        'highlight': (255, 225, 80),
        'text': (110, 70, 5),
        'glow': (255, 215, 0)
    },
    4: {
        'top': (216, 63, 62),
        'bottom': (173, 33, 32),
        'highlight': (245, 110, 110),
        'text': (255, 255, 255),
        'glow': (255, 80, 80)
    },
    8: {
        'top': (149, 95, 218),
        'bottom': (112, 56, 179),
        'highlight': (185, 140, 245),
        'text': (255, 255, 255),
        'glow': (170, 110, 255)
    },
    16: {
        'top': (18, 177, 237),
        'bottom': (8, 142, 194),
        'highlight': (95, 215, 255),
        'text': (255, 255, 255),
        'glow': (0, 200, 255)
    },
    32: {
        'top': (255, 127, 17),
        'bottom': (214, 91, 0),
        'highlight': (255, 170, 80),
        'text': (255, 255, 255),
        'glow': (255, 140, 20)
    },
    64: {
        'top': (227, 39, 139),
        'bottom': (184, 21, 107),
        'highlight': (255, 105, 185),
        'text': (255, 255, 255),
        'glow': (255, 60, 180)
    },
    128: {
        'top': (46, 204, 113),
        'bottom': (31, 168, 85),
        'highlight': (115, 235, 160),
        'text': (255, 255, 255),
        'glow': (50, 255, 130)
    },
    256: {
        'top': (59, 89, 152),
        'bottom': (37, 62, 117),
        'highlight': (110, 140, 210),
        'text': (255, 255, 255),
        'glow': (80, 130, 240)
    },
    512: {
        'top': (0, 184, 148),
        'bottom': (0, 139, 111),
        'highlight': (75, 225, 195),
        'text': (255, 255, 255),
        'glow': (0, 230, 180)
    },
    1024: {
        'top': (232, 67, 147),
        'bottom': (190, 43, 112),
        'highlight': (255, 120, 185),
        'text': (255, 255, 255),
        'glow': (255, 80, 160)
    },
    2048: {
        'top': (253, 203, 110),
        'bottom': (225, 161, 46),
        'highlight': (255, 235, 170),
        'text': (120, 65, 0),
        'glow': (255, 215, 50)
    },
    4096: {
        'top': (162, 155, 254),
        'bottom': (108, 92, 231),
        'highlight': (210, 205, 255),
        'text': (255, 255, 255),
        'glow': (180, 170, 255)
    }
}

def create_tile(value, size=240):
    scale = 2
    s = size * scale
    img = Image.new('RGBA', (s, s), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    cfg = TILE_CONFIGS.get(value, TILE_CONFIGS[4096])
    top_col = cfg['top']
    bot_col = cfg['bottom']
    hl_col = cfg['highlight']
    txt_col = cfg['text']

    pad = 16 * scale
    radius = 34 * scale
    bevel_h = 16 * scale
    w = s - pad * 2
    h = s - pad * 2

    for i in range(12 * scale, 0, -2):
        alpha = int(45 * (1 - i / (12 * scale)))
        draw_rounded_rect(
            draw,
            [pad, pad + bevel_h + i, pad + w, pad + h + i],
            radius=radius,
            fill=(0, 0, 10, alpha)
        )

    draw_rounded_rect(
        draw,
        [pad, pad + bevel_h, pad + w, pad + h],
        radius=radius,
        fill=(*bot_col, 255)
    )

    draw_rounded_rect(
        draw,
        [pad, pad + bevel_h, pad + w, pad + h],
        radius=radius,
        outline=(int(bot_col[0] * 0.75), int(bot_col[1] * 0.75), int(bot_col[2] * 0.75), 255),
        width=3 * scale
    )

    top_face_h = h - bevel_h
    face_img = Image.new('RGBA', (w, top_face_h), (0, 0, 0, 0))
    face_draw = ImageDraw.Draw(face_img)

    for y in range(top_face_h):
        ratio = y / max(1, top_face_h)
        r = min(255, max(0, int(top_col[0] * (1.06 - 0.12 * ratio))))
        g = min(255, max(0, int(top_col[1] * (1.06 - 0.12 * ratio))))
        b = min(255, max(0, int(top_col[2] * (1.06 - 0.12 * ratio))))
        face_draw.line([(0, y), (w, y)], fill=(r, g, b, 255))

    mask = Image.new('L', (w, top_face_h), 0)
    mask_draw = ImageDraw.Draw(mask)
    draw_rounded_rect(mask_draw, [0, 0, w, top_face_h], radius=radius, fill=255)
    img.paste(face_img, (pad, pad), mask)

    draw.rounded_rectangle(
        [pad + 2 * scale, pad + 2 * scale, pad + w - 2 * scale, pad + top_face_h - 2 * scale],
        radius=radius - 2 * scale,
        outline=(*hl_col, 160),
        width=2 * scale
    )

    draw.rounded_rectangle(
        [pad, pad, pad + w, pad + top_face_h],
        radius=radius,
        outline=(int(bot_col[0] * 0.85), int(bot_col[1] * 0.85), int(bot_col[2] * 0.85), 180),
        width=2 * scale
    )

    text = str(value)
    font_size = 90 * scale if len(text) <= 2 else (75 * scale if len(text) == 3 else 62 * scale)
    font = get_font(font_size)

    bbox = draw.textbbox((0, 0), text, font=font)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    cx = s // 2
    cy = pad + top_face_h // 2 - 2 * scale
    tx = cx - tw // 2 - bbox[0]
    ty = cy - th // 2 - bbox[1]

    if txt_col == (255, 255, 255):
        draw.text((tx, ty + 3 * scale), text, font=font, fill=(int(bot_col[0] * 0.6), int(bot_col[1] * 0.6), int(bot_col[2] * 0.6), 160))
    else:
        draw.text((tx, ty + 2 * scale), text, font=font, fill=(255, 245, 180, 180))

    draw.text((tx, ty), text, font=font, fill=(*txt_col, 255))

    final_img = img.resize((size, size), Image.Resampling.LANCZOS)
    final_img.save(f'images/tile_{value}.png')
    print(f'Created images/tile_{value}.png')

def create_tile_slot(size=240):
    scale = 2
    s = size * scale
    img = Image.new('RGBA', (s, s), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    pad = 16 * scale
    radius = 34 * scale
    w = s - pad * 2
    h = s - pad * 2

    draw_rounded_rect(
        draw,
        [pad, pad, pad + w, pad + h],
        radius=radius,
        fill=(15, 18, 42, 180),
        outline=(25, 30, 65, 220),
        width=3 * scale
    )

    final_img = img.resize((size, size), Image.Resampling.LANCZOS)
    final_img.save('images/tile_slot.png')
    print('Created images/tile_slot.png')

def create_background():
    w, h = 1080, 1920
    img = Image.new('RGB', (w, h), (13, 14, 34))
    draw = ImageDraw.Draw(img)

    for y in range(h):
        ratio = y / h
        if ratio < 0.6:
            r = int(12 + 8 * math.sin(ratio * math.pi / 0.6))
            g = int(14 + 10 * math.sin(ratio * math.pi / 0.6))
            b = int(32 + 22 * math.sin(ratio * math.pi / 0.6))
        else:
            r = int(14 + 6 * (1 - ratio))
            g = int(15 + 7 * (1 - ratio))
            b = int(38 + 14 * (1 - ratio))
        draw.line([(0, y), (w, y)], fill=(r, g, b))

    glow_img = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow_img)
    cx, cy = 540, 940
    max_r = 650

    for r in range(max_r, 0, -25):
        alpha = int(30 * (1 - r / max_r))
        glow_draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(45, 60, 130, alpha))

    img = Image.alpha_composite(img.convert('RGBA'), glow_img).convert('RGB')
    img.save('images/background.png')
    print('Created images/background.png')

def create_bottom_banner():
    w, h = 1080, 320
    scale = 2
    sw, sh = w * scale, h * scale

    img = Image.new('RGBA', (sw, sh), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    curve_h = 60 * scale

    for y in range(sh):
        ratio = y / sh
        r = int(255 - 15 * ratio)
        g = int(200 - 85 * ratio)
        b = int(5 - 5 * ratio)
        draw.line([(0, y), (sw, y)], fill=(r, g, b, 255))

    mask = Image.new('L', (sw, sh), 0)
    mask_draw = ImageDraw.Draw(mask)
    curve_pts = []
    steps = 100
    for i in range(steps + 1):
        x = i * sw / steps
        norm_x = (x - sw / 2) / (sw / 2)
        y = curve_h * (norm_x ** 2)
        curve_pts.append((x, y))

    curve_pts.append((sw, sh))
    curve_pts.append((0, sh))
    mask_draw.polygon(curve_pts, fill=255)

    banner_img = Image.new('RGBA', (sw, sh), (0, 0, 0, 0))
    banner_img.paste(img, (0, 0), mask)
    draw = ImageDraw.Draw(banner_img)

    for i in range(steps):
        p1 = curve_pts[i]
        p2 = curve_pts[i + 1]
        draw.line([p1, p2], fill=(255, 245, 140, 240), width=6 * scale)
        draw.line([(p1[0], p1[1] + 4 * scale), (p2[0], p2[1] + 4 * scale)], fill=(255, 220, 60, 180), width=4 * scale)

    font_size = 96 * scale
    font = get_font(font_size, is_title=True)
    text = "MERGE NUMBERS"

    bbox = draw.textbbox((0, 0), text, font=font)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    cx = sw // 2
    cy = sh // 2 + 18 * scale
    tx = cx - tw // 2 - bbox[0]
    ty = cy - th // 2 - bbox[1]

    shadow_depth = 12 * scale
    shadow_col = (180, 60, 0, 255)
    for d in range(shadow_depth, 0, -1):
        draw.text((tx, ty + d), text, font=font, fill=shadow_col)

    outline_col = (150, 45, 0, 255)
    out_w = 6 * scale
    for ox in range(-out_w, out_w + 1, 2 * scale):
        for oy in range(-out_w, out_w + 1, 2 * scale):
            if ox*ox + oy*oy <= out_w*out_w:
                draw.text((tx + ox, ty + oy), text, font=font, fill=outline_col)

    draw.text((tx, ty), text, font=font, fill=(255, 255, 255, 255))
    draw.text((tx, ty - 2 * scale), text, font=font, fill=(255, 255, 255, 160))

    final_banner = banner_img.resize((w, h), Image.Resampling.LANCZOS)
    final_banner.save('images/bottom_banner.png')
    print('Created images/bottom_banner.png')

def create_ui_buttons():
    scale = 2
    w, h = 280 * scale, 100 * scale
    img = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    draw_rounded_rect(draw, [4 * scale, 4 * scale, w - 4 * scale, h - 4 * scale], radius=24 * scale,
                      fill=(24, 28, 60, 220), outline=(55, 68, 125, 240), width=3 * scale)
    img.resize((280, 100), Image.Resampling.LANCZOS).save('images/score_card.png')

    def make_circle_btn(name, icon_type):
        size = 110 * scale
        bimg = Image.new('RGBA', (size, size), (0, 0, 0, 0))
        bdraw = ImageDraw.Draw(bimg)
        pad = 8 * scale
        r = (size - pad * 2) // 2
        cx, cy = size // 2, size // 2

        bdraw.ellipse([cx - r, cy - r + 6 * scale, cx + r, cy + r + 6 * scale], fill=(15, 18, 40, 220))
        bdraw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(42, 52, 105, 255), outline=(75, 95, 175, 255), width=3 * scale)
        bdraw.ellipse([cx - r + 3 * scale, cy - r + 3 * scale, cx + r - 3 * scale, cy + r - 3 * scale], outline=(100, 130, 220, 140), width=2 * scale)

        if icon_type == 'restart':
            bbox = [cx - 24 * scale, cy - 24 * scale, cx + 24 * scale, cy + 24 * scale]
            bdraw.arc(bbox, start=45, end=315, fill=(255, 255, 255), width=6 * scale)
            bdraw.polygon([(cx + 16 * scale, cy - 28 * scale), (cx + 30 * scale, cy - 16 * scale), (cx + 12 * scale, cy - 12 * scale)], fill=(255, 255, 255))
        elif icon_type == 'sound_on':
            bdraw.polygon([(cx - 22 * scale, cy - 10 * scale), (cx - 10 * scale, cy - 10 * scale), (cx + 2 * scale, cy - 22 * scale), (cx + 2 * scale, cy + 22 * scale), (cx - 10 * scale, cy + 10 * scale), (cx - 22 * scale, cy + 10 * scale)], fill=(255, 255, 255))
            bdraw.arc([cx - 4 * scale, cy - 16 * scale, cx + 18 * scale, cy + 16 * scale], start=300, end=60, fill=(255, 255, 255), width=4 * scale)
            bdraw.arc([cx + 6 * scale, cy - 24 * scale, cx + 28 * scale, cy + 24 * scale], start=305, end=55, fill=(255, 255, 255), width=4 * scale)
        elif icon_type == 'sound_off':
            bdraw.polygon([(cx - 22 * scale, cy - 10 * scale), (cx - 10 * scale, cy - 10 * scale), (cx + 2 * scale, cy - 22 * scale), (cx + 2 * scale, cy + 22 * scale), (cx - 10 * scale, cy + 10 * scale), (cx - 22 * scale, cy + 10 * scale)], fill=(200, 200, 210))
            bdraw.line([(cx - 20 * scale, cy - 20 * scale), (cx + 22 * scale, cy + 20 * scale)], fill=(240, 70, 70), width=5 * scale)
        elif icon_type == 'shuffle':
            bdraw.line([(cx - 22 * scale, cy - 14 * scale), (cx + 14 * scale, cy + 14 * scale)], fill=(255, 255, 255), width=5 * scale)
            bdraw.line([(cx - 22 * scale, cy + 14 * scale), (cx + 14 * scale, cy - 14 * scale)], fill=(255, 255, 255), width=5 * scale)
            bdraw.polygon([(cx + 12 * scale, cy + 20 * scale), (cx + 24 * scale, cy + 14 * scale), (cx + 20 * scale, cy + 6 * scale)], fill=(255, 255, 255))
            bdraw.polygon([(cx + 12 * scale, cy - 20 * scale), (cx + 24 * scale, cy - 14 * scale), (cx + 20 * scale, cy - 6 * scale)], fill=(255, 255, 255))
        elif icon_type == 'undo':
            bbox = [cx - 24 * scale, cy - 24 * scale, cx + 24 * scale, cy + 24 * scale]
            bdraw.arc(bbox, start=135, end=405, fill=(255, 255, 255), width=6 * scale)
            bdraw.polygon([(cx - 16 * scale, cy - 28 * scale), (cx - 30 * scale, cy - 16 * scale), (cx - 12 * scale, cy - 12 * scale)], fill=(255, 255, 255))

        bimg.resize((100, 100), Image.Resampling.LANCZOS).save(f'images/{name}.png')
        print(f'Created images/{name}.png')

    make_circle_btn('btn_restart', 'restart')
    make_circle_btn('btn_sound_on', 'sound_on')
    make_circle_btn('btn_sound_off', 'sound_off')
    make_circle_btn('btn_shuffle', 'shuffle')
    make_circle_btn('btn_undo', 'undo')

def create_sparkle():
    scale = 2
    size = 64 * scale
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    cx, cy = size // 2, size // 2
    r_outer = 28 * scale
    r_inner = 6 * scale

    pts = []
    for i in range(8):
        ang = i * math.pi / 4
        rad = r_outer if i % 2 == 0 else r_inner
        pts.append((cx + rad * math.cos(ang), cy + rad * math.sin(ang)))

    draw.polygon(pts, fill=(255, 255, 255, 255))
    draw.ellipse([cx - 8 * scale, cy - 8 * scale, cx + 8 * scale, cy + 8 * scale], fill=(255, 240, 160, 255))
    img.resize((64, 64), Image.Resampling.LANCZOS).save('images/particle_sparkle.png')
    print('Created images/particle_sparkle.png')

def create_app_icons():
    sizes = [32, 64, 128, 256, 512]
    master = Image.new('RGBA', (512, 512), (13, 14, 34, 255))
    draw = ImageDraw.Draw(master)
    draw_rounded_rect(draw, [20, 20, 492, 492], radius=110, fill=(25, 28, 64, 255), outline=(50, 60, 120, 255), width=8)

    tiles = [
        (2, 60, 60, 180, (245, 195, 10)),
        (4, 272, 60, 180, (216, 63, 62)),
        (16, 60, 272, 180, (18, 177, 237)),
        (64, 272, 272, 180, (227, 39, 139))
    ]
    font = get_font(72)
    for val, tx, ty, tsize, col in tiles:
        draw_rounded_rect(draw, [tx, ty, tx + tsize, ty + tsize], radius=32, fill=col)
        txt = str(val)
        bbox = draw.textbbox((0, 0), txt, font=font)
        tw = bbox[2] - bbox[0]
        th = bbox[3] - bbox[1]
        draw.text((tx + tsize // 2 - tw // 2 - bbox[0], ty + tsize // 2 - th // 2 - bbox[1]), txt, font=font,
                  fill=(110, 70, 5) if val == 2 else (255, 255, 255))

    draw.line([(150, 150), (362, 150)], fill=(255, 225, 50), width=18)
    draw.ellipse([140, 140, 160, 160], fill=(255, 255, 255))
    draw.ellipse([352, 140, 372, 140], fill=(255, 255, 255))

    for sz in sizes:
        icon_img = master.resize((sz, sz), Image.Resampling.LANCZOS)
        icon_img.save(f'icons/icon-{sz}.png')
        print(f'Created icons/icon-{sz}.png')

if __name__ == '__main__':
    print('Generating Merge Numbers game assets...')
    for val in [2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048, 4096]:
        create_tile(val)
    create_tile_slot()
    create_background()
    create_bottom_banner()
    create_ui_buttons()
    create_sparkle()
    create_app_icons()
    print('Assets ready!')
