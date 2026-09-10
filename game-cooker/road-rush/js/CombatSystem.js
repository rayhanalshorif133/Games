/**
 * CombatSystem.js
 * 
 * Manages side-by-side rival biker spawning, dropped loot coins,
 * floating combat texts, and spark particles.
 */

class CombatSystem {
  constructor() {
    this.enemyBikers = [];
    this.spawnTimer = 0;
    this.nextSpawnInterval = 3.5;
    this.droppedCoins = [];
    this.floatingTexts = [];
    this.particles = [];
  }

  init() {
    this.enemyBikers = [];
    this.spawnTimer = 0;
    this.nextSpawnInterval = 2.5;
    this.droppedCoins = [];
    this.floatingTexts = [];
    this.particles = [];
  }

  update(dt) {
    this.spawnTimer += dt;
    if (this.spawnTimer >= this.nextSpawnInterval) {
      this.spawnTimer = 0;
      this.nextSpawnInterval = 3.5 + Math.random() * 2.5;
      this.spawnRival();
    }

    const speed = window.gameManager ? window.gameManager.scrollSpeed : 720;
    const roadDelta = speed * dt;

    // Update enemy bikers
    for (let i = this.enemyBikers.length - 1; i >= 0; i--) {
      const enemy = this.enemyBikers[i];
      enemy.update(dt, roadDelta);

      if (enemy.isDead && enemy.deathTimer <= 0) {
        this.enemyBikers.splice(i, 1);
      } else if (enemy.y > 1920 + 350 || enemy.y < -400) {
        this.enemyBikers.splice(i, 1);
      }
    }

    // Update dropped coins
    for (let i = this.droppedCoins.length - 1; i >= 0; i--) {
      const coin = this.droppedCoins[i];
      coin.y += roadDelta;
      coin.animTimer += dt;
      coin.frame = Math.floor(coin.animTimer * 12) % 4;

      if (window.player) {
        const dist = Math.hypot(coin.x - window.player.x, coin.y - window.player.y);
        if (dist < 85) {
          if (window.gameManager) window.gameManager.addCash(50);
          this.spawnFloatingText('+$50', coin.x, coin.y - 20, '#ffe600', 28);
          this.spawnSparks(coin.x, coin.y, 8, '#ffe600');
          this.droppedCoins.splice(i, 1);
          continue;
        }
      }

      if (coin.y > 1920 + 100) {
        this.droppedCoins.splice(i, 1);
      }
    }

    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      p.alpha = Math.max(0, p.life / 0.4);
      if (p.life <= 0) this.particles.splice(i, 1);
    }

    // Update floating texts
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y += ft.vy * dt;
      ft.alpha -= dt * 0.9;
      if (ft.alpha <= 0) this.floatingTexts.splice(i, 1);
    }
  }

  spawnRival() {
    if (this.enemyBikers.length >= 3) return;

    const sideLane = Math.random() < 0.5 ? 0 : 2;
    const spawnX = ROAD_CONFIG.lanesX[sideLane];
    const spawnFromBehind = Math.random() < 0.4;
    const spawnY = spawnFromBehind ? 1920 + 180 : -200;
    const rivalIndex = Math.floor(Math.random() * 3);

    const enemy = new EnemyBiker(spawnX, spawnY, rivalIndex);
    this.enemyBikers.push(enemy);
  }

  dropCoinsAt(x, y) {
    for (let k = 0; k < 3; k++) {
      this.droppedCoins.push({
        x: x + (k - 1) * 35,
        y: y + (Math.random() * 20 - 10),
        animTimer: Math.random(),
        frame: 0
      });
    }
  }

  spawnFloatingText(text, x, y, color = '#ffcc00', size = 32) {
    this.floatingTexts.push({
      text: text,
      x: x,
      y: y,
      vy: -140,
      alpha: 1.0,
      color: color,
      size: size
    });
  }

  spawnSparks(x, y, count = 12, color = '#ffeb3b') {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = 120 + Math.random() * 260;
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        radius: 3 + Math.random() * 4,
        color: color,
        alpha: 1.0,
        life: 0.35 + Math.random() * 0.25
      });
    }
  }

  render(ctx) {
    // Render dropped coins
    this.droppedCoins.forEach(coin => {
      const cImg = window.assets ? window.assets.get('coin_' + coin.frame) : null;
      if (cImg && cImg.complete && cImg.naturalWidth > 0) {
        ctx.drawImage(cImg, coin.x - 30, coin.y - 30, 60, 60);
      } else {
        ctx.fillStyle = '#ffd32a';
        ctx.beginPath();
        ctx.arc(coin.x, coin.y, 18, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // Render enemy bikers
    this.enemyBikers.forEach(enemy => enemy.render(ctx));

    // Render particles
    this.particles.forEach(p => {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // Render floating combat texts
    this.floatingTexts.forEach(ft => {
      ctx.save();
      ctx.globalAlpha = ft.alpha;
      ctx.font = '900 ' + ft.size + 'px sans-serif';
      ctx.fillStyle = ft.color;
      ctx.textAlign = 'center';
      ctx.shadowColor = '#000';
      ctx.shadowBlur = 8;
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    });
  }
}

window.combatSystem = new CombatSystem();
