/**
 * Glow Air Hockey / Glow Pong Ball - UI & Scoreboard System
 * Authentic LED Dot-Matrix Numbers, HUD Buttons, Pause Menu & Victory Screen
 */

class UIManager {
    constructor(canvasWidth = 1080, canvasHeight = 1920) {
        this.width = canvasWidth;
        this.height = canvasHeight;

        // HUD Buttons (Top right)
        this.btnSound = { x: 870, y: 65, size: 75 };
        this.btnClose = { x: 965, y: 65, size: 75 };

        // Bitmaps for 5x7 LED dot-matrix numbers
        this.digitBitmaps = {
            '0': [
                "01110",
                "10001",
                "10011",
                "10101",
                "11001",
                "10001",
                "01110"
            ],
            '1': [
                "00100",
                "01100",
                "00100",
                "00100",
                "00100",
                "00100",
                "01110"
            ],
            '2': [
                "01110",
                "10001",
                "00001",
                "00110",
                "01000",
                "10000",
                "11111"
            ],
            '3': [
                "11110",
                "00001",
                "00001",
                "01110",
                "00001",
                "00001",
                "11110"
            ],
            '4': [
                "00010",
                "00110",
                "01010",
                "10010",
                "11111",
                "00010",
                "00010"
            ],
            '5': [
                "11111",
                "10000",
                "11110",
                "00001",
                "00001",
                "10001",
                "01110"
            ],
            '6': [
                "01110",
                "10000",
                "11110",
                "10001",
                "10001",
                "10001",
                "01110"
            ],
            '7': [
                "11111",
                "00001",
                "00010",
                "00100",
                "01000",
                "01000",
                "01000"
            ],
            '8': [
                "01110",
                "10001",
                "10001",
                "01110",
                "10001",
                "10001",
                "01110"
            ],
            '9': [
                "01110",
                "10001",
                "10001",
                "01111",
                "00001",
                "00001",
                "01110"
            ]
        };
    }

    drawLedDigit(ctx, digitChar, startX, startY, dotSize = 8, spacing = 2.5) {
        const rows = this.digitBitmaps[digitChar] || this.digitBitmaps['0'];
        ctx.save();
        ctx.fillStyle = '#ff2adb';
        ctx.shadowColor = '#ff2adb';
        ctx.shadowBlur = 12;

        for (let r = 0; r < 7; r++) {
            for (let c = 0; c < 5; c++) {
                if (rows[r][c] === '1') {
                    const px = startX + c * (dotSize + spacing);
                    const py = startY + r * (dotSize + spacing);
                    ctx.fillRect(px, py, dotSize, dotSize);
                }
            }
        }
        ctx.restore();
    }

    drawScoreNumber(ctx, score, rightX, centerY) {
        const str = String(score);
        const dotSize = 8.5;
        const spacing = 3.0;
        const charWidth = 5 * dotSize + 4 * spacing;
        const charHeight = 7 * dotSize + 6 * spacing;
        const totalWidth = str.length * charWidth + (str.length - 1) * 8;

        let curX = rightX - totalWidth;
        const startY = centerY - charHeight / 2;

        for (let i = 0; i < str.length; i++) {
            this.drawLedDigit(ctx, str[i], curX, startY, dotSize, spacing);
            curX += charWidth + 8;
        }
    }

    render(ctx, gameState, assets) {
        // 1. Render LED Scores on right edge of table
        // Top score (AI) at right edge, Y ~ 875
        this.drawScoreNumber(ctx, gameState.scoreAI, 915, 875);
        // Bottom score (Player) at right edge, Y ~ 1045
        this.drawScoreNumber(ctx, gameState.scorePlayer, 915, 1045);

        // 2. Render HUD Buttons (Top right)
        const sndSprite = gameState.soundMuted ? assets.btnSoundOff : assets.btnSoundOn;
        if (sndSprite) {
            ctx.drawImage(sndSprite, this.btnSound.x, this.btnSound.y, this.btnSound.size, this.btnSound.size);
        }
        if (assets.btnClose) {
            ctx.drawImage(assets.btnClose, this.btnClose.x, this.btnClose.y, this.btnClose.size, this.btnClose.size);
        }

        // 3. Render Overlays (Pause or Game Over)
        if (gameState.isPaused) {
            this.renderPauseMenu(ctx, gameState);
        } else if (gameState.isGameOver) {
            this.renderGameOver(ctx, gameState);
        }
    }

    renderPauseMenu(ctx, gameState) {
        ctx.save();
        // Dim backdrop
        ctx.fillStyle = 'rgba(5, 2, 10, 0.85)';
        ctx.fillRect(0, 0, this.width, this.height);

        // Modal Box
        const mw = 840, mh = 900;
        const mx = (this.width - mw) / 2, my = (this.height - mh) / 2;

        ctx.fillStyle = 'rgba(20, 8, 35, 0.95)';
        ctx.strokeStyle = '#ff38d8';
        ctx.lineWidth = 6;
        ctx.shadowColor = '#ff38d8';
        ctx.shadowBlur = 24;

        ctx.beginPath();
        ctx.roundRect(mx, my, mw, mh, 36);
        ctx.fill();
        ctx.stroke();

        // Title
        ctx.shadowBlur = 18;
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 72px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('PAUSED', this.width / 2, my + 140);

        // Difficulty Selector
        ctx.font = 'bold 36px "Courier New", monospace';
        ctx.fillStyle = '#ff70e8';
        ctx.fillText('DIFFICULTY', this.width / 2, my + 250);

        const diffs = ['EASY', 'MEDIUM', 'HARD', 'PRO'];
        const btnW = 160, btnH = 65, gap = 20;
        const startBx = this.width / 2 - (4 * btnW + 3 * gap) / 2;

        diffs.forEach((d, i) => {
            const bx = startBx + i * (btnW + gap);
            const by = my + 290;
            const isSel = (gameState.difficulty.toLowerCase() === d.toLowerCase());

            ctx.fillStyle = isSel ? '#ff26c8' : 'rgba(40, 15, 60, 0.8)';
            ctx.strokeStyle = isSel ? '#ffffff' : '#9030a0';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.roundRect(bx, by, btnW, btnH, 14);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = isSel ? '#ffffff' : '#d090e0';
            ctx.font = 'bold 26px "Courier New", monospace';
            ctx.fillText(d, bx + btnW / 2, by + 42);
        });

        // Resume Button
        this.renderMenuButton(ctx, this.width / 2, my + 480, 520, 85, 'RESUME GAME', '#00e5ff');
        // Restart Button
        this.renderMenuButton(ctx, this.width / 2, my + 600, 520, 85, 'RESTART MATCH', '#ff26c8');

        ctx.restore();
    }

    renderGameOver(ctx, gameState) {
        ctx.save();
        ctx.fillStyle = 'rgba(5, 2, 10, 0.9)';
        ctx.fillRect(0, 0, this.width, this.height);

        const mw = 840, mh = 850;
        const mx = (this.width - mw) / 2, my = (this.height - mh) / 2;

        const isWinner = (gameState.winner === 'player');
        const themeCol = isWinner ? '#00e5ff' : '#ff2255';

        ctx.fillStyle = 'rgba(18, 6, 32, 0.95)';
        ctx.strokeStyle = themeCol;
        ctx.lineWidth = 6;
        ctx.shadowColor = themeCol;
        ctx.shadowBlur = 30;

        ctx.beginPath();
        ctx.roundRect(mx, my, mw, mh, 36);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 76px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(isWinner ? 'YOU WIN!' : 'AI WINS!', this.width / 2, my + 170);

        ctx.font = 'bold 44px "Courier New", monospace';
        ctx.fillStyle = themeCol;
        ctx.fillText(`FINAL SCORE: ${gameState.scorePlayer} - ${gameState.scoreAI}`, this.width / 2, my + 280);

        // Play Again Button
        this.renderMenuButton(ctx, this.width / 2, my + 440, 520, 95, 'PLAY AGAIN', themeCol);

        ctx.restore();
    }

    renderMenuButton(ctx, cx, cy, w, h, label, color) {
        ctx.save();
        ctx.fillStyle = 'rgba(25, 8, 42, 0.9)';
        ctx.strokeStyle = color;
        ctx.lineWidth = 4;
        ctx.shadowColor = color;
        ctx.shadowBlur = 16;

        ctx.beginPath();
        ctx.roundRect(cx - w / 2, cy - h / 2, w, h, 20);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 36px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, cx, cy);
        ctx.restore();
    }
}

window.UIManager = UIManager;

