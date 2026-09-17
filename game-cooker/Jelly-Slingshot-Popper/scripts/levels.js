// Pattern Spawner for Continuous Descending Waves
// Creates varied, exciting block patterns for endless arcade progression

class PatternSpawner {
    static getPattern(patternIndex, startY = 180) {
        const patterns = [
            this.createRainbowRows,
            this.createVShape,
            this.createCheckerboard,
            this.createTwinPillars,
            this.createDiamondWave,
            this.createZigZag,
            this.createJellySquad
        ];

        const generator = patterns[patternIndex % patterns.length];
        return generator.call(this, startY, patternIndex);
    }

    // 1. Rainbow Rows: 2 structured rows of distinct matching colors
    static createRainbowRows(startY) {
        const jellies = [];
        const bw = 120;
        const bh = 120;
        const cols = 5;
        const startX = 140;
        const spacingX = 165;
        const colors = ['red', 'yellow', 'green', 'blue', 'yellow'];
        const colors2 = ['blue', 'green', 'red', 'yellow', 'green'];

        // Row 1
        for (let c = 0; c < cols; c++) {
            jellies.push(new window.JellyMonster(startX + c * spacingX, startY, bw, bh, colors[c], 'square'));
        }
        // Row 2
        for (let c = 0; c < cols; c++) {
            jellies.push(new window.JellyMonster(startX + c * spacingX, startY + 150, bw, bh, colors2[c], 'square'));
        }
        return jellies;
    }

    // 2. V-Shape / Chevron Wing
    static createVShape(startY) {
        const jellies = [];
        const bw = 120;
        const bh = 120;
        const bh_pill = 170;
        const cx = 540 - bw / 2;

        // Central tip
        jellies.push(new window.JellyMonster(cx, startY + 280, bw, bh, 'red', 'square'));

        // Left wing
        jellies.push(new window.JellyMonster(cx - 150, startY + 140, bw, bh, 'yellow', 'square'));
        jellies.push(new window.JellyMonster(cx - 300, startY, bw, bh_pill, 'green', 'pill'));

        // Right wing
        jellies.push(new window.JellyMonster(cx + 150, startY + 140, bw, bh, 'yellow', 'square'));
        jellies.push(new window.JellyMonster(cx + 300, startY, bw, bh_pill, 'blue', 'pill'));

        // Top guard blocks
        jellies.push(new window.JellyMonster(cx - 150, startY - 20, bw, bh, 'blue', 'square'));
        jellies.push(new window.JellyMonster(cx + 150, startY - 20, bw, bh, 'green', 'square'));

        return jellies;
    }

    // 3. Checkerboard Grid with staggered pill blocks
    static createCheckerboard(startY) {
        const jellies = [];
        const bw = 120;
        const bh_sq = 120;
        const bh_pill = 165;
        const cols = 5;
        const startX = 140;
        const spacingX = 165;
        const colorCycle = ['yellow', 'blue', 'red', 'green', 'yellow', 'green', 'red', 'blue', 'yellow', 'green'];

        let idx = 0;
        for (let r = 0; r < 2; r++) {
            for (let c = 0; c < cols; c++) {
                if ((r + c) % 2 === 0) {
                    jellies.push(new window.JellyMonster(
                        startX + c * spacingX,
                        startY + r * 160,
                        bw,
                        bh_sq,
                        colorCycle[idx % colorCycle.length],
                        'square'
                    ));
                } else {
                    jellies.push(new window.JellyMonster(
                        startX + c * spacingX,
                        startY + r * 160,
                        bw,
                        bh_pill,
                        colorCycle[idx % colorCycle.length],
                        'pill'
                    ));
                }
                idx++;
            }
        }
        return jellies;
    }

    // 4. Twin Pillars & Inner Core
    static createTwinPillars(startY) {
        const jellies = [];
        const bw = 120;
        const bh_sq = 120;
        const bh_pill = 175;

        // Left Pillar
        jellies.push(new window.JellyMonster(150, startY, bw, bh_pill, 'blue', 'pill'));
        jellies.push(new window.JellyMonster(150, startY + 195, bw, bh_pill, 'yellow', 'pill'));

        // Right Pillar
        jellies.push(new window.JellyMonster(810, startY, bw, bh_pill, 'blue', 'pill'));
        jellies.push(new window.JellyMonster(810, startY + 195, bw, bh_pill, 'yellow', 'pill'));

        // Center Core Formation
        jellies.push(new window.JellyMonster(370, startY + 70, bw, bh_sq, 'red', 'square'));
        jellies.push(new window.JellyMonster(590, startY + 70, bw, bh_sq, 'red', 'square'));
        jellies.push(new window.JellyMonster(480, startY + 220, bw, bh_sq, 'green', 'square'));

        return jellies;
    }

    // 5. Diamond Wave
    static createDiamondWave(startY) {
        const jellies = [];
        const bw = 120;
        const bh = 120;
        const cx = 540 - bw / 2;

        // Diamond Points
        jellies.push(new window.JellyMonster(cx, startY, bw, bh, 'green', 'square'));
        jellies.push(new window.JellyMonster(cx - 155, startY + 140, bw, bh, 'yellow', 'square'));
        jellies.push(new window.JellyMonster(cx + 155, startY + 140, bw, bh, 'yellow', 'square'));
        jellies.push(new window.JellyMonster(cx - 310, startY + 280, bw, bh, 'blue', 'square'));
        jellies.push(new window.JellyMonster(cx, startY + 280, bw, bh, 'red', 'square'));
        jellies.push(new window.JellyMonster(cx + 310, startY + 280, bw, bh, 'blue', 'square'));
        jellies.push(new window.JellyMonster(cx - 155, startY + 420, bw, bh, 'green', 'square'));
        jellies.push(new window.JellyMonster(cx + 155, startY + 420, bw, bh, 'green', 'square'));
        jellies.push(new window.JellyMonster(cx, startY + 560, bw, bh, 'red', 'square'));

        return jellies;
    }

    // 6. Zig-zag Snake
    static createZigZag(startY) {
        const jellies = [];
        const bw = 120;
        const bh = 120;
        const cols = [180, 360, 540, 720];
        const colors = ['red', 'green', 'yellow', 'blue', 'green', 'red'];

        for (let i = 0; i < 6; i++) {
            const colIdx = i % 2 === 0 ? (i % 4) : (3 - (i % 4));
            const x = cols[colIdx] - bw / 2;
            const y = startY + i * 110;
            jellies.push(new window.JellyMonster(x, y, bw, bh, colors[i % colors.length], 'square'));
        }

        // Flanking blockers
        jellies.push(new window.JellyMonster(140, startY + 200, bw, 160, 'yellow', 'pill'));
        jellies.push(new window.JellyMonster(820, startY + 200, bw, 160, 'blue', 'pill'));

        return jellies;
    }

    // 7. Jelly Squad
    static createJellySquad(startY, seed = 0) {
        const colors = ['red', 'yellow', 'green', 'blue'];
        const jellies = [];
        const cols = 5;
        const rows = 3;
        const bw = 120;
        const bh = 120;
        const startX = 140;
        const spacingX = 165;
        const spacingY = 150;

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if ((r + c + seed) % 2 === 0 || Math.random() < 0.6) {
                    const col = colors[(r * cols + c + seed) % colors.length];
                    const shape = (r + c) % 3 === 0 ? 'pill' : 'square';
                    const h = shape === 'pill' ? 165 : bh;
                    jellies.push(new window.JellyMonster(startX + c * spacingX, startY + r * spacingY, bw, h, col, shape));
                }
            }
        }

        return jellies;
    }
}

window.PatternSpawner = PatternSpawner;
