/**
 * Flappy Zigzag - Neon Arcade Engine
 * Resolution: 1080 x 1920 (9:16 Portrait HD)
 * Features:
 *  - 3 Lives System (❤️❤️❤️) with Invincibility Frames & Heart Recovery
 *  - Extended Easy-to-Hard Progression
 *  - Glowing Coin Trails & Chains along zigzag paths
 *  - 🧲 Magnet Power-Up (10s magnetic suction of all nearby coins)
 *  - 🛡️ Force Shield Bubble (absorbs damage)
 *  - 🚀 Hyper Turbo Boost Ring (supersonic invincibility & obstacle smashing)
 *  - 🔥 2X Score Multiplier
 *  - ❤️ Extra Life Pickups
 *  - 💎 Prismatic Mega Gems (+10 pts)
 */

(function () {
    'use strict';

    // Canvas & Internal Resolution
    const CANVAS_WIDTH = 1080;
    const CANVAS_HEIGHT = 1920;
    const WALL_LEFT = 80;
    const WALL_RIGHT = 1000;

    // Theme Palettes
    const THEMES = {
        cyberpunk: {
            name: 'Cyberpunk',
            primary: '#00f3ff',      // Neon Cyan
            secondary: '#ff007f',    // Neon Magenta
            accent: '#ffe600',       // Neon Gold / Coin
            bgGrad1: '#070714',
            bgGrad2: '#0d0d26',
            gridColor: 'rgba(0, 243, 255, 0.08)',
            trailColor: 'rgba(0, 243, 255, 0.7)',
            playerColor: '#00f3ff',
            hazardColor: '#ff0055'
        },
        matrix: {
            name: 'Matrix',
            primary: '#00ff66',
            secondary: '#70ff00',
            accent: '#c8ff00',
            bgGrad1: '#030d05',
            bgGrad2: '#06170a',
            gridColor: 'rgba(0, 255, 102, 0.08)',
            trailColor: 'rgba(0, 255, 102, 0.7)',
            playerColor: '#00ff66',
            hazardColor: '#ff3344'
        },
        solar: {
            name: 'Solar',
            primary: '#ffaa00',
            secondary: '#ff3300',
            accent: '#ffff33',
            bgGrad1: '#120803',
            bgGrad2: '#200e05',
            gridColor: 'rgba(255, 170, 0, 0.08)',
            trailColor: 'rgba(255, 170, 0, 0.7)',
            playerColor: '#ffaa00',
            hazardColor: '#ff0044'
        },
        violet: {
            name: 'Violet',
            primary: '#d946ef',
            secondary: '#8b5cf6',
            accent: '#38bdf8',
            bgGrad1: '#0d0517',
            bgGrad2: '#180a2b',
            gridColor: 'rgba(217, 70, 239, 0.08)',
            trailColor: 'rgba(217, 70, 239, 0.7)',
            playerColor: '#d946ef',
            hazardColor: '#ef4444'
        }
    };

    // Game States
    const STATE = {
        START: 'START',
        PLAYING: 'PLAYING',
        PAUSED: 'PAUSED',
        GAMEOVER: 'GAMEOVER'
    };

    class Game {
        constructor() {
            this.canvas = document.getElementById('gameCanvas');
            this.ctx = this.canvas.getContext('2d');

            this.canvas.width = CANVAS_WIDTH;
            this.canvas.height = CANVAS_HEIGHT;

            // Settings
            this.themeKey = localStorage.getItem('fz_theme') || 'cyberpunk';
            this.glowQuality = localStorage.getItem('fz_glow') || 'high';
            this.difficulty = localStorage.getItem('fz_diff') || 'normal';

            // High Score
            this.bestScore = parseInt(localStorage.getItem('fz_best') || '0', 10);

            // Game State
            this.state = STATE.START;
            this.score = 0;
            this.playStartTime = 0;
            this.elapsedTime = 0;
            this.lastFrameTime = 0;
            this.cameraY = 0;
            this.shake = 0;
            this.combo = 0;
            this.coinCombo = 0;
            this.coinComboTimer = 0;
            this.settingsWasPlaying = false;
            this.gameOverTime = 0;
            this.lastMilestone = 0;

            // Entities
            this.player = null;
            this.obstacles = [];
            this.coins = [];
            this.powerups = [];
            this.particles = [];
            this.floatingTexts = [];
            this.bgStars = [];

            // UI Elements
            this.scoreEl = document.getElementById('hud-score');
            this.bestScoreEl = document.getElementById('hud-best');
            this.timerEl = document.getElementById('hud-timer');

            // Lives Elements
            this.lifeHearts = [
                document.getElementById('life-1'),
                document.getElementById('life-2'),
                document.getElementById('life-3')
            ];

            // Power-up Badges
            this.badgeMagnet = document.getElementById('hud-magnet-badge');
            this.timerMagnet = document.getElementById('hud-magnet-timer');
            this.badgeMult = document.getElementById('hud-mult-badge');
            this.timerMult = document.getElementById('hud-mult-timer');
            this.badgeShield = document.getElementById('hud-shield-badge');
            this.badgeBoost = document.getElementById('hud-boost-badge');

            // Modals
            this.startModal = document.getElementById('start-overlay');
            this.settingsModal = document.getElementById('settings-modal');
            this.pauseModal = document.getElementById('pause-modal');
            this.gameOverModal = document.getElementById('gameover-modal');

            this.initBackgroundStars();
            this.initPlayer();
            this.setupInputs();
            this.bindUI();
            this.updateBestScoreDisplay();
            this.applySettings();

            // Start Animation Loop
            requestAnimationFrame(this.loop.bind(this));
        }

        get theme() {
            return THEMES[this.themeKey] || THEMES.cyberpunk;
        }

        initBackgroundStars() {
            this.bgStars = [];
            for (let i = 0; i < 70; i++) {
                this.bgStars.push({
                    x: Math.random() * CANVAS_WIDTH,
                    y: Math.random() * CANVAS_HEIGHT * 2,
                    size: Math.random() * 3 + 1,
                    speed: Math.random() * 0.4 + 0.1,
                    alpha: Math.random() * 0.7 + 0.3
                });
            }
        }

        initPlayer() {
            const startY = 1400;
            this.player = {
                x: CANVAS_WIDTH / 2,
                y: startY,
                radius: 22,
                dir: 1, // 1 for ↗ (right-up), -1 for ↖ (left-up)
                baseSpeed: 330, // Smooth & relaxed start
                flapImpulse: 0,
                alive: true,
                trail: [],
                angle: Math.PI / 4,
                wingPulse: 0,
                bounceShields: 4, // 4 early wall cushions
                lives: 3, // 3 Lives
                invincibleTimer: 0,
                hasShield: false,
                magnetTimer: 0,
                multiplierTimer: 0,
                boostTimer: 0
            };
            this.cameraY = this.player.y - 1300;
            this.lastMilestone = 0;
            this.coinCombo = 0;
            this.coinComboTimer = 0;
            this.updateLivesHUD();
        }

        updateLivesHUD() {
            if (!this.player || !this.lifeHearts[0]) return;
            for (let i = 0; i < 3; i++) {
                if (i < this.player.lives) {
                    this.lifeHearts[i].classList.remove('lost');
                } else {
                    this.lifeHearts[i].classList.add('lost');
                }
            }
        }

        setupInputs() {
            const handleAction = (e) => {
                if (e.target.closest('.hud-btn') || e.target.closest('.modal-panel') || e.target.closest('#hud')) {
                    return;
                }

                window.neonAudio.ensureContext();

                if (this.state === STATE.START) {
                    this.startGame();
                } else if (this.state === STATE.PLAYING) {
                    this.flap();
                } else if (this.state === STATE.GAMEOVER) {
                    if (Date.now() - this.gameOverTime > 650) {
                        this.restartGame();
                    }
                }
            };

            window.addEventListener('pointerdown', handleAction);
            window.addEventListener('keydown', (e) => {
                window.neonAudio.ensureContext();
                if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
                    e.preventDefault();
                    handleAction(e);
                }
                if (e.code === 'Escape') {
                    this.togglePause();
                }
            });
        }

        bindUI() {
            // Top-left Settings button
            const btnSettings = document.getElementById('btn-settings');
            btnSettings.addEventListener('click', (e) => {
                e.stopPropagation();
                window.neonAudio.playClick();
                this.openSettings();
            });

            // Top-left Cross button
            const btnCross = document.getElementById('btn-cross');
            btnCross.addEventListener('click', (e) => {
                e.stopPropagation();
                window.neonAudio.playClick();
                this.togglePause();
            });

            // Start button
            const btnStart = document.getElementById('btn-start-game');
            if (btnStart) {
                btnStart.addEventListener('click', (e) => {
                    e.stopPropagation();
                    window.neonAudio.playClick();
                    this.startGame();
                });
            }

            // Pause Modal Buttons
            document.getElementById('btn-resume').addEventListener('click', () => {
                window.neonAudio.playClick();
                this.resumeGame();
            });
            document.getElementById('btn-restart-pause').addEventListener('click', () => {
                window.neonAudio.playClick();
                this.pauseModal.classList.add('hidden');
                this.restartGame();
            });
            document.getElementById('btn-quit-menu').addEventListener('click', () => {
                window.neonAudio.playClick();
                this.pauseModal.classList.add('hidden');
                this.returnToMenu();
            });

            // Game Over Modal Buttons
            document.getElementById('btn-retry').addEventListener('click', () => {
                window.neonAudio.playClick();
                this.restartGame();
            });
            document.getElementById('btn-menu-go').addEventListener('click', () => {
                window.neonAudio.playClick();
                this.gameOverModal.classList.add('hidden');
                this.returnToMenu();
            });

            // Settings Modal UI
            document.getElementById('btn-close-settings').addEventListener('click', () => {
                window.neonAudio.playClick();
                this.closeSettings();
            });

            // Sound toggles
            const toggleSFX = document.getElementById('toggle-sfx');
            toggleSFX.checked = window.neonAudio.sfxEnabled;
            toggleSFX.addEventListener('change', (e) => {
                window.neonAudio.setSFXEnabled(e.target.checked);
                localStorage.setItem('fz_sfx', e.target.checked);
            });

            const toggleBGM = document.getElementById('toggle-bgm');
            toggleBGM.checked = window.neonAudio.bgmEnabled;
            toggleBGM.addEventListener('change', (e) => {
                window.neonAudio.setBGMEnabled(e.target.checked);
                localStorage.setItem('fz_bgm', e.target.checked);
            });

            const sfxVol = document.getElementById('slider-sfx-vol');
            sfxVol.value = window.neonAudio.sfxVolume * 100;
            sfxVol.addEventListener('input', (e) => {
                window.neonAudio.setSFXVolume(e.target.value / 100);
            });

            const bgmVol = document.getElementById('slider-bgm-vol');
            bgmVol.value = window.neonAudio.bgmVolume * 100;
            bgmVol.addEventListener('input', (e) => {
                window.neonAudio.setBGMVolume(e.target.value / 100);
            });

            // Theme selector
            const themeSelect = document.getElementById('select-theme');
            themeSelect.value = this.themeKey;
            themeSelect.addEventListener('change', (e) => {
                this.themeKey = e.target.value;
                localStorage.setItem('fz_theme', this.themeKey);
                this.updateThemeVisuals();
            });

            // Glow selector
            const glowSelect = document.getElementById('select-glow');
            glowSelect.value = this.glowQuality;
            glowSelect.addEventListener('change', (e) => {
                this.glowQuality = e.target.value;
                localStorage.setItem('fz_glow', this.glowQuality);
            });

            // Difficulty selector
            const diffSelect = document.getElementById('select-diff');
            diffSelect.value = this.difficulty;
            diffSelect.addEventListener('change', (e) => {
                this.difficulty = e.target.value;
                localStorage.setItem('fz_diff', this.difficulty);
            });

            // Reset score button
            document.getElementById('btn-reset-best').addEventListener('click', () => {
                if (confirm('Reset high score to 0?')) {
                    this.bestScore = 0;
                    localStorage.setItem('fz_best', '0');
                    this.updateBestScoreDisplay();
                    window.neonAudio.playClick();
                }
            });
        }

        applySettings() {
            if (localStorage.getItem('fz_sfx') !== null) {
                window.neonAudio.setSFXEnabled(localStorage.getItem('fz_sfx') === 'true');
            }
            if (localStorage.getItem('fz_bgm') !== null) {
                window.neonAudio.setBGMEnabled(localStorage.getItem('fz_bgm') === 'true');
            }
            this.updateThemeVisuals();
        }

        updateThemeVisuals() {
            const th = this.theme;
            document.documentElement.style.setProperty('--neon-primary', th.primary);
            document.documentElement.style.setProperty('--neon-secondary', th.secondary);
            document.documentElement.style.setProperty('--neon-accent', th.accent);
        }

        updateBestScoreDisplay() {
            this.bestScoreEl.textContent = `BEST: ${this.bestScore}`;
        }

        startGame() {
            this.initPlayer();
            this.obstacles = [];
            this.coins = [];
            this.powerups = [];
            this.particles = [];
            this.floatingTexts = [];
            this.score = 0;
            this.combo = 0;
            this.coinCombo = 0;
            this.coinComboTimer = 0;
            this.scoreEl.textContent = '0';
            this.elapsedTime = 0;
            this.playStartTime = performance.now();
            this.timerEl.textContent = '00:00.0';

            this.hideAllPowerupBadges();

            // Spawn early bonus power-ups so the player gets to test them right away!
            this.spawnPowerup((WALL_LEFT + WALL_RIGHT) / 2 - 120, 1180, 'magnet');
            this.spawnPowerup((WALL_LEFT + WALL_RIGHT) / 2 + 120, 950, 'shield');

            // Generate initial batch of obstacles with generous early spacing
            let currentY = 800;
            for (let i = 0; i < 8; i++) {
                this.spawnObstacle(currentY);
                const spacing = i < 3 ? 600 : 520;
                currentY -= spacing;
            }

            this.startModal.classList.add('hidden');
            this.gameOverModal.classList.add('hidden');
            this.pauseModal.classList.add('hidden');

            this.state = STATE.PLAYING;
            window.neonAudio.ensureContext();
            window.neonAudio.startBGM();
            window.neonAudio.playFlap();
            this.createFlapBurst();

            this.createFloatingText('READY... 3 LIVES! ❤️❤️❤️', CANVAS_WIDTH / 2, 1250, this.theme.primary, 42, 2.0);
        }

        hideAllPowerupBadges() {
            if (this.badgeMagnet) this.badgeMagnet.classList.add('hidden');
            if (this.badgeMult) this.badgeMult.classList.add('hidden');
            if (this.badgeShield) this.badgeShield.classList.add('hidden');
            if (this.badgeBoost) this.badgeBoost.classList.add('hidden');
        }

        restartGame() {
            this.startGame();
        }

        returnToMenu() {
            this.state = STATE.START;
            this.startModal.classList.remove('hidden');
            this.pauseModal.classList.add('hidden');
            this.gameOverModal.classList.add('hidden');
            this.initPlayer();
            this.obstacles = [];
            this.coins = [];
            this.powerups = [];
            this.particles = [];
            this.floatingTexts = [];
            this.score = 0;
            this.scoreEl.textContent = '0';
            this.elapsedTime = 0;
            this.timerEl.textContent = '00:00.0';
            this.hideAllPowerupBadges();
            window.neonAudio.stopBGM();
        }

        openSettings() {
            if (this.state === STATE.PLAYING) {
                this.state = STATE.PAUSED;
                this.settingsWasPlaying = true;
            }
            this.settingsModal.classList.remove('hidden');
        }

        closeSettings() {
            this.settingsModal.classList.add('hidden');
            if (this.settingsWasPlaying && this.pauseModal.classList.contains('hidden')) {
                this.settingsWasPlaying = false;
                this.resumeGame();
            }
        }

        togglePause() {
            if (this.state === STATE.PLAYING) {
                this.state = STATE.PAUSED;
                this.pauseModal.classList.remove('hidden');
            } else if (this.state === STATE.PAUSED && !this.pauseModal.classList.contains('hidden')) {
                this.resumeGame();
            }
        }

        resumeGame() {
            this.pauseModal.classList.add('hidden');
            this.state = STATE.PLAYING;
            this.playStartTime = performance.now() - this.elapsedTime;
        }

        flap() {
            if (!this.player || !this.player.alive) return;

            // Toggle direction: 1 (right-up) <-> -1 (left-up)
            this.player.dir = -this.player.dir;
            this.player.flapImpulse = 180;
            this.player.wingPulse = 1.0;

            window.neonAudio.playFlap();
            this.createFlapBurst();
        }

        createFlapBurst() {
            const count = this.glowQuality === 'low' ? 6 : 14;
            const th = this.theme;
            for (let i = 0; i < count; i++) {
                const angle = Math.random() * Math.PI * 2;
                const spd = Math.random() * 220 + 80;
                this.particles.push({
                    x: this.player.x,
                    y: this.player.y + 10,
                    vx: Math.cos(angle) * spd - this.player.dir * 40,
                    vy: Math.sin(angle) * spd + 120,
                    size: Math.random() * 7 + 3,
                    color: Math.random() > 0.4 ? th.primary : th.secondary,
                    life: 1.0,
                    decay: Math.random() * 2.2 + 1.8
                });
            }
        }

        spawnCoinTrail(startX, startY, endX, endY, count = 6) {
            for (let i = 0; i < count; i++) {
                const t = (i + 0.5) / count;
                const cx = startX + (endX - startX) * t;
                const cy = startY + (endY - startY) * t;
                this.coins.push({
                    x: cx,
                    y: cy,
                    radius: 16,
                    pulse: Math.random() * Math.PI * 2,
                    collected: false,
                    isMagnetized: false
                });
            }
        }

        spawnPowerup(x, y, type) {
            this.powerups.push({
                type: type,
                x: x,
                y: y,
                radius: 28,
                pulse: Math.random() * Math.PI,
                collected: false
            });
        }

        spawnObstacle(y) {
            const th = this.theme;
            let type = 'gate';
            let gapSize = 460;
            let minX = WALL_LEFT + 60;

            // Progressive difficulty curve:
            if (this.score <= 15) {
                type = 'gate';
                gapSize = 460;
            } else if (this.score <= 32) {
                const types = ['gate', 'gate', 'movingGate'];
                type = types[Math.floor(Math.random() * types.length)];
                gapSize = 390 - (this.score - 15) * 4;
            } else if (this.score <= 55) {
                const types = ['gate', 'movingGate', 'pinchGate', 'rotatingBar'];
                type = types[Math.floor(Math.random() * types.length)];
                gapSize = 320 - (this.score - 32) * 3;
            } else {
                const types = ['gate', 'movingGate', 'rotatingBar', 'pinchGate'];
                type = types[Math.floor(Math.random() * types.length)];
                gapSize = Math.max(220, 250 - (this.score - 55) * 1.5);
            }

            const maxX = Math.max(minX + 50, WALL_RIGHT - gapSize - 60);
            const gapX = Math.random() * (maxX - minX) + minX;

            const obs = {
                id: Math.random(),
                y: y,
                type: type,
                passed: false,
                color: th.hazardColor,
                time: Math.random() * 10
            };

            if (type === 'gate') {
                obs.gapX = gapX;
                obs.gapSize = gapSize;
                obs.thickness = 32;
            } else if (type === 'movingGate') {
                obs.gapSize = gapSize + 20;
                obs.gapX = (WALL_LEFT + WALL_RIGHT) / 2 - obs.gapSize / 2;
                obs.thickness = 32;
                const baseSpd = this.score <= 25 ? 70 : (100 + Math.min((this.score - 25) * 2, 90));
                obs.speed = baseSpd * (Math.random() > 0.5 ? 1 : -1);
                obs.minX = WALL_LEFT + 40;
                obs.maxX = WALL_RIGHT - obs.gapSize - 40;
            } else if (type === 'rotatingBar') {
                obs.centerX = (WALL_LEFT + WALL_RIGHT) / 2 + (Math.random() * 160 - 80);
                obs.length = this.score <= 40 ? 360 : 420;
                obs.thickness = 28;
                const rotSpd = this.score <= 40 ? 0.8 : 1.4;
                obs.rotSpeed = rotSpd * (Math.random() > 0.5 ? 1 : -1);
                obs.angle = Math.random() * Math.PI;
            } else if (type === 'pinchGate') {
                obs.gapX = gapX;
                obs.gapSize = gapSize;
                obs.thickness = 36;
                obs.angle = (Math.random() * 0.3 - 0.15);
            }

            this.obstacles.push(obs);

            // ==========================================
            // SPAWN LINE OF COINS ALONG ZIGZAG TRAIL
            // ==========================================
            const gateCenter = type === 'rotatingBar'
                ? (obs.centerX < CANVAS_WIDTH / 2 ? WALL_RIGHT - 160 : WALL_LEFT + 160)
                : (obs.gapX + (obs.gapSize || 200) / 2);

            const approachX = gateCenter > CANVAS_WIDTH / 2 ? gateCenter - 220 : gateCenter + 220;
            this.spawnCoinTrail(approachX, y + 220, gateCenter, y, 5);

            const exitX = gateCenter > CANVAS_WIDTH / 2 ? gateCenter - 180 : gateCenter + 180;
            this.spawnCoinTrail(gateCenter, y - 20, exitX, y - 200, 4);

            // ==========================================
            // DIVERSE POWER-UP SPAWNER
            // ==========================================
            if (Math.random() < 0.42) {
                const puX = (Math.random() > 0.5) ? gateCenter : (CANVAS_WIDTH / 2 + (Math.random() * 240 - 120));
                let pool = ['magnet', 'shield', 'boost', 'multiplier', 'megaGem'];

                // If player is hurt, give a generous chance to find a healing Heart!
                if (this.player && this.player.lives < 3) {
                    pool.push('heart', 'heart');
                }

                const chosenType = pool[Math.floor(Math.random() * pool.length)];
                this.spawnPowerup(puX, y - 110, chosenType);
            }
        }

        takeDamage(source) {
            if (!this.player || !this.player.alive) return;

            // 1. If currently hyper boosted or invincible: completely immune!
            if (this.player.boostTimer > 0 || this.player.invincibleTimer > 0) {
                return;
            }

            // 2. If Force Shield is active: shield breaks without losing a heart!
            if (this.player.hasShield) {
                this.player.hasShield = false;
                this.player.invincibleTimer = 1.4;
                this.shake = 12;
                window.neonAudio.playBounce();
                this.createFloatingText('🛡️ SHIELD BROKE! SAVED!', this.player.x, this.player.y - 40, this.theme.primary, 36);
                this.createGemBurst(this.player.x, this.player.y);
                return;
            }

            // 3. Lose 1 Heart Life
            this.player.lives--;
            this.updateLivesHUD();
            this.shake = 16;
            this.player.invincibleTimer = 2.0; // 2 seconds of recovery blink
            window.neonAudio.playHurt();

            this.createFloatingText(`❤️ -1 LIFE! (${this.player.lives} LEFT)`, this.player.x, this.player.y - 50, '#ff0055', 38);
            this.createExplosion(this.player.x, this.player.y);

            // Push player gently toward center
            this.player.x += (CANVAS_WIDTH / 2 - this.player.x) * 0.35;

            // 4. Out of Lives -> Trigger Game Over
            if (this.player.lives <= 0) {
                this.triggerGameOver(source);
            }
        }

        update(dt) {
            dt = Math.min(dt, 0.05);

            // Update Background Stars
            this.bgStars.forEach(star => {
                star.y += star.speed * (this.state === STATE.PLAYING ? 250 : 60) * dt;
                if (star.y > CANVAS_HEIGHT * 2) {
                    star.y = -20;
                    star.x = Math.random() * CANVAS_WIDTH;
                }
            });

            if (this.state !== STATE.PLAYING) return;

            // Update Timer
            this.elapsedTime = performance.now() - this.playStartTime;
            this.renderTimer();

            // Reset coin combo streak if idle for > 1.4s
            this.coinComboTimer += dt;
            if (this.coinComboTimer > 1.4) {
                this.coinCombo = 0;
            }

            // Update Invincibility grace period
            if (this.player.invincibleTimer > 0) {
                this.player.invincibleTimer = Math.max(0, this.player.invincibleTimer - dt);
            }

            // ==========================================
            // UPDATE ACTIVE POWER-UPS TIMERS & HUD
            // ==========================================
            // Magnet
            if (this.player.magnetTimer > 0) {
                this.player.magnetTimer = Math.max(0, this.player.magnetTimer - dt);
                if (this.badgeMagnet) {
                    this.badgeMagnet.classList.remove('hidden');
                    this.timerMagnet.textContent = `${this.player.magnetTimer.toFixed(1)}s`;
                }
            } else if (this.badgeMagnet && !this.badgeMagnet.classList.contains('hidden')) {
                this.badgeMagnet.classList.add('hidden');
            }

            // 2X Multiplier
            if (this.player.multiplierTimer > 0) {
                this.player.multiplierTimer = Math.max(0, this.player.multiplierTimer - dt);
                if (this.badgeMult) {
                    this.badgeMult.classList.remove('hidden');
                    this.timerMult.textContent = `${this.player.multiplierTimer.toFixed(1)}s`;
                }
            } else if (this.badgeMult && !this.badgeMult.classList.contains('hidden')) {
                this.badgeMult.classList.add('hidden');
            }

            // Shield Badge
            if (this.player.hasShield) {
                if (this.badgeShield) this.badgeShield.classList.remove('hidden');
            } else if (this.badgeShield && !this.badgeShield.classList.contains('hidden')) {
                this.badgeShield.classList.add('hidden');
            }

            // Hyper Boost
            if (this.player.boostTimer > 0) {
                this.player.boostTimer = Math.max(0, this.player.boostTimer - dt);
                if (this.badgeBoost) this.badgeBoost.classList.remove('hidden');
                // Thruster particles during boost
                this.particles.push({
                    x: this.player.x + (Math.random() - 0.5) * 20,
                    y: this.player.y + 25,
                    vx: (Math.random() - 0.5) * 80,
                    vy: 350 + Math.random() * 200,
                    size: 8,
                    color: Math.random() > 0.5 ? '#ff007f' : '#00f3ff',
                    life: 0.6,
                    decay: 2.0
                });
            } else if (this.badgeBoost && !this.badgeBoost.classList.contains('hidden')) {
                this.badgeBoost.classList.add('hidden');
            }

            // Difficulty Speed Multiplier
            let diffMult = 1.0;
            if (this.difficulty === 'fast') diffMult = 1.18;
            if (this.difficulty === 'insane') diffMult = 1.4;

            // Speed progression
            let speedRamp = 0.95;
            if (this.score <= 15) {
                speedRamp = 0.95 + (this.score / 15) * 0.10;
            } else if (this.score <= 35) {
                speedRamp = 1.05 + ((this.score - 15) / 20) * 0.20;
            } else if (this.score <= 65) {
                speedRamp = 1.25 + ((this.score - 35) / 30) * 0.25;
            } else {
                speedRamp = 1.50 + Math.min((this.score - 65) * 0.01, 0.30);
            }

            // Turbo boost speed multiplier
            const boostMultiplier = this.player.boostTimer > 0 ? 2.2 : 1.0;

            const horizSpeed = this.player.baseSpeed * diffMult * speedRamp * (this.player.boostTimer > 0 ? 1.4 : 1.0);
            const vertSpeed = (this.player.baseSpeed * 0.92 * boostMultiplier + this.player.flapImpulse) * diffMult * speedRamp;

            // Decay flap impulse
            this.player.flapImpulse = Math.max(0, this.player.flapImpulse - 550 * dt);
            this.player.wingPulse = Math.max(0, this.player.wingPulse - 3.5 * dt);

            // Move Player
            this.player.x += this.player.dir * horizSpeed * dt;
            this.player.y -= vertSpeed * dt;

            // Smooth dynamic camera tracking
            const targetCamY = this.player.y - 1250;
            this.cameraY += (targetCamY - this.cameraY) * 9 * dt;

            // Player Trail
            this.player.trail.unshift({ x: this.player.x, y: this.player.y, alpha: 1.0 });
            if (this.player.trail.length > 20) {
                this.player.trail.pop();
            }
            this.player.trail.forEach(t => t.alpha -= 2.8 * dt);

            // Boundary collision (Side walls)
            if (this.player.x - this.player.radius <= WALL_LEFT) {
                if (this.score < 12 || (this.player.bounceShields && this.player.bounceShields > 0)) {
                    if (this.player.bounceShields > 0) this.player.bounceShields--;
                    this.player.x = WALL_LEFT + this.player.radius + 14;
                    this.player.dir = 1; // Bounce right
                    window.neonAudio.playBounce();
                    this.createFloatingText('⚡ SHIELD BOUNCE!', this.player.x + 40, this.player.y, this.theme.primary, 32);
                    this.createGemBurst(this.player.x, this.player.y);
                    this.shake = 8;
                } else {
                    this.player.x = WALL_LEFT + this.player.radius + 20;
                    this.takeDamage('WALL CRASH');
                }
            } else if (this.player.x + this.player.radius >= WALL_RIGHT) {
                if (this.score < 12 || (this.player.bounceShields && this.player.bounceShields > 0)) {
                    if (this.player.bounceShields > 0) this.player.bounceShields--;
                    this.player.x = WALL_RIGHT - this.player.radius - 14;
                    this.player.dir = -1; // Bounce left
                    window.neonAudio.playBounce();
                    this.createFloatingText('⚡ SHIELD BOUNCE!', this.player.x - 40, this.player.y, this.theme.primary, 32);
                    this.createGemBurst(this.player.x, this.player.y);
                    this.shake = 8;
                } else {
                    this.player.x = WALL_RIGHT - this.player.radius - 20;
                    this.takeDamage('WALL CRASH');
                }
            }

            // ==========================================
            // MAGNET SUCTION & COIN COLLECTION PHYSICS
            // ==========================================
            const magnetActive = this.player.magnetTimer > 0;
            const magnetRadius = 520;
            const scoreMultiplier = this.player.multiplierTimer > 0 ? 2 : 1;

            this.coins.forEach(coin => {
                coin.pulse += 6 * dt;

                if (!coin.collected) {
                    const dx = this.player.x - coin.x;
                    const dy = this.player.y - coin.y;
                    const dist = Math.hypot(dx, dy);

                    if (magnetActive && dist < magnetRadius) {
                        coin.isMagnetized = true;
                        const pullSpeed = 1000 + (magnetRadius - dist) * 2.5;
                        coin.x += (dx / dist) * pullSpeed * dt;
                        coin.y += (dy / dist) * pullSpeed * dt;

                        if (Math.random() < 0.3) {
                            this.particles.push({
                                x: coin.x,
                                y: coin.y,
                                vx: (Math.random() - 0.5) * 60,
                                vy: (Math.random() - 0.5) * 60,
                                size: 4,
                                color: this.theme.accent,
                                life: 0.5,
                                decay: 2.0
                            });
                        }
                    }

                    const hitDist = this.player.radius + coin.radius + (magnetActive ? 18 : 10);
                    if (dist < hitDist) {
                        coin.collected = true;
                        this.coinCombo++;
                        this.coinComboTimer = 0;

                        const pts = 1 * scoreMultiplier;
                        this.score += pts;
                        this.scoreEl.textContent = this.score;

                        window.neonAudio.playCoin(this.coinCombo);
                        this.createCoinBurst(coin.x, coin.y);

                        if (this.coinCombo === 5) {
                            this.createFloatingText('★ 5x COIN STREAK! ★', this.player.x, this.player.y - 45, this.theme.accent, 34);
                        } else if (this.coinCombo === 10) {
                            const bonus = 3 * scoreMultiplier;
                            this.score += bonus;
                            this.scoreEl.textContent = this.score;
                            this.createFloatingText(`🔥 10x COIN COMBO! +${bonus}`, this.player.x, this.player.y - 50, '#ff007f', 38);
                            window.neonAudio.playLevelUp();
                        }

                        if (this.score > this.bestScore) {
                            this.bestScore = this.score;
                            localStorage.setItem('fz_best', this.bestScore.toString());
                            this.updateBestScoreDisplay();
                        }

                        this.checkLevelMilestones();
                    }
                }
            });

            // ==========================================
            // POWER-UP COLLECTION LOGIC
            // ==========================================
            this.powerups.forEach(p => {
                p.pulse += 5 * dt;
                if (!p.collected) {
                    const dist = Math.hypot(this.player.x - p.x, this.player.y - p.y);
                    if (dist < this.player.radius + p.radius + 12) {
                        p.collected = true;

                        if (p.type === 'magnet') {
                            this.player.magnetTimer = 10.0;
                            window.neonAudio.playMagnet();
                            this.createFloatingText('🧲 MAGNET (10s)!', this.player.x, this.player.y - 60, this.theme.primary, 38, 2.0);
                            this.createGemBurst(p.x, p.y);
                        } else if (p.type === 'shield') {
                            this.player.hasShield = true;
                            window.neonAudio.playShieldPickup();
                            this.createFloatingText('🛡️ FORCE SHIELD EQUIPPED!', this.player.x, this.player.y - 60, this.theme.primary, 36, 2.0);
                            this.createGemBurst(p.x, p.y);
                        } else if (p.type === 'boost') {
                            this.player.boostTimer = 3.5;
                            window.neonAudio.playBoost();
                            this.createFloatingText('🚀 HYPER BOOST!', this.player.x, this.player.y - 60, '#d946ef', 42, 2.2);
                            this.shake = 10;
                            this.createExplosion(p.x, p.y);
                        } else if (p.type === 'multiplier') {
                            this.player.multiplierTimer = 8.0;
                            window.neonAudio.playMultiplier();
                            this.createFloatingText('🔥 2X POINTS ACTIVE!', this.player.x, this.player.y - 60, '#ff5500', 40, 2.2);
                            this.createGemBurst(p.x, p.y);
                        } else if (p.type === 'heart') {
                            if (this.player.lives < 3) {
                                this.player.lives++;
                                this.updateLivesHUD();
                            }
                            window.neonAudio.playHeal();
                            this.createFloatingText('❤️ +1 EXTRA LIFE!', this.player.x, this.player.y - 60, '#ff007f', 40, 2.0);
                            this.createGemBurst(p.x, p.y);
                        } else if (p.type === 'megaGem') {
                            const pts = 10 * scoreMultiplier;
                            this.score += pts;
                            this.scoreEl.textContent = this.score;
                            window.neonAudio.playLevelUp();
                            this.createFloatingText(`💎 MEGA GEM +${pts}!`, this.player.x, this.player.y - 60, '#38bdf8', 42, 2.2);
                            this.createExplosion(p.x, p.y);
                        }
                    }
                }
            });

            // Update Obstacles & Laser Collisions
            this.obstacles.forEach(obs => {
                obs.time += dt;

                if (obs.type === 'movingGate') {
                    obs.gapX += obs.speed * dt;
                    if (obs.gapX < obs.minX) {
                        obs.gapX = obs.minX;
                        obs.speed = -obs.speed;
                    } else if (obs.gapX > obs.maxX) {
                        obs.gapX = obs.maxX;
                        obs.speed = -obs.speed;
                    }
                } else if (obs.type === 'rotatingBar') {
                    obs.angle += obs.rotSpeed * dt;
                }

                // Check Gate Pass Score
                if (!obs.passed && this.player.y < obs.y) {
                    obs.passed = true;
                    const pts = 2 * scoreMultiplier;
                    this.score += pts;
                    this.combo += 1;
                    this.scoreEl.textContent = this.score;
                    window.neonAudio.playGatePass();

                    let isCloseCall = false;
                    if (obs.type === 'gate' || obs.type === 'movingGate' || obs.type === 'pinchGate') {
                        const distToLeftEdge = Math.abs(this.player.x - obs.gapX);
                        const distToRightEdge = Math.abs((obs.gapX + obs.gapSize) - this.player.x);
                        if (distToLeftEdge < 42 || distToRightEdge < 42) {
                            isCloseCall = true;
                        }
                    }

                    if (isCloseCall) {
                        const bonus = 2 * scoreMultiplier;
                        this.score += bonus;
                        this.scoreEl.textContent = this.score;
                        this.createFloatingText(`⚡ CLOSE CALL! +${bonus}`, this.player.x, this.player.y - 45, this.theme.accent, 34);
                    } else {
                        this.createFloatingText(`+${pts} GATE!`, this.player.x, this.player.y - 40, this.theme.primary, 34);
                    }

                    if (this.score > this.bestScore) {
                        this.bestScore = this.score;
                        localStorage.setItem('fz_best', this.bestScore.toString());
                        this.updateBestScoreDisplay();
                    }

                    this.checkLevelMilestones();
                }

                // Collision Check
                if (this.checkCollision(this.player, obs)) {
                    // If Hyper Boosted: Smashing through obstacle!
                    if (this.player.boostTimer > 0) {
                        this.createExplosion(this.player.x, obs.y);
                        window.neonAudio.playCrash();
                        obs.y = -99999; // destroy obstacle
                        this.score += 5;
                        this.scoreEl.textContent = this.score;
                        this.createFloatingText('💥 LASER SMASHED! +5', this.player.x, this.player.y - 50, '#ffe600', 36);
                    } else {
                        this.takeDamage('LASER IMPACT');
                    }
                }
            });

            // Spawn new obstacles forward as player climbs
            const highestObs = this.obstacles[this.obstacles.length - 1];
            if (highestObs && highestObs.y > this.player.y - 2600) {
                const spacing = this.score <= 15 ? 600 : (this.score <= 35 ? 520 : 450);
                this.spawnObstacle(highestObs.y - spacing);
            }

            // Cleanup old items behind camera
            this.obstacles = this.obstacles.filter(obs => obs.y < this.cameraY + CANVAS_HEIGHT + 300);
            this.coins = this.coins.filter(c => c.y < this.cameraY + CANVAS_HEIGHT + 300 && !c.collected);
            this.powerups = this.powerups.filter(p => p.y < this.cameraY + CANVAS_HEIGHT + 300 && !p.collected);

            // Update Particles
            this.particles.forEach(p => {
                p.x += p.vx * dt;
                p.y += p.vy * dt;
                p.life -= p.decay * dt;
            });
            this.particles = this.particles.filter(p => p.life > 0);

            // Update Floating Texts
            this.floatingTexts.forEach(ft => {
                ft.y += ft.vy * dt;
                ft.alpha -= ft.decay * dt;
            });
            this.floatingTexts = this.floatingTexts.filter(ft => ft.alpha > 0);

            // Shake decay
            if (this.shake > 0) {
                this.shake = Math.max(0, this.shake - 25 * dt);
            }
        }

        checkLevelMilestones() {
            const milestones = [
                { score: 10, label: '★ LEVEL 2: FLOW MODE! ★' },
                { score: 25, label: '⚡ LEVEL 3: SPEED RISING! ⚡' },
                { score: 50, label: '🔥 LEVEL 4: CYBER OVERDRIVE! 🔥' },
                { score: 80, label: '👑 LEVEL 5: LEGENDARY! 👑' }
            ];

            milestones.forEach(m => {
                if (this.score >= m.score && this.lastMilestone < m.score) {
                    this.lastMilestone = m.score;
                    window.neonAudio.playLevelUp();
                    this.createFloatingText(m.label, CANVAS_WIDTH / 2, this.player.y - 120, this.theme.accent, 44, 2.2);
                    this.createGemBurst(CANVAS_WIDTH / 2, this.player.y - 100);
                }
            });
        }

        checkCollision(p, obs) {
            if (p.invincibleTimer > 0 || p.boostTimer > 0) return false;

            const hitboxRatio = this.score <= 15 ? 0.65 : (this.score <= 35 ? 0.74 : 0.82);
            const pr = p.radius * hitboxRatio;

            if (obs.type === 'gate' || obs.type === 'movingGate' || obs.type === 'pinchGate') {
                const top = obs.y - obs.thickness / 2;
                const bottom = obs.y + obs.thickness / 2;

                if (p.y + pr > top && p.y - pr < bottom) {
                    const inGap = (p.x - pr > obs.gapX) && (p.x + pr < obs.gapX + obs.gapSize);
                    if (!inGap) {
                        return true;
                    }
                }
            } else if (obs.type === 'rotatingBar') {
                const cos = Math.cos(obs.angle);
                const sin = Math.sin(obs.angle);
                const halfL = obs.length / 2;

                const x1 = obs.centerX - cos * halfL;
                const y1 = obs.y - sin * halfL;
                const x2 = obs.centerX + cos * halfL;
                const y2 = obs.y + sin * halfL;

                const dist = this.distToSegment(p.x, p.y, x1, y1, x2, y2);
                if (dist < pr + obs.thickness / 2) {
                    return true;
                }
            }
            return false;
        }

        distToSegment(px, py, x1, y1, x2, y2) {
            const l2 = (x2 - x1) ** 2 + (y2 - y1) ** 2;
            if (l2 === 0) return Math.hypot(px - x1, py - y1);
            let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
            t = Math.max(0, Math.min(1, t));
            return Math.hypot(px - (x1 + t * (x2 - x1)), py - (y1 + t * (y2 - y1)));
        }

        triggerGameOver(reason) {
            if (!this.player.alive) return;
            this.player.alive = false;
            this.state = STATE.GAMEOVER;
            this.gameOverTime = Date.now();
            this.shake = 20;

            window.neonAudio.playCrash();
            window.neonAudio.stopBGM();

            this.createExplosion(this.player.x, this.player.y);

            const isNewBest = this.score > this.bestScore;
            if (isNewBest) {
                this.bestScore = this.score;
                localStorage.setItem('fz_best', this.bestScore.toString());
                this.updateBestScoreDisplay();
            }

            document.getElementById('go-score').textContent = this.score;
            document.getElementById('go-best').textContent = this.bestScore;
            document.getElementById('go-time').textContent = this.formatTime(this.elapsedTime);

            const badge = document.getElementById('go-new-best-badge');
            if (badge) {
                badge.style.display = isNewBest && this.score > 0 ? 'inline-block' : 'none';
            }

            setTimeout(() => {
                this.gameOverModal.classList.remove('hidden');
            }, 550);
        }

        createExplosion(x, y) {
            const count = this.glowQuality === 'low' ? 30 : 60;
            const th = this.theme;
            for (let i = 0; i < count; i++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = Math.random() * 600 + 80;
                this.particles.push({
                    x: x,
                    y: y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    size: Math.random() * 9 + 4,
                    color: Math.random() > 0.5 ? th.primary : th.secondary,
                    life: 1.0,
                    decay: Math.random() * 1.5 + 0.8
                });
            }
        }

        createGemBurst(x, y) {
            const count = this.glowQuality === 'low' ? 10 : 22;
            for (let i = 0; i < count; i++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = Math.random() * 320 + 70;
                this.particles.push({
                    x: x,
                    y: y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    size: Math.random() * 6 + 2,
                    color: this.theme.accent,
                    life: 1.0,
                    decay: Math.random() * 2.0 + 1.2
                });
            }
        }

        createCoinBurst(x, y) {
            const count = this.glowQuality === 'low' ? 6 : 12;
            for (let i = 0; i < count; i++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = Math.random() * 260 + 50;
                this.particles.push({
                    x: x,
                    y: y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    size: Math.random() * 5 + 2,
                    color: this.theme.accent,
                    life: 0.8,
                    decay: 2.2
                });
            }
        }

        createFloatingText(text, x, y, color, fontSize = 36, lifeDuration = 1.0) {
            this.floatingTexts.push({
                text: text,
                x: x,
                y: y,
                vy: -80,
                alpha: 1.0,
                color: color,
                fontSize: fontSize,
                decay: lifeDuration > 1.8 ? 0.75 : 1.2
            });
        }

        renderTimer() {
            this.timerEl.textContent = this.formatTime(this.elapsedTime);
        }

        formatTime(ms) {
            const totalSec = Math.floor(ms / 1000);
            const minutes = Math.floor(totalSec / 60);
            const seconds = totalSec % 60;
            const tenths = Math.floor((ms % 1000) / 100);

            const mStr = String(minutes).padStart(2, '0');
            const sStr = String(seconds).padStart(2, '0');
            return `${mStr}:${sStr}.${tenths}`;
        }

        setGlow(color, blur) {
            if (this.glowQuality === 'low') {
                this.ctx.shadowBlur = 0;
                return;
            }
            let mult = 1;
            if (this.glowQuality === 'med') mult = 0.5;
            if (this.glowQuality === 'ultra') mult = 1.4;

            this.ctx.shadowColor = color;
            this.ctx.shadowBlur = blur * mult;
        }

        draw() {
            const ctx = this.ctx;
            const th = this.theme;

            ctx.save();

            if (this.shake > 0) {
                const ox = (Math.random() - 0.5) * this.shake * 2;
                const oy = (Math.random() - 0.5) * this.shake * 2;
                ctx.translate(ox, oy);
            }

            // Background Gradient
            const bgGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
            bgGrad.addColorStop(0, th.bgGrad1);
            bgGrad.addColorStop(1, th.bgGrad2);
            ctx.fillStyle = bgGrad;
            ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

            // Background Neon Grid
            this.drawNeonGrid();

            // Background Stars
            this.bgStars.forEach(star => {
                ctx.fillStyle = `rgba(255, 255, 255, ${star.alpha * 0.7})`;
                ctx.fillRect(star.x, star.y % CANVAS_HEIGHT, star.size, star.size);
            });

            // Camera Transformation
            ctx.save();
            ctx.translate(0, -this.cameraY);

            // Side Boundary Walls
            this.drawSideWalls();

            // Obstacles
            this.obstacles.forEach(obs => this.drawObstacle(obs));

            // Power-ups
            this.powerups.forEach(p => this.drawPowerup(p));

            // Line of Coins
            this.coins.forEach(c => this.drawCoin(c));

            // Particles
            this.particles.forEach(p => {
                ctx.save();
                this.setGlow(p.color, 14);
                ctx.fillStyle = p.color;
                ctx.globalAlpha = Math.max(0, p.life);
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            });

            // Player & Trail
            if (this.player && this.player.alive) {
                this.drawPlayer();
            }

            // Floating Texts
            this.floatingTexts.forEach(ft => {
                ctx.save();
                this.setGlow(ft.color, 18);
                const size = ft.fontSize || 36;
                ctx.font = `bold ${size}px Orbitron, Rajdhani, sans-serif`;
                ctx.fillStyle = ft.color;
                ctx.globalAlpha = Math.max(0, ft.alpha);
                ctx.textAlign = 'center';
                ctx.fillText(ft.text, ft.x, ft.y);
                ctx.restore();
            });

            ctx.restore(); // Restore Camera
            ctx.restore(); // Restore Shake
        }

        drawNeonGrid() {
            const ctx = this.ctx;
            const th = this.theme;
            ctx.save();
            ctx.strokeStyle = th.gridColor;
            ctx.lineWidth = 1.5;

            const gridSize = 120;
            const offsetY = (this.cameraY * 0.4) % gridSize;

            for (let x = WALL_LEFT; x <= WALL_RIGHT; x += gridSize) {
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x, CANVAS_HEIGHT);
                ctx.stroke();
            }

            for (let y = -offsetY; y <= CANVAS_HEIGHT; y += gridSize) {
                ctx.beginPath();
                ctx.moveTo(WALL_LEFT, y);
                ctx.lineTo(WALL_RIGHT, y);
                ctx.stroke();
            }

            ctx.restore();
        }

        drawSideWalls() {
            const ctx = this.ctx;
            const th = this.theme;
            const topY = this.cameraY - 200;
            const botY = this.cameraY + CANVAS_HEIGHT + 200;

            const wallColor = (this.score < 12 || (this.player && this.player.bounceShields > 0))
                ? th.primary
                : th.secondary;

            ctx.save();
            this.setGlow(wallColor, 20);
            ctx.strokeStyle = wallColor;
            ctx.lineWidth = 8;
            ctx.beginPath();
            ctx.moveTo(WALL_LEFT, topY);
            ctx.lineTo(WALL_LEFT, botY);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(WALL_RIGHT, topY);
            ctx.lineTo(WALL_RIGHT, botY);
            ctx.stroke();
            ctx.restore();

            ctx.fillStyle = (this.score < 12 || (this.player && this.player.bounceShields > 0))
                ? 'rgba(0, 243, 255, 0.08)'
                : 'rgba(255, 0, 85, 0.12)';
            ctx.fillRect(0, topY, WALL_LEFT, botY - topY);
            ctx.fillRect(WALL_RIGHT, topY, CANVAS_WIDTH - WALL_RIGHT, botY - topY);
        }

        drawObstacle(obs) {
            const ctx = this.ctx;
            ctx.save();

            if (obs.type === 'gate' || obs.type === 'movingGate' || obs.type === 'pinchGate') {
                const color = obs.passed ? 'rgba(0, 243, 255, 0.35)' : obs.color;
                this.setGlow(color, 24);

                ctx.strokeStyle = color;
                ctx.lineWidth = obs.thickness;
                ctx.lineCap = 'round';

                ctx.beginPath();
                ctx.moveTo(WALL_LEFT, obs.y);
                ctx.lineTo(obs.gapX, obs.y);
                ctx.stroke();

                ctx.beginPath();
                ctx.moveTo(obs.gapX + obs.gapSize, obs.y);
                ctx.lineTo(WALL_RIGHT, obs.y);
                ctx.stroke();

                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 5;
                ctx.beginPath();
                ctx.moveTo(WALL_LEFT, obs.y);
                ctx.lineTo(obs.gapX, obs.y);
                ctx.moveTo(obs.gapX + obs.gapSize, obs.y);
                ctx.lineTo(WALL_RIGHT, obs.y);
                ctx.stroke();

                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.arc(obs.gapX, obs.y, obs.thickness / 2 + 3, 0, Math.PI * 2);
                ctx.arc(obs.gapX + obs.gapSize, obs.y, obs.thickness / 2 + 3, 0, Math.PI * 2);
                ctx.fill();

            } else if (obs.type === 'rotatingBar') {
                this.setGlow(obs.color, 24);
                ctx.translate(obs.centerX, obs.y);
                ctx.rotate(obs.angle);

                ctx.strokeStyle = obs.color;
                ctx.lineWidth = obs.thickness;
                ctx.lineCap = 'round';
                ctx.beginPath();
                ctx.moveTo(-obs.length / 2, 0);
                ctx.lineTo(obs.length / 2, 0);
                ctx.stroke();

                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 6;
                ctx.beginPath();
                ctx.moveTo(-obs.length / 2, 0);
                ctx.lineTo(obs.length / 2, 0);
                ctx.stroke();

                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(0, 0, obs.thickness / 2 + 6, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.restore();
        }

        drawCoin(coin) {
            if (coin.collected) return;
            const ctx = this.ctx;
            const th = this.theme;

            ctx.save();
            ctx.translate(coin.x, coin.y);

            const spinScale = Math.cos(coin.pulse);
            ctx.scale(spinScale, 1.0);

            this.setGlow(th.accent, coin.isMagnetized ? 24 : 14);

            ctx.fillStyle = th.accent;
            ctx.beginPath();
            ctx.arc(0, 0, coin.radius, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(0, 0, coin.radius * 0.45, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        }

        drawPowerup(p) {
            if (p.collected) return;
            const ctx = this.ctx;
            const th = this.theme;

            ctx.save();
            ctx.translate(p.x, p.y);

            const scale = 1.0 + Math.sin(p.pulse) * 0.15;
            ctx.scale(scale, scale);

            let mainColor = th.primary;
            let iconText = '🧲';

            if (p.type === 'shield') {
                mainColor = '#00f3ff';
                iconText = '🛡️';
            } else if (p.type === 'boost') {
                mainColor = '#d946ef';
                iconText = '🚀';
            } else if (p.type === 'multiplier') {
                mainColor = '#ff5500';
                iconText = '🔥';
            } else if (p.type === 'heart') {
                mainColor = '#ff007f';
                iconText = '❤️';
            } else if (p.type === 'megaGem') {
                mainColor = '#ffe600';
                iconText = '💎';
            }

            this.setGlow(mainColor, 26);

            // Pulsing energy rings
            ctx.strokeStyle = mainColor;
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.arc(0, 0, p.radius * (1.2 + Math.sin(p.pulse) * 0.2), 0, Math.PI * 2);
            ctx.stroke();

            // Orb Background
            ctx.fillStyle = 'rgba(8, 16, 40, 0.9)';
            ctx.beginPath();
            ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = mainColor;
            ctx.lineWidth = 3;
            ctx.stroke();

            // Emoji icon
            ctx.font = '26px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(iconText, 0, 2);

            ctx.restore();
        }

        drawPlayer() {
            const ctx = this.ctx;
            const p = this.player;
            const th = this.theme;

            // Invincibility flashing (flicker transparency)
            if (p.invincibleTimer > 0 && Math.floor(Date.now() / 80) % 2 === 0) {
                return;
            }

            if (p.trail.length > 1) {
                ctx.save();
                for (let i = 0; i < p.trail.length - 1; i++) {
                    const pt1 = p.trail[i];
                    const pt2 = p.trail[i + 1];
                    const alpha = pt1.alpha * 0.8;
                    const width = (1 - i / p.trail.length) * 16 + 4;

                    const tColor = p.boostTimer > 0 ? '#ff007f' : th.trailColor;
                    this.setGlow(p.boostTimer > 0 ? '#ff007f' : th.primary, 14);
                    ctx.strokeStyle = tColor;
                    ctx.globalAlpha = Math.max(0, alpha);
                    ctx.lineWidth = p.boostTimer > 0 ? width * 1.5 : width;
                    ctx.lineCap = 'round';
                    ctx.beginPath();
                    ctx.moveTo(pt1.x, pt1.y);
                    ctx.lineTo(pt2.x, pt2.y);
                    ctx.stroke();
                }
                ctx.restore();
            }

            ctx.save();
            ctx.translate(p.x, p.y);

            // ==========================================
            // FORCE SHIELD SPHERICAL BUBBLE
            // ==========================================
            if (p.hasShield) {
                ctx.save();
                this.setGlow('#00f3ff', 28);
                ctx.fillStyle = 'rgba(0, 243, 255, 0.18)';
                ctx.strokeStyle = '#00f3ff';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(0, 0, p.radius * 2.1, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();

                // Shield Hexagon Ring
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.arc(0, 0, p.radius * 1.7, 0, Math.PI * 2);
                ctx.stroke();
                ctx.restore();
            }

            // ==========================================
            // MAGNET ACTIVE ELECTRIC AURA
            // ==========================================
            if (p.magnetTimer > 0) {
                ctx.save();
                this.setGlow(th.primary, 32);

                ctx.strokeStyle = 'rgba(0, 243, 255, 0.75)';
                ctx.lineWidth = 3;
                ctx.setLineDash([8, 6]);
                ctx.beginPath();
                ctx.arc(0, 0, p.radius * 2.5, 0, Math.PI * 2);
                ctx.stroke();

                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 2;
                ctx.beginPath();
                for (let a = 0; a < 4; a++) {
                    const ang = (Date.now() / 200) + a * (Math.PI / 2);
                    const r1 = p.radius * 1.5;
                    const r2 = p.radius * 2.4;
                    ctx.moveTo(Math.cos(ang) * r1, Math.sin(ang) * r1);
                    ctx.lineTo(Math.cos(ang + 0.3) * r2, Math.sin(ang + 0.3) * r2);
                }
                ctx.stroke();
                ctx.restore();
            }

            const targetRot = p.dir > 0 ? Math.PI / 4 : -Math.PI / 4;
            ctx.rotate(targetRot);

            const wingSpread = 1.0 + p.wingPulse * 0.4;
            this.setGlow(p.boostTimer > 0 ? '#ff007f' : th.primary, 28);

            // Cyber Neon Arrow Body
            ctx.fillStyle = p.boostTimer > 0 ? '#ffe600' : th.playerColor;
            ctx.beginPath();
            ctx.moveTo(0, -p.radius * 1.5);
            ctx.lineTo(p.radius * wingSpread, p.radius * 1.2);
            ctx.lineTo(0, p.radius * 0.5);
            ctx.lineTo(-p.radius * wingSpread, p.radius * 1.2);
            ctx.closePath();
            ctx.fill();

            // Inner Core
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.moveTo(0, -p.radius * 0.8);
            ctx.lineTo(p.radius * 0.4, p.radius * 0.6);
            ctx.lineTo(0, p.radius * 0.2);
            ctx.lineTo(-p.radius * 0.4, p.radius * 0.6);
            ctx.closePath();
            ctx.fill();

            // Thruster Flame
            ctx.fillStyle = p.boostTimer > 0 ? '#00f3ff' : th.secondary;
            this.setGlow(p.boostTimer > 0 ? '#00f3ff' : th.secondary, 20);
            ctx.beginPath();
            ctx.moveTo(-8, p.radius * 0.6);
            const flameLen = p.boostTimer > 0 ? 3.0 : 1.6;
            ctx.lineTo(0, p.radius * flameLen + Math.random() * 14);
            ctx.lineTo(8, p.radius * 0.6);
            ctx.closePath();
            ctx.fill();

            // Energy Shield Aura in early game
            if (this.score < 12 || (p.bounceShields && p.bounceShields > 0)) {
                ctx.save();
                this.setGlow(th.primary, 18);
                ctx.strokeStyle = 'rgba(0, 243, 255, 0.45)';
                ctx.lineWidth = 2.5;
                ctx.beginPath();
                ctx.arc(0, 0, p.radius * 1.8, 0, Math.PI * 2);
                ctx.stroke();
                ctx.restore();
            }

            ctx.restore();
        }

        loop(timestamp) {
            if (!this.lastFrameTime) this.lastFrameTime = timestamp;
            const dt = (timestamp - this.lastFrameTime) / 1000;
            this.lastFrameTime = timestamp;

            this.update(dt);
            this.draw();

            requestAnimationFrame(this.loop.bind(this));
        }
    }

    // Initialize Game on Load
    window.addEventListener('DOMContentLoaded', () => {
        window.game = new Game();
    });
})();
