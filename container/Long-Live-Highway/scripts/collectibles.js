/**
 * Collectibles & Road Hazards Manager
 * Handles spawning and collecting Fuel canisters, Coins, Nitro boosts, Shields, and Oil slicks,
 * as well as treacherous Broken Road sections with burning fire pits, and Ground-Level Railway Crossings with Passing Trains!
 */

class CollectiblesManager {
    constructor(game) {
        this.game = game;
        this.items = [];
        this.brokenRoads = [];
        this.railCrossings = [];
        this.spawnTimer = 0;
        this.roadHazardTimer = 0;
        this.railCrossingTimer = 0;
        this.lanes = [390, 490, 590, 690];
    }

    reset() {
        this.items = [];
        this.brokenRoads = [];
        this.railCrossings = [];
        this.spawnTimer = 0;
        this.roadHazardTimer = 0;
        this.railCrossingTimer = 0;
    }

    spawnCoinTrail(laneX, count = 4) {
        for (let i = 0; i < count; i++) {
            this.items.push({
                type: 'coin',
                sprite: 'pickup_coin.png',
                w: 64,
                h: 64,
                x: laneX,
                y: -100 - (i * 90),
                bobOffset: i * 0.4
            });
        }
    }

    spawnRandomItem() {
        const laneX = MathUtils.randChoice(this.lanes);
        const roll = Math.random();

        if (roll < 0.38) {
            // Coins trail
            this.spawnCoinTrail(laneX, Math.floor(MathUtils.randRange(3, 6)));
        } else if (roll < 0.62) {
            // Fuel canister (vital!)
            this.items.push({
                type: 'fuel',
                sprite: 'pickup_fuel.png',
                w: 68,
                h: 68,
                x: laneX,
                y: -100,
                bobOffset: Math.random()
            });
        } else if (roll < 0.82) {
            // Nitro bottle (Spawns on road for player to collect!)
            this.items.push({
                type: 'nitro',
                sprite: 'pickup_nitro.png',
                w: 68,
                h: 68,
                x: laneX,
                y: -100,
                bobOffset: Math.random()
            });
        } else if (roll < 0.92) {
            // Shield
            this.items.push({
                type: 'shield',
                sprite: 'pickup_shield.png',
                w: 68,
                h: 68,
                x: laneX,
                y: -100,
                bobOffset: Math.random()
            });
        } else {
            // Hazard: Oil slick
            this.items.push({
                type: 'oil',
                sprite: 'hazard_oil.png',
                w: 80,
                h: 60,
                x: laneX,
                y: -100,
                bobOffset: 0
            });
        }
    }

    spawnBrokenRoadHazard() {
        const isLeft = Math.random() > 0.5;
        const hazardX = isLeft ? 280 : 530;
        const hazardW = 270;
        const hazardH = Math.floor(MathUtils.randRange(650, 900));

        this.brokenRoads.push({
            side: isLeft ? 'left' : 'right',
            x: hazardX,
            y: -hazardH - 50,
            w: hazardW,
            h: hazardH,
            flameTimer: 0,
            fissureOffsets: [
                MathUtils.randRange(20, 60),
                MathUtils.randRange(80, 140),
                MathUtils.randRange(160, 220)
            ],
            warned: false
        });

        // Spawn advance roadside warning signboard on the grass shoulder ahead of the hazard
        if (this.game.scenery) {
            this.game.scenery.spawnRoadSign(isLeft ? 'road_damage_left' : 'road_damage_right', -hazardH - 450);
        }

        // Add warning popup
        this.game.particles.addScorePopup(540, 300, isLeft ? "⚠️ DANGER: LEFT ROAD ON FIRE! KEEP RIGHT ➡️" : "⚠️ DANGER: RIGHT ROAD ON FIRE! KEEP LEFT ⬅️", "#ff5400");
    }

    spawnRailCrossing(yPos = -350) {
        const isRight = Math.random() < 0.5;
        const trainSpeed = (isRight ? 26 : -26);
        const carCount = 6;
        const carW = 160;
        const carH = 64;
        const cars = [];
        const colors = ['#d90429', '#0077b6', '#2a9d8f', '#e76f51', '#f4a261', '#457b9d'];

        for (let i = 0; i < carCount; i++) {
            cars.push({
                isLoco: i === 0,
                color: i === 0 ? '#ffb703' : MathUtils.randChoice(colors),
                w: carW,
                h: carH,
                label: i === 0 ? 'LOCO' : MathUtils.randChoice(['MAERSK', 'CARGO', 'FREIGHT', 'OIL', 'STEEL'])
            });
        }

        this.railCrossings.push({
            y: yPos,
            h: 150,
            train: {
                isMovingRight: isRight,
                x: isRight ? -550 : 1550,
                vx: trainSpeed,
                cars: cars,
                carW: carW,
                totalW: carCount * (carW + 10),
                isBlasted: false
            },
            lightTimer: 0,
            warned: false
        });

        // Spawn advance roadside railway warning signboard
        if (this.game.scenery) {
            this.game.scenery.spawnRoadSign('railway_ahead', yPos - 500);
        }
    }

    update(playerSpeed) {
        const pDist = this.game.player.distance;

        // 1. Spawning pickups
        this.spawnTimer++;
        if (this.spawnTimer > 100) {
            this.spawnTimer = 0;
            this.spawnRandomItem();
        }

        // 2. Spawning Broken Road Burning Hazards (Starts after 220m distance)
        if (pDist >= 220) {
            this.roadHazardTimer++;
            const hazardInterval = Math.max(500, 1200 - Math.floor(pDist / 2.5));
            if (this.roadHazardTimer > hazardInterval) {
                this.roadHazardTimer = 0;
                this.spawnBrokenRoadHazard();
            }
        }

        // 3. Spawning Road-Level Railway Crossings with Trains (Starts after 900m distance, well-spaced!)
        if (pDist >= 900) {
            this.railCrossingTimer++;
            const crossingInterval = Math.max(2600, 3800 - Math.floor(pDist / 2));
            if (this.railCrossingTimer > crossingInterval) {
                this.railCrossingTimer = 0;
                this.spawnRailCrossing(-350);
            }
        }

        const p = this.game.player;
        const pBounds = p.getBounds();

        // 4. Update Broken Road Hazards
        for (let k = this.brokenRoads.length - 1; k >= 0; k--) {
            const br = this.brokenRoads[k];
            br.y += playerSpeed;
            br.flameTimer++;
            br.x = br.side === 'left' ? 280 : 530;

            // Emit roaring fire flame tongues & sparks
            if (br.y > -500 && br.y < 2100) {
                const numFlames = 3;
                for (let f = 0; f < numFlames; f++) {
                    const fx = br.x + MathUtils.randRange(25, br.w - 25);
                    const fy = br.y + MathUtils.randRange(30, br.h - 30);
                    this.game.particles.addFireFlame(fx, fy, MathUtils.randRange(14, 26));
                }

                // Heavy dark smoke rising
                if (br.flameTimer % 3 === 0) {
                    this.game.particles.particles.push({
                        type: 'smoke',
                        x: br.x + MathUtils.randRange(20, br.w - 20),
                        y: br.y + MathUtils.randRange(20, br.h - 20),
                        vx: MathUtils.randRange(-1, 1),
                        vy: MathUtils.randRange(-3, -1),
                        radius: MathUtils.randRange(18, 36),
                        maxRadius: 75,
                        alpha: 0.7,
                        decay: 0.02,
                        color: MathUtils.randChoice(['#1a1a24', '#2b2d42', '#ff5400', '#3a0ca3'])
                    });
                }
            }

            // Check collision with player car
            if (p.isAlive && !p.isAirborne) {
                const brBounds = {
                    x: br.x + 20,
                    y: br.y + 20,
                    w: br.w - 40,
                    h: br.h - 40
                };

                if (MathUtils.checkAABB(pBounds, brBounds)) {
                    if (p.isNitroActive) {
                        // Nitro blazes straight through the fire with bonus score!
                        if (br.flameTimer % 10 === 0) {
                            this.game.particles.addNitroRamBlast(p.x, p.y);
                            this.game.screenShake = 18;
                            p.score += 2;
                            this.game.particles.addScorePopup(p.x, p.y - 50, "🔥 +2 FIRE BLAZED!", "#00f0ff");
                        }
                    } else if (p.hasShield) {
                        // Shield protects from fire
                        if (br.flameTimer % 15 === 0) {
                            this.game.particles.addShieldDeflectBlast(p.x, p.y);
                            p.score += 1;
                        }
                    } else {
                        // Regular car burns and explodes!
                        p.die("BURNING ROAD HAZARD!");
                        return;
                    }
                }
            }

            // Remove offscreen
            if (br.y > 2200) {
                this.brokenRoads.splice(k, 1);
            }
        }

        // 5. Update Road Railway Level Crossings
        for (let r = this.railCrossings.length - 1; r >= 0; r--) {
            const rc = this.railCrossings[r];
            rc.y += playerSpeed;
            rc.train.x += rc.train.vx;

            const rLeft = 280;
            const rRight = 800;

            if (rc.y > -250 && rc.y < 2000) {
                rc.lightTimer++;
                // Ring crossing bell alarm
                if (rc.lightTimer % 18 === 0) {
                    window.soundManager.playCrossingBell();
                }

                if (!rc.warned) {
                    rc.warned = true;
                    this.game.particles.addScorePopup(540, 280, "🚨 RAILROAD CROSSING! TRAIN PASSING! 🚨", "#ff0055");
                    this.game.screenShake = 10;
                    window.soundManager.playTrainHorn();
                }

                // Locomotive diesel smoke
                if (rc.lightTimer % 4 === 0 && !rc.train.isBlasted) {
                    const locoX = rc.train.isMovingRight ? rc.train.x + 80 : rc.train.x + rc.train.totalW - 80;
                    if (locoX > rLeft - 80 && locoX < rRight + 80) {
                        this.game.particles.particles.push({
                            type: 'smoke',
                            x: locoX,
                            y: rc.y + 40,
                            vx: MathUtils.randRange(-1, 1),
                            vy: MathUtils.randRange(-3, -1),
                            radius: 20,
                            maxRadius: 60,
                            alpha: 0.75,
                            decay: 0.03,
                            color: '#2b2d42'
                        });
                    }
                }
            }

            // Check collision with player car
            if (p.isAlive && !p.isAirborne && !rc.train.isBlasted) {
                const trainLeft = rc.train.x;
                const trainRight = rc.train.x + rc.train.totalW;

                // Check if train is currently occupying the highway road area
                if (trainRight > rLeft && trainLeft < rRight) {
                    const trainBounds = {
                        x: Math.max(rLeft, trainLeft),
                        y: rc.y + 42,
                        w: Math.min(rRight, trainRight) - Math.max(rLeft, trainLeft),
                        h: 66
                    };

                    if (MathUtils.checkAABB(pBounds, trainBounds)) {
                        if (p.isNitroActive) {
                            // --- NITRO TRAIN RAM BLAST (+20 SCORE) ---
                            this.game.particles.addNitroRamBlast(p.x, p.y);
                            this.game.particles.addCarExplosion(p.x, p.y);
                            rc.train.isBlasted = true;
                            p.score += 20;
                            this.game.particles.addScorePopup(p.x, p.y - 60, "💥 +20 TRAIN DESTROYED!", "#00f0ff");
                            this.game.screenShake = 45;
                            window.soundManager.playNitroSmash();
                        } else if (p.hasShield) {
                            // --- SHIELD DEFLECTION BLAST (+10 SCORE) ---
                            this.game.particles.addShieldDeflectBlast(p.x, p.y);
                            p.hasShield = false;
                            p.score += 10;
                            rc.train.isBlasted = true;
                            this.game.particles.addScorePopup(p.x, p.y - 60, "🛡️ +10 TRAIN SMASHED!", "#48cae4");
                            this.game.screenShake = 25;
                            window.soundManager.playShieldShatter();
                        } else {
                            // Regular crash into passing train!
                            p.die("SMASHED BY PASSING TRAIN!");
                            return;
                        }
                    }
                }
            }

            // Remove offscreen
            if (rc.y > 2200) {
                this.railCrossings.splice(r, 1);
            }
        }

        // 6. Update Collectibles
        for (let i = this.items.length - 1; i >= 0; i--) {
            const item = this.items[i];
            item.y += playerSpeed;

            // Magnet attraction for coins
            if (p.hasMagnet && item.type === 'coin') {
                const d = MathUtils.dist(p.x, p.y, item.x, item.y);
                if (d < 420) {
                    item.x = MathUtils.lerp(item.x, p.x, 0.18);
                    item.y = MathUtils.lerp(item.y, p.y, 0.18);
                }
            }

            // Check collision with player
            if (p.isAlive) {
                const itemBounds = {
                    x: item.x - item.w * 0.4,
                    y: item.y - item.h * 0.4,
                    w: item.w * 0.8,
                    h: item.h * 0.8
                };

                if (MathUtils.checkAABB(pBounds, itemBounds)) {
                    if (item.type === 'coin') {
                        const coinX = item.x;
                        const coinY = item.y;
                        this.game.particles.addFlyingCoin(coinX, coinY, 180, 68, () => {
                            p.addCoins(1);
                            if (this.game.ui) this.game.ui.triggerCoinBump();
                        });
                        this.items.splice(i, 1);
                        continue;
                    } else if (item.type === 'fuel') {
                        p.addFuel(35);
                        this.items.splice(i, 1);
                        continue;
                    } else if (item.type === 'nitro') {
                        p.addNitro(1);
                        this.items.splice(i, 1);
                        continue;
                    } else if (item.type === 'shield') {
                        p.addShield(600);
                        this.items.splice(i, 1);
                        continue;
                    } else if (item.type === 'oil') {
                        if (!p.hasShield && !p.isNitroActive) {
                            p.triggerOilSpin();
                        }
                        this.items.splice(i, 1);
                        continue;
                    }
                }
            }

            // Remove offscreen
            if (item.y > 2100) {
                this.items.splice(i, 1);
            }
        }
    }

    draw(ctx) {
        // 1. Draw Broken Road Burning Fire Hazards
        for (const br of this.brokenRoads) {
            ctx.save();
            ctx.translate(br.x, br.y);

            // A. Dark Charred Asphalt Base
            ctx.fillStyle = '#1c1917';
            ctx.fillRect(0, 0, br.w, br.h);

            // B. Jagged Broken Road Asphalt Borders
            ctx.fillStyle = '#44403c';
            ctx.beginPath();
            ctx.moveTo(0, 0);
            for (let y = 0; y <= br.h; y += 40) {
                const offset = Math.sin(y * 0.08) * 18 + Math.cos(y * 0.15) * 8;
                ctx.lineTo(offset + 14, y);
            }
            ctx.lineTo(0, br.h);
            ctx.closePath();
            ctx.fill();

            ctx.beginPath();
            ctx.moveTo(br.w, 0);
            for (let y = 0; y <= br.h; y += 40) {
                const offset = Math.cos(y * 0.08) * 18 + Math.sin(y * 0.15) * 8;
                ctx.lineTo(br.w - offset - 14, y);
            }
            ctx.lineTo(br.w, br.h);
            ctx.closePath();
            ctx.fill();

            // C. Deep Fire Pit Glowing Heat Aura
            const heatGrad = ctx.createLinearGradient(0, 0, br.w, 0);
            heatGrad.addColorStop(0, 'rgba(255, 60, 0, 0.45)');
            heatGrad.addColorStop(0.5, 'rgba(255, 180, 0, 0.7)');
            heatGrad.addColorStop(1, 'rgba(255, 60, 0, 0.45)');
            ctx.fillStyle = heatGrad;
            ctx.fillRect(15, 0, br.w - 30, br.h);

            // D. Animated Blazing Flame Waves
            const time = Date.now() * 0.012;
            for (let layer = 0; layer < 3; layer++) {
                ctx.fillStyle = layer === 0 ? '#d90429' : layer === 1 ? '#ff5400' : '#ffd166';
                ctx.beginPath();
                ctx.moveTo(15, br.h);

                for (let py = br.h; py >= 0; py -= 35) {
                    const wave = Math.sin(py * 0.05 + time + layer * 2) * (20 - layer * 4);
                    const fx = br.w / 2 + wave;
                    ctx.lineTo(fx, py);
                }
                ctx.lineTo(br.w - 15, 0);
                ctx.lineTo(br.w - 15, br.h);
                ctx.closePath();
                ctx.fill();
            }

            // E. Danger Warning Construction Stripes
            const drawBarrier = (by) => {
                ctx.save();
                ctx.fillStyle = '#222222';
                ctx.fillRect(0, by, br.w, 36);

                ctx.save();
                ctx.beginPath();
                ctx.rect(0, by, br.w, 36);
                ctx.clip();
                ctx.fillStyle = '#ff9f1c';
                for (let sx = -40; sx < br.w + 40; sx += 32) {
                    ctx.beginPath();
                    ctx.moveTo(sx, by + 36);
                    ctx.lineTo(sx + 16, by + 36);
                    ctx.lineTo(sx + 32, by);
                    ctx.lineTo(sx + 16, by);
                    ctx.closePath();
                    ctx.fill();
                }
                ctx.restore();

                const blink = Math.sin(Date.now() * 0.01) > 0;
                ctx.fillStyle = blink ? '#ffbe0b' : '#725200';
                ctx.shadowColor = blink ? '#ffbe0b' : 'transparent';
                ctx.shadowBlur = blink ? 18 : 0;
                ctx.beginPath();
                ctx.arc(20, by + 18, 12, 0, Math.PI * 2);
                ctx.arc(br.w - 20, by + 18, 12, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0;
                ctx.restore();
            };

            drawBarrier(0);
            drawBarrier(br.h - 36);

            // Caution Text in Center
            ctx.save();
            ctx.translate(br.w / 2, br.h / 2);
            ctx.rotate(-Math.PI / 2);
            ctx.font = '900 32px "Impact", "Arial Black", sans-serif';
            ctx.fillStyle = 'rgba(255, 240, 200, 0.9)';
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 4;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.strokeText("🔥 DANGER: ROAD COLLAPSED 🔥", 0, 0);
            ctx.fillText("🔥 DANGER: ROAD COLLAPSED 🔥", 0, 0);
            ctx.restore();

            ctx.restore();
        }

        // 2. Draw Ground-Level Railway Level Crossings with Passing Trains
        for (const rc of this.railCrossings) {
            ctx.save();
            ctx.translate(0, rc.y);

            // A. Road Pavement Markings: Large Yellow "X" & "R R" ahead of crossing
            ctx.fillStyle = 'rgba(255, 209, 102, 0.75)';
            ctx.font = '900 44px "Impact", Arial, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText("❌ R   R ❌", 540, -40);
            ctx.fillText("❌ R   R ❌", 540, 180);

            // B. Dark Asphalt Railway Bed Embedded in Road
            ctx.fillStyle = '#26282a';
            ctx.fillRect(250, 25, 580, 95);

            // C. Wooden Sleepers / Ties Across Road
            ctx.fillStyle = '#4a3f35';
            for (let sx = 250; sx < 830; sx += 24) {
                ctx.fillRect(sx, 30, 14, 85);
            }

            // D. Dual Steel Rail Tracks Across Highway
            const drawGroundRail = (gy) => {
                ctx.fillStyle = '#78909c';
                ctx.fillRect(240, gy, 600, 8);
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(240, gy + 1, 600, 2.5);
                ctx.fillStyle = '#1c2327';
                ctx.fillRect(240, gy + 7, 600, 2);
            };

            drawGroundRail(48);
            drawGroundRail(68);
            drawGroundRail(88);

            // E. Flashing Railroad Crossing Signal Masts (Left & Right Shoulders)
            const drawSignalMast = (mx) => {
                // Mast post
                ctx.fillStyle = '#6c757d';
                ctx.fillRect(mx - 4, -15, 8, 140);

                // Crossbuck ❌ "RAILROAD CROSSING"
                ctx.save();
                ctx.translate(mx, 5);
                ctx.fillStyle = '#f8f9fa';
                ctx.strokeStyle = '#212529';
                ctx.lineWidth = 2;

                ctx.save();
                ctx.rotate(Math.PI / 4);
                ctx.fillRect(-24, -5, 48, 10);
                ctx.strokeRect(-24, -5, 48, 10);
                ctx.restore();

                ctx.save();
                ctx.rotate(-Math.PI / 4);
                ctx.fillRect(-24, -5, 48, 10);
                ctx.strokeRect(-24, -5, 48, 10);
                ctx.restore();

                // Alternating Flashing Red LED Lights (🔴 🔴)
                const isLeftLight = Math.sin(rc.lightTimer * 0.25) > 0;
                ctx.fillStyle = isLeftLight ? '#ff0033' : '#590d18';
                ctx.shadowColor = isLeftLight ? '#ff0033' : 'transparent';
                ctx.shadowBlur = isLeftLight ? 18 : 0;
                ctx.beginPath();
                ctx.arc(-16, 22, 9, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = !isLeftLight ? '#ff0033' : '#590d18';
                ctx.shadowColor = !isLeftLight ? '#ff0033' : 'transparent';
                ctx.shadowBlur = !isLeftLight ? 18 : 0;
                ctx.beginPath();
                ctx.arc(16, 22, 9, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0;

                ctx.restore();

                // Red & White Striped Lowered Barrier Gate
                ctx.fillStyle = '#ff0033';
                const gateW = 85;
                const gateX = mx > 540 ? mx - gateW : mx;
                ctx.fillRect(gateX, 60, gateW, 8);
                ctx.fillStyle = '#ffffff';
                for (let gx = gateX; gx < gateX + gateW; gx += 18) {
                    ctx.fillRect(gx, 60, 9, 8);
                }
            };

            drawSignalMast(245);
            drawSignalMast(835);

            // F. Render Passing Train Across the Road
            if (!rc.train.isBlasted) {
                const t = rc.train;
                for (let cIdx = 0; cIdx < t.cars.length; cIdx++) {
                    const car = t.cars[cIdx];
                    const carX = t.x + (cIdx * (t.carW + 10));

                    if (carX + t.carW < -100 || carX > 1180) continue;

                    ctx.save();
                    ctx.translate(carX, 42);

                    // Train Car Body
                    ctx.fillStyle = car.color;
                    ctx.beginPath();
                    ctx.roundRect(0, 0, car.w, car.h, 6);
                    ctx.fill();
                    ctx.strokeStyle = '#111210';
                    ctx.lineWidth = 2.5;
                    ctx.stroke();

                    // Container Corrugated Ridges
                    ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
                    ctx.lineWidth = 2;
                    for (let rx = 10; rx < car.w - 10; rx += 14) {
                        ctx.beginPath();
                        ctx.moveTo(rx, 4);
                        ctx.lineTo(rx, car.h - 4);
                        ctx.stroke();
                    }

                    // Cargo Label
                    ctx.font = '900 16px "Arial Black", Impact, sans-serif';
                    ctx.fillStyle = '#ffffff';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(car.label, car.w / 2, car.h / 2);

                    // Locomotive Front Details
                    if (car.isLoco) {
                        const hlx = t.isMovingRight ? car.w - 6 : 6;
                        ctx.fillStyle = '#fffffa';
                        ctx.shadowColor = '#ffff55';
                        ctx.shadowBlur = 20;
                        ctx.beginPath();
                        ctx.arc(hlx, car.h / 2, 9, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.shadowBlur = 0;
                    }

                    ctx.restore();
                }
            } else {
                // Blasted Train Fiery Aftermath
                ctx.fillStyle = 'rgba(255, 60, 0, 0.6)';
                ctx.beginPath();
                ctx.arc(540, 70, 70, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.restore();
        }

        // 3. Draw Pickups & Items
        const time = Date.now() * 0.005;

        for (const item of this.items) {
            ctx.save();
            const bobY = item.type !== 'oil' ? Math.sin(time + item.bobOffset * 5) * 6 : 0;
            ctx.translate(item.x, item.y + bobY);

            const sprite = this.game.assets.images[item.sprite];
            if (sprite) {
                ctx.drawImage(sprite, -item.w / 2, -item.h / 2, item.w, item.h);
            }

            ctx.restore();
        }
    }
}

window.CollectiblesManager = CollectiblesManager;
