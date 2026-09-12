/**
 * scripts/main.js - Construct 3 Application Entry Point & Responsive Canvas Resizer
 * Auto-fits and letterboxes 1080x1920 logical canvas to any mobile/desktop viewport,
 * maps pointer and keyboard inputs to game actions, and boots the engine.
 */

window.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas') || document.getElementById('game-canvas');
    if (!canvas) {
        console.error('[Main] Canvas element not found!');
        return;
    }

    // Logical dimensions (Construct 3 project default: 1080w x 1920h)
    const LOGICAL_WIDTH = 1080;
    const LOGICAL_HEIGHT = 1920;

    canvas.width = LOGICAL_WIDTH;
    canvas.height = LOGICAL_HEIGHT;

    // Instantiate Tower Game
    const game = new TowerGame(canvas);

    // ==========================================
    // RESPONSIVE CANVAS RESIZER (Letterbox & Fit)
    // ==========================================
    function resizeCanvas() {
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;

        const targetAspect = LOGICAL_WIDTH / LOGICAL_HEIGHT; // 9:16 = 0.5625
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

    // ==========================================
    // UNIFIED INPUT HANDLING
    // ==========================================
    function handleUserDrop(e) {
        // If target is a button or overlay, let the specific element handle it
        if (e && e.target && (e.target.closest('button') || e.target.closest('.overlay-card'))) {
            return;
        }

        if (e && e.preventDefault) {
            e.preventDefault();
        }

        // Unlock audio context on user gesture
        if (game.sound) {
            game.sound.unlockAudio();
        }

        if (game.state === 'PLAYING') {
            game.triggerDrop();
        } else if (game.state === 'GAMEOVER' && Date.now() >= game.dropCooldownUntil) {
            game.startGame();
        }
    }

    // Canvas Pointer Listener (Works for mouse, stylus, and touch)
    canvas.addEventListener('pointerdown', handleUserDrop);

    // Document fallback for tap anywhere outside canvas
    document.addEventListener('pointerdown', (e) => {
        // Ignore clicks on HUD buttons or overlay cards
        if (e.target.closest('button') || e.target.closest('.overlay-card')) {
            return;
        }
        handleUserDrop(e);
    });

    // Keyboard Listeners
    window.addEventListener('keydown', (e) => {
        if (e.code === 'Space' || e.code === 'Enter' || e.code === 'ArrowUp' || e.code === 'KeyW') {
            e.preventDefault();
            handleUserDrop(e);
        }
    });

    // Prevent pull-to-refresh and bouncing on mobile
    document.addEventListener('touchmove', (e) => {
        if (e.target === canvas || e.target.closest('#gameContainer') || e.target.closest('#game-wrapper')) {
            e.preventDefault();
        }
    }, { passive: false });

    // Start Game Loop
    game.startLoop();

    console.log('[Construct 3 Engine] Tower Stacker initialized at 1080x1920 logical resolution.');
});

