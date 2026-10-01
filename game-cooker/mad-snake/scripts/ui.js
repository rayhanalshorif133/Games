// UI System for Mad Snake
// Renders HUD, Controls (Swipe Pad / Virtual Gamepad), Modals, and Action Buttons

class UI {
    constructor(game) {
        this.game = game;
        this.controlMode = 'button'; // 'button' (DEFAULT) or 'joystick'
        this.activeModal = null; // null, 'pause', 'win', 'gameover'
        this.buttonStates = { up: false, down: false, left: false, right: false };
        this.isPointerDown = false;

        // Virtual Analog Joystick
        this.joyBaseX = 540;
        this.joyBaseY = 1665;
        this.joyBaseRadius = 125;
        this.joyKnobRadius = 52;
        this.joyKnobX = 540;
        this.joyKnobY = 1665;
        this.joyActive = false;
        this.activeDirection = null; // 'up', 'down', 'left', 'right'
    }

    setControlMode(mode) {
        if (this.controlMode !== mode) {
            this.controlMode = mode;
            this.game.audio.playClick();
            this.resetControls();
        }
    }

    toggleControlMode() {
        this.setControlMode(this.controlMode === 'button' ? 'joystick' : 'button');
    }

    resetControls() {
        this.buttonStates.up = false;
        this.buttonStates.down = false;
        this.buttonStates.left = false;
        this.buttonStates.right = false;
        this.joyActive = false;
        this.joyKnobX = this.joyBaseX;
        this.joyKnobY = this.joyBaseY;
        this.activeDirection = null;
    }

    update(dt) {
        // Smooth spring physics for joystick knob when released
        if (!this.joyActive) {
            const lerpFactor = Math.min(1, dt * 26);
            this.joyKnobX += (this.joyBaseX - this.joyKnobX) * lerpFactor;
            this.joyKnobY += (this.joyBaseY - this.joyKnobY) * lerpFactor;
            if (Math.hypot(this.joyKnobX - this.joyBaseX, this.joyKnobY - this.joyBaseY) < 1) {
                this.joyKnobX = this.joyBaseX;
                this.joyKnobY = this.joyBaseY;
                this.activeDirection = null;
            }
        }
    }

    showPause() {
        this.activeModal = 'pause';
        this.game.isPaused = true;
        this.game.audio.playClick();
    }

    resume() {
        this.activeModal = null;
        this.game.isPaused = false;
        this.game.audio.playClick();
    }

    showWinModal() {
        this.activeModal = 'win';
        this.game.audio.playWin();
    }

    showGameOverModal() {
        this.activeModal = 'gameover';
        this.game.audio.playGameOver();
    }

    closeModal() {
        this.activeModal = null;
        this.game.audio.playClick();
    }

    handleClick(x, y) {
        return this.handlePointerDown(x, y);
    }

    handlePointerDown(x, y) {
        this.isPointerDown = true;

        // If modal is open, modal handles clicks
        if (this.activeModal) {
            return this.handleModalClick(x, y);
        }

        // Action Bar Buttons (y ~ 1240 to 1360)
        // 1. Controller Mode Toggle Button (x: 50 to 140, y: 1250 to 1340)
        if (Math.hypot(x - 95, y - 1295) < 50) {
            this.toggleControlMode();
            return true;
        }

        // 2. Pause Button (x: 170 to 260, y: 1250 to 1340)
        if (Math.hypot(x - 215, y - 1295) < 50) {
            this.showPause();
            return true;
        }

        // 3. Fireball Boost Button (x: 930 to 1030, y: 1250 to 1350)
        if (Math.hypot(x - 980, y - 1295) < 65) {
            this.game.shootFireball();
            return true;
        }

        // Mode Switch Tabs (y: 1390 to 1465)
        // Button Mode Tab (Left: x: 80 to 520)
        if (y >= 1390 && y <= 1465 && x >= 80 && x <= 520) {
            this.setControlMode('button');
            return true;
        }
        // Joystick Mode Tab (Right: x: 560 to 1000)
        if (y >= 1390 && y <= 1465 && x >= 560 && x <= 1000) {
            this.setControlMode('joystick');
            return true;
        }

        // Controller input area (y: 1470 to 1860)
        if (y >= 1470 && y <= 1860) {
            if (this.controlMode === 'button') {
                return this.handleButtonPad(x, y);
            } else if (this.controlMode === 'joystick') {
                return this.handleJoystickStart(x, y);
            }
        }

        return false;
    }

    handlePointerMove(x, y) {
        if (!this.isPointerDown) return;
        if (this.activeModal) return;

        if (this.controlMode === 'button') {
            if (y >= 1470 && y <= 1860) {
                this.handleButtonPad(x, y);
            }
        } else if (this.controlMode === 'joystick') {
            if (this.joyActive) {
                this.updateJoystick(x, y);
            }
        }
    }

    handlePointerUp(x, y) {
        this.isPointerDown = false;
        this.buttonStates.up = false;
        this.buttonStates.down = false;
        this.buttonStates.left = false;
        this.buttonStates.right = false;
        this.joyActive = false;
    }

    handleButtonPad(x, y) {
        const cx = 540;
        const cy = 1665;
        this.buttonStates.up = false;
        this.buttonStates.down = false;
        this.buttonStates.left = false;
        this.buttonStates.right = false;

        // Up: cx: 540, cy: 1560
        if (Math.abs(x - cx) < 65 && y >= 1500 && y <= 1610) {
            this.buttonStates.up = true;
            this.game.snake.setDirection({ x: 0, y: -1 });
            this.game.audio.playClick();
            return true;
        }
        // Down: cx: 540, cy: 1770
        if (Math.abs(x - cx) < 65 && y >= 1715 && y <= 1825) {
            this.buttonStates.down = true;
            this.game.snake.setDirection({ x: 0, y: 1 });
            this.game.audio.playClick();
            return true;
        }
        // Left: cx: 400, cy: 1665
        if (x >= 345 && x <= 460 && Math.abs(y - cy) < 65) {
            this.buttonStates.left = true;
            this.game.snake.setDirection({ x: -1, y: 0 });
            this.game.audio.playClick();
            return true;
        }
        // Right: cx: 680, cy: 1665
        if (x >= 620 && x <= 735 && Math.abs(y - cy) < 65) {
            this.buttonStates.right = true;
            this.game.snake.setDirection({ x: 1, y: 0 });
            this.game.audio.playClick();
            return true;
        }

        // Broad continuous swipe / radial angle over pad
        const dx = x - cx;
        const dy = y - cy;
        const dist = Math.hypot(dx, dy);
        if (dist >= 35 && dist <= 210) {
            if (Math.abs(dx) > Math.abs(dy)) {
                if (dx > 0) {
                    this.buttonStates.right = true;
                    this.game.snake.setDirection({ x: 1, y: 0 });
                } else {
                    this.buttonStates.left = true;
                    this.game.snake.setDirection({ x: -1, y: 0 });
                }
            } else {
                if (dy > 0) {
                    this.buttonStates.down = true;
                    this.game.snake.setDirection({ x: 0, y: 1 });
                } else {
                    this.buttonStates.up = true;
                    this.game.snake.setDirection({ x: 0, y: -1 });
                }
            }
            this.game.audio.playClick();
            return true;
        }

        return false;
    }

    handleJoystickStart(x, y) {
        const dist = Math.hypot(x - this.joyBaseX, y - this.joyBaseY);
        if (dist <= 180) {
            this.joyActive = true;
            this.updateJoystick(x, y);
            return true;
        }
        return false;
    }

    updateJoystick(x, y) {
        const dx = x - this.joyBaseX;
        const dy = y - this.joyBaseY;
        const dist = Math.hypot(dx, dy);
        const maxRange = 85;

        if (dist > maxRange) {
            this.joyKnobX = this.joyBaseX + (dx / dist) * maxRange;
            this.joyKnobY = this.joyBaseY + (dy / dist) * maxRange;
        } else {
            this.joyKnobX = x;
            this.joyKnobY = y;
        }

        // Deadzone: 22px
        if (dist >= 22) {
            const theta = Math.atan2(dy, dx);
            let dirX = 0, dirY = 0;
            let dirName = '';

            if (theta >= -Math.PI / 4 && theta < Math.PI / 4) {
                dirX = 1; dirY = 0; dirName = 'right';
            } else if (theta >= Math.PI / 4 && theta < 3 * Math.PI / 4) {
                dirX = 0; dirY = 1; dirName = 'down';
            } else if (theta >= -3 * Math.PI / 4 && theta < -Math.PI / 4) {
                dirX = 0; dirY = -1; dirName = 'up';
            } else {
                dirX = -1; dirY = 0; dirName = 'left';
            }

            if (this.activeDirection !== dirName) {
                this.activeDirection = dirName;
                if (this.game.snake && !this.game.isPaused) {
                    this.game.snake.setDirection({ x: dirX, y: dirY });
                }
            }
        } else {
            this.activeDirection = null;
        }
    }

    handleModalClick(x, y) {
        const modal = this.activeModal;
        const cx = 540;

        if (modal === 'pause') {
            // Resume (cy - 60 = 900, h: 80 -> y: 860 - 940)
            if (Math.abs(x - cx) < 230 && y >= 860 && y <= 940) {
                this.resume();
                return true;
            }
            // Restart Run (cy + 50 = 1010, h: 80 -> y: 970 - 1050)
            if (Math.abs(x - cx) < 230 && y >= 970 && y <= 1050) {
                this.activeModal = null;
                this.game.isPaused = false;
                this.game.startEndlessMode();
                this.game.audio.playClick();
                return true;
            }
            // Sound Mute Toggle (cy + 160 = 1120, h: 80 -> y: 1080 to 1160)
            if (Math.abs(x - cx) < 230 && y >= 1080 && y <= 1160) {
                this.game.audio.toggleMute();
                return true;
            }
        } else if (modal === 'win' || modal === 'gameover') {
            // Play Again (cy + 85 = 1045, h: 88 -> y: 1000 to 1090)
            if (Math.abs(x - cx) < 240 && y >= 1000 && y <= 1090) {
                this.activeModal = null;
                this.game.startEndlessMode();
                this.game.audio.playClick();
                return true;
            }
        }

        return true;
    }

    draw(ctx, images) {
        this.drawHeader(ctx, images);
        this.drawActionBar(ctx, images);
        this.drawControlArea(ctx);

        if (this.activeModal) {
            this.drawModal(ctx, images);
        }
    }

    drawHeader(ctx, images) {
        ctx.save();

        if (this.game.isEndless) {
            // Endless Mode HUD
            // 1. Endless Mode Title & Wave
            ctx.fillStyle = '#facc15';
            ctx.font = 'bold 36px "Outfit", sans-serif';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
            ctx.fillText('ENDLESS', 60, 75);

            ctx.fillStyle = '#38bdf8';
            ctx.font = 'bold 24px "Outfit", sans-serif';
            ctx.fillText(`Wave ${this.game.endlessWave} · ${this.game.currentLevel.name}`, 60, 115);

            // Hearts under wave
            for (let i = 0; i < 3; i++) {
                const hx = 60 + i * 42;
                const hy = 150;
                if (i < this.game.lives && images.heart) {
                    ctx.drawImage(images.heart, hx, hy, 34, 34);
                } else {
                    ctx.globalAlpha = 0.25;
                    if (images.heart) ctx.drawImage(images.heart, hx, hy, 34, 34);
                    ctx.globalAlpha = 1.0;
                }
            }

            // 2. Score (Center: x: 540)
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 54px "Outfit", sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.fillText(`Score: ${this.game.score}`, 540, 80);

            // 3. Snake Length & Next Wave Progress
            ctx.textAlign = 'right';
            ctx.textBaseline = 'top';
            ctx.fillStyle = '#4ade80';
            ctx.font = 'bold 34px "Outfit", sans-serif';
            const len = this.game.snake ? this.game.snake.segments.length : 3;
            ctx.fillText(`Length: ${len} 🐍`, 1020, 80);

            const tierScores = [0, 50, 130, 240, 400, 650];
            const nextScore = tierScores[this.game.endlessTier] || 'MAX';
            ctx.fillStyle = '#cbd5e1';
            ctx.font = '22px "Outfit", sans-serif';
            ctx.fillText(`Next: ${nextScore === 'MAX' ? 'MAX CHAOS' : nextScore + ' pts'}`, 1020, 125);

        } else {
            // Story Mode Level HUD
            // 1. Level Name & Hearts (Left: x: 60)
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 38px "Outfit", sans-serif';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
            ctx.fillText(`Level ${this.game.currentLevel.id}`, 60, 80);

            // Hearts under level title
            for (let i = 0; i < 3; i++) {
                const hx = 60 + i * 44;
                const hy = 135;
                if (i < this.game.lives && images.heart) {
                    ctx.drawImage(images.heart, hx, hy, 38, 38);
                } else {
                    ctx.globalAlpha = 0.25;
                    if (images.heart) ctx.drawImage(images.heart, hx, hy, 38, 38);
                    ctx.globalAlpha = 1.0;
                }
            }

            // 2. Score (Center: x: 540)
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 50px "Outfit", sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.fillText(`Score: ${this.game.score}`, 540, 80);

            // 3. Targets (Right: x: 1020)
            const lvl = this.game.currentLevel;
            ctx.textAlign = 'right';
            ctx.textBaseline = 'top';

            // Primary Target (Red text in video: e.g. 9/10 🍎)
            ctx.fillStyle = '#f87171';
            ctx.font = 'bold 38px "Outfit", sans-serif';
            const pText = `${this.game.primaryCollected}/${lvl.primaryTarget.count}`;
            ctx.fillText(pText, 960, 75);
            const pIcon = images[lvl.primaryTarget.type];
            if (pIcon) {
                ctx.drawImage(pIcon, 970, 72, 42, 42);
            }

            // Secondary Target (Green text in video: e.g. 1/2 🍏)
            ctx.fillStyle = '#86efac';
            ctx.font = 'bold 36px "Outfit", sans-serif';
            const sText = `${this.game.secondaryCollected}/${lvl.secondaryTarget.count}`;
            ctx.fillText(sText, 960, 125);
            if (images.apple_green) {
                ctx.drawImage(images.apple_green, 970, 122, 42, 42);
            }
        }

        ctx.restore();
    }

    drawActionBar(ctx, images) {
        ctx.save();

        // 1. Controller Mode Toggle Button (x: 95, y: 1295)
        if (images.btn_gamepad) {
            ctx.drawImage(images.btn_gamepad, 55, 1255, 80, 80);
        }

        // Mode badge at top-right of controller toggle button ('B' for Button, 'J' for Joystick)
        ctx.save();
        ctx.beginPath();
        ctx.arc(125, 1265, 15, 0, Math.PI * 2);
        ctx.fillStyle = this.controlMode === 'button' ? '#22c55e' : '#38bdf8';
        ctx.fill();
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 2.5;
        ctx.stroke();
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 18px "Outfit", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.controlMode === 'button' ? 'B' : 'J', 125, 1265);
        ctx.restore();

        // 2. Pause Button (x: 215, y: 1295)
        if (images.btn_pause) {
            ctx.drawImage(images.btn_pause, 175, 1255, 80, 80);
        }

        // 3. Enemy Respawn Indicator (Center: x: 540, y: 1295)
        const enemy = this.game.enemySnake;
        if (enemy && enemy.isDead && enemy.respawnTimer > 0) {
            const timeSec = Math.ceil(enemy.respawnTimer);
            const strSec = timeSec < 10 ? `0:0${timeSec}` : `0:${timeSec}`;

            ctx.save();
            ctx.translate(450, 1295);

            // Small orange enemy snake icon
            if (images.enemy_head) {
                ctx.drawImage(images.enemy_head, -80, -22, 44, 44);
            }
            if (images.enemy_body) {
                ctx.drawImage(images.enemy_body, -38, -20, 36, 36);
                ctx.drawImage(images.enemy_body, -4, -20, 36, 36);
            }

            // Countdown text in amber
            ctx.fillStyle = '#fbbf24';
            ctx.font = 'bold 36px "Outfit", sans-serif';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillText(strSec, 45, 0);

            ctx.restore();
        }

        // 4. Fireball Boost Button (Right: x: 980, y: 1295)
        const fireCx = 980;
        const fireCy = 1295;
        const radius = 64;

        // Glowing outer pulse if ammo available
        if (this.game.fireAmmo > 0) {
            const pulse = (Math.sin(Date.now() / 200) + 1) * 6;
            ctx.save();
            ctx.shadowColor = '#ea580c';
            ctx.shadowBlur = 24 + pulse;
            ctx.beginPath();
            ctx.arc(fireCx, fireCy, radius + pulse, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(234, 88, 12, 0.4)';
            ctx.fill();
            ctx.restore();
        }

        if (images.btn_fire) {
            ctx.drawImage(images.btn_fire, fireCx - radius, fireCy - radius, radius * 2, radius * 2);
        }

        // Ammo badge at top-right of fire button (e.g. 5, 4, 1)
        const badgeX = fireCx + radius * 0.65;
        const badgeY = fireCy - radius * 0.65;
        ctx.beginPath();
        ctx.arc(badgeX, badgeY, 22, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 26px "Outfit", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.game.fireAmmo.toString(), badgeX, badgeY + 1);

        ctx.restore();
    }

    drawControlArea(ctx) {
        ctx.save();
        const padX = 60;
        const padY = 1380;
        const padW = 960;
        const padH = 480;

        // Controller outer container box
        ctx.fillStyle = '#181a20';
        ctx.beginPath();
        ctx.roundRect(padX, padY, padW, padH, 36);
        ctx.fill();
        ctx.strokeStyle = '#272b36';
        ctx.lineWidth = 3;
        ctx.stroke();

        // 1. Controller Mode Tabs (Button Mode vs Joystick Mode)
        const tabY = 1400;
        const tabH = 58;
        const tabLeftX = 85;
        const tabW = 430;
        const tabRightX = 565;

        // Tab 1: Button Mode (Left, DEFAULT)
        const isBtnActive = this.controlMode === 'button';
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(tabLeftX, tabY, tabW, tabH, 22);
        if (isBtnActive) {
            ctx.fillStyle = '#16a34a';
            ctx.shadowColor = 'rgba(34, 197, 94, 0.45)';
            ctx.shadowBlur = 18;
            ctx.fill();
            ctx.strokeStyle = '#4ade80';
            ctx.lineWidth = 2.5;
            ctx.stroke();
        } else {
            ctx.fillStyle = '#22252e';
            ctx.fill();
            ctx.strokeStyle = '#373b49';
            ctx.lineWidth = 2;
            ctx.stroke();
        }
        ctx.restore();

        // Tab 1 Text
        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = isBtnActive ? 'bold 28px "Outfit", sans-serif' : '500 26px "Outfit", sans-serif';
        ctx.fillStyle = isBtnActive ? '#ffffff' : '#94a3b8';
        ctx.fillText(isBtnActive ? '🎮 Button Mode (Default) ●' : '🎮 Button Mode', tabLeftX + tabW / 2, tabY + tabH / 2);
        ctx.restore();

        // Tab 2: Joystick Mode (Right)
        const isJoyActive = this.controlMode === 'joystick';
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(tabRightX, tabY, tabW, tabH, 22);
        if (isJoyActive) {
            ctx.fillStyle = '#16a34a';
            ctx.shadowColor = 'rgba(34, 197, 94, 0.45)';
            ctx.shadowBlur = 18;
            ctx.fill();
            ctx.strokeStyle = '#4ade80';
            ctx.lineWidth = 2.5;
            ctx.stroke();
        } else {
            ctx.fillStyle = '#22252e';
            ctx.fill();
            ctx.strokeStyle = '#373b49';
            ctx.lineWidth = 2;
            ctx.stroke();
        }
        ctx.restore();

        // Tab 2 Text
        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = isJoyActive ? 'bold 28px "Outfit", sans-serif' : '500 26px "Outfit", sans-serif';
        ctx.fillStyle = isJoyActive ? '#ffffff' : '#94a3b8';
        ctx.fillText(isJoyActive ? '🕹️ Joystick Mode ●' : '🕹️ Joystick Mode', tabRightX + tabW / 2, tabY + tabH / 2);
        ctx.restore();

        // 2. Controller Body (Button D-Pad OR Analog Joystick)
        if (this.controlMode === 'button') {
            // === BUTTON MODE (DEFAULT 4-WAY D-PAD) ===
            const cx = 540;
            const cy = 1665;

            // Center Disc Hub
            ctx.save();
            ctx.beginPath();
            ctx.arc(cx, cy, 38, 0, Math.PI * 2);
            ctx.fillStyle = '#1d2028';
            ctx.fill();
            ctx.strokeStyle = '#393f4e';
            ctx.lineWidth = 3;
            ctx.stroke();
            // Subtle center gem
            ctx.beginPath();
            ctx.arc(cx, cy, 14, 0, Math.PI * 2);
            ctx.fillStyle = '#22c55e';
            ctx.fill();
            ctx.restore();

            const drawDpadBtn = (bx, by, bw, bh, label, isPressed) => {
                ctx.save();
                ctx.beginPath();
                ctx.roundRect(bx - bw / 2, by - bh / 2, bw, bh, 22);
                if (isPressed) {
                    ctx.fillStyle = '#22c55e';
                    ctx.shadowColor = '#22c55e';
                    ctx.shadowBlur = 22;
                    ctx.fill();
                    ctx.strokeStyle = '#86efac';
                    ctx.lineWidth = 3.5;
                    ctx.stroke();

                    ctx.fillStyle = '#0f172a';
                    ctx.font = 'bold 46px sans-serif';
                } else {
                    ctx.fillStyle = '#292d37';
                    ctx.fill();
                    ctx.strokeStyle = '#414757';
                    ctx.lineWidth = 2.5;
                    ctx.stroke();

                    ctx.fillStyle = '#e2e8f0';
                    ctx.font = 'bold 44px sans-serif';
                }

                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(label, bx, by);
                ctx.restore();
            };

            // UP, DOWN, LEFT, RIGHT buttons
            drawDpadBtn(cx, cy - 105, 120, 100, '▲', this.buttonStates.up);
            drawDpadBtn(cx, cy + 105, 120, 100, '▼', this.buttonStates.down);
            drawDpadBtn(cx - 140, cy, 100, 120, '◀', this.buttonStates.left);
            drawDpadBtn(cx + 140, cy, 100, 120, '▶', this.buttonStates.right);

        } else if (this.controlMode === 'joystick') {
            // === JOYSTICK MODE (VIRTUAL ANALOG THUMBSTICK) ===
            const bx = this.joyBaseX;
            const by = this.joyBaseY;

            // 1. Base Radial Pad
            ctx.save();
            const baseGrad = ctx.createRadialGradient(bx, by, 15, bx, by, 130);
            baseGrad.addColorStop(0, '#262a35');
            baseGrad.addColorStop(0.7, '#191b23');
            baseGrad.addColorStop(1, '#111318');

            ctx.beginPath();
            ctx.arc(bx, by, 130, 0, Math.PI * 2);
            ctx.fillStyle = baseGrad;
            ctx.fill();
            ctx.strokeStyle = '#3a3f50';
            ctx.lineWidth = 3.5;
            ctx.stroke();

            // Inner dashed guide rings
            ctx.beginPath();
            ctx.arc(bx, by, 50, 0, Math.PI * 2);
            ctx.arc(bx, by, 90, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(148, 163, 184, 0.2)';
            ctx.lineWidth = 1.5;
            ctx.stroke();

            // 2. Cardinal Direction Indicators
            const drawIndicator = (ix, iy, label, isActive) => {
                ctx.save();
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                if (isActive) {
                    ctx.fillStyle = '#4ade80';
                    ctx.shadowColor = '#22c55e';
                    ctx.shadowBlur = 18;
                    ctx.font = 'bold 36px sans-serif';
                } else {
                    ctx.fillStyle = '#64748b';
                    ctx.font = 'bold 30px sans-serif';
                }
                ctx.fillText(label, ix, iy);
                ctx.restore();
            };

            drawIndicator(bx, by - 102, '▲', this.activeDirection === 'up');
            drawIndicator(bx, by + 102, '▼', this.activeDirection === 'down');
            drawIndicator(bx - 102, by, '◀', this.activeDirection === 'left');
            drawIndicator(bx + 102, by, '▶', this.activeDirection === 'right');

            // 3. Connecting Stem
            const kx = this.joyKnobX;
            const ky = this.joyKnobY;
            const pullDist = Math.hypot(kx - bx, ky - by);

            if (pullDist > 4) {
                ctx.beginPath();
                ctx.moveTo(bx, by);
                ctx.lineTo(kx, ky);
                ctx.strokeStyle = this.joyActive ? 'rgba(34, 197, 94, 0.65)' : 'rgba(96, 165, 250, 0.45)';
                ctx.lineWidth = 10;
                ctx.lineCap = 'round';
                ctx.stroke();
            }

            // 4. Thumbstick Knob
            ctx.save();
            // Drop shadow
            ctx.shadowColor = 'rgba(0, 0, 0, 0.65)';
            ctx.shadowBlur = 22;
            ctx.shadowOffsetX = (kx - bx) * 0.15;
            ctx.shadowOffsetY = (ky - by) * 0.15 + 4;

            // Outer knob cap
            const knobGrad = ctx.createRadialGradient(kx - 12, ky - 12, 5, kx, ky, 52);
            knobGrad.addColorStop(0, '#4b5563');
            knobGrad.addColorStop(0.65, '#29303d');
            knobGrad.addColorStop(1, '#181d26');

            ctx.beginPath();
            ctx.arc(kx, ky, 52, 0, Math.PI * 2);
            ctx.fillStyle = knobGrad;
            ctx.fill();
            ctx.strokeStyle = this.joyActive ? '#22c55e' : '#60a5fa';
            ctx.lineWidth = 3;
            ctx.stroke();
            ctx.restore();

            // Tactile concentric rings on knob
            ctx.save();
            ctx.beginPath();
            ctx.arc(kx, ky, 34, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(kx, ky, 20, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Center neon jewel
            ctx.beginPath();
            ctx.arc(kx, ky, 9, 0, Math.PI * 2);
            ctx.fillStyle = this.joyActive ? '#4ade80' : '#38bdf8';
            ctx.fill();
            ctx.restore();
            ctx.restore();
        }

        ctx.restore();
    }

    drawModal(ctx, images) {
        ctx.save();
        // Dimmed backdrop
        ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
        ctx.fillRect(0, 0, 1080, 1920);

        const cx = 540;
        const cy = 960;

        // Modal Box
        ctx.fillStyle = '#18181b';
        ctx.beginPath();
        ctx.roundRect(cx - 380, cy - 380, 760, 760, 48);
        ctx.fill();
        ctx.strokeStyle = '#27272a';
        ctx.lineWidth = 4;
        ctx.stroke();

        if (this.activeModal === 'pause') {
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 56px "Outfit", sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('PAUSED', cx, cy - 200);

            // Button 1: Resume
            this.drawButton(ctx, cx, cy - 60, 460, 80, 'Resume Game', '#22c55e');

            // Button 2: Restart Run
            this.drawButton(ctx, cx, cy + 50, 460, 80, 'Restart Run 🔄', '#3b82f6');

            // Button 3: Mute
            const soundText = this.game.audio.isMuted ? 'Sound: OFF 🔇' : 'Sound: ON 🔊';
            this.drawButton(ctx, cx, cy + 160, 460, 80, soundText, '#6366f1');
        } else if (this.activeModal === 'win') {
            ctx.fillStyle = '#4ade80';
            ctx.font = 'bold 58px "Outfit", sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('VICTORY! 🎉', cx, cy - 200);

            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 44px "Outfit", sans-serif';
            ctx.fillText(`Score: ${this.game.score}`, cx, cy - 110);

            // 3 Golden Stars
            ctx.font = '64px sans-serif';
            ctx.fillText('⭐⭐⭐', cx, cy - 35);

            // Play Again
            this.drawButton(ctx, cx, cy + 90, 480, 88, 'Play Again 🔄', '#22c55e');
        } else if (this.activeModal === 'gameover') {
            ctx.fillStyle = '#f97316';
            ctx.font = 'bold 56px "Outfit", sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('ENDLESS RUN OVER 🐍', cx, cy - 200);

            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 46px "Outfit", sans-serif';
            ctx.fillText(`Final Score: ${this.game.score}`, cx, cy - 105);

            ctx.fillStyle = '#94a3b8';
            ctx.font = '30px "Outfit", sans-serif';
            const len = this.game.snake ? this.game.snake.segments.length : 3;
            ctx.fillText(`Wave Reached: ${this.game.endlessWave}   |   Length: ${len} 🐍`, cx, cy - 35);

            // Single prominent Play Again button
            this.drawButton(ctx, cx, cy + 90, 480, 88, 'Play Again 🔄', '#22c55e');
        }

        ctx.restore();
    }

    drawButton(ctx, cx, cy, width, height, text, bgCol) {
        ctx.save();
        ctx.fillStyle = bgCol;
        ctx.beginPath();
        ctx.roundRect(cx - width / 2, cy - height / 2, width, height, 22);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 32px "Outfit", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, cx, cy);
        ctx.restore();
    }
}

window.UI = UI;
