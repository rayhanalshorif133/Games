/**
 * onet.js - Onet / Link-Link Pathfinding & Game Board Logic
 * Grid: 12 Rows x 6 Columns (72 Tiles / 36 Matching Pairs)
 * Maximum 2 turns (3 straight line segments) through empty space or outside border.
 */

class OnetLogic {
  constructor(rows = 12, cols = 6) {
    this.ROWS = rows;
    this.COLS = cols;
  }

  isCellEmpty(grid, r, c) {
    // Outside boundary is always empty (allows routing outside the board)
    if (r < 0 || r >= this.ROWS || c < 0 || c >= this.COLS) {
      return true;
    }
    return grid[r][c] === null;
  }

  isLineClear(grid, r1, c1, r2, c2) {
    if (r1 === r2) {
      const minC = Math.min(c1, c2) + 1;
      const maxC = Math.max(c1, c2) - 1;
      for (let c = minC; c <= maxC; c++) {
        if (!this.isCellEmpty(grid, r1, c)) {
          return false;
        }
      }
      return true;
    } else if (c1 === c2) {
      const minR = Math.min(r1, r2) + 1;
      const maxR = Math.max(r1, r2) - 1;
      for (let r = minR; r <= maxR; r++) {
        if (!this.isCellEmpty(grid, r, c1)) {
          return false;
        }
      }
      return true;
    }
    return false;
  }

  /**
   * Find connection path between two cells.
   * Returns an array of waypoints [[r1, c1], ... , [r2, c2]] if valid, or null.
   */
  findPath(grid, p1, p2) {
    const { r: r1, c: c1 } = p1;
    const { r: r2, c: c2 } = p2;

    if (r1 === r2 && c1 === c2) return null;
    if (!grid[r1] || !grid[r2]) return null;
    if (!grid[r1][c1] || !grid[r2][c2]) return null;
    if (grid[r1][c1].type !== grid[r2][c2].type) return null;

    // 1. Direct Straight Line (0 turns / 1 segment)
    if (r1 === r2 && this.isLineClear(grid, r1, c1, r2, c2)) {
      return [p1, p2];
    }
    if (c1 === c2 && this.isLineClear(grid, r1, c1, r2, c2)) {
      return [p1, p2];
    }

    // 2. One Turn (1 corner / 2 segments - L-Shape)
    // Corner A: (r1, c2)
    if (this.isCellEmpty(grid, r1, c2)) {
      if (this.isLineClear(grid, r1, c1, r1, c2) && this.isLineClear(grid, r1, c2, r2, c2)) {
        return [p1, { r: r1, c: c2 }, p2];
      }
    }
    // Corner B: (r2, c1)
    if (this.isCellEmpty(grid, r2, c1)) {
      if (this.isLineClear(grid, r1, c1, r2, c1) && this.isLineClear(grid, r2, c1, r2, c2)) {
        return [p1, { r: r2, c: c1 }, p2];
      }
    }

    // 3. Two Turns (2 corners / 3 segments - Z-Shape, U-Shape, or Outside Border Wrap)
    // Check horizontal lines from p1
    for (let c = -1; c <= this.COLS; c++) {
      if (c === c1) continue;
      const k1 = { r: r1, c: c };
      const k2 = { r: r2, c: c };

      if (!this.isCellEmpty(grid, r1, c)) continue;
      if (!this.isLineClear(grid, r1, c1, r1, c)) continue;

      // From K1 to K2
      if (k2.r === r2 && k2.c === c2) {
        // Direct to p2
        if (this.isLineClear(grid, r1, c, r2, c2)) {
          return [p1, k1, p2];
        }
      } else {
        if (this.isCellEmpty(grid, r2, c) && this.isLineClear(grid, r1, c, r2, c) && this.isLineClear(grid, r2, c, r2, c2)) {
          return [p1, k1, k2, p2];
        }
      }
    }

    // Check vertical lines from p1
    for (let r = -1; r <= this.ROWS; r++) {
      if (r === r1) continue;
      const k1 = { r: r, c: c1 };
      const k2 = { r: r, c: c2 };

      if (!this.isCellEmpty(grid, r, c1)) continue;
      if (!this.isLineClear(grid, r1, c1, r, c1)) continue;

      // From K1 to K2
      if (k2.r === r2 && k2.c === c2) {
        if (this.isLineClear(grid, r, c1, r2, c2)) {
          return [p1, k1, p2];
        }
      } else {
        if (this.isCellEmpty(grid, r, c2) && this.isLineClear(grid, r, c1, r, c2) && this.isLineClear(grid, r, c2, r2, c2)) {
          return [p1, k1, k2, p2];
        }
      }
    }

    return null;
  }

  /**
   * Find any valid matching pair on current board (for hint or deadlock check)
   */
  findValidPair(grid) {
    const tiles = [];
    for (let r = 0; r < this.ROWS; r++) {
      for (let c = 0; c < this.COLS; c++) {
        if (grid[r][c] !== null) {
          tiles.push({ r, c, tile: grid[r][c] });
        }
      }
    }

    for (let i = 0; i < tiles.length; i++) {
      for (let j = i + 1; j < tiles.length; j++) {
        if (tiles[i].tile.type === tiles[j].tile.type) {
          const path = this.findPath(grid, tiles[i], tiles[j]);
          if (path) {
            return { p1: tiles[i], p2: tiles[j], path };
          }
        }
      }
    }
    return null;
  }

  /**
   * Generate an initial solvable grid with 36 pairs
   */
  generateBoard(level = 1) {
    const totalCells = this.ROWS * this.COLS; // 72
    const totalPairs = totalCells / 2; // 36

    // Choose number of distinct monsters based on level (10 to 20 for nice variety)
    const distinctTypesCount = Math.min(10 + level * 2, 24);
    const availableTypes = [];
    for (let i = 1; i <= 30; i++) {
      availableTypes.push(i);
    }
    // Shuffle available monster types
    for (let i = availableTypes.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [availableTypes[i], availableTypes[j]] = [availableTypes[j], availableTypes[i]];
    }

    const selectedTypes = availableTypes.slice(0, distinctTypesCount);

    let pairs = [];
    while (pairs.length < totalPairs) {
      for (const type of selectedTypes) {
        pairs.push(type);
        if (pairs.length === totalPairs) break;
      }
    }

    // Double to create matching pairs
    let allItems = [];
    pairs.forEach((type) => {
      allItems.push(type);
      allItems.push(type);
    });

    let grid = null;
    let attempts = 0;

    // Retry until solvable initial board
    while (attempts < 100) {
      attempts++;
      // Shuffle items
      for (let i = allItems.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [allItems[i], allItems[j]] = [allItems[j], allItems[i]];
      }

      grid = [];
      let itemIdx = 0;
      for (let r = 0; r < this.ROWS; r++) {
        grid[r] = [];
        for (let c = 0; c < this.COLS; c++) {
          const type = allItems[itemIdx++];
          grid[r][c] = {
            id: `tile_${r}_${c}_${Math.random()}`,
            type: type,
            r: r,
            c: c,
            animScale: 1.0,
            animAlpha: 1.0,
            animOffset: { x: 0, y: 0 },
            selected: false,
            hint: false
          };
        }
      }

      if (this.findValidPair(grid)) {
        return grid;
      }
    }

    return grid;
  }

  /**
   * Reshuffle remaining tiles on the board, ensuring at least one valid move exists
   */
  shuffleRemaining(grid) {
    const remainingTiles = [];
    const positions = [];

    for (let r = 0; r < this.ROWS; r++) {
      for (let c = 0; c < this.COLS; c++) {
        if (grid[r][c] !== null) {
          remainingTiles.push(grid[r][c].type);
          positions.push({ r, c });
        }
      }
    }

    if (remainingTiles.length === 0) return grid;

    let success = false;
    let attempts = 0;

    while (!success && attempts < 100) {
      attempts++;
      // Shuffle tile types
      for (let i = remainingTiles.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [remainingTiles[i], remainingTiles[j]] = [remainingTiles[j], remainingTiles[i]];
      }

      // Assign to grid
      positions.forEach((pos, idx) => {
        grid[pos.r][pos.c].type = remainingTiles[idx];
        grid[pos.r][pos.c].hint = false;
        grid[pos.r][pos.c].selected = false;
      });

      if (this.findValidPair(grid)) {
        success = true;
      }
    }

    return grid;
  }

  /**
   * Apply slide / gravity dynamics based on level
   * Level 1: None
   * Level 2: Down
   * Level 3: Up
   * Level 4: Left
   * Level 5: Right
   */
  applySlide(grid, mode = 0) {
    if (mode === 0) return grid; // No slide

    if (mode === 1) {
      // SLIDE DOWN
      for (let c = 0; c < this.COLS; c++) {
        const colTiles = [];
        for (let r = 0; r < this.ROWS; r++) {
          if (grid[r][c] !== null) {
            colTiles.push(grid[r][c]);
          }
        }
        for (let r = 0; r < this.ROWS; r++) {
          grid[r][c] = null;
        }
        let targetRow = this.ROWS - 1;
        for (let i = colTiles.length - 1; i >= 0; i--) {
          const tile = colTiles[i];
          tile.r = targetRow;
          tile.c = c;
          grid[targetRow][c] = tile;
          targetRow--;
        }
      }
    } else if (mode === 2) {
      // SLIDE UP
      for (let c = 0; c < this.COLS; c++) {
        const colTiles = [];
        for (let r = 0; r < this.ROWS; r++) {
          if (grid[r][c] !== null) {
            colTiles.push(grid[r][c]);
          }
        }
        for (let r = 0; r < this.ROWS; r++) {
          grid[r][c] = null;
        }
        let targetRow = 0;
        for (let i = 0; i < colTiles.length; i++) {
          const tile = colTiles[i];
          tile.r = targetRow;
          tile.c = c;
          grid[targetRow][c] = tile;
          targetRow++;
        }
      }
    } else if (mode === 3) {
      // SLIDE LEFT
      for (let r = 0; r < this.ROWS; r++) {
        const rowTiles = [];
        for (let c = 0; c < this.COLS; c++) {
          if (grid[r][c] !== null) {
            rowTiles.push(grid[r][c]);
          }
        }
        for (let c = 0; c < this.COLS; c++) {
          grid[r][c] = null;
        }
        let targetCol = 0;
        for (let i = 0; i < rowTiles.length; i++) {
          const tile = rowTiles[i];
          tile.r = r;
          tile.c = targetCol;
          grid[r][targetCol] = tile;
          targetCol++;
        }
      }
    } else if (mode === 4) {
      // SLIDE RIGHT
      for (let r = 0; r < this.ROWS; r++) {
        const rowTiles = [];
        for (let c = 0; c < this.COLS; c++) {
          if (grid[r][c] !== null) {
            rowTiles.push(grid[r][c]);
          }
        }
        for (let c = 0; c < this.COLS; c++) {
          grid[r][c] = null;
        }
        let targetCol = this.COLS - 1;
        for (let i = rowTiles.length - 1; i >= 0; i--) {
          const tile = rowTiles[i];
          tile.r = r;
          tile.c = targetCol;
          grid[r][targetCol] = tile;
          targetCol--;
        }
      }
    }

    return grid;
  }
}

window.OnetLogic = OnetLogic;

