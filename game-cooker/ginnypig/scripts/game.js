/**
 * game.js - Piggy Bank Coin Catcher Game Loop & Manager
 * Direct player-controlled Piggy Bank, mid-air ricochet obstacles from demo.mp4,
 * falling item waves, power-ups, hazards, and score API.
 */

class CoinGame {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');

        // Logical resolution
        this.width = 1080;
        this.height = 1920;

        // Subsystems
        this.particles = new ParticleSystem();
        this.ui = new UIManager(this);

        // Player, Items & Obstacles
        this.player = new PlayerPiggy(540, 1680);
        this.items = [];
        this.bumpers = [];
        this.rotators = [];
        this.ringBumpers = [];
        this.pegs = [];

        // Game State
        this.state = 'PLAYING'; // 'PLAYING' | 'WIN' | 'GAMEOVER'
        this.currentLevelIndex = 0;
        this.currentLevel = null;
        this.lives = 3;
        this.coinsCaught = 0;
        this.score = 0;

        // Spawner & Screen Shake
        this.spawnTimer = 0;
        this.shakeAmount = 0;

        // Timing
        this.lastTime = performance.now();

        // Load Level 1 by default
        this.loadLevel(1);
    }

    loadLevel(levelNumber) {
        const idx = LEVELS.findIndex(l => l.levelNumber === levelNumber);
        this.currentLevelIndex = idx !== -1 ? idx : 0;
        this.currentLevel = LEVELS[this.currentLevelIndex];

        this.lives = 3;
        this.coinsCaught = 0;
        this.score = 0;
        this.items = [];
        this.particles.reset();
        this.player = new PlayerPiggy(540, 1680);
        this.spawnTimer = 0.5;
        this.shakeAmount = 0;
        this.state = 'PLAYING';
        this.ui.closeModal();

        // Instantiate Stage Obstacles for this level
        this.bumpers = (this.currentLevel.bumpers || []).map(c => new StageBumper(c));
        this.rotators = (this.currentLevel.rotators || []).map(c => new StageRotator(c));
        this.ringBumpers = (this.currentLevel.ringBumpers || []).map(c => new StageRingBumper(c.x, c.y, c.radius));
        this.pegs = (this.currentLevel.pegs || []).map(c => new StagePeg(c.x, c.y, c.radius, c.noteIndex));

        console.log(`[CoinGame] Loaded Level ${this.currentLevel.levelNumber}: ${this.currentLevel.name} (Bumpers: ${this.bumpers.length}, Rotators: ${this.rotators.length}, Rings: ${this.ringBumpers.length}, Pegs: ${this.pegs.length})`);
    }

    restartLevel() {
        if (this.currentLevel) {
            this.loadLevel(this.currentLevel.levelNumber);
        }
    }

    nextLevel() {
        let nextIdx = this.currentLevelIndex + 1;
        if (nextIdx >= LEVELS.length) nextIdx = 0;
        this.loadLevel(LEVELS[nextIdx].levelNumber);
    }

    prevLevel() {
        let prevIdx = this.currentLevelIndex - 1;
        if (prevIdx < 0) prevIdx = LEVELS.length - 1;
        this.loadLevel(LEVELS[prevIdx].levelNumber);
    }

    // ==========================================
    // SPAWNER LOGIC
    // ==========================================
    spawnItem() {
        const lvl = this.currentLevel;
        if (!lvl) return;

        // Spawn X between 120 and 960
        const spawnX = 120 + Math.random() * 840;
        const spawnY = -50;
        const speed = lvl.baseSpeed + (Math.random() - 0.5) * 50;
        const hasWind = lvl.hasWind;

        // Determine item type
        const roll = Math.random();
        let type = 'coin';

        if (roll < lvl.bombChance) {
            type = 'bomb';
        } else if (roll < (lvl.bombChance + lvl.starChance)) {
            type = 'star';
        } else if (roll < (lvl.bombChance + lvl.starChance + lvl.magnetChance)) {
            type = 'magnet';
        } else if (roll < (lvl.bombChance + lvl.starChance + lvl.magnetChance + lvl.multiplierChance)) {
            type = 'multiplier';
        }

        this.items.push(new FallingItem(type, spawnX, spawnY, speed, hasWind));
    }

    // ==========================================
    // INPUT HANDLING
    // ==========================================
    onPointerDown(px, py) {
        SoundEngine.init();

        if (this.ui.handleClick(px, py)) {
            return;
        }

        if (this.state !== 'PLAYING') return;

        this.player.setTargetX(px);
    }

    onPointerMove(px, py) {
        if (this.state !== 'PLAYING') return;
        this.player.setTargetX(px);
    }

    onPointerUp() {
        // Nothing on up
    }

    moveByKeyboard(dx) {
        if (this.state !== 'PLAYING') return;
        this.ui.showTutorial = false;
        this.player.setTargetX(this.player.targetX + dx);
    }

    // ==========================================
    // UPDATE & COLLISIONS
    // ==========================================
    update(dt) {
        dt = Math.min(dt, 0.05);

        // Screen Shake decay
        if (this.shakeAmount > 0) {
            this.shakeAmount = Math.max(0, this.shakeAmount - dt * 45);
        }

        this.player.update(dt);
        this.particles.update(dt);

        // Update stage obstacles
        for (let b of this.bumpers) b.update(dt);
        for (let r of this.rotators) r.update(dt);
        for (let rb of this.ringBumpers) rb.update(dt);
        for (let p of this.pegs) p.update(dt);

        if (this.state !== 'PLAYING') return;

        // Item Spawning
        this.spawnTimer -= dt;
        if (this.spawnTimer <= 0) {
            this.spawnTimer = this.currentLevel.spawnInterval;
            this.spawnItem();
        }

        // Catch zone bounds
        const catchCenterX = this.player.x;
        const catchCenterY = this.player.y + this.player.slotOffset;
        const catchRx = this.player.catchWidth / 2;
        const catchRy = this.player.catchHeight / 2;

        // Update Items & Collision Check
        for (let i = this.items.length - 1; i >= 0; i--) {
            const item = this.items[i];
            item.update(dt, this.player, this.particles);

            // ----------------------------------------------------
            // 1. Check Collisions with Stage Obstacles (RICOCHET!)
            // ----------------------------------------------------

            // A. Collide with Capsule Bumpers
            for (let bumper of this.bumpers) {
                const seg = bumper.getSegment();
                const hit = Physics.resolveCircleCapsule(
                    item,
                    seg.x1, seg.y1, seg.x2, seg.y2,
                    seg.radius,
                    bumper.restitution
                );
                if (hit) {
                    // Impart sideways glance velocity based on offset from bumper center
                    const offsetFraction = (item.x - bumper.x) / (bumper.width * 0.5);
                    item.vx += offsetFraction * 220;

                    this.particles.emitCollisionSparks(hit.hitX, hit.hitY, hit.nx, hit.ny);
                    SoundEngine.playBounce(hit.impactSpeed / 700);
                }
            }

            // B. Collide with Rotators (Angled/Spinning Paddles)
            for (let rotator of this.rotators) {
                const seg = rotator.getSegment();
                const hit = Physics.resolveCircleCapsule(
                    item,
                    seg.x1, seg.y1, seg.x2, seg.y2,
                    seg.radius,
                    rotator.restitution
                );
                if (hit) {
                    this.particles.emitCollisionSparks(hit.hitX, hit.hitY, hit.nx, hit.ny);
                    SoundEngine.playBounce(hit.impactSpeed / 700);
                }
            }

            // C. Collide with Silver Ring Bumpers
            for (let rb of this.ringBumpers) {
                const hit = Physics.resolveCircleCircle(
                    item,
                    rb.x, rb.y,
                    rb.radius,
                    rb.restitution
                );
                if (hit) {
                    rb.hit();
                    this.particles.emitCollisionSparks(hit.hitX, hit.hitY, hit.nx, hit.ny);
                    SoundEngine.playMetallicBumper();
                }
            }

            // D. Collide with Musical Plinko Pegs
            for (let peg of this.pegs) {
                const hit = Physics.resolveCircleCircle(
                    item,
                    peg.x, peg.y,
                    peg.radius,
                    peg.restitution
                );
                if (hit) {
                    peg.hit();
                    this.particles.emitCollisionSparks(hit.hitX, hit.hitY, hit.nx, hit.ny);
                    SoundEngine.playPegChime(peg.noteIndex);
                }
            }

            // ----------------------------------------------------
            // 2. Check Catch Collision with Player Piggy Bank
            // ----------------------------------------------------
            const normX = (item.x - catchCenterX) / catchRx;
            const normY = (item.y - catchCenterY) / catchRy;
            const isCaught = (normX * normX + normY * normY) <= 1.1;

            if (isCaught && !item.isDead) {
                item.isDead = true;

                if (item.type === 'coin') {
                    this.coinsCaught++;
                    const mult = this.player.multiplierTimer > 0 ? 2 : 1;
                    const pts = 100 * mult;
                    this.score += pts;

                    this.player.onCatchCoin(false);
                    SoundEngine.playPiggyCollect();
                    this.particles.emitPiggyCoins(item.x, item.y);
                    this.particles.addPopup(item.x, item.y - 40, `+${pts}`, '#ffd43b');

                    if (this.coinsCaught >= this.currentLevel.targetCoins) {
                        this.triggerWin();
                        return;
                    }
                } else if (item.type === 'star') {
                    this.coinsCaught++;
                    const mult = this.player.multiplierTimer > 0 ? 2 : 1;
                    const pts = 300 * mult;
                    this.score += pts;

                    this.player.onCatchCoin(true);
                    SoundEngine.playStarChime();
                    this.particles.emitPiggyCoins(item.x, item.y);
                    this.particles.addPopup(item.x, item.y - 40, `★ +${pts}`, '#ffe066');

                    if (this.coinsCaught >= this.currentLevel.targetCoins) {
                        this.triggerWin();
                        return;
                    }
                } else if (item.type === 'magnet') {
                    this.player.activateMagnet(6.0);
                    SoundEngine.playPowerUp();
                    this.particles.emitPowerUpAura(item.x, item.y, '#00f2fe');
                    this.particles.addPopup(item.x, item.y - 40, '🧲 MAGNET!', '#00f2fe');
                } else if (item.type === 'multiplier') {
                    this.player.activateMultiplier(8.0);
                    SoundEngine.playPowerUp();
                    this.particles.emitPowerUpAura(item.x, item.y, '#51cf66');
                    this.particles.addPopup(item.x, item.y - 40, '⚡ 2X SCORE!', '#51cf66');
                } else if (item.type === 'bomb') {
                    this.lives = Math.max(0, this.lives - 1);
                    this.shakeAmount = 30;
                    this.player.onHitBomb();

                    SoundEngine.playBombExplosion();
                    SoundEngine.playHurt();
                    this.particles.emitBombExplosion(item.x, item.y);
                    this.particles.addPopup(item.x, item.y - 50, '💥 -1 LIFE!', '#ff6b6b');

                    if (this.lives <= 0) {
                        this.triggerGameOver();
                        return;
                    }
                }
            }

            if (item.isDead) {
                this.items.splice(i, 1);
            }
        }
    }

    triggerWin() {
        this.state = 'WIN';

        let stars = 1;
        if (this.lives === 3) stars = 3;
        else if (this.lives === 2) stars = 2;

        const bonus = this.lives * 500;
        this.score += bonus;

        this.particles.emitConfetti(this.width, this.height);
        SoundEngine.playLevelWin();

        const resultData = {
            score: this.score,
            level: this.currentLevel.levelNumber,
            coinsCaught: this.coinsCaught,
            target: this.currentLevel.targetCoins,
            livesLeft: this.lives,
            status: 'win',
            stars: stars
        };

        if (typeof SendScoreApi !== 'undefined' && SendScoreApi.sendScore) {
            SendScoreApi.sendScore(resultData);
        }

        setTimeout(() => {
            this.ui.openLevelComplete(resultData);
        }, 600);
    }

    triggerGameOver() {
        this.state = 'GAMEOVER';
        SoundEngine.playGameOver();

        const resultData = {
            score: this.score,
            level: this.currentLevel.levelNumber,
            coinsCaught: this.coinsCaught,
            target: this.currentLevel.targetCoins,
            livesLeft: 0,
            status: 'gameover',
            stars: 0
        };

        if (typeof SendScoreApi !== 'undefined' && SendScoreApi.sendScore) {
            SendScoreApi.sendScore(resultData);
        }

        setTimeout(() => {
            this.ui.openGameOver(resultData);
        }, 500);
    }

    // ==========================================
    // RENDER
    // ==========================================
    render() {
        const ctx = this.ctx;

        ctx.clearRect(0, 0, this.width, this.height);

        ctx.save();

        // Screen Shake
        if (this.shakeAmount > 0) {
            const sx = (Math.random() - 0.5) * this.shakeAmount;
            const sy = (Math.random() - 0.5) * this.shakeAmount;
            ctx.translate(sx, sy);
        }

        // 1. Vibrant Magenta/Pink Background
        const bgGrad = ctx.createLinearGradient(0, 0, 0, this.height);
        bgGrad.addColorStop(0, '#f01d5d');
        bgGrad.addColorStop(0.5, '#e41355');
        bgGrad.addColorStop(1, '#b80c3f');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, this.width, this.height);

        const radialGlow = ctx.createRadialGradient(540, 960, 200, 540, 960, 1000);
        radialGlow.addColorStop(0, 'rgba(255, 105, 150, 0.15)');
        radialGlow.addColorStop(1, 'rgba(0, 0, 0, 0.25)');
        ctx.fillStyle = radialGlow;
        ctx.fillRect(0, 0, this.width, this.height);

        // 2. Render Stage Obstacles (Behind falling items)
        for (let rb of this.ringBumpers) rb.render(ctx);
        for (let b of this.bumpers) b.render(ctx);
        for (let r of this.rotators) r.render(ctx);
        for (let p of this.pegs) p.render(ctx);

        // 3. Render Falling Items
        for (let item of this.items) {
            item.render(ctx);
        }

        // 4. Render Player Piggy
        this.player.render(ctx);

        // 5. Render Particles
        this.particles.render(ctx);

        ctx.restore();

        // 6. Render UI HUD & Modals
        this.ui.render(ctx);
    }

    startLoop() {
        const loop = (currentTime) => {
            const dt = (currentTime - this.lastTime) / 1000;
            this.lastTime = currentTime;

            this.update(dt);
            this.render();

            requestAnimationFrame(loop);
        };
        requestAnimationFrame(loop);
    }
}

if (typeof window !== 'undefined') {
    window.CoinGame = CoinGame;
}
