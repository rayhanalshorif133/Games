# Cook by Number 2D

A realistic, high-fidelity 2D Circuit Cooking Puzzle Game built with standard HTML5 Canvas & Web Audio, structured following the **Construct 3 Export Folder Pattern** with a native resolution of **1080 × 1920** (portrait 9:16).

---

## 🎮 Game Overview

In **Cook by Number**, culinary recipes are solved with mathematical circuitry!
1. **Start Box (Dispenser Vault)**: Houses an initial numbered ingredient ball (e.g. `1`).
2. **End Box (Recipe Computer AI)**: A retro-futuristic CRT computer terminal expecting a target recipe value (e.g. `3` in Level 1, `6` in Level 2).
3. **Draggable Modifier Pods**: Touch and drag modifier boxes (such as `+1`, `+2`, `+3`) anywhere across the kitchen counter.
4. **Interactive Cables**: Touch/drag from output ports to input ports to draw flexible, glowing 3D Bezier cables with live energy flow.
5. **Start Cooking**: Click the **START COOKING** button. The ball launches, traverses the cable path, transforms its numerical value when passing through each pod with steam and sizzling sound effects, and arrives at the computer.
   - **Accepted**: If `ball.value === target`, the terminal flashes matrix green, fireworks and confetti erupt, and victory fanfare plays!
   - **Rejected**: If `ball.value !== target`, the terminal buzzes with red warning strobes, and the ball pops back to start.

---

## 📂 Construct 3 Folder Structure

```
cook-by-number/
│
├── appmanifest.json       # Construct 3 Web App manifest (portrait, 1080x1920)
├── data.json              # Level parameters, coordinates, and math configurations
├── index.html             # Viewport container (1080x1920) and HUD overlays
├── style.css              # Glassmorphism styling, responsive scaling & animations
├── README.md              # Project documentation
│
├── icons/
│   ├── icon.svg           # High-resolution vector icon with pod & orb
│   ├── icon-192.png       # 192x192 PWA launcher icon
│   └── icon-512.png       # 512x512 PWA launcher icon
│
└── scripts/
    ├── audio.js           # Procedural Web Audio engine (no external audio assets)
    ├── levelData.js       # Embedded fallback level configurations (Level 1 & Level 2)
    ├── wireManager.js     # Port discovery, Bezier curves, and graph path tracer
    ├── renderer.js        # Ultra-crisp 1080x1920 canvas renderer
    ├── game.js            # Game loop, ball rolling physics, and math evaluator
    └── main.js            # Touch / mouse event mapper & lifecycle coordinator
```

---

## 🕹️ Controls & Interactions

- **Move Pods**: Touch or click & drag any modifier box (`+1`, etc.) to reposition it. Connected cables dynamically adjust their curves.
- **Wire Cables**: Drag from an **OUT** socket to an **IN** socket. It magnetically snaps when close.
- **Unplug Cable**: Click on any cable or click the **UNPLUG** button in the bottom HUD.
- **Start Cooking**: Press **START COOKING** to release the ball and run the recipe.
- **Reset**: Click **RESET** to return pods to their default positions.
- **Toggle Sound**: Click the **🔊** icon in the header.
- **Level Select**: Click the **📋** icon to view the 100-Level Menu with locked/unlocked statuses.

---

## 🍲 100 Progressive Recipe Levels with Cookie Persistence

Progress is automatically saved to **browser cookies** (`cbn_unlocked_level`) with 365-day expiry and synchronized with `localStorage`.
Only Level 1 is unlocked initially. Completing each level automatically unlocks the next level!

### Progressive Difficulty Tiers (Easy ➔ Hard):
1. **Tier 1: Apprentice Kitchen (Levels 1 - 20) — Easy**
   - Simple addition and warmup circuits (`+1` to `+6`).
   - Teaches basic wiring, dragging pods, and target matching.
   - Example: Level 1 (`1 + 1 + 1 = 3`), Level 2 (`2 + 1 + 3 = 6`).
2. **Tier 2: Multiplier Sizzle (Levels 21 - 40) — Medium-Easy**
   - Multipliers (`×2`, `×3`, `×4`) combined with addition pods.
   - Order of operations matters: `(Start + Pod) × Multiplier`.
   - Example: Level 4 (`(3 + 2) × 3 = 15`), Level 25 (`(3 + 3) × 4 = 24`).
3. **Tier 3: Dual-Output Logic Gates (Levels 41 - 70) — Medium**
   - Conditional Gates (`IF > X`) with independent `YES` (green) and `NO` (red) output ports.
   - Player must pre-condition ball value to take the winning branch.
   - Example: Level 3 (`(2 + 6 = 8) [IF > 7 ➔ YES] + 2 = 10`), Level 5 (`(4 + 6 = 10) [IF > 8 ➔ YES] × 2 = 20`).
4. **Tier 4: Master Culinary Circuits (Levels 71 - 99) — Hard**
   - High complexity 4-to-5 pod combinations with tight tolerances, decoys, and high targets (30 to 95).
5. **Tier 5: The Grand Milestone (Level 100) — Grandmaster Climax**
   - **Level 100: The Century Banquet** (Target: **100**!).
   - Formula: `(5 + 15 = 20) [IF > 18 ➔ YES] × 5 = 100 ✔`.

---

## 📐 Level Select Modal (100 Level Grid)

- **Locked States**: Locked levels display `🔒` and cannot be played until preceding levels are completed.
- **Haptic / Audio Feedback**: Clicking a locked level triggers a warning sound, shake animation, and toast prompt.
- **Scroll & Auto-Focus**: Smooth 5-column grid auto-scrolls to the current playing level when opened.
- **Reset Button**: "Reset Progress ↺" option allows players to wipe cookie progress and restart from Level 1.


---

## 🚀 Running Locally

Serve this directory using any local web server:
```bash
npx serve .
# or
python -m http.server 8080
```
Then open `http://localhost:8080` in your browser.

