// Ready to Go by Bus - Visual Particle & VFX System
// Handles driving exhaust smoke, boarding sparkles, victory confetti, and collision dust

class ParticleSystem {
    constructor() {
        this.particles = [];
        this.confetti = [];
        this.floatingTexts = [];
    }

    reset() {
        this.particles = [];
        this.confetti = [];
        this.floatingTexts = [];
    }

    // Puffy tire smoke trail
    emitSmoke(x, y, vx = 0, vy = 0) {
        for (let i = 0; i < 3; i++) {
            this.particles.push({
                type: 'smoke',
                x: x + (Math.random() - 0.5) * 16,
                y: y + (Math.random() - 0.5) * 16,
                vx: vx * 0.2 + (Math.random() - 0.5) * 1.5,
                vy: vy * 0.2 + (Math.random() - 0.5) * 1.5 - 0.8,
                radius: 12 + Math.random() * 10,
                maxRadius: 28 + Math.random() * 12,
                alpha: 0.75,
                life: 1.0,
                decay: 0.025 + Math.random() * 0.015,
                color: 'rgba(255, 255, 255,'
            });
        }
    }

    // Sparkles on passenger boarding
    emitBoardingSparkle(x, y, colorRgb = '255, 215, 0') {
        for (let i = 0; i < 8; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 2 + Math.random() * 5;
            this.particles.push({
                type: 'sparkle',
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 2,
                radius: 4 + Math.random() * 4,
                alpha: 1.0,
                life: 1.0,
                decay: 0.04 + Math.random() * 0.03,
                color: `rgba(${colorRgb},`
            });
        }
    }

    // Collision bump dust/shockwave
    emitBump(x, y) {
        for (let i = 0; i < 10; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1.5 + Math.random() * 3.5;
            this.particles.push({
                type: 'bump',
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                radius: 6 + Math.random() * 6,
                alpha: 0.8,
                life: 1.0,
                decay: 0.06,
                color: 'rgba(220, 70, 70,'
            });
        }
    }

    // Floating score / text feedback
    addFloatingText(text, x, y, color = '#ffffff') {
        this.floatingTexts.push({
            text: text,
            x: x,
            y: y,
            vy: -2.5,
            alpha: 1.0,
            scale: 1.2,
            life: 1.0,
            decay: 0.02,
            color: color
        });
    }

    // Victory celebration confetti
    launchConfetti() {
        const colors = [
            '#e63946', '#f1faee', '#a8dadc', '#457b9d', '#1d3557',
            '#ffd166', '#06d6a0', '#118ab2', '#ff4d94', '#8338ec'
        ];
        for (let i = 0; i < 120; i++) {
            this.confetti.push({
                x: Math.random() * 1080,
                y: -50 - Math.random() * 200,
                vx: (Math.random() - 0.5) * 6,
                vy: 4 + Math.random() * 7,
                sizeW: 10 + Math.random() * 12,
                sizeH: 6 + Math.random() * 8,
                rot: Math.random() * Math.PI * 2,
                vrot: (Math.random() - 0.5) * 0.2,
                color: colors[Math.floor(Math.random() * colors.length)],
                alpha: 1.0
            });
        }
    }

    update(dt = 1) {
        // Particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.life -= p.decay * dt;
            p.alpha = Math.max(0, p.life);

            if (p.type === 'smoke') {
                p.radius += 0.4 * dt;
            }

            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }

        // Confetti
        for (let i = this.confetti.length - 1; i >= 0; i--) {
            const c = this.confetti[i];
            c.x += c.vx * dt;
            c.y += c.vy * dt;
            c.rot += c.vrot * dt;
            c.vx += (Math.random() - 0.5) * 0.2;

            if (c.y > 1940) {
                this.confetti.splice(i, 1);
            }
        }

        // Floating texts
        for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
            const ft = this.floatingTexts[i];
            ft.y += ft.vy * dt;
            ft.life -= ft.decay * dt;
            ft.alpha = Math.max(0, ft.life);
            ft.scale = Math.max(0.9, 1.2 * (ft.life));

            if (ft.life <= 0) {
                this.floatingTexts.splice(i, 1);
            }
        }
    }

    render(ctx) {
        // Render regular particles
        for (let i = 0; i < this.particles.length; i++) {
            const p = this.particles[i];
            ctx.save();
            ctx.fillStyle = `${p.color}${p.alpha})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        // Render confetti
        for (let i = 0; i < this.confetti.length; i++) {
            const c = this.confetti[i];
            ctx.save();
            ctx.translate(c.x, c.y);
            ctx.rotate(c.rot);
            ctx.fillStyle = c.color;
            ctx.fillRect(-c.sizeW / 2, -c.sizeH / 2, c.sizeW, c.sizeH);
            ctx.restore();
        }

        // Render floating text
        for (let i = 0; i < this.floatingTexts.length; i++) {
            const ft = this.floatingTexts[i];
            ctx.save();
            ctx.font = 'bold 36px "Segoe UI", Arial, sans-serif';
            ctx.fillStyle = ft.color;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.shadowColor = 'rgba(0,0,0,0.6)';
            ctx.shadowBlur = 8;
            ctx.globalAlpha = ft.alpha;
            ctx.fillText(ft.text, ft.x, ft.y);
            ctx.restore();
        }
    }
}

window.ParticleSystem = ParticleSystem;
