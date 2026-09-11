/**
 * Cyberpunk Bricks Breaker - 100 Levels Edition
 * Resolution: 1080 x 1920 Native Canvas
 * Visuals matching demo.jpg
 */

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const CANVAS_WIDTH = 1080;
const CANVAS_HEIGHT = 1920;

// Game States
const STATE = {
    MENU: 'MENU',
    LEVEL_SELECT: 'LEVEL_SELECT',
    READY: 'READY',
    PLAYING: 'PLAYING',
    PAUSED: 'PAUSED',
    LEVEL_COMPLETE: 'LEVEL_COMPLETE',
    GAME_OVER: 'GAME_OVER'
};

// Colors Palette matching demo.jpg
const PALETTE = {
    cyan: '#00f0ff',
    cyanDark: '#008ba3',
    cyanGlow: 'rgba(0, 240, 255, 0.8)',
    frameBg: '#08051a',
    gridLine: 'rgba(95, 45, 175, 0.4)',
    gridFloor: 'rgba(147, 51, 234, 0.55)',
    gold: '#ffe600',
    goldDark: '#ff9900',
    goldGlow: 'rgba(255, 180, 0, 0.9)',
    white: '#ffffff',
    heartRed: '#ff2247',
    heartDim: '#3a0c18'
};

class Game {
    constructor() {
        this.state = STATE.MENU;
        this.score = 0;
        this.level = 1;
        this.lives = 3;
        this.unlockedLevel = parseInt(localStorage.getItem('bricks_breaker_unlocked') || '1', 10);
        this.highScore = parseInt(localStorage.getItem('bricks_breaker_high') || '0', 10);
        this.combo = 0;
        this.lastTime = 0;
        this.screenShake = 0;
        this.currentTab = 0;

        // Playable area boundaries inside the cyan sci-fi frame
        this.bounds = {
            left: 56,
            right: CANVAS_WIDTH - 56,
            top: 156,
            bottom: CANVAS_HEIGHT - 60
        };

        // Paddle definition
        this.paddle = {
            width: 220,
            baseWidth: 220,
            height: 36,
            x: (CANVAS_WIDTH - 220) / 2,
            y: 1680,
            speed: 0,
            targetX: (CANVAS_WIDTH - 220) / 2,
            laserActive: false,
            laserTimer: 0
        };

        // Balls array (supports multi-ball powerups)
        this.balls = [];

        // Bricks array
        this.bricks = [];
        this.brickTextures = {};

        // Particles & Floaters
        this.particles = [];
        this.floatingTexts = [];
        this.powerups = [];
        this.lasers = [];

        // Touch & Drag Handling
        this.isDragging = false;
        this.dragStartX = 0;
        this.paddleStartX = 0;

        // Initialize systems
        this.generateBrickTextures();
        this.updateHomeStats();
        this.initLevel(this.unlockedLevel);
        this.resetBallOnPaddle();
        this.bindEvents();

        // Start animation loop
        requestAnimationFrame(this.loop.bind(this));
    }

    // Pre-render pixelated retro brick textures with mortar lines matching demo.jpg
    generateBrickTextures() {
        const types = [
            {
                id: 'blue',
                face: '#0284c7',
                highlight: '#38bdf8',
                shadow: '#03436a',
                mortar: '#001830',
                accent: '#7dd3fc'
            },
            {
                id: 'yellow',
                face: '#eab308',
                highlight: '#fef08a',
                shadow: '#854d0e',
                mortar: '#422006',
                accent: '#facc15'
            },
            {
                id: 'red',
                face: '#dc2626',
                highlight: '#fca5a5',
                shadow: '#7f1d1d',
                mortar: '#450a0a',
                accent: '#ef4444'
            }
        ];

        const w = 122;
        const h = 54;

        types.forEach(type => {
            const off = document.createElement('canvas');
            off.width = w;
            off.height = h;
            const octx = off.getContext('2d');

            // Outer shadow / bevel
            octx.fillStyle = type.shadow;
            octx.fillRect(0, 0, w, h);

            // Mortar background
            octx.fillStyle = type.mortar;
            octx.fillRect(2, 2, w - 4, h - 4);

            // Row 1 (Top mini-bricks)
            const rowH = Math.floor((h - 8) / 2);
            const r1 = [
                { x: 4, w: 32 },
                { x: 38, w: 46 },
                { x: 86, w: 32 }
            ];
            r1.forEach(b => {
                octx.fillStyle = type.face;
                octx.fillRect(b.x, 4, b.w, rowH);
                octx.fillStyle = type.highlight;
                octx.fillRect(b.x, 4, b.w, 3);
                octx.fillRect(b.x, 4, 3, rowH);
                octx.fillStyle = type.shadow;
                octx.fillRect(b.x, 4 + rowH - 3, b.w, 3);
                octx.fillRect(b.x + b.w - 3, 4, 3, rowH);
            });

            // Row 2 (Bottom mini-bricks, staggered offset)
            const y2 = 4 + rowH + 2;
            const r2 = [
                { x: 4, w: 54 },
                { x: 60, w: 58 }
            ];
            r2.forEach(b => {
                octx.fillStyle = type.face;
                octx.fillRect(b.x, y2, b.w, rowH);
                octx.fillStyle = type.highlight;
                octx.fillRect(b.x, y2, b.w, 3);
                octx.fillRect(b.x, y2, 3, rowH);
                octx.fillStyle = type.shadow;
                octx.fillRect(b.x, y2 + rowH - 3, b.w, 3);
                octx.fillRect(b.x + b.w - 3, y2, 3, rowH);
            });

            // Outer highlight border
            octx.fillStyle = type.highlight;
            octx.fillRect(0, 0, w, 3);
            octx.fillRect(0, 0, 3, h);

            this.brickTextures[type.id] = off;
        });
    }

    // 100-Level Architecture: Easy to Hard
    initLevel(lvl) {
        this.level = Math.max(1, Math.min(100, lvl));
        this.bricks = [];
        this.combo = 0;

        const cols = 7;
        const brickW = 122;
        const brickH = 54;
        const gapX = 14;
        const gapY = 16;
        const totalW = cols * brickW + (cols - 1) * gapX;
        const startX = (CANVAS_WIDTH - totalW) / 2;
        const startY = 440;

        if (this.level === 1) {
            /**
             * Level 1: Exact layout from demo.jpg
             * Row 0: 7 Blue bricks across (15 pts)
             * Row 1: 3 Yellow bricks centered (10 pts)
             * Row 2: 3 Red bricks left, 1 gap, 2 Red bricks right (5 pts)
             */
            const layout = [
                // Row 0: Blue (7 bricks)
                [
                    { t: 'blue', hp: 2, pts: 15 },
                    { t: 'blue', hp: 2, pts: 15 },
                    { t: 'blue', hp: 2, pts: 15 },
                    { t: 'blue', hp: 2, pts: 15 },
                    { t: 'blue', hp: 2, pts: 15 },
                    { t: 'blue', hp: 2, pts: 15 },
                    { t: 'blue', hp: 2, pts: 15 }
                ],
                // Row 1: Yellow (middle 3)
                [
                    null,
                    null,
                    { t: 'yellow', hp: 2, pts: 10 },
                    { t: 'yellow', hp: 2, pts: 10 },
                    { t: 'yellow', hp: 2, pts: 10 },
                    null,
                    null
                ],
                // Row 2: Red (3 left, 1 gap, 2 right)
                [
                    { t: 'red', hp: 1, pts: 5 },
                    { t: 'red', hp: 1, pts: 5 },
                    { t: 'red', hp: 1, pts: 5 },
                    null,
                    { t: 'red', hp: 1, pts: 5 },
                    { t: 'red', hp: 1, pts: 5 },
                    null
                ]
            ];

            layout.forEach((row, rIdx) => {
                row.forEach((item, cIdx) => {
                    if (item) {
                        this.bricks.push({
                            x: startX + cIdx * (brickW + gapX),
                            y: startY + rIdx * (brickH + gapY),
                            width: brickW,
                            height: brickH,
                            type: item.t,
                            hp: item.hp,
                            maxHp: item.hp,
                            points: item.pts,
                            shake: 0,
                            flash: 0
                        });
                    }
                });
            });
        } else {
            /**
             * Levels 2 to 100: Deterministic Procedural Arcade Generator
             * Difficulty scales across 5 tiers:
             * - Novice (Levels 2-10): 3-4 rows, soft patterns
             * - Intermediate (Levels 11-25): 4-5 rows, geometric shapes
             * - Advanced (Levels 26-50): 5-6 rows, fortified lines
             * - Expert (Levels 51-75): 6-7 rows, tactical shields
             * - Cyber Master (Levels 76-100): 7 rows, dense fortress
             */
            const rows = Math.min(3 + Math.floor((this.level - 1) / 16), 7);
            const templateId = (this.level * 7 + 3) % 8;

            // Difficulty bias towards higher HP bricks as level increases
            const yellowChance = Math.min(0.25 + this.level * 0.005, 0.55);
            const blueChance = Math.min(0.1 + this.level * 0.006, 0.45);

            for (let r = 0; r < rows; r++) {
                // Compute row symmetry half
                for (let c = 0; c <= 3; c++) {
                    let hasBrick = false;

                    switch (templateId) {
                        case 0: // Pyramid / Mountain
                            hasBrick = c >= (rows - 1 - r);
                            break;
                        case 1: // Inverted V / Chevron
                            hasBrick = (r + c) % 2 === 0 || r === 0;
                            break;
                        case 2: // Diamond / Rhombus
                            const midRow = Math.floor(rows / 2);
                            hasBrick = Math.abs(r - midRow) + (3 - c) <= 3;
                            break;
                        case 3: // Castle Fortress (towers on side, arch in middle)
                            hasBrick = c <= 1 || r === 0 || (r >= 2 && c === 3);
                            break;
                        case 4: // Checkerboard Cyber Matrix
                            hasBrick = (r + c + Math.floor(this.level / 5)) % 2 === 0;
                            break;
                        case 5: // Double Pillars & Header
                            hasBrick = r === 0 || c === 0 || c === 2;
                            break;
                        case 6: // Concentric Frame / Box
                            hasBrick = r === 0 || r === rows - 1 || c === 0 || (r === 2 && c === 2);
                            break;
                        case 7: // Alien Invader / Face
                        default:
                            hasBrick = (r === 0) || (r === 1 && c !== 1) || (r === 2 && c !== 0) || (r === 3 && c === 1);
                            break;
                    }

                    // Fallback to guarantee minimum bricks per row
                    if (r === 0 && !hasBrick) hasBrick = true;

                    if (hasBrick) {
                        // Determine brick color/type deterministically per level
                        const seed = (r * 11 + c * 17 + this.level * 23) % 100 / 100;
                        let type = 'red';
                        let hp = 1;
                        let pts = 5;

                        if (seed < blueChance && (r <= 1 || this.level > 40)) {
                            type = 'blue';
                            hp = 2;
                            pts = 15;
                        } else if (seed < blueChance + yellowChance || r < 3) {
                            type = 'yellow';
                            hp = 2;
                            pts = 10;
                        }

                        // Add left / center brick
                        this.bricks.push({
                            x: startX + c * (brickW + gapX),
                            y: startY + r * (brickH + gapY),
                            width: brickW,
                            height: brickH,
                            type,
                            hp,
                            maxHp: hp,
                            points: pts,
                            shake: 0,
                            flash: 0
                        });

                        // Mirror right side (if not center column 3)
                        if (c < 3) {
                            const mirrorC = 6 - c;
                            this.bricks.push({
                                x: startX + mirrorC * (brickW + gapX),
                                y: startY + r * (brickH + gapY),
                                width: brickW,
                                height: brickH,
                                type,
                                hp,
                                maxHp: hp,
                                points: pts,
                                shake: 0,
                                flash: 0
                            });
                        }
                    }
                }
            }
        }
    }

    resetBallOnPaddle() {
        // Base speed scales smoothly with level
        const baseSpeed = Math.min(14.5 + (this.level - 1) * 0.04, 18.0);
        this.balls = [{
            x: this.paddle.x + this.paddle.width / 2,
            y: this.paddle.y - 18,
            radius: 17,
            vx: 0,
            vy: 0,
            speed: baseSpeed,
            trail: [],
            isMain: true
        }];

        const hint = document.getElementById('launch-hint');
        if (hint) {
            hint.textContent = 'TAP / DRAG TO LAUNCH';
            if (this.state === STATE.READY) hint.style.display = 'block';
            else hint.style.display = 'none';
        }
    }

    launchBall() {
        if (this.state !== STATE.READY) return;
        this.state = STATE.PLAYING;
        const hint = document.getElementById('launch-hint');
        if (hint) hint.style.display = 'none';

        if (window.sounds) {
            window.sounds.init();
        }

        // Launch upwards with a dynamic initial angle (-70 to -110 deg)
        const angle = -Math.PI / 2 + (Math.random() * 0.4 - 0.2);
        this.balls.forEach(b => {
            b.vx = Math.cos(angle) * b.speed;
            b.vy = Math.sin(angle) * b.speed;
        });

        if (window.sounds) {
            window.sounds.playPaddleHit();
        }
    }

    updateHomeStats() {
        const lvlEl = document.getElementById('home-unlocked-level');
        const highEl = document.getElementById('home-high-score');
        if (lvlEl) lvlEl.textContent = `${this.unlockedLevel} / 100`;
        if (highEl) highEl.textContent = this.highScore.toString();
    }

    showHomeMenu() {
        this.state = STATE.MENU;
        this.updateHomeStats();
        this.closeAllModals();
        document.getElementById('home-menu').classList.add('active');
        const hint = document.getElementById('launch-hint');
        if (hint) hint.style.display = 'none';
    }

    startSelectedLevel(lvl) {
        this.closeAllModals();
        document.getElementById('home-menu').classList.remove('active');
        this.level = lvl;
        this.lives = 3;
        this.powerups = [];
        this.lasers = [];
        this.paddle.width = this.paddle.baseWidth;
        this.paddle.laserActive = false;
        this.initLevel(this.level);
        this.resetBallOnPaddle();
        this.state = STATE.READY;

        const hint = document.getElementById('launch-hint');
        if (hint) hint.style.display = 'block';

        if (window.sounds) window.sounds.playClick();
    }

    openLevelSelect() {
        this.currentTab = Math.min(Math.floor((this.level - 1) / 25), 3);
        this.updateTabButtons();
        this.renderLevelGrid();
        document.getElementById('level-select-modal').classList.add('active');
        if (window.sounds) window.sounds.playClick();
    }

    closeLevelSelect() {
        document.getElementById('level-select-modal').classList.remove('active');
        if (window.sounds) window.sounds.playClick();
    }

    updateTabButtons() {
        const tabs = document.querySelectorAll('.level-tabs .tab-btn');
        tabs.forEach((tab, idx) => {
            if (idx === this.currentTab) tab.classList.add('active');
            else tab.classList.remove('active');
        });
    }

    renderLevelGrid() {
        const container = document.getElementById('level-grid');
        if (!container) return;
        container.innerHTML = '';

        const start = this.currentTab * 25 + 1;
        const end = start + 24;

        for (let i = start; i <= end; i++) {
            const btn = document.createElement('button');
            btn.className = 'level-tile';

            if (i < this.unlockedLevel) {
                btn.classList.add('unlocked');
                btn.innerHTML = `<span>${i}</span>`;
                btn.addEventListener('click', () => {
                    this.startSelectedLevel(i);
                });
            } else if (i === this.unlockedLevel) {
                btn.classList.add('unlocked', 'current');
                btn.innerHTML = `<span>${i}</span>`;
                btn.addEventListener('click', () => {
                    this.startSelectedLevel(i);
                });
            } else {
                btn.classList.add('locked');
                btn.innerHTML = `<span class="lock-icon">🔒</span>`;
            }

            container.appendChild(btn);
        }
    }

    closeAllModals() {
        document.getElementById('pause-modal').classList.remove('active');
        document.getElementById('level-select-modal').classList.remove('active');
        document.getElementById('victory-modal').classList.remove('active');
        document.getElementById('gameover-modal').classList.remove('active');
        document.getElementById('settings-modal').classList.remove('active');
    }

    bindEvents() {
        // Pointer down: audio unlock + launch or drag
        canvas.addEventListener('pointerdown', (e) => {
            if (window.sounds) window.sounds.init();

            const pos = this.getEventCanvasPos(e);

            if (this.state === STATE.MENU) return;

            // Top HUD buttons touch detection
            if (this.checkHudClick(pos.x, pos.y)) return;

            if (this.state === STATE.READY) {
                this.launchBall();
            }

            this.isDragging = true;
            this.dragStartX = pos.x;
            this.paddleStartX = this.paddle.x;

            try {
                canvas.setPointerCapture(e.pointerId);
            } catch (err) {}

            if (pos.y > 1400) {
                this.setPaddleTarget(pos.x);
            }
        });

        canvas.addEventListener('pointermove', (e) => {
            if (this.state === STATE.MENU) return;
            const pos = this.getEventCanvasPos(e);

            if (this.isDragging) {
                if (pos.y > 1400) {
                    this.setPaddleTarget(pos.x);
                } else {
                    const deltaX = pos.x - this.dragStartX;
                    this.paddle.targetX = Math.max(this.bounds.left, Math.min(this.bounds.right - this.paddle.width, this.paddleStartX + deltaX));
                }
            } else if (e.pointerType === 'mouse' && (this.state === STATE.PLAYING || this.state === STATE.READY)) {
                this.setPaddleTarget(pos.x);
            }
        });

        const releasePointer = (e) => {
            this.isDragging = false;
            try {
                canvas.releasePointerCapture(e.pointerId);
            } catch (err) {}
        };

        canvas.addEventListener('pointerup', releasePointer);
        canvas.addEventListener('pointercancel', releasePointer);

        // Keyboard support
        window.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                if (this.state === STATE.READY) {
                    this.launchBall();
                } else if (this.paddle.laserActive && this.state === STATE.PLAYING) {
                    this.fireLasers();
                }
            } else if (e.code === 'KeyP' || e.code === 'Escape') {
                this.togglePause();
            } else if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
                this.paddle.targetX = Math.max(this.bounds.left, this.paddle.x - 50);
            } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
                this.paddle.targetX = Math.min(this.bounds.right - this.paddle.width, this.paddle.x + 50);
            }
        });

        // Home Menu buttons
        document.getElementById('tap-to-play-btn').addEventListener('click', () => {
            this.startSelectedLevel(this.unlockedLevel);
        });
        document.getElementById('home-level-select-btn').addEventListener('click', () => {
            this.openLevelSelect();
        });
        document.getElementById('home-settings-btn').addEventListener('click', () => {
            this.openSettings();
        });

        // Level Select Modal
        document.getElementById('close-level-select-btn').addEventListener('click', () => {
            this.closeLevelSelect();
        });
        document.querySelectorAll('.level-tabs .tab-btn').forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.currentTab = parseInt(e.target.getAttribute('data-tab'), 10);
                this.updateTabButtons();
                this.renderLevelGrid();
                if (window.sounds) window.sounds.playClick();
            });
        });

        // HUD overlay touch zones
        document.getElementById('pause-btn-zone').addEventListener('click', () => this.pauseGame());
        document.getElementById('settings-btn-zone').addEventListener('click', () => this.openSettings());

        // Pause Modal buttons
        document.getElementById('resume-btn').addEventListener('click', () => this.resumeGame());
        document.getElementById('restart-pause-btn').addEventListener('click', () => this.restartGame());
        document.getElementById('pause-level-select-btn').addEventListener('click', () => {
            document.getElementById('pause-modal').classList.remove('active');
            this.openLevelSelect();
        });
        document.getElementById('settings-pause-btn').addEventListener('click', () => this.openSettings());
        document.getElementById('pause-home-btn').addEventListener('click', () => this.showHomeMenu());

        // Settings Modal
        document.getElementById('close-settings-btn').addEventListener('click', () => this.closeSettings());
        document.getElementById('sound-toggle').addEventListener('change', (e) => {
            if (window.sounds) window.sounds.soundEnabled = e.target.checked;
        });
        document.getElementById('music-toggle').addEventListener('change', (e) => {
            if (window.sounds) {
                window.sounds.musicEnabled = e.target.checked;
                if (e.target.checked) window.sounds.startMusic();
                else window.sounds.stopMusic();
            }
        });

        // Victory Modal buttons
        document.getElementById('next-level-btn').addEventListener('click', () => this.nextLevel());
        document.getElementById('victory-select-btn').addEventListener('click', () => {
            document.getElementById('victory-modal').classList.remove('active');
            this.openLevelSelect();
        });
        document.getElementById('replay-level-btn').addEventListener('click', () => this.restartGame());
        document.getElementById('victory-home-btn').addEventListener('click', () => this.showHomeMenu());

        // Game Over Modal buttons
        document.getElementById('retry-btn').addEventListener('click', () => this.restartGame());
        document.getElementById('gameover-select-btn').addEventListener('click', () => {
            document.getElementById('gameover-modal').classList.remove('active');
            this.openLevelSelect();
        });
        document.getElementById('gameover-home-btn').addEventListener('click', () => this.showHomeMenu());
    }

    getEventCanvasPos(e) {
        const rect = canvas.getBoundingClientRect();
        const scaleX = CANVAS_WIDTH / rect.width;
        const scaleY = CANVAS_HEIGHT / rect.height;
        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY
        };
    }

    setPaddleTarget(canvasX) {
        this.paddle.targetX = canvasX - this.paddle.width / 2;
        this.paddle.targetX = Math.max(this.bounds.left, Math.min(this.bounds.right - this.paddle.width, this.paddle.targetX));
    }

    checkHudClick(x, y) {
        // Pause icon zone (left): center at (98, 114)
        if (x >= 65 && x <= 130 && y >= 80 && y <= 148) {
            this.pauseGame();
            return true;
        }
        // Settings gear zone (left): center at (175, 114)
        if (x >= 145 && x <= 208 && y >= 80 && y <= 148) {
            this.openSettings();
            return true;
        }
        return false;
    }

    pauseGame() {
        if (this.state !== STATE.PLAYING && this.state !== STATE.READY) return;
        this.state = STATE.PAUSED;
        document.getElementById('pause-score').textContent = this.score;
        document.getElementById('pause-level').textContent = this.level;
        document.getElementById('pause-modal').classList.add('active');
        if (window.sounds) window.sounds.playClick();
    }

    resumeGame() {
        if (this.state !== STATE.PAUSED) return;
        document.getElementById('pause-modal').classList.remove('active');
        this.state = this.balls[0] && this.balls[0].vx === 0 ? STATE.READY : STATE.PLAYING;
        if (window.sounds) window.sounds.playClick();
    }

    togglePause() {
        if (this.state === STATE.PAUSED) this.resumeGame();
        else if (this.state === STATE.PLAYING) this.pauseGame();
    }

    openSettings() {
        document.getElementById('settings-modal').classList.add('active');
        if (window.sounds) window.sounds.playClick();
    }

    closeSettings() {
        document.getElementById('settings-modal').classList.remove('active');
        if (window.sounds) window.sounds.playClick();
    }

    restartGame() {
        this.closeAllModals();
        this.lives = 3;
        this.powerups = [];
        this.lasers = [];
        this.paddle.width = this.paddle.baseWidth;
        this.paddle.laserActive = false;
        this.initLevel(this.level);
        this.resetBallOnPaddle();
        this.state = STATE.READY;
        if (window.sounds) window.sounds.playClick();
    }

    nextLevel() {
        document.getElementById('victory-modal').classList.remove('active');
        if (this.level < 100) {
            this.level++;
        }
        this.lives = 3;
        this.powerups = [];
        this.lasers = [];
        this.paddle.width = this.paddle.baseWidth;
        this.paddle.laserActive = false;
        this.initLevel(this.level);
        this.resetBallOnPaddle();
        this.state = STATE.READY;
        if (window.sounds) window.sounds.playClick();
    }

    gameOver() {
        this.state = STATE.GAME_OVER;
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('bricks_breaker_high', this.highScore.toString());
        }
        document.getElementById('gameover-score').textContent = this.score;
        document.getElementById('gameover-high').textContent = this.highScore;
        document.getElementById('gameover-modal').classList.add('active');
        if (window.sounds) window.sounds.playGameOver();
    }

    levelWon() {
        this.state = STATE.LEVEL_COMPLETE;

        // Unlock next level if currently on highest reached
        if (this.level >= this.unlockedLevel && this.unlockedLevel < 100) {
            this.unlockedLevel = this.level + 1;
            localStorage.setItem('bricks_breaker_unlocked', this.unlockedLevel.toString());
            this.updateHomeStats();
        }

        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('bricks_breaker_high', this.highScore.toString());
        }

        document.getElementById('victory-score').textContent = this.score;
        document.getElementById('victory-high').textContent = this.highScore;
        
        // Hide NEXT STAGE button if Level 100 is completed
        const nextBtn = document.getElementById('next-level-btn');
        if (nextBtn) {
            if (this.level >= 100) {
                nextBtn.style.display = 'none';
            } else {
                nextBtn.style.display = 'block';
                nextBtn.textContent = `NEXT STAGE (LVL ${this.level + 1})`;
            }
        }

        document.getElementById('victory-modal').classList.add('active');
        if (window.sounds) window.sounds.playVictory();
    }

    // Main Game Loop
    loop(timestamp) {
        const dt = Math.min((timestamp - this.lastTime) / 1000, 0.1);
        this.lastTime = timestamp;

        this.update(dt);
        this.render();

        requestAnimationFrame(this.loop.bind(this));
    }

    update(dt) {
        if (this.state === STATE.PAUSED || this.state === STATE.MENU) return;

        // Smooth paddle interpolation
        this.paddle.x += (this.paddle.targetX - this.paddle.x) * 0.28;
        this.paddle.x = Math.max(this.bounds.left, Math.min(this.bounds.right - this.paddle.width, this.paddle.x));

        // Screen shake decay
        if (this.screenShake > 0) {
            this.screenShake -= dt * 30;
            if (this.screenShake < 0) this.screenShake = 0;
        }

        // If ready state, keep ball resting on paddle
        if (this.state === STATE.READY) {
            if (this.balls.length > 0) {
                this.balls[0].x = this.paddle.x + this.paddle.width / 2;
                this.balls[0].y = this.paddle.y - this.balls[0].radius - 1;
            }
            return;
        }

        if (this.state !== STATE.PLAYING) return;

        // Update balls
        for (let i = this.balls.length - 1; i >= 0; i--) {
            const ball = this.balls[i];

            // Motion trail recording
            ball.trail.push({ x: ball.x, y: ball.y, time: Date.now() });
            if (ball.trail.length > 14) {
                ball.trail.shift();
            }

            // Ball physics update
            ball.x += ball.vx;
            ball.y += ball.vy;

            // Left Wall bounce
            if (ball.x - ball.radius <= this.bounds.left) {
                ball.x = this.bounds.left + ball.radius;
                ball.vx = Math.abs(ball.vx);
                if (window.sounds) window.sounds.playWallHit();
                this.spawnSpark(ball.x, ball.y, PALETTE.cyan);
            }
            // Right Wall bounce
            if (ball.x + ball.radius >= this.bounds.right) {
                ball.x = this.bounds.right - ball.radius;
                ball.vx = -Math.abs(ball.vx);
                if (window.sounds) window.sounds.playWallHit();
                this.spawnSpark(ball.x, ball.y, PALETTE.cyan);
            }
            // Top Wall bounce
            if (ball.y - ball.radius <= this.bounds.top) {
                ball.y = this.bounds.top + ball.radius;
                ball.vy = Math.abs(ball.vy);
                if (window.sounds) window.sounds.playWallHit();
                this.spawnSpark(ball.x, ball.y, PALETTE.cyan);
            }

            // Prevent horizontal ball trap
            if (Math.abs(ball.vy) < 2.5) {
                ball.vy = (ball.vy >= 0 ? 1 : -1) * 3.0;
            }

            // Paddle collision
            if (
                ball.vy > 0 &&
                ball.y + ball.radius >= this.paddle.y &&
                ball.y - ball.radius <= this.paddle.y + this.paddle.height &&
                ball.x + ball.radius >= this.paddle.x &&
                ball.x - ball.radius <= this.paddle.x + this.paddle.width
            ) {
                const hitOffset = (ball.x - (this.paddle.x + this.paddle.width / 2)) / (this.paddle.width / 2);
                const maxAngle = (70 * Math.PI) / 180;
                const bounceAngle = hitOffset * maxAngle;

                const currentSpeed = Math.min(ball.speed + 0.1, 21);
                ball.speed = currentSpeed;
                ball.vx = currentSpeed * Math.sin(bounceAngle);
                ball.vy = -currentSpeed * Math.cos(bounceAngle);
                ball.y = this.paddle.y - ball.radius - 1;

                this.combo = 0;
                if (window.sounds) window.sounds.playPaddleHit();
                this.spawnPaddleParticles(ball.x, this.paddle.y);
            }

            // Brick collision
            for (let b = this.bricks.length - 1; b >= 0; b--) {
                const brick = this.bricks[b];
                if (this.checkBallBrickCollision(ball, brick)) {
                    this.handleBrickHit(brick, b, ball);
                    break;
                }
            }

            // Bottom Boundary: Ball Lost
            if (ball.y - ball.radius > this.bounds.bottom) {
                this.balls.splice(i, 1);
            }
        }

        // Check if all balls lost
        if (this.balls.length === 0) {
            this.lives--;
            this.combo = 0;
            if (window.sounds) window.sounds.playLifeLost();

            if (this.lives <= 0) {
                this.gameOver();
            } else {
                this.resetBallOnPaddle();
            }
        }

        // Check if all bricks destroyed
        if (this.bricks.length === 0) {
            this.levelWon();
        }

        // Update powerups, lasers, particles
        this.updatePowerups(dt);
        this.updateLasers(dt);
        this.updateParticles(dt);
    }

    checkBallBrickCollision(ball, brick) {
        const nearestX = Math.max(brick.x, Math.min(ball.x, brick.x + brick.width));
        const nearestY = Math.max(brick.y, Math.min(ball.y, brick.y + brick.height));

        const dx = ball.x - nearestX;
        const dy = ball.y - nearestY;

        if (dx * dx + dy * dy < ball.radius * ball.radius) {
            const overlapX = (brick.width / 2 + ball.radius) - Math.abs(ball.x - (brick.x + brick.width / 2));
            const overlapY = (brick.height / 2 + ball.radius) - Math.abs(ball.y - (brick.y + brick.height / 2));

            if (overlapX < overlapY) {
                ball.vx = -ball.vx;
                ball.x += (ball.x > brick.x + brick.width / 2) ? overlapX : -overlapX;
            } else {
                ball.vy = -ball.vy;
                ball.y += (ball.y > brick.y + brick.height / 2) ? overlapY : -overlapY;
            }
            return true;
        }
        return false;
    }

    handleBrickHit(brick, brickIndex, ball) {
        brick.hp--;
        this.combo++;

        if (brick.hp <= 0) {
            // Destroyed: award color-based score (Red: 5, Yellow: 10, Blue: 15)
            const pointsEarned = brick.points;
            this.score += pointsEarned;
            this.spawnScoreFloat(brick.x + brick.width / 2, brick.y, `+${pointsEarned}`);

            this.bricks.splice(brickIndex, 1);
            if (window.sounds) window.sounds.playBrickBreak(this.combo);
            this.spawnBrickExplosion(brick);
            this.screenShake = 6;

            // Chance to spawn powerup
            if (Math.random() < 0.28) {
                this.spawnPowerup(brick.x + brick.width / 2, brick.y + brick.height / 2);
            }
        } else {
            // Damaged (takes damage, visually cracks/flashes)
            brick.flash = 1;
            brick.shake = 4;
            if (window.sounds) window.sounds.playBrickHit(this.combo);
            this.spawnSpark(ball.x, ball.y, PALETTE.gold);
        }
    }

    spawnPowerup(x, y) {
        const types = ['MULTIBALL', 'WIDE_PADDLE', 'LASER', 'BONUS'];
        const type = types[Math.floor(Math.random() * types.length)];
        this.powerups.push({
            x,
            y,
            type,
            vy: 4.5,
            radius: 22,
            angle: 0
        });
    }

    updatePowerups(dt) {
        for (let i = this.powerups.length - 1; i >= 0; i--) {
            const p = this.powerups[i];
            p.y += p.vy;
            p.angle += 0.05;

            // Check paddle collection
            if (
                p.y + p.radius >= this.paddle.y &&
                p.y - p.radius <= this.paddle.y + this.paddle.height &&
                p.x >= this.paddle.x &&
                p.x <= this.paddle.x + this.paddle.width
            ) {
                this.activatePowerup(p.type);
                this.spawnScoreFloat(p.x, p.y, p.type.replace('_', ' '));
                if (window.sounds) window.sounds.playPowerup();
                this.powerups.splice(i, 1);
                continue;
            }

            if (p.y > this.bounds.bottom) {
                this.powerups.splice(i, 1);
            }
        }
    }

    activatePowerup(type) {
        if (type === 'MULTIBALL') {
            const source = this.balls[0] || { x: this.paddle.x + this.paddle.width / 2, y: this.paddle.y - 30, speed: 15 };
            for (let i = 0; i < 2; i++) {
                const angle = -Math.PI / 2 + (i === 0 ? -0.5 : 0.5);
                this.balls.push({
                    x: source.x,
                    y: source.y,
                    radius: 17,
                    vx: Math.cos(angle) * source.speed,
                    vy: Math.sin(angle) * source.speed,
                    speed: source.speed,
                    trail: [],
                    isMain: false
                });
            }
        } else if (type === 'WIDE_PADDLE') {
            this.paddle.width = 300;
            clearTimeout(this.wideTimer);
            this.wideTimer = setTimeout(() => {
                this.paddle.width = this.paddle.baseWidth;
            }, 12000);
        } else if (type === 'LASER') {
            this.paddle.laserActive = true;
            clearTimeout(this.laserTimeout);
            this.laserTimeout = setTimeout(() => {
                this.paddle.laserActive = false;
            }, 10000);
        } else if (type === 'BONUS') {
            this.score += 25;
            this.spawnScoreFloat(this.paddle.x + this.paddle.width / 2, this.paddle.y, '+25 BONUS');
        }
    }

    fireLasers() {
        if (!this.paddle.laserActive) return;
        this.lasers.push({ x: this.paddle.x + 15, y: this.paddle.y, vy: -18 });
        this.lasers.push({ x: this.paddle.x + this.paddle.width - 15, y: this.paddle.y, vy: -18 });
        if (window.sounds) window.sounds.playTone(750, 'sawtooth', 0.06, 0.25, 200);
    }

    updateLasers(dt) {
        for (let i = this.lasers.length - 1; i >= 0; i--) {
            const l = this.lasers[i];
            l.y += l.vy;

            let hit = false;
            for (let b = this.bricks.length - 1; b >= 0; b--) {
                const brick = this.bricks[b];
                if (l.x >= brick.x && l.x <= brick.x + brick.width && l.y >= brick.y && l.y <= brick.y + brick.height) {
                    this.handleBrickHit(brick, b, { x: l.x, y: l.y });
                    hit = true;
                    break;
                }
            }

            if (hit || l.y < this.bounds.top) {
                this.lasers.splice(i, 1);
            }
        }
    }

    spawnPaddleParticles(x, y) {
        for (let i = 0; i < 12; i++) {
            this.particles.push({
                x,
                y,
                vx: (Math.random() - 0.5) * 8,
                vy: -Math.random() * 6 - 2,
                size: Math.random() * 6 + 4,
                color: PALETTE.gold,
                alpha: 1,
                decay: Math.random() * 0.04 + 0.03
            });
        }
    }

    spawnSpark(x, y, color) {
        for (let i = 0; i < 8; i++) {
            this.particles.push({
                x,
                y,
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 0.5) * 10,
                size: Math.random() * 5 + 3,
                color,
                alpha: 1,
                decay: 0.05
            });
        }
    }

    spawnBrickExplosion(brick) {
        const numShards = 22;
        const color = brick.type === 'blue' ? PALETTE.cyan : (brick.type === 'yellow' ? PALETTE.gold : PALETTE.heartRed);

        for (let i = 0; i < numShards; i++) {
            this.particles.push({
                x: brick.x + Math.random() * brick.width,
                y: brick.y + Math.random() * brick.height,
                vx: (Math.random() - 0.5) * 14,
                vy: (Math.random() - 0.5) * 14 - 3,
                size: Math.random() * 12 + 6,
                isShard: true,
                angle: Math.random() * Math.PI * 2,
                spin: (Math.random() - 0.5) * 0.3,
                color,
                alpha: 1,
                decay: Math.random() * 0.02 + 0.015
            });
        }
    }

    spawnScoreFloat(x, y, text) {
        this.floatingTexts.push({
            x,
            y,
            text,
            alpha: 1,
            vy: -2
        });
    }

    updateParticles(dt) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            if (p.isShard) {
                p.vy += 0.35;
                p.angle += p.spin;
            }
            p.alpha -= p.decay;
            if (p.alpha <= 0) {
                this.particles.splice(i, 1);
            }
        }

        for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
            const f = this.floatingTexts[i];
            f.y += f.vy;
            f.alpha -= 0.02;
            if (f.alpha <= 0) {
                this.floatingTexts.splice(i, 1);
            }
        }
    }

    // ==========================================
    // RENDERING PIPELINE
    // ==========================================
    render() {
        ctx.save();

        if (this.screenShake > 0) {
            const shakeX = (Math.random() - 0.5) * this.screenShake;
            const shakeY = (Math.random() - 0.5) * this.screenShake;
            ctx.translate(shakeX, shakeY);
        }

        // 1. Dark space backdrop
        ctx.fillStyle = '#070415';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // 2. Background Grids
        this.renderBackgroundGrids();

        // If in Home Menu, render ambient floating particles and title atmosphere
        if (this.state === STATE.MENU) {
            this.renderMenuAmbience();
        } else {
            // 3. Bricks
            this.renderBricks();

            // 4. Powerups
            this.renderPowerups();

            // 5. Lasers
            this.renderLasers();

            // 6. Paddle
            this.renderPaddle();

            // 7. Balls
            this.renderBalls();

            // 8. Particles & Floaters
            this.renderParticles();

            // 9. Outer Sci-Fi Bezel & Top HUD
            this.renderBezelAndHUD();
        }

        ctx.restore();
    }

    renderMenuAmbience() {
        // Floating cyber particle effect for home menu background
        const time = Date.now() * 0.001;
        ctx.save();
        for (let i = 0; i < 18; i++) {
            const px = (Math.sin(time + i * 1.3) * 0.4 + 0.5) * CANVAS_WIDTH;
            const py = (Math.cos(time + i * 0.9) * 0.35 + 0.5) * CANVAS_HEIGHT;
            const rad = 4 + Math.sin(time * 2 + i) * 2;
            ctx.fillStyle = i % 2 === 0 ? PALETTE.cyanGlow : PALETTE.goldGlow;
            ctx.shadowColor = i % 2 === 0 ? PALETTE.cyan : PALETTE.gold;
            ctx.shadowBlur = 15;
            ctx.beginPath();
            ctx.arc(px, py, rad, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();

        // Outer cyan border frame
        this.renderBezelOnly();
    }

    renderBezelOnly() {
        ctx.save();
        const x1 = 28;
        const y1 = 32;
        const x2 = CANVAS_WIDTH - 28;
        const y2 = CANVAS_HEIGHT - 32;
        const c = 52;

        ctx.strokeStyle = PALETTE.cyan;
        ctx.lineWidth = 6;
        ctx.shadowColor = PALETTE.cyan;
        ctx.shadowBlur = 18;

        ctx.beginPath();
        ctx.moveTo(x1 + c, y1);
        ctx.lineTo(x2 - c, y1);
        ctx.lineTo(x2, y1 + c);
        ctx.lineTo(x2, y2 - c);
        ctx.lineTo(x2 - c, y2);
        ctx.lineTo(x1 + c, y2);
        ctx.lineTo(x1, y2 - c);
        ctx.lineTo(x1, y1 + c);
        ctx.closePath();
        ctx.stroke();
        ctx.restore();
    }

    renderBackgroundGrids() {
        const horizonY = 1450;

        // A. Upper Orthogonal Grid
        ctx.save();
        ctx.strokeStyle = PALETTE.gridLine;
        ctx.lineWidth = 1.5;

        const stepX = 72;
        for (let x = this.bounds.left; x <= this.bounds.right; x += stepX) {
            ctx.beginPath();
            ctx.moveTo(x, this.bounds.top);
            ctx.lineTo(x, horizonY);
            ctx.stroke();
        }

        const stepY = 72;
        for (let y = this.bounds.top; y <= horizonY; y += stepY) {
            ctx.beginPath();
            ctx.moveTo(this.bounds.left, y);
            ctx.lineTo(this.bounds.right, y);
            ctx.stroke();
        }
        ctx.restore();

        // B. Bottom 3D Perspective Floor Grid
        ctx.save();
        ctx.strokeStyle = PALETTE.gridFloor;
        ctx.lineWidth = 2;

        const vpX = CANVAS_WIDTH / 2;
        const vpY = horizonY;

        const numPerspLines = 14;
        for (let i = 0; i <= numPerspLines; i++) {
            const bottomX = -200 + i * ((CANVAS_WIDTH + 400) / numPerspLines);
            ctx.beginPath();
            ctx.moveTo(vpX + (bottomX - vpX) * 0.1, vpY);
            ctx.lineTo(bottomX, CANVAS_HEIGHT);
            ctx.stroke();
        }

        const numTransverse = 9;
        for (let j = 1; j <= numTransverse; j++) {
            const factor = Math.pow(j / numTransverse, 2.2);
            const lineY = vpY + (CANVAS_HEIGHT - vpY) * factor;
            ctx.beginPath();
            ctx.moveTo(this.bounds.left, lineY);
            ctx.lineTo(this.bounds.right, lineY);
            ctx.stroke();
        }

        const grad = ctx.createLinearGradient(0, horizonY - 40, 0, horizonY + 60);
        grad.addColorStop(0, 'rgba(147, 51, 234, 0)');
        grad.addColorStop(0.5, 'rgba(147, 51, 234, 0.35)');
        grad.addColorStop(1, 'rgba(147, 51, 234, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(this.bounds.left, horizonY - 40, this.bounds.right - this.bounds.left, 100);

        ctx.restore();
    }

    renderBricks() {
        this.bricks.forEach(brick => {
            ctx.save();
            let drawX = brick.x;
            let drawY = brick.y;

            if (brick.shake > 0) {
                drawX += (Math.random() - 0.5) * brick.shake;
                drawY += (Math.random() - 0.5) * brick.shake;
                brick.shake *= 0.85;
            }

            const tex = this.brickTextures[brick.type];
            if (tex) {
                ctx.drawImage(tex, drawX, drawY, brick.width, brick.height);
            }

            if (brick.maxHp > 1 && brick.hp === 1) {
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
                ctx.lineWidth = 2.5;
                ctx.beginPath();
                ctx.moveTo(drawX + brick.width * 0.3, drawY + 4);
                ctx.lineTo(drawX + brick.width * 0.5, drawY + brick.height * 0.5);
                ctx.lineTo(drawX + brick.width * 0.45, drawY + brick.height - 4);
                ctx.moveTo(drawX + brick.width * 0.5, drawY + brick.height * 0.5);
                ctx.lineTo(drawX + brick.width * 0.75, drawY + brick.height * 0.65);
                ctx.stroke();
            }

            if (brick.flash > 0) {
                ctx.fillStyle = `rgba(255, 255, 255, ${brick.flash * 0.7})`;
                ctx.fillRect(drawX, drawY, brick.width, brick.height);
                brick.flash -= 0.15;
            }

            ctx.restore();
        });
    }

    renderPaddle() {
        ctx.save();

        const refGrad = ctx.createRadialGradient(
            this.paddle.x + this.paddle.width / 2,
            this.paddle.y + this.paddle.height + 14,
            10,
            this.paddle.x + this.paddle.width / 2,
            this.paddle.y + this.paddle.height + 14,
            this.paddle.width * 0.75
        );
        refGrad.addColorStop(0, PALETTE.goldGlow);
        refGrad.addColorStop(0.5, 'rgba(255, 150, 0, 0.25)');
        refGrad.addColorStop(1, 'rgba(255, 150, 0, 0)');

        ctx.fillStyle = refGrad;
        ctx.beginPath();
        ctx.ellipse(
            this.paddle.x + this.paddle.width / 2,
            this.paddle.y + this.paddle.height + 14,
            this.paddle.width * 0.75,
            20,
            0, 0, Math.PI * 2
        );
        ctx.fill();

        ctx.shadowColor = PALETTE.gold;
        ctx.shadowBlur = 32;

        const pGrad = ctx.createLinearGradient(
            this.paddle.x, this.paddle.y,
            this.paddle.x, this.paddle.y + this.paddle.height
        );
        pGrad.addColorStop(0, '#ffffff');
        pGrad.addColorStop(0.2, PALETTE.gold);
        pGrad.addColorStop(0.7, '#ffaa00');
        pGrad.addColorStop(1, '#ff6a00');

        ctx.fillStyle = pGrad;
        ctx.beginPath();
        this.roundRect(ctx, this.paddle.x, this.paddle.y, this.paddle.width, this.paddle.height, 8);
        ctx.fill();

        ctx.shadowBlur = 0;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(this.paddle.x + 10, this.paddle.y + 4);
        ctx.lineTo(this.paddle.x + this.paddle.width - 10, this.paddle.y + 4);
        ctx.stroke();

        if (this.paddle.laserActive) {
            ctx.fillStyle = PALETTE.cyan;
            ctx.fillRect(this.paddle.x + 8, this.paddle.y - 8, 8, 8);
            ctx.fillRect(this.paddle.x + this.paddle.width - 16, this.paddle.y - 8, 8, 8);
        }

        ctx.restore();
    }

    renderBalls() {
        this.balls.forEach(ball => {
            if (ball.trail.length > 1) {
                ctx.save();
                for (let t = 0; t < ball.trail.length - 1; t++) {
                    const p1 = ball.trail[t];
                    const p2 = ball.trail[t + 1];
                    const progress = (t + 1) / ball.trail.length;
                    const radius = ball.radius * (0.3 + progress * 0.7);

                    ctx.fillStyle = `rgba(245, 200, 90, ${progress * 0.45})`;
                    ctx.shadowColor = PALETTE.gold;
                    ctx.shadowBlur = 10 * progress;

                    ctx.beginPath();
                    ctx.arc(p2.x, p2.y, radius, 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.restore();
            }

            ctx.save();
            ctx.shadowColor = PALETTE.cyan;
            ctx.shadowBlur = 24;

            ctx.fillStyle = PALETTE.white;
            ctx.beginPath();
            ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = PALETTE.cyan;
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.restore();
        });
    }

    renderPowerups() {
        this.powerups.forEach(p => {
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.angle);

            ctx.shadowColor = PALETTE.cyan;
            ctx.shadowBlur = 18;

            ctx.fillStyle = 'rgba(10, 20, 45, 0.9)';
            ctx.strokeStyle = PALETTE.cyan;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = PALETTE.white;
            ctx.font = '900 18px Orbitron, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            const glyph = p.type === 'MULTIBALL' ? '●●' : (p.type === 'WIDE_PADDLE' ? '↔' : (p.type === 'LASER' ? '⚡' : '★'));
            ctx.fillText(glyph, 0, 0);

            ctx.restore();
        });
    }

    renderLasers() {
        ctx.save();
        ctx.fillStyle = PALETTE.cyan;
        ctx.shadowColor = PALETTE.cyan;
        ctx.shadowBlur = 16;
        this.lasers.forEach(l => {
            ctx.fillRect(l.x - 3, l.y - 20, 6, 20);
        });
        ctx.restore();
    }

    renderParticles() {
        ctx.save();
        this.particles.forEach(p => {
            ctx.globalAlpha = p.alpha;
            ctx.fillStyle = p.color;
            ctx.shadowColor = p.color;
            ctx.shadowBlur = 10;

            if (p.isShard) {
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(p.angle);
                ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
                ctx.restore();
            } else {
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
            }
        });
        ctx.restore();

        ctx.save();
        ctx.font = '900 28px Orbitron, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        this.floatingTexts.forEach(f => {
            ctx.fillStyle = `rgba(0, 240, 255, ${f.alpha})`;
            ctx.shadowColor = PALETTE.cyan;
            ctx.shadowBlur = 12;
            ctx.fillText(f.text, f.x, f.y);
        });
        ctx.restore();
    }

    // Outer Sci-Fi Frame with chamfered cut corners & Top HUD
    renderBezelAndHUD() {
        ctx.save();

        const x1 = 28;
        const y1 = 32;
        const x2 = CANVAS_WIDTH - 28;
        const y2 = CANVAS_HEIGHT - 32;
        const c = 52;

        // 1. Outer Glowing Cyan Tech Frame
        ctx.strokeStyle = PALETTE.cyan;
        ctx.lineWidth = 6;
        ctx.shadowColor = PALETTE.cyan;
        ctx.shadowBlur = 18;

        ctx.beginPath();
        ctx.moveTo(x1 + c, y1);
        ctx.lineTo(x2 - c, y1);
        ctx.lineTo(x2, y1 + c);
        ctx.lineTo(x2, y2 - c);
        ctx.lineTo(x2 - c, y2);
        ctx.lineTo(x1 + c, y2);
        ctx.lineTo(x1, y2 - c);
        ctx.lineTo(x1, y1 + c);
        ctx.closePath();
        ctx.stroke();

        // Corner accents
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(x1 + 14, y1 + c);
        ctx.lineTo(x1 + 14, y1 + 14 + c / 2);
        ctx.lineTo(x1 + 14 + c / 2, y1 + 14);
        ctx.lineTo(x1 + c, y1 + 14);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(x2 - 14, y1 + c);
        ctx.lineTo(x2 - 14, y1 + 14 + c / 2);
        ctx.lineTo(x2 - 14 - c / 2, y1 + 14);
        ctx.lineTo(x2 - c, y1 + 14);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(x1 + 14, y2 - c);
        ctx.lineTo(x1 + 14, y2 - 14 - c / 2);
        ctx.lineTo(x1 + 14 + c / 2, y2 - 14);
        ctx.lineTo(x1 + c, y2 - 14);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(x2 - 14, y2 - c);
        ctx.lineTo(x2 - 14, y2 - 14 - c / 2);
        ctx.lineTo(x2 - 14 - c / 2, y2 - 14);
        ctx.lineTo(x2 - c, y2 - 14);
        ctx.stroke();

        ctx.fillStyle = PALETTE.cyan;
        ctx.fillRect(x1 + 180, y1 - 4, 30, 8);
        ctx.fillRect(x2 - 210, y1 - 4, 30, 8);
        ctx.fillRect(x1 + 180, y2 - 4, 30, 8);
        ctx.fillRect(x2 - 210, y2 - 4, 30, 8);

        // 2. TOP HUD (LEFT: PAUSE & SETTINGS, MIDDLE: SCORE & LEVEL, RIGHT: LIVES & BIG HEARTS)
        ctx.shadowBlur = 0;
        ctx.textBaseline = 'middle';

        // --- LEFT SIDE: PAUSE (⏸) & SETTINGS (⚙) ---
        const pauseX = 98;
        const pauseY = 114;
        ctx.fillStyle = PALETTE.cyan;
        ctx.shadowColor = PALETTE.cyan;
        ctx.shadowBlur = 14;
        ctx.fillRect(pauseX - 8, pauseY - 15, 6, 30);
        ctx.fillRect(pauseX + 2, pauseY - 15, 6, 30);

        const gearX = 175;
        this.renderGearIcon(gearX, 114);

        // --- MIDDLE: SCORE (TOP CENTER) & LEVEL ---
        ctx.textAlign = 'center';
        ctx.fillStyle = PALETTE.white;
        ctx.shadowColor = PALETTE.cyan;
        ctx.shadowBlur = 15;
        ctx.font = '900 44px Orbitron, sans-serif';
        ctx.fillText(`SCORE: ${this.score}`, CANVAS_WIDTH / 2, 104);

        ctx.shadowBlur = 8;
        ctx.font = '700 22px Orbitron, sans-serif';
        ctx.fillStyle = PALETTE.cyan;
        ctx.fillText(`LEVEL: ${this.level}`, CANVAS_WIDTH / 2, 140);

        // --- RIGHT SIDE: LIVES & BIG HEARTS ---
        ctx.shadowBlur = 0;
        ctx.font = '900 32px Orbitron, sans-serif';
        ctx.textAlign = 'right';
        ctx.fillStyle = PALETTE.white;
        ctx.fillText('LIVES:', CANVAS_WIDTH - 215, 114);

        const heartStartX = CANVAS_WIDTH - 170;
        const heartY = 114;
        const heartGap = 58;
        for (let h = 0; h < 3; h++) {
            const isAlive = h < this.lives;
            this.renderPixelHeart(heartStartX + h * heartGap, heartY, isAlive);
        }

        ctx.restore();
    }

    renderPixelHeart(x, y, isAlive) {
        ctx.save();
        ctx.translate(x, y);

        const heartMap = [
            [0, 1, 1, 0, 0, 0, 1, 1, 0],
            [1, 1, 1, 1, 0, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1, 1],
            [1, 1, 1, 1, 1, 1, 1, 1, 1],
            [0, 1, 1, 1, 1, 1, 1, 1, 0],
            [0, 0, 1, 1, 1, 1, 1, 0, 0],
            [0, 0, 0, 1, 1, 1, 0, 0, 0],
            [0, 0, 0, 0, 1, 0, 0, 0, 0]
        ];

        const pixelSize = 5.2;
        const offsetX = -(9 * pixelSize) / 2;
        const offsetY = -(8 * pixelSize) / 2;

        ctx.fillStyle = isAlive ? PALETTE.heartRed : PALETTE.heartDim;
        if (isAlive) {
            ctx.shadowColor = PALETTE.heartRed;
            ctx.shadowBlur = 14;
        }

        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 9; c++) {
                if (heartMap[r][c] === 1) {
                    ctx.fillRect(offsetX + c * pixelSize, offsetY + r * pixelSize, pixelSize, pixelSize);
                }
            }
        }

        if (isAlive) {
            ctx.fillStyle = '#ff8ca3';
            ctx.fillRect(offsetX + 2 * pixelSize, offsetY + 1 * pixelSize, pixelSize, pixelSize);
            ctx.fillRect(offsetX + 7 * pixelSize, offsetY + 1 * pixelSize, pixelSize, pixelSize);
        }

        ctx.restore();
    }

    renderGearIcon(x, y) {
        ctx.save();
        ctx.translate(x, y);
        ctx.strokeStyle = PALETTE.cyan;
        ctx.fillStyle = PALETTE.cyan;
        ctx.shadowColor = PALETTE.cyan;
        ctx.shadowBlur = 12;
        ctx.lineWidth = 3.5;

        ctx.beginPath();
        ctx.arc(0, 0, 9, 0, Math.PI * 2);
        ctx.stroke();

        for (let i = 0; i < 6; i++) {
            const angle = (i * Math.PI) / 3;
            ctx.save();
            ctx.rotate(angle);
            ctx.fillRect(-3, -15, 6, 6);
            ctx.restore();
        }

        ctx.restore();
    }

    roundRect(ctx, x, y, width, height, radius) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
    }
}

// Start game when DOM is loaded
window.addEventListener('DOMContentLoaded', () => {
    window.game = new Game();
});
