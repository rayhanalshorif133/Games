/**
 * Retro Space Invaders - Procedural Web Audio Synthesizer
 * 
 * Generates 100% synthesized authentic 8-bit retro arcade sounds
 * using the Web Audio API without needing any external audio assets.
 */

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.masterVolume = 0.35;
    this.marchNoteIndex = 0;
    this.ufoOscillator = null;
    this.ufoGain = null;
    this.ufoLfo = null;
    this.isUfoPlaying = false;

    // Retrieve muted preference
    if (typeof localStorage !== 'undefined') {
      this.isMuted = localStorage.getItem('invaders_muted') === 'true';
    }
  }

  /**
   * Initializes AudioContext on first user interaction
   */
  initContext() {
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

  setMuted(muted) {
    this.isMuted = muted;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('invaders_muted', muted ? 'true' : 'false');
    }
    if (this.isMuted && this.isUfoPlaying) {
      this.stopUfo();
    }
    return this.isMuted;
  }

  toggleMute() {
    return this.setMuted(!this.isMuted);
  }

  /**
   * Classic 4-note descending heartbeat march:
   * Note 0: ~175Hz, Note 1: ~155Hz, Note 2: ~140Hz, Note 3: ~125Hz
   */
  playMarchStep() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const notes = [174.61, 155.56, 138.59, 123.47]; // F3, Eb3, Db3, B2
    const freq = notes[this.marchNoteIndex % notes.length];
    this.marchNoteIndex++;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.85, now + 0.1);

    gain.gain.setValueAtTime(this.masterVolume * 0.45, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.13);
  }

  resetMarch() {
    this.marchNoteIndex = 0;
  }

  /**
   * Player laser fire pew
   */
  playPlayerShoot() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(950, now);
    osc.frequency.exponentialRampToValueAtTime(140, now + 0.15);

    gain.gain.setValueAtTime(this.masterVolume * 0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.17);
  }

  /**
   * Alien bomb drop sound
   */
  playAlienShoot() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.linearRampToValueAtTime(560, now + 0.08);
    osc.frequency.linearRampToValueAtTime(220, now + 0.16);

    gain.gain.setValueAtTime(this.masterVolume * 0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.17);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.18);
  }

  /**
   * Alien destroyed - crisp crunchy noise burst
   */
  playAlienExplosion() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const bufferSize = Math.floor(this.ctx.sampleRate * 0.18);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1200, this.ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(300, this.ctx.currentTime + 0.18);

    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;
    gain.gain.setValueAtTime(this.masterVolume * 0.55, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start(now);
  }

  /**
   * Player cannon destroyed - dramatic exploding blast
   */
  playPlayerExplosion() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    // Low boom oscillator
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.6);

    oscGain.gain.setValueAtTime(this.masterVolume * 0.7, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

    osc.connect(oscGain);
    oscGain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.65);

    // Crackling noise overlay
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.6);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, now);
    filter.frequency.exponentialRampToValueAtTime(100, now + 0.6);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(this.masterVolume * 0.6, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.ctx.destination);

    noise.start(now);
  }

  /**
   * Start UFO siren warble
   */
  startUfo() {
    if (this.isMuted || this.isUfoPlaying) return;
    this.initContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      this.ufoOscillator = this.ctx.createOscillator();
      this.ufoGain = this.ctx.createGain();
      this.ufoLfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();

      this.ufoOscillator.type = 'triangle';
      this.ufoOscillator.frequency.setValueAtTime(450, now);

      this.ufoLfo.type = 'square';
      this.ufoLfo.frequency.setValueAtTime(5.5, now); // Warble speed

      lfoGain.gain.setValueAtTime(90, now); // Warble depth
      this.ufoLfo.connect(this.ufoOscillator.frequency);

      this.ufoGain.gain.setValueAtTime(this.masterVolume * 0.28, now);

      this.ufoOscillator.connect(this.ufoGain);
      this.ufoGain.connect(this.ctx.destination);

      this.ufoOscillator.start(now);
      this.ufoLfo.start(now);
      this.isUfoPlaying = true;
    } catch (e) {
      console.warn('UFO sound failed:', e);
    }
  }

  /**
   * Stop UFO siren
   */
  stopUfo() {
    if (!this.isUfoPlaying) return;
    try {
      if (this.ufoGain && this.ctx) {
        this.ufoGain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);
      }
      setTimeout(() => {
        if (this.ufoOscillator) {
          try { this.ufoOscillator.stop(); this.ufoOscillator.disconnect(); } catch (e) {}
          this.ufoOscillator = null;
        }
        if (this.ufoLfo) {
          try { this.ufoLfo.stop(); this.ufoLfo.disconnect(); } catch (e) {}
          this.ufoLfo = null;
        }
        this.isUfoPlaying = false;
      }, 60);
    } catch (e) {
      this.isUfoPlaying = false;
    }
  }

  /**
   * UFO mystery bonus hit
   */
  playUfoHit() {
    this.stopUfo();
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const notes = [587.33, 739.99, 880.00, 1174.66]; // D5, F#5, A5, D6
    notes.forEach((freq, idx) => {
      const now = this.ctx.currentTime + idx * 0.06;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(this.masterVolume * 0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.14);
    });
  }

  /**
   * Destructible bunker shield hit
   */
  playBunkerHit() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.05);

    gain.gain.setValueAtTime(this.masterVolume * 0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.06);
  }

  /**
   * Wave Clear / Level Up Victory Fanfare
   */
  playWaveClear() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const melody = [
      { f: 523.25, d: 0.1 },  // C5
      { f: 659.25, d: 0.1 },  // E5
      { f: 783.99, d: 0.1 },  // G5
      { f: 1046.50, d: 0.25 } // C6
    ];

    let t = this.ctx.currentTime;
    melody.forEach(item => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(item.f, t);

      gain.gain.setValueAtTime(this.masterVolume * 0.45, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + item.d);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + item.d + 0.02);
      t += item.d;
    });
  }

  /**
   * Extra Life Award
   */
  playExtraLife() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const freqs = [659.25, 880.00, 1318.51];
    let t = this.ctx.currentTime;
    freqs.forEach(f => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(f, t);
      gain.gain.setValueAtTime(this.masterVolume * 0.35, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.13);
      t += 0.09;
    });
  }

  /**
   * Game Over Jingle
   */
  playGameOver() {
    this.stopUfo();
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const notes = [329.63, 311.13, 293.66, 277.18]; // E4, Eb4, D4, C#4
    let t = this.ctx.currentTime;
    notes.forEach((f, idx) => {
      const dur = idx === notes.length - 1 ? 0.4 : 0.15;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(f, t);
      gain.gain.setValueAtTime(this.masterVolume * 0.4, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + dur + 0.05);
      t += dur * 0.9;
    });
  }
}

if (typeof window !== 'undefined') {
  window.SoundEngine = SoundEngine;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SoundEngine;
}

