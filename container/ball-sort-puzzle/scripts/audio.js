// Procedural Web Audio API Sound Synthesizer for Ball Sort Puzzle
// Zero external files needed, works offline and on file:// without CORS issues

class SoundManager {
    constructor() {
        this.ctx = null;
        this.soundEnabled = true;
        this.musicEnabled = true;
        this.bgmTimer = null;
        this.bgmStep = 0;

        // Load settings from localStorage
        try {
            const s = localStorage.getItem('bsp_sound');
            if (s !== null) this.soundEnabled = (s === 'true');
            const m = localStorage.getItem('bsp_music');
            if (m !== null) this.musicEnabled = (m === 'true');
        } catch (e) { }

        // Unlock audio context on first user interaction
        const unlock = () => {
            this.initContext();
            window.removeEventListener('pointerdown', unlock);
            window.removeEventListener('keydown', unlock);
        };
        window.addEventListener('pointerdown', unlock);
        window.addEventListener('keydown', unlock);
    }

    initContext() {
        if (!this.ctx) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) {
                this.ctx = new AudioCtx();
                if (this.musicEnabled) {
                    this.startBgm();
                }
            }
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    setSound(enabled) {
        this.soundEnabled = enabled;
        try { localStorage.setItem('bsp_sound', enabled); } catch (e) { }
    }

    setMusic(enabled) {
        this.musicEnabled = enabled;
        try { localStorage.setItem('bsp_music', enabled); } catch (e) { }
        if (enabled) {
            this.startBgm();
        } else {
            this.stopBgm();
        }
    }

    // Ball Lift Sound - Crisp soft ascending bubble pop
    playBallLift(pitchIndex = 0) {
        if (!this.soundEnabled || !this.ctx) return;
        try {
            const pitchMult = 1 + pitchIndex * 0.12;
            const t = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(320 * pitchMult, t);
            osc.frequency.exponentialRampToValueAtTime(650 * pitchMult, t + 0.08);

            gain.gain.setValueAtTime(0.3, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(t);
            osc.stop(t + 0.13);
        } catch (e) { }
    }

    // Ball Drop / Clink Sound - Resonant glass/marble impact with harmonic overtone
    playBallDrop(pitchIndex = 0) {
        if (!this.soundEnabled || !this.ctx) return;
        try {
            const pitchMult = 1 + pitchIndex * 0.15;
            const t = this.ctx.currentTime;
            // Primary tone
            const osc1 = this.ctx.createOscillator();
            const gain1 = this.ctx.createGain();
            osc1.type = 'triangle';
            osc1.frequency.setValueAtTime(440 * pitchMult, t);
            osc1.frequency.exponentialRampToValueAtTime(280 * pitchMult, t + 0.14);
            gain1.gain.setValueAtTime(0.35, t);
            gain1.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

            // High glass ping overtone
            const osc2 = this.ctx.createOscillator();
            const gain2 = this.ctx.createGain();
            osc2.type = 'sine';
            osc2.frequency.setValueAtTime(1420 * pitchMult, t);
            gain2.gain.setValueAtTime(0.2, t);
            gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

            osc1.connect(gain1);
            gain1.connect(this.ctx.destination);
            osc2.connect(gain2);
            gain2.connect(this.ctx.destination);

            osc1.start(t);
            osc1.stop(t + 0.16);
            osc2.start(t);
            osc2.stop(t + 0.09);
        } catch (e) { }
    }

    // Tube Completed Sound - Ascending sweet harmonic chime
    playTubeComplete() {
        if (!this.soundEnabled || !this.ctx) return;
        try {
            const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
            notes.forEach((freq, i) => {
                const t = this.ctx.currentTime + i * 0.07;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();

                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, t);

                gain.gain.setValueAtTime(0.25, t);
                gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

                osc.connect(gain);
                gain.connect(this.ctx.destination);

                osc.start(t);
                osc.stop(t + 0.36);
            });
        } catch (e) { }
    }

    // Star Pop Sound
    playStar(index = 0) {
        if (!this.soundEnabled || !this.ctx) return;
        try {
            const freqs = [880, 1174.66, 1567.98]; // A5, D6, G6
            const freq = freqs[index % freqs.length] || 1200;
            const t = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, t);
            osc.frequency.exponentialRampToValueAtTime(freq * 1.05, t + 0.2);

            gain.gain.setValueAtTime(0.3, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(t);
            osc.stop(t + 0.42);
        } catch (e) { }
    }

    // Level Win Fanfare
    playLevelWin() {
        if (!this.soundEnabled || !this.ctx) return;
        try {
            const chord = [
                { f: 523.25, d: 0.12, del: 0 },
                { f: 659.25, d: 0.12, del: 0.1 },
                { f: 783.99, d: 0.12, del: 0.2 },
                { f: 1046.50, d: 0.4, del: 0.32 },
                { f: 1318.51, d: 0.6, del: 0.42 }
            ];

            chord.forEach(item => {
                const t = this.ctx.currentTime + item.del;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();

                osc.type = 'triangle';
                osc.frequency.setValueAtTime(item.f, t);

                gain.gain.setValueAtTime(0.28, t);
                gain.gain.exponentialRampToValueAtTime(0.001, t + item.d);

                osc.connect(gain);
                gain.connect(this.ctx.destination);

                osc.start(t);
                osc.stop(t + item.d + 0.05);
            });
        } catch (e) { }
    }

    // UI Click Sound
    playClick() {
        if (!this.soundEnabled || !this.ctx) return;
        try {
            const t = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(800, t);
            osc.frequency.exponentialRampToValueAtTime(400, t + 0.04);

            gain.gain.setValueAtTime(0.2, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(t);
            osc.stop(t + 0.06);
        } catch (e) { }
    }

    // Invalid Move / Error Wobble
    playError() {
        if (!this.soundEnabled || !this.ctx) return;
        try {
            const t = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(180, t);
            osc.frequency.setValueAtTime(140, t + 0.06);

            gain.gain.setValueAtTime(0.18, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(t);
            osc.stop(t + 0.18);
        } catch (e) { }
    }

    // Wheel Spin Tick Sound
    playTick() {
        if (!this.soundEnabled || !this.ctx) return;
        try {
            const t = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(1100, t);
            osc.frequency.exponentialRampToValueAtTime(300, t + 0.02);

            gain.gain.setValueAtTime(0.15, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.025);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(t);
            osc.stop(t + 0.03);
        } catch (e) { }
    }

    // Coin Pickup Sound
    playCoin() {
        if (!this.soundEnabled || !this.ctx) return;
        try {
            const t = this.ctx.currentTime;
            [987.77, 1318.51].forEach((freq, idx) => {
                const noteTime = t + idx * 0.07;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();

                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, noteTime);

                gain.gain.setValueAtTime(0.25, noteTime);
                gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.2);

                osc.connect(gain);
                gain.connect(this.ctx.destination);

                osc.start(noteTime);
                osc.stop(noteTime + 0.22);
            });
        } catch (e) { }
    }

    // Calming Procedural Background Music
    startBgm() {
        if (this.bgmTimer) return;
        // A peaceful pentatonic music loop in C Major (C, D, E, G, A)
        const melody = [
            261.63, 329.63, 392.00, 523.25,
            329.63, 392.00, 440.00, 392.00,
            293.66, 349.23, 440.00, 523.25,
            392.00, 329.63, 293.66, 261.63
        ];

        this.bgmTimer = setInterval(() => {
            if (!this.musicEnabled || !this.ctx) return;
            try {
                const freq = melody[this.bgmStep % melody.length];
                this.bgmStep++;
                const t = this.ctx.currentTime;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();

                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, t);

                // Very soft ambient electric piano / bell feel
                gain.gain.setValueAtTime(0.035, t);
                gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.7);

                osc.connect(gain);
                gain.connect(this.ctx.destination);

                osc.start(t);
                osc.stop(t + 0.75);
            } catch (e) { }
        }, 480);
    }

    stopBgm() {
        if (this.bgmTimer) {
            clearInterval(this.bgmTimer);
            this.bgmTimer = null;
        }
    }
}

window.soundManager = new SoundManager();

