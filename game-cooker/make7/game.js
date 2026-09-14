/**
 * MAKE 7 - Complete Game Engine (1080x1920 Mobile Portrait)
 * Exact recreation of make7 demo.mp4:
 * - Single and Double-hex rotatable domino pieces (60° rotation)
 * - 19-cell Honeycomb board (rows: 3, 4, 5, 4, 3)
 * - Drag-and-drop with touch offset & tap-to-rotate
 * - Exact video scoring math (Points = Value * Count * 3 * Combo)
 * - Liquid bubble-pop merge chimes and combo banners
 * - Target Rainbow 7 tile and explosive shockwave blast
 * - Bottom Boosters: Trash, Hammer, Undo
 * - 7-Day Event daily rewards modal with confetti
 */

const CANVAS_W = 1080;
const CANVAS_H = 1920;
const HEX_R = 76; // Circumradius of board hexagon socket
const HEX_DX = Math.sqrt(3) * HEX_R; // ~131.63px
const HEX_DY = 1.5 * HEX_R; // 114px

// 6 Hexagonal Neighbor Directions: 0, 60, 120, 180, 240, 300 deg
const HEX_DIRECTIONS = [
    { angle: 0,   dx: HEX_DX,       dy: 0 },
    { angle: 60,  dx: HEX_DX / 2,   dy: HEX_DY },
    { angle: 120, dx: -HEX_DX / 2,  dy: HEX_DY },
    { angle: 180, dx: -HEX_DX,      dy: 0 },
    { angle: 240, dx: -HEX_DX / 2,  dy: -HEX_DY },
    { angle: 300, dx: HEX_DX / 2,   dy: -HEX_DY }
];

class Make7GamePortrait {
    constructor() {
        // DOM Canvas References
        this.boardCanvas = document.getElementById('board-canvas');
        this.boardCtx = this.boardCanvas.getContext('2d');
        this.spawnerCanvas = document.getElementById('spawner-canvas');
        this.spawnerCtx = this.spawnerCanvas.getContext('2d');
        this.fxCanvas = document.getElementById('fx-canvas');
        this.fxCtx = this.fxCanvas.getContext('2d');

        // Player Economy & Game State (from video)
        this.score = 0;
        this.bestScore = parseInt(localStorage.getItem('make7_best_score') || '0');
        this.coins = parseInt(localStorage.getItem('make7_coins') || '350');
        this.comboCount = 0;
        this.isHammerActive = false;
        this.historyStack = [];

        // FX & Animation Engines
        this.particles = [];
        this.floatingScores = [];
        this.shockwaves = [];
        this.hoveredCells = [];
        this.flyingMergeTiles = [];
        this.recentPlacedCells = [];

        // Dragging & Interaction State
        this.isDragging = false;
        this.dragStartPos = { x: 0, y: 0 };
        this.dragCurrentPos = { x: 0, y: 0 };
        this.dragVisualPos = { x: 0, y: 0 };
        this.dragLiftProgress = 0;
        this.dragScale = 1.0;
        this.targetTouchOffsetY = -130;
        this.hasMoved = false;

        // Visual Rotation Animation
        this.currentAngle = 0;
        this.targetAngle = 0;

        // Preload Sprites
        this.sprites = {};
        this.loadSprites();

        // 19 Board Cells (3-4-5-4-3 rows)
        this.cells = [];
        this.initBoardCells();

        // Current Spawner Piece (Single or Double)
        this.currentPiece = null;
        this.rollNewPiece();

        // Setup Inputs & UI Handlers
        this.initInputs();
        this.initUI();
        this.updateSettingsUI();

        // Initial UI Render
        this.updateHUD();
        this.renderBoard();
        this.renderSpawner();
        // Start 60fps Loop
        this.lastTime = performance.now();
        requestAnimationFrame((t) => this.loop(t));
    }

    loadSprites() {
        const paths = {
            slot: 'assets/sprites_v2/board_slot_dark.png',
            tile_1: 'assets/sprites_v2/tile_1.png',
            tile_2: 'assets/sprites_v2/tile_2.png',
            tile_3: 'assets/sprites_v2/tile_3.png',
            tile_4: 'assets/sprites_v2/tile_4.png',
            tile_5: 'assets/sprites_v2/tile_5.png',
            tile_6: 'assets/sprites_v2/tile_6.png',
            tile_7: 'assets/sprites_v2/tile_7_rainbow.png',
            rotate_arrows: 'assets/ui_v2/icon_rotate_arrows.png',
            gift: 'assets/ui_v2/gift_box.png',
            trophy: 'assets/ui_v2/icon_trophy.png'
        };

        for (const [k, p] of Object.entries(paths)) {
            const img = new Image();
            img.src = p;
            img.onload = () => {
                this.renderBoard();
                this.renderSpawner();
            };
            this.sprites[k] = img;
        }
    }

    initBoardCells() {
        // Board canvas size: 860 x 780, center: (430, 390)
        const cx = 430;
        const cy = 390;
        const rowCounts = [3, 4, 5, 4, 3];
        const rowYOffsets = [-2 * HEX_DY, -HEX_DY, 0, HEX_DY, 2 * HEX_DY];

        let id = 0;
        for (let r = 0; r < rowCounts.length; r++) {
            const count = rowCounts[r];
            const y = cy + rowYOffsets[r];
            const startX = cx - ((count - 1) / 2) * HEX_DX;

            for (let c = 0; c < count; c++) {
                const x = startX + c * HEX_DX;
                this.cells.push({
                    id: id++,
                    row: r,
                    col: c,
                    x: x,
                    y: y,
                    value: null, // null = empty, 1..6, 7 (rainbow)
                    scale: 1,
                    pulse: 0
                });
            }
        }
    }

    rollNewPiece() {
        // ~55% double connected pieces, ~45% single tiles
        const isDouble = Math.random() < 0.55;
        const rollVal = () => {
            const r = Math.random();
            if (r < 0.38) return 1;
            if (r < 0.68) return 2;
            if (r < 0.86) return 3;
            if (r < 0.95) return 4;
            return 5;
        };

        if (!isDouble) {
            this.currentPiece = {
                type: 'single',
                val1: rollVal(),
                rotationIndex: 0
            };
            this.currentAngle = 0;
            this.targetAngle = 0;
        } else {
            const initialRot = Math.floor(Math.random() * 6);
            this.currentPiece = {
                type: 'double',
                val1: rollVal(),
                val2: rollVal(),
                rotationIndex: initialRot
            };
            this.currentAngle = initialRot * 60;
            this.targetAngle = initialRot * 60;
        }
    }

    rotatePiece() {
        if (!this.currentPiece || this.currentPiece.type !== 'double') {
            window.sounds.playTap();
            return;
        }

        window.sounds.playRotate();
        this.currentPiece.rotationIndex = (this.currentPiece.rotationIndex + 1) % 6;
        this.targetAngle += 60;
    }

    initInputs() {
        // Unlock Web Audio Context on first interaction
        window.addEventListener('pointerdown', () => {
            window.sounds.init();
        }, { once: true });

        const spawnerContainer = document.getElementById('spawner-container');
        const boardElem = this.boardCanvas;

        // 1. Pointer Down on Spawner Dock (Pick up piece)
        spawnerContainer.addEventListener('pointerdown', (e) => {
            e.preventDefault();
            try {
                spawnerContainer.setPointerCapture(e.pointerId);
            } catch (err) {}

            const pt = this.getContainerPoint(e);
            this.isDragging = true;
            this.hasMoved = false;
            this.dragStartPos = { x: pt.x, y: pt.y };
            this.dragCurrentPos = { x: pt.x, y: pt.y };
            this.dragVisualPos = { x: pt.x, y: pt.y };
            this.dragLiftProgress = 0;
            this.dragScale = 1.0;

            const isTouch = e.pointerType === 'touch' || !('pointerType' in e);
            this.targetTouchOffsetY = isTouch ? -130 : -30;
        });

        // 2. Global Pointer Move
        window.addEventListener('pointermove', (e) => {
            if (this.isDragging) {
                const pt = this.getContainerPoint(e);
                this.dragCurrentPos = { x: pt.x, y: pt.y };
                const dist = Math.hypot(pt.x - this.dragStartPos.x, pt.y - this.dragStartPos.y);
                if (dist > 8) {
                    this.hasMoved = true;
                }
            } else {
                // Not dragging: mouse hover on board
                const rect = this.boardCanvas.getBoundingClientRect();
                if (e.clientX >= rect.left && e.clientX <= rect.right &&
                    e.clientY >= rect.top && e.clientY <= rect.bottom) {
                    const scaleX = 860 / rect.width;
                    const scaleY = 780 / rect.height;
                    const bx = (e.clientX - rect.left) * scaleX;
                    const by = (e.clientY - rect.top) * scaleY;
                    const best = this.findBestPlacementAt(bx, by);
                    this.hoveredCells = best || [];
                    this.renderBoard();
                } else {
                    if (this.hoveredCells.length > 0) {
                        this.hoveredCells = [];
                        this.renderBoard();
                    }
                }
            }
        });

        // 3. Pointer Up (Drop or Cancel)
        const handlePointerUp = (e) => {
            if (!this.isDragging) return;
            this.isDragging = false;

            try {
                spawnerContainer.releasePointerCapture(e.pointerId);
            } catch (err) {}

            if (!this.hasMoved) {
                // Tapped without dragging: DO NOT ROTATE!
                // Item click rotation is disabled per user request.
                this.hoveredCells = [];
                this.renderBoard();
                return;
            }

            // Dropped after dragging: check if hovered cells are valid!
            if (this.hoveredCells && this.hoveredCells.length > 0) {
                const primary = this.hoveredCells[0].cell;
                this.tryPlacePieceAt(primary);
            } else {
                window.sounds.playTap();
            }

            this.hoveredCells = [];
            this.renderBoard();
        };

        window.addEventListener('pointerup', handlePointerUp);
        spawnerContainer.addEventListener('pointercancel', () => {
            if (!this.isDragging) return;
            this.isDragging = false;
            this.hoveredCells = [];
            this.renderBoard();
        });

        // 4. Click directly on Board (Hammer smash or tap placement fallback)
        boardElem.addEventListener('pointerdown', (e) => {
            if (this.isDragging) return;

            const rect = this.boardCanvas.getBoundingClientRect();
            const scaleX = 860 / rect.width;
            const scaleY = 780 / rect.height;
            const bx = (e.clientX - rect.left) * scaleX;
            const by = (e.clientY - rect.top) * scaleY;

            if (this.isHammerActive) {
                let hammerCell = null;
                let minDist = HEX_R * 0.95;
                for (const c of this.cells) {
                    const d = Math.hypot(c.x - bx, c.y - by);
                    if (d < minDist) {
                        minDist = d;
                        hammerCell = c;
                    }
                }
                if (hammerCell && hammerCell.value !== null) {
                    window.sounds.playExplosion();
                    this.spawnParticles(hammerCell.x + 110, hammerCell.y + 400, 25, '#ff5555');
                    this.addFloatingScore('SMASHED!', hammerCell.x + 110, hammerCell.y + 360, '#ff7777');
                    hammerCell.value = null;
                    this.isHammerActive = false;
                    document.getElementById('btn-booster-hammer').style.filter = '';
                    this.renderBoard();
                }
                return;
            }

            const best = this.findBestPlacementAt(bx, by);
            if (best && best.length > 0) {
                this.tryPlacePieceAt(best[0].cell);
            }
        });
    }

    getContainerPoint(e) {
        const container = document.getElementById('canvas-container');
        const rect = container.getBoundingClientRect();
        const scaleX = CANVAS_W / rect.width;
        const scaleY = CANVAS_H / rect.height;
        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY
        };
    }

    findBestPlacementAt(boardX, boardY) {
        if (!this.currentPiece) return null;

        if (this.currentPiece.type === 'single') {
            let bestCell = null;
            let minDist = HEX_R * 1.15; // Generous snap radius
            for (const cell of this.cells) {
                if (cell.value !== null) continue;
                const d = Math.hypot(cell.x - boardX, cell.y - boardY);
                if (d < minDist) {
                    minDist = d;
                    bestCell = cell;
                }
            }
            if (bestCell) {
                return [
                    { cell: bestCell, val: this.currentPiece.val1 }
                ];
            }
            return null;
        } else {
            const dir = HEX_DIRECTIONS[this.currentPiece.rotationIndex];
            let bestPair = null;
            let minDist = HEX_R * 1.35; // Generous magnetic snap radius

            for (const c1 of this.cells) {
                if (c1.value !== null) continue;
                const c2 = this.findCellNear(c1.x + dir.dx, c1.y + dir.dy);
                if (!c2 || c2.value !== null) continue;

                // Midpoint of the two adjacent sockets
                const midX = c1.x + dir.dx / 2;
                const midY = c1.y + dir.dy / 2;
                const d = Math.hypot(midX - boardX, midY - boardY);

                if (d < minDist) {
                    minDist = d;
                    bestPair = [
                        { cell: c1, val: this.currentPiece.val1 },
                        { cell: c2, val: this.currentPiece.val2 }
                    ];
                }
            }
            return bestPair;
        }
    }

    findCellNear(x, y) {
        for (const c of this.cells) {
            if (Math.hypot(c.x - x, c.y - y) < HEX_R * 0.5) {
                return c;
            }
        }
        return null;
    }

    tryPlacePieceAt(primaryCell) {
        if (!this.currentPiece) return;

        if (this.currentPiece.type === 'single') {
            if (primaryCell.value !== null) {
                window.sounds.playTap();
                return;
            }

            this.saveHistory();
            window.sounds.playPlace();
            primaryCell.value = this.currentPiece.val1;
            primaryCell.scale = 0.5;
            this.recentPlacedCells = [primaryCell];

            this.rollNewPiece();
            this.renderBoard();

            setTimeout(() => {
                this.checkMerges([primaryCell]);
            }, 120);
        } else {
            const dir = HEX_DIRECTIONS[this.currentPiece.rotationIndex];
            const secondaryCell = this.findCellNear(primaryCell.x + dir.dx, primaryCell.y + dir.dy);

            if (!secondaryCell || primaryCell.value !== null || secondaryCell.value !== null) {
                window.sounds.playTap();
                return;
            }

            this.saveHistory();
            window.sounds.playPlace();
            primaryCell.value = this.currentPiece.val1;
            secondaryCell.value = this.currentPiece.val2;
            primaryCell.scale = 0.5;
            secondaryCell.scale = 0.5;
            this.recentPlacedCells = [primaryCell, secondaryCell];

            this.rollNewPiece();
            this.renderBoard();

            setTimeout(() => {
                this.checkMerges([primaryCell, secondaryCell]);
            }, 120);
        }
    }

    saveHistory() {
        const boardSnapshot = this.cells.map(c => ({ id: c.id, value: c.value }));
        this.historyStack.push({
            board: boardSnapshot,
            score: this.score,
            piece: JSON.parse(JSON.stringify(this.currentPiece))
        });
        if (this.historyStack.length > 6) this.historyStack.shift();
    }

    undoMove() {
        if (this.coins < 100) {
            alert('Need 100 coins for Undo!');
            return;
        }
        if (this.historyStack.length === 0) return;

        this.coins -= 100;
        this.updateHUD();
        window.sounds.playCoin();

        const prev = this.historyStack.pop();
        for (const snap of prev.board) {
            const cell = this.cells.find(c => c.id === snap.id);
            if (cell) cell.value = snap.value;
        }
        this.score = prev.score;
        this.currentPiece = prev.piece;
        this.recentPlacedCells = [];
        this.renderBoard();
        this.updateHUD();
    }

    findNextBoardMatch(preferredCells = []) {
        // 1. Check preferred cells first (e.g. targetCell that just upgraded, or primaryCell)
        for (const cell of preferredCells) {
            if (!cell || cell.value === null) continue;
            const cluster = this.getConnectedMatchingCluster(cell);
            if (cluster.length >= 3) {
                return { cell, cluster };
            }
        }

        // 2. Check recently placed cells if not already in preferredCells (e.g. secondaryCell)
        for (const cell of this.recentPlacedCells) {
            if (!cell || cell.value === null) continue;
            if (preferredCells.includes(cell)) continue;
            const cluster = this.getConnectedMatchingCluster(cell);
            if (cluster.length >= 3) {
                return { cell, cluster };
            }
        }

        // 3. Check any cell on the board to catch cascading matches
        for (const cell of this.cells) {
            if (cell.value === null) continue;
            const cluster = this.getConnectedMatchingCluster(cell);
            if (cluster.length >= 3) {
                return { cell, cluster };
            }
        }

        return null;
    }

    checkMerges(targetCells = []) {
        const match = this.findNextBoardMatch(targetCells);
        if (match) {
            this.executeMerge(match.cell, match.cluster);
        } else {
            this.recentPlacedCells = [];
            this.comboCount = 0;
            this.checkGameOver();
        }
    }

    getConnectedMatchingCluster(startCell) {
        const val = startCell.value;
        if (val === null) return [];

        const cluster = [];
        const visited = new Set();
        const queue = [startCell];
        visited.add(startCell.id);

        while (queue.length > 0) {
            const cur = queue.shift();
            cluster.push(cur);

            for (const dir of HEX_DIRECTIONS) {
                const neighbor = this.findCellNear(cur.x + dir.dx, cur.y + dir.dy);
                if (neighbor && !visited.has(neighbor.id) && neighbor.value === val) {
                    visited.add(neighbor.id);
                    queue.push(neighbor);
                }
            }
        }
        return cluster;
    }

    executeMerge(targetCell, cluster) {
        const val = targetCell.value;
        const nextVal = val + 1;
        this.comboCount++;

        // Exact video scoring: Points = Value * Count * 3 * Combo
        const points = val * cluster.length * 3 * this.comboCount;
        this.score += points;
        if (this.score > this.bestScore) {
            this.bestScore = this.score;
            localStorage.setItem('make7_best_score', this.bestScore);
        }

        const targetScreenX = targetCell.x + 110;
        const targetScreenY = targetCell.y + 400;

        // Collect other donor tiles in the cluster
        const donors = cluster.filter(c => c.id !== targetCell.id);

        if (donors.length === 0) {
            this.onMergeImpact(targetCell, val, nextVal, points, targetScreenX, targetScreenY);
            return;
        }

        // Target cell anticipation: scales up slightly as it exerts suction pull
        targetCell.scale = 1.15;

        // Remove donor tiles from static grid
        donors.forEach(c => c.value = null);
        this.renderBoard();

        // Spawn flying merge tiles that accelerate towards targetCell
        let completed = 0;
        const totalDonors = donors.length;
        const duration = 0.28; // 280ms physics rush

        donors.forEach(c => {
            const startX = c.x + 110;
            const startY = c.y + 400;

            this.flyingMergeTiles.push({
                val: val,
                startX: startX,
                startY: startY,
                targetX: targetScreenX,
                targetY: targetScreenY,
                x: startX,
                y: startY,
                elapsed: 0,
                duration: duration,
                scale: 1.0,
                onComplete: () => {
                    completed++;
                    if (completed === totalDonors) {
                        this.onMergeImpact(targetCell, val, nextVal, points, targetScreenX, targetScreenY);
                    }
                }
            });
        });
    }

    onMergeImpact(targetCell, prevVal, nextVal, points, screenX, screenY) {
        // Sound: bubble pop chime!
        window.sounds.playMerge(this.comboCount);

        // Target Cell elastic impact bounce
        targetCell.scale = 1.45;

        // Floating score popup (+18, +27)
        this.addFloatingScore(`+${points}`, screenX, screenY - 45, '#f2c026');

        if (this.comboCount >= 2) {
            this.showComboBanner(`${this.comboCount} COMBO!`);
        }

        // Impact shockwave & splash particles
        this.shockwaves.push({
            x: screenX,
            y: screenY,
            radius: 12,
            maxRadius: 160,
            alpha: 0.95
        });
        this.spawnParticles(screenX, screenY, 30, this.getTileColor(nextVal));

        if (nextVal <= 6) {
            targetCell.value = nextVal;
            this.updateHUD();
            this.renderBoard();

            // Check cascade & remaining placed cells after merge animation settles
            setTimeout(() => {
                const nextPreferred = [targetCell, ...this.recentPlacedCells.filter(c => c.id !== targetCell.id && c.value !== null)];
                this.checkMerges(nextPreferred);
            }, 180);
        } else if (nextVal === 7) {
            // Reached Rainbow 7!
            targetCell.value = 7;
            window.sounds.playMake7();
            this.spawnParticles(screenX, screenY, 40, '#f2c026');
            this.spawnParticles(screenX, screenY, 30, '#1cbfa6');
            this.addFloatingScore('MAKE 7!', screenX, screenY - 70, '#1cbfa6', 48);

            this.updateHUD();
            this.renderBoard();

            // Check if 3 sevens match to explode
            setTimeout(() => {
                const sevenCluster = this.getConnectedMatchingCluster(targetCell);
                if (sevenCluster.length >= 3) {
                    this.executeRainbow7Explosion(targetCell, sevenCluster);
                } else {
                    const nextPreferred = [targetCell, ...this.recentPlacedCells.filter(c => c.id !== targetCell.id && c.value !== null)];
                    this.checkMerges(nextPreferred);
                }
            }, 280);
        }
    }

    executeRainbow7Explosion(targetCell, sevenCluster) {
        window.sounds.playExplosion();
        const screenX = targetCell.x + 110;
        const screenY = targetCell.y + 400;

        // Big shockwave
        this.shockwaves.push({
            x: screenX,
            y: screenY,
            radius: 20,
            maxRadius: 550,
            alpha: 1
        });

        // Clear 7 cluster
        sevenCluster.forEach(c => c.value = null);

        // Clear surrounding neighbors
        for (const dir of HEX_DIRECTIONS) {
            const adj = this.findCellNear(targetCell.x + dir.dx, targetCell.y + dir.dy);
            if (adj && adj.value !== null) {
                adj.value = null;
                this.spawnParticles(adj.x + 110, adj.y + 400, 16, '#ffaa33');
            }
        }

        this.score += 66;
        this.addFloatingScore('+66 BLAST!', screenX, screenY - 50, '#ff3366', 46);
        this.updateHUD();
        this.renderBoard();

        // Continue checking merges for any remaining matches
        setTimeout(() => {
            this.checkMerges();
        }, 260);
    }

    checkGameOver() {
        if (!this.currentPiece) return;

        let hasValidSpot = false;
        if (this.currentPiece.type === 'single') {
            hasValidSpot = this.cells.some(c => c.value === null);
        } else {
            for (let rot = 0; rot < 6; rot++) {
                const dir = HEX_DIRECTIONS[rot];
                for (const c of this.cells) {
                    if (c.value === null) {
                        const sec = this.findCellNear(c.x + dir.dx, c.y + dir.dy);
                        if (sec && sec.value === null) {
                            hasValidSpot = true;
                            break;
                        }
                    }
                }
                if (hasValidSpot) break;
            }
        }

        if (!hasValidSpot) {
            setTimeout(() => {
                this.openGameOver();
            }, 600);
        }
    }

    getTileColor(val) {
        const colors = {
            1: '#9b3db3',
            2: '#f08225',
            3: '#ed4c6a',
            4: '#2bb3e8',
            5: '#1cbfa6',
            6: '#f2c026',
            7: '#ffffff'
        };
        return colors[val] || '#f2c026';
    }

    // Procedural Fallback + Sprite Drawing (100% Reliable!)
    drawHexTile(ctx, cx, cy, R, val, alpha = 1.0) {
        ctx.save();
        ctx.globalAlpha = alpha;

        const sprite = val === 7 ? this.sprites.tile_7 : this.sprites[`tile_${val}`];
        const size = R * 2;

        if (sprite && sprite.complete) {
            ctx.drawImage(sprite, cx - size / 2, cy - size / 2, size, size);
        } else {
            // Clean procedural vector fallback
            const col = this.getTileColor(val);
            ctx.beginPath();
            for (let i = 0; i < 6; i++) {
                const a = (60 * i + 30) * Math.PI / 180;
                const px = cx + R * 0.94 * Math.cos(a);
                const py = cy + R * 0.94 * Math.sin(a);
                if (i === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            }
            ctx.closePath();
            ctx.fillStyle = col;
            ctx.fill();
            ctx.lineWidth = 3;
            ctx.strokeStyle = '#00000033';
            ctx.stroke();

            // Number
            ctx.font = `900 ${R * 0.9}px 'Fredoka', 'Nunito', sans-serif`;
            ctx.fillStyle = val === 7 ? '#1cbfa6' : '#121216';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(val, cx, cy);
        }

        ctx.restore();
    }

    renderBoard() {
        const ctx = this.boardCtx;
        ctx.clearRect(0, 0, 860, 780);

        const slotSprite = this.sprites.slot;
        const size = HEX_R * 2;

        // 1. Draw Recessed Dark Sockets
        for (const cell of this.cells) {
            ctx.save();
            ctx.translate(cell.x, cell.y);

            if (slotSprite && slotSprite.complete) {
                ctx.drawImage(slotSprite, -size / 2, -size / 2, size, size);
            } else {
                // Procedural dark socket fallback
                ctx.beginPath();
                for (let i = 0; i < 6; i++) {
                    const a = (60 * i + 30) * Math.PI / 180;
                    const px = HEX_R * 0.94 * Math.cos(a);
                    const py = HEX_R * 0.94 * Math.sin(a);
                    if (i === 0) ctx.moveTo(px, py);
                    else ctx.lineTo(px, py);
                }
                ctx.closePath();
                ctx.fillStyle = '#222634';
                ctx.fill();
                ctx.lineWidth = 2;
                ctx.strokeStyle = '#181b25';
                ctx.stroke();
            }

            ctx.restore();
        }

        // 2. Draw Hover Preview Ghost
        for (const h of this.hoveredCells) {
            ctx.save();
            ctx.beginPath();
            for (let i = 0; i < 6; i++) {
                const a = (60 * i + 30) * Math.PI / 180;
                const px = h.cell.x + (HEX_R * 0.95) * Math.cos(a);
                const py = h.cell.y + (HEX_R * 0.95) * Math.sin(a);
                if (i === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            }
            ctx.closePath();
            ctx.strokeStyle = '#1cbfa6';
            ctx.lineWidth = 4;
            ctx.stroke();
            ctx.restore();

            this.drawHexTile(ctx, h.cell.x, h.cell.y, HEX_R, h.val, 0.6);
        }

        // 3. Draw Placed Occupied Tiles
        for (const cell of this.cells) {
            if (cell.value !== null) {
                ctx.save();
                ctx.translate(cell.x, cell.y);
                ctx.scale(cell.scale, cell.scale);
                this.drawHexTile(ctx, 0, 0, HEX_R, cell.value, 1.0);
                ctx.restore();
            }
        }
    }

    renderSpawner() {
        const ctx = this.spawnerCtx;
        ctx.clearRect(0, 0, 440, 340);

        if (!this.currentPiece) return;

        const cx = 220;
        const cy = 170;

        ctx.save();
        if (this.isDragging) {
            // Subtle translucent placeholder in dock while dragging
            ctx.globalAlpha = 0.25;
        }

        if (this.currentPiece.type === 'single') {
            this.drawHexTile(ctx, cx, cy, HEX_R, this.currentPiece.val1, 1.0);
        } else {
            // Smoothly interpolate angle towards target angle
            const angleDiff = this.targetAngle - this.currentAngle;
            this.currentAngle += angleDiff * 0.35;

            const rad = this.currentAngle * Math.PI / 180;
            const offsetDist = HEX_DX / 2;

            const x1 = cx - Math.cos(rad) * offsetDist;
            const y1 = cy - Math.sin(rad) * offsetDist;
            const x2 = cx + Math.cos(rad) * offsetDist;
            const y2 = cy + Math.sin(rad) * offsetDist;

            this.drawHexTile(ctx, x1, y1, HEX_R, this.currentPiece.val1, 1.0);
            this.drawHexTile(ctx, x2, y2, HEX_R, this.currentPiece.val2, 1.0);
        }
        ctx.restore();
    }

    renderFX() {
        const ctx = this.fxCtx;
        ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

        // 1. Draw Dragged Piece under finger
        if (this.isDragging && this.currentPiece) {
            ctx.save();
            const currentLiftY = this.targetTouchOffsetY * this.dragLiftProgress;
            const px = this.dragVisualPos.x;
            const py = this.dragVisualPos.y + currentLiftY;
            const scale = this.dragScale;

            ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
            ctx.shadowBlur = 24 * this.dragLiftProgress;
            ctx.shadowOffsetY = 16 * this.dragLiftProgress;

            if (this.currentPiece.type === 'single') {
                ctx.save();
                ctx.translate(px, py);
                ctx.scale(scale, scale);
                this.drawHexTile(ctx, 0, 0, HEX_R, this.currentPiece.val1, 1.0);
                ctx.restore();
            } else {
                const dir = HEX_DIRECTIONS[this.currentPiece.rotationIndex];
                const x1 = px - (dir.dx / 2) * scale;
                const y1 = py - (dir.dy / 2) * scale;
                const x2 = px + (dir.dx / 2) * scale;
                const y2 = py + (dir.dy / 2) * scale;

                ctx.save();
                this.drawHexTile(ctx, x1, y1, HEX_R * scale, this.currentPiece.val1, 1.0);
                this.drawHexTile(ctx, x2, y2, HEX_R * scale, this.currentPiece.val2, 1.0);
                ctx.restore();
            }
            ctx.restore();
        }

        // 2. Flying Merge Tiles (Physics rush animation)
        for (const fmt of this.flyingMergeTiles) {
            ctx.save();
            ctx.translate(fmt.x, fmt.y);
            ctx.scale(fmt.scale, fmt.scale);
            ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
            ctx.shadowBlur = 20;
            ctx.shadowOffsetY = 12;
            this.drawHexTile(ctx, 0, 0, HEX_R, fmt.val, 1.0);
            ctx.restore();
        }

        // 3. Shockwaves
        for (const sw of this.shockwaves) {
            ctx.save();
            ctx.beginPath();
            ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(28, 191, 166, ${sw.alpha * 0.9})`;
            ctx.lineWidth = 16 * sw.alpha;
            ctx.stroke();
            ctx.restore();
        }

        // 3. Particles
        for (const p of this.particles) {
            ctx.save();
            ctx.globalAlpha = p.life;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        // 4. Floating Text
        for (const ft of this.floatingScores) {
            ctx.save();
            ctx.globalAlpha = ft.alpha;
            ctx.font = `900 ${ft.size}px 'Fredoka', 'Nunito', sans-serif`;
            ctx.fillStyle = ft.color;
            ctx.strokeStyle = '#0e111a';
            ctx.lineWidth = 6;
            ctx.textAlign = 'center';
            ctx.strokeText(ft.text, ft.x, ft.y);
            ctx.fillText(ft.text, ft.x, ft.y);
            ctx.restore();
        }
    }

    spawnParticles(x, y, count, color) {
        for (let i = 0; i < count; i++) {
            const a = Math.random() * Math.PI * 2;
            const speed = 2 + Math.random() * 9;
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(a) * speed,
                vy: Math.sin(a) * speed - 2,
                color: color,
                size: 5 + Math.random() * 8,
                life: 1.0,
                decay: 0.018 + Math.random() * 0.02
            });
        }
    }

    addFloatingScore(text, x, y, color = '#f2c026', size = 42) {
        this.floatingScores.push({
            text: text,
            x: x,
            y: y,
            vy: -2.2,
            color: color,
            size: size,
            alpha: 1.0
        });
    }

    showComboBanner(text) {
        const banner = document.getElementById('combo-banner');
        banner.textContent = text;
        banner.classList.add('show');
        setTimeout(() => {
            banner.classList.remove('show');
        }, 900);
    }

    updateHUD() {
        document.getElementById('score-val').textContent = this.score;
        document.getElementById('best-val').textContent = this.bestScore;
        document.getElementById('coin-val').textContent = this.coins;
        localStorage.setItem('make7_coins', this.coins);
    }

    initUI() {
        // Pause Button
        document.getElementById('btn-pause').addEventListener('click', () => {
            window.sounds.playTap();
            document.getElementById('modal-pause').style.display = 'flex';
        });


        // Boosters
        // 1. Trash (Cost 100)
        document.getElementById('btn-booster-trash').addEventListener('click', () => {
            if (this.coins < 100) {
                alert('Not enough coins!');
                return;
            }
            this.coins -= 100;
            this.updateHUD();
            window.sounds.playCoin();
            this.rollNewPiece();
            this.addFloatingScore('REROLLED!', 200, 1600, '#1cbfa6');
        });

        // 2. Hammer (Cost 100)
        document.getElementById('btn-booster-hammer').addEventListener('click', () => {
            if (this.coins < 100) {
                alert('Not enough coins!');
                return;
            }
            this.coins -= 100;
            this.updateHUD();
            window.sounds.playCoin();
            this.isHammerActive = true;
            document.getElementById('btn-booster-hammer').style.filter = 'drop-shadow(0 0 16px #ff4444)';
            this.addFloatingScore('HAMMER READY! Tap tile to smash', 540, 1600, '#ff6666', 30);
        });

        // 3. Undo (Cost 100)
        document.getElementById('btn-booster-undo').addEventListener('click', () => {
            this.undoMove();
        });

        // Dedicated Side Rotate Button
        const btnSideRotate = document.getElementById('btn-side-rotate');
        if (btnSideRotate) {
            btnSideRotate.addEventListener('click', (e) => {
                e.stopPropagation();
                this.rotatePiece();
            });
            btnSideRotate.addEventListener('pointerdown', (e) => {
                e.stopPropagation();
            });
        }

        // Settings Button
        const btnSettings = document.getElementById('btn-settings');
        if (btnSettings) {
            btnSettings.addEventListener('click', () => {
                window.sounds.playTap();
                this.updateSettingsUI();
                document.getElementById('modal-settings').style.display = 'flex';
            });
        }

        // Settings Close Button
        const btnSettingsClose = document.getElementById('btn-settings-close');
        if (btnSettingsClose) {
            btnSettingsClose.addEventListener('click', () => {
                window.sounds.playTap();
                document.getElementById('modal-settings').style.display = 'none';
            });
        }

        // Toggle Music Button
        const toggleMusic = document.getElementById('toggle-music');
        if (toggleMusic) {
            toggleMusic.addEventListener('click', () => {
                window.sounds.toggleMusic();
                this.updateSettingsUI();
            });
        }

        // Toggle Sound FX Button
        const toggleSound = document.getElementById('toggle-sound');
        if (toggleSound) {
            toggleSound.addEventListener('click', () => {
                window.sounds.toggleSound();
                this.updateSettingsUI();
            });
        }

        // Pause Modal Buttons
        document.getElementById('btn-pause-resume').addEventListener('click', () => {
            window.sounds.playTap();
            document.getElementById('modal-pause').style.display = 'none';
        });
        document.getElementById('btn-pause-restart').addEventListener('click', () => {
            window.sounds.playTap();
            this.resetGame();
            document.getElementById('modal-pause').style.display = 'none';
        });

        // Game Over Retry
        document.getElementById('btn-gameover-retry').addEventListener('click', () => {
            window.sounds.playTap();
            this.resetGame();
            document.getElementById('modal-gameover').style.display = 'none';
        });
    }

    updateSettingsUI() {
        const toggleMusic = document.getElementById('toggle-music');
        if (toggleMusic) {
            const isMusic = window.sounds.musicEnabled;
            toggleMusic.classList.toggle('active', isMusic);
            toggleMusic.querySelector('.toggle-label-text').textContent = isMusic ? 'ON' : 'OFF';
        }

        const toggleSound = document.getElementById('toggle-sound');
        if (toggleSound) {
            const isSound = window.sounds.soundEnabled;
            toggleSound.classList.toggle('active', isSound);
            toggleSound.querySelector('.toggle-label-text').textContent = isSound ? 'ON' : 'OFF';
        }
    }

    openGameOver() {
        document.getElementById('gameover-final-val').textContent = this.score;
        document.getElementById('gameover-best-val').textContent = this.bestScore;
        document.getElementById('modal-gameover').style.display = 'flex';
    }

    resetGame() {
        this.score = 0;
        this.comboCount = 0;
        this.recentPlacedCells = [];
        this.cells.forEach(c => c.value = null);
        this.flyingMergeTiles = [];
        this.rollNewPiece();
        this.renderBoard();
        this.updateHUD();
    }

    loop(now) {
        const dt = (now - this.lastTime) / 1000;
        this.lastTime = now;

        this.update(dt);
        this.renderBoard();
        this.renderSpawner();
        this.renderFX();

        requestAnimationFrame((t) => this.loop(t));
    }

    update(dt) {
        // Cell scale pop-in animation
        for (const c of this.cells) {
            if (c.scale < 1) c.scale = Math.min(1, c.scale + dt * 5);
            else if (c.scale > 1) c.scale = Math.max(1, c.scale - dt * 3);
        }

        // Flying Merge Tiles Physics Animation (converging rush into target cell)
        for (let i = this.flyingMergeTiles.length - 1; i >= 0; i--) {
            const fmt = this.flyingMergeTiles[i];
            fmt.elapsed += dt;
            const t = Math.min(1, fmt.elapsed / fmt.duration);

            // Ease-In Quad acceleration (t^2 gives physical gravity pull/rush towards target)
            const ease = t * t;
            fmt.x = fmt.startX + (fmt.targetX - fmt.startX) * ease;
            fmt.y = fmt.startY + (fmt.targetY - fmt.startY) * ease;

            // Shrink from 1.0 to 0.7 as absorbed
            fmt.scale = 1.0 - 0.3 * ease;

            // Emit subtle trailing sparkles along the flight path
            if (Math.random() < 0.5) {
                this.particles.push({
                    x: fmt.x + (Math.random() - 0.5) * 16,
                    y: fmt.y + (Math.random() - 0.5) * 16,
                    vx: (Math.random() - 0.5) * 2,
                    vy: (Math.random() - 0.5) * 2,
                    size: 6 + Math.random() * 6,
                    color: this.getTileColor(fmt.val),
                    life: 0.65,
                    decay: 0.05
                });
            }

            if (t >= 1) {
                this.flyingMergeTiles.splice(i, 1);
                if (fmt.onComplete) {
                    fmt.onComplete();
                }
            }
        }

        // Smooth Drag Follow & Snapping Update
        if (this.isDragging) {
            const lerpFactor = 0.55;
            this.dragVisualPos.x += (this.dragCurrentPos.x - this.dragVisualPos.x) * lerpFactor;
            this.dragVisualPos.y += (this.dragCurrentPos.y - this.dragVisualPos.y) * lerpFactor;
            this.dragLiftProgress = Math.min(1, this.dragLiftProgress + dt * 10);
            this.dragScale = 1.0 + 0.08 * this.dragLiftProgress;

            const currentLiftY = this.targetTouchOffsetY * this.dragLiftProgress;
            const pieceVisualY = this.dragVisualPos.y + currentLiftY;
            const boardX = this.dragVisualPos.x - 110;
            const boardY = pieceVisualY - 400;

            const best = this.findBestPlacementAt(boardX, boardY);
            this.hoveredCells = best || [];
        } else {
            this.dragLiftProgress = 0;
            this.dragScale = 1.0;
        }

        // Particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.22;
            p.life -= p.decay;
            if (p.life <= 0) this.particles.splice(i, 1);
        }

        // Floating Scores
        for (let i = this.floatingScores.length - 1; i >= 0; i--) {
            const ft = this.floatingScores[i];
            ft.y += ft.vy;
            ft.alpha -= 0.02;
            if (ft.alpha <= 0) this.floatingScores.splice(i, 1);
        }

        // Shockwaves
        for (let i = this.shockwaves.length - 1; i >= 0; i--) {
            const sw = this.shockwaves[i];
            sw.radius += 16;
            sw.alpha = Math.max(0, 1 - (sw.radius / sw.maxRadius));
            if (sw.radius >= sw.maxRadius) this.shockwaves.splice(i, 1);
        }
    }
}

// Fit 1080x1920 strictly to viewport
function resizePortraitViewport() {
    const container = document.getElementById('canvas-container');
    if (!container) return;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const scaleX = vw / CANVAS_W;
    const scaleY = vh / CANVAS_H;
    const scale = Math.min(scaleX, scaleY);

    container.style.transform = `scale(${scale})`;
}

window.addEventListener('resize', resizePortraitViewport);
window.addEventListener('orientationchange', () => {
    setTimeout(resizePortraitViewport, 150);
});

window.addEventListener('load', () => {
    resizePortraitViewport();
    window.game = new Make7GamePortrait();
});
