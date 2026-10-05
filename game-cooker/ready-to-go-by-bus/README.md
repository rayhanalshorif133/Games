# Ready to Go by Bus - Construct 3 Build

A complete, high-fidelity HTML5 recreation of the popular mobile puzzle game **Ready to Go by Bus** (Bus Mania / Bus Out), built strictly following the **Construct 3 Web Build structure** with layout size **Width: 1080, Height: 1920**.

---

## 1. Full Game Video Analysis (`demo.mp4`)

Based on in-depth frame-by-frame analysis of `demo.mp4`, the game loop and mechanics were identified and implemented:

### Gameplay Loop & Core Rules:
1. **Passenger Queue (Top Station Area)**:
   - A serpentine queue of colorful capsule passengers (Red, Purple, Pink, Blue, Green, Maroon, Yellow) emerges from the terminal doorway cordoned off by stanchion posts and red velvet ropes.
   - The queue counter sign hangs next to the bus stop shelter showing remaining passengers (e.g., `338 Queue`).
   - Passengers only board a vehicle if their color matches the waiting vehicle's color AND the vehicle has unoccupied seats.
2. **Parking Bays (Loading Platform)**:
   - 7 diagonal parking bay slots located beneath the passenger queue:
     - 4 active bays with dashed white outlines.
     - 3 locked bays marked with a white vehicle icon and `+`, unlockable via boosters or taps.
   - When a vehicle escapes the traffic jam, it drives along the road into the first available parking bay.
   - When a vehicle fills all its seats (10 seats for Bus, 6 for Van, 4 for Car), it honks, accelerates out into the exit road, and clears the bay for new incoming vehicles.
3. **Parking Jam Grid (Lower Grass Area)**:
   - Dense traffic jam of vehicles positioned along two diagonal isometric axes (NW-SE and NE-SW).
   - Each vehicle has an arrow painted on its roof indicating its forward driving direction.
   - When tapped:
     - If blocked by another car in front: Plays a horn honk, wobbles/shakes, and emits a bump dust VFX.
     - If unblocked: Revs engine, follows trajectory out to the perimeter road with white exhaust smoke trails, drives up to the bus stop, and parks in an empty bay.
4. **Failure & Warning Conditions**:
   - If all available bays are occupied and none can accept the passenger at the head of the queue, a floating warning banner appears: *"The current parking space is full"*.
   - If gridlocked with no valid moves or space, game over dialog triggers with *Try Again* or *Booster* options.
5. **Win Condition**:
   - When all passengers in the queue are boarded and all buses depart the station, a celebration with confetti shower, victory fanfare, and a *Level Clear* 3-star modal appears.
6. **Boosters (Bottom Dock)**:
   - **Refresh**: Shuffles directions of blocked cars to create new escape paths.
   - **VIP Car**: Immediately summons a VIP car matching the front queue passenger.
   - **Sort**: Re-sorts the queue so the front passengers match waiting buses in the bays.
   - **U-turn**: Allows players to tap a car to reverse its direction 180°.

---

## 2. Construct 3 Build File Structure

```
ready-to-go-by-bus/
├── index.html              # Construct 3 export HTML with 1080x1920 canvas
├── style.css               # Responsive letterboxing (0.5625 aspect ratio) & C3 loader
├── c3runtime.js            # Construct 3 runtime environment (input projection & loop)
├── appmanifest.json        # PWA & Construct 3 application manifest
├── data.json               # Level configurations and vehicle catalog
├── create_assets.py        # Python asset generator for all 2D & isometric sprites
├── README.md               # Documentation and analysis
│
├── icons/                  # Construct 3 web app icons
│   ├── icon-32.png
│   ├── icon-64.png
│   ├── icon-128.png
│   ├── icon-256.png
│   └── icon-512.png
│
├── images/                 # Complete 2D & isometric sprite sheets and UI assets
│   ├── background.png      # Station scenery, clouds, trees, road, and lawn
│   ├── bus_shelter.png     # Bus stop canopy with wooden bench
│   ├── tree.png            # Stylized round cartoon tree in planter
│   ├── queue_door.png      # Station entrance doorway
│   ├── parking_slot.png    # Unoccupied dashed parking bay outline
│   ├── parking_slot_locked.png # Locked parking bay with badge
│   ├── stanchion_post.png  # Queue rope chrome post
│   ├── badge_level.png     # Level pill header
│   ├── badge_queue.png     # Cyan queue count sign
│   ├── btn_pause.png       # Pause button
│   ├── btn_sound_on.png    # Audio mute toggle (on)
│   ├── btn_sound_off.png   # Audio mute toggle (off)
│   ├── btn_refresh.png     # 3D golden Refresh booster
│   ├── btn_vip.png         # 3D golden VIP Car booster
│   ├── btn_sort.png        # 3D golden Sort booster
│   ├── btn_uturn.png       # 3D golden U-turn booster
│   ├── banner_parking_full.png # Parking space full banner
│   ├── popup_win.png       # Level Clear victory popup
│   ├── popup_fail.png      # Parking Jammed retry popup
│   ├── passenger_*.png     # Colorful capsule passenger sprites (6 colors)
│   ├── seat_passenger_*.png# Seated passenger heads/shoulders
│   └── [bus|van|car]_*_*.png # Vehicles in all colors, directions (nw, ne, se, sw, straight)
│
└── scripts/                # Modular JavaScript game logic
    ├── supportcheck.js     # Web capability and canvas detection
    ├── offlineclient.js    # C3 service worker offline registration hook
    ├── audio.js            # Procedural Web Audio API sound generator
    ├── particleSystem.js   # Exhaust smoke, boarding sparkles, and confetti
    ├── game.js             # Core game engine (raycast, jam grid, queue logic)
    ├── renderer.js         # 60FPS canvas renderer with isometric depth sorting
    └── main.js             # Application orchestrator and touch/mouse input mapping
```

---

## 3. How to Run & Test the Game

You can run the game using any standard local web server:

```powershell
# Using Python built-in server:
python -m http.server 8080
```

Then open `http://localhost:8080/index.html` in your web browser (Desktop or Mobile).
The game will automatically letterbox and scale cleanly to match any screen resolution while maintaining the crisp internal **1080 x 1920** coordinate system.
