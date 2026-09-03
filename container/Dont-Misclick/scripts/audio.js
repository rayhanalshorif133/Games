/**
 * Don't Misclick - Windows 11 Audio Engine
 * Modern Fluent Sound Scheme (Mellow chimes, crisp clicks, glass notifications)
 * 100% self-contained Web Audio API synthesizer.
 */

class SoundController {
    constructor() {
        this.ctx = null;
        this.muted = false;
        this.musicPlaying = false;
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

    setMuted(mute) {
        this.muted = mute;
        if (this.muted && this.musicPlaying) {
            this.stopBgm();
        }
    }

    // Windows 11 modern window close (crisp, pleasant pop)
    playClose() {
        if (this.muted || !this.ctx) return;
        try {
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(800, now);
            osc.frequency.exponentialRampToValueAtTime(1400, now + 0.05);

            gain.gain.setValueAtTime(0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now);
            osc.stop(now + 0.07);
        } catch (e) {
            console.warn(e);
        }
    }

    // Windows 11 modern alert / misclick tone (mellow warning chime + low thud)
    playError() {
        if (this.muted || !this.ctx) return;
        try {
            const now = this.ctx.currentTime;

            // Chime note 1 (High bell)
            const osc1 = this.ctx.createOscillator();
            const gain1 = this.ctx.createGain();
            osc1.type = 'triangle';
            osc1.frequency.setValueAtTime(587.33, now); // D5
            osc1.frequency.setValueAtTime(440.00, now + 0.08); // A4
            gain1.gain.setValueAtTime(0.25, now);
            gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
            osc1.connect(gain1);
            gain1.connect(this.ctx.destination);
            osc1.start(now);
            osc1.stop(now + 0.3);

            // Sub thud
            const osc2 = this.ctx.createOscillator();
            const gain2 = this.ctx.createGain();
            osc2.type = 'sine';
            osc2.frequency.setValueAtTime(120, now);
            osc2.frequency.exponentialRampToValueAtTime(50, now + 0.2);
            gain2.gain.setValueAtTime(0.3, now);
            gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
            osc2.connect(gain2);
            gain2.connect(this.ctx.destination);
            osc2.start(now);
            osc2.stop(now + 0.24);
        } catch (e) {
            console.warn(e);
        }
    }

    // Penalty Frenzy: 5 quick cascading glass notification pops
    playPenaltySpawn() {
        if (this.muted || !this.ctx) return;
        try {
            const now = this.ctx.currentTime;
            const freqs = [523.25, 659.25, 783.99, 987.77, 1174.66]; // C5, E5, G5, B5, D6

            freqs.forEach((freq, i) => {
                const delay = i * 0.035;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();

                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, now + delay);
                osc.frequency.exponentialRampToValueAtTime(freq * 1.3, now + delay + 0.06);

                gain.gain.setValueAtTime(0.12, now + delay);
                gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.07);

                osc.connect(gain);
                gain.connect(this.ctx.destination);

                osc.start(now + delay);
                osc.stop(now + delay + 0.08);
            });
        } catch (e) {
            console.warn(e);
        }
    }

    // Windows 11 Mutation Swoosh (Modern sweep sound)
    playMutation() {
        if (this.muted || !this.ctx) return;
        try {
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(320, now);
            osc.frequency.exponentialRampToValueAtTime(1200, now + 0.22);
            osc.frequency.exponentialRampToValueAtTime(550, now + 0.4);

            gain.gain.setValueAtTime(0.01, now);
            gain.gain.linearRampToValueAtTime(0.28, now + 0.18);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now);
            osc.stop(now + 0.46);
        } catch (e) {
            console.warn(e);
        }
    }

    // Sleek radar ping for timer countdown
    playTick() {
        if (this.muted || !this.ctx) return;
        try {
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(950, now);
            gain.gain.setValueAtTime(0.12, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now);
            osc.stop(now + 0.06);
        } catch (e) {
            console.warn(e);
        }
    }

    // Windows 11 Blue Screen Crash sound
    playCrash() {
        if (this.muted || !this.ctx) return;
        try {
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(260, now);
            osc.frequency.exponentialRampToValueAtTime(45, now + 0.85);

            gain.gain.setValueAtTime(0.35, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.95);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now);
            osc.stop(now + 1.0);
        } catch (e) {
            console.warn(e);
        }
    }

    // Windows 11 Victory Chime
    playVictory() {
        if (this.muted || !this.ctx) return;
        try {
            const now = this.ctx.currentTime;
            const chord = [392.00, 493.88, 587.33, 783.99, 987.77]; // G Major modern bell chord

            chord.forEach((freq, i) => {
                const start = now + (i * 0.08);
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();

                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, start);

                gain.gain.setValueAtTime(0.2, start);
                gain.gain.exponentialRampToValueAtTime(0.001, start + 0.8);

                osc.connect(gain);
                gain.connect(this.ctx.destination);

                osc.start(start);
                osc.stop(start + 0.85);
            });
        } catch (e) {
            console.warn(e);
        }
    }

    // Modern Lo-Fi Synth Ambient Pulse (Toggleable)
    startBgm() {
        if (this.musicPlaying || this.muted) return;
        this.init();
        this.musicPlaying = true;
        const chords = [
            [261.63, 329.63, 392.00], // C
            [220.00, 261.63, 329.63], // Am
            [174.61, 220.00, 261.63], // F
            [196.00, 246.94, 293.66]  // G
        ];
        let chordIdx = 0;

        const playNextChord = () => {
            if (!this.musicPlaying || this.muted || !this.ctx) return;
            const currentChord = chords[chordIdx];
            chordIdx = (chordIdx + 1) % chords.length;
            const now = this.ctx.currentTime;

            currentChord.forEach(freq => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();

                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, now);

                gain.gain.setValueAtTime(0.025, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.95);

                osc.connect(gain);
                gain.connect(this.ctx.destination);

                osc.start(now);
                osc.stop(now + 1.0);
            });

            this.musicTimer = setTimeout(playNextChord, 950);
        };

        playNextChord();
    }

    stopBgm() {
        this.musicPlaying = false;
        if (this.musicTimer) {
            clearTimeout(this.musicTimer);
            this.musicTimer = null;
        }
    }

    toggleBgm() {
        if (this.musicPlaying) {
            this.stopBgm();
            return false;
        } else {
            this.startBgm();
            return true;
        }
    }
}

window.sound = new SoundController();
