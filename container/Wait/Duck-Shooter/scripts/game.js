// Duck Shooter: Infinite Carnival Arcade (1080x1920)
// Modern HTML5 Canvas 2D Game Engine

const VIRTUAL_WIDTH = 1080;
const VIRTUAL_HEIGHT = 1920;

// Shelf Y coordinates (4 carnival shooting shelves across the portrait height)
const SHELVES = [
  { y: 520,  dir: 1,  speedMult: 1.0, depth: 0.85, railColor: '#5c2c16' },
  { y: 820,  dir: -1, speedMult: 1.15, depth: 0.9,  railColor: '#6e351b' },
  { y: 1120, dir: 1,  speedMult: 1.3, depth: 0.95, railColor: '#7a3b1e' },
  { y: 1420, dir: -1, speedMult: 1.45, depth: 1.0,  railColor: '#8a4222' }
];

// High Score Persistence
const STORAGE_KEY_BEST = 'duck_shooter_infinite_best_score';
const STORAGE_KEY_SOUND = 'duck_shooter_sound_enabled';
const STORAGE_KEY_MUSIC = 'duck_shooter_music_enabled';

// Duck Definitions (Mapped to authentic extracted assets)
const DUCK_TYPES = [
  { id: 1, name: 'Green Mallard', baseScore: 100, speed: 200, weight: 35, scale: 1.25, featherColors: ['#2e7d32', '#388e3c', '#81c784', '#ffffff', '#5d4037'] },
  { id: 2, name: 'Bluefin Mallard', baseScore: 150, speed: 240, weight: 25, scale: 1.25, featherColors: ['#1565c0', '#1976d2', '#64b5f6', '#ffffff', '#e65100'] },
  { id: 3, name: 'Ruddy Teal', baseScore: 250, speed: 300, weight: 18, scale: 1.15, featherColors: ['#c2185b', '#e91e63', '#f48fb1', '#ffecb3', '#4a148c'], sinusoidal: true },
  { id: 4, name: 'Spotted Teal', baseScore: 350, speed: 360, weight: 12, scale: 1.15, featherColors: ['#ef6c00', '#f57c00', '#ffb74d', '#3e2723', '#fff8e1'], erratic: true },
  { id: 5, name: 'Golden Duck', baseScore: 1000, speed: 480, weight: 5,  scale: 1.3,  featherColors: ['#ffd700', '#ffeb3b', '#fff9c4', '#ff9800', '#ffffff'], golden: true },
  { id: 6, name: 'Dynamite Duck', baseScore: 500, speed: 260, weight: 5,  scale: 1.3,  featherColors: ['#d32f2f', '#f44336', '#ff5252', '#212121', '#ffeb3b'], explosive: true }
];

// Egg bonus types
const EGG_TYPES = [
  { id: 0, name: 'Bonus Score', score: 300, icon: '⭐' },
  { id: 1, name: 'Golden Egg', score: 600, icon: '🌟' },
  { id: 2, name: 'Freeze Time', effect: 'freeze', duration: 4.5, icon: '❄️' },
  { id: 3, name: 'Extra Life', effect: 'life', icon: '❤️' }
];

/* ==========================================================================
   AUDIO SYSTEM (HTML5 Audio + Web Audio Synthesizer)
   ========================================================================== */
class SoundManager {
  constructor() {
    this.soundEnabled = localStorage.getItem(STORAGE_KEY_SOUND) !== 'false';
    this.musicEnabled = localStorage.getItem(STORAGE_KEY_MUSIC) !== 'false';
    this.audioCtx = null;
    this.sounds = {};
    this.music = null;
    this.isMusicPlaying = false;
    this.initWebAudio();
    this.loadAudioFiles();
  }

  initWebAudio() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.audioCtx = new AudioContext();
      }
    } catch (e) {
      console.warn('Web Audio not available:', e);
    }
  }

  unlock() {
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    if (this.music && this.musicEnabled && !this.isMusicPlaying) {
      this.playMusic();
    }
  }

  loadAudioFiles() {
    const soundList = ['shot', 'bomb', 'eggs', 'buttons'];
    soundList.forEach(name => {
      this.sounds[name] = [];
      for (let i = 0; i < 4; i++) {
        const audio = new Audio(`assets/audio/${name}.webm`);
        audio.preload = 'auto';
        this.sounds[name].push(audio);
      }
    });

    this.music = new Audio('assets/audio/gamemusic.webm');
    this.music.loop = true;
    this.music.volume = 0.35;
    this.music.preload = 'auto';
  }

  playSound(name, volume = 1.0) {
    if (!this.soundEnabled) return;
    this.unlock();

    const pool = this.sounds[name];
    if (pool) {
      const audio = pool.find(a => a.paused || a.ended) || pool[0];
      try {
        audio.currentTime = 0;
        audio.volume = Math.max(0, Math.min(1, volume));
        audio.play().catch(() => this.playSynthFallback(name));
        return;
      } catch (e) {
        // Fallback to synth
      }
    }
    this.playSynthFallback(name);
  }

  playSynthFallback(name) {
    if (!this.audioCtx || !this.soundEnabled) return;
    const ctx = this.audioCtx;
    const now = ctx.currentTime;

    if (name === 'shot') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(30, now + 0.15);
      gain.gain.setValueAtTime(0.7, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.18);

      const bufferSize = ctx.sampleRate * 0.08;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = buffer;
      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.9, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
      whiteNoise.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      whiteNoise.start(now);
    } else if (name === 'bomb') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(20, now + 0.8);
      gain.gain.setValueAtTime(1.0, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.85);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.85);
    } else if (name === 'eggs') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now);
      osc.frequency.setValueAtTime(880, now + 0.08);
      osc.frequency.setValueAtTime(1174.66, now + 0.16);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.35);
    } else if (name === 'buttons') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(220, now + 0.05);
      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.06);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.06);
    }
  }

  playReload() {
    if (!this.audioCtx || !this.soundEnabled) return;
    const ctx = this.audioCtx;
    const now = ctx.currentTime;
    for (let i = 0; i < 4; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(1200 + i * 150, now + i * 0.1);
      gain.gain.setValueAtTime(0.15, now + i * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + 0.03);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.1);
      osc.stop(now + i * 0.1 + 0.04);
    }
  }

  playEmptyClick() {
    if (!this.audioCtx || !this.soundEnabled) return;
    const ctx = this.audioCtx;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(100, now + 0.04);
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.05);
  }

  playCombo(level) {
    if (!this.audioCtx || !this.soundEnabled) return;
    const ctx = this.audioCtx;
    const now = ctx.currentTime;
    const pitches = [523.25, 587.33, 659.25, 783.99, 1046.50, 1318.51];
    const pitch = pitches[Math.min(level, pitches.length - 1)];

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(pitch, now);
    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.25);
  }

  playMusic() {
    if (!this.musicEnabled || !this.music) return;
    try {
      this.music.play().then(() => {
        this.isMusicPlaying = true;
      }).catch(() => {
        this.isMusicPlaying = false;
      });
    } catch (e) {
      this.isMusicPlaying = false;
    }
  }

  stopMusic() {
    if (this.music) {
      this.music.pause();
      this.music.currentTime = 0;
      this.isMusicPlaying = false;
    }
  }

  toggleSound() {
    this.soundEnabled = !this.soundEnabled;
    localStorage.setItem(STORAGE_KEY_SOUND, this.soundEnabled);
    if (this.soundEnabled) this.playSound('buttons');
    return this.soundEnabled;
  }

  toggleMusic() {
    this.musicEnabled = !this.musicEnabled;
    localStorage.setItem(STORAGE_KEY_MUSIC, this.musicEnabled);
    if (this.musicEnabled) {
      this.playMusic();
    } else {
      this.stopMusic();
    }
    return this.musicEnabled;
  }
}

/* ==========================================================================
   PARTICLE & FX ENGINE
   ========================================================================== */
class Particle {
  constructor(x, y, vx, vy, color, size, life, type = 'feather') {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.color = color;
    this.size = size;
    this.maxLife = life;
    this.life = life;
    this.type = type;
    this.angle = Math.random() * Math.PI * 2;
    this.rotSpeed = (Math.random() - 0.5) * 12;
    this.wobblePhase = Math.random() * Math.PI * 2;
  }

  update(dt) {
    this.life -= dt;
    if (this.life <= 0) return false;

    if (this.type === 'feather') {
      this.wobblePhase += dt * 6;
      this.vx += Math.sin(this.wobblePhase) * 40 * dt;
      this.vx *= Math.pow(0.95, dt * 60);
      this.vy += 220 * dt;
      this.vy *= Math.pow(0.96, dt * 60);
      this.angle += this.rotSpeed * dt;
    } else if (this.type === 'spark') {
      this.vx *= Math.pow(0.92, dt * 60);
      this.vy += 450 * dt;
      this.size *= Math.pow(0.96, dt * 60);
    } else if (this.type === 'smoke') {
      this.vx *= Math.pow(0.9, dt * 60);
      this.vy -= 60 * dt;
      this.size += 20 * dt;
      this.angle += this.rotSpeed * 0.3 * dt;
    } else if (this.type === 'gold_sparkle') {
      this.vy += 50 * dt;
      this.size *= Math.pow(0.98, dt * 60);
      this.angle += this.rotSpeed * dt;
    }

    this.x += this.vx * dt;
    this.y += this.vy * dt;
    return true;
  }

  draw(ctx) {
    const alpha = Math.max(0, this.life / this.maxLife);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);

    if (this.type === 'feather') {
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.ellipse(0, 0, this.size * 0.45, this.size, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, -this.size * 0.9);
      ctx.lineTo(0, this.size * 0.9);
      ctx.stroke();
    } else if (this.type === 'spark' || this.type === 'gold_sparkle') {
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(0, 0, Math.max(1, this.size), 0, Math.PI * 2);
      ctx.fill();
    } else if (this.type === 'smoke') {
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(0, 0, Math.max(1, this.size), 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}

class FloatingText {
  constructor(text, x, y, color = '#ffd700', size = 42, isSpecial = false) {
    this.text = text;
    this.x = x;
    this.y = y;
    this.color = color;
    this.size = size;
    this.isSpecial = isSpecial;
    this.life = 1.2;
    this.maxLife = 1.2;
    this.scale = 0.4;
  }

  update(dt) {
    this.life -= dt;
    this.y -= 75 * dt;
    if (this.scale < 1.0) {
      this.scale = Math.min(1.0, this.scale + dt * 6.0);
    }
    return this.life > 0;
  }

  draw(ctx) {
    const alpha = Math.max(0, this.life / this.maxLife);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(this.x, this.y);
    ctx.scale(this.scale, this.scale);

    ctx.font = `900 ${this.size}px "Trebuchet MS", "Impact", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 8;
    ctx.strokeText(this.text, 0, 0);

    if (this.isSpecial) {
      ctx.shadowColor = this.color;
      ctx.shadowBlur = 16;
    }
    ctx.fillStyle = this.color;
    ctx.fillText(this.text, 0, 0);

    ctx.restore();
  }
}

class BulletDecal {
  constructor(x, y, frame) {
    this.x = x;
    this.y = y;
    this.frame = frame;
    this.alpha = 1.0;
    this.life = 25.0;
  }

  update(dt) {
    this.life -= dt;
    if (this.life < 3.0) {
      this.alpha = this.life / 3.0;
    }
    return this.life > 0;
  }

  draw(ctx, bulletHoleImages) {
    const img = bulletHoleImages[this.frame % bulletHoleImages.length];
    if (!img || !img.complete) return;

    ctx.save();
    ctx.globalAlpha = Math.max(0, this.alpha);
    ctx.drawImage(img, this.x - img.width / 2, this.y - img.height / 2);
    ctx.restore();
  }
}

/* ==========================================================================
   TARGET CLASSES: DUCK TARGET & BONUS EGG
   ========================================================================== */
class DuckTarget {
  constructor(type, x, y, dir, speed, shelfIndex) {
    this.type = type;
    this.x = x;
    this.baseY = y;
    this.y = y;
    this.dir = dir; // 1 = right, -1 = left
    this.speed = speed;
    this.shelfIndex = shelfIndex;
    this.scale = type.scale;
    this.hitRadius = 60 * this.scale;
    this.alive = true;
    this.timeAlive = 0;
    this.wobbleFreq = 4.0;
    this.wobbleAmp = type.sinusoidal ? 55 : 12;
  }

  update(dt) {
    this.timeAlive += dt;
    this.x += this.dir * this.speed * dt;
    this.y = this.baseY - 45 + Math.sin(this.timeAlive * this.wobbleFreq) * this.wobbleAmp;

    if (this.type.erratic && Math.sin(this.timeAlive * 3) > 0.8) {
      this.x += this.dir * this.speed * 0.7 * dt;
    }

    if (this.dir === 1 && this.x > VIRTUAL_WIDTH + 160) return false;
    if (this.dir === -1 && this.x < -160) return false;
    return true;
  }

  checkHit(shotX, shotY) {
    const dist = Math.hypot(this.x - shotX, (this.y - 20) - shotY);
    return dist < this.hitRadius;
  }

  getHitInfo(shotX, shotY) {
    const dist = Math.hypot(this.x - shotX, (this.y - 20) - shotY);
    if (dist >= this.hitRadius) return null;
    const ratio = dist / this.hitRadius;
    if (ratio <= 0.25) {
      return { accuracy: 'HIGH', score: 10, label: '🎯 HIGH +10', color: '#00e676', dist };
    } else if (ratio <= 0.50) {
      return { accuracy: 'LOW_HIGH', score: 8, label: '⚡ LOW HIGH +8', color: '#76ff03', dist };
    } else if (ratio <= 0.75) {
      return { accuracy: 'MEDIUM', score: 6, label: '👍 MEDIUM +6', color: '#ffeb3b', dist };
    } else {
      return { accuracy: 'LOW', score: 4, label: '👌 LOW +4', color: '#ff9800', dist };
    }
  }

  draw(ctx, images, ambientTime) {
    const imgKey = `duck_${this.type.id}`;
    const img = images[imgKey];
    if (!img || !img.complete) return;

    ctx.save();
    ctx.translate(this.x, this.y);

    // Mechanical Carnival Stand
    ctx.fillStyle = '#4a2511';
    ctx.fillRect(-6, 25, 12, SHELVES[this.shelfIndex].y - this.y - 10);
    ctx.beginPath();
    ctx.arc(0, 25, 8, 0, Math.PI * 2);
    ctx.fillStyle = '#ffca28';
    ctx.fill();

    // Direction flip & wing flap tilt
    const flapTilt = Math.cos(this.timeAlive * 8) * 0.08;
    ctx.rotate(flapTilt * this.dir);
    if (this.dir === -1) {
      ctx.scale(-1, 1);
    }
    ctx.scale(this.scale, this.scale);

    if (this.type.golden) {
      ctx.shadowColor = '#ffd700';
      ctx.shadowBlur = 24;
    }

    if (this.type.explosive) {
      const fusePulse = (Math.sin(ambientTime * 14) + 1) / 2;
      ctx.shadowColor = `rgba(255, 23, 68, ${fusePulse})`;
      ctx.shadowBlur = 20;
    }

    ctx.drawImage(img, -img.width / 2, -img.height / 2 - 20);
    ctx.restore();
  }
}

class BonusEgg {
  constructor(type, x, y, dir, speed, shelfIndex) {
    this.type = type;
    this.x = x;
    this.baseY = y;
    this.y = y;
    this.dir = dir;
    this.speed = speed;
    this.shelfIndex = shelfIndex;
    this.hitRadius = 55;
    this.timeAlive = 0;
  }

  update(dt) {
    this.timeAlive += dt;
    this.x += this.dir * this.speed * dt;
    this.y = this.baseY + Math.sin(this.timeAlive * 3.5) * 18;

    if (this.dir === 1 && this.x > VIRTUAL_WIDTH + 140) return false;
    if (this.dir === -1 && this.x < -140) return false;
    return true;
  }

  checkHit(shotX, shotY) {
    return Math.hypot(this.x - shotX, this.y - shotY) < this.hitRadius;
  }

  getHitInfo(shotX, shotY) {
    const dist = Math.hypot(this.x - shotX, this.y - shotY);
    if (dist >= this.hitRadius) return null;
    const ratio = dist / this.hitRadius;
    if (ratio <= 0.3) {
      return { accuracy: 'HIGH', score: 10, label: '🎯 HIGH +10', color: '#00e676', dist };
    } else if (ratio <= 0.55) {
      return { accuracy: 'LOW_HIGH', score: 8, label: '⚡ LOW HIGH +8', color: '#76ff03', dist };
    } else if (ratio <= 0.8) {
      return { accuracy: 'MEDIUM', score: 6, label: '👍 MEDIUM +6', color: '#ffeb3b', dist };
    } else {
      return { accuracy: 'LOW', score: 4, label: '👌 LOW +4', color: '#ff9800', dist };
    }
  }

  draw(ctx, images, ambientTime) {
    const imgKey = `egg_${this.type.id}`;
    const img = images[imgKey];
    if (!img || !img.complete) return;

    ctx.save();
    ctx.translate(this.x, this.y);

    const rot = Math.sin(this.timeAlive * 4) * 0.12;
    ctx.rotate(rot);

    if (this.type.id === 1) {
      ctx.shadowColor = '#ffd700';
      ctx.shadowBlur = 18;
    } else if (this.type.id === 2) {
      ctx.shadowColor = '#00e5ff';
      ctx.shadowBlur = 18;
    }

    ctx.drawImage(img, -img.width / 2, -img.height / 2);

    ctx.font = '28px "Segoe UI Emoji", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(this.type.icon, 0, -img.height / 2 - 10);
    ctx.restore();
  }
}

/* ==========================================================================
   MAIN GAME ENGINE
   ========================================================================== */
class DuckShooterGame {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.sound = new SoundManager();

    this.scale = 1;
    this.dpr = window.devicePixelRatio || 1;

    this.crosshairX = VIRTUAL_WIDTH / 2;
    this.crosshairY = VIRTUAL_HEIGHT / 2;
    this.recoilY = 0;
    this.muzzleFlashTimer = 0;
    this.muzzleFlashX = 0;
    this.muzzleFlashY = 0;

    this.shakeAmount = 0;
    this.shakeDuration = 0;

    this.state = 'LOADING'; // LOADING, MENU, PLAYING, PAUSED, GAMEOVER
    this.score = 0;
    this.bestScore = parseInt(localStorage.getItem(STORAGE_KEY_BEST), 10) || 0;
    this.wave = 1;
    this.targetsShotInWave = 0;
    this.totalShots = 0;
    this.totalHits = 0;
    this.maxCombo = 1;
    this.accuracyStats = { high: 0, lowHigh: 0, medium: 0, low: 0 };
    this.lastShotRating = null;
    this.lastShotRatingTimer = 0;

    this.maxAmmo = 6;
    this.ammo = 6;
    this.isReloading = false;
    this.reloadTimer = 0;
    this.reloadDuration = 0.65;
    this.cylinderRotation = 0;

    this.maxLives = 3;
    this.lives = 3;
    this.combo = 0;
    this.comboTimer = 0;
    this.comboWindow = 2.8;
    this.isFrenzy = false;
    this.frenzyTimer = 0;

    this.isFrozen = false;
    this.freezeTimer = 0;

    this.ducks = [];
    this.dyingDucks = [];
    this.eggs = [];
    this.particles = [];
    this.floatingTexts = [];
    this.bulletDecals = [];
    this.explosions = [];

    this.spawnTimer = 0;
    this.eggSpawnTimer = 3.0;

    this.sunlightAngle = 0;
    this.ambientTime = 0;
    this.waveBannerTimer = 0;
    this.waveBannerText = '';

    this.assets = {
      images: {},
      loaded: 0,
      total: 0
    };

    this.initCanvas();
    this.bindEvents();
    this.loadAllAssets();
  }

  initCanvas() {
    this.canvas.width = VIRTUAL_WIDTH;
    this.canvas.height = VIRTUAL_HEIGHT;
    this.ctx.imageSmoothingEnabled = true;
    this.ctx.imageSmoothingQuality = 'high';
  }

  bindEvents() {
    const getVirtualPos = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const clientX = e.touches && e.touches.length > 0 ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches && e.touches.length > 0 ? e.touches[0].clientY : e.clientY;
      const rw = rect.width > 0 ? rect.width : VIRTUAL_WIDTH;
      const rh = rect.height > 0 ? rect.height : VIRTUAL_HEIGHT;
      const x = (clientX - rect.left) * (VIRTUAL_WIDTH / rw);
      const y = (clientY - rect.top) * (VIRTUAL_HEIGHT / rh);
      return { x: Math.max(0, Math.min(VIRTUAL_WIDTH, x)), y: Math.max(0, Math.min(VIRTUAL_HEIGHT, y)) };
    };

    window.addEventListener('mousemove', (e) => {
      const pos = getVirtualPos(e);
      this.crosshairX = pos.x;
      this.crosshairY = pos.y;
    });

    this.canvas.addEventListener('mousedown', (e) => {
      e.preventDefault();
      const pos = getVirtualPos(e);
      this.crosshairX = pos.x;
      this.crosshairY = pos.y;
      this.handleShootOrAction(pos.x, pos.y);
    });

    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const pos = getVirtualPos(e);
      this.crosshairX = pos.x;
      this.crosshairY = pos.y;
      this.handleShootOrAction(pos.x, pos.y);
    }, { passive: false });

    this.canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      const pos = getVirtualPos(e);
      this.crosshairX = pos.x;
      this.crosshairY = pos.y;
    }, { passive: false });

    window.addEventListener('keydown', (e) => {
      if (e.code === 'KeyR' || e.code === 'Space') {
        e.preventDefault();
        this.reload();
      } else if (e.code === 'KeyP' || e.code === 'Escape') {
        e.preventDefault();
        this.togglePause();
      } else if (e.code === 'KeyM') {
        this.sound.toggleMusic();
      } else if (e.code === 'KeyS') {
        this.sound.toggleSound();
      }
    });
  }

  loadAllAssets() {
    const manifest = [
      { key: 'background', src: 'assets/images/background-default-000.png' },
      { key: 'curtainTop', src: 'assets/images/curtaintop-default-000.png' },
      { key: 'curtainBack', src: 'assets/images/curtainback-default-000.png' },
      { key: 'sunlight', src: 'assets/images/sunlight-default-000.png' },
      { key: 'logo', src: 'assets/images/gamelogo-default-000.png' },
      { key: 'gameover', src: 'assets/images/gameover-default-000.png' },
      { key: 'cursor', src: 'assets/images/cursor-default-001.png' },
      { key: 'cursorHover', src: 'assets/images/cursorhover-default-001.png' },
      { key: 'btnPlay', src: 'assets/images/btnplay-default-000.png' },
      { key: 'btnPlayHover', src: 'assets/images/btnplay-default-001.png' },
      { key: 'btnRestart', src: 'assets/images/btnrestart-default-000.png' },
      { key: 'btnRestartHover', src: 'assets/images/btnrestart-default-001.png' },
      { key: 'btnMenu', src: 'assets/images/btnmenu-default-000.png' },
      { key: 'btnSoundOn', src: 'assets/images/btnsound-soundon-000.png' },
      { key: 'btnSoundOff', src: 'assets/images/btnsound-soundoff-000.png' },
      { key: 'btnMusicOn', src: 'assets/images/btnmusic-musicon-000.png' },
      { key: 'btnMusicOff', src: 'assets/images/btnmusic-musicoff-000.png' },
      { key: 'btnReturn', src: 'assets/images/btnreturn-default-000.png' }
    ];

    for (let i = 1; i <= 6; i++) {
      manifest.push({ key: `duck_${i}`, src: `assets/images/duck-duck_${i}-000.png` });
      for (let f = 0; f <= 12; f++) {
        const frameStr = f.toString().padStart(3, '0');
        manifest.push({ key: `duck_${i}_die_${f}`, src: `assets/images/duck-duck_${i}_die-${frameStr}.png` });
      }
    }

    for (let f = 0; f <= 6; f++) {
      manifest.push({ key: `explosion_${f}`, src: `assets/images/explosion-detonation-00${f}.png` });
    }

    for (let f = 0; f <= 3; f++) {
      manifest.push({ key: `egg_${f}`, src: `assets/images/eggs-default-00${f}.png` });
    }

    for (let f = 0; f <= 5; f++) {
      manifest.push({ key: `bullet_hole_${f}`, src: `assets/images/bullet_hole-default-00${f}.png` });
    }

    this.assets.total = manifest.length;
    let loadedCount = 0;
    const markLoaded = () => {
      loadedCount++;
      this.assets.loaded = loadedCount;
      if (loadedCount >= this.assets.total && this.state === 'LOADING') {
        this.state = 'MENU';
      }
    };

    manifest.forEach(item => {
      const img = new Image();
      img.onload = markLoaded;
      img.onerror = () => {
        markLoaded();
      };
      img.src = item.src;
      if (img.complete && img.naturalWidth > 0) {
        markLoaded();
      }
      this.assets.images[item.key] = img;
    });

    setTimeout(() => {
      if (this.state === 'LOADING') {
        this.state = 'MENU';
      }
    }, 800);

    this.lastTime = performance.now();
    requestAnimationFrame(this.gameLoop.bind(this));
  }

  startNewGame() {
    this.score = 0;
    this.wave = 1;
    this.targetsShotInWave = 0;
    this.totalShots = 0;
    this.totalHits = 0;
    this.maxCombo = 1;
    this.accuracyStats = { high: 0, lowHigh: 0, medium: 0, low: 0 };
    this.lastShotRating = null;
    this.lastShotRatingTimer = 0;
    this.ammo = this.maxAmmo;
    this.isReloading = false;
    this.lives = this.maxLives;
    this.combo = 0;
    this.comboTimer = 0;
    this.isFrenzy = false;
    this.frenzyTimer = 0;
    this.isFrozen = false;
    this.freezeTimer = 0;

    this.ducks = [];
    this.dyingDucks = [];
    this.eggs = [];
    this.particles = [];
    this.floatingTexts = [];
    this.bulletDecals = [];
    this.explosions = [];

    this.spawnTimer = 0.5;
    this.eggSpawnTimer = 4.0;
    this.state = 'PLAYING';

    this.triggerWaveAnnouncement(`WAVE ${this.wave}: CARNIVAL OPENING!`);
    this.sound.playMusic();
  }

  triggerWaveAnnouncement(text) {
    this.waveBannerText = text;
    this.waveBannerTimer = 2.4;
    this.floatingTexts.push(new FloatingText(text, VIRTUAL_WIDTH / 2, 700, '#ffeb3b', 54, true));
  }

  reload() {
    if (this.isReloading || this.ammo >= this.maxAmmo) return;
    this.isReloading = true;
    this.reloadTimer = this.reloadDuration;
    this.sound.playReload();
    this.floatingTexts.push(new FloatingText('RELOADING...', VIRTUAL_WIDTH / 2, 1600, '#ffffff', 32));
  }

  handleShootOrAction(x, y) {
    this.sound.unlock();

    if (this.state === 'LOADING') {
      this.state = 'MENU';
      return;
    }

    if (this.state === 'MENU') {
      if (Math.hypot(x - VIRTUAL_WIDTH / 2, y - 1140) < 140) {
        this.sound.playSound('buttons');
        this.startNewGame();
        return;
      }
      if (Math.hypot(x - 960, y - 1800) < 55) {
        this.sound.toggleSound();
        return;
      }
      if (Math.hypot(x - 840, y - 1800) < 55) {
        this.sound.toggleMusic();
        return;
      }
      return;
    }

    if (this.state === 'GAMEOVER') {
      if (Math.hypot(x - 540, y - 1250) < 130) {
        this.sound.playSound('buttons');
        this.startNewGame();
        return;
      }
      if (Math.hypot(x - 540, y - 1480) < 70) {
        this.sound.playSound('buttons');
        this.state = 'MENU';
        return;
      }
      return;
    }

    if (this.state === 'PAUSED') {
      if (Math.hypot(x - 540, y - 950) < 90) {
        this.sound.playSound('buttons');
        this.state = 'PLAYING';
        return;
      }
      if (Math.hypot(x - 540, y - 1150) < 70) {
        this.sound.playSound('buttons');
        this.startNewGame();
        return;
      }
      if (Math.hypot(x - 540, y - 1320) < 70) {
        this.sound.playSound('buttons');
        this.state = 'MENU';
        return;
      }
      return;
    }

    if (this.state === 'PLAYING') {
      if (Math.hypot(x - 980, y - 130) < 50) {
        this.sound.playSound('buttons');
        this.togglePause();
        return;
      }
      if (Math.hypot(x - 870, y - 130) < 45) {
        this.sound.toggleSound();
        return;
      }
      if (Math.hypot(x - 760, y - 130) < 45) {
        this.sound.toggleMusic();
        return;
      }

      if (Math.hypot(x - 540, y - 1750) < 110) {
        this.reload();
        return;
      }

      if (this.ammo <= 0) {
        this.sound.playEmptyClick();
        this.floatingTexts.push(new FloatingText('TAP TO RELOAD!', x, y - 40, '#ff5252', 36));
        this.reload();
        return;
      }

      this.fireWeapon(x, y);
    }
  }

  togglePause() {
    if (this.state === 'PLAYING') {
      this.state = 'PAUSED';
    } else if (this.state === 'PAUSED') {
      this.state = 'PLAYING';
    }
  }

  fireWeapon(x, y) {
    this.ammo--;
    this.totalShots++;
    this.sound.playSound('shot');

    this.recoilY = 22;
    this.muzzleFlashTimer = 0.08;
    this.muzzleFlashX = x;
    this.muzzleFlashY = y;
    this.triggerScreenShake(8, 0.15);

    for (let i = 0; i < 4; i++) {
      this.particles.push(new Particle(
        x + (Math.random() - 0.5) * 20,
        y + (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 40,
        -50 - Math.random() * 40,
        'rgba(220, 220, 220, 0.5)',
        16 + Math.random() * 12,
        0.5 + Math.random() * 0.3,
        'smoke'
      ));
    }

    let hitAnyTarget = false;

    for (let i = this.eggs.length - 1; i >= 0; i--) {
      const egg = this.eggs[i];
      const hitInfo = egg.getHitInfo(x, y);
      if (hitInfo) {
        hitAnyTarget = true;
        this.totalHits++;
        this.handleEggHit(egg, hitInfo);
        this.eggs.splice(i, 1);
        break;
      }
    }

    if (!hitAnyTarget) {
      const sortedDucks = [...this.ducks].sort((a, b) => b.shelfIndex - a.shelfIndex);
      for (const duck of sortedDucks) {
        const hitInfo = duck.getHitInfo(x, y);
        if (hitInfo) {
          hitAnyTarget = true;
          this.totalHits++;
          this.handleDuckHit(duck, hitInfo);
          break;
        }
      }
    }

    if (!hitAnyTarget) {
      if (y > 380 && y < 1620) {
        const frame = Math.floor(Math.random() * 6);
        this.bulletDecals.push(new BulletDecal(x, y, frame));
        if (this.bulletDecals.length > 35) {
          this.bulletDecals.shift();
        }

        for (let i = 0; i < 7; i++) {
          this.particles.push(new Particle(
            x, y,
            (Math.random() - 0.5) * 180,
            -80 - Math.random() * 150,
            '#a16238',
            4 + Math.random() * 4,
            0.6,
            'spark'
          ));
        }
      }

      if (this.combo > 1) {
        this.floatingTexts.push(new FloatingText('COMBO LOST', x, y - 30, '#ff7043', 28));
      }
      this.combo = 0;
      this.comboTimer = 0;
      this.isFrenzy = false;
    }
  }

  handleDuckHit(duck, hitInfo) {
    const index = this.ducks.indexOf(duck);
    if (index !== -1) {
      this.ducks.splice(index, 1);
    }

    this.combo++;
    this.comboTimer = this.comboWindow;
    if (this.combo > this.maxCombo) {
      this.maxCombo = this.combo;
    }

    this.sound.playCombo(this.combo);

    let multiplier = Math.min(this.combo, 5);
    if (this.combo >= 5) {
      this.isFrenzy = true;
      this.frenzyTimer = 6.0;
      multiplier = 6;
    }

    // Accuracy scoring tier: High = 10, Low High = 8, Medium = 6, Low = 4
    const accuracyTier = hitInfo ? hitInfo.accuracy : 'MEDIUM';
    const accuracyBaseScore = hitInfo ? hitInfo.score : 6;
    const accuracyLabel = hitInfo ? hitInfo.label : '👍 MEDIUM +6';
    const accuracyColor = hitInfo ? hitInfo.color : '#ffeb3b';

    if (accuracyTier === 'HIGH') this.accuracyStats.high++;
    else if (accuracyTier === 'LOW_HIGH') this.accuracyStats.lowHigh++;
    else if (accuracyTier === 'MEDIUM') this.accuracyStats.medium++;
    else if (accuracyTier === 'LOW') this.accuracyStats.low++;

    this.lastShotRating = {
      accuracy: accuracyTier,
      score: accuracyBaseScore,
      label: accuracyLabel,
      color: accuracyColor
    };
    this.lastShotRatingTimer = 1.6;

    const goldenBonus = duck.type.golden ? 10 : 0;
    const earnedPoints = (accuracyBaseScore + goldenBonus) * multiplier;
    this.score += earnedPoints;

    if (this.score > this.bestScore) {
      this.bestScore = this.score;
      localStorage.setItem(STORAGE_KEY_BEST, this.bestScore);
    }

    let hitMsg = accuracyLabel;
    let isSpecial = false;
    if (multiplier >= 2) {
      hitMsg += ` (x${multiplier}=+${earnedPoints})`;
    }
    if (duck.type.golden) {
      hitMsg = `GOLDEN! ${accuracyLabel} (+${earnedPoints})`;
      isSpecial = true;
      this.triggerScreenShake(12, 0.25);
    }
    this.floatingTexts.push(new FloatingText(hitMsg, duck.x, duck.y - 40, isSpecial ? '#ffd700' : accuracyColor, isSpecial ? 46 : 38, isSpecial));

    const featherColors = duck.type.featherColors;
    const featherCount = duck.type.golden ? 35 : 24;
    for (let i = 0; i < featherCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 100 + Math.random() * 320;
      const color = featherColors[Math.floor(Math.random() * featherColors.length)];
      this.particles.push(new Particle(
        duck.x, duck.y - 30,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed - 90,
        color,
        14 + Math.random() * 12,
        1.1 + Math.random() * 0.7,
        duck.type.golden ? 'gold_sparkle' : 'feather'
      ));
    }

    if (duck.type.explosive) {
      this.detonateBomb(duck.x, duck.y);
    } else {
      this.dyingDucks.push({
        duckType: duck.type,
        x: duck.x,
        y: duck.y,
        scale: duck.scale,
        flip: duck.dir === -1,
        frame: 0,
        frameTimer: 0,
        frameRate: 24,
        vy: 140
      });
    }

    this.targetsShotInWave++;
    if (this.targetsShotInWave >= 15 + this.wave * 3) {
      this.wave++;
      this.targetsShotInWave = 0;
      this.sound.playSound('eggs');
      this.triggerWaveAnnouncement(`WAVE ${this.wave} UNLOCKED!`);
      if (this.lives < this.maxLives) this.lives++;
      this.ammo = this.maxAmmo;
    }
  }

  detonateBomb(x, y) {
    this.sound.playSound('bomb');
    this.triggerScreenShake(26, 0.45);

    this.explosions.push({
      x: x,
      y: y,
      frame: 0,
      frameTimer: 0,
      scale: 2.2
    });

    for (let i = 0; i < 40; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 180 + Math.random() * 450;
      const color = Math.random() > 0.5 ? '#ff5722' : '#ffeb3b';
      this.particles.push(new Particle(
        x, y,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        color,
        6 + Math.random() * 8,
        0.8 + Math.random() * 0.4,
        'spark'
      ));
    }

    const blastRadius = 600;
    const ducksToKill = [];
    for (const otherDuck of this.ducks) {
      if (Math.hypot(otherDuck.x - x, otherDuck.y - y) < blastRadius) {
        ducksToKill.push(otherDuck);
      }
    }

    ducksToKill.forEach(d => {
      this.handleDuckHit(d, {
        accuracy: 'HIGH',
        score: 10,
        label: '💥 BLAST +10',
        color: '#ff5722'
      });
    });
  }

  handleEggHit(egg, hitInfo) {
    this.sound.playSound('eggs');

    const accuracyTier = hitInfo ? hitInfo.accuracy : 'HIGH';
    const accuracyBaseScore = hitInfo ? hitInfo.score : 10;
    const accuracyLabel = hitInfo ? hitInfo.label : '🎯 HIGH +10';
    const accuracyColor = hitInfo ? hitInfo.color : '#00e676';

    if (accuracyTier === 'HIGH') this.accuracyStats.high++;
    else if (accuracyTier === 'LOW_HIGH') this.accuracyStats.lowHigh++;
    else if (accuracyTier === 'MEDIUM') this.accuracyStats.medium++;
    else if (accuracyTier === 'LOW') this.accuracyStats.low++;

    this.lastShotRating = {
      accuracy: accuracyTier,
      score: accuracyBaseScore,
      label: accuracyLabel,
      color: accuracyColor
    };
    this.lastShotRatingTimer = 1.6;

    for (let i = 0; i < 18; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 90 + Math.random() * 240;
      this.particles.push(new Particle(
        egg.x, egg.y,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed - 60,
        '#fff9c4',
        5 + Math.random() * 6,
        0.8,
        'gold_sparkle'
      ));
    }

    if (egg.type.effect === 'freeze') {
      this.isFrozen = true;
      this.freezeTimer = egg.type.duration;
      this.floatingTexts.push(new FloatingText(`❄️ SLOW MOTION! (${accuracyLabel})`, egg.x, egg.y - 40, '#00e5ff', 42, true));
    } else if (egg.type.effect === 'life') {
      this.lives = Math.min(this.maxLives, this.lives + 1);
      this.floatingTexts.push(new FloatingText(`❤️ +1 LIFE! (${accuracyLabel})`, egg.x, egg.y - 40, '#ff1744', 42, true));
    } else {
      const pts = (egg.type.score + accuracyBaseScore) * (this.isFrenzy ? 2 : 1);
      this.score += pts;
      this.ammo = Math.min(this.maxAmmo, this.ammo + 2);
      this.floatingTexts.push(new FloatingText(`${accuracyLabel} & +2 AMMO! (+${pts})`, egg.x, egg.y - 40, '#ffd700', 36, true));
    }
  }

  triggerScreenShake(intensity, duration) {
    this.shakeAmount = intensity;
    this.shakeDuration = duration;
  }

  updateSpawners(dt) {
    const waveMultiplier = 1 + (this.wave - 1) * 0.08;
    const spawnInterval = Math.max(0.65, 1.8 / waveMultiplier);

    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      this.spawnTimer = spawnInterval + Math.random() * 0.5;
      this.spawnRandomDuck(waveMultiplier);
    }

    this.eggSpawnTimer -= dt;
    if (this.eggSpawnTimer <= 0) {
      this.eggSpawnTimer = 6.0 + Math.random() * 5.0;
      this.spawnBonusEgg();
    }
  }

  spawnRandomDuck(waveMultiplier) {
    const shelfIndex = Math.floor(Math.random() * SHELVES.length);
    const shelf = SHELVES[shelfIndex];

    let rand = Math.random() * 100;
    let chosenType = DUCK_TYPES[0];
    let cumulative = 0;

    for (const dt of DUCK_TYPES) {
      let weight = dt.weight;
      if (dt.golden && this.wave >= 2) weight += (this.wave * 2);
      if (dt.explosive && this.wave >= 3) weight += (this.wave * 1.5);

      cumulative += weight;
      if (rand <= cumulative) {
        chosenType = dt;
        break;
      }
    }

    const dir = shelf.dir;
    const startX = dir === 1 ? -150 : VIRTUAL_WIDTH + 150;
    const speed = chosenType.speed * shelf.speedMult * waveMultiplier;

    this.ducks.push(new DuckTarget(chosenType, startX, shelf.y, dir, speed, shelfIndex));
  }

  spawnBonusEgg() {
    const shelfIndex = Math.floor(Math.random() * SHELVES.length);
    const shelf = SHELVES[shelfIndex];
    const eggType = EGG_TYPES[Math.floor(Math.random() * EGG_TYPES.length)];

    const dir = -shelf.dir;
    const startX = dir === 1 ? -120 : VIRTUAL_WIDTH + 120;
    const speed = 160 + Math.random() * 80;

    this.eggs.push(new BonusEgg(eggType, startX, shelf.y - 30, dir, speed, shelfIndex));
  }

  update(dt) {
    this.ambientTime += dt;
    this.sunlightAngle += dt * 0.15;

    if (this.recoilY > 0) {
      this.recoilY = Math.max(0, this.recoilY - dt * 90);
    }
    if (this.muzzleFlashTimer > 0) {
      this.muzzleFlashTimer -= dt;
    }

    if (this.shakeDuration > 0) {
      this.shakeDuration -= dt;
      if (this.shakeDuration <= 0) this.shakeAmount = 0;
    }

    if (this.isReloading) {
      this.reloadTimer -= dt;
      this.cylinderRotation += dt * 16;
      if (this.reloadTimer <= 0) {
        this.isReloading = false;
        this.ammo = this.maxAmmo;
      }
    }

    if (this.state === 'PLAYING') {
      let effectiveDt = dt;
      if (this.isFrozen) {
        this.freezeTimer -= dt;
        effectiveDt = dt * 0.35;
        if (this.freezeTimer <= 0) this.isFrozen = false;
      }

      if (this.isFrenzy) {
        this.frenzyTimer -= dt;
        if (this.frenzyTimer <= 0) this.isFrenzy = false;
      }

      if (this.comboTimer > 0) {
        this.comboTimer -= dt;
        if (this.comboTimer <= 0) {
          this.combo = 0;
          this.isFrenzy = false;
        }
      }

      if (this.lastShotRatingTimer > 0) {
        this.lastShotRatingTimer -= dt;
        if (this.lastShotRatingTimer <= 0) {
          this.lastShotRating = null;
        }
      }

      this.updateSpawners(dt);

      for (let i = this.ducks.length - 1; i >= 0; i--) {
        const duck = this.ducks[i];
        const alive = duck.update(effectiveDt);

        if (!alive) {
          this.ducks.splice(i, 1);
          if (!duck.type.explosive) {
            this.lives--;
            this.triggerScreenShake(14, 0.25);
            this.floatingTexts.push(new FloatingText('ESCAPED! -1 LIFE', duck.x > VIRTUAL_WIDTH / 2 ? VIRTUAL_WIDTH - 200 : 200, duck.y, '#ff1744', 36));

            if (this.lives <= 0) {
              this.gameOver();
              break;
            }
          }
        }
      }

      for (let i = this.eggs.length - 1; i >= 0; i--) {
        const egg = this.eggs[i];
        if (!egg.update(effectiveDt)) {
          this.eggs.splice(i, 1);
        }
      }

      for (let i = this.dyingDucks.length - 1; i >= 0; i--) {
        const dd = this.dyingDucks[i];
        dd.frameTimer += dt * dd.frameRate;
        dd.y += dd.vy * dt;
        dd.vy += 320 * dt;
        dd.frame = Math.floor(dd.frameTimer);

        if (dd.frame > 12 || dd.y > VIRTUAL_HEIGHT + 200) {
          this.dyingDucks.splice(i, 1);
        }
      }

      for (let i = this.explosions.length - 1; i >= 0; i--) {
        const exp = this.explosions[i];
        exp.frameTimer += dt * 18;
        exp.frame = Math.floor(exp.frameTimer);
        if (exp.frame > 6) {
          this.explosions.splice(i, 1);
        }
      }
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      if (!this.particles[i].update(dt)) {
        this.particles.splice(i, 1);
      }
    }

    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      if (!this.floatingTexts[i].update(dt)) {
        this.floatingTexts.splice(i, 1);
      }
    }

    for (let i = this.bulletDecals.length - 1; i >= 0; i--) {
      if (!this.bulletDecals[i].update(dt)) {
        this.bulletDecals.splice(i, 1);
      }
    }
  }

  gameOver() {
    this.state = 'GAMEOVER';
    this.triggerScreenShake(20, 0.4);
    this.sound.stopMusic();

    // Submit score to backend server via ScoreAPI
    if (typeof window !== 'undefined' && window.ScoreAPI && typeof window.ScoreAPI.sendScore === 'function') {
      const accuracy = this.totalShots > 0 ? Math.round((this.totalHits / this.totalShots) * 100) : 0;
      window.ScoreAPI.sendScore({
        score: this.score,
        bestScore: this.bestScore,
        wave: this.wave,
        accuracy: accuracy,
        accuracyStats: { ...this.accuracyStats },
        totalShots: this.totalShots,
        totalHits: this.totalHits,
        maxCombo: this.maxCombo
      }).then(res => {
        console.log('[DuckShooter] Score submitted to backend:', res);
      }).catch(err => {
        console.warn('[DuckShooter] Score submission queued or error:', err);
      });
    }

    if (this.score >= this.bestScore && this.score > 0) {
      for (let i = 0; i < 60; i++) {
        const colors = ['#ffd700', '#ff4081', '#00e676', '#00e5ff', '#ff9100'];
        this.particles.push(new Particle(
          VIRTUAL_WIDTH / 2,
          700,
          (Math.random() - 0.5) * 600,
          -200 - Math.random() * 400,
          colors[Math.floor(Math.random() * colors.length)],
          12 + Math.random() * 8,
          2.5 + Math.random() * 1.0,
          'spark'
        ));
      }
    }
  }

  render() {
    const ctx = this.ctx;
    ctx.save();

    if (this.shakeAmount > 0) {
      const ox = (Math.random() - 0.5) * this.shakeAmount;
      const oy = (Math.random() - 0.5) * this.shakeAmount;
      ctx.translate(ox, oy);
    }

    this.drawBackground(ctx);

    const bulletHoleImgs = [0, 1, 2, 3, 4, 5].map(i => this.assets.images[`bullet_hole_${i}`]);
    for (const decal of this.bulletDecals) {
      decal.draw(ctx, bulletHoleImgs);
    }

    this.drawGalleryShelvesAndTargets(ctx);
    this.drawDyingDucks(ctx);
    this.drawExplosions(ctx);

    for (const p of this.particles) {
      p.draw(ctx);
    }

    for (const ft of this.floatingTexts) {
      ft.draw(ctx);
    }

    this.drawCurtains(ctx);
    this.drawPlayerCounter(ctx);

    if (this.state === 'PLAYING' || this.state === 'PAUSED') {
      this.drawHUD(ctx);
    }

    if (this.state === 'LOADING') {
      this.drawLoadingScreen(ctx);
    } else if (this.state === 'MENU') {
      this.drawMenuScreen(ctx);
    } else if (this.state === 'PAUSED') {
      this.drawPauseOverlay(ctx);
    } else if (this.state === 'GAMEOVER') {
      this.drawGameOverScreen(ctx);
    }

    this.drawCrosshair(ctx);

    ctx.restore();
  }

  drawBackground(ctx) {
    const bgImg = this.assets.images.background;
    if (bgImg && bgImg.complete) {
      ctx.drawImage(bgImg, -420, 0, 1920, VIRTUAL_HEIGHT);
    } else {
      const grad = ctx.createLinearGradient(0, 0, 0, VIRTUAL_HEIGHT);
      grad.addColorStop(0, '#2d140a');
      grad.addColorStop(0.5, '#421d0d');
      grad.addColorStop(1, '#1b0b05');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, VIRTUAL_WIDTH, VIRTUAL_HEIGHT);
    }

    const spotGrad = ctx.createRadialGradient(VIRTUAL_WIDTH / 2, 900, 100, VIRTUAL_WIDTH / 2, 900, 800);
    spotGrad.addColorStop(0, 'rgba(255, 200, 120, 0.18)');
    spotGrad.addColorStop(0.6, 'rgba(180, 80, 20, 0.08)');
    spotGrad.addColorStop(1, 'rgba(0, 0, 0, 0.45)');
    ctx.fillStyle = spotGrad;
    ctx.fillRect(0, 0, VIRTUAL_WIDTH, VIRTUAL_HEIGHT);

    const sunImg = this.assets.images.sunlight;
    if (sunImg && sunImg.complete) {
      ctx.save();
      ctx.globalAlpha = 0.28 + Math.sin(this.ambientTime * 1.2) * 0.08;
      ctx.translate(VIRTUAL_WIDTH / 2, 700);
      ctx.rotate(this.sunlightAngle);
      ctx.drawImage(sunImg, -sunImg.width / 2, -sunImg.height / 2);
      ctx.restore();
    }
  }

  drawGalleryShelvesAndTargets(ctx) {
    SHELVES.forEach((shelf, index) => {
      const shelfDucks = this.ducks.filter(d => d.shelfIndex === index);
      const shelfEggs = this.eggs.filter(e => e.shelfIndex === index);

      shelfDucks.forEach(duck => {
        duck.draw(ctx, this.assets.images, this.ambientTime);
      });

      shelfEggs.forEach(egg => {
        egg.draw(ctx, this.assets.images, this.ambientTime);
      });

      ctx.save();
      ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
      ctx.fillRect(0, shelf.y + 4, VIRTUAL_WIDTH, 24);

      const railGrad = ctx.createLinearGradient(0, shelf.y - 12, 0, shelf.y + 16);
      railGrad.addColorStop(0, '#8d4520');
      railGrad.addColorStop(0.3, '#b85d2e');
      railGrad.addColorStop(0.7, '#6b3215');
      railGrad.addColorStop(1, '#3b1808');
      ctx.fillStyle = railGrad;
      ctx.fillRect(0, shelf.y - 12, VIRTUAL_WIDTH, 24);

      ctx.fillStyle = '#ffca28';
      ctx.fillRect(0, shelf.y - 12, VIRTUAL_WIDTH, 3);

      for (let rx = 50; rx < VIRTUAL_WIDTH; rx += 140) {
        ctx.beginPath();
        ctx.arc(rx, shelf.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#ffd54f';
        ctx.fill();
        ctx.strokeStyle = '#5d2c0e';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      ctx.restore();
    });
  }

  drawDyingDucks(ctx) {
    for (const dd of this.dyingDucks) {
      const frameKey = `duck_${dd.duckType.id}_die_${Math.min(12, dd.frame)}`;
      const img = this.assets.images[frameKey];
      if (!img || !img.complete) continue;

      ctx.save();
      ctx.translate(dd.x, dd.y);
      if (dd.flip) ctx.scale(-1, 1);
      ctx.scale(dd.scale, dd.scale);

      if (dd.duckType.golden) {
        ctx.shadowColor = '#ffd700';
        ctx.shadowBlur = 20;
      }

      ctx.drawImage(img, -img.width / 2, -img.height / 2);
      ctx.restore();
    }
  }

  drawExplosions(ctx) {
    for (const exp of this.explosions) {
      const img = this.assets.images[`explosion_${Math.min(6, exp.frame)}`];
      if (!img || !img.complete) continue;

      ctx.save();
      ctx.translate(exp.x, exp.y);
      ctx.scale(exp.scale, exp.scale);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);

      const ringRadius = (exp.frame / 6) * 180;
      ctx.beginPath();
      ctx.arc(0, 0, ringRadius, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255, 235, 59, ${1.0 - exp.frame / 6})`;
      ctx.lineWidth = 6;
      ctx.stroke();

      ctx.restore();
    }
  }

  drawCurtains(ctx) {
    const topImg = this.assets.images.curtainTop;
    if (topImg && topImg.complete) {
      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
      ctx.shadowBlur = 30;
      ctx.shadowOffsetY = 15;
      ctx.drawImage(topImg, 0, -40, VIRTUAL_WIDTH, 340);
      ctx.restore();
    }
  }

  drawPlayerCounter(ctx) {
    ctx.save();
    const deckY = 1620;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, deckY - 20, VIRTUAL_WIDTH, 20);

    const counterGrad = ctx.createLinearGradient(0, deckY, 0, VIRTUAL_HEIGHT);
    counterGrad.addColorStop(0, '#4a1e0c');
    counterGrad.addColorStop(0.08, '#6b2e14');
    counterGrad.addColorStop(0.3, '#54220c');
    counterGrad.addColorStop(1, '#200a03');
    ctx.fillStyle = counterGrad;
    ctx.fillRect(0, deckY, VIRTUAL_WIDTH, VIRTUAL_HEIGHT - deckY);

    const brassGrad = ctx.createLinearGradient(0, deckY, 0, deckY + 12);
    brassGrad.addColorStop(0, '#ffe082');
    brassGrad.addColorStop(0.5, '#ffb300');
    brassGrad.addColorStop(1, '#ff8f00');
    ctx.fillStyle = brassGrad;
    ctx.fillRect(0, deckY, VIRTUAL_WIDTH, 12);

    this.drawRevolverCylinder(ctx, 540, 1770);

    if (this.ammo <= 0 && !this.isReloading) {
      const pulse = 1.0 + Math.sin(this.ambientTime * 10) * 0.15;
      ctx.save();
      ctx.translate(540, 1665);
      ctx.scale(pulse, pulse);
      ctx.font = '900 36px "Trebuchet MS", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ff1744';
      ctx.shadowColor = '#d50000';
      ctx.shadowBlur = 15;
      ctx.fillText('⚡ TAP OR PRESS SPACE TO RELOAD ⚡', 0, 0);
      ctx.restore();
    } else if (this.isReloading) {
      ctx.font = '700 32px "Trebuchet MS", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffb300';
      ctx.fillText('RELOADING CYLINDER...', 540, 1665);
    }

    ctx.textAlign = 'left';
    ctx.font = '900 30px "Trebuchet MS", sans-serif';
    ctx.fillStyle = '#ffca28';
    ctx.fillText('LIVES:', 60, 1725);
    for (let i = 0; i < this.maxLives; i++) {
      const heartX = 75 + i * 65;
      const heartY = 1775;
      ctx.font = '48px "Segoe UI Emoji", sans-serif';
      if (i < this.lives) {
        ctx.fillStyle = '#ff1744';
        ctx.shadowColor = '#d50000';
        ctx.shadowBlur = 12;
        ctx.fillText('❤️', heartX, heartY);
      } else {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.shadowBlur = 0;
        ctx.fillText('🖤', heartX, heartY);
      }
    }

    ctx.textAlign = 'right';
    ctx.font = '900 32px "Trebuchet MS", sans-serif';
    ctx.fillStyle = '#ffd54f';
    ctx.shadowBlur = 0;
    ctx.fillText(`WAVE ${this.wave}`, 1020, 1730);

    const accuracy = this.totalShots > 0 ? Math.round((this.totalHits / this.totalShots) * 100) : 100;
    ctx.font = '600 24px "Trebuchet MS", sans-serif';
    ctx.fillStyle = '#ffecb3';
    ctx.fillText(`ACCURACY: ${accuracy}%`, 1020, 1770);
    ctx.fillText(`BEST COMBO: x${this.maxCombo}`, 1020, 1805);

    ctx.restore();
  }

  drawRevolverCylinder(ctx, cx, cy) {
    ctx.save();
    ctx.translate(cx, cy);

    const cylGrad = ctx.createRadialGradient(0, 0, 20, 0, 0, 85);
    cylGrad.addColorStop(0, '#616161');
    cylGrad.addColorStop(0.7, '#212121');
    cylGrad.addColorStop(1, '#000000');
    ctx.fillStyle = cylGrad;
    ctx.beginPath();
    ctx.arc(0, 0, 75, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#9e9e9e';
    ctx.lineWidth = 4;
    ctx.stroke();

    const rot = this.cylinderRotation;
    for (let i = 0; i < this.maxAmmo; i++) {
      const angle = rot + (i * Math.PI * 2) / this.maxAmmo;
      const bx = Math.cos(angle) * 44;
      const by = Math.sin(angle) * 44;

      ctx.beginPath();
      ctx.arc(bx, by, 16, 0, Math.PI * 2);
      ctx.fillStyle = '#111111';
      ctx.fill();

      if (i < this.ammo && !this.isReloading) {
        const bGrad = ctx.createRadialGradient(bx, by, 2, bx, by, 14);
        bGrad.addColorStop(0, '#fff59d');
        bGrad.addColorStop(0.6, '#fbc02d');
        bGrad.addColorStop(1, '#b58105');
        ctx.fillStyle = bGrad;
        ctx.beginPath();
        ctx.arc(bx, by, 13, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.arc(bx, by, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#ff7043';
        ctx.fill();
      }
    }

    ctx.beginPath();
    ctx.arc(0, 0, 14, 0, Math.PI * 2);
    ctx.fillStyle = '#424242';
    ctx.fill();
    ctx.strokeStyle = '#bdbdbd';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.restore();
  }

  drawHUD(ctx) {
    ctx.save();

    const hudY = 110;

    ctx.textAlign = 'left';
    ctx.font = '900 24px "Trebuchet MS", sans-serif';
    ctx.fillStyle = '#ffb300';
    ctx.fillText('SCORE', 60, hudY);
    ctx.font = '900 54px "Trebuchet MS", "Impact", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 6;
    ctx.strokeText(`${this.score}`, 60, hudY + 50);
    ctx.fillText(`${this.score}`, 60, hudY + 50);

    ctx.textAlign = 'center';
    ctx.font = '900 22px "Trebuchet MS", sans-serif';
    ctx.fillStyle = '#ffca28';
    ctx.fillText('BEST SCORE', VIRTUAL_WIDTH / 2 - 50, hudY);
    ctx.font = '900 40px "Trebuchet MS", sans-serif';
    ctx.fillStyle = '#ffd54f';
    ctx.strokeText(`${Math.max(this.score, this.bestScore)}`, VIRTUAL_WIDTH / 2 - 50, hudY + 45);
    ctx.fillText(`${Math.max(this.score, this.bestScore)}`, VIRTUAL_WIDTH / 2 - 50, hudY + 45);

    if (this.combo > 1) {
      const comboRatio = Math.max(0, this.comboTimer / this.comboWindow);
      const barX = 60;
      const barY = hudY + 75;
      const barW = 280;
      const barH = 16;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.fillRect(barX, barY, barW, barH);

      const comboGrad = ctx.createLinearGradient(barX, 0, barX + barW, 0);
      comboGrad.addColorStop(0, '#ffd700');
      comboGrad.addColorStop(1, '#ff3d00');
      ctx.fillStyle = comboGrad;
      ctx.fillRect(barX, barY, barW * comboRatio, barH);

      ctx.font = '900 24px "Trebuchet MS", sans-serif';
      ctx.fillStyle = '#ffd54f';
      ctx.textAlign = 'left';
      ctx.fillText(`COMBO x${Math.min(this.combo, 5)}!`, barX + barW + 15, barY + 14);
    }

    if (this.lastShotRating && this.lastShotRatingTimer > 0) {
      const fadeAlpha = Math.min(1, this.lastShotRatingTimer / 0.3);
      ctx.save();
      ctx.globalAlpha = fadeAlpha;
      const badgeX = 60;
      const badgeY = this.combo > 1 ? hudY + 105 : hudY + 75;
      const badgeW = 270;
      const badgeH = 36;

      ctx.fillStyle = 'rgba(20, 10, 5, 0.88)';
      ctx.beginPath();
      ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 10);
      ctx.fill();
      ctx.strokeStyle = this.lastShotRating.color || '#ffd54f';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      ctx.font = '900 21px "Trebuchet MS", sans-serif';
      ctx.fillStyle = this.lastShotRating.color || '#ffd54f';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`HIT: ${this.lastShotRating.label}`, badgeX + badgeW / 2, badgeY + badgeH / 2 + 1);
      ctx.restore();
    }

    this.drawCircleButton(ctx, 980, 130, 38, '⏸️');
    this.drawCircleButton(ctx, 870, 130, 34, this.sound.soundEnabled ? '🔊' : '🔇');
    this.drawCircleButton(ctx, 760, 130, 34, this.sound.musicEnabled ? '🎵' : '🎶');

    if (this.isFrenzy) {
      const frenzyGlow = 0.5 + Math.sin(this.ambientTime * 12) * 0.4;
      ctx.strokeStyle = `rgba(255, 215, 0, ${frenzyGlow})`;
      ctx.lineWidth = 18;
      ctx.strokeRect(9, 9, VIRTUAL_WIDTH - 18, VIRTUAL_HEIGHT - 18);

      ctx.textAlign = 'center';
      ctx.font = '900 48px "Trebuchet MS", "Impact", sans-serif';
      ctx.fillStyle = '#ffeb3b';
      ctx.shadowColor = '#ff9800';
      ctx.shadowBlur = 25;
      ctx.fillText('🔥 FRENZY FEVER MODE (2X POINTS!) 🔥', VIRTUAL_WIDTH / 2, 280);
    }

    if (this.isFrozen) {
      ctx.strokeStyle = 'rgba(0, 229, 255, 0.45)';
      ctx.lineWidth = 14;
      ctx.strokeRect(7, 7, VIRTUAL_WIDTH - 14, VIRTUAL_HEIGHT - 14);
    }

    ctx.restore();
  }

  drawCircleButton(ctx, x, y, r, icon) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(40, 20, 10, 0.85)';
    ctx.fill();
    ctx.strokeStyle = '#e65100';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.font = `${Math.floor(r * 1.1)}px "Segoe UI Emoji", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(icon, x, y + 2);
    ctx.restore();
  }

  drawLoadingScreen(ctx) {
    ctx.save();
    ctx.fillStyle = '#120703';
    ctx.fillRect(0, 0, VIRTUAL_WIDTH, VIRTUAL_HEIGHT);

    const progress = this.assets.total > 0 ? this.assets.loaded / this.assets.total : 0;

    ctx.textAlign = 'center';
    ctx.font = '900 64px "Trebuchet MS", "Impact", sans-serif';
    ctx.fillStyle = '#ffd54f';
    ctx.shadowColor = '#ff6f00';
    ctx.shadowBlur = 25;
    ctx.fillText('DUCK SHOOTER', VIRTUAL_WIDTH / 2, 850);
    ctx.font = '700 32px "Trebuchet MS", sans-serif';
    ctx.fillStyle = '#ffecb3';
    ctx.fillText('INFINITE CARNIVAL ARCADE', VIRTUAL_WIDTH / 2, 910);

    const bw = 600;
    const bh = 30;
    const bx = (VIRTUAL_WIDTH - bw) / 2;
    const by = 1000;

    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.fillRect(bx, by, bw, bh);
    ctx.strokeStyle = '#ff9800';
    ctx.lineWidth = 3;
    ctx.strokeRect(bx, by, bw, bh);

    ctx.fillStyle = '#00e676';
    ctx.fillRect(bx + 3, by + 3, (bw - 6) * progress, bh - 6);

    ctx.font = '600 24px "Trebuchet MS", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`LOADING CARNIVAL ATTRACTION... ${Math.round(progress * 100)}%`, VIRTUAL_WIDTH / 2, by + 75);

    ctx.restore();
  }

  drawMenuScreen(ctx) {
    ctx.save();
    ctx.fillStyle = 'rgba(10, 5, 2, 0.55)';
    ctx.fillRect(0, 0, VIRTUAL_WIDTH, VIRTUAL_HEIGHT);

    const logoImg = this.assets.images.logo;
    const logoY = 620 + Math.sin(this.ambientTime * 2.5) * 16;
    if (logoImg && logoImg.complete) {
      const lw = 840;
      const lh = (logoImg.height / logoImg.width) * lw;
      ctx.drawImage(logoImg, (VIRTUAL_WIDTH - lw) / 2, logoY - lh / 2, lw, lh);
    } else {
      ctx.textAlign = 'center';
      ctx.font = '900 82px "Trebuchet MS", "Impact", sans-serif';
      ctx.fillStyle = '#ffd54f';
      ctx.fillText('DUCK SHOOTER', VIRTUAL_WIDTH / 2, logoY);
    }

    ctx.textAlign = 'center';
    ctx.font = '900 36px "Trebuchet MS", sans-serif';
    ctx.fillStyle = '#ffca28';
    ctx.fillText(`🏆 ALL-TIME BEST: ${this.bestScore}`, VIRTUAL_WIDTH / 2, 880);

    const btnPulse = 1.0 + Math.sin(this.ambientTime * 3.5) * 0.05;
    const playImg = this.assets.images.btnPlay;
    ctx.save();
    ctx.translate(VIRTUAL_WIDTH / 2, 1140);
    ctx.scale(btnPulse, btnPulse);
    if (playImg && playImg.complete) {
      ctx.drawImage(playImg, -140, -140, 280, 280);
    } else {
      ctx.beginPath();
      ctx.arc(0, 0, 130, 0, Math.PI * 2);
      ctx.fillStyle = '#e65100';
      ctx.fill();
      ctx.strokeStyle = '#ffd54f';
      ctx.lineWidth = 8;
      ctx.stroke();
      ctx.font = '900 54px "Trebuchet MS", sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText('PLAY', 0, 18);
    }
    ctx.restore();

    ctx.font = '600 26px "Trebuchet MS", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('🎯 TAP OR CLICK TARGETS TO SHOOT', VIRTUAL_WIDTH / 2, 1380);
    ctx.fillText('💥 COMBO STREAKS UNLOCK FRENZY MODE!', VIRTUAL_WIDTH / 2, 1425);
    ctx.fillText('💣 EXPLODE BOMBS • ⭐ SHOOT MYSTERY EGGS', VIRTUAL_WIDTH / 2, 1470);
    ctx.fillText('🔄 SPACEBAR OR TAP DECK TO RELOAD', VIRTUAL_WIDTH / 2, 1515);

    this.drawCircleButton(ctx, 960, 1800, 42, this.sound.soundEnabled ? '🔊' : '🔇');
    this.drawCircleButton(ctx, 840, 1800, 42, this.sound.musicEnabled ? '🎵' : '🎶');

    ctx.restore();
  }

  drawPauseOverlay(ctx) {
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.78)';
    ctx.fillRect(0, 0, VIRTUAL_WIDTH, VIRTUAL_HEIGHT);

    ctx.textAlign = 'center';
    ctx.font = '900 72px "Trebuchet MS", sans-serif';
    ctx.fillStyle = '#ffd54f';
    ctx.fillText('GAME PAUSED', VIRTUAL_WIDTH / 2, 750);

    this.drawMenuTextButton(ctx, VIRTUAL_WIDTH / 2, 950, 360, 90, 'RESUME', '#43a047');
    this.drawMenuTextButton(ctx, VIRTUAL_WIDTH / 2, 1150, 360, 90, 'RESTART', '#e65100');
    this.drawMenuTextButton(ctx, VIRTUAL_WIDTH / 2, 1320, 360, 90, 'MAIN MENU', '#5d4037');

    ctx.restore();
  }

  drawGameOverScreen(ctx) {
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.82)';
    ctx.fillRect(0, 0, VIRTUAL_WIDTH, VIRTUAL_HEIGHT);

    const goImg = this.assets.images.gameover;
    const goY = 620 + Math.sin(this.ambientTime * 3) * 12;
    if (goImg && goImg.complete) {
      const gw = 820;
      const gh = (goImg.height / goImg.width) * gw;
      ctx.drawImage(goImg, (VIRTUAL_WIDTH - gw) / 2, goY - gh / 2, gw, gh);
    } else {
      ctx.textAlign = 'center';
      ctx.font = '900 84px "Trebuchet MS", "Impact", sans-serif';
      ctx.fillStyle = '#d32f2f';
      ctx.fillText('GAME OVER', VIRTUAL_WIDTH / 2, goY);
    }

    ctx.textAlign = 'center';
    ctx.font = '900 36px "Trebuchet MS", sans-serif';
    ctx.fillStyle = '#ffb300';
    ctx.fillText('FINAL SCORE', VIRTUAL_WIDTH / 2, 820);

    ctx.font = '900 80px "Trebuchet MS", "Impact", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 10;
    ctx.strokeText(`${this.score}`, VIRTUAL_WIDTH / 2, 910);
    ctx.fillText(`${this.score}`, VIRTUAL_WIDTH / 2, 910);

    if (this.score >= this.bestScore && this.score > 0) {
      ctx.font = '900 42px "Trebuchet MS", sans-serif';
      ctx.fillStyle = '#00e676';
      ctx.shadowColor = '#00e676';
      ctx.shadowBlur = 20;
      ctx.fillText('🎉 NEW ALL-TIME RECORD! 🎉', VIRTUAL_WIDTH / 2, 980);
      ctx.shadowBlur = 0;
    } else {
      ctx.font = '700 32px "Trebuchet MS", sans-serif';
      ctx.fillStyle = '#ffd54f';
      ctx.fillText(`BEST SCORE: ${this.bestScore}`, VIRTUAL_WIDTH / 2, 980);
    }

    const accuracy = this.totalShots > 0 ? Math.round((this.totalHits / this.totalShots) * 100) : 0;

    // Shot Accuracy Breakdown Card
    const cardX = (VIRTUAL_WIDTH - 920) / 2;
    const cardY = 1020;
    const cardW = 920;
    const cardH = 175;

    ctx.fillStyle = 'rgba(25, 12, 6, 0.9)';
    ctx.beginPath();
    ctx.roundRect(cardX, cardY, cardW, cardH, 18);
    ctx.fill();
    ctx.strokeStyle = '#ffd54f';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.font = '900 24px "Trebuchet MS", sans-serif';
    ctx.fillStyle = '#ffca28';
    ctx.textAlign = 'center';
    ctx.fillText('SHOT ACCURACY BREAKDOWN', VIRTUAL_WIDTH / 2, cardY + 34);

    const cols = [
      { label: '🎯 HIGH (10)', count: this.accuracyStats.high, color: '#00e676' },
      { label: '⚡ LOW HIGH (8)', count: this.accuracyStats.lowHigh, color: '#76ff03' },
      { label: '👍 MEDIUM (6)', count: this.accuracyStats.medium, color: '#ffeb3b' },
      { label: '👌 LOW (4)', count: this.accuracyStats.low, color: '#ff9800' }
    ];

    const colW = cardW / 4;
    cols.forEach((col, idx) => {
      const cx = cardX + colW * idx + colW / 2;
      ctx.font = '700 20px "Trebuchet MS", sans-serif';
      ctx.fillStyle = col.color;
      ctx.fillText(col.label, cx, cardY + 72);

      ctx.font = '900 38px "Trebuchet MS", sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(`${col.count}`, cx, cardY + 115);
    });

    ctx.font = '600 22px "Trebuchet MS", sans-serif';
    ctx.fillStyle = '#ffecb3';
    ctx.fillText(`WAVE: ${this.wave}   •   ACCURACY: ${accuracy}%   •   MAX COMBO: x${this.maxCombo}`, VIRTUAL_WIDTH / 2, cardY + 152);

    // Backend Score Sync Status
    if (typeof window !== 'undefined' && window.ScoreAPI) {
      const apiStatus = window.ScoreAPI.getStatus();
      ctx.font = '600 22px "Trebuchet MS", sans-serif';
      ctx.textAlign = 'center';
      if (apiStatus.status === 'sending') {
        ctx.fillStyle = '#00e5ff';
        ctx.fillText('☁️ Syncing score to backend...', VIRTUAL_WIDTH / 2, cardY + 200);
      } else if (apiStatus.status === 'synced') {
        ctx.fillStyle = '#00e676';
        ctx.fillText('✓ Score synced to backend server', VIRTUAL_WIDTH / 2, cardY + 200);
      } else if (apiStatus.status === 'queued') {
        ctx.fillStyle = '#ffca28';
        ctx.fillText('📦 Score saved offline (queued for backend)', VIRTUAL_WIDTH / 2, cardY + 200);
      }
    }

    const btnPulse = 1.0 + Math.sin(this.ambientTime * 4) * 0.04;
    ctx.save();
    ctx.translate(540, 1265);
    ctx.scale(btnPulse, btnPulse);
    const restartImg = this.assets.images.btnRestart;
    if (restartImg && restartImg.complete) {
      ctx.drawImage(restartImg, -90, -90, 180, 180);
    } else {
      this.drawMenuTextButton(ctx, 0, 0, 320, 80, 'PLAY AGAIN', '#e65100');
    }
    ctx.restore();

    this.drawCircleButton(ctx, 540, 1480, 50, '🏠');

    ctx.restore();
  }

  drawMenuTextButton(ctx, x, y, w, h, text, color) {
    ctx.save();
    ctx.translate(x - w / 2, y - h / 2);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(0, 0, w, h, 16);
    ctx.fill();
    ctx.strokeStyle = '#ffd54f';
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.font = '900 36px "Trebuchet MS", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(text, w / 2, h / 2);
    ctx.restore();
  }

  drawCrosshair(ctx) {
    const x = this.crosshairX;
    const y = this.crosshairY - this.recoilY;

    if (this.muzzleFlashTimer > 0) {
      ctx.save();
      const flashGrad = ctx.createRadialGradient(this.muzzleFlashX, this.muzzleFlashY, 10, this.muzzleFlashX, this.muzzleFlashY, 80);
      flashGrad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
      flashGrad.addColorStop(0.3, 'rgba(255, 215, 0, 0.8)');
      flashGrad.addColorStop(1, 'rgba(255, 87, 34, 0)');
      ctx.fillStyle = flashGrad;
      ctx.beginPath();
      ctx.arc(this.muzzleFlashX, this.muzzleFlashY, 80, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    const cursorImg = this.assets.images.cursor;
    if (cursorImg && cursorImg.complete) {
      ctx.drawImage(cursorImg, x - cursorImg.width / 2, y - cursorImg.height / 2);
    } else {
      ctx.save();
      ctx.strokeStyle = '#ff1744';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(x, y, 28, 0, Math.PI * 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#ff1744';
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(x - 38, y); ctx.lineTo(x - 14, y);
      ctx.moveTo(x + 14, y); ctx.lineTo(x + 38, y);
      ctx.moveTo(x, y - 38); ctx.lineTo(x, y - 14);
      ctx.moveTo(x, y + 14); ctx.lineTo(x, y + 38);
      ctx.stroke();
      ctx.restore();
    }
  }

  gameLoop(timestamp) {
    const dt = Math.min((timestamp - this.lastTime) / 1000, 0.1);
    this.lastTime = timestamp;

    this.update(dt);
    this.render();

    requestAnimationFrame(this.gameLoop.bind(this));
  }
}

function startDuckShooterGame() {
  if (!window.duckShooterGame) {
    try {
      console.log('Initializing Duck Shooter Game...');
      window.duckShooterGame = new DuckShooterGame();
    } catch (e) {
      console.error('Duck Shooter startup error:', e);
    }
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startDuckShooterGame);
  window.addEventListener('load', startDuckShooterGame);
} else {
  startDuckShooterGame();
}
