/**
 * Construct 3 UI Manager & Modals (Using images/ Sprite Assets)
 */
class UIManager {
  constructor(container, gameState, audioEngine, onRestart, onNextLevel) {
    this.container = container;
    this.gameState = gameState;
    this.audioEngine = audioEngine;
    this.onRestart = onRestart;
    this.onNextLevel = onNextLevel;

    this.createDomStructure();
    this.bindEvents();
    this.updateHUD();
  }

  createDomStructure() {
    this.container.innerHTML = `
      <!-- Top HUD Header -->
      <header class="game-header">
        <!-- Moves Counter Card (Left) -->
        <div class="hud-card moves-card">
          <div class="hud-icon-wrap">
            <img src="images/icon_moves.png" alt="Moves" class="hud-icon-img" />
          </div>
          <span class="hud-value" id="movesValue">30</span>
        </div>

        <!-- Objectives Card (Center) -->
        <div class="hud-card objectives-card">
          <div class="objectives-list" id="objectivesList"></div>
          <div class="header-progress-track">
            <div class="header-progress-fill" id="headerProgressFill"></div>
          </div>
        </div>

        <!-- Trophy / Score Card (Right) -->
        <div class="hud-card score-card">
          <div class="hud-icon-wrap">
            <img src="images/icon_trophy.png" alt="Score" class="hud-icon-img" />
          </div>
          <span class="hud-value" id="scoreValue">00</span>
        </div>
      </header>

      <!-- Main Game Canvas Container -->
      <div class="canvas-container">
        <canvas id="gameCanvas"></canvas>
      </div>

      <!-- Bottom Bar Controls -->
      <footer class="game-footer">
        <button class="footer-btn pause-btn" id="pauseBtn" aria-label="Pause">
          <img src="images/icon_pause.png" alt="Pause" class="footer-btn-img" />
        </button>

        <button class="footer-btn sound-btn" id="soundBtn" aria-label="Toggle Sound">
          <img src="images/icon_sound_on.png" alt="Sound" id="soundIconImg" class="footer-btn-img" />
        </button>
      </footer>

      <!-- Modals Overlay -->
      <div class="modal-overlay" id="modalOverlay"></div>
    `;

    this.movesValueEl = this.container.querySelector('#movesValue');
    this.scoreValueEl = this.container.querySelector('#scoreValue');
    this.objectivesContainerEl = this.container.querySelector('#objectivesList');
    this.soundBtnEl = this.container.querySelector('#soundBtn');
    this.soundIconImg = this.container.querySelector('#soundIconImg');
    this.pauseBtnEl = this.container.querySelector('#pauseBtn');
    this.modalOverlayEl = this.container.querySelector('#modalOverlay');
  }

  bindEvents() {
    this.gameState.onStateChanged = () => {
      this.updateHUD();
      this.handleStateTransitions();
    };

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
    const moves = this.gameState.movesRemaining;
    this.movesValueEl.textContent = moves < 10 ? `0${moves}` : `${moves}`;

    const score = this.gameState.score;
    this.scoreValueEl.textContent = score < 10 ? `0${score}` : `${score}`;

    const orderedColors = ['blue', 'purple', 'red', 'yellow'];
    let html = '';

    let totalRemaining = 0;
    let totalInitial = 0;

    orderedColors.forEach((color) => {
      const count = this.gameState.objectives[color] ?? 0;
      const initial = this.gameState.initialObjectives[color] ?? 0;
      totalRemaining += count;
      totalInitial += initial;

      if (initial > 0 || count > 0) {
        const isDone = count <= 0;
        html += `
          <div class="obj-slot ${isDone ? 'done' : ''}">
            <img src="images/dot_${color}.png" alt="${color}" class="obj-dot-img" />
            <div class="obj-status">
              ${isDone 
                ? `<img src="images/icon_check.png" alt="Done" class="obj-check-img" />` 
                : `<span class="obj-count">${count}</span>`
              }
            </div>
          </div>
        `;
      }
    });

    this.objectivesContainerEl.innerHTML = html;

    const progressFill = this.container.querySelector('#headerProgressFill');
    if (progressFill && totalInitial > 0) {
      const pct = Math.min(100, Math.max(0, ((totalInitial - totalRemaining) / totalInitial) * 100));
      progressFill.style.width = `${pct}%`;
    }
  }

  handleStateTransitions() {
    if (this.gameState.status === 'start_modal') {
      this.showStartModal();
    } else if (this.gameState.status === 'won') {
      setTimeout(() => this.showWinModal(), 500);
    } else if (this.gameState.status === 'lost') {
      setTimeout(() => this.showLoseModal(), 500);
    }
  }

  hideModal() {
    this.modalOverlayEl.classList.remove('active');
    this.modalOverlayEl.innerHTML = '';
  }

  showStartModal() {
    this.modalOverlayEl.classList.add('active');
    const level = this.gameState.currentLevel;

    let objectivesHtml = '';
    const orderedColors = ['blue', 'purple', 'red', 'yellow'];
    orderedColors.forEach((color) => {
      const targetCount = level.objectives[color] ?? 0;
      objectivesHtml += `
        <div class="modal-obj-item">
          <img src="images/dot_${color}.png" alt="${color}" class="modal-dot-preview" />
          <div class="modal-dot-count">${targetCount}</div>
        </div>
      `;
    });

    this.modalOverlayEl.innerHTML = `
      <div class="modal-card start-modal-card animate-pop">
        <div class="modal-header-banner">
          <span class="modal-header-title">${level.title}</span>
        </div>
        <div class="modal-body">
          <div class="modal-subtitle">Objectives:</div>
          <div class="modal-objectives-row">
            ${objectivesHtml}
          </div>
          <button class="modal-play-btn" id="startPlayBtn" aria-label="Play">
            <img src="images/icon_play.png" alt="Play" class="btn-play-img" />
          </button>
        </div>
      </div>
    `;

    const playBtn = this.modalOverlayEl.querySelector('#startPlayBtn');
    playBtn?.addEventListener('click', () => {
      this.audioEngine.playClick();
      this.hideModal();
      this.gameState.startPlaying();
    });
  }

  showWinModal() {
    this.modalOverlayEl.classList.add('active');
    const stars = this.gameState.starsEarned;

    let starsHtml = '';
    for (let i = 1; i <= 3; i++) {
      const isFilled = i <= stars;
      starsHtml += `
        <div class="star-slot ${isFilled ? 'filled' : 'empty'}">
          <img src="images/${isFilled ? 'star_filled' : 'star_empty'}.png" alt="Star" class="star-img" />
        </div>
      `;
    }

    this.modalOverlayEl.innerHTML = `
      <div class="modal-card win-modal-card animate-pop">
        <button class="modal-close-btn" id="winCloseBtn" aria-label="Close">
          <img src="images/icon_close.png" alt="Close" class="close-icon-img" />
        </button>
        <div class="modal-header-banner">
          <span class="modal-header-title">Level Passed</span>
        </div>
        <div class="modal-body">
          <div class="modal-stars-row">
            ${starsHtml}
          </div>
          <div class="modal-subtitle">You gained:</div>
          <div class="rewards-row">
            <div class="reward-pill">
              <img src="images/icon_coin.png" alt="Coin" class="reward-icon-img" />
              <span class="reward-val" id="gainedCoinsVal">${this.gameState.lastGainedCoins}</span>
            </div>
            <div class="reward-pill">
              <img src="images/icon_trophy.png" alt="Trophy" class="reward-icon-img" />
              <span class="reward-val" id="gainedScoreVal">${this.gameState.lastGainedScore}</span>
            </div>
          </div>
          <button class="modal-play-btn" id="nextLevelBtn" aria-label="Next Level">
            <img src="images/icon_play.png" alt="Next" class="btn-play-img" />
          </button>
          
          <div class="video-reward-banner ${this.gameState.isVideoRewardClaimed ? 'claimed' : ''}" id="doubleRewardBtn">
            <img src="images/icon_trophy.png" alt="Trophy" class="reward-trophy-small" />
            <div class="video-reward-text">
              ${this.gameState.isVideoRewardClaimed ? 'Prize Doubled! 🎉' : 'Watch the video to double your prize'}
            </div>
            <img src="images/icon_video.png" alt="Ad" class="reward-video-img" />
          </div>
        </div>
      </div>
    `;

    const nextBtn = this.modalOverlayEl.querySelector('#nextLevelBtn');
    nextBtn?.addEventListener('click', () => {
      this.audioEngine.playClick();
      this.hideModal();
      if (this.onNextLevel) this.onNextLevel();
    });

    const closeBtn = this.modalOverlayEl.querySelector('#winCloseBtn');
    closeBtn?.addEventListener('click', () => {
      this.audioEngine.playClick();
      this.hideModal();
      if (this.onNextLevel) this.onNextLevel();
    });

    const doubleBtn = this.modalOverlayEl.querySelector('#doubleRewardBtn');
    doubleBtn?.addEventListener('click', () => {
      if (!this.gameState.isVideoRewardClaimed) {
        this.audioEngine.playCoin();
        const newVal = this.gameState.claimDoubleVideoReward();
        const coinValEl = this.modalOverlayEl.querySelector('#gainedCoinsVal');
        if (coinValEl) coinValEl.textContent = newVal.toString();
        doubleBtn.classList.add('claimed');
        const textEl = doubleBtn.querySelector('.video-reward-text');
        if (textEl) textEl.textContent = 'Prize Doubled! 🎉';
      }
    });
  }

  showLoseModal() {
    this.modalOverlayEl.classList.add('active');

    this.modalOverlayEl.innerHTML = `
      <div class="modal-card lose-modal-card animate-pop">
        <div class="modal-header-banner lose-header">
          <span class="modal-header-title">Out of Moves</span>
        </div>
        <div class="modal-body">
          <div class="lose-message">No more moves left! Would you like +5 extra moves to keep playing?</div>
          <div class="lose-actions">
            <button class="action-btn primary-action-btn" id="extraMovesBtn">
              +5 Moves (🪙 50)
            </button>
            <button class="action-btn secondary-action-btn" id="retryLevelBtn">
              Restart Level
            </button>
          </div>
        </div>
      </div>
    `;

    const extraBtn = this.modalOverlayEl.querySelector('#extraMovesBtn');
    extraBtn?.addEventListener('click', () => {
      this.audioEngine.playClick();
      this.gameState.addExtraMoves(5);
      this.hideModal();
    });

    const retryBtn = this.modalOverlayEl.querySelector('#retryLevelBtn');
    retryBtn?.addEventListener('click', () => {
      this.audioEngine.playClick();
      this.hideModal();
      if (this.onRestart) this.onRestart();
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
            <button class="action-btn secondary-action-btn" id="restartPauseBtn">Restart Level</button>
            <button class="action-btn secondary-action-btn" id="levelSelectBtn">Next Level</button>
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

    const nextBtn = this.modalOverlayEl.querySelector('#levelSelectBtn');
    nextBtn?.addEventListener('click', () => {
      this.audioEngine.playClick();
      this.hideModal();
      if (this.onNextLevel) this.onNextLevel();
    });
  }
}

window.UIManager = UIManager;

