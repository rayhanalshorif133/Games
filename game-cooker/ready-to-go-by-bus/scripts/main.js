// Ready to Go by Bus - Main Application & Input Orchestrator
// Coordinates Construct 3 runtime, game loop, input projection, and UI interactions

window.runOnStartup(async (runtime) => {
    const canvas = runtime.canvas;
    const engine = new GameEngine();
    const renderer = new GameRenderer(canvas, engine);

    // Initialize Audio & Engine data
    await engine.loadGameData();
    await renderer.preloadImages();

    // Hide Construct 3 loading screen
    runtime.hideLoader();

    // Input Handling
    function handlePointerDown(e) {
        e.preventDefault();

        // Unlock Web Audio context on user gesture
        engine.audio.ensureContext();

        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        const pt = runtime.screenToLayout(clientX, clientY);

        // 1. Dialog clicks
        if (engine.state === 'LEVEL_WIN') {
            // "NEXT LEVEL" button click
            if (pt.x >= 280 && pt.x <= 800 && pt.y >= 1220 && pt.y <= 1340) {
                const nextLvl = (engine.level % 2) + 1;
                engine.startLevel(nextLvl);
            }
            return;
        }

        if (engine.state === 'GAME_OVER') {
            // "TRY AGAIN" button click
            if (pt.x >= 280 && pt.x <= 800 && pt.y >= 1220 && pt.y <= 1340) {
                engine.startLevel(engine.level);
            }
            return;
        }

        // 2. Top HUD buttons
        // Pause Button (960, 25, 80x80)
        if (pt.x >= 940 && pt.x <= 1060 && pt.y >= 10 && pt.y <= 120) {
            engine.state = (engine.state === 'PAUSED') ? 'PLAYING' : 'PAUSED';
            return;
        }

        // Sound Button (860, 25, 80x80)
        if (pt.x >= 840 && pt.x <= 940 && pt.y >= 10 && pt.y <= 120) {
            engine.audio.toggleMute();
            return;
        }

        // 3. Bottom Booster Dock
        const boosterY = 1730;
        if (pt.y >= 1640 && pt.y <= 1860) {
            if (Math.abs(pt.x - 130) < 100) {
                engine.useRefresh();
                return;
            }
            if (Math.abs(pt.x - 390) < 100) {
                engine.useVipCar();
                return;
            }
            if (Math.abs(pt.x - 650) < 100) {
                engine.useSort();
                return;
            }
            if (Math.abs(pt.x - 910) < 100) {
                engine.useUTurn();
                return;
            }
        }

        // 4. Locked Bay Slots (Tap to unlock)
        for (const bay of engine.bays) {
            if (!bay.unlocked) {
                const distBay = Math.hypot(pt.x - bay.x, pt.y - bay.y);
                if (distBay < 80) {
                    engine.unlockBay(bay.index);
                    return;
                }
            }
        }

        // 5. Vehicles on the grid
        // Find closest vehicle under pointer (checking from top down)
        let clickedVehicle = null;
        let minDist = 9999;

        for (let i = engine.vehicles.length - 1; i >= 0; i--) {
            const v = engine.vehicles[i];
            if (v.state === 'REMOVED' || v.state === 'DEPARTING' || v.state === 'DRIVING_EXIT') continue;

            const dist = Math.hypot(pt.x - v.x, pt.y - v.y);
            const hitRadius = (v.length + v.width) * 0.35;

            if (dist < hitRadius && dist < minDist) {
                minDist = dist;
                clickedVehicle = v;
            }
        }

        if (clickedVehicle) {
            engine.handleVehicleClick(clickedVehicle);
        }
    }

    canvas.addEventListener('mousedown', handlePointerDown);
    canvas.addEventListener('touchstart', handlePointerDown, { passive: false });

    // Game loop
    let lastTime = performance.now();

    function loop(now) {
        const dt = Math.min(0.05, (now - lastTime) / 1000);
        lastTime = now;

        engine.update(dt);
        renderer.render(dt);

        requestAnimationFrame(loop);
    }

    requestAnimationFrame(loop);
});
