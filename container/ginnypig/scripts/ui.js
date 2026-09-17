/**
 * ui.js - Catcher HUD, Hearts/Lives, Progress Bar, Floating Level Up Banners, and Game Over Modal
 */

class UIManager {
    constructor(game) {
        this.game = game;
        this.buttons = [];
        this.activeModal = null; // 'game_over' | 'level_select'
        this.modalData = null;
        this.showTutorial = true;
        this.showControls = true;
        try {
            const saved = localStorage.getItem('piggy_show_controls');
            if (saved !== null) {
                this.showControls = saved === 'true';
            }
        } catch (e) {}
        this.initButtons();
    }

    initButtons() {
        // Uniform radius for all top HUD action buttons
        const HUD_BTN_RADIUS = 42;

        this.buttons = [
            // Top Left 1: Cross / Exit Button (Redirects to '/')
            {
                id: 'btn_exit',
                x: 80,
                y: 85,
                radius: HUD_BTN_RADIUS,
                type: 'cross',
                action: () => {
                    window.location.href = '/';
                }
            },
            // Top Left 2: Toggle Touch Steering Buttons Show/Hide
            {
                id: 'btn_toggle_controls',
                x: 185,
                y: 85,
                radius: HUD_BTN_RADIUS,
                type: 'toggle_controls',
                action: () => {
                    this.toggleControls();
                }
            },
            // Top Right 1: Sound Toggle
            {
                id: 'btn_sound',
                x: 895,
                y: 85,
                radius: HUD_BTN_RADIUS,
                type: 'sound',
                action: () => {
                    SoundEngine.toggleMute();
                    SoundEngine.playButtonClick();
                }
            },
            // Top Right 2: Restart Button
            {
                id: 'btn_restart',
                x: 1000,
                y: 85,
                radius: HUD_BTN_RADIUS,
                type: 'restart',
                action: () => this.game.restartLevel()
            },
            // Bottom Left: Left Steering Button
            {
                id: 'btn_left',
                x: 95,
                y: 1720,
                radius: 54,
                type: 'arrow_left',
                isPressed: false,
                onDown: () => {
                    this.game.isHoldingLeft = true;
                    this.showTutorial = false;
                    this.game.player.setTargetX(this.game.player.targetX - 70);
                },
                onUp: () => {
                    this.game.isHoldingLeft = false;
                }
            },
            // Bottom Right: Right Steering Button
            {
                id: 'btn_right',
                x: 985,
                y: 1720,
                radius: 54,
                type: 'arrow_right',
                isPressed: false,
                onDown: () => {
                    this.game.isHoldingRight = true;
                    this.showTutorial = false;
                    this.game.player.setTargetX(this.game.player.targetX + 70);
                },
                onUp: () => {
                    this.game.isHoldingRight = false;
                }
            }
        ];
    }

    toggleControls() {
        this.showControls = !this.showControls;
        if (!this.showControls) {
            this.game.isHoldingLeft = false;
            this.game.isHoldingRight = false;
            const bLeft = this.buttons.find(b => b.id === 'btn_left');
            const bRight = this.buttons.find(b => b.id === 'btn_right');
            if (bLeft) bLeft.isPressed = false;
            if (bRight) bRight.isPressed = false;
        }
        try {
            localStorage.setItem('piggy_show_controls', this.showControls.toString());
        } catch (e) {}

        const toggleBtn = this.buttons.find(b => b.id === 'btn_toggle_controls');
        const bx = toggleBtn ? toggleBtn.x : 185;
        const by = toggleBtn ? toggleBtn.y : 85;
        if (this.game && this.game.particles) {
            this.game.particles.addPopup(
                bx,
                by + 65,
                this.showControls ? 'BUTTONS: ON' : 'BUTTONS: OFF',
                this.showControls ? '#51cf66' : '#ff6b6b'
            );
        }
    }

    openLevelSelect() {
        SoundEngine.playButtonClick();
        this.activeModal = 'level_select';
    }

    openGameOver(data) {
        this.activeModal = 'game_over';
        this.modalData = data;
    }

    closeModal() {
        this.activeModal = null;
        this.modalData = null;
    }

    handleClick(px, py) {
        this.showTutorial = false;

        if (this.activeModal) {
            return this.handleModalClick(px, py);
        }

        for (let btn of this.buttons) {
            if (!this.showControls && (btn.id === 'btn_left' || btn.id === 'btn_right')) {
                continue;
            }

            const d = Math.hypot(px - btn.x, py - btn.y);
            if (d <= btn.radius + 15) {
                if (btn.onDown) {
                    btn.isPressed = true;
                    btn.onDown();
                } else if (btn.action) {
                    SoundEngine.playButtonClick();
                    btn.action();
                }
                return true;
            }
        }
        return false;
    }

    handlePointerUp() {
        for (let btn of this.buttons) {
            if (btn.isPressed) {
                btn.isPressed = false;
                if (btn.onUp) {
                    btn.onUp();
                }
            }
        }
    }

    handleModalClick(px, py) {
        if (this.activeModal === 'game_over') {
            // TRY AGAIN button (y around 1115)
            if (Math.abs(px - 540) < 170 && Math.abs(py - 1115) < 40) {
                SoundEngine.playButtonClick();
                this.closeModal();
                this.game.loadLevel(1);
                return true;
            }
            // BACK TO HOME button (y around 1215)
            if (Math.abs(px - 540) < 170 && Math.abs(py - 1215) < 40) {
                SoundEngine.playButtonClick();
                window.location.href = '/';
                return true;
            }
        } else if (this.activeModal === 'level_select') {
            // Close button
            if (Math.hypot(px - 860, py - 530) < 50) {
                SoundEngine.playButtonClick();
                this.closeModal();
                return true;
            }
            // 10 levels grid
            const centerX = 540;
            const centerY = 960;
            const startY = centerY - 240;
            const gapX = 190;
            const gapY = 145;

            for (let i = 0; i < LEVELS.length; i++) {
                let bx, by;
                if (i === 9) {
                    bx = centerX;
                    by = startY + 3 * gapY;
                } else {
                    const col = i % 3;
                    const row = Math.floor(i / 3);
                    bx = centerX + (col - 1) * gapX;
                    by = startY + row * gapY;
                }

                if (Math.hypot(px - bx, py - by) < 55) {
                    SoundEngine.playButtonClick();
                    this.closeModal();
                    this.game.loadLevel(LEVELS[i].levelNumber);
                    return true;
                }
            }
        }
        return true;
    }

    render(ctx) {
        this.renderHUD(ctx);
        this.renderLevelUpBanner(ctx);

        if (this.activeModal) {
            this.renderModal(ctx);
        }
    }

    renderHUD(ctx) {
        ctx.save();

        const lvl = this.game.currentLevel;
        const target = lvl ? lvl.targetCoins : 20;
        const caught = this.game.coinsCaughtInLevel || 0;
        const progress = Math.min(1, caught / Math.max(1, target));

        // ------------------------------------------
        // 1. Top HUD Center: Level Title & Progress Bar
        // ------------------------------------------
        ctx.font = '800 28px "Outfit", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#ffec99';
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 6;
        ctx.fillText(`LEVEL ${lvl ? lvl.levelNumber : 1}: ${(lvl ? lvl.name : '').toUpperCase()}`, 540, 48);

        // Progress Bar Container
        const barW = 440;
        const barH = 34;
        const barX = 540 - barW / 2;
        const barY = 74;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.beginPath();
        ctx.roundRect(barX, barY, barW, barH, barH / 2);
        ctx.fill();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Progress Fill (Golden Gradient)
        if (progress > 0) {
            const fillW = Math.max(barH, barW * progress);
            const fillGrad = ctx.createLinearGradient(barX, 0, barX + fillW, 0);
            fillGrad.addColorStop(0, '#ffd43b');
            fillGrad.addColorStop(1, '#ff922b');
            ctx.fillStyle = fillGrad;
            ctx.beginPath();
            ctx.roundRect(barX, barY, fillW, barH, barH / 2);
            ctx.fill();
        }

        // Progress Text
        ctx.shadowBlur = 0;
        ctx.font = '900 22px "Outfit", sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(`STAGE GOAL: ${caught} / ${target}`, 540, barY + barH / 2 + 1);

        // Score below progress bar
        ctx.font = '900 32px "Outfit", sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 6;
        ctx.fillText(`SCORE: ${this.game.score.toLocaleString()}`, 540, 138);

        // ------------------------------------------
        // 2. Hearts / Lives (❤️❤️❤️) with White Border
        // ------------------------------------------
        const heartsY = 185;
        const heartsStartX = 870;
        const heartsSpacing = 58;
        for (let i = 0; i < 3; i++) {
            const hx = heartsStartX + i * heartsSpacing;
            const isFull = i < this.game.lives;
            this.renderHeart(ctx, hx, heartsY, 48, isFull);
        }

        // ------------------------------------------
        // 3. Top Buttons & Steering Controls
        // ------------------------------------------
        for (let btn of this.buttons) {
            if (!this.showControls && (btn.id === 'btn_left' || btn.id === 'btn_right')) {
                continue;
            }
            this.renderCircleButton(ctx, btn);
        }

        // ------------------------------------------
        // 4. Power-Up Indicators
        // ------------------------------------------
        let badgeY = 190;
        if (this.game.player.rushTimer > 0) {
            const sec = Math.ceil(this.game.player.rushTimer);
            this.renderCoinRushHUDBar(ctx, 540, badgeY, sec, this.game.player.rushTimer / 15.0);
            badgeY += 50;
        }
        if (this.game.player.magnetTimer > 0) {
            const sec = Math.ceil(this.game.player.magnetTimer);
            this.renderPowerUpBadge(ctx, 540, badgeY, `🧲 MAGNET ACTIVE (${sec}s)`, '#00f2fe', '#0c8599');
            badgeY += 45;
        }
        if (this.game.player.multiplierTimer > 0) {
            const sec = Math.ceil(this.game.player.multiplierTimer);
            this.renderPowerUpBadge(ctx, 540, badgeY, `⚡ 2X SCORE ACTIVE (${sec}s)`, '#ffd43b', '#d9480f');
        }

        // ------------------------------------------
        // 5. Initial "DRAG TO MOVE" Tutorial Prompt
        // ------------------------------------------
        if (this.showTutorial && this.game.state === 'PLAYING') {
            ctx.save();
            ctx.translate(540, 1500);
            ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
            ctx.beginPath();
            ctx.roundRect(-240, -32, 480, 64, 32);
            ctx.fill();

            ctx.strokeStyle = '#ffd43b';
            ctx.lineWidth = 3;
            ctx.stroke();

            ctx.font = '900 28px "Outfit", sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#ffffff';
            ctx.fillText(this.showControls ? '👈 SWIPE OR USE ARROWS 👉' : '👈 SWIPE / DRAG TO MOVE 👉', 0, 2);
            ctx.restore();
        }

        ctx.restore();
    }

    renderLevelUpBanner(ctx) {
        const banner = this.game.levelUpBanner;
        if (!banner) return;

        const progress = banner.timer / banner.maxTimer; // 1 -> 0
        let alpha = 1;
        let scale = 1;

        if (progress > 0.8) {
            const t = (1 - progress) / 0.2; // 0 -> 1
            scale = 0.5 + t * 0.55; // 0.5 -> 1.05
            alpha = t;
        } else if (progress < 0.25) {
            alpha = progress / 0.25;
            scale = 1.0 + (1 - alpha) * 0.08;
        } else {
            scale = 1.0 + Math.sin(progress * 14) * 0.03;
            alpha = 1.0;
        }

        ctx.save();
        ctx.translate(540, 520);
        ctx.scale(scale, scale);
        ctx.globalAlpha = Math.max(0, Math.min(1, alpha));

        // Background glow
        ctx.shadowColor = '#ffd43b';
        ctx.shadowBlur = 35;

        // Container Pill
        const grad = ctx.createLinearGradient(0, -90, 0, 90);
        grad.addColorStop(0, '#fff3bf');
        grad.addColorStop(0.3, '#ffd43b');
        grad.addColorStop(0.7, '#f59f00');
        grad.addColorStop(1, '#e67700');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.roundRect(-360, -90, 720, 180, 40);
        ctx.fill();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 6;
        ctx.stroke();

        ctx.shadowBlur = 0;

        // Inner frame
        ctx.strokeStyle = 'rgba(92, 16, 34, 0.35)';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.roundRect(-348, -78, 696, 156, 30);
        ctx.stroke();

        // Level Up title
        ctx.font = '900 42px "Outfit", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#5c1022';
        ctx.fillText(`🌟 LEVEL ${banner.levelNumber} UNLOCKED! 🌟`, 0, -40);

        // Subtitle
        ctx.font = '800 32px "Outfit", sans-serif';
        ctx.fillStyle = '#2b020d';
        ctx.fillText(`${banner.name.toUpperCase()}`, 0, 6);

        // Bonus Tag
        ctx.font = '900 26px "Outfit", sans-serif';
        ctx.fillStyle = '#2b8a3e';
        ctx.fillText(`+${banner.bonus} BONUS POINTS!`, 0, 50);

        ctx.restore();
    }

    renderPowerUpBadge(ctx, x, y, text, glowColor, textColor) {
        ctx.save();
        ctx.translate(x, y);

        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = 14;
        ctx.beginPath();
        ctx.roundRect(-180, -18, 360, 36, 18);
        ctx.fill();

        ctx.strokeStyle = glowColor;
        ctx.lineWidth = 2.5;
        ctx.stroke();

        ctx.shadowBlur = 0;
        ctx.font = '900 20px "Outfit", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = textColor;
        ctx.fillText(text, 0, 1);

        ctx.restore();
    }

    renderCoinRushHUDBar(ctx, x, y, sec, ratio) {
        ctx.save();
        ctx.translate(x, y);

        const w = 400;
        const h = 38;

        // Glowing rainbow/golden aura
        ctx.shadowColor = '#ffd43b';
        ctx.shadowBlur = 18;

        // Container Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.72)';
        ctx.beginPath();
        ctx.roundRect(-w / 2, -h / 2, w, h, h / 2);
        ctx.fill();

        // Animated progress fill
        const fillW = Math.max(h, (w - 6) * Math.min(1, Math.max(0, ratio)));
        const fillGrad = ctx.createLinearGradient(-w / 2, 0, -w / 2 + fillW, 0);
        fillGrad.addColorStop(0, '#ffd43b');
        fillGrad.addColorStop(0.5, '#ff922b');
        fillGrad.addColorStop(1, '#ff6b6b');
        ctx.fillStyle = fillGrad;
        ctx.beginPath();
        ctx.roundRect(-w / 2 + 3, -h / 2 + 3, fillW, h - 6, (h - 6) / 2);
        ctx.fill();

        // White border
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.shadowBlur = 0;
        ctx.font = '900 22px "Outfit", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(`⚡ MEGA COIN RUSH! (${sec}s) ⚡`, 0, 1);

        ctx.restore();
    }

    renderHeart(ctx, x, y, size, isFull) {
        ctx.save();
        ctx.translate(x, y);

        const s = size / 24;
        ctx.scale(s, s);
        ctx.translate(-12, -12); // Center of 24x24 bounding box

        // Drop Shadow
        ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
        ctx.shadowBlur = 8 / s;
        ctx.shadowOffsetY = 2.5 / s;

        // Standard Perfect SVG Heart Path
        let path = null;
        if (typeof Path2D !== 'undefined') {
            if (!UIManager.heartPath) {
                UIManager.heartPath = new Path2D(
                    "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                );
            }
            path = UIManager.heartPath;
        }

        const drawPath = () => {
            if (path) return;
            ctx.beginPath();
            ctx.moveTo(12, 21.35);
            ctx.lineTo(10.55, 20.03);
            ctx.bezierCurveTo(5.4, 15.36, 2, 12.28, 2, 8.5);
            ctx.bezierCurveTo(2, 5.42, 4.42, 3, 7.5, 3);
            ctx.bezierCurveTo(9.24, 3, 10.91, 3.81, 12, 5.09);
            ctx.bezierCurveTo(13.09, 3.81, 14.76, 3, 16.5, 3);
            ctx.bezierCurveTo(19.58, 3, 22, 5.42, 22, 8.5);
            ctx.bezierCurveTo(22, 12.28, 18.6, 15.36, 13.45, 20.03);
            ctx.closePath();
        };

        // 1. Fill (Red Gradient when Full, Dark Silhouette when Lost)
        if (isFull) {
            const grad = ctx.createLinearGradient(12, 3, 12, 22);
            grad.addColorStop(0, '#ff3b69');
            grad.addColorStop(0.4, '#e00034');
            grad.addColorStop(1, '#9e0024');
            ctx.fillStyle = grad;
            if (path) {
                ctx.fill(path);
            } else {
                drawPath();
                ctx.fill();
            }

            // Specular shine highlight
            ctx.shadowColor = 'transparent';
            ctx.beginPath();
            ctx.ellipse(7.8, 7.5, 2.8, 1.6, -Math.PI / 4, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.fill();
        } else {
            ctx.fillStyle = 'rgba(20, 2, 8, 0.65)';
            if (path) {
                ctx.fill(path);
            } else {
                drawPath();
                ctx.fill();
            }
        }

        // 2. Crisp Solid White Border
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.4;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
        ctx.shadowBlur = 3 / s;
        if (path) {
            ctx.stroke(path);
        } else {
            drawPath();
            ctx.stroke();
        }

        ctx.restore();
    }

    renderCircleButton(ctx, btn) {
        ctx.save();
        ctx.translate(btn.x, btn.y);

        if (btn.isPressed) {
            ctx.scale(0.92, 0.92);
        }

        const r = btn.radius;

        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
        ctx.beginPath();
        ctx.arc(2, 4, r, 0, Math.PI * 2);
        ctx.fill();

        // Yellow Golden Gradient
        const grad = ctx.createLinearGradient(-r, -r, r, r);
        grad.addColorStop(0, '#fff3bf');
        grad.addColorStop(0.3, '#ffd43b');
        grad.addColorStop(0.8, '#f59f00');
        grad.addColorStop(1, '#d9480f');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();

        // White border
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3.5;
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#ffffff';

        if (btn.type === 'cross') {
            ctx.lineWidth = 5;
            ctx.strokeStyle = '#ffffff';
            ctx.lineCap = 'round';
            const arm = r * 0.35;
            ctx.beginPath();
            ctx.moveTo(-arm, -arm);
            ctx.lineTo(arm, arm);
            ctx.moveTo(arm, -arm);
            ctx.lineTo(-arm, arm);
            ctx.stroke();
        } else if (btn.type === 'home') {
            ctx.beginPath();
            ctx.moveTo(0, -r * 0.45);
            ctx.lineTo(-r * 0.42, -r * 0.05);
            ctx.lineTo(-r * 0.28, -r * 0.05);
            ctx.lineTo(-r * 0.28, r * 0.42);
            ctx.lineTo(r * 0.28, r * 0.42);
            ctx.lineTo(r * 0.28, -r * 0.05);
            ctx.lineTo(r * 0.42, -r * 0.05);
            ctx.closePath();
            ctx.fill();
        } else if (btn.type === 'restart') {
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.arc(0, 0, r * 0.44, -Math.PI * 0.7, Math.PI * 0.85);
            ctx.stroke();

            const tipX = Math.cos(Math.PI * 0.85) * (r * 0.44);
            const tipY = Math.sin(Math.PI * 0.85) * (r * 0.44);
            ctx.beginPath();
            ctx.moveTo(tipX, tipY);
            ctx.lineTo(tipX - 7, tipY - 14);
            ctx.lineTo(tipX + 14, tipY - 6);
            ctx.closePath();
            ctx.fill();
        } else if (btn.type === 'sound') {
            const muted = SoundEngine.isAudioMuted();
            const s = r / 42;
            ctx.beginPath();
            ctx.moveTo(-11 * s, -9 * s);
            ctx.lineTo(-3 * s, -9 * s);
            ctx.lineTo(11 * s, -17 * s);
            ctx.lineTo(11 * s, 17 * s);
            ctx.lineTo(-3 * s, 9 * s);
            ctx.lineTo(-11 * s, 9 * s);
            ctx.closePath();
            ctx.fill();

            if (muted) {
                ctx.strokeStyle = '#ff6b6b';
                ctx.lineWidth = 4 * s;
                ctx.lineCap = 'round';
                ctx.beginPath();
                ctx.moveTo(-15 * s, -15 * s);
                ctx.lineTo(15 * s, 15 * s);
                ctx.stroke();
            } else {
                ctx.lineWidth = 3.5 * s;
                ctx.lineCap = 'round';
                ctx.beginPath();
                ctx.arc(8 * s, 0, 13 * s, -Math.PI * 0.35, Math.PI * 0.35);
                ctx.stroke();
            }
        } else if (btn.type === 'arrow_left') {
            // Left triangle arrow
            ctx.beginPath();
            ctx.moveTo(-r * 0.32, 0);
            ctx.lineTo(r * 0.22, -r * 0.42);
            ctx.lineTo(r * 0.22, r * 0.42);
            ctx.closePath();
            ctx.fill();
        } else if (btn.type === 'arrow_right') {
            // Right triangle arrow
            ctx.beginPath();
            ctx.moveTo(r * 0.32, 0);
            ctx.lineTo(-r * 0.22, -r * 0.42);
            ctx.lineTo(-r * 0.22, r * 0.42);
            ctx.closePath();
            ctx.fill();
        } else if (btn.type === 'toggle_controls') {
            const isVisible = this.showControls;
            const s = r / 42;

            // Left triangle arrow ◄
            ctx.beginPath();
            ctx.moveTo(-14 * s, 0);
            ctx.lineTo(-4 * s, -10 * s);
            ctx.lineTo(-4 * s, 10 * s);
            ctx.closePath();
            ctx.fill();

            // Right triangle arrow ►
            ctx.beginPath();
            ctx.moveTo(14 * s, 0);
            ctx.lineTo(4 * s, -10 * s);
            ctx.lineTo(4 * s, 10 * s);
            ctx.closePath();
            ctx.fill();

            // Center connector line
            ctx.lineWidth = 3.5 * s;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(-3 * s, 0);
            ctx.lineTo(3 * s, 0);
            ctx.stroke();

            // Red diagonal slash if hidden
            if (!isVisible) {
                ctx.strokeStyle = '#ff6b6b';
                ctx.lineWidth = 4 * s;
                ctx.lineCap = 'round';
                ctx.beginPath();
                ctx.moveTo(-15 * s, -15 * s);
                ctx.lineTo(15 * s, 15 * s);
                ctx.stroke();
            }
        }

        ctx.restore();
    }

    renderModal(ctx) {
        ctx.save();
        ctx.fillStyle = 'rgba(15, 2, 8, 0.78)';
        ctx.fillRect(0, 0, 1080, 1920);

        if (this.activeModal === 'game_over') {
            this.renderGameOverModal(ctx);
        } else if (this.activeModal === 'level_select') {
            this.renderLevelSelectModal(ctx);
        }

        ctx.restore();
    }

    renderGameOverModal(ctx) {
        ctx.save();
        ctx.translate(540, 960);

        // Container Box
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
        ctx.shadowBlur = 35;
        ctx.beginPath();
        ctx.roundRect(-380, -420, 760, 840, 48);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Header Banner
        const headerGrad = ctx.createLinearGradient(0, -420, 0, -270);
        headerGrad.addColorStop(0, '#ff6b6b');
        headerGrad.addColorStop(1, '#c92a2a');
        ctx.fillStyle = headerGrad;
        ctx.beginPath();
        ctx.roundRect(-380, -420, 760, 150, [48, 48, 0, 0]);
        ctx.fill();

        ctx.font = '900 52px "Outfit", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#ffffff';
        ctx.fillText('GAME OVER', 0, -345);

        ctx.font = '900 70px sans-serif';
        ctx.fillText('🐷💔💣', 0, -210);

        ctx.font = '700 36px "Outfit", sans-serif';
        ctx.fillStyle = '#343a40';
        ctx.fillText('Out of Lives!', 0, -120);

        const score = this.modalData ? this.modalData.score : 0;
        const clicks = this.modalData ? (this.modalData.clicks || 0) : 0;
        const duration = this.modalData ? (this.modalData.duration || 0) : 0;

        ctx.font = '900 56px "Outfit", sans-serif';
        ctx.fillStyle = '#d9480f';
        ctx.fillText(`FINAL SCORE: ${score.toLocaleString()}`, 0, -45);

        ctx.font = '600 30px "Outfit", sans-serif';
        ctx.fillStyle = '#868e96';
        ctx.fillText(`Total Clicks: ${clicks}`, 0, 15);
        ctx.fillText(`Duration: ${duration}s`, 0, 60);

        // 1. TRY AGAIN Button (y: 155)
        ctx.save();
        ctx.translate(0, 155);
        const btnGrad1 = ctx.createLinearGradient(0, -36, 0, 36);
        btnGrad1.addColorStop(0, '#339af0');
        btnGrad1.addColorStop(1, '#1864ab');
        ctx.fillStyle = btnGrad1;
        ctx.beginPath();
        ctx.roundRect(-190, -36, 380, 72, 36);
        ctx.fill();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 4;
        ctx.stroke();

        ctx.font = '900 36px "Outfit", sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.fillText('TRY AGAIN ↻', 0, 2);
        ctx.restore();

        // 2. BACK TO HOME Button (y: 255) - Same pill design
        ctx.save();
        ctx.translate(0, 255);
        const btnGrad2 = ctx.createLinearGradient(0, -36, 0, 36);
        btnGrad2.addColorStop(0, '#ffd43b');
        btnGrad2.addColorStop(1, '#e67700');
        ctx.fillStyle = btnGrad2;
        ctx.beginPath();
        ctx.roundRect(-190, -36, 380, 72, 36);
        ctx.fill();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 4;
        ctx.stroke();

        ctx.font = '900 34px "Outfit", sans-serif';
        ctx.fillStyle = '#5c1022';
        ctx.fillText('BACK TO HOME 🏠', 0, 2);
        ctx.restore();

        ctx.restore();
    }

    renderLevelSelectModal(ctx) {
        ctx.save();
        ctx.translate(540, 960);

        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
        ctx.shadowBlur = 35;
        ctx.beginPath();
        ctx.roundRect(-430, -480, 860, 960, 48);
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.font = '900 48px "Outfit", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#212529';
        ctx.fillText('SELECT START LEVEL', 0, -410);

        // Close button
        ctx.fillStyle = '#f1f3f5';
        ctx.beginPath();
        ctx.arc(340, -410, 35, 0, Math.PI * 2);
        ctx.fill();

        ctx.font = '900 34px "Outfit", sans-serif';
        ctx.fillStyle = '#495057';
        ctx.fillText('✕', 340, -410);

        // Grid of 10 levels
        const startY = -240;
        const gapX = 190;
        const gapY = 145;

        for (let i = 0; i < LEVELS.length; i++) {
            let bx, by;
            if (i === 9) {
                bx = 0;
                by = startY + 3 * gapY;
            } else {
                const col = i % 3;
                const row = Math.floor(i / 3);
                bx = (col - 1) * gapX;
                by = startY + row * gapY;
            }

            const isCurrent = this.game.currentLevel && this.game.currentLevel.levelNumber === LEVELS[i].levelNumber;

            const grad = ctx.createLinearGradient(bx, by - 50, bx, by + 50);
            if (isCurrent) {
                grad.addColorStop(0, '#ffd43b');
                grad.addColorStop(1, '#f59f00');
            } else {
                grad.addColorStop(0, '#e7f5ff');
                grad.addColorStop(1, '#a5d8ff');
            }
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(bx, by, 50, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = isCurrent ? '#d9480f' : '#1c7ed6';
            ctx.lineWidth = 4;
            ctx.stroke();

            ctx.font = '900 40px "Outfit", sans-serif';
            ctx.fillStyle = isCurrent ? '#5c1022' : '#1864ab';
            ctx.fillText(LEVELS[i].levelNumber.toString(), bx, by + 2);
        }

        ctx.restore();
    }
}

if (typeof window !== 'undefined') {
    window.UIManager = UIManager;
}

