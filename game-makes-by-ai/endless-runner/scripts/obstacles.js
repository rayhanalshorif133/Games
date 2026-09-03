/**
 * Obstacle Manager & Hazard Generator
 * Generates fair, randomized obstacle patterns with jump hurdles, slide beams, and tall blockades.
 */

// Obstacle Types
const ObstacleType = {
  HURDLE: 'HURDLE',     // Ground barrier: MUST JUMP over or dodge
  LASER_BEAM: 'LASER',  // High overhead beam: MUST SLIDE under or dodge
  TALL_BLOCK: 'BLOCK'   // Full vertical wall / drone: MUST DODGE lane
};

class Obstacle {
  constructor(type, lane, z) {
    this.type = type;
    this.lane = lane; // -1, 0, or 1
    this.z = z;
    this.active = true;

    // Dimensions
    if (this.type === ObstacleType.HURDLE) {
      this.bottomY = 0;
      this.height = 85;
      this.width = 180;
    } else if (this.type === ObstacleType.LASER_BEAM) {
      this.bottomY = 75; // Safe clearance under beam is 75
      this.height = 110;
      this.width = 200;
    } else { // TALL_BLOCK
      this.bottomY = 0;
      this.height = 240;
      this.width = 180;
    }
  }

  draw(ctx, camera) {
    if (!this.active) return;
    const proj = camera.project(this.lane, this.bottomY, this.z);
    if (!proj || !proj.visible) return;

    const s = proj.scale;
    const w = this.width * s;
    const h = this.height * s;
    const x = proj.x;
    const y = proj.y; // Bottom position on screen

    ctx.save();
    ctx.translate(x, y);

    if (this.type === ObstacleType.HURDLE) {
      // 1. Ground Hurdle (Neon road hazard with warning stripes)
      ctx.fillStyle = '#0f1738';
      ctx.strokeStyle = '#ff0077';
      ctx.lineWidth = Math.max(2, 6 * s);

      // Hurdle base posts
      ctx.beginPath();
      ctx.rect(-w / 2, -h, w, h);
      ctx.fill();
      ctx.stroke();

      // Warning hazard diagonal stripes
      ctx.save();
      ctx.clip();
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = Math.max(2, 10 * s);
      for (let sx = -w; sx < w; sx += 25 * s) {
        ctx.beginPath();
        ctx.moveTo(sx, 0);
        ctx.lineTo(sx + 30 * s, -h);
        ctx.stroke();
      }
      ctx.restore();

      // Top glowing warning light
      ctx.fillStyle = '#ff0077';
      ctx.shadowColor = '#ff0077';
      ctx.shadowBlur = 10 * s;
      ctx.beginPath();
      ctx.arc(-w / 2 + 12 * s, -h + 8 * s, 6 * s, 0, Math.PI * 2);
      ctx.arc(w / 2 - 12 * s, -h + 8 * s, 6 * s, 0, Math.PI * 2);
      ctx.fill();

    } else if (this.type === ObstacleType.LASER_BEAM) {
      // 2. High Hanging Overhead Laser Beam (Must Slide)
      ctx.strokeStyle = '#4a5d8e';
      ctx.lineWidth = Math.max(2, 8 * s);

      // Support Posts coming down from above
      ctx.beginPath();
      ctx.moveTo(-w / 2, -h - 80 * s);
      ctx.lineTo(-w / 2, 0);
      ctx.moveTo(w / 2, -h - 80 * s);
      ctx.lineTo(w / 2, 0);
      ctx.stroke();

      // Laser Emitter Bar
      ctx.fillStyle = '#10193a';
      ctx.fillRect(-w / 2, -h, w, h);

      // Pulsing Laser Field
      const time = performance.now() * 0.005;
      const alpha = 0.7 + Math.sin(time * 5) * 0.3;
      ctx.strokeStyle = `rgba(0, 240, 255, ${alpha})`;
      ctx.lineWidth = Math.max(3, 12 * s);
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 15 * s;

      ctx.beginPath();
      ctx.moveTo(-w / 2, -h + h / 2);
      ctx.lineTo(w / 2, -h + h / 2);
      ctx.stroke();

      // Slide Warning Icon / Text
      if (s > 0.45) {
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${Math.floor(18 * s)}px -apple-system, sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText('▼ SLIDE ▼', 0, -h + h / 2 + 6 * s);
      }

    } else {
      // 3. Tall Cyber Blockade / Hover Container
      ctx.fillStyle = '#121a3b';
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = Math.max(2, 6 * s);

      ctx.beginPath();
      ctx.roundRect(-w / 2, -h, w, h, 8 * s);
      ctx.fill();
      ctx.stroke();

      // Container cross braces
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
      ctx.lineWidth = Math.max(1, 4 * s);
      ctx.beginPath();
      ctx.moveTo(-w / 2 + 10 * s, -10 * s);
      ctx.lineTo(w / 2 - 10 * s, -h + 10 * s);
      ctx.moveTo(w / 2 - 10 * s, -10 * s);
      ctx.lineTo(-w / 2 + 10 * s, -h + 10 * s);
      ctx.stroke();

      // Hazard skull / caution sign
      ctx.fillStyle = '#ff0077';
      ctx.shadowColor = '#ff0077';
      ctx.shadowBlur = 12 * s;
      ctx.beginPath();
      ctx.arc(0, -h * 0.6, 18 * s, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      if (s > 0.4) {
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${Math.floor(20 * s)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText('!', 0, -h * 0.6 + 7 * s);
      }
    }

    ctx.restore();
  }
}

class ObstacleManager {
  constructor(runtime) {
    this.runtime = runtime;
    this.obstacles = [];
    this.spawnDistance = 2400; // Far at horizon
    this.lastSpawnZ = 0;
    this.minGap = 850; // Distance between consecutive obstacle rows
  }

  reset() {
    this.obstacles = [];
    this.lastSpawnZ = 0;
  }

  update(dt, speed) {
    // Move obstacles towards player
    const moveZ = speed * dt;

    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obs = this.obstacles[i];
      obs.z -= moveZ;

      // Despawn once behind player camera
      if (obs.z < -100) {
        this.obstacles.splice(i, 1);
      }
    }

    // Spawn new obstacles as needed
    this.checkSpawn();
  }

  checkSpawn() {
    // Find the furthest obstacle currently in the world
    let furthestZ = 0;
    for (const obs of this.obstacles) {
      if (obs.z > furthestZ) furthestZ = obs.z;
    }

    // If there's room before horizon, spawn new obstacle wave
    if (furthestZ < this.spawnDistance) {
      const nextZ = Math.max(furthestZ + this.minGap, 1200);
      this.spawnPattern(nextZ);
    }
  }

  spawnPattern(z) {
    // Always guarantee at least 1 safe lane!
    const safeLane = [-1, 0, 1][Math.floor(Math.random() * 3)];
    const dangerLanes = [-1, 0, 1].filter(l => l !== safeLane);

    // Randomize pattern types
    const rand = Math.random();

    if (rand < 0.35) {
      // Single hurdle in one lane
      const lane = dangerLanes[Math.floor(Math.random() * dangerLanes.length)];
      this.obstacles.push(new Obstacle(ObstacleType.HURDLE, lane, z));
    } else if (rand < 0.65) {
      // Overhead laser beam (must slide or dodge)
      const lane = dangerLanes[Math.floor(Math.random() * dangerLanes.length)];
      this.obstacles.push(new Obstacle(ObstacleType.LASER_BEAM, lane, z));
    } else if (rand < 0.85) {
      // Two obstacles, leaving safeLane completely clear
      this.obstacles.push(new Obstacle(ObstacleType.TALL_BLOCK, dangerLanes[0], z));
      const secondType = Math.random() > 0.5 ? ObstacleType.HURDLE : ObstacleType.LASER_BEAM;
      this.obstacles.push(new Obstacle(secondType, dangerLanes[1], z));
    } else {
      // Jump hurdle across two lanes
      this.obstacles.push(new Obstacle(ObstacleType.HURDLE, dangerLanes[0], z));
      this.obstacles.push(new Obstacle(ObstacleType.HURDLE, dangerLanes[1], z));
    }
  }

  checkCollision(player) {
    const pb = player.getBounds();
    const collisionDepthTolerance = 90; // Depth threshold near player z = 0

    for (const obs of this.obstacles) {
      if (!obs.active) continue;

      // Depth check: Is the obstacle passing right through player's z position?
      if (obs.z <= collisionDepthTolerance && obs.z >= -40) {
        // Lane check: Is player in the same lane?
        const laneDiff = Math.abs(obs.lane - pb.laneX);
        if (laneDiff < 0.65) {
          // Vertical Collision Check based on Obstacle Type
          if (obs.type === ObstacleType.HURDLE) {
            // Hurdle: if player is NOT jumping high enough -> collision!
            if (pb.y < obs.height - 15) {
              return obs;
            }
          } else if (obs.type === ObstacleType.LASER_BEAM) {
            // Overhead Laser: if player is NOT sliding low -> collision!
            if (!pb.isSliding && pb.top > obs.bottomY + 10) {
              return obs;
            }
          } else if (obs.type === ObstacleType.TALL_BLOCK) {
            // Tall Block: fatal unless in different lane
            return obs;
          }
        }
      }
    }
    return null;
  }

  getRenderables() {
    return this.obstacles.filter(o => o.active).map(o => ({
      z: o.z,
      render: (ctx, cam) => o.draw(ctx, cam)
    }));
  }
}

window.ObstacleManager = ObstacleManager;
window.ObstacleType = ObstacleType;

