/**
 * Construct 3 Game State Manager
 */
class GameState {
  constructor(levelsData, initialLevelIndex = 3) {
    this.levelsData = levelsData || [];
    this.currentLevelIndex = initialLevelIndex;
    this.currentLevel = this.levelsData[this.currentLevelIndex] || this.levelsData[0];
    this.movesRemaining = 0;
    this.score = 0;
    this.levelScore = 0;
    this.coins = 150;
    this.objectives = { blue: 0, purple: 0, red: 0, yellow: 0 };
    this.initialObjectives = { blue: 0, purple: 0, red: 0, yellow: 0 };
    this.status = 'start_modal';
    this.starsEarned = 0;
    this.lastGainedCoins = 27;
    this.lastGainedScore = 94;
    this.isVideoRewardClaimed = false;
    this.onStateChanged = null;

    this.loadLevel(this.currentLevelIndex);
  }

  loadLevel(index) {
    if (index >= this.levelsData.length) {
      index = 0;
    }
    this.currentLevelIndex = index;
    this.currentLevel = this.levelsData[index];
    this.movesRemaining = this.currentLevel.moves;
    this.levelScore = 0;
    this.starsEarned = 0;
    this.isVideoRewardClaimed = false;

    this.objectives = { ...this.currentLevel.objectives };
    this.initialObjectives = { ...this.currentLevel.objectives };
    this.status = 'start_modal';

    this.notify();
  }

  startPlaying() {
    this.status = 'playing';
    this.notify();
  }

  pauseGame() {
    if (this.status === 'playing') {
      this.status = 'paused';
      this.notify();
    }
  }

  resumeGame() {
    if (this.status === 'paused') {
      this.status = 'playing';
      this.notify();
    }
  }

  restartLevel() {
    this.loadLevel(this.currentLevelIndex);
  }

  nextLevel() {
    this.loadLevel((this.currentLevelIndex + 1) % this.levelsData.length);
  }

  addScore(points) {
    this.score += points;
    this.levelScore += points;
    this.notify();
  }

  decrementMoves() {
    if (this.movesRemaining > 0) {
      this.movesRemaining--;
      this.notify();
      return true;
    }
    return false;
  }

  addExtraMoves(count = 5) {
    this.movesRemaining += count;
    this.status = 'playing';
    this.notify();
  }

  updateObjectives(clearedMap) {
    let anyChanged = false;
    for (const color in clearedMap) {
      const count = clearedMap[color] || 0;
      if (count > 0 && this.objectives[color] > 0) {
        this.objectives[color] = Math.max(0, this.objectives[color] - count);
        anyChanged = true;
      }
    }
    if (anyChanged) {
      this.notify();
    }
  }

  checkWinCondition() {
    const allDone = Object.values(this.objectives).every((req) => req <= 0);
    if (allDone) {
      this.calculateStarsAndRewards();
      this.status = 'won';
      this.notify();
      return true;
    }

    if (this.movesRemaining <= 0) {
      this.status = 'lost';
      this.notify();
      return false;
    }

    return false;
  }

  calculateStarsAndRewards() {
    const [t1, t2, t3] = this.currentLevel.starThresholds;
    if (this.levelScore >= t3) {
      this.starsEarned = 3;
    } else if (this.levelScore >= t2) {
      this.starsEarned = 2;
    } else {
      this.starsEarned = 1;
    }

    const baseCoins = 20 + this.currentLevel.levelNumber * 2;
    const bonusCoins = this.movesRemaining * 3;
    this.lastGainedCoins = baseCoins + bonusCoins;
    this.lastGainedScore = this.levelScore > 0 ? this.levelScore : 94;
    this.coins += this.lastGainedCoins;
  }

  claimDoubleVideoReward() {
    if (!this.isVideoRewardClaimed) {
      this.isVideoRewardClaimed = true;
      this.coins += this.lastGainedCoins;
      this.lastGainedCoins *= 2;
      this.notify();
      return this.lastGainedCoins;
    }
    return this.lastGainedCoins;
  }

  notify() {
    if (this.onStateChanged) {
      this.onStateChanged();
    }
  }
}

window.GameState = GameState;

