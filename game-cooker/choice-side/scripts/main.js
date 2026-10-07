/**
 * Main Entry Point for Choice Side (Construct 3 Build)
 * Initializes game engine and binds viewport resizing
 */

'use strict';

window.runOnStartup(function() {
    console.log("Choice Side: Construct 3 runtime initialized.");

    // Instantiate game
    const game = new Game();
    window.gameInstance = game;

    // Viewport and container responsive scaling
    function resizeApp() {
        const container = document.getElementById('c3-app-container');
        if (!container) return;

        const winW = window.innerWidth;
        const winH = window.innerHeight;
        const targetAspect = 1080 / 1920;
        const winAspect = winW / winH;

        if (winAspect > targetAspect) {
            // Window is wider than 9:16 -> fit to height
            const h = winH;
            const w = h * targetAspect;
            container.style.width = `${w}px`;
            container.style.height = `${h}px`;
        } else {
            // Window is narrower than 9:16 -> fit to width
            const w = winW;
            const h = w / targetAspect;
            container.style.width = `${w}px`;
            container.style.height = `${h}px`;
        }
    }

    window.addEventListener('resize', resizeApp);
    window.addEventListener('orientationchange', resizeApp);
    resizeApp();

    // Start game initialization and asset loading
    game.init();
});

