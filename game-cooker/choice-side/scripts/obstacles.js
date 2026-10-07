/**
 * Obstacles and Items Manager for Choice Side
 * Spawns and animates Saw Blades, Boulders, Fireballs, Apples, and Hearts
 */

'use strict';

class ObstacleManager {
    constructor(assets) {
        this.assets = assets;
        this.items = []; // Apples and Hearts
        this.hazards = []; // Saws, Boulders, Fireballs
        
        this.spawnTimer = 0;
        this.nextSpawnInterval = 1.3;
        this.gameTime = 0;
    }

    reset() {
        this.items = [];
        this.hazards = [];
        this.spawnTimer = 0;
        this.nextSpawnInterval = 1.3;
        this.gameTime = 0;
    }

    update(dt, scrollSpeed) {
        this.gameTime += dt;
        this.spawnTimer += dt;

        // Dynamic difficulty progression
        const difficultyFactor = Math.min(2.2, 1.0 + this.gameTime * 0.02);
        this.nextSpawnInterval = Math.max(0.65, 1.4 / difficultyFactor);

        if (this.spawnTimer >= this.nextSpawnInterval) {
            this.spawnTimer = 0;
            this.spawnEntity(difficultyFactor);
        }

        // 1. Update Hazards
        for (let i = this.hazards.length - 1; i >= 0; i--) {
            const h = this.hazards[i];
            
            if (h.type === 'saw') {
                // Saws are fixed to the rock wall and move with the wall scroll
                h.y += scrollSpeed * dt;
                h.rot += 14 * dt;
            } else if (h.type === 'boulder') {
                // Boulders tumble down rapidly
                h.y += (scrollSpeed + h.fallSpeed) * dt;
                h.rot += h.vRot * dt;
            } else if (h.type === 'fireball') {
                // Fireballs streak downwards
                h.y += (scrollSpeed + h.fallSpeed) * dt;
            }

            // Remove off-screen hazards
            if (h.y > 2100) {
                this.hazards.splice(i, 1);
            }
        }

        // 2. Update Collectibles (Apples & Hearts)
        for (let i = this.items.length - 1; i >= 0; i--) {
            const it = this.items[i];
            it.y += (scrollSpeed * 0.95 + it.fallSpeed) * dt;
            it.bobAngle += 4 * dt;
            it.bobY = Math.sin(it.bobAngle) * 8;

            if (it.y > 2100) {
                this.items.splice(i, 1);
            }
        }
    }

    spawnEntity(difficultyFactor) {
        const roll = Math.random();

        // 55% chance Hazard, 45% chance Collectible/Item
        if (roll < 0.55) {
            // Pick hazard type: Saw, Boulder, or Fireball
            const hRoll = Math.random();
            if (hRoll < 0.45) {
                // Saw Blade on Left or Right Wall
                const isLeft = Math.random() < 0.5;
                this.hazards.push({
                    type: 'saw',
                    side: isLeft ? 'left' : 'right',
                    x: isLeft ? 115 : 965,
                    y: -140,
                    radius: 75,
                    rot: 0,
                    img: this.assets.sawBlade
                });
            } else if (hRoll < 0.78) {
                // Tumbling Boulder in Canyon
                const x = 280 + Math.random() * 520;
                this.hazards.push({
                    type: 'boulder',
                    x: x,
                    y: -150,
                    fallSpeed: 250 + Math.random() * 200,
                    radius: 70,
                    rot: Math.random() * Math.PI * 2,
                    vRot: (Math.random() > 0.5 ? 1 : -1) * (3.0 + Math.random() * 3.5),
                    img: this.assets.boulder
                });
            } else {
                // Fireball Comet
                const x = 250 + Math.random() * 580;
                this.hazards.push({
                    type: 'fireball',
                    x: x,
                    y: -180,
                    fallSpeed: 450 + Math.random() * 250,
                    radius: 65,
                    img: this.assets.fireball
                });
            }
        } else {
            // Spawn Collectible: Apple (90%) or Heart (10%)
            const isHeart = Math.random() < 0.12;
            const x = 320 + Math.random() * 440; // Mid-air jump zone

            if (isHeart) {
                this.items.push({
                    type: 'heart',
                    x: x,
                    y: -120,
                    fallSpeed: 60,
                    bobAngle: 0,
                    bobY: 0,
                    radius: 55,
                    img: this.assets.heart
                });
            } else {
                // Apple variation: green, yellow, or purple
                const colorRoll = Math.random();
                let color = 'green';
                let img = this.assets.appleGreen;
                if (colorRoll < 0.4) {
                    color = 'yellow';
                    img = this.assets.appleYellow;
                } else if (colorRoll < 0.7) {
                    color = 'purple';
                    img = this.assets.applePurple;
                }

                this.items.push({
                    type: 'apple',
                    color: color,
                    x: x,
                    y: -120,
                    fallSpeed: 50,
                    bobAngle: 0,
                    bobY: 0,
                    radius: 55,
                    img: img
                });
            }
        }
    }

    draw(ctx) {
        // 1. Draw Hazards
        for (const h of this.hazards) {
            ctx.save();
            ctx.translate(h.x, h.y);
            
            if (h.type === 'saw') {
                ctx.rotate(h.rot);
                if (h.img && h.img.complete) {
                    ctx.drawImage(h.img, -90, -90, 180, 180);
                }
            } else if (h.type === 'boulder') {
                ctx.rotate(h.rot);
                if (h.img && h.img.complete) {
                    ctx.drawImage(h.img, -85, -85, 170, 170);
                }
            } else if (h.type === 'fireball') {
                if (h.img && h.img.complete) {
                    ctx.drawImage(h.img, -75, -110, 150, 220);
                }
            }
            ctx.restore();
        }

        // 2. Draw Collectibles
        for (const it of this.items) {
            ctx.save();
            ctx.translate(it.x, it.y + it.bobY);
            if (it.img && it.img.complete) {
                if (it.type === 'apple') {
                    ctx.drawImage(it.img, -65, -70, 130, 140);
                } else if (it.type === 'heart') {
                    ctx.drawImage(it.img, -70, -65, 140, 130);
                }
            }
            ctx.restore();
        }
    }
}

window.ObstacleManager = ObstacleManager;

