/**
 * Construct 3 Board Logic & Cycle Detection
 */
class Board {
  constructor() {
    this.rows = 6;
    this.cols = 6;
    this.grid = [];
    this.path = [];
    this.isSquareMode = false;
    this.activeColor = null;
    // 5-Color Palette
    this.allColors = ['red', 'yellow', 'green', 'orange', 'purple'];
    // 4 Active colors currently spawning
    this.activeColors = ['red', 'yellow', 'green', 'orange'];

    this.gridLeft = 108;
    this.gridTop = 500;
    this.tileSize = 115;
    this.tileGap = 34;

    this.calculateLayout();
    this.initBoard();
  }

  calculateLayout() {
    const totalGridWidth = this.cols * this.tileSize + (this.cols - 1) * this.tileGap;
    this.gridLeft = (1080 - totalGridWidth) / 2;
    this.gridTop = 500;
  }

  initBoard(initialColors) {
    if (Array.isArray(initialColors) && initialColors.length > 0) {
      this.activeColors = [...initialColors];
    } else {
      this.activeColors = ['red', 'yellow', 'green', 'orange'];
    }

    this.grid = [];
    this.path = [];
    this.isSquareMode = false;
    this.activeColor = null;

    for (let r = 0; r < this.rows; r++) {
      this.grid[r] = [];
      for (let c = 0; c < this.cols; c++) {
        const color = this.getRandomColor();
        const pos = this.getCellCenter(r, c);
        this.grid[r][c] = {
          id: this.nextDotId++,
          color,
          row: r,
          col: c,
          x: pos.x,
          y: pos.y,
          targetX: pos.x,
          targetY: pos.y,
          scale: 1,
          alpha: 1,
          isClearing: false,
          isNew: false
        };
      }
    }
  }

  getRandomColor(allowMixed = true) {
    if (allowMixed && Math.random() < 0.12) {
      return 'mixed';
    }
    const pool = this.activeColors.length > 0 ? this.activeColors : this.allColors;
    const idx = Math.floor(Math.random() * pool.length);
    return pool[idx];
  }

  replaceActiveColor(oldColor, newColor) {
    const idx = this.activeColors.indexOf(oldColor);
    if (idx !== -1) {
      this.activeColors[idx] = newColor;
    } else {
      this.activeColors.push(newColor);
    }
  }

  getCellCenter(row, col) {
    const x = this.gridLeft + col * (this.tileSize + this.tileGap) + this.tileSize / 2;
    const y = this.gridTop + row * (this.tileSize + this.tileGap) + this.tileSize / 2;
    return { x, y };
  }

  getCellAtPos(pixelX, pixelY) {
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const center = this.getCellCenter(r, c);
        const radius = this.tileSize * 0.75;
        const dx = pixelX - center.x;
        const dy = pixelY - center.y;
        if (dx * dx + dy * dy <= radius * radius) {
          return { row: r, col: c };
        }
      }
    }
    return null;
  }

  areAdjacent(p1, p2) {
    const dr = Math.abs(p1.row - p2.row);
    const dc = Math.abs(p1.col - p2.col);
    return (dr === 1 && dc === 0) || (dr === 0 && dc === 1);
  }

  startPath(pos) {
    const tile = this.grid[pos.row]?.[pos.col];
    if (!tile || tile.isClearing) return false;

    this.path = [pos];
    this.activeColor = tile.color === 'mixed' ? null : tile.color;
    this.isSquareMode = false;
    return true;
  }

  addCellToPath(pos) {
    if (this.path.length === 0) {
      return { changed: false, added: false, squareFormed: false, backtrack: false };
    }

    const tile = this.grid[pos.row]?.[pos.col];
    if (!tile || tile.isClearing) {
      return { changed: false, added: false, squareFormed: false, backtrack: false };
    }

    // Determine / match color with wildcard support
    if (!this.activeColor) {
      if (tile.color !== 'mixed') {
        this.activeColor = tile.color;
      }
    } else {
      if (tile.color !== this.activeColor && tile.color !== 'mixed') {
        return { changed: false, added: false, squareFormed: false, backtrack: false };
      }
    }

    const lastPos = this.path[this.path.length - 1];

    if (lastPos.row === pos.row && lastPos.col === pos.col) {
      return { changed: false, added: false, squareFormed: false, backtrack: false };
    }

    // Backtrack check
    if (this.path.length >= 2) {
      const prevPos = this.path[this.path.length - 2];
      if (prevPos.row === pos.row && prevPos.col === pos.col) {
        this.path.pop();
        this.isSquareMode = this.checkIfPathHasCycle();
        if (this.path.every(p => this.grid[p.row]?.[p.col]?.color === 'mixed')) {
          this.activeColor = null;
        }
        return { changed: true, added: false, squareFormed: false, backtrack: true };
      }
    }

    if (!this.areAdjacent(lastPos, pos)) {
      return { changed: false, added: false, squareFormed: false, backtrack: false };
    }

    const existingIndex = this.path.findIndex((p) => p.row === pos.row && p.col === pos.col);
    if (existingIndex !== -1) {
      if (this.path.length >= 4) {
        this.path.push(pos);
        const wasSquare = this.isSquareMode;
        this.isSquareMode = true;
        return { changed: true, added: true, squareFormed: !wasSquare, backtrack: false };
      }
      return { changed: false, added: false, squareFormed: false, backtrack: false };
    }

    this.path.push(pos);
    return { changed: true, added: true, squareFormed: false, backtrack: false };
  }

  checkIfPathHasCycle() {
    const seen = new Set();
    for (const p of this.path) {
      const key = `${p.row},${p.col}`;
      if (seen.has(key)) return true;
      seen.add(key);
    }
    return false;
  }

  endPath() {
    if (this.path.length < 2) {
      this.path = [];
      this.isSquareMode = false;
      this.activeColor = null;
      return { clearedTiles: [], isSquare: false, color: null, mixedCount: 0 };
    }

    const clearedColor = this.activeColor || 'mixed';
    const isSquare = this.isSquareMode;
    const clearedTiles = [];
    let mixedCount = 0;

    if (isSquare) {
      for (let r = 0; r < this.rows; r++) {
        for (let c = 0; c < this.cols; c++) {
          const t = this.grid[r][c];
          if (t && (t.color === clearedColor || t.color === 'mixed') && !t.isClearing) {
            t.isClearing = true;
            if (t.color === 'mixed') mixedCount++;
            clearedTiles.push(t);
          }
        }
      }
    } else {
      const uniquePos = new Set();
      for (const p of this.path) {
        const key = `${p.row},${p.col}`;
        if (!uniquePos.has(key)) {
          uniquePos.add(key);
          const t = this.grid[p.row][p.col];
          if (t && !t.isClearing) {
            t.isClearing = true;
            if (t.color === 'mixed') mixedCount++;
            clearedTiles.push(t);
          }
        }
      }
    }

    this.path = [];
    this.isSquareMode = false;
    this.activeColor = null;

    return { clearedTiles, isSquare, color: clearedColor, mixedCount };
  }

  clearAllOfColor(color) {
    const cleared = [];
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const t = this.grid[r][c];
        if (t && t.color === color && !t.isClearing) {
          t.isClearing = true;
          cleared.push(t);
        }
      }
    }
    return cleared;
  }

  dropAndRefill() {
    const droppedTiles = [];
    const newTiles = [];

    for (let c = 0; c < this.cols; c++) {
      for (let r = 0; r < this.rows; r++) {
        if (this.grid[r][c]?.isClearing) {
          this.grid[r][c] = null;
        }
      }

      let emptyRow = this.rows - 1;
      for (let r = this.rows - 1; r >= 0; r--) {
        const tile = this.grid[r][c];
        if (tile) {
          if (r !== emptyRow) {
            this.grid[emptyRow][c] = tile;
            this.grid[r][c] = null;
            tile.row = emptyRow;
            const targetPos = this.getCellCenter(emptyRow, c);
            tile.targetX = targetPos.x;
            tile.targetY = targetPos.y;
            droppedTiles.push(tile);
          }
          emptyRow--;
        }
      }

      let spawnOffset = 1;
      for (let r = emptyRow; r >= 0; r--) {
        const color = this.getRandomColor();
        const targetPos = this.getCellCenter(r, c);
        const startY = this.gridTop - spawnOffset * (this.tileSize + this.tileGap);
        spawnOffset++;

        const newTile = {
          id: this.nextDotId++,
          color,
          row: r,
          col: c,
          x: targetPos.x,
          y: startY,
          targetX: targetPos.x,
          targetY: targetPos.y,
          scale: 1,
          alpha: 1,
          isClearing: false,
          isNew: true
        };

        this.grid[r][c] = newTile;
        newTiles.push(newTile);
      }
    }

    return { droppedTiles, newTiles };
  }
}

window.Board = Board;

