// Fun Golf - 2D Projectile and Platform Physics Engine
// Optimized for 1080 x 1920 layout

class PhysicsWorld {
    constructor(game) {
        this.game = game;
        this.gravity = 1450;          // px/s^2
        this.restitution = 0.42;      // Platform bounce elasticity
        this.obstacleRestitution = 0.55; // Obstacle side bounce elasticity
        this.rollingFriction = 0.982; // Platform surface friction
        this.airDrag = 0.998;         // Air resistance
        this.minVelocity = 12;        // Stop threshold (px/s)
    }

    update(dt) {
        const ball = this.game.ball;
        if (!ball) return;

        // Cap dt to prevent physics tunneling
        const stepDt = Math.min(dt, 0.032);

        if (ball.state === 'IN_FLIGHT') {
            this.updateInFlight(ball, stepDt);
        } else if (ball.state === 'FALLING_THROUGH_HOLE') {
            this.updateHoleDrop(ball, stepDt);
        } else if (ball.state === 'LANDING') {
            this.updateLanding(ball, stepDt);
        }
    }

    updateInFlight(ball, dt) {
        // Apply gravity
        ball.vy += this.gravity * dt;

        // Apply air drag
        ball.vx *= Math.pow(this.airDrag, dt * 60);
        ball.vy *= Math.pow(this.airDrag, dt * 60);

        // Sub-step movement to ensure ultra-smooth collision detection
        const subSteps = 4;
        const subDt = dt / subSteps;

        for (let i = 0; i < subSteps; i++) {
            ball.x += ball.vx * subDt;
            ball.y += ball.vy * subDt;

            // Screen side boundary bounces
            if (ball.x - ball.radius < 20) {
                ball.x = 20 + ball.radius;
                ball.vx = -ball.vx * 0.5;
                this.game.audio.playBounce(Math.abs(ball.vx));
            } else if (ball.x + ball.radius > 1080 - 20) {
                ball.x = 1080 - 20 - ball.radius;
                ball.vx = -ball.vx * 0.5;
                this.game.audio.playBounce(Math.abs(ball.vx));
            }

            // Check hole capture
            const currentFloor = this.game.getCurrentFloor();
            if (currentFloor) {
                const holeDist = Math.abs(ball.x - currentFloor.holeX);
                const nearFloorY = Math.abs(ball.y - (currentFloor.y - ball.radius));
                
                // Can capture if close to hole center and near floor level
                if (holeDist < 26 && nearFloorY < 24 && Math.abs(ball.vx) < 550) {
                    this.triggerHoleCapture(ball, currentFloor);
                    return;
                }
            }

            // Check obstacle collisions on current floor
            if (currentFloor && currentFloor.obstacle) {
                this.checkObstacleCollision(ball, currentFloor.obstacle);
            }

            // Check platform collisions
            this.checkPlatformCollision(ball, currentFloor);
        }

        // Check if ball stopped rolling
        if (ball.isGrounded) {
            ball.vx *= Math.pow(this.rollingFriction, dt * 60);
            if (Math.abs(ball.vx) < this.minVelocity) {
                ball.vx = 0;
                ball.vy = 0;
                ball.state = 'IDLE';
            }
        }
    }

    checkPlatformCollision(ball, floor) {
        if (!floor) return;
        const groundY = floor.y - ball.radius;

        // If ball collides with the grass surface of the floor
        if (ball.y >= groundY && ball.y <= floor.y + 40 && ball.vy >= 0) {
            // Check if ball is NOT directly above the hole gap
            const holeDist = Math.abs(ball.x - floor.holeX);
            if (holeDist >= 32) {
                ball.y = groundY;
                if (Math.abs(ball.vy) > 80) {
                    this.game.audio.playBounce(Math.abs(ball.vy) / 600);
                    ball.vy = -ball.vy * this.restitution;
                    ball.isGrounded = false;
                } else {
                    ball.vy = 0;
                    ball.isGrounded = true;
                }
            }
        }
    }

    checkObstacleCollision(ball, obs) {
        // Obstacle box:
        const left = obs.x - obs.width / 2;
        const right = obs.x + obs.width / 2;
        const bottom = obs.floorY || (this.game.getCurrentFloor() ? this.game.getCurrentFloor().y : 0);
        const top = bottom - obs.height;

        // Find closest point on obstacle rect to ball center
        const closestX = Math.max(left, Math.min(ball.x, right));
        const closestY = Math.max(top, Math.min(ball.y, bottom));

        const dx = ball.x - closestX;
        const dy = ball.y - closestY;
        const distSq = dx * dx + dy * dy;

        if (distSq < ball.radius * ball.radius && distSq > 0.0001) {
            const dist = Math.sqrt(distSq);
            const nx = dx / dist;
            const ny = dy / dist;

            // Push ball out of collision
            const overlap = ball.radius - dist;
            ball.x += nx * overlap;
            ball.y += ny * overlap;

            // Velocity reflection along normal
            const dot = ball.vx * nx + ball.vy * ny;
            if (dot < 0) {
                ball.vx -= 1.6 * dot * nx;
                ball.vy -= 1.6 * dot * ny;
                this.game.audio.playBounce(Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy) / 500);

                // Spawn small dust particles at impact point
                this.game.spawnParticles(closestX, closestY, 'dust', 4);
            }
        }
    }

    triggerHoleCapture(ball, floor) {
        ball.state = 'FALLING_THROUGH_HOLE';
        ball.x = floor.holeX;
        ball.vx = 0;
        ball.vy = 120; // gentle downward push
        ball.targetFloorIndex = floor.index + 1;

        // Audio & Visual FX
        this.game.audio.playHoleIn();
        this.game.spawnParticles(floor.holeX, floor.y, 'sparkle', 16);
        this.game.spawnParticles(floor.holeX, floor.y, 'dust', 8);

        // Check if this is the final floor
        const totalFloors = this.game.currentLevelData.floors.length;
        if (floor.index === totalFloors) {
            ball.isLastHole = true;
        }
    }

    updateHoleDrop(ball, dt) {
        // Accelerate downwards through the hole
        ball.vy += this.gravity * 0.8 * dt;
        ball.y += ball.vy * dt;

        // Check target floor
        const nextFloor = this.game.getFloorByIndex(ball.targetFloorIndex);
        if (nextFloor) {
            const targetGroundY = nextFloor.y - ball.radius;
            if (ball.y >= targetGroundY) {
                // Ball touches the next floor platform!
                ball.y = targetGroundY;
                ball.vy = -ball.vy * 0.28; // small soft bounce
                ball.vx = (Math.random() - 0.5) * 40; // slight natural settling roll
                ball.state = 'LANDING';
                this.game.currentFloorIndex = nextFloor.index;
                this.game.audio.playBounce(0.3);
                this.game.spawnParticles(ball.x, nextFloor.y, 'dust', 6);
            }
        } else if (ball.isLastHole) {
            // Finished the final floor! Drop into the FINISH zone at bottom
            const finishY = 1845;
            if (ball.y >= finishY) {
                ball.y = finishY;
                ball.vy = 0;
                ball.vx = 0;
                ball.state = 'LEVEL_WON';
                this.game.onLevelComplete();
            }
        }
    }

    updateLanding(ball, dt) {
        ball.vy += this.gravity * dt;
        ball.y += ball.vy * dt;

        const currentFloor = this.game.getCurrentFloor();
        if (currentFloor) {
            const groundY = currentFloor.y - ball.radius;
            if (ball.y >= groundY) {
                ball.y = groundY;
                if (Math.abs(ball.vy) > 40) {
                    ball.vy = -ball.vy * 0.25;
                } else {
                    ball.vy = 0;
                    ball.vx *= 0.9;
                    if (Math.abs(ball.vx) < 5) {
                        ball.vx = 0;
                        ball.isGrounded = true;
                        ball.state = 'IDLE';
                    }
                }
            }
        }
    }
}

window.PhysicsWorld = PhysicsWorld;
