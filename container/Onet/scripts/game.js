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
    const savedHighScore = localStorage.getItem('onet_highscore');
    this.highScore = (savedHighScore && savedHighScore !== '23456') ? parseInt(savedHighScore, 10) : 250;
    if (savedHighScore === '23456') {
      localStorage.setItem('onet_highscore', '250');
    }
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
    this.comboBanner = {
      count: 0,
      timer: 0,
      maxTimer: 3.5,
      text: '',
      scale: 1.0
    };

    // Time Warning Reminder State
    this.timeWarning30 = false;
    this.timeWarning15 = false;
    this.lastTickSec = -1;

    // Tutorial state (active only for 1st time player on level 1, guides 2 matches)
    this.tutorialActive = false;
    this.tutorialStep = 0; // 1 for 1st match, 2 for 2nd match
    this.tutorialPair = null;

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
    if (this.leaderboard.length === 0 || (this.leaderboard[0] && this.leaderboard[0].score === 23456)) {
      this.leaderboard = [
        { score: 320, level: 3, date: 'Champion' },
        { score: 260, level: 2, date: 'Master' },
        { score: 190, level: 2, date: 'Pro' },
        { score: 120, level: 1, date: 'Player' },
        { score: 60, level: 1, date: 'Novice' }
      ];
      localStorage.setItem('onet_leaderboard', JSON.stringify(this.leaderboard));
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
            const customTime = params.get('time');
            if (customTime !== null) {
              this.timeLeft = Math.max(0, parseFloat(customTime));
            }
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
      x: 775,
      y: 92,
      w: 86,
      h: 86,
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
      x: 875,
      y: 92,
      w: 86,
      h: 86,
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

    // Tutorial Skip Button
    this.btnSkipTutorial = new UIButton({
      id: 'btn_skip_tutorial',
      x: 815,
      y: 224,
      w: 170,
      h: 66,
      normalKey: 'Btn_Brown',
      pressedKey: 'Btn_Brown',
      onClick: () => {
        window.soundEngine.playClick();
        this.completeTutorial(true);
      }
    });
  }

  getActiveButtons() {
    switch (this.state) {
      case GAME_STATE.MENU:
        return [this.btnPlayGame];
      case GAME_STATE.PLAYING:
        if (this.tutorialActive) {
          return [this.btnSettings, this.btnPause, this.btnSkipTutorial];
        }
        return [this.btnSettings, this.btnPause, this.btnTimePowerup, this.btnRollPowerup, this.btnHintPowerup];
      case GAME_STATE.SETTINGS:
        return [this.btnCloseSettings, this.btnToggleMusic, this.btnToggleSound, this.btnResume];
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
    this.lastMatchTime = 0;
    this.selectedTile = null;
    this.activeConnection = null;
    this.destroyingTiles = [];
    this.activeHint = null;
    this.isLevelWon = false;

    // Reset warnings and combo banner
    this.timeWarning30 = false;
    this.timeWarning15 = false;
    this.lastTickSec = -1;
    this.comboBanner = { count: 0, timer: 0, maxTimer: 3.5, text: '', scale: 1.0 };
    this.btnTimePowerup.pulse = 0;

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

    // Check if 1st time player for tutorial (guides 2 matches, then next time never shows)
    const tutorialCompleted = localStorage.getItem('onet_tutorial_completed') === 'true';
    const forceTutorial = new URLSearchParams(window.location.search).get('tutorial') === 'true';

    if ((!tutorialCompleted || forceTutorial) && level === 1) {
      this.startTutorial();
    } else {
      this.tutorialActive = false;
      this.tutorialStep = 0;
      this.tutorialPair = null;
    }

    window.soundEngine.playClick();
    this.floaters.spawn(`LEVEL ${this.level}!`, 540, 960, '#fffa65', 72, 1.2, {
      glowColor: '#ffea00',
      strokeColor: '#381404',
      bgBadge: true,
      duration: 1.3
    });
  }

  startTutorial() {
    this.tutorialActive = true;
    this.tutorialStep = 1;
    this.tutorialPair = this.findTutorialPair(true);
  }

  findTutorialPair(preferAdjacent = true) {
    if (!this.grid) return null;
    const { rows, cols } = this.gridConfig;
    const validPairs = [];

    for (let r1 = 0; r1 < rows; r1++) {
      for (let c1 = 0; c1 < cols; c1++) {
        const t1 = this.grid[r1][c1];
        if (!t1) continue;
        for (let r2 = 0; r2 < rows; r2++) {
          for (let c2 = 0; c2 < cols; c2++) {
            if (r1 === r2 && c1 === c2) continue;
            const t2 = this.grid[r2][c2];
            if (!t2 || t1.type !== t2.type) continue;
            if (r1 * cols + c1 > r2 * cols + c2) continue;

            const path = this.onet.findPath(this.grid, { r: r1, c: c1 }, { r: r2, c: c2 });
            if (path) {
              const dist = Math.abs(r1 - r2) + Math.abs(c1 - c2);
              validPairs.push({
                p1: { r: r1, c: c1, tile: t1 },
                p2: { r: r2, c: c2, tile: t2 },
                path,
                dist,
                isAdjacent: dist === 1,
                isStraight: path.length === 2
              });
            }
          }
        }
      }
    }

    if (validPairs.length === 0) {
      return this.onet.findValidPair(this.grid);
    }

    if (preferAdjacent) {
      const adj = validPairs.find((p) => p.isAdjacent);
      if (adj) return adj;
      const straight = validPairs.find((p) => p.isStraight);
      if (straight) return straight;
    }

    validPairs.sort((a, b) => a.dist - b.dist);
    return validPairs[0];
  }

  onTutorialMatchComplete() {
    if (this.tutorialStep === 1) {
      this.tutorialStep = 2;
      this.tutorialPair = this.findTutorialPair(false);
      if (!this.tutorialPair) {
        this.completeTutorial(false);
        return;
      }
      this.floaters.spawn('GREAT! 🎯 NOW MATCH #2', 540, 780, '#ffea00', 60, 1.2, {
        subText: 'CONNECT THE 2ND PAIR!',
        subColor: '#ffffff',
        glowColor: '#ff9100',
        strokeColor: '#3a1200',
        bgBadge: true,
        duration: 1.4
      });
    } else if (this.tutorialStep >= 2) {
      this.completeTutorial(false);
    }
  }

  completeTutorial(skipped = false) {
    this.tutorialActive = false;
    this.tutorialStep = 0;
    this.tutorialPair = null;
    localStorage.setItem('onet_tutorial_completed', 'true');

    if (!skipped) {
      window.soundEngine.playWin();
      this.particles.spawnWinConfetti(65);
      this.floaters.spawn('TUTORIAL COMPLETED! 🏆', 540, 800, '#00ff88', 64, 1.3, {
        subText: 'READY TO PLAY! MATCH THEM ALL!',
        subColor: '#ffffff',
        glowColor: '#00ff88',
        strokeColor: '#003311',
        bgBadge: true,
        duration: 2.0
      });
    } else {
      this.showToast('Tutorial Skipped');
    }
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

    // Restrict tile clicks during tutorial to the tutorial pair
    if (this.tutorialActive && this.tutorialPair) {
      const isP1 = r === this.tutorialPair.p1.r && c === this.tutorialPair.p1.c;
      const isP2 = r === this.tutorialPair.p2.r && c === this.tutorialPair.p2.c;
      if (!isP1 && !isP2) {
        window.soundEngine.playDeselect();
        this.floaters.spawn('TAP THE GLOWING TILES! 👆', 540, 720, '#ffea00', 46, 1.0, {
          glowColor: '#ff9100',
          strokeColor: '#3a1200',
          bgBadge: true,
          duration: 0.9
        });
        return;
      }
    }

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
    const animDuration = 280; // ms
    this.destroyingTiles = [
      { r: p1.r, c: p1.c, x: x1, y: y1, type: type1, startTime: now, duration: animDuration, dir: -1 },
      { r: p2.r, c: p2.c, x: x2, y: y2, type: type2, startTime: now, duration: animDuration, dir: 1 }
    ];

    // High energy physics shard explosion & star bursts
    const monsterImg1 = this.assets.get(`Onet${type1 < 10 ? '0' + type1 : type1}`);
    const monsterImg2 = this.assets.get(`Onet${type2 < 10 ? '0' + type2 : type2}`);
    const boxBgImg = this.assets.get('Box_Bg_Pressed') || this.assets.get('Box_Bg');

    this.particles.spawnTileShards(x1, y1, monsterImg1, boxBgImg, tileW, tileH);
    this.particles.spawnTileShards(x2, y2, monsterImg2, boxBgImg, tileW, tileH);
    this.particles.spawnMatchBurst(x1, y1, 22);
    this.particles.spawnMatchBurst(x2, y2, 22);

    // Audio & Screen Shake
    window.soundEngine.playTileExplode();

    const elapsedSinceLast = now - this.lastMatchTime;
    if (elapsedSinceLast < 3200 && this.lastMatchTime > 0) {
      this.comboCount++;
    } else {
      this.comboCount = 1;
    }
    this.lastMatchTime = now;

    // Pitch-scaled match sound & tactical punchy shake
    window.soundEngine.playMatch(this.comboCount);
    this.shake.start(this.comboCount >= 3 ? 12 : 7, 0.18);

    // Calculate score (random 1 to 20 for each match)
    const earned = Math.floor(Math.random() * 20) + 1;
    this.score += earned;

    // Occasional Player Appreciation ("NICE!", "WOW!", "SUPER!")
    // Only triggers on combo streaks, fast reflex matches, or occasionally (~18% of normal matches)
    let showPraise = false;
    let praiseText = '';
    let praiseColor = '#fffa65';
    let glowColor = '#ffeb3b';
    let strokeColor = '#240a3d';
    let badge = false;
    let bannerText = '';

    if (this.comboCount >= 5) {
      showPraise = true;
      praiseText = 'AMAZING! 👑';
      praiseColor = '#ff2a85';
      glowColor = '#ff007f';
      strokeColor = '#3a001a';
      badge = true;
      bannerText = `👑 AMAZING x${this.comboCount}!`;
      window.soundEngine.playPraise(this.comboCount);
    } else if (this.comboCount === 4) {
      showPraise = true;
      praiseText = 'SUPER! ⚡';
      praiseColor = '#00f0ff';
      glowColor = '#00e5ff';
      strokeColor = '#00253a';
      badge = true;
      bannerText = `⚡ SUPER x4!`;
      window.soundEngine.playPraise(this.comboCount);
    } else if (this.comboCount === 3) {
      showPraise = true;
      praiseText = 'WOW! 🌟';
      praiseColor = '#ff9100';
      glowColor = '#ff3d00';
      strokeColor = '#3a1200';
      badge = true;
      bannerText = `🌟 WOW x3!`;
      window.soundEngine.playPraise(this.comboCount);
    } else if (this.comboCount === 2) {
      showPraise = true;
      praiseText = 'NICE! 🔥';
      praiseColor = '#ffea00';
      glowColor = '#ff9100';
      strokeColor = '#3a2000';
      badge = true;
      bannerText = `🔥 COMBO x2!`;
      window.soundEngine.playPraise(this.comboCount);
    } else if (elapsedSinceLast < 1400 && elapsedSinceLast > 0) {
      // Fast reflex match
      showPraise = true;
      const speedOptions = ['WOW! ⚡', 'NICE! 🚀', 'SUPER! ⚡'];
      praiseText = speedOptions[Math.floor(Math.random() * speedOptions.length)];
      praiseColor = '#00ffcc';
      glowColor = '#00e676';
      strokeColor = '#00331e';
      badge = true;
    } else if (Math.random() < 0.18) {
      // Occasional gentle compliment on ~18% of normal matches
      showPraise = true;
      const occasionalPraises = ['NICE! 👍', 'WOW! ✨', 'SUPER! 🌟', 'SWEET! 🍬'];
      praiseText = occasionalPraises[Math.floor(Math.random() * occasionalPraises.length)];
      praiseColor = '#fffa65';
      glowColor = '#ffcc00';
      strokeColor = '#2b1055';
    }

    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;

    if (showPraise) {
      // Celebratory praise badge with score
      this.floaters.spawn(praiseText, midX, midY, praiseColor, badge ? 56 : 48, 1.15, {
        isPraise: true,
        subText: `+${earned} PTS`,
        subColor: '#ffffff',
        glowColor: glowColor,
        strokeColor: strokeColor,
        bgBadge: badge,
        duration: 1.2,
        driftY: 90
      });
    } else {
      // Clean, elegant score floater without repetitive praise text
      this.floaters.spawn(`+${earned}`, midX, midY, '#fffa65', 42, 1.0, {
        isPraise: false,
        strokeColor: '#3a1800',
        glowColor: '#ff9100',
        duration: 0.85,
        driftY: 65
      });
    }

    // Update active combo streak banner only when combo >= 2
    if (this.comboCount >= 2) {
      this.comboBanner = {
        count: this.comboCount,
        timer: 3.2,
        maxTimer: 3.2,
        text: bannerText,
        scale: 1.3
      };
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

    // Check Tutorial Progression
    if (this.tutorialActive) {
      this.onTutorialMatchComplete();
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
    const timeBonus = Math.max(1, Math.floor(this.timeLeft / 10));
    this.score += timeBonus;

    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem('onet_highscore', '' + this.highScore);
    }

    this.saveLeaderboardScore(this.score, this.level);
    this.particles.spawnWinConfetti(80);
    window.soundEngine.playWin();

    // Dispatch score on level win
    if (typeof window.sendScore === 'function') {
      window.sendScore(this.score);
    }

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

    // Dispatch score on game over
    if (typeof window.sendScore === 'function') {
      window.sendScore(this.score);
    }

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

    // Reset warnings if time was restored
    if (this.timeLeft > 30) {
      this.timeWarning30 = false;
      this.timeWarning15 = false;
      this.lastTickSec = -1;
      this.btnTimePowerup.pulse = 0;
    } else if (this.timeLeft > 15) {
      this.timeWarning15 = false;
      this.lastTickSec = -1;
    }

    this.floaters.spawn('+20s TIME ADDED! ⏰', 270, 1580, '#00ff88', 56, 1.2, {
      duration: 1.4,
      glowColor: '#00ff88',
      strokeColor: '#003311',
      bgBadge: true,
      driftY: 70
    });
    window.soundEngine.playTimeBonus();
  }

  useRollPowerup() {
    if (this.powerups.roll <= 0 || this.state !== GAME_STATE.PLAYING) return;
    this.powerups.roll--;
    this.selectedTile = null;
    this.onet.shuffleRemaining(this.grid);
    this.floaters.spawn('SHUFFLED! 🎲', 540, 960, '#76ff03', 60, 1.2, {
      duration: 1.2,
      glowColor: '#76ff03',
      strokeColor: '#123800',
      bgBadge: true
    });
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
    this.floaters.spawn('HINT FOUND! 💡', 540, 960, '#fffa65', 58, 1.2, {
      duration: 1.2,
      glowColor: '#ffea00',
      strokeColor: '#3d2b00',
      bgBadge: true
    });
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

    // Update Combo Banner Timer & Sparks
    if (this.comboBanner.timer > 0) {
      this.comboBanner.timer -= dt;
      if (this.comboBanner.timer <= 0) {
        this.comboCount = 0;
        this.comboBanner.timer = 0;
      }
      if (this.comboBanner.scale > 1.0) {
        this.comboBanner.scale = Math.max(1.0, this.comboBanner.scale - dt * 1.8);
      }
      if (this.comboBanner.count >= 2 && Math.random() < 0.35) {
        this.particles.spawnFlameSparks(540 + (Math.random() - 0.5) * 260, 280);
      }
    }

    // Gameplay Timer & Progressive Warnings (frozen during tutorial)
    if (this.state === GAME_STATE.PLAYING && !this.activeConnection && (!this.destroyingTiles || this.destroyingTiles.length === 0) && !this.tutorialActive) {
      this.timeLeft -= dt;
      if (this.timeLeft <= 0) {
        this.timeLeft = 0;
        this.triggerGameOver();
      } else {
        // Warning 1: <= 30 seconds
        if (this.timeLeft <= 30 && !this.timeWarning30) {
          this.timeWarning30 = true;
          window.soundEngine.playTimeWarning();
          this.floaters.spawn('⏳ 30s LEFT! HURRY UP!', 540, 520, '#ffea00', 64, 1.25, {
            duration: 1.6,
            glowColor: '#ff9100',
            strokeColor: '#4a1505',
            bgBadge: true,
            driftY: 60
          });
          this.btnTimePowerup.pulse = 1;
        }

        // Warning 2: <= 15 seconds
        if (this.timeLeft <= 15 && !this.timeWarning15) {
          this.timeWarning15 = true;
          window.soundEngine.playTimeCritical();
          this.floaters.spawn('⚠️ 15s LEFT! TIME RUNNING OUT!', 540, 520, '#ff1744', 66, 1.3, {
            duration: 1.6,
            glowColor: '#ff0055',
            strokeColor: '#3d0014',
            bgBadge: true,
            driftY: 60
          });
          this.shake.start(8, 0.28);
          this.btnTimePowerup.pulse = 1;
        }

        // Critical Final Countdown Ticker: <= 10 seconds (10, 9, 8... 1)
        if (this.timeLeft <= 10 && this.timeLeft > 0) {
          const curSec = Math.ceil(this.timeLeft);
          if (curSec !== this.lastTickSec) {
            this.lastTickSec = curSec;
            window.soundEngine.playUrgentTick(curSec);
            if (curSec <= 5) {
              this.shake.start(4, 0.12);
            }
          }
        }
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

    // Play Game Button (Tap to Play)
    this.btnPlayGame.render(ctx, this.assets);
    // Draw "Tap to Play" text inside button with softer bold weight
    ctx.font = '700 58px "Passion One", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#225511';
    ctx.lineWidth = 5;
    ctx.strokeText('Tap to Play', 540, 1160);
    ctx.fillText('Tap to Play', 540, 1160);
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

    // Urgent Red Vignette & Border Pulse when time <= 15 seconds
    if (this.timeLeft <= 15 && this.timeLeft > 0) {
      const pulseAlpha = 0.22 + Math.sin(now * 0.012) * 0.16;
      ctx.save();
      // Edge warning border
      ctx.strokeStyle = `rgba(255, 23, 68, ${pulseAlpha * 1.5})`;
      ctx.lineWidth = 14;
      ctx.strokeRect(7, 7, 1066, 1906);

      // Radial vignette glow
      const grad = ctx.createRadialGradient(540, 960, 500, 540, 960, 1050);
      grad.addColorStop(0, 'rgba(255, 0, 60, 0)');
      grad.addColorStop(1, `rgba(255, 0, 60, ${pulseAlpha * 0.55})`);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1080, 1920);
      ctx.restore();
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

    // Gameplay Top Bar Buttons: Settings & Pause
    this.btnSettings.render(ctx, this.assets);
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

      // Flashing urgent red/gold tint when time <= 15s
      if (this.timeLeft <= 15) {
        const flashAlpha = 0.35 + Math.sin(now * 0.02) * 0.3;
        ctx.fillStyle = `rgba(255, 23, 68, ${flashAlpha})`;
        ctx.fillRect(slotX, slotY, fillW, slotH);
      }
      ctx.restore();
    }

    // Clock Icon with warning wobble & pulse when time is running low
    const clockIcon = this.assets.get('Clock_Icon');
    if (clockIcon) {
      ctx.save();
      const iconCx = slotX - 4;
      const iconCy = slotY + 13;
      ctx.translate(iconCx, iconCy);

      if (this.timeLeft <= 15) {
        const wobble = Math.sin(now * 0.035) * 0.22;
        const pulse = 1.0 + Math.sin(now * 0.03) * 0.25;
        ctx.rotate(wobble);
        ctx.scale(pulse, pulse);
      } else if (this.timeLeft <= 30) {
        const pulse = 1.0 + Math.sin(now * 0.015) * 0.12;
        ctx.scale(pulse, pulse);
      }
      ctx.drawImage(clockIcon, -28, -27, 56, 54);
      ctx.restore();
    }

    // Digital Countdown Timer Display (m:ss format, counting down continuously)
    if (this.timeLeft >= 0 && !this.tutorialActive) {
      const totalSec = Math.max(0, Math.ceil(this.timeLeft));
      const mins = Math.floor(totalSec / 60);
      const secs = totalSec % 60;
      const timeStr = `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;

      const badgePulse = this.timeLeft <= 10
        ? 1.0 + Math.sin(now * 0.025) * 0.08
        : (this.timeLeft <= 30 ? 1.0 + Math.sin(now * 0.012) * 0.04 : 1.0);

      ctx.save();
      ctx.translate(540, slotY + 13);
      ctx.scale(badgePulse, badgePulse);

      // Background pill styling based on urgency
      if (this.timeLeft <= 10) {
        ctx.fillStyle = 'rgba(255, 23, 68, 0.95)';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
      } else if (this.timeLeft <= 30) {
        ctx.fillStyle = 'rgba(230, 81, 0, 0.92)';
        ctx.strokeStyle = '#ffd54f';
        ctx.lineWidth = 3;
      } else {
        ctx.fillStyle = 'rgba(26, 9, 38, 0.88)';
        ctx.strokeStyle = '#ffd54f';
        ctx.lineWidth = 2.5;
      }

      ctx.beginPath();
      ctx.roundRect(-68, -20, 136, 40, 20);
      ctx.fill();
      ctx.stroke();

      ctx.font = '900 30px "Passion One", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.strokeStyle = '#1d0c2b';
      ctx.lineWidth = 5;
      ctx.strokeText(timeStr, 0, 1);
      ctx.fillStyle = '#ffffff';
      ctx.fillText(timeStr, 0, 1);
      ctx.restore();
    }

    // Active Combo Streak Banner when combo >= 2
    if (this.comboBanner.timer > 0 && this.comboBanner.count >= 2) {
      const cbAlpha = Math.min(1, this.comboBanner.timer / 0.4);
      ctx.save();
      ctx.globalAlpha = cbAlpha;
      ctx.translate(540, 305);
      ctx.scale(this.comboBanner.scale, this.comboBanner.scale);

      const cbWidth = 380;
      const cbHeight = 44;
      ctx.fillStyle = 'rgba(22, 10, 42, 0.88)';
      ctx.strokeStyle = '#ff9100';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(-cbWidth / 2, -cbHeight / 2, cbWidth, cbHeight, 22);
      ctx.fill();
      ctx.stroke();

      ctx.font = '900 34px "Passion One", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.strokeStyle = '#3e1500';
      ctx.lineWidth = 6;
      ctx.strokeText(this.comboBanner.text, 0, 2);
      ctx.fillStyle = '#ffea00';
      ctx.fillText(this.comboBanner.text, 0, 2);
      ctx.restore();
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

    // Render Tutorial Guide & Overlays
    if (this.tutorialActive) {
      this.renderTutorial(ctx, now);
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

    // Pulsing highlight ring on +Time button when time is low (<= 25s) and player has stock
    if (this.timeLeft <= 25 && this.powerups.time > 0 && this.state === GAME_STATE.PLAYING) {
      const btnCx = this.btnTimePowerup.x + this.btnTimePowerup.w / 2;
      const btnCy = this.btnTimePowerup.y + this.btnTimePowerup.h / 2;
      const glowScale = 1.0 + Math.sin(now * 0.015) * 0.12;

      ctx.save();
      ctx.strokeStyle = '#00ff88';
      ctx.lineWidth = 6;
      ctx.shadowColor = '#00ff88';
      ctx.shadowBlur = 18;
      ctx.beginPath();
      ctx.arc(btnCx, btnCy, (this.btnTimePowerup.w / 2 + 10) * glowScale, 0, Math.PI * 2);
      ctx.stroke();

      // "USE +TIME!" bounce tag above button
      const tagBounce = Math.sin(now * 0.014) * 6;
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#00e676';
      ctx.strokeStyle = '#003314';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(btnCx - 64, this.btnTimePowerup.y - 34 + tagBounce, 128, 30, 15);
      ctx.fill();
      ctx.stroke();

      ctx.font = '900 22px "Passion One", sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('USE +TIME! ⏰', btnCx, this.btnTimePowerup.y - 19 + tagBounce);
      ctx.restore();
    }

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

  renderTutorial(ctx, now) {
    if (!this.tutorialActive || !this.tutorialPair) return;

    const { p1, p2 } = this.tutorialPair;
    if (!this.grid[p1.r] || !this.grid[p1.r][p1.c] || !this.grid[p2.r] || !this.grid[p2.r][p2.c]) return;

    const { tileW, tileH, gapX, gapY, startX, startY } = this.gridConfig;
    const x1 = startX + p1.c * (tileW + gapX) + tileW / 2;
    const y1 = startY + p1.r * (tileH + gapY) + tileH / 2;
    const x2 = startX + p2.c * (tileW + gapX) + tileW / 2;
    const y2 = startY + p2.r * (tileH + gapY) + tileH / 2;

    const p1Selected = this.selectedTile && this.selectedTile.r === p1.r && this.selectedTile.c === p1.c;
    const p2Selected = this.selectedTile && this.selectedTile.r === p2.r && this.selectedTile.c === p2.c;

    // Glowing highlight frames on both tutorial tiles
    this.drawTutorialTileHighlight(ctx, x1, y1, tileW, tileH, now, p1Selected);
    this.drawTutorialTileHighlight(ctx, x2, y2, tileW, tileH, now, p2Selected);

    // Guide pointer hand & badge
    if (!p1Selected && !p2Selected) {
      this.renderTutorialPointer(ctx, x1, y1 - tileH * 0.45, '1. TAP THIS! 👆', now);
      this.renderTargetBadge(ctx, x2, y2 - tileH * 0.45, 'MATCH 🎯', now);
    } else if (p1Selected) {
      this.renderTutorialPointer(ctx, x2, y2 - tileH * 0.45, '2. TAP MATCH! 🎯', now);
    } else if (p2Selected) {
      this.renderTutorialPointer(ctx, x1, y1 - tileH * 0.45, '2. TAP MATCH! 🎯', now);
    }

    // Top tutorial instructions banner
    this.renderTutorialBanner(ctx, now);
  }

  drawTutorialTileHighlight(ctx, cx, cy, w, h, now, isSelected) {
    ctx.save();
    ctx.translate(cx, cy);

    const pulse = Math.sin(now * 0.008);
    const glowScale = 1.0 + pulse * 0.06;
    ctx.scale(glowScale, glowScale);

    ctx.shadowColor = isSelected ? '#00ff88' : '#ffd700';
    ctx.shadowBlur = 24 + pulse * 8;
    ctx.strokeStyle = isSelected ? '#00ff88' : '#ffd700';
    ctx.lineWidth = isSelected ? 8 : 6;
    ctx.beginPath();
    ctx.roundRect(-w / 2 - 4, -h / 2 - 4, w + 8, h + 8, 20);
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(-w / 2 - 1, -h / 2 - 1, w + 2, h + 2, 18);
    ctx.stroke();

    ctx.restore();
  }

  renderTutorialPointer(ctx, x, y, label, now) {
    ctx.save();

    // Bobbing bounce animation
    const bob = Math.sin(now * 0.008) * 14;
    const px = x;
    const py = y - 45 + bob;

    // Expanding tap ripple rings on the tile
    const rippleProgress = (now % 1200) / 1200;
    const rippleRadius = 20 + rippleProgress * 55;
    const rippleAlpha = (1 - rippleProgress) * 0.85;
    ctx.strokeStyle = `rgba(0, 240, 255, ${rippleAlpha})`;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(x, y + 45, rippleRadius, 0, Math.PI * 2);
    ctx.stroke();

    const ripple2Progress = ((now + 600) % 1200) / 1200;
    const ripple2Radius = 20 + ripple2Progress * 55;
    const ripple2Alpha = (1 - ripple2Progress) * 0.85;
    ctx.strokeStyle = `rgba(255, 235, 59, ${ripple2Alpha})`;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(x, y + 45, ripple2Radius, 0, Math.PI * 2);
    ctx.stroke();

    // Floating label pill above hand
    const labelW = 220;
    const labelH = 52;
    const labelY = py - 75;

    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 12;
    ctx.fillStyle = '#ffea00';
    ctx.strokeStyle = '#3d1600';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.roundRect(px - labelW / 2, labelY - labelH / 2, labelW, labelH, 26);
    ctx.fill();
    ctx.stroke();

    // Downward notch
    ctx.beginPath();
    ctx.moveTo(px - 14, labelY + labelH / 2);
    ctx.lineTo(px, labelY + labelH / 2 + 12);
    ctx.lineTo(px + 14, labelY + labelH / 2);
    ctx.fillStyle = '#ffea00';
    ctx.fill();
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.font = '900 30px "Passion One", sans-serif';
    ctx.fillStyle = '#2b1000';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, px, labelY + 2);

    // Hand pointer icon (pointing down towards the tile)
    ctx.save();
    ctx.translate(px, py);
    ctx.shadowColor = 'rgba(0,0,0,0.35)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 6;

    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#1e1135';
    ctx.lineWidth = 5;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    ctx.beginPath();
    ctx.moveTo(-12, 10);
    ctx.lineTo(-8, 42);
    ctx.arc(0, 42, 8, Math.PI, 0, true);
    ctx.lineTo(8, 10);
    ctx.lineTo(20, 8);
    ctx.arc(16, -4, 8, 0, Math.PI, true);
    ctx.lineTo(22, -18);
    ctx.arc(14, -22, 8, 0, Math.PI, true);
    ctx.lineTo(-4, -30);
    ctx.lineTo(-20, -18);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = '#d1c4e9';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-3, 20);
    ctx.lineTo(3, 20);
    ctx.moveTo(8, -2);
    ctx.lineTo(16, -2);
    ctx.stroke();

    ctx.restore();
    ctx.restore();
  }

  renderTargetBadge(ctx, x, y, text, now) {
    ctx.save();
    const pulse = 1.0 + Math.sin(now * 0.01) * 0.08;
    ctx.translate(x, y - 45);
    ctx.scale(pulse, pulse);

    const bw = 150;
    const bh = 46;
    ctx.fillStyle = 'rgba(255, 145, 0, 0.95)';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.roundRect(-bw / 2, -bh / 2, bw, bh, 23);
    ctx.fill();
    ctx.stroke();

    ctx.font = '900 26px "Passion One", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 0, 2);
    ctx.restore();
  }

  renderTutorialBanner(ctx, now) {
    ctx.save();

    const bx = 95;
    const by = 224;
    const bw = 700;
    const bh = 66;

    // Card background
    ctx.fillStyle = 'rgba(22, 10, 42, 0.94)';
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.roundRect(bx, by, bw, bh, 24);
    ctx.fill();
    ctx.stroke();

    // Step pill
    const stepText = `STEP ${this.tutorialStep}/2`;
    ctx.fillStyle = '#ff9100';
    ctx.strokeStyle = '#3e1500';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(bx + 16, by + 11, 145, bh - 22, 18);
    ctx.fill();
    ctx.stroke();

    ctx.font = '900 28px "Passion One", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(stepText, bx + 88, by + bh / 2 + 1);

    // Message text
    const msg = this.tutorialStep === 1
      ? 'Tap 2 identical tiles to connect & clear them!'
      : 'Great! Now connect this second pair!';
    ctx.font = '900 30px "Passion One", sans-serif';
    ctx.fillStyle = '#fffa65';
    ctx.strokeStyle = '#2d0f4d';
    ctx.lineWidth = 5;
    ctx.textAlign = 'left';
    ctx.strokeText(msg, bx + 175, by + bh / 2 + 1);
    ctx.fillText(msg, bx + 175, by + bh / 2 + 1);

    // Skip button
    this.btnSkipTutorial.x = 815;
    this.btnSkipTutorial.y = by;
    this.btnSkipTutorial.w = 170;
    this.btnSkipTutorial.h = bh;
    this.btnSkipTutorial.render(ctx, this.assets);

    ctx.font = '900 30px "Passion One", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#4a2608';
    ctx.lineWidth = 6;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.strokeText('Skip ⏭', 815 + 85, by + bh / 2 + 1);
    ctx.fillText('Skip ⏭', 815 + 85, by + bh / 2 + 1);

    ctx.restore();
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

      if (p < 0.22) {
        // Phase 1: Rapid explosive flash pop (0% - 22%)
        const t = p / 0.22;
        const scale = 1.0 + t * 0.28;
        ctx.scale(scale, scale);
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 32 * t;

        const cellImg = boxBgPressed || boxBg;
        if (cellImg) {
          ctx.drawImage(cellImg, -tileW / 2, -tileH / 2, tileW, tileH);
        }

        const monsterNum = dTile.type < 10 ? '0' + dTile.type : '' + dTile.type;
        const monsterImg = this.assets.get(`Onet${monsterNum}`);
        if (monsterImg) {
          const spriteSize = Math.min(tileW, tileH) * 0.90;
          ctx.drawImage(monsterImg, -spriteSize / 2, -spriteSize / 2, spriteSize, spriteSize);
        }

        ctx.fillStyle = `rgba(255, 255, 255, ${0.75 * t})`;
        ctx.beginPath();
        ctx.arc(0, 0, (tileW / 2) * 0.95, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Phase 2: Expanding luminous shockwaves while physics shards arc through the air
        const t = (p - 0.22) / 0.78;
        const alpha = Math.max(0, 1 - t);

        ctx.strokeStyle = `rgba(0, 240, 255, ${alpha * 0.9})`;
        ctx.lineWidth = Math.max(1, 7 * (1 - t));
        ctx.beginPath();
        ctx.arc(0, 0, (tileW * 0.35) * (1 + t * 1.5), 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = `rgba(255, 235, 59, ${alpha * 0.75})`;
        ctx.lineWidth = Math.max(1, 4 * (1 - t));
        ctx.beginPath();
        ctx.arc(0, 0, (tileW * 0.2) * (1 + t * 1.9), 0, Math.PI * 2);
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

    // Modal Title
    ctx.font = '900 76px "Passion One", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#5f1e42';
    ctx.lineWidth = 10;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.strokeText('Settings', 540, 540);
    ctx.fillText('Settings', 540, 540);

    // Close 'X' Button
    this.btnCloseSettings.x = 835;
    this.btnCloseSettings.y = 445;
    this.btnCloseSettings.w = 75;
    this.btnCloseSettings.h = 75;
    this.btnCloseSettings.render(ctx, this.assets);

    // Sound and Music Toggles in Settings Menu
    this.btnToggleMusic.x = 320;
    this.btnToggleMusic.y = 630;
    this.btnToggleMusic.w = 180;
    this.btnToggleMusic.h = 180;

    this.btnToggleSound.x = 580;
    this.btnToggleSound.y = 630;
    this.btnToggleSound.w = 180;
    this.btnToggleSound.h = 180;

    this.btnToggleMusic.render(ctx, this.assets);
    this.btnToggleSound.render(ctx, this.assets);

    // Labels & ON/OFF indicators
    ctx.font = '900 38px "Passion One", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#4a152e';
    ctx.lineWidth = 7;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Music Label & Status
    const musicCenterX = this.btnToggleMusic.x + this.btnToggleMusic.w / 2;
    ctx.strokeText('Music', musicCenterX, 835);
    ctx.fillText('Music', musicCenterX, 835);

    const musicOn = window.soundEngine.musicEnabled;
    ctx.fillStyle = musicOn ? '#00e676' : '#ff5252';
    ctx.strokeStyle = musicOn ? '#003314' : '#3a0000';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(musicCenterX - 45, 862, 90, 32, 16);
    ctx.fill();
    ctx.stroke();

    ctx.font = '900 24px "Passion One", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(musicOn ? 'ON' : 'OFF', musicCenterX, 878);

    // Sound Label & Status
    const soundCenterX = this.btnToggleSound.x + this.btnToggleSound.w / 2;
    ctx.font = '900 38px "Passion One", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#4a152e';
    ctx.lineWidth = 7;
    ctx.strokeText('Sound', soundCenterX, 835);
    ctx.fillText('Sound', soundCenterX, 835);

    const soundOn = window.soundEngine.soundEnabled;
    ctx.fillStyle = soundOn ? '#00e676' : '#ff5252';
    ctx.strokeStyle = soundOn ? '#003314' : '#3a0000';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(soundCenterX - 45, 862, 90, 32, 16);
    ctx.fill();
    ctx.stroke();

    ctx.font = '900 24px "Passion One", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(soundOn ? 'ON' : 'OFF', soundCenterX, 878);

    // Resume Button at bottom of modal
    this.btnResume.x = 450;
    this.btnResume.y = 960;
    this.btnResume.w = 180;
    this.btnResume.h = 180;
    this.btnResume.render(ctx, this.assets);
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
