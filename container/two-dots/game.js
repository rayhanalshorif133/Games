/**
 * Two Dots 2.0 - Neon Edition
 * High-performance HTML5 Canvas & Vanilla JavaScript Game
 */

import { sendScore } from './sendscore.js';
import { handleGameOverRedirect } from './gameover.js';

// ==========================================
// 1. SOUND SYNTHESIZER (Web Audio API)
// ==========================================
class SoundSynth {
  constructor() {
    this.ctx = null;
    this.muted = localStorage.getItem('two_dots_muted') === 'true';
    this.pentatonic = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25, 783.99];
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

  toggleMute() {
    this.muted = !this.muted;
    localStorage.setItem('two_dots_muted', this.muted);
    return this.muted;
  }

  // Melodic Hit Sound
  playHit(combo = 0) {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      const noteIdx = Math.min(combo, this.pentatonic.length - 1);
      const freq = this.pentatonic[noteIdx];

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.5, now + 0.12);

      gain.gain.setValueAtTime(0.28, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.22);
    } catch (e) {}
  }

  // Whoosh / Swap Sound
  playSwap() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.exponentialRampToValueAtTime(220, now + 0.08);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.09);
    } catch (e) {}
  }

  // Power-up Collected Sound
  playPowerUp() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const freqs = [330, 440, 554, 659];
      freqs.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const startTime = now + idx * 0.05;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0.2, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.18);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.19);
      });
    } catch (e) {}
  }

  // Shield Broken Sound
  playShieldBreak() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(150, now + 0.25);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.26);
    } catch (e) {}
  }

  // Life Lost / Damage Sound
  playLifeLost() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(90, now + 0.28);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.29);
    } catch (e) {}
  }

  // Overdrive / Hard Mode Surge Sound
  playOverdrive() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(240, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.42);

      gain.gain.setValueAtTime(0.26, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.46);
    } catch (e) {}
  }

  // Game Over Sound
  playGameOver() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      // Sub boom
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.exponentialRampToValueAtTime(30, now + 0.5);

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.51);
    } catch (e) {}
  }

  // Countdown Beep / Start Chime
  playCountdown(isStart = false) {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      if (!isStart) {
        // Regular countdown tick (READY, 3, 2, 1)
        osc.type = 'sine';
        osc.frequency.setValueAtTime(480, now);
        osc.frequency.exponentialRampToValueAtTime(560, now + 0.08);

        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.11);
      } else {
        // High energetic start chime (START!)
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.exponentialRampToValueAtTime(1320, now + 0.22);

        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.26);
      }
    } catch (e) {}
  }
}

// ==========================================
// 2. PARTICLE & FX SYSTEM
// ==========================================
class ParticleSystem {
  constructor() {
    this.sparks = [];
    this.rings = [];
    this.shards = [];
    this.floatingTexts = [];
    this.confetti = [];
  }

  addSparks(x, y, color, count = 18) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 6;
      this.sparks.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 2.5 + Math.random() * 3.5,
        color,
        alpha: 1,
        decay: 0.02 + Math.random() * 0.03
      });
    }
  }

  addRing(x, y, color) {
    this.rings.push({
      x,
      y,
      radius: 12,
      maxRadius: 65,
      color,
      alpha: 1,
      speed: 3
    });
  }

  addShards(x, y, color1, color2, count = 35) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 3 + Math.random() * 8;
      this.shards.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 4 + Math.random() * 6,
        color: Math.random() > 0.5 ? color1 : color2,
        angle: Math.random() * Math.PI,
        vRot: (Math.random() - 0.5) * 0.3,
        alpha: 1,
        decay: 0.015 + Math.random() * 0.02
      });
    }
  }

  addFloatingText(x, y, text, color = '#ffe600') {
    this.floatingTexts.push({
      x,
      y,
      text,
      color,
      alpha: 1,
      vy: -2,
      scale: 1.2
    });
  }

  addConfetti(w, h, count = 50) {
    const colors = ['#00f5ff', '#ff007f', '#ffe600', '#00ff88', '#ffffff'];
    for (let i = 0; i < count; i++) {
      this.confetti.push({
        x: Math.random() * w,
        y: -10 - Math.random() * 40,
        vx: (Math.random() - 0.5) * 4,
        vy: 2 + Math.random() * 4,
        size: 6 + Math.random() * 6,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.2,
        alpha: 1
      });
    }
  }

  update() {
    // Sparks
    for (let i = this.sparks.length - 1; i >= 0; i--) {
      const p = this.sparks[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.96;
      p.vy *= 0.96;
      p.alpha -= p.decay;
      if (p.alpha <= 0) this.sparks.splice(i, 1);
    }

    // Rings
    for (let i = this.rings.length - 1; i >= 0; i--) {
      const r = this.rings[i];
      r.radius += r.speed;
      r.alpha = Math.max(0, 1 - (r.radius / r.maxRadius));
      if (r.radius >= r.maxRadius || r.alpha <= 0) this.rings.splice(i, 1);
    }

    // Shards
    for (let i = this.shards.length - 1; i >= 0; i--) {
      const s = this.shards[i];
      s.x += s.vx;
      s.y += s.vy;
      s.vy += 0.15; // Gravity
      s.angle += s.vRot;
      s.alpha -= s.decay;
      if (s.alpha <= 0) this.shards.splice(i, 1);
    }

    // Floating text
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const t = this.floatingTexts[i];
      t.y += t.vy;
      t.alpha -= 0.02;
      t.scale = Math.max(1, t.scale - 0.01);
      if (t.alpha <= 0) this.floatingTexts.splice(i, 1);
    }

    // Confetti
    for (let i = this.confetti.length - 1; i >= 0; i--) {
      const c = this.confetti[i];
      c.x += c.vx;
      c.y += c.vy;
      c.rotation += c.vRot;
      c.alpha -= 0.005;
      if (c.alpha <= 0 || c.y > window.innerHeight) this.confetti.splice(i, 1);
    }
  }

  draw(ctx) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    // Sparks
    for (const p of this.sparks) {
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.shadowBlur = 8;
      ctx.shadowColor = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }

    // Rings
    for (const r of this.rings) {
      ctx.globalAlpha = r.alpha;
      ctx.strokeStyle = r.color;
      ctx.lineWidth = 3;
      ctx.shadowBlur = 12;
      ctx.shadowColor = r.color;
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Shards
    for (const s of this.shards) {
      ctx.globalAlpha = s.alpha;
      ctx.fillStyle = s.color;
      ctx.shadowBlur = 8;
      ctx.shadowColor = s.color;
      ctx.save();
      ctx.translate(s.x, s.y);
      ctx.rotate(s.angle);
      ctx.fillRect(-s.size / 2, -s.size / 2, s.size, s.size);
      ctx.restore();
    }

    // Confetti
    for (const c of this.confetti) {
      ctx.globalAlpha = c.alpha;
      ctx.fillStyle = c.color;
      ctx.save();
      ctx.translate(c.x, c.y);
      ctx.rotate(c.rotation);
      ctx.fillRect(-c.size / 2, -c.size / 2, c.size, c.size * 0.6);
      ctx.restore();
    }

    ctx.restore();

    // Floating Texts
    ctx.save();
    for (const t of this.floatingTexts) {
      ctx.globalAlpha = Math.max(0, t.alpha);
      ctx.font = `900 ${Math.floor(18 * t.scale)}px 'Orbitron', sans-serif`;
      ctx.fillStyle = t.color;
      ctx.textAlign = 'center';
      ctx.shadowBlur = 10;
      ctx.shadowColor = t.color;
      ctx.fillText(t.text, t.x, t.y);
    }
    ctx.restore();
  }

  reset() {
    this.sparks = [];
    this.rings = [];
    this.shards = [];
    this.floatingTexts = [];
    this.confetti = [];
  }
}

// ==========================================
// 3. DOT PAIR ENTITY (Top & Bottom Targets)
// ==========================================
class DotPair {
  constructor(y, radius, spacing, isTop = true) {
    this.y = y;
    this.radius = radius;
    this.spacing = spacing;
    this.isTop = isTop;

    // Angle of rotation (0 = Cyan left, Pink right; Math.PI = Pink left, Cyan right)
    // To position one dot at Center and one at Side:
    // Center is (centerX). When state is 0: Cyan is center, Pink is offset.
    // When state is 1: Pink is center, Cyan is offset.
    this.state = 0; // 0 or 1
    this.animProgress = 1; // 0 to 1 smooth spring
    this.animDuration = 0.16; // 160ms responsive swap
    this.animTimer = 0.16;

    this.color1 = '#00f5ff'; // Cyan
    this.color2 = '#ff007f'; // Pink
  }

  swap() {
    this.state = 1 - this.state;
    this.animProgress = 0;
    this.animTimer = 0;
  }

  update(dt) {
    if (this.animProgress < 1) {
      this.animTimer += dt;
      this.animProgress = Math.min(1, this.animTimer / this.animDuration);
    }
  }

  // Returns the color of the dot currently sitting in the center path
  getCenterDotColor() {
    return this.state === 0 ? this.color1 : this.color2;
  }

  draw(ctx, centerX) {
    ctx.save();

    // Spring interpolation: easeOutBack
    const t = this.animProgress;
    const c1 = 1.70158;
    const c3 = c1 + 1;
    const ease = 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);

    // Current interpolation between state 0 and 1
    // In state 0: Dot1 X = centerX, Dot2 X = centerX + spacing (or -spacing)
    // In state 1: Dot1 X = centerX - spacing, Dot2 X = centerX
    const dir = this.isTop ? 1 : -1;
    const targetOffset1 = this.state === 0 ? 0 : -this.spacing * dir;
    const targetOffset2 = this.state === 0 ? this.spacing * dir : 0;

    const prevOffset1 = this.state === 0 ? -this.spacing * dir : 0;
    const prevOffset2 = this.state === 0 ? 0 : this.spacing * dir;

    const curOffset1 = prevOffset1 + (targetOffset1 - prevOffset1) * ease;
    const curOffset2 = prevOffset2 + (targetOffset2 - prevOffset2) * ease;

    const x1 = centerX + curOffset1;
    const x2 = centerX + curOffset2;

    // Draw Dot 1 (Cyan)
    this.renderDot(ctx, x1, this.y, this.radius, this.color1);

    // Draw Dot 2 (Pink)
    this.renderDot(ctx, x2, this.y, this.radius, this.color2);

    ctx.restore();
  }

  renderDot(ctx, x, y, r, color) {
    ctx.save();
    ctx.shadowBlur = 18;
    ctx.shadowColor = color;
    ctx.fillStyle = color;

    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();

    // Inner bright core
    ctx.fillStyle = '#ffffff';
    ctx.shadowBlur = 6;
    ctx.shadowColor = '#ffffff';
    ctx.beginPath();
    ctx.arc(x, y, r * 0.42, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

// ==========================================
// 4. BOUNCING BALL ENTITY (Runner)
// ==========================================
class BouncingBall {
  constructor(x, y, radius) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.baseSpeed = 290; // px/sec (Easy, enjoyable initial speed)
    this.speed = this.baseSpeed;
    this.direction = 1; // 1 = down, -1 = up

    this.colors = ['#00f5ff', '#ff007f'];
    this.color = this.colors[Math.floor(Math.random() * this.colors.length)];

    this.trail = [];
    this.maxTrail = 14;

    this.isRainbow = false;
    this.rainbowTimer = 0;
  }

  setRainbow(duration = 4) {
    this.isRainbow = true;
    this.rainbowTimer = duration;
  }

  update(dt, speedMultiplier = 1) {
    const effectiveSpeed = this.speed * (this.isSlowMo ? 0.6 : 1) * speedMultiplier;
    this.y += this.direction * effectiveSpeed * dt;

    // Record trail
    this.trail.unshift({ x: this.x, y: this.y, color: this.getColor() });
    if (this.trail.length > this.maxTrail) {
      this.trail.pop();
    }

    // Rainbow timer
    if (this.isRainbow) {
      this.rainbowTimer -= dt;
      if (this.rainbowTimer <= 0) {
        this.isRainbow = false;
        this.color = this.colors[Math.floor(Math.random() * this.colors.length)];
      }
    }
  }

  getColor() {
    if (this.isRainbow) {
      const hue = (Date.now() / 4) % 360;
      return `hsl(${hue}, 100%, 65%)`;
    }
    return this.color;
  }

  pickNextColor() {
    if (this.isRainbow) return;
    // 50/50 randomized color
    this.color = Math.random() > 0.5 ? this.colors[0] : this.colors[1];
  }

  draw(ctx) {
    ctx.save();

    // Draw Neon Ribbon Trail
    if (this.trail.length > 1) {
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < this.trail.length - 1; i++) {
        const p1 = this.trail[i];
        const p2 = this.trail[i + 1];
        const ratio = 1 - (i / this.trail.length);

        ctx.strokeStyle = p1.color;
        ctx.lineWidth = this.radius * 1.6 * ratio;
        ctx.globalAlpha = ratio * 0.6;
        ctx.shadowBlur = 12 * ratio;
        ctx.shadowColor = p1.color;

        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      }
    }

    // Draw Core Ball
    const currentColor = this.getColor();
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 24;
    ctx.shadowColor = currentColor;
    ctx.fillStyle = currentColor;

    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();

    // Inner bright center
    ctx.fillStyle = '#ffffff';
    ctx.shadowBlur = 8;
    ctx.shadowColor = '#ffffff';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius * 0.45, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

// ==========================================
// 5. POWER-UP ITEM ENTITY
// ==========================================
class PowerUp {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.radius = 18;
    this.type = type; // 'shield', 'slowmo', 'rainbow'
    this.collected = false;
    this.angle = 0;
  }

  update(dt) {
    this.angle += dt * 3;
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);

    let color = '#00f5ff';
    let icon = '🛡️';
    if (this.type === 'slowmo') {
      color = '#ffe600';
      icon = '⏱️';
    } else if (this.type === 'rainbow') {
      color = '#ff007f';
      icon = '🌈';
    }

    // Pulsing Aura Ring
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.shadowBlur = 15;
    ctx.shadowColor = color;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.stroke();

    // Inner glow
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.beginPath();
    ctx.arc(0, 0, this.radius * 0.8, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // Emoji icon in center
    ctx.save();
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(icon, this.x, this.y);
    ctx.restore();
  }
}

// ==========================================
// 6. TWO DOTS 2.0 MAIN GAME ENGINE
// ==========================================
class TwoDotsGame {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');

    this.sound = new SoundSynth();
    this.particles = new ParticleSystem();

    // State: 'MENU', 'PLAYING', 'GAMEOVER', 'PAUSED'
    this.state = 'MENU';

    this.score = 0;
    this.highScore = parseInt(localStorage.getItem('two_dots_highscore') || '0', 10);
    this.combo = 0;
    this.maxCombo = 0;

    // Power-up States
    this.hasShield = false;
    this.slowMoTimer = 0;

    // 3 Lives System
    this.lives = 3;
    this.maxLives = 3;
    this.invulnerableTimer = 0;

    // Dynamic Difficulty Progression (Random 45s - 100s)
    this.elapsedTime = 0;
    this.hardModeThreshold = 45 + Math.random() * 55;
    this.isHardMode = false;

    this.powerUps = [];
    this.nextPowerUpScore = 7;

    // Screen Shake
    this.shakeIntensity = 0;
    this.shakeDuration = 0;

    // Ambient Starfield
    this.stars = [];
    this.createStars(40);

    // Setup DOM Elements
    this.hudScore = document.getElementById('hud-score');
    this.hudLives = document.querySelectorAll('#hud-lives .life-heart');
    this.comboBadge = document.getElementById('combo-badge');
    this.overdriveBanner = document.getElementById('overdrive-banner');
    this.powerupBar = document.getElementById('powerup-bar');
    this.tapHint = document.getElementById('tap-hint');
    this.menuModal = document.getElementById('menu-modal');
    this.gameOverModal = document.getElementById('game-over-modal');
    this.pauseModal = document.getElementById('pause-modal');
    this.finalScoreEl = document.getElementById('final-score');
    this.bestScoreEl = document.getElementById('best-score');
    this.survivedTimeEl = document.getElementById('survived-time');
    this.maxComboEl = document.getElementById('max-combo');
    this.newRecordBadge = document.getElementById('new-record-badge');
    this.btnSound = document.getElementById('btn-sound');
    this.btnPause = document.getElementById('btn-pause');
    this.btnPlay = document.getElementById('btn-play');
    this.btnRetry = document.getElementById('btn-retry');
    this.btnResume = document.getElementById('btn-resume');

    // Countdown Overlay Elements
    this.countdownOverlay = document.getElementById('countdown-overlay');
    this.countdownText = document.getElementById('countdown-text');
    this.countdownTimeouts = [];

    this.updateSoundBtnText();
    this.resizeCanvas();
    this.initEntities();
    this.bindEvents();

    this.lastTime = performance.now();
    requestAnimationFrame(this.gameLoop.bind(this));
  }

  createStars(count) {
    this.stars = [];
    for (let i = 0; i < count; i++) {
      this.stars.push({
        x: Math.random(),
        y: Math.random(),
        size: 0.8 + Math.random() * 1.5,
        alpha: 0.2 + Math.random() * 0.6,
        pulseSpeed: 1 + Math.random() * 2
      });
    }
  }

  resizeCanvas() {
    const container = document.getElementById('game-container');
    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();

    this.width = rect.width;
    this.height = rect.height;

    this.canvas.width = Math.floor(this.width * dpr);
    this.canvas.height = Math.floor(this.height * dpr);

    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.scale(dpr, dpr);
  }

  initEntities() {
    const centerX = this.width / 2;
    const dotRadius = Math.max(22, this.width * 0.055);
    const dotSpacing = Math.max(48, this.width * 0.14);

    this.topY = this.height * 0.23;
    this.bottomY = this.height * 0.77;

    this.topPair = new DotPair(this.topY, dotRadius, dotSpacing, true);
    this.bottomPair = new DotPair(this.bottomY, dotRadius, dotSpacing, false);

    const ballRadius = Math.max(16, this.width * 0.04);
    this.ball = new BouncingBall(centerX, (this.topY + this.bottomY) / 2, ballRadius);
  }

  bindEvents() {
    window.addEventListener('resize', () => {
      this.resizeCanvas();
      this.initEntities();
    });

    // Touch & Click to Swap
    const handleTap = (e) => {
      if (this.state === 'PLAYING' || this.state === 'COUNTDOWN') {
        // Prevent click if clicking HUD buttons
        if (e.target.closest('#game-hud')) return;
        this.swapDots();
      }
    };

    window.addEventListener('pointerdown', handleTap);

    // Keyboard Space & Arrows
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'ArrowDown') {
        e.preventDefault();
        if (this.state === 'PLAYING' || this.state === 'COUNTDOWN') {
          this.swapDots();
        } else if (this.state === 'MENU' || this.state === 'GAMEOVER') {
          this.startCountdown();
        }
      } else if (e.code === 'KeyP' || e.code === 'Escape') {
        this.togglePause();
      }
    });

    // UI Buttons
    this.btnPlay.addEventListener('click', (e) => {
      e.stopPropagation();
      this.sound.init();
      this.startCountdown();
    });

    this.btnRetry.addEventListener('click', (e) => {
      e.stopPropagation();
      this.startCountdown();
    });

    this.btnSound.addEventListener('click', (e) => {
      e.stopPropagation();
      const isMuted = this.sound.toggleMute();
      this.updateSoundBtnText();
    });

    this.btnPause.addEventListener('click', (e) => {
      e.stopPropagation();
      this.togglePause();
    });

    this.btnResume.addEventListener('click', (e) => {
      e.stopPropagation();
      this.togglePause();
    });
  }

  updateSoundBtnText() {
    this.btnSound.textContent = this.sound.muted ? '🔇' : '🔊';
  }

  triggerHaptic(duration = 20) {
    if (navigator.vibrate) {
      try {
        navigator.vibrate(duration);
      } catch (e) {}
    }
  }

  swapDots() {
    this.topPair.swap();
    this.bottomPair.swap();
    this.sound.playSwap();
    this.triggerHaptic(15);
  }

  startCountdown() {
    this.state = 'COUNTDOWN';

    // Clear any pending countdown timeouts
    if (this.countdownTimeouts) {
      this.countdownTimeouts.forEach(t => clearTimeout(t));
    }
    this.countdownTimeouts = [];

    // Reset 3 Lives & HUD
    this.score = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.hasShield = false;
    this.slowMoTimer = 0;
    this.invulnerableTimer = 0;
    this.powerUps = [];
    this.nextPowerUpScore = 6 + Math.floor(Math.random() * 4);

    this.lives = this.maxLives;
    this.updateLivesUI();

    this.elapsedTime = 0;
    this.hardModeThreshold = 45 + Math.random() * 55;
    this.isHardMode = false;
    if (this.overdriveBanner) this.overdriveBanner.style.display = 'none';

    this.hudScore.textContent = '0';
    this.comboBadge.style.display = 'none';
    this.tapHint.style.display = 'none';

    this.updatePowerUpUI();
    this.particles.reset();
    this.initEntities();

    // In countdown: ball rests in center with 0 speed
    this.ball.speed = 0;
    this.ball.pickNextColor();

    // Hide other modals
    this.menuModal.classList.remove('active');
    this.gameOverModal.classList.remove('active');
    this.pauseModal.classList.remove('active');

    // Show Countdown
    if (this.countdownOverlay && this.countdownText) {
      this.countdownOverlay.classList.add('active');

      const steps = [
        { text: 'READY', className: 'countdown-text ready', delay: 0, isStart: false },
        { text: '3', className: 'countdown-text', delay: 650, isStart: false },
        { text: '2', className: 'countdown-text', delay: 1300, isStart: false },
        { text: '1', className: 'countdown-text', delay: 1950, isStart: false },
        { text: 'START!', className: 'countdown-text start', delay: 2600, isStart: true }
      ];

      steps.forEach(step => {
        const timeout = setTimeout(() => {
          this.countdownText.className = step.className;
          this.countdownText.textContent = step.text;
          void this.countdownText.offsetWidth; // trigger pop animation

          this.sound.playCountdown(step.isStart);
          this.triggerHaptic(step.isStart ? 50 : 25);

          if (step.isStart) {
            this.triggerShake(4, 0.2);
          }
        }, step.delay);
        this.countdownTimeouts.push(timeout);
      });

      // Launch ball when countdown finishes
      const launchTimeout = setTimeout(() => {
        this.countdownOverlay.classList.remove('active');
        this.state = 'PLAYING';

        this.ball.direction = Math.random() > 0.5 ? 1 : -1;
        this.ball.baseSpeed = 290;
        this.ball.speed = this.ball.baseSpeed;
        this.ball.pickNextColor();

        this.tapHint.style.display = 'block';
        setTimeout(() => {
          this.tapHint.style.display = 'none';
        }, 3000);
      }, 3200);
      this.countdownTimeouts.push(launchTimeout);
    } else {
      this.startGame();
    }
  }

  startGame() {
    this.state = 'PLAYING';
    this.score = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.hasShield = false;
    this.slowMoTimer = 0;
    this.powerUps = [];
    this.nextPowerUpScore = 6 + Math.floor(Math.random() * 4);

    // Reset 3 Lives
    this.lives = this.maxLives;
    this.invulnerableTimer = 0;
    this.updateLivesUI();

    // Reset Difficulty Timing (Random between 45s and 100s)
    this.elapsedTime = 0;
    this.hardModeThreshold = 45 + Math.random() * 55; // Player cannot predict the exact moment!
    this.isHardMode = false;
    if (this.overdriveBanner) this.overdriveBanner.style.display = 'none';

    this.hudScore.textContent = '0';
    this.comboBadge.style.display = 'none';
    this.tapHint.style.display = 'block';
    setTimeout(() => {
      this.tapHint.style.display = 'none';
    }, 3500);

    this.updatePowerUpUI();
    this.particles.reset();
    this.initEntities();

    // Random starting direction
    this.ball.direction = Math.random() > 0.5 ? 1 : -1;
    this.ball.baseSpeed = 290;
    this.ball.speed = this.ball.baseSpeed;
    this.ball.pickNextColor();

    this.menuModal.classList.remove('active');
    this.gameOverModal.classList.remove('active');
    this.pauseModal.classList.remove('active');
  }

  updateLivesUI(lostIndex = -1) {
    if (!this.hudLives || this.hudLives.length === 0) return;
    this.hudLives.forEach((heart, idx) => {
      if (idx < this.lives) {
        heart.className = 'life-heart active';
      } else {
        heart.className = 'life-heart lost';
      }
      if (idx === lostIndex) {
        heart.classList.add('shake');
        setTimeout(() => {
          heart.classList.remove('shake');
        }, 500);
      }
    });
  }

  formatTime(seconds) {
    const s = Math.floor(seconds);
    const mins = Math.floor(s / 60);
    const remSecs = s % 60;
    if (mins > 0) {
      return `${mins}m ${remSecs}s`;
    }
    return `${remSecs}s`;
  }

  togglePause() {
    if (this.state === 'PLAYING') {
      this.state = 'PAUSED';
      this.pauseModal.classList.add('active');
    } else if (this.state === 'PAUSED') {
      this.state = 'PLAYING';
      this.pauseModal.classList.remove('active');
      this.lastTime = performance.now();
    }
  }

  triggerShake(intensity = 6, duration = 0.25) {
    this.shakeIntensity = intensity;
    this.shakeDuration = duration;
  }

  updatePowerUpUI() {
    this.powerupBar.innerHTML = '';
    if (this.hasShield) {
      const el = document.createElement('div');
      el.className = 'powerup-pill shield';
      el.textContent = '🛡️ SHIELD';
      this.powerupBar.appendChild(el);
    }
    if (this.slowMoTimer > 0) {
      const el = document.createElement('div');
      el.className = 'powerup-pill slowmo';
      el.textContent = `⏱️ SLOW ${Math.ceil(this.slowMoTimer)}s`;
      this.powerupBar.appendChild(el);
    }
    if (this.ball && this.ball.isRainbow) {
      const el = document.createElement('div');
      el.className = 'powerup-pill rainbow';
      el.textContent = '🌈 RAINBOW';
      this.powerupBar.appendChild(el);
    }
  }

  spawnPowerUp() {
    const types = ['shield', 'slowmo', 'rainbow'];
    const type = types[Math.floor(Math.random() * types.length)];
    const midY = (this.topY + this.bottomY) / 2 + (Math.random() - 0.5) * (this.height * 0.15);
    this.powerUps.push(new PowerUp(this.width / 2, midY, type));
  }

  onMatchSuccess(hitY, centerDotColor) {
    this.score++;
    this.combo++;
    if (this.combo > this.maxCombo) this.maxCombo = this.combo;

    // Score pop animation
    this.hudScore.textContent = this.score;
    this.hudScore.classList.remove('score-pop');
    void this.hudScore.offsetWidth;
    this.hudScore.classList.add('score-pop');

    // Combo badge
    if (this.combo >= 2) {
      this.comboBadge.style.display = 'block';
      this.comboBadge.textContent = `COMBO x${this.combo} 🔥`;
    }

    // Audio & FX
    this.sound.playHit(this.combo);
    this.triggerHaptic(25);
    this.triggerShake(2.5, 0.12);

    this.particles.addSparks(this.width / 2, hitY, centerDotColor, 20);
    this.particles.addRing(this.width / 2, hitY, centerDotColor);

    const bonusText = this.combo >= 3 ? `+1 (x${this.combo})` : '+1';
    this.particles.addFloatingText(this.width / 2, hitY - 20 * this.ball.direction, bonusText, centerDotColor);

    // Spawn powerup occasionally
    if (this.score >= this.nextPowerUpScore && this.powerUps.length === 0) {
      this.spawnPowerUp();
      this.nextPowerUpScore = this.score + 8 + Math.floor(Math.random() * 5);
    }

    // Reverse and randomize
    this.ball.direction *= -1;
    this.ball.pickNextColor();
  }

  onMatchFail(hitY, centerDotColor) {
    if (this.invulnerableTimer > 0) {
      // Grace period right after losing a life
      this.ball.direction *= -1;
      this.ball.pickNextColor();
      return;
    }

    if (this.hasShield) {
      // Shield saves the player!
      this.hasShield = false;
      this.updatePowerUpUI();
      this.sound.playShieldBreak();
      this.triggerHaptic(50);
      this.triggerShake(5, 0.2);

      this.particles.addSparks(this.width / 2, hitY, '#00f5ff', 25);
      this.particles.addRing(this.width / 2, hitY, '#00f5ff');
      this.particles.addFloatingText(this.width / 2, hitY, 'SHIELD BROKEN!', '#00f5ff');

      // Reverse ball safely
      this.ball.direction *= -1;
      this.ball.pickNextColor();
      return;
    }

    // Deduct 1 Life
    this.lives--;
    const lostIdx = this.lives;
    this.updateLivesUI(lostIdx);
    this.sound.playLifeLost();
    this.triggerHaptic(60);
    this.triggerShake(7, 0.25);

    this.particles.addSparks(this.ball.x, this.ball.y, '#ff007f', 24);
    this.particles.addRing(this.ball.x, this.ball.y, '#ff007f');

    if (this.lives > 0) {
      // Player still has lives remaining
      const lifeMsg = this.lives === 1 ? '1 LIFE LEFT! ⚠️' : `${this.lives} LIVES LEFT!`;
      this.particles.addFloatingText(this.width / 2, hitY - 15 * this.ball.direction, `-1 LIFE! (${lifeMsg})`, '#ff007f');

      this.invulnerableTimer = 0.65; // 650ms recovery grace
      this.combo = 0;
      this.comboBadge.style.display = 'none';

      // Reverse ball safely
      this.ball.direction *= -1;
      this.ball.pickNextColor();
      return;
    }

    // 0 Lives -> Full Game Over
    this.triggerHaptic(90);
    this.triggerShake(12, 0.4);
    this.sound.playGameOver();

    this.particles.addShards(this.ball.x, this.ball.y, this.ball.getColor(), centerDotColor, 45);

    const isNewRecord = this.score > this.highScore;
    if (isNewRecord) {
      this.highScore = this.score;
      localStorage.setItem('two_dots_highscore', this.highScore);
      this.particles.addConfetti(this.width, this.height, 60);
    }

    this.state = 'GAMEOVER';
    this.finalScoreEl.textContent = this.score;
    this.bestScoreEl.textContent = this.highScore;
    if (this.survivedTimeEl) {
      this.survivedTimeEl.textContent = this.formatTime(this.elapsedTime);
    }
    this.maxComboEl.textContent = `${this.maxCombo}x`;
    this.newRecordBadge.style.display = isNewRecord ? 'block' : 'none';
    this.comboBadge.style.display = 'none';

    // Trigger API score submission & redirect handler
    const scorePayload = {
      score: this.score,
      bestScore: this.highScore,
      maxCombo: this.maxCombo,
      timeSurvived: this.elapsedTime,
      timestamp: Date.now()
    };
    sendScore(scorePayload);
    handleGameOverRedirect(scorePayload);

    setTimeout(() => {
      this.gameOverModal.classList.add('active');
    }, 450);
  }

  update(dt) {
    this.particles.update();

    // Screen Shake decay
    if (this.shakeDuration > 0) {
      this.shakeDuration -= dt;
      if (this.shakeDuration <= 0) this.shakeIntensity = 0;
    }

    if (this.state === 'COUNTDOWN') {
      this.topPair.update(dt);
      this.bottomPair.update(dt);
      return;
    }

    if (this.state !== 'PLAYING') return;

    // Track survival time
    this.elapsedTime += dt;

    if (this.invulnerableTimer > 0) {
      this.invulnerableTimer -= dt;
    }

    // Dynamic Difficulty Progression (Random 45-100s threshold)
    if (this.elapsedTime >= this.hardModeThreshold && !this.isHardMode) {
      this.isHardMode = true;
      if (this.overdriveBanner) {
        this.overdriveBanner.style.display = 'block';
        setTimeout(() => {
          if (this.overdriveBanner) this.overdriveBanner.style.display = 'none';
        }, 3000);
      }
      this.sound.playOverdrive();
      this.triggerShake(6, 0.3);
      this.triggerHaptic(70);
      this.particles.addFloatingText(this.width / 2, this.height * 0.45, '⚡ OVERDRIVE ACTIVE! ⚡', '#ffe600');
    }

    // Dynamic Speed Calculation
    if (!this.isHardMode) {
      // Warm-up / Easy Phase (first 45s-100s): comfortable, steady, relaxed pace
      const progress = this.elapsedTime / this.hardModeThreshold;
      this.ball.speed = this.ball.baseSpeed + progress * 45 + Math.min(30, this.score * 0.7);
    } else {
      // Overdrive / Hard Phase: progressive adrenaline ramp
      const hardTime = this.elapsedTime - this.hardModeThreshold;
      const ramp = Math.min(340, hardTime * 5.2 + this.score * 2.2);
      this.ball.speed = 340 + ramp;
    }

    // Update Entities
    this.topPair.update(dt);
    this.bottomPair.update(dt);

    // Update Slow-Mo Timer
    if (this.slowMoTimer > 0) {
      this.slowMoTimer -= dt;
      this.ball.isSlowMo = true;
      if (this.slowMoTimer <= 0) {
        this.ball.isSlowMo = false;
        this.updatePowerUpUI();
      }
    } else {
      this.ball.isSlowMo = false;
    }

    this.ball.update(dt);

    // Power-up Collisions
    for (let i = this.powerUps.length - 1; i >= 0; i--) {
      const p = this.powerUps[i];
      p.update(dt);

      const dist = Math.hypot(this.ball.x - p.x, this.ball.y - p.y);
      if (dist < this.ball.radius + p.radius) {
        // Collect powerup!
        this.sound.playPowerUp();
        this.triggerHaptic(30);
        this.particles.addRing(p.x, p.y, '#ffe600');
        this.particles.addSparks(p.x, p.y, '#ffe600', 20);

        if (p.type === 'shield') {
          this.hasShield = true;
          this.particles.addFloatingText(p.x, p.y, 'SHIELD ACTIVE!', '#00f5ff');
        } else if (p.type === 'slowmo') {
          this.slowMoTimer = 4.5;
          this.particles.addFloatingText(p.x, p.y, 'SLOW-MO!', '#ffe600');
        } else if (p.type === 'rainbow') {
          this.ball.setRainbow(4.5);
          this.particles.addFloatingText(p.x, p.y, 'RAINBOW ORB!', '#ff007f');
        }

        this.updatePowerUpUI();
        this.powerUps.splice(i, 1);
      }
    }

    // Collision with Top Pair
    const topLimit = this.topY + this.topPair.radius + this.ball.radius;
    if (this.ball.y <= topLimit && this.ball.direction === -1) {
      this.ball.y = topLimit;
      const targetColor = this.topPair.getCenterDotColor();
      const ballColor = this.ball.getColor();

      if (this.ball.isRainbow || ballColor === targetColor) {
        this.onMatchSuccess(topLimit, targetColor);
      } else {
        this.onMatchFail(topLimit, targetColor);
      }
    }

    // Collision with Bottom Pair
    const bottomLimit = this.bottomY - this.bottomPair.radius - this.ball.radius;
    if (this.ball.y >= bottomLimit && this.ball.direction === 1) {
      this.ball.y = bottomLimit;
      const targetColor = this.bottomPair.getCenterDotColor();
      const ballColor = this.ball.getColor();

      if (this.ball.isRainbow || ballColor === targetColor) {
        this.onMatchSuccess(bottomLimit, targetColor);
      } else {
        this.onMatchFail(bottomLimit, targetColor);
      }
    }
  }

  draw() {
    this.ctx.clearRect(0, 0, this.width, this.height);

    // Apply Screen Shake
    this.ctx.save();
    if (this.shakeIntensity > 0) {
      const ox = (Math.random() - 0.5) * this.shakeIntensity;
      const oy = (Math.random() - 0.5) * this.shakeIntensity;
      this.ctx.translate(ox, oy);
    }

    const centerX = this.width / 2;

    // Draw Ambient Starfield
    this.drawBackground(this.ctx);

    // Draw Central Transit Guide Line
    this.ctx.save();
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    this.ctx.lineWidth = 2;
    this.ctx.setLineDash([6, 8]);
    this.ctx.beginPath();
    this.ctx.moveTo(centerX, this.topY);
    this.ctx.lineTo(centerX, this.bottomY);
    this.ctx.stroke();
    this.ctx.restore();

    // Draw Shield Aura if active
    if (this.hasShield) {
      this.drawShieldAura(this.ctx, centerX);
    }

    // Draw Power-ups
    for (const p of this.powerUps) {
      p.draw(this.ctx);
    }

    // Draw Entities
    this.topPair.draw(this.ctx, centerX);
    this.bottomPair.draw(this.ctx, centerX);

    if (this.state !== 'GAMEOVER') {
      // Blink during recovery grace period after losing a life
      if (this.invulnerableTimer <= 0 || Math.floor(Date.now() / 80) % 2 === 0) {
        this.ball.draw(this.ctx);
      }
    }

    // Draw Particle System
    this.particles.draw(this.ctx);

    this.ctx.restore();
  }

  drawBackground(ctx) {
    const time = Date.now() * 0.001;
    ctx.save();
    for (const s of this.stars) {
      const alpha = s.alpha * (0.6 + 0.4 * Math.sin(time * s.pulseSpeed));
      ctx.fillStyle = `rgba(0, 245, 255, ${alpha * 0.4})`;
      ctx.beginPath();
      ctx.arc(s.x * this.width, s.y * this.height, s.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  drawShieldAura(ctx, centerX) {
    ctx.save();
    const time = Date.now() * 0.003;
    const pulse = 1 + 0.06 * Math.sin(time * 3);

    ctx.strokeStyle = 'rgba(0, 245, 255, 0.45)';
    ctx.lineWidth = 2.5;
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#00f5ff';

    // Top shield
    ctx.beginPath();
    ctx.arc(centerX, this.topY, (this.topPair.radius + 10) * pulse, 0, Math.PI * 2);
    ctx.stroke();

    // Bottom shield
    ctx.beginPath();
    ctx.arc(centerX, this.bottomY, (this.bottomPair.radius + 10) * pulse, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }

  gameLoop(currentTime) {
    const dt = Math.min(0.05, (currentTime - this.lastTime) / 1000);
    this.lastTime = currentTime;

    this.update(dt);
    this.draw();

    requestAnimationFrame(this.gameLoop.bind(this));
  }
}

// Start Game Instance upon DOM ready
window.addEventListener('DOMContentLoaded', () => {
  window.game = new TwoDotsGame();
});

