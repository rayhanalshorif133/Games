/**
 * Roadside Scenery, Parallax Environment, Overhead Bridges, High-Speed Trains & Roadside Warning Signboards
 * Generates continuous parallax terrain, houses, villas, crops, tree groves, bird flocks,
 * Roadside Warning Signboards ("Road Damage Ahead", "Railway Station Ahead", "Military Zone"),
 * and Highway Overpasses & Railway Bridges with High-Speed Bullet Trains!
 */

class SceneryManager {
    constructor(game) {
        this.game = game;
        this.sceneryItems = [];
        this.birds = [];
        this.overpasses = [];
        this.roadSigns = [];
        this.roadScrollY = 0;
        this.roadWidth = 520;
        this.roadLeft = (1080 - this.roadWidth) / 2; // 280
        this.roadRight = this.roadLeft + this.roadWidth; // 800

        this.leftSpawnY = -200;
        this.rightSpawnY = -200;
        this.birdSpawnTimer = 0;
        this.overpassTimer = 0;
        this.overpassInterval = 420; // Spawns an overbridge frequently every ~7 seconds

        this.initInitialScenery();
    }

    reset() {
        this.sceneryItems = [];
        this.birds = [];
        this.overpasses = [];
        this.roadSigns = [];
        this.leftSpawnY = -200;
        this.rightSpawnY = -200;
        this.birdSpawnTimer = 0;
        this.overpassTimer = 0;
        this.initInitialScenery();
    }

    initInitialScenery() {
        // Prepopulate the screen with scenery from top to bottom
        for (let y = -200; y < 2100; y += 360) {
            this.spawnSceneryBlock('left', y);
            this.spawnSceneryBlock('right', y);
        }
        // Add initial birds
        this.spawnBirdFlock(800, 600);

        // Spawn immediate overpasses and advance warning signs
        this.spawnOverpass(-220);
        this.spawnRoadSign('train_station', 100);
        this.spawnOverpass(-1050);
        this.spawnRoadSign('road_damage_right', -400);
        this.spawnRoadSign('railway_ahead', -750);
    }

    spawnSceneryBlock(side, yPos) {
        const isLeft = side === 'left';
        const roll = Math.random();

        if (roll < 0.32) {
            // Terracotta House
            this.sceneryItems.push({
                type: 'house_terracotta',
                sprite: 'house_terracotta.png',
                x: isLeft ? 140 : 940,
                y: yPos,
                w: 260,
                h: 240,
                side: side
            });
        } else if (roll < 0.58) {
            // Blue Hip Roof House
            this.sceneryItems.push({
                type: 'house_blue',
                sprite: 'house_blue.png',
                x: isLeft ? 140 : 940,
                y: yPos,
                w: 230,
                h: 230,
                side: side
            });
        } else if (roll < 0.82) {
            // Striped Farmland Crops
            this.sceneryItems.push({
                type: 'crops',
                sprite: 'crops_field.png',
                x: isLeft ? 140 : 940,
                y: yPos,
                w: 280,
                h: 400,
                side: side
            });
        } else {
            // Tree Grove
            this.sceneryItems.push({
                type: 'tree_large',
                sprite: 'tree_large.png',
                x: isLeft ? 100 : 980,
                y: yPos,
                w: 180,
                h: 180,
                side: side
            });
            this.sceneryItems.push({
                type: 'tree_medium',
                sprite: 'tree_medium.png',
                x: isLeft ? 220 : 860,
                y: yPos + 100,
                w: 120,
                h: 120,
                side: side
            });
        }

        // Periodically stamp "LONG LIVE THE TRUE" on right fields
        if (!isLeft && Math.random() < 0.3) {
            this.sceneryItems.push({
                type: 'stamp_text',
                x: 940,
                y: yPos + 200,
                side: 'right'
            });
        }
    }

    spawnBirdFlock(startX = 900, startY = -100) {
        const count = Math.floor(MathUtils.randRange(2, 5));
        const baseSpeedX = MathUtils.randRange(-1.5, -0.5);
        const baseSpeedY = MathUtils.randRange(1.8, 3.2);

        for (let i = 0; i < count; i++) {
            this.birds.push({
                x: startX + (i * 45) + MathUtils.randRange(-15, 15),
                y: startY + (i * 35) + MathUtils.randRange(-10, 10),
                vx: baseSpeedX + MathUtils.randRange(-0.2, 0.2),
                vy: baseSpeedY + MathUtils.randRange(-0.2, 0.2),
                frame: Math.floor(Math.random() * 3),
                animTimer: Math.floor(Math.random() * 10),
                w: 60,
                h: 50
            });
        }
    }

    spawnRoadSign(type, yPos, side = 'both') {
        const sides = side === 'both' ? ['left', 'right'] : [side];
        sides.forEach((s) => {
            const x = s === 'left' ? 180 : 900;
            this.roadSigns.push({
                type: type, // 'road_damage_left', 'road_damage_right', 'railway_ahead', 'train_station', 'military_zone', 'overpass_ahead'
                x: x,
                y: yPos,
                side: s,
                lightTimer: Math.floor(Math.random() * 30)
            });
        });
    }

    spawnOverpass(yPos = -380) {
        const roll = Math.random();
        let type = 'railway_bullet';
        if (roll < 0.50) {
            type = 'railway_bullet'; // High-Speed Aerodynamic Bullet Train
        } else if (roll < 0.80) {
            type = 'railway_freight'; // Heavy Cargo Freight Train
        } else {
            type = 'highway_overpass'; // Vehicular Overpass with Highway Route Signs
        }

        const isMovingRight = Math.random() < 0.5;
        const trainSpeed = (type === 'railway_bullet' ? 32 : (type === 'railway_freight' ? 22 : 14)) * (isMovingRight ? 1 : -1);

        let train = null;
        if (type.startsWith('railway')) {
            const isBullet = type === 'railway_bullet';
            const carCount = isBullet ? 6 : 7;
            const cars = [];
            const carW = isBullet ? 220 : 180;
            const carH = 52;
            const freightColors = ['#0077b6', '#e63946', '#2a9d8f', '#e76f51', '#f4a261', '#457b9d', '#606c38'];

            for (let i = 0; i < carCount; i++) {
                cars.push({
                    isFront: i === 0,
                    isRear: i === carCount - 1,
                    w: carW,
                    h: carH,
                    color: isBullet ? (i === 0 || i === carCount - 1 ? '#00b4d8' : '#f8f9fa') : MathUtils.randChoice(freightColors),
                    cargoLabel: isBullet ? 'SHINKANSEN EXPRESS' : MathUtils.randChoice(['MAERSK', 'FREIGHT', 'PACIFIC', 'LOGISTICS', 'CONTAINER'])
                });
            }

            train = {
                active: true,
                isBullet: isBullet,
                isMovingRight: isMovingRight,
                x: isMovingRight ? -650 : 1650,
                vx: trainSpeed,
                cars: cars,
                carW: carW,
                totalW: carCount * (carW + 12),
                hornPlayed: false,
                rumbleTimer: 0
            };
        } else {
            // Highway Overpass Cross Traffic
            train = {
                active: true,
                isHighway: true,
                isMovingRight: isMovingRight,
                cars: [
                    { x: isMovingRight ? -220 : 1300, vx: (isMovingRight ? 14 : -14), sprite: 'car_blue.png', w: 85, h: 42 },
                    { x: isMovingRight ? -500 : 1580, vx: (isMovingRight ? 15 : -15), sprite: 'car_yellow.png', w: 85, h: 42 },
                    { x: isMovingRight ? -780 : 1860, vx: (isMovingRight ? 12 : -12), sprite: 'car_truck.png', w: 125, h: 50 }
                ]
            };
        }

        this.overpasses.push({
            type: type,
            y: yPos,
            h: 175,
            train: train
        });

        // Spawn advance warning signboard ahead of the overpass/train station
        this.spawnRoadSign(type.startsWith('railway') ? 'train_station' : 'overpass_ahead', yPos - 500);
    }

    update(playerSpeed) {
        // Road texture scrolling offset
        this.roadScrollY = (this.roadScrollY + playerSpeed) % 480;

        // 1. Update Scenery items
        for (let i = this.sceneryItems.length - 1; i >= 0; i--) {
            const item = this.sceneryItems[i];
            item.y += playerSpeed;

            if (item.y > 2200) {
                this.sceneryItems.splice(i, 1);
            }
        }

        // Spawn new scenery chunks at top
        let highestLeftY = 2000;
        let highestRightY = 2000;
        for (const item of this.sceneryItems) {
            if (item.side === 'left' && item.y < highestLeftY) highestLeftY = item.y;
            if (item.side === 'right' && item.y < highestRightY) highestRightY = item.y;
        }

        if (highestLeftY > -100) {
            this.spawnSceneryBlock('left', highestLeftY - 360);
        }
        if (highestRightY > -100) {
            this.spawnSceneryBlock('right', highestRightY - 360);
        }

        // 2. Bird spawning & animation
        this.birdSpawnTimer++;
        if (this.birdSpawnTimer > 240) {
            this.birdSpawnTimer = 0;
            this.spawnBirdFlock(MathUtils.randRange(400, 1000), -120);
            if (Math.random() < 0.5) window.soundManager.playChirp();
        }

        for (let i = this.birds.length - 1; i >= 0; i--) {
            const b = this.birds[i];
            b.x += b.vx;
            b.y += b.vy + (playerSpeed * 0.45);

            b.animTimer++;
            if (b.animTimer > 8) {
                b.animTimer = 0;
                b.frame = (b.frame + 1) % 3;
            }

            if (b.y > 2100 || b.x < -100 || b.x > 1200) {
                this.birds.splice(i, 1);
            }
        }

        // 3. Update Roadside Warning Signboards
        for (let s = this.roadSigns.length - 1; s >= 0; s--) {
            const sign = this.roadSigns[s];
            sign.y += playerSpeed;
            sign.lightTimer++;

            if (sign.y > 2200) {
                this.roadSigns.splice(s, 1);
            }
        }

        // 4. Update Overhead Bridges & Passing Trains
        this.overpassTimer++;
        if (this.overpassTimer > this.overpassInterval) {
            this.overpassTimer = 0;
            this.spawnOverpass(-380);
            this.overpassInterval = Math.floor(MathUtils.randRange(320, 480));
        }

        for (let j = this.overpasses.length - 1; j >= 0; j--) {
            const op = this.overpasses[j];
            op.y += playerSpeed;

            if (op.train) {
                if (op.train.isHighway) {
                    for (const hc of op.train.cars) {
                        hc.x += hc.vx;
                    }
                } else {
                    op.train.x += op.train.vx;

                    // Train Horn & Screen Shake trigger when entering highway overhead
                    if (!op.train.hornPlayed && op.y > -220 && op.y < 1600) {
                        const trainCenter = op.train.x + (op.train.totalW / 2);
                        if (trainCenter > -150 && trainCenter < 1230) {
                            op.train.hornPlayed = true;
                            window.soundManager.playTrainHorn();
                            this.game.screenShake = 7;
                            this.game.particles.addScorePopup(
                                540,
                                Math.max(160, op.y - 45),
                                op.train.isBullet ? "🚆 BULLET TRAIN OVERHEAD! 🚆" : "🚂 FREIGHT TRAIN OVERHEAD! 🚂",
                                "#ffd166"
                            );
                        }
                    }

                    // Train track rumble sound
                    if (op.y > 0 && op.y < 1920) {
                        op.train.rumbleTimer = (op.train.rumbleTimer || 0) + 1;
                        if (op.train.rumbleTimer % 35 === 0) {
                            window.soundManager.playTrainRumble();
                        }
                    }
                }
            }

            if (op.y > 2300) {
                this.overpasses.splice(j, 1);
            }
        }
    }

    drawTerrain(ctx) {
        // 1. Olive Green Meadow Base (#898630)
        ctx.fillStyle = '#898630';
        ctx.fillRect(0, 0, 1080, 1920);

        // 2. Draw Side Scenery (Under road / beside road)
        for (const item of this.sceneryItems) {
            if (item.type === 'stamp_text') {
                ctx.save();
                ctx.translate(item.x, item.y);
                ctx.font = '900 42px "Impact", "Arial Black", sans-serif';
                ctx.fillStyle = 'rgba(72, 82, 40, 0.45)';
                ctx.textAlign = 'center';
                ctx.letterSpacing = '3px';
                ctx.fillText("LONG LIVE", 0, -25);
                ctx.fillText("THE TRUE", 0, 25);
                ctx.restore();
                continue;
            }

            const sprite = this.game.assets.images[item.sprite];
            if (sprite) {
                ctx.save();
                ctx.drawImage(sprite, item.x - item.w / 2, item.y - item.h / 2, item.w, item.h);
                ctx.restore();
            }
        }

        // 3. Draw Golden Highway Road
        ctx.save();
        ctx.fillStyle = '#d7b365';
        ctx.fillRect(this.roadLeft, 0, this.roadWidth, 1920);

        // Curbs
        ctx.fillStyle = '#fcf1b6';
        ctx.fillRect(this.roadLeft, 0, 16, 1920);
        ctx.fillRect(this.roadRight - 16, 0, 16, 1920);

        // Center Dashed Dividers (Scrolling)
        const laneX = this.roadLeft + this.roadWidth / 2;
        const dashW = 10;
        const dashLen = 50;
        const gap = 50;
        const totalPattern = dashLen + gap;

        ctx.fillStyle = '#fcf1b6';
        const startY = (this.roadScrollY % totalPattern) - totalPattern;
        for (let y = startY; y < 1920 + totalPattern; y += totalPattern) {
            ctx.fillRect(laneX - dashW / 2, y, dashW, dashLen);
        }
        ctx.restore();
    }

    drawBridgeShadows(ctx) {
        for (const op of this.overpasses) {
            if (op.y > -350 && op.y < 2100) {
                ctx.save();
                const shadowGrad = ctx.createLinearGradient(0, op.y + op.h - 30, 0, op.y + op.h + 130);
                shadowGrad.addColorStop(0, 'rgba(10, 15, 12, 0.52)');
                shadowGrad.addColorStop(0.5, 'rgba(10, 15, 12, 0.35)');
                shadowGrad.addColorStop(1, 'rgba(10, 15, 12, 0)');
                ctx.fillStyle = shadowGrad;
                ctx.fillRect(this.roadLeft - 40, op.y + op.h - 30, this.roadWidth + 80, 160);
                ctx.restore();
            }
        }
    }

    drawBirds(ctx) {
        const frames = ['bird_f1.png', 'bird_f2.png', 'bird_f3.png'];

        for (const b of this.birds) {
            const spriteName = frames[b.frame];
            const sprite = this.game.assets.images[spriteName];
            if (sprite) {
                ctx.save();
                ctx.drawImage(sprite, b.x - b.w / 2, b.y - b.h / 2, b.w, b.h);
                ctx.restore();
            }
        }
    }

    drawRoadSigns(ctx) {
        // Renders realistic roadside hazard and information warning signboards on grass shoulders
        for (const s of this.roadSigns) {
            if (s.y < -200 || s.y > 2100) continue;

            ctx.save();
            ctx.translate(s.x, s.y);

            // Double Steel Signpost Poles
            ctx.fillStyle = '#495057';
            ctx.fillRect(-60, 0, 8, 120);
            ctx.fillRect(52, 0, 8, 120);

            // Ground Foundation
            ctx.fillStyle = '#212529';
            ctx.fillRect(-64, 110, 16, 12);
            ctx.fillRect(48, 110, 16, 12);

            // Signboard Frame
            const sw = 170;
            const sh = 115;
            ctx.fillStyle = '#111210';
            ctx.beginPath();
            ctx.roundRect(-sw / 2 - 4, -4, sw + 8, sh + 8, 10);
            ctx.fill();

            // Signboard Content & Graphics
            if (s.type === 'road_damage_left' || s.type === 'road_damage_right') {
                // High-visibility Construction Orange/Yellow
                const bg = ctx.createLinearGradient(0, 0, 0, sh);
                bg.addColorStop(0, '#ff7b00');
                bg.addColorStop(1, '#e85d04');
                ctx.fillStyle = bg;
                ctx.beginPath();
                ctx.roundRect(-sw / 2, 0, sw, sh, 8);
                ctx.fill();
                ctx.strokeStyle = '#000000';
                ctx.lineWidth = 3;
                ctx.stroke();

                // Flashing Amber Warning Strobes
                const flash = Math.sin(s.lightTimer * 0.25) > 0;
                ctx.fillStyle = flash ? '#ffea00' : '#705300';
                ctx.shadowColor = flash ? '#ffea00' : 'transparent';
                ctx.shadowBlur = flash ? 18 : 0;
                ctx.beginPath();
                ctx.arc(-40, -10, 8, 0, Math.PI * 2);
                ctx.arc(40, -10, 8, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0;

                // Sign Text
                ctx.fillStyle = '#000000';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.font = '900 18px "Segoe UI", Arial, sans-serif';
                ctx.fillText("⚠️ CAUTION ⚠️", 0, 22);

                ctx.font = '900 16px "Arial Black", Impact, sans-serif';
                ctx.fillText("ROAD DAMAGE", 0, 48);
                ctx.fillText("AHEAD", 0, 68);

                ctx.fillStyle = '#111210';
                ctx.font = '900 17px "Segoe UI", Arial, sans-serif';
                const detourText = s.type === 'road_damage_left' ? "KEEP RIGHT ➔" : "⬅ KEEP LEFT";
                ctx.fillText(detourText, 0, 94);

            } else if (s.type === 'railway_ahead' || s.type === 'train_station') {
                // Diamond Railroad Yellow
                const bg = ctx.createLinearGradient(0, 0, 0, sh);
                bg.addColorStop(0, '#ffd166');
                bg.addColorStop(1, '#ffb703');
                ctx.fillStyle = bg;
                ctx.beginPath();
                ctx.roundRect(-sw / 2, 0, sw, sh, 8);
                ctx.fill();
                ctx.strokeStyle = '#000000';
                ctx.lineWidth = 3;
                ctx.stroke();

                // Flashing Red Alert Light
                const flash = Math.sin(s.lightTimer * 0.3) > 0;
                ctx.fillStyle = flash ? '#ff0033' : '#590d18';
                ctx.shadowColor = flash ? '#ff0033' : 'transparent';
                ctx.shadowBlur = flash ? 18 : 0;
                ctx.beginPath();
                ctx.arc(0, -12, 10, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0;

                ctx.fillStyle = '#000000';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.font = '900 17px "Segoe UI", Arial, sans-serif';
                ctx.fillText(s.type === 'train_station' ? "🚆 RAILWAY 🚆" : "🚂 CROSSING 🚂", 0, 22);

                ctx.font = '900 15px "Arial Black", Impact, sans-serif';
                ctx.fillText(s.type === 'train_station' ? "STATION 200M" : "TRAIN CROSSING", 0, 48);
                ctx.fillText("AHEAD", 0, 68);

                ctx.font = '900 14px "Segoe UI", Arial, sans-serif';
                ctx.fillStyle = '#b7094c';
                ctx.fillText("BE PREPARED TO STOP", 0, 94);

            } else if (s.type === 'military_zone') {
                // Red & White Tactical Hazard Sign
                const bg = ctx.createLinearGradient(0, 0, 0, sh);
                bg.addColorStop(0, '#d90429');
                bg.addColorStop(1, '#9b2226');
                ctx.fillStyle = bg;
                ctx.beginPath();
                ctx.roundRect(-sw / 2, 0, sw, sh, 8);
                ctx.fill();
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 3;
                ctx.stroke();

                // Flashing Siren
                const flash = Math.sin(s.lightTimer * 0.35) > 0;
                ctx.fillStyle = flash ? '#00f0ff' : '#0077b6';
                ctx.shadowColor = flash ? '#00f0ff' : 'transparent';
                ctx.shadowBlur = flash ? 20 : 0;
                ctx.beginPath();
                ctx.arc(0, -12, 10, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0;

                ctx.fillStyle = '#ffffff';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.font = '900 18px "Segoe UI", Arial, sans-serif';
                ctx.fillText("🚨 WARNING 🚨", 0, 22);

                ctx.font = '900 15px "Arial Black", Impact, sans-serif';
                ctx.fillText("MILITARY CONVOY", 0, 48);
                ctx.fillText("HEAVY TANKS", 0, 68);

                ctx.font = '900 14px "Segoe UI", Arial, sans-serif';
                ctx.fillStyle = '#ffd166';
                ctx.fillText("ARMORED ZONE", 0, 94);

            } else {
                // Green Highway Route Information Sign
                const bg = ctx.createLinearGradient(0, 0, 0, sh);
                bg.addColorStop(0, '#065f46');
                bg.addColorStop(1, '#044e3a');
                ctx.fillStyle = bg;
                ctx.beginPath();
                ctx.roundRect(-sw / 2, 0, sw, sh, 8);
                ctx.fill();
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 3;
                ctx.stroke();

                ctx.fillStyle = '#ffffff';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.font = '900 18px "Segoe UI", Arial, sans-serif';
                ctx.fillText("🌉 OVERPASS 🌉", 0, 24);

                ctx.font = 'bold 15px "Segoe UI", Arial, sans-serif';
                ctx.fillText("EXPRESS HIGHWAY", 0, 52);
                ctx.fillText("CLEARANCE 5.0M", 0, 74);

                ctx.font = 'bold 14px "Segoe UI", Arial, sans-serif';
                ctx.fillStyle = '#ffd166';
                ctx.fillText("⬆ MAINTAIN SPEED", 0, 96);
            }

            ctx.restore();
        }
    }

    drawOverpasses(ctx) {
        for (const op of this.overpasses) {
            if (op.y < -400 || op.y > 2200) continue;

            ctx.save();

            // 1. Concrete Bridge Support Piers on Road Shoulders
            const drawPier = (px) => {
                ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
                ctx.fillRect(px - 6, op.y - 20, 64, op.h + 50);

                const pierGrad = ctx.createLinearGradient(px, 0, px + 52, 0);
                pierGrad.addColorStop(0, '#5c677d');
                pierGrad.addColorStop(0.4, '#7d8597');
                pierGrad.addColorStop(1, '#33415c');
                ctx.fillStyle = pierGrad;
                ctx.beginPath();
                ctx.roundRect(px, op.y - 20, 52, op.h + 40, 8);
                ctx.fill();
                ctx.strokeStyle = '#2b2d42';
                ctx.lineWidth = 2.5;
                ctx.stroke();

                const hzH = 45;
                const hzY = op.y + op.h - 15;
                ctx.save();
                ctx.beginPath();
                ctx.roundRect(px + 2, hzY, 48, hzH, 6);
                ctx.clip();
                ctx.fillStyle = '#ffd166';
                ctx.fillRect(px + 2, hzY, 48, hzH);
                ctx.fillStyle = '#111210';
                for (let k = -20; k < 70; k += 16) {
                    ctx.beginPath();
                    ctx.moveTo(px + k, hzY);
                    ctx.lineTo(px + k + 10, hzY);
                    ctx.lineTo(px + k - 2, hzY + hzH);
                    ctx.lineTo(px + k - 12, hzY + hzH);
                    ctx.fill();
                }
                ctx.restore();
            };

            drawPier(205);
            drawPier(825);

            // 2. Main Bridge Superstructure & Deck
            const isRailway = op.type.startsWith('railway');

            if (isRailway) {
                const girderGrad = ctx.createLinearGradient(0, op.y, 0, op.y + op.h);
                girderGrad.addColorStop(0, '#2b2d42');
                girderGrad.addColorStop(0.6, '#3d405b');
                girderGrad.addColorStop(1, '#1a1a24');
                ctx.fillStyle = girderGrad;
                ctx.fillRect(0, op.y + 35, 1080, op.h - 45);

                ctx.fillStyle = '#3a3d40';
                ctx.fillRect(0, op.y + 40, 1080, 85);

                ctx.fillStyle = '#4a3f35';
                for (let tx = 0; tx < 1080; tx += 24) {
                    ctx.fillRect(tx, op.y + 44, 14, 76);
                }

                const drawRail = (ry) => {
                    ctx.fillStyle = '#78909c';
                    ctx.fillRect(0, ry, 1080, 7);
                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(0, ry + 1, 1080, 2);
                    ctx.fillStyle = '#263238';
                    ctx.fillRect(0, ry + 6, 1080, 2);
                };

                drawRail(op.y + 54);
                drawRail(op.y + 70);
                drawRail(op.y + 90);
                drawRail(op.y + 106);

                for (let gx = 80; gx < 1080; gx += 320) {
                    ctx.fillStyle = '#6c757d';
                    ctx.fillRect(gx - 4, op.y - 15, 8, 60);
                    ctx.fillRect(gx - 20, op.y - 15, 40, 6);
                }
                ctx.strokeStyle = '#adb5bd';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.moveTo(0, op.y - 12);
                ctx.lineTo(1080, op.y - 12);
                ctx.moveTo(0, op.y + 6);
                ctx.lineTo(1080, op.y + 6);
                ctx.stroke();

                // 3. Render High-Speed Passing Train
                if (op.train && !op.train.isHighway) {
                    const t = op.train;
                    const isBullet = t.isBullet;
                    const trainY = op.y + 42;

                    for (let cIdx = 0; cIdx < t.cars.length; cIdx++) {
                        const car = t.cars[cIdx];
                        const carX = t.x + (cIdx * (t.carW + 10));

                        if (carX + t.carW < -100 || carX > 1180) continue;

                        ctx.save();
                        ctx.translate(carX, trainY);

                        if (isBullet) {
                            const isFront = (t.isMovingRight && car.isFront) || (!t.isMovingRight && car.isRear);
                            const isTail = (t.isMovingRight && car.isRear) || (!t.isMovingRight && car.isFront);

                            const bodyGrad = ctx.createLinearGradient(0, 0, 0, car.h);
                            bodyGrad.addColorStop(0, '#ffffff');
                            bodyGrad.addColorStop(0.5, '#e9ecef');
                            bodyGrad.addColorStop(1, '#ced4da');
                            ctx.fillStyle = bodyGrad;

                            ctx.beginPath();
                            if (isFront) {
                                if (t.isMovingRight) {
                                    ctx.roundRect(0, 0, car.w, car.h, [10, 26, 10, 10]);
                                } else {
                                    ctx.roundRect(0, 0, car.w, car.h, [26, 10, 10, 10]);
                                }
                            } else {
                                ctx.roundRect(0, 0, car.w, car.h, 8);
                            }
                            ctx.fill();
                            ctx.strokeStyle = '#0077b6';
                            ctx.lineWidth = 3;
                            ctx.stroke();

                            ctx.fillStyle = '#00b4d8';
                            ctx.fillRect(0, car.h * 0.46, car.w, 10);
                            ctx.fillStyle = '#03045e';
                            ctx.fillRect(0, car.h * 0.62, car.w, 5);

                            ctx.fillStyle = 'rgba(255, 230, 110, 0.95)';
                            for (let wx = 18; wx < car.w - 25; wx += 32) {
                                ctx.beginPath();
                                ctx.roundRect(wx, 10, 20, 14, 4);
                                ctx.fill();
                                ctx.strokeStyle = '#1d3557';
                                ctx.lineWidth = 1.5;
                                ctx.stroke();
                            }

                            if (isFront) {
                                const hlx = t.isMovingRight ? car.w - 8 : 8;
                                ctx.fillStyle = '#fffffa';
                                ctx.shadowColor = '#00f0ff';
                                ctx.shadowBlur = 24;
                                ctx.beginPath();
                                ctx.arc(hlx, car.h * 0.45, 10, 0, Math.PI * 2);
                                ctx.fill();
                                ctx.shadowBlur = 0;

                                const beamGrad = ctx.createLinearGradient(hlx, 0, hlx + (t.isMovingRight ? 240 : -240), 0);
                                beamGrad.addColorStop(0, 'rgba(255, 255, 255, 0.7)');
                                beamGrad.addColorStop(1, 'rgba(0, 240, 255, 0)');
                                ctx.fillStyle = beamGrad;
                                ctx.beginPath();
                                ctx.moveTo(hlx, car.h * 0.45);
                                ctx.lineTo(hlx + (t.isMovingRight ? 240 : -240), car.h * 0.45 - 28);
                                ctx.lineTo(hlx + (t.isMovingRight ? 240 : -240), car.h * 0.45 + 28);
                                ctx.fill();
                            }

                            if (cIdx === 1 || cIdx === 4) {
                                ctx.strokeStyle = '#e63946';
                                ctx.lineWidth = 3;
                                ctx.beginPath();
                                ctx.moveTo(car.w / 2 - 15, 0);
                                ctx.lineTo(car.w / 2, -18);
                                ctx.lineTo(car.w / 2 + 15, 0);
                                ctx.stroke();
                                ctx.fillStyle = '#00f0ff';
                                ctx.shadowColor = '#00f0ff';
                                ctx.shadowBlur = 12;
                                ctx.beginPath();
                                ctx.arc(car.w / 2, -18, 4, 0, Math.PI * 2);
                                ctx.fill();
                                ctx.shadowBlur = 0;
                            }

                        } else {
                            ctx.fillStyle = car.color;
                            ctx.beginPath();
                            ctx.roundRect(0, 4, car.w, car.h - 4, 6);
                            ctx.fill();
                            ctx.strokeStyle = '#1f2421';
                            ctx.lineWidth = 2.5;
                            ctx.stroke();

                            ctx.strokeStyle = 'rgba(0, 0, 0, 0.28)';
                            ctx.lineWidth = 2;
                            for (let rx = 12; rx < car.w - 12; rx += 14) {
                                ctx.beginPath();
                                ctx.moveTo(rx, 8);
                                ctx.lineTo(rx, car.h - 4);
                                ctx.stroke();
                            }

                            ctx.font = '900 16px "Arial Black", Impact, sans-serif';
                            ctx.fillStyle = '#ffffff';
                            ctx.textAlign = 'center';
                            ctx.textBaseline = 'middle';
                            ctx.fillText(car.cargoLabel, car.w / 2, car.h / 2 + 2);
                        }

                        ctx.restore();
                    }
                }

                const bannerY = op.y + op.h - 32;
                ctx.fillStyle = '#1a1a24';
                ctx.fillRect(0, bannerY, 1080, 32);

                ctx.fillStyle = '#ffd166';
                ctx.font = '900 20px "Segoe UI", Arial, sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText("⚠️  RAILWAY OVERPASS  •  CLEARANCE 5.2M  ⚠️", 540, bannerY + 16);

                ctx.strokeStyle = '#8d99ae';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(0, op.y + 36);
                ctx.lineTo(1080, op.y + 36);
                for (let rx = 10; rx < 1080; rx += 25) {
                    ctx.moveTo(rx, op.y + 36);
                    ctx.lineTo(rx, op.y + 44);
                }
                ctx.stroke();

            } else {
                const hwyGrad = ctx.createLinearGradient(0, op.y, 0, op.y + op.h);
                hwyGrad.addColorStop(0, '#3a506b');
                hwyGrad.addColorStop(0.6, '#495057');
                hwyGrad.addColorStop(1, '#212529');
                ctx.fillStyle = hwyGrad;
                ctx.fillRect(0, op.y + 30, 1080, op.h - 40);

                ctx.fillStyle = '#2b2d42';
                ctx.fillRect(0, op.y + 35, 1080, 80);

                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 3;
                ctx.setLineDash([20, 15]);
                ctx.beginPath();
                ctx.moveTo(0, op.y + 75);
                ctx.lineTo(1080, op.y + 75);
                ctx.stroke();
                ctx.setLineDash([]);

                if (op.train && op.train.isHighway) {
                    for (const hc of op.train.cars) {
                        const sprite = this.game.assets.images[hc.sprite];
                        if (sprite && hc.x > -150 && hc.x < 1200) {
                            ctx.save();
                            ctx.translate(hc.x, op.y + 55);
                            if (hc.vx < 0) ctx.scale(-1, 1);
                            ctx.drawImage(sprite, -hc.w / 2, -hc.h / 2, hc.w, hc.h);
                            ctx.restore();
                        }
                    }
                }

                const drawHighwaySign = (sx, sy, sw, sh, text1, text2) => {
                    ctx.fillStyle = '#065f46';
                    ctx.beginPath();
                    ctx.roundRect(sx, sy, sw, sh, 6);
                    ctx.fill();
                    ctx.strokeStyle = '#ffffff';
                    ctx.lineWidth = 2.5;
                    ctx.stroke();

                    ctx.fillStyle = '#ffffff';
                    ctx.font = '900 18px "Segoe UI", Arial, sans-serif';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(text1, sx + sw / 2, sy + 18);
                    ctx.font = 'bold 15px "Segoe UI", Arial, sans-serif';
                    ctx.fillText(text2, sx + sw / 2, sy + 40);
                };

                drawHighwaySign(320, op.y - 35, 200, 60, "⬆ I-95 NORTH", "EXPRESSWAY");
                drawHighwaySign(560, op.y - 35, 200, 60, "⬈ EXIT 14", "METRO AIRPORT");

                const bannerY = op.y + op.h - 30;
                ctx.fillStyle = '#111210';
                ctx.fillRect(0, bannerY, 1080, 30);
                ctx.fillStyle = '#ffd166';
                ctx.font = '900 19px "Segoe UI", Arial, sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText("⚠️  HIGHWAY OVERPASS  •  MAX CLEARANCE 5.0M  ⚠️", 540, bannerY + 15);
            }

            ctx.restore();
        }
    }
}

window.SceneryManager = SceneryManager;
