// Merge Numbers - Canvas 2D High Performance Renderer
// Renders 1080x1920 layout: Board, 3D Tiles, Golden Connector Pipes, Bottom Banner, Tutorial Hand

class GameRenderer {
    constructor() {
        this.images = {};
        this.loadedCount = 0;
        this.totalImages = 0;
        this.allLoaded = false;

        this.buttons = {
            restart: { x: 920, y: 70, size: 84 },
            sound: { x: 800, y: 70, size: 84 },
            shuffle: { x: 680, y: 70, size: 84 },
            undo: { x: 560, y: 70, size: 84 },
            gameOverRestart: { x: 540, y: 1180, width: 340, height: 100 },
            gameOverShuffle: { x: 540, y: 1310, width: 340, height: 100 }
        };
    }

    preloadAssets(callback) {
        const assetList = [
            'tile_2', 'tile_4', 'tile_8', 'tile_16', 'tile_32', 'tile_64',
            'tile_128', 'tile_256', 'tile_512', 'tile_1024', 'tile_2048', 'tile_4096',
            'tile_slot', 'background', 'bottom_banner', 'hand_pointer',
            'score_card', 'btn_restart', 'btn_sound_on', 'btn_sound_off',
            'btn_shuffle', 'btn_undo', 'particle_sparkle',
            'popup_great', 'popup_awesome', 'popup_incredible', 'dialog_panel'
        ];

        this.totalImages = assetList.length;

        assetList.forEach(name => {
            const img = new Image();
            img.src = `images/${name}.png`;
            img.onload = () => {
                this.images[name] = img;
                this.loadedCount++;
                if (this.loadedCount >= this.totalImages) {
                    this.allLoaded = true;
                    if (callback) callback();
                }
            };
            img.onerror = () => {
                console.warn(`Failed loading images/${name}.png`);
                this.loadedCount++;
                if (this.loadedCount >= this.totalImages) {
                    this.allLoaded = true;
                    if (callback) callback();
                }
            };
        });
    }

    render(ctx, game, particleSys) {
        ctx.save();

        ctx.translate(particleSys.shakeX, particleSys.shakeY);

        if (this.images['background']) {
            ctx.drawImage(this.images['background'], 0, 0, 1080, 1920);
        } else {
            ctx.fillStyle = '#0d0e22';
            ctx.fillRect(0, 0, 1080, 1920);
        }

        this.renderHeader(ctx, game);
        this.renderGridSlots(ctx, game);
        this.renderTiles(ctx, game);
        this.renderConnections(ctx, game);
        this.renderPreviewBadge(ctx, game);

        if (this.images['bottom_banner']) {
            ctx.drawImage(this.images['bottom_banner'], 0, 1640, 1080, 280);
        }

        this.renderTutorialHand(ctx, game);
        particleSys.render(ctx);
        this.renderPopups(ctx, game);

        if (game.state === 'GAMEOVER') {
            this.renderGameOverModal(ctx, game);
        }

        ctx.restore();
    }

    renderHeader(ctx, game) {
        ctx.save();

        const scoreX = 60;
        const scoreY = 56;
        if (this.images['score_card']) {
            ctx.drawImage(this.images['score_card'], scoreX, scoreY, 220, 110);
        }
        ctx.font = 'bold 22px -apple-system, Segoe UI, sans-serif';
        ctx.fillStyle = '#f5c30a';
        ctx.textAlign = 'center';
        ctx.fillText('SCORE', scoreX + 110, scoreY + 38);

        ctx.font = 'bold 38px -apple-system, Segoe UI, sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(game.displayScore.toLocaleString(), scoreX + 110, scoreY + 84);

        const bestX = 300;
        const bestY = 56;
        if (this.images['score_card']) {
            ctx.drawImage(this.images['score_card'], bestX, bestY, 220, 110);
        }
        ctx.font = 'bold 22px -apple-system, Segoe UI, sans-serif';
        ctx.fillStyle = '#e3278b';
        ctx.textAlign = 'center';
        ctx.fillText('BEST', bestX + 110, bestY + 38);

        ctx.font = 'bold 38px -apple-system, Segoe UI, sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(game.bestScore.toLocaleString(), bestX + 110, bestY + 84);

        this.renderCircleButton(ctx, this.buttons.undo, this.images['btn_undo']);
        this.renderCircleButton(ctx, this.buttons.shuffle, this.images['btn_shuffle']);
        this.renderCircleButton(ctx, this.buttons.sound, window.audioManager.muted ? this.images['btn_sound_off'] : this.images['btn_sound_on']);
        this.renderCircleButton(ctx, this.buttons.restart, this.images['btn_restart']);

        // ⏱️ Countdown Timer Badge (300 seconds countdown)
        const totalSec = Math.max(0, Math.ceil(game.timeLeft));
        const mins = Math.floor(totalSec / 60);
        const secs = totalSec % 60;
        const timeStr = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

        const timerW = 200;
        const timerH = 46;
        const timerX = 540;
        const timerY = 202;

        ctx.save();
        ctx.translate(timerX, timerY);

        const isUrgent = totalSec <= 30;
        ctx.fillStyle = isUrgent ? 'rgba(75, 12, 24, 0.92)' : 'rgba(18, 22, 54, 0.88)';
        ctx.beginPath();
        ctx.roundRect(-timerW / 2, -timerH / 2, timerW, timerH, 23);
        ctx.fill();

        ctx.lineWidth = 3;
        ctx.strokeStyle = isUrgent ? '#ff4757' : 'rgba(75, 95, 180, 0.75)';
        ctx.stroke();

        ctx.font = 'bold 26px -apple-system, Segoe UI, sans-serif';
        ctx.fillStyle = isUrgent ? '#ff4757' : '#ffd32a';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`⏱ ${timeStr}`, 0, 1);

        ctx.restore();

        ctx.restore();
    }

    renderCircleButton(ctx, btn, img) {
        if (!img) return;
        ctx.save();
        ctx.drawImage(img, btn.x, btn.y, btn.size, btn.size);
        ctx.restore();
    }

    renderGridSlots(ctx, game) {
        const slotImg = this.images['tile_slot'];
        for (let r = 0; r < game.rows; r++) {
            for (let c = 0; c < game.cols; c++) {
                const center = game.getCellCenter(r, c);
                const half = game.tileSize / 2;
                if (slotImg) {
                    ctx.drawImage(slotImg, center.x - half, center.y - half, game.tileSize, game.tileSize);
                } else {
                    ctx.fillStyle = 'rgba(20, 24, 52, 0.6)';
                    ctx.beginPath();
                    ctx.roundRect(center.x - half, center.y - half, game.tileSize, game.tileSize, 28);
                    ctx.fill();
                }
            }
        }
    }

    renderConnections(ctx, game) {
        ctx.save();

        if (game.activeChain.length >= 1) {
            const baseVal = game.grid[game.activeChain[0].r][game.activeChain[0].c].value;
            const lineColor = game.getTileColor(baseVal);

            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            if (game.activeChain.length >= 2) {
                ctx.beginPath();
                for (let i = 0; i < game.activeChain.length; i++) {
                    const c = game.activeChain[i];
                    const center = game.getCellCenter(c.r, c.c);
                    if (i === 0) ctx.moveTo(center.x, center.y + 4);
                    else ctx.lineTo(center.x, center.y + 4);
                }
                ctx.lineWidth = 26;
                ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)';
                ctx.stroke();

                ctx.beginPath();
                for (let i = 0; i < game.activeChain.length; i++) {
                    const c = game.activeChain[i];
                    const center = game.getCellCenter(c.r, c.c);
                    if (i === 0) ctx.moveTo(center.x, center.y);
                    else ctx.lineTo(center.x, center.y);
                }
                ctx.lineWidth = 20;
                ctx.strokeStyle = lineColor;
                ctx.stroke();

                for (let i = 0; i < game.activeChain.length; i++) {
                    const c = game.activeChain[i];
                    const center = game.getCellCenter(c.r, c.c);
                    ctx.beginPath();
                    ctx.arc(center.x, center.y, 11, 0, Math.PI * 2);
                    ctx.fillStyle = lineColor;
                    ctx.fill();
                    ctx.beginPath();
                    ctx.arc(center.x, center.y - 1, 4, 0, Math.PI * 2);
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
                    ctx.fill();
                }
            }

            if (game.isDragging) {
                const lastCell = game.activeChain[game.activeChain.length - 1];
                const lastCenter = game.getCellCenter(lastCell.r, lastCell.c);

                ctx.beginPath();
                ctx.moveTo(lastCenter.x, lastCenter.y);
                ctx.lineTo(game.pointerPos.x, game.pointerPos.y);
                ctx.lineWidth = 16;
                ctx.strokeStyle = lineColor;
                ctx.stroke();

                ctx.beginPath();
                ctx.arc(game.pointerPos.x, game.pointerPos.y, 16, 0, Math.PI * 2);
                ctx.fillStyle = lineColor;
                ctx.fill();
                ctx.beginPath();
                ctx.arc(game.pointerPos.x, game.pointerPos.y, 8, 0, Math.PI * 2);
                ctx.fillStyle = '#ffffff';
                ctx.fill();
            }
        }
        else if (game.tutorialActive && game.tutorialPath && game.tutorialPath.length >= 2) {
            const path = game.tutorialPath;
            const progress = game.tutorialProgress;
            const maxIdx = Math.min(path.length - 1, Math.floor(progress));
            const frac = progress - Math.floor(progress);

            const baseVal = game.grid[path[0].r][path[0].c].value;
            const lineColor = game.getTileColor(baseVal);

            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            if (maxIdx >= 1 || frac > 0) {
                ctx.beginPath();
                const p0 = game.getCellCenter(path[0].r, path[0].c);
                ctx.moveTo(p0.x, p0.y + 4);

                for (let i = 1; i <= maxIdx; i++) {
                    const pt = game.getCellCenter(path[i].r, path[i].c);
                    ctx.lineTo(pt.x, pt.y + 4);
                }
                if (maxIdx < path.length - 1) {
                    const pCurr = game.getCellCenter(path[maxIdx].r, path[maxIdx].c);
                    const pNext = game.getCellCenter(path[maxIdx + 1].r, path[maxIdx + 1].c);
                    ctx.lineTo(pCurr.x + (pNext.x - pCurr.x) * frac, pCurr.y + (pNext.y - pCurr.y) * frac + 4);
                }
                ctx.lineWidth = 26;
                ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)';
                ctx.stroke();

                ctx.beginPath();
                ctx.moveTo(p0.x, p0.y);

                for (let i = 1; i <= maxIdx; i++) {
                    const pt = game.getCellCenter(path[i].r, path[i].c);
                    ctx.lineTo(pt.x, pt.y);
                }

                if (maxIdx < path.length - 1) {
                    const pCurr = game.getCellCenter(path[maxIdx].r, path[maxIdx].c);
                    const pNext = game.getCellCenter(path[maxIdx + 1].r, path[maxIdx + 1].c);
                    ctx.lineTo(pCurr.x + (pNext.x - pCurr.x) * frac, pCurr.y + (pNext.y - pCurr.y) * frac);
                }

                ctx.lineWidth = 20;
                ctx.strokeStyle = lineColor;
                ctx.stroke();

                for (let i = 0; i <= maxIdx; i++) {
                    const pt = game.getCellCenter(path[i].r, path[i].c);
                    ctx.beginPath();
                    ctx.arc(pt.x, pt.y, 11, 0, Math.PI * 2);
                    ctx.fillStyle = lineColor;
                    ctx.fill();
                    ctx.beginPath();
                    ctx.arc(pt.x, pt.y - 1, 4, 0, Math.PI * 2);
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
                    ctx.fill();
                }
            }
        }

        ctx.restore();
    }

    renderTiles(ctx, game) {
        for (let r = 0; r < game.rows; r++) {
            for (let c = 0; c < game.cols; c++) {
                const tile = game.grid[r][c];
                if (!tile) continue;

                ctx.save();
                ctx.translate(tile.x, tile.y);
                ctx.scale(tile.scale, tile.scale);

                const half = game.tileSize / 2;
                const tileImg = this.images[`tile_${tile.value}`];

                if (tileImg) {
                    ctx.drawImage(tileImg, -half, -half, game.tileSize, game.tileSize);
                } else {
                    ctx.fillStyle = game.getTileColor(tile.value);
                    ctx.beginPath();
                    ctx.roundRect(-half, -half, game.tileSize, game.tileSize, 28);
                    ctx.fill();
                    ctx.fillStyle = '#ffffff';
                    ctx.font = 'bold 58px sans-serif';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(tile.value, 0, 0);
                }

                const isSelected = game.activeChain.some(cell => cell.r === r && cell.c === c);
                if (isSelected) {
                    ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
                    ctx.lineWidth = 6;
                    ctx.beginPath();
                    ctx.roundRect(-half + 4, -half + 4, game.tileSize - 8, game.tileSize - 8, 24);
                    ctx.stroke();
                }

                if (tile.flash > 0) {
                    ctx.fillStyle = `rgba(255, 255, 255, ${tile.flash * 0.75})`;
                    ctx.beginPath();
                    ctx.roundRect(-half, -half, game.tileSize, game.tileSize, 28);
                    ctx.fill();
                }

                ctx.restore();
            }
        }
    }

    renderPreviewBadge(ctx, game) {
        if (game.activeChain.length >= 2) {
            const { resultVal } = game.calculateChainResult(game.activeChain);
            const lastCell = game.activeChain[game.activeChain.length - 1];
            const center = game.getCellCenter(lastCell.r, lastCell.c);

            const badgeY = center.y - 120;
            const badgeW = 160;
            const badgeH = 56;

            ctx.save();
            ctx.translate(center.x, badgeY);

            ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
            ctx.beginPath();
            ctx.roundRect(-badgeW / 2 + 3, -badgeH / 2 + 4, badgeW, badgeH, 28);
            ctx.fill();

            ctx.fillStyle = game.getTileColor(resultVal);
            ctx.beginPath();
            ctx.roundRect(-badgeW / 2, -badgeH / 2, badgeW, badgeH, 28);
            ctx.fill();

            ctx.lineWidth = 4;
            ctx.strokeStyle = '#ffffff';
            ctx.stroke();

            ctx.fillStyle = resultVal === 2 ? '#6c4c00' : '#ffffff';
            ctx.font = 'bold 32px -apple-system, Segoe UI, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(`➜ ${resultVal}`, 0, 0);

            ctx.restore();
        }
    }

    renderTutorialHand(ctx, game) {
        if (!game.tutorialActive || !game.tutorialPath || game.tutorialPath.length < 2) return;
        const handImg = this.images['hand_pointer'];
        if (!handImg) return;

        const path = game.tutorialPath;
        const progress = game.tutorialProgress;
        const maxIdx = Math.min(path.length - 1, Math.floor(progress));
        const frac = progress - Math.floor(progress);

        let hx, hy;
        if (maxIdx < path.length - 1) {
            const pCurr = game.getCellCenter(path[maxIdx].r, path[maxIdx].c);
            const pNext = game.getCellCenter(path[maxIdx + 1].r, path[maxIdx + 1].c);
            hx = pCurr.x + (pNext.x - pCurr.x) * frac;
            hy = pCurr.y + (pNext.y - pCurr.y) * frac;
        } else {
            const pEnd = game.getCellCenter(path[path.length - 1].r, path[path.length - 1].c);
            hx = pEnd.x;
            hy = pEnd.y;
        }

        ctx.save();
        ctx.translate(hx + 73, hy + 108);
        ctx.drawImage(handImg, -120, -120, 240, 240);
        ctx.restore();
    }

    renderPopups(ctx, game) {
        if (!game.activePopup) return;
        const pop = game.activePopup;

        let img = null;
        if (pop.text.includes('GREAT')) img = this.images['popup_great'];
        else if (pop.text.includes('AWESOME')) img = this.images['popup_awesome'];
        else if (pop.text.includes('INCREDIBLE')) img = this.images['popup_incredible'];

        ctx.save();
        ctx.translate(540, 960);
        ctx.scale(pop.scale, pop.scale);

        if (img) {
            ctx.drawImage(img, -300, -80, 600, 160);
        } else {
            ctx.fillStyle = '#ff9900';
            ctx.beginPath();
            ctx.roundRect(-260, -70, 520, 140, 36);
            ctx.fill();
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 54px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(pop.text, 0, 0);
        }

        ctx.restore();
    }

    renderGameOverModal(ctx, game) {
        ctx.save();

        ctx.fillStyle = 'rgba(5, 7, 18, 0.85)';
        ctx.fillRect(0, 0, 1080, 1920);

        const panelImg = this.images['dialog_panel'];
        const px = 540;
        const py = 960;
        if (panelImg) {
            ctx.drawImage(panelImg, px - 400, py - 350, 800, 700);
        } else {
            ctx.fillStyle = '#141738';
            ctx.beginPath();
            ctx.roundRect(px - 400, py - 350, 800, 700, 44);
            ctx.fill();
        }

        ctx.font = 'bold 56px -apple-system, Segoe UI, sans-serif';
        ctx.fillStyle = '#ff4757';
        ctx.textAlign = 'center';
        const titleText = game.gameOverReason === 'TIME_UP' ? "TIME'S UP!" : 'NO MORE MOVES!';
        ctx.fillText(titleText, px, py - 230);

        ctx.font = '32px -apple-system, Segoe UI, sans-serif';
        ctx.fillStyle = '#8a9ec4';
        ctx.fillText('YOUR SCORE', px, py - 140);

        ctx.font = 'bold 72px -apple-system, Segoe UI, sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(game.score.toLocaleString(), px, py - 60);

        ctx.font = '30px -apple-system, Segoe UI, sans-serif';
        ctx.fillStyle = '#f5c30a';
        ctx.fillText(`BEST SCORE: ${game.bestScore.toLocaleString()}`, px, py + 30);

        const btnPlay = this.buttons.gameOverRestart;
        ctx.fillStyle = '#2ecc71';
        ctx.beginPath();
        ctx.roundRect(btnPlay.x - btnPlay.width / 2, btnPlay.y - btnPlay.height / 2, btnPlay.width, btnPlay.height, 36);
        ctx.fill();
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#a8ffc8';
        ctx.stroke();

        ctx.font = 'bold 38px -apple-system, Segoe UI, sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.fillText('PLAY AGAIN', btnPlay.x, btnPlay.y + 12);

        const btnShuf = this.buttons.gameOverShuffle;
        ctx.fillStyle = '#e67e22';
        ctx.beginPath();
        ctx.roundRect(btnShuf.x - btnShuf.width / 2, btnShuf.y - btnShuf.height / 2, btnShuf.width, btnShuf.height, 36);
        ctx.fill();
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#ffd8a8';
        ctx.stroke();

        ctx.font = 'bold 36px -apple-system, Segoe UI, sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.fillText('SHUFFLE & REVIVE', btnShuf.x, btnShuf.y + 12);

        ctx.restore();
    }
}

window.gameRenderer = new GameRenderer();
