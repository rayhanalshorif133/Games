/**
 * Physics Engine & Collision Detection for Basketball Game
 */
class BasketballPhysics {
  constructor(config) {
    this.cfg = config.gameplay;
    this.gravity = this.cfg.gravity || 1800;
    this.airResistance = this.cfg.airResistance || 0.999;
    this.floorY = this.cfg.floorY || 1740;
    this.hoop = this.cfg.hoop;
  }

  // Create a new ball object
  createBall(x, y) {
    return {
      x,
      y,
      oldX: x,
      oldY: y,
      vx: 0,
      vy: 0,
      radius: this.cfg.ballRadius || 54,
      rotation: 0,
      angularVelocity: 0,
      isShooting: false,
      isHeld: true,
      hasScored: false,
      touchedRim: false,
      touchedBackboard: false,
      isCleanShot: true,
      scoreTriggered: false,
      bounceCount: 0,
      active: true,
      timeAlive: 0
    };
  }

  // Shoot ball with velocity
  shoot(ball, vx, vy) {
    ball.vx = vx;
    ball.vy = vy;
    ball.oldX = ball.x;
    ball.oldY = ball.y;
    ball.isHeld = false;
    ball.isShooting = true;
    ball.hasScored = false;
    ball.touchedRim = false;
    ball.touchedBackboard = false;
    ball.isCleanShot = true;
    ball.scoreTriggered = false;
    ball.bounceCount = 0;
    ball.timeAlive = 0;
    // Ball backspin is key for realistic basketball flight
    ball.angularVelocity = -vx * 0.005 - 2.5;
  }

  // Update ball physics step
  update(ball, dt, net, onScoreCallback) {
    if (!ball || ball.isHeld || !ball.active) return;

    ball.timeAlive += dt;
    ball.oldX = ball.x;
    ball.oldY = ball.y;

    // Apply gravity & air drag
    ball.vy += this.gravity * dt;
    ball.vx *= Math.pow(this.airResistance, dt * 60);
    ball.vy *= Math.pow(this.airResistance, dt * 60);

    // Update position
    ball.x += ball.vx * dt;
    ball.y += ball.vy * dt;

    // Update spin
    ball.rotation += ball.angularVelocity * dt;
    ball.angularVelocity *= 0.992; // Rotational friction

    // Collisions
    this.handleFloorCollision(ball);
    this.handleWallCollisions(ball);
    this.handleBackboardCollision(ball);
    this.handleRimCollisions(ball);

    // Check Basket scoring
    this.checkScore(ball, net, onScoreCallback);
  }

  // Floor bounce
  handleFloorCollision(ball) {
    if (ball.y + ball.radius >= this.floorY) {
      ball.y = this.floorY - ball.radius;
      if (Math.abs(ball.vy) > 60) {
        window.soundEngine.playBounce(Math.abs(ball.vy) / 800);
      }
      ball.vy = -ball.vy * this.cfg.floorRestitution;
      ball.vx *= 0.88;
      ball.angularVelocity = -ball.vx * 0.05;
      ball.bounceCount++;

      // Small bounce threshold to rest
      if (Math.abs(ball.vy) < 40) {
        ball.vy = 0;
      }
    }
  }

  // Left and Right bounds
  handleWallCollisions(ball) {
    // Left boundary
    if (ball.x - ball.radius <= 10) {
      ball.x = 10 + ball.radius;
      ball.vx = -ball.vx * 0.6;
    }
    // Right boundary
    if (ball.x + ball.radius >= 1070) {
      ball.x = 1070 - ball.radius;
      ball.vx = -ball.vx * 0.6;
    }
    // Ceiling boundary
    if (ball.y - ball.radius <= 10) {
      ball.y = 10 + ball.radius;
      ball.vy = Math.abs(ball.vy) * 0.6;
    }
  }

  // Backboard collision (glass/wood backboard)
  handleBackboardCollision(ball) {
    const bb = this.hoop;
    const bbX = bb.backboardX;
    const bbTop = bb.backboardTopY;
    const bbBottom = bb.backboardBottomY;
    const bbW = bb.backboardWidth;

    // Closest point on backboard rectangle to ball center
    const closestX = Math.max(bbX, Math.min(ball.x, bbX + bbW));
    const closestY = Math.max(bbTop, Math.min(ball.y, bbBottom));

    const dx = ball.x - closestX;
    const dy = ball.y - closestY;
    const distSq = dx * dx + dy * dy;

    if (distSq < ball.radius * ball.radius) {
      const dist = Math.sqrt(distSq) || 0.001;
      const nx = dx / dist;
      const ny = dy / dist;

      // Position correction
      ball.x = closestX + nx * ball.radius;
      ball.y = closestY + ny * ball.radius;

      // Reflect velocity
      const dot = ball.vx * nx + ball.vy * ny;
      if (dot < 0) {
        const restitution = this.cfg.backboardRestitution;
        ball.vx = (ball.vx - (1 + restitution) * dot * nx);
        ball.vy = (ball.vy - (1 + restitution) * dot * ny);

        ball.angularVelocity += -ball.vy * 0.04;
        ball.touchedBackboard = true;
        window.soundEngine.playBackboard(Math.abs(dot) / 600);
      }
    }
  }

  // Left & Right Rim edge collision
  handleRimCollisions(ball) {
    const leftPeg = { x: this.hoop.rimLeftX, y: this.hoop.rimY, r: this.hoop.rimRadius };
    const rightPeg = { x: this.hoop.rimRightX, y: this.hoop.rimY, r: this.hoop.rimRadius };

    this.checkCircleCollision(ball, leftPeg);
    this.checkCircleCollision(ball, rightPeg);
  }

  checkCircleCollision(ball, peg) {
    const dx = ball.x - peg.x;
    const dy = ball.y - peg.y;
    const distSq = dx * dx + dy * dy;
    const minDist = ball.radius + peg.r;

    if (distSq < minDist * minDist) {
      const dist = Math.sqrt(distSq) || 0.001;
      const nx = dx / dist;
      const ny = dy / dist;

      // Push ball out of rim
      ball.x = peg.x + nx * minDist;
      ball.y = peg.y + ny * minDist;

      // Reflect velocity
      const dot = ball.vx * nx + ball.vy * ny;
      if (dot < 0) {
        const restitution = this.cfg.rimRestitution;
        ball.vx = ball.vx - (1 + restitution) * dot * nx;
        ball.vy = ball.vy - (1 + restitution) * dot * ny;

        // Friction & spin change
        const tx = -ny;
        const ty = nx;
        const tanDot = ball.vx * tx + ball.vy * ty;
        ball.angularVelocity = tanDot * 0.03;

        ball.touchedRim = true;
        ball.isCleanShot = false;
        window.soundEngine.playRim();
      }
    }
  }

  // Check if ball went cleanly through the rim
  checkScore(ball, net, onScoreCallback) {
    if (ball.scoreTriggered || !ball.isShooting) return;

    const rimY = this.hoop.rimY;
    const leftX = this.hoop.rimLeftX;
    const rightX = this.hoop.rimRightX;

    // Crossed rim line from top to bottom
    if (ball.oldY <= rimY + 15 && ball.y >= rimY + 15) {
      // Must pass horizontally inside the rim boundaries
      if (ball.x > leftX + 15 && ball.x < rightX - 15 && ball.vy > 0) {
        ball.scoreTriggered = true;
        ball.hasScored = true;

        const isSwish = (!ball.touchedRim && !ball.touchedBackboard);

        // Deform net
        if (net) {
          net.swishSwirl(ball);
        }

        if (typeof onScoreCallback === 'function') {
          onScoreCallback({
            isSwish,
            points: isSwish ? this.cfg.swishScore : this.cfg.regularScore,
            ballX: ball.x,
            ballY: ball.y
          });
        }
      }
    }
  }

  // Predict parabolic trajectory for aiming guide
  getTrajectoryPath(startX, startY, vx, vy, steps = 38, dt = 0.026) {
    const points = [];
    let curX = startX;
    let curY = startY;
    let curVx = vx;
    let curVy = vy;

    for (let i = 0; i < steps; i++) {
      points.push({ x: curX, y: curY });
      curVy += this.gravity * dt;
      curVx *= Math.pow(this.airResistance, dt * 60);
      curVy *= Math.pow(this.airResistance, dt * 60);
      curX += curVx * dt;
      curY += curVy * dt;

      // Stop trajectory if hitting floor or backboard
      if (curY >= this.floorY || (curX > this.hoop.backboardX && curY > this.hoop.backboardTopY && curY < this.hoop.backboardBottomY)) {
        points.push({ x: curX, y: curY });
        break;
      }
    }

    return points;
  }
}

window.BasketballPhysics = BasketballPhysics;

