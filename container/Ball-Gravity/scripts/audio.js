/**
 * =========================================================================
 * 🔊 BALL-GRAVITY - PROCEDURAL SOUND ENGINE (scripts/audio.js)
 * =========================================================================
 * Uses Web Audio API for zero-latency, high-fidelity procedural game audio.
 * No external asset downloads required; works 100% offline and cross-browser.
 */

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.masterVolume = 0.45;
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
    return this.isMuted;
  }

  // --- Sound Effects ---

  /** Arrow loose / shoot sound */
  playShoot() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    
    // Bow string twang (bandpass noise + snappy osc)
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(360, t);
    osc.frequency.exponentialRampToValueAtTime(70, t + 0.08);

    gain.gain.setValueAtTime(0.3 * this.masterVolume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.1);

    // Aerodynamic whoosh
    const bufferSize = this.ctx.sampleRate * 0.12;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(800, t);
    filter.frequency.exponentialRampToValueAtTime(2400, t + 0.06);
    filter.frequency.exponentialRampToValueAtTime(400, t + 0.12);
    filter.Q.setValueAtTime(3.0, t);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.01, t);
    noiseGain.gain.linearRampToValueAtTime(0.25 * this.masterVolume, t + 0.04);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.ctx.destination);

    noise.start(t);
    noise.stop(t + 0.12);
  }

  /** Arrow hits wooden post and sticks */
  playArrowHitWood() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;

    // Solid wooden 'thunk' (low-mid transient)
    const osc1 = this.ctx.createOscillator();
    const osc1Gain = this.ctx.createGain();
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(280, t);
    osc1.frequency.exponentialRampToValueAtTime(65, t + 0.12);

    osc1Gain.gain.setValueAtTime(0.6 * this.masterVolume, t);
    osc1Gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

    osc1.connect(osc1Gain);
    osc1Gain.connect(this.ctx.destination);

    osc1.start(t);
    osc1.stop(t + 0.13);

    // Wood crackle / impact texture
    const osc2 = this.ctx.createOscillator();
    const osc2Gain = this.ctx.createGain();
    osc2.type = 'square';
    osc2.frequency.setValueAtTime(520, t);
    osc2.frequency.exponentialRampToValueAtTime(140, t + 0.04);

    osc2Gain.gain.setValueAtTime(0.3 * this.masterVolume, t);
    osc2Gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

    osc2.connect(osc2Gain);
    osc2Gain.connect(this.ctx.destination);

    osc2.start(t);
    osc2.stop(t + 0.05);

    // Arrow shaft spring wobble vibration
    const wobbleOsc = this.ctx.createOscillator();
    const wobbleGain = this.ctx.createGain();
    wobbleOsc.type = 'sine';
    wobbleOsc.frequency.setValueAtTime(180, t + 0.03);
    wobbleOsc.frequency.exponentialRampToValueAtTime(140, t + 0.25);

    wobbleGain.gain.setValueAtTime(0.2 * this.masterVolume, t + 0.03);
    wobbleGain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

    wobbleOsc.connect(wobbleGain);
    wobbleGain.connect(this.ctx.destination);

    wobbleOsc.start(t + 0.03);
    wobbleOsc.stop(t + 0.26);
  }

  /** Ball bounces on stuck arrow platform (higher musical pitch on combos) */
  playArrowBounce(combo = 1) {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;

    // Musical scale based on combo (Pentatonic scale: C5, D5, E5, G5, A5, C6)
    const baseFreqs = [523.25, 587.33, 659.25, 783.99, 880.00, 1046.50];
    const freq = baseFreqs[Math.min(combo - 1, baseFreqs.length - 1)];

    // Spring chime
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq * 0.7, t);
    osc.frequency.exponentialRampToValueAtTime(freq, t + 0.05);

    gain.gain.setValueAtTime(0.4 * this.masterVolume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.3);

    // Spring flex overtone
    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(freq * 1.5, t);
    osc2.frequency.exponentialRampToValueAtTime(freq * 0.9, t + 0.15);

    gain2.gain.setValueAtTime(0.2 * this.masterVolume, t);
    gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

    osc2.connect(gain2);
    gain2.connect(this.ctx.destination);

    osc2.start(t);
    osc2.stop(t + 0.2);
  }

  /** Ball bounces on ground */
  playGroundBounce() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(45, t + 0.12);

    gain.gain.setValueAtTime(0.25 * this.masterVolume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.13);
  }

  /** Arrow hits ball directly -> POP & Instant Death! */
  playArrowHitBall() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;

    // Pop / explosion noise
    const bufferSize = this.ctx.sampleRate * 0.35;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.08));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2000, t);
    filter.frequency.exponentialRampToValueAtTime(200, t + 0.3);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.7 * this.masterVolume, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.ctx.destination);

    noise.start(t);
    noise.stop(t + 0.36);

    // Low dramatic boom
    const boom = this.ctx.createOscillator();
    const boomGain = this.ctx.createGain();
    boom.type = 'sine';
    boom.frequency.setValueAtTime(180, t);
    boom.frequency.exponentialRampToValueAtTime(30, t + 0.45);

    boomGain.gain.setValueAtTime(0.6 * this.masterVolume, t);
    boomGain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);

    boom.connect(boomGain);
    boomGain.connect(this.ctx.destination);

    boom.start(t);
    boom.stop(t + 0.52);
  }

  /** Ball falls into abyss */
  playFallDeath() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(300, t);
    osc.frequency.exponentialRampToValueAtTime(50, t + 0.5);

    gain.gain.setValueAtTime(0.3 * this.masterVolume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.55);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.6);
  }

  /** Milestone reached (e.g. 50m, 100m, new high score) */
  playMilestone() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const t = this.ctx.currentTime + idx * 0.08;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.25 * this.masterVolume, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.26);
    });
  }

  /** Arrow hits iron plate and ricochets off */
  playMetalClang() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(1200, t);
    osc.frequency.exponentialRampToValueAtTime(800, t + 0.08);

    gain.gain.setValueAtTime(0.4 * this.masterVolume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.16);

    // High metal harmonic ring
    const ring = this.ctx.createOscillator();
    const ringGain = this.ctx.createGain();
    ring.type = 'sine';
    ring.frequency.setValueAtTime(2400, t);
    ringGain.gain.setValueAtTime(0.25 * this.masterVolume, t);
    ringGain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

    ring.connect(ringGain);
    ringGain.connect(this.ctx.destination);

    ring.start(t);
    ring.stop(t + 0.32);
  }

  /** Spiky mine explosion */
  playMineExplosion() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;

    // Resonant burst noise
    const bufferSize = this.ctx.sampleRate * 0.25;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.05));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1400, t);
    filter.frequency.exponentialRampToValueAtTime(120, t + 0.2);
    filter.Q.setValueAtTime(2.0, t);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.6 * this.masterVolume, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.ctx.destination);

    noise.start(t);
    noise.stop(t + 0.26);
  }

  /** Warning alert chirps when difficulty elevates */
  playWarningAlert() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    [0, 0.12].forEach(delay => {
      const t = this.ctx.currentTime + delay;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(880, t);
      osc.frequency.setValueAtTime(1320, t + 0.05);

      gain.gain.setValueAtTime(0.35 * this.masterVolume, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.1);
    });
  }
}

export const soundEngine = new SoundEngine();
if (typeof window !== 'undefined') {
  window.soundEngine = soundEngine;
}

