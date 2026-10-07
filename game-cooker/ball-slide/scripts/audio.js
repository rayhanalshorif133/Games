/**
 * Ball Slide - Audio Manager
 * Dual-engine: Procedural Web Audio API synthesis + HTML5 Audio fallback
 */
class AudioManager {
    constructor() {
        this.ctx = null;
        this.enabled = true;
        this.sounds = {};
        
        // Load mute preference
        const savedMute = localStorage.getItem('ballslide_muted');
        if (savedMute !== null) {
            this.enabled = savedMute !== 'true';
        }
        
        this.initFallbackAudio();
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

    initFallbackAudio() {
        const soundFiles = ['score', 'hit', 'powerup', 'click', 'slowmo'];
        soundFiles.forEach(name => {
            const audio = new Audio(`media/${name}.wav`);
            audio.preload = 'auto';
            this.sounds[name] = audio;
        });
    }

    toggleMute() {
        this.enabled = !this.enabled;
        localStorage.setItem('ballslide_muted', (!this.enabled).toString());
        return this.enabled;
    }

    // 1. Score Chime (Bright resonant marimba chime)
    playScore() {
        if (!this.enabled) return;
        this.initContext();
        if (this.ctx) {
            const t = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            
            osc.type = 'triangle';
            // Pentatonic scale variation or high A5
            osc.frequency.setValueAtTime(880, t);
            osc.frequency.exponentialRampToValueAtTime(1320, t + 0.12);
            
            gain.gain.setValueAtTime(0.3, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
            
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            
            osc.start(t);
            osc.stop(t + 0.25);
        } else if (this.sounds.score) {
            this.sounds.score.currentTime = 0;
            this.sounds.score.play().catch(() => {});
        }
    }

    // 2. Hit / Explosion (Punchy low sub + noise shatter)
    playHit() {
        if (!this.enabled) return;
        this.initContext();
        if (this.ctx) {
            const t = this.ctx.currentTime;
            
            // Sub boom
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(160, t);
            osc.frequency.exponentialRampToValueAtTime(20, t + 0.35);
            
            gain.gain.setValueAtTime(0.6, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
            
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(t);
            osc.stop(t + 0.4);

            // Noise burst
            const bufferSize = this.ctx.sampleRate * 0.2;
            const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }
            const noise = this.ctx.createBufferSource();
            noise.buffer = buffer;
            const noiseGain = this.ctx.createGain();
            noiseGain.gain.setValueAtTime(0.4, t);
            noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
            noise.connect(noiseGain);
            noiseGain.connect(this.ctx.destination);
            noise.start(t);
        } else if (this.sounds.hit) {
            this.sounds.hit.currentTime = 0;
            this.sounds.hit.play().catch(() => {});
        }
    }

    // 3. Power-up Collect (Ascending sparkle arpeggio)
    playPowerup() {
        if (!this.enabled) return;
        this.initContext();
        if (this.ctx) {
            const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
            notes.forEach((freq, idx) => {
                const t = this.ctx.currentTime + idx * 0.06;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, t);
                gain.gain.setValueAtTime(0.2, t);
                gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(t);
                osc.stop(t + 0.18);
            });
        } else if (this.sounds.powerup) {
            this.sounds.powerup.currentTime = 0;
            this.sounds.powerup.play().catch(() => {});
        }
    }

    // 4. Slow-Mo Activate (Low atmospheric whoosh)
    playSlowMo() {
        if (!this.enabled) return;
        this.initContext();
        if (this.ctx) {
            const t = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(240, t);
            osc.frequency.exponentialRampToValueAtTime(60, t + 0.5);
            gain.gain.setValueAtTime(0.4, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(t);
            osc.stop(t + 0.5);
        } else if (this.sounds.slowmo) {
            this.sounds.slowmo.currentTime = 0;
            this.sounds.slowmo.play().catch(() => {});
        }
    }

    // 5. Gem Collect (Crisp high coin ping)
    playGem() {
        if (!this.enabled) return;
        this.initContext();
        if (this.ctx) {
            const t = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(1400, t);
            osc.frequency.exponentialRampToValueAtTime(2100, t + 0.08);
            gain.gain.setValueAtTime(0.25, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(t);
            osc.stop(t + 0.15);
        }
    }

    // 6. UI Click / Tap
    playClick() {
        if (!this.enabled) return;
        this.initContext();
        if (this.ctx) {
            const t = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(900, t);
            gain.gain.setValueAtTime(0.2, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(t);
            osc.stop(t + 0.06);
        } else if (this.sounds.click) {
            this.sounds.click.currentTime = 0;
            this.sounds.click.play().catch(() => {});
        }
    }
}

window.AudioManager = AudioManager;

