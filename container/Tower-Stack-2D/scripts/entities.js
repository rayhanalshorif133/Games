/**
 * scripts/entities.js - Construct 3 Style Game Entities
 * Blocks with animated tracking eyes, sliding active block,
 * parallax bamboo forest background, and floating bubbles.
 */

const BLOCK_COLORS = [
    { top: '#6be4f7', fill: '#3bc1d3', dark: '#1b6e7a', name: 'cyan' },
    { top: '#ff8a4f', fill: '#f76928', dark: '#a53e0d', name: 'orange' },
    { top: '#ccf044', fill: '#acc63a', dark: '#697c18', name: 'green' },
    { top: '#ffe566', fill: '#fbc930', dark: '#ad820e', name: 'yellow' },
    { top: '#ff7777', fill: '#ff5252', dark: '#a81c1c', name: 'red' }
];

class StackBlock {
    constructor(x, y, colorIndex = 0) {
        this.x = x;
        this.y = y;
        this.colorData = BLOCK_COLORS[colorIndex % BLOCK_COLORS.length];
        this.colorIndex = colorIndex;
        this.rotation = 0;

        // Squash & Stretch
        this.scaleX = 1;
        this.scaleY = 1;
        this.squashVelX = 0;
        this.squashVelY = 0;

        // Eyes & Expressions
        this.blinkTimer = 2.0 + Math.random() * 3.5;
        this.isBlinking = false;
        this.blinkDuration = 0;
        this.isSad = false;
        this.pupilOffsetX = 0;
        this.pupilOffsetY = 0;
    }

    triggerLandSquash() {
        this.scaleX = 1.28;
        this.scaleY = 0.72;
        this.squashVelX = 0;
        this.squashVelY = 0;
    }

    update(dt, targetGazePos) {
        // Spring return squash & stretch to 1.0
        const k = 320;
        const d = 22;

        const forceX = -k * (this.scaleX - 1);
        this.squashVelX += (forceX - d * this.squashVelX) * dt;
        this.scaleX += this.squashVelX * dt;

        const forceY = -k * (this.scaleY - 1);
        this.squashVelY += (forceY - d * this.squashVelY) * dt;
        this.scaleY += this.squashVelY * dt;

        // Blinking
        this.blinkTimer -= dt;
        if (this.blinkTimer <= 0) {
            if (!this.isBlinking) {
                this.isBlinking = true;
                this.blinkDuration = 0.12;
            } else {
                this.blinkDuration -= dt;
                if (this.blinkDuration <= 0) {
                    this.isBlinking = false;
                    this.blinkTimer = 2.5 + Math.random() * 4.0;
                }
            }
        }

        // Dynamic Pupil Tracking
        if (targetGazePos) {
            const centerX = this.x + GamePhysics.BLOCK_W / 2;
            const centerY = this.y + GamePhysics.BLOCK_H / 2;
            const dx = targetGazePos.x - centerX;
            const dy = targetGazePos.y - centerY;
            const angle = Math.atan2(dy, dx);
            const dist = Math.min(10, Math.hypot(dx, dy) * 0.04);

            const targetPupilX = Math.cos(angle) * dist;
            const targetPupilY = Math.sin(angle) * dist;

            this.pupilOffsetX += (targetPupilX - this.pupilOffsetX) * (1 - Math.exp(-12 * dt));
            this.pupilOffsetY += (targetPupilY - this.pupilOffsetY) * (1 - Math.exp(-12 * dt));
        } else {
            this.pupilOffsetX += (0 - this.pupilOffsetX) * (1 - Math.exp(-8 * dt));
            this.pupilOffsetY += (0 - this.pupilOffsetY) * (1 - Math.exp(-8 * dt));
        }
    }

    draw(ctx, cameraY, swayOffsetX = 0) {
        const w = GamePhysics.BLOCK_W;
        const h = GamePhysics.BLOCK_H;
        const renderX = this.x + swayOffsetX;
        const renderY = this.y + cameraY;

        ctx.save();
        ctx.translate(renderX + w / 2, renderY + h / 2);
        ctx.rotate(this.rotation);
        ctx.scale(this.scaleX, this.scaleY);

        const radius = 20;

        // 1. Block Body Gradient Fill
        const bodyGrad = ctx.createLinearGradient(0, -h / 2, 0, h / 2);
        bodyGrad.addColorStop(0, this.colorData.top);
        bodyGrad.addColorStop(0.35, this.colorData.fill);
        bodyGrad.addColorStop(1, this.colorData.dark);

        ctx.beginPath();
        ctx.roundRect(-w / 2, -h / 2, w, h, radius);
        ctx.fillStyle = bodyGrad;
        ctx.fill();

        // 2. Dark lower bevel shade & Gloss highlight
        ctx.save();
        ctx.clip();

        ctx.fillStyle = this.colorData.dark;
        ctx.beginPath();
        ctx.roundRect(-w / 2, h / 2 - 28, w, 28, [0, 0, radius, radius]);
        ctx.fill();

        // Gloss highlight pill on top
        const glossGrad = ctx.createLinearGradient(0, -h / 2 + 6, 0, -h / 2 + 28);
        glossGrad.addColorStop(0, 'rgba(255, 255, 255, 0.48)');
        glossGrad.addColorStop(1, 'rgba(255, 255, 255, 0.06)');
        ctx.fillStyle = glossGrad;
        ctx.beginPath();
        ctx.roundRect(-w / 2 + 8, -h / 2 + 6, w - 16, 20, 10);
        ctx.fill();

        ctx.restore();

        // 3. Bold black outer border (demo.mp4 arcade style)
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 9;
        ctx.stroke();

        // 4. Cute rosy cheeks
        ctx.fillStyle = 'rgba(255, 75, 125, 0.38)';
        ctx.beginPath();
        ctx.ellipse(-22, 14, 10, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(22, 14, 10, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        // 5. Cute mouth
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 4.5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        if (this.isSad) {
            ctx.arc(0, 24, 7, Math.PI * 1.15, Math.PI * 1.85);
        } else {
            ctx.arc(0, 14, 8, 0.15 * Math.PI, 0.85 * Math.PI);
        }
        ctx.stroke();

        // 6. Expressive tracking eyes
        this.drawEyes(ctx, w, h);

        ctx.restore();
    }

    drawEyes(ctx, w, h) {
        const eyeRadius = 17;
        const eyeSpacing = 44;
        const eyeY = -6;

        const eyes = [-eyeSpacing / 2, eyeSpacing / 2];

        eyes.forEach(eyeX => {
            if (this.isBlinking) {
                // Blink line
                ctx.strokeStyle = '#000000';
                ctx.lineWidth = 6;
                ctx.lineCap = 'round';
                ctx.beginPath();
                ctx.moveTo(eyeX - eyeRadius + 3, eyeY);
                ctx.lineTo(eyeX + eyeRadius - 3, eyeY);
                ctx.stroke();
            } else if (this.isSad) {
                // X eye on game over
                ctx.strokeStyle = '#000000';
                ctx.lineWidth = 6;
                ctx.lineCap = 'round';
                ctx.beginPath();
                ctx.moveTo(eyeX - 10, eyeY - 10);
                ctx.lineTo(eyeX + 10, eyeY + 10);
                ctx.moveTo(eyeX + 10, eyeY - 10);
                ctx.lineTo(eyeX - 10, eyeY + 10);
                ctx.stroke();
            } else {
                // Sclera (White eye background)
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(eyeX, eyeY, eyeRadius, 0, Math.PI * 2);
                ctx.fill();

                ctx.strokeStyle = '#000000';
                ctx.lineWidth = 5;
                ctx.stroke();

                // Pupil (Black center with tracking offset)
                const pupilRadius = 7.5;
                const px = eyeX + this.pupilOffsetX;
                const py = eyeY + this.pupilOffsetY;

                ctx.fillStyle = '#000000';
                ctx.beginPath();
                ctx.arc(px, py, pupilRadius, 0, Math.PI * 2);
                ctx.fill();

                // Dual Specular Sparkles (Anime/Arcade twinkle)
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(px - 2.5, py - 2.5, 2.8, 0, Math.PI * 2);
                ctx.fill();

                ctx.beginPath();
                ctx.arc(px + 2.2, py + 2.2, 1.4, 0, Math.PI * 2);
                ctx.fill();
            }
        });
    }
}

class ActiveBlock {
    constructor() {
        this.w = GamePhysics.BLOCK_W;
        this.h = GamePhysics.BLOCK_H;
        this.spawnIndex = 0;
        this.reset(0);
    }

    reset(colorIndex = 0, speed = 560, side = null) {
        this.w = GamePhysics.BLOCK_W;
        this.h = GamePhysics.BLOCK_H;
        this.minX = 40;
        this.maxX = GamePhysics.CANVAS_W - this.w - 40;

        // Alternate or select between left and right side spawn
        if (!side) {
            side = (this.spawnIndex % 2 === 0) ? 'left' : 'right';
        }
        this.spawnIndex++;

        if (side === 'right') {
            this.x = this.maxX;
            this.direction = -1; // Moving towards left
        } else {
            this.x = this.minX;
            this.direction = 1; // Moving towards right
        }

        this.y = GamePhysics.SCREEN_DROP_Y;
        this.baseY = GamePhysics.SCREEN_DROP_Y;
        this.colorIndex = colorIndex;
        this.colorData = BLOCK_COLORS[colorIndex % BLOCK_COLORS.length];
        this.speed = speed;

        this.isDropping = false;
        this.vy = 0;
        this.tumbleAngle = 0;
        this.tumbleSpeed = 0;
        this.scaleX = 1;
        this.scaleY = 1;

        // Pupil anticipation look
        this.gazeDown = false;
    }

    triggerDrop() {
        if (this.isDropping) return;
        this.isDropping = true;
        this.vy = 280; // Initial downward boost
        this.gazeDown = true;
    }

    update(dt) {
        if (!this.isDropping) {
            // Horizontal sliding motion
            this.x += this.direction * this.speed * dt;
            if (this.x >= this.maxX) {
                this.x = this.maxX;
                this.direction = -1;
            } else if (this.x <= this.minX) {
                this.x = this.minX;
                this.direction = 1;
            }
        } else {
            // Falling down under gravity
            this.vy += GamePhysics.DROP_GRAVITY * dt;
            this.y += this.vy * dt;

            if (this.tumbleSpeed !== 0) {
                this.tumbleAngle += this.tumbleSpeed * dt;
                this.x += (this.direction * 180) * dt;
            }
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x + this.w / 2, this.y + this.h / 2);
        if (this.tumbleAngle !== 0) {
            ctx.rotate(this.tumbleAngle);
        }

        const radius = 20;

        // 1. Block Body Gradient Fill
        const bodyGrad = ctx.createLinearGradient(0, -this.h / 2, 0, this.h / 2);
        bodyGrad.addColorStop(0, this.colorData.top);
        bodyGrad.addColorStop(0.35, this.colorData.fill);
        bodyGrad.addColorStop(1, this.colorData.dark);

        ctx.beginPath();
        ctx.roundRect(-this.w / 2, -this.h / 2, this.w, this.h, radius);
        ctx.fillStyle = bodyGrad;
        ctx.fill();

        // 2. Dark bottom bevel & Gloss highlight
        ctx.save();
        ctx.clip();

        ctx.fillStyle = this.colorData.dark;
        ctx.beginPath();
        ctx.roundRect(-this.w / 2, this.h / 2 - 28, this.w, 28, [0, 0, radius, radius]);
        ctx.fill();

        // Gloss highlight pill on top
        const glossGrad = ctx.createLinearGradient(0, -this.h / 2 + 6, 0, -this.h / 2 + 28);
        glossGrad.addColorStop(0, 'rgba(255, 255, 255, 0.48)');
        glossGrad.addColorStop(1, 'rgba(255, 255, 255, 0.06)');
        ctx.fillStyle = glossGrad;
        ctx.beginPath();
        ctx.roundRect(-this.w / 2 + 8, -this.h / 2 + 6, this.w - 16, 20, 10);
        ctx.fill();

        ctx.restore();

        // 3. Bold black outer border
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 9;
        ctx.stroke();

        // 4. Cute rosy cheeks
        ctx.fillStyle = 'rgba(255, 75, 125, 0.38)';
        ctx.beginPath();
        ctx.ellipse(-22, 14, 10, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(22, 14, 10, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        // 5. Expressive mouth (Open "O" when dropping, smile when sliding)
        if (this.gazeDown) {
            ctx.fillStyle = '#000000';
            ctx.beginPath();
            ctx.arc(0, 18, 5.5, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 4.5;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.arc(0, 14, 8, 0.15 * Math.PI, 0.85 * Math.PI);
            ctx.stroke();
        }

        // 6. Eyes with anticipation and dual sparkles
        const eyeRadius = 17;
        const eyeSpacing = 44;
        const eyeY = -6;
        const eyes = [-eyeSpacing / 2, eyeSpacing / 2];

        eyes.forEach(eyeX => {
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(eyeX, eyeY, eyeRadius, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 5;
            ctx.stroke();

            // Pupil: Look down when dropping, else glance sideways
            const pupilRadius = 7.5;
            const px = eyeX + (this.gazeDown ? 0 : this.direction * 4);
            const py = eyeY + (this.gazeDown ? 6 : 2);

            ctx.fillStyle = '#000000';
            ctx.beginPath();
            ctx.arc(px, py, pupilRadius, 0, Math.PI * 2);
            ctx.fill();

            // Dual sparkles
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(px - 2.5, py - 2.5, 2.8, 0, Math.PI * 2);
            ctx.fill();

            ctx.beginPath();
            ctx.arc(px + 2.2, py + 2.2, 1.4, 0, Math.PI * 2);
            ctx.fill();
        });

        ctx.restore();
    }
}

class BackgroundRenderer {
    constructor() {
        this.time = 0;
        this.initBubbles();
        this.initBamboo();
    }

    initBubbles() {
        this.bubbles = [];
        for (let i = 0; i < 22; i++) {
            this.bubbles.push({
                x: Math.random() * GamePhysics.CANVAS_W,
                y: Math.random() * GamePhysics.CANVAS_H,
                radius: 12 + Math.random() * 26,
                speedY: 25 + Math.random() * 45,
                wobbleSpeed: 1.2 + Math.random() * 2.0,
                wobbleAmp: 15 + Math.random() * 25,
                phase: Math.random() * Math.PI * 2,
                alpha: 0.2 + Math.random() * 0.35
            });
        }
    }

    initBamboo() {
        // Two layers of vertical bamboo stalks
        this.backBamboo = [
            { x: 80, width: 42, notches: [350, 750, 1150, 1550] },
            { x: 260, width: 36, notches: [200, 600, 1000, 1400, 1800] },
            { x: 820, width: 48, notches: [400, 800, 1200, 1600] },
            { x: 1000, width: 38, notches: [150, 550, 950, 1350, 1750] }
        ];

        this.frontBamboo = [
            { x: 30, width: 56, notches: [250, 650, 1050, 1450, 1850] },
            { x: 960, width: 62, notches: [300, 700, 1100, 1500] }
        ];
    }

    update(dt) {
        this.time += dt;

        // Floating bubbles update
        for (let b of this.bubbles) {
            b.y -= b.speedY * dt;
            b.x += Math.sin(this.time * b.wobbleSpeed + b.phase) * (b.wobbleAmp * dt);

            if (b.y + b.radius < 0) {
                b.y = GamePhysics.CANVAS_H + b.radius;
                b.x = Math.random() * GamePhysics.CANVAS_W;
            }
        }
    }

    draw(ctx, cameraY) {
        const w = GamePhysics.CANVAS_W;
        const h = GamePhysics.CANVAS_H;

        // 1. Sky Base Gradient (from demo.mp4)
        const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
        skyGrad.addColorStop(0, '#b8e3ad');
        skyGrad.addColorStop(1, '#8fc87c');
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, w, h);

        // 2. Parallax Back Bamboo Layer (subtle scroll)
        ctx.fillStyle = '#7eb34c';
        const backParallaxY = (cameraY * 0.18) % 400;
        for (let b of this.backBamboo) {
            ctx.fillRect(b.x, -200, b.width, h + 400);
            ctx.fillStyle = '#6e9f40';
            for (let notchY of b.notches) {
                const ny = ((notchY + backParallaxY) % (h + 200)) - 100;
                ctx.fillRect(b.x - 3, ny, b.width + 6, 8);
            }
            ctx.fillStyle = '#7eb34c';
        }

        // 3. Floating Ambient Bubbles
        ctx.fillStyle = '#ffffff';
        for (let b of this.bubbles) {
            ctx.save();
            ctx.globalAlpha = b.alpha;
            ctx.beginPath();
            ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
            ctx.fill();

            // Inner light crescent
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.arc(b.x, b.y, b.radius * 0.75, -Math.PI * 0.7, -Math.PI * 0.1);
            ctx.stroke();
            ctx.restore();
        }

        // 4. Parallax Front Bamboo Layer
        ctx.fillStyle = '#8dc77b';
        const frontParallaxY = (cameraY * 0.35) % 400;
        for (let b of this.frontBamboo) {
            ctx.fillRect(b.x, -200, b.width, h + 400);
            ctx.fillStyle = '#78b166';
            for (let notchY of b.notches) {
                const ny = ((notchY + frontParallaxY) % (h + 200)) - 100;
                ctx.fillRect(b.x - 4, ny, b.width + 8, 10);
            }
            ctx.fillStyle = '#8dc77b';
        }

        // 5. Bottom Stepped Silhouette Rocks & Ground
        const groundWorldY = GamePhysics.GROUND_Y + cameraY;
        if (groundWorldY < h + 200) {
            ctx.fillStyle = '#326400';
            ctx.beginPath();
            ctx.moveTo(0, groundWorldY + 14);
            ctx.lineTo(160, groundWorldY - 20);
            ctx.lineTo(340, groundWorldY + 4);
            ctx.lineTo(520, groundWorldY - 32);
            ctx.lineTo(760, groundWorldY + 8);
            ctx.lineTo(920, groundWorldY - 24);
            ctx.lineTo(w, groundWorldY);
            ctx.lineTo(w, h);
            ctx.lineTo(0, h);
            ctx.closePath();
            ctx.fill();

            // Black Ground Strip
            ctx.fillStyle = '#000000';
            ctx.fillRect(0, groundWorldY + 6, w, 14);
        }
    }
}

if (typeof window !== 'undefined') {
    window.BLOCK_COLORS = BLOCK_COLORS;
    window.StackBlock = StackBlock;
    window.ActiveBlock = ActiveBlock;
    window.BackgroundRenderer = BackgroundRenderer;
}

