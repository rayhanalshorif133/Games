// Fun Golf - High Definition Canvas Renderer
// Native 1080 x 1920 resolution with high-DPI scaling

class GameRenderer {
    constructor(canvas, game) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.game = game;

        this.width = 1080;
        this.height = 1920;

        this.images = {};
        this.loadAssets();
    }

    loadAssets() {
        const assetList = [
            'ball', 'club', 'flag', 'hole', 'obstacle',
            'grass_tuft', 'ui_banner', 'ui_btn_home', 'ui_btn_levels',
            'ui_btn_restart', 'ui_hold_badge', 'particle_dust',
            'particle_sparkle', 'sky_bg', 'net_pattern'
        ];

        this.assetsLoaded = 0;
        this.totalAssets = assetList.length;

        assetList.forEach(name => {
            const img = new Image();
            img.src = `images/${name}.png`;
            img.onload = () => {
                this.images[name] = img;
                this.assetsLoaded++;
            };
            img.onerror = () => {
                console.warn(`Failed loading image: images/${name}.png`);
                this.assetsLoaded++;
            };
        });
    }

    render() {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.width, this.height);

        // 1. Draw Deep Midnight Slate Background
        this.renderBackground(ctx);

        // 2. Draw Platforms & Obstacles
        this.renderFloors(ctx);

        // 3. Draw Finish Zone
        this.renderFinishLine(ctx);

        // 4. Draw Ball Shadow & Ball
        this.renderBall(ctx);

        // 5. Draw Aiming Arrow & Golf Club (on top of ball/floor)
        this.renderClubAndAim(ctx);

        // 6. Draw Visual FX Particles
        this.renderParticles(ctx);

        // 7. Draw Confetti (if level won)
        this.renderConfetti(ctx);

        // 8. Draw Header UI
        this.renderHeaderUI(ctx);

        // 9. Draw Victory Screen or Modals (if active)
        this.renderModals(ctx);
    }

    renderBackground(ctx) {
        // Deep slate navy body
        ctx.fillStyle = '#214462';
        ctx.fillRect(0, 0, this.width, this.height);

        // Sky at top
        if (this.images.sky_bg) {
            ctx.drawImage(this.images.sky_bg, 0, 0, this.width, 420);
        } else {
            ctx.fillStyle = '#BFF7FB';
            ctx.fillRect(0, 0, this.width, 380);
        }

        // Diamond net / lattice pattern below Floor 1 (Y: 410 to 860)
        if (this.images.net_pattern) {
            ctx.drawImage(this.images.net_pattern, 0, 410, this.width, 450);
        }
    }

    renderFloors(ctx) {
        const level = this.game.currentLevelData;
        if (!level || !level.floors) return;

        level.floors.forEach(floor => {
            const fy = floor.y;

            // Platform Structural Underbeam (Dark navy)
            ctx.fillStyle = '#0F222A';
            ctx.fillRect(0, fy + 24, this.width, 24);

            // Platform Top Grass Layer (Bright vibrant golf green)
            ctx.fillStyle = '#67C014';
            ctx.fillRect(0, fy, this.width, 24);

            // Top highlight stripe on grass
            ctx.fillStyle = '#8BE22A';
            ctx.fillRect(0, fy, this.width, 6);

            // Grass tufts
            if (this.images.grass_tuft && floor.grassTufts) {
                floor.grassTufts.forEach(tx => {
                    ctx.drawImage(this.images.grass_tuft, tx - 30, fy - 36, 60, 40);
                });
            }

            // Hole cup
            const hx = floor.holeX;
            if (this.images.hole) {
                ctx.drawImage(this.images.hole, hx - 42, fy - 4, 84, 54);
            } else {
                ctx.fillStyle = '#0F1C28';
                ctx.beginPath();
                ctx.arc(hx, fy + 20, 24, 0, Math.PI);
                ctx.fill();
            }

            // Flag
            if (this.images.flag) {
                // Flag sits on the side of the hole
                const flagX = (floor.holeSide === 'left') ? hx + 18 : hx + 18;
                ctx.drawImage(this.images.flag, flagX - 40, fy - 120, 72, 120);
            }

            // Central Obstacle Block (if present on this floor)
            if (floor.obstacle) {
                const obs = floor.obstacle;
                const ox = obs.x - obs.width / 2;
                const oy = fy - obs.height;

                if (this.images.obstacle) {
                    ctx.drawImage(this.images.obstacle, ox, oy, obs.width, obs.height);
                } else {
                    // Fallback crisp green block with white outline
                    ctx.fillStyle = '#FFFFFF';
                    ctx.fillRect(ox, oy, obs.width, obs.height);
                    ctx.fillStyle = '#4EC410';
                    ctx.fillRect(ox + 4, oy + 4, obs.width - 8, obs.height - 4);
                }
            }
        });
    }

    renderFinishLine(ctx) {
        const finishY = 1855;
        const ctx2 = this.ctx;

        // Bottom red solid bar
        ctx2.fillStyle = '#DE3220';
        ctx2.fillRect(0, 1890, this.width, 30);

        // Red dashed track line
        ctx2.strokeStyle = '#DE3220';
        ctx2.lineWidth = 4;
        ctx2.setLineDash([16, 12]);
        ctx2.beginPath();
        ctx2.moveTo(0, finishY);
        ctx2.lineTo(this.width, finishY);
        ctx2.stroke();
        ctx2.setLineDash([]); // reset

        // "FINISH" text
        ctx2.font = 'bold 54px "Arial Rounded MT Bold", "Arial Black", sans-serif';
        ctx2.textAlign = 'center';
        ctx2.textBaseline = 'middle';

        // Red shadow
        ctx2.fillStyle = '#C22010';
        ctx2.fillText('FINISH', this.width / 2 + 3, finishY + 3);

        // White front text
        ctx2.fillStyle = '#FFFFFF';
        ctx2.fillText('FINISH', this.width / 2, finishY);
    }

    renderBall(ctx) {
        const ball = this.game.ball;
        if (!ball) return;

        // Shadow below ball
        const currentFloor = this.game.getCurrentFloor();
        if (currentFloor && ball.state !== 'FALLING_THROUGH_HOLE') {
            const groundDist = Math.max(0, currentFloor.y - ball.y);
            const shadowAlpha = Math.max(0, 0.45 - groundDist * 0.003);
            const shadowScale = Math.max(0.4, 1.0 - groundDist * 0.002);

            ctx.fillStyle = `rgba(10, 20, 30, ${shadowAlpha})`;
            ctx.beginPath();
            ctx.ellipse(ball.x, currentFloor.y + 4, ball.radius * shadowScale, ball.radius * 0.35 * shadowScale, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        // Draw ball sprite with rotation
        ctx.save();
        ctx.translate(ball.x, ball.y);
        ctx.rotate(ball.rotation || 0);

        if (this.images.ball) {
            ctx.drawImage(this.images.ball, -ball.radius, -ball.radius, ball.radius * 2, ball.radius * 2);
        } else {
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.arc(0, 0, ball.radius, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }

    renderClubAndAim(ctx) {
        const ball = this.game.ball;
        if (!ball) return;

        const isCharging = ball.state === 'CHARGING';
        const isSwinging = ball.state === 'SWINGING';
        if (!isCharging && !isSwinging) return;

        const aim = this.game.aim;
        const power = aim.power || 0; // 0.0 to 1.0
        const angle = aim.angleRad;   // Launch angle in radians (pointing up/target)
        const direction = aim.direction; // 1 = right, -1 = left

        // 1. Draw Directional Launch Arrow (only during CHARGING)
        if (isCharging) {
            this.renderLaunchArrow(ctx, ball.x, ball.y, angle, power, direction);
        }

        // 2. Draw Golf Club
        this.renderGolfClub(ctx, ball.x, ball.y, angle, power, direction, isSwinging);
    }

    renderLaunchArrow(ctx, bx, by, angle, power, direction) {
        ctx.save();
        ctx.translate(bx, by);

        // Arrow base points in launch direction
        const arrowLength = 110 + power * 180; // Dynamic growing arrow
        const arrowAngle = (direction === 1) ? -angle : -(Math.PI - angle);

        ctx.rotate(arrowAngle);

        const arrowWidth = 34;
        const tipLength = 46;

        // Path of stylized launch arrow polygon
        const path = new Path2D();
        path.moveTo(25, -arrowWidth / 2);
        path.lineTo(arrowLength - tipLength, -arrowWidth / 2);
        path.lineTo(arrowLength - tipLength, -arrowWidth * 0.95);
        path.lineTo(arrowLength + 15, 0);
        path.lineTo(arrowLength - tipLength, arrowWidth * 0.95);
        path.lineTo(arrowLength - tipLength, arrowWidth / 2);
        path.lineTo(25, arrowWidth / 2);
        path.closePath();

        // 1. Drop shadow / 3D base
        ctx.fillStyle = 'rgba(10, 25, 40, 0.35)';
        ctx.save();
        ctx.translate(0, 6);
        ctx.fill(path);
        ctx.restore();

        // 2. White solid body background
        ctx.fillStyle = '#FFFFFF';
        ctx.fill(path);

        // 3. Dynamic Power Gradient Fill inside arrow
        const totalArrowLen = arrowLength - 25;
        const currentFillLen = totalArrowLen * Math.max(0.1, Math.min(1.0, power));
        ctx.save();
        ctx.clip(path);

        const grad = ctx.createLinearGradient(25, 0, 25 + currentFillLen, 0);
        grad.addColorStop(0, '#5AC802');   // Vibrant Golf Green
        grad.addColorStop(0.4, '#FFDE17');  // Bright Yellow
        grad.addColorStop(0.75, '#FF7A00'); // Sunset Orange
        grad.addColorStop(1.0, '#E62418');  // Laser Red

        ctx.fillStyle = grad;
        ctx.fillRect(25, -arrowWidth * 2, currentFillLen, arrowWidth * 4);
        ctx.restore();

        // 4. Crisp outer border so arrow stands out on any backdrop
        ctx.strokeStyle = 'rgba(20, 45, 65, 0.45)';
        ctx.lineWidth = 4;
        ctx.stroke(path);

        ctx.restore();
    }

    renderGolfClub(ctx, bx, by, angle, power, direction, isSwinging) {
        if (!this.images.club) return;

        ctx.save();

        // Calculate swing or backswing
        let swingOffset = isSwinging ? this.game.swingProgress : (1.0 - power);
        let pullBackDist = 28 + (1.0 - swingOffset) * 65;
        let pullBackAngle = (1.0 - swingOffset) * 0.65; // ~37 degrees

        // Club position
        let clubX = bx - direction * pullBackDist;
        let clubY = by - 10 - (1.0 - swingOffset) * 25;

        ctx.translate(clubX, clubY);

        if (direction === -1) {
            ctx.scale(-1, 1); // Flip horizontally for left shots
        }

        // Rotate club
        ctx.rotate(-pullBackAngle);

        // Draw club (pivot is near club head)
        const cw = 75;
        const ch = 190;
        ctx.drawImage(this.images.club, -28, -ch + 20, cw, ch);

        ctx.restore();
    }

    renderParticles(ctx) {
        const particles = this.game.particles;
        particles.forEach(p => {
            ctx.save();
            ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rotation || 0);

            if (p.type === 'dust' && this.images.particle_dust) {
                const s = p.size * (1 + (1 - p.life / p.maxLife) * 0.5);
                ctx.drawImage(this.images.particle_dust, -s / 2, -s / 2, s, s);
            } else if (p.type === 'sparkle' && this.images.particle_sparkle) {
                const s = p.size;
                ctx.drawImage(this.images.particle_sparkle, -s / 2, -s / 2, s, s);
            } else {
                ctx.fillStyle = p.color || '#FFFFFF';
                ctx.beginPath();
                ctx.arc(0, 0, p.size, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        });
    }

    renderConfetti(ctx) {
        const confetti = this.game.confetti;
        confetti.forEach(c => {
            ctx.save();
            ctx.translate(c.x, c.y);
            ctx.rotate(c.angle);
            ctx.fillStyle = c.color;
            ctx.fillRect(-c.w / 2, -c.h / 2, c.w, c.h);
            ctx.restore();
        });
    }

    renderHeaderUI(ctx) {
        // 1. Red Ribbon Banner for Level Number (Centered at X: 540, Y: 100)
        const bannerW = 480;
        const bannerH = 130;
        const bannerX = (this.width - bannerW) / 2;
        const bannerY = 40;

        if (this.images.ui_banner) {
            ctx.drawImage(this.images.ui_banner, bannerX, bannerY, bannerW, bannerH);
        }

        // Level Text inside banner
        ctx.font = 'bold 50px "Arial Rounded MT Bold", "Arial Black", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(`LEVEL ${this.game.currentLevelIndex}`, this.width / 2, bannerY + 62);

        // 2. Crossed Clubs & "HOLD & RELEASE" Badge
        const badgeW = 340;
        const badgeH = 110;
        const badgeX = (this.width - badgeW) / 2;
        const badgeY = bannerY + 105;

        if (this.images.ui_hold_badge) {
            ctx.drawImage(this.images.ui_hold_badge, badgeX, badgeY, badgeW, badgeH);
        }

        ctx.font = 'bold 26px "Arial Rounded MT Bold", "Arial", sans-serif';
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText('HOLD & RELEASE', this.width / 2, badgeY + 80);

        // 3. Top-Right Buttons (Home, Levels, Restart)
        const btnRadius = 38;
        const btnX = 990;

        // Button 1: Home (Y: 65)
        if (this.images.ui_btn_home) {
            ctx.drawImage(this.images.ui_btn_home, btnX - btnRadius, 30, btnRadius * 2, btnRadius * 2);
        }

        // Button 2: Levels (Y: 150)
        if (this.images.ui_btn_levels) {
            ctx.drawImage(this.images.ui_btn_levels, btnX - btnRadius, 118, btnRadius * 2, btnRadius * 2);
        }

        // Button 3: Restart (Y: 235)
        if (this.images.ui_btn_restart) {
            ctx.drawImage(this.images.ui_btn_restart, btnX - btnRadius, 206, btnRadius * 2, btnRadius * 2);
        }

        // 4. Shots Counter Badge (Top-Left)
        ctx.fillStyle = 'rgba(25, 35, 45, 0.85)';
        ctx.beginPath();
        ctx.roundRect(40, 48, 140, 52, 26);
        ctx.fill();
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.font = 'bold 24px Arial, sans-serif';
        ctx.fillStyle = '#FFFFFF';
        ctx.textAlign = 'center';
        ctx.fillText(`SHOTS: ${this.game.strokes}`, 110, 75);
    }

    renderModals(ctx) {
        if (this.game.state === 'LEVEL_WON') {
            // Victory overlay
            ctx.fillStyle = 'rgba(15, 25, 35, 0.78)';
            ctx.fillRect(0, 0, this.width, this.height);

            // Dialog box
            const dw = 720;
            const dh = 560;
            const dx = (this.width - dw) / 2;
            const dy = (this.height - dh) / 2 - 40;

            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.roundRect(dx, dy, dw, dh, 36);
            ctx.fill();
            ctx.lineWidth = 8;
            ctx.strokeStyle = '#67C014';
            ctx.stroke();

            // Victory Title
            ctx.font = 'bold 64px "Arial Rounded MT Bold", sans-serif';
            ctx.fillStyle = '#214462';
            ctx.textAlign = 'center';
            ctx.fillText('LEVEL COMPLETED!', this.width / 2, dy + 90);

            // Stars rating (3 golden stars)
            for (let i = -1; i <= 1; i++) {
                const sx = this.width / 2 + i * 110;
                const sy = dy + 180;
                this.drawStar(ctx, sx, sy, 38, '#FFC820', '#E5A010');
            }

            // Stroke Stats
            ctx.font = 'bold 36px Arial, sans-serif';
            ctx.fillStyle = '#455A64';
            ctx.fillText(`Total Shots: ${this.game.strokes} (Par: ${this.game.currentLevelData.par})`, this.width / 2, dy + 270);

            // "NEXT LEVEL" Button
            const btnW = 380;
            const btnH = 88;
            const bx = (this.width - btnW) / 2;
            const by = dy + 360;

            ctx.fillStyle = '#67C014';
            ctx.beginPath();
            ctx.roundRect(bx, by, btnW, btnH, 44);
            ctx.fill();
            ctx.fillStyle = '#89DB26';
            ctx.beginPath();
            ctx.roundRect(bx, by, btnW, 20, [44, 44, 0, 0]);
            ctx.fill();

            ctx.font = 'bold 40px "Arial Rounded MT Bold", sans-serif';
            ctx.fillStyle = '#FFFFFF';
            ctx.fillText('NEXT LEVEL ➔', this.width / 2, by + 46);
        } else if (this.game.state === 'LEVEL_SELECT') {
            // Level selection dialog
            ctx.fillStyle = 'rgba(15, 25, 35, 0.85)';
            ctx.fillRect(0, 0, this.width, this.height);

            const dw = 760;
            const dh = 720;
            const dx = (this.width - dw) / 2;
            const dy = (this.height - dh) / 2;

            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.roundRect(dx, dy, dw, dh, 36);
            ctx.fill();

            ctx.font = 'bold 52px "Arial Rounded MT Bold", sans-serif';
            ctx.fillStyle = '#214462';
            ctx.textAlign = 'center';
            ctx.fillText('SELECT LEVEL', this.width / 2, dy + 80);

            // Level Buttons
            LEVELS_DATA.forEach((lvl, idx) => {
                const col = idx % 3;
                const row = Math.floor(idx / 3);
                const lx = dx + 120 + col * 200;
                const ly = dy + 180 + row * 180;
                const size = 130;

                ctx.fillStyle = (lvl.levelNumber === this.game.currentLevelIndex) ? '#FF7A00' : '#67C014';
                ctx.beginPath();
                ctx.roundRect(lx - size / 2, ly - size / 2, size, size, 24);
                ctx.fill();

                ctx.font = 'bold 50px Arial, sans-serif';
                ctx.fillStyle = '#FFFFFF';
                ctx.fillText(`${lvl.levelNumber}`, lx, ly + 6);
            });

            // Close button
            ctx.font = 'bold 32px Arial, sans-serif';
            ctx.fillStyle = '#78909C';
            ctx.fillText('Tap anywhere to close', this.width / 2, dy + dh - 40);
        }
    }

    drawStar(ctx, cx, cy, r, fillColor, strokeColor) {
        ctx.save();
        ctx.fillStyle = fillColor;
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 4;
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
            ctx.lineTo(
                cx + r * Math.cos((18 + i * 72) * Math.PI / 180),
                cy - r * Math.sin((18 + i * 72) * Math.PI / 180)
            );
            ctx.lineTo(
                cx + (r / 2) * Math.cos((54 + i * 72) * Math.PI / 180),
                cy - (r / 2) * Math.sin((54 + i * 72) * Math.PI / 180)
            );
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
    }
}

window.GameRenderer = GameRenderer;
