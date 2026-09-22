/**
 * Mr. Bean Jump - Core Game Engine
 * Layout: 1080 x 1920 (9:16 Portrait Arcade)
 */

const VIRTUAL_WIDTH = 1080;
const VIRTUAL_HEIGHT = 1920;

// Game States
const STATE = {
    MENU: 'MENU',
    PLAYING: 'PLAYING',
    GAMEOVER: 'GAMEOVER',
    PAUSED: 'PAUSED'
};

class MrBeanJumpGame {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');

        this.width = VIRTUAL_WIDTH;
        this.height = VIRTUAL_HEIGHT;

        this.canvas.width = this.width;
        this.canvas.height = this.height;

        this.state = STATE.MENU;
        this.score = 0;
        this.bestScore = 0;
        this.combo = 0;
        this.maxCombo = 0;
        this.totalPerfects = 0;

        // Camera
        this.cameraY = 0;
        this.targetCameraY = 0;
        this.screenShake = 0;

        // Assets
        this.images = {};
        this.assetsLoaded = false;

        // Game Entities
        this.stack = [];
        this.activeCrate = null;
        this.bean = null;
        this.particles = [];
        this.floatingTexts = [];
        this.clouds = [];
        this.bushes = [];

        // Missions
        this.missions = [
            { id: 1, title: 'Score 10 points in one game', target: 10, type: 'score', completed: false },
            { id: 2, title: 'Get 3 Perfect Jumps in a row', target: 3, type: 'combo', completed: false },
            { id: 3, title: 'Build a tower of 25 crates', target: 25, type: 'score', completed: false },
            { id: 4, title: 'Reach Master Level (50 points)', target: 50, type: 'score', completed: false }
        ];
        this.currentMissionIndex = 0;

        // Timers
        this.lastTime = performance.now();
        this.spawnTimer = 0;
        this.gameTime = 0;

        this.loadStorage();
        this.initInput();
        this.loadAssets().then(() => {
            this.initEnvironment();
            this.resetGame();
            this.resizeCanvas();
            window.addEventListener('resize', () => this.resizeCanvas());
            requestAnimationFrame((t) => this.loop(t));
        });
    }

    loadStorage() {
        try {
            const savedBest = localStorage.getItem('mrbean_jump_best');
            if (savedBest) this.bestScore = parseInt(savedBest, 10) || 0;
            const savedMission = localStorage.getItem('mrbean_jump_mission');
            if (savedMission) this.currentMissionIndex = parseInt(savedMission, 10) || 0;
        } catch (e) {}
    }

    saveStorage() {
        try {
            localStorage.setItem('mrbean_jump_best', this.bestScore);
            localStorage.setItem('mrbean_jump_mission', this.currentMissionIndex);
        } catch (e) {}
    }

    resizeCanvas() {
        const container = document.getElementById('game-container');
        if (!container) return;

        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        const targetRatio = VIRTUAL_WIDTH / VIRTUAL_HEIGHT;
        const windowRatio = windowWidth / windowHeight;

        let scale = 1;
        if (windowRatio < targetRatio) {
            // Width constrained
            scale = windowWidth / VIRTUAL_WIDTH;
        } else {
            // Height constrained
            scale = windowHeight / VIRTUAL_HEIGHT;
        }

        const renderW = Math.floor(VIRTUAL_WIDTH * scale);
        const renderH = Math.floor(VIRTUAL_HEIGHT * scale);

        this.canvas.style.width = `${renderW}px`;
        this.canvas.style.height = `${renderH}px`;
    }

    async loadAssets() {
        const assetList = {
            crate: 'images/crate.png',
            crate_gold: 'images/crate_gold.png',
            bean_idle: 'images/mrbean_idle.png',
            bean_jump1: 'images/mrbean_jump1.png',
            bean_jump2: 'images/mrbean_jump2.png',
            bean_jump3: 'images/mrbean_jump3.png',
            bean_fall: 'images/mrbean_fall.png',
            cloud1: 'images/cloud1.png',
            cloud2: 'images/cloud2.png',
            bush: 'images/bush.png',
            dust: 'images/dust.png',
            sparkle: 'images/sparkle.png'
        };

        const promises = Object.keys(assetList).map((key) => {
            return new Promise((resolve) => {
                const img = new Image();
                img.src = assetList[key];
                img.onload = () => {
                    this.images[key] = img;
                    resolve();
                };
                img.onerror = () => {
                    console.warn(`Failed loading image: ${assetList[key]}`);
                    resolve();
                };
            });
        });

        await Promise.all(promises);
        this.assetsLoaded = true;
    }

    initEnvironment() {
        // Generate Clouds
        this.clouds = [];
        for (let i = 0; i < 6; i++) {
            this.clouds.push({
                x: Math.random() * VIRTUAL_WIDTH,
                y: -1000 + Math.random() * 2500,
                speed: 15 + Math.random() * 35,
                scale: 0.7 + Math.random() * 0.6,
                type: Math.random() > 0.5 ? 'cloud1' : 'cloud2',
                opacity: 0.65 + Math.random() * 0.35
            });
        }
    }

    resetGame() {
        this.score = 0;
        this.combo = 0;
        this.gameTime = 0;
        this.cameraY = 0;
        this.targetCameraY = 0;
        this.screenShake = 0;
        this.particles = [];
        this.floatingTexts = [];

        // Base Stack
        const crateW = 340;
        const crateH = 140;
        const baseY = 1420;

        this.stack = [
            { x: (VIRTUAL_WIDTH - crateW) / 2, y: baseY, width: crateW, height: crateH, isGold: false },
            { x: (VIRTUAL_WIDTH - crateW) / 2, y: baseY - crateH, width: crateW, height: crateH, isGold: false }
        ];

        const topCrate = this.stack[this.stack.length - 1];

        // Mr Bean
        this.bean = {
            width: 170,
            height: 250,
            x: VIRTUAL_WIDTH / 2,
            y: topCrate.y, // Feet position
            vy: 0,
            gravity: 3300,
            jumpSpeed: -1300,
            isJumping: false,
            jumpPose: 'bean_jump1',
            scaleX: 1,
            scaleY: 1,
            rotation: 0,
            isFalling: false,
            fallVx: 0,
            fallVy: 0
        };

        this.activeCrate = null;
        this.spawnTimer = 0.6; // Small delay before first crate
        this.nextDirection = Math.random() > 0.5 ? 1 : -1;

        this.updateUI();
    }

    initInput() {
        const handleJump = (e) => {
            if (e) {
                if (e.type === 'touchstart') {
                    // prevent default touch scrolling
                    e.preventDefault();
                }
                if (e.target && (e.target.tagName === 'BUTTON' || e.target.closest('button'))) {
                    return; // Ignore UI button clicks
                }
            }

            if (this.state === STATE.MENU) {
                this.startGame();
                return;
            }

            if (this.state === STATE.PLAYING) {
                this.jumpBean();
            } else if (this.state === STATE.GAMEOVER) {
                // Restart if clicked after brief delay
                if (this.gameTime > 0.8) {
                    this.restartGame();
                }
            }
        };

        window.addEventListener('keydown', (e) => {
            if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW' || e.code === 'Enter') {
                e.preventDefault();
                handleJump();
            }
            if (e.code === 'KeyP' || e.code === 'Escape') {
                this.togglePause();
            }
            if (e.code === 'KeyM') {
                this.toggleMute();
            }
        });

        this.canvas.addEventListener('pointerdown', handleJump);
        document.getElementById('start-btn')?.addEventListener('click', () => this.startGame());
        document.getElementById('restart-btn')?.addEventListener('click', () => this.restartGame());
        document.getElementById('pause-btn')?.addEventListener('click', () => this.togglePause());
        document.getElementById('sound-btn')?.addEventListener('click', () => this.toggleMute());
    }

    startGame() {
        this.state = STATE.PLAYING;
        window.Sound?.init();
        window.Sound?.startMusic();
        this.jumpBean();
        this.updateUI();
    }

    restartGame() {
        this.resetGame();
        this.state = STATE.PLAYING;
        window.Sound?.startMusic();
        this.updateUI();
    }

    togglePause() {
        if (this.state === STATE.PLAYING) {
            this.state = STATE.PAUSED;
        } else if (this.state === STATE.PAUSED) {
            this.state = STATE.PLAYING;
        }
        this.updateUI();
    }

    toggleMute() {
        const muted = window.Sound?.toggleMute();
        const soundBtn = document.getElementById('sound-btn');
        if (soundBtn) {
            soundBtn.textContent = muted ? '🔇' : '🔊';
            soundBtn.classList.toggle('muted', muted);
        }
    }

    jumpBean() {
        if (!this.bean || this.bean.isJumping || this.bean.isFalling) return;

        this.bean.isJumping = true;
        this.bean.vy = this.bean.jumpSpeed;
        this.bean.scaleX = 0.85;
        this.bean.scaleY = 1.25;

        // Choose random hilarious jump pose
        const poses = ['bean_jump1', 'bean_jump2', 'bean_jump3'];
        this.bean.jumpPose = poses[Math.floor(Math.random() * poses.length)];

        window.Sound?.playJump();
    }

    spawnCrate() {
        const topCrate = this.stack[this.stack.length - 1];
        const crateW = 340;
        const crateH = 140;

        const dir = this.nextDirection;
        this.nextDirection = -dir;

        // Speed ramp up formula based on score
        const baseSpeed = 850;
        const speed = baseSpeed + Math.min(this.score * 18, 650);

        const startX = dir === 1 ? -crateW - 50 : VIRTUAL_WIDTH + 50;
        const targetY = topCrate.y - crateH;

        // Special gold crate milestone
        const isGold = (this.score + 1) % 10 === 0;

        this.activeCrate = {
            width: crateW,
            height: crateH,
            x: startX,
            y: targetY,
            vx: dir * speed,
            direction: dir,
            landed: false,
            isGold: isGold,
            targetX: topCrate.x
        };
    }

    update(dt) {
        if (this.state === STATE.PAUSED) return;

        this.gameTime += dt;

        // Update Clouds
        this.clouds.forEach((cloud) => {
            cloud.x += cloud.speed * dt;
            if (cloud.x > VIRTUAL_WIDTH + 250) {
                cloud.x = -350;
                cloud.y = this.cameraY - 600 + Math.random() * 2000;
            }
        });

        // Update Screen Shake
        if (this.screenShake > 0) {
            this.screenShake -= dt * 18;
            if (this.screenShake < 0) this.screenShake = 0;
        }

        // Camera smooth follow top of stack
        if (this.stack.length > 0) {
            const topCrate = this.stack[this.stack.length - 1];
            // Center the stack around Y = 1150 in the viewport
            this.targetCameraY = topCrate.y - 1150;
            this.cameraY += (this.targetCameraY - this.cameraY) * Math.min(dt * 6.5, 1);
        }

        // Mr Bean Physics
        if (this.bean) {
            if (this.bean.isFalling) {
                // Game over falling animation
                this.bean.x += this.bean.fallVx * dt;
                this.bean.y += this.bean.fallVy * dt;
                this.bean.fallVy += this.bean.gravity * 0.8 * dt;
                this.bean.rotation += dt * 7;
            } else {
                // Normal Jump Physics
                if (this.bean.isJumping) {
                    this.bean.y += this.bean.vy * dt;
                    this.bean.vy += this.bean.gravity * dt;

                    // Spring scale back to normal
                    this.bean.scaleX += (1 - this.bean.scaleX) * dt * 8;
                    this.bean.scaleY += (1 - this.bean.scaleY) * dt * 8;

                    // Check landing on topmost crate
                    const topCrate = this.stack[this.stack.length - 1];
                    if (this.bean.vy > 0 && this.bean.y >= topCrate.y) {
                        this.bean.y = topCrate.y;
                        this.bean.vy = 0;
                        this.bean.isJumping = false;
                        this.bean.scaleX = 1.25;
                        this.bean.scaleY = 0.75;
                    }
                } else {
                    // Grounded squash restoration
                    this.bean.scaleX += (1 - this.bean.scaleX) * dt * 10;
                    this.bean.scaleY += (1 - this.bean.scaleY) * dt * 10;
                }
            }
        }

        // Spawn Crate
        if (this.state === STATE.PLAYING && !this.activeCrate && !this.bean.isFalling) {
            this.spawnTimer -= dt;
            if (this.spawnTimer <= 0) {
                this.spawnCrate();
            }
        }

        // Active Crate Logic
        if (this.activeCrate && !this.activeCrate.landed) {
            const crate = this.activeCrate;
            crate.x += crate.vx * dt;

            const targetX = crate.targetX;
            const reachedCenter =
                (crate.direction === 1 && crate.x >= targetX) ||
                (crate.direction === -1 && crate.x <= targetX);

            // Collision Check with Mr Bean
            if (!this.bean.isFalling) {
                const beanFeet = this.bean.y;
                const beanBox = {
                    left: this.bean.x - 45,
                    right: this.bean.x + 45,
                    top: beanFeet - this.bean.height + 60,
                    bottom: beanFeet - 15
                };

                const crateBox = {
                    left: crate.x + 15,
                    right: crate.x + crate.width - 15,
                    top: crate.y + 15,
                    bottom: crate.y + crate.height
                };

                const isOverlap =
                    beanBox.right > crateBox.left &&
                    beanBox.left < crateBox.right &&
                    beanBox.bottom > crateBox.top &&
                    beanBox.top < crateBox.bottom;

                if (isOverlap) {
                    // Collision! Mr Bean was hit by the sliding crate
                    this.triggerGameOver(crate.direction);
                    return;
                }
            }

            // Stacking Trigger when crate reaches target stack position
            if (reachedCenter) {
                // If Mr Bean is in air high enough, crate slides right under him and locks into stack!
                const beanFeet = this.bean.y;
                const isBeanAbove = beanFeet <= crate.y + 25;

                if (isBeanAbove) {
                    this.lockCrateIntoStack(crate);
                } else {
                    // Overshot / hit Mr Bean
                    if (!this.bean.isFalling) {
                        this.triggerGameOver(crate.direction);
                    }
                }
            }
        }

        // Update Particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.vy += (p.gravity || 0) * dt;
            p.rotation += (p.vRot || 0) * dt;
            p.scale += (p.vScale || 0) * dt;
            p.alpha -= p.fadeRate * dt;
            if (p.alpha <= 0) {
                this.particles.splice(i, 1);
            }
        }

        // Update Floating Score Popups
        for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
            const ft = this.floatingTexts[i];
            ft.y += ft.vy * dt;
            ft.scale += (ft.targetScale - ft.scale) * dt * 10;
            ft.alpha -= dt * 0.9;
            if (ft.alpha <= 0) {
                this.floatingTexts.splice(i, 1);
            }
        }
    }

    lockCrateIntoStack(crate) {
        crate.landed = true;

        // Alignment check
        const deltaX = Math.abs(crate.x - crate.targetX);
        const isPerfect = deltaX <= 26;

        let points = 1;
        if (isPerfect) {
            crate.x = crate.targetX; // Snap to perfect center
            this.combo++;
            this.totalPerfects++;
            if (this.combo > this.maxCombo) this.maxCombo = this.combo;
            points = 1 + Math.min(this.combo, 4);

            window.Sound?.playPerfect(this.combo);
            this.addSparkles(crate.x + crate.width / 2, crate.y + 20);
            this.addFloatingText(
                `+${points} PERFECT!`,
                crate.x + crate.width / 2,
                crate.y - 40,
                '#FFEB3B'
            );
        } else {
            this.combo = 0;
            window.Sound?.playLand();
            window.Sound?.playScore(0);
            this.addFloatingText(`+1`, crate.x + crate.width / 2, crate.y - 30, '#FFFFFF');
        }

        this.score += points;
        if (this.score > this.bestScore) {
            this.bestScore = this.score;
            this.saveStorage();
        }

        // Add Dust Puffs
        this.addDust(crate.x + 30, crate.y + crate.height);
        this.addDust(crate.x + crate.width - 30, crate.y + crate.height);

        // Screen Impact Shake
        this.screenShake = isPerfect ? 7 : 4;

        // Add to stack
        this.stack.push({
            x: crate.x,
            y: crate.y,
            width: crate.width,
            height: crate.height,
            isGold: crate.isGold
        });

        this.activeCrate = null;
        this.spawnTimer = 0.32; // Short rhythm pause before next crate

        // Check missions
        this.checkMissions();
        this.updateUI();
    }

    triggerGameOver(hitDirection) {
        if (this.state === STATE.GAMEOVER) return;

        this.state = STATE.GAMEOVER;
        this.screenShake = 16;
        window.Sound?.stopMusic();
        window.Sound?.playCrash();

        // Throw Mr. Bean comically off the stack
        this.bean.isFalling = true;
        this.bean.fallVx = hitDirection * 550;
        this.bean.fallVy = -650;

        if (this.score > this.bestScore) {
            this.bestScore = this.score;
            this.saveStorage();
        }

        setTimeout(() => {
            this.updateUI();
        }, 400);
    }

    checkMissions() {
        if (this.currentMissionIndex >= this.missions.length) return;

        const mission = this.missions[this.currentMissionIndex];
        let completed = false;

        if (mission.type === 'score' && this.score >= mission.target) {
            completed = true;
        } else if (mission.type === 'combo' && this.combo >= mission.target) {
            completed = true;
        }

        if (completed && !mission.completed) {
            mission.completed = true;
            this.currentMissionIndex++;
            this.saveStorage();
            this.addFloatingText('MISSION COMPLETE! 🏆', VIRTUAL_WIDTH / 2, this.cameraY + 500, '#00E676');
            window.Sound?.playPerfect(4);
        }
    }

    addDust(x, y) {
        for (let i = 0; i < 4; i++) {
            this.particles.push({
                type: 'dust',
                x: x + (Math.random() * 30 - 15),
                y: y + (Math.random() * 10 - 5),
                vx: (Math.random() * 160 - 80),
                vy: -30 - Math.random() * 70,
                scale: 0.5 + Math.random() * 0.6,
                vScale: 0.5,
                alpha: 0.8,
                fadeRate: 2.2,
                rotation: Math.random() * Math.PI * 2,
                vRot: (Math.random() - 0.5) * 3
            });
        }
    }

    addSparkles(x, y) {
        for (let i = 0; i < 9; i++) {
            const angle = (i / 9) * Math.PI * 2 + Math.random() * 0.4;
            const speed = 180 + Math.random() * 220;
            this.particles.push({
                type: 'sparkle',
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 60,
                gravity: 280,
                scale: 0.6 + Math.random() * 0.7,
                alpha: 1,
                fadeRate: 1.6,
                rotation: Math.random() * Math.PI * 2,
                vRot: (Math.random() - 0.5) * 6
            });
        }
    }

    addFloatingText(text, x, y, color = '#FFFFFF') {
        this.floatingTexts.push({
            text: text,
            x: x,
            y: y,
            vy: -110,
            scale: 0.3,
            targetScale: 1.0,
            alpha: 1.0,
            color: color
        });
    }

    draw() {
        this.ctx.save();

        // Screen Shake offset
        if (this.screenShake > 0) {
            const shakeX = (Math.random() * 2 - 1) * this.screenShake;
            const shakeY = (Math.random() * 2 - 1) * this.screenShake;
            this.ctx.translate(shakeX, shakeY);
        }

        // 1. Sky Gradient Background
        const grad = this.ctx.createLinearGradient(0, 0, 0, VIRTUAL_HEIGHT);
        grad.addColorStop(0, '#98D2EB');
        grad.addColorStop(0.7, '#B8E2F2');
        grad.addColorStop(1, '#D8F3FC');
        this.ctx.fillStyle = grad;
        this.ctx.fillRect(0, 0, VIRTUAL_WIDTH, VIRTUAL_HEIGHT);

        // World Coordinates Translation (Camera)
        this.ctx.save();
        this.ctx.translate(0, -this.cameraY);

        // 2. Clouds (Parallax Layer)
        this.clouds.forEach((cloud) => {
            const img = this.images[cloud.type];
            if (img) {
                this.ctx.save();
                this.ctx.globalAlpha = cloud.opacity;
                const cw = img.width * cloud.scale;
                const ch = img.height * cloud.scale;
                this.ctx.drawImage(img, cloud.x, cloud.y, cw, ch);
                this.ctx.restore();
            }
        });

        // 3. Ground Bushes
        const bushImg = this.images.bush;
        if (bushImg) {
            const bushY = 1450;
            this.ctx.drawImage(bushImg, -60, bushY, 600, 260);
            this.ctx.drawImage(bushImg, 420, bushY + 20, 620, 270);
            this.ctx.drawImage(bushImg, 200, bushY - 20, 520, 240);
        }

        // 4. Score Milestone Dashed Lines
        this.drawMilestoneLines();

        // 5. Stacked Crates
        this.stack.forEach((crate, idx) => {
            // Draw only visible crates
            if (crate.y - this.cameraY < VIRTUAL_HEIGHT + 200 && crate.y - this.cameraY > -300) {
                const img = crate.isGold ? this.images.crate_gold : this.images.crate;
                if (img) {
                    this.ctx.drawImage(img, crate.x, crate.y, crate.width, crate.height);
                }
            }
        });

        // 6. Active Sliding Crate
        if (this.activeCrate) {
            const crate = this.activeCrate;
            const img = crate.isGold ? this.images.crate_gold : this.images.crate;
            if (img) {
                this.ctx.drawImage(img, crate.x, crate.y, crate.width, crate.height);
            }
        }

        // 7. Particles (Dust & Sparkles)
        this.particles.forEach((p) => {
            const img = this.images[p.type];
            if (img) {
                this.ctx.save();
                this.ctx.globalAlpha = Math.max(p.alpha, 0);
                this.ctx.translate(p.x, p.y);
                this.ctx.rotate(p.rotation);
                const pw = img.width * p.scale;
                const ph = img.height * p.scale;
                this.ctx.drawImage(img, -pw / 2, -ph / 2, pw, ph);
                this.ctx.restore();
            }
        });

        // 8. Mr. Bean Character
        if (this.bean) {
            this.drawMrBean();
        }

        // 9. In-World Floating Texts (+1, PERFECT!, etc)
        this.floatingTexts.forEach((ft) => {
            this.ctx.save();
            this.ctx.globalAlpha = Math.max(ft.alpha, 0);
            this.ctx.translate(ft.x, ft.y);
            this.ctx.scale(ft.scale, ft.scale);
            this.ctx.font = '900 46px "Arial Black", Impact, sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';

            // Shadow & Stroke
            this.ctx.strokeStyle = '#263238';
            this.ctx.lineWidth = 10;
            this.ctx.strokeText(ft.text, 0, 0);

            this.ctx.fillStyle = ft.color;
            this.ctx.fillText(ft.text, 0, 0);
            this.ctx.restore();
        });

        this.ctx.restore(); // End world camera translation

        // 10. HUD Overlays (Fixed Screen Coordinates)
        this.drawHUD();

        this.ctx.restore();
    }

    drawMrBean() {
        const bean = this.bean;
        let spriteKey = 'bean_idle';

        if (bean.isFalling) {
            spriteKey = 'bean_fall';
        } else if (bean.isJumping) {
            spriteKey = bean.jumpPose || 'bean_jump1';
        }

        const img = this.images[spriteKey] || this.images.bean_idle;
        if (!img) return;

        this.ctx.save();
        this.ctx.translate(bean.x, bean.y);
        this.ctx.rotate(bean.rotation);
        this.ctx.scale(bean.scaleX, bean.scaleY);

        const drawW = bean.width;
        const drawH = (img.height / img.width) * drawW;

        // Draw with feet anchored at (0, 0)
        this.ctx.drawImage(img, -drawW / 2, -drawH, drawW, drawH);

        this.ctx.restore();
    }

    drawMilestoneLines() {
        const topCrateY = this.stack.length > 0 ? this.stack[this.stack.length - 1].y : 1200;
        const nextMilestone = (Math.floor(this.score / 10) + 1) * 10;
        const milestoneY = topCrateY - 140 * (nextMilestone - this.score);

        if (milestoneY - this.cameraY > -100 && milestoneY - this.cameraY < VIRTUAL_HEIGHT + 100) {
            this.ctx.save();
            this.ctx.setLineDash([28, 18]);
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
            this.ctx.lineWidth = 10;
            this.ctx.beginPath();
            this.ctx.moveTo(40, milestoneY);
            this.ctx.lineTo(VIRTUAL_WIDTH - 40, milestoneY);
            this.ctx.stroke();

            this.ctx.setLineDash([]);
            this.ctx.font = '800 28px "Arial Black", sans-serif';
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(`GOAL: ${nextMilestone}`, VIRTUAL_WIDTH / 2, milestoneY - 16);
            this.ctx.restore();
        }
    }

    drawHUD() {
        if (this.state === STATE.MENU) return;

        // Top Header Dark Rounded Pill Banner (Exactly matching demo.mp4)
        const bannerW = 440;
        const bannerH = 88;
        const bannerX = (VIRTUAL_WIDTH - bannerW) / 2;
        const bannerY = 55;

        this.ctx.save();
        this.ctx.fillStyle = 'rgba(38, 50, 56, 0.88)';
        this.ctx.beginPath();
        this.ctx.roundRect(bannerX, bannerY, bannerW, bannerH, 44);
        this.ctx.fill();

        // Big Main Score
        this.ctx.font = '900 58px "Arial Black", Impact, sans-serif';
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(`${this.score}`, VIRTUAL_WIDTH / 2 - 45, bannerY + bannerH / 2);

        // Best Score Badge on Right
        this.ctx.font = '800 20px sans-serif';
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        this.ctx.fillText('BEST', bannerX + bannerW - 75, bannerY + 28);

        this.ctx.font = '900 32px "Arial Black", sans-serif';
        this.ctx.fillStyle = '#FFD54F';
        this.ctx.fillText(`${this.bestScore}`, bannerX + bannerW - 75, bannerY + 58);

        // Combo Counter if active
        if (this.combo >= 2) {
            this.ctx.font = '900 32px "Arial Black", sans-serif';
            this.ctx.fillStyle = '#FFEB3B';
            this.ctx.strokeStyle = '#263238';
            this.ctx.lineWidth = 6;
            this.ctx.strokeText(`COMBO x${this.combo}!`, VIRTUAL_WIDTH / 2, bannerY + bannerH + 42);
            this.ctx.fillText(`COMBO x${this.combo}!`, VIRTUAL_WIDTH / 2, bannerY + bannerH + 42);
        }

        // Mission Banner (Top Left)
        if (this.currentMissionIndex < this.missions.length) {
            const mission = this.missions[this.currentMissionIndex];
            const mW = 320;
            const mH = 80;
            const mX = 40;
            const mY = 55;

            this.ctx.fillStyle = 'rgba(38, 50, 56, 0.75)';
            this.ctx.beginPath();
            this.ctx.roundRect(mX, mY, mW, mH, 18);
            this.ctx.fill();

            this.ctx.font = '700 18px sans-serif';
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
            this.ctx.textAlign = 'left';
            this.ctx.fillText('NEXT OBJECTIVE', mX + 20, mY + 28);

            this.ctx.font = '800 20px sans-serif';
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.fillText(mission.title, mX + 20, mY + 56);
        }

        this.ctx.restore();
    }

    updateUI() {
        const menuOverlay = document.getElementById('menu-overlay');
        const gameoverOverlay = document.getElementById('gameover-overlay');
        const pauseOverlay = document.getElementById('pause-overlay');
        const finalScoreVal = document.getElementById('final-score-val');
        const bestScoreVal = document.getElementById('best-score-val');

        if (menuOverlay) menuOverlay.style.display = this.state === STATE.MENU ? 'flex' : 'none';
        if (pauseOverlay) pauseOverlay.style.display = this.state === STATE.PAUSED ? 'flex' : 'none';

        if (gameoverOverlay) {
            if (this.state === STATE.GAMEOVER) {
                gameoverOverlay.style.display = 'flex';
                if (finalScoreVal) finalScoreVal.textContent = this.score;
                if (bestScoreVal) bestScoreVal.textContent = this.bestScore;
            } else {
                gameoverOverlay.style.display = 'none';
            }
        }
    }

    loop(currentTime) {
        const dt = Math.min((currentTime - this.lastTime) / 1000, 0.1);
        this.lastTime = currentTime;

        this.update(dt);
        this.draw();

        requestAnimationFrame((t) => this.loop(t));
    }
}

// Global Game Instance
window.addEventListener('DOMContentLoaded', () => {
    window.Game = new MrBeanJumpGame('gameCanvas');
});

