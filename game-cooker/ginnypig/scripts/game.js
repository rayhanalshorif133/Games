/**
 * game.js - Piggy Bank Coin Catcher Game Loop & Linear Flow Manager
 * Seamless linear progression, automatic obstacle spawning, gradual difficulty curve,
 * power-ups (Magnet, 2X Multiplier, Life Heart), and 3-lives system.
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
        this.state = 'PLAYING'; // 'PLAYING' | 'GAMEOVER'
        this.currentLevelIndex = 0;
        this.currentLevel = null;
        this.lives = 3;
        this.coinsCaughtInLevel = 0;
        this.totalCoinsCaught = 0;
        this.score = 0;

        // Spawner & Screen Shake
        this.spawnTimer = 0.5;
        this.shakeAmount = 0;

        // Controls & Steering State
        this.isHoldingLeft = false;
        this.isHoldingRight = false;

        // Level Up In-Game Floating Banner
        this.levelUpBanner = null;

        // Timing
        this.lastTime = performance.now();

        // Start from Level 1
        this.loadLevel(1);
    }

    loadLevel(levelNumber) {
        const idx = LEVELS.findIndex(l => l.levelNumber === levelNumber);
        this.currentLevelIndex = idx !== -1 ? idx : 0;
        this.currentLevel = LEVELS[this.currentLevelIndex];

        this.lives = 3;
        this.coinsCaughtInLevel = 0;
        this.totalCoinsCaught = 0;
        this.score = 0;
        this.clicks = 0;
        this.isHoldingLeft = false;
        this.isHoldingRight = false;
        this.startTime = Date.now();
        if (typeof globalThis !== 'undefined') {
            globalThis.gameStartTime = this.startTime;
            globalThis.gameClickCount = 0;
        }
        this.items = [];
        this.particles.reset();
        this.player = new PlayerPiggy(540, 1680);
        this.spawnTimer = 0.6;
        this.shakeAmount = 0;
        this.levelUpBanner = null;
        this.state = 'PLAYING';
        this.ui.closeModal();

        // Instantiate Stage Obstacles for this level
        this.bumpers = (this.currentLevel.bumpers || []).map(c => new StageBumper(c));
        this.rotators = (this.currentLevel.rotators || []).map(c => new StageRotator(c));
        this.ringBumpers = (this.currentLevel.ringBumpers || []).map(c => new StageRingBumper(c.x, c.y, c.radius));
        this.pegs = (this.currentLevel.pegs || []).map(c => new StagePeg(c.x, c.y, c.radius, c.noteIndex));

        console.log(`[CoinGame] Loaded Level ${this.currentLevel.levelNumber}: ${this.currentLevel.name}`);
    }

    restartLevel() {
        this.loadLevel(this.currentLevel ? this.currentLevel.levelNumber : 1);
    }

    advanceLevelLinear() {
        this.currentLevelIndex++;

        // If beyond standard levels, loop templates with increased difficulty
        if (this.currentLevelIndex < LEVELS.length) {
            this.currentLevel = LEVELS[this.currentLevelIndex];
        } else {
            // Endless progression: recycle advanced stages with speed boost
            const baseTemplate = LEVELS[5 + (this.currentLevelIndex % 5)];
            const loopMultiplier = Math.floor(this.currentLevelIndex / LEVELS.length);
            this.currentLevel = {
                ...baseTemplate,
                levelNumber: this.currentLevelIndex + 1,
                name: `${baseTemplate.name} +${loopMultiplier}`,
                targetCoins: baseTemplate.targetCoins + loopMultiplier * 10,
                baseSpeed: baseTemplate.baseSpeed + loopMultiplier * 50,
                spawnInterval: Math.max(0.38, baseTemplate.spawnInterval - loopMultiplier * 0.05)
            };
        }

        this.coinsCaughtInLevel = 0;

        // Level Up Bonus (lowered, realistic score)
        const bonus = 10 + this.lives * 5;
        this.score += bonus;

        // Visual and Audio Celebration (No Popup!)
        this.particles.emitConfetti(this.width, this.height);
        SoundEngine.playLevelWin();

        // Trigger on-screen banner
        this.levelUpBanner = {
            timer: 2.6,
            maxTimer: 2.6,
            levelNumber: this.currentLevel.levelNumber,
            name: this.currentLevel.name,
            bonus: bonus
        };

        // Smoothly Transition Stage Obstacles
        this.bumpers = (this.currentLevel.bumpers || []).map(c => new StageBumper(c));
        this.rotators = (this.currentLevel.rotators || []).map(c => new StageRotator(c));
        this.ringBumpers = (this.currentLevel.ringBumpers || []).map(c => new StageRingBumper(c.x, c.y, c.radius));
        this.pegs = (this.currentLevel.pegs || []).map(c => new StagePeg(c.x, c.y, c.radius, c.noteIndex));

        console.log(`[CoinGame] Advanced seamlessly to Level ${this.currentLevel.levelNumber}: ${this.currentLevel.name}`);
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
        const speed = lvl.baseSpeed + (Math.random() - 0.5) * 40;
        const hasWind = lvl.hasWind;

        // Determine item type based on level's progressive probability tables
        const roll = Math.random();
        let type = 'coin';

        const bombChance = lvl.bombChance || 0;
        const starChance = lvl.starChance || 0.15;
        const magnetChance = lvl.magnetChance || 0.08;
        const multiplierChance = lvl.multiplierChance || 0.05;
        const heartChance = (this.lives < 3) ? (lvl.heartChance || 0.05) : 0.01;

        if (roll < bombChance) {
            type = 'bomb';
        } else if (roll < (bombChance + starChance)) {
            type = 'star';
        } else if (roll < (bombChance + starChance + magnetChance)) {
            type = 'magnet';
        } else if (roll < (bombChance + starChance + magnetChance + multiplierChance)) {
            type = 'multiplier';
        } else if (roll < (bombChance + starChance + magnetChance + multiplierChance + heartChance)) {
            type = 'heart';
        }

        this.items.push(new FallingItem(type, spawnX, spawnY, speed, hasWind));
    }

    // ==========================================
    // INPUT HANDLING
    // ==========================================
    onPointerDown(px, py) {
        SoundEngine.init();

        this.clicks++;
        if (typeof globalThis !== 'undefined') {
            globalThis.gameClickCount = this.clicks;
        }

        if (this.ui.handleClick(px, py)) {
            return;
        }

        if (this.state !== 'PLAYING') return;

        this.player.setTargetX(px);
    }

    onPointerMove(px, py) {
        if (this.state !== 'PLAYING') return;
        if (this.isHoldingLeft || this.isHoldingRight) return;
        this.player.setTargetX(px);
    }

    onPointerUp() {
        this.ui.handlePointerUp();
        this.isHoldingLeft = false;
        this.isHoldingRight = false;
    }

    moveByKeyboard(dx) {
        if (this.state !== 'PLAYING') return;
        this.clicks++;
        if (typeof globalThis !== 'undefined') {
            globalThis.gameClickCount = this.clicks;
        }
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

        // Continuous button steering
        if (this.state === 'PLAYING') {
            if (this.isHoldingLeft) {
                this.player.setTargetX(this.player.targetX - 1100 * dt);
            }
            if (this.isHoldingRight) {
                this.player.setTargetX(this.player.targetX + 1100 * dt);
            }
        }

        // Level Up Banner update
        if (this.levelUpBanner) {
            this.levelUpBanner.timer -= dt;
            if (this.levelUpBanner.timer <= 0) {
                this.levelUpBanner = null;
            }
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
                    this.coinsCaughtInLevel++;
                    this.totalCoinsCaught++;
                    const mult = this.player.multiplierTimer > 0 ? 2 : 1;
                    const pts = 1 * mult;
                    this.score += pts;

                    this.player.onCatchCoin(false);
                    SoundEngine.playPiggyCollect();
                    this.particles.emitPiggyCoins(item.x, item.y);
                    this.particles.addPopup(item.x, item.y - 40, `+${pts}`, '#ffd43b');

                    if (this.coinsCaughtInLevel >= this.currentLevel.targetCoins) {
                        this.advanceLevelLinear();
                        return;
                    }
                } else if (item.type === 'star') {
                    this.coinsCaughtInLevel++;
                    this.totalCoinsCaught++;
                    const mult = this.player.multiplierTimer > 0 ? 2 : 1;
                    const pts = 3 * mult;
                    this.score += pts;

                    this.player.onCatchCoin(true);
                    SoundEngine.playStarChime();
                    this.particles.emitPiggyCoins(item.x, item.y);
                    this.particles.addPopup(item.x, item.y - 40, `★ +${pts}`, '#ffe066');

                    if (this.coinsCaughtInLevel >= this.currentLevel.targetCoins) {
                        this.advanceLevelLinear();
                        return;
                    }
                } else if (item.type === 'heart') {
                    if (this.lives < 3) {
                        this.lives++;
                    }
                    const pts = 2;
                    this.score += pts;
                    this.player.happyTimer = 0.45;
                    SoundEngine.playLifeHeart();
                    this.particles.emitPowerUpAura(item.x, item.y, '#ff4d6d');
                    this.particles.addPopup(item.x, item.y - 40, this.lives === 3 ? '❤️ MAX LIFE!' : '❤️ +1 LIFE!', '#ff4d6d');
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

    triggerGameOver() {
        this.state = 'GAMEOVER';
        SoundEngine.playGameOver();

        const finalScore = this.score;
        const clicks = this.clicks;
        const duration = Math.max(1, Math.round((Date.now() - this.startTime) / 1000));

        if (typeof globalThis !== 'undefined') {
            globalThis.gameDuration = duration;
        }

        const payload = {
            score: finalScore,
            clicks: clicks,
            duration: duration
        };

        console.log('[CoinGame] Game Over - payload to send_score_api:', payload);

        if (typeof sendScore === 'function') {
            sendScore(payload);
        } else if (typeof SendScoreApi !== 'undefined' && SendScoreApi.sendScore) {
            SendScoreApi.sendScore(payload);
        }

        setTimeout(() => {
            this.ui.openGameOver(payload);
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

        // 6. Render UI HUD, Modals & Floating Banners
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

