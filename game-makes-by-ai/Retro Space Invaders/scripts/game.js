/**
 * Retro Space Invaders - Core Game Engine
 * 
 * Central coordinator for game state, collision detection, wave progression,
 * scoring rules, and render pipeline.
 */

class SpaceInvadersGame {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    // Virtual Internal Resolution (authentic crisp aspect ratio)
    this.width = 800;
    this.height = 900;
    this.canvas.width = this.width;
    this.canvas.height = this.height;

    // Subsystems
    this.sound = new SoundEngine();
    this.particles = new ParticleEngine(this.width, this.height);
    this.bunkers = new BunkersManager(this.width, this.height);
    this.player = new Player(this.width, this.height);
    this.swarm = new AlienSwarm(this.width, this.height);

    // Game States
    this.STATE = {
      MENU: 'MENU',
      PLAYING: 'PLAYING',
      PAUSED: 'PAUSED',
      WAVE_CLEAR: 'WAVE_CLEAR',
      GAME_OVER: 'GAME_OVER'
    };
    this.state = this.STATE.MENU;

    // Stats & Session Data
    this.score = 0;
    this.highScore = this.loadHighScore();
    this.wave = 1;
    this.aliensKilled = 0;
    this.ufoHits = 0;
    this.shotsFired = 0;
    this.startTime = 0;
    this.waveClearTimer = 0;

    // Callbacks for external UI bindings
    this.onScoreUpdate = null;
    this.onLivesUpdate = null;
    this.onWaveUpdate = null;
    this.onGameOverCallback = null;

    // Animation Loop
    this.lastTime = 0;
    this.isRunning = false;
  }

  loadHighScore() {
    if (typeof localStorage !== 'undefined') {
      return parseInt(localStorage.getItem('invaders_high_score') || '0', 10);
    }
    return 0;
  }

  saveHighScore() {
    if (this.score > this.highScore) {
      this.highScore = this.score;
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('invaders_high_score', this.highScore.toString());
      }
    }
  }

  startNewGame() {
    this.score = 0;
    this.wave = 1;
    this.aliensKilled = 0;
    this.ufoHits = 0;
    this.shotsFired = 0;
    this.startTime = Date.now();

    this.player.reset();
    this.bunkers.reset();
    this.swarm.reset(this.wave);
    this.sound.resetMarch();
    this.state = this.STATE.PLAYING;

    this.triggerUIUpdates();
  }

  nextWave() {
    this.wave++;
    this.bunkers.reset();
    this.swarm.reset(this.wave);
    this.sound.resetMarch();
    this.state = this.STATE.PLAYING;

    if (this.onWaveUpdate) this.onWaveUpdate(this.wave);
  }

  triggerUIUpdates() {
    if (this.onScoreUpdate) this.onScoreUpdate(this.score, this.highScore);
    if (this.onLivesUpdate) this.onLivesUpdate(this.player.lives);
    if (this.onWaveUpdate) this.onWaveUpdate(this.wave);
  }

  togglePause() {
    if (this.state === this.STATE.PLAYING) {
      this.state = this.STATE.PAUSED;
      this.sound.stopUfo();
      return true;
    } else if (this.state === this.STATE.PAUSED) {
      this.state = this.STATE.PLAYING;
      return false;
    }
    return false;
  }

  playerShoot() {
    if (this.state !== this.STATE.PLAYING) return false;
    const laser = this.player.shoot();
    if (laser) {
      this.shotsFired++;
      this.sound.playPlayerShoot();
      return true;
    }
    return false;
  }

  triggerGameOver(reason = 'lives_depleted') {
    this.state = this.STATE.GAME_OVER;
    this.saveHighScore();
    this.sound.playGameOver();

    const duration = (Date.now() - this.startTime) / 1000;
    const accuracy = this.shotsFired > 0
      ? Math.min(100, Math.round(((this.aliensKilled + this.ufoHits) / this.shotsFired) * 100))
      : 0;

    const stats = {
      score: this.score,
      highScore: this.highScore,
      wave: this.wave,
      aliensKilled: this.aliensKilled,
      ufoHits: this.ufoHits,
      shotsFired: this.shotsFired,
      accuracy: accuracy,
      durationSeconds: Math.floor(duration),
      reason: reason
    };

    if (this.onGameOverCallback) {
      this.onGameOverCallback(stats);
    }
  }

  update(dt = 1) {
    this.particles.update(dt);

    if (this.state === this.STATE.PAUSED || this.state === this.STATE.MENU) {
      return;
    }

    if (this.state === this.STATE.WAVE_CLEAR) {
      this.waveClearTimer -= dt;
      if (this.waveClearTimer <= 0) {
        this.nextWave();
      }
      return;
    }

    if (this.state === this.STATE.PLAYING) {
      // 1. Update Player
      this.player.update(dt);
      if (this.player.isDead) {
        this.triggerGameOver('lives_depleted');
        return;
      }

      // 2. Update Swarm
      const swarmResult = this.swarm.update(dt, this.sound, this.particles);

      if (swarmResult.invasionLanded) {
        // Aliens reached player line - immediate invasion victory!
        this.particles.createPlayerExplosion(this.player.x + this.player.width / 2, this.player.y);
        this.triggerGameOver('invasion_landed');
        return;
      }

      if (swarmResult.waveCleared) {
        this.state = this.STATE.WAVE_CLEAR;
        this.waveClearTimer = 120; // 2 seconds celebration
        this.sound.playWaveClear();
        return;
      }

      // 3. Collision: Player Lasers vs Aliens & UFO
      const hitRes = this.swarm.checkLaserCollisions(this.player.lasers, this.particles, this.sound);
      if (hitRes.scoreGained > 0) {
        this.score += hitRes.scoreGained;
        if (hitRes.alienKilled) this.aliensKilled++;
        if (hitRes.ufoHit) this.ufoHits++;

        // Extra Life at 1,000 points
        if (!this.player.extraLifeAwarded && this.score >= 1000) {
          this.player.extraLifeAwarded = true;
          this.player.lives = Math.min(this.player.maxLives, this.player.lives + 1);
          this.sound.playExtraLife();
          this.particles.addFloatingScore('1UP BONUS!', this.player.x, this.player.y - 20, '#22e650');
          if (this.onLivesUpdate) this.onLivesUpdate(this.player.lives);
        }

        this.saveHighScore();
        if (this.onScoreUpdate) this.onScoreUpdate(this.score, this.highScore);
      }

      // 4. Collision: Mid-air Laser vs Bomb collision
      this.swarm.checkBulletCollisions(this.player.lasers, this.particles);

      // 5. Collision: Player Lasers vs Bunkers
      for (let i = this.player.lasers.length - 1; i >= 0; i--) {
        const laser = this.player.lasers[i];
        if (this.bunkers.checkHit(laser)) {
          this.sound.playBunkerHit();
          this.particles.createBunkerDust(laser.x, laser.y);
          this.player.lasers.splice(i, 1);
        }
      }

      // 6. Collision: Alien Bombs vs Bunkers
      for (let i = this.swarm.bombs.length - 1; i >= 0; i--) {
        const bomb = this.swarm.bombs[i];
        if (this.bunkers.checkHit(bomb)) {
          this.sound.playBunkerHit();
          this.particles.createBunkerDust(bomb.x, bomb.y);
          this.swarm.bombs.splice(i, 1);
        }
      }

      // 7. Collision: Alien Bombs vs Player Cannon
      if (!this.player.isDying && !this.player.isDead && this.player.invulnerableTimer <= 0) {
        for (let i = this.swarm.bombs.length - 1; i >= 0; i--) {
          const bomb = this.swarm.bombs[i];
          if (
            bomb.x >= this.player.x &&
            bomb.x <= this.player.x + this.player.width &&
            bomb.y >= this.player.y &&
            bomb.y <= this.player.y + this.player.height
          ) {
            this.swarm.bombs.splice(i, 1);
            if (this.player.hit()) {
              this.sound.playPlayerExplosion();
              this.particles.createPlayerExplosion(this.player.x + this.player.width / 2, this.player.y + this.player.height / 2);
              if (this.onLivesUpdate) this.onLivesUpdate(this.player.lives);
            }
            break;
          }
        }
      }

      // 8. Alien March eroding Bunkers directly
      for (const a of this.swarm.aliens) {
        if (a.alive && a.y + a.height >= 700) {
          this.bunkers.sliceByInvader(a);
        }
      }
    }
  }

  draw() {
    this.ctx.clearRect(0, 0, this.width, this.height);

    // Deep space backdrop
    this.ctx.fillStyle = '#050608';
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Parallax Starfield & Floating particles
    this.particles.draw(this.ctx);

    // Destructible Bunkers
    this.bunkers.draw(this.ctx);

    // Swarm (Aliens, UFO, Bombs)
    this.swarm.draw(this.ctx);

    // Player Cannon & Lasers
    this.player.draw(this.ctx);

    // Sci-Fi Base Defense Energy Line
    this.ctx.fillStyle = '#00f0ff';
    this.ctx.shadowColor = '#00f0ff';
    this.ctx.shadowBlur = 10;
    this.ctx.fillRect(16, this.height - 40, this.width - 32, 2);
    this.ctx.shadowBlur = 0;

    // Wave Clear Overlay text
    if (this.state === this.STATE.WAVE_CLEAR) {
      this.ctx.fillStyle = '#f59e0b';
      this.ctx.font = '700 24px "Orbitron", sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.shadowColor = '#f59e0b';
      this.ctx.shadowBlur = 14;
      this.ctx.fillText(`SECTOR ${this.wave} SECURED!`, this.width / 2, this.height / 2 - 20);
      this.ctx.font = '600 16px "Rajdhani", sans-serif';
      this.ctx.fillStyle = '#38bdf8';
      this.ctx.fillText('[ REINFORCEMENTS DETECTED // PREPARE FLEET ]', this.width / 2, this.height / 2 + 25);
      this.ctx.shadowBlur = 0;
    }

    // Paused Overlay
    if (this.state === this.STATE.PAUSED) {
      this.ctx.fillStyle = 'rgba(3, 7, 18, 0.85)';
      this.ctx.fillRect(0, 0, this.width, this.height);

      this.ctx.fillStyle = '#00f0ff';
      this.ctx.font = '800 28px "Orbitron", sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.shadowColor = '#00f0ff';
      this.ctx.shadowBlur = 15;
      this.ctx.fillText('TACTICAL PAUSE', this.width / 2, this.height / 2 - 20);
      this.ctx.shadowBlur = 0;

      this.ctx.font = '600 16px "Rajdhani", sans-serif';
      this.ctx.fillStyle = '#94a3b8';
      this.ctx.fillText('PRESS [P] OR TAP RESUME TO ENGAGE', this.width / 2, this.height / 2 + 30);
    }
  }

  /**
   * Main Engine Loop
   */
  startLoop() {
    this.isRunning = true;
    let lastStamp = performance.now();

    const loop = (currentStamp) => {
      if (!this.isRunning) return;

      const elapsed = (currentStamp - lastStamp) / 1000;
      lastStamp = currentStamp;

      // Normalize dt to roughly 60fps frame delta
      const dt = Math.min(2.5, elapsed * 60);

      this.update(dt);
      this.draw();

      requestAnimationFrame(loop);
    };

    requestAnimationFrame(loop);
  }

  stopLoop() {
    this.isRunning = false;
  }
}

if (typeof window !== 'undefined') {
  window.SpaceInvadersGame = SpaceInvadersGame;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SpaceInvadersGame;
}

