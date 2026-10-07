/**
 * Glow Air Hockey / Glow Pong Ball - Audio System
 * Supports HTML5 Audio elements with procedural Web Audio API fallback
 */

class SoundManager {
    constructor() {
        this.muted = false;
        this.audioCtx = null;
        this.sounds = {};
        this.unlocked = false;
        
        this.init();
    }

    init() {
        // Prepare HTML5 audio clips
        const soundFiles = {
            hit_mallet: 'media/hit_mallet.wav',
            hit_wall: 'media/hit_wall.wav',
            goal: 'media/goal.wav',
            win: 'media/win.wav',
            lose: 'media/lose.wav',
            button: 'media/button.wav'
        };

        for (const [key, path] of Object.entries(soundFiles)) {
            const audio = new Audio();
            audio.src = path;
            audio.preload = 'auto';
            this.sounds[key] = audio;
        }

        // Setup user gesture unlock for Web Audio API
        const unlock = () => {
            if (!this.audioCtx) {
                const AudioContext = window.AudioContext || window.webkitAudioContext;
                if (AudioContext) {
                    this.audioCtx = new AudioContext();
                }
            }
            if (this.audioCtx && this.audioCtx.state === 'suspended') {
                this.audioCtx.resume();
            }
            this.unlocked = true;
            window.removeEventListener('pointerdown', unlock);
            window.removeEventListener('keydown', unlock);
        };

        window.addEventListener('pointerdown', unlock, { once: true });
        window.addEventListener('keydown', unlock, { once: true });
    }

    toggleMute() {
        this.muted = !this.muted;
        return this.muted;
    }

    play(name, volume = 1.0) {
        if (this.muted) return;

        // Try playing native HTML5 audio
        try {
            const baseAudio = this.sounds[name];
            if (baseAudio && baseAudio.readyState >= 2) {
                const clone = baseAudio.cloneNode();
                clone.volume = Math.max(0, Math.min(1, volume));
                clone.play().catch(() => {
                    this.playSynthesized(name, volume);
                });
                return;
            }
        } catch (e) {
            // fallback to synth
        }

        this.playSynthesized(name, volume);
    }

    playSynthesized(name, volume = 1.0) {
        if (this.muted || !this.audioCtx) return;
        if (this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }

        const now = this.audioCtx.currentTime;
        const masterGain = this.audioCtx.createGain();
        masterGain.gain.setValueAtTime(volume * 0.8, now);
        masterGain.connect(this.audioCtx.destination);

        if (name === 'hit_mallet') {
            // Punchy mallet thud
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(320, now);
            osc.frequency.exponentialRampToValueAtTime(70, now + 0.12);
            gain.gain.setValueAtTime(0.8, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
            osc.connect(gain);
            gain.connect(masterGain);
            osc.start(now);
            osc.stop(now + 0.12);
        } else if (name === 'hit_wall') {
            // Sharp table rim rebound
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(640, now);
            osc.frequency.exponentialRampToValueAtTime(180, now + 0.08);
            gain.gain.setValueAtTime(0.6, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
            osc.connect(gain);
            gain.connect(masterGain);
            osc.start(now);
            osc.stop(now + 0.08);
        } else if (name === 'goal') {
            // Upbeat neon fanfare
            const freqs = [523.25, 659.25, 783.99, 1046.50];
            freqs.forEach((f, idx) => {
                const osc = this.audioCtx.createOscillator();
                const gain = this.audioCtx.createGain();
                const noteTime = now + idx * 0.14;
                osc.type = 'sine';
                osc.frequency.setValueAtTime(f, noteTime);
                gain.gain.setValueAtTime(0.5, noteTime);
                gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.35);
                osc.connect(gain);
                gain.connect(masterGain);
                osc.start(noteTime);
                osc.stop(noteTime + 0.35);
            });
        } else if (name === 'win') {
            // Victorious ascending chords
            const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51];
            notes.forEach((f, idx) => {
                const osc = this.audioCtx.createOscillator();
                const gain = this.audioCtx.createGain();
                const noteTime = now + idx * 0.16;
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(f, noteTime);
                gain.gain.setValueAtTime(0.6, noteTime);
                gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.45);
                osc.connect(gain);
                gain.connect(masterGain);
                osc.start(noteTime);
                osc.stop(noteTime + 0.45);
            });
        } else if (name === 'lose') {
            // Descending defeat jingle
            const notes = [783.99, 622.25, 587.33, 523.25];
            notes.forEach((f, idx) => {
                const osc = this.audioCtx.createOscillator();
                const gain = this.audioCtx.createGain();
                const noteTime = now + idx * 0.2;
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(f, noteTime);
                gain.gain.setValueAtTime(0.3, noteTime);
                gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.35);
                osc.connect(gain);
                gain.connect(masterGain);
                osc.start(noteTime);
                osc.stop(noteTime + 0.35);
            });
        } else if (name === 'button') {
            // UI click blip
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(1200, now);
            gain.gain.setValueAtTime(0.3, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
            osc.connect(gain);
            gain.connect(masterGain);
            osc.start(now);
            osc.stop(now + 0.04);
        }
    }
}

window.SoundManager = SoundManager;

