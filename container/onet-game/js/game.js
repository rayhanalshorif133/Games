/**
 * game.js - Complete 2D Onet Classic Game Implementation
 * Native 1080 x 1920 Portrait Canvas
 */

const GAME_STATE = {
  LOADING: 'LOADING',
  MENU: 'MENU',
  PLAYING: 'PLAYING',
  PAUSED: 'PAUSED',
  SETTINGS: 'SETTINGS',
  RESULT: 'RESULT',
  LEADERBOARD: 'LEADERBOARD'
};

class OnetGame {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.canvas.width = 1080;
    this.canvas.height = 1920;

    this.state = GAME_STATE.LOADING;
    this.previousState = GAME_STATE.MENU;

    // Core managers
    this.assets = new AssetManager();
    this.particles = new ParticleManager();
    this.floaters = new FloatingTextManager();
    this.shake = new ScreenShake();
    this.onet = new OnetLogic(12, 6);

    // Gameplay data
    this.level = 1;
    this.score = 0;
    this.highScore = parseInt(localStorage.getItem('onet_highscore') || '23456', 10);
    this.timeMax = 180; // 3 minutes
    this.timeLeft = this.timeMax;
    this.isLevelWon = false;

    // Power-ups inventory
    this.powerups = {
      time: 4,
      roll: 2,
      hint: 3
    };

    // Grid state
    this.grid = null;
    this.selectedTile = null;
    this.activeConnection = null; // { path, points, segments, totalDist, startTime, traceDuration, duration, p1, p2, type1, type2 }
    this.destroyingTiles = []; // [ { r, c, x, y, type, startTime, duration, dir } ]
    this.activeHint = null; // { p1, p2 }

    // Combos
    this.comboCount = 0;
    this.lastMatchTime = 0;

    // Layout configuration (1080x1920) - Compact sleek grid matching preview
    this.gridConfig = {
      cols: 6,
      rows: 12,
      tileW: 135,
      tileH: 108,
      gapX: 3,
      gapY: 3,
      startX: 128,
      startY: 295
    };

    // UI Buttons map
    this.buttons = [];
    this.hoverButton = null;

    // Leaderboard entries
    this.leaderboard = JSON.parse(localStorage.getItem('onet_leaderboard') || '[]');
    if (this.leaderboard.length === 0) {
      this.leaderboard = [
        { score: 23456, level: 3, date: 'Champion' },
        { score: 18920, level: 2, date: 'Master' },
        { score: 12400, level: 2, date: 'Pro' },
        { score: 8500, level: 1, date: 'Player' },
        { score: 4200, level: 1, date: 'Novice' }
      ];
    }

    // Ads removed state
    this.adsRemoved = localStorage.getItem('onet_ads_removed') === 'true';

    // Time tracking
    this.lastTime = performance.now();
    this.loadProgress = 0;

    // Bind event handlers
    this.initInput();
    this.initButtons();

    // Start loading assets
    this.assets.loadAll(
      (progress) => {
        this.loadProgress = progress;
      },
      () => {
        setTimeout(() => {
          const params = new URLSearchParams(window.location.search);
          const targetState = params.get('state');
          if (targetState === 'playing') {
            this.startNewGame(1);
          } else if (targetState === 'settings') {
            this.openSettings();
          } else if (targetState === 'leaderboard') {
            this.openLeaderboard();
          } else if (targetState === 'result') {
            this.isLevelWon = true;
            this.score = 23456;
            this.state = GAME_STATE.RESULT;
          } else if (targetState === 'match_test') {
            this.isMatchTest = true;
            this.startNewGame(1);
            const pair = this.onet.findValidPair(this.grid);
            if (pair) {
              const { tileW, tileH, gapX, gapY, startX, startY } = this.gridConfig;
              const x1 = startX + pair.p1.c * (tileW + gapX) + tileW / 2;
              const y1 = startY + pair.p1.r * (tileH + gapY) + tileH / 2;
              const x2 = startX + pair.p2.c * (tileW + gapX) + tileW / 2;
              const y2 = startY + pair.p2.r * (tileH + gapY) + tileH / 2;
              this.handleTileClick(x1, y1);
              this.handleTileClick(x2, y2);
              if (this.activeConnection) {
                this.activeConnection.duration = 999999;
              }
            }
          } else if (targetState === 'destroy_test') {
            this.isDestroyTest = true;
            this.startNewGame(1);
            const pair = this.onet.findValidPair(this.grid);
            if (pair) {
              const t1 = this.grid[pair.p1.r][pair.p1.c].type;
              const t2 = this.grid[pair.p2.r][pair.p2.c].type;
              this.startTileDestruction(pair.p1, pair.p2, t1, t2);
              if (this.destroyingTiles.length > 0) {
                this.destroyingTiles[0].duration = 999999;
                this.destroyingTiles[1].duration = 999999;
              }
            }
          } else {
            this.state = GAME_STATE.MENU;
          }
        }, 500);
      }
    );

    // Start game loop
    requestAnimationFrame(this.loop.bind(this));
  }

  initInput() {
    const getCoords = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / rect.width;
      const scaleY = this.canvas.height / rect.height;
      const clientX = e.clientX !== undefined ? e.clientX : (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
      const clientY = e.clientY !== undefined ? e.clientY : (e.touches && e.touches[0] ? e.touches[0].clientY : 0);
      return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY
      };
    };

    const handlePointerDown = (e) => {
      e.preventDefault();
      const { x, y } = getCoords(e);
      this.onPointerDown(x, y);
    };

    const handlePointerMove = (e) => {
      const { x, y } = getCoords(e);
      this.onPointerMove(x, y);
    };

    const handlePointerUp = (e) => {
      const { x, y } = getCoords(e);
      this.onPointerUp(x, y);
    };

    this.canvas.addEventListener('pointerdown', handlePointerDown);
    this.canvas.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    this.canvas.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });
  }

  initButtons() {
    // Menu buttons
    this.btnPlayGame = new UIButton({
      id: 'btn_play_game',
      x: 220,
      y: 1060,
      w: 640,
      h: 210,
      normalKey: 'Btn_Green',
      pressedKey: 'Btn_Geen_Pressed',
      onClick: () => this.startNewGame(1)
    });

    this.btnShare = new UIButton({
      id: 'btn_share',
      x: 200,
      y: 1380,
      w: 180,
      h: 180,
      normalKey: 'Btn_Share',
      pressedKey: 'Btn_Share_Pressed',
      onClick: () => this.shareGame()
    });

    this.btnLeaderboard = new UIButton({
      id: 'btn_leaderboard',
      x: 450,
      y: 1380,
      w: 180,
      h: 180,
      normalKey: 'Btn_Leaderboard',
      pressedKey: 'Btn_Leaderboard_Pressed',
      onClick: () => {
        window.soundEngine.playClick();
        this.openLeaderboard();
      }
    });

    this.btnSettings = new UIButton({
      id: 'btn_settings',
      x: 700,
      y: 1380,
      w: 180,
      h: 180,
      normalKey: 'Btn_Setting',
      pressedKey: 'Btn_Setting_Pressed',
      onClick: () => {
        window.soundEngine.playClick();
        this.openSettings();
      }
    });

    // Gameplay buttons
    this.btnPause = new UIButton({
      id: 'btn_pause',
      x: 845,
      y: 92,
      w: 88,
      h: 88,
      normalKey: 'Btn_Pause',
      pressedKey: 'Btn_Pause_Pressed',
      onClick: () => {
        window.soundEngine.playClick();
        this.pauseGame();
      }
    });

    this.btnTimePowerup = new UIButton({
      id: 'btn_time_powerup',
      x: 215,
      y: 1680,
      w: 185,
      h: 150,
      normalKey: 'Btn_Time',
      pressedKey: 'Btn_Time',
      onClick: () => this.useTimePowerup()
    });

    this.btnRollPowerup = new UIButton({
      id: 'btn_roll_powerup',
      x: 447,
      y: 1680,
      w: 185,
      h: 150,
      normalKey: 'Btn_Roll',
      pressedKey: 'Btn_Roll',
      onClick: () => this.useRollPowerup()
    });

    this.btnHintPowerup = new UIButton({
      id: 'btn_hint_powerup',
      x: 680,
      y: 1680,
      w: 185,
      h: 150,
      normalKey: 'Btn_Hint',
      pressedKey: 'Btn_Hint',
      onClick: () => this.useHintPowerup()
    });

    // Settings Modal buttons
    this.btnCloseSettings = new UIButton({
      id: 'btn_close_settings',
      x: 850,
      y: 430,
      w: 80,
      h: 80,
      normalKey: 'Close_Icon',
      pressedKey: 'Close_Icon',
      onClick: () => {
        window.soundEngine.playClick();
        this.closeModal();
      }
    });

    this.btnToggleMusic = new UIButton({
      id: 'btn_toggle_music',
      x: 230,
      y: 590,
      w: 180,
      h: 180,
      normalKey: window.soundEngine.musicEnabled ? 'Btn_Music' : 'Btn_Music_Disable',
      onClick: () => {
        const next = !window.soundEngine.musicEnabled;
        window.soundEngine.setMusicEnabled(next);
        this.btnToggleMusic.normalKey = next ? 'Btn_Music' : 'Btn_Music_Disable';
        this.btnToggleMusic.pressedKey = this.btnToggleMusic.normalKey;
        window.soundEngine.playClick();
      }
    });

    this.btnToggleSound = new UIButton({
      id: 'btn_toggle_sound',
      x: 450,
      y: 590,
      w: 180,
      h: 180,
      normalKey: window.soundEngine.soundEnabled ? 'Btn_Sound' : 'Btn_Sound_Disable',
      onClick: () => {
        const next = !window.soundEngine.soundEnabled;
        window.soundEngine.setSoundEnabled(next);
        this.btnToggleSound.normalKey = next ? 'Btn_Sound' : 'Btn_Sound_Disable';
        this.btnToggleSound.pressedKey = this.btnToggleSound.normalKey;
        window.soundEngine.playClick();
      }
    });

    this.btnToggleVibra = new UIButton({
      id: 'btn_toggle_vibra',
      x: 670,
      y: 590,
      w: 180,
      h: 180,
      normalKey: window.soundEngine.vibrationEnabled ? 'Btn_Vibra' : 'Btn_Vibra_Disable',
      onClick: () => {
        const next = !window.soundEngine.vibrationEnabled;
        window.soundEngine.setVibrationEnabled(next);
        this.btnToggleVibra.normalKey = next ? 'Btn_Vibra' : 'Btn_Vibra_Disable';
        this.btnToggleVibra.pressedKey = this.btnToggleVibra.normalKey;
        window.soundEngine.playClick();
      }
    });

    this.btnRemoveAds = new UIButton({
      id: 'btn_remove_ads',
      x: 230,
      y: 830,
      w: 620,
      h: 160,
      normalKey: this.adsRemoved ? 'Btn_Brown' : 'Btn_Blue',
      pressedKey: this.adsRemoved ? 'Btn_Brown' : 'Btn_Blue_Pressed',
      onClick: () => {
        window.soundEngine.playClick();
        this.adsRemoved = true;
        localStorage.setItem('onet_ads_removed', 'true');
        this.btnRemoveAds.normalKey = 'Btn_Brown';
        this.btnRemoveAds.pressedKey = 'Btn_Brown';
        this.showToast('Ads Successfully Removed!');
      }
    });

    this.btnTerms = new UIButton({
      id: 'btn_terms',
      x: 230,
      y: 1020,
      w: 620,
      h: 160,
      normalKey: 'Btn_Blue',
      pressedKey: 'Btn_Blue_Pressed',
      onClick: () => {
        window.soundEngine.playClick();
        this.showToast('Onet Classic 2D - Fair Play & Fun!');
      }
    });

    // Result Modal buttons
    this.btnCloseResult = new UIButton({
      id: 'btn_close_result',
      x: 820,
      y: 330,
      w: 75,
      h: 75,
      normalKey: 'Close_Icon',
      pressedKey: 'Close_Icon',
      onClick: () => {
        window.soundEngine.playClick();
        this.state = GAME_STATE.MENU;
      }
    });

    this.btnResultPlay = new UIButton({
      id: 'btn_result_play',
      x: 340,
      y: 1250,
      w: 180,
      h: 180,
      normalKey: 'Btn_Play',
      pressedKey: 'Btn_Play_Pressed',
      onClick: () => {
        window.soundEngine.playClick();
        if (this.isLevelWon) {
          this.startNewGame(this.level + 1);
        } else {
          this.startNewGame(this.level);
        }
      }
    });

    this.btnResultHome = new UIButton({
      id: 'btn_result_home',
      x: 560,
      y: 1250,
      w: 180,
      h: 180,
      normalKey: 'Btn_Home',
      pressedKey: 'Btn_Home',
      onClick: () => {
        window.soundEngine.playClick();
        this.state = GAME_STATE.MENU;
      }
    });

    // Pause Modal buttons
    this.btnResume = new UIButton({
      id: 'btn_resume',
      x: 340,
      y: 840,
      w: 180,
      h: 180,
      normalKey: 'Btn_Play',
      pressedKey: 'Btn_Play_Pressed',
      onClick: () => {
        window.soundEngine.playClick();
        this.state = GAME_STATE.PLAYING;
      }
    });

    this.btnPauseHome = new UIButton({
      id: 'btn_pause_home',
      x: 560,
      y: 840,
      w: 180,
      h: 180,
      normalKey: 'Btn_Home',
      pressedKey: 'Btn_Home',
      onClick: () => {
        window.soundEngine.playClick();
        this.state = GAME_STATE.MENU;
      }
    });

    // Leaderboard close button
    this.btnCloseLeaderboard = new UIButton({
      id: 'btn_close_leaderboard',
      x: 850,
      y: 430,
      w: 80,
      h: 80,
      normalKey: 'Close_Icon',
      pressedKey: 'Close_Icon',
      onClick: () => {
        window.soundEngine.playClick();
        this.closeModal();
      }
    });
  }

  getActiveButtons() {
    switch (this.state) {
      case GAME_STATE.MENU:
        return [this.btnPlayGame, this.btnShare, this.btnLeaderboard, this.btnSettings];
      case GAME_STATE.PLAYING:
        return [this.btnPause, this.btnTimePowerup, this.btnRollPowerup, this.btnHintPowerup];
      case GAME_STATE.SETTINGS:
        return [this.btnCloseSettings, this.btnToggleMusic, this.btnToggleSound, this.btnToggleVibra, this.btnRemoveAds, this.btnTerms];
      case GAME_STATE.PAUSED:
        return [this.btnResume, this.btnPauseHome, this.btnToggleMusic, this.btnToggleSound];
      case GAME_STATE.RESULT:
        return [this.btnCloseResult, this.btnResultPlay, this.btnResultHome];
      case GAME_STATE.LEADERBOARD:
        return [this.btnCloseLeaderboard];
      default:
        return [];
    }
  }

  onPointerDown(x, y) {
    const activeBtns = this.getActiveButtons();
    for (const btn of activeBtns) {
      if (btn.contains(x, y)) {
        btn.isPressed = true;
        this.hoverButton = btn;
        return;
      }
    }

    // If in gameplay, handle tile click (ignore during connection or destruction animations)
    if (this.state === GAME_STATE.PLAYING && !this.activeConnection && (!this.destroyingTiles || this.destroyingTiles.length === 0)) {
      this.handleTileClick(x, y);
    }
  }

  onPointerMove(x, y) {
    if (this.hoverButton) {
      this.hoverButton.isPressed = this.hoverButton.contains(x, y);
    }
  }

  onPointerUp(x, y) {
    if (this.hoverButton) {
      if (this.hoverButton.contains(x, y)) {
        if (this.hoverButton.onClick) {
          this.hoverButton.onClick();
        }
      }
      this.hoverButton.isPressed = false;
      this.hoverButton = null;
    }
  }

  showToast(message) {
    const toast = document.getElementById('toast');
    if (toast) {
      toast.innerText = message;
      toast.classList.add('show');
      setTimeout(() => toast.classList.remove('show'), 2200);
    }
  }

  shareGame() {
    window.soundEngine.playClick();
    if (navigator.share) {
      navigator.share({
        title: 'Onet Classic 2D',
        text: `I scored ${this.score || this.highScore} in Onet Classic! Can you beat my high score?`,
        url: window.location.href
      }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(window.location.href);
      this.showToast('Game link copied to clipboard!');
    }
  }

  openSettings() {
    this.previousState = this.state;
    this.state = GAME_STATE.SETTINGS;
  }

  openLeaderboard() {
    this.previousState = this.state;
    this.state = GAME_STATE.LEADERBOARD;
  }

  pauseGame() {
    this.state = GAME_STATE.PAUSED;
  }

  closeModal() {
    this.state = this.previousState;
  }

  startNewGame(level = 1) {
    this.level = level;
    this.score = 0;
    this.comboCount = 0;
    this.selectedTile = null;
    this.activeConnection = null;
    this.destroyingTiles = [];
    this.activeHint = null;
    this.isLevelWon = false;

    // Time increases slightly with level, base 180s
    this.timeMax = Math.max(120, 190 - level * 10);
    this.timeLeft = this.timeMax;

    // Power-up reset/carry
    this.powerups.time = 4;
    this.powerups.roll = 3;
    this.powerups.hint = 3;

    // Generate Solvable Board
    this.grid = this.onet.generateBoard(this.level);
    this.state = GAME_STATE.PLAYING;

    window.soundEngine.playClick();
    this.floaters.spawn(`LEVEL ${this.level}!`, 540, 960, '#fffa65', 72);
  }

  getTileAtPos(x, y) {
    const { cols, rows, tileW, tileH, gapX, gapY, startX, startY } = this.gridConfig;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const tx = startX + c * (tileW + gapX);
        const ty = startY + r * (tileH + gapY);
        if (x >= tx && x <= tx + tileW && y >= ty && y <= ty + tileH) {
          return { r, c, tile: this.grid[r][c] };
        }
      }
    }
    return null;
  }

  handleTileClick(x, y) {
    const hit = this.getTileAtPos(x, y);
    if (!hit || !hit.tile) {
      if (this.selectedTile) {
        this.grid[this.selectedTile.r][this.selectedTile.c].selected = false;
        this.selectedTile = null;
        window.soundEngine.playDeselect();
      }
      return;
    }

    const { r, c, tile } = hit;

    // Clear hint glow
    if (this.activeHint) {
      if (this.grid[this.activeHint.p1.r][this.activeHint.p1.c]) this.grid[this.activeHint.p1.r][this.activeHint.p1.c].hint = false;
      if (this.grid[this.activeHint.p2.r][this.activeHint.p2.c]) this.grid[this.activeHint.p2.r][this.activeHint.p2.c].hint = false;
      this.activeHint = null;
    }

    // First tile selected
    if (!this.selectedTile) {
      tile.selected = true;
      this.selectedTile = { r, c };
      window.soundEngine.playSelect();
      return;
    }

    // Same tile clicked -> deselect
    if (this.selectedTile.r === r && this.selectedTile.c === c) {
      tile.selected = false;
      this.selectedTile = null;
      window.soundEngine.playDeselect();
      return;
    }

    const prevPos = this.selectedTile;
    const prevTile = this.grid[prevPos.r][prevPos.c];

    // Different monster type -> switch selection
    if (prevTile.type !== tile.type) {
      prevTile.selected = false;
      tile.selected = true;
      this.selectedTile = { r, c };
      window.soundEngine.playError();
      return;
    }

    // Same monster type! Check connection path
    const path = this.onet.findPath(this.grid, prevPos, { r, c });

    if (path) {
      // Valid connection!
      const type1 = prevTile.type;
      const type2 = tile.type;
      prevTile.selected = false;
      tile.selected = false;
      this.selectedTile = null;

      const { cols, rows, tileW, tileH, gapX, gapY, startX, startY } = this.gridConfig;

      // Convert path coordinates (including outside borders) to screen coordinates
      const points = path.map((pt) => {
        let px, py;
        if (pt.c >= 0 && pt.c < cols) {
          px = startX + pt.c * (tileW + gapX) + tileW / 2;
        } else if (pt.c < 0) {
          px = startX - 35;
        } else {
          px = startX + cols * (tileW + gapX) + 15;
        }

        if (pt.r >= 0 && pt.r < rows) {
          py = startY + pt.r * (tileH + gapY) + tileH / 2;
        } else if (pt.r < 0) {
          py = startY - 35;
        } else {
          py = startY + rows * (tileH + gapY) + 15;
        }

        return { x: px, y: py };
      });

      // Calculate path segments & total distance for progressive tracing animation
      const segments = [];
      let totalDist = 0;
      for (let i = 0; i < points.length - 1; i++) {
        const dx = points[i + 1].x - points[i].x;
        const dy = points[i + 1].y - points[i].y;
        const len = Math.hypot(dx, dy);
        segments.push({
          p0: points[i],
          p1: points[i + 1],
          len: len,
          startDist: totalDist,
          endDist: totalDist + len
        });
        totalDist += len;
      }

      // Smooth tracing duration: ~280ms to 420ms depending on path distance
      const traceDuration = Math.max(280, Math.min(420, totalDist * 0.38));
      const holdDuration = 120; // Full electric beam sizzle hold before item explosion

      this.activeConnection = {
        path: path,
        points: points,
        segments: segments,
        totalDist: totalDist,
        startTime: performance.now(),
        traceDuration: traceDuration,
        duration: traceDuration + holdDuration,
        p1: prevPos,
        p2: { r, c },
        type1: type1,
        type2: type2
      };

      // Play laser audio
      window.soundEngine.playLaser();
    } else {
      // Unreachable matching tile
      prevTile.selected = false;
      tile.selected = true;
      this.selectedTile = { r, c };
      window.soundEngine.playError();
    }
  }

  startTileDestruction(p1, p2, type1, type2) {
    const { tileW, tileH, gapX, gapY, startX, startY } = this.gridConfig;

    const x1 = startX + p1.c * (tileW + gapX) + tileW / 2;
    const y1 = startY + p1.r * (tileH + gapY) + tileH / 2;
    const x2 = startX + p2.c * (tileW + gapX) + tileW / 2;
    const y2 = startY + p2.r * (tileH + gapY) + tileH / 2;

    // Immediately remove from grid so board state & pathfinding treat them as cleared
    this.grid[p1.r][p1.c] = null;
    this.grid[p2.r][p2.c] = null;

    // Register into destroying tiles animation
    const now = performance.now();
    const animDuration = 420; // ms
    this.destroyingTiles = [
      { r: p1.r, c: p1.c, x: x1, y: y1, type: type1, startTime: now, duration: animDuration, dir: -1 },
      { r: p2.r, c: p2.c, x: x2, y: y2, type: type2, startTime: now, duration: animDuration, dir: 1 }
    ];

    // High energy particle bursts with shockwaves & stars
    this.particles.spawnMatchBurst(x1, y1);
    this.particles.spawnMatchBurst(x2, y2);

    // Audio & Screen Shake
    window.soundEngine.playTileExplode();

    if (now - this.lastMatchTime < 3500) {
      this.comboCount++;
    } else {
      this.comboCount = 1;
    }
    this.lastMatchTime = now;
    window.soundEngine.playMatch(this.comboCount);

    this.shake.start(10, 0.22);

    // Calculate score
    const baseScore = 100;
    const comboBonus = (this.comboCount - 1) * 50;
    const earned = baseScore + comboBonus;
    this.score += earned;

    if (this.comboCount > 1) {
      this.floaters.spawn(`+${earned} (COMBO x${this.comboCount}!)`, (x1 + x2) / 2, (y1 + y2) / 2, '#ff3388', 56);
    } else {
      this.floaters.spawn(`+${earned}`, (x1 + x2) / 2, (y1 + y2) / 2, '#ffeb3b', 52);
    }
  }

  finishMatchDestruction() {
    // Apply level slide mode (level 2: down, level 3: up, etc.)
    const slideMode = (this.level - 1) % 5;
    if (slideMode > 0) {
      this.onet.applySlide(this.grid, slideMode);
    }

    // Check Win Condition
    let remaining = 0;
    for (let r = 0; r < this.gridConfig.rows; r++) {
      for (let c = 0; c < this.gridConfig.cols; c++) {
        if (this.grid[r][c] !== null) remaining++;
      }
    }

    if (remaining === 0) {
      this.triggerWin();
      return;
    }

    // Check Deadlock: if no moves left, auto-shuffle
    const pair = this.onet.findValidPair(this.grid);
    if (!pair) {
      this.floaters.spawn('NO MOVES! RESHUFFLING...', 540, 960, '#00e5ff', 58);
      window.soundEngine.playShuffle();
      this.onet.shuffleRemaining(this.grid);
    }
  }

  triggerWin() {
    this.isLevelWon = true;
    const timeBonus = Math.floor(this.timeLeft) * 10;
    this.score += timeBonus;

    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem('onet_highscore', '' + this.highScore);
    }

    this.saveLeaderboardScore(this.score, this.level);
    this.particles.spawnWinConfetti(80);
    window.soundEngine.playWin();

    setTimeout(() => {
      this.state = GAME_STATE.RESULT;
    }, 900);
  }

  triggerGameOver() {
    this.isLevelWon = false;
    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem('onet_highscore', '' + this.highScore);
    }
    this.saveLeaderboardScore(this.score, this.level);
    window.soundEngine.playGameOver();
    this.state = GAME_STATE.RESULT;
  }

  saveLeaderboardScore(score, level) {
    if (score <= 0) return;
    this.leaderboard.push({
      score,
      level,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    });
    this.leaderboard.sort((a, b) => b.score - a.score);
    if (this.leaderboard.length > 5) {
      this.leaderboard = this.leaderboard.slice(0, 5);
    }
    localStorage.setItem('onet_leaderboard', JSON.stringify(this.leaderboard));
  }

  // Power-ups
  useTimePowerup() {
    if (this.powerups.time <= 0 || this.state !== GAME_STATE.PLAYING) return;
    this.powerups.time--;
    this.timeLeft = Math.min(this.timeMax, this.timeLeft + 20);
    this.floaters.spawn('+20s TIME!', 270, 1620, '#00e5ff', 52);
    window.soundEngine.playTimeBonus();
  }

  useRollPowerup() {
    if (this.powerups.roll <= 0 || this.state !== GAME_STATE.PLAYING) return;
    this.powerups.roll--;
    this.selectedTile = null;
    this.onet.shuffleRemaining(this.grid);
    this.floaters.spawn('SHUFFLED!', 540, 960, '#76ff03', 60);
    window.soundEngine.playShuffle();
  }

  useHintPowerup() {
    if (this.powerups.hint <= 0 || this.state !== GAME_STATE.PLAYING) return;
    const pair = this.onet.findValidPair(this.grid);
    if (!pair) return;

    this.powerups.hint--;
    this.activeHint = pair;
    this.grid[pair.p1.r][pair.p1.c].hint = true;
    this.grid[pair.p2.r][pair.p2.c].hint = true;

    const { tileW, tileH, gapX, gapY, startX, startY } = this.gridConfig;
    const x1 = startX + pair.p1.c * (tileW + gapX) + tileW / 2;
    const y1 = startY + pair.p1.r * (tileH + gapY) + tileH / 2;
    const x2 = startX + pair.p2.c * (tileW + gapX) + tileW / 2;
    const y2 = startY + pair.p2.r * (tileH + gapY) + tileH / 2;

    this.particles.spawnHintSparkles(x1, y1);
    this.particles.spawnHintSparkles(x2, y2);
    this.floaters.spawn('HINT FOUND!', 540, 960, '#fffa65', 56);
    window.soundEngine.playHint();
  }

  // Main Loop
  loop(now) {
    const dt = Math.min((now - this.lastTime) / 1000, 0.1);
    this.lastTime = now;

    this.update(dt, now);
    this.render(now);

    requestAnimationFrame(this.loop.bind(this));
  }

  update(dt, now) {
    this.shake.update(dt);
    this.particles.update(dt);
    this.floaters.update(dt);

    // Gameplay Timer
    if (this.state === GAME_STATE.PLAYING && !this.activeConnection && (!this.destroyingTiles || this.destroyingTiles.length === 0)) {
      this.timeLeft -= dt;
      if (this.timeLeft <= 0) {
        this.timeLeft = 0;
        this.triggerGameOver();
      } else if (this.timeLeft <= 10 && Math.floor(this.timeLeft) !== Math.floor(this.timeLeft + dt)) {
        window.soundEngine.playTick();
      }
    }

    // Active Connection Line Animation (Progressive Laser Beam)
    if (this.isMatchTest && this.activeConnection) {
      this.activeConnection.startTime = now - (this.activeConnection.traceDuration * 0.72);
    }
    if (this.isDestroyTest && this.destroyingTiles && this.destroyingTiles.length > 0) {
      this.destroyingTiles[0].startTime = now - 95;
      this.destroyingTiles[1].startTime = now - 95;
    }

    if (this.activeConnection) {
      const elapsed = now - this.activeConnection.startTime;
      if (elapsed < this.activeConnection.traceDuration) {
        const traceT = elapsed / this.activeConnection.traceDuration;
        const targetDist = traceT * this.activeConnection.totalDist;
        for (const seg of this.activeConnection.segments) {
          if (targetDist >= seg.startDist && targetDist <= seg.endDist) {
            const t = (targetDist - seg.startDist) / (seg.len || 1);
            const tipX = seg.p0.x + (seg.p1.x - seg.p0.x) * t;
            const tipY = seg.p0.y + (seg.p1.y - seg.p0.y) * t;
            this.particles.spawnLaserSparks(tipX, tipY, 2);
            break;
          }
        }
      } else if (elapsed >= this.activeConnection.duration) {
        const conn = this.activeConnection;
        this.activeConnection = null;
        this.startTileDestruction(conn.p1, conn.p2, conn.type1, conn.type2);
      }
    }

    // Active Destroying Tiles Animation
    if (this.destroyingTiles && this.destroyingTiles.length > 0) {
      const firstTile = this.destroyingTiles[0];
      if (firstTile && now - firstTile.startTime >= firstTile.duration) {
        this.destroyingTiles = [];
        this.finishMatchDestruction();
      }
    }

    // Update powerup badges
    this.btnTimePowerup.badgeText = this.powerups.time;
    this.btnRollPowerup.badgeText = this.powerups.roll;
    this.btnHintPowerup.badgeText = this.powerups.hint;
  }

  render(now) {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, 1080, 1920);

    const offset = this.shake.getOffset();
    ctx.save();
    ctx.translate(offset.x, offset.y);

    switch (this.state) {
      case GAME_STATE.LOADING:
        this.renderLoadingScreen(ctx, now);
        break;
      case GAME_STATE.MENU:
        this.renderMenuScreen(ctx, now);
        break;
      case GAME_STATE.PLAYING:
      case GAME_STATE.PAUSED:
      case GAME_STATE.RESULT:
      case GAME_STATE.SETTINGS:
      case GAME_STATE.LEADERBOARD:
        this.renderGameplayScreen(ctx, now);
        if (this.state === GAME_STATE.PAUSED) this.renderPauseModal(ctx, now);
        if (this.state === GAME_STATE.RESULT) this.renderResultModal(ctx, now);
        if (this.state === GAME_STATE.SETTINGS) this.renderSettingsModal(ctx, now);
        if (this.state === GAME_STATE.LEADERBOARD) this.renderLeaderboardModal(ctx, now);
        break;
    }

    // Float text & particles rendered on top of everything
    this.particles.render(ctx);
    this.floaters.render(ctx);

    ctx.restore();
  }

  // --- Screens Rendering ---

  renderLoadingScreen(ctx, now) {
    // Background
    const bg = this.assets.get('MainMenu_Bg');
    if (bg) ctx.drawImage(bg, 0, 0, 1080, 1920);

    // Logo
    const logo = this.assets.get('Onet_Logo');
    if (logo) {
      const logoW = 820;
      const logoH = 460;
      const logoX = (1080 - logoW) / 2;
      const logoY = 380 + Math.sin(now * 0.003) * 12;
      ctx.drawImage(logo, logoX, logoY, logoW, logoH);
    }

    // Loading Text
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#2d1b4e';
    ctx.lineWidth = 10;
    ctx.lineJoin = 'round';
    ctx.font = '900 64px "Passion One", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.strokeText('Loading..', 540, 1200);
    ctx.fillText('Loading..', 540, 1200);

    // Loading Bar
    const barBg = this.assets.get('Load_Bar_Bg');
    const barFg = this.assets.get('Load_Bar_Fg');
    const barW = 800;
    const barH = 120;
    const barX = (1080 - barW) / 2;
    const barY = 1260;

    if (barBg) {
      ctx.drawImage(barBg, barX, barY, barW, barH);
    }

    if (barFg) {
      const fillW = Math.max(80, barW * this.loadProgress);
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(barX + 10, barY + 10, fillW - 20, barH - 20, 40);
      ctx.clip();
      ctx.drawImage(barFg, barX, barY, barW, barH);
      ctx.restore();
    }
  }

  renderMenuScreen(ctx, now) {
    // Background
    const bg = this.assets.get('MainMenu_Bg');
    if (bg) ctx.drawImage(bg, 0, 0, 1080, 1920);

    // Logo with breathing floating effect
    const logo = this.assets.get('Onet_Logo');
    if (logo) {
      const logoW = 860;
      const logoH = 480;
      const logoX = (1080 - logoW) / 2;
      const logoY = 320 + Math.sin(now * 0.003) * 15;
      ctx.drawImage(logo, logoX, logoY, logoW, logoH);
    }

    // High Score Box
    const crown = this.assets.get('Icon_Crown');
    if (crown) {
      ctx.drawImage(crown, 540 - 75, 760, 150, 128);
    }

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // "High Score" Title
    ctx.font = '900 48px "Passion One", sans-serif';
    ctx.strokeStyle = '#41103c';
    ctx.lineWidth = 10;
    ctx.lineJoin = 'round';
    ctx.fillStyle = '#fffa65';
    ctx.strokeText('High Score', 540, 920);
    ctx.fillText('High Score', 540, 920);

    // Score Value
    ctx.font = '900 96px "Passion One", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.strokeText('' + this.highScore, 540, 995);
    ctx.fillText('' + this.highScore, 540, 995);

    // Play Game Button
    this.btnPlayGame.render(ctx, this.assets);
    // Draw "Play Game" text inside button
    ctx.font = '900 64px "Passion One", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#225511';
    ctx.lineWidth = 10;
    ctx.strokeText('Play Game', 540, 1160);
    ctx.fillText('Play Game', 540, 1160);

    // Bottom Icons (Share, Leaderboard, Settings)
    this.btnShare.render(ctx, this.assets);
    this.btnLeaderboard.render(ctx, this.assets);
    this.btnSettings.render(ctx, this.assets);
  }

  renderGameplayScreen(ctx, now) {
    // Gameplay Background
    const bg = this.assets.get('Gameplay_Bg');
    if (bg) {
      ctx.drawImage(bg, 0, 0, 1080, 1920);
    } else {
      ctx.fillStyle = '#1b1632';
      ctx.fillRect(0, 0, 1080, 1920);
    }

    // Top Bar Image
    const topBar = this.assets.get('Top_Bar');
    const tbX = 50;
    const tbY = 30;
    const tbW = 980;
    const tbH = 290;
    if (topBar) {
      ctx.drawImage(topBar, tbX, tbY, tbW, tbH);
    }

    // Level Ribbon
    ctx.font = '900 68px "Passion One", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#9c4103';
    ctx.lineWidth = 8;
    ctx.strokeText('' + this.level, 181, 140);
    ctx.fillText('' + this.level, 181, 140);

    // "score" text and score digits
    ctx.font = '700 42px "Passion One", sans-serif';
    ctx.fillStyle = '#ffecb3';
    ctx.strokeStyle = '#5a1d3a';
    ctx.lineWidth = 8;
    ctx.strokeText('score', 540, 92);
    ctx.fillText('score', 540, 92);

    ctx.font = '900 70px "Passion One", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.strokeText('' + this.score, 540, 145);
    ctx.fillText('' + this.score, 540, 145);

    // Pause Button
    this.btnPause.render(ctx, this.assets);

    // Countdown Timer Bar inside Top_Bar slot
    const slotX = 145;
    const slotY = 244;
    const slotW = 810;
    const slotH = 26;
    const progress = Math.max(0, Math.min(1, this.timeLeft / this.timeMax));

    const clockBar = this.assets.get('Clock_Bar');
    if (clockBar && progress > 0) {
      const fillW = slotW * progress;
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(slotX, slotY, fillW, slotH, 13);
      ctx.clip();
      ctx.drawImage(clockBar, slotX, slotY, slotW, slotH);
      ctx.restore();
    }

    // Clock Icon
    const clockIcon = this.assets.get('Clock_Icon');
    if (clockIcon) {
      ctx.drawImage(clockIcon, slotX - 32, slotY - 14, 56, 54);
    }

    // Render Tile Grid
    this.renderTiles(ctx, now);

    // Render Destroying Tiles
    if (this.destroyingTiles && this.destroyingTiles.length > 0) {
      this.renderDestroyingTiles(ctx, now);
    }

    // Render Active Connection Laser
    if (this.activeConnection) {
      this.renderConnectionLine(ctx, this.activeConnection, now);
    }

    // Bottom Bar
    const bottomBar = this.assets.get('Bottom_Bar');
    if (bottomBar) {
      ctx.drawImage(bottomBar, 0, 1740, 1080, 180);
    }

    // Bottom Power-up Buttons
    this.btnTimePowerup.render(ctx, this.assets);
    this.btnRollPowerup.render(ctx, this.assets);
    this.btnHintPowerup.render(ctx, this.assets);

    // Labels under powerup buttons
    ctx.font = '900 38px "Passion One", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#b82e70';
    ctx.lineWidth = 8;
    ctx.lineJoin = 'round';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.strokeText('+Time', this.btnTimePowerup.x + this.btnTimePowerup.w / 2, this.btnTimePowerup.y + this.btnTimePowerup.h - 8);
    ctx.fillText('+Time', this.btnTimePowerup.x + this.btnTimePowerup.w / 2, this.btnTimePowerup.y + this.btnTimePowerup.h - 8);

    ctx.strokeText('Roll', this.btnRollPowerup.x + this.btnRollPowerup.w / 2, this.btnRollPowerup.y + this.btnRollPowerup.h - 8);
    ctx.fillText('Roll', this.btnRollPowerup.x + this.btnRollPowerup.w / 2, this.btnRollPowerup.y + this.btnRollPowerup.h - 8);

    ctx.strokeText('Hint', this.btnHintPowerup.x + this.btnHintPowerup.w / 2, this.btnHintPowerup.y + this.btnHintPowerup.h - 8);
    ctx.fillText('Hint', this.btnHintPowerup.x + this.btnHintPowerup.w / 2, this.btnHintPowerup.y + this.btnHintPowerup.h - 8);
  }

  renderTiles(ctx, now) {
    if (!this.grid) return;

    const { cols, rows, tileW, tileH, gapX, gapY, startX, startY } = this.gridConfig;
    const boxBg = this.assets.get('Box_Bg');
    const boxBgPressed = this.assets.get('Box_Bg_Pressed');

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const tile = this.grid[r][c];
        if (!tile) continue;

        const x = startX + c * (tileW + gapX);
        const y = startY + r * (tileH + gapY);

        ctx.save();
        const cx = x + tileW / 2;
        const cy = y + tileH / 2;
        ctx.translate(cx, cy);

        // Bouncy pulse on selection or hint
        let scale = 1.0;
        if (tile.selected) {
          scale = 1.08 + Math.sin(now * 0.012) * 0.04;
        } else if (tile.hint) {
          scale = 1.05 + Math.sin(now * 0.015) * 0.05;
        }
        ctx.scale(scale, scale);

        // Draw Cell Background
        const cellImg = tile.selected ? (boxBgPressed || boxBg) : boxBg;
        if (cellImg) {
          ctx.drawImage(cellImg, -tileW / 2, -tileH / 2, tileW, tileH);
        } else {
          ctx.fillStyle = tile.selected ? '#5c5496' : '#342f5d';
          ctx.beginPath();
          ctx.roundRect(-tileW / 2, -tileH / 2, tileW, tileH, 16);
          ctx.fill();
        }

        // Hint Pulsing Border
        if (tile.hint) {
          ctx.strokeStyle = '#ffd700';
          ctx.lineWidth = 6;
          ctx.strokeRect(-tileW / 2 - 2, -tileH / 2 - 2, tileW + 4, tileH + 4);
        }

        // Draw Monster Sprite
        const monsterNum = tile.type < 10 ? '0' + tile.type : '' + tile.type;
        const monsterImg = this.assets.get(`Onet${monsterNum}`);
        if (monsterImg) {
          const spriteSize = Math.min(tileW, tileH) * 0.90;
          ctx.drawImage(monsterImg, -spriteSize / 2, -spriteSize / 2, spriteSize, spriteSize);
        }

        ctx.restore();
      }
    }
  }

  // Beautiful Tile Destruction FX
  renderDestroyingTiles(ctx, now) {
    const { tileW, tileH } = this.gridConfig;
    const boxBg = this.assets.get('Box_Bg');
    const boxBgPressed = this.assets.get('Box_Bg_Pressed');

    for (const dTile of this.destroyingTiles) {
      const elapsed = now - dTile.startTime;
      const p = Math.min(1, elapsed / dTile.duration);

      ctx.save();
      ctx.translate(dTile.x, dTile.y);

      if (p < 0.25) {
        // Phase 1: Swell / Anticipation / White Glow Flash (0% - 25%)
        const t = p / 0.25;
        const scale = 1.0 + Math.sin(t * Math.PI * 0.5) * 0.35; // 1.0 to 1.35
        ctx.scale(scale, scale);

        // Bright white energy glow
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 28 * t;

        // Cell Background
        const cellImg = boxBgPressed || boxBg;
        if (cellImg) {
          ctx.drawImage(cellImg, -tileW / 2, -tileH / 2, tileW, tileH);
        }

        // Monster Sprite
        const monsterNum = dTile.type < 10 ? '0' + dTile.type : '' + dTile.type;
        const monsterImg = this.assets.get(`Onet${monsterNum}`);
        if (monsterImg) {
          const spriteSize = Math.min(tileW, tileH) * 0.90;
          ctx.drawImage(monsterImg, -spriteSize / 2, -spriteSize / 2, spriteSize, spriteSize);
        }

        // White Energy Flash Overlay
        ctx.fillStyle = `rgba(255, 255, 255, ${0.5 * t})`;
        ctx.beginPath();
        ctx.arc(0, 0, (tileW / 2) * 0.95, 0, Math.PI * 2);
        ctx.fill();

      } else {
        // Phase 2: Shatter / Shrink / Implode / Fadeout (25% - 100%)
        const t = (p - 0.25) / 0.75;
        const scale = 1.35 * Math.pow(1 - t, 2.2);
        const alpha = Math.max(0, 1 - Math.pow(t, 1.3));
        const rot = dTile.dir * t * 0.8;

        ctx.globalAlpha = alpha;
        ctx.rotate(rot);
        ctx.scale(scale, scale);

        // Hot pink edge glow
        ctx.shadowColor = '#ff007f';
        ctx.shadowBlur = 24 * (1 - t);

        // Cell Background
        const cellImg = boxBgPressed || boxBg;
        if (cellImg) {
          ctx.drawImage(cellImg, -tileW / 2, -tileH / 2, tileW, tileH);
        }

        // Monster Sprite
        const monsterNum = dTile.type < 10 ? '0' + dTile.type : '' + dTile.type;
        const monsterImg = this.assets.get(`Onet${monsterNum}`);
        if (monsterImg) {
          const spriteSize = Math.min(tileW, tileH) * 0.90;
          ctx.drawImage(monsterImg, -spriteSize / 2, -spriteSize / 2, spriteSize, spriteSize);
        }

        // Expanding shock aura ring
        ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.lineWidth = Math.max(1, 6 * (1 - t));
        ctx.beginPath();
        ctx.arc(0, 0, (tileW * 0.4) * (1 + t * 0.9), 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.restore();
    }
  }

  // Neon Glowing Progressive Laser Connection Path
  renderConnectionLine(ctx, conn, now) {
    if (!conn || !conn.points || conn.points.length < 2) return;

    const elapsed = now - conn.startTime;
    const traceT = Math.min(1, elapsed / (conn.traceDuration || 300));
    const currDist = traceT * (conn.totalDist || 1);

    // Collect all path points to draw up to currDist
    const drawPoints = [{ x: conn.points[0].x, y: conn.points[0].y }];
    let tipPt = { x: conn.points[0].x, y: conn.points[0].y };
    let reachedNodes = 1; // start node reached

    if (conn.segments && conn.segments.length > 0) {
      for (let i = 0; i < conn.segments.length; i++) {
        const seg = conn.segments[i];
        if (currDist >= seg.endDist) {
          drawPoints.push({ x: seg.p1.x, y: seg.p1.y });
          reachedNodes++;
          tipPt = { x: seg.p1.x, y: seg.p1.y };
        } else if (currDist > seg.startDist) {
          const segT = (currDist - seg.startDist) / (seg.len || 1);
          tipPt = {
            x: seg.p0.x + (seg.p1.x - seg.p0.x) * segT,
            y: seg.p0.y + (seg.p1.y - seg.p0.y) * segT
          };
          drawPoints.push(tipPt);
          break;
        } else {
          break;
        }
      }
    } else {
      drawPoints.push(...conn.points.slice(1));
      tipPt = conn.points[conn.points.length - 1];
    }

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const isHold = traceT >= 1;
    const pulseOffset = isHold ? Math.sin(now * 0.05) * 1.5 : 0;

    if (drawPoints.length >= 2) {
      // 1. Wide Outer Neon Glow (Magenta / Pink)
      ctx.shadowColor = '#ff007f';
      ctx.shadowBlur = 24;
      ctx.strokeStyle = 'rgba(255, 30, 130, 0.65)';
      ctx.lineWidth = 26 + pulseOffset;
      ctx.beginPath();
      ctx.moveTo(drawPoints[0].x, drawPoints[0].y);
      for (let i = 1; i < drawPoints.length; i++) {
        ctx.lineTo(drawPoints[i].x, drawPoints[i].y);
      }
      ctx.stroke();

      // 2. Vibrant Hot Pink Beam
      ctx.shadowBlur = 0;
      ctx.strokeStyle = '#ff1493';
      ctx.lineWidth = 14 + pulseOffset * 0.5;
      ctx.stroke();

      // 3. Bright White Core
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 6;
      ctx.stroke();
    }

    // 4. Start Endpoint Ring
    ctx.fillStyle = '#ff1493';
    ctx.beginPath();
    ctx.arc(conn.points[0].x, conn.points[0].y, 22, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(conn.points[0].x, conn.points[0].y, 14, 0, Math.PI * 2);
    ctx.fill();

    // 5. Reached Intermediate Corner Nodes
    for (let i = 1; i < reachedNodes && i < conn.points.length - 1; i++) {
      const pt = conn.points[i];
      const cornerPulse = Math.sin(now * 0.02 + i) * 2;
      ctx.fillStyle = '#ff1493';
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 16 + cornerPulse, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 10, 0, Math.PI * 2);
      ctx.fill();
    }

    // 6. Laser Head Tip or Final Endpoint
    if (!isHold) {
      // Animated Projectile Head at moving tip
      const tipPulse = Math.sin(now * 0.035) * 3;

      // Outer energy corona
      ctx.fillStyle = 'rgba(255, 0, 128, 0.65)';
      ctx.beginPath();
      ctx.arc(tipPt.x, tipPt.y, 24 + tipPulse, 0, Math.PI * 2);
      ctx.fill();

      // Inner electric magenta orb
      ctx.fillStyle = '#ff007f';
      ctx.beginPath();
      ctx.arc(tipPt.x, tipPt.y, 16, 0, Math.PI * 2);
      ctx.fill();

      // White-hot center
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(tipPt.x, tipPt.y, 9, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Completed Connection: End Node
      const lastPt = conn.points[conn.points.length - 1];
      ctx.fillStyle = '#ff1493';
      ctx.beginPath();
      ctx.arc(lastPt.x, lastPt.y, 22, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(lastPt.x, lastPt.y, 14, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  // --- Modals & Popups ---

  renderDimOverlay(ctx) {
    ctx.fillStyle = 'rgba(15, 11, 33, 0.82)';
    ctx.fillRect(0, 0, 1080, 1920);
  }

  renderSettingsModal(ctx, now) {
    this.renderDimOverlay(ctx);

    const popup = this.assets.get('PopUp_Setting');
    const modalX = 130;
    const modalY = 360;
    const modalW = 820;
    const modalH = 1040;

    if (popup) {
      ctx.drawImage(popup, modalX, modalY, modalW, modalH);
    } else {
      ctx.fillStyle = '#f8b99d';
      ctx.beginPath();
      ctx.roundRect(modalX, modalY, modalW, modalH, 40);
      ctx.fill();
    }

    // Title
    ctx.font = '900 68px "Passion One", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#621940';
    ctx.lineWidth = 10;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.strokeText('Settings', 540, 440);
    ctx.fillText('Settings', 540, 440);

    // Close Button
    this.btnCloseSettings.render(ctx, this.assets);

    // Toggle Buttons
    this.btnToggleMusic.render(ctx, this.assets);
    this.btnToggleSound.render(ctx, this.assets);
    this.btnToggleVibra.render(ctx, this.assets);

    // Remove Ads Button
    this.btnRemoveAds.render(ctx, this.assets);
    const adsIcon = this.assets.get(this.adsRemoved ? 'Icon_Ads_Disable' : 'Icon_Ads');
    if (adsIcon) {
      ctx.drawImage(adsIcon, 270, 875, 72, 70);
    }
    ctx.font = '900 52px "Passion One", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = this.adsRemoved ? '#3e2723' : '#0d47a1';
    ctx.lineWidth = 8;
    const adsText = this.adsRemoved ? 'Ads Removed' : 'Remove Ads';
    ctx.strokeText(adsText, 580, 910);
    ctx.fillText(adsText, 580, 910);

    // Terms Button
    this.btnTerms.render(ctx, this.assets);
    ctx.font = '900 52px "Passion One", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#0d47a1';
    ctx.lineWidth = 8;
    ctx.strokeText('Terms of use', 540, 1100);
    ctx.fillText('Terms of use', 540, 1100);
  }

  renderResultModal(ctx, now) {
    this.renderDimOverlay(ctx);

    const popup = this.assets.get('PopUp_Result');
    const modalX = 180;
    const modalY = 330;
    const modalW = 720;
    const modalH = 1010;

    if (popup) {
      ctx.drawImage(popup, modalX, modalY, modalW, modalH);
    } else {
      ctx.fillStyle = '#f8b99d';
      ctx.beginPath();
      ctx.roundRect(modalX, modalY, modalW, modalH, 40);
      ctx.fill();
    }

    // Title
    ctx.font = '900 70px "Passion One", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#5f1e42';
    ctx.lineWidth = 10;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const titleText = this.isLevelWon ? 'Results' : 'Game Over';
    ctx.strokeText(titleText, 540, 405);
    ctx.fillText(titleText, 540, 405);

    // Close Button
    this.btnCloseResult.x = 815;
    this.btnCloseResult.y = 370;
    this.btnCloseResult.w = 70;
    this.btnCloseResult.h = 70;
    this.btnCloseResult.render(ctx, this.assets);

    // Score Container Box
    const scoreBox = this.assets.get('Score_Box');
    const sbW = 420;
    const sbH = 150;
    const sbX = (1080 - sbW) / 2;
    const sbY = 490;
    if (scoreBox) {
      ctx.drawImage(scoreBox, sbX, sbY, sbW, sbH);
    }

    ctx.font = '900 40px "Passion One", sans-serif';
    ctx.fillStyle = '#bf432b';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Score', 540, sbY + 40);

    ctx.font = '900 76px "Passion One", sans-serif';
    ctx.fillStyle = '#ffea3b';
    ctx.strokeStyle = '#5a1d3a';
    ctx.lineWidth = 10;
    ctx.lineJoin = 'round';
    ctx.strokeText('' + this.score, 540, sbY + 105);
    ctx.fillText('' + this.score, 540, sbY + 105);

    // High Score Container Box
    const hsbW = 500;
    const hsbH = 180;
    const hsbX = (1080 - hsbW) / 2;
    const hsbY = 700;
    const hsBox = this.assets.get('HighScore_Box') || scoreBox;
    if (hsBox) {
      ctx.drawImage(hsBox, hsbX, hsbY, hsbW, hsbH);
    }

    const crown = this.assets.get('Icon_Crown');
    if (crown) {
      ctx.drawImage(crown, 540 - 50, hsbY - 45, 100, 85);
    }

    ctx.font = '900 40px "Passion One", sans-serif';
    ctx.fillStyle = '#bf432b';
    ctx.fillText('High Score', 540, hsbY + 58);

    ctx.font = '900 80px "Passion One", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#5a1d3a';
    ctx.lineWidth = 10;
    ctx.strokeText('' + this.highScore, 540, hsbY + 125);
    ctx.fillText('' + this.highScore, 540, hsbY + 125);

    // Bonus Section (drawn inside the pill already embedded in PopUp_Result)
    if (this.isLevelWon) {
      const pillCenterY = modalY + 685; // ~1015

      ctx.font = '900 46px "Passion One", sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#5a1d3a';
      ctx.lineWidth = 6;
      ctx.strokeText('Bonus', 540, pillCenterY);
      ctx.fillText('Bonus', 540, pillCenterY);

      // +Time bonus
      const timeIcon = this.assets.get('Clock_Icon') || this.assets.get('Icon_Time');
      if (timeIcon) ctx.drawImage(timeIcon, 340, 1075, 68, 68);
      ctx.font = '900 48px "Passion One", sans-serif';
      ctx.fillStyle = '#00c853';
      ctx.strokeStyle = '#1b5e20';
      ctx.lineWidth = 8;
      ctx.strokeText('+1', 435, 1110);
      ctx.fillText('+1', 435, 1110);

      ctx.font = '900 34px "Passion One", sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#b82e70';
      ctx.lineWidth = 8;
      ctx.strokeText('+Time', 395, 1165);
      ctx.fillText('+Time', 395, 1165);

      // +Roll bonus
      const rollIcon = this.assets.get('Icon_Roll');
      if (rollIcon) ctx.drawImage(rollIcon, 600, 1075, 68, 68);
      ctx.font = '900 48px "Passion One", sans-serif';
      ctx.fillStyle = '#00c853';
      ctx.strokeStyle = '#1b5e20';
      ctx.lineWidth = 8;
      ctx.strokeText('+1', 695, 1110);
      ctx.fillText('+1', 695, 1110);

      ctx.font = '900 34px "Passion One", sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#b82e70';
      ctx.lineWidth = 8;
      ctx.strokeText('Roll', 655, 1165);
      ctx.fillText('Roll', 655, 1165);
    }

    // Play/Next & Home Buttons (overlapping bottom of modal)
    this.btnResultPlay.x = 340;
    this.btnResultPlay.y = 1250;
    this.btnResultPlay.w = 175;
    this.btnResultPlay.h = 175;
    this.btnResultPlay.render(ctx, this.assets);

    this.btnResultHome.x = 565;
    this.btnResultHome.y = 1250;
    this.btnResultHome.w = 175;
    this.btnResultHome.h = 175;
    this.btnResultHome.render(ctx, this.assets);
  }

  renderPauseModal(ctx, now) {
    this.renderDimOverlay(ctx);

    const popup = this.assets.get('PopUp_Setting');
    const modalX = 140;
    const modalY = 460;
    const modalW = 800;
    const modalH = 800;

    if (popup) {
      ctx.drawImage(popup, modalX, modalY, modalW, modalH);
    } else {
      ctx.fillStyle = '#f8b99d';
      ctx.beginPath();
      ctx.roundRect(modalX, modalY, modalW, modalH, 40);
      ctx.fill();
    }

    ctx.font = '900 76px "Passion One", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#5f1e42';
    ctx.lineWidth = 10;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.strokeText('Game Paused', 540, 540);
    ctx.fillText('Game Paused', 540, 540);

    // Sound and Music Toggles in Pause Menu
    this.btnToggleMusic.x = 340;
    this.btnToggleMusic.y = 640;
    this.btnToggleSound.x = 560;
    this.btnToggleSound.y = 640;

    this.btnToggleMusic.render(ctx, this.assets);
    this.btnToggleSound.render(ctx, this.assets);

    // Resume & Home Buttons
    this.btnResume.render(ctx, this.assets);
    this.btnPauseHome.render(ctx, this.assets);
  }

  renderLeaderboardModal(ctx, now) {
    this.renderDimOverlay(ctx);

    const popup = this.assets.get('PopUp_Setting');
    const modalX = 130;
    const modalY = 360;
    const modalW = 820;
    const modalH = 1040;

    if (popup) {
      ctx.drawImage(popup, modalX, modalY, modalW, modalH);
    }

    ctx.font = '900 72px "Passion One", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#621940';
    ctx.lineWidth = 10;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.strokeText('Leaderboard', 540, 440);
    ctx.fillText('Leaderboard', 540, 440);

    this.btnCloseLeaderboard.render(ctx, this.assets);

    // Render Top 5 Scores
    const startY = 620;
    const rowH = 125;

    this.leaderboard.slice(0, 5).forEach((entry, idx) => {
      const y = startY + idx * rowH;

      // Card plate behind each row
      ctx.fillStyle = idx === 0 ? 'rgba(255, 235, 59, 0.22)' : 'rgba(255, 255, 255, 0.15)';
      ctx.beginPath();
      ctx.roundRect(200, y - 48, 680, 96, 20);
      ctx.fill();

      // Crown for #1
      if (idx === 0) {
        const crown = this.assets.get('Icon_Crown');
        if (crown) ctx.drawImage(crown, 215, y - 36, 68, 58);
      }

      ctx.fillStyle = idx === 0 ? '#ffea3b' : '#ffffff';
      ctx.strokeStyle = '#2b1055';
      ctx.lineWidth = 8;
      ctx.font = '900 52px "Passion One", sans-serif';
      ctx.textAlign = 'left';

      const rankBadge = `#${idx + 1}`;
      ctx.strokeText(rankBadge, idx === 0 ? 295 : 230, y);
      ctx.fillText(rankBadge, idx === 0 ? 295 : 230, y);

      ctx.textAlign = 'center';
      const detail = `Level ${entry.level}`;
      ctx.font = '700 44px "Passion One", sans-serif';
      ctx.strokeText(detail, 520, y);
      ctx.fillText(detail, 520, y);

      ctx.textAlign = 'right';
      ctx.font = '900 56px "Passion One", sans-serif';
      ctx.strokeText('' + entry.score, 850, y);
      ctx.fillText('' + entry.score, 850, y);
    });
  }
}

// Instantiate game when DOM is loaded
window.addEventListener('DOMContentLoaded', () => {
  window.onetGame = new OnetGame();
});
