/**
 * World & Environment Renderer
 * Renders the 2.5D perspective track, scrolling road segments, neon horizon, and parallax skyline.
 */

class World {
  constructor(runtime) {
    this.runtime = runtime;
    this.trackOffset = 0;
    this.segmentLength = 300; // Distance between horizontal track divisions
    this.cityOffset = 0;

    // Generate static building profiles for parallax skyline
    this.buildings = [];
    const count = 24;
    for (let i = 0; i < count; i++) {
      this.buildings.push({
        x: (i / count) * 2000 - 460,
        width: 60 + Math.random() * 80,
        height: 180 + Math.random() * 320,
        color: i % 2 === 0 ? '#0b122c' : '#0e1738',
        accentColor: i % 3 === 0 ? '#00f0ff' : '#ff0077',
        hasAntenna: Math.random() > 0.5,
        windowPattern: Math.floor(Math.random() * 3)
      });
    }

    // Floating particles in the digital air (dust / cyber motes)
    this.ambientMotes = [];
    for (let i = 0; i < 40; i++) {
      this.ambientMotes.push({
        x: Math.random() * GAME_WIDTH,
        y: Math.random() * 800,
        size: 1.5 + Math.random() * 3,
        speedY: -10 - Math.random() * 20,
        alpha: 0.2 + Math.random() * 0.5
      });
    }
  }

  reset() {
    this.trackOffset = 0;
    this.cityOffset = 0;
  }

  update(dt, speed) {
    this.trackOffset = (this.trackOffset + speed * dt) % this.segmentLength;
    this.cityOffset = (this.cityOffset + speed * 0.08 * dt) % 1200;

    // Update ambient cyber motes
    for (const mote of this.ambientMotes) {
      mote.y += mote.speedY * dt;
      if (mote.y < 0) {
        mote.y = 750;
        mote.x = Math.random() * GAME_WIDTH;
      }
    }
  }

  draw(ctx, camera) {
    const horizonY = camera.horizonY;

    // 1. Sky Gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, horizonY);
    skyGrad.addColorStop(0, '#040714');
    skyGrad.addColorStop(0.6, '#090f2b');
    skyGrad.addColorStop(1, '#1b123b');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, GAME_WIDTH, horizonY);

    // 2. Cyber Sun / Horizon Glow
    const sunGrad = ctx.createRadialGradient(
      GAME_WIDTH / 2, horizonY, 20,
      GAME_WIDTH / 2, horizonY, 320
    );
    sunGrad.addColorStop(0, 'rgba(255, 0, 119, 0.85)');
    sunGrad.addColorStop(0.4, 'rgba(0, 240, 255, 0.4)');
    sunGrad.addColorStop(1, 'rgba(7, 11, 25, 0)');
    ctx.fillStyle = sunGrad;
    ctx.beginPath();
    ctx.arc(GAME_WIDTH / 2, horizonY, 320, 0, Math.PI * 2);
    ctx.fill();

    // Horizontal retro sun slices
    ctx.save();
    ctx.fillStyle = '#070b19';
    for (let s = 1; s <= 6; s++) {
      const sliceY = horizonY - s * 22;
      const sliceHeight = s * 2.5;
      ctx.fillRect(GAME_WIDTH / 2 - 140, sliceY, 280, sliceHeight);
    }
    ctx.restore();

    // 3. Parallax Skyline (Distant Cyberpunk City)
    ctx.save();
    const time = performance.now() * 0.001;
    for (const b of this.buildings) {
      const bx = ((b.x - this.cityOffset + 3000) % 2000) - 460;
      const by = horizonY - b.height;

      // Building silhouette
      ctx.fillStyle = b.color;
      ctx.fillRect(bx, by, b.width, b.height);

      // Neon Top Edge
      ctx.fillStyle = b.accentColor;
      ctx.fillRect(bx, by, b.width, 3);

      // Antenna with blinking red/cyan warning light
      if (b.hasAntenna) {
        ctx.strokeStyle = '#2b3658';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(bx + b.width / 2, by);
        ctx.lineTo(bx + b.width / 2, by - 35);
        ctx.stroke();

        const blink = Math.sin(time * 6 + bx) > 0.2;
        ctx.fillStyle = blink ? b.accentColor : 'rgba(255,255,255,0.2)';
        ctx.beginPath();
        ctx.arc(bx + b.width / 2, by - 36, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Windows
      ctx.fillStyle = b.accentColor;
      ctx.globalAlpha = 0.15;
      for (let wy = by + 20; wy < horizonY - 15; wy += 22) {
        for (let wx = bx + 10; wx < bx + b.width - 12; wx += 16) {
          ctx.fillRect(wx, wy, 8, 12);
        }
      }
      ctx.globalAlpha = 1.0;
    }
    ctx.restore();

    // Ambient floating dust motes
    ctx.save();
    for (const mote of this.ambientMotes) {
      ctx.fillStyle = '#00f0ff';
      ctx.globalAlpha = mote.alpha;
      ctx.beginPath();
      ctx.arc(mote.x, mote.y, mote.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // 4. Ground Fill below Horizon
    const groundGrad = ctx.createLinearGradient(0, horizonY, 0, GAME_HEIGHT);
    groundGrad.addColorStop(0, '#0a0d22');
    groundGrad.addColorStop(0.3, '#080a1c');
    groundGrad.addColorStop(1, '#03050d');
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, horizonY, GAME_WIDTH, GAME_HEIGHT - horizonY);

    // 5. Perspective Track (Road Bed)
    // The road spans from Lane -1.7 to +1.7 to comfortably fit 3 lanes
    const roadHalfWidth = 1.65;
    const maxZ = camera.maxZ;
    const segments = 32;

    for (let i = segments; i >= 0; i--) {
      // Calculate depth from near to far
      const zNear = Math.max(0, (i * this.segmentLength) - this.trackOffset);
      const zFar = zNear + this.segmentLength;

      const p1Left = camera.project(-roadHalfWidth, 0, zNear);
      const p1Right = camera.project(roadHalfWidth, 0, zNear);
      const p2Left = camera.project(-roadHalfWidth, 0, zFar);
      const p2Right = camera.project(roadHalfWidth, 0, zFar);

      if (!p1Left || !p2Left) continue;

      // Alternating road segments
      const isAlt = (Math.floor((zNear + this.trackOffset) / this.segmentLength) % 2 === 0);

      // Track surface
      ctx.fillStyle = isAlt ? '#0f1738' : '#0c122e';
      ctx.beginPath();
      ctx.moveTo(p1Left.x, p1Left.groundY);
      ctx.lineTo(p1Right.x, p1Right.groundY);
      ctx.lineTo(p2Right.x, p2Right.groundY);
      ctx.lineTo(p2Left.x, p2Left.groundY);
      ctx.closePath();
      ctx.fill();

      // Guardrail / Curbs Left & Right
      ctx.strokeStyle = isAlt ? '#00f0ff' : '#ff0077';
      ctx.lineWidth = Math.max(2, 10 * p1Left.scale);

      // Left curb
      ctx.beginPath();
      ctx.moveTo(p1Left.x, p1Left.groundY);
      ctx.lineTo(p2Left.x, p2Left.groundY);
      ctx.stroke();

      // Right curb
      ctx.beginPath();
      ctx.moveTo(p1Right.x, p1Right.groundY);
      ctx.lineTo(p2Right.x, p2Right.groundY);
      ctx.stroke();

      // Center Lane Dividers (Between lane -1 & 0, and 0 & 1)
      [-0.55, 0.55].forEach(laneDiv => {
        const divNear = camera.project(laneDiv, 0, zNear);
        const divFar = camera.project(laneDiv, 0, zFar);
        if (divNear && divFar && isAlt) {
          ctx.strokeStyle = 'rgba(0, 240, 255, 0.75)';
          ctx.lineWidth = Math.max(1, 6 * divNear.scale);
          ctx.beginPath();
          ctx.moveTo(divNear.x, divNear.groundY);
          ctx.lineTo(divFar.x, divFar.groundY);
          ctx.stroke();
        }
      });
    }

    // 6. Horizon Neon Fog Border
    ctx.save();
    const fogGrad = ctx.createLinearGradient(0, horizonY - 10, 0, horizonY + 60);
    fogGrad.addColorStop(0, 'rgba(0, 240, 255, 0.3)');
    fogGrad.addColorStop(0.3, 'rgba(255, 0, 119, 0.2)');
    fogGrad.addColorStop(1, 'rgba(7, 11, 25, 0)');
    ctx.fillStyle = fogGrad;
    ctx.fillRect(0, horizonY - 10, GAME_WIDTH, 70);

    // Horizon glowing laser line
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(0, horizonY);
    ctx.lineTo(GAME_WIDTH, horizonY);
    ctx.stroke();
    ctx.restore();
  }
}

window.World = World;

