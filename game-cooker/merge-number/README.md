# Merge Numbers - Construct 3 Build

A complete, high-fidelity **2248 Number Connect** puzzle game built following the standard **Construct 3 HTML5 Export & Build Structure** with a **1080 x 1920 (Portrait)** viewport layout.

---

## 🎮 Game Overview & Mechanics

- **Layout Size**: `1080 x 1920` (Portrait, 9:16 mobile aspect ratio with letterbox auto-scaling).
- **Grid System**: 5 Columns × 7 Rows (35 tiles).
- **Core 2248 Mechanics**:
  - Touch down on any tile to begin a chain.
  - Drag over adjacent matching tiles (8 directions: horizontal, vertical, and diagonal).
  - Can step up to the next power of 2 once 2+ tiles are linked (e.g. `2 ➔ 2 ➔ 4 ➔ 8` or `2 ➔ 2 ➔ 2 ➔ 2...`).
  - Real-time result preview bubble above the player's finger showing the merge outcome.
  - Releasing touch merges all connected tiles into the last touched tile position with particle bursts and sound.
  - Tiles above drop down under gravity with elastic physics bounce, and new tiles spawn at the top.
- **Visual Design**:
  - Chunky isometric 3D rounded squircle tiles with extruded bottom bevels and specular highlights matching `demo.jpg`.
  - Radiant golden curved bottom footer with 3D text `MERGE NUMBERS`.
  - Smooth glowing pipe connection lines with circular connector joint nodes.
  - Interactive 3D tutorial hand cursor demonstrating moves on idle.
- **Audio & Juice**:
  - Procedural Web Audio API sound synthesis (pentatonic pitch-rising scales on chain connect, punchy merge boom, wooden landing clicks, combo fanfares).
  - Haptic screen shake and star sparkle particle system.
  - Combo popup announcements: *GREAT MERGE!*, *AWESOME!*, *INCREDIBLE!!*.
- **Power-ups & Quality of Life**:
  - **Undo**: Revert the previous merge move.
  - **Shuffle**: Re-randomize tiles when in a tight spot.
  - **Restart**: Reset the board and score.
  - **Sound Toggle**: Mute / unmute audio with `localStorage` persistence.
  - High score tracking saved locally.

---

## 📁 Construct 3 Build Architecture

```
merge-number/
├── index.html               # Main entrypoint with #c3canvas (1080x1920) and loading overlay
├── style.css                # Fullscreen letterbox scale, centering, dark backdrop
├── appmanifest.json         # Web App Manifest for mobile portrait PWA installation
├── data.json                # Construct 3 layout, layers, and object type metadata
├── c3runtime.js             # C3 runtime environment: viewport scaling and coordinate projection
├── create_assets.py         # Python Pillow asset generator script
├── render_final.png         # In-engine rendered screenshot verification
├── scripts/
│   ├── supportcheck.js      # Browser HTML5 Canvas & Web Audio capability verification
│   ├── offlineclient.js     # Service Worker / offline cache integration
│   ├── audio.js             # Web Audio API sound synthesizer
│   ├── particleSystem.js    # Sparkles, floating scores, shockwaves, and camera shakes
│   ├── game.js              # 2248 grid mechanics, chain drag, gravity physics, combo solver
│   ├── renderer.js          # Canvas 2D renderer (HUD, board, 3D tiles, pipes, banner, hand)
│   └── main.js              # Bootstrap, input routing, and 60 FPS requestAnimationFrame loop
├── images/                  # Ultra-sharp 3D pre-rendered game sprites
│   ├── background.png       # Luxury indigo backdrop with radial glow
│   ├── bottom_banner.png    # Golden curved dome banner "MERGE NUMBERS"
│   ├── hand_pointer.png     # Stylized 3D pointing hand tutorial cursor
│   ├── tile_2.png .. 4096   # 3D squircle number tiles
│   ├── tile_slot.png        # Recessed grid socket backing plates
│   ├── score_card.png       # HUD cards for Score and Best Score
│   ├── btn_*.png            # Glossy circular UI buttons (restart, sound, shuffle, undo)
│   ├── popup_*.png          # Combo celebration badges
│   └── particle_sparkle.png # 4-point star particle
└── icons/                   # Standard PWA / mobile app icons (32, 64, 128, 256, 512)
```

---

## 🚀 How to Run & Play

Simply open `index.html` in any web browser, or serve via any static HTTP server:

```powershell
python -m http.server 8080
```
Then open in browser: `http://localhost:8080/index.html`
