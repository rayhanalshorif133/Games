# Cook by Number 2D

A realistic, high-fidelity 2D Circuit Cooking Puzzle Game built with standard HTML5 Canvas & Web Audio, structured following the **Construct 3 Export Folder Pattern** with a native resolution of **1080 × 1920** (portrait 9:16).

---

## 🎮 Game Overview

In **Cook by Number**, culinary recipes are solved with mathematical circuitry!
1. **Start Box (Dispenser Vault)**: Compact dispenser chamber housing an initial numbered ingredient ball (e.g. `1`). **Draggable anywhere on the counter!**
2. **End Box (Recipe Computer AI)**: Retro-futuristic CRT computer terminal expecting a target recipe value (e.g. `3` in Level 1, `6` in Level 2, `10` in Level 3). **Draggable anywhere on the counter!**
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
├── data.json              # Level parameters, coordinates, and math configurations (8 Levels)
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
    ├── levelData.js       # Embedded fallback level configurations (8 Levels)
    ├── wireManager.js     # Port discovery, Bezier curves, and graph path tracer
    ├── renderer.js        # Ultra-crisp 1080x1920 canvas renderer
    ├── game.js            # Game loop, ball rolling physics, and math evaluator
    └── main.js            # Touch / mouse event mapper & lifecycle coordinator
```

---

## 🕹️ Controls & Interactions

- **Move Pods & Terminals**: Touch or click & drag any modifier pod, the Start Dispenser Vault, or the End Computer Terminal to reposition them anywhere on the kitchen counter. Connected cables dynamically adjust their curves in real-time.
- **Wire Cables**: Drag from an **OUT** socket to an **IN** socket. It magnetically snaps when close.
- **Unplug Cable**: Click on any cable or click the **UNPLUG** button in the bottom HUD.
- **Start Cooking**: Press **START COOKING** to release the ball and run the recipe.
- **Reset**: Click **RESET** to return all boxes (start dispenser, end computer, and pods) to their default positions.
- **Toggle Sound**: Click the **🔊** icon in the header.
- **Level Select**: Click the **📋** icon to view the Level Menu with locked/unlocked statuses.

---

## 🍲 8 Progressive Recipe Levels with Cookie Persistence

Progress is automatically saved to **browser cookies** (`cbn_unlocked_level`) with 365-day expiry and synchronized with `localStorage`.
Only Level 1 is unlocked initially. Completing each level automatically unlocks the next level!

### Levels:
1. **Level 1: The First Recipe (Target: 3)**
   - Start value: 1. Pods: `+1`, `+1`.
   - Formula: `1 + 1 + 1 = 3 ✔`.
2. **Level 2: The Feedback Loop (Target: 8)**
   - Start value: 2. Boxes: `×2` (Dual-Input Pod), `IF = 8` Logic Gate (Dual YES/NO output).
   - Formula: `(2 × 2 = 4) [IF = 8 ➔ NO] ➔ (4 × 2 = 8) [IF = 8 ➔ YES] = 8 ✔`.
3. **Level 3: Loop & Branch Mastery (Target: 15)**
   - Start value: 2. Boxes: `×2` (Dual-Input Pod), `IF > 15` Logic Gate (Dual YES/NO output), `-1` (Dual-Input Pod).
   - Formula: `(2 × 2 = 4) [NO] ➔ (4 × 2 = 8) [NO] ➔ (8 × 2 = 16) [YES] ➔ (16 - 1) = 15 ✔`.
4. **Level 4: The Dual Loop Pipeline (Target: 24)**
   - Start value: 1. Boxes: `+4` (Dual-Input Pod), `IF > 20` Logic Gate, `+1` (Dual-Input Pod), `IF = 24` Logic Gate.
   - Formula: `(1 + 4×5 = 21) [IF > 20 ➔ YES] ➔ (21 + 1×3 = 24) [IF = 24 ➔ YES] = 24 ✔`.
5. **Level 5: The Threshold Regulator (Target: 50)**
   - Start value: 3. Boxes: Three `+5` Pods, `IF = 33` Logic Gate, `IF < 51` Logic Gate, Three `-1` Pods.
   - Formula: `(3 ➔ 33) [YES] ➔ (33 ➔ 53) [IF < 51 ➔ NO] ➔ (53 - 3) = 50 ✔`.
6. **Level 6: The Cascade Reactor (Target: 5)**
   - Start value: 200. Boxes: `/2` (Triple-Input Pod), `IF > 25` Logic Gate, `IF < 10` Logic Gate, `-5` (Dual-Input Pod), `IF = 10` Logic Gate.
   - Formula: `(200 /2 /2 /2 = 25) ➔ (25 -5 -5 -5 = 10) ➔ (10 /2 = 5) [IF < 10 ➔ YES] = 5 ✔`.
7. **Level 7: The Cosmic Supercollider (Target: 42)**
   - Start value: 16. Boxes: `×3` (Dual-Input Pod), `IF > 100` Logic Gate, `/2` (Dual-Input Pod), `IF < 50` Logic Gate, `+6` (Dual-Input Pod), `IF = 42` Logic Gate.
   - Formula: `(16 ×3 ×3 = 144) [IF > 100] ➔ (144 /2 /2 = 36) [IF < 50] ➔ (36 + 6 = 42) [IF = 42] = 42 ✔`.
8. **Level 8: The Parity Synthesizer (Target: 101)**
   - Start value: 800. Boxes: `/2` (Triple-Input Pod), `IF > 250` Logic Gate, `IF = 101` Logic Gate, `+5` (Dual-Input Pod), `-3` (Dual-Input Pod).
   - Formula: `(800 /2 /2 = 200) ➔ (200 + 5 - 3 = 202) ➔ (202 /2 = 101) [IF = 101] = 101 ✔`.
9. **Level 9: The Master Number Cooker (Target: 100)**
   - Start value: 10. Boxes: `+1` (Spice Pod), `🔥 COOKER` (Number Cooker, Dual-Input), `IF = 100` Quality Gate.
   - Special Mechanic: **Number Cooking / Simmering Loop** — initial passes simmer and boil the ingredient ball at fluctuating temperatures (e.g. 42, 78) routing via `NO` back into the Number Cooker; on the 3rd pass (2 loops), the dish is fully cooked to `100`, routing via `YES` to Recipe Computer!
   - Formula: `10 ➔ (+1 = 11) ➔ [Loop 🔥 NUMBER COOKER × 2] ➔ 100 [IF = 100 ➔ YES] = 100 ✔`.
10. **Level 10: The Grand Culinary Synthesis (Target: 151)**
    - Start value: 21. Boxes: `+2` (Dual-Input Pod), `IF = 25` Prep Gate, `/5` (Essence Extractor Pod), `🔥 COOKER` (Number Cooker, Dual-Input, Roast 158), `IF = 158` Roast Gate, `-7` (Spice Trimmer Pod).
    - Multi-Stage Architecture: $21 \xrightarrow{+2 \text{ loop}} 25 \xrightarrow{/5} 5 \xrightarrow{\text{Cooker loop}} 158 \xrightarrow{-7} 151$.
    - Formula: `(21 + 2×2 = 25) ➔ (25 / 5 = 5) ➔ [Loop 🔥 COOKER] ➔ (158 - 7) = 151 ✔`.

---

## 📐 Level Select Modal (Dynamic Multi-Level Grid)

- **Locked States**: Locked levels display `🔒` and cannot be played until preceding levels are completed.
- **Haptic / Audio Feedback**: Clicking a locked level triggers a warning sound, shake animation, and toast prompt.
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
