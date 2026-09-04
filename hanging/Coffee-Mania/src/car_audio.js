// Web Audio API Procedural Synthesizer for Car Direction Release Game

class CarAudioManager {
  constructor() {
    this.ctx = null;
    this.isMuted = localStorage.getItem('care_escape_muted') === 'true';
    this.musicPlaying = false;
    this.musicInterval = null;
    this.bassNoteIndex = 0;
  }

  init() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    localStorage.setItem('care_escape_muted', this.isMuted ? 'true' : 'false');
    if (this.isMuted) {
      this.stopMusic();
    } else {
      this.startMusic();
    }
    return this.isMuted;
  }

  playTap() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(650, t);
    osc.frequency.exponentialRampToValueAtTime(180, t + 0.05);

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.05);
  }

  // Car acceleration / zoom off screen
  playCarEscape() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;

    // Engine acceleration rev
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(90, t);
    osc.frequency.exponentialRampToValueAtTime(360, t + 0.35);
    osc.frequency.linearRampToValueAtTime(520, t + 0.6);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(600, t);
    filter.frequency.linearRampToValueAtTime(2200, t + 0.5);

    gain.gain.setValueAtTime(0.22, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.65);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.65);

    // Tire squeal chirp
    const tireOsc = this.ctx.createOscillator();
    const tireGain = this.ctx.createGain();
    tireOsc.type = 'sine';
    tireOsc.frequency.setValueAtTime(1200, t + 0.05);
    tireOsc.frequency.linearRampToValueAtTime(800, t + 0.22);

    tireGain.gain.setValueAtTime(0.08, t + 0.05);
    tireGain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

    tireOsc.connect(tireGain);
    tireGain.connect(this.ctx.destination);

    tireOsc.start(t + 0.05);
    tireOsc.stop(t + 0.22);
  }

  // Dual-tone car horn on blocked collision
  playHonk() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    // Typical car horn dual frequencies: ~440Hz (A4) and ~349Hz (F4)
    [349.23, 440.00].forEach(freq => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.18, t);
      gain.gain.setValueAtTime(0.18, t + 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 1400;

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.18);
    });

    // Short metallic bump thud
    const bump = this.ctx.createOscillator();
    const bumpGain = this.ctx.createGain();
    bump.type = 'triangle';
    bump.frequency.setValueAtTime(160, t);
    bump.frequency.exponentialRampToValueAtTime(45, t + 0.14);

    bumpGain.gain.setValueAtTime(0.3, t);
    bumpGain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

    bump.connect(bumpGain);
    bumpGain.connect(this.ctx.destination);

    bump.start(t);
    bump.stop(t + 0.14);
  }

  playVictory() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const notes = [
      { f: 440.0, d: 0.1, delay: 0 },
      { f: 554.37, d: 0.1, delay: 0.1 },
      { f: 659.25, d: 0.12, delay: 0.2 },
      { f: 880.0, d: 0.45, delay: 0.32 }
    ];

    notes.forEach(n => {
      const t = this.ctx.currentTime + n.delay;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(n.f, t);

      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + n.d);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + n.d);
    });
  }

  playBooster() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    for (let i = 0; i < 4; i++) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const time = t + i * 0.05;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(900 + i * 250, time);

      gain.gain.setValueAtTime(0.14, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(time);
      osc.stop(time + 0.12);
    }
  }

  // --- RETRO UPBEAT DRIVING BACKGROUND MUSIC ---

  startMusic() {
    if (this.isMuted || this.musicPlaying) return;
    this.init();
    if (!this.ctx) return;

    this.musicPlaying = true;
    this.scheduleNextBeat();
  }

  stopMusic() {
    this.musicPlaying = false;
    if (this.musicInterval) {
      clearTimeout(this.musicInterval);
      this.musicInterval = null;
    }
  }

  scheduleNextBeat() {
    if (!this.musicPlaying || this.isMuted || !this.ctx) return;

    const bassline = [110, 110, 130.81, 146.83, 164.81, 146.83, 130.81, 123.47];
    const freq = bassline[this.bassNoteIndex % bassline.length];
    this.bassNoteIndex++;

    const now = this.ctx.currentTime;

    // Bass note
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(0.045, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.22);

    // Hi-hat tick
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.02);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const nGain = this.ctx.createGain();
    nGain.gain.setValueAtTime(0.015, now);
    nGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.02);

    noise.connect(nGain);
    nGain.connect(this.ctx.destination);
    noise.start(now);

    this.musicInterval = setTimeout(() => {
      this.scheduleNextBeat();
    }, 280);
  }
}

export const carAudio = new CarAudioManager();

