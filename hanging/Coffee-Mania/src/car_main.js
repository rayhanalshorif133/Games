import { CarGame } from './car_game.js';
import { carAudio } from './car_audio.js';
import { CAR_LEVELS } from './car_levels.js';

window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('carCanvas');
  const game = new CarGame(canvas);

  // Mute button
  const btnMute = document.getElementById('carBtnMute');
  if (btnMute) {
    btnMute.textContent = carAudio.isMuted ? '🔇' : '🔊';
    btnMute.addEventListener('click', (e) => {
      e.stopPropagation();
      const isMuted = carAudio.toggleMute();
      btnMute.textContent = isMuted ? '🔇' : '🔊';
    });
  }

  // Restart button
  const btnRestart = document.getElementById('carBtnRestart');
  if (btnRestart) {
    btnRestart.addEventListener('click', (e) => {
      e.stopPropagation();
      carAudio.playTap();
      game.loadLevel(game.currentLevelId);
    });
  }

  // Boosters
  const btnUndo = document.getElementById('carBtnUndo');
  if (btnUndo) {
    btnUndo.addEventListener('click', (e) => {
      e.stopPropagation();
      game.useUndo();
    });
  }

  const btnHint = document.getElementById('carBtnHint');
  if (btnHint) {
    btnHint.addEventListener('click', (e) => {
      e.stopPropagation();
      game.useHint();
    });
  }

  const btnHeli = document.getElementById('carBtnHeli');
  if (btnHeli) {
    btnHeli.addEventListener('click', (e) => {
      e.stopPropagation();
      game.useHeli();
    });
  }

  // Level Select Modal
  const modal = document.getElementById('carLevelModal');
  const btnLevelSelect = document.getElementById('carBtnLevels');
  const btnClose = document.getElementById('carBtnCloseLevels');
  const grid = document.getElementById('carLevelGrid');

  function openLevelSelect() {
    carAudio.playTap();
    if (!grid) return;
    grid.innerHTML = '';

    const maxUnlocked = parseInt(localStorage.getItem('car_escape_max_unlocked') || '1', 10);
    const starsData = JSON.parse(localStorage.getItem('car_escape_stars') || '{}');

    for (let i = 1; i <= CAR_LEVELS.length; i++) {
      const card = document.createElement('div');
      card.className = 'car-level-card';
      const isUnlocked = i <= maxUnlocked;
      if (!isUnlocked) card.classList.add('locked');
      if (i === game.currentLevelId) card.classList.add('current');

      const count = starsData[i] || 0;
      const starsStr = isUnlocked ? ('⭐'.repeat(count) + '☆'.repeat(3 - count)) : '🔒';

      card.innerHTML = `
        <div class="car-level-num">${i}</div>
        <div class="car-level-stars-small">${starsStr}</div>
      `;

      if (isUnlocked) {
        card.addEventListener('click', () => {
          carAudio.playTap();
          modal.classList.remove('visible');
          game.loadLevel(i);
        });
      }

      grid.appendChild(card);
    }

    modal.classList.add('visible');
  }

  if (btnLevelSelect) {
    btnLevelSelect.addEventListener('click', (e) => {
      e.stopPropagation();
      openLevelSelect();
    });
  }

  if (btnClose) {
    btnClose.addEventListener('click', (e) => {
      e.stopPropagation();
      carAudio.playTap();
      modal.classList.remove('visible');
    });
  }

  // Win Modal buttons
  const winModal = document.getElementById('carWinModal');
  const btnNext = document.getElementById('carBtnNext');
  const btnWinLevels = document.getElementById('carBtnWinLevels');

  if (btnNext) {
    btnNext.addEventListener('click', () => {
      carAudio.playTap();
      winModal.classList.remove('visible');
      const nextLvl = game.currentLevelId + 1;
      game.loadLevel(nextLvl);
    });
  }

  if (btnWinLevels) {
    btnWinLevels.addEventListener('click', () => {
      winModal.classList.remove('visible');
      openLevelSelect();
    });
  }

  // Start the game!
  game.init();
});

