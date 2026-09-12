/**
 * ui.js - Catcher HUD, Hearts/Lives, Progress Bar, and Modals
 */

class UIManager {
    constructor(game) {
        this.game = game;
        this.buttons = [];
        this.activeModal = null; // 'level_complete' | 'game_over' | 'level_select'
        this.modalData = null;
        this.showTutorial = true;
        this.initButtons();
    }

    initButtons() {
        this.buttons = [
            // Top Left: Home / Levels Button
            {
                id: 'btn_home',
                x: 80,
                y: 85,
                radius: 44,
                type: 'home',
                action: () => this.openLevelSelect()
            },
            // Top Right: Sound Toggle
            {
                id: 'btn_sound',
                x: 880,
                y: 85,
                radius: 38,
                type: 'sound',
                action: () => {
                    SoundEngine.toggleMute();
                    SoundEngine.playButtonClick();
                }
            },
            // Top Right: Restart Button
            {
                id: 'btn_restart',
                x: 990,
                y: 85,
                radius: 44,
                type: 'restart',
                action: () => this.game.restartLevel()
            }
        ];
    }

    openLevelSelect() {
        SoundEngine.playButtonClick();
        this.activeModal = 'level_select';
    }

    openLevelComplete(data) {
        this.activeModal = 'level_complete';
        this.modalData = data;
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
            const d = Math.hypot(px - btn.x, py - btn.y);
            if (d <= btn.radius + 15) {
                SoundEngine.playButtonClick();
                btn.action();
                return true;
            }
        }
        return false;
    }

    handleModalClick(px, py) {
        if (this.activeModal === 'level_complete') {
            // Next Level button
            if (Math.abs(px - 540) < 170 && Math.abs(py - 1140) < 45) {
                SoundEngine.playButtonClick();
                this.closeModal();
                this.game.nextLevel();
                return true;
            }
            // Replay button
            if (Math.abs(px - 540) < 130 && Math.abs(py - 1250) < 40) {
                SoundEngine.playButtonClick();
                this.closeModal();
                this.game.restartLevel();
                return true;
            }
        } else if (this.activeModal === 'game_over') {
            // Try Again button
            if (Math.abs(px - 540) < 170 && Math.abs(py - 1140) < 45) {
                SoundEngine.playButtonClick();
                this.closeModal();
                this.game.restartLevel();
                return true;
            }
        } else if (this.activeModal === 'level_select') {
            // Close
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
        if (this.activeModal) {
            this.renderModal(ctx);
        }
    }

    renderHUD(ctx) {
        ctx.save();

        const lvl = this.game.currentLevel;
        const target = lvl ? lvl.targetCoins : 20;
        const caught = this.game.coinsCaught;
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
        ctx.fillText(`COINS: ${caught} / ${target}`, 540, barY + barH / 2 + 1);

        // Score below progress bar
        ctx.font = '900 32px "Outfit", sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 6;
        ctx.fillText(`SCORE: ${this.game.score.toLocaleString()}`, 540, 138);

        // ------------------------------------------
        // 2. Hearts / Lives (❤️❤️❤️)
        // ------------------------------------------
        const heartsY = 140;
        const heartsStartX = 870;
        for (let i = 0; i < 3; i++) {
            const hx = heartsStartX + i * 44;
            const isFull = i < this.game.lives;
            ctx.font = '32px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.shadowBlur = 4;
            ctx.shadowColor = '#000000';
            ctx.fillText(isFull ? '❤️' : '🖤', hx, heartsY);
        }

        // ------------------------------------------
        // 3. Top Buttons (Home, Sound, Restart)
        // ------------------------------------------
        for (let btn of this.buttons) {
            this.renderCircleButton(ctx, btn);
        }

        // ------------------------------------------
        // 4. Power-Up Indicators
        // ------------------------------------------
        let badgeY = 190;
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
            ctx.fillText('👈 DRAG TO MOVE PIGGY 👉', 0, 2);
            ctx.restore();
        }

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

    renderCircleButton(ctx, btn) {
        ctx.save();
        ctx.translate(btn.x, btn.y);

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

        if (btn.type === 'home') {
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
            ctx.beginPath();
            ctx.moveTo(-10, -8);
            ctx.lineTo(-2, -8);
            ctx.lineTo(10, -16);
            ctx.lineTo(10, 16);
            ctx.lineTo(-2, 8);
            ctx.lineTo(-10, 8);
            ctx.closePath();
            ctx.fill();

            if (muted) {
                ctx.strokeStyle = '#ff6b6b';
                ctx.lineWidth = 4;
                ctx.beginPath();
                ctx.moveTo(-14, -14);
                ctx.lineTo(16, 16);
                ctx.stroke();
            } else {
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(8, 0, 12, -Math.PI * 0.35, Math.PI * 0.35);
                ctx.stroke();
            }
        }

        ctx.restore();
    }

    renderModal(ctx) {
        ctx.save();
        ctx.fillStyle = 'rgba(15, 2, 8, 0.78)';
        ctx.fillRect(0, 0, 1080, 1920);

        if (this.activeModal === 'level_complete') {
            this.renderLevelCompleteModal(ctx);
        } else if (this.activeModal === 'game_over') {
            this.renderGameOverModal(ctx);
        } else if (this.activeModal === 'level_select') {
            this.renderLevelSelectModal(ctx);
        }

        ctx.restore();
    }

    renderLevelCompleteModal(ctx) {
        ctx.save();
        ctx.translate(540, 960);

        // Container
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
        ctx.shadowBlur = 35;
        ctx.beginPath();
        ctx.roundRect(-380, -440, 760, 880, 48);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Header Banner
        const headerGrad = ctx.createLinearGradient(0, -440, 0, -280);
        headerGrad.addColorStop(0, '#ffd43b');
        headerGrad.addColorStop(1, '#f59f00');
        ctx.fillStyle = headerGrad;
        ctx.beginPath();
        ctx.roundRect(-380, -440, 760, 160, [48, 48, 0, 0]);
        ctx.fill();

        ctx.font = '900 52px "Outfit", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#5c1022';
        ctx.fillText('LEVEL COMPLETE!', 0, -360);

        // Stars
        const stars = this.modalData ? (this.modalData.stars || 3) : 3;
        for (let i = -1; i <= 1; i++) {
            const sx = i * 110;
            const sy = -200 + Math.abs(i) * 20;
            const isEarned = (i === -1 && stars >= 1) || (i === 0 && stars >= 2) || (i === 1 && stars >= 3);

            ctx.save();
            ctx.translate(sx, sy);
            ctx.fillStyle = isEarned ? '#fcc419' : '#dee2e6';
            ctx.strokeStyle = isEarned ? '#e67700' : '#adb5bd';
            ctx.lineWidth = 4;

            ctx.beginPath();
            const outerR = 48;
            const innerR = 22;
            for (let s = 0; s < 5; s++) {
                const a = (s * Math.PI * 2) / 5 - Math.PI / 2;
                const ai = a + Math.PI / 5;
                const x1 = Math.cos(a) * outerR;
                const y1 = Math.sin(a) * outerR;
                const x2 = Math.cos(ai) * innerR;
                const y2 = Math.sin(ai) * innerR;
                if (s === 0) ctx.moveTo(x1, y1);
                else ctx.lineTo(x1, y1);
                ctx.lineTo(x2, y2);
            }
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            ctx.restore();
        }

        const score = this.modalData ? this.modalData.score : 0;
        const target = this.modalData ? this.modalData.target : 20;
        const livesLeft = this.modalData ? this.modalData.livesLeft : 3;

        ctx.font = '700 32px "Outfit", sans-serif';
        ctx.fillStyle = '#868e96';
        ctx.fillText('TOTAL SCORE', 0, -80);

        ctx.font = '900 68px "Outfit", sans-serif';
        ctx.fillStyle = '#212529';
        ctx.fillText(score.toLocaleString(), 0, -25);

        ctx.font = '600 28px "Outfit", sans-serif';
        ctx.fillStyle = '#495057';
        ctx.fillText(`Target Caught: ${target} / ${target} Coins`, 0, 50);
        ctx.fillText(`Lives Remaining: ${'❤️'.repeat(livesLeft)}`, 0, 95);

        ctx.font = '500 22px "Outfit", sans-serif';
        ctx.fillStyle = '#2f9e44';
        ctx.fillText('✓ Score transmitted via sendscoreapi.js', 0, 140);

        // NEXT LEVEL Button
        ctx.translate(0, 180);
        const btnGrad = ctx.createLinearGradient(0, -40, 0, 40);
        btnGrad.addColorStop(0, '#51cf66');
        btnGrad.addColorStop(1, '#2b8a3e');
        ctx.fillStyle = btnGrad;
        ctx.beginPath();
        ctx.roundRect(-170, -40, 340, 80, 40);
        ctx.fill();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 4;
        ctx.stroke();

        ctx.font = '900 38px "Outfit", sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.fillText('NEXT LEVEL ➔', 0, 2);

        // REPLAY Button
        ctx.translate(0, 110);
        ctx.fillStyle = '#e9ecef';
        ctx.beginPath();
        ctx.roundRect(-130, -32, 260, 64, 32);
        ctx.fill();

        ctx.font = '800 30px "Outfit", sans-serif';
        ctx.fillStyle = '#495057';
        ctx.fillText('REPLAY ↻', 0, 2);

        ctx.restore();
    }

    renderGameOverModal(ctx) {
        ctx.save();
        ctx.translate(540, 960);

        // Container
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
        ctx.shadowBlur = 35;
        ctx.beginPath();
        ctx.roundRect(-380, -400, 760, 800, 48);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Header
        const headerGrad = ctx.createLinearGradient(0, -400, 0, -250);
        headerGrad.addColorStop(0, '#ff6b6b');
        headerGrad.addColorStop(1, '#c92a2a');
        ctx.fillStyle = headerGrad;
        ctx.beginPath();
        ctx.roundRect(-380, -400, 760, 150, [48, 48, 0, 0]);
        ctx.fill();

        ctx.font = '900 52px "Outfit", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#ffffff';
        ctx.fillText('GAME OVER', 0, -325);

        ctx.font = '900 70px sans-serif';
        ctx.fillText('🐷💔💣', 0, -180);

        ctx.font = '700 36px "Outfit", sans-serif';
        ctx.fillStyle = '#343a40';
        ctx.fillText('Out of Lives!', 0, -90);

        const score = this.modalData ? this.modalData.score : 0;
        const caught = this.modalData ? this.modalData.coinsCaught : 0;
        const target = this.modalData ? this.modalData.target : 20;

        ctx.font = '600 30px "Outfit", sans-serif';
        ctx.fillStyle = '#868e96';
        ctx.fillText(`Coins Caught: ${caught} / ${target}`, 0, -30);
        ctx.fillText(`Final Score: ${score}`, 0, 20);

        ctx.font = '500 22px "Outfit", sans-serif';
        ctx.fillStyle = '#868e96';
        ctx.fillText('✓ Game Over score reported to sendscoreapi.js', 0, 80);

        // TRY AGAIN Button
        ctx.translate(0, 180);
        const btnGrad = ctx.createLinearGradient(0, -40, 0, 40);
        btnGrad.addColorStop(0, '#339af0');
        btnGrad.addColorStop(1, '#1864ab');
        ctx.fillStyle = btnGrad;
        ctx.beginPath();
        ctx.roundRect(-170, -40, 340, 80, 40);
        ctx.fill();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 4;
        ctx.stroke();

        ctx.font = '900 38px "Outfit", sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.fillText('TRY AGAIN ↻', 0, 2);

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
        ctx.fillText('SELECT LEVEL', 0, -410);

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
