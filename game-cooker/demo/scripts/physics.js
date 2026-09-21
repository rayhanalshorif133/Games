/**
 * Construct 3 Drop Physics & Spring Bounce
 */
class Physics {
  constructor() {
    this.isAnimating = false;
    this.clearingDuration = 0.15;
    this.dropSpeed = 3400;
  }

  update(board, dt) {
    let active = false;

    for (let r = 0; r < board.rows; r++) {
      for (let c = 0; c < board.cols; c++) {
        const tile = board.grid[r][c];
        if (!tile) continue;

        if (tile.isClearing) {
          active = true;
          tile.scale = Math.max(0, tile.scale - dt / this.clearingDuration);
          tile.alpha = Math.max(0, tile.alpha - dt / this.clearingDuration);
          continue;
        }

        if (Math.abs(tile.y - tile.targetY) > 0.5) {
          active = true;
          const dy = tile.targetY - tile.y;
          const step = Math.sign(dy) * Math.min(Math.abs(dy), this.dropSpeed * dt);
          tile.y += step;

          if (Math.abs(tile.y - tile.targetY) <= 1.0) {
            tile.y = tile.targetY;
            tile.scale = 1.0;
          }
        }

        if (tile.isNew) {
          if (tile.scale < 1.0) {
            active = true;
            tile.scale = Math.min(1.0, tile.scale + dt * 8);
          } else {
            tile.isNew = false;
          }
        }
      }
    }

    this.isAnimating = active;
    return active;
  }
}

window.Physics = Physics;

