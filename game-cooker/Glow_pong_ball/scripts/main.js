/**
 * Glow Air Hockey / Glow Pong Ball - Main Game Controller
 * Architecture matching Construct 3 Export & HTML5 Canvas Standard
 */

(function () {
    const CANVAS_WIDTH = 1080;
    const CANVAS_HEIGHT = 1920;

    const TABLE_CONFIG = {
        width: CANVAS_WIDTH,
        height: CANVAS_HEIGHT,
        court: {
            left: 120,
            right: 960,
            top: 210,
            bottom: 1710,
            centerX: 540,
            centerY: 960,
            goalLeft: 360,
            goalRight: 720,
            goalTopY: 210,
            goalBottomY: 1710
        },
        malletRadius: 75,
        puckRadius: 40,
        subSteps: 8,
        friction: 0.9996,
        maxPuckSpeed: 2800,
        restitutionWall: 0.96,
        restitutionMallet: 1.12
    };

    class GameApp {
        constructor() {
            this.canvas = document.getElementById('c3canvas');
            this.ctx = this.canvas.getContext('2d');

            this.audio = new SoundManager();
            this.physics = new PhysicsEngine(TABLE_CONFIG);
            this.ai = new AirHockeyAI(TABLE_CONFIG);
            this.effects = new EffectsManager(TABLE_CONFIG);
            this.ui = new UIManager(CANVAS_WIDTH, CANVAS_HEIGHT);

            this.assets = {};
            this.loaded = false;

            // Game State
            this.state = {
                scorePlayer: 0,
                scoreAI: 0,
                maxScore: 7,
                isPaused: false,
                isGameOver: false,
                winner: null,
                difficulty: 'medium',
                soundMuted: false,
                inGoalSequence: false
            };

            // Game Entities
            this.puck = {
                x: 540,
                y: 960,
                vx: 0,
                vy: 0,
                active: true,
                radius: TABLE_CONFIG.puckRadius
            };

            this.playerMallet = {
                x: 540,
                y: 1450,
                vx: 0,
                vy: 0,
                targetX: 540,
                targetY: 1450,
                isDragging: false,
                radius: TABLE_CONFIG.malletRadius
            };

            this.aiMallet = {
                x: 540,
                y: 450,
                vx: 0,
                vy: 0,
                radius: TABLE_CONFIG.malletRadius
            };

            this.lastTime = performance.now();
            this.initCallbacks();
            this.initInput();
            this.loadAssets().then(() => {
                this.loaded = true;
                this.resetPuck('center');
                requestAnimationFrame(this.loop.bind(this));
            });

            window.addEventListener('resize', this.resizeCanvas.bind(this));
            this.resizeCanvas();
        }

        resizeCanvas() {
            // Resize canvas element display style to fit window with 1080x1920 aspect ratio
            const winW = window.innerWidth;
            const winH = window.innerHeight;
            const targetRatio = CANVAS_WIDTH / CANVAS_HEIGHT;
            const windowRatio = winW / winH;

            let displayW, displayH;
            if (windowRatio < targetRatio) {
                displayW = winW;
                displayH = winW / targetRatio;
            } else {
                displayH = winH;
                displayW = winH * targetRatio;
            }

            this.canvas.style.width = `${Math.floor(displayW)}px`;
            this.canvas.style.height = `${Math.floor(displayH)}px`;
        }

        screenToCanvas(clientX, clientY) {
            const rect = this.canvas.getBoundingClientRect();
            const scaleX = CANVAS_WIDTH / rect.width;
            const scaleY = CANVAS_HEIGHT / rect.height;
            return {
                x: (clientX - rect.left) * scaleX,
                y: (clientY - rect.top) * scaleY
            };
        }

        async loadAssets() {
            const assetList = {
                tableBg: 'images/table_bg.png',
                malletPlayer: 'images/mallet_player.png',
                malletAI: 'images/mallet_ai.png',
                puck: 'images/puck.png',
                goalBanner: 'images/goal_banner.png',
                btnSoundOn: 'images/btn_sound_on.png',
                btnSoundOff: 'images/btn_sound_off.png',
                btnClose: 'images/btn_close.png',
                btnRestart: 'images/btn_restart.png',
                ledBlue: 'images/led_blue.png',
                ledRed: 'images/led_red.png',
                spark: 'images/spark.png'
            };

            const promises = Object.entries(assetList).map(([key, src]) => {
                return new Promise((resolve) => {
                    const img = new Image();
                    img.src = src;
                    img.onload = () => {
                        this.assets[key] = img;
                        resolve();
                    };
                    img.onerror = () => {
                        console.warn('Asset fallback for', src);
                        resolve();
                    };
                });
            });

            await Promise.all(promises);
        }

        initCallbacks() {
            // Physics audio & effects hooks
            this.physics.onMalletHit = (x, y, owner, speed) => {
                const vol = Math.min(1.0, Math.max(0.3, speed / 1200));
                this.audio.play('hit_mallet', vol);
                this.effects.addSparks(x, y, 14, owner === 'player' ? '#00e5ff' : '#ff2255');
            };

            this.physics.onWallHit = (x, y, side, speed) => {
                const vol = Math.min(1.0, Math.max(0.25, speed / 1000));
                this.audio.play('hit_wall', vol);
                this.effects.addSparks(x, y, 8, '#ff38d8');
                this.effects.triggerWallLed(x, y, 'blue');
            };

            this.physics.onGoal = (goalSide, puckX) => {
                if (this.state.inGoalSequence) return;
                this.state.inGoalSequence = true;

                if (goalSide === 'top') {
                    // Player scored on AI!
                    this.state.scorePlayer++;
                    this.effects.startGoalAnimation('player');
                } else {
                    // AI scored on Player!
                    this.state.scoreAI++;
                    this.effects.startGoalAnimation('ai');
                }

                this.audio.play('goal', 1.0);

                // Check win condition
                if (this.state.scorePlayer >= this.state.maxScore) {
                    setTimeout(() => {
                        this.state.isGameOver = true;
                        this.state.winner = 'player';
                        this.audio.play('win', 1.0);
                    }, 1400);
                } else if (this.state.scoreAI >= this.state.maxScore) {
                    setTimeout(() => {
                        this.state.isGameOver = true;
                        this.state.winner = 'ai';
                        this.audio.play('lose', 1.0);
                    }, 1400);
                } else {
                    // Reset puck after 1.8s
                    setTimeout(() => {
                        this.resetPuck(goalSide === 'top' ? 'ai' : 'player');
                        this.state.inGoalSequence = false;
                    }, 1800);
                }
            };
        }

        resetPuck(servingTowards = 'center') {
            this.puck.active = true;
            this.puck.x = TABLE_CONFIG.court.centerX;
            this.puck.y = TABLE_CONFIG.court.centerY;

            let vy = 0;
            if (servingTowards === 'player') {
                vy = 280;
            } else if (servingTowards === 'ai') {
                vy = -280;
            } else {
                vy = (Math.random() > 0.5 ? 280 : -280);
            }
            this.puck.vx = (Math.random() - 0.5) * 160;
            this.puck.vy = vy;
        }

        initInput() {
            const onDown = (clientX, clientY) => {
                const pos = this.screenToCanvas(clientX, clientY);

                // Check HUD Button clicks
                const sndBtn = this.ui.btnSound;
                if (pos.x >= sndBtn.x && pos.x <= sndBtn.x + sndBtn.size &&
                    pos.y >= sndBtn.y && pos.y <= sndBtn.y + sndBtn.size) {
                    this.state.soundMuted = this.audio.toggleMute();
                    this.audio.play('button', 0.5);
                    return;
                }

                const closeBtn = this.ui.btnClose;
                if (pos.x >= closeBtn.x && pos.x <= closeBtn.x + closeBtn.size &&
                    pos.y >= closeBtn.y && pos.y <= closeBtn.y + closeBtn.size) {
                    this.state.isPaused = !this.state.isPaused;
                    this.audio.play('button', 0.5);
                    return;
                }

                // Check Pause Menu clicks
                if (this.state.isPaused) {
                    const mw = 840, mh = 900;
                    const mx = (CANVAS_WIDTH - mw) / 2, my = (CANVAS_HEIGHT - mh) / 2;

                    // Difficulty buttons
                    const diffs = ['easy', 'medium', 'hard', 'pro'];
                    const btnW = 160, btnH = 65, gap = 20;
                    const startBx = CANVAS_WIDTH / 2 - (4 * btnW + 3 * gap) / 2;

                    diffs.forEach((d, i) => {
                        const bx = startBx + i * (btnW + gap);
                        const by = my + 290;
                        if (pos.x >= bx && pos.x <= bx + btnW && pos.y >= by && pos.y <= by + btnH) {
                            this.state.difficulty = d;
                            this.ai.setDifficulty(d);
                            this.audio.play('button', 0.5);
                        }
                    });

                    // Resume button
                    if (Math.abs(pos.x - CANVAS_WIDTH / 2) < 260 && Math.abs(pos.y - (my + 480)) < 45) {
                        this.state.isPaused = false;
                        this.audio.play('button', 0.5);
                    }

                    // Restart button
                    if (Math.abs(pos.x - CANVAS_WIDTH / 2) < 260 && Math.abs(pos.y - (my + 600)) < 45) {
                        this.restartMatch();
                    }
                    return;
                }

                // Check Game Over Menu clicks
                if (this.state.isGameOver) {
                    const my = (CANVAS_HEIGHT - 850) / 2;
                    if (Math.abs(pos.x - CANVAS_WIDTH / 2) < 260 && Math.abs(pos.y - (my + 440)) < 50) {
                        this.restartMatch();
                    }
                    return;
                }

                // Player Mallet Touch
                const dPlayer = Math.hypot(pos.x - this.playerMallet.x, pos.y - this.playerMallet.y);
                if (dPlayer < this.playerMallet.radius + 60 || pos.y > TABLE_CONFIG.court.centerY) {
                    this.playerMallet.isDragging = true;
                    this.playerMallet.targetX = pos.x;
                    this.playerMallet.targetY = pos.y;
                }
            };

            const onMove = (clientX, clientY) => {
                if (!this.playerMallet.isDragging || this.state.isPaused || this.state.isGameOver) return;
                const pos = this.screenToCanvas(clientX, clientY);
                this.playerMallet.targetX = pos.x;
                this.playerMallet.targetY = pos.y;
            };

            const onUp = () => {
                this.playerMallet.isDragging = false;
            };

            // Pointer Events
            this.canvas.addEventListener('pointerdown', (e) => {
                e.preventDefault();
                onDown(e.clientX, e.clientY);
            });

            window.addEventListener('pointermove', (e) => {
                onMove(e.clientX, e.clientY);
            });

            window.addEventListener('pointerup', onUp);
            window.addEventListener('pointercancel', onUp);
        }

        restartMatch() {
            this.state.scorePlayer = 0;
            this.state.scoreAI = 0;
            this.state.isGameOver = false;
            this.state.isPaused = false;
            this.state.winner = null;
            this.state.inGoalSequence = false;
            this.playerMallet.x = 540;
            this.playerMallet.y = 1450;
            this.aiMallet.x = 540;
            this.aiMallet.y = 450;
            this.resetPuck('center');
            this.audio.play('button', 0.5);
        }

        update(dt) {
            if (this.state.isPaused || this.state.isGameOver) return;

            // 1. Update Player Mallet with boundary clamps
            const court = TABLE_CONFIG.court;
            const mR = TABLE_CONFIG.malletRadius;

            const minPlayerX = court.left + mR;
            const maxPlayerX = court.right - mR;
            const minPlayerY = court.centerY + mR + 10;
            const maxPlayerY = court.bottom - mR;

            const prevPx = this.playerMallet.x;
            const prevPy = this.playerMallet.y;

            if (this.playerMallet.isDragging) {
                this.playerMallet.x = Math.max(minPlayerX, Math.min(maxPlayerX, this.playerMallet.targetX));
                this.playerMallet.y = Math.max(minPlayerY, Math.min(maxPlayerY, this.playerMallet.targetY));
            }

            if (dt > 0) {
                this.playerMallet.vx = (this.playerMallet.x - prevPx) / dt;
                this.playerMallet.vy = (this.playerMallet.y - prevPy) / dt;
            }

            // 2. Update AI Mallet
            this.ai.update(this.aiMallet, this.puck, dt);

            // 3. Update Physics (Continuous sub-stepping)
            this.physics.step(this.puck, this.playerMallet, this.aiMallet, dt);

            // 4. Update FX
            this.effects.update(dt, this.puck);
        }

        render() {
            this.ctx.save();

            // Clear Canvas
            this.ctx.fillStyle = '#000000';
            this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

            // Screen Shake translation
            this.ctx.translate(this.effects.shakeX, this.effects.shakeY);

            // 1. Draw Table Background
            if (this.assets.tableBg) {
                this.ctx.drawImage(this.assets.tableBg, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
            }

            // 2. Draw Visual Effects (Wall LEDs, Trails, Sparks)
            this.effects.render(this.ctx, this.assets);

            // 3. Draw Puck
            if (this.puck.active && this.assets.puck) {
                const pr = TABLE_CONFIG.puckRadius;
                const pDrawSize = pr * 2.2;
                this.ctx.drawImage(this.assets.puck, this.puck.x - pDrawSize / 2, this.puck.y - pDrawSize / 2, pDrawSize, pDrawSize);
            }

            // 4. Draw AI Mallet (Red)
            if (this.assets.malletAI) {
                const mr = TABLE_CONFIG.malletRadius;
                const mDrawSize = mr * 2.3;
                this.ctx.drawImage(this.assets.malletAI, this.aiMallet.x - mDrawSize / 2, this.aiMallet.y - mDrawSize / 2, mDrawSize, mDrawSize);
            }

            // 5. Draw Player Mallet (Blue)
            if (this.assets.malletPlayer) {
                const mr = TABLE_CONFIG.malletRadius;
                const mDrawSize = mr * 2.3;
                this.ctx.drawImage(this.assets.malletPlayer, this.playerMallet.x - mDrawSize / 2, this.playerMallet.y - mDrawSize / 2, mDrawSize, mDrawSize);
            }

            // 6. Draw UI HUD (LED Scoreboard, Buttons, Dialogs)
            this.ui.render(this.ctx, this.state, this.assets);

            this.ctx.restore();
        }

        loop(time) {
            const dt = Math.min(1 / 30, (time - this.lastTime) / 1000);
            this.lastTime = time;

            this.update(dt);
            this.render();

            requestAnimationFrame(this.loop.bind(this));
        }
    }

    // Launch game on DOM ready
    window.addEventListener('DOMContentLoaded', () => {
        window.glowGame = new GameApp();
    });
})();

