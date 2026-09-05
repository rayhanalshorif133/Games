/**
 * audio.js - Web Audio API procedural sound synthesizer & music generator
 */

class SoundEngine {
    constructor() {
        this.ctx = null;
        this.masterGain = null;
        this.sfxGain = null;
        this.musicGain = null;
        this.isMuted = false;
        this.isMusicPlaying = false;
        this.musicInterval = null;
        this.noiseBuffer = null;
        this.initialized = false;
        this.volume = 0.8;
        this.musicVolume = 0.5;

        // Engine rumble node references
        this.engineOsc = null;
        this.engineGain = null;
    }

    init() {
        if (this.initialized) return;
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContext();

            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
            this.masterGain.connect(this.ctx.destination);

            this.sfxGain = this.ctx.createGain();
            this.sfxGain.gain.setValueAtTime(1.0, this.ctx.currentTime);
            this.sfxGain.connect(this.masterGain);

            this.musicGain = this.ctx.createGain();
            this.musicGain.gain.setValueAtTime(this.musicVolume, this.ctx.currentTime);
            this.musicGain.connect(this.masterGain);

            this.createNoiseBuffer();
            this.setupEngineSound();
            this.initialized = true;
        } catch (e) {
            console.warn('Web Audio API not supported or blocked:', e);
        }
    }

    resume() {
        if (!this.initialized) this.init();
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    createNoiseBuffer() {
        if (!this.ctx) return;
        const bufferSize = this.ctx.sampleRate * 2;
        this.noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const output = this.noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }
    }

    setSoundVolume(val) {
        this.volume = Math.max(0, Math.min(1, val));
        if (this.masterGain && this.ctx) {
            this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
        }
    }

    setMusicVolume(val) {
        this.musicVolume = Math.max(0, Math.min(1, val));
        if (this.musicGain && this.ctx) {
            this.musicGain.gain.setValueAtTime(this.musicVolume, this.ctx.currentTime);
        }
    }

    setupEngineSound() {
        if (!this.ctx) return;
        try {
            this.engineOsc = this.ctx.createOscillator();
            this.engineOsc.type = 'sawtooth';
            this.engineOsc.frequency.setValueAtTime(45, this.ctx.currentTime);

            const filter = this.ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(140, this.ctx.currentTime);

            this.engineGain = this.ctx.createGain();
            this.engineGain.gain.setValueAtTime(0, this.ctx.currentTime);

            this.engineOsc.connect(filter);
            filter.connect(this.engineGain);
            this.engineGain.connect(this.sfxGain);
            this.engineOsc.start();
        } catch (e) {
            console.warn('Engine sound init warning:', e);
        }
    }

    updateEngineSound(active, speedRatio = 1.0) {
        if (!this.engineGain || !this.ctx) return;
        const targetGain = active ? 0.08 : 0.0;
        const targetFreq = 40 + (speedRatio * 35);
        const now = this.ctx.currentTime;
        this.engineGain.gain.setTargetAtTime(targetGain, now, 0.08);
        this.engineOsc.frequency.setTargetAtTime(targetFreq, now, 0.08);
    }

    playClick() {
        if (!this.ctx) return;
        this.resume();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(400, now + 0.05);

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.05);
    }

    playWarning() {
        if (!this.ctx) return;
        this.resume();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.setValueAtTime(1200, now + 0.05);

        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.12);
    }

    playMissileLaunch() {
        if (!this.ctx) return;
        this.resume();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(950, now + 0.15);
        osc.frequency.exponentialRampToValueAtTime(600, now + 0.35);

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.005, now + 0.35);

        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.35);
    }

    playExplosion(isBig = false) {
        if (!this.ctx || !this.noiseBuffer) return;
        this.resume();
        const now = this.ctx.currentTime;
        const dur = isBig ? 0.9 : 0.55;

        // Noise element
        const noise = this.ctx.createBufferSource();
        noise.buffer = this.noiseBuffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(isBig ? 900 : 700, now);
        filter.frequency.exponentialRampToValueAtTime(60, now + dur);

        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(isBig ? 0.8 : 0.5, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.005, now + dur);

        noise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(this.sfxGain);
        noise.start(now);
        noise.stop(now + dur);

        // Sub-bass thump
        const sub = this.ctx.createOscillator();
        const subGain = this.ctx.createGain();
        sub.type = 'sine';
        sub.frequency.setValueAtTime(isBig ? 120 : 100, now);
        sub.frequency.exponentialRampToValueAtTime(25, now + dur * 0.8);

        subGain.gain.setValueAtTime(isBig ? 0.7 : 0.45, now);
        subGain.gain.exponentialRampToValueAtTime(0.001, now + dur * 0.8);

        sub.connect(subGain);
        subGain.connect(this.sfxGain);
        sub.start(now);
        sub.stop(now + dur * 0.8);
    }

    playNearMiss() {
        if (!this.ctx) return;
        this.resume();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(1400, now + 0.08);
        osc.frequency.exponentialRampToValueAtTime(300, now + 0.22);

        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.22);
    }

    playCoin() {
        if (!this.ctx) return;
        this.resume();
        const now = this.ctx.currentTime;
        const notes = [987.77, 1318.51]; // B5, E6
        notes.forEach((freq, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const startTime = now + (i * 0.06);

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, startTime);

            gain.gain.setValueAtTime(0.25, startTime);
            gain.gain.exponentialRampToValueAtTime(0.005, startTime + 0.12);

            osc.connect(gain);
            gain.connect(this.sfxGain);
            osc.start(startTime);
            osc.stop(startTime + 0.12);
        });
    }

    playFlare() {
        if (!this.ctx) return;
        this.resume();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(250, now);
        osc.frequency.exponentialRampToValueAtTime(750, now + 0.08);
        osc.frequency.exponentialRampToValueAtTime(180, now + 0.25);

        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.005, now + 0.25);

        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.25);
    }

    playShieldHit() {
        if (!this.ctx) return;
        this.resume();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(1200, now);
        osc.frequency.exponentialRampToValueAtTime(150, now + 0.3);

        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.005, now + 0.3);

        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.3);
    }

    playEMP() {
        if (!this.ctx) return;
        this.resume();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(1800, now);
        osc.frequency.exponentialRampToValueAtTime(45, now + 0.9);

        gain.gain.setValueAtTime(0.5, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);

        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.9);
    }

    playFanfare() {
        if (!this.ctx) return;
        this.resume();
        const now = this.ctx.currentTime;
        // Ascending triumphant fanfare chords (C5, E5, G5, C6)
        const notes = [523.25, 659.25, 783.99, 1046.50];
        notes.forEach((freq, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const startTime = now + (i * 0.075);

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, startTime);
            osc.frequency.exponentialRampToValueAtTime(freq * 1.04, startTime + 0.16);

            gain.gain.setValueAtTime(0.28, startTime);
            gain.gain.exponentialRampToValueAtTime(0.005, startTime + 0.18);

            osc.connect(gain);
            gain.connect(this.sfxGain);
            osc.start(startTime);
            osc.stop(startTime + 0.18);
        });
    }

    playBoost() {
        if (!this.ctx) return;
        this.resume();
        const now = this.ctx.currentTime;

        // Sonic boom bass punch
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(260, now);
        osc.frequency.exponentialRampToValueAtTime(50, now + 0.35);

        gain.gain.setValueAtTime(0.55, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.4);

        // Afterburner jet whoosh
        if (this.noiseBuffer) {
            const noise = this.ctx.createBufferSource();
            noise.buffer = this.noiseBuffer;
            const filter = this.ctx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.setValueAtTime(900, now);
            filter.frequency.exponentialRampToValueAtTime(2600, now + 0.15);
            filter.frequency.exponentialRampToValueAtTime(350, now + 0.7);

            const nGain = this.ctx.createGain();
            nGain.gain.setValueAtTime(0.45, now);
            nGain.gain.exponentialRampToValueAtTime(0.01, now + 0.75);

            noise.connect(filter);
            filter.connect(nGain);
            nGain.connect(this.sfxGain);
            noise.start(now);
            noise.stop(now + 0.75);
        }
    }

    startMusic() {
        if (this.isMusicPlaying) return;
        this.resume();
        this.isMusicPlaying = true;

        // Procedural retro-futuristic synth bass + arpeggio loop
        const bassLine = [55, 55, 65.41, 73.42, 55, 55, 82.41, 73.42]; // A1, C2, D2, E2
        const arpNotes = [220, 261.63, 329.63, 392.00, 440, 523.25, 659.25, 783.99]; // A Minor Pentatonic
        let step = 0;

        const playNote = () => {
            if (!this.isMusicPlaying || !this.ctx) return;
            const now = this.ctx.currentTime;

            // Bass note every 2 steps
            if (step % 2 === 0) {
                const bassFreq = bassLine[(step / 2) % bassLine.length];
                const bOsc = this.ctx.createOscillator();
                const bGain = this.ctx.createGain();
                bOsc.type = 'triangle';
                bOsc.frequency.setValueAtTime(bassFreq, now);

                bGain.gain.setValueAtTime(0.22, now);
                bGain.gain.exponentialRampToValueAtTime(0.01, now + 0.24);

                bOsc.connect(bGain);
                bGain.connect(this.musicGain);
                bOsc.start(now);
                bOsc.stop(now + 0.25);
            }

            // Arpeggio note
            const arpFreq = arpNotes[(step * 3) % arpNotes.length];
            const aOsc = this.ctx.createOscillator();
            const aGain = this.ctx.createGain();
            aOsc.type = 'sine';
            aOsc.frequency.setValueAtTime(arpFreq, now);

            aGain.gain.setValueAtTime(0.12, now);
            aGain.gain.exponentialRampToValueAtTime(0.005, now + 0.12);

            aOsc.connect(aGain);
            aGain.connect(this.musicGain);
            aOsc.start(now);
            aOsc.stop(now + 0.13);

            step++;
        };

        this.musicInterval = setInterval(playNote, 140);
    }

    stopMusic() {
        this.isMusicPlaying = false;
        if (this.musicInterval) {
            clearInterval(this.musicInterval);
            this.musicInterval = null;
        }
    }
}

export const soundEngine = new SoundEngine();

