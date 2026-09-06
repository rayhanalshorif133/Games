/**
 * Froggy Cross the Road - Infinite / Endless Runner
 * Complete procedural engine with row pooling, discrete 1-unit grid hopping,
 * forward-only camera, car/train hazards, log rivers, audio synth, and touch/keyboard controls.
 */

(function () {
    'use strict';

    // =========================================================================
    // 1. CONFIGURATION & CONSTANTS
    // =========================================================================
    const CANVAS_WIDTH = 1080;
    const CANVAS_HEIGHT = 1920;
    const GRID_COLS = 9;
    const CELL_SIZE = CANVAS_WIDTH / GRID_COLS; // 120px
    const ROW_HEIGHT = CELL_SIZE;               // 120px
    const PLAYER_START_ROW = 0;                 // Starts at Row 0 in the safe starting park
    const PLAYER_START_COL = 4;                 // Center column (0..8)
    const PLAYER_SCREEN_Y = 1420;               // Anchor screen Y (lower 74% of 1920px canvas)
    const HOP_DURATION = 0.16;                  // Seconds per hop
    const HOP_HEIGHT = 50;                      // Peak Z elevation in pixels
    const MAX_IDLE_SECONDS = 7.0;               // Base idle allowance before eagle arrives

    // Row Types
    const ROW_TYPES = {
        GRASS: 'grass',
        ROAD: 'road',
        RIVER: 'river',
        TRAIN: 'train'
    };

    // Directions
    const DIR = {
        UP: { col: 0, row: 1, angle: 0 },
        DOWN: { col: 0, row: -1, angle: Math.PI },
        LEFT: { col: -1, row: 0, angle: -Math.PI / 2 },
        RIGHT: { col: 1, row: 0, angle: Math.PI / 2 }
    };

    // =========================================================================
    // 2. AUDIO SYNTHESIZER (Web Audio API - 100% Procedural & Reliable)
    // =========================================================================
    class SoundEngine {
        constructor() {
            this.ctx = null;
            this.enabled = true;
        }

        init() {
            if (!this.ctx) {
                const AudioCtx = window.AudioContext || window.webkitAudioContext;
                if (AudioCtx) {
                    this.ctx = new AudioCtx();
                }
            }
            if (this.ctx && this.ctx.state === 'suspended') {
                this.ctx.resume();
            }
        }

        playHop() {
            if (!this.enabled) return;
            this.init();
            if (!this.ctx) return;
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(220, now);
            osc.frequency.exponentialRampToValueAtTime(580, now + 0.1);

            gain.gain.setValueAtTime(0.28, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now);
            osc.stop(now + 0.13);
        }

        playBump() {
            if (!this.enabled) return;
            this.init();
            if (!this.ctx) return;
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(140, now);
            osc.frequency.exponentialRampToValueAtTime(60, now + 0.08);

            gain.gain.setValueAtTime(0.3, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.09);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now);
            osc.stop(now + 0.1);
        }

        playSplash() {
            if (!this.enabled) return;
            this.init();
            if (!this.ctx) return;
            const now = this.ctx.currentTime;
            const bufferSize = this.ctx.sampleRate * 0.35;
            const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }

            const noise = this.ctx.createBufferSource();
            noise.buffer = buffer;

            const filter = this.ctx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.setValueAtTime(600, now);
            filter.frequency.exponentialRampToValueAtTime(120, now + 0.35);
            filter.Q.setValueAtTime(3.0, now);

            const gain = this.ctx.createGain();
            gain.gain.setValueAtTime(0.4, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

            noise.connect(filter);
            filter.connect(gain);
            gain.connect(this.ctx.destination);

            noise.start(now);
        }

        playCrash() {
            if (!this.enabled) return;
            this.init();
            if (!this.ctx) return;
            const now = this.ctx.currentTime;

            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(180, now);
            osc.frequency.exponentialRampToValueAtTime(35, now + 0.4);

            gain.gain.setValueAtTime(0.45, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);

            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.45);

            const honk = this.ctx.createOscillator();
            const honkGain = this.ctx.createGain();
            honk.type = 'square';
            honk.frequency.setValueAtTime(310, now);
            honk.frequency.setValueAtTime(370, now + 0.1);
            honkGain.gain.setValueAtTime(0.2, now);
            honkGain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

            honk.connect(honkGain);
            honkGain.connect(this.ctx.destination);
            honk.start(now);
            honk.stop(now + 0.3);
        }

        playTrainWarning() {
            if (!this.enabled) return;
            this.init();
            if (!this.ctx) return;
            const now = this.ctx.currentTime;

            [1200, 1500].forEach((freq) => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, now);
                gain.gain.setValueAtTime(0.18, now);
                gain.gain.exponentialRampToValueAtTime(0.005, now + 0.2);

                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(now);
                osc.stop(now + 0.22);
            });
        }

        playTrainWhoosh() {
            if (!this.enabled) return;
            this.init();
            if (!this.ctx) return;
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(80, now);
            osc.frequency.linearRampToValueAtTime(140, now + 0.4);
            osc.frequency.exponentialRampToValueAtTime(40, now + 0.8);

            gain.gain.setValueAtTime(0.01, now);
            gain.gain.linearRampToValueAtTime(0.45, now + 0.3);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.8);

            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.85);
        }

        playEagle() {
            if (!this.enabled) return;
            this.init();
            if (!this.ctx) return;
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(800, now);
            osc.frequency.exponentialRampToValueAtTime(1600, now + 0.15);
            osc.frequency.exponentialRampToValueAtTime(400, now + 0.45);

            gain.gain.setValueAtTime(0.35, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.55);
        }

        playCoin() {
            if (!this.enabled) return;
            this.init();
            if (!this.ctx) return;
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(988, now);
            osc.frequency.setValueAtTime(1318, now + 0.08);

            gain.gain.setValueAtTime(0.25, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.28);
        }

        playGameOver() {
            if (!this.enabled) return;
            this.init();
            if (!this.ctx) return;
            const now = this.ctx.currentTime;
            const freqs = [440, 392, 349, 293];
            freqs.forEach((freq, idx) => {
                const noteTime = now + idx * 0.12;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(freq, noteTime);

                gain.gain.setValueAtTime(0.25, noteTime);
                gain.gain.exponentialRampToValueAtTime(0.01, noteTime + 0.22);

                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(noteTime);
                osc.stop(noteTime + 0.25);
            });
        }

        playDamage() {
            if (!this.enabled) return;
            this.init();
            if (!this.ctx) return;
            try {
                const now = this.ctx.currentTime;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(220, now);
                osc.frequency.exponentialRampToValueAtTime(50, now + 0.22);
                gain.gain.setValueAtTime(0.35, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(now);
                osc.stop(now + 0.23);
            } catch (e) {}
        }

        playRespawn() {
            if (!this.enabled) return;
            this.init();
            if (!this.ctx) return;
            try {
                const now = this.ctx.currentTime;
                [440, 554.37, 659.25, 880].forEach((freq, idx) => {
                    const osc = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();
                    osc.type = 'triangle';
                    osc.frequency.value = freq;
                    gain.gain.setValueAtTime(0.12, now + idx * 0.05);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.18);
                    osc.connect(gain);
                    gain.connect(this.ctx.destination);
                    osc.start(now + idx * 0.05);
                    osc.stop(now + idx * 0.05 + 0.19);
                });
            } catch (e) {}
        }
    }

    const sound = new SoundEngine();

    // =========================================================================
    // 3. ASSET MANAGER
    // =========================================================================
    class AssetManager {
        constructor() {
            this.images = {};
            this.loaded = false;
        }

        loadAll(callback) {
            const sources = {
                player: 'images/spr_player-sheet0.webp',
                carRed: 'images/spr_car-sheet2.webp',
                carBlue: 'images/spr_car-sheet1.webp',
                carYellow: 'images/spr_car-sheet0.webp',
                water: 'images/spr_water-sheet0.webp',
                wood: 'images/shared-0-sheet3.webp'
            };

            let pending = Object.keys(sources).length;
            let finished = false;

            const onDone = () => {
                if (!finished) {
                    finished = true;
                    this.loaded = true;
                    if (callback) callback();
                }
            };

            setTimeout(onDone, 1200);

            for (const key in sources) {
                const img = new Image();
                img.onload = () => {
                    this.images[key] = img;
                    pending--;
                    if (pending <= 0) onDone();
                };
                img.onerror = () => {
                    console.warn(`Could not load ${sources[key]}, using canvas procedural fallback.`);
                    pending--;
                    if (pending <= 0) onDone();
                };
                img.src = sources[key];
            }
        }
    }

    const assets = new AssetManager();

    // =========================================================================
    // 4. PARTICLES & VISUAL EFFECTS
    // =========================================================================
    class Particle {
        constructor() {
            this.active = false;
            this.x = 0;
            this.y = 0;
            this.vx = 0;
            this.vy = 0;
            this.size = 6;
            this.color = '#fff';
            this.alpha = 1;
            this.life = 0;
            this.maxLife = 0.5;
            this.isRing = false;
            this.isText = false;
            this.text = '';
        }

        init(x, y, vx, vy, size, color, maxLife, isRing = false, isText = false, text = '') {
            this.x = x;
            this.y = y;
            this.vx = vx;
            this.vy = vy;
            this.size = size;
            this.color = color;
            this.alpha = 1;
            this.life = 0;
            this.maxLife = maxLife || 0.4;
            this.isRing = isRing;
            this.isText = isText;
            this.text = text;
            this.active = true;
        }

        update(dt) {
            if (!this.active) return;
            this.life += dt;
            if (this.life >= this.maxLife) {
                this.active = false;
                return;
            }
            this.x += this.vx * dt;
            this.y += this.vy * dt;
            this.alpha = 1 - (this.life / this.maxLife);
        }

        render(ctx, cameraY) {
            if (!this.active) return;
            const screenY = PLAYER_SCREEN_Y - (this.y - cameraY);
            ctx.save();
            ctx.globalAlpha = Math.max(0, this.alpha);

            if (this.isText) {
                ctx.font = '900 36px sans-serif';
                ctx.fillStyle = this.color;
                ctx.textAlign = 'center';
                ctx.shadowColor = '#facc15';
                ctx.shadowBlur = 12;
                ctx.fillText(this.text, this.x, screenY);
            } else if (this.isRing) {
                const currentRadius = this.size + (this.life / this.maxLife) * 38;
                ctx.strokeStyle = this.color;
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(this.x, screenY, currentRadius, 0, Math.PI * 2);
                ctx.stroke();
            } else {
                ctx.fillStyle = this.color;
                ctx.beginPath();
                ctx.arc(this.x, screenY, this.size * this.alpha, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        }
    }

    class ParticlePool {
        constructor(size = 100) {
            this.pool = Array.from({ length: size }, () => new Particle());
        }

        spawn(x, y, vx, vy, size, color, maxLife, isRing = false, isText = false, text = '') {
            const p = this.pool.find(p => !p.active);
            if (p) {
                p.init(x, y, vx, vy, size, color, maxLife, isRing, isText, text);
            }
        }

        spawnHopDust(x, y) {
            for (let i = 0; i < 6; i++) {
                const angle = Math.random() * Math.PI * 2;
                const spd = 40 + Math.random() * 80;
                this.spawn(x, y, Math.cos(angle) * spd, Math.sin(angle) * spd, 8 + Math.random() * 6, '#a8e063', 0.25);
            }
        }

        spawnSplash(x, y) {
            for (let i = 0; i < 16; i++) {
                const angle = -Math.PI * 0.5 + (Math.random() - 0.5) * Math.PI;
                const spd = 80 + Math.random() * 180;
                this.spawn(x, y, Math.cos(angle) * spd, Math.sin(angle) * spd, 7 + Math.random() * 9, '#70d6ff', 0.45);
            }
            this.spawnWaterRipple(x, y);
        }

        spawnWaterRipple(x, y) {
            this.spawn(x, y, 0, 0, 16, 'rgba(186, 230, 253, 0.75)', 0.55, true);
        }

        spawnCoinSparkle(x, y) {
            for (let i = 0; i < 12; i++) {
                const angle = (i / 12) * Math.PI * 2 + Math.random() * 0.3;
                const spd = 60 + Math.random() * 120;
                this.spawn(x, y, Math.cos(angle) * spd, Math.sin(angle) * spd, 6 + Math.random() * 6, '#facc15', 0.5);
            }
            // Floating +5m indicator
            this.spawn(x, y, 0, -80, 0, '#fde047', 0.85, false, true, '+5m');
        }

        spawnCarPuff(x, y, dir) {
            for (let i = 0; i < 2; i++) {
                this.spawn(
                    x - dir * 40,
                    y + (Math.random() - 0.5) * 20,
                    -dir * (30 + Math.random() * 40),
                    (Math.random() - 0.5) * 30,
                    6 + Math.random() * 5,
                    'rgba(200, 200, 200, 0.6)',
                    0.3
                );
            }
        }

        update(dt) {
            this.pool.forEach(p => p.update(dt));
        }

        render(ctx, cameraY) {
            this.pool.forEach(p => p.render(ctx, cameraY));
        }
    }

    const particles = new ParticlePool();

    // =========================================================================
    // 5. PLAYER ENTITY (Discrete Grid + Hop Arc + Squash & Stretch)
    // =========================================================================
    class Player {
        constructor() {
            this.onCollectCoin = null;
            this.reset();
        }

        reset() {
            this.gridX = PLAYER_START_COL;
            this.gridY = PLAYER_START_ROW;
            this.worldX = this.gridX * CELL_SIZE + CELL_SIZE / 2;
            this.worldY = this.gridY * ROW_HEIGHT + ROW_HEIGHT / 2;

            this.prevWorldX = this.worldX;
            this.prevWorldY = this.worldY;
            this.targetWorldX = this.worldX;
            this.targetWorldY = this.worldY;

            this.z = 0;
            this.isHopping = false;
            this.hopProgress = 0;
            this.hopDirection = DIR.UP;
            this.facingAngle = 0;

            this.scaleX = 1;
            this.scaleY = 1;

            this.ridingLog = null;
            this.logOffsetX = 0;

            this.isDead = false;
            this.deathType = null;
            this.deathProgress = 0;

            this.highestRow = PLAYER_START_ROW;
            this.idleTimer = 0;
            this.lives = 3;
            this.invincibleTimer = 0;
        }

        respawn(world) {
            let safeRow = this.gridY;
            while (safeRow > 0) {
                const r = world ? world.rows.get(safeRow) : null;
                if (r && r.type === ROW_TYPES.GRASS) break;
                safeRow--;
            }
            this.gridY = Math.max(0, safeRow);
            this.gridX = 4;
            this.worldX = this.gridX * CELL_SIZE + CELL_SIZE / 2;
            this.worldY = this.gridY * ROW_HEIGHT + ROW_HEIGHT / 2;
            this.prevWorldX = this.worldX;
            this.prevWorldY = this.worldY;
            this.targetWorldX = this.worldX;
            this.targetWorldY = this.worldY;
            this.z = 0;
            this.isHopping = false;
            this.hopProgress = 0;
            this.ridingLog = null;
            this.isDead = false;
            this.deathType = null;
            this.deathProgress = 0;
            this.invincibleTimer = 2.2;
            this.idleTimer = 0;
            this.scaleX = 1;
            this.scaleY = 1;
            sound.playRespawn();
            particles.spawnHopDust(this.worldX, this.worldY);
        }

        tryHop(dir, world) {
            if (this.isDead || this.isHopping) return;

            // Backward movement is strictly blocked ("player back aste parbena")
            if (dir === DIR.DOWN || dir.row < 0) {
                sound.playBump();
                this.scaleX = 1.18;
                this.scaleY = 0.88;
                return;
            }

            let currentGridX = Math.round((this.worldX - CELL_SIZE / 2) / CELL_SIZE);
            currentGridX = Math.max(0, Math.min(GRID_COLS - 1, currentGridX));

            const nextGridX = currentGridX + dir.col;
            const nextGridY = this.gridY + dir.row;

            // Boundary clamping
            if (nextGridX < 0 || nextGridX >= GRID_COLS) {
                sound.playBump();
                this.scaleX = 1.25;
                this.scaleY = 0.8;
                return;
            }

            if (nextGridY < 0) {
                sound.playBump();
                return;
            }

            // Obstacle collision check (trees on grass)
            if (world && world.isTileBlocked(nextGridX, nextGridY)) {
                sound.playBump();
                this.scaleX = 1.25;
                this.scaleY = 0.8;
                return;
            }

            // Commit hop
            this.gridX = nextGridX;
            this.gridY = nextGridY;
            this.prevWorldX = this.worldX;
            this.prevWorldY = this.worldY;

            const targetRow = world ? world.rows.get(nextGridY) : null;
            if (targetRow && targetRow.type === ROW_TYPES.RIVER) {
                this.targetWorldX = Math.max(CELL_SIZE / 2, Math.min(CANVAS_WIDTH - CELL_SIZE / 2, this.prevWorldX + dir.col * CELL_SIZE));
            } else {
                this.targetWorldX = this.gridX * CELL_SIZE + CELL_SIZE / 2;
            }

            this.targetWorldY = this.gridY * ROW_HEIGHT + ROW_HEIGHT / 2;

            this.hopDirection = dir;
            this.facingAngle = dir.angle;
            this.isHopping = true;
            this.hopProgress = 0;
            this.ridingLog = null;
            this.idleTimer = 0;

            sound.playHop();
            particles.spawnHopDust(this.worldX, this.worldY);

            if (this.gridY > this.highestRow) {
                this.highestRow = this.gridY;
            }
        }

        update(dt, world, game) {
            if (this.invincibleTimer > 0) {
                this.invincibleTimer = Math.max(0, this.invincibleTimer - dt);
            }

            if (this.isDead) {
                this.deathProgress += dt;
                return;
            }

            this.idleTimer += dt;

            // If riding a log and not mid-hop
            if (this.ridingLog && !this.isHopping) {
                if (!this.ridingLog.active) {
                    this.ridingLog = null;
                    if (world) world.handleHazard(this, game, 'water');
                    return;
                }

                this.worldX = this.ridingLog.x + this.logOffsetX;
                this.gridX = Math.floor(this.worldX / CELL_SIZE);

                // Swept off screen check
                if (this.worldX < -CELL_SIZE / 2 || this.worldX > CANVAS_WIDTH + CELL_SIZE / 2) {
                    if (world) world.handleHazard(this, game, 'water');
                    return;
                }
            }

            // Hop interpolation
            if (this.isHopping) {
                this.hopProgress += dt / HOP_DURATION;
                if (this.hopProgress >= 1) {
                    this.hopProgress = 1;
                    this.isHopping = false;
                    this.worldX = this.targetWorldX;
                    this.worldY = this.targetWorldY;
                    this.z = 0;

                    this.scaleX = 1.25;
                    this.scaleY = 0.8;

                    if (world) world.checkPlayerLanding(this, game);
                } else {
                    const t = this.hopProgress;
                    this.z = Math.sin(Math.PI * t) * HOP_HEIGHT;
                    this.worldX = this.prevWorldX + (this.targetWorldX - this.prevWorldX) * t;
                    this.worldY = this.prevWorldY + (this.targetWorldY - this.prevWorldY) * t;

                    if (t < 0.5) {
                        this.scaleX = 0.85;
                        this.scaleY = 1.25;
                    } else {
                        this.scaleX = 1.05;
                        this.scaleY = 0.95;
                    }
                }
            } else {
                this.scaleX += (1 - this.scaleX) * 15 * dt;
                this.scaleY += (1 - this.scaleY) * 15 * dt;
            }
        }

        die(type) {
            if (this.isDead) return;
            this.isDead = true;
            this.deathType = type;
            this.deathProgress = 0;

            if (type === 'car' || type === 'train') {
                sound.playCrash();
            } else if (type === 'water') {
                sound.playSplash();
                particles.spawnSplash(this.worldX, this.worldY);
            } else if (type === 'eagle') {
                sound.playEagle();
            }
            sound.playGameOver();
        }

        render(ctx, cameraY) {
            const screenY = PLAYER_SCREEN_Y - (this.worldY - cameraY);
            const drawX = this.worldX;
            const drawY = screenY - this.z;

            ctx.save();
            ctx.translate(drawX, drawY);

            if (this.isDead && (this.deathType === 'car' || this.deathType === 'train')) {
                ctx.scale(1.4, 0.25);
            } else if (this.isDead && this.deathType === 'water') {
                const sinkScale = Math.max(0, 1 - this.deathProgress * 2.5);
                ctx.scale(sinkScale, sinkScale);
                ctx.globalAlpha = sinkScale;
            } else {
                ctx.scale(this.scaleX, this.scaleY);
                if (this.invincibleTimer > 0 && Math.floor(this.invincibleTimer * 12) % 2 === 0) {
                    ctx.globalAlpha = 0.45;
                }
            }

            // Drop Shadow
            if (!this.isDead || this.deathType === 'eagle') {
                const shadowScale = Math.max(0.4, 1 - (this.z / (HOP_HEIGHT * 1.5)));
                ctx.save();
                ctx.translate(0, this.z + 32);
                ctx.scale(shadowScale, shadowScale * 0.4);
                ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
                ctx.beginPath();
                ctx.arc(0, 0, 42, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }

            const pImg = assets.images.player;
            if (pImg && pImg.complete && pImg.naturalWidth > 0) {
                const isJumping = this.z > 5;
                const destW = 110;
                const destH = 100;

                // Dedicated directional rendering matching sprite atlas packing:
                if (this.hopDirection === DIR.LEFT) {
                    if (isJumping) {
                        // side_jump frame (x=769, y=457, w=178, h=195, unrotated upright facing left)
                        ctx.drawImage(pImg, 769, 457, 178, 195, -destW / 2, -destH / 2, destW, destH);
                    } else {
                        // idle_left frame (x=1422, y=1281, sw=150, sh=158, packed 90 deg clockwise)
                        ctx.save();
                        ctx.rotate(-Math.PI / 2);
                        ctx.drawImage(pImg, 1422, 1281, 150, 158, -destH / 2, -destW / 2, destH, destW);
                        ctx.restore();
                    }
                } else if (this.hopDirection === DIR.RIGHT) {
                    ctx.save();
                    ctx.scale(-1, 1); // Flip horizontally to face right
                    if (isJumping) {
                        ctx.drawImage(pImg, 769, 457, 178, 195, -destW / 2, -destH / 2, destW, destH);
                    } else {
                        ctx.save();
                        ctx.rotate(-Math.PI / 2);
                        ctx.drawImage(pImg, 1422, 1281, 150, 158, -destH / 2, -destW / 2, destH, destW);
                        ctx.restore();
                    }
                    ctx.restore();
                } else if (this.hopDirection === DIR.DOWN) {
                    // Moving backward / down: rotate 180 from North
                    ctx.save();
                    ctx.rotate(Math.PI / 2);
                    if (isJumping) {
                        ctx.drawImage(pImg, 202, 1, 199, 233, -destH / 2, -destW / 2, destH, destW);
                    } else {
                        ctx.drawImage(pImg, 290, 1793, 142, 158, -destH / 2, -destW / 2, destH, destW);
                    }
                    ctx.restore();
                } else {
                    // Default facing UP (North):
                    // Sprites in sheet are packed rotated 90 deg clockwise.
                    // Rotate by -Math.PI / 2 to make them face straight UP!
                    ctx.save();
                    ctx.rotate(-Math.PI / 2);
                    if (isJumping) {
                        // jump frame: sx=202, sy=1, sw=199, sh=233
                        ctx.drawImage(pImg, 202, 1, 199, 233, -destH / 2, -destW / 2, destH, destW);
                    } else {
                        // idle frame: sx=290, sy=1793, sw=142, sh=158
                        ctx.drawImage(pImg, 290, 1793, 142, 158, -destH / 2, -destW / 2, destH, destW);
                    }
                    ctx.restore();
                }
            } else {
                this.renderProceduralFrog(ctx);
            }

            // Protective glowing energy shield
            if (this.invincibleTimer > 0 && !this.isDead) {
                ctx.save();
                ctx.strokeStyle = `rgba(56, 189, 248, ${0.45 + Math.sin(this.invincibleTimer * 14) * 0.35})`;
                ctx.lineWidth = 5;
                ctx.shadowColor = '#38bdf8';
                ctx.shadowBlur = 18;
                ctx.beginPath();
                ctx.arc(0, -6, 56, 0, Math.PI * 2);
                ctx.stroke();
                ctx.restore();
            }

            ctx.restore();
        }

        renderProceduralFrog(ctx) {
            ctx.fillStyle = '#4ade80';
            ctx.beginPath();
            ctx.roundRect(-42, -36, 84, 72, 28);
            ctx.fill();

            ctx.fillStyle = '#22c55e';
            ctx.beginPath();
            ctx.arc(-14, -8, 8, 0, Math.PI * 2);
            ctx.arc(16, 12, 10, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(-22, -32, 14, 0, Math.PI * 2);
            ctx.arc(22, -32, 14, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#0f172a';
            ctx.beginPath();
            ctx.arc(-22, -34, 7, 0, Math.PI * 2);
            ctx.arc(22, -34, 7, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = '#15803d';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(0, -10, 16, 0.2, Math.PI - 0.2);
            ctx.stroke();
        }
    }

    // =========================================================================
    // 6. OBSTACLE ENTITIES: CARS, LOGS, TRAINS, EAGLE
    // =========================================================================

    // --- CAR ENTITY ---
    class Car {
        constructor() {
            this.active = false;
            this.x = 0;
            this.y = 0;
            this.speed = 0;
            this.dir = 1;
            this.width = 190;
            this.height = 84;
            this.carType = 0;
            this.color = '#ef4444';
        }

        init(x, y, speed, dir, carType) {
            this.x = x;
            this.y = y;
            this.speed = speed;
            this.dir = dir;
            this.carType = carType;
            this.width = 190;
            this.height = 84;
            this.active = true;

            const colors = ['#ef4444', '#3b82f6', '#eab308'];
            this.color = colors[carType] || '#ef4444';
        }

        update(dt) {
            if (!this.active) return;
            this.x += this.speed * this.dir * dt;

            if (Math.random() < 0.08) {
                particles.spawnCarPuff(this.x, this.y, this.dir);
            }

            if (this.dir === 1 && this.x > CANVAS_WIDTH + 300) {
                this.active = false;
            } else if (this.dir === -1 && this.x < -300) {
                this.active = false;
            }
        }

        render(ctx, cameraY) {
            if (!this.active) return;
            const screenY = PLAYER_SCREEN_Y - (this.y - cameraY);

            ctx.save();
            ctx.translate(this.x, screenY);

            // Car Shadow on road
            ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
            ctx.beginPath();
            ctx.roundRect(-this.width / 2, -this.height / 2 + 15, this.width, this.height, 16);
            ctx.fill();

            // Face movement direction
            if (this.dir === -1) {
                ctx.scale(-1, 1);
            }

            // Headlight beams projected forward
            ctx.save();
            ctx.fillStyle = 'rgba(254, 240, 138, 0.13)';
            ctx.beginPath();
            ctx.moveTo(this.width / 2, -18);
            ctx.lineTo(this.width / 2 + 190, -45);
            ctx.lineTo(this.width / 2 + 190, 45);
            ctx.lineTo(this.width / 2, 18);
            ctx.closePath();
            ctx.fill();
            ctx.restore();

            let img = null;
            if (this.carType === 0) img = assets.images.carRed;
            else if (this.carType === 1) img = assets.images.carBlue;
            else img = assets.images.carYellow;

            if (img && img.complete && img.naturalWidth > 0) {
                // In spr_car-sheet0/1/2.webp:
                // Frame is at (1537, 1537) with width 380, height 438, packed 90 deg clockwise.
                // Rotate by -Math.PI / 2 to restore horizontal orientation:
                // Wheels at the bottom, roof at the top, front bumper pointing right!
                ctx.save();
                ctx.rotate(-Math.PI / 2);
                const dw = this.height * 1.15;
                const dh = this.width * 1.05;
                ctx.drawImage(img, 1537, 1537, 380, 438, -dw / 2, -dh / 2, dw, dh);
                ctx.restore();
            } else {
                this.renderProceduralCar(ctx);
            }

            ctx.restore();
        }

        renderProceduralCar(ctx) {
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.roundRect(-this.width / 2, -this.height / 2, this.width, this.height, 14);
            ctx.fill();

            ctx.fillStyle = '#1e293b';
            ctx.beginPath();
            ctx.roundRect(-this.width / 2 + 35, -this.height / 2 + 10, this.width - 70, this.height - 20, 10);
            ctx.fill();

            ctx.fillStyle = '#94a3b8';
            ctx.beginPath();
            ctx.roundRect(this.width / 2 - 50, -this.height / 2 + 14, 14, this.height - 28, 4);
            ctx.fill();

            ctx.fillStyle = '#fef08a';
            ctx.fillRect(this.width / 2 - 6, -this.height / 2 + 8, 6, 16);
            ctx.fillRect(this.width / 2 - 6, this.height / 2 - 24, 6, 16);

            ctx.fillStyle = '#dc2626';
            ctx.fillRect(-this.width / 2, -this.height / 2 + 8, 6, 16);
            ctx.fillRect(-this.width / 2, this.height / 2 - 24, 6, 16);
        }
    }

    // --- LOG ENTITY ---
    class Log {
        constructor() {
            this.active = false;
            this.x = 0;
            this.y = 0;
            this.speed = 0;
            this.dir = 1;
            this.width = 280;
            this.height = 76;
            this.logFrame = 0;
        }

        init(x, y, speed, dir, width, logFrame) {
            this.x = x;
            this.y = y;
            this.speed = speed;
            this.dir = dir;
            this.width = width || 280;
            this.height = 76;
            this.logFrame = logFrame || 0;
            this.active = true;
        }

        update(dt) {
            if (!this.active) return;
            this.x += this.speed * this.dir * dt;

            if (Math.random() < 0.05) {
                particles.spawnWaterRipple(this.x - this.dir * (this.width * 0.35), this.y);
            }

            if (this.dir === 1 && this.x > CANVAS_WIDTH + this.width + 100) {
                this.active = false;
            } else if (this.dir === -1 && this.x < -this.width - 100) {
                this.active = false;
            }
        }

        render(ctx, cameraY) {
            if (!this.active) return;
            const screenY = PLAYER_SCREEN_Y - (this.y - cameraY);

            ctx.save();
            ctx.translate(this.x, screenY);

            // Water log shadow
            ctx.fillStyle = 'rgba(2, 6, 23, 0.4)';
            ctx.beginPath();
            ctx.roundRect(-this.width / 2, -this.height / 2 + 8, this.width, this.height, 18);
            ctx.fill();

            const woodImg = assets.images.wood;
            if (woodImg && woodImg.complete && woodImg.naturalWidth > 0) {
                // In shared-0-sheet3.webp, logs are vertical (packed 90 deg clockwise).
                // Rotating by -Math.PI / 2 makes them horizontal with shadow at the bottom!
                ctx.save();
                ctx.rotate(-Math.PI / 2);
                const dw = this.height;
                const dh = this.width;

                let sx = 151, sy = 1, sw = 147, sh = 428;
                if (this.width > 340) {
                    sx = 1; sy = 1; sw = 148; sh = 595;
                } else if (this.width < 270) {
                    sx = 730; sy = 513; sw = 147; sh = 362;
                }
                ctx.drawImage(woodImg, sx, sy, sw, sh, -dw / 2, -dh / 2, dw, dh);
                ctx.restore();
            } else {
                ctx.fillStyle = '#854d0e';
                ctx.beginPath();
                ctx.roundRect(-this.width / 2, -this.height / 2, this.width, this.height, 24);
                ctx.fill();

                ctx.fillStyle = '#713f12';
                ctx.beginPath();
                ctx.roundRect(-this.width / 2 + 16, -this.height / 2 + 14, this.width - 32, 10, 5);
                ctx.roundRect(-this.width / 2 + 30, this.height / 2 - 24, this.width - 60, 10, 5);
                ctx.fill();

                ctx.fillStyle = '#a16207';
                ctx.beginPath();
                ctx.ellipse(-this.width / 2 + 12, 0, 10, this.height / 2 - 6, 0, 0, Math.PI * 2);
                ctx.ellipse(this.width / 2 - 12, 0, 10, this.height / 2 - 6, 0, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.restore();
        }
    }

    // --- TRAIN ENTITY ---
    class Train {
        constructor() {
            this.active = false;
            this.x = 0;
            this.y = 0;
            this.speed = 2200;
            this.dir = 1;
            this.width = 1800;
            this.height = 92;
        }

        init(x, y, speed, dir) {
            this.x = x;
            this.y = y;
            this.speed = speed || 2200;
            this.dir = dir || 1;
            this.width = 1800;
            this.height = 92;
            this.active = true;
        }

        update(dt) {
            if (!this.active) return;
            this.x += this.speed * this.dir * dt;

            if (this.dir === 1 && this.x > CANVAS_WIDTH + this.width) {
                this.active = false;
            } else if (this.dir === -1 && this.x < -this.width) {
                this.active = false;
            }
        }

        render(ctx, cameraY) {
            if (!this.active) return;
            const screenY = PLAYER_SCREEN_Y - (this.y - cameraY);

            ctx.save();
            ctx.translate(this.x, screenY);

            // Train shadow
            ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
            ctx.beginPath();
            ctx.roundRect(-this.width / 2, -this.height / 2 + 12, this.width, this.height, 16);
            ctx.fill();

            // Face travel direction
            if (this.dir === -1) {
                ctx.scale(-1, 1);
            }

            // Train body (Silver/Red Bullet Train)
            ctx.fillStyle = '#e2e8f0';
            ctx.beginPath();
            ctx.roundRect(-this.width / 2, -this.height / 2, this.width, this.height, 20);
            ctx.fill();

            ctx.fillStyle = '#ef4444';
            ctx.fillRect(-this.width / 2, -12, this.width, 24);

            ctx.fillStyle = '#1e293b';
            for (let wx = -this.width / 2 + 60; wx < this.width / 2 - 60; wx += 90) {
                ctx.roundRect(wx, -this.height / 2 + 12, 60, 22, 6);
            }
            ctx.fill();

            ctx.restore();
        }
    }

    // --- EAGLE (BACKWARD PENALTY / VULTURE) ---
    class Eagle {
        constructor() {
            this.active = false;
            this.x = 0;
            this.y = 0;
            this.targetY = 0;
            this.speed = 1400;
            this.progress = 0;
            this.caughtPlayer = false;
        }

        spawn(targetX, targetY) {
            this.active = true;
            this.x = targetX;
            this.targetY = targetY;
            this.y = targetY + 900;
            this.progress = 0;
            this.caughtPlayer = false;
            sound.playEagle();
        }

        update(dt, player, onCatch) {
            if (!this.active) return;
            this.progress += dt;

            if (!this.caughtPlayer) {
                this.y -= this.speed * dt;
                if (this.y <= this.targetY + 20) {
                    this.caughtPlayer = true;
                    if (onCatch) {
                        onCatch('eagle');
                    } else {
                        player.die('eagle');
                    }
                }
            } else {
                this.y -= this.speed * dt;
                player.worldX = this.x;
                player.worldY = this.y;
                if (this.progress > 2.5) {
                    this.active = false;
                }
            }
        }

        render(ctx, cameraY) {
            if (!this.active) return;
            const screenY = PLAYER_SCREEN_Y - (this.y - cameraY);

            const targetScreenY = PLAYER_SCREEN_Y - (this.targetY - cameraY);
            const shadowSize = Math.max(30, 160 - Math.abs(this.y - this.targetY) * 0.15);
            ctx.save();
            ctx.translate(this.x, targetScreenY);
            ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
            ctx.beginPath();
            ctx.ellipse(0, 0, shadowSize * 1.5, shadowSize * 0.7, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            ctx.save();
            ctx.translate(this.x, screenY);

            const wingSpan = 140 + Math.sin(this.progress * 25) * 40;
            ctx.fillStyle = '#1e1b4b';

            ctx.beginPath();
            ctx.moveTo(0, 10);
            ctx.quadraticCurveTo(-wingSpan * 0.6, -40, -wingSpan, 10);
            ctx.quadraticCurveTo(-wingSpan * 0.5, 30, 0, 10);
            ctx.quadraticCurveTo(wingSpan * 0.5, 30, wingSpan, 10);
            ctx.quadraticCurveTo(wingSpan * 0.6, -40, 0, 10);
            ctx.fill();

            ctx.beginPath();
            ctx.moveTo(-20, 20);
            ctx.lineTo(0, 60);
            ctx.lineTo(20, 20);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(0, -22, 16, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#f59e0b';
            ctx.beginPath();
            ctx.moveTo(-6, -34);
            ctx.lineTo(0, -48);
            ctx.lineTo(6, -34);
            ctx.closePath();
            ctx.fill();

            ctx.restore();
        }
    }

    // =========================================================================
    // 7. ROW OBJECT & ROW POOLING SYSTEM
    // =========================================================================
    class GameRow {
        constructor() {
            this.rowIndex = 0;
            this.type = ROW_TYPES.GRASS;
            this.worldY = 0;

            this.direction = 1;
            this.speed = 220;
            this.spawnTimer = 0;
            this.spawnInterval = 2.0;

            this.trainWarning = false;
            this.trainWarningTimer = 0;
            this.trainPassTimer = 0;
            this.trainSignalBlink = false;

            this.obstacles = [];
            this.coin = null;
            this.cars = [];
            this.logs = [];
            this.train = null;
        }

        reset(rowIndex, type, difficulty) {
            this.rowIndex = rowIndex;
            this.type = type;
            this.worldY = rowIndex * ROW_HEIGHT + ROW_HEIGHT / 2;

            this.direction = Math.random() < 0.5 ? 1 : -1;
            this.spawnTimer = Math.random() * 1.5;
            this.cars.length = 0;
            this.logs.length = 0;
            this.train = null;
            this.obstacles.length = 0;
            this.coin = null;

            if (type === ROW_TYPES.GRASS) {
                // Negative rows: decorative background park
                if (rowIndex < 0) {
                    if (rowIndex <= -2) {
                        // Dense tree line at far bottom of the world
                        this.obstacles = [0, 1, 2, 6, 7, 8];
                    } else {
                        // Row -1
                        this.obstacles = [0, 8];
                    }
                } else if (rowIndex <= 6) {
                    // Safe starter area: open middle columns so player can hop freely
                    const count = Math.random() < 0.5 ? 2 : 1;
                    const sideCols = [0, 1, 7, 8];
                    for (let i = 0; i < count; i++) {
                        const col = sideCols[Math.floor(Math.random() * sideCols.length)];
                        if (!this.obstacles.includes(col)) {
                            this.obstacles.push(col);
                        }
                    }
                    // Coins in starter area to encourage hopping forward
                    if (rowIndex >= 1 && Math.random() < 0.5) {
                        const openCols = [2, 3, 4, 5, 6].filter(c => !this.obstacles.includes(c));
                        if (openCols.length > 0) {
                            this.coin = { col: openCols[Math.floor(Math.random() * openCols.length)], collected: false };
                        }
                    }
                } else {
                    // Standard grass rows in gameplay
                    const count = Math.random() < 0.6 ? 2 : 1;
                    const safeCols = [PLAYER_START_COL, (PLAYER_START_COL + 1) % GRID_COLS];
                    for (let i = 0; i < count; i++) {
                        const col = Math.floor(Math.random() * GRID_COLS);
                        if (!safeCols.includes(col) && !this.obstacles.includes(col)) {
                            this.obstacles.push(col);
                        }
                    }

                    // Chance to spawn a golden coin
                    if (Math.random() < 0.35) {
                        const available = [];
                        for (let c = 0; c < GRID_COLS; c++) {
                            if (!this.obstacles.includes(c)) available.push(c);
                        }
                        if (available.length > 0) {
                            const coinCol = available[Math.floor(Math.random() * available.length)];
                            this.coin = { col: coinCol, collected: false };
                        }
                    }
                }
            } else if (type === ROW_TYPES.ROAD) {
                // Tiered speed & spawn interval based on row progression
                if (rowIndex <= 20) {
                    // Tier 2: Easy - slow cars, wide gaps
                    this.speed = 160 + Math.random() * 40;
                    this.spawnInterval = 3.8 + Math.random() * 1.0;
                } else if (rowIndex <= 50) {
                    // Tier 3: Medium
                    this.speed = 220 + Math.random() * 70 + difficulty * 50;
                    this.spawnInterval = 2.8 + Math.random() * 0.8 - difficulty * 0.4;
                } else if (rowIndex <= 85) {
                    // Tier 4: Hard
                    this.speed = 300 + Math.random() * 120 + difficulty * 100;
                    this.spawnInterval = 2.1 + Math.random() * 0.6 - difficulty * 0.5;
                } else {
                    // Tier 5: Expert
                    this.speed = 420 + Math.random() * 180 + difficulty * 120;
                    this.spawnInterval = Math.max(1.1, 1.6 + Math.random() * 0.5 - difficulty * 0.4);
                }

                const initialX = Math.random() * CANVAS_WIDTH;
                const c = new Car();
                c.init(initialX, this.worldY, this.speed, this.direction, Math.floor(Math.random() * 3));
                this.cars.push(c);
            } else if (type === ROW_TYPES.RIVER) {
                let logWidth = 380;
                if (rowIndex <= 50) {
                    // Very wide, gentle logs
                    this.speed = 110 + Math.random() * 40;
                    this.spawnInterval = 3.2 + Math.random() * 0.8;
                    logWidth = 440;
                } else if (rowIndex <= 85) {
                    this.speed = 150 + Math.random() * 70 + difficulty * 40;
                    this.spawnInterval = 2.6 + Math.random() * 0.6;
                    logWidth = Math.random() < 0.6 ? 340 : 260;
                } else {
                    this.speed = 210 + Math.random() * 110 + difficulty * 60;
                    this.spawnInterval = Math.max(1.4, 2.0 + Math.random() * 0.5);
                    logWidth = Math.random() < 0.5 ? 260 : 200;
                }

                const l1 = new Log();
                l1.init(CANVAS_WIDTH * 0.25, this.worldY, this.speed, this.direction, logWidth, 0);
                const l2 = new Log();
                l2.init(CANVAS_WIDTH * 0.75, this.worldY, this.speed, this.direction, logWidth, 0);
                this.logs.push(l1, l2);
            } else if (type === ROW_TYPES.TRAIN) {
                this.trainWarning = false;
                this.trainWarningTimer = 0;
                this.trainSignalBlink = false;

                let warningLead = 2.4;
                if (rowIndex <= 50) warningLead = 2.5;
                else if (rowIndex <= 85) warningLead = 1.8;
                else warningLead = 1.3;

                this.trainWarningLead = warningLead;
                this.trainPassTimer = warningLead + 1.5 + Math.random() * 3.5;
            }
        }

        update(dt, difficulty, game) {
            if (this.type === ROW_TYPES.ROAD) {
                this.spawnTimer += dt;
                if (this.spawnTimer >= this.spawnInterval) {
                    this.spawnTimer = 0;
                    const startX = this.direction === 1 ? -150 : CANVAS_WIDTH + 150;
                    const c = new Car();
                    c.init(startX, this.worldY, this.speed, this.direction, Math.floor(Math.random() * 3));
                    this.cars.push(c);
                }
                this.cars.forEach(c => c.update(dt));
                this.cars = this.cars.filter(c => c.active);
            } else if (this.type === ROW_TYPES.RIVER) {
                this.spawnTimer += dt;
                if (this.spawnTimer >= this.spawnInterval) {
                    this.spawnTimer = 0;
                    let logWidth = 380;
                    if (this.rowIndex <= 50) logWidth = 440;
                    else if (this.rowIndex <= 85) logWidth = Math.random() < 0.6 ? 340 : 260;
                    else logWidth = Math.random() < 0.5 ? 260 : 200;

                    const startX = this.direction === 1 ? -logWidth : CANVAS_WIDTH + logWidth;
                    const l = new Log();
                    l.init(startX, this.worldY, this.speed, this.direction, logWidth, 0);
                    this.logs.push(l);
                }
                this.logs.forEach(l => l.update(dt));
                this.logs = this.logs.filter(l => l.active);
            } else if (this.type === ROW_TYPES.TRAIN) {
                this.trainPassTimer -= dt;

                const warningLead = this.trainWarningLead || 1.8;
                if (this.trainPassTimer <= warningLead && !this.trainWarning) {
                    this.trainWarning = true;
                    sound.playTrainWarning();
                }

                if (this.trainWarning) {
                    this.trainWarningTimer += dt;
                    this.trainSignalBlink = Math.floor(this.trainWarningTimer * 6) % 2 === 0;
                }

                if (this.trainPassTimer <= 0) {
                    this.trainPassTimer = 3.5 + Math.random() * 4.0;
                    this.trainWarning = false;
                    this.trainWarningTimer = 0;

                    sound.playTrainWhoosh();
                    this.train = new Train();
                    const startX = this.direction === 1 ? -1000 : CANVAS_WIDTH + 1000;
                    this.train.init(startX, this.worldY, 2400 + difficulty * 400, this.direction);
                }

                if (this.train) {
                    this.train.update(dt);
                    if (this.train.active && game) {
                        game.triggerScreenShake(3);
                    }
                    if (!this.train.active) this.train = null;
                }
            }
        }

        renderBackground(ctx, cameraY) {
            const screenY = PLAYER_SCREEN_Y - (this.worldY - cameraY);
            const topY = Math.floor(screenY - ROW_HEIGHT / 2);
            const rHeight = ROW_HEIGHT + 2; // +2 eliminates subpixel seams

            if (this.type === ROW_TYPES.GRASS) {
                ctx.fillStyle = (Math.abs(this.rowIndex) % 2 === 0) ? '#48bb78' : '#38a169';
                ctx.fillRect(0, topY, CANVAS_WIDTH, rHeight);

                ctx.fillStyle = '#2f855a';
                for (let x = 30; x < CANVAS_WIDTH; x += 110) {
                    ctx.fillRect(x, topY + 12, 4, 14);
                    ctx.fillRect(x + 12, topY + 16, 4, 10);
                }

                // Decorative boundary fence on row -2 to frame the starting park
                if (this.rowIndex === -2) {
                    ctx.fillStyle = '#78350f';
                    ctx.fillRect(0, topY + 36, CANVAS_WIDTH, 8);
                    ctx.fillRect(0, topY + 68, CANVAS_WIDTH, 8);
                    for (let px = 20; px < CANVAS_WIDTH; px += 80) {
                        ctx.fillRect(px, topY + 24, 12, 60);
                    }
                }
            } else if (this.type === ROW_TYPES.ROAD) {
                ctx.fillStyle = '#2d3748';
                ctx.fillRect(0, topY, CANVAS_WIDTH, rHeight);

                ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
                for (let x = 20; x < CANVAS_WIDTH; x += 90) {
                    ctx.fillRect(x, topY + ROW_HEIGHT / 2 - 3, 50, 6);
                }
            } else if (this.type === ROW_TYPES.RIVER) {
                const waterImg = assets.images.water;
                if (waterImg && waterImg.complete && waterImg.naturalWidth > 0) {
                    ctx.drawImage(waterImg, 0, 0, 1645, 680, 0, topY, CANVAS_WIDTH, rHeight);
                } else {
                    ctx.fillStyle = '#0284c7';
                    ctx.fillRect(0, topY, CANVAS_WIDTH, rHeight);

                    ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
                    for (let x = 15; x < CANVAS_WIDTH; x += 140) {
                        ctx.beginPath();
                        ctx.roundRect(x, topY + 28, 70, 8, 4);
                        ctx.fill();
                    }
                }
            } else if (this.type === ROW_TYPES.TRAIN) {
                ctx.fillStyle = '#4a5568';
                ctx.fillRect(0, topY, CANVAS_WIDTH, rHeight);

                ctx.fillStyle = '#78350f';
                for (let x = 10; x < CANVAS_WIDTH; x += 55) {
                    ctx.fillRect(x, topY + 12, 28, ROW_HEIGHT - 24);
                }

                ctx.fillStyle = '#cbd5e1';
                ctx.fillRect(0, topY + 28, CANVAS_WIDTH, 10);
                ctx.fillRect(0, topY + ROW_HEIGHT - 38, CANVAS_WIDTH, 10);

                ctx.fillStyle = '#1e293b';
                ctx.fillRect(CANVAS_WIDTH - 60, topY + 10, 14, ROW_HEIGHT - 20);

                ctx.fillStyle = (this.trainWarning && this.trainSignalBlink) ? '#ef4444' : '#7f1d1d';
                ctx.beginPath();
                ctx.arc(CANVAS_WIDTH - 53, topY + 22, 14, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        renderObstacles(ctx, cameraY) {
            const screenY = PLAYER_SCREEN_Y - (this.worldY - cameraY);

            // Trees on grass
            if (this.type === ROW_TYPES.GRASS) {
                this.obstacles.forEach(col => {
                    const treeX = col * CELL_SIZE + CELL_SIZE / 2;
                    ctx.save();
                    ctx.translate(treeX, screenY);

                    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
                    ctx.beginPath();
                    ctx.ellipse(0, 28, 38, 16, 0, 0, Math.PI * 2);
                    ctx.fill();

                    ctx.fillStyle = '#78350f';
                    ctx.fillRect(-10, -10, 20, 36);

                    ctx.fillStyle = '#15803d';
                    ctx.beginPath();
                    ctx.arc(0, -28, 38, 0, Math.PI * 2);
                    ctx.fill();

                    ctx.fillStyle = '#16a34a';
                    ctx.beginPath();
                    ctx.arc(-8, -34, 24, 0, Math.PI * 2);
                    ctx.fill();

                    ctx.restore();
                });

                // Render Gold Coin
                if (this.coin && !this.coin.collected) {
                    const coinX = this.coin.col * CELL_SIZE + CELL_SIZE / 2;
                    ctx.save();
                    ctx.translate(coinX, screenY);
                    ctx.fillStyle = '#facc15';
                    ctx.beginPath();
                    ctx.arc(0, 0, 22, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.strokeStyle = '#ca8a04';
                    ctx.lineWidth = 4;
                    ctx.stroke();
                    ctx.fillStyle = '#78350f';
                    ctx.font = 'bold 20px sans-serif';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText('$', 0, 1);
                    ctx.restore();
                }
            }

            if (this.type === ROW_TYPES.RIVER) {
                this.logs.forEach(log => log.render(ctx, cameraY));
            }

            if (this.type === ROW_TYPES.ROAD) {
                this.cars.forEach(car => car.render(ctx, cameraY));
            }

            if (this.type === ROW_TYPES.TRAIN && this.train) {
                this.train.render(ctx, cameraY);
            }
        }
    }

    // =========================================================================
    // 8. WORLD GENERATOR & ROW POOL MANAGER
    // =========================================================================
    class WorldManager {
        constructor() {
            this.rows = new Map();
            this.rowPool = [];
            this.highestGenerated = -1;
            this.lastType = ROW_TYPES.GRASS;
            this.sameTypeCount = 0;
            this.eagle = new Eagle();
        }

        reset() {
            this.rows.forEach(r => this.rowPool.push(r));
            this.rows.clear();
            this.highestGenerated = -7;
            this.lastType = ROW_TYPES.GRASS;
            this.sameTypeCount = 0;
            this.eagle = new Eagle();

            // Spawn rows from -6 to 24 (total 31 rows initialized)
            // Ensures full screen coverage below player and far ahead
            for (let r = -6; r <= 24; r++) {
                const type = this.pickRowTypeForIndex(r);
                this.spawnRow(r, type, 0);
            }
        }

        pickRowTypeForIndex(rowIndex) {
            // Tier 1: Peaceful starting park (Rows -6 to 6) -> 100% Grass
            if (rowIndex <= 6) {
                return ROW_TYPES.GRASS;
            }

            // Tier 2: Easy introduction (Rows 7 to 20)
            // Single road lanes separated by 1-2 grass rows. No rivers or trains.
            if (rowIndex <= 20) {
                if (this.lastType === ROW_TYPES.ROAD) {
                    return ROW_TYPES.GRASS; // Always grass after road
                }
                if (this.sameTypeCount < 2 && Math.random() < 0.6) {
                    return ROW_TYPES.GRASS;
                }
                return ROW_TYPES.ROAD;
            }

            // Tier 3: Gentle Challenge (Rows 21 to 50)
            // Roads (up to 2 lanes), gentle rivers (1 lane), rare trains
            if (rowIndex <= 50) {
                if (this.lastType === ROW_TYPES.RIVER && this.sameTypeCount >= 2) {
                    return ROW_TYPES.GRASS;
                }
                if (this.lastType === ROW_TYPES.ROAD && this.sameTypeCount >= 2) {
                    return ROW_TYPES.GRASS;
                }
                if (this.lastType === ROW_TYPES.TRAIN) {
                    return ROW_TYPES.GRASS;
                }

                const rand = Math.random();
                if (rand < 0.42) return ROW_TYPES.ROAD;
                if (rand < 0.76) return ROW_TYPES.RIVER;
                if (rand < 0.90) return ROW_TYPES.GRASS;
                return ROW_TYPES.TRAIN;
            }

            // Tier 4: Moderate to Hard (Rows 51 to 85)
            // Roads (up to 3 lanes), rivers (up to 2 lanes), trains
            if (rowIndex <= 85) {
                if (this.lastType === ROW_TYPES.RIVER && this.sameTypeCount >= 2) {
                    return ROW_TYPES.GRASS;
                }
                if (this.lastType === ROW_TYPES.ROAD && this.sameTypeCount >= 3) {
                    return ROW_TYPES.GRASS;
                }
                if (this.lastType === ROW_TYPES.TRAIN && this.sameTypeCount >= 1) {
                    return Math.random() < 0.6 ? ROW_TYPES.GRASS : ROW_TYPES.ROAD;
                }

                const rand = Math.random();
                if (rand < 0.40) return ROW_TYPES.ROAD;
                if (rand < 0.72) return ROW_TYPES.RIVER;
                if (rand < 0.85) return ROW_TYPES.TRAIN;
                return ROW_TYPES.GRASS;
            }

            // Tier 5: Expert / Master (Rows 86+)
            // Multi-lane highways (up to 4 lanes), rapid rivers, frequent trains
            if (this.lastType === ROW_TYPES.RIVER && this.sameTypeCount >= 3) {
                return ROW_TYPES.GRASS;
            }
            if (this.lastType === ROW_TYPES.ROAD && this.sameTypeCount >= 4) {
                return ROW_TYPES.GRASS;
            }
            if (this.lastType === ROW_TYPES.TRAIN && this.sameTypeCount >= 2) {
                return ROW_TYPES.GRASS;
            }

            const rand = Math.random();
            if (rand < 0.44) return ROW_TYPES.ROAD;
            if (rand < 0.76) return ROW_TYPES.RIVER;
            if (rand < 0.90) return ROW_TYPES.TRAIN;
            return ROW_TYPES.GRASS;
        }

        spawnRow(rowIndex, type, difficulty) {
            let row = this.rowPool.pop();
            if (!row) {
                row = new GameRow();
            }

            row.reset(rowIndex, type, difficulty);
            this.rows.set(rowIndex, row);
            this.highestGenerated = Math.max(this.highestGenerated, rowIndex);

            if (type === this.lastType) {
                this.sameTypeCount++;
            } else {
                this.lastType = type;
                this.sameTypeCount = 1;
            }
        }

        isTileBlocked(col, row) {
            const r = this.rows.get(row);
            if (!r) return false;
            if (r.type === ROW_TYPES.GRASS && r.obstacles.includes(col)) {
                return true;
            }
            return false;
        }

        handleHazard(player, game, type) {
            if (player.isDead || player.invincibleTimer > 0) return;

            if (player.lives > 1) {
                player.lives--;
                this.eagle.active = false;
                this.eagle.caughtPlayer = false;
                sound.playDamage();
                if (game) {
                    game.triggerDamageFlash();
                    game.triggerScreenShake(24);
                    game.updateHUD();
                }
                player.respawn(this);
            } else {
                player.lives = 0;
                this.eagle.active = false;
                this.eagle.caughtPlayer = false;
                if (game) {
                    game.triggerDamageFlash();
                    game.triggerScreenShake(32);
                    game.updateHUD();
                }
                player.die(type);
            }
        }

        update(dt, player, cameraRow, difficulty, game) {
            const targetMaxRow = Math.max(player.gridY + 22, Math.floor(cameraRow) + 22);
            while (this.highestGenerated < targetMaxRow) {
                const nextRowIndex = this.highestGenerated + 1;
                const nextType = this.pickRowTypeForIndex(nextRowIndex);
                this.spawnRow(nextRowIndex, nextType, difficulty);
            }

            this.rows.forEach(r => r.update(dt, difficulty, game));

            // Retain rows down to cameraRow - 7 so bottom of canvas is always completely filled
            const minKeepRow = Math.floor(cameraRow) - 7;
            for (const [rIndex, rObj] of this.rows.entries()) {
                if (rIndex < minKeepRow) {
                    this.rows.delete(rIndex);
                    this.rowPool.push(rObj);
                }
            }

            this.eagle.update(dt, player, (type) => this.handleHazard(player, game, type));
            this.checkCollisions(player, cameraRow, game);
        }

        checkCollisions(player, cameraRow, game) {
            if (player.isDead) return;

            // Eagle swoops if player falls off the bottom of the canvas or stalls too long
            const maxIdle = Math.max(4.0, MAX_IDLE_SECONDS - (player.highestRow / 60) * 3.0);
            if (player.gridY < cameraRow - 4.5 || player.idleTimer > maxIdle) {
                if (!this.eagle.active) {
                    this.eagle.spawn(player.worldX, player.worldY);
                }
                return;
            }

            if (player.invincibleTimer > 0) return;

            const playerRow = this.rows.get(player.gridY);
            if (!playerRow) return;

            if (playerRow.type === ROW_TYPES.ROAD) {
                for (const car of playerRow.cars) {
                    const dx = Math.abs(player.worldX - car.x);
                    const dy = Math.abs(player.worldY - car.y);
                    if (dx < (car.width * 0.42 + 25) && dy < (car.height * 0.4 + 25)) {
                        this.handleHazard(player, game, 'car');
                        return;
                    }
                }
            }

            if (playerRow.type === ROW_TYPES.TRAIN && playerRow.train) {
                const train = playerRow.train;
                const dx = Math.abs(player.worldX - train.x);
                const dy = Math.abs(player.worldY - train.y);
                if (dx < (train.width * 0.48 + 30) && dy < (train.height * 0.45 + 25)) {
                    this.handleHazard(player, game, 'train');
                    return;
                }
            }
        }

        checkPlayerLanding(player, game) {
            const row = this.rows.get(player.gridY);
            if (!row) return;

            // Coin collection
            if (row.coin && !row.coin.collected) {
                const coinX = row.coin.col * CELL_SIZE + CELL_SIZE / 2;
                if (Math.abs(player.worldX - coinX) < CELL_SIZE * 0.6) {
                    row.coin.collected = true;
                    sound.playCoin();
                    particles.spawnCoinSparkle(player.worldX, player.worldY);
                    if (player.onCollectCoin) player.onCollectCoin();
                }
            }

            // River landing check
            if (row.type === ROW_TYPES.RIVER) {
                let onLog = null;
                for (const log of row.logs) {
                    const left = log.x - log.width / 2;
                    const right = log.x + log.width / 2;
                    if (player.worldX >= left - 25 && player.worldX <= right + 25) {
                        onLog = log;
                        break;
                    }
                }

                if (onLog) {
                    player.ridingLog = onLog;
                    player.logOffsetX = player.worldX - onLog.x;
                } else {
                    this.handleHazard(player, game, 'water');
                }
            }
        }

        render(ctx, cameraY) {
            this.rows.forEach(r => r.renderBackground(ctx, cameraY));
            this.rows.forEach(r => r.renderObstacles(ctx, cameraY));
            this.eagle.render(ctx, cameraY);
        }
    }

    // =========================================================================
    // 9. INPUT MANAGER (Touch Swipe, Tap, Arrow Keys, WASD)
    // =========================================================================
    class InputManager {
        constructor(canvas, onMove) {
            this.canvas = canvas;
            this.onMove = onMove;

            this.touchStartX = 0;
            this.touchStartY = 0;
            this.touchStartTime = 0;
            this.touchMoved = false;

            this.bindKeyboard();
            this.bindTouch();
        }

        bindKeyboard() {
            window.addEventListener('keydown', (e) => {
                if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
                    e.preventDefault();
                }

                sound.init();

                switch (e.code) {
                    case 'ArrowUp':
                    case 'KeyW':
                    case 'Space':
                        this.onMove(DIR.UP);
                        break;
                    case 'ArrowDown':
                    case 'KeyS':
                        this.onMove(DIR.DOWN);
                        break;
                    case 'ArrowLeft':
                    case 'KeyA':
                        this.onMove(DIR.LEFT);
                        break;
                    case 'ArrowRight':
                    case 'KeyD':
                        this.onMove(DIR.RIGHT);
                        break;
                    case 'Enter':
                    case 'KeyR':
                        window.dispatchEvent(new CustomEvent('restart-game'));
                        break;
                }
            });
        }

        bindTouch() {
            this.canvas.addEventListener('touchstart', (e) => {
                e.preventDefault();
                sound.init();

                if (e.touches.length === 1) {
                    const t = e.touches[0];
                    this.touchStartX = t.clientX;
                    this.touchStartY = t.clientY;
                    this.touchStartTime = performance.now();
                    this.touchMoved = false;
                }
            }, { passive: false });

            this.canvas.addEventListener('touchmove', (e) => {
                e.preventDefault();
                if (e.touches.length === 1) {
                    const t = e.touches[0];
                    const dx = t.clientX - this.touchStartX;
                    const dy = t.clientY - this.touchStartY;
                    if (Math.abs(dx) > 18 || Math.abs(dy) > 18) {
                        this.touchMoved = true;
                    }
                }
            }, { passive: false });

            this.canvas.addEventListener('touchend', (e) => {
                e.preventDefault();
                const elapsed = performance.now() - this.touchStartTime;

                if (e.changedTouches.length === 1) {
                    const t = e.changedTouches[0];
                    const dx = t.clientX - this.touchStartX;
                    const dy = t.clientY - this.touchStartY;
                    const absX = Math.abs(dx);
                    const absY = Math.abs(dy);
                    const threshold = 35;

                    if (absX > threshold || absY > threshold) {
                        if (absX > absY) {
                            this.onMove(dx > 0 ? DIR.RIGHT : DIR.LEFT);
                        } else {
                            this.onMove(dy > 0 ? DIR.DOWN : DIR.UP);
                        }
                    } else if (elapsed < 300) {
                        this.onMove(DIR.UP);
                    }
                }
            }, { passive: false });

            let isMouseDown = false;
            let mouseStartX = 0;
            let mouseStartY = 0;

            this.canvas.addEventListener('mousedown', (e) => {
                sound.init();
                isMouseDown = true;
                mouseStartX = e.clientX;
                mouseStartY = e.clientY;
            });

            this.canvas.addEventListener('mouseup', (e) => {
                if (!isMouseDown) return;
                isMouseDown = false;
                const dx = e.clientX - mouseStartX;
                const dy = e.clientY - mouseStartY;
                const absX = Math.abs(dx);
                const absY = Math.abs(dy);
                const threshold = 30;

                if (absX > threshold || absY > threshold) {
                    if (absX > absY) {
                        this.onMove(dx > 0 ? DIR.RIGHT : DIR.LEFT);
                    } else {
                        this.onMove(dy > 0 ? DIR.DOWN : DIR.UP);
                    }
                } else {
                    this.onMove(DIR.UP);
                }
            });
        }
    }

    // =========================================================================
    // 10. MAIN GAME CONTROLLER
    // =========================================================================
    class Game {
        constructor() {
            this.canvas = document.getElementById('gameCanvas');
            this.ctx = this.canvas.getContext('2d');

            this.player = new Player();
            this.world = new WorldManager();
            this.cameraRow = 0;
            this.score = 0;
            this.bonusScore = 0;
            this.highScore = parseInt(localStorage.getItem('froggy_high_score') || '0', 10);

            this.state = 'START';
            this.screenShake = 0;
            this.gameOverTimer = 0;

            this.setupResponsiveCanvas();
            this.input = new InputManager(this.canvas, (dir) => this.handleMove(dir));

            window.addEventListener('restart-game', () => this.restart());

            // Tap To Play start overlay binding
            const startOverlay = document.getElementById('startOverlay');
            if (startOverlay) {
                const triggerStart = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    this.startGame();
                };
                startOverlay.addEventListener('touchstart', triggerStart, { passive: false });
                startOverlay.addEventListener('click', triggerStart);
            }

            // Game over restart button binding
            const restartBtn = document.getElementById('restartBtn');
            if (restartBtn) {
                const triggerRestart = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    this.restart();
                };
                restartBtn.addEventListener('click', triggerRestart);
                restartBtn.addEventListener('touchend', triggerRestart, { passive: false });
            }

            // Responsive 3-button touch controls with zero lag and tactile haptics
            const dpadUp = document.getElementById('btnUp');
            const dpadLeft = document.getElementById('btnLeft');
            const dpadRight = document.getElementById('btnRight');

            const bindTouchBtn = (elem, dir) => {
                if (!elem) return;
                const handlePress = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    sound.init();
                    if (navigator.vibrate) {
                        try { navigator.vibrate(15); } catch (err) {}
                    }
                    if (this.state === 'START') {
                        this.startGame();
                    } else {
                        this.handleMove(dir);
                    }
                };
                elem.addEventListener('touchstart', handlePress, { passive: false });
                elem.addEventListener('mousedown', handlePress);
            };

            bindTouchBtn(dpadUp, DIR.UP);
            bindTouchBtn(dpadLeft, DIR.LEFT);
            bindTouchBtn(dpadRight, DIR.RIGHT);

            assets.loadAll(() => {
                this.initStartScreen();
                this.lastTime = performance.now();
                requestAnimationFrame((t) => this.loop(t));
            });
        }

        setupResponsiveCanvas() {
            this.canvas.width = CANVAS_WIDTH;
            this.canvas.height = CANVAS_HEIGHT;

            const resize = () => {
                const windowW = window.innerWidth;
                const windowH = window.innerHeight;
                const targetAspect = CANVAS_WIDTH / CANVAS_HEIGHT;
                const windowAspect = windowW / windowH;

                let displayW, displayH;
                if (windowAspect < targetAspect) {
                    displayW = windowW;
                    displayH = windowW / targetAspect;
                } else {
                    displayH = windowH;
                    displayW = windowH * targetAspect;
                }

                this.canvas.style.width = `${displayW}px`;
                this.canvas.style.height = `${displayH}px`;
            };

            window.addEventListener('resize', resize);
            window.addEventListener('orientationchange', resize);
            resize();
        }

        startGame() {
            if (this.state !== 'START') return;
            this.state = 'PLAYING';
            this.gameStartTime = performance.now();
            const startOverlay = document.getElementById('startOverlay');
            if (startOverlay) {
                startOverlay.classList.remove('active');
            }
            sound.init();
            sound.playHop();
            this.player.tryHop(DIR.UP, this.world);
        }

        triggerScreenShake(amt) {
            this.screenShake = Math.max(this.screenShake, amt || 18);
        }

        triggerDamageFlash() {
            const vignette = document.getElementById('damageVignette');
            if (vignette) {
                vignette.classList.add('flash');
                setTimeout(() => {
                    vignette.classList.remove('flash');
                }, 260);
            }
        }

        handleMove(dir) {
            if (this.state === 'START') {
                this.startGame();
                return;
            }
            if (this.state === 'GAMEOVER') {
                if (this.gameOverTimer > 0.8) {
                    this.restart();
                }
                return;
            }
            this.player.tryHop(dir, this.world);
        }

        initStartScreen() {
            this.bonusScore = 0;
            this.screenShake = 0;
            this.player.reset();
            this.player.onCollectCoin = () => {
                this.bonusScore += 5;
                this.updateHUD();
            };

            this.world.reset();
            this.cameraRow = 0;
            this.score = 0;
            this.state = 'START';
            this.gameOverTimer = 0;
            this.gameStartTime = performance.now();

            const modal = document.getElementById('gameOverModal');
            if (modal) modal.classList.remove('active');
            const startOverlay = document.getElementById('startOverlay');
            if (startOverlay) startOverlay.classList.add('active');
            this.updateHUD();
        }

        restart() {
            this.bonusScore = 0;
            this.screenShake = 0;
            this.player.reset();
            this.player.onCollectCoin = () => {
                this.bonusScore += 5;
                this.updateHUD();
            };

            this.world.reset();
            this.cameraRow = 0;
            this.score = 0;
            this.state = 'PLAYING';
            this.gameOverTimer = 0;
            this.gameStartTime = performance.now();

            const modal = document.getElementById('gameOverModal');
            if (modal) modal.classList.remove('active');
            const startOverlay = document.getElementById('startOverlay');
            if (startOverlay) startOverlay.classList.remove('active');
            this.updateHUD();
        }

        updateHUD() {
            const scoreElem = document.getElementById('scoreDisplay');
            const highElem = document.getElementById('highScoreDisplay');
            if (scoreElem) scoreElem.textContent = this.score;
            if (highElem) highElem.textContent = this.highScore;

            const lives = this.player ? this.player.lives : 3;
            [1, 2, 3].forEach(num => {
                const h = document.getElementById(`heart${num}`);
                if (h) {
                    if (num <= lives) {
                        h.className = 'heart active';
                        h.textContent = '❤️';
                    } else {
                        h.className = 'heart lost';
                        h.textContent = '🖤';
                    }
                }
            });
        }

        loop(now) {
            const dt = Math.min((now - this.lastTime) / 1000, 0.1);
            this.lastTime = now;

            this.update(dt);
            this.render();

            requestAnimationFrame((t) => this.loop(t));
        }

        update(dt) {
            const difficulty = Math.min(1.0, this.score / 85);

            if (this.screenShake > 0) {
                this.screenShake = Math.max(0, this.screenShake - dt * 45);
            }

            if (this.state === 'START') {
                this.player.update(dt, this.world, this);
                this.world.update(dt, this.player, this.cameraRow, difficulty, this);
                particles.update(dt);
            } else if (this.state === 'PLAYING') {
                this.player.update(dt, this.world, this);

                const currentScore = this.player.highestRow + this.bonusScore;
                if (currentScore > this.score) {
                    this.score = currentScore;
                    if (this.score > this.highScore) {
                        this.highScore = this.score;
                        localStorage.setItem('froggy_high_score', this.highScore);
                    }
                    this.updateHUD();
                }

                // Camera follows player smoothly
                const targetCameraRow = Math.max(this.cameraRow, this.player.gridY - 1);
                this.cameraRow += (targetCameraRow - this.cameraRow) * 5 * dt;

                // Easy to hard camera creep speed (zero at beginning so beginner is never rushed)
                let creepSpeed = 0;
                if (this.score >= 15 && this.score < 40) {
                    creepSpeed = 0.15;
                } else if (this.score >= 40 && this.score < 80) {
                    creepSpeed = 0.35;
                } else if (this.score >= 80) {
                    creepSpeed = 0.55;
                }
                this.cameraRow += creepSpeed * dt;

                this.world.update(dt, this.player, this.cameraRow, difficulty, this);
                particles.update(dt);

                if (this.player.isDead) {
                    this.state = 'GAMEOVER';
                    this.gameOverTimer = 0;
                }
            } else if (this.state === 'GAMEOVER') {
                this.gameOverTimer += dt;
                this.player.update(dt, this.world, this);
                this.world.update(dt, this.player, this.cameraRow, difficulty, this);
                particles.update(dt);

                if (this.gameOverTimer > 0.8) {
                    const modal = document.getElementById('gameOverModal');
                    const finalScore = document.getElementById('finalScore');
                    const bestScore = document.getElementById('bestScore');
                    if (modal && !modal.classList.contains('active')) {
                        modal.classList.add('active');
                        if (finalScore) finalScore.textContent = this.score;
                        if (bestScore) bestScore.textContent = this.highScore;

                        // Trigger GameOverController and Score submission
                        if (typeof window !== 'undefined' && window.GameOverController && typeof window.GameOverController.handleGameOver === 'function') {
                            window.GameOverController.handleGameOver({
                                score: this.score,
                                highScore: this.highScore,
                                distance: this.score,
                                bonusScore: this.bonusScore,
                                deathType: this.player.deathType || 'hazard',
                                timePlayed: Math.floor((performance.now() - (this.gameStartTime || performance.now())) / 1000)
                            });
                        }
                    }
                }
            }
        }

        render() {
            this.ctx.save();

            if (this.screenShake > 0) {
                const shakeX = (Math.random() - 0.5) * this.screenShake;
                const shakeY = (Math.random() - 0.5) * this.screenShake;
                this.ctx.translate(shakeX, shakeY);
            }

            // Fill background with rich grass green to prevent any gaps, flashes, or seams
            this.ctx.fillStyle = '#38a169';
            this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

            const cameraWorldY = this.cameraRow * ROW_HEIGHT;

            this.world.render(this.ctx, cameraWorldY);
            particles.render(this.ctx, cameraWorldY);
            this.player.render(this.ctx, cameraWorldY);

            this.ctx.restore();
        }
    }

    window.addEventListener('DOMContentLoaded', () => {
        new Game();
    });

})();

