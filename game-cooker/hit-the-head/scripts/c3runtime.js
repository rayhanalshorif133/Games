/**
 * Construct 3 HTML5 Game Engine Runtime Wrapper
 * Project: Hit The Head (Whack-a-Mole Arcade)
 * Resolution: 1080 x 1920 (Portrait)
 */

(function(window) {
    'use strict';

    // Polyfill for roundRect on older browser engines
    if (typeof CanvasRenderingContext2D !== 'undefined' && !CanvasRenderingContext2D.prototype.roundRect) {
        CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, r) {
            if (typeof r === 'undefined') r = 0;
            if (typeof r === 'number') r = { tl: r, tr: r, br: r, bl: r };
            this.beginPath();
            this.moveTo(x + (r.tl || 0), y);
            this.lineTo(x + w - (r.tr || 0), y);
            this.quadraticCurveTo(x + w, y, x + w, y + (r.tr || 0));
            this.lineTo(x + w, y + h - (r.br || 0));
            this.quadraticCurveTo(x + w, y + h, x + w - (r.br || 0), y + h);
            this.lineTo(x + (r.bl || 0), y + h);
            this.quadraticCurveTo(x, y + h, x, y + h - (r.bl || 0));
            this.lineTo(x, y + (r.tl || 0));
            this.quadraticCurveTo(x, y, x + (r.tl || 0), y);
            this.closePath();
            return this;
        };
    }

    // ==========================================
    // AUDIO SYNTHESIZER & SOUND MANAGER
    // ==========================================
    class SoundManager {
        constructor() {
            this.muted = false;
            this.ctx = null;
            this.initialized = false;
        }

        init() {
            if (this.initialized) return;
            try {
                const AudioCtx = window.AudioContext || window.webkitAudioContext;
                if (AudioCtx) {
                    this.ctx = new AudioCtx();
                    this.initialized = true;
                }
            } catch(e) {
                console.warn("AudioContext not allowed yet:", e);
            }
        }

        ensureResume() {
            if (this.ctx && this.ctx.state === 'suspended') {
                this.ctx.resume();
            }
        }

        toggleMute() {
            this.muted = !this.muted;
            return this.muted;
        }

        playBonk() {
            if (this.muted) return;
            this.init(); this.ensureResume();
            if (!this.ctx) return;

            const t = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const osc2 = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(380, t);
            osc.frequency.exponentialRampToValueAtTime(70, t + 0.18);

            osc2.type = 'sine';
            osc2.frequency.setValueAtTime(220, t);
            osc2.frequency.exponentialRampToValueAtTime(45, t + 0.22);

            gain.gain.setValueAtTime(0.8, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

            osc.connect(gain);
            osc2.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(t);
            osc2.start(t);
            osc.stop(t + 0.22);
            osc2.stop(t + 0.22);
        }

        playSwing() {
            if (this.muted) return;
            this.init(); this.ensureResume();
            if (!this.ctx) return;

            const t = this.ctx.currentTime;
            const bufferSize = this.ctx.sampleRate * 0.12;
            const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = (Math.random() * 2 - 1) * Math.sin(Math.PI * (i / bufferSize));
            }

            const noise = this.ctx.createBufferSource();
            noise.buffer = buffer;

            const filter = this.ctx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.setValueAtTime(900, t);
            filter.frequency.exponentialRampToValueAtTime(250, t + 0.12);
            filter.Q.value = 1.2;

            const gain = this.ctx.createGain();
            gain.gain.setValueAtTime(0.5, t);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.12);

            noise.connect(filter);
            filter.connect(gain);
            gain.connect(this.ctx.destination);

            noise.start(t);
        }

        playPop() {
            if (this.muted) return;
            this.init(); this.ensureResume();
            if (!this.ctx) return;

            const t = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(250, t);
            osc.frequency.exponentialRampToValueAtTime(800, t + 0.12);

            gain.gain.setValueAtTime(0.3, t);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.12);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(t);
            osc.stop(t + 0.12);
        }

        playTick() {
            if (this.muted) return;
            this.init(); this.ensureResume();
            if (!this.ctx) return;

            const t = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(1400, t);
            gain.gain.setValueAtTime(0.25, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(t);
            osc.stop(t + 0.04);
        }

        playMiss() {
            if (this.muted) return;
            this.init(); this.ensureResume();
            if (!this.ctx) return;

            const t = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(130, t);
            osc.frequency.exponentialRampToValueAtTime(40, t + 0.15);

            gain.gain.setValueAtTime(0.4, t);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(t);
            osc.stop(t + 0.15);
        }

        playCombo(mult) {
            if (this.muted) return;
            this.init(); this.ensureResume();
            if (!this.ctx) return;

            const t = this.ctx.currentTime;
            const baseFreq = 440 * Math.pow(1.2, mult);
            [0, 0.06, 0.12].forEach((offset, idx) => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(baseFreq * (1 + idx * 0.25), t + offset);
                gain.gain.setValueAtTime(0.3, t + offset);
                gain.gain.exponentialRampToValueAtTime(0.001, t + offset + 0.15);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(t + offset);
                osc.stop(t + offset + 0.15);
            });
        }

        playGameOver() {
            if (this.muted) return;
            this.init(); this.ensureResume();
            if (!this.ctx) return;

            const notes = [523.25, 659.25, 783.99, 1046.50];
            const t = this.ctx.currentTime;
            notes.forEach((freq, idx) => {
                const st = t + idx * 0.12;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(freq, st);
                gain.gain.setValueAtTime(0.4, st);
                gain.gain.exponentialRampToValueAtTime(0.001, st + 0.35);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(st);
                osc.stop(st + 0.35);
            });
        }

        playClick() {
            if (this.muted) return;
            this.init(); this.ensureResume();
            if (!this.ctx) return;

            const t = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(900, t);
            gain.gain.setValueAtTime(0.2, t);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.05);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(t);
            osc.stop(t + 0.05);
        }
    }

    // ==========================================
    // PARTICLE & FLOATING TEXT SYSTEM
    // ==========================================
    class Particle {
        constructor(x, y, vx, vy, life, color, size, text = null) {
            this.x = x;
            this.y = y;
            this.vx = vx;
            this.vy = vy;
            this.life = life;
            this.maxLife = life;
            this.color = color;
            this.size = size;
            this.text = text;
            this.rotation = Math.random() * Math.PI * 2;
            this.rotSpeed = (Math.random() - 0.5) * 8;
        }

        update(dt) {
            this.x += this.vx * dt;
            this.y += this.vy * dt;
            this.vy += 300 * dt; // gravity
            this.rotation += this.rotSpeed * dt;
            this.life -= dt;
            return this.life > 0;
        }

        draw(ctx, starImg) {
            const alpha = Math.max(0, this.life / this.maxLife);
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.translate(this.x, this.y);
            ctx.rotate(this.rotation);

            if (this.text) {
                ctx.font = `bold ${Math.round(this.size)}px "Arial Rounded MT Bold", Impact, sans-serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.strokeStyle = '#000000';
                ctx.lineWidth = 8;
                ctx.strokeText(this.text, 0, 0);
                ctx.fillStyle = this.color;
                ctx.fillText(this.text, 0, 0);
            } else if (starImg && starImg.complete) {
                const s = this.size * alpha;
                ctx.drawImage(starImg, -s/2, -s/2, s, s);
            } else {
                ctx.fillStyle = this.color;
                ctx.beginPath();
                ctx.arc(0, 0, this.size * alpha, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        }
    }

    // ==========================================
    // MOLE OBJECT INSTANCE
    // ==========================================
    const MOLE_STATE = {
        HIDDEN: 0,
        EMERGING: 1,
        PEEKING: 2,
        BURROWING: 3,
        HIT: 4
    };

    class MoleHole {
        constructor(id, x, y, scale) {
            this.id = id;
            this.x = x;
            this.y = y;
            this.scale = scale;

            this.state = MOLE_STATE.HIDDEN;
            this.progress = 0; // 0 = fully hidden, 1 = fully peeked
            this.timer = 0;
            this.peekDuration = 1.0;
            this.isHit = false;
            this.hitTimer = 0;
            this.shakeOffset = 0;
        }

        spawn(peekDuration) {
            if (this.state !== MOLE_STATE.HIDDEN) return;
            this.state = MOLE_STATE.EMERGING;
            this.progress = 0;
            this.timer = 0;
            this.peekDuration = peekDuration;
            this.isHit = false;
        }

        hit() {
            if (this.state === MOLE_STATE.HIDDEN || this.state === MOLE_STATE.HIT) return false;
            this.state = MOLE_STATE.HIT;
            this.isHit = true;
            this.hitTimer = 0.45; // stun pause
            return true;
        }

        update(dt) {
            if (this.state === MOLE_STATE.EMERGING) {
                this.progress += dt / 0.15; // fast rise
                if (this.progress >= 1.0) {
                    this.progress = 1.0;
                    this.state = MOLE_STATE.PEEKING;
                    this.timer = this.peekDuration;
                }
            } else if (this.state === MOLE_STATE.PEEKING) {
                this.timer -= dt;
                if (this.timer <= 0) {
                    this.state = MOLE_STATE.BURROWING;
                }
            } else if (this.state === MOLE_STATE.BURROWING) {
                this.progress -= dt / 0.18; // smooth burrow
                if (this.progress <= 0) {
                    this.progress = 0;
                    this.state = MOLE_STATE.HIDDEN;
                }
            } else if (this.state === MOLE_STATE.HIT) {
                this.hitTimer -= dt;
                this.shakeOffset = Math.sin(this.hitTimer * 50) * 8 * (this.hitTimer / 0.45);
                if (this.hitTimer <= 0) {
                    this.state = MOLE_STATE.BURROWING;
                }
            }
        }

        getHitBounds() {
            // Clickable area for hitting the mole's head
            if (this.state === MOLE_STATE.HIDDEN) return null;
            const w = 260 * this.scale;
            const h = 260 * this.scale;
            // Mole head position based on progress:
            const riseH = 170 * this.scale * this.progress;
            const cy = this.y - riseH;
            return {
                x: this.x - w / 2,
                y: cy - h * 0.7,
                w: w,
                h: h
            };
        }
    }

    // ==========================================
    // CONSTRUCT 3 RUNTIME ENGINE
    // ==========================================
    class C3Runtime {
        constructor(canvas) {
            this.canvas = canvas;
            this.ctx = canvas.getContext('2d');
            this.width = 1080;
            this.height = 1920;

            this.sound = new SoundManager();

            // Assets cache
            this.images = {};
            this.assetsLoaded = false;

            // Hole definitions (matching demo.jpg coordinates and perspective)
            this.holes = [
                new MoleHole(0, 230, 560, 0.70),
                new MoleHole(1, 620, 620, 0.72),
                new MoleHole(2, 190, 740, 0.76),
                new MoleHole(3, 570, 830, 0.80),
                new MoleHole(4, 940, 750, 0.77),
                new MoleHole(5, 180, 990, 0.85),
                new MoleHole(6, 890, 1040, 0.87),
                new MoleHole(7, 520, 1150, 0.92),
                new MoleHole(8, 250, 1430, 1.02),
                new MoleHole(9, 820, 1470, 1.05)
            ];

            // Game State
            this.gameState = 'READY'; // 'READY', 'PLAYING', 'GAMEOVER'
            this.score = 0;
            this.highScore = parseInt(localStorage.getItem('hit_the_head_highscore') || '0', 10);
            this.totalTime = 30;
            this.timeRemaining = 30;
            this.combo = 0;
            this.maxCombo = 0;
            this.totalSwings = 0;
            this.totalHits = 0;

            // Spawner timer
            this.spawnTimer = 0;
            this.spawnInterval = 1.0;

            // Hammer / Mallet state
            this.hammer = {
                x: 540,
                y: 1200,
                targetX: 540,
                targetY: 1200,
                angle: -25, // default resting tilt
                swingProgress: 0,
                isSwinging: false,
                swingDuration: 0.16
            };

            // Particles
            this.particles = [];

            // UI animation punch
            this.scoreScale = 1.0;
            this.clockPulse = 1.0;

            // Input handlers
            this.setupInput();
        }

        async loadAssets() {
            const assetList = [
                { key: 'background', src: 'images/background.png' },
                { key: 'hammer', src: 'images/hammer.png' },
                { key: 'mole_normal', src: 'images/mole_normal.png' },
                { key: 'mole_hit', src: 'images/mole_hit.png' },
                { key: 'hole_back', src: 'images/hole_back.png' },
                { key: 'hole_front', src: 'images/hole_front.png' },
                { key: 'clock_icon', src: 'images/clock_icon.png' },
                { key: 'badge_pill', src: 'images/badge_pill.png' },
                { key: 'mole_icon', src: 'images/mole_icon.png' },
                { key: 'star_gold', src: 'images/star_gold.png' },
                { key: 'ui_board', src: 'images/ui_board.png' },
                { key: 'prop_rock_cactus', src: 'images/prop_rock_cactus.png' },
                { key: 'prop_worm', src: 'images/prop_worm.png' }
            ];

            let loadedCount = 0;
            const promises = assetList.map(item => {
                return new Promise((resolve) => {
                    const img = new Image();
                    img.src = item.src;
                    img.onload = () => {
                        this.images[item.key] = img;
                        loadedCount++;
                        resolve();
                    };
                    img.onerror = () => {
                        console.warn("Asset load failed:", item.src);
                        resolve();
                    };
                });
            });

            await Promise.all(promises);
            this.assetsLoaded = true;
            console.log("Construct 3 Assets loaded:", loadedCount, "of", assetList.length);
        }

        setupInput() {
            const handlePointer = (e) => {
                e.preventDefault();
                this.sound.init();

                const rect = this.canvas.getBoundingClientRect();
                const scaleX = this.width / rect.width;
                const scaleY = this.height / rect.height;

                const clientX = e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
                const clientY = e.clientY || (e.touches && e.touches[0] ? e.touches[0].clientY : 0);

                const gameX = (clientX - rect.left) * scaleX;
                const gameY = (clientY - rect.top) * scaleY;

                this.onTap(gameX, gameY);
            };

            const handleMove = (e) => {
                const rect = this.canvas.getBoundingClientRect();
                const scaleX = this.width / rect.width;
                const scaleY = this.height / rect.height;
                const clientX = e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
                const clientY = e.clientY || (e.touches && e.touches[0] ? e.touches[0].clientY : 0);

                if (!this.hammer.isSwinging) {
                    this.hammer.targetX = (clientX - rect.left) * scaleX;
                    this.hammer.targetY = (clientY - rect.top) * scaleY;
                }
            };

            this.canvas.addEventListener('pointerdown', handlePointer, { passive: false });
            this.canvas.addEventListener('pointermove', handleMove, { passive: true });
            this.canvas.addEventListener('touchstart', handlePointer, { passive: false });
            this.canvas.addEventListener('touchmove', handleMove, { passive: true });
        }

        onTap(x, y) {
            if (this.gameState === 'READY') {
                // Check if tapped start button or anywhere on screen
                this.startGame();
                return;
            }

            if (this.gameState === 'GAMEOVER') {
                // Check if tapped restart button
                // Restart button area: center 540, y ~ 1240, w: 320, h: 100
                if (Math.abs(x - 540) < 220 && Math.abs(y - 1240) < 80) {
                    this.sound.playClick();
                    this.startGame();
                } else if (y > 900 && y < 1400) {
                    this.sound.playClick();
                    this.startGame();
                }
                return;
            }

            if (this.gameState === 'PLAYING') {
                // Mute button in top right: x > 950, y < 150
                if (x > 960 && y < 130) {
                    const isMuted = this.sound.toggleMute();
                    this.spawnFloatingText(990, 160, isMuted ? "MUTED" : "SOUND ON", "#FFFFFF");
                    return;
                }

                this.triggerSwing(x, y);
            }
        }

        startGame() {
            this.gameState = 'PLAYING';
            this.score = 0;
            this.timeRemaining = this.totalTime;
            this.combo = 0;
            this.maxCombo = 0;
            this.totalSwings = 0;
            this.totalHits = 0;
            this.particles = [];
            this.spawnTimer = 0.5;

            // Reset all holes
            this.holes.forEach(h => {
                h.state = MOLE_STATE.HIDDEN;
                h.progress = 0;
            });

            this.sound.playClick();
        }

        triggerSwing(x, y) {
            this.totalSwings++;
            this.hammer.targetX = x;
            this.hammer.targetY = y;
            this.hammer.isSwinging = true;
            this.hammer.swingProgress = 0;

            this.sound.playSwing();

            // Check hit against all active holes
            let hitRegistered = false;

            // Check in reverse (closer / lower holes first for perspective priority)
            for (let i = this.holes.length - 1; i >= 0; i--) {
                const hole = this.holes[i];
                const b = hole.getHitBounds();
                if (b) {
                    if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) {
                        // HIT!
                        if (hole.hit()) {
                            hitRegistered = true;
                            this.onMoleHit(hole, x, y);
                            break;
                        }
                    }
                }
            }

            if (!hitRegistered) {
                // Miss ground
                this.combo = 0;
                this.sound.playMiss();
                this.spawnDust(x, y);
            }
        }

        onMoleHit(hole, x, y) {
            this.totalHits++;
            this.combo++;
            if (this.combo > this.maxCombo) this.maxCombo = this.combo;

            // Score calculation with combo
            const points = 10 * Math.min(4, Math.max(1, Math.floor(this.combo / 2)));
            this.score += points;
            if (this.score > this.highScore) {
                this.highScore = this.score;
                localStorage.setItem('hit_the_head_highscore', this.highScore.toString());
            }

            // Punch score scale
            this.scoreScale = 1.35;

            // Sounds
            this.sound.playBonk();
            if (this.combo >= 3) {
                this.sound.playCombo(Math.min(5, this.combo));
            }

            // Star particles
            this.spawnHitStars(hole.x, hole.y - 120 * hole.scale);

            // Floating score text
            const comboText = this.combo >= 2 ? `+${points} (${this.combo}x COMBO!)` : `+${points}`;
            const textColor = this.combo >= 4 ? '#FF2244' : (this.combo >= 2 ? '#FFD700' : '#FFFFFF');
            this.spawnFloatingText(hole.x, hole.y - 180 * hole.scale, comboText, textColor);
        }

        spawnHitStars(x, y) {
            for (let i = 0; i < 9; i++) {
                const angle = (Math.PI * 2 * i) / 9 + (Math.random() - 0.5) * 0.5;
                const speed = 250 + Math.random() * 350;
                const vx = Math.cos(angle) * speed;
                const vy = Math.sin(angle) * speed - 150;
                const size = 35 + Math.random() * 25;
                this.particles.push(new Particle(x, y, vx, vy, 0.65, '#FFD700', size));
            }
        }

        spawnDust(x, y) {
            for (let i = 0; i < 5; i++) {
                const angle = Math.PI + (Math.random() - 0.5) * Math.PI;
                const speed = 80 + Math.random() * 120;
                const vx = Math.cos(angle) * speed;
                const vy = Math.sin(angle) * speed - 60;
                this.particles.push(new Particle(x, y, vx, vy, 0.4, '#C2A375', 20));
            }
        }

        spawnFloatingText(x, y, text, color) {
            this.particles.push(new Particle(x, y, 0, -180, 0.8, color, 42, text));
        }

        update(dt) {
            // Update particles
            this.particles = this.particles.filter(p => p.update(dt));

            // UI animations decay
            this.scoreScale += (1.0 - this.scoreScale) * dt * 8;
            this.clockPulse += (1.0 - this.clockPulse) * dt * 8;

            // Hammer positioning and swing animation
            if (this.hammer.isSwinging) {
                this.hammer.swingProgress += dt / this.hammer.swingDuration;
                if (this.hammer.swingProgress >= 1.0) {
                    this.hammer.isSwinging = false;
                    this.hammer.swingProgress = 0;
                    this.hammer.angle = -25;
                } else {
                    // Strike down (-35 -> +25 -> 0)
                    const p = this.hammer.swingProgress;
                    if (p < 0.35) {
                        // Power windup
                        this.hammer.angle = -35 + p * 10;
                    } else if (p < 0.65) {
                        // Impact smash down!
                        this.hammer.angle = 28;
                    } else {
                        // Recoil recovery
                        const rec = (p - 0.65) / 0.35;
                        this.hammer.angle = 28 - rec * 53;
                    }
                }
            } else {
                // Smooth follow mouse/touch
                this.hammer.x += (this.hammer.targetX - this.hammer.x) * dt * 14;
                this.hammer.y += (this.hammer.targetY - this.hammer.y) * dt * 14;
            }

            if (this.gameState === 'PLAYING') {
                // Countdown timer
                this.timeRemaining -= dt;
                if (this.timeRemaining <= 0) {
                    this.timeRemaining = 0;
                    this.gameState = 'GAMEOVER';
                    this.sound.playGameOver();
                    return;
                }

                // Clock tick pulse when time < 10
                if (this.timeRemaining <= 10) {
                    const sec = Math.ceil(this.timeRemaining);
                    if (Math.floor(this.timeRemaining + dt) > sec) {
                        this.sound.playTick();
                        this.clockPulse = 1.35;
                    }
                }

                // Mole Spawning Logic
                this.spawnTimer -= dt;
                // Faster spawning as time progresses
                const progressRatio = (this.totalTime - this.timeRemaining) / this.totalTime;
                this.spawnInterval = 1.1 - progressRatio * 0.55; // 1.1s down to 0.55s
                const peekDur = 1.3 - progressRatio * 0.65; // 1.3s down to 0.65s

                if (this.spawnTimer <= 0) {
                    this.spawnTimer = this.spawnInterval;

                    // Choose 1 or 2 available hidden holes
                    const availableHoles = this.holes.filter(h => h.state === MOLE_STATE.HIDDEN);
                    if (availableHoles.length > 0) {
                        const randomHole = availableHoles[Math.floor(Math.random() * availableHoles.length)];
                        randomHole.spawn(peekDur);
                        this.sound.playPop();

                        // In second half, chance to spawn 2 moles simultaneously!
                        if (progressRatio > 0.45 && Math.random() < 0.4 && availableHoles.length > 1) {
                            const secondHole = availableHoles.filter(h => h.id !== randomHole.id)[0];
                            if (secondHole) secondHole.spawn(peekDur);
                        }
                    }
                }
            }

            // Update all holes
            this.holes.forEach(h => h.update(dt));
        }

        render() {
            const ctx = this.ctx;
            ctx.clearRect(0, 0, this.width, this.height);

            // 1. Render Background (1080x1920)
            if (this.images.background && this.images.background.complete) {
                ctx.drawImage(this.images.background, 0, 0, this.width, this.height);
            } else {
                ctx.fillStyle = '#7DBD00';
                ctx.fillRect(0, 0, this.width, this.height);
            }

            // 2. Render Decorative Props
            if (this.images.prop_rock_cactus && this.images.prop_rock_cactus.complete) {
                ctx.drawImage(this.images.prop_rock_cactus, 780, 1150, 240, 260);
            }
            if (this.images.prop_worm && this.images.prop_worm.complete) {
                ctx.drawImage(this.images.prop_worm, 850, 710, 110, 80);
            }

            // 3. Render Holes and Moles with 3D Depth Layering
            // Sort by Y position so holes further down appear in front of holes further back
            const sortedHoles = [...this.holes].sort((a, b) => a.y - b.y);

            sortedHoles.forEach(hole => {
                this.renderHoleWithMole(ctx, hole);
            });

            // 4. Render Particles
            this.particles.forEach(p => p.draw(ctx, this.images.star_gold));

            // 5. Render Hammer / Mallet
            this.renderHammer(ctx);

            // 6. Render HUD (Score Badge, Clock Badge)
            this.renderHUD(ctx);

            // 7. Render Overlays (Ready or Game Over)
            if (this.gameState === 'READY') {
                this.renderReadyScreen(ctx);
            } else if (this.gameState === 'GAMEOVER') {
                this.renderGameOverScreen(ctx);
            }
        }

        renderHoleWithMole(ctx, hole) {
            const s = hole.scale;
            const holeW = 460 * s;
            const holeH = 320 * s;
            const hx = hole.x - holeW / 2;
            const hy = hole.y - holeH * 0.55;

            // A. Draw Hole Back (dark pit)
            if (this.images.hole_back && this.images.hole_back.complete) {
                ctx.drawImage(this.images.hole_back, hx, hy, holeW, holeH);
            } else {
                // Fallback dirt hole
                ctx.fillStyle = '#2A0A10';
                ctx.beginPath();
                ctx.ellipse(hole.x, hole.y, holeW * 0.4, holeH * 0.3, 0, 0, Math.PI * 2);
                ctx.fill();
            }

            // B. Draw Mole (if emerging, peeking, hit, or burrowing)
            if (hole.state !== MOLE_STATE.HIDDEN) {
                const moleW = 340 * s;
                const moleH = 360 * s;
                const riseDist = 180 * s;
                const currentY = hole.y - (hole.progress * riseDist) + hole.shakeOffset;

                ctx.save();
                // Clipping mask so the mole is cropped at the hole bottom edge
                ctx.beginPath();
                ctx.rect(hole.x - moleW, hole.y - moleH - riseDist - 50, moleW * 2, moleH + riseDist + 15);
                ctx.clip();

                const moleSprite = (hole.state === MOLE_STATE.HIT) 
                    ? (this.images.mole_hit || this.images.mole_normal)
                    : this.images.mole_normal;

                if (moleSprite && moleSprite.complete) {
                    ctx.drawImage(
                        moleSprite,
                        hole.x - moleW / 2 + hole.shakeOffset,
                        currentY - moleH * 0.65,
                        moleW,
                        moleH
                    );
                } else {
                    // Fallback mole
                    ctx.fillStyle = '#8B4513';
                    ctx.beginPath();
                    ctx.arc(hole.x, currentY, moleW * 0.35, 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.restore();
            }

            // C. Draw Hole Front (front rim of dirt and stones overlapping the mole)
            if (this.images.hole_front && this.images.hole_front.complete) {
                ctx.drawImage(this.images.hole_front, hx, hy, holeW, holeH);
            }
        }

        renderHammer(ctx) {
            if (!this.images.hammer || !this.images.hammer.complete) return;

            const hx = this.hammer.isSwinging ? this.hammer.targetX : this.hammer.x;
            const hy = this.hammer.isSwinging ? this.hammer.targetY : this.hammer.y;

            ctx.save();
            ctx.translate(hx, hy);
            ctx.rotate((this.hammer.angle * Math.PI) / 180);

            // Hammer size
            const hw = 300;
            const hh = 380;
            // The mallet head should impact at roughly (-hw*0.25, -hh*0.75)
            // Pivot at handle base:
            ctx.drawImage(this.images.hammer, -hw * 0.35, -hh * 0.85, hw, hh);

            ctx.restore();
        }

        renderHUD(ctx) {
            // --- TOP LEFT: MOLE SCORE BADGE ---
            ctx.save();
            ctx.translate(50, 50);

            // Capsule badge background
            const badgeW = 380;
            const badgeH = 130;
            if (this.images.badge_pill && this.images.badge_pill.complete) {
                ctx.drawImage(this.images.badge_pill, 50, 0, badgeW, badgeH);
            } else {
                ctx.fillStyle = '#FCE000';
                ctx.beginPath();
                ctx.roundRect(50, 10, badgeW, badgeH - 20, 40);
                ctx.fill();
            }

            // Score text
            ctx.save();
            ctx.translate(260, 68);
            ctx.scale(this.scoreScale, this.scoreScale);
            ctx.font = 'bold 64px "Arial Rounded MT Bold", Impact, sans-serif';
            ctx.fillStyle = '#111111';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(this.score.toString(), 0, 0);
            ctx.restore();

            // Mole Head Icon Avatar
            if (this.images.mole_icon && this.images.mole_icon.complete) {
                ctx.drawImage(this.images.mole_icon, -10, -5, 140, 140);
            }

            ctx.restore();

            // --- TOP RIGHT: TIMER CLOCK BADGE ---
            ctx.save();
            ctx.translate(620, 50);

            if (this.images.badge_pill && this.images.badge_pill.complete) {
                ctx.drawImage(this.images.badge_pill, 50, 0, badgeW, badgeH);
            } else {
                ctx.fillStyle = '#FCE000';
                ctx.beginPath();
                ctx.roundRect(50, 10, badgeW, badgeH - 20, 40);
                ctx.fill();
            }

            // Time Remaining text
            const timeSec = Math.ceil(this.timeRemaining);
            ctx.save();
            ctx.translate(260, 68);
            ctx.scale(this.clockPulse, this.clockPulse);
            ctx.font = 'bold 64px "Arial Rounded MT Bold", Impact, sans-serif';
            ctx.fillStyle = (this.timeRemaining <= 10) ? '#E74C3C' : '#111111';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(timeSec.toString(), 0, 0);
            ctx.restore();

            // Clock Icon
            if (this.images.clock_icon && this.images.clock_icon.complete) {
                ctx.drawImage(this.images.clock_icon, -5, -15, 140, 160);
            }

            ctx.restore();

            // --- SOUND MUTE TOGGLE ICON (Top Far Right) ---
            ctx.save();
            ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
            ctx.beginPath();
            ctx.arc(1020, 65, 35, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#FFFFFF';
            ctx.font = '28px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(this.sound.muted ? '🔇' : '🔊', 1020, 66);
            ctx.restore();
        }

        renderReadyScreen(ctx) {
            // Dark vignette
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(0, 0, this.width, this.height);

            // Dialog board
            const bw = 780;
            const bh = 860;
            const bx = (this.width - bw) / 2;
            const by = (this.height - bh) / 2;

            if (this.images.ui_board && this.images.ui_board.complete) {
                ctx.drawImage(this.images.ui_board, bx, by, bw, bh);
            } else {
                ctx.fillStyle = '#D49559';
                ctx.roundRect(bx, by, bw, bh, 40);
                ctx.fill();
            }

            // Title
            ctx.textAlign = 'center';
            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 72px "Arial Rounded MT Bold", Impact, sans-serif';
            ctx.strokeStyle = '#4A2511';
            ctx.lineWidth = 12;
            ctx.strokeText("HIT THE HEAD!", 540, by + 160);
            ctx.fillText("HIT THE HEAD!", 540, by + 160);

            // Subtitle & Instructions
            ctx.fillStyle = '#2C150A';
            ctx.font = 'bold 36px "Arial Rounded MT Bold", sans-serif';
            ctx.fillText("Whack the miner moles", 540, by + 260);
            ctx.fillText("before they burrow underground!", 540, by + 310);

            // High Score
            ctx.font = 'bold 40px "Arial Rounded MT Bold", sans-serif';
            ctx.fillStyle = '#D35400';
            ctx.fillText(`BEST SCORE: ${this.highScore}`, 540, by + 400);

            // Big Start Button
            const btnW = 420;
            const btnH = 120;
            const btnX = (this.width - btnW) / 2;
            const btnY = by + 560;

            // 3D Button
            ctx.fillStyle = '#E67E22';
            ctx.beginPath();
            ctx.roundRect(btnX, btnY + 10, btnW, btnH, 40);
            ctx.fill();

            ctx.fillStyle = '#F39C12';
            ctx.beginPath();
            ctx.roundRect(btnX, btnY, btnW, btnH, 40);
            ctx.fill();

            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 6;
            ctx.stroke();

            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 56px "Arial Rounded MT Bold", Impact, sans-serif';
            ctx.fillText("TAP TO PLAY!", 540, btnY + 75);
        }

        renderGameOverScreen(ctx) {
            // Dark vignette
            ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
            ctx.fillRect(0, 0, this.width, this.height);

            const bw = 820;
            const bh = 920;
            const bx = (this.width - bw) / 2;
            const by = (this.height - bh) / 2 - 50;

            if (this.images.ui_board && this.images.ui_board.complete) {
                ctx.drawImage(this.images.ui_board, bx, by, bw, bh);
            }

            // Title
            ctx.textAlign = 'center';
            ctx.fillStyle = '#FF4757';
            ctx.font = 'bold 76px "Arial Rounded MT Bold", Impact, sans-serif';
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 14;
            ctx.strokeText("TIME UP!", 540, by + 150);
            ctx.fillText("TIME UP!", 540, by + 150);

            // Score
            ctx.fillStyle = '#2F3542';
            ctx.font = 'bold 44px "Arial Rounded MT Bold", sans-serif';
            ctx.fillText("FINAL SCORE", 540, by + 250);

            ctx.fillStyle = '#2ED573';
            ctx.font = 'bold 96px "Arial Rounded MT Bold", Impact, sans-serif';
            ctx.fillText(this.score.toString(), 540, by + 350);

            // High Score
            ctx.fillStyle = '#747D8C';
            ctx.font = 'bold 36px "Arial Rounded MT Bold", sans-serif';
            ctx.fillText(`BEST SCORE: ${this.highScore}`, 540, by + 420);

            // Accuracy & Max Combo
            const accuracy = this.totalSwings > 0 ? Math.round((this.totalHits / this.totalSwings) * 100) : 0;
            ctx.font = 'bold 34px "Arial Rounded MT Bold", sans-serif';
            ctx.fillStyle = '#3742FA';
            ctx.fillText(`HITS: ${this.totalHits}   ACCURACY: ${accuracy}%   COMBO: ${this.maxCombo}x`, 540, by + 490);

            // Star Rating (1, 2, or 3 Stars based on score)
            const numStars = (this.score >= 250) ? 3 : (this.score >= 120 ? 2 : 1);
            if (this.images.star_gold && this.images.star_gold.complete) {
                const starSize = 110;
                [-140, 0, 140].forEach((offset, idx) => {
                    const active = idx < numStars;
                    ctx.save();
                    ctx.globalAlpha = active ? 1.0 : 0.3;
                    ctx.drawImage(this.images.star_gold, 540 + offset - starSize/2, by + 540, starSize, starSize);
                    ctx.restore();
                });
            }

            // Play Again Button
            const btnW = 440;
            const btnH = 115;
            const btnX = (this.width - btnW) / 2;
            const btnY = by + 720;

            ctx.fillStyle = '#218C74';
            ctx.beginPath();
            ctx.roundRect(btnX, btnY + 10, btnW, btnH, 35);
            ctx.fill();

            ctx.fillStyle = '#2ED573';
            ctx.beginPath();
            ctx.roundRect(btnX, btnY, btnW, btnH, 35);
            ctx.fill();

            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 6;
            ctx.stroke();

            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 54px "Arial Rounded MT Bold", Impact, sans-serif';
            ctx.fillText("PLAY AGAIN", 540, btnY + 75);
        }
    }

    window.C3Runtime = C3Runtime;
})(window);
