/**
 * Visual Renderer Engine - "5D Quality" High-Fidelity Stadium Visuals
 * 
 * Features:
 * - 1080x1920 Ultra-Crisp Canvas Rendering Pipeline
 * - Dynamic Volumetric Stadium Floodlights & Lens Flares
 * - Perspective Manicured Turf with Alternating Cut Stripes
 * - 3D Perspective Goal Frame with Specular Highlights
 * - Interactive Spring-Mass Goal Net Simulation (Ripples on Ball Impact)
 * - Spherical 3D Football Rotation (Pentagon Textures Spin with Ball Curve)
 * - Dynamic Ground Shadows based on Stadium Lighting Angle
 * - Animated Point Target Zones & Floating Bonus Bar
 * - Stylized Goalkeeper Rendering with Glove Hitboxes and Dive Trails
 * - Confetti Cannons, Shockwaves, Camera Shake & Floating Score Badges
 */

class GameRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    
    // Internal coordinate system locked to 1080 x 1920
    this.width = 1080;
    this.height = 1920;
    this.canvas.width = this.width;
    this.canvas.height = this.height;

    // Camera shake offset
    this.shakeIntensity = 0;
    this.shakeX = 0;
    this.shakeY = 0;

    // Particles & Floating texts
    this.particles = [];
    this.floatingTexts = [];
    this.confettiPieces = [];

    // Initialize Interactive Dynamic Net Mesh
    this.initNetMesh();

    // Ambient crowd animation timer
    this.animTime = 0;
  }

  initNetMesh() {
    // 14 columns x 9 rows grid of spring-mass points
    this.netCols = 14;
    this.netRows = 9;
    this.netNodes = [];

    const goalLeft = 140;
    const goalRight = 940;
    const goalTop = 460;
    const goalBottom = 920;
    const goalWidth = goalRight - goalLeft;
    const goalHeight = goalBottom - goalTop;

    for (let r = 0; r < this.netRows; r++) {
      this.netNodes[r] = [];
      const vProgress = r / (this.netRows - 1);
      const y = goalTop + vProgress * goalHeight;

      for (let c = 0; c < this.netCols; c++) {
        const hProgress = c / (this.netCols - 1);
        const x = goalLeft + hProgress * goalWidth;

        // Anchor top, left, right, and bottom boundary nodes
        const isPinned = (r === 0 || c === 0 || c === this.netCols - 1 || r === this.netRows - 1);

        this.netNodes[r][c] = {
          origX: x,
          origY: y,
          x: x,
          y: y,
          zOffset: 0, // displacement backwards into the net
          vx: 0,
          vy: 0,
          vz: 0,
          pinned: isPinned
        };
      }
    }
  }

  updateNetPhysics(dt, ballImpact) {
    // If ball impacts net, push closest nodes back
    if (ballImpact) {
      const { x, y, force } = ballImpact;
      for (let r = 1; r < this.netRows - 1; r++) {
        for (let c = 1; c < this.netCols - 1; c++) {
          const node = this.netNodes[r][c];
          const dist = Math.hypot(node.x - x, node.y - y);
          if (dist < 180) {
            const push = (1 - dist / 180) * force * 15;
            node.vz += push;
            node.vy += push * 0.3;
          }
        }
      }
    }

    // Spring relaxation and damping
    const springK = 35;
    const damping = 0.88;

    for (let r = 1; r < this.netRows - 1; r++) {
      for (let c = 1; c < this.netCols - 1; c++) {
        const node = this.netNodes[r][c];
        
        // Pull back to origin
        const dz = -node.zOffset;
        const dy = node.origY - node.y;
        
        node.vz += dz * springK * dt;
        node.vy += dy * springK * dt;

        node.vz *= damping;
        node.vy *= damping;

        node.zOffset += node.vz * dt;
        node.y += node.vy * dt;
      }
    }
  }

  triggerCameraShake(intensity = 15) {
    this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
  }

  addFloatingText(text, x, y, color = '#ffd700', size = 48) {
    this.floatingTexts.push({
      text,
      x,
      y,
      color,
      size,
      alpha: 1.0,
      vy: -110,
      life: 1.4
    });
  }

  addConfettiBurst(x, y, count = 100) {
    const colors = ['#00f0ff', '#ffd700', '#ff0055', '#00ff88', '#ffffff', '#ff9900'];
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 250 + Math.random() * 650;
      this.confettiPieces.push({
        x: x + (Math.random() - 0.5) * 60,
        y: y + (Math.random() - 0.5) * 60,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 200,
        gravity: 800 + Math.random() * 400,
        color: colors[Math.floor(Math.random() * colors.length)],
        width: 12 + Math.random() * 12,
        height: 8 + Math.random() * 8,
        rot: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 15,
        alpha: 1.0,
        life: 2.2 + Math.random() * 1.0
      });
    }
  }

  addParticles(x, y, color = '#00f0ff', count = 25) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 100 + Math.random() * 300;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        size: 5 + Math.random() * 7,
        alpha: 1.0,
        life: 0.6 + Math.random() * 0.5
      });
    }
  }

  updateVisuals(dt) {
    this.animTime += dt;

    // Camera shake decay
    if (this.shakeIntensity > 0) {
      this.shakeX = (Math.random() - 0.5) * this.shakeIntensity * 2;
      this.shakeY = (Math.random() - 0.5) * this.shakeIntensity * 2;
      this.shakeIntensity = Math.max(0, this.shakeIntensity - dt * 45);
    } else {
      this.shakeX = 0;
      this.shakeY = 0;
    }

    // Update floating texts
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y += ft.vy * dt;
      ft.life -= dt;
      ft.alpha = Math.max(0, ft.life / 1.4);
      if (ft.life <= 0) this.floatingTexts.splice(i, 1);
    }

    // Update confetti
    for (let i = this.confettiPieces.length - 1; i >= 0; i--) {
      const cp = this.confettiPieces[i];
      cp.x += cp.vx * dt;
      cp.y += cp.vy * dt;
      cp.vy += cp.gravity * dt;
      cp.vx *= 0.98;
      cp.rot += cp.vRot * dt;
      cp.life -= dt;
      cp.alpha = Math.max(0, cp.life / 2.0);
      if (cp.life <= 0 || cp.y > this.height) this.confettiPieces.splice(i, 1);
    }

    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.size = Math.max(0.1, p.size - dt * 6);
      p.life -= dt;
      p.alpha = Math.max(0, p.life);
      if (p.life <= 0) this.particles.splice(i, 1);
    }
  }

  // ================= MAIN DRAW CYCLE =================
  renderScene(game) {
    const ctx = this.ctx;
    ctx.save();

    // Apply camera shake
    ctx.translate(this.shakeX, this.shakeY);

    // 1. Draw Stadium Sky, Stands & Crowd
    this.drawStadiumSky(ctx);
    this.drawCrowdAndStands(ctx);

    // 2. Draw Floodlights & Volumetric Beams
    this.drawFloodlights(ctx);

    // 3. Draw Pitch with Cut Stripes and Penalty Area Lines
    this.drawPitch(ctx);

    // 4. Draw Goal Background & Depth Shadow
    this.drawGoalBackground(ctx, game.goalBox);

    // 5. Draw Dynamic Goal Net
    this.drawNet(ctx);

    // 6. Draw Goal Frame (Posts & Crossbar)
    this.drawGoalFrame(ctx, game.goalBox);

    // 7. Draw Target Zones & Moving Extra Kick Bonus Bar
    this.drawTargetZones(ctx, game.targetZones, game.bonusBar);

    // 8. Draw Goalkeeper
    if (game.goalkeeper) {
      this.drawGoalkeeper(ctx, game.goalkeeper);
    }

    // 9. Draw Ball (with Dynamic Shadow and 3D Spin Pattern)
    if (game.ball) {
      this.drawBallWithShadow(ctx, game.ball);
    }

    // 10. Draw Swipe Trail if aiming
    if (game.isAiming && game.aimTrail && game.aimTrail.length > 1) {
      this.drawSwipeTrail(ctx, game.aimTrail);
    }

    // 11. Draw Particles, Confetti, and Floating Texts
    this.drawParticles(ctx);
    this.drawConfetti(ctx);
    this.drawFloatingTexts(ctx);

    // 12. Draw Goal Celebration Overlay Banner
    if (game.goalBannerTimer > 0) {
      this.drawGoalBanner(ctx, game.goalBannerText, game.goalBannerTimer);
    }

    ctx.restore();
  }

  // ================= SCENE COMPONENTS =================

  drawStadiumSky(ctx) {
    const skyGrad = ctx.createLinearGradient(0, 0, 0, 480);
    skyGrad.addColorStop(0, '#030810');
    skyGrad.addColorStop(0.5, '#0a1628');
    skyGrad.addColorStop(1, '#0e243a');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, this.width, 480);

    // Distant stadium canopy structure
    ctx.fillStyle = '#060d19';
    ctx.beginPath();
    ctx.moveTo(0, 260);
    ctx.quadraticCurveTo(this.width / 2, 220, this.width, 260);
    ctx.lineTo(this.width, 320);
    ctx.lineTo(0, 320);
    ctx.closePath();
    ctx.fill();
  }

  drawCrowdAndStands(ctx) {
    // Tiered stadium seating
    const standGrad = ctx.createLinearGradient(0, 240, 0, 460);
    standGrad.addColorStop(0, '#101c2c');
    standGrad.addColorStop(1, '#0d1520');
    ctx.fillStyle = standGrad;
    ctx.fillRect(0, 240, this.width, 220);

    // Animated crowd dots / cheering silhouettes
    const t = this.animTime * 4;
    const colors = ['#e63946', '#f1faee', '#a8dadc', '#457b9d', '#1d3557', '#ffd166', '#06d6a0'];
    
    ctx.save();
    for (let row = 0; row < 5; row++) {
      const y = 265 + row * 34;
      const wave = Math.sin(t + row * 0.8) * 4;
      for (let col = 0; col < 36; col++) {
        const x = 15 + col * 30 + (row % 2) * 12;
        const bounce = Math.abs(Math.sin(t * 1.5 + col * 0.4 + row)) * 5;
        const color = colors[(col + row * 3) % colors.length];
        
        ctx.fillStyle = color;
        ctx.beginPath();
        // Crowd head
        ctx.arc(x, y - bounce - wave, 5.5, 0, Math.PI * 2);
        ctx.fill();
        // Crowd shoulders
        ctx.fillRect(x - 5, y - bounce - wave + 4, 10, 8);
      }
    }
    ctx.restore();

    // Stadium LED advertising board
    const ledGrad = ctx.createLinearGradient(0, 430, 0, 465);
    ledGrad.addColorStop(0, '#112233');
    ledGrad.addColorStop(0.5, '#001a33');
    ledGrad.addColorStop(1, '#000d1a');
    ctx.fillStyle = ledGrad;
    ctx.fillRect(0, 430, this.width, 35);

    // LED scrolling text / sponsor glow
    ctx.save();
    ctx.font = 'bold 16px "Montserrat", sans-serif';
    ctx.fillStyle = '#00f0ff';
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 10;
    const scrollX = -(this.animTime * 90) % 600;
    for (let i = -1; i < 4; i++) {
      ctx.fillText('⚽ FOOTBALL CHAMPIONS TOURNAMENT 2026 • KICK & WIN •', scrollX + i * 550, 453);
    }
    ctx.restore();
  }

  drawFloodlights(ctx) {
    const lights = [
      { x: 120, y: 70, targetX: 450, targetY: 750 },
      { x: this.width - 120, y: 70, targetX: 630, targetY: 750 }
    ];

    lights.forEach(l => {
      // Volumetric beam
      const beamGrad = ctx.createRadialGradient(l.x, l.y, 10, l.targetX, l.targetY, 650);
      beamGrad.addColorStop(0, 'rgba(255, 255, 255, 0.45)');
      beamGrad.addColorStop(0.3, 'rgba(180, 230, 255, 0.20)');
      beamGrad.addColorStop(1, 'rgba(0, 150, 255, 0)');

      ctx.save();
      ctx.fillStyle = beamGrad;
      ctx.beginPath();
      ctx.moveTo(l.x, l.y);
      ctx.lineTo(l.targetX - 350, 1000);
      ctx.lineTo(l.targetX + 350, 1000);
      ctx.closePath();
      ctx.fill();

      // Floodlight tower head
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#88ddff';
      ctx.shadowBlur = 35;
      for (let r = 0; r < 2; r++) {
        for (let c = 0; c < 3; c++) {
          ctx.beginPath();
          ctx.arc(l.x - 24 + c * 24, l.y - 12 + r * 24, 7, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();
    });
  }

  drawPitch(ctx) {
    const pitchTop = 460;
    const pitchBottom = this.height;

    // Base green grass
    const grassGrad = ctx.createLinearGradient(0, pitchTop, 0, pitchBottom);
    grassGrad.addColorStop(0, '#134724');
    grassGrad.addColorStop(0.4, '#1b5e2f');
    grassGrad.addColorStop(1, '#258442');
    ctx.fillStyle = grassGrad;
    ctx.fillRect(0, pitchTop, this.width, pitchBottom - pitchTop);

    // Alternating horizontal stripes for perspective lawn
    const stripes = 16;
    for (let i = 0; i < stripes; i++) {
      if (i % 2 === 0) continue;
      const progress1 = i / stripes;
      const progress2 = (i + 1) / stripes;
      
      // Perspective non-linear easing for stripe heights
      const y1 = pitchTop + Math.pow(progress1, 1.6) * (pitchBottom - pitchTop);
      const y2 = pitchTop + Math.pow(progress2, 1.6) * (pitchBottom - pitchTop);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.055)';
      ctx.fillRect(0, y1, this.width, y2 - y1);
    }

    // Pitch Line markings
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.lineWidth = 6;
    ctx.shadowColor = 'rgba(255, 255, 255, 0.4)';
    ctx.shadowBlur = 5;

    // Goal line
    ctx.beginPath();
    ctx.moveTo(80, 920);
    ctx.lineTo(1000, 920);
    ctx.stroke();

    // 6-yard box
    ctx.beginPath();
    ctx.moveTo(260, 920);
    ctx.lineTo(210, 1070);
    ctx.lineTo(870, 1070);
    ctx.lineTo(820, 920);
    ctx.stroke();

    // Penalty box (18-yard box)
    ctx.beginPath();
    ctx.moveTo(110, 920);
    ctx.lineTo(40, 1340);
    ctx.lineTo(1040, 1340);
    ctx.lineTo(970, 920);
    ctx.stroke();

    // Penalty Arc (D-Box)
    ctx.beginPath();
    ctx.arc(this.width / 2, 1340, 140, 0.2 * Math.PI, 0.8 * Math.PI, false);
    ctx.stroke();

    // Penalty Spot (Kick position)
    const spotX = this.width / 2;
    const spotY = 1530;
    
    // Spot glow ring
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.6)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(spotX, spotY, 22 + Math.sin(this.animTime * 3) * 3, 0, Math.PI * 2);
    ctx.stroke();

    // Solid white spot
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(spotX, spotY, 11, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  drawGoalBackground(ctx, goalBox) {
    // Shaded interior of the net cavity to create depth
    const netDepthGrad = ctx.createLinearGradient(0, goalBox.y, 0, goalBox.y + goalBox.height);
    netDepthGrad.addColorStop(0, 'rgba(0, 0, 0, 0.85)');
    netDepthGrad.addColorStop(0.7, 'rgba(5, 18, 10, 0.7)');
    netDepthGrad.addColorStop(1, 'rgba(10, 30, 15, 0.4)');

    ctx.fillStyle = netDepthGrad;
    ctx.beginPath();
    ctx.moveTo(goalBox.x, goalBox.y);
    ctx.lineTo(goalBox.x + goalBox.width, goalBox.y);
    ctx.lineTo(goalBox.x + goalBox.width + 40, goalBox.y + goalBox.height);
    ctx.lineTo(goalBox.x - 40, goalBox.y + goalBox.height);
    ctx.closePath();
    ctx.fill();
  }

  drawNet(ctx) {
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = 1.5;

    // Draw horizontal net cords
    for (let r = 0; r < this.netRows; r++) {
      ctx.beginPath();
      for (let c = 0; c < this.netCols; c++) {
        const node = this.netNodes[r][c];
        const nx = node.x;
        const ny = node.y + (node.zOffset * 0.2); // Z displacement translates to Y sagging
        if (c === 0) ctx.moveTo(nx, ny);
        else ctx.lineTo(nx, ny);
      }
      ctx.stroke();
    }

    // Draw vertical net cords
    for (let c = 0; c < this.netCols; c++) {
      ctx.beginPath();
      for (let r = 0; r < this.netRows; r++) {
        const node = this.netNodes[r][c];
        const nx = node.x;
        const ny = node.y + (node.zOffset * 0.2);
        if (r === 0) ctx.moveTo(nx, ny);
        else ctx.lineTo(nx, ny);
      }
      ctx.stroke();
    }

    ctx.restore();
  }

  drawGoalFrame(ctx, goalBox) {
    const { x, y, width, height } = goalBox;
    const postRadius = 14;

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Back support bars (depth perspective)
    ctx.strokeStyle = 'rgba(180, 200, 215, 0.6)';
    ctx.lineWidth = 10;
    // Left depth post
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - 50, y + 60);
    ctx.lineTo(x - 40, y + height);
    ctx.stroke();

    // Right depth post
    ctx.beginPath();
    ctx.moveTo(x + width, y);
    ctx.lineTo(x + width + 50, y + 60);
    ctx.lineTo(x + width + 40, y + height);
    ctx.stroke();

    // Main Goal Frame (Cylindrical 3D White Posts)
    const draw3DCylinder = (x1, y1, x2, y2, isHoriz = false) => {
      // Base shadow
      ctx.strokeStyle = '#6c7a89';
      ctx.lineWidth = postRadius * 2;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();

      // Main white core
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = postRadius * 1.5;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();

      // Specular highlight gleam
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.95)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      if (isHoriz) {
        ctx.moveTo(x1, y1 - 4);
        ctx.lineTo(x2, y2 - 4);
      } else {
        ctx.moveTo(x1 - 3, y1);
        ctx.lineTo(x2 - 3, y2);
      }
      ctx.stroke();
    };

    // Crossbar
    draw3DCylinder(x, y, x + width, y, true);
    // Left post
    draw3DCylinder(x, y, x, y + height, false);
    // Right post
    draw3DCylinder(x + width, y, x + width, y + height, false);

    // Corner joints (Elbow couplings)
    ctx.fillStyle = '#e0e6ed';
    ctx.beginPath();
    ctx.arc(x, y, postRadius * 1.25, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(x + width, y, postRadius * 1.25, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  drawTargetZones(ctx, targetZones, bonusBar) {
    if (!targetZones) return;

    ctx.save();
    const t = this.animTime * 3;

    // Draw standard point target zones
    targetZones.forEach(zone => {
      const pulse = Math.sin(t + zone.points) * 4;
      const r = zone.radius + pulse;

      // Glow circle
      ctx.strokeStyle = zone.color;
      ctx.lineWidth = 3.5;
      ctx.shadowColor = zone.color;
      ctx.shadowBlur = 15;
      
      // Rotating outer bracket ring
      ctx.beginPath();
      ctx.arc(zone.x, zone.y, r, t, t + Math.PI * 0.7);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(zone.x, zone.y, r, t + Math.PI, t + Math.PI * 1.7);
      ctx.stroke();

      // Inner point disc
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.beginPath();
      ctx.arc(zone.x, zone.y, r * 0.72, 0, Math.PI * 2);
      ctx.fill();

      // Point text
      ctx.font = '900 24px "Montserrat", sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowBlur = 8;
      ctx.fillText(`${zone.points}`, zone.x, zone.y);
    });

    // Draw Moving "Extra Kick" Bonus Bar
    if (bonusBar && bonusBar.active) {
      const bx = bonusBar.x;
      const by = bonusBar.y;
      const bw = bonusBar.width;
      const bh = bonusBar.height;

      // Golden aura
      ctx.shadowColor = '#ffd700';
      ctx.shadowBlur = 25;

      // Moving bar body
      const barGrad = ctx.createLinearGradient(bx, by, bx + bw, by);
      barGrad.addColorStop(0, '#ff9900');
      barGrad.addColorStop(0.5, '#ffee55');
      barGrad.addColorStop(1, '#ff9900');
      ctx.fillStyle = barGrad;

      // Rounded rect
      ctx.beginPath();
      ctx.roundRect(bx, by, bw, bh, 14);
      ctx.fill();

      // Border shimmer
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Text inside bonus bar
      ctx.font = '900 20px "Montserrat", sans-serif';
      ctx.fillStyle = '#060e14';
      ctx.shadowBlur = 0;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('⭐ +1 EXTRA KICK ⭐', bx + bw / 2, by + bh / 2 + 1);
    }

    ctx.restore();
  }

  drawGoalkeeper(ctx, gk) {
    ctx.save();
    ctx.translate(gk.x, gk.y);
    ctx.rotate(gk.diveAngle);

    // Dynamic ground shadow
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.ellipse(0, 0, 60, 20, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Torso / Jersey (Neon Yellow / Black Pro Keeper Kit)
    const jerseyGrad = ctx.createLinearGradient(-35, -130, 35, -60);
    jerseyGrad.addColorStop(0, '#e0fe00');
    jerseyGrad.addColorStop(0.6, '#ccff00');
    jerseyGrad.addColorStop(1, '#111111');
    ctx.fillStyle = jerseyGrad;
    ctx.beginPath();
    ctx.roundRect(-34, -135, 68, 75, 12);
    ctx.fill();

    // Jersey Number "1"
    ctx.font = '900 28px "Montserrat", sans-serif';
    ctx.fillStyle = '#111111';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('1', 0, -96);

    // Shorts
    ctx.fillStyle = '#181818';
    ctx.beginPath();
    ctx.roundRect(-30, -62, 60, 38, 6);
    ctx.fill();

    // Legs & Socks
    ctx.fillStyle = '#222222';
    // Left leg
    ctx.fillRect(-24, -26, 16, 28);
    // Right leg
    ctx.fillRect(8, -26, 16, 28);

    // Boots
    ctx.fillStyle = '#ff0055';
    ctx.beginPath();
    ctx.roundRect(-28, 2, 22, 10, 4);
    ctx.roundRect(6, 2, 22, 10, 4);
    ctx.fill();

    // Head, Neck & Hair
    ctx.fillStyle = '#e8b288'; // Skin tone
    ctx.fillRect(-7, -145, 14, 12); // Neck

    ctx.beginPath();
    ctx.arc(0, -158, 20, 0, Math.PI * 2); // Head
    ctx.fill();

    // Hair / Headband
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath();
    ctx.arc(0, -164, 20, Math.PI, Math.PI * 2);
    ctx.fill();

    // Pro Headband
    ctx.fillStyle = '#00f0ff';
    ctx.fillRect(-19, -162, 38, 7);

    // Stretched Arms & Pro Goalkeeper Gloves
    const reach = 60 + gk.armExtension * gk.reachRadius;
    const gloveRadius = 26 + (gk.level * 3);

    const drawArmAndGlove = (isRight) => {
      const side = isRight ? 1 : -1;
      const handX = side * reach;
      const handY = -120 - gk.armExtension * 30;

      // Arm sleeve
      ctx.strokeStyle = '#e0fe00';
      ctx.lineWidth = 16;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(side * 28, -120);
      ctx.lineTo(handX, handY);
      ctx.stroke();

      // Glove (High visibility neon orange/cyan)
      ctx.fillStyle = '#ff6600';
      ctx.shadowColor = '#ff6600';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(handX, handY, gloveRadius, 0, Math.PI * 2);
      ctx.fill();

      // Glove palm grip lines
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(handX, handY, gloveRadius * 0.6, 0, Math.PI * 2);
      ctx.stroke();
    };

    drawArmAndGlove(false); // Left arm
    drawArmAndGlove(true);  // Right arm

    ctx.restore();
  }

  drawBallWithShadow(ctx, ball) {
    const { x, y, z, radius, rotationX, rotationY, isRolling } = ball;

    ctx.save();

    // 1. Dynamic Pitch Shadow
    // Shadow Y stays on ground plane while ball flies into the air
    const groundY = ball.groundY || y;
    const elevation = Math.max(0, groundY - y);
    const shadowScale = Math.max(0.3, 1 - elevation / 900);
    const shadowAlpha = Math.max(0.12, 0.55 - elevation / 1200);

    ctx.fillStyle = `rgba(0, 0, 0, ${shadowAlpha})`;
    ctx.beginPath();
    // Stadium lights cast slight horizontal offset
    const shadowX = x + (x - this.width / 2) * 0.08;
    ctx.ellipse(shadowX, groundY, radius * shadowScale * 1.4, radius * shadowScale * 0.45, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. 3D Football Body
    ctx.translate(x, y);

    // Ball ambient shadow & white sphere gradient
    const ballGrad = ctx.createRadialGradient(-radius * 0.35, -radius * 0.4, radius * 0.1, 0, 0, radius);
    ballGrad.addColorStop(0, '#ffffff');
    ballGrad.addColorStop(0.65, '#f0f2f5');
    ballGrad.addColorStop(0.9, '#cdd3db');
    ballGrad.addColorStop(1, '#8e9aa8');

    ctx.fillStyle = ballGrad;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();

    // 3. Spherical 32-Panel Football Pattern with 3D Rotation
    ctx.save();
    ctx.beginPath();
    ctx.arc(0, 0, radius - 1, 0, Math.PI * 2);
    ctx.clip(); // Clip pentagons inside ball sphere

    // Draw rotating pentagon panels
    const drawPentagon = (px, py, pr, pRot) => {
      // Perspective scale based on distance from center of ball
      const dist = Math.hypot(px, py);
      if (dist > radius * 1.15) return;
      const compression = Math.sqrt(Math.max(0.01, 1 - Math.pow(dist / radius, 2)));

      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(pRot);
      ctx.scale(compression, compression);

      ctx.fillStyle = '#141414';
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
        const vx = Math.cos(angle) * pr;
        const vy = Math.sin(angle) * pr;
        if (i === 0) ctx.moveTo(vx, vy);
        else ctx.lineTo(vx, vy);
      }
      ctx.closePath();
      ctx.fill();

      // Panel seam line
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.lineWidth = 2.5;
      for (let i = 0; i < 5; i++) {
        const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
        ctx.beginPath();
        ctx.moveTo(Math.cos(angle) * pr, Math.sin(angle) * pr);
        ctx.lineTo(Math.cos(angle) * (pr * 1.8), Math.sin(angle) * (pr * 1.8));
        ctx.stroke();
      }

      ctx.restore();
    };

    // Center pentagon moving with rotation
    const rotOffsetX = (rotationX % (radius * 2)) - radius;
    const rotOffsetY = (rotationY % (radius * 2)) - radius;

    drawPentagon(rotOffsetX, rotOffsetY, radius * 0.34, rotationX * 0.05);
    drawPentagon(rotOffsetX - radius * 0.9, rotOffsetY - radius * 0.7, radius * 0.32, 0.4);
    drawPentagon(rotOffsetX + radius * 0.9, rotOffsetY - radius * 0.7, radius * 0.32, -0.4);
    drawPentagon(rotOffsetX - radius * 0.8, rotOffsetY + radius * 0.8, radius * 0.32, 1.2);
    drawPentagon(rotOffsetX + radius * 0.8, rotOffsetY + radius * 0.8, radius * 0.32, -1.2);
    drawPentagon(rotOffsetX, rotOffsetY + radius * 1.1, radius * 0.32, 0);

    ctx.restore();

    // 4. Glossy Specular Gleam Overlay
    const glossGrad = ctx.createRadialGradient(-radius * 0.38, -radius * 0.42, 2, -radius * 0.25, -radius * 0.3, radius * 0.6);
    glossGrad.addColorStop(0, 'rgba(255, 255, 255, 0.85)');
    glossGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.25)');
    glossGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');

    ctx.fillStyle = glossGrad;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  drawSwipeTrail(ctx, trail) {
    if (!trail || trail.length < 2) return;

    ctx.save();

    // 1. Draw glowing user swipe stroke
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 10;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 20;

    ctx.beginPath();
    for (let i = 0; i < trail.length; i++) {
      const p = trail[i];
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    }
    ctx.stroke();

    const startPt = trail[0];
    const lastPt = trail[trail.length - 1];
    const dx = lastPt.x - startPt.x;
    const dy = lastPt.y - startPt.y;

    // Only project aim guide if swiping upward
    if (dy < -20) {
      // Calculate projected target point at goal line
      const targetX = 540 + dx * 0.88;
      const targetY = Math.max(480, Math.min(910, 920 - (Math.abs(dy) * 0.72)));

      // 2. Draw Dotted Predictive Trajectory Arc towards Goal
      ctx.setLineDash([14, 12]);
      ctx.lineWidth = 5;
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.75)';
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 15;

      ctx.beginPath();
      ctx.moveTo(540, 1530); // From penalty spot
      // Quadratic curve bending with swipe direction
      const controlX = 540 + dx * 0.45;
      const controlY = 1530 + dy * 0.65;
      ctx.quadraticCurveTo(controlX, controlY, targetX, targetY);
      ctx.stroke();
      ctx.setLineDash([]); // Reset dash

      // 3. Draw Target Reticle Ring at projected landing spot
      const reticleRadius = 28 + Math.sin(this.animTime * 6) * 4;
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 3.5;
      ctx.shadowColor = '#ffd700';
      ctx.shadowBlur = 20;

      ctx.beginPath();
      ctx.arc(targetX, targetY, reticleRadius, 0, Math.PI * 2);
      ctx.stroke();

      // Crosshairs inside reticle
      ctx.beginPath();
      ctx.moveTo(targetX - reticleRadius * 0.6, targetY);
      ctx.lineTo(targetX + reticleRadius * 0.6, targetY);
      ctx.moveTo(targetX, targetY - reticleRadius * 0.6);
      ctx.lineTo(targetX, targetY + reticleRadius * 0.6);
      ctx.stroke();
    }

    // Guide tip indicator on swipe finger
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(lastPt.x, lastPt.y, 12, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  drawFloatingTexts(ctx) {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    this.floatingTexts.forEach(ft => {
      ctx.globalAlpha = ft.alpha;
      ctx.font = `900 ${ft.size}px "Montserrat", sans-serif`;
      ctx.fillStyle = ft.color;
      ctx.shadowColor = ft.color;
      ctx.shadowBlur = 20;
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 3;
      ctx.strokeText(ft.text, ft.x, ft.y);
    });
    ctx.restore();
  }

  drawConfetti(ctx) {
    ctx.save();
    this.confettiPieces.forEach(cp => {
      ctx.globalAlpha = cp.alpha;
      ctx.fillStyle = cp.color;
      ctx.save();
      ctx.translate(cp.x, cp.y);
      ctx.rotate(cp.rot);
      ctx.fillRect(-cp.width / 2, -cp.height / 2, cp.width, cp.height);
      ctx.restore();
    });
    ctx.restore();
  }

  drawParticles(ctx) {
    ctx.save();
    this.particles.forEach(p => {
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
  }

  drawGoalBanner(ctx, text, timer) {
    ctx.save();
    const alpha = Math.min(1.0, timer * 2.5);
    ctx.globalAlpha = alpha;

    // Dark backdrop banner
    const bannerGrad = ctx.createLinearGradient(0, 680, 0, 840);
    bannerGrad.addColorStop(0, 'rgba(0, 240, 255, 0.2)');
    bannerGrad.addColorStop(0.5, 'rgba(4, 15, 25, 0.92)');
    bannerGrad.addColorStop(1, 'rgba(0, 240, 255, 0.2)');
    ctx.fillStyle = bannerGrad;
    ctx.fillRect(0, 680, this.width, 160);

    // Golden / Neon glowing 3D text
    ctx.font = '900 88px "Montserrat", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Deep text drop shadow
    ctx.fillStyle = '#ff9900';
    ctx.fillText(text, this.width / 2 + 3, 763);

    // Foreground text with neon glow
    ctx.fillStyle = '#ffd700';
    ctx.shadowColor = '#ffea00';
    ctx.shadowBlur = 30;
    ctx.fillText(text, this.width / 2, 760);

    ctx.restore();
  }
}

if (typeof window !== 'undefined') {
  window.GameRenderer = GameRenderer;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = GameRenderer;
}

