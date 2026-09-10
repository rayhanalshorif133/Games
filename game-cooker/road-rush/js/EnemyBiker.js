/**
 * EnemyBiker.js
 * 
 * AI Rival Biker for side-by-side combat racing.
 * Cruises on the flanks of the road, takes melee damage,
 * prepares ramming attacks, explodes upon 0 HP, and drops gold coins.
 */

class EnemyBiker {
  constructor(spawnX, spawnY, rivalIndex) {
    this.x = spawnX;
    this.y = spawnY;
    this.targetX = spawnX;
    this.targetY = 1550;
    this.width = 90;
    this.height = 160;
    this.hp = 100;
    this.maxHp = 100;
    this.rivalIndex = rivalIndex;
    this.isDead = false;
    this.deathTimer = 0.8;
    this.spinAngle = 0;
    this.hitFlashTimer = 0;
    this.attackCooldown = 3.0 + Math.random() * 2.0;
    this.attackPrepTimer = 0;
  }

  update(dt, roadDelta) {
    if (this.isDead) {
      this.deathTimer -= dt;
      this.spinAngle += 18 * dt;
      this.x += (this.x < 540 ? -250 : 250) * dt;
      this.y += (roadDelta * 0.4);
      return;
    }

    if (this.hitFlashTimer > 0) this.hitFlashTimer -= dt;

    // Follow alongside player with slight sinusoidal float
    if (window.player) {
      const timer = window.gameManager ? window.gameManager.gameTimer : 0;
      this.targetY = window.player.y + (Math.sin(timer * 2) * 40);
    }

    this.x += (this.targetX - this.x) * Math.min(dt * 5, 1);
    this.y += (this.targetY - this.y) * Math.min(dt * 4, 1);

    // AI Attack logic: prepare to ram player if alongside
    if (window.player) {
      this.attackCooldown -= dt;
      const distToPlayer = Math.hypot(this.x - window.player.x, this.y - window.player.y);

      if (this.attackCooldown <= 0 && distToPlayer < 220) {
        this.attackPrepTimer += dt;
        if (this.attackPrepTimer >= 0.8) {
          const ramDir = window.player.x > this.x ? 1 : -1;
          this.targetX += ramDir * 60;
          window.player.takeDamage(20, ramDir * 80);
          this.attackCooldown = 4.0;
          this.attackPrepTimer = 0;
          if (window.combatSystem) {
            window.combatSystem.spawnFloatingText('RIVAL RAM!', this.x, this.y - 40, '#ff9f43', 28);
          }
        }
      } else {
        this.attackPrepTimer = 0;
      }

      if (distToPlayer < 90 && !this.isDead) {
        const pushDir = this.x < window.player.x ? -1 : 1;
        this.targetX += pushDir * 40 * dt;
      }
    }
  }

  takeDamage(amount, knockbackX) {
    if (this.isDead) return;

    this.hp -= amount;
    this.hitFlashTimer = 0.25;
    this.targetX = Math.max(ROAD_CONFIG.minDrivableX + 40, Math.min(ROAD_CONFIG.maxDrivableX - 40, this.x + knockbackX));
    this.attackPrepTimer = 0;
    this.attackCooldown = 2.5;

    if (window.combatSystem) {
      window.combatSystem.spawnFloatingText('SMACK! -' + amount, this.x, this.y - 40, '#ffeb3b', 34);
      window.combatSystem.spawnSparks(this.x, this.y, 14, '#fffa65');
    }

    if (window.trafficController) window.trafficController.shakeTimer = 0.15;

    if (this.hp <= 0) {
      this.die();
    }
  }

  die() {
    this.isDead = true;

    if (window.gameManager) {
      window.gameManager.addKOBonus(1000, 100);
    }

    if (window.combatSystem) {
      window.combatSystem.spawnFloatingText('K.O.! +$100', this.x, this.y - 80, '#ff3838', 42);
      window.combatSystem.dropCoinsAt(this.x, this.y);
    }

    if (window.trafficController) {
      window.trafficController.shakeTimer = 0.45;
      window.trafficController.explosions.push({
        x: this.x,
        y: this.y,
        timer: 0,
        frame: 0
      });
    }
  }

  render(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);

    if (this.isDead) {
      ctx.rotate(this.spinAngle);
      ctx.globalAlpha = Math.max(0, this.deathTimer / 0.8);
    }

    if (this.hitFlashTimer > 0) {
      ctx.filter = 'brightness(2.2) sepia(1) saturate(5) hue-rotate(-50deg)';
    }

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.ellipse(0, 10, this.width * 0.5, this.height * 0.45, 0, 0, Math.PI * 2);
    ctx.fill();

    const eBikeImg = window.assets ? window.assets.get('ebike_' + this.rivalIndex) : null;
    const eRiderImg = window.assets ? window.assets.get('erider_' + this.rivalIndex) : null;

    if (eBikeImg && eBikeImg.complete && eBikeImg.naturalWidth > 0) {
      ctx.drawImage(eBikeImg, -this.width / 2, -this.height / 2, this.width, this.height);
    } else {
      ctx.fillStyle = '#10ac84';
      ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
    }

    if (eRiderImg && eRiderImg.complete && eRiderImg.naturalWidth > 0) {
      const rw = this.width * 0.95;
      const rh = this.height * 0.85;
      ctx.drawImage(eRiderImg, -rw / 2, -rh / 2 + 5, rw, rh);
    }

    ctx.restore();

    // Health bar & attack warning above enemy
    if (!this.isDead) {
      const barW = 80;
      const barH = 8;
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(this.x - barW / 2, this.y - 110, barW, barH);
      ctx.fillStyle = this.hp > 50 ? '#2ecc71' : '#e74c3c';
      ctx.fillRect(this.x - barW / 2 + 1, this.y - 110 + 1, (barW - 2) * (this.hp / this.maxHp), barH - 2);

      if (this.attackPrepTimer > 0) {
        ctx.fillStyle = '#ff3838';
        ctx.font = 'bold 22px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('⚡ RAM!', this.x, this.y - 125);
      }
    }
  }
}
