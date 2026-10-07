/**
 * Glow Air Hockey / Glow Pong Ball - High Precision Physics Engine
 * Continuous Sub-stepping, Elastic Collision Response & Kinematics
 */

class PhysicsEngine {
    constructor(tableConfig) {
        this.config = tableConfig || {
            width: 1080,
            height: 1920,
            court: {
                left: 120,
                right: 960,
                top: 210,
                bottom: 1710,
                centerX: 540,
                centerY: 960,
                goalLeft: 360,
                goalRight: 720,
                goalTopY: 210,
                goalBottomY: 1710,
                goalDepth: 90
            },
            malletRadius: 75,
            puckRadius: 40,
            subSteps: 8,
            friction: 0.9996,
            maxPuckSpeed: 2800,
            restitutionWall: 0.96,
            restitutionMallet: 1.12
        };

        this.onMalletHit = null;
        this.onWallHit = null;
        this.onGoal = null;
    }

    step(puck, playerMallet, aiMallet, dt) {
        if (!puck.active) return;

        const subDt = dt / this.config.subSteps;
        const court = this.config.court;
        const pR = this.config.puckRadius;
        const mR = this.config.malletRadius;
        const minDist = pR + mR;
        const minDistSq = minDist * minDist;

        for (let s = 0; s < this.config.subSteps; s++) {
            // 1. Move Puck
            puck.x += puck.vx * subDt;
            puck.y += puck.vy * subDt;

            // 2. Air table surface damping
            puck.vx *= this.config.friction;
            puck.vy *= this.config.friction;

            // Clamp max speed
            const currentSpeed = Math.hypot(puck.vx, puck.vy);
            if (currentSpeed > this.config.maxPuckSpeed) {
                const scale = this.config.maxPuckSpeed / currentSpeed;
                puck.vx *= scale;
                puck.vy *= scale;
            }

            // 3. Collision with Player Mallet
            this.handleMalletCollision(puck, playerMallet, minDist, minDistSq, 'player');

            // 4. Collision with AI Mallet
            this.handleMalletCollision(puck, aiMallet, minDist, minDistSq, 'ai');

            // 5. Left & Right Wall Collisions
            if (puck.x - pR < court.left) {
                puck.x = court.left + pR;
                puck.vx = -puck.vx * this.config.restitutionWall;
                if (this.onWallHit) this.onWallHit(puck.x, puck.y, 'left', Math.abs(puck.vx));
            } else if (puck.x + pR > court.right) {
                puck.x = court.right - pR;
                puck.vx = -puck.vx * this.config.restitutionWall;
                if (this.onWallHit) this.onWallHit(puck.x, puck.y, 'right', Math.abs(puck.vx));
            }

            // 6. Top Wall & Top Goal
            if (puck.y - pR < court.top) {
                const inGoalSlot = (puck.x >= court.goalLeft && puck.x <= court.goalRight);
                if (inGoalSlot) {
                    // Check if passed goal line deep enough
                    if (puck.y < court.top - 15) {
                        puck.active = false;
                        if (this.onGoal) this.onGoal('top', puck.x);
                        return;
                    }
                } else {
                    // Solid top rail
                    puck.y = court.top + pR;
                    puck.vy = -puck.vy * this.config.restitutionWall;
                    if (this.onWallHit) this.onWallHit(puck.x, puck.y, 'top', Math.abs(puck.vy));
                }
            }

            // 7. Bottom Wall & Bottom Goal
            if (puck.y + pR > court.bottom) {
                const inGoalSlot = (puck.x >= court.goalLeft && puck.x <= court.goalRight);
                if (inGoalSlot) {
                    // Check if passed goal line deep enough
                    if (puck.y > court.bottom + 15) {
                        puck.active = false;
                        if (this.onGoal) this.onGoal('bottom', puck.x);
                        return;
                    }
                } else {
                    // Solid bottom rail
                    puck.y = court.bottom - pR;
                    puck.vy = -puck.vy * this.config.restitutionWall;
                    if (this.onWallHit) this.onWallHit(puck.x, puck.y, 'bottom', Math.abs(puck.vy));
                }
            }
        }
    }

    handleMalletCollision(puck, mallet, minDist, minDistSq, malletOwner) {
        const dx = puck.x - mallet.x;
        const dy = puck.y - mallet.y;
        const distSq = dx * dx + dy * dy;

        if (distSq < minDistSq) {
            const dist = Math.max(0.001, Math.sqrt(distSq));
            const nx = dx / dist;
            const ny = dy / dist;

            // Separate overlapping bodies
            puck.x = mallet.x + nx * (minDist + 0.5);
            puck.y = mallet.y + ny * (minDist + 0.5);

            // Relative velocity
            const rvx = puck.vx - mallet.vx;
            const rvy = puck.vy - mallet.vy;
            const velAlongNormal = rvx * nx + rvy * ny;

            // Only bounce if moving towards each other
            if (velAlongNormal < 0) {
                const impulse = -(1 + this.config.restitutionMallet) * velAlongNormal;
                puck.vx += nx * impulse;
                puck.vy += ny * impulse;

                // Transfer forward mallet thrust
                const malletSpeed = Math.hypot(mallet.vx, mallet.vy);
                if (malletSpeed > 50) {
                    puck.vx += mallet.vx * 0.45;
                    puck.vy += mallet.vy * 0.45;
                }

                // Minimum bounce speed so puck never stalls
                const totalSpeed = Math.hypot(puck.vx, puck.vy);
                if (totalSpeed < 400) {
                    const boost = 400 / (totalSpeed || 1);
                    puck.vx *= boost;
                    puck.vy *= boost;
                }

                if (this.onMalletHit) {
                    this.onMalletHit(puck.x, puck.y, malletOwner, totalSpeed);
                }
            }
        }
    }
}

window.PhysicsEngine = PhysicsEngine;

