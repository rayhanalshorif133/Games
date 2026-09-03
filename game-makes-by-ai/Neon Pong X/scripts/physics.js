// Neon Pong X - Physics, Collision Dynamics & Powerup Engine
// Virtual Court Coordinates: 1080 x 1920 (Portrait Orientation)

class NeonBall {
    constructor(x, y, vx, vy) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.radius = 20;
        this.baseSpeed = 1050;
        this.maxSpeed = 2400;
        this.speed = Math.hypot(vx, vy) || this.baseSpeed;
        this.spin = 0; // Angular spin (-1 to 1) imparting aerodynamic curve
        this.spinDecay = 0.985;
        this.trail = [];
        this.maxTrailLength = 22;
        this.isSmash = false;
        this.active = true;
        this.color = '#00f3ff';
        this.coreColor = '#ffffff';
        this.lastHitBy = null; // 'player' or 'ai'
    }

    update(dt) {
        // Record trail
        this.trail.unshift({
            x: this.x,
            y: this.y,
            speed: this.speed,
            isSmash: this.isSmash,
            color: this.color
        });
        if (this.trail.length > this.maxTrailLength) {
            this.trail.pop();
        }

        // Apply spin curve (Magnus effect)
        this.vx += this.spin * 450 * dt;
        this.spin *= Math.pow(this.spinDecay, dt * 60);

        // Normalize speed
        this.speed = Math.hypot(this.vx, this.vy);
        if (this.speed > this.maxSpeed) {
            const ratio = this.maxSpeed / this.speed;
            this.vx *= ratio;
            this.vy *= ratio;
            this.speed = this.maxSpeed;
        }

        this.x += this.vx * dt;
        this.y += this.vy * dt;

        // Reset smash when velocity cools down
        if (this.isSmash && this.speed < 1400) {
            this.isSmash = false;
        }
    }

    render(ctx) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';

        // Render Motion Ribbon / Trail
        if (this.trail.length > 1) {
            for (let i = 0; i < this.trail.length - 1; i++) {
                const p1 = this.trail[i];
                const p2 = this.trail[i + 1];
                const progress = 1.0 - (i / this.trail.length);
                const width = this.radius * 1.8 * progress;

                ctx.strokeStyle = p1.isSmash ? '#ffea00' : p1.color;
                ctx.lineWidth = width;
                ctx.lineCap = 'round';
                ctx.globalAlpha = progress * 0.45;
                ctx.shadowColor = p1.isSmash ? '#ffaa00' : p1.color;
                ctx.shadowBlur = 18 * progress;

                ctx.beginPath();
                ctx.moveTo(p1.x, p1.y);
                ctx.lineTo(p2.x, p2.y);
                ctx.stroke();
            }
        }

        // Render Outer Neon Aura
        const outerGlow = this.isSmash ? '#ffea00' : this.color;
        ctx.globalAlpha = 0.9;
        ctx.fillStyle = outerGlow;
        ctx.shadowColor = outerGlow;
        ctx.shadowBlur = this.isSmash ? 45 : 30;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // Render White Hot Core
        ctx.globalAlpha = 1.0;
        ctx.fillStyle = this.coreColor;
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * 0.65, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}

class NeonPaddle {
    constructor(x, y, width = 230, height = 36, color = '#00f3ff', label = 'PLAYER') {
        this.x = x;
        this.y = y;
        this.targetX = x;
        this.baseWidth = width;
        this.width = width;
        this.height = height;
        this.color = color;
        this.coreColor = '#ffffff';
        this.label = label;
        this.vx = 0;
        this.prevX = x;
        this.powerupTimer = 0;
        this.hasShield = false;
        this.glowIntensity = 30;
        this.impactFlash = 0;
    }

    update(dt) {
        // Smooth inertia tracking
        const speed = 18; // spring responsiveness
        this.prevX = this.x;
        this.x += (this.targetX - this.x) * Math.min(1.0, dt * speed);
        this.vx = (this.x - this.prevX) / (dt || 0.016);

        // Clamp inside court walls (wall margins = 35px)
        const halfW = this.width / 2;
        if (this.x - halfW < 35) this.x = 35 + halfW;
        if (this.x + halfW > 1045) this.x = 1045 - halfW;

        if (this.impactFlash > 0) {
            this.impactFlash = Math.max(0, this.impactFlash - dt * 4);
        }

        if (this.powerupTimer > 0) {
            this.powerupTimer -= dt;
            if (this.powerupTimer <= 0) {
                this.width = this.baseWidth;
            }
        }
    }

    render(ctx) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';

        const halfW = this.width / 2;
        const halfH = this.height / 2;
        const cornerR = halfH;
        const rx = this.x - halfW;
        const ry = this.y - halfH;

        // Flash color upon ball impact
        const drawColor = this.impactFlash > 0 ? '#ffffff' : this.color;
        const blur = this.glowIntensity + (this.impactFlash * 35);

        // Outer Glow
        ctx.fillStyle = drawColor;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = blur;
        ctx.beginPath();
        ctx.roundRect(rx, ry, this.width, this.height, cornerR);
        ctx.fill();

        // Inner White Rod
        ctx.fillStyle = '#ffffff';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.roundRect(rx + 8, ry + 8, this.width - 16, this.height - 16, cornerR / 2);
        ctx.fill();

        // Protective Laser Shield if active
        if (this.hasShield) {
            ctx.strokeStyle = '#00ffaa';
            ctx.lineWidth = 6;
            ctx.shadowColor = '#00ffaa';
            ctx.shadowBlur = 20;
            const shieldY = this.y > 960 ? 1860 : 60;
            ctx.beginPath();
            ctx.moveTo(35, shieldY);
            ctx.lineTo(1045, shieldY);
            ctx.stroke();
        }

        ctx.restore();
    }
}

class NeonPowerup {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type; // 'MULTIBALL', 'SHIELD', 'WIDE_PADDLE', 'SURGE'
        this.radius = 28;
        this.active = true;
        this.timer = 12.0; // Despawn after 12s
        this.pulse = 0;
        
        switch (type) {
            case 'MULTIBALL':
                this.color = '#ffaa00';
                this.symbol = '×3';
                break;
            case 'SHIELD':
                this.color = '#00ffaa';
                this.symbol = '🛡';
                break;
            case 'WIDE_PADDLE':
                this.color = '#00f3ff';
                this.symbol = '↔';
                break;
            case 'SURGE':
                this.color = '#ff00ff';
                this.symbol = '⚡';
                break;
            default:
                this.color = '#ffffff';
                this.symbol = '★';
        }
    }

    update(dt) {
        this.timer -= dt;
        if (this.timer <= 0) {
            this.active = false;
        }
        this.pulse += dt * 4;
    }

    render(ctx) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';

        const scale = 1.0 + Math.sin(this.pulse) * 0.12;
        const r = this.radius * scale;

        ctx.fillStyle = this.color;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 25;
        ctx.globalAlpha = 0.85;

        // Outer Hexagon or Circle
        ctx.beginPath();
        ctx.arc(this.x, this.y, r, 0, Math.PI * 2);
        ctx.fill();

        // Core White Ring
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(this.x, this.y, r * 0.75, 0, Math.PI * 2);
        ctx.stroke();

        // Icon Text
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 22px "Orbitron", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.symbol, this.x, this.y);

        ctx.restore();
    }
}

class NeonPhysicsEngine {
    constructor(particleSystem, audioEngine) {
        this.particles = particleSystem;
        this.audio = audioEngine;
        this.balls = [];
        this.powerups = [];
        this.wallLeft = 35;
        this.wallRight = 1045;
        this.courtTop = 0;
        this.courtBottom = 1920;
        this.wallGlowLeft = 0;
        this.wallGlowRight = 0;
        this.rallyCount = 0;
        this.powerupCooldown = 7.0;
    }

    spawnBall(serveToPlayer = true) {
        const x = 540;
        const y = 960;
        const speed = 1080;
        const angleOffset = (Math.random() - 0.5) * 0.6; // Slight angle
        const dirY = serveToPlayer ? 1 : -1;
        const vx = speed * Math.sin(angleOffset);
        const vy = speed * Math.cos(angleOffset) * dirY;

        const ball = new NeonBall(x, y, vx, vy);
        ball.color = serveToPlayer ? '#00f3ff' : '#ff007f';
        this.balls.push(ball);
        return ball;
    }

    spawnPowerup() {
        const types = ['MULTIBALL', 'SHIELD', 'WIDE_PADDLE', 'SURGE'];
        const type = types[Math.floor(Math.random() * types.length)];
        const x = 150 + Math.random() * (1080 - 300);
        const y = 720 + Math.random() * 480; // Middle zone of court
        const powerup = new NeonPowerup(x, y, type);
        this.powerups.push(powerup);
        if (this.audio) this.audio.playPowerup();
        if (this.particles) this.particles.emitShockwave(x, y, powerup.color, 120, 6);
    }

    update(dt, playerPaddle, aiPaddle, onScoreCallback) {
        // Wall glow decay
        this.wallGlowLeft = Math.max(0, this.wallGlowLeft - dt * 3.5);
        this.wallGlowRight = Math.max(0, this.wallGlowRight - dt * 3.5);

        // Powerup spawner
        this.powerupCooldown -= dt;
        if (this.powerupCooldown <= 0 && this.powerups.length < 2) {
            this.spawnPowerup();
            this.powerupCooldown = 11.0 + Math.random() * 8.0;
        }

        // Update powerups
        for (let i = this.powerups.length - 1; i >= 0; i--) {
            const pup = this.powerups[i];
            pup.update(dt);
            if (!pup.active) {
                this.powerups.splice(i, 1);
            }
        }

        // Update each ball
        for (let bIdx = this.balls.length - 1; bIdx >= 0; bIdx--) {
            const ball = this.balls[bIdx];
            ball.update(dt);

            // Left Wall Collision
            if (ball.x - ball.radius <= this.wallLeft) {
                ball.x = this.wallLeft + ball.radius;
                ball.vx = Math.abs(ball.vx);
                ball.spin *= 0.7; // Wall friction reduces spin
                this.wallGlowLeft = 1.0;
                if (this.particles) {
                    this.particles.emitSparks(this.wallLeft, ball.y, 16, '#00f3ff', 500, Math.PI * 0.8, 0);
                    this.particles.addTrauma(0.08);
                }
                if (this.audio) this.audio.playWallHit(1.0 + (ball.speed / 2000));
            }

            // Right Wall Collision
            if (ball.x + ball.radius >= this.wallRight) {
                ball.x = this.wallRight - ball.radius;
                ball.vx = -Math.abs(ball.vx);
                ball.spin *= 0.7;
                this.wallGlowRight = 1.0;
                if (this.particles) {
                    this.particles.emitSparks(this.wallRight, ball.y, 16, '#ff007f', 500, Math.PI * 0.8, Math.PI);
                    this.particles.addTrauma(0.08);
                }
                if (this.audio) this.audio.playWallHit(1.0 + (ball.speed / 2000));
            }

            // Paddle 1 (Bottom - Player) Collision Check
            this.checkPaddleCollision(ball, playerPaddle, true);

            // Paddle 2 (Top - AI or P2) Collision Check
            this.checkPaddleCollision(ball, aiPaddle, false);

            // Powerup collection check
            for (let pIdx = this.powerups.length - 1; pIdx >= 0; pIdx--) {
                const pup = this.powerups[pIdx];
                const dist = Math.hypot(ball.x - pup.x, ball.y - pup.y);
                if (dist <= ball.radius + pup.radius) {
                    this.applyPowerup(pup, ball.lastHitBy === 'ai' ? aiPaddle : playerPaddle);
                    if (this.particles) {
                        this.particles.emitSparks(pup.x, pup.y, 30, pup.color, 600);
                        this.particles.emitShockwave(pup.x, pup.y, pup.color, 260, 10);
                    }
                    if (this.audio) this.audio.playPowerup();
                    this.powerups.splice(pIdx, 1);
                }
            }

            // Goal check (Bottom goal: AI scores / Player misses)
            if (ball.y - ball.radius > this.courtBottom) {
                if (playerPaddle.hasShield) {
                    playerPaddle.hasShield = false;
                    ball.vy = -Math.abs(ball.vy);
                    ball.y = this.courtBottom - 80;
                    if (this.audio) this.audio.playSmash();
                    if (this.particles) this.particles.emitShockwave(ball.x, 1860, '#00ffaa', 350, 14);
                } else {
                    this.balls.splice(bIdx, 1);
                    if (onScoreCallback) onScoreCallback('ai', ball.x, 1900);
                }
                continue;
            }

            // Goal check (Top goal: Player scores / AI misses)
            if (ball.y + ball.radius < this.courtTop) {
                if (aiPaddle.hasShield) {
                    aiPaddle.hasShield = false;
                    ball.vy = Math.abs(ball.vy);
                    ball.y = 80;
                    if (this.audio) this.audio.playSmash();
                    if (this.particles) this.particles.emitShockwave(ball.x, 60, '#00ffaa', 350, 14);
                } else {
                    this.balls.splice(bIdx, 1);
                    if (onScoreCallback) onScoreCallback('player', ball.x, 20);
                }
                continue;
            }
        }
    }

    checkPaddleCollision(ball, paddle, isPlayer) {
        const halfW = paddle.width / 2;
        const halfH = paddle.height / 2;

        // Find closest point on paddle's AABB
        const closestX = Math.max(paddle.x - halfW, Math.min(ball.x, paddle.x + halfW));
        const closestY = Math.max(paddle.y - halfH, Math.min(ball.y, paddle.y + halfH));

        const distX = ball.x - closestX;
        const distY = ball.y - closestY;
        const distSq = distX * distX + distY * distY;

        // Check intersection and correct direction (prevent multiple triggers inside paddle)
        const isMovingTowards = isPlayer ? ball.vy > 0 : ball.vy < 0;

        if (distSq < (ball.radius * ball.radius) && isMovingTowards) {
            // Collision occurred!
            this.rallyCount++;
            ball.lastHitBy = isPlayer ? 'player' : 'ai';
            paddle.impactFlash = 1.0;

            // Normalized hit offset (-1 to +1 from center of paddle)
            const offset = (ball.x - paddle.x) / halfW;
            const clampedOffset = Math.max(-0.95, Math.min(0.95, offset));

            // Calculate deflection angle (max 65 degrees = 1.134 rad from vertical)
            const maxAngle = 1.134;
            const bounceAngle = clampedOffset * maxAngle;

            // Momentum transfer from paddle speed (imparts spin + speed boost)
            const paddleSpeed = paddle.vx;
            ball.spin = Math.max(-1.0, Math.min(1.0, paddleSpeed / 700 + clampedOffset * 0.4));

            // Progressive speed ramp-up per rally hit
            let newSpeed = Math.min(ball.maxSpeed, ball.speed + 45);

            // Smash mechanic: fast paddle movement triggers smash hit
            const isSmashStrike = Math.abs(paddleSpeed) > 650;
            if (isSmashStrike) {
                newSpeed = Math.min(ball.maxSpeed, newSpeed + 350);
                ball.isSmash = true;
                if (this.audio) this.audio.playSmash();
                if (this.particles) {
                    this.particles.emitShockwave(ball.x, paddle.y, '#ffea00', 300, 12);
                    this.particles.addTrauma(0.35);
                }
            } else {
                if (this.audio) this.audio.playPaddleHit(1.0 + (this.rallyCount * 0.05), isPlayer);
                if (this.particles) {
                    this.particles.emitSparks(
                        ball.x,
                        paddle.y + (isPlayer ? -halfH : halfH),
                        20,
                        paddle.color,
                        550,
                        Math.PI * 0.6,
                        isPlayer ? -Math.PI / 2 : Math.PI / 2
                    );
                    this.particles.addTrauma(0.12);
                }
            }

            // Directional deflection
            const signY = isPlayer ? -1 : 1;
            ball.vx = newSpeed * Math.sin(bounceAngle);
            ball.vy = newSpeed * Math.cos(bounceAngle) * signY;
            ball.speed = newSpeed;
            ball.color = paddle.color;

            // Reposition ball just outside paddle boundary
            ball.y = isPlayer ? paddle.y - halfH - ball.radius : paddle.y + halfH + ball.radius;
        }
    }

    applyPowerup(powerup, paddle) {
        switch (powerup.type) {
            case 'MULTIBALL':
                // Duplicate active balls
                const currentCount = this.balls.length;
                for (let i = 0; i < currentCount && this.balls.length < 5; i++) {
                    const src = this.balls[i];
                    const b1 = new NeonBall(src.x, src.y, -src.vx, src.vy);
                    b1.color = '#ffaa00';
                    this.balls.push(b1);
                }
                break;
            case 'SHIELD':
                paddle.hasShield = true;
                break;
            case 'WIDE_PADDLE':
                paddle.width = paddle.baseWidth * 1.45;
                paddle.powerupTimer = 9.0;
                break;
            case 'SURGE':
                this.balls.forEach(b => {
                    b.speed = Math.min(b.maxSpeed, b.speed + 400);
                    b.isSmash = true;
                });
                break;
        }
    }

    render(ctx) {
        // Draw powerups
        for (let i = 0; i < this.powerups.length; i++) {
            this.powerups[i].render(ctx);
        }

        // Draw balls
        for (let i = 0; i < this.balls.length; i++) {
            this.balls[i].render(ctx);
        }
    }
}

window.NeonPhysicsEngine = NeonPhysicsEngine;
window.NeonPaddle = NeonPaddle;
window.NeonBall = NeonBall;
