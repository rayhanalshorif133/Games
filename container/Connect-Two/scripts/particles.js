/**
 * Construct 3 Particle System & Visual Juice (with Flying Orbs & Target Collision)
 */
class ParticleSystem {
  constructor() {
    this.particles = [];
    this.flyingOrbs = [];
    this.floatingTexts = [];
    this.shockwaves = [];
  }

  update(dt) {
    // 1. Regular particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += dt;
      if (p.life >= p.maxLife) {
        this.particles.splice(i, 1);
        continue;
      }
      p.x += p.vx * dt * 60;
      p.y += p.vy * dt * 60;
      p.vy += 0.35 * dt * 60;
      p.vx *= 0.96;
      p.alpha = 1 - p.life / p.maxLife;
      if (p.rotation !== undefined && p.vRot !== undefined) {
        p.rotation += p.vRot * dt * 60;
      }
    }

    // 2. Flying Orbs (Arcing to Target Box & Colliding)
    for (let i = this.flyingOrbs.length - 1; i >= 0; i--) {
      const orb = this.flyingOrbs[i];
      orb.life += dt;
      if (orb.life < 0) continue; // delayed launch

      const tRaw = Math.min(1, orb.life / orb.duration);
      // Smooth cubic ease-in-out curve
      const t = tRaw * tRaw * (3 - 2 * tRaw);

      // Quadratic Bézier curve path
      const u = 1 - t;
      const x = u * u * orb.startX + 2 * u * t * orb.cpX + t * t * orb.targetX;
      const y = u * u * orb.startY + 2 * u * t * orb.cpY + t * t * orb.targetY;

      orb.currentX = x;
      orb.currentY = y;

      // Trail history
      orb.tailHistory.unshift({ x, y });
      if (orb.tailHistory.length > 6) {
        orb.tailHistory.pop();
      }

      // Sparkle trailing particles
      if (Math.random() < 0.65) {
        this.particles.push({
          x: x + (Math.random() - 0.5) * 8,
          y: y + (Math.random() - 0.5) * 8,
          vx: (Math.random() - 0.5) * 1.5,
          vy: (Math.random() - 0.5) * 1.5,
          radius: 3 + Math.random() * 3,
          color: orb.color,
          alpha: 0.85,
          life: 0,
          maxLife: 0.22,
          shape: 'circle'
        });
      }

      // Collision & Impact Check
      if (tRaw >= 1) {
        this.emitImpactBurst(orb.targetX, orb.targetY, orb.color, 10);
        if (orb.onImpact) {
          orb.onImpact();
        }
        this.flyingOrbs.splice(i, 1);
      }
    }

    // 3. Floating Texts
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.life += dt;
      if (ft.life >= ft.maxLife) {
        this.floatingTexts.splice(i, 1);
        continue;
      }
      ft.y -= 1.8 * dt * 60;
      ft.alpha = Math.max(0, 1 - Math.pow(ft.life / ft.maxLife, 1.5));
      ft.scale = 1 + Math.sin((ft.life / ft.maxLife) * Math.PI) * 0.25;
    }

    // 4. Shockwaves
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const sw = this.shockwaves[i];
      sw.radius += (sw.maxRadius - sw.radius) * 0.12 * dt * 60;
      sw.alpha = 1 - sw.radius / sw.maxRadius;
      if (sw.radius >= sw.maxRadius * 0.98 || sw.alpha <= 0.01) {
        this.shockwaves.splice(i, 1);
      }
    }
  }

  emitDotBurst(x, y, colorHex, count = 10) {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
      const speed = 4 + Math.random() * 8;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        radius: 4 + Math.random() * 6,
        color: colorHex,
        alpha: 1,
        life: 0,
        maxLife: 0.45 + Math.random() * 0.35,
        shape: 'circle'
      });
    }
  }

  emitFlyingOrb(startX, startY, targetX, targetY, colorHex, onImpact = null, delay = 0) {
    const curveOffset = (Math.random() - 0.5) * 220;
    const cpX = startX + curveOffset;
    const cpY = Math.min(startY, targetY) - 50 - Math.random() * 80;

    this.flyingOrbs.push({
      startX,
      startY,
      targetX,
      targetY,
      cpX,
      cpY,
      color: colorHex,
      onImpact,
      life: -delay,
      duration: 0.42 + Math.random() * 0.16,
      radius: 14 + Math.random() * 4,
      currentX: startX,
      currentY: startY,
      tailHistory: []
    });
  }

  emitImpactBurst(x, y, colorHex, count = 8) {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
      const speed = 3 + Math.random() * 8;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        radius: 3.5 + Math.random() * 5,
        color: colorHex,
        alpha: 1,
        life: 0,
        maxLife: 0.32 + Math.random() * 0.2,
        shape: 'circle'
      });
    }
  }

  emitFloatingText(x, y, text = '+1', colorHex = '#4A5568') {
    this.floatingTexts.push({
      x,
      y: y - 28,
      text,
      color: colorHex,
      alpha: 1,
      life: 0,
      maxLife: 0.65,
      scale: 1
    });
  }

  emitShockwave(x, y, colorHex) {
    this.shockwaves.push({
      x,
      y,
      radius: 30,
      maxRadius: 550,
      color: colorHex,
      alpha: 0.85,
      thickness: 16
    });
  }

  emitConfettiCannon() {
    const colors = ['#F8CF47', '#6EA8FE', '#EE5965', '#9D5DE5', '#2ECC71', '#FF9F43'];
    for (let i = 0; i < 90; i++) {
      const x = 540 + (Math.random() - 0.5) * 400;
      const y = 800 + (Math.random() - 0.5) * 200;
      const angle = Math.random() * Math.PI + Math.PI;
      const speed = 6 + Math.random() * 14;

      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed * 1.5,
        vy: Math.sin(angle) * speed - 4,
        radius: 6 + Math.random() * 8,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1,
        life: 0,
        maxLife: 1.6 + Math.random() * 0.8,
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.3,
        shape: Math.random() > 0.5 ? 'square' : 'circle'
      });
    }
  }

  render(ctx) {
    // 1. Shockwaves
    for (const sw of this.shockwaves) {
      ctx.save();
      ctx.strokeStyle = sw.color;
      ctx.globalAlpha = sw.alpha;
      ctx.lineWidth = sw.thickness * sw.alpha;
      ctx.beginPath();
      ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // 2. Regular Particles
    for (const p of this.particles) {
      ctx.save();
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.alpha;
      ctx.translate(p.x, p.y);

      if (p.rotation !== undefined) {
        ctx.rotate(p.rotation);
      }

      if (p.shape === 'square') {
        ctx.fillRect(-p.radius, -p.radius, p.radius * 2, p.radius * 2);
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // 3. Flying Orbs with Glowing Trails & Highlights
    for (const orb of this.flyingOrbs) {
      if (orb.life < 0) continue;

      const progress = Math.min(1, orb.life / orb.duration);
      const scale = 1 - progress * 0.22;
      const curRadius = orb.radius * scale;

      // Motion Trail
      for (let j = 0; j < orb.tailHistory.length; j++) {
        const pt = orb.tailHistory[j];
        const tailAlpha = (1 - j / orb.tailHistory.length) * 0.45;
        const tailRadius = curRadius * (1 - (j / orb.tailHistory.length) * 0.55);
        ctx.save();
        ctx.fillStyle = orb.color;
        ctx.globalAlpha = tailAlpha;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, tailRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Main Glowing Orb Body
      ctx.save();
      ctx.shadowColor = orb.color;
      ctx.shadowBlur = 18;
      ctx.fillStyle = orb.color;
      ctx.beginPath();
      ctx.arc(orb.currentX, orb.currentY, curRadius, 0, Math.PI * 2);
      ctx.fill();

      // Bright Specular Gloss Highlight
      ctx.fillStyle = '#FFFFFF';
      ctx.shadowBlur = 0;
      ctx.beginPath();
      ctx.arc(
        orb.currentX - curRadius * 0.28,
        orb.currentY - curRadius * 0.28,
        curRadius * 0.36,
        0,
        Math.PI * 2
      );
      ctx.fill();
      ctx.restore();
    }

    // 4. Floating Texts
    for (const ft of this.floatingTexts) {
      ctx.save();
      ctx.globalAlpha = ft.alpha;
      ctx.font = `bold ${Math.round(32 * ft.scale)}px "Nunito", "Segoe UI", sans-serif`;
      ctx.fillStyle = ft.color;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = 'rgba(0,0,0,0.12)';
      ctx.shadowBlur = 4;
      ctx.shadowOffsetY = 2;
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    }
  }

  clear() {
    this.particles = [];
    this.flyingOrbs = [];
    this.floatingTexts = [];
    this.shockwaves = [];
  }
}

window.ParticleSystem = ParticleSystem;

