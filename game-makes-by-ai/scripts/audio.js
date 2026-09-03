/**
 * Audio Engine using Web Audio API
 * Generates all sound effects and background music procedurally
 * Zero external audio file dependencies!
 */
class SoundEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.bgmPlaying = false;
    this.bgmTimer = null;
    this.masterGain = null;
    this.sfxGain = null;
    this.bgmGain = null;
    this.isInitialized = false;

    // Load mute preference from storage
    try {
      this.isMuted = localStorage.getItem('cyberrunner_muted') === 'true';
    } catch (e) {
      this.isMuted = false;
    }
  }

  init() {
    if (this.isInitialized) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.isMuted ? 0 : 1;
      this.masterGain.connect(this.ctx.destination);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = 0.55;
      this.sfxGain.connect(this.masterGain);

      this.bgmGain = this.ctx.createGain();
      this.bgmGain.gain.value = 0.22;
      this.bgmGain.connect(this.masterGain);

      this.isInitialized = true;
    } catch (e) {
      console.warn("AudioContext init failed:", e);
    }
  }

  resumeContext() {
    if (!this.isInitialized) {
      this.init();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    try {
      localStorage.setItem('cyberrunner_muted', this.isMuted);
    } catch (e) {}

    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 1, this.ctx.currentTime);
    }
    return this.isMuted;
  }

  // JUMP: Upward chirp/glide
  playJump() {
    if (this.isMuted || !this.ctx) return;
    this.resumeContext();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(560, now + 0.18);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.22);
  }

  // SLIDE: Downward swoosh
  playSlide() {
    if (this.isMuted || !this.ctx) return;
    this.resumeContext();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(90, now + 0.22);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1200, now);
    filter.frequency.exponentialRampToValueAtTime(200, now + 0.22);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.25);
  }

  // LANE SWITCH: Quick click/dash
  playLaneSwitch() {
    if (this.isMuted || !this.ctx) return;
    this.resumeContext();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(650, now);
    osc.frequency.exponentialRampToValueAtTime(450, now + 0.06);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.08);
  }

  // COIN: Bright resonant chime
  playCoin() {
    if (this.isMuted || !this.ctx) return;
    this.resumeContext();
    const now = this.ctx.currentTime;
    
    // Two-tone bell ping
    [1046.5, 1567.98].forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.04);

      gain.gain.setValueAtTime(0.22, now + i * 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.04 + 0.25);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now + i * 0.04);
      osc.stop(now + i * 0.04 + 0.26);
    });
  }

  // POWERUP COLLECT: Happy triumphant arpeggio
  playPowerup() {
    if (this.isMuted || !this.ctx) return;
    this.resumeContext();
    const now = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6

    notes.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + i * 0.07);

      gain.gain.setValueAtTime(0.25, now + i * 0.07);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.07 + 0.22);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now + i * 0.07);
      osc.stop(now + i * 0.07 + 0.24);
    });
  }

  // SHIELD BREAK: Glass/plasma zap
  playShieldBreak() {
    if (this.isMuted || !this.ctx) return;
    this.resumeContext();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(150, now + 0.25);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.26);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.28);
  }

  // CRASH / HIT: Heavy punch & low impact
  playCrash() {
    if (this.isMuted || !this.ctx) return;
    this.resumeContext();
    const now = this.ctx.currentTime;

    // Low boom
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.35);

    gain.gain.setValueAtTime(0.45, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.42);
  }

  // PROCEDURAL SYNTH BGM LOOP
  startBgm() {
    if (this.bgmPlaying || !this.ctx) return;
    this.resumeContext();
    this.bgmPlaying = true;

    // 124 BPM Cyber Synthwave Bassline Pattern
    const bpm = 126;
    const stepTime = 60 / bpm / 4; // 16th note
    const bassline = [
      110, 110, 0, 110, 110, 0, 130.81, 110,
      98,  98,  0, 98,  98,  0, 123.47, 98,
      82.4,82.4,0, 82.4,82.4,0, 110,    82.4,
      73.4,73.4,0, 73.4,87.3,0, 98,     73.4
    ];

    let step = 0;
    this.bgmTimer = setInterval(() => {
      if (!this.bgmPlaying || this.isMuted || !this.ctx) return;
      if (this.ctx.state !== 'running') return;

      const freq = bassline[step % bassline.length];
      if (freq > 0) {
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const filter = this.ctx.createBiquadFilter();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, now);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(550, now);
        filter.frequency.exponentialRampToValueAtTime(180, now + stepTime * 1.5);

        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + stepTime * 1.8);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.bgmGain);

        osc.start(now);
        osc.stop(now + stepTime * 2);
      }

      // Hi-hat tick on every 8th note
      if (step % 2 === 1) {
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(7500, now);
        gain.gain.setValueAtTime(0.03, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.03);
        osc.connect(gain);
        gain.connect(this.bgmGain);
        osc.start(now);
        osc.stop(now + 0.035);
      }

      step = (step + 1) % bassline.length;
    }, stepTime * 1000);
  }

  stopBgm() {
    this.bgmPlaying = false;
    if (this.bgmTimer) {
      clearInterval(this.bgmTimer);
      this.bgmTimer = null;
    }
  }
}

// Global instance
window.soundEngine = new SoundEngine();

