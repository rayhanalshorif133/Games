/**
 * Realistic Combat Theater Environment & Multi-Layer Cloud Atmosphere
 * Procedural ocean, islands, airbases, cloud shadows, and multi-tier parallax clouds.
 */
class TerrainSystem {
  constructor(width = 1080, height = 1920) {
    this.width = width;
    this.height = height;

    this.oceanOffset = 0;
    this.islandTimer = 0;

    // Generated islands in the theater
    this.islands = [];

    // Cloud layers: Low (below player), Mid, High (above player)
    this.lowClouds = [];
    this.highClouds = [];

    this._initInitialEnvironment();
  }

  _initInitialEnvironment() {
    // Generate initial islands
    for (let i = 0; i < 4; i++) {
      this.islands.push(this._createIsland(
        150 + Math.random() * (this.width - 300),
        i * (this.height / 3.5) + Math.random() * 200
      ));
    }

    // Generate low clouds
    for (let i = 0; i < 8; i++) {
      this.lowClouds.push(this._createCloud(
        Math.random() * this.width,
        Math.random() * this.height,
        60 + Math.random() * 90,
        0.55 + Math.random() * 0.2
      ));
    }

    // Generate high clouds (flying above jet)
    for (let i = 0; i < 5; i++) {
      this.highClouds.push(this._createCloud(
        Math.random() * this.width,
        Math.random() * this.height,
        120 + Math.random() * 160,
        0.85 + Math.random() * 0.25
      ));
    }
  }

  _createIsland(x, y) {
    const radius = 110 + Math.random() * 140;
    const points = [];
    const numPoints = 14 + Math.floor(Math.random() * 8);

    for (let i = 0; i < numPoints; i++) {
      const angle = (i / numPoints) * Math.PI * 2;
      const dist = radius * (0.65 + Math.random() * 0.5);
      points.push({
        x: Math.cos(angle) * dist,
        y: Math.sin(angle) * dist
      });
    }

    // Determine if military airfield is located on this island
    const hasAirfield = Math.random() > 0.45;
    const runwayAngle = (Math.random() - 0.5) * 0.6;

    return {
      x, y,
      radius,
      points,
      hasAirfield,
      runwayAngle,
      runwayLength: radius * 1.3
    };
  }

  _createCloud(x, y, size, opacity) {
    // A fluffy volumetric cloud made of multiple overlapping circles
    const puffs = [];
    const count = 5 + Math.floor(Math.random() * 6);
    for (let i = 0; i < count; i++) {
      puffs.push({
        dx: (Math.random() - 0.5) * size * 1.2,
        dy: (Math.random() - 0.5) * size * 0.8,
        r: size * (0.4 + Math.random() * 0.5)
      });
    }

    return {
      x, y,
      size,
      opacity,
      puffs,
      vx: (Math.random() - 0.5) * 15
    };
  }

  update(dt, speed = 600) {
    // 1. Scroll ocean texture
    this.oceanOffset = (this.oceanOffset + speed * 0.4 * dt) % 200;

    // 2. Scroll islands
    for (let i = this.islands.length - 1; i >= 0; i--) {
      const isl = this.islands[i];
      isl.y += speed * 0.45 * dt;

      // Wrap around when off-screen bottom
      if (isl.y - isl.radius > this.height + 200) {
        this.islands.splice(i, 1);
        this.islands.push(this._createIsland(
          150 + Math.random() * (this.width - 300),
          -250 - Math.random() * 200
        ));
      }
    }

    // 3. Scroll low clouds
    for (const c of this.lowClouds) {
      c.y += (speed * 0.7 + 40) * dt;
      c.x += c.vx * dt;
      if (c.y - c.size > this.height + 100) {
        c.y = -c.size - Math.random() * 150;
        c.x = Math.random() * this.width;
      }
    }

    // 4. Scroll high clouds (higher parallax speed)
    for (const c of this.highClouds) {
      c.y += (speed * 1.1 + 80) * dt;
      c.x += c.vx * 1.5 * dt;
      if (c.y - c.size > this.height + 150) {
        c.y = -c.size - Math.random() * 200;
        c.x = Math.random() * this.width;
      }
    }
  }

  drawOcean(ctx) {
    // Deep Naval Blue Base Gradient
    const oceanGrad = ctx.createLinearGradient(0, 0, 0, this.height);
    oceanGrad.addColorStop(0, '#07172b');
    oceanGrad.addColorStop(0.5, '#0a2342');
    oceanGrad.addColorStop(1, '#081d37');
    ctx.fillStyle = oceanGrad;
    ctx.fillRect(0, 0, this.width, this.height);

    // Subtle moving wave texture lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1.5;
    const spacing = 45;
    const numLines = Math.ceil(this.height / spacing) + 2;

    for (let i = 0; i < numLines; i++) {
      const y = (i * spacing + this.oceanOffset) % (this.height + spacing);
      ctx.beginPath();
      ctx.moveTo(0, y);
      for (let x = 0; x < this.width; x += 90) {
        ctx.quadraticCurveTo(x + 45, y + Math.sin(x * 0.05 + this.oceanOffset * 0.02) * 5, x + 90, y);
      }
      ctx.stroke();
    }
  }

  drawIslands(ctx) {
    const sunOffsetX = -35;
    const sunOffsetY = 50;

    for (const isl of this.islands) {
      // 1. Cast Island Shadow onto the ocean
      ctx.save();
      ctx.translate(isl.x + sunOffsetX, isl.y + sunOffsetY);
      ctx.fillStyle = 'rgba(2, 8, 16, 0.35)';
      ctx.beginPath();
      ctx.moveTo(isl.points[0].x, isl.points[0].y);
      for (let j = 1; j < isl.points.length; j++) {
        ctx.lineTo(isl.points[j].x, isl.points[j].y);
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // 2. Coastal Shoreline / Sand Beach
      ctx.save();
      ctx.translate(isl.x, isl.y);

      // Sandy beach rim
      ctx.fillStyle = '#d2b48c';
      ctx.strokeStyle = '#6ee7b7'; // coastal turquoise surf line
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(isl.points[0].x * 1.05, isl.points[0].y * 1.05);
      for (let j = 1; j < isl.points.length; j++) {
        ctx.lineTo(isl.points[j].x * 1.05, isl.points[j].y * 1.05);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // 3. Interior Lush Forest / Military Ridge Terrain
      const islandGrad = ctx.createRadialGradient(0, 0, 10, 0, 0, isl.radius);
      islandGrad.addColorStop(0, '#1e3a1e');
      islandGrad.addColorStop(0.7, '#2d5a27');
      islandGrad.addColorStop(1, '#3b6e22');
      ctx.fillStyle = islandGrad;
      ctx.beginPath();
      ctx.moveTo(isl.points[0].x * 0.94, isl.points[0].y * 0.94);
      for (let j = 1; j < isl.points.length; j++) {
        ctx.lineTo(isl.points[j].x * 0.94, isl.points[j].y * 0.94);
      }
      ctx.closePath();
      ctx.fill();

      // 4. Military Airfield & Concrete Runway
      if (isl.hasAirfield) {
        ctx.rotate(isl.runwayAngle);

        // Asphalt runway strip
        ctx.fillStyle = '#262626';
        ctx.fillRect(-22, -isl.runwayLength / 2, 44, isl.runwayLength);

        // White centerline stripes
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.lineWidth = 2.5;
        ctx.setLineDash([12, 10]);
        ctx.beginPath();
        ctx.moveTo(0, -isl.runwayLength / 2 + 10);
        ctx.lineTo(0, isl.runwayLength / 2 - 10);
        ctx.stroke();
        ctx.setLineDash([]);

        // Runway threshold markings
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-18, -isl.runwayLength / 2 + 5, 36, 4);
        ctx.fillRect(-18, isl.runwayLength / 2 - 9, 36, 4);

        // Aircraft Hangars & Radar Dome
        ctx.fillStyle = '#404040';
        ctx.fillRect(32, -25, 28, 40);
        ctx.fillRect(32, 25, 28, 40);

        // Radar Dish / SAM Launcher site
        ctx.fillStyle = '#d4d4d4';
        ctx.beginPath();
        ctx.arc(-34, 0, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#059669';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      ctx.restore();
    }
  }

  drawCloudShadows(ctx) {
    const sunOffsetX = -50;
    const sunOffsetY = 75;

    // Draw dark soft cloud shadows on the terrain/water
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.16)';
    for (const c of [...this.lowClouds, ...this.highClouds]) {
      for (const puff of c.puffs) {
        ctx.beginPath();
        ctx.arc(c.x + puff.dx + sunOffsetX, c.y + puff.dy + sunOffsetY, puff.r * 1.1, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  drawLowClouds(ctx) {
    ctx.save();
    for (const c of this.lowClouds) {
      for (const puff of c.puffs) {
        const grad = ctx.createRadialGradient(
          c.x + puff.dx, c.y + puff.dy, 0,
          c.x + puff.dx, c.y + puff.dy, puff.r
        );
        grad.addColorStop(0, `rgba(255, 255, 255, ${c.opacity * 0.45})`);
        grad.addColorStop(0.6, `rgba(240, 245, 255, ${c.opacity * 0.3})`);
        grad.addColorStop(1, 'rgba(230, 240, 255, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(c.x + puff.dx, c.y + puff.dy, puff.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  drawHighClouds(ctx) {
    // High-altitude cirrus clouds flying over the jet
    ctx.save();
    for (const c of this.highClouds) {
      for (const puff of c.puffs) {
        const grad = ctx.createRadialGradient(
          c.x + puff.dx, c.y + puff.dy, 0,
          c.x + puff.dx, c.y + puff.dy, puff.r
        );
        grad.addColorStop(0, `rgba(255, 255, 255, ${c.opacity * 0.55})`);
        grad.addColorStop(0.7, `rgba(245, 248, 255, ${c.opacity * 0.35})`);
        grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(c.x + puff.dx, c.y + puff.dy, puff.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }
}

window.Terrain = new TerrainSystem();

