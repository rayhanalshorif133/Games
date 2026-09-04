import { CoffeeManiaGame } from './game.js';
import { audio } from './audio.js';
import { LEVELS } from './levels.js';

window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('gameCanvas');
  const game = new CoffeeManiaGame(canvas);

  // Wire up Audio Mute button
  const btnMute = document.getElementById('btnMute');
  if (btnMute) {
    btnMute.textContent = audio.isMuted ? '🔇' : '🔊';
    btnMute.addEventListener('click', (e) => {
      e.stopPropagation();
      const isMuted = audio.toggleMute();
      btnMute.textContent = isMuted ? '🔇' : '🔊';
    });
  }

  // Wire up Restart button
  const btnRestart = document.getElementById('btnRestart');
  if (btnRestart) {
    btnRestart.addEventListener('click', (e) => {
      e.stopPropagation();
      audio.playTap();
      game.loadLevel(game.currentLevelId);
    });
  }

  // Wire up Booster buttons
  const btnUndo = document.getElementById('btnUndo');
  if (btnUndo) {
    btnUndo.addEventListener('click', (e) => {
      e.stopPropagation();
      game.useUndo();
    });
  }

  const btnExtraSlot = document.getElementById('btnExtraSlot');
  if (btnExtraSlot) {
    btnExtraSlot.addEventListener('click', (e) => {
      e.stopPropagation();
      game.useExtraSlot();
    });
  }

  const btnShuffle = document.getElementById('btnShuffle');
  if (btnShuffle) {
    btnShuffle.addEventListener('click', (e) => {
      e.stopPropagation();
      game.useShuffle();
    });
  }

  // Level Select Modal
  const levelSelectModal = document.getElementById('levelSelectModal');
  const btnLevelSelect = document.getElementById('btnLevelSelect');
  const btnCloseLevelSelect = document.getElementById('btnCloseLevelSelect');
  const levelGrid = document.getElementById('levelGrid');

  function openLevelSelect() {
    audio.playTap();
    if (!levelGrid) return;
    levelGrid.innerHTML = '';

    const maxUnlocked = parseInt(localStorage.getItem('coffeemania_max_unlocked') || '1', 10);
    const starsData = JSON.parse(localStorage.getItem('coffeemania_stars') || '{}');

    // 20 Standard levels + Endless option
    for (let i = 1; i <= LEVELS.length; i++) {
      const card = document.createElement('div');
      card.className = 'level-card';
      const isUnlocked = i <= maxUnlocked;
      if (!isUnlocked) card.classList.add('locked');
      if (i === game.currentLevelId) card.classList.add('current');

      const starsCount = starsData[i] || 0;
      const starsStr = isUnlocked ? ('⭐'.repeat(starsCount) + '☆'.repeat(3 - starsCount)) : '🔒';

      card.innerHTML = `
        <div class="level-num">${i}</div>
        <div class="level-stars-small">${starsStr}</div>
      `;

      if (isUnlocked) {
        card.addEventListener('click', () => {
          audio.playTap();
          levelSelectModal.classList.remove('visible');
          game.loadLevel(i);
        });
      }

      levelGrid.appendChild(card);
    }

    // Endless level card
    const endlessCard = document.createElement('div');
    endlessCard.className = 'level-card';
    endlessCard.innerHTML = `
      <div class="level-num">∞</div>
      <div class="level-stars-small">Endless</div>
    `;
    endlessCard.addEventListener('click', () => {
      audio.playTap();
      levelSelectModal.classList.remove('visible');
      const randomLvl = Math.floor(Math.random() * 50) + 21;
      game.loadLevel(randomLvl);
    });
    levelGrid.appendChild(endlessCard);

    levelSelectModal.classList.add('visible');
  }

  if (btnLevelSelect) {
    btnLevelSelect.addEventListener('click', (e) => {
      e.stopPropagation();
      openLevelSelect();
    });
  }

  if (btnCloseLevelSelect) {
    btnCloseLevelSelect.addEventListener('click', (e) => {
      e.stopPropagation();
      audio.playTap();
      levelSelectModal.classList.remove('visible');
    });
  }

  // Win Modal buttons
  const winModal = document.getElementById('winModal');
  const btnNextLevel = document.getElementById('btnNextLevel');
  const btnWinLevels = document.getElementById('btnWinLevels');

  if (btnNextLevel) {
    btnNextLevel.addEventListener('click', () => {
      audio.playTap();
      winModal.classList.remove('visible');
      const nextLvl = game.currentLevelId + 1;
      const currentMax = parseInt(localStorage.getItem('coffeemania_max_unlocked') || '1', 10);
      if (nextLvl > currentMax) {
        localStorage.setItem('coffeemania_max_unlocked', nextLvl.toString());
      }
      game.loadLevel(nextLvl);
    });
  }

  if (btnWinLevels) {
    btnWinLevels.addEventListener('click', () => {
      winModal.classList.remove('visible');
      openLevelSelect();
    });
  }

  // Lose Modal buttons
  const loseModal = document.getElementById('loseModal');
  const btnLoseRestart = document.getElementById('btnLoseRestart');
  const btnLoseUndo = document.getElementById('btnLoseUndo');

  if (btnLoseRestart) {
    btnLoseRestart.addEventListener('click', () => {
      audio.playTap();
      loseModal.classList.remove('visible');
      game.loadLevel(game.currentLevelId);
    });
  }

  if (btnLoseUndo) {
    btnLoseUndo.addEventListener('click', () => {
      loseModal.classList.remove('visible');
      game.state = 'PLAYING';
      game.useUndo();
    });
  }

  // Start the game!
  game.init();
});

