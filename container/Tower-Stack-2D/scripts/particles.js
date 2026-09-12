/**
 * scripts/particles.js - Construct 3 Style Particle System
 * Handles dynamic impact dust, golden star sparkles, combo confetti,
 * and floating score toasts.
 */

class Particle {
    constructor(x, y, options = {}) {
        this.x = x;
        this.y = y;
        this.vx = options.vx !== undefined ? options.vx : (Math.random() - 0.5) * 350;
        this.vy = options.vy !== undefined ? options.vy : (Math.random() - 0.5) * 350;
        this.gravity = options.gravity !== undefined ? options.gravity : 500;
        this.color = options.color || '#ffeb3b';
        this.size = options.size || (8 + Math.random() * 10);
        this.initialSize = this.size;
        this.alpha = 1;
        this.life = options.life || 0.6;
        this.maxLife = this.life;
        this.rotation = Math.random() * Math.PI * 2;
        this.rotSpeed = (Math.random() - 0.5) * 8;
        this.shape = options.shape || 'circle'; // 'circle' | 'star' | 'text'
        this.text = options.text || '';
    }

    update(dt) {
        this.life -= dt;
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.vy += this.gravity * dt;
        this.rotation += this.rotSpeed * dt;

        const progress = Math.max(0, this.life / this.maxLife);
        this.alpha = Math.pow(progress, 1.2);
        if (this.shape !== 'text') {
            this.size = this.initialSize * progress;
        }
        return this.life > 0;
    }

    draw(ctx, cameraY) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, Math.min(1, this.alpha));
        ctx.translate(this.x, this.y + cameraY);

        if (this.shape === 'star') {
            ctx.rotate(this.rotation);
            ctx.fillStyle = this.color;
            ctx.beginPath();
            const spikes = 5;
            const outerRadius = this.size;
            const innerRadius = this.size * 0.45;
            let rot = (Math.PI / 2) * 3;
            const step = Math.PI / spikes;

            ctx.moveTo(0, -outerRadius);
            for (let i = 0; i < spikes; i++) {
                let px = Math.cos(rot) * outerRadius;
                let py = Math.sin(rot) * outerRadius;
                ctx.lineTo(px, py);
                rot += step;

                px = Math.cos(rot) * innerRadius;
                py = Math.sin(rot) * innerRadius;
                ctx.lineTo(px, py);
                rot += step;
            }
            ctx.closePath();
            ctx.fill();
        } else if (this.shape === 'text') {
            ctx.font = '900 38px Rubik, sans-serif';
            ctx.fillStyle = this.color;
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 6;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.strokeText(this.text, 0, 0);
            ctx.fillText(this.text, 0, 0);
        } else {
            // Circle
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(0, 0, Math.max(0.5, this.size), 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }
}

class ParticleSystem {
    constructor() {
        this.particles = [];
    }

    addImpactDust(x, y, count = 12) {
        for (let i = 0; i < count; i++) {
            const angle = Math.PI + (Math.random() - 0.5) * Math.PI; // Upwards spread
            const speed = 150 + Math.random() * 260;
            this.particles.push(new Particle(x, y, {
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 60,
                color: '#ffffff',
                size: 6 + Math.random() * 8,
                life: 0.35 + Math.random() * 0.2,
                gravity: 400,
                shape: 'circle'
            }));
        }
    }

    addPerfectBurst(x, y, count = 24) {
        const starColors = ['#ffea00', '#ffd700', '#ffffff', '#ff9100'];
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 200 + Math.random() * 450;
            this.particles.push(new Particle(x, y, {
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 120,
                color: starColors[Math.floor(Math.random() * starColors.length)],
                size: 14 + Math.random() * 12,
                life: 0.6 + Math.random() * 0.35,
                gravity: 520,
                shape: 'star'
            }));
        }
    }

    addScorePopup(x, y, text, color = '#ffeb3b') {
        this.particles.push(new Particle(x, y, {
            vx: (Math.random() - 0.5) * 40,
            vy: -180,
            gravity: 0,
            life: 0.85,
            shape: 'text',
            text: text,
            color: color
        }));
    }

    update(dt) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            if (!this.particles[i].update(dt)) {
                this.particles.splice(i, 1);
            }
        }
    }

    draw(ctx, cameraY) {
        for (let i = 0; i < this.particles.length; i++) {
            this.particles[i].draw(ctx, cameraY);
        }
    }

    reset() {
        this.particles = [];
    }
}

if (typeof window !== 'undefined') {
    window.Particle = Particle;
    window.ParticleSystem = ParticleSystem;
}

