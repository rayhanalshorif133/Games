/**
 * Construct 3 Input Handler
 */
class InputHandler {
  constructor(canvas, board, gameState, audioEngine, particleSystem, colorsConfig) {
    this.canvas = canvas;
    this.board = board;
    this.gameState = gameState;
    this.audioEngine = audioEngine;
    this.particleSystem = particleSystem;
    this.colorsConfig = colorsConfig;

    this.isDragging = false;
    this.dragPos = null;
    this.onActionComplete = null;

    this.bindEvents();
  }

  bindEvents() {
    this.canvas.addEventListener('pointerdown', this.onPointerDown.bind(this));
    window.addEventListener('pointermove', this.onPointerMove.bind(this));
    window.addEventListener('pointerup', this.onPointerUp.bind(this));
    window.addEventListener('pointercancel', this.onPointerUp.bind(this));
  }

  getCanvasCoords(e) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  }

  onPointerDown(e) {
    if (this.gameState.status !== 'playing') return;

    const coords = this.getCanvasCoords(e);
    const cell = this.board.getCellAtPos(coords.x, coords.y);

    if (cell) {
      const tile = this.board.grid[cell.row]?.[cell.col];
      if (tile && !tile.isClearing) {
        this.isDragging = true;
        this.dragPos = coords;
        this.board.startPath(cell);

        this.audioEngine.playConnectNote(1);
        const center = this.board.getCellCenter(cell.row, cell.col);
        const theme = this.colorsConfig[tile.color] || { primary: '#6EA8FE' };
        this.particleSystem.emitFloatingText(center.x, center.y, '+1', theme.primary);
      }
    }
  }

  onPointerMove(e) {
    if (!this.isDragging || this.gameState.status !== 'playing') return;

    const coords = this.getCanvasCoords(e);
    this.dragPos = coords;

    const cell = this.board.getCellAtPos(coords.x, coords.y);
    if (cell) {
      const result = this.board.addCellToPath(cell);
      if (result.added) {
        const tile = this.board.grid[cell.row]?.[cell.col];
        if (tile) {
          const center = this.board.getCellCenter(cell.row, cell.col);
          const theme = this.colorsConfig[tile.color] || { primary: '#6EA8FE' };
          this.particleSystem.emitFloatingText(center.x, center.y, '+1', theme.primary);
        }

        if (result.squareFormed) {
          this.audioEngine.playSquareFormed();
          if (this.board.activeColor) {
            const center = this.board.getCellCenter(cell.row, cell.col);
            const theme = this.colorsConfig[this.board.activeColor] || { primary: '#6EA8FE' };
            this.particleSystem.emitShockwave(center.x, center.y, theme.primary);
          }
        } else {
          this.audioEngine.playConnectNote(this.board.path.length);
        }
      }
    }
  }

  onPointerUp(_e) {
    if (!this.isDragging) return;
    this.isDragging = false;
    this.dragPos = null;

    if (this.board.path.length < 2) {
      this.board.endPath();
      return;
    }

    const pathLength = this.board.path.length;
    const { clearedTiles, isSquare, color } = this.board.endPath();

    if (clearedTiles.length > 0 && color) {
      this.gameState.decrementMoves();

      const baseScore = clearedTiles.length * 10;
      const bonusScore = isSquare ? 50 : Math.max(0, (pathLength - 2) * 5);
      this.gameState.addScore(baseScore + bonusScore);

      this.gameState.updateObjectives({ [color]: clearedTiles.length });

      const theme = this.colorsConfig[color] || { primary: '#6EA8FE' };

      if (isSquare) {
        this.audioEngine.playSquareBurst();
        for (const t of clearedTiles) {
          this.particleSystem.emitDotBurst(t.x, t.y, theme.primary, 12);
        }
      } else {
        this.audioEngine.playPop(1.0);
        for (const t of clearedTiles) {
          this.particleSystem.emitDotBurst(t.x, t.y, theme.primary, 8);
        }
      }

      setTimeout(() => {
        this.board.dropAndRefill();
        this.audioEngine.playLandingThud();

        const isGameOver = this.gameState.checkWinCondition();
        if (isGameOver && this.gameState.status === 'won') {
          this.audioEngine.playVictoryFanfare();
          this.particleSystem.emitConfettiCannon();
        }

        if (this.onActionComplete) {
          this.onActionComplete();
        }
      }, 160);
    }
  }
}

window.InputHandler = InputHandler;

