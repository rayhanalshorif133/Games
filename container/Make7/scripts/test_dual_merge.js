/**
 * Verification test for Dual-Merge bug fix
 * Placing [1, 3] where both 1 and 3 have >=3 matches on board.
 * Both 1 and 3 MUST merge sequentially with combo increment!
 */

const HEX_R = 76;
const HEX_DX = Math.sqrt(3) * HEX_R;
const HEX_DY = 1.5 * HEX_R;

const HEX_DIRECTIONS = [
    { angle: 0,   dx: HEX_DX,       dy: 0 },
    { angle: 60,  dx: HEX_DX / 2,   dy: HEX_DY },
    { angle: 120, dx: -HEX_DX / 2,  dy: HEX_DY },
    { angle: 180, dx: -HEX_DX,      dy: 0 },
    { angle: 240, dx: -HEX_DX / 2,  dy: -HEX_DY },
    { angle: 300, dx: HEX_DX / 2,   dy: -HEX_DY }
];

const cx = 430, cy = 390;
const rowCounts = [3, 4, 5, 4, 3];
const rowYOffsets = [-2 * HEX_DY, -HEX_DY, 0, HEX_DY, 2 * HEX_DY];
const cells = [];
let id = 0;

for (let r = 0; r < rowCounts.length; r++) {
    const count = rowCounts[r];
    const y = cy + rowYOffsets[r];
    const startX = cx - ((count - 1) / 2) * HEX_DX;
    for (let c = 0; c < count; c++) {
        cells.push({ id: id++, row: r, col: c, x: startX + c * HEX_DX, y: y, value: null });
    }
}

function findCellNear(x, y) {
    for (const c of cells) {
        if (Math.hypot(c.x - x, c.y - y) < HEX_R * 0.5) return c;
    }
    return null;
}

function getConnectedMatchingCluster(startCell) {
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
            const nb = findCellNear(cur.x + dir.dx, cur.y + dir.dy);
            if (nb && !visited.has(nb.id) && nb.value === val) {
                visited.add(nb.id);
                queue.push(nb);
            }
        }
    }
    return cluster;
}

class TestEngine {
    constructor() {
        this.cells = cells;
        this.score = 0;
        this.comboCount = 0;
        this.recentPlacedCells = [];
        this.mergesExecuted = [];
    }

    findNextBoardMatch(preferredCells = []) {
        // 1. Check preferred cells first
        for (const cell of preferredCells) {
            if (!cell || cell.value === null) continue;
            const cluster = getConnectedMatchingCluster(cell);
            if (cluster.length >= 3) {
                return { cell, cluster };
            }
        }

        // 2. Check recently placed cells
        for (const cell of this.recentPlacedCells) {
            if (!cell || cell.value === null) continue;
            if (preferredCells.includes(cell)) continue;
            const cluster = getConnectedMatchingCluster(cell);
            if (cluster.length >= 3) {
                return { cell, cluster };
            }
        }

        // 3. Scan all board cells
        for (const cell of this.cells) {
            if (cell.value === null) continue;
            const cluster = getConnectedMatchingCluster(cell);
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
            console.log("All board merges finished! Total merges:", this.mergesExecuted.length);
            this.recentPlacedCells = [];
            this.comboCount = 0;
        }
    }

    executeMerge(targetCell, cluster) {
        const val = targetCell.value;
        const nextVal = val + 1;
        this.comboCount++;
        this.mergesExecuted.push({ targetId: targetCell.id, prevVal: val, nextVal, combo: this.comboCount });

        console.log(`Executing merge #${this.mergesExecuted.length}: Value ${val} -> ${nextVal} on cell ${targetCell.id} (Combo: ${this.comboCount})`);

        const donors = cluster.filter(c => c.id !== targetCell.id);
        donors.forEach(c => c.value = null);

        // Simulation of onMergeImpact
        targetCell.value = nextVal;

        const nextPreferred = [targetCell, ...this.recentPlacedCells.filter(c => c.id !== targetCell.id && c.value !== null)];
        this.checkMerges(nextPreferred);
    }
}

// SETUP TEST:
// Center row is r=2 (index 7, 8, 9, 10, 11). Let's pick cells[9] (center of board) and cells[10] (right neighbor).
const engine = new TestEngine();
const primaryCell = cells[9]; // Will be 1
const secondaryCell = findCellNear(primaryCell.x + HEX_DIRECTIONS[0].dx, primaryCell.y + HEX_DIRECTIONS[0].dy); // Will be 3

// Place two '1's touching primaryCell
const nb1A = findCellNear(primaryCell.x + HEX_DIRECTIONS[2].dx, primaryCell.y + HEX_DIRECTIONS[2].dy);
const nb1B = findCellNear(primaryCell.x + HEX_DIRECTIONS[3].dx, primaryCell.y + HEX_DIRECTIONS[3].dy);
nb1A.value = 1;
nb1B.value = 1;

// Place two '3's touching secondaryCell
const nb3A = findCellNear(secondaryCell.x + HEX_DIRECTIONS[1].dx, secondaryCell.y + HEX_DIRECTIONS[1].dy);
const nb3B = findCellNear(secondaryCell.x + HEX_DIRECTIONS[5].dx, secondaryCell.y + HEX_DIRECTIONS[5].dy);
nb3A.value = 3;
nb3B.value = 3;

// Now player places [1, 3] on primaryCell and secondaryCell
console.log("Placing double piece [1, 3] at cell", primaryCell.id, "and cell", secondaryCell.id);
primaryCell.value = 1;
secondaryCell.value = 3;
engine.recentPlacedCells = [primaryCell, secondaryCell];

// Trigger checkMerges
engine.checkMerges([primaryCell, secondaryCell]);

console.log("\nResults verification:");
console.log("- Total merges executed:", engine.mergesExecuted.length, "(expected 2)");
console.log("- Merge 1:", engine.mergesExecuted[0]);
console.log("- Merge 2:", engine.mergesExecuted[1]);
console.log("- Primary cell final value:", primaryCell.value, "(expected 2)");
console.log("- Secondary cell final value:", secondaryCell.value, "(expected 4)");

if (engine.mergesExecuted.length !== 2) {
    throw new Error(`Expected 2 merges, got ${engine.mergesExecuted.length}`);
}
if (primaryCell.value !== 2 || secondaryCell.value !== 4) {
    throw new Error("Final tile values incorrect!");
}
if (engine.mergesExecuted[1].combo !== 2) {
    throw new Error("Combo did not increment on second merge!");
}
console.log("\nSUCCESS! Dual merge works flawlessly!");

