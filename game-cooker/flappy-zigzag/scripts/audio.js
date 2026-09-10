/**
 * Neon Audio Engine - Pure Web Audio API
 * Generates all sound effects and synthwave ambient music procedurally.
 */
class NeonAudio {
    constructor() {
        this.ctx = null;
        this.sfxEnabled = true;
        this.bgmEnabled = true;
        this.sfxVolume = 0.7;
        this.bgmVolume = 0.35;
        this.bgmTimer = null;
        this.bgmStep = 0;
        this.isInitialized = false;

        // Pentatonic synthwave bass/lead notes in Hz
        this.scale = [110, 130.81, 146.83, 164.81, 196.00, 220, 261.63, 293.66, 329.63, 392.00, 440];
        this.arpSequence = [0, 4, 7, 4, 2, 5, 8, 5, 3, 7, 10, 7, 2, 5, 8, 4];
    }

    init() {
        if (this.ctx) return;
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        this.ctx = new AudioCtx();
        this.isInitialized = true;
    }

    ensureContext() {
        if (!this.ctx) this.init();
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    playClick() {
        if (!this.sfxEnabled) return;
        this.ensureContext();
        if (!this.ctx) return;

        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(800, this.ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(1400, this.ctx.currentTime + 0.05);

            gain.gain.setValueAtTime(this.sfxVolume * 0.25, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);

            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start();
            osc.stop(this.ctx.currentTime + 0.06);
        } catch (e) {}
    }

    playFlap() {
        if (!this.sfxEnabled) return;
        this.ensureContext();
        if (!this.ctx) return;

        try {
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const filter = this.ctx.createBiquadFilter();

            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(240, now);
            osc.frequency.exponentialRampToValueAtTime(620, now + 0.07);

            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(900, now);
            filter.frequency.exponentialRampToValueAtTime(2600, now + 0.07);

            gain.gain.setValueAtTime(this.sfxVolume * 0.3, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now);
            osc.stop(now + 0.11);
        } catch (e) {}
    }

    playGem() {
        if (!this.sfxEnabled) return;
        this.ensureContext();
        if (!this.ctx) return;

        try {
            const now = this.ctx.currentTime;
            const notes = [659.25, 987.77, 1318.51]; // E5, B5, E6
            notes.forEach((freq, idx) => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(freq, now + idx * 0.05);

                gain.gain.setValueAtTime(0.001, now + idx * 0.05);
                gain.gain.linearRampToValueAtTime(this.sfxVolume * 0.35, now + idx * 0.05 + 0.02);
                gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.22);

                osc.connect(gain);
                gain.connect(this.ctx.destination);

                osc.start(now + idx * 0.05);
                osc.stop(now + idx * 0.05 + 0.25);
            });
        } catch (e) {}
    }

    playCoin(combo = 0) {
        if (!this.sfxEnabled) return;
        this.ensureContext();
        if (!this.ctx) return;

        try {
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            // Pitch rises melodically with consecutive coin combo
            const baseFreq = 587.33; // D5
            const semitones = Math.min(combo, 16);
            const freq = baseFreq * Math.pow(2, semitones / 12);

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now);
            osc.frequency.exponentialRampToValueAtTime(freq * 1.25, now + 0.08);

            gain.gain.setValueAtTime(0.001, now);
            gain.gain.linearRampToValueAtTime(this.sfxVolume * 0.28, now + 0.015);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now);
            osc.stop(now + 0.13);
        } catch (e) {}
    }

    playMagnet() {
        if (!this.sfxEnabled) return;
        this.ensureContext();
        if (!this.ctx) return;

        try {
            const now = this.ctx.currentTime;
            // Upward futuristic magnetic sweep
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(320, now);
            osc.frequency.exponentialRampToValueAtTime(1280, now + 0.25);

            const filter = this.ctx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.setValueAtTime(600, now);
            filter.frequency.exponentialRampToValueAtTime(2400, now + 0.25);
            filter.Q.value = 4;

            gain.gain.setValueAtTime(0.001, now);
            gain.gain.linearRampToValueAtTime(this.sfxVolume * 0.45, now + 0.04);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now);
            osc.stop(now + 0.36);
        } catch (e) {}
    }

    playGatePass() {
        if (!this.sfxEnabled) return;
        this.ensureContext();
        if (!this.ctx) return;

        try {
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(440, now);
            osc.frequency.exponentialRampToValueAtTime(880, now + 0.09);

            gain.gain.setValueAtTime(this.sfxVolume * 0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now);
            osc.stop(now + 0.13);
        } catch (e) {}
    }

    playBounce() {
        if (!this.sfxEnabled) return;
        this.ensureContext();
        if (!this.ctx) return;

        try {
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(320, now);
            osc.frequency.exponentialRampToValueAtTime(640, now + 0.08);
            osc.frequency.exponentialRampToValueAtTime(240, now + 0.16);

            gain.gain.setValueAtTime(this.sfxVolume * 0.4, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now);
            osc.stop(now + 0.19);
        } catch (e) {}
    }

    playLevelUp() {
        if (!this.sfxEnabled) return;
        this.ensureContext();
        if (!this.ctx) return;

        try {
            const now = this.ctx.currentTime;
            const chords = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
            chords.forEach((freq, idx) => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(freq, now + idx * 0.06);

                gain.gain.setValueAtTime(0.001, now + idx * 0.06);
                gain.gain.linearRampToValueAtTime(this.sfxVolume * 0.35, now + idx * 0.06 + 0.02);
                gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.28);

                osc.connect(gain);
                gain.connect(this.ctx.destination);

                osc.start(now + idx * 0.06);
                osc.stop(now + idx * 0.06 + 0.3);
            });
        } catch (e) {}
    }

    playHurt() {
        if (!this.sfxEnabled) return;
        this.ensureContext();
        if (!this.ctx) return;

        try {
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(300, now);
            osc.frequency.exponentialRampToValueAtTime(80, now + 0.2);

            gain.gain.setValueAtTime(this.sfxVolume * 0.5, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now);
            osc.stop(now + 0.23);
        } catch (e) {}
    }

    playHeal() {
        if (!this.sfxEnabled) return;
        this.ensureContext();
        if (!this.ctx) return;

        try {
            const now = this.ctx.currentTime;
            [440, 554.37, 659.25, 880].forEach((freq, idx) => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, now + idx * 0.05);

                gain.gain.setValueAtTime(0.001, now + idx * 0.05);
                gain.gain.linearRampToValueAtTime(this.sfxVolume * 0.35, now + idx * 0.05 + 0.02);
                gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.25);

                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(now + idx * 0.05);
                osc.stop(now + idx * 0.05 + 0.28);
            });
        } catch (e) {}
    }

    playBoost() {
        if (!this.sfxEnabled) return;
        this.ensureContext();
        if (!this.ctx) return;

        try {
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const filter = this.ctx.createBiquadFilter();

            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(180, now);
            osc.frequency.exponentialRampToValueAtTime(900, now + 0.4);

            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(400, now);
            filter.frequency.exponentialRampToValueAtTime(3200, now + 0.4);

            gain.gain.setValueAtTime(this.sfxVolume * 0.4, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now);
            osc.stop(now + 0.46);
        } catch (e) {}
    }

    playShieldPickup() {
        if (!this.sfxEnabled) return;
        this.ensureContext();
        if (!this.ctx) return;

        try {
            const now = this.ctx.currentTime;
            [350, 520, 700].forEach((freq, idx) => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(freq, now + idx * 0.04);

                gain.gain.setValueAtTime(0.001, now + idx * 0.04);
                gain.gain.linearRampToValueAtTime(this.sfxVolume * 0.35, now + idx * 0.04 + 0.02);
                gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.04 + 0.22);

                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(now + idx * 0.04);
                osc.stop(now + idx * 0.04 + 0.25);
            });
        } catch (e) {}
    }

    playMultiplier() {
        if (!this.sfxEnabled) return;
        this.ensureContext();
        if (!this.ctx) return;

        try {
            const now = this.ctx.currentTime;
            [523.25, 783.99, 1046.50, 1567.98].forEach((freq, idx) => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(freq, now + idx * 0.05);

                const filter = this.ctx.createBiquadFilter();
                filter.type = 'lowpass';
                filter.frequency.setValueAtTime(1800, now + idx * 0.05);

                gain.gain.setValueAtTime(0.001, now + idx * 0.05);
                gain.gain.linearRampToValueAtTime(this.sfxVolume * 0.3, now + idx * 0.05 + 0.02);
                gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.22);

                osc.connect(filter);
                filter.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(now + idx * 0.05);
                osc.stop(now + idx * 0.05 + 0.25);
            });
        } catch (e) {}
    }

    playCrash() {
        if (!this.sfxEnabled) return;
        this.ensureContext();
        if (!this.ctx) return;

        try {
            const now = this.ctx.currentTime;

            // White noise burst
            const bufferSize = Math.floor(this.ctx.sampleRate * 0.35);
            const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.25));
            }

            const noise = this.ctx.createBufferSource();
            noise.buffer = buffer;

            const filter = this.ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(1200, now);
            filter.frequency.exponentialRampToValueAtTime(80, now + 0.32);

            const gain = this.ctx.createGain();
            gain.gain.setValueAtTime(this.sfxVolume * 0.5, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

            noise.connect(filter);
            filter.connect(gain);
            gain.connect(this.ctx.destination);

            noise.start(now);

            // Sub bass impact
            const osc = this.ctx.createOscillator();
            const oscGain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(140, now);
            osc.frequency.exponentialRampToValueAtTime(30, now + 0.35);

            oscGain.gain.setValueAtTime(this.sfxVolume * 0.6, now);
            oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

            osc.connect(oscGain);
            oscGain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.36);
        } catch (e) {}
    }

    startBGM() {
        if (this.bgmTimer) return;
        if (!this.bgmEnabled) return;
        this.ensureContext();
        if (!this.ctx) return;

        const interval = 130; // ms per 16th note

        this.bgmTimer = setInterval(() => {
            if (!this.bgmEnabled || !this.ctx) return;
            this.playBGMStep();
        }, interval);
    }

    stopBGM() {
        if (this.bgmTimer) {
            clearInterval(this.bgmTimer);
            this.bgmTimer = null;
        }
    }

    playBGMStep() {
        if (!this.ctx || this.ctx.state !== 'running') return;
        try {
            const now = this.ctx.currentTime;
            const noteIdx = this.arpSequence[this.bgmStep % this.arpSequence.length];
            const freq = this.scale[noteIdx % this.scale.length];

            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const filter = this.ctx.createBiquadFilter();

            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(freq * 1.5, now);

            filter.type = 'bandpass';
            filter.frequency.setValueAtTime(900 + (this.bgmStep % 4) * 350, now);
            filter.Q.value = 2.5;

            const vol = this.bgmVolume * 0.12;
            gain.gain.setValueAtTime(0.001, now);
            gain.gain.linearRampToValueAtTime(vol, now + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now);
            osc.stop(now + 0.15);

            // Bass pulse
            if (this.bgmStep % 4 === 0) {
                const bassOsc = this.ctx.createOscillator();
                const bassGain = this.ctx.createGain();
                bassOsc.type = 'sine';
                bassOsc.frequency.setValueAtTime(60, now);
                bassOsc.frequency.exponentialRampToValueAtTime(35, now + 0.2);

                bassGain.gain.setValueAtTime(this.bgmVolume * 0.22, now);
                bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

                bassOsc.connect(bassGain);
                bassGain.connect(this.ctx.destination);
                bassOsc.start(now);
                bassOsc.stop(now + 0.23);
            }

            this.bgmStep++;
        } catch (e) {}
    }

    setSFXEnabled(val) {
        this.sfxEnabled = !!val;
    }

    setBGMEnabled(val) {
        this.bgmEnabled = !!val;
        if (!this.bgmEnabled) {
            this.stopBGM();
        } else if (!this.bgmTimer) {
            this.startBGM();
        }
    }

    setSFXVolume(val) {
        this.sfxVolume = Math.max(0, Math.min(1, val));
    }

    setBGMVolume(val) {
        this.bgmVolume = Math.max(0, Math.min(1, val));
    }
}

window.neonAudio = new NeonAudio();

