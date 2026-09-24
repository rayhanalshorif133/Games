/**
 * Traffic AI & Vehicle Obstacles Manager
 * Spawns and controls AI vehicles across highway lanes with intelligent lane-keeping and animations.
 */

class TrafficManager {
    constructor(game) {
        this.game = game;
        this.vehicles = [];
        this.spawnTimer = 0;
        this.spawnInterval = 90; // frames between vehicle spawns
        this.lanes = [410, 540, 670]; // 3 lanes on the highway
    }

    reset() {
        this.vehicles = [];
        this.spawnTimer = 0;
    }

    spawnVehicle() {
        const laneX = MathUtils.randChoice(this.lanes);

        // Don't spawn if another car is already at the top of this lane
        const tooClose = this.vehicles.some(v => Math.abs(v.x - laneX) < 80 && v.y < 150);
        if (tooClose) return;

        const types = [
            { id: 'blue', sprite: 'car_blue.png', w: 95, h: 180, baseSpeed: 8 },
            { id: 'yellow', sprite: 'car_yellow.png', w: 95, h: 180, baseSpeed: 10 },
            { id: 'truck', sprite: 'car_truck.png', w: 115, h: 300, baseSpeed: 5 },
            { id: 'police', sprite: 'car_police.png', w: 95, h: 180, baseSpeed: 12 }
        ];

        const type = MathUtils.randChoice(types);

        this.vehicles.push({
            id: type.id,
            sprite: type.sprite,
            w: type.w,
            h: type.h,
            x: laneX,
            y: -type.h - 50,
            targetX: laneX,
            baseSpeed: type.baseSpeed + MathUtils.randRange(-1, 1.5),
            angle: 0,
            sirenTimer: 0,
            sirenColor: 'red'
        });
    }

    update(playerSpeed) {
        // Spawn timer
        this.spawnTimer++;
        if (this.spawnTimer > this.spawnInterval) {
            this.spawnTimer = 0;
            this.spawnVehicle();
            // Gradually increase density
            this.spawnInterval = Math.max(45, 90 - Math.floor(this.game.player.distance / 1200));
        }

        // Update Vehicles
        for (let i = this.vehicles.length - 1; i >= 0; i--) {
            const v = this.vehicles[i];

            // Speed relative to player
            const relativeSpeed = playerSpeed - v.baseSpeed;
            v.y += relativeSpeed;

            // Lane change logic
            if (Math.abs(v.x - v.targetX) > 1) {
                v.x = MathUtils.lerp(v.x, v.targetX, 0.05);
                v.angle = MathUtils.lerp(v.angle, (v.targetX - v.x) * 0.005, 0.1);
            } else {
                v.angle = MathUtils.lerp(v.angle, 0, 0.1);
            }

            // Police siren animation
            if (v.id === 'police') {
                v.sirenTimer++;
                if (v.sirenTimer % 10 === 0) {
                    v.sirenColor = v.sirenColor === 'red' ? 'blue' : 'red';
                }
            }

            // Check collision with player
            if (this.game.player.isAlive) {
                const pBounds = this.game.player.getBounds();
                const vBounds = {
                    x: v.x - v.w * 0.4,
                    y: v.y - v.h * 0.42,
                    w: v.w * 0.8,
                    h: v.h * 0.84
                };

                if (MathUtils.checkAABB(pBounds, vBounds)) {
                    if (this.game.player.isNitroActive) {
                        // Smash traffic car away with nitro!
                        this.game.particles.addSparks(v.x, v.y, 30);
                        this.game.particles.addScorePopup(v.x, v.y, "RAM +200!", "#00f0ff");
                        this.game.player.score += 200;
                        window.soundManager.playCrash();
                        this.vehicles.splice(i, 1);
                        continue;
                    } else if (this.game.player.hasShield) {
                        // Absorb hit with shield
                        this.game.player.hasShield = false;
                        this.game.particles.addSparks(this.game.player.x, this.game.player.y, 25);
                        this.game.particles.addScorePopup(this.game.player.x, this.game.player.y, "SHIELD BROKEN!", "#48cae4");
                        window.soundManager.playCrash();
                        this.vehicles.splice(i, 1);
                        continue;
                    } else {
                        // Crash game over
                        this.game.player.die("CRASHED INTO TRAFFIC!");
                    }
                }
            }

            // Remove offscreen
            if (v.y > 2100 || v.y < -600) {
                this.vehicles.splice(i, 1);
            }
        }
    }

    draw(ctx) {
        for (const v of this.vehicles) {
            ctx.save();
            ctx.translate(v.x, v.y);
            ctx.rotate(v.angle);

            const sprite = this.game.assets.images[v.sprite];
            if (sprite) {
                ctx.drawImage(sprite, -v.w / 2, -v.h / 2, v.w, v.h);
            }

            // Police flashing siren glow
            if (v.id === 'police') {
                ctx.fillStyle = v.sirenColor === 'red' ? 'rgba(255, 0, 0, 0.4)' : 'rgba(0, 100, 255, 0.4)';
                ctx.beginPath();
                ctx.arc(0, 0, 36, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.restore();
        }
    }
}

window.TrafficManager = TrafficManager;
