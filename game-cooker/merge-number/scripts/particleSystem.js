// Merge Numbers - High-Performance Canvas Particle System
// Handles star sparkles, floating score popups, shockwaves, and haptic camera shakes

class ParticleSystem {
    constructor() {
        this.particles = [];
        this.floatingTexts = [];
        this.shockwaves = [];
        this.shakeTime = 0;
        this.shakeIntensity = 0;
        this.shakeX = 0;
        this.shakeY = 0;
    }

    reset() {
        this.particles = [];
        this.floatingTexts = [];
        this.shockwaves = [];
        this.shakeTime = 0;
        this.shakeIntensity = 0;
        this.shakeX = 0;
        this.shakeY = 0;
    }

    triggerShake(intensity = 12, duration = 0.25) {
        this.shakeIntensity = intensity;
        this.shakeTime = duration;
    }

    spawnMergeBurst(x, y, color = '#f5c30a', count = 28) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 120 + Math.random() * 380;
            const size = 12 + Math.random() * 22;
            const life = 0.45 + Math.random() * 0.4;
            this.particles.push({
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 60,
                size,
                initialSize: size,
                color,
                rotation: Math.random() * Math.PI * 2,
                vRot: (Math.random() - 0.5) * 8,
                life,
                maxLife: life,
                gravity: 360
            });
        }

        this.shockwaves.push({
            x,
            y,
            radius: 20,
            maxRadius: 180,
            color,
            life: 0.35,
            maxLife: 0.35
        });

        this.triggerShake(count > 20 ? 14 : 8, 0.2);
    }

    spawnFloatingText(text, x, y, color = '#ffffff', fontSize = 54) {
        this.floatingTexts.push({
            text,
            x,
            y,
            startY: y,
            color,
            fontSize,
            life: 0.85,
            maxLife: 0.85,
            scale: 0.5
        });
    }

    spawnTrailSparkle(x, y, color = '#ffd32a') {
        if (Math.random() > 0.4) return;
        const angle = Math.random() * Math.PI * 2;
        const speed = 30 + Math.random() * 80;
        this.particles.push({
            x: x + (Math.random() - 0.5) * 40,
            y: y + (Math.random() - 0.5) * 40,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            size: 8 + Math.random() * 12,
            initialSize: 12,
            color,
            rotation: Math.random() * Math.PI * 2,
            vRot: (Math.random() - 0.5) * 6,
            life: 0.3,
            maxLife: 0.3,
            gravity: 40
        });
    }

    update(dt) {
        if (this.shakeTime > 0) {
            this.shakeTime -= dt;
            const progress = Math.max(0, this.shakeTime);
            this.shakeX = (Math.random() - 0.5) * this.shakeIntensity * (progress * 4);
            this.shakeY = (Math.random() - 0.5) * this.shakeIntensity * (progress * 4);
        } else {
            this.shakeX = 0;
            this.shakeY = 0;
        }

        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.life -= dt;
            if (p.life <= 0) {
                this.particles.splice(i, 1);
                continue;
            }
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.vy += p.gravity * dt;
            p.rotation += p.vRot * dt;
            p.size = p.initialSize * (p.life / p.maxLife);
        }

        for (let i = this.shockwaves.length - 1; i >= 0; i--) {
            const sw = this.shockwaves[i];
            sw.life -= dt;
            if (sw.life <= 0) {
                this.shockwaves.splice(i, 1);
                continue;
            }
            const progress = 1 - sw.life / sw.maxLife;
            sw.radius = 20 + (sw.maxRadius - 20) * Math.sin(progress * Math.PI * 0.5);
        }

        for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
            const ft = this.floatingTexts[i];
            ft.life -= dt;
            if (ft.life <= 0) {
                this.floatingTexts.splice(i, 1);
                continue;
            }
            const progress = 1 - ft.life / ft.maxLife;
            ft.y = ft.startY - progress * 140;
            if (progress < 0.2) {
                ft.scale = 0.5 + (progress / 0.2) * 0.7;
            } else {
                ft.scale = 1.2 - (progress - 0.2) * 0.25;
            }
        }
    }

    render(ctx) {
        ctx.save();

        for (const sw of this.shockwaves) {
            const alpha = Math.max(0, sw.life / sw.maxLife);
            ctx.save();
            ctx.beginPath();
            ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
            ctx.lineWidth = 14 * alpha;
            ctx.strokeStyle = sw.color;
            ctx.globalAlpha = alpha * 0.75;
            ctx.stroke();
            ctx.restore();
        }

        for (const p of this.particles) {
            const alpha = Math.max(0, p.life / p.maxLife);
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rotation);
            ctx.globalAlpha = alpha;

            ctx.fillStyle = p.color;
            ctx.beginPath();
            const r1 = p.size;
            const r2 = p.size * 0.25;
            for (let i = 0; i < 8; i++) {
                const a = i * Math.PI / 4;
                const r = i % 2 === 0 ? r1 : r2;
                const px = Math.cos(a) * r;
                const py = Math.sin(a) * r;
                if (i === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            }
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(0, 0, p.size * 0.2, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        }

        for (const ft of this.floatingTexts) {
            const alpha = Math.min(1, ft.life / 0.3);
            ctx.save();
            ctx.translate(ft.x, ft.y);
            ctx.scale(ft.scale, ft.scale);
            ctx.globalAlpha = alpha;
            ctx.font = `bold ${ft.fontSize}px -apple-system, Segoe UI, Roboto, sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            ctx.lineWidth = 8;
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.strokeText(ft.text, 0, 0);

            ctx.fillStyle = ft.color;
            ctx.fillText(ft.text, 0, 0);
            ctx.restore();
        }

        ctx.restore();
    }
}

window.particleSystem = new ParticleSystem();
