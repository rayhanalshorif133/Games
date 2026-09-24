/**
 * Particle & Visual Effects System
 * Manages tire marks, exhaust puffs, sparks, speed lines, ambient dust triangles,
 * realistic car crash explosions, flying coin animations, nitro ram blasts, and shield deflections.
 */

class ParticleSystem {
    constructor() {
        this.particles = [];
        this.skidMarks = [];
        this.dustTriangles = [];
        this.flyingCoins = [];
        this.explosions = [];
        this.initDustTriangles();
    }

    initDustTriangles() {
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
                vx: MathUtils.randRange(-1.2, 1.2),
                vy: MathUtils.randRange(3, 8) + (speed * 0.03),
                radius: isNitro ? MathUtils.randRange(12, 22) : MathUtils.randRange(6, 12),
                maxRadius: isNitro ? 36 : 22,
                alpha: isNitro ? 0.95 : 0.45,
                decay: isNitro ? 0.035 : 0.025,
                color: isNitro ? MathUtils.randChoice(['#00f0ff', '#38b6ff', '#ffffff', '#70e0d0']) : '#c8c0a8'
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

    addSparks(x, y, count = 20) {
        for (let i = 0; i < count; i++) {
            const angle = MathUtils.randRange(0, Math.PI * 2);
            const spd = MathUtils.randRange(5, 18);
            this.particles.push({
                type: 'spark',
                x: x,
                y: y,
                vx: Math.cos(angle) * spd,
                vy: Math.sin(angle) * spd,
                radius: MathUtils.randRange(4, 9),
                alpha: 1.0,
                decay: MathUtils.randRange(0.025, 0.05),
                color: MathUtils.randChoice(['#ffbe0b', '#fb5607', '#ff006e', '#ffffff', '#ffd166'])
            });
        }
    }

    addCarExplosion(x, y) {
        // Shockwave rings
        this.explosions.push({
            x: x,
            y: y,
            radius: 10,
            maxRadius: 190,
            alpha: 1.0,
            color: 'rgba(255, 243, 176, 0.35)',
            strokeColor: '#e76f51',
            lineWidth: 18
        });

        // High velocity fireball sparks
        for (let i = 0; i < 50; i++) {
            const angle = MathUtils.randRange(0, Math.PI * 2);
            const spd = MathUtils.randRange(6, 26);
            this.particles.push({
                type: 'spark',
                x: x + MathUtils.randRange(-20, 20),
                y: y + MathUtils.randRange(-20, 20),
                vx: Math.cos(angle) * spd,
                vy: Math.sin(angle) * spd,
                radius: MathUtils.randRange(6, 16),
                alpha: 1.0,
                decay: MathUtils.randRange(0.02, 0.04),
                color: MathUtils.randChoice(['#ff0055', '#ff5400', '#ffbd00', '#ffffff', '#ffeaa7'])
            });
        }

        // Thick fiery smoke clouds
        for (let i = 0; i < 35; i++) {
            const angle = MathUtils.randRange(0, Math.PI * 2);
            const spd = MathUtils.randRange(2, 10);
            this.particles.push({
                type: 'smoke',
                x: x + MathUtils.randRange(-30, 30),
                y: y + MathUtils.randRange(-30, 30),
                vx: Math.cos(angle) * spd,
                vy: Math.sin(angle) * spd - 3,
                radius: MathUtils.randRange(16, 32),
                maxRadius: MathUtils.randRange(60, 110),
                alpha: 0.85,
                decay: 0.018,
                color: MathUtils.randChoice(['#2b2d42', '#3a0ca3', '#4a4e69', '#1a1a24', '#ff7b00'])
            });
        }

        // Mechanical debris fragments
        for (let i = 0; i < 16; i++) {
            const angle = MathUtils.randRange(0, Math.PI * 2);
            const spd = MathUtils.randRange(8, 22);
            this.particles.push({
                type: 'debris',
                x: x,
                y: y,
                vx: Math.cos(angle) * spd,
                vy: Math.sin(angle) * spd - 6,
                angle: Math.random() * Math.PI * 2,
                spinSpeed: MathUtils.randRange(-0.25, 0.25),
                size: MathUtils.randRange(10, 22),
                alpha: 1.0,
                decay: 0.015,
                color: MathUtils.randChoice(['#1a1a1a', '#e63946', '#4a4a4a', '#8d99ae'])
            });
        }
    }

    addNitroRamBlast(x, y) {
        // Dual expanding shockwaves (Electric Cyan + Golden Amber)
        this.explosions.push({
            x: x,
            y: y,
            radius: 12,
            maxRadius: 220,
            alpha: 1.0,
            color: 'rgba(0, 240, 255, 0.3)',
            strokeColor: '#00f0ff',
            lineWidth: 24
        });
        this.explosions.push({
            x: x,
            y: y,
            radius: 8,
            maxRadius: 150,
            alpha: 1.0,
            color: 'rgba(255, 190, 11, 0.35)',
            strokeColor: '#fb5607',
            lineWidth: 18
        });

        // Electric blue lightning sparks + fireball sparks
        for (let i = 0; i < 48; i++) {
            const angle = MathUtils.randRange(0, Math.PI * 2);
            const spd = MathUtils.randRange(8, 30);
            this.particles.push({
                type: 'spark',
                x: x,
                y: y,
                vx: Math.cos(angle) * spd,
                vy: Math.sin(angle) * spd,
                radius: MathUtils.randRange(5, 14),
                alpha: 1.0,
                decay: MathUtils.randRange(0.02, 0.045),
                color: MathUtils.randChoice(['#00f0ff', '#38b6ff', '#ffbe0b', '#fb5607', '#ffffff'])
            });
        }

        // Flying detached tires/wheels!
        for (let i = 0; i < 4; i++) {
            const angle = MathUtils.randRange(0, Math.PI * 2);
            const spd = MathUtils.randRange(10, 24);
            this.particles.push({
                type: 'tire',
                x: x,
                y: y,
                vx: Math.cos(angle) * spd,
                vy: Math.sin(angle) * spd - 6,
                angle: Math.random() * Math.PI * 2,
                spinSpeed: MathUtils.randRange(-0.35, 0.35),
                size: MathUtils.randRange(14, 20),
                alpha: 1.0,
                decay: 0.012
            });
        }

        // Fiery smoke clouds
        for (let i = 0; i < 28; i++) {
            const angle = MathUtils.randRange(0, Math.PI * 2);
            const spd = MathUtils.randRange(3, 12);
            this.particles.push({
                type: 'smoke',
                x: x + MathUtils.randRange(-25, 25),
                y: y + MathUtils.randRange(-25, 25),
                vx: Math.cos(angle) * spd,
                vy: Math.sin(angle) * spd - 2,
                radius: MathUtils.randRange(20, 38),
                maxRadius: 85,
                alpha: 0.9,
                decay: 0.02,
                color: MathUtils.randChoice(['#0077b6', '#ff5400', '#2b2d42', '#1a1a24'])
            });
        }
    }

    addShieldDeflectBlast(x, y) {
        // Holographic forcefield shockwaves
        this.explosions.push({
            x: x,
            y: y,
            radius: 15,
            maxRadius: 180,
            alpha: 1.0,
            color: 'rgba(0, 240, 255, 0.35)',
            strokeColor: '#48cae4',
            lineWidth: 20
        });
        this.explosions.push({
            x: x,
            y: y,
            radius: 8,
            maxRadius: 120,
            alpha: 1.0,
            color: 'rgba(247, 37, 133, 0.35)',
            strokeColor: '#f72585',
            lineWidth: 14
        });

        // Electric crystal sparks
        for (let i = 0; i < 35; i++) {
            const angle = MathUtils.randRange(0, Math.PI * 2);
            const spd = MathUtils.randRange(6, 24);
            this.particles.push({
                type: 'spark',
                x: x,
                y: y,
                vx: Math.cos(angle) * spd,
                vy: Math.sin(angle) * spd,
                radius: MathUtils.randRange(4, 10),
                alpha: 1.0,
                decay: MathUtils.randRange(0.025, 0.05),
                color: MathUtils.randChoice(['#48cae4', '#00f0ff', '#f72585', '#7209b7', '#ffffff'])
            });
        }
    }

    addFlyingCoin(startX, startY, targetX = 180, targetY = 68, onArrival = null) {
        const cpX = startX + (targetX - startX) * 0.25 - 80;
        const cpY = Math.min(startY, targetY) - 120;

        this.flyingCoins.push({
            startX: startX,
            startY: startY,
            cpX: cpX,
            cpY: cpY,
            targetX: targetX,
            targetY: targetY,
            x: startX,
            y: startY,
            progress: 0,
            speed: 0.038,
            spin: 0,
            scale: 1.2,
            onArrival: onArrival
        });
    }

    addScorePopup(x, y, text, color = '#ffd166') {
        this.particles.push({
            type: 'text',
            text: text,
            x: x,
            y: y,
            vy: -2.8,
            alpha: 1.0,
            decay: 0.02,
            color: color,
            scale: 1.0
        });
    }

    update(roadScrollSpeed) {
        // Update Skid marks
        for (let i = this.skidMarks.length - 1; i >= 0; i--) {
            const mark = this.skidMarks[i];
            mark.y1 += roadScrollSpeed;
            mark.y2 += roadScrollSpeed;
            mark.alpha -= 0.0015;
            if (mark.y1 > 1950 || mark.alpha <= 0) {
                this.skidMarks.splice(i, 1);
            }
        }

        // Update Explosions
        for (let i = this.explosions.length - 1; i >= 0; i--) {
            const exp = this.explosions[i];
            exp.radius = MathUtils.lerp(exp.radius, exp.maxRadius, 0.14);
            exp.alpha -= 0.035;
            exp.lineWidth = Math.max(1, exp.lineWidth * 0.92);
            if (exp.alpha <= 0) {
                this.explosions.splice(i, 1);
            }
        }

        // Update Flying Coins to HUD
        for (let i = this.flyingCoins.length - 1; i >= 0; i--) {
            const fc = this.flyingCoins[i];
            fc.progress += fc.speed;
            fc.spin += 0.28;

            const t = Math.min(1.0, fc.progress);
            fc.x = (1 - t) * (1 - t) * fc.startX + 2 * (1 - t) * t * fc.cpX + t * t * fc.targetX;
            fc.y = (1 - t) * (1 - t) * fc.startY + 2 * (1 - t) * t * fc.cpY + t * t * fc.targetY;
            fc.scale = 1.2 - t * 0.3;

            // Spawn sparkles along flight path
            if (Math.random() < 0.6) {
                this.particles.push({
                    type: 'spark',
                    x: fc.x + MathUtils.randRange(-10, 10),
                    y: fc.y + MathUtils.randRange(-10, 10),
                    vx: MathUtils.randRange(-1, 1),
                    vy: MathUtils.randRange(-1, 1),
                    radius: MathUtils.randRange(4, 8),
                    alpha: 0.9,
                    decay: 0.05,
                    color: MathUtils.randChoice(['#ffd166', '#ffbe0b', '#ffffff'])
                });
            }

            if (fc.progress >= 1.0) {
                if (fc.onArrival) fc.onArrival();
                this.addSparks(fc.targetX, fc.targetY, 14);
                this.flyingCoins.splice(i, 1);
            }
        }

        // Update Standard Particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += (p.vx || 0);
            p.y += (p.vy || 0) + (roadScrollSpeed * 0.25);
            p.alpha -= p.decay;

            if (p.type === 'debris' || p.type === 'tire') {
                p.angle += p.spinSpeed;
                p.vy += 0.45; // gravity on debris/tires
            }

            if (p.radius !== undefined && p.maxRadius !== undefined) {
                p.radius = MathUtils.lerp(p.radius, p.maxRadius, 0.08);
            }

            if (p.alpha <= 0 || p.y > 2100) {
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
            ctx.fillRect(mark.x1 - mark.width / 2, mark.y1, mark.width, 16);
            ctx.fillRect(mark.x2 - mark.width / 2, mark.y2, mark.width, 16);
        }
        ctx.restore();
    }

    drawParticles(ctx) {
        ctx.save();

        // 1. Draw Shockwave explosions
        for (const exp of this.explosions) {
            ctx.globalAlpha = Math.max(0, exp.alpha);
            ctx.fillStyle = exp.color;
            ctx.beginPath();
            ctx.arc(exp.x, exp.y, exp.radius, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = exp.strokeColor;
            ctx.lineWidth = exp.lineWidth;
            ctx.stroke();
        }

        // 2. Draw Particles
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
            } else if (p.type === 'debris') {
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(p.angle);
                ctx.fillStyle = p.color;
                ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
                ctx.restore();
            } else if (p.type === 'tire') {
                // Flying spinning rubber tire with hubcap
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(p.angle);
                ctx.fillStyle = '#1b1b1e';
                ctx.beginPath();
                ctx.arc(0, 0, p.size, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#4a4e69';
                ctx.lineWidth = 2;
                ctx.stroke();
                // Hubcap
                ctx.fillStyle = '#c8d6e5';
                ctx.beginPath();
                ctx.arc(0, 0, p.size * 0.52, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#333333';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(-p.size * 0.5, 0);
                ctx.lineTo(p.size * 0.5, 0);
                ctx.moveTo(0, -p.size * 0.5);
                ctx.lineTo(0, p.size * 0.5);
                ctx.stroke();
                ctx.restore();
            } else {
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // 3. Draw ambient dust triangles
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

        // 4. Draw Flying Coins
        for (const fc of this.flyingCoins) {
            ctx.save();
            ctx.translate(fc.x, fc.y);
            const squashX = Math.cos(fc.spin);
            ctx.scale(Math.abs(squashX) * fc.scale, fc.scale);

            ctx.fillStyle = '#ffbe0b';
            ctx.beginPath();
            ctx.arc(0, 0, 26, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#d7b365';
            ctx.lineWidth = 3;
            ctx.stroke();

            ctx.fillStyle = '#6b4f26';
            ctx.beginPath();
            for (let s = 0; s < 5; s++) {
                const angle = -Math.PI / 2 + s * (Math.PI * 2 / 5);
                const rOut = 14, rIn = 6;
                const x1 = Math.cos(angle) * rOut;
                const y1 = Math.sin(angle) * rOut;
                const x2 = Math.cos(angle + Math.PI / 5) * rIn;
                const y2 = Math.sin(angle + Math.PI / 5) * rIn;
                if (s === 0) ctx.moveTo(x1, y1);
                else ctx.lineTo(x1, y1);
                ctx.lineTo(x2, y2);
            }
            ctx.closePath();
            ctx.fill();

            ctx.restore();
        }

        ctx.restore();
    }
}

window.ParticleSystem = ParticleSystem;
