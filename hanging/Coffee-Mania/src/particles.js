// Visual particle effects for coffee steam, tray completions, and celebrations

export class ParticleSystem {
  constructor() {
    this.particles = [];
  }

  // Steam rising from warm coffee
  addSteam(x, y) {
    if (Math.random() > 0.4) return;
    this.particles.push({
      type: 'steam',
      x: x + (Math.random() * 20 - 10),
      y: y - 30,
      vx: (Math.random() - 0.5) * 0.4,
      vy: -0.8 - Math.random() * 0.6,
      radius: 4 + Math.random() * 4,
      alpha: 0.35,
      decay: 0.007,
      maxRadius: 16
    });
  }

  // Confetti / sparkles when tray finishes (all 6 cups packed)
  addTrayBurst(x, y, colorHex = '#ffd54f') {
    const colors = [colorHex, '#ffffff', '#ffeb3b', '#ff9800', '#4fc3f7', '#f48fb1'];
    for (let i = 0; i < 40; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 3 + Math.random() * 8;
      this.particles.push({
        type: 'sparkle',
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        radius: 3 + Math.random() * 5,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1,
        decay: 0.015 + Math.random() * 0.01,
        gravity: 0.15,
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.2
      });
    }
  }

  // Large victory celebration burst
  addWinCelebration(width, height) {
    const colors = ['#f44336', '#e91e63', '#9c27b0', '#2196f3', '#4caf50', '#ffeb3b', '#ff9800'];
    for (let i = 0; i < 90; i++) {
      this.particles.push({
        type: 'confetti',
        x: Math.random() * width,
        y: -20,
        vx: (Math.random() - 0.5) * 4,
        vy: 2 + Math.random() * 5,
        w: 8 + Math.random() * 6,
        h: 12 + Math.random() * 8,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1,
        decay: 0.004,
        gravity: 0.05,
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.15
      });
    }
  }

  update(dt = 1) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.alpha -= p.decay * dt;

      if (p.gravity) {
        p.vy += p.gravity * dt;
      }
      if (p.vRot) {
        p.rotation += p.vRot * dt;
      }
      if (p.type === 'steam') {
        p.radius = Math.min(p.maxRadius, p.radius + 0.12 * dt);
      }

      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  draw(ctx) {
    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, p.alpha));

      if (p.type === 'steam') {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'sparkle') {
        ctx.fillStyle = p.color;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        // Draw star or diamond
        ctx.beginPath();
        ctx.moveTo(0, -p.radius);
        ctx.lineTo(p.radius * 0.4, -p.radius * 0.4);
        ctx.lineTo(p.radius, 0);
        ctx.lineTo(p.radius * 0.4, p.radius * 0.4);
        ctx.lineTo(0, p.radius);
        ctx.lineTo(-p.radius * 0.4, p.radius * 0.4);
        ctx.lineTo(-p.radius, 0);
        ctx.lineTo(-p.radius * 0.4, -p.radius * 0.4);
        ctx.closePath();
        ctx.fill();
      } else if (p.type === 'confetti') {
        ctx.fillStyle = p.color;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      }

      ctx.restore();
    }
  }
}

