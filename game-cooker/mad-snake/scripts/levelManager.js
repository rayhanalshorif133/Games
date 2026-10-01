// Level Manager for Mad Snake
// Defines configurations for all levels 1-13 and Mad Mode

const LEVEL_CONFIGS = {
    1: {
        id: 1,
        name: "Green Garden",
        theme: "forest",
        gridWidth: 20,
        gridHeight: 20,
        primaryTarget: { type: "apple_red", count: 5, label: "Red Apple", icon: "images/sprites/apple_red.png" },
        secondaryTarget: { type: "apple_green", count: 1, label: "Green Apple", icon: "images/sprites/apple_green.png" },
        obstacles: [
            { x: 5, y: 5, type: "plant" },
            { x: 14, y: 14, type: "plant" }
        ],
        boardBg: { c1: "#121b14", c2: "#0f1711", line: "#1b2d1f", border: "#22c55e", node: "#4ade80" },
        snakeSpeed: 0.15,
        enemySpeed: 0.26,
        hasEnemy: false
    },
    2: {
        id: 2,
        name: "Flower Meadow",
        theme: "forest",
        gridWidth: 20,
        gridHeight: 20,
        primaryTarget: { type: "apple_red", count: 7, label: "Red Apple", icon: "images/sprites/apple_red.png" },
        secondaryTarget: { type: "apple_green", count: 1, label: "Green Apple", icon: "images/sprites/apple_green.png" },
        obstacles: [
            { x: 4, y: 6, type: "plant" },
            { x: 15, y: 7, type: "plant" },
            { x: 10, y: 14, type: "plant" }
        ],
        boardBg: { c1: "#121b14", c2: "#0f1711", line: "#1b2d1f", border: "#22c55e", node: "#4ade80" },
        snakeSpeed: 0.14,
        enemySpeed: 0.25,
        hasEnemy: true
    },
    3: {
        id: 3,
        name: "Vineyard Valley",
        theme: "forest",
        gridWidth: 20,
        gridHeight: 20,
        primaryTarget: { type: "apple_red", count: 8, label: "Red Apple", icon: "images/sprites/apple_red.png" },
        secondaryTarget: { type: "apple_green", count: 2, label: "Green Apple", icon: "images/sprites/apple_green.png" },
        obstacles: [
            { x: 6, y: 4, type: "plant" },
            { x: 13, y: 5, type: "plant" },
            { x: 5, y: 15, type: "plant" },
            { x: 14, y: 13, type: "plant" }
        ],
        boardBg: { c1: "#121b14", c2: "#0f1711", line: "#1b2d1f", border: "#22c55e", node: "#4ade80" },
        snakeSpeed: 0.14,
        enemySpeed: 0.24,
        hasEnemy: true
    },
    4: {
        id: 4,
        name: "Forest Haven",
        theme: "forest",
        gridWidth: 20,
        gridHeight: 20,
        primaryTarget: { type: "apple_red", count: 10, label: "Red Apple", icon: "images/sprites/apple_red.png" },
        secondaryTarget: { type: "apple_green", count: 2, label: "Green Apple", icon: "images/sprites/apple_green.png" },
        // Exact layout from demo video frame 0
        obstacles: [
            { x: 3, y: 5, type: "plant" },
            { x: 7, y: 6, type: "plant" },
            { x: 15, y: 5, type: "plant" },
            { x: 16, y: 7, type: "plant" },
            { x: 18, y: 8, type: "plant" },
            { x: 15, y: 11, type: "plant" }
        ],
        boardBg: { c1: "#132117", c2: "#0e1811", line: "#1e3b26", border: "#22c55e", node: "#4ade80" },
        snakeSpeed: 0.13,
        enemySpeed: 0.23,
        hasEnemy: true
    },
    5: {
        id: 5,
        name: "Final Challenge",
        theme: "forest",
        gridWidth: 20,
        gridHeight: 20,
        primaryTarget: { type: "apple_red", count: 12, label: "Red Apple", icon: "images/sprites/apple_red.png" },
        secondaryTarget: { type: "apple_green", count: 2, label: "Green Apple", icon: "images/sprites/apple_green.png" },
        obstacles: [
            { x: 4, y: 4, type: "plant" },
            { x: 15, y: 4, type: "plant" },
            { x: 4, y: 15, type: "plant" },
            { x: 15, y: 15, type: "plant" },
            { x: 9, y: 9, type: "plant" },
            { x: 10, y: 10, type: "plant" }
        ],
        boardBg: { c1: "#14251a", c2: "#101e14", line: "#1f442a", border: "#34d399", node: "#6ee7b7" },
        snakeSpeed: 0.13,
        enemySpeed: 0.22,
        hasEnemy: true
    },
    6: {
        id: 6,
        name: "Into the Woods",
        theme: "woods",
        gridWidth: 20,
        gridHeight: 20,
        primaryTarget: { type: "apple_red", count: 13, label: "Red Apple", icon: "images/sprites/apple_red.png" },
        secondaryTarget: { type: "apple_green", count: 2, label: "Green Apple", icon: "images/sprites/apple_green.png" },
        obstacles: [
            { x: 3, y: 8, type: "plant" },
            { x: 8, y: 3, type: "plant" },
            { x: 11, y: 16, type: "plant" },
            { x: 16, y: 11, type: "plant" },
            { x: 9, y: 9, type: "plant" }
        ],
        boardBg: { c1: "#182216", c2: "#121b10", line: "#243621", border: "#84cc16", node: "#a3e635" },
        snakeSpeed: 0.125,
        enemySpeed: 0.22,
        hasEnemy: true
    },
    7: {
        id: 7,
        name: "Sunny Cove",
        theme: "beach",
        gridWidth: 20,
        gridHeight: 20,
        primaryTarget: { type: "taco", count: 14, label: "Taco", icon: "images/sprites/taco.png" },
        secondaryTarget: { type: "apple_green", count: 2, label: "Green Apple", icon: "images/sprites/apple_green.png" },
        obstacles: [
            { x: 4, y: 4, type: "cactus" },
            { x: 15, y: 4, type: "cactus" },
            { x: 9, y: 10, type: "cactus" },
            { x: 5, y: 14, type: "cactus" },
            { x: 14, y: 15, type: "cactus" }
        ],
        boardBg: { c1: "#1f1d14", c2: "#17150d", line: "#38321a", border: "#eab308", node: "#fef08a" },
        snakeSpeed: 0.125,
        enemySpeed: 0.21,
        hasEnemy: true
    },
    8: {
        id: 8,
        name: "Frozen Pond",
        theme: "ice",
        gridWidth: 20,
        gridHeight: 20,
        primaryTarget: { type: "apple_red", count: 15, label: "Apple", icon: "images/sprites/apple_red.png" },
        secondaryTarget: { type: "apple_green", count: 3, label: "Green Apple", icon: "images/sprites/apple_green.png" },
        obstacles: [
            { x: 5, y: 5, type: "plant" },
            { x: 14, y: 5, type: "plant" },
            { x: 5, y: 14, type: "plant" },
            { x: 14, y: 14, type: "plant" },
            { x: 9, y: 6, type: "plant" },
            { x: 10, y: 13, type: "plant" }
        ],
        boardBg: { c1: "#0e1e28", c2: "#09151e", line: "#183648", border: "#38bdf8", node: "#bae6fd" },
        snakeSpeed: 0.12,
        enemySpeed: 0.20,
        hasEnemy: true
    },
    9: {
        id: 9,
        name: "Outback Adventure",
        theme: "outback",
        gridWidth: 20,
        gridHeight: 20,
        primaryTarget: { type: "taco", count: 15, label: "Taco", icon: "images/sprites/taco.png" },
        secondaryTarget: { type: "apple_green", count: 3, label: "Green Apple", icon: "images/sprites/apple_green.png" },
        obstacles: [
            { x: 4, y: 7, type: "cactus" },
            { x: 8, y: 4, type: "cactus" },
            { x: 13, y: 5, type: "cactus" },
            { x: 16, y: 9, type: "cactus" },
            { x: 7, y: 13, type: "cactus" },
            { x: 12, y: 15, type: "cactus" }
        ],
        boardBg: { c1: "#251510", c2: "#1d100c", line: "#432219", border: "#f97316", node: "#fdba74" },
        snakeSpeed: 0.12,
        enemySpeed: 0.20,
        hasEnemy: true
    },
    10: {
        id: 10,
        name: "Stars & Stripes",
        theme: "city",
        gridWidth: 20,
        gridHeight: 20,
        primaryTarget: { type: "taco", count: 16, label: "Taco", icon: "images/sprites/taco.png" },
        secondaryTarget: { type: "apple_green", count: 3, label: "Green Apple", icon: "images/sprites/apple_green.png" },
        obstacles: [
            { x: 5, y: 4, type: "cactus" },
            { x: 14, y: 4, type: "cactus" },
            { x: 4, y: 10, type: "cactus" },
            { x: 15, y: 10, type: "cactus" },
            { x: 6, y: 16, type: "cactus" },
            { x: 13, y: 16, type: "cactus" },
            { x: 9, y: 7, type: "cactus" },
            { x: 10, y: 13, type: "cactus" }
        ],
        boardBg: { c1: "#12192a", c2: "#0d121f", line: "#1f2d4d", border: "#60a5fa", node: "#93c5fd" },
        snakeSpeed: 0.115,
        enemySpeed: 0.19,
        hasEnemy: true
    },
    11: {
        id: 11,
        name: "Rio Carnival",
        theme: "carnival",
        gridWidth: 20,
        gridHeight: 20,
        primaryTarget: { type: "taco", count: 16, label: "Taco", icon: "images/sprites/taco.png" },
        secondaryTarget: { type: "apple_green", count: 3, label: "Green Apple", icon: "images/sprites/apple_green.png" },
        obstacles: [
            { x: 3, y: 6, type: "plant" },
            { x: 8, y: 3, type: "plant" },
            { x: 15, y: 5, type: "plant" },
            { x: 16, y: 12, type: "plant" },
            { x: 11, y: 15, type: "plant" },
            { x: 4, y: 14, type: "plant" },
            { x: 9, y: 9, type: "plant" }
        ],
        boardBg: { c1: "#0e241c", c2: "#091a14", line: "#1b4837", border: "#10b981", node: "#6ee7b7" },
        snakeSpeed: 0.115,
        enemySpeed: 0.19,
        hasEnemy: true
    },
    12: {
        id: 12,
        name: "Fiesta Grande",
        theme: "mexico",
        gridWidth: 20,
        gridHeight: 20,
        primaryTarget: { type: "taco", count: 17, label: "Taco", icon: "images/sprites/taco.png" },
        secondaryTarget: { type: "apple_green", count: 3, label: "Green Apple", icon: "images/sprites/apple_green.png" },
        // Exact layout from demo video frame 180
        obstacles: [
            { x: 4, y: 4, type: "cactus" },
            { x: 5, y: 6, type: "cactus" },
            { x: 3, y: 7, type: "cactus" },
            { x: 5, y: 9, type: "cactus" },
            { x: 4, y: 12, type: "cactus" },
            { x: 12, y: 11, type: "cactus" },
            { x: 16, y: 4, type: "cactus" },
            { x: 16, y: 7, type: "cactus" },
            { x: 17, y: 12, type: "cactus" }
        ],
        boardBg: { c1: "#231427", c2: "#190e1c", line: "#392040", border: "#22c55e", node: "#4ade80" },
        snakeSpeed: 0.11,
        enemySpeed: 0.18,
        hasEnemy: true
    },
    13: {
        id: 13,
        name: "Cherry Blossom",
        theme: "japan",
        gridWidth: 20,
        gridHeight: 20,
        primaryTarget: { type: "sushi", count: 18, label: "Sushi", icon: "images/sprites/sushi.png" },
        secondaryTarget: { type: "apple_green", count: 3, label: "Green Apple", icon: "images/sprites/apple_green.png" },
        // Exact layout from demo video frame 360
        obstacles: [
            { x: 3, y: 6, type: "sakura" },
            { x: 5, y: 5, type: "sakura" },
            { x: 12, y: 4, type: "sakura" },
            { x: 18, y: 6, type: "sakura" },
            { x: 16, y: 8, type: "sakura" },
            { x: 18, y: 9, type: "sakura" },
            { x: 14, y: 12, type: "sakura" },
            { x: 11, y: 12, type: "sakura" },
            { x: 6, y: 10, type: "sakura" },
            { x: 2, y: 10, type: "sakura" }
        ],
        boardBg: { c1: "#261323", c2: "#1c0d19", line: "#42203c", border: "#f472b6", node: "#fbcfe8", borderStyle: "sakura" },
        snakeSpeed: 0.105,
        enemySpeed: 0.17,
        hasEnemy: true
    },
    99: {
        id: 99,
        name: "MAD MODE",
        theme: "mad_mode",
        gridWidth: 20,
        gridHeight: 20,
        primaryTarget: { type: "sushi", count: 25, label: "Sushi", icon: "images/sprites/sushi.png" },
        secondaryTarget: { type: "apple_green", count: 5, label: "Green Apple", icon: "images/sprites/apple_green.png" },
        obstacles: [
            { x: 4, y: 4, type: "sakura" },
            { x: 15, y: 4, type: "cactus" },
            { x: 4, y: 15, type: "cactus" },
            { x: 15, y: 15, type: "sakura" },
            { x: 9, y: 5, type: "plant" },
            { x: 10, y: 14, type: "plant" },
            { x: 5, y: 9, type: "cactus" },
            { x: 14, y: 10, type: "cactus" }
        ],
        boardBg: { c1: "#1e0b36", c2: "#140624", line: "#43187a", border: "#a855f7", node: "#e9d5ff", borderStyle: "mad" },
        snakeSpeed: 0.09,
        enemySpeed: 0.15,
        hasEnemy: true,
        enemyCount: 2
    }
};

class LevelManager {
    constructor() {
        this.currentLevelId = 4; // Start at Level 4 like the demo video!
        this.maxUnlockedLevel = 4;
        this.loadProgress();
    }

    loadProgress() {
        try {
            const saved = localStorage.getItem('mad_snake_unlocked');
            if (saved) {
                this.maxUnlockedLevel = Math.max(4, parseInt(saved, 10));
            }
        } catch (e) {}
    }

    saveProgress(levelId) {
        if (levelId > this.maxUnlockedLevel) {
            this.maxUnlockedLevel = levelId;
            try {
                localStorage.setItem('mad_snake_unlocked', this.maxUnlockedLevel);
            } catch (e) {}
        }
    }

    getLevel(levelId) {
        return LEVEL_CONFIGS[levelId] || LEVEL_CONFIGS[4];
    }

    getNextLevelId(currentId) {
        if (currentId === 13) return 99; // Mad Mode!
        if (currentId === 99) return 99;
        return currentId + 1;
    }

    getEndlessTier(score) {
        if (score < 50) return 1;
        if (score < 130) return 2;
        if (score < 240) return 3;
        if (score < 400) return 4;
        if (score < 650) return 5;
        return 6;
    }

    getEndlessConfig(tier) {
        switch (tier) {
            case 1: // Score 0 - 50: Very relaxed, slow speed (0.22s), open board, small snake (3 len), no enemies
                return {
                    id: 'endless',
                    name: 'Warmup Garden',
                    theme: 'forest',
                    gridWidth: 20,
                    gridHeight: 20,
                    primaryTarget: { type: 'apple_red', count: 9999, label: 'Red Apple' },
                    secondaryTarget: { type: 'apple_green', count: 9999, label: 'Green Apple' },
                    obstacles: [],
                    boardBg: { c1: '#121b14', c2: '#0f1711', line: '#1b2d1f', border: '#22c55e', node: '#4ade80' },
                    snakeSpeed: 0.22,
                    enemySpeed: 0.32,
                    hasEnemy: false
                };
            case 2: // Score 50 - 130: Gentle acceleration (0.175s), 3 potted plants sprout, 1 slow enemy enters
                return {
                    id: 'endless',
                    name: 'Sprouting Grove',
                    theme: 'forest',
                    gridWidth: 20,
                    gridHeight: 20,
                    primaryTarget: { type: 'apple_red', count: 9999, label: 'Red Apple' },
                    secondaryTarget: { type: 'apple_green', count: 9999, label: 'Green Apple' },
                    obstacles: [
                        { x: 5, y: 5, type: 'plant' },
                        { x: 14, y: 6, type: 'plant' },
                        { x: 9, y: 14, type: 'plant' }
                    ],
                    boardBg: { c1: '#132117', c2: '#0e1811', line: '#1e3b26', border: '#22c55e', node: '#4ade80' },
                    snakeSpeed: 0.175,
                    enemySpeed: 0.28,
                    hasEnemy: true
                };
            case 3: // Score 130 - 240: Moderate speed (0.14s), 5 Cacti, faster enemy, tacos appear!
                return {
                    id: 'endless',
                    name: 'Cactus Canyon',
                    theme: 'outback',
                    gridWidth: 20,
                    gridHeight: 20,
                    primaryTarget: { type: 'taco', count: 9999, label: 'Taco' },
                    secondaryTarget: { type: 'apple_green', count: 9999, label: 'Green Apple' },
                    obstacles: [
                        { x: 4, y: 4, type: 'cactus' },
                        { x: 15, y: 5, type: 'cactus' },
                        { x: 6, y: 13, type: 'cactus' },
                        { x: 14, y: 14, type: 'cactus' },
                        { x: 10, y: 9, type: 'cactus' }
                    ],
                    boardBg: { c1: '#251510', c2: '#1d100c', line: '#432219', border: '#f97316', node: '#fdba74' },
                    snakeSpeed: 0.14,
                    enemySpeed: 0.23,
                    hasEnemy: true
                };
            case 4: // Score 240 - 400: Brisk speed (0.115s), 7 Sakura blossoms, sushi appears!
                return {
                    id: 'endless',
                    name: 'Sakura Garden',
                    theme: 'japan',
                    gridWidth: 20,
                    gridHeight: 20,
                    primaryTarget: { type: 'sushi', count: 9999, label: 'Sushi' },
                    secondaryTarget: { type: 'apple_green', count: 9999, label: 'Green Apple' },
                    obstacles: [
                        { x: 3, y: 6, type: 'sakura' },
                        { x: 16, y: 5, type: 'sakura' },
                        { x: 5, y: 14, type: 'sakura' },
                        { x: 14, y: 12, type: 'sakura' },
                        { x: 9, y: 6, type: 'sakura' },
                        { x: 11, y: 15, type: 'sakura' },
                        { x: 6, y: 9, type: 'sakura' }
                    ],
                    boardBg: { c1: '#261323', c2: '#1c0d19', line: '#42203c', border: '#f472b6', node: '#fbcfe8', borderStyle: 'sakura' },
                    snakeSpeed: 0.115,
                    enemySpeed: 0.19,
                    hasEnemy: true
                };
            case 5: // Score 400 - 650: High speed (0.095s), 8 obstacles, aggressive enemy!
                return {
                    id: 'endless',
                    name: 'Cyber Storm',
                    theme: 'city',
                    gridWidth: 20,
                    gridHeight: 20,
                    primaryTarget: { type: 'sushi', count: 9999, label: 'Sushi' },
                    secondaryTarget: { type: 'apple_green', count: 9999, label: 'Green Apple' },
                    obstacles: [
                        { x: 4, y: 4, type: 'cactus' },
                        { x: 15, y: 4, type: 'cactus' },
                        { x: 4, y: 15, type: 'cactus' },
                        { x: 15, y: 15, type: 'cactus' },
                        { x: 9, y: 5, type: 'sakura' },
                        { x: 10, y: 14, type: 'sakura' },
                        { x: 5, y: 9, type: 'plant' },
                        { x: 14, y: 10, type: 'plant' }
                    ],
                    boardBg: { c1: '#12192a', c2: '#0d121f', line: '#1f2d4d', border: '#60a5fa', node: '#93c5fd' },
                    snakeSpeed: 0.095,
                    enemySpeed: 0.16,
                    hasEnemy: true
                };
            default: // Tier 6+ (Score 650+): MAD CHAOS! Turbo speed (0.080s)!
                return {
                    id: 'endless',
                    name: 'MAD CHAOS!',
                    theme: 'mad_mode',
                    gridWidth: 20,
                    gridHeight: 20,
                    primaryTarget: { type: 'sushi', count: 9999, label: 'Sushi' },
                    secondaryTarget: { type: 'apple_green', count: 9999, label: 'Green Apple' },
                    obstacles: [
                        { x: 4, y: 4, type: 'sakura' },
                        { x: 15, y: 4, type: 'cactus' },
                        { x: 4, y: 15, type: 'cactus' },
                        { x: 15, y: 15, type: 'sakura' },
                        { x: 9, y: 5, type: 'plant' },
                        { x: 10, y: 14, type: 'plant' },
                        { x: 5, y: 9, type: 'cactus' },
                        { x: 14, y: 10, type: 'cactus' },
                        { x: 10, y: 10, type: 'sakura' }
                    ],
                    boardBg: { c1: '#1e0b36', c2: '#140624', line: '#43187a', border: '#a855f7', node: '#e9d5ff', borderStyle: 'mad' },
                    snakeSpeed: 0.080,
                    enemySpeed: 0.14,
                    hasEnemy: true
                };
        }
    }
}

window.LevelManager = LevelManager;
window.LEVEL_CONFIGS = LEVEL_CONFIGS;
