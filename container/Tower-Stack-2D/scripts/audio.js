/**
 * scripts/audio.js - Construct 3 Style Audio Engine
 * High-performance Web Audio API synthesizer for sound effects
 * and streaming background music playback.
 */

class SoundEngine {
    constructor() {
        this.ctx = null;
        this.muted = false;
        this.bgm = null;
        this.bgmLoaded = false;
        this.unlocked = false;

        // Load persisted mute state
        try {
            this.muted = localStorage.getItem('tower_sound_muted') === 'true';
        } catch (e) {
            this.muted = false;
        }

        this.initBGM();
    }

    initCtx() {
        if (!this.ctx) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) {
                this.ctx = new AudioCtx();
            }
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume().catch(() => {});
        }
    }

    initBGM() {
        try {
            this.bgm = new Audio();
            // Primary Construct 3 media folder, fallback to root
            this.bgm.src = 'media/bgm.mp3?v=4.0';
            this.bgm.loop = true;
            this.bgm.volume = 0.52;

            this.bgm.addEventListener('error', () => {
                if (this.bgm && this.bgm.src.includes('media/')) {
                    this.bgm.src = 'bgm.mp3?v=4.0';
                }
            });

            this.bgm.addEventListener('canplaythrough', () => {
                this.bgmLoaded = true;
            });
        } catch (e) {
            console.warn('[SoundEngine] BGM initialization error:', e);
        }
    }

    unlockAudio() {
        if (this.unlocked) return;
        this.initCtx();
        this.unlocked = true;

        if (!this.muted && this.bgm) {
            const playPromise = this.bgm.play();
            if (playPromise !== undefined) {
                playPromise.catch(() => {});
            }
        }
    }

    toggleMute() {
        this.muted = !this.muted;
        try {
            localStorage.setItem('tower_sound_muted', this.muted);
        } catch (e) {}

        if (this.bgm) {
            if (this.muted) {
                this.bgm.pause();
            } else {
                const playPromise = this.bgm.play();
                if (playPromise !== undefined) {
                    playPromise.catch(() => {});
                }
            }
        }
        return this.muted;
    }

    playBGM() {
        if (this.muted || !this.bgm) return;
        const playPromise = this.bgm.play();
        if (playPromise !== undefined) {
            playPromise.catch(() => {});
        }
    }

    pauseBGM() {
        if (this.bgm) {
            this.bgm.pause();
        }
    }

    // ==========================================
    // PROCEDURAL SYNTHESIZER SFX
    // ==========================================
    playDrop() {
        if (this.muted) return;
        this.initCtx();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(520, now);
        osc.frequency.exponentialRampToValueAtTime(200, now + 0.16);

        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.17);
    }

    playThud() {
        if (this.muted) return;
        this.initCtx();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.exponentialRampToValueAtTime(45, now + 0.18);

        gain.gain.setValueAtTime(0.65, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.2);
    }

    playPerfectChime(combo = 1) {
        if (this.muted) return;
        this.initCtx();
        if (!this.ctx) return;

        const baseScale = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98]; // C5, E5, G5, C6, E6, G6
        const noteIdx = Math.min(combo - 1, baseScale.length - 1);
        const freq = baseScale[Math.max(0, noteIdx)];

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const oscHarmonic = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);

        oscHarmonic.type = 'triangle';
        oscHarmonic.frequency.setValueAtTime(freq * 2, now);

        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

        osc.connect(gain);
        oscHarmonic.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        oscHarmonic.start(now);
        osc.stop(now + 0.4);
        oscHarmonic.stop(now + 0.4);
    }

    playMissTumble() {
        if (this.muted) return;
        this.initCtx();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(480, now);
        osc.frequency.exponentialRampToValueAtTime(75, now + 0.55);

        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.56);
    }

    playGameOverFanfare() {
        if (this.muted) return;
        this.initCtx();
        if (!this.ctx) return;

        const notes = [392.00, 349.23, 311.13, 261.63]; // G4, F4, Eb4, C4
        const now = this.ctx.currentTime;

        notes.forEach((freq, idx) => {
            const t = now + idx * 0.14;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, t);

            gain.gain.setValueAtTime(0.4, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(t);
            osc.stop(t + 0.3);
        });
    }

    playButtonClick() {
        if (this.muted) return;
        this.initCtx();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(300, now + 0.06);

        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.07);
    }
}

// Global instance for Construct 3 modular script architecture
if (typeof window !== 'undefined') {
    window.SoundEngine = SoundEngine;
}

