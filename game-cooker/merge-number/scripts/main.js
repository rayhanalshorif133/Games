// Merge Numbers - Main Game Controller & Construct 3 Bootstrap
// Integrates C3 Runtime, Touch/Pointer Events, Game Loop, and Button Interactions

// ============================================================================
// GLOBAL COUNTDOWN TIMER (in seconds)
// Manually change this value anytime here or in browser console!
// Example: window.TIMER = 123; or window.TIMMER = 60;
// Any change automatically and immediately updates the live game timer.
// ============================================================================
window.TIMER = 34;
window.TIMMER = 34; // Alias matching user request

runOnStartup(async (runtime) => {
    console.log(`Construct 3 Runtime initialized (TIMER: ${window.TIMER}s, 1080x1920 portrait)`);

    const canvas = document.getElementById('c3canvas');
    const ctx = runtime.ctx;
    const game = window.game;
    const renderer = window.gameRenderer;
    const audio = window.audioManager;
    const particles = window.particleSystem;

    renderer.preloadAssets(() => {
        console.log('All 27 game assets loaded successfully');
        runtime.hideLoader();
    });

    function checkButtonClick(pos) {
        const btns = renderer.buttons;

        if (Math.hypot(pos.x - (btns.restart.x + btns.restart.size / 2), pos.y - (btns.restart.y + btns.restart.size / 2)) <= btns.restart.size / 2) {
            game.restart();
            return true;
        }

        if (Math.hypot(pos.x - (btns.sound.x + btns.sound.size / 2), pos.y - (btns.sound.y + btns.sound.size / 2)) <= btns.sound.size / 2) {
            audio.toggleMute();
            audio.playClick();
            return true;
        }

        if (Math.hypot(pos.x - (btns.shuffle.x + btns.shuffle.size / 2), pos.y - (btns.shuffle.y + btns.shuffle.size / 2)) <= btns.shuffle.size / 2) {
            game.shuffleBoard();
            return true;
        }

        if (Math.hypot(pos.x - (btns.undo.x + btns.undo.size / 2), pos.y - (btns.undo.y + btns.undo.size / 2)) <= btns.undo.size / 2) {
            game.undo();
            return true;
        }

        // Tap Best Score badge to reset previously inflated high score
        if (pos.x >= 300 && pos.x <= 520 && pos.y >= 56 && pos.y <= 166) {
            game.bestScore = 0;
            localStorage.removeItem('merge_numbers_best');
            particles.spawnFloatingText('RESET', 410, 110, '#e3278b', 38);
            audio.playClick();
            return true;
        }

        if (game.state === 'GAMEOVER') {
            const bPlay = btns.gameOverRestart;
            if (Math.abs(pos.x - bPlay.x) <= bPlay.width / 2 && Math.abs(pos.y - bPlay.y) <= bPlay.height / 2) {
                game.restart();
                return true;
            }

            const bShuf = btns.gameOverShuffle;
            if (Math.abs(pos.x - bShuf.x) <= bShuf.width / 2 && Math.abs(pos.y - bShuf.y) <= bShuf.height / 2) {
                game.shuffleBoard();
                game.state = 'IDLE';
                return true;
            }
        }

        return false;
    }

    canvas.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        const pos = runtime.screenToLayout(e.clientX, e.clientY);
        audio.ensureContext();

        if (checkButtonClick(pos)) return;

        if (game.state === 'IDLE') {
            game.handlePointerDown(pos.x, pos.y);
        }
    }, { passive: false });

    window.addEventListener('pointermove', (e) => {
        if (!game.isDragging) return;
        const pos = runtime.screenToLayout(e.clientX, e.clientY);
        game.handlePointerMove(pos.x, pos.y);
    }, { passive: false });

    window.addEventListener('pointerup', (e) => {
        if (game.isDragging) {
            game.handlePointerUp();
        }
    });

    window.addEventListener('pointercancel', (e) => {
        if (game.isDragging) {
            game.handlePointerUp();
        }
    });

    let lastTime = performance.now();

    function gameLoop(now) {
        const dt = Math.min(0.064, (now - lastTime) / 1000);
        lastTime = now;

        game.update(dt);
        particles.update(dt);

        ctx.clearRect(0, 0, runtime.layoutWidth, runtime.layoutHeight);
        renderer.render(ctx, game, particles);

        requestAnimationFrame(gameLoop);
    }

    requestAnimationFrame(gameLoop);
});
