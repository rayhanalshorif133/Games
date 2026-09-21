import os
import math
import random
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageChops

ASSETS_DIR = r"e:\Rayhan\Practice\Games\game-cooker\assets"
OUTPUT_DIR = ASSETS_DIR

# Target poster dimensions
TARGET_W = 630
TARGET_H = 500

# 4x Supersampling for ultra-crisp graphics
SCALE = 4
CANVAS_W = TARGET_W * SCALE   # 2520
CANVAS_H = TARGET_H * SCALE   # 2000

def load_font(name_candidates, size):
    for name in name_candidates:
        path = os.path.join(r"C:\Windows\Fonts", name)
        if os.path.exists(path):
            try:
                return ImageFont.truetype(path, size)
            except Exception:
                pass
    return ImageFont.load_default()

# Typography (scaled for 2520x2000 canvas)
font_title = load_font(["ariblk.ttf", "impact.ttf", "arialbd.ttf"], int(178 * SCALE / 4))
font_tagline = load_font(["segoeuib.ttf", "bahnschrift.ttf", "arialbd.ttf"], int(44 * SCALE / 4))
font_btn = load_font(["ariblk.ttf", "segoeuib.ttf", "arialbd.ttf"], int(74 * SCALE / 4))
font_badge_title = load_font(["segoeuib.ttf", "arialbd.ttf"], int(38 * SCALE / 4))
font_badge_sub = load_font(["segoeui.ttf", "arial.ttf"], int(26 * SCALE / 4))
font_combo = load_font(["ariblk.ttf", "impact.ttf"], int(50 * SCALE / 4))

def get_asset(filename):
    path = os.path.join(ASSETS_DIR, filename)
    return Image.open(path).convert("RGBA")

assets = {
    'dot_blue': get_asset('dot_blue.png'),
    'dot_purple': get_asset('dot_purple.png'),
    'dot_red': get_asset('dot_red.png'),
    'dot_yellow': get_asset('dot_yellow.png'),
    'dot_highlight': get_asset('dot_highlight.png'),
    'btn_green': get_asset('btn_green.png'),
    'icon_play': get_asset('icon_play.png'),
    'icon_coin': get_asset('icon_coin.png'),
    'icon_trophy': get_asset('icon_trophy.png'),
    'icon_moves': get_asset('icon_moves.png'),
    'icon_check': get_asset('icon_check.png'),
    'star_filled': get_asset('star_filled.png'),
    'star_empty': get_asset('star_empty.png'),
}

def create_gradient_bg(w, h):
    base = Image.new("RGBA", (w, h), (0, 0, 0, 255))
    draw = ImageDraw.Draw(base)
    
    # Modern deep space navy gradient
    c_top = (16, 24, 48)      # #101830
    c_mid = (11, 16, 34)      # #0B1022
    c_bot = (7, 10, 20)       # #070A14
    
    for y in range(h):
        ratio = y / h
        if ratio < 0.5:
            t = ratio / 0.5
            r = int(c_top[0] + (c_mid[0] - c_top[0]) * t)
            g = int(c_top[1] + (c_mid[1] - c_top[1]) * t)
            b = int(c_top[2] + (c_mid[2] - c_top[2]) * t)
        else:
            t = (ratio - 0.5) / 0.5
            r = int(c_mid[0] + (c_bot[0] - c_mid[0]) * t)
            g = int(c_mid[1] + (c_bot[1] - c_mid[1]) * t)
            b = int(c_mid[2] + (c_bot[2] - c_mid[2]) * t)
        draw.line([(0, y), (w, y)], fill=(r, g, b, 255))
        
    return base

def add_radial_glow(canvas, center_x, center_y, radius, color, max_alpha=120):
    glow = Image.new("RGBA", (radius * 2, radius * 2), (0, 0, 0, 0))
    gdraw = ImageDraw.Draw(glow)
    
    for r in range(radius, 0, -4):
        t = 1.0 - (r / radius)
        alpha = int(max_alpha * (t ** 1.8))
        if alpha > 0:
            gdraw.ellipse([radius - r, radius - r, radius + r, radius + r],
                          fill=(color[0], color[1], color[2], alpha))
            
    glow_blurred = glow.filter(ImageFilter.GaussianBlur(radius // 7))
    canvas.alpha_composite(glow_blurred, (int(center_x - radius), int(center_y - radius)))

def add_grid_pattern(canvas, w, h):
    grid_img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(grid_img)
    
    spacing = 72
    for x in range(spacing // 2, w, spacing):
        for y in range(spacing // 2, h, spacing):
            draw.ellipse([x - 2, y - 2, x + 2, y + 2], fill=(255, 255, 255, 18))
            
    random.seed(105)
    conn_colors = [(110, 168, 254, 40), (157, 93, 229, 40), (248, 207, 71, 35)]
    for _ in range(18):
        x1 = random.randint(1, w // spacing - 1) * spacing + spacing // 2
        y1 = random.randint(1, h // spacing - 1) * spacing + spacing // 2
        dx, dy = random.choice([(1, 0), (0, 1), (1, 1), (-1, 1), (2, 0), (0, 2)])
        steps = random.randint(1, 3)
        x2 = x1 + dx * spacing * steps
        y2 = y1 + dy * spacing * steps
        col = random.choice(conn_colors)
        draw.line([(x1, y1), (x2, y2)], fill=col, width=3)
        draw.ellipse([x1 - 4, y1 - 4, x1 + 4, y1 + 4], fill=(col[0], col[1], col[2], 70))
        draw.ellipse([x2 - 4, y2 - 4, x2 + 4, y2 + 4], fill=(col[0], col[1], col[2], 70))
        
    canvas.alpha_composite(grid_img)

def draw_sparkle(canvas, cx, cy, size, color=(255, 255, 255, 255)):
    sparkle = Image.new("RGBA", (size * 2, size * 2), (0, 0, 0, 0))
    draw = ImageDraw.Draw(sparkle)
    
    for i in range(size, 0, -2):
        t = i / size
        w = max(1, int(size * 0.18 * t))
        draw.polygon([(size, size - i), (size + w, size), (size, size + i), (size - w, size)],
                     fill=(color[0], color[1], color[2], int(color[3] * t)))
        draw.polygon([(size - i, size), (size, size + w), (size + i, size), (size - w, size)],
                     fill=(color[0], color[1], color[2], int(color[3] * t)))
        
    c_rad = max(2, int(size * 0.28))
    draw.ellipse([size - c_rad, size - c_rad, size + c_rad, size + c_rad], fill=(255, 255, 255, 255))
    
    canvas.alpha_composite(sparkle, (int(cx - size), int(cy - size)))

def paste_with_shadow(canvas, img, x, y, shadow_offset=(0, 22), shadow_blur=26, shadow_alpha=160, rotation=0, scale_factor=1.0):
    if scale_factor != 1.0:
        nw = max(1, int(img.width * scale_factor))
        nh = max(1, int(img.height * scale_factor))
        img = img.resize((nw, nh), Image.Resampling.LANCZOS)
        
    if rotation != 0:
        img = img.rotate(rotation, expand=True, resample=Image.Resampling.BICUBIC)
        
    w, h = img.width, img.height
    
    if shadow_alpha > 0:
        pad = shadow_blur * 3
        shadow_img = Image.new("RGBA", (w + pad * 2, h + pad * 2), (0, 0, 0, 0))
        r, g, b, a = img.split()
        shadow_fill = Image.merge("RGBA", (
            Image.new("L", (w, h), 0),
            Image.new("L", (w, h), 0),
            Image.new("L", (w, h), 0),
            a
        ))
        shadow_img.paste(shadow_fill, (pad, pad), shadow_fill)
        shadow_img = shadow_img.filter(ImageFilter.GaussianBlur(shadow_blur))
        
        r, g, b, sa = shadow_img.split()
        sa = sa.point(lambda p: int(p * (shadow_alpha / 255.0)))
        shadow_img.putalpha(sa)
        
        sx = int(x + shadow_offset[0] - pad)
        sy = int(y + shadow_offset[1] - pad)
        canvas.alpha_composite(shadow_img, (sx, sy))
        
    canvas.alpha_composite(img, (int(x), int(y)))

def render_word(text, font, top_color, bottom_color, outline_color, depth_color, depth=18, stroke_w=14):
    dummy = Image.new('RGBA', (1, 1))
    dd = ImageDraw.Draw(dummy)
    bbox = dd.textbbox((0, 0), text, font=font)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    
    pad = 80
    img_w = tw + pad * 2
    img_h = th + pad * 2 + depth + 30
    
    tx = pad - bbox[0]
    ty = pad - bbox[1]
    
    img = Image.new('RGBA', (img_w, img_h), (0, 0, 0, 0))
    
    # 1. Drop shadow
    shadow = Image.new('RGBA', (img_w, img_h), (0, 0, 0, 0))
    sdraw = ImageDraw.Draw(shadow)
    sdraw.text((tx, ty + depth + 14), text, font=font, fill=(0, 0, 0, 220), stroke_width=stroke_w, stroke_fill=(0, 0, 0, 220))
    shadow = shadow.filter(ImageFilter.GaussianBlur(16))
    img.alpha_composite(shadow)
    
    # 2. 3D extrusion
    draw = ImageDraw.Draw(img)
    for d in range(depth, 0, -1):
        draw.text((tx, ty + d), text, font=font, fill=depth_color, stroke_width=stroke_w, stroke_fill=depth_color)
        
    # 3. Outer dark outline
    draw.text((tx, ty), text, font=font, fill=outline_color, stroke_width=stroke_w, stroke_fill=outline_color)
    
    # 4. Text face mask
    mask = Image.new('L', (img_w, img_h), 0)
    ImageDraw.Draw(mask).text((tx, ty), text, font=font, fill=255)
    
    # 5. Gradient face covering text area
    grad = Image.new('RGBA', (img_w, img_h), (0, 0, 0, 0))
    gdraw = ImageDraw.Draw(grad)
    for y in range(pad, pad + th + 1):
        t = (y - pad) / max(1, th)
        r = int(top_color[0] + (bottom_color[0] - top_color[0]) * t)
        g = int(top_color[1] + (bottom_color[1] - top_color[1]) * t)
        b = int(top_color[2] + (bottom_color[2] - top_color[2]) * t)
        gdraw.line([(0, y), (img_w, y)], fill=(r, g, b, 255))
        
    # Add top gloss sheen
    sheen_h = int(th * 0.45)
    for y in range(pad, pad + sheen_h):
        t = (y - pad) / sheen_h
        cr = int(top_color[0] + (255 - top_color[0]) * (1.0 - t))
        cg = int(top_color[1] + (255 - top_color[1]) * (1.0 - t))
        cb = int(top_color[2] + (255 - top_color[2]) * (1.0 - t))
        gdraw.line([(0, y), (img_w, y)], fill=(cr, cg, cb, 255))
        
    grad.putalpha(mask)
    img.alpha_composite(grad)
    
    return img, tw, th, pad

def render_title_section(canvas, cy):
    word_dot, w_dot, h_dot, pad_dot = render_word('DOT', font_title,
                                                   (255, 255, 255), (75, 185, 255),
                                                   (8, 20, 50), (16, 42, 90),
                                                   depth=18, stroke_w=14)
    word_conn, w_conn, h_conn, pad_conn = render_word('CONNECTS', font_title,
                                                      (255, 250, 175), (255, 155, 20),
                                                      (45, 18, 5), (135, 55, 10),
                                                      depth=18, stroke_w=14)
    
    gap = 40
    total_w = w_dot + gap + w_conn
    start_x = (CANVAS_W - total_w) // 2
    
    dot_x = start_x - pad_dot
    dot_y = cy - word_dot.height // 2
    canvas.alpha_composite(word_dot, (dot_x, dot_y))
    
    conn_x = start_x + w_dot + gap - pad_conn
    conn_y = cy - word_conn.height // 2
    canvas.alpha_composite(word_conn, (conn_x, conn_y))

def create_play_button(w, h, font, text="PLAY NOW !"):
    surf = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    sdraw = ImageDraw.Draw(surf)
    
    # Rich Emerald Green Gradient
    for y in range(h):
        t = y / h
        if t < 0.5:
            rt = t / 0.5
            r = int(50 + (39 - 50) * rt)
            g = int(214 + (174 - 214) * rt)
            b = int(120 + (96 - 120) * rt)
        else:
            rt = (t - 0.5) / 0.5
            r = int(39 + (22 - 39) * rt)
            g = int(174 + (130 - 174) * rt)
            b = int(96 + (65 - 96) * rt)
        sdraw.line([(0, y), (w, y)], fill=(r, g, b, 255))
        
    mask = Image.new("L", (w, h), 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, w - 1, h - 1], radius=h // 2, fill=255)
    surf.putalpha(mask)
    
    # Top highlight sheen
    sheen = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    shdraw = ImageDraw.Draw(sheen)
    for y in range(h // 2):
        alpha = int(120 * (1.0 - y / (h // 2)))
        shdraw.line([(0, y), (w, y)], fill=(255, 255, 255, alpha))
    r, g, b, a = sheen.split()
    sheen.putalpha(ImageChops.multiply(a, mask))
    surf.alpha_composite(sheen)
    
    # White Outline
    ImageDraw.Draw(surf).rounded_rectangle([0, 0, w - 1, h - 1], radius=h // 2,
                                           outline=(255, 255, 255, 240), width=5)
                                           
    # Play Icon + Text
    play_icon_scaled = assets['icon_play'].resize((int(h * 0.56), int(h * 0.56)), Image.Resampling.LANCZOS)
    
    dummy = Image.new("RGBA", (1, 1))
    dd = ImageDraw.Draw(dummy)
    btn_bbox = dd.textbbox((0, 0), text, font=font)
    btw = btn_bbox[2] - btn_bbox[0]
    bth = btn_bbox[3] - btn_bbox[1]
    
    icon_w = play_icon_scaled.width
    gap = 26
    total_content_w = icon_w + gap + btw
    start_x = (w - total_content_w) // 2
    
    surf.alpha_composite(play_icon_scaled, (start_x, (h - icon_w) // 2))
    
    # Text with 3D drop shadow
    tx = start_x + icon_w + gap - btn_bbox[0]
    ty = (h - bth) // 2 - btn_bbox[1]
    
    ImageDraw.Draw(surf).text((tx, ty + 5), text, font=font, fill=(10, 65, 35, 220))
    ImageDraw.Draw(surf).text((tx, ty), text, font=font, fill=(255, 255, 255, 255))
    
    return surf

def create_combo_badge(w, h, text="COMBO x4!"):
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Coral-Red Gradient
    for y in range(h):
        t = y / h
        r = int(245 + (215 - 245) * t)
        g = int(75 + (50 - 75) * t)
        b = int(90 + (65 - 90) * t)
        draw.line([(0, y), (w, y)], fill=(r, g, b, 255))
        
    mask = Image.new("L", (w, h), 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, w - 1, h - 1], radius=h // 2, fill=255)
    img.putalpha(mask)
    
    # Sheen
    sheen = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    shdraw = ImageDraw.Draw(sheen)
    for y in range(h // 2):
        alpha = int(110 * (1.0 - y / (h // 2)))
        shdraw.line([(0, y), (w, y)], fill=(255, 255, 255, alpha))
    r, g, b, a = sheen.split()
    sheen.putalpha(ImageChops.multiply(a, mask))
    img.alpha_composite(sheen)
    
    ImageDraw.Draw(img).rounded_rectangle([0, 0, w - 1, h - 1], radius=h // 2,
                                          outline=(255, 255, 255, 240), width=4)
                                          
    dummy = Image.new("RGBA", (1, 1))
    dd = ImageDraw.Draw(dummy)
    cbbox = dd.textbbox((0, 0), text, font=font_combo)
    cw = cbbox[2] - cbbox[0]
    ch = cbbox[3] - cbbox[1]
    
    tx = (w - cw) // 2 - cbbox[0]
    ty = (h - ch) // 2 - cbbox[1]
    
    ImageDraw.Draw(img).text((tx, ty + 3), text, font=font_combo, fill=(120, 20, 30, 220))
    ImageDraw.Draw(img).text((tx, ty), text, font=font_combo, fill=(255, 255, 255, 255))
    
    return img

def build_poster():
    print("Composing high-aesthetic Dot Connects poster at 2520x2000...")
    canvas = create_gradient_bg(CANVAS_W, CANVAS_H)
    
    # Ambient Lighting Blooms
    add_radial_glow(canvas, CANVAS_W // 2, 280, 850, (110, 190, 255), max_alpha=80)   # Title Cyan Glow
    add_radial_glow(canvas, CANVAS_W // 2, 980, 950, (165, 95, 245), max_alpha=90)   # Center Board Purple Glow
    add_radial_glow(canvas, 380, 1000, 700, (248, 207, 71), max_alpha=60)            # Left Yellow Glow
    add_radial_glow(canvas, CANVAS_W - 380, 1000, 700, (238, 89, 101), max_alpha=60) # Right Red Glow
    add_radial_glow(canvas, CANVAS_W // 2, 1730, 650, (46, 204, 113), max_alpha=90)  # Bottom Green Glow
    
    # Background Grid pattern
    add_grid_pattern(canvas, CANVAS_W, CANVAS_H)
    
    # -------------------------------------------------------------
    # 1. TOP HEADER: Stars, 3D Title, & Tagline
    # -------------------------------------------------------------
    star_center_x = CANVAS_W // 2
    star_y = 95
    
    # Golden Star Glow Halo
    add_radial_glow(canvas, star_center_x, star_y + 40, 320, (255, 215, 0), max_alpha=80)
    
    # Center Star
    paste_with_shadow(canvas, assets['star_filled'], star_center_x - 85, star_y - 25,
                      shadow_offset=(0, 14), shadow_blur=22, shadow_alpha=170, scale_factor=0.72)
    # Left Star
    paste_with_shadow(canvas, assets['star_filled'], star_center_x - 230, star_y,
                      shadow_offset=(0, 10), shadow_blur=18, shadow_alpha=150, rotation=-15, scale_factor=0.55)
    # Right Star
    paste_with_shadow(canvas, assets['star_filled'], star_center_x + 90, star_y,
                      shadow_offset=(0, 10), shadow_blur=18, shadow_alpha=150, rotation=15, scale_factor=0.55)
    
    # Star Sparkles
    draw_sparkle(canvas, star_center_x, star_y + 45, 34, (255, 255, 220, 255))
    draw_sparkle(canvas, star_center_x - 170, star_y + 55, 24, (255, 255, 255, 230))
    draw_sparkle(canvas, star_center_x + 170, star_y + 55, 24, (255, 255, 255, 230))
    
    # Main 3D Title "DOT CONNECTS"
    render_title_section(canvas, 275)
    
    # Subtitle Pill: "★ CONNECT • MATCH • SOLVE ★"
    tagline_text = "CONNECT   •   MATCH   •   SOLVE !"
    dummy = Image.new("RGBA", (1, 1))
    ddraw = ImageDraw.Draw(dummy)
    tb_box = ddraw.textbbox((0, 0), tagline_text, font=font_tagline)
    tb_w = tb_box[2] - tb_box[0]
    tb_h = tb_box[3] - tb_box[1]
    
    pill_w = tb_w + 100
    pill_h = tb_h + 38
    pill_x = (CANVAS_W - pill_w) // 2
    pill_y = 405
    
    pill_img = Image.new("RGBA", (pill_w, pill_h), (0, 0, 0, 0))
    pdraw = ImageDraw.Draw(pill_img)
    for py in range(pill_h):
        t = py / pill_h
        r = int(28 + (18 - 28) * t)
        g = int(42 + (28 - 42) * t)
        b = int(78 + (54 - 78) * t)
        pdraw.line([(0, py), (pill_w, py)], fill=(r, g, b, 235))
        
    pmask = Image.new("L", (pill_w, pill_h), 0)
    ImageDraw.Draw(pmask).rounded_rectangle([0, 0, pill_w - 1, pill_h - 1], radius=pill_h // 2, fill=255)
    pill_img.putalpha(pmask)
    
    # Border
    ImageDraw.Draw(pill_img).rounded_rectangle([0, 0, pill_w - 1, pill_h - 1], radius=pill_h // 2,
                                               outline=(120, 180, 255, 220), width=3)
                                               
    # Sheen
    psheen = Image.new("RGBA", (pill_w, pill_h), (0, 0, 0, 0))
    pshdraw = ImageDraw.Draw(psheen)
    for py in range(pill_h // 2):
        pa = int(70 * (1.0 - py / (pill_h // 2)))
        pshdraw.line([(0, py), (pill_w, py)], fill=(255, 255, 255, pa))
    r, g, b, a = psheen.split()
    psheen.putalpha(ImageChops.multiply(a, pmask))
    pill_img.alpha_composite(psheen)
    
    paste_with_shadow(canvas, pill_img, pill_x, pill_y, shadow_offset=(0, 8), shadow_blur=16, shadow_alpha=120)
    
    draw_t = ImageDraw.Draw(canvas)
    draw_t.text((pill_x + 50 - tb_box[0], pill_y + 19 - tb_box[1]), tagline_text,
                font=font_tagline, fill=(245, 250, 255, 255))
    draw_sparkle(canvas, pill_x + 28, pill_y + pill_h // 2, 16, (255, 235, 140, 255))
    draw_sparkle(canvas, pill_x + pill_w - 28, pill_y + pill_h // 2, 16, (255, 235, 140, 255))

    # -------------------------------------------------------------
    # 2. CENTER HERO: Frosted Glass Board & Match Action
    # -------------------------------------------------------------
    board_w = 1140
    board_h = 860
    board_x = (CANVAS_W - board_w) // 2
    board_y = 530
    
    # Smooth Glass Card Surface
    card_img = Image.new("RGBA", (board_w, board_h), (0, 0, 0, 0))
    cdraw = ImageDraw.Draw(card_img)
    
    for cy in range(board_h):
        t = cy / board_h
        cr = int(24 + (14 - 24) * t)
        cg = int(34 + (20 - 34) * t)
        cb = int(64 + (40 - 64) * t)
        cdraw.line([(0, cy), (board_w, cy)], fill=(cr, cg, cb, 235))
        
    card_mask = Image.new("L", (board_w, board_h), 0)
    ImageDraw.Draw(card_mask).rounded_rectangle([0, 0, board_w - 1, board_h - 1], radius=50, fill=255)
    card_img.putalpha(card_mask)
    
    # Glowing border
    ImageDraw.Draw(card_img).rounded_rectangle([0, 0, board_w - 1, board_h - 1], radius=50,
                                               outline=(90, 130, 210, 180), width=4)
                                               
    paste_with_shadow(canvas, card_img, board_x, board_y, shadow_offset=(0, 26), shadow_blur=40, shadow_alpha=180)
    
    # Grid of tiles inside board
    grid_cols = 4
    grid_rows = 3
    tile_size = 184
    gap_x = 55
    gap_y = 55
    
    grid_total_w = grid_cols * tile_size + (grid_cols - 1) * gap_x
    grid_total_h = grid_rows * tile_size + (grid_rows - 1) * gap_y
    
    grid_start_x = board_x + (board_w - grid_total_w) // 2
    grid_start_y = board_y + (board_h - grid_total_h) // 2
    
    grid_matrix = [
        ['dot_purple', 'dot_purple', 'dot_yellow', 'dot_red'],
        ['dot_blue',   'dot_purple', 'dot_purple', 'dot_blue'],
        ['dot_red',    'dot_yellow', 'dot_red',    'dot_yellow']
    ]
    connected_coords = [(0, 0), (1, 0), (1, 1), (2, 1)]
    
    tile_centers = {}
    for r in range(grid_rows):
        for c in range(grid_cols):
            tx = grid_start_x + c * (tile_size + gap_x)
            ty = grid_start_y + r * (tile_size + gap_y)
            tile_centers[(c, r)] = (tx + tile_size // 2, ty + tile_size // 2)
            
    # Dark recessed tile slots
    slot_draw = ImageDraw.Draw(canvas)
    for r in range(grid_rows):
        for c in range(grid_cols):
            tx = grid_start_x + c * (tile_size + gap_x)
            ty = grid_start_y + r * (tile_size + gap_y)
            slot_draw.rounded_rectangle([tx - 6, ty - 6, tx + tile_size + 6, ty + tile_size + 6],
                                        radius=44, fill=(10, 16, 32, 200), outline=(45, 62, 105, 140), width=2)
                                        
    # 1. Base Layer connection glow (Behind tiles)
    conn_bg = Image.new("RGBA", (CANVAS_W, CANVAS_H), (0, 0, 0, 0))
    bg_draw = ImageDraw.Draw(conn_bg)
    path_points = [tile_centers[coord] for coord in connected_coords]
    for i in range(len(path_points) - 1):
        bg_draw.line([path_points[i], path_points[i+1]], fill=(195, 75, 255, 200), width=90, joint='curve')
    for pt in path_points:
        bg_draw.ellipse([pt[0] - 70, pt[1] - 70, pt[0] + 70, pt[1] + 70], fill=(195, 75, 255, 200))
    conn_bg = conn_bg.filter(ImageFilter.GaussianBlur(30))
    canvas.alpha_composite(conn_bg)
    
    # Draw Dot Tiles on Grid
    for r in range(grid_rows):
        for c in range(grid_cols):
            tile_name = grid_matrix[r][c]
            tx = grid_start_x + c * (tile_size + gap_x)
            ty = grid_start_y + r * (tile_size + gap_y)
            
            is_connected = (c, r) in connected_coords
            scale_f = (tile_size / 256.0) * (1.10 if is_connected else 1.0)
            cur_x = tx - (tile_size * 0.05 if is_connected else 0)
            cur_y = ty - (tile_size * 0.05 if is_connected else 0)
            
            paste_with_shadow(canvas, assets[tile_name], cur_x, cur_y,
                              shadow_offset=(0, 14 if is_connected else 8),
                              shadow_blur=18 if is_connected else 12,
                              shadow_alpha=180 if is_connected else 130,
                              scale_factor=scale_f)
                              
            if is_connected:
                hl_scale = scale_f * 1.04
                paste_with_shadow(canvas, assets['dot_highlight'], cur_x, cur_y,
                                  shadow_offset=(0, 0), shadow_blur=0, shadow_alpha=0,
                                  scale_factor=hl_scale)

    # 2. Foreground Laser Beam (On top of tiles for energetic connected look!)
    conn_fg = Image.new("RGBA", (CANVAS_W, CANVAS_H), (0, 0, 0, 0))
    fg_draw = ImageDraw.Draw(conn_fg)
    for i in range(len(path_points) - 1):
        fg_draw.line([path_points[i], path_points[i+1]], fill=(255, 120, 255, 220), width=26, joint='curve')
    conn_fg = conn_fg.filter(ImageFilter.GaussianBlur(6))
    
    core_draw = ImageDraw.Draw(conn_fg)
    for i in range(len(path_points) - 1):
        core_draw.line([path_points[i], path_points[i+1]], fill=(255, 255, 255, 255), width=10, joint='curve')
        
    for pt in path_points:
        core_draw.ellipse([pt[0] - 16, pt[1] - 16, pt[0] + 16, pt[1] + 16], fill=(255, 255, 255, 255))
        
    canvas.alpha_composite(conn_fg)
    
    # Connected sparkle stars
    for pt in path_points:
        draw_sparkle(canvas, pt[0], pt[1], 34, (255, 255, 255, 255))
                
    # Floating Dynamic "COMBO x4!" Badge
    combo_w = 340
    combo_h = 84
    combo_x = board_x + board_w - combo_w - 30
    combo_y = board_y + 36
    combo_badge = create_combo_badge(combo_w, combo_h, "COMBO x4!")
    paste_with_shadow(canvas, combo_badge, combo_x, combo_y,
                      shadow_offset=(0, 12), shadow_blur=20, shadow_alpha=170, rotation=-7)
    draw_sparkle(canvas, combo_x + combo_w - 10, combo_y + 10, 28, (255, 245, 160, 255))

    # -------------------------------------------------------------
    # 3. FLOATING 3D HERO ASSETS (Surroundings)
    # -------------------------------------------------------------
    # Left Side:
    # 1. Big Yellow Dot
    paste_with_shadow(canvas, assets['dot_yellow'], 100, 590,
                      shadow_offset=(18, 28), shadow_blur=38, shadow_alpha=180,
                      rotation=-18, scale_factor=0.98)
                      
    # 2. Golden Coin with sparkle
    paste_with_shadow(canvas, assets['icon_coin'], 230, 930,
                      shadow_offset=(12, 22), shadow_blur=32, shadow_alpha=190,
                      rotation=16, scale_factor=0.96)
    draw_sparkle(canvas, 310, 970, 44, (255, 255, 220, 255))
    
    # 3. Blue Dot
    paste_with_shadow(canvas, assets['dot_blue'], 80, 1180,
                      shadow_offset=(14, 24), shadow_blur=30, shadow_alpha=160,
                      rotation=14, scale_factor=0.80)
                      
    # Right Side:
    # 1. Big Red Dot
    paste_with_shadow(canvas, assets['dot_red'], CANVAS_W - 350, 580,
                      shadow_offset=(-18, 28), shadow_blur=38, shadow_alpha=180,
                      rotation=18, scale_factor=0.98)
                      
    # 2. Golden Trophy
    paste_with_shadow(canvas, assets['icon_trophy'], CANVAS_W - 500, 900,
                      shadow_offset=(-12, 22), shadow_blur=34, shadow_alpha=190,
                      rotation=-12, scale_factor=1.05)
    draw_sparkle(canvas, CANVAS_W - 380, 950, 46, (255, 255, 220, 255))
    draw_sparkle(canvas, CANVAS_W - 490, 1020, 28, (255, 255, 255, 230))
    
    # 3. Purple Dot
    paste_with_shadow(canvas, assets['dot_purple'], CANVAS_W - 330, 1190,
                      shadow_offset=(-14, 24), shadow_blur=30, shadow_alpha=160,
                      rotation=-15, scale_factor=0.80)
                      
    # Ambient Star Sparkles
    draw_sparkle(canvas, 220, 520, 30, (255, 240, 160, 220))
    draw_sparkle(canvas, CANVAS_W - 220, 510, 30, (255, 240, 160, 220))
    draw_sparkle(canvas, 560, 520, 22, (255, 255, 255, 200))
    draw_sparkle(canvas, CANVAS_W - 560, 520, 22, (255, 255, 255, 200))

    # -------------------------------------------------------------
    # 4. BOTTOM CALL-TO-ACTION & FEATURE BADGES
    # -------------------------------------------------------------
    # 1. Central "PLAY NOW !" Emerald Button
    btn_w = 700
    btn_h = 170
    btn_x = (CANVAS_W - btn_w) // 2
    btn_y = 1650
    btn_img = create_play_button(btn_w, btn_h, font_btn, "PLAY NOW !")
    paste_with_shadow(canvas, btn_img, btn_x, btn_y, shadow_offset=(0, 18), shadow_blur=32, shadow_alpha=200)
    
    draw_sparkle(canvas, btn_x + btn_w - 36, btn_y + 28, 34, (255, 255, 255, 255))
    draw_sparkle(canvas, btn_x + 45, btn_y + btn_h - 32, 26, (255, 255, 255, 240))

    # 2. Left Feature Badge: "100+ LEVELS"
    lbadge_w = 440
    lbadge_h = 136
    lbadge_x = 170
    lbadge_y = 1666
    
    lbadge_img = Image.new("RGBA", (lbadge_w, lbadge_h), (0, 0, 0, 0))
    ldraw = ImageDraw.Draw(lbadge_img)
    for ly in range(lbadge_h):
        t = ly / lbadge_h
        r = int(26 + (16 - 26) * t)
        g = int(38 + (24 - 38) * t)
        b = int(72 + (48 - 72) * t)
        ldraw.line([(0, ly), (lbadge_w, ly)], fill=(r, g, b, 230))
        
    lbmask = Image.new("L", (lbadge_w, lbadge_h), 0)
    ImageDraw.Draw(lbmask).rounded_rectangle([0, 0, lbadge_w - 1, lbadge_h - 1], radius=34, fill=255)
    lbadge_img.putalpha(lbmask)
    
    ImageDraw.Draw(lbadge_img).rounded_rectangle([0, 0, lbadge_w - 1, lbadge_h - 1], radius=34,
                                                 outline=(80, 115, 185, 200), width=3)
                                                 
    moves_icon = assets['icon_moves'].resize((82, 82), Image.Resampling.LANCZOS)
    lbadge_img.alpha_composite(moves_icon, (24, (lbadge_h - 82) // 2))
    
    ldraw.text((120, 26), "100+ LEVELS", font=font_badge_title, fill=(255, 255, 255, 255))
    ldraw.text((120, 76), "Challenging Puzzles", font=font_badge_sub, fill=(175, 200, 240, 255))
    
    paste_with_shadow(canvas, lbadge_img, lbadge_x, lbadge_y, shadow_offset=(0, 14), shadow_blur=24, shadow_alpha=150)

    # 3. Right Feature Badge: "BRAIN PUZZLE"
    rbadge_w = 440
    rbadge_h = 136
    rbadge_x = CANVAS_W - rbadge_w - 170
    rbadge_y = 1666
    
    rbadge_img = Image.new("RGBA", (rbadge_w, rbadge_h), (0, 0, 0, 0))
    rdraw = ImageDraw.Draw(rbadge_img)
    for ry in range(rbadge_h):
        t = ry / rbadge_h
        r = int(26 + (16 - 26) * t)
        g = int(38 + (24 - 38) * t)
        b = int(72 + (48 - 72) * t)
        rdraw.line([(0, ry), (rbadge_w, ry)], fill=(r, g, b, 230))
        
    rbmask = Image.new("L", (rbadge_w, rbadge_h), 0)
    ImageDraw.Draw(rbmask).rounded_rectangle([0, 0, rbadge_w - 1, rbadge_h - 1], radius=34, fill=255)
    lbadge_img.putalpha(rbmask)
    
    ImageDraw.Draw(rbadge_img).rounded_rectangle([0, 0, rbadge_w - 1, rbadge_h - 1], radius=34,
                                                 outline=(80, 115, 185, 200), width=3)
                                                 
    check_icon = assets['icon_check'].resize((82, 82), Image.Resampling.LANCZOS)
    rbadge_img.alpha_composite(check_icon, (24, (lbadge_h - 82) // 2))
    
    rdraw.text((120, 26), "BRAIN PUZZLE", font=font_badge_title, fill=(255, 255, 255, 255))
    rdraw.text((120, 76), "Free & Addictive", font=font_badge_sub, fill=(175, 200, 240, 255))
    
    paste_with_shadow(canvas, rbadge_img, rbadge_x, rbadge_y, shadow_offset=(0, 14), shadow_blur=24, shadow_alpha=150)

    # -------------------------------------------------------------
    # 5. CORNER VIGNETTE
    # -------------------------------------------------------------
    vignette = Image.new("RGBA", (CANVAS_W, CANVAS_H), (0, 0, 0, 0))
    ImageDraw.Draw(vignette).rectangle([0, 0, CANVAS_W, CANVAS_H], fill=(0, 0, 0, 0), outline=(0, 0, 0, 100), width=70)
    vignette = vignette.filter(ImageFilter.GaussianBlur(70))
    canvas.alpha_composite(vignette)

    # -------------------------------------------------------------
    # 6. DOWNSAMPLE TO TARGET SIZE (630 x 500)
    # -------------------------------------------------------------
    print(f"Downsampling to exact target dimensions: {TARGET_W}x{TARGET_H} with Lanczos antialiasing...")
    poster_final = canvas.resize((TARGET_W, TARGET_H), Image.Resampling.LANCZOS)
    
    out_paths = [
        os.path.join(OUTPUT_DIR, "poster.png"),
        os.path.join(r"e:\Rayhan\Practice\Games\game-cooker", "poster.png"),
        os.path.join(r"e:\Rayhan\Practice\Games\game-cooker\demo\images", "poster.png")
    ]
    
    for p in out_paths:
        os.makedirs(os.path.dirname(p), exist_ok=True)
        poster_final.save(p, "PNG", optimize=True)
        print(f"Saved: {p}")
        
    hd_path = os.path.join(OUTPUT_DIR, "poster_2x.png")
    canvas.resize((TARGET_W * 2, TARGET_H * 2), Image.Resampling.LANCZOS).save(hd_path, "PNG", optimize=True)
    print(f"Saved 2x HD: {hd_path}")

if __name__ == "__main__":
    build_poster()

