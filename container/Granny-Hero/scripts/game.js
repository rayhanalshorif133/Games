// Granny Hero - Complete Game Engine
// Virtual resolution: 700 x 1200

(function () {
    'use strict';

    const V_WIDTH = 700;
    const V_HEIGHT = 1200;
    const CENTER_X = 350;
    const CENTER_Y = 600;
    const ORBIT_RADIUS = 95;
    const ENEMY_RADIUS = 245;

    // 8 Enemy angles in radians (matching 8-spoke circle: 0, 45, 90, 135, 180, 225, 270, 315 deg)
    const ENEMY_ANGLES = [
        -Math.PI / 2,         // 0: Top (270 deg)
        -Math.PI / 4,         // 1: Top-Right (315 deg)
        0,                    // 2: Right (0 deg)
        Math.PI / 4,          // 3: Bottom-Right (45 deg)
        Math.PI / 2,          // 4: Bottom (90 deg)
        (3 * Math.PI) / 4,    // 5: Bottom-Left (135 deg)
        Math.PI,              // 6: Left (180 deg)
        (-3 * Math.PI) / 4    // 7: Top-Left (225 deg)
    ];

    class GrannyHeroGame {
        constructor() {
            this.canvas = document.getElementById('game-canvas');
            this.ctx = this.canvas.getContext('2d');

            // Responsive stage scale
            this.scale = 1;
            this.offsetX = 0;
            this.offsetY = 0;

            // Assets
            this.sheets = {};
            this.sprites = {};
            this.assetsLoaded = false;

            // Game States: 'TITLE', 'PLAYING', 'GAMEOVER', 'PAUSED'
            this.state = 'TITLE';

            // Stats
            this.score = 0;
            this.highScore = 0;
            this.lives = 3;
            this.maxLives = 4;
            this.superPanTimer = 0; // seconds remaining for 2x power pan

            // Entities
            this.granny = {
                x: CENTER_X,
                y: CENTER_Y,
                faceState: 'normal', // 'normal', 'happy', 'shocked'
                faceTimer: 0,
                eyeOffset: { x: 0, y: 0 }
            };

            this.pan = {
                x: CENTER_X + ORBIT_RADIUS,
                y: CENTER_Y,
                angle: 0, // orbit angle
                orbitSpeed: 2.2, // rad/sec
                state: 'ORBIT', // 'ORBIT', 'THROWN', 'RETURNING'
                vx: 0,
                vy: 0,
                flightSpeed: 1450,
                spinAngle: 0,
                spinSpeed: 24,
                trail: []
            };

            // 8 Enemies
            this.enemies = [];
            for (let i = 0; i < 8; i++) {
                const ang = ENEMY_ANGLES[i];
                this.enemies.push({
                    id: i,
                    angle: ang,
                    x: CENTER_X + Math.cos(ang) * ENEMY_RADIUS,
                    y: CENTER_Y + Math.sin(ang) * ENEMY_RADIUS,
                    active: false,
                    activeTimer: 0,
                    maxActiveTimer: 2.8,
                    scale: 0,
                    hitAnim: 0,
                    peekTimer: Math.random() * 2
                });
            }

            this.activeEnemyIndex = -1;
            this.enemySpawnTimer = 0.8;

            // Bonus Balloons
            this.balloons = [];
            this.balloonSpawnTimer = 14;

            // Particles & Floating texts
            this.particles = [];
            this.floatingTexts = [];

            // Screen shake
            this.shakeDuration = 0;
            this.shakeIntensity = 0;

            // Timing
            this.lastTime = performance.now();

            // Load high score
            try {
                this.highScore = parseInt(localStorage.getItem('granny_hero_highscore') || '0', 10);
            } catch (e) {
                this.highScore = 0;
            }

            this.initDOM();
            this.bindEvents();
            this.loadAssets();
        }

        initDOM() {
            this.hudScore = document.getElementById('hud-score');
            this.hudHighScore = document.getElementById('hud-highscore');
            this.hudLivesContainer = document.getElementById('hud-lives');
            this.titleScreen = document.getElementById('screen-title');
            this.gameOverScreen = document.getElementById('screen-gameover');
            this.finalScoreEl = document.getElementById('go-final-score');
            this.bestScoreEl = document.getElementById('go-best-score');
            this.newBestBadge = document.getElementById('go-new-best');
            this.powerBanner = document.getElementById('power-banner');
            this.soundBtn = document.getElementById('btn-sound');

            if (this.hudHighScore) {
                this.hudHighScore.textContent = this.highScore;
            }
            this.updateSoundBtnUI();
        }

        updateSoundBtnUI() {
            if (!this.soundBtn) return;
            const isMuted = window.soundEngine ? window.soundEngine.muted : false;
            this.soundBtn.innerHTML = isMuted ? '🔇' : '🔊';
            this.soundBtn.title = isMuted ? 'Unmute Sound' : 'Mute Sound';
        }

        bindEvents() {
            window.addEventListener('resize', () => this.resizeCanvas());
            this.resizeCanvas();

            // Tap/Click on canvas
            const handleAction = (e) => {
                if (e) {
                    if (e.target && e.target.closest && e.target.closest('.ui-interactive')) {
                        return; // Let buttons handle their own click
                    }
                    e.preventDefault();
                }

                if (this.state === 'PLAYING') {
                    this.throwPan();
                }
            };

            this.canvas.addEventListener('pointerdown', handleAction);
            window.addEventListener('keydown', (e) => {
                if (e.code === 'Space') {
                    e.preventDefault();
                    if (this.state === 'PLAYING') {
                        this.throwPan();
                    } else if (this.state === 'TITLE') {
                        this.startGame();
                    } else if (this.state === 'GAMEOVER') {
                        this.restartGame();
                    }
                }
            });

            // Start Button
            const startBtn = document.getElementById('btn-play');
            if (startBtn) {
                startBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (window.soundEngine) window.soundEngine.ensureContext();
                    this.startGame();
                });
            }

            // Retry Button
            const retryBtn = document.getElementById('btn-retry');
            if (retryBtn) {
                retryBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (window.soundEngine) window.soundEngine.ensureContext();
                    this.restartGame();
                });
            }

            // Sound Toggle
            if (this.soundBtn) {
                this.soundBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (window.soundEngine) {
                        window.soundEngine.toggleMute();
                        this.updateSoundBtnUI();
                    }
                });
            }
        }

        resizeCanvas() {
            const container = document.getElementById('game-container') || document.body;
            const w = window.innerWidth;
            const h = window.innerHeight;

            // Fit 700x1200 keeping aspect ratio
            const scale = Math.min(w / V_WIDTH, h / V_HEIGHT);
            this.scale = scale;

            const displayW = Math.round(V_WIDTH * scale);
            const displayH = Math.round(V_HEIGHT * scale);

            this.canvas.style.width = displayW + 'px';
            this.canvas.style.height = displayH + 'px';

            // Pixel buffer with devicePixelRatio for sharpness
            const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
            this.canvas.width = Math.round(V_WIDTH * dpr);
            this.canvas.height = Math.round(V_HEIGHT * dpr);
            this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

            // Scale UI layer to match canvas
            const uiLayer = document.getElementById('ui-layer');
            if (uiLayer) {
                uiLayer.style.width = displayW + 'px';
                uiLayer.style.height = displayH + 'px';
            }
        }

        loadAssets() {
            const sheetUrls = {
                sheet0: 'images/shared-0-sheet0.webp',
                sheet1: 'images/shared-0-sheet1.webp',
                sheet2: 'images/shared-0-sheet2.webp',
                sheet3: 'images/shared-0-sheet3.webp'
            };

            let loadedCount = 0;
            const keys = Object.keys(sheetUrls);

            keys.forEach((k) => {
                const img = new Image();
                img.onload = () => {
                    this.sheets[k] = img;
                    loadedCount++;
                    if (loadedCount === keys.length) {
                        this.extractSprites();
                    }
                };
                img.onerror = (err) => {
                    console.error('Failed to load sheet:', k, err);
                };
                img.src = sheetUrls[k];
            });
        }

        extractSprites() {
            // Helper to cut out a sprite onto its own offscreen canvas
            const cut = (sheet, x, y, w, h, isRotated = false) => {
                const cvs = document.createElement('canvas');
                cvs.width = w;
                cvs.height = h;
                const c = cvs.getContext('2d');
                if (isRotated) {
                    // In rotated sprite, sheet rect is (x, y, h, w)
                    c.save();
                    c.translate(w / 2, h / 2);
                    c.rotate(-Math.PI / 2);
                    c.drawImage(sheet, x, y, h, w, -h / 2, -w / 2, h, w);
                    c.restore();
                } else {
                    c.drawImage(sheet, x, y, w, h, 0, 0, w, h);
                }
                return cvs;
            };

            try {
                // 1. Background (warm yellow)
                this.sprites.bg = cut(this.sheets.sheet1, 1, 1, 700, 1200);

                // 2. Grandma head
                this.sprites.grandma = cut(this.sheets.sheet2, 385, 257, 118, 152);

                // 3. Frying pan
                // In Construct 3: [193, 257, 224, 142, isRotated: true]
                this.sprites.fryPan = cut(this.sheets.sheet2, 193, 257, 224, 142, true);

                // 4. Enemy (red devil/monster from sheet2)
                this.sprites.enemy = cut(this.sheets.sheet2, 1, 257, 190, 195);

                // 5. Grandma eye
                this.sprites.eye = cut(this.sheets.sheet3, 0, 0, 10, 12);

                // 6. 8-Pointed Star / Circle lines
                this.sprites.ratCircle = cut(this.sheets.sheet1, 513, 1537, 500, 500);

                // 7. Demo Title banner
                this.sprites.titleDemo = cut(this.sheets.sheet0, 1537, 1025, 462, 834);

                this.assetsLoaded = true;
                console.log('All Granny Hero sprites extracted successfully!');
            } catch (e) {
                console.error('Error extracting sprites:', e);
                this.assetsLoaded = true;
            }

            // Start game loop
            requestAnimationFrame((ts) => this.loop(ts));
        }

        startGame() {
            if (window.soundEngine) window.soundEngine.init();
            this.state = 'PLAYING';
            this.score = 0;
            this.lives = 3;
            this.superPanTimer = 0;
            this.particles = [];
            this.floatingTexts = [];
            this.balloons = [];
            this.balloonSpawnTimer = 12;

            // Reset pan
            this.pan.state = 'ORBIT';
            this.pan.angle = -Math.PI / 2;
            this.pan.orbitSpeed = 2.2;
            this.pan.trail = [];

            // Reset enemies
            this.enemies.forEach((en) => {
                en.active = false;
                en.scale = 0;
                en.hitAnim = 0;
            });
            this.activeEnemyIndex = -1;
            this.enemySpawnTimer = 0.5;

            this.updateHUD();
            if (this.titleScreen) this.titleScreen.style.display = 'none';
            if (this.gameOverScreen) this.gameOverScreen.style.display = 'none';
        }

        restartGame() {
            this.startGame();
        }

        throwPan() {
            if (this.pan.state !== 'ORBIT') return;

            this.pan.state = 'THROWN';
            const speed = this.pan.flightSpeed;
            this.pan.vx = Math.cos(this.pan.angle) * speed;
            this.pan.vy = Math.sin(this.pan.angle) * speed;

            if (window.soundEngine) window.soundEngine.playThrow();
        }

        onHit(enemy, hitX, hitY) {
            // Random score between 10 and 15
            let pts = Math.floor(Math.random() * 6) + 10; // 10, 11, 12, 13, 14, 15
            if (this.superPanTimer > 0) {
                pts *= 2;
            }

            this.score += pts;
            if (this.score > this.highScore) {
                this.highScore = this.score;
                try {
                    localStorage.setItem('granny_hero_highscore', this.highScore);
                } catch (e) {}
            }
            this.updateHUD();

            // Audio & Screen shake
            if (window.soundEngine) window.soundEngine.playHit();
            this.shake(12, 0.25);

            // Grandma expression
            this.granny.faceState = 'happy';
            this.granny.faceTimer = 0.6;

            // Floating score text
            this.spawnFloatingText(
                `+${pts}${this.superPanTimer > 0 ? ' (2X!)' : ''}`,
                hitX,
                hitY - 20,
                this.superPanTimer > 0 ? '#ffea00' : '#ffffff',
                40
            );

            // Hit particles (sparks, stars, poof)
            this.spawnHitParticles(hitX, hitY);

            // Deactivate enemy
            enemy.active = false;
            enemy.hitAnim = 0.4;
            this.activeEnemyIndex = -1;
            this.enemySpawnTimer = 0.5; // Next enemy in 0.5s

            // Pan returns to Grandma
            this.pan.state = 'RETURNING';
        }

        onMiss() {
            this.lives--;
            this.updateHUD();

            if (window.soundEngine) window.soundEngine.playMiss();
            this.shake(8, 0.2);

            this.granny.faceState = 'shocked';
            this.granny.faceTimer = 0.8;

            this.spawnFloatingText('MISS! -1 ❤️', CENTER_X, CENTER_Y - 80, '#ff3b30', 36);

            if (this.lives <= 0) {
                this.triggerGameOver();
            } else {
                // Return pan smoothly
                this.pan.state = 'RETURNING';
                this.pan.trail = [];
            }
        }

        triggerGameOver() {
            this.state = 'GAMEOVER';
            if (window.soundEngine) window.soundEngine.playGameOver();

            if (this.finalScoreEl) this.finalScoreEl.textContent = this.score;
            if (this.bestScoreEl) this.bestScoreEl.textContent = this.highScore;
            if (this.newBestBadge) {
                this.newBestBadge.style.display = (this.score >= this.highScore && this.score > 0) ? 'inline-block' : 'none';
            }
            if (this.gameOverScreen) {
                this.gameOverScreen.style.display = 'flex';
            }
        }

        spawnHitParticles(x, y) {
            // Bright stars & sparks
            for (let i = 0; i < 18; i++) {
                const ang = Math.random() * Math.PI * 2;
                const spd = 120 + Math.random() * 320;
                this.particles.push({
                    x: x,
                    y: y,
                    vx: Math.cos(ang) * spd,
                    vy: Math.sin(ang) * spd,
                    size: 8 + Math.random() * 8,
                    color: ['#ffeb3b', '#ff9800', '#ffffff', '#e91e63'][Math.floor(Math.random() * 4)],
                    life: 0.4 + Math.random() * 0.3,
                    maxLife: 0.7,
                    shape: Math.random() > 0.4 ? 'star' : 'circle'
                });
            }
        }

        spawnBalloonParticles(x, y, color) {
            for (let i = 0; i < 22; i++) {
                const ang = Math.random() * Math.PI * 2;
                const spd = 80 + Math.random() * 260;
                this.particles.push({
                    x: x,
                    y: y,
                    vx: Math.cos(ang) * spd,
                    vy: Math.sin(ang) * spd,
                    size: 6 + Math.random() * 8,
                    color: color || '#ff4081',
                    life: 0.5 + Math.random() * 0.4,
                    maxLife: 0.9,
                    shape: 'confetti'
                });
            }
        }

        spawnFloatingText(text, x, y, color = '#ffffff', size = 32) {
            this.floatingTexts.push({
                text: text,
                x: x,
                y: y,
                vy: -75,
                color: color,
                size: size,
                alpha: 1,
                life: 0.85
            });
        }

        shake(intensity, duration) {
            this.shakeIntensity = intensity;
            this.shakeDuration = duration;
        }

        spawnBonusBalloon() {
            // Decide bonus type:
            // If player has < 3 lives: 60% chance for Life balloon, 40% for Super Pan
            // If full lives: 60% Super Pan, 40% Bonus +25 Score
            let type = 'life';
            if (this.lives < 3) {
                type = Math.random() < 0.65 ? 'life' : 'super_pan';
            } else {
                type = Math.random() < 0.55 ? 'super_pan' : 'score';
            }

            const fromLeft = Math.random() > 0.5;
            const startX = fromLeft ? -60 : V_WIDTH + 60;
            const targetX = fromLeft ? V_WIDTH + 80 : -80;
            const baseY = 240 + Math.random() * 200; // floating above Granny

            this.balloons.push({
                type: type, // 'life', 'super_pan', 'score'
                x: startX,
                y: baseY,
                baseY: baseY,
                vx: fromLeft ? (80 + Math.random() * 40) : -(80 + Math.random() * 40),
                radius: 38,
                color: type === 'life' ? '#ff3b5c' : type === 'super_pan' ? '#ffb300' : '#00e5ff',
                bobPhase: Math.random() * Math.PI * 2
            });
        }

        updateHUD() {
            if (this.hudScore) this.hudScore.textContent = this.score;
            if (this.hudHighScore) this.hudHighScore.textContent = this.highScore;

            if (this.hudLivesContainer) {
                this.hudLivesContainer.innerHTML = '';
                for (let i = 0; i < 3; i++) {
                    const lifeIcon = document.createElement('div');
                    lifeIcon.className = 'hud-life-icon' + (i < this.lives ? ' active' : ' lost');
                    this.hudLivesContainer.appendChild(lifeIcon);
                }
            }

            if (this.powerBanner) {
                if (this.superPanTimer > 0) {
                    this.powerBanner.style.display = 'block';
                    this.powerBanner.textContent = `✨ SUPER PAN 2X: ${Math.ceil(this.superPanTimer)}s`;
                } else {
                    this.powerBanner.style.display = 'none';
                }
            }
        }

        // ==================== MAIN UPDATE ====================
        update(dt) {
            if (dt > 0.1) dt = 0.1; // Clamp delta time

            // Screen shake
            if (this.shakeDuration > 0) {
                this.shakeDuration -= dt;
            }

            // Granny facial expression timer
            if (this.granny.faceTimer > 0) {
                this.granny.faceTimer -= dt;
                if (this.granny.faceTimer <= 0) {
                    this.granny.faceState = 'normal';
                }
            }

            // Super Pan timer
            if (this.superPanTimer > 0) {
                this.superPanTimer -= dt;
                this.updateHUD();
            }

            // Update particles
            for (let i = this.particles.length - 1; i >= 0; i--) {
                const p = this.particles[i];
                p.x += p.vx * dt;
                p.y += p.vy * dt;
                p.vy += 300 * dt; // gravity
                p.life -= dt;
                if (p.life <= 0) {
                    this.particles.splice(i, 1);
                }
            }

            // Update floating texts
            for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
                const ft = this.floatingTexts[i];
                ft.y += ft.vy * dt;
                ft.life -= dt;
                ft.alpha = Math.max(0, ft.life / 0.85);
                if (ft.life <= 0) {
                    this.floatingTexts.splice(i, 1);
                }
            }

            if (this.state !== 'PLAYING') return;

            // Difficulty progression based on score
            const speedMultiplier = Math.min(1.8, 1 + (this.score / 150) * 0.5);

            // ================= Frying Pan Logic =================
            if (this.pan.state === 'ORBIT') {
                this.pan.angle += this.pan.orbitSpeed * speedMultiplier * dt;
                if (this.pan.angle > Math.PI * 2) this.pan.angle -= Math.PI * 2;

                this.pan.x = CENTER_X + Math.cos(this.pan.angle) * ORBIT_RADIUS;
                this.pan.y = CENTER_Y + Math.sin(this.pan.angle) * ORBIT_RADIUS;
                this.pan.spinAngle = this.pan.angle;
            } else if (this.pan.state === 'THROWN') {
                // Record trail
                this.pan.trail.push({ x: this.pan.x, y: this.pan.y, alpha: 0.6 });
                if (this.pan.trail.length > 8) this.pan.trail.shift();

                this.pan.x += this.pan.vx * dt;
                this.pan.y += this.pan.vy * dt;
                this.pan.spinAngle += this.pan.spinSpeed * dt;

                // Check collision with Active Enemy
                let hitEnemy = false;
                if (this.activeEnemyIndex >= 0) {
                    const enemy = this.enemies[this.activeEnemyIndex];
                    if (enemy.active && enemy.scale > 0.4) {
                        const dx = this.pan.x - enemy.x;
                        const dy = this.pan.y - enemy.y;
                        const dist = Math.sqrt(dx * dx + dy * dy);
                        if (dist < 65) {
                            hitEnemy = true;
                            this.onHit(enemy, enemy.x, enemy.y);
                        }
                    }
                }

                // Check collision with Bonus Balloons
                for (let i = this.balloons.length - 1; i >= 0; i--) {
                    const b = this.balloons[i];
                    const dx = this.pan.x - b.x;
                    const dy = this.pan.y - b.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < b.radius + 35) {
                        // Pop balloon!
                        if (window.soundEngine) window.soundEngine.playPop();
                        this.spawnBalloonParticles(b.x, b.y, b.color);

                        if (b.type === 'life') {
                            if (this.lives < this.maxLives) {
                                this.lives = Math.min(this.maxLives, this.lives + 1);
                                this.updateHUD();
                                if (window.soundEngine) window.soundEngine.playBonus();
                                this.spawnFloatingText('+1 LIFE ❤️', b.x, b.y - 20, '#ff4081', 38);
                            } else {
                                this.score += 20;
                                this.updateHUD();
                                this.spawnFloatingText('+20 PTS ⭐', b.x, b.y - 20, '#ffea00', 38);
                            }
                        } else if (b.type === 'super_pan') {
                            this.superPanTimer = 10;
                            this.updateHUD();
                            if (window.soundEngine) window.soundEngine.playBonus();
                            this.spawnFloatingText('SUPER PAN 2X! 🍳', b.x, b.y - 20, '#ffea00', 38);
                        } else if (b.type === 'score') {
                            this.score += 25;
                            this.updateHUD();
                            if (window.soundEngine) window.soundEngine.playBonus();
                            this.spawnFloatingText('+25 BONUS! ⭐', b.x, b.y - 20, '#00e5ff', 38);
                        }

                        this.balloons.splice(i, 1);
                    }
                }

                // Check screen bounds (MISS)
                if (!hitEnemy && this.pan.state === 'THROWN') {
                    if (
                        this.pan.x < -60 ||
                        this.pan.x > V_WIDTH + 60 ||
                        this.pan.y < -60 ||
                        this.pan.y > V_HEIGHT + 60
                    ) {
                        this.onMiss();
                    }
                }
            } else if (this.pan.state === 'RETURNING') {
                // Fly back to orbit position
                const targetX = CENTER_X + Math.cos(this.pan.angle) * ORBIT_RADIUS;
                const targetY = CENTER_Y + Math.sin(this.pan.angle) * ORBIT_RADIUS;
                const dx = targetX - this.pan.x;
                const dy = targetY - this.pan.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < 50) {
                    this.pan.x = targetX;
                    this.pan.y = targetY;
                    this.pan.state = 'ORBIT';
                    this.pan.trail = [];
                } else {
                    const retSpeed = 1600;
                    this.pan.x += (dx / dist) * retSpeed * dt;
                    this.pan.y += (dy / dist) * retSpeed * dt;
                    this.pan.spinAngle += 15 * dt;
                }
            }

            // Decay pan trail
            this.pan.trail.forEach((t) => {
                t.alpha -= 3 * dt;
            });

            // ================= Enemies Logic =================
            // Enemy spawn scheduler
            if (this.activeEnemyIndex < 0) {
                this.enemySpawnTimer -= dt;
                if (this.enemySpawnTimer <= 0) {
                    // Pick a random enemy that is different from previous
                    const nextIdx = Math.floor(Math.random() * 8);
                    this.activeEnemyIndex = nextIdx;
                    const enemy = this.enemies[nextIdx];
                    enemy.active = true;
                    enemy.scale = 0;
                    // Active time scales with difficulty
                    enemy.maxActiveTimer = Math.max(1.8, 3.0 - (this.score / 120) * 0.6);
                    enemy.activeTimer = enemy.maxActiveTimer;

                    if (window.soundEngine) window.soundEngine.playAlert();
                }
            } else {
                const enemy = this.enemies[this.activeEnemyIndex];
                if (enemy.active) {
                    // Pop-up scale animation
                    if (enemy.scale < 1) {
                        enemy.scale = Math.min(1, enemy.scale + 6 * dt);
                    }

                    enemy.activeTimer -= dt;
                    if (enemy.activeTimer <= 0) {
                        // Enemy retreated without being hit
                        enemy.active = false;
                        this.activeEnemyIndex = -1;
                        this.enemySpawnTimer = 0.4;
                    }
                }
            }

            // Update all enemies visual transitions
            this.enemies.forEach((en) => {
                if (!en.active && en.scale > 0) {
                    en.scale = Math.max(0, en.scale - 5 * dt);
                }
                if (en.hitAnim > 0) {
                    en.hitAnim -= dt;
                }
            });

            // ================= Bonus Balloons Logic =================
            this.balloonSpawnTimer -= dt;
            if (this.balloonSpawnTimer <= 0) {
                this.spawnBonusBalloon();
                this.balloonSpawnTimer = 16 + Math.random() * 10;
            }

            for (let i = this.balloons.length - 1; i >= 0; i--) {
                const b = this.balloons[i];
                b.x += b.vx * dt;
                b.bobPhase += 2.5 * dt;
                b.y = b.baseY + Math.sin(b.bobPhase) * 16;

                // Remove when completely off screen
                if (b.vx > 0 && b.x > V_WIDTH + 100) {
                    this.balloons.splice(i, 1);
                } else if (b.vx < 0 && b.x < -100) {
                    this.balloons.splice(i, 1);
                }
            }

            // Granny eyes look towards pan or active enemy
            let targetAng = this.pan.angle;
            if (this.activeEnemyIndex >= 0) {
                targetAng = this.enemies[this.activeEnemyIndex].angle;
            }
            this.granny.eyeOffset.x = Math.cos(targetAng) * 4;
            this.granny.eyeOffset.y = Math.sin(targetAng) * 3;
        }

        // ==================== MAIN DRAW ====================
        draw() {
            this.ctx.save();

            // Clear screen
            this.ctx.fillStyle = '#f2be22';
            this.ctx.fillRect(0, 0, V_WIDTH, V_HEIGHT);

            // Screen shake offset
            if (this.shakeDuration > 0) {
                const s = this.shakeIntensity;
                const ox = (Math.random() * 2 - 1) * s;
                const oy = (Math.random() * 2 - 1) * s;
                this.ctx.translate(ox, oy);
            }

            // 1. Draw Background
            if (this.sprites.bg) {
                this.ctx.drawImage(this.sprites.bg, 0, 0, V_WIDTH, V_HEIGHT);
            }

            // 2. Draw Decorative 8-Spoke Wheel / Orbit Lines
            this.drawPlayFieldDecorations();

            // 3. Draw 8 Enemy Burrows & Enemies
            this.drawEnemies();

            // 4. Draw Grandma in Center
            this.drawGrandma();

            // 5. Draw Bonus Balloons
            this.drawBalloons();

            // 6. Draw Frying Pan
            this.drawPan();

            // 7. Draw Particles & Floating Texts
            this.drawEffects();

            this.ctx.restore();
        }

        drawPlayFieldDecorations() {
            this.ctx.save();

            // Draw original rat circle star sprite if available
            if (this.sprites.ratCircle) {
                this.ctx.save();
                this.ctx.globalAlpha = 0.55;
                this.ctx.drawImage(this.sprites.ratCircle, CENTER_X - 250, CENTER_Y - 250, 500, 500);
                this.ctx.restore();
            }

            // Outer ring connecting enemies
            this.ctx.strokeStyle = 'rgba(212, 143, 24, 0.35)';
            this.ctx.lineWidth = 4;
            this.ctx.setLineDash([8, 12]);
            this.ctx.beginPath();
            this.ctx.arc(CENTER_X, CENTER_Y, ENEMY_RADIUS, 0, Math.PI * 2);
            this.ctx.stroke();

            // Orbit path circle
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
            this.ctx.lineWidth = 3;
            this.ctx.setLineDash([6, 8]);
            this.ctx.beginPath();
            this.ctx.arc(CENTER_X, CENTER_Y, ORBIT_RADIUS, 0, Math.PI * 2);
            this.ctx.stroke();

            // Aiming guide dots from pan outward while in ORBIT
            if (this.pan.state === 'ORBIT') {
                this.ctx.save();
                this.ctx.strokeStyle = this.superPanTimer > 0 ? 'rgba(255, 235, 59, 0.65)' : 'rgba(255, 255, 255, 0.45)';
                this.ctx.lineWidth = 3;
                this.ctx.setLineDash([4, 8]);
                this.ctx.beginPath();
                this.ctx.moveTo(this.pan.x, this.pan.y);
                this.ctx.lineTo(
                    CENTER_X + Math.cos(this.pan.angle) * (ENEMY_RADIUS + 30),
                    CENTER_Y + Math.sin(this.pan.angle) * (ENEMY_RADIUS + 30)
                );
                this.ctx.stroke();
                this.ctx.restore();
            }

            this.ctx.restore();
        }

        drawEnemies() {
            this.enemies.forEach((enemy) => {
                this.ctx.save();
                this.ctx.translate(enemy.x, enemy.y);

                // Draw Burrow Mound (Hole)
                this.ctx.fillStyle = 'rgba(160, 100, 15, 0.28)';
                this.ctx.beginPath();
                this.ctx.ellipse(0, 28, 44, 20, 0, 0, Math.PI * 2);
                this.ctx.fill();

                this.ctx.fillStyle = 'rgba(90, 50, 10, 0.55)';
                this.ctx.beginPath();
                this.ctx.ellipse(0, 26, 36, 14, 0, 0, Math.PI * 2);
                this.ctx.fill();

                // If Active or Peeking
                if (enemy.active || enemy.scale > 0 || enemy.hitAnim > 0) {
                    const sc = enemy.scale;

                    // Active Target Pulse Indicator
                    if (enemy.active && sc > 0.8) {
                        const pulse = 1 + Math.sin(performance.now() * 0.01) * 0.12;
                        const timeLeftRatio = enemy.activeTimer / enemy.maxActiveTimer;

                        // Warning countdown arc
                        this.ctx.strokeStyle = timeLeftRatio > 0.3 ? '#ffeb3b' : '#ff3d00';
                        this.ctx.lineWidth = 6;
                        this.ctx.beginPath();
                        this.ctx.arc(0, 0, 52 * pulse, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * timeLeftRatio);
                        this.ctx.stroke();

                        // Glowing exclamation mark
                        this.ctx.fillStyle = '#ff1744';
                        this.ctx.font = 'bold 28px Arial, sans-serif';
                        this.ctx.textAlign = 'center';
                        this.ctx.fillText('!', 0, -56);
                    }

                    // Draw Enemy Sprite
                    if (this.sprites.enemy) {
                        this.ctx.scale(sc * 0.45, sc * 0.45);

                        // Flash white on hit
                        if (enemy.hitAnim > 0) {
                            this.ctx.filter = 'brightness(2.5) drop-shadow(0 0 10px white)';
                        }

                        // Centered origin (190 x 195)
                        this.ctx.drawImage(this.sprites.enemy, -95, -98);
                    }
                } else {
                    // Dormant silhouette / cute burrow marker
                    this.ctx.fillStyle = 'rgba(212, 143, 24, 0.5)';
                    this.ctx.beginPath();
                    this.ctx.arc(0, 12, 16, 0, Math.PI * 2);
                    this.ctx.fill();
                }

                this.ctx.restore();
            });
        }

        drawGrandma() {
            this.ctx.save();
            this.ctx.translate(this.granny.x, this.granny.y);

            // Shadow under Grandma
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
            this.ctx.beginPath();
            this.ctx.ellipse(0, 60, 48, 16, 0, 0, Math.PI * 2);
            this.ctx.fill();

            // Grandma head sprite (118 x 152), scaled to ~85x110
            if (this.sprites.grandma) {
                const drawW = 85;
                const drawH = 110;
                this.ctx.drawImage(this.sprites.grandma, -drawW / 2, -drawH / 2, drawW, drawH);
            }

            // Animated Eyes
            if (this.sprites.eye) {
                const ex = this.granny.eyeOffset.x;
                const ey = this.granny.eyeOffset.y;

                // Left Eye & Right Eye positions inside glasses
                this.ctx.drawImage(this.sprites.eye, -18 + ex, -6 + ey, 9, 11);
                this.ctx.drawImage(this.sprites.eye, 9 + ex, -6 + ey, 9, 11);
            }

            // Facial expression overlays (happy mouth or shocked mouth)
            if (this.granny.faceState === 'happy') {
                this.ctx.fillStyle = '#d32f2f';
                this.ctx.beginPath();
                this.ctx.arc(0, 18, 9, 0, Math.PI);
                this.ctx.fill();
            } else if (this.granny.faceState === 'shocked') {
                this.ctx.fillStyle = '#5d4037';
                this.ctx.beginPath();
                this.ctx.ellipse(0, 20, 7, 10, 0, 0, Math.PI * 2);
                this.ctx.fill();
            }

            this.ctx.restore();
        }

        drawPan() {
            // Draw motion trail
            if (this.pan.state === 'THROWN' && this.pan.trail.length > 0) {
                for (let i = 0; i < this.pan.trail.length; i++) {
                    const t = this.pan.trail[i];
                    if (t.alpha <= 0) continue;
                    this.ctx.save();
                    this.ctx.translate(t.x, t.y);
                    this.ctx.fillStyle = this.superPanTimer > 0 
                        ? `rgba(255, 235, 59, ${t.alpha * 0.7})` 
                        : `rgba(255, 255, 255, ${t.alpha * 0.5})`;
                    this.ctx.beginPath();
                    this.ctx.arc(0, 0, 18 * (i / this.pan.trail.length), 0, Math.PI * 2);
                    this.ctx.fill();
                    this.ctx.restore();
                }
            }

            this.ctx.save();
            this.ctx.translate(this.pan.x, this.pan.y);

            // Rotation angle
            let rot = this.pan.spinAngle;
            if (this.pan.state === 'ORBIT') {
                // Pan faces outward while orbiting
                rot = this.pan.angle + Math.PI / 2;
            }
            this.ctx.rotate(rot);

            // Super Pan Glow
            if (this.superPanTimer > 0) {
                this.ctx.shadowColor = '#ffe600';
                this.ctx.shadowBlur = 18;
            } else {
                this.ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
                this.ctx.shadowBlur = 8;
                this.ctx.shadowOffsetY = 4;
            }

            // Draw Pan Sprite (224 x 142), scaled to ~72 x 46
            if (this.sprites.fryPan) {
                const pw = 74;
                const ph = 47;
                this.ctx.drawImage(this.sprites.fryPan, -pw / 2, -ph / 2, pw, ph);
            } else {
                // Fallback procedural frying pan
                this.ctx.fillStyle = '#212121';
                this.ctx.beginPath();
                this.ctx.arc(0, 0, 24, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.fillStyle = '#424242';
                this.ctx.fillRect(20, -4, 28, 8);
            }

            this.ctx.restore();
        }

        drawBalloons() {
            this.balloons.forEach((b) => {
                this.ctx.save();
                this.ctx.translate(b.x, b.y);

                // String hanging down
                this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
                this.ctx.lineWidth = 2;
                this.ctx.beginPath();
                this.ctx.moveTo(0, 32);
                this.ctx.quadraticCurveTo(8, 48, 0, 68);
                this.ctx.stroke();

                // Hanging Item Basket / Bubble
                this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
                this.ctx.beginPath();
                this.ctx.arc(0, 78, 22, 0, Math.PI * 2);
                this.ctx.fill();

                // Item Icon inside basket
                this.ctx.font = '24px Arial, sans-serif';
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                if (b.type === 'life') {
                    this.ctx.fillText('❤️', 0, 79);
                } else if (b.type === 'super_pan') {
                    this.ctx.fillText('🍳', 0, 79);
                } else {
                    this.ctx.fillText('⭐', 0, 79);
                }

                // Balloon Body with 3D spherical gradient
                const grad = this.ctx.createRadialGradient(-10, -10, 4, 0, 0, 36);
                grad.addColorStop(0, '#ffffff');
                grad.addColorStop(0.35, b.color);
                grad.addColorStop(1, '#9c0030');

                this.ctx.fillStyle = grad;
                this.ctx.beginPath();
                this.ctx.ellipse(0, 0, 32, 38, 0, 0, Math.PI * 2);
                this.ctx.fill();

                // Balloon Knot
                this.ctx.fillStyle = b.color;
                this.ctx.beginPath();
                this.ctx.moveTo(-6, 38);
                this.ctx.lineTo(6, 38);
                this.ctx.lineTo(0, 44);
                this.ctx.closePath();
                this.ctx.fill();

                this.ctx.restore();
            });
        }

        drawEffects() {
            // Draw Particles
            this.particles.forEach((p) => {
                this.ctx.save();
                this.ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
                this.ctx.fillStyle = p.color;

                if (p.shape === 'star') {
                    this.ctx.translate(p.x, p.y);
                    this.ctx.beginPath();
                    for (let i = 0; i < 5; i++) {
                        this.ctx.lineTo(Math.cos(((18 + i * 72) * Math.PI) / 180) * p.size, -Math.sin(((18 + i * 72) * Math.PI) / 180) * p.size);
                        this.ctx.lineTo(Math.cos(((54 + i * 72) * Math.PI) / 180) * (p.size / 2), -Math.sin(((54 + i * 72) * Math.PI) / 180) * (p.size / 2));
                    }
                    this.ctx.closePath();
                    this.ctx.fill();
                } else if (p.shape === 'confetti') {
                    this.ctx.translate(p.x, p.y);
                    this.ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 1.5);
                } else {
                    this.ctx.beginPath();
                    this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                    this.ctx.fill();
                }
                this.ctx.restore();
            });

            // Draw Floating Texts
            this.floatingTexts.forEach((ft) => {
                this.ctx.save();
                this.ctx.globalAlpha = ft.alpha;
                this.ctx.font = `900 ${ft.size}px 'Arial Rounded MT Bold', -apple-system, sans-serif`;
                this.ctx.textAlign = 'center';

                // Thick stroke for readability
                this.ctx.strokeStyle = '#000000';
                this.ctx.lineWidth = 6;
                this.ctx.strokeText(ft.text, ft.x, ft.y);

                this.ctx.fillStyle = ft.color;
                this.ctx.fillText(ft.text, ft.x, ft.y);
                this.ctx.restore();
            });
        }

        // ==================== GAME LOOP ====================
        loop(ts) {
            const dt = (ts - this.lastTime) / 1000;
            this.lastTime = ts;

            this.update(dt);
            this.draw();

            requestAnimationFrame((ts) => this.loop(ts));
        }
    }

    // Initialize once DOM is ready
    window.addEventListener('DOMContentLoaded', () => {
        window.grannyHero = new GrannyHeroGame();
    });
})();
