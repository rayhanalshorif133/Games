/**
 * Ball Slide - Particle System
 * Manages player trails, collision bursts, score sparks, and slow-mo snow
 */
class ParticleSystem {
    constructor() {
        this.particles = [];
        this.dustMotes = [];
        this.initDust();
    }

    initDust() {
        // Subtle ambient dust motes drifting in the arena
        for (let i = 0; i < 25; i++) {
            this.dustMotes.push({
                x: Math.random() * 1080,
                y: Math.random() * 1920,
                size: Math.random() * 4 + 2,
                speedY: Math.random() * 40 + 20,
                alpha: Math.random() * 0.25 + 0.1
            });
        }
    }

    // Player motion trail (as seen in demo.mp4 frames)
    spawnTrail(x, y, radius, color = 'rgba(82, 221, 249, 0.4)') {
        this.particles.push({
            type: 'trail',
            x: x + (Math.random() * 10 - 5),
            y: y + (Math.random() * 10 - 5),
            vx: (Math.random() - 0.5) * 15,
            vy: Math.random() * 30 + 10, // drifts down slightly relative to player
            size: radius * (Math.random() * 0.4 + 0.3),
            color: color,
            alpha: 0.35,
            decay: 0.02
        });
    }

    // Death shatter explosion
    spawnDeathExplosion(x, y, color = '#52ddf9') {
        // Main polygon debris
        for (let i = 0; i < 45; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 700 + 150;
            this.particles.push({
                type: 'shard',
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                rotation: Math.random() * Math.PI * 2,
                vrot: (Math.random() - 0.5) * 12,
                size: Math.random() * 24 + 10,
                color: color,
                alpha: 1.0,
                decay: Math.random() * 0.015 + 0.012,
                gravity: 800
            });
        }

        // Fast spark rays
        for (let i = 0; i < 60; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 1100 + 300;
            this.particles.push({
                type: 'spark',
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: Math.random() * 6 + 3,
                color: '#ffffff',
                alpha: 1.0,
                decay: Math.random() * 0.03 + 0.02,
                gravity: 400
            });
        }

        // Shockwave ring
        this.particles.push({
            type: 'ring',
            x: x,
            y: y,
            radius: 20,
            maxRadius: 280,
            color: color,
            alpha: 0.9,
            decay: 0.04
        });
    }

    // Score celebration sparks
    spawnScoreSparks(x, y) {
        for (let i = 0; i < 18; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 350 + 100;
            this.particles.push({
                type: 'spark',
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: Math.random() * 5 + 3,
                color: '#ffffff',
                alpha: 0.8,
                decay: 0.03,
                gravity: 200
            });
        }
    }

    // Snowflake pickup crystal explosion
    spawnSnowflakeBurst(x, y) {
        for (let i = 0; i < 35; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 450 + 80;
            this.particles.push({
                type: 'snow',
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: Math.random() * 12 + 6,
                rotation: Math.random() * Math.PI * 2,
                vrot: (Math.random() - 0.5) * 6,
                color: 'rgba(215, 245, 255, 0.9)',
                alpha: 1.0,
                decay: 0.015,
                gravity: 120
            });
        }
    }

    // Update particles
    update(dt, scrollSpeed = 0, isSlowMo = false) {
        // Update ambient dust
        for (const dust of this.dustMotes) {
            dust.y += (dust.speedY + scrollSpeed * 0.2) * dt;
            if (dust.y > 1920) {
                dust.y = -10;
                dust.x = Math.random() * 1080;
            }
        }

        // Extra slow-mo snow drift
        if (isSlowMo && Math.random() < 0.3) {
            this.particles.push({
                type: 'snow',
                x: Math.random() * 1080,
                y: -20,
                vx: (Math.random() - 0.5) * 60,
                vy: Math.random() * 150 + 100,
                size: Math.random() * 8 + 4,
                rotation: Math.random() * Math.PI * 2,
                vrot: (Math.random() - 0.5) * 4,
                color: 'rgba(230, 250, 255, 0.75)',
                alpha: 0.8,
                decay: 0.005,
                gravity: 30
            });
        }

        // Update active particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            
            p.alpha -= p.decay * (dt * 60);

            if (p.type === 'ring') {
                p.radius += (p.maxRadius - p.radius) * 0.15;
            } else {
                p.x += p.vx * dt;
                p.y += p.vy * dt;
                if (p.gravity) {
                    p.vy += p.gravity * dt;
                }
                if (p.vrot) {
                    p.rotation += p.vrot * dt;
                }
            }

            if (p.alpha <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    // Render all particles to canvas
    draw(ctx) {
        // Draw ambient dust
        ctx.save();
        for (const dust of this.dustMotes) {
            ctx.fillStyle = `rgba(255, 255, 255, ${dust.alpha})`;
            ctx.beginPath();
            ctx.arc(dust.x, dust.y, dust.size, 0, Math.PI * 2);
            ctx.fill();
        }

        // Draw active particles
        for (const p of this.particles) {
            ctx.globalAlpha = Math.max(0, p.alpha);

            if (p.type === 'trail') {
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
            } else if (p.type === 'shard') {
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rotation);
                ctx.fillStyle = p.color;
                ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
                ctx.restore();
            } else if (p.type === 'spark') {
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
            } else if (p.type === 'ring') {
                ctx.strokeStyle = p.color;
                ctx.lineWidth = 8 * p.alpha;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.stroke();
            } else if (p.type === 'snow') {
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rotation);
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
        }
        ctx.restore();
    }

    clear() {
        this.particles = [];
    }
}

window.ParticleSystem = ParticleSystem;

