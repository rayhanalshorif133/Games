/**
 * Collectibles & Powerups Manager
 * Handles spawning and collecting Fuel canisters, Coins, Nitro boosts, Shields, and Oil slicks.
 */

class CollectiblesManager {
    constructor(game) {
        this.game = game;
        this.items = [];
        this.spawnTimer = 0;
        this.lanes = [390, 490, 590, 690];
    }

    reset() {
        this.items = [];
        this.spawnTimer = 0;
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

    update(playerSpeed) {
        this.spawnTimer++;
        if (this.spawnTimer > 100) {
            this.spawnTimer = 0;
            this.spawnRandomItem();
        }

        const p = this.game.player;
        const pBounds = p.getBounds();

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
