/**
 * game.js
 * 
 * =========================================================================
 * Bee Attack - Core HTML5 Canvas Game Engine
 * =========================================================================
 * Pure, high-performance vanilla JavaScript canvas game engine.
 * Fully responsive, mobile-touch optimized, 60 FPS gameplay.
 */

(function () {
    'use strict';

    // ==========================================
    // 1. CONSTANTS & CONFIGURATION
    // ==========================================
    const V_WIDTH = 480;
    const V_HEIGHT = 800;

    const STATE = {
        LOADING: 'LOADING',
        START: 'START',
        PLAYING: 'PLAYING',
        GAMEOVER: 'GAMEOVER'
    };

    // Flower position in virtual canvas coordinates
    const FLOWER_POS = {
        potX: 134,
        potY: 242,
        coreX: 236,
        coreY: 302
    };

    // Safe Storage Helper
    function safeGetStorage(key, defaultVal = '') {
        try {
            return localStorage.getItem(key) || defaultVal;
        } catch (e) {
            return defaultVal;
        }
    }

    function safeSetStorage(key, val) {
        try {
            localStorage.setItem(key, val);
        } catch (e) {}
    }

    // Safe Image Drawing Helper (avoids InvalidStateError crashes)
    function drawSafe(ctx, img, ...args) {
        if (!img || !img.complete || img.naturalWidth === 0) return false;
        try {
            ctx.drawImage(img, ...args);
            return true;
        } catch (e) {
            return false;
        }
    }

    // ==========================================
    // 2. SPRITE ATLAS DEFINITIONS
    // ==========================================
    const SPRITES = {
        // Yellow Bee Left (4 fly frames, 4 kabur/carrying frames)
        beekiri: {
            fly: [
                { file: 'beekiri0', x: 1, y: 1, w: 100, h: 100 },
                { file: 'beekiri0', x: 103, y: 1, w: 100, h: 100 },
                { file: 'beekiri0', x: 1, y: 103, w: 100, h: 100 },
                { file: 'beekiri0', x: 103, y: 1, w: 100, h: 100 }
            ],
            kabur: [
                { file: 'beekiri0', x: 103, y: 103, w: 100, h: 100 },
                { file: 'beekiri1', x: 1, y: 1, w: 100, h: 100 },
                { file: 'beekiri1', x: 103, y: 1, w: 100, h: 100 },
                { file: 'beekiri1', x: 1, y: 103, w: 100, h: 100 }
            ]
        },
        // Yellow Bee Right
        beekanan: {
            fly: [
                { file: 'beekanan0', x: 1, y: 1, w: 100, h: 100 },
                { file: 'beekanan0', x: 103, y: 1, w: 100, h: 100 },
                { file: 'beekanan0', x: 1, y: 103, w: 100, h: 100 },
                { file: 'beekanan0', x: 103, y: 1, w: 100, h: 100 }
            ],
            kabur: [
                { file: 'beekanan0', x: 103, y: 103, w: 100, h: 100 },
                { file: 'beekanan1', x: 1, y: 1, w: 100, h: 100 },
                { file: 'beekanan1', x: 103, y: 1, w: 100, h: 100 },
                { file: 'beekanan1', x: 1, y: 103, w: 100, h: 100 }
            ]
        },
        // Blue Bee Left (peaceful)
        buukiri: [
            { file: 'buukiri0', x: 0, y: 0, w: 100, h: 100 },
            { file: 'buukiri1', x: 0, y: 0, w: 100, h: 100 },
            { file: 'buukiri2', x: 0, y: 0, w: 100, h: 100 },
            { file: 'buukiri1', x: 0, y: 0, w: 100, h: 100 }
        ],
        // Blue Bee Right (peaceful)
        buukanan: [
            { file: 'buukanan0', x: 0, y: 0, w: 100, h: 100 },
            { file: 'buukanan1', x: 0, y: 0, w: 100, h: 100 },
            { file: 'buukanan2', x: 0, y: 0, w: 100, h: 100 }
        ],
        // Explosion (10 frames)
        ledak: [
            { file: 'ledak0', x: 1, y: 1, w: 128, h: 128 },
            { file: 'ledak0', x: 131, y: 1, w: 128, h: 128 },
            { file: 'ledak0', x: 261, y: 1, w: 128, h: 128 },
            { file: 'ledak0', x: 1, y: 131, w: 128, h: 128 },
            { file: 'ledak0', x: 131, y: 131, w: 128, h: 128 },
            { file: 'ledak0', x: 261, y: 131, w: 128, h: 128 },
            { file: 'ledak0', x: 1, y: 261, w: 128, h: 128 },
            { file: 'ledak0', x: 131, y: 261, w: 128, h: 128 },
            { file: 'ledak0', x: 261, y: 261, w: 128, h: 128 },
            { file: 'ledak1', x: 0, y: 0, w: 128, h: 128 }
        ],
        // Spinning Coin (12 frames)
        coin: [
            { file: 'coin0', x: 1, y: 1, w: 124, h: 124 },
            { file: 'coin0', x: 127, y: 1, w: 124, h: 124 },
            { file: 'coin0', x: 1, y: 127, w: 124, h: 124 },
            { file: 'coin0', x: 127, y: 127, w: 124, h: 124 },
            { file: 'coin1', x: 1, y: 1, w: 124, h: 124 },
            { file: 'coin1', x: 127, y: 1, w: 124, h: 124 },
            { file: 'coin1', x: 1, y: 127, w: 124, h: 124 },
            { file: 'coin1', x: 127, y: 127, w: 124, h: 124 },
            { file: 'coin2', x: 1, y: 1, w: 124, h: 124 },
            { file: 'coin0', x: 127, y: 127, w: 124, h: 124 },
            { file: 'coin2', x: 127, y: 127, w: 124, h: 124 },
            { file: 'coin2', x: 1, y: 127, w: 124, h: 124 }
        ],
        // Flower Petals (Daun) corresponding to 9 health states (0 = full 9 petals, 8 = 1 petal left)
        petals: [
            { file: 'daun0', x: 1, y: 1, w: 223, h: 212 },
            { file: 'daun0', x: 226, y: 1, w: 223, h: 210 },
            { file: 'daun0', x: 226, y: 213, w: 212, h: 210 },
            { file: 'daun0', x: 1, y: 215, w: 212, h: 210 },
            { file: 'daun1', x: 1, y: 1, w: 200, h: 210 },
            { file: 'daun1', x: 203, y: 1, w: 200, h: 195 },
            { file: 'daun1', x: 203, y: 198, w: 200, h: 163 },
            { file: 'daun1', x: 1, y: 213, w: 174, h: 163 },
            { file: 'daun0', x: 215, y: 425, w: 73, h: 65 }
        ]
    };

    // ==========================================
    // 3. AUDIO ENGINE
    // ==========================================
    class AudioManager {
        constructor() {
            this.muted = safeGetStorage('bee_attack_muted') === 'true';
            this.sounds = {};
            this.bgm = null;
            this.audioContext = null;
            this.initialized = false;
        }

        init() {
            if (this.initialized) return;
            try {
                const AudioCtx = window.AudioContext || window.webkitAudioContext;
                if (AudioCtx) {
                    this.audioContext = new AudioCtx();
                }
            } catch (e) {}
            this.initialized = true;
        }

        loadSounds(soundList) {
            let canPlayOgg = false;
            try {
                canPlayOgg = Boolean((new Audio()).canPlayType('audio/ogg; codecs="vorbis"'));
            } catch (e) {}
            const ext = canPlayOgg ? '.ogg' : '.m4a';

            for (const [key, basePath] of Object.entries(soundList)) {
                try {
                    const audio = new Audio();
                    audio.preload = 'auto';
                    audio.src = basePath + ext;

                    if (key === 'bgm') {
                        audio.loop = true;
                        audio.volume = 0.55;
                        this.bgm = audio;
                    } else {
                        audio.volume = 0.85;
                    }

                    this.sounds[key] = audio;
                } catch (e) {
                    console.warn('[Audio] Non-fatal audio load error:', key);
                }
            }
        }

        play(name) {
            if (this.muted) return;
            if (this.audioContext && this.audioContext.state === 'suspended') {
                this.audioContext.resume().catch(() => {});
            }

            const snd = this.sounds[name];
            if (!snd) return;

            try {
                if (name !== 'bgm') {
                    const clone = snd.cloneNode();
                    clone.volume = snd.volume;
                    clone.play().catch(() => {});
                } else {
                    snd.play().catch(() => {});
                }
            } catch (e) {}
        }

        playBgm() {
            if (this.muted || !this.bgm) return;
            try {
                this.bgm.play().catch(() => {});
            } catch (e) {}
        }

        stopBgm() {
            if (!this.bgm) return;
            try {
                this.bgm.pause();
                this.bgm.currentTime = 0;
            } catch (e) {}
        }

        toggleMute() {
            this.muted = !this.muted;
            safeSetStorage('bee_attack_muted', this.muted);
            if (this.muted) {
                if (this.bgm) this.bgm.pause();
            } else {
                if (this.bgm) this.bgm.play().catch(() => {});
            }
            return this.muted;
        }
    }

    // ==========================================
    // 4. MAIN GAME CLASS
    // ==========================================
    class BeeAttackGame {
        constructor() {
            this.canvas = document.getElementById('game-canvas');
            if (!this.canvas) {
                console.error('[Game] game-canvas element not found in DOM!');
                return;
            }
            this.ctx = this.canvas.getContext('2d');
            this.state = STATE.LOADING;

            this.audio = new AudioManager();
            this.images = {};

            // High Score Persistence
            this.highScore = parseInt(safeGetStorage('bee_attack_highscore', '0'), 10) || 0;

            // Game Play Variables
            this.score = 0;
            this.life = 9;
            this.maxLife = 9;
            this.beesDefeated = 0;
            this.blueBeesHit = 0;
            this.coins = 0;
            this.bombsUsed = 0;
            this.combo = 0;
            this.comboTimer = 0;
            this.gameTime = 0;

            // Bomb super weapon
            this.bombCooldown = 0;
            this.maxBombCooldown = 10;
            this.isBombFlashing = 0;
            this.screenShake = 0;

            // Entities
            this.bees = [];
            this.particles = [];
            this.flyingCoins = [];
            this.floatingTexts = [];
            this.fallingPetals = [];

            // Spawning & Difficulty
            this.spawnTimer = 0;
            this.spawnInterval = 2.0;
            this.beeBaseSpeed = 75;

            // Buttons & Interactive Rects
            this.buttons = {};

            // Canvas Scaling & Offset
            this.scale = 1;

            // Animation tickers
            this.animTick = 0;
            this.flowerSway = 0;
            this.isLoaded = false;

            this.init();
        }

        init() {
            this.setupResize();
            this.setupInput();
            this.loadAssets();
        }

        // ------------------------------------------
        // Asset Preloading (Resilient & Non-blocking)
        // ------------------------------------------
        loadAssets() {
            const imageSources = {
                bgopening: 'images/bgopening-sheet0.png',
                bggame: 'images/bg-sheet0.png',
                bgresult: 'images/bgresult-sheet0.png',
                pot: 'images/pot-sheet0.png',
                daun0: 'images/daun-sheet0.png',
                daun1: 'images/daun-sheet1.png',
                tghbunga: 'images/tghbunga-sheet0.png',
                beekiri0: 'images/beekiri-sheet0.png',
                beekiri1: 'images/beekiri-sheet1.png',
                beekanan0: 'images/beekanan-sheet0.png',
                beekanan1: 'images/beekanan-sheet1.png',
                buukiri0: 'images/buukiri-sheet0.png',
                buukiri1: 'images/buukiri-sheet1.png',
                buukiri2: 'images/buukiri-sheet2.png',
                buukanan0: 'images/buukanan-sheet0.png',
                buukanan1: 'images/buukanan-sheet1.png',
                buukanan2: 'images/buukanan-sheet2.png',
                coin0: 'images/coin-sheet0.png',
                coin1: 'images/coin-sheet1.png',
                coin2: 'images/coin-sheet2.png',
                coinjalan: 'images/coinjalan-sheet0.png',
                ledak0: 'images/ledak-sheet0.png',
                ledak1: 'images/ledak-sheet1.png',
                ledakbomb: 'images/ledakbomb-sheet0.png',
                flash: 'images/flash-sheet0.png',
                butopening: 'images/butopening-sheet0.png',
                butbomb0: 'images/butbomb-sheet0.png',
                butbomb1: 'images/butbomb-sheet1.png',
                butretry: 'images/butretry-sheet0.png',
                buthome: 'images/buthome-sheet0.png',
                mutesound0: 'images/mute_sound-sheet0.png',
                mutesound1: 'images/mute_sound-sheet1.png'
            };

            const soundSources = {
                bgm: 'media/mattoglseby - 2',
                hit: 'media/8 bit ricochet',
                error: 'media/cancel - 2',
                coin: 'media/ok - 3',
                bomb: 'media/explosion 3',
                click: 'media/menu click 2'
            };

            // Non-blocking sound initialization in background
            this.audio.loadSounds(soundSources);

            const totalImages = Object.keys(imageSources).length;
            let loadedImages = 0;

            const progressBar = document.getElementById('progress-bar');

            const checkComplete = () => {
                if (this.isLoaded) return;
                loadedImages++;
                const pct = Math.min(100, Math.floor((loadedImages / totalImages) * 100));
                if (progressBar) progressBar.style.width = pct + '%';

                if (loadedImages >= totalImages) {
                    this.onAssetsLoaded();
                }
            };

            for (const [key, src] of Object.entries(imageSources)) {
                const img = new Image();
                img.onload = checkComplete;
                img.onerror = () => {
                    console.warn('[Asset] Image failed to load, skipping:', src);
                    checkComplete();
                };
                img.src = src;
                this.images[key] = img;
            }

            // Safety Fallback Timeout: Guarantee start even on slow file protocols or network
            setTimeout(() => {
                if (!this.isLoaded) {
                    console.log('[Game] Safe startup timeout triggered.');
                    this.onAssetsLoaded();
                }
            }, 500);
        }

        onAssetsLoaded() {
            if (this.isLoaded) return;
            this.isLoaded = true;

            const overlay = document.getElementById('loading-overlay');
            if (overlay) {
                overlay.classList.add('hidden');
                setTimeout(() => {
                    try { overlay.remove(); } catch (e) {}
                }, 350);
            }

            this.state = STATE.START;
            this.lastTime = performance.now();
            requestAnimationFrame((ts) => this.gameLoop(ts));
        }

        // ------------------------------------------
        // Responsive Canvas Resizing
        // ------------------------------------------
        setupResize() {
            const resize = () => {
                const winW = window.innerWidth || document.documentElement.clientWidth;
                const winH = window.innerHeight || document.documentElement.clientHeight;

                const scaleX = winW / V_WIDTH;
                const scaleY = winH / V_HEIGHT;
                this.scale = Math.min(scaleX, scaleY);

                const displayW = Math.floor(V_WIDTH * this.scale);
                const displayH = Math.floor(V_HEIGHT * this.scale);

                this.canvas.width = V_WIDTH;
                this.canvas.height = V_HEIGHT;

                this.canvas.style.width = displayW + 'px';
                this.canvas.style.height = displayH + 'px';
            };

            window.addEventListener('resize', resize);
            window.addEventListener('orientationchange', resize);
            resize();
        }

        // ------------------------------------------
        // Input Handling (Touch & Mouse)
        // ------------------------------------------
        setupInput() {
            const getVirtualCoords = (clientX, clientY) => {
                const rect = this.canvas.getBoundingClientRect();
                const x = (clientX - rect.left) * (V_WIDTH / rect.width);
                const y = (clientY - rect.top) * (V_HEIGHT / rect.height);
                return { x, y };
            };

            const handlePointerDown = (e) => {
                if (e.cancelable && e.type.startsWith('touch')) {
                    e.preventDefault();
                }
                this.audio.init();

                let clientX, clientY;
                if (e.touches && e.touches.length > 0) {
                    clientX = e.touches[0].clientX;
                    clientY = e.touches[0].clientY;
                } else {
                    clientX = e.clientX;
                    clientY = e.clientY;
                }

                const { x, y } = getVirtualCoords(clientX, clientY);
                this.onPointerDown(x, y);
            };

            this.canvas.addEventListener('mousedown', handlePointerDown);
            this.canvas.addEventListener('touchstart', handlePointerDown, { passive: false });

            // Keyboard Space / B for Bomb
            window.addEventListener('keydown', (e) => {
                if (this.state === STATE.PLAYING && (e.code === 'Space' || e.key === 'b' || e.key === 'B')) {
                    e.preventDefault();
                    this.triggerBomb();
                }
            });
        }

        onPointerDown(x, y) {
            // Mute Button is available in all states
            if (this.checkButtonClick(this.buttons.mute, x, y)) {
                const nowMuted = this.audio.toggleMute();
                if (!nowMuted) {
                    this.audio.play('click');
                }
                return;
            }

            if (this.state === STATE.START) {
                if (this.checkButtonClick(this.buttons.play, x, y)) {
                    this.audio.play('click');
                    this.startGame();
                }
                return;
            }

            if (this.state === STATE.PLAYING) {
                // Check Bomb button click
                if (this.checkButtonClick(this.buttons.bomb, x, y)) {
                    this.triggerBomb();
                    return;
                }

                // Check tap on bees (highest priority to attackers)
                let hitAnyBee = false;
                for (let i = this.bees.length - 1; i >= 0; i--) {
                    const bee = this.bees[i];
                    if (bee.isDead) continue;

                    const dx = x - bee.x;
                    const dy = y - bee.y;
                    const hitDist = Math.sqrt(dx * dx + dy * dy);

                    // Generous 55px tap radius for touch screens
                    if (hitDist <= bee.radius) {
                        hitAnyBee = true;
                        if (bee.type === 'YELLOW') {
                            this.defeatYellowBee(bee, i);
                        } else if (bee.type === 'BLUE') {
                            this.hitBlueBee(bee, i);
                        }
                        break;
                    }
                }

                // Small tap ripple effect on miss
                if (!hitAnyBee && y < 650) {
                    this.spawnTapRipple(x, y);
                }
                return;
            }

            if (this.state === STATE.GAMEOVER) {
                if (this.checkButtonClick(this.buttons.retry, x, y)) {
                    this.audio.play('click');
                    this.startGame();
                    return;
                }
                if (this.checkButtonClick(this.buttons.home, x, y)) {
                    this.audio.play('click');
                    this.state = STATE.START;
                    return;
                }
            }
        }

        checkButtonClick(btn, x, y) {
            if (!btn) return false;
            return (x >= btn.x && x <= btn.x + btn.w && y >= btn.y && y <= btn.y + btn.h);
        }

        // ------------------------------------------
        // Game Flow & Lifecycle
        // ------------------------------------------
        startGame() {
            this.state = STATE.PLAYING;
            this.score = 0;
            this.life = this.maxLife;
            this.beesDefeated = 0;
            this.blueBeesHit = 0;
            this.coins = 0;
            this.bombsUsed = 0;
            this.combo = 0;
            this.comboTimer = 0;
            this.gameTime = 0;
            this.bombCooldown = 0;
            this.spawnTimer = 0;
            this.spawnInterval = 1.8;
            this.beeBaseSpeed = 75;

            this.bees = [];
            this.particles = [];
            this.flyingCoins = [];
            this.floatingTexts = [];
            this.fallingPetals = [];

            this.audio.playBgm();
        }

        gameOver() {
            if (this.state === STATE.GAMEOVER) return;
            this.state = STATE.GAMEOVER;
            this.audio.stopBgm();
            this.audio.play('error');

            if (this.score > this.highScore) {
                this.highScore = this.score;
                safeSetStorage('bee_attack_highscore', this.highScore);
            }

            const stats = this.getGameStats();

            // 1. Submit score to API via scoreapi.js
            if (window.sendScoreToApi) {
                window.sendScoreToApi(stats);
            }

            // 2. Trigger auto redirect if enabled via gameover.js
            if (window.handleGameOverRedirect) {
                window.handleGameOverRedirect(stats);
            }
        }

        getGameStats() {
            const mins = Math.floor(this.gameTime / 60);
            const secs = Math.floor(this.gameTime % 60);
            const formattedTime = (mins < 10 ? '0' : '') + mins + ':' + (secs < 10 ? '0' : '') + secs;

            return {
                score: this.score,
                highScore: this.highScore,
                beesDefeated: this.beesDefeated,
                blueBeesHit: this.blueBeesHit,
                survivalTime: Math.floor(this.gameTime),
                formattedTime: formattedTime,
                coins: this.coins,
                bombsUsed: this.bombsUsed
            };
        }

        // ------------------------------------------
        // Game Mechanics
        // ------------------------------------------
        defeatYellowBee(bee, index) {
            bee.isDead = true;
            this.bees.splice(index, 1);

            this.beesDefeated++;
            this.combo++;
            this.comboTimer = 2.5;

            const comboMultiplier = Math.min(4, Math.floor(this.combo / 3) + 1);
            const earnedScore = 10 * comboMultiplier;
            this.score += earnedScore;

            this.audio.play('hit');

            // Spawn 10-frame explosion animation
            this.spawnExplosion(bee.x, bee.y);

            // Spawn flying coin to HUD
            this.spawnFlyingCoin(bee.x, bee.y);

            // Floating text
            let text = '+' + earnedScore;
            if (comboMultiplier > 1) {
                text += ' (x' + comboMultiplier + ')';
            }
            this.spawnFloatingText(text, bee.x, bee.y - 20, '#fbbf24');
        }

        hitBlueBee(bee, index) {
            bee.isDead = true;
            this.bees.splice(index, 1);
            this.blueBeesHit++;

            this.audio.play('error');
            this.spawnExplosion(bee.x, bee.y);

            // Penalty: lose 1 life!
            this.damageFlower('FRIENDLY BEE PENALTY!');
        }

        damageFlower(reason) {
            this.life = Math.max(0, this.life - 1);
            this.combo = 0;
            this.screenShake = 12;

            // Spawn falling petal particle
            this.spawnFallingPetal();

            if (reason) {
                this.spawnFloatingText(reason, FLOWER_POS.coreX, FLOWER_POS.coreY - 40, '#ef4444');
            }

            if (this.life <= 0) {
                this.gameOver();
            }
        }

        triggerBomb() {
            if (this.bombCooldown > 0 || this.state !== STATE.PLAYING) return;

            this.bombCooldown = this.maxBombCooldown;
            this.bombsUsed++;
            this.isBombFlashing = 1.0;
            this.screenShake = 20;
            this.audio.play('bomb');

            // Destroy all yellow bees currently on screen
            for (let i = this.bees.length - 1; i >= 0; i--) {
                const bee = this.bees[i];
                if (bee.type === 'YELLOW' && !bee.isDead) {
                    bee.isDead = true;
                    this.beesDefeated++;
                    this.score += 10;
                    this.spawnExplosion(bee.x, bee.y);
                    this.spawnFlyingCoin(bee.x, bee.y);
                    this.bees.splice(i, 1);
                }
            }

            this.spawnFloatingText('SUPER BOMB BLAST!', 240, 300, '#f97316');
        }

        // ------------------------------------------
        // Spawning Logic
        // ------------------------------------------
        updateSpawning(dt) {
            this.spawnTimer += dt;

            // Gradually ramp difficulty
            this.beeBaseSpeed = Math.min(180, 75 + Math.floor(this.gameTime * 1.5));
            this.spawnInterval = Math.max(0.75, 1.8 - (this.gameTime * 0.015));

            if (this.spawnTimer >= this.spawnInterval) {
                this.spawnTimer = 0;
                this.spawnBee();

                if (this.score > 200 && Math.random() < 0.35) {
                    setTimeout(() => {
                        if (this.state === STATE.PLAYING) this.spawnBee();
                    }, 400);
                }
            }
        }

        spawnBee() {
            const isBlue = Math.random() < 0.22; // 22% chance for friendly blue bee
            const fromLeft = Math.random() < 0.5;

            const startX = fromLeft ? -45 : V_WIDTH + 45;
            const startY = 120 + Math.random() * 320;

            if (isBlue) {
                // Blue bee flies peacefully across the screen
                const targetX = fromLeft ? V_WIDTH + 60 : -60;
                const targetY = startY + (Math.random() * 100 - 50);
                const speed = 90 + Math.random() * 40;

                this.bees.push({
                    type: 'BLUE',
                    fromLeft: fromLeft,
                    x: startX,
                    y: startY,
                    targetX: targetX,
                    targetY: targetY,
                    speed: speed,
                    radius: 46,
                    state: 'FLYING_THROUGH',
                    frameIndex: 0,
                    frameTimer: 0,
                    isDead: false
                });
            } else {
                // Yellow bee flies toward flower to steal pollen
                const speed = this.beeBaseSpeed + Math.random() * 30;

                this.bees.push({
                    type: 'YELLOW',
                    fromLeft: fromLeft,
                    x: startX,
                    y: startY,
                    targetX: FLOWER_POS.coreX + (Math.random() * 30 - 15),
                    targetY: FLOWER_POS.coreY + (Math.random() * 30 - 15),
                    speed: speed,
                    radius: 48,
                    state: 'ATTACKING',
                    feedTimer: 0,
                    frameIndex: 0,
                    frameTimer: 0,
                    isDead: false
                });
            }
        }

        // ------------------------------------------
        // Particle & Juice Effects
        // ------------------------------------------
        spawnExplosion(x, y) {
            this.particles.push({
                type: 'EXPLOSION',
                x: x,
                y: y,
                frame: 0,
                frameTime: 0,
                frameDuration: 0.038
            });
        }

        spawnFlyingCoin(startX, startY) {
            this.flyingCoins.push({
                x: startX,
                y: startY,
                targetX: 52,
                targetY: 48,
                progress: 0,
                speed: 1.8,
                frame: 0,
                frameTimer: 0
            });
        }

        spawnFloatingText(text, x, y, color = '#fbbf24') {
            this.floatingTexts.push({
                text: text,
                x: x,
                y: y,
                alpha: 1.0,
                color: color,
                vy: -40
            });
        }

        spawnFallingPetal() {
            this.fallingPetals.push({
                x: FLOWER_POS.coreX + (Math.random() * 40 - 20),
                y: FLOWER_POS.coreY,
                vx: (Math.random() - 0.5) * 60,
                vy: 80 + Math.random() * 40,
                rotation: Math.random() * Math.PI * 2,
                rotSpeed: (Math.random() - 0.5) * 6,
                alpha: 1.0
            });
        }

        spawnTapRipple(x, y) {
            this.particles.push({
                type: 'RIPPLE',
                x: x,
                y: y,
                radius: 10,
                maxRadius: 36,
                alpha: 0.7
            });
        }

        // ------------------------------------------
        // Update Loop
        // ------------------------------------------
        update(dt) {
            this.animTick += dt;
            this.flowerSway = Math.sin(this.animTick * 2.2) * 2.5;

            // Screen shake dampening
            if (this.screenShake > 0) {
                this.screenShake = Math.max(0, this.screenShake - dt * 30);
            }

            // Bomb flash decay
            if (this.isBombFlashing > 0) {
                this.isBombFlashing = Math.max(0, this.isBombFlashing - dt * 3.5);
            }

            // Bomb cooldown decrement
            if (this.bombCooldown > 0) {
                this.bombCooldown = Math.max(0, this.bombCooldown - dt);
            }

            if (this.state === STATE.PLAYING) {
                this.gameTime += dt;

                // Combo timer decay
                if (this.comboTimer > 0) {
                    this.comboTimer -= dt;
                    if (this.comboTimer <= 0) {
                        this.combo = 0;
                    }
                }

                // Spawner
                this.updateSpawning(dt);

                // Update Bees
                for (let i = this.bees.length - 1; i >= 0; i--) {
                    const bee = this.bees[i];

                    // Wing flap animation frame
                    bee.frameTimer += dt;
                    if (bee.frameTimer >= 0.05) {
                        bee.frameTimer = 0;
                        bee.frameIndex = (bee.frameIndex + 1) % 4;
                    }

                    if (bee.type === 'YELLOW') {
                        if (bee.state === 'ATTACKING') {
                            const dx = bee.targetX - bee.x;
                            const dy = bee.targetY - bee.y;
                            const dist = Math.sqrt(dx * dx + dy * dy);

                            if (dist < 10) {
                                bee.state = 'FEEDING';
                                bee.feedTimer = 2.2;
                            } else {
                                bee.x += (dx / dist) * bee.speed * dt;
                                bee.y += (dy / dist) * bee.speed * dt;
                                bee.y += Math.sin(this.animTick * 8 + i) * 0.8;
                            }
                        } else if (bee.state === 'FEEDING') {
                            bee.feedTimer -= dt;
                            if (bee.feedTimer <= 0) {
                                // Stole pollen! Flower loses a life!
                                this.damageFlower('-1 PETAL! POLLEN STOLEN!');
                                bee.state = 'KABUR';
                                bee.targetX = bee.fromLeft ? -80 : V_WIDTH + 80;
                                bee.targetY = 80 + Math.random() * 120;
                                bee.speed = this.beeBaseSpeed * 1.5;
                            }
                        } else if (bee.state === 'KABUR') {
                            const dx = bee.targetX - bee.x;
                            const dy = bee.targetY - bee.y;
                            const dist = Math.sqrt(dx * dx + dy * dy);

                            if (dist < 15 || bee.x < -60 || bee.x > V_WIDTH + 60) {
                                this.bees.splice(i, 1);
                                continue;
                            }
                            bee.x += (dx / dist) * bee.speed * dt;
                            bee.y += (dy / dist) * bee.speed * dt;
                        }
                    } else if (bee.type === 'BLUE') {
                        const dx = bee.targetX - bee.x;
                        const dy = bee.targetY - bee.y;
                        const dist = Math.sqrt(dx * dx + dy * dy);

                        if (dist < 15 || bee.x < -70 || bee.x > V_WIDTH + 70) {
                            this.bees.splice(i, 1);
                            continue;
                        }
                        bee.x += (dx / dist) * bee.speed * dt;
                        bee.y += (dy / dist) * bee.speed * dt;
                        bee.y += Math.sin(this.animTick * 5 + i) * 0.6;
                    }
                }

                // Update Flying Coins
                for (let i = this.flyingCoins.length - 1; i >= 0; i--) {
                    const fc = this.flyingCoins[i];
                    fc.progress += fc.speed * dt;

                    fc.frameTimer += dt;
                    if (fc.frameTimer >= 0.06) {
                        fc.frameTimer = 0;
                        fc.frame = (fc.frame + 1) % 12;
                    }

                    if (fc.progress >= 1.0) {
                        this.coins++;
                        this.audio.play('coin');
                        this.flyingCoins.splice(i, 1);
                    }
                }
            }

            // Update Explosions
            for (let i = this.particles.length - 1; i >= 0; i--) {
                const p = this.particles[i];
                if (p.type === 'EXPLOSION') {
                    p.frameTime += dt;
                    if (p.frameTime >= p.frameDuration) {
                        p.frameTime = 0;
                        p.frame++;
                        if (p.frame >= 10) {
                            this.particles.splice(i, 1);
                        }
                    }
                } else if (p.type === 'RIPPLE') {
                    p.radius += 50 * dt;
                    p.alpha -= 1.8 * dt;
                    if (p.alpha <= 0 || p.radius >= p.maxRadius) {
                        this.particles.splice(i, 1);
                    }
                }
            }

            // Update Falling Petals
            for (let i = this.fallingPetals.length - 1; i >= 0; i--) {
                const fp = this.fallingPetals[i];
                fp.x += fp.vx * dt;
                fp.y += fp.vy * dt;
                fp.rotation += fp.rotSpeed * dt;
                fp.alpha -= 0.35 * dt;

                if (fp.y > V_HEIGHT || fp.alpha <= 0) {
                    this.fallingPetals.splice(i, 1);
                }
            }

            // Update Floating Texts
            for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
                const ft = this.floatingTexts[i];
                ft.y += ft.vy * dt;
                ft.alpha -= 0.8 * dt;
                if (ft.alpha <= 0) {
                    this.floatingTexts.splice(i, 1);
                }
            }
        }

        // ------------------------------------------
        // Render Loop
        // ------------------------------------------
        render() {
            const ctx = this.ctx;
            ctx.clearRect(0, 0, V_WIDTH, V_HEIGHT);

            ctx.save();
            // Screen Shake Effect
            if (this.screenShake > 0) {
                const sx = (Math.random() - 0.5) * this.screenShake;
                const sy = (Math.random() - 0.5) * this.screenShake;
                ctx.translate(sx, sy);
            }

            if (this.state === STATE.START) {
                this.renderStartScreen();
            } else if (this.state === STATE.PLAYING) {
                this.renderGameScreen();
            } else if (this.state === STATE.GAMEOVER) {
                this.renderGameOverScreen();
            }

            // Full-screen White Flash from Bomb
            if (this.isBombFlashing > 0) {
                ctx.save();
                ctx.globalAlpha = Math.min(0.9, this.isBombFlashing);
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, V_WIDTH, V_HEIGHT);
                ctx.restore();
            }

            ctx.restore();
        }

        // ------------------------------------------
        // Screen Renderers
        // ------------------------------------------
        renderStartScreen() {
            const ctx = this.ctx;
            // Background
            drawSafe(ctx, this.images.bgopening, 0, 0, V_WIDTH, V_HEIGHT);

            // Animated Play Button
            const playBounce = Math.sin(this.animTick * 4) * 5;
            const playBtnW = 140;
            const playBtnH = 140;
            const playBtnX = 240 - playBtnW / 2;
            const playBtnY = 460 - playBtnH / 2 + playBounce;

            this.buttons.play = { x: playBtnX, y: playBtnY, w: playBtnW, h: playBtnH };

            drawSafe(ctx, this.images.butopening, playBtnX, playBtnY, playBtnW, playBtnH);

            // High Score Badge
            ctx.save();
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 20px "Segoe UI", Arial, sans-serif';
            ctx.textAlign = 'center';
            ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
            ctx.shadowBlur = 6;
            ctx.fillText('BEST SCORE: ' + this.highScore, 240, 615);

            // Instructions hint
            ctx.font = '15px "Segoe UI", Arial, sans-serif';
            ctx.fillStyle = '#fef08a';
            ctx.fillText('Tap yellow bees to protect the flower!', 240, 650);
            ctx.fillText('Avoid blue friendly bees!', 240, 674);
            ctx.restore();

            // Mute Button
            this.renderMuteButton(35, 35);
        }

        renderGameScreen() {
            const ctx = this.ctx;

            // 1. Background
            drawSafe(ctx, this.images.bggame, 0, 0, V_WIDTH, V_HEIGHT);

            // 2. Flower & Pot
            this.renderFlower();

            // 3. Falling Petals
            for (const fp of this.fallingPetals) {
                ctx.save();
                ctx.globalAlpha = Math.max(0, fp.alpha);
                ctx.translate(fp.x, fp.y);
                ctx.rotate(fp.rotation);
                drawSafe(ctx, this.images.daun0, 215, 425, 73, 65, -18, -16, 36, 32);
                ctx.restore();
            }

            // 4. Bees
            for (const bee of this.bees) {
                this.renderBee(bee);
            }

            // 5. Particles (Explosions & Ripples)
            for (const p of this.particles) {
                if (p.type === 'EXPLOSION') {
                    const frameData = SPRITES.ledak[p.frame];
                    if (frameData && this.images[frameData.file]) {
                        drawSafe(
                            ctx,
                            this.images[frameData.file],
                            frameData.x, frameData.y, frameData.w, frameData.h,
                            p.x - 55, p.y - 55, 110, 110
                        );
                    }
                } else if (p.type === 'RIPPLE') {
                    ctx.save();
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                    ctx.strokeStyle = `rgba(255, 255, 255, ${p.alpha})`;
                    ctx.lineWidth = 2.5;
                    ctx.stroke();
                    ctx.restore();
                }
            }

            // 6. Flying Coins
            for (const fc of this.flyingCoins) {
                const curX = fc.x + (fc.targetX - fc.x) * fc.progress;
                const curY = fc.y + (fc.targetY - fc.y) * fc.progress - Math.sin(fc.progress * Math.PI) * 50;
                drawSafe(ctx, this.images.coinjalan, curX - 22, curY - 22, 44, 44);
            }

            // 7. Floating Texts
            for (const ft of this.floatingTexts) {
                ctx.save();
                ctx.globalAlpha = Math.max(0, ft.alpha);
                ctx.font = 'bold 22px "Segoe UI", Arial, sans-serif';
                ctx.fillStyle = ft.color;
                ctx.textAlign = 'center';
                ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
                ctx.shadowBlur = 6;
                ctx.fillText(ft.text, ft.x, ft.y);
                ctx.restore();
            }

            // 8. HUD Overlay
            this.renderHUD();
        }

        renderFlower() {
            const ctx = this.ctx;

            // Pot (base + stem + bulb)
            drawSafe(ctx, this.images.pot, FLOWER_POS.potX, FLOWER_POS.potY, 213, 436);

            // Petals: Render petal frame matching current life
            // 9 lives -> petal index 0, 1 life -> petal index 8, 0 life -> no petals
            if (this.life > 0) {
                const petalIndex = Math.min(8, this.maxLife - this.life);
                const petalSprite = SPRITES.petals[petalIndex];

                if (petalSprite && this.images[petalSprite.file]) {
                    ctx.save();
                    ctx.translate(FLOWER_POS.coreX, FLOWER_POS.coreY);
                    ctx.rotate(this.flowerSway * Math.PI / 180);

                    drawSafe(
                        ctx,
                        this.images[petalSprite.file],
                        petalSprite.x, petalSprite.y, petalSprite.w, petalSprite.h,
                        -petalSprite.w / 2, -petalSprite.h / 2, petalSprite.w, petalSprite.h
                    );
                    ctx.restore();
                }
            }

            // Flower Bulb / Center (`tghbunga`)
            if (this.images.tghbunga) {
                ctx.save();
                ctx.translate(FLOWER_POS.coreX, FLOWER_POS.coreY);
                ctx.rotate(this.flowerSway * Math.PI / 180);
                drawSafe(ctx, this.images.tghbunga, -48, -48, 96, 96);
                ctx.restore();
            }
        }

        renderBee(bee) {
            const ctx = this.ctx;
            ctx.save();

            let spriteFrame;
            if (bee.type === 'YELLOW') {
                const isKabur = bee.state === 'KABUR';
                const atlas = bee.fromLeft ? SPRITES.beekiri : SPRITES.beekanan;
                const frames = isKabur ? atlas.kabur : atlas.fly;
                spriteFrame = frames[bee.frameIndex % frames.length];
            } else {
                const frames = bee.fromLeft ? SPRITES.buukiri : SPRITES.buukanan;
                spriteFrame = frames[bee.frameIndex % frames.length];
            }

            if (spriteFrame && this.images[spriteFrame.file]) {
                const w = 84;
                const h = 84;

                drawSafe(
                    ctx,
                    this.images[spriteFrame.file],
                    spriteFrame.x, spriteFrame.y, spriteFrame.w, spriteFrame.h,
                    bee.x - w / 2, bee.y - h / 2, w, h
                );

                // Warning indicator when bee is feeding on flower
                if (bee.state === 'FEEDING') {
                    ctx.fillStyle = '#ef4444';
                    ctx.beginPath();
                    ctx.arc(bee.x, bee.y - 45, 6 + Math.sin(this.animTick * 15) * 2, 0, Math.PI * 2);
                    ctx.fill();
                }
            }

            ctx.restore();
        }

        renderHUD() {
            const ctx = this.ctx;

            // --- Top Left: Coin & Score Counter ---
            const coinFrameIdx = Math.floor((this.animTick * 15) % 12);
            const coinData = SPRITES.coin[coinFrameIdx];
            if (coinData && this.images[coinData.file]) {
                drawSafe(
                    ctx,
                    this.images[coinData.file],
                    coinData.x, coinData.y, coinData.w, coinData.h,
                    20, 22, 42, 42
                );
            }

            ctx.save();
            ctx.font = 'bold 30px "Segoe UI", Arial, sans-serif';
            ctx.fillStyle = '#ffffff';
            ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
            ctx.shadowBlur = 6;
            ctx.textAlign = 'left';
            ctx.fillText(this.score, 72, 53);

            // Combo counter
            if (this.combo > 1) {
                ctx.font = 'bold 16px "Segoe UI", Arial, sans-serif';
                ctx.fillStyle = '#fbbf24';
                ctx.fillText('COMBO x' + this.combo, 74, 76);
            }

            // --- Top Right: Petal Health Bar ---
            ctx.font = 'bold 18px "Segoe UI", Arial, sans-serif';
            ctx.fillStyle = '#fef08a';
            ctx.textAlign = 'right';
            ctx.fillText('PETALS: ' + this.life + '/' + this.maxLife, V_WIDTH - 25, 45);

            // Mini petal pips
            for (let p = 0; p < this.maxLife; p++) {
                const pipX = V_WIDTH - 25 - (this.maxLife - 1 - p) * 16;
                const pipY = 56;
                ctx.beginPath();
                ctx.arc(pipX, pipY, 5, 0, Math.PI * 2);
                if (p < this.life) {
                    ctx.fillStyle = '#eab308';
                    ctx.fill();
                } else {
                    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
                    ctx.stroke();
                }
            }

            ctx.restore();

            // --- Bottom Center: Bomb Super Weapon Button ---
            const bombBtnW = 100;
            const bombBtnH = 100;
            const bombBtnX = 240 - bombBtnW / 2;
            const bombBtnY = 675;

            this.buttons.bomb = { x: bombBtnX, y: bombBtnY, w: bombBtnW, h: bombBtnH };

            const isBombReady = this.bombCooldown <= 0;
            const bombImg = isBombReady ? this.images.butbomb0 : this.images.butbomb1;

            if (bombImg) {
                ctx.save();
                if (!isBombReady) {
                    ctx.globalAlpha = 0.6;
                }
                drawSafe(ctx, bombImg, bombBtnX, bombBtnY, bombBtnW, bombBtnH);
                ctx.restore();
            }

            // Cooldown overlay on bomb button
            if (!isBombReady) {
                const cooldownPct = this.bombCooldown / this.maxBombCooldown;
                ctx.save();
                ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
                ctx.beginPath();
                ctx.moveTo(240, bombBtnY + bombBtnH / 2);
                ctx.arc(
                    240, bombBtnY + bombBtnH / 2,
                    bombBtnW / 2,
                    -Math.PI / 2,
                    -Math.PI / 2 + (cooldownPct * Math.PI * 2)
                );
                ctx.closePath();
                ctx.fill();

                // Cooldown countdown text
                ctx.font = 'bold 22px "Segoe UI", Arial, sans-serif';
                ctx.fillStyle = '#ffffff';
                ctx.textAlign = 'center';
                ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
                ctx.shadowBlur = 6;
                ctx.fillText(Math.ceil(this.bombCooldown) + 's', 240, bombBtnY + 58);
                ctx.restore();
            }

            // Mute Button
            this.renderMuteButton(V_WIDTH - 55, 90);
        }

        renderGameOverScreen() {
            const ctx = this.ctx;

            // Result Background
            if (!drawSafe(ctx, this.images.bgresult, 0, 0, V_WIDTH, V_HEIGHT)) {
                ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
                ctx.fillRect(0, 0, V_WIDTH, V_HEIGHT);
            }

            // Score Numbers on the Result Card
            ctx.save();
            ctx.textAlign = 'center';
            ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
            ctx.shadowBlur = 8;

            // Final Score
            ctx.font = 'bold 52px "Segoe UI", Arial, sans-serif';
            ctx.fillStyle = '#7c2d12';
            ctx.fillText(this.score, 240, 260);

            // Score Label
            ctx.font = 'bold 16px "Segoe UI", Arial, sans-serif';
            ctx.fillStyle = '#b45309';
            ctx.fillText('FINAL SCORE', 240, 288);

            // Stats row
            ctx.font = 'bold 17px "Segoe UI", Arial, sans-serif';
            ctx.fillStyle = '#451a03';
            ctx.fillText('Bees Swatted: ' + this.beesDefeated, 240, 330);
            ctx.fillText('Coins Collected: ' + this.coins, 240, 356);

            const mins = Math.floor(this.gameTime / 60);
            const secs = Math.floor(this.gameTime % 60);
            const timeStr = (mins < 10 ? '0' : '') + mins + ':' + (secs < 10 ? '0' : '') + secs;
            ctx.fillText('Time Survived: ' + timeStr, 240, 382);

            // High Score
            ctx.font = 'bold 18px "Segoe UI", Arial, sans-serif';
            ctx.fillStyle = '#b45309';
            ctx.fillText('BEST SCORE: ' + this.highScore, 240, 415);

            ctx.restore();

            // Interactive Buttons: Home & Retry (centered on result card)
            const btnSize = 96;
            const homeBtnX = 160 - btnSize / 2;
            const retryBtnX = 320 - btnSize / 2;
            const btnY = 470;

            this.buttons.home = { x: homeBtnX, y: btnY, w: btnSize, h: btnSize };
            this.buttons.retry = { x: retryBtnX, y: btnY, w: btnSize, h: btnSize };

            drawSafe(ctx, this.images.buthome, homeBtnX, btnY, btnSize, btnSize);
            drawSafe(ctx, this.images.butretry, retryBtnX, btnY, btnSize, btnSize);

            // Mute Button
            this.renderMuteButton(35, 35);
        }

        renderMuteButton(x, y) {
            const size = 36;
            this.buttons.mute = { x, y, w: size, h: size };

            // When muted -> show mutesound0 (red X). When active -> show mutesound1 (sound waves)
            const muteImg = this.audio.muted ? this.images.mutesound0 : this.images.mutesound1;
            if (muteImg) {
                drawSafe(this.ctx, muteImg, x, y, size, size);
            }
        }

        // ------------------------------------------
        // Game Engine Loop
        // ------------------------------------------
        gameLoop(timestamp) {
            const dt = Math.min(0.1, (timestamp - this.lastTime) / 1000);
            this.lastTime = timestamp;

            this.update(dt);
            this.render();

            requestAnimationFrame((ts) => this.gameLoop(ts));
        }
    }

    // Resilient Initialization on any state
    function initGame() {
        if (!window.beeAttackGame) {
            window.beeAttackGame = new BeeAttackGame();
        }
    }

    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        initGame();
    } else {
        window.addEventListener('DOMContentLoaded', initGame);
        window.addEventListener('load', initGame);
    }

})();
