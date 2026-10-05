// Construct 3 HTML5 Runtime Environment
// Handles viewport scaling (letterbox), input coordinate projection, and game loop orchestration

const startupCallbacks = [];

function runOnStartup(cb) {
    startupCallbacks.push(cb);
}

window.runOnStartup = runOnStartup;

class C3RuntimeEnvironment {
    constructor() {
        this.layoutWidth = 1080;
        this.layoutHeight = 1920;
        this.canvas = null;
        this.ctx = null;
        this.canvasScale = 1;
        this.canvasOffsetX = 0;
        this.canvasOffsetY = 0;
        this.displayWidth = 1080;
        this.displayHeight = 1920;
        this.isLoaded = false;
        this.init();
    }

    init() {
        window.addEventListener('DOMContentLoaded', () => {
            this.setupCanvas();
            this.handleResize();
            window.addEventListener('resize', () => this.handleResize());
            window.addEventListener('orientationchange', () => this.handleResize());

            startupCallbacks.forEach(cb => cb(this));
        });
    }

    setupCanvas() {
        this.canvas = document.getElementById('c3canvas');
        if (!this.canvas) return;

        this.ctx = this.canvas.getContext('2d', { alpha: false });
        this.canvas.width = this.layoutWidth;
        this.canvas.height = this.layoutHeight;

        document.addEventListener('gesturestart', (e) => e.preventDefault());
        document.addEventListener('touchmove', (e) => {
            if (e.scale !== 1) e.preventDefault();
        }, { passive: false });
    }

    handleResize() {
        if (!this.canvas) return;

        const winW = window.innerWidth;
        const winH = window.innerHeight;

        const targetAspect = this.layoutWidth / this.layoutHeight; // 1080 / 1920 = 0.5625
        const windowAspect = winW / winH;

        let displayW, displayH;

        if (windowAspect < targetAspect) {
            displayW = winW;
            displayH = winW / targetAspect;
        } else {
            displayH = winH;
            displayW = winH * targetAspect;
        }

        this.displayWidth = displayW;
        this.displayHeight = displayH;

        this.canvas.style.width = `${Math.floor(displayW)}px`;
        this.canvas.style.height = `${Math.floor(displayH)}px`;

        const rect = this.canvas.getBoundingClientRect();
        this.canvasOffsetX = rect.left;
        this.canvasOffsetY = rect.top;
        this.canvasScale = this.layoutWidth / rect.width;
    }

    screenToLayout(clientX, clientY) {
        if (!this.canvas) return { x: 0, y: 0 };
        const rect = this.canvas.getBoundingClientRect();
        const normX = (clientX - rect.left) / rect.width;
        const normY = (clientY - rect.top) / rect.height;
        return {
            x: Math.max(0, Math.min(this.layoutWidth, normX * this.layoutWidth)),
            y: Math.max(0, Math.min(this.layoutHeight, normY * this.layoutHeight))
        };
    }

    hideLoader() {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            overlay.style.opacity = '0';
            setTimeout(() => {
                overlay.style.display = 'none';
            }, 400);
        }
        this.isLoaded = true;
    }
}

window.c3Runtime = new C3RuntimeEnvironment();
