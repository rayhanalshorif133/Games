// Main Game Loop, Input Controller, and Renderer
// Fixed 1080x1920 layout with ultra-smooth 60+ FPS performance

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');

        // Target virtual resolution
        this.width = 1080;
        this.height = 1920;
        this.canvas.width = this.width;
        this.canvas.height = this.height;

        // Assets
        this.assets = {};
        this.loadAssets();

        // Game Speed & Progression (Slower, relaxing arcade pace)
        this.baseSpeed = 10;          // Initial very slow descent speed (px/s)
        this.accelerationRate = 0.35; // Very gentle speed increase per second
        this.maxSpeed = 75;           // Max speed cap
        this.currentDescentSpeed = this.baseSpeed;
        this.gameTime = 0;

        // Game State
        this.score = 0;
        this.displayScore = 0;
        this.lives = 5;
        this.maxLives = 5;
        this.patternIndex = 0;
        this.dangerLineY = 1380; // Danger line above slingshot
        this.gameOverReason = '';
        this.screenShakeTime = 0;
        this.screenShakeIntensity = 0;
        this.dangerWarningPulse = 0;

        this.jellies = [];
        this.activeBalls = [];
        this.loadedBall = null;
        this.particles = [];
        this.floatingTexts = [];
        this.slingshot = new window.Slingshot();
        this.colorSwitcher = new window.ColorSwitcher();
        this.combo = 0;
        this.rushTimer = 0;
        this.rushCooldown = 0;
        this.isRushing = false;
        this.gameState = 'PLAYING'; // PLAYING, GAME_OVER, PAUSED

        // Bindings & Setup
        this.lastTime = performance.now();
        this.setupInputs();
        this.startNewGame();

        // Start game loop
        requestAnimationFrame((t) => this.loop(t));
    }

    loadAssets() {
        const assetList = [
            { key: 'bolt', src: 'assets/bolt.png' },
            { key: 'home_button', src: 'assets/home_button.png' },
            { key: 'pupil', src: 'assets/pupil.png' },
            { key: 'ball_red', src: 'assets/ball_red.png' },
            { key: 'ball_yellow', src: 'assets/ball_yellow.png' },
            { key: 'ball_green', src: 'assets/ball_green.png' },
            { key: 'ball_blue', src: 'assets/ball_blue.png' },
            { key: 'jelly_red', src: 'assets/jelly_red.png' },
            { key: 'jelly_yellow', src: 'assets/jelly_yellow.png' },
            { key: 'jelly_green', src: 'assets/jelly_green.png' },
            { key: 'jelly_blue', src: 'assets/jelly_blue.png' },
            { key: 'jelly_grey', src: 'assets/jelly_grey.png' },
            { key: 'jelly_tall_red', src: 'assets/jelly_tall_red.png' },
            { key: 'jelly_tall_yellow', src: 'assets/jelly_tall_yellow.png' },
            { key: 'jelly_tall_green', src: 'assets/jelly_tall_green.png' },
            { key: 'jelly_tall_blue', src: 'assets/jelly_tall_blue.png' },
            { key: 'jelly_tall_grey', src: 'assets/jelly_tall_grey.png' },
        ];

        assetList.forEach(item => {
            const img = new Image();
            img.src = item.src;
            this.assets[item.key] = img;
        });
    }

    startNewGame() {
        this.score = 0;
        this.displayScore = 0;
        this.lives = this.maxLives;
        this.gameTime = 0;
        this.currentDescentSpeed = this.baseSpeed;
        this.patternIndex = 0;
        this.jellies = [];
        this.activeBalls = [];
        this.particles = [];
        this.floatingTexts = [];
        this.combo = 0;
        this.rushTimer = 0;
        this.rushCooldown = 0;
        this.isRushing = false;
        this.gameOverReason = '';
        this.gameState = 'PLAYING';

        // Spawn first two continuous patterns
        const firstWave = window.PatternSpawner.getPattern(this.patternIndex++, 240);
        const secondWave = window.PatternSpawner.getPattern(this.patternIndex++, -320);
        this.jellies = [...firstWave, ...secondWave];

        // Load initial ball with selected color
        this.loadBall(this.colorSwitcher.activeColor);

        this.floatingTexts.push(new window.FloatingText(540, 900, 'READY... POP!', '#ffd700'));
    }

    loadBall(color) {
        const ballColor = color || this.colorSwitcher.activeColor;
        this.loadedBall = new window.Ball(this.slingshot.rest.x, this.slingshot.rest.y, ballColor);
    }

    switchBallColor(newColor) {
        this.colorSwitcher.setColor(newColor);
        if (this.loadedBall) {
            this.loadedBall.color = newColor;
        } else {
            this.loadBall(newColor);
        }
        window.sounds.init();
        window.sounds.playBounce(1200);
        this.floatingTexts.push(new window.FloatingText(540, 1680, newColor.toUpperCase() + ' BALL!', '#ffffff'));
    }

    triggerScreenShake(intensity = 15, duration = 0.3) {
        this.screenShakeIntensity = intensity;
        this.screenShakeTime = duration;
    }

    triggerGameOver(reason) {
        if (this.gameState === 'GAME_OVER') return;
        this.gameState = 'GAME_OVER';
        this.gameOverReason = reason;
        window.sounds.playGameOver();
        this.triggerScreenShake(24, 0.5);
    }

    setupInputs() {
        let touchStartPos = null;
        let isDraggingCylinder = false;
        let lastCylinderX = 0;

        const getCanvasCoords = (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const clientX = e.touches && e.touches.length > 0 ? e.touches[0].clientX : (e.clientX || 0);
            const clientY = e.touches && e.touches.length > 0 ? e.touches[0].clientY : (e.clientY || 0);
            const scaleX = this.width / rect.width;
            const scaleY = this.height / rect.height;
            return {
                x: (clientX - rect.left) * scaleX,
                y: (clientY - rect.top) * scaleY
            };
        };

        const handleStart = (coords) => {
            window.sounds.init();
            touchStartPos = { x: coords.x, y: coords.y };

            // Retry click on Game Over
            if (this.gameState === 'GAME_OVER') {
                const mx = (this.width - 740) / 2;
                const my = (this.height - 640) / 2;
                if (coords.x >= mx + 100 && coords.x <= mx + 640 &&
                    coords.y >= my + 440 && coords.y <= my + 560) {
                    this.startNewGame();
                }
                return;
            }

            if (this.gameState !== 'PLAYING') return;

            // Check if player clicked/swiped the 3D Revolver Cylinder Chamber at bottom
            if (coords.y >= 1690) {
                isDraggingCylinder = true;
                lastCylinderX = coords.x;
                const clickedColor = this.colorSwitcher.checkClick(coords.x, coords.y);
                if (clickedColor) {
                    this.switchBallColor(clickedColor);
                }
                return;
            }

            // Check if player clicked near resting ball/slingshot to aim
            if (this.loadedBall) {
                this.slingshot.startDrag(coords.x, coords.y);
            }
        };

        const handleMove = (coords) => {
            if (isDraggingCylinder) {
                const dx = coords.x - lastCylinderX;
                lastCylinderX = coords.x;
                this.colorSwitcher.targetAngle -= (dx / 85);
                const activeCol = this.colorSwitcher.colors[this.colorSwitcher.getFrontIndex()];
                this.switchBallColor(activeCol);
                return;
            }

            if (this.slingshot.isDragging) {
                this.slingshot.updateDrag(coords.x, coords.y);
            }
        };

        const handleEnd = (e) => {
            if (isDraggingCylinder) {
                isDraggingCylinder = false;
                // Snap cylinder angle to closest slot
                const snapped = Math.round(this.colorSwitcher.targetAngle / (Math.PI / 2)) * (Math.PI / 2);
                this.colorSwitcher.targetAngle = snapped;
                const activeCol = this.colorSwitcher.colors[this.colorSwitcher.getFrontIndex()];
                this.switchBallColor(activeCol);
            }

            if (this.slingshot.isDragging && this.loadedBall) {
                const launch = this.slingshot.release();
                if (launch) {
                    // Fire the ball!
                    const firedBall = new window.Ball(launch.x, launch.y, this.loadedBall.color, launch.vx, launch.vy);
                    this.activeBalls.push(firedBall);
                    this.loadedBall = null;

                    // Automatically reload next ball with active color
                    setTimeout(() => {
                        if (!this.loadedBall && this.gameState === 'PLAYING') {
                            this.loadBall(this.colorSwitcher.activeColor);
                        }
                    }, 160);
                } else if (touchStartPos) {
                    // Tap on resting ball without pulling: cycle revolver to next color!
                    const distFromRest = Math.hypot(touchStartPos.x - this.slingshot.rest.x, touchStartPos.y - this.slingshot.rest.y);
                    if (distFromRest < 90) {
                        const nextCol = this.colorSwitcher.cycleNext();
                        this.switchBallColor(nextCol);
                    }
                }
            }
            touchStartPos = null;
        };

        // Mouse Listeners
        window.addEventListener('mousedown', (e) => {
            const c = getCanvasCoords(e);
            handleStart(c);
        });
        window.addEventListener('mousemove', (e) => {
            const c = getCanvasCoords(e);
            handleMove(c);
        });
        window.addEventListener('mouseup', handleEnd);

        // Touch Listeners
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const c = getCanvasCoords(e);
            handleStart(c);
        }, { passive: false });

        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const c = getCanvasCoords(e);
            handleMove(c);
        }, { passive: false });

        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            handleEnd(e);
        }, { passive: false });
    }

    loop(currentTime) {
        let dt = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;

        // Cap dt to prevent huge leaps if tab was inactive
        if (dt > 0.05) dt = 0.05;

        this.update(dt);
        this.render();

        requestAnimationFrame((t) => this.loop(t));
    }

    update(dt) {
        // Smooth score counter
        if (this.displayScore < this.score) {
            this.displayScore = Math.min(this.score, this.displayScore + Math.max(1, Math.ceil((this.score - this.displayScore) * 10 * dt)));
        }

        // Screen shake decay
        if (this.screenShakeTime > 0) {
            this.screenShakeTime -= dt;
        } else {
            this.screenShakeIntensity = 0;
        }

        // Color switcher update
        this.colorSwitcher.update(dt);

        if (this.gameState !== 'PLAYING') return;

        // Survival Time & Gradual Speed Acceleration
        this.gameTime += dt;

        // Update Speed Surge Timers
        if (this.rushCooldown > 0) {
            this.rushCooldown -= dt;
        }

        if (this.rushTimer > 0) {
            this.rushTimer -= dt;
            if (this.rushTimer <= 0) {
                this.isRushing = false;
            }
        }

        // Calculate Target Speed (Normal vs Temporary Speed Surge)
        let targetSpeed = Math.min(
            this.maxSpeed,
            this.baseSpeed + this.gameTime * this.accelerationRate
        );

        if (this.isRushing) {
            targetSpeed = 135; // Fast catch-up descent speed
        }

        // Smooth speed transition
        this.currentDescentSpeed += (targetSpeed - this.currentDescentSpeed) * 6.0 * dt;

        // Update Slingshot
        this.slingshot.update(dt);

        // Target ball for Jelly Eye Tracking
        let focusBall = null;
        if (this.slingshot.isDragging && this.loadedBall) {
            focusBall = { x: this.slingshot.pos.x, y: this.slingshot.pos.y };
        } else if (this.activeBalls.length > 0) {
            focusBall = this.activeBalls[0];
        } else if (this.loadedBall) {
            focusBall = this.loadedBall;
        }

        // Update Jellies & Check Continuous Spawning + Danger Line
        let lowestBlockY = 0;
        let highestBlockY = 9999;
        let aliveCount = 0;

        for (let i = this.jellies.length - 1; i >= 0; i--) {
            const jelly = this.jellies[i];
            if (!jelly.isAlive) {
                this.jellies.splice(i, 1);
                continue;
            }

            aliveCount++;
            jelly.update(dt, focusBall, this.currentDescentSpeed);

            lowestBlockY = Math.max(lowestBlockY, jelly.y + jelly.h);
            highestBlockY = Math.min(highestBlockY, jelly.y);

            // Danger line breach check: Game Over!
            if (jelly.y + jelly.h >= this.dangerLineY) {
                this.triggerGameOver('BLOCKS BREACHED THE DANGER LINE!');
                return;
            }
        }

        // Speed Surge Check: If player destroyed blocks and only top 20% has blocks (lowestBlockY < 460)
        if (!this.isRushing && this.rushCooldown <= 0 && lowestBlockY > 0 && lowestBlockY < 460) {
            this.isRushing = true;
            this.rushTimer = 3.0; // 3 seconds speed surge
            this.rushCooldown = 5.0;
            this.floatingTexts.push(new window.FloatingText(540, 520, '⚡ SPEED SURGE! ⚡', '#00f0ff'));
        }

        // If in speed surge and blocks have arrived in reachable zone (lowestBlockY >= 780), return to normal speed
        if (this.isRushing && lowestBlockY >= 780) {
            this.isRushing = false;
            this.rushTimer = 0;
        }

        // Danger line warning pulse when blocks are nearby
        if (lowestBlockY >= this.dangerLineY - 180) {
            this.dangerWarningPulse += dt * 8.5;
        } else {
            this.dangerWarningPulse = 0;
        }

        // Continuous Wave Spawner: when top wave moves down into visible zone, queue next pattern above
        if (highestBlockY > 0 || this.jellies.length === 0) {
            const spawnBaseY = (highestBlockY < 9000 && highestBlockY > -100) ? (highestBlockY - 440) : -300;
            const newPattern = window.PatternSpawner.getPattern(this.patternIndex++, spawnBaseY);
            this.jellies.push(...newPattern);
        }

        // Update Active Balls & Collisions
        for (let i = this.activeBalls.length - 1; i >= 0; i--) {
            const ball = this.activeBalls[i];
            ball.update(dt);

            // Track if ball has passed above the danger line into playfield
            if (ball.y < this.dangerLineY) {
                ball.passedDangerLine = true;
            }

            // Check if returning ball crossed below danger line: lose 1 life and destroy ball!
            if (ball.passedDangerLine && ball.y >= this.dangerLineY && ball.vy > 0) {
                ball.isAlive = false;
                this.lives--;
                this.combo = 0;
                this.triggerScreenShake(14, 0.3);
                window.sounds.playMiss();

                // Spawn miss particles at danger line
                for (let p = 0; p < 24; p++) {
                    this.particles.push(new window.Particle(ball.x, this.dangerLineY, '#ff3344'));
                }

                // Floating penalty text
                this.floatingTexts.push(new window.FloatingText(
                    Math.min(900, Math.max(180, ball.x)),
                    this.dangerLineY + 50,
                    'MISS! -1 ❤️',
                    '#ff3344'
                ));

                if (this.lives <= 0) {
                    this.triggerGameOver('OUT OF LIVES!');
                    return;
                }
            }

            // 1. Wall Collisions
            window.Physics.checkBallWall(ball);

            // 2. Jelly Collisions
            for (let j = 0; j < this.jellies.length; j++) {
                const jelly = this.jellies[j];
                if (!jelly.isAlive) continue;

                if (window.Physics.checkBallJelly(ball, jelly)) {
                    if (ball.color === jelly.color) {
                        // COLOR MATCH POP: Destroy BOTH block and ball!
                        jelly.isAlive = false;
                        ball.isAlive = false;
                        this.combo++;
                        const points = 15 * Math.min(this.combo, 5);
                        this.score += points;

                        // Push remaining blocks UPWARDS slightly (giving the player breathing room!)
                        const pushBack = 45 + Math.min(this.combo, 5) * 8;
                        this.jellies.forEach(otherJelly => {
                            if (otherJelly.isAlive) {
                                otherJelly.y -= pushBack;
                                otherJelly.targetY -= pushBack;
                                otherJelly.triggerHitReaction();
                            }
                        });

                        // Sound with combo pitch
                        window.sounds.playPop(this.combo);

                        // Explosion particles
                        const particleColor = {
                            red: '#ff4d64',
                            yellow: '#ffd214',
                            green: '#00e86b',
                            blue: '#00b7ff'
                        }[jelly.color] || '#ffffff';

                        for (let p = 0; p < 26; p++) {
                            this.particles.push(new window.Particle(ball.x, ball.y, particleColor));
                            this.particles.push(new window.Particle(jelly.x + jelly.w / 2, jelly.y + jelly.h / 2, particleColor));
                        }

                        // Floating score
                        const comboText = this.combo > 1 ? `+${points} (x${this.combo}) ⬆️` : `+${points} ⬆️`;
                        this.floatingTexts.push(new window.FloatingText(jelly.x + jelly.w / 2, jelly.y, comboText, particleColor));

                        // 3-Streak Combo Bonus!
                        if (this.combo === 3 || (this.combo > 3 && this.combo % 3 === 0)) {
                            this.score += 100;
                            let lifeText = '';
                            if (this.lives < this.maxLives) {
                                this.lives++;
                                lifeText = ' +1 ❤️';
                            }

                            // Mega Upward Pushback
                            this.jellies.forEach(otherJelly => {
                                if (otherJelly.isAlive) {
                                    otherJelly.y -= 90;
                                    otherJelly.targetY -= 90;
                                    otherJelly.triggerHitReaction();
                                }
                            });

                            // Confetti burst
                            const rainbowColors = ['#ffd700', '#ff3366', '#00e86b', '#00c3ff', '#ffffff'];
                            for (let c = 0; c < 45; c++) {
                                this.particles.push(new window.Particle(540, 700, rainbowColors[c % rainbowColors.length]));
                            }

                            // Triumphant sound
                            window.sounds.playWin();

                            // Big bonus popup banner
                            this.floatingTexts.push(new window.FloatingText(540, 680, `🔥 ${this.combo}x COMBO BONUS! +100 PTS${lifeText} 🔥`, '#ffd700'));
                        }

                        break; // Stop checking collisions for this ball since it's destroyed
                    } else {
                        // Wrong color hit reaction & bounce
                        jelly.triggerWrongHitReaction();
                        this.combo = 0;
                        const speed = Math.hypot(ball.vx, ball.vy);
                        window.sounds.playWrongHit();
                        window.sounds.playBounce(speed);
                    }
                }
            }

            // 3. Remove dead balls & reload slingshot if empty
            if (!ball.isAlive) {
                this.activeBalls.splice(i, 1);
                this.combo = 0;
                if (!this.loadedBall) {
                    this.loadBall(this.colorSwitcher.activeColor);
                }
            }
        }

        // Update Particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            this.particles[i].update(dt);
            if (!this.particles[i].isAlive) {
                this.particles.splice(i, 1);
            }
        }

        // Update Floating Texts
        for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
            this.floatingTexts[i].update(dt);
            if (!this.floatingTexts[i].isAlive) {
                this.floatingTexts.splice(i, 1);
            }
        }
    }

    render() {
        const ctx = this.ctx;

        ctx.save();
        // Screen shake translation
        if (this.screenShakeTime > 0) {
            const ox = (Math.random() - 0.5) * this.screenShakeIntensity * 2;
            const oy = (Math.random() - 0.5) * this.screenShakeIntensity * 2;
            ctx.translate(ox, oy);
        }

        // 1. Clear background (Warm pastel yellow)
        ctx.fillStyle = '#f6e99d';
        ctx.fillRect(0, 0, this.width, this.height);

        // Ambient soft clouds / decorative blobs
        ctx.fillStyle = 'rgba(255, 245, 175, 0.45)';
        ctx.beginPath();
        ctx.ellipse(320, 500, 240, 180, 0.2, 0, Math.PI * 2);
        ctx.ellipse(780, 850, 260, 200, -0.2, 0, Math.PI * 2);
        ctx.ellipse(400, 1200, 280, 210, 0.1, 0, Math.PI * 2);
        ctx.fill();

        // 2. Outer decorative rounded frame (cyan/blue border)
        ctx.strokeStyle = '#00a0e9';
        ctx.lineWidth = 18;
        ctx.beginPath();
        ctx.roundRect(9, 9, this.width - 18, this.height - 18, 48);
        ctx.stroke();

        // Inner dark border line
        ctx.strokeStyle = '#22252a';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.roundRect(18, 18, this.width - 36, this.height - 36, 42);
        ctx.stroke();

        // 3. Draw Danger Deadline
        this.drawDangerLine(ctx);

        // 4. Draw Jellies
        const ballImgMap = {
            red: this.assets.ball_red,
            yellow: this.assets.ball_yellow,
            green: this.assets.ball_green,
            blue: this.assets.ball_blue
        };

        const jellySpriteMap = {
            jelly_red: this.assets.jelly_red,
            jelly_yellow: this.assets.jelly_yellow,
            jelly_green: this.assets.jelly_green,
            jelly_blue: this.assets.jelly_blue,
            jelly_grey: this.assets.jelly_grey,
            jelly_tall_red: this.assets.jelly_tall_red,
            jelly_tall_yellow: this.assets.jelly_tall_yellow,
            jelly_tall_green: this.assets.jelly_tall_green,
            jelly_tall_blue: this.assets.jelly_tall_blue,
            jelly_tall_grey: this.assets.jelly_tall_grey,
        };

        this.jellies.forEach(jelly => {
            jelly.draw(ctx, jellySpriteMap, this.assets.pupil);
        });

        // 5. Draw Aim Trajectory Preview
        if (this.slingshot.isDragging && this.loadedBall) {
            const trajectory = this.slingshot.getTrajectory(this.loadedBall.color);
            ctx.save();
            trajectory.forEach((pt, idx) => {
                if (idx % 2 === 0) {
                    ctx.fillStyle = `rgba(255, 255, 255, ${pt.alpha * 0.85})`;
                    ctx.beginPath();
                    ctx.arc(pt.x, pt.y, Math.max(3, 10 - idx * 0.22), 0, Math.PI * 2);
                    ctx.fill();
                }
            });
            ctx.restore();
        }

        // 6. Draw Slingshot Band, Loaded Ball, and Anchor Bolts
        this.slingshot.draw(ctx, this.assets.bolt, this.loadedBall, ballImgMap);

        // 7. Draw Airborne Balls
        this.activeBalls.forEach(ball => {
            ball.draw(ctx, ballImgMap);
        });

        // 8. Draw Color Selector Dock
        this.colorSwitcher.draw(ctx, ballImgMap);

        // 9. Draw Particles
        this.particles.forEach(p => p.draw(ctx));

        // 10. Draw Floating Texts
        this.floatingTexts.forEach(ft => ft.draw(ctx));

        // 11. Draw Clean Golden Header Bar with "Score : X"
        this.drawHeader(ctx);

        // 12. Draw Game Over Overlay
        if (this.gameState === 'GAME_OVER') {
            this.drawGameOverOverlay(ctx);
        }

        ctx.restore();
    }

    drawDangerLine(ctx) {
        ctx.save();

        const pulseAlpha = this.dangerWarningPulse > 0 ? 
            (Math.sin(this.dangerWarningPulse) * 0.35 + 0.65) : 0.45;

        // Glowing backdrop behind line
        ctx.strokeStyle = `rgba(255, 40, 60, ${pulseAlpha * 0.4})`;
        ctx.lineWidth = 14;
        ctx.beginPath();
        ctx.moveTo(40, this.dangerLineY);
        ctx.lineTo(this.width - 40, this.dangerLineY);
        ctx.stroke();

        // Dashed danger line
        ctx.strokeStyle = `rgba(255, 30, 50, ${pulseAlpha})`;
        ctx.lineWidth = 5;
        ctx.setLineDash([24, 16]);
        ctx.beginPath();
        ctx.moveTo(45, this.dangerLineY);
        ctx.lineTo(this.width - 45, this.dangerLineY);
        ctx.stroke();
        ctx.setLineDash([]);

        // Danger Warning Tag
        ctx.font = "900 24px 'Fredoka', sans-serif";
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const tagText = this.dangerWarningPulse > 0 ? "⚠️ DANGER: BLOCKS TOO CLOSE! ⚠️" : "⚠️ DEADLINE ⚠️";
        const tagW = ctx.measureText(tagText).width + 36;
        
        ctx.fillStyle = `rgba(255, 30, 50, ${pulseAlpha * 0.9})`;
        ctx.beginPath();
        ctx.roundRect((this.width - tagW) / 2, this.dangerLineY - 18, tagW, 36, 12);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.fillText(tagText, this.width / 2, this.dangerLineY);

        ctx.restore();
    }

    drawHeader(ctx) {
        const h = 135;
        const w = this.width;

        // Outer header shadow
        ctx.fillStyle = 'rgba(50, 40, 10, 0.25)';
        ctx.beginPath();
        ctx.roundRect(18, 18, w - 36, h, [36, 36, 30, 30]);
        ctx.fill();

        // Header Background Gradient (Glossy Gold / Yellow)
        const grad = ctx.createLinearGradient(0, 18, 0, 18 + h);
        grad.addColorStop(0, '#fff44f');
        grad.addColorStop(0.3, '#ffcc00');
        grad.addColorStop(0.85, '#ff9900');
        grad.addColorStop(1, '#ea7f00');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.roundRect(18, 18, w - 36, h, [36, 36, 28, 28]);
        ctx.fill();

        // Dark lower stroke outline on header
        ctx.strokeStyle = '#382208';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.roundRect(18, 18, w - 36, h, [36, 36, 28, 28]);
        ctx.stroke();

        // Top glossy white highlight pill
        const highlightGrad = ctx.createLinearGradient(0, 22, 0, 52);
        highlightGrad.addColorStop(0, 'rgba(255, 255, 255, 0.85)');
        highlightGrad.addColorStop(1, 'rgba(255, 255, 255, 0.05)');
        ctx.fillStyle = highlightGrad;
        ctx.beginPath();
        ctx.roundRect(32, 24, w - 64, 34, 17);
        ctx.fill();

        // Score Text ("Score : 0")
        ctx.save();
        ctx.font = "900 60px 'Fredoka', 'Nunito', 'Arial Rounded MT Bold', sans-serif";
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const textX = w / 2 - 50;
        const textY = 18 + h / 2 + 2;
        const scoreStr = `Score : ${this.displayScore}`;

        // Dark warm 3D shadow underneath text
        ctx.fillStyle = '#4c2608';
        ctx.fillText(scoreStr, textX, textY + 5);

        // Crisp white text
        ctx.fillStyle = '#ffffff';
        ctx.fillText(scoreStr, textX, textY);

        // Lives Hearts on Header Right (5 hearts)
        const heartsX = w - 150;
        const heartsY = 18 + h / 2 + 2;
        for (let i = 0; i < this.maxLives; i++) {
            const hx = heartsX + (i - 2) * 34;
            const hasHeart = (i < this.lives);
            ctx.font = '28px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(hasHeart ? '❤️' : '🖤', hx, heartsY);
        }

        ctx.restore();
    }

    drawGameOverOverlay(ctx) {
        ctx.save();
        ctx.fillStyle = 'rgba(20, 10, 15, 0.85)';
        ctx.fillRect(0, 0, this.width, this.height);

        // Modal Box
        const mw = 760;
        const mh = 660;
        const mx = (this.width - mw) / 2;
        const my = (this.height - mh) / 2;

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.roundRect(mx, my, mw, mh, 40);
        ctx.fill();

        // Red / Gold border
        ctx.strokeStyle = '#ff3344';
        ctx.lineWidth = 10;
        ctx.stroke();

        // Title
        ctx.font = "900 70px 'Fredoka', sans-serif";
        ctx.fillStyle = '#d9142e';
        ctx.textAlign = 'center';
        ctx.fillText('💀 GAME OVER', this.width / 2, my + 130);

        // Reason subtitle
        ctx.font = "700 32px 'Fredoka', sans-serif";
        ctx.fillStyle = '#555555';
        ctx.fillText(this.gameOverReason || 'TRY AGAIN!', this.width / 2, my + 210);

        // Final Score Banner
        ctx.fillStyle = '#fff4d6';
        ctx.beginPath();
        ctx.roundRect(mx + 80, my + 260, mw - 160, 120, 20);
        ctx.fill();
        ctx.strokeStyle = '#ffaa00';
        ctx.lineWidth = 4;
        ctx.stroke();

        ctx.font = "900 48px 'Fredoka', sans-serif";
        ctx.fillStyle = '#4c2608';
        ctx.fillText(`Final Score: ${this.score}`, this.width / 2, my + 332);

        // Large RETRY Button
        const btnY = my + 440;
        const btnH = 110;
        const btnW = mw - 200;
        const btnX = mx + 100;

        const btnGrad = ctx.createLinearGradient(0, btnY, 0, btnY + btnH);
        btnGrad.addColorStop(0, '#ffbb00');
        btnGrad.addColorStop(1, '#ff6600');

        ctx.fillStyle = btnGrad;
        ctx.beginPath();
        ctx.roundRect(btnX, btnY, btnW, btnH, 32);
        ctx.fill();

        ctx.strokeStyle = '#381c00';
        ctx.lineWidth = 6;
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = "900 52px 'Fredoka', sans-serif";
        ctx.fillText('🔄 RETRY', this.width / 2, btnY + 70);

        ctx.restore();
    }
}

window.Game = Game;

// Initialize when window loads
if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
    window.addEventListener('DOMContentLoaded', () => {
        window.game = new Game();
    });
}
