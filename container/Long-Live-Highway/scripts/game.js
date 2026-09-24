/**
 * Main Game Controller
 * Manages game state loop, input listeners, coordinate transformations, and screen shaking.
 */

class Game {
    constructor(canvas, assets) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.assets = assets;

        // Logical layout size: 1080 x 1920
        this.width = 1080;
        this.height = 1920;

        this.state = 'START'; // 'START' | 'PLAYING' | 'PAUSED' | 'GAMEOVER'
        this.gameOverReason = '';

        // Subsystems
        this.particles = new ParticleSystem();
        this.player = new Player(this);
        this.traffic = new TrafficManager(this);
        this.collectibles = new CollectiblesManager(this);
        this.scenery = new SceneryManager(this);
        this.ui = new UIManager(this);

        // Input state
        this.input = {
            left: false,
            right: false,
            up: false,
            down: false,
            nitro: false,
            touchTargetX: null
        };

        // Camera Shake
        this.screenShake = 0;

        // Score reporting flag
        this.scoreSent = false;
        this.gameOverClosed = false;

        this.initInputListeners();
    }

    initInputListeners() {
        window.addEventListener('keydown', (e) => {
            if (e.repeat) return;
            window.soundManager.init();

            if (this.state === 'START') {
                if (e.code === 'Space' || e.key === 'Enter') {
                    this.startGame();
                }
                return;
            }

            if (this.state === 'GAMEOVER') {
                if (e.code === 'Space' || e.key === 'Enter') {
                    this.startGame();
                }
                return;
            }

            if (e.code === 'KeyP' || e.code === 'Escape') {
                this.togglePause();
                return;
            }

            if (this.state !== 'PLAYING') return;

            if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.input.left = true;
            if (e.code === 'ArrowRight' || e.code === 'KeyD') this.input.right = true;
            if (e.code === 'ArrowUp' || e.code === 'KeyW') this.input.up = true;
            if (e.code === 'ArrowDown' || e.code === 'KeyS') this.input.down = true;
            if (e.code === 'Space') {
                this.input.nitro = true;
                this.player.activateNitro();
            }
        });

        window.addEventListener('keyup', (e) => {
            if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.input.left = false;
            if (e.code === 'ArrowRight' || e.code === 'KeyD') this.input.right = false;
            if (e.code === 'ArrowUp' || e.code === 'KeyW') this.input.up = false;
            if (e.code === 'ArrowDown' || e.code === 'KeyS') this.input.down = false;
            if (e.code === 'Space') this.input.nitro = false;
        });

        // Multi-Touch & Mouse Pointer Handling
        const rectScale = (clientX, clientY) => {
            const rect = this.canvas.getBoundingClientRect();
            const scaleX = this.width / rect.width;
            const scaleY = this.height / rect.height;
            return {
                x: (clientX - rect.left) * scaleX,
                y: (clientY - rect.top) * scaleY
            };
        };

        const handleTouchList = (touchList) => {
            const tc = this.ui.touchControls;
            let brakeActive = false;
            let nitroActive = false;
            let steerX = null;

            for (let i = 0; i < touchList.length; i++) {
                const pos = rectScale(touchList[i].clientX, touchList[i].clientY);

                if (MathUtils.dist(pos.x, pos.y, tc.brakeBtn.x, tc.brakeBtn.y) <= tc.brakeBtn.r) {
                    brakeActive = true;
                } else if (MathUtils.dist(pos.x, pos.y, tc.boostBtn.x, tc.boostBtn.y) <= tc.boostBtn.r) {
                    nitroActive = true;
                } else if (pos.y > 136) {
                    steerX = pos.x;
                }
            }

            this.ui.isBrakePressed = brakeActive;
            this.input.down = brakeActive;

            if (nitroActive && !this.ui.isNitroPressed) {
                this.player.activateNitro();
            }
            this.ui.isNitroPressed = nitroActive;
            this.input.touchTargetX = steerX;
        };

        // Touch Listeners
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            window.soundManager.init();

            const pos = rectScale(e.touches[0].clientX, e.touches[0].clientY);

            if (this.state === 'START') {
                this.startGame();
                return;
            }
            if (this.state === 'GAMEOVER') {
                const tc = this.ui.touchControls;
                // Check Cross Button (dismiss / close popup)
                if (!this.gameOverClosed && MathUtils.dist(pos.x, pos.y, tc.gameOverCloseBtn.x, tc.gameOverCloseBtn.y) <= tc.gameOverCloseBtn.r + 15) {
                    this.gameOverClosed = true;
                    return;
                }
                if (!this.gameOverClosed) {
                    // Check Revive Button (starts at 5 coins, increases by +5 each time: 5 -> 10 -> 15 -> 20...)
                    const rb = tc.gameOverReviveBtn;
                    if (rb && pos.x >= rb.x - rb.w / 2 && pos.x <= rb.x + rb.w / 2 &&
                        pos.y >= rb.y - rb.h / 2 && pos.y <= rb.y + rb.h / 2) {
                        const reviveCost = this.player.getReviveCost ? this.player.getReviveCost() : 5;
                        if (this.player.coins >= reviveCost) {
                            this.player.coins -= reviveCost;
                            this.player.revive();
                            // Clear immediate traffic & road hazard directly around player
                            this.traffic.vehicles = this.traffic.vehicles.filter(v => v.y < this.player.y - 500 || v.y > this.player.y + 300);
                            this.collectibles.brokenRoads = this.collectibles.brokenRoads.filter(br => br.y < this.player.y - 600 || br.y > this.player.y + 400);
                            this.state = 'PLAYING';
                            this.scoreSent = false;
                            this.gameOverClosed = false;
                            this.ui.triggerCoinBump();
                            return;
                        } else {
                            this.particles.addScorePopup(540, 940, `NEED ${reviveCost} ⭐ TO REVIVE!`, "#ef476f");
                            return;
                        }
                    }
                    // Check Back to Home Button (redirect to "/")
                    const hb = tc.gameOverHomeBtn;
                    if (pos.x >= hb.x - hb.w / 2 && pos.x <= hb.x + hb.w / 2 &&
                        pos.y >= hb.y - hb.h / 2 && pos.y <= hb.y + hb.h / 2) {
                        window.location.href = '/';
                        return;
                    }
                    // Check Try Again Button
                    const pb = tc.gameOverPlayAgainBtn;
                    if (pos.x >= pb.x - pb.w / 2 && pos.x <= pb.x + pb.w / 2 &&
                        pos.y >= pb.y - pb.h / 2 && pos.y <= pb.y + pb.h / 2) {
                        this.startGame();
                        return;
                    }
                } else {
                    // If popup was closed, tap anywhere on screen restarts game
                    this.startGame();
                    return;
                }
                return;
            }
            if (this.state === 'PAUSED') {
                const tc = this.ui.touchControls;
                // 1. Check Cross Button (dismiss pause popup / resume game)
                if (tc.pauseCloseBtn && MathUtils.dist(pos.x, pos.y, tc.pauseCloseBtn.x, tc.pauseCloseBtn.y) <= tc.pauseCloseBtn.r + 15) {
                    this.togglePause();
                    return;
                }
                // 2. Check Back to Home Button (redirect to "/")
                const hb = tc.pauseHomeBtn;
                if (hb && pos.x >= hb.x - hb.w / 2 && pos.x <= hb.x + hb.w / 2 &&
                    pos.y >= hb.y - hb.h / 2 && pos.y <= hb.y + hb.h / 2) {
                    window.location.href = '/';
                    return;
                }
                // 3. Check Resume Button
                const rb = tc.pauseResumeBtn;
                if (rb && pos.x >= rb.x - rb.w / 2 && pos.x <= rb.x + rb.w / 2 &&
                    pos.y >= rb.y - rb.h / 2 && pos.y <= rb.y + rb.h / 2) {
                    this.togglePause();
                    return;
                }
                // 4. Check Restart Button
                const rsb = tc.pauseRestartBtn;
                if (rsb && pos.x >= rsb.x - rsb.w / 2 && pos.x <= rsb.x + rsb.w / 2 &&
                    pos.y >= rsb.y - rsb.h / 2 && pos.y <= rsb.y + rsb.h / 2) {
                    this.startGame();
                    return;
                }
                return;
            }

            const tc = this.ui.touchControls;
            if (MathUtils.dist(pos.x, pos.y, tc.pauseBtn.x, tc.pauseBtn.y) <= tc.pauseBtn.r + 15) {
                this.togglePause();
                return;
            }

            handleTouchList(e.touches);
        }, { passive: false });

        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (this.state === 'PLAYING') {
                handleTouchList(e.touches);
            }
        }, { passive: false });

        this.canvas.addEventListener('touchend', (e) => {
            if (this.state === 'PLAYING') {
                handleTouchList(e.touches);
            }
        });

        this.canvas.addEventListener('touchcancel', () => {
            this.ui.isBrakePressed = false;
            this.ui.isNitroPressed = false;
            this.input.down = false;
            this.input.touchTargetX = null;
        });

        // Mouse Listeners
        let isMouseDown = false;
        this.canvas.addEventListener('mousedown', (e) => {
            window.soundManager.init();
            isMouseDown = true;
            const pos = rectScale(e.clientX, e.clientY);

            if (this.state === 'START') {
                this.startGame();
                return;
            }
            if (this.state === 'GAMEOVER') {
                const tc = this.ui.touchControls;
                // Check Cross Button (dismiss / close popup)
                if (!this.gameOverClosed && MathUtils.dist(pos.x, pos.y, tc.gameOverCloseBtn.x, tc.gameOverCloseBtn.y) <= tc.gameOverCloseBtn.r + 15) {
                    this.gameOverClosed = true;
                    return;
                }
                if (!this.gameOverClosed) {
                    // Check Revive Button (starts at 5 coins, increases by +5 each time: 5 -> 10 -> 15 -> 20...)
                    const rb = tc.gameOverReviveBtn;
                    if (rb && pos.x >= rb.x - rb.w / 2 && pos.x <= rb.x + rb.w / 2 &&
                        pos.y >= rb.y - rb.h / 2 && pos.y <= rb.y + rb.h / 2) {
                        const reviveCost = this.player.getReviveCost ? this.player.getReviveCost() : 5;
                        if (this.player.coins >= reviveCost) {
                            this.player.coins -= reviveCost;
                            this.player.revive();
                            // Clear immediate traffic & road hazard directly around player
                            this.traffic.vehicles = this.traffic.vehicles.filter(v => v.y < this.player.y - 500 || v.y > this.player.y + 300);
                            this.collectibles.brokenRoads = this.collectibles.brokenRoads.filter(br => br.y < this.player.y - 600 || br.y > this.player.y + 400);
                            this.state = 'PLAYING';
                            this.scoreSent = false;
                            this.gameOverClosed = false;
                            this.ui.triggerCoinBump();
                            return;
                        } else {
                            this.particles.addScorePopup(540, 940, `NEED ${reviveCost} ⭐ TO REVIVE!`, "#ef476f");
                            return;
                        }
                    }
                    // Check Back to Home Button (redirect to "/")
                    const hb = tc.gameOverHomeBtn;
                    if (pos.x >= hb.x - hb.w / 2 && pos.x <= hb.x + hb.w / 2 &&
                        pos.y >= hb.y - hb.h / 2 && pos.y <= hb.y + hb.h / 2) {
                        window.location.href = '/';
                        return;
                    }
                    // Check Try Again Button
                    const pb = tc.gameOverPlayAgainBtn;
                    if (pos.x >= pb.x - pb.w / 2 && pos.x <= pb.x + pb.w / 2 &&
                        pos.y >= pb.y - pb.h / 2 && pos.y <= pb.y + pb.h / 2) {
                        this.startGame();
                        return;
                    }
                } else {
                    // If popup was closed, click anywhere on screen restarts game
                    this.startGame();
                    return;
                }
                return;
            }
            if (this.state === 'PAUSED') {
                const tc = this.ui.touchControls;
                // 1. Check Cross Button (dismiss pause popup / resume game)
                if (tc.pauseCloseBtn && MathUtils.dist(pos.x, pos.y, tc.pauseCloseBtn.x, tc.pauseCloseBtn.y) <= tc.pauseCloseBtn.r + 15) {
                    this.togglePause();
                    return;
                }
                // 2. Check Back to Home Button (redirect to "/")
                const hb = tc.pauseHomeBtn;
                if (hb && pos.x >= hb.x - hb.w / 2 && pos.x <= hb.x + hb.w / 2 &&
                    pos.y >= hb.y - hb.h / 2 && pos.y <= hb.y + hb.h / 2) {
                    window.location.href = '/';
                    return;
                }
                // 3. Check Resume Button
                const rb = tc.pauseResumeBtn;
                if (rb && pos.x >= rb.x - rb.w / 2 && pos.x <= rb.x + rb.w / 2 &&
                    pos.y >= rb.y - rb.h / 2 && pos.y <= rb.y + rb.h / 2) {
                    this.togglePause();
                    return;
                }
                // 4. Check Restart Button
                const rsb = tc.pauseRestartBtn;
                if (rsb && pos.x >= rsb.x - rsb.w / 2 && pos.x <= rsb.x + rsb.w / 2 &&
                    pos.y >= rsb.y - rsb.h / 2 && pos.y <= rsb.y + rsb.h / 2) {
                    this.startGame();
                    return;
                }
                return;
            }

            const tc = this.ui.touchControls;
            if (MathUtils.dist(pos.x, pos.y, tc.pauseBtn.x, tc.pauseBtn.y) <= tc.pauseBtn.r + 15) {
                this.togglePause();
                return;
            }

            if (MathUtils.dist(pos.x, pos.y, tc.brakeBtn.x, tc.brakeBtn.y) <= tc.brakeBtn.r) {
                this.ui.isBrakePressed = true;
                this.input.down = true;
            } else if (MathUtils.dist(pos.x, pos.y, tc.boostBtn.x, tc.boostBtn.y) <= tc.boostBtn.r) {
                this.ui.isNitroPressed = true;
                this.player.activateNitro();
            } else if (pos.y > 136) {
                this.input.touchTargetX = pos.x;
            }
        });

        this.canvas.addEventListener('mousemove', (e) => {
            if (!isMouseDown || this.state !== 'PLAYING') return;
            const pos = rectScale(e.clientX, e.clientY);
            const tc = this.ui.touchControls;

            if (MathUtils.dist(pos.x, pos.y, tc.brakeBtn.x, tc.brakeBtn.y) <= tc.brakeBtn.r) {
                this.ui.isBrakePressed = true;
                this.input.down = true;
                this.input.touchTargetX = null;
            } else if (MathUtils.dist(pos.x, pos.y, tc.boostBtn.x, tc.boostBtn.y) <= tc.boostBtn.r) {
                this.ui.isNitroPressed = true;
                this.player.activateNitro();
                this.input.touchTargetX = null;
            } else if (pos.y > 136) {
                this.ui.isBrakePressed = false;
                this.ui.isNitroPressed = false;
                this.input.down = false;
                this.input.touchTargetX = pos.x;
            }
        });

        const endMouse = () => {
            isMouseDown = false;
            this.ui.isBrakePressed = false;
            this.ui.isNitroPressed = false;
            this.input.down = false;
            this.input.touchTargetX = null;
        };

        window.addEventListener('mouseup', endMouse);
        window.addEventListener('blur', endMouse);
    }

    startGame() {
        this.state = 'PLAYING';
        this.scoreSent = false;
        this.gameOverClosed = false;
        this.player.reset();
        this.traffic.reset();
        this.collectibles.reset();
        this.scenery.reset();
        this.particles = new ParticleSystem();
        window.soundManager.startEngine();
    }

    togglePause() {
        if (this.state === 'PLAYING') {
            this.state = 'PAUSED';
            window.soundManager.stopEngine();
        } else if (this.state === 'PAUSED') {
            this.state = 'PLAYING';
            window.soundManager.startEngine();
        }
    }

    onGameOver(reason) {
        this.state = 'GAMEOVER';
        this.gameOverReason = reason;
        this.gameOverClosed = false;
        this.screenShake = 25;

        // Send score via send_score_api.js precisely once per game over event
        if (!this.scoreSent) {
            this.scoreSent = true;
            const finalScore = Number(this.player.score) || 0;
            if (typeof window !== 'undefined' && typeof window.sendScore === 'function') {
                window.sendScore(finalScore);
            } else if (typeof sendScore === 'function') {
                sendScore(finalScore);
            }
        }
    }

    update(dt = 1) {
        if (this.screenShake > 0) {
            this.screenShake *= 0.9;
            if (this.screenShake < 0.5) this.screenShake = 0;
        }

        if (this.state === 'START') {
            this.scenery.update(6);
            this.particles.update(6);
            return;
        }

        if (this.state === 'GAMEOVER') {
            this.scenery.update(this.player.speed * 0.3);
            this.particles.update(this.player.speed * 0.3);
            return;
        }

        if (this.state !== 'PLAYING') return;

        // Add extra shake if nitro is active
        if (this.player.isNitroActive) {
            this.screenShake = Math.max(this.screenShake, 4.5);
        }

        this.player.update(this.input, dt);
        const roadSpeed = this.player.speed;

        this.scenery.update(roadSpeed);
        this.traffic.update(roadSpeed);
        this.collectibles.update(roadSpeed);
        this.particles.update(roadSpeed);
    }

    render() {
        this.ctx.save();

        // Apply screen shake
        if (this.screenShake > 0) {
            const sx = (Math.random() - 0.5) * this.screenShake * 2;
            const sy = (Math.random() - 0.5) * this.screenShake * 2;
            this.ctx.translate(sx, sy);
        }

        // 1. Draw Terrain & Highway Road
        this.scenery.drawTerrain(this.ctx);

        // 2. Draw Skid marks on road
        this.particles.drawSkids(this.ctx);

        // 3. Draw Collectibles & Hazards
        this.collectibles.draw(this.ctx);

        // 4. Draw Traffic Vehicles
        this.traffic.draw(this.ctx);

        // 5. Draw Player Car
        this.player.draw(this.ctx);

        // 6. Draw Particles & Dust
        this.particles.drawParticles(this.ctx);

        // 7. Draw Birds flying in sky
        this.scenery.drawBirds(this.ctx);

        // 8. Speed Lines when in Nitro mode
        if (this.player.isNitroActive) {
            this.drawSpeedLines();
        }

        // 9. UI & HUD Overlay
        if (this.state === 'PLAYING') {
            this.ui.drawHUD(this.ctx);
        } else if (this.state === 'START') {
            this.ui.drawStartScreen(this.ctx);
        } else if (this.state === 'GAMEOVER') {
            this.ui.drawHUD(this.ctx);
            if (!this.gameOverClosed) {
                this.ui.drawGameOverScreen(this.ctx, this.gameOverReason);
            }
        } else if (this.state === 'PAUSED') {
            this.ui.drawHUD(this.ctx);
            this.ui.drawPauseScreen(this.ctx);
        }

        this.ctx.restore();
    }

    drawSpeedLines() {
        this.ctx.save();
        this.ctx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
        this.ctx.lineWidth = 3;
        for (let i = 0; i < 20; i++) {
            const x = MathUtils.randRange(20, 1060);
            const y = MathUtils.randRange(0, 1920);
            const len = MathUtils.randRange(60, 180);
            this.ctx.beginPath();
            this.ctx.moveTo(x, y);
            this.ctx.lineTo(x, y + len);
            this.ctx.stroke();
        }
        this.ctx.restore();
    }
}

window.Game = Game;

