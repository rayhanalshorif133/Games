/**
 * particles.js - Particle Systems & Visual Effects
 * Includes:
 * - Golden Stardust Trail for falling coins
 * - Radial Collision Spark Bursts on bumper/slider hits
 * - Piggy Bank Heart & Sparkle Emitters
 * - Floating Score Text Popups (+1 / +100)
 * - Victory Confetti Blast
 */

class ParticleSystem {
    constructor() {
        this.particles = [];
        this.popups = [];
        this.confetti = [];
    }

    reset() {
        this.particles = [];
        this.popups = [];
        this.confetti = [];
    }

    /**
     * Emit golden stardust trail behind a coin
     */
    emitCoinTrail(x, y, vx, vy) {
        // Emit 1-2 small shimmering golden particles
        const count = 1;
        for (let i = 0; i < count; i++) {
            const jitterX = (Math.random() - 0.5) * 8;
            const jitterY = (Math.random() - 0.5) * 8;
            this.particles.push({
                type: 'stardust',
                x: x + jitterX,
                y: y + jitterY,
                vx: -vx * 0.08 + (Math.random() - 0.5) * 30,
                vy: -vy * 0.08 + (Math.random() - 0.5) * 30,
                radius: 4 + Math.random() * 5,
                maxLife: 0.35 + Math.random() * 0.25,
                life: 0,
                color: Math.random() > 0.3 ? '#ffe066' : '#fff3bf',
                alpha: 0.85
            });
        }
    }

    /**
     * Emit radial impact sparks when a coin collides with a bumper or slider
     */
    emitCollisionSparks(x, y, nx = 0, ny = -1) {
        const count = 12 + Math.floor(Math.random() * 6);
        for (let i = 0; i < count; i++) {
            // Biased in normal direction, but spreading out
            const baseAngle = Math.atan2(ny, nx);
            const spread = (Math.random() - 0.5) * Math.PI * 1.4;
            const angle = baseAngle + spread;
            const speed = 250 + Math.random() * 550;

            this.particles.push({
                type: 'spark',
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                radius: 5 + Math.random() * 6,
                rotation: Math.random() * Math.PI * 2,
                rotSpeed: (Math.random() - 0.5) * 15,
                maxLife: 0.28 + Math.random() * 0.2,
                life: 0,
                color: Math.random() > 0.2 ? '#ffe066' : '#ffffff',
                alpha: 1.0
            });
        }
    }

    /**
     * Emit sparkles when a coin enters the piggy bank
     */
    emitPiggyCoins(x, y) {
        const count = 14;
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 180 + Math.random() * 320;
            this.particles.push({
                type: 'piggy_star',
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 120, // upward bias
                radius: 6 + Math.random() * 6,
                rotation: Math.random() * Math.PI * 2,
                rotSpeed: (Math.random() - 0.5) * 10,
                maxLife: 0.55 + Math.random() * 0.3,
                life: 0,
                color: Math.random() > 0.5 ? '#ffd43b' : (Math.random() > 0.5 ? '#ff6b6b' : '#ffffff'),
                alpha: 1.0
            });
        }
    }

    /**
     * Emit Bomb explosion with fiery sparks, smoke puffs and shockwave
     */
    emitBombExplosion(x, y) {
        // 1. Fiery Sparks
        for (let i = 0; i < 28; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 250 + Math.random() * 650;
            this.particles.push({
                type: 'spark',
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                radius: 8 + Math.random() * 8,
                rotation: Math.random() * Math.PI * 2,
                rotSpeed: (Math.random() - 0.5) * 20,
                maxLife: 0.45 + Math.random() * 0.25,
                life: 0,
                color: Math.random() > 0.4 ? '#ff3b30' : (Math.random() > 0.5 ? '#ff9500' : '#ffd60a'),
                alpha: 1.0
            });
        }

        // 2. Smoke Puffs
        for (let i = 0; i < 12; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 80 + Math.random() * 180;
            this.particles.push({
                type: 'smoke',
                x: x + (Math.random() - 0.5) * 30,
                y: y + (Math.random() - 0.5) * 30,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 60,
                radius: 18 + Math.random() * 16,
                maxLife: 0.65 + Math.random() * 0.35,
                life: 0,
                color: '#343a40',
                alpha: 0.8
            });
        }
    }

    /**
     * Emit Power-up pickup aura
     */
    emitPowerUpAura(x, y, color = '#00f2fe') {
        for (let i = 0; i < 24; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 150 + Math.random() * 400;
            this.particles.push({
                type: 'piggy_star',
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                radius: 8 + Math.random() * 8,
                rotation: Math.random() * Math.PI * 2,
                rotSpeed: (Math.random() - 0.5) * 12,
                maxLife: 0.6 + Math.random() * 0.3,
                life: 0,
                color: color,
                alpha: 1.0
            });
        }
    }

    /**
     * Floating "+1" score popup
     */
    addPopup(x, y, text = '+1', color = '#ffe066') {
        this.popups.push({
            x: x,
            y: y,
            text: text,
            vy: -140,
            life: 0,
            maxLife: 0.85,
            color: color,
            scale: 0.5
        });
    }

    /**
     * Confetti burst for Level Win
     */
    emitConfetti(width = 1080, height = 1920) {
        const colors = ['#ffd43b', '#ff6b6b', '#4dabf7', '#51cf66', '#f06595', '#ff922b', '#ffffff'];
        for (let i = 0; i < 120; i++) {
            this.confetti.push({
                x: Math.random() * width,
                y: -50 - Math.random() * 400,
                vx: (Math.random() - 0.5) * 260,
                vy: 200 + Math.random() * 400,
                w: 14 + Math.random() * 12,
                h: 22 + Math.random() * 16,
                rotation: Math.random() * Math.PI * 2,
                rotSpeed: (Math.random() - 0.5) * 8,
                color: colors[Math.floor(Math.random() * colors.length)],
                flip: Math.random() * Math.PI,
                flipSpeed: 3 + Math.random() * 5,
                alpha: 1.0,
                life: 0,
                maxLife: 3.5 + Math.random() * 1.5
            });
        }
    }

    update(dt) {
        // 1. Update general particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.life += dt;
            if (p.life >= p.maxLife) {
                this.particles.splice(i, 1);
                continue;
            }

            p.x += p.vx * dt;
            p.y += p.vy * dt;

            if (p.type === 'spark' || p.type === 'piggy_star') {
                p.vy += 600 * dt; // gravity
                p.rotation += p.rotSpeed * dt;
            }

            p.alpha = 1 - (p.life / p.maxLife);
        }

        // 2. Update popups
        for (let i = this.popups.length - 1; i >= 0; i--) {
            const popup = this.popups[i];
            popup.life += dt;
            if (popup.life >= popup.maxLife) {
                this.popups.splice(i, 1);
                continue;
            }
            popup.y += popup.vy * dt;
            popup.vy *= 0.96; // deceleration
            const progress = popup.life / popup.maxLife;
            // Pop in fast, fade out slow
            if (progress < 0.2) {
                popup.scale = 0.5 + (progress / 0.2) * 0.7; // 0.5 -> 1.2
            } else if (progress < 0.4) {
                popup.scale = 1.2 - ((progress - 0.2) / 0.2) * 0.2; // 1.2 -> 1.0
            } else {
                popup.scale = 1.0;
            }
        }

        // 3. Update confetti
        for (let i = this.confetti.length - 1; i >= 0; i--) {
            const c = this.confetti[i];
            c.life += dt;
            if (c.life >= c.maxLife) {
                this.confetti.splice(i, 1);
                continue;
            }
            c.x += c.vx * dt;
            c.y += c.vy * dt;
            c.rotation += c.rotSpeed * dt;
            c.flip += c.flipSpeed * dt;
            if (c.life > c.maxLife * 0.75) {
                c.alpha = 1 - (c.life - c.maxLife * 0.75) / (c.maxLife * 0.25);
            }
        }
    }

    render(ctx) {
        // Render particles
        for (let i = 0; i < this.particles.length; i++) {
            const p = this.particles[i];
            ctx.save();
            ctx.globalAlpha = Math.max(0, p.alpha);
            ctx.translate(p.x, p.y);

            if (p.type === 'stardust') {
                ctx.fillStyle = p.color;
                ctx.shadowColor = '#ffe066';
                ctx.shadowBlur = 10;
                ctx.beginPath();
                ctx.arc(0, 0, Math.max(0.5, p.radius * (1 - p.life / p.maxLife)), 0, Math.PI * 2);
                ctx.fill();
            } else if (p.type === 'spark') {
                ctx.rotate(p.rotation);
                ctx.fillStyle = p.color;
                ctx.shadowColor = '#ffcc00';
                ctx.shadowBlur = 12;
                // Draw 4-point diamond star
                const s = p.radius;
                ctx.beginPath();
                ctx.moveTo(0, -s * 1.5);
                ctx.lineTo(s * 0.5, -s * 0.3);
                ctx.lineTo(s * 1.5, 0);
                ctx.lineTo(s * 0.5, s * 0.3);
                ctx.lineTo(0, s * 1.5);
                ctx.lineTo(-s * 0.5, s * 0.3);
                ctx.lineTo(-s * 1.5, 0);
                ctx.lineTo(-s * 0.5, -s * 0.3);
                ctx.closePath();
                ctx.fill();
            } else if (p.type === 'piggy_star') {
                ctx.rotate(p.rotation);
                ctx.fillStyle = p.color;
                ctx.shadowColor = p.color;
                ctx.shadowBlur = 8;
                const r = p.radius;
                ctx.beginPath();
                ctx.arc(0, 0, r, 0, Math.PI * 2);
                ctx.fill();
            } else if (p.type === 'smoke') {
                ctx.fillStyle = p.color;
                ctx.shadowBlur = 0;
                const r = p.radius * (1 + (p.life / p.maxLife) * 0.8);
                ctx.beginPath();
                ctx.arc(0, 0, r, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.restore();
        }

        // Render Popups
        for (let i = 0; i < this.popups.length; i++) {
            const popup = this.popups[i];
            const progress = popup.life / popup.maxLife;
            const alpha = progress > 0.6 ? 1 - (progress - 0.6) / 0.4 : 1;

            ctx.save();
            ctx.globalAlpha = Math.max(0, alpha);
            ctx.translate(popup.x, popup.y);
            ctx.scale(popup.scale, popup.scale);

            ctx.font = '900 44px "Outfit", "Segoe UI", sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            // Text stroke
            ctx.strokeStyle = '#3e021a';
            ctx.lineWidth = 8;
            ctx.strokeText(popup.text, 0, 0);

            // Text fill
            ctx.fillStyle = popup.color;
            ctx.fillText(popup.text, 0, 0);

            ctx.restore();
        }

        // Render Confetti
        for (let i = 0; i < this.confetti.length; i++) {
            const c = this.confetti[i];
            ctx.save();
            ctx.globalAlpha = Math.max(0, c.alpha);
            ctx.translate(c.x, c.y);
            ctx.rotate(c.rotation);
            ctx.scale(1, Math.sin(c.flip));

            ctx.fillStyle = c.color;
            ctx.fillRect(-c.w / 2, -c.h / 2, c.w, c.h);

            ctx.restore();
        }
    }
}

if (typeof window !== 'undefined') {
    window.ParticleSystem = ParticleSystem;
}
