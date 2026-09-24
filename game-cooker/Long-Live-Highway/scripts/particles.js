/**
 * Particle & Visual Effects System
 * Manages tire marks, exhaust puffs, sparks, speed lines, and ambient dust triangles.
 */

class ParticleSystem {
    constructor() {
        this.particles = [];
        this.skidMarks = [];
        this.dustTriangles = [];
        this.initDustTriangles();
    }

    initDustTriangles() {
        // Little triangular leaves / dust flakes blowing past as seen in demo.gif
        for (let i = 0; i < 40; i++) {
            this.dustTriangles.push({
                x: MathUtils.randRange(20, 1060),
                y: MathUtils.randRange(0, 1920),
                size: MathUtils.randRange(8, 16),
                angle: MathUtils.randRange(0, Math.PI * 2),
                rotSpeed: MathUtils.randRange(-0.02, 0.02),
                speedY: MathUtils.randRange(1.2, 2.5),
                speedX: MathUtils.randRange(-0.3, 0.3),
                alpha: MathUtils.randRange(0.4, 0.8),
                color: MathUtils.randChoice(['#e9d37c', '#fcf1b6', '#b9a731', '#f0f4f8'])
            });
        }
    }

    addExhaust(x, y, speed, isNitro) {
        const count = isNitro ? 3 : 1;
        for (let i = 0; i < count; i++) {
            this.particles.push({
                type: isNitro ? 'nitro' : 'exhaust',
                x: x + MathUtils.randRange(-4, 4),
                y: y + MathUtils.randRange(0, 6),
                vx: MathUtils.randRange(-0.8, 0.8),
                vy: MathUtils.randRange(2, 6) + (speed * 0.02),
                radius: isNitro ? MathUtils.randRange(8, 16) : MathUtils.randRange(6, 12),
                maxRadius: isNitro ? 26 : 22,
                alpha: isNitro ? 0.9 : 0.45,
                decay: isNitro ? 0.04 : 0.025,
                color: isNitro ? MathUtils.randChoice(['#00f0ff', '#00b4d8', '#ffffff']) : '#c8c0a8'
            });
        }
    }

    addSkidMark(leftWheel, rightWheel) {
        this.skidMarks.push({
            x1: leftWheel.x,
            y1: leftWheel.y,
            x2: rightWheel.x,
            y2: rightWheel.y,
            alpha: 0.6,
            width: 8
        });
        if (this.skidMarks.length > 200) {
            this.skidMarks.shift();
        }
    }

    addSparks(x, y, count = 15) {
        for (let i = 0; i < count; i++) {
            const angle = MathUtils.randRange(0, Math.PI * 2);
            const spd = MathUtils.randRange(4, 14);
            this.particles.push({
                type: 'spark',
                x: x,
                y: y,
                vx: Math.cos(angle) * spd,
                vy: Math.sin(angle) * spd,
                radius: MathUtils.randRange(3, 7),
                alpha: 1.0,
                decay: MathUtils.randRange(0.03, 0.06),
                color: MathUtils.randChoice(['#ffbe0b', '#fb5607', '#ff006e', '#ffffff'])
            });
        }
    }

    addScorePopup(x, y, text, color = '#ffd166') {
        this.particles.push({
            type: 'text',
            text: text,
            x: x,
            y: y,
            vy: -2.5,
            alpha: 1.0,
            decay: 0.02,
            color: color,
            scale: 1.0
        });
    }

    update(roadScrollSpeed) {
        // Update Skid marks (scroll down with road)
        for (let i = this.skidMarks.length - 1; i >= 0; i--) {
            const mark = this.skidMarks[i];
            mark.y1 += roadScrollSpeed;
            mark.y2 += roadScrollSpeed;
            mark.alpha -= 0.0015;
            if (mark.y1 > 1950 || mark.alpha <= 0) {
                this.skidMarks.splice(i, 1);
            }
        }

        // Update Particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += (p.vx || 0);
            p.y += (p.vy || 0) + (roadScrollSpeed * 0.3);
            p.alpha -= p.decay;

            if (p.radius !== undefined && p.maxRadius !== undefined) {
                p.radius = MathUtils.lerp(p.radius, p.maxRadius, 0.08);
            }

            if (p.alpha <= 0 || p.y > 1950) {
                this.particles.splice(i, 1);
            }
        }

        // Update Dust Triangles
        for (const d of this.dustTriangles) {
            d.y += d.speedY + (roadScrollSpeed * 0.15);
            d.x += d.speedX;
            d.angle += d.rotSpeed;

            if (d.y > 1950) {
                d.y = -20;
                d.x = MathUtils.randRange(20, 1060);
            }
            if (d.x < 0) d.x = 1080;
            if (d.x > 1080) d.x = 0;
        }
    }

    drawSkids(ctx) {
        ctx.save();
        for (const mark of this.skidMarks) {
            ctx.fillStyle = `rgba(50, 45, 35, ${mark.alpha})`;
            // Left wheel mark
            ctx.fillRect(mark.x1 - mark.width / 2, mark.y1, mark.width, 16);
            // Right wheel mark
            ctx.fillRect(mark.x2 - mark.width / 2, mark.y2, mark.width, 16);
        }
        ctx.restore();
    }

    drawParticles(ctx) {
        ctx.save();
        for (const p of this.particles) {
            ctx.globalAlpha = Math.max(0, p.alpha);
            if (p.type === 'text') {
                ctx.font = 'bold 36px "Segoe UI", Arial, sans-serif';
                ctx.fillStyle = p.color;
                ctx.strokeStyle = '#2b2d42';
                ctx.lineWidth = 4;
                ctx.textAlign = 'center';
                ctx.strokeText(p.text, p.x, p.y);
                ctx.fillText(p.text, p.x, p.y);
            } else {
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // Draw ambient dust triangles
        for (const d of this.dustTriangles) {
            ctx.globalAlpha = d.alpha;
            ctx.fillStyle = d.color;
            ctx.save();
            ctx.translate(d.x, d.y);
            ctx.rotate(d.angle);
            ctx.beginPath();
            ctx.moveTo(0, -d.size);
            ctx.lineTo(d.size * 0.8, d.size * 0.8);
            ctx.lineTo(-d.size * 0.8, d.size * 0.8);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        }

        ctx.restore();
    }
}

window.ParticleSystem = ParticleSystem;
