/**
 * Main Game Bootstrap & Input Controller for Bubble Shooter 2D
 * High-DPI canvas setup, coordinate translation (1080x1920), and game lifecycle loop.
 */
(function() {
  'use strict';

  let canvas, ctx;
  let config, grid, shooter, renderer, game;
  let lastTime = 0;
  let isPointerDown = false;

  async function init() {
    canvas = document.getElementById('c3-canvas');
    if (!canvas) return;

    // Load data.json configuration
    try {
      const resp = await fetch('data.json');
      config = await resp.json();
    } catch (e) {
      console.warn('Could not load data.json, using fallback configuration:', e);
      config = {
        project: { canvasWidth: 1080, canvasHeight: 1920 },
        gameplay: {
          initialLives: 5,
          maxLives: 5,
          bubbleRadius: 48,
          gridRows: 14,
          gridCols: 11,
          topOffset: 240,
          bottomDangerY: 1540,
          shooterY: 1700,
          shooterX: 540,
          bubbleSpeed: 2600,
          missesBeforeCeilingDrop: 5,
          comboThresholdForHeart: 3,
          colors: [
            { id: "ruby", primary: "#ff2d55", shadow: "#a50026", glow: "rgba(255, 45, 85, 0.6)" },
            { id: "sapphire", primary: "#007aff", shadow: "#003b80", glow: "rgba(0, 122, 255, 0.6)" },
            { id: "emerald", primary: "#34c759", shadow: "#176e30", glow: "rgba(52, 199, 89, 0.6)" },
            { id: "topaz", primary: "#ffcc00", shadow: "#997a00", glow: "rgba(255, 204, 0, 0.6)" },
            { id: "amethyst", primary: "#af52de", shadow: "#581b7e", glow: "rgba(175, 82, 222, 0.6)" },
            { id: "cyan", primary: "#00d2d3", shadow: "#01a3a4", glow: "rgba(0, 210, 211, 0.6)" }
          ],
          specialBubbles: { bombChance: 0.05, rainbowChance: 0.04 },
          scoring: { popPerBubble: 15, dropPerBubble: 40, heartRecoveryBonus: 200 }
        }
      };
    }

    // Set internal resolution (fixed 1080x1920)
    canvas.width = config.project.canvasWidth || 1080;
    canvas.height = config.project.canvasHeight || 1920;

    // Instantiate game subsystems
    grid = new window.BubbleGrid(config.gameplay);
    shooter = new window.Shooter(config.gameplay, grid);
    renderer = new window.Renderer(canvas, config.gameplay);
    game = new window.Game(config, grid, shooter, renderer);

    // Bind Controls
    setupInputListeners();
    setupUIListeners();

    // Start main game loop
    lastTime = performance.now();
    requestAnimationFrame(gameLoop);
  }

  /**
   * Translates client pointer coordinates into internal 1080x1920 canvas coordinates
   */
  function getCanvasCoords(e) {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX !== undefined ? e.clientX : (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
    const clientY = e.clientY !== undefined ? e.clientY : (e.touches && e.touches[0] ? e.touches[0].clientY : 0);

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  }

  function setupInputListeners() {
    const wrapper = document.getElementById('c3-canvas-wrapper');
    if (!wrapper) return;

    function handlePointerDown(e) {
      if (game.state !== 'PLAYING') return;
      // Prevent aiming if touching HUD buttons or swap box
      if (e.target.closest('.hud-header') || e.target.closest('.shooter-hud') || e.target.closest('.modal-overlay')) {
        return;
      }

      if (window.soundEngine) window.soundEngine.init();

      isPointerDown = true;
      shooter.isAiming = true;
      const coords = getCanvasCoords(e);
      shooter.setAimTarget(coords.x, coords.y);
    }

    function handlePointerMove(e) {
      if (!isPointerDown || game.state !== 'PLAYING') return;
      shooter.isAiming = true;
      const coords = getCanvasCoords(e);
      shooter.setAimTarget(coords.x, coords.y);
    }

    function handlePointerUp(e) {
      if (!isPointerDown) return;
      isPointerDown = false;
      shooter.isAiming = false;

      if (game.state !== 'PLAYING') return;
      // Only shoot if aiming upwards
      if (shooter.angle < 0) {
        shooter.shoot();
        game.updateNextBubbleDisplay();
      }
    }

    // Touch & Pointer Events
    wrapper.addEventListener('pointerdown', handlePointerDown, { passive: false });
    window.addEventListener('pointermove', handlePointerMove, { passive: false });
    window.addEventListener('pointerup', handlePointerUp, { passive: false });
    window.addEventListener('pointercancel', () => { 
      isPointerDown = false;
      if (shooter) shooter.isAiming = false;
    });

    // Keyboard controls (Left/Right arrow to aim, Space/Up to shoot)
    window.addEventListener('keydown', (e) => {
      if (game.state !== 'PLAYING') return;
      if (window.soundEngine) window.soundEngine.init();

      if (e.key === 'ArrowLeft') {
        shooter.isAiming = true;
        shooter.angle = Math.max(shooter.minAngle, shooter.angle - 0.05);
        shooter.calculateTrajectory();
      } else if (e.key === 'ArrowRight') {
        shooter.isAiming = true;
        shooter.angle = Math.min(shooter.maxAngle, shooter.angle + 0.05);
        shooter.calculateTrajectory();
      } else if (e.key === ' ' || e.key === 'ArrowUp') {
        e.preventDefault();
        shooter.isAiming = false;
        shooter.shoot();
        game.updateNextBubbleDisplay();
      } else if (e.key === 's' || e.key === 'S') {
        shooter.swapBubbles();
        game.updateNextBubbleDisplay();
      }
    });

    window.addEventListener('keyup', (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        if (shooter) shooter.isAiming = false;
      }
    });
  }

  function setupUIListeners() {
    // Start Game
    const btnStart = document.getElementById('btn-start-play');
    if (btnStart) {
      btnStart.addEventListener('click', () => {
        if (window.soundEngine) window.soundEngine.init();
        game.startGame();
      });
    }

    // Play Again (from Game Over)
    const btnPlayAgain = document.getElementById('btn-play-again');
    if (btnPlayAgain) {
      btnPlayAgain.addEventListener('click', () => {
        if (window.soundEngine) window.soundEngine.init();
        game.startGame();
      });
    }

    // Next Level (from Win)
    const btnNextLevel = document.getElementById('btn-next-level');
    if (btnNextLevel) {
      btnNextLevel.addEventListener('click', () => {
        if (window.soundEngine) window.soundEngine.init();
        game.nextStage();
      });
    }

    // Bubble Swap Button & Slot
    const btnSwap = document.getElementById('btn-swap');
    if (btnSwap) {
      btnSwap.addEventListener('click', (e) => {
        e.stopPropagation();
        shooter.swapBubbles();
        game.updateNextBubbleDisplay();
      });
    }

    const swapBox = document.getElementById('swap-box');
    if (swapBox) {
      swapBox.addEventListener('click', (e) => {
        e.stopPropagation();
        shooter.swapBubbles();
        game.updateNextBubbleDisplay();
      });
    }

    // Sound Toggle
    const btnSound = document.getElementById('btn-sound');
    if (btnSound) {
      btnSound.addEventListener('click', (e) => {
        e.stopPropagation();
        if (window.soundEngine) {
          window.soundEngine.init();
          const muted = window.soundEngine.toggleMute();
          btnSound.innerText = muted ? '🔇' : '🔊';
        }
      });
    }

    // Pause & Resume
    const btnPause = document.getElementById('btn-pause');
    if (btnPause) {
      btnPause.addEventListener('click', (e) => {
        e.stopPropagation();
        game.pauseGame();
      });
    }

    const btnResume = document.getElementById('btn-resume');
    if (btnResume) {
      btnResume.addEventListener('click', () => {
        game.resumeGame();
      });
    }

    const btnRestartFromPause = document.getElementById('btn-restart-from-pause');
    if (btnRestartFromPause) {
      btnRestartFromPause.addEventListener('click', () => {
        game.startGame();
      });
    }
  }

  function gameLoop(now) {
    const dt = Math.min((now - lastTime) / 1000, 0.05); // Cap delta time to 50ms
    lastTime = now;

    // Subsystem updates
    game.update(dt);
    renderer.update(dt);

    // Render frame
    renderer.render(grid, shooter, game);

    requestAnimationFrame(gameLoop);
  }

  // Bootstrap when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

