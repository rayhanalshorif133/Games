import { assets } from './assets.js';
import { audio } from './audio.js';
import { ParticleSystem } from './particles.js';
import { LEVELS, getLevel, COLOR_NAMES, CUP_ANIM_NAMES } from './levels.js';
import { CONVEYOR_PATH, COUNTER_SLOTS, STACK_POSITIONS, DISPENSER_POS } from './path_data.js';

export class CoffeeManiaGame {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    this.particles = new ParticleSystem();

    // Game state
    this.currentLevelId = parseInt(localStorage.getItem('coffeemania_level') || '1', 10);
    this.coins = parseInt(localStorage.getItem('coffeemania_coins') || '150', 10);
    this.stars = JSON.parse(localStorage.getItem('coffeemania_stars') || '{}');

    this.state = 'LOADING'; // LOADING, PLAYING, PAUSED, WIN, LOSE, LEVEL_SELECT
    this.levelData = null;

    // In-game objects
    this.cupsQueue = [];       // Array of color IDs remaining
    this.conveyorCups = [];    // Visual cups currently on the track
    this.flyingCups = [];      // Cups currently flying to a tray
    this.counterSlots = [];    // Slots array [tray or null]
    this.maxSlots = 5;
    this.trayStacks = [];      // Array of stacks (each stack is array of tray colors)
    this.animatingTrays = [];  // Trays flying to counter or leaving counter

    // History for Undo booster
    this.moveHistory = [];

    // Track progression
    this.totalLevelCups = 0;
    this.cupsProcessed = 0;
    this.levelStartTime = 0;
    this.movesCount = 0;

    // Tutorial hand
    this.showHand = false;
    this.handPos = { x: 0, y: 0 };
    this.handAnimTimer = 0;

    // Boosters count
    this.boosters = {
      undo: 3,
      extraSlot: 2,
      shuffle: 2
    };

    this.scale = 1;
    this.offsetX = 0;
    this.offsetY = 0;

    this.initEvents();
  }

  async init() {
    await assets.loadAll((progress) => {
      this.drawLoading(progress);
    });

    this.loadLevel(this.currentLevelId);
    this.state = 'PLAYING';
    this.lastTime = performance.now();
    requestAnimationFrame(this.loop.bind(this));
  }

  drawLoading(progress) {
    const { ctx, canvas } = this;
    ctx.fillStyle = '#1c130e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#ffb74d';
    ctx.font = 'bold 36px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Coffee Mania', canvas.width / 2, canvas.height / 2 - 40);

    // Progress bar
    const barW = 400;
    const barH = 16;
    const bx = (canvas.width - barW) / 2;
    const by = canvas.height / 2;

    ctx.strokeStyle = '#ffb74d';
    ctx.lineWidth = 3;
    ctx.strokeRect(bx, by, barW, barH);

    ctx.fillStyle = '#ff9800';
    ctx.fillRect(bx + 4, by + 4, (barW - 8) * progress, barH - 8);

    ctx.fillStyle = '#fff';
    ctx.font = '20px "Segoe UI", sans-serif';
    ctx.fillText(`Brewing assets... ${Math.round(progress * 100)}%`, canvas.width / 2, by + 50);
  }

  loadLevel(levelId) {
    this.currentLevelId = levelId;
    localStorage.setItem('coffeemania_level', levelId.toString());

    this.levelData = getLevel(levelId);
    this.maxSlots = this.levelData.slotsCount || 5;

    // Reset counters
    this.counterSlots = new Array(this.maxSlots).fill(null);
    this.cupsQueue = [...this.levelData.cups];
    this.totalLevelCups = this.cupsQueue.length;
    this.cupsProcessed = 0;
    this.movesCount = 0;
    this.moveHistory = [];
    this.levelStartTime = performance.now();

    // Deep clone stacks
    this.trayStacks = this.levelData.stacks.map(s => [...s]);

    // Setup initial conveyor cups along the track
    this.conveyorCups = [];
    this.flyingCups = [];
    this.animatingTrays = [];

    // Fill the conveyor track with initial cups from queue
    const trackPointsCount = CONVEYOR_PATH.length; // 78
    const spacing = 1.2; // Spacing along path nodes
    const maxVisibleCups = Math.min(this.cupsQueue.length, Math.floor(trackPointsCount / spacing));

    for (let i = 0; i < maxVisibleCups; i++) {
      const color = this.cupsQueue.shift();
      // Distance from dispenser (0 is at dispenser, 1 is one step back...)
      const pathIndex = (trackPointsCount - 1) - i * spacing;
      this.conveyorCups.push({
        color,
        pathIndex: Math.max(0, pathIndex),
        targetPathIndex: Math.max(0, pathIndex),
        x: 0,
        y: 0,
        wobble: Math.random() * Math.PI
      });
    }

    this.showHand = !!this.levelData.tutorial;
    this.updateHUD();
    this.state = 'PLAYING';
    audio.startMusic();
  }

  updateHUD() {
    const elLevel = document.getElementById('hudLevel');
    const elCups = document.getElementById('hudCups');
    const elCoins = document.getElementById('hudCoins');
    if (elLevel) elLevel.textContent = `Level ${this.currentLevelId}`;
    if (elCups) elCups.textContent = `${this.totalLevelCups - this.cupsProcessed} / ${this.totalLevelCups}`;
    if (elCoins) elCoins.textContent = `${this.coins}`;

    const undoBtn = document.getElementById('btnUndo');
    if (undoBtn) undoBtn.textContent = `↩ Undo (${this.boosters.undo})`;
    const slotBtn = document.getElementById('btnExtraSlot');
    if (slotBtn) slotBtn.textContent = `➕ +1 Slot (${this.boosters.extraSlot})`;
    const shufBtn = document.getElementById('btnShuffle');
    if (shufBtn) shufBtn.textContent = `🔀 Shuffle (${this.boosters.shuffle})`;
  }

  // Find exact coordinate along conveyor path
  getPathPos(pathIndex) {
    const idx = Math.max(0, Math.min(CONVEYOR_PATH.length - 1, pathIndex));
    const lower = Math.floor(idx);
    const upper = Math.min(CONVEYOR_PATH.length - 1, lower + 1);
    const frac = idx - lower;

    const p1 = CONVEYOR_PATH[lower];
    const p2 = CONVEYOR_PATH[upper];

    return {
      x: p1.x + (p2.x - p1.x) * frac,
      y: p1.y + (p2.y - p1.y) * frac
    };
  }

  // --- USER INTERACTION ---
  initEvents() {
    const handleTap = (clientX, clientY) => {
      if (this.state !== 'PLAYING') return;

      const rect = this.canvas.getBoundingClientRect();
      const scaleX = 1080 / rect.width;
      const scaleY = 1920 / rect.height;
      const x = (clientX - rect.left) * scaleX;
      const y = (clientY - rect.top) * scaleY;

      this.onCanvasClick(x, y);
    };

    this.canvas.addEventListener('pointerdown', (e) => {
      audio.init();
      handleTap(e.clientX, e.clientY);
    });
  }

  onCanvasClick(x, y) {
    // Check if clicked any tray stack at bottom
    for (let stackIdx = 0; stackIdx < this.trayStacks.length; stackIdx++) {
      const stack = this.trayStacks[stackIdx];
      if (stack.length === 0) continue;

      const basePos = STACK_POSITIONS[stackIdx] || { x: 240 + stackIdx * 200, y: 1720 };
      const topY = basePos.y - (stack.length - 1) * 12;

      // Tray bounding box
      const radius = 105;
      const dist = Math.hypot(x - basePos.x, y - topY);

      if (dist < radius) {
        this.selectStack(stackIdx);
        return;
      }
    }

    // Check if tapped on tutorial hand to acknowledge
    if (this.showHand) {
      this.showHand = false;
    }
  }

  selectStack(stackIdx) {
    const stack = this.trayStacks[stackIdx];
    if (!stack || stack.length === 0) return;

    // Find first empty counter slot
    const emptySlotIdx = this.counterSlots.findIndex(s => s === null);
    if (emptySlotIdx === -1) {
      // Counter is full!
      audio.playLevelFail();
      this.showFeedback('Counter is full! Complete or undo a tray!', '#ff5252');
      return;
    }

    const trayColor = stack.pop();
    this.movesCount++;
    this.showHand = false;

    const basePos = STACK_POSITIONS[stackIdx] || { x: 240 + stackIdx * 200, y: 1720 };
    const startX = basePos.x;
    const startY = basePos.y - stack.length * 12;

    const slotPos = COUNTER_SLOTS[emptySlotIdx];

    // Create tray object with animation
    const tray = {
      color: trayColor,
      colorName: COLOR_NAMES[trayColor],
      slotIndex: emptySlotIdx,
      cupsFilled: 0,
      animName: 'Default',
      frameIndex: 0,
      animTimer: 0,
      isCompleting: false,
      x: startX,
      y: startY,
      targetX: slotPos.x,
      targetY: slotPos.y,
      scale: 0.38,
      inTransit: true,
      originStack: stackIdx
    };

    this.counterSlots[emptySlotIdx] = tray;
    this.animatingTrays.push(tray);

    audio.playSlide();

    // Record for Undo
    this.moveHistory.push({
      stackIdx,
      slotIdx: emptySlotIdx,
      trayColor
    });
  }

  // --- BOOSTERS ---

  useUndo() {
    if (this.boosters.undo <= 0) {
      this.showFeedback('No Undo boosters left!', '#ff9800');
      return;
    }
    if (this.moveHistory.length === 0) {
      this.showFeedback('No moves to undo!', '#ff9800');
      return;
    }

    const lastMove = this.moveHistory.pop();
    const tray = this.counterSlots[lastMove.slotIdx];
    if (!tray || tray.cupsFilled > 0 || tray.isCompleting) {
      this.showFeedback('Cannot undo a tray already being filled!', '#ff5252');
      return;
    }

    this.counterSlots[lastMove.slotIdx] = null;
    this.trayStacks[lastMove.stackIdx].push(lastMove.trayColor);
    this.boosters.undo--;
    audio.playBooster();
    this.updateHUD();
    this.showFeedback('Move Undone!', '#4caf50');
  }

  useExtraSlot() {
    if (this.boosters.extraSlot <= 0) {
      this.showFeedback('No Extra Slot boosters left!', '#ff9800');
      return;
    }
    if (this.maxSlots >= COUNTER_SLOTS.length) {
      this.showFeedback('Maximum counter slots already unlocked!', '#ff9800');
      return;
    }

    this.maxSlots++;
    this.counterSlots.push(null);
    this.boosters.extraSlot--;
    audio.playBooster();
    this.updateHUD();
    this.showFeedback('+1 Counter Slot Unlocked!', '#ffd54f');
  }

  useShuffle() {
    if (this.boosters.shuffle <= 0) {
      this.showFeedback('No Shuffle boosters left!', '#ff9800');
      return;
    }

    // Collect all remaining trays in stacks
    const allTrays = [];
    this.trayStacks.forEach(st => {
      while (st.length > 0) allTrays.push(st.pop());
    });

    if (allTrays.length === 0) {
      this.showFeedback('No trays in stacks to shuffle!', '#ff9800');
      return;
    }

    // Shuffle
    for (let i = allTrays.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allTrays[i], allTrays[j]] = [allTrays[j], allTrays[i]];
    }

    // Distribute back
    allTrays.forEach((t, idx) => {
      this.trayStacks[idx % this.trayStacks.length].push(t);
    });

    this.boosters.shuffle--;
    audio.playBooster();
    this.updateHUD();
    this.showFeedback('Trays Shuffled!', '#29b6f6');
  }

  showFeedback(text, color = '#ffd54f') {
    const fb = document.getElementById('gameFeedback');
    if (!fb) return;
    fb.textContent = text;
    fb.style.color = color;
    fb.classList.remove('active');
    void fb.offsetWidth; // trigger reflow
    fb.classList.add('active');
  }

  // --- MAIN LOOP ---

  loop(timestamp) {
    const dt = Math.min(0.1, (timestamp - this.lastTime) / 1000);
    this.lastTime = timestamp;

    this.update(dt);
    this.draw();

    requestAnimationFrame(this.loop.bind(this));
  }

  update(dt) {
    if (this.state !== 'PLAYING') return;

    this.particles.update(dt * 60);

    // 1. Update animating trays (sliding from stack to counter slot)
    for (let i = this.animatingTrays.length - 1; i >= 0; i--) {
      const tray = this.animatingTrays[i];
      if (tray.inTransit) {
        const dx = tray.targetX - tray.x;
        const dy = tray.targetY - tray.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 4) {
          tray.x = tray.targetX;
          tray.y = tray.targetY;
          tray.inTransit = false;
          this.animatingTrays.splice(i, 1);
        } else {
          tray.x += dx * 0.22;
          tray.y += dy * 0.22;
        }
      }
    }

    // 2. Update active trays animations (frame increments)
    for (let slotIdx = 0; slotIdx < this.maxSlots; slotIdx++) {
      const tray = this.counterSlots[slotIdx];
      if (!tray) continue;

      const anim = assets.getAnim(tray.colorName, tray.animName);
      if (anim && anim.frames && anim.frames.length > 1) {
        tray.animTimer += dt;
        const frameDur = 1 / (anim.speed || 20);
        if (tray.animTimer >= frameDur) {
          tray.animTimer = 0;
          tray.frameIndex++;
          if (tray.frameIndex >= anim.frames.length) {
            if (anim.loop) {
              tray.frameIndex = 0;
            } else {
              tray.frameIndex = anim.frames.length - 1;
              if (tray.isCompleting) {
                // Tray has completed full cup6 animation! Free slot!
                this.counterSlots[slotIdx] = null;
                this.particles.addTrayBurst(tray.x, tray.y, '#ffd54f');
                // Check if level complete
                this.checkLevelComplete();
              }
            }
          }
        }
      }
    }

    // 3. Update conveyor cups advancement
    const trackEndIndex = CONVEYOR_PATH.length - 1; // 77 (Dispenser)
    const spacing = 1.2;

    for (let i = 0; i < this.conveyorCups.length; i++) {
      const cup = this.conveyorCups[i];
      // The cup in front is at conveyorCups[0]
      const desiredPos = trackEndIndex - i * spacing;
      if (cup.pathIndex < desiredPos) {
        cup.pathIndex = Math.min(desiredPos, cup.pathIndex + dt * 14);
      }
      const pos = this.getPathPos(cup.pathIndex);
      cup.x = pos.x;
      cup.y = pos.y;
      cup.wobble += dt * 3;

      // Add gentle steam to cups near front
      if (i < 3) {
        this.particles.addSteam(cup.x, cup.y);
      }
    }

    // Spawn new cups from queue if space opens at conveyor start
    if (this.cupsQueue.length > 0) {
      const lastCup = this.conveyorCups[this.conveyorCups.length - 1];
      if (!lastCup || lastCup.pathIndex > spacing * 1.5) {
        const color = this.cupsQueue.shift();
        this.conveyorCups.push({
          color,
          pathIndex: 0,
          targetPathIndex: 0,
          x: CONVEYOR_PATH[0].x,
          y: CONVEYOR_PATH[0].y,
          wobble: Math.random() * Math.PI
        });
      }
    }

    // 4. Dispenser matching logic: check front cup
    if (this.conveyorCups.length > 0 && this.flyingCups.length === 0) {
      const frontCup = this.conveyorCups[0];
      const isAtDispenser = Math.abs(frontCup.pathIndex - trackEndIndex) < 0.25;

      if (isAtDispenser) {
        // Find if any active tray matches front cup's color and has room (< 6)
        let matchingTray = null;
        let highestCups = -1;

        for (let slotIdx = 0; slotIdx < this.maxSlots; slotIdx++) {
          const tray = this.counterSlots[slotIdx];
          if (tray && !tray.inTransit && !tray.isCompleting && tray.color === frontCup.color && tray.cupsFilled < 6) {
            if (tray.cupsFilled > highestCups) {
              highestCups = tray.cupsFilled;
              matchingTray = tray;
            }
          }
        }

        if (matchingTray) {
          // Launch front cup to this tray!
          this.conveyorCups.shift(); // Remove from conveyor
          this.launchCupToTray(frontCup, matchingTray);
        } else {
          // No matching tray currently on counter!
          this.checkJamCondition();
        }
      }
    }

    // 5. Update flying cups
    for (let i = this.flyingCups.length - 1; i >= 0; i--) {
      const fc = this.flyingCups[i];
      fc.progress += dt / fc.duration;

      if (fc.progress >= 1) {
        // Cup has landed in tray!
        this.flyingCups.splice(i, 1);
        this.onCupLandedInTray(fc.tray, fc.color);
      } else {
        // Parabolic arc tween
        const t = fc.progress;
        fc.x = fc.startX + (fc.targetX - fc.startX) * t;
        // Arc peak in Y
        const arcY = -120 * Math.sin(t * Math.PI);
        fc.y = fc.startY + (fc.targetY - fc.startY) * t + arcY;
        fc.scale = 1 + 0.3 * Math.sin(t * Math.PI);
      }
    }

    // 6. Update tutorial hand animation
    if (this.showHand) {
      this.handAnimTimer += dt * 2.5;
      // Point towards first stack with a matching color for front cup
      const frontCup = this.conveyorCups[0];
      let targetStackIdx = 0;
      if (frontCup) {
        const found = this.trayStacks.findIndex(st => st.length > 0 && st[st.length - 1] === frontCup.color);
        if (found !== -1) targetStackIdx = found;
      }
      const stPos = STACK_POSITIONS[targetStackIdx] || { x: 440, y: 1720 };
      const bounce = Math.sin(this.handAnimTimer) * 15;
      this.handPos = { x: stPos.x + 30, y: stPos.y - 40 + bounce };
    }
  }

  launchCupToTray(cup, tray) {
    audio.playCupFly();
    this.flyingCups.push({
      color: cup.color,
      startX: cup.x,
      startY: cup.y,
      targetX: tray.x,
      targetY: tray.y,
      x: cup.x,
      y: cup.y,
      progress: 0,
      duration: 0.18,
      scale: 1,
      tray
    });
  }

  onCupLandedInTray(tray, color) {
    tray.cupsFilled++;
    this.cupsProcessed++;
    this.updateHUD();

    audio.playCupPlop(1 + tray.cupsFilled * 0.1);

    // Switch tray animation to cup1, cup2, etc.
    tray.animName = `cup${tray.cupsFilled}`;
    tray.frameIndex = 0;
    tray.animTimer = 0;

    if (tray.cupsFilled === 6) {
      // Tray complete!
      tray.isCompleting = true;
      audio.playTrayComplete();
      this.particles.addTrayBurst(tray.x, tray.y, '#ffd54f');
      this.coins += 10;
      localStorage.setItem('coffeemania_coins', this.coins.toString());
      this.updateHUD();
      this.showFeedback('Tray Packed! +10 Coins ☕', '#ffd54f');
    }
  }

  checkJamCondition() {
    // A jam occurs if all available counter slots are filled and NONE match the front cup
    const frontCup = this.conveyorCups[0];
    if (!frontCup) return;

    const allSlotsFilled = this.counterSlots.slice(0, this.maxSlots).every(s => s !== null && !s.inTransit);
    if (allSlotsFilled) {
      const hasMatch = this.counterSlots.slice(0, this.maxSlots).some(s => s && s.color === frontCup.color && s.cupsFilled < 6);
      if (!hasMatch) {
        // True Jam!
        this.onLevelFailed();
      }
    }
  }

  checkLevelComplete() {
    const allDone = (
      this.cupsQueue.length === 0 &&
      this.conveyorCups.length === 0 &&
      this.flyingCups.length === 0 &&
      this.counterSlots.every(s => s === null) &&
      this.animatingTrays.length === 0
    );

    if (allDone && this.state === 'PLAYING') {
      this.onLevelWin();
    }
  }

  onLevelWin() {
    this.state = 'WIN';
    audio.playLevelWin();
    this.particles.addWinCelebration(1080, 1920);

    // Calculate stars
    const elapsed = (performance.now() - this.levelStartTime) / 1000;
    let earnedStars = 3;
    if (elapsed > 90 || this.movesCount > this.totalLevelCups / 6 + 4) earnedStars = 2;
    if (elapsed > 150 || this.movesCount > this.totalLevelCups / 6 + 8) earnedStars = 1;

    this.stars[this.currentLevelId] = Math.max(this.stars[this.currentLevelId] || 0, earnedStars);
    localStorage.setItem('coffeemania_stars', JSON.stringify(this.stars));

    this.coins += 50;
    localStorage.setItem('coffeemania_coins', this.coins.toString());

    // Show Win Modal
    const winModal = document.getElementById('winModal');
    const winTitle = document.getElementById('winTitle');
    const winStars = document.getElementById('winStars');
    const winStats = document.getElementById('winStats');

    if (winTitle) winTitle.textContent = 'ORDER COMPLETE!';
    if (winStars) winStars.textContent = '⭐'.repeat(earnedStars) + '☆'.repeat(3 - earnedStars);
    if (winStats) winStats.innerHTML = `
      <p>Time: <strong>${Math.round(elapsed)}s</strong></p>
      <p>Moves: <strong>${this.movesCount}</strong></p>
      <p>Reward: <strong>+50 Coins ☕</strong></p>
    `;
    if (winModal) winModal.classList.add('visible');
  }

  onLevelFailed() {
    this.state = 'LOSE';
    audio.playLevelFail();

    const loseModal = document.getElementById('loseModal');
    if (loseModal) loseModal.classList.add('visible');
  }

  // --- DRAWING ---

  draw() {
    const { ctx } = this;
    ctx.clearRect(0, 0, 1080, 1920);

    // 1. Draw Background Cafe Table (UI)
    assets.drawFrame(ctx, 'UI', 'Default', 0, 540, 960, 1080, 2400);

    // 2. Draw Counter Slots at Y = 1315
    this.drawCounterSlots();

    // 3. Draw Waiting Tray Stacks at bottom
    this.drawTrayStacks();

    // 4. Draw Conveyor Track & Cups
    this.drawConveyorCups();

    // 5. Draw Flying Cups
    this.drawFlyingCups();

    // 6. Draw Active Trays in counter slots
    this.drawActiveTrays();

    // 7. Draw Particles (Steam, Confetti, Sparkles)
    this.particles.draw(ctx);

    // 8. Draw Tutorial Hand
    if (this.showHand) {
      assets.drawFrame(ctx, 'hand', 'Default', 0, this.handPos.x, this.handPos.y, 160, 163);
    }
  }

  drawCounterSlots() {
    const { ctx } = this;
    for (let i = 0; i < this.maxSlots; i++) {
      const slot = COUNTER_SLOTS[i];
      if (!slot) continue;

      ctx.save();
      // Drop shadow for slot plate
      ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
      ctx.beginPath();
      ctx.ellipse(slot.x, slot.y + 6, 85, 45, 0, 0, Math.PI * 2);
      ctx.fill();

      // Golden tray plate outline
      ctx.strokeStyle = 'rgba(255, 213, 79, 0.45)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(slot.x, slot.y, 82, 42, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Slot index text
      ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.font = 'bold 20px "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`Slot ${i + 1}`, slot.x, slot.y + 7);

      ctx.restore();
    }
  }

  drawTrayStacks() {
    const { ctx } = this;
    for (let stackIdx = 0; stackIdx < this.trayStacks.length; stackIdx++) {
      const stack = this.trayStacks[stackIdx];
      const basePos = STACK_POSITIONS[stackIdx] || { x: 240 + stackIdx * 200, y: 1720 };

      // Draw stack base shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.beginPath();
      ctx.ellipse(basePos.x, basePos.y + 10, 95, 45, 0, 0, Math.PI * 2);
      ctx.fill();

      // Draw trays from bottom to top
      for (let i = 0; i < stack.length; i++) {
        const trayColor = stack[i];
        const colorName = COLOR_NAMES[trayColor];
        const trayY = basePos.y - i * 14;

        // Render tray (Default animation, empty tray)
        // Original size 650x650 scaled down to fit stack
        const trayScale = 0.32;
        assets.drawFrame(
          ctx,
          colorName,
          'Default',
          0,
          basePos.x,
          trayY,
          650 * trayScale,
          650 * trayScale
        );
      }

      // Count badge above stack
      if (stack.length > 0) {
        const topY = basePos.y - (stack.length - 1) * 14 - 45;
        ctx.fillStyle = 'rgba(30, 19, 12, 0.85)';
        ctx.beginPath();
        ctx.arc(basePos.x, topY, 18, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffd54f';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#fff';
        ctx.font = 'bold 16px "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`${stack.length}`, basePos.x, topY + 6);
      }
    }
  }

  drawConveyorCups() {
    const { ctx } = this;

    // Draw dispenser trigger indicator (spr_trigger at 540, 1080)
    assets.drawFrame(ctx, 'spr_trigger', 'Animation 1', 0, DISPENSER_POS.x, DISPENSER_POS.y + 40, 75, 75, 0.6);

    // Draw conveyor cups from back to front (so front cups render over back cups)
    for (let i = this.conveyorCups.length - 1; i >= 0; i--) {
      const cup = this.conveyorCups[i];
      const animName = CUP_ANIM_NAMES[cup.color] || 'cup_1';

      // Soft cup shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
      ctx.beginPath();
      ctx.ellipse(cup.x, cup.y + 24, 32, 12, 0, 0, Math.PI * 2);
      ctx.fill();

      // Render cup sprite (100x155 scaled)
      const cupScale = 0.82;
      assets.drawFrame(
        ctx,
        'main_cup',
        animName,
        0,
        cup.x,
        cup.y,
        100 * cupScale,
        155 * cupScale
      );
    }
  }

  drawFlyingCups() {
    const { ctx } = this;
    for (const fc of this.flyingCups) {
      const animName = CUP_ANIM_NAMES[fc.color] || 'cup_1';
      const cupScale = 0.85 * (fc.scale || 1);

      // Flying cup shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.beginPath();
      ctx.ellipse(fc.x, fc.targetY + 10, 28 * fc.scale, 10 * fc.scale, 0, 0, Math.PI * 2);
      ctx.fill();

      assets.drawFrame(
        ctx,
        'main_cup',
        animName,
        0,
        fc.x,
        fc.y,
        100 * cupScale,
        155 * cupScale
      );
    }
  }

  drawActiveTrays() {
    const { ctx } = this;
    for (let slotIdx = 0; slotIdx < this.maxSlots; slotIdx++) {
      const tray = this.counterSlots[slotIdx];
      if (!tray) continue;

      const scale = tray.scale || 0.38;
      // Draw shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.beginPath();
      ctx.ellipse(tray.x, tray.y + 12, 85, 38, 0, 0, Math.PI * 2);
      ctx.fill();

      // Draw tray with current animation & frameIndex
      assets.drawFrame(
        ctx,
        tray.colorName,
        tray.animName,
        tray.frameIndex,
        tray.x,
        tray.y,
        650 * scale,
        650 * scale
      );

      // Fill counter text indicator above tray (e.g. "3/6")
      if (!tray.isCompleting && !tray.inTransit) {
        ctx.fillStyle = 'rgba(28, 19, 14, 0.85)';
        ctx.beginPath();
        ctx.roundRect(tray.x - 28, tray.y - 75, 56, 24, 6);
        ctx.fill();
        ctx.strokeStyle = '#ffb74d';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.fillStyle = tray.cupsFilled === 5 ? '#ff5252' : '#ffffff';
        ctx.font = 'bold 15px "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`${tray.cupsFilled}/6`, tray.x, tray.y - 58);
      }
    }
  }
}

