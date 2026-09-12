/**
 * scripts/game.js - Construct 3 Style Tower Stacker Game Manager
 * Coordinates game states, single base block start, sudden death (1 miss),
 * spring-damper sway physics, combo streak bonuses, and SendScoreApi integration.
 */

class TowerGame {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');

        // Subsystems
        this.sound = new SoundEngine();
        this.particles = new ParticleSystem();
        this.background = new BackgroundRenderer();
        this.ui = new UIManager();

        // High Score
        this.bestScore = 14;
        try {
            const savedBest = localStorage.getItem('tower_best_score');
            if (savedBest !== null) {
                this.bestScore = parseInt(savedBest, 10) || 14;
            }
        } catch (e) {}

        // State Machine: 'MENU' | 'PLAYING' | 'GAMEOVER'
        this.state = 'MENU';
        this.score = 0;
        this.lives = 1;
        this.combo = 0;
        this.maxCombo = 0;
        this.perfectDrops = 0;

        // Entities
        this.stack = [];
        this.activeBlock = new ActiveBlock();
        this.fallingMissBlock = null;

        // Camera & Physics
        this.cameraY = 0;
        this.targetCameraY = 0;
        this.swayAngle = 0;
        this.swayVelocity = 0;

        // Ghost Click Cooldown
        this.dropCooldownUntil = 0;

        // Loop Timing
        this.lastTime = performance.now();
        this.isLoopRunning = false;

        // Bind UI and Events
        this.init();
    }

    init() {
        this.ui.bindEvents({
            onStart: () => this.startGame(),
            onTryAgain: () => this.startGame(),
            onMainMenu: () => this.startMenu(),
            soundEngine: this.sound
        });

        this.startMenu();
    }

    startMenu() {
        this.state = 'MENU';
        this.score = 0;
        this.lives = 1;
        this.combo = 0;
        this.particles.reset();
        this.fallingMissBlock = null;

        // 1 Base Block at Ground Center
        const groundY = GamePhysics.GROUND_Y;
        const blockW = GamePhysics.BLOCK_W;
        const blockH = GamePhysics.BLOCK_H;
        const baseX = (GamePhysics.CANVAS_W - blockW) / 2;
        const baseY = groundY - blockH;

        this.stack = [new StackBlock(baseX, baseY, 0)];
        this.cameraY = 0;
        this.targetCameraY = 0;
        this.swayAngle = 0;
        this.swayVelocity = 0;

        this.activeBlock.reset(1, 560);
        this.ui.showStartMenu();
        this.ui.updateHUD(0, 1, this.bestScore);
    }

    startGame() {
        this.score = 0;
        this.lives = 1;
        this.combo = 0;
        this.maxCombo = 0;
        this.perfectDrops = 0;
        this.fallingMissBlock = null;
        this.particles.reset();

        // 1 Base Block Only!
        const groundY = GamePhysics.GROUND_Y;
        const blockW = GamePhysics.BLOCK_W;
        const blockH = GamePhysics.BLOCK_H;
        const baseX = (GamePhysics.CANVAS_W - blockW) / 2;
        const baseY = groundY - blockH;

        this.stack = [new StackBlock(baseX, baseY, 0)];
        this.cameraY = 0;
        this.targetCameraY = 0;
        this.swayAngle = 0;
        this.swayVelocity = 0;

        // Next active block color and alternating side spawn
        const nextColor = 1;
        this.activeBlock.spawnIndex = 0;
        this.activeBlock.reset(nextColor, 560);

        // State & Cooldown Protection (350ms to absorb button click/touch-up)
        this.state = 'PLAYING';
        this.dropCooldownUntil = Date.now() + 350;

        this.ui.hideOverlays();
        this.ui.updateHUD(0, 1, this.bestScore);
        this.sound.playBGM();
    }

    triggerDrop() {
        if (this.state !== 'PLAYING') return;
        if (Date.now() < this.dropCooldownUntil) return;
        if (this.activeBlock.isDropping) return;

        this.activeBlock.triggerDrop();
        this.sound.playDrop();
    }

    checkLanding() {
        const topBlock = this.stack[this.stack.length - 1];
        if (!topBlock) return;

        const targetY = topBlock.y - GamePhysics.BLOCK_H;
        const activeScreenY = this.activeBlock.y;
        const targetScreenY = targetY + this.cameraY;

        // Check if block reached the landing height
        if (activeScreenY >= targetScreenY) {
            const landing = GamePhysics.evaluateLanding(this.activeBlock.x, topBlock.x);

            if (landing.type === 'PERFECT') {
                this.combo++;
                if (this.combo > this.maxCombo) this.maxCombo = this.combo;
                this.perfectDrops++;

                const comboMultiplier = Math.min(this.combo, 5);
                const points = 1 * comboMultiplier;
                this.score += points;

                // Create and snap new block to dead center
                const newBlock = new StackBlock(landing.landedX, targetY, this.activeBlock.colorIndex);
                newBlock.triggerLandSquash();
                this.stack.push(newBlock);

                // Effects & Audio
                const centerX = landing.landedX + GamePhysics.BLOCK_W / 2;
                this.particles.addPerfectBurst(centerX, targetY + GamePhysics.BLOCK_H);
                this.particles.addScorePopup(centerX, targetY + 20, this.combo > 1 ? `PERFECT! x${this.combo}` : 'PERFECT!', '#ffeb3b');
                this.ui.showComboBanner(this.combo > 1 ? `PERFECT! x${this.combo}` : 'PERFECT!');
                this.sound.playThud();
                this.sound.playPerfectChime(this.combo);

                this.onSuccessfulPlacement(newBlock);
            } else if (landing.type === 'GOOD') {
                this.combo = 0;
                this.score += 1;

                const newBlock = new StackBlock(landing.landedX, targetY, this.activeBlock.colorIndex);
                newBlock.rotation = landing.tilt;
                newBlock.triggerLandSquash();
                this.stack.push(newBlock);

                // Tower sway impulse
                this.swayVelocity += (landing.diffX / GamePhysics.BLOCK_W) * 0.22;

                const centerX = landing.landedX + GamePhysics.BLOCK_W / 2;
                this.particles.addImpactDust(centerX, targetY + GamePhysics.BLOCK_H);
                this.particles.addScorePopup(centerX, targetY + 20, '+1', '#ffffff');
                this.sound.playThud();

                this.onSuccessfulPlacement(newBlock);
            } else {
                // Sudden Death: 1 Miss = Game Over!
                this.onMissLanding(landing);
            }
        }
    }

    onSuccessfulPlacement(newBlock) {
        // Smooth camera follow once the tower reaches optimal view threshold
        this.targetCameraY = Math.max(0, GamePhysics.TARGET_SCREEN_TOP_Y - newBlock.y);

        // Update HUD
        this.ui.updateHUD(this.score, this.lives, Math.max(this.score, this.bestScore));

        // Spawn next block
        const nextColor = (newBlock.colorIndex + 1) % BLOCK_COLORS.length;
        const nextSpeed = Math.min(840, 560 + this.stack.length * 12);
        this.activeBlock.reset(nextColor, nextSpeed);
    }

    onMissLanding(landing) {
        this.lives = 0;
        this.ui.updateHUD(this.score, 0, this.bestScore);
        this.sound.playMissTumble();

        // Mark stack top blocks as sad
        for (let i = Math.max(0, this.stack.length - 3); i < this.stack.length; i++) {
            this.stack[i].isSad = true;
        }

        // Setup tumbling block
        this.fallingMissBlock = {
            x: this.activeBlock.x,
            y: this.activeBlock.y,
            w: this.activeBlock.w,
            h: this.activeBlock.h,
            colorData: this.activeBlock.colorData,
            vy: 200,
            vx: Math.sign(landing.diffX || 1) * (180 + Math.random() * 80),
            angle: 0,
            angVel: Math.sign(landing.diffX || 1) * 8.5
        };

        // Deactivate active block
        this.activeBlock.y = 9999;
        this.activeBlock.isDropping = false;

        // Trigger Game Over screen after 0.5s tumble
        setTimeout(() => {
            this.triggerGameOver();
        }, 500);
    }

    triggerGameOver() {
        if (this.state === 'GAMEOVER') return;
        this.state = 'GAMEOVER';

        this.sound.playGameOverFanfare();

        const isNewRecord = this.score > this.bestScore;
        if (isNewRecord) {
            this.bestScore = this.score;
            try {
                localStorage.setItem('tower_best_score', this.bestScore);
            } catch (e) {}
        }

        this.ui.updateHUD(this.score, 0, this.bestScore);

        // Call sendScore function from send_score_api.js on Game Over
        if (typeof sendScore === 'function') {
            try {
                sendScore(this.score);
            } catch (e) {
                console.error('[TowerGame] sendScore error:', e);
            }
        } else if (typeof window !== 'undefined' && typeof window.sendScore === 'function') {
            try {
                window.sendScore(this.score);
            } catch (e) {
                console.error('[TowerGame] window.sendScore error:', e);
            }
        }

        // Send score via Construct 3 reporting API (if available)
        if (typeof SendScoreApi !== 'undefined') {
            SendScoreApi.sendScore({
                score: this.score,
                bestScore: this.bestScore,
                perfectDrops: this.perfectDrops,
                maxCombo: this.maxCombo,
                status: 'gameover'
            });
        }

        // Show Game Over Modal
        this.ui.showGameOver({
            score: this.score,
            best: this.bestScore,
            isNewRecord: isNewRecord,
            perfectDrops: this.perfectDrops,
            maxCombo: this.maxCombo
        });

        // Cooldown before any restart clicks can be processed
        this.dropCooldownUntil = Date.now() + 350;
    }

    update(dt) {
        // Clamp large delta jumps
        dt = Math.min(0.05, Math.max(0.001, dt));

        // Background
        this.background.update(dt);

        // Camera Lerp
        this.cameraY = GamePhysics.updateCamera(this.cameraY, this.targetCameraY, dt);

        // Tower Spring Sway Dynamics
        const springK = 38;
        const damping = 4.2;
        const springForce = -springK * this.swayAngle;
        this.swayVelocity += (springForce - damping * this.swayVelocity) * dt;
        this.swayAngle += this.swayVelocity * dt;

        // Active Block
        if (this.state === 'PLAYING') {
            this.activeBlock.update(dt);
            if (this.activeBlock.isDropping) {
                this.checkLanding();
            }
        }

        // Stack Blocks update (eye tracking & squash)
        const targetLookPos = (this.state === 'PLAYING' && !this.activeBlock.isDropping)
            ? { x: this.activeBlock.x + this.activeBlock.w / 2, y: this.activeBlock.y - this.cameraY }
            : null;

        for (let i = 0; i < this.stack.length; i++) {
            this.stack[i].update(dt, targetLookPos);
        }

        // Tumbling miss block
        if (this.fallingMissBlock) {
            this.fallingMissBlock.vy += GamePhysics.DROP_GRAVITY * 0.7 * dt;
            this.fallingMissBlock.y += this.fallingMissBlock.vy * dt;
            this.fallingMissBlock.x += this.fallingMissBlock.vx * dt;
            this.fallingMissBlock.angle += this.fallingMissBlock.angVel * dt;
        }

        // Particles
        this.particles.update(dt);
    }

    draw() {
        const ctx = this.ctx;
        const w = GamePhysics.CANVAS_W;
        const h = GamePhysics.CANVAS_H;

        ctx.clearRect(0, 0, w, h);

        // 1. Parallax Bamboo & Sky Background
        this.background.draw(ctx, this.cameraY);

        // 2. Stacked Blocks
        const stackLen = this.stack.length;
        for (let i = 0; i < stackLen; i++) {
            const heightFraction = (i + 1) / Math.max(1, stackLen);
            const swayOffsetX = Math.sin(this.swayAngle) * (heightFraction * 42);
            this.stack[i].draw(ctx, this.cameraY, swayOffsetX);
        }

        // 3. Falling Tumbling Miss Block
        if (this.fallingMissBlock) {
            ctx.save();
            ctx.translate(this.fallingMissBlock.x + this.fallingMissBlock.w / 2, this.fallingMissBlock.y + this.fallingMissBlock.h / 2);
            ctx.rotate(this.fallingMissBlock.angle);

            ctx.beginPath();
            ctx.roundRect(-this.fallingMissBlock.w / 2, -this.fallingMissBlock.h / 2, this.fallingMissBlock.w, this.fallingMissBlock.h, 18);
            ctx.fillStyle = this.fallingMissBlock.colorData.fill;
            ctx.fill();
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 9;
            ctx.stroke();

            ctx.restore();
        }

        // 4. Particles (Behind active dropping block)
        this.particles.draw(ctx, this.cameraY);

        // 5. Active Incoming / Dropping Block
        if (this.state === 'PLAYING') {
            this.activeBlock.draw(ctx);
        }
    }

    startLoop() {
        if (this.isLoopRunning) return;
        this.isLoopRunning = true;
        this.lastTime = performance.now();

        const loop = (currentTime) => {
            const dt = (currentTime - this.lastTime) / 1000;
            this.lastTime = currentTime;

            this.update(dt);
            this.draw();

            requestAnimationFrame(loop);
        };
        requestAnimationFrame(loop);
    }
}

if (typeof window !== 'undefined') {
    window.TowerGame = TowerGame;
}

