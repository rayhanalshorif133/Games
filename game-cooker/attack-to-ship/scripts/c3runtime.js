// Canvas roundRect Polyfill for universal browser compatibility
if (typeof CanvasRenderingContext2D !== 'undefined' && !CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, radii = 0) {
        if (!Array.isArray(radii)) radii = [radii, radii, radii, radii];
        const r = radii[0] || 0;
        this.beginPath();
        this.moveTo(x + r, y);
        this.lineTo(x + w - r, y);
        this.quadraticCurveTo(x + w, y, x + w, y + r);
        this.lineTo(x + w, y + h - r);
        this.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        this.lineTo(x + r, y + h);
        this.quadraticCurveTo(x, y + h, x, y + h - r);
        this.lineTo(x, y + r);
        this.quadraticCurveTo(x, y, x + r, y);
        this.closePath();
        return this;
    };
}

class C3Runtime {
    constructor() {
        this.layoutWidth = 1080;
        this.layoutHeight = 1920;
        this.canvas = null;
        this.ctx = null;

        this.images = {};
        this.loadedAssets = 0;
        this.totalAssets = 0;

        this.keys = {};
        this.touchPointers = new Map();
        this.touchZones = {};

        this.lastTime = 0;
        this.running = false;
        this.gameInstance = null;
    }

    init(canvasId, gameInstance) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d', { alpha: false });
        this.gameInstance = gameInstance;

        // Set native canvas size to target 1080x1920
        this.canvas.width = this.layoutWidth;
        this.canvas.height = this.layoutHeight;

        this.setupResizeHandler();
        this.setupInputListeners();
    }

    setupResizeHandler() {
        const resize = () => {
            const windowW = window.innerWidth;
            const windowH = window.innerHeight;
            const targetAspect = this.layoutWidth / this.layoutHeight;
            const windowAspect = windowW / windowH;

            let displayW, displayH;
            if (windowAspect < targetAspect) {
                displayW = windowW;
                displayH = windowW / targetAspect;
            } else {
                displayH = windowH;
                displayW = windowH * targetAspect;
            }

            this.canvas.style.width = `${Math.floor(displayW)}px`;
            this.canvas.style.height = `${Math.floor(displayH)}px`;
        };

        window.addEventListener('resize', resize);
        window.addEventListener('orientationchange', () => setTimeout(resize, 100));
        resize();
    }

    loadAssets(assetManifest, onProgress, onComplete) {
        const keys = Object.keys(assetManifest);
        this.totalAssets = keys.length;
        this.loadedAssets = 0;

        if (this.totalAssets === 0) {
            onComplete();
            return;
        }

        for (const [key, path] of Object.entries(assetManifest)) {
            const img = new Image();
            img.onload = () => {
                this.images[key] = img;
                this.loadedAssets++;
                if (onProgress) onProgress(this.loadedAssets / this.totalAssets);
                if (this.loadedAssets === this.totalAssets) {
                    onComplete();
                }
            };
            img.onerror = () => {
                console.warn(`Failed to load asset: ${path}, creating fallback`);
                this.loadedAssets++;
                if (onProgress) onProgress(this.loadedAssets / this.totalAssets);
                if (this.loadedAssets === this.totalAssets) {
                    onComplete();
                }
            };
            img.src = path;
        }
    }

    setupInputListeners() {
        // Keyboard
        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            if (['ArrowLeft', 'ArrowRight', 'ArrowDown', 'ArrowUp', 'Space'].includes(e.code)) {
                e.preventDefault();
            }
            if (this.gameInstance && this.gameInstance.onKeyDown) {
                this.gameInstance.onKeyDown(e.code);
            }
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
            if (this.gameInstance && this.gameInstance.onKeyUp) {
                this.gameInstance.onKeyUp(e.code);
            }
        });

        // Touch & Pointer Events normalized to 1080x1920 canvas coordinates
        const getCanvasCoords = (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const scaleX = this.layoutWidth / rect.width;
            const scaleY = this.layoutHeight / rect.height;
            return {
                x: (e.clientX - rect.left) * scaleX,
                y: (e.clientY - rect.top) * scaleY
            };
        };

        const onPointerDown = (e) => {
            window.soundEngine.unlock();
            const pt = getCanvasCoords(e);
            this.touchPointers.set(e.pointerId, pt);
            if (this.gameInstance && this.gameInstance.onPointerDown) {
                this.gameInstance.onPointerDown(e.pointerId, pt.x, pt.y);
            }
        };

        const onPointerMove = (e) => {
            if (this.touchPointers.has(e.pointerId)) {
                const pt = getCanvasCoords(e);
                this.touchPointers.set(e.pointerId, pt);
                if (this.gameInstance && this.gameInstance.onPointerMove) {
                    this.gameInstance.onPointerMove(e.pointerId, pt.x, pt.y);
                }
            }
        };

        const onPointerUp = (e) => {
            if (this.touchPointers.has(e.pointerId)) {
                const pt = this.touchPointers.get(e.pointerId);
                this.touchPointers.delete(e.pointerId);
                if (this.gameInstance && this.gameInstance.onPointerUp) {
                    this.gameInstance.onPointerUp(e.pointerId, pt.x, pt.y);
                }
            }
        };

        this.canvas.addEventListener('pointerdown', onPointerDown);
        this.canvas.addEventListener('pointermove', onPointerMove);
        this.canvas.addEventListener('pointerup', onPointerUp);
        this.canvas.addEventListener('pointercancel', onPointerUp);
    }

    start() {
        this.running = true;
        this.lastTime = performance.now();
        const loop = (now) => {
            if (!this.running) return;
            const dt = Math.min((now - this.lastTime) / 1000, 0.1); // clamp dt
            this.lastTime = now;

            if (this.gameInstance) {
                this.gameInstance.update(dt);
                this.gameInstance.render(this.ctx, this.images);
            }

            requestAnimationFrame(loop);
        };
        requestAnimationFrame(loop);
    }

    stop() {
        this.running = false;
    }
}

window.c3Runtime = new C3Runtime();
