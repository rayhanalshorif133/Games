/**
 * Main Game Loop, Asset Loader, and Canvas Renderer
 */
class MainEngine {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d', { alpha: false });

        this.FIELD_WIDTH = 752;
        this.FIELD_HEIGHT = 1344;

        this.assets = {};
        this.assetsLoaded = false;
        this.lastTime = performance.now();

        this.init();
    }

    async init() {
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());

        this.setupInputListeners();
        await this.loadAssets();

        // Register Service Worker
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('./sw.js').catch((err) => {
                console.log('SW registration skipped:', err);
            });
        }

        // Start animation loop
        requestAnimationFrame((t) => this.loop(t));
    }

    resizeCanvas() {
        const wrap = document.getElementById('canvas-container');
        if (!wrap) return;

        const wWidth = window.innerWidth;
        const wHeight = window.innerHeight;
        const targetRatio = this.FIELD_WIDTH / this.FIELD_HEIGHT;
        const windowRatio = wWidth / wHeight;

        let dispW, dispH;
        if (windowRatio > targetRatio) {
            dispH = wHeight;
            dispW = wHeight * targetRatio;
        } else {
            dispW = wWidth;
            dispH = wWidth / targetRatio;
        }

        this.canvas.style.width = `${dispW}px`;
        this.canvas.style.height = `${dispH}px`;
    }

    loadAssets() {
        const toLoad = {
            field: 'Assets/Football Field.png',
            ball: 'Assets/soccer-ball.png',
            paddleRed: 'Assets/Game Bar-Red.png',
            paddleYellow: 'Assets/Game Bar-yellow.png',
            scoreBar: 'Assets/Score Bar.png'
        };

        const promises = Object.entries(toLoad).map(([key, src]) => {
            return new Promise((resolve) => {
                const img = new Image();
                img.onload = () => {
                    this.assets[key] = img;
                    resolve();
                };
                img.onerror = () => {
                    console.warn('Failed loading asset:', src);
                    resolve();
                };
                img.src = src;
            });
        });

        return Promise.all(promises).then(() => {
            this.assetsLoaded = true;
        });
    }

    setupInputListeners() {
        const getGameCoords = (clientX, clientY) => {
            const rect = this.canvas.getBoundingClientRect();
            const scaleX = this.FIELD_WIDTH / rect.width;
            const scaleY = this.FIELD_HEIGHT / rect.height;
            return {
                x: (clientX - rect.left) * scaleX,
                y: (clientY - rect.top) * scaleY
            };
        };

        // Mouse Events
        let isMouseDown = false;
        this.canvas.addEventListener('mousedown', (e) => {
            isMouseDown = true;
            const coords = getGameCoords(e.clientX, e.clientY);
            window.gameController?.handlePointerInput(coords.x, coords.y, false);
        });

        window.addEventListener('mousemove', (e) => {
            if (isMouseDown || window.gameController?.state === 'PLAYING') {
                const coords = getGameCoords(e.clientX, e.clientY);
                window.gameController?.handlePointerInput(coords.x, coords.y, false);
            }
        });

        window.addEventListener('mouseup', () => {
            isMouseDown = false;
        });

        // Touch Events
        const handleTouch = (e) => {
            e.preventDefault();
            for (let i = 0; i < e.touches.length; i++) {
                const t = e.touches[i];
                const coords = getGameCoords(t.clientX, t.clientY);
                window.gameController?.handlePointerInput(coords.x, coords.y, true);
            }
        };

        this.canvas.addEventListener('touchstart', handleTouch, { passive: false });
        this.canvas.addEventListener('touchmove', handleTouch, { passive: false });
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
        }, { passive: false });

        // Keyboard Events
        window.addEventListener('keydown', (e) => {
            if (window.gameController) {
                window.gameController.keys[e.code] = true;
            }
        });

        window.addEventListener('keyup', (e) => {
            if (window.gameController) {
                window.gameController.keys[e.code] = false;
            }
        });
    }

    loop(currentTime) {
        const dt = Math.min((currentTime - this.lastTime) / 1000, 0.05); // Cap at 50ms to prevent spiral of death
        this.lastTime = currentTime;

        // Update Game Controller
        if (window.gameController) {
            window.gameController.update(dt);
        }

        // Render Canvas
        this.render();

        requestAnimationFrame((t) => this.loop(t));
    }

    render() {
        const ctx = this.ctx;
        const physics = window.physicsEngine;
        const effects = window.effectsManager;

        ctx.save();

        // Apply screen shake
        if (effects && (effects.shakeX !== 0 || effects.shakeY !== 0)) {
            ctx.translate(effects.shakeX, effects.shakeY);
        }

        // 1. Draw Football Field Background
        if (this.assets.field) {
            ctx.drawImage(this.assets.field, 0, 0, this.FIELD_WIDTH, this.FIELD_HEIGHT);
        } else {
            ctx.fillStyle = '#1e7b34';
            ctx.fillRect(0, 0, this.FIELD_WIDTH, this.FIELD_HEIGHT);
        }

        if (!physics) {
            ctx.restore();
            return;
        }

        // 2. Draw Ball Motion Trails
        if (effects) {
            effects.renderTrails(ctx);
        }

        // 3. Draw Ball Drop Shadow
        const b = physics.ball;
        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
        ctx.beginPath();
        ctx.ellipse(b.x + 4, b.y + 10, b.radius * 0.95, b.radius * 0.65, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // 4. Draw Ball with Rolling Rotation
        ctx.save();
        ctx.translate(b.x, b.y);
        ctx.rotate(b.rotation);
        if (this.assets.ball) {
            const diam = b.radius * 2;
            ctx.drawImage(this.assets.ball, -b.radius, -b.radius, diam, diam);
        } else {
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(0, 0, b.radius, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();

        // 5. Draw Player 1 Paddle (Red - Bottom)
        const p1 = physics.p1;
        ctx.save();
        // Paddle Drop Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
        ctx.fillRect(p1.x - physics.PADDLE_HALF_W + 3, p1.y - physics.PADDLE_HALF_H + 6, physics.PADDLE_WIDTH, physics.PADDLE_HEIGHT);

        if (this.assets.paddleRed) {
            ctx.drawImage(this.assets.paddleRed, p1.x - physics.PADDLE_HALF_W, p1.y - physics.PADDLE_HALF_H, physics.PADDLE_WIDTH, physics.PADDLE_HEIGHT);
        } else {
            ctx.fillStyle = '#e53935';
            ctx.fillRect(p1.x - physics.PADDLE_HALF_W, p1.y - physics.PADDLE_HALF_H, physics.PADDLE_WIDTH, physics.PADDLE_HEIGHT);
        }
        ctx.restore();

        // 6. Draw Player 2 Paddle (Yellow - Top)
        const p2 = physics.p2;
        ctx.save();
        // Paddle Drop Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
        ctx.fillRect(p2.x - physics.PADDLE_HALF_W + 3, p2.y - physics.PADDLE_HALF_H + 6, physics.PADDLE_WIDTH, physics.PADDLE_HEIGHT);

        if (this.assets.paddleYellow) {
            ctx.drawImage(this.assets.paddleYellow, p2.x - physics.PADDLE_HALF_W, p2.y - physics.PADDLE_HALF_H, physics.PADDLE_WIDTH, physics.PADDLE_HEIGHT);
        } else {
            ctx.fillStyle = '#fdd835';
            ctx.fillRect(p2.x - physics.PADDLE_HALF_W, p2.y - physics.PADDLE_HALF_H, physics.PADDLE_WIDTH, physics.PADDLE_HEIGHT);
        }
        ctx.restore();

        // 7. Draw Visual Effects (Rings, Particles, Confetti)
        if (effects) {
            effects.render(ctx);
        }

        // 8. Goal Celebration Overlay ("GOAL!!!" Pulsing banner)
        if (effects) {
            effects.renderCelebrationOverlay(ctx, this.FIELD_WIDTH, this.FIELD_HEIGHT);
        }

        ctx.restore();
    }
}

window.addEventListener('DOMContentLoaded', () => {
    window.mainEngine = new MainEngine();
});

