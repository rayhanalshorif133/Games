/**
 * Military Aviation Procedural Audio Synthesizer (Web Audio API)
 * High-fidelity realistic procedural sound engine without external audio files.
 */
class MilitaryAudioEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.initialized = false;
    
    // Continuous Sound Nodes
    this.engineGain = null;
    this.engineOsc1 = null;
    this.engineOsc2 = null;
    this.engineFilter = null;
    this.afterburnerGain = null;
    this.afterburnerNoise = null;
    
    // RWR warning tone generator
    this.rwrOsc = null;
    this.rwrGain = null;
    this.rwrActive = false;
    this.rwrInterval = null;

    // Master volume
    this.masterGain = null;
  }

  init() {
    if (this.initialized) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
      
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.85, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
      
      this._setupEngineAudio();
      this.initialized = true;
    } catch (e) {
      console.warn("Web Audio API not initialized:", e);
    }
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  _setupEngineAudio() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    // Engine Master Node
    this.engineMaster = this.ctx.createGain();
    this.engineMaster.gain.setValueAtTime(0.01, t);
    this.engineMaster.connect(this.masterGain);

    // 1. Turbine whine (dual harmonics)
    this.engineOsc1 = this.ctx.createOscillator();
    this.engineOsc1.type = 'sawtooth';
    this.engineOsc1.frequency.setValueAtTime(110, t); // Low base turbine

    this.engineOsc2 = this.ctx.createOscillator();
    this.engineOsc2.type = 'sine';
    this.engineOsc2.frequency.setValueAtTime(220, t); // Turbine whine

    // Filter to give that muffled cockpit / airframe rumble
    this.engineFilter = this.ctx.createBiquadFilter();
    this.engineFilter.type = 'lowpass';
    this.engineFilter.frequency.setValueAtTime(450, t);
    this.engineFilter.Q.setValueAtTime(3.0, t);

    this.engineGain = this.ctx.createGain();
    this.engineGain.gain.setValueAtTime(0.08, t);

    this.engineOsc1.connect(this.engineFilter);
    this.engineOsc2.connect(this.engineFilter);
    this.engineFilter.connect(this.engineGain);
    this.engineGain.connect(this.engineMaster);

    this.engineOsc1.start();
    this.engineOsc2.start();

    // 2. Continuous Airflow & Jet Exhaust Noise
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
      output[i] *= 0.11; // pink noise normalization
      b6 = white * 0.115926;
    }

    this.airNoise = this.ctx.createBufferSource();
    this.airNoise.buffer = noiseBuffer;
    this.airNoise.loop = true;

    this.airFilter = this.ctx.createBiquadFilter();
    this.airFilter.type = 'bandpass';
    this.airFilter.frequency.setValueAtTime(300, t);
    this.airFilter.Q.setValueAtTime(1.2, t);

    this.airGain = this.ctx.createGain();
    this.airGain.gain.setValueAtTime(0.06, t);

    this.airNoise.connect(this.airFilter);
    this.airFilter.connect(this.airGain);
    this.airGain.connect(this.engineMaster);
    this.airNoise.start();

    // 3. Afterburner Combustion
    this.afterburnerNoise = this.ctx.createBufferSource();
    this.afterburnerNoise.buffer = noiseBuffer;
    this.afterburnerNoise.loop = true;

    this.afterburnerFilter = this.ctx.createBiquadFilter();
    this.afterburnerFilter.type = 'lowpass';
    this.afterburnerFilter.frequency.setValueAtTime(180, t);

    this.afterburnerGain = this.ctx.createGain();
    this.afterburnerGain.gain.setValueAtTime(0.0, t);

    this.afterburnerNoise.connect(this.afterburnerFilter);
    this.afterburnerFilter.connect(this.afterburnerGain);
    this.afterburnerGain.connect(this.engineMaster);
    this.afterburnerNoise.start();
  }

  updateEngine(throttle, isBoosting) {
    if (!this.ctx || !this.initialized) return;
    const t = this.ctx.currentTime;
    
    // Smooth transition
    this.engineMaster.gain.setTargetAtTime(0.4, t, 0.1);

    // Pitch rises with throttle
    const baseFreq = 100 + throttle * 70;
    this.engineOsc1.frequency.setTargetAtTime(baseFreq, t, 0.1);
    this.engineOsc2.frequency.setTargetAtTime(baseFreq * 2.2, t, 0.1);
    this.engineFilter.frequency.setTargetAtTime(350 + throttle * 300, t, 0.1);

    // Airflow roar
    this.airFilter.frequency.setTargetAtTime(250 + throttle * 400, t, 0.1);
    this.airGain.gain.setTargetAtTime(0.05 + throttle * 0.12, t, 0.1);

    // Afterburner power
    if (isBoosting) {
      this.afterburnerGain.gain.setTargetAtTime(0.45, t, 0.08);
      this.afterburnerFilter.frequency.setTargetAtTime(320, t, 0.08);
    } else {
      this.afterburnerGain.gain.setTargetAtTime(0.0, t, 0.15);
    }
  }

  /**
   * 20mm M61 Vulcan Rotary Cannon "BRRRRRT" sound
   */
  playVulcanShot() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    // Fast explosive punch
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(35, t + 0.045);

    gain.gain.setValueAtTime(0.28, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

    // Mechanical snap filter
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1200, t);
    filter.Q.setValueAtTime(1.5, t);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.055);

    // Low thump for cannon recoil
    const thump = this.ctx.createOscillator();
    const thumpGain = this.ctx.createGain();
    thump.type = 'sine';
    thump.frequency.setValueAtTime(80, t);
    thump.frequency.exponentialRampToValueAtTime(28, t + 0.04);
    thumpGain.gain.setValueAtTime(0.35, t);
    thumpGain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

    thump.connect(thumpGain);
    thumpGain.connect(this.masterGain);
    thump.start(t);
    thump.stop(t + 0.045);
  }

  /**
   * AIM-9X Sidewinder / Fox-2 Missile Launch
   */
  playMissileLaunch() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    // Rocket booster roar
    const bufferSize = this.ctx.sampleRate * 0.6;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.6));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(600, t);
    filter.frequency.exponentialRampToValueAtTime(1800, t + 0.25);
    filter.Q.setValueAtTime(2.0, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.55);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    noise.start(t);

    // Ejection pneumatic drop thud
    const drop = this.ctx.createOscillator();
    const dropGain = this.ctx.createGain();
    drop.type = 'sine';
    drop.frequency.setValueAtTime(220, t);
    drop.frequency.exponentialRampToValueAtTime(45, t + 0.12);
    dropGain.gain.setValueAtTime(0.5, t);
    dropGain.gain.exponentialRampToValueAtTime(0.01, t + 0.14);

    drop.connect(dropGain);
    dropGain.connect(this.masterGain);
    drop.start(t);
    drop.stop(t + 0.15);
  }

  /**
   * Magnesium Countermeasure Flares Deployment
   */
  playFlareDeploy() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    // Pyrotechnic "POP"
    const pop = this.ctx.createOscillator();
    const popGain = this.ctx.createGain();
    pop.type = 'triangle';
    pop.frequency.setValueAtTime(320, t);
    pop.frequency.exponentialRampToValueAtTime(60, t + 0.08);
    popGain.gain.setValueAtTime(0.45, t);
    popGain.gain.exponentialRampToValueAtTime(0.01, t + 0.09);

    pop.connect(popGain);
    popGain.connect(this.masterGain);
    pop.start(t);
    pop.stop(t + 0.1);

    // High sizzling burn
    const bufferSize = this.ctx.sampleRate * 0.35;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.4));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(2500, t);

    const sizzleGain = this.ctx.createGain();
    sizzleGain.gain.setValueAtTime(0.3, t);
    sizzleGain.gain.exponentialRampToValueAtTime(0.01, t + 0.35);

    noise.connect(filter);
    filter.connect(sizzleGain);
    sizzleGain.connect(this.masterGain);
    noise.start(t);
  }

  /**
   * Realistic Multi-Stage Acoustic Explosion
   */
  playExplosion(intensity = 1.0) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const clampedIntensity = Math.min(Math.max(intensity, 0.4), 2.5);

    // 1. Heavy Sub-Bass Shockwave
    const sub = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(110 * clampedIntensity, t);
    sub.frequency.exponentialRampToValueAtTime(22, t + 0.4 * clampedIntensity);
    
    subGain.gain.setValueAtTime(0.7 * clampedIntensity, t);
    subGain.gain.exponentialRampToValueAtTime(0.001, t + 0.6 * clampedIntensity);

    sub.connect(subGain);
    subGain.connect(this.masterGain);
    sub.start(t);
    sub.stop(t + 0.65 * clampedIntensity);

    // 2. Destructive Fireball Rumble Noise
    const bufferSize = Math.floor(this.ctx.sampleRate * (0.8 * clampedIntensity));
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 1.6);
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800 * clampedIntensity, t);
    filter.frequency.exponentialRampToValueAtTime(90, t + 0.7 * clampedIntensity);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.65 * clampedIntensity, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.8 * clampedIntensity);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.masterGain);
    noise.start(t);
  }

  /**
   * RWR (Radar Warning Receiver) and Missile Lock Tone
   */
  playLockTone() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(880, t);
    osc.frequency.setValueAtTime(1175, t + 0.06);

    gain.gain.setValueAtTime(0.18, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.12);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.13);
  }

  playIncomingMissileAlert() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    // High urgent military dual tone
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(1200, t);
    osc.frequency.setValueAtTime(1500, t + 0.05);

    gain.gain.setValueAtTime(0.22, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.09);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.1);
  }

  /**
   * Transonic Sonic Boom
   */
  playSonicBoom() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    // Double N-Wave shock
    [0, 0.08].forEach(offset => {
      const boom = this.ctx.createOscillator();
      const boomGain = this.ctx.createGain();
      boom.type = 'triangle';
      boom.frequency.setValueAtTime(140, t + offset);
      boom.frequency.exponentialRampToValueAtTime(25, t + offset + 0.25);
      boomGain.gain.setValueAtTime(0.8, t + offset);
      boomGain.gain.exponentialRampToValueAtTime(0.001, t + offset + 0.3);

      boom.connect(boomGain);
      boomGain.connect(this.masterGain);
      boom.start(t + offset);
      boom.stop(t + offset + 0.32);
    });
  }

  playHitImpact() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(320, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.08);

    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.08);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.09);
  }

  /**
   * Power-up Crate Collection Chime
   */
  playPowerupPickup() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6 arpeggio

    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + idx * 0.06);

      gain.gain.setValueAtTime(0.25, t + idx * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.06 + 0.2);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t + idx * 0.06);
      osc.stop(t + idx * 0.06 + 0.22);
    });
  }

  /**
   * Plasma Energy Shield Hit Deflection
   */
  playShieldAbsorb() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(950, t);
    osc.frequency.exponentialRampToValueAtTime(120, t + 0.15);

    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.16);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1400, t);
    filter.Q.setValueAtTime(4.0, t);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.18);
  }

  /**
   * Tactical EMP Blast Shockwave
   */
  playEmpBurst() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    // Sub-bass electromagnetic expansion
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(180, t);
    osc.frequency.exponentialRampToValueAtTime(20, t + 0.6);

    gain.gain.setValueAtTime(0.8, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.7);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.75);

    // High electrical discharge crackle
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.5);
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.sin(i * 0.1);
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(2200, t);
    filter.frequency.exponentialRampToValueAtTime(200, t + 0.5);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.4, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.5);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.masterGain);
    noise.start(t);
  }

  stopAll() {
    if (this.engineMaster) {
      this.engineMaster.gain.setTargetAtTime(0.001, this.ctx.currentTime, 0.1);
    }
  }
}

// Global instance matching Construct 3 script export structure
window.AudioEngine = new MilitaryAudioEngine();

