/**
 * GameManager.js
 * 
 * Core Module 2: Time-Based Progressive Difficulty Engine
 * 
 * Difficulty Schedule:
 * - Easy Tier (0s - 30s): Base scroll speed (720 px/s), sparse traffic (2.5s - 3.5s).
 * - Medium Tier (30s - 60s): Smooth speed ramp to 1200 px/s, tighter spawns (1.4s - 2.0s), 2-lane formations.
 * - Hard / Infinite Tier (60s+): Max velocity (1750+ px/s scaling infinitely), rapid spawns (0.7s - 1.1s), complex formations.
 */

const GameState = {
  READY: 'READY',
  PLAYING: 'PLAYING',
  GAMEOVER: 'GAMEOVER'
};

class GameManager {
  constructor() {
    this.currentState = GameState.READY;
    this.gameTimer = 0;
    this.distanceMeters = 0;
    this.score = 0;
    this.cash = 0;
    this.kos = 0;
    this.currentTier = 'EASY';

    this.speeds = {
      easyBase: 720,
      medBase: 1200,
      hardBase: 1750,
      maxCap: 2600,
      current: 720,
      target: 720
    };
  }

  start() {
    this.gameTimer = 0;
    this.distanceMeters = 0;
    this.score = 0;
    this.cash = 0;
    this.kos = 0;
    this.currentTier = 'EASY';
    this.speeds.current = this.speeds.easyBase;
    this.speeds.target = this.speeds.easyBase;
    this.currentState = GameState.PLAYING;

    if (window.gameHUD) window.gameHUD.updateTier(this.currentTier);
  }

  update(dt) {
    if (this.currentState !== GameState.PLAYING) return;

    this.gameTimer += dt;
    let evaluatedTier = 'EASY';
    let targetSpeed = this.speeds.easyBase;

    if (this.gameTimer < 30) {
      // 0 - 30s: Easy Tier
      evaluatedTier = 'EASY';
      const t = this.gameTimer / 30;
      targetSpeed = this.speeds.easyBase + t * (this.speeds.medBase - this.speeds.easyBase) * 0.7;
    } else if (this.gameTimer < 60) {
      // 30 - 60s: Medium Tier
      evaluatedTier = 'MEDIUM';
      const t = (this.gameTimer - 30) / 30;
      targetSpeed = this.speeds.medBase + t * (this.speeds.hardBase - this.speeds.medBase);
    } else {
      // 60s+: Hard / Infinite Tier
      evaluatedTier = 'HARD';
      const extraMinutes = (this.gameTimer - 60) / 60;
      targetSpeed = Math.min(this.speeds.hardBase + extraMinutes * 250, this.speeds.maxCap);
    }

    // Apply player brake dampening
    if (window.player && window.player.isBraking) {
      targetSpeed *= 0.50; // 50% deceleration
    }

    // Smooth speed interpolation
    this.speeds.current += (targetSpeed - this.speeds.current) * Math.min(dt * 4, 1);

    if (evaluatedTier !== this.currentTier) {
      this.currentTier = evaluatedTier;
      if (window.gameHUD) window.gameHUD.updateTier(this.currentTier);
    }

    // Accumulate distance
    const deltaDist = (this.speeds.current * dt) / 50;
    this.distanceMeters += deltaDist;
    this.score += Math.floor(deltaDist * 2);
  }

  addKOBonus(points = 1000, rewardCash = 100) {
    this.kos++;
    this.score += points;
    this.cash += rewardCash;
  }

  addCash(amount) {
    this.cash += amount;
    this.score += amount * 5;
  }

  gameOver() {
    this.currentState = GameState.GAMEOVER;
    if (window.gameHUD) {
      window.gameHUD.showGameOver({
        time: this.gameTimer,
        distance: this.distanceMeters,
        score: this.score,
        cash: this.cash,
        kos: this.kos
      });
    }
  }

  get scrollSpeed() {
    return this.speeds.current;
  }
}

window.gameManager = new GameManager();
