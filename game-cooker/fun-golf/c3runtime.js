// Construct 3 HTML5 Runtime Environment
// Handles viewport scaling, letterbox sizing, and startup execution

const startupCallbacks = [];

function runOnStartup(cb) {
    startupCallbacks.push(cb);
}

window.runOnStartup = runOnStartup;

class C3RuntimeEnvironment {
    constructor() {
        this.layoutWidth = 1080;
        this.layoutHeight = 1920;
        this.init();
    }

    init() {
        window.addEventListener('DOMContentLoaded', () => {
            this.setupCanvas();
            this.handleResize();
            window.addEventListener('resize', () => this.handleResize());
            window.addEventListener('orientationchange', () => this.handleResize());

            // Run registered startup routines
            startupCallbacks.forEach(cb => cb(this));
        });
    }

    setupCanvas() {
        const canvas = document.getElementById('c3canvas');
        if (!canvas) return;

        canvas.width = this.layoutWidth;
        canvas.height = this.layoutHeight;

        // Prevent unwanted touch gestures on mobile
        document.addEventListener('gesturestart', (e) => e.preventDefault());
        document.addEventListener('touchmove', (e) => {
            if (e.scale !== 1) e.preventDefault();
        }, { passive: false });
    }

    handleResize() {
        const canvas = document.getElementById('c3canvas');
        if (!canvas) return;

        const winW = window.innerWidth;
        const winH = window.innerHeight;

        const targetAspect = this.layoutWidth / this.layoutHeight; // 1080 / 1920 = 0.5625
        const windowAspect = winW / winH;

        let displayW, displayH;

        // Construct 3 "Letterbox Scale" logic
        if (windowAspect < targetAspect) {
            // Window is narrower than game -> fit width
            displayW = winW;
            displayH = winW / targetAspect;
        } else {
            // Window is taller than game -> fit height
            displayH = winH;
            displayW = winH * targetAspect;
        }

        canvas.style.width = `${Math.floor(displayW)}px`;
        canvas.style.height = `${Math.floor(displayH)}px`;
    }
}

// Instantiate Runtime
window.c3Runtime = new C3RuntimeEnvironment();
