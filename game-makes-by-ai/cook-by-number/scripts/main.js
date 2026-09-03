/**
 * Cook by Number - Main Application Entry Point
 * Handles pointer events (touch & mouse) mapped to 1080x1920 canvas resolution,
 * dragging gestures for modifier boxes, wire pulling, and lifecycle startup.
 */
window.addEventListener('DOMContentLoaded', async () => {
  const canvas = document.getElementById('c3-canvas');

  // Try loading levels from data.json, fallback to levelData.js
  try {
    const res = await fetch('data.json');
    if (res.ok) {
      const data = await res.json();
      if (data && data.levels && data.levels.length > 0) {
        window.GAME_LEVELS = data.levels;
      }
    }
  } catch (err) {
    console.info('Using embedded GAME_LEVELS configuration.');
  }

  // Initialize Core Game Engine
  const game = new GameEngine();
  window.game = game;
  game.init();

  /**
   * Convert Screen / Touch Pointer coordinates to Canvas (1080 x 1920) coordinate space
   */
  function getCanvasCoords(event) {
    const rect = canvas.getBoundingClientRect();
    const clientX = event.clientX !== undefined ? event.clientX : (event.touches && event.touches[0] ? event.touches[0].clientX : 0);
    const clientY = event.clientY !== undefined ? event.clientY : (event.touches && event.touches[0] ? event.touches[0].clientY : 0);

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  }

  // Active interaction tracking
  let isPointerDown = false;

  // -------------------------------------------------------------------------
  // POINTER DOWN: Determine whether clicking a Port, Box, or Wire
  // -------------------------------------------------------------------------
  canvas.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    canvas.setPointerCapture(e.pointerId);
    isPointerDown = true;

    // Wake audio context on first user gesture
    if (window.Sound) {
      window.Sound.init();
    }

    const { x, y } = getCanvasCoords(e);

    // If ball is currently rolling, ignore interaction
    if (game.isSimulating) {
      return;
    }

    // 1. Check if clicking directly on a port (or near it)
    const port = game.wireManager.findPortAt(x, y);
    if (port) {
      if (port.type === 'output') {
        // Start dragging a wire
        game.wireManager.startDraft(port, x, y);
        return;
      } else if (port.type === 'input') {
        // Clicked an input port: if there's an incoming wire, disconnect it
        if (game.wireManager.disconnectTo(port.boxId)) {
          if (window.Sound) window.Sound.playUnplug();
        }
        return;
      }
    }

    // 2. Check if touching a draggable modifier box
    for (let i = game.modifierBoxes.length - 1; i >= 0; i--) {
      const box = game.modifierBoxes[i];
      const halfW = box.w / 2;
      const halfH = box.h / 2;

      if (
        x >= box.x - halfW &&
        x <= box.x + halfW &&
        y >= box.y - halfH &&
        y <= box.y + halfH
      ) {
        // Start dragging this modifier box
        game.dragBox = box;
        game.dragOffsetX = x - box.x;
        game.dragOffsetY = y - box.y;

        if (window.Sound) window.Sound.playClick();
        return;
      }
    }

    // 3. Check if touching an existing wire to unplug / cut it
    const cutSuccess = game.wireManager.tryCutWireAt(x, y);
    if (cutSuccess) {
      game.showToast('Cable disconnected', 'info');
      return;
    }
  });

  // -------------------------------------------------------------------------
  // POINTER MOVE: Update wire drafting or box dragging
  // -------------------------------------------------------------------------
  canvas.addEventListener('pointermove', (e) => {
    e.preventDefault();
    if (!isPointerDown) return;

    const { x, y } = getCanvasCoords(e);

    // 1. If currently dragging a wire draft
    if (game.wireManager.activeDraft) {
      game.wireManager.updateDraft(x, y);
      return;
    }

    // 2. If currently dragging a modifier box
    if (game.dragBox) {
      const box = game.dragBox;
      let targetX = x - game.dragOffsetX;
      let targetY = y - game.dragOffsetY;

      // Constrain within playable board limits (between top dispenser & bottom computer)
      const halfW = box.w / 2;
      const halfH = box.h / 2;

      const minX = halfW + 35;
      const maxX = canvas.width - halfW - 35;
      const minY = 520 + halfH;
      const maxY = 1520 - halfH;

      box.x = Math.max(minX, Math.min(maxX, targetX));
      box.y = Math.max(minY, Math.min(maxY, targetY));
      return;
    }
  });

  // -------------------------------------------------------------------------
  // POINTER UP: Finalize wire connection or release dragged box
  // -------------------------------------------------------------------------
  const onPointerUp = (e) => {
    if (!isPointerDown) return;
    isPointerDown = false;

    try {
      canvas.releasePointerCapture(e.pointerId);
    } catch (err) {}

    // 1. Finish wire draft if active
    if (game.wireManager.activeDraft) {
      const connected = game.wireManager.endDraft();
      if (connected) {
        game.showToast('Cable connected! 🔌', 'info');
      }
    }

    // 2. Release box dragging
    if (game.dragBox) {
      game.dragBox = null;
    }
  };

  canvas.addEventListener('pointerup', onPointerUp);
  canvas.addEventListener('pointercancel', onPointerUp);

  // Prevent default scrolling and gesture zooms on mobile
  document.addEventListener('gesturestart', (e) => e.preventDefault());
  document.addEventListener('touchmove', (e) => {
    if (e.target === canvas) e.preventDefault();
  }, { passive: false });
});

