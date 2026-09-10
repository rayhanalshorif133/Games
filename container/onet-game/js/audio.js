/**
 * audio.js - Web Audio API Procedural Sound and Music Engine
 * Zero external audio files required, runs seamlessly in any modern browser!
 */

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.soundEnabled = localStorage.getItem('onet_sound') !== 'false';
    this.musicEnabled = localStorage.getItem('onet_music') !== 'false';
    this.vibrationEnabled = localStorage.getItem('onet_vibra') !== 'false';

    this.bgmOscs = [];
    this.bgmGain = null;
    this.bgmPlaying = false;
    this.bgmTimer = null;
    this.bgmStep = 0;

    // Pentatonic scale frequencies for melodic match chords
    this.scale = [
      523.25, // C5
      587.33, // D5
      659.25, // E5
      783.99, // G5
      880.00, // A5
      1046.50, // C6
      1174.66, // D6
      1318.51, // E6
      1567.98, // G6
      1760.00  // A6
    ];

    // Auto-init on first user gesture
    this.initOnUserGesture = this.initOnUserGesture.bind(this);
    window.addEventListener('pointerdown', this.initOnUserGesture, { once: true });
    window.addEventListener('keydown', this.initOnUserGesture, { once: true });
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

  initOnUserGesture() {
    this.init();
    if (this.musicEnabled && !this.bgmPlaying) {
      this.startBGM();
    }
  }

  setSoundEnabled(enabled) {
    this.soundEnabled = enabled;
    localStorage.setItem('onet_sound', enabled ? 'true' : 'false');
  }

  setMusicEnabled(enabled) {
    this.musicEnabled = enabled;
    localStorage.setItem('onet_music', enabled ? 'true' : 'false');
    if (enabled) {
      this.startBGM();
    } else {
      this.stopBGM();
    }
  }

  setVibrationEnabled(enabled) {
    this.vibrationEnabled = enabled;
    localStorage.setItem('onet_vibra', enabled ? 'true' : 'false');
  }

  vibrate(ms = 30) {
    if (this.vibrationEnabled && navigator.vibrate) {
      try {
        navigator.vibrate(ms);
      } catch (e) {}
    }
  }

  // --- Sound Effects ---

  playClick() {
    if (!this.soundEnabled) return;
    this.init();
    if (!this.ctx) return;
    this.vibrate(15);

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(180, now + 0.05);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.05);
  }

  playSelect() {
    if (!this.soundEnabled) return;
    this.init();
    if (!this.ctx) return;
    this.vibrate(20);

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(480, now);
    osc.frequency.exponentialRampToValueAtTime(740, now + 0.09);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.09);
  }

  playDeselect() {
    if (!this.soundEnabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(450, now);
    osc.frequency.exponentialRampToValueAtTime(280, now + 0.07);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.07);
  }

  playMatch(combo = 1) {
    if (!this.soundEnabled) return;
    this.init();
    if (!this.ctx) return;
    this.vibrate(35);

    const now = this.ctx.currentTime;
    const baseIdx = Math.min((combo - 1) % this.scale.length, this.scale.length - 4);
    const chord = [
      this.scale[baseIdx],
      this.scale[baseIdx + 2] || this.scale[baseIdx],
      this.scale[baseIdx + 3] || this.scale[baseIdx]
    ];

    chord.forEach((freq, i) => {
      const noteTime = now + i * 0.05;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = i === 0 ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0.18, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(noteTime);
      osc.stop(noteTime + 0.35);
    });
  }

  playLaser() {
    if (!this.soundEnabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(520, now);
    osc.frequency.exponentialRampToValueAtTime(1400, now + 0.28);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(900, now);
    filter.Q.setValueAtTime(3.0, now);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.28);
  }

  playTileExplode() {
    if (!this.soundEnabled) return;
    this.init();
    if (!this.ctx) return;
    this.vibrate(40);

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(340, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.2);

    gain.gain.setValueAtTime(0.28, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.2);
  }

  playError() {
    if (!this.soundEnabled) return;
    this.init();
    if (!this.ctx) return;
    this.vibrate(50);

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.setValueAtTime(150, now + 0.06);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(600, now);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.16);
  }

  playShuffle() {
    if (!this.soundEnabled) return;
    this.init();
    if (!this.ctx) return;
    this.vibrate(40);

    const now = this.ctx.currentTime;
    for (let i = 0; i < 6; i++) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const noteTime = now + i * 0.04;
      const freq = 350 + Math.sin(i * 1.2) * 250;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0.12, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.1);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(noteTime);
      osc.stop(noteTime + 0.1);
    }
  }

  playHint() {
    if (!this.soundEnabled) return;
    this.init();
    if (!this.ctx) return;
    this.vibrate(25);

    const now = this.ctx.currentTime;
    const notes = [880, 1174, 1567, 1760];
    notes.forEach((freq, i) => {
      const noteTime = now + i * 0.06;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0.15, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.22);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(noteTime);
      osc.stop(noteTime + 0.22);
    });
  }

  playTimeBonus() {
    if (!this.soundEnabled) return;
    this.init();
    if (!this.ctx) return;
    this.vibrate(30);

    const now = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, i) => {
      const noteTime = now + i * 0.05;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0.2, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.3);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(noteTime);
      osc.stop(noteTime + 0.3);
    });
  }

  playWin() {
    if (!this.soundEnabled) return;
    this.init();
    if (!this.ctx) return;
    this.vibrate(80);

    const now = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.51, 1567.98];
    notes.forEach((freq, i) => {
      const noteTime = now + i * 0.09;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, noteTime);

      const dur = i === notes.length - 1 ? 0.8 : 0.25;
      gain.gain.setValueAtTime(0.25, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + dur);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(noteTime);
      osc.stop(noteTime + dur);
    });
  }

  playGameOver() {
    if (!this.soundEnabled) return;
    this.init();
    if (!this.ctx) return;
    this.vibrate(60);

    const now = this.ctx.currentTime;
    const notes = [440, 392, 349.23, 261.63];
    notes.forEach((freq, i) => {
      const noteTime = now + i * 0.15;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, noteTime);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(500, noteTime);

      gain.gain.setValueAtTime(0.18, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.35);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(noteTime);
      osc.stop(noteTime + 0.35);
    });
  }

  playTick() {
    if (!this.soundEnabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(900, now);
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.03);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.03);
  }

  playUrgentTick(secondsLeft = 10) {
    if (!this.soundEnabled) return;
    this.init();
    if (!this.ctx) return;
    this.vibrate(secondsLeft <= 3 ? 35 : 20);

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    // Frequency rises sharply from 750Hz up to 1800Hz in final seconds
    const urgency = Math.max(1, 11 - Math.min(10, secondsLeft));
    const startFreq = 650 + urgency * 110;

    osc.type = secondsLeft <= 3 ? 'triangle' : 'sine';
    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(startFreq * 0.5, now + 0.06);

    const vol = 0.18 + urgency * 0.02;
    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.06);
  }

  playTimeWarning() {
    if (!this.soundEnabled) return;
    this.init();
    if (!this.ctx) return;
    this.vibrate(30);

    const now = this.ctx.currentTime;
    const notes = [659.25, 880.00]; // E5 -> A5 friendly chime
    notes.forEach((freq, i) => {
      const noteTime = now + i * 0.1;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0.2, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.3);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(noteTime);
      osc.stop(noteTime + 0.3);
    });
  }

  playTimeCritical() {
    if (!this.soundEnabled) return;
    this.init();
    if (!this.ctx) return;
    this.vibrate(60);

    const now = this.ctx.currentTime;
    const notes = [987.77, 880.00, 987.77]; // Urgent beep-beep
    notes.forEach((freq, i) => {
      const noteTime = now + i * 0.08;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, noteTime);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1200, noteTime);
      filter.Q.setValueAtTime(2.0, noteTime);

      gain.gain.setValueAtTime(0.22, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.16);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(noteTime);
      osc.stop(noteTime + 0.16);
    });
  }

  playPraise(comboTier = 1) {
    if (!this.soundEnabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    let notes = [523.25, 659.25, 783.99, 1046.50]; // Bright chime
    if (comboTier >= 3) {
      notes = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98]; // Extended fanfare
    }

    notes.forEach((freq, i) => {
      const noteTime = now + i * 0.045;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, noteTime);

      const dur = i === notes.length - 1 ? 0.45 : 0.2;
      gain.gain.setValueAtTime(0.14, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + dur);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(noteTime);
      osc.stop(noteTime + dur);
    });
  }

  // --- Procedural Cheerful Background Music (BGM) ---

  startBGM() {
    if (!this.musicEnabled || this.bgmPlaying) return;
    this.init();
    if (!this.ctx) return;

    this.bgmPlaying = true;
    this.bgmStep = 0;

    // Cheerful, looping 16-step melody pattern
    const melody = [
      523.25, null, 659.25, 783.99,
      880.00, 783.99, 659.25, null,
      587.33, 659.25, 783.99, 880.00,
      1046.50, null, 783.99, null
    ];
    const bass = [
      261.63, null, 261.63, null,
      329.63, null, 329.63, null,
      349.23, null, 349.23, null,
      392.00, null, 392.00, null
    ];

    const tempoMs = 240; // ~125 BPM eighth notes

    const tickBGM = () => {
      if (!this.bgmPlaying || !this.ctx || !this.musicEnabled) return;

      const now = this.ctx.currentTime;
      const melFreq = melody[this.bgmStep % melody.length];
      const bassFreq = bass[this.bgmStep % bass.length];

      if (melFreq) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(melFreq, now);

        gain.gain.setValueAtTime(0.045, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.22);
      }

      if (bassFreq) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(bassFreq, now);

        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.35);
      }

      this.bgmStep++;
      this.bgmTimer = setTimeout(tickBGM, tempoMs);
    };

    tickBGM();
  }

  stopBGM() {
    this.bgmPlaying = false;
    if (this.bgmTimer) {
      clearTimeout(this.bgmTimer);
      this.bgmTimer = null;
    }
  }
}

window.soundEngine = new SoundEngine();

