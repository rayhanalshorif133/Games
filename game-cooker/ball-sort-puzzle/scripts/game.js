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
        btn_free_coins: 'assets/btn_free_coins.png'
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

            // State management: PLAYING, PAUSED, LEVEL_WIN, LEVEL_SELECT, SPIN_WHEEL, PROFILE, SHOP
            this.state = 'PLAYING';
            this.previousState = 'PLAYING';

            // User Persistent Data
            this.loadUserData();

            // Gameplay State
            this.currentLevel = this.userData.currentLevel || 1;
            this.tubes = []; // Array of arrays containing color IDs
            this.selectedTube = null; // Currently lifted ball index
            this.moveHistory = []; // Stack of moves { from, to, ball }

            // Active Ball Transfer Animation
            this.activeAnim = null; // { ballColor, fromTube, toTube, progress, duration, path... }
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

            // Start Main Loop
            this.lastTime = performance.now();
            requestAnimationFrame(this.gameLoop.bind(this));
        }

        loadUserData() {
            const def = {
                currentLevel: 1,
                highestUnlocked: 1,
                coins: 250,
                selectedChar: 'beaver',
                stars: {}, // levelNum -> stars (1-3)
                completedLevels: []
            };
            try {
                const data = localStorage.getItem('bsp_userdata');
                this.userData = data ? Object.assign(def, JSON.parse(data)) : def;
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
            this.activeAnim = null;
            this.tubeBounce = {};
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
        handleTubeClick(tubeIndex) {
            if (this.state !== 'PLAYING' || this.activeAnim) return;

            const tube = this.tubes[tubeIndex];

            // Case 1: No tube currently selected -> Lift top ball
            if (this.selectedTube === null) {
                if (tube.length === 0) {
                    // Empty tube, cannot select
                    window.soundManager.playError();
                    this.triggerScreenShake(4);
                    return;
                }

                // Lift top ball
                this.selectedTube = tubeIndex;
                window.soundManager.playBallLift();
                this.triggerTubeBounce(tubeIndex, 0.95, 1.06);
                return;
            }

            // Case 2: Clicking the same tube -> Put ball back down
            if (this.selectedTube === tubeIndex) {
                this.selectedTube = null;
                window.soundManager.playBallDrop();
                this.triggerTubeBounce(tubeIndex, 1.05, 0.95);
                return;
            }

            // Case 3: Clicking another tube -> Check if move is valid
            const srcTubeIndex = this.selectedTube;
            const srcTube = this.tubes[srcTubeIndex];
            const dstTube = this.tubes[tubeIndex];
            const movingBall = srcTube[srcTube.length - 1];

            const isValidMove = (dstTube.length < 4) &&
                (dstTube.length === 0 || dstTube[dstTube.length - 1] === movingBall);

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

            // Valid Move! Execute transfer animation
            this.selectedTube = null;
            srcTube.pop(); // Remove from source

            // Record move in undo stack
            this.moveHistory.push({ from: srcTubeIndex, to: tubeIndex, ball: movingBall });

            const srcLayout = this.tubeLayouts[srcTubeIndex];
            const dstLayout = this.tubeLayouts[tubeIndex];
            const targetSlotIndex = dstTube.length; // target level

            const startX = srcLayout.cx;
            const startY = srcLayout.hoverY;
            const endX = dstLayout.cx;
            const endY = dstLayout.slots[targetSlotIndex];

            const peakY = Math.min(srcLayout.hoverY, dstLayout.hoverY) - 120;

            this.activeAnim = {
                ball: movingBall,
                from: srcTubeIndex,
                to: tubeIndex,
                startX: startX,
                startY: startY,
                controlX: (startX + endX) / 2,
                controlY: peakY,
                endX: endX,
                endY: endY,
                dropStartY: dstLayout.mouthY,
                t: 0,
                duration: 0.38, // seconds
                phase: 'ARC' // 'ARC' then 'DROP'
            };

            window.soundManager.playBallLift();
        }

        finishMoveAnimation() {
            if (!this.activeAnim) return;

            const toIndex = this.activeAnim.to;
            const ball = this.activeAnim.ball;
            this.tubes[toIndex].push(ball);

            // Landing sound and impact bounce
            window.soundManager.playBallDrop();
            this.triggerTubeBounce(toIndex, 1.15, 0.85);

            // Small dust bubbles at tube bottom
            const dstLayout = this.tubeLayouts[toIndex];
            this.particles.emitBubbles(dstLayout.cx, dstLayout.y + dstLayout.h - 20, 8);

            // Check if this destination tube is newly completed (4 balls of same color)
            if (this.tubes[toIndex].length === 4 && this.tubes[toIndex].every(b => b === ball)) {
                window.soundManager.playTubeComplete();
                this.particles.emitSparkles(dstLayout.cx, dstLayout.y + 30, 35, BALL_COLORS_MAP[ball].color);
                this.companion.jumpVel = -15; // Companion jumps excitedly!
            }

            this.activeAnim = null;

            // Check win condition
            this.checkWinCondition();
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

            // Give rewards
            const rewardCoins = 25;
            this.userData.coins += rewardCoins;

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
            if (this.moveHistory.length === 0 || this.activeAnim || this.state !== 'PLAYING') return;

            const lastMove = this.moveHistory.pop();
            const { from, to, ball } = lastMove;

            // Remove ball from 'to' and place back into 'from'
            this.selectedTube = null;
            const b = this.tubes[to].pop();
            this.tubes[from].push(b);

            window.soundManager.playBallDrop();
            this.triggerTubeBounce(from, 1.1, 0.9);
        }

        addExtraTubeBooster() {
            if (this.state !== 'PLAYING' || this.activeAnim) return;

            // Check if player has already added extra tube (maximum 1 extra tube)
            if (this.extraTubeAdded) {
                this.showCompanionSpeech("Already added!");
                return;
            }

            if (this.userData.coins >= 50) {
                this.userData.coins -= 50;
                this.saveUserData();
                this.extraTubeAdded = true;
                this.tubes.push([]);
                this.calculateTubeLayouts();
                window.soundManager.playCoin();
                this.particles.emitSparkles(V_WIDTH / 2, V_HEIGHT / 2, 40, '#ffeb3b');
                this.showCompanionSpeech("+1 Extra Tube!");
            } else {
                window.soundManager.playError();
                this.showCompanionSpeech("Need 50 coins!");
            }
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

            // Ball Transfer Animation
            if (this.activeAnim) {
                const anim = this.activeAnim;
                anim.t += dt / anim.duration;

                if (anim.phase === 'ARC') {
                    if (anim.t >= 0.75) {
                        // Switch to drop phase
                        anim.phase = 'DROP';
                    }
                }

                if (anim.t >= 1.0) {
                    this.finishMoveAnimation();
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

            // Right: Coin Counter Capsule
            const coinX = V_WIDTH - 150;
            ctx.save();
            // Pill background
            ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
            ctx.beginPath();
            ctx.roundRect(coinX - 120, barY - 35, 180, 70, 35);
            ctx.fill();

            // Coin text
            ctx.fillStyle = '#f39c12';
            ctx.font = 'bold 36px Fredoka, sans-serif';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillText(`${this.userData.coins}`, coinX - 100, barY + 2);

            // Coin icon with plus
            if (assets.coin_plus) {
                ctx.drawImage(assets.coin_plus, coinX + 15, barY - 40, 80, 80);
                this.registerButton(coinX - 120, barY - 35, 220, 70, () => {
                    window.soundManager.playClick();
                    this.openSpinWheel();
                });
            }
            ctx.restore();
        }

        drawBottomBar(ctx) {
            const barY = 1810;
            const items = [
                { id: 'replay', label: 'replay', icon: assets.icon_replay, x: 500 },
                { id: 'undo', label: 'undo', icon: assets.icon_undo, x: 670 },
                { id: 'skip', label: 'skip', icon: assets.icon_skip, x: 840 }
            ];

            ctx.save();
            for (const it of items) {
                const bx = it.x;
                const by = barY;

                // Draw icon
                if (it.icon) {
                    const iconSize = 72;
                    ctx.drawImage(it.icon, bx - iconSize / 2, by - iconSize / 2 - 14, iconSize, iconSize);
                }

                // Label
                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 26px Fredoka, sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'top';
                ctx.fillText(it.label, bx, by + 26);

                // Button hit target
                this.registerButton(bx - 60, by - 60, 120, 130, () => {
                    window.soundManager.playClick();
                    if (it.id === 'replay') {
                        this.initLevel(this.currentLevel);
                    } else if (it.id === 'undo') {
                        this.undoMove();
                    } else if (it.id === 'skip') {
                        this.addExtraTubeBooster();
                    }
                });
            }
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

                // If tube is currently suggested by Hint, draw glowing ring
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

                // 2. Draw Balls inside tube
                for (let bIndex = 0; bIndex < tube.length; bIndex++) {
                    // If this ball is currently lifted by selection, draw it floating
                    if (this.selectedTube === i && bIndex === tube.length - 1) {
                        const hoverFloat = Math.sin(Date.now() * 0.008) * 6;
                        this.drawBall(ctx, layout.cx, layout.hoverY + hoverFloat, layout.ballSize, tube[bIndex], true);
                    } else {
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

            // Draw active flying ball animation
            if (this.activeAnim) {
                this.drawActiveBallAnimation(ctx);
            }
        }

        drawBall(ctx, x, y, size, colorId, isHovering = false) {
            ctx.save();
            const ballInfo = BALL_COLORS_MAP[colorId] || BALL_COLORS_MAP[0];
            const img = assets[ballInfo.key];

            if (isHovering) {
                // Soft glow halo
                ctx.shadowColor = ballInfo.color;
                ctx.shadowBlur = 24;
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
                grad.addColorStop(0, 'rgba(255,255,255,0.7)');
                grad.addColorStop(0.5, 'rgba(255,255,255,0.1)');
                grad.addColorStop(1, 'rgba(0,0,0,0.25)');
                ctx.fillStyle = grad;
                ctx.fill();
            }
            ctx.restore();
        }

        drawActiveBallAnimation(ctx) {
            const anim = this.activeAnim;
            let curX = anim.startX;
            let curY = anim.startY;
            let scaleX = 1.0;
            let scaleY = 1.0;

            const t = anim.t;

            if (t <= 0.65) {
                // Quadratic Bezier Arc over tubes
                const arcT = t / 0.65;
                const u = 1 - arcT;
                curX = u * u * anim.startX + 2 * u * arcT * anim.controlX + arcT * arcT * anim.endX;
                curY = u * u * anim.startY + 2 * u * arcT * anim.controlY + arcT * arcT * anim.dropStartY;
            } else {
                // Drop straight down into tube with acceleration
                curX = anim.endX;
                const dropT = (t - 0.65) / 0.35;
                const easedDrop = dropT * dropT; // quadratic ease in (gravity)
                curY = anim.dropStartY + (anim.endY - anim.dropStartY) * easedDrop;

                // Squash & stretch right near the end
                if (dropT > 0.85) {
                    scaleX = 1.2;
                    scaleY = 0.8;
                }
            }

            const size = this.tubeLayouts[anim.to].ballSize;
            ctx.save();
            ctx.translate(curX, curY);
            ctx.scale(scaleX, scaleY);
            this.drawBall(ctx, 0, 0, size, anim.ball, true);
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
            ctx.font = 'bold 58px Fredoka, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(`Level ${this.currentLevel}`, V_WIDTH / 2, cardY + 330);
            ctx.fillText(`completed`, V_WIDTH / 2, cardY + 400);

            // Reward badge (+25 coins)
            ctx.fillStyle = '#f39c12';
            ctx.font = 'bold 38px Fredoka, sans-serif';
            ctx.fillText(`+25 Coins!`, V_WIDTH / 2, cardY + 490);

            // Buttons: "next" (green) and "quit" (coral red)
            const btnW = 310;
            const btnH = 115;
            const btnY = cardY + 620;

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

            // Quit Button
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
                this.state = 'LEVEL_SELECT';
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
                this.state = 'LEVEL_SELECT';
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
                    window.soundManager.playClick();
                    this.state = 'PROFILE';
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
                    this.state = 'PLAYING';
                });
            }

            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 54px Fredoka, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('Levels', V_WIDTH / 2, barY);

            // Coins counter
            ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
            ctx.beginPath();
            ctx.roundRect(V_WIDTH - 240, barY - 35, 180, 70, 35);
            ctx.fill();
            ctx.fillStyle = '#f39c12';
            ctx.font = 'bold 36px Fredoka, sans-serif';
            ctx.fillText(`${this.userData.coins}`, V_WIDTH - 150, barY + 2);

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

            // Bottom Navigation bar
            this.drawBottomNav(ctx);

            ctx.restore();
        }

        drawBottomNav(ctx) {
            const navY = 1810;
            ctx.save();

            // Bottom grass navigation pill
            ctx.fillStyle = '#6cb75e';
            ctx.beginPath();
            ctx.roundRect(0, 1730, V_WIDTH, 190, [48, 48, 0, 0]);
            ctx.fill();

            const charObj = CHARACTERS.find(c => c.id === this.companion.charId) || CHARACTERS[0];
            const profileIcon = assets[charObj.avatar] || assets.avatar_beaver;

            const items = [
                { id: 'shop', icon: assets.nav_shop },
                { id: 'levels', icon: assets.nav_news },
                { id: 'wheel', icon: assets.nav_wheel },
                { id: 'trophy', icon: assets.nav_trophy },
                { id: 'profile', icon: profileIcon }
            ];

            const spacing = V_WIDTH / items.length;
            items.forEach((item, idx) => {
                const ix = spacing * idx + spacing / 2;
                if (item.icon) {
                    const sz = item.id === 'wheel' ? 100 : (item.id === 'profile' ? 84 : 74);
                    ctx.drawImage(item.icon, ix - sz / 2, navY - sz / 2, sz, sz);
                }
                this.registerButton(ix - 55, navY - 60, 110, 120, () => {
                    window.soundManager.playClick();
                    if (item.id === 'shop') this.state = 'SHOP';
                    else if (item.id === 'levels') this.state = 'LEVEL_SELECT';
                    else if (item.id === 'wheel') this.openSpinWheel();
                    else if (item.id === 'profile') this.state = 'PROFILE';
                    else if (item.id === 'trophy') this.openSpinWheel();
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
                if (test === 'lift') {
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
                    window.game.initLevel(5);
                }
            }
        );
    });

})();
