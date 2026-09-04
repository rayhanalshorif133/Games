// Procedural 2D Car and Road Renderer with Canvas

export const DIRECTIONS = {
  UP: 'UP',
  DOWN: 'DOWN',
  LEFT: 'LEFT',
  RIGHT: 'RIGHT'
};

export const DIR_VECTORS = {
  UP: { dx: 0, dy: -1, angle: -Math.PI / 2 },
  DOWN: { dx: 0, dy: 1, angle: Math.PI / 2 },
  LEFT: { dx: -1, dy: 0, angle: Math.PI },
  RIGHT: { dx: 1, dy: 0, angle: 0 }
};

export const CAR_COLORS = [
  { name: 'Red', main: '#e53935', dark: '#b71c1c', light: '#ff6f60' },
  { name: 'Blue', main: '#1e88e5', dark: '#0d47a1', light: '#6ab7ff' },
  { name: 'Yellow', main: '#fbc02d', dark: '#f57f17', light: '#fff263' },
  { name: 'Green', main: '#43a047', dark: '#1b5e20', light: '#76d275' },
  { name: 'Orange', main: '#fb8c00', dark: '#e65100', light: '#ffbd45' },
  { name: 'Purple', main: '#8e24aa', dark: '#4a148c', light: '#c158dc' },
  { name: 'Cyan', main: '#00acc1', dark: '#006064', light: '#5ddef4' }
];

export class CarRenderer {
  constructor() {
    this.arrowPulse = 0;
  }

  update(dt) {
    this.arrowPulse = (this.arrowPulse + dt * 4) % (Math.PI * 2);
  }

  // Draw asphalt board background, parking grid, curbs, and exit roads
  drawBackground(ctx, width, height, gridBounds, activeExits = ['UP', 'DOWN', 'LEFT', 'RIGHT']) {
    // 1. Dark city asphalt
    ctx.fillStyle = '#1e2226';
    ctx.fillRect(0, 0, width, height);

    // Subtle road grit texture
    ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
    for (let y = 0; y < height; y += 40) {
      ctx.fillRect(0, y, width, 2);
    }

    // 2. Parking Lot Arena
    const { x, y, w, h } = gridBounds;

    // Outer sidewalk curb
    ctx.fillStyle = '#2c333a';
    ctx.beginPath();
    ctx.roundRect(x - 24, y - 24, w + 48, h + 48, 20);
    ctx.fill();

    // Red & white curb stripes around parking lot perimeter
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 6;
    ctx.setLineDash([20, 20]);
    ctx.stroke();
    ctx.setLineDash([]);

    // Parking lot surface
    ctx.fillStyle = '#171a1d';
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 12);
    ctx.fill();

    // Soft inner shadow
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.lineWidth = 4;
    ctx.stroke();

    // 3. Exit Lane Arrows painted outside the parking lot
    ctx.fillStyle = 'rgba(255, 213, 79, 0.25)';
    const arrowLen = 35;

    // Top Exit
    this.drawPaintedExitArrow(ctx, x + w / 2, y - 55, 'UP');
    // Bottom Exit
    this.drawPaintedExitArrow(ctx, x + w / 2, y + h + 55, 'DOWN');
    // Left Exit
    this.drawPaintedExitArrow(ctx, x - 55, y + h / 2, 'LEFT');
    // Right Exit
    this.drawPaintedExitArrow(ctx, x + w + 55, y + h / 2, 'RIGHT');
  }

  drawPaintedExitArrow(ctx, x, y, dir) {
    ctx.save();
    ctx.translate(x, y);
    const angle = DIR_VECTORS[dir].angle;
    ctx.rotate(angle);

    ctx.fillStyle = 'rgba(255, 213, 79, 0.35)';
    ctx.strokeStyle = 'rgba(255, 213, 79, 0.6)';
    ctx.lineWidth = 3;

    ctx.beginPath();
    ctx.moveTo(25, 0);
    ctx.lineTo(-5, -20);
    ctx.lineTo(-5, -8);
    ctx.lineTo(-25, -8);
    ctx.lineTo(-25, 8);
    ctx.lineTo(-5, 8);
    ctx.lineTo(-5, 20);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }

  // Draw parking grid slots
  drawParkingSlots(ctx, gridX, gridY, cols, rows, cellSize) {
    ctx.strokeStyle = 'rgba(255, 213, 79, 0.18)';
    ctx.lineWidth = 2.5;

    for (let r = 0; r <= rows; r++) {
      for (let c = 0; c <= cols; c++) {
        const px = gridX + c * cellSize;
        const py = gridY + r * cellSize;
        // Draw crosshair at grid corners
        ctx.beginPath();
        ctx.moveTo(px - 6, py);
        ctx.lineTo(px + 6, py);
        ctx.moveTo(px, py - 6);
        ctx.lineTo(px, py + 6);
        ctx.stroke();
      }
    }
  }

  // Draw 2D Vehicle
  drawCar(ctx, car, isHighlighted = false) {
    const { x, y, width, length, direction, colorIdx, isBlocked, bumpOffset } = car;
    const color = CAR_COLORS[colorIdx % CAR_COLORS.length];
    const dirInfo = DIR_VECTORS[direction];

    ctx.save();
    ctx.translate(x, y);

    // Apply bump offset when blocked
    if (bumpOffset) {
      ctx.translate(bumpOffset.x, bumpOffset.y);
    }

    ctx.rotate(dirInfo.angle);

    const halfW = width / 2;
    const halfL = length / 2;

    // 1. Car Drop Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.roundRect(-halfL + 5, -halfW + 6, length, width, 14);
    ctx.fill();

    // 2. Wheels
    ctx.fillStyle = '#111';
    const wheelW = 18;
    const wheelH = 9;
    const wheelInsetX = length * 0.28;
    const wheelInsetY = halfW - 2;

    // Front Left, Front Right, Back Left, Back Right
    ctx.fillRect(wheelInsetX - wheelW / 2, -wheelInsetY - wheelH / 2, wheelW, wheelH);
    ctx.fillRect(wheelInsetX - wheelW / 2, wheelInsetY - wheelH / 2, wheelW, wheelH);
    ctx.fillRect(-wheelInsetX - wheelW / 2, -wheelInsetY - wheelH / 2, wheelW, wheelH);
    ctx.fillRect(-wheelInsetX - wheelW / 2, wheelInsetY - wheelH / 2, wheelW, wheelH);

    // 3. Chassis Body
    ctx.fillStyle = color.main;
    ctx.beginPath();
    ctx.roundRect(-halfL, -halfW, length, width, 14);
    ctx.fill();

    // Highlight border if selected / hinted
    if (isHighlighted) {
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 4;
      ctx.stroke();
    } else {
      ctx.strokeStyle = color.dark;
      ctx.lineWidth = 2.5;
      ctx.stroke();
    }

    // 4. Headlights (Front is along +X in local rotated space)
    ctx.fillStyle = '#fff9c4';
    ctx.fillRect(halfL - 4, -halfW + 5, 4, 8);
    ctx.fillRect(halfL - 4, halfW - 13, 4, 8);

    // Taillights (Back is along -X)
    ctx.fillStyle = '#d32f2f';
    ctx.fillRect(-halfL, -halfW + 6, 4, 7);
    ctx.fillRect(-halfL, halfW - 13, 4, 7);

    // 5. Windshields & Windows
    ctx.fillStyle = '#263238';
    // Front windshield
    ctx.beginPath();
    ctx.roundRect(halfL * 0.15, -halfW * 0.75, length * 0.22, width * 0.75, 5);
    ctx.fill();
    // Rear windshield
    ctx.beginPath();
    ctx.roundRect(-halfL * 0.55, -halfW * 0.75, length * 0.18, width * 0.75, 4);
    ctx.fill();

    // 6. Car Roof
    ctx.fillStyle = color.light;
    const roofL = length * 0.46;
    const roofW = width * 0.75;
    ctx.beginPath();
    ctx.roundRect(-roofL * 0.45, -roofW / 2, roofL, roofW, 6);
    ctx.fill();

    // 7. Large Glowing Direction Arrow on Roof
    const arrowColor = '#ffffff';
    const glowScale = 1 + Math.sin(this.arrowPulse) * 0.12;

    ctx.save();
    ctx.fillStyle = arrowColor;
    ctx.shadowColor = '#fff';
    ctx.shadowBlur = isHighlighted ? 15 : 6;

    // Draw forward-pointing Chevron Arrow (+X direction)
    const arrowX = -roofL * 0.1;
    ctx.translate(arrowX, 0);
    ctx.scale(glowScale, glowScale);

    ctx.beginPath();
    ctx.moveTo(15, 0);
    ctx.lineTo(-4, -13);
    ctx.lineTo(-1, -4);
    ctx.lineTo(-15, -4);
    ctx.lineTo(-15, 4);
    ctx.lineTo(-1, 4);
    ctx.lineTo(-4, 13);
    ctx.closePath();
    ctx.fill();

    ctx.restore();

    // 8. "BLOCKED!" Floating Alert if recently collided
    if (isBlocked) {
      ctx.save();
      ctx.rotate(-dirInfo.angle); // unrotate text
      ctx.fillStyle = '#ff5252';
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.font = 'bold 18px "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.strokeText('BLOCKED!', 0, -halfW - 14);
      ctx.fillText('BLOCKED!', 0, -halfW - 14);
      ctx.restore();
    }

    ctx.restore();
  }
}

