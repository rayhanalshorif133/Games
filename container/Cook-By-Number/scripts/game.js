/**
 * Cook by Number - Core Game Engine
 * Manages simulation state machine, path traversal, ball physics along Bezier curves,
 * drag-and-drop mechanics, level progression, and recipe math calculations.
 */
if (typeof require !== 'undefined') {
  try {
    if (typeof global !== 'undefined') {
      if (!global.WireManager) global.WireManager = require('./wireManager.js');
      if (!global.Renderer) global.Renderer = require('./renderer.js');
    }
  } catch (e) {}
}

class GameEngine {
  constructor() {
    this.canvas = document.getElementById('c3-canvas');
    this.ctx = this.canvas.getContext('2d');

    this.levels = (typeof window !== 'undefined' && window.GAME_LEVELS) || [];
    this.currentLevelIndex = 0;
    this.currentLevelData = null;

    // Entities
    this.startBox = null;
    this.endBox = null;
    this.modifierBoxes = [];
    this.ball = null;

    // Simulation & Status
    this.computerStatus = 'idle'; // 'idle' | 'evaluating' | 'accepted' | 'rejected'
    this.targetValue = 3;
    this.isSimulating = false;

    // Sub-systems
    this.wireManager = new WireManager(this);
    this.renderer = new Renderer(this.canvas, this.ctx, this);

    // Visual FX pools
    this.particles = [];
    this.floatingTexts = [];

    // Dragging state for modifier boxes
    this.dragBox = null;
    this.dragOffsetX = 0;
    this.dragOffsetY = 0;

    // Cookie & Progression State
    this.unlockedLevel = this.getSavedUnlockedLevel();
    this.tutorialActive = false;

    // Time tracking
    this.lastTime = performance.now();
  }

  // --- Cookie & LocalStorage Progression Persistence ---
  getCookie(name) {
    if (typeof document === 'undefined') return null;
    const nameEQ = name + '=';
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) return decodeURIComponent(c.substring(nameEQ.length, c.length));
    }
    try {
      return localStorage.getItem(name);
    } catch (e) {
      return null;
    }
  }

  setCookie(name, value, days = 365) {
    if (typeof document !== 'undefined') {
      const date = new Date();
      date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
      const expires = '; expires=' + date.toUTCString();
      document.cookie = name + '=' + encodeURIComponent(value) + expires + '; path=/; SameSite=Lax';
    }
    try {
      localStorage.setItem(name, value);
    } catch (e) {}
  }

  isTutorialCompleted() {
    return this.getCookie('cbn_tutorial_completed') === 'true';
  }

  completeTutorial(showToast = true) {
    this.tutorialActive = false;
    this.setCookie('cbn_tutorial_completed', 'true');
    const skipBtn = document.getElementById('btn-skip-tutorial');
    if (skipBtn) skipBtn.style.display = 'none';
    if (showToast) {
      this.showToast('Tutorial completed! Happy Cooking! 🍳', 'success');
    }
  }

  getTutorialStep() {
    if (!this.tutorialActive || this.currentLevelIndex !== 0) return null;

    const wm = this.wireManager;
    // Step 1: from 'start' to 'box_1_1'
    const conn1 = wm.getConnection('start');
    if (!conn1 || conn1.toBoxId !== 'box_1_1') {
      return {
        stepNum: 1,
        totalSteps: 3,
        fromBoxId: 'start',
        fromPortId: 'out',
        toBoxId: 'box_1_1',
        toPortId: 'in',
        instruction: 'Drag cable from Dispenser to Spice Pod (+1)'
      };
    }

    // Step 2: from 'box_1_1' to 'box_1_2'
    const conn2 = wm.getConnection('box_1_1');
    if (!conn2 || conn2.toBoxId !== 'box_1_2') {
      return {
        stepNum: 2,
        totalSteps: 3,
        fromBoxId: 'box_1_1',
        fromPortId: 'out',
        toBoxId: 'box_1_2',
        toPortId: 'in',
        instruction: 'Connect Spice Pod Alpha to Spice Pod Beta (+1)'
      };
    }

    // Step 3: from 'box_1_2' to 'end'
    const conn3 = wm.getConnection('box_1_2');
    if (!conn3 || conn3.toBoxId !== 'end') {
      return {
        stepNum: 3,
        totalSteps: 3,
        fromBoxId: 'box_1_2',
        fromPortId: 'out',
        toBoxId: 'end',
        toPortId: 'in',
        instruction: 'Connect Spice Pod Beta into Recipe Computer'
      };
    }

    // Step 4: All connected! Tap START COOKING
    return {
      stepNum: 4,
      totalSteps: 3,
      isCookStep: true,
      instruction: 'All connected! Tap START COOKING to cook dish!'
    };
  }

  getSavedUnlockedLevel() {
    const saved = this.getCookie('cbn_unlocked_level');
    if (saved) {
      const parsed = parseInt(saved, 10);
      if (!isNaN(parsed) && parsed >= 1) {
        return Math.min(parsed, this.levels.length);
      }
    }
    return 1; // Level 1 is always unlocked by default
  }

  saveUnlockedLevel(levelNum) {
    const clamped = Math.max(1, Math.min(levelNum, this.levels.length));
    this.setCookie('cbn_unlocked_level', clamped.toString());
  }

  unlockLevel(levelNum) {
    if (levelNum > this.unlockedLevel) {
      this.unlockedLevel = Math.min(levelNum, this.levels.length);
      this.saveUnlockedLevel(this.unlockedLevel);
    }
  }

  resetProgress() {
    if (confirm('Reset unlocked progress back to Level 1?')) {
      this.unlockedLevel = 1;
      this.saveUnlockedLevel(1);
      this.setCookie('cbn_tutorial_completed', 'false');
      this.loadLevel(0);
      this.showLevelsModal();
      this.showToast('Progress reset to Level 1', 'info');
      if (window.Sound) window.Sound.playClick();
    }
  }

  init() {
    this.loadLevel(0);
    this.bindUI();
    this.gameLoop();
  }

  loadLevel(levelIndex) {
    if (levelIndex < 0 || levelIndex >= this.levels.length) {
      levelIndex = 0;
    }
    this.currentLevelIndex = levelIndex;
    const data = this.levels[levelIndex];
    this.currentLevelData = data;

    // Reset simulation & wires
    this.isSimulating = false;
    this.activeSimulation = null;
    this.computerStatus = 'idle';
    this.wireManager.clear();
    this.particles = [];
    this.floatingTexts = [];

    // Setup Start Box
    this.startBox = {
      x: data.startBox.x,
      y: data.startBox.y,
      origX: data.startBox.x,
      origY: data.startBox.y,
      w: data.startBox.w || 150,
      h: data.startBox.h || 150,
      label: data.startBox.label
    };

    // Setup End Box (Computer)
    this.endBox = {
      x: data.endBox.x,
      y: data.endBox.y,
      origX: data.endBox.x,
      origY: data.endBox.y,
      w: data.endBox.w || 180,
      h: data.endBox.h || 170,
      label: data.endBox.label
    };

    this.targetValue = data.targetValue;

    // Setup Modifier Boxes (deep clone default positions)
    this.modifierBoxes = data.boxes.map(b => ({
      ...b,
      origX: b.x,
      origY: b.y,
      isCooking: false,
      warpVisits: 0
    }));

    // Setup Numbered Ball resting in start chamber
    this.ball = {
      x: this.startBox.x,
      y: this.startBox.y + 10,
      radius: 28,
      value: data.startValue,
      initialValue: data.startValue,
      rotation: 0,
      visible: true,
      isTimeWarped: false
    };

    // Update UI Elements
    this.updateHUD();
    this.hideWinModal();
    this.hideLevelsModal();

    // Check if tutorial should be active (Level 1 first-time only)
    if (levelIndex === 0 && !this.isTutorialCompleted()) {
      this.tutorialActive = true;
      const skipBtn = document.getElementById('btn-skip-tutorial');
      if (skipBtn) skipBtn.style.display = 'inline-flex';
    } else {
      this.tutorialActive = false;
      const skipBtn = document.getElementById('btn-skip-tutorial');
      if (skipBtn) skipBtn.style.display = 'none';
    }

    // Reset Cook button appearance
    const cookBtn = document.getElementById('btn-cook');
    if (cookBtn) {
      cookBtn.classList.remove('cooking');
      document.getElementById('cook-label').textContent = 'START COOKING';
    }
  }

  updateHUD() {
    const data = this.currentLevelData;
    if (!data) return;

    const levelNameEl = document.getElementById('hud-level-name');
    if (levelNameEl) levelNameEl.textContent = data.name.toUpperCase();

    const targetValEl = document.getElementById('hud-target-value');
    if (targetValEl) targetValEl.textContent = data.targetValue;
  }

  resetBallToStart() {
    this.isSimulating = false;
    this.activeSimulation = null;
    this.computerStatus = 'idle';
    if (this.ball && this.currentLevelData) {
      this.ball.x = this.startBox.x;
      this.ball.y = this.startBox.y + 10;
      this.ball.value = this.currentLevelData.startValue;
      this.ball.rotation = 0;
      this.ball.visible = true;
      this.ball.isTimeWarped = false;
    }
    for (const box of this.modifierBoxes) {
      box.isCooking = false;
      box.warpVisits = 0;
    }
    const cookBtn = document.getElementById('btn-cook');
    if (cookBtn) {
      cookBtn.classList.remove('cooking');
      document.getElementById('cook-label').textContent = 'START COOKING';
    }
    if (window.Sound) {
      window.Sound.stopRoll();
    }
  }

  resetPositions() {
    if (this.isSimulating) return;
    for (const box of this.modifierBoxes) {
      box.x = box.origX;
      box.y = box.origY;
    }
    if (this.startBox) {
      this.startBox.x = this.startBox.origX;
      this.startBox.y = this.startBox.origY;
    }
    if (this.endBox) {
      this.endBox.x = this.endBox.origX;
      this.endBox.y = this.endBox.origY;
    }
    this.resetBallToStart();
    this.showToast('Pod positions reset!', 'info');
    if (window.Sound) window.Sound.playClick();
  }

  clearWires() {
    if (this.isSimulating) return;
    this.wireManager.clear();
    this.resetBallToStart();
    this.showToast('All cables disconnected', 'info');
    if (window.Sound) window.Sound.playUnplug();
  }

  /**
   * Main Start Cooking Button Handler
   */
  startCooking() {
    if (this.isSimulating) {
      // If already simulating, clicking button cancels/resets
      this.resetBallToStart();
      return;
    }

    // Verify Dispenser Vault is connected
    const startConn = this.wireManager.getConnection('start');
    if (!startConn) {
      this.showToast('Connect a cable from the Dispenser Vault first!', 'error');
      if (window.Sound) window.Sound.playReject();
      return;
    }

    const pFrom = this.wireManager.getPort('start', 'output', 'out');
    const pTo = this.wireManager.getPort(startConn.toBoxId, 'input', startConn.toPortId || 'in');
    if (!pFrom || !pTo) {
      this.showToast('Connection endpoint missing!', 'error');
      return;
    }

    // Start execution
    this.isSimulating = true;
    this.computerStatus = 'idle';

    if (this.tutorialActive) {
      this.completeTutorial(false);
    }

    const cookBtn = document.getElementById('btn-cook');
    if (cookBtn) {
      cookBtn.classList.add('cooking');
      document.getElementById('cook-label').textContent = 'STOP / REWIND';
    }

    if (window.Sound) {
      window.Sound.playLaunch();
      window.Sound.startRoll();
    }

    // Prepare runtime simulation step
    this.activeSimulation = {
      fromBoxId: 'start',
      fromPortId: 'out',
      toBoxId: startConn.toBoxId,
      toPortId: startConn.toPortId || 'in',
      curve: this.wireManager.calculateCurvePoints(pFrom, pTo),
      segmentProgress: 0,
      speed: 0.55,
      isPausedInBox: false,
      pauseTimer: 0,
      currentBox: null,
      outgoingPortId: null,
      nextConn: null
    };
  }

  /**
   * Physics & Simulation Update Loop
   */
  update(deltaTime) {
    // 1. Update Ball Simulation
    if (this.isSimulating && this.activeSimulation) {
      this.updateSimulation(deltaTime);
    }

    // 2. Update Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += (p.vx || 0) * deltaTime;
      p.y += (p.vy || 0) * deltaTime;
      if (p.expandSpeed) {
        p.radius += p.expandSpeed * deltaTime;
      }
      p.alpha -= p.decay * deltaTime;
      if (p.rotation !== undefined) {
        p.rotation += (p.rotSpeed || 0) * deltaTime;
      }
      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // 3. Update Floating Text Popups
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y += ft.vy * deltaTime;
      ft.alpha -= ft.decay * deltaTime;
      if (ft.alpha <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }
  }

  updateSimulation(deltaTime) {
    const sim = this.activeSimulation;
    if (!sim) return;

    // 1. If ball is paused inside a pod cooking / evaluating condition
    if (sim.isPausedInBox) {
      sim.pauseTimer -= deltaTime;

      if (sim.currentBox) {
        this.spawnSteam(sim.currentBox.x, sim.currentBox.y - 10, 2);
      }

      if (sim.pauseTimer <= 0) {
        // Pause finished: check if next connection exists
        if (!sim.nextConn) {
          // No outgoing wire from this port!
          if (sim.currentBox && sim.currentBox.op === 'conditional') {
            this.showToast(
              `Branch [${sim.outgoingPortId.toUpperCase()}] is not connected!`,
              'error'
            );
          } else {
            this.showToast('Cable path ends here! Connect an OUT cable.', 'error');
          }
          if (window.Sound) window.Sound.playReject();

          setTimeout(() => {
            this.resetBallToStart();
          }, 1400);
          return;
        }

        // Setup next segment along the outgoing wire
        const pFrom = this.wireManager.getPort(
          sim.nextConn.fromBoxId,
          'output',
          sim.nextConn.fromPortId
        );
        const pTo = this.wireManager.getPort(
          sim.nextConn.toBoxId,
          'input',
          sim.nextConn.toPortId || 'in'
        );

        if (!pFrom || !pTo) {
          this.resetBallToStart();
          return;
        }

        sim.fromBoxId = sim.nextConn.fromBoxId;
        sim.fromPortId = sim.nextConn.fromPortId;
        sim.toBoxId = sim.nextConn.toBoxId;
        sim.toPortId = sim.nextConn.toPortId;
        sim.curve = this.wireManager.calculateCurvePoints(pFrom, pTo);
        sim.segmentProgress = 0;
        sim.isPausedInBox = false;
        if (sim.currentBox) {
          sim.currentBox.isCooking = false;
          sim.currentBox.activeBranch = null;
        }
        sim.nextConn = null;

        if (window.Sound) window.Sound.startRoll();
      }
      return;
    }

    // 2. Advance along current wire segment
    sim.segmentProgress += sim.speed * deltaTime;

    // Trail sparks behind ball
    if (Math.random() < 0.7) {
      this.spawnSpark(this.ball.x, this.ball.y, 1);
    }

    if (sim.segmentProgress >= 1.0) {
      // Arrived at destination of this segment
      sim.segmentProgress = 0;
      const arrivedBoxId = sim.toBoxId;

      if (arrivedBoxId === 'end') {
        // Reached the computer terminal!
        this.ball.x = this.endBox.x;
        this.ball.y = this.endBox.y;
        this.finishSimulation();
        return;
      }

      // Arrived at a modifier or conditional box
      const modBox = this.modifierBoxes.find(b => b.id === arrivedBoxId);
      if (modBox) {
        // Center ball inside box
        this.ball.x = modBox.x;
        this.ball.y = modBox.y;

        let floatingMsg = '';
        let floatingColor = '#ffd54f';

        if (modBox.op === 'conditional') {
          // Evaluate condition on incoming ball value
          let isMet = false;
          if (modBox.condType === 'gt') {
            isMet = this.ball.value > modBox.condVal;
          } else if (modBox.condType === 'gte') {
            isMet = this.ball.value >= modBox.condVal;
          } else if (modBox.condType === 'lt') {
            isMet = this.ball.value < modBox.condVal;
          } else if (modBox.condType === 'lte') {
            isMet = this.ball.value <= modBox.condVal;
          } else if (modBox.condType === 'eq') {
            isMet = this.ball.value === modBox.condVal;
          }

          if (window.Sound) {
            window.Sound.playConditionCheck(isMet);
          }

          const condSymbol = modBox.condType === 'eq' ? '=' : (modBox.condType === 'gte' ? '≥' : (modBox.condType === 'gt' ? '>' : (modBox.condType === 'lte' ? '≤' : '<')));
          const invSymbol = modBox.condType === 'eq' ? '≠' : (modBox.condType === 'gte' ? '<' : (modBox.condType === 'gt' ? '≤' : (modBox.condType === 'lte' ? '>' : '≥')));

          if (isMet) {
            // Condition TRUE -> Route via YES port
            modBox.activeBranch = 'yes';
            sim.outgoingPortId = 'yes';
            sim.nextConn = this.wireManager.getConnection(modBox.id, 'yes');

            floatingMsg = `✔ YES (${condSymbol} ${modBox.condVal}) ➔ EXIT [YES]`;
            floatingColor = '#00e676';
            this.spawnSpark(modBox.x + 80, modBox.y - 48, 25, '#00e676');
          } else {
            // Condition FALSE -> Route via NO port
            modBox.activeBranch = 'no';
            sim.outgoingPortId = 'no';
            sim.nextConn = this.wireManager.getConnection(modBox.id, 'no');

            floatingMsg = `✖ NO (${invSymbol} ${modBox.condVal}) ➔ EXIT [NO]`;
            floatingColor = '#ff3d00';
            this.spawnSpark(modBox.x + 80, modBox.y + 48, 25, '#ff3d00');
          }

          sim.pauseTimer = 0.7; // Dramatic scan pause
        } else if (modBox.op === 'number_cooker' || modBox.op === 'time_travel') {
          // Master Number Cooker with 2-3 Loop Cooking / Simmering Progression
          modBox.warpVisits = (modBox.warpVisits || 0) + 1;
          const prevVal = this.ball.value;

          if (modBox.warpVisits < 3) {
            // Raw / Simmering phase: generate random simmering temperature value (never 100)
            const simmerPools = [
              [34, 42, 53, 61], // pass 1 possibilities (Simmering)
              [74, 82, 89, 93]  // pass 2 possibilities (Boiling)
            ];
            const pool = simmerPools[modBox.warpVisits - 1] || [45, 68, 77, 85];
            const simmerVal = pool[Math.floor(Math.random() * pool.length)];

            this.ball.value = simmerVal;
            this.ball.isTimeWarped = false; // Not yet fully cooked

            const stageName = modBox.warpVisits === 1 ? 'SIMMERING 33%' : 'BOILING 66%';
            floatingMsg = `🔥 ${stageName}: ${prevVal} ➔ ${this.ball.value}`;
            floatingColor = '#ffb300';
            sim.pauseTimer = 0.8;

            if (window.Sound) {
              window.Sound.playCookTransform();
            }
            this.spawnSteam(modBox.x, modBox.y, 20);
            this.spawnSpark(modBox.x, modBox.y, 20, '#ff9800');
          } else {
            // Visit 3+: Dish is fully cooked, locked onto perfection!
            this.ball.value = modBox.val || 100;
            this.ball.isTimeWarped = true; // Supercharged golden culinary aura

            floatingMsg = `🔥 DISH FULLY COOKED: ${this.ball.value}! (100% READY)`;
            floatingColor = '#ffea00';
            sim.pauseTimer = 1.1; // Dramatic sizzling pause

            if (window.Sound && window.Sound.playTimeWarp) {
              window.Sound.playTimeWarp();
            } else if (window.Sound) {
              window.Sound.playCookTransform();
            }

            this.spawnTimeVortex(modBox.x, modBox.y);
            this.spawnSteam(modBox.x, modBox.y, 30);
          }

          sim.outgoingPortId = 'out';
          sim.nextConn = this.wireManager.getConnection(modBox.id, 'out');
        } else {
          // Standard operator pod (+, -, *)
          if (modBox.op === '+') {
            this.ball.value += modBox.val;
          } else if (modBox.op === '-') {
            this.ball.value -= modBox.val;
          } else if (modBox.op === '*') {
            this.ball.value *= modBox.val;
          } else if (modBox.op === '/') {
            this.ball.value = Math.floor(this.ball.value / modBox.val);
          }

          floatingMsg = `${modBox.badge} ➔ ${this.ball.value}`;
          floatingColor = '#ffd54f';
          sim.outgoingPortId = 'out';
          sim.nextConn = this.wireManager.getConnection(modBox.id, 'out');
          sim.pauseTimer = 0.45;

          if (window.Sound) {
            window.Sound.playCookTransform();
          }
        }

        sim.loopCount = (sim.loopCount || 0) + 1;
        if (sim.loopCount > 50) {
          this.showToast('Loop limit reached! Ball reset.', 'error');
          if (window.Sound) window.Sound.playReject();
          setTimeout(() => this.resetBallToStart(), 1200);
          return;
        }

        // Trigger cooking effects
        modBox.isCooking = true;
        sim.isPausedInBox = true;
        sim.currentBox = modBox;

        if (window.Sound) {
          window.Sound.stopRoll();
        }

        // Floating notification text
        this.spawnFloatingText(
          floatingMsg,
          modBox.x,
          modBox.y - 75,
          floatingColor,
          32
        );

        if (modBox.op !== 'number_cooker' && modBox.op !== 'time_travel') {
          this.spawnSteam(modBox.x, modBox.y, 16);
        }
      }
    } else {
      // Interpolate position and tangent along Bezier curve
      const cp = sim.curve;
      const pt = this.wireManager.sampleBezier(
        cp.p0,
        cp.p1,
        cp.p2,
        cp.p3,
        sim.segmentProgress
      );
      this.ball.x = pt.x;
      this.ball.y = pt.y;
      this.ball.rotation += 8 * deltaTime; // Rolling spin
    }
  }

  finishSimulation() {
    this.isSimulating = false;
    this.activeSimulation = null;
    if (window.Sound) window.Sound.stopRoll();

    const cookBtn = document.getElementById('btn-cook');
    if (cookBtn) {
      cookBtn.classList.remove('cooking');
      document.getElementById('cook-label').textContent = 'START COOKING';
    }

    // Evaluate target matching
    this.computerStatus = 'evaluating';

    setTimeout(() => {
      if (this.ball.value === this.targetValue) {
        // ACCEPTED!
        this.computerStatus = 'accepted';
        if (window.Sound) window.Sound.playAccept();

        if (this.tutorialActive) {
          this.completeTutorial(false);
        }

        this.spawnConfetti(this.endBox.x, this.endBox.y, 80);
        this.spawnFloatingText('ACCEPTED! ⭐⭐⭐', this.endBox.x, this.endBox.y - 120, '#00e676', 48);

        this.showToast('RECIPE ACCEPTED! Formula matches target!', 'success');

        // Unlock next level and persist in cookie!
        const nextLevelNum = this.currentLevelIndex + 2;
        if (nextLevelNum <= this.levels.length) {
          this.unlockLevel(nextLevelNum);
        }

        setTimeout(() => {
          this.showWinModal();
        }, 1100);
      } else {
        // REJECTED!
        this.computerStatus = 'rejected';
        if (window.Sound) window.Sound.playReject();

        this.spawnSpark(this.endBox.x - 80, this.endBox.y, 25, '#ff3d00');
        this.spawnFloatingText('REJECTED!', this.endBox.x, this.endBox.y - 120, '#ff3d00', 48);

        this.showToast(
          `RECIPE REJECTED! Ball value was ${this.ball.value}, computer required ${this.targetValue}!`,
          'error'
        );

        // Reset ball back after short delay
        setTimeout(() => {
          this.resetBallToStart();
        }, 1800);
      }
    }, 450);
  }

  /**
   * Particle Systems
   */
  spawnSteam(x, y, count = 10) {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        type: 'steam',
        x: x + (Math.random() * 60 - 30),
        y: y + (Math.random() * 40 - 20),
        vx: (Math.random() * 40 - 20),
        vy: -Math.random() * 80 - 40,
        radius: Math.random() * 18 + 12,
        alpha: 0.8,
        decay: Math.random() * 0.8 + 0.6
      });
    }
  }

  spawnSpark(x, y, count = 10, color = '#ffd54f') {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 140 + 40;
      this.particles.push({
        type: 'spark',
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: Math.random() * 4 + 2,
        color,
        alpha: 1.0,
        decay: Math.random() * 1.5 + 1.2
      });
    }
  }

  spawnConfetti(x, y, count = 60) {
    const colors = ['#00e676', '#ffd54f', '#00e5ff', '#ff3d00', '#e040fb', '#ffffff'];
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 320 + 80;
      this.particles.push({
        type: 'confetti',
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 120, // upward lift
        size: Math.random() * 14 + 8,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * Math.PI,
        rotSpeed: Math.random() * 10 - 5,
        alpha: 1.0,
        decay: Math.random() * 0.4 + 0.35
      });
    }
  }

  /**
   * Dramatic Temporal Vortex Shockwave & Particles for Time Travel Pod
   */
  spawnTimeVortex(x, y) {
    // 1. Expanding Chronal Shockwave Rings
    for (let r = 0; r < 3; r++) {
      this.particles.push({
        type: 'chrono_ring',
        x,
        y,
        radius: 20 + r * 25,
        expandSpeed: 260 + r * 80,
        color: r % 2 === 0 ? '#b388ff' : '#00e5ff',
        alpha: 1.0,
        decay: 0.95
      });
    }

    // 2. Swirling Quantum Sparks / Temporal Debris
    const chronoColors = ['#b388ff', '#00e5ff', '#ffd700', '#ffffff', '#7c4dff', '#e040fb'];
    for (let i = 0; i < 45; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 260 + 80;
      this.particles.push({
        type: 'chrono_spark',
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: Math.random() * 5 + 2.5,
        color: chronoColors[Math.floor(Math.random() * chronoColors.length)],
        alpha: 1.0,
        decay: Math.random() * 1.1 + 0.7
      });
    }

    // 3. Floating Temporal Subtitle Popups
    this.spawnFloatingText('YEAR 2026 ➔ 3026 (FUTURE JUMP)', x, y + 90, '#b388ff', 24);
  }

  spawnFloatingText(text, x, y, color = '#ffeb3b', size = 40) {
    this.floatingTexts.push({
      text,
      x,
      y,
      vy: -55,
      color,
      size,
      alpha: 1.0,
      decay: 0.6
    });
  }

  showToast(message, type = 'info') {
    const toast = document.getElementById('toast-notice');
    if (!toast) return;

    toast.textContent = message;
    toast.className = `toast-notice show ${type}`;

    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      toast.className = 'toast-notice';
    }, 3200);
  }

  showWinModal() {
    const modal = document.getElementById('modal-win');
    if (!modal) return;

    const formulaEl = document.getElementById('modal-win-formula');
    if (formulaEl && this.currentLevelData) {
      formulaEl.textContent = this.currentLevelData.winningFormula || `${this.ball.value}  ✔`;
    }

    const nextLvlBtn = document.getElementById('btn-next-level');
    if (nextLvlBtn) {
      if (this.currentLevelIndex + 1 >= this.levels.length) {
        nextLvlBtn.textContent = `ALL ${this.levels.length} LEVELS COMPLETED! 👑`;
      } else {
        nextLvlBtn.textContent = `NEXT LEVEL (${this.currentLevelIndex + 2}) ➔`;
      }
    }

    modal.classList.add('active');
  }

  hideWinModal() {
    const modal = document.getElementById('modal-win');
    if (modal) modal.classList.remove('active');
  }

  showLevelsModal() {
    const modal = document.getElementById('modal-levels');
    const grid = document.getElementById('level-grid');
    const progressEl = document.getElementById('unlocked-progress-text');
    if (!modal || !grid) return;

    const titleEl = document.getElementById('levels-modal-title');
    if (titleEl) {
      titleEl.textContent = `SELECT LEVEL (1 - ${this.levels.length})`;
    }
    if (progressEl) {
      progressEl.textContent = `UNLOCKED: ${this.unlockedLevel} / ${this.levels.length}`;
    }

    grid.innerHTML = '';
    let activeCardEl = null;

    this.levels.forEach((lvl, idx) => {
      const isUnlocked = idx < this.unlockedLevel;
      const isCurrent = idx === this.currentLevelIndex;
      const isCompleted = idx < this.unlockedLevel - 1 || (idx < this.unlockedLevel && !isCurrent);

      const card = document.createElement('div');
      let classNames = 'level-card';
      if (!isUnlocked) classNames += ' locked';
      if (isCurrent) classNames += ' current';
      if (isCompleted && isUnlocked) classNames += ' completed';
      card.className = classNames;

      card.innerHTML = `
        <div class="level-card-num">${isUnlocked ? lvl.id : '🔒'}</div>
        <div class="level-card-status">${isUnlocked ? (isCurrent ? 'PLAYING' : (isCompleted ? '★ CLEAR' : 'OPEN')) : 'LOCKED'}</div>
      `;

      if (isCurrent) {
        activeCardEl = card;
      }

      card.addEventListener('click', () => {
        if (!isUnlocked) {
          this.showToast(`Level ${lvl.id} is locked! Complete Level ${this.unlockedLevel} first.`, 'error');
          if (window.Sound) window.Sound.playReject();
          card.classList.add('shake');
          setTimeout(() => card.classList.remove('shake'), 400);
          return;
        }

        this.loadLevel(idx);
        this.hideLevelsModal();
        if (window.Sound) window.Sound.playClick();
      });

      grid.appendChild(card);
    });

    modal.classList.add('active');

    // Auto-scroll to active or latest unlocked level
    setTimeout(() => {
      if (activeCardEl) {
        activeCardEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 120);
  }

  hideLevelsModal() {
    const modal = document.getElementById('modal-levels');
    if (modal) modal.classList.remove('active');
  }

  bindUI() {
    // Skip Tutorial Button
    const skipBtn = document.getElementById('btn-skip-tutorial');
    if (skipBtn) {
      skipBtn.addEventListener('click', () => {
        this.completeTutorial(true);
        if (window.Sound) window.Sound.playClick();
      });
    }

    // Cook / Start Button
    const cookBtn = document.getElementById('btn-cook');
    if (cookBtn) {
      cookBtn.addEventListener('click', () => this.startCooking());
    }

    // Clear Wires Button
    const clearWiresBtn = document.getElementById('btn-clear-wires');
    if (clearWiresBtn) {
      clearWiresBtn.addEventListener('click', () => this.clearWires());
    }

    // Reset Pod Positions Button
    const resetPosBtn = document.getElementById('btn-reset-pos');
    if (resetPosBtn) {
      resetPosBtn.addEventListener('click', () => this.resetPositions());
    }

    // Sound Mute Toggle
    const soundBtn = document.getElementById('btn-sound');
    if (soundBtn) {
      soundBtn.addEventListener('click', () => {
        if (window.Sound) {
          const isMuted = window.Sound.toggleMute();
          soundBtn.textContent = isMuted ? '🔇' : '🔊';
        }
      });
    }

    // Levels Modal Toggle
    const levelsBtn = document.getElementById('btn-levels');
    if (levelsBtn) {
      levelsBtn.addEventListener('click', () => this.showLevelsModal());
    }
    const closeLevelsBtn = document.getElementById('btn-close-levels');
    if (closeLevelsBtn) {
      closeLevelsBtn.addEventListener('click', () => this.hideLevelsModal());
    }
    const closeLevelsX = document.getElementById('btn-close-levels-x');
    if (closeLevelsX) {
      closeLevelsX.addEventListener('click', () => this.hideLevelsModal());
    }
    const resetProgressBtn = document.getElementById('btn-reset-progress');
    if (resetProgressBtn) {
      resetProgressBtn.addEventListener('click', () => this.resetProgress());
    }

    // Help Modal Toggle
    const helpBtn = document.getElementById('btn-help');
    const helpModal = document.getElementById('modal-help');
    const closeHelpBtn = document.getElementById('btn-close-help');
    if (helpBtn && helpModal) {
      helpBtn.addEventListener('click', () => helpModal.classList.add('active'));
    }
    if (closeHelpBtn && helpModal) {
      closeHelpBtn.addEventListener('click', () => helpModal.classList.remove('active'));
    }

    // Win Modal Buttons
    const nextLvlBtn = document.getElementById('btn-next-level');
    if (nextLvlBtn) {
      nextLvlBtn.addEventListener('click', () => {
        const nextIdx = this.currentLevelIndex + 1;
        if (nextIdx < this.levels.length) {
          this.loadLevel(nextIdx);
        } else {
          this.loadLevel(0);
        }
        if (window.Sound) window.Sound.playClick();
      });
    }

    const replayBtn = document.getElementById('btn-replay-level');
    if (replayBtn) {
      replayBtn.addEventListener('click', () => {
        this.loadLevel(this.currentLevelIndex);
        if (window.Sound) window.Sound.playClick();
      });
    }
  }

  gameLoop() {
    const now = performance.now();
    const deltaTime = Math.min((now - this.lastTime) / 1000, 0.1);
    this.lastTime = now;

    this.update(deltaTime);
    this.renderer.render(deltaTime);

    requestAnimationFrame(() => this.gameLoop());
  }
}
if (typeof window !== 'undefined') {
  window.GameEngine = GameEngine;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GameEngine;
}
