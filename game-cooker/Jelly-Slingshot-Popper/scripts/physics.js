// Physics Engine for Slingshot & Bouncy Ball Simulation
// Tailored for 1080x1920 canvas resolution

class Slingshot {
    constructor() {
        this.leftPin = { x: 190, y: 1540 };
        this.rightPin = { x: 890, y: 1540 };
        this.rest = { x: 540, y: 1540 };
        this.pos = { x: 540, y: 1540 };
        this.isDragging = false;
        this.maxDrag = 280; // maximum pull distance in px
        this.power = 12.8;  // launch speed multiplier
        this.wobbleTime = 0;
        this.wobbleAmplitude = 0;
        this.bandThickness = 14;
    }

    startDrag(x, y) {
        // Can only start drag near the resting slingshot or current ball
        const dist = Math.hypot(x - this.pos.x, y - this.pos.y);
        if (dist < 180) {
            this.isDragging = true;
            this.updateDrag(x, y);
            window.sounds.init();
            window.sounds.playSlingPull(0.2);
            return true;
        }
        return false;
    }

    updateDrag(x, y) {
        if (!this.isDragging) return;
        const dx = x - this.rest.x;
        const dy = y - this.rest.y;
        const dist = Math.hypot(dx, dy);

        if (dist > this.maxDrag) {
            this.pos.x = this.rest.x + (dx / dist) * this.maxDrag;
            this.pos.y = this.rest.y + (dy / dist) * this.maxDrag;
        } else {
            this.pos.x = x;
            this.pos.y = y;
        }

        const tension = Math.min(1.0, dist / this.maxDrag);
        if (Math.random() < 0.08) {
            window.sounds.playSlingPull(tension);
        }
    }

    release() {
        if (!this.isDragging) return null;
        this.isDragging = false;

        const dx = this.pos.x - this.rest.x;
        const dy = this.pos.y - this.rest.y;
        const dist = Math.hypot(dx, dy);

        // Minimum pull threshold to fire
        if (dist < 30) {
            this.pos.x = this.rest.x;
            this.pos.y = this.rest.y;
            return null;
        }

        // Calculate launch velocity (opposite to pull vector)
        const vx = -dx * this.power;
        const vy = -dy * this.power;

        // Trigger snap wobble animation
        this.wobbleAmplitude = dist * 0.45;
        this.wobbleTime = 0;

        window.sounds.playSlingSnap();

        const launchInfo = {
            x: this.pos.x,
            y: this.pos.y,
            vx: vx,
            vy: vy
        };

        // Reset resting position
        this.pos.x = this.rest.x;
        this.pos.y = this.rest.y;

        return launchInfo;
    }

    checkBandCatch(ball) {
        if (ball.vy <= 0) return false;

        // Forgiving catch zone: spans beyond anchor bolts
        if (ball.x < this.leftPin.x - 70 || ball.x > this.rightPin.x + 70) {
            return false;
        }

        // Calculate Y of the band at ball's X
        let midY = this.pos.y;
        if (!this.isDragging && this.wobbleAmplitude > 0.5) {
            midY += Math.sin(this.wobbleTime * 35) * this.wobbleAmplitude;
        }

        let bandY = midY;
        if (ball.x < this.pos.x && Math.abs(this.pos.x - this.leftPin.x) > 1) {
            const t = (ball.x - this.leftPin.x) / (this.pos.x - this.leftPin.x);
            bandY = this.leftPin.y + t * (midY - this.leftPin.y);
        } else if (ball.x >= this.pos.x && Math.abs(this.rightPin.x - this.pos.x) > 1) {
            const t = (ball.x - this.pos.x) / (this.rightPin.x - this.pos.x);
            bandY = midY + t * (this.rightPin.y - midY);
        }

        // Forgiving collision check with elastic band
        const threshold = ball.radius + this.bandThickness + 14;
        if (ball.y >= bandY - threshold && ball.y <= bandY + threshold + 40) {
            // Rebound ball upward cleanly
            ball.y = bandY - ball.radius - 8;
            const bounceSpeed = Math.max(1400, Math.min(2300, Math.abs(ball.vy) * 1.18));
            ball.vy = -bounceSpeed;

            // Deflect velocity smoothly based on distance from center
            const deflection = (ball.x - 540) / 350;
            ball.vx += deflection * 180;

            // Reset ball penalized flag on successful catch
            ball.hasPenalized = false;

            // Trigger elastic band twang & wobble
            this.wobbleAmplitude = Math.min(65, 30 + bounceSpeed * 0.015);
            this.wobbleTime = 0;

            window.sounds.playBandRebound();
            return true;
        }

        return false;
    }

    update(dt) {
        if (!this.isDragging && this.wobbleAmplitude > 0.5) {
            this.wobbleTime += dt;
            // Damped harmonic oscillation
            this.wobbleAmplitude *= Math.exp(-6.0 * dt);
        } else {
            this.wobbleAmplitude = 0;
        }
    }

    getTrajectory(ballColor) {
        if (!this.isDragging) return [];
        const dx = this.pos.x - this.rest.x;
        const dy = this.pos.y - this.rest.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 35) return [];

        let simX = this.pos.x;
        let simY = this.pos.y;
        let simVx = -dx * this.power;
        let simVy = -dy * this.power;
        const gravity = 820; // gentle gravity
        const dt = 0.024;
        const points = [];

        for (let i = 0; i < 36; i++) {
            simVy += gravity * dt;
            simX += simVx * dt;
            simY += simVy * dt;

            // Bounce off walls in preview
            if (simX < 75) {
                simX = 75;
                simVx = -simVx * 0.96;
            } else if (simX > 1005) {
                simX = 1005;
                simVx = -simVx * 0.96;
            }

            // Ceiling bounce
            if (simY < 185) {
                simY = 185;
                simVy = -simVy * 0.96;
            }

            points.push({ x: simX, y: simY, alpha: Math.max(0.1, 1.0 - i / 36) });
            if (simY > 1750) break;
        }

        return points;
    }

    draw(ctx, boltImg, loadedBall, ballImages = {}) {
        ctx.save();

        let midY = this.pos.y;
        if (!this.isDragging && this.wobbleAmplitude > 0.5) {
            midY += Math.sin(this.wobbleTime * 35) * this.wobbleAmplitude;
        }

        // Draw rubber band
        // Outer dark stroke
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        ctx.strokeStyle = '#232529';
        ctx.lineWidth = this.bandThickness + 6;
        ctx.beginPath();
        ctx.moveTo(this.leftPin.x, this.leftPin.y);
        ctx.lineTo(this.pos.x, midY);
        ctx.lineTo(this.rightPin.x, this.rightPin.y);
        ctx.stroke();

        // Inner white elastic core
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = this.bandThickness;
        ctx.beginPath();
        ctx.moveTo(this.leftPin.x, this.leftPin.y);
        ctx.lineTo(this.pos.x, midY);
        ctx.lineTo(this.rightPin.x, this.rightPin.y);
        ctx.stroke();

        // Draw loaded ball on the band
        if (loadedBall) {
            loadedBall.x = this.pos.x;
            loadedBall.y = midY;
            loadedBall.draw(ctx, ballImages);
        }

        // Draw the two metallic bolt anchors on top of the band ends
        this.drawBolt(ctx, this.leftPin.x, this.leftPin.y, boltImg);
        this.drawBolt(ctx, this.rightPin.x, this.rightPin.y, boltImg);

        ctx.restore();
    }

    drawBolt(ctx, x, y, img) {
        const size = 80;
        if (img && img.complete && img.naturalWidth > 0) {
            ctx.drawImage(img, x - size / 2, y - size / 2, size, size);
        } else {
            // Procedural vector bolt fallback
            ctx.save();
            ctx.translate(x, y);

            // Outer dark rim
            ctx.fillStyle = '#22252a';
            ctx.beginPath();
            ctx.arc(0, 0, 36, 0, Math.PI * 2);
            ctx.fill();

            // Metallic gradient
            const grad = ctx.createLinearGradient(-30, -30, 30, 30);
            grad.addColorStop(0, '#ffffff');
            grad.addColorStop(0.3, '#d8dbe2');
            grad.addColorStop(0.7, '#9699a2');
            grad.addColorStop(1, '#5a5d66');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(0, 0, 31, 0, Math.PI * 2);
            ctx.fill();

            // Philips cross
            ctx.fillStyle = '#3a3c42';
            ctx.rotate(Math.PI / 4);
            ctx.fillRect(-6, -22, 12, 44);
            ctx.fillRect(-22, -6, 44, 12);

            ctx.restore();
        }
    }
}

class Physics {
    static checkBallWall(ball) {
        const left = 75;
        const right = 1005;
        const top = 185;
        const bottom = 2000;
        const restitution = 0.97;

        let bounced = false;

        // Left wall
        if (ball.x - ball.radius < left) {
            ball.x = left + ball.radius;
            ball.vx = Math.abs(ball.vx) * restitution;
            bounced = true;
        }
        // Right wall
        else if (ball.x + ball.radius > right) {
            ball.x = right - ball.radius;
            ball.vx = -Math.abs(ball.vx) * restitution;
            bounced = true;
        }

        // Ceiling
        if (ball.y - ball.radius < top) {
            ball.y = top + ball.radius;
            ball.vy = Math.abs(ball.vy) * restitution;
            bounced = true;
        }

        if (bounced) {
            const speed = Math.hypot(ball.vx, ball.vy);
            window.sounds.playBounce(speed);
        }

        // Out of screen at bottom
        if (ball.y - ball.radius > bottom) {
            ball.isAlive = false;
        }
    }

    static checkBallJelly(ball, jelly) {
        if (!jelly.isAlive) return false;

        // Find closest point on jelly rounded rect to ball center
        const closestX = Math.max(jelly.x, Math.min(ball.x, jelly.x + jelly.w));
        const closestY = Math.max(jelly.y, Math.min(ball.y, jelly.y + jelly.h));

        const dx = ball.x - closestX;
        const dy = ball.y - closestY;
        const distSq = dx * dx + dy * dy;

        if (distSq < ball.radius * ball.radius) {
            const dist = Math.sqrt(distSq) || 1;
            const nx = dx / dist;
            const ny = dy / dist;

            // Separate ball from jelly
            ball.x = closestX + nx * (ball.radius + 1);
            ball.y = closestY + ny * (ball.radius + 1);

            // Reflect ball velocity
            const dot = ball.vx * nx + ball.vy * ny;
            if (dot < 0) {
                const restitution = 0.98;
                ball.vx = ball.vx - (1 + restitution) * dot * nx;
                ball.vy = ball.vy - (1 + restitution) * dot * ny;
            }

            return true;
        }
        return false;
    }
}

window.Slingshot = Slingshot;
window.Physics = Physics;

