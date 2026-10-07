/**
 * Audio Engine for Attack to Ship
 * Supports Web Audio API synthesis for zero latency + WAV fallback
 */
class SoundEngine {
    constructor() {
        this.ctx = null;
        this.muted = false;
        this.initialized = false;
        this.audioCache = {};
        
        // List of WAV sound files
        this.soundFiles = {
            sonar: 'media/sonar.wav',
            bombDrop: 'media/bomb_drop.wav',
            torpedoLaunch: 'media/torpedo_launch.wav',
            explosion: 'media/explosion.wav',
            shieldHit: 'media/shield_hit.wav',
            powerup: 'media/powerup.wav',
            gameover: 'media/gameover.wav'
        };
        
        this.preloadAudio();
    }

    init() {
        if (this.initialized) return;
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                this.ctx = new AudioContext();
            }
            this.initialized = true;
        } catch (e) {
            console.warn('Web Audio API not supported, using HTML5 Audio fallback', e);
        }
    }

    preloadAudio() {
        for (const [key, path] of Object.entries(this.soundFiles)) {
            const audio = new Audio();
            audio.src = path;
            audio.preload = 'auto';
            this.audioCache[key] = audio;
        }
    }

    unlock() {
        this.init();
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    playFile(key, volume = 1.0) {
        if (this.muted) return;
        const base = this.audioCache[key];
        if (base) {
            try {
                const clone = base.cloneNode();
                clone.volume = Math.max(0, Math.min(1, volume));
                clone.play().catch(() => {});
            } catch (e) {}
        }
    }

    playSonar() {
        this.unlock();
        if (this.muted) return;
        if (!this.ctx) {
            this.playFile('sonar', 0.6);
            return;
        }
        
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1150, now);
        
        gain.gain.setValueAtTime(0.01, now);
        gain.gain.linearRampToValueAtTime(0.35, now + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        
        osc.start(now);
        osc.stop(now + 1.2);
    }

    playBombDrop() {
        this.unlock();
        if (this.muted) return;
        if (!this.ctx) {
            this.playFile('bombDrop', 0.7);
            return;
        }

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(580, now);
        osc.frequency.exponentialRampToValueAtTime(180, now + 0.35);

        gain.gain.setValueAtTime(0.4, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.35);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.35);
    }

    playTorpedoLaunch() {
        this.unlock();
        if (this.muted) return;
        if (!this.ctx) {
            this.playFile('torpedoLaunch', 0.5);
            return;
        }

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(540, now + 0.28);

        gain.gain.setValueAtTime(0.25, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.28);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.28);
    }

    playExplosion(isLarge = false) {
        this.unlock();
        if (this.muted) return;
        if (!this.ctx) {
            this.playFile('explosion', isLarge ? 1.0 : 0.7);
            return;
        }

        const now = this.ctx.currentTime;
        const duration = isLarge ? 0.8 : 0.5;
        const bufferSize = this.ctx.sampleRate * duration;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);

        // Brown noise / explosion burst
        let lastOut = 0.0;
        for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            data[i] = (lastOut + (0.02 * white)) / 1.02;
            lastOut = data[i];
            data[i] *= 3.5;
        }

        const noiseNode = this.ctx.createBufferSource();
        noiseNode.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(isLarge ? 450 : 650, now);
        filter.frequency.exponentialRampToValueAtTime(80, now + duration);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(isLarge ? 0.9 : 0.6, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + duration);

        noiseNode.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        noiseNode.start(now);
    }

    playShieldHit() {
        this.unlock();
        if (this.muted) return;
        if (!this.ctx) {
            this.playFile('shieldHit', 0.8);
            return;
        }

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(900, now);
        osc.frequency.linearRampToValueAtTime(450, now + 0.3);

        gain.gain.setValueAtTime(0.5, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.35);
    }

    playPowerUp() {
        this.unlock();
        if (this.muted) return;
        if (!this.ctx) {
            this.playFile('powerup', 0.8);
            return;
        }

        const now = this.ctx.currentTime;
        const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
        notes.forEach((freq, idx) => {
            const startTime = now + idx * 0.08;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, startTime);

            gain.gain.setValueAtTime(0.3, startTime);
            gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.15);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(startTime);
            osc.stop(startTime + 0.15);
        });
    }

    playGameOver() {
        this.unlock();
        if (this.muted) return;
        if (!this.ctx) {
            this.playFile('gameover', 0.8);
            return;
        }

        const now = this.ctx.currentTime;
        const notes = [440, 392, 349.23, 293.66];
        notes.forEach((freq, idx) => {
            const startTime = now + idx * 0.22;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(freq, startTime);

            gain.gain.setValueAtTime(0.35, startTime);
            gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.25);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(startTime);
            osc.stop(startTime + 0.25);
        });
    }
}

window.soundEngine = new SoundEngine();

