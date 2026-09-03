/**
 * Retro Space Invaders - Destructible Bunkers Module
 * 
 * Implements 4 authentic defensive bunkers with real-time pixel erosion.
 * Bullets carve realistic craters into the bunker bitmaps upon impact.
 */

class BunkersManager {
  constructor(gameWidth = 800, gameHeight = 900) {
    this.gameWidth = gameWidth;
    this.gameHeight = gameHeight;
    this.bunkerCount = 4;
    this.bunkerWidth = 84;
    this.bunkerHeight = 60;
    this.y = 700;
    this.bunkers = [];

    this.init();
  }

  init() {
    this.bunkers = [];
    const spacing = this.gameWidth / (this.bunkerCount + 1);

    for (let i = 0; i < this.bunkerCount; i++) {
      const x = Math.round(spacing * (i + 1) - this.bunkerWidth / 2);
      const offscreen = document.createElement('canvas');
      offscreen.width = this.bunkerWidth;
      offscreen.height = this.bunkerHeight;
      const ctx = offscreen.getContext('2d', { willReadFrequently: true });

      this.drawPristineBunker(ctx, this.bunkerWidth, this.bunkerHeight);

      this.bunkers.push({
        x: x,
        y: this.y,
        width: this.bunkerWidth,
        height: this.bunkerHeight,
        canvas: offscreen,
        ctx: ctx
      });
    }
  }

  /**
   * Draws the classic Space Invaders arched green bunker
   */
  drawPristineBunker(ctx, w, h) {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#06b6d4'; // Modern sci-fi plasma barrier teal

    // Base body
    ctx.beginPath();
    // Top-left sloped corner
    ctx.moveTo(16, 0);
    ctx.lineTo(w - 16, 0);
    ctx.lineTo(w, 16);
    ctx.lineTo(w, h);
    ctx.lineTo(w - 20, h);
    // Inner archway
    ctx.lineTo(w - 20, h - 22);
    ctx.arcTo(w - 20, h - 26, w / 2, h - 26, 6);
    ctx.arcTo(20, h - 26, 20, h - 22, 6);
    ctx.lineTo(20, h);
    ctx.lineTo(0, h);
    ctx.lineTo(0, 16);
    ctx.closePath();
    ctx.fill();

    // High-tech holographic matrix grid texture
    ctx.fillStyle = 'rgba(0, 240, 255, 0.35)';
    for (let y = 0; y < h; y += 4) {
      for (let x = 0; x < w; x += 4) {
        if ((x + y) % 8 === 0) {
          ctx.fillRect(x, y, 2, 2);
        }
      }
    }
  }

  /**
   * Reset all bunkers to pristine state
   */
  reset() {
    for (const b of this.bunkers) {
      this.drawPristineBunker(b.ctx, b.width, b.height);
    }
  }

  /**
   * Test collision for a projectile (player bullet or alien bomb)
   * @param {Object} bullet - { x, y, radius, isPlayer }
   * @returns {boolean} true if collided and eroded
   */
  checkHit(bullet) {
    for (const b of this.bunkers) {
      // Fast AABB check
      if (
        bullet.x >= b.x &&
        bullet.x <= b.x + b.width &&
        bullet.y >= b.y &&
        bullet.y <= b.y + b.height
      ) {
        const localX = Math.floor(bullet.x - b.x);
        const localY = Math.floor(bullet.y - b.y);

        // Check 3x3 sample around impact to catch edges
        const sampleW = 5;
        const sampleH = 5;
        const startX = Math.max(0, localX - 2);
        const startY = Math.max(0, localY - 2);

        try {
          const imgData = b.ctx.getImageData(startX, startY, sampleW, sampleH);
          let hasSolidPixel = false;
          for (let i = 3; i < imgData.data.length; i += 4) {
            if (imgData.data[i] > 30) {
              hasSolidPixel = true;
              break;
            }
          }

          if (hasSolidPixel) {
            // Erode crater
            this.erodeCrater(b, localX, localY, bullet.isPlayer ? 8 : 10);
            return true;
          }
        } catch (e) {
          // Fallback if image data fails
          return false;
        }
      }
    }
    return false;
  }

  /**
   * Carve out an organic explosion crater in the bunker canvas
   */
  erodeCrater(bunker, cx, cy, baseRadius) {
    const ctx = bunker.ctx;
    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';

    // Primary crater
    ctx.beginPath();
    ctx.arc(cx, cy, baseRadius, 0, Math.PI * 2);
    ctx.fill();

    // Secondary jagged pixel clusters for retro degradation
    for (let i = 0; i < 7; i++) {
      const angle = (Math.PI * 2 * i) / 7 + (Math.random() - 0.5);
      const dist = baseRadius * (0.8 + Math.random() * 0.7);
      const rx = cx + Math.cos(angle) * dist;
      const ry = cy + Math.sin(angle) * dist;
      const rSize = 2 + Math.floor(Math.random() * 4);

      ctx.fillRect(rx - rSize / 2, ry - rSize / 2, rSize, rSize);
    }

    ctx.restore();
  }

  /**
   * Invaders marching through bunkers chew away any bunker pixels in their path
   */
  sliceByInvader(alien) {
    for (const b of this.bunkers) {
      if (
        alien.x + alien.width >= b.x &&
        alien.x <= b.x + b.width &&
        alien.y + alien.height >= b.y &&
        alien.y <= b.y + b.height
      ) {
        const localX = alien.x - b.x;
        const localY = alien.y - b.y;

        b.ctx.save();
        b.ctx.globalCompositeOperation = 'destination-out';
        b.fillRect(localX - 2, localY - 2, alien.width + 4, alien.height + 4);
        b.ctx.restore();
      }
    }
  }

  /**
   * Render all bunkers to main canvas
   */
  draw(mainCtx) {
    for (const b of this.bunkers) {
      mainCtx.drawImage(b.canvas, b.x, b.y);
    }
  }
}

if (typeof window !== 'undefined') {
  window.BunkersManager = BunkersManager;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BunkersManager;
}

