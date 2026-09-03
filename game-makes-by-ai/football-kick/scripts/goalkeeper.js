/**
 * Goalkeeper AI & Physics Engine
 * 
 * Implements intelligent, progressive-difficulty goalkeeper behavior:
 * - Kicks 1-3: Easy (Slow reaction, low reach)
 * - Kicks 4-6: Medium (Moderate reaction, standard reach)
 * - Kicks 7-9: Hard (Fast reaction, reaches corners)
 * - Kick 10+: Pro (Lightning reflexes, full-stretch diving)
 */

class Goalkeeper {
  constructor(goalBox) {
    this.goalBox = goalBox; // { x, y, width, height }
    this.reset();
  }

  reset() {
    this.centerX = this.goalBox.x + this.goalBox.width / 2;
    this.groundY = this.goalBox.y + this.goalBox.height - 10;
    
    this.x = this.centerX;
    this.y = this.groundY;
    this.targetX = this.centerX;
    this.targetY = this.groundY;
    
    this.vx = 0;
    this.vy = 0;
    this.width = 110;
    this.height = 190;
    
    // States: 'idle', 'reacting', 'diving', 'saved', 'conceded', 'recovering'
    this.state = 'idle';
    this.diveDirection = 'center'; // 'left', 'right', 'top-left', 'top-right', 'center'
    
    this.reactionTimer = 0;
    this.reactionDelay = 0.25; // seconds
    this.diveSpeed = 700;
    this.reachRadius = 85;
    
    this.diveProgress = 0;
    this.diveAngle = 0; // rotation angle in radians
    this.bodySquish = 1.0;
    this.armExtension = 0; // 0 to 1
    
    // Idle bounce animation timer
    this.idleTime = Math.random() * 10;
    this.idleShuffleX = 0;

    // Difficulty settings
    this.level = 1;
    this.levelLabel = 'ROOKIE';
  }

  /**
   * Update difficulty level based on the current kick index (1 to 10+)
   * @param {number} kickIndex 1-based kick number
   */
  setDifficultyForKick(kickIndex) {
    if (kickIndex <= 3) {
      // Level 1: Easy / Beginner friendly
      this.level = 1;
      this.levelLabel = 'EASY (Rookie GK)';
      this.reactionDelay = 0.45 + Math.random() * 0.12;
      this.diveSpeed = 340;
      this.reachRadius = 45;
      this.predictionAccuracy = 0.35; // Frequently dives wrong way or late
    } else if (kickIndex <= 6) {
      // Level 2: Moderate
      this.level = 2;
      this.levelLabel = 'MEDIUM (Club GK)';
      this.reactionDelay = 0.34 + Math.random() * 0.08;
      this.diveSpeed = 450;
      this.reachRadius = 55;
      this.predictionAccuracy = 0.55;
    } else if (kickIndex <= 9) {
      // Level 3: Challenging
      this.level = 3;
      this.levelLabel = 'HARD (Pro GK)';
      this.reactionDelay = 0.24 + Math.random() * 0.06;
      this.diveSpeed = 580;
      this.reachRadius = 65;
      this.predictionAccuracy = 0.75;
    } else {
      // Level 4: Final Challenge
      this.level = 4;
      this.levelLabel = 'LEGENDARY (Top GK)';
      this.reactionDelay = 0.18 + Math.random() * 0.04;
      this.diveSpeed = 700;
      this.reachRadius = 75;
      this.predictionAccuracy = 0.88;
    }
  }

  /**
   * Trigger goalkeeper dive towards predicted ball trajectory
   * @param {number} predictedX Goal line intersection X
   * @param {number} predictedY Goal line intersection Y
   * @param {number} flightTime Seconds until ball reaches goal
   */
  anticipateShot(predictedX, predictedY, flightTime) {
    if (this.state !== 'idle') return;

    let targetX = predictedX;
    let targetY = predictedY;

    // Realistic human goalkeeper errors (guessing wrong side or freezing)
    if (Math.random() > this.predictionAccuracy) {
      const isShotOnLeft = predictedX < this.centerX;
      const errorChoice = Math.random();

      if (errorChoice < 0.55) {
        // Dives to the WRONG side!
        targetX = isShotOnLeft ? (this.centerX + 180 + Math.random() * 120) : (this.centerX - 180 - Math.random() * 120);
        targetY = this.groundY - 30 - Math.random() * 80;
      } else if (errorChoice < 0.85) {
        // Freezes / stays near center
        targetX = this.centerX + (Math.random() - 0.5) * 60;
        targetY = this.groundY;
      } else {
        // Misjudges height
        targetY = this.groundY;
      }
    }

    // Clamp target within goal bounds
    targetX = Math.max(this.goalBox.x + 30, Math.min(this.goalBox.x + this.goalBox.width - 30, targetX));
    targetY = Math.max(this.goalBox.y + 20, Math.min(this.groundY, targetY));

    this.targetX = targetX;
    this.targetY = targetY;

    this.state = 'reacting';
    // Let real reaction delay apply so powerful shots beat the keeper!
    this.reactionTimer = this.reactionDelay;
  }

  update(dt) {
    this.idleTime += dt * 3;

    if (this.state === 'idle') {
      // Subtle rhythmic shuffling on goal line
      this.idleShuffleX = Math.sin(this.idleTime * 0.8) * 35;
      this.x = this.centerX + this.idleShuffleX;
      this.y = this.groundY + Math.abs(Math.sin(this.idleTime * 2.5)) * -8;
      this.diveAngle = 0;
      this.armExtension = 0.1;
      return;
    }

    if (this.state === 'reacting') {
      this.reactionTimer -= dt;
      // Slight pre-jump squat
      this.y = this.groundY + 8;
      if (this.reactionTimer <= 0) {
        this.startDive();
      }
      return;
    }

    if (this.state === 'diving') {
      this.diveProgress = Math.min(1.0, this.diveProgress + dt * (this.diveSpeed / 300));

      const dx = this.targetX - this.x;
      const dy = this.targetY - this.y;
      const dist = Math.hypot(dx, dy);

      if (dist > 15) {
        const step = Math.min(dist, this.diveSpeed * dt);
        this.x += (dx / dist) * step;
        this.y += (dy / dist) * step;
      }

      // Dynamic tilt / dive rotation
      const targetAngle = (this.targetX - this.centerX) / (this.goalBox.width * 0.5) * 0.9;
      this.diveAngle += (targetAngle - this.diveAngle) * Math.min(1.0, dt * 12);
      this.armExtension = Math.min(1.0, this.armExtension + dt * 6);
    } else if (this.state === 'saved' || this.state === 'conceded') {
      // Gravity pulls keeper to ground if in mid-air
      if (this.y < this.groundY) {
        this.y = Math.min(this.groundY, this.y + 700 * dt);
      }
    }
  }

  startDive() {
    this.state = 'diving';
    this.diveProgress = 0;
    this.armExtension = 0.4;
  }

  /**
   * Check collision with ball at goal line depth
   * @param {Object} ball Ball object { x, y, radius }
   * @returns {boolean} True if keeper saved the ball
   */
  checkSave(ball) {
    if (this.state === 'saved') return true;

    // Gloves check (proportional and fair)
    const gloves = this.getGlovePositions();
    for (const glove of gloves) {
      const dist = Math.hypot(ball.x - glove.x, ball.y - glove.y);
      if (dist < ball.radius * 0.75 + glove.radius) {
        this.state = 'saved';
        return true;
      }
    }

    // Torso / body save box (does not extend unrealistically into corners)
    const bodyDx = Math.abs(ball.x - this.x);
    const bodyDy = Math.abs(ball.y - (this.y - 75));
    if (bodyDx < (this.width * 0.26 + ball.radius * 0.65) && bodyDy < (this.height * 0.30 + ball.radius * 0.65)) {
      this.state = 'saved';
      return true;
    }

    return false;
  }

  /**
   * Compute positions of both keeper gloves in world coordinates
   */
  getGlovePositions() {
    const angle = this.diveAngle;
    const reach = 60 + this.armExtension * this.reachRadius;

    // Left glove
    const leftAngle = angle - 0.45;
    const lx = this.x + Math.sin(leftAngle) * reach - 25 * Math.cos(angle);
    const ly = (this.y - 85) - Math.cos(leftAngle) * (reach * 0.8);

    // Right glove
    const rightAngle = angle + 0.45;
    const rx = this.x + Math.sin(rightAngle) * reach + 25 * Math.cos(angle);
    const ry = (this.y - 85) - Math.cos(rightAngle) * (reach * 0.8);

    const radius = 18 + (this.level * 2.5); // Natural, fair glove radius

    return [
      { x: lx, y: ly, radius },
      { x: rx, y: ry, radius }
    ];
  }
}

if (typeof window !== 'undefined') {
  window.Goalkeeper = Goalkeeper;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = Goalkeeper;
}

