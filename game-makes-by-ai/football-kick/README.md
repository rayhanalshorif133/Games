# ⚽ Football Kick 2D Tournament Game (1080 x 1920 Portrait)

A high-performance, 2D/2.5D Football Kick Penalty Tournament game designed for mobile and desktop screens, packaged in the standard **Construct 3 web export pattern**.

---

## 🌟 Key Features

1. **Native 1080 x 1920 Portrait Canvas**:
   - Fixed high-resolution internal rendering pipeline (1080px width × 1920px height, 9:16 aspect ratio).
   - Responsive CSS auto-scaling preserves crisp geometry and correct aspect ratios across any phone, tablet, or monitor.

2. **10-Kick Penalty Challenge**:
   - Each player gets 10 kicks initially.
   - Comprehensive HUD tracks current kick, goals, saves, misses, and consecutive streaks.

3. **Progressive Goalkeeper AI (Easy to Hard)**:
   - **Kicks 1 - 3 (Rookie GK)**: Slower reaction time (~0.30s), low dive reach.
   - **Kicks 4 - 6 (Club GK)**: Moderate reflexes (~0.20s), standard reach and tracking.
   - **Kicks 7 - 9 (Pro GK)**: Fast reflexes (~0.12s), high dive agility reaching near the posts.
   - **Kick 10+ (Legendary GK)**: Elite reflexes (~0.06s), full-stretch dives with extended glove hitboxes.

4. **Goal Target Zones with Differentiated Points**:
   - **Top Bins (Top Corners)**: 150 PTS (High precision reward)
   - **Bottom Corners**: 100 PTS
   - **Side Posts**: 80 PTS
   - **Under Crossbar**: 75 PTS
   - **Center Net**: 50 PTS
   - Multipliers: $1.5\times$ (2 goals streak), $2.0\times$ (3 goals streak), $2.5\times$ (4+ goals streak).

5. **Moving "Extra Kick" Bonus Bar**:
   - A golden bonus bar slides horizontally across the goal area.
   - Striking the bonus bar awards **+1 Extra Kick** and **+200 Bonus Points**!

6. **"5D" Quality Visuals & Audio**:
   - Pseudo-3D ball depth trajectory ($Z$-scale down from penalty spot to goal line).
   - Real-time Magnus effect (curve & spin) based on swipe curvature.
   - Dynamic stadium floodlights with volumetric beams.
   - Spring-mass interactive net mesh that bulges backwards on ball impact.
   - Procedural Web Audio API sound synthesizer (realistic boot kick thump, post ring, net swish, crowd roar, whistle, and golden bonus fanfare) without external audio file loading lag.

7. **Dedicated Score API Module (`scripts/scoreApi.js`)**:
   - Separate, modular JavaScript client specifically designed for transmitting tournament scores.
   - Anti-tamper signature generation.
   - Offline `localStorage` caching with auto-retry synchronization.
   - Built-in mock handler so the game is immediately playable and testable out-of-the-box.

---

## 📁 Construct 3 Build Pattern Folder Structure

```
football-kick/
├── index.html              # Main HTML5 host & tournament UI overlays
├── style.css               # Responsive 1080x1920 layout & glassmorphism styling
├── appmanifest.json        # Web app manifest (Construct 3 format)
├── icons/
│   └── icon-512.png        # 512x512 Game icon
├── scripts/
│   ├── audio.js            # Web Audio procedural sound engine
│   ├── scoreApi.js         # Dedicated tournament score submission API module
│   ├── goalkeeper.js       # Goalkeeper progressive AI & diving physics
│   ├── renderer.js         # Canvas rendering, net physics, 5D visual FX
│   ├── game.js             # Core game engine, trajectory, target zones & rules
│   └── main.js             # Bootstrap, input coordinate mapping & UI loop
└── README.md               # Documentation & integration instructions
```

---

## 🚀 How to Run the Game

You can run the game using any standard web server:

### Using Node.js `npx serve` or `http-server`:
```powershell
npx serve .
```

### Using Python:
```powershell
python -m http.server 8080
```
Then open `http://localhost:8080` in your web browser.

---

## 📡 Dedicated Score API (`scripts/scoreApi.js`)

The file [`scripts/scoreApi.js`](file:///d:/Rayhan/Practice/Games/game-makes-by-ai/football-kick/scripts/scoreApi.js) can be configured for your backend server.

### Configuration
In your custom script or in `scripts/scoreApi.js`, customize the configuration:

```javascript
window.scoreApiClient.configure({
  endpoint: 'https://your-backend-domain.com/api/v1/submit-score',
  tournamentId: 'MY_CUSTOM_TOURNAMENT_2026',
  apiKey: 'YOUR_SECRET_API_KEY',
  mockFallbackEnabled: false // set to false to require live server responses
});
```

### Payload Format Sent by `submitScore`:
```json
{
  "tournamentId": "CHAMPIONS_CUP_2026",
  "playerId": "PLAYER_10",
  "playerName": "Striker_10",
  "score": 1450,
  "goals": 8,
  "totalShots": 11,
  "extraKicksEarned": 1,
  "accuracy": 73,
  "topBinsHit": 2,
  "streakMax": 4,
  "timestamp": 1725350000000,
  "signature": "sig_3a8f9c1b",
  "gameMeta": {
    "resolution": "1080x1920",
    "platform": "Win32",
    "engine": "FootballKick2D_Construct3_Pattern"
  }
}
```

### Subscribing to API Events
```javascript
window.scoreApiClient.on('start', ({ matchData }) => {
  console.log('Sending score...');
});

window.scoreApiClient.on('success', ({ result, payload }) => {
  console.log('Score submitted successfully! Rank:', result.rank);
});

window.scoreApiClient.on('error', ({ error, payload }) => {
  console.error('Submission failed, queued locally for sync:', error);
});
```

