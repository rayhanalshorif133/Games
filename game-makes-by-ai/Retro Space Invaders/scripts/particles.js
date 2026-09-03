/**
 * Retro Space Invaders - Particle & Visual Effects Engine
 * 
 * Handles parallax starfield, pixel explosion debris, bunker dust,
 * and floating arcade score numbers (+30, +100, +300).
 */

class ParticleEngine {
  constructor(width = 800, height = 900) {
    this.width = width;
    this.height = height;
    this.stars = [];
    this.particles = [];
    this.floatingScores = [];

    this.initStarfield();
  }

  initStarfield() {
    this.stars = [];
    const starCount = 90;
    const colors = ['#ffffff', '#60a5fa', '#f472b6', '#facc15', '#4ade80'];

    for (let i = 0; i < starCount; i++) {
      this.stars.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        speed: 0.2 + Math.random() * 0.8,
        size: Math.random() > 0.8 ? 2 : 1,
        color: colors[Math.floor(Math.random() * colors.length)],
        twinkle: Math.random() * Math.PI * 2,
        twinkleSpeed: 0.02 + Math.random() * 0.05
      });
    }
  }

  createExplosion(x, y, color = '#ff0055', count = 16, maxSpeed = 3.5) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.5 + Math.random() * maxSpeed;
      const size = 2 + Math.floor(Math.random() * 3);
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: size,
        color: color,
        alpha: 1.0,
        decay: 0.02 + Math.random() * 0.03,
        gravity: 0.04
      });
    }
  }

  createPlayerExplosion(x, y) {
    const colors = ['#22e650', '#ffffff', '#eab308', '#ef4444'];
    for (let i = 0; i < 40; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.5 + Math.random() * 5.5;
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 3 + Math.floor(Math.random() * 4),
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1.0,
        decay: 0.012 + Math.random() * 0.02,
        gravity: 0.06
      });
    }
  }

  createBunkerDust(x, y) {
    for (let i = 0; i < 6; i++) {
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.5;
      const speed = 0.5 + Math.random() * 2;
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 2,
        color: '#22e650',
        alpha: 1.0,
        decay: 0.04,
        gravity: 0.05
      });
    }
  }

  addFloatingScore(text, x, y, color = '#facc15') {
    this.floatingScores.push({
      text: text,
      x: x,
      y: y,
      alpha: 1.0,
      vy: -1.2,
      color: color
    });
  }

  update(dt = 1) {
    // Stars
    for (const s of this.stars) {
      s.y += s.speed * dt;
      if (s.y > this.height) {
        s.y = 0;
        s.x = Math.random() * this.width;
      }
      s.twinkle += s.twinkleSpeed * dt;
    }

    // Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += p.gravity * dt;
      p.alpha -= p.decay * dt;
      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // Floating scores
    for (let i = this.floatingScores.length - 1; i >= 0; i--) {
      const fs = this.floatingScores[i];
      fs.y += fs.vy * dt;
      fs.alpha -= 0.02 * dt;
      if (fs.alpha <= 0) {
        this.floatingScores.splice(i, 1);
      }
    }
  }

  draw(ctx) {
    // Draw starfield
    for (const s of this.stars) {
      const brightness = 0.4 + Math.sin(s.twinkle) * 0.4;
      ctx.globalAlpha = Math.max(0.1, Math.min(1.0, brightness));
      ctx.fillStyle = s.color;
      ctx.fillRect(Math.floor(s.x), Math.floor(s.y), s.size, s.size);
    }
    ctx.globalAlpha = 1.0;

    // Draw particles
    for (const p of this.particles) {
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.fillStyle = p.color;
      ctx.fillRect(Math.floor(p.x), Math.floor(p.y), p.size, p.size);
    }
    ctx.globalAlpha = 1.0;

    // Draw floating scores
    ctx.font = '700 15px "Orbitron", sans-serif';
    ctx.textAlign = 'center';
    for (const fs of this.floatingScores) {
      ctx.globalAlpha = Math.max(0, fs.alpha);
      ctx.fillStyle = fs.color;
      ctx.fillText(fs.text, Math.floor(fs.x), Math.floor(fs.y));
    }
    ctx.globalAlpha = 1.0;
  }
}

if (typeof window !== 'undefined') {
  window.ParticleEngine = ParticleEngine;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ParticleEngine;
}

