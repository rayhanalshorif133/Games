/**
 * main.js
 * 
 * Game entrypoint and master coordinator for Road Rush Infinite.
 * Orchestrates modules, manages 1080x1920 portrait canvas loop,
 * and handles user input events.
 */

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const GAME_WIDTH = 1080;
const GAME_HEIGHT = 1920;

// === KEYBOARD & TOUCH INPUT ===
const keys = {};

window.addEventListener('keydown', e => {
  keys[e.code] = true;

  // Attack
  if (e.code === 'KeyF' || e.code === 'KeyJ' || e.code === 'KeyZ') {
    e.preventDefault();
    if (window.player) window.player.performAttack();
  }

  // Brake
  if (e.code === 'Space' || e.code === 'KeyS' || e.code === 'ArrowDown') {
    if (window.gameManager && window.gameManager.currentState === GameState.PLAYING) {
      if (window.player && !window.player.isBrakeOverheated) {
        window.player.isBraking = true;
        if (window.gameHUD) window.gameHUD.updateBrakeUI(true);
      }
    }
  }
});

window.addEventListener('keyup', e => {
  keys[e.code] = false;
  if (e.code === 'Space' || e.code === 'KeyS' || e.code === 'ArrowDown') {
    if (window.player) {
      window.player.isBraking = false;
      if (window.gameHUD) window.gameHUD.updateBrakeUI(false);
    }
  }
});

function handleKeyboardInput(dt) {
  if (!window.player) return;
  const steerSpeed = 1100 * dt;

  if (keys['KeyA'] || keys['ArrowLeft']) {
    window.player.targetX -= steerSpeed;
  }
  if (keys['KeyD'] || keys['ArrowRight']) {
    window.player.targetX += steerSpeed;
  }
  if (keys['KeyW'] || keys['ArrowUp']) {
    window.player.targetY -= steerSpeed * 0.5;
  }
  if (keys['KeyS'] || keys['ArrowDown']) {
    window.player.targetY += steerSpeed * 0.5;
  }
}

// === TOUCH & POINTER DRAG STEERING ===
let isDragging = false;
let dragStartX = 0;
let playerStartX = 0;

function getCanvasCoords(e) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const clientX = e.touches ? e.touches[0].clientX : e.clientX;
  const clientY = e.touches ? e.touches[0].clientY : e.clientY;
  return {
    x: (clientX - rect.left) * scaleX,
    y: (clientY - rect.top) * scaleY
  };
}

canvas.addEventListener('pointerdown', e => {
  isDragging = true;
  const coords = getCanvasCoords(e);
  dragStartX = coords.x;
  playerStartX = window.player ? window.player.targetX : 540;
});

window.addEventListener('pointermove', e => {
  if (!isDragging || !window.player) return;
  const coords = getCanvasCoords(e);
  const deltaX = coords.x - dragStartX;
  window.player.targetX = playerStartX + deltaX;
});

window.addEventListener('pointerup', () => {
  isDragging = false;
});

// === MASTER START FUNCTION ===
window.startGame = function() {
  if (window.gameManager) window.gameManager.start();
  if (window.roadSpawner) window.roadSpawner.init();
  if (window.player) window.player.init();
  if (window.combatSystem) window.combatSystem.init();
  if (window.trafficController) window.trafficController.init();
};

// === MASTER GAME LOOP ===
let lastTime = performance.now();

function masterLoop(now) {
  const dt = Math.min((now - lastTime) / 1000, 0.1);
  lastTime = now;

  if (window.gameManager && window.gameManager.currentState === GameState.PLAYING) {
    handleKeyboardInput(dt);
    window.gameManager.update(dt);
    if (window.roadSpawner) window.roadSpawner.update(dt);
    if (window.player) window.player.update(dt);
    if (window.combatSystem) window.combatSystem.update(dt);
    if (window.trafficController) window.trafficController.update(dt);
    if (window.gameHUD) window.gameHUD.update();
  }

  // Camera Shake Offset on Collision
  ctx.save();
  if (window.trafficController && window.trafficController.shakeTimer > 0) {
    const shakeMag = 18;
    const sx = (Math.random() - 0.5) * shakeMag;
    const sy = (Math.random() - 0.5) * shakeMag;
    ctx.translate(sx, sy);
  }

  // Render Pipeline
  ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  if (window.roadSpawner) window.roadSpawner.render(ctx);
  if (window.trafficController) window.trafficController.render(ctx);
  if (window.combatSystem) window.combatSystem.render(ctx);
  if (window.player) window.player.render(ctx);

  ctx.restore();

  requestAnimationFrame(masterLoop);
}

// Start rendering loop immediately
requestAnimationFrame(masterLoop);

// Preload all sprites
if (window.assets) {
  window.assets.preload(() => {
    console.log('[Road Rush Infinite] All game assets preloaded successfully.');
  });
}
