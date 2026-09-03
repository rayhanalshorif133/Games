/**
 * Bubble Shooter Cannon & Ballistic Physics Engine
 * Handles precision angle clamping, multi-bounce trajectory raycasting,
 * pneumatic launching, wall ricochets, and tactical ball swapping.
 */
class Shooter {
  constructor(config, grid) {
    this.config = config;
    this.grid = grid;
    this.x = config.shooterX || 540;
    this.y = config.shooterY || 1700;
    this.radius = config.bubbleRadius || 48;
    this.speed = config.bubbleSpeed || 2600;

    // Minimum & maximum aiming angles (in radians: upward arc)
    // -Math.PI / 2 is straight up (90 deg). We clamp between ~15° and ~165°
    this.minAngle = -Math.PI + (15 * Math.PI / 180); // ~ -165 deg
    this.maxAngle = -(15 * Math.PI / 180);           // ~ -15 deg
    this.angle = -Math.PI / 2; // Straight up

    this.currentBubble = null;
    this.nextBubble = null;
    this.activeBullet = null;
    this.trajectoryPoints = [];

    this.recoil = 0;
    this.barrelLength = 110;
    this.isAiming = false;

    this.initBubbles();
  }

  getRandomColor() {
    // Prefer colors currently present on the board
    const activeColors = this.grid.getActiveColors();
    if (activeColors.length > 0 && Math.random() < 0.85) {
      return activeColors[Math.floor(Math.random() * activeColors.length)];
    }
    const colors = this.config.colors;
    return colors[Math.floor(Math.random() * colors.length)].id;
  }

  generateBubble(forceNormal = false) {
    const colorId = this.getRandomColor();
    let type = 'normal';

    if (!forceNormal) {
      const rand = Math.random();
      if (rand < this.config.specialBubbles.bombChance * 0.7) {
        type = 'bomb';
      } else if (rand < (this.config.specialBubbles.bombChance + this.config.specialBubbles.rainbowChance) * 0.7) {
        type = 'rainbow';
      }
    }

    return {
      colorId: type === 'rainbow' ? 'rainbow' : (type === 'bomb' ? 'bomb' : colorId),
      type: type,
      radius: this.radius,
      scale: 1
    };
  }

  initBubbles() {
    this.currentBubble = this.generateBubble(true);
    this.nextBubble = this.generateBubble();
    this.isAiming = false;
    this.calculateTrajectory();
  }

  setAimTarget(targetX, targetY) {
    const dx = targetX - this.x;
    const dy = targetY - this.y;

    // Only allow aiming upwards
    if (dy < -20) {
      let desiredAngle = Math.atan2(dy, dx);
      // Clamp to allowed range
      if (desiredAngle < this.minAngle) desiredAngle = this.minAngle;
      if (desiredAngle > this.maxAngle) desiredAngle = this.maxAngle;
      this.angle = desiredAngle;
      this.calculateTrajectory();
    }
  }

  /**
   * Performs multi-bounce raycast simulating the bullet's exact trajectory
   */
  calculateTrajectory() {
    this.trajectoryPoints = [];
    let curX = this.x + Math.cos(this.angle) * this.barrelLength;
    let curY = this.y + Math.sin(this.angle) * this.barrelLength;
    let dirX = Math.cos(this.angle);
    let dirY = Math.sin(this.angle);

    this.trajectoryPoints.push({ x: curX, y: curY });

    const minX = this.grid.sidePadding + this.radius;
    const maxX = this.grid.canvasWidth - this.grid.sidePadding - this.radius;
    const step = 20;
    const maxSteps = 150;
    let bounces = 0;

    for (let i = 0; i < maxSteps; i++) {
      curX += dirX * step;
      curY += dirY * step;

      // Wall Bounce Check
      if (curX <= minX) {
        curX = minX;
        dirX = -dirX;
        bounces++;
        this.trajectoryPoints.push({ x: curX, y: curY });
        if (bounces > 2) break;
      } else if (curX >= maxX) {
        curX = maxX;
        dirX = -dirX;
        bounces++;
        this.trajectoryPoints.push({ x: curX, y: curY });
        if (bounces > 2) break;
      }

      // Ceiling Collision Check
      if (curY <= this.grid.ceilingY + this.radius) {
        this.trajectoryPoints.push({ x: curX, y: curY });
        break;
      }

      // Grid Bubble Collision Check
      let collided = false;
      const collisionDistSq = Math.pow(this.radius * 1.85, 2);

      for (let r = 0; r < this.grid.rows; r++) {
        const cols = this.grid.getColsInRow(r);
        for (let c = 0; c < cols; c++) {
          const b = this.grid.grid[r][c];
          if (b) {
            const distSq = Math.pow(curX - b.x, 2) + Math.pow(curY - b.y, 2);
            if (distSq <= collisionDistSq) {
              collided = true;
              break;
            }
          }
        }
        if (collided) break;
      }

      if (collided) {
        this.trajectoryPoints.push({ x: curX, y: curY });
        break;
      }
    }
  }

  canShoot() {
    return !this.activeBullet;
  }

  shoot() {
    if (!this.canShoot()) return false;
    this.isAiming = false;

    const barrelX = this.x + Math.cos(this.angle) * this.barrelLength;
    const barrelY = this.y + Math.sin(this.angle) * this.barrelLength;

    this.activeBullet = {
      x: barrelX,
      y: barrelY,
      vx: Math.cos(this.angle) * this.speed,
      vy: Math.sin(this.angle) * this.speed,
      radius: this.radius,
      colorId: this.currentBubble.colorId,
      type: this.currentBubble.type,
      scale: 1,
      rotation: 0
    };

    // Recoil spring kickback
    this.recoil = 22;

    // Load next bubble
    this.currentBubble = this.nextBubble;
    this.nextBubble = this.generateBubble();

    // Recalculate trajectory
    this.calculateTrajectory();

    if (window.soundEngine) {
      window.soundEngine.playShoot();
    }

    return true;
  }

  swapBubbles() {
    if (!this.canShoot()) return false;
    const temp = this.currentBubble;
    this.currentBubble = this.nextBubble;
    this.nextBubble = temp;
    this.calculateTrajectory();

    if (window.soundEngine) {
      window.soundEngine.playSwap();
    }
    return true;
  }

  update(dt) {
    // Spring recoil recovery
    if (this.recoil > 0) {
      this.recoil = Math.max(0, this.recoil - 140 * dt);
    }

    if (!this.activeBullet) return null;

    const b = this.activeBullet;
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    b.rotation += 4 * dt;

    const minX = this.grid.sidePadding + this.radius;
    const maxX = this.grid.canvasWidth - this.grid.sidePadding - this.radius;

    // Left wall ricochet
    if (b.x <= minX) {
      b.x = minX;
      b.vx = Math.abs(b.vx);
      if (window.soundEngine) window.soundEngine.playBounce();
    }
    // Right wall ricochet
    else if (b.x >= maxX) {
      b.x = maxX;
      b.vx = -Math.abs(b.vx);
      if (window.soundEngine) window.soundEngine.playBounce();
    }

    // Top ceiling collision
    if (b.y <= this.grid.ceilingY + this.radius) {
      b.y = this.grid.ceilingY + this.radius;
      const snapped = this.grid.snapBullet(b);
      const bulletRef = this.activeBullet;
      this.activeBullet = null;
      return { bullet: bulletRef, snapped: snapped, hitCeiling: true };
    }

    // Collision with any grid bubble
    const hitRadiusSq = Math.pow(this.radius * 1.82, 2);
    for (let r = 0; r < this.grid.rows; r++) {
      const cols = this.grid.getColsInRow(r);
      for (let c = 0; c < cols; c++) {
        const gb = this.grid.grid[r][c];
        if (gb) {
          const distSq = Math.pow(b.x - gb.x, 2) + Math.pow(b.y - gb.y, 2);
          if (distSq <= hitRadiusSq) {
            // Collision detected! Snap to closest empty cell
            const snapped = this.grid.snapBullet(b);
            const bulletRef = this.activeBullet;
            this.activeBullet = null;
            return { bullet: bulletRef, snapped: snapped, hitCeiling: false };
          }
        }
      }
    }

    // Safety bounds check
    if (b.y < -100 || b.y > this.config.canvasHeight + 100) {
      this.activeBullet = null;
    }

    return null;
  }
}

window.Shooter = Shooter;

