// Merge Numbers - Core Game Logic & Mechanics
// Implements 2248 Connect rules, 5x7 grid, drag chains, gravity drop physics, combo multipliers

// Global reactive timer state container (listens to window.TIMER / window.TIMMER)
(function initReactiveTimerProperties() {
    if (typeof window === 'undefined') return;
    if (window._timerPropsDefined) return;
    window._timerPropsDefined = true;

    let _timerVal = 123;
    if (window.TIMER !== undefined) {
        const n = Number(window.TIMER);
        if (!isNaN(n) && n > 0) _timerVal = n;
    } else if (window.TIMMER !== undefined) {
        const n = Number(window.TIMMER);
        if (!isNaN(n) && n > 0) _timerVal = n;
    }

    function onTimerSet(newVal) {
        const num = Number(newVal);
        if (!isNaN(num) && num > 0) {
            _timerVal = num;
            if (window.game && typeof window.game.setTimer === 'function') {
                window.game.setTimer(num);
            }
        }
    }

    try {
        Object.defineProperty(window, 'TIMER', {
            get() { return _timerVal; },
            set(val) { onTimerSet(val); },
            configurable: true,
            enumerable: true
        });

        Object.defineProperty(window, 'TIMMER', {
            get() { return _timerVal; },
            set(val) { onTimerSet(val); },
            configurable: true,
            enumerable: true
        });

        Object.defineProperty(window, 'TIME_LEFT', {
            get() { return window.game ? Math.ceil(window.game.timeLeft) : _timerVal; },
            set(val) {
                const num = Number(val);
                if (!isNaN(num) && num >= 0 && window.game) {
                    window.game.timeLeft = num;
                    if (num > 0 && window.game.state === 'GAMEOVER' && window.game.gameOverReason === 'TIME_UP') {
                        window.game.state = 'IDLE';
                        window.game.gameOverReason = '';
                    }
                }
            },
            configurable: true,
            enumerable: true
        });
    } catch (e) {
        console.warn('Reactive timer definition:', e);
    }
})();

class MergeNumbersGame {
    constructor() {
        this.cols = 5;
        this.rows = 7;
        this.tileSize = 176;
        this.tileGap = 24;
        this.boardWidth = this.cols * this.tileSize + (this.cols - 1) * this.tileGap;   // 976 px
        this.boardHeight = this.rows * this.tileSize + (this.rows - 1) * this.tileGap; // 1376 px
        this.startX = Math.floor((1080 - this.boardWidth) / 2); // 52 px
        this.startY = 248;

        this.grid = [];
        this.activeChain = [];
        this.pointerPos = { x: 0, y: 0 };
        this.isDragging = false;

        this.score = 0;
        this.displayScore = 0;
        this.bestScore = parseInt(localStorage.getItem('merge_numbers_best') || '0', 10);
        if (this.bestScore > 5000) {
            this.bestScore = 0;
            localStorage.removeItem('merge_numbers_best');
        }

        this.state = 'IDLE';
        this.history = [];

        // Dynamic Global Countdown Timer (reactive to window.TIMER / window.TIMMER)
        this.maxTimer = this.getGlobalTimer();
        this.timeLeft = this.maxTimer;
        this._lastGlobalTimer = this.maxTimer;
        this.gameOverReason = '';

        this.idleTimer = 0;
        this.tutorialPath = null;
        this.tutorialProgress = 0;
        this.tutorialActive = false;

        this.activePopup = null;

        this.initGrid();
    }

    getGlobalTimer() {
        if (typeof window !== 'undefined') {
            const val = (window.TIMER !== undefined) ? window.TIMER : window.TIMMER;
            const num = Number(val);
            if (!isNaN(num) && num > 0) return num;
        }
        return 300;
    }

    setTimer(seconds) {
        const num = Number(seconds);
        if (isNaN(num) || num <= 0) return;
        this.maxTimer = num;
        this.timeLeft = num;
        this._lastGlobalTimer = num;
        if (this.state === 'GAMEOVER' && this.gameOverReason === 'TIME_UP') {
            this.state = 'IDLE';
            this.gameOverReason = '';
        }
        if (typeof window !== 'undefined' && window.particleSystem && typeof window.particleSystem.spawnFloatingText === 'function') {
            window.particleSystem.spawnFloatingText(`⏱ ${num}s`, 540, 320, '#00d2d3', 44);
        }
        console.log(`[Timer Updated] Game timer set to ${num} seconds`);
    }

    getCellCenter(r, c) {
        return {
            x: this.startX + c * (this.tileSize + this.tileGap) + this.tileSize / 2,
            y: this.startY + r * (this.tileSize + this.tileGap) + this.tileSize / 2
        };
    }

    pixelToGrid(x, y) {
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                const center = this.getCellCenter(r, c);
                const half = (this.tileSize + this.tileGap * 0.4) / 2;
                if (Math.abs(x - center.x) <= half && Math.abs(y - center.y) <= half) {
                    return { r, c };
                }
            }
        }
        return null;
    }

    getRandomValue() {
        const rand = Math.random();
        if (rand < 0.45) return 2;
        if (rand < 0.72) return 4;
        if (rand < 0.88) return 8;
        if (rand < 0.96) return 16;
        if (rand < 0.99) return 32;
        return 64;
    }

    initGrid() {
        this.grid = [];
        this.activeChain = [];
        this.history = [];
        this.state = 'IDLE';

        const demoGrid = [
            [16, 4, 16, 4, 8],
            [16, 2, 2, 2, 2],
            [2, 16, 64, 2, 64],
            [2, 64, 2, 16, 16],
            [4, 16, 2, 16, 64],
            [64, 16, 2, 2, 4],
            [16, 8, 64, 16, 2]
        ];

        for (let r = 0; r < this.rows; r++) {
            this.grid[r] = [];
            for (let c = 0; c < this.cols; c++) {
                const center = this.getCellCenter(r, c);
                const val = demoGrid[r][c];
                this.grid[r][c] = {
                    value: val,
                    x: center.x,
                    y: center.y,
                    targetX: center.x,
                    targetY: center.y,
                    scale: 1,
                    flash: 0,
                    alpha: 1,
                    isMerging: false
                };
            }
        }

        this.tutorialPath = [
            { r: 2, c: 0 },
            { r: 1, c: 1 },
            { r: 1, c: 2 },
            { r: 1, c: 3 },
            { r: 1, c: 4 },
            { r: 2, c: 3 },
            { r: 3, c: 2 },
            { r: 4, c: 2 },
            { r: 5, c: 2 },
            { r: 5, c: 3 }
        ];
        this.tutorialActive = true;
        this.tutorialProgress = 9.99;
        this.idleTimer = 0;
    }

    restart() {
        this.score = 0;
        this.displayScore = 0;
        const targetTime = this.getGlobalTimer();
        this.maxTimer = targetTime;
        this.timeLeft = targetTime;
        this._lastGlobalTimer = targetTime;
        this.gameOverReason = '';
        this.initGrid();
        if (typeof window !== 'undefined' && window.particleSystem) window.particleSystem.reset();
        if (typeof window !== 'undefined' && window.audioManager) window.audioManager.playClick();
    }

    saveState() {
        const snapshot = {
            score: this.score,
            grid: this.grid.map(row => row.map(tile => ({ ...tile })))
        };
        this.history.push(snapshot);
        if (this.history.length > 5) this.history.shift();
    }

    undo() {
        if (this.state !== 'IDLE' || this.history.length === 0) return;
        const last = this.history.pop();
        this.score = last.score;
        this.displayScore = last.score;
        this.grid = last.grid.map(row => row.map(tile => ({ ...tile })));
        this.activeChain = [];
        window.audioManager.playClick();
        window.particleSystem.spawnFloatingText('UNDO', 540, 960, '#ffcc00', 60);
    }

    shuffleBoard() {
        if (this.state !== 'IDLE') return;
        this.saveState();
        window.audioManager.playShuffle();

        const values = [];
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                values.push(this.grid[r][c].value);
            }
        }

        for (let i = values.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [values[i], values[j]] = [values[j], values[i]];
        }

        let idx = 0;
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                const center = this.getCellCenter(r, c);
                this.grid[r][c].value = values[idx++];
                this.grid[r][c].scale = 1.10;
                this.grid[r][c].flash = 0.8;
                window.particleSystem.spawnTrailSparkle(center.x, center.y, '#ffd32a');
            }
        }

        window.particleSystem.triggerShake(10, 0.2);
        window.particleSystem.spawnFloatingText('SHUFFLE!', 540, 960, '#2ecc71', 68);
        this.resetIdleTimer();
    }

    resetIdleTimer() {
        this.idleTimer = 0;
        this.tutorialActive = false;
        this.tutorialPath = null;
        this.tutorialProgress = 0;
    }

    findBestMove() {
        let bestChain = [];
        const visited = Array.from({ length: this.rows }, () => Array(this.cols).fill(false));

        const dfs = (r, c, currentChain) => {
            if (currentChain.length > bestChain.length) {
                bestChain = [...currentChain];
            }
            if (currentChain.length >= 8) return;

            const currVal = this.grid[r][c].value;

            for (let dr = -1; dr <= 1; dr++) {
                for (let dc = -1; dc <= 1; dc++) {
                    if (dr === 0 && dc === 0) continue;
                    const nr = r + dr;
                    const nc = c + dc;
                    if (nr >= 0 && nr < this.rows && nc >= 0 && nc < this.cols) {
                        if (!visited[nr][nc]) {
                            const nextVal = this.grid[nr][nc].value;
                            let canConnect = false;
                            if (nextVal === currVal) canConnect = true;
                            else if (currentChain.length >= 2 && nextVal === currVal * 2) canConnect = true;

                            if (canConnect) {
                                visited[nr][nc] = true;
                                currentChain.push({ r: nr, c: nc });
                                dfs(nr, nc, currentChain);
                                currentChain.pop();
                                visited[nr][nc] = false;
                            }
                        }
                    }
                }
            }
        };

        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                visited[r][c] = true;
                dfs(r, c, [{ r, c }]);
                visited[r][c] = false;
                if (bestChain.length >= 6) return bestChain;
            }
        }

        return bestChain.length >= 2 ? bestChain : null;
    }

    isAdjacent(r1, c1, r2, c2) {
        return Math.abs(r1 - r2) <= 1 && Math.abs(c1 - c2) <= 1 && !(r1 === r2 && c1 === c2);
    }

    calculateChainResult(chain) {
        if (!chain || chain.length === 0) return { resultVal: 0, points: 0 };
        const baseVal = this.grid[chain[0].r][chain[0].c].value;
        if (chain.length === 1) return { resultVal: baseVal, points: 0 };

        let sum = 0;
        for (const cell of chain) {
            sum += this.grid[cell.r][cell.c].value;
        }

        // Standard 2248 rule: result tile is the next power of 2 >= sum (minimum 2 * baseVal)
        const minVal = baseVal * 2;
        const targetSum = Math.max(minVal, sum);
        const resultVal = Math.pow(2, Math.ceil(Math.log2(targetSum)));

        // Balanced scoring: points awarded equal the merged tile value (e.g. +4, +8, +16, +32, +64...)
        const points = resultVal;
        return { resultVal, points };
    }

    handlePointerDown(x, y) {
        if (this.state !== 'IDLE') return;
        this.resetIdleTimer();

        const cell = this.pixelToGrid(x, y);
        if (cell) {
            this.isDragging = true;
            this.activeChain = [cell];
            this.pointerPos = { x, y };

            const tile = this.grid[cell.r][cell.c];
            tile.scale = 1.06;

            window.audioManager.playSelect(0);
            window.particleSystem.spawnTrailSparkle(tile.x, tile.y);
        }
    }

    handlePointerMove(x, y) {
        this.pointerPos = { x, y };
        this.resetIdleTimer();

        if (!this.isDragging || this.state !== 'IDLE' || this.activeChain.length === 0) return;

        const cell = this.pixelToGrid(x, y);
        if (!cell) return;

        const lastCell = this.activeChain[this.activeChain.length - 1];

        if (this.activeChain.length >= 2) {
            const prevCell = this.activeChain[this.activeChain.length - 2];
            if (cell.r === prevCell.r && cell.c === prevCell.c) {
                this.grid[lastCell.r][lastCell.c].scale = 1.0;
                this.activeChain.pop();
                window.audioManager.playDeselect();
                return;
            }
        }

        if (this.isAdjacent(cell.r, cell.c, lastCell.r, lastCell.c)) {
            const alreadyInChain = this.activeChain.some(c => c.r === cell.r && c.c === cell.c);
            if (!alreadyInChain) {
                const baseVal = this.grid[this.activeChain[0].r][this.activeChain[0].c].value;
                const prevVal = this.grid[lastCell.r][lastCell.c].value;
                const nextVal = this.grid[cell.r][cell.c].value;

                let canConnect = false;
                if (nextVal === baseVal) {
                    canConnect = true;
                } else if (this.activeChain.length >= 2 && nextVal === prevVal * 2) {
                    canConnect = true;
                }

                if (canConnect) {
                    this.activeChain.push(cell);
                    const tile = this.grid[cell.r][cell.c];
                    tile.scale = 1.06;

                    window.audioManager.playSelect(this.activeChain.length - 1);
                    window.particleSystem.spawnTrailSparkle(tile.x, tile.y);
                }
            }
        }
    }

    handlePointerUp() {
        if (!this.isDragging) return;
        this.isDragging = false;

        if (this.activeChain.length >= 2) {
            this.executeMerge();
        } else {
            this.activeChain.forEach(c => {
                this.grid[c.r][c.c].scale = 1.0;
            });
            this.activeChain = [];
        }

        this.resetIdleTimer();
    }

    executeMerge() {
        this.saveState();
        this.state = 'ANIMATING_MERGE';

        const { resultVal, points } = this.calculateChainResult(this.activeChain);
        const targetCell = this.activeChain[this.activeChain.length - 1];
        const targetTile = this.grid[targetCell.r][targetCell.c];
        const targetCenter = this.getCellCenter(targetCell.r, targetCell.c);

        this.score += points;
        if (this.score > this.bestScore) {
            this.bestScore = this.score;
            localStorage.setItem('merge_numbers_best', this.bestScore);
        }

        window.audioManager.playMerge(resultVal);

        const tileColor = this.getTileColor(resultVal);
        window.particleSystem.spawnMergeBurst(targetCenter.x, targetCenter.y, tileColor, this.activeChain.length > 5 ? 36 : 24);
        window.particleSystem.spawnFloatingText(`+${points}`, targetCenter.x, targetCenter.y - 30, '#ffffff', 58);

        if (this.activeChain.length >= 8) {
            window.audioManager.playCombo();
            this.showPopup('INCREDIBLE!!');
        } else if (this.activeChain.length >= 5) {
            window.audioManager.playCombo();
            this.showPopup('AWESOME!');
        } else if (this.activeChain.length >= 4) {
            this.showPopup('GREAT MERGE!');
        }

        const mergeTiles = this.activeChain.slice(0, this.activeChain.length - 1);
        mergeTiles.forEach(c => {
            const tile = this.grid[c.r][c.c];
            tile.isMerging = true;
            tile.mergeTarget = { x: targetCenter.x, y: targetCenter.y };
        });

        targetTile.value = resultVal;
        targetTile.scale = 1.15;
        targetTile.flash = 1.0;

        setTimeout(() => {
            mergeTiles.forEach(c => {
                this.grid[c.r][c.c] = null;
            });
            targetTile.isMerging = false;
            targetTile.scale = 1.0;

            this.activeChain = [];
            this.executeGravityDrop();
        }, 220);
    }

    showPopup(text) {
        this.activePopup = {
            text,
            timer: 1.2,
            maxTimer: 1.2,
            scale: 0.2
        };
    }

    executeGravityDrop() {
        this.state = 'ANIMATING_DROP';
        let tilesDropped = false;

        for (let c = 0; c < this.cols; c++) {
            let writeRow = this.rows - 1;
            for (let r = this.rows - 1; r >= 0; r--) {
                if (this.grid[r][c] !== null) {
                    if (writeRow !== r) {
                        this.grid[writeRow][c] = this.grid[r][c];
                        this.grid[r][c] = null;
                        const dest = this.getCellCenter(writeRow, c);
                        this.grid[writeRow][c].targetX = dest.x;
                        this.grid[writeRow][c].targetY = dest.y;
                        tilesDropped = true;
                    }
                    writeRow--;
                }
            }

            let spawnOffset = 1;
            for (let r = writeRow; r >= 0; r--) {
                const dest = this.getCellCenter(r, c);
                const spawnY = this.startY - spawnOffset * (this.tileSize + this.tileGap);
                this.grid[r][c] = {
                    value: this.getRandomValue(),
                    x: dest.x,
                    y: spawnY,
                    targetX: dest.x,
                    targetY: dest.y,
                    scale: 1,
                    flash: 0,
                    alpha: 1,
                    isMerging: false
                };
                spawnOffset++;
                tilesDropped = true;
            }
        }

        if (tilesDropped) {
            window.audioManager.playDrop();
        }

        setTimeout(() => {
            this.state = 'IDLE';
            this.checkGameOver();
        }, 320);
    }

    checkGameOver() {
        if (this.timeLeft <= 0) {
            this.state = 'GAMEOVER';
            this.gameOverReason = 'TIME_UP';
            window.audioManager.playGameOver();
            return;
        }
        const moves = this.findBestMove();
        if (!moves) {
            this.state = 'GAMEOVER';
            this.gameOverReason = 'NO_MOVES';
            window.audioManager.playGameOver();
        }
    }

    getTileColor(val) {
        const colors = {
            2: '#f5c30a',
            4: '#d83f3e',
            8: '#955fda',
            16: '#12b1ed',
            32: '#ff7f11',
            64: '#e3278b',
            128: '#2ecc71',
            256: '#3b5998',
            512: '#00b894',
            1024: '#e84393',
            2048: '#fdcb6e',
            4096: '#a29bfe'
        };
        return colors[val] || '#ffd32a';
    }

    update(dt) {
        // Dynamic timer sync: if window.TIMER or window.TIMMER is changed at runtime
        const currentGlobal = this.getGlobalTimer();
        if (this._lastGlobalTimer !== undefined && currentGlobal !== this._lastGlobalTimer) {
            this.setTimer(currentGlobal);
        }

        // Countdown Timer -> Game Over when time runs out
        if (this.state !== 'GAMEOVER') {
            this.timeLeft -= dt;
            if (this.timeLeft <= 0) {
                this.timeLeft = 0;
                this.state = 'GAMEOVER';
                this.gameOverReason = 'TIME_UP';
                if (typeof window !== 'undefined' && window.audioManager) window.audioManager.playGameOver();
                if (typeof window !== 'undefined' && window.particleSystem) window.particleSystem.spawnFloatingText("TIME'S UP!", 540, 960, '#ff4757', 72);
            }
        }

        if (this.displayScore < this.score) {
            const diff = this.score - this.displayScore;
            this.displayScore += Math.max(1, Math.ceil(diff * 12 * dt));
            if (this.displayScore > this.score) this.displayScore = this.score;
        }

        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                const tile = this.grid[r][c];
                if (!tile) continue;

                if (tile.isMerging && tile.mergeTarget) {
                    tile.x += (tile.mergeTarget.x - tile.x) * 18 * dt;
                    tile.y += (tile.mergeTarget.y - tile.y) * 18 * dt;
                    tile.scale = Math.max(0.2, tile.scale - 2.5 * dt);
                } else {
                    tile.x += (tile.targetX - tile.x) * 22 * dt;
                    tile.y += (tile.targetY - tile.y) * 22 * dt;
                    const isSelected = this.activeChain.some(cell => cell.r === r && cell.c === c);
                    const targetScale = isSelected ? 1.03 : 1.0;
                    tile.scale += (targetScale - tile.scale) * 14 * dt;
                }

                if (tile.flash > 0) {
                    tile.flash = Math.max(0, tile.flash - 3 * dt);
                }
            }
        }

        if (this.activePopup) {
            this.activePopup.timer -= dt;
            const progress = 1 - this.activePopup.timer / this.activePopup.maxTimer;
            if (progress < 0.25) {
                this.activePopup.scale = 0.2 + (progress / 0.25) * 0.95;
            } else if (progress > 0.8) {
                this.activePopup.scale = 1.15 - ((progress - 0.8) / 0.2) * 0.4;
            }
            if (this.activePopup.timer <= 0) {
                this.activePopup = null;
            }
        }

        if (this.state === 'IDLE' && !this.isDragging) {
            this.idleTimer += dt;
            if (this.idleTimer >= 2.5 && !this.tutorialActive) {
                this.tutorialPath = this.findBestMove();
                if (this.tutorialPath && this.tutorialPath.length >= 2) {
                    this.tutorialActive = true;
                    this.tutorialProgress = 0;
                }
            }

            if (this.tutorialActive && this.tutorialPath) {
                this.tutorialProgress += dt * 1.5;
                if (this.tutorialProgress >= this.tutorialPath.length + 1.2) {
                    this.tutorialProgress = 0;
                }
            }
        }
    }
}

window.game = new MergeNumbersGame();
