// Fun Golf - Level Data Specifications
// Layout: 1080 x 1920

const LEVELS_DATA = [
    // LEVEL 1: Gentle Introduction
    {
        levelNumber: 1,
        name: "Training Ground",
        par: 4,
        floors: [
            {
                index: 1,
                y: 450,
                holeX: 870,
                holeSide: 'right',
                ballStartX: 240,
                obstacle: null,
                idealAngleDeg: 15,
                grassTufts: [150, 420, 680]
            },
            {
                index: 2,
                y: 850,
                holeX: 310,
                holeSide: 'left',
                ballStartX: 870,
                obstacle: { x: 540, width: 70, height: 60 },
                idealAngleDeg: 42,
                grassTufts: [220, 470, 720, 930]
            },
            {
                index: 3,
                y: 1250,
                holeX: 870,
                holeSide: 'right',
                ballStartX: 310,
                obstacle: { x: 540, width: 70, height: 60 },
                idealAngleDeg: 42,
                grassTufts: [180, 450, 700]
            },
            {
                index: 4,
                y: 1685,
                holeX: 540,
                holeSide: 'center',
                ballStartX: 870,
                obstacle: null,
                idealAngleDeg: 25,
                grassTufts: [200, 350, 750, 920]
            }
        ]
    },

    // LEVEL 2: Exact replica of demo.mp4!
    {
        levelNumber: 2,
        name: "Cascading Heights",
        par: 5,
        floors: [
            {
                index: 1,
                y: 405,
                holeX: 870,
                holeSide: 'right',
                ballStartX: 240,
                obstacle: null,
                idealAngleDeg: 15,
                grassTufts: [160, 380, 640]
            },
            {
                index: 2,
                y: 675,
                holeX: 310,
                holeSide: 'left',
                ballStartX: 870,
                obstacle: { x: 540, width: 84, height: 82 },
                idealAngleDeg: 50,
                grassTufts: [180, 430, 700, 920]
            },
            {
                index: 3,
                y: 1012,
                holeX: 870,
                holeSide: 'right',
                ballStartX: 310,
                obstacle: { x: 540, width: 84, height: 82 },
                idealAngleDeg: 50,
                grassTufts: [140, 450, 730, 940]
            },
            {
                index: 4,
                y: 1350,
                holeX: 310,
                holeSide: 'left',
                ballStartX: 870,
                obstacle: { x: 540, width: 84, height: 82 },
                idealAngleDeg: 50,
                grassTufts: [200, 420, 690, 890]
            },
            {
                index: 5,
                y: 1685,
                holeX: 870,
                holeSide: 'right',
                ballStartX: 310,
                obstacle: { x: 540, width: 84, height: 82 },
                idealAngleDeg: 50,
                grassTufts: [160, 450, 710, 930]
            }
        ]
    },

    // LEVEL 3: Dual Obstacle Gauntlet
    {
        levelNumber: 3,
        name: "Double Hazard",
        par: 6,
        floors: [
            {
                index: 1,
                y: 405,
                holeX: 870,
                holeSide: 'right',
                ballStartX: 240,
                obstacle: { x: 540, width: 75, height: 65 },
                idealAngleDeg: 46,
                grassTufts: [160, 390, 680]
            },
            {
                index: 2,
                y: 675,
                holeX: 310,
                holeSide: 'left',
                ballStartX: 870,
                obstacle: { x: 580, width: 90, height: 95 },
                idealAngleDeg: 54,
                grassTufts: [180, 430, 720]
            },
            {
                index: 3,
                y: 1012,
                holeX: 870,
                holeSide: 'right',
                ballStartX: 310,
                obstacle: { x: 500, width: 90, height: 95 },
                idealAngleDeg: 54,
                grassTufts: [220, 460, 740]
            },
            {
                index: 4,
                y: 1350,
                holeX: 310,
                holeSide: 'left',
                ballStartX: 870,
                obstacle: { x: 540, width: 100, height: 90 },
                idealAngleDeg: 55,
                grassTufts: [150, 420, 710]
            },
            {
                index: 5,
                y: 1685,
                holeX: 870,
                holeSide: 'right',
                ballStartX: 310,
                obstacle: { x: 540, width: 110, height: 100 },
                idealAngleDeg: 58,
                grassTufts: [170, 440, 750]
            }
        ]
    }
];

window.LEVELS_DATA = LEVELS_DATA;
