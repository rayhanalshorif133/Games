/**
 * UI & HUD Manager - Faithful replication of demo.png
 * Renders Header Bar with Score, Distance/Best, Fuel & Nitro meters, Golden Star Coin counter,
 * Speedometer Badge (MPH), and realistic Metallic 3D Brake & Nitro touch buttons.
 */

class UIManager {
    constructor(game) {
        this.game = game;
        this.highScore = parseInt(localStorage.getItem('lltt_highscore') || '1020', 10);
        
        // Touch Hitboxes aligned precisely with visual positions
        this.touchControls = {
            pauseBtn: { x: 75, y: 68, r: 44 },
            coinBadge: { x: 180, y: 68, r: 35 },
            fuelGauge: { x: 810, y: 68, w: 160, h: 80 },
            nitroGauge: { x: 980, y: 68, w: 160, h: 80 },
            brakeBtn: { x: 185, y: 1710, r: 135, w: 270, h: 270 },
            boostBtn: { x: 895, y: 1710, r: 135, w: 270, h: 270 },
            speedBadge: { x: 540, y: 1865, w: 190, h: 110 }
        };

        this.isBrakePressed = false;
        this.isNitroPressed = false;
    }

    saveHighScore(score) {
        if (score > this.highScore) {
            this.highScore = score;
            localStorage.setItem('lltt_highscore', score.toString());
        }
    }

    drawHUD(ctx) {
        const p = this.game.player;
        ctx.save();

        // 1. TOP HUD HEADER BAR
        this.drawHeaderBar(ctx, p);

        // 2. SPEEDOMETER BADGE (Bottom Center)
        this.drawSpeedometer(ctx, p);

        // 3. BRAKE & NITRO 3D METALLIC CONTROLS
        this.drawBrakeButton(ctx);
        this.drawNitroButton(ctx, p);

        ctx.restore();
    }

    drawHeaderBar(ctx, p) {
        const h = 136;

        // Background Bar with subtle parchment beige vertical gradient
        const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
        bgGrad.addColorStop(0, '#f0eae0');
        bgGrad.addColorStop(1, '#e5dcbe');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, 1080, h);

        // Bottom separator border line
        ctx.strokeStyle = '#c4b79b';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, h);
        ctx.lineTo(1080, h);
        ctx.stroke();

        // Top edge highlight
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, 1);
        ctx.lineTo(1080, 1);
        ctx.stroke();

        // --- PAUSE BUTTON (Left) ---
        const pb = this.touchControls.pauseBtn;
        ctx.save();
        ctx.strokeStyle = '#685949';
        ctx.lineWidth = 4;
        ctx.fillStyle = '#e5dcbe';
        ctx.beginPath();
        ctx.arc(pb.x, pb.y, 38, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Pause bars (||)
        ctx.fillStyle = '#685949';
        ctx.beginPath();
        ctx.roundRect(pb.x - 12, pb.y - 18, 7, 36, 3.5);
        ctx.roundRect(pb.x + 5, pb.y - 18, 7, 36, 3.5);
        ctx.fill();
        ctx.restore();

        // --- COIN COUNTER (Left-Center) ---
        const coinImg = this.game.assets.images['hud_coin.png'];
        if (coinImg) {
            ctx.drawImage(coinImg, 150, pb.y - 28, 56, 56);
        }

        ctx.fillStyle = '#3e3428';
        ctx.font = '900 42px "Segoe UI", Arial, sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(`× ${p.coins}`, 218, pb.y + 2);

        // --- SCORE & DISTANCE (Center) ---
        ctx.textAlign = 'center';
        ctx.textBaseline = 'alphabetic';
        ctx.fillStyle = '#483e33';
        ctx.font = '900 44px "Segoe UI", Arial, sans-serif';
        ctx.fillText(`SCORE: ${p.score}`, 540, 58);

        ctx.font = 'bold 24px "Segoe UI", Arial, sans-serif';
        ctx.fillStyle = '#5a4f42';
        ctx.fillText(`DISTANCE: ${Math.floor(p.distance)}m | BEST: ${this.highScore}m`, 540, 102);

        // --- FUEL GAUGE (Right-Center) ---
        const fuelRatio = MathUtils.clamp(p.fuel / p.maxFuel, 0, 1);
        const fuelCenterX = 810;

        ctx.font = '900 24px "Segoe UI", Arial, sans-serif';
        ctx.fillStyle = '#483e33';
        ctx.textAlign = 'center';
        ctx.fillText('FUEL', fuelCenterX, 36);

        // Fuel Capsule Track
        const fbx = 735, fby = 46, fbw = 150, fbh = 22, fbr = 11;
        ctx.fillStyle = '#7d7265';
        ctx.beginPath();
        ctx.roundRect(fbx, fby, fbw, fbh, fbr);
        ctx.fill();
        ctx.strokeStyle = '#685d52';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Fuel Fill Gradient (Red/Pink to Amber Yellow)
        if (fuelRatio > 0.02) {
            ctx.save();
            ctx.beginPath();
            ctx.roundRect(fbx + 2, fby + 2, fbw - 4, fbh - 4, fbr - 2);
            ctx.clip();

            const fGrad = ctx.createLinearGradient(fbx, 0, fbx + fbw, 0);
            fGrad.addColorStop(0, '#e75565');
            fGrad.addColorStop(1, '#f3c460');
            ctx.fillStyle = fGrad;
            ctx.fillRect(fbx + 2, fby + 2, (fbw - 4) * fuelRatio, fbh - 4);
            ctx.restore();
        }

        // Fuel Icon & Percentage
        const fuelIcon = this.game.assets.images['hud_fuel_icon.png'];
        if (fuelIcon) {
            ctx.drawImage(fuelIcon, 755, 78, 28, 28);
        }
        ctx.font = '900 24px "Segoe UI", Arial, sans-serif';
        ctx.fillStyle = '#483e33';
        ctx.textAlign = 'left';
        ctx.fillText(`${Math.round(fuelRatio * 100)}%`, 792, 100);

        // --- NITRO GAUGE (Far-Right) ---
        const nitroRatio = MathUtils.clamp(p.nitro / p.maxNitro, 0, 1);
        const nitroCenterX = 980;

        ctx.font = '900 24px "Segoe UI", Arial, sans-serif';
        ctx.fillStyle = '#483e33';
        ctx.textAlign = 'center';
        ctx.fillText('NITRO', nitroCenterX, 36);

        // Nitro Capsule Track
        const nbx = 905, nby = 46, nbw = 150, nbh = 22, nbr = 11;
        ctx.fillStyle = '#7d7265';
        ctx.beginPath();
        ctx.roundRect(nbx, nby, nbw, nbh, nbr);
        ctx.fill();
        ctx.strokeStyle = '#685d52';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Nitro Fill Gradient (Teal to Cyan Mint)
        if (nitroRatio > 0.02) {
            ctx.save();
            ctx.beginPath();
            ctx.roundRect(nbx + 2, nby + 2, nbw - 4, nbh - 4, nbr - 2);
            ctx.clip();

            const nGrad = ctx.createLinearGradient(nbx, 0, nbx + nbw, 0);
            nGrad.addColorStop(0, '#36a6b8');
            nGrad.addColorStop(1, '#8de0db');
            ctx.fillStyle = nGrad;
            ctx.fillRect(nbx + 2, nby + 2, (nbw - 4) * nitroRatio, nbh - 4);
            ctx.restore();
        }

        // Nitro Icon & Percentage
        const nitroIcon = this.game.assets.images['hud_nitro_icon.png'];
        if (nitroIcon) {
            ctx.drawImage(nitroIcon, 928, 78, 28, 28);
        }
        ctx.font = '900 24px "Segoe UI", Arial, sans-serif';
        ctx.fillStyle = '#483e33';
        ctx.textAlign = 'left';
        ctx.fillText(`${Math.round(nitroRatio * 100)}%`, 964, 100);
    }

    drawSpeedometer(ctx, p) {
        const currentMph = Math.floor(p.speed * 4.8);
        const sb = this.touchControls.speedBadge;

        ctx.save();
        // Badge background
        ctx.fillStyle = '#383026';
        ctx.beginPath();
        ctx.roundRect(sb.x - sb.w / 2, 1815, sb.w, sb.h, [24, 24, 0, 0]);
        ctx.fill();

        // Speed Number
        ctx.fillStyle = '#fbf2d8';
        ctx.font = '900 66px "Segoe UI", Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'alphabetic';
        ctx.fillText(`${currentMph}`, sb.x, 1878);

        // MPH Label
        ctx.fillStyle = '#cfc19f';
        ctx.font = '900 20px "Segoe UI", Arial, sans-serif';
        ctx.fillText('MPH', sb.x, 1906);
        ctx.restore();
    }

    drawBrakeButton(ctx) {
        const btn = this.touchControls.brakeBtn;
        const isBraking = this.game.input.down || this.isBrakePressed;
        const scale = isBraking ? 0.94 : 1.0;
        const sprite = this.game.assets.images['btn_brake.png'];

        ctx.save();
        ctx.translate(btn.x, btn.y);
        ctx.scale(scale, scale);

        if (sprite) {
            ctx.drawImage(sprite, -btn.w / 2, -btn.h / 2, btn.w, btn.h);
        }

        // Active depression overlay
        if (isBraking) {
            ctx.fillStyle = 'rgba(255, 60, 60, 0.2)';
            ctx.beginPath();
            ctx.arc(0, 0, btn.r * 0.95, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }

    drawNitroButton(ctx, p) {
        const btn = this.touchControls.boostBtn;
        const isNitro = p.isNitroActive || this.game.input.nitro || this.isNitroPressed;
        const scale = isNitro ? 0.94 : 1.0;
        const sprite = this.game.assets.images['btn_nitro.png'];

        ctx.save();
        ctx.translate(btn.x, btn.y);
        ctx.scale(scale, scale);

        if (sprite) {
            ctx.drawImage(sprite, -btn.w / 2, -btn.h / 2, btn.w, btn.h);
        }

        // Active cyan boost glow
        if (isNitro) {
            ctx.strokeStyle = 'rgba(0, 240, 255, 0.75)';
            ctx.lineWidth = 5;
            ctx.shadowColor = '#00f0ff';
            ctx.shadowBlur = 20;
            ctx.beginPath();
            ctx.arc(0, 0, btn.r * 0.98, 0, Math.PI * 2);
            ctx.stroke();
            ctx.shadowBlur = 0;
        }

        ctx.restore();
    }

    drawStartScreen(ctx) {
        ctx.save();
        // Dark Overlay
        ctx.fillStyle = 'rgba(30, 35, 20, 0.78)';
        ctx.fillRect(0, 0, 1080, 1920);

        const cx = 540;
        const cy = 600;

        ctx.strokeStyle = '#fcf1b6';
        ctx.lineWidth = 6;
        ctx.strokeRect(cx - 380, cy - 200, 760, 240);
        ctx.strokeRect(cx - 370, cy - 190, 740, 220);

        ctx.font = '900 68px "Impact", "Arial Black", sans-serif';
        ctx.fillStyle = '#fcf1b6';
        ctx.textAlign = 'center';
        ctx.fillText("LONG LIVE", cx, cy - 90);
        ctx.fillText("THE TRUE", cx, cy - 10);

        ctx.font = 'bold 28px "Segoe UI", Arial, sans-serif';
        ctx.fillStyle = '#d7b365';
        ctx.fillText("HIGHWAY ODYSSEY - 1080x1920 EDITION", cx, cy + 90);

        // Car preview in center
        const carSprite = this.game.assets.images['car_red.png'];
        if (carSprite) {
            ctx.drawImage(carSprite, cx - 75, cy + 180, 150, 285);
        }

        // Instructions Card
        ctx.fillStyle = 'rgba(20, 25, 15, 0.88)';
        ctx.beginPath();
        ctx.roundRect(cx - 360, cy + 540, 720, 260, 24);
        ctx.fill();
        ctx.strokeStyle = '#b9a731';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#fcf1b6';
        ctx.font = 'bold 30px "Segoe UI", Arial, sans-serif';
        ctx.fillText("HOW TO PLAY", cx, cy + 590);

        ctx.font = '24px "Segoe UI", Arial, sans-serif';
        ctx.fillStyle = '#e9d37c';
        ctx.fillText("🕹️ Steer: Left / Right, Drag Screen, or Tap Lane", cx, cy + 640);
        ctx.fillText("🛑 Brake: BRAKE Button or Down Arrow / S", cx, cy + 685);
        ctx.fillText("⚡ Nitro: NITRO Button or Spacebar / W", cx, cy + 730);
        ctx.fillText("⛽ Collect Fuel Cans & Stars to survive!", cx, cy + 775);

        // Pulsing Start CTA Button
        const pulse = 1.0 + Math.sin(Date.now() * 0.006) * 0.05;
        ctx.save();
        ctx.translate(cx, cy + 920);
        ctx.scale(pulse, pulse);

        ctx.fillStyle = '#e63946';
        ctx.beginPath();
        ctx.roundRect(-240, -50, 480, 100, 30);
        ctx.fill();
        ctx.strokeStyle = '#fcf1b6';
        ctx.lineWidth = 4;
        ctx.stroke();

        ctx.font = '900 40px "Segoe UI", Arial, sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.textBaseline = 'middle';
        ctx.fillText("START ENGINE", 0, 0);
        ctx.restore();

        // High score banner
        ctx.font = 'bold 26px "Segoe UI", Arial, sans-serif';
        ctx.fillStyle = '#ffd166';
        ctx.fillText(`🏆 ALL TIME BEST: ${this.highScore}m`, cx, cy + 1040);

        ctx.restore();
    }

    drawGameOverScreen(ctx, reason) {
        ctx.save();
        ctx.fillStyle = 'rgba(20, 20, 25, 0.88)';
        ctx.fillRect(0, 0, 1080, 1920);

        const cx = 540;
        const cy = 680;
        const p = this.game.player;

        this.saveHighScore(Math.floor(p.distance));

        // Header
        ctx.font = '900 76px "Impact", "Arial Black", sans-serif';
        ctx.fillStyle = '#ef476f';
        ctx.textAlign = 'center';
        ctx.fillText("GAME OVER", cx, cy - 200);

        ctx.font = 'bold 34px "Segoe UI", Arial, sans-serif';
        ctx.fillStyle = '#fcf1b6';
        ctx.fillText(reason, cx, cy - 130);

        // Summary Card
        ctx.fillStyle = 'rgba(30, 35, 30, 0.92)';
        ctx.beginPath();
        ctx.roundRect(cx - 360, cy - 80, 720, 420, 28);
        ctx.fill();
        ctx.strokeStyle = '#d7b365';
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.font = 'bold 30px "Segoe UI", Arial, sans-serif';
        ctx.fillStyle = '#b9a731';
        ctx.fillText("FINAL RESULTS", cx, cy - 20);

        ctx.textAlign = 'left';
        ctx.font = 'bold 36px "Segoe UI", Arial, sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.fillText("Total Score:", cx - 280, cy + 60);
        ctx.fillText("Distance Traveled:", cx - 280, cy + 130);
        ctx.fillText("Stars Collected:", cx - 280, cy + 200);
        ctx.fillText("Best Record:", cx - 280, cy + 270);

        ctx.textAlign = 'right';
        ctx.fillStyle = '#ffd166';
        ctx.fillText(`${p.score}`, cx + 280, cy + 60);
        ctx.fillStyle = '#06d6a0';
        ctx.fillText(`${Math.floor(p.distance)} m`, cx + 280, cy + 130);
        ctx.fillStyle = '#ffbe0b';
        ctx.fillText(`⭐ ${p.coins}`, cx + 280, cy + 200);
        ctx.fillStyle = '#00f0ff';
        ctx.fillText(`${this.highScore} m`, cx + 280, cy + 270);

        // Play Again Button
        const pulse = 1.0 + Math.sin(Date.now() * 0.006) * 0.05;
        ctx.save();
        ctx.translate(cx, cy + 440);
        ctx.scale(pulse, pulse);

        ctx.fillStyle = '#06d6a0';
        ctx.beginPath();
        ctx.roundRect(-240, -50, 480, 100, 30);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 4;
        ctx.stroke();

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = '900 42px "Segoe UI", Arial, sans-serif';
        ctx.fillStyle = '#112211';
        ctx.fillText("PLAY AGAIN", 0, 0);
        ctx.restore();

        ctx.restore();
    }

    drawPauseScreen(ctx) {
        ctx.save();
        ctx.fillStyle = 'rgba(20, 25, 20, 0.85)';
        ctx.fillRect(0, 0, 1080, 1920);

        const cx = 540;
        const cy = 860;

        ctx.font = '900 72px "Impact", "Arial Black", sans-serif';
        ctx.fillStyle = '#fcf1b6';
        ctx.textAlign = 'center';
        ctx.fillText("PAUSED", cx, cy - 120);

        // Resume Button
        ctx.fillStyle = '#06d6a0';
        ctx.beginPath();
        ctx.roundRect(cx - 220, cy - 20, 440, 90, 24);
        ctx.fill();
        ctx.font = '900 38px "Segoe UI", Arial, sans-serif';
        ctx.fillStyle = '#112211';
        ctx.textBaseline = 'middle';
        ctx.fillText("RESUME", cx, cy + 25);

        // Restart Button
        ctx.fillStyle = '#ef476f';
        ctx.beginPath();
        ctx.roundRect(cx - 220, cy + 100, 440, 90, 24);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.fillText("RESTART", cx, cy + 145);

        ctx.restore();
    }
}

window.UIManager = UIManager;
