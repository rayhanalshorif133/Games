import os
import math
from PIL import Image, ImageDraw, ImageFilter, ImageFont

os.makedirs('images', exist_ok=True)
os.makedirs('icons', exist_ok=True)
os.makedirs('scripts', exist_ok=True)

# System font resolution for crisp text
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

# -------------------------------------------------------------
# 1. Background Bus Station (Top Area) & Grass Base (1080 x 1920)
# -------------------------------------------------------------
def create_background():
    img = Image.new('RGBA', (1080, 1920), (126, 203, 71, 255))
    draw = ImageDraw.Draw(img)

    # Sky gradient at the top (0 to 220)
    for y in range(220):
        t = y / 220.0
        r = int(195 + (235 - 195) * t)
        g = int(220 + (240 - 220) * t)
        b = int(255 + (250 - 255) * t)
        draw.line([(0, y), (1080, y)], fill=(r, g, b, 255))

    # Clouds
    cloud_color = (255, 255, 255, 230)
    draw.ellipse([80, 40, 240, 110], fill=cloud_color)
    draw.ellipse([140, 25, 320, 115], fill=cloud_color)
    draw.ellipse([260, 45, 400, 110], fill=cloud_color)

    draw.ellipse([700, 30, 860, 95], fill=cloud_color)
    draw.ellipse([780, 15, 960, 105], fill=cloud_color)
    draw.ellipse([890, 35, 1020, 100], fill=cloud_color)

    # Station building backdrop wall (Y: 200 to 520)
    draw.rectangle([0, 180, 1080, 480], fill=(242, 232, 220, 255))
    # Wall top trim
    draw.rectangle([0, 175, 1080, 195], fill=(225, 212, 198, 255))
    draw.rectangle([0, 195, 1080, 198], fill=(205, 190, 175, 255))

    # Walkway pavement (Y: 380 to 480)
    draw.rectangle([0, 380, 1080, 480], fill=(236, 226, 212, 255))
    # Pavement tile lines
    for x in range(0, 1080, 60):
        draw.line([(x, 380), (x, 480)], fill=(220, 210, 195, 255), width=2)
    draw.line([(0, 480), (1080, 480)], fill=(205, 195, 180, 255), width=3)

    # Parking Bay Platform (Y: 480 to 720)
    draw.rectangle([0, 480, 1080, 720], fill=(218, 203, 188, 255))
    # Light curb
    draw.rectangle([0, 480, 1080, 492], fill=(200, 185, 170, 255))

    # Two-lane Road (Y: 720 to 860)
    draw.rectangle([0, 720, 1080, 860], fill=(136, 130, 124, 255))
    # Road top and bottom curbs
    draw.rectangle([0, 720, 1080, 726], fill=(180, 175, 170, 255))
    draw.rectangle([0, 854, 1080, 860], fill=(180, 175, 170, 255))
    # Dashed center line
    dash_w = 60
    dash_gap = 40
    for x in range(20, 1080, dash_w + dash_gap):
        draw.rectangle([x, 786, x + dash_w, 794], fill=(255, 255, 255, 255))

    # Left and Right perimeter exit road stripes
    draw.rectangle([0, 860, 60, 1700], fill=(120, 190, 65, 255))
    draw.rectangle([1020, 860, 1080, 1700], fill=(120, 190, 65, 255))

    # Grass area subtle pattern (Y: 860 to 1750)
    # Circular grass tufts
    tuft_color = (118, 194, 62, 255)
    for row in range(880, 1720, 80):
        for col in range(60, 1040, 90):
            offset = 45 if (row // 80) % 2 == 1 else 0
            cx = col + offset
            if 60 < cx < 1020:
                draw.ellipse([cx - 15, row - 8, cx + 15, row + 8], fill=tuft_color)

    # Bottom booster dock shelf (Y: 1720 to 1920)
    draw.rectangle([0, 1720, 1080, 1920], fill=(108, 185, 52, 255))
    draw.line([(0, 1720), (1080, 1720)], fill=(90, 160, 40, 255), width=4)

    img.save('images/background.png', 'PNG')
    print('Created images/background.png')

# -------------------------------------------------------------
# 2. Bus Stop Shelter, Trees, Benches, Queue Doorway
# -------------------------------------------------------------
def create_station_decorations():
    # Bus Shelter (width 340, height 180)
    shelter = Image.new('RGBA', (360, 200), (0, 0, 0, 0))
    s_draw = ImageDraw.Draw(shelter)

    # Pillars
    s_draw.rectangle([40, 40, 52, 190], fill=(62, 155, 134, 255))
    s_draw.rectangle([308, 40, 320, 190], fill=(62, 155, 134, 255))
    # Glass back panel
    s_draw.rounded_rectangle([48, 45, 312, 160], radius=8, fill=(130, 218, 200, 140), outline=(78, 175, 152, 255), width=3)
    # Glass grid bars
    s_draw.line([(136, 45), (136, 160)], fill=(78, 175, 152, 255), width=3)
    s_draw.line([(224, 45), (224, 160)], fill=(78, 175, 152, 255), width=3)
    s_draw.line([(48, 102), (312, 102)], fill=(78, 175, 152, 255), width=3)
    # Curved mint canopy roof
    s_draw.rounded_rectangle([20, 20, 340, 55], radius=14, fill=(84, 188, 162, 255), outline=(50, 140, 120, 255), width=3)
    s_draw.rounded_rectangle([30, 24, 330, 36], radius=6, fill=(120, 215, 192, 255))

    # Wooden bench under shelter
    s_draw.rectangle([80, 130, 280, 145], fill=(212, 152, 95, 255), outline=(160, 105, 55, 255), width=2)
    s_draw.rectangle([95, 145, 105, 185], fill=(140, 90, 45, 255))
    s_draw.rectangle([255, 145, 265, 185], fill=(140, 90, 45, 255))
    s_draw.rectangle([85, 155, 275, 162], fill=(195, 135, 80, 255))

    shelter.save('images/bus_shelter.png', 'PNG')

    # Stylized Round Tree in Planter (width 220, height 260)
    tree = Image.new('RGBA', (220, 260), (0, 0, 0, 0))
    t_draw = ImageDraw.Draw(tree)

    # Concrete planter box
    t_draw.rounded_rectangle([20, 210, 200, 255], radius=8, fill=(235, 225, 210, 255), outline=(195, 185, 170, 255), width=3)
    t_draw.rounded_rectangle([25, 205, 195, 218], radius=5, fill=(120, 195, 75, 255))

    # Trunk
    t_draw.rectangle([95, 130, 125, 215], fill=(155, 100, 58, 255), outline=(120, 75, 40, 255), width=2)

    # Foliage layers
    # Base shadow foliage
    t_draw.ellipse([30, 30, 190, 170], fill=(55, 145, 70, 255))
    # Mid foliage
    t_draw.ellipse([20, 20, 170, 160], fill=(70, 175, 85, 255))
    t_draw.ellipse([60, 10, 200, 150], fill=(85, 195, 95, 255))
    # Highlights
    t_draw.ellipse([45, 25, 140, 105], fill=(120, 220, 125, 255))
    t_draw.ellipse([100, 20, 175, 85], fill=(130, 230, 135, 255))

    tree.save('images/tree.png', 'PNG')

    # Queue Entrance Doorway (width 120, height 180)
    door = Image.new('RGBA', (120, 180), (0, 0, 0, 0))
    d_draw = ImageDraw.Draw(door)
    d_draw.rounded_rectangle([10, 10, 110, 175], radius=6, fill=(230, 220, 205, 255), outline=(190, 180, 165, 255), width=3)
    d_draw.rounded_rectangle([20, 20, 100, 175], radius=4, fill=(105, 95, 85, 255))
    # Exit sign above door
    d_draw.rounded_rectangle([30, 28, 90, 48], radius=4, fill=(70, 185, 115, 255))
    font_exit = get_font(12, True)
    d_draw.text((60, 38), "EXIT", fill=(255, 255, 255, 255), font=font_exit, anchor="mm")
    door.save('images/queue_door.png', 'PNG')

    print('Created station scenery assets')

# -------------------------------------------------------------
# 3. Parking Bays (Unlocked Dashed & Locked with Badge)
# -------------------------------------------------------------
def create_parking_bays():
    # Dimensions: 120 width x 200 height (tilted ~15 degrees in game)
    # Unlocked slot outline
    slot = Image.new('RGBA', (140, 230), (0, 0, 0, 0))
    s_draw = ImageDraw.Draw(slot)

    # Shaded interior
    s_draw.rounded_rectangle([10, 10, 130, 220], radius=18, fill=(190, 175, 160, 120))

    # Dashed border
    # Draw dashed rectangle
    dash_len = 12
    gap_len = 8
    # Top edge
    x = 25
    while x < 115:
        s_draw.line([(x, 10), (min(x + dash_len, 115), 10)], fill=(255, 255, 255, 230), width=4)
        x += dash_len + gap_len
    # Bottom edge
    x = 25
    while x < 115:
        s_draw.line([(x, 220), (min(x + dash_len, 115), 220)], fill=(255, 255, 255, 230), width=4)
        x += dash_len + gap_len
    # Left edge
    y = 25
    while y < 205:
        s_draw.line([(10, y), (10, min(y + dash_len, 205))], fill=(255, 255, 255, 230), width=4)
        y += dash_len + gap_len
    # Right edge
    y = 25
    while y < 205:
        s_draw.line([(130, y), (130, min(y + dash_len, 205))], fill=(255, 255, 255, 230), width=4)
        y += dash_len + gap_len

    slot.save('images/parking_slot.png', 'PNG')

    # Locked slot (with car/bus icon + lock indicator)
    slot_locked = Image.new('RGBA', (140, 230), (0, 0, 0, 0))
    sl_draw = ImageDraw.Draw(slot_locked)
    sl_draw.rounded_rectangle([10, 10, 130, 220], radius=18, fill=(175, 160, 145, 180), outline=(230, 215, 200, 160), width=3)

    # Stylized white vehicle silhouette with + inside
    sl_draw.rounded_rectangle([35, 90, 105, 140], radius=10, fill=(255, 255, 255, 220))
    sl_draw.rectangle([45, 100, 62, 116], fill=(175, 160, 145, 255))
    sl_draw.rectangle([78, 100, 95, 116], fill=(175, 160, 145, 255))
    # Plus sign
    sl_draw.rectangle([65, 118, 75, 134], fill=(76, 175, 80, 255))
    sl_draw.rectangle([57, 122, 83, 130], fill=(76, 175, 80, 255))

    font_bay = get_font(18, True)
    sl_draw.text((70, 60), "BAY", fill=(240, 230, 215, 220), font=font_bay, anchor="mm")
    slot_locked.save('images/parking_slot_locked.png', 'PNG')

    print('Created parking slot graphics')

# -------------------------------------------------------------
# 4. Passengers (Jelly capsule characters in 6 distinct colors)
# -------------------------------------------------------------
COLOR_PALETTE = {
    'red': {
        'main': (230, 50, 65),
        'dark': (180, 25, 40),
        'light': (255, 110, 120),
        'seat': (250, 85, 95)
    },
    'purple': {
        'main': (140, 60, 225),
        'dark': (95, 30, 170),
        'light': (180, 115, 255),
        'seat': (155, 80, 240)
    },
    'pink': {
        'main': (240, 75, 155),
        'dark': (190, 35, 110),
        'light': (255, 135, 195),
        'seat': (245, 95, 170)
    },
    'blue': {
        'main': (45, 135, 245),
        'dark': (20, 90, 190),
        'light': (110, 185, 255),
        'seat': (70, 155, 250)
    },
    'green': {
        'main': (46, 185, 120),
        'dark': (25, 140, 85),
        'light': (105, 225, 165),
        'seat': (60, 195, 135)
    },
    'yellow': {
        'main': (245, 175, 25),
        'dark': (195, 130, 10),
        'light': (255, 215, 85),
        'seat': (250, 190, 45)
    },
    'maroon': {
        'main': (150, 45, 75),
        'dark': (110, 25, 50),
        'light': (195, 85, 115),
        'seat': (165, 60, 90)
    }
}

def create_passengers():
    # Width 54, Height 70
    for cname, cvals in COLOR_PALETTE.items():
        p_img = Image.new('RGBA', (56, 76), (0, 0, 0, 0))
        draw = ImageDraw.Draw(p_img)

        # Shadow
        draw.ellipse([8, 62, 48, 74], fill=(0, 0, 0, 45))

        # Body (capsule)
        draw.rounded_rectangle([14, 28, 42, 66], radius=14, fill=cvals['main'], outline=cvals['dark'], width=2)
        # Body highlight
        draw.rounded_rectangle([17, 30, 30, 56], radius=7, fill=cvals['light'])

        # Head (sphere)
        draw.ellipse([11, 4, 45, 38], fill=cvals['main'], outline=cvals['dark'], width=2)
        # Head highlight
        draw.ellipse([16, 8, 30, 22], fill=cvals['light'])

        p_img.save(f'images/passenger_{cname}.png', 'PNG')

        # Seated passenger (just head and cute shoulders to place into bus seats)
        seat_p = Image.new('RGBA', (40, 40), (0, 0, 0, 0))
        s_draw = ImageDraw.Draw(seat_p)
        # Shoulders
        s_draw.rounded_rectangle([6, 18, 34, 38], radius=8, fill=cvals['main'], outline=cvals['dark'], width=2)
        # Head
        s_draw.ellipse([8, 4, 32, 28], fill=cvals['main'], outline=cvals['dark'], width=2)
        s_draw.ellipse([12, 7, 22, 17], fill=cvals['light'])
        seat_p.save(f'images/seat_passenger_{cname}.png', 'PNG')

    # Queue barrier stanchion post
    post = Image.new('RGBA', (30, 70), (0, 0, 0, 0))
    p_draw = ImageDraw.Draw(post)
    # Base
    p_draw.ellipse([4, 60, 26, 68], fill=(160, 165, 175, 255), outline=(120, 125, 135, 255), width=2)
    # Pole
    p_draw.rectangle([12, 10, 18, 62], fill=(215, 220, 230, 255), outline=(150, 155, 165, 255), width=1)
    # Ball top
    p_draw.ellipse([9, 4, 21, 16], fill=(240, 245, 255, 255), outline=(160, 165, 175, 255), width=2)
    post.save('images/stanchion_post.png', 'PNG')

    print('Created passenger sprites for all colors')

# -------------------------------------------------------------
# 5. Vehicles (Bus, Van, Car) in 4 Directions + Top View
# -------------------------------------------------------------
# Bus: 10 seats (2x5), length 240, width 100
# Van: 6 seats (2x3), length 170, width 100
# Car: 4 seats (2x2), length 120, width 100
VEHICLE_CONFIG = {
    'bus': {'seats': 10, 'rows': 5, 'length': 250, 'width': 106},
    'van': {'seats': 6,  'rows': 3, 'length': 180, 'width': 106},
    'car': {'seats': 4,  'rows': 2, 'length': 130, 'width': 106}
}

DIRECTIONS = ['nw', 'ne', 'se', 'sw']

def create_vehicle_sprites():
    # We will generate base vehicles with directional arrows on their roof.
    # In addition, we create the top-down straight vehicle for parking bay & driving along the road.

    for vtype, vconf in VEHICLE_CONFIG.items():
        w = vconf['width']
        l = vconf['length']

        for cname, cvals in COLOR_PALETTE.items():
            # 1. Straight vertical vehicle (used when parked in parking bays or traveling along straight roads)
            v_straight = Image.new('RGBA', (w + 20, l + 30), (0, 0, 0, 0))
            draw = ImageDraw.Draw(v_straight)

            # Drop shadow
            draw.rounded_rectangle([15, 20, w + 5, l + 25], radius=24, fill=(0, 0, 0, 60))

            # Vehicle outer body
            body_bbox = [10, 10, w + 10, l + 10]
            draw.rounded_rectangle(body_bbox, radius=24, fill=cvals['main'], outline=cvals['dark'], width=4)

            # 3D Highlight on left & top edges
            draw.rounded_rectangle([14, 14, w + 6, 26], radius=10, fill=cvals['light'])

            # Front Windshield (curved glass)
            draw.rounded_rectangle([22, 22, w - 2, 48], radius=10, fill=(35, 45, 60, 255), outline=cvals['dark'], width=2)
            # Windshield shine
            draw.line([(30, 26), (65, 26)], fill=(150, 180, 220, 200), width=3)

            # Rear Window
            draw.rounded_rectangle([22, l - 18, w - 2, l], radius=8, fill=(35, 45, 60, 255), outline=cvals['dark'], width=2)

            # Headlights
            draw.rounded_rectangle([16, 12, 28, 22], radius=4, fill=(255, 255, 210, 255))
            draw.rounded_rectangle([w - 8, 12, w + 4, 22], radius=4, fill=(255, 255, 210, 255))

            # Taillights
            draw.rounded_rectangle([16, l - 2, 28, l + 8], radius=4, fill=(240, 40, 40, 255))
            draw.rounded_rectangle([w - 8, l - 2, w + 4, l + 8], radius=4, fill=(240, 40, 40, 255))

            # Interior passenger floor / seating area
            interior_bbox = [20, 54, w, l - 24]
            draw.rounded_rectangle(interior_bbox, radius=12, fill=(45, 52, 64, 255), outline=(30, 35, 45, 255), width=2)

            # Draw empty seat slots (white rounded rectangles)
            rows = vconf['rows']
            seat_h = 24
            seat_w = 26
            row_spacing = (interior_bbox[3] - interior_bbox[1] - (rows * seat_h)) / (rows + 1)

            for r in range(rows):
                sy = interior_bbox[1] + row_spacing + r * (seat_h + row_spacing)
                # Left seat
                draw.rounded_rectangle([26, sy, 26 + seat_w, sy + seat_h], radius=6, fill=(240, 245, 250, 255), outline=(190, 200, 215, 255), width=2)
                # Right seat
                draw.rounded_rectangle([w - 6 - seat_w, sy, w - 6, sy + seat_h], radius=6, fill=(240, 245, 250, 255), outline=(190, 200, 215, 255), width=2)

            v_straight.save(f'images/{vtype}_{cname}_straight.png', 'PNG')

            # 2. Isometric Diagonal Vehicles (with directional arrows on top)
            # We create the 4 directions: nw, ne, se, sw
            # By drawing the vehicle body on a rotated canvas with high quality antialiasing
            for dir_idx, dname in enumerate(DIRECTIONS):
                # Target angles:
                # 'nw': -45 deg or -135 deg
                # In demo.mp4:
                # The parking jam has cars oriented along two diagonal axes:
                # Axis A: tilted ~-30° (facing Northwest or Southeast)
                # Axis B: tilted ~+30° (facing Northeast or Southwest)
                angle_deg = {
                    'nw': 45,
                    'ne': -45,
                    'se': -135,
                    'sw': 135
                }[dname]

                # Create canvas for rotated car
                diag_size = int(math.hypot(w, l) + 60)
                v_diag = Image.new('RGBA', (diag_size, diag_size), (0, 0, 0, 0))

                # Render unrotated high-res car on temp image
                tmp_w = w + 20
                tmp_l = l + 30
                tmp_img = Image.new('RGBA', (tmp_w, tmp_l), (0, 0, 0, 0))
                tdraw = ImageDraw.Draw(tmp_img)

                # Shadow
                tdraw.rounded_rectangle([15, 20, w + 5, l + 25], radius=24, fill=(0, 0, 0, 70))
                # Body
                tdraw.rounded_rectangle(body_bbox, radius=24, fill=cvals['main'], outline=cvals['dark'], width=4)
                # Highlight
                tdraw.rounded_rectangle([14, 14, w + 6, 26], radius=10, fill=cvals['light'])

                # Roof Panel (colored roof with windows on sides)
                roof_bbox = [20, 35, w, l - 15]
                tdraw.rounded_rectangle(roof_bbox, radius=14, fill=cvals['main'], outline=cvals['dark'], width=2)

                # Windshield
                tdraw.rounded_rectangle([22, 18, w - 2, 40], radius=8, fill=(35, 45, 60, 255), outline=cvals['dark'], width=2)
                # Headlights
                tdraw.rounded_rectangle([16, 12, 28, 20], radius=4, fill=(255, 255, 210, 255))
                tdraw.rounded_rectangle([w - 8, 12, w + 4, 20], radius=4, fill=(255, 255, 210, 255))

                # Side windows
                win_rows = vconf['rows']
                for wr in range(win_rows):
                    wy = 45 + wr * ((l - 70) / max(1, win_rows - 1))
                    tdraw.rounded_rectangle([12, wy, 18, wy + 16], radius=3, fill=(35, 45, 60, 255))
                    tdraw.rounded_rectangle([w + 2, wy, w + 8, wy + 16], radius=3, fill=(35, 45, 60, 255))

                # White Directional Arrow on the roof!
                # Points toward front (Y=0)
                cx = tmp_w // 2
                cy = tmp_l // 2
                arrow_w = 26
                arrow_l = min(70, l // 2)

                arrow_pts = [
                    (cx, cy - arrow_l // 2),               # Arrow tip
                    (cx + arrow_w, cy - arrow_l // 2 + 24), # Right wing
                    (cx + arrow_w // 2, cy - arrow_l // 2 + 24),
                    (cx + arrow_w // 2, cy + arrow_l // 2), # Stem right
                    (cx - arrow_w // 2, cy + arrow_l // 2), # Stem left
                    (cx - arrow_w // 2, cy - arrow_l // 2 + 24),
                    (cx - arrow_w, cy - arrow_l // 2 + 24)  # Left wing
                ]
                # Arrow outline shadow
                tdraw.polygon([(px + 2, py + 2) for px, py in arrow_pts], fill=(0, 0, 0, 120))
                # Arrow body
                tdraw.polygon(arrow_pts, fill=(255, 255, 255, 255), outline=(40, 40, 40, 220))

                # Rotate
                rotated = tmp_img.rotate(angle_deg, resample=Image.BICUBIC, expand=True)
                # Paste into center
                paste_x = (diag_size - rotated.width) // 2
                paste_y = (diag_size - rotated.height) // 2
                v_diag.paste(rotated, (paste_x, paste_y), rotated)

                v_diag.save(f'images/{vtype}_{cname}_{dname}.png', 'PNG')

    print('Created vehicle sprites in all types, colors, and directions')

# -------------------------------------------------------------
# 6. UI Assets & Booster Buttons (Golden 3D Buttons)
# -------------------------------------------------------------
def create_ui_assets():
    # Booster Button Base (width 210, height 180)
    # Styles: Refresh, VIP Car, Sort, U-turn
    boosters = [
        ('btn_refresh', 'REFRESH', 'refresh'),
        ('btn_vip',     'VIP CAR', 'vip'),
        ('btn_sort',    'SORT',    'sort'),
        ('btn_uturn',   'U-TURN',  'uturn')
    ]

    for bname, label, icon_type in boosters:
        btn = Image.new('RGBA', (220, 200), (0, 0, 0, 0))
        draw = ImageDraw.Draw(btn)

        # Drop shadow
        draw.rounded_rectangle([15, 25, 205, 185], radius=36, fill=(0, 0, 0, 60))

        # Bottom 3D ledge (dark gold)
        draw.rounded_rectangle([10, 20, 210, 180], radius=36, fill=(210, 145, 10, 255), outline=(170, 115, 5, 255), width=4)

        # Top Button Face (bright golden yellow)
        draw.rounded_rectangle([10, 12, 210, 168], radius=34, fill=(255, 205, 30, 255))
        # Top inner highlight
        draw.rounded_rectangle([16, 16, 204, 85], radius=26, fill=(255, 230, 95, 255))

        # Icon drawing
        icx, icy = 110, 85
        if icon_type == 'refresh':
            # Two curved circular arrows
            draw.arc([icx - 36, icy - 36, icx + 36, icy + 36], start=30, end=150, fill=(225, 115, 20, 255), width=10)
            draw.arc([icx - 36, icy - 36, icx + 36, icy + 36], start=210, end=330, fill=(225, 115, 20, 255), width=10)
            # Arrow heads
            draw.polygon([(icx + 36, icy), (icx + 46, icy - 18), (icx + 22, icy - 14)], fill=(225, 115, 20, 255))
            draw.polygon([(icx - 36, icy), (icx - 46, icy + 18), (icx - 22, icy + 14)], fill=(225, 115, 20, 255))
        elif icon_type == 'vip':
            # Cute VIP Car icon
            draw.rounded_rectangle([icx - 42, icy - 12, icx + 42, icy + 22], radius=12, fill=(235, 50, 65, 255), outline=(180, 25, 35, 255), width=3)
            draw.rounded_rectangle([icx - 28, icy - 26, icx + 28, icy - 8], radius=8, fill=(255, 215, 50, 255), outline=(180, 25, 35, 255), width=2)
            # VIP Text
            font_vip = get_font(18, True)
            draw.text((icx, icy - 17), "VIP", fill=(180, 25, 35, 255), font=font_vip, anchor="mm")
            # Wheels
            draw.ellipse([icx - 34, icy + 14, icx - 18, icy + 30], fill=(40, 40, 40, 255))
            draw.ellipse([icx + 18, icy + 14, icx + 34, icy + 30], fill=(40, 40, 40, 255))
        elif icon_type == 'sort':
            # Three passenger silhouettes
            draw.ellipse([icx - 28, icy - 26, icx - 12, icy - 10], fill=(240, 75, 155, 255))
            draw.rounded_rectangle([icx - 32, icy - 8, icx - 8, icy + 18], radius=6, fill=(240, 75, 155, 255))

            draw.ellipse([icx - 8, icy - 32, icx + 8, icy - 16], fill=(45, 135, 245, 255))
            draw.rounded_rectangle([icx - 12, icy - 14, icx + 12, icy + 22], radius=6, fill=(45, 135, 245, 255))

            draw.ellipse([icx + 12, icy - 26, icx + 28, icy - 10], fill=(46, 185, 120, 255))
            draw.rounded_rectangle([icx + 8, icy - 8, icx + 32, icy + 18], radius=6, fill=(46, 185, 120, 255))
        elif icon_type == 'uturn':
            # Two curved counter arrows
            draw.arc([icx - 35, icy - 25, icx + 10, icy + 35], start=180, end=0, fill=(35, 195, 225, 255), width=10)
            draw.polygon([(icx - 35, icy + 5), (icx - 48, icy - 12), (icx - 22, icy - 12)], fill=(35, 195, 225, 255))
            draw.arc([icx - 10, icy - 35, icx + 35, icy + 25], start=0, end=180, fill=(125, 225, 45, 255), width=10)
            draw.polygon([(icx + 35, icy - 5), (icx + 48, icy + 12), (icx + 22, icy + 12)], fill=(125, 225, 45, 255))

        # Bottom label text
        font_btn = get_font(22, True)
        # Text shadow
        draw.text((icx, 150), label, fill=(160, 100, 5, 255), font=font_btn, anchor="mm")
        draw.text((icx, 148), label, fill=(110, 65, 0, 255), font=font_btn, anchor="mm")

        # Green '+' badge on top right corner
        draw.ellipse([160, 4, 206, 50], fill=(85, 205, 95, 255), outline=(255, 255, 255, 255), width=3)
        # Plus symbol
        draw.rectangle([180, 14, 186, 40], fill=(255, 255, 255, 255))
        draw.rectangle([170, 24, 196, 30], fill=(255, 255, 255, 255))

        btn.save(f'images/{bname}.png', 'PNG')

    # Top Level Pill Badge (width 260, height 70)
    level_badge = Image.new('RGBA', (280, 80), (0, 0, 0, 0))
    lb_draw = ImageDraw.Draw(level_badge)
    lb_draw.rounded_rectangle([10, 10, 270, 70], radius=30, fill=(90, 85, 105, 255), outline=(125, 120, 140, 255), width=3)
    level_badge.save('images/badge_level.png', 'PNG')

    # Hanging Queue Sign (width 160, height 120)
    queue_sign = Image.new('RGBA', (180, 130), (0, 0, 0, 0))
    qs_draw = ImageDraw.Draw(queue_sign)
    # Suspension chains
    qs_draw.rectangle([35, 2, 41, 24], fill=(120, 130, 145, 255))
    qs_draw.rectangle([139, 2, 145, 24], fill=(120, 130, 145, 255))
    # Cyan Signboard
    qs_draw.rounded_rectangle([10, 20, 170, 120], radius=16, fill=(45, 160, 225, 255), outline=(255, 255, 255, 255), width=4)
    font_q = get_font(22, True)
    qs_draw.text((90, 94), "Queue", fill=(255, 255, 255, 255), font=font_q, anchor="mm")
    queue_sign.save('images/badge_queue.png', 'PNG')

    # Pause Button (width 80, height 80)
    pause_btn = Image.new('RGBA', (90, 90), (0, 0, 0, 0))
    p_draw = ImageDraw.Draw(pause_btn)
    p_draw.rounded_rectangle([5, 12, 85, 85], radius=20, fill=(160, 45, 25, 255))
    p_draw.rounded_rectangle([5, 5, 85, 78], radius=20, fill=(215, 65, 35, 255), outline=(255, 255, 255, 255), width=3)
    # Two pause bars
    p_draw.rounded_rectangle([27, 24, 39, 58], radius=5, fill=(255, 255, 255, 255))
    p_draw.rounded_rectangle([51, 24, 63, 58], radius=5, fill=(255, 255, 255, 255))
    pause_btn.save('images/btn_pause.png', 'PNG')

    # Sound buttons
    for state, is_on in [('btn_sound_on', True), ('btn_sound_off', False)]:
        s_btn = Image.new('RGBA', (90, 90), (0, 0, 0, 0))
        draw = ImageDraw.Draw(s_btn)
        draw.rounded_rectangle([5, 12, 85, 85], radius=20, fill=(180, 120, 15, 255))
        draw.rounded_rectangle([5, 5, 85, 78], radius=20, fill=(245, 175, 25, 255), outline=(255, 255, 255, 255), width=3)
        # Speaker
        draw.polygon([(24, 32), (36, 32), (52, 20), (52, 62), (36, 50), (24, 50)], fill=(255, 255, 255, 255))
        if is_on:
            draw.arc([46, 26, 68, 56], start=-45, end=45, fill=(255, 255, 255, 255), width=4)
        else:
            draw.line([(58, 28), (72, 54)], fill=(230, 40, 40, 255), width=5)
            draw.line([(72, 28), (58, 54)], fill=(230, 40, 40, 255), width=5)
        s_btn.save(f'images/{state}.png', 'PNG')

    # Warning banner ("The current parking space is full")
    warn_img = Image.new('RGBA', (700, 120), (0, 0, 0, 0))
    w_draw = ImageDraw.Draw(warn_img)
    w_draw.rounded_rectangle([10, 10, 690, 110], radius=24, fill=(35, 40, 50, 210), outline=(255, 255, 255, 160), width=3)
    font_warn = get_font(34, True)
    w_draw.text((350, 46), "The current parking space is full", fill=(255, 255, 255, 255), font=font_warn, anchor="mm")
    font_sub = get_font(24, False)
    w_draw.text((350, 82), "Clear space or wait for passengers!", fill=(255, 215, 80, 255), font=font_sub, anchor="mm")
    warn_img.save('images/banner_parking_full.png', 'PNG')

    # Dialog Popups (Win, Game Over, Pause)
    # Win Dialog
    win_dlg = Image.new('RGBA', (840, 960), (0, 0, 0, 0))
    wd = ImageDraw.Draw(win_dlg)
    # Shadow
    wd.rounded_rectangle([30, 50, 810, 930], radius=44, fill=(0, 0, 0, 90))
    # Border & Body
    wd.rounded_rectangle([20, 40, 820, 920], radius=44, fill=(255, 250, 240, 255), outline=(245, 190, 40, 255), width=8)

    # Header Ribbon
    wd.rounded_rectangle([100, 15, 740, 135], radius=28, fill=(245, 175, 25, 255), outline=(210, 135, 10, 255), width=5)
    font_win_title = get_font(52, True)
    wd.text((420, 75), "LEVEL CLEAR!", fill=(255, 255, 255, 255), font=font_win_title, anchor="mm")

    # 3 Big Golden Stars
    star_y = 230
    for star_x in [260, 420, 580]:
        wd.ellipse([star_x - 55, star_y - 55, star_x + 55, star_y + 55], fill=(255, 210, 30, 255), outline=(215, 150, 15, 255), width=5)
        # Star inner
        font_star = get_font(60, True)
        wd.text((star_x, star_y), "★", fill=(255, 255, 255, 255), font=font_star, anchor="mm")

    # Next Level Button
    wd.rounded_rectangle([160, 740, 680, 860], radius=36, fill=(75, 195, 65, 255), outline=(50, 155, 40, 255), width=6)
    font_btn_lg = get_font(46, True)
    wd.text((420, 800), "NEXT LEVEL", fill=(255, 255, 255, 255), font=font_btn_lg, anchor="mm")

    win_dlg.save('images/popup_win.png', 'PNG')

    # Fail Dialog
    fail_dlg = Image.new('RGBA', (840, 960), (0, 0, 0, 0))
    fd = ImageDraw.Draw(fail_dlg)
    fd.rounded_rectangle([30, 50, 810, 930], radius=44, fill=(0, 0, 0, 90))
    fd.rounded_rectangle([20, 40, 820, 920], radius=44, fill=(255, 250, 240, 255), outline=(225, 65, 55, 255), width=8)

    fd.rounded_rectangle([100, 15, 740, 135], radius=28, fill=(225, 55, 50, 255), outline=(175, 30, 30, 255), width=5)
    fd.text((420, 75), "PARKING JAMMED!", fill=(255, 255, 255, 255), font=font_win_title, anchor="mm")

    font_fail_msg = get_font(34, True)
    fd.text((420, 320), "No space left in bays!", fill=(80, 80, 90, 255), font=font_fail_msg, anchor="mm")
    font_fail_sub = get_font(26, False)
    fd.text((420, 380), "Use a booster or try again to clear the queue.", fill=(120, 120, 130, 255), font=font_fail_sub, anchor="mm")

    # Retry Button
    fd.rounded_rectangle([160, 740, 680, 860], radius=36, fill=(245, 160, 25, 255), outline=(200, 120, 10, 255), width=6)
    fd.text((420, 800), "TRY AGAIN", fill=(255, 255, 255, 255), font=font_btn_lg, anchor="mm")
    fail_dlg.save('images/popup_fail.png', 'PNG')

    # Particle Smoke (Puff of white tire smoke)
    smoke = Image.new('RGBA', (64, 64), (0, 0, 0, 0))
    sm_draw = ImageDraw.Draw(smoke)
    sm_draw.ellipse([10, 10, 54, 54], fill=(255, 255, 255, 200))
    sm_draw.ellipse([18, 14, 46, 42], fill=(255, 255, 255, 240))
    smoke.save('images/particle_smoke.png', 'PNG')

    print('Created all UI assets and popups')

# -------------------------------------------------------------
# 7. App Icons for Web App / Construct 3 Manifest
# -------------------------------------------------------------
def create_app_icons():
    sizes = [32, 64, 128, 256, 512]
    base_icon = Image.new('RGBA', (512, 512), (126, 203, 71, 255))
    draw = ImageDraw.Draw(base_icon)

    # Road background strip
    draw.rectangle([0, 140, 512, 380], fill=(136, 130, 124, 255))
    draw.rectangle([40, 250, 140, 270], fill=(255, 255, 255, 255))
    draw.rectangle([200, 250, 300, 270], fill=(255, 255, 255, 255))
    draw.rectangle([360, 250, 460, 270], fill=(255, 255, 255, 255))

    # Cute colorful bus
    draw.rounded_rectangle([90, 170, 422, 350], radius=36, fill=(235, 50, 65, 255), outline=(175, 25, 40, 255), width=8)
    # Windshield
    draw.rounded_rectangle([120, 195, 200, 290], radius=14, fill=(40, 50, 70, 255))
    # Passenger windows
    draw.rounded_rectangle([220, 195, 275, 280], radius=10, fill=(40, 50, 70, 255))
    draw.rounded_rectangle([295, 195, 350, 280], radius=10, fill=(40, 50, 70, 255))
    draw.rounded_rectangle([370, 195, 405, 280], radius=10, fill=(40, 50, 70, 255))

    # Wheels
    draw.ellipse([140, 320, 220, 400], fill=(45, 45, 45, 255), outline=(180, 180, 180, 255), width=6)
    draw.ellipse([300, 320, 380, 400], fill=(45, 45, 45, 255), outline=(180, 180, 180, 255), width=6)

    # App title badge
    font_icon = get_font(52, True)
    draw.rounded_rectangle([50, 30, 462, 115], radius=24, fill=(255, 210, 30, 255), outline=(210, 140, 10, 255), width=6)
    draw.text((256, 72), "BUS MANIA", fill=(130, 70, 5, 255), font=font_icon, anchor="mm")

    for s in sizes:
        resized = base_icon.resize((s, s), Image.Resampling.LANCZOS)
        resized.save(f'icons/icon-{s}.png', 'PNG')

    print('Created app icons')

if __name__ == '__main__':
    create_background()
    create_station_decorations()
    create_parking_bays()
    create_passengers()
    create_vehicle_sprites()
    create_ui_assets()
    create_app_icons()
    print('ALL ASSETS SUCCESSFULLY GENERATED!')
