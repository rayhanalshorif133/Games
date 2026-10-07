# Square Shot (Construct 3 HTML5 Game)

A minimalist hyper-casual reflex arcade game inspired by Ketchapp, fully reverse-engineered from `demo.mp4`.

## 📐 Layout Specifications
- **Logical Resolution / Canvas Size**: **1080 x 1920** (Portrait, 9:16 mobile aspect ratio)
- **Scale Mode**: Letterbox-scale (responsive to all desktop and mobile screen sizes with crisp DPI rendering)
- **Target Frame Rate**: 60 FPS / 120 FPS

---

## 🎮 Game Architecture & Mechanics (Analysis of `demo.mp4`)

### 1. Arena Geometry
- **Outer Frame**: 900 x 900 square centered at `(540, 960)` with a 38px dark charcoal border (`#161616`).
- **Inner Arena**: 824 x 824 playing field.

### 2. Player Ball & Aiming
- **Player**: Crisp white circular ball (radius = 28px) adhering to the inner wall edges.
- **Oscillating Aim Pointer**: Semi-transparent isosceles arrow attached to the ball, continuously sweeping back and forth (±58° from wall normal) using harmonic oscillation.
- **Launch**: On screen tap / click / Spacebar, launches at high velocity (2100 px/sec) towards the aimed direction.
- **Trail**: Leaves dynamic fading dot particles along the flight path.
- **Wall Impact**: Upon reaching any wall, ball snaps to the wall, plays tactile pop sound (`wallhit.wav`), emits wall particles, and begins aiming inwards from the new wall.

### 3. Obstacles (Patrol Balls)
- **Appearance**: Dark charcoal spheres (radius = 28px) matching the wall color.
- **Movement**: Continuously orbit clockwise along the inner perimeter at steady speed (440 px/s, slightly scaling with score).
- **Difficulty Curve**:
  - Score 0–5: 1 obstacle
  - Score 6+: 2 obstacles spaced evenly (180° apart / half perimeter)
  - Hazard: Colliding mid-flight or getting hit while resting on a wall triggers instant game over.

### 4. Collectible Gem (Diamond)
- **Appearance**: White diamond (42px square rotated 45°) with subtle breathing pulse.
- **Behavior**: Spawns randomly in the inner arena (safe margin from walls).
- **Collection**: Grants +1 score, pops score text with elastic punch scale, plays melodic chime (`collect.wav`), and scatters spark particles.

### 5. Dynamic Palette Switching
Smooth background transitions between iconic vibrant pastel themes:
- **0–9**: Vibrant Emerald Green (`#2ECC71`)
- **10–14**: Coral Crimson Red (`#E74C3C`)
- **15–19**: Sky Blue / Cyan (`#3BAFD6`)
- **20–24**: Amethyst Purple (`#9B59B6`)
- **25–29**: Amber Orange (`#E67E22`)
- **30+**: Mint Turquoise (`#1ABC9C`)

### 6. Game Over Screen
Pixel-perfect replication of `demo.mp4`:
- Top Dark Banner: `CHALLENGES COMPLETED: 1/3 ▼`
- Giant white score text
- Dark `BEST` label and high score number
- Two-tone title: `NEW BEST!` or `GAME OVER!`
- Large rounded Play Button with white play triangle
- Bottom interactive bar: `MUSIC`, `RATE`, `SHARE`, `SCORES`, `REMOVE ADS`

---

## 📁 Construct 3 Export File Structure

```
demo/
├── index.html              # Construct 3 HTML5 entry point & canvas wrapper
├── style.css               # Construct 3 responsive canvas styling & modals
├── data.json               # Construct 3 project layout & object definitions
├── appmanifest.json        # PWA Web App manifest (1080x1920 portrait)
├── README.md               # Full game documentation & analysis
│
├── scripts/
│   ├── main.js             # Bootstrap, viewport sizing & letterbox scaler
│   ├── c3runtime.js        # Core game engine, physics, state & audio
│   ├── supportcheck.js     # WebGL, Canvas 2D & Web Audio compatibility check
│   └── offlineclient.js    # Service worker & offline manager
│
├── images/
│   ├── player.png          # White player ball sprite (128x128)
│   ├── arrow.png           # Translucent aiming pointer (128x128)
│   ├── obstacle.png        # Black obstacle ball sprite (128x128)
│   ├── target.png          # Collectible diamond sprite (128x128)
│   ├── particle.png        # Glow particle texture (64x64)
│   ├── play_btn.png        # Rounded play button (560x140)
│   ├── icon_music.png      # Music ON icon
│   ├── icon_music_off.png  # Music OFF icon
│   ├── icon_rate.png       # Star rating icon
│   ├── icon_share.png      # Share icon
│   ├── icon_scores.png     # Leaderboard bar chart icon
│   └── icon_noads.png      # Prohibited ad icon
│
├── media/
│   ├── shoot.wav           # Ball launch sound
│   ├── wallhit.wav         # Wall collision thud
│   ├── collect.wav         # Diamond collect chime
│   ├── gameover.wav        # Explosion & death sound
│   └── click.wav           # UI button click sound
│
└── icons/
    ├── icon-16.png
    ├── icon-32.png
    ├── icon-64.png
    ├── icon-128.png
    ├── icon-256.png
    └── icon-512.png
```

---

## 🚀 How to Run

You can run this game immediately in any modern web browser:

1. **Directly open `index.html`** in your browser (Google Chrome, Edge, Firefox, Safari).
2. Or serve with any static web server:
   ```bash
   python -m http.server 8080
   ```
   and visit `http://localhost:8080`.

