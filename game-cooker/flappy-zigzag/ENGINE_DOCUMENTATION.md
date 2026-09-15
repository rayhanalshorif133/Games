# Flappy Zigzag: Game Engine Documentation & Architecture Reference

Version: **2.0.0-PRO**  
Target Environment: **HTML5 Canvas 2D / Web Audio API / ES6+**  
Canvas Coordinate Space: **1080 × 1920 Portrait (High-DPI Dynamic Scaling)**  

---

## 1. Engine Architecture & Core Loop

### 1.1 Coordinate Space & Camera Pipeline
Flappy Zigzag operates on an internal fixed-resolution virtual canvas of **1080 × 1920** pixels. The game wrapper scales responsively to fit any desktop monitor, tablet, or mobile screen while maintaining a pristine 9:16 portrait aspect ratio with letterboxing and high-DPI crisp rendering.

- **World Coordinate Space**:
  - Horizontal bounds: `WALL_LEFT = 40`, `WALL_RIGHT = 1040` (playable track width = 1000px).
  - Vertical direction: Negative Y is upward (altitude climb).
  - Player spawn point: `X = 540`, `Y = 1600`.
- **Dynamic Camera Tracking**:
  - Camera tracking formula:
    $$\text{cameraY}_{t} = \text{cameraY}_{t-1} + (\text{targetCamY} - \text{cameraY}_{t-1}) \times 9 \times \Delta t_{\text{scaled}}$$
    where $\text{targetCamY} = \text{player.y} - 1250$.
- **Time Dilation Subsystem (`timeScale` & `scaledDt`)**:
  - World delta time: $\Delta t_{\text{scaled}} = \Delta t \times \text{timeScale} \times \text{chronoMultiplier}$.
  - During hit-stop impact freeze: $\Delta t_{\text{world}} = 0$ for 220–280ms while particle sub-stepping runs at 20% speed.
  - Normal gameplay smoothly interpolates `timeScale` back to `1.0` at a rate of $+0.55/\text{sec}$.

```
                      [Input Event (Click / Tap / Space)]
                                     │
                                     ▼
                          [Player Direction Toggle]
                                     │
   ┌─────────────────────────────────┴─────────────────────────────────┐
   ▼                                                                   ▼
[Player Movement (100% Speed)]                      [World Physics (scaledDt)]
   - x += dir * speed * dt                             - Obstacles (gates, saws)
   - y -= vertSpeed * dt                               - Particle lifecycles
   - Trail generation                                  - Dynamic timers
   - Wall bounce & apex checks                         - Hazard animations
```

---

## 2. Advanced Power-Up Subsystems

### 2.1 ⏱️ Chrono Dilation (Bullet Time)
- **Duration**: 4.0 seconds.
- **Mechanics**:
  - Decelerates world physics, hazard rotations, and laser oscillations by **50%** ($\Delta t_{\text{world}} = \Delta t_{\text{scaled}} \times 0.5$).
  - **Player maneuverability remains at 100% full speed**, enabling surgical precision when threading through narrow hazards.
- **Audio Feedback**: Procedural low-pass filter frequency drop ($1200\text{Hz} \to 280\text{Hz}$) with acoustic time-dilation pitch sweep.
- **Visual Feedback**: Cyan chromatic ripple rings, HUD status badge (`⏱️ CHRONO [timer]s`), and motion-blur wake trails.

### 2.2 👻 Phase Shift (Ghost Cloak)
- **Duration**: 3.0 seconds.
- **Mechanics**:
  - Grants ethereal phase-state to the player ship.
  - While active, **collision detection is completely bypassed** for all obstacles, laser barriers, kinetic sawblades, and side walls.
  - Allows aggressive shortcut flight directly through hazardous choke points.
- **Audio Feedback**: Resonant high-pass sweep ($400\text{Hz} \to 3200\text{Hz}$) with crystalline harmonic phasing.
- **Visual Feedback**: Opacity oscillating between 30% and 80%, violet-white ghosting silhouettes, and floating HUD badge (`👻 PHASE [timer]s`).

### 2.3 💥 Neon Nova (Screen Wipe)
- **Trigger**: Instant on-pickup.
- **Mechanics**:
  - Emits a high-velocity spherical energy shockwave expanding from the pickup point to a radius of **1400px**.
  - All active obstacles within the current viewport are instantly obliterated.
  - Each destroyed obstacle transmutes into **3–5 floating neon coins/gems** scattered in safe collecting zones.
- **Audio Feedback**: Sub-bass seismic boom ($80\text{Hz} \to 30\text{Hz}$) followed by a cascading chord shower of chime frequencies.
- **Visual Feedback**: Full-screen white-cyan flash vignette, outward radial shockwave ring, explosive debris particles, and `💥 NEON NOVA!` banner.

### 2.4 🔬 Micro Mode (Quantum Shrink)
- **Duration**: 6.0 seconds.
- **Mechanics**:
  - Compresses player collision radius and rendered ship dimensions by **50%**:
    $$R_{\text{player}} = R_{\text{base}} \times 0.5 = 9\text{px} \quad (\text{Hitbox Area} = 25\%)$$
  - Unlocks safe clearance through ultra-dense laser corridors, oscillating gates, and sawblade vertices.
- **Audio Feedback**: Frequency-modulated quantum warble ($600\text{Hz} \to 1800\text{Hz} \to 1200\text{Hz}$).
- **Visual Feedback**: Scaled mini-ship with golden quantum sparkle particles, HUD badge (`🔬 MICRO [timer]s`).

---

## 3. Dynamic Hazard & Environmental Systems

### 3.1 ⚡ Pulsing Laser Gates (`pulsingLaserGate`)
- **Behavior**: Periodic energy barriers installed along zigzag corridors that cycle rhythmically between inactive (safe) and active (lethal) states.
- **Cadence Cycle**:
  - Total period: $T_{\text{cycle}} = 2.4\text{s}$ (configurable based on difficulty).
  - Active lethal state: $1.3\text{s}$ (intense glowing laser beam with lethal collision).
  - Inactive safe state: $1.1\text{s}$ (translucent dashed guide line with safe passage).
  - Warning state: Final $0.35\text{s}$ of the inactive phase triggers rapid 12Hz strobe flashing to signal impending activation.

### 3.2 🌀 Inversion Portals (`inversionPortal`)
- **Behavior**: Spatial distortion zones (height: $350\text{px}$) that span the width of the arena.
- **Mechanics**:
  - Passing through the portal inverts the player's horizontal steering response:
    $$\text{dir}_{\text{next}} = -\text{dir}_{\text{standard}}$$
  - A second portal (or clearing the zone threshold) restores standard control orientation.
- **Audio & Visuals**: Space-warp vortex rendering with spiraling particle intake and low-frequency resonant droning.

### 3.3 🪚 Kinetic Sawblades (`kineticSaw`)
- **Behavior**: 12-toothed circular sawblade nodes ($R = 42\text{px}$) traversing horizontal laser guide rails back and forth between arena walls.
- **Kinematics**:
  - Traversal velocity: $v_{\text{saw}} = 140\text{px/s} \text{ to } 220\text{px/s}$.
  - Angular rotation: $\omega_{\text{spin}} = 18\text{rad/s}$ with tangential spark emission.
  - Collision model: Exact circle-to-circle distance check against player radius.

### 3.4 Procedural Hazard Roster
| Hazard Type | Motion Archetype | Safe Strategy |
| :--- | :--- | :--- |
| `gate` | Static horizontal barrier with aperture | Align diagonal entry through aperture |
| `movingGate` | Reciprocating sliding laser barrier | Lead gate position with anticipated turn |
| `rotatingBar` | Continuous rotary 2-ended beam | Match quadrant rotation velocity |
| `cyberCross` | 4-bladed spinning energy shuriken | Thread through 45° open quadrants |
| `plasmaMine` | Stationary, paired, or patrolling orb | Weave around radial danger corona |
| `chevronGate` | V-shaped diagonal laser barrier | Align angle with ship's 45° diagonal flight |
| `pulsingRing` | Rotating aperture hexagon | Enter through rotating doorway arc |
| `pulsingLaserGate` | Rhythmic timer on/off beam | Time passage during inactive charging state |
| `kineticSaw` | Rail-sweeping spinning rotary blade | Wait for saw apex before crossing rail |
| `inversionPortal` | Environmental control inverter | Invert muscle memory for turn taps |

---

## 4. Perfect Drift Combo & Scoring System

### 4.1 Combo Multiplier Formula
The Perfect Drift Combo multiplies all points earned from gate clearances, coin pickups, and milestones:
$$\text{Final Points} = \text{Base Points} \times \min(5.0, \text{driftMultiplier})$$

$$\text{driftMultiplier} = 1.0 + (\text{driftStreak} \times 0.5)$$

### 4.2 Trigger Conditions
1. **Wall Apex Turn**: Changing direction within **55px** of the left or right arena wall yields a **`⚡ WALL APEX DRIFT!`** bonus ($+1$ streak).
2. **Obstacle Near-Miss**: Passing within **35px** of any active lethal hazard surface without collision yields a **`⚡ CLOSE CALL DRIFT!`** bonus ($+1$ streak).
3. **Decay & Reset**:
   - Combo multiplier has a **3.5-second decay window**. If no apex or near-miss is performed within 3.5s, the multiplier begins decaying by $-0.4\times/\text{sec}$.
   - **Taking damage instantly resets** the drift multiplier to `1.0x` and streak to `0`.

---

## 5. Dynamic Synthwave Biomes

At progressive score thresholds, the environmental rendering engine executes a smooth color-space crossfade to a new biome palette:

```
[Score 0-19]      -->  [Score 20-39]       -->  [Score 40-69]      -->  [Score 70-99]      -->  [Score 100+]
Neo Tokyo              Sunset Synthwave         Acid Matrix             Solar Flare             Deep Void
Cyan #00f3ff           Magenta #ff007f          Lime #00ff66            Amber #ffaa00           Violet #a855f7
Hot Pink #ff0055       Neon Orange #ff7700      Matrix Green #059669    Crimson #dc2626         Indigo #6366f1
```

- **Color Interpolation (RGB Lerp)**:
  $$C_{\text{active}} = C_{\text{current}} + (C_{\text{target}} - C_{\text{current}}) \times \min(1.0, 1.8 \times \Delta t)$$
- All background stars, perspective grid lines, wall borders, and hazard emitters transition organically without abrupt visual jumps.

---

## 6. Particle Engine & Meta-Progression Shop

### 6.1 Economy & Persistence
- Coins collected across all sessions accumulate in `localStorage.getItem('fz_coins')`.
- Unlocked cosmetic trails are stored in `localStorage.getItem('fz_unlocked_trails')` as a JSON array.
- Currently equipped trail is tracked in `localStorage.getItem('fz_equipped_trail')`.

### 6.2 Cosmetic Trail Catalog
1. **Classic Neon** (Default, Unlocked)
   - Smooth continuous dual-tone gradient ribbon with dynamic width taper.
2. **Pixel Dust** (Cost: 100 Coins)
   - Retro 8-bit square floating neon voxels with staggered rotational decay.
3. **Rainbow Strobe** (Cost: 250 Coins)
   - High-frequency chromatic spectrum trail cycling through 360° HSL color space.
4. **Ion Sparks** (Cost: 500 Coins)
   - High-velocity energetic electrical spark arcs that snap outward tangentially.
5. **Void Nebula** (Cost: 750 Coins)
   - Luminous cosmic smoke clouds with embedded twinkling micro-stars.
6. **Cyber Matrix** (Cost: 1000 Coins)
   - Cascading digital matrix code glyphs (`0`, `1`, `λ`, `Ω`) dissolving in emerald green.

---

## 7. Score API Integration Rules
- `send_score_api.js` remains completely untouched.
- `window.sendScore(finalScore)` is triggered **precisely once per game-over event** inside `triggerGameOver()`, safely protected by `this.scoreSent`.
- Passes the final integer score value.

