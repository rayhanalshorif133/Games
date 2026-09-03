/**
 * Construct 3 HTML5 Runtime Architecture Emulation
 * Provides the core game loop, object lifecycle, perspective projection, and particle effects.
 */

// Global constant resolution (Mobile Portrait: 1080 x 1920)
const GAME_WIDTH = 1080;
const GAME_HEIGHT = 1920;

// Game State Enum
const GameState = {
  MENU: 'MENU',
  PLAYING: 'PLAYING',
  PAUSED: 'PAUSED',
  GAMEOVER: 'GAMEOVER'
};

/**
 * 2.5D Perspective Projector
 * Maps lane (-1, 0, 1) or X position, Z depth (from 0 near player to 2000 at horizon), and Y height
 * to 2D screen coordinates on the 1080x1920 canvas.
 */
class PerspectiveCamera {
  constructor() {
    this.horizonY = 680;      // Horizon line Y in 1080x1920 space
    this.playerBaseY = 1620;   // Player baseline near bottom
    this.laneSpacing = 280;    // Width between lanes at player level
    this.fov = 700;            // Camera FOV depth scale
    this.maxZ = 2400;          // Fog / clipping distance
  }

  /**
   * Project a 3D coordinate (laneX, y, z) into screen (screenX, screenY, scale)
   * laneX: -1 (left), 0 (center), 1 (right) or smooth float between them
   * y: height above ground (positive is UP)
   * z: distance ahead of player (0 is at player, > 0 is further into distance)
   */
  project(laneX, y, z) {
    if (z < -100) return null; // Behind camera
    const clampedZ = Math.max(z, 1);
    const scale = this.fov / (clampedZ + this.fov);

    const centerX = GAME_WIDTH / 2;
    // Ground Y at this depth
    const groundY = this.horizonY + (this.playerBaseY - this.horizonY) * scale;
    // Lateral offset at this depth
    const screenX = centerX + (laneX * this.laneSpacing) * scale;
    // Elevation (y is up, so subtract)
    const screenY = groundY - y * scale;

    return {
      x: screenX,
      y: screenY,
      groundY: groundY,
      scale: scale,
      visible: z >= 0 && z <= this.maxZ
    };
  }
}

/**
 * Particle System for Sparks, Dust, Explosions, Speed Trails
 */
class ParticleSystem {
  constructor() {
    this.particles = [];
  }

  emit(options) {
    const count = options.count || 1;
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: options.x,
        y: options.y,
        vx: (options.vx || 0) + (Math.random() - 0.5) * (options.spreadX || 0),
        vy: (options.vy || 0) + (Math.random() - 0.5) * (options.spreadY || 0),
        color: options.color || '#00f0ff',
        size: options.size || 8,
        life: 1.0,
        decay: options.decay || (0.02 + Math.random() * 0.03),
        shape: options.shape || 'circle', // 'circle' | 'spark' | 'ring'
        gravity: options.gravity !== undefined ? options.gravity : 0.3
      });
    }
  }

  update(dt) {
    const rate = dt * 60;
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * rate;
      p.y += p.vy * rate;
      p.vy += p.gravity * rate;
      p.life -= p.decay * rate;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  draw(ctx) {
    ctx.save();
    for (const p of this.particles) {
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.color;
      ctx.strokeStyle = p.color;

      if (p.shape === 'circle') {
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(1, p.size * p.life), 0, Math.PI * 2);
        ctx.fill();
      } else if (p.shape === 'spark') {
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - p.vx * 2, p.y - p.vy * 2);
        ctx.lineWidth = p.size * p.life;
        ctx.stroke();
      } else if (p.shape === 'ring') {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (1.8 - p.life * 0.8), 0, Math.PI * 2);
        ctx.lineWidth = 4 * p.life;
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  clear() {
    this.particles = [];
  }
}

/**
 * Construct 3 Runtime Core
 */
class C3Runtime {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false });
    this.camera = new PerspectiveCamera();
    this.particles = new ParticleSystem();

    this.state = GameState.MENU;
    this.lastTime = 0;
    this.dt = 0;
    this.timeScale = 1.0;

    // Score & Stats
    this.score = 0;
    this.coins = 0;
    this.distance = 0;
    this.highScore = 0;

    // Game Speed
    this.baseSpeed = 1200; // Units per second
    this.currentSpeed = this.baseSpeed;
    this.maxSpeed = 2800;

    // Load Highscore
    try {
      this.highScore = parseInt(localStorage.getItem('cyberrunner_highscore') || '0', 10);
    } catch (e) {
      this.highScore = 0;
    }

    // References to subsystems
    this.world = null;
    this.player = null;
    this.obstacleManager = null;
    this.collectibleManager = null;
    this.ui = null;
  }

  setSubsystems(world, player, obstacleManager, collectibleManager, ui) {
    this.world = world;
    this.player = player;
    this.obstacleManager = obstacleManager;
    this.collectibleManager = collectibleManager;
    this.ui = ui;
  }

  start() {
    this.lastTime = performance.now();
    requestAnimationFrame((t) => this.tick(t));
  }

  startGame() {
    this.state = GameState.PLAYING;
    this.score = 0;
    this.coins = 0;
    this.distance = 0;
    this.currentSpeed = this.baseSpeed;
    this.particles.clear();

    if (this.player) this.player.reset();
    if (this.world) this.world.reset();
    if (this.obstacleManager) this.obstacleManager.reset();
    if (this.collectibleManager) this.collectibleManager.reset();

    if (window.soundEngine) {
      window.soundEngine.startBgm();
    }
  }

  pauseGame() {
    if (this.state === GameState.PLAYING) {
      this.state = GameState.PAUSED;
    } else if (this.state === GameState.PAUSED) {
      this.state = GameState.PLAYING;
      this.lastTime = performance.now();
    }
  }

  gameOver() {
    if (this.state === GameState.GAMEOVER) return;
    this.state = GameState.GAMEOVER;

    if (this.score > this.highScore) {
      this.highScore = Math.floor(this.score);
      try {
        localStorage.setItem('cyberrunner_highscore', this.highScore.toString());
      } catch (e) {}
    }

    if (window.soundEngine) {
      window.soundEngine.stopBgm();
      window.soundEngine.playCrash();
    }

    // Camera shake & explosion particles
    const pPos = this.player ? this.camera.project(this.player.laneX, this.player.y, 0) : null;
    if (pPos) {
      this.particles.emit({
        x: pPos.x,
        y: pPos.y - 80,
        count: 50,
        color: '#ff0077',
        spreadX: 18,
        spreadY: 18,
        size: 14,
        decay: 0.02
      });
      this.particles.emit({
        x: pPos.x,
        y: pPos.y - 80,
        count: 40,
        color: '#00f0ff',
        spreadX: 14,
        spreadY: 14,
        size: 10,
        decay: 0.025
      });
    }
  }

  tick(currentTime) {
    // Delta time calculation clamped to 1/15s to prevent simulation explosions
    let rawDt = (currentTime - this.lastTime) / 1000;
    if (rawDt > 0.066) rawDt = 0.066;
    this.dt = rawDt * this.timeScale;
    this.lastTime = currentTime;

    this.update(this.dt);
    this.render();

    requestAnimationFrame((t) => this.tick(t));
  }

  update(dt) {
    if (this.state === GameState.PLAYING) {
      // Speed increases gradually over distance
      this.currentSpeed = Math.min(this.maxSpeed, this.baseSpeed + this.distance * 0.08);

      // Jetpack / Boost Power-up multiplier
      let effectiveSpeed = this.currentSpeed;
      if (this.player && this.player.isBoosting) {
        effectiveSpeed *= 1.8;
      }

      const deltaDistance = (effectiveSpeed * dt) / 50;
      this.distance += deltaDistance;

      // Score based on distance & 2x multiplier
      const scoreMultiplier = (this.player && this.player.is2x) ? 2 : 1;
      this.score += deltaDistance * scoreMultiplier * 10;

      // Subsystem updates
      if (this.world) this.world.update(dt, effectiveSpeed);
      if (this.player) this.player.update(dt);
      if (this.obstacleManager) this.obstacleManager.update(dt, effectiveSpeed);
      if (this.collectibleManager) this.collectibleManager.update(dt, effectiveSpeed, this.player);

      // Collision checks
      this.checkCollisions();
    } else if (this.state === GameState.MENU) {
      // Idle world background motion in menu
      if (this.world) this.world.update(dt, 500);
      if (this.player) this.player.updateIdle(dt);
    }

    this.particles.update(dt);
  }

  checkCollisions() {
    if (!this.player || this.player.isDead) return;

    // Check Collectibles
    if (this.collectibleManager) {
      this.collectibleManager.checkCollisions(this.player, (type, value) => {
        if (type === 'coin') {
          const mult = this.player.is2x ? 2 : 1;
          this.coins += 1 * mult;
          this.score += 50 * mult;
          if (window.soundEngine) window.soundEngine.playCoin();

          // Particle burst
          const proj = this.camera.project(this.player.laneX, this.player.y + 70, 0);
          if (proj) {
            this.particles.emit({
              x: proj.x,
              y: proj.y,
              count: 8,
              color: '#ffd700',
              spreadX: 8,
              spreadY: 8,
              size: 8,
              shape: 'circle',
              decay: 0.04
            });
          }
        } else if (type === 'powerup') {
          this.player.activatePowerup(value);
          if (window.soundEngine) window.soundEngine.playPowerup();

          // Powerup particle ring
          const proj = this.camera.project(this.player.laneX, this.player.y + 70, 0);
          if (proj) {
            this.particles.emit({
              x: proj.x,
              y: proj.y,
              count: 2,
              color: '#00f0ff',
              size: 40,
              shape: 'ring',
              decay: 0.03
            });
          }
        }
      });
    }

    // Check Obstacles
    if (this.obstacleManager && !this.player.isBoosting) {
      const hit = this.obstacleManager.checkCollision(this.player);
      if (hit) {
        if (this.player.isShielded) {
          // Shield absorbs hit
          this.player.isShielded = false;
          if (window.soundEngine) window.soundEngine.playShieldBreak();
          const proj = this.camera.project(this.player.laneX, this.player.y + 70, 0);
          if (proj) {
            this.particles.emit({
              x: proj.x,
              y: proj.y,
              count: 25,
              color: '#00f0ff',
              spreadX: 12,
              spreadY: 12,
              size: 10,
              decay: 0.03
            });
          }
          // Remove the obstacle so player doesn't instantly re-collide
          hit.active = false;
        } else {
          // Fatal hit
          this.player.die();
          this.gameOver();
        }
      }
    }
  }

  render() {
    const ctx = this.ctx;

    // Clear Screen
    ctx.fillStyle = '#070b19';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Render World (Parallax skyline, grid, road)
    if (this.world) this.world.draw(ctx, this.camera);

    // Render Obstacles & Collectibles sorted by Depth (Z distance)
    const renderables = [];

    if (this.obstacleManager) {
      renderables.push(...this.obstacleManager.getRenderables());
    }
    if (this.collectibleManager) {
      renderables.push(...this.collectibleManager.getRenderables());
    }

    // Add Player to depth list
    if (this.player) {
      renderables.push({
        z: 0,
        render: (c, cam) => this.player.draw(c, cam)
      });
    }

    // Sort far to near (descending Z)
    renderables.sort((a, b) => b.z - a.z);

    // Draw all objects
    for (const obj of renderables) {
      obj.render(ctx, this.camera);
    }

    // Render Particles
    this.particles.draw(ctx);

    // Speed Lines Effect during Boost
    if (this.player && this.player.isBoosting) {
      this.drawSpeedLines(ctx);
    }

    // Render UI Overlay
    if (this.ui) this.ui.draw(ctx, this);
  }

  drawSpeedLines(ctx) {
    ctx.save();
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
    ctx.lineWidth = 4;
    const count = 12;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + Math.random() * 0.1;
      const r1 = 300 + Math.random() * 200;
      const r2 = 900 + Math.random() * 200;
      const cx = GAME_WIDTH / 2;
      const cy = this.camera.horizonY;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(angle) * r1, cy + Math.sin(angle) * r1);
      ctx.lineTo(cx + Math.cos(angle) * r2, cy + Math.sin(angle) * r2);
      ctx.stroke();
    }
    ctx.restore();
  }
}

window.C3Runtime = C3Runtime;
window.PerspectiveCamera = PerspectiveCamera;
window.GameState = GameState;

