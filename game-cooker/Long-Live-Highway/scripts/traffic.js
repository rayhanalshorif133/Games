/**
 * Traffic AI & Vehicle Obstacles Manager
 * Spawns and controls AI vehicles across highway lanes,
 * and handles explosive car destruction physics, flying wreckage catapults, and specialized blast effects.
 */

class TrafficManager {
    constructor(game) {
        this.game = game;
        this.vehicles = [];
        this.wreckages = [];
        this.spawnTimer = 0;
        this.spawnInterval = 90; // frames between vehicle spawns
        this.lanes = [410, 540, 670]; // 3 lanes on the highway
    }

    reset() {
        this.vehicles = [];
        this.wreckages = [];
        this.spawnTimer = 0;
    }

    spawnVehicle() {
        const laneX = MathUtils.randChoice(this.lanes);

        // Don't spawn if another car is already at the top of this lane
        const tooClose = this.vehicles.some(v => Math.abs(v.x - laneX) < 80 && v.y < 150);
        if (tooClose) return;

        const types = [
            { id: 'blue', sprite: 'car_blue.png', w: 95, h: 180, baseSpeed: 8, passScore: 1 },
            { id: 'yellow', sprite: 'car_yellow.png', w: 95, h: 180, baseSpeed: 10, passScore: 1 },
            { id: 'truck', sprite: 'car_truck.png', w: 115, h: 300, baseSpeed: 5, passScore: 3 },
            { id: 'police', sprite: 'car_police.png', w: 95, h: 180, baseSpeed: 12, passScore: 2 }
        ];

        const type = MathUtils.randChoice(types);

        const distanceBonus = Math.min(8, (this.game.player.distance / 500) * 0.4);
        this.vehicles.push({
            id: type.id,
            sprite: type.sprite,
            w: type.w,
            h: type.h,
            x: laneX,
            y: -type.h - 50,
            targetX: laneX,
            baseSpeed: type.baseSpeed + distanceBonus + MathUtils.randRange(-1, 1.5),
            passScore: type.passScore,
            angle: 0,
            sirenTimer: 0,
            sirenColor: 'red',
            passed: false
        });
    }

    update(playerSpeed) {
        // Spawn timer
        this.spawnTimer++;
        if (this.spawnTimer > this.spawnInterval) {
            this.spawnTimer = 0;
            this.spawnVehicle();
            this.spawnInterval = Math.max(45, 90 - Math.floor(this.game.player.distance / 1200));
        }

        // 1. Update Active Vehicles
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

            // Overtake / Crossing Score Check (Score awarded when player passes the vehicle)
            if (!v.passed && v.y > this.game.player.y + 30 && this.game.player.isAlive && !this.game.player.isAirborne) {
                v.passed = true;
                let pts = 1;
                let label = "+1";
                if (v.id === 'truck') {
                    pts = 3;
                    label = "+3 TRUCK";
                } else if (v.id === 'police') {
                    pts = 2;
                    label = "+2 POLICE";
                } else {
                    pts = 1;
                    label = "+1";
                }
                this.game.player.score += pts;
                this.game.particles.addScorePopup(v.x, v.y - 30, label, '#06d6a0');
            }

            // Check collision with player
            if (this.game.player.isAlive && !this.game.player.isAirborne) {
                const pBounds = this.game.player.getBounds();
                const vBounds = {
                    x: v.x - v.w * 0.4,
                    y: v.y - v.h * 0.42,
                    w: v.w * 0.8,
                    h: v.h * 0.84
                };

                if (MathUtils.checkAABB(pBounds, vBounds)) {
                    if (this.game.player.isNitroActive) {
                        // --- 1. NITRO RAM EXPLOSION BLAST (+5 score for destroying enemy car) ---
                        this.game.particles.addNitroRamBlast(v.x, v.y);
                        this.game.screenShake = 35;
                        window.soundManager.playNitroSmash();
                        
                        this.game.player.score += 5;
                        this.game.particles.addScorePopup(v.x, v.y - 40, "💥 +5 DESTROYED!", '#00f0ff');

                        // Catapult blasted vehicle into 3D airborne wreckage
                        this.catapultWreckage(v, {
                            vx: (v.x - this.game.player.x) * 0.18 + MathUtils.randRange(-8, 8),
                            vy: -22,
                            spin: MathUtils.randRange(-0.35, 0.35),
                            type: 'nitro_blast'
                        });

                        this.vehicles.splice(i, 1);
                        continue;

                    } else if (this.game.player.hasShield) {
                        // --- 2. SHIELD DEFLECTION BLAST (+5 score for destroying enemy car) ---
                        this.game.particles.addShieldDeflectBlast(v.x, v.y);
                        this.game.screenShake = 22;
                        window.soundManager.playShieldShatter();
                        
                        this.game.player.hasShield = false;
                        this.game.player.score += 5;
                        this.game.particles.addScorePopup(v.x, v.y - 40, "🛡️ +5 DESTROYED!", '#48cae4');

                        // Deflect traffic car away
                        this.catapultWreckage(v, {
                            vx: v.x < this.game.player.x ? -18 : 18,
                            vy: -14,
                            spin: MathUtils.randRange(-0.25, 0.25),
                            type: 'shield_deflect'
                        });

                        this.vehicles.splice(i, 1);
                        continue;

                    } else {
                        // Regular Player Crash
                        this.game.player.die("CRASHED INTO TRAFFIC!");
                        return;
                    }
                }
            }

            // Remove offscreen
            if (v.y > 2100 || v.y < -350) {
                this.vehicles.splice(i, 1);
            }
        }

        // 2. Update Catapulted Flying Wreckages
        for (let j = this.wreckages.length - 1; j >= 0; j--) {
            const w = this.wreckages[j];
            w.timer++;
            w.x += w.vx;
            w.vy += w.gravity;
            w.y += w.vy + (playerSpeed * 0.4);
            w.altitude = Math.max(0, w.altitude - w.vy * 0.9);
            w.angle += w.spin;

            // Trail smoke/fire sparks
            if (w.timer % 2 === 0) {
                this.game.particles.particles.push({
                    type: 'smoke',
                    x: w.x + MathUtils.randRange(-12, 12),
                    y: w.y + MathUtils.randRange(-12, 12),
                    vx: MathUtils.randRange(-2, 2),
                    vy: MathUtils.randRange(1, 4),
                    radius: MathUtils.randRange(14, 26),
                    maxRadius: 60,
                    alpha: 0.85,
                    decay: 0.025,
                    color: w.blastType === 'nitro_blast' ? '#00b4d8' : '#e76f51'
                });
            }

            // Remove after flight duration
            if (w.timer >= w.duration || w.y > 2200 || w.x < -200 || w.x > 1280) {
                this.game.particles.addCarExplosion(w.x, w.y);
                this.wreckages.splice(j, 1);
            }
        }
    }

    catapultWreckage(v, options = {}) {
        this.wreckages.push({
            sprite: v.sprite,
            w: v.w,
            h: v.h,
            x: v.x,
            y: v.y,
            vx: options.vx || MathUtils.randRange(-10, 10),
            vy: options.vy || -20,
            gravity: 0.9,
            altitude: 0,
            angle: v.angle,
            spin: options.spin || 0.2,
            timer: 0,
            duration: 65,
            blastType: options.type || 'nitro_blast'
        });
    }

    draw(ctx) {
        // 1. Draw Active Traffic Vehicles
        for (const v of this.vehicles) {
            ctx.save();
            ctx.translate(v.x, v.y);
            ctx.rotate(v.angle);

            const sprite = this.game.assets.images[v.sprite];
            if (sprite) {
                ctx.drawImage(sprite, -v.w / 2, -v.h / 2, v.w, v.h);
            }

            // Police flashing beacon light
            if (v.id === 'police') {
                ctx.fillStyle = v.sirenColor === 'red' ? 'rgba(255, 0, 50, 0.95)' : 'rgba(0, 150, 255, 0.95)';
                ctx.shadowColor = v.sirenColor === 'red' ? '#ff0033' : '#0099ff';
                ctx.shadowBlur = 24;
                ctx.beginPath();
                ctx.arc(0, -10, 15, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0;
            }

            ctx.restore();
        }

        // 2. Draw Catapulted Flying Car Wreckages
        for (const w of this.wreckages) {
            ctx.save();
            // Ground shadow
            const shadowScale = Math.max(0.3, 1.0 - (w.altitude * 0.003));
            ctx.fillStyle = 'rgba(10, 15, 10, 0.4)';
            ctx.beginPath();
            ctx.ellipse(w.x, w.y + w.altitude + 40, w.w * 0.45 * shadowScale, w.h * 0.22 * shadowScale, 0, 0, Math.PI * 2);
            ctx.fill();

            // Flying wreckage spinning & scaling up
            const scale = 1.0 + Math.min(0.7, w.altitude * 0.004);
            ctx.translate(w.x, w.y);
            ctx.rotate(w.angle);
            ctx.scale(scale, scale);

            const sprite = this.game.assets.images[w.sprite];
            if (sprite) {
                ctx.drawImage(sprite, -w.w / 2, -w.h / 2, w.w, w.h);
            }

            // Fiery radial flare around flying wreckage
            const flareGrad = ctx.createRadialGradient(0, 0, 10, 0, 0, w.h * 0.55);
            flareGrad.addColorStop(0, w.blastType === 'nitro_blast' ? 'rgba(0, 240, 255, 0.7)' : 'rgba(255, 180, 0, 0.7)');
            flareGrad.addColorStop(0.6, 'rgba(255, 60, 0, 0.4)');
            flareGrad.addColorStop(1, 'rgba(255, 0, 0, 0)');
            ctx.fillStyle = flareGrad;
            ctx.beginPath();
            ctx.arc(0, 0, w.h * 0.55, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        }
    }
}

window.TrafficManager = TrafficManager;
