/**
 * Retro Space Invaders - Player Cannon Module
 * 
 * Handles the defender laser cannon, player movement, laser projectiles,
 * destruction animation, and life tracking.
 */

class Player {
  constructor(gameWidth = 800, gameHeight = 900) {
    this.gameWidth = gameWidth;
    this.gameHeight = gameHeight;
    this.width = 46;
    this.height = 26;
    this.speed = 5.2;

    this.reset();
  }

  reset() {
    this.x = this.gameWidth / 2 - this.width / 2;
    this.y = this.gameHeight - 80;
    this.vx = 0;
    this.lives = 3;
    this.maxLives = 6;
    this.lasers = [];
    this.maxConcurrentLasers = 1; // Authentic arcade tension
    this.isDead = false;
    this.isDying = false;
    this.deathTimer = 0;
    this.deathDuration = 80; // frames
    this.deathFrame = 0;
    this.invulnerableTimer = 0;
    this.extraLifeAwarded = false;
  }

  respawn() {
    this.x = this.gameWidth / 2 - this.width / 2;
    this.y = this.gameHeight - 80;
    this.vx = 0;
    this.isDying = false;
    this.isDead = false;
    this.deathTimer = 0;
    this.invulnerableTimer = 90; // ~1.5s invulnerability flash
  }

  moveLeft() {
    if (!this.isDying && !this.isDead) {
      this.vx = -this.speed;
    }
  }

  moveRight() {
    if (!this.isDying && !this.isDead) {
      this.vx = this.speed;
    }
  }

  stopMove() {
    this.vx = 0;
  }

  canShoot() {
    if (this.isDying || this.isDead) return false;
    return this.lasers.length < this.maxConcurrentLasers;
  }

  shoot() {
    if (!this.canShoot()) return null;

    const laser = {
      x: this.x + this.width / 2,
      y: this.y - 4,
      width: 4,
      height: 16,
      speed: 12.5,
      isPlayer: true
    };

    this.lasers.push(laser);
    return laser;
  }

  hit() {
    if (this.isDying || this.isDead || this.invulnerableTimer > 0) return false;
    this.isDying = true;
    this.deathTimer = this.deathDuration;
    this.lives--;
    return true;
  }

  update(dt = 1) {
    if (this.invulnerableTimer > 0) {
      this.invulnerableTimer -= dt;
    }

    if (this.isDying) {
      this.deathTimer -= dt;
      this.deathFrame = Math.floor((this.deathDuration - this.deathTimer) / 6);
      if (this.deathTimer <= 0) {
        this.isDying = false;
        if (this.lives <= 0) {
          this.isDead = true;
        } else {
          this.respawn();
        }
      }
      return;
    }

    // Position update with bounds constraint
    this.x += this.vx * dt;
    const minX = 16;
    const maxX = this.gameWidth - this.width - 16;
    if (this.x < minX) this.x = minX;
    if (this.x > maxX) this.x = maxX;

    // Update active lasers
    for (let i = this.lasers.length - 1; i >= 0; i--) {
      const l = this.lasers[i];
      l.y -= l.speed * dt;
      if (l.y + l.height < 40) {
        // Laser left screen
        this.lasers.splice(i, 1);
      }
    }
  }

  draw(ctx) {
    // Draw active plasma lasers
    ctx.fillStyle = '#00f0ff';
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 12;
    for (const l of this.lasers) {
      ctx.fillRect(l.x - l.width / 2, l.y, l.width, l.height);
      // Hot white core plasma beam
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(l.x - 1, l.y, 2, l.height);
      ctx.fillStyle = '#00f0ff';
    }
    ctx.shadowBlur = 0;

    if (this.isDead) return;

    // Invulnerability flash
    if (this.invulnerableTimer > 0 && Math.floor(this.invulnerableTimer / 8) % 2 === 0) {
      return;
    }

    if (this.isDying) {
      this.drawExplodingCannon(ctx);
    } else {
      this.drawCannon(ctx, this.x, this.y);
    }
  }

  /**
   * Modern Cyber Fighter Cannon
   */
  drawCannon(ctx, x, y) {
    ctx.fillStyle = '#00f0ff'; // Radiant Cyber Cyan
    ctx.shadowColor = 'rgba(0, 240, 255, 0.6)';
    ctx.shadowBlur = 10;

    // 13x8 classic pixel matrix
    const pixelMap = [
      "      █      ",
      "     ███     ",
      "     ███     ",
      " ███████████ ",
      "█████████████",
      "█████████████",
      "█████████████",
      "█████████████"
    ];

    const pixelW = this.width / 13;
    const pixelH = this.height / 8;

    for (let r = 0; r < pixelMap.length; r++) {
      const row = pixelMap[r];
      for (let c = 0; c < row.length; c++) {
        if (row[c] === '█') {
          ctx.fillRect(
            Math.floor(x + c * pixelW),
            Math.floor(y + r * pixelH),
            Math.ceil(pixelW),
            Math.ceil(pixelH)
          );
        }
      }
    }

    ctx.shadowBlur = 0;
  }

  /**
   * Classic crackling death explosion animation frames
   */
  drawExplodingCannon(ctx) {
    const x = this.x;
    const y = this.y;
    ctx.fillStyle = Math.random() > 0.5 ? '#22e650' : '#ef4444';

    // Two alternating glitch/destruction patterns
    const frameA = [
      "  █     █  █ ",
      " █ █   █ █   ",
      "    ███   █  ",
      " █ ██ ███  █ ",
      "██ █   █  ███",
      " █   ██   █  ",
      "  ██   ██    ",
      "█   █ █   █  "
    ];

    const frameB = [
      "   █   █     ",
      "  █ █   █ █  ",
      " █   ███   █ ",
      "  ██  █  ██  ",
      "██  ██ ██  ██",
      " █ █     █ █ ",
      "  █  ███  █  ",
      "   █     █   "
    ];

    const chosen = this.deathFrame % 2 === 0 ? frameA : frameB;
    const pixelW = this.width / 13;
    const pixelH = this.height / 8;

    for (let r = 0; r < chosen.length; r++) {
      const row = chosen[r];
      for (let c = 0; c < row.length; c++) {
        if (row[c] === '█') {
          ctx.fillRect(
            Math.floor(x + c * pixelW),
            Math.floor(y + r * pixelH),
            Math.ceil(pixelW),
            Math.ceil(pixelH)
          );
        }
      }
    }
  }
}

if (typeof window !== 'undefined') {
  window.Player = Player;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Player;
}

