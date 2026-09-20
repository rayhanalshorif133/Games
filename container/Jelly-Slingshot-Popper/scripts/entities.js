// Game Entities: Ball, JellyMonster with Eye Tracking, Particle System, Floating Text, and ColorSwitcher

class Ball {
    constructor(x, y, color = 'red', vx = 0, vy = 0) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.radius = 38;
        this.color = color;
        this.isAlive = true;
        this.gravity = 820;
        this.hasPenalized = false;
        this.passedDangerLine = false;

        // Super Power Ball properties
        this.isSuperBall = (color === 'rainbow');
        this.gravity = this.isSuperBall ? 200 : 820;
        this.maxPierces = 5;
        this.pierceCount = 0;
        this.trail = [];
        this.glowAngle = 0;
    }

    update(dt) {
        this.vy += this.gravity * dt;
        this.x += this.vx * dt;
        this.y += this.vy * dt;

        if (this.isSuperBall) {
            this.glowAngle += dt * 8;
            this.trail.unshift({ x: this.x, y: this.y, alpha: 1.0, r: this.radius * 0.85 });
            if (this.trail.length > 12) this.trail.pop();
            for (let t of this.trail) {
                t.alpha -= dt * 3.5;
            }
        }
    }

    draw(ctx, ballImages = {}) {
        ctx.save();

        if (this.isSuperBall || this.color === 'rainbow') {
            // Draw sparkling motion trail
            for (let i = 0; i < this.trail.length; i++) {
                const t = this.trail[i];
                if (t.alpha > 0) {
                    ctx.save();
                    ctx.globalAlpha = Math.max(0, t.alpha * 0.55);
                    const trailColors = ['#ff3366', '#ffea00', '#00e676', '#00e5ff', '#d500f9'];
                    ctx.fillStyle = trailColors[i % trailColors.length];
                    ctx.beginPath();
                    ctx.arc(t.x, t.y, Math.max(2, t.r * (1 - i / this.trail.length)), 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                }
            }

            // Outer Pulsing Aura Ring
            const pulse = Math.sin(performance.now() * 0.008) * 6;
            const auraR = this.radius + 12 + pulse;
            const auraGrad = ctx.createRadialGradient(this.x, this.y, this.radius * 0.4, this.x, this.y, auraR);
            auraGrad.addColorStop(0, 'rgba(255, 220, 0, 0.75)');
            auraGrad.addColorStop(0.5, 'rgba(255, 50, 150, 0.45)');
            auraGrad.addColorStop(1, 'rgba(0, 230, 255, 0)');
            ctx.fillStyle = auraGrad;
            ctx.beginPath();
            ctx.arc(this.x, this.y, auraR, 0, Math.PI * 2);
            ctx.fill();

            // Rotating Electric Orbit Sparkles
            for (let i = 0; i < 4; i++) {
                const ang = this.glowAngle + i * (Math.PI / 2);
                const ox = this.x + Math.cos(ang) * (this.radius + 8);
                const oy = this.y + Math.sin(ang) * (this.radius + 8);
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(ox, oy, 5, 0, Math.PI * 2);
                ctx.fill();
            }

            // Dark Outline
            ctx.fillStyle = '#201025';
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fill();

            // Prismatic Rainbow Sphere Gradient
            const grad = ctx.createRadialGradient(
                this.x - this.radius * 0.35, this.y - this.radius * 0.35, this.radius * 0.08,
                this.x, this.y, this.radius - 2
            );
            grad.addColorStop(0, '#ffffff');
            grad.addColorStop(0.2, '#fff176');
            grad.addColorStop(0.45, '#ff4081');
            grad.addColorStop(0.75, '#7c4dff');
            grad.addColorStop(1, '#00b0ff');

            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius - 2, 0, Math.PI * 2);
            ctx.fill();

            // Bright Specular Glint
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.beginPath();
            ctx.arc(this.x - this.radius * 0.35, this.y - this.radius * 0.35, this.radius * 0.28, 0, Math.PI * 2);
            ctx.fill();

            // Center Power Star / Lightning Glyph & Remaining Charges Badge
            const remaining = Math.max(0, this.maxPierces - this.pierceCount);
            ctx.fillStyle = '#ffffff';
            ctx.font = "900 24px 'Fredoka', 'Nunito', sans-serif";
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(`⚡${remaining}`, this.x, this.y + 1);

            ctx.restore();
            return;
        }

        const img = ballImages[this.color];
        const size = this.radius * 2;

        if (img && img.complete && img.naturalWidth > 0) {
            ctx.drawImage(img, this.x - this.radius, this.y - this.radius, size, size);
        } else {
            // High-DPI procedural vector fallback
            // Drop shadow
            ctx.fillStyle = 'rgba(70, 60, 20, 0.28)';
            ctx.beginPath();
            ctx.ellipse(this.x + 3, this.y + 6, this.radius, this.radius * 0.95, 0, 0, Math.PI * 2);
            ctx.fill();

            // Dark outline
            ctx.fillStyle = '#1c1c1e';
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fill();

            // 3D sphere gradient
            const colorPresets = {
                red:    { light: '#ffb0b0', mid: '#ff284a', dark: '#9c0618' },
                yellow: { light: '#ffffcf', mid: '#ffd700', dark: '#b88200' },
                green:  { light: '#c8ffcb', mid: '#00e650', dark: '#008a2a' },
                blue:   { light: '#c4f0ff', mid: '#00b0ff', dark: '#0065ad' }
            };
            const pal = colorPresets[this.color] || colorPresets.red;

            const grad = ctx.createRadialGradient(
                this.x - this.radius * 0.35, this.y - this.radius * 0.35, this.radius * 0.1,
                this.x, this.y, this.radius - 2
            );
            grad.addColorStop(0, pal.light);
            grad.addColorStop(0.35, pal.mid);
            grad.addColorStop(1, pal.dark);

            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius - 2, 0, Math.PI * 2);
            ctx.fill();

            // Crisp specular glint
            ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
            ctx.beginPath();
            ctx.arc(this.x - this.radius * 0.32, this.y - this.radius * 0.32, this.radius * 0.26, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }
}

class JellyMonster {
    constructor(x, y, w, h, color, shape = 'square') {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.baseW = w;
        this.baseH = h;
        this.color = color;
        this.shape = shape; // 'square' or 'pill'
        this.isAlive = true;
        this.isDormant = false;
        this.hasPowerUp = false;

        // Eye properties
        this.eyeRadius = Math.min(w, h) * 0.28;
        this.eyeX = w / 2;
        this.eyeY = shape === 'pill' ? h * 0.33 : h * 0.40;
        this.pupilX = 0;
        this.pupilY = 0;
        this.pupilMaxDist = this.eyeRadius * 0.52;

        // Blinking
        this.blinkTimer = Math.random() * 4 + 2.5;
        this.blinkProgress = 0;
        this.isBlinking = false;

        // Squash and stretch spring
        this.scaleX = 1.0;
        this.scaleY = 1.0;
        this.velX = 0;
        this.velY = 0;

        // Continuous descent movement
        this.targetY = y;
        this.dizzyTimer = 0;

        // Idle floating wobble
        this.wobblePhase = Math.random() * Math.PI * 2;
    }

    triggerHitReaction() {
        this.scaleX = 1.25;
        this.scaleY = 0.75;
        this.velX = 0;
        this.velY = 0;
    }

    triggerWrongHitReaction() {
        this.scaleX = 0.75;
        this.scaleY = 1.35;
        this.velX = 0;
        this.velY = 0;
        this.dizzyTimer = 1.0;
    }

    update(dt, targetBall, descentSpeed = 0) {
        if (!this.isAlive) return;

        // Apply continuous downward motion
        if (descentSpeed > 0) {
            this.y += descentSpeed * dt;
            this.targetY = this.y;
        } else if (Math.abs(this.targetY - this.y) > 0.5) {
            this.y += (this.targetY - this.y) * 8.0 * dt;
        }

        // Spring dynamics for squash & stretch
        const k = 220; // spring stiffness
        const d = 16;  // damping
        const fx = -k * (this.scaleX - 1.0) - d * this.velX;
        const fy = -k * (this.scaleY - 1.0) - d * this.velY;
        this.velX += fx * dt;
        this.velY += fy * dt;
        this.scaleX += this.velX * dt;
        this.scaleY += this.velY * dt;

        // Idle breathing wobble
        this.wobblePhase += dt * 3.2;

        // Blinking logic
        this.blinkTimer -= dt;
        if (this.blinkTimer <= 0) {
            this.isBlinking = true;
            this.blinkProgress += dt * 8;
            if (this.blinkProgress >= 1) {
                this.isBlinking = false;
                this.blinkProgress = 0;
                this.blinkTimer = Math.random() * 4 + 3;
            }
        }

        // Eye tracking or dizzy swirl
        if (this.dizzyTimer > 0) {
            this.dizzyTimer -= dt;
            const swirl = performance.now() * 0.02;
            this.pupilX = Math.cos(swirl) * this.pupilMaxDist;
            this.pupilY = Math.sin(swirl) * this.pupilMaxDist;
        } else if (targetBall) {
            const worldEyeX = this.x + this.eyeX;
            const worldEyeY = this.y + this.eyeY;
            const dx = targetBall.x - worldEyeX;
            const dy = targetBall.y - worldEyeY;
            const dist = Math.hypot(dx, dy);

            if (dist > 5) {
                const targetPupilX = (dx / dist) * Math.min(this.pupilMaxDist, dist * 0.2);
                const targetPupilY = (dy / dist) * Math.min(this.pupilMaxDist, dist * 0.2);

                // Smoothly interpolate pupil
                const speed = 12.0;
                this.pupilX += (targetPupilX - this.pupilX) * speed * dt;
                this.pupilY += (targetPupilY - this.pupilY) * speed * dt;
            }
        } else {
            // Neutral looking forward
            this.pupilX += (0 - this.pupilX) * 6.0 * dt;
            this.pupilY += (0 - this.pupilY) * 6.0 * dt;
        }
    }

    draw(ctx, spriteMap = {}, pupilImg = null) {
        if (!this.isAlive) return;

        ctx.save();

        const cx = this.x + this.w / 2;
        const cy = this.y + this.h / 2;

        // Soft ground shadow
        ctx.fillStyle = 'rgba(70, 60, 20, 0.16)';
        ctx.beginPath();
        ctx.ellipse(cx, this.y + this.h + 8, this.w * 0.44, 12, 0, 0, Math.PI * 2);
        ctx.fill();

        // Apply squash & stretch centered at jelly
        ctx.translate(cx, cy);
        const idleSquash = 1.0 + Math.sin(this.wobblePhase) * 0.025;
        ctx.scale(this.scaleX * (2.0 - idleSquash), this.scaleY * idleSquash);
        ctx.translate(-cx, -cy);

        const activeColor = this.isDormant ? 'grey' : this.color;
        const spriteKey = this.shape === 'pill' ? `jelly_tall_${activeColor}` : `jelly_${activeColor}`;
        const sprite = spriteMap[spriteKey];

        // Corner radius
        const cornerR = this.shape === 'pill' ? 44 : 38;

        // Glowing Power-up Aura
        if (this.hasPowerUp) {
            const auraPulse = Math.sin(performance.now() * 0.008 + this.wobblePhase) * 6;
            ctx.fillStyle = 'rgba(255, 215, 0, 0.38)';
            ctx.beginPath();
            ctx.roundRect(this.x - 8 - auraPulse, this.y - 8 - auraPulse, this.w + 16 + auraPulse * 2, this.h + 16 + auraPulse * 2, cornerR + 8);
            ctx.fill();

            ctx.strokeStyle = 'rgba(255, 255, 120, 0.85)';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.roundRect(this.x - 4 - auraPulse * 0.5, this.y - 4 - auraPulse * 0.5, this.w + 8 + auraPulse, this.h + 8 + auraPulse, cornerR + 4);
            ctx.stroke();
        }

        if (sprite && sprite.complete && sprite.naturalWidth > 0) {
            ctx.drawImage(sprite, this.x, this.y, this.w, this.h);
        } else {
            // High-DPI procedural vector fallback
            this.drawProceduralBody(ctx, activeColor, cornerR);
        }

        // Draw Eye & Moving Pupil
        this.drawEye(ctx, pupilImg);

        // Draw Glowing Power-Up Badge in upper-right corner
        if (this.hasPowerUp) {
            const badgeX = this.x + this.w - 18;
            const badgeY = this.y + 18;
            const badgeR = 20;
            const badgePulse = Math.sin(performance.now() * 0.01 + this.wobblePhase) * 2.5;

            // Shadow
            ctx.fillStyle = 'rgba(20, 10, 5, 0.45)';
            ctx.beginPath();
            ctx.arc(badgeX + 2, badgeY + 3, badgeR + badgePulse, 0, Math.PI * 2);
            ctx.fill();

            // Gradient fill
            const bgGrad = ctx.createLinearGradient(badgeX - badgeR, badgeY - badgeR, badgeX + badgeR, badgeY + badgeR);
            bgGrad.addColorStop(0, '#fff44f');
            bgGrad.addColorStop(0.5, '#ff9900');
            bgGrad.addColorStop(1, '#e000ff');
            ctx.fillStyle = bgGrad;
            ctx.beginPath();
            ctx.arc(badgeX, badgeY, badgeR + badgePulse, 0, Math.PI * 2);
            ctx.fill();

            // White border
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 3;
            ctx.stroke();

            // Lightning glyph
            ctx.font = `bold ${Math.round(20 + badgePulse)}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#ffffff';
            ctx.fillText('⚡', badgeX, badgeY + 1);
        }

        ctx.restore();
    }

    drawProceduralBody(ctx, colorName, cornerR) {
        const x = this.x;
        const y = this.y;
        const w = this.w;
        const h = this.h;

        const palettes = {
            red:    { top: '#ff785f', mid: '#ff503c', belly: '#eb3c28', stroke: '#241c1c' },
            yellow: { top: '#ffeb4b', mid: '#ffdc1e', belly: '#e6b400', stroke: '#2b2314' },
            green:  { top: '#28f582', mid: '#00e669', belly: '#00b950', stroke: '#142819' },
            blue:   { top: '#32c8ff', mid: '#0ab0ff', belly: '#008cdc', stroke: '#14222d' },
            grey:   { top: '#b9bcc3', mid: '#a0a3aa', belly: '#7d8087', stroke: '#28282d' }
        };
        const pal = palettes[colorName] || palettes.grey;

        // Outer dark stroke
        ctx.fillStyle = pal.stroke;
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, cornerR);
        ctx.fill();

        // Inner main body
        const innerMargin = 5;
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(x + innerMargin, y + innerMargin, w - innerMargin * 2, h - innerMargin * 2, cornerR - 3);
        ctx.clip();

        // Body base fill
        ctx.fillStyle = pal.mid;
        ctx.fillRect(x, y, w, h);

        // Top lighter glossy highlight
        const topGrad = ctx.createLinearGradient(x, y, x, y + h * 0.45);
        topGrad.addColorStop(0, pal.top);
        topGrad.addColorStop(1, pal.mid);
        ctx.fillStyle = topGrad;
        ctx.fillRect(x, y, w, h * 0.45);

        // Rounded belly dome at bottom
        ctx.fillStyle = pal.belly;
        ctx.beginPath();
        ctx.ellipse(x + w / 2, y + h * 0.96, w * 0.48, h * 0.36, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

        // White Eye Sclera
        const eyeWorldX = x + this.eyeX;
        const eyeWorldY = y + this.eyeY;

        // Eye dark stroke
        ctx.fillStyle = '#1c1c20';
        ctx.beginPath();
        ctx.arc(eyeWorldX, eyeWorldY, this.eyeRadius + 2, 0, Math.PI * 2);
        ctx.fill();

        // Eye white
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(eyeWorldX, eyeWorldY, this.eyeRadius, 0, Math.PI * 2);
        ctx.fill();
    }

    drawEye(ctx, pupilImg) {
        const eyeCX = this.x + this.eyeX;
        const eyeCY = this.y + this.eyeY;

        if (this.isBlinking) {
            // Draw cute closed blinking eye curve
            ctx.strokeStyle = '#222226';
            ctx.lineWidth = 6;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.arc(eyeCX, eyeCY + 4, this.eyeRadius * 0.75, Math.PI * 1.15, Math.PI * 1.85);
            ctx.stroke();
            return;
        }

        const px = eyeCX + this.pupilX;
        const py = eyeCY + this.pupilY;
        const pupilR = this.eyeRadius * 0.44;

        if (pupilImg && pupilImg.complete && pupilImg.naturalWidth > 0) {
            ctx.drawImage(pupilImg, px - pupilR, py - pupilR, pupilR * 2, pupilR * 2);
        } else {
            // Procedural pupil
            ctx.fillStyle = '#18181c';
            ctx.beginPath();
            ctx.arc(px, py, pupilR, 0, Math.PI * 2);
            ctx.fill();

            // Specular reflection dot
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(px - pupilR * 0.35, py - pupilR * 0.35, pupilR * 0.38, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

class ColorSwitcher {
    constructor() {
        this.colors = ['red', 'yellow', 'green', 'blue'];
        this.activeColor = 'red';
        this.cx = 540;
        this.cy = 1775;
        this.radiusX = 175;
        this.radiusY = 46;
        this.ballRadius = 40;

        // Rotation angles
        this.currentAngle = Math.PI / 2; // Front position
        this.targetAngle = Math.PI / 2;

        // Arrow Buttons
        this.leftBtn = { x: 265, y: 1775, r: 38, isHover: false, scale: 1.0 };
        this.rightBtn = { x: 815, y: 1775, r: 38, isHover: false, scale: 1.0 };
        this.swapBadge = { x: 540, y: 1845, w: 240, h: 46 };
    }

    getFrontIndex() {
        // Find which color index is closest to front (angle = PI / 2)
        const normalizedAngle = ((this.currentAngle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
        let bestIdx = 0;
        let minDiff = 999;

        for (let i = 0; i < 4; i++) {
            const slotAngle = (normalizedAngle + i * (Math.PI / 2)) % (Math.PI * 2);
            // Distance to front angle (PI / 2)
            let diff = Math.abs(slotAngle - Math.PI / 2);
            if (diff > Math.PI) diff = Math.PI * 2 - diff;
            if (diff < minDiff) {
                minDiff = diff;
                bestIdx = i;
            }
        }
        return bestIdx;
    }

    rotateNext() {
        this.targetAngle -= Math.PI / 2;
        const targetIdx = ((this.colors.indexOf(this.activeColor) + 1) % 4);
        this.activeColor = this.colors[targetIdx];
        this.rightBtn.scale = 1.35;
        return this.activeColor;
    }

    rotatePrev() {
        this.targetAngle += Math.PI / 2;
        const targetIdx = ((this.colors.indexOf(this.activeColor) + 3) % 4);
        this.activeColor = this.colors[targetIdx];
        this.leftBtn.scale = 1.35;
        return this.activeColor;
    }

    cycleNext() {
        return this.rotateNext();
    }

    setColor(col) {
        const targetIdx = this.colors.indexOf(col);
        if (targetIdx === -1) return;

        const currentIdx = this.colors.indexOf(this.activeColor);
        let stepDiff = targetIdx - currentIdx;
        if (stepDiff === 3) stepDiff = -1;
        if (stepDiff === -3) stepDiff = 1;

        this.targetAngle -= stepDiff * (Math.PI / 2);
        this.activeColor = col;
    }

    checkClick(x, y) {
        // 1. Check Left Arrow Button ◀
        if (Math.hypot(x - this.leftBtn.x, y - this.leftBtn.y) <= this.leftBtn.r + 14) {
            return this.rotatePrev();
        }

        // 2. Check Right Arrow Button ▶
        if (Math.hypot(x - this.rightBtn.x, y - this.rightBtn.y) <= this.rightBtn.r + 14) {
            return this.rotateNext();
        }

        // 3. Check Center Swap Badge 🔄
        const sb = this.swapBadge;
        if (x >= sb.x - sb.w / 2 && x <= sb.x + sb.w / 2 &&
            y >= sb.y - sb.h / 2 && y <= sb.y + sb.h / 2) {
            return this.rotateNext();
        }

        // 4. Check specific rotating ball slots
        for (let i = 0; i < 4; i++) {
            const angle = this.currentAngle + i * (Math.PI / 2);
            const bx = this.cx + Math.cos(angle) * this.radiusX;
            const by = this.cy + Math.sin(angle) * this.radiusY;
            const depth = (Math.sin(angle) + 1) / 2;
            const r = this.ballRadius * (0.72 + depth * 0.52);

            if (Math.hypot(x - bx, y - by) <= r + 16) {
                this.setColor(this.colors[i]);
                return this.colors[i];
            }
        }

        // 5. Fallback tap anywhere on cylinder carousel
        if (Math.hypot(x - this.cx, y - this.cy) <= this.radiusX + 40) {
            if (x < this.cx - 50) return this.rotatePrev();
            return this.rotateNext();
        }

        return null;
    }

    update(dt) {
        // Damped spring interpolation for cylinder spin
        this.currentAngle += (this.targetAngle - this.currentAngle) * 14.0 * dt;

        // Button bounce decay
        if (this.leftBtn.scale > 1.0) {
            this.leftBtn.scale = Math.max(1.0, this.leftBtn.scale - dt * 3.5);
        }
        if (this.rightBtn.scale > 1.0) {
            this.rightBtn.scale = Math.max(1.0, this.rightBtn.scale - dt * 3.5);
        }

        // Keep activeColor aligned with closest front chamber
        const frontIdx = this.getFrontIndex();
        this.activeColor = this.colors[frontIdx];
    }

    draw(ctx, ballImages = {}) {
        ctx.save();

        const cx = this.cx;
        const cy = this.cy;

        // Subtle soft shadow track under revolving balls
        ctx.fillStyle = 'rgba(40, 30, 10, 0.12)';
        ctx.beginPath();
        ctx.ellipse(cx, cy + 10, this.radiusX + 30, this.radiusY + 18, 0, 0, Math.PI * 2);
        ctx.fill();

        // 2. Compute 3D Positions & Sort by Depth for Perfect Rendering
        const slotData = [];
        for (let i = 0; i < 4; i++) {
            const angle = this.currentAngle + i * (Math.PI / 2);
            const bx = cx + Math.cos(angle) * this.radiusX;
            const by = cy + Math.sin(angle) * this.radiusY;
            const depth = (Math.sin(angle) + 1) / 2; // 0 = back, 1 = front
            const scale = 0.72 + depth * 0.52;
            const isSelected = (this.colors[i] === this.activeColor);

            slotData.push({
                color: this.colors[i],
                x: bx,
                y: by,
                depth: depth,
                scale: scale,
                isSelected: isSelected
            });
        }

        // Sort: back balls first, front balls last
        slotData.sort((a, b) => a.depth - b.depth);

        // 3. Draw Revolving Bullet Chambers
        for (const slot of slotData) {
            ctx.save();
            ctx.translate(slot.x, slot.y);

            const r = this.ballRadius * slot.scale;

            // Soft shadow beneath each bullet
            ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
            ctx.beginPath();
            ctx.ellipse(0, r * 0.8, r * 0.85, r * 0.35, 0, 0, Math.PI * 2);
            ctx.fill();

            // Active front chamber glow ring
            if (slot.isSelected && slot.depth > 0.6) {
                ctx.fillStyle = 'rgba(255, 180, 0, 0.42)';
                ctx.beginPath();
                ctx.arc(0, 0, r + 18, 0, Math.PI * 2);
                ctx.fill();

                ctx.strokeStyle = '#ff9900';
                ctx.lineWidth = 6;
                ctx.beginPath();
                ctx.arc(0, 0, r + 9, 0, Math.PI * 2);
                ctx.stroke();
            }

            // Draw Ball Image or Procedural Vector
            const img = ballImages[slot.color];
            if (img && img.complete && img.naturalWidth > 0) {
                ctx.drawImage(img, -r, -r, r * 2, r * 2);
            } else {
                const colorPresets = {
                    red:    { light: '#ffb0b0', mid: '#ff284a', dark: '#9c0618' },
                    yellow: { light: '#ffffcf', mid: '#ffd700', dark: '#b88200' },
                    green:  { light: '#c8ffcb', mid: '#00e650', dark: '#008a2a' },
                    blue:   { light: '#c4f0ff', mid: '#00b0ff', dark: '#0065ad' }
                };
                const pal = colorPresets[slot.color] || colorPresets.red;
                ctx.fillStyle = '#1c1c1e';
                ctx.beginPath();
                ctx.arc(0, 0, r, 0, Math.PI * 2);
                ctx.fill();

                const grad = ctx.createRadialGradient(-r * 0.35, -r * 0.35, r * 0.1, 0, 0, r - 2);
                grad.addColorStop(0, pal.light);
                grad.addColorStop(0.35, pal.mid);
                grad.addColorStop(1, pal.dark);
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.arc(0, 0, r - 2, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
                ctx.beginPath();
                ctx.arc(-r * 0.32, -r * 0.32, r * 0.26, 0, Math.PI * 2);
                ctx.fill();
            }

            // Darken back balls for 3D depth perception
            if (slot.depth < 0.5) {
                ctx.fillStyle = `rgba(15, 15, 20, ${0.45 * (1.0 - slot.depth * 2)})`;
                ctx.beginPath();
                ctx.arc(0, 0, r, 0, Math.PI * 2);
                ctx.fill();
            }

            // Front selected indicator badge
            if (slot.isSelected && slot.depth > 0.6) {
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(r * 0.58, -r * 0.58, 14, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#22252a';
                ctx.lineWidth = 3;
                ctx.stroke();

                ctx.fillStyle = '#22252a';
                ctx.font = "bold 15px sans-serif";
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('✓', r * 0.58, -r * 0.58 + 1);
            }

            ctx.restore();
        }

        // 4. Draw Left ◀ and Right ▶ Revolver Spin Buttons
        this.drawArrowBtn(ctx, this.leftBtn.x, this.leftBtn.y, this.leftBtn.r * this.leftBtn.scale, '◀');
        this.drawArrowBtn(ctx, this.rightBtn.x, this.rightBtn.y, this.rightBtn.r * this.rightBtn.scale, '▶');

        ctx.restore();
    }

    drawArrowBtn(ctx, x, y, r, symbol) {
        ctx.save();
        ctx.translate(x, y);

        // Shadow
        ctx.fillStyle = 'rgba(30, 20, 10, 0.25)';
        ctx.beginPath();
        ctx.arc(0, 3, r, 0, Math.PI * 2);
        ctx.fill();

        // Circle
        const grad = ctx.createLinearGradient(0, -r, 0, r);
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(1, '#e8dcba');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#38260e';
        ctx.lineWidth = 4;
        ctx.stroke();

        // Symbol
        ctx.fillStyle = '#4c2608';
        ctx.font = `900 ${Math.round(r * 0.95)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(symbol, 0, 1);

        ctx.restore();
    }
}

class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 550 + 200;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed - 150;
        this.radius = Math.random() * 10 + 6;
        this.color = color;
        this.alpha = 1.0;
        this.life = 0;
        this.maxLife = Math.random() * 0.45 + 0.45;
        this.isAlive = true;
    }

    update(dt) {
        this.life += dt;
        if (this.life >= this.maxLife) {
            this.isAlive = false;
            return;
        }
        this.vy += 850 * dt; // gravity
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.alpha = Math.max(0, 1.0 - this.life / this.maxLife);
        this.radius = Math.max(1, this.radius * (1 - dt * 1.2));
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

class FloatingText {
    constructor(x, y, text, color = '#ffffff') {
        this.x = x;
        this.y = y;
        this.text = text;
        this.color = color;
        this.life = 0;
        this.maxLife = 0.85;
        this.isAlive = true;
        this.vy = -180;
        this.scale = 0.6;
    }

    update(dt) {
        this.life += dt;
        if (this.life >= this.maxLife) {
            this.isAlive = false;
            return;
        }
        this.y += this.vy * dt;
        this.vy *= 0.94;
        const progress = this.life / this.maxLife;
        if (progress < 0.2) {
            this.scale = 0.6 + (progress / 0.2) * 0.6; // pop up
        } else {
            this.scale = 1.2;
        }
    }

    draw(ctx) {
        ctx.save();
        const alpha = Math.max(0, 1.0 - this.life / this.maxLife);
        ctx.globalAlpha = alpha;
        ctx.font = `bold ${Math.round(42 * this.scale)}px 'Fredoka', 'Nunito', sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Dark shadow outline
        ctx.fillStyle = '#3a200a';
        ctx.fillText(this.text, this.x + 3, this.y + 4);

        ctx.fillStyle = this.color;
        ctx.fillText(this.text, this.x, this.y);

        ctx.restore();
    }
}

window.Ball = Ball;
window.JellyMonster = JellyMonster;
window.ColorSwitcher = ColorSwitcher;
window.Particle = Particle;
window.FloatingText = FloatingText;
