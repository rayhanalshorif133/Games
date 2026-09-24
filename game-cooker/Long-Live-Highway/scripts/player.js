/**
 * Player Car Entity & Controller
 * Implements smooth vehicle dynamics, tilt rotation, steering, nitro boost, and fuel consumption.
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
        this.minSpeed = 6;
        this.normalSpeed = 16;
        this.topSpeed = 26;
        this.nitroSpeed = 38;

        this.angle = 0;          // Steering tilt angle
        this.tiltSmooth = 0.15;

        this.fuel = 100;
        this.maxFuel = 100;
        this.fuelBurnRate = 0.045; // Depletes over ~35-40 seconds if no fuel picked up

        this.nitro = 100;
        this.maxNitro = 100;
        this.isNitroActive = false;
        this.nitroTimer = 0;

        this.hasShield = false;
        this.shieldTimer = 0;

        this.hasMagnet = false;
        this.magnetTimer = 0;

        this.isSpinning = false;
        this.spinAngle = 0;
        this.spinTimer = 0;

        this.isAlive = true;
        this.distance = 0;
        this.score = 0;
        this.coins = 0;
    }

    activateNitro() {
        if (this.nitro >= 25 && !this.isNitroActive && this.isAlive) {
            this.isNitroActive = true;
            this.nitroTimer = 180; // 3 seconds at 60fps
            window.soundManager.playNitro();
        }
    }

    addFuel(amount = 35) {
        this.fuel = MathUtils.clamp(this.fuel + amount, 0, this.maxFuel);
        window.soundManager.playFuel();
        this.game.particles.addScorePopup(this.x, this.y - 60, "+FUEL", "#ffaa00");
    }

    addCoins(amount = 1) {
        this.coins += amount;
        this.score += 50 * amount;
        this.nitro = MathUtils.clamp(this.nitro + 10, 0, this.maxNitro);
        window.soundManager.playCoin();
        this.game.particles.addScorePopup(this.x, this.y - 60, "+50", "#ffd166");
    }

    addShield(duration = 600) {
        this.hasShield = true;
        this.shieldTimer = duration;
        this.game.particles.addScorePopup(this.x, this.y - 60, "SHIELD!", "#48cae4");
    }

    addMagnet(duration = 500) {
        this.hasMagnet = true;
        this.magnetTimer = duration;
        this.game.particles.addScorePopup(this.x, this.y - 60, "MAGNET!", "#f72585");
    }

    triggerOilSpin() {
        if (this.isSpinning) return;
        this.isSpinning = true;
        this.spinTimer = 50;
        window.soundManager.playSkid();
        this.game.particles.addScorePopup(this.x, this.y - 60, "SLIP!", "#ef476f");
    }

    update(input, dt = 1) {
        if (!this.isAlive) return;

        // Speed management
        let targetSpeed = this.normalSpeed;

        if (this.isNitroActive) {
            targetSpeed = this.nitroSpeed;
            this.nitroTimer--;
            this.nitro = Math.max(0, this.nitro - 0.55);
            if (this.nitroTimer <= 0 || this.nitro <= 0) {
                this.isNitroActive = false;
            }
        } else if (input.up) {
            targetSpeed = this.topSpeed;
            this.nitro = MathUtils.clamp(this.nitro + 0.05, 0, this.maxNitro);
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
        this.score += Math.floor(this.speed * 0.1);

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

        // Road Boundaries (between x=300 and x=780)
        const roadMinX = 330;
        const roadMaxX = 750;
        if (this.x < roadMinX) {
            this.x = roadMinX;
            this.vx = 0;
            // Offroad drag
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
        this.speed = 0;
        window.soundManager.stopEngine();
        window.soundManager.playCrash();
        this.game.particles.addSparks(this.x, this.y, 40);
        this.game.onGameOver(reason);
    }

    draw(ctx) {
        ctx.save();
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
