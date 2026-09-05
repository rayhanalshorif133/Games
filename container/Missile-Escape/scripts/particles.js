/**
 * particles.js - High-performance VFX and particle system
 */

export class ParticleSystem {
    constructor() {
        this.particles = [];
        this.spriteExplosions = [];
        this.floatingTexts = [];
        this.shockwaves = [];
    }

    addSmoke(x, y, vx, vy, color = 'rgba(215, 225, 240, 0.75)', startRadius = 5, endRadius = 30, life = 1.8, maxAlpha = 0.75) {
        this.particles.push({
            type: 'circle',
            x, y,
            vx, vy,
            color,
            radius: startRadius,
            startRadius,
            endRadius,
            life,
            maxLife: life,
            maxAlpha,
            alpha: maxAlpha
        });
    }

    addVapor(x, y, vx, vy, startRadius = 3, endRadius = 12, life = 0.45) {
        this.particles.push({
            type: 'circle',
            x, y,
            vx, vy,
            color: 'rgba(255, 255, 255, 0.65)',
            radius: startRadius,
            startRadius,
            endRadius,
            life,
            maxLife: life,
            alpha: 0.85
        });
    }

    addWindStreak(x, y, vx, vy) {
        this.particles.push({
            type: 'streak',
            x, y,
            vx, vy,
            color: 'rgba(255, 255, 255, 0.35)',
            length: 25 + Math.random() * 30,
            life: 0.25,
            maxLife: 0.25,
            alpha: 0.5
        });
    }

    addSpark(x, y, vx, vy, color = '#ffaa33', radius = 3, life = 0.3) {
        this.particles.push({
            type: 'spark',
            x, y,
            vx, vy,
            color,
            radius,
            life,
            maxLife: life,
            alpha: 1
        });
    }

    addFlareSpark(x, y) {
        for (let i = 0; i < 3; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 20 + Math.random() * 80;
            this.addSpark(
                x, y,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                Math.random() > 0.4 ? '#ffffff' : '#ff7700',
                2 + Math.random() * 3,
                0.4 + Math.random() * 0.3
            );
        }
    }

    addExplosion(x, y, isBig = false, image = null) {
        // Sprite animation
        this.spriteExplosions.push({
            x, y,
            image,
            isBig,
            totalFrames: 9,
            frameWidth: isBig ? 210 : 140,
            frameHeight: isBig ? 210 : 140,
            currentFrame: 0,
            frameTimer: 0,
            frameDuration: 0.045, // ~22 fps
            rotation: Math.random() * Math.PI * 2,
            scale: isBig ? 1.5 : 1.1
        });

        // Add blast sparks
        const sparkCount = isBig ? 24 : 14;
        for (let i = 0; i < sparkCount; i++) {
            const angle = (Math.PI * 2 * i) / sparkCount + (Math.random() * 0.3);
            const speed = (isBig ? 140 : 90) + Math.random() * 150;
            this.addSpark(
                x, y,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                Math.random() > 0.5 ? '#ffcc00' : '#ff4400',
                3 + Math.random() * 3,
                0.4 + Math.random() * 0.4
            );
        }

        // Add shockwave ring
        this.addShockwave(x, y, isBig ? 180 : 100, isBig ? 0.6 : 0.4, '#ff9900');
    }

    addShockwave(x, y, maxRadius = 120, duration = 0.5, color = '#00e5ff') {
        this.shockwaves.push({
            x, y,
            radius: 5,
            maxRadius,
            duration,
            timer: 0,
            color
        });
    }

    addFloatingText(text, x, y, color = '#ffff00', fontSize = 22) {
        this.floatingTexts.push({
            text,
            x, y,
            color,
            fontSize,
            vy: -45,
            alpha: 1,
            life: 0.85,
            maxLife: 0.85
        });
    }

    addCelebrationBurst(x, y) {
        const colors = ['#ffd700', '#ff00aa', '#00f0ff', '#00ff88', '#ffffff'];
        for (let i = 0; i < 20; i++) {
            const angle = (Math.PI * 2 * i) / 20 + (Math.random() - 0.5) * 0.4;
            const speed = 120 + Math.random() * 160;
            const col = colors[Math.floor(Math.random() * colors.length)];
            this.addSpark(
                x, y,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                col,
                4 + Math.random() * 4,
                0.6 + Math.random() * 0.4
            );
        }
        this.addShockwave(x, y, 160, 0.5, '#ffd700');
    }

    update(dt) {
        // Update particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.life -= dt;
            if (p.life <= 0) {
                this.particles.splice(i, 1);
                continue;
            }

            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.vx *= 0.96;
            p.vy *= 0.96;

            const progress = 1 - (p.life / p.maxLife);
            if (p.type === 'circle') {
                p.radius = p.startRadius + (p.endRadius - p.startRadius) * Math.pow(progress, 0.65);
                const baseAlpha = p.maxAlpha !== undefined ? p.maxAlpha : 1.0;
                p.alpha = Math.max(0, baseAlpha * (1 - progress));
            } else {
                p.alpha = Math.max(0, p.life / p.maxLife);
            }
        }

        // Update sprite explosions
        for (let i = this.spriteExplosions.length - 1; i >= 0; i--) {
            const exp = this.spriteExplosions[i];
            exp.frameTimer += dt;
            if (exp.frameTimer >= exp.frameDuration) {
                exp.frameTimer = 0;
                exp.currentFrame++;
                if (exp.currentFrame >= exp.totalFrames) {
                    this.spriteExplosions.splice(i, 1);
                }
            }
        }

        // Update shockwaves
        for (let i = this.shockwaves.length - 1; i >= 0; i--) {
            const sw = this.shockwaves[i];
            sw.timer += dt;
            if (sw.timer >= sw.duration) {
                this.shockwaves.splice(i, 1);
                continue;
            }
            const progress = sw.timer / sw.duration;
            sw.radius = sw.maxRadius * Math.sin(progress * Math.PI * 0.5);
            sw.alpha = 1 - progress;
        }

        // Update floating texts
        for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
            const ft = this.floatingTexts[i];
            ft.life -= dt;
            if (ft.life <= 0) {
                this.floatingTexts.splice(i, 1);
                continue;
            }
            ft.y += ft.vy * dt;
            ft.alpha = ft.life / ft.maxLife;
        }
    }

    render(ctx) {
        // Render shockwaves
        for (const sw of this.shockwaves) {
            ctx.save();
            ctx.strokeStyle = sw.color;
            ctx.globalAlpha = sw.alpha * 0.8;
            ctx.lineWidth = 4 * (1 - sw.timer / sw.duration) + 1;
            ctx.beginPath();
            ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }

        // Render particles
        for (const p of this.particles) {
            ctx.save();
            ctx.globalAlpha = p.alpha;
            if (p.type === 'streak') {
                ctx.strokeStyle = p.color;
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.moveTo(p.x, p.y);
                const angle = Math.atan2(p.vy, p.vx);
                ctx.lineTo(p.x - Math.cos(angle) * p.length, p.y - Math.sin(angle) * p.length);
                ctx.stroke();
            } else {
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, Math.max(1, p.radius), 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        }

        // Render sprite explosions
        for (const exp of this.spriteExplosions) {
            if (!exp.image || !exp.image.complete) continue;
            ctx.save();
            ctx.translate(exp.x, exp.y);
            ctx.rotate(exp.rotation);
            ctx.scale(exp.scale, exp.scale);

            const sx = exp.currentFrame * exp.frameWidth;
            const sy = 0;
            const sw = exp.frameWidth;
            const sh = exp.frameHeight;
            const dw = exp.frameWidth;
            const dh = exp.frameHeight;

            ctx.drawImage(
                exp.image,
                sx, sy, sw, sh,
                -dw / 2, -dh / 2, dw, dh
            );
            ctx.restore();
        }

        // Render floating texts
        for (const ft of this.floatingTexts) {
            ctx.save();
            ctx.globalAlpha = ft.alpha;
            ctx.font = `900 ${ft.fontSize}px 'Segoe UI', Tahoma, sans-serif`;
            ctx.fillStyle = ft.color;
            ctx.textAlign = 'center';
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 4;
            ctx.strokeText(ft.text, ft.x, ft.y);
            ctx.fillText(ft.text, ft.x, ft.y);
            ctx.restore();
        }
    }

    clear() {
        this.particles = [];
        this.spriteExplosions = [];
        this.floatingTexts = [];
        this.shockwaves = [];
    }
}

