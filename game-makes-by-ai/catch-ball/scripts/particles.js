/**
 * High-Fidelity Particle & Visual Effects Engine
 * Simulates realistic military smoke trails, flare countermeasures,
 * engine ribbon light trails, afterburner Mach shock diamonds,
 * shield impact ripples, power-up spark bursts, multi-stage explosions, and EMP shockwaves.
 */
class ParticleSystem {
  constructor() {
    this.particles = [];
    this.debris = [];
    this.shockwaves = [];
    this.flares = [];
    this.casings = [];
    this.ribbonTrails = {}; // Map of trailId -> array of points {x, y, age, maxAge, width, color}
    this.shieldRipples = [];
    this.pickupSparks = [];
  }

  reset() {
    this.particles.length = 0;
    this.debris.length = 0;
    this.shockwaves.length = 0;
    this.flares.length = 0;
    this.casings.length = 0;
    this.ribbonTrails = {};
    this.shieldRipples.length = 0;
    this.pickupSparks.length = 0;
  }

  /**
   * Spawn expanding smoke puffs (Missile exhaust, engine smoke, or damage)
   */
  addSmoke(x, y, vx, vy, size = 12, maxAge = 0.8, color = 'rgba(220, 225, 230,', growth = 30) {
    this.particles.push({
      type: 'smoke',
      x, y,
      vx, vy,
      size,
      currentSize: size,
      growth,
      age: 0,
      maxAge,
      baseColor: color,
      rotation: Math.random() * Math.PI * 2,
      vRot: (Math.random() - 0.5) * 3
    });
  }

  /**
   * Continuous glowing engine ribbon light trail point
   */
  addRibbonPoint(trailId, x, y, color = '#00e5ff', width = 6, maxAge = 0.28) {
    if (!this.ribbonTrails[trailId]) {
      this.ribbonTrails[trailId] = [];
    }
    this.ribbonTrails[trailId].push({
      x, y,
      age: 0,
      maxAge,
      width,
      color
    });
  }

  /**
   * Hexagonal / circular shield deflection impact ripple
   */
  addShieldRipple(x, y, color = '#00e5ff') {
    this.shieldRipples.push({
      x, y,
      radius: 12,
      maxRadius: 55,
      age: 0,
      maxAge: 0.25,
      color
    });
    // Add blue-white deflection sparks
    for (let i = 0; i < 6; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = 60 + Math.random() * 120;
      this.pickupSparks.push({
        x, y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        size: 3 + Math.random() * 3,
        age: 0,
        maxAge: 0.25,
        color: '#a5f3fc'
      });
    }
  }

  /**
   * Power-up pickup sparkling starburst
   */
  addPickupSparks(x, y, color = '#00ff66') {
    for (let i = 0; i < 24; i++) {
      const angle = (i / 24) * Math.PI * 2 + Math.random() * 0.2;
      const spd = 80 + Math.random() * 220;
      this.pickupSparks.push({
        x, y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        size: 4 + Math.random() * 4,
        age: 0,
        maxAge: 0.45 + Math.random() * 0.25,
        color
      });
    }
    this.shockwaves.push({
      x, y,
      radius: 10,
      maxRadius: 90,
      age: 0,
      maxAge: 0.3,
      color: 'rgba(0, 255, 150,'
    });
  }

  /**
   * Massive Tactical EMP Shockwave
   */
  addEmpWave(x, y) {
    this.shockwaves.push({
      x, y,
      radius: 20,
      maxRadius: 850,
      age: 0,
      maxAge: 0.6,
      color: 'rgba(168, 85, 247,' // Electric Purple
    });
    this.shockwaves.push({
      x, y,
      radius: 10,
      maxRadius: 700,
      age: 0,
      maxAge: 0.45,
      color: 'rgba(0, 229, 255,' // Cyan Secondary Ring
    });
    window.Runtime.addTrauma(0.65);
    window.AudioEngine.playEmpBurst();
  }

  /**
   * Spawn magnesium thermal flare countermeasure
   */
  addFlare(x, y, vx, vy) {
    this.flares.push({
      x, y,
      vx, vy,
      age: 0,
      maxAge: 3.5,
      heat: 1.0,
      size: 8,
      sparkTimer: 0
    });
  }

  /**
   * Ejected 20mm Vulcan brass shell casing
   */
  addCasing(x, y, vx, vy) {
    this.casings.push({
      x, y,
      vx, vy,
      angle: Math.random() * Math.PI * 2,
      vRot: (Math.random() - 0.5) * 20,
      age: 0,
      maxAge: 1.2
    });
  }

  /**
   * Multi-stage realistic explosion (Aircraft destruction or missile impact)
   */
  addExplosion(x, y, scale = 1.0) {
    // 1. Expanding Shockwave Ring
    this.shockwaves.push({
      x, y,
      radius: 10,
      maxRadius: 190 * scale,
      age: 0,
      maxAge: 0.35,
      color: 'rgba(255, 220, 180,'
    });

    // 2. Core Fireball particles
    const fireCount = Math.floor(25 * scale);
    for (let i = 0; i < fireCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = (60 + Math.random() * 260) * scale;
      this.particles.push({
        type: 'fire',
        x: x + (Math.random() - 0.5) * 20 * scale,
        y: y + (Math.random() - 0.5) * 20 * scale,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: (18 + Math.random() * 32) * scale,
        currentSize: 10,
        age: 0,
        maxAge: 0.45 + Math.random() * 0.35,
        growth: 45 * scale
      });
    }

    // 3. Dense Rolling Black Smoke Plumes
    const smokeCount = Math.floor(18 * scale);
    for (let i = 0; i < smokeCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = (20 + Math.random() * 120) * scale;
      this.addSmoke(
        x + (Math.random() - 0.5) * 30 * scale,
        y + (Math.random() - 0.5) * 30 * scale,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed + 30,
        (25 + Math.random() * 30) * scale,
        1.2 + Math.random() * 0.8,
        'rgba(40, 42, 48,',
        55 * scale
      );
    }

    // 4. Burning Debris Fragments
    const debrisCount = Math.floor(14 * scale);
    for (let i = 0; i < debrisCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = (120 + Math.random() * 320) * scale;
      this.debris.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 5 + Math.random() * 10 * scale,
        angle: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 15,
        trailTimer: 0,
        age: 0,
        maxAge: 1.0 + Math.random() * 1.0
      });
    }

    window.AudioEngine.playExplosion(scale);
    window.Runtime.addTrauma(0.35 * Math.min(scale, 1.8));
  }

  addFlakBurst(x, y) {
    this.shockwaves.push({
      x, y,
      radius: 5,
      maxRadius: 75,
      age: 0,
      maxAge: 0.2,
      color: 'rgba(255, 180, 80,'
    });

    for (let i = 0; i < 8; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = 20 + Math.random() * 70;
      this.addSmoke(x, y, Math.cos(angle) * spd, Math.sin(angle) * spd, 22, 0.9, 'rgba(65, 65, 70,', 40);
    }

    window.AudioEngine.playHitImpact();
  }

  update(dt, scrollSpeed = 600) {
    // 1. Update Ribbon Light Trails
    for (const trailId in this.ribbonTrails) {
      const trail = this.ribbonTrails[trailId];
      for (let i = trail.length - 1; i >= 0; i--) {
        const pt = trail[i];
        pt.age += dt;
        pt.y += scrollSpeed * 0.35 * dt; // airflow scroll
        if (pt.age >= pt.maxAge) {
          trail.splice(i, 1);
        }
      }
    }

    // 2. Update Shield Ripples
    for (let i = this.shieldRipples.length - 1; i >= 0; i--) {
      const sr = this.shieldRipples[i];
      sr.age += dt;
      if (sr.age >= sr.maxAge) {
        this.shieldRipples.splice(i, 1);
        continue;
      }
      sr.radius = 12 + (sr.maxRadius - 12) * (sr.age / sr.maxAge);
    }

    // 3. Update Pickup Sparks
    for (let i = this.pickupSparks.length - 1; i >= 0; i--) {
      const ps = this.pickupSparks[i];
      ps.age += dt;
      if (ps.age >= ps.maxAge) {
        this.pickupSparks.splice(i, 1);
        continue;
      }
      ps.x += ps.vx * dt;
      ps.y += ps.vy * dt;
      ps.vx *= Math.pow(0.92, dt * 60);
      ps.vy *= Math.pow(0.92, dt * 60);
    }

    // 4. Update Particles (Smoke & Fire)
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.age += dt;
      if (p.age >= p.maxAge) {
        this.particles.splice(i, 1);
        continue;
      }

      p.x += p.vx * dt;
      p.y += (p.vy + scrollSpeed * 0.25) * dt;
      p.vx *= Math.pow(0.92, dt * 60);
      p.vy *= Math.pow(0.92, dt * 60);
      p.currentSize += p.growth * dt;
      p.rotation += p.vRot * dt;
    }

    // 5. Update Flares
    for (let i = this.flares.length - 1; i >= 0; i--) {
      const f = this.flares[i];
      f.age += dt;
      if (f.age >= f.maxAge) {
        this.flares.splice(i, 1);
        continue;
      }

      f.x += f.vx * dt;
      f.y += (f.vy + scrollSpeed * 0.6) * dt;
      f.vx *= Math.pow(0.88, dt * 60);
      f.vy *= Math.pow(0.88, dt * 60);
      f.heat = Math.max(0, 1 - f.age / f.maxAge);

      f.sparkTimer += dt;
      if (f.sparkTimer > 0.025) {
        f.sparkTimer = 0;
        this.addSmoke(
          f.x + (Math.random() - 0.5) * 8,
          f.y + (Math.random() - 0.5) * 8,
          (Math.random() - 0.5) * 30,
          (Math.random() - 0.5) * 30,
          10,
          0.6,
          'rgba(240, 240, 245,',
          25
        );
      }
    }

    // 6. Update Debris
    for (let i = this.debris.length - 1; i >= 0; i--) {
      const d = this.debris[i];
      d.age += dt;
      if (d.age >= d.maxAge) {
        this.debris.splice(i, 1);
        continue;
      }

      d.x += d.vx * dt;
      d.y += (d.vy + scrollSpeed * 0.4) * dt;
      d.angle += d.vRot * dt;
      d.vx *= Math.pow(0.95, dt * 60);
      d.vy *= Math.pow(0.95, dt * 60);

      d.trailTimer += dt;
      if (d.trailTimer > 0.04) {
        d.trailTimer = 0;
        this.addSmoke(d.x, d.y, 0, 0, 8, 0.5, 'rgba(60, 60, 65,', 20);
      }
    }

    // 7. Update Shell Casings
    for (let i = this.casings.length - 1; i >= 0; i--) {
      const c = this.casings[i];
      c.age += dt;
      if (c.age >= c.maxAge) {
        this.casings.splice(i, 1);
        continue;
      }
      c.x += c.vx * dt;
      c.y += (c.vy + scrollSpeed * 0.8) * dt;
      c.angle += c.vRot * dt;
      c.vx *= Math.pow(0.90, dt * 60);
    }

    // 8. Update Shockwaves
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const s = this.shockwaves[i];
      s.age += dt;
      if (s.age >= s.maxAge) {
        this.shockwaves.splice(i, 1);
        continue;
      }
      const progress = s.age / s.maxAge;
      s.radius = 10 + (s.maxRadius - 10) * Math.sin(progress * Math.PI * 0.5);
    }
  }

  draw(ctx) {
    // 1. Draw Ribbon Light Trails (glowing curved lines)
    ctx.save();
    for (const trailId in this.ribbonTrails) {
      const trail = this.ribbonTrails[trailId];
      if (trail.length < 2) continue;

      ctx.beginPath();
      ctx.moveTo(trail[0].x, trail[0].y);
      for (let i = 1; i < trail.length; i++) {
        ctx.lineTo(trail[i].x, trail[i].y);
      }
      const latest = trail[trail.length - 1];
      ctx.strokeStyle = latest.color;
      ctx.shadowColor = latest.color;
      ctx.shadowBlur = 10;
      ctx.lineWidth = latest.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
    }
    ctx.restore();

    // 2. Draw Shockwaves
    for (const s of this.shockwaves) {
      const alpha = Math.max(0, 1 - s.age / s.maxAge);
      ctx.save();
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.strokeStyle = `${s.color}${alpha * 0.85})`;
      ctx.shadowColor = `${s.color}1)`;
      ctx.shadowBlur = 14;
      ctx.lineWidth = 6 * (1 - s.age / s.maxAge);
      ctx.stroke();
      ctx.restore();
    }

    // 3. Draw Shield Ripples
    for (const sr of this.shieldRipples) {
      const life = 1 - sr.age / sr.maxAge;
      ctx.save();
      ctx.strokeStyle = sr.color;
      ctx.shadowColor = sr.color;
      ctx.shadowBlur = 12;
      ctx.lineWidth = 3 * life;
      ctx.globalAlpha = life;
      ctx.beginPath();
      ctx.arc(sr.x, sr.y, sr.radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // 4. Draw Pickup Sparks
    for (const ps of this.pickupSparks) {
      const life = 1 - ps.age / ps.maxAge;
      ctx.save();
      ctx.fillStyle = ps.color;
      ctx.shadowColor = ps.color;
      ctx.shadowBlur = 8;
      ctx.globalAlpha = life;
      ctx.beginPath();
      ctx.arc(ps.x, ps.y, ps.size * life, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 5. Draw Smoke Particles
    for (const p of this.particles) {
      const life = 1 - p.age / p.maxAge;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);

      if (p.type === 'smoke') {
        const alpha = life * 0.55;
        const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, p.currentSize);
        grad.addColorStop(0, `${p.baseColor}${alpha})`);
        grad.addColorStop(0.6, `${p.baseColor}${alpha * 0.6})`);
        grad.addColorStop(1, `${p.baseColor}0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, p.currentSize, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'fire') {
        const alpha = Math.min(1, life * 1.5);
        const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, p.currentSize);
        grad.addColorStop(0, `rgba(255, 255, 230, ${alpha})`);
        grad.addColorStop(0.3, `rgba(255, 170, 20, ${alpha * 0.9})`);
        grad.addColorStop(0.7, `rgba(255, 50, 0, ${alpha * 0.5})`);
        grad.addColorStop(1, `rgba(180, 20, 0, 0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, p.currentSize, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // 6. Draw Flares (Magnesium burn)
    for (const f of this.flares) {
      const life = 1 - f.age / f.maxAge;
      ctx.save();
      const grad = ctx.createRadialGradient(f.x, f.y, 2, f.x, f.y, 28 * life);
      grad.addColorStop(0, `rgba(255, 255, 255, ${life})`);
      grad.addColorStop(0.25, `rgba(255, 220, 100, ${life * 0.9})`);
      grad.addColorStop(0.6, `rgba(255, 120, 30, ${life * 0.4})`);
      grad.addColorStop(1, `rgba(255, 50, 0, 0)`);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(f.x, f.y, 28 * life, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(f.x, f.y, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 7. Draw Shell Casings
    ctx.fillStyle = '#f59e0b';
    ctx.strokeStyle = '#b45309';
    ctx.lineWidth = 1;
    for (const c of this.casings) {
      ctx.save();
      ctx.translate(c.x, c.y);
      ctx.rotate(c.angle);
      ctx.fillRect(-2, -5, 4, 10);
      ctx.strokeRect(-2, -5, 4, 10);
      ctx.restore();
    }

    // 8. Draw Debris
    for (const d of this.debris) {
      const life = 1 - d.age / d.maxAge;
      ctx.save();
      ctx.translate(d.x, d.y);
      ctx.rotate(d.angle);
      ctx.fillStyle = `rgba(50, 55, 60, ${life})`;
      ctx.beginPath();
      ctx.moveTo(-d.size * 0.5, -d.size * 0.5);
      ctx.lineTo(d.size * 0.8, -d.size * 0.2);
      ctx.lineTo(d.size * 0.4, d.size * 0.7);
      ctx.lineTo(-d.size * 0.6, d.size * 0.4);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = `rgba(255, 120, 0, ${life * 0.8})`;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
    }
  }
}

window.Particles = new ParticleSystem();
