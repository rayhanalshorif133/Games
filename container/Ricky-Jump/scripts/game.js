/**
 * =========================================================================
 * 🎮 RICKY JUMP - CORE GAME ENGINE (scripts/game.js)
 * =========================================================================
 * Ultra-smooth 60fps HTML5 Canvas game with authentic spritesheets.
 * Features:
 * - Pre-rendered upright sprites (platforms and spikes unpacked with correct orientation)
 * - Tap & hold continuous force oscillation (0% -> 100% -> 0% -> 100%)
 * - Release to launch Ricky with charged momentum
 * - Ceiling spikes hazard (jumping too high destroys Ricky!)
 * - Platform landing, scoring, perfect landing bonuses
 * - Smooth camera & platform downward scrolling transition
 * - Deep integration with apiscore.js & gameover.js
 */

import { soundEngine } from './audio.js';
import { GameOverController } from '../gameover.js';
import { ScoreAPI } from '../apiscore.js';

// Virtual Resolution
const VIRTUAL_WIDTH = 480;
const VIRTUAL_HEIGHT = 800;

// Game States
const STATE_START = 0;
const STATE_IDLE = 1;
const STATE_CHARGING = 2;
const STATE_JUMPING = 3;
const STATE_LANDED = 4;
const STATE_SCROLLING = 5;
const STATE_DESTROYED = 6;
const STATE_GAMEOVER = 7;

// Physics Constants
const GRAVITY = 1500;              // px/s^2
const CHARGE_CYCLE_PERIOD = 1.15;   // seconds for full oscillation (0 -> 100 -> 0)
const MIN_JUMP_VY = -620;           // weak jump (~128px height)
const MAX_JUMP_VY = -1320;          // strong jump (~580px height - strikes ceiling spikes!)

// Coordinates in spritesheet
// Sheet 0: images/shared-0-sheet0.webp
const SPRITES_SHEET0 = {
  bgDay:        { x: 1, y: 1, w: 480, h: 800 },
  bgSunset:     { x: 513, y: 1, w: 480, h: 800 },
  cloud:        { x: 1, y: 803, w: 480, h: 800 },
  playerJump:   { x: 828, y: 1025, w: 140, h: 349 },
  playerLand:   { x: 769, y: 1537, w: 212, h: 327 }
};

// Sheet 1: images/shared-0-sheet1.webp
const SPRITES_SHEET1 = {
  playerIdle:   { x: 1, y: 1, w: 123, h: 316 },
  playerCrouch: { x: 126, y: 1, w: 133, h: 277 }
};

class RickyJumpGame {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;

    this.scale = 1;

    // Assets
    this.imgSheet0 = new Image();
    this.imgSheet1 = new Image();
    this.assetsLoaded = 0;
    this.totalAssets = 2;

    // Pre-rendered upright canvases (fixes sprites packed rotated in sheets)
    this.platformGrassCanvas = null;
    this.platformRockCanvas = null;
    this.ceilingSpikesCanvas = null;
    this.floorSpikesCanvas = null;

    // Game stats
    this.score = 0;
    this.highScore = parseInt(localStorage.getItem('ricky_jump_high_score') || '0', 10);
    this.totalJumps = 0;
    this.perfectJumps = 0;
    this.startTime = Date.now();

    // State
    this.state = STATE_START;
    this.isInputActive = false;
    this.chargeTime = 0;
    this.chargeRatio = 0; // 0.0 to 1.0

    // Platforms
    this.basePlatformY = 640;
    this.targetPlatformY = 340;

    this.basePlatform = {
      x: 240,
      y: this.basePlatformY,
      w: 220,
      type: 'grass'
    };

    this.targetPlatform = {
      x: 240,
      y: this.targetPlatformY,
      w: 210,
      type: 'rock'
    };

    // Ricky Player
    this.player = {
      x: 240,
      y: this.basePlatformY - 155 / 2,
      vx: 0,
      vy: 0,
      w: 64,
      h: 155,
      scaleX: 1,
      scaleY: 1,
      frame: 'idle', // idle, crouch, jump, land
      alpha: 1
    };

    // Camera / Transition scrolling
    this.scrollProgress = 0;
    this.scrollDuration = 0.42; // seconds
    this.scrollTime = 0;
    this.scrollFromBaseY = 0;
    this.scrollFromTargetY = 0;
    this.newTargetStartY = 0;
    this.newTargetDestY = 0;

    // Hazards
    this.ceilingSpikesHeight = 52;
    this.floorSpikesY = 748;

    // Juice & Effects
    this.screenShake = 0;
    this.particles = [];
    this.floatingTexts = [];
    this.cloudOffset = 0;

    // Timing
    this.lastFrameTime = performance.now();

    this.init();
  }

  init() {
    this.setupResize();
    this.setupInputs();
    this.setupDOM();
    this.loadAssets();

    // Start rendering loop
    requestAnimationFrame((t) => this.gameLoop(t));
  }

  setupResize() {
    const resize = () => {
      if (!this.canvas) return;
      const dpr = window.devicePixelRatio || 1;
      const windowW = window.innerWidth;
      const windowH = window.innerHeight;

      // Fit virtual resolution 480x800 into screen
      const scaleX = windowW / VIRTUAL_WIDTH;
      const scaleY = windowH / VIRTUAL_HEIGHT;
      this.scale = Math.min(scaleX, scaleY);

      const renderW = Math.round(VIRTUAL_WIDTH * this.scale);
      const renderH = Math.round(VIRTUAL_HEIGHT * this.scale);

      this.canvas.width = renderW * dpr;
      this.canvas.height = renderH * dpr;
      this.canvas.style.width = `${renderW}px`;
      this.canvas.style.height = `${renderH}px`;

      if (this.ctx) {
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.ctx.scale(this.scale * dpr, this.scale * dpr);
      }
    };

    window.addEventListener('resize', resize);
    window.addEventListener('orientationchange', () => setTimeout(resize, 150));
    resize();
  }

  setupDOM() {
    // Update initial HighScore in HUD
    const hudHigh = document.getElementById('hud-highscore');
    if (hudHigh) hudHigh.textContent = this.highScore;

    // Sound toggle button
    const btnSound = document.getElementById('btn-sound');
    if (btnSound) {
      btnSound.addEventListener('click', (e) => {
        e.stopPropagation();
        const muted = soundEngine.toggleMute();
        btnSound.textContent = muted ? '🔇' : '🔊';
        btnSound.title = muted ? 'Unmute Sound' : 'Mute Sound';
      });
    }

    // Start Screen Tap
    const startOverlay = document.getElementById('start-screen');
    const startBtn = document.getElementById('btn-start-game');
    const startGame = () => {
      if (this.state === STATE_START) {
        soundEngine.ensureContext();
        if (startOverlay) startOverlay.classList.add('hidden');
        this.resetGame();
      }
    };

    if (startBtn) startBtn.addEventListener('click', startGame);
    if (startOverlay) startOverlay.addEventListener('click', startGame);
  }

  setupInputs() {
    const onPointerDown = (e) => {
      // Don't trigger game jump if clicking buttons / modals
      if (e.target && (e.target.closest('#top-hud') || e.target.closest('#gameover-modal'))) {
        return;
      }
      e.preventDefault();
      soundEngine.ensureContext();

      if (this.state === STATE_START) {
        const startOverlay = document.getElementById('start-screen');
        if (startOverlay) startOverlay.classList.add('hidden');
        this.resetGame();
        return;
      }

      if (this.state === STATE_IDLE) {
        this.startCharging();
      }
    };

    const onPointerUp = (e) => {
      if (this.state === STATE_CHARGING) {
        e.preventDefault();
        this.releaseJump();
      }
    };

    window.addEventListener('pointerdown', onPointerDown, { passive: false });
    window.addEventListener('pointerup', onPointerUp, { passive: false });
    window.addEventListener('pointercancel', onPointerUp, { passive: false });

    // Keyboard Space / Arrow Up support
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        if (!this.isInputActive && (this.state === STATE_IDLE || this.state === STATE_START)) {
          e.preventDefault();
          onPointerDown(e);
        }
      }
    });

    window.addEventListener('keyup', (e) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        if (this.state === STATE_CHARGING) {
          e.preventDefault();
          onPointerUp(e);
        }
      }
    });
  }

  loadAssets() {
    const onAssetLoad = () => {
      this.assetsLoaded++;
      if (this.assetsLoaded >= this.totalAssets) {
        this.initPreRenderedSprites();
        console.log('[Ricky Jump] All sprite sheets & upright canvases ready.');
      }
    };

    this.imgSheet0.onload = onAssetLoad;
    this.imgSheet1.onload = onAssetLoad;

    this.imgSheet0.src = 'images/shared-0-sheet0.webp';
    this.imgSheet1.src = 'images/shared-0-sheet1.webp';
  }

  /**
   * Pre-renders rotated sprites into clean, perfectly horizontal upright canvases.
   * Construct 3 packs platforms and spikes rotated by 90 degrees.
   * This guarantees 100% correct orientation with zero distortion.
   */
  initPreRenderedSprites() {
    // 1. Upright Grass Platform (orig width 498, orig height 343)
    // On sheet0 at (483, 1025), packed as width 343 and height 498
    this.platformGrassCanvas = document.createElement('canvas');
    this.platformGrassCanvas.width = 498;
    this.platformGrassCanvas.height = 343;
    const ctxG = this.platformGrassCanvas.getContext('2d');
    ctxG.translate(0, 343);
    ctxG.rotate(-Math.PI / 2);
    ctxG.drawImage(this.imgSheet0, 483, 1025, 343, 498, 0, 0, 343, 498);

    // 2. Upright Rock Platform (orig width 498, orig height 283)
    // On sheet0 at (483, 1537), packed as width 283 and height 498
    this.platformRockCanvas = document.createElement('canvas');
    this.platformRockCanvas.width = 498;
    this.platformRockCanvas.height = 283;
    const ctxR = this.platformRockCanvas.getContext('2d');
    ctxR.translate(0, 283);
    ctxR.rotate(-Math.PI / 2);
    ctxR.drawImage(this.imgSheet0, 483, 1537, 283, 498, 0, 0, 283, 498);

    // 3. Ceiling Spikes (teeth pointing DOWN into the screen, base attached to ceiling)
    // On sheet1 at (385, 1), packed as width 54 and height 480
    this.ceilingSpikesCanvas = document.createElement('canvas');
    this.ceilingSpikesCanvas.width = 480;
    this.ceilingSpikesCanvas.height = 54;
    const ctxCS = this.ceilingSpikesCanvas.getContext('2d');
    ctxCS.translate(480, 0);
    ctxCS.rotate(Math.PI / 2);
    ctxCS.drawImage(this.imgSheet1, 385, 1, 54, 480, 0, 0, 54, 480);

    // 4. Floor Spikes (teeth pointing UP into the screen, base attached to floor)
    this.floorSpikesCanvas = document.createElement('canvas');
    this.floorSpikesCanvas.width = 480;
    this.floorSpikesCanvas.height = 54;
    const ctxFS = this.floorSpikesCanvas.getContext('2d');
    ctxFS.translate(0, 54);
    ctxFS.rotate(-Math.PI / 2);
    ctxFS.drawImage(this.imgSheet1, 385, 1, 54, 480, 0, 0, 54, 480);
  }

  resetGame() {
    this.score = 0;
    this.totalJumps = 0;
    this.perfectJumps = 0;
    this.startTime = Date.now();
    this.particles = [];
    this.floatingTexts = [];
    this.screenShake = 0;
    this.isInputActive = false;
    this.chargeTime = 0;
    this.chargeRatio = 0;

    this.updateScoreHUD();

    // Platforms
    this.basePlatform.x = 240;
    this.basePlatform.y = this.basePlatformY;
    this.basePlatform.w = 220;
    this.basePlatform.type = 'grass';

    this.targetPlatform.x = 240;
    this.targetPlatform.y = this.targetPlatformY;
    this.targetPlatform.w = 210;
    this.targetPlatform.type = 'rock';

    // Player standing with feet on base platform top surface
    this.player.x = this.basePlatform.x;
    this.player.y = this.basePlatform.y - this.player.h / 2;
    this.player.vx = 0;
    this.player.vy = 0;
    this.player.scaleX = 1;
    this.player.scaleY = 1;
    this.player.alpha = 1;
    this.player.frame = 'idle';

    // Hide game over modal if open
    const modal = document.getElementById('gameover-modal');
    if (modal) modal.classList.add('hidden');

    this.state = STATE_IDLE;
  }

  startCharging() {
    this.state = STATE_CHARGING;
    this.isInputActive = true;
    this.chargeTime = 0;
    this.chargeRatio = 0;
    this.player.frame = 'crouch';
    soundEngine.playCharge(0);
  }

  releaseJump() {
    this.isInputActive = false;
    soundEngine.stopCharge();

    // Calculate jump velocity from charge ratio
    // chargeRatio 0.0 -> MIN_JUMP_VY
    // chargeRatio ~0.58 -> Lands safely on target platform
    // chargeRatio >0.78 -> Striking ceiling spikes!
    const vy = MIN_JUMP_VY + this.chargeRatio * (MAX_JUMP_VY - MIN_JUMP_VY);

    this.player.vy = vy;
    this.player.vx = 0;
    this.player.frame = 'jump';
    this.player.scaleX = 0.85;
    this.player.scaleY = 1.18; // Stretch on leap
    this.state = STATE_JUMPING;

    soundEngine.playJump();

    // Jump dust particles at platform
    this.spawnDustParticles(this.player.x, this.basePlatform.y, 12, '#ffffff');
  }

  updateScoreHUD() {
    const hudScore = document.getElementById('hud-score');
    if (hudScore) hudScore.textContent = this.score;

    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem('ricky_jump_high_score', this.highScore);
      const hudHigh = document.getElementById('hud-highscore');
      if (hudHigh) hudHigh.textContent = this.highScore;
    }
  }

  triggerCeilingSmash() {
    this.state = STATE_DESTROYED;
    soundEngine.playSpikeHit();
    this.screenShake = 16;

    // Spawn rich shatter particles
    this.spawnShatterParticles(this.player.x, this.ceilingSpikesHeight + 10);

    // Hide player
    this.player.alpha = 0;

    // Add floating text
    this.addFloatingText('💥 SMASHED!', this.player.x, 90, '#ff3b30', 28);

    setTimeout(() => {
      this.onGameOver('বেশি জাম্প দেওয়ায় সিলিং স্পাইকে ধ্বংস হয়ে গেছে! 💥');
    }, 900);
  }

  triggerPitFall() {
    this.state = STATE_DESTROYED;
    soundEngine.playFall();
    this.screenShake = 8;

    this.addFloatingText('💀 FELL INTO PIT!', this.player.x, 710, '#ff9500', 24);

    setTimeout(() => {
      soundEngine.playGameOver();
      this.onGameOver('কম জাম্প করায় অতল গহ্বরে পড়ে গেছে! 💀');
    }, 700);
  }

  triggerLanding(isPerfect) {
    this.state = STATE_LANDED;
    this.player.vy = 0;
    this.player.y = this.targetPlatform.y - this.player.h / 2;
    this.player.frame = 'land';
    this.player.scaleX = 1.35; // Squash on impact
    this.player.scaleY = 0.72;

    this.totalJumps++;
    soundEngine.playLand();

    // Spawn landing dust
    this.spawnDustParticles(this.player.x, this.targetPlatform.y, 14, '#d8e5ff');

    if (isPerfect) {
      this.score += 2;
      this.perfectJumps++;
      soundEngine.playPerfect();
      this.addFloatingText('PERFECT! +2', this.player.x, this.player.y - 60, '#ffdf00', 26);
    } else {
      this.score += 1;
      this.addFloatingText('+1', this.player.x, this.player.y - 60, '#00e5ff', 24);
    }

    this.updateScoreHUD();

    // Start smooth scrolling transition down to next step
    setTimeout(() => {
      this.startTransition();
    }, 180);
  }

  startTransition() {
    this.state = STATE_SCROLLING;
    this.scrollProgress = 0;
    this.scrollTime = 0;

    this.scrollFromBaseY = this.basePlatform.y;
    this.scrollFromTargetY = this.targetPlatform.y;

    // Old target platform moves down to basePlatformY
    // A fresh target platform slides in from above
    this.newTargetStartY = -120;
    this.newTargetDestY = this.targetPlatformY + (Math.random() * 30 - 15);

    this.player.frame = 'idle';
  }

  onGameOver(reason) {
    this.state = STATE_GAMEOVER;

    const timePlayed = Math.floor((Date.now() - this.startTime) / 1000);

    const stats = {
      score: this.score,
      highScore: this.highScore,
      jumps: this.totalJumps,
      perfectJumps: this.perfectJumps,
      reason: reason,
      timeElapsed: timePlayed
    };

    GameOverController.handleGameOver(stats);
  }

  restartGame() {
    this.resetGame();
  }

  // --- Particle Systems ---
  spawnDustParticles(x, y, count, color) {
    for (let i = 0; i < count; i++) {
      const angle = Math.PI + (Math.random() - 0.5) * 1.8;
      const speed = 60 + Math.random() * 120;
      this.particles.push({
        x: x + (Math.random() - 0.5) * 50,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed * 0.4 - 20,
        size: 5 + Math.random() * 6,
        alpha: 0.9,
        decay: 1.8 + Math.random() * 1.2,
        color: color
      });
    }
  }

  spawnChargeSparks(x, y) {
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.5;
    const speed = 40 + Math.random() * 100;
    const colors = ['#00e5ff', '#ffea00', '#ff3d00'];
    const col = colors[Math.floor(this.chargeRatio * 2.99)];
    this.particles.push({
      x: x + (Math.random() - 0.5) * 40,
      y: y + (Math.random() - 0.5) * 15,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: 3 + Math.random() * 4,
      alpha: 1,
      decay: 2.2,
      color: col
    });
  }

  spawnShatterParticles(x, y) {
    const colors = ['#ffffff', '#ff3b30', '#ff9500', '#ffd60a', '#48484a'];
    for (let i = 0; i < 40; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 120 + Math.random() * 300;
      this.particles.push({
        x: x + (Math.random() - 0.5) * 30,
        y: y + (Math.random() - 0.5) * 30,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed + 100,
        size: 4 + Math.random() * 9,
        alpha: 1,
        decay: 1.1 + Math.random() * 0.8,
        color: colors[Math.floor(Math.random() * colors.length)],
        gravity: 800
      });
    }
  }

  addFloatingText(text, x, y, color, size = 24) {
    this.floatingTexts.push({
      text: text,
      x: x,
      y: y,
      vy: -60,
      alpha: 1,
      decay: 0.9,
      color: color,
      size: size
    });
  }

  // --- Main Update & Render Loop ---
  gameLoop(currentTime) {
    const dt = Math.min((currentTime - this.lastFrameTime) / 1000, 0.05);
    this.lastFrameTime = currentTime;

    this.update(dt);
    this.render();

    requestAnimationFrame((t) => this.gameLoop(t));
  }

  update(dt) {
    // Parallax cloud drifting
    this.cloudOffset = (this.cloudOffset + dt * 8) % VIRTUAL_WIDTH;

    // Screen shake decay
    if (this.screenShake > 0) {
      this.screenShake = Math.max(0, this.screenShake - dt * 32);
    }

    // Update Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.gravity) p.vy += p.gravity * dt;
      p.alpha -= p.decay * dt;
      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // Update Floating Texts
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y += ft.vy * dt;
      ft.alpha -= ft.decay * dt;
      if (ft.alpha <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }

    // CHARGING LOGIC (Force Up & Down Continuous Oscillation)
    if (this.state === STATE_CHARGING) {
      this.chargeTime += dt;
      // Triangle wave: 0 -> 1 -> 0 -> 1
      const cycle = (this.chargeTime % CHARGE_CYCLE_PERIOD) / CHARGE_CYCLE_PERIOD;
      if (cycle <= 0.5) {
        this.chargeRatio = cycle * 2; // 0 to 1
      } else {
        this.chargeRatio = (1 - cycle) * 2; // 1 to 0
      }

      // Modulate audio hum
      soundEngine.playCharge(this.chargeRatio);

      // Character squashes in anticipation (anchored at feet)
      this.player.scaleX = 1 + this.chargeRatio * 0.22;
      this.player.scaleY = 1 - this.chargeRatio * 0.28;

      // Spawn charging energy motes
      if (Math.random() < 0.4) {
        this.spawnChargeSparks(this.player.x, this.basePlatform.y);
      }
    }

    // JUMPING / AIRBORNE LOGIC
    if (this.state === STATE_JUMPING) {
      this.player.vy += GRAVITY * dt;
      this.player.y += this.player.vy * dt;

      // Gradually ease squash back to normal
      this.player.scaleX += (1 - this.player.scaleX) * dt * 8;
      this.player.scaleY += (1 - this.player.scaleY) * dt * 8;

      const playerTop = this.player.y - this.player.h / 2;
      const playerBottom = this.player.y + this.player.h / 2;

      // 1. CEILING SPIKES HAZARD (Jumping too high destroys player!)
      if (playerTop <= this.ceilingSpikesHeight) {
        this.triggerCeilingSmash();
        return;
      }

      // 2. LANDING ON TARGET PLATFORM
      // Must be falling downwards (vy > 0)
      if (this.player.vy > 0) {
        const platTop = this.targetPlatform.y;
        const platLeft = this.targetPlatform.x - this.targetPlatform.w / 2;
        const platRight = this.targetPlatform.x + this.targetPlatform.w / 2;

        // Check if player feet pass through the platform surface
        if (playerBottom >= platTop - 15 && playerBottom <= platTop + 45) {
          // Check horizontal bounds
          if (this.player.x >= platLeft - 15 && this.player.x <= platRight + 15) {
            const centerDist = Math.abs(this.player.x - this.targetPlatform.x);
            const isPerfect = centerDist <= 24;
            this.triggerLanding(isPerfect);
            return;
          }
        }
      }

      // 3. FALLING INTO BOTTOM ABYSS / PIT
      if (playerBottom >= this.floorSpikesY) {
        this.triggerPitFall();
        return;
      }
    }

    // SMOOTH CAMERA / PLATFORM SCROLLING TRANSITION
    if (this.state === STATE_SCROLLING) {
      this.scrollTime += dt;
      const t = Math.min(this.scrollTime / this.scrollDuration, 1);
      // Smooth cubic ease out
      const ease = 1 - Math.pow(1 - t, 3);

      // Distance target platform needs to travel to reach basePlatformY
      const deltaY = this.basePlatformY - this.scrollFromTargetY;

      // Base platform scrolls offscreen downward
      this.basePlatform.y = this.scrollFromBaseY + deltaY * ease;

      // Target platform moves down into base position
      this.targetPlatform.y = this.scrollFromTargetY + deltaY * ease;

      // Player stays glued on the platform as it descends
      this.player.y = this.targetPlatform.y - this.player.h / 2;

      if (t >= 1) {
        // Transition finished!
        // The old target platform is now the base platform
        this.basePlatform.x = this.targetPlatform.x;
        this.basePlatform.y = this.basePlatformY;
        this.basePlatform.w = this.targetPlatform.w;
        this.basePlatform.type = this.targetPlatform.type;

        // Spawn brand new target platform above
        this.targetPlatform.y = this.newTargetDestY;
        this.targetPlatform.x = 240 + (Math.random() * 50 - 25);
        this.targetPlatform.w = Math.max(170, 215 - Math.min(this.score * 2, 45));
        this.targetPlatform.type = this.basePlatform.type === 'grass' ? 'rock' : 'grass';

        this.player.x = this.basePlatform.x;
        this.player.y = this.basePlatform.y - this.player.h / 2;
        this.player.frame = 'idle';

        this.state = STATE_IDLE;
      }
    }
  }

  // --- Rendering ---
  render() {
    if (!this.ctx) return;
    const ctx = this.ctx;

    ctx.save();

    // Apply Screen Shake
    if (this.screenShake > 0) {
      const shakeX = (Math.random() - 0.5) * this.screenShake;
      const shakeY = (Math.random() - 0.5) * this.screenShake;
      ctx.translate(shakeX, shakeY);
    }

    // Clear background
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, VIRTUAL_WIDTH, VIRTUAL_HEIGHT);

    // 1. Draw Background Sky & Clouds
    this.drawBackground(ctx);

    // 2. Draw Hazards (Ceiling & Floor Spikes - perfectly horizontal)
    this.drawHazards(ctx);

    // 3. Draw Platforms (perfectly horizontal with lush grass on top)
    this.drawPlatforms(ctx);

    // 4. Draw Particles
    this.drawParticles(ctx);

    // 5. Draw Player (Ricky - upright, feet anchored on platform)
    this.drawPlayer(ctx);

    // 6. Draw Upright Futuristic Neon Force Meter
    this.drawForceMeter(ctx);

    // 7. Draw Floating Texts
    this.drawFloatingTexts(ctx);

    ctx.restore();
  }

  drawBackground(ctx) {
    if (this.assetsLoaded >= 2 && this.imgSheet0.complete) {
      // Sky texture (upright 480x800)
      const bg = SPRITES_SHEET0.bgDay;
      ctx.drawImage(this.imgSheet0, bg.x, bg.y, bg.w, bg.h, 0, 0, VIRTUAL_WIDTH, VIRTUAL_HEIGHT);

      // Parallax drifting clouds
      const cloud = SPRITES_SHEET0.cloud;
      ctx.globalAlpha = 0.55;
      ctx.drawImage(this.imgSheet0, cloud.x, cloud.y, cloud.w, cloud.h, -this.cloudOffset, 0, VIRTUAL_WIDTH, VIRTUAL_HEIGHT);
      ctx.drawImage(this.imgSheet0, cloud.x, cloud.y, cloud.w, cloud.h, VIRTUAL_WIDTH - this.cloudOffset, 0, VIRTUAL_WIDTH, VIRTUAL_HEIGHT);
      ctx.globalAlpha = 1.0;
    } else {
      const grad = ctx.createLinearGradient(0, 0, 0, VIRTUAL_HEIGHT);
      grad.addColorStop(0, '#2563eb');
      grad.addColorStop(0.6, '#60a5fa');
      grad.addColorStop(1, '#93c5fd');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, VIRTUAL_WIDTH, VIRTUAL_HEIGHT);
    }
  }

  drawHazards(ctx) {
    // Ceiling Spikes (pointing down from ceiling)
    if (this.ceilingSpikesCanvas) {
      ctx.drawImage(this.ceilingSpikesCanvas, 0, 0, VIRTUAL_WIDTH, this.ceilingSpikesHeight);
    }

    // Floor Spikes (pointing up from floor)
    if (this.floorSpikesCanvas) {
      ctx.drawImage(this.floorSpikesCanvas, 0, this.floorSpikesY, VIRTUAL_WIDTH, VIRTUAL_HEIGHT - this.floorSpikesY);
    }

    // Glowing danger line below ceiling spikes
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.45)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, this.ceilingSpikesHeight);
    ctx.lineTo(VIRTUAL_WIDTH, this.ceilingSpikesHeight);
    ctx.stroke();
  }

  drawPlatforms(ctx) {
    const drawPlat = (plat) => {
      // Skip if offscreen
      if (plat.y < -200 || plat.y > VIRTUAL_HEIGHT + 200) return;

      const canvas = plat.type === 'grass' ? this.platformGrassCanvas : this.platformRockCanvas;
      if (canvas) {
        const platH = plat.type === 'grass' ? plat.w * (343 / 498) : plat.w * (283 / 498);
        const drawX = plat.x - plat.w / 2;
        // The green grass surface is near top ~12% of the upright platform sprite
        const drawY = plat.y - platH * 0.12;
        ctx.drawImage(canvas, 0, 0, canvas.width, canvas.height, drawX, drawY, plat.w, platH);
      } else {
        ctx.fillStyle = plat.type === 'grass' ? '#22c55e' : '#64748b';
        ctx.fillRect(plat.x - plat.w / 2, plat.y, plat.w, 35);
      }
    };

    drawPlat(this.basePlatform);
    drawPlat(this.targetPlatform);
  }

  drawPlayer(ctx) {
    if (this.player.alpha <= 0) return;

    ctx.save();
    ctx.globalAlpha = this.player.alpha;

    // Translate to feet position so squash & stretch anchors firmly to platform
    const feetY = this.player.y + this.player.h / 2;
    ctx.translate(this.player.x, feetY);
    ctx.scale(this.player.scaleX, this.player.scaleY);

    if (this.assetsLoaded >= 2 && this.imgSheet0.complete && this.imgSheet1.complete) {
      let sheet = this.imgSheet1;
      let s = SPRITES_SHEET1.playerIdle;

      switch (this.player.frame) {
        case 'crouch':
          sheet = this.imgSheet1;
          s = SPRITES_SHEET1.playerCrouch;
          break;
        case 'jump':
          sheet = this.imgSheet0;
          s = SPRITES_SHEET0.playerJump;
          break;
        case 'land':
          sheet = this.imgSheet0;
          s = SPRITES_SHEET0.playerLand;
          break;
        default:
          sheet = this.imgSheet1;
          s = SPRITES_SHEET1.playerIdle;
          break;
      }

      // Draw with bottom feet anchored at (0, 0)
      ctx.drawImage(sheet, s.x, s.y, s.w, s.h, -this.player.w / 2, -this.player.h, this.player.w, this.player.h);
    } else {
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(-this.player.w / 2, -this.player.h, this.player.w, this.player.h);
    }

    ctx.restore();
  }

  drawForceMeter(ctx) {
    // Show meter when idle or charging
    const isVisible = this.state === STATE_CHARGING || this.state === STATE_IDLE;
    if (!isVisible) return;

    const meterX = 32;
    const meterY = 380;
    const meterW = 28;
    const meterH = 220;

    ctx.save();

    // Background Container
    ctx.fillStyle = 'rgba(15, 23, 42, 0.82)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(meterX, meterY, meterW, meterH, 14);
    ctx.fill();
    ctx.stroke();

    // Fill ratio
    const ratio = this.state === STATE_CHARGING ? this.chargeRatio : 0;
    const fillH = Math.max(0, meterH * ratio);

    if (fillH > 0) {
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(meterX, meterY + (meterH - fillH), meterW, fillH, 14);
      ctx.clip();

      // Glowing gradient:
      // Bottom = Cyan (safe), Middle = Gold (ideal jump), Top = Crimson Red (danger spikes!)
      const grad = ctx.createLinearGradient(0, meterY + meterH, 0, meterY);
      grad.addColorStop(0, '#00e5ff');
      grad.addColorStop(0.52, '#ffea00');
      grad.addColorStop(0.72, '#ff9100');
      grad.addColorStop(1, '#ff1744');

      ctx.fillStyle = grad;
      ctx.fillRect(meterX, meterY, meterW, meterH);
      ctx.restore();
    }

    // Target Zone Bracket (Safe landing range ~52% to 68%)
    const sweetBottomY = meterY + meterH * (1 - 0.52);
    const sweetTopY = meterY + meterH * (1 - 0.68);
    const sweetH = sweetBottomY - sweetTopY;

    ctx.strokeStyle = '#ffea00';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(meterX - 3, sweetTopY, meterW + 6, sweetH);

    // Danger Zone Line at top (overcharge warning)
    const dangerY = meterY + meterH * (1 - 0.78);
    ctx.strokeStyle = 'rgba(255, 23, 68, 0.8)';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(meterX - 6, dangerY);
    ctx.lineTo(meterX + meterW + 6, dangerY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Text labels
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#ff3b30';
    ctx.fillText('DANGER ⚠️', meterX + meterW + 10, meterY + 16);

    ctx.fillStyle = '#ffea00';
    ctx.fillText('TARGET 🎯', meterX + meterW + 10, sweetTopY + sweetH / 2 + 4);

    // Live Percentage
    const pct = Math.round(ratio * 100);
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`${pct}%`, meterX + meterW / 2, meterY + meterH + 20);

    // Title
    ctx.font = 'bold 12px sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('POWER', meterX + meterW / 2, meterY - 12);

    ctx.restore();
  }

  drawParticles(ctx) {
    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  drawFloatingTexts(ctx) {
    for (const ft of this.floatingTexts) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, ft.alpha);
      ctx.font = `900 ${ft.size}px "Arial Black", Impact, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillStyle = ft.color;
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 4;
      ctx.strokeText(ft.text, ft.x, ft.y);
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    }
  }
}

// Instantiate game on load
window.addEventListener('DOMContentLoaded', () => {
  window.gameInstance = new RickyJumpGame();
});
