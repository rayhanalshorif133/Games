/**
 * Collectibles & Road Hazards Manager
 * Handles spawning and collecting Fuel canisters, Coins, Nitro boosts, Shields, and Oil slicks,
 * as well as treacherous Broken Road sections with burning fire pits and narrow detour lanes.
 */

class CollectiblesManager {
    constructor(game) {
        this.game = game;
        this.items = [];
        this.brokenRoads = [];
        this.spawnTimer = 0;
        this.roadHazardTimer = 0;
        this.lanes = [390, 490, 590, 690];
    }

    reset() {
        this.items = [];
        this.brokenRoads = [];
        this.spawnTimer = 0;
        this.roadHazardTimer = 0;
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
        // Highway road goes from x=280 to x=800 (total width 520)
        // Left broken zone: x=280, w=270 (player must drive in right lane x=550 to 750)
        // Right broken zone: x=530, w=270 (player must drive in left lane x=330 to 530)
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

        // Add warning popup
        this.game.particles.addScorePopup(540, 300, isLeft ? "⚠️ DANGER: LEFT ROAD ON FIRE! KEEP RIGHT ➡️" : "⚠️ DANGER: RIGHT ROAD ON FIRE! KEEP LEFT ⬅️", "#ff5400");
    }

    update(playerSpeed) {
        // 1. Spawning pickups
        this.spawnTimer++;
        if (this.spawnTimer > 100) {
            this.spawnTimer = 0;
            this.spawnRandomItem();
        }

        // 2. Spawning Broken Road Burning Hazards (Starts after 220m distance, becomes progressively more challenging)
        const pDist = this.game.player.distance;
        if (pDist >= 220) {
            this.roadHazardTimer++;
            const hazardInterval = Math.max(500, 1200 - Math.floor(pDist / 2.5));
            if (this.roadHazardTimer > hazardInterval) {
                this.roadHazardTimer = 0;
                this.spawnBrokenRoadHazard();
            }
        }

        const p = this.game.player;
        const pBounds = p.getBounds();

        // 3. Update Broken Road Hazards
        for (let k = this.brokenRoads.length - 1; k >= 0; k--) {
            const br = this.brokenRoads[k];
            br.y += playerSpeed;
            br.flameTimer++;

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

        // 4. Update Collectibles
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
                        p.triggerOilSpin();
                        this.items.splice(i, 1);
                        continue;
                    }
                }
            }

            // Remove offscreen
            if (item.y > 2050) {
                this.items.splice(i, 1);
            }
        }
    }

    draw(ctx) {
        // 1. Draw Broken Road Sections & Burning Fire Pits (Drawn under cars and pickups)
        for (const br of this.brokenRoads) {
            ctx.save();
            ctx.translate(br.x, br.y);

            // A. Dark Charred Pit Base
            ctx.fillStyle = '#1b140e';
            ctx.fillRect(0, 0, br.w, br.h);

            // B. Jagged Broken Asphalt Edges
            ctx.fillStyle = '#3a2e1d';
            ctx.beginPath();
            ctx.moveTo(0, 0);
            for (let py = 0; py <= br.h; py += 40) {
                const jx = Math.sin(py * 0.08) * 18 + 12;
                ctx.lineTo(jx, py);
            }
            ctx.lineTo(0, br.h);
            ctx.closePath();
            ctx.fill();

            ctx.beginPath();
            ctx.moveTo(br.w, 0);
            for (let py = 0; py <= br.h; py += 40) {
                const jx = br.w - (Math.cos(py * 0.08) * 18 + 12);
                ctx.lineTo(jx, py);
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

            // E. Danger Warning Construction Stripes at Top & Bottom Entrances
            const drawBarrier = (by) => {
                ctx.save();
                ctx.fillStyle = '#222222';
                ctx.fillRect(0, by, br.w, 36);

                // Diagonal warning stripes
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

                // Blinking amber warning hazard lights on posts
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

        // 2. Draw Pickups & Items
        const time = Date.now() * 0.005;

        for (const item of this.items) {
            ctx.save();
            // Gentle hovering bob for pickups
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

