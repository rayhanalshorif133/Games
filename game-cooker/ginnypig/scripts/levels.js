/**
 * levels.js - 10-Level Progressive Difficulty with Dynamic Ricochet Obstacles
 * From Level 1 (wide open sky) to Level 7 (full demo.mp4 maze) to Level 10 (kinetic pinball finale).
 */

const RICOCHET_LEVELS = [
    // Level 1: Sunny Meadow - Zero obstacles, gentle start!
    {
        levelNumber: 1,
        name: "Sunny Meadow",
        targetCoins: 15,
        baseSpeed: 380,
        spawnInterval: 1.15,
        bombChance: 0.0,
        starChance: 0.12,
        magnetChance: 0.0,
        multiplierChance: 0.0,
        hasWind: false,
        bumpers: [],
        rotators: [],
        ringBumpers: [],
        pegs: []
    },

    // Level 2: First Bounce - 1 Center Slider
    {
        levelNumber: 2,
        name: "First Bounce",
        targetCoins: 20,
        baseSpeed: 420,
        spawnInterval: 1.0,
        bombChance: 0.0,
        starChance: 0.16,
        magnetChance: 0.05,
        multiplierChance: 0.0,
        hasWind: false,
        bumpers: [
            { x: 540, y: 920, width: 220, height: 48 }
        ],
        rotators: [],
        ringBumpers: [],
        pegs: []
    },

    // Level 3: Twin Sliders - Zig-zag deflections
    {
        levelNumber: 3,
        name: "Twin Sliders",
        targetCoins: 25,
        baseSpeed: 480,
        spawnInterval: 0.88,
        bombChance: 0.06,
        starChance: 0.18,
        magnetChance: 0.08,
        multiplierChance: 0.05,
        hasWind: false,
        bumpers: [
            { x: 380, y: 780, width: 190, height: 48 },
            { x: 700, y: 1050, width: 190, height: 48 }
        ],
        rotators: [],
        ringBumpers: [],
        pegs: []
    },

    // Level 4: Silver Ring - High-velocity radial rebounds
    {
        levelNumber: 4,
        name: "Silver Ring",
        targetCoins: 30,
        baseSpeed: 540,
        spawnInterval: 0.80,
        bombChance: 0.11,
        starChance: 0.18,
        magnetChance: 0.08,
        multiplierChance: 0.06,
        hasWind: false,
        bumpers: [
            { x: 720, y: 980, width: 200, height: 48 }
        ],
        rotators: [],
        ringBumpers: [
            { x: 260, y: 880, radius: 72 }
        ],
        pegs: []
    },

    // Level 5: The Angle Paddle - Rotator deflection
    {
        levelNumber: 5,
        name: "The Angle Paddle",
        targetCoins: 35,
        baseSpeed: 600,
        spawnInterval: 0.74,
        bombChance: 0.15,
        starChance: 0.20,
        magnetChance: 0.08,
        multiplierChance: 0.08,
        hasWind: false,
        bumpers: [
            { x: 380, y: 820, width: 190, height: 48 }
        ],
        rotators: [
            { x: 750, y: 1120, length: 190, thickness: 48, angle: Math.PI / 4, spinSpeed: 0 }
        ],
        ringBumpers: [],
        pegs: []
    },

    // Level 6: Plinko Drop - Musical pachinko cascade
    {
        levelNumber: 6,
        name: "Plinko Drop",
        targetCoins: 40,
        baseSpeed: 660,
        spawnInterval: 0.68,
        bombChance: 0.18,
        starChance: 0.20,
        magnetChance: 0.08,
        multiplierChance: 0.09,
        hasWind: true,
        bumpers: [
            { x: 540, y: 680, width: 200, height: 48 }
        ],
        rotators: [],
        ringBumpers: [],
        pegs: [
            { x: 440, y: 920, radius: 18, noteIndex: 0 },
            { x: 640, y: 920, radius: 18, noteIndex: 1 },
            { x: 360, y: 1050, radius: 18, noteIndex: 2 },
            { x: 540, y: 1050, radius: 18, noteIndex: 3 },
            { x: 720, y: 1050, radius: 18, noteIndex: 4 },
            { x: 440, y: 1180, radius: 18, noteIndex: 5 },
            { x: 640, y: 1180, radius: 18, noteIndex: 0 }
        ]
    },

    // ==========================================
    // LEVEL 7: MASTER DEFLECTOR (Exact demo.mp4 setup!)
    // ==========================================
    {
        levelNumber: 7,
        name: "Master Deflector (Demo)",
        targetCoins: 45,
        baseSpeed: 720,
        spawnInterval: 0.62,
        bombChance: 0.22,
        starChance: 0.22,
        magnetChance: 0.09,
        multiplierChance: 0.09,
        hasWind: true,
        // 3 Vertical Sliders from demo video
        bumpers: [
            { x: 310, y: 860, width: 170, height: 48 },
            { x: 525, y: 1040, width: 170, height: 48 },
            { x: 740, y: 1200, width: 170, height: 48 }
        ],
        // 1 Rotator at bottom right
        rotators: [
            { x: 865, y: 1360, length: 180, thickness: 48, angle: Math.PI / 4, spinSpeed: 0 }
        ],
        // 1 Silver Ring Bumper at left
        ringBumpers: [
            { x: 120, y: 760, radius: 70 }
        ],
        pegs: []
    },

    // Level 8: Spinning Wheels - Rotating paddles
    {
        levelNumber: 8,
        name: "Spinning Wheels",
        targetCoins: 50,
        baseSpeed: 780,
        spawnInterval: 0.56,
        bombChance: 0.25,
        starChance: 0.22,
        magnetChance: 0.09,
        multiplierChance: 0.10,
        hasWind: true,
        bumpers: [
            { x: 540, y: 780, width: 200, height: 48 }
        ],
        rotators: [
            { x: 300, y: 1080, length: 175, thickness: 48, angle: -Math.PI / 3, spinSpeed: 0.6 },
            { x: 780, y: 1080, length: 175, thickness: 48, angle: Math.PI / 3, spinSpeed: -0.6 }
        ],
        ringBumpers: [],
        pegs: []
    },

    // Level 9: Pinball Storm - Bumpers, rotators and pegs
    {
        levelNumber: 9,
        name: "Pinball Storm",
        targetCoins: 60,
        baseSpeed: 840,
        spawnInterval: 0.50,
        bombChance: 0.28,
        starChance: 0.24,
        magnetChance: 0.10,
        multiplierChance: 0.10,
        hasWind: true,
        bumpers: [
            { x: 540, y: 650, width: 190, height: 48 }
        ],
        rotators: [
            { x: 820, y: 1250, length: 180, thickness: 48, angle: Math.PI / 3, spinSpeed: 0.4 }
        ],
        ringBumpers: [
            { x: 180, y: 820, radius: 68 },
            { x: 900, y: 820, radius: 68 }
        ],
        pegs: [
            { x: 440, y: 980, radius: 18, noteIndex: 0 },
            { x: 640, y: 980, radius: 18, noteIndex: 2 },
            { x: 540, y: 1100, radius: 18, noteIndex: 4 },
            { x: 380, y: 1220, radius: 18, noteIndex: 1 },
            { x: 540, y: 1280, radius: 18, noteIndex: 3 }
        ]
    },

    // Level 10: Jackpot Ricochet Finale!
    {
        levelNumber: 10,
        name: "Jackpot Ricochet",
        targetCoins: 75,
        baseSpeed: 900,
        spawnInterval: 0.44,
        bombChance: 0.30,
        starChance: 0.25,
        magnetChance: 0.10,
        multiplierChance: 0.12,
        hasWind: true,
        bumpers: [
            { x: 300, y: 720, width: 180, height: 48 },
            { x: 780, y: 720, width: 180, height: 48 }
        ],
        rotators: [
            { x: 340, y: 1250, length: 175, thickness: 48, angle: -Math.PI / 4, spinSpeed: 0.5 },
            { x: 740, y: 1250, length: 175, thickness: 48, angle: Math.PI / 4, spinSpeed: -0.5 }
        ],
        ringBumpers: [
            { x: 540, y: 920, radius: 72 }
        ],
        pegs: [
            { x: 220, y: 1050, radius: 18, noteIndex: 0 },
            { x: 860, y: 1050, radius: 18, noteIndex: 2 },
            { x: 540, y: 1150, radius: 18, noteIndex: 4 }
        ]
    }
];

if (typeof window !== 'undefined') {
    window.LEVELS = RICOCHET_LEVELS;
}
