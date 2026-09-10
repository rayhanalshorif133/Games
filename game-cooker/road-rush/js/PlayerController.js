/**
 * PlayerController.js
 * 
 * Core Module 3: Player Movement & Break Mechanism + Melee Combat
 * Optimized for 1080x1920 Portrait resolution.
 * 
 * Assets Referenced:
 * - Bike: images/assets/Motorcycle Body/1.png
 * - Rider: images/assets/Riders/01/Riders01.png
 * - Attack Frames: images/assets/Riders/01/Hit01/Left/ (1..4.png) & Right/ (1..4.png)
 * - Brake Button: images/assets/ui/break_button.png
 */

class PlayerController {
  constructor() {
    this.width = 90;
    this.height = 160;
    this.x = 540;
    this.y = 1550;
    this.targetX = 540;
    this.targetY = 1550;
    this.tilt = 0;
    this.hp = 100;
    this.maxHp = 100;

    // Brake state
    this.isBraking = false;
    this.brakeHeat = 0;
    this.maxBrakeHeat = 4.0;
    this.isBrakeOverheated = false;
    this.skidMarks = [];

    // Attack state
    this.isAttacking = false;
    this.attackSide = 'right';
    this.attackTimer = 0;
    this.attackDuration = 0.28;
    this.attackCooldown = 0;
    this.hasHitInCurrentAttack = false;
    this.invulnerableTimer = 0;
  }

  init() {
    this.x = 540;
    this.y = 1550;
    this.targetX = 540;
    this.targetY = 1550;
    this.hp = 100;
    this.tilt = 0;
    this.isBraking = false;
    this.brakeHeat = 0;
    this.isBrakeOverheated = false;
    this.skidMarks = [];
    this.isAttacking = false;
    this.attackTimer = 0;
    this.attackCooldown = 0;
    this.invulnerableTimer = 0;
  }

  performAttack() {
    if (this.attackCooldown > 0 || this.isAttacking) return;

    // Check closest enemy biker side
    let closestEnemy = null;
    let minDistance = 9999;
    if (window.combatSystem) {
      window.combatSystem.enemyBikers.forEach(eb => {
        const dist = Math.hypot(eb.x - this.x, eb.y - this.y);
        if (dist < minDistance) {
          minDistance = dist;
          closestEnemy = eb;
        }
      });
    }

    if (closestEnemy && minDistance < 260) {
      this.attackSide = closestEnemy.x < this.x ? 'left' : 'right';
    } else {
      this.attackSide = this.tilt < -0.05 ? 'left' : 'right';
    }

    this.isAttacking = true;
    this.attackTimer = 0;
    this.attackCooldown = 0.35;
    this.hasHitInCurrentAttack = false;

    if (window.gameHUD) window.gameHUD.pulseAttackButton();
  }

  takeDamage(amount, knockbackX = 0) {
    if (this.invulnerableTimer > 0 || (window.gameManager && window.gameManager.currentState !== GameState.PLAYING)) return;

    this.hp = Math.max(0, this.hp - amount);
    this.invulnerableTimer = 0.6;
    this.targetX = Math.max(ROAD_CONFIG.minDrivableX + 50, Math.min(ROAD_CONFIG.maxDrivableX - 50, this.targetX + knockbackX));
    
    if (window.trafficController) window.trafficController.shakeTimer = 0.25;
    if (window.combatSystem) {
      window.combatSystem.spawnFloatingText('-' + amount + ' HP', this.x, this.y - 60, '#ff3344', 36);
      window.combatSystem.spawnSparks(this.x, this.y, 16, '#ff4757');
    }

    if (this.hp <= 0 && window.trafficController) {
      window.trafficController.triggerCrash({ x: this.x, y: this.y, width: 100, height: 100 });
    }
  }

  update(dt) {
    if (this.invulnerableTimer > 0) this.invulnerableTimer -= dt;
    if (this.attackCooldown > 0) this.attackCooldown -= dt;

    // Strict boundary clamping within portrait resolution
    this.targetX = Math.max(ROAD_CONFIG.minDrivableX + this.width / 2, Math.min(ROAD_CONFIG.maxDrivableX - this.width / 2, this.targetX));
    this.targetY = Math.max(1100, Math.min(1780, this.targetY));

    // Smooth movement interpolation
    const prevX = this.x;
    this.x += (this.targetX - this.x) * Math.min(dt * 14, 1);
    this.y += (this.targetY - this.y) * Math.min(dt * 14, 1);

    // Dynamic bank/tilt rotation
    const velX = (this.x - prevX) / dt;
    const targetTilt = Math.max(-0.25, Math.min(0.25, velX * 0.00035));
    this.tilt += (targetTilt - this.tilt) * Math.min(dt * 10, 1);

    // Melee attack hit registration
    if (this.isAttacking) {
      this.attackTimer += dt;
      const progress = this.attackTimer / this.attackDuration;

      if (progress >= 0.5 && !this.hasHitInCurrentAttack) {
        this.checkAttackHit();
      }

      if (this.attackTimer >= this.attackDuration) {
        this.isAttacking = false;
        this.attackTimer = 0;
      }
    }

    // Brake heat logic
    if (this.isBraking) {
      this.brakeHeat += dt;
      if (this.brakeHeat >= this.maxBrakeHeat) {
        this.brakeHeat = this.maxBrakeHeat;
        this.isBrakeOverheated = true;
        this.isBraking = false;
        if (window.gameHUD) window.gameHUD.updateBrakeUI(false);
      }

      if (Math.random() < 0.6) {
        this.skidMarks.push({
          x: this.x,
          y: this.y + 60,
          alpha: 0.6,
          width: 8
        });
      }
    } else {
      if (this.brakeHeat > 0) {
        this.brakeHeat -= dt * 1.6;
        if (this.brakeHeat <= 0) {
          this.brakeHeat = 0;
          this.isBrakeOverheated = false;
        }
      }
    }

    // Update skid marks
    const speed = window.gameManager ? window.gameManager.scrollSpeed : 720;
    const roadDelta = speed * dt;
    for (let i = this.skidMarks.length - 1; i >= 0; i--) {
      const s = this.skidMarks[i];
      s.y += roadDelta;
      s.alpha -= dt * 0.8;
      if (s.alpha <= 0 || s.y > 1920) {
        this.skidMarks.splice(i, 1);
      }
    }
  }

  checkAttackHit() {
    if (!window.combatSystem) return;

    window.combatSystem.enemyBikers.forEach(enemy => {
      if (enemy.isDead) return;

      const dx = enemy.x - this.x;
      const dy = Math.abs(enemy.y - this.y);

      const correctSide = (this.attackSide === 'left' && dx < 0 && dx > -220) ||
                          (this.attackSide === 'right' && dx > 0 && dx < 220);

      if (correctSide && dy < 130) {
        this.hasHitInCurrentAttack = true;
        enemy.takeDamage(50, this.attackSide === 'left' ? -120 : 120);
      }
    });
  }

  render(ctx) {
    // Render skid marks
    ctx.save();
    this.skidMarks.forEach(s => {
      ctx.fillStyle = 'rgba(20, 20, 20, ' + s.alpha + ')';
      ctx.fillRect(s.x - 22, s.y, s.width, 24);
      ctx.fillRect(s.x + 14, s.y, s.width, 24);
    });
    ctx.restore();

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.tilt);

    if (this.invulnerableTimer > 0 && Math.floor(Date.now() / 60) % 2 === 0) {
      ctx.globalAlpha = 0.4;
    }

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.ellipse(4, 10, this.width * 0.5, this.height * 0.45, 0, 0, Math.PI * 2);
    ctx.fill();

    const bikeImg = window.assets ? window.assets.get('bike') : null;
    if (bikeImg && bikeImg.complete && bikeImg.naturalWidth > 0) {
      ctx.drawImage(bikeImg, -this.width / 2, -this.height / 2, this.width, this.height);
    } else {
      ctx.fillStyle = '#ff4757';
      ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
    }

    if (this.isAttacking) {
      const frameIdx = Math.min(3, Math.floor((this.attackTimer / this.attackDuration) * 4));
      const key = this.attackSide === 'left' ? 'att_l_' + frameIdx : 'att_r_' + frameIdx;
      const attImg = window.assets ? window.assets.get(key) : null;

      if (attImg && attImg.complete && attImg.naturalWidth > 0) {
        const scale = 0.9;
        const w = 287 * scale;
        const h = 170 * scale;
        ctx.drawImage(attImg, -w / 2, -h / 2 + 10, w, h);
      }
    } else {
      const riderImg = window.assets ? window.assets.get('rider') : null;
      if (riderImg && riderImg.complete && riderImg.naturalWidth > 0) {
        const rw = this.width * 0.95;
        const rh = this.height * 0.85;
        ctx.drawImage(riderImg, -rw / 2, -rh / 2 + 5, rw, rh);
      }
    }

    // Brake light glow
    if (this.isBraking) {
      ctx.fillStyle = 'rgba(255, 30, 30, 0.85)';
      ctx.beginPath();
      ctx.arc(0, this.height * 0.4, 16, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  getHitbox() {
    return {
      x: this.x - this.width * 0.35,
      y: this.y - this.height * 0.4,
      width: this.width * 0.7,
      height: this.height * 0.8
    };
  }
}

window.player = new PlayerController();
