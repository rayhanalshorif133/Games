'use strict';

/**
 * Construct 3 Main Script Entry Point
 * Initializes C3 Canvas, enforces 1080x1920 layout aspect ratio scaling,
 * boots C3Runtime.
 */
window.addEventListener('DOMContentLoaded', () => {
    // Check support
    if (window.C3_IsSupported === false) {
        console.error('Construct 3 requires HTML5 Canvas & WebGL support.');
        return;
    }

    // Init offline client
    if (window.C3_OfflineClient) {
        window.C3_OfflineClient.init();
    }

    const canvas = document.getElementById('c3canvas');
    if (!canvas) {
        console.error('Canvas element #c3canvas not found.');
        return;
    }

    // Virtual Resolution Dimensions
    const VIRTUAL_WIDTH = 1080;
    const VIRTUAL_HEIGHT = 1920;

    canvas.width = VIRTUAL_WIDTH;
    canvas.height = VIRTUAL_HEIGHT;

    // Responsive Canvas Resize keeping 1080:1920 aspect ratio
    function resizeCanvas() {
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        
        const targetRatio = VIRTUAL_WIDTH / VIRTUAL_HEIGHT; // 9:16 (~0.5625)
        const windowRatio = windowWidth / windowHeight;

        let displayWidth, displayHeight;

        if (windowRatio > targetRatio) {
            // Window is wider than 9:16 -> fit to height
            displayHeight = windowHeight;
            displayWidth = Math.round(windowHeight * targetRatio);
        } else {
            // Window is taller than 9:16 -> fit to width
            displayWidth = windowWidth;
            displayHeight = Math.round(windowWidth / targetRatio);
        }

        canvas.style.width = `${displayWidth}px`;
        canvas.style.height = `${displayHeight}px`;
    }

    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('orientationchange', () => {
        setTimeout(resizeCanvas, 100);
    });
    resizeCanvas();

    // Boot C3 Runtime
    console.log('Initializing Construct 3 Runtime (1080x1920)...');
    window.c3RuntimeInstance = new window.C3Runtime('c3canvas');
});

