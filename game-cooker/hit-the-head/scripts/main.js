/**
 * Construct 3 Main Bootstrap Script
 * Project: Hit The Head (1080 x 1920)
 */

(function() {
    'use strict';

    window.addEventListener('DOMContentLoaded', async () => {
        const canvas = document.getElementById('c2canvas');
        if (!canvas) {
            console.error("Canvas #c2canvas element not found.");
            return;
        }

        // Initialize runtime
        const runtime = new window.C3Runtime(canvas);
        window.c3_runtime = runtime;

        // Resize & Aspect Ratio Management
        function resizeCanvas() {
            const container = document.getElementById('c2canvasdiv');
            const targetWidth = 1080;
            const targetHeight = 1920;
            const targetAspect = targetWidth / targetHeight;

            const windowWidth = window.innerWidth;
            const windowHeight = window.innerHeight;
            const windowAspect = windowWidth / windowHeight;

            let renderWidth, renderHeight;

            if (windowAspect < targetAspect) {
                // Window is taller than 9:16 -> fit width
                renderWidth = windowWidth;
                renderHeight = windowWidth / targetAspect;
            } else {
                // Window is wider than 9:16 -> fit height
                renderHeight = windowHeight;
                renderWidth = windowHeight * targetAspect;
            }

            container.style.width = Math.round(renderWidth) + 'px';
            container.style.height = Math.round(renderHeight) + 'px';

            canvas.style.width = '100%';
            canvas.style.height = '100%';
        }

        window.addEventListener('resize', resizeCanvas);
        window.addEventListener('orientationchange', () => setTimeout(resizeCanvas, 150));
        resizeCanvas();

        // Load all assets
        console.log("Loading Construct 3 assets...");
        await runtime.loadAssets();
        console.log("Assets loaded. Starting game loop.");

        // Game Loop with high precision delta time
        let lastTime = performance.now();

        function gameLoop(now) {
            const dt = Math.min((now - lastTime) / 1000, 0.1); // clamp delta
            lastTime = now;

            runtime.update(dt);
            runtime.render();

            requestAnimationFrame(gameLoop);
        }

        requestAnimationFrame(gameLoop);
    });
})();

