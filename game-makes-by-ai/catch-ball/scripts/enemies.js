/**
 * Enemy AI & Combat Threat Systems
 * Su-35 Interceptors, Stealth UAV Combat Drones, Heavy Strategic Bombers,
 * and Guided Homing Missiles with Flare Decoy Dynamics.
 */

class EnemySystem {
  constructor(runtime, particles) {
    this.runtime = runtime;
    this.particles = particles;

    this.enemies = [];
    this.enemyBullets = [];
    this.enemyMissiles = [];

    // Spawning timers
    this.spawnTimer = 0;
    this.wave = 1;
    this.bossActive = false;
  }

  reset() {
    this.enemies.length = 0;
    this.enemyBullets.length = 0;
    this.enemyMissiles.length = 0;
    this.spawnTimer = 0;
    this.wave = 1;
    this.bossActive = false;
  }

  update(dt, player, onScore) {
    this._handleSpawns(dt, player);

    // 1. Update Enemies
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      e.update(dt, player, this);

      // Check collision with Player's 20mm bullets
      for (let bIdx = player.bullets.length - 1; bIdx >= 0; bIdx--) {
        const b = player.bullets[bIdx];
        if (Math.hypot(b.x - e.x, b.y - e.y) < e.radius + 10) {
          e.takeDamage(b.damage, this.particles);
          player.bullets.splice(bIdx, 1);
          window.AudioEngine.playHitImpact();
          if (!e.isAlive) break;
        }
      }

      // Check collision with Player's Fox-2 Missiles
      for (let mIdx = player.missiles.length - 1; mIdx >= 0; mIdx--) {
        const m = player.missiles[mIdx];
        if (Math.hypot(m.x - e.x, m.y - e.y) < e.radius + 25) {
          e.takeDamage(120, this.particles); // High explosive payload
          this.particles.addExplosion(m.x, m.y, 1.2);
          player.missiles.splice(mIdx, 1);
          if (!e.isAlive) break;
        }
      }

      // Collision with player airframe
      if (e.isAlive && player.isAlive && Math.hypot(e.x - player.x, e.y - player.y) < e.radius + 40) {
        player.takeDamage(45);
        e.takeDamage(100, this.particles);
      }

      // Dead or off-screen cleanup
      if (!e.isAlive) {
        onScore(e.scoreValue, e.x, e.y);
        this.enemies.splice(i, 1);
      } else if (e.y > this.runtime.V_HEIGHT + 250 || e.x < -300 || e.x > this.runtime.V_WIDTH + 300) {
        this.enemies.splice(i, 1);
      }
    }

    // 2. Update Enemy Bullets
    for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
      const b = this.enemyBullets[i];
      b.x += b.vx * dt;
      b.y += b.vy * dt;

      // Check collision with player
      if (player.isAlive && Math.hypot(b.x - player.x, b.y - player.y) < 38) {
        player.takeDamage(b.damage);
        this.enemyBullets.splice(i, 1);
        continue;
      }

      if (b.y > this.runtime.V_HEIGHT + 60 || b.y < -60 || b.x < -60 || b.x > this.runtime.V_WIDTH + 60) {
        this.enemyBullets.splice(i, 1);
      }
    }

    // 3. Update Enemy Homing Missiles (SAMs / Air-to-Air)
    let incomingThreatDetected = false;

    for (let i = this.enemyMissiles.length - 1; i >= 0; i--) {
      const m = this.enemyMissiles[i];
      m.life -= dt;

      if (m.life <= 0) {
        this.particles.addExplosion(m.x, m.y, 0.7);
        this.enemyMissiles.splice(i, 1);
        continue;
      }

      incomingThreatDetected = true;

      // Check if distracted by Magnesium Flares!
      let decoyTarget = null;
      let closestFlareDist = 450;

      for (const f of this.particles.flares) {
        const dist = Math.hypot(f.x - m.x, f.y - m.y);
        if (dist < closestFlareDist && f.heat > 0.3) {
          closestFlareDist = dist;
          decoyTarget = f;
        }
      }

      const targetX = decoyTarget ? decoyTarget.x : player.x;
      const targetY = decoyTarget ? decoyTarget.y : player.y;

      // Proportional Guidance
      const targetAngle = Math.atan2(targetY - m.y, targetX - m.x);
      let diff = targetAngle - m.angle;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;

      const maxTurn = (decoyTarget ? 6.5 : 3.8) * dt;
      m.angle += Math.max(-maxTurn, Math.min(maxTurn, diff));

      m.speed = Math.min(m.maxSpeed, m.speed + m.accel * dt);
      m.vx = Math.cos(m.angle) * m.speed;
      m.vy = Math.sin(m.angle) * m.speed;

      m.x += m.vx * dt;
      m.y += m.vy * dt;

      // Smoke trail
      m.smokeTimer += dt;
      if (m.smokeTimer > 0.02) {
        m.smokeTimer = 0;
        this.particles.addSmoke(
          m.x - Math.cos(m.angle) * 16,
          m.y - Math.sin(m.angle) * 16,
          -m.vx * 0.1,
          -m.vy * 0.1,
          11,
          0.8,
          'rgba(245, 140, 60,', // Orange fiery trail
          24
        );
      }

      // Hit Player
      if (player.isAlive && Math.hypot(m.x - player.x, m.y - player.y) < 42) {
        player.takeDamage(40);
        this.particles.addExplosion(m.x, m.y, 1.4);
        this.enemyMissiles.splice(i, 1);
        continue;
      }

      // Hit Flare directly (detonate)
      if (decoyTarget && Math.hypot(m.x - decoyTarget.x, m.y - decoyTarget.y) < 30) {
        this.particles.addExplosion(m.x, m.y, 0.9);
        this.enemyMissiles.splice(i, 1);
      }
    }

    // Alert player's RWR if incoming missile
    if (incomingThreatDetected && Math.floor(Date.now() / 180) % 2 === 0) {
      window.AudioEngine.playIncomingMissileAlert();
    }
  }

  _handleSpawns(dt, player) {
    this.spawnTimer += dt;

    // Smooth Easy-to-Hard Spawning
    // Wave 1: 5.5s interval (Gentle start, single scouts)
    // Wave 2: 4.2s interval (Drone pairs)
    // Wave 3: 3.4s interval (Aggressive interceptors + missiles)
    // Wave 4+: 2.2s - 1.6s interval (Heavy bombers + swarms)
    const interval = Math.max(1.6, 5.5 - (this.wave - 1) * 0.7);

    if (this.spawnTimer >= interval) {
      this.spawnTimer = 0;
      const spawnX = 140 + Math.random() * (this.runtime.V_WIDTH - 280);

      if (this.wave < 2) {
        // Wave 1: Single scout fighter
        this.enemies.push(new Su35Fighter(spawnX, -120));
      } else if (this.wave < 3) {
        // Wave 2: Introduce stealth drone pairs or single fighter
        if (Math.random() < 0.6) {
          this.enemies.push(new StealthDrone(spawnX - 50, -100));
          this.enemies.push(new StealthDrone(spawnX + 50, -135));
        } else {
          this.enemies.push(new Su35Fighter(spawnX, -120));
        }
      } else if (this.wave < 4) {
        // Wave 3: Interceptor pairs and drone swarms
        if (Math.random() < 0.5) {
          this.enemies.push(new Su35Fighter(spawnX, -120));
        } else {
          this.enemies.push(new StealthDrone(spawnX - 55, -100));
          this.enemies.push(new StealthDrone(spawnX + 55, -135));
        }
      } else {
        // Wave 4+: Heavy bombers, interceptors, and drone squadrons
        const roll = Math.random();
        if (roll < 0.35) {
          // Tu-160 Heavy Strategic Bomber
          this.enemies.push(new HeavyBomber(spawnX, -220));
        } else if (roll < 0.7) {
          this.enemies.push(new Su35Fighter(spawnX, -120));
        } else {
          this.enemies.push(new StealthDrone(spawnX - 60, -100));
          this.enemies.push(new StealthDrone(spawnX + 60, -140));
        }
      }
    }
  }

  draw(ctx) {
    // 1. Draw Enemy Bullets (Red 30mm Tracer streaks)
    ctx.save();
    ctx.strokeStyle = '#ef4444';
    ctx.shadowColor = '#dc2626';
    ctx.shadowBlur = 8;
    ctx.lineWidth = 3.5;
    for (const b of this.enemyBullets) {
      ctx.beginPath();
      ctx.moveTo(b.x, b.y);
      ctx.lineTo(b.x - b.vx * 0.02, b.y - b.vy * 0.02);
      ctx.stroke();
    }
    ctx.restore();

    // 2. Draw Enemy Homing Missiles
    for (const m of this.enemyMissiles) {
      ctx.save();
      ctx.translate(m.x, m.y);
      ctx.rotate(m.angle + Math.PI / 2);

      // Missile Body
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(-3, -16, 6, 32);

      // Nose cone
      ctx.fillStyle = '#111827';
      ctx.beginPath();
      ctx.moveTo(-3, -16);
      ctx.lineTo(0, -24);
      ctx.lineTo(3, -16);
      ctx.closePath();
      ctx.fill();

      // Rocket flame
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(0, 16, 5, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    // 3. Draw Enemies
    for (const e of this.enemies) {
      e.draw(ctx);
    }
  }
}

// -------------------------------------------------------------
// ENEMY 1: Su-35 Flanker Air Superiority Fighter (Crimson Aggressor)
// -------------------------------------------------------------
class Su35Fighter {
  constructor(x, y) {
    this.id = Math.random().toString(36).substr(2, 6);
    this.type = 'fighter';
    this.x = x;
    this.y = y;
    this.vx = (Math.random() - 0.5) * 80;
    this.vy = 240 + Math.random() * 80;
    this.radius = 44;
    this.health = 50;
    this.maxHealth = 50;
    this.isAlive = true;
    this.scoreValue = 250;

    this.attackTimer = 0;
    this.missileTimer = 0;
    this.roll = 0;
    this.hitFlashTimer = 0;
  }

  takeDamage(amount, particles) {
    this.health -= amount;
    this.hitFlashTimer = 0.12;
    if (this.health <= 0) {
      this.isAlive = false;
      particles.addExplosion(this.x, this.y, 1.2);
    }
  }

  update(dt, player, sys) {
    if (this.hitFlashTimer > 0) this.hitFlashTimer -= dt;

    // Pursuit maneuvers towards player
    const dx = player.x - this.x;
    this.vx += (dx * 0.6 - this.vx) * 2.0 * dt;
    this.roll = Math.max(-1, Math.min(1, this.vx / 180));

    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // Engine ribbon trail
    sys.particles.addRibbonPoint(`su35_${this.id}`, this.x, this.y - 45, '#ef4444', 4.5, 0.2);

    // Cannon fire bursts
    this.attackTimer += dt;
    if (this.attackTimer > 1.2 && this.y < player.y - 120) {
      this.attackTimer = 0;
      const angle = Math.atan2(player.y - this.y, player.x - this.x);
      [-16, 16].forEach(muzzleX => {
        sys.enemyBullets.push({
          x: this.x + muzzleX,
          y: this.y + 30,
          vx: Math.cos(angle) * 850,
          vy: Math.sin(angle) * 850,
          damage: 12
        });
      });
    }

    // Launch heat-seeking missile occasionally
    this.missileTimer += dt;
    if (this.missileTimer > 5.5 && this.y < player.y - 250) {
      this.missileTimer = 0;
      sys.enemyMissiles.push({
        x: this.x,
        y: this.y + 40,
        vx: this.vx,
        vy: 300,
        speed: 350,
        maxSpeed: 1250,
        accel: 1500,
        angle: Math.PI / 2,
        life: 5.0,
        smokeTimer: 0
      });
    }
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);

    const bankScaleX = 1 - Math.abs(this.roll) * 0.35;
    ctx.scale(bankScaleX, 1);

    // Hit flash override
    const isHit = this.hitFlashTimer > 0;

    // High-Contrast Crimson & Matte Gunmetal Camouflage
    const bodyGrad = ctx.createLinearGradient(-40, 0, 40, 0);
    bodyGrad.addColorStop(0, isHit ? '#ffffff' : '#991b1b');
    bodyGrad.addColorStop(0.5, isHit ? '#ffffff' : '#dc2626');
    bodyGrad.addColorStop(1, isHit ? '#ffffff' : '#7f1d1d');
    ctx.fillStyle = bodyGrad;
    ctx.strokeStyle = isHit ? '#ffffff' : '#f87171';
    ctx.lineWidth = 2.5;

    ctx.beginPath();
    ctx.moveTo(0, 80); // Sharp nose pointing down
    ctx.lineTo(-14, 42);
    ctx.lineTo(-56, -20);
    ctx.lineTo(-52, -42);
    ctx.lineTo(-20, -36);
    ctx.lineTo(-16, -68);
    ctx.lineTo(0, -58);
    ctx.lineTo(16, -68);
    ctx.lineTo(20, -36);
    ctx.lineTo(52, -42);
    ctx.lineTo(56, -20);
    ctx.lineTo(14, 42);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // High-Contrast White Aggressor Chevron Stripes
    ctx.fillStyle = isHit ? '#ffffff' : '#f8fafc';
    ctx.beginPath();
    ctx.moveTo(-35, -5); ctx.lineTo(-45, -15); ctx.lineTo(-25, -10); ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(35, -5); ctx.lineTo(45, -15); ctx.lineTo(25, -10); ctx.closePath();
    ctx.fill();

    // Glowing Red Wingtip Navigation Strobes
    ctx.fillStyle = (Math.floor(Date.now() / 150) % 2 === 0) ? '#ff0000' : '#ffffff';
    ctx.shadowColor = '#ff0000';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(-54, -30, 4, 0, Math.PI * 2);
    ctx.arc(54, -30, 4, 0, Math.PI * 2);
    ctx.fill();

    // Red Afterburner Nozzle Exhausts
    ctx.fillStyle = '#f97316';
    ctx.shadowColor = '#f97316';
    ctx.shadowBlur = 8;
    ctx.fillRect(-15, -72, 7, 8);
    ctx.fillRect(8, -72, 7, 8);

    ctx.restore();
  }
}

// -------------------------------------------------------------
// ENEMY 2: Stealth UAV Combat Drone (Electric Violet Flying Wing)
// -------------------------------------------------------------
class StealthDrone {
  constructor(x, y) {
    this.id = Math.random().toString(36).substr(2, 6);
    this.type = 'drone';
    this.x = x;
    this.y = y;
    this.vx = (Math.random() - 0.5) * 140;
    this.vy = 340 + Math.random() * 60;
    this.radius = 34;
    this.health = 30;
    this.maxHealth = 30;
    this.isAlive = true;
    this.scoreValue = 180;
    this.attackTimer = 0.5;
    this.hitFlashTimer = 0;
  }

  takeDamage(amount, particles) {
    this.health -= amount;
    this.hitFlashTimer = 0.12;
    if (this.health <= 0) {
      this.isAlive = false;
      particles.addExplosion(this.x, this.y, 0.9);
    }
  }

  update(dt, player, sys) {
    if (this.hitFlashTimer > 0) this.hitFlashTimer -= dt;

    this.x += this.vx * dt;
    this.y += this.vy * dt;

    if (this.x < 80 || this.x > sys.runtime.V_WIDTH - 80) {
      this.vx = -this.vx;
    }

    // Purple engine ribbon trail
    sys.particles.addRibbonPoint(`drone_${this.id}`, this.x, this.y - 25, '#c084fc', 3.5, 0.2);

    this.attackTimer += dt;
    if (this.attackTimer > 1.8 && this.y < player.y - 80) {
      this.attackTimer = 0;
      sys.enemyBullets.push({
        x: this.x,
        y: this.y + 20,
        vx: 0,
        vy: 950,
        damage: 10
      });
    }
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);

    const isHit = this.hitFlashTimer > 0;

    // High-Contrast Electric Violet Delta Wing
    ctx.fillStyle = isHit ? '#ffffff' : '#4c1d95';
    ctx.strokeStyle = isHit ? '#ffffff' : '#a855f7';
    ctx.shadowColor = '#a855f7';
    ctx.shadowBlur = 10;
    ctx.lineWidth = 2.5;

    ctx.beginPath();
    ctx.moveTo(0, 42); // Central nose
    ctx.lineTo(-48, -24);
    ctx.lineTo(-26, -34);
    ctx.lineTo(0, -20);
    ctx.lineTo(26, -34);
    ctx.lineTo(48, -24);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Glowing Neon Purple Wing Leading Edge Stripes
    ctx.strokeStyle = '#e879f9';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 38); ctx.lineTo(-44, -20);
    ctx.moveTo(0, 38); ctx.lineTo(44, -20);
    ctx.stroke();

    // Pulsing Cyan Autonomous AI Sensor Eye
    const eyeGlow = (Math.floor(Date.now() / 100) % 2 === 0) ? '#22d3ee' : '#06b6d4';
    ctx.fillStyle = eyeGlow;
    ctx.shadowColor = eyeGlow;
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(0, 6, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

// -------------------------------------------------------------
// ENEMY 3: Tu-160 Heavy Strategic Bomber (Arctic White & Hazard Yellow)
// -------------------------------------------------------------
class HeavyBomber {
  constructor(x, y) {
    this.type = 'bomber';
    this.x = x;
    this.y = y;
    this.vx = (Math.random() - 0.5) * 35;
    this.vy = 120;
    this.radius = 90;
    this.health = 350;
    this.maxHealth = 350;
    this.isAlive = true;
    this.scoreValue = 850;

    this.turretAngle = 0;
    this.turretTimer = 0;
    this.missileSalvoTimer = 0;
    this.hitFlashTimer = 0;
  }

  takeDamage(amount, particles) {
    this.health -= amount;
    this.hitFlashTimer = 0.12;
    if (this.health <= 0) {
      this.isAlive = false;
      particles.addExplosion(this.x - 40, this.y, 1.6);
      particles.addExplosion(this.x + 40, this.y, 1.6);
      particles.addExplosion(this.x, this.y, 2.2);
    }
  }

  update(dt, player, sys) {
    if (this.hitFlashTimer > 0) this.hitFlashTimer -= dt;

    this.x += this.vx * dt;
    this.y += this.vy * dt;

    if (this.x < 150 || this.x > sys.runtime.V_WIDTH - 150) {
      this.vx = -this.vx;
    }

    // Defensive Turrets track the player
    this.turretAngle = Math.atan2(player.y - this.y, player.x - this.x);

    this.turretTimer += dt;
    if (this.turretTimer > 0.45) {
      this.turretTimer = 0;
      // Dual flak cannons
      [-38, 38].forEach(tX => {
        sys.enemyBullets.push({
          x: this.x + tX,
          y: this.y + 10,
          vx: Math.cos(this.turretAngle) * 750,
          vy: Math.sin(this.turretAngle) * 750,
          damage: 16
        });
      });
    }

    // Cruise missile salvos
    this.missileSalvoTimer += dt;
    if (this.missileSalvoTimer > 4.5) {
      this.missileSalvoTimer = 0;
      [-1, 1].forEach(side => {
        sys.enemyMissiles.push({
          x: this.x + side * 55,
          y: this.y + 30,
          vx: side * 150,
          vy: 200,
          speed: 300,
          maxSpeed: 1050,
          accel: 1200,
          angle: Math.PI / 2 + side * 0.3,
          life: 6.0,
          smokeTimer: 0
        });
      });
    }
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);

    const isHit = this.hitFlashTimer > 0;

    // High-Contrast Arctic White & Hazard Trim
    ctx.fillStyle = isHit ? '#ffffff' : '#f1f5f9';
    ctx.strokeStyle = isHit ? '#ffffff' : '#cbd5e1';
    ctx.lineWidth = 3.5;

    // Fuselage & Swept Wings
    ctx.beginPath();
    ctx.moveTo(0, 115); // Nose
    ctx.lineTo(-26, 52);
    ctx.lineTo(-125, -20);
    ctx.lineTo(-115, -55);
    ctx.lineTo(-38, -42);
    ctx.lineTo(-26, -98);
    ctx.lineTo(0, -88);
    ctx.lineTo(26, -98);
    ctx.lineTo(38, -42);
    ctx.lineTo(115, -55);
    ctx.lineTo(125, -20);
    ctx.lineTo(26, 52);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // High-Contrast Hazard Yellow/Orange Wing Chevrons
    ctx.fillStyle = isHit ? '#ffffff' : '#f59e0b';
    ctx.beginPath();
    ctx.moveTo(-95, -25); ctx.lineTo(-115, -35); ctx.lineTo(-105, -45); ctx.lineTo(-85, -35); ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(95, -25); ctx.lineTo(115, -35); ctx.lineTo(105, -45); ctx.lineTo(85, -35); ctx.closePath();
    ctx.fill();

    // 4 Heavy Engine Pods
    ctx.fillStyle = '#334155';
    ctx.fillRect(-54, -85, 24, 48);
    ctx.fillRect(30, -85, 24, 48);

    // Blinking Anti-Collision Aviation Strobes (Wingtip & Tail)
    const strobeWhite = (Math.floor(Date.now() / 150) % 2 === 0) ? '#ffffff' : 'transparent';
    const strobeRed = (Math.floor(Date.now() / 300) % 2 === 0) ? '#ef4444' : '#7f1d1d';
    ctx.fillStyle = strobeWhite;
    ctx.beginPath();
    ctx.arc(-120, -35, 4, 0, Math.PI * 2);
    ctx.arc(120, -35, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = strobeRed;
    ctx.beginPath();
    ctx.arc(0, -92, 5, 0, Math.PI * 2);
    ctx.fill();

    // Defensive Turrets
    ctx.fillStyle = '#dc2626';
    ctx.shadowColor = '#dc2626';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(-36, 12, 9, 0, Math.PI * 2);
    ctx.arc(36, 12, 9, 0, Math.PI * 2);
    ctx.fill();

    // Overhead Health Bar
    const hpWidth = 140;
    const hpRatio = Math.max(0, this.health / this.maxHealth);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.fillRect(-hpWidth / 2, -125, hpWidth, 10);
    ctx.fillStyle = '#ef4444';
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 8;
    ctx.fillRect(-hpWidth / 2, -125, hpWidth * hpRatio, 10);

    ctx.restore();
  }
}

window.EnemySystem = EnemySystem;

