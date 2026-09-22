/**
 * Construct 3 Input Handler
 */
class InputHandler {
  constructor(canvas, board, gameState, audioEngine, particleSystem, colorsConfig, uiManager = null) {
    this.canvas = canvas;
    this.board = board;
    this.gameState = gameState;
    this.audioEngine = audioEngine;
    this.particleSystem = particleSystem;
    this.colorsConfig = colorsConfig;
    this.uiManager = uiManager;

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
    const { clearedTiles, isSquare, color, mixedCount } = this.board.endPath();

    if (clearedTiles.length > 0 && color) {
      const baseScore = clearedTiles.length * 10;
      const bonusScore = isSquare ? 50 : Math.max(0, (pathLength - 2) * 5);
      const mixedBonus = (mixedCount || 0) * 100;
      this.gameState.addScore(baseScore + bonusScore + mixedBonus);

      if (mixedBonus > 0) {
        this.audioEngine.playCoin();
        this.particleSystem.emitFloatingText(540, 560, `+${mixedBonus} WILDCARD BONUS!`, '#F2C94C');
      }

      const theme = this.colorsConfig[color] || { primary: '#6EA8FE' };

      if (isSquare) {
        this.audioEngine.playSquareBurst();
      } else {
        this.audioEngine.playPop(1.0);
      }

      // 1. Emit local dot bursts & Flying orbs heading to matching target slot in footer
      clearedTiles.forEach((t, idx) => {
        this.particleSystem.emitDotBurst(t.x, t.y, theme.primary, isSquare ? 12 : 8);

        const orbColor = t.color === 'mixed' ? color : t.color;
        const targetPos = this.uiManager
          ? this.uiManager.getColorSlotCanvasPos(orbColor)
          : { x: 540, y: 1835 };

        this.particleSystem.emitFlyingOrb(
          t.x,
          t.y,
          targetPos.x,
          targetPos.y,
          theme.primary,
          () => {
            if (this.uiManager) {
              this.uiManager.pulseColorSlot(orbColor);
            }
          },
          idx * 0.035
        );
      });

      // 2. Check color box counter & bonus wipe
      const targetResult = this.gameState.updateColorTarget(color, clearedTiles.length);
      if (targetResult.completed) {
        this.audioEngine.playVictoryFanfare();
        
        // Trigger 100% full glass exit and new glass entry
        if (this.uiManager) {
          this.uiManager.animateGlassCompletion(targetResult.oldColor, targetResult.newColor);
        }

        // Update board's active spawning pool with the new color
        this.board.replaceActiveColor(targetResult.oldColor, targetResult.newColor);

        const newTheme = this.colorsConfig[targetResult.newColor] || theme;
        this.particleSystem.emitFloatingText(540, 440, `+${targetResult.bonusPoints} BONUS!`, theme.primary);
        this.particleSystem.emitFloatingText(540, 495, `NEW: ${targetResult.newColorName.toUpperCase()}`, newTheme.primary);

        // Vanish all remaining dots of the completed color across the entire board
        const extraCleared = this.board.clearAllOfColor(targetResult.oldColor);
        const oldTargetPos = this.uiManager
          ? this.uiManager.getColorSlotCanvasPos(targetResult.oldColor)
          : { x: 540, y: 1835 };

        extraCleared.forEach((t, idx) => {
          this.particleSystem.emitDotBurst(t.x, t.y, theme.primary, 14);
          this.particleSystem.emitFlyingOrb(
            t.x,
            t.y,
            oldTargetPos.x,
            oldTargetPos.y,
            theme.primary,
            () => {
              if (this.uiManager) {
                this.uiManager.pulseColorSlot(targetResult.oldColor);
              }
            },
            idx * 0.025
          );
        });
      }

      setTimeout(() => {
        this.board.dropAndRefill();
        this.audioEngine.playLandingThud();

        if (this.onActionComplete) {
          this.onActionComplete();
        }
      }, 160);
    }
  }
}

window.InputHandler = InputHandler;

