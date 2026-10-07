/**
 * Particle and Visual Effects Engine for Choice Side
 * Handles juice splatters, apple halves physics, slash sparks, screen shake, and floating text
 */

'use strict';

class ParticleSystem {
    constructor() {
        this.particles = [];
        this.slicedHalves = [];
        this.floatingTexts = [];
        this.shakeTime = 0;
        this.shakeIntensity = 0;
        this.flashAlpha = 0;
        this.slashArcs = [];
    }

    reset() {
        this.particles = [];
        this.slicedHalves = [];
        this.floatingTexts = [];
        this.shakeTime = 0;
        this.shakeIntensity = 0;
        this.flashAlpha = 0;
        this.slashArcs = [];
    }

    shake(intensity = 20, duration = 0.3) {
        this.shakeIntensity = intensity;
        this.shakeTime = duration;
    }

    flashRed(alpha = 0.6) {
        this.flashAlpha = alpha;
    }

    // Add Katana Slash Arc effect
    addSlashArc(x1, y1, x2, y2) {
        this.slashArcs.push({
            x1, y1, x2, y2,
            life: 0.18,
            maxLife: 0.18,
            width: 14
        });
    }

    // Fruit Ninja style sliced apple halves flying apart
    addAppleSliceEffect(x, y, colorType, leftImg, rightImg) {
        const speedX = 420;
        const speedY = -280;

        // Left half flings left and downward
        this.slicedHalves.push({
            x: x - 20,
            y: y,
            vx: -speedX + (Math.random() * 80 - 40),
            vy: speedY + (Math.random() * 80 - 40),
            rot: 0,
            vRot: -6.5,
            img: leftImg,
            scale: 1.1,
            life: 1.2
        });

        // Right half flings right and downward
        this.slicedHalves.push({
            x: x + 20,
            y: y,
            vx: speedX + (Math.random() * 80 - 40),
            vy: speedY + (Math.random() * 80 - 40),
            rot: 0,
            vRot: 6.5,
            img: rightImg,
            scale: 1.1,
            life: 1.2
        });

        // Burst juicy fruit pulp droplets
        const colors = colorType === 'green' ? 
            ['#22c55e', '#86efac', '#4ade80', '#ffffff'] :
            (colorType === 'yellow' ? ['#eab308', '#fef08a', '#facc15', '#ffffff'] : ['#be185d', '#f472b6', '#db2777', '#ffffff']);

        for (let i = 0; i < 24; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 250 + Math.random() * 450;
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                color: colors[Math.floor(Math.random() * colors.length)],
                size: 6 + Math.random() * 10,
                life: 0.6 + Math.random() * 0.4,
                maxLife: 1.0,
                gravity: 800
            });
        }

        // Floating "+1" score popup
        this.addFloatingText(x, y - 40, '+1', '#fef08a');
    }

    // Heart collected sparkle effect
    addHeartCollectEffect(x, y) {
        for (let i = 0; i < 25; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 200 + Math.random() * 400;
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 150,
                color: Math.random() > 0.3 ? '#ef4444' : '#ffffff',
                size: 8 + Math.random() * 8,
                life: 0.7 + Math.random() * 0.3,
                maxLife: 1.0,
                gravity: 400
            });
        }
        this.addFloatingText(x, y - 50, '+1 LIFE', '#f87171');
    }

    // Sparks from saw blade or hit
    addHitSparks(x, y) {
        for (let i = 0; i < 30; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 300 + Math.random() * 550;
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                color: Math.random() > 0.5 ? '#f59e0b' : '#ef4444',
                size: 5 + Math.random() * 8,
                life: 0.4 + Math.random() * 0.3,
                maxLife: 0.7,
                gravity: 900
            });
        }
    }

    // Foot dust while climbing cliff
    addFootDust(x, y, isRightWall) {
        this.particles.push({
            x: x,
            y: y,
            vx: (isRightWall ? -1 : 1) * (40 + Math.random() * 60),
            vy: 60 + Math.random() * 80,
            color: '#a16207',
            size: 6 + Math.random() * 6,
            life: 0.35,
            maxLife: 0.35,
            gravity: 200
        });
    }

    // Floating text indicator
    addFloatingText(x, y, text, color) {
        this.floatingTexts.push({
            x, y, text, color,
            vy: -140,
            life: 0.9,
            maxLife: 0.9
        });
    }

    update(dt) {
        // Screen shake decay
        if (this.shakeTime > 0) {
            this.shakeTime -= dt;
            if (this.shakeTime <= 0) {
                this.shakeIntensity = 0;
            }
        }

        // Red flash decay
        if (this.flashAlpha > 0) {
            this.flashAlpha = Math.max(0, this.flashAlpha - dt * 2.2);
        }

        // Update slash arcs
        for (let i = this.slashArcs.length - 1; i >= 0; i--) {
            const arc = this.slashArcs[i];
            arc.life -= dt;
            if (arc.life <= 0) this.slashArcs.splice(i, 1);
        }

        // Update particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.vy += (p.gravity || 600) * dt;
            p.life -= dt;
            if (p.life <= 0) this.particles.splice(i, 1);
        }

        // Update sliced apple halves
        for (let i = this.slicedHalves.length - 1; i >= 0; i--) {
            const s = this.slicedHalves[i];
            s.x += s.vx * dt;
            s.y += s.vy * dt;
            s.vy += 1200 * dt; // gravity
            s.rot += s.vRot * dt;
            s.life -= dt;
            if (s.life <= 0 || s.y > 2000) this.slicedHalves.splice(i, 1);
        }

        // Update floating texts
        for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
            const t = this.floatingTexts[i];
            t.y += t.vy * dt;
            t.life -= dt;
            if (t.life <= 0) this.floatingTexts.splice(i, 1);
        }
    }

    draw(ctx) {
        ctx.save();

        // 1. Draw Slash Arcs
        for (const arc of this.slashArcs) {
            const alpha = arc.life / arc.maxLife;
            ctx.save();
            ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.lineWidth = arc.width * alpha;
            ctx.lineCap = 'round';
            ctx.shadowColor = '#38bdf8';
            ctx.shadowBlur = 15;
            ctx.beginPath();
            ctx.moveTo(arc.x1, arc.y1);
            ctx.quadraticCurveTo((arc.x1 + arc.x2) / 2, (arc.y1 + arc.y2) / 2 - 40, arc.x2, arc.y2);
            ctx.stroke();
            ctx.restore();
        }

        // 2. Draw Sliced Apple Halves
        for (const s of this.slicedHalves) {
            ctx.save();
            ctx.translate(s.x, s.y);
            ctx.rotate(s.rot);
            const alpha = Math.min(1.0, s.life * 2);
            ctx.globalAlpha = alpha;
            if (s.img && s.img.complete) {
                const w = s.img.width * s.scale;
                const h = s.img.height * s.scale;
                ctx.drawImage(s.img, -w / 2, -h / 2, w, h);
            }
            ctx.restore();
        }

        // 3. Draw Particles
        for (const p of this.particles) {
            const alpha = Math.max(0, p.life / p.maxLife);
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * (0.4 + 0.6 * alpha), 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        // 4. Draw Floating Texts
        for (const t of this.floatingTexts) {
            const alpha = Math.max(0, t.life / t.maxLife);
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.font = 'bold 48px "Lilita One", sans-serif';
            ctx.fillStyle = t.color;
            ctx.textAlign = 'center';
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 6;
            ctx.strokeText(t.text, t.x, t.y);
            ctx.fillText(t.text, t.x, t.y);
            ctx.restore();
        }

        ctx.restore();
    }

    // Screen Shake Offset applied to camera
    getShakeOffset() {
        if (this.shakeTime <= 0) return { x: 0, y: 0 };
        return {
            x: (Math.random() * 2 - 1) * this.shakeIntensity,
            y: (Math.random() * 2 - 1) * this.shakeIntensity
        };
    }
}

window.ParticleSystem = ParticleSystem;

