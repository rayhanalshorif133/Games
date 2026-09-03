/**
 * Retro Space Invaders - Alien Swarm & UFO Module
 * 
 * Manages the 55-invader marching grid, frame animations, step acceleration,
 * projectile bomb attacks, and the Mystery Flying Saucer (UFO).
 */

class AlienSwarm {
  constructor(gameWidth = 800, gameHeight = 900) {
    this.gameWidth = gameWidth;
    this.gameHeight = gameHeight;
    this.rows = 5;
    this.cols = 11;
    this.aliens = [];
    this.bombs = [];

    // Swarm positioning & movement
    this.direction = 1; // 1 = right, -1 = left
    this.stepDownY = 18;
    this.stepTimer = 0;
    this.animFrame = 0; // 0 or 1
    this.startX = 60;
    this.startY = 120;
    this.colSpacing = 52;
    this.rowSpacing = 42;

    // UFO / Flying Saucer
    this.ufo = null;
    this.ufoTimer = 0;
    this.ufoInterval = 900; // ~15 seconds at 60fps
    this.ufoPoints = [50, 100, 150, 300];

    // Bomb dropping
    this.bombCooldown = 60;
    this.maxConcurrentBombs = 3;

    // Sprite Pixel Matrices
    this._initSpriteBitmaps();
  }

  reset(wave = 1) {
    this.aliens = [];
    this.bombs = [];
    this.direction = 1;
    this.animFrame = 0;
    this.stepTimer = 0;
    this.ufo = null;
    this.ufoTimer = Math.floor(this.ufoInterval * (0.6 + Math.random() * 0.4));

    // Dynamic wave difficulty
    // Starting height drops slightly on higher waves (up to wave 6)
    const waveOffset = Math.min(120, (wave - 1) * 20);
    this.currentStartY = this.startY + waveOffset;
    this.baseStepInterval = Math.max(28, 48 - (wave - 1) * 3);
    this.maxConcurrentBombs = Math.min(6, 3 + Math.floor(wave / 2));
    this.bombSpeed = 4.2 + Math.min(2.5, wave * 0.3);

    // Populate 5 rows of 11 aliens
    // Row 0: Squid (30 pts, Cyan)
    // Row 1-2: Crab (20 pts, Pink/Magenta)
    // Row 3-4: Octopus (10 pts, Yellow/Green)
    for (let r = 0; r < this.rows; r++) {
      let type, points, color;
      if (r === 0) {
        type = 'squid';
        points = 30;
        color = '#38bdf8'; // Electric Cyan
      } else if (r === 1 || r === 2) {
        type = 'crab';
        points = 20;
        color = '#f43f5e'; // Hot Pink
      } else {
        type = 'octopus';
        points = 10;
        color = '#a3e635'; // Lime Green
      }

      for (let c = 0; c < this.cols; c++) {
        const x = this.startX + c * this.colSpacing;
        const y = this.currentStartY + r * this.rowSpacing;
        this.aliens.push({
          row: r,
          col: c,
          x: x,
          y: y,
          width: 36,
          height: 26,
          type: type,
          points: points,
          color: color,
          alive: true
        });
      }
    }
  }

  getAliveCount() {
    return this.aliens.filter(a => a.alive).length;
  }

  /**
   * Calculates dynamic step speed based on remaining aliens
   * Reaches maximum tempo (2 frames/step) when 1 alien remains!
   */
  getStepInterval() {
    const alive = this.getAliveCount();
    if (alive <= 1) return 2;
    if (alive <= 3) return 4;
    if (alive <= 6) return 7;
    if (alive <= 12) return 12;
    if (alive <= 25) return 20;
    if (alive <= 40) return 32;
    return this.baseStepInterval;
  }

  /**
   * Update alien march step, UFO movement, and bomb trajectories
   */
  update(dt = 1, soundEngine = null, particles = null) {
    const aliveAliens = this.aliens.filter(a => a.alive);
    if (aliveAliens.length === 0) return { waveCleared: true };

    let stepOccurred = false;
    this.stepTimer += dt;
    const interval = this.getStepInterval();

    if (this.stepTimer >= interval) {
      this.stepTimer = 0;
      this.animFrame = 1 - this.animFrame;
      stepOccurred = true;

      if (soundEngine) {
        soundEngine.playMarchStep();
      }

      // Check if any alien reaches border
      let hitBorder = false;
      const stepX = 12 * this.direction;

      for (const a of aliveAliens) {
        const nextX = a.x + stepX;
        if (nextX <= 24 || nextX + a.width >= this.gameWidth - 24) {
          hitBorder = true;
          break;
        }
      }

      if (hitBorder) {
        // Shift all down and reverse
        this.direction *= -1;
        for (const a of aliveAliens) {
          a.y += this.stepDownY;
        }
      } else {
        // Move horizontally
        for (const a of aliveAliens) {
          a.x += stepX;
        }
      }
    }

    // Check if aliens landed on player line (Invasion successful -> Game Over)
    let invasionLanded = false;
    for (const a of aliveAliens) {
      if (a.y + a.height >= this.gameHeight - 110) {
        invasionLanded = true;
        break;
      }
    }

    // Update UFO
    this.updateUfo(dt, soundEngine, particles);

    // Update Bombs
    this.updateBombs(dt, soundEngine, aliveAliens);

    return {
      stepOccurred: stepOccurred,
      invasionLanded: invasionLanded,
      waveCleared: false
    };
  }

  /**
   * UFO Saucer spawn & move
   */
  updateUfo(dt, soundEngine, particles) {
    if (!this.ufo) {
      this.ufoTimer -= dt;
      if (this.ufoTimer <= 0) {
        // Spawn UFO
        const fromLeft = Math.random() > 0.5;
        this.ufo = {
          x: fromLeft ? -56 : this.gameWidth + 10,
          y: 62,
          width: 52,
          height: 22,
          vx: fromLeft ? 2.6 : -2.6,
          alive: true
        };
        this.ufoTimer = Math.floor(this.ufoInterval * (0.8 + Math.random() * 0.5));
        if (soundEngine) {
          soundEngine.startUfo();
        }
      }
    } else {
      this.ufo.x += this.ufo.vx * dt;
      // Exit screen bounds
      if (
        (this.ufo.vx > 0 && this.ufo.x > this.gameWidth + 20) ||
        (this.ufo.vx < 0 && this.ufo.x < -60)
      ) {
        if (soundEngine) {
          soundEngine.stopUfo();
        }
        this.ufo = null;
      }
    }
  }

  /**
   * Aliens dropping bombs
   */
  updateBombs(dt, soundEngine, aliveAliens) {
    this.bombCooldown -= dt;

    if (this.bombCooldown <= 0 && this.bombs.length < this.maxConcurrentBombs && aliveAliens.length > 0) {
      this.bombCooldown = 35 + Math.floor(Math.random() * 45);

      // Find bottom-most alien in a random active column
      const colMap = {};
      for (const a of aliveAliens) {
        if (!colMap[a.col] || colMap[a.col].row < a.row) {
          colMap[a.col] = a;
        }
      }

      const activeShooters = Object.values(colMap);
      if (activeShooters.length > 0) {
        const shooter = activeShooters[Math.floor(Math.random() * activeShooters.length)];
        const bombTypes = ['squiggly', 'rolling', 'plunger'];
        const chosenType = bombTypes[Math.floor(Math.random() * bombTypes.length)];

        this.bombs.push({
          x: shooter.x + shooter.width / 2,
          y: shooter.y + shooter.height + 2,
          width: 6,
          height: 14,
          vy: this.bombSpeed,
          type: chosenType,
          frame: 0,
          isPlayer: false
        });

        if (soundEngine) {
          soundEngine.playAlienShoot();
        }
      }
    }

    // Move bombs
    for (let i = this.bombs.length - 1; i >= 0; i--) {
      const b = this.bombs[i];
      b.y += b.vy * dt;
      b.frame += 0.2 * dt;

      if (b.y > this.gameHeight - 30) {
        this.bombs.splice(i, 1);
      }
    }
  }

  /**
   * Collision check: Player Laser vs Aliens
   */
  checkLaserCollisions(lasers, particles, soundEngine) {
    let scoreGained = 0;
    let alienKilled = false;

    for (let lIdx = lasers.length - 1; lIdx >= 0; lIdx--) {
      const laser = lasers[lIdx];
      let laserRemoved = false;

      // Check UFO hit
      if (this.ufo && this.ufo.alive) {
        if (
          laser.x >= this.ufo.x &&
          laser.x <= this.ufo.x + this.ufo.width &&
          laser.y >= this.ufo.y &&
          laser.y <= this.ufo.y + this.ufo.height
        ) {
          const reward = this.ufoPoints[Math.floor(Math.random() * this.ufoPoints.length)];
          scoreGained += reward;
          this.ufo.alive = false;

          if (particles) {
            particles.createExplosion(this.ufo.x + this.ufo.width / 2, this.ufo.y + this.ufo.height / 2, '#ef4444', 32, 5.0);
            particles.addFloatingScore(`+${reward}`, this.ufo.x + this.ufo.width / 2, this.ufo.y, '#ef4444');
          }
          if (soundEngine) {
            soundEngine.playUfoHit();
          }

          this.ufo = null;
          lasers.splice(lIdx, 1);
          laserRemoved = true;
          return { scoreGained, alienKilled: false, ufoHit: true };
        }
      }

      if (laserRemoved) continue;

      // Check Aliens
      for (const a of this.aliens) {
        if (!a.alive) continue;

        if (
          laser.x >= a.x &&
          laser.x <= a.x + a.width &&
          laser.y >= a.y &&
          laser.y <= a.y + a.height
        ) {
          a.alive = false;
          scoreGained += a.points;
          alienKilled = true;

          if (particles) {
            particles.createExplosion(a.x + a.width / 2, a.y + a.height / 2, a.color, 18, 3.8);
            particles.addFloatingScore(`+${a.points}`, a.x + a.width / 2, a.y, a.color);
          }
          if (soundEngine) {
            soundEngine.playAlienExplosion();
          }

          lasers.splice(lIdx, 1);
          break;
        }
      }
    }

    return { scoreGained, alienKilled, ufoHit: false };
  }

  /**
   * Collision check: Alien Bombs vs Player Lasers (mid-air bullet collision)
   */
  checkBulletCollisions(lasers, particles) {
    for (let lIdx = lasers.length - 1; lIdx >= 0; lIdx--) {
      const laser = lasers[lIdx];
      for (let bIdx = this.bombs.length - 1; bIdx >= 0; bIdx--) {
        const bomb = this.bombs[bIdx];
        if (
          Math.abs(laser.x - bomb.x) < 8 &&
          Math.abs(laser.y - bomb.y) < 10
        ) {
          if (particles) {
            particles.createExplosion(bomb.x, bomb.y, '#ffffff', 8, 2.0);
          }
          lasers.splice(lIdx, 1);
          this.bombs.splice(bIdx, 1);
          break;
        }
      }
    }
  }

  /**
   * Render all living aliens, UFO, and dropping bombs
   */
  draw(ctx) {
    // UFO
    if (this.ufo && this.ufo.alive) {
      this.drawUfo(ctx, this.ufo.x, this.ufo.y, this.ufo.width, this.ufo.height);
    }

    // Aliens
    for (const a of this.aliens) {
      if (!a.alive) continue;
      this.drawAlien(ctx, a, this.animFrame);
    }

    // Bombs
    for (const b of this.bombs) {
      this.drawBomb(ctx, b);
    }
  }

  drawAlien(ctx, alien, frameIdx) {
    const spriteMatrix = this.sprites[alien.type][frameIdx];
    const cols = spriteMatrix[0].length;
    const rows = spriteMatrix.length;
    const pxW = alien.width / cols;
    const pxH = alien.height / rows;

    ctx.fillStyle = alien.color;
    ctx.shadowColor = alien.color;
    ctx.shadowBlur = 4;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (spriteMatrix[r][c] === '1') {
          ctx.fillRect(
            Math.floor(alien.x + c * pxW),
            Math.floor(alien.y + r * pxH),
            Math.ceil(pxW),
            Math.ceil(pxH)
          );
        }
      }
    }
    ctx.shadowBlur = 0;
  }

  drawUfo(ctx, x, y, w, h) {
    const matrix = this.sprites.ufo;
    const cols = matrix[0].length;
    const rows = matrix.length;
    const pxW = w / cols;
    const pxH = h / rows;

    ctx.fillStyle = '#ef4444'; // Radiant bright red
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 8;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (matrix[r][c] === '1') {
          ctx.fillRect(
            Math.floor(x + c * pxW),
            Math.floor(y + r * pxH),
            Math.ceil(pxW),
            Math.ceil(pxH)
          );
        }
      }
    }
    ctx.shadowBlur = 0;
  }

  drawBomb(ctx, bomb) {
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 6;

    const frame = Math.floor(bomb.frame) % 2;
    const x = Math.floor(bomb.x);
    const y = Math.floor(bomb.y);

    if (bomb.type === 'squiggly') {
      // Classic zigzag
      ctx.fillStyle = '#fbbf24';
      if (frame === 0) {
        ctx.fillRect(x - 2, y, 4, 3);
        ctx.fillRect(x, y + 3, 4, 4);
        ctx.fillRect(x - 3, y + 7, 4, 4);
        ctx.fillRect(x - 1, y + 11, 4, 3);
      } else {
        ctx.fillRect(x, y, 4, 3);
        ctx.fillRect(x - 3, y + 3, 4, 4);
        ctx.fillRect(x + 1, y + 7, 4, 4);
        ctx.fillRect(x - 2, y + 11, 4, 3);
      }
    } else if (bomb.type === 'rolling') {
      // Rolling cross
      ctx.fillStyle = '#ec4899';
      if (frame === 0) {
        ctx.fillRect(x - 1, y, 2, 14);
        ctx.fillRect(x - 3, y + 5, 6, 4);
      } else {
        ctx.fillRect(x - 3, y + 2, 6, 3);
        ctx.fillRect(x - 1, y + 5, 2, 8);
      }
    } else {
      // Plunger
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(x - 1, y, 2, 14);
      ctx.fillRect(x - 3, y + (frame === 0 ? 3 : 8), 6, 3);
    }

    ctx.shadowBlur = 0;
  }

  /**
   * Pixel matrices for all authentic 1978 Space Invaders sprites
   */
  _initSpriteBitmaps() {
    this.sprites = {
      // Squid (Row 0) - 8x8
      squid: [
        [
          "00011000",
          "00111100",
          "01111110",
          "11011011",
          "11111111",
          "00100100",
          "01011010",
          "10100101"
        ],
        [
          "00011000",
          "00111100",
          "01111110",
          "11011011",
          "11111111",
          "01011010",
          "10000001",
          "01000010"
        ]
      ],

      // Crab (Row 1-2) - 11x8
      crab: [
        [
          "00100000100",
          "00010001000",
          "00111111100",
          "01101110110",
          "11111111111",
          "10111111101",
          "10100000101",
          "00011011000"
        ],
        [
          "00100000100",
          "10010001001",
          "10111111101",
          "11101110111",
          "11111111111",
          "01111111110",
          "00100000100",
          "01000000010"
        ]
      ],

      // Octopus (Row 3-4) - 12x8
      octopus: [
        [
          "000011110000",
          "011111111110",
          "111111111111",
          "111001100111",
          "111111111111",
          "000110011000",
          "001101101100",
          "110000000011"
        ],
        [
          "000011110000",
          "011111111110",
          "111111111111",
          "111001100111",
          "111111111111",
          "001100001100",
          "011011110110",
          "000100001000"
        ]
      ],

      // Mystery Saucer (UFO) - 16x7
      ufo: [
        "0000011111100000",
        "0001111111111000",
        "0011111111111100",
        "0110110110110110",
        "1111111111111111",
        "0011100110011100",
        "0001000000001000"
      ]
    };
  }
}

if (typeof window !== 'undefined') {
  window.AlienSwarm = AlienSwarm;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AlienSwarm;
}

