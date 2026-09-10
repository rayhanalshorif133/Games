/**
 * Verlet Spring-Mass Net Simulation
 * Simulates a realistic corded basketball net that dynamically reacts to the ball.
 */
class BasketballNet {
  constructor(leftX, rightX, rimY, rows = 6, cols = 8) {
    this.leftX = leftX;
    this.rightX = rightX;
    this.rimY = rimY;
    this.rows = rows;
    this.cols = cols;
    this.netLength = 190;
    this.particles = [];
    this.constraints = [];
    this.gravity = 600;
    this.damping = 0.94;
    this.iterations = 5;

    this.init();
  }

  init() {
    this.particles = [];
    this.constraints = [];

    const width = this.rightX - this.leftX;
    const colSpacing = width / (this.cols - 1);
    const rowSpacing = this.netLength / (this.rows - 1);

    // Create particle grid with natural bottom tapering
    for (let r = 0; r < this.rows; r++) {
      const taper = 1.0 - (r / (this.rows - 1)) * 0.32; // Tapers inwards towards bottom
      const rowWidth = width * taper;
      const offsetX = (width - rowWidth) / 2;

      for (let c = 0; c < this.cols; c++) {
        const x = this.leftX + offsetX + (c / (this.cols - 1)) * rowWidth;
        const y = this.rimY + r * rowSpacing;
        const pinned = (r === 0);

        this.particles.push({
          x,
          y,
          oldX: x,
          oldY: y,
          pinned,
          row: r,
          col: c,
          vx: 0,
          vy: 0
        });
      }
    }

    // Add structural & shear constraints (diamond mesh)
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const idx = r * this.cols + c;

        // Horizontal links
        if (c < this.cols - 1) {
          const nextIdx = idx + 1;
          const dist = this.getDist(this.particles[idx], this.particles[nextIdx]);
          this.constraints.push({ p1: idx, p2: nextIdx, dist });
        }

        // Vertical links
        if (r < this.rows - 1) {
          const downIdx = idx + this.cols;
          const dist = this.getDist(this.particles[idx], this.particles[downIdx]);
          this.constraints.push({ p1: idx, p2: downIdx, dist });
        }

        // Diagonal diamond cross links
        if (r < this.rows - 1 && c < this.cols - 1) {
          const diag1 = idx + this.cols + 1;
          const dist1 = this.getDist(this.particles[idx], this.particles[diag1]);
          this.constraints.push({ p1: idx, p2: diag1, dist: dist1 });
        }
        if (r < this.rows - 1 && c > 0) {
          const diag2 = idx + this.cols - 1;
          const dist2 = this.getDist(this.particles[idx], this.particles[diag2]);
          this.constraints.push({ p1: idx, p2: diag2, dist: dist2 });
        }
      }
    }
  }

  getDist(p1, p2) {
    const dx = p1.x - p2.x;
    const dy = p1.y - p2.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  update(dt, ball) {
    // Verlet integration step
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      if (p.pinned) continue;

      const vx = (p.x - p.oldX) * this.damping;
      const vy = (p.y - p.oldY) * this.damping + this.gravity * dt * dt;

      p.oldX = p.x;
      p.oldY = p.y;
      p.x += vx;
      p.y += vy;
    }

    // Ball collision & disturbance
    if (ball && ball.isShooting) {
      this.interactWithBall(ball);
    }

    // Relax constraints multiple iterations for realism
    for (let it = 0; it < this.iterations; it++) {
      for (let i = 0; i < this.constraints.length; i++) {
        const c = this.constraints[i];
        const p1 = this.particles[c.p1];
        const p2 = this.particles[c.p2];

        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 0.001;
        const diff = (dist - c.dist) / dist;

        if (!p1.pinned && !p2.pinned) {
          p1.x += dx * 0.5 * diff;
          p1.y += dy * 0.5 * diff;
          p2.x -= dx * 0.5 * diff;
          p2.y -= dy * 0.5 * diff;
        } else if (!p1.pinned) {
          p1.x += dx * diff;
          p1.y += dy * diff;
        } else if (!p2.pinned) {
          p2.x -= dx * diff;
          p2.y -= dy * diff;
        }
      }
    }
  }

  interactWithBall(ball) {
    const ballR = ball.radius * 0.95;
    const ballY = ball.y;
    const ballX = ball.x;

    // Check if ball is in net bounding zone
    if (ballY > this.rimY - 20 && ballY < this.rimY + this.netLength + 80 &&
        ballX > this.leftX - 80 && ballX < this.rightX + 80) {
      
      for (let i = 0; i < this.particles.length; i++) {
        const p = this.particles[i];
        if (p.pinned) continue;

        const dx = p.x - ballX;
        const dy = p.y - ballY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // If inside ball radius, push vertex outwards
        if (dist < ballR) {
          const overlap = ballR - dist;
          const nx = dist > 0 ? dx / dist : 0;
          const ny = dist > 0 ? dy / dist : 1;

          p.x += nx * overlap * 0.9;
          p.y += ny * overlap * 0.9;

          // Impart drag from ball velocity
          p.oldX -= ball.vx * 0.003;
          p.oldY -= ball.vy * 0.003;

          // Drag ball slightly to simulate net friction
          if (ball.vy > 0 && p.row > 1) {
            ball.vy *= 0.985;
            ball.vx *= 0.99;
          }
        }
      }
    }
  }

  // Trigger exciting flare when a shot scores
  swishSwirl(ball) {
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      if (p.pinned) continue;
      const progress = p.row / (this.rows - 1);
      // Whip outward and downward
      p.oldY -= 35 * progress;
      p.oldX += (Math.random() - 0.5) * 20 * progress;
    }
  }

  render(ctx) {
    ctx.save();
    ctx.lineWidth = 3.5;
    ctx.strokeStyle = "rgba(240, 243, 246, 0.85)";
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    // Draw mesh diamond lines
    for (let i = 0; i < this.constraints.length; i++) {
      const c = this.constraints[i];
      const p1 = this.particles[c.p1];
      const p2 = this.particles[c.p2];

      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    }

    // Draw tiny knots at intersections
    ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      if (p.row > 0) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }
}

window.BasketballNet = BasketballNet;

