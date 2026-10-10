/**
 * Main Game Controller for Attack to Ship (1080x1920 layout)
 * Enhanced gameplay, modern cyber-naval UI, sound toggle, and Game Over navigation
 */

class AttackToShipGame {
    constructor() {
        this.state = 'MENU'; // 'MENU', 'PLAYING', 'PAUSED', 'GAMEOVER'
        this.score = 60; // Start with score as in demo
        this.highScore = parseInt(localStorage.getItem('attack_to_ship_highscore') || '120', 10);
        this.enemiesDestroyed = 0;
        this.comboCount = 0;
        this.comboTimer = 0;

        this.player = null;
        this.depthCharges = [];
        this.submarines = [];
        this.torpedoes = [];
        this.powerups = [];
        this.particles = new ParticleSystem();

        this.spawnTimer = 0;
        this.sonarTimer = 6.0;
        this.bossSpawnScore = 150;
        this.bossActive = false;

        // Screen shake system
        this.shakeDuration = 0;
        this.shakeMagnitude = 0;
        this.shakeOffset = { x: 0, y: 0 };

        // Depth lanes for submarines (Y coordinates in 1080x1920)
        this.depthLanes = [
            { y: 840, type: 'scout' },
            { y: 1040, type: 'patrol' },
            { y: 1280, type: 'military' },
            { y: 1540, type: 'scout' },
            { y: 1680, type: 'patrol' }
        ];

        // Touch & UI control buttons geometry
        // Touch & UI control buttons geometry matching demo.jpg
        this.controls = {
            // HUD Top Bar Buttons
            gamepadBtn: { x: 36, y: 32, w: 90, h: 90 },
            soundBtn: { x: 780, y: 16, w: 130, h: 126 },
            pauseBtn: { x: 934, y: 32, w: 90, h: 90 },

            // Bottom Gameplay Touch Controls (Chevron Steer Arrows & Hex Bomb)
            leftBtn: { x: 35, y: 1660, w: 175, h: 175 },
            rightBtn: { x: 235, y: 1660, w: 175, h: 175 },
            bombBtn: { x: 825, y: 1630, w: 215, h: 215 },

            // Menu Screen Button
            menuStartBtn: { x: 290, y: 1330, w: 500, h: 110 },

            // Game Over Screen Buttons
            playAgainBtn: { x: 280, y: 1070, w: 520, h: 96 },
            homeBtn: { x: 280, y: 1195, w: 520, h: 90 },

            // Pause Menu Buttons
            pauseResumeBtn: { x: 310, y: 910, w: 460, h: 90 },
            pauseSoundBtn: { x: 310, y: 1025, w: 460, h: 86 },
            pauseHomeBtn: { x: 310, y: 1135, w: 460, h: 86 }
        };

        this.activePointers = new Map();
        this.isLeftPressed = false;
        this.isRightPressed = false;
        this.isBombPressed = false;
        this.isDraggingShip = false;
        this.dragPointerId = null;
        this.dragOffsetX = 0;
    }

    startNewGame() {
        this.score = 0;
        this.enemiesDestroyed = 0;
        this.comboCount = 0;
        this.comboTimer = 0;
        this.shakeDuration = 0;
        this.shakeMagnitude = 0;
        this.shakeOffset = { x: 0, y: 0 };

        this.player = new PlayerShip(420, 500);
        this.depthCharges = [];
        this.submarines = [];
        this.torpedoes = [];
        this.powerups = [];
        this.particles = new ParticleSystem();
        this.spawnTimer = 1.0;
        this.sonarTimer = 5.0;
        this.bossSpawnScore = 120;
        this.bossActive = false;
        this.isDraggingShip = false;
        this.dragPointerId = null;
        this.state = 'PLAYING';

        // Pre-populate initial wave of submarines
        this.spawnInitialWave();
    }

    goToMenu() {
        this.state = 'MENU';
        this.bossActive = false;
        this.depthCharges = [];
        this.torpedoes = [];
        this.isDraggingShip = false;
        this.dragPointerId = null;
    }

    triggerScreenShake(magnitude = 10, duration = 0.25) {
        this.shakeMagnitude = Math.max(this.shakeMagnitude, magnitude);
        this.shakeDuration = Math.max(this.shakeDuration, duration);
    }

    spawnInitialWave() {
        // Red scout sub
        this.submarines.push(new Submarine('scout', 120, 1540, 1));
        // Patrol sub
        this.submarines.push(new Submarine('patrol', 680, 1040, -1));
        // Military sub
        this.submarines.push(new Submarine('military', 380, 1280, 1));
        // Golden badge floating up
        this.powerups.push(new ShieldBadge(520, 950));
    }

    spawnSubmarine() {
        // Pick a random lane
        const lane = this.depthLanes[Math.floor(Math.random() * this.depthLanes.length)];
        const dir = Math.random() < 0.5 ? 1 : -1;
        const startX = dir === 1 ? -380 : 1080 + 380;

        // Choose submarine type based on score progression
        let type = 'scout';
        const r = Math.random();
        if (this.score > 40 && r < 0.4) {
            type = 'patrol';
        } else if (this.score > 80 && r < 0.7) {
            type = 'military';
        }

        this.submarines.push(new Submarine(type, startX, lane.y, dir));
    }

    spawnBoss() {
        if (this.bossActive) return;
        this.bossActive = true;
        const bossType = Math.random() < 0.5 ? 'boss_shark' : 'boss_dreadnought';
        const dir = Math.random() < 0.5 ? 1 : -1;
        const startX = dir === 1 ? -550 : 1080 + 550;
        const bossY = 1120;

        this.submarines.push(new BossSubmarine(bossType, startX, bossY, dir));
        window.soundEngine.playBossWarning();
        this.triggerScreenShake(12, 0.4);
        this.particles.addFloatingText('⚠️ WARNING: BOSS APPROACHING! ⚠️', 540, 750, '#ff1744', 44);
    }

    onKeyDown(code) {
        if (code === 'KeyM') {
            window.soundEngine.toggleMute();
            return;
        }

        if (this.state === 'MENU') {
            if (code === 'Space' || code === 'Enter') {
                window.soundEngine.playUIClick();
                this.startNewGame();
            }
            return;
        }

        if (this.state === 'GAMEOVER') {
            if (code === 'Space' || code === 'Enter' || code === 'KeyR') {
                window.soundEngine.playUIClick();
                this.startNewGame();
            } else if (code === 'KeyH' || code === 'Escape') {
                window.soundEngine.playUIClick();
                this.goToMenu();
            }
            return;
        }

        if (code === 'KeyP' || code === 'Escape') {
            this.togglePause();
            return;
        }

        if (this.state === 'PAUSED') {
            if (code === 'KeyH') {
                window.soundEngine.playUIClick();
                this.goToMenu();
            }
            return;
        }

        if (this.state === 'PLAYING') {
            if (code === 'ArrowLeft' || code === 'KeyA') {
                this.isLeftPressed = true;
            }
            if (code === 'ArrowRight' || code === 'KeyD') {
                this.isRightPressed = true;
            }
            if (code === 'Space' || code === 'ArrowDown' || code === 'KeyS') {
                this.isBombPressed = true;
                this.triggerBombDrop();
            }
        }
    }

    onKeyUp(code) {
        if (code === 'ArrowLeft' || code === 'KeyA') {
            this.isLeftPressed = false;
        }
        if (code === 'ArrowRight' || code === 'KeyD') {
            this.isRightPressed = false;
        }
        if (code === 'Space' || code === 'ArrowDown' || code === 'KeyS') {
            this.isBombPressed = false;
        }
    }

    onPointerDown(pointerId, x, y) {
        this.activePointers.set(pointerId, { x, y });

        // Universal Sound Button check (top right in HUD)
        if (this.isPointInRect(x, y, this.controls.soundBtn)) {
            window.soundEngine.toggleMute();
            return;
        }

        // Tactical Briefing / Gamepad Button check (top left in HUD)
        if (this.isPointInRect(x, y, this.controls.gamepadBtn)) {
            window.soundEngine.playUIClick();
            this.togglePause();
            return;
        }

        if (this.state === 'MENU') {
            if (this.isPointInRect(x, y, this.controls.menuStartBtn) || y > 700) {
                window.soundEngine.playUIClick();
                this.startNewGame();
            }
            return;
        }

        if (this.state === 'GAMEOVER') {
            // Play Again Button clicked
            if (this.isPointInRect(x, y, this.controls.playAgainBtn)) {
                window.soundEngine.playUIClick();
                this.startNewGame();
                return;
            }

            // Back to Home Button clicked (under Play Again)
            if (this.isPointInRect(x, y, this.controls.homeBtn)) {
                window.soundEngine.playUIClick();
                this.goToMenu();
                return;
            }
            return;
        }

        if (this.state === 'PAUSED') {
            if (this.isPointInRect(x, y, this.controls.pauseResumeBtn)) {
                window.soundEngine.playUIClick();
                this.state = 'PLAYING';
                return;
            }
            if (this.isPointInRect(x, y, this.controls.pauseSoundBtn)) {
                window.soundEngine.toggleMute();
                return;
            }
            if (this.isPointInRect(x, y, this.controls.pauseHomeBtn)) {
                window.soundEngine.playUIClick();
                this.goToMenu();
                return;
            }
            this.state = 'PLAYING';
            return;
        }

        // Check Pause button
        if (this.isPointInRect(x, y, this.controls.pauseBtn)) {
            this.togglePause();
            return;
        }

        // Check Touch Controls
        this.updateTouchInputs();

        // Bomb Button
        if (this.isPointInRect(x, y, this.controls.bombBtn)) {
            this.triggerBombDrop();
            return;
        }

        // Tap or Drag to move ship directly on the ship or surface water lane
        if (this.player && this.state === 'PLAYING') {
            const shipHitbox = {
                x: this.player.x - 50,
                y: this.player.y - 70,
                w: this.player.width + 100,
                h: this.player.height + 150
            };
            const isNearSurface = (y >= 300 && y <= 750);

            if (this.isPointInRect(x, y, shipHitbox) || isNearSurface) {
                this.isDraggingShip = true;
                this.dragPointerId = pointerId;

                if (x >= this.player.x && x <= this.player.x + this.player.width) {
                    this.dragOffsetX = x - this.player.x;
                } else {
                    this.dragOffsetX = this.player.width / 2;
                    const minX = 20;
                    const maxX = 1080 - this.player.width - 20;
                    this.player.targetX = Math.max(minX, Math.min(maxX, x - this.dragOffsetX));
                }
            }
        }
    }

    onPointerMove(pointerId, x, y) {
        if (this.activePointers.has(pointerId)) {
            this.activePointers.set(pointerId, { x, y });
            this.updateTouchInputs();

            // Direct dragging of ship follows finger/pointer smoothly
            if (this.isDraggingShip && this.dragPointerId === pointerId && this.player) {
                const targetX = x - this.dragOffsetX;
                const minX = 20;
                const maxX = 1080 - this.player.width - 20;
                this.player.x = Math.max(minX, Math.min(maxX, targetX));
                this.player.targetX = null;
            }
        }
    }

    onPointerUp(pointerId) {
        this.activePointers.delete(pointerId);
        this.updateTouchInputs();

        if (this.dragPointerId === pointerId) {
            this.isDraggingShip = false;
            this.dragPointerId = null;
        }
    }

    updateTouchInputs() {
        let left = false;
        let right = false;
        let bomb = false;

        for (const pt of this.activePointers.values()) {
            if (this.isPointInRect(pt.x, pt.y, this.controls.leftBtn)) {
                left = true;
            }
            if (this.isPointInRect(pt.x, pt.y, this.controls.rightBtn)) {
                right = true;
            }
            if (this.isPointInRect(pt.x, pt.y, this.controls.bombBtn)) {
                bomb = true;
            }
        }

        this.isLeftPressed = left;
        this.isRightPressed = right;
        this.isBombPressed = bomb;
    }

    isPointInRect(px, py, rect) {
        return px >= rect.x && px <= rect.x + rect.w &&
               py >= rect.y && py <= rect.y + rect.h;
    }

    triggerBombDrop() {
        if (this.player && this.state === 'PLAYING') {
            const bomb = this.player.createBomb();
            if (bomb) {
                this.depthCharges.push(bomb);
                this.particles.addWaterRipple(bomb.x, 576);
            }
        }
    }

    togglePause() {
        window.soundEngine.playUIClick();
        if (this.state === 'PLAYING') {
            this.state = 'PAUSED';
        } else if (this.state === 'PAUSED') {
            this.state = 'PLAYING';
        }
    }

    update(dt) {
        // Screen shake decay
        if (this.shakeDuration > 0) {
            this.shakeDuration -= dt;
            const decay = Math.max(0, this.shakeDuration / 0.35);
            this.shakeOffset.x = (Math.random() * 2 - 1) * this.shakeMagnitude * decay;
            this.shakeOffset.y = (Math.random() * 2 - 1) * this.shakeMagnitude * decay;
        } else {
            this.shakeOffset.x = 0;
            this.shakeOffset.y = 0;
            this.shakeMagnitude = 0;
        }

        if (this.state !== 'PLAYING') {
            this.particles.update(dt);
            return;
        }

        // Combo timer countdown
        if (this.comboTimer > 0) {
            this.comboTimer -= dt;
            if (this.comboTimer <= 0) {
                this.comboCount = 0;
            }
        }

        // Update player movement direction from inputs (unless directly dragged)
        if (!this.isDraggingShip) {
            if (this.isLeftPressed && !this.isRightPressed) {
                this.player.moveDir = -1;
                this.player.targetX = null;
            } else if (this.isRightPressed && !this.isLeftPressed) {
                this.player.moveDir = 1;
                this.player.targetX = null;
            } else {
                this.player.moveDir = 0;
            }
        } else {
            this.player.moveDir = 0;
        }

        this.player.update(dt, this.particles);

        // Continuous bomb drop when held
        if (this.isBombPressed) {
            this.triggerBombDrop();
        }

        // Ambient sonar sound
        this.sonarTimer -= dt;
        if (this.sonarTimer <= 0) {
            window.soundEngine.playSonar();
            this.sonarTimer = 9.0 + Math.random() * 5.0;
        }

        // Submarine Spawner
        this.spawnTimer -= dt;
        if (this.spawnTimer <= 0) {
            this.spawnTimer = 2.4 + Math.random() * 2.0;
            if (this.submarines.length < 5) {
                this.spawnSubmarine();
            }
        }

        // Boss trigger
        if (this.score >= this.bossSpawnScore && !this.bossActive) {
            this.spawnBoss();
            this.bossSpawnScore += 160;
        }

        // Update depth charges
        for (let i = this.depthCharges.length - 1; i >= 0; i--) {
            const bomb = this.depthCharges[i];
            bomb.update(dt, this.particles);
            if (bomb.dead) {
                this.depthCharges.splice(i, 1);
            }
        }

        // Update enemy torpedoes
        for (let i = this.torpedoes.length - 1; i >= 0; i--) {
            const torp = this.torpedoes[i];
            torp.update(dt, this.particles);

            // Collision check: Torpedo vs Player Shield or Player Ship
            const torpHitbox = torp.getHitbox();
            const shieldBox = this.player.getShieldHitbox();
            const shipBox = this.player.getHitbox();

            if (shieldBox && this.checkOverlap(torpHitbox, shieldBox)) {
                // Torpedo strikes shield!
                torp.dead = true;
                const shieldResult = this.player.hitShield(this.particles);
                this.particles.addExplosion(torp.x, torp.y, 0.9);

                if (shieldResult && shieldResult.broken) {
                    // 2nd hit: shield is completely finished!
                    this.triggerScreenShake(12, 0.3);
                    this.particles.addFloatingText('💥 SHIELD BROKEN!', this.player.x + 150, this.player.y - 45, '#ff1744', 44);
                } else {
                    // 1st hit: shield absorbed and turned RED!
                    this.triggerScreenShake(8, 0.22);
                    this.particles.addFloatingText('⚠️ SHIELD DAMAGED! (1 HIT LEFT)', this.player.x + 150, this.player.y - 45, '#ff5252', 40);
                }
            } else if (this.checkOverlap(torpHitbox, shipBox)) {
                // Ship hit!
                torp.dead = true;
                const damaged = this.player.takeDamage(this.particles);
                this.triggerScreenShake(16, 0.4);
                this.particles.addExplosion(torp.x, torp.y, 1.2);
                if (damaged && damaged.playerHit) {
                    this.particles.addFloatingText('-1 ❤️', this.player.x + 150, this.player.y - 20, '#ff1744', 44);
                    if (this.player.health <= 0) {
                        this.gameOver();
                    }
                }
            }

            if (torp.dead) {
                this.torpedoes.splice(i, 1);
            }
        }

        // Update submarines & bosses
        for (let i = this.submarines.length - 1; i >= 0; i--) {
            const sub = this.submarines[i];
            if (sub instanceof BossSubmarine) {
                sub.update(dt, this.torpedoes, this.powerups, this.particles);
            } else {
                sub.update(dt, this.torpedoes, this.particles);
            }

            // Collision check: Depth Charge vs Submarine
            const subHitbox = sub.getHitbox();
            for (let j = this.depthCharges.length - 1; j >= 0; j--) {
                const bomb = this.depthCharges[j];
                const bombHitbox = bomb.getHitbox();

                if (this.checkOverlap(bombHitbox, subHitbox)) {
                    bomb.dead = true;
                    this.particles.addExplosion(bomb.x, bomb.y, 1.1);

                    if (sub instanceof BossSubmarine) {
                        const defeated = sub.takeHit(this.powerups);
                        this.score += 5;
                        this.triggerScreenShake(6, 0.18);
                        this.particles.addFloatingText('+5', bomb.x, bomb.y - 20, '#ffd54f', 36);
                        window.soundEngine.playExplosion(false);

                        if (defeated) {
                            this.bossActive = false;
                            this.enemiesDestroyed += 3;
                            this.score += sub.points;
                            this.triggerScreenShake(22, 0.6);
                            this.particles.addExplosion(sub.x + sub.width / 2, sub.y + sub.height / 2, 2.4);
                            this.particles.addFloatingText(`+${sub.points} BOSS DESTROYED!`, sub.x + sub.width / 2, sub.y - 40, '#ffea00', 48);
                            window.soundEngine.playExplosion(true);
                        }
                    } else {
                        const destroyed = sub.takeHit();
                        if (destroyed) {
                            this.enemiesDestroyed++;
                            this.triggerScreenShake(8, 0.22);

                            // Combo logic
                            if (this.comboTimer > 0) {
                                this.comboCount++;
                                const comboBonus = this.comboCount * 10;
                                this.score += (sub.points + comboBonus);
                                window.soundEngine.playCombo(this.comboCount);
                                this.particles.addFloatingText(`COMBO x${this.comboCount}! +${sub.points + comboBonus}`, bomb.x, bomb.y - 55, '#00e5ff', 40);
                            } else {
                                this.comboCount = 1;
                                this.score += sub.points;
                                this.particles.addFloatingText(`+${sub.points}`, bomb.x, bomb.y - 20, '#ffd54f', 38);
                            }
                            this.comboTimer = 3.2;

                            this.particles.addExplosion(sub.x + sub.width / 2, sub.y + sub.height / 2, 1.3);
                            window.soundEngine.playExplosion(false);

                            // Chance to drop shield badge (15%) or heart life (12% if injured)
                            const dropRoll = Math.random();
                            if (dropRoll < 0.15) {
                                this.powerups.push(new ShieldBadge(sub.x + sub.width / 2, sub.y));
                            } else if (dropRoll < 0.28 && this.player.health < this.player.maxHealth) {
                                this.powerups.push(new HeartPickup(sub.x + sub.width / 2, sub.y));
                            }
                        } else {
                            this.score += 5;
                            this.triggerScreenShake(4, 0.12);
                            this.particles.addFloatingText('+5', bomb.x, bomb.y - 20, '#ffd54f', 32);
                        }
                    }
                    break;
                }
            }

            if (sub.dead) {
                if (sub instanceof BossSubmarine) {
                    this.bossActive = false;
                }
                this.submarines.splice(i, 1);
            }
        }

        // Update powerups (Shield Badge & Heart)
        for (let i = this.powerups.length - 1; i >= 0; i--) {
            const pw = this.powerups[i];
            pw.update(dt);

            // Check collection by player ship
            const pwHitbox = pw.getHitbox();
            const shipHitbox = this.player.getHitbox();

            if (this.checkOverlap(pwHitbox, shipHitbox)) {
                pw.dead = true;
                if (pw instanceof HeartPickup) {
                    if (this.player.health < this.player.maxHealth) {
                        this.player.health++;
                        window.soundEngine.playPowerUp();
                        this.particles.addFloatingText('+1 ❤️ LIFE RESTORED!', this.player.x + 150, this.player.y - 40, '#ff1744', 44);
                    } else {
                        this.score += 25;
                        window.soundEngine.playPowerUp();
                        this.particles.addFloatingText('+25 BONUS!', this.player.x + 150, this.player.y - 40, '#ffd54f', 40);
                    }
                } else {
                    const dur = Math.floor(Math.random() * (12 - 6 + 1)) + 6; // random(6, 12)
                    this.player.activateShield(dur);
                    window.soundEngine.playPowerUp();
                    this.particles.addFloatingText(`🛡️ SHIELD ACTIVATED (${dur}s)!`, this.player.x + 150, this.player.y - 40, '#00e5ff', 42);
                }
            }

            if (pw.dead) {
                this.powerups.splice(i, 1);
            }
        }

        // Update particles
        this.particles.update(dt);

        // Update high score
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('attack_to_ship_highscore', this.highScore.toString());
        }
    }

    checkOverlap(r1, r2) {
        return r1.x < r2.x + r2.width &&
               r1.x + r1.width > r2.x &&
               r1.y < r2.y + r2.height &&
               r1.y + r1.height > r2.y;
    }

    gameOver() {
        this.state = 'GAMEOVER';
        this.triggerScreenShake(20, 0.5);
        window.soundEngine.playGameOver();
    }

    render(ctx, images) {
        // Draw World with Screen Shake
        ctx.save();
        if (this.shakeMagnitude > 0) {
            ctx.translate(this.shakeOffset.x, this.shakeOffset.y);
        }

        // Draw Full Background (Sky & Ocean)
        const bgImg = images['bg_sky_water'];
        if (bgImg && bgImg.complete) {
            ctx.drawImage(bgImg, 0, 0, 1080, 1920);
        } else {
            ctx.fillStyle = '#429bd6';
            ctx.fillRect(0, 0, 1080, 1920);
        }

        // Draw Submarines & Bosses
        for (const sub of this.submarines) {
            sub.render(ctx, images);
        }

        // Draw Powerups (Golden Badge & Heart)
        for (const pw of this.powerups) {
            pw.render(ctx, images);
        }

        // Draw Depth Charges
        for (const bomb of this.depthCharges) {
            bomb.render(ctx, images);
        }

        // Draw Enemy Torpedoes
        for (const torp of this.torpedoes) {
            torp.render(ctx, images);
        }

        // Draw Particles, Explosions, Floating Texts
        this.particles.render(ctx, images);

        // Draw Player Ship & Shield
        if (this.player) {
            this.player.render(ctx, images);
        }

        ctx.restore();

        // Draw HUD (Score, High Score, Hearts, Top Buttons)
        this.renderHUD(ctx, images);

        // Draw Touch Controls (Left/Right Arrows, Bomb Button)
        if (this.state === 'PLAYING') {
            this.renderTouchControls(ctx, images);
        }

        // Draw Screen Overlays (Menu, Paused, Game Over)
        if (this.state === 'MENU') {
            this.renderMenuOverlay(ctx);
        } else if (this.state === 'PAUSED') {
            this.renderPauseOverlay(ctx);
        } else if (this.state === 'GAMEOVER') {
            this.renderGameOverOverlay(ctx, images);
        }
    }

    renderHUD(ctx, images) {
        ctx.save();

        const hudX = 20, hudY = 20, hudW = 1040, hudH = 126, hudR = 24;

        // --- 1. TOP CONSOLE BAR BACKGROUND (matching demo.jpg) ---
        ctx.shadowColor = 'rgba(0, 229, 255, 0.45)';
        ctx.shadowBlur = 18;

        const hudGrad = ctx.createLinearGradient(hudX, hudY, hudX, hudY + hudH);
        hudGrad.addColorStop(0, '#0c2438');
        hudGrad.addColorStop(0.5, '#071624');
        hudGrad.addColorStop(1, '#030a12');
        ctx.fillStyle = hudGrad;
        ctx.roundRect(hudX, hudY, hudW, hudH, hudR);
        ctx.fill();

        ctx.strokeStyle = '#00e5ff';
        ctx.lineWidth = 2.5;
        ctx.roundRect(hudX, hudY, hudW, hudH, hudR);
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Top Glass highlight line
        const rimGrad = ctx.createLinearGradient(hudX + 50, hudY, hudX + hudW - 50, hudY);
        rimGrad.addColorStop(0, 'rgba(0, 229, 255, 0)');
        rimGrad.addColorStop(0.5, 'rgba(0, 229, 255, 0.5)');
        rimGrad.addColorStop(1, 'rgba(0, 229, 255, 0)');
        ctx.strokeStyle = rimGrad;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(hudX + 50, hudY + 3);
        ctx.lineTo(hudX + hudW - 50, hudY + 3);
        ctx.stroke();

        // --- 2. TOP CENTER TRAPEZOID TECH TAB (\\\ • TACTICAL RADAR ONLINE ///) ---
        const tabW = 380, tabH = 22, tabTopY = hudY - 14;
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(540 - tabW / 2 + 20, tabTopY);
        ctx.lineTo(540 + tabW / 2 - 20, tabTopY);
        ctx.lineTo(540 + tabW / 2, hudY + 2);
        ctx.lineTo(540 - tabW / 2, hudY + 2);
        ctx.closePath();
        ctx.fillStyle = '#091e30';
        ctx.fill();
        ctx.strokeStyle = '#00e5ff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Angled slashes on left \\\ and right ///
        ctx.strokeStyle = '#00e5ff';
        ctx.lineWidth = 2.5;
        for (let i = 0; i < 3; i++) {
            // Left \\\
            const lx = 540 - tabW / 2 + 30 + i * 8;
            ctx.beginPath();
            ctx.moveTo(lx + 6, tabTopY + 4);
            ctx.lineTo(lx, tabTopY + 16);
            ctx.stroke();
            // Right ///
            const rx = 540 + tabW / 2 - 30 - i * 8;
            ctx.beginPath();
            ctx.moveTo(rx - 6, tabTopY + 4);
            ctx.lineTo(rx, tabTopY + 16);
            ctx.stroke();
        }

        // Tab Text
        ctx.font = "800 15px 'Segoe UI', Impact, Arial, sans-serif";
        ctx.fillStyle = '#00e5ff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('• TACTICAL RADAR ONLINE', 540, tabTopY + tabH / 2);
        ctx.restore();

        // --- 3. TOP LEFT: GAMEPAD / BRIEFING BUTTON MODULE ---
        const gBtn = this.controls.gamepadBtn;
        ctx.save();
        ctx.fillStyle = '#091c2c';
        ctx.roundRect(gBtn.x, gBtn.y, gBtn.w, gBtn.h, 20);
        ctx.fill();
        ctx.strokeStyle = '#00e5ff';
        ctx.lineWidth = 2.5;
        ctx.roundRect(gBtn.x, gBtn.y, gBtn.w, gBtn.h, 20);
        ctx.stroke();

        const padImg = images['btn_gamepad'];
        if (padImg && padImg.complete) {
            ctx.drawImage(padImg, gBtn.x + 14, gBtn.y + 14, gBtn.w - 28, gBtn.h - 28);
        } else {
            ctx.font = "42px sans-serif";
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('🎮', gBtn.x + gBtn.w / 2, gBtn.y + gBtn.h / 2);
        }
        ctx.restore();

        // --- 4. TOP RIGHT: AUDIO BUTTON MODULE (Raised Mechanical Chassis matching demo.jpg) ---
        this.renderSoundButton(ctx, this.controls.soundBtn.x, this.controls.soundBtn.y, this.controls.soundBtn.w, this.controls.soundBtn.h);

        // --- 5. TOP RIGHT: PAUSE BUTTON MODULE ---
        const pBtn = this.controls.pauseBtn;
        ctx.save();
        ctx.fillStyle = '#091c2c';
        ctx.roundRect(pBtn.x, pBtn.y, pBtn.w, pBtn.h, 20);
        ctx.fill();
        ctx.strokeStyle = '#00e5ff';
        ctx.lineWidth = 2.5;
        ctx.roundRect(pBtn.x, pBtn.y, pBtn.w, pBtn.h, 20);
        ctx.stroke();

        const pauseImg = images['btn_pause'];
        if (pauseImg && pauseImg.complete) {
            ctx.drawImage(pauseImg, pBtn.x + 14, pBtn.y + 14, pBtn.w - 28, pBtn.h - 28);
        } else {
            ctx.fillStyle = '#00e5ff';
            ctx.fillRect(pBtn.x + 28, pBtn.y + 26, 12, 38);
            ctx.fillRect(pBtn.x + 50, pBtn.y + 26, 12, 38);
        }
        ctx.restore();

        // --- 6. CENTER HUD: SCORE: 30 (Gradient Block Text matching demo.jpg) ---
        ctx.save();
        ctx.font = "900 64px 'Impact', 'Rajdhani', Arial Black, sans-serif";
        ctx.textAlign = 'center';
        ctx.textBaseline = 'alphabetic';

        // Gradient from White to Bright Icy Cyan
        const scoreGrad = ctx.createLinearGradient(540, hudY + 34, 540, hudY + 88);
        scoreGrad.addColorStop(0, '#ffffff');
        scoreGrad.addColorStop(0.5, '#ffffff');
        scoreGrad.addColorStop(1, '#9cecfb');

        ctx.shadowColor = 'rgba(0, 229, 255, 0.85)';
        ctx.shadowBlur = 16;
        ctx.fillStyle = scoreGrad;
        ctx.fillText(`SCORE: ${this.score}`, 540, hudY + 80);
        ctx.shadowBlur = 0;

        // Subtitle: 🏆 BEST: 270 (matching demo.jpg)
        ctx.font = "800 24px 'Segoe UI', Impact, Arial, sans-serif";
        ctx.fillStyle = '#ffffff';
        let subText = `🏆 BEST: ${this.highScore}`;
        if (this.comboCount > 1 && this.comboTimer > 0) {
            subText += `   |   🔥 x${this.comboCount}`;
        }
        ctx.fillText(subText, 540, hudY + 114);
        ctx.restore();

        // --- 7. UPPER SLOT: HULL / LIVES CONTAINER (matching demo.jpg middle slot) ---
        if (this.player) {
            const heartImg = images['heart'];
            const emptyHeartImg = images['heart_empty'];
            const slotW = 420, slotH = 58;
            const slotX = 540 - slotW / 2, slotY = 164;

            ctx.save();
            const slotGrad = ctx.createLinearGradient(slotX, slotY, slotX, slotY + slotH);
            slotGrad.addColorStop(0, '#0a2236');
            slotGrad.addColorStop(1, '#05111c');
            ctx.fillStyle = slotGrad;
            ctx.roundRect(slotX, slotY, slotW, slotH, 18);
            ctx.fill();

            const isCritical = (this.player.health === 1);
            ctx.strokeStyle = isCritical ? '#ff1744' : '#00e5ff';
            ctx.lineWidth = 2.5;
            ctx.shadowColor = isCritical ? 'rgba(255, 23, 68, 0.5)' : 'rgba(0, 229, 255, 0.4)';
            ctx.shadowBlur = 10;
            ctx.roundRect(slotX, slotY, slotW, slotH, 18);
            ctx.stroke();
            ctx.shadowBlur = 0;

            // Label on left
            ctx.font = "900 22px 'Segoe UI', Impact, Arial, sans-serif";
            ctx.fillStyle = isCritical ? '#ff5252' : '#00e5ff';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillText('🛡️ HULL:', slotX + 26, slotY + slotH / 2);

            // 3 Hearts on right
            const heartSize = 46, gap = 14;
            const heartsStartX = slotX + 155;
            for (let i = 0; i < this.player.maxHealth; i++) {
                const hx = heartsStartX + i * (heartSize + gap);
                const isAlive = i < this.player.health;

                ctx.save();
                let pulse = 1.0;
                if (isAlive) {
                    const pulseSpeed = isCritical ? 12 : 4.5;
                    const pulseIntensity = isCritical ? 0.16 : 0.08;
                    pulse = 1.0 + Math.sin(this.player.time * pulseSpeed + i * 0.45) * pulseIntensity;
                }

                ctx.translate(hx + heartSize / 2, slotY + slotH / 2);
                ctx.scale(pulse, pulse);

                const currentImg = isAlive ? heartImg : emptyHeartImg;
                if (currentImg && currentImg.complete) {
                    ctx.drawImage(currentImg, -heartSize / 2, -heartSize / 2, heartSize, heartSize);
                } else {
                    ctx.fillStyle = isAlive ? '#ff1744' : 'rgba(120, 130, 140, 0.4)';
                    ctx.font = "38px sans-serif";
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(isAlive ? '❤️' : '🖤', 0, 0);
                }
                ctx.restore();
            }
            ctx.restore();

            // --- 8. SCI-FI TECH SHIELD DEFLECTOR FRAME (matching demo.jpg) ---
            const frameW = 680, frameH = 82;
            const frameX = 540 - frameW / 2, frameY = 240;
            const hasShield = this.player.hasShield;
            const sPct = hasShield ? Math.max(0, Math.min(1, this.player.shieldTimer / this.player.maxShieldTime)) : 0;
            const isDamaged = hasShield && (this.player.shieldHp === 1);
            const isLowTime = hasShield && (this.player.shieldTimer < 3.0);
            const flash = (isDamaged || isLowTime) && (Math.sin(this.player.time * 16) > 0);
            const frameColor = isDamaged ? '#ff1744' : (isLowTime && flash ? '#ff5252' : '#00e5ff');

            ctx.save();

            // Sci-fi outer polygon with notched/chamfered corners
            const ch = 18; // chamfer size
            ctx.beginPath();
            ctx.moveTo(frameX + ch, frameY);
            ctx.lineTo(frameX + frameW - ch, frameY);
            ctx.lineTo(frameX + frameW, frameY + ch);
            ctx.lineTo(frameX + frameW, frameY + frameH - ch);
            ctx.lineTo(frameX + frameW - ch, frameY + frameH);
            ctx.lineTo(frameX + ch, frameY + frameH);
            ctx.lineTo(frameX, frameY + frameH - ch);
            ctx.lineTo(frameX, frameY + ch);
            ctx.closePath();

            const fGrad = ctx.createLinearGradient(frameX, frameY, frameX, frameY + frameH);
            fGrad.addColorStop(0, '#0b2034');
            fGrad.addColorStop(0.5, '#061424');
            fGrad.addColorStop(1, '#020912');
            ctx.fillStyle = fGrad;
            ctx.fill();

            ctx.strokeStyle = frameColor;
            ctx.lineWidth = 2.8;
            ctx.shadowColor = frameColor;
            ctx.shadowBlur = hasShield ? 16 : 8;
            ctx.stroke();
            ctx.shadowBlur = 0;

            // Left & Right Sci-Fi Wings with 3 horizontal vent slats (matching demo.jpg!)
            ctx.strokeStyle = frameColor;
            ctx.lineWidth = 3;
            for (let v = 0; v < 3; v++) {
                const vy = frameY + 24 + v * 16;
                // Left slats
                ctx.beginPath();
                ctx.moveTo(frameX + 16, vy);
                ctx.lineTo(frameX + 38, vy);
                ctx.stroke();
                // Right slats
                ctx.beginPath();
                ctx.moveTo(frameX + frameW - 38, vy);
                ctx.lineTo(frameX + frameW - 16, vy);
                ctx.stroke();
            }

            // Top Status Line inside Frame
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.font = "900 20px 'Segoe UI', Impact, Arial, sans-serif";
            if (hasShield) {
                if (isDamaged) {
                    ctx.fillStyle = '#ff5252';
                    ctx.fillText('⚠️ DEFLECTOR: 1 HIT LEFT!', frameX + 56, frameY + 24);
                } else {
                    ctx.fillStyle = '#00e5ff';
                    ctx.fillText('⚡ DEFLECTOR: 2/2 HITS', frameX + 56, frameY + 24);
                }
                // Right Countdown text
                ctx.textAlign = 'right';
                ctx.font = "900 24px 'Impact', 'Segoe UI', Arial Black, sans-serif";
                ctx.fillStyle = '#ffffff';
                ctx.fillText(`⏱ ${Math.ceil(this.player.shieldTimer)}s REMAINING`, frameX + frameW - 56, frameY + 24);
            } else {
                ctx.fillStyle = 'rgba(0, 229, 255, 0.5)';
                ctx.fillText('DEFLECTOR SYSTEM [STANDBY]', frameX + 56, frameY + 24);
                ctx.textAlign = 'right';
                ctx.font = "700 18px 'Segoe UI', sans-serif";
                ctx.fillText('READY', frameX + frameW - 56, frameY + 24);
            }

            // Inner Glowing Energy Beam Track Slot (matching demo.jpg!)
            const slotTrackX = frameX + 54;
            const slotTrackY = frameY + 44;
            const slotTrackW = frameW - 108;
            const slotTrackH = 22;

            ctx.fillStyle = '#030d18';
            ctx.roundRect(slotTrackX, slotTrackY, slotTrackW, slotTrackH, 11);
            ctx.fill();
            ctx.strokeStyle = 'rgba(0, 229, 255, 0.4)';
            ctx.lineWidth = 1.5;
            ctx.roundRect(slotTrackX, slotTrackY, slotTrackW, slotTrackH, 11);
            ctx.stroke();

            // Glowing Cyan Energy Laser Beam Fill
            if (hasShield && sPct > 0) {
                const fillW = Math.max(22, slotTrackW * sPct);
                const beamGrad = ctx.createLinearGradient(slotTrackX, slotTrackY, slotTrackX + fillW, slotTrackY);
                if (isDamaged) {
                    beamGrad.addColorStop(0, '#ff1744');
                    beamGrad.addColorStop(0.8, '#ff9100');
                    beamGrad.addColorStop(1, '#ffffff');
                } else {
                    beamGrad.addColorStop(0, '#0091ea');
                    beamGrad.addColorStop(0.7, '#00e5ff');
                    beamGrad.addColorStop(0.95, '#b2ebf2');
                    beamGrad.addColorStop(1, '#ffffff');
                }
                ctx.fillStyle = beamGrad;
                ctx.shadowColor = frameColor;
                ctx.shadowBlur = 14;
                ctx.roundRect(slotTrackX, slotTrackY, fillW, slotTrackH, 11);
                ctx.fill();
                ctx.shadowBlur = 0;
            } else if (!hasShield) {
                // Subtle ambient glow in standby
                const idleBeam = ctx.createLinearGradient(slotTrackX, slotTrackY, slotTrackX + 80, slotTrackY);
                idleBeam.addColorStop(0, 'rgba(0, 229, 255, 0.4)');
                idleBeam.addColorStop(1, 'rgba(0, 229, 255, 0)');
                ctx.fillStyle = idleBeam;
                ctx.roundRect(slotTrackX, slotTrackY, 80, slotTrackH, 11);
                ctx.fill();
            }

            ctx.restore();
        }

        ctx.restore();
    }

    renderSoundButton(ctx, x, y, w, h) {
        ctx.save();
        const isMuted = window.soundEngine.isMuted();

        // 1. Raised Industrial Chassis (matching demo.jpg)
        const chX = x, chY = y, chW = w, chH = h;
        const bGrad = ctx.createLinearGradient(chX, chY, chX, chY + chH);
        bGrad.addColorStop(0, '#223448');
        bGrad.addColorStop(0.5, '#172535');
        bGrad.addColorStop(1, '#0e1824');

        // Beveled Chassis Polygon
        ctx.beginPath();
        ctx.moveTo(chX + 16, chY);
        ctx.lineTo(chX + chW - 16, chY);
        ctx.lineTo(chX + chW, chY + 16);
        ctx.lineTo(chX + chW, chY + chH - 24);
        ctx.lineTo(chX + chW - 24, chY + chH);
        ctx.lineTo(chX + 16, chY + chH);
        ctx.lineTo(chX, chY + chH - 16);
        ctx.lineTo(chX, chY + 16);
        ctx.closePath();

        ctx.fillStyle = bGrad;
        ctx.fill();
        ctx.strokeStyle = '#374f68';
        ctx.lineWidth = 2;
        ctx.stroke();

        // 4 Rivet Screws at corners
        ctx.fillStyle = '#64748b';
        const rivets = [
            { rx: chX + 10, ry: chY + 14 },
            { rx: chX + chW - 10, ry: chY + 14 },
            { rx: chX + 10, ry: chY + chH - 14 },
            { rx: chX + chW - 14, ry: chY + chH - 14 }
        ];
        for (const rv of rivets) {
            ctx.beginPath();
            ctx.arc(rv.rx, rv.ry, 3, 0, Math.PI * 2);
            ctx.fill();
        }

        // 4 Diagonal Ridges at bottom-right notch (matching demo.jpg!)
        ctx.strokeStyle = '#0f1722';
        ctx.lineWidth = 2.5;
        for (let r = 0; r < 4; r++) {
            const rx = chX + chW - 26 + r * 6;
            ctx.beginPath();
            ctx.moveTo(rx, chY + chH - 8);
            ctx.lineTo(rx + 6, chY + chH - 2);
            ctx.stroke();
        }

        // 2. Inner Speaker Screen Box
        const scW = chW - 32, scH = 64;
        const scX = chX + 16, scY = chY + 12;
        ctx.fillStyle = '#081e32';
        ctx.roundRect(scX, scY, scW, scH, 12);
        ctx.fill();
        ctx.strokeStyle = isMuted ? '#ff1744' : '#00e5ff';
        ctx.lineWidth = 2;
        ctx.shadowColor = isMuted ? 'rgba(255, 23, 68, 0.4)' : 'rgba(0, 229, 255, 0.4)';
        ctx.shadowBlur = 8;
        ctx.roundRect(scX, scY, scW, scH, 12);
        ctx.stroke();
        ctx.shadowBlur = 0;

        const cx = scX + scW / 2;
        const cy = scY + scH / 2;

        // Speaker icon
        ctx.fillStyle = isMuted ? '#ff5252' : '#ffffff';
        ctx.beginPath();
        ctx.fillRect(cx - 18, cy - 8, 9, 16);
        ctx.moveTo(cx - 9, cy - 8);
        ctx.lineTo(cx + 2, cy - 16);
        ctx.lineTo(cx + 2, cy + 16);
        ctx.lineTo(cx - 9, cy + 8);
        ctx.closePath();
        ctx.fill();

        if (!isMuted) {
            ctx.strokeStyle = '#00e5ff';
            ctx.lineWidth = 2.5;
            ctx.lineCap = 'round';
            // Wave 1
            ctx.beginPath();
            ctx.arc(cx + 2, cy, 10, -Math.PI / 3, Math.PI / 3);
            ctx.stroke();
            // Wave 2
            ctx.beginPath();
            ctx.arc(cx + 2, cy, 18, -Math.PI / 3, Math.PI / 3);
            ctx.stroke();
        } else {
            ctx.strokeStyle = '#ff1744';
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(cx - 18, cy - 14);
            ctx.lineTo(cx + 18, cy + 14);
            ctx.stroke();
        }

        // 3. Lower Status Capsule (AUDIO ON / AUDIO OFF matching demo.jpg)
        const pillW = scW, pillH = 26;
        const pillX = scX, pillY = scY + scH + 8;
        ctx.fillStyle = isMuted ? '#ff1744' : '#00e5ff';
        ctx.roundRect(pillX, pillY, pillW, pillH, 12);
        ctx.fill();

        ctx.font = "900 13px 'Segoe UI', Impact, Arial, sans-serif";
        ctx.fillStyle = isMuted ? '#ffffff' : '#051828';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(isMuted ? 'AUDIO OFF' : 'AUDIO ON', pillX + pillW / 2, pillY + pillH / 2 + 1);

        ctx.restore();
    }

    renderTouchControls(ctx, images) {
        ctx.save();

        // 1. Left Steer Button (Glowing Chevron Arrow matching demo.jpg)
        const lBtn = this.controls.leftBtn;
        const lCx = lBtn.x + lBtn.w / 2;
        const lCy = lBtn.y + lBtn.h / 2 - 10;
        this.drawChevronArrow(ctx, lCx, lCy, -1, this.isLeftPressed);

        // Pill underneath Left Button: ◀ STEER LEFT
        const lPillX = lBtn.x;
        const lPillY = lBtn.y + lBtn.h + 2;
        const lPillW = lBtn.w;
        const lPillH = 32;
        ctx.fillStyle = '#061524';
        ctx.roundRect(lPillX, lPillY, lPillW, lPillH, 12);
        ctx.fill();
        ctx.strokeStyle = 'rgba(0, 229, 255, 0.75)';
        ctx.lineWidth = 1.8;
        ctx.roundRect(lPillX, lPillY, lPillW, lPillH, 12);
        ctx.stroke();
        ctx.font = "900 17px 'Segoe UI', Impact, Arial, sans-serif";
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('◀ STEER LEFT', lPillX + lPillW / 2, lPillY + lPillH / 2 + 1);

        // 2. Right Steer Button (Glowing Chevron Arrow matching demo.jpg)
        const rBtn = this.controls.rightBtn;
        const rCx = rBtn.x + rBtn.w / 2;
        const rCy = rBtn.y + rBtn.h / 2 - 10;
        this.drawChevronArrow(ctx, rCx, rCy, 1, this.isRightPressed);

        // Pill underneath Right Button: STEER RIGHT ▶
        const rPillX = rBtn.x;
        const rPillY = rBtn.y + rBtn.h + 2;
        const rPillW = rBtn.w;
        const rPillH = 32;
        ctx.fillStyle = '#061524';
        ctx.roundRect(rPillX, rPillY, rPillW, rPillH, 12);
        ctx.fill();
        ctx.strokeStyle = 'rgba(0, 229, 255, 0.75)';
        ctx.lineWidth = 1.8;
        ctx.roundRect(rPillX, rPillY, rPillW, rPillH, 12);
        ctx.stroke();
        ctx.font = "900 17px 'Segoe UI', Impact, Arial, sans-serif";
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('STEER RIGHT ▶', rPillX + rPillW / 2, rPillY + rPillH / 2 + 1);

        // 3. Bomb Button (Regular Hexagon with Purple/Cyan Neon & Bomb Icon matching demo.jpg)
        const bBtn = this.controls.bombBtn;
        const bCx = bBtn.x + bBtn.w / 2;
        const bCy = bBtn.y + bBtn.h / 2 - 14;
        this.drawHexBombButton(ctx, bCx, bCy, this.isBombPressed);

        // Pill underneath Bomb Button: ● DEPTH CHARGE
        const bPillX = bBtn.x;
        const bPillY = bBtn.y + bBtn.h + 2;
        const bPillW = bBtn.w;
        const bPillH = 32;
        ctx.fillStyle = '#061524';
        ctx.roundRect(bPillX, bPillY, bPillW, bPillH, 12);
        ctx.fill();
        ctx.strokeStyle = 'rgba(179, 136, 255, 0.8)';
        ctx.lineWidth = 1.8;
        ctx.roundRect(bPillX, bPillY, bPillW, bPillH, 12);
        ctx.stroke();

        // Purple glowing LED dot + Text
        ctx.fillStyle = '#b388ff';
        ctx.shadowColor = '#b388ff';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(bPillX + 24, bPillY + bPillH / 2, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.font = "900 17px 'Segoe UI', Impact, Arial, sans-serif";
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('DEPTH CHARGE', bPillX + bPillW / 2 + 10, bPillY + bPillH / 2 + 1);

        ctx.restore();
    }

    drawChevronArrow(ctx, cx, cy, dir, isPressed) {
        ctx.save();
        const scale = isPressed ? 0.92 : 1.0;
        ctx.translate(cx, cy);
        ctx.scale(scale, scale);

        // Thick chevron polygon matching demo.jpg
        const w2 = 65, h2 = 46, notch = 36;
        ctx.beginPath();
        if (dir === -1) {
            // Pointing Left
            ctx.moveTo(-w2, 0);
            ctx.lineTo(-w2 + notch, -h2);
            ctx.lineTo(w2, -h2);
            ctx.lineTo(w2 - notch, 0);
            ctx.lineTo(w2, h2);
            ctx.lineTo(-w2 + notch, h2);
        } else {
            // Pointing Right
            ctx.moveTo(w2, 0);
            ctx.lineTo(w2 - notch, -h2);
            ctx.lineTo(-w2, -h2);
            ctx.lineTo(-w2 + notch, 0);
            ctx.lineTo(-w2, h2);
            ctx.lineTo(w2 - notch, h2);
        }
        ctx.closePath();

        const aGrad = ctx.createLinearGradient(-w2, 0, w2, 0);
        aGrad.addColorStop(0, isPressed ? 'rgba(0, 229, 255, 0.45)' : 'rgba(0, 229, 255, 0.22)');
        aGrad.addColorStop(1, isPressed ? 'rgba(0, 160, 220, 0.6)' : 'rgba(0, 140, 200, 0.32)');
        ctx.fillStyle = aGrad;
        ctx.fill();

        ctx.strokeStyle = '#00e5ff';
        ctx.lineWidth = 3.5;
        ctx.shadowColor = '#00e5ff';
        ctx.shadowBlur = isPressed ? 24 : 16;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Inner embossed highlight line
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        if (dir === -1) {
            ctx.moveTo(-w2 + 14, 0);
            ctx.lineTo(-w2 + notch + 8, -h2 + 10);
            ctx.moveTo(-w2 + 14, 0);
            ctx.lineTo(-w2 + notch + 8, h2 - 10);
        } else {
            ctx.moveTo(w2 - 14, 0);
            ctx.lineTo(w2 - notch - 8, -h2 + 10);
            ctx.moveTo(w2 - 14, 0);
            ctx.lineTo(w2 - notch - 8, h2 - 10);
        }
        ctx.stroke();

        ctx.restore();
    }

    drawHexBombButton(ctx, cx, cy, isPressed) {
        ctx.save();
        const scale = isPressed ? 0.92 : 1.0;
        ctx.translate(cx, cy);
        ctx.scale(scale, scale);

        const r = 84;
        // Regular vertical hexagon with flat top/bottom, pointed left/right matching demo.jpg
        const hexPath = new Path2D();
        for (let i = 0; i < 6; i++) {
            const angle = (i * Math.PI) / 3;
            const px = r * Math.cos(angle);
            const py = r * Math.sin(angle);
            if (i === 0) hexPath.moveTo(px, py);
            else hexPath.lineTo(px, py);
        }
        hexPath.closePath();

        ctx.fillStyle = isPressed ? 'rgba(28, 18, 54, 0.95)' : 'rgba(12, 16, 40, 0.85)';
        ctx.fill(hexPath);

        const hexGrad = ctx.createLinearGradient(-r, -r, r, r);
        hexGrad.addColorStop(0, '#b388ff');
        hexGrad.addColorStop(0.5, '#7c4dff');
        hexGrad.addColorStop(1, '#00e5ff');

        ctx.strokeStyle = hexGrad;
        ctx.lineWidth = 4;
        ctx.shadowColor = isPressed ? '#00e5ff' : '#7c4dff';
        ctx.shadowBlur = isPressed ? 28 : 20;
        ctx.stroke(hexPath);
        ctx.shadowBlur = 0;

        // Inner Cyan Accent Hexagon
        const rInner = r - 10;
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (i * Math.PI) / 3;
            const px = rInner * Math.cos(angle);
            const py = rInner * Math.sin(angle);
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.strokeStyle = 'rgba(0, 229, 255, 0.65)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Vector Depth Charge Bomb Icon matching demo.jpg
        const bombW = 34, bombH = 68;
        ctx.fillStyle = '#00e5ff';
        ctx.beginPath();
        ctx.moveTo(0, -bombH / 2);
        ctx.quadraticCurveTo(-bombW / 2, -bombH / 4, -bombW / 2, 0);
        ctx.lineTo(bombW / 2, 0);
        ctx.quadraticCurveTo(bombW / 2, -bombH / 4, 0, -bombH / 2);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(-bombW / 2, 0, bombW, bombH / 3);

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-bombW / 2, bombH / 10, bombW, 4);

        ctx.fillStyle = '#0284c7';
        ctx.fillRect(-bombW / 2 + 4, bombH / 3, bombW - 8, bombH / 6);

        ctx.fillStyle = '#00e5ff';
        ctx.beginPath();
        ctx.moveTo(-bombW / 2, bombH / 4);
        ctx.lineTo(-bombW / 2 - 8, bombH / 2);
        ctx.lineTo(-bombW / 2 + 4, bombH / 2);
        ctx.moveTo(bombW / 2, bombH / 4);
        ctx.lineTo(bombW / 2 + 8, bombH / 2);
        ctx.lineTo(bombW / 2 - 4, bombH / 2);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
    }

    renderMenuOverlay(ctx) {
        ctx.save();
        ctx.fillStyle = 'rgba(6, 14, 24, 0.88)';
        ctx.fillRect(0, 0, 1080, 1920);

        // Sound Toggle Button at top right of Start Screen
        this.renderSoundButton(ctx, this.controls.soundBtn.x, this.controls.soundBtn.y, this.controls.soundBtn.w, this.controls.soundBtn.h);

        ctx.textAlign = 'center';
        ctx.fillStyle = '#00e5ff';
        ctx.font = "900 86px 'Impact', sans-serif";
        ctx.shadowColor = '#00e5ff';
        ctx.shadowBlur = 28;
        ctx.fillText('ATTACK TO SHIP', 540, 660);

        ctx.shadowBlur = 0;
        ctx.fillStyle = '#ffffff';
        ctx.font = "700 34px 'Segoe UI', sans-serif";
        ctx.fillText('TACTICAL NAVAL DESTROYER COMBAT', 540, 730);

        // Instructions Card - Cyber-Naval Tactical Styling
        const mGrad = ctx.createLinearGradient(120, 810, 120, 1250);
        mGrad.addColorStop(0, '#061424');
        mGrad.addColorStop(1, '#030810');
        ctx.fillStyle = mGrad;
        ctx.roundRect(120, 810, 840, 440, 24);
        ctx.fill();
        ctx.strokeStyle = '#00e5ff';
        ctx.lineWidth = 2.5;
        ctx.shadowColor = 'rgba(0, 229, 255, 0.4)';
        ctx.shadowBlur = 16;
        ctx.roundRect(120, 810, 840, 440, 24);
        ctx.stroke();
        ctx.shadowBlur = 0;

        ctx.font = "900 34px 'Segoe UI', Impact, sans-serif";
        ctx.fillStyle = '#00e5ff';
        ctx.fillText('⚡ MISSION BRIEFING ⚡', 540, 875);

        ctx.font = "700 28px 'Segoe UI', sans-serif";
        ctx.fillStyle = '#ffffff';
        ctx.fillText('• Move Ship: Touch/Drag Ship or Left/Right Buttons [A]/[D]', 540, 935);
        ctx.fillText('• Drop Depth Charge: Tap Bomb Button or [SPACE]', 540, 995);
        ctx.fillText('• 3 Lives (❤️ ❤️ ❤️): Evade Torpedo Alerts!', 540, 1055);
        ctx.fillText('• Collect Golden Badges for 2-Hit Energy Shield!', 540, 1115);
        ctx.fillText('• Chain combos to multiply your score!', 540, 1175);
        ctx.fillText('• Destroy Submarines & Giant Bosses to Survive!', 540, 1225);

        // High Score display
        ctx.font = "800 32px 'Segoe UI', sans-serif";
        ctx.fillStyle = '#ffd54f';
        ctx.fillText(`🏆 BEST RECORD: ${this.highScore}`, 540, 1290);

        // Tap to Start Button
        const pulse = 1.0 + Math.sin(performance.now() * 0.005) * 0.04;
        ctx.save();
        ctx.translate(540, 1385);
        ctx.scale(pulse, pulse);

        const btnW = this.controls.menuStartBtn.w;
        const btnH = this.controls.menuStartBtn.h;

        const grad = ctx.createLinearGradient(0, -btnH / 2, 0, btnH / 2);
        grad.addColorStop(0, '#00e5ff');
        grad.addColorStop(1, '#0091ea');
        ctx.fillStyle = grad;
        ctx.roundRect(-btnW / 2, -btnH / 2, btnW, btnH, 50);
        ctx.fill();

        ctx.shadowColor = '#00e5ff';
        ctx.shadowBlur = 18;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.roundRect(-btnW / 2, -btnH / 2, btnW, btnH, 50);
        ctx.stroke();
        ctx.shadowBlur = 0;

        ctx.font = "900 44px 'Impact', sans-serif";
        ctx.fillStyle = '#0d1722';
        ctx.fillText('▶ START MISSION', 0, 14);
        ctx.restore();

        ctx.restore();
    }

    renderPauseOverlay(ctx) {
        ctx.save();
        ctx.fillStyle = 'rgba(8, 16, 26, 0.85)';
        ctx.fillRect(0, 0, 1080, 1920);

        ctx.textAlign = 'center';
        ctx.fillStyle = '#00e5ff';
        ctx.font = "900 82px 'Impact', sans-serif";
        ctx.shadowColor = '#00e5ff';
        ctx.shadowBlur = 20;
        ctx.fillText('MISSION PAUSED', 540, 780);
        ctx.shadowBlur = 0;

        // Button 1: Resume Mission
        const rBtn = this.controls.pauseResumeBtn;
        ctx.fillStyle = '#00e5ff';
        ctx.roundRect(rBtn.x, rBtn.y, rBtn.w, rBtn.h, 45);
        ctx.fill();
        ctx.font = "900 40px 'Impact', sans-serif";
        ctx.fillStyle = '#0d1722';
        ctx.fillText('▶ RESUME MISSION', 540, rBtn.y + 58);

        // Button 2: Toggle Sound
        const isMuted = window.soundEngine.isMuted();
        const sBtn = this.controls.pauseSoundBtn;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
        ctx.roundRect(sBtn.x, sBtn.y, sBtn.w, sBtn.h, 43);
        ctx.fill();
        ctx.strokeStyle = isMuted ? '#ff1744' : '#00e5ff';
        ctx.lineWidth = 2.5;
        ctx.roundRect(sBtn.x, sBtn.y, sBtn.w, sBtn.h, 43);
        ctx.stroke();
        ctx.font = "800 34px 'Segoe UI', sans-serif";
        ctx.fillStyle = isMuted ? '#ff5252' : '#00e5ff';
        ctx.fillText(isMuted ? '🔇 SOUND: MUTED (TAP TO UNMUTE)' : '🔊 SOUND: ON (TAP TO MUTE)', 540, sBtn.y + 54);

        // Button 3: Return to Home Menu
        const hBtn = this.controls.pauseHomeBtn;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.roundRect(hBtn.x, hBtn.y, hBtn.w, hBtn.h, 43);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 2;
        ctx.roundRect(hBtn.x, hBtn.y, hBtn.w, hBtn.h, 43);
        ctx.stroke();
        ctx.font = "800 34px 'Segoe UI', sans-serif";
        ctx.fillStyle = '#ffffff';
        ctx.fillText('🏠 QUIT TO HOME MENU', 540, hBtn.y + 54);

        ctx.restore();
    }

    renderGameOverOverlay(ctx, images) {
        ctx.save();
        ctx.fillStyle = 'rgba(6, 12, 22, 0.92)';
        ctx.fillRect(0, 0, 1080, 1920);

        // Sound Toggle Button at top right
        this.renderSoundButton(ctx, this.controls.soundBtn.x, this.controls.soundBtn.y, this.controls.soundBtn.w, this.controls.soundBtn.h);

        ctx.textAlign = 'center';

        // Red glow header
        ctx.fillStyle = '#ff1744';
        ctx.font = "900 96px 'Impact', sans-serif";
        ctx.shadowColor = '#ff1744';
        ctx.shadowBlur = 24;
        ctx.fillText('GAME OVER', 540, 640);
        ctx.shadowBlur = 0;

        // 3 Lost Lives Love Signs
        const emptyHeartImg = images['heart_empty'];
        const heartSize = 64;
        const gap = 20;
        const totalW = 3 * heartSize + 2 * gap;
        const startX = 540 - totalW / 2;
        const heartY = 700;
        for (let i = 0; i < 3; i++) {
            const hx = startX + i * (heartSize + gap);
            if (emptyHeartImg && emptyHeartImg.complete) {
                ctx.drawImage(emptyHeartImg, hx, heartY, heartSize, heartSize);
            } else {
                ctx.font = "52px sans-serif";
                ctx.fillText('💔', hx + heartSize / 2, heartY + heartSize / 2);
            }
        }

        // Stats Card Container - Cyber-Naval Tactical Styling
        const goGrad = ctx.createLinearGradient(160, 800, 160, 1030);
        goGrad.addColorStop(0, '#081728');
        goGrad.addColorStop(1, '#030812');
        ctx.fillStyle = goGrad;
        ctx.roundRect(160, 800, 760, 230, 24);
        ctx.fill();
        ctx.strokeStyle = '#00e5ff';
        ctx.lineWidth = 2.5;
        ctx.shadowColor = 'rgba(0, 229, 255, 0.4)';
        ctx.shadowBlur = 14;
        ctx.roundRect(160, 800, 760, 230, 24);
        ctx.stroke();
        ctx.shadowBlur = 0;

        ctx.fillStyle = '#ffffff';
        ctx.font = "900 48px 'Impact', 'Segoe UI', Arial Black, sans-serif";
        ctx.fillText(`FINAL SCORE: ${this.score}`, 540, 865);

        ctx.fillStyle = '#ffd54f';
        ctx.font = "800 36px 'Segoe UI', Impact, sans-serif";
        const isNewRecord = (this.score >= this.highScore && this.score > 0);
        ctx.fillText(`BEST SCORE: ${this.highScore} ${isNewRecord ? '🏆 NEW RECORD!' : ''}`, 540, 930);

        ctx.fillStyle = '#80deea';
        ctx.font = "700 30px 'Segoe UI', sans-serif";
        ctx.fillText(`SHIPS SUNK: ${this.enemiesDestroyed}`, 540, 985);

        // 1. PLAY AGAIN BUTTON
        const pBtn = this.controls.playAgainBtn;
        const pulse = 1.0 + Math.sin(performance.now() * 0.005) * 0.035;

        ctx.save();
        ctx.translate(540, pBtn.y + pBtn.h / 2);
        ctx.scale(pulse, pulse);

        const pGrad = ctx.createLinearGradient(0, -pBtn.h / 2, 0, pBtn.h / 2);
        pGrad.addColorStop(0, '#00e5ff');
        pGrad.addColorStop(1, '#00b0ff');
        ctx.fillStyle = pGrad;
        ctx.roundRect(-pBtn.w / 2, -pBtn.h / 2, pBtn.w, pBtn.h, 48);
        ctx.fill();

        ctx.shadowColor = '#00e5ff';
        ctx.shadowBlur = 20;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.roundRect(-pBtn.w / 2, -pBtn.h / 2, pBtn.w, pBtn.h, 48);
        ctx.stroke();
        ctx.shadowBlur = 0;

        ctx.font = "900 46px 'Impact', sans-serif";
        ctx.fillStyle = '#0d1722';
        ctx.fillText('↻ PLAY AGAIN', 0, 16);
        ctx.restore();

        // 2. BACK TO HOME BUTTON (DIRECTLY UNDER PLAY AGAIN)
        const hBtn = this.controls.homeBtn;
        ctx.save();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
        ctx.roundRect(hBtn.x, hBtn.y, hBtn.w, hBtn.h, 45);
        ctx.fill();

        ctx.strokeStyle = 'rgba(0, 229, 255, 0.6)';
        ctx.lineWidth = 2.5;
        ctx.roundRect(hBtn.x, hBtn.y, hBtn.w, hBtn.h, 45);
        ctx.stroke();

        ctx.font = "900 38px 'Impact', 'Segoe UI', sans-serif";
        ctx.fillStyle = '#ffffff';
        ctx.fillText('🏠 BACK TO HOME', 540, hBtn.y + 56);
        ctx.restore();

        ctx.restore();
    }
}

window.attackToShipGame = new AttackToShipGame();
