/**
 * InfiniteRoadSpawner.js
 * 
 * Core Module 1: Infinite Scrolling Road & Parallax System
 * Optimized for 1080x1920 Portrait resolution.
 * 
 * Asset References:
 * - Road Tile: images/assets/background/infinite_road_tile.png (1026x1798 seamless)
 * - Multi-layer side scenery shadows and dynamic speed lines for high vertical velocity.
 */

const ROAD_CONFIG = {
  width: 1026,
  tileHeight: 1798,
  offsetX: (1080 - 1026) / 2, // 27px margin on 1080 canvas
  minDrivableX: 140,
  maxDrivableX: 940,
  lanesX: [280, 540, 800] // Left, Center, Right lanes
};

class InfiniteRoadSpawner {
  constructor() {
    this.scrollY = 0;
    this.parallaxY = 0;
    this.speedLines = [];
  }

  init() {
    this.scrollY = 0;
    this.parallaxY = 0;
    this.speedLines = [];
    for (let i = 0; i < 25; i++) {
      this.speedLines.push({
        x: ROAD_CONFIG.minDrivableX + Math.random() * (ROAD_CONFIG.maxDrivableX - ROAD_CONFIG.minDrivableX),
        y: Math.random() * 1920,
        length: 40 + Math.random() * 80,
        speed: 1.2 + Math.random() * 0.5,
        alpha: 0.15 + Math.random() * 0.35
      });
    }
  }

  update(dt) {
    const speed = window.gameManager ? window.gameManager.scrollSpeed : 720;
    const delta = speed * dt;

    this.scrollY = (this.scrollY + delta) % ROAD_CONFIG.tileHeight;
    this.parallaxY = (this.parallaxY + delta * 0.45) % 1920;

    // Update speed line streaks
    this.speedLines.forEach(line => {
      line.y += delta * line.speed;
      if (line.y > 1920) {
        line.y = -line.length;
        line.x = ROAD_CONFIG.minDrivableX + Math.random() * (ROAD_CONFIG.maxDrivableX - ROAD_CONFIG.minDrivableX);
      }
    });
  }

  render(ctx) {
    const roadImg = window.assets ? window.assets.get('road') : null;

    if (roadImg && roadImg.complete && roadImg.naturalWidth > 0) {
      let y = this.scrollY - ROAD_CONFIG.tileHeight;
      while (y < 1920) {
        ctx.drawImage(roadImg, ROAD_CONFIG.offsetX, y, ROAD_CONFIG.width, ROAD_CONFIG.tileHeight);
        y += ROAD_CONFIG.tileHeight;
      }
    } else {
      // High-contrast asphalt fallback
      ctx.fillStyle = '#282b30';
      ctx.fillRect(ROAD_CONFIG.offsetX, 0, ROAD_CONFIG.width, 1920);
      ctx.fillStyle = '#f1c40f';
      ROAD_CONFIG.lanesX.forEach(lx => {
        for (let y = (this.scrollY % 120) - 120; y < 1920; y += 120) {
          ctx.fillRect(lx - 4, y, 8, 60);
        }
      });
    }

    // Parallax Side Scenery Shadows
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.fillRect(0, 0, ROAD_CONFIG.offsetX + 20, 1920);
    ctx.fillRect(ROAD_CONFIG.offsetX + ROAD_CONFIG.width - 20, 0, ROAD_CONFIG.offsetX + 20, 1920);

    // Render speed line streaks for vertical velocity feel
    const currentSpeed = window.gameManager ? window.gameManager.scrollSpeed : 720;
    if (currentSpeed > 900) {
      ctx.save();
      this.speedLines.forEach(line => {
        ctx.strokeStyle = 'rgba(255, 255, 255, ' + line.alpha + ')';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(line.x, line.y);
        ctx.lineTo(line.x, line.y + line.length);
        ctx.stroke();
      });
      ctx.restore();
    }
  }

  getLaneX(index) {
    return ROAD_CONFIG.lanesX[index] || ROAD_CONFIG.lanesX[1];
  }
}

window.roadSpawner = new InfiniteRoadSpawner();
