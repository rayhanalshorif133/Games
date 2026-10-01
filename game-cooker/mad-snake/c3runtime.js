// Construct 3 Web Engine Runtime for Mad Snake
// Layout: 1080 x 1920 (Portrait)

(function () {
    'use strict';

    const ASSETS_TO_LOAD = {
        // Sprites
        snake_head: 'images/sprites/snake_head.png',
        snake_body: 'images/sprites/snake_body.png',
        enemy_head: 'images/sprites/enemy_head.png',
        enemy_body: 'images/sprites/enemy_body.png',
        apple_red: 'images/sprites/apple_red.png',
        apple_green: 'images/sprites/apple_green.png',
        taco: 'images/sprites/taco.png',
        sushi: 'images/sprites/sushi.png',
        fire_icon: 'images/sprites/fire_icon.png',
        fireball: 'images/sprites/fireball.png',
        obstacle_plant: 'images/sprites/obstacle_plant.png',
        obstacle_cactus: 'images/sprites/obstacle_cactus.png',
        obstacle_sakura: 'images/sprites/obstacle_sakura.png',

        // UI
        btn_fire: 'images/ui/btn_fire.png',
        btn_gamepad: 'images/ui/btn_gamepad.png',
        btn_pause: 'images/ui/btn_pause.png',
        heart: 'images/ui/heart.png',
        icon_lock: 'images/ui/icon_lock.png',
        icon_check: 'images/ui/icon_check.png',
        icon_crown: 'images/ui/icon_crown.png',
        icon_home: 'images/ui/icon_home.png',

        // World Map Flags & Icons
        flag_au: 'images/ui/flag_au.png',
        flag_us: 'images/ui/flag_us.png',
        flag_br: 'images/ui/flag_br.png',
        flag_mx: 'images/ui/flag_mx.png',
        flag_jp: 'images/ui/flag_jp.png',
        icon_mushroom: 'images/ui/icon_mushroom.png',
        icon_shell: 'images/ui/icon_shell.png',
        icon_snowflake: 'images/ui/icon_snowflake.png'
    };

    class C3Runtime {
        constructor() {
            this.canvas = document.getElementById('c3canvas');
            this.ctx = this.canvas.getContext('2d');
            this.game = null;
            this.images = {};
            this.lastTime = 0;
            this.isLoaded = false;
        }

        init() {
            this.setupResponsiveCanvas();
            window.addEventListener('resize', () => this.setupResponsiveCanvas());
            this.loadAssets();
        }

        setupResponsiveCanvas() {
            const TARGET_W = 1080;
            const TARGET_H = 1920;
            const targetRatio = TARGET_W / TARGET_H;

            const winW = window.innerWidth;
            const winH = window.innerHeight;
            const winRatio = winW / winH;

            let canvasW, canvasH;

            if (winRatio > targetRatio) {
                // Window is wider than 9:16 (letterbox bars on left/right)
                canvasH = winH;
                canvasW = winH * targetRatio;
            } else {
                // Window is taller than 9:16 (letterbox bars on top/bottom)
                canvasW = winW;
                canvasH = winW / targetRatio;
            }

            this.canvas.style.width = `${Math.floor(canvasW)}px`;
            this.canvas.style.height = `${Math.floor(canvasH)}px`;
        }

        loadAssets() {
            const keys = Object.keys(ASSETS_TO_LOAD);
            let loadedCount = 0;
            const total = keys.length;

            const onAssetDone = () => {
                loadedCount++;
                const progress = loadedCount / total;
                this.renderLoadingScreen(progress);

                if (loadedCount >= total) {
                    this.isLoaded = true;
                    setTimeout(() => {
                        this.startGame();
                    }, 200);
                }
            };

            this.renderLoadingScreen(0);

            keys.forEach(key => {
                const img = new Image();
                img.onload = () => {
                    this.images[key] = img;
                    onAssetDone();
                };
                img.onerror = () => {
                    console.warn(`Could not load asset: ${ASSETS_TO_LOAD[key]}`);
                    onAssetDone();
                };
                img.src = ASSETS_TO_LOAD[key];
            });
        }

        renderLoadingScreen(progress) {
            const ctx = this.ctx;
            ctx.fillStyle = '#0d0d11';
            ctx.fillRect(0, 0, 1080, 1920);

            const cx = 540;
            const cy = 960;

            // Title
            ctx.fillStyle = '#4ade80';
            ctx.font = 'bold 72px "Outfit", sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('MAD SNAKE', cx, cy - 100);

            // Subtitle
            ctx.fillStyle = '#94a3b8';
            ctx.font = '32px "Outfit", sans-serif';
            ctx.fillText('Construct 3 HTML5 Engine Loading...', cx, cy - 30);

            // Progress Bar Track
            const barW = 600;
            const barH = 20;
            ctx.fillStyle = '#1e293b';
            ctx.beginPath();
            ctx.roundRect(cx - barW / 2, cy + 40, barW, barH, 10);
            ctx.fill();

            // Progress Bar Fill
            ctx.fillStyle = '#22c55e';
            ctx.beginPath();
            ctx.roundRect(cx - barW / 2, cy + 40, Math.max(16, barW * progress), barH, 10);
            ctx.fill();
        }

        startGame() {
            this.game = new window.Game();
            this.game.setImages(this.images);
            this.game.startEndlessMode();

            this.lastTime = performance.now();
            requestAnimationFrame((time) => this.loop(time));
        }

        loop(currentTime) {
            const dt = Math.min((currentTime - this.lastTime) / 1000, 0.1);
            this.lastTime = currentTime;

            if (this.game) {
                this.game.update(dt);
                this.game.draw();
            }

            requestAnimationFrame((time) => this.loop(time));
        }
    }

    window.addEventListener('DOMContentLoaded', () => {
        const runtime = new C3Runtime();
        runtime.init();
    });
})();
