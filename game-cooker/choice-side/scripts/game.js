/**
 * Core Game Engine for Choice Side
 * Handles 1080x1920 layout loop, scrolling backgrounds, collision checks, timer, and state transitions
 */

'use strict';

class Game {
    constructor() {
        this.canvas = document.getElementById('c3canvas');
        this.ctx = this.canvas.getContext('2d');

        // Layout constants (Construct 3 exported virtual layout)
        this.LAYOUT_WIDTH = 1080;
        this.LAYOUT_HEIGHT = 1920;

        // Assets dictionary
        this.assets = {};

        // Subsystems
        this.sound = new SoundController();
        this.particles = new ParticleSystem();
        this.obstacles = null;
        this.player = null;

        // Game Loop & State
        this.state = 'LOADING'; // 'LOADING', 'MENU', 'PLAYING', 'PAUSED', 'GAMEOVER'
        this.lastTime = 0;
        this.elapsedGameTime = 0;
        this.scrollSpeed = 540; // px/sec baseline vertical speed
        this.bgScrollY = 0;
        this.wallScrollY = 0;

        // Stats & High Scores
        this.bestTimeSeconds = parseInt(localStorage.getItem('choice_side_best_time') || '0', 10);
        this.totalApples = parseInt(localStorage.getItem('choice_side_total_apples') || '0', 10);

        // Bind DOM elements
        this.initDOMElements();
    }

    initDOMElements() {
        // Screens
        this.screens = {
            loading: document.getElementById('loading-screen'),
            start: document.getElementById('start-screen'),
            hud: document.getElementById('hud-overlay'),
            gameover: document.getElementById('gameover-screen'),
            pause: document.getElementById('pause-screen')
        };

        // HUD Text
        this.hudTimer = document.getElementById('hud-timer-text');
        this.hudApples = document.getElementById('hud-apple-text');
        this.hudLives = document.getElementById('hud-life-text');
        this.imgHudAudio = document.getElementById('img-hud-audio');
        this.imgMenuAudio = document.getElementById('img-menu-audio');

        // Menu Stats
        this.menuBestTime = document.getElementById('menu-best-time');
        this.menuApples = document.getElementById('menu-apples');

        // Game Over Stats
        this.goTime = document.getElementById('go-time-val');
        this.goBestTime = document.getElementById('go-best-time-val');
        this.goApples = document.getElementById('go-apples-val');
        this.goTotalApples = document.getElementById('go-total-apples-val');

        // Buttons
        document.getElementById('btn-start').addEventListener('click', () => this.startGame());
        document.getElementById('btn-restart').addEventListener('click', () => this.startGame());
        document.getElementById('btn-menu').addEventListener('click', () => this.showMenu());
        
        document.getElementById('btn-hud-home').addEventListener('click', (e) => {
            e.stopPropagation();
            this.pauseGame();
        });
        document.getElementById('btn-resume').addEventListener('click', () => this.resumeGame());
        document.getElementById('btn-pause-restart').addEventListener('click', () => this.startGame());
        document.getElementById('btn-pause-menu').addEventListener('click', () => this.showMenu());

        // Audio toggles
        const handleAudioToggle = (e) => {
            e.stopPropagation();
            const muted = this.sound.toggleMute();
            this.updateAudioIcons(muted);
        };
        document.getElementById('btn-hud-audio').addEventListener('click', handleAudioToggle);
        document.getElementById('btn-menu-audio').addEventListener('click', handleAudioToggle);

        // Canvas & Container Input (Tap anywhere to jump)
        const container = document.getElementById('c3-app-container');
        const handleTap = (e) => {
            if (this.state === 'PLAYING') {
                // If user didn't tap top HUD buttons
                const target = e.target;
                if (!target.closest('button')) {
                    this.player.jump();
                }
            }
        };

        container.addEventListener('pointerdown', handleTap);
        window.addEventListener('keydown', (e) => {
            if (e.code === 'Space' || e.code === 'ArrowUp') {
                if (this.state === 'PLAYING') {
                    this.player.jump();
                } else if (this.state === 'MENU') {
                    this.startGame();
                }
            }
        });
    }

    updateAudioIcons(muted) {
        const iconSrc = muted ? 'images/ui_audio_off.png' : 'images/ui_audio.png';
        if (this.imgHudAudio) this.imgHudAudio.src = iconSrc;
        if (this.imgMenuAudio) this.imgMenuAudio.src = iconSrc;
    }

    setScreen(screenName) {
        for (const [key, el] of Object.entries(this.screens)) {
            if (key === screenName) {
                el.classList.remove('ui-hidden');
            } else {
                el.classList.add('ui-hidden');
            }
        }
    }

    preloadAssets(onProgress, onComplete) {
        const assetList = [
            { key: 'bgCanyon', src: 'images/bg_canyon.png' },
            { key: 'wallLeft', src: 'images/wall_left.png' },
            { key: 'wallRight', src: 'images/wall_right.png' },
            { key: 'playerClimb0', src: 'images/player_climb_0.png' },
            { key: 'playerClimb1', src: 'images/player_climb_1.png' },
            { key: 'playerJump', src: 'images/player_jump.png' },
            { key: 'playerHurt', src: 'images/player_hurt.png' },
            { key: 'sawBlade', src: 'images/saw_blade.png' },
            { key: 'boulder', src: 'images/boulder.png' },
            { key: 'fireball', src: 'images/fireball.png' },
            { key: 'appleGreen', src: 'images/apple_green.png' },
            { key: 'appleYellow', src: 'images/apple_yellow.png' },
            { key: 'applePurple', src: 'images/apple_purple.png' },
            { key: 'appleSliceLeft', src: 'images/apple_slice_left.png' },
            { key: 'appleSliceRight', src: 'images/apple_slice_right.png' },
            { key: 'heart', src: 'images/heart.png' },
            { key: 'slashTrail', src: 'images/slash_trail.png' },
            { key: 'uiHome', src: 'images/ui_home.png' },
            { key: 'uiAudio', src: 'images/ui_audio.png' },
            { key: 'uiAudioOff', src: 'images/ui_audio_off.png' },
            { key: 'uiAppleBadge', src: 'images/ui_apple_badge.png' },
            { key: 'uiLifeBadge', src: 'images/ui_life_badge.png' }
        ];

        let loadedCount = 0;
        const total = assetList.length;

        assetList.forEach(item => {
            const img = new Image();
            img.onload = () => {
                loadedCount++;
                onProgress(loadedCount / total);
                if (loadedCount >= total) {
                    onComplete();
                }
            };
            img.onerror = () => {
                console.warn('Failed to load:', item.src);
                loadedCount++;
                onProgress(loadedCount / total);
                if (loadedCount >= total) {
                    onComplete();
                }
            };
            img.src = item.src;
            this.assets[item.key] = img;
        });
    }

    init() {
        this.sound.init();
        this.updateAudioIcons(this.sound.muted);

        const fillBar = document.getElementById('loading-bar-fill');

        this.preloadAssets(
            (progress) => {
                if (fillBar) fillBar.style.width = `${Math.floor(progress * 100)}%`;
            },
            () => {
                // Instantiation
                this.obstacles = new ObstacleManager(this.assets);
                this.player = new Player(this.assets, this.sound, this.particles);

                setTimeout(() => {
                    this.showMenu();
                    requestAnimationFrame((time) => this.loop(time));
                }, 400);
            }
        );
    }

    showMenu() {
        this.state = 'MENU';
        this.setScreen('start');

        // Update menu high scores
        if (this.menuBestTime) this.menuBestTime.textContent = this.formatTime(this.bestTimeSeconds);
        if (this.menuApples) this.menuApples.textContent = this.totalApples;
    }

    startGame() {
        this.state = 'PLAYING';
        this.setScreen('hud');

        this.elapsedGameTime = 0;
        this.scrollSpeed = 540;
        this.bgScrollY = 0;
        this.wallScrollY = 0;

        this.particles.reset();
        this.obstacles.reset();
        this.player.reset();

        this.sound.unlock();
        this.sound.playBGM();

        this.updateHUD();
    }

    pauseGame() {
        if (this.state !== 'PLAYING') return;
        this.state = 'PAUSED';
        this.screens.pause.classList.remove('ui-hidden');
    }

    resumeGame() {
        if (this.state !== 'PAUSED') return;
        this.state = 'PLAYING';
        this.screens.pause.classList.add('ui-hidden');
        this.lastTime = performance.now();
    }

    gameOver() {
        this.state = 'GAMEOVER';
        this.sound.stopBGM();

        // Update High Scores
        const currentSurvSec = Math.floor(this.elapsedGameTime);
        if (currentSurvSec > this.bestTimeSeconds) {
            this.bestTimeSeconds = currentSurvSec;
            localStorage.setItem('choice_side_best_time', this.bestTimeSeconds);
        }

        this.totalApples += this.player.applesSliced;
        localStorage.setItem('choice_side_total_apples', this.totalApples);

        // Populate modal
        if (this.goTime) this.goTime.textContent = this.formatTime(currentSurvSec);
        if (this.goBestTime) this.goBestTime.textContent = this.formatTime(this.bestTimeSeconds);
        if (this.goApples) this.goApples.textContent = this.player.applesSliced;
        if (this.goTotalApples) this.goTotalApples.textContent = this.totalApples;

        setTimeout(() => {
            this.setScreen('gameover');
        }, 800);
    }

    formatTime(totalSec) {
        const mins = Math.floor(totalSec / 60);
        const secs = Math.floor(totalSec % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    updateHUD() {
        if (this.hudTimer) {
            this.hudTimer.textContent = this.formatTime(this.elapsedGameTime);
        }
        if (this.hudApples) {
            this.hudApples.textContent = `X${this.player.applesSliced}`;
        }
        if (this.hudLives) {
            this.hudLives.textContent = `${Math.max(0, this.player.lives)}X`;
        }
    }

    loop(time) {
        if (!this.lastTime) this.lastTime = time;
        const dt = Math.min(0.1, (time - this.lastTime) / 1000);
        this.lastTime = time;

        if (this.state === 'PLAYING') {
            this.update(dt);
        } else if (this.state === 'MENU') {
            // Idle background scrolling in menu for lively feel
            this.bgScrollY = (this.bgScrollY + 140 * dt) % this.LAYOUT_HEIGHT;
            this.wallScrollY = (this.wallScrollY + 280 * dt) % this.LAYOUT_HEIGHT;
        }

        this.render();
        requestAnimationFrame((t) => this.loop(t));
    }

    update(dt) {
        this.elapsedGameTime += dt;

        // Progressive speed scaling
        this.scrollSpeed = 540 + Math.min(460, this.elapsedGameTime * 7.5);

        // Seamless vertical scroll
        this.bgScrollY = (this.bgScrollY + this.scrollSpeed * 0.45 * dt) % this.LAYOUT_HEIGHT;
        this.wallScrollY = (this.wallScrollY + this.scrollSpeed * dt) % this.LAYOUT_HEIGHT;

        // Update player & hazards
        this.player.update(dt, this.scrollSpeed);
        this.obstacles.update(dt, this.scrollSpeed);
        this.particles.update(dt);

        // Collision Checks
        const isDead = this.player.checkCollisions(this.obstacles);
        if (isDead) {
            this.gameOver();
        }

        this.updateHUD();
    }

    render() {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.LAYOUT_WIDTH, this.LAYOUT_HEIGHT);

        // Camera Screen Shake Offset
        const shake = this.particles.getShakeOffset();
        ctx.save();
        ctx.translate(shake.x, shake.y);

        // 1. Draw Canyon Background (Parallax Seamless Scrolling)
        const bg = this.assets.bgCanyon;
        if (bg && bg.complete) {
            const y1 = this.bgScrollY;
            const y2 = y1 - this.LAYOUT_HEIGHT;
            ctx.drawImage(bg, 0, y1, this.LAYOUT_WIDTH, this.LAYOUT_HEIGHT);
            ctx.drawImage(bg, 0, y2, this.LAYOUT_WIDTH, this.LAYOUT_HEIGHT);
        }

        // 2. Draw Obstacles & Collectibles
        if (this.obstacles) {
            this.obstacles.draw(ctx);
        }

        // 3. Draw Player
        if (this.player) {
            this.player.draw(ctx);
        }

        // 4. Draw Particles & Visual FX (Slashes, fruit halves, pulp)
        this.particles.draw(ctx);

        // 5. Draw Rocky Cliff Walls (Overlays on left & right edges)
        const wl = this.assets.wallLeft;
        const wr = this.assets.wallRight;
        const wallW = 180;
        const wy1 = this.wallScrollY;
        const wy2 = wy1 - this.LAYOUT_HEIGHT;

        if (wl && wl.complete) {
            ctx.drawImage(wl, 0, wy1, wallW, this.LAYOUT_HEIGHT);
            ctx.drawImage(wl, 0, wy2, wallW, this.LAYOUT_HEIGHT);
        }
        if (wr && wr.complete) {
            ctx.drawImage(wr, this.LAYOUT_WIDTH - wallW, wy1, wallW, this.LAYOUT_HEIGHT);
            ctx.drawImage(wr, this.LAYOUT_WIDTH - wallW, wy2, wallW, this.LAYOUT_HEIGHT);
        }

        // 6. Draw Red Hurt Screen Tint Flash
        if (this.particles.flashAlpha > 0) {
            ctx.save();
            ctx.fillStyle = `rgba(220, 38, 38, ${this.particles.flashAlpha})`;
            ctx.fillRect(0, 0, this.LAYOUT_WIDTH, this.LAYOUT_HEIGHT);
            ctx.restore();
        }

        ctx.restore();
    }
}

window.Game = Game;

