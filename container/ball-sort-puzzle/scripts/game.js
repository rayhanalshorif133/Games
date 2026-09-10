/**
 * BALL SORT PUZZLE - Complete 2D Canvas Engine
 * Native Resolution: 1080 x 1920 (Portrait)
 * Rich 2D animations, squash & stretch, particle effects, animal companion, levels & sound
 */

(function () {
    'use strict';

    // --- CONFIGURATION & CONSTANTS ---
    const V_WIDTH = 1080;
    const V_HEIGHT = 1920;

    const BALL_COLORS_MAP = [
        { id: 0, key: 'ball_blue', name: 'Blue', color: '#2574c4' },
        { id: 1, key: 'ball_green', name: 'Green', color: '#4caf50' },
        { id: 2, key: 'ball_pink', name: 'Pink', color: '#e91e63' },
        { id: 3, key: 'ball_purple', name: 'Purple', color: '#7e3092' },
        { id: 4, key: 'ball_red', name: 'Red', color: '#f44336' },
        { id: 5, key: 'ball_orange', name: 'Orange', color: '#ff9800' }
    ];

    const CHARACTERS = [
        { id: 'beaver', name: 'Beaver', normal: 'char_beaver', dizzy: 'dizzy_beaver', avatar: 'avatar_beaver' },
        { id: 'fox', name: 'Fox', normal: 'char_fox', dizzy: 'dizzy_fox', avatar: 'avatar_fox' },
        { id: 'raccoon', name: 'Raccoon', normal: 'char_raccoon', dizzy: 'dizzy_raccoon', avatar: 'avatar_raccoon' },
        { id: 'cow', name: 'Cow', normal: 'char_cow', dizzy: 'dizzy_cow', avatar: 'avatar_cow' },
        { id: 'bear', name: 'Bear', normal: 'char_bear', dizzy: 'dizzy_bear', avatar: 'avatar_bear' },
        { id: 'horse', name: 'Horse', normal: 'char_horse', dizzy: 'dizzy_horse', avatar: 'avatar_horse' }
    ];

    // --- ASSET LOADER ---
    const ASSET_LIST = {
        tube: 'assets/tube.png',
        tube_overlay: 'assets/tube_overlay.png',
        ball_blue: 'assets/ball_blue.png',
        ball_green: 'assets/ball_green.png',
        ball_pink: 'assets/ball_pink.png',
        ball_purple: 'assets/ball_purple.png',
        ball_red: 'assets/ball_red.png',
        ball_orange: 'assets/ball_orange.png',

        char_beaver: 'assets/char_beaver.png',
        char_fox: 'assets/char_fox.png',
        char_raccoon: 'assets/char_raccoon.png',
        char_cow: 'assets/char_cow.png',
        char_bear: 'assets/char_bear.png',
        char_horse: 'assets/char_horse.png',

        dizzy_beaver: 'assets/dizzy_beaver.png',
        dizzy_fox: 'assets/dizzy_fox.png',
        dizzy_raccoon: 'assets/dizzy_raccoon.png',
        dizzy_cow: 'assets/dizzy_cow.png',
        dizzy_bear: 'assets/dizzy_bear.png',
        dizzy_horse: 'assets/dizzy_horse.png',

        avatar_beaver: 'assets/avatar_beaver.png',
        avatar_fox: 'assets/avatar_fox.png',
        avatar_raccoon: 'assets/avatar_raccoon.png',
        avatar_cow: 'assets/avatar_cow.png',
        avatar_bear: 'assets/avatar_bear.png',
        avatar_horse: 'assets/avatar_horse.png',

        btn_circle_back: 'assets/btn_circle_back.png',
        btn_circle_close: 'assets/btn_circle_close.png',
        coin_plus: 'assets/coin_plus.png',
        btn_settings: 'assets/btn_settings.png',

        icon_replay: 'assets/icon_replay.png',
        icon_undo: 'assets/icon_undo.png',
        icon_skip: 'assets/icon_skip.png',

        stars_full: 'assets/stars_full.png',
        stars_empty: 'assets/stars_empty.png',
        confetti: 'assets/confetti.png',

        wheel_full: 'assets/wheel_full.png',
        wheel_inner: 'assets/wheel_inner.png',
        btn_spin_green: 'assets/btn_spin_green.png',
        btn_quit_red: 'assets/btn_quit_red.png',

        btn_next: 'assets/btn_next.png',
        btn_quit: 'assets/btn_quit.png',
        btn_back: 'assets/btn_back.png',
        btn_play_green: 'assets/btn_play_green.png',

        logo_balls_sort: 'assets/logo_balls_sort.png',
        bubble_hi: 'assets/bubble_hi.png',

        block_happy_green: 'assets/block_happy_green.png',
        block_happy_white: 'assets/block_happy_white.png',
        badge_completed: 'assets/badge_completed.png',
        badge_locked: 'assets/badge_locked.png',
        badge_failed: 'assets/badge_failed.png',

        title_profile: 'assets/title_profile.png',
        toggle_on: 'assets/toggle_on.png',
        toggle_off: 'assets/toggle_off.png',
        icon_check: 'assets/icon_check.png',

        shop_awning: 'assets/shop_awning.png',
        coin_face: 'assets/coin_face.png',
        gold_bars: 'assets/gold_bars.png',
        chest: 'assets/chest.png',
        fox_best: 'assets/fox_best.png',
        raccoon_hot: 'assets/raccoon_hot.png',
        btn_free_coins: 'assets/btn_free_coins.png',
        btn_play_new: 'assets/btn_play_new.png',
        btn_round_play: 'assets/btn_round_play.png',
        char_beaver_wave: 'assets/char_beaver_wave.png',
        nav_shop: 'assets/nav_shop.png',
        nav_news: 'assets/nav_news.png',
        nav_wheel: 'assets/nav_wheel.png',
        nav_trophy: 'assets/nav_trophy.png',
        nav_crown: 'assets/nav_crown.png'
    };

    const assets = {};

    function preloadAssets(onProgress, onComplete) {
        const keys = Object.keys(ASSET_LIST);
        let loaded = 0;
        const total = keys.length;

        keys.forEach(key => {
            const img = new Image();
            img.src = ASSET_LIST[key];
            img.onload = () => {
                assets[key] = img;
                loaded++;
                onProgress(loaded / total);
                if (loaded === total) onComplete();
            };
            img.onerror = () => {
                console.warn('Failed loading asset:', key, ASSET_LIST[key]);
                loaded++;
                onProgress(loaded / total);
                if (loaded === total) onComplete();
            };
        });
    }

    // --- PARTICLE SYSTEM ---
    class ParticleSystem {
        constructor() {
            this.particles = [];
        }

        emitConfetti(x, y, count = 120) {
            const colors = ['#f44336', '#e91e63', '#9c27b0', '#2196f3', '#4caf50', '#ffeb3b', '#ff9800'];
            for (let i = 0; i < count; i++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = 12 + Math.random() * 28;
                this.particles.push({
                    type: 'confetti',
                    x: x + (Math.random() - 0.5) * 200,
                    y: y + (Math.random() - 0.5) * 100,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed - 16,
                    rotation: Math.random() * Math.PI * 2,
                    rotSpeed: (Math.random() - 0.5) * 0.3,
                    scaleX: 1,
                    scaleY: 1,
                    flipSpeed: 0.05 + Math.random() * 0.1,
                    w: 16 + Math.random() * 16,
                    h: 10 + Math.random() * 10,
                    color: colors[Math.floor(Math.random() * colors.length)],
                    alpha: 1,
                    decay: 0.003 + Math.random() * 0.004,
                    gravity: 0.45
                });
            }
        }

        emitSparkles(x, y, count = 25, color = '#ffeb3b') {
            for (let i = 0; i < count; i++) {
                const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.5;
                const speed = 8 + Math.random() * 18;
                this.particles.push({
                    type: 'sparkle',
                    x: x,
                    y: y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    size: 8 + Math.random() * 14,
                    color: color,
                    alpha: 1,
                    decay: 0.02 + Math.random() * 0.03,
                    gravity: 0.3
                });
            }
        }

        emitBubbles(x, y, count = 12, color = '#ffffff') {
            for (let i = 0; i < count; i++) {
                this.particles.push({
                    type: 'bubble',
                    x: x + (Math.random() - 0.5) * 60,
                    y: y + (Math.random() - 0.5) * 40,
                    vx: (Math.random() - 0.5) * 4,
                    vy: -2 - Math.random() * 6,
                    size: 6 + Math.random() * 12,
                    color: color,
                    alpha: 0.8,
                    decay: 0.025,
                    gravity: -0.05
                });
            }
        }

        update(dt) {
            for (let i = this.particles.length - 1; i >= 0; i--) {
                const p = this.particles[i];
                p.x += p.vx;
                p.y += p.vy;
                p.vy += p.gravity;
                p.alpha -= p.decay;

                if (p.type === 'confetti') {
                    p.rotation += p.rotSpeed;
                    p.scaleY = Math.sin(Date.now() * p.flipSpeed);
                }

                if (p.alpha <= 0 || p.y > V_HEIGHT + 100) {
                    this.particles.splice(i, 1);
                }
            }
        }

        draw(ctx) {
            for (const p of this.particles) {
                ctx.save();
                ctx.globalAlpha = Math.max(0, Math.min(1, p.alpha));

                if (p.type === 'confetti') {
                    ctx.translate(p.x, p.y);
                    ctx.rotate(p.rotation);
                    ctx.scale(p.scaleX, p.scaleY);
                    ctx.fillStyle = p.color;
                    ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
                } else if (p.type === 'sparkle') {
                    ctx.translate(p.x, p.y);
                    ctx.fillStyle = p.color;
                    // Draw 4-point star
                    ctx.beginPath();
                    const s = p.size;
                    ctx.moveTo(0, -s);
                    ctx.quadraticCurveTo(0, 0, s, 0);
                    ctx.quadraticCurveTo(0, 0, 0, s);
                    ctx.quadraticCurveTo(0, 0, -s, 0);
                    ctx.quadraticCurveTo(0, 0, 0, -s);
                    ctx.fill();
                } else if (p.type === 'bubble') {
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                    ctx.fillStyle = p.color;
                    ctx.fill();
                    // Rim
                    ctx.strokeStyle = '#ffffff';
                    ctx.lineWidth = 1.5;
                    ctx.stroke();
                }

                ctx.restore();
            }
        }
    }

    // --- GAME ENGINE ---
    class BallSortGame {
        constructor() {
            this.canvas = document.getElementById('game-canvas');
            this.ctx = this.canvas.getContext('2d');
            this.particles = new ParticleSystem();

            // Native canvas dimensions
            this.canvas.width = V_WIDTH;
            this.canvas.height = V_HEIGHT;

            // State management: HOME, PLAYING, PAUSED, LEVEL_WIN, LEVEL_SELECT, SPIN_WHEEL, PROFILE, SHOP, SETTINGS
            this.state = 'HOME';
            this.previousState = 'HOME';

            // User Persistent Data
            this.loadUserData();

            // Gameplay State
            this.currentLevel = this.userData.currentLevel || 1;
            this.tubes = []; // Array of arrays containing color IDs
            this.selectedTube = null; // Currently lifted ball index
            this.moveHistory = []; // Stack of moves { from, to, ball }

            // Active Ball Transfer Animation Queue
            this.activeBallAnims = [];
            this.tubeBounce = {}; // { tubeIndex: { scaleX, scaleY, velX, velY } }
            this.screenShake = 0;

            // UI Layout
            this.tubeLayouts = []; // Array of { x, y, width, height, slotX, slotY: [] }
            this.buttons = []; // Clickable rectangles for current screen

            // Companion Animal State
            this.companion = {
                charId: this.userData.selectedChar || 'beaver',
                x: 170,
                y: 1760,
                scaleX: 1,
                scaleY: 1,
                isDizzy: false,
                dizzyTimer: 0,
                jumpY: 0,
                jumpVel: 0,
                bubbleText: null,
                bubbleTimer: 0
            };

            // Level Complete UI State
            this.winStarsCount = 0;
            this.winStarsAnim = [0, 0, 0]; // scale for stars 1, 2, 3
            this.winAnimTimer = 0;

            // Wheel State
            this.wheel = {
                angle: 0,
                angularVel: 0,
                spinning: false,
                reward: null,
                rewardTimer: 0
            };

            // Level Select Tab
            this.currentCategoryIndex = 0;

            // Setup
            this.setupEventListeners();
            this.initLevel(this.currentLevel);
            // Default screen is HOME on startup
            this.state = 'HOME';

            // Start Main Loop
            this.lastTime = performance.now();
            requestAnimationFrame(this.gameLoop.bind(this));
        }

        get activeAnim() {
            return this.activeBallAnims && this.activeBallAnims.length > 0;
        }

        openSettingsModal() {
            window.soundManager.playClick();
            this.previousState = this.state;
            this.state = 'SETTINGS';
        }

        closeSettingsModal() {
            window.soundManager.playClick();
            this.state = (this.previousState && this.previousState !== 'SETTINGS') ? this.previousState : 'HOME';
        }

        loadUserData() {
            const def = {
                currentLevel: 1,
                highestUnlocked: 1,
                points: 0,
                selectedChar: 'beaver',
                stars: {}, // levelNum -> stars (1-3)
                completedLevels: []
            };
            try {
                const data = localStorage.getItem('bsp_userdata');
                this.userData = data ? Object.assign(def, JSON.parse(data)) : def;
                if (typeof this.userData.points !== 'number') {
                    this.userData.points = 0;
                }
            } catch (e) {
                this.userData = def;
            }
        }

        saveUserData() {
            try {
                localStorage.setItem('bsp_userdata', JSON.stringify(this.userData));
            } catch (e) { }
        }

        // --- LEVEL INITIALIZATION ---
        initLevel(lvlNum) {
            this.currentLevel = lvlNum;
            this.userData.currentLevel = lvlNum;
            if (lvlNum > this.userData.highestUnlocked) {
                this.userData.highestUnlocked = lvlNum;
            }
            this.saveUserData();

            const rawLevel = window.LevelManager.getLevel(lvlNum);
            this.tubes = JSON.parse(JSON.stringify(rawLevel));
            this.selectedTube = null;
            this.moveHistory = [];
            this.activeBallAnims = [];
            this.tubeBounce = {};
            this.extraTubeAdded = false;
            this.state = 'PLAYING';

            this.calculateTubeLayouts();

            // Companion cheers gently
            this.companion.isDizzy = false;
            this.companion.jumpVel = -8;

            // Check if level has hint available
            this.currentHint = null;
        }

        calculateTubeLayouts() {
            this.tubeLayouts = [];
            const numTubes = this.tubes.length;

            const TUBE_ORIGINAL_W = 193;
            const TUBE_ORIGINAL_H = 576;

            if (numTubes <= 5) {
                // Single Row
                const tubeScale = numTubes <= 4 ? 0.95 : 0.88;
                const tubeW = TUBE_ORIGINAL_W * tubeScale;
                const tubeH = TUBE_ORIGINAL_H * tubeScale;
                const spacing = (V_WIDTH - 120 - (numTubes * tubeW)) / (numTubes + 1);
                const startY = 660;

                for (let i = 0; i < numTubes; i++) {
                    const x = 60 + spacing + i * (tubeW + spacing);
                    const y = startY;
                    this.tubeLayouts.push(this.createTubeBounds(x, y, tubeW, tubeH));
                }
            } else {
                // Two Rows (e.g. 6 to 10 tubes)
                const topCount = Math.ceil(numTubes / 2);
                const bottomCount = Math.floor(numTubes / 2);
                const tubeScale = 0.76;
                const tubeW = TUBE_ORIGINAL_W * tubeScale;
                const tubeH = TUBE_ORIGINAL_H * tubeScale;

                // Row 1 (Top)
                const spacingTop = (V_WIDTH - 80 - (topCount * tubeW)) / (topCount + 1);
                const startY1 = 440;
                for (let i = 0; i < topCount; i++) {
                    const x = 40 + spacingTop + i * (tubeW + spacingTop);
                    this.tubeLayouts.push(this.createTubeBounds(x, startY1, tubeW, tubeH));
                }

                // Row 2 (Bottom)
                const spacingBottom = (V_WIDTH - 80 - (bottomCount * tubeW)) / (bottomCount + 1);
                const startY2 = 1000;
                for (let i = 0; i < bottomCount; i++) {
                    const x = 40 + spacingBottom + i * (tubeW + spacingBottom);
                    this.tubeLayouts.push(this.createTubeBounds(x, startY2, tubeW, tubeH));
                }
            }
        }

        createTubeBounds(x, y, w, h) {
            const ballSize = Math.round(h * 0.215); // e.g. ~118px on 547px height
            const radius = ballSize / 2;
            const bottomY = y + h - (h * 0.05) - radius;
            const topY = y + (h * 0.08) + radius;
            const step = (bottomY - topY) / 3;

            // Slot Ys: 0 is bottom-most, 3 is top-most
            const slots = [
                bottomY,
                bottomY - step,
                bottomY - 2 * step,
                topY
            ];

            return {
                x: x,
                y: y,
                w: w,
                h: h,
                cx: x + w / 2,
                cy: y + h / 2,
                mouthY: y - 10,
                hoverY: y - ballSize * 0.95,
                ballSize: ballSize,
                slots: slots
            };
        }

        // --- GAMEPLAY MECHANICS ---
        getTopMatchingInfo(tubeIndex) {
            const tube = this.tubes[tubeIndex];
            if (!tube || tube.length === 0) return { color: null, count: 0 };
            const color = tube[tube.length - 1];
            let count = 0;
            for (let i = tube.length - 1; i >= 0; i--) {
                if (tube[i] === color) count++;
                else break;
            }
            return { color, count };
        }

        handleTubeClick(tubeIndex) {
            if (this.state !== 'PLAYING' || (this.activeBallAnims && this.activeBallAnims.length > 0)) return;

            const tube = this.tubes[tubeIndex];

            // Case 1: No tube currently selected -> Lift top matching ball(s)
            if (this.selectedTube === null) {
                if (tube.length === 0) {
                    // Empty tube, cannot select
                    window.soundManager.playError();
                    this.triggerScreenShake(4);
                    return;
                }

                // Lift top matching ball(s)
                this.selectedTube = tubeIndex;
                window.soundManager.playBallLift(0);
                this.triggerTubeBounce(tubeIndex, 0.94, 1.08);
                return;
            }

            // Case 2: Clicking the same tube -> Put balls back down
            if (this.selectedTube === tubeIndex) {
                this.selectedTube = null;
                window.soundManager.playBallDrop(0);
                this.triggerTubeBounce(tubeIndex, 1.06, 0.94);
                return;
            }

            // Case 3: Clicking another tube -> Check if move is valid
            const srcTubeIndex = this.selectedTube;
            const srcTube = this.tubes[srcTubeIndex];
            const dstTube = this.tubes[tubeIndex];
            const srcInfo = this.getTopMatchingInfo(srcTubeIndex);

            const isValidMove = (dstTube.length < 4) &&
                (dstTube.length === 0 || dstTube[dstTube.length - 1] === srcInfo.color);

            if (!isValidMove) {
                // Invalid move!
                window.soundManager.playError();
                this.triggerScreenShake(8);
                this.companion.isDizzy = true;
                this.companion.dizzyTimer = 1.2;

                // Deselect ball and return it
                this.selectedTube = null;
                return;
            }

            // Valid Move! Calculate number of matching balls to transfer together
            const availableSpace = 4 - dstTube.length;
            const moveCount = Math.min(srcInfo.count, availableSpace);

            this.selectedTube = null;

            // Pop moving balls from source tube (from top down)
            const movingBalls = [];
            for (let k = 0; k < moveCount; k++) {
                movingBalls.push(srcTube.pop());
            }

            // Record move in undo stack
            this.moveHistory.push({
                from: srcTubeIndex,
                to: tubeIndex,
                count: moveCount,
                color: srcInfo.color
            });

            const srcLayout = this.tubeLayouts[srcTubeIndex];
            const dstLayout = this.tubeLayouts[tubeIndex];
            const baseDstSlot = dstTube.length;

            // Dynamic Bezier arc calculation based on distance
            const dx = Math.abs(dstLayout.cx - srcLayout.cx);
            const dy = Math.abs(dstLayout.cy - srcLayout.cy);
            const dist = Math.sqrt(dx * dx + dy * dy);
            const arcHeight = Math.min(240, 110 + dist * 0.16);

            this.activeBallAnims = [];
            for (let k = 0; k < moveCount; k++) {
                const ballColor = movingBalls[k];
                const targetSlot = baseDstSlot + k;

                const startX = srcLayout.cx;
                const startY = srcLayout.hoverY + k * (srcLayout.ballSize * 0.92);
                const endX = dstLayout.cx;
                const endY = dstLayout.slots[targetSlot];
                const peakY = Math.min(srcLayout.hoverY, dstLayout.hoverY) - arcHeight - (moveCount - 1 - k) * 20;

                this.activeBallAnims.push({
                    ball: ballColor,
                    from: srcTubeIndex,
                    to: tubeIndex,
                    index: k,
                    total: moveCount,
                    startX: startX,
                    startY: startY,
                    controlX: (startX + endX) / 2,
                    controlY: peakY,
                    endX: endX,
                    endY: endY,
                    dropStartY: dstLayout.mouthY,
                    delay: k * 0.11, // staggered flight
                    elapsed: 0,
                    duration: 0.34,
                    phase: 'WAIT',
                    currentX: startX,
                    currentY: startY,
                    scaleX: 1,
                    scaleY: 1,
                    hasPlayedLiftSound: false,
                    landed: false
                });
            }

            this.currentHint = null;
            this.triggerTubeBounce(srcTubeIndex, 0.92, 1.1);
        }

        checkWinCondition() {
            let won = true;
            for (const tube of this.tubes) {
                if (tube.length === 0) continue;
                if (tube.length !== 4) {
                    won = false;
                    break;
                }
                const first = tube[0];
                if (!tube.every(b => b === first)) {
                    won = false;
                    break;
                }
            }

            if (won) {
                this.handleLevelWin();
            }
        }

        handleLevelWin() {
            this.state = 'LEVEL_WIN';
            this.winStarsCount = 3;
            this.winStarsAnim = [0, 0, 0];
            this.winAnimTimer = 0;

            // Level-based point gain
            const earnedPoints = this.currentLevel * 100;
            this.lastEarnedPoints = earnedPoints;
            this.userData.points = (this.userData.points || 0) + earnedPoints;

            // Transmit Score via SendScoreAPI
            if (window.SendScoreAPI && typeof window.SendScoreAPI.sendScore === 'function') {
                window.SendScoreAPI.sendScore(this.userData.points, this.currentLevel, {
                    levelPoints: earnedPoints,
                    totalPoints: this.userData.points,
                    stars: 3,
                    moveCount: this.moveHistory ? this.moveHistory.length : 0
                });
            }

            // Save completed level
            if (!this.userData.completedLevels.includes(this.currentLevel)) {
                this.userData.completedLevels.push(this.currentLevel);
            }
            this.userData.stars[this.currentLevel] = 3;
            if (this.currentLevel + 1 > this.userData.highestUnlocked) {
                this.userData.highestUnlocked = this.currentLevel + 1;
            }
            this.saveUserData();

            // Fireworks / Confetti
            this.particles.emitConfetti(V_WIDTH / 2, V_HEIGHT * 0.4, 150);
            window.soundManager.playLevelWin();

            this.companion.jumpVel = -18;
        }

        undoMove() {
            if (this.moveHistory.length === 0 || (this.activeBallAnims && this.activeBallAnims.length > 0) || this.state !== 'PLAYING') return;

            const lastMove = this.moveHistory.pop();
            const { from, to, count, color } = lastMove;

            this.selectedTube = null;

            // Pop 'count' balls from 'to' and place back into 'from'
            const num = count || 1;
            for (let k = 0; k < num; k++) {
                const b = this.tubes[to].pop();
                this.tubes[from].push(b !== undefined ? b : color);
            }

            window.soundManager.playBallDrop(0);
            this.triggerTubeBounce(from, 1.1, 0.9);
            this.triggerTubeBounce(to, 0.95, 1.05);

            const fromLayout = this.tubeLayouts[from];
            if (fromLayout) {
                this.particles.emitBubbles(fromLayout.cx, fromLayout.y + fromLayout.h - 20, 8);
            }
        }

        addExtraTubeBooster() {
            if (this.state !== 'PLAYING' || this.activeAnim) return;

            // Check if player has already added extra tube (maximum 1 extra tube per level)
            if (this.extraTubeAdded) {
                this.showCompanionSpeech("Already added!");
                return;
            }

            this.extraTubeAdded = true;
            this.tubes.push([]);
            this.calculateTubeLayouts();
            window.soundManager.playBallLift(0);
            this.particles.emitSparkles(V_WIDTH / 2, V_HEIGHT / 2, 40, '#ffeb3b');
            this.showCompanionSpeech("+1 Extra Tube!");
        }

        showHint() {
            if (this.state !== 'PLAYING' || this.activeAnim) return;

            const hint = window.LevelManager.findHint(this.tubes);
            if (hint) {
                this.currentHint = hint;
                window.soundManager.playStar(0);
                this.triggerTubeBounce(hint.from, 0.9, 1.15);
                this.showCompanionSpeech(`Move tube ${hint.from + 1} to ${hint.to + 1}!`);
            } else {
                window.soundManager.playError();
                this.showCompanionSpeech("No moves! Tap replay.");
                this.companion.isDizzy = true;
                this.companion.dizzyTimer = 2.0;
            }
        }

        showCompanionSpeech(text) {
            this.companion.bubbleText = text;
            this.companion.bubbleTimer = 2.5;
        }

        triggerTubeBounce(index, sx, sy) {
            this.tubeBounce[index] = {
                scaleX: sx,
                scaleY: sy,
                velX: (1.0 - sx) * 12,
                velY: (1.0 - sy) * 12
            };
        }

        triggerScreenShake(amt = 8) {
            this.screenShake = amt;
        }

        // --- UPDATE & RENDER LOOP ---
        gameLoop(timestamp) {
            const dt = Math.min((timestamp - this.lastTime) / 1000, 0.1);
            this.lastTime = timestamp;

            this.update(dt);
            this.render();

            requestAnimationFrame(this.gameLoop.bind(this));
        }

        update(dt) {
            // Update particles
            this.particles.update(dt);

            // Screen shake dampening
            if (this.screenShake > 0) {
                this.screenShake *= 0.88;
                if (this.screenShake < 0.2) this.screenShake = 0;
            }

            // Tube spring bounce updates
            for (const key in this.tubeBounce) {
                const b = this.tubeBounce[key];
                const k = 140; // stiffness
                const d = 12; // damping
                const fx = (1.0 - b.scaleX) * k - b.velX * d;
                const fy = (1.0 - b.scaleY) * k - b.velY * d;
                b.velX += fx * dt;
                b.velY += fy * dt;
                b.scaleX += b.velX * dt;
                b.scaleY += b.velY * dt;
                if (Math.abs(b.scaleX - 1.0) < 0.005 && Math.abs(b.velX) < 0.05) {
                    delete this.tubeBounce[key];
                }
            }

            // Companion animation
            if (this.companion.dizzyTimer > 0) {
                this.companion.dizzyTimer -= dt;
                if (this.companion.dizzyTimer <= 0) {
                    this.companion.isDizzy = false;
                }
            }
            // Jump physics
            if (this.companion.jumpY < 0 || this.companion.jumpVel !== 0) {
                this.companion.jumpY += this.companion.jumpVel;
                this.companion.jumpVel += 35 * dt; // gravity
                if (this.companion.jumpY >= 0) {
                    this.companion.jumpY = 0;
                    this.companion.jumpVel = 0;
                }
            }
            if (this.companion.bubbleTimer > 0) {
                this.companion.bubbleTimer -= dt;
                if (this.companion.bubbleTimer <= 0) {
                    this.companion.bubbleText = null;
                }
            }

            // Staggered Multi-Ball Transfer Animation Loop
            if (this.activeBallAnims && this.activeBallAnims.length > 0) {
                let allFinished = true;

                for (let i = 0; i < this.activeBallAnims.length; i++) {
                    const anim = this.activeBallAnims[i];
                    if (anim.landed) continue;

                    allFinished = false;
                    anim.elapsed += dt;

                    if (anim.elapsed < anim.delay) {
                        // Ball is hovering while waiting for its turn
                        anim.phase = 'WAIT';
                        const hoverBob = Math.sin(Date.now() * 0.008 + anim.index) * 4;
                        anim.currentX = anim.startX;
                        anim.currentY = anim.startY + hoverBob;
                        anim.scaleX = 1.0;
                        anim.scaleY = 1.0;
                        continue;
                    }

                    // Flight progress
                    const flightTime = anim.elapsed - anim.delay;
                    const totalDuration = anim.duration + 0.14; // arc + drop duration
                    const normalizedT = Math.min(1.0, flightTime / totalDuration);

                    if (!anim.hasPlayedLiftSound) {
                        anim.hasPlayedLiftSound = true;
                        window.soundManager.playBallLift(anim.index);
                    }

                    // Emit subtle sparkling dust during flight
                    if (Math.random() < 0.3) {
                        const ballColorHex = BALL_COLORS_MAP[anim.ball] ? BALL_COLORS_MAP[anim.ball].color : '#ffffff';
                        this.particles.emitBubbles(anim.currentX, anim.currentY, 1, ballColorHex);
                    }

                    if (normalizedT <= 0.68) {
                        // Phase 1: Smooth Bezier Arc
                        anim.phase = 'ARC';
                        const arcT = normalizedT / 0.68;
                        const easedArcT = arcT < 0.5 ? 2 * arcT * arcT : 1 - Math.pow(-2 * arcT + 2, 2) / 2;
                        const u = 1 - easedArcT;

                        anim.currentX = u * u * anim.startX + 2 * u * easedArcT * anim.controlX + easedArcT * easedArcT * anim.endX;
                        anim.currentY = u * u * anim.startY + 2 * u * easedArcT * anim.controlY + easedArcT * easedArcT * anim.dropStartY;

                        // Slight flight aerodynamic stretch
                        anim.scaleX = 0.94;
                        anim.scaleY = 1.08;
                    } else {
                        // Phase 2: Accelerated Drop into tube
                        anim.phase = 'DROP';
                        anim.currentX = anim.endX;
                        const dropT = (normalizedT - 0.68) / 0.32;
                        const easedDrop = dropT * dropT; // gravity acceleration
                        anim.currentY = anim.dropStartY + (anim.endY - anim.dropStartY) * easedDrop;

                        if (dropT > 0.85) {
                            // Impact squash
                            anim.scaleX = 1.22;
                            anim.scaleY = 0.82;
                        } else {
                            anim.scaleX = 0.96;
                            anim.scaleY = 1.06;
                        }
                    }

                    // Check if this individual ball has reached destination slot
                    if (normalizedT >= 1.0) {
                        anim.landed = true;
                        anim.scaleX = 1.0;
                        anim.scaleY = 1.0;

                        // Push ball into destination tube
                        this.tubes[anim.to].push(anim.ball);

                        // Individual ball landing sound with melodic pitch variation
                        window.soundManager.playBallDrop(anim.index);

                        // Impact bounce on destination tube
                        this.triggerTubeBounce(anim.to, 1.1 + anim.index * 0.03, 0.88 - anim.index * 0.03);

                        // Emit landing splash particles
                        const ballColorHex = BALL_COLORS_MAP[anim.ball] ? BALL_COLORS_MAP[anim.ball].color : '#ffffff';
                        this.particles.emitBubbles(anim.endX, anim.endY, 6, ballColorHex);
                    }
                }

                if (allFinished) {
                    // All balls in batch have completed transfer!
                    const lastAnim = this.activeBallAnims[this.activeBallAnims.length - 1];
                    const toIndex = lastAnim.to;
                    const color = lastAnim.ball;
                    const dstLayout = this.tubeLayouts[toIndex];

                    // Check if destination tube is completed (4 balls of same color)
                    if (this.tubes[toIndex].length === 4 && this.tubes[toIndex].every(b => b === color)) {
                        window.soundManager.playTubeComplete();
                        const colorHex = BALL_COLORS_MAP[color] ? BALL_COLORS_MAP[color].color : '#4caf50';
                        this.particles.emitSparkles(dstLayout.cx, dstLayout.y + 30, 40, colorHex);
                        this.particles.emitConfetti(dstLayout.cx, dstLayout.y + 80, 30);
                        this.companion.jumpVel = -16; // Companion cheers excitedly!
                        this.showCompanionSpeech("Awesome sort!");
                    }

                    this.activeBallAnims = [];

                    // Check level win condition
                    this.checkWinCondition();
                }
            }

            // Win Stars Animation
            if (this.state === 'LEVEL_WIN') {
                this.winAnimTimer += dt;
                const delays = [0.2, 0.45, 0.7];
                for (let i = 0; i < 3; i++) {
                    if (this.winAnimTimer > delays[i]) {
                        if (this.winStarsAnim[i] === 0) {
                            window.soundManager.playStar(i);
                        }
                        this.winStarsAnim[i] = Math.min(1.0, this.winStarsAnim[i] + dt * 4.5);
                    }
                }
            }

            // Wheel Spin physics
            if (this.state === 'SPIN_WHEEL' && this.wheel.spinning) {
                this.wheel.angle += this.wheel.angularVel * dt;
                this.wheel.angularVel *= 0.985; // friction

                // Ticker sound
                const tickAngle = Math.PI / 4; // 8 slices
                if (Math.floor(this.wheel.angle / tickAngle) !== Math.floor((this.wheel.angle - this.wheel.angularVel * dt) / tickAngle)) {
                    window.soundManager.playTick();
                }

                if (Math.abs(this.wheel.angularVel) < 0.15) {
                    this.wheel.spinning = false;
                    this.wheel.angularVel = 0;
                    this.finishWheelSpin();
                }
            }
        }

        render() {
            const ctx = this.ctx;
            this.buttons = []; // Reset clickable zones

            ctx.save();

            // Screen shake transform
            if (this.screenShake > 0) {
                const ox = (Math.random() - 0.5) * this.screenShake;
                const oy = (Math.random() - 0.5) * this.screenShake;
                ctx.translate(ox, oy);
            }

            // Background pastel gradient
            const bgGrad = ctx.createLinearGradient(0, 0, 0, V_HEIGHT);
            bgGrad.addColorStop(0, '#86d4d1');
            bgGrad.addColorStop(0.5, '#78c9c6');
            bgGrad.addColorStop(1, '#66b8b5');
            ctx.fillStyle = bgGrad;
            ctx.fillRect(0, 0, V_WIDTH, V_HEIGHT);

            // Draw Subtle Background Decors / Clouds / Bubbles
            this.drawBackgroundElements(ctx);

            if (this.state === 'HOME' || (this.state === 'SETTINGS' && this.previousState === 'HOME')) {
                // Render Home Page
                this.renderHomeScreen(ctx);
                this.particles.draw(ctx);
            } else {
                // Draw Gameplay Scene (Tubes, Balls, Companion, Bottom Bar)
                this.drawCompanionGrass(ctx);
                this.drawTubesAndBalls(ctx);
                this.drawCompanion(ctx);
                this.drawTopBar(ctx);
                this.drawBottomBar(ctx);

                // Draw Particles (Confetti, sparkles)
                this.particles.draw(ctx);

                // Draw Screen Overlays (Modals)
                if (this.state === 'LEVEL_WIN') {
                    this.renderLevelWinOverlay(ctx);
                } else if (this.state === 'PAUSED') {
                    this.renderPauseOverlay(ctx);
                } else if (this.state === 'LEVEL_SELECT') {
                    this.renderLevelSelectScreen(ctx);
                } else if (this.state === 'SPIN_WHEEL') {
                    this.renderSpinWheelScreen(ctx);
                } else if (this.state === 'PROFILE') {
                    this.renderProfileScreen(ctx);
                } else if (this.state === 'SHOP') {
                    this.renderShopScreen(ctx);
                }
            }

            // Settings Modal overlays on whatever screen it was opened from
            if (this.state === 'SETTINGS') {
                this.renderSettingsModal(ctx);
            }

            ctx.restore();
        }

        drawBackgroundElements(ctx) {
            ctx.save();
            ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
            // Soft decorative circles
            ctx.beginPath();
            ctx.arc(160, 280, 240, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(920, 480, 200, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(100, 1100, 180, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        drawCompanionGrass(ctx) {
            ctx.save();
            // Cute grassy rolling hill at bottom left
            ctx.fillStyle = '#6cb75e';
            ctx.beginPath();
            ctx.ellipse(200, 1920, 360, 180, 0, 0, Math.PI * 2);
            ctx.fill();

            // Second light green hill contour
            ctx.fillStyle = '#7ac96c';
            ctx.beginPath();
            ctx.ellipse(180, 1920, 320, 150, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        drawCompanion(ctx) {
            ctx.save();
            const comp = this.companion;
            const charObj = CHARACTERS.find(c => c.id === comp.charId) || CHARACTERS[0];
            const spriteKey = comp.isDizzy ? charObj.dizzy : charObj.normal;
            const img = assets[spriteKey] || assets.char_beaver;

            if (img) {
                const idleBob = Math.sin(Date.now() * 0.004) * 4;
                const drawX = comp.x;
                const drawY = comp.y + comp.jumpY + idleBob;

                ctx.save();
                ctx.translate(drawX, drawY);

                // Squash & stretch on jump landing
                const scaleX = comp.jumpY < -5 ? 0.92 : 1.0;
                const scaleY = comp.jumpY < -5 ? 1.08 : 1.0;
                ctx.scale(scaleX, scaleY);

                const w = 180;
                const h = (img.height / img.width) * w;
                ctx.drawImage(img, -w / 2, -h / 2, w, h);

                // If Dizzy, draw cute cartoon swirling stars
                if (comp.isDizzy) {
                    const rot = Date.now() * 0.008;
                    ctx.fillStyle = '#ffeb3b';
                    for (let s = 0; s < 3; s++) {
                        const a = rot + (s * (Math.PI * 2 / 3));
                        const sx = Math.cos(a) * 45;
                        const sy = -h / 2 - 15 + Math.sin(a) * 15;
                        ctx.beginPath();
                        ctx.arc(sx, sy, 6, 0, Math.PI * 2);
                        ctx.fill();
                    }
                }

                ctx.restore();

                // Speech Bubble
                if (comp.bubbleText) {
                    this.drawSpeechBubble(ctx, drawX + 70, drawY - 100, comp.bubbleText);
                }

                // Register companion as clickable (tap companion for cute reaction)
                this.registerButton(drawX - 90, drawY - 100, 180, 200, () => {
                    window.soundManager.playBallLift();
                    comp.jumpVel = -14;
                    const greetings = ["Hi there!", "Good luck!", "You got this!", "Let's sort!"];
                    this.showCompanionSpeech(greetings[Math.floor(Math.random() * greetings.length)]);
                });
            }
            ctx.restore();
        }

        drawSpeechBubble(ctx, x, y, text) {
            ctx.save();
            ctx.font = 'bold 28px Fredoka, sans-serif';
            const metrics = ctx.measureText(text);
            const padX = 24;
            const padY = 16;
            const bw = metrics.width + padX * 2;
            const bh = 50;

            // Draw rounded bubble
            ctx.fillStyle = '#ffffff';
            ctx.strokeStyle = '#2b5c59';
            ctx.lineWidth = 4;

            ctx.beginPath();
            ctx.roundRect(x, y - bh, bw, bh, 18);
            ctx.fill();
            ctx.stroke();

            // Little triangle pointer
            ctx.beginPath();
            ctx.moveTo(x + 20, y);
            ctx.lineTo(x + 10, y + 14);
            ctx.lineTo(x + 35, y);
            ctx.fillStyle = '#ffffff';
            ctx.fill();
            ctx.stroke();

            // Fill text
            ctx.fillStyle = '#2b5c59';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(text, x + bw / 2, y - bh / 2);
            ctx.restore();
        }

        drawTopBar(ctx) {
            // Top safe bar
            const barY = 110;

            // Left: Back / Pause circle button
            const backX = 90;
            if (assets.btn_circle_back) {
                ctx.drawImage(assets.btn_circle_back, backX - 45, barY - 45, 90, 90);
                this.registerButton(backX - 45, barY - 45, 90, 90, () => {
                    window.soundManager.playClick();
                    this.openPauseModal();
                });
            }

            // Center: Level Text
            ctx.save();
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 54px Fredoka, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
            ctx.shadowBlur = 8;
            ctx.shadowOffsetY = 4;
            ctx.fillText(`Level ${this.currentLevel}`, V_WIDTH / 2, barY);
            ctx.restore();

            // Right: Points Counter Capsule
            const scoreX = V_WIDTH - 150;
            ctx.save();
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.beginPath();
            ctx.roundRect(scoreX - 120, barY - 35, 200, 70, 35);
            ctx.fill();
            ctx.strokeStyle = '#2b6562';
            ctx.lineWidth = 4;
            ctx.stroke();

            // Points text with star
            ctx.fillStyle = '#f57f17';
            ctx.font = 'bold 32px Fredoka, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(`⭐ ${this.userData.points || 0}`, scoreX - 20, barY + 2);
            ctx.restore();
        }

        drawBottomBar(ctx) {
            ctx.save();

            // Right floating action dock for buttons
            const dockW = 590;
            const dockH = 150;
            const dockX = V_WIDTH - dockW - 40; // 450 to 1040
            const dockY = 1725;

            // Dock Glass Background
            ctx.fillStyle = 'rgba(255, 255, 255, 0.94)';
            ctx.beginPath();
            ctx.roundRect(dockX, dockY, dockW, dockH, 44);
            ctx.fill();
            ctx.strokeStyle = '#2b6562';
            ctx.lineWidth = 4;
            ctx.stroke();

            // Inner subtle border
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.roundRect(dockX + 6, dockY + 6, dockW - 12, dockH - 12, 38);
            ctx.stroke();

            const items = [
                {
                    id: 'replay',
                    label: 'Restart',
                    icon: assets.icon_replay,
                    color1: '#ffa726',
                    color2: '#f57c00',
                    cx: dockX + 100,
                    cy: dockY + 60
                },
                {
                    id: 'undo',
                    label: 'Undo',
                    icon: assets.icon_undo,
                    color1: '#42a5f5',
                    color2: '#1976d2',
                    cx: dockX + 295,
                    cy: dockY + 60,
                    badge: this.moveHistory.length > 0 ? this.moveHistory.length : null
                },
                {
                    id: 'skip',
                    label: '+1 Tube',
                    icon: assets.icon_skip,
                    color1: '#66bb6a',
                    color2: '#2e7d32',
                    cx: dockX + 490,
                    cy: dockY + 60
                }
            ];

            items.forEach(it => {
                const r = 44;

                // Elevated circular button
                const bGrad = ctx.createRadialGradient(it.cx - 10, it.cy - 12, 4, it.cx, it.cy, r);
                bGrad.addColorStop(0, it.color1);
                bGrad.addColorStop(1, it.color2);
                ctx.fillStyle = bGrad;
                ctx.beginPath();
                ctx.arc(it.cx, it.cy, r, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 3.5;
                ctx.stroke();

                // Icon
                if (it.icon) {
                    const isz = 52;
                    ctx.drawImage(it.icon, it.cx - isz / 2, it.cy - isz / 2, isz, isz);
                }

                // Label below
                ctx.fillStyle = '#2b5c59';
                ctx.font = 'bold 24px Fredoka, sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'top';
                ctx.fillText(it.label, it.cx, it.cy + r + 8);

                // Badges
                if (it.badge !== null && it.badge !== undefined) {
                    // Move counter badge on Undo
                    ctx.fillStyle = '#e91e63';
                    ctx.beginPath();
                    ctx.arc(it.cx + 32, it.cy - 24, 18, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.strokeStyle = '#ffffff';
                    ctx.lineWidth = 2.5;
                    ctx.stroke();

                    ctx.fillStyle = '#ffffff';
                    ctx.font = 'bold 20px Fredoka, sans-serif';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(`${it.badge}`, it.cx + 32, it.cy - 24);
                }

                // Button hit target
                this.registerButton(it.cx - 65, it.cy - 50, 130, 125, () => {
                    window.soundManager.playClick();
                    if (it.id === 'replay') {
                        this.initLevel(this.currentLevel);
                    } else if (it.id === 'undo') {
                        this.undoMove();
                    } else if (it.id === 'skip') {
                        this.addExtraTubeBooster();
                    }
                });
            });

            ctx.restore();
        }

        drawTubesAndBalls(ctx) {
            for (let i = 0; i < this.tubes.length; i++) {
                const tube = this.tubes[i];
                const layout = this.tubeLayouts[i];
                if (!layout) continue;

                const bounce = this.tubeBounce[i] || { scaleX: 1, scaleY: 1 };

                ctx.save();
                ctx.translate(layout.cx, layout.y + layout.h);
                ctx.scale(bounce.scaleX, bounce.scaleY);
                ctx.translate(-layout.cx, -(layout.y + layout.h));

                // If tube is currently suggested by Hint, draw glowing animated ring
                if (this.currentHint && (this.currentHint.from === i || this.currentHint.to === i)) {
                    ctx.strokeStyle = this.currentHint.from === i ? '#ffeb3b' : '#4caf50';
                    ctx.lineWidth = 6;
                    ctx.setLineDash([12, 8]);
                    ctx.beginPath();
                    ctx.roundRect(layout.x - 8, layout.y - 8, layout.w + 16, layout.h + 16, 24);
                    ctx.stroke();
                    ctx.setLineDash([]);
                }

                // 1. Draw Tube Glass Backing
                if (assets.tube) {
                    ctx.drawImage(assets.tube, layout.x, layout.y, layout.w, layout.h);
                } else {
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
                    ctx.beginPath();
                    ctx.roundRect(layout.x, layout.y, layout.w, layout.h, 24);
                    ctx.fill();
                }

                // 2. Draw Balls inside tube (with multi-ball stacked lift hover)
                const isSelected = (this.selectedTube === i);
                const selInfo = isSelected ? this.getTopMatchingInfo(i) : null;
                const liftedCount = selInfo ? selInfo.count : 0;
                const stationaryCount = tube.length - liftedCount;

                for (let bIndex = 0; bIndex < tube.length; bIndex++) {
                    if (isSelected && bIndex >= stationaryCount) {
                        // Lifted matching top ball
                        const stackIndex = bIndex - stationaryCount;
                        const distFromTop = (liftedCount - 1) - stackIndex;
                        const hoverFloat = Math.sin(Date.now() * 0.008) * 6;
                        const ballY = layout.hoverY + hoverFloat + distFromTop * (layout.ballSize * 0.92);

                        this.drawBall(ctx, layout.cx, ballY, layout.ballSize, tube[bIndex], true);
                    } else {
                        // Resting ball inside tube
                        const sy = layout.slots[bIndex];
                        this.drawBall(ctx, layout.cx, sy, layout.ballSize, tube[bIndex], false);
                    }
                }

                // 3. Draw Tube Glass Rim & Specular Highlights on Top
                if (assets.tube_overlay) {
                    ctx.drawImage(assets.tube_overlay, layout.x, layout.y, layout.w, layout.h);
                } else {
                    ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
                    ctx.lineWidth = 6;
                    ctx.beginPath();
                    ctx.roundRect(layout.x, layout.y, layout.w, layout.h, 24);
                    ctx.stroke();
                }

                ctx.restore();

                // Register Tube Click Target
                this.registerButton(layout.x - 15, layout.y - 60, layout.w + 30, layout.h + 80, () => {
                    this.handleTubeClick(i);
                });
            }

            // Draw active flying ball animations
            if (this.activeBallAnims && this.activeBallAnims.length > 0) {
                for (const anim of this.activeBallAnims) {
                    if (anim.landed) continue;
                    this.drawActiveBallAnimation(ctx, anim);
                }
            }
        }

        drawBall(ctx, x, y, size, colorId, isHovering = false) {
            ctx.save();
            const ballInfo = BALL_COLORS_MAP[colorId] || BALL_COLORS_MAP[0];
            const img = assets[ballInfo.key];

            if (isHovering) {
                // Soft glowing aura
                const pulse = 1 + Math.sin(Date.now() * 0.01) * 0.15;
                ctx.shadowColor = ballInfo.color;
                ctx.shadowBlur = 24 * pulse;
            }

            if (img) {
                ctx.drawImage(img, x - size / 2, y - size / 2, size, size);
            } else {
                // Procedural high-gloss sphere fallback
                ctx.beginPath();
                ctx.arc(x, y, size / 2, 0, Math.PI * 2);
                ctx.fillStyle = ballInfo.color;
                ctx.fill();

                // Glossy 3D shine
                const grad = ctx.createRadialGradient(x - size * 0.18, y - size * 0.18, size * 0.05, x, y, size / 2);
                grad.addColorStop(0, 'rgba(255,255,255,0.75)');
                grad.addColorStop(0.5, 'rgba(255,255,255,0.15)');
                grad.addColorStop(1, 'rgba(0,0,0,0.3)');
                ctx.fillStyle = grad;
                ctx.fill();
            }
            ctx.restore();
        }

        drawActiveBallAnimation(ctx, anim) {
            const size = this.tubeLayouts[anim.to] ? this.tubeLayouts[anim.to].ballSize : 110;
            ctx.save();
            ctx.translate(anim.currentX, anim.currentY);
            ctx.scale(anim.scaleX, anim.scaleY);
            this.drawBall(ctx, 0, 0, size, anim.ball, true);
            ctx.restore();
        }

        // --- HOME SCREEN & SETTINGS MODAL ---

        renderHomeScreen(ctx) {
            ctx.save();

            // 1. Top Bar: Settings Button (Left) & Level Icon Capsule (Right)
            const barY = 110;

            // Settings Button (Left circle)
            const setX = 90;
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.beginPath();
            ctx.arc(setX, barY, 45, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#2b6562';
            ctx.lineWidth = 4;
            ctx.stroke();

            if (assets.btn_settings) {
                ctx.drawImage(assets.btn_settings, setX - 35, barY - 35, 70, 70);
            }
            this.registerButton(setX - 45, barY - 45, 90, 90, () => {
                this.openSettingsModal();
            });

            // Top Right: Level Capsule with Level Trophy Icon (Replaces coins)
            const lvlPillW = 240;
            const lvlPillH = 74;
            const lvlPillX = V_WIDTH - 90 - lvlPillW;
            ctx.fillStyle = 'rgba(255, 255, 255, 0.94)';
            ctx.beginPath();
            ctx.roundRect(lvlPillX, barY - lvlPillH / 2, lvlPillW, lvlPillH, 37);
            ctx.fill();
            ctx.strokeStyle = '#2b6562';
            ctx.lineWidth = 4;
            ctx.stroke();

            // Gold emblem for level icon
            const emblemX = lvlPillX + 38;
            ctx.fillStyle = '#ffb300';
            ctx.beginPath();
            ctx.arc(emblemX, barY, 24, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#f57f17';
            ctx.lineWidth = 2.5;
            ctx.stroke();

            ctx.font = '26px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('🏆', emblemX, barY + 1);

            // Level Text
            ctx.fillStyle = '#2b5c59';
            ctx.font = 'bold 36px Fredoka, sans-serif';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillText(`Level ${this.userData.currentLevel || 1}`, emblemX + 34, barY + 2);

            this.registerButton(lvlPillX, barY - lvlPillH / 2, lvlPillW, lvlPillH, () => {
                window.soundManager.playClick();
                this.state = 'LEVEL_SELECT';
            });

            // 2. Animated Floating Game Logo
            const logoBob = Math.sin(Date.now() * 0.003) * 12;
            const logoY = 350 + logoBob;

            if (assets.logo_balls_sort) {
                const img = assets.logo_balls_sort;
                const lw = 680;
                const lh = (img.height / img.width) * lw;
                ctx.drawImage(img, V_WIDTH / 2 - lw / 2, logoY - lh / 2, lw, lh);
            } else {
                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 80px Fredoka, sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('BALL SORT', V_WIDTH / 2, logoY - 40);
                ctx.fillText('PUZZLE', V_WIDTH / 2, logoY + 40);
            }

            // 3. Player Cumulative Points Badge
            const badgeY = 515;
            const badgeW = 460;
            const badgeH = 80;
            const badgeX = (V_WIDTH - badgeW) / 2;

            ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
            ctx.beginPath();
            ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 40);
            ctx.fill();
            ctx.strokeStyle = '#2b6562';
            ctx.lineWidth = 4;
            ctx.stroke();

            // Points text with star
            ctx.fillStyle = '#f57f17';
            ctx.font = 'bold 40px Fredoka, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(`⭐ Points: ${this.userData.points || 0}`, V_WIDTH / 2, badgeY + badgeH / 2);

            // 4. Interactive Decorative Tubes on Wood Shelf
            const shelfY = 890;
            // Wooden shelf
            ctx.fillStyle = '#c7925b';
            ctx.beginPath();
            ctx.roundRect(V_WIDTH / 2 - 280, shelfY + 70, 560, 24, 12);
            ctx.fill();
            ctx.fillStyle = '#a6723e';
            ctx.fillRect(V_WIDTH / 2 - 260, shelfY + 94, 520, 10);

            // 3 showcase tubes
            const showTubes = [
                { cx: V_WIDTH / 2 - 160, balls: [0, 0, 0, 0] }, // 4 Blue
                { cx: V_WIDTH / 2, balls: [2, 2, 2] },         // 3 Pink
                { cx: V_WIDTH / 2 + 160, balls: [1, 1, 1, 1] } // 4 Green
            ];

            const stW = 90;
            const stH = 260;
            const sBallSize = 52;

            showTubes.forEach((st, idx) => {
                const tx = st.cx - stW / 2;
                const ty = shelfY - stH + 70;

                // Glass tube back
                if (assets.tube) {
                    ctx.drawImage(assets.tube, tx, ty, stW, stH);
                } else {
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
                    ctx.beginPath();
                    ctx.roundRect(tx, ty, stW, stH, 20);
                    ctx.fill();
                }

                // Draw balls in showcase tube
                const step = (stH - 30 - sBallSize) / 3;
                const bottomY = ty + stH - 18 - sBallSize / 2;

                st.balls.forEach((bId, bIdx) => {
                    const by = bottomY - bIdx * step;
                    this.drawBall(ctx, st.cx, by, sBallSize, bId, false);
                });

                // Glass overlay
                if (assets.tube_overlay) {
                    ctx.drawImage(assets.tube_overlay, tx, ty, stW, stH);
                }

                // Floating bouncing ball for middle tube
                if (idx === 1) {
                    const hopY = ty - 32 + Math.sin(Date.now() * 0.008) * 10;
                    this.drawBall(ctx, st.cx, hopY, sBallSize, 2, true);
                }
            });

            // 5. Mascot Companion on Seamless Rolling Green Landscape
            const compY = 1240;
            const charObj = CHARACTERS.find(c => c.id === this.companion.charId) || CHARACTERS[0];
            const compImg = assets[charObj.normal] || assets.char_beaver;

            // Rolling grass hills extending seamlessly to bottom of screen
            ctx.fillStyle = '#5cb84d';
            ctx.beginPath();
            ctx.ellipse(V_WIDTH / 2, 1720, 720, 420, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#6ec85c';
            ctx.beginPath();
            ctx.ellipse(V_WIDTH / 2, 1760, 640, 360, 0, 0, Math.PI * 2);
            ctx.fill();

            if (compImg) {
                const idleBob = Math.sin(Date.now() * 0.004) * 8;
                const cw = 250;
                const ch = (compImg.height / compImg.width) * cw;
                const cx = V_WIDTH / 2;
                const cy = compY + this.companion.jumpY + idleBob;

                ctx.save();
                ctx.translate(cx, cy);
                const scaleX = this.companion.jumpY < -5 ? 0.94 : 1.0;
                const scaleY = this.companion.jumpY < -5 ? 1.06 : 1.0;
                ctx.scale(scaleX, scaleY);
                ctx.drawImage(compImg, -cw / 2, -ch / 2, cw, ch);
                ctx.restore();

                // Speech Bubble
                const speech = "Tap to Play!";
                this.drawSpeechBubble(ctx, cx + 80, cy - ch / 2 - 20, speech);

                // Tap companion for cute reaction
                this.registerButton(cx - cw / 2, cy - ch / 2, cw, ch, () => {
                    window.soundManager.playBallLift(0);
                    this.companion.jumpVel = -15;
                    this.particles.emitSparkles(cx, cy, 25, '#ffeb3b');
                });
            }

            // 6. Big Glowing "TAP TO PLAY" Button
            const btnPulse = 1.0 + Math.sin(Date.now() * 0.006) * 0.035;
            const playBtnW = 540;
            const playBtnH = 135;
            const playBtnY = 1580;
            const playBtnX = V_WIDTH / 2;

            ctx.save();
            ctx.translate(playBtnX, playBtnY);
            ctx.scale(btnPulse, btnPulse);

            // Deep Button Shadow
            ctx.fillStyle = 'rgba(27, 94, 32, 0.35)';
            ctx.beginPath();
            ctx.roundRect(-playBtnW / 2, -playBtnH / 2 + 12, playBtnW, playBtnH, 44);
            ctx.fill();

            // Button Body Gradient (Lush Emerald / Lime Green)
            const btnGrad = ctx.createLinearGradient(0, -playBtnH / 2, 0, playBtnH / 2);
            btnGrad.addColorStop(0, '#81c784');
            btnGrad.addColorStop(0.35, '#4caf50');
            btnGrad.addColorStop(1, '#2e7d32');
            ctx.fillStyle = btnGrad;
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 6;
            ctx.beginPath();
            ctx.roundRect(-playBtnW / 2, -playBtnH / 2, playBtnW, playBtnH, 44);
            ctx.fill();
            ctx.stroke();

            // Inner Top Highlight Glare
            ctx.fillStyle = 'rgba(255, 255, 255, 0.32)';
            ctx.beginPath();
            ctx.roundRect(-playBtnW / 2 + 10, -playBtnH / 2 + 8, playBtnW - 20, playBtnH / 2 - 6, 36);
            ctx.fill();

            // Play Triangle Icon
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            const triX = -170;
            ctx.moveTo(triX - 16, -24);
            ctx.lineTo(triX + 24, 0);
            ctx.lineTo(triX - 16, 24);
            ctx.closePath();
            ctx.fill();

            // Text "TAP TO PLAY"
            ctx.font = '900 52px Fredoka, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            // 3D Text Shadow
            ctx.fillStyle = '#1b5e20';
            ctx.fillText('TAP TO PLAY', 25, 4);

            // Front Text
            ctx.fillStyle = '#ffffff';
            ctx.fillText('TAP TO PLAY', 25, 0);

            ctx.restore();

            // Register Play Button Click -> Start Current Level!
            const hitW = playBtnW * 1.1;
            const hitH = playBtnH * 1.1;
            this.registerButton(playBtnX - hitW / 2, playBtnY - hitH / 2, hitW, hitH, () => {
                window.soundManager.playClick();
                this.companion.jumpVel = -16;
                this.particles.emitConfetti(V_WIDTH / 2, playBtnY, 80);
                this.initLevel(this.userData.currentLevel || 1);
                this.state = 'PLAYING';
            });

            ctx.restore();
        }

        drawHomeFooterNav(ctx) {
            // Deprecated - footer removed per user request
        }

        renderSettingsModal(ctx) {
            ctx.save();
            // Darkened modal backdrop
            ctx.fillStyle = 'rgba(16, 44, 42, 0.72)';
            ctx.fillRect(0, 0, V_WIDTH, V_HEIGHT);

            const cardW = 720;
            const cardH = 620;
            const cardX = (V_WIDTH - cardW) / 2;
            const cardY = (V_HEIGHT - cardH) / 2 - 30;

            // Card Shadow
            ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
            ctx.beginPath();
            ctx.roundRect(cardX, cardY + 12, cardW, cardH, 44);
            ctx.fill();

            // Card Body
            const cardGrad = ctx.createLinearGradient(0, cardY, 0, cardY + cardH);
            cardGrad.addColorStop(0, '#ffffff');
            cardGrad.addColorStop(1, '#f3faf9');
            ctx.fillStyle = cardGrad;
            ctx.strokeStyle = '#2b6562';
            ctx.lineWidth = 6;
            ctx.beginPath();
            ctx.roundRect(cardX, cardY, cardW, cardH, 44);
            ctx.fill();
            ctx.stroke();

            // Header Title "Settings"
            ctx.fillStyle = '#2b5c59';
            ctx.font = 'bold 58px Fredoka, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('Settings', V_WIDTH / 2, cardY + 80);

            // Close Button (Circle close)
            const closeX = cardX + cardW - 70;
            const closeY = cardY + 70;
            if (assets.btn_circle_close) {
                ctx.drawImage(assets.btn_circle_close, closeX - 35, closeY - 35, 70, 70);
            } else {
                ctx.fillStyle = '#e57373';
                ctx.beginPath();
                ctx.arc(closeX, closeY, 32, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 36px Fredoka, sans-serif';
                ctx.fillText('✕', closeX, closeY);
            }
            this.registerButton(closeX - 45, closeY - 45, 90, 90, () => {
                this.closeSettingsModal();
            });

            // 1. Sound Row
            const soundY = cardY + 205;
            // Row background pill
            ctx.fillStyle = 'rgba(232, 245, 244, 0.8)';
            ctx.beginPath();
            ctx.roundRect(cardX + 50, soundY - 50, cardW - 100, 100, 28);
            ctx.fill();

            // Sound Label
            ctx.fillStyle = '#2b5c59';
            ctx.font = 'bold 42px Fredoka, sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText('Sound FX', cardX + 85, soundY - 6);
            ctx.font = '24px Fredoka, sans-serif';
            ctx.fillStyle = '#78909c';
            ctx.fillText('Game sound effects', cardX + 85, soundY + 26);

            // Sound Toggle
            const soundToggleImg = window.soundManager.soundEnabled ? assets.toggle_on : assets.toggle_off;
            const toggleW = 160;
            const toggleH = 72;
            const toggleX = cardX + cardW - 90 - toggleW;
            if (soundToggleImg) {
                ctx.drawImage(soundToggleImg, toggleX, soundY - toggleH / 2, toggleW, toggleH);
            }
            this.registerButton(toggleX - 10, soundY - 45, toggleW + 20, 90, () => {
                const nextState = !window.soundManager.soundEnabled;
                window.soundManager.setSound(nextState);
                if (nextState) {
                    window.soundManager.playBallDrop(0);
                }
            });

            // 2. Music Row
            const musicY = cardY + 335;
            ctx.fillStyle = 'rgba(232, 245, 244, 0.8)';
            ctx.beginPath();
            ctx.roundRect(cardX + 50, musicY - 50, cardW - 100, 100, 28);
            ctx.fill();

            ctx.fillStyle = '#2b5c59';
            ctx.font = 'bold 42px Fredoka, sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText('Music', cardX + 85, musicY - 6);
            ctx.font = '24px Fredoka, sans-serif';
            ctx.fillStyle = '#78909c';
            ctx.fillText('Background melody', cardX + 85, musicY + 26);

            const musicToggleImg = window.soundManager.musicEnabled ? assets.toggle_on : assets.toggle_off;
            if (musicToggleImg) {
                ctx.drawImage(musicToggleImg, toggleX, musicY - toggleH / 2, toggleW, toggleH);
            }
            this.registerButton(toggleX - 10, musicY - 45, toggleW + 20, 90, () => {
                const nextState = !window.soundManager.musicEnabled;
                window.soundManager.setMusic(nextState);
                if (window.soundManager.soundEnabled) {
                    window.soundManager.playClick();
                }
            });

            // 3. Done Button
            const doneBtnW = 340;
            const doneBtnH = 95;
            const doneBtnX = V_WIDTH / 2 - doneBtnW / 2;
            const doneBtnY = cardY + 475;

            ctx.fillStyle = '#4caf50';
            ctx.beginPath();
            ctx.roundRect(doneBtnX, doneBtnY, doneBtnW, doneBtnH, 32);
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 4;
            ctx.stroke();

            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 42px Fredoka, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('DONE', V_WIDTH / 2, doneBtnY + doneBtnH / 2);

            this.registerButton(doneBtnX, doneBtnY, doneBtnW, doneBtnH, () => {
                this.closeSettingsModal();
            });

            ctx.restore();
        }

        // --- OVERLAYS & MODAL SCREENS ---

        renderLevelWinOverlay(ctx) {
            // Darkened soft teal overlay
            ctx.save();
            ctx.fillStyle = 'rgba(20, 50, 50, 0.65)';
            ctx.fillRect(0, 0, V_WIDTH, V_HEIGHT);

            const cardW = 760;
            const cardH = 820;
            const cardX = (V_WIDTH - cardW) / 2;
            const cardY = (V_HEIGHT - cardH) / 2 - 40;

            // White Card with soft corners
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.roundRect(cardX, cardY, cardW, cardH, 42);
            ctx.fill();

            // Stars outline & animated full stars
            const starsW = 420;
            const starsH = 180;
            const starsX = V_WIDTH / 2 - starsW / 2;
            const starsY = cardY + 70;

            if (assets.stars_empty) {
                ctx.drawImage(assets.stars_empty, starsX, starsY, starsW, starsH);
            }

            // Draw glowing 3 gold stars with elastic scale
            if (assets.stars_full) {
                ctx.save();
                const scale = this.winStarsAnim[2];
                ctx.translate(V_WIDTH / 2, starsY + starsH / 2);
                ctx.scale(scale, scale);
                ctx.drawImage(assets.stars_full, -starsW / 2, -starsH / 2, starsW, starsH);
                ctx.restore();
            }

            // "Level X completed" Text
            ctx.fillStyle = '#2b5c59';
            ctx.font = 'bold 56px Fredoka, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(`Level ${this.currentLevel}`, V_WIDTH / 2, cardY + 320);
            ctx.fillText(`completed!`, V_WIDTH / 2, cardY + 380);

            // Level-based Points Reward Card
            const ptsY = cardY + 480;
            ctx.fillStyle = 'rgba(255, 179, 0, 0.14)';
            ctx.beginPath();
            ctx.roundRect(V_WIDTH / 2 - 240, ptsY - 50, 480, 100, 32);
            ctx.fill();
            ctx.strokeStyle = '#ffb300';
            ctx.lineWidth = 3.5;
            ctx.stroke();

            ctx.fillStyle = '#f57f17';
            ctx.font = 'bold 44px Fredoka, sans-serif';
            ctx.fillText(`+${this.lastEarnedPoints || (this.currentLevel * 100)} Points!`, V_WIDTH / 2, ptsY - 10);

            ctx.font = 'bold 24px Fredoka, sans-serif';
            ctx.fillStyle = '#2b5c59';
            ctx.fillText(`Total Score: ${this.userData.points || 0} pts`, V_WIDTH / 2, ptsY + 28);

            // Buttons: "next" (green) and "quit" (coral red)
            const btnW = 310;
            const btnH = 115;
            const btnY = cardY + 630;

            // Next Button
            const nextX = V_WIDTH / 2 - btnW - 20;
            if (assets.btn_next) {
                ctx.drawImage(assets.btn_next, nextX, btnY, btnW, btnH);
            } else {
                ctx.fillStyle = '#8bc34a';
                ctx.beginPath();
                ctx.roundRect(nextX, btnY, btnW, btnH, 30);
                ctx.fill();
                ctx.fillStyle = '#ffffff';
                ctx.fillText('next', nextX + btnW / 2, btnY + btnH / 2);
            }
            this.registerButton(nextX, btnY, btnW, btnH, () => {
                window.soundManager.playClick();
                this.initLevel(this.currentLevel + 1);
            });

            // Quit Button -> Goes to HOME
            const quitX = V_WIDTH / 2 + 20;
            if (assets.btn_quit) {
                ctx.drawImage(assets.btn_quit, quitX, btnY, btnW, btnH);
            } else {
                ctx.fillStyle = '#e57373';
                ctx.beginPath();
                ctx.roundRect(quitX, btnY, btnW, btnH, 30);
                ctx.fill();
                ctx.fillStyle = '#ffffff';
                ctx.fillText('quit', quitX + btnW / 2, btnY + btnH / 2);
            }
            this.registerButton(quitX, btnY, btnW, btnH, () => {
                window.soundManager.playClick();
                this.state = 'HOME';
            });

            ctx.restore();
        }

        renderPauseOverlay(ctx) {
            ctx.save();
            ctx.fillStyle = 'rgba(20, 50, 50, 0.6)';
            ctx.fillRect(0, 0, V_WIDTH, V_HEIGHT);

            const cardW = 600;
            const cardH = 580;
            const cardX = (V_WIDTH - cardW) / 2;
            const cardY = (V_HEIGHT - cardH) / 2;

            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.roundRect(cardX, cardY, cardW, cardH, 40);
            ctx.fill();

            // Header "paused"
            ctx.fillStyle = '#2b5c59';
            ctx.font = 'bold 64px Fredoka, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('paused', V_WIDTH / 2, cardY + 110);

            // Quit Button (Red pill)
            const btnW = 340;
            const btnH = 110;
            const quitY = cardY + 220;
            const btnX = (V_WIDTH - btnW) / 2;

            if (assets.btn_quit) {
                ctx.drawImage(assets.btn_quit, btnX, quitY, btnW, btnH);
            }
            this.registerButton(btnX, quitY, btnW, btnH, () => {
                window.soundManager.playClick();
                this.state = 'HOME';
            });

            // Back / Resume Button (Green pill)
            const backY = cardY + 370;
            if (assets.btn_back) {
                ctx.drawImage(assets.btn_back, btnX, backY, btnW, btnH);
            }
            this.registerButton(btnX, backY, btnW, btnH, () => {
                window.soundManager.playClick();
                this.state = 'PLAYING';
            });

            // Settings & Profile shortcut buttons inside pause modal
            const setX = cardX + cardW - 70;
            const setY = cardY + 60;
            if (assets.btn_settings) {
                ctx.drawImage(assets.btn_settings, setX - 35, setY - 35, 70, 70);
                this.registerButton(setX - 35, setY - 35, 70, 70, () => {
                    this.openSettingsModal();
                });
            }

            ctx.restore();
        }

        renderLevelSelectScreen(ctx) {
            ctx.save();
            ctx.fillStyle = '#81c7c5';
            ctx.fillRect(0, 0, V_WIDTH, V_HEIGHT);

            // Header
            const barY = 110;
            if (assets.btn_circle_back) {
                ctx.drawImage(assets.btn_circle_back, 45, barY - 45, 90, 90);
                this.registerButton(45, barY - 45, 90, 90, () => {
                    window.soundManager.playClick();
                    this.state = 'HOME';
                });
            }

            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 54px Fredoka, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('Levels', V_WIDTH / 2, barY);

            // Points counter capsule
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.beginPath();
            ctx.roundRect(V_WIDTH - 250, barY - 35, 190, 70, 35);
            ctx.fill();
            ctx.strokeStyle = '#2b6562';
            ctx.lineWidth = 3.5;
            ctx.stroke();

            ctx.fillStyle = '#f57f17';
            ctx.font = 'bold 30px Fredoka, sans-serif';
            ctx.fillText(`⭐ ${this.userData.points || 0}`, V_WIDTH - 155, barY + 2);

            // Category Tab selector
            const cat = window.CATEGORIES[this.currentCategoryIndex] || window.CATEGORIES[0];
            const tabW = 180;
            const tabY = 220;
            const startTabX = (V_WIDTH - (window.CATEGORIES.length * tabW)) / 2;

            window.CATEGORIES.forEach((c, idx) => {
                const tx = startTabX + idx * tabW;
                const isSel = idx === this.currentCategoryIndex;

                ctx.fillStyle = isSel ? '#ffffff' : 'rgba(255, 255, 255, 0.4)';
                ctx.beginPath();
                ctx.roundRect(tx + 5, tabY, tabW - 10, 60, 20);
                ctx.fill();

                ctx.fillStyle = isSel ? '#2b5c59' : '#ffffff';
                ctx.font = 'bold 26px Fredoka, sans-serif';
                ctx.fillText(c.title, tx + tabW / 2, tabY + 32);

                this.registerButton(tx + 5, tabY, tabW - 10, 60, () => {
                    window.soundManager.playClick();
                    this.currentCategoryIndex = idx;
                });
            });

            // Grid of Levels in Category
            const gridX = 80;
            const gridY = 340;
            const cols = 4;
            const rows = 5;
            const cellW = (V_WIDTH - 160) / cols;
            const cellH = 190;

            const startLvl = cat.start;
            const endLvl = cat.end;

            for (let i = 0; i < (endLvl - startLvl + 1); i++) {
                const lvl = startLvl + i;
                const col = i % cols;
                const row = Math.floor(i / cols);

                const cx = gridX + col * cellW + cellW / 2;
                const cy = gridY + row * cellH + 60;

                const isUnlocked = lvl <= this.userData.highestUnlocked;
                const isCompleted = this.userData.completedLevels.includes(lvl);

                // Level Card Box
                const cardSize = 140;
                ctx.save();
                ctx.translate(cx, cy);

                if (isCompleted) {
                    if (assets.block_happy_green) {
                        ctx.drawImage(assets.block_happy_green, -cardSize / 2, -cardSize / 2, cardSize, cardSize);
                    } else {
                        ctx.fillStyle = '#8bc34a';
                        ctx.beginPath();
                        ctx.roundRect(-cardSize / 2, -cardSize / 2, cardSize, cardSize, 24);
                        ctx.fill();
                    }
                } else if (isUnlocked) {
                    if (assets.block_happy_white) {
                        ctx.drawImage(assets.block_happy_white, -cardSize / 2, -cardSize / 2, cardSize, cardSize);
                    } else {
                        ctx.fillStyle = '#ffffff';
                        ctx.beginPath();
                        ctx.roundRect(-cardSize / 2, -cardSize / 2, cardSize, cardSize, 24);
                        ctx.fill();
                    }
                } else {
                    // Locked dark card
                    ctx.fillStyle = '#2c3e50';
                    ctx.beginPath();
                    ctx.roundRect(-cardSize / 2, -cardSize / 2, cardSize, cardSize, 24);
                    ctx.fill();
                    // Sad lock face
                    ctx.fillStyle = '#ffffff';
                    ctx.font = 'bold 32px Fredoka, sans-serif';
                    ctx.fillText('🔒', 0, -5);
                }

                // Level Number (Below the card)
                ctx.fillStyle = isUnlocked ? '#2b5c59' : '#7f8c8d';
                ctx.font = 'bold 30px Fredoka, sans-serif';
                ctx.fillText(`Level ${lvl}`, 0, cardSize / 2 + 25);

                // Status Text / Badge
                ctx.font = 'bold 22px Fredoka, sans-serif';
                if (isCompleted) {
                    ctx.fillStyle = '#2e7d32';
                    ctx.fillText('completed', 0, cardSize / 2 + 55);
                } else if (isUnlocked) {
                    ctx.fillStyle = '#e67e22';
                    ctx.fillText('play', 0, cardSize / 2 + 55);
                } else {
                    ctx.fillStyle = '#95a5a6';
                    ctx.fillText('locked', 0, cardSize / 2 + 55);
                }

                ctx.restore();

                if (isUnlocked) {
                    this.registerButton(cx - cardSize / 2, cy - cardSize / 2, cardSize, cardSize + 40, () => {
                        window.soundManager.playClick();
                        this.initLevel(lvl);
                    });
                }
            }

            ctx.restore();
        }

        drawBottomNav(ctx) {
            const navY = 1810;
            ctx.save();

            // Bottom grass navigation dock
            ctx.fillStyle = '#5fad52';
            ctx.beginPath();
            ctx.roundRect(0, 1720, V_WIDTH, 200, [54, 54, 0, 0]);
            ctx.fill();

            // Wave highlight
            ctx.fillStyle = '#78c96c';
            ctx.beginPath();
            ctx.roundRect(0, 1720, V_WIDTH, 20, [54, 54, 0, 0]);
            ctx.fill();

            const charObj = CHARACTERS.find(c => c.id === this.companion.charId) || CHARACTERS[0];
            const profileIcon = assets[charObj.avatar] || assets.avatar_beaver;

            const items = [
                { id: 'shop', label: 'Shop', icon: assets.nav_shop },
                { id: 'levels', label: 'Levels', icon: assets.nav_news },
                { id: 'wheel', label: 'Wheel', icon: assets.nav_wheel },
                { id: 'profile', label: 'Mascot', icon: profileIcon },
                { id: 'home', label: 'Home', icon: assets.btn_circle_back }
            ];

            const spacing = V_WIDTH / items.length;
            items.forEach((item, idx) => {
                const ix = spacing * idx + spacing / 2;
                const isActive = (item.id === 'shop' && this.state === 'SHOP') ||
                                 (item.id === 'levels' && this.state === 'LEVEL_SELECT') ||
                                 (item.id === 'wheel' && this.state === 'SPIN_WHEEL') ||
                                 (item.id === 'profile' && this.state === 'PROFILE') ||
                                 (item.id === 'home' && this.state === 'HOME');

                // Elevated circle
                ctx.fillStyle = isActive ? '#ffffff' : 'rgba(255, 255, 255, 0.9)';
                ctx.beginPath();
                ctx.arc(ix, navY - 20, isActive ? 48 : 42, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = isActive ? '#ffeb3b' : '#388e3c';
                ctx.lineWidth = isActive ? 4.5 : 3;
                ctx.stroke();

                if (item.icon) {
                    const sz = item.id === 'wheel' ? 66 : (item.id === 'profile' ? 62 : 54);
                    ctx.drawImage(item.icon, ix - sz / 2, navY - 20 - sz / 2, sz, sz);
                }

                // Label below
                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 24px Fredoka, sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(item.label, ix, navY + 42);

                this.registerButton(ix - 55, navY - 65, 110, 135, () => {
                    window.soundManager.playClick();
                    if (item.id === 'shop') this.state = 'SHOP';
                    else if (item.id === 'levels') this.state = 'LEVEL_SELECT';
                    else if (item.id === 'wheel') this.openSpinWheel();
                    else if (item.id === 'profile') this.state = 'PROFILE';
                    else if (item.id === 'home') this.state = 'HOME';
                });
            });
            ctx.restore();
        }

        openSpinWheel() {
            this.state = 'SPIN_WHEEL';
            this.wheel.spinning = false;
            this.wheel.reward = null;
        }

        renderSpinWheelScreen(ctx) {
            ctx.save();
            ctx.fillStyle = 'rgba(20, 50, 50, 0.75)';
            ctx.fillRect(0, 0, V_WIDTH, V_HEIGHT);

            const cardW = 900;
            const cardH = 1400;
            const cardX = (V_WIDTH - cardW) / 2;
            const cardY = (V_HEIGHT - cardH) / 2;

            ctx.fillStyle = '#81c7c5';
            ctx.beginPath();
            ctx.roundRect(cardX, cardY, cardW, cardH, 48);
            ctx.fill();

            // Close button
            if (assets.btn_circle_close) {
                ctx.drawImage(assets.btn_circle_close, cardX + cardW - 100, cardY + 40, 70, 70);
                this.registerButton(cardX + cardW - 100, cardY + 40, 70, 70, () => {
                    window.soundManager.playClick();
                    this.state = 'PLAYING';
                });
            }

            // Title
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 54px Fredoka, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('spin the wheel and get', V_WIDTH / 2, cardY + 120);
            ctx.fillText('free boosters & coins', V_WIDTH / 2, cardY + 190);

            // Wheel Graphic
            const wheelX = V_WIDTH / 2;
            const wheelY = cardY + 680;
            const wheelRadius = 360;

            ctx.save();
            ctx.translate(wheelX, wheelY);
            ctx.rotate(this.wheel.angle);

            if (assets.wheel_inner) {
                ctx.drawImage(assets.wheel_inner, -wheelRadius, -wheelRadius, wheelRadius * 2, wheelRadius * 2);
            } else {
                // Draw 8 slice colored wheel
                const slices = ['#e91e63', '#9c27b0', '#2196f3', '#00bcd4', '#4caf50', '#8bc34a', '#ffeb3b', '#ff9800'];
                for (let s = 0; s < 8; s++) {
                    ctx.beginPath();
                    ctx.moveTo(0, 0);
                    ctx.arc(0, 0, wheelRadius, s * Math.PI / 4, (s + 1) * Math.PI / 4);
                    ctx.closePath();
                    ctx.fillStyle = slices[s];
                    ctx.fill();
                }
            }
            ctx.restore();

            // Pointer Pin at Top
            ctx.fillStyle = '#f44336';
            ctx.beginPath();
            ctx.moveTo(wheelX - 25, wheelY - wheelRadius + 30);
            ctx.lineTo(wheelX + 25, wheelY - wheelRadius + 30);
            ctx.lineTo(wheelX, wheelY - wheelRadius + 75);
            ctx.closePath();
            ctx.fill();

            // Center circle hit target
            const centerSize = 220;

            // Spin & Quit action buttons at bottom
            const btnW = 340;
            const btnH = 120;
            const btnY = cardY + 1180;

            // Spin Green Button
            const spinX = V_WIDTH / 2 - btnW / 2;
            if (assets.btn_spin_green) {
                ctx.drawImage(assets.btn_spin_green, spinX, btnY, btnW, btnH);
            }
            this.registerButton(spinX, btnY, btnW, btnH, () => {
                this.startWheelSpin();
            });

            // Center circle also clickable
            this.registerButton(wheelX - centerSize / 2, wheelY - centerSize / 2, centerSize, centerSize, () => {
                this.startWheelSpin();
            });

            // Reward modal if spin completed
            if (this.wheel.reward) {
                ctx.fillStyle = 'rgba(0,0,0,0.5)';
                ctx.fillRect(0, 0, V_WIDTH, V_HEIGHT);

                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.roundRect(V_WIDTH / 2 - 300, V_HEIGHT / 2 - 200, 600, 400, 36);
                ctx.fill();

                ctx.fillStyle = '#2b5c59';
                ctx.font = 'bold 52px Fredoka, sans-serif';
                ctx.fillText('You won!', V_WIDTH / 2, V_HEIGHT / 2 - 80);

                ctx.fillStyle = '#f39c12';
                ctx.font = 'bold 64px Fredoka, sans-serif';
                ctx.fillText(`+${this.wheel.reward} Coins!`, V_WIDTH / 2, V_HEIGHT / 2 + 10);

                if (assets.btn_next) {
                    ctx.drawImage(assets.btn_next, V_WIDTH / 2 - 150, V_HEIGHT / 2 + 80, 300, 90);
                    this.registerButton(V_WIDTH / 2 - 150, V_HEIGHT / 2 + 80, 300, 90, () => {
                        window.soundManager.playClick();
                        this.wheel.reward = null;
                        this.state = 'PLAYING';
                    });
                }
            }

            ctx.restore();
        }

        startWheelSpin() {
            if (this.wheel.spinning) return;
            this.wheel.spinning = true;
            this.wheel.angularVel = 20 + Math.random() * 15; // fast initial speed
            window.soundManager.playBallLift();
        }

        finishWheelSpin() {
            // Reward coins
            const prizes = [50, 100, 20, 150, 40, 200, 75, 250];
            const sliceAngle = (Math.PI * 2) / prizes.length;
            const normalizedAngle = (this.wheel.angle % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
            const prizeIndex = Math.floor(normalizedAngle / sliceAngle) % prizes.length;

            const prize = prizes[prizeIndex] || 100;
            this.wheel.reward = prize;
            this.userData.coins += prize;
            this.saveUserData();

            window.soundManager.playLevelWin();
            this.particles.emitConfetti(V_WIDTH / 2, V_HEIGHT / 2, 120);
        }

        renderProfileScreen(ctx) {
            ctx.save();
            ctx.fillStyle = '#81c7c5';
            ctx.fillRect(0, 0, V_WIDTH, V_HEIGHT);

            // Header Back Button
            const barY = 110;
            if (assets.btn_circle_back) {
                ctx.drawImage(assets.btn_circle_back, 45, barY - 45, 90, 90);
                this.registerButton(45, barY - 45, 90, 90, () => {
                    window.soundManager.playClick();
                    this.state = 'PLAYING';
                });
            }

            // Companion Character showcase at top
            const charObj = CHARACTERS.find(c => c.id === this.companion.charId) || CHARACTERS[0];
            const img = assets[charObj.normal];
            if (img) {
                const cw = 280;
                const ch = (img.height / img.width) * cw;
                ctx.drawImage(img, V_WIDTH / 2 - cw / 2, 240, cw, ch);
            }

            // Title "Profile"
            ctx.fillStyle = '#2b5c59';
            ctx.font = 'bold 72px Fredoka, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('Profile', V_WIDTH / 2, 540);

            // Sound & Music Toggles Card
            const cardW = 760;
            const cardH = 320;
            const cardX = (V_WIDTH - cardW) / 2;
            const cardY = 620;

            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.roundRect(cardX, cardY, cardW, cardH, 36);
            ctx.fill();

            // Sound Row
            ctx.fillStyle = '#2b5c59';
            ctx.font = 'bold 44px Fredoka, sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText('Sound', cardX + 70, cardY + 90);

            const soundToggleImg = window.soundManager.soundEnabled ? assets.toggle_on : assets.toggle_off;
            if (soundToggleImg) {
                ctx.drawImage(soundToggleImg, cardX + cardW - 250, cardY + 50, 180, 80);
                this.registerButton(cardX + cardW - 250, cardY + 50, 180, 80, () => {
                    window.soundManager.setSound(!window.soundManager.soundEnabled);
                });
            }

            // Music Row
            ctx.fillText('Music', cardX + 70, cardY + 230);
            const musicToggleImg = window.soundManager.musicEnabled ? assets.toggle_on : assets.toggle_off;
            if (musicToggleImg) {
                ctx.drawImage(musicToggleImg, cardX + cardW - 250, cardY + 190, 180, 80);
                this.registerButton(cardX + cardW - 250, cardY + 190, 180, 80, () => {
                    window.soundManager.setMusic(!window.soundManager.musicEnabled);
                });
            }

            // "Choose your character"
            ctx.fillStyle = '#2b5c59';
            ctx.font = 'bold 44px Fredoka, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Choose your character', V_WIDTH / 2, 1000);

            // Character Avatar Selector Grid (3 columns centered in 1080)
            const startX = 260;
            const startY = 1140;
            const size = 190;
            const colSpacing = 280;

            CHARACTERS.forEach((c, idx) => {
                const col = idx % 3;
                const row = Math.floor(idx / 3);
                const ax = startX + col * colSpacing;
                const ay = startY + row * 230;

                const avatarImg = assets[c.avatar];
                if (avatarImg) {
                    ctx.drawImage(avatarImg, ax - size / 2, ay - size / 2, size, size);
                }

                // If selected, draw checkmark
                if (this.companion.charId === c.id && assets.icon_check) {
                    ctx.drawImage(assets.icon_check, ax + size / 2 - 50, ay + size / 2 - 50, 60, 60);
                }

                this.registerButton(ax - size / 2, ay - size / 2, size, size, () => {
                    window.soundManager.playClick();
                    this.companion.charId = c.id;
                    this.userData.selectedChar = c.id;
                    this.saveUserData();
                    this.companion.jumpVel = -14;
                });
            });

            this.drawBottomNav(ctx);
            ctx.restore();
        }

        renderShopScreen(ctx) {
            ctx.save();
            ctx.fillStyle = '#81c7c5';
            ctx.fillRect(0, 0, V_WIDTH, V_HEIGHT);

            // Header Back
            const barY = 110;
            if (assets.btn_circle_back) {
                ctx.drawImage(assets.btn_circle_back, 45, barY - 45, 90, 90);
                this.registerButton(45, barY - 45, 90, 90, () => {
                    window.soundManager.playClick();
                    this.state = 'PLAYING';
                });
            }

            // Shop title
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 64px Fredoka, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Shop', V_WIDTH / 2, barY);

            // Shop awning
            if (assets.shop_awning) {
                ctx.drawImage(assets.shop_awning, V_WIDTH / 2 - 380, 220, 760, 260);
            }

            // Coin packs list
            const packs = [
                { coins: 250, label: 'Small Pack', icon: assets.coin_face },
                { coins: 500, label: 'Gold Stack', icon: assets.gold_bars },
                { coins: 1000, label: 'Mega Chest', icon: assets.chest }
            ];

            const cardY = 520;
            packs.forEach((p, idx) => {
                const py = cardY + idx * 180;
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.roundRect(140, py, 800, 140, 28);
                ctx.fill();

                if (p.icon) {
                    ctx.drawImage(p.icon, 180, py + 20, 100, 100);
                }

                ctx.fillStyle = '#2b5c59';
                ctx.font = 'bold 44px Fredoka, sans-serif';
                ctx.textAlign = 'left';
                ctx.fillText(`${p.coins} coins`, 320, py + 80);

                // Free / Claim Button
                ctx.fillStyle = '#4caf50';
                ctx.beginPath();
                ctx.roundRect(700, py + 30, 200, 80, 24);
                ctx.fill();

                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 34px Fredoka, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('GET', 800, py + 80);

                this.registerButton(700, py + 30, 200, 80, () => {
                    window.soundManager.playCoin();
                    this.userData.coins += p.coins;
                    this.saveUserData();
                    this.particles.emitConfetti(800, py + 80, 60);
                });
            });

            // Watch Video for Free Coins button
            if (assets.btn_free_coins) {
                const btnW = 760;
                const btnH = 160;
                ctx.drawImage(assets.btn_free_coins, V_WIDTH / 2 - btnW / 2, 1140, btnW, btnH);
                this.registerButton(V_WIDTH / 2 - btnW / 2, 1140, btnW, btnH, () => {
                    window.soundManager.playCoin();
                    this.userData.coins += 100;
                    this.saveUserData();
                    this.particles.emitConfetti(V_WIDTH / 2, 1200, 80);
                    this.showCompanionSpeech("+100 Free Coins!");
                });
            }

            this.drawBottomNav(ctx);
            ctx.restore();
        }

        openPauseModal() {
            this.state = 'PAUSED';
        }

        // --- BUTTON INTERACTION SYSTEM ---
        registerButton(x, y, w, h, onClick) {
            this.buttons.push({ x, y, w, h, onClick });
        }

        setupEventListeners() {
            const handlePointer = (e) => {
                e.preventDefault();
                window.soundManager.initContext();

                const rect = this.canvas.getBoundingClientRect();
                const scaleX = V_WIDTH / rect.width;
                const scaleY = V_HEIGHT / rect.height;

                const clientX = e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
                const clientY = e.clientY || (e.touches && e.touches[0] ? e.touches[0].clientY : 0);

                const x = (clientX - rect.left) * scaleX;
                const y = (clientY - rect.top) * scaleY;

                // Test clickable buttons in reverse order (topmost first)
                for (let i = this.buttons.length - 1; i >= 0; i--) {
                    const btn = this.buttons[i];
                    if (x >= btn.x && x <= btn.x + btn.w && y >= btn.y && y <= btn.y + btn.h) {
                        btn.onClick();
                        return;
                    }
                }
            };

            this.canvas.addEventListener('pointerdown', handlePointer);
        }
    }

    // --- STARTUP ---
    window.addEventListener('DOMContentLoaded', () => {
        const loadingText = document.getElementById('loading-text');
        const loadingOverlay = document.getElementById('loading-overlay');

        preloadAssets(
            (progress) => {
                if (loadingText) {
                    loadingText.textContent = `Loading... ${Math.floor(progress * 100)}%`;
                }
            },
            () => {
                if (loadingOverlay) {
                    loadingOverlay.style.display = 'none';
                }
                window.game = new BallSortGame();

                // Test modes for automated verification
                const params = new URLSearchParams(window.location.search);
                const test = params.get('test');
                if (test === 'play') {
                    window.game.state = 'PLAYING';
                } else if (test === 'home') {
                    window.game.state = 'HOME';
                } else if (test === 'settings') {
                    window.game.openSettingsModal();
                } else if (test === 'lift') {
                    window.game.state = 'PLAYING';
                    window.game.handleTubeClick(0);
                } else if (test === 'multilift') {
                    window.game.state = 'PLAYING';
                    window.game.tubes = [[0, 1, 1, 1], [0, 0, 0, 1], []];
                    window.game.handleTubeClick(0);
                } else if (test === 'win') {
                    window.game.handleLevelWin();
                } else if (test === 'select') {
                    window.game.state = 'LEVEL_SELECT';
                } else if (test === 'wheel') {
                    window.game.openSpinWheel();
                } else if (test === 'profile') {
                    window.game.state = 'PROFILE';
                } else if (test === 'shop') {
                    window.game.state = 'SHOP';
                } else if (test === 'pause') {
                    window.game.state = 'PAUSED';
                } else if (test === 'level5') {
                    window.game.state = 'PLAYING';
                    window.game.initLevel(5);
                }
            }
        );
    });

})();
