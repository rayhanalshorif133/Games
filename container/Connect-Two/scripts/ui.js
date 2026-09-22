/**
 * Construct 3 UI Manager & Modals (Endless Arcade Mode with Color Target Counters)
 */
class UIManager {
  constructor(container, gameState, audioEngine, onRestart) {
    this.container = container;
    this.gameState = gameState;
    this.audioEngine = audioEngine;
    this.onRestart = onRestart;

    this.createDomStructure();
    this.bindEvents();
    this.updateHUD();
  }

  createDomStructure() {
    this.container.innerHTML = `
      <!-- Top HUD Header -->
      <header class="game-header">
        <button class="header-btn exit-game-btn" id="exitGameBtn" aria-label="Exit Game">
          <i class="fa-solid fa-xmark header-btn-icon"></i>
        </button>

        <!-- Timer Card (Center) -->
        <div class="hud-card timer-card" id="timerCard">
          <div class="hud-icon-wrap">
            <svg class="timer-svg-icon" viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="#F8CF47" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
          </div>
          <span class="hud-value timer-value" id="timerValue">05:00</span>
        </div>

        <!-- Trophy / Score Card (Right) -->
        <div class="hud-card score-card" id="scoreCard">
          <div class="hud-icon-wrap">
            <img src="images/icon_trophy.png" alt="Score" class="hud-icon-img" />
          </div>
          <span class="hud-value" id="scoreValue">0</span>
        </div>
      </header>

      <!-- Main Game Canvas Container -->
      <div class="canvas-container">
        <canvas id="gameCanvas"></canvas>
      </div>

      <!-- Bottom Bar Controls -->
      <footer class="game-footer">
        <!-- Pause Button (Left) -->
        <button class="footer-btn pause-btn" id="pauseBtn" aria-label="Pause">
          <img src="images/icon_pause.png" alt="Pause" class="footer-btn-img" />
        </button>

        <!-- Color Box Targets Card (Center Footer) -->
        <div class="hud-card color-targets-card">
          <div class="color-targets-list" id="colorTargetsList"></div>
        </div>

        <!-- Sound Button (Right) -->
        <button class="footer-btn sound-btn" id="soundBtn" aria-label="Toggle Sound">
          <img src="images/icon_sound_on.png" alt="Sound" id="soundIconImg" class="footer-btn-img" />
        </button>
      </footer>

      <!-- Modals Overlay -->
      <div class="modal-overlay" id="modalOverlay"></div>
    `;

    this.exitGameBtnEl = this.container.querySelector('#exitGameBtn');
    this.colorTargetsContainerEl = this.container.querySelector('#colorTargetsList');
    this.timerValueEl = this.container.querySelector('#timerValue');
    this.timerCardEl = this.container.querySelector('#timerCard');
    this.scoreValueEl = this.container.querySelector('#scoreValue');
    this.soundBtnEl = this.container.querySelector('#soundBtn');
    this.soundIconImg = this.container.querySelector('#soundIconImg');
    this.pauseBtnEl = this.container.querySelector('#pauseBtn');
    this.modalOverlayEl = this.container.querySelector('#modalOverlay');
  }

  formatTime(totalSeconds) {
    const sec = Math.max(0, Math.ceil(totalSeconds));
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  }

  updateTimer(timeRemaining) {
    if (!this.timerValueEl) return;
    const formatted = this.formatTime(timeRemaining);
    if (this.timerValueEl.textContent !== formatted) {
      this.timerValueEl.textContent = formatted;
    }
    if (this.timerCardEl) {
      if (timeRemaining <= 30 && timeRemaining > 0) {
        this.timerCardEl.classList.add('warning');
      } else {
        this.timerCardEl.classList.remove('warning');
      }
    }
  }

  bindEvents() {
    this.gameState.onStateChanged = () => {
      this.updateHUD();
      this.handleStateTransitions();
    };

    // Exit to "/" on click
    this.exitGameBtnEl.addEventListener('click', () => {
      this.audioEngine.playClick();
      window.location.href = '/';
    });

    this.soundBtnEl.addEventListener('click', () => {
      const isMuted = this.audioEngine.toggleMute();
      this.soundIconImg.src = isMuted ? 'images/icon_sound_off.png' : 'images/icon_sound_on.png';
    });

    this.pauseBtnEl.addEventListener('click', () => {
      this.audioEngine.playClick();
      this.gameState.pauseGame();
      this.showPauseModal();
    });
  }

  updateHUD() {
    this.updateTimer(this.gameState.timeRemaining);
    const score = this.gameState.score;
    this.scoreValueEl.textContent = `${score}`;

    this.renderGlassTargets();
  }

  renderGlassTargets() {
    if (!this.colorTargetsContainerEl || !this.gameState.activeColors) return;

    const quota = this.gameState.targetQuota || 15;
    const activeColors = this.gameState.activeColors;

    const existingGlasses = Array.from(this.colorTargetsContainerEl.querySelectorAll('.color-target-glass'));
    
    // If empty or count mismatch, build full set of glass containers
    if (existingGlasses.length === 0 || existingGlasses.length !== activeColors.length) {
      let html = '';
      activeColors.forEach((c) => {
        const remaining = this.gameState.colorTargets[c] ?? quota;
        const collected = Math.max(0, quota - remaining);
        const percent = Math.min(100, Math.max(0, Math.round((collected / quota) * 100)));

        html += `
          <div class="color-target-glass glass-entry" data-color="${c}">
            <div class="glass-rim"></div>
            <div class="glass-body">
              <div class="glass-liquid ${c}" style="height: ${percent}%;">
                <div class="liquid-wave"></div>
              </div>
              <div class="glass-shine"></div>
              <div class="glass-dot-wrap">
                <img src="images/dot_${c}.png" alt="${c}" class="glass-dot-img" />
              </div>
              <div class="glass-progress-badge">${collected}/${quota}</div>
            </div>
          </div>
        `;
      });
      this.colorTargetsContainerEl.innerHTML = html;
      return;
    }

    // Smoothly update liquid levels and progress labels without rebuilding DOM
    activeColors.forEach((c) => {
      const glassEl = this.colorTargetsContainerEl.querySelector(`.color-target-glass[data-color="${c}"]`);
      if (glassEl && !glassEl.classList.contains('glass-full-exit')) {
        const remaining = this.gameState.colorTargets[c] ?? quota;
        const collected = Math.max(0, quota - remaining);
        const percent = Math.min(100, Math.max(0, Math.round((collected / quota) * 100)));

        const liquidEl = glassEl.querySelector('.glass-liquid');
        if (liquidEl) {
          liquidEl.style.height = `${percent}%`;
        }
        const badgeEl = glassEl.querySelector('.glass-progress-badge');
        if (badgeEl) {
          badgeEl.textContent = (percent >= 100) ? 'FULL!' : `${collected}/${quota}`;
        }
      }
    });
  }

  animateGlassCompletion(oldColor, newColor) {
    if (!this.colorTargetsContainerEl) return;
    const oldGlass = this.colorTargetsContainerEl.querySelector(`.color-target-glass[data-color="${oldColor}"]`);
    if (!oldGlass) return;

    // Set 100% full visual triumph
    const liquid = oldGlass.querySelector('.glass-liquid');
    if (liquid) liquid.style.height = '100%';
    const badge = oldGlass.querySelector('.glass-progress-badge');
    if (badge) badge.textContent = 'FULL!';

    // Trigger full exit animation
    oldGlass.classList.remove('glass-entry', 'glass-impact');
    oldGlass.classList.add('glass-full-exit');

    const quota = this.gameState.targetQuota || 15;

    // After exit animation finishes, slide in the new color glass
    setTimeout(() => {
      if (!oldGlass.parentNode) return;
      const newGlassHtml = `
        <div class="color-target-glass glass-entry" data-color="${newColor}">
          <div class="glass-rim"></div>
          <div class="glass-body">
            <div class="glass-liquid ${newColor}" style="height: 0%;">
              <div class="liquid-wave"></div>
            </div>
            <div class="glass-shine"></div>
            <div class="glass-dot-wrap">
              <img src="images/dot_${newColor}.png" alt="${newColor}" class="glass-dot-img" />
            </div>
            <div class="glass-progress-badge">0/${quota}</div>
          </div>
        </div>
      `;
      const tempWrapper = document.createElement('div');
      tempWrapper.innerHTML = newGlassHtml.trim();
      const newGlassEl = tempWrapper.firstElementChild;
      oldGlass.replaceWith(newGlassEl);
    }, 550);
  }

  pulseColorSlot(color) {
    if (!this.colorTargetsContainerEl) return;
    const glass = this.colorTargetsContainerEl.querySelector(`.color-target-glass[data-color="${color}"]`);
    if (glass && !glass.classList.contains('glass-full-exit')) {
      glass.classList.remove('glass-impact');
      void glass.offsetWidth; // force reflow
      glass.classList.add('glass-impact');
    }
  }

  getColorSlotCanvasPos(color) {
    if (!this.gameState || !this.gameState.activeColors) return { x: 540, y: 1835 };
    const index = this.gameState.activeColors.indexOf(color);
    if (index === -1) return { x: 540, y: 1835 };

    // Footer dimensions (1080x1920)
    // Footer padding: 28px, pause btn: 92px, gap: 14px -> card left: 134px
    // Card width: 812px
    const cardLeft = 134;
    const cardWidth = 812;
    const slotWidth = cardWidth / this.gameState.activeColors.length;
    const x = cardLeft + slotWidth * (index + 0.5);
    const y = 1835;
    return { x, y };
  }

  handleStateTransitions() {
    if (this.gameState.status === 'lost') {
      setTimeout(() => this.showGameOverModal(), 400);
    }
  }

  hideModal() {
    this.modalOverlayEl.classList.remove('active');
    this.modalOverlayEl.innerHTML = '';
  }

  showGameOverModal() {
    this.modalOverlayEl.classList.add('active');

    this.modalOverlayEl.innerHTML = `
      <div class="modal-card lose-modal-card animate-pop">
        <div class="modal-header-banner lose-header">
          <span class="modal-header-title">Time's Up!</span>
        </div>
        <div class="modal-body">
          <div class="modal-subtitle">Game Over</div>
          <div class="rewards-row">
            <div class="reward-pill">
              <img src="images/icon_trophy.png" alt="Score" class="reward-icon-img" />
              <div class="reward-col">
                <span class="reward-label">Score</span>
                <span class="reward-val">${this.gameState.score}</span>
              </div>
            </div>
            <div class="reward-pill">
              <img src="images/star_filled.png" alt="Best" class="reward-icon-img" />
              <div class="reward-col">
                <span class="reward-label">Best</span>
                <span class="reward-val">${this.gameState.highScore}</span>
              </div>
            </div>
          </div>

          <div class="lose-actions" style="margin-top: 24px; display: flex; flex-direction: column; gap: 16px; width: 100%;">
            <button class="action-btn primary-action-btn" id="playAgainBtn">
              Play Again
            </button>
            <button class="action-btn secondary-action-btn" id="exitHomeBtn">
              Back To Home
            </button>
          </div>
        </div>
      </div>
    `;

    const playAgainBtn = this.modalOverlayEl.querySelector('#playAgainBtn');
    playAgainBtn?.addEventListener('click', () => {
      this.audioEngine.playClick();
      this.hideModal();
      if (this.onRestart) this.onRestart();
    });

    const exitHomeBtn = this.modalOverlayEl.querySelector('#exitHomeBtn');
    exitHomeBtn?.addEventListener('click', () => {
      this.audioEngine.playClick();
      window.location.href = '/';
    });
  }

  showPauseModal() {
    this.modalOverlayEl.classList.add('active');

    this.modalOverlayEl.innerHTML = `
      <div class="modal-card pause-modal-card animate-pop">
        <div class="modal-header-banner">
          <span class="modal-header-title">Game Paused</span>
        </div>
        <div class="modal-body">
          <div class="pause-actions">
            <button class="action-btn primary-action-btn" id="resumeBtn">Resume</button>
            <button class="action-btn secondary-action-btn" id="restartPauseBtn">Restart Game</button>
            <button class="action-btn secondary-action-btn" id="exitPauseBtn">Back To Home</button>
          </div>
        </div>
      </div>
    `;

    const resumeBtn = this.modalOverlayEl.querySelector('#resumeBtn');
    resumeBtn?.addEventListener('click', () => {
      this.audioEngine.playClick();
      this.hideModal();
      this.gameState.resumeGame();
    });

    const restartBtn = this.modalOverlayEl.querySelector('#restartPauseBtn');
    restartBtn?.addEventListener('click', () => {
      this.audioEngine.playClick();
      this.hideModal();
      if (this.onRestart) this.onRestart();
    });

    const exitBtn = this.modalOverlayEl.querySelector('#exitPauseBtn');
    exitBtn?.addEventListener('click', () => {
      this.audioEngine.playClick();
      window.location.href = '/';
    });
  }
}

window.UIManager = UIManager;
