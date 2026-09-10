/**
 * TrafficController.js
 * 
 * Core Module 4: Dynamic Traffic Controller
 * 
 * Spawns AI obstacle vehicles from images/assets/vehicles/traffic_cars/
 * at randomized intervals that contract as the game timer progresses.
 * Handles collision detection with the player, damage, screen shake,
 * and instantiates animated explosion effects from CollisionFx/.
 */

class TrafficController {
  constructor() {
    this.vehicles = [];
    this.spawnTimer = 0;
    this.nextSpawnInterval = 2.5;
    this.explosions = [];
    this.shakeTimer = 0;
  }

  init() {
    this.vehicles = [];
    this.spawnTimer = 0;
    this.nextSpawnInterval = 2.0;
    this.explosions = [];
    this.shakeTimer = 0;
  }

  getSpawnInterval() {
    const tier = window.gameManager ? window.gameManager.currentTier : 'EASY';
    const timer = window.gameManager ? window.gameManager.gameTimer : 0;

    if (tier === 'EASY') {
      const t = timer / 30;
      return 3.2 - t * 1.0 + (Math.random() * 0.4 - 0.2);
    } else if (tier === 'MEDIUM') {
      const t = (timer - 30) / 30;
      return 2.0 - t * 0.7 + (Math.random() * 0.3 - 0.15);
    } else {
      const extra = Math.min((timer - 60) / 60, 1);
      return Math.max(0.7, 1.1 - extra * 0.35) + (Math.random() * 0.2 - 0.1);
    }
  }

  update(dt) {
    if (this.shakeTimer > 0) this.shakeTimer -= dt;

    this.spawnTimer += dt;
    if (this.spawnTimer >= this.nextSpawnInterval) {
      this.spawnTimer = 0;
      this.nextSpawnInterval = this.getSpawnInterval();
      this.spawnFormation();
    }

    const speed = window.gameManager ? window.gameManager.scrollSpeed : 720;
    const roadDelta = speed * dt;

    for (let i = this.vehicles.length - 1; i >= 0; i--) {
      const car = this.vehicles[i];
      car.y += roadDelta + car.relativeSpeed * dt;

      // Collision detection with player
      if (window.gameManager && window.gameManager.currentState === GameState.PLAYING && window.player) {
        if (this.checkAABB(car.getHitbox(), window.player.getHitbox())) {
          window.player.takeDamage(40);
          this.shakeTimer = 0.4;
          if (window.combatSystem) window.combatSystem.spawnSparks(window.player.x, window.player.y, 20, '#ff9f43');

          if (window.player.hp <= 0) {
            this.triggerCrash(car);
            break;
          } else {
            window.player.y += 40;
            car.y -= 80;
          }
        }
      }

      // Despawn off bottom screen
      if (car.y > 1920 + 250) {
        this.vehicles.splice(i, 1);
      }
    }

    // Update explosion animators
    for (let i = this.explosions.length - 1; i >= 0; i--) {
      const fx = this.explosions[i];
      fx.timer += dt;
      fx.frame = Math.floor(fx.timer * 18);
      if (fx.frame >= 6) {
        this.explosions.splice(i, 1);
      }
    }
  }

  spawnFormation() {
    const laneCount = ROAD_CONFIG.lanesX.length;
    const tier = window.gameManager ? window.gameManager.currentTier : 'EASY';

    if (tier === 'EASY') {
      const lane = Math.floor(Math.random() * laneCount);
      this.spawnCar(lane, 0);
    } else if (tier === 'MEDIUM') {
      if (Math.random() < 0.5) {
        const openLane = Math.floor(Math.random() * laneCount);
        for (let l = 0; l < laneCount; l++) {
          if (l !== openLane) {
            this.spawnCar(l, Math.random() * 80);
          }
        }
      } else {
        this.spawnCar(Math.floor(Math.random() * laneCount), 0);
      }
    } else {
      const p = Math.random();
      if (p < 0.5) {
        const openLane = Math.floor(Math.random() * laneCount);
        for (let l = 0; l < laneCount; l++) {
          if (l !== openLane) {
            this.spawnCar(l, Math.random() * 140);
          }
        }
      } else {
        this.spawnCar(Math.floor(Math.random() * laneCount), 0);
      }
    }
  }

  spawnCar(laneIndex, yOffset) {
    const carIdx = Math.floor(Math.random() * 4);
    const car = {
      x: ROAD_CONFIG.lanesX[laneIndex],
      y: -220 - yOffset,
      width: 120,
      height: 200,
      carIndex: carIdx,
      relativeSpeed: 60 + Math.random() * 140,
      getHitbox() {
        return {
          x: this.x - this.width * 0.4,
          y: this.y - this.height * 0.42,
          width: this.width * 0.8,
          height: this.height * 0.84
        };
      }
    };
    this.vehicles.push(car);
  }

  triggerCrash(obstacle) {
    if (window.gameManager) window.gameManager.gameOver();
    this.shakeTimer = 0.55;

    const impactX = window.player ? (window.player.x + obstacle.x) / 2 : obstacle.x;
    const impactY = window.player ? (window.player.y + obstacle.y) / 2 : obstacle.y;

    this.explosions.push({
      x: impactX,
      y: impactY,
      timer: 0,
      frame: 0
    });
  }

  render(ctx) {
    this.vehicles.forEach(car => {
      ctx.save();
      ctx.translate(car.x, car.y);

      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath();
      ctx.ellipse(0, 10, car.width * 0.5, car.height * 0.45, 0, 0, Math.PI * 2);
      ctx.fill();

      const carImg = window.assets ? window.assets.get('car_' + car.carIndex) : null;
      if (carImg && carImg.complete && carImg.naturalWidth > 0) {
        ctx.drawImage(carImg, -car.width / 2, -car.height / 2, car.width, car.height);
      } else {
        ctx.fillStyle = '#0984e3';
        ctx.fillRect(-car.width / 2, -car.height / 2, car.width, car.height);
      }

      ctx.restore();
    });

    // Render explosions
    this.explosions.forEach(fx => {
      const fxImg = window.assets ? window.assets.get('fx_' + fx.frame) : null;
      if (fxImg && fxImg.complete && fxImg.naturalWidth > 0) {
        const size = 260;
        ctx.drawImage(fxImg, fx.x - size / 2, fx.y - size / 2, size, size);
      }
    });
  }

  checkAABB(a, b) {
    return (
      a.x < b.x + b.width &&
      a.x + a.width > b.x &&
      a.y < b.y + b.height &&
      a.y + a.height > b.y
    );
  }
}

window.trafficController = new TrafficController();
