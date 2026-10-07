/**
 * Ball Slide - Obstacle & Pickup Engine
 * Accurately implements all patterns from demo.mp4:
 * Spikes, Wedges, Horizontal Bars, Blocks, Diamonds, Pillars, Snowflakes, Gems.
 */

class ObstacleManager {
    constructor(game) {
        this.game = game;
        this.obstacles = [];
        this.pickups = [];
        this.nextSpawnY = -200;
        this.lastPattern = null;
        this.wallWidth = 33;
        this.arenaWidth = 1080;
        this.arenaHeight = 1920;
    }

    reset() {
        this.obstacles = [];
        this.pickups = [];
        this.nextSpawnY = -200;
        this.lastPattern = null;
        
        // Spawn initial safe queue
        this.spawnObstacleBatch(0);
        this.spawnObstacleBatch(1);
    }

    update(dt, scrollSpeed) {
        const dist = scrollSpeed * dt;

        // Move obstacles down
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const obs = this.obstacles[i];
            obs.y += dist;

            // Handle moving obstacles (patrolling blocks or diamonds)
            if (obs.type === 'moving_block' || obs.type === 'diamond') {
                obs.time = (obs.time || 0) + dt;
                if (obs.isMoving) {
                    obs.x = obs.baseX + Math.sin(obs.time * obs.speedX) * obs.amplitude;
                }
                if (obs.rotationSpeed) {
                    obs.angle = (obs.angle || 0) + obs.rotationSpeed * dt;
                }
            }

            // Check if passed player to score
            if (!obs.passed && obs.y > this.game.player.y + 40) {
                obs.passed = true;
                if (obs.isScorable) {
                    this.game.addScore(1);
                }
            }

            // Remove when far off-screen
            if (obs.y > this.arenaHeight + 400) {
                this.obstacles.splice(i, 1);
            }
        }

        // Move pickups down
        for (let i = this.pickups.length - 1; i >= 0; i--) {
            const pick = this.pickups[i];
            pick.y += dist;
            pick.angle = (pick.angle || 0) + dt * 2.5;

            // Remove when off-screen
            if (pick.y > this.arenaHeight + 200) {
                this.pickups.splice(i, 1);
            }
        }

        // Continuously spawn ahead of camera
        let highestY = 0;
        if (this.obstacles.length > 0) {
            highestY = Math.min(...this.obstacles.map(o => o.y));
        }

        if (highestY > -600) {
            this.spawnNextObstacle();
        }
    }

    // Determine spacing based on difficulty / score
    getSpacing() {
        // As score goes up, spacing tightens from 750px down to 520px
        const score = this.game.score || 0;
        const progress = Math.min(1, score / 35);
        return 750 - progress * 230;
    }

    spawnNextObstacle() {
        let spawnY = -400;
        if (this.obstacles.length > 0) {
            const minY = Math.min(...this.obstacles.map(o => o.y));
            spawnY = minY - this.getSpacing();
        }
        this.createPatternAt(spawnY);
    }

    spawnObstacleBatch(index) {
        const startY = -400 - index * 750;
        this.createPatternAt(startY);
    }

    createPatternAt(y) {
        const score = this.game.score || 0;
        const patterns = ['spikes_pair', 'single_wedge', 'horizontal_slalom', 'center_blocks', 'rotating_diamond', 'spike_pillar'];
        
        // Select pattern avoiding repetition
        let available = patterns.filter(p => p !== this.lastPattern);
        // Introduce harder patterns gradually
        if (score < 3) {
            available = ['spikes_pair', 'single_wedge', 'horizontal_bars'];
        }

        const chosen = available[Math.floor(Math.random() * available.length)];
        this.lastPattern = chosen;

        switch (chosen) {
            case 'spikes_pair':
                this.buildSpikesPair(y);
                break;
            case 'single_wedge':
                this.buildSlantedWedge(y);
                break;
            case 'horizontal_slalom':
            case 'horizontal_bars':
                this.buildHorizontalSlalom(y);
                break;
            case 'center_blocks':
                this.buildCenterBlocks(y);
                break;
            case 'rotating_diamond':
                this.buildRotatingDiamond(y);
                break;
            case 'spike_pillar':
                this.buildSpikePillar(y);
                break;
            default:
                this.buildSpikesPair(y);
                break;
        }

        // Chance to spawn pickup
        this.maybeSpawnPickup(y);
    }

    // Pattern 1: Spikes on Left and Right walls (Classic demo.mp4 opening)
    buildSpikesPair(y) {
        const spikeW = 150;
        const spikeH = 160;

        // Left spike
        this.obstacles.push({
            type: 'spike_left',
            x: this.wallWidth,
            y: y,
            w: spikeW,
            h: spikeH,
            isScorable: true,
            passed: false,
            // Triangle hitbox: (wall, top), (tipX, centerY), (wall, bottom)
            polygon: [
                { x: this.wallWidth, y: y - spikeH / 2 },
                { x: this.wallWidth + spikeW, y: y },
                { x: this.wallWidth, y: y + spikeH / 2 }
            ]
        });

        // Right spike
        this.obstacles.push({
            type: 'spike_right',
            x: this.arenaWidth - this.wallWidth - spikeW,
            y: y,
            w: spikeW,
            h: spikeH,
            isScorable: false, // only score once per pair
            passed: false,
            polygon: [
                { x: this.arenaWidth - this.wallWidth, y: y - spikeH / 2 },
                { x: this.arenaWidth - this.wallWidth - spikeW, y: y },
                { x: this.arenaWidth - this.wallWidth, y: y + spikeH / 2 }
            ]
        });
    }

    // Pattern 2: Slanted Wedge / Diagonal Slide Ramp (frames 45-75 in demo.mp4)
    buildSlantedWedge(y) {
        const isLeft = Math.random() < 0.5;
        const wedgeWidth = 580; // extends past center
        const wedgeHeight = 360;

        if (isLeft) {
            this.obstacles.push({
                type: 'wedge_left',
                x: this.wallWidth,
                y: y,
                w: wedgeWidth,
                h: wedgeHeight,
                isScorable: true,
                passed: false,
                // Triangle: top-left (wall, y-h/2), top-right (tip, y-h/2), bottom-left (wall, y+h/2)
                polygon: [
                    { x: this.wallWidth, y: y - wedgeHeight / 2 },
                    { x: this.wallWidth + wedgeWidth, y: y - wedgeHeight / 2 },
                    { x: this.wallWidth, y: y + wedgeHeight / 2 }
                ]
            });
        } else {
            this.obstacles.push({
                type: 'wedge_right',
                x: this.arenaWidth - this.wallWidth - wedgeWidth,
                y: y,
                w: wedgeWidth,
                h: wedgeHeight,
                isScorable: true,
                passed: false,
                polygon: [
                    { x: this.arenaWidth - this.wallWidth, y: y - wedgeHeight / 2 },
                    { x: this.arenaWidth - this.wallWidth - wedgeWidth, y: y - wedgeHeight / 2 },
                    { x: this.arenaWidth - this.wallWidth, y: y + wedgeHeight / 2 }
                ]
            });
        }
    }

    // Pattern 3: Slalom / Staggered Horizontal Bars (frames 105-150 in demo.mp4)
    buildHorizontalSlalom(y) {
        const barH = 55;
        const barW = 540;
        const gapY = 190;

        // Bar 1 on left
        this.obstacles.push({
            type: 'bar',
            x: this.wallWidth,
            y: y - gapY,
            w: barW,
            h: barH,
            isScorable: false,
            passed: false,
            polygon: [
                { x: this.wallWidth, y: y - gapY - barH / 2 },
                { x: this.wallWidth + barW, y: y - gapY - barH / 2 },
                { x: this.wallWidth + barW, y: y - gapY + barH / 2 },
                { x: this.wallWidth, y: y - gapY + barH / 2 }
            ]
        });

        // Bar 2 on right
        this.obstacles.push({
            type: 'bar',
            x: this.arenaWidth - this.wallWidth - barW,
            y: y,
            w: barW,
            h: barH,
            isScorable: true,
            passed: false,
            polygon: [
                { x: this.arenaWidth - this.wallWidth - barW, y: y - barH / 2 },
                { x: this.arenaWidth - this.wallWidth, y: y - barH / 2 },
                { x: this.arenaWidth - this.wallWidth, y: y + barH / 2 },
                { x: this.arenaWidth - this.wallWidth - barW, y: y + barH / 2 }
            ]
        });

        // Bar 3 on left
        this.obstacles.push({
            type: 'bar',
            x: this.wallWidth,
            y: y + gapY,
            w: barW,
            h: barH,
            isScorable: false,
            passed: false,
            polygon: [
                { x: this.wallWidth, y: y + gapY - barH / 2 },
                { x: this.wallWidth + barW, y: y + gapY - barH / 2 },
                { x: this.wallWidth + barW, y: y + gapY + barH / 2 },
                { x: this.wallWidth, y: y + gapY + barH / 2 }
            ]
        });
    }

    // Pattern 4: Floating / Moving Center Block (frames 240-300 in demo.mp4)
    buildCenterBlocks(y) {
        const size = 160;
        const isMoving = Math.random() < 0.6;
        const baseX = isMoving ? 540 : (Math.random() < 0.5 ? 420 : 660);

        this.obstacles.push({
            type: 'moving_block',
            x: baseX,
            y: y,
            baseX: baseX,
            w: size,
            h: size,
            isMoving: isMoving,
            speedX: Math.random() * 2 + 1.8,
            amplitude: 220,
            isScorable: true,
            passed: false,
            get polygon() {
                const hx = this.w / 2;
                const hy = this.h / 2;
                return [
                    { x: this.x - hx, y: this.y - hy },
                    { x: this.x + hx, y: this.y - hy },
                    { x: this.x + hx, y: this.y + hy },
                    { x: this.x - hx, y: this.y + hy }
                ];
            }
        });
    }

    // Pattern 5: Rotating Diamond Hazard (frames 180-210 in demo.mp4)
    buildRotatingDiamond(y) {
        const size = 150;
        const x = Math.random() < 0.5 ? 400 : 680;

        this.obstacles.push({
            type: 'diamond',
            x: x,
            y: y,
            baseX: x,
            size: size,
            angle: 0,
            rotationSpeed: (Math.random() - 0.5) * 3,
            isMoving: false,
            isScorable: true,
            passed: false,
            get polygon() {
                const pts = [];
                const d = this.size / 2;
                const cos = Math.cos(this.angle);
                const sin = Math.sin(this.angle);
                const localPts = [{ x: 0, y: -d }, { x: d, y: 0 }, { x: 0, y: d }, { x: -d, y: 0 }];
                for (const p of localPts) {
                    pts.push({
                        x: this.x + p.x * cos - p.y * sin,
                        y: this.y + p.x * sin + p.y * cos
                    });
                }
                return pts;
            }
        });
    }

    // Pattern 6: Spike Pillar with multiple spikes (frames 390-420 in demo.mp4)
    buildSpikePillar(y) {
        const isLeft = Math.random() < 0.5;
        const pillarW = 85;
        const pillarH = 340;
        const spikeW = 140;
        const spikeH = 130;

        const pillarX = isLeft ? this.wallWidth : this.arenaWidth - this.wallWidth - pillarW;

        // Pillar rectangle
        this.obstacles.push({
            type: 'block',
            x: pillarX + pillarW / 2,
            y: y,
            w: pillarW,
            h: pillarH,
            isScorable: true,
            passed: false,
            polygon: [
                { x: pillarX, y: y - pillarH / 2 },
                { x: pillarX + pillarW, y: y - pillarH / 2 },
                { x: pillarX + pillarW, y: y + pillarH / 2 },
                { x: pillarX, y: y + pillarH / 2 }
            ]
        });

        // 2 spikes mounted on the pillar
        for (const offsetY of [-90, 90]) {
            const sy = y + offsetY;
            if (isLeft) {
                const sx = pillarX + pillarW;
                this.obstacles.push({
                    type: 'spike_left',
                    x: sx,
                    y: sy,
                    w: spikeW,
                    h: spikeH,
                    isScorable: false,
                    passed: false,
                    polygon: [
                        { x: sx, y: sy - spikeH / 2 },
                        { x: sx + spikeW, y: sy },
                        { x: sx, y: sy + spikeH / 2 }
                    ]
                });
            } else {
                const sx = pillarX - spikeW;
                this.obstacles.push({
                    type: 'spike_right',
                    x: sx,
                    y: sy,
                    w: spikeW,
                    h: spikeH,
                    isScorable: false,
                    passed: false,
                    polygon: [
                        { x: pillarX, y: sy - spikeH / 2 },
                        { x: sx, y: sy },
                        { x: pillarX, y: sy + spikeH / 2 }
                    ]
                });
            }
        }
    }

    // Pickups (Snowflake / Gems / Shield)
    maybeSpawnPickup(y) {
        const rand = Math.random();
        // 25% chance of snowflake
        if (rand < 0.25) {
            this.pickups.push({
                type: 'snowflake',
                x: Math.random() * 600 + 240,
                y: y - 250,
                radius: 40
            });
        } else if (rand < 0.6) { // 35% chance of gem
            this.pickups.push({
                type: 'gem',
                x: Math.random() * 600 + 240,
                y: y - 250,
                radius: 34
            });
        } else if (rand < 0.72) { // 12% chance of shield
            this.pickups.push({
                type: 'shield',
                x: Math.random() * 600 + 240,
                y: y - 250,
                radius: 38
            });
        }
    }

    // Separating Axis Theorem (SAT) Polygon-to-Circle Collision
    checkCollision(player) {
        const px = player.x;
        const py = player.y;
        // Fair hitbox: 86% of visual radius
        const pr = player.radius * 0.86;

        // Check obstacles
        for (const obs of this.obstacles) {
            const poly = obs.polygon;
            if (!poly || poly.length < 3) continue;

            // Quick bounding box rejection
            let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
            for (const p of poly) {
                if (p.x < minX) minX = p.x;
                if (p.x > maxX) maxX = p.x;
                if (p.y < minY) minY = p.y;
                if (p.y > maxY) maxY = p.y;
            }
            if (px + pr < minX || px - pr > maxX || py + pr < minY || py - pr > maxY) {
                continue;
            }

            // Exact polygon-to-circle intersection
            if (this.circleIntersectsPolygon(px, py, pr, poly)) {
                return { hit: true, obstacle: obs };
            }
        }

        // Check pickups
        for (let i = this.pickups.length - 1; i >= 0; i--) {
            const pick = this.pickups[i];
            const dx = px - pick.x;
            const dy = py - pick.y;
            const distSq = dx * dx + dy * dy;
            const rSum = pr + pick.radius;
            if (distSq < rSum * rSum) {
                const collected = this.pickups.splice(i, 1)[0];
                return { hit: false, pickup: collected };
            }
        }

        return { hit: false };
    }

    // Accurate Circle to Polygon SAT Intersection
    circleIntersectsPolygon(cx, cy, radius, vertices) {
        const n = vertices.length;

        // 1. Check if circle center is inside polygon
        let inside = false;
        for (let i = 0, j = n - 1; i < n; j = i++) {
            const xi = vertices[i].x, yi = vertices[i].y;
            const xj = vertices[j].x, yj = vertices[j].y;
            const intersect = ((yi > cy) !== (yj > cy)) &&
                (cx < (xj - xi) * (cy - yi) / (yj - yi) + xi);
            if (intersect) inside = !inside;
        }
        if (inside) return true;

        // 2. Check distance from circle center to each polygon line segment
        const rSq = radius * radius;
        for (let i = 0; i < n; i++) {
            const p1 = vertices[i];
            const p2 = vertices[(i + 1) % n];
            if (this.distSqToSegment(cx, cy, p1.x, p1.y, p2.x, p2.y) <= rSq) {
                return true;
            }
        }

        return false;
    }

    distSqToSegment(px, py, x1, y1, x2, y2) {
        const l2 = (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
        if (l2 === 0) return (px - x1) * (px - x1) + (py - y1) * (py - y1);
        let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
        t = Math.max(0, Math.min(1, t));
        const projX = x1 + t * (x2 - x1);
        const projY = y1 + t * (y2 - y1);
        return (px - projX) * (px - projX) + (py - projY) * (py - projY);
    }

    // Render obstacles and pickups
    draw(ctx, assets) {
        // Draw obstacles
        for (const obs of this.obstacles) {
            ctx.save();
            const poly = obs.polygon;

            if (obs.type === 'spike_left' && assets.spike_left) {
                ctx.drawImage(assets.spike_left, obs.x, obs.y - obs.h / 2, obs.w, obs.h);
            } else if (obs.type === 'spike_right' && assets.spike_right) {
                ctx.drawImage(assets.spike_right, obs.x, obs.y - obs.h / 2, obs.w, obs.h);
            } else if (obs.type === 'wedge_left') {
                // Wedge polygon matching demo.mp4: charcoal with beveled inner border
                ctx.fillStyle = '#2d2d2d';
                ctx.beginPath();
                ctx.moveTo(poly[0].x, poly[0].y);
                ctx.lineTo(poly[1].x, poly[1].y);
                ctx.lineTo(poly[2].x, poly[2].y);
                ctx.closePath();
                ctx.fill();
                // 3D slope highlight line
                ctx.strokeStyle = '#444444';
                ctx.lineWidth = 6;
                ctx.beginPath();
                ctx.moveTo(poly[1].x, poly[1].y);
                ctx.lineTo(poly[2].x, poly[2].y);
                ctx.stroke();
            } else if (obs.type === 'wedge_right') {
                ctx.fillStyle = '#2d2d2d';
                ctx.beginPath();
                ctx.moveTo(poly[0].x, poly[0].y);
                ctx.lineTo(poly[1].x, poly[1].y);
                ctx.lineTo(poly[2].x, poly[2].y);
                ctx.closePath();
                ctx.fill();
                ctx.strokeStyle = '#444444';
                ctx.lineWidth = 6;
                ctx.beginPath();
                ctx.moveTo(poly[1].x, poly[1].y);
                ctx.lineTo(poly[2].x, poly[2].y);
                ctx.stroke();
            } else if (obs.type === 'diamond' && assets.diamond) {
                ctx.translate(obs.x, obs.y);
                ctx.rotate(obs.angle || 0);
                ctx.drawImage(assets.diamond, -obs.size / 2, -obs.size / 2, obs.size, obs.size);
            } else if ((obs.type === 'moving_block' || obs.type === 'block') && assets.block) {
                ctx.drawImage(assets.block, obs.x - obs.w / 2, obs.y - obs.h / 2, obs.w, obs.h);
            } else {
                // Default polygon rendering (e.g. bars)
                ctx.fillStyle = '#2d2d2d';
                ctx.beginPath();
                ctx.moveTo(poly[0].x, poly[0].y);
                for (let k = 1; k < poly.length; k++) {
                    ctx.lineTo(poly[k].x, poly[k].y);
                }
                ctx.closePath();
                ctx.fill();
                // Top edge highlight
                ctx.strokeStyle = '#444444';
                ctx.lineWidth = 4;
                ctx.stroke();
            }
            ctx.restore();
        }

        // Draw Pickups
        for (const pick of this.pickups) {
            ctx.save();
            ctx.translate(pick.x, pick.y);
            
            // Soft floating bob
            const bobY = Math.sin(pick.angle) * 8;
            ctx.translate(0, bobY);

            if (pick.type === 'snowflake' && assets.snowflake) {
                // Glow ring
                ctx.fillStyle = 'rgba(215, 245, 255, 0.2)';
                ctx.beginPath();
                ctx.arc(0, 0, pick.radius + 8, 0, Math.PI * 2);
                ctx.fill();
                ctx.drawImage(assets.snowflake, -pick.radius, -pick.radius, pick.radius * 2, pick.radius * 2);
            } else if (pick.type === 'gem' && assets.gem) {
                // Golden glow
                ctx.fillStyle = 'rgba(255, 215, 0, 0.2)';
                ctx.beginPath();
                ctx.arc(0, 0, pick.radius + 6, 0, Math.PI * 2);
                ctx.fill();
                ctx.drawImage(assets.gem, -pick.radius, -pick.radius, pick.radius * 2, pick.radius * 2);
            } else if (pick.type === 'shield' && assets.shield) {
                ctx.drawImage(assets.shield, -pick.radius, -pick.radius, pick.radius * 2, pick.radius * 2);
            }
            ctx.restore();
        }
    }
}

window.ObstacleManager = ObstacleManager;

