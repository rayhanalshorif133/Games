/**
 * FootballKickGame - Core Game Logic, Trajectory Physics, and Tournament Rules
 * 
 * Manages:
 * - 10-Kick Penalty Challenge with Extra Kick Bonus
 * - Progressive Goalkeeper Scaling (Easy to Hard)
 * - Swipe Gesture Recognition with Curve & Spin Magnus Effect
 * - 3D Trajectory Projection (X, Y, Z Depth)
 * - Goal Post Target Zones & Moving Bonus Bar Collision
 * - Streak Multipliers & Tournament Match Statistics
 */

class FootballKickGame {
  constructor(canvas, soundEngine, renderer) {
    this.canvas = canvas;
    this.sound = soundEngine;
    this.renderer = renderer;

    // Goal bounds in 1080x1920 coordinates
    this.goalBox = {
      x: 140,
      y: 460,
      width: 800,
      height: 460
    };

    // Goalkeeper
    this.goalkeeper = new Goalkeeper(this.goalBox);

    // Setup Target Zones (Coordinates inside goal mouth)
    this.initTargetZones();

    // Moving Extra Kick Bonus Bar
    this.initBonusBar();

    // Game Tournament State
    this.maxInitialKicks = 10;
    this.resetMatch();

    // Input state
    this.isAiming = false;
    this.aimTrail = [];
    this.swipeStartTime = 0;

    // Goal Banner celebration overlay
    this.goalBannerText = 'GOAAAL!';
    this.goalBannerTimer = 0;

    // Callbacks
    this.onStateChange = null;
    this.onGameOver = null;
  }

  initTargetZones() {
    this.targetZones = [
      { id: 'top_left', name: 'TOP BIN!', x: 215, y: 525, radius: 55, points: 150, color: '#00f0ff' },
      { id: 'top_right', name: 'TOP BIN!', x: 865, y: 525, radius: 55, points: 150, color: '#00f0ff' },
      { id: 'bottom_left', name: 'BOTTOM CORNER', x: 215, y: 860, radius: 55, points: 100, color: '#00ff88' },
      { id: 'bottom_right', name: 'BOTTOM CORNER', x: 865, y: 860, radius: 55, points: 100, color: '#00ff88' },
      { id: 'upper_mid', name: 'UNDER BAR', x: 540, y: 515, radius: 50, points: 75, color: '#ffd700' },
      { id: 'mid_left', name: 'SIDE NET', x: 195, y: 690, radius: 48, points: 80, color: '#ff9900' },
      { id: 'mid_right', name: 'SIDE NET', x: 885, y: 690, radius: 48, points: 80, color: '#ff9900' },
      { id: 'center', name: 'CENTER NET', x: 540, y: 720, radius: 75, points: 50, color: '#ffffff' }
    ];
  }

  initBonusBar() {
    this.bonusBar = {
      active: true,
      x: 340,
      y: 560,
      width: 270, // Wider bonus bar so it is rewarding and fun to hit
      height: 50,
      minX: 180,
      maxX: 630,
      speed: 150, // Gentle, smooth speed
      direction: 1
    };
  }

  resetMatch() {
    this.kicksTotal = this.maxInitialKicks;
    this.kicksRemaining = this.maxInitialKicks;
    this.currentKickIndex = 1;
    this.score = 0;
    this.goals = 0;
    this.misses = 0;
    this.saves = 0;
    this.extraKicksEarned = 0;
    this.topBinsHit = 0;
    this.streak = 0;
    this.maxStreak = 0;
    this.history = []; // ['goal', 'saved', 'miss', 'extra_bonus']

    this.isMatchOver = false;
    this.shotInProgress = false;
    this.resetBall();
    this.updateGoalkeeperDifficulty();
  }

  resetBall() {
    this.ball = {
      x: 540,
      y: 1530,
      startX: 540,
      startY: 1530,
      groundY: 1530,
      z: 0.0, // 0 = at penalty spot, 1 = at goal line, >1 = inside net / out
      radius: 56, // Large at foreground
      startRadius: 56,
      targetRadius: 24, // Smaller at goal line
      vx: 0,
      vy: 0,
      vz: 0,
      spin: 0, // Curve effect
      rotationX: 0,
      rotationY: 0,
      isAirborne: false,
      isResolved: false,
      settledTimer: 0
    };

    this.shotInProgress = false;
    this.goalkeeper.reset();
    this.updateGoalkeeperDifficulty();
  }

  updateGoalkeeperDifficulty() {
    this.goalkeeper.setDifficultyForKick(this.currentKickIndex);
  }

  // ================= INPUT HANDLING =================

  startAim(screenX, screenY) {
    if (this.shotInProgress || this.isMatchOver) return;

    // Allow swipe initiation anywhere in the lower half of screen
    if (screenY < 1000) return;

    this.sound.ensureContext();
    this.isAiming = true;
    this.aimTrail = [{ x: screenX, y: screenY, time: performance.now() }];
    this.swipeStartTime = performance.now();
  }

  updateAim(screenX, screenY) {
    if (!this.isAiming) return;
    const now = performance.now();
    this.aimTrail.push({ x: screenX, y: screenY, time: now });

    // Limit trail length for memory efficiency
    if (this.aimTrail.length > 25) {
      this.aimTrail.shift();
    }
  }

  releaseAim(screenX, screenY) {
    if (!this.isAiming) return;
    this.isAiming = false;

    if (this.aimTrail.length < 2) return;

    const startPt = this.aimTrail[0];
    const endPt = { x: screenX, y: screenY, time: performance.now() };

    const dx = endPt.x - startPt.x;
    const dy = endPt.y - startPt.y;
    const dt = Math.max(16, (endPt.time - startPt.time)) / 1000;

    // Responsive swipe sensitivity: even a gentle flick upwards kicks the ball
    if (dy > -25) return;

    // Calculate swipe speed
    const swipeDistance = Math.hypot(dx, dy);
    const speed = swipeDistance / dt;

    // Smooth power curve
    const powerNorm = Math.min(1.0, Math.max(0.35, speed / 1500));
    const flightTime = Math.max(0.55, 1.05 - powerNorm * 0.38);

    // Calculate Curvature (Magnus Spin)
    let maxDeflection = 0;
    for (let i = 1; i < this.aimTrail.length - 1; i++) {
      const p = this.aimTrail[i];
      const progress = i / (this.aimTrail.length - 1);
      const expX = startPt.x + dx * progress;
      const expY = startPt.y + dy * progress;
      const deflection = p.x - expX;
      if (Math.abs(deflection) > Math.abs(maxDeflection)) {
        maxDeflection = deflection;
      }
    }
    const spin = Math.max(-200, Math.min(200, maxDeflection * 5.0));

    // Target X & Y at goal line (Z = 1.0)
    // Accurate and forgiving horizontal & vertical mapping
    const targetX = this.ball.x + dx * 0.88;
    const targetY = Math.max(480, Math.min(910, 920 - (Math.abs(dy) * 0.72)));

    this.executeShot(targetX, targetY, flightTime, spin, powerNorm);
  }

  executeShot(targetX, targetY, flightTime, spin, power) {
    this.shotInProgress = true;
    this.ball.isAirborne = true;
    this.kicksRemaining--;

    // Sound effect: Leather kick thump
    this.sound.playKick(power);

    // Initial velocities
    this.ball.vz = 1.0 / flightTime; // Reaches Z=1.0 at flightTime
    this.ball.vx = (targetX - this.ball.x) / flightTime;
    this.ball.vy = (targetY - this.ball.y) / flightTime;
    this.ball.spin = spin;

    // Visual dust particles at kick point
    this.renderer.addParticles(this.ball.x, this.ball.y, '#ffffff', 20);

    // Alert Goalkeeper to calculate dive reaction
    const predictedX = targetX + (spin * flightTime * 0.25);
    const predictedY = targetY;
    this.goalkeeper.anticipateShot(predictedX, predictedY, flightTime);

    if (this.onStateChange) this.onStateChange(this);
  }

  // ================= UPDATE CYCLE =================

  update(dt) {
    // 1. Update moving Extra Kick Bonus Bar
    if (this.bonusBar.active) {
      this.bonusBar.x += this.bonusBar.speed * this.bonusBar.direction * dt;
      if (this.bonusBar.x >= this.bonusBar.maxX) {
        this.bonusBar.x = this.bonusBar.maxX;
        this.bonusBar.direction = -1;
      } else if (this.bonusBar.x <= this.bonusBar.minX) {
        this.bonusBar.x = this.bonusBar.minX;
        this.bonusBar.direction = 1;
      }
    }

    // 2. Update Goalkeeper
    this.goalkeeper.update(dt);

    // 3. Update Ball Trajectory & Physics
    if (this.shotInProgress && this.ball.isAirborne) {
      // Progress depth Z
      this.ball.z += this.ball.vz * dt;

      // Apply spin / Magnus curve horizontally
      this.ball.vx += this.ball.spin * dt;
      this.ball.x += this.ball.vx * dt;
      this.ball.y += this.ball.vy * dt;

      // Interpolate ball radius from penalty spot scale to goal scale
      const zProgress = Math.min(1.0, this.ball.z);
      this.ball.radius = this.ball.startRadius - zProgress * (this.ball.startRadius - this.ball.targetRadius);

      // 3D Ball texture rotation
      this.ball.rotationX += this.ball.vx * dt * 0.8;
      this.ball.rotationY += this.ball.vy * dt * 0.8;

      // Ground plane tracking for realistic shadow projection
      this.ball.groundY = 1530 - zProgress * (1530 - 920);

      // Check arrival at Goal Line (Z >= 1.0)
      if (this.ball.z >= 1.0 && !this.ball.isResolved) {
        this.resolveShotOutcome();
      }

      // Ball settling after impact
      if (this.ball.isResolved) {
        this.ball.settledTimer += dt;
        if (this.ball.settledTimer >= 2.0) {
          this.finishShotCycle();
        }
      }
    }

    // 4. Update Net deformation physics
    this.renderer.updateNetPhysics(dt, this.netImpact);
    this.netImpact = null; // Clear single-frame impact impulse

    // 5. Update celebration banner timer
    if (this.goalBannerTimer > 0) {
      this.goalBannerTimer = Math.max(0, this.goalBannerTimer - dt);
    }
  }

  // ================= OUTCOME RESOLUTION =================

  resolveShotOutcome() {
    this.ball.isResolved = true;
    const bx = this.ball.x;
    const by = this.ball.y;
    const br = this.ball.radius;
    const gb = this.goalBox;

    // 1. Check Goalkeeper Save
    if (this.goalkeeper.checkSave(this.ball)) {
      this.saves++;
      this.streak = 0;
      this.history.push('saved');
      this.sound.playKeeperSave();
      this.renderer.triggerCameraShake(12);
      this.renderer.addFloatingText('SAVED BY KEEPER!', bx, by - 60, '#ff4444', 52);
      this.renderer.addParticles(bx, by, '#ff6600', 30);

      // Ball deflects away
      this.ball.vx = (bx - this.goalkeeper.x) * 2.5;
      this.ball.vy = -180;
      this.ball.vz = 0.1;
      return;
    }

    // 2. Check Inside Goal Net (GOAL!)
    // Generous and fair goal detection: if the ball is inside the posts and under the crossbar
    const isInsideGoal = (bx >= gb.x + 2 && bx <= gb.x + gb.width - 2 && by >= gb.y + 4 && by <= gb.y + gb.height + 15);

    if (isInsideGoal) {
      this.goals++;
      this.streak++;
      if (this.streak > this.maxStreak) this.maxStreak = this.streak;

      this.goalkeeper.state = 'conceded';

      // Net impact physics push
      this.netImpact = { x: bx, y: by, force: 14 };
      this.sound.playNetSwish();
      this.sound.playGoalCheer();
      this.renderer.triggerCameraShake(14);
      this.renderer.addConfettiBurst(bx, by, 120);

      // Evaluate Target Zone Points
      let hitZone = null;
      let minZoneDist = Infinity;
      for (const zone of this.targetZones) {
        const dist = Math.hypot(bx - zone.x, by - zone.y);
        if (dist < zone.radius + br + 20 && dist < minZoneDist) {
          minZoneDist = dist;
          hitZone = zone;
        }
      }

      let basePoints = hitZone ? hitZone.points : 50;
      let zoneName = hitZone ? hitZone.name : 'GOAL!';

      if (hitZone && hitZone.id.includes('top')) {
        this.topBinsHit++;
      }

      // Streak multiplier calculation
      let multiplier = 1.0;
      if (this.streak >= 4) multiplier = 2.5;
      else if (this.streak >= 3) multiplier = 2.0;
      else if (this.streak >= 2) multiplier = 1.5;

      const awardedScore = Math.round(basePoints * multiplier);
      this.score += awardedScore;

      // Check Moving Extra Kick Bonus Bar
      let hitBonusBar = false;
      if (this.bonusBar.active) {
        const b = this.bonusBar;
        if (bx >= b.x - br - 10 && bx <= b.x + b.width + br + 10 && by >= b.y - br - 10 && by <= b.y + b.height + br + 10) {
          hitBonusBar = true;
          this.kicksRemaining++; // Award extra kick!
          this.extraKicksEarned++;
          this.score += 200; // Extra bonus points!
          this.sound.playBonusChime();
          this.renderer.addFloatingText('⭐ +1 EXTRA KICK! ⭐', bx, by - 120, '#ffd700', 60);
          this.renderer.addConfettiBurst(b.x + b.width / 2, b.y, 90);
        }
      }

      const multText = multiplier > 1 ? ` (${multiplier}x STREAK)` : '';
      const bannerMsg = hitBonusBar ? 'EXTRA KICK + GOAL!' : `${zoneName} +${awardedScore}${multText}`;
      this.goalBannerText = bannerMsg;
      this.goalBannerTimer = 1.8;

      this.renderer.addFloatingText(`+${awardedScore}`, bx, by - 40, '#00ff88', 56);
      this.history.push(hitBonusBar ? 'extra_bonus' : 'goal');

      // Ball stops in net
      this.ball.vx *= 0.15;
      this.ball.vy *= 0.15;
      this.ball.vz = 0;
    } else {
      // 3. If outside goal, check if it struck the post or crossbar
      const hitCrossbar = (Math.abs(by - gb.y) < br + 8 && bx >= gb.x - 25 && bx <= gb.x + gb.width + 25);
      const hitLeftPost = (Math.abs(bx - gb.x) < br + 8 && by >= gb.y - 10 && by <= gb.y + gb.height);
      const hitRightPost = (Math.abs(bx - (gb.x + gb.width)) < br + 8 && by >= gb.y - 10 && by <= gb.y + gb.height);

      if (hitCrossbar || hitLeftPost || hitRightPost) {
        this.misses++;
        this.streak = 0;
        this.history.push('post');
        this.sound.playPostHit();
        this.sound.playCrowdGroan();
        this.renderer.triggerCameraShake(20);
        this.renderer.addFloatingText('WOODWORK HIT! ⚡', bx, by - 50, '#ff9900', 50);
        this.renderer.addParticles(bx, by, '#ffffff', 35);

        // Rebound forward towards pitch
        this.ball.vz = -0.4;
        this.ball.vy = 260;
        this.ball.vx = (bx - 540) * 0.5;
        return;
      }

      // Missed wide or high
      this.misses++;
      this.streak = 0;
      this.history.push('miss');
      this.sound.playCrowdGroan();
      this.renderer.addFloatingText('MISSED THE TARGET!', bx, Math.max(380, by - 40), '#aaaaaa', 48);
      this.ball.vz = 0.2;
    }

    if (this.onStateChange) this.onStateChange(this);
  }

  finishShotCycle() {
    this.currentKickIndex++;

    // Check if match has ended
    if (this.kicksRemaining <= 0) {
      this.isMatchOver = true;
      this.sound.playWhistle(true); // Final whistle

      if (this.onGameOver) {
        this.onGameOver({
          score: this.score,
          goals: this.goals,
          totalShots: this.history.length,
          kicksLeft: 0,
          accuracy: Math.round((this.goals / Math.max(1, this.history.length)) * 100),
          extraKicksEarned: this.extraKicksEarned,
          topBinsHit: this.topBinsHit,
          streakMax: this.maxStreak,
          history: [...this.history]
        });
      }
    } else {
      // Ready next kick
      this.sound.playWhistle(false);
      this.resetBall();
    }

    if (this.onStateChange) this.onStateChange(this);
  }
}

if (typeof window !== 'undefined') {
  window.FootballKickGame = FootballKickGame;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = FootballKickGame;
}

