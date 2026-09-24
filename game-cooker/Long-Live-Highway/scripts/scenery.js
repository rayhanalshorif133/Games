/**
 * Roadside Scenery & Environment Generator
 * Generates continuous parallax terrain, terracotta estates, blue villas, crop fields, tree groves,
 * and animated flying bird flocks matching demo.gif visuals.
 */

class SceneryManager {
    constructor(game) {
        this.game = game;
        this.sceneryItems = [];
        this.birds = [];
        this.roadScrollY = 0;
        this.roadWidth = 520;
        this.roadLeft = (1080 - this.roadWidth) / 2; // 280
        this.roadRight = this.roadLeft + this.roadWidth; // 800

        this.leftSpawnY = -200;
        this.rightSpawnY = -200;
        this.birdSpawnTimer = 0;

        this.initInitialScenery();
    }

    reset() {
        this.sceneryItems = [];
        this.birds = [];
        this.leftSpawnY = -200;
        this.rightSpawnY = -200;
        this.birdSpawnTimer = 0;
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
    }

    spawnSceneryBlock(side, yPos) {
        const isLeft = side === 'left';
        const xPos = isLeft ? 140 : 940;
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

    update(playerSpeed) {
        // Road texture scrolling offset
        this.roadScrollY = (this.roadScrollY + playerSpeed) % 480;

        // Update Scenery items
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

        // Bird spawning & animation
        this.birdSpawnTimer++;
        if (this.birdSpawnTimer > 240) {
            this.birdSpawnTimer = 0;
            this.spawnBirdFlock(MathUtils.randRange(400, 1000), -120);
            if (Math.random() < 0.5) window.soundManager.playChirp();
        }

        for (let i = this.birds.length - 1; i >= 0; i--) {
            const b = this.birds[i];
            b.x += b.vx;
            b.y += b.vy + (playerSpeed * 0.45); // Parallax flying height

            b.animTimer++;
            if (b.animTimer > 8) {
                b.animTimer = 0;
                b.frame = (b.frame + 1) % 3;
            }

            if (b.y > 2100 || b.x < -100 || b.x > 1200) {
                this.birds.splice(i, 1);
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
        // Road background
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
}

window.SceneryManager = SceneryManager;
