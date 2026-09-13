/**
 * 2D Soccer Game Physics Engine
 * Calibrated precisely to Football Field.png (752 x 1344)
 */
class PhysicsEngine {
    constructor() {
        // Field reference dimensions
        this.FIELD_WIDTH = 752;
        this.FIELD_HEIGHT = 1344;

        // Playable boundaries
        this.WALL_LEFT = 106;
        this.WALL_RIGHT = 646;
        this.WALL_TOP = 162;
        this.WALL_BOTTOM = 1182;

        // Goals
        this.GOAL_LEFT = 270;
        this.GOAL_RIGHT = 476;
        this.GOAL_TOP_Y = 158;
        this.GOAL_BOTTOM_Y = 1186;

        // Goal posts (circles for bounce)
        this.posts = [
            { x: 270, y: 162, radius: 10 }, // Top Left
            { x: 476, y: 162, radius: 10 }, // Top Right
            { x: 270, y: 1182, radius: 10 }, // Bottom Left
            { x: 476, y: 1182, radius: 10 }  // Bottom Right
        ];

        // Ball specifications
        this.ball = {
            x: 376,
            y: 672,
            vx: 0,
            vy: 0,
            radius: 25,
            rotation: 0,
            drag: 0.998,
            minSpeed: 8.0, // Ball NEVER stops: guaranteed minimum velocity
            maxSpeed: 26,
            lastHitRole: 0
        };

        // Paddle specifications
        this.PADDLE_WIDTH = 128;
        this.PADDLE_HEIGHT = 35;
        this.PADDLE_HALF_W = 64;
        this.PADDLE_HALF_H = 17.5;

        // Player 1 (Red - Bottom)
        this.p1 = {
            x: 376,
            y: 1100,
            targetX: 376,
            targetY: 1100,
            vx: 0,
            vy: 0,
            role: 1,
            color: '#e53935'
        };

        // Player 2 (Yellow - Top)
        this.p2 = {
            x: 376,
            y: 244,
            targetX: 376,
            targetY: 244,
            vx: 0,
            vy: 0,
            role: 2,
            color: '#fdd835'
        };
    }

    resetBall(servingRole = 1) {
        this.ball.x = 376;
        this.ball.y = 672;
        this.ball.rotation = 0;
        this.ball.lastHitRole = 0;

        // Launch ball towards defending opponent with solid initial speed
        const angle = servingRole === 1 
            ? -Math.PI * 0.5 + (Math.random() - 0.5) * 0.8 
            : Math.PI * 0.5 + (Math.random() - 0.5) * 0.8;
        const initialSpeed = 11.0;
        this.ball.vx = Math.sin(angle) * initialSpeed;
        this.ball.vy = (servingRole === 1 ? -1 : 1) * Math.max(7, Math.abs(Math.cos(angle) * initialSpeed));
    }

    resetPaddles() {
        this.p1.x = 376;
        this.p1.y = 1100;
        this.p1.targetX = 376;
        this.p1.targetY = 1100;
        this.p1.vx = 0;
        this.p1.vy = 0;

        this.p2.x = 376;
        this.p2.y = 244;
        this.p2.targetX = 376;
        this.p2.targetY = 244;
        this.p2.vx = 0;
        this.p2.vy = 0;
    }

    // Clamp paddle to valid pitch coordinates (expanded reach eliminates any dead zone)
    clampP1(x, y) {
        const clampedX = Math.max(this.WALL_LEFT + this.PADDLE_HALF_W, Math.min(this.WALL_RIGHT - this.PADDLE_HALF_W, x));
        const clampedY = Math.max(560, Math.min(this.WALL_BOTTOM - this.PADDLE_HALF_H, y));
        return { x: clampedX, y: clampedY };
    }

    clampP2(x, y) {
        const clampedX = Math.max(this.WALL_LEFT + this.PADDLE_HALF_W, Math.min(this.WALL_RIGHT - this.PADDLE_HALF_W, x));
        const clampedY = Math.max(this.WALL_TOP + this.PADDLE_HALF_H, Math.min(780, y));
        return { x: clampedX, y: clampedY };
    }

    updatePaddles(dt) {
        // Smooth interpolation to target position
        const lerpFactor = Math.min(1, dt * 25);

        // Update P1
        const prevP1X = this.p1.x;
        const prevP1Y = this.p1.y;
        this.p1.x += (this.p1.targetX - this.p1.x) * lerpFactor;
        this.p1.y += (this.p1.targetY - this.p1.y) * lerpFactor;
        this.p1.vx = (this.p1.x - prevP1X) / (dt || 0.016);
        this.p1.vy = (this.p1.y - prevP1Y) / (dt || 0.016);

        // Update P2
        const prevP2X = this.p2.x;
        const prevP2Y = this.p2.y;
        this.p2.x += (this.p2.targetX - this.p2.x) * lerpFactor;
        this.p2.y += (this.p2.targetY - this.p2.y) * lerpFactor;
        this.p2.vx = (this.p2.x - prevP2X) / (dt || 0.016);
        this.p2.vy = (this.p2.y - prevP2Y) / (dt || 0.016);
    }

    // Check circle-rectangle collision with paddle
    checkPaddleCollision(paddle, isP1) {
        const b = this.ball;
        // Closest point on paddle to ball center
        const closestX = Math.max(paddle.x - this.PADDLE_HALF_W, Math.min(paddle.x + this.PADDLE_HALF_W, b.x));
        const closestY = Math.max(paddle.y - this.PADDLE_HALF_H, Math.min(paddle.y + this.PADDLE_HALF_H, b.y));

        const dx = b.x - closestX;
        const dy = b.y - closestY;
        const distSq = dx * dx + dy * dy;

        if (distSq < b.radius * b.radius) {
            const dist = Math.sqrt(distSq) || 1;
            const nx = dx / dist;
            const ny = dy / dist;

            // Push ball out of paddle
            const overlap = b.radius - dist;
            b.x += nx * overlap;
            b.y += ny * overlap;

            // Compute reflection angle based on where it hit along the paddle width
            const hitFactor = Math.max(-1, Math.min(1, (b.x - paddle.x) / (this.PADDLE_HALF_W + b.radius * 0.5)));
            const maxAngle = Math.PI * 0.38; // Max deflection ~68 degrees
            const currentSpeed = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
            const boostedSpeed = Math.min(this.ball.maxSpeed, Math.max(this.ball.minSpeed, currentSpeed * 1.08 + 1.2));

            const bounceAngle = (isP1 ? -Math.PI * 0.5 : Math.PI * 0.5) + hitFactor * maxAngle;
            b.vx = Math.sin(bounceAngle) * boostedSpeed;
            b.vy = Math.cos(bounceAngle) * (isP1 ? -Math.abs(Math.cos(bounceAngle) * boostedSpeed) : Math.abs(Math.cos(bounceAngle) * boostedSpeed));

            // Add paddle velocity influence
            b.vx += paddle.vx * 0.25;

            // Clamp max speed
            const speed = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
            if (speed > this.ball.maxSpeed) {
                b.vx = (b.vx / speed) * this.ball.maxSpeed;
                b.vy = (b.vy / speed) * this.ball.maxSpeed;
            }

            b.lastHitRole = isP1 ? 1 : 2;

            // Sounds & Visual Juice
            if (window.audioManager) {
                window.audioManager.playPaddleHit(boostedSpeed);
                window.audioManager.playKick(boostedSpeed / 18);
            }
            if (window.effectsManager) {
                window.effectsManager.spawnPaddleImpact(b.x, b.y, bounceAngle, boostedSpeed, isP1);
            }
            return true;
        }
        return false;
    }

    // Check goal post collisions
    checkPostCollisions() {
        const b = this.ball;
        for (const post of this.posts) {
            const dx = b.x - post.x;
            const dy = b.y - post.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const minDist = b.radius + post.radius;

            if (dist < minDist) {
                const nx = dx / (dist || 1);
                const ny = dy / (dist || 1);

                // Push out
                b.x = post.x + nx * minDist;
                b.y = post.y + ny * minDist;

                // Reflect velocity
                const dot = b.vx * nx + b.vy * ny;
                b.vx = (b.vx - 2 * dot * nx) * 1.02;
                b.vy = (b.vy - 2 * dot * ny) * 1.02;

                if (window.audioManager) window.audioManager.playPostClang();
                if (window.effectsManager) window.effectsManager.spawnPostImpact(post.x, post.y);
            }
        }
    }

    // Step physics forward by dt
    update(dt) {
        this.updatePaddles(dt);

        const b = this.ball;

        // Apply slight turf drag
        b.vx *= Math.pow(b.drag, dt * 60);
        b.vy *= Math.pow(b.drag, dt * 60);

        // Enforce MINIMUM SPEED: Ball must NEVER stop moving!
        let currentSpeed = Math.hypot(b.vx, b.vy);
        if (currentSpeed < this.ball.minSpeed) {
            if (currentSpeed < 0.5) {
                // Completely stopped or near zero: give immediate launch towards opponent
                b.vy = (b.y > 672 ? -this.ball.minSpeed : this.ball.minSpeed);
                b.vx = (Math.random() - 0.5) * 4;
            } else {
                const ratio = this.ball.minSpeed / currentSpeed;
                b.vx *= ratio;
                b.vy *= ratio;
            }
            currentSpeed = this.ball.minSpeed;
        }

        // Prevent horizontal deadlock (ball only bouncing left-right without moving up/down)
        if (Math.abs(b.vy) < 2.5) {
            b.vy = (b.y > 672 ? -3.8 : 3.8);
        }

        // Update ball position
        b.x += b.vx * dt * 60;
        b.y += b.vy * dt * 60;

        // Ball rolling rotation
        b.rotation += (currentSpeed / b.radius) * 0.45;

        // Ball trail effect
        if (window.effectsManager) {
            window.effectsManager.addBallTrail(b.x, b.y, b.radius, currentSpeed);
        }

        // Left / Right wall bounce
        if (b.x - b.radius < this.WALL_LEFT) {
            b.x = this.WALL_LEFT + b.radius;
            b.vx = -b.vx * 0.98;
            if (window.audioManager) window.audioManager.playWallBounce();
            if (window.effectsManager) window.effectsManager.spawnWallBounce(b.x, b.y, 1, 0);
        } else if (b.x + b.radius > this.WALL_RIGHT) {
            b.x = this.WALL_RIGHT - b.radius;
            b.vx = -b.vx * 0.98;
            if (window.audioManager) window.audioManager.playWallBounce();
            if (window.effectsManager) window.effectsManager.spawnWallBounce(b.x, b.y, -1, 0);
        }

        // Top Wall bounce (outside goal mouth)
        const isTopGoalMouth = b.x >= this.GOAL_LEFT && b.x <= this.GOAL_RIGHT;
        if (!isTopGoalMouth && b.y - b.radius < this.WALL_TOP) {
            b.y = this.WALL_TOP + b.radius;
            b.vy = -b.vy * 0.98;
            if (window.audioManager) window.audioManager.playWallBounce();
            if (window.effectsManager) window.effectsManager.spawnWallBounce(b.x, b.y, 0, 1);
        }

        // Bottom Wall bounce (outside goal mouth)
        const isBottomGoalMouth = b.x >= this.GOAL_LEFT && b.x <= this.GOAL_RIGHT;
        if (!isBottomGoalMouth && b.y + b.radius > this.WALL_BOTTOM) {
            b.y = this.WALL_BOTTOM - b.radius;
            b.vy = -b.vy * 0.98;
            if (window.audioManager) window.audioManager.playWallBounce();
            if (window.effectsManager) window.effectsManager.spawnWallBounce(b.x, b.y, 0, -1);
        }

        // Check Goal Post Collisions
        this.checkPostCollisions();

        // Check Paddle Collisions
        this.checkPaddleCollision(this.p1, true);
        this.checkPaddleCollision(this.p2, false);

        // Check Goal Scoring:
        // Top goal entered => Player 1 scored!
        if (b.y < this.GOAL_TOP_Y - 5 && isTopGoalMouth) {
            return { scored: true, scorerRole: 1, ballX: b.x, ballY: b.y, isTopGoal: true };
        }
        // Bottom goal entered => Player 2 scored!
        if (b.y > this.GOAL_BOTTOM_Y + 5 && isBottomGoalMouth) {
            return { scored: true, scorerRole: 2, ballX: b.x, ballY: b.y, isTopGoal: false };
        }

        return { scored: false };
    }
}

window.physicsEngine = new PhysicsEngine();

