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
        this.controls = {
            // HUD Top Bar Buttons
            gamepadBtn: { x: 40, y: 35, w: 90, h: 90 },
            soundBtn: { x: 835, y: 35, w: 90, h: 90 },
            pauseBtn: { x: 950, y: 35, w: 90, h: 90 },

            // Bottom Gameplay Touch Controls
            leftBtn: { x: 35, y: 1680, w: 180, h: 180 },
            rightBtn: { x: 235, y: 1680, w: 180, h: 180 },
            bombBtn: { x: 840, y: 1680, w: 190, h: 190 },

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

        // 1. Top HUD Header Container: Solid Black Background (#000000), Pure White Border
        ctx.fillStyle = '#000000';
        ctx.roundRect(20, 18, 1040, 130, 24);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.5;
        ctx.roundRect(20, 18, 1040, 130, 24);
        ctx.stroke();

        // Top Left: Gamepad / Tactical Briefing Button (Solid black container, white border)
        const padImg = images['btn_gamepad'];
        ctx.fillStyle = '#000000';
        ctx.roundRect(this.controls.gamepadBtn.x, this.controls.gamepadBtn.y, this.controls.gamepadBtn.w, this.controls.gamepadBtn.h, 20);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.roundRect(this.controls.gamepadBtn.x, this.controls.gamepadBtn.y, this.controls.gamepadBtn.w, this.controls.gamepadBtn.h, 20);
        ctx.stroke();

        if (padImg && padImg.complete) {
            ctx.drawImage(padImg, this.controls.gamepadBtn.x + 12, this.controls.gamepadBtn.y + 12, this.controls.gamepadBtn.w - 24, this.controls.gamepadBtn.h - 24);
        } else {
            ctx.font = "40px sans-serif";
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('🎮', this.controls.gamepadBtn.x + 45, this.controls.gamepadBtn.y + 45);
        }

        // Top Right: SOUND BUTTON (Solid black, pure white text/icon)
        this.renderSoundButton(ctx, this.controls.soundBtn.x, this.controls.soundBtn.y, this.controls.soundBtn.w, this.controls.soundBtn.h);

        // Top Right: PAUSE BUTTON (Solid black container, white border)
        const pauseImg = images['btn_pause'];
        ctx.fillStyle = '#000000';
        ctx.roundRect(this.controls.pauseBtn.x, this.controls.pauseBtn.y, this.controls.pauseBtn.w, this.controls.pauseBtn.h, 20);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.roundRect(this.controls.pauseBtn.x, this.controls.pauseBtn.y, this.controls.pauseBtn.w, this.controls.pauseBtn.h, 20);
        ctx.stroke();

        if (pauseImg && pauseImg.complete) {
            ctx.drawImage(pauseImg, this.controls.pauseBtn.x + 12, this.controls.pauseBtn.y + 12, this.controls.pauseBtn.w - 24, this.controls.pauseBtn.h - 24);
        } else {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(this.controls.pauseBtn.x + 30, this.controls.pauseBtn.y + 25, 10, 40);
            ctx.fillRect(this.controls.pauseBtn.x + 50, this.controls.pauseBtn.y + 25, 10, 40);
        }

        // Center HUD: Score Display - Bold Pure White (#ffffff)
        ctx.font = "900 54px 'Impact', 'Segoe UI', Arial Black, sans-serif";
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'alphabetic';
        ctx.fillText(`SCORE: ${this.score}`, 540, 74);

        // Center HUD Subtitle directly under Score: Pure White (#ffffff), Bold, High Contrast
        ctx.font = "800 28px 'Segoe UI', Impact, Arial, sans-serif";
        ctx.fillStyle = '#ffffff';
        let subText = `BEST RECORD: ${this.highScore}`;
        if (this.comboCount > 1 && this.comboTimer > 0) {
            subText += `   |   🔥 COMBO x${this.comboCount}`;
        }
        ctx.fillText(subText, 540, 118);

        // 2. Underneath HUD: Player Lives / Hearts Container (Solid Black #000000)
        if (this.player) {
            const heartImg = images['heart'];
            const emptyHeartImg = images['heart_empty'];
            const heartSize = 54;
            const gap = 16;
            const totalW = this.player.maxHealth * heartSize + (this.player.maxHealth - 1) * gap;
            const heartContainerW = totalW + 160;
            const heartContainerH = 68;
            const startX = 540 - heartContainerW / 2;
            const heartY = 164;

            // Solid Black Container for Hearts
            ctx.fillStyle = '#000000';
            ctx.roundRect(startX, heartY, heartContainerW, heartContainerH, 20);
            ctx.fill();
            ctx.strokeStyle = this.player.health === 1 ? '#ff1744' : '#ffffff';
            ctx.lineWidth = 2.5;
            ctx.roundRect(startX, heartY, heartContainerW, heartContainerH, 20);
            ctx.stroke();

            // Clear Pure White Label inside container
            ctx.font = "900 26px 'Segoe UI', Impact, Arial, sans-serif";
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillText('LIVES:', startX + 22, heartY + heartContainerH / 2);

            // Render Hearts
            const heartsStartX = startX + 130;
            for (let i = 0; i < this.player.maxHealth; i++) {
                const hx = heartsStartX + i * (heartSize + gap);
                const isAlive = i < this.player.health;

                ctx.save();
                let pulse = 1.0;
                if (isAlive) {
                    const pulseSpeed = this.player.health === 1 ? 12 : 4.5;
                    const pulseIntensity = this.player.health === 1 ? 0.16 : 0.08;
                    pulse = 1.0 + Math.sin(this.player.time * pulseSpeed + i * 0.45) * pulseIntensity;
                }

                ctx.translate(hx + heartSize / 2, heartY + heartContainerH / 2);
                ctx.scale(pulse, pulse);

                const currentImg = isAlive ? heartImg : emptyHeartImg;
                if (currentImg && currentImg.complete) {
                    ctx.drawImage(currentImg, -heartSize / 2, -heartSize / 2, heartSize, heartSize);
                } else {
                    ctx.fillStyle = isAlive ? '#ff1744' : 'rgba(120, 130, 140, 0.4)';
                    ctx.font = "42px sans-serif";
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(isAlive ? '❤️' : '🖤', 0, 0);
                }
                ctx.restore();
            }

            // 3. Shield Status UI Widget (Directly underneath Lives)
            // Solid Black Background, Pure White Text, Huge Clear Timer
            if (this.player.hasShield) {
                const sPct = Math.max(0, Math.min(1, this.player.shieldTimer / this.player.maxShieldTime));
                const isDamaged = (this.player.shieldHp === 1);
                const isLowTime = (this.player.shieldTimer < 3.0);
                const flash = (isDamaged || isLowTime) && (Math.sin(this.player.time * 16) > 0);
                const borderColor = isDamaged ? '#ff1744' : (isLowTime && flash ? '#ff5252' : '#00e5ff');

                const pillW = 640;
                const pillH = 82;
                const pillX = 540 - pillW / 2;
                const pillY = 246;

                ctx.save();

                // Solid Black Shield Card
                ctx.fillStyle = '#000000';
                ctx.roundRect(pillX, pillY, pillW, pillH, 20);
                ctx.fill();

                // Glowing neon border (Cyan for 2 hits, Red for 1 hit)
                ctx.strokeStyle = borderColor;
                ctx.lineWidth = 3.5;
                ctx.roundRect(pillX, pillY, pillW, pillH, 20);
                ctx.stroke();

                // Top Line: Left Status & Hits Left in BOLD WHITE TEXT
                ctx.textAlign = 'left';
                ctx.textBaseline = 'middle';
                ctx.font = "900 28px 'Segoe UI', Impact, Arial, sans-serif";
                ctx.fillStyle = '#ffffff';
                const statusIcon = isDamaged ? '⚠️' : '🛡️';
                const hitLabel = isDamaged ? 'SHIELD: 1 HIT LEFT!' : 'SHIELD: 2/2 HITS';
                ctx.fillText(`${statusIcon} ${hitLabel}`, pillX + 24, pillY + 30);

                // Top Line: Right Countdown Timer in GIANT BOLD WHITE TEXT
                ctx.textAlign = 'right';
                ctx.font = "900 34px 'Impact', 'Segoe UI', Arial Black, sans-serif";
                ctx.fillStyle = '#ffffff';
                const secondsLeft = Math.ceil(this.player.shieldTimer);
                ctx.fillText(`⏱ ${secondsLeft} SECONDS`, pillX + pillW - 24, pillY + 30);

                // Bottom Line: Progress Bar of Timer
                const barX = pillX + 24;
                const barY = pillY + 54;
                const barW = pillW - 48;
                const barH = 16;

                // Slot Background
                ctx.fillStyle = '#222222';
                ctx.roundRect(barX, barY, barW, barH, 8);
                ctx.fill();

                // Bar Fill
                if (sPct > 0) {
                    const fillW = Math.max(16, barW * sPct);
                    ctx.fillStyle = isDamaged ? '#ff1744' : (isLowTime ? '#ff9100' : '#00e5ff');
                    ctx.roundRect(barX, barY, fillW, barH, 8);
                    ctx.fill();
                }

                ctx.restore();
            }
        }

        ctx.restore();
    }

    renderSoundButton(ctx, x, y, w, h) {
        ctx.save();
        const isMuted = window.soundEngine.isMuted();

        // Solid Black Button Container with Crisp Border
        ctx.fillStyle = '#000000';
        ctx.roundRect(x, y, w, h, 20);
        ctx.fill();
        ctx.strokeStyle = isMuted ? '#ff1744' : '#ffffff';
        ctx.lineWidth = 2.5;
        ctx.roundRect(x, y, w, h, 20);
        ctx.stroke();

        const cx = x + w / 2;
        const cy = y + h / 2 - 8;

        // Speaker cone trapezoid
        ctx.fillStyle = isMuted ? '#ff5252' : '#ffffff';
        ctx.beginPath();
        // Speaker body
        ctx.fillRect(cx - 20, cy - 8, 10, 16);
        ctx.moveTo(cx - 10, cy - 8);
        ctx.lineTo(cx + 2, cy - 18);
        ctx.lineTo(cx + 2, cy + 18);
        ctx.lineTo(cx - 10, cy + 8);
        ctx.closePath();
        ctx.fill();

        if (!isMuted) {
            // Sound waves in crisp white
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';
            // Wave 1
            ctx.beginPath();
            ctx.arc(cx + 2, cy, 12, -Math.PI / 3, Math.PI / 3);
            ctx.stroke();
            // Wave 2
            ctx.beginPath();
            ctx.arc(cx + 2, cy, 20, -Math.PI / 3, Math.PI / 3);
            ctx.stroke();
        } else {
            // Red mute slash line
            ctx.strokeStyle = '#ff1744';
            ctx.lineWidth = 3.5;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(cx - 22, cy - 18);
            ctx.lineTo(cx + 22, cy + 18);
            ctx.stroke();
        }

        // Bold Pure White indicator text underneath
        ctx.font = "900 15px 'Segoe UI', Impact, Arial, sans-serif";
        ctx.fillStyle = isMuted ? '#ff5252' : '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'alphabetic';
        ctx.fillText(isMuted ? 'SOUND OFF' : 'SOUND ON', cx, y + h - 10);

        ctx.restore();
    }

    renderTouchControls(ctx, images) {
        ctx.save();

        // 1. Left Arrow Button
        const leftImg = images['btn_left'];
        ctx.save();
        if (this.isLeftPressed) {
            ctx.translate(this.controls.leftBtn.x + this.controls.leftBtn.w / 2, this.controls.leftBtn.y + this.controls.leftBtn.h / 2);
            ctx.scale(0.92, 0.92);
            ctx.translate(-(this.controls.leftBtn.x + this.controls.leftBtn.w / 2), -(this.controls.leftBtn.y + this.controls.leftBtn.h / 2));
        }
        if (leftImg && leftImg.complete) {
            ctx.globalAlpha = this.isLeftPressed ? 1.0 : 0.88;
            ctx.drawImage(leftImg, this.controls.leftBtn.x, this.controls.leftBtn.y, this.controls.leftBtn.w, this.controls.leftBtn.h);
        }
        ctx.restore();

        // Solid Black Control Label underneath Left Button: ◀ LEFT
        ctx.fillStyle = '#000000';
        ctx.roundRect(this.controls.leftBtn.x, this.controls.leftBtn.y + this.controls.leftBtn.h + 4, this.controls.leftBtn.w, 30, 10);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.roundRect(this.controls.leftBtn.x, this.controls.leftBtn.y + this.controls.leftBtn.h + 4, this.controls.leftBtn.w, 30, 10);
        ctx.stroke();
        ctx.font = "800 18px 'Segoe UI', Impact, sans-serif";
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('◀ LEFT', this.controls.leftBtn.x + this.controls.leftBtn.w / 2, this.controls.leftBtn.y + this.controls.leftBtn.h + 19);

        // 2. Right Arrow Button
        const rightImg = images['btn_right'];
        ctx.save();
        if (this.isRightPressed) {
            ctx.translate(this.controls.rightBtn.x + this.controls.rightBtn.w / 2, this.controls.rightBtn.y + this.controls.rightBtn.h / 2);
            ctx.scale(0.92, 0.92);
            ctx.translate(-(this.controls.rightBtn.x + this.controls.rightBtn.w / 2), -(this.controls.rightBtn.y + this.controls.rightBtn.h / 2));
        }
        if (rightImg && rightImg.complete) {
            ctx.globalAlpha = this.isRightPressed ? 1.0 : 0.88;
            ctx.drawImage(rightImg, this.controls.rightBtn.x, this.controls.rightBtn.y, this.controls.rightBtn.w, this.controls.rightBtn.h);
        }
        ctx.restore();

        // Solid Black Control Label underneath Right Button: RIGHT ▶
        ctx.fillStyle = '#000000';
        ctx.roundRect(this.controls.rightBtn.x, this.controls.rightBtn.y + this.controls.rightBtn.h + 4, this.controls.rightBtn.w, 30, 10);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.roundRect(this.controls.rightBtn.x, this.controls.rightBtn.y + this.controls.rightBtn.h + 4, this.controls.rightBtn.w, 30, 10);
        ctx.stroke();
        ctx.font = "800 18px 'Segoe UI', Impact, sans-serif";
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('RIGHT ▶', this.controls.rightBtn.x + this.controls.rightBtn.w / 2, this.controls.rightBtn.y + this.controls.rightBtn.h + 19);

        // 3. Bomb Button
        const bombImg = images['btn_bomb'];
        ctx.save();
        if (this.isBombPressed) {
            ctx.translate(this.controls.bombBtn.x + this.controls.bombBtn.w / 2, this.controls.bombBtn.y + this.controls.bombBtn.h / 2);
            ctx.scale(0.92, 0.92);
            ctx.translate(-(this.controls.bombBtn.x + this.controls.bombBtn.w / 2), -(this.controls.bombBtn.y + this.controls.bombBtn.h / 2));
        }
        if (bombImg && bombImg.complete) {
            ctx.globalAlpha = this.isBombPressed ? 1.0 : 0.92;
            ctx.drawImage(bombImg, this.controls.bombBtn.x, this.controls.bombBtn.y, this.controls.bombBtn.w, this.controls.bombBtn.h);
        }
        ctx.restore();

        // Solid Black Control Label underneath Bomb Button: 💣 DROP BOMB
        ctx.fillStyle = '#000000';
        ctx.roundRect(this.controls.bombBtn.x, this.controls.bombBtn.y + this.controls.bombBtn.h + 4, this.controls.bombBtn.w, 30, 10);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.roundRect(this.controls.bombBtn.x, this.controls.bombBtn.y + this.controls.bombBtn.h + 4, this.controls.bombBtn.w, 30, 10);
        ctx.stroke();
        ctx.font = "800 18px 'Segoe UI', Impact, sans-serif";
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('💣 DROP BOMB', this.controls.bombBtn.x + this.controls.bombBtn.w / 2, this.controls.bombBtn.y + this.controls.bombBtn.h + 19);

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

        // Instructions Card - Solid Black Background, Pure White Text
        ctx.fillStyle = '#000000';
        ctx.roundRect(120, 810, 840, 440, 24);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.5;
        ctx.roundRect(120, 810, 840, 440, 24);
        ctx.stroke();

        ctx.font = "900 34px 'Segoe UI', Impact, sans-serif";
        ctx.fillStyle = '#ffffff';
        ctx.fillText('MISSION BRIEFING', 540, 875);

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
        ctx.fillStyle = '#ffffff';
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

        // Stats Card Container - Solid Black Background, Pure White Text
        ctx.fillStyle = '#000000';
        ctx.roundRect(160, 800, 760, 230, 24);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.5;
        ctx.roundRect(160, 800, 760, 230, 24);
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = "900 48px 'Impact', 'Segoe UI', Arial Black, sans-serif";
        ctx.fillText(`FINAL SCORE: ${this.score}`, 540, 865);

        ctx.fillStyle = '#ffffff';
        ctx.font = "800 36px 'Segoe UI', Impact, sans-serif";
        const isNewRecord = (this.score >= this.highScore && this.score > 0);
        ctx.fillText(`BEST SCORE: ${this.highScore} ${isNewRecord ? '🏆 NEW RECORD!' : ''}`, 540, 930);

        ctx.fillStyle = '#ffffff';
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
