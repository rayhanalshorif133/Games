// Web Audio API Retro Sound System
// Pure procedural synthesis - no external audio files required!

class SoundSystem {
    constructor() {
        this.ctx = null;
        this.soundEnabled = true;
        this.musicEnabled = true;
        this.masterVolume = 0.5;
        this.isMusicPlaying = false;
        this.musicTimer = null;
    }

    init() {
        if (!this.ctx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                this.ctx = new AudioContext();
            }
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    // Play a retro synth tone
    playTone(freq, type = 'sine', duration = 0.1, gain = 0.3, pitchDrop = 0) {
        if (!this.soundEnabled || !this.ctx) return;
        try {
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gainNode = this.ctx.createGain();

            osc.type = type;
            osc.frequency.setValueAtTime(freq, now);
            if (pitchDrop > 0) {
                osc.frequency.exponentialRampToValueAtTime(Math.max(20, freq - pitchDrop), now + duration);
            }

            gainNode.gain.setValueAtTime(gain * this.masterVolume, now);
            gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);

            osc.connect(gainNode);
            gainNode.connect(this.ctx.destination);

            osc.start(now);
            osc.stop(now + duration);
        } catch (e) {
            console.warn('Audio play error:', e);
        }
    }

    // Sound effect: Paddle Hit
    playPaddleHit() {
        this.init();
        if (!this.soundEnabled || !this.ctx) return;
        const now = this.ctx.currentTime;

        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const gainNode = this.ctx.createGain();

        osc1.type = 'triangle';
        osc1.frequency.setValueAtTime(320, now);
        osc1.frequency.exponentialRampToValueAtTime(140, now + 0.12);

        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(640, now);
        osc2.frequency.exponentialRampToValueAtTime(280, now + 0.08);

        gainNode.gain.setValueAtTime(0.4 * this.masterVolume, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

        osc1.connect(gainNode);
        osc2.connect(gainNode);
        gainNode.connect(this.ctx.destination);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 0.14);
        osc2.stop(now + 0.14);
    }

    // Sound effect: Wall bounce
    playWallHit() {
        this.init();
        if (!this.soundEnabled || !this.ctx) return;
        this.playTone(520, 'sine', 0.06, 0.25, 120);
    }

    // Sound effect: Brick Hit (takes damage but not broken)
    playBrickHit(combo = 1) {
        this.init();
        if (!this.soundEnabled || !this.ctx) return;
        const baseFreq = 440 + Math.min(combo * 40, 400);
        this.playTone(baseFreq, 'square', 0.08, 0.2, 50);
    }

    // Sound effect: Brick Destroyed / Shattered
    playBrickBreak(combo = 1) {
        this.init();
        if (!this.soundEnabled || !this.ctx) return;
        const now = this.ctx.currentTime;

        const osc = this.ctx.createOscillator();
        const gainNode = this.ctx.createGain();

        const baseFreq = 260 + Math.min(combo * 50, 500);
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(baseFreq, now);
        osc.frequency.exponentialRampToValueAtTime(baseFreq * 2.2, now + 0.08);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.2);

        gainNode.gain.setValueAtTime(0.35 * this.masterVolume, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

        // Noise buffer burst for explosion crunch
        const bufferSize = Math.floor(this.ctx.sampleRate * 0.1);
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(0.2 * this.masterVolume, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

        osc.connect(gainNode);
        gainNode.connect(this.ctx.destination);
        noise.connect(noiseGain);
        noiseGain.connect(this.ctx.destination);

        osc.start(now);
        noise.start(now);
        osc.stop(now + 0.22);
        noise.stop(now + 0.1);
    }

    // Sound effect: Powerup Collect
    playPowerup() {
        this.init();
        if (!this.soundEnabled || !this.ctx) return;
        const notes = [523.25, 659.25, 783.99, 1046.50];
        notes.forEach((freq, idx) => {
            setTimeout(() => {
                this.playTone(freq, 'sine', 0.12, 0.3, 0);
            }, idx * 60);
        });
    }

    // Sound effect: Lose Life
    playLifeLost() {
        this.init();
        if (!this.soundEnabled || !this.ctx) return;
        const notes = [440, 392, 330, 220];
        notes.forEach((freq, idx) => {
            setTimeout(() => {
                this.playTone(freq, 'sawtooth', 0.15, 0.35, 60);
            }, idx * 90);
        });
    }

    // Sound effect: Game Over
    playGameOver() {
        this.init();
        if (!this.soundEnabled || !this.ctx) return;
        const notes = [330, 311, 293, 261, 196, 130];
        notes.forEach((freq, idx) => {
            setTimeout(() => {
                this.playTone(freq, 'sawtooth', 0.25, 0.4, 40);
            }, idx * 140);
        });
    }

    // Sound effect: Victory / Level Complete
    playVictory() {
        this.init();
        if (!this.soundEnabled || !this.ctx) return;
        const chords = [
            { f: 523.25, d: 0.12 },
            { f: 659.25, d: 0.12 },
            { f: 783.99, d: 0.12 },
            { f: 1046.50, d: 0.35 },
            { f: 880.00, d: 0.15 },
            { f: 1046.50, d: 0.45 }
        ];
        let delay = 0;
        chords.forEach((c) => {
            setTimeout(() => {
                this.playTone(c.f, 'triangle', c.d, 0.4, 0);
            }, delay);
            delay += c.d * 900;
        });
    }

    // Sound effect: UI click / button
    playClick() {
        this.init();
        if (!this.soundEnabled || !this.ctx) return;
        this.playTone(880, 'sine', 0.04, 0.2, 200);
    }

    // Ambient Synthwave Arpeggio loop (Optional background music)
    startMusic() {
        if (!this.musicEnabled || this.isMusicPlaying) return;
        this.init();
        if (!this.ctx) return;

        this.isMusicPlaying = true;
        const bassLine = [110, 110, 130.81, 146.83, 98, 98, 110, 123.47];
        let step = 0;

        this.musicTimer = setInterval(() => {
            if (!this.musicEnabled || !this.isMusicPlaying || !this.ctx) return;
            const freq = bassLine[step % bassLine.length];
            this.playTone(freq, 'sawtooth', 0.16, 0.08, 15);
            if (step % 2 === 0) {
                const highFreq = freq * 4;
                this.playTone(highFreq, 'sine', 0.09, 0.03, 0);
            }
            step++;
        }, 220);
    }

    stopMusic() {
        this.isMusicPlaying = false;
        if (this.musicTimer) {
            clearInterval(this.musicTimer);
            this.musicTimer = null;
        }
    }

    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        return this.soundEnabled;
    }

    toggleMusic() {
        this.musicEnabled = !this.musicEnabled;
        if (this.musicEnabled) {
            this.startMusic();
        } else {
            this.stopMusic();
        }
        return this.musicEnabled;
    }
}

window.sounds = new SoundSystem();

