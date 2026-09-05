/**
 * game.js - Core Game Loop, Spawner, Collisions, HUD & Input
 * Infinite Sky Flight, Power-Up Directional Signals, Extra Lives & Tap to Play
 */

import { storage } from './storage.js';
import { soundEngine } from './audio.js';
import { ParticleSystem } from './particles.js';
import { Player, Missile, DecoyFlare, Asteroid, PowerUp, SHIP_SPECS } from './entities.js';

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
