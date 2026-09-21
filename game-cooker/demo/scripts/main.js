/**
 * Construct 3 Main Controller & Canvas Renderer
 */
class GameApp {
  constructor() {
    this.viewportEl = document.getElementById('game-viewport');
    this.appEl = document.getElementById('app');

    this.data = null;
    this.images = {};
    this.isLoaded = false;
    this.lastTime = performance.now();

    this.init();
  }

  async init() {
    // 1. Fetch data.json
    try {
      const resp = await fetch('data.json');
      this.data = await resp.json();
    } catch (e) {
      console.warn('Fallback data loading', e);
      this.data = {
        levels: [
          { levelNumber: 4, title: 'Level 04', moves: 30, objectives: { blue: 25, purple: 25, red: 25, yellow: 25 }, starThresholds: [75, 150, 220] }
        ],
        colors: {
          blue: { primary: '#6EA8FE', light: '#A6CBFF', dark: '#3D7DE0', glow: 'rgba(110, 168, 254, 0.6)', bgHighlight: 'rgba(110, 168, 254, 0.32)' },
          purple: { primary: '#9D5DE5', light: '#C18FFF', dark: '#7A35C5', glow: 'rgba(157, 93, 229, 0.6)', bgHighlight: 'rgba(157, 93, 229, 0.32)' },
          red: { primary: '#EE5965', light: '#FF8A93', dark: '#C83845', glow: 'rgba(238, 89, 101, 0.6)', bgHighlight: 'rgba(238, 89, 101, 0.32)' },
          yellow: { primary: '#F8CF47', light: '#FEE77E', dark: '#D8A618', glow: 'rgba(248, 207, 71, 0.6)', bgHighlight: 'rgba(248, 207, 71, 0.32)' }
        }
      };
    }

    // 2. Preload sprite images
    await this.preloadImages();

    // 3. Initialize core systems
    this.gameState = new GameState(this.data.levels, 3); // Level 4
    this.board = new Board();
    this.audioEngine = new AudioEngine();
    this.physics = new Physics();
    this.particleSystem = new ParticleSystem();

    this.initUI();
    this.initCanvasAndInput();
    this.initScaling();

    this.gameState.loadLevel(this.gameState.currentLevelIndex);
    this.isLoaded = true;

    requestAnimationFrame(this.gameLoop.bind(this));
  }

  preloadImages() {
    const imageFiles = [
      'dot_blue', 'dot_purple', 'dot_red', 'dot_yellow', 'dot_highlight',
      'icon_moves', 'icon_trophy', 'icon_coin', 'icon_check', 'icon_pause',
      'icon_sound_on', 'icon_sound_off', 'icon_play', 'icon_close', 'icon_video',
      'star_filled', 'star_empty', 'btn_green'
    ];

    const promises = imageFiles.map((name) => {
      return new Promise((resolve) => {
        const img = new Image();
        img.src = `images/${name}.png`;
        img.onload = () => {
          this.images[name] = img;
          resolve();
        };
        img.onerror = () => {
          console.warn(`Failed loading image: images/${name}.png`);
          resolve();
        };
      });
    });

    return Promise.all(promises);
  }

  initUI() {
    this.uiManager = new UIManager(
      this.appEl,
      this.gameState,
      this.audioEngine,
      this.restartCurrentLevel.bind(this),
      this.advanceNextLevel.bind(this)
    );
  }

  initCanvasAndInput() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d', { alpha: false });
    this.canvas.width = 1080;
    this.canvas.height = 1920;

    this.inputHandler = new InputHandler(
      this.canvas,
      this.board,
      this.gameState,
      this.audioEngine,
      this.particleSystem,
      this.data.colors
    );
  }

  initScaling() {
    const updateScale = () => {
      const targetWidth = 1080;
      const targetHeight = 1920;

      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;

      const scaleX = windowWidth / targetWidth;
      const scaleY = windowHeight / targetHeight;
      const scale = Math.min(scaleX, scaleY) * 0.98;

      this.viewportEl.style.transform = `scale(${scale})`;
    };

    window.addEventListener('resize', updateScale);
    window.addEventListener('orientationchange', updateScale);
    updateScale();
  }

  restartCurrentLevel() {
    this.board.initBoard();
    this.particleSystem.clear();
    this.gameState.restartLevel();
  }

  advanceNextLevel() {
    this.board.initBoard();
    this.particleSystem.clear();
    this.gameState.nextLevel();
  }

  gameLoop(time) {
    if (!this.isLoaded) return;

    const dt = Math.min((time - this.lastTime) / 1000, 0.1);
    this.lastTime = time;

    this.physics.update(this.board, dt);
    this.particleSystem.update(dt);
    this.renderCanvas(time);

    requestAnimationFrame(this.gameLoop.bind(this));
  }

  renderCanvas(now) {
    const ctx = this.ctx;
    const board = this.board;
    const colors = this.data.colors;

    // Clear background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, 1080, 1920);

    // Active color boundary indicator bars (top & bottom)
    if (board.activeColor && board.path.length > 0) {
      const theme = colors[board.activeColor] || { primary: '#6EA8FE' };
      const barHeight = 12;
      const topY = board.gridTop - 110;
      const bottomY = board.gridTop + board.rows * (board.tileSize + board.tileGap) + 70;

      ctx.save();
      ctx.fillStyle = theme.primary;
      ctx.fillRect(board.gridLeft, topY, 1080 - board.gridLeft * 2, barHeight);
      ctx.fillRect(board.gridLeft, bottomY, 1080 - board.gridLeft * 2, barHeight);
      ctx.restore();
    }

    // Dot background highlights
    if (board.activeColor) {
      const theme = colors[board.activeColor] || { bgHighlight: 'rgba(110,168,254,0.32)' };
      const highlightSize = board.tileSize * 1.34;
      const highlightRadius = 26;

      if (board.isSquareMode) {
        const pulse = Math.sin(now * 0.008) * 0.15 + 0.85;
        for (let r = 0; r < board.rows; r++) {
          for (let c = 0; c < board.cols; c++) {
            const tile = board.grid[r][c];
            if (tile && tile.color === board.activeColor && !tile.isClearing) {
              ctx.save();
              ctx.translate(tile.x, tile.y);
              ctx.fillStyle = theme.bgHighlight;
              ctx.globalAlpha = pulse * 0.95;
              this.drawRoundedRect(ctx, -highlightSize / 2, -highlightSize / 2, highlightSize, highlightSize, highlightRadius);
              ctx.fill();
              ctx.restore();
            }
          }
        }
      } else {
        for (const pos of board.path) {
          const tile = board.grid[pos.row]?.[pos.col];
          if (tile && !tile.isClearing) {
            ctx.save();
            ctx.translate(tile.x, tile.y);
            ctx.fillStyle = theme.bgHighlight;
            ctx.globalAlpha = 0.9;
            this.drawRoundedRect(ctx, -highlightSize / 2, -highlightSize / 2, highlightSize, highlightSize, highlightRadius);
            ctx.fill();
            ctx.restore();
          }
        }
      }
    }

    // Connecting lines
    if (board.path.length > 0 && board.activeColor) {
      const theme = colors[board.activeColor] || { primary: '#6EA8FE', glow: 'rgba(110,168,254,0.6)' };

      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineWidth = 26;

      if (board.isSquareMode) {
        ctx.shadowColor = theme.glow;
        ctx.shadowBlur = 18 + Math.sin(now * 0.01) * 8;
      }

      ctx.strokeStyle = theme.primary;
      ctx.beginPath();

      const firstPos = board.path[0];
      const firstTile = board.grid[firstPos.row]?.[firstPos.col];
      const startX = firstTile ? firstTile.x : board.getCellCenter(firstPos.row, firstPos.col).x;
      const startY = firstTile ? firstTile.y : board.getCellCenter(firstPos.row, firstPos.col).y;

      ctx.moveTo(startX, startY);

      for (let i = 1; i < board.path.length; i++) {
        const pos = board.path[i];
        const tile = board.grid[pos.row]?.[pos.col];
        const px = tile ? tile.x : board.getCellCenter(pos.row, pos.col).x;
        const py = tile ? tile.y : board.getCellCenter(pos.row, pos.col).y;
        ctx.lineTo(px, py);
      }

      // Drag line to pointer
      if (this.inputHandler.isDragging && !board.isSquareMode && this.inputHandler.dragPos) {
        const lastPos = board.path[board.path.length - 1];
        const lastTile = board.grid[lastPos.row]?.[lastPos.col];
        const lastX = lastTile ? lastTile.x : board.getCellCenter(lastPos.row, lastPos.col).x;
        const lastY = lastTile ? lastTile.y : board.getCellCenter(lastPos.row, lastPos.col).y;

        const dx = this.inputHandler.dragPos.x - lastX;
        const dy = this.inputHandler.dragPos.y - lastY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const maxDragDist = board.tileSize * 1.8;
        if (dist > 0) {
          const factor = Math.min(1, maxDragDist / dist);
          ctx.lineTo(lastX + dx * factor, lastY + dy * factor);
        }
      }

      ctx.stroke();
      ctx.restore();
    }

    // Render dot sprites from images/
    const dotSize = board.tileSize * 0.88; // ~101px

    for (let r = 0; r < board.rows; r++) {
      for (let c = 0; c < board.cols; c++) {
        const tile = board.grid[r][c];
        if (!tile || tile.alpha <= 0.01) continue;

        let scale = tile.scale;
        if (board.isSquareMode && tile.color === board.activeColor && !tile.isClearing) {
          scale *= 1 + Math.sin(now * 0.01 + (r + c) * 0.3) * 0.08;
        }

        ctx.save();
        ctx.translate(tile.x, tile.y);
        ctx.scale(scale, scale);
        ctx.globalAlpha = tile.alpha;

        const sprite = this.images[`dot_${tile.color}`];
        if (sprite) {
          ctx.drawImage(sprite, -dotSize / 2, -dotSize / 2, dotSize, dotSize);
        } else {
          const theme = colors[tile.color] || { primary: '#6EA8FE' };
          ctx.fillStyle = theme.primary;
          this.drawRoundedRect(ctx, -dotSize / 2, -dotSize / 2, dotSize, dotSize, 26);
          ctx.fill();
        }

        ctx.restore();
      }
    }

    // Render particles
    this.particleSystem.render(ctx);
  }

  drawRoundedRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.gameApp = new GameApp();
});

