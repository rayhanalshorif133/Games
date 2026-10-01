// Particle System & Floating Text for Mad Snake
class ParticleSystem {
    constructor() {
        this.particles = [];
        this.floatingTexts = [];
    }

    addSparkles(x, y, color = '#4ade80', count = 16) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 120 + 40;
            this.particles.push({
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: Math.random() * 6 + 3,
                color,
                alpha: 1,
                life: Math.random() * 0.4 + 0.3,
                maxLife: 0.7,
                type: 'sparkle'
            });
        }
    }

    addExplosion(x, y) {
        const colors = ['#ef4444', '#f97316', '#facc15', '#ffffff'];
        for (let i = 0; i < 40; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 240 + 60;
            const col = colors[Math.floor(Math.random() * colors.length)];
            this.particles.push({
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: Math.random() * 12 + 6,
                color: col,
                alpha: 1,
                life: Math.random() * 0.5 + 0.4,
                maxLife: 0.9,
                type: 'flame'
            });
        }
    }

    addFireTrail(x, y) {
        for (let i = 0; i < 3; i++) {
            this.particles.push({
                x: x + (Math.random() - 0.5) * 16,
                y: y + (Math.random() - 0.5) * 16,
                vx: (Math.random() - 0.5) * 30,
                vy: (Math.random() - 0.5) * 30,
                size: Math.random() * 8 + 4,
                color: Math.random() > 0.5 ? '#f59e0b' : '#ef4444',
                alpha: 0.8,
                life: 0.25,
                maxLife: 0.25,
                type: 'trail'
            });
        }
    }

    addConfetti(w, h) {
        const colors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];
        for (let i = 0; i < 80; i++) {
            this.particles.push({
                x: Math.random() * w,
                y: -20 - Math.random() * 100,
                vx: (Math.random() - 0.5) * 100,
                vy: Math.random() * 200 + 150,
                size: Math.random() * 10 + 6,
                color: colors[Math.floor(Math.random() * colors.length)],
                alpha: 1,
                life: 2.5,
                maxLife: 2.5,
                rotation: Math.random() * 360,
                rotSpeed: (Math.random() - 0.5) * 720,
                type: 'confetti'
            });
        }
    }

    addFloatingText(text, x, y, color = '#ffffff', fontSize = 38) {
        this.floatingTexts.push({
            text,
            x,
            y,
            vy: -80,
            alpha: 1,
            life: 0.8,
            maxLife: 0.8,
            color,
            fontSize
        });
    }

    update(dt) {
        // Update particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.life -= dt;
            p.alpha = Math.max(0, p.life / p.maxLife);
            if (p.rotation !== undefined) {
                p.rotation += p.rotSpeed * dt;
            }
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }

        // Update floating texts
        for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
            const ft = this.floatingTexts[i];
            ft.y += ft.vy * dt;
            ft.life -= dt;
            ft.alpha = Math.max(0, ft.life / ft.maxLife);
            if (ft.life <= 0) {
                this.floatingTexts.splice(i, 1);
            }
        }
    }

    draw(ctx) {
        ctx.save();
        // Draw particles
        for (const p of this.particles) {
            ctx.globalAlpha = p.alpha;
            ctx.fillStyle = p.color;
            if (p.type === 'confetti') {
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate((p.rotation * Math.PI) / 180);
                ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
                ctx.restore();
            } else {
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // Draw floating texts
        for (const ft of this.floatingTexts) {
            ctx.globalAlpha = ft.alpha;
            ctx.font = `bold ${ft.fontSize}px 'Outfit', -apple-system, sans-serif`;
            ctx.fillStyle = ft.color;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
            ctx.shadowBlur = 8;
            ctx.fillText(ft.text, ft.x, ft.y);
        }
        ctx.restore();
    }

    clear() {
        this.particles = [];
        this.floatingTexts = [];
    }
}

window.ParticleSystem = ParticleSystem;
