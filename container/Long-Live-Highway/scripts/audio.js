/**
 * Procedural Web Audio API Sound Synthesizer
 * Generates all engine hums, screeching tires, pickups, nitro boosts, and crashes natively.
 */

class SoundManager {
    constructor() {
        this.ctx = null;
        this.muted = false;
        this.engineOsc = null;
        this.engineGain = null;
        this.engineSub = null;
        this.engineRunning = false;
        this.masterGain = null;
    }

    init() {
        if (this.ctx) return;
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        
        this.ctx = new AudioContext();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.6;
        this.masterGain.connect(this.ctx.destination);
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

    startEngine() {
        if (this.muted || !this.ctx || this.engineRunning) return;
        this.resume();

        try {
            // Main engine oscillator (sawtooth for combustion engine tone)
            this.engineOsc = this.ctx.createOscillator();
            this.engineOsc.type = 'sawtooth';
            this.engineOsc.frequency.setValueAtTime(45, this.ctx.currentTime);

            // Sub bass oscillator for deep motor rumble
            this.engineSub = this.ctx.createOscillator();
            this.engineSub.type = 'triangle';
            this.engineSub.frequency.setValueAtTime(30, this.ctx.currentTime);

            // Lowpass filter to muffle harsh harmonics
            this.engineFilter = this.ctx.createBiquadFilter();
            this.engineFilter.type = 'lowpass';
            this.engineFilter.frequency.setValueAtTime(280, this.ctx.currentTime);

            this.engineGain = this.ctx.createGain();
            this.engineGain.gain.setValueAtTime(0.12, this.ctx.currentTime);

            this.engineOsc.connect(this.engineFilter);
            this.engineSub.connect(this.engineFilter);
            this.engineFilter.connect(this.engineGain);
            this.engineGain.connect(this.masterGain);

            this.engineOsc.start();
            this.engineSub.start();
            this.engineRunning = true;
        } catch (e) {
            console.warn('Audio init error:', e);
        }
    }

    updateEngine(speedRatio) {
        if (!this.engineRunning || !this.ctx) return;
        const targetFreq = 45 + speedRatio * 160;
        const targetSub = 30 + speedRatio * 90;
        const targetFilter = 260 + speedRatio * 600;
        const targetGain = 0.10 + speedRatio * 0.15;

        const t = this.ctx.currentTime + 0.05;
        this.engineOsc.frequency.setTargetAtTime(targetFreq, t, 0.08);
        this.engineSub.frequency.setTargetAtTime(targetSub, t, 0.08);
        this.engineFilter.frequency.setTargetAtTime(targetFilter, t, 0.08);
        this.engineGain.gain.setTargetAtTime(this.muted ? 0 : targetGain, t, 0.08);
    }

    stopEngine() {
        if (!this.engineRunning) return;
        try {
            if (this.engineOsc) this.engineOsc.stop();
            if (this.engineSub) this.engineSub.stop();
        } catch (e) {}
        this.engineRunning = false;
    }

    playCoin() {
        if (this.muted || !this.ctx) return;
        this.resume();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(987.77, now); // B5
        osc.frequency.exponentialRampToValueAtTime(1318.51, now + 0.12); // E6

        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 0.35);
    }

    playFuel() {
        if (this.muted || !this.ctx) return;
        this.resume();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.linearRampToValueAtTime(659.25, now + 0.1);
        osc.frequency.linearRampToValueAtTime(880, now + 0.2);

        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 0.4);
    }

    playNitro() {
        if (this.muted || !this.ctx) return;
        this.resume();
        const now = this.ctx.currentTime;
        
        // White noise burst for jet propulsion
        const bufferSize = this.ctx.sampleRate * 0.8;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(500, now);
        filter.frequency.exponentialRampToValueAtTime(3200, now + 0.6);
        filter.Q.setValueAtTime(2.0, now);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.8);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        noise.start(now);
        noise.stop(now + 0.8);
    }

    playSkid() {
        if (this.muted || !this.ctx) return;
        this.resume();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const filter = this.ctx.createBiquadFilter();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(800 + Math.random() * 200, now);
        osc.frequency.linearRampToValueAtTime(400, now + 0.2);

        filter.type = 'highpass';
        filter.frequency.setValueAtTime(600, now);

        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        osc.start(now);
        osc.stop(now + 0.2);
    }

    playCrash() {
        if (this.muted || !this.ctx) return;
        this.resume();
        const now = this.ctx.currentTime;

        // Low boom + noise crunch
        const osc = this.ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.exponentialRampToValueAtTime(30, now + 0.5);

        const oscGain = this.ctx.createGain();
        oscGain.gain.setValueAtTime(0.5, now);
        oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

        osc.connect(oscGain);
        oscGain.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 0.5);

        // Noise blast
        const bufferSize = this.ctx.sampleRate * 0.4;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.08));
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(0.4, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

        noise.connect(noiseGain);
        noiseGain.connect(this.masterGain);
        noise.start(now);
        noise.stop(now + 0.4);
    }

    playNitroSmash() {
        if (this.muted || !this.ctx) return;
        this.resume();
        const now = this.ctx.currentTime;

        // Punchy sub-bass drop
        const sub = this.ctx.createOscillator();
        sub.type = 'sawtooth';
        sub.frequency.setValueAtTime(220, now);
        sub.frequency.exponentialRampToValueAtTime(35, now + 0.4);

        const subFilter = this.ctx.createBiquadFilter();
        subFilter.type = 'lowpass';
        subFilter.frequency.setValueAtTime(450, now);

        const subGain = this.ctx.createGain();
        subGain.gain.setValueAtTime(0.55, now);
        subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

        sub.connect(subFilter);
        subFilter.connect(subGain);
        subGain.connect(this.masterGain);
        sub.start(now);
        sub.stop(now + 0.4);

        // Electric explosion noise
        const bufferSize = this.ctx.sampleRate * 0.35;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.06));
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        const noiseFilter = this.ctx.createBiquadFilter();
        noiseFilter.type = 'bandpass';
        noiseFilter.frequency.setValueAtTime(1800, now);
        noiseFilter.frequency.exponentialRampToValueAtTime(400, now + 0.35);

        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(0.45, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(this.masterGain);
        noise.start(now);
        noise.stop(now + 0.35);
    }

    playShieldShatter() {
        if (this.muted || !this.ctx) return;
        this.resume();
        const now = this.ctx.currentTime;

        // Forcefield resonance shatter
        const osc = this.ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.linearRampToValueAtTime(1760, now + 0.08);
        osc.frequency.exponentialRampToValueAtTime(220, now + 0.3);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 0.3);
    }

    playChirp() {
        if (this.muted || !this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(2400 + Math.random() * 400, now);
        osc.frequency.exponentialRampToValueAtTime(3800, now + 0.08);

        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 0.12);
    }

    playHorn() {
        if (this.muted || !this.ctx) return;
        this.resume();
        const now = this.ctx.currentTime;
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc1.type = 'sawtooth';
        osc1.frequency.setValueAtTime(415, now);
        osc2.type = 'sawtooth';
        osc2.frequency.setValueAtTime(466, now);

        gain.gain.setValueAtTime(0.18, now);
        gain.gain.setValueAtTime(0.18, now + 0.28);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(this.masterGain);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 0.38);
        osc2.stop(now + 0.38);
    }

    playTrainHorn() {
        if (this.muted || !this.ctx) return;
        this.resume();
        const now = this.ctx.currentTime;
        const chords = [311.13, 370.00, 466.16, 622.25]; // D# chord locomotive air horn
        
        chords.forEach((freq) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(freq, now);
            osc.frequency.linearRampToValueAtTime(freq * 0.98, now + 1.2);

            gain.gain.setValueAtTime(0.08, now);
            gain.gain.setValueAtTime(0.12, now + 0.15);
            gain.gain.setValueAtTime(0.12, now + 0.85);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 1.4);

            osc.connect(gain);
            gain.connect(this.masterGain);

            osc.start(now);
            osc.stop(now + 1.4);
        });
    }

    playTrainRumble() {
        if (this.muted || !this.ctx) return;
        this.resume();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const filter = this.ctx.createBiquadFilter();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(55, now);
        osc.frequency.linearRampToValueAtTime(65, now + 0.4);
        osc.frequency.linearRampToValueAtTime(50, now + 0.8);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(140, now);

        gain.gain.setValueAtTime(0.14, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);

        osc.start(now);
        osc.stop(now + 0.9);
    }

    playCrossingBell() {
        if (this.muted || !this.ctx) return;
        this.resume();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(1200, now);
        osc.frequency.exponentialRampToValueAtTime(750, now + 0.16);

        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(now);
        osc.stop(now + 0.18);
    }

    playJump() {
        if (this.muted || !this.ctx) return;
        this.resume();
        const now = this.ctx.currentTime;

        // 1. Rising tonal boing/launch whistle
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(720, now + 0.28);

        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 0.35);

        // 2. Air thrust burst
        const bufferSize = Math.floor(this.ctx.sampleRate * 0.3);
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.08));
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(800, now);
        filter.frequency.linearRampToValueAtTime(2400, now + 0.25);
        filter.Q.setValueAtTime(1.5, now);

        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(0.22, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

        noise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(this.masterGain);
        noise.start(now);
        noise.stop(now + 0.3);
    }

    playLanding() {
        if (this.muted || !this.ctx) return;
        this.resume();
        const now = this.ctx.currentTime;

        // Solid rubber tire thump
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(130, now);
        osc.frequency.exponentialRampToValueAtTime(38, now + 0.16);

        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 0.18);
    }

    playWhoosh() {
        if (this.muted || !this.ctx) return;
        this.resume();
        const now = this.ctx.currentTime;

        const bufferSize = Math.floor(this.ctx.sampleRate * 0.25);
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1200, now);
        filter.frequency.linearRampToValueAtTime(600, now + 0.22);
        filter.Q.setValueAtTime(2.5, now);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);
        noise.start(now);
        noise.stop(now + 0.25);
    }
}

window.soundManager = new SoundManager();
