/**
 * scripts/ui.js - Construct 3 Style UI & Overlay Manager
 * Updates HUD score, lives, best score, combo banners,
 * and handles immediate, robust modal transitions without ghost clicks.
 */

class UIManager {
    constructor() {
        this.cacheDOMElements();
        this.soundEngine = null;
        this.comboTimeout = null;
    }

    cacheDOMElements() {
        // HUD
        this.hudBar = document.getElementById('hud-bar');
        this.hudScore = document.getElementById('hud-score');
        this.hudLife = document.getElementById('hud-life');
        this.hudBest = document.getElementById('hud-best');
        this.btnSound = document.getElementById('btn-sound');
        this.iconSoundOn = document.getElementById('icon-sound-on');
        this.iconSoundOff = document.getElementById('icon-sound-off');

        // Overlays
        this.startOverlay = document.getElementById('start-overlay');
        this.gameoverOverlay = document.getElementById('gameover-overlay');
        this.btnStartPlay = document.getElementById('btn-start-play');
        this.btnTryAgain = document.getElementById('btn-try-again');
        this.btnMainMenu = document.getElementById('btn-main-menu');

        // Game Over Details
        this.endScore = document.getElementById('end-score');
        this.endBest = document.getElementById('end-best');
        this.badgeNewRecord = document.getElementById('badge-new-record');
        this.endPerfect = document.getElementById('end-perfect');
        this.endCombo = document.getElementById('end-combo');

        // Combo Banner
        this.comboBanner = document.getElementById('combo-banner');
    }

    bindEvents({ onStart, onTryAgain, onMainMenu, soundEngine }) {
        this.soundEngine = soundEngine;

        // Sound Toggle
        if (this.btnSound) {
            const handleSound = (e) => {
                e.stopPropagation();
                e.preventDefault();
                if (this.soundEngine) {
                    const isMuted = this.soundEngine.toggleMute();
                    this.updateSoundIcon(isMuted);
                    this.soundEngine.playButtonClick();
                }
            };
            this.btnSound.addEventListener('pointerdown', handleSound);
            this.btnSound.addEventListener('click', handleSound);
        }

        // Start Play Button
        if (this.btnStartPlay) {
            const handleStart = (e) => {
                e.stopPropagation();
                e.preventDefault();
                if (this.soundEngine) this.soundEngine.unlockAudio();
                if (onStart) onStart();
            };
            this.btnStartPlay.addEventListener('pointerdown', handleStart);
            this.btnStartPlay.addEventListener('click', handleStart);
        }

        // Try Again Button (Guaranteed immediate clean restart)
        if (this.btnTryAgain) {
            const handleTryAgain = (e) => {
                e.stopPropagation();
                e.preventDefault();
                if (this.soundEngine) this.soundEngine.playButtonClick();
                if (onTryAgain) onTryAgain();
            };
            this.btnTryAgain.addEventListener('pointerdown', handleTryAgain);
            this.btnTryAgain.addEventListener('click', handleTryAgain);
        }

        // Main Menu Button
        if (this.btnMainMenu) {
            const handleMainMenu = (e) => {
                e.stopPropagation();
                e.preventDefault();
                if (this.soundEngine) this.soundEngine.playButtonClick();
                if (onMainMenu) onMainMenu();
            };
            this.btnMainMenu.addEventListener('pointerdown', handleMainMenu);
            this.btnMainMenu.addEventListener('click', handleMainMenu);
        }

        // Initialize sound icon state
        if (this.soundEngine) {
            this.updateSoundIcon(this.soundEngine.muted);
        }
    }

    updateHUD(score, lives, best) {
        if (this.hudScore) this.hudScore.textContent = score;
        if (this.hudLife) this.hudLife.textContent = lives > 0 ? '❤️' : '💔';
        if (this.hudBest) this.hudBest.textContent = best;
    }

    showStartMenu() {
        if (this.gameoverOverlay) {
            this.gameoverOverlay.style.display = 'none';
            this.gameoverOverlay.classList.add('hidden');
            this.gameoverOverlay.classList.remove('active');
        }
        if (this.startOverlay) {
            this.startOverlay.style.display = 'flex';
            this.startOverlay.classList.remove('hidden');
            this.startOverlay.classList.add('active');
        }
    }

    hideOverlays() {
        if (this.startOverlay) {
            this.startOverlay.style.display = 'none';
            this.startOverlay.classList.add('hidden');
            this.startOverlay.classList.remove('active');
        }
        if (this.gameoverOverlay) {
            this.gameoverOverlay.style.display = 'none';
            this.gameoverOverlay.classList.add('hidden');
            this.gameoverOverlay.classList.remove('active');
        }
    }

    showGameOver({ score, best, isNewRecord, perfectDrops, maxCombo }) {
        if (this.startOverlay) {
            this.startOverlay.style.display = 'none';
            this.startOverlay.classList.add('hidden');
            this.startOverlay.classList.remove('active');
        }
        if (this.endScore) this.endScore.textContent = score;
        if (this.endBest) this.endBest.textContent = best;
        if (this.endPerfect) this.endPerfect.textContent = perfectDrops;
        if (this.endCombo) this.endCombo.textContent = maxCombo;

        if (this.badgeNewRecord) {
            if (isNewRecord && score > 0) {
                this.badgeNewRecord.style.display = 'inline-block';
                this.badgeNewRecord.classList.remove('hidden');
            } else {
                this.badgeNewRecord.style.display = 'none';
                this.badgeNewRecord.classList.add('hidden');
            }
        }

        if (this.gameoverOverlay) {
            this.gameoverOverlay.style.display = 'flex';
            this.gameoverOverlay.classList.remove('hidden');
            this.gameoverOverlay.classList.add('active');
        }
    }

    showComboBanner(text) {
        if (!this.comboBanner) return;
        this.comboBanner.textContent = text;
        this.comboBanner.style.display = 'block';
        this.comboBanner.classList.remove('hidden');
        this.comboBanner.classList.add('active');

        if (this.comboTimeout) clearTimeout(this.comboTimeout);
        this.comboTimeout = setTimeout(() => {
            if (this.comboBanner) {
                this.comboBanner.style.display = 'none';
                this.comboBanner.classList.add('hidden');
                this.comboBanner.classList.remove('active');
            }
        }, 850);
    }

    updateSoundIcon(muted) {
        if (!this.iconSoundOn || !this.iconSoundOff) return;
        if (muted) {
            this.iconSoundOn.classList.add('hidden');
            this.iconSoundOff.classList.remove('hidden');
        } else {
            this.iconSoundOn.classList.remove('hidden');
            this.iconSoundOff.classList.add('hidden');
        }
    }
}

if (typeof window !== 'undefined') {
    window.UIManager = UIManager;
}

