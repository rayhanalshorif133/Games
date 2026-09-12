/**
 * entities.js - Piggy Bank Coin Catcher Entities & Stage Obstacles
 * Contains:
 * - PlayerPiggy: Playable Piggy Bank character with physics, tilt, walking paws, expressions, and power-up auras.
 * - FallingItem: Gold coins, Star coins, Magnet & Multiplier power-ups, and Hazard Bombs with ricochet physics.
 * - StageBumper: Capsule bumpers that deflect falling items.
 * - StageRotator: Rotating paddles from demo.mp4 that ricochet items sideways.
 * - StageRingBumper: Silver metallic circular bumpers with high radial bounce.
 * - StagePeg: Golden musical pinball pins that chime on bounce.
 */

// ==========================================
// 1. PLAYABLE PIGGY BANK (The Player)
// ==========================================
class PlayerPiggy {
    constructor(startX = 540, startY = 1680) {
        this.x = startX;
        this.y = startY;
        this.targetX = startX;
        this.prevX = startX;
        this.vx = 0;

        // Catch zone bounds
        this.catchWidth = 190;
        this.catchHeight = 85;
        this.slotOffset = -45;

        // Visual properties
        this.tilt = 0;
        this.scaleX = 1;
        this.scaleY = 1;
        this.velScaleX = 0;
        this.velScaleY = 0;
        this.walkCycle = 0;

        // States
        this.eyeBlink = 0;
        this.blinkTimer = 2.5;
        this.happyTimer = 0;
        this.hurtTimer = 0;

        // Active Power-ups
        this.magnetTimer = 0;
        this.multiplierTimer = 0;
        this.shieldPulse = 0;
    }

    setTargetX(tx) {
        this.targetX = Math.max(120, Math.min(960, tx));
    }

    onCatchCoin(isStar = false) {
        this.scaleX = isStar ? 1.35 : 1.25;
        this.scaleY = isStar ? 0.70 : 0.76;
        this.velScaleX = 0;
        this.velScaleY = 0;
        this.happyTimer = 0.35;
    }

    onHitBomb() {
        this.hurtTimer = 0.65;
        this.scaleX = 0.85;
        this.scaleY = 1.25;
        this.velScaleX = 0;
        this.velScaleY = 0;
    }

    activateMagnet(duration = 6.0) {
        this.magnetTimer = Math.max(this.magnetTimer, duration);
    }

    activateMultiplier(duration = 8.0) {
        this.multiplierTimer = Math.max(this.multiplierTimer, duration);
    }

    update(dt) {
        this.prevX = this.x;

        const dx = this.targetX - this.x;
        this.x += dx * Math.min(1, dt * 18);
        this.vx = (this.x - this.prevX) / (dt || 0.016);

        const targetTilt = Math.max(-0.25, Math.min(0.25, this.vx * 0.00035));
        this.tilt += (targetTilt - this.tilt) * Math.min(1, dt * 12);

        if (Math.abs(this.vx) > 20) {
            this.walkCycle += dt * 18;
        }

        const k = 220;
        const d = 14;
        const fX = -k * (this.scaleX - 1) - d * this.velScaleX;
        const fY = -k * (this.scaleY - 1) - d * this.velScaleY;
        this.velScaleX += fX * dt;
        this.velScaleY += fY * dt;
        this.scaleX += this.velScaleX * dt;
        this.scaleY += this.velScaleY * dt;

        if (this.happyTimer > 0) this.happyTimer -= dt;
        if (this.hurtTimer > 0) this.hurtTimer -= dt;

        if (this.magnetTimer > 0) {
            this.magnetTimer -= dt;
            this.shieldPulse += dt * 4;
        }
        if (this.multiplierTimer > 0) {
            this.multiplierTimer -= dt;
        }

        this.blinkTimer -= dt;
        if (this.blinkTimer <= 0) {
            this.eyeBlink = 0.15;
            this.blinkTimer = 3 + Math.random() * 3;
        }
        if (this.eyeBlink > 0) this.eyeBlink -= dt;
    }

    render(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);

        // 1. Magnet Power-Up Aura
        if (this.magnetTimer > 0) {
            ctx.save();
            const pulseR = 190 + Math.sin(this.shieldPulse) * 12;
            ctx.strokeStyle = 'rgba(0, 242, 254, 0.75)';
            ctx.lineWidth = 4;
            ctx.setLineDash([14, 10]);
            ctx.lineDashOffset = -this.shieldPulse * 15;
            ctx.shadowColor = '#00f2fe';
            ctx.shadowBlur = 22;
            ctx.beginPath();
            ctx.arc(0, -10, pulseR, 0, Math.PI * 2);
            ctx.stroke();

            ctx.fillStyle = 'rgba(0, 242, 254, 0.08)';
            ctx.fill();
            ctx.restore();
        }

        // 2. 2X Multiplier Badge
        if (this.multiplierTimer > 0) {
            ctx.save();
            ctx.translate(0, -145);
            ctx.fillStyle = '#ffd43b';
            ctx.shadowColor = '#ffd43b';
            ctx.shadowBlur = 15;
            ctx.beginPath();
            ctx.roundRect(-70, -22, 140, 44, 22);
            ctx.fill();

            ctx.strokeStyle = '#e67700';
            ctx.lineWidth = 3;
            ctx.stroke();

            ctx.font = '900 24px "Outfit", sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#5c1022';
            ctx.fillText(`2X SCORE!`, 0, 2);
            ctx.restore();
        }

        ctx.rotate(this.tilt);
        ctx.scale(this.scaleX, this.scaleY);

        // 3. Ground Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
        ctx.beginPath();
        ctx.ellipse(0, 95, 175, 42, 0, 0, Math.PI * 2);
        ctx.fill();

        // 4. Feet (Walking animated paws)
        const pawOffset1 = Math.sin(this.walkCycle) * 8;
        const pawOffset2 = -pawOffset1;

        ctx.fillStyle = this.hurtTimer > 0 ? '#868e96' : '#ff8787';
        ctx.beginPath();
        ctx.ellipse(-105, 80 + pawOffset1, 24, 18, 0, 0, Math.PI * 2);
        ctx.ellipse(-45, 85 + pawOffset2, 24, 18, 0, 0, Math.PI * 2);
        ctx.ellipse(45, 85 + pawOffset1, 24, 18, 0, 0, Math.PI * 2);
        ctx.ellipse(105, 80 + pawOffset2, 24, 18, 0, 0, Math.PI * 2);
        ctx.fill();

        // 5. Ears
        ctx.fillStyle = this.hurtTimer > 0 ? '#495057' : '#f06595';
        ctx.beginPath();
        ctx.moveTo(-95, -55);
        ctx.quadraticCurveTo(-145, -125, -90, -115);
        ctx.quadraticCurveTo(-65, -95, -60, -65);
        ctx.fill();

        ctx.fillStyle = this.hurtTimer > 0 ? '#343a40' : '#c2255c';
        ctx.beginPath();
        ctx.moveTo(-90, -60);
        ctx.quadraticCurveTo(-125, -110, -90, -105);
        ctx.quadraticCurveTo(-75, -90, -70, -65);
        ctx.fill();

        ctx.fillStyle = this.hurtTimer > 0 ? '#495057' : '#f06595';
        ctx.beginPath();
        ctx.moveTo(95, -55);
        ctx.quadraticCurveTo(145, -125, 90, -115);
        ctx.quadraticCurveTo(65, -95, 60, -65);
        ctx.fill();

        ctx.fillStyle = this.hurtTimer > 0 ? '#343a40' : '#c2255c';
        ctx.beginPath();
        ctx.moveTo(90, -60);
        ctx.quadraticCurveTo(125, -110, 90, -105);
        ctx.quadraticCurveTo(75, -90, 70, -65);
        ctx.fill();

        // 6. Main Piggy Body
        const bodyGrad = ctx.createRadialGradient(-35, -30, 20, 0, 0, 160);
        if (this.hurtTimer > 0) {
            bodyGrad.addColorStop(0, '#ced4da');
            bodyGrad.addColorStop(0.5, '#868e96');
            bodyGrad.addColorStop(1, '#495057');
        } else {
            bodyGrad.addColorStop(0, '#fff0f6');
            bodyGrad.addColorStop(0.35, '#ffdeeb');
            bodyGrad.addColorStop(0.75, '#faa2c1');
            bodyGrad.addColorStop(1, '#f06595');
        }
        ctx.fillStyle = bodyGrad;
        ctx.beginPath();
        ctx.ellipse(0, 10, 160, 115, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = this.hurtTimer > 0 ? '#343a40' : '#e64980';
        ctx.lineWidth = 5;
        ctx.stroke();

        // 7. Top Coin Slot
        ctx.fillStyle = '#491217';
        ctx.beginPath();
        ctx.roundRect(-46, -92, 92, 18, 9);
        ctx.fill();

        ctx.strokeStyle = this.magnetTimer > 0 ? '#00f2fe' : '#ffdeeb';
        ctx.lineWidth = 3;
        ctx.stroke();

        // 8. Piggy Snout
        const snoutGrad = ctx.createLinearGradient(0, -25, 0, 35);
        snoutGrad.addColorStop(0, '#ffdeeb');
        snoutGrad.addColorStop(1, '#f783ac');
        ctx.fillStyle = snoutGrad;
        ctx.beginPath();
        ctx.ellipse(0, 20, 52, 36, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#d6336c';
        ctx.lineWidth = 4;
        ctx.stroke();

        ctx.fillStyle = '#a61e4d';
        ctx.beginPath();
        ctx.ellipse(-18, 20, 9, 14, 0, 0, Math.PI * 2);
        ctx.ellipse(18, 20, 9, 14, 0, 0, Math.PI * 2);
        ctx.fill();

        // 9. Eyes
        if (this.hurtTimer > 0) {
            ctx.strokeStyle = '#212529';
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.moveTo(-70, -28); ctx.lineTo(-50, -16); ctx.lineTo(-70, -4);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(70, -28); ctx.lineTo(50, -16); ctx.lineTo(70, -4);
            ctx.stroke();
        } else if (this.happyTimer > 0 || this.eyeBlink > 0) {
            ctx.strokeStyle = '#2b020d';
            ctx.lineWidth = 4.5;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.arc(-60, -18, 14, Math.PI * 1.1, Math.PI * 1.9);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(60, -18, 14, Math.PI * 1.1, Math.PI * 1.9);
            ctx.stroke();
        } else {
            ctx.fillStyle = '#212529';
            ctx.beginPath();
            ctx.ellipse(-60, -22, 13, 17, 0, 0, Math.PI * 2);
            ctx.ellipse(60, -22, 13, 17, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(-64, -27, 5, 0, Math.PI * 2);
            ctx.arc(56, -27, 5, 0, Math.PI * 2);
            ctx.arc(-58, -17, 2.5, 0, Math.PI * 2);
            ctx.arc(62, -17, 2.5, 0, Math.PI * 2);
            ctx.fill();
        }

        // 10. Rosy Cheeks
        ctx.fillStyle = 'rgba(240, 62, 62, 0.35)';
        ctx.beginPath();
        ctx.ellipse(-92, 14, 18, 12, 0, 0, Math.PI * 2);
        ctx.ellipse(92, 14, 18, 12, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}

// ==========================================
// 2. FALLING ITEMS WITH RICOCHET PHYSICS
// ==========================================
class FallingItem {
    constructor(type, x, y, speed, hasWind = false) {
        this.type = type; // 'coin' | 'star' | 'magnet' | 'multiplier' | 'bomb'
        this.x = x;
        this.y = y;
        this.vy = speed;
        this.vx = hasWind ? (Math.random() - 0.5) * 80 : (Math.random() - 0.5) * 20;
        this.hasWind = hasWind;
        this.windPhase = Math.random() * Math.PI * 2;

        this.radius = 28;
        if (type === 'star') this.radius = 32;
        if (type === 'bomb') this.radius = 34;
        if (type === 'magnet' || type === 'multiplier') this.radius = 30;

        this.rotation = Math.random() * Math.PI * 2;
        this.rotSpeed = (Math.random() - 0.5) * 4;
        this.isDead = false;
        this.trailTimer = 0;
        this.pulse = 0;
    }

    update(dt, player, particleSystem) {
        this.rotation += this.rotSpeed * dt;
        this.pulse += dt * 4;

        // Apply gentle gravity if bounced upwards
        if (this.vy < 300) {
            this.vy += 1200 * dt;
        }

        // Wind sway
        if (this.hasWind) {
            this.windPhase += dt * 2.5;
            this.x += Math.sin(this.windPhase) * 70 * dt;
        }

        // Magnet attraction
        if (player && player.magnetTimer > 0 && (this.type === 'coin' || this.type === 'star')) {
            const dx = player.x - this.x;
            const dy = (player.y + player.slotOffset) - this.y;
            const dist = Math.hypot(dx, dy);
            if (dist < 650 && dist > 10) {
                const pullStrength = 3800 * (1 - dist / 650);
                this.x += (dx / dist) * pullStrength * dt;
                this.y += (dy / dist) * pullStrength * dt;
            }
        }

        // Apply velocities
        this.x += this.vx * dt;
        this.y += this.vy * dt;

        // Wall bounce (left & right edges) so ricocheting coins stay in play!
        const margin = this.radius + 15;
        if (this.x < margin) {
            this.x = margin;
            this.vx = Math.abs(this.vx) * 0.75;
        } else if (this.x > 1080 - margin) {
            this.x = 1080 - margin;
            this.vx = -Math.abs(this.vx) * 0.75;
        }

        // Trail particles
        this.trailTimer += dt;
        if (this.trailTimer > 0.035 && particleSystem) {
            this.trailTimer = 0;
            if (this.type === 'coin' || this.type === 'star') {
                particleSystem.emitCoinTrail(this.x, this.y, this.vx, this.vy);
            }
        }

        if (this.y > 1950) {
            this.isDead = true;
        }
    }

    render(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);

        const r = this.radius;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
        ctx.beginPath();
        ctx.arc(3, 4, r, 0, Math.PI * 2);
        ctx.fill();

        if (this.type === 'coin') {
            this.renderCoin(ctx, r);
        } else if (this.type === 'star') {
            this.renderStar(ctx, r);
        } else if (this.type === 'magnet') {
            this.renderMagnet(ctx, r);
        } else if (this.type === 'multiplier') {
            this.renderMultiplier(ctx, r);
        } else if (this.type === 'bomb') {
            this.renderBomb(ctx, r);
        }

        ctx.restore();
    }

    renderCoin(ctx, r) {
        const rimGrad = ctx.createLinearGradient(-r, -r, r, r);
        rimGrad.addColorStop(0, '#fff490');
        rimGrad.addColorStop(0.3, '#f5c518');
        rimGrad.addColorStop(0.7, '#d49405');
        rimGrad.addColorStop(1, '#976400');
        ctx.fillStyle = rimGrad;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();

        const faceR = r * 0.82;
        const faceGrad = ctx.createRadialGradient(-faceR * 0.3, -faceR * 0.3, 2, 0, 0, faceR);
        faceGrad.addColorStop(0, '#ffec66');
        faceGrad.addColorStop(0.5, '#f5c518');
        faceGrad.addColorStop(1, '#d89403');
        ctx.fillStyle = faceGrad;
        ctx.beginPath();
        ctx.arc(0, 0, faceR, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#fff9db';
        ctx.shadowColor = '#d89403';
        ctx.shadowBlur = 4;
        const starR = faceR * 0.45;
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
            const a = (i * Math.PI * 2) / 5 - Math.PI / 2;
            const ai = a + Math.PI / 5;
            const x1 = Math.cos(a) * starR;
            const y1 = Math.sin(a) * starR;
            const x2 = Math.cos(ai) * (starR * 0.45);
            const y2 = Math.sin(ai) * (starR * 0.45);
            if (i === 0) ctx.moveTo(x1, y1);
            else ctx.lineTo(x1, y1);
            ctx.lineTo(x2, y2);
        }
        ctx.closePath();
        ctx.fill();

        ctx.shadowBlur = 0;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
        ctx.beginPath();
        ctx.ellipse(-r * 0.25, -r * 0.35, r * 0.45, r * 0.22, -Math.PI / 5, 0, Math.PI * 2);
        ctx.fill();
    }

    renderStar(ctx, r) {
        ctx.rotate(this.rotation);
        ctx.shadowColor = '#ffd43b';
        ctx.shadowBlur = 18;

        const outerR = r;
        const innerR = r * 0.48;
        ctx.fillStyle = '#ffe066';
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
            const a = (i * Math.PI * 2) / 5 - Math.PI / 2;
            const ai = a + Math.PI / 5;
            const x1 = Math.cos(a) * outerR;
            const y1 = Math.sin(a) * outerR;
            const x2 = Math.cos(ai) * innerR;
            const y2 = Math.sin(ai) * innerR;
            if (i === 0) ctx.moveTo(x1, y1);
            else ctx.lineTo(x1, y1);
            ctx.lineTo(x2, y2);
        }
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = '#f59f00';
        ctx.lineWidth = 3.5;
        ctx.stroke();

        ctx.shadowBlur = 0;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.28, 0, Math.PI * 2);
        ctx.fill();
    }

    renderMagnet(ctx, r) {
        ctx.shadowColor = '#00f2fe';
        ctx.shadowBlur = 15;

        ctx.fillStyle = 'rgba(0, 242, 254, 0.25)';
        ctx.beginPath();
        ctx.arc(0, 0, r + 6, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#00f2fe';
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.shadowBlur = 0;
        ctx.lineWidth = 10;
        ctx.strokeStyle = '#e03131';
        ctx.beginPath();
        ctx.arc(0, 2, r * 0.55, Math.PI, 0, false);
        ctx.stroke();

        ctx.strokeStyle = '#f8f9fa';
        ctx.beginPath();
        ctx.moveTo(-r * 0.55, 2); ctx.lineTo(-r * 0.55, 12);
        ctx.moveTo(r * 0.55, 2); ctx.lineTo(r * 0.55, 12);
        ctx.stroke();
    }

    renderMultiplier(ctx, r) {
        ctx.shadowColor = '#51cf66';
        ctx.shadowBlur = 15;

        ctx.fillStyle = '#40c057';
        ctx.beginPath();
        ctx.arc(0, 0, r + 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3.5;
        ctx.stroke();

        ctx.shadowBlur = 0;
        ctx.font = '900 28px "Outfit", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#ffffff';
        ctx.fillText('×2', 0, 2);
    }

    renderBomb(ctx, r) {
        const sparkPhase = Math.sin(this.pulse * 6);
        ctx.save();
        ctx.translate(r * 0.45, -r * 0.85);
        ctx.fillStyle = sparkPhase > 0 ? '#ff922b' : '#ff6b6b';
        ctx.shadowColor = '#ff922b';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(0, 0, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        ctx.strokeStyle = '#d9480f';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.moveTo(0, -r * 0.7);
        ctx.quadraticCurveTo(r * 0.3, -r * 0.7, r * 0.45, -r * 0.85);
        ctx.stroke();

        ctx.fillStyle = '#495057';
        ctx.beginPath();
        ctx.roundRect(-r * 0.22, -r * 0.88, r * 0.44, r * 0.25, 3);
        ctx.fill();

        const bombGrad = ctx.createRadialGradient(-r * 0.3, -r * 0.3, 2, 0, 0, r);
        bombGrad.addColorStop(0, '#495057');
        bombGrad.addColorStop(0.4, '#212529');
        bombGrad.addColorStop(1, '#000000');
        ctx.fillStyle = bombGrad;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ff6b6b';
        ctx.font = '900 24px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('💣', 0, 2);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.beginPath();
        ctx.ellipse(-r * 0.35, -r * 0.35, r * 0.3, r * 0.15, -Math.PI / 4, 0, Math.PI * 2);
        ctx.fill();
    }
}

// ==========================================
// 3. STAGE DEFLECTION OBSTACLES (From demo.mp4)
// ==========================================

/**
 * Capsule Bumper / Slider (White rounded pill on dotted track)
 */
class StageBumper {
    constructor(config) {
        this.x = config.x;
        this.y = config.y;
        this.width = config.width || 180;
        this.height = config.height || 48;
        this.capRadius = this.height / 2;
        this.restitution = 0.88;

        // Optional horizontal or vertical oscillation
        this.oscSpeed = config.oscSpeed || 0;
        this.oscRange = config.oscRange || 0;
        this.baseX = config.x;
        this.baseY = config.y;
        this.oscAxis = config.oscAxis || 'x';
        this.time = Math.random() * Math.PI * 2;
    }

    getSegment() {
        const halfLen = (this.width - this.height) / 2;
        return {
            x1: this.x - halfLen,
            y1: this.y,
            x2: this.x + halfLen,
            y2: this.y,
            radius: this.capRadius
        };
    }

    update(dt) {
        if (this.oscSpeed > 0 && this.oscRange > 0) {
            this.time += dt * this.oscSpeed;
            if (this.oscAxis === 'x') {
                this.x = this.baseX + Math.sin(this.time) * this.oscRange;
            } else {
                this.y = this.baseY + Math.sin(this.time) * this.oscRange;
            }
        }
    }

    render(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);

        const w = this.width;
        const h = this.height;
        const r = this.capRadius;

        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
        ctx.beginPath();
        ctx.roundRect(-w / 2, -h / 2 + 5, w, h, r);
        ctx.fill();

        // White 3D capsule gradient
        const outerGrad = ctx.createLinearGradient(0, -h / 2, 0, h / 2);
        outerGrad.addColorStop(0, '#ffffff');
        outerGrad.addColorStop(0.5, '#eef2f7');
        outerGrad.addColorStop(1, '#c5cbd3');
        ctx.fillStyle = outerGrad;
        ctx.beginPath();
        ctx.roundRect(-w / 2, -h / 2, w, h, r);
        ctx.fill();

        // Inner dark inset
        const inW = w * 0.55;
        const inH = h * 0.52;
        ctx.fillStyle = '#495057';
        ctx.beginPath();
        ctx.roundRect(-inW / 2, -inH / 2, inW, inH, inH / 2);
        ctx.fill();

        // Arrows inside
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(0, -inH * 0.3); ctx.lineTo(-6, -inH * 0.05); ctx.lineTo(6, -inH * 0.05); ctx.closePath();
        ctx.moveTo(0, inH * 0.3); ctx.lineTo(-6, inH * 0.05); ctx.lineTo(6, inH * 0.05); ctx.closePath();
        ctx.fill();

        ctx.restore();
    }
}

/**
 * Rotating Paddle (Rotator with ↻ icon from demo.mp4)
 */
class StageRotator {
    constructor(config) {
        this.x = config.x;
        this.y = config.y;
        this.length = config.length || 180;
        this.thickness = config.thickness || 48;
        this.capRadius = this.thickness / 2;
        this.angle = config.angle || (Math.PI / 4);
        this.spinSpeed = config.spinSpeed || 0; // if > 0, slowly spins continuously
        this.restitution = 0.92;
    }

    getSegment() {
        const halfLen = (this.length - this.thickness) / 2;
        const cos = Math.cos(this.angle);
        const sin = Math.sin(this.angle);
        return {
            x1: this.x - cos * halfLen,
            y1: this.y - sin * halfLen,
            x2: this.x + cos * halfLen,
            y2: this.y + sin * halfLen,
            radius: this.capRadius
        };
    }

    update(dt) {
        if (this.spinSpeed !== 0) {
            this.angle += this.spinSpeed * dt;
        }
    }

    render(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);

        // Dotted circular guide ring
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
        ctx.lineWidth = 3;
        ctx.setLineDash([8, 8]);
        ctx.beginPath();
        ctx.arc(0, 0, this.length * 0.58, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.rotate(this.angle);

        const w = this.length;
        const h = this.thickness;
        const r = this.capRadius;

        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
        ctx.beginPath();
        ctx.roundRect(-w / 2, -h / 2 + 5, w, h, r);
        ctx.fill();

        // Outer white capsule
        const outerGrad = ctx.createLinearGradient(0, -h / 2, 0, h / 2);
        outerGrad.addColorStop(0, '#ffffff');
        outerGrad.addColorStop(0.5, '#eef2f7');
        outerGrad.addColorStop(1, '#c5cbd3');
        ctx.fillStyle = outerGrad;
        ctx.beginPath();
        ctx.roundRect(-w / 2, -h / 2, w, h, r);
        ctx.fill();

        // Inner circle with circular arrow ↻
        const inR = h * 0.36;
        ctx.fillStyle = '#495057';
        ctx.beginPath();
        ctx.arc(0, 0, inR, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, inR * 0.55, -Math.PI * 0.7, Math.PI * 0.7);
        ctx.stroke();

        ctx.restore();
    }
}

/**
 * Silver Metallic Ring Bumper (from demo.mp4)
 */
class StageRingBumper {
    constructor(x, y, radius = 70) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.restitution = 0.95;
        this.pulse = 0;
    }

    hit() {
        this.pulse = 1.0;
    }

    update(dt) {
        if (this.pulse > 0) {
            this.pulse = Math.max(0, this.pulse - dt * 4);
        }
    }

    render(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);

        const r = this.radius * (1 + this.pulse * 0.08);

        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.arc(3, 5, r, 0, Math.PI * 2);
        ctx.fill();

        // Metallic Gradient
        const rimGrad = ctx.createLinearGradient(-r, -r, r, r);
        rimGrad.addColorStop(0, '#ffffff');
        rimGrad.addColorStop(0.3, '#d8dee9');
        rimGrad.addColorStop(0.7, '#8892b0');
        rimGrad.addColorStop(1, '#4c566a');
        ctx.fillStyle = rimGrad;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();

        // Dark middle
        ctx.fillStyle = '#2e3440';
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.78, 0, Math.PI * 2);
        ctx.fill();

        // Core
        const coreGrad = ctx.createRadialGradient(-r * 0.2, -r * 0.2, 2, 0, 0, r * 0.65);
        coreGrad.addColorStop(0, '#e5e9f0');
        coreGrad.addColorStop(0.6, '#a8b2d1');
        coreGrad.addColorStop(1, '#5e6779');
        ctx.fillStyle = coreGrad;
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.65, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}

/**
 * Stage Plinko Peg (Musical Pinball Pin)
 */
class StagePeg {
    constructor(x, y, radius = 18, noteIndex = 0) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.noteIndex = noteIndex;
        this.restitution = 0.90;
        this.flash = 0;
    }

    hit() {
        this.flash = 1.0;
    }

    update(dt) {
        if (this.flash > 0) {
            this.flash = Math.max(0, this.flash - dt * 4);
        }
    }

    render(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);

        const r = this.radius * (1 + this.flash * 0.25);

        ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
        ctx.beginPath();
        ctx.arc(2, 3, r, 0, Math.PI * 2);
        ctx.fill();

        const grad = ctx.createRadialGradient(-r * 0.3, -r * 0.3, 2, 0, 0, r);
        if (this.flash > 0) {
            grad.addColorStop(0, '#ffffff');
            grad.addColorStop(0.5, '#fff3bf');
            grad.addColorStop(1, '#ffd43b');
        } else {
            grad.addColorStop(0, '#fff9db');
            grad.addColorStop(0.4, '#ffd43b');
            grad.addColorStop(0.9, '#f59f00');
            grad.addColorStop(1, '#d9480f');
        }
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        ctx.restore();
    }
}

if (typeof window !== 'undefined') {
    window.PlayerPiggy = PlayerPiggy;
    window.FallingItem = FallingItem;
    window.StageBumper = StageBumper;
    window.StageRotator = StageRotator;
    window.StageRingBumper = StageRingBumper;
    window.StagePeg = StagePeg;
}
