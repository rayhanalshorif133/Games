/**
 * Visual Effects, Particle Systems, and Screen Shake for 2D Soccer
 */
class Particle {
    constructor(x, y, vx, vy, color, size, life, shape = 'circle') {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.color = color;
        this.size = size;
        this.maxLife = life;
        this.life = life;
        this.shape = shape; // 'circle', 'square', 'star', 'confetti'
        this.rotation = Math.random() * Math.PI * 2;
        this.vRot = (Math.random() - 0.5) * 0.2;
        this.drag = 0.98;
        this.gravity = 0;
    }

    update(dt) {
        this.x += this.vx * dt * 60;
        this.y += this.vy * dt * 60;
        this.vy += this.gravity * dt * 60;
        this.vx *= Math.pow(this.drag, dt * 60);
        this.vy *= Math.pow(this.drag, dt * 60);
        this.rotation += this.vRot * dt * 60;
        this.life -= dt;
        return this.life > 0;
    }

    render(ctx) {
        const progress = Math.max(0, this.life / this.maxLife);
        const alpha = Math.min(1, progress * 1.5);
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);

        if (this.shape === 'circle') {
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(0, 0, Math.max(0.5, this.size * progress), 0, Math.PI * 2);
            ctx.fill();
        } else if (this.shape === 'confetti') {
            ctx.fillStyle = this.color;
            const w = this.size * 1.5;
            const h = this.size * 0.7 * Math.cos(this.rotation * 2);
            ctx.fillRect(-w / 2, -h / 2, w, Math.abs(h) + 1);
        } else if (this.shape === 'spark') {
            ctx.strokeStyle = this.color;
            ctx.lineWidth = this.size * progress;
            ctx.beginPath();
            ctx.moveTo(-this.size, 0);
            ctx.lineTo(this.size, 0);
            ctx.stroke();
        } else {
            ctx.fillStyle = this.color;
            const s = this.size * progress;
            ctx.fillRect(-s / 2, -s / 2, s, s);
        }
        ctx.restore();
    }
}

class RingEffect {
    constructor(x, y, maxRadius, color, life) {
        this.x = x;
        this.y = y;
        this.maxRadius = maxRadius;
        this.radius = 5;
        this.color = color;
        this.maxLife = life;
        this.life = life;
    }

    update(dt) {
        this.life -= dt;
        const progress = 1 - (this.life / this.maxLife);
        this.radius = 5 + (this.maxRadius - 5) * Math.sin(progress * Math.PI * 0.5);
        return this.life > 0;
    }

    render(ctx) {
        const progress = Math.max(0, this.life / this.maxLife);
        ctx.save();
        ctx.globalAlpha = progress;
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 4 * progress;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }
}

class EffectsManager {
    constructor() {
        this.particles = [];
        this.rings = [];
        this.ballTrails = [];
        this.shakeTime = 0;
        this.shakeMagnitude = 0;
        this.shakeX = 0;
        this.shakeY = 0;
        this.goalCelebration = null;
    }

    reset() {
        this.particles = [];
        this.rings = [];
        this.ballTrails = [];
        this.shakeTime = 0;
        this.shakeMagnitude = 0;
        this.goalCelebration = null;
    }

    triggerShake(magnitude = 8, duration = 0.3) {
        this.shakeMagnitude = Math.max(this.shakeMagnitude, magnitude);
        this.shakeTime = Math.max(this.shakeTime, duration);
    }

    // Ball motion trail behind fast moving ball
    addBallTrail(x, y, radius, speed) {
        if (speed < 4) return;
        const alpha = Math.min(0.6, (speed - 4) / 18);
        this.ballTrails.push({
            x, y,
            radius: radius * 0.85,
            alpha: alpha,
            life: 0.18,
            maxLife: 0.18
        });
        if (this.ballTrails.length > 25) {
            this.ballTrails.shift();
        }
    }

    // Paddle strike impact: rings, sparks, and grass turf
    spawnPaddleImpact(x, y, angle, speed, isRed) {
        const ringColor = isRed ? '#ff4d4d' : '#ffc400';
        this.rings.push(new RingEffect(x, y, 45 + speed * 1.5, ringColor, 0.28));

        // Impact sparks
        const count = 12 + Math.floor(speed * 1.2);
        for (let i = 0; i < count; i++) {
            const spread = angle + (Math.random() - 0.5) * 1.4;
            const pSpeed = (speed * 0.6 + Math.random() * 8 + 3);
            const vx = Math.cos(spread) * pSpeed;
            const vy = Math.sin(spread) * pSpeed;
            const color = Math.random() > 0.4 ? '#ffffff' : ringColor;
            const size = Math.random() * 4 + 2;
            const life = Math.random() * 0.25 + 0.15;
            this.particles.push(new Particle(x, y, vx, vy, color, size, life, 'spark'));
        }

        // Green turf particles
        for (let i = 0; i < 8; i++) {
            const pAngle = Math.random() * Math.PI * 2;
            const pSpeed = Math.random() * 5 + 2;
            const color = Math.random() > 0.5 ? '#43a047' : '#7cb342';
            this.particles.push(new Particle(
                x, y,
                Math.cos(pAngle) * pSpeed,
                Math.sin(pAngle) * pSpeed,
                color,
                Math.random() * 3 + 2,
                Math.random() * 0.3 + 0.15,
                'square'
            ));
        }

        this.triggerShake(speed > 12 ? 8 : 4, 0.2);
    }

    // Wall bounce sparks
    spawnWallBounce(x, y, nx, ny) {
        for (let i = 0; i < 8; i++) {
            const angle = Math.atan2(ny, nx) + (Math.random() - 0.5) * 1.2;
            const speed = Math.random() * 6 + 3;
            this.particles.push(new Particle(
                x, y,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                '#ffffff',
                Math.random() * 3 + 2,
                Math.random() * 0.2 + 0.1,
                'spark'
            ));
        }
        this.triggerShake(3, 0.12);
    }

    // Post clang sparks
    spawnPostImpact(x, y) {
        this.rings.push(new RingEffect(x, y, 55, '#ffff55', 0.35));
        for (let i = 0; i < 20; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 9 + 4;
            this.particles.push(new Particle(
                x, y,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                Math.random() > 0.5 ? '#ffe600' : '#ffffff',
                Math.random() * 4 + 2,
                Math.random() * 0.35 + 0.15,
                'spark'
            ));
        }
        this.triggerShake(9, 0.25);
    }

    // Massive goal celebration confetti explosion
    spawnGoalExplosion(goalY, isTopGoal, scorerRole, scorerName) {
        this.triggerShake(14, 0.65);
        this.goalCelebration = {
            time: 2.8,
            maxTime: 2.8,
            scorerRole,
            scorerName,
            goalY
        };

        const colors = ['#e53935', '#fdd835', '#1e88e5', '#43a047', '#8e24aa', '#ffffff', '#ff9800'];
        const centerX = 376;
        const startY = isTopGoal ? 180 : 1180;

        // Blast of confetti from goal mouth
        for (let i = 0; i < 160; i++) {
            const angle = (isTopGoal ? Math.PI * 0.5 : -Math.PI * 0.5) + (Math.random() - 0.5) * 1.6;
            const speed = Math.random() * 16 + 5;
            const color = colors[Math.floor(Math.random() * colors.length)];
            const p = new Particle(
                centerX + (Math.random() - 0.5) * 160,
                startY,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                color,
                Math.random() * 8 + 5,
                Math.random() * 1.8 + 1.2,
                'confetti'
            );
            p.gravity = (isTopGoal ? 0.12 : -0.05);
            p.drag = 0.96;
            this.particles.push(p);
        }

        // Additional sky rain confetti
        for (let i = 0; i < 90; i++) {
            const color = colors[Math.floor(Math.random() * colors.length)];
            const p = new Particle(
                Math.random() * 700 + 26,
                Math.random() * 300,
                (Math.random() - 0.5) * 3,
                Math.random() * 5 + 3,
                color,
                Math.random() * 7 + 4,
                Math.random() * 2.2 + 1.0,
                'confetti'
            );
            p.gravity = 0.15;
            p.drag = 0.98;
            this.particles.push(p);
        }
    }

    update(dt) {
        // Update screen shake
        if (this.shakeTime > 0) {
            this.shakeTime -= dt;
            const factor = Math.max(0, this.shakeTime / 0.4);
            const currentMag = this.shakeMagnitude * factor;
            this.shakeX = (Math.random() - 0.5) * currentMag * 2;
            this.shakeY = (Math.random() - 0.5) * currentMag * 2;
        } else {
            this.shakeX = 0;
            this.shakeY = 0;
            this.shakeMagnitude = 0;
        }

        // Update goal celebration
        if (this.goalCelebration) {
            this.goalCelebration.time -= dt;
            if (this.goalCelebration.time <= 0) {
                this.goalCelebration = null;
            }
        }

        // Update ball trails
        for (let i = this.ballTrails.length - 1; i >= 0; i--) {
            const t = this.ballTrails[i];
            t.life -= dt;
            if (t.life <= 0) {
                this.ballTrails.splice(i, 1);
            }
        }

        // Update rings
        for (let i = this.rings.length - 1; i >= 0; i--) {
            if (!this.rings[i].update(dt)) {
                this.rings.splice(i, 1);
            }
        }

        // Update particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            if (!this.particles[i].update(dt)) {
                this.particles.splice(i, 1);
            }
        }
    }

    renderTrails(ctx) {
        for (const t of this.ballTrails) {
            const p = Math.max(0, t.life / t.maxLife);
            ctx.save();
            ctx.globalAlpha = t.alpha * p * 0.45;
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(t.x, t.y, t.radius * p, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }

    render(ctx) {
        // Render expanding impact rings
        for (const r of this.rings) {
            r.render(ctx);
        }

        // Render particles (sparks, confetti, grass turf)
        for (const p of this.particles) {
            p.render(ctx);
        }
    }

    renderCelebrationOverlay(ctx, width, height) {
        if (!this.goalCelebration) return;

        const { time, maxTime, scorerRole, scorerName } = this.goalCelebration;
        const progress = 1 - (time / maxTime);

        ctx.save();
        // Pulsing background flash
        if (progress < 0.25) {
            ctx.fillStyle = `rgba(255, 255, 255, ${0.35 * (1 - progress / 0.25)})`;
            ctx.fillRect(0, 0, width, height);
        }

        // "GOAL!" Graphic banner in center
        ctx.translate(width / 2, height / 2);
        
        // Elastic scale bounce in
        let scale = 1.0;
        if (progress < 0.18) {
            scale = (progress / 0.18) * 1.35;
        } else if (progress < 0.3) {
            scale = 1.35 - ((progress - 0.18) / 0.12) * 0.35;
        } else {
            scale = 1.0 + Math.sin(progress * 18) * 0.04;
        }
        ctx.scale(scale, scale);

        // Banner backdrop
        const bannerColor = scorerRole === 1 ? 'rgba(211, 47, 47, 0.92)' : 'rgba(245, 124, 0, 0.92)';
        ctx.fillStyle = bannerColor;
        ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
        ctx.shadowBlur = 24;
        ctx.shadowOffsetY = 6;

        const bW = 580;
        const bH = 140;
        ctx.beginPath();
        if (ctx.roundRect) {
            ctx.roundRect(-bW / 2, -bH / 2, bW, bH, 24);
        } else {
            ctx.rect(-bW / 2, -bH / 2, bW, bH);
        }
        ctx.fill();

        // Banner border
        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 0;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 6;
        ctx.stroke();

        // "GOAL!!!" text
        ctx.fillStyle = '#ffffff';
        ctx.font = '900 68px "Fredoka", Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('GOAL!!!', 0, -18);

        // Scorer subtext
        ctx.font = '700 28px "Fredoka", Arial, sans-serif';
        ctx.fillStyle = '#fff9c4';
        ctx.fillText(`${scorerName.toUpperCase()} SCORED!`, 0, 32);

        ctx.restore();
    }
}

window.effectsManager = new EffectsManager();

