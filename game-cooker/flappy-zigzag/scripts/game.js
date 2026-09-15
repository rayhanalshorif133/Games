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

    // Ensure send_score_api.js is loaded if not already present
    if (typeof window !== 'undefined' && !window.sendScore) {
        const sendScoreScr = document.createElement('script');
        sendScoreScr.src = 'send_score_api.js';
        document.head.appendChild(sendScoreScr);
    }

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

    // Cosmetic Particle Trails Catalog
    const TRAILS = [
        { id: 'classic', name: 'Classic Neon', price: 0, desc: 'Original dual-tone cyan & magenta laser ribbon', icon: '⚡', color: '#00f3ff' },
        { id: 'pixel', name: 'Pixel Dust', price: 100, desc: 'Retro 8-bit square floating neon voxels', icon: '🟩', color: '#00ff66' },
        { id: 'rainbow', name: 'Rainbow Strobe', price: 250, desc: 'Hypnotic shifting chromatic spectrum trail', icon: '🌈', color: '#ff007f' },
        { id: 'sparks', name: 'Ion Sparks', price: 500, desc: 'High-energy crackling electrical spark arcs', icon: '✨', color: '#ffe600' },
        { id: 'void', name: 'Void Nebula', price: 750, desc: 'Luminous cosmic stardust clouds & astral smoke', icon: '🌌', color: '#c084fc' },
        { id: 'matrix', name: 'Cyber Matrix', price: 1000, desc: 'Cascading digital matrix glyphs & binary code', icon: '📟', color: '#00ff88' }
    ];

    // Dynamic Synthwave Biomes Progression
    const BIOMES = [
        { name: 'NEO TOKYO', minScore: 0, primary: '#00f3ff', secondary: '#ff0055', accent: '#ffe600', hazard: '#ff0055', bg1: '#050512', bg2: '#0b0b24', grid: 'rgba(0, 243, 255, 0.12)' },
        { name: 'SUNSET SYNTHWAVE', minScore: 20, primary: '#ff007f', secondary: '#ff7700', accent: '#ffe600', hazard: '#ff007f', bg1: '#120510', bg2: '#240b1a', grid: 'rgba(255, 0, 127, 0.14)' },
        { name: 'ACID MATRIX', minScore: 40, primary: '#00ff66', secondary: '#00f3ff', accent: '#ffe600', hazard: '#ff0055', bg1: '#021207', bg2: '#062410', grid: 'rgba(0, 255, 102, 0.14)' },
        { name: 'SOLAR FLARE', minScore: 70, primary: '#ffaa00', secondary: '#dc2626', accent: '#00f3ff', hazard: '#ff3300', bg1: '#140802', bg2: '#260d05', grid: 'rgba(255, 170, 0, 0.14)' },
        { name: 'DEEP VOID', minScore: 100, primary: '#c084fc', secondary: '#6366f1', accent: '#00f3ff', hazard: '#f43f5e', bg1: '#090317', bg2: '#13082b', grid: 'rgba(192, 132, 252, 0.16)' }
    ];

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

            // High Score & Coins Economy
            this.bestScore = parseInt(localStorage.getItem('fz_best') || '0', 10);
            this.totalCoins = parseInt(localStorage.getItem('fz_coins') || '0', 10);
            this.sessionCoins = 0;
            this.unlockedTrails = JSON.parse(localStorage.getItem('fz_unlocked_trails') || '["classic"]');
            this.equippedTrail = localStorage.getItem('fz_equipped_trail') || 'classic';

            // Perfect Drift Combo System
            this.driftMultiplier = 1.0;
            this.driftStreak = 0;
            this.driftTimer = 0;
            this.maxDriftCombo = 1.0;

            // Inversion / Gravity Flip
            this.isInverted = false;

            // Dynamic Synthwave Biomes
            this.currentBiomeIndex = 0;
            this.activeBiome = BIOMES[0];
            this.biomePrimary = this.activeBiome.primary;
            this.biomeSecondary = this.activeBiome.secondary;
            this.biomeHazard = this.activeBiome.hazard;
            this.biomeBg1 = this.activeBiome.bg1;
            this.biomeBg2 = this.activeBiome.bg2;

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
            this.scoreSent = false;
            this.hitFreezeTimer = 0;
            this.timeScale = 1.0;
            this.damageFlash = 0;
            this.shockwaves = [];

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
            this.hudCoins = document.getElementById('hud-coins');

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
            this.badgeChrono = document.getElementById('hud-chrono-badge');
            this.timerChrono = document.getElementById('hud-chrono-timer');
            this.badgeGhost = document.getElementById('hud-ghost-badge');
            this.timerGhost = document.getElementById('hud-ghost-timer');
            this.badgeMicro = document.getElementById('hud-micro-badge');
            this.timerMicro = document.getElementById('hud-micro-timer');
            this.badgeDrift = document.getElementById('hud-drift-badge');
            this.multDrift = document.getElementById('hud-drift-mult');

            // Modals
            this.startModal = document.getElementById('start-overlay');
            this.settingsModal = document.getElementById('settings-modal');
            this.pauseModal = document.getElementById('pause-modal');
            this.gameOverModal = document.getElementById('gameover-modal');
            this.storeModal = document.getElementById('store-modal');
            this.storeItemsContainer = document.getElementById('store-items-container');
            this.storeWalletCoins = document.getElementById('store-wallet-coins');

            this.initBackgroundStars();
            this.initPlayer();
            this.setupInputs();
            this.bindUI();
            this.initStore();
            this.updateBestScoreDisplay();
            this.applySettings();

            // Start Animation Loop
            requestAnimationFrame(this.loop.bind(this));
        }

        get theme() {
            const base = THEMES[this.themeKey] || THEMES.cyberpunk;
            return {
                ...base,
                primary: this.biomePrimary || base.primary,
                secondary: this.biomeSecondary || base.secondary,
                hazardColor: this.biomeHazard || base.hazardColor,
                bgGrad1: this.biomeBg1 || base.bgGrad1,
                bgGrad2: this.biomeBg2 || base.bgGrad2
            };
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
                boostTimer: 0,
                chronoTimer: 0,
                ghostTimer: 0,
                microTimer: 0
            };
            this.cameraY = this.player.y - 1300;
            this.lastMilestone = 0;
            this.coinCombo = 0;
            this.coinComboTimer = 0;
            this.updateLivesHUD();
        }

        updateLivesHUD(lostIndex = -1) {
            if (!this.player || !this.lifeHearts[0]) return;

            const livesContainer = document.getElementById('hud-lives');
            if (livesContainer && lostIndex >= 0) {
                livesContainer.classList.remove('damage-shake');
                void livesContainer.offsetWidth; // Trigger reflow for animation restart
                livesContainer.classList.add('damage-shake');
            }

            for (let i = 0; i < 3; i++) {
                const heart = this.lifeHearts[i];
                if (!heart) continue;
                if (i < this.player.lives) {
                    heart.classList.remove('lost', 'just-lost');
                } else {
                    if (i === lostIndex) {
                        heart.classList.add('just-lost');
                    }
                    heart.classList.add('lost');
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
                    if (Date.now() - this.gameOverTime > 1500) {
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

            // Store Buttons
            const btnOpenShop = document.getElementById('btn-open-shop');
            if (btnOpenShop) {
                btnOpenShop.addEventListener('click', (e) => {
                    e.stopPropagation();
                    window.neonAudio.playClick();
                    this.openStore();
                });
            }

            const btnShopGo = document.getElementById('btn-shop-go');
            if (btnShopGo) {
                btnShopGo.addEventListener('click', (e) => {
                    e.stopPropagation();
                    window.neonAudio.playClick();
                    this.openStore();
                });
            }

            const btnCloseStore = document.getElementById('btn-close-store');
            if (btnCloseStore) {
                btnCloseStore.addEventListener('click', () => {
                    window.neonAudio.playClick();
                    this.closeStore();
                });
            }

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

        initStore() {
            if (!this.storeItemsContainer) return;
            if (this.storeWalletCoins) {
                this.storeWalletCoins.textContent = `💰 ${this.totalCoins}`;
            }

            this.storeItemsContainer.innerHTML = '';
            TRAILS.forEach(trail => {
                const isUnlocked = this.unlockedTrails.includes(trail.id);
                const isEquipped = this.equippedTrail === trail.id;

                const card = document.createElement('div');
                card.className = `store-card ${isEquipped ? 'equipped' : ''}`;

                let btnHtml;
                if (isEquipped) {
                    btnHtml = `<button class="store-card-btn equipped-btn" disabled>EQUIPPED</button>`;
                } else if (isUnlocked) {
                    btnHtml = `<button class="store-card-btn btn-equip" data-id="${trail.id}">EQUIP</button>`;
                } else {
                    const canAfford = this.totalCoins >= trail.price;
                    btnHtml = `<button class="store-card-btn btn-buy ${canAfford ? '' : 'disabled'}" data-id="${trail.id}" ${canAfford ? '' : 'disabled'}>BUY (${trail.price} 💰)</button>`;
                }

                card.innerHTML = `
                    <div class="store-card-preview" style="border: 1.5px solid ${trail.color}; color: ${trail.color}; text-shadow: 0 0 12px ${trail.color}">
                        <span>${trail.icon}</span>
                    </div>
                    <div class="store-card-title">${trail.name}</div>
                    <div class="store-card-desc">${trail.desc}</div>
                    ${btnHtml}
                `;

                this.storeItemsContainer.appendChild(card);
            });

            // Bind equip buttons
            this.storeItemsContainer.querySelectorAll('.btn-equip').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const id = e.target.getAttribute('data-id');
                    this.equippedTrail = id;
                    localStorage.setItem('fz_equipped_trail', id);
                    window.neonAudio.playClick();
                    this.initStore();
                });
            });

            // Bind buy buttons
            this.storeItemsContainer.querySelectorAll('.btn-buy').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const id = e.target.getAttribute('data-id');
                    const item = TRAILS.find(t => t.id === id);
                    if (item && this.totalCoins >= item.price) {
                        this.totalCoins -= item.price;
                        localStorage.setItem('fz_coins', this.totalCoins.toString());
                        this.unlockedTrails.push(id);
                        localStorage.setItem('fz_unlocked_trails', JSON.stringify(this.unlockedTrails));
                        this.equippedTrail = id;
                        localStorage.setItem('fz_equipped_trail', id);
                        window.neonAudio.playLevelUp();
                        this.initStore();
                    }
                });
            });
        }

        openStore() {
            if (this.state === STATE.PLAYING) {
                this.state = STATE.PAUSED;
                this.settingsWasPlaying = true;
            }
            this.initStore();
            if (this.storeModal) this.storeModal.classList.remove('hidden');
        }

        closeStore() {
            if (this.storeModal) this.storeModal.classList.add('hidden');
            if (this.settingsWasPlaying && this.pauseModal.classList.contains('hidden')) {
                this.settingsWasPlaying = false;
                this.resumeGame();
            }
        }

        updateBiomes(dt) {
            let targetBiomeIndex = 0;
            for (let i = BIOMES.length - 1; i >= 0; i--) {
                if (this.score >= BIOMES[i].minScore) {
                    targetBiomeIndex = i;
                    break;
                }
            }

            if (targetBiomeIndex !== this.currentBiomeIndex) {
                this.currentBiomeIndex = targetBiomeIndex;
                this.activeBiome = BIOMES[targetBiomeIndex];
                window.neonAudio.playLevelUp();
                this.createFloatingText(`🌌 BIOME: ${this.activeBiome.name} 🌌`, CANVAS_WIDTH / 2, this.player.y - 130, this.activeBiome.primary, 44, 2.8);
                this.createGemBurst(CANVAS_WIDTH / 2, this.player.y - 110);
            }

            // Smoothly Lerp theme colors
            const lerpSpeed = Math.min(1.0, 2.0 * dt);
            this.biomePrimary = this.lerpColor(this.biomePrimary, this.activeBiome.primary, lerpSpeed);
            this.biomeSecondary = this.lerpColor(this.biomeSecondary, this.activeBiome.secondary, lerpSpeed);
            this.biomeHazard = this.lerpColor(this.biomeHazard, this.activeBiome.hazard, lerpSpeed);
            this.biomeBg1 = this.lerpColor(this.biomeBg1, this.activeBiome.bg1, lerpSpeed);
            this.biomeBg2 = this.lerpColor(this.biomeBg2, this.activeBiome.bg2, lerpSpeed);

            document.documentElement.style.setProperty('--neon-primary', this.biomePrimary);
            document.documentElement.style.setProperty('--neon-secondary', this.biomeSecondary);
        }

        lerpColor(c1, c2, t) {
            if (!c1 || !c2) return c2;
            const rgb1 = this.hexToRgb(c1);
            const rgb2 = this.hexToRgb(c2);
            if (!rgb1 || !rgb2) return c2;
            const r = Math.round(rgb1.r + (rgb2.r - rgb1.r) * t);
            const g = Math.round(rgb1.g + (rgb2.g - rgb1.g) * t);
            const b = Math.round(rgb1.b + (rgb2.b - rgb1.b) * t);
            return `rgb(${r}, ${g}, ${b})`;
        }

        hexToRgb(hex) {
            if (!hex) return { r: 0, g: 243, b: 255 };
            if (hex.startsWith('rgb')) {
                const parts = hex.match(/\d+/g);
                if (parts && parts.length >= 3) return { r: +parts[0], g: +parts[1], b: +parts[2] };
            }
            let c = hex.replace('#', '');
            if (c.length === 3) c = c.split('').map(x => x + x).join('');
            const num = parseInt(c, 16);
            if (isNaN(num)) return { r: 0, g: 243, b: 255 };
            return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
        }

        registerDrift(type = 'DRIFT') {
            if (!this.player || !this.player.alive) return;
            this.driftStreak++;
            this.driftMultiplier = Math.min(5.0, 1.0 + this.driftStreak * 0.5);
            if (this.driftMultiplier > this.maxDriftCombo) {
                this.maxDriftCombo = this.driftMultiplier;
            }
            this.driftTimer = 3.5;

            const bonusPts = Math.round(2 * this.driftMultiplier);
            this.score += bonusPts;
            this.scoreEl.textContent = this.score;

            window.neonAudio.playDriftBonus(this.driftMultiplier);
            this.updateDriftHUD();

            const text = `🔥 ${type}! x${this.driftMultiplier.toFixed(1)} (+${bonusPts})`;
            this.createFloatingText(text, this.player.x, this.player.y - 65, '#ff5500', 36, 1.8);
            this.createGemBurst(this.player.x, this.player.y);
        }

        updateDriftHUD() {
            if (!this.badgeDrift) return;
            if (this.driftMultiplier > 1.0) {
                this.badgeDrift.classList.remove('hidden');
                if (this.multDrift) this.multDrift.textContent = `${this.driftMultiplier.toFixed(1)}x`;
            } else {
                this.badgeDrift.classList.add('hidden');
            }
        }

        triggerNeonNova() {
            window.neonAudio.playNeonNova();
            this.createShockwave(this.player.x, this.player.y, '#ffffff', 1400);
            this.damageFlash = 0.85;
            this.shake = 26;

            let clearedCount = 0;
            this.obstacles.forEach(obs => {
                if (obs.y > this.cameraY - 200 && obs.y < this.cameraY + CANVAS_HEIGHT + 200) {
                    obs.y = -99999;
                    clearedCount++;
                    this.createExplosion(CANVAS_WIDTH / 2, obs.y, 35);
                    for (let c = 0; c < 4; c++) {
                        this.coins.push({
                            x: WALL_LEFT + 80 + Math.random() * (WALL_RIGHT - WALL_LEFT - 160),
                            y: obs.y + (Math.random() * 80 - 40),
                            radius: 16,
                            pulse: Math.random() * Math.PI,
                            collected: false,
                            isMagnetized: false
                        });
                    }
                }
            });

            this.createFloatingText('💥 NEON NOVA! SCREEN PURGED! 💥', CANVAS_WIDTH / 2, this.player.y - 90, '#ffe600', 44, 2.8);
            const bonusPts = clearedCount * 6;
            this.score += bonusPts;
            this.scoreEl.textContent = this.score;
        }

        startGame() {
            this.initPlayer();
            this.obstacles = [];
            this.coins = [];
            this.powerups = [];
            this.particles = [];
            this.floatingTexts = [];
            this.score = 0;
            this.sessionCoins = 0;
            if (this.hudCoins) this.hudCoins.textContent = '0';
            this.driftMultiplier = 1.0;
            this.driftStreak = 0;
            this.driftTimer = 0;
            this.maxDriftCombo = 1.0;
            this.isInverted = false;
            this.currentBiomeIndex = 0;
            this.activeBiome = BIOMES[0];
            this.biomePrimary = this.activeBiome.primary;
            this.biomeSecondary = this.activeBiome.secondary;
            this.biomeHazard = this.activeBiome.hazard;
            this.biomeBg1 = this.activeBiome.bg1;
            this.biomeBg2 = this.activeBiome.bg2;
            this.scoreSent = false;
            this.hitFreezeTimer = 0;
            this.timeScale = 1.0;
            this.damageFlash = 0;
            this.shockwaves = [];
            const livesContainer = document.getElementById('hud-lives');
            if (livesContainer) livesContainer.classList.remove('damage-shake');
            this.combo = 0;
            this.coinCombo = 0;
            this.coinComboTimer = 0;
            this.scoreEl.textContent = '0';
            this.elapsedTime = 0;
            this.playStartTime = performance.now();
            this.timerEl.textContent = '00:00.0';

            this.hideAllPowerupBadges();

            // ==========================================
            // WARMUP RUNWAY: Give player time to get into the flow!
            // First obstacle starts far ahead at y = 150 (over 1400px above player start at 1600)
            // ==========================================
            this.spawnPowerup(CANVAS_WIDTH / 2 + 160, 1300, 'magnet');
            this.spawnCoinTrail(CANVAS_WIDTH / 2, 1520, CANVAS_WIDTH / 2 + 180, 1300, 6);

            this.spawnPowerup(CANVAS_WIDTH / 2 - 160, 960, 'shield');
            this.spawnCoinTrail(CANVAS_WIDTH / 2 + 180, 1260, CANVAS_WIDTH / 2 - 180, 960, 7);

            this.spawnPowerup(CANVAS_WIDTH / 2, 620, 'multiplier');
            this.spawnCoinTrail(CANVAS_WIDTH / 2 - 180, 920, CANVAS_WIDTH / 2, 620, 6);
            this.spawnCoinTrail(CANVAS_WIDTH / 2, 580, CANVAS_WIDTH / 2 + 140, 320, 5);

            // Generate initial batch of obstacles with generous early spacing (750px early on)
            let currentY = 150;
            for (let i = 0; i < 7; i++) {
                this.spawnObstacle(currentY);
                const spacing = i < 2 ? 750 : (i < 4 ? 680 : 600);
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

            this.createFloatingText('⚡ READY... 3 LIVES! ❤️❤️❤️ ⚡', CANVAS_WIDTH / 2, 1420, this.theme.primary, 42, 2.6);
            this.createFloatingText('🧲 GRAB MAGNET & CRUISE! 🧲', CANVAS_WIDTH / 2, 1150, this.theme.accent, 36, 2.5);
        }

        hideAllPowerupBadges() {
            if (this.badgeMagnet) this.badgeMagnet.classList.add('hidden');
            if (this.badgeMult) this.badgeMult.classList.add('hidden');
            if (this.badgeShield) this.badgeShield.classList.add('hidden');
            if (this.badgeBoost) this.badgeBoost.classList.add('hidden');
            if (this.badgeChrono) this.badgeChrono.classList.add('hidden');
            if (this.badgeGhost) this.badgeGhost.classList.add('hidden');
            if (this.badgeMicro) this.badgeMicro.classList.add('hidden');
            if (this.badgeDrift) this.badgeDrift.classList.add('hidden');
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
            this.sessionCoins = 0;
            if (this.hudCoins) this.hudCoins.textContent = '0';
            this.driftMultiplier = 1.0;
            this.driftStreak = 0;
            this.driftTimer = 0;
            this.maxDriftCombo = 1.0;
            this.isInverted = false;
            this.currentBiomeIndex = 0;
            this.activeBiome = BIOMES[0];
            this.scoreSent = false;
            this.hitFreezeTimer = 0;
            this.timeScale = 1.0;
            this.damageFlash = 0;
            this.shockwaves = [];
            const livesContainer = document.getElementById('hud-lives');
            if (livesContainer) livesContainer.classList.remove('damage-shake');
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

            // Inversion / Gravity Flip check
            const dirMultiplier = this.isInverted ? -1 : 1;

            // Toggle direction: 1 (right-up) <-> -1 (left-up)
            this.player.dir = -(this.player.dir * dirMultiplier);
            this.player.flapImpulse = 180;
            this.player.wingPulse = 1.0;

            // Check Perfect Wall Apex Turn:
            const distLeft = Math.abs(this.player.x - WALL_LEFT);
            const distRight = Math.abs(WALL_RIGHT - this.player.x);
            if (distLeft < 60 || distRight < 60) {
                this.registerDrift('WALL APEX');
            }

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
            let gapSize = 490;
            let minX = WALL_LEFT + 60;

            // ==========================================
            // PROGRESSIVE DIVERSITY CURVE:
            // Varied, non-linear obstacles & pacing
            // ==========================================
            let pool;
            if (this.score <= 5) {
                // Early game: wide friendly laser gates and center plasma mines
                pool = ['gate', 'gate', 'plasmaMine_center'];
                gapSize = 490;
            } else if (this.score <= 15) {
                // Introduce chevron diagonal gates and dual flanking mines
                pool = ['gate', 'chevronGate', 'plasmaMine_center', 'plasmaMine_pair', 'gate'];
                gapSize = 440;
            } else if (this.score <= 32) {
                // Introduce slow moving gates, cyber crosses, and patrolling mines
                pool = ['gate', 'chevronGate', 'plasmaMine_pair', 'plasmaMine_patrol', 'cyberCross', 'movingGate'];
                gapSize = 390 - (this.score - 15) * 3;
            } else if (this.score <= 55) {
                // Introduce rotating bars and pulsing aperture rings
                pool = ['chevronGate', 'plasmaMine_patrol', 'cyberCross', 'pulsingRing', 'movingGate', 'rotatingBar'];
                gapSize = 330 - (this.score - 32) * 2.5;
            } else {
                // High adrenaline overdrive: all kinetic archetypes!
                pool = ['cyberCross', 'pulsingRing', 'chevronGate', 'plasmaMine_patrol', 'plasmaMine_pair', 'movingGate', 'rotatingBar'];
                gapSize = Math.max(240, 280 - (this.score - 55) * 1.5);
            }
            type = pool[Math.floor(Math.random() * pool.length)];

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
                obs.gapSize = gapSize + 25;
                obs.gapX = (WALL_LEFT + WALL_RIGHT) / 2 - obs.gapSize / 2;
                obs.thickness = 32;
                const baseSpd = this.score <= 25 ? 70 : (100 + Math.min((this.score - 25) * 2, 90));
                obs.speed = baseSpd * (Math.random() > 0.5 ? 1 : -1);
                obs.minX = WALL_LEFT + 40;
                obs.maxX = WALL_RIGHT - obs.gapSize - 40;
            } else if (type === 'rotatingBar') {
                obs.centerX = (WALL_LEFT + WALL_RIGHT) / 2 + (Math.random() * 160 - 80);
                obs.length = this.score <= 40 ? 350 : 410;
                obs.thickness = 28;
                const rotSpd = this.score <= 40 ? 0.75 : 1.25;
                obs.rotSpeed = rotSpd * (Math.random() > 0.5 ? 1 : -1);
                obs.angle = Math.random() * Math.PI;
            } else if (type.startsWith('plasmaMine')) {
                // Pulsing Cyber Plasma Mines / Floating Energy Orbs
                obs.type = 'plasmaMine';
                obs.mines = [];
                const sub = type.split('_')[1] || 'center';
                obs.subType = sub;
                obs.color = '#ff0055';

                if (sub === 'center') {
                    // One large pulsing plasma orb right in the middle - player zigzags around left or right
                    obs.mines.push({
                        x: (WALL_LEFT + WALL_RIGHT) / 2 + (Math.random() * 60 - 30),
                        y: y,
                        radius: 52,
                        pulse: Math.random() * Math.PI * 2
                    });
                } else if (sub === 'pair') {
                    // Two lateral mines on the sides - wide open center corridor!
                    obs.mines.push({
                        x: WALL_LEFT + 180,
                        y: y,
                        radius: 46,
                        pulse: 0
                    });
                    obs.mines.push({
                        x: WALL_RIGHT - 180,
                        y: y,
                        radius: 46,
                        pulse: Math.PI
                    });
                } else if (sub === 'patrol') {
                    // Mine smoothly drifting left and right
                    const spd = (this.score <= 35 ? 85 : 125) * (Math.random() > 0.5 ? 1 : -1);
                    obs.mines.push({
                        x: (WALL_LEFT + WALL_RIGHT) / 2,
                        y: y,
                        radius: 50,
                        pulse: 0,
                        speed: spd
                    });
                }
            } else if (type === 'cyberCross') {
                // 4-Bladed Rotating Neon Energy Cross / Shuriken
                obs.centerX = (WALL_LEFT + WALL_RIGHT) / 2 + (Math.random() * 120 - 60);
                obs.length = this.score <= 35 ? 330 : 380;
                obs.thickness = 26;
                obs.angle = Math.random() * Math.PI;
                const rotSpd = (this.score <= 35 ? 0.65 : 1.05) * (Math.random() > 0.5 ? 1 : -1);
                obs.rotSpeed = rotSpd;
                obs.color = '#ff007f';
            } else if (type === 'chevronGate') {
                // V-Shaped / Angled Zigzag Laser Barrier
                obs.vertexX = (WALL_LEFT + WALL_RIGHT) / 2 + (Math.random() * 120 - 60);
                obs.vertexY = y + (Math.random() > 0.5 ? 80 : -80);
                obs.gapSize = Math.max(340, gapSize + 50);
                obs.thickness = 30;
                obs.color = '#00f3ff';
            } else if (type === 'pulsingRing') {
                // Rotating Aperture Energy Hexagon / Ring with Open Doorway
                obs.centerX = (WALL_LEFT + WALL_RIGHT) / 2 + (Math.random() * 80 - 40);
                obs.baseRadius = 190;
                obs.radius = 190;
                obs.thickness = 28;
                obs.angle = Math.random() * Math.PI * 2;
                obs.gapAngle = 1.45; // ~83 degrees opening
                const rotSpd = (this.score <= 45 ? 0.65 : 0.95) * (Math.random() > 0.5 ? 1 : -1);
                obs.rotSpeed = rotSpd;
                obs.color = '#ffe600';
            }

            this.obstacles.push(obs);

            // ==========================================
            // COIN TRAILS TAILORED TO OBSTACLE SAFE ROUTES
            // ==========================================
            let safeCenter;
            if (obs.type === 'plasmaMine') {
                if (obs.subType === 'pair') {
                    safeCenter = (WALL_LEFT + WALL_RIGHT) / 2;
                } else {
                    safeCenter = Math.random() > 0.5 ? WALL_LEFT + 200 : WALL_RIGHT - 200;
                }
            } else if (obs.type === 'cyberCross') {
                safeCenter = obs.centerX + (Math.random() > 0.5 ? 160 : -160);
            } else if (obs.type === 'chevronGate') {
                safeCenter = obs.vertexX;
            } else if (obs.type === 'pulsingRing') {
                safeCenter = obs.centerX;
            } else if (obs.type === 'rotatingBar') {
                safeCenter = obs.centerX < CANVAS_WIDTH / 2 ? WALL_RIGHT - 160 : WALL_LEFT + 160;
            } else {
                safeCenter = obs.gapX + (obs.gapSize || 200) / 2;
            }

            const approachX = safeCenter > CANVAS_WIDTH / 2 ? safeCenter - 220 : safeCenter + 220;
            this.spawnCoinTrail(approachX, y + 220, safeCenter, y, 5);

            const exitX = safeCenter > CANVAS_WIDTH / 2 ? safeCenter - 180 : safeCenter + 180;
            this.spawnCoinTrail(safeCenter, y - 20, exitX, y - 200, 4);

            // ==========================================
            // DIVERSE POWER-UP SPAWNER
            // ==========================================
            if (Math.random() < 0.45) {
                const puX = (Math.random() > 0.5) ? safeCenter : (CANVAS_WIDTH / 2 + (Math.random() * 220 - 110));
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
                this.player.invincibleTimer = 1.6;
                this.shake = 14;
                this.timeScale = 0.55;
                window.neonAudio.playBounce();
                this.createFloatingText('🛡️ SHIELD BROKE! SAVED!', this.player.x, this.player.y - 40, this.theme.primary, 36);
                this.createGemBurst(this.player.x, this.player.y);
                this.createShockwave(this.player.x, this.player.y, this.theme.primary, 160);
                return;
            }

            // 3. Lose 1 Heart Life
            const lostHeartIndex = this.player.lives - 1;
            this.player.lives--;
            this.updateLivesHUD(lostHeartIndex);

            // Hit Freeze (Hit-Stop Impact Delay) & Cinematic Slow-Motion
            this.hitFreezeTimer = 0.22; // 220ms impact freeze
            this.timeScale = 0.35;      // Slow down to 35% speed
            this.damageFlash = 1.0;     // Full screen red damage flash
            this.shake = 24;            // Heavy impact shake

            this.player.invincibleTimer = 2.5; // 2.5s recovery invincibility
            window.neonAudio.playHurt();

            // Create dramatic shockwave & explosion
            this.createShockwave(this.player.x, this.player.y, '#ff0055', 200);
            this.createExplosion(this.player.x, this.player.y, 45);

            // Push player gently toward center away from hazard
            this.player.x += (CANVAS_WIDTH / 2 - this.player.x) * 0.45;
            this.player.dir = this.player.x < CANVAS_WIDTH / 2 ? 1 : -1;

            // 4. Out of Lives -> Trigger Game Over
            if (this.player.lives <= 0) {
                this.triggerGameOver(source);
            } else {
                const remaining = this.player.lives;
                const text = remaining === 1 ? '⚠️ 1 LIFE REMAINING! DANGER!' : `💔 LIFE LOST! (${remaining} LIVES LEFT)`;
                this.createFloatingText(text, CANVAS_WIDTH / 2, this.player.y - 80, '#ff0055', 40, 2.5);
            }
        }

        update(dt) {
            dt = Math.min(dt, 0.05);

            // Screen damage flash decay
            if (this.damageFlash > 0) {
                this.damageFlash = Math.max(0, this.damageFlash - 1.6 * dt);
            }

            // Shake decay
            if (this.shake > 0) {
                this.shake = Math.max(0, this.shake - 26 * dt);
            }

            // Update Shockwaves
            for (let i = this.shockwaves.length - 1; i >= 0; i--) {
                const sw = this.shockwaves[i];
                sw.radius += sw.speed * dt;
                sw.alpha = Math.max(0, 1.0 - (sw.radius / sw.maxRadius));
                if (sw.radius >= sw.maxRadius || sw.alpha <= 0) {
                    this.shockwaves.splice(i, 1);
                }
            }

            // Update Background Stars
            this.bgStars.forEach(star => {
                star.y += star.speed * (this.state === STATE.PLAYING ? 250 : 60) * dt;
                if (star.y > CANVAS_HEIGHT * 2) {
                    star.y = -20;
                    star.x = Math.random() * CANVAS_WIDTH;
                }
            });

            // Hit Freeze (Hit-Stop Impact Pause)
            if (this.hitFreezeTimer > 0) {
                this.hitFreezeTimer = Math.max(0, this.hitFreezeTimer - dt);
                this.updateParticles(dt * 0.2);
                return;
            }

            // Smooth slow-motion recovery
            if (this.timeScale < 1.0 && this.state === STATE.PLAYING) {
                this.timeScale = Math.min(1.0, this.timeScale + 0.55 * dt);
            }

            // Effective time delta scaled by slow-motion
            const scaledDt = dt * this.timeScale;

            // If Game Over, update particles and floating texts in slow motion, then return
            if (this.state === STATE.GAMEOVER) {
                this.updateParticles(scaledDt);
                this.updateFloatingTexts(scaledDt);
                return;
            }

            if (this.state !== STATE.PLAYING) return;

            // Update Timer
            this.elapsedTime = performance.now() - this.playStartTime;
            this.renderTimer();

            // Reset coin combo streak if idle for > 1.4s
            this.coinComboTimer += scaledDt;
            if (this.coinComboTimer > 1.4) {
                this.coinCombo = 0;
            }

            // Update Invincibility grace period
            if (this.player.invincibleTimer > 0) {
                this.player.invincibleTimer = Math.max(0, this.player.invincibleTimer - scaledDt);
            }

            // ==========================================
            // UPDATE ACTIVE POWER-UPS TIMERS & HUD
            // ==========================================
            // Magnet
            if (this.player.magnetTimer > 0) {
                this.player.magnetTimer = Math.max(0, this.player.magnetTimer - scaledDt);
                if (this.badgeMagnet) {
                    this.badgeMagnet.classList.remove('hidden');
                    this.timerMagnet.textContent = `${this.player.magnetTimer.toFixed(1)}s`;
                }
            } else if (this.badgeMagnet && !this.badgeMagnet.classList.contains('hidden')) {
                this.badgeMagnet.classList.add('hidden');
            }

            // 2X Multiplier
            if (this.player.multiplierTimer > 0) {
                this.player.multiplierTimer = Math.max(0, this.player.multiplierTimer - scaledDt);
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
                this.player.boostTimer = Math.max(0, this.player.boostTimer - scaledDt);
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
            this.player.flapImpulse = Math.max(0, this.player.flapImpulse - 550 * scaledDt);
            this.player.wingPulse = Math.max(0, this.player.wingPulse - 3.5 * scaledDt);

            // Move Player
            this.player.x += this.player.dir * horizSpeed * scaledDt;
            this.player.y -= vertSpeed * scaledDt;

            // Smooth dynamic camera tracking
            const targetCamY = this.player.y - 1250;
            this.cameraY += (targetCamY - this.cameraY) * 9 * scaledDt;

            // Player Trail
            this.player.trail.unshift({ x: this.player.x, y: this.player.y, alpha: 1.0 });
            if (this.player.trail.length > 20) {
                this.player.trail.pop();
            }
            this.player.trail.forEach(t => t.alpha -= 2.8 * scaledDt);

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
                coin.pulse += 6 * scaledDt;

                if (!coin.collected) {
                    const dx = this.player.x - coin.x;
                    const dy = this.player.y - coin.y;
                    const dist = Math.hypot(dx, dy);

                    if (magnetActive && dist < magnetRadius) {
                        coin.isMagnetized = true;
                        const pullSpeed = 1000 + (magnetRadius - dist) * 2.5;
                        coin.x += (dx / dist) * pullSpeed * scaledDt;
                        coin.y += (dy / dist) * pullSpeed * scaledDt;

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
                p.pulse += 5 * scaledDt;
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
                obs.time += scaledDt;

                if (obs.type === 'movingGate') {
                    obs.gapX += obs.speed * scaledDt;
                    if (obs.gapX < obs.minX) {
                        obs.gapX = obs.minX;
                        obs.speed = -obs.speed;
                    } else if (obs.gapX > obs.maxX) {
                        obs.gapX = obs.maxX;
                        obs.speed = -obs.speed;
                    }
                } else if (obs.type === 'rotatingBar' || obs.type === 'cyberCross') {
                    obs.angle += obs.rotSpeed * scaledDt;
                } else if (obs.type === 'pulsingRing') {
                    obs.angle += obs.rotSpeed * scaledDt;
                    obs.radius = obs.baseRadius + Math.sin(obs.time * 3.2) * 12;
                } else if (obs.type === 'plasmaMine' && obs.mines) {
                    obs.mines.forEach(m => {
                        m.pulse += 4.5 * scaledDt;
                        if (m.speed) {
                            m.x += m.speed * scaledDt;
                            if (m.x < WALL_LEFT + m.radius + 35) {
                                m.x = WALL_LEFT + m.radius + 35;
                                m.speed = Math.abs(m.speed);
                            } else if (m.x > WALL_RIGHT - m.radius - 35) {
                                m.x = WALL_RIGHT - m.radius - 35;
                                m.speed = -Math.abs(m.speed);
                            }
                        }
                    });
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
                    } else if (obs.type === 'plasmaMine' && obs.mines) {
                        for (const m of obs.mines) {
                            const d = Math.hypot(this.player.x - m.x, this.player.y - (m.y || obs.y));
                            if (d < m.radius + 40) {
                                isCloseCall = true;
                                break;
                            }
                        }
                    } else if (obs.type === 'chevronGate') {
                        const dL = Math.abs(this.player.x - (obs.vertexX - obs.gapSize / 2));
                        const dR = Math.abs(this.player.x - (obs.vertexX + obs.gapSize / 2));
                        if (dL < 45 || dR < 45) isCloseCall = true;
                    } else if (obs.type === 'cyberCross' || obs.type === 'rotatingBar' || obs.type === 'pulsingRing') {
                        isCloseCall = true;
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
                        this.createFloatingText('💥 HAZARD SMASHED! +5', this.player.x, this.player.y - 50, '#ffe600', 36);
                    } else {
                        this.takeDamage('HAZARD IMPACT');
                    }
                }
            });

            // Spawn new obstacles forward as player climbs with generous progressive spacing
            const highestObs = this.obstacles[this.obstacles.length - 1];
            if (highestObs && highestObs.y > this.player.y - 2600) {
                let spacing;
                if (this.score <= 5) spacing = 750;
                else if (this.score <= 15) spacing = 680;
                else if (this.score <= 35) spacing = 580;
                else if (this.score <= 60) spacing = 500;
                else spacing = Math.max(430, 500 - (this.score - 60) * 1.5);

                this.spawnObstacle(highestObs.y - spacing);
            }

            // Cleanup old items behind camera
            this.obstacles = this.obstacles.filter(obs => obs.y < this.cameraY + CANVAS_HEIGHT + 300);
            this.coins = this.coins.filter(c => c.y < this.cameraY + CANVAS_HEIGHT + 300 && !c.collected);
            this.powerups = this.powerups.filter(p => p.y < this.cameraY + CANVAS_HEIGHT + 300 && !p.collected);

            // Update Particles & Floating Texts
            this.updateParticles(scaledDt);
            this.updateFloatingTexts(scaledDt);
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

            const hitboxRatio = this.score <= 15 ? 0.62 : (this.score <= 35 ? 0.70 : 0.78);
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
            } else if (obs.type === 'plasmaMine' && obs.mines) {
                for (const m of obs.mines) {
                    const dist = Math.hypot(p.x - m.x, p.y - (m.y || obs.y));
                    if (dist < pr + m.radius * 0.82) {
                        return true;
                    }
                }
            } else if (obs.type === 'cyberCross') {
                const halfL = obs.length / 2;
                // Arm 1 (along obs.angle)
                const c1 = Math.cos(obs.angle);
                const s1 = Math.sin(obs.angle);
                const d1 = this.distToSegment(
                    p.x, p.y,
                    obs.centerX - c1 * halfL, obs.y - s1 * halfL,
                    obs.centerX + c1 * halfL, obs.y + s1 * halfL
                );
                if (d1 < pr + obs.thickness / 2) return true;

                // Arm 2 (perpendicular along obs.angle + PI/2)
                const c2 = Math.cos(obs.angle + Math.PI / 2);
                const s2 = Math.sin(obs.angle + Math.PI / 2);
                const d2 = this.distToSegment(
                    p.x, p.y,
                    obs.centerX - c2 * halfL, obs.y - s2 * halfL,
                    obs.centerX + c2 * halfL, obs.y + s2 * halfL
                );
                if (d2 < pr + obs.thickness / 2) return true;

            } else if (obs.type === 'chevronGate') {
                const gapLeftX = obs.vertexX - obs.gapSize / 2;
                const gapRightX = obs.vertexX + obs.gapSize / 2;

                // Left angled arm: WALL_LEFT to gapLeftX
                const dLeft = this.distToSegment(p.x, p.y, WALL_LEFT, obs.y, gapLeftX, obs.vertexY);
                if (dLeft < pr + obs.thickness / 2) return true;

                // Right angled arm: gapRightX to WALL_RIGHT
                const dRight = this.distToSegment(p.x, p.y, gapRightX, obs.vertexY, WALL_RIGHT, obs.y);
                if (dRight < pr + obs.thickness / 2) return true;

            } else if (obs.type === 'pulsingRing') {
                const d = Math.hypot(p.x - obs.centerX, p.y - obs.y);
                const halfThick = obs.thickness / 2;
                if (d > obs.radius - halfThick - pr && d < obs.radius + halfThick + pr) {
                    // Check if player is safely within the open doorway gap
                    const ang = Math.atan2(p.y - obs.y, p.x - obs.centerX);
                    let diff = Math.atan2(Math.sin(ang - obs.angle), Math.cos(ang - obs.angle));
                    if (Math.abs(diff) > obs.gapAngle / 2) {
                        return true;
                    }
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
            this.shake = 30;
            this.hitFreezeTimer = 0.28; // 280ms freeze on fatal impact
            this.timeScale = 0.20;      // Cinematic slow-motion debris
            this.damageFlash = 1.0;     // Full screen red death flash

            window.neonAudio.playCrash();
            window.neonAudio.stopBGM();

            this.createShockwave(this.player.x, this.player.y, '#ff0055', 280);
            this.createExplosion(this.player.x, this.player.y, 80);

            this.createFloatingText('💀 RUN TERMINATED - OUT OF LIVES 💀', CANVAS_WIDTH / 2, this.player.y - 80, '#ff0055', 44, 3.2);

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

            // Submit final numeric score precisely once per game over event via send_score_api.js
            if (!this.scoreSent) {
                this.scoreSent = true;
                const finalScore = Number(this.score) || 0;
                try {
                    if (typeof window !== 'undefined' && typeof window.sendScore === 'function') {
                        window.sendScore(finalScore);
                    } else if (typeof globalThis !== 'undefined' && typeof globalThis.sendScore === 'function') {
                        globalThis.sendScore(finalScore);
                    } else if (typeof sendScore === 'function') {
                        sendScore(finalScore);
                    } else {
                        console.warn('[GameOver] sendScore function is not available.');
                    }
                } catch (e) {
                    console.error('[GameOver] Error calling sendScore:', e);
                }
            }

            // Extended delay (1.4s) so player clearly sees death explosion, debris, and realizes they died
            setTimeout(() => {
                this.gameOverModal.classList.remove('hidden');
            }, 1400);
        }

        createShockwave(x, y, color = '#ff0055', maxRadius = 200) {
            this.shockwaves.push({
                x: x,
                y: y,
                radius: 14,
                maxRadius: maxRadius,
                color: color,
                alpha: 1.0,
                speed: 420
            });
        }

        updateParticles(dt) {
            this.particles.forEach(p => {
                p.x += p.vx * dt;
                p.y += p.vy * dt;
                p.life -= p.decay * dt;
            });
            this.particles = this.particles.filter(p => p.life > 0);
        }

        updateFloatingTexts(dt) {
            this.floatingTexts.forEach(ft => {
                ft.y += ft.vy * dt;
                ft.alpha -= ft.decay * dt;
            });
            this.floatingTexts = this.floatingTexts.filter(ft => ft.alpha > 0);
        }

        createExplosion(x, y, customCount = 0) {
            const count = customCount || (this.glowQuality === 'low' ? 30 : 60);
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
                    color: Math.random() > 0.5 ? th.primary : (Math.random() > 0.3 ? th.secondary : '#ffe600'),
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

            // Shockwaves
            this.shockwaves.forEach(sw => {
                ctx.save();
                this.setGlow(sw.color, 26);
                ctx.strokeStyle = sw.color;
                ctx.lineWidth = Math.max(1, 6 * sw.alpha);
                ctx.globalAlpha = sw.alpha;
                ctx.beginPath();
                ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
                ctx.stroke();
                ctx.restore();
            });

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

            // Full-screen Red Damage Flash & Vignette
            if (this.damageFlash > 0) {
                ctx.save();
                ctx.fillStyle = `rgba(255, 0, 85, ${Math.min(0.42, this.damageFlash * 0.42)})`;
                ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

                const vig = ctx.createRadialGradient(
                    CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, CANVAS_WIDTH * 0.25,
                    CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, CANVAS_WIDTH * 0.78
                );
                vig.addColorStop(0, 'rgba(255, 0, 85, 0)');
                vig.addColorStop(1, `rgba(255, 0, 60, ${Math.min(0.65, this.damageFlash * 0.65)})`);
                ctx.fillStyle = vig;
                ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
                ctx.restore();
            }

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

            } else if (obs.type === 'plasmaMine' && obs.mines) {
                // Pulsing Cyber Plasma Mines / Floating Energy Orbs
                obs.mines.forEach(m => {
                    const my = m.y || obs.y;
                    ctx.save();
                    ctx.translate(m.x, my);

                    // Outer pulsating danger aura
                    this.setGlow(obs.color, 28);
                    ctx.strokeStyle = `rgba(255, 0, 85, ${0.35 + 0.35 * Math.sin(m.pulse)})`;
                    ctx.lineWidth = 2.5;
                    ctx.setLineDash([6, 6]);
                    ctx.lineDashOffset = -m.pulse * 12;
                    ctx.beginPath();
                    ctx.arc(0, 0, m.radius * 1.32, 0, Math.PI * 2);
                    ctx.stroke();

                    // 8 Rotating Energy Spikes
                    ctx.fillStyle = obs.color;
                    const spikeCount = 8;
                    for (let s = 0; s < spikeCount; s++) {
                        const ang = m.pulse * 0.8 + s * (Math.PI * 2 / spikeCount);
                        const tipR = m.radius * (1.22 + 0.14 * Math.sin(m.pulse * 2 + s));
                        const baseR = m.radius * 0.85;
                        const w = 0.22;

                        ctx.beginPath();
                        ctx.moveTo(Math.cos(ang - w) * baseR, Math.sin(ang - w) * baseR);
                        ctx.lineTo(Math.cos(ang) * tipR, Math.sin(ang) * tipR);
                        ctx.lineTo(Math.cos(ang + w) * baseR, Math.sin(ang + w) * baseR);
                        ctx.closePath();
                        ctx.fill();
                    }

                    // Main Mine Sphere (Radial gradient with hot white core)
                    const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, m.radius);
                    grad.addColorStop(0, '#ffffff');
                    grad.addColorStop(0.35, '#ff3366');
                    grad.addColorStop(0.85, '#cc0044');
                    grad.addColorStop(1, '#660022');
                    ctx.fillStyle = grad;
                    ctx.beginPath();
                    ctx.arc(0, 0, m.radius, 0, Math.PI * 2);
                    ctx.fill();

                    // Outer Rim Ring
                    ctx.strokeStyle = '#ffffff';
                    ctx.lineWidth = 2.5;
                    ctx.stroke();

                    // Center Cyber Hazard Icon (Rotating 4-point star diamond)
                    ctx.save();
                    ctx.rotate(-m.pulse * 1.2);
                    ctx.fillStyle = '#ffffff';
                    this.setGlow('#ffffff', 14);
                    ctx.beginPath();
                    const dSize = m.radius * 0.42;
                    ctx.moveTo(0, -dSize);
                    ctx.lineTo(dSize * 0.35, 0);
                    ctx.lineTo(0, dSize);
                    ctx.lineTo(-dSize * 0.35, 0);
                    ctx.closePath();
                    ctx.fill();
                    ctx.restore();

                    ctx.restore();
                });

            } else if (obs.type === 'cyberCross') {
                // 4-Bladed Rotating Neon Energy Cross / Shuriken
                ctx.save();
                ctx.translate(obs.centerX, obs.y);
                ctx.rotate(obs.angle);
                this.setGlow(obs.color, 26);

                const halfL = obs.length / 2;

                // Arm 1 (Horizontal)
                ctx.strokeStyle = obs.color;
                ctx.lineWidth = obs.thickness;
                ctx.lineCap = 'round';
                ctx.beginPath();
                ctx.moveTo(-halfL, 0);
                ctx.lineTo(halfL, 0);
                ctx.stroke();

                // Arm 2 (Vertical)
                ctx.beginPath();
                ctx.moveTo(0, -halfL);
                ctx.lineTo(0, halfL);
                ctx.stroke();

                // White Hot Laser Cores
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 6;
                ctx.beginPath();
                ctx.moveTo(-halfL, 0);
                ctx.lineTo(halfL, 0);
                ctx.moveTo(0, -halfL);
                ctx.lineTo(0, halfL);
                ctx.stroke();

                // 4 Glowing Cyan Tip Nodes
                const tips = [
                    { x: halfL, y: 0 },
                    { x: -halfL, y: 0 },
                    { x: 0, y: halfL },
                    { x: 0, y: -halfL }
                ];
                ctx.fillStyle = '#00f3ff';
                this.setGlow('#00f3ff', 20);
                tips.forEach(t => {
                    ctx.beginPath();
                    ctx.arc(t.x, t.y, obs.thickness / 2 + 3, 0, Math.PI * 2);
                    ctx.fill();
                });

                // Central Cyber Hub with Glowing Core
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(0, 0, obs.thickness / 2 + 7, 0, Math.PI * 2);
                ctx.fill();

                ctx.strokeStyle = obs.color;
                ctx.lineWidth = 3;
                ctx.setLineDash([4, 4]);
                ctx.beginPath();
                ctx.arc(0, 0, obs.thickness + 6, 0, Math.PI * 2);
                ctx.stroke();

                ctx.restore();

            } else if (obs.type === 'chevronGate') {
                // V-Shaped / Angled Zigzag Laser Barrier
                this.setGlow(obs.color, 24);
                const gapLeftX = obs.vertexX - obs.gapSize / 2;
                const gapRightX = obs.vertexX + obs.gapSize / 2;

                ctx.strokeStyle = obs.color;
                ctx.lineWidth = obs.thickness;
                ctx.lineCap = 'round';

                // Left angled arm
                ctx.beginPath();
                ctx.moveTo(WALL_LEFT, obs.y);
                ctx.lineTo(gapLeftX, obs.vertexY);
                ctx.stroke();

                // Right angled arm
                ctx.beginPath();
                ctx.moveTo(gapRightX, obs.vertexY);
                ctx.lineTo(WALL_RIGHT, obs.y);
                ctx.stroke();

                // White Hot Inner Core
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 5;
                ctx.beginPath();
                ctx.moveTo(WALL_LEFT, obs.y);
                ctx.lineTo(gapLeftX, obs.vertexY);
                ctx.moveTo(gapRightX, obs.vertexY);
                ctx.lineTo(WALL_RIGHT, obs.y);
                ctx.stroke();

                // End cap nodes
                ctx.fillStyle = obs.color;
                ctx.beginPath();
                ctx.arc(gapLeftX, obs.vertexY, obs.thickness / 2 + 3, 0, Math.PI * 2);
                ctx.arc(gapRightX, obs.vertexY, obs.thickness / 2 + 3, 0, Math.PI * 2);
                ctx.fill();

                // Chevron flow arrows along the beam
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 2.5;
                const midLX = (WALL_LEFT + gapLeftX) / 2;
                const midLY = (obs.y + obs.vertexY) / 2;
                ctx.beginPath();
                ctx.moveTo(midLX - 12, midLY - 10);
                ctx.lineTo(midLX, midLY);
                ctx.lineTo(midLX - 12, midLY + 10);
                ctx.stroke();

                const midRX = (gapRightX + WALL_RIGHT) / 2;
                const midRY = (obs.vertexY + obs.y) / 2;
                ctx.beginPath();
                ctx.moveTo(midRX + 12, midRY - 10);
                ctx.lineTo(midRX, midRY);
                ctx.lineTo(midRX + 12, midRY + 10);
                ctx.stroke();

            } else if (obs.type === 'pulsingRing') {
                // Rotating Aperture Energy Hexagon / Ring with Open Doorway
                ctx.save();
                ctx.translate(obs.centerX, obs.y);
                this.setGlow(obs.color, 26);

                const startAng = obs.angle + obs.gapAngle / 2;
                const endAng = obs.angle + Math.PI * 2 - obs.gapAngle / 2;

                // Outer Laser Arc
                ctx.strokeStyle = obs.color;
                ctx.lineWidth = obs.thickness;
                ctx.lineCap = 'round';
                ctx.beginPath();
                ctx.arc(0, 0, obs.radius, startAng, endAng);
                ctx.stroke();

                // White Hot Laser Arc
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 5;
                ctx.beginPath();
                ctx.arc(0, 0, obs.radius, startAng, endAng);
                ctx.stroke();

                // Emitter Nodes at Doorway Edges
                ctx.fillStyle = '#ffffff';
                const p1x = Math.cos(startAng) * obs.radius;
                const p1y = Math.sin(startAng) * obs.radius;
                const p2x = Math.cos(endAng) * obs.radius;
                const p2y = Math.sin(endAng) * obs.radius;

                ctx.beginPath();
                ctx.arc(p1x, p1y, obs.thickness / 2 + 4, 0, Math.PI * 2);
                ctx.arc(p2x, p2y, obs.thickness / 2 + 4, 0, Math.PI * 2);
                ctx.fill();

                // Concentric dashed decorative rings inside
                ctx.strokeStyle = 'rgba(0, 243, 255, 0.4)';
                ctx.lineWidth = 2;
                ctx.setLineDash([8, 8]);
                ctx.lineDashOffset = obs.time * 20;
                ctx.beginPath();
                ctx.arc(0, 0, obs.radius * 0.65, 0, Math.PI * 2);
                ctx.stroke();

                ctx.restore();
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
            // INVINCIBILITY RECOVERY AURA & PULSE
            // ==========================================
            if (p.invincibleTimer > 0) {
                // Pulsating body alpha so player is always visible but clearly in a recovery phase
                ctx.globalAlpha = 0.45 + 0.45 * Math.abs(Math.sin(Date.now() / 80));

                ctx.save();
                this.setGlow('#ff0055', 22);
                ctx.strokeStyle = `rgba(255, 0, 85, ${0.45 + 0.45 * Math.abs(Math.sin(Date.now() / 90))})`;
                ctx.lineWidth = 3;
                ctx.setLineDash([8, 6]);
                ctx.lineDashOffset = -Date.now() / 30;
                ctx.beginPath();
                ctx.arc(0, 0, p.radius * 2.3, 0, Math.PI * 2);
                ctx.stroke();

                ctx.strokeStyle = 'rgba(255, 230, 0, 0.75)';
                ctx.lineWidth = 1.8;
                ctx.setLineDash([4, 4]);
                ctx.lineDashOffset = Date.now() / 40;
                ctx.beginPath();
                ctx.arc(0, 0, p.radius * 1.7, 0, Math.PI * 2);
                ctx.stroke();

                // Upright recovery text badge
                ctx.font = '900 13px "Outfit", sans-serif';
                ctx.textAlign = 'center';
                ctx.fillStyle = '#ff3366';
                this.setGlow('#ff0055', 14);
                ctx.fillText('⚡ RECOVERY ⚡', 0, -p.radius * 2.6);
                ctx.restore();
            }

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
