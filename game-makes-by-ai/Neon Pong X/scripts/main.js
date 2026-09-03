// Neon Pong X - Core Game Loop, State Controller, Cyber AI & Renderer
// Native Resolution: 1080 x 1920 (Portrait Aspect Ratio)

(function () {
    'use strict';

    // Canvas & Context
    const canvas = document.getElementById('c3canvas');
    const ctx = canvas.getContext('2d');

    // Logical dimensions
    const VIRTUAL_WIDTH = 1080;
    const VIRTUAL_HEIGHT = 1920;

    // Subsystems
    const audio = window.neonAudio;
    const particles = new window.NeonParticleSystem();
    const physics = new window.NeonPhysicsEngine(particles, audio);

    // Entities
    const player1 = new window.NeonPaddle(540, 1780, 240, 38, '#00f3ff', 'PLAYER 1');
    const player2 = new window.NeonPaddle(540, 140, 240, 38, '#ff007f', 'CYBER AI');

    // Game State
    const STATE = {
        MENU: 'MENU',
        PLAYING: 'PLAYING',
        ROUND_BREAK: 'ROUND_BREAK',
        PAUSED: 'PAUSED',
        GAME_OVER: 'GAME_OVER'
    };

    let currentState = STATE.MENU;
    let gameMode = '1P'; // '1P' or '2P'
    let difficulty = 'NORMAL'; // 'CASUAL', 'NORMAL', 'HARD', 'XTREME'
    let scoreP1 = 0;
    let scoreP2 = 0;
    const WINNING_SCORE = 7;
    let roundWinner = null;
    let roundTimer = 0;
    let lastTime = performance.now();
    let gridPulse = 0;

    // AI Configuration
    const AI_PROFILES = {
        CASUAL: { maxSpeed: 700, errorMargin: 65, prediction: 0.35, smashChance: 0.1 },
        NORMAL: { maxSpeed: 1150, errorMargin: 35, prediction: 0.75, smashChance: 0.3 },
        HARD: { maxSpeed: 1600, errorMargin: 15, prediction: 1.0, smashChance: 0.6 },
        XTREME: { maxSpeed: 2300, errorMargin: 0, prediction: 1.25, smashChance: 0.9 }
    };

    // Input States
    const keys = {};
    let touchP1Active = false;
    let touchP2Active = false;

    // Resize Handler for full-bleed crisp rendering
    function resizeCanvas() {
        // Maintain exact 1080x1920 internal buffer
        canvas.width = VIRTUAL_WIDTH;
        canvas.height = VIRTUAL_HEIGHT;
    }

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    // Controls: Keyboard
    window.addEventListener('keydown', (e) => {
        keys[e.code] = true;
        if (e.code === 'KeyP' || e.code === 'Escape') {
            togglePause();
        }
        if (e.code === 'KeyM') {
            audio.toggleMute();
            updateAudioButtonsUI();
        }
    });

    window.addEventListener('keyup', (e) => {
        keys[e.code] = false;
    });

    // Helper: Map Screen Coordinates to 1080x1920 Virtual Space
    function getCanvasCoordinates(clientX, clientY) {
        const rect = canvas.getBoundingClientRect();
        const scaleX = VIRTUAL_WIDTH / rect.width;
        const scaleY = VIRTUAL_HEIGHT / rect.height;
        return {
            x: (clientX - rect.left) * scaleX,
            y: (clientY - rect.top) * scaleY
        };
    }

    // Pointer / Mouse Tracking
    canvas.addEventListener('pointerdown', (e) => {
        canvas.setPointerCapture(e.pointerId);
        handlePointer(e);
        audio.init();
    });

    canvas.addEventListener('pointermove', (e) => {
        if (e.buttons > 0 || e.pointerType === 'touch') {
            handlePointer(e);
        }
    });

    function handlePointer(e) {
        const pos = getCanvasCoordinates(e.clientX, e.clientY);

        if (currentState === STATE.PLAYING || currentState === STATE.ROUND_BREAK) {
            if (gameMode === '2P') {
                // Split touch screen: top half controls P2, bottom half controls P1
                if (pos.y < VIRTUAL_HEIGHT / 2) {
                    player2.targetX = pos.x;
                } else {
                    player1.targetX = pos.x;
                }
            } else {
                // 1P Mode: Anywhere controls Player 1
                player1.targetX = pos.x;
            }
        }
    }

    // AI Logic Controller
    function updateAI(dt) {
        if (gameMode === '2P') return;

        const profile = AI_PROFILES[difficulty];
        
        // Find most dangerous ball heading towards AI
        let targetBall = null;
        let lowestY = -1;

        for (let i = 0; i < physics.balls.length; i++) {
            const b = physics.balls[i];
            if (b.vy < 0) { // Moving towards top
                if (!targetBall || b.y < lowestY) {
                    targetBall = b;
                    lowestY = b.y;
                }
            }
        }

        // If no ball moving towards AI, drift towards center
        if (!targetBall) {
            const centerTarget = 540;
            const diff = centerTarget - player2.x;
            player2.targetX = player2.x + Math.sign(diff) * Math.min(Math.abs(diff), profile.maxSpeed * 0.4 * dt);
            return;
        }

        // Trajectory prediction
        let predictedX = targetBall.x;
        if (profile.prediction > 0.5) {
            const timeToReach = Math.abs((player2.y - targetBall.y) / targetBall.vy);
            predictedX = targetBall.x + targetBall.vx * timeToReach * profile.prediction;

            // Bounce simulation for hard/xtreme
            if (predictedX < 35 || predictedX > 1045) {
                const courtW = 1010;
                let normalizedX = (predictedX - 35) % (courtW * 2);
                if (normalizedX < 0) normalizedX += courtW * 2;
                if (normalizedX > courtW) normalizedX = courtW * 2 - normalizedX;
                predictedX = 35 + normalizedX;
            }
        }

        // Deliberate smash angle offset
        if (Math.random() < profile.smashChance) {
            predictedX += (Math.random() - 0.5) * 80;
        }

        // Clamp & move with speed limit
        const moveDiff = predictedX - player2.x;
        const maxStep = profile.maxSpeed * dt;
        player2.targetX = player2.x + Math.sign(moveDiff) * Math.min(Math.abs(moveDiff), maxStep);
    }

    // Keyboard Movement Update
    function updateKeyboard(dt) {
        const p1Speed = 1650 * dt;
        if (keys['ArrowLeft'] || keys['KeyA']) {
            player1.targetX = Math.max(35 + player1.width / 2, player1.x - p1Speed);
        }
        if (keys['ArrowRight'] || keys['KeyD']) {
            player1.targetX = Math.min(1045 - player1.width / 2, player1.x + p1Speed);
        }

        if (gameMode === '2P') {
            const p2Speed = 1650 * dt;
            if (keys['KeyJ'] || keys['Numpad4']) {
                player2.targetX = Math.max(35 + player2.width / 2, player2.x - p2Speed);
            }
            if (keys['KeyL'] || keys['Numpad6']) {
                player2.targetX = Math.min(1045 - player2.width / 2, player2.x + p2Speed);
            }
        }
    }

    // Scoring Handler
    function handleScore(scorer, x, y) {
        if (scorer === 'player') {
            scoreP1++;
            roundWinner = 'PLAYER 1';
            audio.playScore(true);
            particles.emitGoalExplosion(x, y, '#00f3ff', '#ffffff', 80);
        } else {
            scoreP2++;
            roundWinner = gameMode === '2P' ? 'PLAYER 2' : 'CYBER AI';
            audio.playScore(false);
            particles.emitGoalExplosion(x, y, '#ff007f', '#ffffff', 80);
        }

        physics.balls = [];
        physics.powerups = [];
        physics.rallyCount = 0;

        // Check Match Over
        if (scoreP1 >= WINNING_SCORE || scoreP2 >= WINNING_SCORE) {
            currentState = STATE.GAME_OVER;
            showGameOverUI();
        } else {
            currentState = STATE.ROUND_BREAK;
            roundTimer = 1.4; // 1.4s countdown before next serve
        }
    }

    // Start New Game
    function startNewGame() {
        scoreP1 = 0;
        scoreP2 = 0;
        player1.x = 540;
        player1.targetX = 540;
        player1.width = player1.baseWidth;
        player1.hasShield = false;

        player2.x = 540;
        player2.targetX = 540;
        player2.width = player2.baseWidth;
        player2.hasShield = false;
        player2.label = gameMode === '2P' ? 'PLAYER 2' : 'CYBER AI';

        physics.balls = [];
        physics.powerups = [];
        physics.rallyCount = 0;

        audio.init();
        audio.startMusic();

        currentState = STATE.ROUND_BREAK;
        roundTimer = 1.0;
        roundWinner = null;

        hideAllMenus();
    }

    // Toggle Pause
    function togglePause() {
        if (currentState === STATE.PLAYING) {
            currentState = STATE.PAUSED;
            document.getElementById('pause-modal').classList.remove('hidden');
        } else if (currentState === STATE.PAUSED) {
            currentState = STATE.PLAYING;
            document.getElementById('pause-modal').classList.add('hidden');
        }
    }

    // Render Cyber Grid Background
    function renderBackground(ctx, dt) {
        ctx.fillStyle = '#050511';
        ctx.fillRect(0, 0, VIRTUAL_WIDTH, VIRTUAL_HEIGHT);

        gridPulse += dt * 2.0;

        // Perspective Floor Grid Lines
        ctx.save();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = '#00f3ff';
        ctx.globalAlpha = 0.08 + Math.sin(gridPulse) * 0.03;

        // Vertical lines
        const vStep = 72;
        for (let x = 35; x <= 1045; x += vStep) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, VIRTUAL_HEIGHT);
            ctx.stroke();
        }

        // Horizontal lines
        const hStep = 96;
        for (let y = 0; y <= VIRTUAL_HEIGHT; y += hStep) {
            ctx.beginPath();
            ctx.moveTo(35, y);
            ctx.lineTo(1045, y);
            ctx.stroke();
        }

        // Side Energy Rails (Glowing Court Boundaries)
        ctx.globalAlpha = 0.85;

        // Left Boundary (Cyan Glow)
        const leftGlow = 15 + physics.wallGlowLeft * 35;
        ctx.strokeStyle = physics.wallGlowLeft > 0 ? '#ffffff' : '#00f3ff';
        ctx.lineWidth = 6 + physics.wallGlowLeft * 6;
        ctx.shadowColor = '#00f3ff';
        ctx.shadowBlur = leftGlow;
        ctx.beginPath();
        ctx.moveTo(35, 0);
        ctx.lineTo(35, VIRTUAL_HEIGHT);
        ctx.stroke();

        // Right Boundary (Magenta Glow)
        const rightGlow = 15 + physics.wallGlowRight * 35;
        ctx.strokeStyle = physics.wallGlowRight > 0 ? '#ffffff' : '#ff007f';
        ctx.lineWidth = 6 + physics.wallGlowRight * 6;
        ctx.shadowColor = '#ff007f';
        ctx.shadowBlur = rightGlow;
        ctx.beginPath();
        ctx.moveTo(1045, 0);
        ctx.lineTo(1045, VIRTUAL_HEIGHT);
        ctx.stroke();

        // Center Net / Court Divider
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 4;
        ctx.setLineDash([20, 22]);
        ctx.shadowColor = '#00f3ff';
        ctx.shadowBlur = 18;
        ctx.globalAlpha = 0.5 + Math.sin(gridPulse * 1.5) * 0.2;
        ctx.beginPath();
        ctx.moveTo(35, 960);
        ctx.lineTo(1045, 960);
        ctx.stroke();
        ctx.setLineDash([]); // Reset line dash

        // Center Court Neon Ring
        ctx.strokeStyle = '#ff007f';
        ctx.lineWidth = 4;
        ctx.shadowColor = '#ff007f';
        ctx.shadowBlur = 24;
        ctx.globalAlpha = 0.35;
        ctx.beginPath();
        ctx.arc(540, 960, 160, 0, Math.PI * 2);
        ctx.stroke();

        ctx.restore();
    }

    // Render In-Game Score & HUD
    function renderHUD(ctx) {
        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // P2 Score (Top)
        ctx.font = '900 130px "Orbitron", sans-serif';
        ctx.fillStyle = '#ff007f';
        ctx.shadowColor = '#ff007f';
        ctx.shadowBlur = 30;
        ctx.globalAlpha = 0.45;
        ctx.fillText(scoreP2, 540, 800);

        // P1 Score (Bottom)
        ctx.fillStyle = '#00f3ff';
        ctx.shadowColor = '#00f3ff';
        ctx.shadowBlur = 30;
        ctx.fillText(scoreP1, 540, 1120);

        // Rally Counter in center
        if (physics.rallyCount > 2) {
            ctx.font = '700 28px "Orbitron", sans-serif';
            ctx.fillStyle = '#ffffff';
            ctx.shadowColor = '#00f3ff';
            ctx.shadowBlur = 15;
            ctx.globalAlpha = 0.85;
            ctx.fillText(`RALLY × ${physics.rallyCount}`, 540, 960);
        }

        // Round break countdown banner
        if (currentState === STATE.ROUND_BREAK) {
            ctx.font = '900 48px "Orbitron", sans-serif';
            ctx.fillStyle = roundWinner === 'PLAYER 1' ? '#00f3ff' : '#ff007f';
            ctx.shadowColor = ctx.fillStyle;
            ctx.shadowBlur = 30;
            ctx.globalAlpha = 0.95;
            const msg = roundWinner ? `${roundWinner} SCORED!` : 'READY!';
            ctx.fillText(msg, 540, 910);

            ctx.font = '700 36px "Orbitron", sans-serif';
            ctx.fillStyle = '#ffffff';
            ctx.shadowBlur = 15;
            ctx.fillText(`SERVE IN ${Math.ceil(roundTimer)}...`, 540, 1010);
        }

        ctx.restore();
    }

    // Main Game Loop (60/120 FPS requestAnimationFrame)
    function gameLoop(timestamp) {
        const dt = Math.min(0.033, (timestamp - lastTime) / 1000); // Clamped delta time
        lastTime = timestamp;

        // Apply screen shake / camera trauma
        const didTransform = particles.applyCameraTransform(ctx);

        // Render Background & Court
        renderBackground(ctx, dt);

        if (currentState === STATE.PLAYING) {
            updateKeyboard(dt);
            updateAI(dt);
            player1.update(dt);
            player2.update(dt);
            physics.update(dt, player1, player2, handleScore);
        } else if (currentState === STATE.ROUND_BREAK) {
            updateKeyboard(dt);
            player1.update(dt);
            player2.update(dt);
            roundTimer -= dt;
            if (roundTimer <= 0) {
                currentState = STATE.PLAYING;
                physics.spawnBall(roundWinner !== 'PLAYER 1');
            }
        }

        // Render Entities
        player2.render(ctx);
        player1.render(ctx);
        physics.render(ctx);
        particles.update(dt);
        particles.render(ctx);

        // Render HUD
        if (currentState === STATE.PLAYING || currentState === STATE.ROUND_BREAK) {
            renderHUD(ctx);
        }

        // Restore Camera Transform
        particles.restoreCameraTransform(ctx, didTransform);

        requestAnimationFrame(gameLoop);
    }

    // UI & DOM Hookups
    function hideAllMenus() {
        document.getElementById('start-menu').classList.add('hidden');
        document.getElementById('pause-modal').classList.add('hidden');
        document.getElementById('game-over-modal').classList.add('hidden');
    }

    function showGameOverUI() {
        const modal = document.getElementById('game-over-modal');
        const winnerText = document.getElementById('winner-announcement');
        const scoreText = document.getElementById('final-score-display');
        
        winnerText.textContent = scoreP1 >= WINNING_SCORE ? 'PLAYER 1 VICTORIOUS!' : (gameMode === '2P' ? 'PLAYER 2 WINS!' : 'CYBER AI PREVAILS!');
        winnerText.style.color = scoreP1 >= WINNING_SCORE ? '#00f3ff' : '#ff007f';
        scoreText.textContent = `${scoreP1} - ${scoreP2}`;
        modal.classList.remove('hidden');
    }

    function updateAudioButtonsUI() {
        const muteBtns = document.querySelectorAll('.btn-toggle-mute');
        muteBtns.forEach(btn => {
            btn.textContent = audio.isMuted ? 'UNMUTE AUDIO' : 'MUTE AUDIO';
        });
    }

    // DOM Event Listeners
    document.getElementById('btn-play-1p').addEventListener('click', () => {
        gameMode = '1P';
        audio.playButton();
        startNewGame();
    });

    document.getElementById('btn-play-2p').addEventListener('click', () => {
        gameMode = '2P';
        audio.playButton();
        startNewGame();
    });

    // Difficulty selector buttons
    const diffButtons = document.querySelectorAll('.diff-btn');
    diffButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            diffButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            difficulty = btn.dataset.diff;
            audio.playButton();
        });
    });

    // Pause Modal buttons
    document.getElementById('btn-resume').addEventListener('click', () => {
        audio.playButton();
        togglePause();
    });

    document.getElementById('btn-restart').addEventListener('click', () => {
        audio.playButton();
        startNewGame();
    });

    document.getElementById('btn-quit').addEventListener('click', () => {
        audio.playButton();
        currentState = STATE.MENU;
        audio.stopMusic();
        hideAllMenus();
        document.getElementById('start-menu').classList.remove('hidden');
    });

    // Game Over buttons
    document.getElementById('btn-play-again').addEventListener('click', () => {
        audio.playButton();
        startNewGame();
    });

    document.getElementById('btn-gameover-menu').addEventListener('click', () => {
        audio.playButton();
        currentState = STATE.MENU;
        audio.stopMusic();
        hideAllMenus();
        document.getElementById('start-menu').classList.remove('hidden');
    });

    // Audio & Mute toggles
    document.querySelectorAll('.btn-toggle-mute').forEach(btn => {
        btn.addEventListener('click', () => {
            audio.toggleMute();
            updateAudioButtonsUI();
        });
    });

    document.querySelectorAll('.btn-toggle-music').forEach(btn => {
        btn.addEventListener('click', () => {
            const isPlaying = audio.toggleMusic();
            btn.textContent = isPlaying ? 'MUTE BGM' : 'ENABLE BGM';
        });
    });

    // Pause Button in HUD
    document.getElementById('hud-pause-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        audio.playButton();
        togglePause();
    });

    // Prevent background scrolling on touch screens
    document.body.addEventListener('touchmove', (e) => {
        if (e.target === canvas) e.preventDefault();
    }, { passive: false });

    // Handle Tab Visibility (auto-pause on blur)
    document.addEventListener('visibilitychange', () => {
        if (document.hidden && currentState === STATE.PLAYING) {
            togglePause();
        }
    });

    // Start rendering
    requestAnimationFrame(gameLoop);
})();

