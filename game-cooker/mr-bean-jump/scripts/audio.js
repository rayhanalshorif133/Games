/**
 * Mr. Bean Jump - Procedural Web Audio Engine
 * Lightweight, zero-dependency, ultra-low latency cartoon sound synthesizer.
 */
class SoundEngine {
    constructor() {
        this.ctx = null;
        this.muted = false;
        this.musicPlaying = false;
        this.musicInterval = null;
        this.musicStep = 0;
        this.volume = 0.6;
        
        // Attempt restoring mute setting from storage
        try {
            const savedMute = localStorage.getItem('mrbean_jump_muted');
            if (savedMute !== null) {
                this.muted = savedMute === 'true';
            }
        } catch (e) {}
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

    toggleMute() {
        this.muted = !this.muted;
        try {
            localStorage.setItem('mrbean_jump_muted', this.muted);
        } catch (e) {}
        if (this.muted) {
            this.stopMusic();
        } else {
            this.startMusic();
        }
        return this.muted;
    }

    // --- Jump Sound: cartoon pitch boing ---
    playJump() {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(680, now + 0.18);

        gain.gain.setValueAtTime(0.3 * this.volume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.24);
    }

    // --- Land Sound: solid wooden impact ---
    playLand() {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        
        // Low punch
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(160, now);
        osc.frequency.exponentialRampToValueAtTime(45, now + 0.12);

        gain.gain.setValueAtTime(0.5 * this.volume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.15);

        // Snap noise
        const bufferSize = this.ctx.sampleRate * 0.05;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.2));
        }
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(0.25 * this.volume, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

        noise.connect(noiseGain);
        noiseGain.connect(this.ctx.destination);
        noise.start(now);
    }

    // --- Score Point Chime: pleasant ding ---
    playScore(combo = 0) {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        // Pentatonic pitch scale based on combo
        const baseFreq = 587.33; // D5
        const scale = [0, 2, 4, 7, 9, 12, 14, 16];
        const semitones = scale[Math.min(combo, scale.length - 1)];
        const freq = baseFreq * Math.pow(2, semitones / 12);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0.35 * this.volume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.38);
    }

    // --- Perfect Landing Fanfare: Bright dual sparkle chord ---
    playPerfect(combo = 1) {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const base = 523.25 * Math.pow(2, (combo - 1) * 2 / 12); // C5 upwards
        const notes = [base, base * 1.2599, base * 1.4983, base * 2]; // Major Arpeggio

        notes.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const delay = idx * 0.045;

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now + delay);

            gain.gain.setValueAtTime(0.28 * this.volume, now + delay);
            gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.4);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now + delay);
            osc.stop(now + delay + 0.42);
        });
    }

    // --- Crash / Game Over Sound ---
    playCrash() {
        if (this.muted) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;

        // Comical descending slide
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.linearRampToValueAtTime(110, now + 0.35);

        gain.gain.setValueAtTime(0.35 * this.volume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.42);

        // Sad cartoon trombone "Wah-wah"
        const sadNotes = [261.6, 246.9, 233.1, 207.6]; // C4, B3, Bb3, Ab3
        sadNotes.forEach((f, idx) => {
            const sOsc = this.ctx.createOscillator();
            const sGain = this.ctx.createGain();
            const startTime = now + 0.28 + idx * 0.22;
            const duration = idx === 3 ? 0.65 : 0.2;

            sOsc.type = 'triangle';
            sOsc.frequency.setValueAtTime(f, startTime);
            if (idx === 3) {
                // Pitch bend on final wah
                sOsc.frequency.linearRampToValueAtTime(f * 0.9, startTime + duration);
            }

            sGain.gain.setValueAtTime(0.3 * this.volume, startTime);
            sGain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

            sOsc.connect(sGain);
            sGain.connect(this.ctx.destination);
            sOsc.start(startTime);
            sOsc.stop(startTime + duration + 0.05);
        });
    }

    // --- Background Jaunty Cartoon Theme Melody ---
    startMusic() {
        if (this.muted || this.musicPlaying) return;
        this.init();
        if (!this.ctx) return;

        this.musicPlaying = true;
        this.musicStep = 0;

        // Upbeat, jaunty Mr Bean style pizzicato melody
        const melody = [
            523.25, 0, 659.25, 0, 783.99, 659.25, 523.25, 0,
            587.33, 0, 698.46, 0, 880.00, 698.46, 587.33, 0,
            659.25, 0, 783.99, 0, 1046.50, 783.99, 659.25, 0,
            783.99, 0, 698.46, 0, 587.33, 0, 523.25, 0
        ];
        
        const bass = [
            261.63, 0, 261.63, 0, 261.63, 0, 261.63, 0,
            293.66, 0, 293.66, 0, 293.66, 0, 293.66, 0,
            329.63, 0, 329.63, 0, 329.63, 0, 329.63, 0,
            392.00, 0, 349.23, 0, 293.66, 0, 261.63, 0
        ];

        this.musicInterval = setInterval(() => {
            if (this.muted || !this.musicPlaying || !this.ctx) return;
            const now = this.ctx.currentTime;
            const noteMelody = melody[this.musicStep % melody.length];
            const noteBass = bass[this.musicStep % bass.length];

            if (noteMelody > 0) {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(noteMelody, now);
                gain.gain.setValueAtTime(0.09 * this.volume, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(now);
                osc.stop(now + 0.18);
            }

            if (noteBass > 0) {
                const bOsc = this.ctx.createOscillator();
                const bGain = this.ctx.createGain();
                bOsc.type = 'sine';
                bOsc.frequency.setValueAtTime(noteBass, now);
                bGain.gain.setValueAtTime(0.12 * this.volume, now);
                bGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
                bOsc.connect(bGain);
                bGain.connect(this.ctx.destination);
                bOsc.start(now);
                bOsc.stop(now + 0.22);
            }

            this.musicStep++;
        }, 150); // ~100 BPM
    }

    stopMusic() {
        this.musicPlaying = false;
        if (this.musicInterval) {
            clearInterval(this.musicInterval);
            this.musicInterval = null;
        }
    }
}

window.Sound = new SoundEngine();

