/**
 * Hexagonal Bubble Grid Manager for Bubble Shooter 2D
 * Handles hex geometry, cluster matching, floating bubble isolation, and collision snapping.
 */
class BubbleGrid {
  constructor(config) {
    this.config = config;
    this.canvasWidth = config.canvasWidth || 1080;
    this.canvasHeight = config.canvasHeight || 1920;
    this.radius = config.bubbleRadius || 48;
    this.diameter = this.radius * 2;
    this.rowHeight = this.diameter * Math.sin(Math.PI / 3); // 96 * 0.866025 ≈ 83.14px
    this.topOffset = config.topOffset || 240;
    this.rows = config.gridRows || 16;
    this.evenCols = 11;
    this.oddCols = 10;
    this.sidePadding = 12; // (1080 - 11 * 96) / 2 = 12px

    this.colors = config.colors || [];
    this.specialConfig = config.specialBubbles || { bombChance: 0.05, rainbowChance: 0.04 };
    this.grid = [];
    this.ceilingY = this.topOffset;
    this.targetCeilingY = this.topOffset;

    this.initGrid();
  }

  initGrid() {
    this.grid = [];
    for (let r = 0; r < this.rows; r++) {
      const cols = this.getColsInRow(r);
      const rowArr = new Array(cols).fill(null);
      this.grid.push(rowArr);
    }
  }

  getColsInRow(row) {
    return (row % 2 === 0) ? this.evenCols : this.oddCols;
  }

  /**
   * Calculates world {x, y} coordinate for a given (row, col) cell
   */
  getCellPos(row, col) {
    const isEven = (row % 2 === 0);
    const xOffset = isEven ? (this.sidePadding + this.radius) : (this.sidePadding + this.radius + this.radius);
    const x = xOffset + col * this.diameter;
    const y = this.ceilingY + this.radius + row * this.rowHeight;
    return { x, y };
  }

  /**
   * Generates a new level board with initial rows populated
   */
  generateLevel(level = 1) {
    this.initGrid();
    this.ceilingY = this.topOffset;
    this.targetCeilingY = this.topOffset;

    // Determine active colors based on level (start with 4 colors, up to 6)
    const numColors = Math.min(4 + Math.floor((level - 1) / 2), this.colors.length);
    const activeColors = this.colors.slice(0, numColors);

    const initialRows = Math.min(6 + Math.floor(level / 2), 9);

    for (let r = 0; r < initialRows; r++) {
      const cols = this.getColsInRow(r);
      for (let c = 0; c < cols; c++) {
        // High-density clustered generation to ensure match opportunities
        let colorId;
        const neighbors = this.getOccupiedNeighbors(r, c);
        if (neighbors.length > 0 && Math.random() < 0.65) {
          // 65% chance to share color with an adjacent neighbor
          colorId = neighbors[Math.floor(Math.random() * neighbors.length)].colorId;
        } else {
          colorId = activeColors[Math.floor(Math.random() * activeColors.length)].id;
        }

        let type = 'normal';
        const rand = Math.random();
        if (rand < this.specialConfig.bombChance) {
          type = 'bomb';
        } else if (rand < this.specialConfig.bombChance + this.specialConfig.rainbowChance) {
          type = 'rainbow';
        }

        const pos = this.getCellPos(r, c);
        this.grid[r][c] = {
          row: r,
          col: c,
          x: pos.x,
          y: pos.y,
          colorId: type === 'rainbow' ? 'rainbow' : (type === 'bomb' ? 'bomb' : colorId),
          type: type,
          scale: 1,
          alpha: 1,
          popping: false
        };
      }
    }
  }

  /**
   * Returns valid neighboring coordinates for hex grid cell (row, col)
   */
  getNeighborCoords(row, col) {
    const isEven = (row % 2 === 0);
    const offsets = isEven ? [
      { r: 0, c: -1 }, { r: 0, c: 1 },  // Left, Right
      { r: -1, c: -1 }, { r: -1, c: 0 }, // Top-Left, Top-Right
      { r: 1, c: -1 }, { r: 1, c: 0 }    // Bottom-Left, Bottom-Right
    ] : [
      { r: 0, c: -1 }, { r: 0, c: 1 },  // Left, Right
      { r: -1, c: 0 }, { r: -1, c: 1 },  // Top-Left, Top-Right
      { r: 1, c: 0 }, { r: 1, c: 1 }    // Bottom-Left, Bottom-Right
    ];

    const result = [];
    for (const off of offsets) {
      const nr = row + off.r;
      const nc = col + off.c;
      if (nr >= 0 && nr < this.rows) {
        const maxCols = this.getColsInRow(nr);
        if (nc >= 0 && nc < maxCols) {
          result.push({ r: nr, c: nc });
        }
      }
    }
    return result;
  }

  getOccupiedNeighbors(row, col) {
    const coords = this.getNeighborCoords(row, col);
    const list = [];
    for (const { r, c } of coords) {
      if (this.grid[r] && this.grid[r][c]) {
        list.push(this.grid[r][c]);
      }
    }
    return list;
  }

  /**
   * Snaps a moving bullet bubble to the best empty adjacent cell in the grid
   */
  snapBullet(bullet) {
    let bestCell = null;
    let minDistance = Infinity;

    // If reached the ceiling directly
    if (bullet.y <= this.ceilingY + this.radius + 10) {
      const row = 0;
      const cols = this.getColsInRow(0);
      for (let c = 0; c < cols; c++) {
        if (!this.grid[0][c]) {
          const pos = this.getCellPos(0, c);
          const dist = Math.hypot(pos.x - bullet.x, pos.y - bullet.y);
          if (dist < minDistance) {
            minDistance = dist;
            bestCell = { r: 0, c: c, x: pos.x, y: pos.y };
          }
        }
      }
      if (bestCell) {
        return this.placeBubble(bestCell.r, bestCell.c, bullet);
      }
    }

    // Otherwise, check all empty cells adjacent to any occupied bubble
    for (let r = 0; r < this.rows; r++) {
      const cols = this.getColsInRow(r);
      for (let c = 0; c < cols; c++) {
        if (!this.grid[r][c]) {
          // Cell is empty - check if it has at least one neighbor or is row 0
          const neighbors = this.getOccupiedNeighbors(r, c);
          if (neighbors.length > 0 || r === 0) {
            const pos = this.getCellPos(r, c);
            const dist = Math.hypot(pos.x - bullet.x, pos.y - bullet.y);
            if (dist < minDistance) {
              minDistance = dist;
              bestCell = { r, c, x: pos.x, y: pos.y };
            }
          }
        }
      }
    }

    if (bestCell) {
      return this.placeBubble(bestCell.r, bestCell.c, bullet);
    }

    return null;
  }

  placeBubble(r, c, bullet) {
    const pos = this.getCellPos(r, c);
    const bubble = {
      row: r,
      col: c,
      x: pos.x,
      y: pos.y,
      colorId: bullet.colorId,
      type: bullet.type || 'normal',
      scale: 1,
      alpha: 1,
      popping: false
    };
    this.grid[r][c] = bubble;
    return bubble;
  }

  /**
   * Finds matching connected cluster starting from (row, col).
   * Handles Rainbow matching and Bomb explosions.
   */
  findMatches(startRow, startCol) {
    const startBubble = this.grid[startRow][startCol];
    if (!startBubble) return [];

    // Special: BOMB BUBBLE explodes all neighbors in 2-cell radius
    if (startBubble.type === 'bomb') {
      const exploded = new Set();
      exploded.add(`${startRow},${startCol}`);
      const direct = this.getOccupiedNeighbors(startRow, startCol);
      for (const n of direct) {
        exploded.add(`${n.row},${n.col}`);
        const secondary = this.getOccupiedNeighbors(n.row, n.col);
        for (const s of secondary) {
          exploded.add(`${s.row},${s.col}`);
        }
      }
      const result = [];
      exploded.forEach(key => {
        const [r, c] = key.split(',').map(Number);
        if (this.grid[r] && this.grid[r][c]) {
          result.push(this.grid[r][c]);
        }
      });
      return result;
    }

    // Special: RAINBOW BUBBLE adapts to neighbors
    let matchColor = startBubble.colorId;
    if (startBubble.type === 'rainbow') {
      const neighbors = this.getOccupiedNeighbors(startRow, startCol);
      const coloredNeighbor = neighbors.find(n => n.type === 'normal');
      if (coloredNeighbor) {
        matchColor = coloredNeighbor.colorId;
      }
    }

    // BFS Flood Fill for connected identical colors or rainbow/bomb bubbles
    const matched = [];
    const visited = new Set();
    const queue = [{ r: startRow, c: startCol }];
    visited.add(`${startRow},${startCol}`);

    while (queue.length > 0) {
      const current = queue.shift();
      const b = this.grid[current.r][current.c];
      matched.push(b);

      const neighbors = this.getNeighborCoords(current.r, current.c);
      for (const { r, c } of neighbors) {
        const key = `${r},${c}`;
        if (!visited.has(key)) {
          const nb = this.grid[r] && this.grid[r][c];
          if (nb) {
            const isMatch = (nb.colorId === matchColor) || 
                            (nb.type === 'rainbow') || 
                            (startBubble.type === 'rainbow' && (matchColor === 'rainbow' || nb.colorId === matchColor));
            if (isMatch) {
              visited.add(key);
              queue.push({ r, c });
            }
          }
        }
      }
    }

    // Must be 3 or more bubbles to pop (unless triggered by Bomb)
    if (matched.length >= 3) {
      return matched;
    }

    return [];
  }

  /**
   * Identifies all bubbles that are disconnected from the ceiling (row 0).
   * These will fall with physics!
   */
  findFloatingBubbles() {
    const connected = new Set();
    const queue = [];

    // Seed BFS with all bubbles currently attached to row 0
    const cols0 = this.getColsInRow(0);
    for (let c = 0; c < cols0; c++) {
      if (this.grid[0][c]) {
        connected.add(`0,${c}`);
        queue.push({ r: 0, c: c });
      }
    }

    // Traverse all bubbles reachable from ceiling
    while (queue.length > 0) {
      const { r, c } = queue.shift();
      const neighbors = this.getNeighborCoords(r, c);
      for (const { r: nr, c: nc } of neighbors) {
        const key = `${nr},${nc}`;
        if (!connected.has(key) && this.grid[nr] && this.grid[nr][nc]) {
          connected.add(key);
          queue.push({ r: nr, c: nc });
        }
      }
    }

    // Any bubble on the board NOT in connected set is floating!
    const floating = [];
    for (let r = 0; r < this.rows; r++) {
      const cols = this.getColsInRow(r);
      for (let c = 0; c < cols; c++) {
        const b = this.grid[r][c];
        if (b && !connected.has(`${r},${c}`)) {
          floating.push(b);
          this.grid[r][c] = null; // Detach from grid
        }
      }
    }

    return floating;
  }

  /**
   * Removes matched bubbles from the grid
   */
  removeBubbles(bubbles) {
    for (const b of bubbles) {
      if (this.grid[b.row] && this.grid[b.row][b.col]) {
        this.grid[b.row][b.col] = null;
      }
    }
  }

  /**
   * Lowers the ceiling by one row height with animation
   */
  descendCeiling() {
    this.targetCeilingY += this.rowHeight;

    // Shift all bubbles down by 1 row
    for (let r = this.rows - 1; r > 0; r--) {
      const cols = this.getColsInRow(r);
      for (let c = 0; c < cols; c++) {
        const prevCols = this.getColsInRow(r - 1);
        if (c < prevCols && this.grid[r - 1][c]) {
          this.grid[r][c] = this.grid[r - 1][c];
          this.grid[r][c].row = r;
        } else {
          this.grid[r][c] = null;
        }
      }
    }

    // Populate top row 0 with fresh random bubbles
    const cols0 = this.getColsInRow(0);
    for (let c = 0; c < cols0; c++) {
      const color = this.colors[Math.floor(Math.random() * this.colors.length)];
      const pos = this.getCellPos(0, c);
      this.grid[0][c] = {
        row: 0,
        col: c,
        x: pos.x,
        y: pos.y,
        colorId: color.id,
        type: 'normal',
        scale: 1,
        alpha: 1,
        popping: false
      };
    }

    // Recalculate world positions for all bubbles
    this.updateAllPositions();
  }

  updateAllPositions() {
    for (let r = 0; r < this.rows; r++) {
      const cols = this.getColsInRow(r);
      for (let c = 0; c < cols; c++) {
        if (this.grid[r][c]) {
          const pos = this.getCellPos(r, c);
          this.grid[r][c].x = pos.x;
          this.grid[r][c].y = pos.y;
        }
      }
    }
  }

  update(dt) {
    // Smooth ceiling slide
    if (this.ceilingY < this.targetCeilingY) {
      this.ceilingY = Math.min(this.targetCeilingY, this.ceilingY + 120 * dt);
      this.updateAllPositions();
    }
  }

  /**
   * Checks if any active bubble crosses the danger line
   */
  hasCrossedDangerLine(dangerY) {
    for (let r = 0; r < this.rows; r++) {
      const cols = this.getColsInRow(r);
      for (let c = 0; c < cols; c++) {
        const b = this.grid[r][c];
        if (b && (b.y + this.radius >= dangerY)) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Returns true if all bubbles on the board have been cleared!
   */
  isCleared() {
    for (let r = 0; r < this.rows; r++) {
      const cols = this.getColsInRow(r);
      for (let c = 0; c < cols; c++) {
        if (this.grid[r][c]) {
          return false;
        }
      }
    }
    return true;
  }

  /**
   * Returns list of all active color IDs currently on the board
   */
  getActiveColors() {
    const set = new Set();
    for (let r = 0; r < this.rows; r++) {
      const cols = this.getColsInRow(r);
      for (let c = 0; c < cols; c++) {
        const b = this.grid[r][c];
        if (b && b.type === 'normal') {
          set.add(b.colorId);
        }
      }
    }
    return Array.from(set);
  }
}

window.BubbleGrid = BubbleGrid;

