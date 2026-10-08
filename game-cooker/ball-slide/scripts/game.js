/**
 * Ball Slide - Main Game Engine
 * Layout: 1080 x 1920 (Construct 3 Layout Format)
 * Responsive State Machine, Asset Loader, and Physics
 */

class BallSlideGame {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
        // Exact Layout Size (as requested: w: 1080, h: 1920)
        this.width = 1080;
        this.height = 1920;
        this.canvas.width = this.width;
        this.canvas.height = this.height;

        // Subsystems
        this.audio = new AudioManager();
        this.particles = new ParticleSystem();
        this.obstacleManager = new ObstacleManager(this);

        // Assets
        this.assets = {};
        this.loadedAssetCount = 0;
        this.totalAssetCount = 10;

        // Game State: 'LOADING', 'MENU', 'PLAYING', 'GAMEOVER'
        this.state = 'LOADING';

        // Stats & Progress
        this.score = 0;
        this.highScore = parseInt(localStorage.getItem('ballslide_highscore') || '0', 10);
        this.gems = parseInt(localStorage.getItem('ballslide_gems') || '0', 10);
        this.skin = localStorage.getItem('ballslide_skin') || 'square'; // 'square', 'ball', 'star'

        // Player Configuration (matches demo.mp4 cyan square)
        this.player = {
            x: 540,
            y: 1045, // ~54.4% of 1920, exactly matching demo.mp4 Y=697 in 1280h
            targetX: 540,
            vx: 0,
            radius: 54, // size ~112px
            tilt: 0,
            color: '#52ddf9',
            hasShield: false,
            invulnerableTime: 0
        };

        // World Parameters
        this.wallWidth = 33;
        this.baseScrollSpeed = 580;
        this.scrollSpeed = 580;
        this.gameTime = 0;

        // Slow-mo Powerup
        this.slowMoTimer = 0;
        this.maxSlowMoDuration = 6.0;

        // Controls
        this.input = {
            pointerDown: false,
            pointerX: 540,
            keyLeft: false,
            keyRight: false,
            btnLeft: false,
            btnRight: false,
            isDragging: false
        };

        // Screen Shake
        this.shakeTime = 0;
        this.shakeIntensity = 0;

        // UI references
        this.dom = {
            loadingScreen: document.getElementById('loading-screen'),
            loadingBar: document.getElementById('loading-bar-fill'),
            loadingText: document.getElementById('loading-text'),
            startScreen: document.getElementById('start-screen'),
            gameOverScreen: document.getElementById('gameover-screen'),
            hudOverlay: document.getElementById('hud-overlay'),
            bottomScore: document.getElementById('hud-bottom-score'),
            powerupIndicator: document.getElementById('powerup-indicator'),
            powerupBar: document.getElementById('powerup-progress'),
            gemDisplay: document.getElementById('gem-count-val'),
            menuHighScore: document.getElementById('menu-highscore-val'),
            menuGems: document.getElementById('menu-gems-val'),
            goScore: document.getElementById('gameover-score'),
            goBest: document.getElementById('gameover-best'),
            goGems: document.getElementById('gameover-gems-earned'),
            newBestBadge: document.getElementById('new-best-badge'),
            audioBtn: document.getElementById('btn-audio-toggle')
        };

        this.init();
    }

    init() {
        this.updateStatsUI();
        this.loadAssets();
    }

    loadAssets() {
        const assetList = [
            { name: 'player_square', src: 'images/player_square.png' },
            { name: 'player_ball', src: 'images/player_ball.png' },
            { name: 'player_star', src: 'images/player_star.png' },
            { name: 'spike_left', src: 'images/spike_left.png' },
            { name: 'spike_right', src: 'images/spike_right.png' },
            { name: 'block', src: 'images/block.png' },
            { name: 'diamond', src: 'images/diamond.png' },
            { name: 'snowflake', src: 'images/snowflake.png' },
            { name: 'gem', src: 'images/gem.png' },
            { name: 'shield', src: 'images/shield.png' }
        ];

        let loaded = 0;
        assetList.forEach(item => {
            const img = new Image();
            img.onload = () => {
                this.assets[item.name] = img;
                loaded++;
                this.onAssetLoaded(loaded, assetList.length);
            };
            img.onerror = () => {
                console.warn(`Could not load image: ${item.src}, using procedural fallback`);
                loaded++;
                this.onAssetLoaded(loaded, assetList.length);
            };
            img.src = item.src;
        });
    }

    onAssetLoaded(loaded, total) {
        const percent = Math.floor((loaded / total) * 100);
        if (this.dom.loadingBar) {
            this.dom.loadingBar.style.width = `${percent}%`;
        }
        if (this.dom.loadingText) {
            this.dom.loadingText.innerText = `LOADING... ${percent}%`;
        }

        if (loaded >= total) {
            setTimeout(() => {
                this.setState('MENU');
            }, 300);
        }
    }

    setState(newState) {
        this.state = newState;

        // UI screen toggles
        if (this.dom.loadingScreen) this.dom.loadingScreen.classList.add('ui-hidden');
        if (this.dom.startScreen) this.dom.startScreen.classList.add('ui-hidden');
        if (this.dom.gameOverScreen) this.dom.gameOverScreen.classList.add('ui-hidden');
        if (this.dom.hudOverlay) this.dom.hudOverlay.classList.add('ui-hidden');

        switch (newState) {
            case 'MENU':
                if (this.dom.startScreen) this.dom.startScreen.classList.remove('ui-hidden');
                this.updateStatsUI();
                this.player.x = 540;
                this.player.targetX = 540;
                this.obstacleManager.reset();
                break;

            case 'PLAYING':
                if (this.dom.hudOverlay) this.dom.hudOverlay.classList.remove('ui-hidden');
                this.score = 0;
                this.gemsThisRun = 0;
                this.gameTime = 0;
                this.slowMoTimer = 0;
                this.scrollSpeed = this.baseScrollSpeed;
                this.player.x = 540;
                this.player.targetX = 540;
                this.player.vx = 0;
                this.player.hasShield = false;
                this.player.invulnerableTime = 0;
                this.obstacleManager.reset();
                this.particles.clear();
                this.updateScoreUI();
                break;

            case 'GAMEOVER':
                if (this.dom.gameOverScreen) this.dom.gameOverScreen.classList.remove('ui-hidden');
                this.audio.playHit();
                this.triggerScreenShake(0.4, 25);
                this.particles.spawnDeathExplosion(this.player.x, this.player.y, this.player.color);

                // Update Highscore
                const isNewBest = this.score > this.highScore;
                if (isNewBest) {
                    this.highScore = this.score;
                    localStorage.setItem('ballslide_highscore', this.highScore.toString());
                }

                // Update stats UI
                if (this.dom.goScore) this.dom.goScore.innerText = this.score;
                if (this.dom.goBest) this.dom.goBest.innerText = this.highScore;
                if (this.dom.goGems) this.dom.goGems.innerText = `+${this.gemsThisRun || 0}`;
                if (this.dom.newBestBadge) {
                    this.dom.newBestBadge.style.display = isNewBest ? 'inline-block' : 'none';
                }
                break;
        }
    }

    startGame() {
        this.audio.playClick();
        this.setState('PLAYING');
    }

    setSkin(skinName) {
        this.skin = skinName;
        localStorage.setItem('ballslide_skin', skinName);
        this.audio.playClick();
        document.querySelectorAll('.skin-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.skin === skinName);
        });
    }

    addScore(points = 1) {
        this.score += points;
        this.audio.playScore();
        this.particles.spawnScoreSparks(this.player.x, this.player.y - 40);
        this.updateScoreUI();

        // Bounce score text slightly
        if (this.dom.bottomScore) {
            this.dom.bottomScore.style.transform = 'scale(1.22)';
            setTimeout(() => {
                if (this.dom.bottomScore) this.dom.bottomScore.style.transform = 'scale(1)';
            }, 100);
        }

        // Increase scroll speed smoothly
        this.scrollSpeed = this.baseScrollSpeed + Math.min(420, this.score * 18);
    }

    addGems(amount = 1) {
        this.gems += amount;
        this.gemsThisRun = (this.gemsThisRun || 0) + amount;
        localStorage.setItem('ballslide_gems', this.gems.toString());
        this.audio.playGem();
        this.particles.spawnScoreSparks(this.player.x, this.player.y);
        this.updateStatsUI();
    }

    activateSlowMo() {
        this.slowMoTimer = this.maxSlowMoDuration;
        this.audio.playSlowMo();
        this.particles.spawnSnowflakeBurst(this.player.x, this.player.y);
        if (this.dom.powerupIndicator) {
            this.dom.powerupIndicator.classList.add('active');
        }
    }

    activateShield() {
        this.player.hasShield = true;
        this.audio.playPowerup();
        this.particles.spawnScoreSparks(this.player.x, this.player.y);
    }

    triggerScreenShake(duration, intensity) {
        this.shakeTime = duration;
        this.shakeIntensity = intensity;
    }

    updateStatsUI() {
        if (this.dom.menuHighScore) this.dom.menuHighScore.innerText = this.highScore;
        if (this.dom.menuGems) this.dom.menuGems.innerText = this.gems;
        if (this.dom.gemDisplay) this.dom.gemDisplay.innerText = this.gems;
    }

    updateScoreUI() {
        if (this.dom.bottomScore) this.dom.bottomScore.innerText = this.score;
    }

    // Fixed timestep physics update
    update(dt) {
        // Screen shake decay
        if (this.shakeTime > 0) {
            this.shakeTime -= dt;
        }

        // Particle update (always runs for menu/death shards)
        const isSlowMo = this.slowMoTimer > 0;
        this.particles.update(dt, this.state === 'PLAYING' ? this.scrollSpeed : 100, isSlowMo);

        if (this.state !== 'PLAYING') return;

        this.gameTime += dt;

        // Slow-mo logic
        let effectiveScrollSpeed = this.scrollSpeed;
        if (this.slowMoTimer > 0) {
            this.slowMoTimer -= dt;
            effectiveScrollSpeed *= 0.52; // slow down obstacles by ~48%
            if (this.dom.powerupBar) {
                const ratio = Math.max(0, this.slowMoTimer / this.maxSlowMoDuration);
                this.dom.powerupBar.style.width = `${ratio * 100}%`;
            }
            if (this.slowMoTimer <= 0 && this.dom.powerupIndicator) {
                this.dom.powerupIndicator.classList.remove('active');
            }
        }

        // Player Movement Controls
        const moveSpeed = 1600;
        const isMovingLeft = this.input.keyLeft || this.input.btnLeft;
        const isMovingRight = this.input.keyRight || this.input.btnRight;

        if (isMovingLeft) {
            this.player.targetX -= moveSpeed * dt;
        } else if (isMovingRight) {
            this.player.targetX += moveSpeed * dt;
        } else if (this.input.isDragging) {
            this.player.targetX = this.input.pointerX;
        }

        // Clamp target position inside borders
        const minX = this.wallWidth + this.player.radius;
        const maxX = this.width - this.wallWidth - this.player.radius;
        this.player.targetX = Math.max(minX, Math.min(maxX, this.player.targetX));

        // Smooth responsive interpolation
        const prevX = this.player.x;
        this.player.x += (this.player.targetX - this.player.x) * Math.min(1, 26 * dt);
        this.player.vx = (this.player.x - prevX) / dt;

        // Visual tilt
        this.player.tilt = (this.player.vx / 1800) * 0.25;

        // Spawn player trail
        this.particles.spawnTrail(this.player.x, this.player.y, this.player.radius, this.player.color);

        // Update obstacles
        this.obstacleManager.update(dt, effectiveScrollSpeed);

        // Invulnerability cooldown
        if (this.player.invulnerableTime > 0) {
            this.player.invulnerableTime -= dt;
        }

        // Collision Check
        const col = this.obstacleManager.checkCollision(this.player);
        if (col.hit) {
            if (this.player.invulnerableTime > 0) {
                // Ignore while recovering
            } else if (this.player.hasShield) {
                // Shield absorbs collision
                this.player.hasShield = false;
                this.player.invulnerableTime = 1.2;
                this.audio.playPowerup();
                this.triggerScreenShake(0.25, 15);
                this.particles.spawnDeathExplosion(this.player.x, this.player.y, '#ffffff');
            } else {
                this.setState('GAMEOVER');
            }
        } else if (col.pickup) {
            if (col.pickup.type === 'snowflake') {
                this.activateSlowMo();
            } else if (col.pickup.type === 'gem') {
                this.addGems(1);
            } else if (col.pickup.type === 'shield') {
                this.activateShield();
            }
        }
    }

    // Render Canvas Frame
    render() {
        const ctx = this.ctx;

        ctx.save();

        // Apply screen shake
        if (this.shakeTime > 0) {
            const rx = (Math.random() - 0.5) * this.shakeIntensity;
            const ry = (Math.random() - 0.5) * this.shakeIntensity;
            ctx.translate(rx, ry);
        }

        // 1. Background (signature vibrant green #79c25c from demo.mp4)
        ctx.fillStyle = '#79c25c';
        ctx.fillRect(0, 0, this.width, this.height);

        // Slow-mo ice vignette
        if (this.slowMoTimer > 0) {
            const frostGrad = ctx.createRadialGradient(
                this.width / 2, this.height / 2, 400,
                this.width / 2, this.height / 2, 980
            );
            frostGrad.addColorStop(0, 'rgba(180, 235, 255, 0)');
            frostGrad.addColorStop(1, 'rgba(180, 235, 255, 0.35)');
            ctx.fillStyle = frostGrad;
            ctx.fillRect(0, 0, this.width, this.height);
        }

        // 2. Obstacles and Pickups
        this.obstacleManager.draw(ctx, this.assets);

        // 3. Particles
        this.particles.draw(ctx);

        // 4. Player (if not in gameover)
        if (this.state === 'PLAYING' || this.state === 'MENU') {
            this.drawPlayer(ctx);
        }

        // 5. Walls (Dark charcoal borders #2d2d2d matching demo.mp4)
        ctx.fillStyle = '#2d2d2d';
        // Left wall
        ctx.fillRect(0, 0, this.wallWidth, this.height);
        // Right wall
        ctx.fillRect(this.width - this.wallWidth, 0, this.wallWidth, this.height);

        // Subtle inner edge shadow along walls
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.fillRect(this.wallWidth, 0, 6, this.height);
        ctx.fillRect(this.width - this.wallWidth - 6, 0, 6, this.height);

        ctx.restore();
    }

    drawPlayer(ctx) {
        ctx.save();
        ctx.translate(this.player.x, this.player.y);
        ctx.rotate(this.player.tilt);

        // Invulnerability flicker
        if (this.player.invulnerableTime > 0 && Math.floor(Date.now() / 80) % 2 === 0) {
            ctx.globalAlpha = 0.4;
        }

        const size = this.player.radius * 2;

        if (this.skin === 'ball' && this.assets.player_ball) {
            ctx.drawImage(this.assets.player_ball, -this.player.radius, -this.player.radius, size, size);
        } else if (this.skin === 'star' && this.assets.player_star) {
            ctx.drawImage(this.assets.player_star, -this.player.radius, -this.player.radius, size, size);
        } else if (this.assets.player_square) {
            ctx.drawImage(this.assets.player_square, -this.player.radius, -this.player.radius, size, size);
        } else {
            // Procedural fallback (Cyan Cube from video)
            ctx.fillStyle = '#52ddf9';
            ctx.fillRect(-this.player.radius, -this.player.radius, size, size);
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 4;
            ctx.strokeRect(-this.player.radius, -this.player.radius, size, size);
        }

        // Draw Shield Bubble if active
        if (this.player.hasShield) {
            ctx.strokeStyle = 'rgba(82, 221, 249, 0.85)';
            ctx.lineWidth = 8;
            ctx.beginPath();
            ctx.arc(0, 0, this.player.radius + 18, 0, Math.PI * 2);
            ctx.stroke();

            ctx.fillStyle = 'rgba(82, 221, 249, 0.18)';
            ctx.beginPath();
            ctx.arc(0, 0, this.player.radius + 18, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }
}

window.BallSlideGame = BallSlideGame;

