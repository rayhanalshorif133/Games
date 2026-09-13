/**
 * UI & Menu Management for 2D Soccer Game
 */
class UIManager {
    constructor() {
        this.currentScreen = 'menu'; // 'menu', 'lobby', 'join_modal', 'room_list', 'game', 'game_over'
        this.gameMode = 'multiplayer'; // 'multiplayer', 'ai', 'local'
        this.aiDifficulty = 'normal'; // 'easy', 'normal', 'hard'

        // Cache DOM elements
        this.screens = {
            menu: document.getElementById('menu-screen'),
            lobby: document.getElementById('lobby-screen'),
            joinModal: document.getElementById('join-modal'),
            roomListModal: document.getElementById('room-list-modal'),
            gameOverModal: document.getElementById('game-over-modal'),
            countdownOverlay: document.getElementById('countdown-overlay')
        };

        this.hud = {
            container: document.getElementById('game-hud'),
            p1Name: document.getElementById('hud-p1-name'),
            p2Name: document.getElementById('hud-p2-name'),
            scoreText: document.getElementById('hud-score'),
            matchTime: document.getElementById('hud-time'),
            pingDisplay: document.getElementById('hud-ping'),
            muteBtn: document.getElementById('btn-mute'),
            exitBtn: document.getElementById('btn-exit-game')
        };

        this.lobby = {
            codeDisplay: document.getElementById('lobby-room-code'),
            copyBtn: document.getElementById('btn-copy-code'),
            nameInput: document.getElementById('lobby-name-input'),
            p1Slot: document.getElementById('lobby-p1-status'),
            p2Slot: document.getElementById('lobby-p2-status'),
            readyBtn: document.getElementById('btn-lobby-ready'),
            backBtn: document.getElementById('btn-lobby-back'),
            statusMessage: document.getElementById('lobby-status-msg')
        };

        this.join = {
            nameInput: document.getElementById('join-name-input'),
            codeInput: document.getElementById('join-code-input'),
            enterBtn: document.getElementById('btn-join-enter'),
            backBtn: document.getElementById('btn-join-back'),
            errorMsg: document.getElementById('join-error-msg')
        };

        this.roomList = {
            container: document.getElementById('room-list-items'),
            refreshBtn: document.getElementById('btn-refresh-rooms'),
            backBtn: document.getElementById('btn-room-list-back')
        };

        this.gameOver = {
            winnerTitle: document.getElementById('winner-title'),
            finalScore: document.getElementById('final-score-text'),
            rematchBtn: document.getElementById('btn-rematch'),
            menuBtn: document.getElementById('btn-gameover-menu')
        };

        this.bindEvents();
    }

    bindEvents() {
        // Menu Buttons
        document.getElementById('btn-create-room')?.addEventListener('click', () => {
            if (window.audioManager) window.audioManager.playClick();
            this.handleCreateRoom();
        });

        document.getElementById('btn-join-code')?.addEventListener('click', () => {
            if (window.audioManager) window.audioManager.playClick();
            this.showScreen('join_modal');
        });

        document.getElementById('btn-show-rooms')?.addEventListener('click', () => {
            if (window.audioManager) window.audioManager.playClick();
            this.handleShowRoomList();
        });

        document.getElementById('btn-play-ai')?.addEventListener('click', () => {
            if (window.audioManager) window.audioManager.playClick();
            this.startAIGame();
        });

        document.getElementById('btn-play-local')?.addEventListener('click', () => {
            if (window.audioManager) window.audioManager.playClick();
            this.startLocalGame();
        });

        // Join Modal Events
        this.join.enterBtn?.addEventListener('click', () => {
            if (window.audioManager) window.audioManager.playClick();
            this.handleJoinSubmit();
        });

        this.join.backBtn?.addEventListener('click', () => {
            if (window.audioManager) window.audioManager.playClick();
            this.showScreen('menu');
        });

        this.join.codeInput?.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/[^0-9]/g, '').slice(0, 4);
        });

        // Lobby Events
        this.lobby.copyBtn?.addEventListener('click', () => {
            const code = this.lobby.codeDisplay.innerText;
            if (code && code !== '----') {
                navigator.clipboard?.writeText(code).then(() => {
                    this.lobby.copyBtn.innerText = 'COPIED!';
                    setTimeout(() => {
                        this.lobby.copyBtn.innerText = 'COPY';
                    }, 1800);
                });
            }
        });

        this.lobby.nameInput?.addEventListener('change', (e) => {
            const name = e.target.value.trim().slice(0, 16);
            if (name && window.networkManager) {
                window.networkManager.playerName = name;
            }
        });

        this.lobby.readyBtn?.addEventListener('click', () => {
            if (window.audioManager) window.audioManager.playClick();
            if (window.gameController) {
                window.gameController.toggleReady();
            }
        });

        this.lobby.backBtn?.addEventListener('click', () => {
            if (window.audioManager) window.audioManager.playClick();
            if (window.networkManager) {
                window.networkManager.leaveRoom();
            }
            this.showScreen('menu');
        });

        // Room List Modal Events
        this.roomList.refreshBtn?.addEventListener('click', () => {
            if (window.audioManager) window.audioManager.playClick();
            this.handleShowRoomList();
        });

        this.roomList.backBtn?.addEventListener('click', () => {
            if (window.audioManager) window.audioManager.playClick();
            this.showScreen('menu');
        });

        // In-game HUD
        this.hud.muteBtn?.addEventListener('click', () => {
            if (window.audioManager) {
                const muted = window.audioManager.toggleMute();
                this.hud.muteBtn.innerText = muted ? '🔇' : '🔊';
            }
        });

        this.hud.exitBtn?.addEventListener('click', () => {
            if (confirm('Are you sure you want to exit the match?')) {
                if (window.audioManager) window.audioManager.playClick();
                if (window.gameController) {
                    window.gameController.exitToMenu();
                }
            }
        });

        // Game Over Buttons
        this.gameOver.rematchBtn?.addEventListener('click', () => {
            if (window.audioManager) window.audioManager.playClick();
            if (window.gameController) {
                window.gameController.handleRematch();
            }
        });

        this.gameOver.menuBtn?.addEventListener('click', () => {
            if (window.audioManager) window.audioManager.playClick();
            if (window.gameController) {
                window.gameController.exitToMenu();
            }
        });
    }

    showScreen(screenName) {
        this.currentScreen = screenName;

        // Hide all screens
        Object.values(this.screens).forEach(el => {
            if (el) el.classList.add('hidden');
        });

        // Hide/show in-game HUD
        if (screenName === 'game') {
            this.hud.container.classList.remove('hidden');
        } else {
            this.hud.container.classList.add('hidden');
        }

        // Show target screen
        switch (screenName) {
            case 'menu':
                this.screens.menu?.classList.remove('hidden');
                break;
            case 'lobby':
                this.screens.lobby?.classList.remove('hidden');
                break;
            case 'join_modal':
                this.screens.joinModal?.classList.remove('hidden');
                this.join.errorMsg.innerText = '';
                this.join.codeInput.value = '';
                break;
            case 'room_list':
                this.screens.roomListModal?.classList.remove('hidden');
                break;
            case 'game_over':
                this.screens.gameOverModal?.classList.remove('hidden');
                break;
            case 'game':
                // No modal active, canvas & HUD visible
                break;
        }
    }

    handleCreateRoom() {
        this.gameMode = 'multiplayer';
        const name = (this.lobby.nameInput.value || 'Player 1').trim().slice(0, 16);
        if (window.networkManager) {
            window.networkManager.createRoom(name);
        }
        this.lobby.statusMessage.innerText = 'Creating room code...';
        this.showScreen('lobby');
    }

    handleJoinSubmit() {
        const code = (this.join.codeInput.value || '').trim();
        const name = (this.join.nameInput.value || 'Player 2').trim().slice(0, 16);

        if (code.length !== 4) {
            this.join.errorMsg.innerText = 'Please enter a valid 4-digit code.';
            return;
        }

        this.gameMode = 'multiplayer';
        if (window.networkManager) {
            window.networkManager.joinRoom(code, name);
        }
        this.join.errorMsg.innerText = 'Connecting to room ' + code + '...';
    }

    handleShowRoomList() {
        if (window.networkManager) {
            window.networkManager.connect();
            if (window.networkManager.connected) {
                window.networkManager.getRooms();
            } else {
                window.networkManager.on('connected', () => {
                    window.networkManager.getRooms();
                });
            }
        }
        this.roomList.container.innerHTML = '<div class="room-loading">Fetching available rooms...</div>';
        this.showScreen('room_list');
    }

    updateRoomList(rooms) {
        if (!rooms || rooms.length === 0) {
            this.roomList.container.innerHTML = '<div class="no-rooms">No active rooms found.<br>Create a room to start!</div>';
            return;
        }

        let html = '';
        rooms.forEach(r => {
            html += `
                <div class="room-card">
                    <div class="room-info">
                        <div class="room-host">⚽ ${this.escapeHtml(r.hostName)}'s Room</div>
                        <div class="room-code-tag">Code: <strong>${r.code}</strong></div>
                    </div>
                    <button class="btn-join-room-card" data-code="${r.code}">JOIN</button>
                </div>
            `;
        });
        this.roomList.container.innerHTML = html;

        // Attach join handlers
        this.roomList.container.querySelectorAll('.btn-join-room-card').forEach(btn => {
            btn.addEventListener('click', () => {
                const code = btn.getAttribute('data-code');
                const name = (this.join.nameInput.value || 'Player 2').trim().slice(0, 16);
                if (window.networkManager) {
                    window.networkManager.joinRoom(code, name);
                }
            });
        });
    }

    startAIGame() {
        this.gameMode = 'ai';
        if (window.gameController) {
            window.gameController.startAIGame();
        }
    }

    startLocalGame() {
        this.gameMode = 'local';
        if (window.gameController) {
            window.gameController.startLocalGame();
        }
    }

    updateLobbyView(data) {
        if (data.roomCode) {
            this.lobby.codeDisplay.innerText = data.roomCode;
        }
        const isHost = data.role === 1;

        if (isHost) {
            this.lobby.p1Slot.innerHTML = `<span class="slot-name">${this.escapeHtml(data.playerName || 'Player 1')} (Host)</span> <span class="slot-badge ${data.hostReady ? 'ready' : 'waiting'}">${data.hostReady ? '✓ READY' : 'NOT READY'}</span>`;
            if (data.guestName) {
                this.lobby.p2Slot.innerHTML = `<span class="slot-name">${this.escapeHtml(data.guestName)}</span> <span class="slot-badge ${data.guestReady ? 'ready' : 'waiting'}">${data.guestReady ? '✓ READY' : 'NOT READY'}</span>`;
                this.lobby.statusMessage.innerText = 'Opponent joined! Click READY to play.';
            } else {
                this.lobby.p2Slot.innerHTML = `<span class="slot-name waiting">Waiting for Player 2 to join...</span>`;
                this.lobby.statusMessage.innerText = 'Share the 4-digit code with your friend!';
            }
        } else {
            this.lobby.p1Slot.innerHTML = `<span class="slot-name">${this.escapeHtml(data.hostName || 'Player 1')} (Host)</span> <span class="slot-badge ${data.hostReady ? 'ready' : 'waiting'}">${data.hostReady ? '✓ READY' : 'NOT READY'}</span>`;
            this.lobby.p2Slot.innerHTML = `<span class="slot-name">${this.escapeHtml(data.playerName || 'Player 2')}</span> <span class="slot-badge ${data.guestReady ? 'ready' : 'waiting'}">${data.guestReady ? '✓ READY' : 'NOT READY'}</span>`;
            this.lobby.statusMessage.innerText = 'Joined room! Click READY when prepared.';
        }

        const myReady = isHost ? data.hostReady : data.guestReady;
        this.lobby.readyBtn.innerText = myReady ? 'UNREADY' : 'READY';
        this.lobby.readyBtn.className = myReady ? 'ready-btn active' : 'ready-btn';
    }

    showCountdown(num, callback) {
        const overlay = this.screens.countdownOverlay;
        if (!overlay) return;

        overlay.classList.remove('hidden');
        overlay.innerText = num === 0 ? 'GO!' : num;
        overlay.classList.remove('pulse-anim');
        void overlay.offsetWidth; // Trigger reflow
        overlay.classList.add('pulse-anim');

        if (window.audioManager) {
            window.audioManager.playCountdown(num === 0);
        }

        setTimeout(() => {
            if (num > 0) {
                this.showCountdown(num - 1, callback);
            } else {
                overlay.classList.add('hidden');
                if (callback) callback();
            }
        }, 850);
    }

    updateHUD(p1Name, p2Name, score, timeSeconds) {
        this.hud.p1Name.innerText = (p1Name || 'PLAYER 1').toUpperCase();
        this.hud.p2Name.innerText = (p2Name || 'PLAYER 2').toUpperCase();
        this.hud.scoreText.innerText = `${score[0]} - ${score[1]}`;

        const mins = Math.floor(timeSeconds / 60);
        const secs = Math.floor(timeSeconds % 60);
        this.hud.matchTime.innerText = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    }

    updatePing(ms) {
        if (this.hud.pingDisplay) {
            this.hud.pingDisplay.innerText = `${ms} ms`;
        }
    }

    showGameOver(winnerName, finalScore) {
        this.gameOver.winnerTitle.innerText = `${winnerName.toUpperCase()} WINS! 🏆`;
        this.gameOver.finalScore.innerText = `${finalScore[0]} - ${finalScore[1]}`;
        this.showScreen('game_over');
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.innerText = text || '';
        return div.innerHTML;
    }
}

window.uiManager = new UIManager();

