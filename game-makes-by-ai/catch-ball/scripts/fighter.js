/**
 * Player Fighter Jet: F-22 / Su-57 Stealth Air Superiority Jet
 * Realistic flight aerodynamics, 3D banking perspective roll, Mach diamonds,
 * M61 Vulcan rotary cannon, Fox-2 heat-seeking missiles, and magnesium flares.
 */
class FighterJet {
  constructor(runtime, particles) {
    this.runtime = runtime;
    this.particles = particles;

    // Positioning & Physics (1080x1920 space)
    this.x = runtime.V_WIDTH / 2;
    this.y = runtime.V_HEIGHT * 0.78;
    this.vx = 0;
    this.vy = 0;

    // Aerodynamics & Banking
    this.roll = 0;           // Current 3D visual roll angle (-1 to 1)
    this.targetRoll = 0;
    this.headingAngle = 0;   // Flight heading deflection in radians
    this.speed = 600;        // Airspeed in Knots
    this.throttle = 0.6;     // 0.3 to 1.0
    this.isBoosting = false;
    this.gForce = 1.0;       // G-Meter

    // Combat Stats
    this.maxHealth = 100;
    this.health = 100;
    this.isAlive = true;
    this.invulnerableTimer = 0;

    // Weapons Store
    this.cannonAmmo = 500;
    this.maxCannonAmmo = 500;
    this.cannonCooldown = 0;
    this.cannonFireRate = 0.07; // ~850 RPM cyclic bursts
    this.cannonAlternator = 0;

    this.missileCount = 6;
    this.maxMissiles = 6;
    this.missileCooldown = 0;
    this.missileReloadTimer = 0;

    this.flareCount = 12;
    this.maxFlares = 12;
    this.flareCooldown = 0;

    // Weapon Projectiles
    this.bullets = [];
    this.missiles = [];

    // Target lock info
    this.lockedTarget = null;
    this.lockProgress = 0; // 0 to 1.0

    // Jet dimensions
    this.width = 110;
    this.height = 160;

    // Power-Up System States
    this.shieldActive = false;
    this.shieldHealth = 0;
    this.shieldMaxHealth = 100;
    this.shieldPulse = 0;
    this.quadCannonTimer = 0;
    this.salvoModeTimer = 0;

    // Sound cooldown
    this.cannonSoundTimer = 0;
  }

  reset() {
    this.x = this.runtime.V_WIDTH / 2;
    this.y = this.runtime.V_HEIGHT * 0.78;
    this.vx = 0;
    this.vy = 0;
    this.roll = 0;
    this.targetRoll = 0;
    this.speed = 600;
    this.health = 100;
    this.isAlive = true;
    this.invulnerableTimer = 2.0;
    this.cannonAmmo = 500;
    this.missileCount = 6;
    this.flareCount = 12;
    this.bullets.length = 0;
    this.missiles.length = 0;
    this.lockedTarget = null;
    this.lockProgress = 0;

    // Reset Power-Ups
    this.shieldActive = false;
    this.shieldHealth = 0;
    this.shieldPulse = 0;
    this.quadCannonTimer = 0;
    this.salvoModeTimer = 0;
  }

  update(dt, enemies) {
    if (!this.isAlive) {
      this._updateProjectiles(dt);
      return;
    }

    if (this.invulnerableTimer > 0) {
      this.invulnerableTimer -= dt;
    }

    const inp = this.runtime.input;

    // 1. Throttle & Afterburner
    this.isBoosting = inp.boostAfterburner;
    const targetSpeed = this.isBoosting ? 1350 : 620;
    this.speed += (targetSpeed - this.speed) * 4.0 * dt;
    this.throttle = (this.speed - 400) / 950;

    // Audio engine throttle update
    window.AudioEngine.updateEngine(this.throttle, this.isBoosting);

    // 2. Flight Steering & Aerodynamics
    let steerX = 0;
    let steerY = 0;

    if (inp.isSteering) {
      // Direct mouse / touch flight-stick steering with smooth inertia
      const dx = inp.targetX - this.x;
      const dy = inp.targetY - this.y;
      const dist = Math.hypot(dx, dy);

      if (dist > 10) {
        steerX = Math.max(-1, Math.min(1, dx / 140));
        steerY = Math.max(-1, Math.min(1, dy / 140));
      }
    } else {
      // Keyboard WASD / Arrows steering
      steerX = inp.axisX;
      steerY = inp.axisY;
    }

    // Aerodynamic Acceleration
    const accelRate = this.isBoosting ? 2600 : 1800;
    const drag = 5.2;

    this.vx += steerX * accelRate * dt;
    this.vy += steerY * accelRate * dt;

    // Drag / damping
    this.vx -= this.vx * drag * dt;
    this.vy -= this.vy * drag * dt;

    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // Clamp inside viewport
    const pad = 60;
    if (this.x < pad) { this.x = pad; this.vx = 0; }
    if (this.x > this.runtime.V_WIDTH - pad) { this.x = this.runtime.V_WIDTH - pad; this.vx = 0; }
    if (this.y < pad + 150) { this.y = pad + 150; this.vy = 0; }
    if (this.y > this.runtime.V_HEIGHT - pad - 60) { this.y = this.runtime.V_HEIGHT - pad - 60; this.vy = 0; }

    // 3. 3D Banking Roll Dynamics
    this.targetRoll = Math.max(-1, Math.min(1, this.vx / 380));
    this.roll += (this.targetRoll - this.roll) * 10 * dt;

    // Update power-up timers
    if (this.quadCannonTimer > 0) this.quadCannonTimer -= dt;
    if (this.salvoModeTimer > 0) this.salvoModeTimer -= dt;
    if (this.shieldActive) this.shieldPulse += dt * 3.0;

    // Dynamic G-Force calculation
    const lateralAccel = Math.abs(steerX) * 4.5;
    const forwardAccel = this.isBoosting ? 2.5 : 0;
    this.gForce = 1.0 + lateralAccel + forwardAccel;

    // 4. Afterburner Particles & Engine Ribbon Light Trails
    this._spawnEngineParticles(dt);

    // 5. Target Lock Acquisition for Fox-2 Missiles
    this._acquireTargetLock(dt, enemies);

    // 6. Weapons Management
    this._handleWeapons(dt);

    // 7. Projectiles (Bullets & Missiles)
    this._updateProjectiles(dt);

    // 8. Critical Damage Smoke
    if (this.health < 40) {
      this.particles.addSmoke(
        this.x + (Math.random() - 0.5) * 20,
        this.y + 40,
        -this.vx * 0.3,
        200,
        24,
        1.0,
        'rgba(30, 32, 35,',
        40
      );
    }
  }

  _spawnEngineParticles(dt) {
    const exhaustY = this.y + 65;
    const nozzleOffsets = [-16, 16];

    nozzleOffsets.forEach((offX, idx) => {
      const exX = this.x + offX * (1 - Math.abs(this.roll) * 0.35);

      // Continuous high-contrast ribbon light trail
      const trailColor = this.isBoosting ? '#00f0ff' : '#0284c7';
      const trailWidth = this.isBoosting ? 8 : 5;
      this.particles.addRibbonPoint(`player_eng_${idx}`, exX, exhaustY + 6, trailColor, trailWidth, this.isBoosting ? 0.35 : 0.22);

      if (this.isBoosting) {
        // Blazing afterburner flame
        this.particles.addSmoke(
          exX,
          exhaustY + 10,
          (Math.random() - 0.5) * 20,
          400 + Math.random() * 200,
          14,
          0.18,
          'rgba(0, 180, 255,',
          15
        );
      } else {
        if (Math.random() < 0.3) {
          this.particles.addSmoke(
            exX,
            exhaustY + 8,
            0,
            240,
            10,
            0.15,
            'rgba(255, 140, 50,',
            12
          );
        }
      }
    });
  }

  _acquireTargetLock(dt, enemies) {
    if (!enemies || enemies.length === 0) {
      this.lockedTarget = null;
      this.lockProgress = 0;
      return;
    }

    let bestDist = 1200;
    let candidate = null;

    for (const e of enemies) {
      if (!e.isAlive) continue;
      const dx = e.x - this.x;
      const dy = e.y - this.y;

      if (dy < 0 && Math.abs(dx) < 360) {
        const dist = Math.hypot(dx, dy);
        if (dist < bestDist) {
          bestDist = dist;
          candidate = e;
        }
      }
    }

    if (candidate) {
      this.lockedTarget = candidate;
      const prevLock = this.lockProgress >= 1.0;
      this.lockProgress = Math.min(1.0, this.lockProgress + dt * 2.8);

      if (this.lockProgress >= 1.0 && !prevLock) {
        window.AudioEngine.playLockTone();
      }
    } else {
      this.lockedTarget = null;
      this.lockProgress = Math.max(0, this.lockProgress - dt * 3.5);
    }
  }

  _handleWeapons(dt) {
    const inp = this.runtime.input;
    const isQuad = this.quadCannonTimer > 0;

    // A. 20mm Vulcan Rotary Cannon
    this.cannonCooldown -= dt;
    this.cannonSoundTimer -= dt;

    const fireRate = isQuad ? 0.038 : this.cannonFireRate;

    if (inp.fireCannon && this.cannonCooldown <= 0 && this.cannonAmmo > 0) {
      this.cannonCooldown = fireRate;
      this.cannonAmmo--;

      if (isQuad) {
        // Quad stream: 4 simultaneous high-velocity tracer rounds!
        [-46, -20, 20, 46].forEach(muzzleOffX => {
          const mX = this.x + muzzleOffX;
          const mY = this.y - 25;
          this.bullets.push({
            x: mX,
            y: mY,
            vx: this.vx * 0.3 + (Math.random() - 0.5) * 20,
            vy: -1950,
            damage: 22,
            length: 38
          });
          this.particles.addSmoke(mX, mY, 0, -220, 9, 0.12, 'rgba(255, 180, 50,', 22);
        });

        // Double casings
        [-42, 42].forEach(cX => {
          this.particles.addCasing(this.x + cX, this.y - 10, (cX > 0 ? 140 : -140) + (Math.random() - 0.5) * 40, (Math.random() - 0.5) * 80);
        });
      } else {
        // Standard dual-stream Vulcan
        this.cannonAlternator = 1 - this.cannonAlternator;
        const muzzleX = this.x + (this.cannonAlternator ? -24 : 24);
        const muzzleY = this.y - 30;

        this.bullets.push({
          x: muzzleX,
          y: muzzleY,
          vx: this.vx * 0.3 + (Math.random() - 0.5) * 15,
          vy: -1800,
          damage: 18,
          length: 32
        });

        this.particles.addCasing(
          this.x + (this.cannonAlternator ? -28 : 28),
          this.y - 10,
          (this.cannonAlternator ? -120 : 120) + (Math.random() - 0.5) * 40,
          (Math.random() - 0.5) * 80
        );
        this.particles.addSmoke(muzzleX, muzzleY, 0, -200, 8, 0.12, 'rgba(255, 200, 100,', 20);
      }

      // Sound
      if (this.cannonSoundTimer <= 0) {
        window.AudioEngine.playVulcanShot();
        this.cannonSoundTimer = isQuad ? 0.04 : 0.06;
      }
    }

    // Passive ammo resupply
    if (this.cannonAmmo < this.maxCannonAmmo) {
      this.cannonAmmo += dt * 15;
    }

    // B. AIM-9X Fox-2 Sidewinder Missiles
    this.missileCooldown -= dt;
    if (inp.launchMissile) {
      inp.launchMissile = false;
      if (this.missileCooldown <= 0 && this.missileCount > 0) {
        this._fireFox2Missile();
      }
    }

    if (this.missileCount < this.maxMissiles) {
      this.missileReloadTimer += dt;
      if (this.missileReloadTimer >= 6.0) {
        this.missileCount++;
        this.missileReloadTimer = 0;
      }
    }

    // C. Magnesium Flare Countermeasures
    this.flareCooldown -= dt;
    if (inp.deployFlares) {
      inp.deployFlares = false;
      if (this.flareCooldown <= 0 && this.flareCount > 0) {
        this._deployFlares();
      }
    }

    if (this.flareCount < this.maxFlares) {
      this.flareCount = Math.min(this.maxFlares, this.flareCount + dt * 0.5);
    }
  }

  _fireFox2Missile() {
    const isSalvo = this.salvoModeTimer > 0;
    this.missileCooldown = isSalvo ? 0.45 : 0.65;
    this.missileCount = Math.max(0, this.missileCount - (isSalvo ? 3 : 1));

    const offsets = isSalvo ? [-42, 0, 42] : [(this.missileCount % 2 === 0) ? 38 : -38];

    offsets.forEach((wingSide, idx) => {
      const startX = this.x + wingSide;
      const startY = this.y + 10;
      const spreadAngle = isSalvo ? (idx - 1) * 0.22 : 0;

      this.missiles.push({
        x: startX,
        y: startY,
        vx: this.vx * 0.5 + wingSide * 2 + Math.sin(spreadAngle) * 300,
        vy: -350,
        speed: 400,
        maxSpeed: 1750,
        accel: 2400,
        angle: -Math.PI / 2 + spreadAngle,
        target: this.lockedTarget && this.lockedTarget.isAlive ? this.lockedTarget : null,
        life: 4.5,
        smokeTimer: 0
      });
    });

    window.AudioEngine.playMissileLaunch();
    window.Runtime.addTrauma(0.15);
  }

  _deployFlares() {
    this.flareCooldown = 0.8;
    this.flareCount = Math.max(0, this.flareCount - 2);

    [-1, 1].forEach(dir => {
      this.particles.addFlare(
        this.x + dir * 30,
        this.y + 35,
        dir * (260 + Math.random() * 80),
        120 + Math.random() * 60
      );
    });

    window.AudioEngine.playFlareDeploy();
  }

  takeDamage(amount) {
    if (!this.isAlive || this.invulnerableTimer > 0) return;

    // Plasma Energy Shield Absorption
    if (this.shieldActive && this.shieldHealth > 0) {
      this.shieldHealth -= amount;
      this.particles.addShieldRipple(this.x, this.y, '#00e5ff');
      window.AudioEngine.playShieldAbsorb();
      window.Runtime.addTrauma(0.18);
      if (this.shieldHealth <= 0) {
        this.shieldActive = false;
        this.particles.addShieldRipple(this.x, this.y, '#ff3344');
      }
      return;
    }

    this.health -= amount;
    window.AudioEngine.playHitImpact();
    window.Runtime.addTrauma(0.4);

    if (this.health <= 0) {
      this.health = 0;
      this.isAlive = false;
      this.particles.addExplosion(this.x, this.y, 2.0);
    }
  }

  _updateProjectiles(dt) {
    // 1. Bullets
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      b.x += b.vx * dt;
      b.y += b.vy * dt;

      if (b.y < -50 || b.y > this.runtime.V_HEIGHT + 50) {
        this.bullets.splice(i, 1);
      }
    }

    // 2. Missiles
    for (let i = this.missiles.length - 1; i >= 0; i--) {
      const m = this.missiles[i];
      m.life -= dt;

      if (m.life <= 0) {
        this.particles.addExplosion(m.x, m.y, 0.6);
        this.missiles.splice(i, 1);
        continue;
      }

      // Proportional navigation homing towards target
      if (m.target && m.target.isAlive) {
        const targetAngle = Math.atan2(m.target.y - m.y, m.target.x - m.x);
        let diff = targetAngle - m.angle;

        // Wrap angle between -PI and PI
        while (diff < -Math.PI) diff += Math.PI * 2;
        while (diff > Math.PI) diff -= Math.PI * 2;

        const maxTurn = 5.5 * dt; // turn rate in radians/s
        m.angle += Math.max(-maxTurn, Math.min(maxTurn, diff));
      }

      // Accelerate
      m.speed = Math.min(m.maxSpeed, m.speed + m.accel * dt);
      m.vx = Math.cos(m.angle) * m.speed;
      m.vy = Math.sin(m.angle) * m.speed;

      m.x += m.vx * dt;
      m.y += m.vy * dt;

      // Exhaust smoke trail
      m.smokeTimer += dt;
      if (m.smokeTimer > 0.018) {
        m.smokeTimer = 0;
        this.particles.addSmoke(
          m.x - Math.cos(m.angle) * 18,
          m.y - Math.sin(m.angle) * 18,
          -m.vx * 0.15 + (Math.random() - 0.5) * 20,
          -m.vy * 0.15 + (Math.random() - 0.5) * 20,
          10,
          0.7,
          'rgba(235, 240, 245,',
          26
        );
      }
    }
  }

  draw(ctx) {
    // 1. Draw Bullets (20mm Vulcan Tracers)
    ctx.save();
    ctx.strokeStyle = '#facc15';
    ctx.shadowColor = '#f59e0b';
    ctx.shadowBlur = 10;
    ctx.lineWidth = 4;
    for (const b of this.bullets) {
      ctx.beginPath();
      ctx.moveTo(b.x, b.y);
      ctx.lineTo(b.x, b.y + b.length);
      ctx.stroke();
    }
    ctx.restore();

    // 2. Draw AIM-9X Missiles
    for (const m of this.missiles) {
      ctx.save();
      ctx.translate(m.x, m.y);
      ctx.rotate(m.angle + Math.PI / 2);

      // Missile Body
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(-3, -16, 6, 32);

      // Radar Radome Tip
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.moveTo(-3, -16);
      ctx.lineTo(0, -24);
      ctx.lineTo(3, -16);
      ctx.closePath();
      ctx.fill();

      // Control Fins
      ctx.fillStyle = '#475569';
      ctx.beginPath();
      ctx.moveTo(-7, 10);
      ctx.lineTo(-3, 8);
      ctx.lineTo(-3, 16);
      ctx.lineTo(-8, 16);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(7, 10);
      ctx.lineTo(3, 8);
      ctx.lineTo(3, 16);
      ctx.lineTo(8, 16);
      ctx.closePath();
      ctx.fill();

      // Rocket Nozzle Flame
      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.arc(0, 16, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    if (!this.isAlive) return;

    // 3. Draw Player Fighter Jet with 3D Banking Projection
    ctx.save();
    ctx.translate(this.x, this.y);

    // If invulnerable, flicker
    if (this.invulnerableTimer > 0 && Math.floor(Date.now() / 60) % 2 === 0) {
      ctx.globalAlpha = 0.4;
    }

    // 3D Banking Scale: horizontally squash and shift perspective
    const bankScaleX = 1 - Math.abs(this.roll) * 0.35;
    const bankSkew = this.roll * 0.15;
    ctx.scale(bankScaleX, 1);
    ctx.transform(1, 0, bankSkew, 1, 0, 0);

    // Dynamic Cast Shadow on fuselage
    const shadowOffset = this.roll * 12;

    // A. Main Stealth Fuselage & Diamond Wings (Su-57 / F-22 hybrid)
    const bodyGrad = ctx.createLinearGradient(-40 + shadowOffset, 0, 40 + shadowOffset, 0);
    bodyGrad.addColorStop(0, '#334155');
    bodyGrad.addColorStop(0.5, '#64748b');
    bodyGrad.addColorStop(1, '#1e293b');
    ctx.fillStyle = bodyGrad;
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;

    ctx.beginPath();
    // Nose cone tip
    ctx.moveTo(0, -85);
    // Left chine
    ctx.lineTo(-14, -45);
    // Left wing leading edge
    ctx.lineTo(-58, 20);
    // Left wing tip missile rail
    ctx.lineTo(-58, 35);
    // Left wing trailing edge & flaps
    ctx.lineTo(-24, 42);
    // Left engine pod & nozzle
    ctx.lineTo(-18, 68);
    ctx.lineTo(-10, 68);
    // Fuselage stinger between engines
    ctx.lineTo(0, 78);
    // Right engine nozzle
    ctx.lineTo(10, 68);
    ctx.lineTo(18, 68);
    // Right wing trailing edge
    ctx.lineTo(24, 42);
    // Right wing tip
    ctx.lineTo(58, 35);
    // Right wing leading edge
    ctx.lineTo(58, 20);
    // Right chine
    ctx.lineTo(14, -45);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // B. Twin Canted Vertical Stabilizers (Rudders)
    // Left Rudder
    ctx.fillStyle = '#475569';
    ctx.beginPath();
    ctx.moveTo(-18, 25);
    ctx.lineTo(-28 - this.roll * 10, 62);
    ctx.lineTo(-16, 60);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Right Rudder
    ctx.beginPath();
    ctx.moveTo(18, 25);
    ctx.lineTo(28 - this.roll * 10, 62);
    ctx.lineTo(16, 60);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // C. Cockpit Canopy with Golden / Cyan Glint
    const canopyGrad = ctx.createLinearGradient(0, -60, 0, -10);
    canopyGrad.addColorStop(0, '#06b6d4');
    canopyGrad.addColorStop(0.4, '#0891b2');
    canopyGrad.addColorStop(0.8, '#0f172a');
    ctx.fillStyle = canopyGrad;
    ctx.strokeStyle = '#22d3ee';
    ctx.lineWidth = 1.5;

    ctx.beginPath();
    ctx.ellipse(0, -32, 9, 26, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Glass Reflection Specular Streak
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-3, -48);
    ctx.lineTo(2, -22);
    ctx.stroke();

    // D. Afterburner Mach Diamonds & Flame Plumes
    const abPower = this.isBoosting ? 1.0 : 0.4;
    const flameLen = this.isBoosting ? 50 + Math.random() * 20 : 18 + Math.random() * 8;

    [-14, 14].forEach(nozzleX => {
      // Outer flame
      const flameGrad = ctx.createLinearGradient(nozzleX, 68, nozzleX, 68 + flameLen);
      if (this.isBoosting) {
        flameGrad.addColorStop(0, 'rgba(100, 220, 255, 0.95)');
        flameGrad.addColorStop(0.3, 'rgba(0, 140, 255, 0.8)');
        flameGrad.addColorStop(0.7, 'rgba(255, 120, 0, 0.6)');
        flameGrad.addColorStop(1, 'rgba(255, 50, 0, 0)');
      } else {
        flameGrad.addColorStop(0, 'rgba(255, 180, 50, 0.8)');
        flameGrad.addColorStop(0.6, 'rgba(255, 70, 0, 0.4)');
        flameGrad.addColorStop(1, 'rgba(200, 20, 0, 0)');
      }

      ctx.fillStyle = flameGrad;
      ctx.beginPath();
      ctx.moveTo(nozzleX - 5, 68);
      ctx.lineTo(nozzleX + 5, 68);
      ctx.lineTo(nozzleX, 68 + flameLen);
      ctx.closePath();
      ctx.fill();

      // Inner Mach Diamond nodes
      if (this.isBoosting) {
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(nozzleX, 76, 2.5, 0, Math.PI * 2);
        ctx.arc(nozzleX, 88, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // E. High-Contrast Cyan LED Wing Leading-Edge Stripes
    ctx.strokeStyle = '#00f0ff';
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 12;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-14, -45);
    ctx.lineTo(-58, 20);
    ctx.moveTo(14, -45);
    ctx.lineTo(58, 20);
    ctx.stroke();

    // Wingtip Formation Strobes
    ctx.fillStyle = (Math.floor(Date.now() / 200) % 2 === 0) ? '#00f0ff' : '#ffffff';
    ctx.beginPath();
    ctx.arc(-58, 30, 3.5, 0, Math.PI * 2);
    ctx.arc(58, 30, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // F. Quad Vulcan Extended Gun Pods (Active during Power-up)
    if (this.quadCannonTimer > 0) {
      [-46, 46].forEach(pX => {
        ctx.fillStyle = '#1e293b';
        ctx.strokeStyle = '#f97316';
        ctx.lineWidth = 2;
        ctx.fillRect(pX - 4, -5, 8, 24);
        ctx.strokeRect(pX - 4, -5, 8, 24);

        // Glowing red-hot barrel muzzle
        ctx.fillStyle = '#ff4400';
        ctx.shadowColor = '#ff4400';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(pX, -6, 3, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    ctx.restore();

    // G. Hexagonal Plasma Energy Shield Bubble (Rendered in world space around jet)
    if (this.shieldActive && this.shieldHealth > 0) {
      ctx.save();
      ctx.translate(this.x, this.y);
      const shieldRatio = Math.max(0.2, this.shieldHealth / this.shieldMaxHealth);
      const sRadius = 96 + Math.sin(this.shieldPulse) * 4;

      // Glowing spherical aura
      const sGrad = ctx.createRadialGradient(0, 0, sRadius * 0.65, 0, 0, sRadius);
      sGrad.addColorStop(0, 'rgba(0, 229, 255, 0.04)');
      sGrad.addColorStop(0.8, `rgba(0, 229, 255, ${0.22 * shieldRatio})`);
      sGrad.addColorStop(1, `rgba(0, 255, 255, ${0.75 * shieldRatio})`);
      ctx.fillStyle = sGrad;
      ctx.beginPath();
      ctx.arc(0, 0, sRadius, 0, Math.PI * 2);
      ctx.fill();

      // Rotating Hexagonal Forcefield Grid
      ctx.strokeStyle = `rgba(0, 255, 255, ${0.85 * shieldRatio})`;
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 16;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 + this.shieldPulse * 0.45;
        const hx = Math.cos(a) * sRadius;
        const hy = Math.sin(a) * sRadius;
        if (i === 0) ctx.moveTo(hx, hy);
        else ctx.lineTo(hx, hy);
      }
      ctx.closePath();
      ctx.stroke();

      // Outer shimmering ring
      ctx.strokeStyle = `rgba(165, 243, 252, ${0.5 * shieldRatio})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, 0, sRadius + 6, 0, Math.PI * 2);
      ctx.stroke();

      ctx.restore();
    }
  }
}

window.FighterJet = FighterJet;

