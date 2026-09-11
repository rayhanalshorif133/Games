// game.js - Core Game Engine for 2D Mobile Drop & Merge Numbers
(function () {
  'use strict';

  const COLS = 5;
  const MAX_ROWS = 8;

  // DOM Elements
  const gridWrapper = document.getElementById('grid-wrapper');
  const tracksContainer = document.getElementById('tracks-container');
  const blocksContainer = document.getElementById('blocks-container');
  const previewSlot = document.getElementById('preview-slot');
  const guideFinger = document.getElementById('guide-finger');
  const launcherBar = document.getElementById('launcher-bar');
  const projectileBlock = document.getElementById('projectile-block');
  const currentScoreEl = document.getElementById('current-score');
  const bestScoreEl = document.getElementById('best-score');
  const coinCountEl = document.getElementById('coin-count');
  const milestoneValEl = document.getElementById('milestone-val');
  const boosterBanner = document.getElementById('booster-overlay-banner');
  const boosterCancelBtn = document.getElementById('booster-cancel-btn');
  const particleCanvas = document.getElementById('particle-canvas');
  const aimLaser = document.getElementById('aim-laser');
  const dangerLine = document.getElementById('danger-line');

  // Modals
  const pauseBtn = document.getElementById('pause-btn');
  const pauseModal = document.getElementById('pause-modal');
  const resumeBtn = document.getElementById('resume-btn');
  const soundToggleBtn = document.getElementById('sound-toggle-btn');
  const restartBtn = document.getElementById('restart-btn');
  const gameOverModal = document.getElementById('game-over-modal');
  const finalScoreVal = document.getElementById('final-score-val');
  const highScoreVal = document.getElementById('high-score-val');
  const continueGameBtn = document.getElementById('continue-game-btn');
  const playAgainBtn = document.getElementById('play-again-btn');
  const milestoneModal = document.getElementById('milestone-modal');
  const milestoneText = document.getElementById('milestone-text');
  const claimMilestoneBtn = document.getElementById('claim-milestone-btn');

  // Booster Buttons
  const hammerBtn = document.getElementById('booster-hammer');
  const swapBtn = document.getElementById('booster-swap');
  const undoBtn = document.getElementById('booster-undo');

  // Engine state
  let particleEngine = null;
  let board = [[], [2], [4], [2], []]; // board[col] = [row0, row1, ...]
  let score = 0;
  let bestScore = 0;
  let coins = 100;
  let targetMilestone = 128;
  let projectileValue = 2;
  let selectedCol = 1;
  let isShooting = false;
  let isHammerMode = false;
  let historyState = null;
  let isFirstLaunch = true;

  // Initialize Particle Engine
  if (window.ParticleEngine && particleCanvas) {
    particleEngine = new ParticleEngine(particleCanvas);
  }

  // Load from Storage or Defaults (clean start with 3 boxes: 2, 4, 2)
  function loadState() {
    try {
      const saved = localStorage.getItem('dropMerge_saved_state_v2');
      if (saved) {
        const data = JSON.parse(saved);
        board = data.board || board;
        score = data.score !== undefined ? data.score : 0;
        bestScore = data.bestScore !== undefined ? data.bestScore : 0;
        coins = data.coins !== undefined ? data.coins : 100;
        targetMilestone = data.targetMilestone || 128;
        projectileValue = data.projectileValue || 2;
        isFirstLaunch = false;
      } else {
        // Clean start: 3 boxes arranged with 2 and 4
        board = [
          [],
          [2],
          [4],
          [2],
          []
        ];
        score = 0;
        bestScore = 0;
        coins = 100;
        targetMilestone = 128;
        projectileValue = 2;
        selectedCol = 1;
        isFirstLaunch = true;
      }
    } catch (e) {
      console.warn('LocalStorage error', e);
    }
  }

  function saveState() {
    try {
      const data = {
        board,
        score,
        bestScore,
        coins,
        targetMilestone,
        projectileValue
      };
      localStorage.setItem('dropMerge_saved_state_v2', JSON.stringify(data));
    } catch (e) {}
  }

  // Save undo checkpoint before an action
  function pushHistory() {
    historyState = {
      board: board.map(col => [...col]),
      score,
      coins,
      projectileValue,
      targetMilestone
    };
  }

  // Value color mappings
  function getBlockTheme(val) {
    return `val-${val}`;
  }

  function getTileColorHex(val) {
    const map = {
      2: '#22d3ee',
      4: '#38bdf8',
      8: '#6366f1',
      16: '#8b5cf6',
      32: '#d946ef',
      64: '#f43f5e',
      128: '#f97316',
      256: '#facc15',
      512: '#10b981',
      1024: '#06b6d4',
      2048: '#ec4899',
      4096: '#f59e0b'
    };
    return map[val] || '#6366f1';
  }

  // Coordinate Calculation Utilities (Construct 3 Compact Tile Sizing with Snug Gaps)
  function getLayoutMetrics() {
    const rect = gridWrapper.getBoundingClientRect();
    const paddingX = 8;
    const paddingY = 6;
    const availableWidth = rect.width - (paddingX * 2);
    const colStep = availableWidth / COLS;

    // Slightly reduced side-by-side gap and reduced row gap as requested
    const blockSize = Math.round(colStep * 0.85);
    const xOffset = Math.round((colStep - blockSize) / 2);
    const yGap = 2; // Snug vertical gap between consecutive rows
    const rowHeight = blockSize;

    return {
      rect,
      paddingX,
      paddingY,
      colStep,
      blockSize,
      xOffset,
      yGap,
      colWidth: blockSize,
      rowHeight
    };
  }

  function getBlockPos(col, row) {
    const { paddingX, paddingY, colStep, blockSize, xOffset, yGap } = getLayoutMetrics();
    const x = Math.round(paddingX + col * colStep + xOffset);
    const y = Math.round(paddingY + row * (blockSize + yGap));
    return { x, y, width: blockSize, height: blockSize };
  }

  // Render full board with Construct 3 Stylized Candy Tiles
  function renderBoard() {
    blocksContainer.innerHTML = '';

    for (let c = 0; c < COLS; c++) {
      for (let r = 0; r < board[c].length; r++) {
        const val = board[c][r];
        const pos = getBlockPos(c, r);

        const el = document.createElement('div');
        const isMatch = (val === projectileValue);
        let fontClass = '';
        if (val >= 1000) fontClass = 'text-sm';
        else if (val >= 100) fontClass = 'text-md';

        el.className = `block ${getBlockTheme(val)}${fontClass ? ' ' + fontClass : ''}${isMatch ? ' match-hint' : ''}`;
        el.textContent = val;
        el.style.width = `${pos.width}px`;
        el.style.height = `${pos.height}px`;
        el.style.left = `${pos.x}px`;
        el.style.top = `${pos.y}px`;
        el.dataset.col = c;
        el.dataset.row = r;

        if (isHammerMode) {
          el.style.cursor = 'crosshair';
          el.style.filter = 'brightness(1.2) drop-shadow(0 0 6px #ef4444)';
        }

        el.addEventListener('click', (e) => {
          if (isHammerMode) {
            e.stopPropagation();
            useHammerOnBlock(c, r);
          }
        });

        blocksContainer.appendChild(el);
      }
    }

    updateUI();
    updatePreviewSlot();
  }

  // Update UI Counters & Indicators
  function updateUI() {
    currentScoreEl.textContent = score;
    bestScoreEl.textContent = bestScore;
    coinCountEl.textContent = coins;
    milestoneValEl.textContent = targetMilestone;

    const metrics = getLayoutMetrics();

    // Projectile Block (Construct 3 Sizing & Centering)
    let fontClass = '';
    if (projectileValue >= 1000) fontClass = 'text-sm';
    else if (projectileValue >= 100) fontClass = 'text-md';

    projectileBlock.className = `block ${getBlockTheme(projectileValue)}${fontClass ? ' ' + fontClass : ''}`;
    projectileBlock.textContent = projectileValue;
    projectileBlock.style.width = `${metrics.blockSize}px`;
    projectileBlock.style.height = `${metrics.blockSize}px`;
    projectileBlock.style.left = `${metrics.xOffset}px`;
    projectileBlock.style.top = `calc(50% - ${metrics.blockSize / 2}px)`;

    // Move projectile block into the selected launcher slot
    const slots = launcherBar.querySelectorAll('.launcher-slot');
    slots.forEach((s, idx) => {
      const isActive = (idx === selectedCol);
      s.classList.toggle('active-slot', isActive);
      if (isActive && projectileBlock.parentElement !== s) {
        s.appendChild(projectileBlock);
      }
    });

    // Active column track highlight
    const tracks = tracksContainer.querySelectorAll('.grid-track');
    tracks.forEach((t, idx) => {
      t.classList.toggle('active-track', idx === selectedCol);
    });

    // Update Game Over Danger / Deadline Threshold Line
    if (dangerLine) {
      const lastRowPos = getBlockPos(0, MAX_ROWS - 1);
      const deadlineY = Math.round(lastRowPos.y + lastRowPos.height + 2);
      dangerLine.style.top = `${deadlineY}px`;

      // Check urgency: if any column has 5 or more blocks, activate danger pulse
      let maxLen = 0;
      for (let c = 0; c < COLS; c++) {
        if (board[c].length > maxLen) maxLen = board[c].length;
      }
      dangerLine.classList.toggle('danger-urgent', maxLen >= MAX_ROWS - 2);
    }
  }

  // Update Dashed Preview Slot & Aim Laser Beam
  function updatePreviewSlot() {
    if (isShooting || isHammerMode) {
      previewSlot.style.display = 'none';
      guideFinger.style.display = 'none';
      if (aimLaser) aimLaser.style.display = 'none';
      return;
    }

    const landingRow = board[selectedCol].length;
    if (landingRow >= MAX_ROWS) {
      previewSlot.style.display = 'none';
      guideFinger.style.display = 'none';
      if (aimLaser) aimLaser.style.display = 'none';
      return;
    }

    const pos = getBlockPos(selectedCol, landingRow);
    previewSlot.style.display = 'block';
    previewSlot.style.width = `${pos.width}px`;
    previewSlot.style.height = `${pos.height}px`;
    previewSlot.style.left = `${pos.x}px`;
    previewSlot.style.top = `${pos.y}px`;

    // Construct 3 Style Aiming Laser Beam
    if (aimLaser) {
      const { rect, paddingX, colStep } = getLayoutMetrics();
      const centerX = Math.round(paddingX + selectedCol * colStep + colStep / 2);
      const topY = pos.y + pos.height + 4;
      const bottomY = rect.height;
      const laserHeight = Math.max(0, bottomY - topY);

      aimLaser.style.display = 'block';
      aimLaser.style.left = `${centerX}px`;
      aimLaser.style.top = `${topY}px`;
      aimLaser.style.height = `${laserHeight}px`;

      const tileColor = getTileColorHex(projectileValue);
      aimLaser.style.background = `repeating-linear-gradient(to bottom, ${tileColor} 0px, ${tileColor} 8px, transparent 8px, transparent 16px)`;
      aimLaser.style.boxShadow = `0 0 10px ${tileColor}`;
    }

    // Show guide finger on first load (reproducing screenshot)
    if (isFirstLaunch && selectedCol === 1 && landingRow === 1) {
      guideFinger.style.display = 'block';
      guideFinger.style.left = `${pos.x + pos.width * 0.65}px`;
      guideFinger.style.top = `${pos.y + pos.height * 0.75}px`;
    } else {
      guideFinger.style.display = 'none';
    }
  }

  // Random Next Projectile Generator
  function getNextProjectileValue() {
    // Generate pool based on existing board numbers
    const existing = new Set([2, 4, 8]);
    for (let c = 0; c < COLS; c++) {
      for (const val of board[c]) {
        if (val <= 64) existing.add(val);
      }
    }

    const pool = Array.from(existing);
    // Weighted probabilities: favoring 2, 4, 8
    const rand = Math.random();
    if (rand < 0.38) return 2;
    if (rand < 0.70) return 4;
    if (rand < 0.90) return 8;
    if (pool.includes(16) && rand < 0.97) return 16;
    return pool.includes(32) ? 32 : 8;
  }

  // Shoot Action
  function shootBlock(targetCol = selectedCol) {
    if (isShooting || isHammerMode) return;

    if (board[targetCol].length >= MAX_ROWS) {
      // Column is full - shake grid
      gridWrapper.classList.add('shake-grid');
      setTimeout(() => gridWrapper.classList.remove('shake-grid'), 300);
      return;
    }

    isFirstLaunch = false;
    guideFinger.style.display = 'none';
    if (aimLaser) aimLaser.style.display = 'none';
    pushHistory();
    isShooting = true;

    if (window.soundEngine) {
      soundEngine.playShoot();
    }

    const landingRow = board[targetCol].length;
    const destPos = getBlockPos(targetCol, landingRow);

    // Hide preview while flying
    previewSlot.style.display = 'none';

    // Create flying clone block
    let fontClass = '';
    if (projectileValue >= 1000) fontClass = 'text-sm';
    else if (projectileValue >= 100) fontClass = 'text-md';

    const flyingEl = document.createElement('div');
    flyingEl.className = `block ${getBlockTheme(projectileValue)}${fontClass ? ' ' + fontClass : ''}`;
    flyingEl.textContent = projectileValue;
    flyingEl.style.width = `${destPos.width}px`;
    flyingEl.style.height = `${destPos.height}px`;

    // Start coordinates from current projectile position
    const projRect = projectileBlock.getBoundingClientRect();
    const gridRect = gridWrapper.getBoundingClientRect();
    const canvasRect = particleCanvas ? particleCanvas.getBoundingClientRect() : gridRect;
    const startX = projRect.left - gridRect.left;
    const startY = projRect.top - gridRect.top;

    // Ball starts small and scales up while flying and emitting trail particles
    const startScale = 0.52;
    flyingEl.style.left = `${startX}px`;
    flyingEl.style.top = `${startY}px`;
    flyingEl.style.transform = `scale(${startScale})`;
    flyingEl.style.transformOrigin = 'center center';
    flyingEl.style.zIndex = '35';
    flyingEl.classList.add('block-flying');

    gridWrapper.appendChild(flyingEl);
    projectileBlock.style.opacity = '0';

    const duration = 240; // flight duration in ms
    const startTime = performance.now();
    const tileColor = getTileColorHex(projectileValue);

    function animateFlight(now) {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      // Smooth cubic ease out
      const ease = 1 - Math.pow(1 - progress, 3);

      const currentX = startX + (destPos.x - startX) * ease;
      const currentY = startY + (destPos.y - startY) * ease;
      // Scales gradually from 0.52 to 1.0
      const currentScale = startScale + (1.0 - startScale) * ease;

      flyingEl.style.left = `${currentX}px`;
      flyingEl.style.top = `${currentY}px`;
      flyingEl.style.transform = `scale(${currentScale})`;

      // Trail particle effect emitted continuously along the flight path
      if (particleEngine) {
        const cx = (gridRect.left - canvasRect.left) + currentX + destPos.width / 2;
        const cy = (gridRect.top - canvasRect.top) + currentY + destPos.height / 2;
        particleEngine.addTrail(cx, cy, tileColor, destPos.width * currentScale * 0.35);
      }

      if (progress < 1) {
        requestAnimationFrame(animateFlight);
      } else {
        // Landing impact
        if (window.soundEngine) {
          soundEngine.playLand();
        }

        if (particleEngine) {
          const cx = (gridRect.left - canvasRect.left) + destPos.x + destPos.width / 2;
          const cy = (gridRect.top - canvasRect.top) + destPos.y + destPos.height / 2;
          particleEngine.burst(cx, cy, tileColor, 12);
        }

        flyingEl.remove();
        board[targetCol].push(projectileValue);
        renderBoard();

        // Construct 3 Squash & Stretch on Impact
        const landedEl = blocksContainer.querySelector(`[data-col="${targetCol}"][data-row="${landingRow}"]`);
        if (landedEl) {
          landedEl.classList.add('block-squash');
        }

        // Process recursive merges
        processCascadeMerges(targetCol, landingRow, () => {
          // Post merge checks
          checkMilestoneUnlocked();
          checkGameOver();

          // Spawn next projectile
          projectileValue = getNextProjectileValue();
          projectileBlock.style.opacity = '1';
          isShooting = false;
          renderBoard();
          saveState();
        });
      }
    }

    requestAnimationFrame(animateFlight);
  }

  // Recursive Cascade Merging Algorithm
  function processCascadeMerges(initCol, initRow, onComplete) {
    let comboCount = 0;

    function checkStep() {
      // Find connected group for the last affected position or any match
      const mergesFound = findMerges();

      if (mergesFound.length === 0) {
        onComplete();
        return;
      }

      comboCount++;
      executeMergeBatch(mergesFound, comboCount, () => {
        // Compact columns so blocks tightly hang from top ceiling
        compactBoard();
        renderBoard();

        // Add pop bounce to newly merged blocks
        mergesFound.forEach(m => {
          const el = blocksContainer.querySelector(`[data-col="${m.target.c}"][data-row="${m.target.r}"]`);
          if (el) el.classList.add('block-merge-pop');
        });

        // Check for subsequent chain reactions after gravity compaction
        setTimeout(checkStep, 100);
      });
    }

    checkStep();
  }

  // Find all adjacent matching groups
  function findMerges() {
    const merges = [];
    const visited = Array.from({ length: COLS }, () => []);

    for (let c = 0; c < COLS; c++) {
      for (let r = 0; r < board[c].length; r++) {
        if (visited[c][r]) continue;

        const val = board[c][r];
        const group = [];
        const queue = [{ c, r }];
        visited[c][r] = true;

        while (queue.length > 0) {
          const curr = queue.shift();
          group.push(curr);

          // Check 4 orthogonal neighbors
          const neighbors = [
            { c: curr.c - 1, r: curr.r },
            { c: curr.c + 1, r: curr.r },
            { c: curr.c, r: curr.r - 1 },
            { c: curr.c, r: curr.r + 1 }
          ];

          for (const n of neighbors) {
            if (
              n.c >= 0 && n.c < COLS &&
              n.r >= 0 && n.r < board[n.c].length &&
              !visited[n.c][n.r] &&
              board[n.c][n.r] === val
            ) {
              visited[n.c][n.r] = true;
              queue.push(n);
            }
          }
        }

        if (group.length >= 2) {
          // Merge target is the lowest row (closest to top ceiling) or deepest block
          // Sorting so target is the top-most (lowest row index) or most recently added
          group.sort((a, b) => a.r - b.r || a.c - b.c);
          merges.push({
            value: val,
            target: group[0],
            sources: group.slice(1)
          });
        }
      }
    }

    return merges;
  }

  // Execute Merge Batch with Visual Juice & Sounds
  function executeMergeBatch(merges, comboCount, done) {
    let completedCount = 0;

    merges.forEach((m) => {
      const totalCount = m.sources.length + 1;
      // Formula: 2 blocks = 2*val, 3 blocks = 4*val, 4 blocks = 8*val
      const multiplier = Math.pow(2, totalCount - 1);
      const newVal = m.value * multiplier;

      // Update board data
      board[m.target.c][m.target.r] = newVal;

      // Mark sources for deletion
      m.sources.forEach(src => {
        board[src.c][src.r] = null;
      });

      // Score additions
      const pointsEarned = newVal * comboCount;
      score += pointsEarned;
      if (score > bestScore) {
        bestScore = score;
      }

      // Coin reward
      const coinGain = Math.max(1, Math.floor(newVal / 16)) * comboCount;
      coins += coinGain;

      // Transmit score update via ScoreSendAPI
      if (typeof window.sendScore === 'function') {
        window.sendScore(score, Math.round(Math.log2(targetMilestone)), {
          coins,
          maxTile: newVal,
          combo: comboCount,
          pointsEarned
        });
      }

      // Pop score effect
      currentScoreEl.classList.add('pop');
      setTimeout(() => currentScoreEl.classList.remove('pop'), 200);

      // Sound & Juice
      if (window.soundEngine) {
        soundEngine.playMerge(newVal);
        if (comboCount > 1) {
          soundEngine.playCombo(comboCount);
        }
      }

      if (navigator.vibrate) {
        navigator.vibrate(comboCount > 1 ? [20, 30, 40] : 25);
      }

      // Particle Bursts & Floating Text
      if (particleEngine) {
        const targetPos = getBlockPos(m.target.c, m.target.r);
        const gridRect = gridWrapper.getBoundingClientRect();
        const canvasRect = particleCanvas.getBoundingClientRect();
        const centerX = (gridRect.left - canvasRect.left) + targetPos.x + targetPos.width / 2;
        const centerY = (gridRect.top - canvasRect.top) + targetPos.y + targetPos.height / 2;

        particleEngine.burst(centerX, centerY, getTileColorHex(newVal), 24);

        if (comboCount > 1) {
          const comboLabels = ['', '', 'COMBO x2!', 'GREAT x3!', 'AWESOME x4!', 'UNSTOPPABLE!'];
          const label = comboLabels[Math.min(comboCount, comboLabels.length - 1)];
          particleEngine.addText(centerX, centerY - 25, label, '#facc15', 30);
        } else {
          particleEngine.addText(centerX, centerY - 20, `+${pointsEarned}`, '#ffffff', 24);
        }
      }

      completedCount++;
      if (completedCount === merges.length) {
        setTimeout(done, 180);
      }
    });
  }

  // Remove empty/null slots so all blocks hang tightly from row 0 down
  function compactBoard() {
    for (let c = 0; c < COLS; c++) {
      board[c] = board[c].filter(val => val !== null && val !== undefined);
    }
  }

  // Check Milestone Unlock
  function checkMilestoneUnlocked() {
    let maxVal = 0;
    for (let c = 0; c < COLS; c++) {
      for (const val of board[c]) {
        if (val > maxVal) maxVal = val;
      }
    }

    if (maxVal >= targetMilestone) {
      if (window.soundEngine) soundEngine.playMilestone();
      if (particleEngine) particleEngine.confetti(2500);

      milestoneText.textContent = `You reached block ${targetMilestone}!`;
      milestoneModal.classList.add('open');

      if (typeof window.sendScore === 'function') {
        window.sendScore(score, Math.round(Math.log2(targetMilestone)), {
          milestoneReached: targetMilestone,
          coins,
          maxTile: maxVal
        });
      }
    }
  }

  // Check Game Over
  function checkGameOver() {
    let isFull = false;
    for (let c = 0; c < COLS; c++) {
      if (board[c].length >= MAX_ROWS) {
        isFull = true;
        break;
      }
    }

    if (isFull) {
      if (window.soundEngine) soundEngine.playGameOver();
      finalScoreVal.textContent = score;
      highScoreVal.textContent = bestScore;
      gameOverModal.classList.add('open');

      if (typeof window.sendScore === 'function') {
        window.sendScore(score, Math.round(Math.log2(targetMilestone)), {
          isGameOver: true,
          coins,
          highScore: bestScore
        });
      }
    }
  }

  // Boosters Implementation
  function activateHammerBooster() {
    if (coins < 200) {
      flashElement(coinCountEl, '#ef4444');
      return;
    }
    isHammerMode = true;
    hammerBtn.classList.add('active');
    boosterBanner.style.display = 'flex';
    renderBoard();
  }

  function deactivateHammerMode() {
    isHammerMode = false;
    hammerBtn.classList.remove('active');
    boosterBanner.style.display = 'none';
    renderBoard();
  }

  function useHammerOnBlock(col, row) {
    if (!isHammerMode) return;
    pushHistory();
    coins -= 200;

    if (window.soundEngine) soundEngine.playHammer();

    if (particleEngine) {
      const pos = getBlockPos(col, row);
      const gridRect = gridWrapper.getBoundingClientRect();
      const canvasRect = particleCanvas.getBoundingClientRect();
      const cx = (gridRect.left - canvasRect.left) + pos.x + pos.width / 2;
      const cy = (gridRect.top - canvasRect.top) + pos.y + pos.height / 2;
      particleEngine.burst(cx, cy, '#ef4444', 30);
      particleEngine.addText(cx, cy - 20, 'SMASH!', '#ef4444', 28);
    }

    gridWrapper.classList.add('shake-grid');
    setTimeout(() => gridWrapper.classList.remove('shake-grid'), 250);

    // Remove block
    board[col].splice(row, 1);
    deactivateHammerMode();

    // Check for cascade merges resulting from compaction
    processCascadeMerges(col, row, () => {
      renderBoard();
      saveState();
    });
  }

  function activateSwapBooster() {
    if (coins < 225) {
      flashElement(coinCountEl, '#ef4444');
      return;
    }
    pushHistory();
    coins -= 225;

    if (window.soundEngine) soundEngine.playSwap();

    // Change projectile to a new random value or double current value
    const options = [2, 4, 8, 16, 32, 64].filter(v => v !== projectileValue);
    projectileValue = options[Math.floor(Math.random() * options.length)];

    if (particleEngine) {
      const projRect = projectileBlock.getBoundingClientRect();
      const canvasRect = particleCanvas.getBoundingClientRect();
      const cx = projRect.left - canvasRect.left + projRect.width / 2;
      const cy = projRect.top - canvasRect.top + projRect.height / 2;
      particleEngine.burst(cx, cy, getTileColorHex(projectileValue), 20);
    }

    updateUI();
    saveState();
  }

  function activateUndoBooster() {
    if (coins < 20) {
      flashElement(coinCountEl, '#ef4444');
      return;
    }
    if (!historyState) {
      flashElement(undoBtn, '#ef4444');
      return;
    }

    coins -= 20;
    if (window.soundEngine) soundEngine.playUndo();

    board = historyState.board.map(col => [...col]);
    score = historyState.score;
    projectileValue = historyState.projectileValue;
    targetMilestone = historyState.targetMilestone;
    historyState = null;

    renderBoard();
    saveState();
  }

  function flashElement(el, color) {
    const origColor = el.style.color;
    el.style.color = color;
    el.style.transform = 'scale(1.15)';
    setTimeout(() => {
      el.style.color = origColor;
      el.style.transform = '';
    }, 250);
  }

  // Pointer & Touch Controls
  function handleInputMove(clientX) {
    if (isShooting || isHammerMode) return;
    const { rect, paddingX, colStep } = getLayoutMetrics();
    const relativeX = clientX - rect.left - paddingX;
    let col = Math.floor(relativeX / colStep);
    col = Math.max(0, Math.min(COLS - 1, col));

    if (col !== selectedCol) {
      selectedCol = col;
      updateUI();
      updatePreviewSlot();
    }
  }

  // Setup Event Listeners
  function setupEvents() {
    // Column track clicks
    tracksContainer.querySelectorAll('.grid-track').forEach((track, idx) => {
      track.addEventListener('pointerdown', (e) => {
        selectedCol = idx;
        updateUI();
        updatePreviewSlot();
      });
    });

    // Launcher slot clicks & dragging
    launcherBar.querySelectorAll('.launcher-slot').forEach((slot, idx) => {
      slot.addEventListener('pointerdown', (e) => {
        selectedCol = idx;
        updateUI();
        updatePreviewSlot();
      });
    });

    // Drag / Touch aiming on Grid & Launcher
    let isPointerActive = false;

    const startPointerAim = (e) => {
      if (isHammerMode) return;
      isPointerActive = true;
      handleInputMove(e.clientX);
    };

    gridWrapper.addEventListener('pointerdown', startPointerAim);
    launcherBar.addEventListener('pointerdown', startPointerAim);

    window.addEventListener('pointermove', (e) => {
      if (isPointerActive) {
        handleInputMove(e.clientX);
      }
    });

    window.addEventListener('pointerup', (e) => {
      if (isPointerActive) {
        isPointerActive = false;
        // Shoot on release or tap
        shootBlock(selectedCol);
      }
    });

    // Keyboard support for desktop testing (Arrow keys & Space / 1-5)
    window.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') {
        selectedCol = Math.max(0, selectedCol - 1);
        updateUI();
        updatePreviewSlot();
      } else if (e.key === 'ArrowRight') {
        selectedCol = Math.min(COLS - 1, selectedCol + 1);
        updateUI();
        updatePreviewSlot();
      } else if (e.key === ' ' || e.key === 'Enter' || e.key === 'ArrowUp') {
        shootBlock(selectedCol);
      } else if (['1', '2', '3', '4', '5'].includes(e.key)) {
        selectedCol = parseInt(e.key, 10) - 1;
        updateUI();
        updatePreviewSlot();
        shootBlock(selectedCol);
      }
    });

    // Booster Click Listeners
    hammerBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (isHammerMode) {
        deactivateHammerMode();
      } else {
        activateHammerBooster();
      }
    });

    boosterCancelBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      deactivateHammerMode();
    });

    swapBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      activateSwapBooster();
    });

    undoBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      activateUndoBooster();
    });

    // Pause Modal Controls
    pauseBtn.addEventListener('click', () => {
      pauseModal.classList.add('open');
    });

    resumeBtn.addEventListener('click', () => {
      pauseModal.classList.remove('open');
    });

    soundToggleBtn.addEventListener('click', () => {
      if (window.soundEngine) {
        const muted = soundEngine.toggleMute();
        soundToggleBtn.textContent = muted ? 'Sound: OFF 🔇' : 'Sound: ON 🔊';
      }
    });

    restartBtn.addEventListener('click', () => {
      pauseModal.classList.remove('open');
      restartGame();
    });

    // Game Over Modal Controls
    continueGameBtn.addEventListener('click', () => {
      if (coins >= 100) {
        coins -= 100;
        // Clear bottom 3 rows across all columns
        for (let c = 0; c < COLS; c++) {
          if (board[c].length > 2) {
            board[c] = board[c].slice(0, Math.max(1, board[c].length - 3));
          }
        }
        gameOverModal.classList.remove('open');
        renderBoard();
        saveState();
      } else {
        flashElement(continueGameBtn, '#f87171');
      }
    });

    playAgainBtn.addEventListener('click', () => {
      gameOverModal.classList.remove('open');
      restartGame();
    });

    // Milestone Claim Button
    claimMilestoneBtn.addEventListener('click', () => {
      coins += 150;
      targetMilestone *= 2; // Next goal e.g. 1024, 2048, 4096
      milestoneModal.classList.remove('open');
      updateUI();
      saveState();
    });

    // Window Resize Handler
    window.addEventListener('resize', () => {
      renderBoard();
    });
  }

  function restartGame() {
    board = [
      [],
      [2],
      [4],
      [2],
      []
    ];
    score = 0;
    projectileValue = 2;
    selectedCol = 1;
    historyState = null;
    isFirstLaunch = false;
    renderBoard();
    saveState();
  }

  // Init
  loadState();
  setupEvents();
  renderBoard();

  // Expose API for testing and debugging
  window.dropMergeGame = {
    shootBlock,
    activateHammerBooster,
    activateSwapBooster,
    activateUndoBooster,
    restartGame,
    getBoard: () => board,
    getScore: () => score,
    getCoins: () => coins
  };

  // Automated test hook if query param present
  if (window.location.search.includes('test_shoot')) {
    setTimeout(() => {
      shootBlock(1);
    }, 250);
  }
  if (window.location.search.includes('test_danger')) {
    board = [
      [2, 4, 8, 16, 32, 64],
      [8, 16, 32, 64, 128, 256, 512],
      [2, 4, 8, 16, 32, 64, 128, 256],
      [8, 4, 2],
      [16]
    ];
    renderBoard();
  }
  if (window.location.search.includes('test_midflight')) {
    setTimeout(() => {
      shootBlock(1);
    }, 50);
  }

})();
