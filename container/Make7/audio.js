/**
 * MAKE 7 - Web Audio Sound Synthesizer (Replicating make7 demo.mp4)
 * Generates exact tactile sounds: rotation ratchet, placement thuds,
 * bubble pop merges, combo ascending tones, coin chimes, and 7-blast!
 */
class SoundManager {
    constructor() {
        this.ctx = null;
        this.soundEnabled = localStorage.getItem('make7_sound') !== 'false';
        this.musicEnabled = localStorage.getItem('make7_music') !== 'false';
        this.musicTimer = null;
        this.musicGain = null;
        this.isMusicPlaying = false;
    }

    get enabled() {
        return this.soundEnabled;
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
        if (this.musicEnabled && !this.isMusicPlaying) {
            this.startMusic();
        }
    }

    toggleSound() {
        if (!this.ctx) {
            this.init();
        } else if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
        this.soundEnabled = !this.soundEnabled;
        localStorage.setItem('make7_sound', this.soundEnabled);
        if (this.soundEnabled) this.playTap();
        return this.soundEnabled;
    }

    toggleMusic() {
        if (!this.ctx) {
            this.init();
        } else if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
        this.musicEnabled = !this.musicEnabled;
        localStorage.setItem('make7_music', this.musicEnabled);
        if (this.musicEnabled) {
            this.startMusic();
        } else {
            this.stopMusic();
        }
        return this.musicEnabled;
    }

    startMusic() {
        if (!this.musicEnabled) return;
        if (!this.ctx) {
            this.init();
        }
        if (!this.ctx || this.isMusicPlaying) return;

        this.isMusicPlaying = true;
        this.musicGain = this.ctx.createGain();
        this.musicGain.gain.setValueAtTime(0.08, this.ctx.currentTime);
        this.musicGain.connect(this.ctx.destination);

        const chordProgression = [
            // Cmaj7: C3, G3, B3, E4, G4
            [130.81, 196.00, 246.94, 329.63, 392.00],
            // Am7: A2, E3, G3, C4, E4
            [110.00, 164.81, 196.00, 261.63, 329.63],
            // Fmaj7: F2, C3, A3, E4, A4
            [87.31, 130.81, 220.00, 329.63, 440.00],
            // Gsus4 / G: G2, D3, G3, B3, D4
            [98.00, 146.83, 196.00, 246.94, 293.66]
        ];

        let chordStep = 0;
        const playBar = () => {
            if (!this.isMusicPlaying || !this.musicEnabled || !this.ctx) return;
            const now = this.ctx.currentTime;
            const chord = chordProgression[chordStep % chordProgression.length];
            chordStep++;

            chord.forEach((freq, idx) => {
                const noteTime = now + idx * 0.42;
                const osc = this.ctx.createOscillator();
                const noteGain = this.ctx.createGain();
                const filter = this.ctx.createBiquadFilter();

                filter.type = 'lowpass';
                filter.frequency.setValueAtTime(900, noteTime);

                osc.type = idx === 0 ? 'triangle' : 'sine';
                osc.frequency.setValueAtTime(freq, noteTime);

                const vol = idx === 0 ? 0.35 : 0.22;
                noteGain.gain.setValueAtTime(0.001, noteTime);
                noteGain.gain.exponentialRampToValueAtTime(vol, noteTime + 0.05);
                noteGain.gain.exponentialRampToValueAtTime(0.001, noteTime + 1.15);

                osc.connect(filter);
                filter.connect(noteGain);
                noteGain.connect(this.musicGain);

                osc.start(noteTime);
                osc.stop(noteTime + 1.2);
            });
        };

        playBar();
        this.musicTimer = setInterval(playBar, 2100);
    }

    stopMusic() {
        this.isMusicPlaying = false;
        if (this.musicTimer) {
            clearInterval(this.musicTimer);
            this.musicTimer = null;
        }
        if (this.musicGain && this.ctx) {
            try {
                this.musicGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);
            } catch (e) {}
        }
    }

    // Piece 60° rotation click
    playRotate() {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(650, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(320, this.ctx.currentTime + 0.05);

        gain.gain.setValueAtTime(0.35, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.05);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.05);
    }

    // General tap / button click
    playTap() {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(120, this.ctx.currentTime + 0.04);

        gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.04);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.04);
    }

    // Tile placement onto board socket
    playPlace() {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(260, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(70, this.ctx.currentTime + 0.09);

        gain.gain.setValueAtTime(0.4, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.09);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.09);
    }

    // Water droplet / bubble pop merge sound (matches video pop!)
    playMerge(comboLevel = 1) {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;

        // Ascending pentatonic pitches for consecutive combos
        const pitches = [440, 523, 587, 659, 784, 880, 1046];
        const freq = pitches[Math.min(comboLevel - 1, pitches.length - 1)];

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        // Bubble chirp curve
        osc.frequency.setValueAtTime(freq * 0.7, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(freq * 1.6, this.ctx.currentTime + 0.08);
        osc.frequency.exponentialRampToValueAtTime(freq, this.ctx.currentTime + 0.16);

        gain.gain.setValueAtTime(0.5, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.2);
    }

    // Coin collection jingle
    playCoin() {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        [987.77, 1318.51].forEach((f, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(f, now + i * 0.08);

            gain.gain.setValueAtTime(0.3, now + i * 0.08);
            gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.2);

            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now + i * 0.08);
            osc.stop(now + i * 0.08 + 0.2);
        });
    }

    // Rainbow 7 Target Creation Fanfare
    playMake7() {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51];
        notes.forEach((f, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(f, now + i * 0.07);

            gain.gain.setValueAtTime(0.4, now + i * 0.07);
            gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.07 + 0.35);

            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now + i * 0.07);
            osc.stop(now + i * 0.07 + 0.35);
        });
    }

    // Explosive blast when three 7s merge
    playExplosion() {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(25, this.ctx.currentTime + 0.45);

        gain.gain.setValueAtTime(0.65, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.5);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.5);
    }
}

window.sounds = new SoundManager();

