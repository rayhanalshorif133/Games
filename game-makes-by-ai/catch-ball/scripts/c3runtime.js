/**
 * Construct 3 Runtime Emulation & Core Engine
 * Manages 1080x1920 internal virtual resolution, letterboxing, delta-time, inputs & screen trauma.
 */
class C3Runtime {
  constructor() {
    this.V_WIDTH = 1080;
    this.V_HEIGHT = 1920;

    this.canvas = document.getElementById('c2canvas');
    this.ctx = this.canvas.getContext('2d');
    this.wrap = document.getElementById('c3-canvas-wrap');

    // Display scale & bounding rect
    this.scale = 1;
    this.rect = null;
    this.dpr = window.devicePixelRatio || 1;

    // Timing
    this.lastTime = performance.now();
    this.dt = 0.016;
    this.gameTime = 0;
    this.fps = 60;
    this.frameCount = 0;
    this.fpsTimer = 0;

    // Camera Trauma (Screen Shake)
    this.trauma = 0;
    this.shakeX = 0;
    this.shakeY = 0;
    this.shakeAngle = 0;

    // Unified Input State
    this.input = {
      // Virtual Stick / Steering Position (in 1080x1920 coords)
      targetX: this.V_WIDTH / 2,
      targetY: this.V_HEIGHT * 0.75,
      isSteering: false,

      // Axes (-1 to 1)
      axisX: 0,
      axisY: 0,

      // Actions
      fireCannon: false,
      launchMissile: false,
      deployFlares: false,
      boostAfterburner: false,

      // Raw keys
      keys: {}
    };

    this.isTouchDevice = false;
    this._initCanvas();
    this._initEvents();
  }

  _initCanvas() {
    // Set internal backing canvas to full 1080x1920
    this.canvas.width = this.V_WIDTH;
    this.canvas.height = this.V_HEIGHT;
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    this.rect = this.canvas.getBoundingClientRect();
    this.scale = this.rect.width / this.V_WIDTH;
  }

  screenToVirtual(screenX, screenY) {
    if (!this.rect) this.resize();
    const x = (screenX - this.rect.left) * (this.V_WIDTH / this.rect.width);
    const y = (screenY - this.rect.top) * (this.V_HEIGHT / this.rect.height);
    return {
      x: Math.max(0, Math.min(this.V_WIDTH, x)),
      y: Math.max(0, Math.min(this.V_HEIGHT, y))
    };
  }

  _initEvents() {
    // Keyboard inputs
    window.addEventListener('keydown', (e) => {
      this.input.keys[e.code] = true;
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
      }
      this._updateKeyboardActions();
    });

    window.addEventListener('keyup', (e) => {
      this.input.keys[e.code] = false;
      this._updateKeyboardActions();
    });

    // Mouse inputs
    this.canvas.addEventListener('mousemove', (e) => {
      const v = this.screenToVirtual(e.clientX, e.clientY);
      this.input.targetX = v.x;
      this.input.targetY = v.y;
      this.input.isSteering = true;
    });

    this.canvas.addEventListener('mousedown', (e) => {
      if (e.button === 0) {
        this.input.fireCannon = true;
      } else if (e.button === 2) {
        this.input.launchMissile = true;
      }
      window.AudioEngine.init();
      window.AudioEngine.resume();
    });

    window.addEventListener('mouseup', (e) => {
      if (e.button === 0) {
        this.input.fireCannon = false;
      }
    });

    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    // Touch inputs
    const touchOverlay = document.querySelector('.touch-overlay');
    window.addEventListener('touchstart', () => {
      this.isTouchDevice = true;
      if (touchOverlay) touchOverlay.style.display = 'block';
      window.AudioEngine.init();
      window.AudioEngine.resume();
    }, { once: true });

    // Canvas touch steering
    this.canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        const v = this.screenToVirtual(touch.clientX, touch.clientY);
        this.input.targetX = v.x;
        this.input.targetY = v.y;
        this.input.isSteering = true;
      }
    }, { passive: false });

    this.canvas.addEventListener('touchstart', (e) => {
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        const v = this.screenToVirtual(touch.clientX, touch.clientY);
        this.input.targetX = v.x;
        this.input.targetY = v.y;
        this.input.isSteering = true;
      }
    }, { passive: false });

    // Virtual Buttons Setup
    this._setupTouchButton('.touch-btn-fire', (down) => { this.input.fireCannon = down; });
    this._setupTouchButton('.touch-btn-missile', (down) => { if (down) this.input.launchMissile = true; });
    this._setupTouchButton('.touch-btn-flare', (down) => { if (down) this.input.deployFlares = true; });
    this._setupTouchButton('.touch-btn-boost', (down) => { this.input.boostAfterburner = down; });
  }

  _setupTouchButton(selector, callback) {
    const btn = document.querySelector(selector);
    if (!btn) return;

    btn.addEventListener('touchstart', (e) => {
      e.preventDefault();
      callback(true);
    }, { passive: false });

    btn.addEventListener('touchend', (e) => {
      e.preventDefault();
      callback(false);
    }, { passive: false });

    btn.addEventListener('touchcancel', (e) => {
      e.preventDefault();
      callback(false);
    }, { passive: false });

    btn.addEventListener('mousedown', (e) => {
      e.preventDefault();
      callback(true);
    });

    btn.addEventListener('mouseup', (e) => {
      e.preventDefault();
      callback(false);
    });
  }

  _updateKeyboardActions() {
    const k = this.input.keys;

    // Movement Axis
    let ax = 0;
    let ay = 0;
    if (k['KeyA'] || k['ArrowLeft']) ax -= 1;
    if (k['KeyD'] || k['ArrowRight']) ax += 1;
    if (k['KeyW'] || k['ArrowUp']) ay -= 1;
    if (k['KeyS'] || k['ArrowDown']) ay += 1;

    this.input.axisX = ax;
    this.input.axisY = ay;

    // Actions
    if (k['Space']) this.input.fireCannon = true;
    else if (!this.input.mouseFire) this.input.fireCannon = false;

    if (k['KeyF'] || k['KeyX']) {
      this.input.launchMissile = true;
      k['KeyF'] = false; // Trigger once per press
      k['KeyX'] = false;
    }

    if (k['KeyC'] || k['KeyE']) {
      this.input.deployFlares = true;
      k['KeyC'] = false;
      k['KeyE'] = false;
    }

    this.input.boostAfterburner = !!(k['ShiftLeft'] || k['ShiftRight'] || k['KeyW']);
  }

  /**
   * Add screen shake trauma (intensity 0.0 to 1.0)
   */
  addTrauma(amount) {
    this.trauma = Math.min(1.0, this.trauma + amount);
  }

  updateTrauma(dt) {
    if (this.trauma > 0) {
      // Nonlinear shake: trauma squared or cubed for realistic shock decay
      const shakePower = this.trauma * this.trauma;
      const maxOffset = 28; // pixels
      const maxAngle = 0.04; // radians

      this.shakeX = (Math.random() * 2 - 1) * maxOffset * shakePower;
      this.shakeY = (Math.random() * 2 - 1) * maxOffset * shakePower;
      this.shakeAngle = (Math.random() * 2 - 1) * maxAngle * shakePower;

      this.trauma = Math.max(0, this.trauma - dt * 1.5);
    } else {
      this.shakeX = 0;
      this.shakeY = 0;
      this.shakeAngle = 0;
    }
  }

  tick() {
    const now = performance.now();
    const rawDt = (now - this.lastTime) / 1000;
    this.lastTime = now;

    // Clamp dt to avoid huge steps during tab switch
    this.dt = Math.min(Math.max(rawDt, 0.001), 0.05);
    this.gameTime += this.dt;

    this.updateTrauma(this.dt);

    // FPS calculation
    this.frameCount++;
    this.fpsTimer += this.dt;
    if (this.fpsTimer >= 0.5) {
      this.fps = Math.round(this.frameCount / this.fpsTimer);
      this.frameCount = 0;
      this.fpsTimer = 0;
    }
  }

  applyCameraTransform() {
    this.ctx.save();
    if (this.trauma > 0) {
      this.ctx.translate(this.V_WIDTH / 2, this.V_HEIGHT / 2);
      this.ctx.rotate(this.shakeAngle);
      this.ctx.translate(-this.V_WIDTH / 2 + this.shakeX, -this.V_HEIGHT / 2 + this.shakeY);
    }
  }

  restoreCameraTransform() {
    this.ctx.restore();
  }
}

// Global runtime instance
window.Runtime = new C3Runtime();

