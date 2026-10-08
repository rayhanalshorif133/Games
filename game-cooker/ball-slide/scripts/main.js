/**
 * Ball Slide - Main Entry Point & Construct 3 Viewport Scaler
 * Handles virtual 1080 x 1920 canvas scaling, input transformation, and RAF loop.
 */

window.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('c3canvas');
    const container = document.getElementById('c3-app-container');
    const uiOverlay = document.getElementById('c3-ui-overlay');

    const LAYOUT_WIDTH = 1080;
    const LAYOUT_HEIGHT = 1920;

    let scale = 1;
    let offsetX = 0;
    let offsetY = 0;

    // Responsive Canvas & UI Scaler (Letterbox / Scale-to-fit maintaining 1080x1920)
    function resizeViewport() {
        const winW = window.innerWidth;
        const winH = window.innerHeight;

        const targetRatio = LAYOUT_WIDTH / LAYOUT_HEIGHT;
        const screenRatio = winW / winH;

        let canvasDisplayW, canvasDisplayH;

        if (screenRatio > targetRatio) {
            // Screen is wider than 9:16 (desktop / tablet)
            canvasDisplayH = winH;
            canvasDisplayW = winH * targetRatio;
        } else {
            // Screen is taller or mobile aspect
            canvasDisplayW = winW;
            canvasDisplayH = winW / targetRatio;
        }

        scale = canvasDisplayW / LAYOUT_WIDTH;
        offsetX = (winW - canvasDisplayW) / 2;
        offsetY = (winH - canvasDisplayH) / 2;

        // Apply style to canvas
        canvas.style.width = `${canvasDisplayW}px`;
        canvas.style.height = `${canvasDisplayH}px`;
        canvas.style.left = `${offsetX}px`;
        canvas.style.top = `${offsetY}px`;

        // Match UI Overlay exactly to canvas bounds
        if (uiOverlay) {
            uiOverlay.style.width = `${canvasDisplayW}px`;
            uiOverlay.style.height = `${canvasDisplayH}px`;
            uiOverlay.style.left = `${offsetX}px`;
            uiOverlay.style.top = `${offsetY}px`;
            
            // Adjust rem / font scale based on resolution
            const baseFontSize = (canvasDisplayW / 1080) * 16;
            uiOverlay.style.fontSize = `${baseFontSize}px`;
        }
    }

    window.addEventListener('resize', resizeViewport);
    window.addEventListener('orientationchange', () => setTimeout(resizeViewport, 200));
    resizeViewport();

    // Initialize Game
    const game = new BallSlideGame(canvas);

    // Transform Screen Coordinates to 1080x1920 Game Coordinates
    function getGameCoords(clientX, clientY) {
        const rect = canvas.getBoundingClientRect();
        const x = (clientX - rect.left) * (LAYOUT_WIDTH / rect.width);
        const y = (clientY - rect.top) * (LAYOUT_HEIGHT / rect.height);
        return { x, y };
    }

    // Input Event Handling
    function handlePointerStart(clientX, clientY) {
        const coords = getGameCoords(clientX, clientY);
        game.input.pointerDown = true;
        game.input.isDragging = true;
        game.input.pointerX = coords.x;

        if (game.state === 'MENU') {
            game.startGame();
        }
    }

    function handlePointerMove(clientX, clientY) {
        if (!game.input.pointerDown) return;
        const coords = getGameCoords(clientX, clientY);
        game.input.pointerX = coords.x;
        game.input.isDragging = true;
    }

    function handlePointerEnd() {
        game.input.pointerDown = false;
        game.input.isDragging = false;
    }

    // Pointer Events (Mouse, Touch, Stylus unified)
    container.addEventListener('pointerdown', (e) => {
        // Prevent default touch dragging when touching controls or buttons
        if (e.target.closest('button') || e.target.closest('.control-btn') || e.target.closest('.skin-btn')) {
            return;
        }
        e.preventDefault();
        handlePointerStart(e.clientX, e.clientY);
    });

    window.addEventListener('pointermove', (e) => {
        handlePointerMove(e.clientX, e.clientY);
    });

    window.addEventListener('pointerup', handlePointerEnd);
    window.addEventListener('pointercancel', handlePointerEnd);

    // In-game Bottom Control Buttons (Left & Right)
    const btnLeft = document.getElementById('btn-control-left');
    const btnRight = document.getElementById('btn-control-right');

    function bindDirectionButton(btn, directionKey) {
        if (!btn) return;

        const press = (e) => {
            e.preventDefault();
            e.stopPropagation();
            game.input[directionKey] = true;
            btn.classList.add('pressed');
            if (btn.setPointerCapture && e.pointerId) {
                try { btn.setPointerCapture(e.pointerId); } catch (_) {}
            }
            if (game.state === 'MENU') {
                game.startGame();
            }
        };

        const release = (e) => {
            game.input[directionKey] = false;
            btn.classList.remove('pressed');
            if (btn.releasePointerCapture && e.pointerId) {
                try { btn.releasePointerCapture(e.pointerId); } catch (_) {}
            }
        };

        btn.addEventListener('pointerdown', press);
        btn.addEventListener('pointerup', release);
        btn.addEventListener('pointercancel', release);
        btn.addEventListener('pointerleave', release);
    }

    bindDirectionButton(btnLeft, 'btnLeft');
    bindDirectionButton(btnRight, 'btnRight');

    // Keyboard controls
    window.addEventListener('keydown', (e) => {
        if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
            game.input.keyLeft = true;
            if (game.state === 'MENU') game.startGame();
        } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
            game.input.keyRight = true;
            if (game.state === 'MENU') game.startGame();
        } else if (e.code === 'Space') {
            if (game.state === 'MENU') game.startGame();
            else if (game.state === 'GAMEOVER') game.startGame();
        }
    });

    window.addEventListener('keyup', (e) => {
        if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
            game.input.keyLeft = false;
        } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
            game.input.keyRight = false;
        }
    });

    // UI Buttons Binding
    const startPrompt = document.getElementById('start-prompt');
    if (startPrompt) {
        startPrompt.addEventListener('click', (e) => {
            e.stopPropagation();
            game.startGame();
        });
    }

    const replayBtn = document.getElementById('btn-replay');
    if (replayBtn) {
        replayBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            game.startGame();
        });
    }

    // Audio Toggle
    const audioBtn = document.getElementById('btn-audio-toggle');
    if (audioBtn) {
        const updateAudioBtnUI = () => {
            audioBtn.innerText = game.audio.enabled ? '🔊' : '🔇';
        };
        updateAudioBtnUI();
        audioBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            game.audio.toggleMute();
            updateAudioBtnUI();
        });
    }

    // Skin Buttons
    document.querySelectorAll('.skin-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const skin = btn.dataset.skin;
            game.setSkin(skin);
        });
    });

    // Initial skin active class
    const initialSkin = localStorage.getItem('ballslide_skin') || 'square';
    document.querySelectorAll('.skin-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.skin === initialSkin);
    });

    // Main Game Loop (Delta-timed 60+ FPS)
    let lastTime = performance.now();

    function gameLoop(now) {
        let dt = (now - lastTime) / 1000;
        lastTime = now;

        // Cap dt to prevent tunneling on frame drops / tab change
        if (dt > 0.1) dt = 0.1;

        game.update(dt);
        game.render();

        requestAnimationFrame(gameLoop);
    }

    requestAnimationFrame(gameLoop);
});

