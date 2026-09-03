// Neon Pong X - Particle Engine, Glow Trails, Shockwaves & Camera Trauma
// Delivers realistic neon blooming visual effects on Canvas 2D

class NeonParticleSystem {
    constructor() {
        this.particles = [];
        this.shockwaves = [];
        this.trauma = 0;
        this.maxShakeOffset = 25;
        this.maxShakeAngle = 0.04; // radians
        this.shakeX = 0;
        this.shakeY = 0;
        this.shakeAngle = 0;
        
        // Ambient cyber dust
        this.ambientParticles = [];
        this.initAmbientParticles();
    }

    initAmbientParticles(count = 35) {
        this.ambientParticles = [];
        for (let i = 0; i < count; i++) {
            this.ambientParticles.push({
                x: Math.random() * 1080,
                y: Math.random() * 1920,
                vx: (Math.random() - 0.5) * 20,
                vy: -30 - Math.random() * 50,
                size: 1.5 + Math.random() * 3,
                alpha: 0.15 + Math.random() * 0.4,
                color: Math.random() > 0.5 ? '#00f3ff' : '#ff007f'
            });
        }
    }

    addTrauma(amount) {
        this.trauma = Math.min(1.0, this.trauma + amount);
    }

    emitSparks(x, y, count = 25, color = '#00f3ff', speedBase = 450, spread = Math.PI * 2, baseAngle = 0) {
        for (let i = 0; i < count; i++) {
            const angle = spread === Math.PI * 2 ? 
                Math.random() * Math.PI * 2 : 
                baseAngle + (Math.random() - 0.5) * spread;
            
            const speed = (speedBase * 0.4) + Math.random() * speedBase;
            const life = 0.35 + Math.random() * 0.45;
            
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: life,
                maxLife: life,
                size: 2.5 + Math.random() * 4,
                color: color,
                drag: 0.94,
                glow: 12
            });
        }
    }

    emitGoalExplosion(x, y, primaryColor = '#00f3ff', secondaryColor = '#ffffff', count = 90) {
        this.addTrauma(0.85);
        this.shockwaves.push({
            x: x,
            y: y,
            radius: 20,
            maxRadius: 650,
            speed: 1200,
            color: primaryColor,
            width: 14,
            alpha: 1.0
        });

        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 250 + Math.random() * 1100;
            const life = 0.6 + Math.random() * 0.7;
            const isSecondary = Math.random() > 0.6;
            
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: life,
                maxLife: life,
                size: 3 + Math.random() * 6,
                color: isSecondary ? secondaryColor : primaryColor,
                drag: 0.96,
                glow: 20
            });
        }
    }

    emitShockwave(x, y, color = '#ffffff', maxRadius = 240, width = 8) {
        this.shockwaves.push({
            x: x,
            y: y,
            radius: 10,
            maxRadius: maxRadius,
            speed: 800,
            color: color,
            width: width,
            alpha: 1.0
        });
    }

    update(dt) {
        // Trauma decay
        if (this.trauma > 0) {
            this.trauma = Math.max(0, this.trauma - dt * 1.5);
            const shake = this.trauma * this.trauma;
            const time = performance.now() * 0.05;
            this.shakeX = (Math.sin(time) * 0.6 + Math.sin(time * 2.3) * 0.4) * this.maxShakeOffset * shake;
            this.shakeY = (Math.cos(time * 1.3) * 0.6 + Math.cos(time * 3.1) * 0.4) * this.maxShakeOffset * shake;
            this.shakeAngle = (Math.sin(time * 1.7) * this.maxShakeAngle) * shake;
        } else {
            this.shakeX = 0;
            this.shakeY = 0;
            this.shakeAngle = 0;
        }

        // Update active sparks
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.life -= dt;
            if (p.life <= 0) {
                this.particles.splice(i, 1);
                continue;
            }

            p.vx *= Math.pow(p.drag, dt * 60);
            p.vy *= Math.pow(p.drag, dt * 60);
            p.x += p.vx * dt;
            p.y += p.vy * dt;
        }

        // Update shockwaves
        for (let i = this.shockwaves.length - 1; i >= 0; i--) {
            const sw = this.shockwaves[i];
            sw.radius += sw.speed * dt;
            sw.alpha = Math.max(0, 1.0 - (sw.radius / sw.maxRadius));
            if (sw.radius >= sw.maxRadius || sw.alpha <= 0) {
                this.shockwaves.splice(i, 1);
            }
        }

        // Update ambient dust
        for (let i = 0; i < this.ambientParticles.length; i++) {
            const ap = this.ambientParticles[i];
            ap.x += ap.vx * dt;
            ap.y += ap.vy * dt;
            if (ap.y < -20) {
                ap.y = 1940;
                ap.x = Math.random() * 1080;
            }
            if (ap.x < 0) ap.x = 1080;
            if (ap.x > 1080) ap.x = 0;
        }
    }

    applyCameraTransform(ctx) {
        if (this.trauma > 0.01) {
            ctx.save();
            ctx.translate(1080 / 2 + this.shakeX, 1920 / 2 + this.shakeY);
            ctx.rotate(this.shakeAngle);
            ctx.translate(-1080 / 2, -1920 / 2);
            return true;
        }
        return false;
    }

    restoreCameraTransform(ctx, didTransform) {
        if (didTransform) {
            ctx.restore();
        }
    }

    render(ctx) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';

        // Draw ambient particles
        for (let i = 0; i < this.ambientParticles.length; i++) {
            const ap = this.ambientParticles[i];
            ctx.fillStyle = ap.color;
            ctx.globalAlpha = ap.alpha * 0.6;
            ctx.shadowColor = ap.color;
            ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.arc(ap.x, ap.y, ap.size, 0, Math.PI * 2);
            ctx.fill();
        }

        // Draw shockwaves
        for (let i = 0; i < this.shockwaves.length; i++) {
            const sw = this.shockwaves[i];
            ctx.globalAlpha = sw.alpha * 0.85;
            ctx.strokeStyle = sw.color;
            ctx.lineWidth = sw.width * sw.alpha;
            ctx.shadowColor = sw.color;
            ctx.shadowBlur = 25;
            ctx.beginPath();
            ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Draw particles
        for (let i = 0; i < this.particles.length; i++) {
            const p = this.particles[i];
            const progress = p.life / p.maxLife;
            ctx.globalAlpha = progress;
            ctx.fillStyle = p.color;
            ctx.shadowColor = p.color;
            ctx.shadowBlur = p.glow * progress;

            // Draw directional streak or circle
            const speed = Math.hypot(p.vx, p.vy);
            if (speed > 80) {
                const angle = Math.atan2(p.vy, p.vx);
                const len = Math.min(22, speed * 0.03 * progress);
                ctx.lineWidth = p.size * progress;
                ctx.strokeStyle = p.color;
                ctx.beginPath();
                ctx.moveTo(p.x, p.y);
                ctx.lineTo(p.x - Math.cos(angle) * len, p.y - Math.sin(angle) * len);
                ctx.stroke();
            } else {
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size * progress, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        ctx.restore();
    }
}

window.NeonParticleSystem = NeonParticleSystem;

