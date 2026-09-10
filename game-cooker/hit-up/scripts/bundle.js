// Hit Up - Standalone Game Bundle (Works on both http:// and file://)
(function() {

// ===== scripts/audio.js =====
// scripts/audio.js - Procedural Web Audio synthesizer (No external audio files required!)
class SoundManager {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.bgmPlaying = false;
    this.bgmTimer = null;
    this.masterGain = null;
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.ctx = new AudioContext();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.6;
        this.masterGain.connect(this.ctx.destination);
        this.initialized = true;
      }
    } catch (e) {
      console.warn('Web Audio not supported:', e);
    }
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.masterGain) {
      this.masterGain.gain.value = this.muted ? 0 : 0.6;
    }
    return this.muted;
  }

  // --- SOUND EFFECTS ---

  // Player hammer swing whoosh
  playHammer() {
    if (this.muted || !this.ctx) return;
    this.resume();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, t);
    osc.frequency.exponentialRampToValueAtTime(80, t + 0.15);

    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.16);
  }

  // Wall / Box smash shatter
  playWallBreak() {
    if (this.muted || !this.ctx) return;
    this.resume();
    const t = this.ctx.currentTime;

    // Noise buffer for wood/stone crack
    const bufferSize = this.ctx.sampleRate * 0.25;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.2));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1400, t);
    filter.frequency.exponentialRampToValueAtTime(200, t + 0.2);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.8, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.25);

    // Deep impact sub
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(160, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.2);
    oscGain.gain.setValueAtTime(0.6, t);
    oscGain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.connect(oscGain);
    oscGain.connect(this.masterGain);

    noise.start(t);
    noise.stop(t + 0.25);
    osc.start(t);
    osc.stop(t + 0.2);
  }

  // Jump sound
  playJump() {
    if (this.muted || !this.ctx) return;
    this.resume();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(160, t);
    osc.frequency.exponentialRampToValueAtTime(480, t + 0.15);

    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.16);
  }

  // Footstep / land
  playLand() {
    if (this.muted || !this.ctx) return;
    this.resume();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(90, t);
    osc.frequency.exponentialRampToValueAtTime(30, t + 0.08);

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.08);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.09);
  }

  // Enemy hit / squeal
  playPigHit() {
    if (this.muted || !this.ctx) return;
    this.resume();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(550, t);
    osc.frequency.linearRampToValueAtTime(800, t + 0.08);
    osc.frequency.linearRampToValueAtTime(320, t + 0.18);

    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.18);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.19);
  }

  // Enemy defeated
  playPigDead() {
    if (this.muted || !this.ctx) return;
    this.resume();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(600, t);
    osc.frequency.exponentialRampToValueAtTime(100, t + 0.35);

    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.35);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.36);
  }

  // Pig repair placement / hammer tap
  playRepair() {
    if (this.muted || !this.ctx) return;
    this.resume();
    const t = this.ctx.currentTime;

    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.type = 'square';
    osc1.frequency.setValueAtTime(440, t);
    osc1.frequency.exponentialRampToValueAtTime(220, t + 0.08);
    gain1.gain.setValueAtTime(0.3, t);
    gain1.gain.exponentialRampToValueAtTime(0.01, t + 0.08);

    osc1.connect(gain1);
    gain1.connect(this.masterGain);
    osc1.start(t);
    osc1.stop(t + 0.09);

    // Second tap
    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(660, t + 0.09);
    osc2.frequency.exponentialRampToValueAtTime(330, t + 0.18);
    gain2.gain.setValueAtTime(0.3, t + 0.09);
    gain2.gain.exponentialRampToValueAtTime(0.01, t + 0.18);

    osc2.connect(gain2);
    gain2.connect(this.masterGain);
    osc2.start(t + 0.09);
    osc2.stop(t + 0.19);
  }

  // Bomb explosion
  playExplosion() {
    if (this.muted || !this.ctx) return;
    this.resume();
    const t = this.ctx.currentTime;

    const bufferSize = this.ctx.sampleRate * 0.6;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.35));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(900, t);
    filter.frequency.exponentialRampToValueAtTime(80, t + 0.5);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.9, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.6);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noise.start(t);
    noise.stop(t + 0.6);
  }

  // Cannon shot
  playCannon() {
    if (this.muted || !this.ctx) return;
    this.resume();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(240, t);
    osc.frequency.exponentialRampToValueAtTime(50, t + 0.25);

    gain.gain.setValueAtTime(0.8, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.25);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.26);
  }

  // Diamond pickup chime
  playGem() {
    if (this.muted || !this.ctx) return;
    this.resume();
    const t = this.ctx.currentTime;

    const notes = [587.33, 880, 1174.66]; // D5, A5, D6
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + idx * 0.05);

      gain.gain.setValueAtTime(0.25, t + idx * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, t + idx * 0.05 + 0.12);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t + idx * 0.05);
      osc.stop(t + idx * 0.05 + 0.13);
    });
  }

  // Heart pickup
  playHeart() {
    if (this.muted || !this.ctx) return;
    this.resume();
    const t = this.ctx.currentTime;
    const notes = [440, 554.37, 659.25, 880]; // A4, C#5, E5, A5
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t + idx * 0.06);
      gain.gain.setValueAtTime(0.3, t + idx * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.01, t + idx * 0.06 + 0.15);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t + idx * 0.06);
      osc.stop(t + idx * 0.06 + 0.16);
    });
  }

  // Player hurt
  playPlayerHurt() {
    if (this.muted || !this.ctx) return;
    this.resume();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(280, t);
    osc.frequency.exponentialRampToValueAtTime(90, t + 0.2);

    gain.gain.setValueAtTime(0.5, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.21);
  }

  // Stage clear fanfare
  playVictory() {
    if (this.muted || !this.ctx) return;
    this.resume();
    const t = this.ctx.currentTime;
    const melody = [
      { f: 523.25, d: 0.12, wait: 0 },
      { f: 659.25, d: 0.12, wait: 0.12 },
      { f: 783.99, d: 0.12, wait: 0.24 },
      { f: 1046.50, d: 0.35, wait: 0.36 }
    ];
    melody.forEach(n => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(n.f, t + n.wait);
      gain.gain.setValueAtTime(0.4, t + n.wait);
      gain.gain.exponentialRampToValueAtTime(0.01, t + n.wait + n.d);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t + n.wait);
      osc.stop(t + n.wait + n.d + 0.02);
    });
  }

  // Game over sound
  playGameOver() {
    if (this.muted || !this.ctx) return;
    this.resume();
    const t = this.ctx.currentTime;
    const notes = [
      { f: 440, w: 0 },
      { f: 415.3, w: 0.2 },
      { f: 392, w: 0.4 },
      { f: 349.2, w: 0.65 }
    ];
    notes.forEach(n => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(n.f, t + n.w);
      gain.gain.setValueAtTime(0.3, t + n.w);
      gain.gain.exponentialRampToValueAtTime(0.01, t + n.w + 0.25);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t + n.w);
      osc.stop(t + n.w + 0.26);
    });
  }

  // --- BACKGROUND MUSIC (Retro Chiptune Loop) ---
  startBGM() {
    if (this.bgmPlaying || !this.ctx) return;
    this.bgmPlaying = true;
    let step = 0;
    const tempo = 130;
    const beatSec = 60 / tempo / 2; // eighth notes

    const melody = [
      261.63, 0, 329.63, 0, 392.00, 0, 329.63, 0,
      440.00, 0, 392.00, 0, 329.63, 293.66, 261.63, 0,
      293.66, 0, 349.23, 0, 440.00, 0, 349.23, 0,
      392.00, 0, 329.63, 0, 261.63, 0, 196.00, 0
    ];
    const bass = [
      130.81, 130.81, 130.81, 130.81,
      174.61, 174.61, 174.61, 174.61,
      146.83, 146.83, 146.83, 146.83,
      196.00, 196.00, 196.00, 196.00
    ];

    const playNote = () => {
      if (!this.bgmPlaying || !this.ctx) return;
      if (!this.muted) {
        const t = this.ctx.currentTime;
        const melNote = melody[step % melody.length];
        const bassNote = bass[Math.floor(step / 2) % bass.length];

        if (melNote > 0) {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'square';
          osc.frequency.setValueAtTime(melNote, t);
          gain.gain.setValueAtTime(0.06, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + beatSec * 0.9);
          osc.connect(gain);
          gain.connect(this.masterGain);
          osc.start(t);
          osc.stop(t + beatSec * 0.95);
        }

        if (step % 2 === 0 && bassNote > 0) {
          const bOsc = this.ctx.createOscillator();
          const bGain = this.ctx.createGain();
          bOsc.type = 'triangle';
          bOsc.frequency.setValueAtTime(bassNote, t);
          bGain.gain.setValueAtTime(0.1, t);
          bGain.gain.exponentialRampToValueAtTime(0.01, t + beatSec * 1.8);
          bOsc.connect(bGain);
          bGain.connect(this.masterGain);
          bOsc.start(t);
          bOsc.stop(t + beatSec * 1.85);
        }
      }
      step++;
      this.bgmTimer = setTimeout(playNote, beatSec * 1000);
    };

    playNote();
  }

  stopBGM() {
    this.bgmPlaying = false;
    if (this.bgmTimer) {
      clearTimeout(this.bgmTimer);
      this.bgmTimer = null;
    }
  }
}



// ===== scripts/sprites.js =====
// scripts/sprites.js - Asset Preloader, Sprite Slicing & Animation Controller
class AssetManager {
  constructor() {
    this.images = {};
    this.loaded = 0;
    this.total = 0;
  }

  loadImage(key, src) {
    this.total++;
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        this.loaded++;
        this.images[key] = img;
        resolve(img);
      };
      img.onerror = () => {
        console.error('Failed to load image:', src);
        this.loaded++;
        resolve(null);
      };
      img.src = src;
    });
  }

  async loadAll(onProgress) {
    const assetList = [
      // King Human
      ['king_idle', 'assets/01-King Human/Idle (78x58).png'],
      ['king_run', 'assets/01-King Human/Run (78x58).png'],
      ['king_jump', 'assets/01-King Human/Jump (78x58).png'],
      ['king_fall', 'assets/01-King Human/Fall (78x58).png'],
      ['king_ground', 'assets/01-King Human/Ground (78x58).png'],
      ['king_attack', 'assets/01-King Human/Attack (78x58).png'],
      ['king_hit', 'assets/01-King Human/Hit (78x58).png'],
      ['king_dead', 'assets/01-King Human/Dead (78x58).png'],
      ['king_door_in', 'assets/01-King Human/Door In (78x58).png'],
      ['king_door_out', 'assets/01-King Human/Door Out (78x58).png'],

      // King Pig (Boss)
      ['king_pig_idle', 'assets/02-King Pig/Idle (38x28).png'],
      ['king_pig_run', 'assets/02-King Pig/Run (38x28).png'],
      ['king_pig_attack', 'assets/02-King Pig/Attack (38x28).png'],
      ['king_pig_hit', 'assets/02-King Pig/Hit (38x28).png'],
      ['king_pig_dead', 'assets/02-King Pig/Dead (38x28).png'],
      ['king_pig_jump', 'assets/02-King Pig/Jump (38x28).png'],
      ['king_pig_fall', 'assets/02-King Pig/Fall (38x28).png'],

      // Patrol Pig
      ['pig_idle', 'assets/03-Pig/Idle (34x28).png'],
      ['pig_run', 'assets/03-Pig/Run (34x28).png'],
      ['pig_attack', 'assets/03-Pig/Attack (34x28).png'],
      ['pig_hit', 'assets/03-Pig/Hit (34x28).png'],
      ['pig_dead', 'assets/03-Pig/Dead (34x28).png'],
      ['pig_jump', 'assets/03-Pig/Jump (34x28).png'],
      ['pig_fall', 'assets/03-Pig/Fall (34x28).png'],

      // Pig Throwing Box (Repairer Pig)
      ['pig_box_idle', 'assets/04-Pig Throwing a Box/Idle (26x30).png'],
      ['pig_box_picking', 'assets/04-Pig Throwing a Box/Picking Box (26x30).png'],
      ['pig_box_run', 'assets/04-Pig Throwing a Box/Run (26x30).png'],
      ['pig_box_throw', 'assets/04-Pig Throwing a Box/Throwing Box (26x30).png'],

      // Pig Throwing Bomb
      ['pig_bomb_idle', 'assets/05-Pig Thowing a Bomb/Idle (26x26).png'],
      ['pig_bomb_picking', 'assets/05-Pig Thowing a Bomb/Picking Bomb (26x26).png'],
      ['pig_bomb_run', 'assets/05-Pig Thowing a Bomb/Run (26x26).png'],
      ['pig_bomb_throw', 'assets/05-Pig Thowing a Bomb/Throwing Boom (26x26).png'],

      // Pig In Box
      ['pig_in_box_look', 'assets/06-Pig Hide in the Box/Looking Out (26x20).png'],
      ['pig_in_box_jump', 'assets/06-Pig Hide in the Box/Jump (26x20).png'],

      // Pig With Match & Cannon
      ['pig_match_light', 'assets/07-Pig With a Match/Lighting the Match (26x18).png'],
      ['pig_match_cannon', 'assets/07-Pig With a Match/Lighting the Cannon (26x18).png'],
      ['pig_match_on', 'assets/07-Pig With a Match/Match On (26x18).png'],
      ['cannon_idle', 'assets/10-Cannon/Idle.png'],
      ['cannon_shoot', 'assets/10-Cannon/Shoot (44x28).png'],
      ['cannon_ball', 'assets/10-Cannon/Cannon Ball.png'],

      // Box & Pieces
      ['box_idle', 'assets/08-Box/Idle.png'],
      ['box_hit', 'assets/08-Box/Hit.png'],
      ['box_piece_1', 'assets/08-Box/Box Pieces 1.png'],
      ['box_piece_2', 'assets/08-Box/Box Pieces 2.png'],
      ['box_piece_3', 'assets/08-Box/Box Pieces 3.png'],
      ['box_piece_4', 'assets/08-Box/Box Pieces 4.png'],

      // Bomb
      ['bomb_off', 'assets/09-Bomb/Bomb Off.png'],
      ['bomb_on', 'assets/09-Bomb/Bomb On (52x56).png'],
      ['bomb_boom', 'assets/09-Bomb/Boooooom (52x56).png'],

      // Door
      ['door_idle', 'assets/11-Door/Idle.png'],
      ['door_opening', 'assets/11-Door/Opening (46x56).png'],
      ['door_closing', 'assets/11-Door/Closiong (46x56).png'],

      // Live and Coins
      ['live_bar', 'assets/12-Live and Coins/Live Bar.png'],
      ['small_heart_idle', 'assets/12-Live and Coins/Small Heart Idle (18x14).png'],
      ['small_heart_hit', 'assets/12-Live and Coins/Small Heart Hit (18x14).png'],
      ['big_heart_idle', 'assets/12-Live and Coins/Big Heart Idle (18x14).png'],
      ['small_diamond', 'assets/12-Live and Coins/Small Diamond (18x14).png'],
      ['big_diamond_idle', 'assets/12-Live and Coins/Big Diamond Idle (18x14).png'],
      ['numbers', 'assets/12-Live and Coins/Numbers (6x8).png'],

      // Dialogues
      ['dialogue_alert_in', 'assets/13-Dialogue Boxes/!!! In (24x8).png'],
      ['dialogue_alert_out', 'assets/13-Dialogue Boxes/!!! Out (24x8).png'],
      ['dialogue_attack_in', 'assets/13-Dialogue Boxes/Attack In (24x8).png'],
      ['dialogue_boom_in', 'assets/13-Dialogue Boxes/Boom In (24x8).png'],
      ['dialogue_dead_in', 'assets/13-Dialogue Boxes/Dead In (24x8).png'],
      ['dialogue_wtf_in', 'assets/13-Dialogue Boxes/WTF In (24x8).png'],

      // TileSets
      ['terrain', 'assets/14-TileSets/Terrain (32x32).png'],
      ['decorations', 'assets/14-TileSets/Decorations (32x32).png']
    ];

    const promises = assetList.map(([key, src]) => {
      return this.loadImage(key, src).then(() => {
        if (onProgress) {
          onProgress(this.loaded / this.total);
        }
      });
    });

    await Promise.all(promises);
    return this.images;
  }

  getImage(key) {
    return this.images[key] || null;
  }
}

// Animation controller for sliced sprite sheets
class SpriteAnimation {
  constructor(imageKey, frameWidth, frameHeight, frameCount, fps = 10, loop = true) {
    this.imageKey = imageKey;
    this.frameWidth = frameWidth;
    this.frameHeight = frameHeight;
    this.frameCount = frameCount;
    this.fps = fps;
    this.loop = loop;
    this.currentFrame = 0;
    this.timer = 0;
    this.finished = false;
  }

  reset() {
    this.currentFrame = 0;
    this.timer = 0;
    this.finished = false;
  }

  update(dt) {
    if (this.finished && !this.loop) return;

    this.timer += dt;
    const interval = 1 / this.fps;

    while (this.timer >= interval) {
      this.timer -= interval;
      if (this.currentFrame < this.frameCount - 1) {
        this.currentFrame++;
      } else {
        if (this.loop) {
          this.currentFrame = 0;
        } else {
          this.finished = true;
          break;
        }
      }
    }
  }

  draw(ctx, assets, x, y, width, height, flipX = false, alpha = 1.0) {
    const img = assets.getImage(this.imageKey);
    if (!img) return;

    ctx.save();
    ctx.globalAlpha = alpha;

    const sx = this.currentFrame * this.frameWidth;
    const sy = 0;

    if (flipX) {
      ctx.translate(x + width, y);
      ctx.scale(-1, 1);
      ctx.drawImage(img, sx, sy, this.frameWidth, this.frameHeight, 0, 0, width, height);
    } else {
      ctx.drawImage(img, sx, sy, this.frameWidth, this.frameHeight, x, y, width, height);
    }

    ctx.restore();
  }
}



// ===== scripts/particles.js =====
// scripts/particles.js - Visual Effects, Debris Particles, Dialogue Popups, Floating Scores
class ParticleManager {
  constructor() {
    this.particles = [];
    this.dialogues = [];
    this.floatingTexts = [];
  }

  reset() {
    this.particles = [];
    this.dialogues = [];
    this.floatingTexts = [];
  }

  // Spawn wood crate pieces flying outward
  spawnBoxBreak(x, y, count = 8) {
    const pieceKeys = ['box_piece_1', 'box_piece_2', 'box_piece_3', 'box_piece_4'];
    for (let i = 0; i < count; i++) {
      const angle = (Math.random() * Math.PI) + Math.PI; // upward burst
      const speed = 250 + Math.random() * 450;
      const key = pieceKeys[Math.floor(Math.random() * pieceKeys.length)];

      this.particles.push({
        type: 'box_piece',
        imageKey: key,
        x: x + (Math.random() * 40 - 20),
        y: y + (Math.random() * 40 - 20),
        vx: Math.cos(angle) * speed + (Math.random() * 200 - 100),
        vy: Math.sin(angle) * speed - 200,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() * 10 - 5),
        scale: 2.5 + Math.random() * 1.5,
        life: 0.8 + Math.random() * 0.4,
        maxLife: 1.2,
        gravity: 1200
      });
    }

    // Add dust burst
    this.spawnDust(x, y, 6);
  }

  // Spawn stone/dust puffs
  spawnDust(x, y, count = 6, color = 'rgba(210, 200, 190,') {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 50 + Math.random() * 120;
      this.particles.push({
        type: 'dust',
        x: x + (Math.random() * 20 - 10),
        y: y + (Math.random() * 20 - 10),
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 30,
        radius: 8 + Math.random() * 12,
        growth: 15,
        life: 0.4 + Math.random() * 0.3,
        maxLife: 0.7,
        color: color,
        gravity: -50
      });
    }
  }

  // Sparks when hammer hits wall or enemy
  spawnSparks(x, y, count = 8) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 150 + Math.random() * 250;
      this.particles.push({
        type: 'spark',
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        length: 8 + Math.random() * 8,
        life: 0.25 + Math.random() * 0.2,
        maxLife: 0.45,
        color: Math.random() > 0.5 ? '#f6d32d' : '#ff7800',
        gravity: 800
      });
    }
  }

  // Dialogue popup bubble above characters
  spawnDialogue(imageKey, targetEntity, duration = 1.2) {
    this.dialogues.push({
      imageKey: imageKey,
      target: targetEntity,
      offsetX: 0,
      offsetY: -70,
      life: duration,
      maxLife: duration,
      scale: 2.5
    });
  }

  // Floating text like "+100", "SMASH!", "REPAIRED!"
  spawnText(text, x, y, color = '#ffd700', fontSize = 32) {
    this.floatingTexts.push({
      text: text,
      x: x,
      y: y,
      vy: -90,
      color: color,
      fontSize: fontSize,
      life: 0.9,
      maxLife: 0.9
    });
  }

  update(dt) {
    // Update debris & dust
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      p.x += p.vx * dt;
      p.y += p.vy * dt;

      if (p.gravity) {
        p.vy += p.gravity * dt;
      }
      if (p.rotSpeed) {
        p.rotation += p.rotSpeed * dt;
      }
      if (p.growth) {
        p.radius += p.growth * dt;
      }
    }

    // Update dialogues
    for (let i = this.dialogues.length - 1; i >= 0; i--) {
      const d = this.dialogues[i];
      d.life -= dt;
      if (d.life <= 0 || (d.target && d.target.dead && d.imageKey !== 'dialogue_dead_in')) {
        this.dialogues.splice(i, 1);
      }
    }

    // Update floating texts
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const t = this.floatingTexts[i];
      t.life -= dt;
      if (t.life <= 0) {
        this.floatingTexts.splice(i, 1);
        continue;
      }
      t.y += t.vy * dt;
    }
  }

  draw(ctx, assets, camera) {
    // Draw particles
    for (const p of this.particles) {
      const screenX = p.x - camera.x;
      const screenY = p.y - camera.y;

      const alpha = Math.max(0, p.life / p.maxLife);

      if (p.type === 'box_piece') {
        const img = assets.getImage(p.imageKey);
        if (img) {
          ctx.save();
          ctx.globalAlpha = alpha;
          ctx.translate(screenX, screenY);
          ctx.rotate(p.rotation);
          const w = img.width * p.scale;
          const h = img.height * p.scale;
          ctx.drawImage(img, -w / 2, -h / 2, w, h);
          ctx.restore();
        }
      } else if (p.type === 'dust') {
        ctx.save();
        ctx.globalAlpha = alpha * 0.7;
        ctx.fillStyle = p.color + alpha + ')';
        ctx.beginPath();
        ctx.arc(screenX, screenY, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else if (p.type === 'spark') {
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(screenX, screenY);
        ctx.lineTo(screenX - p.vx * 0.03, screenY - p.vy * 0.03);
        ctx.stroke();
        ctx.restore();
      }
    }

    // Draw dialogues
    for (const d of this.dialogues) {
      const img = assets.getImage(d.imageKey);
      if (!img) continue;

      let posX = d.target ? d.target.x + d.target.width / 2 + d.offsetX : d.offsetX;
      let posY = d.target ? d.target.y + d.offsetY : d.offsetY;

      const screenX = posX - camera.x;
      const screenY = posY - camera.y;

      const alpha = Math.min(1, d.life / (d.maxLife * 0.2));
      const w = img.width * d.scale;
      const h = img.height * d.scale;

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.drawImage(img, screenX - w / 2, screenY - h / 2, w, h);
      ctx.restore();
    }

    // Draw floating texts
    for (const t of this.floatingTexts) {
      const screenX = t.x - camera.x;
      const screenY = t.y - camera.y;
      const alpha = Math.max(0, t.life / t.maxLife);

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.font = `900 ${t.fontSize}px "Segoe UI", Arial, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillStyle = '#000';
      ctx.fillText(t.text, screenX + 2, screenY + 2);
      ctx.fillStyle = t.color;
      ctx.fillText(t.text, screenX, screenY);
      ctx.restore();
    }
  }
}



// ===== scripts/world.js =====
// scripts/world.js - Vertical Tower, Destructible Ceiling/Floor Blocks, and Collectibles
class World {
  constructor(game) {
    this.game = game;
    this.width = 1080;
    this.totalHeight = 3200;
    this.floorCount = 6;
    this.floorHeight = 350; // distance between floors (easy to jump & reach)
    this.groundY = 2500;    // Y coordinate of the bottom floor

    this.leftWallWidth = 120;
    this.rightWallWidth = 120;
    this.playableWidth = this.width - this.leftWallWidth - this.rightWallWidth; // 840px

    this.floors = [];
    this.diamonds = [];
    this.hearts = [];
    this.exitDoor = null;
    this.decorations = [];
  }

  buildLevel(stage = 1) {
    this.floors = [];
    this.diamonds = [];
    this.hearts = [];
    this.decorations = [];

    // Bottom floor (ground)
    const groundFloor = {
      index: 0,
      y: this.groundY,
      height: 64,
      isGround: true,
      blocks: [], // Ground is unbreakable solid
      leftLedge: { x: this.leftWallWidth, width: this.playableWidth, y: this.groundY, height: 64 }
    };
    this.floors.push(groundFloor);

    // Build intermediate floors
    for (let i = 1; i <= this.floorCount; i++) {
      const floorY = this.groundY - i * this.floorHeight;
      const isTopFloor = (i === this.floorCount);

      const blockWidth = 90;
      const blockHeight = 54;
      const ledgeWidth = 135;

      const floor = {
        index: i,
        y: floorY,
        height: blockHeight,
        isTopFloor: isTopFloor,
        leftLedge: {
          x: this.leftWallWidth,
          y: floorY,
          width: ledgeWidth,
          height: blockHeight
        },
        rightLedge: {
          x: this.width - this.rightWallWidth - ledgeWidth,
          y: floorY,
          width: ledgeWidth,
          height: blockHeight
        },
        blocks: []
      };

      // In top floor, keep floor solid for throne room, or have breakable blocks
      const blockStartX = this.leftWallWidth + ledgeWidth;
      const breakableSpan = this.playableWidth - ledgeWidth * 2; // 840 - 270 = 570
      const numBlocks = Math.floor(breakableSpan / blockWidth);
      const remainingMargin = (breakableSpan - numBlocks * blockWidth) / 2;

      for (let b = 0; b < numBlocks; b++) {
        floor.blocks.push({
          floorIndex: i,
          blockIndex: b,
          x: blockStartX + remainingMargin + b * blockWidth,
          y: floorY,
          width: blockWidth,
          height: blockHeight,
          hp: 1, // BREAKS IN 1 HIT!
          maxHp: 1,
          broken: false,
          shakeTimer: 0,
          hitFlash: 0
        });
      }

      this.floors.push(floor);

      // Add decorations (banners, windows, torches) on walls
      this.decorations.push({
        type: 'torch',
        x: this.leftWallWidth + 30,
        y: floorY - 140
      });
      this.decorations.push({
        type: 'banner',
        x: this.width - this.rightWallWidth - 70,
        y: floorY - 180
      });
      if (i % 2 === 0) {
        this.decorations.push({
          type: 'window',
          x: 540 - 48,
          y: floorY - 260
        });
      }
    }

    // Royal Exit Door on Top Floor
    const topFloor = this.floors[this.floors.length - 1];
    this.exitDoor = {
      x: 540 - 55,
      y: topFloor.y - 134,
      width: 110,
      height: 134,
      state: 'idle', // 'idle', 'opening', 'open'
      animTimer: 0
    };

    // Spawn some initial collectibles on ledges
    for (let i = 1; i <= this.floorCount; i++) {
      const f = this.floors[i];
      if (Math.random() > 0.3) {
        this.spawnDiamond(f.leftLedge.x + 40, f.y - 45, Math.random() > 0.6 ? 'big' : 'small');
      }
      if (Math.random() > 0.3) {
        this.spawnDiamond(f.rightLedge.x + 50, f.y - 45, Math.random() > 0.6 ? 'big' : 'small');
      }
      if (i === 3 || i === 5) {
        this.spawnHeart(540, f.y - 45);
      }
    }
  }

  // Breakable block hit handler
  hitBlock(block, damage = 1, hammerHitX = null) {
    if (block.broken) return false;

    block.hp -= damage;
    block.shakeTimer = 0.2;
    block.hitFlash = 0.15;

    if (block.hp <= 0) {
      block.broken = true;
      block.hp = 0;

      // Spawn particles
      this.game.particles.spawnBoxBreak(block.x + block.width / 2, block.y + block.height / 2, 10);
      this.game.particles.spawnSparks(block.x + block.width / 2, block.y + block.height / 2, 12);
      this.game.particles.spawnText('+50 SMASH!', block.x + block.width / 2, block.y - 20, '#ffcc00', 30);
      this.game.audio.playWallBreak();
      this.game.addScore(50);
      this.game.camera.shake(8, 0.25);

      // Chance to drop diamond or heart
      if (Math.random() < 0.4) {
        this.spawnDiamond(block.x + block.width / 2, block.y - 30, Math.random() < 0.3 ? 'big' : 'small');
      } else if (Math.random() < 0.1) {
        this.spawnHeart(block.x + block.width / 2, block.y - 30);
      }

      return true; // was broken
    } else {
      // Just cracked
      this.game.particles.spawnSparks(block.x + block.width / 2, block.y + block.height / 2, 6);
      this.game.audio.playHammer();
      this.game.camera.shake(4, 0.15);
      return false;
    }
  }

  // Repair a broken block (called by RepairerPig)
  repairBlock(block) {
    if (!block.broken) return;
    block.broken = false;
    block.hp = block.maxHp;
    block.hitFlash = 0.25;

    // Safety: If player is standing inside this block when repaired, pop player safely onto top!
    const player = this.game.player;
    if (
      player.x + player.width > block.x &&
      player.x < block.x + block.width &&
      player.y + player.height > block.y &&
      player.y < block.y + block.height
    ) {
      player.y = block.y - player.height;
      player.vy = 0;
      player.grounded = true;
    }

    this.game.particles.spawnDust(block.x + block.width / 2, block.y + block.height / 2, 8, 'rgba(230, 210, 180,');
    this.game.particles.spawnText('REPAIRED!', block.x + block.width / 2, block.y - 25, '#4cd964', 28);
    this.game.audio.playRepair();
  }

  // Get active broken gaps on a specific floor
  getFloorGaps(floorIndex) {
    const floor = this.floors[floorIndex];
    if (!floor || !floor.blocks) return [];
    return floor.blocks.filter(b => b.broken);
  }

  // Spawns
  spawnDiamond(x, y, type = 'small') {
    this.diamonds.push({
      x: x,
      y: y,
      type: type,
      width: 36,
      height: 28,
      baseY: y,
      animTimer: Math.random() * 2,
      collected: false
    });
  }

  spawnHeart(x, y) {
    this.hearts.push({
      x: x,
      y: y,
      width: 36,
      height: 28,
      baseY: y,
      animTimer: Math.random() * 2,
      collected: false
    });
  }

  update(dt) {
    // Update blocks shake / flash
    for (const f of this.floors) {
      for (const b of f.blocks) {
        if (b.shakeTimer > 0) b.shakeTimer -= dt;
        if (b.hitFlash > 0) b.hitFlash -= dt;
      }
    }

    // Update diamonds bobbing
    for (let i = this.diamonds.length - 1; i >= 0; i--) {
      const d = this.diamonds[i];
      d.animTimer += dt * 4;
      d.y = d.baseY + Math.sin(d.animTimer) * 6;
      if (d.collected) {
        this.diamonds.splice(i, 1);
      }
    }

    // Update hearts bobbing
    for (let i = this.hearts.length - 1; i >= 0; i--) {
      const h = this.hearts[i];
      h.animTimer += dt * 4;
      h.y = h.baseY + Math.sin(h.animTimer) * 6;
      if (h.collected) {
        this.hearts.splice(i, 1);
      }
    }

    // Update door animation if opening
    if (this.exitDoor && this.exitDoor.state === 'opening') {
      this.exitDoor.animTimer += dt * 10;
      if (this.exitDoor.animTimer >= 5) {
        this.exitDoor.state = 'open';
      }
    }
  }

  // Draw tower walls, floors, blocks, door, and decorations
  draw(ctx, assets, camera) {
    const terrainImg = assets.getImage('terrain');
    const decorImg = assets.getImage('decorations');
    const boxIdleImg = assets.getImage('box_idle');
    const boxHitImg = assets.getImage('box_hit');

    // 1. Draw castle backdrop background
    const bgTileSize = 64;
    const startRow = Math.max(0, Math.floor(camera.y / bgTileSize));
    const endRow = Math.ceil((camera.y + camera.height) / bgTileSize);

    ctx.save();
    // Dark castle brick pattern
    ctx.fillStyle = '#1e1a2b';
    ctx.fillRect(0, 0, camera.width, camera.height);

    // Subtle castle brick lines
    ctx.strokeStyle = '#272238';
    ctx.lineWidth = 2;
    for (let r = startRow; r <= endRow; r++) {
      const y = r * bgTileSize - camera.y;
      ctx.beginPath();
      ctx.moveTo(this.leftWallWidth, y);
      ctx.lineTo(this.width - this.rightWallWidth, y);
      ctx.stroke();

      const offset = (r % 2) * (bgTileSize / 2);
      for (let x = this.leftWallWidth + offset; x < this.width - this.rightWallWidth; x += bgTileSize) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, y + bgTileSize);
        ctx.stroke();
      }
    }
    ctx.restore();

    // 2. Draw decorations
    for (const dec of this.decorations) {
      const sy = dec.y - camera.y;
      if (sy < -100 || sy > camera.height + 100) continue;
      if (dec.type === 'torch') {
        // Draw torch with glowing animated flame
        ctx.save();
        ctx.fillStyle = '#8b5a2b';
        ctx.fillRect(dec.x - 4, sy + 10, 8, 24);
        const flicker = Math.sin(Date.now() * 0.01 + dec.x) * 3;
        ctx.fillStyle = '#ffaa00';
        ctx.beginPath();
        ctx.arc(dec.x, sy + 8 + flicker, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffff55';
        ctx.beginPath();
        ctx.arc(dec.x, sy + 8 + flicker, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else if (dec.type === 'banner') {
        ctx.save();
        ctx.fillStyle = '#8e1b24';
        ctx.fillRect(dec.x, sy, 36, 64);
        ctx.fillStyle = '#f5c542';
        ctx.fillRect(dec.x + 14, sy + 10, 8, 30);
        ctx.fillRect(dec.x + 6, sy + 20, 24, 8);
        ctx.restore();
      } else if (dec.type === 'window') {
        ctx.save();
        ctx.fillStyle = '#0f1423';
        ctx.fillRect(dec.x, sy, 96, 120);
        ctx.strokeStyle = '#5a546b';
        ctx.lineWidth = 6;
        ctx.strokeRect(dec.x, sy, 96, 120);
        // Window crossbars
        ctx.beginPath();
        ctx.moveTo(dec.x + 48, sy);
        ctx.lineTo(dec.x + 48, sy + 120);
        ctx.moveTo(dec.x, sy + 60);
        ctx.lineTo(dec.x + 96, sy + 60);
        ctx.stroke();
        ctx.restore();
      }
    }

    // 3. Draw Left and Right Castle Border Walls
    const wallTileH = 64;
    for (let r = startRow; r <= endRow; r++) {
      const y = r * wallTileH - camera.y;

      // Left Wall
      ctx.fillStyle = '#3f3851';
      ctx.fillRect(0, y, this.leftWallWidth, wallTileH);
      ctx.fillStyle = '#544b6b';
      ctx.fillRect(this.leftWallWidth - 16, y, 16, wallTileH);

      // Right Wall
      ctx.fillStyle = '#3f3851';
      ctx.fillRect(this.width - this.rightWallWidth, y, this.rightWallWidth, wallTileH);
      ctx.fillStyle = '#2f283d';
      ctx.fillRect(this.width - this.rightWallWidth, y, 16, wallTileH);
    }

    // 4. Draw Floors and Blocks
    for (const f of this.floors) {
      const sy = f.y - camera.y;
      if (sy < -150 || sy > camera.height + 150) continue;

      if (f.isGround) {
        // Ground floor solid base
        ctx.fillStyle = '#4c425c';
        ctx.fillRect(this.leftWallWidth, sy, this.playableWidth, f.height + 400);
        // Top stone trim
        ctx.fillStyle = '#7a6e8f';
        ctx.fillRect(this.leftWallWidth, sy, this.playableWidth, 12);
        continue;
      }

      // Left ledge (solid stone support)
      ctx.fillStyle = '#4c425c';
      ctx.fillRect(f.leftLedge.x, sy, f.leftLedge.width, f.leftLedge.height);
      ctx.fillStyle = '#7a6e8f';
      ctx.fillRect(f.leftLedge.x, sy, f.leftLedge.width, 10);

      // Right ledge (solid stone support)
      ctx.fillStyle = '#4c425c';
      ctx.fillRect(f.rightLedge.x, sy, f.rightLedge.width, f.rightLedge.height);
      ctx.fillStyle = '#7a6e8f';
      ctx.fillRect(f.rightLedge.x, sy, f.rightLedge.width, 10);

      // Draw Breakable Wall Blocks
      for (const b of f.blocks) {
        if (b.broken) continue; // Gap is open!

        let drawX = b.x;
        let drawY = b.y - camera.y;

        if (b.shakeTimer > 0) {
          drawX += (Math.random() * 8 - 4);
          drawY += (Math.random() * 8 - 4);
        }

        // Draw Box sprite scaled to block size
        const img = (b.hitFlash > 0 && boxHitImg) ? boxHitImg : boxIdleImg;
        if (img) {
          ctx.save();
          ctx.drawImage(img, drawX, drawY, b.width, b.height);

          // If damaged (HP == 1), draw crack effect
          if (b.hp === 1) {
            ctx.strokeStyle = '#1b1410';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(drawX + b.width * 0.3, drawY + 4);
            ctx.lineTo(drawX + b.width * 0.5, drawY + b.height * 0.5);
            ctx.lineTo(drawX + b.width * 0.4, drawY + b.height - 4);
            ctx.moveTo(drawX + b.width * 0.5, drawY + b.height * 0.5);
            ctx.lineTo(drawX + b.width * 0.75, drawY + b.height * 0.7);
            ctx.stroke();
          }
          ctx.restore();
        } else {
          // Fallback wooden block rendering
          ctx.fillStyle = '#9b663b';
          ctx.fillRect(drawX, drawY, b.width, b.height);
          ctx.strokeStyle = '#5a371c';
          ctx.lineWidth = 4;
          ctx.strokeRect(drawX, drawY, b.width, b.height);
        }
      }
    }

    // 5. Draw Royal Exit Door on Top Floor
    if (this.exitDoor) {
      const doorScreenX = this.exitDoor.x;
      const doorScreenY = this.exitDoor.y - camera.y;

      let doorImg = assets.getImage('door_idle');
      if (this.exitDoor.state === 'opening') {
        doorImg = assets.getImage('door_opening');
      } else if (this.exitDoor.state === 'open') {
        doorImg = assets.getImage('door_opening'); // last frame
      }

      if (doorImg) {
        ctx.save();
        if (this.exitDoor.state === 'opening') {
          const frame = Math.min(4, Math.floor(this.exitDoor.animTimer));
          const frameW = 46;
          ctx.drawImage(doorImg, frame * frameW, 0, frameW, 56, doorScreenX, doorScreenY, this.exitDoor.width, this.exitDoor.height);
        } else if (this.exitDoor.state === 'open') {
          // Draw fully open door frame
          const frameW = 46;
          ctx.drawImage(doorImg, 4 * frameW, 0, frameW, 56, doorScreenX, doorScreenY, this.exitDoor.width, this.exitDoor.height);
        } else {
          ctx.drawImage(doorImg, 0, 0, 46, 56, doorScreenX, doorScreenY, this.exitDoor.width, this.exitDoor.height);
        }
        ctx.restore();
      }
    }

    // 6. Draw Diamonds
    for (const d of this.diamonds) {
      const sx = d.x;
      const sy = d.y - camera.y;
      if (sy < -60 || sy > camera.height + 60) continue;

      const imgKey = d.type === 'big' ? 'big_diamond_idle' : 'small_diamond';
      const img = assets.getImage(imgKey);
      if (img) {
        const frameW = 18;
        const frameIdx = Math.floor(d.animTimer * 2) % (d.type === 'big' ? 10 : 8);
        ctx.drawImage(img, frameIdx * frameW, 0, frameW, 14, sx - d.width / 2, sy - d.height / 2, d.width, d.height);
      }
    }

    // 7. Draw Hearts
    for (const h of this.hearts) {
      const sx = h.x;
      const sy = h.y - camera.y;
      if (sy < -60 || sy > camera.height + 60) continue;

      const img = assets.getImage('big_heart_idle');
      if (img) {
        const frameW = 18;
        const frameIdx = Math.floor(h.animTimer * 2) % 8;
        ctx.drawImage(img, frameIdx * frameW, 0, frameW, 14, sx - h.width / 2, sy - h.height / 2, h.width, h.height);
      }
    }
  }
}



// ===== scripts/player.js =====
// scripts/player.js - King Human Player Class with Hammer Attacks & Gap Climbing

class Player {
  constructor(game) {
    this.game = game;

    // Collision Box Dimensions (world coordinates)
    this.width = 54;
    this.height = 84;

    // Position & Velocity
    this.x = 540 - this.width / 2;
    this.y = 2800 - this.height;
    this.vx = 0;
    this.vy = 0;

    // Movement Constants - calibrated for effortless high jump to ceiling
    this.speed = 460;
    this.accel = 2400;
    this.friction = 2000;
    this.gravity = 1750;       // reduced for floaty, controllable jump
    this.jumpForce = -1120;     // high jump easily reaches the 350px ceiling & through gaps!
    this.maxFallSpeed = 1100;

    // States
    this.grounded = false;
    this.facingLeft = false;
    this.state = 'idle'; // idle, run, jump, fall, attack, hit, dead, door_in
    this.attackType = 'forward'; // 'forward', 'up', 'down'
    this.attackTimer = 0;
    this.attackDuration = 0.28;
    this.hasHitCurrentAttack = false;

    // Health & Stats (More generous for easier, fun gameplay)
    this.maxHealth = 5;        // 5 Hearts!
    this.health = 5;
    this.invulnerableTimer = 0;
    this.dead = false;
    this.doorEntered = false;

    // Animations (78x58 source frames)
    this.animScale = 2.4;
    this.spriteDrawWidth = 78 * this.animScale;   // ~187px
    this.spriteDrawHeight = 58 * this.animScale;  // ~139px

    this.anims = {
      idle: new SpriteAnimation('king_idle', 78, 58, 11, 10, true),
      run: new SpriteAnimation('king_run', 78, 58, 8, 12, true),
      jump: new SpriteAnimation('king_jump', 78, 58, 1, 1, true),
      fall: new SpriteAnimation('king_fall', 78, 58, 1, 1, true),
      ground: new SpriteAnimation('king_ground', 78, 58, 1, 1, true),
      attack: new SpriteAnimation('king_attack', 78, 58, 3, 14, false),
      hit: new SpriteAnimation('king_hit', 78, 58, 2, 8, false),
      dead: new SpriteAnimation('king_dead', 78, 58, 4, 6, false),
      door_in: new SpriteAnimation('king_door_in', 78, 58, 8, 8, false)
    };

    this.currentAnim = this.anims.idle;
  }

  reset(x, y) {
    this.x = x || (540 - this.width / 2);
    this.y = y || (2800 - this.height);
    this.vx = 0;
    this.vy = 0;
    this.health = this.maxHealth;
    this.dead = false;
    this.doorEntered = false;
    this.invulnerableTimer = 0;
    this.state = 'idle';
    this.currentAnim = this.anims.idle;
    this.currentAnim.reset();
  }

  setAnim(animKey) {
    if (this.anims[animKey] && this.currentAnim !== this.anims[animKey]) {
      this.currentAnim = this.anims[animKey];
      this.currentAnim.reset();
    }
  }

  // Trigger Hammer Attack
  attack(type = 'forward') {
    if (this.dead || this.doorEntered || this.state === 'attack' || this.state === 'hit') return;

    this.state = 'attack';
    this.attackType = type;
    this.attackTimer = this.attackDuration;
    this.hasHitCurrentAttack = false;
    this.setAnim('attack');
    this.game.audio.playHammer();

    // Check hit immediately and during swing
    this.checkHammerHit();
  }

  // Hammer Hitbox Collision against breakable blocks & enemies
  checkHammerHit() {
    if (this.hasHitCurrentAttack) return;

    let hitBox = { x: 0, y: 0, w: 0, h: 0 };

    if (this.attackType === 'up' || !this.grounded) {
      // In air or pressing Up, hammer sweeps across and high above player's head!
      hitBox = {
        x: this.x - 40,
        y: this.y - 95,
        w: this.width + 80,
        h: 120
      };
    } else if (this.attackType === 'down') {
      // Downward Ground Pound
      hitBox = {
        x: this.x - 20,
        y: this.y + this.height - 10,
        w: this.width + 40,
        h: 70
      };
    } else {
      // Forward Swing with generous reach
      const reach = 95;
      hitBox = {
        x: this.facingLeft ? (this.x - reach) : (this.x + this.width),
        y: this.y - 20,
        w: reach,
        h: this.height + 20
      };
    }

    let hitSomething = false;

    // 1. Check Breakable Blocks across all floors
    for (const f of this.game.world.floors) {
      // Only check floors near player
      if (Math.abs(f.y - this.y) > 300) continue;

      for (const b of f.blocks) {
        if (b.broken) continue;

        // AABB check between hitBox and block
        if (
          hitBox.x < b.x + b.width &&
          hitBox.x + hitBox.w > b.x &&
          hitBox.y < b.y + b.height &&
          hitBox.y + hitBox.h > b.y
        ) {
          this.game.world.hitBlock(b, 1);
          hitSomething = true;
          this.hasHitCurrentAttack = true;
          break;
        }
      }
      if (hitSomething) break;
    }

    // 2. Check Enemies (patrol pigs, repairer pigs, bombs, boss)
    for (const enemy of this.game.enemies) {
      if (enemy.dead) continue;

      if (
        hitBox.x < enemy.x + enemy.width &&
        hitBox.x + hitBox.w > enemy.x &&
        hitBox.y < enemy.y + enemy.height &&
        hitBox.y + hitBox.h > enemy.y
      ) {
        enemy.takeDamage(1, this.facingLeft ? -1 : 1);
        hitSomething = true;
        this.hasHitCurrentAttack = true;
        this.game.camera.shake(6, 0.2);
        this.game.particles.spawnSparks(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, 10);
        break;
      }
    }
  }

  takeDamage(amount = 1, fromX = null, reason = 'Enemy Attack') {
    if (this.dead || this.doorEntered || this.invulnerableTimer > 0) return;

    this.health -= amount;
    this.invulnerableTimer = 2.0; // 2 seconds of invulnerability
    this.lastDamageReason = reason;

    // Trigger visual and sound feedback
    this.game.triggerDamageFlash();
    this.game.audio.playPlayerHurt();
    this.game.camera.shake(12, 0.35);

    // Big floating text directly above player clearly showing what hit them!
    this.game.particles.spawnText(`-1 ❤️ ${reason.toUpperCase()}`, this.x + this.width / 2, this.y - 40, '#ff3333', 34);
    this.game.particles.spawnDust(this.x + this.width / 2, this.y + this.height / 2, 12, 'rgba(255, 60, 60,');

    if (this.health <= 0) {
      this.health = 0;
      this.dead = true;
      this.state = 'dead';
      this.setAnim('dead');
      this.vy = -500; // death hop
      this.game.audio.playGameOver();
      this.game.onPlayerDeath(this.lastDamageReason);
    } else {
      this.state = 'hit';
      this.setAnim('hit');
      // Knockback
      const dir = (fromX !== null && fromX > this.x + this.width / 2) ? -1 : 1;
      this.vx = dir * 250;
      this.vy = -300;
    }
  }

  update(dt, input) {
    if (this.dead) {
      // Death fall physics
      this.vy += this.gravity * dt;
      this.y += this.vy * dt;
      this.currentAnim.update(dt);
      return;
    }

    if (this.doorEntered) {
      this.currentAnim.update(dt);
      return;
    }

    // Invulnerability timer
    if (this.invulnerableTimer > 0) {
      this.invulnerableTimer -= dt;
    }

    // Handle Attack State timer
    if (this.state === 'attack') {
      this.attackTimer -= dt;
      this.checkHammerHit();
      if (this.attackTimer <= 0) {
        this.state = this.grounded ? 'idle' : 'fall';
      }
    }

    // Handle Hit recovery
    if (this.state === 'hit') {
      if (this.currentAnim.finished) {
        this.state = this.grounded ? 'idle' : 'fall';
      }
    }

    // --- HORIZONTAL INPUT & MOVEMENT ---
    let moveDir = 0;
    if (input.left) moveDir -= 1;
    if (input.right) moveDir += 1;

    if (moveDir !== 0 && this.state !== 'hit') {
      this.vx = moveDir * this.speed;
      this.facingLeft = (moveDir < 0);
      if (this.state !== 'attack' && this.grounded) {
        this.state = 'run';
      }
    } else {
      // Apply friction
      if (this.vx > 0) {
        this.vx = Math.max(0, this.vx - this.friction * dt);
      } else if (this.vx < 0) {
        this.vx = Math.min(0, this.vx + this.friction * dt);
      }
      if (this.state !== 'attack' && this.state !== 'hit' && this.grounded) {
        this.state = 'idle';
      }
    }

    // --- JUMPING ---
    if (input.jump && this.grounded && this.state !== 'hit') {
      this.vy = this.jumpForce;
      this.grounded = false;
      this.game.audio.playJump();
      this.game.particles.spawnDust(this.x + this.width / 2, this.y + this.height, 5);
      if (this.state !== 'attack') {
        this.state = 'jump';
      }
    }

    // --- ATTACK TRIGGER ---
    if (input.attackJustPressed) {
      if (input.up) {
        this.attack('up');
      } else if (input.down && !this.grounded) {
        this.attack('down');
      } else {
        this.attack('forward');
      }
    } else if (input.upSmashJustPressed) {
      this.attack('up');
    }

    // --- APPLY GRAVITY ---
    this.vy += this.gravity * dt;
    if (this.vy > this.maxFallSpeed) this.vy = this.maxFallSpeed;

    // --- MOVE X & WALL COLLISION ---
    this.x += this.vx * dt;

    // Clamp inside castle side walls
    const minX = this.game.world.leftWallWidth;
    const maxX = this.game.world.width - this.game.world.rightWallWidth - this.width;
    if (this.x < minX) {
      this.x = minX;
      this.vx = 0;
    } else if (this.x > maxX) {
      this.x = maxX;
      this.vx = 0;
    }

    // --- MOVE Y & VERTICAL / GAP COLLISION ---
    const prevY = this.y;
    this.y += this.vy * dt;

    this.grounded = false;
    const playerFeet = this.y + this.height;
    const prevFeet = prevY + this.height;

    // Check collisions against floors and blocks
    for (const f of this.game.world.floors) {
      // 1. Landing on solid ground floor
      if (f.isGround) {
        if (playerFeet >= f.y) {
          this.y = f.y - this.height;
          this.vy = 0;
          this.grounded = true;
          if (this.state !== 'attack' && this.state !== 'hit') {
            this.state = (this.vx !== 0) ? 'run' : 'idle';
          }
        }
        continue;
      }

      // 2. Landing on solid side ledges
      const onLeftLedge = (this.x + this.width > f.leftLedge.x && this.x < f.leftLedge.x + f.leftLedge.width);
      const onRightLedge = (this.x + this.width > f.rightLedge.x && this.x < f.rightLedge.x + f.rightLedge.width);

      if (onLeftLedge || onRightLedge) {
        // Landing from above
        if (this.vy >= 0 && prevFeet <= f.y + 16 && playerFeet >= f.y) {
          this.y = f.y - this.height;
          this.vy = 0;
          this.grounded = true;
          if (this.state !== 'attack' && this.state !== 'hit') {
            this.state = (this.vx !== 0) ? 'run' : 'idle';
          }
        }
        // Head bumping solid ledge from below
        else if (this.vy < 0 && prevY >= f.y + f.height - 10 && this.y <= f.y + f.height) {
          this.y = f.y + f.height;
          this.vy = 0;
        }
      }

      // 3. Middle breakable blocks vs Open Gaps
      for (const b of f.blocks) {
        const xOverlap = (this.x + this.width > b.x && this.x < b.x + b.width);
        if (!xOverlap) continue;

        if (!b.broken) {
          // Block is SOLID

          // Moving UPWARD: Jumping into breakable ceiling block SMASHES it open!
          if (this.vy < 0 && this.y <= b.y + b.height + 25 && prevY >= b.y) {
            this.game.world.hitBlock(b, 1);
            // Smashed! Player continues smoothly upward through newly opened gap!
            continue;
          }

          // Landing on top of unbroken block
          if (this.vy >= 0 && prevFeet <= b.y + 24 && playerFeet >= b.y) {
            this.y = b.y - this.height;
            this.vy = 0;
            this.grounded = true;
            if (this.state !== 'attack' && this.state !== 'hit') {
              this.state = (this.vx !== 0) ? 'run' : 'idle';
            }
          }
        } else {
          // Block is BROKEN GAP: King can jump UP or fall through freely!
        }
      }
    }

    // Safety ground clamp: King can NEVER fall below ground floor!
    if (this.y + this.height > this.game.world.groundY) {
      this.y = this.game.world.groundY - this.height;
      this.vy = 0;
      this.grounded = true;
    }

    // Set jumping / falling animations if airborne
    if (!this.grounded && this.state !== 'attack' && this.state !== 'hit') {
      this.state = (this.vy < 0) ? 'jump' : 'fall';
    }

    // Check Collectible Pickups (Diamonds)
    for (const d of this.game.world.diamonds) {
      if (d.collected) continue;
      if (
        this.x < d.x + d.width &&
        this.x + this.width > d.x - d.width / 2 &&
        this.y < d.y + d.height &&
        this.y + this.height > d.y - d.height / 2
      ) {
        d.collected = true;
        const pts = (d.type === 'big') ? 200 : 100;
        this.game.addScore(pts);
        this.game.addGem();
        this.game.audio.playGem();
        this.game.particles.spawnText(`+${pts}`, d.x, d.y - 15, '#4cd964', 28);
        this.game.particles.spawnDust(d.x, d.y, 4, 'rgba(100, 220, 255,');
      }
    }

    // Check Heart Pickups
    for (const h of this.game.world.hearts) {
      if (h.collected) continue;
      if (
        this.x < h.x + h.width &&
        this.x + this.width > h.x - h.width / 2 &&
        this.y < h.y + h.height &&
        this.y + this.height > h.y - h.height / 2
      ) {
        if (this.health < this.maxHealth) {
          h.collected = true;
          this.health = Math.min(this.maxHealth, this.health + 1);
          this.game.audio.playHeart();
          this.game.particles.spawnText('HEALED!', h.x, h.y - 15, '#ff3b30', 28);
          this.game.particles.spawnDust(h.x, h.y, 6, 'rgba(255, 120, 150,');
        }
      }
    }

    // Check Exit Door overlap on Top Floor
    if (this.game.world.exitDoor && !this.doorEntered) {
      const door = this.game.world.exitDoor;
      if (
        this.x + this.width > door.x + 20 &&
        this.x < door.x + door.width - 20 &&
        Math.abs(this.y + this.height - (door.y + door.height)) < 30
      ) {
        // Can enter door if enemies on top floor are cleared or King reaches it
        this.enterDoor();
      }
    }

    // Update active animation
    this.setAnim(this.state);
    this.currentAnim.update(dt);
  }

  enterDoor() {
    if (this.doorEntered) return;
    this.doorEntered = true;
    this.state = 'door_in';
    this.setAnim('door_in');
    this.vx = 0;
    this.vy = 0;
    this.game.world.exitDoor.state = 'opening';
    this.game.audio.playVictory();
    this.game.onStageCleared();
  }

  draw(ctx, assets, camera) {
    const screenX = this.x - camera.x;
    const screenY = this.y - camera.y;

    // Flashing when invulnerable
    if (this.invulnerableTimer > 0 && Math.floor(this.invulnerableTimer * 20) % 2 === 0) {
      return;
    }

    // Center the 78x58 sprite frame over the collision box
    // Character feet should align with this.y + this.height
    const drawX = screenX - (this.spriteDrawWidth - this.width) / 2;
    const drawY = screenY - (this.spriteDrawHeight - this.height) + 8;

    this.currentAnim.draw(
      ctx,
      assets,
      drawX,
      drawY,
      this.spriteDrawWidth,
      this.spriteDrawHeight,
      this.facingLeft
    );

    // If attacking upwards, draw animated hammer swing aura above
    if (this.state === 'attack' && this.attackType === 'up') {
      ctx.save();
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(screenX + this.width / 2, screenY - 20, 45, Math.PI, 0);
      ctx.stroke();
      ctx.restore();
    }
  }
}



// ===== scripts/enemies.js =====
// scripts/enemies.js - Repairer Pigs, Patrol Pigs, Bombers, Cannons, and Boss Pig

// ==========================================
// 1. REPAIRER PIG (PIG THROWING A BOX)
// ==========================================
class RepairerPig {
  constructor(game, floorIndex, x) {
    this.game = game;
    this.floorIndex = floorIndex;
    this.type = 'repairer';

    this.width = 46;
    this.height = 56;
    this.x = x;
    this.y = 0; // will snap to floor
    this.vx = 0;
    this.vy = 0;

    this.speed = 100;
    this.runSpeed = 150;
    this.facingLeft = false;
    this.grounded = false;

    // States: 'patrol', 'alert', 'fetch', 'carry', 'repairing', 'hit', 'dead'
    this.state = 'patrol';
    this.targetGap = null;
    this.patrolDir = 1;
    this.patrolTimer = 2.0;

    this.health = 1; // 1 Hit to defeat!
    this.dead = false;
    this.actionTimer = 0;

    // Animations (26x30 source)
    this.scale = 2.2;
    this.drawW = 26 * this.scale;
    this.drawH = 30 * this.scale;

    this.anims = {
      idle: new SpriteAnimation('pig_box_idle', 26, 30, 9, 10, true),
      picking: new SpriteAnimation('pig_box_picking', 26, 30, 5, 8, false),
      run: new SpriteAnimation('pig_box_run', 26, 30, 6, 12, true),
      throwing: new SpriteAnimation('pig_box_throw', 26, 30, 5, 8, false),
      hit: new SpriteAnimation('pig_hit', 34, 28, 2, 8, false),
      dead: new SpriteAnimation('pig_dead', 34, 28, 4, 6, false)
    };
    this.currentAnim = this.anims.idle;

    this.snapToFloor();
  }

  snapToFloor() {
    const f = this.game.world.floors[this.floorIndex];
    if (f) {
      this.y = f.y - this.height;
    }
  }

  takeDamage(amount = 1, dir = 1) {
    if (this.dead) return;
    this.health -= amount;
    this.game.audio.playPigHit();

    if (this.health <= 0) {
      this.dead = true;
      this.state = 'dead';
      this.currentAnim = this.anims.dead;
      this.currentAnim.reset();
      this.game.audio.playPigDead();
      this.game.addScore(150);
      this.game.world.spawnDiamond(this.x + this.width / 2, this.y - 20, 'big');
      this.game.particles.spawnDialogue('dialogue_dead_in', this, 1.2);
      this.game.particles.spawnBoxBreak(this.x + this.width / 2, this.y, 4);
    } else {
      this.state = 'hit';
      this.currentAnim = this.anims.hit;
      this.currentAnim.reset();
      this.actionTimer = 0.35;
      this.vx = dir * 200;
      this.vy = -180;
      this.game.particles.spawnDialogue('dialogue_wtf_in', this, 0.9);
      // Drop box if carrying
      if (this.targetGap) {
        this.targetGap = null;
      }
    }
  }

  update(dt) {
    if (this.dead) {
      this.currentAnim.update(dt);
      return;
    }

    const floor = this.game.world.floors[this.floorIndex];
    if (!floor) return;

    // Check for broken gaps on this floor
    if (this.state === 'patrol' || this.state === 'idle') {
      const gaps = this.game.world.getFloorGaps(this.floorIndex);
      if (gaps.length > 0) {
        // Pick closest broken gap
        let closestGap = null;
        let minDist = Infinity;
        for (const g of gaps) {
          const d = Math.abs(g.x + g.width / 2 - (this.x + this.width / 2));
          if (d < minDist) {
            minDist = d;
            closestGap = g;
          }
        }

        if (closestGap) {
          this.targetGap = closestGap;
          this.state = 'alert';
          this.actionTimer = 3.5; // Gives player 3.5 whole seconds to jump through!
          this.vx = 0;
          this.game.particles.spawnDialogue('dialogue_alert_in', this, 2.0);
        }
      }
    }

    // State machine logic
    if (this.state === 'alert') {
      this.actionTimer -= dt;
      if (this.actionTimer <= 0) {
        // Start picking box
        this.state = 'fetch';
        this.currentAnim = this.anims.picking;
        this.currentAnim.reset();
      }
    } else if (this.state === 'fetch') {
      if (this.currentAnim.finished) {
        // Now carrying box to gap
        this.state = 'carry';
        this.currentAnim = this.anims.run;
      }
    } else if (this.state === 'carry') {
      if (!this.targetGap || !this.targetGap.broken) {
        // Gap was already fixed or invalid
        this.state = 'patrol';
        this.currentAnim = this.anims.run;
        this.targetGap = null;
      } else {
        const gapTargetX = this.targetGap.x + this.targetGap.width / 2;
        const myCenterX = this.x + this.width / 2;
        const diff = gapTargetX - myCenterX;

        if (Math.abs(diff) < 24) {
          // Reached the hole! Begin throwing / repairing box
          this.state = 'repairing';
          this.vx = 0;
          this.currentAnim = this.anims.throwing;
          this.currentAnim.reset();
        } else {
          // Run toward gap
          this.patrolDir = (diff > 0) ? 1 : -1;
          this.facingLeft = (this.patrolDir < 0);
          this.vx = this.patrolDir * this.runSpeed;
        }
      }
    } else if (this.state === 'repairing') {
      if (this.currentAnim.finished) {
        // Place box and reseal gap!
        if (this.targetGap && this.targetGap.broken) {
          this.game.world.repairBlock(this.targetGap);
        }
        this.targetGap = null;
        this.state = 'patrol';
        this.currentAnim = this.anims.idle;
        this.patrolTimer = 1.0;
      }
    } else if (this.state === 'patrol') {
      this.patrolTimer -= dt;
      if (this.patrolTimer <= 0) {
        this.patrolTimer = 2.0 + Math.random() * 2;
        this.patrolDir *= -1;
      }

      this.facingLeft = (this.patrolDir < 0);
      this.vx = this.patrolDir * this.speed;
      this.currentAnim = this.anims.run;
    } else if (this.state === 'hit') {
      this.actionTimer -= dt;
      if (this.actionTimer <= 0) {
        this.state = 'patrol';
        this.currentAnim = this.anims.idle;
      }
    }

    // Apply movement & floor bounds
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // Gravity
    if (this.y < floor.y - this.height) {
      this.vy += 1800 * dt;
    } else {
      this.y = floor.y - this.height;
      this.vy = 0;
    }

    // Turn around at castle walls or ledge ends if patrolling
    const minX = this.game.world.leftWallWidth + 20;
    const maxX = this.game.world.width - this.game.world.rightWallWidth - this.width - 20;

    if (this.x < minX) {
      this.x = minX;
      this.patrolDir = 1;
    } else if (this.x > maxX) {
      this.x = maxX;
      this.patrolDir = -1;
    }

    this.currentAnim.update(dt);
  }

  draw(ctx, assets, camera) {
    const screenX = this.x - camera.x;
    const screenY = this.y - camera.y;

    if (screenY < -100 || screenY > camera.height + 100) return;

    const drawX = screenX - (this.drawW - this.width) / 2;
    const drawY = screenY - (this.drawH - this.height) + 4;

    this.currentAnim.draw(
      ctx,
      assets,
      drawX,
      drawY,
      this.drawW,
      this.drawH,
      this.facingLeft
    );
  }
}

// ==========================================
// 2. PATROL PIG (ATTACKER)
// ==========================================
class PatrolPig {
  constructor(game, floorIndex, x) {
    this.game = game;
    this.floorIndex = floorIndex;
    this.type = 'patrol';

    this.width = 46;
    this.height = 54;
    this.x = x;
    this.y = 0;
    this.vx = 0;
    this.vy = 0;

    this.speed = 100;
    this.chargeSpeed = 160;
    this.facingLeft = false;
    this.patrolDir = 1;

    this.state = 'patrol'; // patrol, charge, attack, hit, dead
    this.attackCooldown = 0;
    this.actionTimer = 0;
    this.health = 1; // 1 hit to defeat!
    this.dead = false;

    // Animations (34x28 source)
    this.scale = 2.2;
    this.drawW = 34 * this.scale;
    this.drawH = 28 * this.scale;

    this.anims = {
      idle: new SpriteAnimation('pig_idle', 34, 28, 11, 10, true),
      run: new SpriteAnimation('pig_run', 34, 28, 6, 11, true),
      attack: new SpriteAnimation('pig_attack', 34, 28, 5, 12, false),
      hit: new SpriteAnimation('pig_hit', 34, 28, 2, 8, false),
      dead: new SpriteAnimation('pig_dead', 34, 28, 4, 6, false)
    };
    this.currentAnim = this.anims.run;

    this.snapToFloor();
  }

  snapToFloor() {
    const f = this.game.world.floors[this.floorIndex];
    if (f) {
      this.y = f.y - this.height;
    }
  }

  takeDamage(amount = 1, dir = 1) {
    if (this.dead) return;
    this.health -= amount;
    this.game.audio.playPigHit();

    if (this.health <= 0) {
      this.dead = true;
      this.state = 'dead';
      this.currentAnim = this.anims.dead;
      this.currentAnim.reset();
      this.game.audio.playPigDead();
      this.game.addScore(100);
      this.game.world.spawnDiamond(this.x + this.width / 2, this.y - 15, 'small');
      this.game.particles.spawnDialogue('dialogue_dead_in', this, 1.0);
    } else {
      this.state = 'hit';
      this.currentAnim = this.anims.hit;
      this.currentAnim.reset();
      this.actionTimer = 0.3;
      this.vx = dir * 220;
      this.vy = -160;
      this.game.particles.spawnDialogue('dialogue_wtf_in', this, 0.8);
    }
  }

  update(dt) {
    if (this.dead) {
      this.currentAnim.update(dt);
      return;
    }

    const floor = this.game.world.floors[this.floorIndex];
    if (!floor) return;

    if (this.attackCooldown > 0) this.attackCooldown -= dt;

    const player = this.game.player;
    const sameFloor = Math.abs((player.y + player.height) - (this.y + this.height)) < 40;
    const distToPlayer = Math.abs((player.x + player.width / 2) - (this.x + this.width / 2));

    if (this.state === 'patrol') {
      if (sameFloor && distToPlayer < 260 && this.attackCooldown <= 0) {
        // Spot player, charge!
        this.state = 'charge';
        this.patrolDir = (player.x > this.x) ? 1 : -1;
        this.facingLeft = (this.patrolDir < 0);
        this.game.particles.spawnDialogue('dialogue_attack_in', this, 0.8);
      } else {
        this.vx = this.patrolDir * this.speed;
        this.facingLeft = (this.patrolDir < 0);
        this.currentAnim = this.anims.run;
      }
    } else if (this.state === 'charge') {
      this.patrolDir = (player.x > this.x) ? 1 : -1;
      this.facingLeft = (this.patrolDir < 0);
      this.vx = this.patrolDir * this.chargeSpeed;
      this.currentAnim = this.anims.run;

      if (!sameFloor || distToPlayer > 350) {
        this.state = 'patrol';
      } else if (distToPlayer < 65) {
        // Strike player!
        this.state = 'attack';
        this.currentAnim = this.anims.attack;
        this.currentAnim.reset();
        this.hasDealtDamageInAttack = false;
        this.vx = 0;
      }
    } else if (this.state === 'attack') {
      if (this.currentAnim.currentFrame === 2 && !this.hasDealtDamageInAttack && distToPlayer < 75 && sameFloor) {
        this.hasDealtDamageInAttack = true;
        player.takeDamage(1, this.x + this.width / 2, 'Patrol Pig');
      }
      if (this.currentAnim.finished) {
        this.state = 'patrol';
        this.attackCooldown = 2.5;
        this.currentAnim = this.anims.idle;
      }
    } else if (this.state === 'hit') {
      this.actionTimer -= dt;
      if (this.actionTimer <= 0) {
        this.state = 'patrol';
        this.currentAnim = this.anims.run;
      }
    }

    // Apply movement
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    if (this.y < floor.y - this.height) {
      this.vy += 1800 * dt;
    } else {
      this.y = floor.y - this.height;
      this.vy = 0;
    }

    // Boundaries
    const minX = this.game.world.leftWallWidth + 15;
    const maxX = this.game.world.width - this.game.world.rightWallWidth - this.width - 15;

    if (this.x < minX) {
      this.x = minX;
      this.patrolDir = 1;
    } else if (this.x > maxX) {
      this.x = maxX;
      this.patrolDir = -1;
    }

    this.currentAnim.update(dt);
  }

  draw(ctx, assets, camera) {
    const screenX = this.x - camera.x;
    const screenY = this.y - camera.y;

    if (screenY < -100 || screenY > camera.height + 100) return;

    const drawX = screenX - (this.drawW - this.width) / 2;
    const drawY = screenY - (this.drawH - this.height) + 4;

    this.currentAnim.draw(
      ctx,
      assets,
      drawX,
      drawY,
      this.drawW,
      this.drawH,
      this.facingLeft
    );
  }
}

// ==========================================
// 3. BOMBER PIG & THROWN BOMB
// ==========================================
class BomberPig {
  constructor(game, floorIndex, x) {
    this.game = game;
    this.floorIndex = floorIndex;
    this.type = 'bomber';

    this.width = 46;
    this.height = 54;
    this.x = x;
    this.y = 0;
    this.facingLeft = true;

    this.throwCooldown = 6.0;
    this.state = 'idle'; // idle, picking, throwing, dead
    this.health = 1; // 1 Hit to defeat!
    this.dead = false;

    this.scale = 2.2;
    this.drawW = 26 * this.scale;
    this.drawH = 26 * this.scale;

    this.anims = {
      idle: new SpriteAnimation('pig_bomb_idle', 26, 26, 10, 10, true),
      picking: new SpriteAnimation('pig_bomb_picking', 26, 26, 4, 8, false),
      run: new SpriteAnimation('pig_bomb_run', 26, 26, 6, 10, true),
      throwing: new SpriteAnimation('pig_bomb_throw', 26, 26, 5, 8, false),
      hit: new SpriteAnimation('pig_hit', 34, 28, 2, 8, false),
      dead: new SpriteAnimation('pig_dead', 34, 28, 4, 6, false)
    };
    this.currentAnim = this.anims.idle;

    this.snapToFloor();
  }

  snapToFloor() {
    const f = this.game.world.floors[this.floorIndex];
    if (f) {
      this.y = f.y - this.height;
    }
  }

  takeDamage(amount = 1, dir = 1) {
    if (this.dead) return;
    this.health -= amount;
    this.game.audio.playPigHit();

    if (this.health <= 0) {
      this.dead = true;
      this.state = 'dead';
      this.currentAnim = this.anims.dead;
      this.currentAnim.reset();
      this.game.audio.playPigDead();
      this.game.addScore(180);
      this.game.world.spawnDiamond(this.x + this.width / 2, this.y - 20, 'big');
      this.game.particles.spawnDialogue('dialogue_dead_in', this, 1.0);
    } else {
      this.state = 'hit';
      this.currentAnim = this.anims.hit;
      this.currentAnim.reset();
    }
  }

  update(dt) {
    if (this.dead) {
      this.currentAnim.update(dt);
      return;
    }

    const player = this.game.player;
    this.facingLeft = (player.x < this.x);

    this.throwCooldown -= dt;

    if (this.throwCooldown <= 0 && this.state === 'idle') {
      this.state = 'picking';
      this.currentAnim = this.anims.picking;
      this.currentAnim.reset();
    } else if (this.state === 'picking') {
      if (this.currentAnim.finished) {
        this.state = 'throwing';
        this.currentAnim = this.anims.throwing;
        this.currentAnim.reset();
      }
    } else if (this.state === 'throwing') {
      if (this.currentAnim.currentFrame === 3 && !this.bombSpawned) {
        this.bombSpawned = true;
        // Toss bomb towards player
        const bombVx = (this.facingLeft ? -1 : 1) * (180 + Math.random() * 80);
        const bombVy = -280;
        this.game.spawnBomb(this.x + (this.facingLeft ? -20 : 40), this.y - 10, bombVx, bombVy);
      }
      if (this.currentAnim.finished) {
        this.state = 'idle';
        this.bombSpawned = false;
        this.throwCooldown = 6.0 + Math.random() * 2;
        this.currentAnim = this.anims.idle;
      }
    }

    this.currentAnim.update(dt);
  }

  draw(ctx, assets, camera) {
    const screenX = this.x - camera.x;
    const screenY = this.y - camera.y;

    if (screenY < -100 || screenY > camera.height + 100) return;

    const drawX = screenX - (this.drawW - this.width) / 2;
    const drawY = screenY - (this.drawH - this.height) + 4;

    this.currentAnim.draw(
      ctx,
      assets,
      drawX,
      drawY,
      this.drawW,
      this.drawH,
      this.facingLeft
    );
  }
}

// Active Bomb Entity
class Bomb {
  constructor(game, x, y, vx, vy) {
    this.game = game;
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.width = 42;
    this.height = 42;
    this.gravity = 1400;

    this.timer = 3.5; // explodes after 3.5s (plenty of time to react)
    this.exploded = false;
    this.explosionRadius = 85;

    // Animations (52x56 source)
    this.animScale = 1.4;
    this.drawW = 52 * this.animScale;
    this.drawH = 56 * this.animScale;

    this.anims = {
      on: new SpriteAnimation('bomb_on', 52, 56, 4, 10, true),
      boom: new SpriteAnimation('bomb_boom', 52, 56, 6, 14, false)
    };
    this.currentAnim = this.anims.on;
  }

  // Deflect bomb with hammer swing
  deflect(dirX) {
    this.vx = dirX * 550;
    this.vy = -450;
    this.game.audio.playHammer();
    this.game.particles.spawnSparks(this.x + this.width / 2, this.y + this.height / 2, 10);
    this.game.particles.spawnText('DEFLECTED!', this.x, this.y - 20, '#ffd700', 26);
  }

  explode() {
    if (this.exploded) return;
    this.exploded = true;
    this.currentAnim = this.anims.boom;
    this.currentAnim.reset();
    this.game.audio.playExplosion();
    this.game.camera.shake(14, 0.4);
    this.game.particles.spawnDust(this.x + this.width / 2, this.y + this.height / 2, 12, 'rgba(255, 140, 50,');

    const centerX = this.x + this.width / 2;
    const centerY = this.y + this.height / 2;

    // Damage player if in blast radius
    const player = this.game.player;
    const playerDist = Math.hypot((player.x + player.width / 2) - centerX, (player.y + player.height / 2) - centerY);
    if (playerDist < this.explosionRadius) {
      player.takeDamage(1, centerX, 'Bomb Explosion');
    }

    // Damage enemies in blast radius
    for (const enemy of this.game.enemies) {
      if (enemy === this || enemy.dead) continue;
      const enemyDist = Math.hypot((enemy.x + enemy.width / 2) - centerX, (enemy.y + enemy.height / 2) - centerY);
      if (enemyDist < this.explosionRadius) {
        enemy.takeDamage(2, centerX < enemy.x ? 1 : -1);
      }
    }

    // Break blocks in blast radius
    for (const f of this.game.world.floors) {
      for (const b of f.blocks) {
        if (b.broken) continue;
        const bDist = Math.hypot((b.x + b.width / 2) - centerX, (b.y + b.height / 2) - centerY);
        if (bDist < this.explosionRadius * 0.8) {
          this.game.world.hitBlock(b, 2);
        }
      }
    }
  }

  update(dt) {
    if (this.exploded) {
      this.currentAnim.update(dt);
      return;
    }

    this.timer -= dt;
    if (this.timer <= 0) {
      this.explode();
      return;
    }

    // Physics
    this.vy += this.gravity * dt;
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // Floor bounce
    for (const f of this.game.world.floors) {
      if (this.y + this.height >= f.y && this.y + this.height <= f.y + 30) {
        this.y = f.y - this.height;
        this.vy = -this.vy * 0.55;
        this.vx *= 0.8;
      }
    }

    // Wall bounce
    if (this.x < this.game.world.leftWallWidth) {
      this.x = this.game.world.leftWallWidth;
      this.vx = -this.vx * 0.7;
    } else if (this.x + this.width > this.game.world.width - this.game.world.rightWallWidth) {
      this.x = this.game.world.width - this.game.world.rightWallWidth - this.width;
      this.vx = -this.vx * 0.7;
    }

    this.currentAnim.update(dt);
  }

  draw(ctx, assets, camera) {
    const screenX = this.x - camera.x;
    const screenY = this.y - camera.y;

    if (screenY < -100 || screenY > camera.height + 100) return;

    // Draw prominent warning above ticking bomb!
    if (!this.exploded) {
      const pulse = Math.sin(Date.now() * 0.012) > 0;
      ctx.save();
      ctx.font = '900 24px "Segoe UI", Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = pulse ? '#ff3b30' : '#ffcc00';
      ctx.fillText(`⚠️ BOMB! ${Math.ceil(this.timer)}s`, screenX + this.width / 2, screenY - 14);
      ctx.restore();
    }

    const drawX = screenX - (this.drawW - this.width) / 2;
    const drawY = screenY - (this.drawH - this.height) + 4;

    this.currentAnim.draw(
      ctx,
      assets,
      drawX,
      drawY,
      this.drawW,
      this.drawH,
      false
    );
  }
}

// ==========================================
// 4. CANNON HAZARD & PIG WITH A MATCH
// ==========================================
class CannonHazard {
  constructor(game, floorIndex, x, facingLeft = true) {
    this.game = game;
    this.floorIndex = floorIndex;
    this.type = 'cannon';

    this.width = 70;
    this.height = 46;
    this.x = x;
    this.y = 0;
    this.facingLeft = facingLeft;

    this.timer = 4.0;
    this.state = 'idle'; // idle, lighting, shoot
    this.scale = 2.0;

    this.anims = {
      cannon_idle: new SpriteAnimation('cannon_idle', 44, 28, 1, 1, true),
      cannon_shoot: new SpriteAnimation('cannon_shoot', 44, 28, 4, 12, false),
      pig_match: new SpriteAnimation('pig_match_cannon', 26, 18, 3, 8, false)
    };

    this.snapToFloor();
  }

  snapToFloor() {
    const f = this.game.world.floors[this.floorIndex];
    if (f) {
      this.y = f.y - this.height;
    }
  }

  takeDamage() {
    // Cannon is sturdy, but can be deflected
  }

  update(dt) {
    this.timer -= dt;

    if (this.timer <= 0.8 && this.state === 'idle') {
      this.state = 'lighting';
      this.anims.pig_match.reset();
    }

    if (this.timer <= 0) {
      this.state = 'shoot';
      this.timer = 5.0 + Math.random() * 2;
      this.anims.cannon_shoot.reset();
      this.game.audio.playCannon();
      this.game.camera.shake(6, 0.2);

      // Fire cannonball
      const ballVx = this.facingLeft ? -450 : 450;
      this.game.spawnCannonBall(this.x + (this.facingLeft ? -20 : 60), this.y + 10, ballVx);
    }

    if (this.state === 'shoot' && this.anims.cannon_shoot.finished) {
      this.state = 'idle';
    }

    this.anims.cannon_shoot.update(dt);
    this.anims.pig_match.update(dt);
  }

  draw(ctx, assets, camera) {
    const screenX = this.x - camera.x;
    const screenY = this.y - camera.y;

    // Draw Pig with Match standing behind cannon
    const pigX = this.facingLeft ? (screenX + 50) : (screenX - 45);
    this.anims.pig_match.draw(ctx, assets, pigX, screenY + 6, 26 * 2.0, 18 * 2.0, this.facingLeft);

    // Draw Cannon
    const cannonAnim = (this.state === 'shoot') ? this.anims.cannon_shoot : this.anims.cannon_idle;
    cannonAnim.draw(ctx, assets, screenX, screenY, 44 * this.scale, 28 * this.scale, this.facingLeft);
  }
}

// Flying CannonBall Projectile
class CannonBall {
  constructor(game, x, y, vx) {
    this.game = game;
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.width = 30;
    this.height = 30;
    this.dead = false;
  }

  update(dt) {
    this.x += this.vx * dt;

    // Check collision with player
    const player = this.game.player;
    if (
      this.x < player.x + player.width &&
      this.x + this.width > player.x &&
      this.y < player.y + player.height &&
      this.y + this.height > player.y
    ) {
      player.takeDamage(1, this.x, 'Cannonball Shot');
      this.dead = true;
    }

    // Walls
    if (
      this.x < this.game.world.leftWallWidth ||
      this.x > this.game.world.width - this.game.world.rightWallWidth
    ) {
      this.dead = true;
      this.game.particles.spawnSparks(this.x, this.y, 6);
    }
  }

  draw(ctx, assets, camera) {
    const screenX = this.x - camera.x;
    const screenY = this.y - camera.y;
    const img = assets.getImage('cannon_ball');
    if (img) {
      ctx.drawImage(img, screenX, screenY, this.width, this.height);
    }
  }
}

// ==========================================
// 5. BOSS KING PIG (TOP FLOOR GUARDIAN)
// ==========================================
class KingPig {
  constructor(game, floorIndex, x) {
    this.game = game;
    this.floorIndex = floorIndex;
    this.type = 'king_pig';

    this.width = 68;
    this.height = 72;
    this.x = x;
    this.y = 0;
    this.vx = 0;
    this.vy = 0;

    this.speed = 120;
    this.facingLeft = true;
    this.health = 3; // 3 hits to defeat!
    this.maxHealth = 3;
    this.dead = false;
    this.state = 'idle'; // idle, run, attack, jump, hit, dead
    this.actionTimer = 2.0;

    // Animations (38x28 source)
    this.scale = 2.7;
    this.drawW = 38 * this.scale;
    this.drawH = 28 * this.scale;

    this.anims = {
      idle: new SpriteAnimation('king_pig_idle', 38, 28, 12, 10, true),
      run: new SpriteAnimation('king_pig_run', 38, 28, 6, 10, true),
      attack: new SpriteAnimation('king_pig_attack', 38, 28, 5, 10, false),
      hit: new SpriteAnimation('king_pig_hit', 38, 28, 2, 8, false),
      dead: new SpriteAnimation('king_pig_dead', 38, 28, 4, 6, false)
    };
    this.currentAnim = this.anims.idle;

    this.snapToFloor();
  }

  snapToFloor() {
    const f = this.game.world.floors[this.floorIndex];
    if (f) {
      this.y = f.y - this.height;
    }
  }

  takeDamage(amount = 1, dir = 1) {
    if (this.dead) return;
    this.health -= amount;
    this.game.audio.playPigHit();
    this.game.camera.shake(12, 0.3);

    if (this.health <= 0) {
      this.dead = true;
      this.state = 'dead';
      this.currentAnim = this.anims.dead;
      this.currentAnim.reset();
      this.game.audio.playPigDead();
      this.game.addScore(1000);
      // Burst big diamonds & hearts!
      for (let i = 0; i < 4; i++) {
        this.game.world.spawnDiamond(this.x + i * 20, this.y - 30, 'big');
      }
      this.game.world.spawnHeart(this.x + 30, this.y - 30);
      this.game.particles.spawnDialogue('dialogue_dead_in', this, 1.5);
      this.game.particles.spawnText('BOSS DEFEATED!', this.x, this.y - 50, '#ffcc00', 36);
    } else {
      this.state = 'hit';
      this.currentAnim = this.anims.hit;
      this.currentAnim.reset();
      this.actionTimer = 0.4;
      this.vx = dir * 250;
      this.game.particles.spawnDialogue('dialogue_wtf_in', this, 0.8);
    }
  }

  update(dt) {
    if (this.dead) {
      this.currentAnim.update(dt);
      return;
    }

    const floor = this.game.world.floors[this.floorIndex];
    if (!floor) return;

    const player = this.game.player;
    this.facingLeft = (player.x < this.x);
    const distToPlayer = Math.abs((player.x + player.width / 2) - (this.x + this.width / 2));

    this.actionTimer -= dt;

    if (this.state === 'idle') {
      if (this.actionTimer <= 0) {
        this.actionTimer = 2.0;
        this.state = 'run';
        this.currentAnim = this.anims.run;
      }
    } else if (this.state === 'run') {
      this.vx = (this.facingLeft ? -1 : 1) * this.speed;
      if (distToPlayer < 90) {
        this.state = 'attack';
        this.currentAnim = this.anims.attack;
        this.currentAnim.reset();
        this.hasDealtDamageInAttack = false;
        this.vx = 0;
      } else if (this.actionTimer <= 0) {
        this.state = 'idle';
        this.actionTimer = 1.5;
        this.currentAnim = this.anims.idle;
      }
    } else if (this.state === 'attack') {
      if (this.currentAnim.currentFrame === 2 && !this.hasDealtDamageInAttack && distToPlayer < 95) {
        this.hasDealtDamageInAttack = true;
        player.takeDamage(1, this.x + this.width / 2, 'Boss King Pig');
      }
      if (this.currentAnim.finished) {
        this.state = 'idle';
        this.actionTimer = 2.0;
        this.currentAnim = this.anims.idle;
      }
    } else if (this.state === 'hit') {
      if (this.actionTimer <= 0) {
        this.state = 'run';
        this.currentAnim = this.anims.run;
      }
    }

    this.x += this.vx * dt;
    this.y += this.vy * dt;

    if (this.y < floor.y - this.height) {
      this.vy += 1800 * dt;
    } else {
      this.y = floor.y - this.height;
      this.vy = 0;
    }

    // Bounds on throne floor
    const minX = this.game.world.leftWallWidth + 20;
    const maxX = this.game.world.width - this.game.world.rightWallWidth - this.width - 20;
    if (this.x < minX) this.x = minX;
    if (this.x > maxX) this.x = maxX;

    this.currentAnim.update(dt);
  }

  draw(ctx, assets, camera) {
    const screenX = this.x - camera.x;
    const screenY = this.y - camera.y;

    if (screenY < -100 || screenY > camera.height + 100) return;

    // Draw Boss HP bar
    ctx.save();
    ctx.fillStyle = '#222';
    ctx.fillRect(screenX, screenY - 24, this.width, 10);
    const hpRatio = Math.max(0, this.health / this.maxHealth);
    ctx.fillStyle = '#ff3333';
    ctx.fillRect(screenX + 1, screenY - 23, (this.width - 2) * hpRatio, 8);
    ctx.restore();

    const drawX = screenX - (this.drawW - this.width) / 2;
    const drawY = screenY - (this.drawH - this.height) + 6;

    this.currentAnim.draw(
      ctx,
      assets,
      drawX,
      drawY,
      this.drawW,
      this.drawH,
      this.facingLeft
    );
  }
}



// ===== scripts/game.js =====
// scripts/game.js - Main Game Engine, States, Camera, Input, and HUD






class Game {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');

    // Canvas resolution: 1080 x 1920
    this.canvas.width = 1080;
    this.canvas.height = 1920;

    // Enable crisp pixelated scaling
    this.ctx.imageSmoothingEnabled = false;

    // Subsystems
    this.audio = new SoundManager();
    this.assets = new AssetManager();
    this.particles = new ParticleManager();
    this.world = new World(this);
    this.player = new Player(this);

    // Entities
    this.enemies = [];
    this.bombs = [];
    this.projectiles = [];

    // Camera
    this.camera = {
      x: 0,
      y: 0,
      width: 1080,
      height: 1920,
      shakeIntensity: 0,
      shakeDuration: 0,
      shake: (intensity, duration) => {
        this.camera.shakeIntensity = intensity;
        this.camera.shakeDuration = duration;
      }
    };

    // Game State
    this.state = 'LOADING'; // LOADING, START, PLAYING, PAUSED, STAGE_CLEAR, GAME_OVER
    this.loadProgress = 0;
    this.stage = 1;
    this.score = 0;
    this.gems = 0;
    this.currentFloor = 1;
    this.damageFlash = 0;
    this.deathReason = 'Enemy Attack';

    // Input States
    this.input = {
      left: false,
      right: false,
      up: false,
      down: false,
      jump: false,
      attack: false,
      attackJustPressed: false,
      upSmashJustPressed: false
    };

    this.lastTime = performance.now();

    this.setupInputs();
  }

  setupInputs() {
    // Keyboard inputs
    window.addEventListener('keydown', (e) => {
      this.audio.init();

      if (e.repeat) return;
      const key = e.key.toLowerCase();

      if (key === 'a' || key === 'arrowleft') this.input.left = true;
      if (key === 'd' || key === 'arrowright') this.input.right = true;
      if (key === 'w' || key === 'arrowup') {
        this.input.up = true;
        this.input.jump = true;
      }
      if (key === 's' || key === 'arrowdown') this.input.down = true;
      if (key === ' ' || key === 'w') this.input.jump = true;

      // Attack keys: J, Z, X, Enter, F
      if (key === 'j' || key === 'z' || key === 'x' || key === 'enter' || key === 'f') {
        this.input.attack = true;
        this.input.attackJustPressed = true;
      }

      // Up Smash shortcut: K or U
      if (key === 'k' || key === 'u') {
        this.input.upSmashJustPressed = true;
      }

      // Pause key: P or Escape
      if (key === 'p' || key === 'escape') {
        this.togglePause();
      }

      // Start game from title / retry
      if (this.state === 'START' || this.state === 'GAME_OVER' || this.state === 'STAGE_CLEAR') {
        if (key === ' ' || key === 'enter') {
          this.handleStateAction();
        }
      }
    });

    window.addEventListener('keyup', (e) => {
      const key = e.key.toLowerCase();
      if (key === 'a' || key === 'arrowleft') this.input.left = false;
      if (key === 'd' || key === 'arrowright') this.input.right = false;
      if (key === 'w' || key === 'arrowup') {
        this.input.up = false;
        this.input.jump = false;
      }
      if (key === 's' || key === 'arrowdown') this.input.down = false;
      if (key === ' ') this.input.jump = false;
      if (key === 'j' || key === 'z' || key === 'x' || key === 'enter' || key === 'f') {
        this.input.attack = false;
      }
    });

    // Touch / On-screen Button inputs
    this.bindTouchButton('btn-left', (pressed) => this.input.left = pressed);
    this.bindTouchButton('btn-right', (pressed) => this.input.right = pressed);
    this.bindTouchButton('btn-jump', (pressed) => {
      this.input.jump = pressed;
    });
    this.bindTouchButton('btn-attack', (pressed) => {
      this.input.attack = pressed;
      if (pressed) this.input.attackJustPressed = true;
    });
    this.bindTouchButton('btn-up-smash', (pressed) => {
      if (pressed) this.input.upSmashJustPressed = true;
    });

    // UI Buttons
    const pauseBtn = document.getElementById('btn-pause');
    if (pauseBtn) {
      pauseBtn.addEventListener('click', () => this.togglePause());
    }

    const muteBtn = document.getElementById('btn-mute');
    if (muteBtn) {
      muteBtn.addEventListener('click', () => {
        this.audio.init();
        const isMuted = this.audio.toggleMute();
        muteBtn.textContent = isMuted ? '🔇' : '🔊';
      });
    }

    // Canvas click/touch for Title Screen, Game Over, Stage Clear
    this.canvas.addEventListener('pointerdown', (e) => {
      this.audio.init();
      if (this.state === 'START' || this.state === 'GAME_OVER' || this.state === 'STAGE_CLEAR') {
        this.handleStateAction();
      }
    });
  }

  bindTouchButton(id, callback) {
    const el = document.getElementById(id);
    if (!el) return;

    const start = (e) => {
      e.preventDefault();
      this.audio.init();
      callback(true);
      el.classList.add('active');
    };

    const end = (e) => {
      e.preventDefault();
      callback(false);
      el.classList.remove('active');
    };

    el.addEventListener('pointerdown', start);
    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', end);
    el.addEventListener('pointerleave', end);
  }

  handleStateAction() {
    if (this.state === 'START') {
      this.startStage(1);
    } else if (this.state === 'GAME_OVER') {
      this.score = 0;
      this.gems = 0;
      this.startStage(1);
    } else if (this.state === 'STAGE_CLEAR') {
      this.startStage(this.stage + 1);
    }
  }

  togglePause() {
    if (this.state === 'PLAYING') {
      this.state = 'PAUSED';
    } else if (this.state === 'PAUSED') {
      this.state = 'PLAYING';
    }
  }

  addScore(points) {
    this.score += points;
  }

  addGem() {
    this.gems += 1;
  }

  spawnBomb(x, y, vx, vy) {
    this.bombs.push(new Bomb(this, x, y, vx, vy));
  }

  spawnCannonBall(x, y, vx) {
    this.projectiles.push(new CannonBall(this, x, y, vx));
  }

  startStage(stageNum) {
    this.stage = stageNum;
    this.state = 'PLAYING';
    this.particles.reset();
    this.enemies = [];
    this.bombs = [];
    this.projectiles = [];

    // Build World
    this.world.buildLevel(this.stage);

    // Reset Player at bottom
    this.player.reset(540 - this.player.width / 2, this.world.groundY - this.player.height);

    // Initial camera snap to bottom
    this.camera.y = this.world.groundY - this.camera.height + 250;

    // Spawn Enemies on Floors (Balanced, smooth, fun progression)
    // Floor 1: Safe practice floor for jumping & breaking walls!

    // Floor 2: 1 slow Repairer Pig ("enemy ra vanga wall jora lagete chaiba")
    this.enemies.push(new RepairerPig(this, 2, 450));

    // Floor 3: 1 slow Patrol Pig
    this.enemies.push(new PatrolPig(this, 3, 350));

    // Floor 4: 1 slow Repairer Pig
    this.enemies.push(new RepairerPig(this, 4, 520));

    // Floor 5: 1 Bomber Pig
    this.enemies.push(new BomberPig(this, 5, 750));

    // Floor 6 (Top Throne Floor): Boss King Pig guarding the Royal Door!
    this.enemies.push(new KingPig(this, 6, 540));

    // Start chiptune BGM
    this.audio.startBGM();
  }

  triggerDamageFlash() {
    this.damageFlash = 0.45;
  }

  onPlayerDeath(reason = 'Enemy Attack') {
    this.deathReason = reason;
    setTimeout(() => {
      this.state = 'GAME_OVER';
    }, 1200);
  }

  onStageCleared() {
    setTimeout(() => {
      this.state = 'STAGE_CLEAR';
      this.addScore(2000);
    }, 1800);
  }

  async start() {
    // Show Loading
    this.state = 'LOADING';

    await this.assets.loadAll((progress) => {
      this.loadProgress = progress;
    });

    this.state = 'START';
    this.loop(performance.now());
  }

  loop(currentTime) {
    const dt = Math.min((currentTime - this.lastTime) / 1000, 0.05);
    this.lastTime = currentTime;

    this.update(dt);
    this.draw();

    // Reset single-frame inputs
    this.input.attackJustPressed = false;
    this.input.upSmashJustPressed = false;

    requestAnimationFrame((t) => this.loop(t));
  }

  update(dt) {
    if (this.state === 'PLAYING') {
      // Update Player
      this.player.update(dt, this.input);

      // Update World
      this.world.update(dt);

      // Update Enemies
      for (let i = this.enemies.length - 1; i >= 0; i--) {
        const enemy = this.enemies[i];
        enemy.update(dt);
        if (enemy.dead && enemy.currentAnim.finished) {
          this.enemies.splice(i, 1);
        }
      }

      // Update Bombs
      for (let i = this.bombs.length - 1; i >= 0; i--) {
        const b = this.bombs[i];
        b.update(dt);
        if (b.exploded && b.currentAnim.finished) {
          this.bombs.splice(i, 1);
        }
      }

      // Update Projectiles
      for (let i = this.projectiles.length - 1; i >= 0; i--) {
        const p = this.projectiles[i];
        p.update(dt);
        if (p.dead) {
          this.projectiles.splice(i, 1);
        }
      }

      // Update Particles & FX
      this.particles.update(dt);

      // Calculate player's current floor
      const playerY = this.player.y + this.player.height;
      let floorIdx = 0;
      for (let i = 0; i < this.world.floors.length; i++) {
        if (playerY <= this.world.floors[i].y + 20) {
          floorIdx = i;
        }
      }
      this.currentFloor = Math.max(1, floorIdx);

      // Camera smoothly follows player vertically
      const targetCamY = this.player.y - this.camera.height * 0.58;
      this.camera.y += (targetCamY - this.camera.y) * 0.08;

      // Clamp camera bounds
      const minCamY = 60;
      const maxCamY = this.world.groundY - this.camera.height + 150;
      if (this.camera.y < minCamY) this.camera.y = minCamY;
      if (this.camera.y > maxCamY) this.camera.y = maxCamY;

      // Damage Flash Timer
      if (this.damageFlash > 0) {
        this.damageFlash -= dt;
      }

      // Camera Shake
      if (this.camera.shakeDuration > 0) {
        this.camera.shakeDuration -= dt;
        this.camera.x = (Math.random() * 2 - 1) * this.camera.shakeIntensity;
        this.camera.y += (Math.random() * 2 - 1) * this.camera.shakeIntensity;
      } else {
        this.camera.x = 0;
      }
    }
  }

  draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    if (this.state === 'LOADING') {
      this.drawLoadingScreen();
      return;
    }

    if (this.state === 'START') {
      this.drawStartScreen();
      return;
    }

    // 1. Draw World & Platforms
    this.world.draw(this.ctx, this.assets, this.camera);

    // 2. Draw Enemies
    for (const enemy of this.enemies) {
      enemy.draw(this.ctx, this.assets, this.camera);
    }

    // 3. Draw Bombs & Projectiles
    for (const b of this.bombs) {
      b.draw(this.ctx, this.assets, this.camera);
    }
    for (const p of this.projectiles) {
      p.draw(this.ctx, this.assets, this.camera);
    }

    // 4. Draw Player
    this.player.draw(this.ctx, this.assets, this.camera);

    // 5. Draw Particles, Debris & Floating Texts
    this.particles.draw(this.ctx, this.assets, this.camera);

    // 6. Red Damage Flash Overlay
    if (this.damageFlash > 0) {
      this.ctx.save();
      this.ctx.fillStyle = `rgba(255, 30, 30, ${Math.min(0.4, this.damageFlash * 0.8)})`;
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.restore();
    }

    // 7. Draw HUD Overlay
    this.drawHUD();

    // 8. Draw State Overlays (Paused, Stage Clear, Game Over)
    if (this.state === 'PAUSED') {
      this.drawPauseOverlay();
    } else if (this.state === 'STAGE_CLEAR') {
      this.drawStageClearOverlay();
    } else if (this.state === 'GAME_OVER') {
      this.drawGameOverOverlay();
    }
  }

  // --- HUD RENDERING ---
  drawHUD() {
    const ctx = this.ctx;

    // 1. Live Bar & Hearts
    const liveBarImg = this.assets.getImage('live_bar');
    const heartImg = this.assets.getImage('big_heart_idle');

    if (liveBarImg) {
      ctx.save();
      const hudScale = 3.0;
      ctx.drawImage(liveBarImg, 30, 40, liveBarImg.width * hudScale, liveBarImg.height * hudScale);

      // Draw active hearts inside bar
      if (heartImg) {
        for (let h = 0; h < this.player.maxHealth; h++) {
          if (h < this.player.health) {
            ctx.drawImage(heartImg, 0, 0, 18, 14, 72 + h * 24, 66, 24, 18);
          }
        }
      }
      ctx.restore();
    }

    // 2. Score & Gems (Top Right)
    ctx.save();
    ctx.textAlign = 'right';
    ctx.font = '900 36px "Segoe UI", Arial, sans-serif';
    ctx.fillStyle = '#ffcc00';
    ctx.fillText(`SCORE  ${this.score}`, 1050, 75);

    // Diamonds count
    const diamondImg = this.assets.getImage('small_diamond');
    if (diamondImg) {
      ctx.drawImage(diamondImg, 0, 0, 18, 14, 880, 95, 32, 26);
    }
    ctx.fillStyle = '#50e3c2';
    ctx.font = '900 32px "Segoe UI", Arial, sans-serif';
    ctx.fillText(`× ${this.gems}`, 1050, 120);

    // 3. Current Floor Indicator (Top Center)
    ctx.textAlign = 'center';
    ctx.font = '900 42px "Segoe UI", Arial, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`STAGE ${this.stage} • FLOOR ${this.currentFloor} / 6`, 540, 75);

    // Climbing Progress Bar
    const progressTotal = this.world.groundY - 240;
    const currentProgress = Math.max(0, Math.min(1, (this.world.groundY - (this.player.y + this.player.height)) / progressTotal));
    ctx.fillStyle = '#2d2540';
    ctx.fillRect(420, 95, 240, 12);
    ctx.fillStyle = '#f5a623';
    ctx.fillRect(420, 95, 240 * currentProgress, 12);

    ctx.restore();
  }

  // --- SCREENS & OVERLAYS ---

  drawLoadingScreen() {
    const ctx = this.ctx;
    ctx.fillStyle = '#14121e';
    ctx.fillRect(0, 0, 1080, 1920);

    ctx.fillStyle = '#fff';
    ctx.font = '900 56px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('LOADING ASSETS...', 540, 900);

    // Progress Bar
    const barW = 600;
    const barH = 28;
    ctx.fillStyle = '#333';
    ctx.fillRect(240, 960, barW, barH);
    ctx.fillStyle = '#ffcc00';
    ctx.fillRect(240, 960, barW * this.loadProgress, barH);
  }

  drawStartScreen() {
    const ctx = this.ctx;
    ctx.fillStyle = '#171424';
    ctx.fillRect(0, 0, 1080, 1920);

    // Background Castle Brick Lines
    ctx.strokeStyle = '#272238';
    ctx.lineWidth = 3;
    for (let y = 0; y < 1920; y += 80) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(1080, y);
      ctx.stroke();
    }

    // Title Banner
    ctx.save();
    ctx.textAlign = 'center';

    // Game Logo
    ctx.font = '900 88px "Segoe UI", Arial, sans-serif';
    ctx.fillStyle = '#f5a623';
    ctx.shadowColor = '#000';
    ctx.shadowBlur = 20;
    ctx.fillText('HIT UP!', 540, 480);

    ctx.font = '900 46px "Segoe UI", Arial, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText("KING'S TOWER SMASH", 540, 560);

    // King Human hero preview
    const kingImg = this.assets.getImage('king_idle');
    if (kingImg) {
      const scale = 4.5;
      const frameW = 78;
      const frameH = 58;
      const frameIdx = Math.floor(Date.now() * 0.008) % 11;
      ctx.drawImage(
        kingImg,
        frameIdx * frameW, 0, frameW, frameH,
        540 - (frameW * scale) / 2, 660,
        frameW * scale, frameH * scale
      );
    }

    // Mission description
    ctx.font = '600 32px "Segoe UI", Arial, sans-serif';
    ctx.fillStyle = '#c5b8e0';
    ctx.fillText('🔨 Smash ceiling blocks with your War Hammer!', 540, 1020);
    ctx.fillText('🪜 Jump through gaps to ascend the castle floors!', 540, 1080);
    ctx.fillText('🐷 Beware! Builder Pigs rush to repair the holes!', 540, 1140);
    ctx.fillText('💣 Defeat bombers, patrol pigs & King Pig at the top!', 540, 1200);

    // Controls Guide Box
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(160, 1270, 760, 240);
    ctx.strokeStyle = '#4e4368';
    ctx.lineWidth = 4;
    ctx.strokeRect(160, 1270, 760, 240);

    ctx.font = '700 28px "Segoe UI", Arial, sans-serif';
    ctx.fillStyle = '#ffcc00';
    ctx.fillText('CONTROLS', 540, 1315);
    ctx.fillStyle = '#ffffff';
    ctx.font = '500 26px "Segoe UI", Arial, sans-serif';
    ctx.fillText('Desktop: WASD / Arrows = Move & Jump | J / Enter / Space = Hammer', 540, 1370);
    ctx.fillText('Up + Hammer (or K) = Upward Smash to break ceiling', 540, 1420);
    ctx.fillText('Mobile / Touch: On-Screen Touch Buttons', 540, 1470);

    // Press to Start Button
    const pulse = Math.sin(Date.now() * 0.006) * 6;
    ctx.fillStyle = '#4cd964';
    ctx.fillRect(290, 1580 - pulse, 500, 100);
    ctx.fillStyle = '#000';
    ctx.font = '900 44px "Segoe UI", Arial, sans-serif';
    ctx.fillText('TAP TO PLAY', 540, 1648 - pulse);

    ctx.restore();
  }

  drawPauseOverlay() {
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(10, 8, 18, 0.75)';
    ctx.fillRect(0, 0, 1080, 1920);

    ctx.save();
    ctx.textAlign = 'center';
    ctx.font = '900 72px "Segoe UI", Arial, sans-serif';
    ctx.fillStyle = '#fff';
    ctx.fillText('PAUSED', 540, 920);

    ctx.font = '600 36px "Segoe UI", Arial, sans-serif';
    ctx.fillStyle = '#aaa';
    ctx.fillText('Press P or Tap Pause to Resume', 540, 1000);
    ctx.restore();
  }

  drawStageClearOverlay() {
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(15, 12, 28, 0.88)';
    ctx.fillRect(0, 0, 1080, 1920);

    ctx.save();
    ctx.textAlign = 'center';

    ctx.font = '900 80px "Segoe UI", Arial, sans-serif';
    ctx.fillStyle = '#ffd700';
    ctx.fillText('STAGE CLEARED!', 540, 750);

    ctx.font = '600 38px "Segoe UI", Arial, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`Stage ${this.stage} Conquered!`, 540, 840);
    ctx.fillText(`Score: ${this.score}`, 540, 920);
    ctx.fillText(`Diamonds: ${this.gems}`, 540, 990);

    // Next Stage Button
    ctx.fillStyle = '#4cd964';
    ctx.fillRect(320, 1100, 440, 100);
    ctx.fillStyle = '#000';
    ctx.font = '900 42px "Segoe UI", Arial, sans-serif';
    ctx.fillText('NEXT STAGE', 540, 1168);
    ctx.restore();
  }

  drawGameOverOverlay() {
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(25, 8, 12, 0.94)';
    ctx.fillRect(0, 0, 1080, 1920);

    ctx.save();
    ctx.textAlign = 'center';

    ctx.font = '900 84px "Segoe UI", Arial, sans-serif';
    ctx.fillStyle = '#ff3b30';
    ctx.fillText('GAME OVER', 540, 680);

    // Explicit cause of death
    ctx.font = '900 42px "Segoe UI", Arial, sans-serif';
    ctx.fillStyle = '#ffcc00';
    ctx.fillText(`KILLED BY: ${this.deathReason || 'Enemy Attack'}`, 540, 770);

    ctx.font = '600 36px "Segoe UI", Arial, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`Reached Floor: ${this.currentFloor} / 6`, 540, 840);
    ctx.fillText(`Final Score: ${this.score}`, 540, 900);
    ctx.fillText(`Diamonds Collected: ${this.gems}`, 540, 960);

    // Actionable Tactical Tip
    ctx.font = '500 28px "Segoe UI", Arial, sans-serif';
    ctx.fillStyle = '#c5b8e0';
    let tip = '💡 Tip: Swing your hammer to strike enemies before they touch you!';
    if (this.deathReason && this.deathReason.includes('Bomb')) {
      tip = '💡 Tip: You can hit bombs with your hammer to deflect them away!';
    } else if (this.deathReason && this.deathReason.includes('Patrol')) {
      tip = '💡 Tip: Strike the patrol pig with your hammer to defeat it in 1 hit!';
    } else if (this.deathReason && this.deathReason.includes('Cannon')) {
      tip = '💡 Tip: Watch for cannon fuse sparks and jump to dodge!';
    }
    ctx.fillText(tip, 540, 1030);

    // Retry Button
    ctx.fillStyle = '#f5a623';
    ctx.fillRect(320, 1100, 440, 100);
    ctx.fillStyle = '#000';
    ctx.font = '900 44px "Segoe UI", Arial, sans-serif';
    ctx.fillText('TRY AGAIN', 540, 1168);
    ctx.restore();
  }
}

// Auto-boot game in browser
if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    const game = new Game();
    game.start();
  });
}


})();
