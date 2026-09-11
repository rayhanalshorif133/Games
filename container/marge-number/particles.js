// particles.js - High-performance Canvas Particle & Juice System
class ParticleEngine {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas ? canvas.getContext('2d') : null;
    this.particles = [];
    this.floatingTexts = [];
    this.isRunning = false;
    this.dpr = window.devicePixelRatio || 1;
    this.resize();

    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    if (!this.canvas) return;
    const rect = this.canvas.getBoundingClientRect();
    this.width = rect.width;
    this.height = rect.height;
    this.canvas.width = this.width * this.dpr;
    this.canvas.height = this.height * this.dpr;
    if (this.ctx) {
      this.ctx.scale(this.dpr, this.dpr);
    }
  }

  startLoop() {
    if (this.isRunning) return;
    this.isRunning = true;
    const loop = () => {
      if (this.particles.length === 0 && this.floatingTexts.length === 0) {
        this.isRunning = false;
        if (this.ctx) this.ctx.clearRect(0, 0, this.width, this.height);
        return;
      }
      this.update();
      this.render();
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  burst(x, y, color = '#ff007f', count = 22) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 7 + 2;
      const size = Math.random() * 6 + 4;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.5,
        size,
        color,
        alpha: 1,
        decay: Math.random() * 0.025 + 0.02,
        gravity: 0.15,
        drag: 0.96,
        isSpark: Math.random() > 0.4
      });
    }
    this.startLoop();
  }

  addTrail(x, y, color = '#ffffff', baseSize = 10) {
    // 2-3 trailing glowing comet particles
    for (let i = 0; i < 2; i++) {
      const offsetX = (Math.random() - 0.5) * 8;
      const offsetY = (Math.random() - 0.5) * 4;
      this.particles.push({
        x: x + offsetX,
        y: y + offsetY,
        vx: (Math.random() - 0.5) * 1.5,
        vy: Math.random() * 2 + 1.2, // flows downward behind upward projectile
        size: Math.random() * baseSize * 0.45 + baseSize * 0.35,
        color,
        alpha: 0.95,
        decay: 0.045,
        gravity: 0.06,
        drag: 0.94,
        isSpark: true
      });
    }

    // Sparkle star / glimmer
    if (Math.random() > 0.35) {
      this.particles.push({
        x: x + (Math.random() - 0.5) * 12,
        y: y + (Math.random() - 0.5) * 6,
        vx: (Math.random() - 0.5) * 2.5,
        vy: (Math.random() - 0.5) * 2 + 1,
        size: Math.random() * 4 + 2,
        color: '#ffffff',
        alpha: 1,
        decay: 0.06,
        gravity: 0.03,
        drag: 0.92,
        isSpark: true
      });
    }

    this.startLoop();
  }

  confetti(duration = 2000) {
    const colors = ['#00d2ff', '#6366f1', '#d946ef', '#f43f5e', '#f97316', '#eab308', '#10b981'];
    const startTime = Date.now();

    const spawnConfetti = () => {
      if (Date.now() - startTime > duration) return;
      for (let i = 0; i < 6; i++) {
        this.particles.push({
          x: Math.random() * this.width,
          y: -10,
          vx: (Math.random() - 0.5) * 4,
          vy: Math.random() * 4 + 3,
          size: Math.random() * 8 + 6,
          color: colors[Math.floor(Math.random() * colors.length)],
          alpha: 1,
          decay: 0.008,
          gravity: 0.08,
          drag: 0.99,
          rotation: Math.random() * 360,
          rotSpeed: (Math.random() - 0.5) * 12,
          isRect: true
        });
      }
      this.startLoop();
      setTimeout(spawnConfetti, 60);
    };
    spawnConfetti();
  }

  addText(x, y, text, color = '#ffffff', fontSize = 28) {
    this.floatingTexts.push({
      x,
      y,
      text,
      color,
      fontSize,
      alpha: 1,
      scale: 0.6,
      targetScale: 1.25,
      vy: -2.2,
      life: 0
    });
    this.startLoop();
  }

  update() {
    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= p.drag;
      p.vy = (p.vy + p.gravity) * p.drag;
      p.alpha -= p.decay;
      p.size = Math.max(0, p.size - 0.05);
      if (p.rotation !== undefined) {
        p.rotation += p.rotSpeed;
      }
      if (p.alpha <= 0 || p.size <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // Update floating texts
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const t = this.floatingTexts[i];
      t.y += t.vy;
      t.vy *= 0.96;
      t.life += 1;
      if (t.life < 10) {
        t.scale += (t.targetScale - t.scale) * 0.35;
      } else {
        t.scale = Math.max(1, t.scale * 0.98);
        t.alpha -= 0.025;
      }
      if (t.alpha <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }
  }

  render() {
    if (!this.ctx) return;
    this.ctx.clearRect(0, 0, this.width, this.height);

    // Draw particles
    for (const p of this.particles) {
      this.ctx.save();
      this.ctx.globalAlpha = Math.max(0, p.alpha);
      this.ctx.fillStyle = p.color;

      if (p.isRect) {
        this.ctx.translate(p.x, p.y);
        this.ctx.rotate((p.rotation * Math.PI) / 180);
        this.ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      } else {
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, Math.max(0.5, p.size), 0, Math.PI * 2);
        this.ctx.fill();

        if (p.isSpark) {
          this.ctx.shadowBlur = 10;
          this.ctx.shadowColor = p.color;
          this.ctx.fill();
        }
      }
      this.ctx.restore();
    }

    // Draw floating texts
    for (const t of this.floatingTexts) {
      this.ctx.save();
      this.ctx.globalAlpha = Math.max(0, t.alpha);
      this.ctx.font = `900 ${t.fontSize * t.scale}px 'Outfit', -apple-system, sans-serif`;
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';

      // Outline
      this.ctx.strokeStyle = '#090b10';
      this.ctx.lineWidth = 5 * t.scale;
      this.ctx.strokeText(t.text, t.x, t.y);

      // Glow & Fill
      this.ctx.shadowBlur = 8;
      this.ctx.shadowColor = t.color;
      this.ctx.fillStyle = t.color;
      this.ctx.fillText(t.text, t.x, t.y);

      this.ctx.restore();
    }
  }
}

window.ParticleEngine = ParticleEngine;
