/**
 * entities.js - Player, Missiles, Flares, Asteroids, and Power-ups
 * Supports Infinite Sky Flight, Extra Life System & Power-Up Signals
 */

export const SHIP_SPECS = {
    cx16: {
        id: 'cx16',
        name: 'CX-16 FALCON',
        desc: 'Balanced tactical interceptor with optimal maneuverability and speed.',
        baseSpeed: 520,
        baseTurnRate: 4.0,
        baseFlares: 3,
        baseHealth: 3,
        baseMagnet: 170,
        spritePrefix: 'CX16-X',
        hitboxRadius: 28,
        renderScale: 0.72
    },
    dko: {
        id: 'dko',
        name: 'DKO APEX',
        desc: 'Ultra-agile stealth fighter. Excels at tight near-miss supersonic dodges.',
        baseSpeed: 580,
        baseTurnRate: 4.8,
        baseFlares: 2,
        baseHealth: 3,
        baseMagnet: 185,
        spritePrefix: 'DKO-api-X',
        hitboxRadius: 26,
        renderScale: 0.72
    },
    wo84: {
        id: 'wo84',
        name: 'WO-84 PHANTOM',
        desc: 'Heavy dreadnought fighter with reinforced armor and superior payload.',
        baseSpeed: 480,
        baseTurnRate: 3.5,
        baseFlares: 5,
        baseHealth: 3,     // Standard 3 Lives
        baseMagnet: 200,
        spritePrefix: 'WO84-wu-X',
        hitboxRadius: 30,
        renderScale: 0.76
    }
};

export const ALL_PLANES = [
    { shipId: 'cx16', level: 1 },
    { shipId: 'cx16', level: 2 },
    { shipId: 'cx16', level: 3 },
    { shipId: 'dko', level: 1 },
    { shipId: 'dko', level: 2 },
    { shipId: 'dko', level: 3 },
    { shipId: 'wo84', level: 1 },
    { shipId: 'wo84', level: 2 },
    { shipId: 'wo84', level: 3 }
];

function normalizeAngle(angle) {
    while (angle > Math.PI) angle -= Math.PI * 2;
    while (angle < -Math.PI) angle += Math.PI * 2;
    return angle;
}

export class Player {
    constructor(shipId, shipLevel, upgrades, images) {
        this.images = images;
        this.upgrades = upgrades || { speed: 1, agility: 1, flares: 1, magnet: 1 };
        this.boostTimer = 0;
        this.applyShipConfig(shipId, shipLevel);

        // Position & Physics (Infinite Sky Coordinates)
        this.x = 0;
        this.y = 0;
        this.vx = 0;
        this.vy = 0;
        this.angle = -Math.PI / 2; // Facing UP
        this.targetAngle = -Math.PI / 2;
        this.nearMissRadius = 100;

        // Aerodynamics & Banking
        this.bank = 0;
        this.wingspan = 38;
        this.vaporTimer = 0;
        this.windTimer = 0;

        // Visuals
        this.flameFrame = 0;
        this.flameTimer = 0;
        this.smokeTimer = 0;
    }

    applyShipConfig(shipId, shipLevel) {
        this.spec = SHIP_SPECS[shipId] || SHIP_SPECS.cx16;
        this.level = shipLevel || 1;
        this.spriteName = `${this.spec.spritePrefix}${this.level}.png`;
        this.radius = this.spec.hitboxRadius;

        const speedBonus = 1 + (this.level - 1) * 0.08 + (this.upgrades.speed - 1) * 0.06;
        const turnBonus = 1 + (this.level - 1) * 0.08 + (this.upgrades.agility - 1) * 0.07;
        const flareBonus = (this.level - 1) + (this.upgrades.flares - 1);

        this.speed = this.spec.baseSpeed * speedBonus;
        this.turnRate = this.spec.baseTurnRate * turnBonus;
        this.maxFlares = this.spec.baseFlares + flareBonus;
        this.flares = this.maxFlares;
        this.magnetRadius = this.spec.baseMagnet + (this.upgrades.magnet - 1) * 45;

        // Fixed 3-Lives System
        this.maxHealth = 3;
        this.health = 3;
        this.hasShield = false;
        this.shieldAnimTimer = 0;
        this.alive = true;
        this.invulnerableTimer = 0;
        this.boostTimer = 0;
    }

    randomizePlane() {
        const choice = ALL_PLANES[Math.floor(Math.random() * ALL_PLANES.length)];
        this.applyShipConfig(choice.shipId, choice.level);
    }

    reset(x, y, randomize = true) {
        if (randomize) {
            this.randomizePlane();
        }
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.angle = -Math.PI / 2;
        this.targetAngle = -Math.PI / 2;
        this.bank = 0;
        this.health = 3;
        this.maxHealth = 3;
        this.flares = this.maxFlares;
        this.hasShield = false;
        this.alive = true;
        this.invulnerableTimer = 2.0; // Spawn protection
        this.boostTimer = 0;
    }

    activateBoost(duration = 2.0) {
        this.boostTimer = duration;
        this.invulnerableTimer = Math.max(this.invulnerableTimer, duration);
    }

    takeDamage() {
        if (this.invulnerableTimer > 0) return 'invulnerable';

        if (this.hasShield) {
            this.hasShield = false;
            this.invulnerableTimer = 1.8; // Brief shield break protection
            return 'shield_absorbed';
        }

        this.health--;
        this.invulnerableTimer = 2.2; // Temporary invulnerability after damage

        if (this.health <= 0) {
            this.alive = false;
            return 'dead';
        }
        return 'damaged';
    }

    heal(amount = 1) {
        if (this.health < this.maxHealth) {
            this.health = Math.min(this.maxHealth, this.health + amount);
            return true;
        }
        // If already full health, give a temporary shield protection!
        if (!this.hasShield) {
            this.hasShield = true;
            return true;
        }
        return false;
    }

    update(dt, input, particles) {
        if (!this.alive) return;

        if (this.invulnerableTimer > 0) {
            this.invulnerableTimer -= dt;
        }

        if (this.hasShield) {
            this.shieldAnimTimer += dt * 3.5;
        }

        // Turning toward input direction
        let turnDiff = 0;
        if (input.active) {
            this.targetAngle = input.angle;
            turnDiff = normalizeAngle(this.targetAngle - this.angle);
            const maxTurn = this.turnRate * dt;
            this.angle += Math.max(-maxTurn, Math.min(maxTurn, turnDiff));
        }

        // Aerodynamic banking
        const targetBank = input.active ? Math.max(-1, Math.min(1, turnDiff * 2.2)) : 0;
        this.bank += (targetBank - this.bank) * Math.min(1, dt * 9.0);

        // Infinite forward flight motion with 2-Second Super Boost Surge!
        let moveSpeed = input.active ? this.speed : this.speed * 0.90;
        if (this.boostTimer > 0) {
            this.boostTimer -= dt;
            moveSpeed *= 2.15; // Tremendous supersonic surge!
            this.invulnerableTimer = Math.max(this.invulnerableTimer, 0.2);

            // Blazing afterburner thrust sparks & shockwaves
            const exhaustDist = 44;
            const ex = this.x - Math.cos(this.angle) * exhaustDist;
            const ey = this.y - Math.sin(this.angle) * exhaustDist;
            for (let b = 0; b < 2; b++) {
                particles.addSpark(
                    ex + (Math.random() - 0.5) * 12,
                    ey + (Math.random() - 0.5) * 12,
                    -Math.cos(this.angle) * 360 + (Math.random() - 0.5) * 80,
                    -Math.sin(this.angle) * 360 + (Math.random() - 0.5) * 80,
                    Math.random() > 0.35 ? '#00ffff' : '#ff9900',
                    4 + Math.random() * 4,
                    0.28
                );
            }
            if (Math.random() < 0.3) {
                particles.addShockwave(this.x, this.y, 90, 0.25, '#00f0ff');
            }
        }

        const targetVx = Math.cos(this.angle) * moveSpeed;
        const targetVy = Math.sin(this.angle) * moveSpeed;

        this.vx += (targetVx - this.vx) * Math.min(1, dt * 7.5);
        this.vy += (targetVy - this.vy) * Math.min(1, dt * 7.5);

        // Position changes freely with no boundary clamping!
        this.x += this.vx * dt;
        this.y += this.vy * dt;

        // Flame animation
        this.flameTimer += dt;
        if (this.flameTimer > 0.05) {
            this.flameTimer = 0;
            this.flameFrame = (this.flameFrame + 1) % 3;
        }

        // Engine exhaust particles
        this.smokeTimer += dt;
        if (this.smokeTimer > 0.03) {
            this.smokeTimer = 0;
            const exhaustDist = 42;
            const ex = this.x - Math.cos(this.angle) * exhaustDist;
            const ey = this.y - Math.sin(this.angle) * exhaustDist;
            const spread = (Math.random() - 0.5) * 12;

            particles.addSmoke(
                ex + Math.sin(this.angle) * spread,
                ey - Math.cos(this.angle) * spread,
                -Math.cos(this.angle) * 70,
                -Math.sin(this.angle) * 70,
                'rgba(215, 235, 255, 0.45)',
                5, 18, 0.35
            );
        }

        // Wingtip vapor vortices
        this.vaporTimer += dt;
        if (Math.abs(this.bank) > 0.22 && this.vaporTimer > 0.02) {
            this.vaporTimer = 0;
            const perpAngle = this.angle + Math.PI / 2;
            const wingSpanOffset = this.wingspan * 0.95;

            const lx = this.x - Math.cos(perpAngle) * wingSpanOffset - Math.cos(this.angle) * 8;
            const ly = this.y - Math.sin(perpAngle) * wingSpanOffset - Math.sin(this.angle) * 8;
            const rx = this.x + Math.cos(perpAngle) * wingSpanOffset - Math.cos(this.angle) * 8;
            const ry = this.y + Math.sin(perpAngle) * wingSpanOffset - Math.sin(this.angle) * 8;

            particles.addVapor(lx, ly, -Math.cos(this.angle) * 35, -Math.sin(this.angle) * 35, 4, 14, 0.4);
            particles.addVapor(rx, ry, -Math.cos(this.angle) * 35, -Math.sin(this.angle) * 35, 4, 14, 0.4);
        }

        // Atmospheric speed streaks
        this.windTimer += dt;
        if (this.windTimer > 0.06) {
            this.windTimer = 0;
            const sideOffset = (Math.random() - 0.5) * 180;
            const frontOffset = 100 + Math.random() * 80;
            const wx = this.x + Math.cos(this.angle) * frontOffset + Math.sin(this.angle) * sideOffset;
            const wy = this.y + Math.sin(this.angle) * frontOffset - Math.cos(this.angle) * sideOffset;
            particles.addWindStreak(wx, wy, -this.vx * 1.3, -this.vy * 1.3);
        }
    }

    deployFlare() {
        if (this.flares <= 0 || !this.alive) return false;
        this.flares--;
        return true;
    }

    render(ctx) {
        if (!this.alive) return;

        const shipImg = this.images[this.spriteName] || this.images['CX16-X1.png'];
        const scale = this.spec.renderScale;
        const w = (shipImg && shipImg.complete) ? shipImg.naturalWidth * scale : 100;
        const h = (shipImg && shipImg.complete) ? shipImg.naturalHeight * scale : 100;

        // 1. Draw Soft Cloud Shadow Below Plane
        ctx.save();
        ctx.translate(this.x + 35, this.y + 55);
        ctx.rotate(this.angle + Math.PI / 2);
        ctx.scale(0.82, 0.82);
        ctx.globalAlpha = 0.22;
        ctx.filter = 'blur(6px)';

        if (shipImg && shipImg.complete) {
            ctx.drawImage(shipImg, -w / 2, -h / 2, w, h);
        }
        ctx.restore();

        // 2. Draw Aircraft with 3D Banking Tilt
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle + Math.PI / 2);

        ctx.scale(1 - Math.abs(this.bank) * 0.24, 1);
        ctx.rotate(this.bank * 0.12);

        // Invulnerability flicker
        if (this.invulnerableTimer > 0 && Math.floor(Date.now() / 70) % 2 === 0) {
            ctx.globalAlpha = 0.40;
        }

        // Thruster flame
        const flameImg = this.images['spaceship_flame.png'];
        if (flameImg && flameImg.complete) {
            ctx.save();
            const fw = 35;
            const fh = 51;
            const flameScale = 1.3;
            ctx.drawImage(
                flameImg,
                this.flameFrame * fw, 0, fw, fh,
                (-fw * flameScale) / 2, 34, fw * flameScale, fh * flameScale
            );
            ctx.restore();
        }

        // Aircraft Sprite
        if (shipImg && shipImg.complete) {
            ctx.drawImage(shipImg, -w / 2, -h / 2, w, h);
        }

        // Super Boost Visual FX (Supersonic Aura & Jet Blast)
        if (this.boostTimer > 0) {
            ctx.strokeStyle = '#00f0ff';
            ctx.lineWidth = 4;
            ctx.shadowColor = '#00ffff';
            ctx.shadowBlur = 24;
            ctx.beginPath();
            ctx.arc(0, 0, this.radius + 18, 0, Math.PI * 2);
            ctx.stroke();

            // Blazing afterburner cone
            ctx.fillStyle = '#00ffff';
            ctx.beginPath();
            ctx.moveTo(-16, 40);
            ctx.lineTo(16, 40);
            ctx.lineTo(0, 115 + Math.random() * 25);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.moveTo(-8, 40);
            ctx.lineTo(8, 40);
            ctx.lineTo(0, 75 + Math.random() * 15);
            ctx.closePath();
            ctx.fill();
        }

        // Draw Shield bubble if active
        if (this.hasShield) {
            ctx.restore();
            ctx.save();
            ctx.translate(this.x, this.y);

            const pulse = 1 + Math.sin(this.shieldAnimTimer) * 0.08;
            const shieldRadius = (this.radius + 24) * pulse;

            ctx.strokeStyle = '#00f0ff';
            ctx.lineWidth = 3.5;
            ctx.shadowColor = '#00f0ff';
            ctx.shadowBlur = 18;
            ctx.beginPath();
            ctx.arc(0, 0, shieldRadius, 0, Math.PI * 2);
            ctx.stroke();

            ctx.fillStyle = 'rgba(0, 240, 255, 0.18)';
            ctx.fill();
        }

        ctx.restore();
    }
}

export class DecoyFlare {
    constructor(x, y, playerAngle) {
        this.x = x;
        this.y = y;
        const ejectAngle = playerAngle + Math.PI + (Math.random() - 0.5) * 0.8;
        const speed = 180 + Math.random() * 90;
        this.vx = Math.cos(ejectAngle) * speed;
        this.vy = Math.sin(ejectAngle) * speed;
        this.life = 4.2;
        this.maxLife = 4.2;
        this.radius = 16;
    }

    update(dt, particles) {
        this.life -= dt;
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.vx *= 0.96;
        this.vy *= 0.96;

        particles.addFlareSpark(this.x, this.y);
        return this.life > 0;
    }

    render(ctx) {
        ctx.save();
        const pulse = 0.8 + Math.random() * 0.4;
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#ff6600';
        ctx.shadowBlur = 22;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 8 * pulse, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#ff9900';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 18 * pulse, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }
}

export class Missile {
    constructor(x, y, type = 'seeker', images) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.images = images;
        this.angle = Math.random() * Math.PI * 2;
        this.alive = true;
        this.smokeTimer = 0;
        this.nearMissed = false;
        this.wobbleTimer = Math.random() * Math.PI * 2;
        this.wobbleSpeed = 3.5 + Math.random() * 3.5;

        // Random speed & turn rate variance (±10%)
        const speedVar = 0.90 + Math.random() * 0.20;
        const turnVar = 0.90 + Math.random() * 0.20;

        // Small, sharp rocket dimensions ("choto choto roket style er")
        if (type === 'fast') {
            this.speed = 460 * speedVar;
            this.turnRate = 1.95 * turnVar;
            this.radius = 9;
            this.health = 1;
            this.scale = 0.27;
            this.imageName = 'enemy_unit.png';
            this.color = '#ff2222';
            this.glowColor = '#ff0033';
            this.eyeColor = '#ffff00';
            this.smokeColor = 'rgba(255, 90, 90, 0.75)';
        } else if (type === 'mothership') {
            this.speed = 280 * speedVar;
            this.turnRate = 2.2 * turnVar;
            this.radius = 16;
            this.health = 3;
            this.scale = 0.42;
            this.imageName = 'enemy_mothership.png';
            this.color = '#aa00ff';
            this.glowColor = '#cc00ff';
            this.eyeColor = '#ff00aa';
            this.smokeColor = 'rgba(160, 50, 220, 0.75)';
        } else if (type === 'swarmer') {
            this.speed = 410 * speedVar;
            this.turnRate = 3.6 * turnVar;
            this.radius = 8;
            this.health = 1;
            this.scale = 0.23;
            this.imageName = 'enemy_unit.png';
            this.color = '#00f0ff';
            this.glowColor = '#00d4ff';
            this.eyeColor = '#ffffff';
            this.smokeColor = 'rgba(0, 240, 255, 0.75)';
        } else if (type === 'spiral') {
            this.speed = 380 * speedVar;
            this.turnRate = 2.8 * turnVar;
            this.radius = 10;
            this.health = 1;
            this.scale = 0.29;
            this.imageName = 'enemy_unit.png';
            this.color = '#ffbb00';
            this.glowColor = '#ff9900';
            this.eyeColor = '#ff0000';
            this.smokeColor = 'rgba(255, 175, 0, 0.75)';
        } else {
            this.speed = 385 * speedVar;
            this.turnRate = 2.7 * turnVar;
            this.radius = 10;
            this.health = 1;
            this.scale = 0.29;
            this.imageName = 'enemy_unit.png';
            this.color = '#ff6600';
            this.glowColor = '#ff4400';
            this.eyeColor = '#ff0000';
            this.smokeColor = 'rgba(235, 235, 235, 0.75)';
        }

        this.vx = Math.cos(this.angle) * this.speed;
        this.vy = Math.sin(this.angle) * this.speed;
    }

    update(dt, target, player, particles) {
        if (!this.alive) return;

        // Despawn if wandered too far from player in infinite sky
        const distToPlayer = Math.hypot(this.x - player.x, this.y - player.y);
        if (distToPlayer > 4200) {
            this.alive = false;
            return;
        }

        if (target) {
            let targetAngle = Math.atan2(target.y - this.y, target.x - this.x);
            if (this.type === 'spiral') {
                this.wobbleTimer += dt * this.wobbleSpeed;
                targetAngle += Math.sin(this.wobbleTimer) * 0.42;
            }
            const diff = normalizeAngle(targetAngle - this.angle);
            const maxTurn = this.turnRate * dt;
            this.angle += Math.max(-maxTurn, Math.min(maxTurn, diff));
        }

        this.vx = Math.cos(this.angle) * this.speed;
        this.vy = Math.sin(this.angle) * this.speed;

        this.x += this.vx * dt;
        this.y += this.vy * dt;

        // Long billowing rocket smoke trail ("lombaaaaaaa duya", 1.9s duration!)
        this.smokeTimer += dt;
        if (this.smokeTimer > 0.016) {
            this.smokeTimer = 0;
            const nozzleOffset = this.radius + 8;
            const ex = this.x - Math.cos(this.angle) * nozzleOffset;
            const ey = this.y - Math.sin(this.angle) * nozzleOffset;

            particles.addSmoke(
                ex + (Math.random() - 0.5) * 4,
                ey + (Math.random() - 0.5) * 4,
                -Math.cos(this.angle) * 32 + (Math.random() - 0.5) * 10,
                -Math.sin(this.angle) * 32 + (Math.random() - 0.5) * 10,
                this.smokeColor,
                4, 28, 1.9, 0.75
            );

            // Fiery rocket thruster spark
            if (Math.random() < 0.65) {
                particles.addSpark(
                    ex, ey,
                    -Math.cos(this.angle) * 80 + (Math.random() - 0.5) * 22,
                    -Math.sin(this.angle) * 80 + (Math.random() - 0.5) * 22,
                    Math.random() > 0.4 ? '#ff6600' : '#ffdd00',
                    2.5 + Math.random() * 2,
                    0.22
                );
            }
        }
    }

    render(ctx) {
        if (!this.alive) return;

        // Missile shadow on clouds
        ctx.save();
        ctx.translate(this.x + 20, this.y + 30);
        ctx.rotate(this.angle + Math.PI / 2);
        ctx.scale(0.85, 0.85);
        ctx.globalAlpha = 0.20;
        const img = this.images[this.imageName];
        if (img && img.complete) {
            const w = img.naturalWidth * this.scale;
            const h = img.naturalHeight * this.scale;
            ctx.drawImage(img, -w / 2, -h / 2, w, h);
        }
        ctx.restore();

        // Missile rocket body
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle + Math.PI / 2);

        // Blazing rocket thruster flame at nozzle
        const flameLen = 14 + Math.random() * 8;
        const thrusterY = this.radius + 4;
        ctx.fillStyle = '#ff9900';
        ctx.shadowColor = '#ff4400';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.moveTo(-3.5, thrusterY);
        ctx.lineTo(3.5, thrusterY);
        ctx.lineTo(0, thrusterY + flameLen);
        ctx.closePath();
        ctx.fill();

        // Hot inner flame core
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(-1.8, thrusterY);
        ctx.lineTo(1.8, thrusterY);
        ctx.lineTo(0, thrusterY + flameLen * 0.55);
        ctx.closePath();
        ctx.fill();

        if (img && img.complete) {
            const w = img.naturalWidth * this.scale;
            const h = img.naturalHeight * this.scale;
            ctx.drawImage(img, -w / 2, -h / 2, w, h);
        } else {
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.fillStyle = this.eyeColor || '#ff0000';
        ctx.shadowColor = this.glowColor || '#ff0000';
        ctx.shadowBlur = 14;
        ctx.beginPath();
        ctx.arc(0, -this.radius + 3, 3.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}

export class Asteroid {
    constructor(x, y, imageIndex, images) {
        this.x = x;
        this.y = y;
        this.images = images;
        const num = String(imageIndex).padStart(2, '0');
        this.imageName = `asteroid_${num}.png`;
        this.angle = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.4;
        this.vx = (Math.random() - 0.5) * 25;
        this.vy = (Math.random() - 0.5) * 25;
        this.radius = 45 + Math.random() * 40;
        this.scale = (this.radius * 2) / 320;
    }

    update(dt, player) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.angle += this.rotationSpeed * dt;

        // Wrap around player position in infinite sky
        const wrapDist = 2400;
        if (this.x < player.x - wrapDist) this.x += wrapDist * 2;
        if (this.x > player.x + wrapDist) this.x -= wrapDist * 2;
        if (this.y < player.y - wrapDist) this.y += wrapDist * 2;
        if (this.y > player.y + wrapDist) this.y -= wrapDist * 2;
    }

    render(ctx) {
        ctx.save();
        ctx.translate(this.x + 25, this.y + 40);
        ctx.rotate(this.angle);
        ctx.globalAlpha = 0.18;
        const img = this.images[this.imageName];
        if (img && img.complete) {
            const w = img.naturalWidth * this.scale;
            const h = img.naturalHeight * this.scale;
            ctx.drawImage(img, -w / 2, -h / 2, w, h);
        }
        ctx.restore();

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        if (img && img.complete) {
            const w = img.naturalWidth * this.scale;
            const h = img.naturalHeight * this.scale;
            ctx.drawImage(img, -w / 2, -h / 2, w, h);
        } else {
            ctx.fillStyle = '#555566';
            ctx.beginPath();
            ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }
}

export class PowerUp {
    constructor(x, y, type = 'coin', images) {
        this.x = x;
        this.y = y;
        this.type = type; // 'shield', 'life', 'emp', 'flare', 'coin'
        this.images = images;
        this.radius = 26;
        this.life = 35; // 35s lifetime in world
        this.bobTimer = Math.random() * Math.PI * 2;

        // Signal info for offscreen indicator beacons
        if (type === 'shield') {
            this.label = 'ENERGY SHIELD';
            this.icon = '🛡️';
            this.color = '#00f0ff';
        } else if (type === 'life') {
            this.label = 'EXTRA LIFE';
            this.icon = '❤️';
            this.color = '#00ff88';
        } else if (type === 'boost') {
            this.label = 'SUPER BOOST';
            this.icon = '🚀';
            this.color = '#ff7700';
        } else if (type === 'emp') {
            this.label = 'EMP SMART BOMB';
            this.icon = '⚡';
            this.color = '#ff00aa';
        } else if (type === 'flare') {
            this.label = 'FLARE PACK';
            this.icon = '✨';
            this.color = '#ffaa00';
        } else {
            this.label = 'SPACE STARS';
            this.icon = '★';
            this.color = '#ffd700';
        }
    }

    update(dt, player) {
        this.life -= dt;
        this.bobTimer += dt * 4.5;

        // Despawn if player flew too far away in infinite sky
        const dist = Math.hypot(player.x - this.x, player.y - this.y);
        if (dist > 4000) return false;

        // Magnet attraction toward player
        if (player && player.alive) {
            if (this.type === 'coin' && dist < player.magnetRadius) {
                const pullSpeed = 560 * (1 - dist / player.magnetRadius) + 160;
                this.x += ((player.x - this.x) / dist) * pullSpeed * dt;
                this.y += ((player.y - this.y) / dist) * pullSpeed * dt;
            }
        }

        return this.life > 0;
    }

    render(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y + Math.sin(this.bobTimer) * 6);

        // Pulsing glow halo
        const pulse = 1 + Math.sin(this.bobTimer * 1.5) * 0.15;
        ctx.fillStyle = this.color;
        ctx.globalAlpha = 0.25;
        ctx.beginPath();
        ctx.arc(0, 0, (this.radius + 12) * pulse, 0, Math.PI * 2);
        ctx.fill();

        if (this.life < 5 && Math.floor(Date.now() / 100) % 2 === 0) {
            ctx.globalAlpha = 0.35;
        } else {
            ctx.globalAlpha = 1.0;
        }

        if (this.type === 'coin') {
            const img = this.images['summary_stars.png'];
            if (img && img.complete) {
                ctx.drawImage(img, 0, 0, 64, 64, -26, -26, 52, 52);
            } else {
                ctx.fillStyle = '#ffdd00';
                ctx.beginPath();
                ctx.arc(0, 0, 20, 0, Math.PI * 2);
                ctx.fill();
            }
        } else if (this.type === 'shield') {
            const img = this.images['points_powerup_lifes_03.png'];
            if (img && img.complete) {
                ctx.drawImage(img, -28, -28, 56, 56);
            } else {
                ctx.fillStyle = '#00e5ff';
                ctx.beginPath();
                ctx.arc(0, 0, 22, 0, Math.PI * 2);
                ctx.fill();
            }
        } else if (this.type === 'life') {
            const img = this.images['points_powerup_lifes_05_life_indicator.png'];
            if (img && img.complete) {
                ctx.drawImage(img, -26, -26, 52, 52);
            } else {
                ctx.fillStyle = '#00ff88';
                ctx.beginPath();
                ctx.arc(0, 0, 22, 0, Math.PI * 2);
                ctx.fill();
            }
        } else if (this.type === 'boost') {
            ctx.fillStyle = '#ff6600';
            ctx.shadowColor = '#ff4400';
            ctx.shadowBlur = 20;
            ctx.beginPath();
            ctx.arc(0, 0, 24, 0, Math.PI * 2);
            ctx.fill();

            // Glowing inner badge ring
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.arc(0, 0, 22, 0, Math.PI * 2);
            ctx.stroke();

            // Rocket emoji icon
            ctx.font = '26px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('🚀', 0, 1);
        } else if (this.type === 'emp') {
            const img = this.images['points_powerup_lifes_04.png'];
            if (img && img.complete) {
                ctx.drawImage(img, -28, -28, 56, 56);
            } else {
                ctx.fillStyle = '#ff00aa';
                ctx.beginPath();
                ctx.arc(0, 0, 22, 0, Math.PI * 2);
                ctx.fill();
            }
        } else if (this.type === 'flare') {
            const img = this.images['shooting_button.png'];
            if (img && img.complete) {
                ctx.drawImage(img, 0, 0, 200, 200, -26, -26, 52, 52);
            } else {
                ctx.fillStyle = '#ffaa00';
                ctx.beginPath();
                ctx.arc(0, 0, 22, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        ctx.restore();
    }
}
