/**
 * Procedural Web Audio API Sound System for 2D Soccer
 * Self-contained without external audio dependencies
 */
class AudioManager {
    constructor() {
        this.ctx = null;
        this.muted = false;
        this.ambientGain = null;
        this.isAmbientPlaying = false;
        this.initOnInteraction = this.initOnInteraction.bind(this);

        // Load mute state from localStorage
        try {
            this.muted = localStorage.getItem('soccer_sound_muted') === 'true';
        } catch (e) {}

        window.addEventListener('click', this.initOnInteraction, { once: false });
        window.addEventListener('keydown', this.initOnInteraction, { once: false });
        window.addEventListener('touchstart', this.initOnInteraction, { once: false });
    }

    initContext() {
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

    initOnInteraction() {
        this.initContext();
    }

    toggleMute() {
        this.muted = !this.muted;
        try {
            localStorage.setItem('soccer_sound_muted', this.muted);
        } catch (e) {}
        return this.muted;
    }

    // Ball kick sound: deep punchy impact
    playKick(power = 1.0) {
        if (this.muted) return;
        this.initContext();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        const startFreq = 160 + Math.min(power * 40, 80);
        osc.frequency.setValueAtTime(startFreq, now);
        osc.frequency.exponentialRampToValueAtTime(35, now + 0.12);

        gain.gain.setValueAtTime(0.4 * Math.min(power, 1.5), now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.15);

        // Click transient
        this.playPop(now, 0.2);
    }

    // High frequency pop transient for solid contact
    playPop(time, volume = 0.2) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(600, time);
        osc.frequency.exponentialRampToValueAtTime(80, time + 0.03);
        gain.gain.setValueAtTime(volume, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.035);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(time);
        osc.stop(time + 0.04);
    }

    // Paddle bounce: snappy wooden / rubber hit
    playPaddleHit(speed = 1.0) {
        if (this.muted) return;
        this.initContext();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        const freq = 320 + Math.min(speed * 30, 200);
        osc.frequency.setValueAtTime(freq, now);
        osc.frequency.exponentialRampToValueAtTime(70, now + 0.08);

        const vol = Math.min(0.5, 0.2 + speed * 0.05);
        gain.gain.setValueAtTime(vol, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.1);
    }

    // Wall bounce sound
    playWallBounce() {
        if (this.muted) return;
        this.initContext();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.exponentialRampToValueAtTime(50, now + 0.07);

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.09);
    }

    // Goal post metal clink: ringing aluminum crossbar
    playPostClang() {
        if (this.muted) return;
        this.initContext();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const freqs = [980, 1420, 2150];

        freqs.forEach((f, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(f, now);

            gain.gain.setValueAtTime(0.18 / (i + 1), now);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.5 + i * 0.1);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now);
            osc.stop(now + 0.7);
        });
    }

    // Referee whistle with realistic twin-pitch modulation
    playWhistle(isGoal = false) {
        if (this.muted) return;
        this.initContext();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const duration = isGoal ? 0.9 : 0.25;

        // Twin oscillators for whistle harmonic beat
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        // LFO for vibrato / trill
        const lfo = this.ctx.createOscillator();
        const lfoGain = this.ctx.createGain();

        lfo.frequency.setValueAtTime(24, now);
        lfoGain.gain.setValueAtTime(80, now);

        lfo.connect(osc1.frequency);
        lfo.connect(osc2.frequency);

        osc1.type = 'sine';
        osc2.type = 'sine';
        osc1.frequency.setValueAtTime(2600, now);
        osc2.frequency.setValueAtTime(2850, now);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.3, now + 0.03);
        gain.gain.setValueAtTime(0.3, now + duration - 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(this.ctx.destination);

        lfo.start(now);
        osc1.start(now);
        osc2.start(now);

        lfo.stop(now + duration);
        osc1.stop(now + duration);
        osc2.stop(now + duration);

        // If not a goal, do a second quick chirp
        if (!isGoal) {
            setTimeout(() => {
                if (!this.muted && this.ctx) {
                    const t = this.ctx.currentTime;
                    const o = this.ctx.createOscillator();
                    const g = this.ctx.createGain();
                    o.type = 'sine';
                    o.frequency.setValueAtTime(2700, t);
                    g.gain.setValueAtTime(0.25, t);
                    g.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
                    o.connect(g);
                    g.connect(this.ctx.destination);
                    o.start(t);
                    o.stop(t + 0.2);
                }
            }, 180);
        }
    }

    // Crowd stadium cheering & roar
    playCheer(isGoal = true) {
        if (this.muted) return;
        this.initContext();
        if (!this.ctx) return;

        const duration = isGoal ? 2.5 : 1.2;
        const bufferSize = this.ctx.sampleRate * duration;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);

        // Pink noise approximation
        let b0 = 0, b1 = 0, b2 = 0;
        for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            b0 = 0.99 * b0 + white * 0.05;
            b1 = 0.95 * b1 + white * 0.1;
            b2 = 0.85 * b2 + white * 0.25;
            data[i] = (b0 + b1 + b2) * 0.4;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(800, this.ctx.currentTime);
        filter.Q.setValueAtTime(1.2, this.ctx.currentTime);

        const gain = this.ctx.createGain();
        const now = this.ctx.currentTime;

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.35, now + 0.4);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        noise.start(now);
    }

    // Countdown beeps
    playCountdown(isGo = false) {
        if (this.muted) return;
        this.initContext();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = isGo ? 'triangle' : 'sine';
        osc.frequency.setValueAtTime(isGo ? 880 : 520, now);

        gain.gain.setValueAtTime(isGo ? 0.35 : 0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + (isGo ? 0.45 : 0.2));

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + (isGo ? 0.5 : 0.22));
    }

    // UI Click sound
    playClick() {
        if (this.muted) return;
        this.initContext();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(650, now);
        osc.frequency.exponentialRampToValueAtTime(400, now + 0.04);

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.06);
    }
}

window.audioManager = new AudioManager();

