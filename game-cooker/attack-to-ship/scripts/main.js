/**
 * Main Game Controller for Attack to Ship (1080x1920 layout)
 */

class AttackToShipGame {
    constructor() {
        this.state = 'MENU'; // 'MENU', 'PLAYING', 'PAUSED', 'GAMEOVER'
        this.score = 60; // Start with score as in demo
        this.highScore = parseInt(localStorage.getItem('attack_to_ship_highscore') || '120', 10);

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

        // Depth lanes for submarines (Y coordinates in 1080x1920)
        this.depthLanes = [
            { y: 840, type: 'scout' },
            { y: 1040, type: 'patrol' },
            { y: 1280, type: 'military' },
            { y: 1540, type: 'scout' },
            { y: 1680, type: 'patrol' }
        ];

        // Touch control buttons geometry
        this.controls = {
            leftBtn: { x: 30, y: 1680, w: 180, h: 180 },
            rightBtn: { x: 230, y: 1680, w: 180, h: 180 },
            bombBtn: { x: 840, y: 1680, w: 190, h: 190 },
            pauseBtn: { x: 940, y: 40, w: 100, h: 100 },
            gamepadBtn: { x: 40, y: 40, w: 100, h: 100 }
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
        this.particles.addFloatingText('WARNING: BOSS APPROACHING!', 540, 750, '#ff1744', 44);
    }

    onKeyDown(code) {
        if (this.state === 'MENU') {
            if (code === 'Space' || code === 'Enter') {
                this.startNewGame();
            }
            return;
        }

        if (this.state === 'GAMEOVER') {
            if (code === 'Space' || code === 'Enter' || code === 'KeyR') {
                this.startNewGame();
            }
            return;
        }

        if (code === 'KeyP' || code === 'Escape') {
            this.togglePause();
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

        if (this.state === 'MENU') {
            this.startNewGame();
            return;
        }

        if (this.state === 'GAMEOVER') {
            this.startNewGame();
            return;
        }

        if (this.state === 'PAUSED') {
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
        if (this.state === 'PLAYING') {
            this.state = 'PAUSED';
        } else if (this.state === 'PAUSED') {
            this.state = 'PLAYING';
        }
    }

    update(dt) {
        if (this.state !== 'PLAYING') {
            this.particles.update(dt);
            return;
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

        this.player.update(dt);

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
                // Shield absorbs torpedo!
                torp.dead = true;
                this.player.takeDamage(); // plays shieldHit sound
                this.particles.addExplosion(torp.x, torp.y, 0.9);
                this.particles.addFloatingText('BLOCKED!', torp.x, torp.y - 30, '#00e5ff', 32);
            } else if (this.checkOverlap(torpHitbox, shipBox)) {
                // Ship hit!
                torp.dead = true;
                const damaged = this.player.takeDamage();
                this.particles.addExplosion(torp.x, torp.y, 1.2);
                if (damaged) {
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
                sub.update(dt, this.torpedoes, this.powerups);
            } else {
                sub.update(dt, this.torpedoes);
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
                        this.particles.addFloatingText('+5', bomb.x, bomb.y - 20, '#ffd54f', 36);
                        window.soundEngine.playExplosion(false);

                        if (defeated) {
                            this.bossActive = false;
                            this.score += sub.points;
                            this.particles.addExplosion(sub.x + sub.width / 2, sub.y + sub.height / 2, 2.2);
                            this.particles.addFloatingText(`+${sub.points} BOSS DESTROYED!`, sub.x + sub.width / 2, sub.y - 40, '#ffea00', 48);
                            window.soundEngine.playExplosion(true);
                        }
                    } else {
                        const destroyed = sub.takeHit();
                        if (destroyed) {
                            this.score += sub.points;
                            this.particles.addExplosion(sub.x + sub.width / 2, sub.y + sub.height / 2, 1.3);
                            this.particles.addFloatingText(`+${sub.points}`, bomb.x, bomb.y - 20, '#ffd54f', 38);
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
                    this.player.activateShield(16.0);
                    window.soundEngine.playPowerUp();
                    this.particles.addFloatingText('+SHIELD ACTIVATED!', this.player.x + 150, this.player.y - 40, '#00e5ff', 42);
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
        window.soundEngine.playGameOver();
    }

    render(ctx, images) {
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

        // Draw Powerups (Golden Badge)
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

        // Draw HUD (Score, High Score, Hearts, Top Buttons)
        this.renderHUD(ctx, images);

        // Draw Touch Controls (Left/Right Arrows, Bomb Button)
        this.renderTouchControls(ctx, images);

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
        // Top Left Gamepad Button
        const padImg = images['btn_gamepad'];
        if (padImg && padImg.complete) {
            ctx.drawImage(padImg, this.controls.gamepadBtn.x, this.controls.gamepadBtn.y, this.controls.gamepadBtn.w, this.controls.gamepadBtn.h);
        }

        // Top Right Pause Button
        const pauseImg = images['btn_pause'];
        if (pauseImg && pauseImg.complete) {
            ctx.drawImage(pauseImg, this.controls.pauseBtn.x, this.controls.pauseBtn.y, this.controls.pauseBtn.w, this.controls.pauseBtn.h);
        }

        // Top Center Score Display (Matching "Score 60" in video font)
        ctx.save();
        ctx.font = "900 64px 'Impact', 'Arial Black', sans-serif";
        ctx.fillStyle = '#2c3437';
        ctx.textAlign = 'center';
        ctx.fillText(`Score  ${this.score}`, 540, 110);

        // Subtitle High Score
        ctx.font = "700 28px 'Segoe UI', sans-serif";
        ctx.fillStyle = '#546e7a';
        ctx.fillText(`BEST: ${this.highScore}`, 540, 155);

        // Player Lives: 3 Love Signs / Hearts
        if (this.player) {
            const heartImg = images['heart'];
            const emptyHeartImg = images['heart_empty'];
            const heartSize = 58;
            const gap = 16;
            const totalW = this.player.maxHealth * heartSize + (this.player.maxHealth - 1) * gap;
            const startX = 540 - totalW / 2;
            const heartY = 175;

            // Glass container pill for the 3 love signs
            ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
            ctx.roundRect(startX - 22, heartY - 8, totalW + 44, heartSize + 16, 24);
            ctx.fill();
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
            ctx.lineWidth = 2;
            ctx.roundRect(startX - 22, heartY - 8, totalW + 44, heartSize + 16, 24);
            ctx.stroke();

            for (let i = 0; i < this.player.maxHealth; i++) {
                const hx = startX + i * (heartSize + gap);
                const isAlive = i < this.player.health;

                ctx.save();
                let pulse = 1.0;
                if (isAlive) {
                    const pulseSpeed = this.player.health === 1 ? 12 : 4.5;
                    const pulseIntensity = this.player.health === 1 ? 0.15 : 0.07;
                    pulse = 1.0 + Math.sin(this.player.time * pulseSpeed + i * 0.45) * pulseIntensity;
                }

                ctx.translate(hx + heartSize / 2, heartY + heartSize / 2);
                ctx.scale(pulse, pulse);

                const currentImg = isAlive ? heartImg : emptyHeartImg;
                if (currentImg && currentImg.complete) {
                    ctx.drawImage(currentImg, -heartSize / 2, -heartSize / 2, heartSize, heartSize);
                } else {
                    ctx.fillStyle = isAlive ? '#ff1744' : 'rgba(120, 130, 140, 0.4)';
                    ctx.font = "46px sans-serif";
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(isAlive ? '❤️' : '🖤', 0, 0);
                }
                ctx.restore();
            }

            // Shield Timer Bar if active
            if (this.player.hasShield) {
                const sPct = this.player.shieldTimer / this.player.maxShieldTime;
                ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
                ctx.roundRect(420, 260, 240, 14, 6);
                ctx.fill();
                ctx.fillStyle = '#00e5ff';
                ctx.roundRect(420, 260, 240 * sPct, 14, 6);
                ctx.fill();
                ctx.font = "600 20px 'Segoe UI', sans-serif";
                ctx.fillStyle = '#00e5ff';
                ctx.fillText(`SHIELD: ${Math.ceil(this.player.shieldTimer)}s`, 540, 295);
            }
        }

        ctx.restore();
    }

    renderTouchControls(ctx, images) {
        ctx.save();

        // Left Arrow
        const leftImg = images['btn_left'];
        if (leftImg && leftImg.complete) {
            ctx.globalAlpha = this.isLeftPressed ? 1.0 : 0.75;
            ctx.drawImage(leftImg, this.controls.leftBtn.x, this.controls.leftBtn.y, this.controls.leftBtn.w, this.controls.leftBtn.h);
        }

        // Right Arrow
        const rightImg = images['btn_right'];
        if (rightImg && rightImg.complete) {
            ctx.globalAlpha = this.isRightPressed ? 1.0 : 0.75;
            ctx.drawImage(rightImg, this.controls.rightBtn.x, this.controls.rightBtn.y, this.controls.rightBtn.w, this.controls.rightBtn.h);
        }

        // Bomb Button
        const bombImg = images['btn_bomb'];
        if (bombImg && bombImg.complete) {
            ctx.globalAlpha = 0.85;
            ctx.drawImage(bombImg, this.controls.bombBtn.x, this.controls.bombBtn.y, this.controls.bombBtn.w, this.controls.bombBtn.h);
        }

        ctx.restore();
    }

    renderMenuOverlay(ctx) {
        ctx.save();
        ctx.fillStyle = 'rgba(10, 20, 30, 0.85)';
        ctx.fillRect(0, 0, 1080, 1920);

        ctx.textAlign = 'center';
        ctx.fillStyle = '#00e5ff';
        ctx.font = "900 84px 'Impact', sans-serif";
        ctx.shadowColor = '#00e5ff';
        ctx.shadowBlur = 25;
        ctx.fillText('ATTACK TO SHIP', 540, 680);

        ctx.shadowBlur = 0;
        ctx.fillStyle = '#ffffff';
        ctx.font = "700 36px 'Segoe UI', sans-serif";
        ctx.fillText('NAVAL DESTROYER COMBAT', 540, 750);

        // Instructions Card
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.roundRect(140, 830, 800, 420, 24);
        ctx.fill();

        ctx.font = "600 30px 'Segoe UI', sans-serif";
        ctx.fillStyle = '#b0bec5';
        ctx.fillText('HOW TO PLAY', 540, 890);
        ctx.font = "400 28px 'Segoe UI', sans-serif";
        ctx.fillStyle = '#eceff1';
        ctx.fillText('• Move Ship: Tap/Drag directly on Ship or Arrows [A]/[D]', 540, 950);
        ctx.fillText('• Drop Depth Charge: Bomb Button or [SPACE]', 540, 1010);
        ctx.fillText('• 3 Lives (❤️ ❤️ ❤️): Dodge Enemy Torpedoes!', 540, 1070);
        ctx.fillText('• Collect Golden Badges for Energy Shield!', 540, 1130);
        ctx.fillText('• Destroy Submarines & Giant Bosses to Score!', 540, 1190);

        // Tap to Start Button
        const pulse = 1.0 + Math.sin(performance.now() * 0.005) * 0.05;
        ctx.save();
        ctx.translate(540, 1370);
        ctx.scale(pulse, pulse);
        ctx.fillStyle = '#00e5ff';
        ctx.roundRect(-240, -50, 480, 100, 50);
        ctx.fill();
        ctx.font = "900 44px 'Impact', sans-serif";
        ctx.fillStyle = '#0d1722';
        ctx.fillText('TAP TO START GAME', 0, 15);
        ctx.restore();

        ctx.restore();
    }

    renderPauseOverlay(ctx) {
        ctx.save();
        ctx.fillStyle = 'rgba(10, 20, 30, 0.75)';
        ctx.fillRect(0, 0, 1080, 1920);

        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffffff';
        ctx.font = "900 80px 'Impact', sans-serif";
        ctx.fillText('GAME PAUSED', 540, 880);

        ctx.fillStyle = '#70d6f4';
        ctx.font = "600 36px 'Segoe UI', sans-serif";
        ctx.fillText('Tap Screen or Press [P] to Resume', 540, 960);
        ctx.restore();
    }

    renderGameOverOverlay(ctx, images) {
        ctx.save();
        ctx.fillStyle = 'rgba(10, 15, 25, 0.9)';
        ctx.fillRect(0, 0, 1080, 1920);

        ctx.textAlign = 'center';
        ctx.fillStyle = '#ff1744';
        ctx.font = "900 90px 'Impact', sans-serif";
        ctx.shadowColor = '#ff1744';
        ctx.shadowBlur = 20;
        ctx.fillText('GAME OVER', 540, 680);

        ctx.shadowBlur = 0;

        // 3 Lost Lives Love Signs
        const emptyHeartImg = images['heart_empty'];
        const heartSize = 60;
        const gap = 18;
        const totalW = 3 * heartSize + 2 * gap;
        const startX = 540 - totalW / 2;
        const heartY = 740;
        for (let i = 0; i < 3; i++) {
            const hx = startX + i * (heartSize + gap);
            if (emptyHeartImg && emptyHeartImg.complete) {
                ctx.drawImage(emptyHeartImg, hx, heartY, heartSize, heartSize);
            } else {
                ctx.font = "48px sans-serif";
                ctx.fillText('💔', hx + heartSize / 2, heartY + heartSize / 2);
            }
        }

        ctx.fillStyle = '#ffffff';
        ctx.font = "700 48px 'Segoe UI', sans-serif";
        ctx.fillText(`FINAL SCORE: ${this.score}`, 540, 860);

        ctx.fillStyle = '#ffd54f';
        ctx.font = "700 40px 'Segoe UI', sans-serif";
        ctx.fillText(`BEST SCORE: ${this.highScore}`, 540, 930);

        // Restart button
        const pulse = 1.0 + Math.sin(performance.now() * 0.005) * 0.05;
        ctx.save();
        ctx.translate(540, 1150);
        ctx.scale(pulse, pulse);
        ctx.fillStyle = '#00e5ff';
        ctx.roundRect(-240, -50, 480, 100, 50);
        ctx.fill();
        ctx.font = "900 44px 'Impact', sans-serif";
        ctx.fillStyle = '#0d1722';
        ctx.fillText('PLAY AGAIN', 0, 15);
        ctx.restore();

        ctx.restore();
    }
}

window.attackToShipGame = new AttackToShipGame();
