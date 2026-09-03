/**
 * Don't Misclick - Windows 11 Window Management System
 * Handles Windows 11 Fluent popup spawning, acrylic styling, close events, and misclick penalties.
 */

class WindowManager {
    constructor(container, onWindowClosed, onMisclick) {
        this.container = container;
        this.onWindowClosed = onWindowClosed;
        this.onMisclick = onMisclick;
        this.windows = new Map();
        this.idCounter = 0;
        this.windowScale = 1.0;
        this.zCounter = 100;

        // Modern Windows 11 Popup Templates
        this.templates = [
            {
                type: 'defender',
                title: 'Windows Security',
                icon: '🛡️',
                accent: '#0078d4',
                messages: [
                    'Threat detected: Trojan.Misclick.Win11! Action needed.',
                    'SmartScreen prevented an unrecognized reflex from running.',
                    'Real-time protection blocked 99 popup viruses.',
                    'Security intelligence update: Misclicking is dangerous.'
                ]
            },
            {
                type: 'edge',
                title: 'Microsoft Edge',
                icon: '🌐',
                accent: '#0078d4',
                messages: [
                    'Make Microsoft Edge your default browser? (Recommended)',
                    'Edge has put 38 inactive tabs to sleep for you.',
                    'Save money with Edge coupons while closing popups!',
                    'You are using Google Chrome. Edge would like a word.'
                ]
            },
            {
                type: 'copilot',
                title: 'Microsoft Copilot',
                icon: '✨',
                accent: '#8b5cf6',
                messages: [
                    'I noticed you have 30 seconds left. Should I write an excuse letter?',
                    'Copilot is generating a poem about your clicking skills...',
                    'AI Tip: Clicking the [ ✕ ] button improves survival odds by 100%.',
                    'Would you like Copilot to rewrite this error message?'
                ]
            },
            {
                type: 'update',
                title: 'Windows Update',
                icon: '🔄',
                accent: '#0078d4',
                messages: [
                    'Restart required: Windows 11 Feature Update 24H2 is ready.',
                    'Windows will automatically restart in 3 seconds to update Paint.',
                    'Please do not turn off your PC. Installing 1 of 847 updates...',
                    'New widgets added to your taskbar that you will never use.'
                ]
            },
            {
                type: 'onedrive',
                title: 'Microsoft OneDrive',
                icon: '☁️',
                accent: '#0284c7',
                messages: [
                    'Your cloud storage is 98% full of cat memes.',
                    'OneDrive cannot sync file: "Homework_Final_v3_REAL.docx".',
                    'Upgrade to Microsoft 365 Family for 1TB extra space!',
                    'Backing up your desktop popups to the cloud...'
                ]
            },
            {
                type: 'teams',
                title: 'Microsoft Teams',
                icon: '👥',
                accent: '#4f46e5',
                messages: [
                    'Teams is using 12GB of your 16GB RAM in the background.',
                    'Daily Standup meeting started 5 minutes ago! Join?',
                    'You are on mute. Everyone heard your mechanical keyboard clicks.',
                    'Boss sent a high-priority message: "Pls fix immediately".'
                ]
            }
        ];
    }

    setWindowScale(scale) {
        this.windowScale = scale;
        this.windows.forEach(win => {
            if (win.element) {
                win.element.style.transform = `scale(${this.windowScale})`;
            }
        });
    }

    clear() {
        this.windows.forEach(win => {
            if (win.element && win.element.parentNode) {
                win.element.parentNode.removeChild(win.element);
            }
        });
        this.windows.clear();
    }

    count() {
        return this.windows.size;
    }

    spawn(options = {}) {
        const id = ++this.idCounter;
        const template = options.template || this.templates[Math.floor(Math.random() * this.templates.length)];
        const msg = options.message || template.messages[Math.floor(Math.random() * template.messages.length)];

        // Window dimensions (optimized larger size for 1080x1920 portrait)
        let baseW = options.width || (540 + Math.floor(Math.random() * 160));
        let baseH = options.height || (300 + Math.floor(Math.random() * 80));

        const minX = 30;
        const maxX = Math.max(minX, 1080 - baseW - 40);
        const minY = 130; // below top HUD
        const maxY = Math.max(minY, 1920 - baseH - 160); // above taskbar

        let x = options.x !== undefined ? options.x : minX + Math.random() * (maxX - minX);
        let y = options.y !== undefined ? options.y : minY + Math.random() * (maxY - minY);

        x = Math.max(minX, Math.min(maxX, x));
        y = Math.max(minY, Math.min(maxY, y));

        const isDrifting = options.drifting || (options.hardMode && Math.random() < 0.28);
        const driftVx = isDrifting ? (Math.random() - 0.5) * 3.0 : 0;
        const driftVy = isDrifting ? (Math.random() - 0.5) * 3.0 : 0;

        const winEl = document.createElement('div');
        winEl.className = `win11-window window-${template.type}`;
        winEl.id = `win-${id}`;
        winEl.style.left = `${x}px`;
        winEl.style.top = `${y}px`;
        winEl.style.width = `${baseW}px`;
        winEl.style.zIndex = ++this.zCounter;
        winEl.style.transform = `scale(${this.windowScale})`;

        // Windows 11 Titlebar
        const titlebar = document.createElement('div');
        titlebar.className = 'win11-titlebar';

        const titleText = document.createElement('div');
        titleText.className = 'win11-title-content';
        titleText.innerHTML = `<span class="win11-title-icon">${template.icon}</span> <span class="win11-title-label">${template.title}</span>`;

        // Modern Windows 11 window controls (Minimize, Maximize, Close)
        const winControls = document.createElement('div');
        winControls.className = 'win11-controls';

        const minBtn = document.createElement('div');
        minBtn.className = 'win11-ctrl-btn min-btn';
        minBtn.innerHTML = '─';

        const maxBtn = document.createElement('div');
        maxBtn.className = 'win11-ctrl-btn max-btn';
        maxBtn.innerHTML = '▢';

        const closeBtn = document.createElement('button');
        closeBtn.className = 'win11-close-btn';
        closeBtn.innerHTML = '✕';
        closeBtn.title = 'Close (Win + W)';

        winControls.appendChild(minBtn);
        winControls.appendChild(maxBtn);
        winControls.appendChild(closeBtn);

        titlebar.appendChild(titleText);
        titlebar.appendChild(winControls);

        // Windows 11 Body Content (Acrylic & Fluent Card)
        const content = document.createElement('div');
        content.className = 'win11-body';
        content.innerHTML = `
            <div class="win11-msg-wrap">
                <div class="win11-badge-icon">${template.icon}</div>
                <div class="win11-msg-text">${msg}</div>
            </div>
            <div class="win11-btn-group">
                <button class="win11-btn win11-btn-primary">Dismiss</button>
                <button class="win11-btn win11-btn-secondary">Remind Later</button>
            </div>
        `;

        // Close button click handler
        closeBtn.addEventListener('pointerdown', (e) => {
            e.stopPropagation();
            const rect = closeBtn.getBoundingClientRect();
            this.closeWindow(id, rect.left + rect.width / 2, rect.top + rect.height / 2);
        });

        // Misclick penalty detection
        winEl.addEventListener('pointerdown', (e) => {
            if (e.target !== closeBtn) {
                e.stopPropagation();
                winEl.style.zIndex = ++this.zCounter;
                this.onMisclick(e.clientX, e.clientY, winEl);
            }
        });

        winEl.appendChild(titlebar);
        winEl.appendChild(content);
        this.container.appendChild(winEl);

        const winObj = {
            id,
            element: winEl,
            closeBtn,
            x,
            y,
            w: baseW,
            h: baseH,
            vx: driftVx,
            vy: driftVy,
            isDrifting
        };

        this.windows.set(id, winObj);

        // Windows 11 smooth acrylic scale-in animation
        winEl.classList.add('win11-spawn-anim');
        setTimeout(() => winEl.classList.remove('win11-spawn-anim'), 220);

        return winObj;
    }

    spawnMisclickPenalty(misclickStageX, misclickStageY, count = 5) {
        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2 + (Math.random() * 0.4);
            const dist = 140 + Math.random() * 220;
            const targetX = misclickStageX + Math.cos(angle) * dist - 270;
            const targetY = misclickStageY + Math.sin(angle) * dist - 150;

            setTimeout(() => {
                this.spawn({
                    x: targetX,
                    y: targetY,
                    template: this.templates[Math.floor(Math.random() * this.templates.length)]
                });
            }, i * 35);
        }
    }

    closeWindow(id, clientX, clientY) {
        const win = this.windows.get(id);
        if (!win) return;

        // Stage coordinates particle burst
        const stage = document.getElementById('game-stage');
        let stageX = win.x + (win.w - 30);
        let stageY = win.y + 25;
        if (stage) {
            const rect = stage.getBoundingClientRect();
            const scaleX = 1080 / rect.width;
            const scaleY = 1920 / rect.height;
            stageX = (clientX - rect.left) * scaleX;
            stageY = (clientY - rect.top) * scaleY;
            this.createFluentBurst(stageX, stageY, stage);
        }

        // Smooth Windows 11 fade out
        win.element.classList.add('win11-closing');
        setTimeout(() => {
            if (win.element && win.element.parentNode) {
                win.element.parentNode.removeChild(win.element);
            }
        }, 130);

        this.windows.delete(id);
        this.onWindowClosed(id, stageX, stageY);
    }

    createFluentBurst(stageX, stageY, stage) {
        const count = 16;
        const colors = ['#0078d4', '#60cdff', '#ffffff', '#8b5cf6', '#38bdf8', '#c084fc'];

        for (let i = 0; i < count; i++) {
            const particle = document.createElement('div');
            particle.className = 'fluent-particle';
            particle.style.left = `${stageX}px`;
            particle.style.top = `${stageY}px`;
            particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];

            const angle = Math.random() * Math.PI * 2;
            const speed = 80 + Math.random() * 200;
            const dx = Math.cos(angle) * speed;
            const dy = Math.sin(angle) * speed;

            particle.style.setProperty('--dx', `${dx}px`);
            particle.style.setProperty('--dy', `${dy}px`);

            stage.appendChild(particle);

            setTimeout(() => {
                if (particle.parentNode) particle.parentNode.removeChild(particle);
            }, 600);
        }
    }

    update(dt) {
        this.windows.forEach(win => {
            if (win.isDrifting) {
                win.x += win.vx * dt * 60;
                win.y += win.vy * dt * 60;

                const minX = 20;
                const maxX = 1080 - win.w - 30;
                const minY = 120;
                const maxY = 1920 - win.h - 140;

                if (win.x <= minX || win.x >= maxX) {
                    win.vx = -win.vx;
                    win.x = Math.max(minX, Math.min(maxX, win.x));
                }
                if (win.y <= minY || win.y >= maxY) {
                    win.vy = -win.vy;
                    win.y = Math.max(minY, Math.min(maxY, win.y));
                }

                win.element.style.left = `${win.x}px`;
                win.element.style.top = `${win.y}px`;
            }
        });
    }
}

window.WindowManager = WindowManager;
