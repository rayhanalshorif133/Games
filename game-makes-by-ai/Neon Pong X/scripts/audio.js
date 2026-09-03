// Neon Pong X - Cyberpunk Web Audio API Sound Synthesizer
// Provides zero-dependency procedural arcade sound effects & synthwave background music

class NeonAudioEngine {
    constructor() {
        this.ctx = null;
        this.isMuted = false;
        this.isMusicPlaying = true;
        this.masterVolume = 0.8;
        this.musicVolume = 0.35;
        this.sfxVolume = 0.9;
        
        this.musicTimer = null;
        this.currentStep = 0;
        this.bpm = 124;
        
        // Synthwave 16-step bassline pattern (frequencies in Hz: A1, C2, D2, F2, E2)
        this.bassSequence = [
            110.00, 0, 110.00, 110.00,
            130.81, 0, 146.83, 0,
            110.00, 110.00, 0, 110.00,
            164.81, 146.83, 130.81, 123.47
        ];
        
        // Melody lead sequence
        this.leadSequence = [
            440.00, 0, 0, 523.25,
            0, 587.33, 0, 659.25,
            587.33, 0, 523.25, 0,
            440.00, 0, 392.00, 0
        ];
    }

    init() {
        if (!this.ctx) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) {
                this.ctx = new AudioCtx();
            }
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    playPaddleHit(speedFactor = 1.0, isPlayer = true) {
        if (this.isMuted || !this.ctx) return;
        this.init();

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        // Waveform: square + lowpass filter gives that authentic 80s arcade punch
        osc.type = isPlayer ? 'sawtooth' : 'triangle';
        const startFreq = isPlayer ? 320 * speedFactor : 240 * speedFactor;
        const endFreq = isPlayer ? 80 : 60;

        osc.frequency.setValueAtTime(startFreq, now);
        osc.frequency.exponentialRampToValueAtTime(endFreq, now + 0.12);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(isPlayer ? 2400 : 1800, now);
        filter.frequency.exponentialRampToValueAtTime(200, now + 0.12);

        gain.gain.setValueAtTime(0.45 * this.sfxVolume * this.masterVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.14);
    }

    playWallHit(pitchMultiplier = 1.0) {
        if (this.isMuted || !this.ctx) return;
        this.init();

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        const baseFreq = 880 * pitchMultiplier;
        osc.frequency.setValueAtTime(baseFreq, now);
        osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.4, now + 0.08);

        gain.gain.setValueAtTime(0.3 * this.sfxVolume * this.masterVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.09);
    }

    playSmash() {
        if (this.isMuted || !this.ctx) return;
        this.init();

        const now = this.ctx.currentTime;
        
        // Deep sub boom
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(160, now);
        osc.frequency.exponentialRampToValueAtTime(30, now + 0.35);

        // Distortion / Overdrive wave shaper
        const waveShaper = this.ctx.createWaveShaper();
        const curve = new Float32Array(256);
        for (let i = 0; i < 256; ++i) {
            const x = (i * 2) / 256 - 1;
            curve[i] = (Math.PI + 4) * x / (Math.PI + 4 * Math.abs(x));
        }
        waveShaper.curve = curve;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, now);
        filter.frequency.linearRampToValueAtTime(100, now + 0.35);

        gain.gain.setValueAtTime(0.6 * this.sfxVolume * this.masterVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

        osc.connect(waveShaper);
        waveShaper.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.38);
    }

    playScore(isPlayerGoal = true) {
        if (this.isMuted || !this.ctx) return;
        this.init();

        const notes = isPlayerGoal ? [440, 554.37, 659.25, 880] : [330, 293.66, 246.94, 220];
        const stepTime = 0.08;

        notes.forEach((freq, idx) => {
            const now = this.ctx.currentTime + idx * stepTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = isPlayerGoal ? 'triangle' : 'sawtooth';
            osc.frequency.setValueAtTime(freq, now);

            gain.gain.setValueAtTime(0.4 * this.sfxVolume * this.masterVolume, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now);
            osc.stop(now + 0.18);
        });
    }

    playPowerup() {
        if (this.isMuted || !this.ctx) return;
        this.init();

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(1200, now + 0.25);

        gain.gain.setValueAtTime(0.35 * this.sfxVolume * this.masterVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.26);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.26);
    }

    playButton() {
        if (this.isMuted || !this.ctx) return;
        this.init();

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(1200, now + 0.05);

        gain.gain.setValueAtTime(0.2 * this.sfxVolume * this.masterVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.06);
    }

    startMusic() {
        if (this.musicTimer || !this.isMusicPlaying) return;
        this.init();

        const stepDuration = (60 / this.bpm) / 4; // 16th notes
        this.musicTimer = setInterval(() => {
            if (this.isMuted || !this.isMusicPlaying || !this.ctx) return;

            const now = this.ctx.currentTime;
            const bassFreq = this.bassSequence[this.currentStep];
            const leadFreq = this.leadSequence[this.currentStep];

            // Bass note synth
            if (bassFreq > 0) {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                const filter = this.ctx.createBiquadFilter();

                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(bassFreq, now);

                filter.type = 'lowpass';
                filter.frequency.setValueAtTime(600, now);
                filter.frequency.exponentialRampToValueAtTime(120, now + stepDuration * 0.9);

                gain.gain.setValueAtTime(0.25 * this.musicVolume * this.masterVolume, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + stepDuration * 0.95);

                osc.connect(filter);
                filter.connect(gain);
                gain.connect(this.ctx.destination);

                osc.start(now);
                osc.stop(now + stepDuration * 0.95);
            }

            // Lead arpeggio synth (subtle, airy)
            if (leadFreq > 0 && this.currentStep % 2 === 0) {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                const filter = this.ctx.createBiquadFilter();

                osc.type = 'sine';
                osc.frequency.setValueAtTime(leadFreq, now);

                filter.type = 'bandpass';
                filter.frequency.setValueAtTime(1200, now);
                filter.Q.value = 3;

                gain.gain.setValueAtTime(0.12 * this.musicVolume * this.masterVolume, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + stepDuration * 1.5);

                osc.connect(filter);
                filter.connect(gain);
                gain.connect(this.ctx.destination);

                osc.start(now);
                osc.stop(now + stepDuration * 1.5);
            }

            this.currentStep = (this.currentStep + 1) % 16;
        }, stepDuration * 1000);
    }

    stopMusic() {
        if (this.musicTimer) {
            clearInterval(this.musicTimer);
            this.musicTimer = null;
        }
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        return this.isMuted;
    }

    toggleMusic() {
        this.isMusicPlaying = !this.isMusicPlaying;
        if (this.isMusicPlaying) {
            this.startMusic();
        } else {
            this.stopMusic();
        }
        return this.isMusicPlaying;
    }
}

window.neonAudio = new NeonAudioEngine();

