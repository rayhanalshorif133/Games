/**
 * Player Car Entity & Controller
 * Implements smooth vehicle dynamics, progressive speed acceleration, steering,
 * nitro inventory boost system, fuel consumption, and dramatic crash explosions with airborne flying physics.
 */

class Player {
    constructor(game) {
        this.game = game;
        this.reset();
    }

    reset() {
        this.w = 100;
        this.h = 190;
        this.x = 540;
        this.y = 1450;

        this.vx = 0;
        this.targetX = 540;
        this.speed = 0;          // Current road scrolling speed (pixels / frame)
        this.baseMinSpeed = 6;
        this.baseNormalSpeed = 16;
        this.baseTopSpeed = 26;
        this.baseNitroSpeed = 38;

        this.minSpeed = 6;
        this.normalSpeed = 16;
        this.topSpeed = 26;
        this.nitroSpeed = 38;

        this.angle = 0;          // Steering tilt angle
        this.tiltSmooth = 0.15;

        this.fuel = 100;
        this.maxFuel = 100;
        this.fuelBurnRate = 0.045; // Depletes over ~35-40 seconds if no fuel picked up

        // Nitro Count System (Starts with 1 default nitro charge)
        this.nitroCount = 1;
        this.nitroDuration = 180; // 3 seconds boost at 60fps
        this.nitroTimer = 0;
        this.isNitroActive = false;

        this.hasShield = false;
        this.shieldTimer = 0;

        this.hasMagnet = false;
        this.magnetTimer = 0;

        this.isSpinning = false;
        this.spinAngle = 0;
        this.spinTimer = 0;

        // Crash and Airborne Physics
        this.isAirborne = false;
        this.airborneTimer = 0;
        this.airborneDuration = 60;
        this.flyVx = 0;
        this.flyVy = 0;
        this.altitude = 0;
        this.gravity = 0.85;
        this.tumbleAngle = 0;
        this.spinSpeed = 0;
        this.crashReason = '';

        // Controlled Stunt Jump Physics
        this.isJumping = false;
        this.jumpAltitude = 0;
        this.jumpVy = 0;
        this.jumpGravity = 0.62;
        this.jumpAirTime = 0;
        this.jumpCarClearCount = 0;

        this.isAlive = true;
        this.distance = 0;
        this.score = 0;
        this.coins = 0;
    }

    revive() {
        this.isAlive = true;
        this.isAirborne = false;
        this.isJumping = false;
        this.jumpAltitude = 0;
        this.jumpVy = 0;
        this.jumpAirTime = 0;
        this.jumpCarClearCount = 0;
        this.airborneTimer = 0;
        this.flyVx = 0;
        this.flyVy = 0;
        this.altitude = 0;
        this.tumbleAngle = 0;
        this.angle = 0;
        this.vx = 0;
        this.x = 540;
        this.y = 1450;
        this.targetX = 540;
        this.speed = this.normalSpeed;
        this.isSpinning = false;
        this.spinAngle = 0;
        this.fuel = this.maxFuel;
        this.addShield(400); // 6.5 seconds of invincible shield!
        this.game.particles.addCarExplosion(this.x, this.y);
        this.game.particles.addScorePopup(this.x, this.y - 70, "⚡ REVIVED! (SHIELD ACTIVE) ⚡", "#00f0ff");
        window.soundManager.startEngine();
    }

    canUseNitro() {
        return this.nitroCount > 0 && !this.isNitroActive && this.isAlive && !this.isAirborne;
    }

    activateNitro() {
        if (this.canUseNitro()) {
            this.nitroCount--;
            this.isNitroActive = true;
            this.nitroTimer = this.nitroDuration;
            window.soundManager.playNitro();
            this.game.particles.addScorePopup(this.x, this.y - 60, "⚡ NITRO BOOST!", "#00f0ff");
        } else if (this.nitroCount <= 0 && this.isAlive && !this.isAirborne) {
            this.game.particles.addScorePopup(this.x, this.y - 60, "NO NITRO BOTTLES!", "#ef476f");
        }
    }

    jump(initialVy = 25, boostSpeed = 2) {
        if (!this.isAlive || this.isAirborne || this.isJumping) return;
        this.isJumping = true;
        this.jumpAltitude = 6;
        this.jumpVy = initialVy;
        this.jumpCarClearCount = 0;
        this.jumpAirTime = 0;
        this.speed = Math.min(this.nitroSpeed, this.speed + boostSpeed);
        this.game.particles.addJumpLaunchBlast(this.x, this.y);
        window.soundManager.playJump();
    }

    addNitro(amount = 1) {
        this.nitroCount += amount;
        this.score += 2; // +2 for pickup
        window.soundManager.playFuel();
        this.game.particles.addScorePopup(this.x, this.y - 60, `⚡ +2 NITRO! (x${this.nitroCount})`, "#00f0ff");
    }

    addFuel(amount = 35) {
        this.fuel = MathUtils.clamp(this.fuel + amount, 0, this.maxFuel);
        this.score += 2; // +2 for pickup
        window.soundManager.playFuel();
        this.game.particles.addScorePopup(this.x, this.y - 60, "+2 FUEL", "#ffaa00");
    }

    addCoins(amount = 1) {
        this.coins += amount;
        this.score += 2 * amount; // +2 for pickup
        window.soundManager.playCoin();
        this.game.particles.addScorePopup(this.x, this.y - 60, "+2", "#ffd166");
    }

    addShield(duration = 600) {
        this.hasShield = true;
        this.shieldTimer = duration;
        this.score += 2; // +2 for pickup
        this.game.particles.addScorePopup(this.x, this.y - 60, "+2 SHIELD!", "#48cae4");
    }

    addMagnet(duration = 500) {
        this.hasMagnet = true;
        this.magnetTimer = duration;
        this.score += 2; // +2 for pickup
        this.game.particles.addScorePopup(this.x, this.y - 60, "+2 MAGNET!", "#f72585");
    }

    triggerOilSpin() {
        if (this.isSpinning || !this.isAlive) return;
        if (this.isJumping && this.jumpAltitude > 20) return; // Jumped over oil!
        this.isSpinning = true;
        this.spinTimer = 50;
        window.soundManager.playSkid();
        this.game.particles.addScorePopup(this.x, this.y - 60, "SLIP!", "#ef476f");
    }

    update(input, dt = 1) {
        // Airborne Flying Car Crash Sequence
        if (this.isAirborne) {
            this.airborneTimer++;
            this.x += this.flyVx;
            this.flyVy += this.gravity;
            this.y += this.flyVy;
            this.altitude = Math.max(0, this.altitude - this.flyVy * 0.9);
            this.tumbleAngle += this.spinSpeed;

            // Trail thick fiery smoke puffs
            if (this.airborneTimer % 2 === 0) {
                this.game.particles.particles.push({
                    type: 'smoke',
                    x: this.x + MathUtils.randRange(-15, 15),
                    y: this.y + MathUtils.randRange(-15, 15),
                    vx: MathUtils.randRange(-2, 2),
                    vy: MathUtils.randRange(1, 4),
                    radius: MathUtils.randRange(18, 30),
                    maxRadius: 70,
                    alpha: 0.9,
                    decay: 0.02,
                    color: MathUtils.randChoice(['#ff5400', '#2b2d42', '#ffbd00', '#1a1a24'])
                });
            }

            if (this.airborneTimer >= this.airborneDuration) {
                this.isAirborne = false;
                this.game.particles.addCarExplosion(this.x, this.y);
                this.game.screenShake = 25;
                this.game.onGameOver(this.crashReason);
            }
            return;
        }

        if (!this.isAlive) return;

        // Controlled Stunt Jump Airborne Physics
        if (this.isJumping) {
            this.jumpAirTime++;
            this.jumpAltitude += this.jumpVy;
            this.jumpVy -= this.jumpGravity;

            // Stream high-speed aerodynamic air streaks
            if (this.jumpAirTime % 2 === 0) {
                this.game.particles.addAirStreak(this.x, this.y - this.jumpAltitude + 40);
            }

            // Landing on Road Surface
            if (this.jumpAltitude <= 0) {
                this.jumpAltitude = 0;
                this.isJumping = false;
                this.game.particles.addLandingDust(this.x, this.y);
                window.soundManager.playLanding();
                this.game.screenShake = 8;

                if (this.jumpCarClearCount > 0) {
                    const bonus = this.jumpCarClearCount * 5;
                    this.score += bonus;
                    this.game.particles.addScorePopup(this.x, this.y - 70, `🛩️ ${this.jumpCarClearCount} CARS CLEARED! +${bonus}`, '#ffd166');
                }
            }
        }

        // Progressive speed scaling over distance (car speed dhire dhire barte thakbe)
        const speedProgression = Math.min(14, (this.distance / 350) * 0.7);
        this.normalSpeed = this.baseNormalSpeed + speedProgression;
        this.topSpeed = this.baseTopSpeed + speedProgression;
        this.nitroSpeed = this.baseNitroSpeed + speedProgression * 1.15;
        this.minSpeed = this.baseMinSpeed + speedProgression * 0.35;

        // Speed management
        let targetSpeed = this.normalSpeed;

        if (this.isNitroActive) {
            targetSpeed = this.nitroSpeed;
            this.nitroTimer--;
            if (this.nitroTimer <= 0) {
                this.isNitroActive = false;
            }
        } else if (input.up) {
            targetSpeed = this.topSpeed;
        } else if (input.down) {
            targetSpeed = this.minSpeed;
            // Spawn brake skid marks
            if (this.speed > 10 && Math.random() < 0.4) {
                this.game.particles.addSkidMark(
                    { x: this.x - 30, y: this.y + 70 },
                    { x: this.x + 30, y: this.y + 70 }
                );
                window.soundManager.playSkid();
            }
        }

        // Accelerate / Decelerate smoothly
        this.speed = MathUtils.lerp(this.speed, targetSpeed, 0.08);
        this.distance += this.speed * 0.15;
        // Automatic score removed: score is only awarded for overtaking, blasting, and pickups!

        // Sound engine update
        const speedRatio = (this.speed - this.minSpeed) / (this.nitroSpeed - this.minSpeed);
        window.soundManager.updateEngine(speedRatio);

        // Fuel consumption
        this.fuel -= this.fuelBurnRate * (0.6 + speedRatio * 0.8);
        if (this.fuel <= 0) {
            this.fuel = 0;
            this.die("OUT OF FUEL!");
            return;
        }

        // Shield & Magnet timers
        if (this.hasShield) {
            this.shieldTimer--;
            if (this.shieldTimer <= 0) this.hasShield = false;
        }
        if (this.hasMagnet) {
            this.magnetTimer--;
            if (this.magnetTimer <= 0) this.hasMagnet = false;
        }

        // Steering Handling
        let steer = 0;
        if (input.left) steer -= 1;
        if (input.right) steer += 1;

        // Touch drag steering
        if (input.touchTargetX !== null) {
            const diff = input.touchTargetX - this.x;
            if (Math.abs(diff) > 10) {
                steer = MathUtils.clamp(diff * 0.04, -1, 1);
            }
        }

        // If spinning from oil slick
        if (this.isSpinning) {
            this.spinAngle += 0.35;
            this.spinTimer--;
            steer = Math.sin(this.spinTimer * 0.3) * 1.5;
            if (this.spinTimer <= 0) {
                this.isSpinning = false;
                this.spinAngle = 0;
            }
        }

        // Apply velocity & smooth tilt
        const steerSpeed = 15;
        this.vx = MathUtils.lerp(this.vx, steer * steerSpeed, 0.22);
        this.x += this.vx;

        const targetTilt = (this.vx / steerSpeed) * 0.14;
        this.angle = MathUtils.lerp(this.angle, targetTilt, this.tiltSmooth);

        // Road Boundaries (between left curb and right curb)
        const roadMinX = 330;
        const roadMaxX = 750;
        if (this.x < roadMinX) {
            this.x = roadMinX;
            this.vx = 0;
            this.speed = Math.max(this.minSpeed, this.speed * 0.95);
        }
        if (this.x > roadMaxX) {
            this.x = roadMaxX;
            this.vx = 0;
            this.speed = Math.max(this.minSpeed, this.speed * 0.95);
        }

        // Exhaust Particles
        const exhLeftX = this.x - 20 * Math.cos(this.angle) - 75 * Math.sin(-this.angle);
        const exhLeftY = this.y + 75 * Math.cos(this.angle);
        const exhRightX = this.x + 20 * Math.cos(this.angle) - 75 * Math.sin(-this.angle);
        const exhRightY = this.y + 75 * Math.cos(this.angle);

        this.game.particles.addExhaust(exhLeftX, exhLeftY, this.speed, this.isNitroActive);
        this.game.particles.addExhaust(exhRightX, exhRightY, this.speed, this.isNitroActive);
    }

    getBounds() {
        return {
            x: this.x - this.w * 0.4,
            y: this.y - this.h * 0.42,
            w: this.w * 0.8,
            h: this.h * 0.84
        };
    }

    die(reason = "CRASH!") {
        if (!this.isAlive) return;
        this.isAlive = false;
        this.isJumping = false;
        this.jumpAltitude = 0;
        this.speed = 0;
        window.soundManager.stopEngine();
        window.soundManager.playCrash();

        // 1. Massive Explosion shockwave & sparks & shrapnel!
        this.game.particles.addCarExplosion(this.x, this.y);
        this.game.screenShake = 45;

        // 2. Launch car into airborne flying arc ("car ure chole jacche")
        this.isAirborne = true;
        this.airborneTimer = 0;
        this.airborneDuration = 60;
        this.flyVx = (Math.random() - 0.5) * 16;
        this.flyVy = -26; // High launch upwards!
        this.altitude = 0;
        this.gravity = 0.85;
        this.tumbleAngle = this.angle;
        this.spinSpeed = (Math.random() > 0.5 ? 1 : -1) * (0.2 + Math.random() * 0.15);
        this.crashReason = reason;
    }

    draw(ctx) {
        ctx.save();

        if (this.isAirborne) {
            // 1. Ground shadow far below
            const shadowScale = Math.max(0.4, 1.0 - (this.altitude * 0.003));
            ctx.fillStyle = 'rgba(20, 25, 15, 0.45)';
            ctx.beginPath();
            ctx.ellipse(this.x, this.y + this.altitude + 50, this.w * 0.45 * shadowScale, this.h * 0.25 * shadowScale, 0, 0, Math.PI * 2);
            ctx.fill();

            // 2. Flying Car Chassis scaling up (closer to camera)
            const scale = 1.0 + Math.min(0.8, this.altitude * 0.004);
            ctx.translate(this.x, this.y);
            ctx.rotate(this.tumbleAngle);
            ctx.scale(scale, scale);

            const sprite = this.game.assets.images["car_red.png"];
            if (sprite) {
                ctx.drawImage(sprite, -this.w / 2, -this.h / 2, this.w, this.h);
            }

            // Fiery radial glow around burning airborne wreck
            const fireGrad = ctx.createRadialGradient(0, 0, 10, 0, 0, this.h * 0.6);
            fireGrad.addColorStop(0, 'rgba(255, 200, 0, 0.6)');
            fireGrad.addColorStop(0.5, 'rgba(255, 70, 0, 0.4)');
            fireGrad.addColorStop(1, 'rgba(255, 0, 0, 0.0)');
            ctx.fillStyle = fireGrad;
            ctx.beginPath();
            ctx.arc(0, 0, this.h * 0.6, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
            return;
        }

        if (this.isJumping) {
            // 1. Dynamic Ground Contact Shadow on road surface
            const shadowScale = Math.max(0.5, 1.0 - (this.jumpAltitude * 0.0025));
            const shadowAlpha = Math.max(0.12, 0.42 - (this.jumpAltitude * 0.0018));
            ctx.fillStyle = `rgba(15, 20, 15, ${shadowAlpha})`;
            ctx.beginPath();
            ctx.ellipse(this.x, this.y + 20, this.w * 0.46 * shadowScale, this.h * 0.28 * shadowScale, 0, 0, Math.PI * 2);
            ctx.fill();

            // 2. Elevated Airborne Car Chassis with perspective scaling and aerodynamic pitch tilt
            const jumpScale = 1.0 + Math.min(0.3, this.jumpAltitude * 0.0018);
            const pitchTilt = MathUtils.clamp(-this.jumpVy * 0.007, -0.12, 0.12);

            ctx.translate(this.x, this.y - this.jumpAltitude);
            ctx.rotate(this.angle + pitchTilt + (this.isSpinning ? this.spinAngle : 0));
            ctx.scale(jumpScale, jumpScale);

            // Draw Car Sprite
            const sprite = this.game.assets.images["car_red.png"];
            if (sprite) {
                ctx.drawImage(sprite, -this.w / 2, -this.h / 2, this.w, this.h);
            }

            // Draw Shield Aura if active
            if (this.hasShield) {
                ctx.strokeStyle = '#00f0ff';
                ctx.lineWidth = 6;
                ctx.shadowColor = '#00f0ff';
                ctx.shadowBlur = 18;
                ctx.beginPath();
                ctx.arc(0, 0, this.h * 0.58, 0, Math.PI * 2);
                ctx.stroke();
                ctx.shadowBlur = 0;
            }

            // Draw Magnet Glow if active
            if (this.hasMagnet) {
                ctx.strokeStyle = '#f72585';
                ctx.lineWidth = 4;
                ctx.beginPath();
                ctx.arc(0, 0, this.h * 0.52, 0, Math.PI * 2);
                ctx.stroke();
            }

            ctx.restore();
            return;
        }

        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle + (this.isSpinning ? this.spinAngle : 0));

        // Draw Car Sprite
        const sprite = this.game.assets.images["car_red.png"];
        if (sprite) {
            ctx.drawImage(sprite, -this.w / 2, -this.h / 2, this.w, this.h);
        }

        // Draw Shield Aura if active
        if (this.hasShield) {
            ctx.strokeStyle = '#00f0ff';
            ctx.lineWidth = 6;
            ctx.shadowColor = '#00f0ff';
            ctx.shadowBlur = 18;
            ctx.beginPath();
            ctx.arc(0, 0, this.h * 0.58, 0, Math.PI * 2);
            ctx.stroke();
            ctx.shadowBlur = 0;
        }

        // Draw Magnet Glow if active
        if (this.hasMagnet) {
            ctx.strokeStyle = '#f72585';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(0, 0, this.h * 0.52, 0, Math.PI * 2);
            ctx.stroke();
        }

        ctx.restore();
    }
}

window.Player = Player;
