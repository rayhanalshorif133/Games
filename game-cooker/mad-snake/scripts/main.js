// Master Game Coordinator for Mad Snake

class Game {
    constructor() {
        this.canvas = document.getElementById('c3canvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Virtual Layout Size: 1080 x 1920
        this.width = 1080;
        this.height = 1920;

        // Board geometry: 20x20 cells, 960x960 px at (60, 260)
        this.boardX = 60;
        this.boardY = 260;
        this.boardSize = 960;
        this.gridCount = 20;
        this.cellSize = this.boardSize / this.gridCount; // 48px

        // Systems
        this.audio = new AudioManager();
        this.particles = new ParticleSystem();
        this.levelManager = new LevelManager();
        this.ui = new UI(this);
        this.worldMap = null;

        // State: 'PLAYING'
        this.state = 'PLAYING';
        this.isPaused = false;
        
        // Game variables
        this.currentLevel = null;
        this.snake = null;
        this.enemySnake = null;
        this.fireballs = [];
        this.foods = [];
        this.firePickups = [];

        this.score = 0;
        this.highScore = 0;
        this.endlessHighScore = 0;
        this.isEndless = true;
        this.endlessWave = 1;
        this.endlessTier = 1;
        this.lives = 3;
        this.fireAmmo = 1;
        this.primaryCollected = 0;
        this.secondaryCollected = 0;

        // Timers
        this.snakeTickTimer = 0;
        this.enemyTickTimer = 0;
        this.invulnerabilityTimer = 0;

        // Loaded images cache
        this.images = {};
        this.assetsLoaded = false;

        // Touch swipe tracking
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.touchStartTime = 0;

        this.loadHighScore();
        this.initInput();
    }

    loadHighScore() {
        try {
            const saved = localStorage.getItem('mad_snake_highscore');
            if (saved) this.highScore = parseInt(saved, 10);
            const savedEndless = localStorage.getItem('mad_snake_endless_highscore');
            if (savedEndless) this.endlessHighScore = parseInt(savedEndless, 10);
        } catch (e) {}
    }

    saveHighScore() {
        if (this.isEndless) {
            if (this.score > this.endlessHighScore) {
                this.endlessHighScore = this.score;
                try {
                    localStorage.setItem('mad_snake_endless_highscore', this.endlessHighScore);
                } catch (e) {}
            }
        } else {
            if (this.score > this.highScore) {
                this.highScore = this.score;
                try {
                    localStorage.setItem('mad_snake_highscore', this.highScore);
                } catch (e) {}
            }
        }
    }

    setImages(images) {
        this.images = images;
        this.assetsLoaded = true;
    }

    openWorldMap() {
        this.startEndlessMode();
    }

    startEndlessMode() {
        this.isEndless = true;
        this.endlessWave = 1;
        this.endlessTier = 1;
        this.currentLevel = this.levelManager.getEndlessConfig(1);
        this.state = 'PLAYING';
        this.isPaused = false;
        this.ui.activeModal = null;

        this.lives = 3;
        this.score = 0;
        this.primaryCollected = 0;
        this.secondaryCollected = 0;
        this.fireAmmo = 2;
        this.invulnerabilityTimer = 0;
        this.fireballs = [];

        // Snake starts small with length 3 (1st e choto thakbe!)
        this.snake = new Snake(10, 10, 3);
        this.snake.setDirection({ x: 1, y: 0 });

        // No enemy initially!
        this.enemySnake = null;

        this.foods = [];
        this.firePickups = [];
        this.spawnFood('primary');
        this.spawnFood('secondary');

        this.snakeTickTimer = 0;
        this.enemyTickTimer = 0;

        this.particles.addFloatingText('ENDLESS RUN START!', 540, 700, '#4ade80', 50);
    }

    startLevel(levelId) {
        this.isEndless = false;
        this.currentLevel = this.levelManager.getLevel(levelId);
        this.levelManager.currentLevelId = levelId;
        this.state = 'PLAYING';
        this.isPaused = false;
        this.ui.activeModal = null;

        this.lives = 3;
        this.primaryCollected = 0;
        this.secondaryCollected = 0;
        this.fireAmmo = levelId >= 12 ? 5 : 1; // Like in video: L12 has 5 ammo, L4 has 1 ammo
        this.invulnerabilityTimer = 0;
        this.fireballs = [];

        // Spawn player snake
        this.snake = new Snake(6, 14, 8);
        this.snake.setDirection({ x: 1, y: 0 });

        // Spawn enemy snake
        if (this.currentLevel.hasEnemy) {
            this.enemySnake = new EnemySnake(16, 17, 3);
        } else {
            this.enemySnake = null;
        }

        // Spawn initial food & pickups
        this.foods = [];
        this.firePickups = [];
        this.spawnFood('primary');
        this.spawnFood('secondary');
        
        // Spawn fire powerup on board (like in video frame 0)
        if (Math.random() > 0.3) {
            this.spawnFirePickup();
        }

        this.snakeTickTimer = 0;
        this.enemyTickTimer = 0;
    }

    spawnFood(type) {
        const obstacles = this.currentLevel.obstacles;
        for (let attempt = 0; attempt < 100; attempt++) {
            const rx = Math.floor(Math.random() * this.gridCount);
            const ry = Math.floor(Math.random() * this.gridCount);

            // Avoid obstacles
            if (obstacles.some(o => o.x === rx && o.y === ry)) continue;
            // Avoid player snake
            if (this.snake.segments.some(s => s.x === rx && s.y === ry)) continue;
            // Avoid enemy snake
            if (this.enemySnake && !this.enemySnake.isDead && this.enemySnake.segments.some(s => s.x === rx && s.y === ry)) continue;
            // Avoid existing foods
            if (this.foods.some(f => f.x === rx && f.y === ry)) continue;
            if (this.firePickups.some(f => f.x === rx && f.y === ry)) continue;

            this.foods.push({
                x: rx,
                y: ry,
                type: type === 'primary' ? this.currentLevel.primaryTarget.type : 'apple_green'
            });
            break;
        }
    }

    spawnFirePickup() {
        const obstacles = this.currentLevel.obstacles;
        for (let attempt = 0; attempt < 80; attempt++) {
            const rx = Math.floor(Math.random() * this.gridCount);
            const ry = Math.floor(Math.random() * this.gridCount);

            if (obstacles.some(o => o.x === rx && o.y === ry)) continue;
            if (this.snake.segments.some(s => s.x === rx && s.y === ry)) continue;
            if (this.foods.some(f => f.x === rx && f.y === ry)) continue;

            this.firePickups.push({ x: rx, y: ry });
            break;
        }
    }

    shootFireball() {
        if (this.fireAmmo <= 0 || !this.snake) return;
        this.fireAmmo--;
        this.audio.playFire();

        const head = this.snake.segments[0];
        const dir = this.snake.dir;

        // Spawn fireball at head position
        const fb = new Fireball(head.x + dir.x * 0.5, head.y + dir.y * 0.5, dir.x, dir.y);
        this.fireballs.push(fb);

        // Flash particle burst at head
        const px = this.cellToScreenX(head.x + dir.x * 0.5);
        const py = this.cellToScreenY(head.y + dir.y * 0.5);
        this.particles.addSparkles(px, py, '#f97316', 10);
    }

    handleDamage() {
        if (this.invulnerabilityTimer > 0) return;
        this.lives--;
        this.audio.playHit();
        this.invulnerabilityTimer = 1.5; // 1.5s invulnerability flicker

        const head = this.snake.segments[0];
        this.particles.addSparkles(this.cellToScreenX(head.x), this.cellToScreenY(head.y), '#ef4444', 20);

        if (this.lives <= 0) {
            this.saveHighScore();
            this.ui.showGameOverModal();
        }
    }

    checkWinCondition() {
        const lvl = this.currentLevel;
        if (this.primaryCollected >= lvl.primaryTarget.count && this.secondaryCollected >= lvl.secondaryTarget.count) {
            this.saveHighScore();
            this.levelManager.saveProgress(this.levelManager.getNextLevelId(lvl.id));
            this.particles.addConfetti(this.width, this.height);
            this.ui.showWinModal();
        }
    }

    update(dt) {
        this.particles.update(dt);
        this.ui.update(dt);

        if (this.isPaused || this.ui.activeModal) {
            return;
        }

        if (this.invulnerabilityTimer > 0) {
            this.invulnerabilityTimer -= dt;
        }

        // Endless Mode Wave & Difficulty Check
        if (this.isEndless) {
            const nextTier = this.levelManager.getEndlessTier(this.score);
            if (nextTier > this.endlessTier) {
                this.endlessTier = nextTier;
                this.endlessWave = nextTier;
                this.currentLevel = this.levelManager.getEndlessConfig(nextTier);
                this.audio.playBonus();

                // If this tier introduces the enemy and enemy is null, spawn enemy snake!
                if (this.currentLevel.hasEnemy && !this.enemySnake) {
                    this.enemySnake = new EnemySnake(18, 18, 3);
                }

                // Add sprout sparkles for obstacles
                for (const obs of this.currentLevel.obstacles) {
                    const ox = this.cellToScreenX(obs.x) + this.cellSize / 2;
                    const oy = this.cellToScreenY(obs.y) + this.cellSize / 2;
                    this.particles.addSparkles(ox, oy, '#facc15', 18);
                }

                this.particles.addFloatingText(`WAVE ${nextTier}: ${this.currentLevel.name.toUpperCase()}!`, 540, 700, '#facc15', 46);
            }
        }

        // 1. Update Enemy Snake Timer
        if (this.enemySnake) {
            this.enemySnake.updateTimer(dt, this.gridCount, this.gridCount, this.currentLevel.obstacles, this.snake);
        }

        // 2. Update Fireballs
        for (let i = this.fireballs.length - 1; i >= 0; i--) {
            const fb = this.fireballs[i];
            fb.update(dt);

            // Add flame trail particles
            const fpx = this.cellToScreenX(fb.x);
            const fpy = this.cellToScreenY(fb.y);
            this.particles.addFireTrail(fpx, fpy);

            // Check out of board
            if (fb.x < -0.5 || fb.x >= this.gridCount + 0.5 || fb.y < -0.5 || fb.y >= this.gridCount + 0.5) {
                this.fireballs.splice(i, 1);
                continue;
            }

            // Check collision with obstacles
            const fbGridX = Math.round(fb.x);
            const fbGridY = Math.round(fb.y);
            const hitObstacle = this.currentLevel.obstacles.some(o => o.x === fbGridX && o.y === fbGridY);
            if (hitObstacle) {
                this.particles.addSparkles(fpx, fpy, '#f97316', 15);
                this.fireballs.splice(i, 1);
                continue;
            }

            // Check collision with enemy snake
            if (this.enemySnake && !this.enemySnake.isDead) {
                const hitEnemy = this.enemySnake.segments.some(s => Math.hypot(s.x - fb.x, s.y - fb.y) < 0.85);
                if (hitEnemy) {
                    // BOOM! Enemy snake eliminated
                    this.enemySnake.kill();
                    this.fireballs.splice(i, 1);
                    this.audio.playExplode();
                    this.particles.addExplosion(fpx, fpy);

                    // +25 Points (exact like in video frame 230!)
                    this.score += 25;
                    this.saveHighScore();
                    this.particles.addFloatingText('+25', fpx, fpy - 30, '#ec4899', 46);
                    continue;
                }
            }
        }

        // 3. Player Snake Ticks
        const speed = this.currentLevel.snakeSpeed;
        this.snakeTickTimer += dt;
        if (this.snakeTickTimer >= speed) {
            this.snakeTickTimer -= speed;
            const newHead = this.snake.step(this.gridCount, this.gridCount);

            // Boundary wrap portal effect (when snake passes through edge)
            const prevHead = this.snake.prevSegments[0];
            if (prevHead && (Math.abs(newHead.x - prevHead.x) > 1 || Math.abs(newHead.y - prevHead.y) > 1)) {
                const px = this.cellToScreenX(newHead.x) + this.cellSize / 2;
                const py = this.cellToScreenY(newHead.y) + this.cellSize / 2;
                this.particles.addSparkles(px, py, '#4ade80', 16);
            }

            // Self collision
            if (this.snake.checkSelfCollision()) {
                this.handleDamage();
            }

            // Obstacle collision
            if (this.currentLevel.obstacles.some(o => o.x === newHead.x && o.y === newHead.y)) {
                this.handleDamage();
            }

            // Enemy snake collision
            if (this.enemySnake && !this.enemySnake.isDead) {
                if (this.enemySnake.segments.some(s => s.x === newHead.x && s.y === newHead.y)) {
                    this.handleDamage();
                }
            }

            // Check food collision
            for (let i = this.foods.length - 1; i >= 0; i--) {
                const f = this.foods[i];
                if (f.x === newHead.x && f.y === newHead.y) {
                    const hpx = this.cellToScreenX(newHead.x) + this.cellSize / 2;
                    const hpy = this.cellToScreenY(newHead.y) + this.cellSize / 2;

                    if (f.type === 'apple_green') {
                        // Secondary bonus target
                        this.secondaryCollected++;
                        this.score += 30;
                        this.snake.grow(1);
                        this.audio.playBonus();
                        this.particles.addSparkles(hpx, hpy, '#86efac', 20);
                        this.particles.addFloatingText('+30', hpx, hpy - 20, '#86efac', 42);
                        this.foods.splice(i, 1);
                        if (this.isEndless || this.secondaryCollected < this.currentLevel.secondaryTarget.count) {
                            this.spawnFood('secondary');
                        }
                    } else {
                        // Primary target
                        this.primaryCollected++;
                        const pts = f.type === 'sushi' ? 20 : (f.type === 'taco' ? 15 : 10);
                        this.score += pts;
                        this.snake.grow(1);
                        this.audio.playEat();
                        this.particles.addSparkles(hpx, hpy, '#38bdf8', 16);
                        this.particles.addFloatingText('+' + pts, hpx, hpy - 20, '#ffffff', 40);
                        this.foods.splice(i, 1);
                        if (this.isEndless || this.primaryCollected < this.currentLevel.primaryTarget.count) {
                            this.spawnFood('primary');
                        }
                    }
                    if (!this.isEndless) {
                        this.checkWinCondition();
                    } else {
                        // In endless mode, occasionally spawn fire pickup if none on board
                        if (this.firePickups.length === 0 && Math.random() < 0.25) {
                            this.spawnFirePickup();
                        }
                    }
                    this.saveHighScore();
                    break;
                }
            }

            // Check fire pickup collision
            for (let i = this.firePickups.length - 1; i >= 0; i--) {
                const fp = this.firePickups[i];
                if (fp.x === newHead.x && fp.y === newHead.y) {
                    this.fireAmmo++;
                    this.audio.playBonus();
                    const hpx = this.cellToScreenX(newHead.x) + this.cellSize / 2;
                    const hpy = this.cellToScreenY(newHead.y) + this.cellSize / 2;
                    this.particles.addSparkles(hpx, hpy, '#f97316', 22);
                    this.particles.addFloatingText('+1 FIRE', hpx, hpy - 20, '#f97316', 38);
                    this.firePickups.splice(i, 1);
                    break;
                }
            }
        }

        // 4. Enemy Snake Ticks
        if (this.enemySnake && !this.enemySnake.isDead) {
            const enemySpeed = this.currentLevel.enemySpeed;
            this.enemyTickTimer += dt;
            if (this.enemyTickTimer >= enemySpeed) {
                this.enemyTickTimer -= enemySpeed;
                this.enemySnake.step(this.gridCount, this.gridCount, this.currentLevel.obstacles, this.foods, this.snake);

                // Check if enemy snake bumped into player
                const eHead = this.enemySnake.segments[0];
                if (eHead && this.snake.segments.some(s => s.x === eHead.x && s.y === eHead.y)) {
                    this.handleDamage();
                }
            }
        }
    }

    cellToScreenX(gridX) {
        return this.boardX + gridX * this.cellSize;
    }

    cellToScreenY(gridY) {
        return this.boardY + gridY * this.cellSize;
    }

    draw() {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.width, this.height);

        // In Gameplay
        ctx.fillStyle = '#0f1115';
        ctx.fillRect(0, 0, this.width, this.height);

        // 1. Draw Themed Board & Grid
        this.drawGameBoard(ctx);

        // 2. Draw Obstacles
        this.drawObstacles(ctx);

        // 3. Draw Foods & Pickups
        this.drawPickups(ctx);

        // 4. Draw Player & Enemy Snakes with Smooth Interpolation
        const progress = Math.min(1, this.snakeTickTimer / this.currentLevel.snakeSpeed);
        const enemyProgress = this.enemySnake ? Math.min(1, this.enemyTickTimer / this.currentLevel.enemySpeed) : 0;

        // Invulnerability flicker
        if (this.invulnerabilityTimer <= 0 || Math.floor(Date.now() / 100) % 2 === 0) {
            ctx.save();
            ctx.beginPath();
            ctx.rect(this.boardX, this.boardY, this.boardSize, this.boardSize);
            ctx.clip();
            this.snake.draw(ctx, (gx) => this.cellToScreenX(gx), (gy) => this.cellToScreenY(gy), this.cellSize, progress, this.images, this.gridCount, this.gridCount);
            ctx.restore();
        }

        if (this.enemySnake) {
            this.enemySnake.draw(ctx, (gx) => this.cellToScreenX(gx), (gy) => this.cellToScreenY(gy), this.cellSize, enemyProgress, this.images);
        }

        // 5. Draw Fireballs
        for (const fb of this.fireballs) {
            fb.draw(ctx, (gx) => this.cellToScreenX(gx), (gy) => this.cellToScreenY(gy), this.cellSize, this.images);
        }

        // 6. Draw Particles & Popups
        this.particles.draw(ctx);

        // 7. Draw HUD & UI
        this.ui.draw(ctx, this.images);
    }

    drawGameBoard(ctx) {
        const lvl = this.currentLevel;
        const bg = lvl.boardBg;

        ctx.save();
        ctx.translate(this.boardX, this.boardY);

        // Checkerboard Tiles
        for (let r = 0; r < this.gridCount; r++) {
            for (let c = 0; c < this.gridCount; c++) {
                ctx.fillStyle = (r + c) % 2 === 0 ? bg.c1 : bg.c2;
                ctx.fillRect(c * this.cellSize, r * this.cellSize, this.cellSize, this.cellSize);
            }
        }

        // Grid Lines
        ctx.strokeStyle = bg.line;
        ctx.lineWidth = 1;
        for (let i = 0; i <= this.gridCount; i++) {
            // Horizontal
            ctx.beginPath();
            ctx.moveTo(0, i * this.cellSize);
            ctx.lineTo(this.boardSize, i * this.cellSize);
            ctx.stroke();
            // Vertical
            ctx.beginPath();
            ctx.moveTo(i * this.cellSize, 0);
            ctx.lineTo(i * this.cellSize, this.boardSize);
            ctx.stroke();
        }

        // Themed Border
        ctx.lineWidth = 4;
        ctx.strokeStyle = bg.border;
        ctx.strokeRect(0, 0, this.boardSize, this.boardSize);

        // Glowing nodes / Cherry blossom flowers on borders
        if (bg.borderStyle === 'sakura') {
            // Flowers on border corners and edges (like in video frame 360)
            const numFlowers = 12;
            for (let f = 0; f < numFlowers; f++) {
                const fx = (f / numFlowers) * this.boardSize;
                if (this.images.obstacle_sakura) {
                    ctx.drawImage(this.images.obstacle_sakura, fx - 16, -16, 32, 32);
                    ctx.drawImage(this.images.obstacle_sakura, fx - 16, this.boardSize - 16, 32, 32);
                    ctx.drawImage(this.images.obstacle_sakura, -16, fx - 16, 32, 32);
                    ctx.drawImage(this.images.obstacle_sakura, this.boardSize - 16, fx - 16, 32, 32);
                }
            }
        } else {
            // Green neon nodes on border (like in video frame 0)
            ctx.fillStyle = bg.node;
            const step = this.boardSize / 6;
            for (let i = 0; i <= 6; i++) {
                const pos = i * step;
                // Top
                ctx.beginPath(); ctx.arc(pos, 0, 6, 0, Math.PI * 2); ctx.fill();
                // Bottom
                ctx.beginPath(); ctx.arc(pos, this.boardSize, 6, 0, Math.PI * 2); ctx.fill();
                // Left
                ctx.beginPath(); ctx.arc(0, pos, 6, 0, Math.PI * 2); ctx.fill();
                // Right
                ctx.beginPath(); ctx.arc(this.boardSize, pos, 6, 0, Math.PI * 2); ctx.fill();
            }
        }

        ctx.restore();
    }

    drawObstacles(ctx) {
        for (const obs of this.currentLevel.obstacles) {
            const ox = this.cellToScreenX(obs.x);
            const oy = this.cellToScreenY(obs.y);
            const imgKey = obs.type === 'cactus' ? 'obstacle_cactus' : (obs.type === 'sakura' ? 'obstacle_sakura' : 'obstacle_plant');
            const img = this.images[imgKey];

            if (img) {
                ctx.drawImage(img, ox - 4, oy - 4, this.cellSize + 8, this.cellSize + 8);
            } else {
                ctx.fillStyle = '#16a34a';
                ctx.fillRect(ox + 4, oy + 4, this.cellSize - 8, this.cellSize - 8);
            }
        }
    }

    drawPickups(ctx) {
        // Foods
        for (const f of this.foods) {
            const fx = this.cellToScreenX(f.x);
            const fy = this.cellToScreenY(f.y);
            const img = this.images[f.type];
            if (img) {
                ctx.drawImage(img, fx, fy, this.cellSize, this.cellSize);
            } else {
                ctx.fillStyle = f.type === 'apple_green' ? '#84cc16' : '#ef4444';
                ctx.beginPath();
                ctx.arc(fx + this.cellSize / 2, fy + this.cellSize / 2, this.cellSize * 0.4, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // Fire powerup pickups on board
        for (const fp of this.firePickups) {
            const px = this.cellToScreenX(fp.x);
            const py = this.cellToScreenY(fp.y);
            if (this.images.fire_icon) {
                ctx.drawImage(this.images.fire_icon, px, py, this.cellSize, this.cellSize);
            } else {
                ctx.fillStyle = '#f97316';
                ctx.beginPath();
                ctx.arc(px + this.cellSize / 2, py + this.cellSize / 2, this.cellSize * 0.4, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }

    initInput() {
        // Translate client screen touch/mouse coords to virtual 1080x1920 coordinates
        const toVirtualCoords = (clientX, clientY) => {
            const rect = this.canvas.getBoundingClientRect();
            const scaleX = this.width / rect.width;
            const scaleY = this.height / rect.height;
            return {
                x: (clientX - rect.left) * scaleX,
                y: (clientY - rect.top) * scaleY
            };
        };

        // Pointer/Touch Events
        const handleStart = (clientX, clientY) => {
            this.audio.init();
            const { x, y } = toVirtualCoords(clientX, clientY);
            this.touchStartX = x;
            this.touchStartY = y;
            this.touchStartTime = Date.now();

            this.ui.handlePointerDown(x, y);
        };

        const handleMove = (clientX, clientY) => {
            const { x, y } = toVirtualCoords(clientX, clientY);
            this.ui.handlePointerMove(x, y);
        };

        const handleEnd = (clientX, clientY) => {
            const { x, y } = toVirtualCoords(clientX, clientY);
            const dx = x - this.touchStartX;
            const dy = y - this.touchStartY;

            this.ui.handlePointerUp(x, y);

            if (this.state === 'PLAYING') {
                // If touch began in the game board area (y < 1360), allow board swipe
                if (this.touchStartY < 1360) {
                    const dist = Math.hypot(dx, dy);
                    if (dist > 30 && this.snake && !this.isPaused) {
                        if (Math.abs(dx) > Math.abs(dy)) {
                            this.snake.setDirection({ x: dx > 0 ? 1 : -1, y: 0 });
                        } else {
                            this.snake.setDirection({ x: 0, y: dy > 0 ? 1 : -1 });
                        }
                    }
                }
            }
        };

        // Mouse listeners
        let isMouseDown = false;
        this.canvas.addEventListener('mousedown', (e) => {
            isMouseDown = true;
            handleStart(e.clientX, e.clientY);
        });
        window.addEventListener('mousemove', (e) => {
            if (isMouseDown) handleMove(e.clientX, e.clientY);
        });
        window.addEventListener('mouseup', (e) => {
            if (isMouseDown) {
                isMouseDown = false;
                handleEnd(e.clientX, e.clientY);
            }
        });

        // Touch listeners (mobile)
        this.canvas.addEventListener('touchstart', (e) => {
            if (e.touches.length > 0) {
                const t = e.touches[0];
                handleStart(t.clientX, t.clientY);
            }
            e.preventDefault();
        }, { passive: false });

        window.addEventListener('touchmove', (e) => {
            if (e.touches.length > 0) {
                const t = e.touches[0];
                handleMove(t.clientX, t.clientY);
            }
            e.preventDefault();
        }, { passive: false });

        window.addEventListener('touchend', (e) => {
            if (e.changedTouches.length > 0) {
                const t = e.changedTouches[0];
                handleEnd(t.clientX, t.clientY);
            }
            e.preventDefault();
        }, { passive: false });

        // Keyboard listeners
        window.addEventListener('keydown', (e) => {
            this.audio.init();
            if (!this.snake || this.state !== 'PLAYING' || this.isPaused) return;

            switch (e.key) {
                case 'ArrowUp':
                case 'w':
                case 'W':
                    this.snake.setDirection({ x: 0, y: -1 });
                    break;
                case 'ArrowDown':
                case 's':
                case 'S':
                    this.snake.setDirection({ x: 0, y: 1 });
                    break;
                case 'ArrowLeft':
                case 'a':
                case 'A':
                    this.snake.setDirection({ x: -1, y: 0 });
                    break;
                case 'ArrowRight':
                case 'd':
                case 'D':
                    this.snake.setDirection({ x: 1, y: 0 });
                    break;
                case ' ':
                case 'f':
                case 'F':
                    this.shootFireball();
                    break;
                case 'p':
                case 'P':
                    this.ui.showPause();
                    break;
                case 'r':
                case 'R':
                    this.startEndlessMode();
                    break;
            }
        });
    }
}

window.Game = Game;
