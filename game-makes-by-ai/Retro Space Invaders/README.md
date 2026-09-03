# 👾 Retro Space Invaders 2D (HTML5 Edition)

An authentic, arcade-faithful recreation of the classic 1978 **Space Invaders** built with pure HTML5 Canvas, modern Web Audio API procedural synthesis, destructible pixel bunkers, retro CRT scanline shaders, and a dedicated **`scoreapi.js`** module.

---

## 🎮 Features

- **Classic 55-Invader Swarm**:
  - Top Row: Squid (30 Points, Cyan)
  - Middle Rows: Crab (20 Points, Hot Pink)
  - Bottom Rows: Octopus (10 Points, Lime Green)
  - 2-frame authentic pixel animations.
  - Classic marching tempo that accelerates dynamically down to 2 frames/step when 1 alien remains!
- **Mystery Flying Saucer (UFO)**:
  - Periodically buzzes across the top of the screen with authentic eerie warble siren.
  - Awards mystery bonus scores of **50, 100, 150, or 300 points**!
- **Destructible Defensive Bunkers**:
  - 4 arched green shelters with real-time bitmap erosion.
  - Both alien bombs and player lasers carve realistic pixel craters into the bunkers upon impact.
  - Aliens descending directly onto bunkers slice away pixels in their path.
- **Procedural 8-Bit Web Audio (`scripts/audio.js`)**:
  - Zero external MP3/WAV file dependencies.
  - 4-tone descending heartbeat bass march, laser pew-pew, explosive noise bursts, UFO siren, shield damage ticks, and fanfare melodies.
- **CRT Scanline & Glow Overlay**:
  - Authentic curved screen phosphor bloom and scanline shader (toggleable on/off anytime).
- **Parallax Starfield & Debris Particles**:
  - Twinkling multi-depth starfield and pixel explosion shards.
- **Controls**:
  - **Keyboard**: Left/Right Arrow or `A`/`D` to move, `Spacebar` to shoot, `P` to pause.
  - **Mobile Touch**: Sleek on-screen virtual dpad and fire buttons.
- **Dedicated Score API (`scripts/scoreApi.js`)**:
  - Dedicated tournament/external REST score submission with offline fallback, tamper-proof signature, and iframe `postMessage` bridge.

---

## 📡 Dedicated Score API (`scripts/scoreApi.js`)

The `ScoreAPI` module is designed for submitting player match stats to any external REST backend, game portal, tournament database, or iframe host.

### 1. Configuration

You can configure endpoints and authorization headers at runtime:

```javascript
window.scoreApiClient.configure({
  endpoint: 'https://your-backend.com/api/v1/scores',
  leaderboardEndpoint: 'https://your-backend.com/api/v1/leaderboard',
  gameId: 'MY_ARCADE_TOURNAMENT_2026',
  apiKey: 'YOUR_SECRET_API_KEY',
  timeoutMs: 8000,
  maxRetries: 2,
  mockFallbackEnabled: true // Uses realistic simulated rank if backend is offline
});
```

### 2. Payload Structure

When `submitScore()` is executed, the following payload is sent:

```json
{
  "gameId": "RETRO_SPACE_INVADERS_2026",
  "playerId": "PILOT_4912",
  "playerName": "SpaceAce",
  "score": 4820,
  "wave": 4,
  "aliensKilled": 165,
  "ufoHits": 3,
  "shotsFired": 182,
  "accuracy": 92,
  "durationSeconds": 145,
  "timestamp": 1772644800000,
  "signature": "sig_48c2fa91",
  "meta": {
    "resolution": "800x900",
    "platform": "web",
    "engine": "RetroSpaceInvaders_HTML5_Canvas"
  }
}
```

### 3. Events & Listeners

```javascript
// Listen to submission status updates
window.scoreApiClient.on('status', ({ message }) => {
  console.log('[ScoreAPI Status]', message);
});

// Listen to successful submission
window.scoreApiClient.on('success', ({ result, payload }) => {
  console.log('Score confirmed! Rank:', result.rank, 'Title:', result.rankTitle);
});

// Listen to network errors
window.scoreApiClient.on('error', ({ error, payload }) => {
  console.warn('Submission failed; cached in offline queue:', error);
});
```

### 4. Iframe / Web Portal Integration (`postMessage`)

If embedded within an iframe (e.g. Telegram Mini Apps, Poki, CrazyGames, Discord Activity), `scoreapi.js` automatically dispatches:

```javascript
window.parent.postMessage({
  type: 'RETRO_SPACE_INVADERS_SCORE',
  payload: payload,
  result: result
}, '*');
```

---

## 📁 File Structure

```
Retro Space Invaders/
├── index.html              # Main HTML5 entry point & cabinet UI
├── style.css               # Arcade CRT styling, neon typography, responsive layout
├── README.md               # Documentation & integration instructions
└── scripts/
    ├── scoreApi.js         # Dedicated Score Submission & Leaderboard API module
    ├── audio.js            # Procedural Web Audio 8-bit synthesizer
    ├── bunkers.js          # Destructible pixel-eroding bunkers
    ├── particles.js        # Starfield parallax & particle explosion engine
    ├── player.js           # Player cannon tank, lasers, lives system
    ├── aliens.js           # 55-alien marching swarm, UFO saucer, bomb dropping
    ├── game.js             # Core game engine, loop, collisions, wave progression
    └── main.js             # Bootstrap, keyboard/touch input handlers & UI hooks
```

---

## 🚀 How to Run

1. Open `index.html` directly in any modern browser (Chrome, Edge, Firefox, Safari).
2. Or run a lightweight local static server:
   ```bash
   npx serve .
   # or
   python -m http.server 8080
   ```
3. Click **INSERT COIN / PLAY** to start defending Earth from the alien armada!

