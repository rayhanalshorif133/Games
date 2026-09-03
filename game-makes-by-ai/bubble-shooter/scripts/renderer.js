/**
 * Realistic 2D Canvas Renderer for Bubble Shooter
 * Renders 3D-shaded glossy glass bubbles, laser trajectory guide,
 * dynamic particles, falling physical bubbles, and floating score texts.
 */
class Renderer {
  constructor(canvas, config) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.config = config;

    this.particles = [];
    this.floatingTexts = [];
    this.fallingBubbles = [];
    this.screenShake = 0;

    // Cache pre-computed color maps for lightning-fast rendering
    this.colorMap = {};
    for (const c of config.colors) {
      this.colorMap[c.id] = c;
    }

    // Danger line position
    this.dangerY = config.bottomDangerY || 1540;
    this.dangerPulse = 0;
  }

  addScreenShake(amount = 15) {
    this.screenShake = Math.max(this.screenShake, amount);
  }

  addPopParticles(x, y, colorId, count = 18) {
    const color = this.colorMap[colorId] || { primary: '#ff2d55', glow: 'rgba(255, 45, 85, 0.6)' };
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 150 + Math.random() * 450;
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 3 + Math.random() * 5,
        color: color.primary,
        alpha: 1,
        life: 0.5 + Math.random() * 0.4,
        maxLife: 0.9,
        gravity: 600,
        type: Math.random() < 0.3 ? 'sparkle' : 'droplet'
      });
    }
  }

  addHeartShatterParticles(x, y, count = 25) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 200 + Math.random() * 500;
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 150,
        size: 6 + Math.random() * 8,
        color: '#ff2d55',
        rotation: Math.random() * Math.PI,
        vRot: (Math.random() - 0.5) * 12,
        alpha: 1,
        life: 0.8 + Math.random() * 0.4,
        maxLife: 1.2,
        gravity: 900,
        type: 'shard'
      });
    }
  }

  addFloatingText(text, x, y, color = '#ffeaa7', size = 32) {
    this.floatingTexts.push({
      text: text,
      x: x,
      y: y,
      vy: -140,
      alpha: 1,
      life: 1.1,
      color: color,
      size: size
    });
  }

  addFallingBubble(bubble) {
    const angle = (Math.random() - 0.5) * 1.5;
    const speed = 100 + Math.random() * 200;
    this.fallingBubbles.push({
      x: bubble.x,
      y: bubble.y,
      vx: Math.sin(angle) * speed,
      vy: -150 - Math.random() * 150, // Initial little hop
      radius: bubble.radius || 48,
      colorId: bubble.colorId,
      type: bubble.type,
      rotation: 0,
      vRot: (Math.random() - 0.5) * 6,
      scale: 1,
      alpha: 1,
      gravity: 2200,
      bounces: 0
    });
  }

  update(dt) {
    // Screen shake decay
    if (this.screenShake > 0) {
      this.screenShake = Math.max(0, this.screenShake - 35 * dt);
    }

    this.dangerPulse += dt * 3;

    // Update Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += p.gravity * dt;
      p.life -= dt;
      p.alpha = Math.max(0, p.life / p.maxLife);
      if (p.rotation !== undefined) {
        p.rotation += p.vRot * dt;
      }
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // Update Floating Texts
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y += ft.vy * dt;
      ft.life -= dt;
      ft.alpha = Math.max(0, ft.life / 1.1);
      if (ft.life <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }

    // Update Falling Bubbles
    for (let i = this.fallingBubbles.length - 1; i >= 0; i--) {
      const fb = this.fallingBubbles[i];
      fb.x += fb.vx * dt;
      fb.y += fb.vy * dt;
      fb.vy += fb.gravity * dt;
      fb.rotation += fb.vRot * dt;

      // Bottom bounce
      if (fb.y >= 1840) {
        fb.y = 1840;
        fb.vy = -fb.vy * 0.45;
        fb.bounces++;
        if (fb.bounces > 2 || Math.abs(fb.vy) < 100) {
          // Explode into points
          this.addPopParticles(fb.x, fb.y, fb.colorId, 12);
          this.fallingBubbles.splice(i, 1);
          continue;
        }
      }

      if (fb.y > 1920 + fb.radius) {
        this.fallingBubbles.splice(i, 1);
      }
    }
  }

  /**
   * Main Render Pipeline
   */
  render(grid, shooter, gameState) {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.save();

    // Apply Screen Shake
    if (this.screenShake > 0) {
      const sx = (Math.random() - 0.5) * this.screenShake;
      const sy = (Math.random() - 0.5) * this.screenShake;
      ctx.translate(sx, sy);
    }

    // Clear Canvas
    ctx.clearRect(0, 0, w, h);

    // 1. Draw Subtle Backdrop & Cosmic Vignette
    this.drawBackground(ctx, w, h);

    // 2. Draw Ceiling Border & Drop Shadow
    this.drawCeiling(ctx, grid);

    // 3. Draw Danger Line
    this.drawDangerLine(ctx, w);

    // 4. Draw Hex Grid Bubbles
    this.drawGridBubbles(ctx, grid);

    // 5. Draw Disconnected Falling Bubbles
    this.drawFallingBubbles(ctx);

    // 6. Draw Shooter Cannon & Active Bullet
    this.drawShooter(ctx, shooter, grid);

    // 7. Draw Aim Trajectory Laser
    this.drawTrajectory(ctx, shooter);

    // 8. Draw Particles & Sparkles
    this.drawParticles(ctx);

    // 9. Draw Floating Score Text
    this.drawFloatingTexts(ctx);

    ctx.restore();
  }

  drawBackground(ctx, w, h) {
    // Deep starry dark blue arena
    const grad = ctx.createRadialGradient(w / 2, h * 0.4, 100, w / 2, h * 0.5, h * 0.8);
    grad.addColorStop(0, '#151c2e');
    grad.addColorStop(0.5, '#0d1322');
    grad.addColorStop(1, '#05070d');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Subtle Hex Grid Accent Lines
    ctx.strokeStyle = 'rgba(0, 210, 211, 0.035)';
    ctx.lineWidth = 1.5;
    const hexSize = 80;
    for (let y = 100; y < h - 200; y += hexSize * 1.5) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
  }

  drawCeiling(ctx, grid) {
    const cy = grid.ceilingY;

    // Soft drop shadow below ceiling
    const shadowGrad = ctx.createLinearGradient(0, cy, 0, cy + 30);
    shadowGrad.addColorStop(0, 'rgba(0, 0, 0, 0.6)');
    shadowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = shadowGrad;
    ctx.fillRect(0, cy, this.canvas.width, 30);

    // High-tech ceiling bar
    const barGrad = ctx.createLinearGradient(0, cy - 24, 0, cy);
    barGrad.addColorStop(0, '#1e293b');
    barGrad.addColorStop(0.5, '#334155');
    barGrad.addColorStop(1, '#0f172a');
    ctx.fillStyle = barGrad;
    ctx.fillRect(0, cy - 24, this.canvas.width, 24);

    // Neon Accent Strip
    ctx.fillStyle = '#00d2d3';
    ctx.shadowColor = '#00d2d3';
    ctx.shadowBlur = 10;
    ctx.fillRect(0, cy - 2, this.canvas.width, 3);
    ctx.shadowBlur = 0;
  }

  drawDangerLine(ctx, w) {
    const dy = this.dangerY;
    const pulse = (Math.sin(this.dangerPulse) + 1) * 0.5;

    ctx.save();
    // Neon red glowing laser line
    ctx.strokeStyle = `rgba(255, 45, 85, ${0.4 + pulse * 0.5})`;
    ctx.lineWidth = 3;
    ctx.setLineDash([16, 10]);
    ctx.shadowColor = '#ff2d55';
    ctx.shadowBlur = 12 + pulse * 8;

    ctx.beginPath();
    ctx.moveTo(20, dy);
    ctx.lineTo(w - 20, dy);
    ctx.stroke();

    // Danger text tag
    ctx.fillStyle = `rgba(255, 45, 85, ${0.6 + pulse * 0.4})`;
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('⚠️ DANGER LIMIT', w - 30, dy - 8);
    ctx.restore();
  }

  /**
   * Draws a hyper-realistic 3D glossy bubble sphere
   */
  drawGlossyBubble(ctx, x, y, radius, colorId, type = 'normal', scale = 1, alpha = 1) {
    ctx.save();
    ctx.translate(x, y);
    if (scale !== 1) ctx.scale(scale, scale);
    if (alpha !== 1) ctx.globalAlpha = alpha;

    const r = radius;

    // 1. Soft Ambient Occlusion Shadow underneath
    const shadowGrad = ctx.createRadialGradient(0, r * 0.8, r * 0.2, 0, r * 0.8, r * 0.9);
    shadowGrad.addColorStop(0, 'rgba(0, 0, 0, 0.4)');
    shadowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = shadowGrad;
    ctx.beginPath();
    ctx.arc(0, r * 0.4, r * 0.9, 0, Math.PI * 2);
    ctx.fill();

    // Handle Special Types
    if (type === 'bomb') {
      this.drawBombBubble(ctx, r);
      ctx.restore();
      return;
    }
    if (type === 'rainbow') {
      this.drawRainbowBubble(ctx, r);
      ctx.restore();
      return;
    }

    const color = this.colorMap[colorId] || { primary: '#ff2d55', shadow: '#800018', glow: 'rgba(255, 45, 85, 0.6)' };

    // 2. Base 3D Sphere Radial Shading
    const sphereGrad = ctx.createRadialGradient(-r * 0.3, -r * 0.35, r * 0.08, 0, 0, r);
    sphereGrad.addColorStop(0, '#ffffff');
    sphereGrad.addColorStop(0.2, color.primary);
    sphereGrad.addColorStop(0.75, color.shadow);
    sphereGrad.addColorStop(1, '#05070d');

    ctx.fillStyle = sphereGrad;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();

    // 3. Ambient Bottom Bounce Rim Light (Gives physical depth)
    const rimGrad = ctx.createRadialGradient(r * 0.25, r * 0.45, r * 0.2, 0, 0, r);
    rimGrad.addColorStop(0.7, 'rgba(255, 255, 255, 0)');
    rimGrad.addColorStop(0.95, color.primary);
    rimGrad.addColorStop(1, 'rgba(255, 255, 255, 0.6)');

    ctx.fillStyle = rimGrad;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();

    // 4. Primary Upper-Left Curved Specular Glint
    ctx.save();
    ctx.translate(-r * 0.32, -r * 0.38);
    ctx.rotate(-Math.PI / 4);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 0.45, r * 0.22, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 5. Secondary Tiny Glint Dot
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.beginPath();
    ctx.arc(-r * 0.5, -r * 0.15, r * 0.08, 0, Math.PI * 2);
    ctx.fill();

    // 6. Subtle Glass Outer Contour
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, r - 0.75, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }

  drawBombBubble(ctx, r) {
    // Metallic dark sphere with fiery cracks
    const sphereGrad = ctx.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.1, 0, 0, r);
    sphereGrad.addColorStop(0, '#64748b');
    sphereGrad.addColorStop(0.5, '#1e293b');
    sphereGrad.addColorStop(1, '#020617');

    ctx.fillStyle = sphereGrad;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();

    // Fiery glowing core emblem
    ctx.fillStyle = '#ff4757';
    ctx.shadowColor = '#ff4757';
    ctx.shadowBlur = 15;
    ctx.font = 'bold 36px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('💣', 0, 2);
    ctx.shadowBlur = 0;

    // Specular shine
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.beginPath();
    ctx.ellipse(-r * 0.32, -r * 0.38, r * 0.4, r * 0.18, -Math.PI / 4, 0, Math.PI * 2);
    ctx.fill();
  }

  drawRainbowBubble(ctx, r) {
    // Iridescent Rainbow Swirl
    const grad = ctx.createRadialGradient(0, 0, r * 0.2, 0, 0, r);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.2, '#ff9ff3');
    grad.addColorStop(0.4, '#54a0ff');
    grad.addColorStop(0.6, '#1dd1a1');
    grad.addColorStop(0.8, '#feca57');
    grad.addColorStop(1, '#ff6b6b');

    ctx.fillStyle = grad;
    ctx.shadowColor = '#ff9ff3';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Star icon inside
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 32px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🌈', 0, 2);

    // Specular shine
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.beginPath();
    ctx.ellipse(-r * 0.32, -r * 0.38, r * 0.42, r * 0.2, -Math.PI / 4, 0, Math.PI * 2);
    ctx.fill();
  }

  drawGridBubbles(ctx, grid) {
    for (let r = 0; r < grid.rows; r++) {
      const cols = grid.getColsInRow(r);
      for (let c = 0; c < cols; c++) {
        const b = grid.grid[r][c];
        if (b) {
          this.drawGlossyBubble(ctx, b.x, b.y, grid.radius, b.colorId, b.type, b.scale, b.alpha);
        }
      }
    }
  }

  drawFallingBubbles(ctx) {
    for (const fb of this.fallingBubbles) {
      ctx.save();
      ctx.translate(fb.x, fb.y);
      ctx.rotate(fb.rotation);
      this.drawGlossyBubble(ctx, 0, 0, fb.radius, fb.colorId, fb.type, fb.scale, fb.alpha);
      ctx.restore();
    }
  }

  drawShooter(ctx, shooter, grid) {
    const x = shooter.x;
    const y = shooter.y;
    const angle = shooter.angle;
    const recoil = shooter.recoil;

    ctx.save();
    ctx.translate(x, y);

    // 1. Futuristic Base Pedestal
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, 0, 95, Math.PI, 0, false);
    ctx.fill();
    ctx.stroke();

    // 2. Rotating Cannon Barrel & Turret
    ctx.save();
    ctx.rotate(angle + Math.PI / 2); // Angle relative to straight up

    // Barrel guide rails (recoils backwards)
    const barrelY = -shooter.barrelLength + recoil;
    const barrelGrad = ctx.createLinearGradient(-36, 0, 36, 0);
    barrelGrad.addColorStop(0, '#1e293b');
    barrelGrad.addColorStop(0.5, '#64748b');
    barrelGrad.addColorStop(1, '#0f172a');

    ctx.fillStyle = barrelGrad;
    ctx.strokeStyle = '#00d2d3';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-30, barrelY, 60, shooter.barrelLength, 12);
    ctx.fill();
    ctx.stroke();

    // Energy rail glow lines
    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#00d2d3';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(-18, barrelY + 10);
    ctx.lineTo(-18, recoil - 10);
    ctx.moveTo(18, barrelY + 10);
    ctx.lineTo(18, recoil - 10);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Glass Chamber Sphere
    ctx.fillStyle = 'rgba(0, 210, 211, 0.12)';
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(0, recoil, 62, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Draw Ready Current Bubble inside chamber
    if (shooter.currentBubble) {
      this.drawGlossyBubble(ctx, 0, recoil, shooter.radius, shooter.currentBubble.colorId, shooter.currentBubble.type, 0.96);
    }

    ctx.restore(); // Restore turret rotation
    ctx.restore(); // Restore shooter position

    // Draw active flying bullet if in mid-air
    if (shooter.activeBullet) {
      const b = shooter.activeBullet;
      this.drawGlossyBubble(ctx, b.x, b.y, b.radius, b.colorId, b.type, b.scale);
    }
  }

  drawTrajectory(ctx, shooter) {
    if (!shooter.isAiming) return;
    if (!shooter.trajectoryPoints || shooter.trajectoryPoints.length < 2) return;
    if (!shooter.canShoot()) return;

    ctx.save();
    const pts = shooter.trajectoryPoints;

    // Draw Dotted Laser Path
    ctx.strokeStyle = '#00d2d3';
    ctx.lineWidth = 4;
    ctx.setLineDash([8, 12]);
    ctx.shadowColor = '#00d2d3';
    ctx.shadowBlur = 10;

    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) {
      ctx.lineTo(pts[i].x, pts[i].y);
    }
    ctx.stroke();

    // Draw Landing Ghost Ring at trajectory end
    const lastPt = pts[pts.length - 1];
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.lineWidth = 3;
    ctx.setLineDash([]);
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(lastPt.x, lastPt.y, shooter.radius, 0, Math.PI * 2);
    ctx.stroke();

    // Crosshair dot in ghost center
    ctx.fillStyle = '#00d2d3';
    ctx.beginPath();
    ctx.arc(lastPt.x, lastPt.y, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  drawParticles(ctx) {
    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = p.alpha;

      if (p.type === 'shard') {
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.moveTo(0, -p.size);
        ctx.lineTo(p.size * 0.6, p.size * 0.7);
        ctx.lineTo(-p.size * 0.6, p.size * 0.7);
        ctx.closePath();
        ctx.fill();
      } else if (p.type === 'sparkle') {
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Liquid droplet
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  drawFloatingTexts(ctx) {
    for (const ft of this.floatingTexts) {
      ctx.save();
      ctx.globalAlpha = ft.alpha;
      ctx.fillStyle = ft.color;
      ctx.font = `900 ${ft.size}px -apple-system, sans-serif`;
      ctx.textAlign = 'center';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
      ctx.shadowBlur = 10;
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    }
  }
}

window.Renderer = Renderer;

