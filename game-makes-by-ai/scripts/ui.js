/**
 * UI & Input Controller
 * Handles touch swipe gestures, keyboard mapping, HUD rendering, and game state overlays.
 */

class UIController {
  constructor(runtime) {
    this.runtime = runtime;
    this.canvas = runtime.canvas;

    // Touch gesture tracking
    this.touchStartX = 0;
    this.touchStartY = 0;
    this.touchStartTime = 0;
    this.minSwipeDistance = 35; // Pixels
    this.maxSwipeTime = 400; // ms

    this.bindInputs();
  }

  bindInputs() {
    // 1. TOUCH EVENTS
    window.addEventListener('touchstart', (e) => {
      if (e.touches.length > 0) {
        const t = e.touches[0];
        this.touchStartX = t.clientX;
        this.touchStartY = t.clientY;
        this.touchStartTime = performance.now();
      }
    }, { passive: false });

    window.addEventListener('touchmove', (e) => {
      // Prevent browser default pull-to-refresh & pinch-zoom
      e.preventDefault();
    }, { passive: false });

    window.addEventListener('touchend', (e) => {
      if (e.changedTouches.length === 0) return;
      const t = e.changedTouches[0];
      const dx = t.clientX - this.touchStartX;
      const dy = t.clientY - this.touchStartY;
      const dt = performance.now() - this.touchStartTime;

      const absX = Math.abs(dx);
      const absY = Math.abs(dy);

      // Tap detection
      if (absX < 20 && absY < 20 && dt < 300) {
        this.handleTap(t.clientX, t.clientY);
        return;
      }

      // Swipe detection
      if (dt <= this.maxSwipeTime) {
        if (absX > absY && absX > this.minSwipeDistance) {
          // Horizontal Swipe
          if (dx < 0) {
            this.handleAction('LEFT');
          } else {
            this.handleAction('RIGHT');
          }
        } else if (absY > absX && absY > this.minSwipeDistance) {
          // Vertical Swipe
          if (dy < 0) {
            this.handleAction('UP');
          } else {
            this.handleAction('DOWN');
          }
        }
      }
    }, { passive: false });

    // 2. MOUSE DRAG / SWIPE SUPPORT FOR DESKTOP TESTING
    let isMouseDown = false;
    let mouseStartX = 0;
    let mouseStartY = 0;

    window.addEventListener('mousedown', (e) => {
      isMouseDown = true;
      mouseStartX = e.clientX;
      mouseStartY = e.clientY;
    });

    window.addEventListener('mouseup', (e) => {
      if (!isMouseDown) return;
      isMouseDown = false;
      const dx = e.clientX - mouseStartX;
      const dy = e.clientY - mouseStartY;
      const absX = Math.abs(dx);
      const absY = Math.abs(dy);

      if (absX < 15 && absY < 15) {
        this.handleTap(e.clientX, e.clientY);
        return;
      }

      if (absX > absY && absX > 25) {
        if (dx < 0) this.handleAction('LEFT');
        else this.handleAction('RIGHT');
      } else if (absY > absX && absY > 25) {
        if (dy < 0) this.handleAction('UP');
        else this.handleAction('DOWN');
      }
    });

    // 3. KEYBOARD SUPPORT
    window.addEventListener('keydown', (e) => {
      if (['ArrowLeft', 'KeyA', 'a', 'A'].includes(e.code) || ['ArrowLeft', 'a', 'A'].includes(e.key)) {
        this.handleAction('LEFT');
      } else if (['ArrowRight', 'KeyD', 'd', 'D'].includes(e.code) || ['ArrowRight', 'd', 'D'].includes(e.key)) {
        this.handleAction('RIGHT');
      } else if (['ArrowUp', 'KeyW', 'w', 'W', 'Space'].includes(e.code) || ['ArrowUp', 'w', 'W', ' '].includes(e.key)) {
        this.handleAction('UP');
      } else if (['ArrowDown', 'KeyS', 's', 'S'].includes(e.code) || ['ArrowDown', 's', 'S'].includes(e.key)) {
        this.handleAction('DOWN');
      } else if (['KeyP', 'Escape'].includes(e.code) || ['p', 'P', 'Escape'].includes(e.key)) {
        this.handleAction('PAUSE');
      } else if (e.code === 'Enter') {
        this.handleAction('START');
      }
    });
  }

  handleTap(clientX, clientY) {
    // Check if clicked pause / mute buttons
    if (this.runtime.state === GameState.MENU || this.runtime.state === GameState.GAMEOVER) {
      this.runtime.startGame();
    } else if (this.runtime.state === GameState.PAUSED) {
      this.runtime.pauseGame();
    }
  }

  handleAction(action) {
    if (this.runtime.state === GameState.PLAYING) {
      if (action === 'LEFT') {
        this.runtime.player.moveLeft();
      } else if (action === 'RIGHT') {
        this.runtime.player.moveRight();
      } else if (action === 'UP') {
        this.runtime.player.jump();
      } else if (action === 'DOWN') {
        this.runtime.player.slide();
      } else if (action === 'PAUSE') {
        this.runtime.pauseGame();
      }
    } else if (this.runtime.state === GameState.MENU || this.runtime.state === GameState.GAMEOVER) {
      if (['UP', 'START'].includes(action)) {
        this.runtime.startGame();
      }
    } else if (this.runtime.state === GameState.PAUSED) {
      if (action === 'PAUSE') {
        this.runtime.pauseGame();
      }
    }
  }

  draw(ctx, runtime) {
    ctx.save();

    if (runtime.state === GameState.PLAYING || runtime.state === GameState.PAUSED) {
      this.drawHUD(ctx, runtime);
      if (runtime.state === GameState.PAUSED) {
        this.drawPauseOverlay(ctx);
      }
    } else if (runtime.state === GameState.MENU) {
      this.drawMenu(ctx, runtime);
    } else if (runtime.state === GameState.GAMEOVER) {
      this.drawGameOver(ctx, runtime);
    }

    ctx.restore();
  }

  drawHUD(ctx, runtime) {
    const p = runtime.player;
    ctx.save();

    // Top HUD Glass Card
    ctx.fillStyle = 'rgba(7, 11, 25, 0.75)';
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.35)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(40, 40, GAME_WIDTH - 80, 150, 28);
    ctx.fill();
    ctx.stroke();

    // 1. SCORE
    ctx.fillStyle = '#7a8ebb';
    ctx.font = 'bold 24px -apple-system, sans-serif';
    ctx.fillText('SCORE', 80, 85);

    ctx.fillStyle = '#ffffff';
    ctx.font = '900 52px -apple-system, sans-serif';
    ctx.fillText(Math.floor(runtime.score).toLocaleString(), 80, 145);

    // 2. COINS
    ctx.fillStyle = '#ffd700';
    ctx.beginPath();
    ctx.arc(GAME_WIDTH / 2 - 50, 105, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffb703';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = '900 44px -apple-system, sans-serif';
    ctx.fillText(runtime.coins.toString(), GAME_WIDTH / 2 - 15, 120);

    // 3. DISTANCE
    ctx.fillStyle = '#7a8ebb';
    ctx.font = 'bold 24px -apple-system, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('DISTANCE', GAME_WIDTH - 80, 85);

    ctx.fillStyle = '#00f0ff';
    ctx.font = '900 48px -apple-system, sans-serif';
    ctx.fillText(`${Math.floor(runtime.distance)}m`, GAME_WIDTH - 80, 145);
    ctx.textAlign = 'left';

    // 4. ACTIVE POWER-UP TIMERS
    let powerupSlotY = 220;
    const drawPowerupMeter = (name, icon, timeLeft, maxTime, color) => {
      const pct = Math.max(0, timeLeft / maxTime);

      ctx.fillStyle = 'rgba(7, 11, 25, 0.8)';
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(40, powerupSlotY, 260, 56, 16);
      ctx.fill();
      ctx.stroke();

      // Progress fill
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.35;
      ctx.beginPath();
      ctx.roundRect(44, powerupSlotY + 4, (252) * pct, 48, 12);
      ctx.fill();
      ctx.globalAlpha = 1.0;

      // Icon & Name
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 24px sans-serif';
      ctx.fillText(`${icon} ${name}`, 56, powerupSlotY + 36);

      // Remaining seconds
      ctx.font = '900 22px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(`${Math.ceil(timeLeft)}s`, 280, powerupSlotY + 36);
      ctx.textAlign = 'left';

      powerupSlotY += 70;
    };

    if (p) {
      if (p.isShielded) {
        drawPowerupMeter('SHIELD', '🛡️', 1, 1, '#00f0ff');
      }
      if (p.isMagnet) {
        drawPowerupMeter('MAGNET', '🧲', p.magnetTimer, 10.0, '#ff0077');
      }
      if (p.is2x) {
        drawPowerupMeter('2X SCORE', '⚡', p.multiplierTimer, 12.0, '#ffd700');
      }
      if (p.isBoosting) {
        drawPowerupMeter('JETPACK', '🚀', p.boostTimer, 7.0, '#ff5400');
      }
    }

    ctx.restore();
  }

  drawMenu(ctx, runtime) {
    const time = performance.now() * 0.002;
    const pulse = 1 + Math.sin(time * 3) * 0.05;

    ctx.save();

    // Dark tint on world
    ctx.fillStyle = 'rgba(3, 6, 17, 0.65)';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Title Card
    ctx.textAlign = 'center';

    // Subtitle
    ctx.fillStyle = '#00f0ff';
    ctx.font = 'bold 30px -apple-system, sans-serif';
    ctx.letterSpacing = '6px';
    ctx.fillText('CONSTRUCT 3 RUNTIME ENGINE', GAME_WIDTH / 2, 450);

    // Main Title Neon Glow
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 30;
    ctx.font = '900 96px -apple-system, sans-serif';
    ctx.fillText('CYBER', GAME_WIDTH / 2, 560);
    ctx.fillStyle = '#ff0077';
    ctx.shadowColor = '#ff0077';
    ctx.fillText('RUNNER', GAME_WIDTH / 2, 660);
    ctx.shadowBlur = 0;

    // Aspect Ratio & Mode Badge
    ctx.fillStyle = 'rgba(0, 240, 255, 0.15)';
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(GAME_WIDTH / 2 - 200, 700, 400, 46, 23);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#c0d0f5';
    ctx.font = 'bold 22px -apple-system, sans-serif';
    ctx.fillText('PORTRAIT MOBILE 1080 x 1920', GAME_WIDTH / 2, 732);

    // Tap to Play Pulsing Button
    ctx.save();
    ctx.translate(GAME_WIDTH / 2, 1150);
    ctx.scale(pulse, pulse);

    const grad = ctx.createLinearGradient(-260, 0, 260, 0);
    grad.addColorStop(0, '#00f0ff');
    grad.addColorStop(1, '#ff0077');

    ctx.fillStyle = grad;
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 25;
    ctx.beginPath();
    ctx.roundRect(-260, -55, 520, 110, 55);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#070b19';
    ctx.font = '900 48px -apple-system, sans-serif';
    ctx.fillText('TAP TO PLAY', 0, 16);
    ctx.restore();

    // High Score Box
    ctx.fillStyle = 'rgba(13, 20, 44, 0.85)';
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(GAME_WIDTH / 2 - 220, 1300, 440, 90, 24);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 24px -apple-system, sans-serif';
    ctx.fillText('👑 HIGH SCORE', GAME_WIDTH / 2, 1340);
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 36px -apple-system, sans-serif';
    ctx.fillText(runtime.highScore.toLocaleString(), GAME_WIDTH / 2, 1378);

    // Control Instructions Cards
    const cy = 1530;
    const cards = [
      { key: '◄ SWIPE ►', desc: 'CHANGE LANES' },
      { key: '▲ SWIPE', desc: 'JUMP HURDLE' },
      { key: '▼ SWIPE', desc: 'SLIDE LASER' }
    ];

    cards.forEach((c, idx) => {
      const cx = 200 + idx * 340;
      ctx.fillStyle = 'rgba(10, 15, 35, 0.75)';
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.25)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(cx - 145, cy, 290, 130, 20);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#00f0ff';
      ctx.font = '900 30px -apple-system, sans-serif';
      ctx.fillText(c.key, cx, cy + 50);

      ctx.fillStyle = '#90a0cb';
      ctx.font = 'bold 20px -apple-system, sans-serif';
      ctx.fillText(c.desc, cx, cy + 95);
    });

    ctx.restore();
  }

  drawPauseOverlay(ctx) {
    ctx.save();
    ctx.fillStyle = 'rgba(3, 6, 17, 0.8)';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#00f0ff';
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 20;
    ctx.font = '900 84px -apple-system, sans-serif';
    ctx.fillText('PAUSED', GAME_WIDTH / 2, GAME_HEIGHT / 2 - 40);
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px -apple-system, sans-serif';
    ctx.fillText('TAP SCREEN TO RESUME', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 50);
    ctx.restore();
  }

  drawGameOver(ctx, runtime) {
    const isNewHigh = (runtime.score >= runtime.highScore && runtime.score > 0);
    const time = performance.now() * 0.003;
    const pulse = 1 + Math.sin(time * 4) * 0.05;

    ctx.save();

    // Dark overlay with red tint
    ctx.fillStyle = 'rgba(10, 4, 15, 0.88)';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    ctx.textAlign = 'center';

    // Game Over Title
    ctx.fillStyle = '#ff0077';
    ctx.shadowColor = '#ff0077';
    ctx.shadowBlur = 35;
    ctx.font = '900 96px -apple-system, sans-serif';
    ctx.fillText('GAME OVER', GAME_WIDTH / 2, 480);
    ctx.shadowBlur = 0;

    if (isNewHigh) {
      ctx.fillStyle = '#ffd700';
      ctx.font = '900 36px -apple-system, sans-serif';
      ctx.fillText('★ NEW HIGH SCORE! ★', GAME_WIDTH / 2, 560);
    }

    // Stats Card Container
    ctx.fillStyle = 'rgba(13, 20, 44, 0.9)';
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(100, 620, GAME_WIDTH - 200, 520, 32);
    ctx.fill();
    ctx.stroke();

    // Final Score
    ctx.fillStyle = '#7a8ebb';
    ctx.font = 'bold 28px -apple-system, sans-serif';
    ctx.fillText('FINAL SCORE', GAME_WIDTH / 2, 700);

    ctx.fillStyle = '#ffffff';
    ctx.font = '900 84px -apple-system, sans-serif';
    ctx.fillText(Math.floor(runtime.score).toLocaleString(), GAME_WIDTH / 2, 790);

    // Distance & Coins Row
    const statY = 900;
    // Left: Distance
    ctx.fillStyle = '#7a8ebb';
    ctx.font = 'bold 24px -apple-system, sans-serif';
    ctx.fillText('DISTANCE', 280, statY);
    ctx.fillStyle = '#00f0ff';
    ctx.font = '900 52px -apple-system, sans-serif';
    ctx.fillText(`${Math.floor(runtime.distance)}m`, 280, statY + 60);

    // Right: Coins
    ctx.fillStyle = '#7a8ebb';
    ctx.font = 'bold 24px -apple-system, sans-serif';
    ctx.fillText('COINS', GAME_WIDTH - 280, statY);
    ctx.fillStyle = '#ffd700';
    ctx.font = '900 52px -apple-system, sans-serif';
    ctx.fillText(runtime.coins.toString(), GAME_WIDTH - 280, statY + 60);

    // Best Score Record
    ctx.fillStyle = '#a0b0d0';
    ctx.font = 'bold 26px -apple-system, sans-serif';
    ctx.fillText(`BEST: ${runtime.highScore.toLocaleString()}`, GAME_WIDTH / 2, 1080);

    // Replay Button
    ctx.save();
    ctx.translate(GAME_WIDTH / 2, 1260);
    ctx.scale(pulse, pulse);

    const grad = ctx.createLinearGradient(-260, 0, 260, 0);
    grad.addColorStop(0, '#00f0ff');
    grad.addColorStop(1, '#ff0077');

    ctx.fillStyle = grad;
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 30;
    ctx.beginPath();
    ctx.roundRect(-260, -55, 520, 110, 55);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#070b19';
    ctx.font = '900 46px -apple-system, sans-serif';
    ctx.fillText('PLAY AGAIN', 0, 16);
    ctx.restore();

    ctx.restore();
  }
}

window.UIController = UIController;

