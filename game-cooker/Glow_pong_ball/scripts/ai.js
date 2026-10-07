/**
 * Glow Air Hockey / Glow Pong Ball - AI Opponent
 * Predictive trajectory calculation, defensive positioning, and striking tactics
 */

class AirHockeyAI {
    constructor(tableConfig) {
        this.config = tableConfig;
        this.court = tableConfig.court;
        this.radius = tableConfig.malletRadius;

        // Difficulty profiles
        this.difficulties = {
            easy: { maxSpeed: 700, accel: 1800, reactionDelay: 0.12, strikePower: 0.7, errorMargin: 40 },
            medium: { maxSpeed: 1050, accel: 3200, reactionDelay: 0.06, strikePower: 1.0, errorMargin: 15 },
            hard: { maxSpeed: 1450, accel: 5200, reactionDelay: 0.02, strikePower: 1.3, errorMargin: 5 },
            pro: { maxSpeed: 1800, accel: 7500, reactionDelay: 0.00, strikePower: 1.5, errorMargin: 0 }
        };

        this.currentDifficulty = 'medium';
        this.targetX = this.court.centerX;
        this.targetY = this.court.top + 160;
        this.predictedX = this.court.centerX;
        this.reactionTimer = 0;
    }

    setDifficulty(level) {
        if (this.difficulties[level]) {
            this.currentDifficulty = level;
        }
    }

    update(aiMallet, puck, dt) {
        const diff = this.difficulties[this.currentDifficulty];
        const minX = this.court.left + this.radius;
        const maxX = this.court.right - this.radius;
        const minY = this.court.top + this.radius;
        const maxY = this.court.centerY - this.radius - 20;

        const homeX = this.court.centerX;
        const homeY = this.court.top + 150;

        this.reactionTimer += dt;

        // 1. Calculate Target Decision
        if (this.reactionTimer >= diff.reactionDelay) {
            this.reactionTimer = 0;

            if (puck.y > this.court.centerY) {
                // Puck in player's half -> Defensive zone coverage
                const goalCenterX = this.court.centerX;
                const goalCenterY = this.court.top;
                
                // Position along the defensive arc facing the puck
                const angleToPuck = Math.atan2(puck.y - goalCenterY, puck.x - goalCenterX);
                const defenseDist = 180;
                this.targetX = goalCenterX + Math.cos(angleToPuck) * defenseDist;
                this.targetY = goalCenterY + Math.sin(angleToPuck) * defenseDist;
                
                // Add minor human error for lower difficulties
                if (diff.errorMargin > 0) {
                    this.targetX += (Math.random() - 0.5) * diff.errorMargin;
                }
            } else {
                // Puck is in AI's half!
                if (puck.y < aiMallet.y - 10) {
                    // Puck got behind AI mallet! Avoid own goal!
                    if (puck.x < aiMallet.x) {
                        this.targetX = Math.min(maxX, aiMallet.x + 90);
                    } else {
                        this.targetX = Math.max(minX, aiMallet.x - 90);
                    }
                    this.targetY = Math.max(minY, puck.y - 40);
                } else {
                    // Attack & Intercept
                    const timeToIntercept = Math.max(0.01, (aiMallet.y - puck.y) / (puck.vy || 1));
                    let futureX = puck.x + puck.vx * Math.min(0.4, Math.max(0, timeToIntercept));

                    // Simple wall bounce reflection for predicted X
                    if (futureX < this.court.left + this.config.puckRadius) {
                        futureX = (this.court.left + this.config.puckRadius) * 2 - futureX;
                    } else if (futureX > this.court.right - this.config.puckRadius) {
                        futureX = (this.court.right - this.config.puckRadius) * 2 - futureX;
                    }

                    // Charge towards puck to strike it
                    const dx = futureX - aiMallet.x;
                    const dy = puck.y - aiMallet.y;
                    const distToPuck = Math.hypot(dx, dy);

                    if (distToPuck < 250 && puck.y > aiMallet.y) {
                        // Strike through puck!
                        this.targetX = futureX;
                        this.targetY = Math.min(maxY, puck.y + 70);
                    } else {
                        // Move to intercept position
                        this.targetX = futureX;
                        this.targetY = Math.min(maxY, Math.max(homeY, puck.y - 80));
                    }
                }
            }
        }

        // 2. Clamp target to legal AI territory
        this.targetX = Math.max(minX, Math.min(maxX, this.targetX));
        this.targetY = Math.max(minY, Math.min(maxY, this.targetY));

        // 3. Move AI Mallet towards target with velocity tracking
        const toTargetX = this.targetX - aiMallet.x;
        const toTargetY = this.targetY - aiMallet.y;
        const dist = Math.hypot(toTargetX, toTargetY);

        if (dist > 2) {
            const desiredVx = (toTargetX / dist) * Math.min(diff.maxSpeed, dist * 12);
            const desiredVy = (toTargetY / dist) * Math.min(diff.maxSpeed, dist * 12);

            // Smooth acceleration
            const accelStep = diff.accel * dt;
            aiMallet.vx += Math.max(-accelStep, Math.min(accelStep, desiredVx - aiMallet.vx));
            aiMallet.vy += Math.max(-accelStep, Math.min(accelStep, desiredVy - aiMallet.vy));
        } else {
            aiMallet.vx *= 0.5;
            aiMallet.vy *= 0.5;
        }

        const prevX = aiMallet.x;
        const prevY = aiMallet.y;

        aiMallet.x += aiMallet.vx * dt;
        aiMallet.y += aiMallet.vy * dt;

        // Strict clamp
        aiMallet.x = Math.max(minX, Math.min(maxX, aiMallet.x));
        aiMallet.y = Math.max(minY, Math.min(maxY, aiMallet.y));

        // Update velocity accurately based on actual displacement
        if (dt > 0) {
            aiMallet.vx = (aiMallet.x - prevX) / dt;
            aiMallet.vy = (aiMallet.y - prevY) / dt;
        }
    }
}

window.AirHockeyAI = AirHockeyAI;

