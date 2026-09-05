/* Bundle generated for offline and file:// execution */
/* --- scripts/storage.js --- */
/**
 * storage.js - Local data persistence for Missile Escape
 */

const STORAGE_KEY = 'missile_escape_save_v1';

const DEFAULT_DATA = {
    highScore: 0,
    coins: 250, // Starting bonus currency
    selectedShip: 'cx16', // 'cx16', 'dko', 'wo84'
    ships: {
        cx16: { unlocked: true, level: 1 },
        dko: { unlocked: false, level: 1, unlockCost: 400 },
        wo84: { unlocked: false, level: 1, unlockCost: 800 }
    },
    upgrades: {
        speed: 1,      // Max 5
        agility: 1,    // Max 5
        flares: 1,     // Max 5 (starts with 3, +1 per upgrade)
        magnet: 1      // Max 5
    },
    settings: {
        soundVolume: 0.8,
        musicVolume: 0.5,
        soundEnabled: true,
        musicEnabled: true,
        controlType: 'joystick' // 'joystick', 'drag', 'keyboard'
    },
    stats: {
        gamesPlayed: 0,
        missilesDodged: 0,
        nearMisses: 0,
        flaresUsed: 0
    }
};

class StorageManager {
    constructor() {
        this.data = this.load();
    }

    load() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return JSON.parse(JSON.stringify(DEFAULT_DATA));
            const parsed = JSON.parse(raw);
            return {
                ...DEFAULT_DATA,
                ...parsed,
                ships: { ...DEFAULT_DATA.ships, ...(parsed.ships || {}) },
                upgrades: { ...DEFAULT_DATA.upgrades, ...(parsed.upgrades || {}) },
                settings: { ...DEFAULT_DATA.settings, ...(parsed.settings || {}) },
                stats: { ...DEFAULT_DATA.stats, ...(parsed.stats || {}) }
            };
        } catch (e) {
            console.warn('Could not read from localStorage, using defaults:', e);
            return JSON.parse(JSON.stringify(DEFAULT_DATA));
        }
    }

    save() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
        } catch (e) {
            console.warn('Could not save to localStorage:', e);
        }
    }

    getHighScore() {
        return this.data.highScore || 0;
    }

    setHighScore(score) {
        if (score > (this.data.highScore || 0)) {
            this.data.highScore = Math.floor(score);
            this.save();
            return true;
        }
        return false;
    }

    getCoins() {
        return this.data.coins || 0;
    }

    addCoins(amount) {
        this.data.coins = Math.max(0, (this.data.coins || 0) + amount);
        this.save();
        return this.data.coins;
    }

    spendCoins(amount) {
        if ((this.data.coins || 0) >= amount) {
            this.data.coins -= amount;
            this.save();
            return true;
        }
        return false;
    }

    getSelectedShip() {
        return this.data.selectedShip || 'cx16';
    }

    setSelectedShip(shipId) {
        if (this.data.ships[shipId] && this.data.ships[shipId].unlocked) {
            this.data.selectedShip = shipId;
            this.save();
            return true;
        }
        return false;
    }

    upgradeShip(shipId) {
        const ship = this.data.ships[shipId];
        if (!ship) return false;
        if (ship.level < 3) {
            const cost = ship.level === 1 ? 500 : 1000;
            if (this.spendCoins(cost)) {
                ship.level += 1;
                this.save();
                return true;
            }
        }
        return false;
    }

    unlockShip(shipId) {
        const ship = this.data.ships[shipId];
        if (!ship || ship.unlocked) return false;
        const cost = ship.unlockCost || 500;
        if (this.spendCoins(cost)) {
            ship.unlocked = true;
            this.data.selectedShip = shipId;
            this.save();
            return true;
        }
        return false;
    }

    getUpgradeLevel(type) {
        return this.data.upgrades[type] || 1;
    }

    getUpgradeCost(type) {
        const lvl = this.getUpgradeLevel(type);
        if (lvl >= 5) return null;
        return lvl * 150;
    }

    buyUpgrade(type) {
        const currentLvl = this.getUpgradeLevel(type);
        if (currentLvl >= 5) return false;
        const cost = this.getUpgradeCost(type);
        if (cost && this.spendCoins(cost)) {
            this.data.upgrades[type] = currentLvl + 1;
            this.save();
            return true;
        }
        return false;
    }

    recordStats(gameStats) {
        if (!gameStats) return;
        this.data.stats.gamesPlayed = (this.data.stats.gamesPlayed || 0) + 1;
        this.data.stats.missilesDodged = (this.data.stats.missilesDodged || 0) + (gameStats.missilesDodged || 0);
        this.data.stats.nearMisses = (this.data.stats.nearMisses || 0) + (gameStats.nearMisses || 0);
        this.data.stats.flaresUsed = (this.data.stats.flaresUsed || 0) + (gameStats.flaresUsed || 0);
        this.save();
    }
}

const storage = new StorageManager();


/* --- scripts/audio.js --- */
/**
 * audio.js - Web Audio API procedural sound synthesizer & music generator
 */

class SoundEngine {
    constructor() {
        this.ctx = null;
        this.masterGain = null;
        this.sfxGain = null;
        this.musicGain = null;
        this.isMuted = false;
        this.isMusicPlaying = false;
        this.musicInterval = null;
        this.noiseBuffer = null;
        this.initialized = false;
        this.volume = 0.8;
        this.musicVolume = 0.5;

        // Engine rumble node references
        this.engineOsc = null;
        this.engineGain = null;
    }

    init() {
        if (this.initialized) return;
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContext();

            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
            this.masterGain.connect(this.ctx.destination);

            this.sfxGain = this.ctx.createGain();
            this.sfxGain.gain.setValueAtTime(1.0, this.ctx.currentTime);
            this.sfxGain.connect(this.masterGain);

            this.musicGain = this.ctx.createGain();
            this.musicGain.gain.setValueAtTime(this.musicVolume, this.ctx.currentTime);
            this.musicGain.connect(this.masterGain);

            this.createNoiseBuffer();
            this.setupEngineSound();
            this.initialized = true;
        } catch (e) {
            console.warn('Web Audio API not supported or blocked:', e);
        }
    }

    resume() {
        if (!this.initialized) this.init();
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    createNoiseBuffer() {
        if (!this.ctx) return;
        const bufferSize = this.ctx.sampleRate * 2;
        this.noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const output = this.noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }
    }

    setSoundVolume(val) {
        this.volume = Math.max(0, Math.min(1, val));
        if (this.masterGain && this.ctx) {
            this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
        }
    }

    setMusicVolume(val) {
        this.musicVolume = Math.max(0, Math.min(1, val));
        if (this.musicGain && this.ctx) {
            this.musicGain.gain.setValueAtTime(this.musicVolume, this.ctx.currentTime);
        }
    }

    setupEngineSound() {
        if (!this.ctx) return;
        try {
            this.engineOsc = this.ctx.createOscillator();
            this.engineOsc.type = 'sawtooth';
            this.engineOsc.frequency.setValueAtTime(45, this.ctx.currentTime);

            const filter = this.ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(140, this.ctx.currentTime);

            this.engineGain = this.ctx.createGain();
            this.engineGain.gain.setValueAtTime(0, this.ctx.currentTime);

            this.engineOsc.connect(filter);
            filter.connect(this.engineGain);
            this.engineGain.connect(this.sfxGain);
            this.engineOsc.start();
        } catch (e) {
            console.warn('Engine sound init warning:', e);
        }
    }

    updateEngineSound(active, speedRatio = 1.0) {
        if (!this.engineGain || !this.ctx) return;
        const targetGain = active ? 0.08 : 0.0;
        const targetFreq = 40 + (speedRatio * 35);
        const now = this.ctx.currentTime;
        this.engineGain.gain.setTargetAtTime(targetGain, now, 0.08);
        this.engineOsc.frequency.setTargetAtTime(targetFreq, now, 0.08);
    }

    playClick() {
        if (!this.ctx) return;
        this.resume();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(400, now + 0.05);

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.05);
    }

    playWarning() {
        if (!this.ctx) return;
        this.resume();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.setValueAtTime(1200, now + 0.05);

        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.12);
    }

    playMissileLaunch() {
        if (!this.ctx) return;
        this.resume();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(950, now + 0.15);
        osc.frequency.exponentialRampToValueAtTime(600, now + 0.35);

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.005, now + 0.35);

        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.35);
    }

    playExplosion(isBig = false) {
        if (!this.ctx || !this.noiseBuffer) return;
        this.resume();
        const now = this.ctx.currentTime;
        const dur = isBig ? 0.9 : 0.55;

        // Noise element
        const noise = this.ctx.createBufferSource();
        noise.buffer = this.noiseBuffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(isBig ? 900 : 700, now);
        filter.frequency.exponentialRampToValueAtTime(60, now + dur);

        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(isBig ? 0.8 : 0.5, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.005, now + dur);

        noise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(this.sfxGain);
        noise.start(now);
        noise.stop(now + dur);

        // Sub-bass thump
        const sub = this.ctx.createOscillator();
        const subGain = this.ctx.createGain();
        sub.type = 'sine';
        sub.frequency.setValueAtTime(isBig ? 120 : 100, now);
        sub.frequency.exponentialRampToValueAtTime(25, now + dur * 0.8);

        subGain.gain.setValueAtTime(isBig ? 0.7 : 0.45, now);
        subGain.gain.exponentialRampToValueAtTime(0.001, now + dur * 0.8);

        sub.connect(subGain);
        subGain.connect(this.sfxGain);
        sub.start(now);
        sub.stop(now + dur * 0.8);
    }

    playNearMiss() {
        if (!this.ctx) return;
        this.resume();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(1400, now + 0.08);
        osc.frequency.exponentialRampToValueAtTime(300, now + 0.22);

        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.22);
    }

    playCoin() {
        if (!this.ctx) return;
        this.resume();
        const now = this.ctx.currentTime;
        const notes = [987.77, 1318.51]; // B5, E6
        notes.forEach((freq, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const startTime = now + (i * 0.06);

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, startTime);

            gain.gain.setValueAtTime(0.25, startTime);
            gain.gain.exponentialRampToValueAtTime(0.005, startTime + 0.12);

            osc.connect(gain);
            gain.connect(this.sfxGain);
            osc.start(startTime);
            osc.stop(startTime + 0.12);
        });
    }

    playFlare() {
        if (!this.ctx) return;
        this.resume();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(250, now);
        osc.frequency.exponentialRampToValueAtTime(750, now + 0.08);
        osc.frequency.exponentialRampToValueAtTime(180, now + 0.25);

        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.005, now + 0.25);

        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.25);
    }

    playShieldHit() {
        if (!this.ctx) return;
        this.resume();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(1200, now);
        osc.frequency.exponentialRampToValueAtTime(150, now + 0.3);

        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.005, now + 0.3);

        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.3);
    }

    playEMP() {
        if (!this.ctx) return;
        this.resume();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(1800, now);
        osc.frequency.exponentialRampToValueAtTime(45, now + 0.9);

        gain.gain.setValueAtTime(0.5, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);

        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.9);
    }

    playFanfare() {
        if (!this.ctx) return;
        this.resume();
        const now = this.ctx.currentTime;
        // Ascending triumphant fanfare chords (C5, E5, G5, C6)
        const notes = [523.25, 659.25, 783.99, 1046.50];
        notes.forEach((freq, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const startTime = now + (i * 0.075);

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, startTime);
            osc.frequency.exponentialRampToValueAtTime(freq * 1.04, startTime + 0.16);

            gain.gain.setValueAtTime(0.28, startTime);
            gain.gain.exponentialRampToValueAtTime(0.005, startTime + 0.18);

            osc.connect(gain);
            gain.connect(this.sfxGain);
            osc.start(startTime);
            osc.stop(startTime + 0.18);
        });
    }

    playBoost() {
        if (!this.ctx) return;
        this.resume();
        const now = this.ctx.currentTime;

        // Sonic boom bass punch
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(260, now);
        osc.frequency.exponentialRampToValueAtTime(50, now + 0.35);

        gain.gain.setValueAtTime(0.55, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.4);

        // Afterburner jet whoosh
        if (this.noiseBuffer) {
            const noise = this.ctx.createBufferSource();
            noise.buffer = this.noiseBuffer;
            const filter = this.ctx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.setValueAtTime(900, now);
            filter.frequency.exponentialRampToValueAtTime(2600, now + 0.15);
            filter.frequency.exponentialRampToValueAtTime(350, now + 0.7);

            const nGain = this.ctx.createGain();
            nGain.gain.setValueAtTime(0.45, now);
            nGain.gain.exponentialRampToValueAtTime(0.01, now + 0.75);

            noise.connect(filter);
            filter.connect(nGain);
            nGain.connect(this.sfxGain);
            noise.start(now);
            noise.stop(now + 0.75);
        }
    }

    startMusic() {
        if (this.isMusicPlaying) return;
        this.resume();
        this.isMusicPlaying = true;

        // Procedural retro-futuristic synth bass + arpeggio loop
        const bassLine = [55, 55, 65.41, 73.42, 55, 55, 82.41, 73.42]; // A1, C2, D2, E2
        const arpNotes = [220, 261.63, 329.63, 392.00, 440, 523.25, 659.25, 783.99]; // A Minor Pentatonic
        let step = 0;

        const playNote = () => {
            if (!this.isMusicPlaying || !this.ctx) return;
            const now = this.ctx.currentTime;

            // Bass note every 2 steps
            if (step % 2 === 0) {
                const bassFreq = bassLine[(step / 2) % bassLine.length];
                const bOsc = this.ctx.createOscillator();
                const bGain = this.ctx.createGain();
                bOsc.type = 'triangle';
                bOsc.frequency.setValueAtTime(bassFreq, now);

                bGain.gain.setValueAtTime(0.22, now);
                bGain.gain.exponentialRampToValueAtTime(0.01, now + 0.24);

                bOsc.connect(bGain);
                bGain.connect(this.musicGain);
                bOsc.start(now);
                bOsc.stop(now + 0.25);
            }

            // Arpeggio note
            const arpFreq = arpNotes[(step * 3) % arpNotes.length];
            const aOsc = this.ctx.createOscillator();
            const aGain = this.ctx.createGain();
            aOsc.type = 'sine';
            aOsc.frequency.setValueAtTime(arpFreq, now);

            aGain.gain.setValueAtTime(0.12, now);
            aGain.gain.exponentialRampToValueAtTime(0.005, now + 0.12);

            aOsc.connect(aGain);
            aGain.connect(this.musicGain);
            aOsc.start(now);
            aOsc.stop(now + 0.13);

            step++;
        };

        this.musicInterval = setInterval(playNote, 140);
    }

    stopMusic() {
        this.isMusicPlaying = false;
        if (this.musicInterval) {
            clearInterval(this.musicInterval);
            this.musicInterval = null;
        }
    }
}

const soundEngine = new SoundEngine();


/* --- scripts/particles.js --- */
/**
 * particles.js - High-performance VFX and particle system
 */

class ParticleSystem {
    constructor() {
        this.particles = [];
        this.spriteExplosions = [];
        this.floatingTexts = [];
        this.shockwaves = [];
    }

    addSmoke(x, y, vx, vy, color = 'rgba(215, 225, 240, 0.75)', startRadius = 5, endRadius = 30, life = 1.8, maxAlpha = 0.75) {
        this.particles.push({
            type: 'circle',
            x, y,
            vx, vy,
            color,
            radius: startRadius,
            startRadius,
            endRadius,
            life,
            maxLife: life,
            maxAlpha,
            alpha: maxAlpha
        });
    }

    addVapor(x, y, vx, vy, startRadius = 3, endRadius = 12, life = 0.45) {
        this.particles.push({
            type: 'circle',
            x, y,
            vx, vy,
            color: 'rgba(255, 255, 255, 0.65)',
            radius: startRadius,
            startRadius,
            endRadius,
            life,
            maxLife: life,
            alpha: 0.85
        });
    }

    addWindStreak(x, y, vx, vy) {
        this.particles.push({
            type: 'streak',
            x, y,
            vx, vy,
            color: 'rgba(255, 255, 255, 0.35)',
            length: 25 + Math.random() * 30,
            life: 0.25,
            maxLife: 0.25,
            alpha: 0.5
        });
    }

    addSpark(x, y, vx, vy, color = '#ffaa33', radius = 3, life = 0.3) {
        this.particles.push({
            type: 'spark',
            x, y,
            vx, vy,
            color,
            radius,
            life,
            maxLife: life,
            alpha: 1
        });
    }

    addFlareSpark(x, y) {
        for (let i = 0; i < 3; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 20 + Math.random() * 80;
            this.addSpark(
                x, y,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                Math.random() > 0.4 ? '#ffffff' : '#ff7700',
                2 + Math.random() * 3,
                0.4 + Math.random() * 0.3
            );
        }
    }

    addExplosion(x, y, isBig = false, image = null) {
        // Sprite animation
        this.spriteExplosions.push({
            x, y,
            image,
            isBig,
            totalFrames: 9,
            frameWidth: isBig ? 210 : 140,
            frameHeight: isBig ? 210 : 140,
            currentFrame: 0,
            frameTimer: 0,
            frameDuration: 0.045, // ~22 fps
            rotation: Math.random() * Math.PI * 2,
            scale: isBig ? 1.5 : 1.1
        });

        // Add blast sparks
        const sparkCount = isBig ? 24 : 14;
        for (let i = 0; i < sparkCount; i++) {
            const angle = (Math.PI * 2 * i) / sparkCount + (Math.random() * 0.3);
            const speed = (isBig ? 140 : 90) + Math.random() * 150;
            this.addSpark(
                x, y,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                Math.random() > 0.5 ? '#ffcc00' : '#ff4400',
                3 + Math.random() * 3,
                0.4 + Math.random() * 0.4
            );
        }

        // Add shockwave ring
        this.addShockwave(x, y, isBig ? 180 : 100, isBig ? 0.6 : 0.4, '#ff9900');
    }

    addShockwave(x, y, maxRadius = 120, duration = 0.5, color = '#00e5ff') {
        this.shockwaves.push({
            x, y,
            radius: 5,
            maxRadius,
            duration,
            timer: 0,
            color
        });
    }

    addFloatingText(text, x, y, color = '#ffff00', fontSize = 22) {
        this.floatingTexts.push({
            text,
            x, y,
            color,
            fontSize,
            vy: -45,
            alpha: 1,
            life: 0.85,
            maxLife: 0.85
        });
    }

    addCelebrationBurst(x, y) {
        const colors = ['#ffd700', '#ff00aa', '#00f0ff', '#00ff88', '#ffffff'];
        for (let i = 0; i < 20; i++) {
            const angle = (Math.PI * 2 * i) / 20 + (Math.random() - 0.5) * 0.4;
            const speed = 120 + Math.random() * 160;
            const col = colors[Math.floor(Math.random() * colors.length)];
            this.addSpark(
                x, y,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                col,
                4 + Math.random() * 4,
                0.6 + Math.random() * 0.4
            );
        }
        this.addShockwave(x, y, 160, 0.5, '#ffd700');
    }

    update(dt) {
        // Update particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.life -= dt;
            if (p.life <= 0) {
                this.particles.splice(i, 1);
                continue;
            }

            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.vx *= 0.96;
            p.vy *= 0.96;

            const progress = 1 - (p.life / p.maxLife);
            if (p.type === 'circle') {
                p.radius = p.startRadius + (p.endRadius - p.startRadius) * Math.pow(progress, 0.65);
                const baseAlpha = p.maxAlpha !== undefined ? p.maxAlpha : 1.0;
                p.alpha = Math.max(0, baseAlpha * (1 - progress));
            } else {
                p.alpha = Math.max(0, p.life / p.maxLife);
            }
        }

        // Update sprite explosions
        for (let i = this.spriteExplosions.length - 1; i >= 0; i--) {
            const exp = this.spriteExplosions[i];
            exp.frameTimer += dt;
            if (exp.frameTimer >= exp.frameDuration) {
                exp.frameTimer = 0;
                exp.currentFrame++;
                if (exp.currentFrame >= exp.totalFrames) {
                    this.spriteExplosions.splice(i, 1);
                }
            }
        }

        // Update shockwaves
        for (let i = this.shockwaves.length - 1; i >= 0; i--) {
            const sw = this.shockwaves[i];
            sw.timer += dt;
            if (sw.timer >= sw.duration) {
                this.shockwaves.splice(i, 1);
                continue;
            }
            const progress = sw.timer / sw.duration;
            sw.radius = sw.maxRadius * Math.sin(progress * Math.PI * 0.5);
            sw.alpha = 1 - progress;
        }

        // Update floating texts
        for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
            const ft = this.floatingTexts[i];
            ft.life -= dt;
            if (ft.life <= 0) {
                this.floatingTexts.splice(i, 1);
                continue;
            }
            ft.y += ft.vy * dt;
            ft.alpha = ft.life / ft.maxLife;
        }
    }

    render(ctx) {
        // Render shockwaves
        for (const sw of this.shockwaves) {
            ctx.save();
            ctx.strokeStyle = sw.color;
            ctx.globalAlpha = sw.alpha * 0.8;
            ctx.lineWidth = 4 * (1 - sw.timer / sw.duration) + 1;
            ctx.beginPath();
            ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }

        // Render particles
        for (const p of this.particles) {
            ctx.save();
            ctx.globalAlpha = p.alpha;
            if (p.type === 'streak') {
                ctx.strokeStyle = p.color;
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.moveTo(p.x, p.y);
                const angle = Math.atan2(p.vy, p.vx);
                ctx.lineTo(p.x - Math.cos(angle) * p.length, p.y - Math.sin(angle) * p.length);
                ctx.stroke();
            } else {
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, Math.max(1, p.radius), 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        }

        // Render sprite explosions
        for (const exp of this.spriteExplosions) {
            if (!exp.image || !exp.image.complete) continue;
            ctx.save();
            ctx.translate(exp.x, exp.y);
            ctx.rotate(exp.rotation);
            ctx.scale(exp.scale, exp.scale);

            const sx = exp.currentFrame * exp.frameWidth;
            const sy = 0;
            const sw = exp.frameWidth;
            const sh = exp.frameHeight;
            const dw = exp.frameWidth;
            const dh = exp.frameHeight;

            ctx.drawImage(
                exp.image,
                sx, sy, sw, sh,
                -dw / 2, -dh / 2, dw, dh
            );
            ctx.restore();
        }

        // Render floating texts
        for (const ft of this.floatingTexts) {
            ctx.save();
            ctx.globalAlpha = ft.alpha;
            ctx.font = `900 ${ft.fontSize}px 'Segoe UI', Tahoma, sans-serif`;
            ctx.fillStyle = ft.color;
            ctx.textAlign = 'center';
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 4;
            ctx.strokeText(ft.text, ft.x, ft.y);
            ctx.fillText(ft.text, ft.x, ft.y);
            ctx.restore();
        }
    }

    clear() {
        this.particles = [];
        this.spriteExplosions = [];
        this.floatingTexts = [];
        this.shockwaves = [];
    }
}


/* --- scripts/entities.js --- */
/**
 * entities.js - Player, Missiles, Flares, Asteroids, and Power-ups
 * Supports Infinite Sky Flight, Extra Life System & Power-Up Signals
 */

const SHIP_SPECS = {
    cx16: {
        id: 'cx16',
        name: 'CX-16 FALCON',
        desc: 'Balanced tactical interceptor with optimal maneuverability and speed.',
        baseSpeed: 520,
        baseTurnRate: 4.0,
        baseFlares: 3,
        baseHealth: 3,
        baseMagnet: 170,
        spritePrefix: 'CX16-X',
        hitboxRadius: 28,
        renderScale: 0.72
    },
    dko: {
        id: 'dko',
        name: 'DKO APEX',
        desc: 'Ultra-agile stealth fighter. Excels at tight near-miss supersonic dodges.',
        baseSpeed: 580,
        baseTurnRate: 4.8,
        baseFlares: 2,
        baseHealth: 3,
        baseMagnet: 185,
        spritePrefix: 'DKO-api-X',
        hitboxRadius: 26,
        renderScale: 0.72
    },
    wo84: {
        id: 'wo84',
        name: 'WO-84 PHANTOM',
        desc: 'Heavy dreadnought fighter with reinforced armor and superior payload.',
        baseSpeed: 480,
        baseTurnRate: 3.5,
        baseFlares: 5,
        baseHealth: 3,     // Standard 3 Lives
        baseMagnet: 200,
        spritePrefix: 'WO84-wu-X',
        hitboxRadius: 30,
        renderScale: 0.76
    }
};

const ALL_PLANES = [
    { shipId: 'cx16', level: 1 },
    { shipId: 'cx16', level: 2 },
    { shipId: 'cx16', level: 3 },
    { shipId: 'dko', level: 1 },
    { shipId: 'dko', level: 2 },
    { shipId: 'dko', level: 3 },
    { shipId: 'wo84', level: 1 },
    { shipId: 'wo84', level: 2 },
    { shipId: 'wo84', level: 3 }
];

function normalizeAngle(angle) {
    while (angle > Math.PI) angle -= Math.PI * 2;
    while (angle < -Math.PI) angle += Math.PI * 2;
    return angle;
}

class Player {
    constructor(shipId, shipLevel, upgrades, images) {
        this.images = images;
        this.upgrades = upgrades || { speed: 1, agility: 1, flares: 1, magnet: 1 };
        this.boostTimer = 0;
        this.applyShipConfig(shipId, shipLevel);

        // Position & Physics (Infinite Sky Coordinates)
        this.x = 0;
        this.y = 0;
        this.vx = 0;
        this.vy = 0;
        this.angle = -Math.PI / 2; // Facing UP
        this.targetAngle = -Math.PI / 2;
        this.nearMissRadius = 100;

        // Aerodynamics & Banking
        this.bank = 0;
        this.wingspan = 38;
        this.vaporTimer = 0;
        this.windTimer = 0;

        // Visuals
        this.flameFrame = 0;
        this.flameTimer = 0;
        this.smokeTimer = 0;
    }

    applyShipConfig(shipId, shipLevel) {
        this.spec = SHIP_SPECS[shipId] || SHIP_SPECS.cx16;
        this.level = shipLevel || 1;
        this.spriteName = `${this.spec.spritePrefix}${this.level}.png`;
        this.radius = this.spec.hitboxRadius;

        const speedBonus = 1 + (this.level - 1) * 0.08 + (this.upgrades.speed - 1) * 0.06;
        const turnBonus = 1 + (this.level - 1) * 0.08 + (this.upgrades.agility - 1) * 0.07;
        const flareBonus = (this.level - 1) + (this.upgrades.flares - 1);

        this.speed = this.spec.baseSpeed * speedBonus;
        this.turnRate = this.spec.baseTurnRate * turnBonus;
        this.maxFlares = this.spec.baseFlares + flareBonus;
        this.flares = this.maxFlares;
        this.magnetRadius = this.spec.baseMagnet + (this.upgrades.magnet - 1) * 45;

        // Fixed 3-Lives System
        this.maxHealth = 3;
        this.health = 3;
        this.hasShield = false;
        this.shieldAnimTimer = 0;
        this.alive = true;
        this.invulnerableTimer = 0;
        this.boostTimer = 0;
    }

    randomizePlane() {
        const choice = ALL_PLANES[Math.floor(Math.random() * ALL_PLANES.length)];
        this.applyShipConfig(choice.shipId, choice.level);
    }

    reset(x, y, randomize = true) {
        if (randomize) {
            this.randomizePlane();
        }
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.angle = -Math.PI / 2;
        this.targetAngle = -Math.PI / 2;
        this.bank = 0;
        this.health = 3;
        this.maxHealth = 3;
        this.flares = this.maxFlares;
        this.hasShield = false;
        this.alive = true;
        this.invulnerableTimer = 2.0; // Spawn protection
        this.boostTimer = 0;
    }

    activateBoost(duration = 2.0) {
        this.boostTimer = duration;
        this.invulnerableTimer = Math.max(this.invulnerableTimer, duration);
    }

    takeDamage() {
        if (this.invulnerableTimer > 0) return 'invulnerable';

        if (this.hasShield) {
            this.hasShield = false;
            this.invulnerableTimer = 1.8; // Brief shield break protection
            return 'shield_absorbed';
        }

        this.health--;
        this.invulnerableTimer = 2.2; // Temporary invulnerability after damage

        if (this.health <= 0) {
            this.alive = false;
            return 'dead';
        }
        return 'damaged';
    }

    heal(amount = 1) {
        if (this.health < this.maxHealth) {
            this.health = Math.min(this.maxHealth, this.health + amount);
            return true;
        }
        // If already full health, give a temporary shield protection!
        if (!this.hasShield) {
            this.hasShield = true;
            return true;
        }
        return false;
    }

    update(dt, input, particles) {
        if (!this.alive) return;

        if (this.invulnerableTimer > 0) {
            this.invulnerableTimer -= dt;
        }

        if (this.hasShield) {
            this.shieldAnimTimer += dt * 3.5;
        }

        // Turning toward input direction
        let turnDiff = 0;
        if (input.active) {
            this.targetAngle = input.angle;
            turnDiff = normalizeAngle(this.targetAngle - this.angle);
            const maxTurn = this.turnRate * dt;
            this.angle += Math.max(-maxTurn, Math.min(maxTurn, turnDiff));
        }

        // Aerodynamic banking
        const targetBank = input.active ? Math.max(-1, Math.min(1, turnDiff * 2.2)) : 0;
        this.bank += (targetBank - this.bank) * Math.min(1, dt * 9.0);

        // Infinite forward flight motion with 2-Second Super Boost Surge!
        let moveSpeed = input.active ? this.speed : this.speed * 0.90;
        if (this.boostTimer > 0) {
            this.boostTimer -= dt;
            moveSpeed *= 2.15; // Tremendous supersonic surge!
            this.invulnerableTimer = Math.max(this.invulnerableTimer, 0.2);

            // Blazing afterburner thrust sparks & shockwaves
            const exhaustDist = 44;
            const ex = this.x - Math.cos(this.angle) * exhaustDist;
            const ey = this.y - Math.sin(this.angle) * exhaustDist;
            for (let b = 0; b < 2; b++) {
                particles.addSpark(
                    ex + (Math.random() - 0.5) * 12,
                    ey + (Math.random() - 0.5) * 12,
                    -Math.cos(this.angle) * 360 + (Math.random() - 0.5) * 80,
                    -Math.sin(this.angle) * 360 + (Math.random() - 0.5) * 80,
                    Math.random() > 0.35 ? '#00ffff' : '#ff9900',
                    4 + Math.random() * 4,
                    0.28
                );
            }
            if (Math.random() < 0.3) {
                particles.addShockwave(this.x, this.y, 90, 0.25, '#00f0ff');
            }
        }

        const targetVx = Math.cos(this.angle) * moveSpeed;
        const targetVy = Math.sin(this.angle) * moveSpeed;

        this.vx += (targetVx - this.vx) * Math.min(1, dt * 7.5);
        this.vy += (targetVy - this.vy) * Math.min(1, dt * 7.5);

        // Position changes freely with no boundary clamping!
        this.x += this.vx * dt;
        this.y += this.vy * dt;

        // Flame animation
        this.flameTimer += dt;
        if (this.flameTimer > 0.05) {
            this.flameTimer = 0;
            this.flameFrame = (this.flameFrame + 1) % 3;
        }

        // Engine exhaust particles
        this.smokeTimer += dt;
        if (this.smokeTimer > 0.03) {
            this.smokeTimer = 0;
            const exhaustDist = 42;
            const ex = this.x - Math.cos(this.angle) * exhaustDist;
            const ey = this.y - Math.sin(this.angle) * exhaustDist;
            const spread = (Math.random() - 0.5) * 12;

            particles.addSmoke(
                ex + Math.sin(this.angle) * spread,
                ey - Math.cos(this.angle) * spread,
                -Math.cos(this.angle) * 70,
                -Math.sin(this.angle) * 70,
                'rgba(215, 235, 255, 0.45)',
                5, 18, 0.35
            );
        }

        // Wingtip vapor vortices
        this.vaporTimer += dt;
        if (Math.abs(this.bank) > 0.22 && this.vaporTimer > 0.02) {
            this.vaporTimer = 0;
            const perpAngle = this.angle + Math.PI / 2;
            const wingSpanOffset = this.wingspan * 0.95;

            const lx = this.x - Math.cos(perpAngle) * wingSpanOffset - Math.cos(this.angle) * 8;
            const ly = this.y - Math.sin(perpAngle) * wingSpanOffset - Math.sin(this.angle) * 8;
            const rx = this.x + Math.cos(perpAngle) * wingSpanOffset - Math.cos(this.angle) * 8;
            const ry = this.y + Math.sin(perpAngle) * wingSpanOffset - Math.sin(this.angle) * 8;

            particles.addVapor(lx, ly, -Math.cos(this.angle) * 35, -Math.sin(this.angle) * 35, 4, 14, 0.4);
            particles.addVapor(rx, ry, -Math.cos(this.angle) * 35, -Math.sin(this.angle) * 35, 4, 14, 0.4);
        }

        // Atmospheric speed streaks
        this.windTimer += dt;
        if (this.windTimer > 0.06) {
            this.windTimer = 0;
            const sideOffset = (Math.random() - 0.5) * 180;
            const frontOffset = 100 + Math.random() * 80;
            const wx = this.x + Math.cos(this.angle) * frontOffset + Math.sin(this.angle) * sideOffset;
            const wy = this.y + Math.sin(this.angle) * frontOffset - Math.cos(this.angle) * sideOffset;
            particles.addWindStreak(wx, wy, -this.vx * 1.3, -this.vy * 1.3);
        }
    }

    deployFlare() {
        if (this.flares <= 0 || !this.alive) return false;
        this.flares--;
        return true;
    }

    render(ctx) {
        if (!this.alive) return;

        const shipImg = this.images[this.spriteName] || this.images['CX16-X1.png'];
        const scale = this.spec.renderScale;
        const w = (shipImg && shipImg.complete) ? shipImg.naturalWidth * scale : 100;
        const h = (shipImg && shipImg.complete) ? shipImg.naturalHeight * scale : 100;

        // 1. Draw Soft Cloud Shadow Below Plane
        ctx.save();
        ctx.translate(this.x + 35, this.y + 55);
        ctx.rotate(this.angle + Math.PI / 2);
        ctx.scale(0.82, 0.82);
        ctx.globalAlpha = 0.22;
        ctx.filter = 'blur(6px)';

        if (shipImg && shipImg.complete) {
            ctx.drawImage(shipImg, -w / 2, -h / 2, w, h);
        }
        ctx.restore();

        // 2. Draw Aircraft with 3D Banking Tilt
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle + Math.PI / 2);

        ctx.scale(1 - Math.abs(this.bank) * 0.24, 1);
        ctx.rotate(this.bank * 0.12);

        // Invulnerability flicker
        if (this.invulnerableTimer > 0 && Math.floor(Date.now() / 70) % 2 === 0) {
            ctx.globalAlpha = 0.40;
        }

        // Thruster flame
        const flameImg = this.images['spaceship_flame.png'];
        if (flameImg && flameImg.complete) {
            ctx.save();
            const fw = 35;
            const fh = 51;
            const flameScale = 1.3;
            ctx.drawImage(
                flameImg,
                this.flameFrame * fw, 0, fw, fh,
                (-fw * flameScale) / 2, 34, fw * flameScale, fh * flameScale
            );
            ctx.restore();
        }

        // Aircraft Sprite
        if (shipImg && shipImg.complete) {
            ctx.drawImage(shipImg, -w / 2, -h / 2, w, h);
        }

        // Super Boost Visual FX (Supersonic Aura & Jet Blast)
        if (this.boostTimer > 0) {
            ctx.strokeStyle = '#00f0ff';
            ctx.lineWidth = 4;
            ctx.shadowColor = '#00ffff';
            ctx.shadowBlur = 24;
            ctx.beginPath();
            ctx.arc(0, 0, this.radius + 18, 0, Math.PI * 2);
            ctx.stroke();

            // Blazing afterburner cone
            ctx.fillStyle = '#00ffff';
            ctx.beginPath();
            ctx.moveTo(-16, 40);
            ctx.lineTo(16, 40);
            ctx.lineTo(0, 115 + Math.random() * 25);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.moveTo(-8, 40);
            ctx.lineTo(8, 40);
            ctx.lineTo(0, 75 + Math.random() * 15);
            ctx.closePath();
            ctx.fill();
        }

        // Draw Shield bubble if active
        if (this.hasShield) {
            ctx.restore();
            ctx.save();
            ctx.translate(this.x, this.y);

            const pulse = 1 + Math.sin(this.shieldAnimTimer) * 0.08;
            const shieldRadius = (this.radius + 24) * pulse;

            ctx.strokeStyle = '#00f0ff';
            ctx.lineWidth = 3.5;
            ctx.shadowColor = '#00f0ff';
            ctx.shadowBlur = 18;
            ctx.beginPath();
            ctx.arc(0, 0, shieldRadius, 0, Math.PI * 2);
            ctx.stroke();

            ctx.fillStyle = 'rgba(0, 240, 255, 0.18)';
            ctx.fill();
        }

        ctx.restore();
    }
}

class DecoyFlare {
    constructor(x, y, playerAngle) {
        this.x = x;
        this.y = y;
        const ejectAngle = playerAngle + Math.PI + (Math.random() - 0.5) * 0.8;
        const speed = 180 + Math.random() * 90;
        this.vx = Math.cos(ejectAngle) * speed;
        this.vy = Math.sin(ejectAngle) * speed;
        this.life = 4.2;
        this.maxLife = 4.2;
        this.radius = 16;
    }

    update(dt, particles) {
        this.life -= dt;
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.vx *= 0.96;
        this.vy *= 0.96;

        particles.addFlareSpark(this.x, this.y);
        return this.life > 0;
    }

    render(ctx) {
        ctx.save();
        const pulse = 0.8 + Math.random() * 0.4;
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#ff6600';
        ctx.shadowBlur = 22;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 8 * pulse, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#ff9900';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 18 * pulse, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }
}

class Missile {
    constructor(x, y, type = 'seeker', images) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.images = images;
        this.angle = Math.random() * Math.PI * 2;
        this.alive = true;
        this.smokeTimer = 0;
        this.nearMissed = false;
        this.wobbleTimer = Math.random() * Math.PI * 2;
        this.wobbleSpeed = 3.5 + Math.random() * 3.5;

        // Random speed & turn rate variance (±10%)
        const speedVar = 0.90 + Math.random() * 0.20;
        const turnVar = 0.90 + Math.random() * 0.20;

        // Small, sharp rocket dimensions ("choto choto roket style er")
        if (type === 'fast') {
            this.speed = 460 * speedVar;
            this.turnRate = 1.95 * turnVar;
            this.radius = 9;
            this.health = 1;
            this.scale = 0.27;
            this.imageName = 'enemy_unit.png';
            this.color = '#ff2222';
            this.glowColor = '#ff0033';
            this.eyeColor = '#ffff00';
            this.smokeColor = 'rgba(255, 90, 90, 0.75)';
        } else if (type === 'mothership') {
            this.speed = 280 * speedVar;
            this.turnRate = 2.2 * turnVar;
            this.radius = 16;
            this.health = 3;
            this.scale = 0.42;
            this.imageName = 'enemy_mothership.png';
            this.color = '#aa00ff';
            this.glowColor = '#cc00ff';
            this.eyeColor = '#ff00aa';
            this.smokeColor = 'rgba(160, 50, 220, 0.75)';
        } else if (type === 'swarmer') {
            this.speed = 410 * speedVar;
            this.turnRate = 3.6 * turnVar;
            this.radius = 8;
            this.health = 1;
            this.scale = 0.23;
            this.imageName = 'enemy_unit.png';
            this.color = '#00f0ff';
            this.glowColor = '#00d4ff';
            this.eyeColor = '#ffffff';
            this.smokeColor = 'rgba(0, 240, 255, 0.75)';
        } else if (type === 'spiral') {
            this.speed = 380 * speedVar;
            this.turnRate = 2.8 * turnVar;
            this.radius = 10;
            this.health = 1;
            this.scale = 0.29;
            this.imageName = 'enemy_unit.png';
            this.color = '#ffbb00';
            this.glowColor = '#ff9900';
            this.eyeColor = '#ff0000';
            this.smokeColor = 'rgba(255, 175, 0, 0.75)';
        } else {
            this.speed = 385 * speedVar;
            this.turnRate = 2.7 * turnVar;
            this.radius = 10;
            this.health = 1;
            this.scale = 0.29;
            this.imageName = 'enemy_unit.png';
            this.color = '#ff6600';
            this.glowColor = '#ff4400';
            this.eyeColor = '#ff0000';
            this.smokeColor = 'rgba(235, 235, 235, 0.75)';
        }

        this.vx = Math.cos(this.angle) * this.speed;
        this.vy = Math.sin(this.angle) * this.speed;
    }

    update(dt, target, player, particles) {
        if (!this.alive) return;

        // Despawn if wandered too far from player in infinite sky
        const distToPlayer = Math.hypot(this.x - player.x, this.y - player.y);
        if (distToPlayer > 4200) {
            this.alive = false;
            return;
        }

        if (target) {
            let targetAngle = Math.atan2(target.y - this.y, target.x - this.x);
            if (this.type === 'spiral') {
                this.wobbleTimer += dt * this.wobbleSpeed;
                targetAngle += Math.sin(this.wobbleTimer) * 0.42;
            }
            const diff = normalizeAngle(targetAngle - this.angle);
            const maxTurn = this.turnRate * dt;
            this.angle += Math.max(-maxTurn, Math.min(maxTurn, diff));
        }

        this.vx = Math.cos(this.angle) * this.speed;
        this.vy = Math.sin(this.angle) * this.speed;

        this.x += this.vx * dt;
        this.y += this.vy * dt;

        // Long billowing rocket smoke trail ("lombaaaaaaa duya", 1.9s duration!)
        this.smokeTimer += dt;
        if (this.smokeTimer > 0.016) {
            this.smokeTimer = 0;
            const nozzleOffset = this.radius + 8;
            const ex = this.x - Math.cos(this.angle) * nozzleOffset;
            const ey = this.y - Math.sin(this.angle) * nozzleOffset;

            particles.addSmoke(
                ex + (Math.random() - 0.5) * 4,
                ey + (Math.random() - 0.5) * 4,
                -Math.cos(this.angle) * 32 + (Math.random() - 0.5) * 10,
                -Math.sin(this.angle) * 32 + (Math.random() - 0.5) * 10,
                this.smokeColor,
                4, 28, 1.9, 0.75
            );

            // Fiery rocket thruster spark
            if (Math.random() < 0.65) {
                particles.addSpark(
                    ex, ey,
                    -Math.cos(this.angle) * 80 + (Math.random() - 0.5) * 22,
                    -Math.sin(this.angle) * 80 + (Math.random() - 0.5) * 22,
                    Math.random() > 0.4 ? '#ff6600' : '#ffdd00',
                    2.5 + Math.random() * 2,
                    0.22
                );
            }
        }
    }

    render(ctx) {
        if (!this.alive) return;

        // Missile shadow on clouds
        ctx.save();
        ctx.translate(this.x + 20, this.y + 30);
        ctx.rotate(this.angle + Math.PI / 2);
        ctx.scale(0.85, 0.85);
        ctx.globalAlpha = 0.20;
        const img = this.images[this.imageName];
        if (img && img.complete) {
            const w = img.naturalWidth * this.scale;
            const h = img.naturalHeight * this.scale;
            ctx.drawImage(img, -w / 2, -h / 2, w, h);
        }
        ctx.restore();

        // Missile rocket body
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle + Math.PI / 2);

        // Blazing rocket thruster flame at nozzle
        const flameLen = 14 + Math.random() * 8;
        const thrusterY = this.radius + 4;
        ctx.fillStyle = '#ff9900';
        ctx.shadowColor = '#ff4400';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.moveTo(-3.5, thrusterY);
        ctx.lineTo(3.5, thrusterY);
        ctx.lineTo(0, thrusterY + flameLen);
        ctx.closePath();
        ctx.fill();

        // Hot inner flame core
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(-1.8, thrusterY);
        ctx.lineTo(1.8, thrusterY);
        ctx.lineTo(0, thrusterY + flameLen * 0.55);
        ctx.closePath();
        ctx.fill();

        if (img && img.complete) {
            const w = img.naturalWidth * this.scale;
            const h = img.naturalHeight * this.scale;
            ctx.drawImage(img, -w / 2, -h / 2, w, h);
        } else {
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.fillStyle = this.eyeColor || '#ff0000';
        ctx.shadowColor = this.glowColor || '#ff0000';
        ctx.shadowBlur = 14;
        ctx.beginPath();
        ctx.arc(0, -this.radius + 3, 3.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}

class Asteroid {
    constructor(x, y, imageIndex, images) {
        this.x = x;
        this.y = y;
        this.images = images;
        const num = String(imageIndex).padStart(2, '0');
        this.imageName = `asteroid_${num}.png`;
        this.angle = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.4;
        this.vx = (Math.random() - 0.5) * 25;
        this.vy = (Math.random() - 0.5) * 25;
        this.radius = 45 + Math.random() * 40;
        this.scale = (this.radius * 2) / 320;
    }

    update(dt, player) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.angle += this.rotationSpeed * dt;

        // Wrap around player position in infinite sky
        const wrapDist = 2400;
        if (this.x < player.x - wrapDist) this.x += wrapDist * 2;
        if (this.x > player.x + wrapDist) this.x -= wrapDist * 2;
        if (this.y < player.y - wrapDist) this.y += wrapDist * 2;
        if (this.y > player.y + wrapDist) this.y -= wrapDist * 2;
    }

    render(ctx) {
        ctx.save();
        ctx.translate(this.x + 25, this.y + 40);
        ctx.rotate(this.angle);
        ctx.globalAlpha = 0.18;
        const img = this.images[this.imageName];
        if (img && img.complete) {
            const w = img.naturalWidth * this.scale;
            const h = img.naturalHeight * this.scale;
            ctx.drawImage(img, -w / 2, -h / 2, w, h);
        }
        ctx.restore();

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        if (img && img.complete) {
            const w = img.naturalWidth * this.scale;
            const h = img.naturalHeight * this.scale;
            ctx.drawImage(img, -w / 2, -h / 2, w, h);
        } else {
            ctx.fillStyle = '#555566';
            ctx.beginPath();
            ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }
}

class PowerUp {
    constructor(x, y, type = 'coin', images) {
        this.x = x;
        this.y = y;
        this.type = type; // 'shield', 'life', 'emp', 'flare', 'coin'
        this.images = images;
        this.radius = 26;
        this.life = 35; // 35s lifetime in world
        this.bobTimer = Math.random() * Math.PI * 2;

        // Signal info for offscreen indicator beacons
        if (type === 'shield') {
            this.label = 'ENERGY SHIELD';
            this.icon = '🛡️';
            this.color = '#00f0ff';
        } else if (type === 'life') {
            this.label = 'EXTRA LIFE';
            this.icon = '❤️';
            this.color = '#00ff88';
        } else if (type === 'boost') {
            this.label = 'SUPER BOOST';
            this.icon = '🚀';
            this.color = '#ff7700';
        } else if (type === 'emp') {
            this.label = 'EMP SMART BOMB';
            this.icon = '⚡';
            this.color = '#ff00aa';
        } else if (type === 'flare') {
            this.label = 'FLARE PACK';
            this.icon = '✨';
            this.color = '#ffaa00';
        } else {
            this.label = 'SPACE STARS';
            this.icon = '★';
            this.color = '#ffd700';
        }
    }

    update(dt, player) {
        this.life -= dt;
        this.bobTimer += dt * 4.5;

        // Despawn if player flew too far away in infinite sky
        const dist = Math.hypot(player.x - this.x, player.y - this.y);
        if (dist > 4000) return false;

        // Magnet attraction toward player
        if (player && player.alive) {
            if (this.type === 'coin' && dist < player.magnetRadius) {
                const pullSpeed = 560 * (1 - dist / player.magnetRadius) + 160;
                this.x += ((player.x - this.x) / dist) * pullSpeed * dt;
                this.y += ((player.y - this.y) / dist) * pullSpeed * dt;
            }
        }

        return this.life > 0;
    }

    render(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y + Math.sin(this.bobTimer) * 6);

        // Pulsing glow halo
        const pulse = 1 + Math.sin(this.bobTimer * 1.5) * 0.15;
        ctx.fillStyle = this.color;
        ctx.globalAlpha = 0.25;
        ctx.beginPath();
        ctx.arc(0, 0, (this.radius + 12) * pulse, 0, Math.PI * 2);
        ctx.fill();

        if (this.life < 5 && Math.floor(Date.now() / 100) % 2 === 0) {
            ctx.globalAlpha = 0.35;
        } else {
            ctx.globalAlpha = 1.0;
        }

        if (this.type === 'coin') {
            const img = this.images['summary_stars.png'];
            if (img && img.complete) {
                ctx.drawImage(img, 0, 0, 64, 64, -26, -26, 52, 52);
            } else {
                ctx.fillStyle = '#ffdd00';
                ctx.beginPath();
                ctx.arc(0, 0, 20, 0, Math.PI * 2);
                ctx.fill();
            }
        } else if (this.type === 'shield') {
            const img = this.images['points_powerup_lifes_03.png'];
            if (img && img.complete) {
                ctx.drawImage(img, -28, -28, 56, 56);
            } else {
                ctx.fillStyle = '#00e5ff';
                ctx.beginPath();
                ctx.arc(0, 0, 22, 0, Math.PI * 2);
                ctx.fill();
            }
        } else if (this.type === 'life') {
            const img = this.images['points_powerup_lifes_05_life_indicator.png'];
            if (img && img.complete) {
                ctx.drawImage(img, -26, -26, 52, 52);
            } else {
                ctx.fillStyle = '#00ff88';
                ctx.beginPath();
                ctx.arc(0, 0, 22, 0, Math.PI * 2);
                ctx.fill();
            }
        } else if (this.type === 'boost') {
            ctx.fillStyle = '#ff6600';
            ctx.shadowColor = '#ff4400';
            ctx.shadowBlur = 20;
            ctx.beginPath();
            ctx.arc(0, 0, 24, 0, Math.PI * 2);
            ctx.fill();

            // Glowing inner badge ring
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.arc(0, 0, 22, 0, Math.PI * 2);
            ctx.stroke();

            // Rocket emoji icon
            ctx.font = '26px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('🚀', 0, 1);
        } else if (this.type === 'emp') {
            const img = this.images['points_powerup_lifes_04.png'];
            if (img && img.complete) {
                ctx.drawImage(img, -28, -28, 56, 56);
            } else {
                ctx.fillStyle = '#ff00aa';
                ctx.beginPath();
                ctx.arc(0, 0, 22, 0, Math.PI * 2);
                ctx.fill();
            }
        } else if (this.type === 'flare') {
            const img = this.images['shooting_button.png'];
            if (img && img.complete) {
                ctx.drawImage(img, 0, 0, 200, 200, -26, -26, 52, 52);
            } else {
                ctx.fillStyle = '#ffaa00';
                ctx.beginPath();
                ctx.arc(0, 0, 22, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        ctx.restore();
    }
}

/* --- scripts/game.js --- */
/**
 * game.js - Core Game Loop, Spawner, Collisions, HUD & Input
 * Infinite Sky Flight, Power-Up Directional Signals, Extra Lives & Tap to Play
 */


class CloudFormation {
    constructor(x, y, layer = 'mid') {
        this.x = x;
        this.y = y;
        this.layer = layer; // 'low', 'mid', 'high'
        this.speed = (layer === 'low' ? 10 : layer === 'mid' ? 16 : 24) + Math.random() * 8;
        this.scale = (layer === 'low' ? 1.6 : layer === 'mid' ? 1.1 : 0.8) * (0.8 + Math.random() * 0.5);

        this.puffs = [];
        const puffCount = 5 + Math.floor(Math.random() * 6);
        for (let i = 0; i < puffCount; i++) {
            this.puffs.push({
                ox: (Math.random() - 0.5) * 160 * this.scale,
                oy: (Math.random() - 0.5) * 80 * this.scale,
                radius: (50 + Math.random() * 60) * this.scale
            });
        }
    }

    update(dt, camX, camY, camW, camH) {
        this.x += this.speed * dt;
        this.y += (this.speed * 0.22) * dt;

        // Infinite wrapping relative to camera viewport
        const pad = 600;
        if (this.x < camX - pad) this.x = camX + camW + pad;
        if (this.x > camX + camW + pad) this.x = camX - pad;
        if (this.y < camY - pad) this.y = camY + camH + pad;
        if (this.y > camY + camH + pad) this.y = camY - pad;
    }

    render(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);

        const alpha = this.layer === 'low' ? 0.35 : this.layer === 'mid' ? 0.70 : 0.40;

        for (const puff of this.puffs) {
            const grad = ctx.createRadialGradient(
                puff.ox - puff.radius * 0.2, puff.oy - puff.radius * 0.3, puff.radius * 0.1,
                puff.ox, puff.oy, puff.radius
            );

            if (this.layer === 'low') {
                grad.addColorStop(0, `rgba(230, 242, 255, ${alpha})`);
                grad.addColorStop(0.7, `rgba(180, 210, 240, ${alpha * 0.6})`);
                grad.addColorStop(1, 'rgba(160, 195, 230, 0)');
            } else if (this.layer === 'mid') {
                grad.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
                grad.addColorStop(0.6, `rgba(240, 248, 255, ${alpha * 0.8})`);
                grad.addColorStop(0.85, `rgba(195, 220, 245, ${alpha * 0.4})`);
                grad.addColorStop(1, 'rgba(180, 210, 240, 0)');
            } else {
                grad.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
                grad.addColorStop(0.8, `rgba(240, 248, 255, ${alpha * 0.5})`);
                grad.addColorStop(1, 'rgba(230, 245, 255, 0)');
            }

            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(puff.ox, puff.oy, puff.radius, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }
}

class MissileEscapeGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');

        this.particles = new ParticleSystem();
        this.images = {};
        this.loaded = false;

        // Fixed Mobile Viewport: 1080 x 1920
        this.VIRTUAL_WIDTH = 1080;
        this.VIRTUAL_HEIGHT = 1920;
        this.camera = { x: 0, y: 0, width: this.VIRTUAL_WIDTH, height: this.VIRTUAL_HEIGHT };

        // Game State: 'MENU', 'HANGAR', 'PLAYING', 'PAUSED', 'GAMEOVER'
        this.state = 'MENU';

        // Entities (Infinite Sky)
        this.player = null;
        this.missiles = [];
        this.flares = [];
        this.asteroids = [];
        this.powerups = [];
        this.clouds = [];

        // Gameplay tracking
        this.score = 0;
        this.survivalTime = 0;
        this.coinsCollected = 0;
        this.missilesDodged = 0;
        this.nearMissCount = 0;
        this.combo = 1;
        this.comboTimer = 0;

        // Spawner timers
        this.spawnTimer = 0;
        this.baseSpawnInterval = 2.6;
        this.coinSpawnTimer = 0;
        this.powerupSpawnTimer = 0;

        // Input state
        this.keys = {};
        this.inputVector = { x: 0, y: 0, angle: -Math.PI / 2, active: false };
        this.touchData = {
            active: false,
            startX: 0, startY: 0,
            curX: 0, curY: 0,
            isJoystick: false
        };

        this.lastMilestone = 0;
        this.celebTimer = null;
        this.lastWarningSoundTime = 0;
        this.lastTime = performance.now();

        this.init();
    }

    async init() {
        this.resize();
        window.addEventListener('resize', () => this.resize());

        this.setupInputs();
        await this.preloadAssets();
        this.setupClouds();
        this.setupAsteroids();

        this.player = new Player(
            storage.getSelectedShip(),
            storage.data.ships[storage.getSelectedShip()]?.level || 1,
            storage.data.upgrades,
            this.images
        );
        this.player.randomizePlane();

        this.updateMenuUI();

        requestAnimationFrame((t) => this.gameLoop(t));
    }

    resize() {
        this.canvas.width = this.VIRTUAL_WIDTH;
        this.canvas.height = this.VIRTUAL_HEIGHT;
        this.camera.width = this.VIRTUAL_WIDTH;
        this.camera.height = this.VIRTUAL_HEIGHT;
    }

    setupClouds() {
        this.clouds = [];
        for (let i = 0; i < 18; i++) {
            const x = (Math.random() - 0.5) * 3000;
            const y = (Math.random() - 0.5) * 3000;
            this.clouds.push(new CloudFormation(x, y, 'low'));
        }
        for (let i = 0; i < 22; i++) {
            const x = (Math.random() - 0.5) * 3000;
            const y = (Math.random() - 0.5) * 3000;
            this.clouds.push(new CloudFormation(x, y, 'mid'));
        }
        for (let i = 0; i < 12; i++) {
            const x = (Math.random() - 0.5) * 3000;
            const y = (Math.random() - 0.5) * 3000;
            this.clouds.push(new CloudFormation(x, y, 'high'));
        }
    }

    async preloadAssets() {
        const assetList = [
            'CX16-X1.png', 'CX16-X2.png', 'CX16-X3.png',
            'DKO-api-X1.png', 'DKO-api-X2.png', 'DKO-api-X3.png',
            'WO84-wu-X1.png', 'WO84-wu-X2.png', 'WO84-wu-X3.png',
            'enemy_unit.png', 'enemy_mothership.png', 'spaceship_flame.png',
            'explosion.png', 'explosion_big.png', 'game_logo.png',
            'background_menu.png', 'background_menu.jpg',
            'summary_stars.png', 'shooting_button.png', 'pause_button.png',
            'points_powerup_lifes_03.png', 'points_powerup_lifes_04.png',
            'points_powerup_lifes_05_life_indicator.png',
            'asteroid_01.png', 'asteroid_02.png', 'asteroid_03.png',
            'asteroid_04.png', 'asteroid_05.png', 'asteroid_06.png',
            'asteroid_07.png', 'asteroid_08.png', 'asteroid_09.png'
        ];

        const loadPromises = assetList.map((file) => {
            return new Promise((resolve) => {
                const img = new Image();
                img.src = `images/${file}`;
                img.onload = () => {
                    this.images[file] = img;
                    resolve();
                };
                img.onerror = () => {
                    console.warn(`Could not load image: ${file}`);
                    resolve();
                };
            });
        });

        await Promise.all(loadPromises);
        this.loaded = true;
    }

    setupAsteroids() {
        this.asteroids = [];
        for (let i = 0; i < 16; i++) {
            const x = (Math.random() - 0.5) * 4000;
            const y = (Math.random() - 0.5) * 4000;
            const imgIdx = (i % 9) + 1;
            this.asteroids.push(new Asteroid(x, y, imgIdx, this.images));
        }
    }

    getCanvasCoordinates(clientX, clientY) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.VIRTUAL_WIDTH / rect.width;
        const scaleY = this.VIRTUAL_HEIGHT / rect.height;
        return {
            x: (clientX - rect.left) * scaleX,
            y: (clientY - rect.top) * scaleY
        };
    }

    setupInputs() {
        // Keyboard controls
        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;

            if (this.state === 'MENU' && (e.code === 'Space' || e.code === 'Enter')) {
                this.startGame();
                return;
            }

            if (e.code === 'Space') {
                e.preventDefault();
                if (this.state === 'PLAYING') {
                    this.triggerFlare();
                }
            } else if (e.code === 'Escape' || e.code === 'KeyP') {
                if (this.state === 'PLAYING') this.pauseGame();
                else if (this.state === 'PAUSED') this.resumeGame();
            }
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });

        // Pointer controls
        const canvas = this.canvas;
        let isPointerDown = false;

        const onPointerDown = (clientX, clientY) => {
            soundEngine.resume();
            if (this.state === 'MENU') {
                this.startGame();
                return;
            }
            if (this.state !== 'PLAYING') return;

            const pos = this.getCanvasCoordinates(clientX, clientY);
            isPointerDown = true;
            this.touchData.active = true;
            this.touchData.startX = pos.x;
            this.touchData.startY = pos.y;
            this.touchData.curX = pos.x;
            this.touchData.curY = pos.y;
            this.updateTouchVector();
        };

        const onPointerMove = (clientX, clientY) => {
            if (!isPointerDown || this.state !== 'PLAYING') return;
            const pos = this.getCanvasCoordinates(clientX, clientY);
            this.touchData.curX = pos.x;
            this.touchData.curY = pos.y;
            this.updateTouchVector();
        };

        const onPointerUp = () => {
            isPointerDown = false;
            this.touchData.active = false;
        };

        canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const t = e.touches[0];
            onPointerDown(t.clientX, t.clientY);
        }, { passive: false });

        canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const t = e.touches[0];
            onPointerMove(t.clientX, t.clientY);
        }, { passive: false });

        canvas.addEventListener('touchend', onPointerUp);
        canvas.addEventListener('touchcancel', onPointerUp);

        canvas.addEventListener('mousedown', (e) => {
            if (e.button === 0) onPointerDown(e.clientX, e.clientY);
            else if (e.button === 2) {
                e.preventDefault();
                this.triggerFlare();
            }
        });
        window.addEventListener('mousemove', (e) => onPointerMove(e.clientX, e.clientY));
        window.addEventListener('mouseup', onPointerUp);
        canvas.addEventListener('contextmenu', (e) => e.preventDefault());

        // UI Buttons & Tap-to-play
        document.getElementById('tapToPlayOverlay')?.addEventListener('click', () => this.startGame());
        document.getElementById('btnSettings')?.addEventListener('click', () => this.openSettings());
        document.getElementById('btnHudSettings')?.addEventListener('click', () => this.openSettings());
        document.getElementById('btnHudQuit')?.addEventListener('click', () => this.pauseGame());
        document.getElementById('btnHudPause')?.addEventListener('click', () => this.pauseGame());
        document.getElementById('btnResume')?.addEventListener('click', () => this.resumeGame());
        document.getElementById('btnRestart')?.addEventListener('click', () => this.startGame());
        document.getElementById('btnRetry')?.addEventListener('click', () => this.startGame());
        document.getElementById('btnHomeFromPause')?.addEventListener('click', () => this.openMenu());
        document.getElementById('btnHomeFromOver')?.addEventListener('click', () => this.openMenu());
        document.getElementById('btnFlareHUD')?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.triggerFlare();
        });
    }

    updateTouchVector() {
        const dx = this.touchData.curX - this.touchData.startX;
        const dy = this.touchData.curY - this.touchData.startY;
        const dist = Math.hypot(dx, dy);

        if (dist > 20) {
            this.inputVector.angle = Math.atan2(dy, dx);
            this.inputVector.active = true;
        }
    }

    pollKeyboard() {
        let kx = 0;
        let ky = 0;

        if (this.keys['ArrowUp'] || this.keys['KeyW']) ky -= 1;
        if (this.keys['ArrowDown'] || this.keys['KeyS']) ky += 1;
        if (this.keys['ArrowLeft'] || this.keys['KeyA']) kx -= 1;
        if (this.keys['ArrowRight'] || this.keys['KeyD']) kx += 1;

        if (kx !== 0 || ky !== 0) {
            this.inputVector.angle = Math.atan2(ky, kx);
            this.inputVector.active = true;
        } else if (!this.touchData.active) {
            this.inputVector.active = false;
        }
    }

    triggerFlare() {
        if (!this.player || !this.player.alive) return;
        if (this.player.deployFlare()) {
            soundEngine.playFlare();
            storage.recordStats({ flaresUsed: 1 });

            this.flares.push(new DecoyFlare(this.player.x, this.player.y, this.player.angle));
            this.flares.push(new DecoyFlare(this.player.x, this.player.y, this.player.angle));

            this.particles.addFloatingText('FLARE DEPLOYED', this.player.x, this.player.y - 45, '#ffaa00', 24);
            this.updateHUD();
        }
    }

    startGame() {
        soundEngine.resume();
        soundEngine.startMusic();

        this.score = 0;
        this.survivalTime = 0;
        this.coinsCollected = 0;
        this.missilesDodged = 0;
        this.nearMissCount = 0;
        this.combo = 1;
        this.comboTimer = 0;
        this.spawnTimer = 1.0;
        this.coinSpawnTimer = 0;
        this.lastMilestone = 0;
        this.missiles = [];
        this.flares = [];
        this.powerups = [];
        this.particles.clear();

        this.player = new Player(
            storage.getSelectedShip(),
            storage.data.ships[storage.getSelectedShip()]?.level || 1,
            storage.data.upgrades,
            this.images
        );
        this.player.reset(0, 0, true); // Randomize plane every flight!
        this.particles.addFloatingText(`${this.player.spec.name}`, 0, -60, '#00f0ff', 30);

        // Spawn initial nearby powerups & stars
        this.spawnPowerUp('boost', 550);
        this.spawnPowerUp('shield', 750);
        this.spawnPowerUp('life', 950);
        for (let i = 0; i < 15; i++) {
            this.spawnPowerUp('coin', 400 + Math.random() * 1200);
        }

        this.setState('PLAYING');
        this.updateHUD();
    }

    pauseGame() {
        if (this.state !== 'PLAYING') return;
        this.setState('PAUSED');
        soundEngine.updateEngineSound(false);
    }

    resumeGame() {
        if (this.state !== 'PAUSED') return;
        this.setState('PLAYING');
    }

    openMenu() {
        this.setState('MENU');
        soundEngine.stopMusic();
        soundEngine.updateEngineSound(false);
        this.updateMenuUI();
    }

    openSettings() {
        const modal = document.getElementById('settingsModal');
        if (modal) modal.classList.remove('hidden');
    }

    gameOver() {
        this.setState('GAMEOVER');
        soundEngine.stopMusic();
        soundEngine.updateEngineSound(false);

        const isNewHigh = storage.setHighScore(this.score);
        storage.addCoins(this.coinsCollected);
        storage.recordStats({
            missilesDodged: this.missilesDodged,
            nearMisses: this.nearMissCount
        });

        // Update Game Over Modal UI
        document.getElementById('finalScore').textContent = Math.floor(this.score);
        document.getElementById('bestScore').textContent = storage.getHighScore();
        document.getElementById('statTime').textContent = this.formatTime(this.survivalTime);
        document.getElementById('statDodged').textContent = this.missilesDodged;
        document.getElementById('statCoins').textContent = `+${this.coinsCollected} ★`;

        const newHighBadge = document.getElementById('newHighBadge');
        if (newHighBadge) {
            newHighBadge.style.display = isNewHigh ? 'block' : 'none';
        }

        const gameSummary = {
            score: Math.floor(this.score),
            survivalTime: this.survivalTime,
            formattedTime: this.formatTime(this.survivalTime),
            stars: this.coinsCollected,
            missilesDodged: this.missilesDodged,
            nearMisses: this.nearMissCount,
            planeName: this.player?.spec?.name || 'Fighter Jet'
        };

        // 1. Submit score to external API (sendscoreapi.js)
        if (typeof window.sendScoreToApi === 'function') {
            window.sendScoreToApi(gameSummary);
        }

        // 2. Trigger Game Over URL Redirection if enabled (gameover.js)
        if (typeof window.handleGameOverRedirect === 'function') {
            window.handleGameOverRedirect(gameSummary);
        }
    }

    setState(newState) {
        this.state = newState;
        document.getElementById('mainMenu').classList.toggle('hidden', newState !== 'MENU');
        document.getElementById('inGameHUD').classList.toggle('hidden', newState !== 'PLAYING' && newState !== 'PAUSED');
        document.getElementById('pauseModal').classList.toggle('hidden', newState !== 'PAUSED');
        document.getElementById('gameOverModal').classList.toggle('hidden', newState !== 'GAMEOVER');
    }

    formatTime(totalSeconds) {
        const mins = Math.floor(totalSeconds / 60);
        const secs = Math.floor(totalSeconds % 60);
        return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }

    updateMenuUI() {
        document.getElementById('menuHighScore').textContent = storage.getHighScore();
        document.getElementById('menuCoins').textContent = `${storage.getCoins()} ★`;
    }

    triggerCelebration(title, subtitle) {
        const popup = document.getElementById('hudCelebration');
        const titleEl = document.getElementById('celebTitle');
        const subEl = document.getElementById('celebSub');

        if (popup && titleEl && subEl) {
            titleEl.textContent = title;
            subEl.textContent = subtitle;
            popup.style.display = 'flex';

            if (this.celebTimer) clearTimeout(this.celebTimer);
            this.celebTimer = setTimeout(() => {
                popup.style.display = 'none';
            }, 1800);
        }

        soundEngine.playFanfare();
        if (this.player) {
            this.particles.addCelebrationBurst(this.player.x, this.player.y);
        }
    }

    updateHUD() {
        if (!this.player) return;
        document.getElementById('hudScore').textContent = Math.floor(this.score);
        document.getElementById('hudTimer').textContent = this.formatTime(this.survivalTime);
        document.getElementById('hudCoins').textContent = `${this.coinsCollected} ★`;
        document.getElementById('hudFlares').textContent = this.player.flares;

        // Render Hearts / Lives (Always 3 Hearts)
        const livesContainer = document.getElementById('hudLives');
        if (livesContainer) {
            let heartsHtml = '';
            for (let i = 0; i < 3; i++) {
                heartsHtml += i < this.player.health ? '❤️ ' : '🖤 ';
            }
            livesContainer.innerHTML = heartsHtml;
        }

        // Shield Status
        const shieldEl = document.getElementById('hudShield');
        if (shieldEl) {
            shieldEl.classList.toggle('active', this.player.hasShield);
            shieldEl.title = this.player.hasShield ? 'Shield: Active (Absorbs 1 Hit)' : 'Shield: Inactive';
        }

        const comboEl = document.getElementById('hudCombo');
        if (comboEl) {
            if (this.combo > 1) {
                comboEl.style.display = 'block';
                comboEl.textContent = `x${this.combo} MULTIPLIER!`;
            } else {
                comboEl.style.display = 'none';
            }
        }
    }

    spawnMissile() {
        if (!this.player || !this.player.alive) return;

        // Spawn around player in infinite sky
        const margin = 180;
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.hypot(this.camera.width / 2, this.camera.height / 2) + margin;

        const x = this.player.x + Math.cos(angle) * dist;
        const y = this.player.y + Math.sin(angle) * dist;

        // Random missile types: seeker, fast, swarmer, spiral, mothership
        const types = ['seeker', 'fast', 'swarmer', 'spiral'];
        if (this.score > 350 || this.survivalTime > 20) {
            types.push('mothership');
        }
        const randType = types[Math.floor(Math.random() * types.length)];

        const missile = new Missile(x, y, randType, this.images);
        this.missiles.push(missile);

        soundEngine.playMissileLaunch();
    }

    spawnPowerUp(forceType = null, customDist = null) {
        if (!this.player) return;

        let type = forceType;
        if (!type) {
            const r = Math.random();
            if (r < 0.22) type = 'shield';       // High chance of shield for life protection
            else if (r < 0.40) type = 'life';    // Extra life recovery
            else if (r < 0.58) type = 'boost';   // Super rocket boost (2s forward surge!)
            else if (r < 0.72) type = 'emp';     // Screen-clearing EMP
            else if (r < 0.84) type = 'flare';   // Flare restock
            else type = 'coin';                  // Stars currency
        }

        // Spawn in direction of flight or around player
        const baseAngle = this.player.angle + (Math.random() - 0.5) * 1.6;
        const dist = customDist || (800 + Math.random() * 1200);

        const x = this.player.x + Math.cos(baseAngle) * dist;
        const y = this.player.y + Math.sin(baseAngle) * dist;

        this.powerups.push(new PowerUp(x, y, type, this.images));
    }

    detonateEMP() {
        soundEngine.playEMP();
        this.particles.addShockwave(this.player.x, this.player.y, 1800, 0.9, '#00ffff');
        this.particles.addFloatingText('EMP DETONATED!', this.player.x, this.player.y - 60, '#00ffff', 32);
        this.triggerCelebration('EMP WIPEOUT! ⚡⚡', 'ALL INCOMING MISSILES OBLITERATED!');

        for (const m of this.missiles) {
            if (m.alive) {
                m.alive = false;
                this.missilesDodged++;
                this.score += 80 * this.combo;
                this.particles.addExplosion(m.x, m.y, false, this.images['explosion.png']);
            }
        }
        this.missiles = [];
        this.updateHUD();
    }

    checkCollisions() {
        if (!this.player || !this.player.alive) return;

        // 1. Missiles vs Flares & Asteroids & Player
        for (let i = this.missiles.length - 1; i >= 0; i--) {
            const m = this.missiles[i];
            if (!m.alive) continue;

            // Flare interception
            for (let f = this.flares.length - 1; f >= 0; f--) {
                const flare = this.flares[f];
                const dFlare = Math.hypot(m.x - flare.x, m.y - flare.y);
                if (dFlare < m.radius + flare.radius + 10) {
                    m.alive = false;
                    flare.life = 0;
                    this.particles.addExplosion(m.x, m.y, false, this.images['explosion.png']);
                    soundEngine.playExplosion(false);
                    this.missilesDodged++;
                    this.score += 60 * this.combo;
                    this.particles.addFloatingText('+60 DECOYED', m.x, m.y, '#ffaa00', 22);
                    break;
                }
            }
            if (!m.alive) continue;

            // Asteroid impact
            for (const ast of this.asteroids) {
                const dAst = Math.hypot(m.x - ast.x, m.y - ast.y);
                if (dAst < m.radius + ast.radius) {
                    m.alive = false;
                    this.particles.addExplosion(m.x, m.y, false, this.images['explosion.png']);
                    soundEngine.playExplosion(false);
                    this.missilesDodged++;
                    this.score += 80 * this.combo;
                    this.particles.addFloatingText('+80 IMPACT', m.x, m.y, '#88ccff', 22);
                    break;
                }
            }
            if (!m.alive) continue;

            // Player Collision (With Multi-Life & Shield Protection!)
            const dPlayer = Math.hypot(m.x - this.player.x, m.y - this.player.y);

            if (dPlayer < m.radius + this.player.radius) {
                // If player is super boosting, ram and obliterate the missile!
                if (this.player.boostTimer > 0) {
                    m.alive = false;
                    this.missilesDodged++;
                    this.score += 150 * this.combo;
                    soundEngine.playExplosion(false);
                    this.particles.addExplosion(m.x, m.y, false, this.images['explosion.png']);
                    this.particles.addFloatingText('BOOST SMASH! +150', m.x, m.y, '#ffaa00', 26);
                    continue;
                }

                const hitResult = this.player.takeDamage();

                if (hitResult === 'shield_absorbed') {
                    m.alive = false;
                    soundEngine.playShieldHit();
                    this.particles.addExplosion(m.x, m.y, false, this.images['explosion.png']);
                    this.particles.addShockwave(this.player.x, this.player.y, 250, 0.45, '#00ffff');
                    this.particles.addFloatingText('SHIELD DEFLECTED HIT!', this.player.x, this.player.y - 50, '#00ffff', 28);
                    this.updateHUD();
                } else if (hitResult === 'damaged') {
                    m.alive = false;
                    soundEngine.playExplosion(false);
                    this.particles.addExplosion(m.x, m.y, true, this.images['explosion.png']);
                    this.particles.addShockwave(this.player.x, this.player.y, 320, 0.55, '#ff3344');
                    this.particles.addFloatingText(`HULL HIT! ${this.player.health} LIVES LEFT`, this.player.x, this.player.y - 50, '#ff3344', 30);
                    this.updateHUD();
                } else if (hitResult === 'dead') {
                    m.alive = false;
                    soundEngine.playExplosion(true);
                    this.particles.addExplosion(this.player.x, this.player.y, true, this.images['explosion_big.png']);
                    this.gameOver();
                    return;
                }
            } else if (dPlayer < this.player.nearMissRadius && !m.nearMissed) {
                // Near-miss trigger zone!
                m.nearMissed = true;
                this.nearMissCount++;
                this.combo = Math.min(this.combo + 1, 8);
                this.comboTimer = 3.5;
                const bonus = 60 * this.combo;
                this.score += bonus;
                soundEngine.playNearMiss();
                this.particles.addFloatingText(`NEAR MISS! +${bonus}`, this.player.x, this.player.y - 45, '#ffff00', 26);
                if (this.combo === 3) {
                    this.triggerCelebration('INSANE DODGE! ⚡', 'x3 COMBO MULTIPLIER!');
                } else if (this.combo === 5) {
                    this.triggerCelebration('BAHOBAH! UNTOUCHABLE! 🔥', 'x5 SUPER COMBO!');
                } else if (this.combo === 8) {
                    this.triggerCelebration('LEGENDARY PILOT! 🎯', 'x8 MAXIMUM MULTIPLIER!');
                }
                this.updateHUD();
            }
        }

        // 2. Missile vs Missile Collision
        for (let i = 0; i < this.missiles.length; i++) {
            const m1 = this.missiles[i];
            if (!m1.alive) continue;
            for (let j = i + 1; j < this.missiles.length; j++) {
                const m2 = this.missiles[j];
                if (!m2.alive) continue;

                const dist = Math.hypot(m1.x - m2.x, m1.y - m2.y);
                if (dist < m1.radius + m2.radius + 8) {
                    m1.alive = false;
                    m2.alive = false;
                    const midX = (m1.x + m2.x) / 2;
                    const midY = (m1.y + m2.y) / 2;
                    this.particles.addExplosion(midX, midY, true, this.images['explosion_big.png']);
                    soundEngine.playExplosion(true);
                    this.missilesDodged += 2;
                    this.score += 250 * this.combo;
                    this.particles.addFloatingText(`DOUBLE KILL! +${250 * this.combo}`, midX, midY, '#ff3366', 28);
                    const killPraises = [
                        ['DOUBLE KILL! 💥', `+${250 * this.combo} BONUS PTS!`],
                        ['OUTPLAYED! 🤯', 'MISSILES COLLIDED!'],
                        ['BAHOBAH! SHABASH! 🎆', 'SPECTACULAR DODGE!']
                    ];
                    const kp = killPraises[Math.floor(Math.random() * killPraises.length)];
                    this.triggerCelebration(kp[0], kp[1]);
                    this.updateHUD();
                }
            }
        }

        this.missiles = this.missiles.filter(m => m.alive);

        // 3. Player vs PowerUps
        for (let i = this.powerups.length - 1; i >= 0; i--) {
            const p = this.powerups[i];
            const dist = Math.hypot(this.player.x - p.x, this.player.y - p.y);
            if (dist < this.player.radius + p.radius) {
                if (p.type === 'coin') {
                    this.coinsCollected += 10;
                    this.score += 30;
                    soundEngine.playCoin();
                    this.particles.addFloatingText('+10 ★', p.x, p.y, '#ffd700', 24);
                    const starCount = Math.floor(this.coinsCollected / 10);
                    if (starCount % 5 === 0) {
                        const praises = [
                            ['BAHOBAH! SHABASH! 🌟', `${this.coinsCollected} SPACE STARS!`],
                            ['SUPERSTAR! ★', 'INCREDIBLE FLYING!'],
                            ['STAR COLLECTOR! 💎', 'UNSTOPPABLE RUN!'],
                            ['SHABASH PILOT! 🚀', 'SKY RECORD SMASHER!']
                        ];
                        const pr = praises[Math.floor(Math.random() * praises.length)];
                        this.triggerCelebration(pr[0], pr[1]);
                    }
                } else if (p.type === 'shield') {
                    this.player.hasShield = true;
                    soundEngine.playCoin();
                    this.particles.addFloatingText('ENERGY SHIELD ACTIVE!', p.x, p.y, '#00f0ff', 28);
                } else if (p.type === 'life') {
                    this.player.heal(1);
                    soundEngine.playCoin();
                    this.particles.addFloatingText('+1 EXTRA LIFE! ❤️', p.x, p.y, '#00ff88', 30);
                } else if (p.type === 'boost') {
                    this.player.activateBoost(2.0);
                    soundEngine.playBoost();
                    this.particles.addShockwave(this.player.x, this.player.y, 300, 0.4, '#ff7700');
                    this.particles.addFloatingText('SUPER BOOST! 🚀 2s', this.player.x, this.player.y - 55, '#ff9900', 30);
                    this.triggerCelebration('SUPER BOOST! 🚀', 'SUPERSONIC SURGE (2s)!');
                } else if (p.type === 'emp') {
                    this.detonateEMP();
                } else if (p.type === 'flare') {
                    this.player.flares = Math.min(this.player.flares + 2, this.player.maxFlares + 2);
                    soundEngine.playCoin();
                    this.particles.addFloatingText('+2 FLARES!', p.x, p.y, '#ffaa00', 26);
                }
                this.powerups.splice(i, 1);
                this.updateHUD();
            }
        }
    }

    update(dt) {
        if (this.state !== 'PLAYING') return;

        this.survivalTime += dt;
        this.score += dt * 15 * this.combo;

        const currentMilestone = Math.floor(this.score / 500);
        if (currentMilestone > this.lastMilestone && currentMilestone > 0) {
            this.lastMilestone = currentMilestone;
            this.triggerCelebration('AWESOME! 🔥', `${this.lastMilestone * 500} POINTS SURPASS!`);
        }

        if (this.combo > 1) {
            this.comboTimer -= dt;
            if (this.comboTimer <= 0) {
                this.combo = 1;
                this.updateHUD();
            }
        }

        // Input & Player Update (Infinite Sky Flight)
        this.pollKeyboard();
        this.player.update(dt, this.inputVector, this.particles);
        soundEngine.updateEngineSound(this.player.alive, this.player.speed / 480);

        // Infinite Camera Centering
        this.camera.x = this.player.x - this.camera.width / 2;
        this.camera.y = this.player.y - this.camera.height / 2;

        // Clouds infinite wrapping
        for (const cloud of this.clouds) {
            cloud.update(dt, this.camera.x, this.camera.y, this.camera.width, this.camera.height);
        }

        // Flares
        for (let i = this.flares.length - 1; i >= 0; i--) {
            if (!this.flares[i].update(dt, this.particles)) {
                this.flares.splice(i, 1);
            }
        }

        // Missiles tracking
        let nearestMissileDist = Infinity;
        for (const m of this.missiles) {
            let target = this.player;
            let bestDist = Math.hypot(this.player.x - m.x, this.player.y - m.y);

            for (const flare of this.flares) {
                const flareDist = Math.hypot(flare.x - m.x, flare.y - m.y);
                if (flareDist < 480 && flareDist < bestDist) {
                    target = flare;
                    bestDist = flareDist;
                }
            }

            m.update(dt, target, this.player, this.particles);

            const dPlayer = Math.hypot(m.x - this.player.x, m.y - this.player.y);
            if (dPlayer < nearestMissileDist) nearestMissileDist = dPlayer;
        }

        if (nearestMissileDist < 440 && performance.now() - this.lastWarningSoundTime > 600) {
            soundEngine.playWarning();
            this.lastWarningSoundTime = performance.now();
        }

        // Asteroids wrapping around player
        for (const ast of this.asteroids) {
            ast.update(dt, this.player);
        }

        // Powerups updating
        for (let i = this.powerups.length - 1; i >= 0; i--) {
            if (!this.powerups[i].update(dt, this.player)) {
                this.powerups.splice(i, 1);
            }
        }

        // Missile Spawner
        this.spawnTimer -= dt;
        const currentInterval = Math.max(0.9, this.baseSpawnInterval - (this.survivalTime * 0.02));
        if (this.spawnTimer <= 0) {
            this.spawnTimer = currentInterval;
            this.spawnMissile();
        }

        // Life-Saving Powerup Spawner (regular signals for protection!)
        this.powerupSpawnTimer -= dt;
        if (this.powerupSpawnTimer <= 0) {
            this.powerupSpawnTimer = 9.0; // Every 9 seconds spawn a life-saver powerup nearby!
            this.spawnPowerUp();
        }

        // Stars Spawner
        this.coinSpawnTimer -= dt;
        if (this.coinSpawnTimer <= 0) {
            this.coinSpawnTimer = 3.5;
            if (this.powerups.filter(p => p.type === 'coin').length < 24) {
                this.spawnPowerUp('coin');
            }
        }

        this.checkCollisions();
        this.particles.update(dt);
        this.updateHUD();
    }

    renderRadarWarnings() {
        if (!this.player || !this.player.alive) return;

        const pad = 48;
        const viewL = this.camera.x;
        const viewR = this.camera.x + this.camera.width;
        const viewT = this.camera.y;
        const viewB = this.camera.y + this.camera.height;

        // 1. Red Radar Warning Arrows for Incoming Missiles
        for (const m of this.missiles) {
            if (m.x >= viewL && m.x <= viewR && m.y >= viewT && m.y <= viewB) {
                continue;
            }

            const cx = viewL + this.camera.width / 2;
            const cy = viewT + this.camera.height / 2;
            const dx = m.x - cx;
            const dy = m.y - cy;
            const angle = Math.atan2(dy, dx);

            const halfW = (this.camera.width / 2) - pad;
            const halfH = (this.camera.height / 2) - pad;

            let edgeX = 0;
            let edgeY = 0;
            const slope = dy / (dx || 0.0001);

            if (Math.abs(slope) < halfH / halfW) {
                edgeX = dx > 0 ? halfW : -halfW;
                edgeY = edgeX * slope;
            } else {
                edgeY = dy > 0 ? halfH : -halfH;
                edgeX = edgeY / slope;
            }

            const screenX = this.camera.width / 2 + edgeX;
            const screenY = this.camera.height / 2 + edgeY;

            this.ctx.save();
            this.ctx.translate(screenX, screenY);
            this.ctx.rotate(angle);

            const pulse = 0.7 + Math.sin(performance.now() * 0.014) * 0.3;
            this.ctx.fillStyle = m.type === 'mothership' ? '#aa00ff' : '#ff1133';
            this.ctx.shadowColor = '#ff0000';
            this.ctx.shadowBlur = 16;
            this.ctx.globalAlpha = pulse;

            this.ctx.beginPath();
            this.ctx.moveTo(22, 0);
            this.ctx.lineTo(-14, -14);
            this.ctx.lineTo(-6, 0);
            this.ctx.lineTo(-14, 14);
            this.ctx.closePath();
            this.ctx.fill();

            this.ctx.restore();
        }

        // 2. Power-Up Directional Signals ("signal dibe je edike jaw edike powerr ase")
        for (const p of this.powerups) {
            // Signal arrows for life-saving powerups (Shield, Life, EMP, Flare, Stars)
            if (p.x >= viewL && p.x <= viewR && p.y >= viewT && p.y <= viewB) {
                continue;
            }

            const dist = Math.hypot(p.x - this.player.x, p.y - this.player.y);
            if (dist > 3200) continue; // Only signal nearby powerups

            const cx = viewL + this.camera.width / 2;
            const cy = viewT + this.camera.height / 2;
            const dx = p.x - cx;
            const dy = p.y - cy;
            const angle = Math.atan2(dy, dx);

            const halfW = (this.camera.width / 2) - 60;
            const halfH = (this.camera.height / 2) - 60;

            let edgeX = 0;
            let edgeY = 0;
            const slope = dy / (dx || 0.0001);

            if (Math.abs(slope) < halfH / halfW) {
                edgeX = dx > 0 ? halfW : -halfW;
                edgeY = edgeX * slope;
            } else {
                edgeY = dy > 0 ? halfH : -halfH;
                edgeX = edgeY / slope;
            }

            const screenX = this.camera.width / 2 + edgeX;
            const screenY = this.camera.height / 2 + edgeY;

            this.ctx.save();
            this.ctx.translate(screenX, screenY);

            // Glowing Beacon Arrow
            this.ctx.save();
            this.ctx.rotate(angle);
            this.ctx.fillStyle = p.color;
            this.ctx.shadowColor = p.color;
            this.ctx.shadowBlur = 18;
            this.ctx.globalAlpha = 0.85;

            this.ctx.beginPath();
            this.ctx.moveTo(24, 0);
            this.ctx.lineTo(-12, -12);
            this.ctx.lineTo(-4, 0);
            this.ctx.lineTo(-12, 12);
            this.ctx.closePath();
            this.ctx.fill();
            this.ctx.restore();

            // Beacon Text & Distance Badge
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = '700 16px "Orbitron", sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.shadowColor = '#000000';
            this.ctx.shadowBlur = 8;
            const distMeters = Math.floor(dist / 10);
            this.ctx.fillText(`${p.icon} ${distMeters}m`, 0, -22);

            this.ctx.restore();
        }
    }

    render() {
        this.ctx.clearRect(0, 0, this.VIRTUAL_WIDTH, this.VIRTUAL_HEIGHT);

        if (this.state === 'MENU' || this.state === 'HANGAR') {
            this.renderMenuBackground();
            return;
        }

        // 1. Procedural Infinite Sky Gradient
        this.renderInfiniteSky();

        this.ctx.save();
        this.ctx.translate(-this.camera.x, -this.camera.y);

        // 2. Low-altitude clouds
        for (const c of this.clouds) {
            if (c.layer === 'low') c.render(this.ctx);
        }

        // 3. Mid-altitude clouds
        for (const c of this.clouds) {
            if (c.layer === 'mid') c.render(this.ctx);
        }

        // 4. Asteroids
        for (const ast of this.asteroids) {
            ast.render(this.ctx);
        }

        // 5. Powerups
        for (const p of this.powerups) {
            p.render(this.ctx);
        }

        // 6. Flares
        for (const f of this.flares) {
            f.render(this.ctx);
        }

        // 7. Missiles
        for (const m of this.missiles) {
            m.render(this.ctx);
        }

        // 8. Player Aircraft
        if (this.player) {
            this.player.render(this.ctx);
        }

        // 9. High-altitude clouds
        for (const c of this.clouds) {
            if (c.layer === 'high') c.render(this.ctx);
        }

        // 10. Particles
        this.particles.render(this.ctx);

        this.ctx.restore();

        // 11. Radar Warnings & Life-Saving Powerup Signals
        this.renderRadarWarnings();

        // 12. Virtual Joystick Visual
        if (this.touchData.active && this.state === 'PLAYING') {
            this.renderVirtualJoystick();
        }
    }

    renderMenuBackground() {
        const bg = this.images['background_menu.png'] || this.images['background_menu.jpg'];
        if (bg && bg.complete) {
            this.ctx.drawImage(bg, 0, 0, this.VIRTUAL_WIDTH, this.VIRTUAL_HEIGHT);
        } else {
            this.ctx.fillStyle = '#0a1a35';
            this.ctx.fillRect(0, 0, this.VIRTUAL_WIDTH, this.VIRTUAL_HEIGHT);
        }
    }

    renderInfiniteSky() {
        // Continuous Sky Gradient
        const skyGrad = this.ctx.createLinearGradient(0, 0, 0, this.camera.height);
        skyGrad.addColorStop(0, '#092548');
        skyGrad.addColorStop(0.35, '#12487e');
        skyGrad.addColorStop(0.70, '#2770b2');
        skyGrad.addColorStop(1, '#539ee0');

        this.ctx.fillStyle = skyGrad;
        this.ctx.fillRect(0, 0, this.camera.width, this.camera.height);

        // Infinite Grid navigation markers
        this.ctx.save();
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
        this.ctx.lineWidth = 2;
        const gridSize = 300;

        const offsetX = -((this.camera.x % gridSize) + gridSize) % gridSize;
        const offsetY = -((this.camera.y % gridSize) + gridSize) % gridSize;

        for (let x = offsetX; x <= this.camera.width; x += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.camera.height);
            this.ctx.stroke();
        }

        for (let y = offsetY; y <= this.camera.height; y += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.camera.width, y);
            this.ctx.stroke();
        }
        this.ctx.restore();
    }

    renderVirtualJoystick() {
        const sx = this.touchData.startX;
        const sy = this.touchData.startY;
        const cx = this.touchData.curX;
        const cy = this.touchData.curY;

        const maxDist = 90;
        const dx = cx - sx;
        const dy = cy - sy;
        const dist = Math.hypot(dx, dy);
        const stickX = sx + (dist > maxDist ? (dx / dist) * maxDist : dx);
        const stickY = sy + (dist > maxDist ? (dy / dist) * maxDist : dy);

        this.ctx.save();
        this.ctx.strokeStyle = 'rgba(0, 240, 255, 0.5)';
        this.ctx.fillStyle = 'rgba(0, 40, 80, 0.35)';
        this.ctx.lineWidth = 4;
        this.ctx.beginPath();
        this.ctx.arc(sx, sy, maxDist, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.stroke();

        this.ctx.fillStyle = 'rgba(0, 240, 255, 0.9)';
        this.ctx.shadowColor = '#00f0ff';
        this.ctx.shadowBlur = 18;
        this.ctx.beginPath();
        this.ctx.arc(stickX, stickY, 32, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();
    }

    gameLoop(time) {
        const dt = Math.min((time - this.lastTime) / 1000, 0.1);
        this.lastTime = time;

        this.update(dt);
        this.render();

        requestAnimationFrame((t) => this.gameLoop(t));
    }
}

window.addEventListener('DOMContentLoaded', () => {
    window.gameInstance = new MissileEscapeGame();
});

