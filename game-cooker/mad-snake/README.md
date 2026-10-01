# 🐍 Mad Snake (Construct 3 Build Edition)

A high-performance HTML5 mobile arcade snake game built following **Construct 3's export and build file architecture**, with a native layout resolution of **1080 × 1920** (9:16 portrait).

Inspired by the gameplay mechanics, visual themes, and progression seen in `demo.mp4`.

---

## 🎮 Video Analysis Breakdown (`demo.mp4`)

| Feature | Analysis & Implementation Details |
|---|---|
| **Layout Size** | Portrait **1080 × 1920** (9:16 mobile aspect ratio). Scaled with responsive letterbox preservation. |
| **Grid Dimensions** | **20 × 20** square playfield centered on screen with themed borders. |
| **Player Snake** | Emerald green snake with rounded body segments, cartoon googly eyes that face the movement direction, and an animated red tongue. |
| **Enemy Snake (AI)** | Roaming orange AI snake. Pathfinds safely, avoids walls and obstacles. Damaging to the player on touch. |
| **Fire Boost Attack** | Tapping the Fire button consumes 1 ammo and fires a fireball forward. Directly hits and obliterates the enemy snake with a **+25 point explosion**, sending it into a **20-second respawn cooldown (`0:20`)**. |
| **Pickups & Foods** | **Primary Target Food**: Red Apples (Level 4), Tacos (Level 12), Sushi (Level 13) worth +10 pts.<br>**Bonus Secondary Food**: Green Apples worth +30 pts.<br>**Fire Powerup**: Board pickup granting +1 Fireball ammo. |
| **Obstacles** | Theme-specific: Potted Plants (Forest/Meadow), Cacti (Desert/Outback/Fiesta), Cherry Blossom Flowers (Japan/Sakura). |
| **Health System** | 3 Hearts ❤️❤️❤️ displayed in the top HUD. |
| **Control Schemes** | **Swipe Area**: Large tactile card at the bottom labeled `SWIPE TO MOVE`.<br>**Virtual Gamepad**: High-precision 4-way D-Pad toggled with the Gamepad icon.<br>**Keyboard**: Arrow Keys / WASD, Space/F to Fire, P to Pause, M for World Map. |
| **World Map Screen** | Winding path traversing 9 biomes: Meadow (L1-L5), Woods (L6), Sunny Cove (L7), Frozen Pond (L8), Outback (L9), USA (L10), Brazil (L11), Mexico (L12), Japan (L13), and the apex **MAD MODE** cosmic galaxy. |
| **⚡ Endless Mode** | **Starts Small & Relaxed**: Initial snake length of 3 segments, relaxed speed (0.16s), 0 obstacles, no enemies, open field.<br>**Dynamic Difficulty Waves**: As score increases, obstacles dynamically sprout, orange enemy AI snake enters, food types evolve (Apples ➔ Tacos ➔ Sushi), speed accelerates to 0.088s (Tier 6: MAD CHAOS!), with separate Endless High Score tracking! |

---

## 📁 Construct 3 Build File Structure

```
mad-snake/
├── index.html                   # HTML5 Entry Point with C3 Viewport & Canvas Wrapper
├── style.css                    # C3 Responsive Letterbox Styling (1080x1920)
├── appmanifest.json             # Web App / PWA Manifest (Icons, Display, Colors)
├── data.json                    # Construct 3 Project Descriptor & Object Types
├── c3runtime.js                 # Engine Runtime Loader, Asset Preloader & RAF Loop
├── scripts/                     # Modular Game Architecture
│   ├── main.js                  # Master Game Coordinator & State Machine
│   ├── snake.js                 # Player Snake, Enemy AI Snake & Fireball
│   ├── levelManager.js          # Level 1-13 & Mad Mode Configurations
│   ├── worldMap.js              # Interactive Scrollable World Map
│   ├── ui.js                    # In-Game HUD, D-Pad, Fire Button, Modals
│   ├── audioManager.js          # Procedural Web Audio API Synthesizer
│   └── particleSystem.js        # Sparkles, Trails, Explosions, Confetti
├── images/                      # Generated High-Resolution Sprites & Assets
│   ├── sprites/                 # Heads, Bodies, Foods, Obstacles, Fireball
│   ├── ui/                      # Action Buttons, Hearts, Flags, Badges
│   └── icons/                   # App Icons (16, 32, 64, 128, 256, 512 px)
└── generate_assets.py           # Asset Generation Script using Pillow
```

---

## 🚀 How to Run the Game

### Method 1: Local HTTP Server (Python)
Run the following command in terminal:
```bash
python -m http.server 8080
```
Then open your browser and navigate to:
```
http://localhost:8080
```

### Method 2: Node.js (npx serve)
```bash
npx serve .
```

### Method 3: Construct 3 / Web Embedding
You can directly import the project assets or host this build on any web host, WebView, Capacitor/Cordova wrapper, or itch.io.
