/**
 * Game Entities for Attack to Ship (1080x1920 layout)
 */

class ParticleSystem {
    constructor() {
        this.bubbles = [];
        this.explosions = [];
        this.floatingTexts = [];
        this.ripples = [];
        this.shockwaves = [];
        this.sparks = [];
        this.wakes = [];
    }

    addBubble(x, y, vx = 0, vy = -60, size = 6, alpha = 0.5) {
        this.bubbles.push({
            x, y, vx, vy,
            size,
            alpha,
            life: 1.0,
            maxLife: 1.0 + Math.random() * 0.8
        });
    }

    addExplosion(x, y, scale = 1.0) {
        this.explosions.push({
            x, y,
            frame: 0,
            scale,
            timer: 0,
            frameDuration: 0.05,
            totalFrames: 6
        });
        // Also spawn underwater shockwave ring and fiery metal sparks
        this.addShockwave(x, y, 90 * scale, 'rgba(0, 229, 255, 0.85)');
        this.addSparks(x, y, Math.floor(10 * scale), '#ffb300');
    }

    addShockwave(x, y, maxRadius = 130, color = 'rgba(0, 229, 255, 0.8)') {
        this.shockwaves.push({
            x, y,
            radius: 8,
            maxRadius,
            color,
            alpha: 1.0,
            life: 0.45
        });
    }

    addSparks(x, y, count = 12, color = '#ffca28') {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 70 + Math.random() * 260;
            this.sparks.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                color,
                size: 3 + Math.random() * 4,
                alpha: 1.0,
                life: 0.3 + Math.random() * 0.4
            });
        }
    }

    addWakeFoam(x, y) {
        this.wakes.push({
            x: x + (Math.random() - 0.5) * 12,
            y: y + (Math.random() - 0.5) * 4,
            radius: 4 + Math.random() * 6,
            maxRadius: 18 + Math.random() * 8,
            alpha: 0.75,
            life: 0.6
        });
    }

    addFloatingText(text, x, y, color = '#ffd54f', fontSize = 36) {
        this.floatingTexts.push({
            text, x, y,
            vy: -90,
            alpha: 1.0,
            color,
            fontSize,
            life: 1.2
        });
    }

    addWaterRipple(x, y) {
        this.ripples.push({
            x, y,
            radius: 8,
            maxRadius: 55,
            alpha: 0.9
        });
    }

    update(dt) {
        // Ambient underwater bubbles
        if (Math.random() < 0.28) {
            const bx = Math.random() * 1040 + 20;
            const by = 1900 - Math.random() * 100;
            this.addBubble(bx, by, (Math.random() - 0.5) * 15, -45 - Math.random() * 45, 4 + Math.random() * 5, 0.4);
        }

        // Update bubbles
        for (let i = this.bubbles.length - 1; i >= 0; i--) {
            const b = this.bubbles[i];
            b.x += b.vx * dt;
            b.y += b.vy * dt;
            b.life -= dt;
            b.alpha = Math.max(0, b.life / b.maxLife * 0.5);
            if (b.y <= 576 || b.life <= 0) {
                this.bubbles.splice(i, 1);
            }
        }

        // Update ship wake foam
        for (let i = this.wakes.length - 1; i >= 0; i--) {
            const w = this.wakes[i];
            w.life -= dt;
            w.radius += 18 * dt;
            w.alpha = Math.max(0, w.life / 0.6 * 0.7);
            if (w.life <= 0 || w.alpha <= 0) {
                this.wakes.splice(i, 1);
            }
        }

        // Update shockwaves
        for (let i = this.shockwaves.length - 1; i >= 0; i--) {
            const sw = this.shockwaves[i];
            sw.life -= dt;
            sw.radius += (sw.maxRadius - sw.radius) * Math.min(1.0, 14 * dt);
            sw.alpha = Math.max(0, sw.life / 0.45);
            if (sw.life <= 0) {
                this.shockwaves.splice(i, 1);
            }
        }

        // Update sparks
        for (let i = this.sparks.length - 1; i >= 0; i--) {
            const sp = this.sparks[i];
            sp.x += sp.vx * dt;
            sp.y += sp.vy * dt;
            sp.vy += 120 * dt; // gravity in water
            sp.life -= dt;
            sp.alpha = Math.max(0, sp.life / 0.5);
            if (sp.life <= 0) {
                this.sparks.splice(i, 1);
            }
        }

        // Update explosions
        for (let i = this.explosions.length - 1; i >= 0; i--) {
            const exp = this.explosions[i];
            exp.timer += dt;
            if (exp.timer >= exp.frameDuration) {
                exp.timer = 0;
                exp.frame++;
                if (exp.frame >= exp.totalFrames) {
                    this.explosions.splice(i, 1);
                }
            }
        }

        // Update floating texts
        for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
            const ft = this.floatingTexts[i];
            ft.y += ft.vy * dt;
            ft.life -= dt;
            ft.alpha = Math.max(0, ft.life / 1.2);
            if (ft.life <= 0) {
                this.floatingTexts.splice(i, 1);
            }
        }

        // Update ripples
        for (let i = this.ripples.length - 1; i >= 0; i--) {
            const rip = this.ripples[i];
            rip.radius += 55 * dt;
            rip.alpha = Math.max(0, 1.0 - rip.radius / rip.maxRadius);
            if (rip.radius >= rip.maxRadius) {
                this.ripples.splice(i, 1);
            }
        }
    }

    render(ctx, images) {
        // Render shockwaves
        for (const sw of this.shockwaves) {
            ctx.save();
            ctx.strokeStyle = sw.color.replace('0.85', sw.alpha.toFixed(2)).replace('0.8', sw.alpha.toFixed(2));
            ctx.lineWidth = 4 * sw.alpha;
            ctx.beginPath();
            ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }

        // Render wake foam
        for (const w of this.wakes) {
            ctx.fillStyle = `rgba(255, 255, 255, ${w.alpha})`;
            ctx.beginPath();
            ctx.arc(w.x, w.y, w.radius, 0, Math.PI * 2);
            ctx.fill();
        }

        // Render bubbles
        for (const b of this.bubbles) {
            ctx.fillStyle = `rgba(180, 240, 255, ${b.alpha})`;
            ctx.beginPath();
            ctx.arc(b.x, b.y, b.size, 0, Math.PI * 2);
            ctx.fill();
            // bubble shine
            ctx.fillStyle = `rgba(255, 255, 255, ${b.alpha * 1.5})`;
            ctx.beginPath();
            ctx.arc(b.x - b.size * 0.3, b.y - b.size * 0.3, b.size * 0.3, 0, Math.PI * 2);
            ctx.fill();
        }

        // Render sparks
        for (const sp of this.sparks) {
            ctx.fillStyle = sp.color;
            ctx.globalAlpha = sp.alpha;
            ctx.beginPath();
            ctx.arc(sp.x, sp.y, sp.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1.0;
        }

        // Render water surface ripples
        for (const rip of this.ripples) {
            ctx.strokeStyle = `rgba(230, 250, 255, ${rip.alpha})`;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.ellipse(rip.x, rip.y, rip.radius, rip.radius * 0.3, 0, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Render explosions
        const expImg = images['explosion'];
        for (const exp of this.explosions) {
            if (expImg && expImg.complete) {
                const fw = 100;
                const fh = 100;
                const dw = fw * exp.scale * 1.4;
                const dh = fh * exp.scale * 1.4;
                ctx.drawImage(
                    expImg,
                    exp.frame * fw, 0, fw, fh,
                    exp.x - dw / 2, exp.y - dh / 2, dw, dh
                );
            } else {
                ctx.fillStyle = `rgba(255, 140, 0, 0.8)`;
                ctx.beginPath();
                ctx.arc(exp.x, exp.y, 40 * exp.scale, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // Render floating score texts
        for (const ft of this.floatingTexts) {
            ctx.save();
            ctx.globalAlpha = ft.alpha;
            ctx.fillStyle = ft.color;
            ctx.font = `900 ${ft.fontSize}px 'Segoe UI', Impact, Arial Black, sans-serif`;
            ctx.textAlign = 'center';
            ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
            ctx.shadowBlur = 8;
            ctx.shadowOffsetX = 2;
            ctx.shadowOffsetY = 2;
            ctx.fillText(ft.text, ft.x, ft.y);
            ctx.restore();
        }
    }
}

class PlayerShip {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 300;
        this.height = 135;
        this.speed = 460;
        this.moveDir = 0; // -1, 0, 1
        this.tiltAngle = 0;

        this.maxHealth = 3;
        this.health = 3;
        this.invulnerableTimer = 0;

        this.hasShield = false;
        this.shieldTimer = 0;
        this.maxShieldTime = 10.0;
        this.shieldHp = 2; // Protects 2 hits
        this.maxShieldHp = 2;

        this.bombCooldown = 0;
        this.maxBombCooldown = 0.42;

        this.targetX = null;
        this.time = 0;
    }

    activateShield(duration = null) {
        if (!duration) {
            // Random duration between 6 and 12 seconds
            duration = Math.floor(Math.random() * (12 - 6 + 1)) + 6;
        }
        this.hasShield = true;
        this.shieldTimer = duration;
        this.maxShieldTime = duration;
        this.shieldHp = 2;
        this.maxShieldHp = 2;
    }

    hitShield(particleSys) {
        if (!this.hasShield) return null;
        window.soundEngine.playShieldHit();
        this.shieldHp--;
        if (this.shieldHp <= 0) {
            // 2nd hit: shield breaks and ends!
            this.hasShield = false;
            this.shieldTimer = 0;
            this.shieldHp = 0;
            window.soundEngine.playExplosion(false);
            if (particleSys) {
                particleSys.addShockwave(this.x + this.width / 2, this.y + this.height / 2, 170, 'rgba(255, 23, 68, 0.95)');
                particleSys.addSparks(this.x + this.width / 2, this.y + this.height / 2, 28, '#ff1744');
            }
            return { broken: true, remaining: 0 };
        } else {
            // 1st hit: shield absorbs and turns RED!
            if (particleSys) {
                particleSys.addShockwave(this.x + this.width / 2, this.y + this.height / 2, 130, 'rgba(255, 23, 68, 0.85)');
                particleSys.addSparks(this.x + this.width / 2, this.y + this.height / 2, 16, '#ff5252');
            }
            return { broken: false, remaining: 1 };
        }
    }

    takeDamage(particleSys) {
        if (this.hasShield) {
            return this.hitShield(particleSys);
        }

        if (this.invulnerableTimer > 0) return false;

        this.health--;
        this.invulnerableTimer = 1.8;
        window.soundEngine.playExplosion(true);
        return { playerHit: true };
    }

    update(dt, particleSys) {
        this.time += dt;

        let targetTilt = 0;

        // Move horizontally (via target position from drag/tap, or keyboard/button direction)
        if (this.targetX !== null) {
            const diff = this.targetX - this.x;
            if (Math.abs(diff) > 3) {
                this.x += diff * Math.min(1.0, 16 * dt);
                targetTilt = diff > 0 ? 0.045 : -0.045;
                if (particleSys && Math.random() < 0.35) {
                    particleSys.addWakeFoam(this.x + (diff > 0 ? 30 : this.width - 30), this.y + this.height - 15);
                }
            } else {
                this.x = this.targetX;
                this.targetX = null;
            }
        } else if (this.moveDir !== 0) {
            this.x += this.moveDir * this.speed * dt;
            targetTilt = this.moveDir * 0.045;
            if (particleSys && Math.random() < 0.35) {
                particleSys.addWakeFoam(this.x + (this.moveDir > 0 ? 30 : this.width - 30), this.y + this.height - 15);
            }
        }

        // Smooth bank tilt
        this.tiltAngle += (targetTilt - this.tiltAngle) * Math.min(1.0, 10 * dt);

        // Screen boundaries (1080 width)
        const minX = 20;
        const maxX = 1080 - this.width - 20;
        if (this.x < minX) this.x = minX;
        if (this.x > maxX) this.x = maxX;

        // Cooldowns
        if (this.bombCooldown > 0) {
            this.bombCooldown -= dt;
        }
        if (this.invulnerableTimer > 0) {
            this.invulnerableTimer -= dt;
        }

        // Shield countdown
        if (this.hasShield) {
            this.shieldTimer -= dt;
            if (this.shieldTimer <= 0) {
                this.hasShield = false;
                this.shieldHp = 0;
            }
        }
    }

    canDropBomb() {
        return this.bombCooldown <= 0;
    }

    createBomb() {
        if (!this.canDropBomb()) return null;
        this.bombCooldown = this.maxBombCooldown;
        window.soundEngine.playBombDrop();
        window.soundEngine.playWaterSplash();
        // Drop from bomb bay chute at center of hull
        const bombX = this.x + this.width / 2;
        const bombY = this.y + this.height - 30;
        return new DepthCharge(bombX, bombY);
    }

    getHitbox() {
        // Precise ship bounding box
        return {
            x: this.x + 30,
            y: this.y + 45,
            width: this.width - 60,
            height: this.height - 45
        };
    }

    getShieldHitbox() {
        if (!this.hasShield) return null;
        return {
            x: this.x - 26,
            y: this.y - 22,
            width: this.width + 52,
            height: this.height + 44
        };
    }

    render(ctx, images) {
        const shipImg = images['ship'];

        // Gentle floating water bobbing
        const bobOffset = Math.sin(this.time * 2.8) * 4;
        const renderY = this.y + bobOffset;

        ctx.save();

        // Invulnerability flashing
        if (this.invulnerableTimer > 0) {
            if (Math.floor(this.time * 12) % 2 === 0) {
                ctx.globalAlpha = 0.4;
            }
        }

        // Rotate around center for subtle dynamic ship banking
        ctx.translate(this.x + this.width / 2, renderY + this.height / 2);
        ctx.rotate(this.tiltAngle);
        ctx.translate(-(this.x + this.width / 2), -(renderY + this.height / 2));

        // Draw Ship
        if (shipImg && shipImg.complete) {
            ctx.drawImage(shipImg, this.x, renderY, this.width, this.height);
        } else {
            ctx.fillStyle = '#7d8b99';
            ctx.fillRect(this.x, renderY + 40, this.width, this.height - 40);
        }

        // Draw Round Protective Shield directly around the 4 sides of the boat
        if (this.hasShield) {
            ctx.save();
            const cx = this.x + this.width / 2;
            const cy = renderY + this.height / 2;

            // Breathing pulse
            const pulse = 1.0 + Math.sin(this.time * 6.5) * 0.03;
            const rx = (this.width / 2 + 26) * pulse;
            const ry = (this.height / 2 + 22) * pulse;

            // 1st hit turns shield RED, healthy is CYAN, low timer (<3s) pulses
            const isDamaged = (this.shieldHp === 1);
            const isLowTime = (this.shieldTimer < 3.0);
            const flash = (isDamaged || isLowTime) && (Math.sin(this.time * 14) > 0);

            // Primary shield color:
            // 1st hit taken -> RED!
            // Full health -> CYAN!
            const shieldColor = isDamaged ? '#ff1744' : (isLowTime && flash ? '#ff5252' : '#00e5ff');
            const innerGlowColor = isDamaged ? 'rgba(255, 23, 68, 0.22)' : 'rgba(0, 229, 255, 0.18)';
            const outerGlowColor = isDamaged ? 'rgba(255, 23, 68, 0.42)' : 'rgba(0, 229, 255, 0.36)';

            // 1. Forcefield translucent radial energy fill
            const grad = ctx.createRadialGradient(cx, cy, 30, cx, cy, rx);
            grad.addColorStop(0, isDamaged ? 'rgba(255, 23, 68, 0.06)' : 'rgba(0, 229, 255, 0.04)');
            grad.addColorStop(0.7, innerGlowColor);
            grad.addColorStop(1, outerGlowColor);
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
            ctx.fill();

            // 2. Outer glowing round energy perimeter ring
            ctx.shadowColor = shieldColor;
            ctx.shadowBlur = isDamaged ? 22 : 18;
            ctx.strokeStyle = shieldColor;
            ctx.lineWidth = isDamaged ? 4.0 : 3.5;
            ctx.beginPath();
            ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
            ctx.stroke();

            // 3. Subtle inner energetic contour line
            ctx.shadowBlur = 0;
            ctx.strokeStyle = isDamaged ? 'rgba(255, 120, 120, 0.65)' : 'rgba(180, 245, 255, 0.55)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.ellipse(cx, cy, rx - 6, ry - 6, 0, 0, Math.PI * 2);
            ctx.stroke();

            // 4. Concentric holographic radar orientation ticks around perimeter
            ctx.save();
            ctx.strokeStyle = isDamaged ? 'rgba(255, 50, 80, 0.7)' : 'rgba(0, 229, 255, 0.6)';
            ctx.lineWidth = 2.0;
            for (let a = 0; a < 8; a++) {
                const angle = a * (Math.PI / 4);
                const cosA = Math.cos(angle);
                const sinA = Math.sin(angle);
                const p1x = cx + cosA * (rx - 4);
                const p1y = cy + sinA * (ry - 4);
                const p2x = cx + cosA * (rx + 7);
                const p2y = cy + sinA * (ry + 7);
                ctx.beginPath();
                ctx.moveTo(p1x, p1y);
                ctx.lineTo(p2x, p2y);
                ctx.stroke();
            }
            ctx.restore();

            // 5. Orbiting energy spark nodes (2 nodes if full, 1 rapid red node if 1 hit left)
            const orbitCount = this.shieldHp;
            const orbitSpeed = this.time * (isDamaged ? 4.8 : 2.8);
            for (let i = 0; i < orbitCount; i++) {
                const angle = orbitSpeed + (i * Math.PI * 2 / orbitCount);
                const ox = cx + Math.cos(angle) * rx;
                const oy = cy + Math.sin(angle) * ry;
                ctx.fillStyle = '#ffffff';
                ctx.shadowColor = shieldColor;
                ctx.shadowBlur = 14;
                ctx.beginPath();
                ctx.arc(ox, oy, 4, 0, Math.PI * 2);
                ctx.fill();
            }

            // 6. Floating Timer & HP Badge directly above boat forcefield
            // Cyber-Naval Tactical Styling matching demo.jpg
            const timerPillW = 230;
            const timerPillH = 52;
            const timerPillX = cx - timerPillW / 2;
            const timerPillY = cy - ry - 60;

            // Cyber-Naval Titanium Base Gradient
            const bGrad = ctx.createLinearGradient(timerPillX, timerPillY, timerPillX, timerPillY + timerPillH);
            bGrad.addColorStop(0, '#061424');
            bGrad.addColorStop(1, '#020812');
            ctx.fillStyle = bGrad;
            ctx.roundRect(timerPillX, timerPillY, timerPillW, timerPillH, 18);
            ctx.fill();

            // Glowing neon border (Cyan if 2 hits, Red if 1 hit)
            ctx.strokeStyle = shieldColor;
            ctx.lineWidth = 2.5;
            ctx.shadowColor = shieldColor;
            ctx.shadowBlur = 12;
            ctx.roundRect(timerPillX, timerPillY, timerPillW, timerPillH, 18);
            ctx.stroke();
            ctx.shadowBlur = 0;

            // Large, Bold Pure White Timer Text with neon drop shadow
            ctx.font = "900 28px 'Impact', 'Segoe UI', Arial Black, sans-serif";
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            const hitLabel = (this.shieldHp === 2) ? '🛡️ 2/2' : '⚠️ 1/2';
            ctx.fillText(`⏱ ${Math.ceil(this.shieldTimer)}s   ${hitLabel}`, cx, timerPillY + 21);

            // Mini depletion progress gauge at bottom of badge
            const miniBarW = timerPillW - 32;
            const miniBarH = 5;
            const miniBarX = timerPillX + 16;
            const miniBarY = timerPillY + timerPillH - 11;
            const sPct = Math.max(0, Math.min(1, this.shieldTimer / this.maxShieldTime));

            ctx.fillStyle = '#020810';
            ctx.roundRect(miniBarX, miniBarY, miniBarW, miniBarH, 3);
            ctx.fill();

            ctx.fillStyle = shieldColor;
            ctx.roundRect(miniBarX, miniBarY, Math.max(6, miniBarW * sPct), miniBarH, 3);
            ctx.fill();

            ctx.restore();
        }

        ctx.restore();
    }
}

class DepthCharge {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 36;
        this.height = 68;
        this.speed = 430;
        this.time = 0;
        this.dead = false;
        this.bubbleTimer = 0;
    }

    update(dt, particleSys) {
        this.time += dt;
        this.y += this.speed * dt;

        // Spawn trailing air bubbles
        this.bubbleTimer += dt;
        if (this.bubbleTimer >= 0.04) {
            this.bubbleTimer = 0;
            particleSys.addBubble(
                this.x + (Math.random() - 0.5) * 8,
                this.y - 5,
                (Math.random() - 0.5) * 10,
                -30,
                3 + Math.random() * 3,
                0.55
            );
        }

        // Reach bottom of ocean
        if (this.y > 1920) {
            this.dead = true;
            particleSys.addExplosion(this.x, 1900, 0.7);
        }
    }

    getHitbox() {
        return {
            x: this.x - this.width / 2,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }

    render(ctx, images) {
        const bombImg = images['bomb'];
        if (bombImg && bombImg.complete) {
            ctx.drawImage(bombImg, this.x - this.width / 2, this.y, this.width, this.height);
        } else {
            ctx.fillStyle = '#6200ea';
            ctx.fillRect(this.x - 10, this.y, 20, 50);
        }

        // Armed blinking red beacon light at top of depth charge
        const blink = Math.sin(this.time * 20) > 0;
        if (blink) {
            ctx.fillStyle = '#ff1744';
            ctx.beginPath();
            ctx.arc(this.x, this.y + 4, 4, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

class EnemyTorpedo {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 32;
        this.height = 64;
        this.speed = 310;
        this.time = 0;
        this.dead = false;
        this.bubbleTimer = 0;
    }

    update(dt, particleSys) {
        this.time += dt;
        this.y -= this.speed * dt;

        // Propulsion bubble stream
        this.bubbleTimer += dt;
        if (this.bubbleTimer >= 0.04) {
            this.bubbleTimer = 0;
            particleSys.addBubble(
                this.x + (Math.random() - 0.5) * 6,
                this.y + this.height + 4,
                (Math.random() - 0.5) * 12,
                40 + Math.random() * 30, // downward wake bubbles
                3 + Math.random() * 4,
                0.55
            );
        }

        // Breach surface (Y <= 576)
        if (this.y <= 576) {
            this.dead = true;
            particleSys.addWaterRipple(this.x, 576);
            particleSys.addExplosion(this.x, 576, 0.6);
        }
    }

    getHitbox() {
        return {
            x: this.x - this.width / 2,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }

    render(ctx, images) {
        // Tactical Warning Indicator at water surface (Y=574) when torpedo is rising
        if (this.y > 576 && this.y < 1250) {
            const urgency = Math.sin(this.time * 16) > 0;
            ctx.save();
            ctx.strokeStyle = urgency ? 'rgba(255, 23, 68, 0.45)' : 'rgba(255, 152, 0, 0.25)';
            ctx.setLineDash([6, 6]);
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(this.x, 576);
            ctx.lineTo(this.x, this.y);
            ctx.stroke();

            // Pulsing warning chevron at the surface
            ctx.fillStyle = urgency ? '#ff1744' : '#ff9800';
            ctx.font = "900 24px sans-serif";
            ctx.textAlign = 'center';
            ctx.fillText('▲', this.x, 570);
            ctx.restore();
        }

        const torpImg = images['torpedo'];
        if (torpImg && torpImg.complete) {
            ctx.drawImage(torpImg, this.x - this.width / 2, this.y, this.width, this.height);
        } else {
            ctx.fillStyle = '#f44336';
            ctx.fillRect(this.x - 8, this.y, 16, 45);
        }
    }
}

class Submarine {
    constructor(type, x, y, dir = 1) {
        this.type = type; // 'scout', 'patrol', 'military'
        this.x = x;
        this.y = y;
        this.dir = dir; // 1 (moving right), -1 (moving left)
        this.dead = false;
        this.time = Math.random() * 10;
        this.flashTimer = 0;
        this.isSinking = false;
        this.sinkTimer = 1.0;

        if (type === 'scout') {
            this.width = 145;
            this.height = 78;
            this.speed = 220 + Math.random() * 40;
            this.maxHp = 1;
            this.hp = 1;
            this.points = 10;
            this.fireCooldown = 3.5 + Math.random() * 3.0;
        } else if (type === 'patrol') {
            this.width = 200;
            this.height = 82;
            this.speed = 160 + Math.random() * 35;
            this.maxHp = 1;
            this.hp = 1;
            this.points = 15;
            this.fireCooldown = 2.8 + Math.random() * 2.5;
        } else {
            // military
            this.width = 360;
            this.height = 76;
            this.speed = 110 + Math.random() * 25;
            this.maxHp = 2;
            this.hp = 2;
            this.points = 20;
            this.fireCooldown = 2.2 + Math.random() * 2.0;
        }
    }

    update(dt, torpedoList, particleSys) {
        this.time += dt;

        if (this.flashTimer > 0) {
            this.flashTimer -= dt;
        }

        if (this.isSinking) {
            this.sinkTimer -= dt;
            this.y += 85 * dt;
            this.x += this.dir * 40 * dt;
            if (particleSys && Math.random() < 0.28) {
                particleSys.addBubble(this.x + this.width / 2, this.y + 10, (Math.random() - 0.5) * 15, -45, 4, 0.5);
            }
            if (this.sinkTimer <= 0) {
                this.dead = true;
            }
            return;
        }

        this.x += this.dir * this.speed * dt;

        // Torpedo firing timer
        this.fireCooldown -= dt;
        if (this.fireCooldown <= 0) {
            // Check if submarine is roughly on screen
            if (this.x > 80 && this.x < 1000) {
                this.fireTorpedo(torpedoList);
            }
            this.fireCooldown = 3.0 + Math.random() * 3.0;
        }

        // Screen boundary despawn
        if (this.dir === 1 && this.x > 1080 + 100) {
            this.dead = true;
        } else if (this.dir === -1 && this.x < -this.width - 100) {
            this.dead = true;
        }
    }

    fireTorpedo(torpedoList) {
        const torpX = this.x + this.width / 2;
        const torpY = this.y - 10;
        torpedoList.push(new EnemyTorpedo(torpX, torpY));
        window.soundEngine.playTorpedoLaunch();
    }

    takeHit() {
        this.flashTimer = 0.12;
        this.hp--;
        if (this.hp <= 0) {
            this.isSinking = true;
            this.sinkTimer = 0.9;
            return true; // destroyed
        }
        return false; // damaged
    }

    getHitbox() {
        if (this.isSinking) {
            return { x: -9999, y: -9999, width: 0, height: 0 };
        }
        return {
            x: this.x + 10,
            y: this.y + 10,
            width: this.width - 20,
            height: this.height - 20
        };
    }

    render(ctx, images) {
        const imgKey = this.type === 'scout' ? 'sub_scout' : (this.type === 'patrol' ? 'sub_patrol' : 'sub_military');
        const img = images[imgKey];

        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);

        // Sinking tilt
        if (this.isSinking) {
            const sinkTilt = (this.dir === 1 ? 0.35 : -0.35) * (1.0 - this.sinkTimer);
            ctx.rotate(sinkTilt);
            ctx.globalAlpha = Math.max(0, this.sinkTimer);
        }

        // Submarine sprite faces left in source, if moving right flip horizontal!
        if (this.dir === 1) {
            ctx.scale(-1, 1);
        }

        // Hit flash
        if (this.flashTimer > 0) {
            ctx.filter = 'brightness(2.4)';
        }

        if (img && img.complete) {
            ctx.drawImage(img, -this.width / 2, -this.height / 2, this.width, this.height);
        } else {
            ctx.fillStyle = '#556b2f';
            ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
        }

        // Health bar for military sub (2 HP)
        if (!this.isSinking && this.maxHp > 1 && this.hp < this.maxHp) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(-40, -this.height / 2 - 14, 80, 8);
            ctx.fillStyle = '#ff9800';
            ctx.fillRect(-40, -this.height / 2 - 14, 80 * (this.hp / this.maxHp), 8);
        }

        ctx.restore();
    }
}

class BossSubmarine {
    constructor(bossType, x, y, dir = 1) {
        this.bossType = bossType; // 'boss_shark' or 'boss_dreadnought'
        this.x = x;
        this.y = y;
        this.dir = dir;
        this.width = 520;
        this.height = 220;
        this.speed = 85;
        this.maxHp = bossType === 'boss_shark' ? 8 : 10;
        this.hp = this.maxHp;
        this.points = 50;
        this.dead = false;
        this.time = 0;
        this.flashTimer = 0;
        this.isSinking = false;
        this.sinkTimer = 1.8;
        this.salvoCooldown = 2.4;
        this.hasDroppedShield = false;
    }

    update(dt, torpedoList, powerupList, particleSys) {
        this.time += dt;

        if (this.flashTimer > 0) {
            this.flashTimer -= dt;
        }

        if (this.isSinking) {
            this.sinkTimer -= dt;
            this.y += 55 * dt;
            if (particleSys && Math.random() < 0.35) {
                particleSys.addExplosion(this.x + Math.random() * this.width, this.y + Math.random() * this.height, 0.7);
            }
            if (this.sinkTimer <= 0) {
                this.dead = true;
            }
            return;
        }

        this.x += this.dir * this.speed * dt;

        // Multi-torpedo barrage firing
        this.salvoCooldown -= dt;
        if (this.salvoCooldown <= 0) {
            if (this.x > 50 && this.x < 650) {
                this.fireBarrage(torpedoList);
            }
            this.salvoCooldown = 3.2 + Math.random() * 1.5;
        }

        // Boundary despawn / reversal
        if (this.dir === 1 && this.x > 1080 + 150) {
            this.dead = true;
        } else if (this.dir === -1 && this.x < -this.width - 150) {
            this.dead = true;
        }
    }

    fireBarrage(torpedoList) {
        // Fire 2 to 3 torpedoes simultaneously across silos
        const offsets = [-110, 0, 110];
        for (const off of offsets) {
            const torpX = this.x + this.width / 2 + off;
            const torpY = this.y + 15;
            torpedoList.push(new EnemyTorpedo(torpX, torpY));
        }
        window.soundEngine.playTorpedoLaunch();
    }

    takeHit(powerupList) {
        this.flashTimer = 0.14;
        this.hp--;
        // At 50% health, drop a shield powerup!
        if (this.hp <= this.maxHp / 2 && !this.hasDroppedShield) {
            this.hasDroppedShield = true;
            powerupList.push(new ShieldBadge(this.x + this.width / 2, this.y + 30));
        }

        if (this.hp <= 0) {
            this.isSinking = true;
            this.sinkTimer = 1.8;
            // Always drop a shield powerup on boss defeat!
            if (!this.hasDroppedShield) {
                powerupList.push(new ShieldBadge(this.x + this.width / 2, this.y + 30));
            }
            return true; // Boss defeated!
        }
        return false;
    }

    getHitbox() {
        if (this.isSinking) {
            return { x: -9999, y: -9999, width: 0, height: 0 };
        }
        return {
            x: this.x + 35,
            y: this.y + 25,
            width: this.width - 70,
            height: this.height - 45
        };
    }

    render(ctx, images) {
        const img = images[this.bossType];

        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);

        // Sinking tilt
        if (this.isSinking) {
            const sinkTilt = (this.dir === 1 ? 0.3 : -0.3) * (1.0 - this.sinkTimer / 1.8);
            ctx.rotate(sinkTilt);
            ctx.globalAlpha = Math.max(0, this.sinkTimer / 1.8);
        }

        // In source, boss faces left, if moving right, flip!
        if (this.dir === 1) {
            ctx.scale(-1, 1);
        }

        // Hit flash
        if (this.flashTimer > 0) {
            ctx.filter = 'brightness(2.4)';
        }

        if (img && img.complete) {
            ctx.drawImage(img, -this.width / 2, -this.height / 2, this.width, this.height);
        } else {
            ctx.fillStyle = '#2e7d32';
            ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
        }

        ctx.restore();

        // Boss Health Bar with styled badge
        if (!this.isSinking) {
            ctx.save();
            const barW = 320;
            const barH = 18;
            const barX = this.x + (this.width - barW) / 2;
            const barY = this.y - 32;

            // Background container
            ctx.fillStyle = 'rgba(10, 20, 30, 0.85)';
            ctx.roundRect(barX - 6, barY - 6, barW + 12, barH + 12, 8);
            ctx.fill();
            ctx.strokeStyle = '#ff1744';
            ctx.lineWidth = 2;
            ctx.roundRect(barX - 6, barY - 6, barW + 12, barH + 12, 8);
            ctx.stroke();

            // Health gradient
            const pct = Math.max(0, this.hp / this.maxHp);
            const grad = ctx.createLinearGradient(barX, barY, barX + barW, barY);
            grad.addColorStop(0, '#ff1744');
            grad.addColorStop(1, '#ff9100');
            ctx.fillStyle = grad;
            ctx.roundRect(barX, barY, barW * pct, barH, 4);
            ctx.fill();

            // Boss title text
            ctx.font = "800 18px 'Segoe UI', sans-serif";
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'center';
            const bossLabel = this.bossType === 'boss_shark' ? '⚡ TIGER SHARK CLASS ⚡' : '💀 DREADNOUGHT CLASS 💀';
            ctx.fillText(bossLabel, this.x + this.width / 2, barY - 10);

            ctx.restore();
        }
    }
}

class ShieldBadge {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.baseX = x;
        this.width = 110;
        this.height = 55;
        this.floatSpeed = 120; // floats UPWARDS
        this.time = Math.random() * 5;
        this.dead = false;
    }

    update(dt) {
        this.time += dt;
        this.y -= this.floatSpeed * dt;
        // Gentle horizontal sway
        this.x = this.baseX + Math.sin(this.time * 3.2) * 22;

        // If it reaches the water line without collection, expires
        if (this.y < 540) {
            this.dead = true;
        }
    }

    getHitbox() {
        return {
            x: this.x - this.width / 2,
            y: this.y - this.height / 2,
            width: this.width,
            height: this.height
        };
    }

    render(ctx, images) {
        const badgeImg = images['badge_shield'];
        ctx.save();
        ctx.translate(this.x, this.y);

        // Floating pulse effect
        const scale = 1.0 + Math.sin(this.time * 5.0) * 0.08;
        ctx.scale(scale, scale);

        // Glowing shield energy aura ring
        ctx.strokeStyle = 'rgba(0, 229, 255, 0.6)';
        ctx.lineWidth = 2.5;
        ctx.shadowColor = '#00e5ff';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.ellipse(0, 0, this.width / 2 + 6, this.height / 2 + 6, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;

        if (badgeImg && badgeImg.complete) {
            ctx.drawImage(badgeImg, -this.width / 2, -this.height / 2, this.width, this.height);
        } else {
            ctx.fillStyle = '#ffd54f';
            ctx.fillRect(-35, -20, 70, 40);
        }

        ctx.restore();
    }
}

class HeartPickup {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.baseX = x;
        this.width = 68;
        this.height = 68;
        this.floatSpeed = 105;
        this.time = Math.random() * 5;
        this.dead = false;
    }

    update(dt) {
        this.time += dt;
        this.y -= this.floatSpeed * dt;
        this.x = this.baseX + Math.sin(this.time * 3.5) * 18;

        if (this.y < 540) {
            this.dead = true;
        }
    }

    getHitbox() {
        return {
            x: this.x - this.width / 2,
            y: this.y - this.height / 2,
            width: this.width,
            height: this.height
        };
    }

    render(ctx, images) {
        const heartImg = images['heart'];
        ctx.save();
        ctx.translate(this.x, this.y);

        const pulse = 1.0 + Math.sin(this.time * 6.0) * 0.12;
        ctx.scale(pulse, pulse);

        if (heartImg && heartImg.complete) {
            ctx.drawImage(heartImg, -this.width / 2, -this.height / 2, this.width, this.height);
        } else {
            ctx.fillStyle = '#ff1744';
            ctx.font = "48px sans-serif";
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('❤️', 0, 0);
        }

        ctx.restore();
    }
}

