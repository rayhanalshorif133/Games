/**
 * UI & HUD Manager - Faithful replication of demo.png
 * Renders Header Bar with Score, Distance/Best, Fuel & Nitro meters, Golden Star Coin counter,
 * Speedometer Badge (MPH), interactive Metallic 3D Brake & Nitro touch buttons with availability states,
 * Game Over popup with "TRY AGAIN" and "BACK TO HOME" navigation,
 * and Pause popup with "RESUME", "RESTART", "BACK TO HOME", and top-right close cross.
 */

class UIManager {
    constructor(game) {
        this.game = game;
        this.highScore = parseInt(localStorage.getItem('lltt_highscore') || '25', 10);
        
        // Touch Hitboxes aligned precisely with visual positions
        this.touchControls = {
            pauseBtn: { x: 75, y: 68, r: 44 },
            coinBadge: { x: 180, y: 68, r: 35 },
            fuelGauge: { x: 810, y: 68, w: 160, h: 80 },
            nitroGauge: { x: 980, y: 68, w: 160, h: 80 },
            brakeBtn: { x: 185, y: 1710, r: 135, w: 270, h: 270 },
            boostBtn: { x: 895, y: 1710, r: 135, w: 270, h: 270 },
            speedBadge: { x: 540, y: 1865, w: 190, h: 110 },
            gameOverCloseBtn: { x: 860, y: 580, r: 34 },
            gameOverReviveBtn: { x: 540, y: 1040, w: 480, h: 84 },
            gameOverPlayAgainBtn: { x: 540, y: 1140, w: 480, h: 84 },
            gameOverHomeBtn: { x: 540, y: 1240, w: 480, h: 84 },
            pauseCloseBtn: { x: 830, y: 635, r: 32 },
            pauseResumeBtn: { x: 540, y: 790, w: 480, h: 86 },
            pauseRestartBtn: { x: 540, y: 900, w: 480, h: 86 },
            pauseHomeBtn: { x: 540, y: 1010, w: 480, h: 86 }
        };

        this.isBrakePressed = false;
        this.isNitroPressed = false;
        this.coinBump = 1.0;
    }

    triggerCoinBump() {
        this.coinBump = 1.5;
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

        // --- COIN COUNTER (Left-Center with dynamic spring bounce) ---
        this.coinBump = MathUtils.lerp(this.coinBump, 1.0, 0.12);
        const coinImg = this.game.assets.images['hud_coin.png'];
        if (coinImg) {
            ctx.save();
            ctx.translate(178, pb.y);
            ctx.scale(this.coinBump, this.coinBump);
            ctx.drawImage(coinImg, -28, -28, 56, 56);
            ctx.restore();
        }

        ctx.fillStyle = this.coinBump > 1.1 ? '#e76f51' : '#3e3428';
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
        ctx.fillStyle = fuelRatio < 0.25 ? '#ef476f' : '#483e33';
        ctx.textAlign = 'left';
        ctx.fillText(`${Math.round(fuelRatio * 100)}%`, 792, 100);

        // --- NITRO GAUGE (Far-Right) ---
        const nitroCenterX = 980;

        ctx.font = '900 24px "Segoe UI", Arial, sans-serif';
        ctx.fillStyle = p.isNitroActive ? '#00b4d8' : '#483e33';
        ctx.textAlign = 'center';
        ctx.fillText(p.isNitroActive ? '🔥 BOOSTING' : `NITRO (×${p.nitroCount})`, nitroCenterX, 36);

        // Nitro Capsule Track
        const nbx = 905, nby = 46, nbw = 150, nbh = 22, nbr = 11;
        ctx.fillStyle = '#7d7265';
        ctx.beginPath();
        ctx.roundRect(nbx, nby, nbw, nbh, nbr);
        ctx.fill();
        ctx.strokeStyle = '#685d52';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Nitro Fill: If active, shows countdown bar. If not active, shows full bar if nitroCount > 0
        let nitroRatio = 0;
        if (p.isNitroActive) {
            nitroRatio = MathUtils.clamp(p.nitroTimer / p.nitroDuration, 0, 1);
        } else if (p.nitroCount > 0) {
            nitroRatio = 1.0;
        }

        if (nitroRatio > 0.02) {
            ctx.save();
            ctx.beginPath();
            ctx.roundRect(nbx + 2, nby + 2, nbw - 4, nbh - 4, nbr - 2);
            ctx.clip();

            const nGrad = ctx.createLinearGradient(nbx, 0, nbx + nbw, 0);
            if (p.isNitroActive) {
                nGrad.addColorStop(0, '#00b4d8');
                nGrad.addColorStop(1, '#90e0ef');
            } else {
                nGrad.addColorStop(0, '#36a6b8');
                nGrad.addColorStop(1, '#8de0db');
            }
            ctx.fillStyle = nGrad;
            ctx.fillRect(nbx + 2, nby + 2, (nbw - 4) * nitroRatio, nbh - 4);
            ctx.restore();
        }

        // Nitro Icon & Percentage / Count
        const nitroIcon = this.game.assets.images['hud_nitro_icon.png'];
        if (nitroIcon) {
            ctx.drawImage(nitroIcon, 924, 78, 28, 28);
        }
        ctx.font = '900 24px "Segoe UI", Arial, sans-serif';
        if (p.isNitroActive) {
            ctx.fillStyle = '#00b4d8';
            ctx.textAlign = 'left';
            ctx.fillText(`${Math.ceil((p.nitroTimer / p.nitroDuration) * 100)}%`, 958, 100);
        } else if (p.nitroCount > 0) {
            ctx.fillStyle = '#1b7a63';
            ctx.textAlign = 'left';
            ctx.fillText(`× ${p.nitroCount} READY`, 958, 100);
        } else {
            ctx.fillStyle = '#ef476f';
            ctx.textAlign = 'left';
            ctx.fillText(`× 0 (EMPTY)`, 958, 100);
        }
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
        ctx.fillStyle = p.isNitroActive ? '#00f0ff' : '#fbf2d8';
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
            ctx.fillStyle = 'rgba(255, 60, 60, 0.22)';
            ctx.beginPath();
            ctx.arc(0, 0, btn.r * 0.95, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }

    drawNitroButton(ctx, p) {
        const btn = this.touchControls.boostBtn;
        const isBoosting = p.isNitroActive;
        const hasNitro = p.nitroCount > 0;
        const isPress = this.isNitroPressed || this.game.input.nitro;
        const scale = (isBoosting || isPress) ? 0.94 : 1.0;
        const sprite = this.game.assets.images['btn_nitro.png'];

        ctx.save();
        ctx.translate(btn.x, btn.y);
        ctx.scale(scale, scale);

        if (!hasNitro && !isBoosting) {
            // NITRO EMPTY STATE (x0)
            ctx.globalAlpha = 0.42;
            if (sprite) {
                ctx.drawImage(sprite, -btn.w / 2, -btn.h / 2, btn.w, btn.h);
            }
            ctx.globalAlpha = 1.0;

            // Dark empty mask
            ctx.fillStyle = 'rgba(15, 20, 25, 0.45)';
            ctx.beginPath();
            ctx.arc(0, 0, btn.r * 0.95, 0, Math.PI * 2);
            ctx.fill();

            // "EMPTY (x0)" Badge Pill
            ctx.fillStyle = 'rgba(239, 71, 111, 0.88)';
            ctx.beginPath();
            ctx.roundRect(-65, btn.r * 0.42, 130, 32, 16);
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.font = '900 18px "Segoe UI", Arial, sans-serif';
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText("EMPTY (x0)", 0, btn.r * 0.42 + 16);

            // Counter Badge on Top-Right (0)
            ctx.fillStyle = '#495057';
            ctx.beginPath();
            ctx.arc(btn.r * 0.65, -btn.r * 0.65, 30, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2.5;
            ctx.stroke();

            ctx.font = '900 22px "Segoe UI", Arial, sans-serif';
            ctx.fillStyle = '#adb5bd';
            ctx.fillText("0", btn.r * 0.65, -btn.r * 0.65 + 1);

        } else if (isBoosting) {
            // NITRO BOOSTING ACTIVE STATE
            if (sprite) {
                ctx.drawImage(sprite, -btn.w / 2, -btn.h / 2, btn.w, btn.h);
            }

            // Outer Boost Aura
            ctx.strokeStyle = 'rgba(0, 240, 255, 0.9)';
            ctx.lineWidth = 7;
            ctx.shadowColor = '#00f0ff';
            ctx.shadowBlur = 28;
            ctx.beginPath();
            ctx.arc(0, 0, btn.r * 0.98, 0, Math.PI * 2);
            ctx.stroke();
            ctx.shadowBlur = 0;

            // Spinning Dash Arc
            const spin = Date.now() * 0.009;
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.arc(0, 0, btn.r * 1.05, spin, spin + Math.PI * 1.3);
            ctx.stroke();

            // "BOOST!" Badge Pill
            ctx.fillStyle = '#00b4d8';
            ctx.beginPath();
            ctx.roundRect(-68, btn.r * 0.42, 136, 32, 16);
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.font = '900 18px "Segoe UI", Arial, sans-serif';
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText("⚡ BOOST!", 0, btn.r * 0.42 + 16);

            // Counter Badge on Top-Right
            ctx.fillStyle = '#00b4d8';
            ctx.beginPath();
            ctx.arc(btn.r * 0.65, -btn.r * 0.65, 30, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2.5;
            ctx.stroke();

            ctx.font = '900 22px "Segoe UI", Arial, sans-serif';
            ctx.fillStyle = '#ffffff';
            ctx.fillText(`x${p.nitroCount}`, btn.r * 0.65, -btn.r * 0.65 + 1);

        } else {
            // NITRO READY STATE
            if (sprite) {
                ctx.drawImage(sprite, -btn.w / 2, -btn.h / 2, btn.w, btn.h);
            }

            // Gentle pulsating ready ring
            const pulse = 1.0 + Math.sin(Date.now() * 0.006) * 0.03;
            ctx.strokeStyle = 'rgba(0, 212, 255, 0.65)';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(0, 0, btn.r * 0.98 * pulse, 0, Math.PI * 2);
            ctx.stroke();

            // "READY" Badge Pill
            ctx.fillStyle = 'rgba(6, 214, 160, 0.9)';
            ctx.beginPath();
            ctx.roundRect(-68, btn.r * 0.42, 136, 32, 16);
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.font = '900 18px "Segoe UI", Arial, sans-serif';
            ctx.fillStyle = '#112211';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(`⚡ READY (x${p.nitroCount})`, 0, btn.r * 0.42 + 16);

            // Glowing Counter Badge on Top-Right (x1, x2, x3...)
            const badgeGrad = ctx.createRadialGradient(btn.r * 0.65 - 4, -btn.r * 0.65 - 4, 2, btn.r * 0.65, -btn.r * 0.65, 30);
            badgeGrad.addColorStop(0, '#00f0ff');
            badgeGrad.addColorStop(1, '#0077b6');
            ctx.fillStyle = badgeGrad;
            ctx.shadowColor = '#00f0ff';
            ctx.shadowBlur = 12;
            ctx.beginPath();
            ctx.arc(btn.r * 0.65, -btn.r * 0.65, 30, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2.5;
            ctx.stroke();

            ctx.font = '900 22px "Segoe UI", Arial, sans-serif';
            ctx.fillStyle = '#ffffff';
            ctx.fillText(`x${p.nitroCount}`, btn.r * 0.65, -btn.r * 0.65 + 1);
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
        ctx.fillText("⛽ Collect Fuel Cans, Nitro & Stars to survive!", cx, cy + 775);

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
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText("TAP TO START", 0, 0);
        ctx.restore();

        ctx.restore();
    }

    drawGameOverScreen(ctx, reason) {
        ctx.save();
        const p = this.game.player;
        this.saveHighScore(p.score);

        // Backdrop Overlay
        ctx.fillStyle = 'rgba(15, 20, 15, 0.85)';
        ctx.fillRect(0, 0, 1080, 1920);

        const cx = 540;
        const cy = 940;

        // Modal Frame
        ctx.fillStyle = 'rgba(28, 35, 25, 0.96)';
        ctx.beginPath();
        ctx.roundRect(cx - 360, cy - 400, 720, 830, 32);
        ctx.fill();
        ctx.strokeStyle = '#d7b365';
        ctx.lineWidth = 4;
        ctx.stroke();

        // Inner Border
        ctx.strokeStyle = 'rgba(215, 179, 101, 0.35)';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(cx - 348, cy - 388, 696, 806);

        // Title
        ctx.font = '900 66px "Impact", "Arial Black", sans-serif';
        ctx.fillStyle = '#ef476f';
        ctx.textAlign = 'center';
        ctx.fillText("GAME OVER", cx, cy - 300);

        ctx.font = 'bold 30px "Segoe UI", Arial, sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(reason || "VEHICLE CRASHED!", cx, cy - 245);

        // Results Card
        ctx.fillStyle = 'rgba(15, 20, 15, 0.8)';
        ctx.beginPath();
        ctx.roundRect(cx - 310, cy - 215, 620, 230, 20);
        ctx.fill();
        ctx.strokeStyle = '#d7b365';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Cross (✕) Close Button (Top-Right of popup)
        const cb = this.touchControls.gameOverCloseBtn;
        ctx.save();
        ctx.fillStyle = '#4a2028';
        ctx.beginPath();
        ctx.arc(cb.x, cb.y, cb.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ef476f';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Draw ✕ symbol
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        const cr = 11;
        ctx.beginPath();
        ctx.moveTo(cb.x - cr, cb.y - cr);
        ctx.lineTo(cb.x + cr, cb.y + cr);
        ctx.moveTo(cb.x + cr, cb.y - cr);
        ctx.lineTo(cb.x - cr, cb.y + cr);
        ctx.stroke();
        ctx.restore();

        ctx.font = 'bold 28px "Segoe UI", Arial, sans-serif';
        ctx.fillStyle = '#b9a731';
        ctx.fillText("FINAL RESULTS", cx, cy - 165);

        ctx.textAlign = 'left';
        ctx.font = 'bold 30px "Segoe UI", Arial, sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.fillText("Total Score:", cx - 270, cy - 115);
        ctx.fillText("Distance Traveled:", cx - 270, cy - 65);
        ctx.fillText("Stars Collected:", cx - 270, cy - 15);

        ctx.textAlign = 'right';
        ctx.fillStyle = '#ffd166';
        ctx.fillText(`${p.score}`, cx + 270, cy - 115);
        ctx.fillStyle = '#06d6a0';
        ctx.fillText(`${Math.floor(p.distance)} m`, cx + 270, cy - 65);
        ctx.fillStyle = '#ffbe0b';
        ctx.fillText(`⭐ ${p.coins}`, cx + 270, cy - 15);

        // 1. REVIVE WITH COINS BUTTON
        const rb = this.touchControls.gameOverReviveBtn;
        const canRevive = p.coins >= 5;
        const pulseRevive = canRevive ? (1.0 + Math.sin(Date.now() * 0.008) * 0.04) : 1.0;

        ctx.save();
        ctx.translate(rb.x, rb.y);
        ctx.scale(pulseRevive, pulseRevive);

        if (canRevive) {
            // Active Golden Glowing Button
            const revGrad = ctx.createLinearGradient(-rb.w / 2, 0, rb.w / 2, 0);
            revGrad.addColorStop(0, '#ffbe0b');
            revGrad.addColorStop(1, '#fb5607');
            ctx.fillStyle = revGrad;
            ctx.beginPath();
            ctx.roundRect(-rb.w / 2, -rb.h / 2, rb.w, rb.h, 26);
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 3.5;
            ctx.stroke();

            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.font = '900 36px "Segoe UI", Arial, sans-serif';
            ctx.fillStyle = '#1b1b1e';
            ctx.fillText("⚡ REVIVE (5 ⭐)", 0, 0);
        } else {
            // Disabled Button (Not enough coins)
            ctx.fillStyle = 'rgba(45, 55, 45, 0.7)';
            ctx.beginPath();
            ctx.roundRect(-rb.w / 2, -rb.h / 2, rb.w, rb.h, 26);
            ctx.fill();
            ctx.strokeStyle = '#556b2f';
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.font = '900 30px "Segoe UI", Arial, sans-serif';
            ctx.fillStyle = '#8d99ae';
            ctx.fillText(`🔒 NEED 5 ⭐ TO REVIVE (${p.coins}/5)`, 0, 0);
        }
        ctx.restore();

        // 2. Try Again Button
        const pb = this.touchControls.gameOverPlayAgainBtn;
        const pulse = 1.0 + Math.sin(Date.now() * 0.006) * 0.03;
        ctx.save();
        ctx.translate(pb.x, pb.y);
        ctx.scale(pulse, pulse);

        ctx.fillStyle = '#06d6a0';
        ctx.beginPath();
        ctx.roundRect(-pb.w / 2, -pb.h / 2, pb.w, pb.h, 26);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3.5;
        ctx.stroke();

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = '900 36px "Segoe UI", Arial, sans-serif';
        ctx.fillStyle = '#112211';
        ctx.fillText("🔄 TRY AGAIN", 0, 0);
        ctx.restore();

        // 3. Back to Home Button
        const hb = this.touchControls.gameOverHomeBtn;
        ctx.save();
        ctx.translate(hb.x, hb.y);

        ctx.fillStyle = '#3a506b';
        ctx.beginPath();
        ctx.roundRect(-hb.w / 2, -hb.h / 2, hb.w, hb.h, 26);
        ctx.fill();
        ctx.strokeStyle = '#d7b365';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = '900 34px "Segoe UI", Arial, sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.fillText("🏠 BACK TO HOME", 0, 0);
        ctx.restore();

        ctx.restore();
    }

    drawPauseScreen(ctx) {
        ctx.save();
        // 1. Dark Backdrop Overlay
        ctx.fillStyle = 'rgba(15, 20, 15, 0.85)';
        ctx.fillRect(0, 0, 1080, 1920);

        const cx = 540;
        const cy = 900;
        const cardW = 680;
        const cardH = 580;

        // 2. Modal Card Background
        ctx.fillStyle = 'rgba(28, 35, 25, 0.96)';
        ctx.beginPath();
        ctx.roundRect(cx - cardW / 2, cy - cardH / 2, cardW, cardH, 32);
        ctx.fill();

        ctx.strokeStyle = '#d7b365';
        ctx.lineWidth = 4;
        ctx.stroke();

        // Inner decorative border
        ctx.strokeStyle = 'rgba(215, 179, 101, 0.35)';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(cx - cardW / 2 + 12, cy - cardH / 2 + 12, cardW - 24, cardH - 24);

        // 3. Top-Right "✕" Cross Button
        const cb = this.touchControls.pauseCloseBtn;
        ctx.save();
        ctx.fillStyle = '#ef476f';
        ctx.beginPath();
        ctx.arc(cb.x, cb.y, cb.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(cb.x - 11, cb.y - 11);
        ctx.lineTo(cb.x + 11, cb.y + 11);
        ctx.moveTo(cb.x + 11, cb.y - 11);
        ctx.lineTo(cb.x - 11, cb.y + 11);
        ctx.stroke();
        ctx.restore();

        // 4. Modal Header "GAME PAUSED"
        ctx.font = '900 60px "Impact", "Arial Black", sans-serif';
        ctx.fillStyle = '#fcf1b6';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText("GAME PAUSED", cx, cy - 190);

        // 5. RESUME Button
        const rb = this.touchControls.pauseResumeBtn;
        ctx.save();
        ctx.translate(rb.x, rb.y);
        ctx.fillStyle = '#06d6a0';
        ctx.beginPath();
        ctx.roundRect(-rb.w / 2, -rb.h / 2, rb.w, rb.h, 28);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = '900 38px "Segoe UI", Arial, sans-serif';
        ctx.fillStyle = '#112211';
        ctx.fillText("▶️ RESUME", 0, 0);
        ctx.restore();

        // 6. RESTART Button
        const rsb = this.touchControls.pauseRestartBtn;
        ctx.save();
        ctx.translate(rsb.x, rsb.y);
        ctx.fillStyle = '#f3c460';
        ctx.beginPath();
        ctx.roundRect(-rsb.w / 2, -rsb.h / 2, rsb.w, rsb.h, 28);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = '900 38px "Segoe UI", Arial, sans-serif';
        ctx.fillStyle = '#3a2e10';
        ctx.fillText("🔄 RESTART", 0, 0);
        ctx.restore();

        // 7. BACK TO HOME Button
        const hb = this.touchControls.pauseHomeBtn;
        ctx.save();
        ctx.translate(hb.x, hb.y);
        ctx.fillStyle = '#3a506b';
        ctx.beginPath();
        ctx.roundRect(-hb.w / 2, -hb.h / 2, hb.w, hb.h, 28);
        ctx.fill();
        ctx.strokeStyle = '#d7b365';
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = '900 36px "Segoe UI", Arial, sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.fillText("🏠 BACK TO HOME", 0, 0);
        ctx.restore();

        ctx.restore();
    }
}

window.UIManager = UIManager;
