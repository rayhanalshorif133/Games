/**
 * 2D Soccer Game Controller & State Machine
 */
class GameController {
    constructor() {
        this.state = 'MENU'; // MENU, LOBBY, COUNTDOWN, PLAYING, GOAL_PAUSE, GAME_OVER
        this.mode = 'multiplayer'; // multiplayer, ai, local
        this.p1Score = 0;
        this.p2Score = 0;
        this.p1Name = 'Player 1';
        this.p2Name = 'Player 2';
        this.matchTime = 0;
        this.isReady = false;
        this.isGoalPause = false;
        this.goalPauseTimer = 0;
        this.servingRole = 1;

        // AI properties
        this.aiTargetX = 376;
        this.aiTargetY = 244;
        this.aiReactionTimer = 0;
        this.aiSpeed = 6.5;

        // Input states
        this.keys = {};
        this.pointerP1 = { active: false, x: 376, y: 1100 };
        this.pointerP2 = { active: false, x: 376, y: 244 };

        this.setupNetworkHooks();
    }

    setupNetworkHooks() {
        const net = window.networkManager;
        if (!net) return;

        net.on('room_created', (data) => {
            this.p1Name = data.playerName || 'Player 1';
            this.p2Name = 'Waiting...';
            this.isReady = false;
            window.uiManager.updateLobbyView({
                roomCode: data.roomCode,
                role: 1,
                playerName: this.p1Name,
                hostReady: false,
                guestReady: false
            });
            window.uiManager.showScreen('lobby');
        });

        net.on('room_joined', (data) => {
            this.p1Name = data.hostName || 'Player 1';
            this.p2Name = data.playerName || 'Player 2';
            this.isReady = false;
            window.uiManager.updateLobbyView({
                roomCode: data.roomCode,
                role: 2,
                playerName: this.p2Name,
                hostName: this.p1Name,
                hostReady: data.hostReady,
                guestReady: data.guestReady
            });
            window.uiManager.showScreen('lobby');
        });

        net.on('opponent_joined', (data) => {
            this.p2Name = data.guestName;
            window.uiManager.updateLobbyView({
                role: 1,
                playerName: this.p1Name,
                guestName: this.p2Name,
                hostReady: data.hostReady,
                guestReady: data.guestReady
            });
        });

        net.on('ready_update', (data) => {
            window.uiManager.updateLobbyView({
                role: net.role,
                playerName: net.playerName,
                hostName: this.p1Name,
                guestName: this.p2Name,
                hostReady: data.hostReady,
                guestReady: data.guestReady
            });
        });

        net.on('match_start_countdown', (data) => {
            this.p1Name = data.hostName || 'Player 1';
            this.p2Name = data.guestName || 'Player 2';
            this.startMultiplayerMatch();
        });

        net.on('opponent_paddle', (data) => {
            const physics = window.physicsEngine;
            if (!physics) return;
            if (data.role === 1) {
                physics.p1.targetX = data.x;
                physics.p1.targetY = data.y;
            } else if (data.role === 2) {
                physics.p2.targetX = data.x;
                physics.p2.targetY = data.y;
            }
        });

        net.on('ball_state', (data) => {
            // Guest updates ball from host
            if (net.role === 2) {
                const b = window.physicsEngine.ball;
                // Interpolate to avoid snapping
                b.x = b.x * 0.3 + data.x * 0.7;
                b.y = b.y * 0.3 + data.y * 0.7;
                b.vx = data.vx;
                b.vy = data.vy;
                b.rotation = data.rotation;
                b.lastHitRole = data.lastHitBy;
            }
        });

        net.on('goal_event', (data) => {
            this.handleGoalScored(data.scorerRole, data.score, data.ballX, data.ballY);
        });

        net.on('game_over', (data) => {
            this.state = 'GAME_OVER';
            window.uiManager.showGameOver(data.winnerName, data.finalScore);
        });

        net.on('join_error', (msg) => {
            if (window.uiManager) {
                window.uiManager.join.errorMsg.innerText = msg;
            }
        });

        net.on('opponent_left', (msg) => {
            alert(msg || 'Opponent disconnected.');
            this.exitToMenu();
        });

        net.on('room_closed', (msg) => {
            alert(msg || 'Room was closed by the host.');
            this.exitToMenu();
        });

        net.on('ping_update', (ms) => {
            window.uiManager.updatePing(ms);
        });
    }

    toggleReady() {
        this.isReady = !this.isReady;
        if (window.networkManager) {
            window.networkManager.setReady(this.isReady);
        }
    }

    startMultiplayerMatch() {
        this.mode = 'multiplayer';
        this.state = 'COUNTDOWN';
        this.p1Score = 0;
        this.p2Score = 0;
        this.matchTime = 0;

        window.physicsEngine.resetPaddles();
        window.physicsEngine.resetBall(1);
        window.effectsManager.reset();

        window.uiManager.showScreen('game');
        window.uiManager.updateHUD(this.p1Name, this.p2Name, [0, 0], 0);

        window.uiManager.showCountdown(3, () => {
            this.state = 'PLAYING';
            if (window.audioManager) window.audioManager.playWhistle(false);
        });
    }

    startAIGame() {
        this.mode = 'ai';
        this.p1Name = 'Player 1';
        this.p2Name = 'AI Bot';
        this.p1Score = 0;
        this.p2Score = 0;
        this.matchTime = 0;
        this.state = 'COUNTDOWN';

        window.physicsEngine.resetPaddles();
        window.physicsEngine.resetBall(1);
        window.effectsManager.reset();

        window.uiManager.showScreen('game');
        window.uiManager.updateHUD(this.p1Name, this.p2Name, [0, 0], 0);

        window.uiManager.showCountdown(3, () => {
            this.state = 'PLAYING';
            if (window.audioManager) window.audioManager.playWhistle(false);
        });
    }

    startLocalGame() {
        this.mode = 'local';
        this.p1Name = 'Player 1 (WASD)';
        this.p2Name = 'Player 2 (ARROWS)';
        this.p1Score = 0;
        this.p2Score = 0;
        this.matchTime = 0;
        this.state = 'COUNTDOWN';

        window.physicsEngine.resetPaddles();
        window.physicsEngine.resetBall(1);
        window.effectsManager.reset();

        window.uiManager.showScreen('game');
        window.uiManager.updateHUD(this.p1Name, this.p2Name, [0, 0], 0);

        window.uiManager.showCountdown(3, () => {
            this.state = 'PLAYING';
            if (window.audioManager) window.audioManager.playWhistle(false);
        });
    }

    handleGoalScored(scorerRole, score, ballX, ballY) {
        this.p1Score = score[0];
        this.p2Score = score[1];
        this.isGoalPause = true;
        this.goalPauseTimer = 2.4;

        const isTopGoal = scorerRole === 1;
        const scorerName = scorerRole === 1 ? this.p1Name : this.p2Name;

        // Sounds and Celebrations
        if (window.audioManager) {
            window.audioManager.playWhistle(true);
            window.audioManager.playCheer(true);
        }
        if (window.effectsManager) {
            window.effectsManager.spawnGoalExplosion(ballY, isTopGoal, scorerRole, scorerName);
        }

        window.uiManager.updateHUD(this.p1Name, this.p2Name, score, this.matchTime);

        // Check if game won
        const WINNING_SCORE = 5;
        if (this.p1Score >= WINNING_SCORE || this.p2Score >= WINNING_SCORE) {
            setTimeout(() => {
                this.state = 'GAME_OVER';
                const winner = this.p1Score >= WINNING_SCORE ? this.p1Name : this.p2Name;
                window.uiManager.showGameOver(winner, [this.p1Score, this.p2Score]);
            }, 1800);
        }
    }

    handleRematch() {
        if (this.mode === 'multiplayer') {
            if (window.networkManager) {
                window.networkManager.requestRematch();
                window.networkManager.acceptRematch();
            }
        } else if (this.mode === 'ai') {
            this.startAIGame();
        } else {
            this.startLocalGame();
        }
    }

    exitToMenu() {
        this.state = 'MENU';
        if (window.networkManager) {
            window.networkManager.leaveRoom();
        }
        window.effectsManager.reset();
        window.uiManager.showScreen('menu');
    }

    // AI Bot Behavior: Proactive and always keeps the game moving!
    updateAI(dt) {
        const physics = window.physicsEngine;
        const b = physics.ball;
        const ai = physics.p2;

        this.aiReactionTimer -= dt;
        if (this.aiReactionTimer <= 0) {
            this.aiReactionTimer = 0.035; // Fast, responsive AI decision loop

            // If ball is on upper half or traveling toward AI, charge forward and strike!
            if (b.y < 720 || b.vy < 0) {
                // Predict ball X position on approach
                const timeToReach = Math.max(0.04, Math.abs(b.y - ai.y) / (Math.abs(b.vy) || 12));
                const predictedX = b.x + b.vx * Math.min(timeToReach, 0.45);

                // Slight offset to angle shots towards Player 1's goal corners
                const aimAngleOffset = (b.x < 376 ? 16 : -16);
                this.aiTargetX = predictedX + aimAngleOffset;

                // Aggressive forward lunge to strike the ball
                this.aiTargetY = Math.min(680, Math.max(200, b.y - 12));
            } else {
                // Ball in lower half: patrol defensively and anticipate return
                const anticipationX = b.x * 0.4 + 376 * 0.6;
                this.aiTargetX = anticipationX;
                this.aiTargetY = 244;
            }
        }

        // Clamp AI to upper pitch
        const clamped = physics.clampP2(this.aiTargetX, this.aiTargetY);
        ai.targetX = clamped.x;
        ai.targetY = clamped.y;
    }

    // Local 2-Player Keyboard update
    updateLocalKeyInputs(dt) {
        const physics = window.physicsEngine;
        const speed = 620 * dt;

        // P1 Controls (WASD or Arrow Keys)
        let p1X = physics.p1.targetX;
        let p1Y = physics.p1.targetY;
        if (this.keys['KeyA'] || this.keys['Keya']) p1X -= speed;
        if (this.keys['KeyD'] || this.keys['Keyd']) p1X += speed;
        if (this.keys['KeyW'] || this.keys['Keyw']) p1Y -= speed;
        if (this.keys['KeyS'] || this.keys['Keys']) p1Y += speed;

        const c1 = physics.clampP1(p1X, p1Y);
        physics.p1.targetX = c1.x;
        physics.p1.targetY = c1.y;

        // P2 Controls (Arrow Keys)
        let p2X = physics.p2.targetX;
        let p2Y = physics.p2.targetY;
        if (this.keys['ArrowLeft']) p2X -= speed;
        if (this.keys['ArrowRight']) p2X += speed;
        if (this.keys['ArrowUp']) p2Y -= speed;
        if (this.keys['ArrowDown']) p2Y += speed;

        const c2 = physics.clampP2(p2X, p2Y);
        physics.p2.targetX = c2.x;
        physics.p2.targetY = c2.y;
    }

    // Solo / Host Keyboard controls (Arrow or WASD for P1)
    updateSinglePlayerKeys(dt) {
        const physics = window.physicsEngine;
        const isGuest = this.mode === 'multiplayer' && window.networkManager?.role === 2;
        const speed = 640 * dt;

        if (isGuest) {
            // Guest controls P2 (Top)
            let x = physics.p2.targetX;
            let y = physics.p2.targetY;
            if (this.keys['ArrowLeft'] || this.keys['KeyA'] || this.keys['Keya']) x -= speed;
            if (this.keys['ArrowRight'] || this.keys['KeyD'] || this.keys['Keyd']) x += speed;
            if (this.keys['ArrowUp'] || this.keys['KeyW'] || this.keys['Keyw']) y -= speed;
            if (this.keys['ArrowDown'] || this.keys['KeyS'] || this.keys['Keys']) y += speed;

            const c = physics.clampP2(x, y);
            physics.p2.targetX = c.x;
            physics.p2.targetY = c.y;

            window.networkManager.sendPaddle(c.x, c.y);
        } else {
            // Host or Solo controls P1 (Bottom)
            let x = physics.p1.targetX;
            let y = physics.p1.targetY;
            if (this.keys['ArrowLeft'] || this.keys['KeyA'] || this.keys['Keya']) x -= speed;
            if (this.keys['ArrowRight'] || this.keys['KeyD'] || this.keys['Keyd']) x += speed;
            if (this.keys['ArrowUp'] || this.keys['KeyW'] || this.keys['Keyw']) y -= speed;
            if (this.keys['ArrowDown'] || this.keys['KeyS'] || this.keys['Keys']) y += speed;

            const c = physics.clampP1(x, y);
            physics.p1.targetX = c.x;
            physics.p1.targetY = c.y;

            if (this.mode === 'multiplayer' && window.networkManager) {
                window.networkManager.sendPaddle(c.x, c.y);
            }
        }
    }

    handlePointerInput(rawX, rawY, isTouch = false) {
        if (this.state !== 'PLAYING') return;
        const physics = window.physicsEngine;

        if (this.mode === 'local') {
            // If local mode, touch in top half moves P2, bottom half moves P1
            if (rawY < 672) {
                const c = physics.clampP2(rawX, rawY);
                physics.p2.targetX = c.x;
                physics.p2.targetY = c.y;
            } else {
                const c = physics.clampP1(rawX, rawY);
                physics.p1.targetX = c.x;
                physics.p1.targetY = c.y;
            }
            return;
        }

        if (this.mode === 'multiplayer') {
            const isGuest = window.networkManager?.role === 2;
            if (isGuest) {
                const c = physics.clampP2(rawX, rawY);
                physics.p2.targetX = c.x;
                physics.p2.targetY = c.y;
                window.networkManager.sendPaddle(c.x, c.y);
            } else {
                const c = physics.clampP1(rawX, rawY);
                physics.p1.targetX = c.x;
                physics.p1.targetY = c.y;
                window.networkManager.sendPaddle(c.x, c.y);
            }
            return;
        }

        // Solo vs AI
        const c = physics.clampP1(rawX, rawY);
        physics.p1.targetX = c.x;
        physics.p1.targetY = c.y;
    }

    update(dt) {
        if (this.state !== 'PLAYING' && this.state !== 'COUNTDOWN' && !this.isGoalPause) return;

        // Update match timer
        if (this.state === 'PLAYING') {
            this.matchTime += dt;
            window.uiManager.updateHUD(this.p1Name, this.p2Name, [this.p1Score, this.p2Score], this.matchTime);
        }

        // Handle Keyboard inputs
        if (this.mode === 'local') {
            this.updateLocalKeyInputs(dt);
        } else {
            this.updateSinglePlayerKeys(dt);
        }

        // Handle AI if in AI mode
        if (this.mode === 'ai' && this.state === 'PLAYING') {
            this.updateAI(dt);
        }

        // Update Goal Pause Timer
        if (this.isGoalPause) {
            this.goalPauseTimer -= dt;
            if (this.goalPauseTimer <= 0) {
                this.isGoalPause = false;
                const nextServer = this.servingRole === 1 ? 2 : 1;
                this.servingRole = nextServer;
                window.physicsEngine.resetPaddles();
                window.physicsEngine.resetBall(nextServer);
                if (window.audioManager) window.audioManager.playWhistle(false);
            }
        }

        // Update Physics (Host or Solo is authoritative)
        const isAuthoritative = this.mode !== 'multiplayer' || window.networkManager?.role === 1;

        if (isAuthoritative && this.state === 'PLAYING' && !this.isGoalPause) {
            const result = window.physicsEngine.update(dt);

            // Broadcast ball to guest in multiplayer
            if (this.mode === 'multiplayer' && window.networkManager?.role === 1) {
                window.networkManager.sendBall(window.physicsEngine.ball);
            }

            // Check goal
            if (result.scored) {
                const newScore = [
                    result.scorerRole === 1 ? this.p1Score + 1 : this.p1Score,
                    result.scorerRole === 2 ? this.p2Score + 1 : this.p2Score
                ];

                if (this.mode === 'multiplayer') {
                    window.networkManager.sendGoal(result.scorerRole, result.ballX, result.ballY);
                } else {
                    this.handleGoalScored(result.scorerRole, newScore, result.ballX, result.ballY);
                }
            }
        } else if (!isAuthoritative) {
            // Guest only updates paddles locally while waiting for ball sync
            window.physicsEngine.updatePaddles(dt);
        }

        // Update visual effects
        window.effectsManager.update(dt);
    }
}

window.gameController = new GameController();

