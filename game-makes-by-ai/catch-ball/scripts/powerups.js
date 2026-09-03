/**
 * Airdrop Tactical Supply Crates & Power-Up System
 * Spawns parachuting supply capsules containing Quad Vulcan Overdrive,
 * Plasma Energy Shield, Fox-2 Missile Salvo, Field Repair, and Tactical EMP.
 */

class PowerupSystem {
  constructor(runtime, particles) {
    this.runtime = runtime;
    this.particles = particles;
    this.crates = [];

    // Drop interval timer
    this.dropTimer = 0;
    this.nextDropInterval = 14; // Drops every 14-20 seconds
  }

  reset() {
    this.crates.length = 0;
    this.dropTimer = 0;
    this.nextDropInterval = 10; // Early drop in Wave 1
  }

  /**
   * Spawn an airdrop crate at (x, y) or random X at top
   */
  spawnCrate(x = null, y = -100, specificType = null) {
    const types = [
      {
        id: 'QUAD_VULCAN',
        name: 'QUAD VULCAN OVERDRIVE',
        shortName: '4x GUN',
        color: '#ff6600',
        glowColor: 'rgba(255, 102, 0, 0.6)'
      },
      {
        id: 'PLASMA_SHIELD',
        name: 'PLASMA ENERGY SHIELD',
        shortName: 'SHIELD',
        color: '#00e5ff',
        glowColor: 'rgba(0, 229, 255, 0.6)'
      },
      {
        id: 'MISSILE_SALVO',
        name: 'FOX-2 MISSILE SALVO',
        shortName: 'SALVO',
        color: '#facc15',
        glowColor: 'rgba(250, 204, 21, 0.6)'
      },
      {
        id: 'FIELD_REPAIR',
        name: 'NANO-HULL REPAIR KIT',
        shortName: 'REPAIR',
        color: '#22c55e',
        glowColor: 'rgba(34, 197, 94, 0.6)'
      },
      {
        id: 'TACTICAL_EMP',
        name: 'TACTICAL EMP NUKE',
        shortName: 'EMP',
        color: '#a855f7',
        glowColor: 'rgba(168, 85, 247, 0.6)'
      }
    ];

    const chosenType = specificType || types[Math.floor(Math.random() * types.length)];
    const spawnX = x !== null ? x : 160 + Math.random() * (this.runtime.V_WIDTH - 320);

    this.crates.push({
      type: chosenType.id,
      name: chosenType.name,
      shortName: chosenType.shortName,
      color: chosenType.color,
      glowColor: chosenType.glowColor,
      x: spawnX,
      y: y,
      vx: 0,
      vy: 140, // Gentle descent
      baseX: spawnX,
      swayOffset: Math.random() * Math.PI * 2,
      pulseTimer: 0,
      radius: 36,
      collected: false
    });
  }

  update(dt, player, enemySystem, onMessage) {
    // 1. Natural Airdrop Schedule
    this.dropTimer += dt;
    if (this.dropTimer >= this.nextDropInterval) {
      this.dropTimer = 0;
      this.nextDropInterval = 16 + Math.random() * 8;
      this.spawnCrate();
    }

    // 2. Update Active Crates
    for (let i = this.crates.length - 1; i >= 0; i--) {
      const c = this.crates[i];
      c.pulseTimer += dt;

      // Parachute sway physics
      c.x = c.baseX + Math.sin(c.pulseTimer * 1.8 + c.swayOffset) * 45;
      c.y += c.vy * dt;

      // Magnetic Attraction if Player gets close (< 180px)
      const distToPlayer = Math.hypot(player.x - c.x, player.y - c.y);
      if (distToPlayer < 180 && player.isAlive) {
        const pullSpeed = (180 - distToPlayer) * 4.5;
        const angle = Math.atan2(player.y - c.y, player.x - c.x);
        c.baseX += Math.cos(angle) * pullSpeed * dt;
        c.y += Math.sin(angle) * pullSpeed * dt;
      }

      // Check Collision with Player Fighter Jet
      if (player.isAlive && distToPlayer < c.radius + 45) {
        this._applyPowerup(c, player, enemySystem, onMessage);
        this.crates.splice(i, 1);
        continue;
      }

      // Offscreen cleanup
      if (c.y > this.runtime.V_HEIGHT + 150) {
        this.crates.splice(i, 1);
      }
    }
  }

  _applyPowerup(crate, player, enemySystem, onMessage) {
    window.AudioEngine.playPowerupPickup();
    this.particles.addPickupSparks(crate.x, crate.y, crate.color);

    switch (crate.type) {
      case 'QUAD_VULCAN':
        player.quadCannonTimer = 18.0; // 18 seconds of 4-barrel rotary cannon
        onMessage('>>> QUAD VULCAN OVERDRIVE [18s] <<<', crate.color);
        break;

      case 'PLASMA_SHIELD':
        player.shieldActive = true;
        player.shieldHealth = 100;
        player.shieldMaxHealth = 100;
        onMessage('>>> PLASMA ENERGY SHIELD ONLINE <<<', crate.color);
        break;

      case 'MISSILE_SALVO':
        player.missileCount = player.maxMissiles;
        player.salvoModeTimer = 16.0; // 16s of 3-missile salvo
        onMessage('>>> FOX-2 TRIPLE SALVO ARMED <<<', crate.color);
        break;

      case 'FIELD_REPAIR':
        player.health = Math.min(player.maxHealth, player.health + 55);
        player.cannonAmmo = player.maxCannonAmmo;
        player.flareCount = player.maxFlares;
        onMessage('>>> NANO-HULL FIELD REPAIR COMPLETE <<<', crate.color);
        break;

      case 'TACTICAL_EMP':
        this.particles.addEmpWave(player.x, player.y);
        // Wipe all enemy bullets and missiles on screen
        if (enemySystem) {
          enemySystem.enemyBullets.length = 0;
          enemySystem.enemyMissiles.length = 0;
          // Damage all active enemies
          for (const e of enemySystem.enemies) {
            e.takeDamage(75, this.particles);
          }
        }
        onMessage('>>> TACTICAL EMP DETONATED! HOSTILES NEUTRALIZED <<<', crate.color);
        break;
    }
  }

  draw(ctx) {
    for (const c of this.crates) {
      ctx.save();
      ctx.translate(c.x, c.y);

      // 1. Parachute Canopy (Illuminated semi-transparent military nylon)
      const chuteY = -65;
      const chuteWidth = 72;
      const chuteHeight = 36;

      // Suspension Rigging Lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(-chuteWidth * 0.45, chuteY + 10);
      ctx.lineTo(0, -12);
      ctx.moveTo(-chuteWidth * 0.15, chuteY + 12);
      ctx.lineTo(0, -12);
      ctx.moveTo(chuteWidth * 0.15, chuteY + 12);
      ctx.lineTo(0, -12);
      ctx.moveTo(chuteWidth * 0.45, chuteY + 10);
      ctx.lineTo(0, -12);
      ctx.stroke();

      // Parachute Dome
      const chuteGrad = ctx.createLinearGradient(0, chuteY - chuteHeight, 0, chuteY + 10);
      chuteGrad.addColorStop(0, '#ffffff');
      chuteGrad.addColorStop(0.4, c.color);
      chuteGrad.addColorStop(1, 'rgba(15, 23, 42, 0.8)');
      ctx.fillStyle = chuteGrad;
      ctx.strokeStyle = c.color;
      ctx.lineWidth = 2;

      ctx.beginPath();
      ctx.moveTo(-chuteWidth / 2, chuteY + 10);
      ctx.quadraticCurveTo(0, chuteY - chuteHeight * 1.5, chuteWidth / 2, chuteY + 10);
      ctx.quadraticCurveTo(0, chuteY + 18, -chuteWidth / 2, chuteY + 10);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // 2. Pulsing Holographic Beacon Ring around container
      const pulseScale = 1 + Math.sin(c.pulseTimer * 5) * 0.15;
      ctx.save();
      ctx.scale(pulseScale, pulseScale);
      ctx.strokeStyle = c.color;
      ctx.shadowColor = c.color;
      ctx.shadowBlur = 15;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, 0, c.radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // 3. High-Tech Supply Crate Container
      const boxSize = 42;
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-boxSize / 2, -boxSize / 2, boxSize, boxSize);

      ctx.strokeStyle = c.color;
      ctx.lineWidth = 2.5;
      ctx.strokeRect(-boxSize / 2, -boxSize / 2, boxSize, boxSize);

      // Corner reinforce brackets
      ctx.fillStyle = c.color;
      const bLen = 8;
      ctx.fillRect(-boxSize / 2, -boxSize / 2, bLen, 3);
      ctx.fillRect(-boxSize / 2, -boxSize / 2, 3, bLen);
      ctx.fillRect(boxSize / 2 - bLen, -boxSize / 2, bLen, 3);
      ctx.fillRect(boxSize / 2 - 3, -boxSize / 2, 3, bLen);
      ctx.fillRect(-boxSize / 2, boxSize / 2 - 3, bLen, 3);
      ctx.fillRect(-boxSize / 2, boxSize / 2 - bLen, 3, bLen);
      ctx.fillRect(boxSize / 2 - bLen, boxSize / 2 - 3, bLen, 3);
      ctx.fillRect(boxSize / 2 - 3, boxSize / 2 - bLen, 3, bLen);

      // Central Indicator Glow & Icon Label
      ctx.font = 'bold 12px "Orbitron", sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = c.color;
      ctx.shadowBlur = 8;
      ctx.fillText(c.shortName, 0, 0);

      ctx.restore();
    }
  }
}

window.PowerupSystem = PowerupSystem;

