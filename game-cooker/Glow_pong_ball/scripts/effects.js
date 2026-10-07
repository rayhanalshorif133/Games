/**
 * Glow Air Hockey / Glow Pong Ball - Visual FX System
 * Puck Trails, Particle Bursts, Wall LEDs, Screen Shake & Animated "GOAL!" Banner
 */

class EffectsManager {
    constructor(tableConfig) {
        this.config = tableConfig;
        this.particles = [];
        this.puckTrail = [];
        this.leds = [];
        this.shakeTimer = 0;
        this.shakeIntensity = 0;
        this.shakeX = 0;
        this.shakeY = 0;

        // Goal celebration state
        this.goalAnim = {
            active: false,
            timer: 0,
            scale: 0,
            rotation: 0,
            alpha: 0,
            scorer: null
        };

        this.initLeds();
    }

    initLeds() {
        const court = this.config.court;
        const fx0 = 70, fy0 = 160, fx1 = 1010, fy1 = 1760;
        const cx0 = court.left, cy0 = court.top, cx1 = court.right, cy1 = court.bottom;

        // Left rail (13 bolts)
        for (let i = 0; i < 13; i++) {
            const y = cy0 + 20 + i * ((cy1 - 40 - cy0) / 12);
            this.leds.push({ x: (fx0 + cx0) / 2, y, alpha: 0, color: 'blue' });
        }
        // Right rail (13 bolts)
        for (let i = 0; i < 13; i++) {
            const y = cy0 + 20 + i * ((cy1 - 40 - cy0) / 12);
            this.leds.push({ x: (fx1 + cx1) / 2, y, alpha: 0, color: 'blue' });
        }
        // Top rail (8 bolts)
        const topXs = [100, 180, 260, 320, 760, 820, 900, 980];
        topXs.forEach(x => {
            this.leds.push({ x, y: (fy0 + cy0) / 2, alpha: 0, color: 'red' });
        });
        // Bottom rail (8 bolts)
        topXs.forEach(x => {
            this.leds.push({ x, y: (fy1 + cy1) / 2, alpha: 0, color: 'blue' });
        });
    }

    triggerWallLed(hitX, hitY, color = 'blue') {
        let closest = null;
        let minDistSq = Infinity;
        for (const led of this.leds) {
            const dSq = (led.x - hitX) ** 2 + (led.y - hitY) ** 2;
            if (dSq < minDistSq) {
                minDistSq = dSq;
                closest = led;
            }
        }
        if (closest) {
            closest.alpha = 1.0;
            closest.color = color;
        }
    }

    triggerGoalLeds(goalSide) {
        // Flash all LEDs near the goal
        for (const led of this.leds) {
            if (goalSide === 'top' && led.y < 500) {
                led.alpha = 1.0;
                led.color = 'red';
            } else if (goalSide === 'bottom' && led.y > 1400) {
                led.alpha = 1.0;
                led.color = 'blue';
            }
        }
    }

    addSparks(x, y, count = 12, color = '#ff3bf0') {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 120 + Math.random() * 450;
            this.particles.push({
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 3 + Math.random() * 6,
                alpha: 1.0,
                decay: 1.8 + Math.random() * 2.5,
                color
            });
        }
    }

    triggerScreenShake(intensity = 16, duration = 0.45) {
        this.shakeIntensity = intensity;
        this.shakeTimer = duration;
    }

    startGoalAnimation(scorer) {
        this.goalAnim.active = true;
        this.goalAnim.timer = 0;
        this.goalAnim.scale = 0.1;
        this.goalAnim.rotation = -0.35;
        this.goalAnim.alpha = 0;
        this.goalAnim.scorer = scorer;

        this.triggerScreenShake(20, 0.6);
        this.triggerGoalLeds(scorer === 'player' ? 'top' : 'bottom');

        // Confetti neon sparks in center
        this.addSparks(540, 960, 40, scorer === 'player' ? '#00e5ff' : '#ff2255');
    }

    update(dt, puck) {
        // 1. Puck Trail
        if (puck && puck.active) {
            const speed = Math.hypot(puck.vx, puck.vy);
            if (speed > 150) {
                this.puckTrail.unshift({ x: puck.x, y: puck.y, alpha: 0.7, r: this.config.puckRadius });
            }
        }
        for (let i = this.puckTrail.length - 1; i >= 0; i--) {
            const t = this.puckTrail[i];
            t.alpha -= dt * 3.5;
            if (t.alpha <= 0) {
                this.puckTrail.splice(i, 1);
            }
        }

        // 2. Particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.vx *= 0.95;
            p.vy *= 0.95;
            p.alpha -= p.decay * dt;
            if (p.alpha <= 0) {
                this.particles.splice(i, 1);
            }
        }

        // 3. Wall LEDs fade
        for (const led of this.leds) {
            if (led.alpha > 0) {
                led.alpha = Math.max(0, led.alpha - dt * 2.2);
            }
        }

        // 4. Screen Shake
        if (this.shakeTimer > 0) {
            this.shakeTimer -= dt;
            const progress = this.shakeTimer / 0.45;
            const currentInt = this.shakeIntensity * Math.max(0, progress);
            this.shakeX = (Math.random() - 0.5) * currentInt * 2;
            this.shakeY = (Math.random() - 0.5) * currentInt * 2;
        } else {
            this.shakeX = 0;
            this.shakeY = 0;
        }

        // 5. Goal Banner Animation
        if (this.goalAnim.active) {
            this.goalAnim.timer += dt;
            const t = this.goalAnim.timer;

            if (t < 0.35) {
                // Zoom in with spring ease
                const progress = t / 0.35;
                this.goalAnim.scale = 0.1 + 1.1 * Math.sin(progress * Math.PI * 0.5);
                this.goalAnim.rotation = -0.35 * (1.0 - progress);
                this.goalAnim.alpha = Math.min(1.0, progress * 2.5);
            } else if (t < 1.4) {
                // Gentle floating neon pulse
                this.goalAnim.scale = 1.0 + 0.05 * Math.sin((t - 0.35) * 8);
                this.goalAnim.rotation = 0;
                this.goalAnim.alpha = 1.0;
            } else if (t < 1.8) {
                // Fade out
                const fadeProgress = (t - 1.4) / 0.4;
                this.goalAnim.alpha = Math.max(0, 1.0 - fadeProgress);
                this.goalAnim.scale = 1.0 + fadeProgress * 0.3;
            } else {
                this.goalAnim.active = false;
            }
        }
    }

    render(ctx, assets) {
        // Render Wall LEDs
        for (const led of this.leds) {
            if (led.alpha > 0.01) {
                ctx.save();
                ctx.globalAlpha = led.alpha;
                const ledSprite = led.color === 'red' ? assets.ledRed : assets.ledBlue;
                if (ledSprite) {
                    const s = 64;
                    ctx.drawImage(ledSprite, led.x - s / 2, led.y - s / 2, s, s);
                } else {
                    ctx.fillStyle = led.color === 'red' ? '#ff2244' : '#00d0ff';
                    ctx.beginPath();
                    ctx.arc(led.x, led.y, 14, 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.restore();
            }
        }

        // Render Puck Trail
        for (const t of this.puckTrail) {
            ctx.save();
            ctx.globalAlpha = t.alpha * 0.35;
            ctx.fillStyle = '#ff26c8';
            ctx.beginPath();
            ctx.arc(t.x, t.y, t.r * 0.9, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        // Render Particles
        for (const p of this.particles) {
            ctx.save();
            ctx.globalAlpha = Math.max(0, p.alpha);
            ctx.fillStyle = p.color;
            ctx.shadowColor = p.color;
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        // Render "GOAL!" Banner
        if (this.goalAnim.active && this.goalAnim.alpha > 0.01) {
            ctx.save();
            ctx.translate(540, 960);
            ctx.rotate(this.goalAnim.rotation);
            ctx.scale(this.goalAnim.scale, this.goalAnim.scale);
            ctx.globalAlpha = this.goalAnim.alpha;

            if (assets.goalBanner) {
                const bw = 720;
                const bh = 240;
                ctx.drawImage(assets.goalBanner, -bw / 2, -bh / 2, bw, bh);
            }
            ctx.restore();
        }
    }
}

window.EffectsManager = EffectsManager;

