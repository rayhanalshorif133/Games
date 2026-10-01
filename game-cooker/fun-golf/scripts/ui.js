// Fun Golf - Input & Touch Interaction Handler
// Translates pointer / touch events into 1080 x 1920 game space

class InputHandler {
    constructor(game, canvas) {
        this.game = game;
        this.canvas = canvas;
        this.isPointerDown = false;
        this.pointerPos = { x: 0, y: 0 };

        this.setupEvents();
    }

    setupEvents() {
        const c = this.canvas;

        // Pointer / Touch down
        const onDown = (e) => {
            e.preventDefault();
            this.game.audio.ensureContext();

            const pos = this.getCanvasPos(e);
            this.isPointerDown = true;
            this.pointerPos = pos;

            this.handlePointerDown(pos.x, pos.y);
        };

        // Pointer / Touch move
        const onMove = (e) => {
            if (!this.isPointerDown) return;
            e.preventDefault();
            const pos = this.getCanvasPos(e);
            this.pointerPos = pos;
            this.handlePointerMove(pos.x, pos.y);
        };

        // Pointer / Touch up
        const onUp = (e) => {
            if (!this.isPointerDown) return;
            e.preventDefault();
            this.isPointerDown = false;
            this.handlePointerUp();
        };

        c.addEventListener('mousedown', onDown);
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);

        c.addEventListener('touchstart', onDown, { passive: false });
        window.addEventListener('touchmove', onMove, { passive: false });
        window.addEventListener('touchend', onUp, { passive: false });
        window.addEventListener('touchcancel', onUp, { passive: false });
    }

    getCanvasPos(e) {
        const rect = this.canvas.getBoundingClientRect();
        let clientX = e.clientX;
        let clientY = e.clientY;

        if (e.touches && e.touches.length > 0) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else if (e.changedTouches && e.changedTouches.length > 0) {
            clientX = e.changedTouches[0].clientX;
            clientY = e.changedTouches[0].clientY;
        }

        const scaleX = 1080 / rect.width;
        const scaleY = 1920 / rect.height;

        return {
            x: (clientX - rect.left) * scaleX,
            y: (clientY - rect.top) * scaleY
        };
    }

    handlePointerDown(x, y) {
        // 1. Check Modals
        if (this.game.state === 'LEVEL_WON') {
            // Check Next Level button click
            const dw = 720;
            const dh = 560;
            const dy = (1920 - dh) / 2 - 40;
            const btnW = 380;
            const btnH = 88;
            const bx = (1080 - btnW) / 2;
            const by = dy + 360;

            if (x >= bx && x <= bx + btnW && y >= by && y <= by + btnH) {
                this.game.audio.playClick();
                this.game.nextLevel();
            }
            return;
        }

        if (this.game.state === 'LEVEL_SELECT') {
            const dw = 760;
            const dh = 720;
            const dx = (1080 - dw) / 2;
            const dy = (1920 - dh) / 2;

            LEVELS_DATA.forEach((lvl, idx) => {
                const col = idx % 3;
                const row = Math.floor(idx / 3);
                const lx = dx + 120 + col * 200;
                const ly = dy + 180 + row * 180;
                const size = 130;

                if (Math.abs(x - lx) < size / 2 && Math.abs(y - ly) < size / 2) {
                    this.game.audio.playClick();
                    this.game.loadLevel(lvl.levelNumber);
                }
            });
            // Click outside to close
            if (x < dx || x > dx + dw || y < dy || y > dy + dh) {
                this.game.state = 'PLAYING';
            }
            return;
        }

        // 2. Check Top-Right UI Buttons
        const btnRadius = 45;
        const btnX = 990;

        // Button 1: Home (Y: 65)
        if (Math.hypot(x - btnX, y - 65) < btnRadius) {
            this.game.audio.playClick();
            this.game.loadLevel(1);
            return;
        }

        // Button 2: Levels (Y: 156)
        if (Math.hypot(x - btnX, y - 156) < btnRadius) {
            this.game.audio.playClick();
            this.game.state = 'LEVEL_SELECT';
            return;
        }

        // Button 3: Restart (Y: 244)
        if (Math.hypot(x - btnX, y - 244) < btnRadius) {
            this.game.audio.playClick();
            this.game.restartLevel();
            return;
        }

        // 3. Gameplay "HOLD & RELEASE"
        if (this.game.ball && this.game.ball.state === 'IDLE') {
            this.game.startCharging(x, y);
        }
    }

    handlePointerMove(x, y) {
        if (this.game.ball && this.game.ball.state === 'CHARGING') {
            this.game.updateAimPosition(x, y);
        }
    }

    handlePointerUp() {
        if (this.game.ball && this.game.ball.state === 'CHARGING') {
            this.game.releaseShot();
        }
    }
}

window.InputHandler = InputHandler;
