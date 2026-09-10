/**
 * Renderer for Realistic Basketball Game (1080x1920)
 * Handles court aesthetics, hoop, backboard, rotating ball, particles, and VFX.
 */
class BasketballRenderer {
  constructor(canvas, ctx, config) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.cfg = config.gameplay;
    this.particles = [];
    this.floatingTexts = [];
    this.hoop = this.cfg.hoop;
    this.floorY = this.cfg.floorY || 1740;
  }

  // Add floating animated score / announcement text
  addFloatingText(text, x, y, color = "#ffb703", fontSize = 48) {
    this.floatingTexts.push({
      text,
      x,
      y,
      color,
      fontSize,
      opacity: 1.0,
      scale: 0.6,
      vy: -140,
      life: 1.2
    });
  }

  // Spawn celebratory confetti or spark particles
  spawnConfetti(x, y, count = 30, isGold = false) {
    const colors = isGold
      ? ["#ffd700", "#ffaa00", "#fff3a8", "#ff6a00", "#ffffff"]
      : ["#ff4757", "#2ed573", "#1e90ff", "#ffa502", "#ffffff"];

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 500 + 150;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 150,
        radius: Math.random() * 6 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1.0,
        decay: Math.random() * 0.8 + 0.6,
        type: 'spark'
      });
    }
  }

  // Spawn fire particles for hot streak
  spawnFlameParticle(x, y) {
    const colors = ["#ff3838", "#ff9f1a", "#fff200", "#ff5252"];
    this.particles.push({
      x: x + (Math.random() - 0.5) * 30,
      y: y + (Math.random() - 0.5) * 30,
      vx: (Math.random() - 0.5) * 60,
      vy: -(Math.random() * 120 + 80),
      radius: Math.random() * 14 + 8,
      color: colors[Math.floor(Math.random() * colors.length)],
      alpha: 0.8,
      decay: 1.8,
      type: 'fire'
    });
  }

  // Update particles and floating text
  updateVFX(dt) {
    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.alpha -= p.decay * dt;

      if (p.type === 'spark') {
        p.vy += 800 * dt; // Particle gravity
      } else if (p.type === 'fire') {
        p.radius *= 0.94;
      }

      if (p.alpha <= 0 || p.radius <= 1) {
        this.particles.splice(i, 1);
      }
    }

    // Update floating texts
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y += ft.vy * dt;
      ft.life -= dt;
      ft.opacity = Math.max(0, ft.life / 1.0);
      if (ft.scale < 1.0) ft.scale += dt * 3.5;

      if (ft.life <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }
  }

  // Render the entire scene
  renderScene(ball, net, streak = 0, aimingState = null, remainingSeconds = 180) {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.clearRect(0, 0, w, h);

    // 1. Arena Background
    this.renderArenaBackground(w, h);

    // 2. Parquet Wood Basketball Court Floor
    this.renderCourtFloor(w, h);

    // 3. Ball Floor Shadow
    if (ball) {
      this.renderBallShadow(ball);
    }

    // 4. Backboard, Wall Support, and Rim Back Part
    this.renderBackboardAndSupport(remainingSeconds);

    // 5. Basketball Net (Verlet rope mesh)
    if (net) {
      net.render(ctx);
    }

    // 6. Aiming Trajectory Guide (Dashed Arc)
    if (aimingState && aimingState.isAiming && aimingState.points) {
      this.renderAimTrajectory(aimingState);
    }

    // 7. Render Basketball (Sphere, radial lighting, rotating seams)
    if (ball) {
      this.renderBasketball(ball, streak);
    }

    // 8. Front Rim Plate (rendered over ball so ball goes INSIDE hoop)
    this.renderRimFront();

    // 9. Particle VFX (Sparks, Confetti, Fire)
    this.renderVFX();

    // 10. Floating Scores & Announcer texts
    this.renderFloatingTexts();
  }

  // Arena Background with stadium lights & crowd atmosphere
  renderArenaBackground(w, h) {
    const ctx = this.ctx;

    // Dark stadium arena gradient
    const bgGrad = ctx.createRadialGradient(w * 0.5, h * 0.4, 100, w * 0.5, h * 0.5, w * 0.9);
    bgGrad.addColorStop(0, "#192338");
    bgGrad.addColorStop(0.5, "#0e1422");
    bgGrad.addColorStop(1, "#060910");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // Arena Spotlights
    ctx.save();
    ctx.globalCompositeOperation = "screen";

    // Top-left floodlight beam
    const spot1 = ctx.createRadialGradient(w * 0.2, 80, 20, w * 0.35, 750, 650);
    spot1.addColorStop(0, "rgba(255, 245, 220, 0.25)");
    spot1.addColorStop(0.7, "rgba(255, 230, 180, 0.05)");
    spot1.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = spot1;
    ctx.beginPath();
    ctx.moveTo(w * 0.1, 0);
    ctx.lineTo(w * 0.3, 0);
    ctx.lineTo(w * 0.6, 1200);
    ctx.lineTo(0, 1200);
    ctx.closePath();
    ctx.fill();

    // Top-right hoop spotlight beam
    const spot2 = ctx.createRadialGradient(w * 0.8, 80, 20, this.hoop.rimLeftX + 100, this.hoop.rimY, 600);
    spot2.addColorStop(0, "rgba(255, 240, 210, 0.3)");
    spot2.addColorStop(0.8, "rgba(255, 200, 120, 0.04)");
    spot2.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = spot2;
    ctx.fillRect(0, 0, w, h);

    // Stadium upper bleachers subtle silhouettes
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "rgba(10, 15, 28, 0.7)";
    for (let r = 0; r < 5; r++) {
      ctx.fillRect(0, 200 + r * 50, w, 28);
    }

    ctx.restore();
  }

  // Hardwood basketball court floor with polished finish
  renderCourtFloor(w, h) {
    const ctx = this.ctx;
    const floorY = this.floorY;

    // Floor Base (Hardwood Maple gradient)
    const floorGrad = ctx.createLinearGradient(0, floorY, 0, h);
    floorGrad.addColorStop(0, "#d97724");
    floorGrad.addColorStop(0.15, "#b45309");
    floorGrad.addColorStop(0.6, "#78350f");
    floorGrad.addColorStop(1, "#451a03");
    ctx.fillStyle = floorGrad;
    ctx.fillRect(0, floorY, w, h - floorY);

    // Hardwood plank lines
    ctx.save();
    ctx.strokeStyle = "rgba(90, 35, 10, 0.25)";
    ctx.lineWidth = 2;
    const plankHeight = 24;
    for (let y = floorY; y < h; y += plankHeight) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();

      // Staggered vertical plank seams
      const offset = (Math.floor(y / plankHeight) % 3) * 80;
      for (let x = offset; x < w; x += 220) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, y + plankHeight);
        ctx.stroke();
      }
    }

    // Court Boundary Lines (Crisp White / NBA styling)
    ctx.lineWidth = 8;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.75)";

    // Baseline floor line
    ctx.beginPath();
    ctx.moveTo(0, floorY + 4);
    ctx.lineTo(w, floorY + 4);
    ctx.stroke();

    // 3-Point Arc perspective markings on floor
    ctx.beginPath();
    ctx.ellipse(w * 0.75, floorY + 60, 480, 140, 0, Math.PI * 0.85, Math.PI * 1.8);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
    ctx.lineWidth = 6;
    ctx.stroke();

    // Floor Glossy Highlight Reflection
    const glossGrad = ctx.createLinearGradient(0, floorY, 0, floorY + 120);
    glossGrad.addColorStop(0, "rgba(255, 255, 255, 0.25)");
    glossGrad.addColorStop(1, "rgba(255, 255, 255, 0)");
    ctx.fillStyle = glossGrad;
    ctx.fillRect(0, floorY, w, 120);

    ctx.restore();
  }

  // Realistic oval shadow on court floor
  renderBallShadow(ball) {
    const ctx = this.ctx;
    const distToFloor = Math.max(0, this.floorY - ball.y);
    const maxDist = 1200;
    const factor = Math.max(0, 1 - distToFloor / maxDist);

    const shadowWidth = ball.radius * (0.8 + factor * 0.8);
    const shadowHeight = ball.radius * (0.2 + factor * 0.25);
    const shadowAlpha = 0.55 * factor;

    ctx.save();
    ctx.beginPath();
    ctx.ellipse(ball.x, this.floorY + 8, shadowWidth, shadowHeight, 0, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(15, 7, 2, ${shadowAlpha})`;
    ctx.filter = `blur(${Math.max(2, (1 - factor) * 16)}px)`;
    ctx.fill();
    ctx.restore();
  }

  // Backboard, support strut, and digital shot clock
  renderBackboardAndSupport(remainingSeconds = 180) {
    const ctx = this.ctx;
    const bb = this.hoop;

    ctx.save();

    // 1. Heavy Steel Wall Mounting Arm
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(bb.backboardX + bb.backboardWidth, bb.rimY - 40, 1080 - (bb.backboardX + bb.backboardWidth), 70);
    ctx.strokeStyle = "#334155";
    ctx.lineWidth = 4;
    ctx.strokeRect(bb.backboardX + bb.backboardWidth, bb.rimY - 40, 1080 - (bb.backboardX + bb.backboardWidth), 70);

    // Diagonal Support Truss
    ctx.lineWidth = 14;
    ctx.strokeStyle = "#0f172a";
    ctx.beginPath();
    ctx.moveTo(bb.backboardX + bb.backboardWidth, bb.backboardTopY + 40);
    ctx.lineTo(1080, bb.backboardTopY - 120);
    ctx.moveTo(bb.backboardX + bb.backboardWidth, bb.backboardBottomY - 40);
    ctx.lineTo(1080, bb.backboardBottomY + 120);
    ctx.stroke();

    // 2. Glass Backboard Outer Bevel & Glow
    ctx.shadowColor = "rgba(0, 0, 0, 0.7)";
    ctx.shadowBlur = 18;
    ctx.shadowOffsetX = -6;

    // Tempered Glass Pane
    const glassGrad = ctx.createLinearGradient(bb.backboardX, 0, bb.backboardX + bb.backboardWidth, 0);
    glassGrad.addColorStop(0, "rgba(220, 240, 255, 0.35)");
    glassGrad.addColorStop(0.5, "rgba(180, 215, 245, 0.2)");
    glassGrad.addColorStop(1, "rgba(120, 160, 200, 0.45)");
    ctx.fillStyle = glassGrad;
    ctx.fillRect(bb.backboardX, bb.backboardTopY, bb.backboardWidth, bb.backboardBottomY - bb.backboardTopY);

    // Outer Heavy Steel Frame
    ctx.strokeStyle = "rgba(255, 255, 255, 0.85)";
    ctx.lineWidth = 6;
    ctx.strokeRect(bb.backboardX, bb.backboardTopY, bb.backboardWidth, bb.backboardBottomY - bb.backboardTopY);

    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;

    // Red Inner Target Square on Backboard (Regulation NBA target box)
    ctx.strokeStyle = "#ef4444";
    ctx.lineWidth = 8;
    const targetTop = bb.rimY - 140;
    const targetBottom = bb.rimY;
    ctx.beginPath();
    ctx.moveTo(bb.backboardX + 2, targetTop);
    ctx.lineTo(bb.backboardX - 110, targetTop);
    ctx.lineTo(bb.backboardX - 110, targetBottom);
    ctx.lineTo(bb.backboardX + 2, targetBottom);
    ctx.stroke();

    // Lower Backboard Safety Padding (NBA Dark Blue/Black pad)
    ctx.fillStyle = "#0284c7";
    ctx.fillRect(bb.backboardX - 6, bb.backboardBottomY - 24, bb.backboardWidth + 12, 28);

    // 3. Digital Arena Shot Clock on top of backboard
    const scWidth = 110;
    const scHeight = 56;
    const scX = bb.backboardX - 45;
    const scY = bb.backboardTopY - 68;

    ctx.fillStyle = "#0a0d14";
    ctx.fillRect(scX, scY, scWidth, scHeight);
    ctx.strokeStyle = "#475569";
    ctx.lineWidth = 3;
    ctx.strokeRect(scX, scY, scWidth, scHeight);

    // Shot Clock LED Display (Remaining seconds modulo 24)
    const shotClockVal = String((Math.floor(remainingSeconds) % 24) || 24).padStart(2, '0');
    ctx.font = "900 36px 'Segoe UI', Arial, sans-serif";
    ctx.fillStyle = remainingSeconds <= 10 ? "#ef4444" : "#f59e0b";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = ctx.fillStyle;
    ctx.shadowBlur = 10;
    ctx.fillText(shotClockVal, scX + scWidth / 2, scY + scHeight / 2);
    ctx.shadowBlur = 0;

    // 4. Heavy Steel Rim Bracket & Springs
    ctx.fillStyle = "#ea580c";
    ctx.fillRect(bb.rimRightX, bb.rimY - 10, bb.backboardX - bb.rimRightX + 4, 20);

    // Dual compression springs under rim
    ctx.fillStyle = "#78350f";
    ctx.fillRect(bb.rimRightX + 4, bb.rimY + 10, 16, 12);

    // Back rim peg
    ctx.beginPath();
    ctx.arc(bb.rimRightX, bb.rimY, bb.rimRadius, 0, Math.PI * 2);
    ctx.fillStyle = "#c2410c";
    ctx.fill();
    ctx.strokeStyle = "#9a3412";
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.restore();
  }

  // Front lip of steel rim (drawn on top of the ball for correct layering)
  renderRimFront() {
    const ctx = this.ctx;
    const bb = this.hoop;

    ctx.save();
    // Steel rim connecting bar
    ctx.strokeStyle = "#ea580c";
    ctx.lineWidth = 14;
    ctx.lineCap = "round";

    ctx.beginPath();
    ctx.moveTo(bb.rimLeftX, bb.rimY);
    ctx.lineTo(bb.rimRightX, bb.rimY);
    ctx.stroke();

    // Top highlight on steel rim for metallic tubular look
    ctx.strokeStyle = "#fdba74";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(bb.rimLeftX + 4, bb.rimY - 3);
    ctx.lineTo(bb.rimRightX - 4, bb.rimY - 3);
    ctx.stroke();

    // Left Front Rim Peg
    ctx.beginPath();
    ctx.arc(bb.rimLeftX, bb.rimY, bb.rimRadius, 0, Math.PI * 2);
    ctx.fillStyle = "#ea580c";
    ctx.fill();
    ctx.strokeStyle = "#fed7aa";
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.restore();
  }

  // High Fidelity Realistic Basketball with 3D Sphere Shading & Seams
  renderBasketball(ball, streak = 0) {
    const ctx = this.ctx;
    const r = ball.radius;

    ctx.save();
    ctx.translate(ball.x, ball.y);

    // Hot streak fire aura
    if (streak >= 2) {
      this.spawnFlameParticle(ball.x, ball.y);
      ctx.save();
      ctx.beginPath();
      ctx.arc(0, 0, r * 1.25, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255, 106, 0, 0.25)";
      ctx.filter = "blur(12px)";
      ctx.fill();
      ctx.restore();
    }

    // Clip to spherical ball circle
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.clip();

    // 1. Base Basketball Leather Radial Lighting (Simulating top-left arena lights)
    const ballGrad = ctx.createRadialGradient(-r * 0.35, -r * 0.35, r * 0.1, 0, 0, r);
    ballGrad.addColorStop(0, "#fb923c");   // Highlight
    ballGrad.addColorStop(0.4, "#ea580c"); // True leather orange
    ballGrad.addColorStop(0.85, "#c2410c"); // Shadow rim
    ballGrad.addColorStop(1, "#7c2d12");   // Deep dark ambient occlusion
    ctx.fillStyle = ballGrad;
    ctx.fill();

    // 2. Realistic Basketball Seams (Black lines that rotate with ball.rotation)
    ctx.save();
    ctx.rotate(ball.rotation);

    ctx.strokeStyle = "#1c1917";
    ctx.lineWidth = 4.5;
    ctx.lineCap = "round";

    // Horizontal Seam
    ctx.beginPath();
    ctx.moveTo(-r, 0);
    ctx.lineTo(r, 0);
    ctx.stroke();

    // Vertical Seam
    ctx.beginPath();
    ctx.moveTo(0, -r);
    ctx.lineTo(0, r);
    ctx.stroke();

    // Left Curved Signature Seam
    ctx.beginPath();
    ctx.arc(-r * 0.95, 0, r * 0.88, -Math.PI * 0.42, Math.PI * 0.42);
    ctx.stroke();

    // Right Curved Signature Seam
    ctx.beginPath();
    ctx.arc(r * 0.95, 0, r * 0.88, Math.PI * 0.58, Math.PI * 1.42);
    ctx.stroke();

    // Center Logo / Brand Stamp ("SPALDING" or "NBA STYLE")
    ctx.fillStyle = "rgba(28, 25, 23, 0.4)";
    ctx.font = "900 14px 'Montserrat', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("PRO 3", 0, -r * 0.32);

    ctx.restore();

    // 3. Spherical Surface Gloss Highlight (Rim specular)
    const gloss = ctx.createRadialGradient(-r * 0.4, -r * 0.4, 2, -r * 0.4, -r * 0.4, r * 0.8);
    gloss.addColorStop(0, "rgba(255, 255, 255, 0.4)");
    gloss.addColorStop(0.3, "rgba(255, 255, 255, 0.1)");
    gloss.addColorStop(1, "rgba(255, 255, 255, 0)");
    ctx.fillStyle = gloss;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();

    // Outer spherical rim outline
    ctx.strokeStyle = "rgba(67, 20, 7, 0.85)";
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.arc(0, 0, r - 1.5, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }

  // Dynamic dashed aiming arc with pulsing dots and slingshot tension band
  renderAimTrajectory(aimingState) {
    if (!aimingState || !aimingState.points || aimingState.points.length < 2) return;
    const ctx = this.ctx;
    const points = aimingState.points;

    ctx.save();

    // 1. Elastic pull band if dragging
    if (aimingState.dragStart && aimingState.dragCurrent) {
      ctx.beginPath();
      ctx.moveTo(aimingState.dragStart.x, aimingState.dragStart.y);
      ctx.lineTo(aimingState.dragCurrent.x, aimingState.dragCurrent.y);
      ctx.strokeStyle = "rgba(255, 106, 0, 0.45)";
      ctx.lineWidth = 4;
      ctx.setLineDash([8, 8]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Touch anchor dot
      ctx.beginPath();
      ctx.arc(aimingState.dragCurrent.x, aimingState.dragCurrent.y, 16, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255, 255, 255, 0.25)";
      ctx.strokeStyle = "#ff6a00";
      ctx.lineWidth = 3;
      ctx.fill();
      ctx.stroke();
    }

    // 2. Glowing gradient dots along trajectory
    for (let i = 1; i < points.length; i++) {
      const p = points[i];
      const progress = i / points.length;
      const dotRadius = Math.max(3.5, 10 * (1 - progress * 0.65));
      const alpha = Math.max(0.2, 0.95 * (1 - progress * 0.7));

      ctx.beginPath();
      ctx.arc(p.x, p.y, dotRadius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 183, 3, ${alpha})`;
      ctx.shadowColor = "#ff6a00";
      ctx.shadowBlur = 12;
      ctx.fill();
    }

    // 3. Landing marker ring
    const lastP = points[points.length - 1];
    ctx.beginPath();
    ctx.arc(lastP.x, lastP.y, 16, 0, Math.PI * 2);
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 4;
    ctx.shadowColor = "#38bdf8";
    ctx.shadowBlur = 8;
    ctx.stroke();

    ctx.restore();
  }

  // Render particles (fire, sparks, confetti)
  renderVFX() {
    const ctx = this.ctx;
    ctx.save();

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(1, p.radius), 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0, Math.min(1, p.alpha));

      if (p.type === 'fire') {
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 12;
      }
      ctx.fill();
    }

    ctx.restore();
  }

  // Floating score and achievement texts
  renderFloatingTexts() {
    const ctx = this.ctx;
    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    for (let i = 0; i < this.floatingTexts.length; i++) {
      const ft = this.floatingTexts[i];
      ctx.save();
      ctx.translate(ft.x, ft.y);
      ctx.scale(ft.scale, ft.scale);
      ctx.globalAlpha = ft.opacity;

      ctx.font = `900 ${ft.fontSize}px 'Montserrat', Impact, sans-serif`;
      ctx.fillStyle = ft.color;
      ctx.shadowColor = "#000000";
      ctx.shadowBlur = 14;

      // Crisp text stroke
      ctx.lineWidth = 7;
      ctx.strokeStyle = "#0b0f19";
      ctx.strokeText(ft.text, 0, 0);
      ctx.fillText(ft.text, 0, 0);

      ctx.restore();
    }

    ctx.restore();
  }
}

window.BasketballRenderer = BasketballRenderer;
