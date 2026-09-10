/**
 * input.js - Unified input controller supporting:
 * 1. 8-Directional Touch Swipes
 * 2. On-screen 4-Arrow Touch Controls (with diagonal chord detection)
 * 3. Desktop Keyboard (Arrow keys & WASD with diagonal chord buffering)
 */
export class InputManager {
  constructor(canvas, onJumpCallback) {
    this.canvas = canvas;
    this.onJump = onJumpCallback;
    this.enabled = true;

    // Swipe tracking
    this.touchStartX = 0;
    this.touchStartY = 0;
    this.touchStartTime = 0;
    this.isSwiping = false;
    this.minSwipeDist = 28; // px

    // Button state for multi-touch chord detection
    this.activeButtons = {
      up: false,
      down: false,
      left: false,
      right: false
    };

    // Keyboard buffer
    this.keyDirX = 0;
    this.keyDirY = 0;
    this.keyBufferTimer = null;
    this.keyBufferWindow = 55; // ms

    // First time swipe callback
    this.onFirstAction = null;

    this.bindEvents();
  }

  bindEvents() {
    // 1. Touch Swipe on canvas / container
    window.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
    window.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
    window.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: false });

    // Mouse drag emulation for desktop swipe testing
    let isMouseDown = false;
    window.addEventListener('mousedown', (e) => {
      // ignore if clicking on UI buttons
      if (e.target.closest('.interactive-btn') || e.target.closest('.dpad-btn')) return;
      isMouseDown = true;
      this.touchStartX = e.clientX;
      this.touchStartY = e.clientY;
      this.touchStartTime = performance.now();
    });

    window.addEventListener('mouseup', (e) => {
      if (!isMouseDown) return;
      isMouseDown = false;
      const dx = e.clientX - this.touchStartX;
      const dy = e.clientY - this.touchStartY;
      const dist = Math.hypot(dx, dy);
      if (dist >= this.minSwipeDist) {
        this.emitSwipeDirection(dx, dy);
      }
    });

    // 2. Desktop Keyboard
    window.addEventListener('keydown', (e) => this.handleKeyDown(e));
  }

  handleTouchStart(e) {
    // If touched an on-screen D-pad button, let the button handlers manage it
    if (e.target.closest('.dpad-btn') || e.target.closest('.interactive-btn')) return;

    if (e.touches.length > 0) {
      const touch = e.touches[0];
      this.touchStartX = touch.clientX;
      this.touchStartY = touch.clientY;
      this.touchStartTime = performance.now();
      this.isSwiping = true;
    }
  }

  handleTouchMove(e) {
    if (!this.isSwiping) return;
    // prevent default scroll on canvas
    if (e.cancelable) e.preventDefault();
  }

  handleTouchEnd(e) {
    if (!this.isSwiping) return;
    this.isSwiping = false;

    if (e.changedTouches.length > 0) {
      const touch = e.changedTouches[0];
      const dx = touch.clientX - this.touchStartX;
      const dy = touch.clientY - this.touchStartY;
      const dist = Math.hypot(dx, dy);

      if (dist >= this.minSwipeDist) {
        this.emitSwipeDirection(dx, dy);
      }
    }
  }

  /**
   * Translates swipe vector (dx, dy) into 8 discrete directions:
   * (0, -1), (1, -1), (1, 0), (1, 1), (0, 1), (-1, 1), (-1, 0), (-1, -1)
   */
  emitSwipeDirection(dx, dy) {
    if (!this.enabled) return;

    // Angle in radians (-PI to PI)
    const angle = Math.atan2(dy, dx);
    const deg = (angle * 180) / Math.PI;

    let dirX = 0;
    let dirY = 0;

    // 8 directional sectors (45 degrees each)
    if (deg >= -22.5 && deg < 22.5) {
      // Right
      dirX = 1;
      dirY = 0;
    } else if (deg >= 22.5 && deg < 67.5) {
      // Down-Right
      dirX = 1;
      dirY = 1;
    } else if (deg >= 67.5 && deg < 112.5) {
      // Down
      dirX = 0;
      dirY = 1;
    } else if (deg >= 112.5 && deg < 157.5) {
      // Down-Left
      dirX = -1;
      dirY = 1;
    } else if (deg >= 157.5 || deg < -157.5) {
      // Left
      dirX = -1;
      dirY = 0;
    } else if (deg >= -157.5 && deg < -112.5) {
      // Up-Left
      dirX = -1;
      dirY = -1;
    } else if (deg >= -112.5 && deg < -67.5) {
      // Up
      dirX = 0;
      dirY = -1;
    } else if (deg >= -67.5 && deg < -22.5) {
      // Up-Right
      dirX = 1;
      dirY = -1;
    }

    this.triggerAction(dirX, dirY);
  }

  /**
   * Bind on-screen D-Pad buttons
   */
  bindDpadButtons(elements) {
    const { up, down, left, right } = elements;
    const bindBtn = (el, dirName) => {
      if (!el) return;

      const onPress = (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.activeButtons[dirName] = true;
        this.queueButtonCheck();
      };

      const onRelease = (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.activeButtons[dirName] = false;
      };

      el.addEventListener('touchstart', onPress, { passive: false });
      el.addEventListener('touchend', onRelease, { passive: false });
      el.addEventListener('mousedown', onPress);
      el.addEventListener('mouseup', onRelease);
    };

    bindBtn(up, 'up');
    bindBtn(down, 'down');
    bindBtn(left, 'left');
    bindBtn(right, 'right');
  }

  queueButtonCheck() {
    if (this.buttonTimer) return;
    this.buttonTimer = setTimeout(() => {
      this.buttonTimer = null;
      let dirX = 0;
      let dirY = 0;

      if (this.activeButtons.left) dirX -= 1;
      if (this.activeButtons.right) dirX += 1;
      if (this.activeButtons.up) dirY -= 1;
      if (this.activeButtons.down) dirY += 1;

      // Reset state
      this.activeButtons.up = false;
      this.activeButtons.down = false;
      this.activeButtons.left = false;
      this.activeButtons.right = false;

      if (dirX !== 0 || dirY !== 0) {
        this.triggerAction(dirX, dirY);
      }
    }, 45);
  }

  /**
   * Keyboard handling with short diagonal chord window
   */
  handleKeyDown(e) {
    if (!this.enabled) return;

    let recognized = false;
    let dx = 0;
    let dy = 0;

    switch (e.code) {
      case 'ArrowUp':
      case 'KeyW':
        dy = -1;
        recognized = true;
        break;
      case 'ArrowDown':
      case 'KeyS':
        dy = 1;
        recognized = true;
        break;
      case 'ArrowLeft':
      case 'KeyA':
        dx = -1;
        recognized = true;
        break;
      case 'ArrowRight':
      case 'KeyD':
        dx = 1;
        recognized = true;
        break;
      default:
        break;
    }

    if (!recognized) return;
    e.preventDefault();

    if (dx !== 0) this.keyDirX = Math.max(-1, Math.min(1, this.keyDirX + dx));
    if (dy !== 0) this.keyDirY = Math.max(-1, Math.min(1, this.keyDirY + dy));

    if (!this.keyBufferTimer) {
      this.keyBufferTimer = setTimeout(() => {
        const emitX = this.keyDirX;
        const emitY = this.keyDirY;
        this.keyDirX = 0;
        this.keyDirY = 0;
        this.keyBufferTimer = null;

        if (emitX !== 0 || emitY !== 0) {
          this.triggerAction(emitX, emitY);
        }
      }, this.keyBufferWindow);
    }
  }

  triggerAction(dirX, dirY) {
    if (!this.enabled) return;
    if (this.onFirstAction) {
      this.onFirstAction();
      this.onFirstAction = null;
    }
    if (this.onJump) {
      this.onJump(dirX, dirY);
    }
  }

  setEnabled(val) {
    this.enabled = val;
  }
}

