/**
 * Click to Survive - Main Game Controller
 * Core gameplay loop, difficulty mutation scaling, timer, click detection, win/loss states.
 */

class ClickToSurviveGame {
    constructor() {
        this.state = 'MENU'; // 'MENU', 'PLAYING', 'PAUSED', 'BSOD', 'VICTORY'
        this.score = 0;
        this.misclicks = 0;
        this.totalClicks = 0;
        this.highScore = window.scoreAPI ? window.scoreAPI.getHighScore() : parseInt(localStorage.getItem('dont_misclick_highscore') || '0', 10);
        this.timeRemaining = 180; // 3 minutes in seconds
        this.maxWindows = 35; // Overload limit leading to BSOD
        
        this.currentPhase = 0;
        this.spawnTimer = null;
        this.gameTickTimer = null;
        this.lastFrameTime = performance.now();

        // Interactive AI Tutorial State
        this.inTutorial = false;
        this.tutorialStep = 0;
        this.tutorialTotal = 3;
        this.combo = 0;

        // Containers
        this.stage = document.getElementById('game-stage');
        this.windowContainer = document.getElementById('window-container');
        this.desktopArea = document.getElementById('desktop-area');

        // Subsystems
        this.windowManager = new WindowManager(
            this.windowContainer,
            (id, stageX, stageY) => this.handleWindowClosed(id, stageX, stageY),
            (clientX, clientY, winEl) => {
                const coords = this.toStageCoords(clientX, clientY);
                this.handleMisclick(coords.x, coords.y);
            }
        );
        this.ui = new UIManager(this);

        this.bindEvents();
        this.ui.updateHUD(this.score, this.highScore, this.timeRemaining, 0, this.maxWindows);
    }

    toStageCoords(clientX, clientY) {
        const rect = this.stage.getBoundingClientRect();
        const scaleX = 1080 / rect.width;
        const scaleY = 1920 / rect.height;
        return {
            x: (clientX - rect.left) * scaleX,
            y: (clientY - rect.top) * scaleY
        };
    }

    bindEvents() {
        // Desktop / background misclick
        this.desktopArea.addEventListener('pointerdown', (e) => {
            if (this.state !== 'PLAYING') return;
            // Misclick if clicking directly on the desktop background
            if (e.target === this.desktopArea || e.target.classList.contains('desktop-icon') || e.target.closest('.desktop-icon')) {
                const coords = this.toStageCoords(e.clientX, e.clientY);
                this.handleMisclick(coords.x, coords.y);
            }
        });

        // UI buttons
        const startBtn = document.getElementById('btn-start-game');
        if (startBtn) startBtn.addEventListener('click', () => this.startGame());

        const bsodRetryBtn = document.getElementById('btn-bsod-retry');
        if (bsodRetryBtn) bsodRetryBtn.addEventListener('click', () => this.startGame());

        const winRetryBtn = document.getElementById('btn-win-retry');
        if (winRetryBtn) winRetryBtn.addEventListener('click', () => this.startGame());

        // Windows 11 Top HUD Close Button
        const hudCloseBtn = document.getElementById('hud-btn-close');
        if (hudCloseBtn) {
            hudCloseBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (window.sound) window.sound.playClose();
                this.togglePause();
            });
        }

        // Start button in retro taskbar
        const taskbarStart = document.getElementById('taskbar-start-btn');
        if (taskbarStart) {
            taskbarStart.addEventListener('click', () => {
                if (window.sound) window.sound.playClose();
                const menuModal = document.getElementById('screen-menu');
                if (this.state === 'PLAYING') {
                    // Pause/resume toggle
                    this.togglePause();
                } else if (this.state === 'MENU') {
                    this.startGame();
                }
            });
        }

        // Sound Toggle Button in taskbar
        const muteBtn = document.getElementById('taskbar-mute-btn');
        if (muteBtn) {
            muteBtn.addEventListener('click', () => {
                if (!window.sound) return;
                window.sound.init();
                const isMuted = !window.sound.muted;
                window.sound.setMuted(isMuted);
                muteBtn.textContent = isMuted ? '🔇' : '🔊';
                muteBtn.title = isMuted ? 'Unmute Audio' : 'Mute Audio';
            });
        }

        // BGM Music Toggle Button in taskbar
        const musicBtn = document.getElementById('taskbar-music-btn');
        if (musicBtn) {
            musicBtn.addEventListener('click', () => {
                if (!window.sound) return;
                window.sound.init();
                const playing = window.sound.toggleBgm();
                musicBtn.classList.toggle('active', playing);
                musicBtn.title = playing ? 'Stop Retro BGM' : 'Play Retro BGM';
            });
        }

        // Window resize letterbox handler
        window.addEventListener('resize', () => this.resizeViewport());
        this.resizeViewport();
    }

    resizeViewport() {
        const wrapper = document.getElementById('game-wrapper');
        if (!wrapper || !this.stage) return;
        
        const winW = window.innerWidth;
        const winH = window.innerHeight;
        const targetRatio = 1080 / 1920;
        const currentRatio = winW / winH;

        let scale;
        if (currentRatio < targetRatio) {
            scale = winW / 1080;
        } else {
            scale = winH / 1920;
        }

        this.stage.style.transform = `scale(${scale})`;
    }

    startGame() {
        if (window.sound) {
            window.sound.init();
            window.sound.playClose();
        }

        this.state = 'PLAYING';
        this.score = 0;
        this.misclicks = 0;
        this.totalClicks = 0;
        this.combo = 0;
        this.timeRemaining = 180;
        this.currentPhase = 0;

        // Reset scales
        this.windowManager.clear();
        this.windowManager.setWindowScale(1.0);
        this.ui.setCursorScale(1.0);

        // Hide screens
        document.getElementById('screen-menu').classList.remove('active');
        document.getElementById('screen-bsod').classList.remove('active');
        document.getElementById('screen-victory').classList.remove('active');

        // Check if player has already completed tutorial via cookie
        const tutorialDone = window.CookieUtil && window.CookieUtil.get('dont_misclick_tutorial_done') === 'true';

        if (!tutorialDone) {
            // First time player: Launch 3-step AI Hand interactive tutorial!
            this.inTutorial = true;
            this.tutorialStep = 1;
            this.spawnTutorialStep(1);
        } else {
            this.inTutorial = false;
            this.ui.hideTutorialHand();
            // Regular game start: spawn initial batch of 3 windows
            for (let i = 0; i < 3; i++) {
                this.windowManager.spawn({
                    x: 100 + (i * 150),
                    y: 340 + (i * 280)
                });
            }
            this.scheduleNextSpawn();
        }

        this.ui.updateHUD(this.score, this.highScore, this.timeRemaining, this.windowManager.count(), this.maxWindows);

        // Start timers
        this.startTimers();
        this.lastFrameTime = performance.now();
        requestAnimationFrame((t) => this.gameLoop(t));
    }

    spawnTutorialStep(step) {
        this.windowManager.clear();
        let targetX = 220;
        let targetY = 520;
        if (step === 2) {
            targetX = 140;
            targetY = 740;
        } else if (step === 3) {
            targetX = 240;
            targetY = 460;
        }

        const winObj = this.windowManager.spawn({
            x: targetX,
            y: targetY,
            width: 600,
            height: 340
        });

        setTimeout(() => {
            if (winObj && winObj.closeBtn) {
                this.ui.showTutorialHand(winObj.closeBtn, step, this.tutorialTotal);
            }
        }, 80);
    }

    startTimers() {
        if (this.gameTickTimer) clearInterval(this.gameTickTimer);
        if (this.spawnTimer) clearInterval(this.spawnTimer);

        // 1-second countdown clock
        this.gameTickTimer = setInterval(() => {
            if (this.state !== 'PLAYING') return;

            this.timeRemaining--;

            // Warning ticks in last 30s
            if (this.timeRemaining <= 30 && this.timeRemaining > 0) {
                if (window.sound) window.sound.playTick();
            }

            // Time Over: Victory!
            if (this.timeRemaining <= 0) {
                this.handleVictory();
                return;
            }

            this.ui.updateHUD(this.score, this.highScore, this.timeRemaining, this.windowManager.count(), this.maxWindows);
        }, 1000);

        if (!this.inTutorial) {
            this.scheduleNextSpawn();
        }
    }

    getSpawnInterval() {
        // Dynamic spawn frequency based on score
        if (this.score < 30) return 2000;
        if (this.score < 50) return 1400;
        if (this.score < 100) return 1100;
        if (this.score < 150) return 850;
        return 650;
    }

    scheduleNextSpawn() {
        if (this.spawnTimer) clearTimeout(this.spawnTimer);
        if (this.state !== 'PLAYING' || this.inTutorial) return;

        const interval = this.getSpawnInterval();
        this.spawnTimer = setTimeout(() => {
            if (this.state === 'PLAYING' && !this.inTutorial) {
                const hardMode = this.score >= 50;
                this.windowManager.spawn({ hardMode });
                
                this.checkOverload();
                this.ui.updateHUD(this.score, this.highScore, this.timeRemaining, this.windowManager.count(), this.maxWindows);
                this.scheduleNextSpawn();
            }
        }, interval);
    }

    handleWindowClosed(id, stageX, stageY) {
        if (this.state !== 'PLAYING') return;

        this.score++;
        this.totalClicks++;
        this.combo++;

        if (window.sound) window.sound.playClose();

        // Show fun animated appreciation emoji badge on successful close
        if (stageX !== undefined && stageY !== undefined) {
            this.ui.showAppreciation(stageX, stageY, this.combo);
        }

        if (this.score > this.highScore) {
            this.highScore = this.score;
            if (window.scoreAPI) {
                window.scoreAPI.saveHighScore(this.highScore);
            } else {
                localStorage.setItem('dont_misclick_highscore', this.highScore.toString());
            }
        }

        this.ui.updateHUD(this.score, this.highScore, this.timeRemaining, this.windowManager.count(), this.maxWindows);

        // Check if currently in 3-step tutorial
        if (this.inTutorial) {
            this.tutorialStep++;
            if (this.tutorialStep <= this.tutorialTotal) {
                this.spawnTutorialStep(this.tutorialStep);
            } else {
                // Tutorial finished! Store in browser cookie!
                this.inTutorial = false;
                this.ui.hideTutorialHand();
                if (window.CookieUtil) {
                    window.CookieUtil.set('dont_misclick_tutorial_done', 'true', 365);
                }
                this.ui.showMutationAlert('🎉 TUTORIAL COMPLETE!', 'Survive 3 minutes without crashing!');
                // Spawn 2 regular windows to start main game
                for (let i = 0; i < 2; i++) {
                    this.windowManager.spawn({
                        x: 120 + (i * 180),
                        y: 360 + (i * 300)
                    });
                }
                this.scheduleNextSpawn();
            }
            return;
        }

        // Check difficulty thresholds & dynamic mutations
        this.evaluateMutations();

        // If all windows are cleared, reward the player by immediately spawning one new window so play continues
        if (this.windowManager.count() === 0) {
            this.windowManager.spawn();
            this.ui.updateHUD(this.score, this.highScore, this.timeRemaining, this.windowManager.count(), this.maxWindows);
        }
    }

    handleMisclick(x, y) {
        if (this.state !== 'PLAYING') return;

        this.misclicks++;
        this.totalClicks++;
        this.combo = 0; // Reset streak on misclick

        if (window.sound) {
            window.sound.playError();
            window.sound.playPenaltySpawn();
        }

        this.ui.triggerScreenShake();
        this.ui.triggerGlitchFlash();
        this.ui.showFloatingPenalty(x, y, '⚠️ MISCLICK! +5 POPUPS!');

        // Instantly spawn 5 windows penalty!
        this.windowManager.spawnMisclickPenalty(x, y, 5);

        // Update HUD and check overload
        setTimeout(() => {
            this.ui.updateHUD(this.score, this.highScore, this.timeRemaining, this.windowManager.count(), this.maxWindows);
            this.checkOverload();
        }, 180);
    }

    applyMutation(title, sub, cursorScale, windowScale) {
        if (window.sound) window.sound.playMutation();
        this.ui.showMutationAlert(title, sub);
        this.ui.setCursorScale(cursorScale);
        this.windowManager.setWindowScale(windowScale);
    }

    evaluateMutations() {
        if (this.score >= 50 && this.score < 75 && this.currentPhase !== 1) {
            this.currentPhase = 1;
            this.applyMutation('⚡ MEGACURSOR & MICRO-WINDOWS! ⚡', 'Huge cursor + tiny windows: Extreme precision required!', 3.2, 0.62);
        } else if (this.score >= 75 && this.score < 100 && this.currentPhase !== 2) {
            this.currentPhase = 2;
            this.applyMutation('⚡ NANOCURSOR & TITAN WINDOWS! ⚡', 'Tiny cursor + giant windows: Find the close button!', 0.42, 1.38);
        } else if (this.score >= 100 && this.score < 125 && this.currentPhase !== 3) {
            this.currentPhase = 3;
            this.applyMutation('⚡ HYPER MEGACURSOR & MICRO-WINDOWS! ⚡', 'Stage 3: Tiny close targets with massive cursor!', 3.6, 0.55);
        } else if (this.score >= 125 && this.score < 150 && this.currentPhase !== 4) {
            this.currentPhase = 4;
            this.applyMutation('⚡ MICRO-DOT CURSOR & TITAN WINDOWS! ⚡', 'Stage 4: Tiny dot cursor with massive popups!', 0.38, 1.45);
        } else if (this.score >= 150 && this.currentPhase !== 5) {
            this.currentPhase = 5;
            this.applyMutation('⚡ MAXIMUM OVERDRIVE! ⚡', 'Chaos Matrix activated! Rapid spawns!', 2.0, 0.85);
        }
    }

    checkOverload() {
        const count = this.windowManager.count();
        if (count >= this.maxWindows && this.state === 'PLAYING') {
            this.handleBSOD();
        }
    }

    handleBSOD() {
        this.state = 'BSOD';
        this.stopTimers();
        if (window.sound) window.sound.playCrash();

        const bsodScreen = document.getElementById('screen-bsod');
        const finalScoreEl = document.getElementById('bsod-score');
        const finalMisclicksEl = document.getElementById('bsod-misclicks');

        if (finalScoreEl) finalScoreEl.textContent = this.score;
        if (finalMisclicksEl) finalMisclicksEl.textContent = this.misclicks;
        if (bsodScreen) bsodScreen.classList.add('active');
    }

    handleVictory() {
        this.state = 'VICTORY';
        this.stopTimers();
        if (window.sound) window.sound.playVictory();

        const winScreen = document.getElementById('screen-victory');
        const winScoreEl = document.getElementById('win-score');
        const winMisclicksEl = document.getElementById('win-misclicks');
        const winAccEl = document.getElementById('win-accuracy');
        const winRankEl = document.getElementById('win-rank');

        const acc = this.totalClicks > 0 ? Math.max(0, Math.round((this.score / this.totalClicks) * 100)) : 100;
        let rank = 'D';
        if (this.score >= 140 && acc >= 80) rank = 'S';
        else if (this.score >= 100) rank = 'A';
        else if (this.score >= 70) rank = 'B';
        else if (this.score >= 40) rank = 'C';

        if (winScoreEl) winScoreEl.textContent = this.score;
        if (winMisclicksEl) winMisclicksEl.textContent = this.misclicks;
        if (winAccEl) winAccEl.textContent = `${acc}%`;
        if (winRankEl) winRankEl.textContent = rank;

        if (winScreen) winScreen.classList.add('active');
    }

    togglePause() {
        if (this.state === 'PLAYING') {
            this.state = 'PAUSED';
            this.stopTimers();
            this.ui.showMutationAlert('⏸️ PAUSED', 'Click Start in taskbar to resume');
        } else if (this.state === 'PAUSED') {
            this.state = 'PLAYING';
            this.startTimers();
            this.lastFrameTime = performance.now();
            requestAnimationFrame((t) => this.gameLoop(t));
        }
    }

    stopTimers() {
        if (this.gameTickTimer) clearInterval(this.gameTickTimer);
        if (this.spawnTimer) clearTimeout(this.spawnTimer);
        this.gameTickTimer = null;
        this.spawnTimer = null;
    }

    gameLoop(timestamp) {
        if (this.state !== 'PLAYING') return;

        const dt = (timestamp - this.lastFrameTime) / 1000;
        this.lastFrameTime = timestamp;

        this.windowManager.update(dt);

        requestAnimationFrame((t) => this.gameLoop(t));
    }
}

// Instantiate on DOM load
window.addEventListener('DOMContentLoaded', () => {
    window.game = new ClickToSurviveGame();
});
