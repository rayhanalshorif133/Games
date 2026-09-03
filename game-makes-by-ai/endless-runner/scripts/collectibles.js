/**
 * Collectibles & Power-Ups Manager
 * Manages gold coin ribbons, arcs, magnet attraction physics, and power-up orbs.
 */

const PowerupType = {
  MAGNET: 'magnet',
  SHIELD: 'shield',
  MULTIPLIER: '2x',
  BOOST: 'boost'
};

class CollectibleItem {
  constructor(type, lane, z, y = 30) {
    this.type = type; // 'coin' | 'powerup'
    this.powerupType = type === 'powerup' ? arguments[4] : null;
    this.lane = lane;
    this.z = z;
    this.y = y; // Height above track
    this.active = true;
    this.radius = 45;
    this.spin = Math.random() * Math.PI * 2;
  }

  draw(ctx, camera) {
    if (!this.active) return;
    const proj = camera.project(this.lane, this.y, this.z);
    if (!proj || !proj.visible) return;

    const s = proj.scale;
    const x = proj.x;
    const y = proj.y;

    ctx.save();
    ctx.translate(x, y);

    if (this.type === 'coin') {
      // Spinning Gold Coin
      const spinScale = Math.cos(this.spin);
      const r = 32 * s;

      // Drop shadow on ground
      const groundProj = camera.project(this.lane, 0, this.z);
      if (groundProj) {
        ctx.save();
        ctx.translate(0, groundProj.groundY - y);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
        ctx.beginPath();
        ctx.ellipse(0, 0, 20 * s, 8 * s, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Coin Outer Rim
      ctx.fillStyle = '#ffb703';
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = Math.max(2, 5 * s);
      ctx.beginPath();
      ctx.ellipse(0, 0, Math.max(3, Math.abs(r * spinScale)), r, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Coin Inner Star/Emboss
      if (Math.abs(spinScale) > 0.4) {
        ctx.fillStyle = '#fff3b0';
        ctx.beginPath();
        ctx.ellipse(0, 0, Math.max(1, Math.abs(r * 0.5 * spinScale)), r * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();
      }

    } else {
      // Glowing Power-up Sphere
      const r = 45 * s;
      const pulse = 1 + Math.sin(this.spin * 3) * 0.1;

      // Color scheme based on powerup
      let color = '#00f0ff';
      let icon = '⚡';

      if (this.powerupType === PowerupType.SHIELD) {
        color = '#00f0ff';
        icon = '🛡️';
      } else if (this.powerupType === PowerupType.MAGNET) {
        color = '#ff0077';
        icon = '🧲';
      } else if (this.powerupType === PowerupType.MULTIPLIER) {
        color = '#ffd700';
        icon = '2X';
      } else if (this.powerupType === PowerupType.BOOST) {
        color = '#ff5400';
        icon = '🚀';
      }

      // Outer Glow Orb
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 18 * s;
      ctx.globalAlpha = 0.35;
      ctx.beginPath();
      ctx.arc(0, 0, r * pulse * 1.3, 0, Math.PI * 2);
      ctx.fill();

      // Core Orb
      ctx.globalAlpha = 0.9;
      ctx.fillStyle = '#070b19';
      ctx.strokeStyle = color;
      ctx.lineWidth = Math.max(2, 6 * s);
      ctx.beginPath();
      ctx.arc(0, 0, r * pulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Icon Text
      if (s > 0.3) {
        ctx.globalAlpha = 1.0;
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${Math.floor(28 * s)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(icon, 0, 2 * s);
      }
    }

    ctx.restore();
  }
}

class CollectibleManager {
  constructor(runtime) {
    this.runtime = runtime;
    this.items = [];
    this.spawnDistance = 2400;
    this.lastPowerupDistance = 0;
  }

  reset() {
    this.items = [];
    this.lastPowerupDistance = 0;
  }

  update(dt, speed, player) {
    const moveZ = speed * dt;
    const time = performance.now() * 0.005;

    for (let i = this.items.length - 1; i >= 0; i--) {
      const item = this.items[i];
      item.z -= moveZ;
      item.spin += dt * 5;

      // Magnet Attraction Physics: pull coins towards player when Magnet is active
      if (item.type === 'coin' && player && player.isMagnet && !player.isDead) {
        const distZ = Math.abs(item.z);
        if (distZ < 900) {
          // Accelerate coin laterally towards player's lane
          item.lane += (player.laneX - item.lane) * Math.min(1, 14 * dt);
          // Pull height towards player center
          item.y += (player.y + 70 - item.y) * Math.min(1, 14 * dt);
        }
      }

      // Despawn if behind camera
      if (item.z < -60) {
        this.items.splice(i, 1);
      }
    }

    // Spawn regular coin waves
    this.checkSpawn(player);
  }

  checkSpawn(player) {
    let furthestZ = 0;
    for (const item of this.items) {
      if (item.z > furthestZ) furthestZ = item.z;
    }

    if (furthestZ < this.spawnDistance) {
      const startZ = Math.max(furthestZ + 400, 1400);
      this.spawnPattern(startZ);
    }
  }

  spawnPattern(startZ) {
    const lane = [-1, 0, 1][Math.floor(Math.random() * 3)];
    const patternType = Math.random();

    if (patternType < 0.6) {
      // Straight line of 5 coins
      for (let i = 0; i < 5; i++) {
        this.items.push(new CollectibleItem('coin', lane, startZ + i * 140, 30));
      }
    } else if (patternType < 0.85) {
      // Parabolic Arc of coins (encourages jumping!)
      const count = 7;
      for (let i = 0; i < count; i++) {
        const t = i / (count - 1);
        const arcY = 30 + Math.sin(t * Math.PI) * 160;
        this.items.push(new CollectibleItem('coin', lane, startZ + i * 120, arcY));
      }
    } else {
      // Double lane ribbon
      const lane2 = lane === 0 ? (Math.random() > 0.5 ? -1 : 1) : 0;
      for (let i = 0; i < 4; i++) {
        this.items.push(new CollectibleItem('coin', lane, startZ + i * 140, 30));
        this.items.push(new CollectibleItem('coin', lane2, startZ + i * 140, 30));
      }
    }

    // Spawn power-up periodically
    const distSinceLast = this.runtime.distance - this.lastPowerupDistance;
    if (distSinceLast > 120 && Math.random() < 0.4) {
      this.lastPowerupDistance = this.runtime.distance;
      const powerups = [PowerupType.SHIELD, PowerupType.MAGNET, PowerupType.MULTIPLIER, PowerupType.BOOST];
      const selected = powerups[Math.floor(Math.random() * powerups.length)];
      const pLane = [-1, 0, 1][Math.floor(Math.random() * 3)];
      this.items.push(new CollectibleItem('powerup', pLane, startZ + 750, 70, selected));
    }
  }

  checkCollisions(player, onCollect) {
    const pb = player.getBounds();
    const collectToleranceZ = 85;

    for (const item of this.items) {
      if (!item.active) continue;

      if (Math.abs(item.z) < collectToleranceZ) {
        const laneDiff = Math.abs(item.lane - pb.laneX);
        if (laneDiff < 0.65) {
          // Vertical check
          const yDiff = Math.abs(item.y - (pb.y + 60));
          if (yDiff < 120) {
            item.active = false;
            onCollect(item.type, item.powerupType);
          }
        }
      }
    }
  }

  getRenderables() {
    return this.items.filter(it => it.active).map(it => ({
      z: it.z,
      render: (ctx, cam) => it.draw(ctx, cam)
    }));
  }
}

window.CollectibleManager = CollectibleManager;
window.PowerupType = PowerupType;

