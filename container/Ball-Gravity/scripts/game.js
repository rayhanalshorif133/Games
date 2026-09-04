/**
 * =========================================================================
 * 🏹 BALL-GRAVITY - CORE GAME ENGINE WITH DYNAMIC DIFFICULTY & OBSTACLES
 * =========================================================================
 * Features:
 * - Precision physics (gravity, bouncing, squash-and-stretch, momentum)
 * - Dynamic Difficulty Timeline:
 *     0:00 - 1:00 (Warmup / Casual): standard climbing mechanics
 *     1:00 - 3:00 (Hard Mode): Spiky aerial mines, armored metal plates on pole
 *     3:00+       (Insane Mode): Fast flying cross-hazards, decaying arrow platforms
 * - Interactive Obstacles:
 *     1. Spiky Aerial Mines: Float in the ball's climb lane; lethal to ball; shootable by arrow
 *     2. Armored Iron Plates: Steel sections on the wood pole where arrows ricochet off
 *     3. Cross-Flying Hazards (Cyber Drones / Bats): Fast horizontal threats with telegraphed warnings
 *     4. Decaying Arrow Platforms: Break after multiple bounces in high difficulty
 * - Wooden height-measuring column with dynamic scaling ruler marks
 * - Parallax atmospheric backgrounds (Meadow -> Clouds -> Sunset -> Cosmos)
 * - Comprehensive particle systems, screen shakes, procedural audio synthesizer
 * - Seamless integration with ScoreAPI and GameOverController
 */

import { soundEngine } from './audio.js';
import { ScoreAPI } from '../sendscoreapi.js';
import { GameOverController } from '../gameover.js';

class BallGravityGame {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.ctx = this.canvas.getContext('2d');

    // Virtual resolution (portrait 720 x 1280)
    this.width = 720;
    this.height = 1280;
    this.canvas.width = this.width;
    this.canvas.height = this.height;

    // Game state: 'start', 'playing', 'gameover', 'paused'
    this.state = 'start';
    this.startTime = 0;
    this.elapsedTime = 0;

    // Difficulty Progression
    // Tier 0: Normal (0 - 60s)
    // Tier 1: Hard   (60 - 180s)
    // Tier 2: Insane (180s+)
    this.difficultyTier = 0;
    this.difficultyNames = ['NORMAL', 'HARD', 'INSANE'];

    // Camera view offset (scrolls upward as ball climbs)
    this.cameraY = 0;
    this.targetCameraY = 0;

    // Heights and Scores
    this.score = 0;
    this.highScore = this.loadHighScore();
    this.maxAltitude = 0; // In meters
    this.arrowsShot = 0;
    this.successfulBounces = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.lives = 1;

    // Wooden post geometry (left side)
    this.woodPole = {
      x: 0,
      width: 100,
      color1: '#5c3a21',
      color2: '#8b5a2b',
      barkColor: '#3d2314'
    };

    // Ground platform at start
    this.groundY = 1120;

    // The Ball
    this.ball = {
      x: 230,
      y: 1060,
      radius: 24,
      vx: 0,
      vy: -750,
      baseRestitution: 0.96,
      gravity: 1050,
      squashX: 1,
      squashY: 1,
      rotation: 0,
      color: '#ff416c',
      glowColor: '#ff4b2b',
      isPopped: false,
      popAnim: 0
    };

    // Arrows
    this.arrows = [];
    this.arrowSpeed = 1550; // px/sec
    this.arrowLength = 220;
    this.arrowHeight = 12;
    this.canShoot = true;
    this.shootCooldown = 0.28; // seconds
    this.shootTimer = 0;

    // Aiming
    this.aimY = 900;
    this.isAiming = false;
    this.launcherX = this.width - 20;

    // --- Dynamic Obstacles ---
    this.spikyMines = [];
    this.mineSpawnTimer = 0;

    this.flyingHazards = [];
    this.hazardSpawnTimer = 0;

    // Particles and floating texts
    this.particles = [];
    this.floatingTexts = [];
    this.backgroundStars = this.generateStars(70);
    this.clouds = this.generateClouds(12);

    // Milestones notification
    this.milestoneBanner = { text: '', alpha: 0, timer: 0 };
    this.lastMilestonePassed = 0;

    // Screen shake
    this.shakeDuration = 0;
    this.shakeIntensity = 0;

    // Input handlers
    this.bindEvents();

    // High score HUD update
    this.updateHUD();

    // Start loop
    this.lastTime = performance.now();
    requestAnimationFrame((t) => this.gameLoop(t));
  }

  loadHighScore() {
    try {
      return parseInt(localStorage.getItem('ball_gravity_high_score'), 10) || 0;
    } catch (e) {
      return 0;
    }
  }

  saveHighScore(val) {
    if (val > this.highScore) {
      this.highScore = val;
      try {
        localStorage.setItem('ball_gravity_high_score', val.toString());
      } catch (e) {}
      return true;
    }
    return false;
  }

  generateStars(count) {
    const stars = [];
    for (let i = 0; i < count; i++) {
      stars.push({
        x: Math.random() * this.width,
        worldY: -(Math.random() * 25000),
        size: Math.random() * 2.5 + 0.8,
        twinkleSpeed: Math.random() * 3 + 1,
        alpha: Math.random() * 0.7 + 0.3
      });
    }
    return stars;
  }

  generateClouds(count) {
    const clouds = [];
    for (let i = 0; i < count; i++) {
      clouds.push({
        x: Math.random() * (this.width - 150) + 120,
        worldY: 600 - i * 650,
        width: Math.random() * 140 + 100,
        height: Math.random() * 35 + 25,
        speed: (Math.random() - 0.5) * 18,
        opacity: Math.random() * 0.4 + 0.25
      });
    }
    return clouds;
  }

  bindEvents() {
    const getPos = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.width / rect.width;
      const scaleY = this.height / rect.height;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY
      };
    };

    const handlePointerMove = (e) => {
      const pos = getPos(e);
      this.aimY = pos.y + this.cameraY;
      this.isAiming = true;
    };

    const handleShootAction = (e) => {
      e.preventDefault();
      const pos = getPos(e);
      this.aimY = pos.y + this.cameraY;

      if (this.state === 'start') {
        this.startGame();
        return;
      }
      if (this.state === 'playing') {
        this.shootArrow();
      }
    };

    this.canvas.addEventListener('mousemove', handlePointerMove);
    this.canvas.addEventListener('mousedown', handleShootAction);

    this.canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      handlePointerMove(e);
    }, { passive: false });

    this.canvas.addEventListener('touchstart', (e) => {
      handleShootAction(e);
    }, { passive: false });

    // Keyboard Space / Enter / P keys support
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        if (this.state === 'start') this.startGame();
        else if (this.state === 'playing') this.shootArrow();
      }
      if (e.code === 'KeyP') {
        this.togglePause();
      }
    });

    // UI Buttons
    const btnRestart = document.getElementById('btn-restart');
    if (btnRestart) {
      btnRestart.onclick = () => this.restartGame();
    }

    const btnSound = document.getElementById('btn-sound');
    if (btnSound) {
      btnSound.onclick = (e) => {
        e.stopPropagation();
        const isMuted = soundEngine.toggleMute();
        btnSound.textContent = isMuted ? '🔇' : '🔊';
        btnSound.classList.toggle('muted', isMuted);
      };
    }

    const btnPause = document.getElementById('btn-pause');
    if (btnPause) {
      btnPause.onclick = (e) => {
        e.stopPropagation();
        this.togglePause();
      };
    }

    const btnStart = document.getElementById('btn-start-game');
    if (btnStart) {
      btnStart.onclick = (e) => {
        e.stopPropagation();
        this.startGame();
      };
    }

    const startScreen = document.getElementById('start-screen');
    if (startScreen) {
      startScreen.onclick = () => this.startGame();
    }
  }

  startGame() {
    this.state = 'playing';
    this.startTime = performance.now();
    soundEngine.init();

    const startScreen = document.getElementById('start-screen');
    if (startScreen) startScreen.classList.add('hidden');

    const hud = document.getElementById('top-hud');
    if (hud) hud.classList.remove('hidden');

    this.addFloatingText('TAP TO SHOOT ARROWS!', this.width / 2, this.height * 0.45, '#ffd700', 30);
  }

  togglePause() {
    if (this.state === 'playing') {
      this.state = 'paused';
      const pauseModal = document.getElementById('pause-modal');
      if (pauseModal) pauseModal.classList.remove('hidden');
    } else if (this.state === 'paused') {
      this.state = 'playing';
      const pauseModal = document.getElementById('pause-modal');
      if (pauseModal) pauseModal.classList.add('hidden');
    }
  }

  shootArrow() {
    if (!this.canShoot || this.state !== 'playing') return;

    // Do not shoot below ground
    if (this.aimY > this.groundY - 10) return;

    this.canShoot = false;
    this.shootTimer = this.shootCooldown;
    this.arrowsShot++;

    const newArrow = {
      id: Date.now() + Math.random(),
      x: this.launcherX,
      y: this.aimY,
      vx: 0,
      vy: 0,
      targetX: this.woodPole.width + 10,
      speed: this.arrowSpeed,
      state: 'flying', // 'flying', 'stuck', 'ricochet', 'fading'
      wobble: 0,
      wobbleSpeed: 45,
      wobbleDecay: 7,
      flexOffset: 0,
      bouncesCount: 0,
      maxBouncesAllowed: this.difficultyTier >= 2 ? 2 : (this.difficultyTier === 1 ? 3 : 999),
      opacity: 1,
      penetration: 24,
      trailParticlesTimer: 0,
      rotation: 0,
      rotSpeed: 0
    };

    this.arrows.push(newArrow);
    soundEngine.playShoot();

    // Muzzle flash / smoke at launcher
    this.spawnSparks(this.launcherX, this.aimY, '#ffffff', 8, -1);
  }

  // --- Dynamic Difficulty Checks ---

  checkDifficultyProgression() {
    const prevTier = this.difficultyTier;

    if (this.elapsedTime >= 180) {
      this.difficultyTier = 2; // Insane / Chaos mode
    } else if (this.elapsedTime >= 60) {
      this.difficultyTier = 1; // Hard mode
    } else {
      this.difficultyTier = 0; // Normal warmup
    }

    if (this.difficultyTier > prevTier) {
      this.onDifficultyElevated(this.difficultyTier);
    }
  }

  onDifficultyElevated(newTier) {
    soundEngine.playWarningAlert();
    this.triggerShake(12, 0.4);

    if (newTier === 1) {
      this.milestoneBanner.text = '⚠️ WARNING: HARD MODE (SPIKY MINES & ARMOR)!';
      this.milestoneBanner.timer = 3.5;
      this.milestoneBanner.alpha = 1;
      this.addFloatingText('HARD MODE: MINES DEPLOYED!', this.width / 2, this.cameraY + 300, '#ff9f43', 28);
    } else if (newTier === 2) {
      this.milestoneBanner.text = '🔥 DANGER: INSANE CHAOS MODE ACTIVATED!';
      this.milestoneBanner.timer = 4.0;
      this.milestoneBanner.alpha = 1;
      this.addFloatingText('INSANE MODE: DRONES & CRACKING WOOD!', this.width / 2, this.cameraY + 300, '#ff3860', 30);
    }

    this.updateHUD();
  }

  // --- Physics & Updates ---

  update(dt) {
    if (this.state !== 'playing') return;

    this.elapsedTime = (performance.now() - this.startTime) / 1000;

    // Check 1-3 min difficulty curve
    this.checkDifficultyProgression();

    // Cooldown management
    if (!this.canShoot) {
      this.shootTimer -= dt;
      if (this.shootTimer <= 0) {
        this.canShoot = true;
      }
    }

    // Update screen shake
    if (this.shakeDuration > 0) {
      this.shakeDuration -= dt;
      if (this.shakeDuration <= 0) this.shakeIntensity = 0;
    }

    // Update Milestone Banner
    if (this.milestoneBanner.timer > 0) {
      this.milestoneBanner.timer -= dt;
      this.milestoneBanner.alpha = Math.min(1, this.milestoneBanner.timer * 2);
    }

    // 1. Update Ball Physics
    this.updateBall(dt);

    // 2. Update Arrows
    this.updateArrows(dt);

    // 3. Update Dynamic Obstacles
    this.updateObstacles(dt);

    // 4. Update Camera
    this.updateCamera(dt);

    // 5. Update Particles & Floating texts
    this.updateParticles(dt);
    this.updateFloatingTexts(dt);

    // 6. Update Clouds
    this.clouds.forEach(c => {
      c.x += c.speed * dt;
      if (c.x > this.width + 50) c.x = -c.width;
      if (c.x < -c.width - 50) c.x = this.width;
    });

    // Check Altitude & Milestones
    this.checkAltitudeProgress();

    // Update HUD Timer and Stats
    this.updateHUD();
  }

  updateBall(dt) {
    const b = this.ball;

    // Gravity (slight scaling in insane mode)
    const activeGravity = b.gravity * (this.difficultyTier === 2 ? 1.08 : 1.0);
    b.vy += activeGravity * dt;

    // Terminal velocity cap
    if (b.vy > 1400) b.vy = 1400;

    // Apply movement
    b.y += b.vy * dt;

    // Ball horizontal gentle oscillation
    const targetCenterX = 240;
    const centerPull = (targetCenterX - b.x) * 1.5;
    b.vx += centerPull * dt;
    b.vx *= 0.98;
    b.x += b.vx * dt;

    // Rotation based on velocity
    b.rotation += (b.vx * 0.05 + b.vy * 0.005) * dt;

    // Squash and stretch decay
    b.squashX += (1 - b.squashX) * (14 * dt);
    b.squashY += (1 - b.squashY) * (14 * dt);

    // Trailing particles when ascending
    if (b.vy < -200) {
      this.particles.push({
        x: b.x + (Math.random() - 0.5) * 10,
        y: b.y + b.radius * 0.8,
        vx: (Math.random() - 0.5) * 40,
        vy: Math.random() * 60 + 40,
        color: b.color,
        radius: Math.random() * 5 + 3,
        alpha: 0.7,
        decay: 3.5,
        type: 'smoke'
      });
    }

    // Collision A: Ground Bounce
    if (b.y + b.radius >= this.groundY) {
      if (this.cameraY < -300) {
        this.triggerGameOver('Ball fell into the abyss!');
        soundEngine.playFallDeath();
        return;
      }

      b.y = this.groundY - b.radius;
      b.vy = -Math.abs(b.vy) * b.baseRestitution;

      if (Math.abs(b.vy) < 680) b.vy = -720;

      b.squashX = 1.35;
      b.squashY = 0.65;
      this.combo = 0;

      soundEngine.playGroundBounce();
      this.spawnSparks(b.x, this.groundY, '#85e085', 10, 0, -1);
      this.triggerShake(4, 0.15);
    }

    // Collision B: Stuck Arrow Platforms (With Decaying Platforms logic)
    for (let i = this.arrows.length - 1; i >= 0; i--) {
      const arrow = this.arrows[i];
      if (arrow.state !== 'stuck') continue;

      const arrowLeft = this.woodPole.width;
      const arrowRight = arrowLeft + this.arrowLength - arrow.penetration;
      const arrowTop = arrow.y - this.arrowHeight / 2 + arrow.flexOffset;
      const arrowBottom = arrow.y + this.arrowHeight / 2 + arrow.flexOffset;

      const isFalling = b.vy > 0;
      const withinX = (b.x >= arrowLeft - 5 && b.x <= arrowRight + 15);
      const isTouchingTop = (b.y + b.radius >= arrowTop - 8 && b.y - b.radius < arrowBottom);

      if (isFalling && withinX && isTouchingTop) {
        // Successful bounce
        b.y = arrowTop - b.radius;

        const baseBounce = -880;
        const comboBoost = Math.min(this.combo * 20, 160);
        b.vy = baseBounce - comboBoost;

        b.squashX = 1.4;
        b.squashY = 0.6;

        arrow.flexOffset = 18;
        arrow.wobble = 0.35;
        arrow.bouncesCount++;

        this.combo++;
        if (this.combo > this.maxCombo) this.maxCombo = this.combo;
        this.successfulBounces++;

        const points = 50 * this.combo;
        this.score += points;

        soundEngine.playArrowBounce(this.combo);
        this.triggerShake(6, 0.2);

        this.spawnSparks(b.x, arrowTop, '#ffd700', 16, 0, -1);
        this.addFloatingText(
          this.combo > 1 ? `+${points} (${this.combo}x COMBO!)` : `+${points}`,
          b.x,
          arrowTop - 25,
          this.combo > 1 ? '#ffcc00' : '#ffffff',
          this.combo > 2 ? 26 : 20
        );

        // --- Decaying Arrow Feature (Hard / Insane mode) ---
        if (this.difficultyTier >= 1 && arrow.bouncesCount >= arrow.maxBouncesAllowed) {
          // Arrow shatters and snaps!
          arrow.state = 'broken';
          this.spawnWoodChips(b.x, arrowTop, 20);
          soundEngine.playMetalClang();
          this.addFloatingText('PLATFORM BROKE!', b.x, arrowTop + 10, '#ff4757', 22);
          this.arrows.splice(i, 1);
        } else if (this.difficultyTier >= 1 && arrow.bouncesCount === arrow.maxBouncesAllowed - 1) {
          // Warning crack
          this.addFloatingText('CRACKING!', b.x, arrowTop + 10, '#ff9f43', 18);
        }

        this.updateHUD();
      }
    }

    // Abyss Check
    const screenBottomWorldY = this.cameraY + this.height;
    if (b.y - b.radius > screenBottomWorldY) {
      this.triggerGameOver('Ball fell into the abyss!');
      soundEngine.playFallDeath();
    }
  }

  updateArrows(dt) {
    for (let i = this.arrows.length - 1; i >= 0; i--) {
      const a = this.arrows[i];

      if (a.state === 'flying') {
        a.x -= a.speed * dt;

        // Trail particle
        a.trailParticlesTimer += dt;
        if (a.trailParticlesTimer > 0.02) {
          a.trailParticlesTimer = 0;
          this.particles.push({
            x: a.x + a.arrowLength * 0.4,
            y: a.y + (Math.random() - 0.5) * 4,
            vx: 120,
            vy: (Math.random() - 0.5) * 10,
            color: 'rgba(255, 255, 255, 0.6)',
            radius: Math.random() * 2 + 1.5,
            alpha: 0.6,
            decay: 4.0,
            type: 'line'
          });
        }

        // Direct Hit Hazard Check
        if (this.checkArrowHitsBall(a, this.ball)) {
          this.onArrowPiercedBall(a);
          return;
        }

        // Check if arrow reached wooden pole
        if (a.x <= a.targetX) {
          // Check if this altitude has an Armored Iron Plate on the pole!
          if (this.isPoleArmoredAtY(a.y)) {
            // Ricochet off armor!
            a.state = 'ricochet';
            a.vx = 450;
            a.vy = -180;
            a.rotSpeed = 12;
            soundEngine.playMetalClang();
            this.triggerShake(9, 0.25);
            this.spawnSparks(this.woodPole.width, a.y, '#00f2fe', 18, 1, 0, 300);
            this.addFloatingText('CLANG! ARMORED PLATE!', this.woodPole.width + 80, a.y - 20, '#00f2fe', 22);
          } else {
            // Embeds solidly in wood
            a.x = a.targetX;
            a.state = 'stuck';
            a.wobble = 0.45;
            soundEngine.playArrowHitWood();
            this.triggerShake(7, 0.22);
            this.spawnWoodChips(this.woodPole.width, a.y, 14);
          }
        }
      } else if (a.state === 'ricochet') {
        // Arrow falls spinning into oblivion
        a.x += a.vx * dt;
        a.y += a.vy * dt;
        a.vy += 1200 * dt; // gravity
        a.rotation += a.rotSpeed * dt;
        a.opacity -= dt * 1.5;
        if (a.opacity <= 0) {
          this.arrows.splice(i, 1);
          continue;
        }
      } else if (a.state === 'stuck') {
        if (a.wobble > 0.005) {
          a.wobble *= Math.exp(-a.wobbleDecay * dt);
        } else {
          a.wobble = 0;
        }

        if (a.flexOffset > 0.1) {
          a.flexOffset *= Math.exp(-12 * dt);
        } else {
          a.flexOffset = 0;
        }

        if (a.y > this.cameraY + this.height + 300) {
          a.opacity -= dt * 2;
          if (a.opacity <= 0) {
            this.arrows.splice(i, 1);
            continue;
          }
        }
      }
    }
  }

  isPoleArmoredAtY(worldY) {
    // Only in Tier 1 (Hard) and Tier 2 (Insane)
    if (this.difficultyTier < 1) return false;

    // Do not put armor below 25 meters (y > groundY - 500)
    if (worldY > this.groundY - 500) return false;

    // Procedural periodic armor plates:
    // Placed every 320px with an 85px band height
    const normalizedY = Math.abs(this.groundY - worldY);
    const bandCycle = normalizedY % 360;
    return bandCycle >= 0 && bandCycle <= 85;
  }

  checkArrowHitsBall(arrow, ball) {
    const arrowTipX = arrow.x;
    const arrowTailX = arrow.x + this.arrowLength;
    const arrowY = arrow.y;

    const closestX = Math.max(arrowTipX, Math.min(ball.x, arrowTailX));
    const closestY = arrowY;

    const dx = ball.x - closestX;
    const dy = ball.y - closestY;
    const distSq = dx * dx + dy * dy;

    return distSq <= (ball.radius + 6) * (ball.radius + 6);
  }

  onArrowPiercedBall(arrow) {
    this.ball.isPopped = true;
    this.lives = 0;

    soundEngine.playArrowHitBall();
    this.triggerShake(18, 0.45);

    this.spawnSparks(this.ball.x, this.ball.y, '#ff4b2b', 35, 0, 0, 450);
    this.spawnSparks(this.ball.x, this.ball.y, '#ffd700', 20, 0, 0, 350);

    this.addFloatingText('ARROW HIT THE BALL!', this.ball.x, this.ball.y - 40, '#ff3333', 30);
    this.triggerGameOver('Arrow pierced the ball!');
  }

  // --- Dynamic Obstacles Management ---

  updateObstacles(dt) {
    if (this.difficultyTier < 1) return;

    // 1. Spiky Aerial Mines Spawning & Updates
    this.mineSpawnTimer += dt;
    const mineInterval = this.difficultyTier === 2 ? 4.5 : 7.5;
    const maxMines = this.difficultyTier === 2 ? 5 : 3;

    if (this.mineSpawnTimer >= mineInterval && this.spikyMines.length < maxMines) {
      this.mineSpawnTimer = 0;
      this.spawnSpikyMine();
    }

    for (let i = this.spikyMines.length - 1; i >= 0; i--) {
      const mine = this.spikyMines[i];
      mine.time += dt;

      // Gentle horizontal hovering
      mine.x = mine.baseX + Math.sin(mine.time * mine.bobSpeed) * mine.bobAmp;
      mine.rotation += dt * 1.2;

      // Collision A: Ball vs Mine (Fatal!)
      const dx = this.ball.x - mine.x;
      const dy = this.ball.y - mine.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < this.ball.radius + mine.radius && !this.ball.isPopped) {
        // Fatal explosion
        this.ball.isPopped = true;
        this.lives = 0;
        soundEngine.playMineExplosion();
        this.triggerShake(20, 0.5);
        this.spawnSparks(mine.x, mine.y, '#ff3860', 30, 0, 0, 400);
        this.spawnSparks(mine.x, mine.y, '#ffd700', 20, 0, 0, 300);
        this.addFloatingText('MINE EXPLOSION!', mine.x, mine.y - 30, '#ff3860', 30);
        this.triggerGameOver('Ball hit a spiky mine!');
        return;
      }

      // Collision B: Flying Arrow vs Mine (Defuses mine, destroys arrow)
      for (let j = this.arrows.length - 1; j >= 0; j--) {
        const arrow = this.arrows[j];
        if (arrow.state !== 'flying') continue;

        const arrowClosestX = Math.max(arrow.x, Math.min(mine.x, arrow.x + this.arrowLength));
        const adx = mine.x - arrowClosestX;
        const ady = mine.y - arrow.y;
        const arrowDist = Math.sqrt(adx * adx + ady * ady);

        if (arrowDist < mine.radius + 12) {
          // Arrow intercepts mine!
          soundEngine.playMineExplosion();
          this.triggerShake(10, 0.3);
          this.spawnSparks(mine.x, mine.y, '#ff9f43', 25, 0, 0, 350);
          this.addFloatingText('+75 MINE DEFUSED!', mine.x, mine.y - 25, '#ffd700', 24);
          this.score += 75;

          this.arrows.splice(j, 1);
          this.spikyMines.splice(i, 1);
          break;
        }
      }

      // Remove mines far below camera
      if (mine.y > this.cameraY + this.height + 250) {
        this.spikyMines.splice(i, 1);
      }
    }

    // 2. Flying Cross-Hazards (Cyber Drones / Bats in Insane Mode)
    if (this.difficultyTier >= 2) {
      this.hazardSpawnTimer += dt;
      if (this.hazardSpawnTimer >= 8.0) {
        this.hazardSpawnTimer = 0;
        this.spawnFlyingHazard();
      }

      for (let i = this.flyingHazards.length - 1; i >= 0; i--) {
        const h = this.flyingHazards[i];

        if (h.state === 'warning') {
          h.warningTimer -= dt;
          if (h.warningTimer <= 0) {
            h.state = 'flying';
            soundEngine.playWarningAlert();
          }
        } else if (h.state === 'flying') {
          h.x += h.vx * dt;
          h.wingCycle += dt * 15;

          // Ball Collision
          const dx = this.ball.x - h.x;
          const dy = this.ball.y - h.y;
          if (Math.sqrt(dx * dx + dy * dy) < this.ball.radius + 16 && !this.ball.isPopped) {
            this.ball.isPopped = true;
            this.lives = 0;
            soundEngine.playArrowHitBall();
            this.triggerShake(16, 0.4);
            this.spawnSparks(h.x, h.y, '#ff4757', 30, 0, 0, 350);
            this.addFloatingText('STRUCK BY DRONE!', h.x, h.y - 30, '#ff4757', 28);
            this.triggerGameOver('Struck by a flying drone!');
            return;
          }

          // Arrow Collision
          for (let j = this.arrows.length - 1; j >= 0; j--) {
            const arrow = this.arrows[j];
            if (arrow.state !== 'flying') continue;

            const adx = h.x - arrow.x;
            const ady = h.y - arrow.y;
            if (Math.sqrt(adx * adx + ady * ady) < 26) {
              soundEngine.playMetalClang();
              this.spawnSparks(h.x, h.y, '#00f2fe', 20, 0, 0, 300);
              this.addFloatingText('+100 DRONE DESTROYED!', h.x, h.y - 20, '#00f2fe', 24);
              this.score += 100;
              this.arrows.splice(j, 1);
              this.flyingHazards.splice(i, 1);
              break;
            }
          }

          if (h.x > this.width + 100 || h.x < -100) {
            this.flyingHazards.splice(i, 1);
          }
        }
      }
    }
  }

  spawnSpikyMine() {
    // Spawn in the climbing column above the camera
    const spawnY = this.cameraY - Math.random() * 350 - 150;
    const baseX = Math.random() * 120 + 170; // x between 170 and 290

    this.spikyMines.push({
      id: Date.now() + Math.random(),
      baseX: baseX,
      x: baseX,
      y: spawnY,
      radius: 18,
      bobSpeed: Math.random() * 2 + 1.2,
      bobAmp: Math.random() * 35 + 20,
      time: Math.random() * 10,
      rotation: 0
    });
  }

  spawnFlyingHazard() {
    // Swoops horizontally across the middle of the camera view
    const fromLeft = Math.random() > 0.5;
    const targetY = this.cameraY + Math.random() * 300 + 350;

    this.flyingHazards.push({
      id: Date.now() + Math.random(),
      x: fromLeft ? -40 : this.width + 40,
      y: targetY,
      vx: fromLeft ? 520 : -520,
      fromLeft: fromLeft,
      state: 'warning',
      warningTimer: 1.2,
      wingCycle: 0
    });

    soundEngine.playWarningAlert();
  }

  updateCamera(dt) {
    const desiredCameraY = this.ball.y - this.height * 0.58;
    if (desiredCameraY < this.targetCameraY) {
      this.targetCameraY = desiredCameraY;
    }
    this.cameraY += (this.targetCameraY - this.cameraY) * (6.5 * dt);
  }

  checkAltitudeProgress() {
    const currentAlt = Math.max(0, Math.floor((this.groundY - this.ball.y) / 20));
    if (currentAlt > this.maxAltitude) {
      const diff = currentAlt - this.maxAltitude;
      this.maxAltitude = currentAlt;
      this.score += diff * 10;
      this.updateHUD();

      const milestoneStep = 25;
      if (currentAlt >= this.lastMilestonePassed + milestoneStep) {
        this.lastMilestonePassed = Math.floor(currentAlt / milestoneStep) * milestoneStep;
        this.onMilestoneReached(this.lastMilestonePassed);
      }
    }
  }

  onMilestoneReached(meters) {
    soundEngine.playMilestone();
    this.milestoneBanner.text = `🌟 ${meters} METERS REACHED! 🌟`;
    this.milestoneBanner.timer = 2.5;
    this.milestoneBanner.alpha = 1;

    this.spawnSparks(this.width / 2, this.cameraY + 200, '#ffd700', 25, 0, 0, 300);
    this.addFloatingText(`MILESTONE: +${meters * 5} PTS`, this.width / 2, this.cameraY + 240, '#00f2fe', 24);
    this.score += meters * 5;
    this.updateHUD();
  }

  triggerShake(intensity, duration) {
    this.shakeIntensity = intensity;
    this.shakeDuration = duration;
  }

  triggerGameOver(reason) {
    if (this.state === 'gameover') return;
    this.state = 'gameover';
    this.lives = 0;

    const finalScore = this.score;
    const isNewHigh = this.saveHighScore(finalScore);

    const hudLife = document.getElementById('hud-life');
    if (hudLife) hudLife.textContent = '0';

    const gameData = {
      score: finalScore,
      highScore: this.highScore,
      height: this.maxAltitude,
      arrowsShot: this.arrowsShot,
      bounces: this.successfulBounces,
      maxCombo: this.maxCombo,
      reason: reason,
      timePlayed: Math.round(this.elapsedTime)
    };

    console.log('[Game] Game Over triggered:', gameData);

    ScoreAPI.sendScore(finalScore, gameData);

    const modal = document.getElementById('gameover-modal');
    if (modal) {
      document.getElementById('final-score').textContent = finalScore;
      document.getElementById('final-height').textContent = `${this.maxAltitude}m`;
      document.getElementById('final-highscore').textContent = this.highScore;
      document.getElementById('final-bounces').textContent = this.successfulBounces;
      document.getElementById('gameover-reason').textContent = reason;

      const finalTimeEl = document.getElementById('final-time');
      if (finalTimeEl) {
        const totalSecs = Math.floor(this.elapsedTime);
        const m = Math.floor(totalSecs / 60).toString().padStart(2, '0');
        const s = (totalSecs % 60).toString().padStart(2, '0');
        finalTimeEl.textContent = `${m}:${s}`;
      }

      const newHighBadge = document.getElementById('new-high-badge');
      if (newHighBadge) {
        newHighBadge.style.display = isNewHigh ? 'inline-block' : 'none';
      }

      modal.classList.remove('hidden');
    }

    GameOverController.handleGameOver(gameData);
  }

  restartGame() {
    this.score = 0;
    this.maxAltitude = 0;
    this.arrowsShot = 0;
    this.successfulBounces = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.lives = 1;
    this.cameraY = 0;
    this.targetCameraY = 0;
    this.lastMilestonePassed = 0;
    this.difficultyTier = 0;
    this.mineSpawnTimer = 0;
    this.hazardSpawnTimer = 0;

    this.ball = {
      x: 230,
      y: 1060,
      radius: 24,
      vx: 0,
      vy: -750,
      baseRestitution: 0.96,
      gravity: 1050,
      squashX: 1,
      squashY: 1,
      rotation: 0,
      color: '#ff416c',
      glowColor: '#ff4b2b',
      isPopped: false,
      popAnim: 0
    };

    this.arrows = [];
    this.spikyMines = [];
    this.flyingHazards = [];
    this.particles = [];
    this.floatingTexts = [];
    this.state = 'playing';
    this.startTime = performance.now();

    const modal = document.getElementById('gameover-modal');
    if (modal) modal.classList.add('hidden');

    const pauseModal = document.getElementById('pause-modal');
    if (pauseModal) pauseModal.classList.add('hidden');

    this.updateHUD();
  }

  updateHUD() {
    const elScore = document.getElementById('hud-score');
    if (elScore) elScore.textContent = this.score;

    const elHeight = document.getElementById('hud-height');
    if (elHeight) elHeight.textContent = `${this.maxAltitude}m`;

    const elLife = document.getElementById('hud-life');
    if (elLife) elLife.textContent = this.lives;
  }

  // --- Particles & Text FX ---

  spawnSparks(x, y, color, count = 12, dirX = 0, dirY = 0, maxSpeed = 220) {
    for (let i = 0; i < count; i++) {
      const angle = (dirX === 0 && dirY === 0) 
        ? Math.random() * Math.PI * 2 
        : Math.atan2(dirY, dirX) + (Math.random() - 0.5) * 1.5;
      const speed = Math.random() * maxSpeed + 40;
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: color,
        radius: Math.random() * 4 + 2,
        alpha: 1,
        decay: Math.random() * 2 + 2,
        type: 'spark'
      });
    }
  }

  spawnWoodChips(x, y, count = 10) {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: x + Math.random() * 10,
        y: y + (Math.random() - 0.5) * 10,
        vx: Math.random() * 160 + 60,
        vy: (Math.random() - 0.5) * 140 - 40,
        color: Math.random() > 0.5 ? '#8b5a2b' : '#c99355',
        radius: Math.random() * 3.5 + 2,
        alpha: 1,
        decay: 3.0,
        type: 'chip',
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 15
      });
    }
  }

  addFloatingText(text, x, y, color = '#ffd700', size = 20) {
    this.floatingTexts.push({
      text: text,
      x: x,
      y: y,
      color: color,
      size: size,
      alpha: 1,
      vy: -60,
      life: 1.2
    });
  }

  updateParticles(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.alpha -= p.decay * dt;

      if (p.type === 'spark') {
        p.vy += 350 * dt;
      } else if (p.type === 'chip') {
        p.vy += 450 * dt;
        p.rotation += p.rotSpeed * dt;
      }

      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  updateFloatingTexts(dt) {
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y += ft.vy * dt;
      ft.life -= dt;
      ft.alpha = Math.max(0, ft.life);
      if (ft.life <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }
  }

  // --- Rendering ---

  render() {
    this.ctx.save();

    let shakeX = 0;
    let shakeY = 0;
    if (this.shakeDuration > 0) {
      shakeX = (Math.random() - 0.5) * this.shakeIntensity * 2;
      shakeY = (Math.random() - 0.5) * this.shakeIntensity * 2;
    }
    this.ctx.translate(shakeX, shakeY);

    // 1. Sky & Background
    this.drawSkyBackground();

    // 2. Stars & Clouds
    this.drawAtmosphereAndClouds();

    // Apply Camera Transform (World Coordinates)
    this.ctx.save();
    this.ctx.translate(0, -this.cameraY);

    // 3. Ground
    this.drawGround();

    // 4. Infinite Wooden Column with Altitude Scale & Armored Plates
    this.drawWoodenColumnWithScale();

    // 5. Dynamic Obstacles (Spiky Mines, Flying Hazards)
    this.drawObstacles();

    // 6. Arrows (Flying, Stuck, Ricocheting)
    this.drawArrows();

    // 7. Ball
    this.drawBall();

    // 8. World Particles
    this.drawParticles();

    // 9. Floating Texts
    this.drawFloatingTexts();

    // 10. Aiming Guide
    if (this.state === 'playing') {
      this.drawAimGuide();
    }

    this.ctx.restore(); // End world camera transform

    // 11. UI Overlay (Milestone banners, Bow Launcher, Hazard Warnings)
    this.drawScreenOverlays();

    this.ctx.restore(); // End shake
  }

  drawSkyBackground() {
    const altitudeFactor = Math.min(1, Math.max(0, -this.cameraY / 12000));
    const grad = this.ctx.createLinearGradient(0, 0, 0, this.height);

    if (altitudeFactor < 0.3) {
      grad.addColorStop(0, '#2b5876');
      grad.addColorStop(0.5, '#4e4376');
      grad.addColorStop(1, '#8ca6db');
    } else if (altitudeFactor < 0.7) {
      grad.addColorStop(0, '#0f2027');
      grad.addColorStop(0.4, '#203a43');
      grad.addColorStop(0.8, '#fc466b');
      grad.addColorStop(1, '#3f5efb');
    } else {
      grad.addColorStop(0, '#050510');
      grad.addColorStop(0.5, '#0b0c1b');
      grad.addColorStop(1, '#1b1b3a');
    }

    this.ctx.fillStyle = grad;
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  drawAtmosphereAndClouds() {
    this.ctx.fillStyle = '#ffffff';
    this.backgroundStars.forEach(s => {
      const screenY = s.worldY - this.cameraY * 0.4;
      if (screenY >= -10 && screenY <= this.height + 10) {
        this.ctx.globalAlpha = s.alpha * (0.8 + 0.2 * Math.sin(this.elapsedTime * s.twinkleSpeed));
        this.ctx.beginPath();
        this.ctx.arc(s.x, screenY, s.size, 0, Math.PI * 2);
        this.ctx.fill();
      }
    });

    this.clouds.forEach(c => {
      const screenY = c.worldY - this.cameraY * 0.75;
      if (screenY >= -100 && screenY <= this.height + 100) {
        this.ctx.fillStyle = `rgba(255, 255, 255, ${c.opacity})`;
        this.ctx.beginPath();
        this.ctx.roundRect(c.x, screenY, c.width, c.height, c.height / 2);
        this.ctx.fill();

        this.ctx.beginPath();
        this.ctx.arc(c.x + c.width * 0.3, screenY - c.height * 0.25, c.height * 0.6, 0, Math.PI * 2);
        this.ctx.arc(c.x + c.width * 0.7, screenY - c.height * 0.15, c.height * 0.5, 0, Math.PI * 2);
        this.ctx.fill();
      }
    });

    this.ctx.globalAlpha = 1.0;
  }

  drawGround() {
    const gy = this.groundY;

    const grassGrad = this.ctx.createLinearGradient(0, gy, 0, gy + 30);
    grassGrad.addColorStop(0, '#70a030');
    grassGrad.addColorStop(1, '#486820');

    this.ctx.fillStyle = grassGrad;
    this.ctx.fillRect(0, gy, this.width, 30);

    const dirtGrad = this.ctx.createLinearGradient(0, gy + 30, 0, gy + 200);
    dirtGrad.addColorStop(0, '#3d2b1f');
    dirtGrad.addColorStop(1, '#20160f');

    this.ctx.fillStyle = dirtGrad;
    this.ctx.fillRect(0, gy + 30, this.width, 200);

    this.ctx.fillStyle = '#8ee033';
    for (let x = 100; x < this.width; x += 16) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, gy);
      this.ctx.lineTo(x + 5, gy - 12);
      this.ctx.lineTo(x + 10, gy);
      this.ctx.fill();
    }
  }

  drawWoodenColumnWithScale() {
    const pw = this.woodPole.width;
    const viewTop = this.cameraY - 50;
    const viewBottom = this.cameraY + this.height + 50;

    // Wood column body
    const poleGrad = this.ctx.createLinearGradient(0, 0, pw, 0);
    poleGrad.addColorStop(0, '#381f12');
    poleGrad.addColorStop(0.3, '#5c3a21');
    poleGrad.addColorStop(0.7, '#7a4d2c');
    poleGrad.addColorStop(1, '#381f12');

    this.ctx.fillStyle = poleGrad;
    this.ctx.fillRect(0, viewTop, pw, viewBottom - viewTop);

    this.ctx.fillStyle = '#24140b';
    this.ctx.fillRect(pw - 4, viewTop, 4, viewBottom - viewTop);

    this.ctx.fillStyle = 'rgba(30, 15, 8, 0.2)';
    this.ctx.fillRect(18, viewTop, 5, viewBottom - viewTop);
    this.ctx.fillRect(45, viewTop, 3, viewBottom - viewTop);
    this.ctx.fillRect(72, viewTop, 6, viewBottom - viewTop);

    // Altitude Scale & Ruler Markings
    const startM = Math.max(0, Math.floor((this.groundY - viewBottom) / 20));
    const endM = Math.ceil((this.groundY - viewTop) / 20);

    this.ctx.textAlign = 'right';
    this.ctx.textBaseline = 'middle';

    for (let m = startM; m <= endM; m++) {
      const yPos = this.groundY - m * 20;

      // Draw Armored Iron Plates if present at this height
      if (this.isPoleArmoredAtY(yPos) && m % 2 === 0) {
        // Metallic sheen overlay
        this.ctx.fillStyle = 'rgba(180, 200, 220, 0.35)';
        this.ctx.fillRect(4, yPos - 18, pw - 8, 36);

        // Steel rivets
        this.ctx.fillStyle = '#f1f2f6';
        this.ctx.beginPath();
        this.ctx.arc(pw - 8, yPos - 10, 2.5, 0, Math.PI * 2);
        this.ctx.arc(pw - 8, yPos + 10, 2.5, 0, Math.PI * 2);
        this.ctx.fill();

        // Metallic border
        this.ctx.strokeStyle = '#70a1ff';
        this.ctx.lineWidth = 1.5;
        this.ctx.strokeRect(4, yPos - 18, pw - 8, 36);
      }

      if (m % 25 === 0) {
        this.ctx.fillStyle = 'rgba(255, 215, 0, 0.25)';
        this.ctx.fillRect(2, yPos - 14, pw - 8, 28);
        this.ctx.strokeStyle = '#ffd700';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(2, yPos - 14, pw - 8, 28);

        this.ctx.fillStyle = '#ffd700';
        this.ctx.fillRect(pw - 24, yPos - 2.5, 20, 5);

        this.ctx.font = 'bold 15px "Segoe UI", Arial, sans-serif';
        this.ctx.fillStyle = '#ffffff';
        this.ctx.shadowColor = '#ffd700';
        this.ctx.shadowBlur = 6;
        this.ctx.fillText(`${m}m`, pw - 28, yPos);
        this.ctx.shadowBlur = 0;
      } else if (m % 5 === 0) {
        this.ctx.fillStyle = '#e8d2b5';
        this.ctx.fillRect(pw - 16, yPos - 1.5, 12, 3);

        this.ctx.font = 'bold 12px "Segoe UI", Arial, sans-serif';
        this.ctx.fillStyle = 'rgba(240, 225, 205, 0.85)';
        this.ctx.fillText(`${m}m`, pw - 20, yPos);
      } else {
        this.ctx.fillStyle = 'rgba(200, 180, 160, 0.45)';
        this.ctx.fillRect(pw - 8, yPos - 1, 6, 2);
      }
    }
  }

  drawObstacles() {
    // 1. Draw Spiky Mines
    this.spikyMines.forEach(m => {
      this.ctx.save();
      this.ctx.translate(m.x, m.y);
      this.ctx.rotate(m.rotation);

      // Spikes around sphere
      this.ctx.fillStyle = '#ff4757';
      const spikeCount = 8;
      for (let i = 0; i < spikeCount; i++) {
        const ang = (i * Math.PI * 2) / spikeCount;
        this.ctx.save();
        this.ctx.rotate(ang);
        this.ctx.beginPath();
        this.ctx.moveTo(-4, -m.radius + 2);
        this.ctx.lineTo(0, -m.radius - 9);
        this.ctx.lineTo(4, -m.radius + 2);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.restore();
      }

      // Mine Body (Dark metal core)
      const grad = this.ctx.createRadialGradient(-3, -3, 2, 0, 0, m.radius);
      grad.addColorStop(0, '#57606f');
      grad.addColorStop(0.7, '#2f3542');
      grad.addColorStop(1, '#1e272e');

      this.ctx.fillStyle = grad;
      this.ctx.beginPath();
      this.ctx.arc(0, 0, m.radius, 0, Math.PI * 2);
      this.ctx.fill();

      // Pulsing red danger light at core
      const pulse = 0.5 + 0.5 * Math.sin(this.elapsedTime * 6);
      this.ctx.fillStyle = `rgba(255, 71, 87, ${pulse})`;
      this.ctx.shadowColor = '#ff4757';
      this.ctx.shadowBlur = 10;
      this.ctx.beginPath();
      this.ctx.arc(0, 0, 5, 0, Math.PI * 2);
      this.ctx.fill();

      this.ctx.restore();
    });

    // 2. Draw Flying Hazards (Drones / Bats)
    this.flyingHazards.forEach(h => {
      if (h.state !== 'flying') return;

      this.ctx.save();
      this.ctx.translate(h.x, h.y);

      // Body
      this.ctx.fillStyle = '#2ed573';
      this.ctx.shadowColor = '#2ed573';
      this.ctx.shadowBlur = 8;

      // Drone sphere core
      this.ctx.beginPath();
      this.ctx.arc(0, 0, 12, 0, Math.PI * 2);
      this.ctx.fill();

      // Wings / Rotors
      const wingW = Math.sin(h.wingCycle) * 16;
      this.ctx.strokeStyle = '#ffffff';
      this.ctx.lineWidth = 2.5;
      this.ctx.beginPath();
      this.ctx.moveTo(-18, wingW);
      this.ctx.lineTo(18, -wingW);
      this.ctx.stroke();

      this.ctx.restore();
    });
  }

  drawArrows() {
    this.arrows.forEach(a => {
      this.ctx.save();
      this.ctx.globalAlpha = a.opacity;

      const yWithOffset = a.y + a.flexOffset;
      const wobbleRotation = Math.sin(this.elapsedTime * a.wobbleSpeed) * a.wobble;

      this.ctx.translate(a.x, yWithOffset);
      this.ctx.rotate(wobbleRotation + (a.rotation || 0));

      const len = this.arrowLength;
      const h = this.arrowHeight;

      // Shaft Gradient
      const shaftGrad = this.ctx.createLinearGradient(0, -h / 2, 0, h / 2);
      shaftGrad.addColorStop(0, '#c89656');
      shaftGrad.addColorStop(0.5, '#f4cf90');
      shaftGrad.addColorStop(1, '#a67232');

      this.ctx.fillStyle = shaftGrad;
      this.ctx.beginPath();
      this.ctx.roundRect(0, -h / 2, len - 20, h, 3);
      this.ctx.fill();

      this.ctx.strokeStyle = '#5a3d1b';
      this.ctx.lineWidth = 1;
      this.ctx.stroke();

      // Steel Arrowhead
      this.ctx.fillStyle = '#dcdde1';
      this.ctx.beginPath();
      this.ctx.moveTo(-15, 0);
      this.ctx.lineTo(8, -h);
      this.ctx.lineTo(4, 0);
      this.ctx.lineTo(8, h);
      this.ctx.closePath();
      this.ctx.fill();

      this.ctx.strokeStyle = '#718093';
      this.ctx.lineWidth = 1.5;
      this.ctx.stroke();

      // Fletchings
      const tailX = len - 25;
      this.ctx.fillStyle = '#e84118';
      this.ctx.beginPath();
      this.ctx.moveTo(tailX, -h / 2);
      this.ctx.lineTo(tailX - 25, -h * 1.8);
      this.ctx.lineTo(tailX - 5, -h * 1.8);
      this.ctx.lineTo(tailX + 15, -h / 2);
      this.ctx.closePath();
      this.ctx.fill();

      this.ctx.beginPath();
      this.ctx.moveTo(tailX, h / 2);
      this.ctx.lineTo(tailX - 25, h * 1.8);
      this.ctx.lineTo(tailX - 5, h * 1.8);
      this.ctx.lineTo(tailX + 15, h / 2);
      this.ctx.closePath();
      this.ctx.fill();

      // Visible Cracks if Decaying Arrow
      if (a.state === 'stuck' && a.bouncesCount > 0 && this.difficultyTier >= 1) {
        this.ctx.strokeStyle = '#1e1005';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(len * 0.4, -h / 2);
        this.ctx.lineTo(len * 0.42, 2);
        this.ctx.lineTo(len * 0.45, h / 2);
        this.ctx.stroke();
      }

      this.ctx.restore();
    });
  }

  drawBall() {
    const b = this.ball;
    if (b.isPopped) return;

    this.ctx.save();
    this.ctx.translate(b.x, b.y);
    this.ctx.rotate(b.rotation);
    this.ctx.scale(b.squashX, b.squashY);

    this.ctx.shadowColor = b.glowColor;
    this.ctx.shadowBlur = 18;

    const ballGrad = this.ctx.createRadialGradient(
      -b.radius * 0.35, -b.radius * 0.35, b.radius * 0.1,
      0, 0, b.radius
    );
    ballGrad.addColorStop(0, '#ffffff');
    ballGrad.addColorStop(0.2, '#ff6b8b');
    ballGrad.addColorStop(0.7, '#ff2e63');
    ballGrad.addColorStop(1, '#8b0028');

    this.ctx.fillStyle = ballGrad;
    this.ctx.beginPath();
    this.ctx.arc(0, 0, b.radius, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.shadowBlur = 0;
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    this.ctx.beginPath();
    this.ctx.ellipse(
      -b.radius * 0.32, -b.radius * 0.35,
      b.radius * 0.38, b.radius * 0.22,
      Math.PI / 4, 0, Math.PI * 2
    );
    this.ctx.fill();

    this.ctx.restore();
  }

  drawAimGuide() {
    if (this.aimY > this.groundY - 10) return;

    this.ctx.save();

    // Red dotted line if aiming at armored plate!
    const isArmored = this.isPoleArmoredAtY(this.aimY);
    let guideColor = 'rgba(0, 242, 254, 0.5)';
    if (isArmored) guideColor = 'rgba(255, 71, 87, 0.7)';
    else if (!this.canShoot) guideColor = 'rgba(255, 65, 108, 0.35)';

    this.ctx.strokeStyle = guideColor;
    this.ctx.lineWidth = 2;
    this.ctx.setLineDash([8, 8]);
    this.ctx.lineDashOffset = -this.elapsedTime * 40;

    this.ctx.beginPath();
    this.ctx.moveTo(this.launcherX, this.aimY);
    this.ctx.lineTo(this.woodPole.width + 10, this.aimY);
    this.ctx.stroke();
    this.ctx.setLineDash([]);

    // Crosshair
    this.ctx.strokeStyle = isArmored ? '#ff4757' : (this.canShoot ? '#00f2fe' : '#ff416c');
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.arc(this.woodPole.width + 10, this.aimY, 8, 0, Math.PI * 2);
    this.ctx.stroke();

    if (isArmored) {
      this.ctx.fillStyle = '#ff4757';
      this.ctx.font = 'bold 12px "Segoe UI", Arial, sans-serif';
      this.ctx.textAlign = 'left';
      this.ctx.fillText('ARMORED!', this.woodPole.width + 25, this.aimY + 4);
    }

    this.ctx.restore();
  }

  drawParticles() {
    this.particles.forEach(p => {
      this.ctx.save();
      this.ctx.globalAlpha = Math.max(0, p.alpha);
      this.ctx.fillStyle = p.color;

      if (p.type === 'line') {
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        this.ctx.fill();
      } else if (p.type === 'chip') {
        this.ctx.translate(p.x, p.y);
        this.ctx.rotate(p.rotation || 0);
        this.ctx.fillRect(-p.radius, -p.radius * 0.6, p.radius * 2, p.radius * 1.2);
      } else {
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        this.ctx.fill();
      }

      this.ctx.restore();
    });
  }

  drawFloatingTexts() {
    this.floatingTexts.forEach(ft => {
      this.ctx.save();
      this.ctx.globalAlpha = Math.max(0, ft.alpha);
      this.ctx.font = `bold ${ft.size}px "Segoe UI", Arial, sans-serif`;
      this.ctx.fillStyle = ft.color;
      this.ctx.textAlign = 'center';
      this.ctx.shadowColor = '#000000';
      this.ctx.shadowBlur = 6;
      this.ctx.fillText(ft.text, ft.x, ft.y);
      this.ctx.restore();
    });
  }

  drawScreenOverlays() {
    // 1. Milestone / Difficulty Banner
    if (this.milestoneBanner.alpha > 0) {
      this.ctx.save();
      this.ctx.globalAlpha = this.milestoneBanner.alpha;

      const bw = 500;
      const bh = 54;
      const bx = (this.width - bw) / 2;
      const by = 130;

      this.ctx.fillStyle = 'rgba(10, 15, 30, 0.9)';
      this.ctx.roundRect(bx, by, bw, bh, 14);
      this.ctx.fill();

      this.ctx.strokeStyle = this.difficultyTier === 2 ? '#ff3860' : (this.difficultyTier === 1 ? '#ff9f43' : '#ffd700');
      this.ctx.lineWidth = 2.5;
      this.ctx.stroke();

      this.ctx.font = 'bold 20px "Segoe UI", Arial, sans-serif';
      this.ctx.fillStyle = '#ffffff';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.shadowColor = this.ctx.strokeStyle;
      this.ctx.shadowBlur = 10;
      this.ctx.fillText(this.milestoneBanner.text, this.width / 2, by + bh / 2);

      this.ctx.restore();
    }

    // 2. Incoming Hazard Warning Indicators (telegraphed '!' icon on screen edge)
    this.flyingHazards.forEach(h => {
      if (h.state === 'warning') {
        this.ctx.save();
        const screenY = h.y - this.cameraY;
        const screenX = h.fromLeft ? 30 : this.width - 30;

        const pulse = 0.5 + 0.5 * Math.sin(this.elapsedTime * 15);
        this.ctx.fillStyle = `rgba(255, 56, 96, ${pulse})`;
        this.ctx.beginPath();
        this.ctx.arc(screenX, screenY, 18, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.font = 'bold 22px Arial';
        this.ctx.fillStyle = '#ffffff';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('!', screenX, screenY);

        this.ctx.restore();
      }
    });

    // 3. Right Bow launcher icon
    if (this.state === 'playing') {
      const screenAimY = this.aimY - this.cameraY;
      if (screenAimY >= 0 && screenAimY <= this.height) {
        this.ctx.save();
        this.ctx.translate(this.launcherX, screenAimY);

        this.ctx.strokeStyle = this.canShoot ? '#ffd700' : '#888888';
        this.ctx.lineWidth = 4;
        this.ctx.beginPath();
        this.ctx.arc(15, 0, 24, Math.PI * 0.65, Math.PI * 1.35);
        this.ctx.stroke();

        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        this.ctx.lineWidth = 1.5;
        this.ctx.beginPath();
        this.ctx.moveTo(15 + Math.cos(Math.PI * 0.65) * 24, Math.sin(Math.PI * 0.65) * 24);
        this.ctx.lineTo(this.canShoot ? 2 : 12, 0);
        this.ctx.lineTo(15 + Math.cos(Math.PI * 1.35) * 24, Math.sin(Math.PI * 1.35) * 24);
        this.ctx.stroke();

        this.ctx.restore();
      }
    }
  }

  // --- Main Animation Loop ---

  gameLoop(timestamp) {
    const dt = Math.min((timestamp - this.lastTime) / 1000, 0.05);
    this.lastTime = timestamp;

    this.update(dt);
    this.render();

    requestAnimationFrame((t) => this.gameLoop(t));
  }
}

// Instantiate game upon DOM load
window.addEventListener('DOMContentLoaded', () => {
  window.gameInstance = new BallGravityGame();
});

export { BallGravityGame };
