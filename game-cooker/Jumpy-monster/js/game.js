/**
 * game.js - Main game engine orchestrating game loop, HUD, timers,
 * state machine, high score, and first-time swipe tutorial.
 * Virtual Resolution: 1080 x 1920 (Mobile Portrait HD)
 */
import { Assets } from './assets.js';
import { Audio } from './audio.js';
import { InputManager } from './input.js';
import { Player, PlayerState } from './player.js';
import { GridManager } from './grid.js';

export const GameState = {
  LOADING: 'LOADING',
  MENU: 'MENU',
  PLAYING: 'PLAYING',
  GAMEOVER: 'GAMEOVER'
};

class Game {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');

    // Virtual resolution (1080 x 1920 mobile portrait)
    this.virtualWidth = 1080;
    this.virtualHeight = 1920;

    this.state = GameState.LOADING;
    this.score = 0;
    this.highScore = parseInt(localStorage.getItem('frogie_high_score') || '0', 10);
    this.timeLeft = 30.0;
    this.totalTime = 30.0;

    // First time tutorial flag
    this.isFirstTimePlayer = !localStorage.getItem('frogie_has_played');

    // Timing
    this.lastTime = performance.now();
    this.elapsedTime = 0;

    // Subsystems
    this.player = null;
    this.grid = null;
    this.input = null;

    // Floating score popup texts
    this.popups = [];

    // Screen shake
    this.shakeIntensity = 0;

    // DOM Elements
    this.hudEl = document.getElementById('hud');
    this.scoreEl = document.getElementById('hudScore');
    this.timerEl = document.getElementById('hudTimer');
    this.timerBarEl = document.getElementById('timerBar');
    this.menuOverlay = document.getElementById('menuOverlay');
    this.gameoverOverlay = document.getElementById('gameoverOverlay');
    this.finalScoreEl = document.getElementById('finalScore');
    this.bestScoreEl = document.getElementById('bestScore');
    this.tutorialOverlay = document.getElementById('tutorialOverlay');

    this.init();
  }

  init() {
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());

    // Center coordinates for 1080x1920 virtual space
    const centerX = this.virtualWidth / 2;
    const centerY = 880;

    this.player = new Player(centerX, centerY);
    this.grid = new GridManager(centerX, centerY);

    this.input = new InputManager(this.canvas, (dirX, dirY) => {
      this.handlePlayerJump(dirX, dirY);
    });

    // Bind on-screen 4-Arrow D-Pad buttons
    this.input.bindDpadButtons({
      up: document.getElementById('btnUp'),
      down: document.getElementById('btnDown'),
      left: document.getElementById('btnLeft'),
      right: document.getElementById('btnRight')
    });

    // First-time tutorial dismiss handler
    this.input.onFirstAction = () => {
      if (this.isFirstTimePlayer) {
        this.dismissTutorial();
      }
    };

    // UI Buttons
    document.getElementById('startBtn').addEventListener('click', () => {
      Audio.init();
      Audio.playClick();
      this.startGame();
    });

    document.getElementById('restartBtn').addEventListener('click', () => {
      Audio.init();
      Audio.playClick();
      this.startGame();
    });

    document.getElementById('muteBtn').addEventListener('click', (e) => {
      const isMuted = Audio.toggleMute();
      e.currentTarget.textContent = isMuted ? '🔇' : '🔊';
    });

    // Start loading assets
    const loadBar = document.getElementById('loadingBar');
    Assets.loadAll(
      (loaded, total) => {
        if (loadBar) {
          loadBar.style.width = `${Math.floor((loaded / total) * 100)}%`;
        }
      },
      () => {
        document.getElementById('loadingOverlay').classList.add('hidden');
        this.state = GameState.MENU;
        this.menuOverlay.classList.remove('hidden');
      }
    );

    // Start 60 FPS engine loop
    requestAnimationFrame((t) => this.loop(t));
  }

  resizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    this.canvas.width = windowWidth * dpr;
    this.canvas.height = windowHeight * dpr;

    // Scale so 1080 x 1920 is fully visible and aspect ratio is maintained
    const scaleX = (windowWidth * dpr) / this.virtualWidth;
    const scaleY = (windowHeight * dpr) / this.virtualHeight;
    this.scale = Math.min(scaleX, scaleY);

    // Center in screen
    this.offsetX = (this.canvas.width - this.virtualWidth * this.scale) / 2;
    this.offsetY = (this.canvas.height - this.virtualHeight * this.scale) / 2;
  }

  startGame() {
    this.score = 0;
    this.timeLeft = 30.0;
    this.totalTime = 30.0;
    this.state = GameState.PLAYING;
    this.popups = [];
    this.shakeIntensity = 0;

    const centerX = this.virtualWidth / 2;
    const centerY = 880;

    this.player.reset(centerX, centerY);
    this.grid.reset();
    this.input.setEnabled(true);

    this.updateHUD();
    this.hudEl.classList.remove('hidden');
    this.menuOverlay.classList.add('hidden');
    this.gameoverOverlay.classList.add('hidden');

    // Check if new player -> display animated swipe tutorial
    if (this.isFirstTimePlayer) {
      this.tutorialOverlay.classList.remove('hidden');
    } else {
      this.tutorialOverlay.classList.add('hidden');
    }
  }

  dismissTutorial() {
    this.isFirstTimePlayer = false;
    localStorage.setItem('frogie_has_played', 'true');
    this.tutorialOverlay.classList.add('fade-out');
    setTimeout(() => {
      this.tutorialOverlay.classList.add('hidden');
      this.tutorialOverlay.classList.remove('fade-out');
    }, 400);
  }

  handlePlayerJump(dirX, dirY) {
    if (this.state !== GameState.PLAYING) return;
    if (this.player.state !== PlayerState.IDLE && this.player.state !== PlayerState.LANDING) return;

    if (this.isFirstTimePlayer) {
      this.dismissTutorial();
    }

    // Launch player jump
    this.player.startJump(dirX, dirY, this.grid.offsetX, this.grid.offsetY);

    // Check grid destination
    const res = this.grid.handleJump(dirX, dirY, this.score);

    if (res.result === 'FALL') {
      // Void / Water fall
      setTimeout(() => {
        this.player.triggerFall();
        this.shake(10);
        setTimeout(() => this.triggerGameOver(), 700);
      }, this.player.jumpDuration * 550);
    } else if (res.result === 'DEADLY') {
      // Deadly trap
      setTimeout(() => {
        this.player.triggerDeadly();
        this.shake(20);
        setTimeout(() => this.triggerGameOver(), 700);
      }, this.player.jumpDuration * 550);
    } else if (res.result === 'SAFE') {
      // Safe landing on floating log!
      setTimeout(() => {
        this.player.triggerLand();
        this.score += 1;
        this.addPopup('+1', this.player.x, this.player.y - 60, '#4bfe81');

        if (res.hadBonus) {
          this.score += res.bonusScore;
          this.timeLeft = Math.min(60, this.timeLeft + res.bonusTime);
          this.addPopup(`+${res.bonusScore} BONUS!`, this.player.x, this.player.y - 105, '#ffd700');
          this.addPopup(`+${res.bonusTime}s TIME!`, this.player.x, this.player.y - 150, '#00e5ff');
        }

        this.updateHUD();
      }, this.player.jumpDuration * 1000);
    }
  }

  addPopup(text, x, y, color) {
    this.popups.push({
      text,
      x,
      y,
      alpha: 1,
      vy: -80,
      color,
      life: 0.85
    });
  }

  shake(intensity) {
    this.shakeIntensity = intensity;
  }

  updateHUD() {
    this.scoreEl.textContent = String(this.score).padStart(4, '0');
    const seconds = Math.max(0, Math.ceil(this.timeLeft));
    this.timerEl.textContent = `00:${String(seconds).padStart(2, '0')}`;

    // Update timer bar percentage
    const pct = Math.max(0, Math.min(100, (this.timeLeft / this.totalTime) * 100));
    this.timerBarEl.style.width = `${pct}%`;

    // Visual warning when time < 10s
    if (this.timeLeft <= 10) {
      this.timerEl.classList.add('urgent');
      this.timerBarEl.classList.add('urgent');
    } else {
      this.timerEl.classList.remove('urgent');
      this.timerBarEl.classList.remove('urgent');
    }
  }

  triggerGameOver() {
    this.state = GameState.GAMEOVER;
    this.input.setEnabled(false);
    Audio.playGameOver();

    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem('frogie_high_score', this.highScore);
    }

    this.finalScoreEl.textContent = this.score;
    this.bestScoreEl.textContent = this.highScore;

    this.hudEl.classList.add('hidden');
    this.gameoverOverlay.classList.remove('hidden');
  }

  update(dt) {
    this.elapsedTime += dt;

    if (this.state === GameState.PLAYING) {
      // Countdown timer
      this.timeLeft -= dt;
      this.updateHUD();

      if (this.timeLeft <= 0) {
        this.timeLeft = 0;
        this.player.triggerDeadly();
        this.triggerGameOver();
      }
    }

    // Screen shake decay
    if (this.shakeIntensity > 0) {
      this.shakeIntensity = Math.max(0, this.shakeIntensity - dt * 25);
    }

    // Update player and grid
    this.player.update(dt);
    this.grid.update(dt, this.elapsedTime);

    // Update popups
    for (let i = this.popups.length - 1; i >= 0; i--) {
      const p = this.popups[i];
      p.y += p.vy * dt;
      p.alpha -= dt / p.life;
      if (p.alpha <= 0) {
        this.popups.splice(i, 1);
      }
    }
  }

  render() {
    this.ctx.save();
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Screen Shake offset
    let shakeX = 0;
    let shakeY = 0;
    if (this.shakeIntensity > 0) {
      shakeX = (Math.random() - 0.5) * this.shakeIntensity * 2;
      shakeY = (Math.random() - 0.5) * this.shakeIntensity * 2;
    }

    // Apply virtual coordinate scale & centering for 1080 x 1920
    this.ctx.translate(this.offsetX + shakeX, this.offsetY + shakeY);
    this.ctx.scale(this.scale, this.scale);

    // 1. Render Grid & Environment (Flowing Water + Floating Wood Platforms)
    this.grid.render(this.ctx, this.elapsedTime);

    // 2. Render Player (Frogie on top of Wood)
    this.player.render(this.ctx);

    // 3. Render Floating Score Popups
    this.popups.forEach((p) => {
      this.ctx.save();
      this.ctx.globalAlpha = p.alpha;
      this.ctx.fillStyle = p.color;
      this.ctx.shadowColor = p.color;
      this.ctx.shadowBlur = 14;
      this.ctx.font = 'bold 38px sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(p.text, p.x, p.y);
      this.ctx.restore();
    });

    this.ctx.restore();
  }

  loop(timestamp) {
    const dt = Math.min(0.1, (timestamp - this.lastTime) / 1000);
    this.lastTime = timestamp;

    this.update(dt);
    this.render();

    requestAnimationFrame((t) => this.loop(t));
  }
}

// Instantiate game when DOM is loaded
window.addEventListener('DOMContentLoaded', () => {
  new Game();
});
