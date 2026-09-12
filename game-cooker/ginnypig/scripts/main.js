/**
 * main.js - Application Entry Point & Responsive Canvas Scaler
 * Maps pointer events and keyboard inputs to player piggy movement.
 */

window.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');

    // Logical dimensions: 1080w x 1920h
    const LOGICAL_WIDTH = 1080;
    const LOGICAL_HEIGHT = 1920;

    canvas.width = LOGICAL_WIDTH;
    canvas.height = LOGICAL_HEIGHT;

    const game = new CoinGame(canvas);

    // Responsive Canvas Resizer (Letterbox & Auto-fit)
    function resizeCanvas() {
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;

        const targetAspect = LOGICAL_WIDTH / LOGICAL_HEIGHT;
        const windowAspect = windowWidth / windowHeight;

        let renderWidth, renderHeight;

        if (windowAspect < targetAspect) {
            renderWidth = windowWidth;
            renderHeight = windowWidth / targetAspect;
        } else {
            renderHeight = windowHeight;
            renderWidth = windowHeight * targetAspect;
        }

        canvas.style.width = `${Math.floor(renderWidth)}px`;
        canvas.style.height = `${Math.floor(renderHeight)}px`;
    }

    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('orientationchange', resizeCanvas);
    resizeCanvas();

    // Map screen/client coordinates to 1080x1920 logical space
    function getCanvasCoords(e) {
        const rect = canvas.getBoundingClientRect();
        const clientX = e.clientX !== undefined ? e.clientX : (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
        const clientY = e.clientY !== undefined ? e.clientY : (e.touches && e.touches[0] ? e.touches[0].clientY : 0);

        const px = (clientX - rect.left) * (LOGICAL_WIDTH / rect.width);
        const py = (clientY - rect.top) * (LOGICAL_HEIGHT / rect.height);

        return { px, py };
    }

    // Pointer Input Listeners
    canvas.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        try { canvas.setPointerCapture(e.pointerId); } catch (err) {}
        const { px, py } = getCanvasCoords(e);
        game.onPointerDown(px, py);
    });

    canvas.addEventListener('pointermove', (e) => {
        e.preventDefault();
        const { px, py } = getCanvasCoords(e);
        game.onPointerMove(px, py);
    });

    canvas.addEventListener('pointerup', (e) => {
        e.preventDefault();
        try { canvas.releasePointerCapture(e.pointerId); } catch (err) {}
        game.onPointerUp();
    });

    canvas.addEventListener('pointercancel', (e) => {
        e.preventDefault();
        game.onPointerUp();
    });

    // Keyboard controls for desktop
    const keys = {};
    window.addEventListener('keydown', (e) => {
        keys[e.code] = true;
    });
    window.addEventListener('keyup', (e) => {
        keys[e.code] = false;
    });

    function handleKeyboard() {
        if (keys['ArrowLeft'] || keys['KeyA']) {
            game.moveByKeyboard(-35);
        }
        if (keys['ArrowRight'] || keys['KeyD']) {
            game.moveByKeyboard(35);
        }
        requestAnimationFrame(handleKeyboard);
    }
    requestAnimationFrame(handleKeyboard);

    // Prevent default touch scrolling
    document.addEventListener('touchmove', (e) => {
        if (e.target === canvas) {
            e.preventDefault();
        }
    }, { passive: false });

    // Start Game Loop
    game.startLoop();

    console.log('[PiggyBank Catcher] Initialized at 1080x1920 logical resolution.');
});
