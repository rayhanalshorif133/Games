/**
 * Halloween Match 3 - Complete Pure-JS Game Engine
 * Features:
 * - Pure HTML5 Canvas implementation (480x854 virtual resolution)
 * - Ultra-smooth 8-directional drag-to-connect mechanic with backtracking support
 * - Dynamic falling gravity physics & column refill animations
 * - Particle explosions & floating score popups
 * - Web Audio API procedural sound synthesis
 * - Authentic Halloween graphics & HUD
 * - Integrated ScoreAPI for remote score submission
 */

import { ScoreAPI } from '../scoreapi.js';
import { GameOverController } from '../gameover.js';

// =========================================================================
// ⏱️ GAME DURATION CONFIGURATION (গেমের সময় নির্ধারণ)
// =========================================================================
// এখানে গেমের সময় সেকেন্ডে সেট করুন (যেমন: 30 = 30 সেকেন্ড, 300 = 5 মিনিট)
export const GAME_DURATION_SECONDS = 300; // 👈 CHANGE GAME DURATION HERE (in seconds)
// =========================================================================

// Pulsing red alert activates during the final seconds
const TIME_WARNING_THRESHOLD = Math.min(30, Math.max(10, Math.floor(GAME_DURATION_SECONDS * 0.15)));

// --- CONFIGURATION & CONSTANTS ---
const CANVAS_WIDTH = 480;
const CANVAS_HEIGHT = 854;

const COLS = 8;
const ROWS = 11;
const CELL_STEP_X = 52;
const CELL_STEP_Y = 51;
const GRID_ORIGIN_X = 58; // Center of Col 0
const GRID_ORIGIN_Y = 175; // Center of Row 0
const TILE_DRAW_SIZE = 48;
const ITEM_DRAW_SIZE = 42;
const CONNECT_MAX_DIST = 95; // Smooth diagonal reach

// Spritesheet Frame Mappings from metadata
const SPRITES = {
  bg: { file: 'images/shared-0-sheet0.webp', x: 0, y: 0, w: 1080, h: 1920 },
  box: { file: 'images/shared-0-sheet1.webp', x: 769, y: 769, w: 144, h: 144 },
  items: [
    { name: 'pumpkin', file: 'images/shared-0-sheet1.webp', x: 328, y: 257, w: 200, h: 200, color: '#ff7700' },
    { name: 'skull',   file: 'images/shared-0-sheet1.webp', x: 530, y: 257, w: 200, h: 200, color: '#00e5ff' },
    { name: 'eyeball', file: 'images/shared-0-sheet1.webp', x: 769, y: 257, w: 200, h: 200, color: '#76ff03' },
    { name: 'bat',     file: 'images/shared-0-sheet1.webp', x: 257, y: 513, w: 200, h: 200, color: '#d500f9' },
    { name: 'candy',   file: 'images/shared-0-sheet1.webp', x: 513, y: 513, w: 200, h: 200, color: '#ffea00' },
    { name: 'monster', file: 'images/shared-0-sheet1.webp', x: 769, y: 513, w: 200, h: 200, color: '#00e676' }
  ],
  hudBanner: { file: 'images/shared-0-sheet1.webp', x: 1, y: 1, w: 691, h: 194 },
  timerBadge: { file: 'images/shared-0-sheet2.webp', x: 129, y: 1, w: 149, h: 57 },
  scoreBadge: { file: 'images/shared-0-sheet1.webp', x: 197, y: 1, w: 314, h: 129 },
  connectLine: { file: 'images/shared-0-sheet2.webp', x: 193, y: 1, w: 250, h: 25 }
};

// --- AUDIO SYNTHESIZER (Web Audio API) ---
class SoundManager {
  constructor() {
    this.ctx = null;
    this.pentatonic = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25, 783.99, 880.00, 1046.50];
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playConnectNote(step) {
    if (!this.ctx) return;
    try {
      const freq = this.pentatonic[Math.min(step, this.pentatonic.length - 1)];
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.22);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.22);
    } catch(e) {}
  }

  playBacktrack() {
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(220, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(160, this.ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.12);
    } catch(e) {}
  }

  playMatchSuccess(count) {
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      [440, 554.37, 659.25, 880].forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + i * 0.04);
        gain.gain.setValueAtTime(0.2, now + i * 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.04 + 0.35);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + i * 0.04);
        osc.stop(now + i * 0.04 + 0.35);
      });
    } catch(e) {}
  }
}

// --- MAIN GAME CLASS ---
class HalloweenGame {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.sound = new SoundManager();

    this.images = {};
    this.assetsLoaded = false;

    // Game State
    this.grid = [];
    this.chain = [];
    this.pointer = null;
    this.isDragging = false;

    this.score = 0;
    this.displayScore = 0;
    this.scoreBump = 1.0;
    this.timeWarningPulse = 0;
    this.highScore = parseInt(localStorage.getItem('hw_highscore') || '0', 10);
    this.timeLeft = GAME_DURATION_SECONDS;
    this.isGameOver = false;

    // Animations & Particles
    this.particles = [];
    this.floatingScores = [];
    this.isFalling = false;

    this.lastTime = performance.now();

    this.init();
  }

  async init() {
    this.setupResolution();
    window.addEventListener('resize', () => this.setupResolution());

    this.setupEvents();
    await this.loadAssets();

    this.startNewGame();
    requestAnimationFrame((t) => this.gameLoop(t));
  }

  setupResolution() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = CANVAS_WIDTH * dpr;
    this.canvas.height = CANVAS_HEIGHT * dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.ctx.imageSmoothingEnabled = true;
  }

  async loadAssets() {
    const urls = [
      'images/shared-0-sheet0.webp',
      'images/shared-0-sheet1.webp',
      'images/shared-0-sheet2.webp'
    ];

    const loadImg = (url) => new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => resolve(img); // soft fallback
      img.src = url;
    });

    const [sheet0, sheet1, sheet2] = await Promise.all(urls.map(loadImg));
    this.images = { sheet0, sheet1, sheet2 };

    // Wait for Fredoka font to load
    try {
      await document.fonts.load('16px Fredoka');
    } catch (e) {}

    this.assetsLoaded = true;
    const loader = document.getElementById('loading-screen');
    if (loader) loader.classList.add('hidden');
  }

  startNewGame() {
    this.score = 0;
    this.displayScore = 0;
    this.scoreBump = 1.0;
    this.timeWarningPulse = 0;
    this.timeLeft = GAME_DURATION_SECONDS;
    this.isGameOver = false;
    this.chain = [];
    this.particles = [];
    this.floatingScores = [];

    // Hide Modal & reset redirect state
    const modal = document.getElementById('game-over-modal');
    if (modal) modal.classList.remove('active');
    const redirectText = document.getElementById('modal-redirect-text');
    if (redirectText) redirectText.textContent = '';
    const btnRestart = document.getElementById('btn-restart');
    if (btnRestart) {
      btnRestart.textContent = 'PLAY AGAIN';
      btnRestart.onclick = null;
    }

    // Create 8x11 grid
    this.grid = [];
    for (let c = 0; c < COLS; c++) {
      this.grid[c] = [];
      for (let r = 0; r < ROWS; r++) {
        const type = this.getRandomItemType();
        this.grid[c][r] = {
          type,
          col: c,
          row: r,
          x: GRID_ORIGIN_X + c * CELL_STEP_X,
          y: GRID_ORIGIN_Y + r * CELL_STEP_Y,
          targetY: GRID_ORIGIN_Y + r * CELL_STEP_Y,
          vy: 0,
          scale: 1,
          selected: false
        };
      }
    }

    // Start timer interval
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => {
      if (!this.isGameOver && this.timeLeft > 0) {
        this.timeLeft--;
        if (this.timeLeft <= 0) {
          this.triggerGameOver();
        }
      }
    }, 1000);
  }

  getRandomItemType() {
    return Math.floor(Math.random() * SPRITES.items.length);
  }

  // --- INPUT HANDLING ---
  setupEvents() {
    const getCanvasPos = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = CANVAS_WIDTH / rect.width;
      const scaleY = CANVAS_HEIGHT / rect.height;
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY
      };
    };

    this.canvas.addEventListener('pointerdown', (e) => {
      this.sound.init();
      if (this.isGameOver || this.isFalling) return;

      const pos = getCanvasPos(e);
      const hit = this.getCellAt(pos.x, pos.y);

      if (hit) {
        this.isDragging = true;
        this.pointer = pos;
        this.chain = [hit];
        hit.selected = true;
        hit.scale = 1.25;
        this.sound.playConnectNote(0);
      }
    });

    window.addEventListener('pointermove', (e) => {
      if (!this.isDragging || this.chain.length === 0) return;

      const pos = getCanvasPos(e);
      this.pointer = pos;

      const hit = this.getCellAt(pos.x, pos.y);
      if (!hit) return;

      const currentTarget = this.chain[this.chain.length - 1];

      // 1. Backtracking: If dragged over previous item, pop the last item off
      if (this.chain.length > 1) {
        const previousItem = this.chain[this.chain.length - 2];
        if (hit.col === previousItem.col && hit.row === previousItem.row) {
          currentTarget.selected = false;
          currentTarget.scale = 1;
          this.chain.pop();
          this.sound.playBacktrack();
          return;
        }
      }

      // 2. Connecting to next valid item
      if (!hit.selected && hit.type === this.chain[0].type) {
        const dx = Math.abs(hit.col - currentTarget.col);
        const dy = Math.abs(hit.row - currentTarget.row);

        // Must be adjacent (horizontal, vertical, or diagonal)
        if (dx <= 1 && dy <= 1 && (dx + dy > 0)) {
          const dist = Math.hypot(hit.x - currentTarget.x, hit.y - currentTarget.y);
          if (dist <= CONNECT_MAX_DIST) {
            hit.selected = true;
            hit.scale = 1.25;
            this.chain.push(hit);
            this.sound.playConnectNote(this.chain.length - 1);
          }
        }
      }
    });

    const onPointerUp = () => {
      if (!this.isDragging) return;
      this.isDragging = false;
      this.pointer = null;

      if (this.chain.length >= 3) {
        this.resolveMatch(this.chain);
      } else {
        // Deselect all items gently
        this.chain.forEach(item => {
          item.selected = false;
          item.scale = 1;
        });
      }
      this.chain = [];
    };

    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);

    // Restart button in modal
    const btnRestart = document.getElementById('btn-restart');
    if (btnRestart) {
      btnRestart.addEventListener('click', () => {
        this.startNewGame();
      });
    }
  }

  getCellAt(px, py) {
    const hitRadius = 26; // Generous 52px diameter circle for buttery selection
    for (let c = 0; c < COLS; c++) {
      for (let r = 0; r < ROWS; r++) {
        const item = this.grid[c][r];
        if (item) {
          const dist = Math.hypot(px - item.x, py - item.y);
          if (dist <= hitRadius) {
            return item;
          }
        }
      }
    }
    return null;
  }

  // --- MATCH & GRAVITY RESOLUTION ---
  resolveMatch(matchedChain) {
    const matchCount = matchedChain.length;
    // Score formula: 10 pts per item + extra bonus for 4+ chains
    const matchScore = matchCount * 10 + (matchCount > 3 ? (matchCount - 3) * 20 : 0);
    this.score += matchScore;
    this.scoreBump = 1.35;

    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem('hw_highscore', this.highScore.toString());
    }

    // Play Sound
    this.sound.playMatchSuccess(matchCount);

    // Spawn Floating Score
    const lastItem = matchedChain[matchedChain.length - 1];
    this.floatingScores.push({
      text: `+${matchScore}`,
      x: lastItem.x,
      y: lastItem.y,
      alpha: 1,
      vy: -1.2
    });

    // Spawn particle explosion for each matched item
    matchedChain.forEach(item => {
      const color = SPRITES.items[item.type].color;
      this.createBurst(item.x, item.y, color);
      this.grid[item.col][item.row] = null; // Clear cell
    });

    // Send score to backend API via ScoreAPI
    ScoreAPI.sendScore(this.score, {
      matchCount,
      matchType: SPRITES.items[matchedChain[0].type].name,
      matchScore
    });

    // Apply gravity and refill grid
    this.applyGravity();
  }

  createBurst(x, y, color) {
    const count = 12;
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5);
      const speed = 2 + Math.random() * 4;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 4 + Math.random() * 4,
        alpha: 1,
        color
      });
    }
  }

  applyGravity() {
    this.isFalling = true;

    // Column by column drop
    for (let c = 0; c < COLS; c++) {
      // 1. Shift existing items down
      let emptyRow = ROWS - 1;
      for (let r = ROWS - 1; r >= 0; r--) {
        if (this.grid[c][r] !== null) {
          if (r !== emptyRow) {
            const item = this.grid[c][r];
            this.grid[c][r] = null;
            item.row = emptyRow;
            item.targetY = GRID_ORIGIN_Y + emptyRow * CELL_STEP_Y;
            this.grid[c][emptyRow] = item;
          }
          emptyRow--;
        }
      }

      // 2. Fill empty spaces from the top with new items
      let spawnOffsetY = 1;
      for (let r = emptyRow; r >= 0; r--) {
        const type = this.getRandomItemType();
        const targetY = GRID_ORIGIN_Y + r * CELL_STEP_Y;
        const startY = GRID_ORIGIN_Y - spawnOffsetY * CELL_STEP_Y;

        this.grid[c][r] = {
          type,
          col: c,
          row: r,
          x: GRID_ORIGIN_X + c * CELL_STEP_X,
          y: startY,
          targetY,
          vy: 0,
          scale: 1,
          selected: false
        };
        spawnOffsetY++;
      }
    }
  }

  triggerGameOver() {
    this.isGameOver = true;
    if (this.timerInterval) clearInterval(this.timerInterval);

    // Final score submission
    ScoreAPI.sendScore(this.score, {
      isFinal: true,
      highScore: this.highScore,
      durationPlayed: GAME_DURATION_SECONDS
    });

    const modal = document.getElementById('game-over-modal');
    const scoreEl = document.getElementById('modal-score');
    const highscoreEl = document.getElementById('modal-highscore');
    if (scoreEl) scoreEl.textContent = this.score.toLocaleString();
    if (highscoreEl) highscoreEl.textContent = `Best: ${this.highScore.toLocaleString()}`;
    if (modal) modal.classList.add('active');

    // Trigger Game Over Controller & Redirect handling
    GameOverController.handleGameOver({
      score: this.score,
      highScore: this.highScore,
      durationPlayed: GAME_DURATION_SECONDS
    });
  }

  // --- UPDATE & ANIMATION ---
  update(dt) {
    let anyStillFalling = false;

    // 1. Update falling items
    for (let c = 0; c < COLS; c++) {
      for (let r = 0; r < ROWS; r++) {
        const item = this.grid[c][r];
        if (item) {
          // Fall animation with acceleration & bounce
          if (item.y < item.targetY) {
            anyStillFalling = true;
            item.vy += 2200 * dt; // gravity
            item.y += item.vy * dt;
            if (item.y >= item.targetY) {
              item.y = item.targetY;
              item.vy = -item.vy * 0.22; // subtle bounce
              if (Math.abs(item.vy) < 40) {
                item.vy = 0;
              }
            }
          }

          // Scale recovery (pulse animation)
          if (item.scale > 1) {
            item.scale = Math.max(1, item.scale - 1.8 * dt);
          }
        }
      }
    }
    this.isFalling = anyStillFalling;

    // 2. Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.12; // particle gravity
      p.alpha -= 0.025;
      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // 3. Update floating scores
    for (let i = this.floatingScores.length - 1; i >= 0; i--) {
      const fs = this.floatingScores[i];
      fs.y += fs.vy;
      fs.alpha -= 0.02;
      if (fs.alpha <= 0) {
        this.floatingScores.splice(i, 1);
      }
    }

    // 4. Update HUD visual animations
    if (this.displayScore < this.score) {
      const diff = this.score - this.displayScore;
      this.displayScore = Math.min(this.score, Math.round(this.displayScore + Math.max(1, diff * 12 * dt)));
    } else if (this.displayScore > this.score) {
      this.displayScore = this.score;
    }

    if (this.scoreBump > 1.0) {
      this.scoreBump = Math.max(1.0, this.scoreBump - 2.0 * dt);
    }

    if (this.timeLeft <= TIME_WARNING_THRESHOLD && !this.isGameOver) {
      this.timeWarningPulse += dt * 6;
    } else {
      this.timeWarningPulse = 0;
    }
  }

  // --- RENDER ENGINE ---
  render() {
    this.ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // 1. Draw Background
    if (this.images.sheet0) {
      const bg = SPRITES.bg;
      this.ctx.drawImage(this.images.sheet0, bg.x, bg.y, bg.w, bg.h, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    } else {
      this.ctx.fillStyle = '#140826';
      this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }

    // 2. Draw HUD (Header, Timer, Score)
    this.renderHUD();

    // 3. Draw Grid Tiles (Boxes)
    if (this.images.sheet1) {
      const box = SPRITES.box;
      for (let c = 0; c < COLS; c++) {
        for (let r = 0; r < ROWS; r++) {
          const bx = GRID_ORIGIN_X + c * CELL_STEP_X;
          const by = GRID_ORIGIN_Y + r * CELL_STEP_Y;
          this.ctx.drawImage(
            this.images.sheet1,
            box.x, box.y, box.w, box.h,
            bx - TILE_DRAW_SIZE / 2,
            by - TILE_DRAW_SIZE / 2,
            TILE_DRAW_SIZE,
            TILE_DRAW_SIZE
          );
        }
      }
    }

    // 4. Draw Connecting Line between selected items
    this.renderConnectorLine();

    // 5. Draw Items
    this.renderItems();

    // 6. Draw Particles & Popups
    this.renderEffects();
  }

  renderHUD() {
    const ctx = this.ctx;
    const isWarning = this.timeLeft <= TIME_WARNING_THRESHOLD && !this.isGameOver;
    const pulseFactor = isWarning ? 0.5 + 0.5 * Math.sin(this.timeWarningPulse) : 0;
    const radius = 16;

    // --- 1. LEFT CARD: TIMER ---
    const tX = 20, tY = 22, tW = 210, tH = 76;
    ctx.save();

    // Card Background Shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 4;

    // Card Fill
    this.drawRoundRect(ctx, tX, tY, tW, tH, radius);
    const tBgGrad = ctx.createLinearGradient(tX, tY, tX, tY + tH);
    tBgGrad.addColorStop(0, isWarning ? 'rgba(48, 12, 28, 0.95)' : 'rgba(32, 14, 52, 0.94)');
    tBgGrad.addColorStop(1, isWarning ? 'rgba(28, 6, 16, 0.98)' : 'rgba(16, 7, 28, 0.98)');
    ctx.fillStyle = tBgGrad;
    ctx.fill();

    // Card Border & Glow
    ctx.shadowOffsetY = 0;
    if (isWarning) {
      ctx.shadowColor = `rgba(255, 23, 68, ${0.4 + 0.5 * pulseFactor})`;
      ctx.shadowBlur = 10 + 6 * pulseFactor;
      ctx.strokeStyle = `rgba(255, ${Math.round(23 + 40 * pulseFactor)}, 68, 0.95)`;
    } else {
      ctx.shadowColor = 'rgba(255, 152, 0, 0.25)';
      ctx.shadowBlur = 6;
      const tBorderGrad = ctx.createLinearGradient(tX, tY, tX + tW, tY + tH);
      tBorderGrad.addColorStop(0, '#ff9800');
      tBorderGrad.addColorStop(0.5, '#ab47bc');
      tBorderGrad.addColorStop(1, '#ff9800');
      ctx.strokeStyle = tBorderGrad;
    }
    ctx.lineWidth = 2;
    ctx.stroke();

    // Subtle Glass Highlight on top rim
    ctx.beginPath();
    ctx.moveTo(tX + radius, tY + 1);
    ctx.lineTo(tX + tW - radius, tY + 1);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.restore();

    // Clock Emblem
    this.drawClockIcon(ctx, tX + 28, tY + 38, 16, isWarning);

    // Time Label
    ctx.font = '700 11px Fredoka, cursive, sans-serif';
    ctx.fillStyle = isWarning ? '#ff8a80' : '#ffb74d';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('TIME LEFT', tX + 54, tY + 24);

    // Time Value (MM:SS)
    const mins = Math.floor(this.timeLeft / 60);
    const secs = this.timeLeft % 60;
    const timeStr = `${mins}:${secs < 10 ? '0' : ''}${secs}`;

    ctx.font = '700 24px Fredoka, cursive, sans-serif';
    ctx.fillStyle = isWarning ? '#ff5252' : '#ffffff';
    ctx.shadowColor = isWarning ? 'rgba(255, 23, 68, 0.6)' : 'rgba(0, 0, 0, 0.6)';
    ctx.shadowBlur = isWarning ? 8 : 4;
    ctx.fillText(timeStr, tX + 54, tY + 47);
    ctx.shadowBlur = 0;

    // Time Progress Bar
    const barX = tX + 54;
    const barY = tY + 62;
    const barW = tW - 68;
    const barH = 5;
    const progress = Math.max(0, Math.min(1, this.timeLeft / GAME_DURATION_SECONDS));

    // Bar Track
    this.drawRoundRect(ctx, barX, barY, barW, barH, 2.5);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.fill();

    // Bar Fill
    if (progress > 0) {
      const fillW = Math.max(barH, barW * progress);
      this.drawRoundRect(ctx, barX, barY, fillW, barH, 2.5);
      const barGrad = ctx.createLinearGradient(barX, barY, barX + fillW, barY);
      if (isWarning) {
        barGrad.addColorStop(0, '#ff1744');
        barGrad.addColorStop(1, '#ff5252');
      } else {
        barGrad.addColorStop(0, '#ff9800');
        barGrad.addColorStop(1, '#ffd54f');
      }
      ctx.fillStyle = barGrad;
      ctx.fill();
    }

    // --- 2. RIGHT CARD: SCORE ---
    const sX = 250, sY = 22, sW = 210, sH = 76;
    ctx.save();

    // Card Background Shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 4;

    // Card Fill
    this.drawRoundRect(ctx, sX, sY, sW, sH, radius);
    const sBgGrad = ctx.createLinearGradient(sX, sY, sX, sY + sH);
    sBgGrad.addColorStop(0, 'rgba(32, 14, 52, 0.94)');
    sBgGrad.addColorStop(1, 'rgba(16, 7, 28, 0.98)');
    ctx.fillStyle = sBgGrad;
    ctx.fill();

    // Card Border & Glow
    ctx.shadowOffsetY = 0;
    ctx.shadowColor = 'rgba(255, 213, 79, 0.3)';
    ctx.shadowBlur = 8;
    const sBorderGrad = ctx.createLinearGradient(sX, sY, sX + sW, sY + sH);
    sBorderGrad.addColorStop(0, '#ffd54f');
    sBorderGrad.addColorStop(0.5, '#ff9800');
    sBorderGrad.addColorStop(1, '#ffd54f');
    ctx.strokeStyle = sBorderGrad;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Subtle Glass Highlight on top rim
    ctx.beginPath();
    ctx.moveTo(sX + radius, sY + 1);
    ctx.lineTo(sX + sW - radius, sY + 1);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.restore();

    // Star Emblem
    this.drawStarIcon(ctx, sX + 28, sY + 38, 5, 14, 6.5);

    // Score Label
    ctx.font = '700 11px Fredoka, cursive, sans-serif';
    ctx.fillStyle = '#ffca28';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('SCORE', sX + 54, tY + 24);

    // Best Score Pill (Top Right of Score Card)
    ctx.font = '600 10px Fredoka, cursive, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.textAlign = 'right';
    ctx.fillText(`BEST: ${this.highScore.toLocaleString()}`, sX + sW - 14, tY + 24);

    // Animated Score Text with Bump/Pop
    const displayScoreVal = Math.round(this.displayScore);
    const scoreStr = displayScoreVal.toLocaleString();

    ctx.save();
    ctx.translate(sX + 54, sY + 49);
    if (this.scoreBump > 1.0) {
      ctx.scale(this.scoreBump, this.scoreBump);
    }
    ctx.font = '700 24px Fredoka, cursive, sans-serif';
    ctx.fillStyle = '#ffeb3b';
    ctx.shadowColor = 'rgba(255, 171, 0, 0.65)';
    ctx.shadowBlur = 6;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(scoreStr, 0, 0);
    ctx.restore();
  }

  drawRoundRect(ctx, x, y, w, h, r) {
    if (ctx.roundRect) {
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, r);
      return;
    }
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  drawClockIcon(ctx, cx, cy, r, isWarning) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = isWarning ? 'rgba(255, 23, 68, 0.22)' : 'rgba(255, 167, 38, 0.18)';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = isWarning ? '#ff5252' : '#ffa726';
    ctx.stroke();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(-Math.PI / 6) * (r * 0.52), cy + Math.sin(-Math.PI / 6) * (r * 0.52));
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx, cy - r * 0.68);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx, cy, 2, 0, Math.PI * 2);
    ctx.fillStyle = isWarning ? '#ff8a80' : '#ffd54f';
    ctx.fill();
    ctx.restore();
  }

  drawStarIcon(ctx, cx, cy, spikes, outerRadius, innerRadius) {
    ctx.save();
    let rot = (Math.PI / 2) * 3;
    const step = Math.PI / spikes;

    ctx.shadowColor = 'rgba(255, 215, 0, 0.6)';
    ctx.shadowBlur = 6;

    ctx.beginPath();
    ctx.moveTo(cx, cy - outerRadius);
    for (let i = 0; i < spikes; i++) {
      let x = cx + Math.cos(rot) * outerRadius;
      let y = cy + Math.sin(rot) * outerRadius;
      ctx.lineTo(x, y);
      rot += step;

      x = cx + Math.cos(rot) * innerRadius;
      y = cy + Math.sin(rot) * innerRadius;
      ctx.lineTo(x, y);
      rot += step;
    }
    ctx.lineTo(cx, cy - outerRadius);
    ctx.closePath();

    const starGrad = ctx.createLinearGradient(cx, cy - outerRadius, cx, cy + outerRadius);
    starGrad.addColorStop(0, '#fff59d');
    starGrad.addColorStop(1, '#ffb300');
    ctx.fillStyle = starGrad;
    ctx.fill();

    ctx.lineWidth = 1;
    ctx.strokeStyle = '#ffe082';
    ctx.stroke();
    ctx.restore();
  }

  renderConnectorLine() {
    if (this.chain.length === 0) return;

    this.ctx.save();
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';

    const color = SPRITES.items[this.chain[0].type].color || '#ff9800';

    // Outer Glow
    this.ctx.strokeStyle = color;
    this.ctx.shadowColor = color;
    this.ctx.shadowBlur = 14;
    this.ctx.lineWidth = 14;

    this.ctx.beginPath();
    this.ctx.moveTo(this.chain[0].x, this.chain[0].y);
    for (let i = 1; i < this.chain.length; i++) {
      this.ctx.lineTo(this.chain[i].x, this.chain[i].y);
    }
    if (this.pointer) {
      this.ctx.lineTo(this.pointer.x, this.pointer.y);
    }
    this.ctx.stroke();

    // Inner bright core
    this.ctx.shadowBlur = 0;
    this.ctx.strokeStyle = '#ffffff';
    this.ctx.lineWidth = 5;
    this.ctx.stroke();

    this.ctx.restore();
  }

  renderItems() {
    const s1 = this.images.sheet1;
    if (!s1) return;

    for (let c = 0; c < COLS; c++) {
      for (let r = 0; r < ROWS; r++) {
        const item = this.grid[c][r];
        if (item) {
          const sprite = SPRITES.items[item.type];
          const size = ITEM_DRAW_SIZE * item.scale;

          this.ctx.save();
          this.ctx.translate(item.x, item.y);

          // Selected Item Glow Ring
          if (item.selected) {
            this.ctx.beginPath();
            this.ctx.arc(0, 0, size * 0.58, 0, Math.PI * 2);
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
            this.ctx.fill();
            this.ctx.lineWidth = 3;
            this.ctx.strokeStyle = sprite.color;
            this.ctx.stroke();
          }

          this.ctx.drawImage(
            s1,
            sprite.x, sprite.y, sprite.w, sprite.h,
            -size / 2, -size / 2, size, size
          );
          this.ctx.restore();
        }
      }
    }
  }

  renderEffects() {
    // 1. Particles
    this.particles.forEach(p => {
      this.ctx.save();
      this.ctx.globalAlpha = Math.max(0, p.alpha);
      this.ctx.fillStyle = p.color;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
    });

    // 2. Floating Scores
    this.floatingScores.forEach(fs => {
      this.ctx.save();
      this.ctx.globalAlpha = Math.max(0, fs.alpha);
      this.ctx.font = 'bold 26px Fredoka, cursive, sans-serif';
      this.ctx.fillStyle = '#ffea00';
      this.ctx.textAlign = 'center';
      this.ctx.shadowColor = '#000000';
      this.ctx.shadowBlur = 6;
      this.ctx.fillText(fs.text, fs.x, fs.y);
      this.ctx.restore();
    });
  }

  gameLoop(currentTime) {
    const dt = Math.min((currentTime - this.lastTime) / 1000, 0.1);
    this.lastTime = currentTime;

    if (this.assetsLoaded) {
      this.update(dt);
      this.render();
    }

    requestAnimationFrame((t) => this.gameLoop(t));
  }
}

// Start Game Instance
window.addEventListener('DOMContentLoaded', () => {
  window.halloweenGame = new HalloweenGame();
});
