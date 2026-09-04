/**
 * =========================================================================
 * 🔊 RICKY JUMP - SOUND ENGINE (scripts/audio.js)
 * =========================================================================
 * Uses Web Audio API for zero-latency, procedural arcade sound effects.
 * 100% offline, zero external asset downloads, cross-browser compatible.
 */

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.masterVolume = 0.4;
    this.chargeOsc = null;
    this.chargeGain = null;
    this.initDone = false;
  }

  init() {
    if (this.initDone) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.ctx = new AudioContext();
        this.initDone = true;
      }
    } catch (e) {
      console.warn('Web Audio API not supported:', e);
    }
  }

  ensureContext() {
    this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.isMuted) {
      this.stopCharge();
    }
    return this.isMuted;
  }

  /**
   * Start / update continuous charging hum based on current charge ratio (0.0 to 1.0)
   * @param {number} ratio - 0.0 to 1.0 force level
   */
  playCharge(ratio) {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const targetFreq = 160 + ratio * 420; // 160Hz to 580Hz rising pitch

    if (!this.chargeOsc) {
      this.chargeOsc = this.ctx.createOscillator();
      this.chargeGain = this.ctx.createGain();

      this.chargeOsc.type = 'triangle';
      this.chargeOsc.frequency.setValueAtTime(targetFreq, t);

      // Low pass filter for warm energetic hum
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, t);

      this.chargeGain.gain.setValueAtTime(0.01, t);
      this.chargeGain.gain.linearRampToValueAtTime(0.22 * this.masterVolume, t + 0.05);

      this.chargeOsc.connect(filter);
      filter.connect(this.chargeGain);
      this.chargeGain.connect(this.ctx.destination);

      this.chargeOsc.start(t);
    } else {
      // Modulate frequency smoothly with force oscillation
      this.chargeOsc.frequency.setTargetAtTime(targetFreq, t, 0.03);
    }
  }

  /** Stop the charging hum */
  stopCharge() {
    if (this.chargeGain && this.ctx) {
      try {
        const t = this.ctx.currentTime;
        this.chargeGain.gain.linearRampToValueAtTime(0.0001, t + 0.04);
        if (this.chargeOsc) {
          this.chargeOsc.stop(t + 0.05);
          this.chargeOsc.disconnect();
          this.chargeOsc = null;
        }
      } catch (e) {}
    }
    this.chargeOsc = null;
    this.chargeGain = null;
  }

  /** Jump launch whoosh sound */
  playJump() {
    this.stopCharge();
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.exponentialRampToValueAtTime(680, t + 0.16);

    gain.gain.setValueAtTime(0.35 * this.masterVolume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.22);
  }

  /** Safe landing thud */
  playLand() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(45, t + 0.12);

    gain.gain.setValueAtTime(0.4 * this.masterVolume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.16);
  }

  /** Perfect landing celebration chime */
  playPerfect() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const t = this.ctx.currentTime + idx * 0.04;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.28 * this.masterVolume, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.28);
    });
  }

  /** Ceiling spike collision - explosive smash */
  playSpikeHit() {
    this.stopCharge();
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;

    // Metallic harsh impact
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(420, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.25);

    gain.gain.setValueAtTime(0.6 * this.masterVolume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.32);

    // Noise burst
    const bufferSize = this.ctx.sampleRate * 0.2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;

    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(1200, t);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.4 * this.masterVolume, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

    whiteNoise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.ctx.destination);

    whiteNoise.start(t);
  }

  /** Falling whistle into abyss */
  playFall() {
    this.stopCharge();
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(500, t);
    osc.frequency.exponentialRampToValueAtTime(80, t + 0.5);

    gain.gain.setValueAtTime(0.35 * this.masterVolume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.55);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.58);
  }

  /** Game over cadence */
  playGameOver() {
    this.stopCharge();
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const notes = [330, 311, 293, 261]; // E4, D#4, D4, C4
    notes.forEach((freq, idx) => {
      const t = this.ctx.currentTime + 0.15 + idx * 0.12;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.3 * this.masterVolume, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.25);
    });
  }
}

export const soundEngine = new SoundEngine();
if (typeof window !== 'undefined') {
  window.soundEngine = soundEngine;
}

