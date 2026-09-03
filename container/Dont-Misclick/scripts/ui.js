/**
 * Click to Survive - UI & HUD System
 * Custom Virtual Cursor, HUD, Modals, Retro Taskbar, Floating Text
 */

class UIManager {
    constructor(game) {
        this.game = game;
        this.cursorEl = document.getElementById('virtual-cursor');
        this.scoreEl = document.getElementById('hud-score');
        this.highScoreEl = document.getElementById('hud-highscore');
        this.timerEl = document.getElementById('hud-timer');
        this.windowCountEl = document.getElementById('hud-window-count');
        this.windowMeterFill = document.getElementById('window-meter-fill');
        this.mutationBanner = document.getElementById('mutation-banner');
        this.taskbarTrayClock = document.getElementById('tray-clock');
        this.taskbarTrayDate = document.getElementById('tray-date');
        this.stage = document.getElementById('game-stage');

        // Tutorial elements
        this.tutorialContainer = document.getElementById('tutorial-container');
        this.tutorialRing = document.getElementById('tutorial-target-ring');
        this.tutorialHand = document.getElementById('tutorial-hand');
        this.tutorialBubble = document.getElementById('tutorial-bubble');
        this.tutorialBadge = document.getElementById('tutorial-step-badge');
        this.tutorialText = document.getElementById('tutorial-text');

        this.cursorScale = 1.0;
        this.cursorX = 540;
        this.cursorY = 960;

        this.initCursor();
        this.updateClock();
        setInterval(() => this.updateClock(), 1000);
    }

    initCursor() {
        if (!this.cursorEl) return;

        const updateCoords = (e) => {
            const rect = this.stage.getBoundingClientRect();
            const scaleX = 1080 / rect.width;
            const scaleY = 1920 / rect.height;

            this.cursorX = (e.clientX - rect.left) * scaleX;
            this.cursorY = (e.clientY - rect.top) * scaleY;

            this.updateCursorPosition();
        };

        window.addEventListener('pointermove', updateCoords);

        window.addEventListener('pointerdown', (e) => {
            updateCoords(e);
            if (this.cursorEl) this.cursorEl.classList.add('cursor-down');
        });

        window.addEventListener('pointerup', () => {
            if (this.cursorEl) this.cursorEl.classList.remove('cursor-down');
        });
    }

    setCursorScale(scale) {
        this.cursorScale = scale;
        this.updateCursorPosition();
    }

    updateCursorPosition() {
        if (!this.cursorEl) return;
        this.cursorEl.style.transform = `translate(${this.cursorX}px, ${this.cursorY}px) scale(${this.cursorScale})`;
    }

    updateClock() {
        if (!this.taskbarTrayClock) return;
        const now = new Date();
        let hours = now.getHours();
        const mins = String(now.getMinutes()).padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12 || 12;
        this.taskbarTrayClock.textContent = `${hours}:${mins} ${ampm}`;
        if (this.taskbarTrayDate) {
            this.taskbarTrayDate.textContent = `${now.getMonth() + 1}/${now.getDate()}/${now.getFullYear()}`;
        }
    }

    updateHUD(score, highScore, remainingSecs, activeCount, maxCount) {
        if (this.scoreEl) this.scoreEl.textContent = score;
        if (this.highScoreEl) this.highScoreEl.textContent = highScore;

        // Formatted 00:00
        const m = Math.floor(remainingSecs / 60);
        const s = remainingSecs % 60;
        if (this.timerEl) {
            this.timerEl.textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
            if (remainingSecs <= 30) {
                this.timerEl.classList.add('timer-critical');
            } else {
                this.timerEl.classList.remove('timer-critical');
            }
        }

        if (this.windowCountEl) {
            this.windowCountEl.textContent = `${activeCount} / ${maxCount}`;
        }

        if (this.windowMeterFill) {
            const pct = Math.min(100, Math.round((activeCount / maxCount) * 100));
            this.windowMeterFill.style.width = `${pct}%`;
            if (pct >= 80) {
                this.windowMeterFill.style.backgroundColor = '#ff0033';
            } else if (pct >= 55) {
                this.windowMeterFill.style.backgroundColor = '#ffbb00';
            } else {
                this.windowMeterFill.style.backgroundColor = '#00ff88';
            }
        }
    }

    showMutationAlert(title, subtitle) {
        if (!this.mutationBanner) return;
        this.mutationBanner.innerHTML = `
            <div class="mutation-inner">
                <div class="mutation-title">${title}</div>
                <div class="mutation-sub">${subtitle}</div>
            </div>
        `;
        this.mutationBanner.classList.add('show');
        setTimeout(() => {
            this.mutationBanner.classList.remove('show');
        }, 3000);
    }

    showFloatingPenalty(x, y, text = '+5 POPUPS!') {
        const floatEl = document.createElement('div');
        floatEl.className = 'floating-penalty';
        floatEl.textContent = text;
        floatEl.style.left = `${x}px`;
        floatEl.style.top = `${y}px`;
        this.stage.appendChild(floatEl);

        setTimeout(() => {
            if (floatEl.parentNode) floatEl.parentNode.removeChild(floatEl);
        }, 900);
    }

    triggerScreenShake() {
        this.stage.classList.remove('shake-fx');
        void this.stage.offsetWidth; // Trigger reflow
        this.stage.classList.add('shake-fx');
        setTimeout(() => this.stage.classList.remove('shake-fx'), 350);
    }

    triggerGlitchFlash() {
        const flash = document.createElement('div');
        flash.className = 'red-flash';
        this.stage.appendChild(flash);
        setTimeout(() => {
            if (flash.parentNode) flash.parentNode.removeChild(flash);
        }, 200);
    }

    showTutorialHand(closeBtn, step, totalSteps) {
        if (!this.tutorialContainer || !closeBtn) return;

        const stageRect = this.stage.getBoundingClientRect();
        const btnRect = closeBtn.getBoundingClientRect();
        const scaleX = 1080 / stageRect.width;
        const scaleY = 1920 / stageRect.height;

        const btnX = (btnRect.left - stageRect.left) * scaleX;
        const btnY = (btnRect.top - stageRect.top) * scaleY;
        const btnW = btnRect.width * scaleX;
        const btnH = btnRect.height * scaleY;

        // Position target highlight ring around close button
        if (this.tutorialRing) {
            this.tutorialRing.style.left = `${btnX - 4}px`;
            this.tutorialRing.style.top = `${btnY - 4}px`;
            this.tutorialRing.style.width = `${btnW + 8}px`;
            this.tutorialRing.style.height = `${btnH + 8}px`;
        }

        // Position hand below the close button pointing up
        if (this.tutorialHand) {
            const handX = btnX + (btnW / 2) - 30;
            const handY = btnY + btnH + 18;
            this.tutorialHand.style.left = `${handX}px`;
            this.tutorialHand.style.top = `${handY}px`;
        }

        // Position speech bubble safely
        if (this.tutorialBubble) {
            let bubbleX = btnX - 480;
            if (bubbleX < 40) bubbleX = 40;
            let bubbleY = btnY + btnH + 115;
            if (bubbleY > 1500) bubbleY = btnY - 240;

            this.tutorialBubble.style.left = `${bubbleX}px`;
            this.tutorialBubble.style.top = `${bubbleY}px`;
        }

        if (this.tutorialBadge) {
            this.tutorialBadge.textContent = `TUTORIAL ${step}/${totalSteps}`;
        }

        if (this.tutorialText) {
            if (step === 1) {
                this.tutorialText.innerHTML = `👉 <strong>Welcome to Don't Misclick!</strong> Click this <strong>[ ✕ ]</strong> button on the top-right to close the window and earn +1 Score!`;
            } else if (step === 2) {
                this.tutorialText.innerHTML = `⚡ <strong>Great job!</strong> Now close this second window. <strong>Remember:</strong> If you misclick anywhere else, <strong>+5 new windows</strong> will spawn!`;
            } else if (step === 3) {
                this.tutorialText.innerHTML = `🎯 <strong>Final tutorial step!</strong> Close this 3rd window to finish your tutorial and begin your 3-minute survival run!`;
            }
        }

        this.tutorialContainer.classList.add('active');
    }

    hideTutorialHand() {
        if (this.tutorialContainer) {
            this.tutorialContainer.classList.remove('active');
        }
    }

    // Appreciate user with diverse animated emojis & praise on successful close
    showAppreciation(x, y, combo = 1) {
        const appreciationList = [
            { emoji: '🎯', text: 'PERFECT!' },
            { emoji: '🔥', text: 'ON FIRE!' },
            { emoji: '⚡', text: 'FAST REFLEX!' },
            { emoji: '👏', text: 'NICE CLICK!' },
            { emoji: '😎', text: 'TOO EASY!' },
            { emoji: '🚀', text: 'UNSTOPPABLE!' },
            { emoji: '💯', text: '100% CLEAN!' },
            { emoji: '🌟', text: 'SUPERB!' },
            { emoji: '👑', text: 'GODLIKE!' },
            { emoji: '🛡️', text: 'DEFENDED!' },
            { emoji: '✨', text: 'EXCELLENT!' },
            { emoji: '💪', text: 'PRO GAMER!' },
            { emoji: '💎', text: 'FLAWLESS!' }
        ];

        const item = appreciationList[Math.floor(Math.random() * appreciationList.length)];
        let text = item.text;
        if (combo >= 3) {
            text += ` x${combo}`;
        }

        const badge = document.createElement('div');
        badge.className = 'appreciation-badge';
        badge.innerHTML = `
            <span class="appreciation-emoji">${item.emoji}</span>
            <span class="appreciation-text">${text}</span>
        `;

        const clampedX = Math.max(160, Math.min(920, x));
        const clampedY = Math.max(140, Math.min(1760, y));

        badge.style.left = `${clampedX}px`;
        badge.style.top = `${clampedY}px`;

        this.stage.appendChild(badge);

        setTimeout(() => {
            if (badge.parentNode) badge.parentNode.removeChild(badge);
        }, 850);
    }
}

// Browser Cookie Storage Utilities
window.CookieUtil = {
    get(name) {
        const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
        if (match) return decodeURIComponent(match[2]);
        try { return localStorage.getItem(name); } catch (e) { return null; }
    },
    set(name, value, days = 365) {
        const expires = new Date(Date.now() + days * 864e5).toUTCString();
        document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
        try { localStorage.setItem(name, value); } catch (e) {}
    }
};

window.UIManager = UIManager;
