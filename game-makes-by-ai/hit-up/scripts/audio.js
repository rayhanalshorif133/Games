// scripts/audio.js - Procedural Web Audio synthesizer (No external audio files required!)
export class SoundManager {
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

