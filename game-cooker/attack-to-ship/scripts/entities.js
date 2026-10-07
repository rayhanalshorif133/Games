/**
 * Game Entities for Attack to Ship (1080x1920 layout)
 */

class ParticleSystem {
    constructor() {
        this.bubbles = [];
        this.explosions = [];
        this.floatingTexts = [];
        this.ripples = [];
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
            maxRadius: 45,
            alpha: 0.8
        });
    }

    update(dt) {
        // Ambient underwater bubbles
        if (Math.random() < 0.25) {
            const bx = Math.random() * 1040 + 20;
            const by = 1900 - Math.random() * 100;
            this.addBubble(bx, by, (Math.random() - 0.5) * 15, -40 - Math.random() * 40, 4 + Math.random() * 5, 0.4);
        }

        // Update bubbles
        for (let i = this.bubbles.length - 1; i >= 0; i--) {
            const b = this.bubbles[i];
            b.x += b.vx * dt;
            b.y += b.vy * dt;
            b.life -= dt;
            b.alpha = Math.max(0, b.life / b.maxLife * 0.5);
            // remove if reached water surface (Y=576) or life expired
            if (b.y <= 576 || b.life <= 0) {
                this.bubbles.splice(i, 1);
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
            rip.radius += 45 * dt;
            rip.alpha = Math.max(0, 1.0 - rip.radius / rip.maxRadius);
            if (rip.radius >= rip.maxRadius) {
                this.ripples.splice(i, 1);
            }
        }
    }

    render(ctx, images) {
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
                // Fallback procedural explosion
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
            ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
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

        this.maxHealth = 3;
        this.health = 3;
        this.invulnerableTimer = 0;

        this.hasShield = false;
        this.shieldTimer = 0;
        this.maxShieldTime = 16.0;

        this.bombCooldown = 0;
        this.maxBombCooldown = 0.42;

        this.targetX = null;
        this.time = 0;
    }

    activateShield(duration = 16.0) {
        this.hasShield = true;
        this.shieldTimer = duration;
    }

    takeDamage() {
        if (this.hasShield) {
            // Shield absorbs damage!
            window.soundEngine.playShieldHit();
            return false;
        }

        if (this.invulnerableTimer > 0) return false;

        this.health--;
        this.invulnerableTimer = 1.8;
        window.soundEngine.playExplosion(true);
        return true;
    }

    update(dt) {
        this.time += dt;

        // Move horizontally (via target position from drag/tap, or keyboard/button direction)
        if (this.targetX !== null) {
            const diff = this.targetX - this.x;
            if (Math.abs(diff) > 3) {
                this.x += diff * Math.min(1.0, 16 * dt);
            } else {
                this.x = this.targetX;
                this.targetX = null;
            }
        } else if (this.moveDir !== 0) {
            this.x += this.moveDir * this.speed * dt;
        }

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
            x: this.x - 25,
            y: this.y - 15,
            width: this.width + 50,
            height: this.height + 30
        };
    }

    render(ctx, images) {
        const shipImg = images['ship'];
        const shieldImg = images['shield'];

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

        // Draw Ship
        if (shipImg && shipImg.complete) {
            ctx.drawImage(shipImg, this.x, renderY, this.width, this.height);
        } else {
            ctx.fillStyle = '#7d8b99';
            ctx.fillRect(this.x, renderY + 40, this.width, this.height - 40);
        }

        // Draw Shield Bubble if active
        if (this.hasShield && shieldImg && shieldImg.complete) {
            const shieldW = this.width + 90;
            const shieldH = this.height + 65;
            const shieldX = this.x - 45;
            const shieldY = renderY - 30;

            // Shield pulsation
            const shieldAlpha = 0.75 + Math.sin(this.time * 6) * 0.2;
            ctx.globalAlpha = Math.min(1.0, shieldAlpha);
            ctx.drawImage(shieldImg, shieldX, shieldY, shieldW, shieldH);
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
        this.speed = 410;
        this.time = 0;
        this.dead = false;
        this.bubbleTimer = 0;
    }

    update(dt, particleSys) {
        this.time += dt;
        this.y += this.speed * dt;

        // Spawn trailing air bubbles
        this.bubbleTimer += dt;
        if (this.bubbleTimer >= 0.05) {
            this.bubbleTimer = 0;
            particleSys.addBubble(
                this.x + (Math.random() - 0.5) * 8,
                this.y - 5,
                (Math.random() - 0.5) * 10,
                -30,
                3 + Math.random() * 3,
                0.45
            );
        }

        // Reach bottom of ocean
        if (this.y > 1920) {
            this.dead = true;
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

    update(dt, torpedoList) {
        this.time += dt;
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
        this.hp--;
        if (this.hp <= 0) {
            this.dead = true;
            return true; // destroyed
        }
        return false; // damaged
    }

    getHitbox() {
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

        // Submarine sprite faces left in source, if moving right flip horizontal!
        if (this.dir === 1) {
            ctx.scale(-1, 1);
        }

        if (img && img.complete) {
            ctx.drawImage(img, -this.width / 2, -this.height / 2, this.width, this.height);
        } else {
            ctx.fillStyle = '#556b2f';
            ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
        }

        // Health bar for military sub (2 HP)
        if (this.maxHp > 1 && this.hp < this.maxHp) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
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
        this.salvoCooldown = 2.4;
        this.hasDroppedShield = false;
    }

    update(dt, torpedoList, powerupList) {
        this.time += dt;
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
        this.hp--;
        // At 50% health, drop a shield powerup!
        if (this.hp <= this.maxHp / 2 && !this.hasDroppedShield) {
            this.hasDroppedShield = true;
            powerupList.push(new ShieldBadge(this.x + this.width / 2, this.y + 30));
        }

        if (this.hp <= 0) {
            this.dead = true;
            // Always drop a shield powerup on boss defeat!
            if (!this.hasDroppedShield) {
                powerupList.push(new ShieldBadge(this.x + this.width / 2, this.y + 30));
            }
            return true; // Boss defeated!
        }
        return false;
    }

    getHitbox() {
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

        // In source, boss faces left, if moving right, flip!
        if (this.dir === 1) {
            ctx.scale(-1, 1);
        }

        if (img && img.complete) {
            ctx.drawImage(img, -this.width / 2, -this.height / 2, this.width, this.height);
        } else {
            ctx.fillStyle = '#2e7d32';
            ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
        }

        // Boss Health Bar
        ctx.restore();
        ctx.save();
        const barW = 240;
        const barH = 16;
        const barX = this.x + (this.width - barW) / 2;
        const barY = this.y - 24;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.roundRect(barX - 2, barY - 2, barW + 4, barH + 4, 4);
        ctx.fill();

        const pct = Math.max(0, this.hp / this.maxHp);
        const grad = ctx.createLinearGradient(barX, barY, barX + barW, barY);
        grad.addColorStop(0, '#f44336');
        grad.addColorStop(1, '#ff9800');
        ctx.fillStyle = grad;
        ctx.roundRect(barX, barY, barW * pct, barH, 3);
        ctx.fill();

        ctx.restore();
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

