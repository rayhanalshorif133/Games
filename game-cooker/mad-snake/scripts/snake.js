// Snake and AI Enemy Snake implementation for Mad Snake

class Snake {
    constructor(startX = 6, startY = 14, initialLength = 8) {
        this.segments = [];
        this.prevSegments = [];
        for (let i = 0; i < initialLength; i++) {
            this.segments.push({ x: startX - i, y: startY });
            this.prevSegments.push({ x: startX - i, y: startY });
        }
        this.dir = { x: 1, y: 0 };
        this.nextDir = { x: 1, y: 0 };
        this.growPending = 0;
        this.tongueTimer = 0;
    }

    reset(startX = 6, startY = 14, initialLength = 8) {
        this.segments = [];
        this.prevSegments = [];
        for (let i = 0; i < initialLength; i++) {
            this.segments.push({ x: startX - i, y: startY });
            this.prevSegments.push({ x: startX - i, y: startY });
        }
        this.dir = { x: 1, y: 0 };
        this.nextDir = { x: 1, y: 0 };
        this.growPending = 0;
    }

    setDirection(newDir) {
        // Prevent 180-degree instant reverse
        if (newDir.x === -this.dir.x && newDir.y === -this.dir.y) {
            return false;
        }
        this.nextDir = newDir;
        return true;
    }

    step(gridWidth = 20, gridHeight = 20) {
        this.dir = { ...this.nextDir };
        
        // Save previous positions for smooth interpolation
        this.prevSegments = this.segments.map(s => ({ ...s }));

        const head = this.segments[0];
        let newX = head.x + this.dir.x;
        let newY = head.y + this.dir.y;

        // Wrap around boundaries
        if (newX < 0) newX = gridWidth - 1;
        else if (newX >= gridWidth) newX = 0;

        if (newY < 0) newY = gridHeight - 1;
        else if (newY >= gridHeight) newY = 0;

        const newHead = { x: newX, y: newY };
        this.segments.unshift(newHead);

        if (this.growPending > 0) {
            this.growPending--;
            this.prevSegments.push({ ...this.segments[this.segments.length - 1] });
        } else {
            this.segments.pop();
        }

        return newHead;
    }

    grow(amount = 1) {
        this.growPending += amount;
    }

    checkSelfCollision() {
        const head = this.segments[0];
        for (let i = 1; i < this.segments.length; i++) {
            if (head.x === this.segments[i].x && head.y === this.segments[i].y) {
                return true;
            }
        }
        return false;
    }

    checkWallCollision(gridWidth = 20, gridHeight = 20) {
        // Snake wraps around boundaries, no wall collision
        return false;
    }

    getHeadRotation() {
        if (this.dir.x === 1) return Math.PI / 2;     // Right
        if (this.dir.x === -1) return -Math.PI / 2;   // Left
        if (this.dir.y === 1) return Math.PI;        // Down
        return 0;                                    // Up
    }

    draw(ctx, cellX, cellY, cellSize, progress, images, gridWidth = 20, gridHeight = 20) {
        const segs = this.segments;
        const prev = this.prevSegments;
        if (!segs.length) return;

        const drawBodyAt = (gx, gy) => {
            const px = cellX(gx);
            const py = cellY(gy);
            if (images && images.snake_body) {
                ctx.drawImage(images.snake_body, px, py, cellSize, cellSize);
            } else {
                ctx.fillStyle = '#4ade80';
                ctx.beginPath();
                ctx.roundRect(px + 2, py + 2, cellSize - 4, cellSize - 4, 12);
                ctx.fill();
            }
        };

        // Draw body segments (from tail to neck) with wrap-aware interpolation
        for (let i = segs.length - 1; i >= 1; i--) {
            const pCurrent = segs[i];
            const pPrev = prev[i] || pCurrent;

            let dx = pCurrent.x - pPrev.x;
            if (dx < -1) dx += gridWidth;
            else if (dx > 1) dx -= gridWidth;

            let dy = pCurrent.y - pPrev.y;
            if (dy < -1) dy += gridHeight;
            else if (dy > 1) dy -= gridHeight;

            const interpX = pPrev.x + dx * progress;
            const interpY = pPrev.y + dy * progress;

            drawBodyAt(interpX, interpY);

            // If crossing border, also draw wrapped counterpart
            if (interpX < 0) drawBodyAt(interpX + gridWidth, interpY);
            else if (interpX > gridWidth - 1) drawBodyAt(interpX - gridWidth, interpY);

            if (interpY < 0) drawBodyAt(interpX, interpY + gridHeight);
            else if (interpY > gridHeight - 1) drawBodyAt(interpX, interpY - gridHeight);
        }

        // Draw head with wrap-aware interpolation and rotation
        const hCurrent = segs[0];
        const hPrev = prev[0] || hCurrent;

        let hdx = hCurrent.x - hPrev.x;
        if (hdx < -1) hdx += gridWidth;
        else if (hdx > 1) hdx -= gridWidth;

        let hdy = hCurrent.y - hPrev.y;
        if (hdy < -1) hdy += gridHeight;
        else if (hdy > 1) hdy -= gridHeight;

        const hInterpX = hPrev.x + hdx * progress;
        const hInterpY = hPrev.y + hdy * progress;
        const rot = this.getHeadRotation();

        const drawHeadAt = (gx, gy) => {
            const hx = cellX(gx) + cellSize / 2;
            const hy = cellY(gy) + cellSize / 2;
            ctx.save();
            ctx.translate(hx, hy);
            ctx.rotate(rot);

            if (images && images.snake_head) {
                ctx.drawImage(images.snake_head, -cellSize / 2, -cellSize / 2, cellSize, cellSize);
            } else {
                ctx.fillStyle = '#22c55e';
                ctx.beginPath();
                ctx.roundRect(-cellSize / 2 + 2, -cellSize / 2 + 2, cellSize - 4, cellSize - 4, 14);
                ctx.fill();
            }
            ctx.restore();
        };

        drawHeadAt(hInterpX, hInterpY);

        // If crossing border, also draw wrapped counterpart
        if (hInterpX < 0) drawHeadAt(hInterpX + gridWidth, hInterpY);
        else if (hInterpX > gridWidth - 1) drawHeadAt(hInterpX - gridWidth, hInterpY);

        if (hInterpY < 0) drawHeadAt(hInterpX, hInterpY + gridHeight);
        else if (hInterpY > gridHeight - 1) drawHeadAt(hInterpX, hInterpY - gridHeight);
    }
}

class EnemySnake {
    constructor(startX = 16, startY = 16, length = 3) {
        this.segments = [];
        this.prevSegments = [];
        for (let i = 0; i < length; i++) {
            this.segments.push({ x: startX - i, y: startY });
            this.prevSegments.push({ x: startX - i, y: startY });
        }
        this.dir = { x: -1, y: 0 };
        this.isDead = false;
        this.respawnTimer = 0;
        this.maxRespawn = 20.0;
        this.initialStartX = startX;
        this.initialStartY = startY;
        this.initialLength = length;
    }

    reset() {
        this.isDead = false;
        this.respawnTimer = 0;
        this.segments = [];
        this.prevSegments = [];
        for (let i = 0; i < this.initialLength; i++) {
            this.segments.push({ x: this.initialStartX - i, y: this.initialStartY });
            this.prevSegments.push({ x: this.initialStartX - i, y: this.initialStartY });
        }
        this.dir = { x: -1, y: 0 };
    }

    kill() {
        this.isDead = true;
        this.respawnTimer = this.maxRespawn;
        this.segments = [];
        this.prevSegments = [];
    }

    updateTimer(dt, gridWidth, gridHeight, obstacles, playerSnake) {
        if (!this.isDead) return;
        this.respawnTimer -= dt;
        if (this.respawnTimer <= 0) {
            this.respawn(gridWidth, gridHeight, obstacles, playerSnake);
        }
    }

    respawn(gridWidth, gridHeight, obstacles, playerSnake) {
        this.isDead = false;
        this.respawnTimer = 0;
        // Find safe spawn location away from player head
        let bestX = 16, bestY = 16;
        const playerHead = playerSnake.segments[0];
        
        for (let attempt = 0; attempt < 50; attempt++) {
            const rx = Math.floor(Math.random() * (gridWidth - 4)) + 2;
            const ry = Math.floor(Math.random() * (gridHeight - 4)) + 2;
            const dist = Math.abs(rx - playerHead.x) + Math.abs(ry - playerHead.y);
            const isObstacle = obstacles.some(o => o.x === rx && o.y === ry);
            if (dist > 8 && !isObstacle) {
                bestX = rx;
                bestY = ry;
                break;
            }
        }

        this.segments = [];
        this.prevSegments = [];
        for (let i = 0; i < this.initialLength; i++) {
            this.segments.push({ x: bestX - i, y: bestY });
            this.prevSegments.push({ x: bestX - i, y: bestY });
        }
        this.dir = { x: -1, y: 0 };
    }

    step(gridWidth, gridHeight, obstacles, foodList, playerSnake) {
        if (this.isDead || !this.segments.length) return;

        this.prevSegments = this.segments.map(s => ({ ...s }));
        const head = this.segments[0];

        // Autonomous AI decision
        const possibleDirs = [
            { x: 1, y: 0 },
            { x: -1, y: 0 },
            { x: 0, y: 1 },
            { x: 0, y: -1 }
        ];

        // Valid directions that don't collide immediately
        const validDirs = possibleDirs.filter(d => {
            // Cannot reverse into own neck
            if (d.x === -this.dir.x && d.y === -this.dir.y) return false;
            const nx = head.x + d.x;
            const ny = head.y + d.y;
            if (nx < 0 || nx >= gridWidth || ny < 0 || ny >= gridHeight) return false;
            if (obstacles.some(o => o.x === nx && o.y === ny)) return false;
            if (this.segments.some((s, idx) => idx > 0 && s.x === nx && s.y === ny)) return false;
            return true;
        });

        if (validDirs.length > 0) {
            // Pick direction towards nearest food or safe random
            let bestDir = validDirs[0];
            let minDistance = 999;
            const target = (foodList && foodList.length) ? foodList[0] : null;

            for (const d of validDirs) {
                const nx = head.x + d.x;
                const ny = head.y + d.y;
                let score = 0;

                if (target) {
                    score = Math.abs(nx - target.x) + Math.abs(ny - target.y);
                } else {
                    score = Math.random();
                }

                // Add slight penalty if turning
                if (d.x !== this.dir.x || d.y !== this.dir.y) {
                    score += 0.5;
                }

                if (score < minDistance) {
                    minDistance = score;
                    bestDir = d;
                }
            }
            this.dir = bestDir;
        }

        const newHead = {
            x: head.x + this.dir.x,
            y: head.y + this.dir.y
        };

        this.segments.unshift(newHead);
        this.segments.pop();
    }

    getHeadRotation() {
        if (this.dir.x === 1) return Math.PI / 2;
        if (this.dir.x === -1) return -Math.PI / 2;
        if (this.dir.y === 1) return Math.PI;
        return 0;
    }

    draw(ctx, cellX, cellY, cellSize, progress, images) {
        if (this.isDead || !this.segments.length) return;

        const segs = this.segments;
        const prev = this.prevSegments;

        // Draw body segments
        for (let i = segs.length - 1; i >= 1; i--) {
            const pCurrent = segs[i];
            const pPrev = prev[i] || pCurrent;
            const interpX = pPrev.x + (pCurrent.x - pPrev.x) * progress;
            const interpY = pPrev.y + (pCurrent.y - pPrev.y) * progress;

            const px = cellX(interpX);
            const py = cellY(interpY);

            if (images.enemy_body) {
                ctx.drawImage(images.enemy_body, px, py, cellSize, cellSize);
            } else {
                ctx.fillStyle = '#f97316';
                ctx.beginPath();
                ctx.roundRect(px + 2, py + 2, cellSize - 4, cellSize - 4, 12);
                ctx.fill();
            }
        }

        // Draw head
        const hCurrent = segs[0];
        const hPrev = prev[0] || hCurrent;
        const hInterpX = hPrev.x + (hCurrent.x - hPrev.x) * progress;
        const hInterpY = hPrev.y + (hCurrent.y - hPrev.y) * progress;

        const hx = cellX(hInterpX) + cellSize / 2;
        const hy = cellY(hInterpY) + cellSize / 2;
        const rot = this.getHeadRotation();

        ctx.save();
        ctx.translate(hx, hy);
        ctx.rotate(rot);

        if (images.enemy_head) {
            ctx.drawImage(images.enemy_head, -cellSize / 2, -cellSize / 2, cellSize, cellSize);
        } else {
            ctx.fillStyle = '#ea580c';
            ctx.beginPath();
            ctx.roundRect(-cellSize / 2 + 2, -cellSize / 2 + 2, cellSize - 4, cellSize - 4, 14);
            ctx.fill();
        }
        ctx.restore();
    }
}

// Fireball Projectile
class Fireball {
    constructor(startX, startY, dirX, dirY) {
        this.x = startX;
        this.y = startY;
        this.dirX = dirX;
        this.dirY = dirY;
        this.speed = 18; // cells per second
        this.alive = true;
    }

    update(dt) {
        this.x += this.dirX * this.speed * dt;
        this.y += this.dirY * this.speed * dt;
    }

    draw(ctx, cellX, cellY, cellSize, images) {
        const px = cellX(this.x);
        const py = cellY(this.y);
        ctx.save();
        if (images.fireball) {
            ctx.drawImage(images.fireball, px - 8, py - 8, cellSize + 16, cellSize + 16);
        } else {
            ctx.fillStyle = '#f97316';
            ctx.beginPath();
            ctx.arc(px + cellSize / 2, py + cellSize / 2, cellSize * 0.45, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }
}

window.Snake = Snake;
window.EnemySnake = EnemySnake;
window.Fireball = Fireball;
