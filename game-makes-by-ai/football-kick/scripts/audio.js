/**
 * SoundEngine - Web Audio API Procedural Stadium Sound System
 * 
 * Generates high-impact football stadium audio synthesized in real-time.
 * 100% standalone: No external MP3/WAV files needed, zero loading lag, zero 404 errors!
 */

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.isMuted = false;
    this.ambientCrowdNode = null;
    this.initialized = false;
  }

  init() {
    if (this.initialized && this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
      this.initialized = true;
      this.startAmbientCrowd();
    } catch (e) {
      console.warn('AudioContext initialization postponed until user gesture:', e);
    }
  }

  ensureContext() {
    if (!this.initialized) {
      this.init();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.7, this.ctx.currentTime);
    }
    return this.isMuted;
  }

  /**
   * Powerful kick thump sound (leather strike)
   */
  playKick(power = 1.0) {
    this.ensureContext();
    if (this.isMuted || !this.ctx) return;
    const now = this.ctx.currentTime;

    // Sub thump oscillator
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';

    const startFreq = 160 + power * 40;
    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(32, now + 0.14);

    gain.gain.setValueAtTime(0.9 * power, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc.connect(gain);
    gain.connect(this.masterGain);

    // Noise punch for boot leather impact
    const bufferSize = this.ctx.sampleRate * 0.05;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.2));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.setValueAtTime(800, now);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.6 * power, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.2);
    noise.start(now);
  }

  /**
   * Goal Post or Crossbar "PING / CLANG"
   */
  playPostHit() {
    this.ensureContext();
    if (this.isMuted || !this.ctx) return;
    const now = this.ctx.currentTime;

    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'triangle';
    osc2.type = 'sine';

    osc1.frequency.setValueAtTime(620, now);
    osc1.frequency.exponentialRampToValueAtTime(540, now + 0.35);

    osc2.frequency.setValueAtTime(1180, now);
    osc2.frequency.exponentialRampToValueAtTime(1020, now + 0.25);

    gain.gain.setValueAtTime(0.8, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.masterGain);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.55);
    osc2.stop(now + 0.55);
  }

  /**
   * Ball striking the back of the net (crisp nylon swish)
   */
  playNetSwish() {
    this.ensureContext();
    if (this.isMuted || !this.ctx) return;
    const now = this.ctx.currentTime;

    const bufferSize = this.ctx.sampleRate * 0.3;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.4));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1200, now);
    filter.Q.setValueAtTime(1.5, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.7, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noise.start(now);
  }

  /**
   * Goalkeeper Glove Parrying or Catching
   */
  playKeeperSave() {
    this.ensureContext();
    if (this.isMuted || !this.ctx) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.12);

    gain.gain.setValueAtTime(0.8, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.16);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.18);
    this.playCrowdGroan();
  }

  /**
   * Massive stadium cheer upon Goal!
   */
  playGoalCheer() {
    this.ensureContext();
    if (this.isMuted || !this.ctx) return;
    const now = this.ctx.currentTime;

    // Big roaring crowd noise
    const duration = 2.2;
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      const progress = i / bufferSize;
      const envelope = Math.sin(progress * Math.PI) * (1 - Math.exp(-i / 8000));
      data[i] = (Math.random() * 2 - 1) * envelope;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(700, now);
    filter.frequency.linearRampToValueAtTime(1400, now + 0.6);
    filter.frequency.exponentialRampToValueAtTime(600, now + duration);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.linearRampToValueAtTime(1.0, now + 0.3);
    gain.gain.exponentialRampToValueAtTime(0.01, now + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    noise.start(now);

    // Horn / Stadium siren fanfare
    this.playStadiumHorn();
  }

  playStadiumHorn() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const freqs = [330, 440, 554]; // A Major chord
    freqs.forEach((f, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(f, now);
      
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(900, now);

      gain.gain.setValueAtTime(0.0, now);
      gain.gain.linearRampToValueAtTime(0.18, now + 0.1);
      gain.gain.setValueAtTime(0.18, now + 0.8);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 1.3);
    });
  }

  /**
   * Crowd "Oooooh" groan when shot is saved or misses
   */
  playCrowdGroan() {
    this.ensureContext();
    if (this.isMuted || !this.ctx) return;
    const now = this.ctx.currentTime;

    const duration = 1.4;
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      const progress = i / bufferSize;
      const envelope = Math.sin(progress * Math.PI);
      data[i] = (Math.random() * 2 - 1) * envelope;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(600, now);
    filter.frequency.exponentialRampToValueAtTime(280, now + duration);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.05, now);
    gain.gain.linearRampToValueAtTime(0.6, now + 0.2);
    gain.gain.exponentialRampToValueAtTime(0.01, now + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    noise.start(now);
  }

  /**
   * Whistle sound (referee kickoff or match end)
   */
  playWhistle(isDouble = false) {
    this.ensureContext();
    if (this.isMuted || !this.ctx) return;
    const now = this.ctx.currentTime;

    const playSinglePip = (t, dur) => {
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'sine';

      osc1.frequency.setValueAtTime(2400, t);
      osc2.frequency.setValueAtTime(2480, t);

      // Vibrato
      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();
      lfo.frequency.setValueAtTime(28, t);
      lfoGain.gain.setValueAtTime(45, t);
      lfo.connect(osc1.frequency);
      lfo.connect(osc2.frequency);

      gain.gain.setValueAtTime(0.0, t);
      gain.gain.linearRampToValueAtTime(0.4, t + 0.03);
      gain.gain.setValueAtTime(0.4, t + dur - 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.masterGain);

      lfo.start(t);
      osc1.start(t);
      osc2.start(t);

      lfo.stop(t + dur + 0.05);
      osc1.stop(t + dur + 0.05);
      osc2.stop(t + dur + 0.05);
    };

    playSinglePip(now, 0.22);
    if (isDouble) {
      playSinglePip(now + 0.28, 0.45);
    }
  }

  /**
   * Golden Bonus Fanfare (Extra Kick Acquired!)
   */
  playBonusChime() {
    this.ensureContext();
    if (this.isMuted || !this.ctx) return;
    const now = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 arpeggio

    notes.forEach((freq, idx) => {
      const t = now + idx * 0.09;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.4, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t);
      osc.stop(t + 0.5);
    });
  }

  /**
   * Subtle ambient stadium crowd murmur
   */
  startAmbientCrowd() {
    if (!this.ctx || this.ambientCrowdNode) return;
    try {
      const bufferSize = this.ctx.sampleRate * 3;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.15;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      noise.loop = true;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(320, this.ctx.currentTime);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      noise.start();
      this.ambientCrowdNode = noise;
    } catch (e) {
      console.warn('Ambient crowd could not start:', e);
    }
  }
}

if (typeof window !== 'undefined') {
  window.SoundEngine = SoundEngine;
  window.soundEngine = new SoundEngine();
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = SoundEngine;
}

