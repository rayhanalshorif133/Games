# 🫧 Realistic 2D Bubble Shooter (1080 x 1920 Portrait)

An ultra-polished, realistic 2D Bubble Shooter game designed for mobile and desktop screens, packaged in the standard **Construct 3 web export pattern**.

---

## 🌟 Key Features

1. **Native 1080 x 1920 Portrait Canvas**:
   - Fixed high-resolution internal rendering pipeline (1080px width × 1920px height, 9:16 aspect ratio).
   - Responsive CSS auto-scaling preserves crisp geometry and correct aspect ratios across any phone, tablet, or monitor.

2. **❤️ 5 Love Lives System (লাভ লাইভ সিস্টেম)**:
   - Starts each game with **5 Love Heart Lives (❤️)** displayed in the top HUD.
   - **Miss/Foul Penalty**: If a shot does not match $\ge 3$ bubbles, 1 Love Heart cracks and shatters with crystal shard particles!
   - **Heart Recovery**: Striking a combo streak of $\ge 3$ or clearing a massive cluster of $\ge 8$ bubbles awards **+1 Love Heart** (up to max 5)!
   - **Danger Line Limit**: If bubbles push down and cross the glowing neon bottom danger line, all hearts are lost (instant Game Over).

3. **💎 3D-Shaded Glossy Bubble Realism**:
   - Realistic spherical glass shading with primary specular glints, ambient bounce rim lights, and inner refraction.
   - 6 vibrant jewel tones: Ruby Red, Sapphire Blue, Emerald Green, Topaz Yellow, Amethyst Purple, and Diamond Cyan.
   - **Special Power Bubbles**:
     - 💣 **Bomb Bubble**: Detonates all bubbles in a 2-cell radius.
     - 🌈 **Rainbow Bubble**: Iridescent chameleon bubble that matches any color.

4. **🎯 Precision Ricochet Aiming**:
   - Multi-bounce trajectory guide showing exact wall ricochet paths and final landing ghost rings.
   - Pneumatic cannon launcher with spring recoil feedback.
   - **Tactical Swap**: Tap the "⇄ SWAP" button or next bubble slot to switch between your current and queued bubble!

5. **🎈 Physical Disconnected Bubble Drops**:
   - Unanchored bubbles fall with natural gravity ($g = 2200\text{px/s}^2$), bounce off the floor, and explode into bonus score fireworks.

6. **🔊 Zero-Dependency Web Audio Synthesizer**:
   - Procedural sound engine (`scripts/audio.js`) generating realistic pneumatic pops, pitch-scaled combo chimes, wall bounces, glass crack heartbreaks, and fanfare.

---

## 📁 Construct 3 Build Pattern Folder Structure

```
bubble-shooter/
├── index.html              # Main HTML5 host, responsive 1080x1920 canvas & HUD overlays
├── style.css               # Responsive 1080x1920 layout, glassmorphism & animations
├── appmanifest.json        # Web app manifest (Construct 3 export format)
├── data.json               # Game configuration (grid size, physics, 5 lives, colors)
├── icons/
│   ├── icon.svg            # Glossy vector Bubble Shooter icon with Love Heart
│   ├── icon-192.png        # 192x192 App icon
│   └── icon-512.png        # 512x512 High-res app icon
├── images/
│   ├── heart-full.svg      # Glossy 3D red Love Heart icon (for active lives)
│   ├── heart-empty.svg     # Shattered / empty heart icon slot
│   ├── cannon.svg          # Futuristic shooter base & launcher
│   ├── arrow.svg           # Aiming arrow pointer
│   └── bg-grid.svg         # Subtle modern arena backdrop
├── scripts/
│   ├── audio.js            # Web Audio procedural sound engine
│   ├── grid.js             # Hexagonal bubble grid, neighbor math, cluster BFS
│   ├── shooter.js          # Cannon aiming, trajectory raycasting & ballistics
│   ├── renderer.js         # Canvas rendering, 3D glass bubbles, particles, HUD
│   ├── game.js             # State machine, 5 Love Lives rules, scoring & combos
│   └── main.js             # Bootstrap, touch/mouse coordinate mapping, loop
└── README.md               # Documentation & integration instructions
```

---

## 🎮 How to Play & Controls

| Action | Mobile / Touch | Desktop / Mouse | Keyboard |
| :--- | :--- | :--- | :--- |
| **Aim** | Touch & drag on canvas | Click & drag mouse | $\leftarrow$ / $\rightarrow$ Left/Right Arrows |
| **Shoot** | Release finger | Release mouse button | $\text{Spacebar}$ or $\uparrow$ Up Arrow |
| **Swap Bubble** | Tap "⇄ SWAP" box | Click "⇄ SWAP" box | $\text{S}$ Key |
| **Pause Game** | Tap ⏸ button | Click ⏸ button | - |
| **Toggle Sound** | Tap 🔊 button | Click 🔊 button | - |

---

## 🚀 How to Run the Game

You can run the game using any web server:

### Using Node.js:
```powershell
npx serve .
```

### Using Python:
```powershell
python -m http.server 8080
```
Then open `http://localhost:8080` in your web browser.

