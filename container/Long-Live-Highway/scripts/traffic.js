/**
 * Traffic AI & Military Vehicle Hazards Manager
 * Spawns and controls AI vehicles and heavy Armored Military Tanks across highway lanes,
 * and handles explosive car destruction physics, flying wreckage catapults, and specialized blast effects.
 */

class TrafficManager {
    constructor(game) {
        this.game = game;
        this.vehicles = [];
        this.wreckages = [];
        this.spawnTimer = 0;
        this.convoyTimer = 0;
        this.spawnInterval = 90; // frames between vehicle spawns
        this.lanes = [410, 540, 670]; // 3 lanes on the highway
    }

    reset() {
        this.vehicles = [];
        this.wreckages = [];
        this.spawnTimer = 0;
        this.convoyTimer = 0;
    }

    spawnTank(laneX = 540, yOffset = 0) {
        const distanceBonus = Math.min(6, (this.game.player.distance / 600) * 0.3);

        this.vehicles.push({
            id: 'tank',
            sprite: null, // Procedurally drawn high-detail military tank
            w: 100,       // Proportionately balanced tank dimensions
            h: 190,
            x: laneX,
            y: -240 - yOffset,
            targetX: laneX,
            baseSpeed: 5.5 + distanceBonus,
            passScore: 5,
            angle: 0,
            turretAngle: 0,
            treadOffset: 0,
            passed: false
        });
    }

    spawnTankConvoy() {
        // Spawns 2 tanks side by side across 2 lanes, leaving 1 lane open
        const pattern = MathUtils.randChoice([
            [410, 540], // Left & Center blocked, Right open
            [540, 670], // Center & Right blocked, Left open
            [410, 670]  // Left & Right blocked, Center open
        ]);

        pattern.forEach((laneX, idx) => {
            this.spawnTank(laneX, idx * 30);
        });

        if (this.game.scenery) {
            this.game.scenery.spawnRoadSign('military_zone', -450);
        }

        this.game.particles.addScorePopup(540, 260, "🚨 WARNING: ARMORED TANK CONVOY! 🚨", "#ff5400");
    }

    spawnBrakePunishVehicles() {
        if (!this.game.player.isAlive || this.game.player.isAirborne) return;

        // Don't spam if there are already oncoming vehicles on screen
        const existingOncoming = this.vehicles.filter(v => v.isOncoming);
        if (existingOncoming.length >= 2) return;

        // Choose 1 or 2 oncoming speeders rushing down towards player
        const count = Math.random() < 0.6 ? 1 : 2;
        const playerLane = this.lanes.reduce((prev, curr) => 
            Math.abs(curr - this.game.player.x) < Math.abs(prev - this.game.player.x) ? curr : prev
        );

        let chosenLanes = [playerLane];
        if (count === 2) {
            const otherLanes = this.lanes.filter(l => l !== playerLane);
            chosenLanes.push(MathUtils.randChoice(otherLanes));
        }

        const sprites = ['car_yellow.png', 'car_red.png', 'car_blue.png', 'car_police.png'];
        let spawnedAny = false;

        chosenLanes.forEach((laneX, idx) => {
            const tooClose = this.vehicles.some(v => Math.abs(v.x - laneX) < 80 && v.y < 220 && v.y > -350);

            if (!tooClose) {
                spawnedAny = true;
                this.vehicles.push({
                    id: 'oncoming',
                    sprite: MathUtils.randChoice(sprites),
                    w: 95,
                    h: 180,
                    x: laneX,
                    y: -240 - (idx * 150),
                    targetX: laneX,
                    baseSpeed: -16, // High negative speed = speeds DOWN rapidly towards the player!
                    passScore: 2,
                    angle: Math.PI, // Facing downward towards the player
                    isOncoming: true,
                    headlightTimer: 0,
                    passed: false
                });
            }
        });

        if (spawnedAny) {
            window.soundManager.playHorn();
            this.game.particles.addScorePopup(this.game.player.x, 260, "⚠️ ONCOMING TRAFFIC! DODGE!", "#ff0055");
            this.game.screenShake = 12;
        }
    }

    spawnVehicle() {
        const pDist = this.game.player.distance;

        // Progressive traffic types based on distance (Easy to Hard)
        const types = [
            { id: 'blue', sprite: 'car_blue.png', w: 95, h: 180, baseSpeed: 8, passScore: 1 },
            { id: 'yellow', sprite: 'car_yellow.png', w: 95, h: 180, baseSpeed: 10, passScore: 1 },
            { id: 'truck', sprite: 'car_truck.png', w: 115, h: 300, baseSpeed: 5, passScore: 3 },
            { id: 'police', sprite: 'car_police.png', w: 95, h: 180, baseSpeed: 12, passScore: 2 }
        ];

        // Heavy Armored Military Tanks spawn once distance >= 550m
        if (pDist >= 550) {
            const tankWeight = Math.min(0.28, (pDist - 550) / 3000);
            if (Math.random() < tankWeight) {
                const laneX = MathUtils.randChoice(this.lanes);
                const tooClose = this.vehicles.some(v => Math.abs(v.x - laneX) < 80 && v.y < 200);
                if (!tooClose) {
                    this.spawnTank(laneX);
                    return;
                }
            }
        }

        const laneX = MathUtils.randChoice(this.lanes);
        const tooClose = this.vehicles.some(v => Math.abs(v.x - laneX) < 80 && v.y < 150);
        if (tooClose) return;

        const type = MathUtils.randChoice(types);
        const distanceBonus = Math.min(8, (pDist / 500) * 0.4);

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
        const pDist = this.game.player.distance;

        // 1. Regular Vehicle Spawn Timer
        this.spawnTimer++;
        if (this.spawnTimer > this.spawnInterval) {
            this.spawnTimer = 0;
            this.spawnVehicle();
            this.spawnInterval = Math.max(40, 90 - Math.floor(pDist / 1000));
        }

        // 2. Tank Convoy Timer (Starts after 750m distance, challenging roadblocks!)
        if (pDist >= 750) {
            this.convoyTimer++;
            const convoyInterval = Math.max(700, 1600 - Math.floor(pDist / 3));
            if (this.convoyTimer > convoyInterval) {
                this.convoyTimer = 0;
                this.spawnTankConvoy();
            }
        }

        // 3. Update Active Vehicles
        for (let i = this.vehicles.length - 1; i >= 0; i--) {
            const v = this.vehicles[i];

            // Speed relative to player
            const relativeSpeed = playerSpeed - v.baseSpeed;
            v.y += relativeSpeed;

            // Lane change logic (only for regular cars, tanks hold their lane steadily)
            if (v.id !== 'tank') {
                if (Math.abs(v.x - v.targetX) > 1) {
                    v.x = MathUtils.lerp(v.x, v.targetX, 0.05);
                    v.angle = MathUtils.lerp(v.angle, (v.targetX - v.x) * 0.005, 0.1);
                } else {
                    v.angle = MathUtils.lerp(v.angle, (v.isOncoming ? Math.PI : 0), 0.1);
                }
            } else {
                v.treadOffset = (v.treadOffset + 4) % 24;
                // Emit diesel exhaust smoke puffs
                if (Math.random() < 0.35 && v.y > -100 && v.y < 2000) {
                    this.game.particles.particles.push({
                        type: 'smoke',
                        x: v.x + MathUtils.randChoice([-30, 30]),
                        y: v.y + 95,
                        vx: MathUtils.randRange(-1, 1),
                        vy: MathUtils.randRange(2, 5),
                        radius: MathUtils.randRange(12, 22),
                        maxRadius: 50,
                        alpha: 0.7,
                        decay: 0.03,
                        color: '#2b2d42'
                    });
                }
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
                if (v.id === 'tank') {
                    pts = 5;
                    label = "🛡️ +5 TANK";
                } else if (v.isOncoming) {
                    pts = 2;
                    label = "⚡ +2 DODGED!";
                } else if (v.id === 'truck') {
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
                    x: v.x - v.w * 0.42,
                    y: v.y - v.h * 0.42,
                    w: v.w * 0.84,
                    h: v.h * 0.84
                };

                if (MathUtils.checkAABB(pBounds, vBounds)) {
                    if (this.game.player.isNitroActive) {
                        // --- 1. NITRO RAM EXPLOSION BLAST (+15 for tank, +5 for cars) ---
                        const isTank = v.id === 'tank';
                        const pts = isTank ? 15 : 5;
                        const label = isTank ? "💥 +15 TANK DESTROYED!" : "💥 +5 DESTROYED!";
                        
                        this.game.particles.addNitroRamBlast(v.x, v.y);
                        this.game.particles.addCarExplosion(v.x, v.y);
                        this.game.screenShake = isTank ? 45 : 35;
                        window.soundManager.playNitroSmash();
                        
                        this.game.player.score += pts;
                        this.game.particles.addScorePopup(v.x, v.y - 40, label, '#00f0ff');

                        // Catapult blasted vehicle into 3D airborne wreckage
                        this.catapultWreckage(v, {
                            vx: (v.x - this.game.player.x) * 0.22 + MathUtils.randRange(-10, 10),
                            vy: -24,
                            spin: MathUtils.randRange(-0.4, 0.4),
                            type: 'nitro_blast'
                        });

                        this.vehicles.splice(i, 1);
                        continue;

                    } else if (this.game.player.hasShield) {
                        // --- 2. SHIELD DEFLECTION BLAST ---
                        const isTank = v.id === 'tank';
                        const pts = isTank ? 10 : 5;
                        const label = isTank ? "🛡️ +10 TANK SMASHED!" : "🛡️ +5 DESTROYED!";

                        this.game.particles.addShieldDeflectBlast(v.x, v.y);
                        this.game.screenShake = 25;
                        window.soundManager.playShieldShatter();
                        
                        this.game.player.hasShield = false;
                        this.game.player.score += pts;
                        this.game.particles.addScorePopup(v.x, v.y - 40, label, '#48cae4');

                        // Deflect traffic car away
                        this.catapultWreckage(v, {
                            vx: v.x < this.game.player.x ? -20 : 20,
                            vy: -16,
                            spin: MathUtils.randRange(-0.3, 0.3),
                            type: 'shield_deflect'
                        });

                        this.vehicles.splice(i, 1);
                        continue;

                    } else {
                        // Regular Player Crash
                        this.game.player.die(v.id === 'tank' ? "CRUSHED BY MILITARY TANK!" : "CRASHED INTO TRAFFIC!");
                        return;
                    }
                }
            }

            // Remove offscreen
            if (v.y > 2100 || v.y < -450) {
                this.vehicles.splice(i, 1);
            }
        }

        // 4. Update Catapulted Flying Wreckages
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
                    x: w.x + MathUtils.randRange(-15, 15),
                    y: w.y + MathUtils.randRange(-15, 15),
                    vx: MathUtils.randRange(-2, 2),
                    vy: MathUtils.randRange(1, 4),
                    radius: MathUtils.randRange(16, 30),
                    maxRadius: 65,
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
            id: v.id,
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

            if (v.id === 'tank') {
                this.drawTank(ctx, v);
            } else {
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

                // Oncoming Speeders Flashing Headlights Beam
                if (v.isOncoming) {
                    v.headlightTimer = (v.headlightTimer || 0) + 1;
                    const flash = Math.sin(v.headlightTimer * 0.35) > 0;
                    ctx.fillStyle = flash ? 'rgba(255, 255, 220, 0.95)' : 'rgba(255, 210, 80, 0.7)';
                    ctx.shadowColor = '#ffff99';
                    ctx.shadowBlur = 20;
                    ctx.beginPath();
                    ctx.arc(-26, -70, 10, 0, Math.PI * 2);
                    ctx.arc(26, -70, 10, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.shadowBlur = 0;
                }
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

            if (w.id === 'tank') {
                this.drawTank(ctx, w);
            } else {
                const sprite = this.game.assets.images[w.sprite];
                if (sprite) {
                    ctx.drawImage(sprite, -w.w / 2, -w.h / 2, w.w, w.h);
                }
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

    drawTank(ctx, v) {
        const w = v.w || 100;
        const h = v.h || 190;

        // 1. Realistic Soft Ground Shadow (Offset slightly in sun angle)
        ctx.fillStyle = 'rgba(12, 16, 12, 0.42)';
        ctx.beginPath();
        ctx.roundRect(-w / 2 + 3, -h / 2 + 10, w - 6, h - 8, 14);
        ctx.fill();

        // Deep contact shadows directly under caterpillar tracks
        const trackW = 23;
        ctx.fillStyle = 'rgba(8, 10, 8, 0.55)';
        ctx.beginPath();
        ctx.roundRect(-w / 2 + 1, -h / 2 + 8, trackW - 2, h - 12, 8);
        ctx.roundRect(w / 2 - trackW + 1, -h / 2 + 8, trackW - 2, h - 12, 8);
        ctx.fill();

        // 2. Caterpillar Tracks (Left & Right)
        const drawTrack = (tx) => {
            // Track rubber/steel base band
            ctx.fillStyle = '#21241f';
            ctx.beginPath();
            ctx.roundRect(tx, -h / 2 + 4, trackW, h - 8, 8);
            ctx.fill();
            ctx.strokeStyle = '#3d4038';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Animated Tread Cleats & Links
            ctx.fillStyle = '#141512';
            for (let ty = -h / 2 + 10; ty < h / 2 - 10; ty += 14) {
                const offY = (ty + (v.treadOffset || 0)) % (h - 24) - h / 2 + 12;
                ctx.fillRect(tx + 2, offY, trackW - 4, 5);
            }

            // Road Wheels (5 per track) with Hub Caps and Rim Highlights
            const wheelRadius = 7.5;
            for (let wy = -h / 2 + 20; wy <= h / 2 - 20; wy += 32) {
                // Wheel Rim
                ctx.fillStyle = '#4a4e44';
                ctx.beginPath();
                ctx.arc(tx + trackW / 2, wy, wheelRadius, 0, Math.PI * 2);
                ctx.fill();

                // Steel Inner Hub
                ctx.fillStyle = '#1a1d17';
                ctx.beginPath();
                ctx.arc(tx + trackW / 2, wy, 3.5, 0, Math.PI * 2);
                ctx.fill();

                // Center Bolt Dot
                ctx.fillStyle = '#8f9485';
                ctx.beginPath();
                ctx.arc(tx + trackW / 2, wy, 1.2, 0, Math.PI * 2);
                ctx.fill();
            }
        };

        drawTrack(-w / 2);
        drawTrack(w / 2 - trackW);

        // 3. Armored Tank Chassis Hull (Military Olive Camo)
        const hullW = w - trackW * 2 + 8; // 62px
        ctx.fillStyle = '#41522d';
        ctx.beginPath();
        ctx.roundRect(-hullW / 2, -h / 2 + 14, hullW, h - 28, 10);
        ctx.fill();
        ctx.strokeStyle = '#283618';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Camouflage Pattern Patches
        ctx.fillStyle = '#2b3818';
        ctx.beginPath();
        ctx.roundRect(-hullW / 2 + 4, -h / 2 + 26, hullW * 0.55, 38, 8);
        ctx.roundRect(0, 15, hullW * 0.48, 45, 8);
        ctx.fill();

        ctx.fillStyle = '#526938';
        ctx.beginPath();
        ctx.roundRect(-hullW / 2 + 10, -h / 2 + 75, hullW * 0.6, 32, 6);
        ctx.fill();

        // Front Glacis Plate & Rivets
        ctx.fillStyle = '#1f2912';
        for (let bx = -hullW / 2 + 6; bx <= hullW / 2 - 6; bx += 12) {
            ctx.fillRect(bx, -h / 2 + 18, 2, 3);
            ctx.fillRect(bx, h / 2 - 20, 2, 3);
        }

        // Rear Engine Exhaust Louvers
        ctx.fillStyle = '#191c16';
        ctx.fillRect(-hullW / 2 + 6, h / 2 - 24, 15, 9);
        ctx.fillRect(hullW / 2 - 21, h / 2 - 24, 15, 9);

        // 4. Main 120mm Cannon Barrel
        ctx.fillStyle = '#283618';
        ctx.beginPath();
        ctx.roundRect(-6, -h / 2 - 42, 12, 70, 3);
        ctx.fill();
        ctx.strokeStyle = '#1a2310';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Cannon Muzzle Brake
        ctx.fillStyle = '#1b2614';
        ctx.fillRect(-9, -h / 2 - 48, 18, 10);
        ctx.fillRect(-7, -h / 2 - 52, 14, 5);

        // 5. Rotating Center Armor Turret
        ctx.save();
        ctx.rotate(v.turretAngle || 0);

        // Turret Cast Armor Body
        ctx.fillStyle = '#364724';
        ctx.beginPath();
        ctx.ellipse(0, 0, hullW * 0.44, 38, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#1d2713';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Commander Cupola Hatch
        ctx.fillStyle = '#232f17';
        ctx.beginPath();
        ctx.arc(-8, -10, 9, 0, Math.PI * 2);
        ctx.fill();

        // White Military Tactical Star Insignia on Turret
        ctx.fillStyle = '#ffffff';
        ctx.font = '900 15px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText("★", 10, 10);

        ctx.restore();
    }
}

window.TrafficManager = TrafficManager;

