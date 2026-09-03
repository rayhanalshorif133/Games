/**
 * Cook by Number - 100 Progressive Recipe Levels
 */
const GAME_LEVELS = [
  {
    "id": 1,
    "name": "Level 1: The First Recipe",
    "subtitle": "Warmup: 1 + 1 + 1 = 3",
    "startValue": 1,
    "targetValue": 3,
    "startBox": {
      "x": 250,
      "y": 380,
      "w": 220,
      "h": 220,
      "label": "INGREDIENT DISPENSER"
    },
    "endBox": {
      "x": 830,
      "y": 1540,
      "w": 270,
      "h": 260,
      "label": "RECIPE COMPUTER"
    },
    "boxes": [
      {
        "id": "box_1_1",
        "op": "+",
        "val": 1,
        "badge": "+1",
        "name": "Spice Pod Alpha",
        "x": 360,
        "y": 800,
        "w": 180,
        "h": 160,
        "theme": "orange"
      },
      {
        "id": "box_1_2",
        "op": "+",
        "val": 1,
        "badge": "+1",
        "name": "Spice Pod Beta",
        "x": 720,
        "y": 1100,
        "w": 180,
        "h": 160,
        "theme": "orange"
      }
    ],
    "winningFormula": "1 + 1 + 1 = 3  ✔"
  },
  {
    "id": 2,
    "name": "Level 2: The Chef's Equation",
    "subtitle": "Smart Wiring: Start (2) -> Target (6)",
    "startValue": 2,
    "targetValue": 6,
    "startBox": {
      "x": 250,
      "y": 380,
      "w": 220,
      "h": 220,
      "label": "INGREDIENT DISPENSER"
    },
    "endBox": {
      "x": 830,
      "y": 1540,
      "w": 270,
      "h": 260,
      "label": "RECIPE COMPUTER"
    },
    "boxes": [
      {
        "id": "box_2_1",
        "op": "+",
        "val": 1,
        "badge": "+1",
        "name": "Sauté Pod",
        "x": 280,
        "y": 760,
        "w": 180,
        "h": 160,
        "theme": "orange"
      },
      {
        "id": "box_2_2",
        "op": "+",
        "val": 2,
        "badge": "+2",
        "name": "Simmer Pod",
        "x": 780,
        "y": 760,
        "w": 180,
        "h": 160,
        "theme": "cyan"
      },
      {
        "id": "box_2_3",
        "op": "+",
        "val": 3,
        "badge": "+3",
        "name": "Roast Pod",
        "x": 520,
        "y": 1120,
        "w": 180,
        "h": 160,
        "theme": "purple"
      }
    ],
    "winningFormula": "2 + 1 + 3 = 6  ✔"
  },
  {
    "id": 3,
    "name": "Level 3: The Branching Decision",
    "subtitle": "Dual Output: IF > 7 Exits [YES], ELSE Exits [NO]",
    "startValue": 2,
    "targetValue": 10,
    "startBox": {
      "x": 250,
      "y": 380,
      "w": 220,
      "h": 220,
      "label": "INGREDIENT DISPENSER"
    },
    "endBox": {
      "x": 830,
      "y": 1540,
      "w": 270,
      "h": 260,
      "label": "RECIPE COMPUTER"
    },
    "boxes": [
      {
        "id": "box_3_boost",
        "op": "+",
        "val": 6,
        "badge": "+6",
        "name": "Turbo Pod",
        "x": 280,
        "y": 760,
        "w": 180,
        "h": 160,
        "theme": "orange"
      },
      {
        "id": "box_3_simmer",
        "op": "+",
        "val": 1,
        "badge": "+1",
        "name": "Simmer Pod",
        "x": 800,
        "y": 760,
        "w": 180,
        "h": 160,
        "theme": "cyan"
      },
      {
        "id": "box_3_cond",
        "type": "conditional",
        "op": "conditional",
        "condType": "gt",
        "condVal": 7,
        "badge": "IF > 7",
        "name": "⚡ Logic Gate",
        "x": 480,
        "y": 1060,
        "w": 220,
        "h": 180,
        "theme": "quantum"
      },
      {
        "id": "box_3_finish",
        "op": "+",
        "val": 2,
        "badge": "+2",
        "name": "Finish Garnish",
        "x": 800,
        "y": 1240,
        "w": 180,
        "h": 160,
        "theme": "purple"
      }
    ],
    "winningFormula": "2 + 6 = 8 [IF > 7 ➔ YES] + 2 = 10  ✔"
  },
  {
    "id": 4,
    "name": "Level 4: The Searing Ratio",
    "subtitle": "Target: 15",
    "startValue": 3,
    "targetValue": 15,
    "startBox": {
      "x": 250,
      "y": 380,
      "w": 220,
      "h": 220,
      "label": "INGREDIENT DISPENSER"
    },
    "endBox": {
      "x": 830,
      "y": 1540,
      "w": 270,
      "h": 260,
      "label": "RECIPE COMPUTER"
    },
    "boxes": [
      {
        "id": "box_4_add2",
        "op": "+",
        "val": 2,
        "badge": "+2",
        "name": "Sauté Pod",
        "x": 270,
        "y": 740,
        "w": 180,
        "h": 160,
        "theme": "orange"
      },
      {
        "id": "box_4_mul3",
        "op": "*",
        "val": 3,
        "badge": "×3",
        "name": "Flash Sear",
        "x": 540,
        "y": 1020,
        "w": 180,
        "h": 160,
        "theme": "quantum"
      },
      {
        "id": "box_4_add4",
        "op": "+",
        "val": 4,
        "badge": "+4",
        "name": "Roast Pod",
        "x": 800,
        "y": 740,
        "w": 180,
        "h": 160,
        "theme": "cyan"
      },
      {
        "id": "box_4_add6",
        "op": "+",
        "val": 6,
        "badge": "+6",
        "name": "Infuse Pod",
        "x": 320,
        "y": 1260,
        "w": 180,
        "h": 160,
        "theme": "purple"
      }
    ],
    "winningFormula": "(3 + 2) × 3 = 15  ✔"
  },
  {
    "id": 5,
    "name": "Level 5: The Grand Feast",
    "subtitle": "Target: 20",
    "startValue": 4,
    "targetValue": 20,
    "startBox": {
      "x": 250,
      "y": 380,
      "w": 220,
      "h": 220,
      "label": "INGREDIENT DISPENSER"
    },
    "endBox": {
      "x": 830,
      "y": 1540,
      "w": 270,
      "h": 260,
      "label": "RECIPE COMPUTER"
    },
    "boxes": [
      {
        "id": "box_5_boost",
        "op": "+",
        "val": 6,
        "badge": "+6",
        "name": "Turbo Blaze",
        "x": 270,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "orange"
      },
      {
        "id": "box_5_simmer",
        "op": "+",
        "val": 2,
        "badge": "+2",
        "name": "Slow Simmer",
        "x": 800,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "cyan"
      },
      {
        "id": "box_5_cond",
        "type": "conditional",
        "op": "conditional",
        "condType": "gt",
        "condVal": 8,
        "badge": "IF > 8",
        "name": "⚡ Logic Gate",
        "x": 480,
        "y": 1040,
        "w": 220,
        "h": 180,
        "theme": "quantum"
      },
      {
        "id": "box_5_mul2",
        "op": "*",
        "val": 2,
        "badge": "×2",
        "name": "Double Sizzle",
        "x": 800,
        "y": 1140,
        "w": 180,
        "h": 160,
        "theme": "gold"
      },
      {
        "id": "box_5_add3",
        "op": "+",
        "val": 3,
        "badge": "+3",
        "name": "Herb Garnish",
        "x": 300,
        "y": 1280,
        "w": 180,
        "h": 160,
        "theme": "purple"
      }
    ],
    "winningFormula": "(4 + 6 = 10) [IF > 8 ➔ YES] × 2 = 20  ✔"
  },
  {
    "id": 6,
    "name": "Level 6: Simmering Embers",
    "subtitle": "Target: 10",
    "startValue": 4,
    "targetValue": 10,
    "startBox": {
      "x": 250,
      "y": 380,
      "w": 220,
      "h": 220,
      "label": "INGREDIENT DISPENSER"
    },
    "endBox": {
      "x": 830,
      "y": 1540,
      "w": 270,
      "h": 260,
      "label": "RECIPE COMPUTER"
    },
    "boxes": [
      {
        "id": "box_6_1",
        "op": "+",
        "val": 5,
        "badge": "+5",
        "name": "Sauté Pod",
        "x": 280,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "orange"
      },
      {
        "id": "box_6_2",
        "op": "+",
        "val": 1,
        "badge": "+1",
        "name": "Infusion Pod",
        "x": 790,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "cyan"
      },
      {
        "id": "box_6_3",
        "op": "+",
        "val": 7,
        "badge": "+7",
        "name": "Decoy Spice",
        "x": 480,
        "y": 1000,
        "w": 180,
        "h": 160,
        "theme": "purple"
      }
    ],
    "winningFormula": "4 + 5 + 1 = 10  ✔"
  },
  {
    "id": 7,
    "name": "Level 7: Spiced Paprika",
    "subtitle": "Target: 11",
    "startValue": 5,
    "targetValue": 11,
    "startBox": {
      "x": 250,
      "y": 380,
      "w": 220,
      "h": 220,
      "label": "INGREDIENT DISPENSER"
    },
    "endBox": {
      "x": 830,
      "y": 1540,
      "w": 270,
      "h": 260,
      "label": "RECIPE COMPUTER"
    },
    "boxes": [
      {
        "id": "box_7_1",
        "op": "+",
        "val": 3,
        "badge": "+3",
        "name": "Sauté Pod",
        "x": 280,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "orange"
      },
      {
        "id": "box_7_2",
        "op": "+",
        "val": 3,
        "badge": "+3",
        "name": "Infusion Pod",
        "x": 790,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "cyan"
      },
      {
        "id": "box_7_3",
        "op": "+",
        "val": 5,
        "badge": "+5",
        "name": "Decoy Spice",
        "x": 480,
        "y": 1000,
        "w": 180,
        "h": 160,
        "theme": "purple"
      }
    ],
    "winningFormula": "5 + 3 + 3 = 11  ✔"
  },
  {
    "id": 8,
    "name": "Level 8: Golden Roux",
    "subtitle": "Target: 13",
    "startValue": 2,
    "targetValue": 13,
    "startBox": {
      "x": 250,
      "y": 380,
      "w": 220,
      "h": 220,
      "label": "INGREDIENT DISPENSER"
    },
    "endBox": {
      "x": 830,
      "y": 1540,
      "w": 270,
      "h": 260,
      "label": "RECIPE COMPUTER"
    },
    "boxes": [
      {
        "id": "box_8_1",
        "op": "+",
        "val": 6,
        "badge": "+6",
        "name": "Sauté Pod",
        "x": 280,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "orange"
      },
      {
        "id": "box_8_2",
        "op": "+",
        "val": 5,
        "badge": "+5",
        "name": "Infusion Pod",
        "x": 790,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "cyan"
      },
      {
        "id": "box_8_3",
        "op": "+",
        "val": 8,
        "badge": "+8",
        "name": "Decoy Spice",
        "x": 480,
        "y": 1000,
        "w": 180,
        "h": 160,
        "theme": "purple"
      }
    ],
    "winningFormula": "2 + 6 + 5 = 13  ✔"
  },
  {
    "id": 9,
    "name": "Level 9: Caramelized Glaze",
    "subtitle": "Target: 8",
    "startValue": 3,
    "targetValue": 8,
    "startBox": {
      "x": 250,
      "y": 380,
      "w": 220,
      "h": 220,
      "label": "INGREDIENT DISPENSER"
    },
    "endBox": {
      "x": 830,
      "y": 1540,
      "w": 270,
      "h": 260,
      "label": "RECIPE COMPUTER"
    },
    "boxes": [
      {
        "id": "box_9_1",
        "op": "+",
        "val": 4,
        "badge": "+4",
        "name": "Sauté Pod",
        "x": 280,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "orange"
      },
      {
        "id": "box_9_2",
        "op": "+",
        "val": 1,
        "badge": "+1",
        "name": "Infusion Pod",
        "x": 790,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "cyan"
      },
      {
        "id": "box_9_3",
        "op": "+",
        "val": 6,
        "badge": "+6",
        "name": "Decoy Spice",
        "x": 480,
        "y": 1000,
        "w": 180,
        "h": 160,
        "theme": "purple"
      }
    ],
    "winningFormula": "3 + 4 + 1 = 8  ✔"
  },
  {
    "id": 10,
    "name": "Level 10: Truffle Fusion",
    "subtitle": "Target: 9",
    "startValue": 4,
    "targetValue": 9,
    "startBox": {
      "x": 250,
      "y": 380,
      "w": 220,
      "h": 220,
      "label": "INGREDIENT DISPENSER"
    },
    "endBox": {
      "x": 830,
      "y": 1540,
      "w": 270,
      "h": 260,
      "label": "RECIPE COMPUTER"
    },
    "boxes": [
      {
        "id": "box_10_1",
        "op": "+",
        "val": 2,
        "badge": "+2",
        "name": "Sauté Pod",
        "x": 280,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "orange"
      },
      {
        "id": "box_10_2",
        "op": "+",
        "val": 3,
        "badge": "+3",
        "name": "Infusion Pod",
        "x": 790,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "cyan"
      },
      {
        "id": "box_10_3",
        "op": "+",
        "val": 4,
        "badge": "+4",
        "name": "Decoy Spice",
        "x": 480,
        "y": 1000,
        "w": 180,
        "h": 160,
        "theme": "purple"
      }
    ],
    "winningFormula": "4 + 2 + 3 = 9  ✔"
  },
  {
    "id": 11,
    "name": "Level 11: Infused Saffron",
    "subtitle": "Target: 15",
    "startValue": 5,
    "targetValue": 15,
    "startBox": {
      "x": 250,
      "y": 380,
      "w": 220,
      "h": 220,
      "label": "INGREDIENT DISPENSER"
    },
    "endBox": {
      "x": 830,
      "y": 1540,
      "w": 270,
      "h": 260,
      "label": "RECIPE COMPUTER"
    },
    "boxes": [
      {
        "id": "box_11_1",
        "op": "+",
        "val": 5,
        "badge": "+5",
        "name": "Sauté Pod",
        "x": 280,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "orange"
      },
      {
        "id": "box_11_2",
        "op": "+",
        "val": 5,
        "badge": "+5",
        "name": "Infusion Pod",
        "x": 790,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "cyan"
      },
      {
        "id": "box_11_3",
        "op": "+",
        "val": 7,
        "badge": "+7",
        "name": "Decoy Spice",
        "x": 480,
        "y": 1000,
        "w": 180,
        "h": 160,
        "theme": "purple"
      }
    ],
    "winningFormula": "5 + 5 + 5 = 15  ✔"
  },
  {
    "id": 12,
    "name": "Level 12: Braised Reduction",
    "subtitle": "Target: 6",
    "startValue": 2,
    "targetValue": 6,
    "startBox": {
      "x": 250,
      "y": 380,
      "w": 220,
      "h": 220,
      "label": "INGREDIENT DISPENSER"
    },
    "endBox": {
      "x": 830,
      "y": 1540,
      "w": 270,
      "h": 260,
      "label": "RECIPE COMPUTER"
    },
    "boxes": [
      {
        "id": "box_12_1",
        "op": "+",
        "val": 3,
        "badge": "+3",
        "name": "Sauté Pod",
        "x": 280,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "orange"
      },
      {
        "id": "box_12_2",
        "op": "+",
        "val": 1,
        "badge": "+1",
        "name": "Infusion Pod",
        "x": 790,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "cyan"
      },
      {
        "id": "box_12_3",
        "op": "+",
        "val": 5,
        "badge": "+5",
        "name": "Decoy Spice",
        "x": 480,
        "y": 1000,
        "w": 180,
        "h": 160,
        "theme": "purple"
      }
    ],
    "winningFormula": "2 + 3 + 1 = 6  ✔"
  },
  {
    "id": 13,
    "name": "Level 13: Velvet Emulsion",
    "subtitle": "Target: 12",
    "startValue": 3,
    "targetValue": 12,
    "startBox": {
      "x": 250,
      "y": 380,
      "w": 220,
      "h": 220,
      "label": "INGREDIENT DISPENSER"
    },
    "endBox": {
      "x": 830,
      "y": 1540,
      "w": 270,
      "h": 260,
      "label": "RECIPE COMPUTER"
    },
    "boxes": [
      {
        "id": "box_13_1",
        "op": "+",
        "val": 6,
        "badge": "+6",
        "name": "Sauté Pod",
        "x": 280,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "orange"
      },
      {
        "id": "box_13_2",
        "op": "+",
        "val": 3,
        "badge": "+3",
        "name": "Infusion Pod",
        "x": 790,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "cyan"
      },
      {
        "id": "box_13_3",
        "op": "+",
        "val": 8,
        "badge": "+8",
        "name": "Decoy Spice",
        "x": 480,
        "y": 1000,
        "w": 180,
        "h": 160,
        "theme": "purple"
      },
      {
        "id": "box_13_4",
        "op": "+",
        "val": 4,
        "badge": "+4",
        "name": "Garnish Pod",
        "x": 800,
        "y": 1180,
        "w": 180,
        "h": 160,
        "theme": "gold"
      }
    ],
    "winningFormula": "3 + 6 + 3 = 12  ✔"
  },
  {
    "id": 14,
    "name": "Level 14: Crisp Tempura",
    "subtitle": "Target: 13",
    "startValue": 4,
    "targetValue": 13,
    "startBox": {
      "x": 250,
      "y": 380,
      "w": 220,
      "h": 220,
      "label": "INGREDIENT DISPENSER"
    },
    "endBox": {
      "x": 830,
      "y": 1540,
      "w": 270,
      "h": 260,
      "label": "RECIPE COMPUTER"
    },
    "boxes": [
      {
        "id": "box_14_1",
        "op": "+",
        "val": 4,
        "badge": "+4",
        "name": "Sauté Pod",
        "x": 280,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "orange"
      },
      {
        "id": "box_14_2",
        "op": "+",
        "val": 5,
        "badge": "+5",
        "name": "Infusion Pod",
        "x": 790,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "cyan"
      },
      {
        "id": "box_14_3",
        "op": "+",
        "val": 6,
        "badge": "+6",
        "name": "Decoy Spice",
        "x": 480,
        "y": 1000,
        "w": 180,
        "h": 160,
        "theme": "purple"
      },
      {
        "id": "box_14_4",
        "op": "+",
        "val": 5,
        "badge": "+5",
        "name": "Garnish Pod",
        "x": 800,
        "y": 1180,
        "w": 180,
        "h": 160,
        "theme": "gold"
      }
    ],
    "winningFormula": "4 + 4 + 5 = 13  ✔"
  },
  {
    "id": 15,
    "name": "Level 15: Smoked Citrus",
    "subtitle": "Target: 8",
    "startValue": 5,
    "targetValue": 8,
    "startBox": {
      "x": 250,
      "y": 380,
      "w": 220,
      "h": 220,
      "label": "INGREDIENT DISPENSER"
    },
    "endBox": {
      "x": 830,
      "y": 1540,
      "w": 270,
      "h": 260,
      "label": "RECIPE COMPUTER"
    },
    "boxes": [
      {
        "id": "box_15_1",
        "op": "+",
        "val": 2,
        "badge": "+2",
        "name": "Sauté Pod",
        "x": 280,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "orange"
      },
      {
        "id": "box_15_2",
        "op": "+",
        "val": 1,
        "badge": "+1",
        "name": "Infusion Pod",
        "x": 790,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "cyan"
      },
      {
        "id": "box_15_3",
        "op": "+",
        "val": 4,
        "badge": "+4",
        "name": "Decoy Spice",
        "x": 480,
        "y": 1000,
        "w": 180,
        "h": 160,
        "theme": "purple"
      },
      {
        "id": "box_15_4",
        "op": "+",
        "val": 6,
        "badge": "+6",
        "name": "Garnish Pod",
        "x": 800,
        "y": 1180,
        "w": 180,
        "h": 160,
        "theme": "gold"
      }
    ],
    "winningFormula": "5 + 2 + 1 = 8  ✔"
  },
  {
    "id": 16,
    "name": "Level 16: Honey Mustard Matrix",
    "subtitle": "Target: 10",
    "startValue": 2,
    "targetValue": 10,
    "startBox": {
      "x": 250,
      "y": 380,
      "w": 220,
      "h": 220,
      "label": "INGREDIENT DISPENSER"
    },
    "endBox": {
      "x": 830,
      "y": 1540,
      "w": 270,
      "h": 260,
      "label": "RECIPE COMPUTER"
    },
    "boxes": [
      {
        "id": "box_16_1",
        "op": "+",
        "val": 5,
        "badge": "+5",
        "name": "Sauté Pod",
        "x": 280,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "orange"
      },
      {
        "id": "box_16_2",
        "op": "+",
        "val": 3,
        "badge": "+3",
        "name": "Infusion Pod",
        "x": 790,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "cyan"
      },
      {
        "id": "box_16_3",
        "op": "+",
        "val": 7,
        "badge": "+7",
        "name": "Decoy Spice",
        "x": 480,
        "y": 1000,
        "w": 180,
        "h": 160,
        "theme": "purple"
      },
      {
        "id": "box_16_4",
        "op": "+",
        "val": 3,
        "badge": "+3",
        "name": "Garnish Pod",
        "x": 800,
        "y": 1180,
        "w": 180,
        "h": 160,
        "theme": "gold"
      }
    ],
    "winningFormula": "2 + 5 + 3 = 10  ✔"
  },
  {
    "id": 17,
    "name": "Level 17: Blazing Wok",
    "subtitle": "Target: 11",
    "startValue": 3,
    "targetValue": 11,
    "startBox": {
      "x": 250,
      "y": 380,
      "w": 220,
      "h": 220,
      "label": "INGREDIENT DISPENSER"
    },
    "endBox": {
      "x": 830,
      "y": 1540,
      "w": 270,
      "h": 260,
      "label": "RECIPE COMPUTER"
    },
    "boxes": [
      {
        "id": "box_17_1",
        "op": "+",
        "val": 3,
        "badge": "+3",
        "name": "Sauté Pod",
        "x": 280,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "orange"
      },
      {
        "id": "box_17_2",
        "op": "+",
        "val": 5,
        "badge": "+5",
        "name": "Infusion Pod",
        "x": 790,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "cyan"
      },
      {
        "id": "box_17_3",
        "op": "+",
        "val": 5,
        "badge": "+5",
        "name": "Decoy Spice",
        "x": 480,
        "y": 1000,
        "w": 180,
        "h": 160,
        "theme": "purple"
      },
      {
        "id": "box_17_4",
        "op": "+",
        "val": 4,
        "badge": "+4",
        "name": "Garnish Pod",
        "x": 800,
        "y": 1180,
        "w": 180,
        "h": 160,
        "theme": "gold"
      }
    ],
    "winningFormula": "3 + 3 + 5 = 11  ✔"
  },
  {
    "id": 18,
    "name": "Level 18: Toasted Sesame",
    "subtitle": "Target: 11",
    "startValue": 4,
    "targetValue": 11,
    "startBox": {
      "x": 250,
      "y": 380,
      "w": 220,
      "h": 220,
      "label": "INGREDIENT DISPENSER"
    },
    "endBox": {
      "x": 830,
      "y": 1540,
      "w": 270,
      "h": 260,
      "label": "RECIPE COMPUTER"
    },
    "boxes": [
      {
        "id": "box_18_1",
        "op": "+",
        "val": 6,
        "badge": "+6",
        "name": "Sauté Pod",
        "x": 280,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "orange"
      },
      {
        "id": "box_18_2",
        "op": "+",
        "val": 1,
        "badge": "+1",
        "name": "Infusion Pod",
        "x": 790,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "cyan"
      },
      {
        "id": "box_18_3",
        "op": "+",
        "val": 8,
        "badge": "+8",
        "name": "Decoy Spice",
        "x": 480,
        "y": 1000,
        "w": 180,
        "h": 160,
        "theme": "purple"
      },
      {
        "id": "box_18_4",
        "op": "+",
        "val": 5,
        "badge": "+5",
        "name": "Garnish Pod",
        "x": 800,
        "y": 1180,
        "w": 180,
        "h": 160,
        "theme": "gold"
      }
    ],
    "winningFormula": "4 + 6 + 1 = 11  ✔"
  },
  {
    "id": 19,
    "name": "Level 19: Double Sear",
    "subtitle": "Target: 12",
    "startValue": 5,
    "targetValue": 12,
    "startBox": {
      "x": 250,
      "y": 380,
      "w": 220,
      "h": 220,
      "label": "INGREDIENT DISPENSER"
    },
    "endBox": {
      "x": 830,
      "y": 1540,
      "w": 270,
      "h": 260,
      "label": "RECIPE COMPUTER"
    },
    "boxes": [
      {
        "id": "box_19_1",
        "op": "+",
        "val": 4,
        "badge": "+4",
        "name": "Sauté Pod",
        "x": 280,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "orange"
      },
      {
        "id": "box_19_2",
        "op": "+",
        "val": 3,
        "badge": "+3",
        "name": "Infusion Pod",
        "x": 790,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "cyan"
      },
      {
        "id": "box_19_3",
        "op": "+",
        "val": 6,
        "badge": "+6",
        "name": "Decoy Spice",
        "x": 480,
        "y": 1000,
        "w": 180,
        "h": 160,
        "theme": "purple"
      },
      {
        "id": "box_19_4",
        "op": "+",
        "val": 6,
        "badge": "+6",
        "name": "Garnish Pod",
        "x": 800,
        "y": 1180,
        "w": 180,
        "h": 160,
        "theme": "gold"
      }
    ],
    "winningFormula": "5 + 4 + 3 = 12  ✔"
  },
  {
    "id": 20,
    "name": "Level 20: Herbaceous Bouquet",
    "subtitle": "Target: 9",
    "startValue": 2,
    "targetValue": 9,
    "startBox": {
      "x": 250,
      "y": 380,
      "w": 220,
      "h": 220,
      "label": "INGREDIENT DISPENSER"
    },
    "endBox": {
      "x": 830,
      "y": 1540,
      "w": 270,
      "h": 260,
      "label": "RECIPE COMPUTER"
    },
    "boxes": [
      {
        "id": "box_20_1",
        "op": "+",
        "val": 2,
        "badge": "+2",
        "name": "Sauté Pod",
        "x": 280,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "orange"
      },
      {
        "id": "box_20_2",
        "op": "+",
        "val": 5,
        "badge": "+5",
        "name": "Infusion Pod",
        "x": 790,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "cyan"
      },
      {
        "id": "box_20_3",
        "op": "+",
        "val": 4,
        "badge": "+4",
        "name": "Decoy Spice",
        "x": 480,
        "y": 1000,
        "w": 180,
        "h": 160,
        "theme": "purple"
      },
      {
        "id": "box_20_4",
        "op": "+",
        "val": 3,
        "badge": "+3",
        "name": "Garnish Pod",
        "x": 800,
        "y": 1180,
        "w": 180,
        "h": 160,
        "theme": "gold"
      }
    ],
    "winningFormula": "2 + 2 + 5 = 9  ✔"
  },
  {
    "id": 21,
    "name": "Level 21: Chili Combustion",
    "subtitle": "Target: 10",
    "startValue": 2,
    "targetValue": 10,
    "startBox": {
      "x": 250,
      "y": 380,
      "w": 220,
      "h": 220,
      "label": "INGREDIENT DISPENSER"
    },
    "endBox": {
      "x": 830,
      "y": 1540,
      "w": 270,
      "h": 260,
      "label": "RECIPE COMPUTER"
    },
    "boxes": [
      {
        "id": "box_21_1",
        "op": "+",
        "val": 3,
        "badge": "+3",
        "name": "Prep Pod",
        "x": 280,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "orange"
      },
      {
        "id": "box_21_mul",
        "op": "*",
        "val": 2,
        "badge": "×2",
        "name": "Multiplier Sear",
        "x": 480,
        "y": 1000,
        "w": 180,
        "h": 160,
        "theme": "gold"
      },
      {
        "id": "box_21_3",
        "op": "+",
        "val": 6,
        "badge": "+6",
        "name": "Extra Herb",
        "x": 790,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "purple"
      },
      {
        "id": "box_21_4",
        "op": "+",
        "val": 3,
        "badge": "+3",
        "name": "Seasoning",
        "x": 800,
        "y": 1180,
        "w": 180,
        "h": 160,
        "theme": "cyan"
      }
    ],
    "winningFormula": "(2 + 3) × 2 = 10  ✔"
  },
  {
    "id": 22,
    "name": "Level 22: Garlic Butter Core",
    "subtitle": "Target: 21",
    "startValue": 3,
    "targetValue": 21,
    "startBox": {
      "x": 250,
      "y": 380,
      "w": 220,
      "h": 220,
      "label": "INGREDIENT DISPENSER"
    },
    "endBox": {
      "x": 830,
      "y": 1540,
      "w": 270,
      "h": 260,
      "label": "RECIPE COMPUTER"
    },
    "boxes": [
      {
        "id": "box_22_1",
        "op": "+",
        "val": 4,
        "badge": "+4",
        "name": "Prep Pod",
        "x": 280,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "orange"
      },
      {
        "id": "box_22_mul",
        "op": "*",
        "val": 3,
        "badge": "×3",
        "name": "Multiplier Sear",
        "x": 480,
        "y": 1000,
        "w": 180,
        "h": 160,
        "theme": "gold"
      },
      {
        "id": "box_22_3",
        "op": "+",
        "val": 7,
        "badge": "+7",
        "name": "Extra Herb",
        "x": 790,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "purple"
      },
      {
        "id": "box_22_4",
        "op": "+",
        "val": 5,
        "badge": "+5",
        "name": "Seasoning",
        "x": 800,
        "y": 1180,
        "w": 180,
        "h": 160,
        "theme": "cyan"
      }
    ],
    "winningFormula": "(3 + 4) × 3 = 21  ✔"
  },
  {
    "id": 23,
    "name": "Level 23: Maple Glazed Roast",
    "subtitle": "Target: 36",
    "startValue": 4,
    "targetValue": 36,
    "startBox": {
      "x": 250,
      "y": 380,
      "w": 220,
      "h": 220,
      "label": "INGREDIENT DISPENSER"
    },
    "endBox": {
      "x": 830,
      "y": 1540,
      "w": 270,
      "h": 260,
      "label": "RECIPE COMPUTER"
    },
    "boxes": [
      {
        "id": "box_23_1",
        "op": "+",
        "val": 5,
        "badge": "+5",
        "name": "Prep Pod",
        "x": 280,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "orange"
      },
      {
        "id": "box_23_mul",
        "op": "*",
        "val": 4,
        "badge": "×4",
        "name": "Multiplier Sear",
        "x": 480,
        "y": 1000,
        "w": 180,
        "h": 160,
        "theme": "gold"
      },
      {
        "id": "box_23_3",
        "op": "+",
        "val": 8,
        "badge": "+8",
        "name": "Extra Herb",
        "x": 790,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "purple"
      },
      {
        "id": "box_23_4",
        "op": "+",
        "val": 2,
        "badge": "+2",
        "name": "Seasoning",
        "x": 800,
        "y": 1180,
        "w": 180,
        "h": 160,
        "theme": "cyan"
      }
    ],
    "winningFormula": "(4 + 5) × 4 = 36  ✔"
  },
  {
    "id": 24,
    "name": "Level 24: Cast Iron Crunch",
    "subtitle": "Target: 8",
    "startValue": 2,
    "targetValue": 8,
    "startBox": {
      "x": 250,
      "y": 380,
      "w": 220,
      "h": 220,
      "label": "INGREDIENT DISPENSER"
    },
    "endBox": {
      "x": 830,
      "y": 1540,
      "w": 270,
      "h": 260,
      "label": "RECIPE COMPUTER"
    },
    "boxes": [
      {
        "id": "box_24_1",
        "op": "+",
        "val": 2,
        "badge": "+2",
        "name": "Prep Pod",
        "x": 280,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "orange"
      },
      {
        "id": "box_24_mul",
        "op": "*",
        "val": 2,
        "badge": "×2",
        "name": "Multiplier Sear",
        "x": 480,
        "y": 1000,
        "w": 180,
        "h": 160,
        "theme": "gold"
      },
      {
        "id": "box_24_3",
        "op": "+",
        "val": 5,
        "badge": "+5",
        "name": "Extra Herb",
        "x": 790,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "purple"
      },
      {
        "id": "box_24_4",
        "op": "+",
        "val": 4,
        "badge": "+4",
        "name": "Seasoning",
        "x": 800,
        "y": 1180,
        "w": 180,
        "h": 160,
        "theme": "cyan"
      }
    ],
    "winningFormula": "(2 + 2) × 2 = 8  ✔"
  },
  {
    "id": 25,
    "name": "Level 25: Zesty Reduction",
    "subtitle": "Target: 18",
    "startValue": 3,
    "targetValue": 18,
    "startBox": {
      "x": 250,
      "y": 380,
      "w": 220,
      "h": 220,
      "label": "INGREDIENT DISPENSER"
    },
    "endBox": {
      "x": 830,
      "y": 1540,
      "w": 270,
      "h": 260,
      "label": "RECIPE COMPUTER"
    },
    "boxes": [
      {
        "id": "box_25_1",
        "op": "+",
        "val": 3,
        "badge": "+3",
        "name": "Prep Pod",
        "x": 280,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "orange"
      },
      {
        "id": "box_25_mul",
        "op": "*",
        "val": 3,
        "badge": "×3",
        "name": "Multiplier Sear",
        "x": 480,
        "y": 1000,
        "w": 180,
        "h": 160,
        "theme": "gold"
      },
      {
        "id": "box_25_3",
        "op": "+",
        "val": 6,
        "badge": "+6",
        "name": "Extra Herb",
        "x": 790,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "purple"
      },
      {
        "id": "box_25_4",
        "op": "+",
        "val": 1,
        "badge": "+1",
        "name": "Seasoning",
        "x": 800,
        "y": 1180,
        "w": 180,
        "h": 160,
        "theme": "cyan"
      }
    ],
    "winningFormula": "(3 + 3) × 3 = 18  ✔"
  },
  {
    "id": 26,
    "name": "Level 26: Fire Roasted Salsa",
    "subtitle": "Target: 32",
    "startValue": 4,
    "targetValue": 32,
    "startBox": {
      "x": 250,
      "y": 380,
      "w": 220,
      "h": 220,
      "label": "INGREDIENT DISPENSER"
    },
    "endBox": {
      "x": 830,
      "y": 1540,
      "w": 270,
      "h": 260,
      "label": "RECIPE COMPUTER"
    },
    "boxes": [
      {
        "id": "box_26_1",
        "op": "+",
        "val": 4,
        "badge": "+4",
        "name": "Prep Pod",
        "x": 280,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "orange"
      },
      {
        "id": "box_26_mul",
        "op": "*",
        "val": 4,
        "badge": "×4",
        "name": "Multiplier Sear",
        "x": 480,
        "y": 1000,
        "w": 180,
        "h": 160,
        "theme": "gold"
      },
      {
        "id": "box_26_3",
        "op": "+",
        "val": 7,
        "badge": "+7",
        "name": "Extra Herb",
        "x": 790,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "purple"
      },
      {
        "id": "box_26_4",
        "op": "+",
        "val": 3,
        "badge": "+3",
        "name": "Seasoning",
        "x": 800,
        "y": 1180,
        "w": 180,
        "h": 160,
        "theme": "cyan"
      }
    ],
    "winningFormula": "(4 + 4) × 4 = 32  ✔"
  },
  {
    "id": 27,
    "name": "Level 27: Molecular Gastronomy",
    "subtitle": "Target: 14",
    "startValue": 2,
    "targetValue": 14,
    "startBox": {
      "x": 250,
      "y": 380,
      "w": 220,
      "h": 220,
      "label": "INGREDIENT DISPENSER"
    },
    "endBox": {
      "x": 830,
      "y": 1540,
      "w": 270,
      "h": 260,
      "label": "RECIPE COMPUTER"
    },
    "boxes": [
      {
        "id": "box_27_1",
        "op": "+",
        "val": 5,
        "badge": "+5",
        "name": "Prep Pod",
        "x": 280,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "orange"
      },
      {
        "id": "box_27_mul",
        "op": "*",
        "val": 2,
        "badge": "×2",
        "name": "Multiplier Sear",
        "x": 480,
        "y": 1000,
        "w": 180,
        "h": 160,
        "theme": "gold"
      },
      {
        "id": "box_27_3",
        "op": "+",
        "val": 8,
        "badge": "+8",
        "name": "Extra Herb",
        "x": 790,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "purple"
      },
      {
        "id": "box_27_4",
        "op": "+",
        "val": 5,
        "badge": "+5",
        "name": "Seasoning",
        "x": 800,
        "y": 1180,
        "w": 180,
        "h": 160,
        "theme": "cyan"
      }
    ],
    "winningFormula": "(2 + 5) × 2 = 14  ✔"
  },
  {
    "id": 28,
    "name": "Level 28: Pecan Wood Smoke",
    "subtitle": "Target: 15",
    "startValue": 3,
    "targetValue": 15,
    "startBox": {
      "x": 250,
      "y": 380,
      "w": 220,
      "h": 220,
      "label": "INGREDIENT DISPENSER"
    },
    "endBox": {
      "x": 830,
      "y": 1540,
      "w": 270,
      "h": 260,
      "label": "RECIPE COMPUTER"
    },
    "boxes": [
      {
        "id": "box_28_1",
        "op": "+",
        "val": 2,
        "badge": "+2",
        "name": "Prep Pod",
        "x": 280,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "orange"
      },
      {
        "id": "box_28_mul",
        "op": "*",
        "val": 3,
        "badge": "×3",
        "name": "Multiplier Sear",
        "x": 480,
        "y": 1000,
        "w": 180,
        "h": 160,
        "theme": "gold"
      },
      {
        "id": "box_28_3",
        "op": "+",
        "val": 5,
        "badge": "+5",
        "name": "Extra Herb",
        "x": 790,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "purple"
      },
      {
        "id": "box_28_4",
        "op": "+",
        "val": 2,
        "badge": "+2",
        "name": "Seasoning",
        "x": 800,
        "y": 1180,
        "w": 180,
        "h": 160,
        "theme": "cyan"
      }
    ],
    "winningFormula": "(3 + 2) × 3 = 15  ✔"
  },
  {
    "id": 29,
    "name": "Level 29: Black Truffle Aioli",
    "subtitle": "Target: 28",
    "startValue": 4,
    "targetValue": 28,
    "startBox": {
      "x": 250,
      "y": 380,
      "w": 220,
      "h": 220,
      "label": "INGREDIENT DISPENSER"
    },
    "endBox": {
      "x": 830,
      "y": 1540,
      "w": 270,
      "h": 260,
      "label": "RECIPE COMPUTER"
    },
    "boxes": [
      {
        "id": "box_29_1",
        "op": "+",
        "val": 3,
        "badge": "+3",
        "name": "Prep Pod",
        "x": 280,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "orange"
      },
      {
        "id": "box_29_mul",
        "op": "*",
        "val": 4,
        "badge": "×4",
        "name": "Multiplier Sear",
        "x": 480,
        "y": 1000,
        "w": 180,
        "h": 160,
        "theme": "gold"
      },
      {
        "id": "box_29_3",
        "op": "+",
        "val": 6,
        "badge": "+6",
        "name": "Extra Herb",
        "x": 790,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "purple"
      },
      {
        "id": "box_29_4",
        "op": "+",
        "val": 4,
        "badge": "+4",
        "name": "Seasoning",
        "x": 800,
        "y": 1180,
        "w": 180,
        "h": 160,
        "theme": "cyan"
      }
    ],
    "winningFormula": "(4 + 3) × 4 = 28  ✔"
  },
  {
    "id": 30,
    "name": "Level 30: Szechuan Pepper Spark",
    "subtitle": "Target: 12",
    "startValue": 2,
    "targetValue": 12,
    "startBox": {
      "x": 250,
      "y": 380,
      "w": 220,
      "h": 220,
      "label": "INGREDIENT DISPENSER"
    },
    "endBox": {
      "x": 830,
      "y": 1540,
      "w": 270,
      "h": 260,
      "label": "RECIPE COMPUTER"
    },
    "boxes": [
      {
        "id": "box_30_1",
        "op": "+",
        "val": 4,
        "badge": "+4",
        "name": "Prep Pod",
        "x": 280,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "orange"
      },
      {
        "id": "box_30_mul",
        "op": "*",
        "val": 2,
        "badge": "×2",
        "name": "Multiplier Sear",
        "x": 480,
        "y": 1000,
        "w": 180,
        "h": 160,
        "theme": "gold"
      },
      {
        "id": "box_30_3",
        "op": "+",
        "val": 7,
        "badge": "+7",
        "name": "Extra Herb",
        "x": 790,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "purple"
      },
      {
        "id": "box_30_4",
        "op": "+",
        "val": 1,
        "badge": "+1",
        "name": "Seasoning",
        "x": 800,
        "y": 1180,
        "w": 180,
        "h": 160,
        "theme": "cyan"
      }
    ],
    "winningFormula": "(2 + 4) × 2 = 12  ✔"
  },
  {
    "id": 31,
    "name": "Level 31: Aged Balsamic Drift",
    "subtitle": "Target: 24",
    "startValue": 3,
    "targetValue": 24,
    "startBox": {
      "x": 250,
      "y": 380,
      "w": 220,
      "h": 220,
      "label": "INGREDIENT DISPENSER"
    },
    "endBox": {
      "x": 830,
      "y": 1540,
      "w": 270,
      "h": 260,
      "label": "RECIPE COMPUTER"
    },
    "boxes": [
      {
        "id": "box_31_1",
        "op": "+",
        "val": 5,
        "badge": "+5",
        "name": "Prep Pod",
        "x": 280,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "orange"
      },
      {
        "id": "box_31_mul",
        "op": "*",
        "val": 3,
        "badge": "×3",
        "name": "Multiplier Sear",
        "x": 480,
        "y": 1000,
        "w": 180,
        "h": 160,
        "theme": "gold"
      },
      {
        "id": "box_31_3",
        "op": "+",
        "val": 8,
        "badge": "+8",
        "name": "Extra Herb",
        "x": 790,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "purple"
      },
      {
        "id": "box_31_4",
        "op": "+",
        "val": 3,
        "badge": "+3",
        "name": "Seasoning",
        "x": 800,
        "y": 1180,
        "w": 180,
        "h": 160,
        "theme": "cyan"
      }
    ],
    "winningFormula": "(3 + 5) × 3 = 24  ✔"
  },
  {
    "id": 32,
    "name": "Level 32: Charcoal Grill",
    "subtitle": "Target: 24",
    "startValue": 4,
    "targetValue": 24,
    "startBox": {
      "x": 250,
      "y": 380,
      "w": 220,
      "h": 220,
      "label": "INGREDIENT DISPENSER"
    },
    "endBox": {
      "x": 830,
      "y": 1540,
      "w": 270,
      "h": 260,
      "label": "RECIPE COMPUTER"
    },
    "boxes": [
      {
        "id": "box_32_1",
        "op": "+",
        "val": 2,
        "badge": "+2",
        "name": "Prep Pod",
        "x": 280,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "orange"
      },
      {
        "id": "box_32_mul",
        "op": "*",
        "val": 4,
        "badge": "×4",
        "name": "Multiplier Sear",
        "x": 480,
        "y": 1000,
        "w": 180,
        "h": 160,
        "theme": "gold"
      },
      {
        "id": "box_32_3",
        "op": "+",
        "val": 5,
        "badge": "+5",
        "name": "Extra Herb",
        "x": 790,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "purple"
      },
      {
        "id": "box_32_4",
        "op": "+",
        "val": 5,
        "badge": "+5",
        "name": "Seasoning",
        "x": 800,
        "y": 1180,
        "w": 180,
        "h": 160,
        "theme": "cyan"
      }
    ],
    "winningFormula": "(4 + 2) × 4 = 24  ✔"
  },
  {
    "id": 33,
    "name": "Level 33: Citrus Ponzu Flow",
    "subtitle": "Target: 10",
    "startValue": 2,
    "targetValue": 10,
    "startBox": {
      "x": 250,
      "y": 380,
      "w": 220,
      "h": 220,
      "label": "INGREDIENT DISPENSER"
    },
    "endBox": {
      "x": 830,
      "y": 1540,
      "w": 270,
      "h": 260,
      "label": "RECIPE COMPUTER"
    },
    "boxes": [
      {
        "id": "box_33_1",
        "op": "+",
        "val": 3,
        "badge": "+3",
        "name": "Prep Pod",
        "x": 280,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "orange"
      },
      {
        "id": "box_33_mul",
        "op": "*",
        "val": 2,
        "badge": "×2",
        "name": "Multiplier Sear",
        "x": 480,
        "y": 1000,
        "w": 180,
        "h": 160,
        "theme": "gold"
      },
      {
        "id": "box_33_3",
        "op": "+",
        "val": 6,
        "badge": "+6",
        "name": "Extra Herb",
        "x": 790,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "purple"
      },
      {
        "id": "box_33_4",
        "op": "+",
        "val": 2,
        "badge": "+2",
        "name": "Seasoning",
        "x": 800,
        "y": 1180,
        "w": 180,
        "h": 160,
        "theme": "cyan"
      }
    ],
    "winningFormula": "(2 + 3) × 2 = 10  ✔"
  },
  {
    "id": 34,
    "name": "Level 34: Bourbon Glaze Vector",
    "subtitle": "Target: 21",
    "startValue": 3,
    "targetValue": 21,
    "startBox": {
      "x": 250,
      "y": 380,
      "w": 220,
      "h": 220,
      "label": "INGREDIENT DISPENSER"
    },
    "endBox": {
      "x": 830,
      "y": 1540,
      "w": 270,
      "h": 260,
      "label": "RECIPE COMPUTER"
    },
    "boxes": [
      {
        "id": "box_34_1",
        "op": "+",
        "val": 4,
        "badge": "+4",
        "name": "Prep Pod",
        "x": 280,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "orange"
      },
      {
        "id": "box_34_mul",
        "op": "*",
        "val": 3,
        "badge": "×3",
        "name": "Multiplier Sear",
        "x": 480,
        "y": 1000,
        "w": 180,
        "h": 160,
        "theme": "gold"
      },
      {
        "id": "box_34_3",
        "op": "+",
        "val": 7,
        "badge": "+7",
        "name": "Extra Herb",
        "x": 790,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "purple"
      },
      {
        "id": "box_34_4",
        "op": "+",
        "val": 4,
        "badge": "+4",
        "name": "Seasoning",
        "x": 800,
        "y": 1180,
        "w": 180,
        "h": 160,
        "theme": "cyan"
      }
    ],
    "winningFormula": "(3 + 4) × 3 = 21  ✔"
  },
  {
    "id": 35,
    "name": "Level 35: Rosemary Infusion",
    "subtitle": "Target: 36",
    "startValue": 4,
    "targetValue": 36,
    "startBox": {
      "x": 250,
      "y": 380,
      "w": 220,
      "h": 220,
      "label": "INGREDIENT DISPENSER"
    },
    "endBox": {
      "x": 830,
      "y": 1540,
      "w": 270,
      "h": 260,
      "label": "RECIPE COMPUTER"
    },
    "boxes": [
      {
        "id": "box_35_1",
        "op": "+",
        "val": 5,
        "badge": "+5",
        "name": "Prep Pod",
        "x": 280,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "orange"
      },
      {
        "id": "box_35_mul",
        "op": "*",
        "val": 4,
        "badge": "×4",
        "name": "Multiplier Sear",
        "x": 480,
        "y": 1000,
        "w": 180,
        "h": 160,
        "theme": "gold"
      },
      {
        "id": "box_35_3",
        "op": "+",
        "val": 8,
        "badge": "+8",
        "name": "Extra Herb",
        "x": 790,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "purple"
      },
      {
        "id": "box_35_4",
        "op": "+",
        "val": 1,
        "badge": "+1",
        "name": "Seasoning",
        "x": 800,
        "y": 1180,
        "w": 180,
        "h": 160,
        "theme": "cyan"
      }
    ],
    "winningFormula": "(4 + 5) × 4 = 36  ✔"
  },
  {
    "id": 36,
    "name": "Level 36: Cinnamon Bark Brew",
    "subtitle": "Target: 8",
    "startValue": 2,
    "targetValue": 8,
    "startBox": {
      "x": 250,
      "y": 380,
      "w": 220,
      "h": 220,
      "label": "INGREDIENT DISPENSER"
    },
    "endBox": {
      "x": 830,
      "y": 1540,
      "w": 270,
      "h": 260,
      "label": "RECIPE COMPUTER"
    },
    "boxes": [
      {
        "id": "box_36_1",
        "op": "+",
        "val": 2,
        "badge": "+2",
        "name": "Prep Pod",
        "x": 280,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "orange"
      },
      {
        "id": "box_36_mul",
        "op": "*",
        "val": 2,
        "badge": "×2",
        "name": "Multiplier Sear",
        "x": 480,
        "y": 1000,
        "w": 180,
        "h": 160,
        "theme": "gold"
      },
      {
        "id": "box_36_3",
        "op": "+",
        "val": 5,
        "badge": "+5",
        "name": "Extra Herb",
        "x": 790,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "purple"
      },
      {
        "id": "box_36_4",
        "op": "+",
        "val": 3,
        "badge": "+3",
        "name": "Seasoning",
        "x": 800,
        "y": 1180,
        "w": 180,
        "h": 160,
        "theme": "cyan"
      }
    ],
    "winningFormula": "(2 + 2) × 2 = 8  ✔"
  },
  {
    "id": 37,
    "name": "Level 37: Wasabi Pulse",
    "subtitle": "Target: 18",
    "startValue": 3,
    "targetValue": 18,
    "startBox": {
      "x": 250,
      "y": 380,
      "w": 220,
      "h": 220,
      "label": "INGREDIENT DISPENSER"
    },
    "endBox": {
      "x": 830,
      "y": 1540,
      "w": 270,
      "h": 260,
      "label": "RECIPE COMPUTER"
    },
    "boxes": [
      {
        "id": "box_37_1",
        "op": "+",
        "val": 3,
        "badge": "+3",
        "name": "Prep Pod",
        "x": 280,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "orange"
      },
      {
        "id": "box_37_mul",
        "op": "*",
        "val": 3,
        "badge": "×3",
        "name": "Multiplier Sear",
        "x": 480,
        "y": 1000,
        "w": 180,
        "h": 160,
        "theme": "gold"
      },
      {
        "id": "box_37_3",
        "op": "+",
        "val": 6,
        "badge": "+6",
        "name": "Extra Herb",
        "x": 790,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "purple"
      },
      {
        "id": "box_37_4",
        "op": "+",
        "val": 5,
        "badge": "+5",
        "name": "Seasoning",
        "x": 800,
        "y": 1180,
        "w": 180,
        "h": 160,
        "theme": "cyan"
      }
    ],
    "winningFormula": "(3 + 3) × 3 = 18  ✔"
  },
  {
    "id": 38,
    "name": "Level 38: Teriyaki Glaze Branch",
    "subtitle": "Target: 32",
    "startValue": 4,
    "targetValue": 32,
    "startBox": {
      "x": 250,
      "y": 380,
      "w": 220,
      "h": 220,
      "label": "INGREDIENT DISPENSER"
    },
    "endBox": {
      "x": 830,
      "y": 1540,
      "w": 270,
      "h": 260,
      "label": "RECIPE COMPUTER"
    },
    "boxes": [
      {
        "id": "box_38_1",
        "op": "+",
        "val": 4,
        "badge": "+4",
        "name": "Prep Pod",
        "x": 280,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "orange"
      },
      {
        "id": "box_38_mul",
        "op": "*",
        "val": 4,
        "badge": "×4",
        "name": "Multiplier Sear",
        "x": 480,
        "y": 1000,
        "w": 180,
        "h": 160,
        "theme": "gold"
      },
      {
        "id": "box_38_3",
        "op": "+",
        "val": 7,
        "badge": "+7",
        "name": "Extra Herb",
        "x": 790,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "purple"
      },
      {
        "id": "box_38_4",
        "op": "+",
        "val": 2,
        "badge": "+2",
        "name": "Seasoning",
        "x": 800,
        "y": 1180,
        "w": 180,
        "h": 160,
        "theme": "cyan"
      }
    ],
    "winningFormula": "(4 + 4) × 4 = 32  ✔"
  },
  {
    "id": 39,
    "name": "Level 39: Smoked Gouda Melt",
    "subtitle": "Target: 14",
    "startValue": 2,
    "targetValue": 14,
    "startBox": {
      "x": 250,
      "y": 380,
      "w": 220,
      "h": 220,
      "label": "INGREDIENT DISPENSER"
    },
    "endBox": {
      "x": 830,
      "y": 1540,
      "w": 270,
      "h": 260,
      "label": "RECIPE COMPUTER"
    },
    "boxes": [
      {
        "id": "box_39_1",
        "op": "+",
        "val": 5,
        "badge": "+5",
        "name": "Prep Pod",
        "x": 280,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "orange"
      },
      {
        "id": "box_39_mul",
        "op": "*",
        "val": 2,
        "badge": "×2",
        "name": "Multiplier Sear",
        "x": 480,
        "y": 1000,
        "w": 180,
        "h": 160,
        "theme": "gold"
      },
      {
        "id": "box_39_3",
        "op": "+",
        "val": 8,
        "badge": "+8",
        "name": "Extra Herb",
        "x": 790,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "purple"
      },
      {
        "id": "box_39_4",
        "op": "+",
        "val": 4,
        "badge": "+4",
        "name": "Seasoning",
        "x": 800,
        "y": 1180,
        "w": 180,
        "h": 160,
        "theme": "cyan"
      }
    ],
    "winningFormula": "(2 + 5) × 2 = 14  ✔"
  },
  {
    "id": 40,
    "name": "Level 40: Crispy Shallot Crunch",
    "subtitle": "Target: 15",
    "startValue": 3,
    "targetValue": 15,
    "startBox": {
      "x": 250,
      "y": 380,
      "w": 220,
      "h": 220,
      "label": "INGREDIENT DISPENSER"
    },
    "endBox": {
      "x": 830,
      "y": 1540,
      "w": 270,
      "h": 260,
      "label": "RECIPE COMPUTER"
    },
    "boxes": [
      {
        "id": "box_40_1",
        "op": "+",
        "val": 2,
        "badge": "+2",
        "name": "Prep Pod",
        "x": 280,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "orange"
      },
      {
        "id": "box_40_mul",
        "op": "*",
        "val": 3,
        "badge": "×3",
        "name": "Multiplier Sear",
        "x": 480,
        "y": 1000,
        "w": 180,
        "h": 160,
        "theme": "gold"
      },
      {
        "id": "box_40_3",
        "op": "+",
        "val": 5,
        "badge": "+5",
        "name": "Extra Herb",
        "x": 790,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "purple"
      },
      {
        "id": "box_40_4",
        "op": "+",
        "val": 1,
        "badge": "+1",
        "name": "Seasoning",
        "x": 800,
        "y": 1180,
        "w": 180,
        "h": 160,
        "theme": "cyan"
      }
    ],
    "winningFormula": "(3 + 2) × 3 = 15  ✔"
  },
  {
    "id": 41,
    "name": "Level 41: Shiitake Umami",
    "subtitle": "Target: 42",
    "startValue": 4,
    "targetValue": 42,
    "startBox": {
      "x": 250,
      "y": 380,
      "w": 220,
      "h": 220,
      "label": "INGREDIENT DISPENSER"
    },
    "endBox": {
      "x": 830,
      "y": 1540,
      "w": 270,
      "h": 260,
      "label": "RECIPE COMPUTER"
    },
    "boxes": [
      {
        "id": "box_41_boost",
        "op": "+",
        "val": 10,
        "badge": "+10",
        "name": "Turbo Pod",
        "x": 280,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "orange"
      },
      {
        "id": "box_41_low",
        "op": "+",
        "val": 2,
        "badge": "+2",
        "name": "Simmer Pod",
        "x": 790,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "cyan"
      },
      {
        "id": "box_41_cond",
        "type": "conditional",
        "op": "conditional",
        "condType": "gt",
        "condVal": 13,
        "badge": "IF > 13",
        "name": "⚡ Logic Gate",
        "x": 480,
        "y": 1000,
        "w": 220,
        "h": 180,
        "theme": "quantum"
      },
      {
        "id": "box_41_mul",
        "op": "*",
        "val": 3,
        "badge": "×3",
        "name": "Booster Sizzle",
        "x": 800,
        "y": 1180,
        "w": 180,
        "h": 160,
        "theme": "gold"
      },
      {
        "id": "box_41_extra",
        "op": "+",
        "val": 3,
        "badge": "+3",
        "name": "Herb Finish",
        "x": 280,
        "y": 1260,
        "w": 180,
        "h": 160,
        "theme": "purple"
      }
    ],
    "winningFormula": "(4 + 10 = 14) [IF > 13 ➔ YES] × 3 = 42  ✔"
  },
  {
    "id": 42,
    "name": "Level 42: Ginger Lemongrass",
    "subtitle": "Target: 20",
    "startValue": 5,
    "targetValue": 20,
    "startBox": {
      "x": 250,
      "y": 380,
      "w": 220,
      "h": 220,
      "label": "INGREDIENT DISPENSER"
    },
    "endBox": {
      "x": 830,
      "y": 1540,
      "w": 270,
      "h": 260,
      "label": "RECIPE COMPUTER"
    },
    "boxes": [
      {
        "id": "box_42_boost",
        "op": "+",
        "val": 5,
        "badge": "+5",
        "name": "Turbo Pod",
        "x": 280,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "orange"
      },
      {
        "id": "box_42_low",
        "op": "+",
        "val": 1,
        "badge": "+1",
        "name": "Simmer Pod",
        "x": 790,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "cyan"
      },
      {
        "id": "box_42_cond",
        "type": "conditional",
        "op": "conditional",
        "condType": "gt",
        "condVal": 9,
        "badge": "IF > 9",
        "name": "⚡ Logic Gate",
        "x": 480,
        "y": 1000,
        "w": 220,
        "h": 180,
        "theme": "quantum"
      },
      {
        "id": "box_42_mul",
        "op": "*",
        "val": 2,
        "badge": "×2",
        "name": "Booster Sizzle",
        "x": 800,
        "y": 1180,
        "w": 180,
        "h": 160,
        "theme": "gold"
      },
      {
        "id": "box_42_extra",
        "op": "+",
        "val": 3,
        "badge": "+3",
        "name": "Herb Finish",
        "x": 280,
        "y": 1260,
        "w": 180,
        "h": 160,
        "theme": "purple"
      }
    ],
    "winningFormula": "(5 + 5 = 10) [IF > 9 ➔ YES] × 2 = 20  ✔"
  },
  {
    "id": 43,
    "name": "Level 43: Chipotle Fire Gate",
    "subtitle": "Target: 36",
    "startValue": 6,
    "targetValue": 36,
    "startBox": {
      "x": 250,
      "y": 380,
      "w": 220,
      "h": 220,
      "label": "INGREDIENT DISPENSER"
    },
    "endBox": {
      "x": 830,
      "y": 1540,
      "w": 270,
      "h": 260,
      "label": "RECIPE COMPUTER"
    },
    "boxes": [
      {
        "id": "box_43_boost",
        "op": "+",
        "val": 6,
        "badge": "+6",
        "name": "Turbo Pod",
        "x": 280,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "orange"
      },
      {
        "id": "box_43_low",
        "op": "+",
        "val": 2,
        "badge": "+2",
        "name": "Simmer Pod",
        "x": 790,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "cyan"
      },
      {
        "id": "box_43_cond",
        "type": "conditional",
        "op": "conditional",
        "condType": "gt",
        "condVal": 11,
        "badge": "IF > 11",
        "name": "⚡ Logic Gate",
        "x": 480,
        "y": 1000,
        "w": 220,
        "h": 180,
        "theme": "quantum"
      },
      {
        "id": "box_43_mul",
        "op": "*",
        "val": 3,
        "badge": "×3",
        "name": "Booster Sizzle",
        "x": 800,
        "y": 1180,
        "w": 180,
        "h": 160,
        "theme": "gold"
      },
      {
        "id": "box_43_extra",
        "op": "+",
        "val": 3,
        "badge": "+3",
        "name": "Herb Finish",
        "x": 280,
        "y": 1260,
        "w": 180,
        "h": 160,
        "theme": "purple"
      }
    ],
    "winningFormula": "(6 + 6 = 12) [IF > 11 ➔ YES] × 3 = 36  ✔"
  },
  {
    "id": 44,
    "name": "Level 44: Sweet Plum Glaze",
    "subtitle": "Target: 20",
    "startValue": 3,
    "targetValue": 20,
    "startBox": {
      "x": 250,
      "y": 380,
      "w": 220,
      "h": 220,
      "label": "INGREDIENT DISPENSER"
    },
    "endBox": {
      "x": 830,
      "y": 1540,
      "w": 270,
      "h": 260,
      "label": "RECIPE COMPUTER"
    },
    "boxes": [
      {
        "id": "box_44_boost",
        "op": "+",
        "val": 7,
        "badge": "+7",
        "name": "Turbo Pod",
        "x": 280,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "orange"
      },
      {
        "id": "box_44_low",
        "op": "+",
        "val": 1,
        "badge": "+1",
        "name": "Simmer Pod",
        "x": 790,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "cyan"
      },
      {
        "id": "box_44_cond",
        "type": "conditional",
        "op": "conditional",
        "condType": "gt",
        "condVal": 9,
        "badge": "IF > 9",
        "name": "⚡ Logic Gate",
        "x": 480,
        "y": 1000,
        "w": 220,
        "h": 180,
        "theme": "quantum"
      },
      {
        "id": "box_44_mul",
        "op": "*",
        "val": 2,
        "badge": "×2",
        "name": "Booster Sizzle",
        "x": 800,
        "y": 1180,
        "w": 180,
        "h": 160,
        "theme": "gold"
      },
      {
        "id": "box_44_extra",
        "op": "+",
        "val": 3,
        "badge": "+3",
        "name": "Herb Finish",
        "x": 280,
        "y": 1260,
        "w": 180,
        "h": 160,
        "theme": "purple"
      }
    ],
    "winningFormula": "(3 + 7 = 10) [IF > 9 ➔ YES] × 2 = 20  ✔"
  },
  {
    "id": 45,
    "name": "Level 45: Thyme Reduction",
    "subtitle": "Target: 36",
    "startValue": 4,
    "targetValue": 36,
    "startBox": {
      "x": 250,
      "y": 380,
      "w": 220,
      "h": 220,
      "label": "INGREDIENT DISPENSER"
    },
    "endBox": {
      "x": 830,
      "y": 1540,
      "w": 270,
      "h": 260,
      "label": "RECIPE COMPUTER"
    },
    "boxes": [
      {
        "id": "box_45_boost",
        "op": "+",
        "val": 8,
        "badge": "+8",
        "name": "Turbo Pod",
        "x": 280,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "orange"
      },
      {
        "id": "box_45_low",
        "op": "+",
        "val": 2,
        "badge": "+2",
        "name": "Simmer Pod",
        "x": 790,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "cyan"
      },
      {
        "id": "box_45_cond",
        "type": "conditional",
        "op": "conditional",
        "condType": "gt",
        "condVal": 11,
        "badge": "IF > 11",
        "name": "⚡ Logic Gate",
        "x": 480,
        "y": 1000,
        "w": 220,
        "h": 180,
        "theme": "quantum"
      },
      {
        "id": "box_45_mul",
        "op": "*",
        "val": 3,
        "badge": "×3",
        "name": "Booster Sizzle",
        "x": 800,
        "y": 1180,
        "w": 180,
        "h": 160,
        "theme": "gold"
      },
      {
        "id": "box_45_extra",
        "op": "+",
        "val": 3,
        "badge": "+3",
        "name": "Herb Finish",
        "x": 280,
        "y": 1260,
        "w": 180,
        "h": 160,
        "theme": "purple"
      }
    ],
    "winningFormula": "(4 + 8 = 12) [IF > 11 ➔ YES] × 3 = 36  ✔"
  },
  {
    "id": 46,
    "name": "Level 46: Coriander Crust",
    "subtitle": "Target: 28",
    "startValue": 5,
    "targetValue": 28,
    "startBox": {
      "x": 250,
      "y": 380,
      "w": 220,
      "h": 220,
      "label": "INGREDIENT DISPENSER"
    },
    "endBox": {
      "x": 830,
      "y": 1540,
      "w": 270,
      "h": 260,
      "label": "RECIPE COMPUTER"
    },
    "boxes": [
      {
        "id": "box_46_boost",
        "op": "+",
        "val": 9,
        "badge": "+9",
        "name": "Turbo Pod",
        "x": 280,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "orange"
      },
      {
        "id": "box_46_low",
        "op": "+",
        "val": 1,
        "badge": "+1",
        "name": "Simmer Pod",
        "x": 790,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "cyan"
      },
      {
        "id": "box_46_cond",
        "type": "conditional",
        "op": "conditional",
        "condType": "gt",
        "condVal": 13,
        "badge": "IF > 13",
        "name": "⚡ Logic Gate",
        "x": 480,
        "y": 1000,
        "w": 220,
        "h": 180,
        "theme": "quantum"
      },
      {
        "id": "box_46_mul",
        "op": "*",
        "val": 2,
        "badge": "×2",
        "name": "Booster Sizzle",
        "x": 800,
        "y": 1180,
        "w": 180,
        "h": 160,
        "theme": "gold"
      },
      {
        "id": "box_46_extra",
        "op": "+",
        "val": 3,
        "badge": "+3",
        "name": "Herb Finish",
        "x": 280,
        "y": 1260,
        "w": 180,
        "h": 160,
        "theme": "purple"
      }
    ],
    "winningFormula": "(5 + 9 = 14) [IF > 13 ➔ YES] × 2 = 28  ✔"
  },
  {
    "id": 47,
    "name": "Level 47: Dragon's Breath Pepper",
    "subtitle": "Target: 48",
    "startValue": 6,
    "targetValue": 48,
    "startBox": {
      "x": 250,
      "y": 380,
      "w": 220,
      "h": 220,
      "label": "INGREDIENT DISPENSER"
    },
    "endBox": {
      "x": 830,
      "y": 1540,
      "w": 270,
      "h": 260,
      "label": "RECIPE COMPUTER"
    },
    "boxes": [
      {
        "id": "box_47_boost",
        "op": "+",
        "val": 10,
        "badge": "+10",
        "name": "Turbo Pod",
        "x": 280,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "orange"
      },
      {
        "id": "box_47_low",
        "op": "+",
        "val": 2,
        "badge": "+2",
        "name": "Simmer Pod",
        "x": 790,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "cyan"
      },
      {
        "id": "box_47_cond",
        "type": "conditional",
        "op": "conditional",
        "condType": "gt",
        "condVal": 15,
        "badge": "IF > 15",
        "name": "⚡ Logic Gate",
        "x": 480,
        "y": 1000,
        "w": 220,
        "h": 180,
        "theme": "quantum"
      },
      {
        "id": "box_47_mul",
        "op": "*",
        "val": 3,
        "badge": "×3",
        "name": "Booster Sizzle",
        "x": 800,
        "y": 1180,
        "w": 180,
        "h": 160,
        "theme": "gold"
      },
      {
        "id": "box_47_extra",
        "op": "+",
        "val": 3,
        "badge": "+3",
        "name": "Herb Finish",
        "x": 280,
        "y": 1260,
        "w": 180,
        "h": 160,
        "theme": "purple"
      }
    ],
    "winningFormula": "(6 + 10 = 16) [IF > 15 ➔ YES] × 3 = 48  ✔"
  },
  {
    "id": 48,
    "name": "Level 48: Hickory Smoke Trail",
    "subtitle": "Target: 16",
    "startValue": 3,
    "targetValue": 16,
    "startBox": {
      "x": 250,
      "y": 380,
      "w": 220,
      "h": 220,
      "label": "INGREDIENT DISPENSER"
    },
    "endBox": {
      "x": 830,
      "y": 1540,
      "w": 270,
      "h": 260,
      "label": "RECIPE COMPUTER"
    },
    "boxes": [
      {
        "id": "box_48_boost",
        "op": "+",
        "val": 5,
        "badge": "+5",
        "name": "Turbo Pod",
        "x": 280,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "orange"
      },
      {
        "id": "box_48_low",
        "op": "+",
        "val": 1,
        "badge": "+1",
        "name": "Simmer Pod",
        "x": 790,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "cyan"
      },
      {
        "id": "box_48_cond",
        "type": "conditional",
        "op": "conditional",
        "condType": "gt",
        "condVal": 7,
        "badge": "IF > 7",
        "name": "⚡ Logic Gate",
        "x": 480,
        "y": 1000,
        "w": 220,
        "h": 180,
        "theme": "quantum"
      },
      {
        "id": "box_48_mul",
        "op": "*",
        "val": 2,
        "badge": "×2",
        "name": "Booster Sizzle",
        "x": 800,
        "y": 1180,
        "w": 180,
        "h": 160,
        "theme": "gold"
      },
      {
        "id": "box_48_extra",
        "op": "+",
        "val": 3,
        "badge": "+3",
        "name": "Herb Finish",
        "x": 280,
        "y": 1260,
        "w": 180,
        "h": 160,
        "theme": "purple"
      }
    ],
    "winningFormula": "(3 + 5 = 8) [IF > 7 ➔ YES] × 2 = 16  ✔"
  },
  {
    "id": 49,
    "name": "Level 49: Dashi Broth Circuit",
    "subtitle": "Target: 30",
    "startValue": 4,
    "targetValue": 30,
    "startBox": {
      "x": 250,
      "y": 380,
      "w": 220,
      "h": 220,
      "label": "INGREDIENT DISPENSER"
    },
    "endBox": {
      "x": 830,
      "y": 1540,
      "w": 270,
      "h": 260,
      "label": "RECIPE COMPUTER"
    },
    "boxes": [
      {
        "id": "box_49_boost",
        "op": "+",
        "val": 6,
        "badge": "+6",
        "name": "Turbo Pod",
        "x": 280,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "orange"
      },
      {
        "id": "box_49_low",
        "op": "+",
        "val": 2,
        "badge": "+2",
        "name": "Simmer Pod",
        "x": 790,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "cyan"
      },
      {
        "id": "box_49_cond",
        "type": "conditional",
        "op": "conditional",
        "condType": "gt",
        "condVal": 9,
        "badge": "IF > 9",
        "name": "⚡ Logic Gate",
        "x": 480,
        "y": 1000,
        "w": 220,
        "h": 180,
        "theme": "quantum"
      },
      {
        "id": "box_49_mul",
        "op": "*",
        "val": 3,
        "badge": "×3",
        "name": "Booster Sizzle",
        "x": 800,
        "y": 1180,
        "w": 180,
        "h": 160,
        "theme": "gold"
      },
      {
        "id": "box_49_extra",
        "op": "+",
        "val": 3,
        "badge": "+3",
        "name": "Herb Finish",
        "x": 280,
        "y": 1260,
        "w": 180,
        "h": 160,
        "theme": "purple"
      }
    ],
    "winningFormula": "(4 + 6 = 10) [IF > 9 ➔ YES] × 3 = 30  ✔"
  },
  {
    "id": 50,
    "name": "Level 50: Tarragon Velouté",
    "subtitle": "Target: 24",
    "startValue": 5,
    "targetValue": 24,
    "startBox": {
      "x": 250,
      "y": 380,
      "w": 220,
      "h": 220,
      "label": "INGREDIENT DISPENSER"
    },
    "endBox": {
      "x": 830,
      "y": 1540,
      "w": 270,
      "h": 260,
      "label": "RECIPE COMPUTER"
    },
    "boxes": [
      {
        "id": "box_50_boost",
        "op": "+",
        "val": 7,
        "badge": "+7",
        "name": "Turbo Pod",
        "x": 280,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "orange"
      },
      {
        "id": "box_50_low",
        "op": "+",
        "val": 1,
        "badge": "+1",
        "name": "Simmer Pod",
        "x": 790,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "cyan"
      },
      {
        "id": "box_50_cond",
        "type": "conditional",
        "op": "conditional",
        "condType": "gt",
        "condVal": 11,
        "badge": "IF > 11",
        "name": "⚡ Logic Gate",
        "x": 480,
        "y": 1000,
        "w": 220,
        "h": 180,
        "theme": "quantum"
      },
      {
        "id": "box_50_mul",
        "op": "*",
        "val": 2,
        "badge": "×2",
        "name": "Booster Sizzle",
        "x": 800,
        "y": 1180,
        "w": 180,
        "h": 160,
        "theme": "gold"
      },
      {
        "id": "box_50_extra",
        "op": "+",
        "val": 3,
        "badge": "+3",
        "name": "Herb Finish",
        "x": 280,
        "y": 1260,
        "w": 180,
        "h": 160,
        "theme": "purple"
      }
    ],
    "winningFormula": "(5 + 7 = 12) [IF > 11 ➔ YES] × 2 = 24  ✔"
  },
  {
    "id": 51,
    "name": "Level 51: Dijon Herb Lattice",
    "subtitle": "Target: 42",
    "startValue": 6,
    "targetValue": 42,
    "startBox": {
      "x": 250,
      "y": 380,
      "w": 220,
      "h": 220,
      "label": "INGREDIENT DISPENSER"
    },
    "endBox": {
      "x": 830,
      "y": 1540,
      "w": 270,
      "h": 260,
      "label": "RECIPE COMPUTER"
    },
    "boxes": [
      {
        "id": "box_51_boost",
        "op": "+",
        "val": 8,
        "badge": "+8",
        "name": "Turbo Pod",
        "x": 280,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "orange"
      },
      {
        "id": "box_51_low",
        "op": "+",
        "val": 2,
        "badge": "+2",
        "name": "Simmer Pod",
        "x": 790,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "cyan"
      },
      {
        "id": "box_51_cond",
        "type": "conditional",
        "op": "conditional",
        "condType": "gt",
        "condVal": 13,
        "badge": "IF > 13",
        "name": "⚡ Logic Gate",
        "x": 480,
        "y": 1000,
        "w": 220,
        "h": 180,
        "theme": "quantum"
      },
      {
        "id": "box_51_mul",
        "op": "*",
        "val": 3,
        "badge": "×3",
        "name": "Booster Sizzle",
        "x": 800,
        "y": 1180,
        "w": 180,
        "h": 160,
        "theme": "gold"
      },
      {
        "id": "box_51_extra",
        "op": "+",
        "val": 3,
        "badge": "+3",
        "name": "Herb Finish",
        "x": 280,
        "y": 1260,
        "w": 180,
        "h": 160,
        "theme": "purple"
      }
    ],
    "winningFormula": "(6 + 8 = 14) [IF > 13 ➔ YES] × 3 = 42  ✔"
  },
  {
    "id": 52,
    "name": "Level 52: Black Garlic Sear",
    "subtitle": "Target: 24",
    "startValue": 3,
    "targetValue": 24,
    "startBox": {
      "x": 250,
      "y": 380,
      "w": 220,
      "h": 220,
      "label": "INGREDIENT DISPENSER"
    },
    "endBox": {
      "x": 830,
      "y": 1540,
      "w": 270,
      "h": 260,
      "label": "RECIPE COMPUTER"
    },
    "boxes": [
      {
        "id": "box_52_boost",
        "op": "+",
        "val": 9,
        "badge": "+9",
        "name": "Turbo Pod",
        "x": 280,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "orange"
      },
      {
        "id": "box_52_low",
        "op": "+",
        "val": 1,
        "badge": "+1",
        "name": "Simmer Pod",
        "x": 790,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "cyan"
      },
      {
        "id": "box_52_cond",
        "type": "conditional",
        "op": "conditional",
        "condType": "gt",
        "condVal": 11,
        "badge": "IF > 11",
        "name": "⚡ Logic Gate",
        "x": 480,
        "y": 1000,
        "w": 220,
        "h": 180,
        "theme": "quantum"
      },
      {
        "id": "box_52_mul",
        "op": "*",
        "val": 2,
        "badge": "×2",
        "name": "Booster Sizzle",
        "x": 800,
        "y": 1180,
        "w": 180,
        "h": 160,
        "theme": "gold"
      },
      {
        "id": "box_52_extra",
        "op": "+",
        "val": 3,
        "badge": "+3",
        "name": "Herb Finish",
        "x": 280,
        "y": 1260,
        "w": 180,
        "h": 160,
        "theme": "purple"
      }
    ],
    "winningFormula": "(3 + 9 = 12) [IF > 11 ➔ YES] × 2 = 24  ✔"
  },
  {
    "id": 53,
    "name": "Level 53: Chive Blossom Puree",
    "subtitle": "Target: 42",
    "startValue": 4,
    "targetValue": 42,
    "startBox": {
      "x": 250,
      "y": 380,
      "w": 220,
      "h": 220,
      "label": "INGREDIENT DISPENSER"
    },
    "endBox": {
      "x": 830,
      "y": 1540,
      "w": 270,
      "h": 260,
      "label": "RECIPE COMPUTER"
    },
    "boxes": [
      {
        "id": "box_53_boost",
        "op": "+",
        "val": 10,
        "badge": "+10",
        "name": "Turbo Pod",
        "x": 280,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "orange"
      },
      {
        "id": "box_53_low",
        "op": "+",
        "val": 2,
        "badge": "+2",
        "name": "Simmer Pod",
        "x": 790,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "cyan"
      },
      {
        "id": "box_53_cond",
        "type": "conditional",
        "op": "conditional",
        "condType": "gt",
        "condVal": 13,
        "badge": "IF > 13",
        "name": "⚡ Logic Gate",
        "x": 480,
        "y": 1000,
        "w": 220,
        "h": 180,
        "theme": "quantum"
      },
      {
        "id": "box_53_mul",
        "op": "*",
        "val": 3,
        "badge": "×3",
        "name": "Booster Sizzle",
        "x": 800,
        "y": 1180,
        "w": 180,
        "h": 160,
        "theme": "gold"
      },
      {
        "id": "box_53_extra",
        "op": "+",
        "val": 3,
        "badge": "+3",
        "name": "Herb Finish",
        "x": 280,
        "y": 1260,
        "w": 180,
        "h": 160,
        "theme": "purple"
      }
    ],
    "winningFormula": "(4 + 10 = 14) [IF > 13 ➔ YES] × 3 = 42  ✔"
  },
  {
    "id": 54,
    "name": "Level 54: Roasted Cumin Seed",
    "subtitle": "Target: 20",
    "startValue": 5,
    "targetValue": 20,
    "startBox": {
      "x": 250,
      "y": 380,
      "w": 220,
      "h": 220,
      "label": "INGREDIENT DISPENSER"
    },
    "endBox": {
      "x": 830,
      "y": 1540,
      "w": 270,
      "h": 260,
      "label": "RECIPE COMPUTER"
    },
    "boxes": [
      {
        "id": "box_54_boost",
        "op": "+",
        "val": 5,
        "badge": "+5",
        "name": "Turbo Pod",
        "x": 280,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "orange"
      },
      {
        "id": "box_54_low",
        "op": "+",
        "val": 1,
        "badge": "+1",
        "name": "Simmer Pod",
        "x": 790,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "cyan"
      },
      {
        "id": "box_54_cond",
        "type": "conditional",
        "op": "conditional",
        "condType": "gt",
        "condVal": 9,
        "badge": "IF > 9",
        "name": "⚡ Logic Gate",
        "x": 480,
        "y": 1000,
        "w": 220,
        "h": 180,
        "theme": "quantum"
      },
      {
        "id": "box_54_mul",
        "op": "*",
        "val": 2,
        "badge": "×2",
        "name": "Booster Sizzle",
        "x": 800,
        "y": 1180,
        "w": 180,
        "h": 160,
        "theme": "gold"
      },
      {
        "id": "box_54_extra",
        "op": "+",
        "val": 3,
        "badge": "+3",
        "name": "Herb Finish",
        "x": 280,
        "y": 1260,
        "w": 180,
        "h": 160,
        "theme": "purple"
      }
    ],
    "winningFormula": "(5 + 5 = 10) [IF > 9 ➔ YES] × 2 = 20  ✔"
  },
  {
    "id": 55,
    "name": "Level 55: Star Anise Infusion",
    "subtitle": "Target: 36",
    "startValue": 6,
    "targetValue": 36,
    "startBox": {
      "x": 250,
      "y": 380,
      "w": 220,
      "h": 220,
      "label": "INGREDIENT DISPENSER"
    },
    "endBox": {
      "x": 830,
      "y": 1540,
      "w": 270,
      "h": 260,
      "label": "RECIPE COMPUTER"
    },
    "boxes": [
      {
        "id": "box_55_boost",
        "op": "+",
        "val": 6,
        "badge": "+6",
        "name": "Turbo Pod",
        "x": 280,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "orange"
      },
      {
        "id": "box_55_low",
        "op": "+",
        "val": 2,
        "badge": "+2",
        "name": "Simmer Pod",
        "x": 790,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "cyan"
      },
      {
        "id": "box_55_cond",
        "type": "conditional",
        "op": "conditional",
        "condType": "gt",
        "condVal": 11,
        "badge": "IF > 11",
        "name": "⚡ Logic Gate",
        "x": 480,
        "y": 1000,
        "w": 220,
        "h": 180,
        "theme": "quantum"
      },
      {
        "id": "box_55_mul",
        "op": "*",
        "val": 3,
        "badge": "×3",
        "name": "Booster Sizzle",
        "x": 800,
        "y": 1180,
        "w": 180,
        "h": 160,
        "theme": "gold"
      },
      {
        "id": "box_55_extra",
        "op": "+",
        "val": 3,
        "badge": "+3",
        "name": "Herb Finish",
        "x": 280,
        "y": 1260,
        "w": 180,
        "h": 160,
        "theme": "purple"
      }
    ],
    "winningFormula": "(6 + 6 = 12) [IF > 11 ➔ YES] × 3 = 36  ✔"
  },
  {
    "id": 56,
    "name": "Level 56: Cardamom Spice Net",
    "subtitle": "Target: 20",
    "startValue": 3,
    "targetValue": 20,
    "startBox": {
      "x": 250,
      "y": 380,
      "w": 220,
      "h": 220,
      "label": "INGREDIENT DISPENSER"
    },
    "endBox": {
      "x": 830,
      "y": 1540,
      "w": 270,
      "h": 260,
      "label": "RECIPE COMPUTER"
    },
    "boxes": [
      {
        "id": "box_56_boost",
        "op": "+",
        "val": 7,
        "badge": "+7",
        "name": "Turbo Pod",
        "x": 280,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "orange"
      },
      {
        "id": "box_56_low",
        "op": "+",
        "val": 1,
        "badge": "+1",
        "name": "Simmer Pod",
        "x": 790,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "cyan"
      },
      {
        "id": "box_56_cond",
        "type": "conditional",
        "op": "conditional",
        "condType": "gt",
        "condVal": 9,
        "badge": "IF > 9",
        "name": "⚡ Logic Gate",
        "x": 480,
        "y": 1000,
        "w": 220,
        "h": 180,
        "theme": "quantum"
      },
      {
        "id": "box_56_mul",
        "op": "*",
        "val": 2,
        "badge": "×2",
        "name": "Booster Sizzle",
        "x": 800,
        "y": 1180,
        "w": 180,
        "h": 160,
        "theme": "gold"
      },
      {
        "id": "box_56_extra",
        "op": "+",
        "val": 3,
        "badge": "+3",
        "name": "Herb Finish",
        "x": 280,
        "y": 1260,
        "w": 180,
        "h": 160,
        "theme": "purple"
      }
    ],
    "winningFormula": "(3 + 7 = 10) [IF > 9 ➔ YES] × 2 = 20  ✔"
  },
  {
    "id": 57,
    "name": "Level 57: Smoked Paprika Glaze",
    "subtitle": "Target: 36",
    "startValue": 4,
    "targetValue": 36,
    "startBox": {
      "x": 250,
      "y": 380,
      "w": 220,
      "h": 220,
      "label": "INGREDIENT DISPENSER"
    },
    "endBox": {
      "x": 830,
      "y": 1540,
      "w": 270,
      "h": 260,
      "label": "RECIPE COMPUTER"
    },
    "boxes": [
      {
        "id": "box_57_boost",
        "op": "+",
        "val": 8,
        "badge": "+8",
        "name": "Turbo Pod",
        "x": 280,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "orange"
      },
      {
        "id": "box_57_low",
        "op": "+",
        "val": 2,
        "badge": "+2",
        "name": "Simmer Pod",
        "x": 790,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "cyan"
      },
      {
        "id": "box_57_cond",
        "type": "conditional",
        "op": "conditional",
        "condType": "gt",
        "condVal": 11,
        "badge": "IF > 11",
        "name": "⚡ Logic Gate",
        "x": 480,
        "y": 1000,
        "w": 220,
        "h": 180,
        "theme": "quantum"
      },
      {
        "id": "box_57_mul",
        "op": "*",
        "val": 3,
        "badge": "×3",
        "name": "Booster Sizzle",
        "x": 800,
        "y": 1180,
        "w": 180,
        "h": 160,
        "theme": "gold"
      },
      {
        "id": "box_57_extra",
        "op": "+",
        "val": 3,
        "badge": "+3",
        "name": "Herb Finish",
        "x": 280,
        "y": 1260,
        "w": 180,
        "h": 160,
        "theme": "purple"
      }
    ],
    "winningFormula": "(4 + 8 = 12) [IF > 11 ➔ YES] × 3 = 36  ✔"
  },
  {
    "id": 58,
    "name": "Level 58: Lemongrass Coconut",
    "subtitle": "Target: 28",
    "startValue": 5,
    "targetValue": 28,
    "startBox": {
      "x": 250,
      "y": 380,
      "w": 220,
      "h": 220,
      "label": "INGREDIENT DISPENSER"
    },
    "endBox": {
      "x": 830,
      "y": 1540,
      "w": 270,
      "h": 260,
      "label": "RECIPE COMPUTER"
    },
    "boxes": [
      {
        "id": "box_58_boost",
        "op": "+",
        "val": 9,
        "badge": "+9",
        "name": "Turbo Pod",
        "x": 280,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "orange"
      },
      {
        "id": "box_58_low",
        "op": "+",
        "val": 1,
        "badge": "+1",
        "name": "Simmer Pod",
        "x": 790,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "cyan"
      },
      {
        "id": "box_58_cond",
        "type": "conditional",
        "op": "conditional",
        "condType": "gt",
        "condVal": 13,
        "badge": "IF > 13",
        "name": "⚡ Logic Gate",
        "x": 480,
        "y": 1000,
        "w": 220,
        "h": 180,
        "theme": "quantum"
      },
      {
        "id": "box_58_mul",
        "op": "*",
        "val": 2,
        "badge": "×2",
        "name": "Booster Sizzle",
        "x": 800,
        "y": 1180,
        "w": 180,
        "h": 160,
        "theme": "gold"
      },
      {
        "id": "box_58_extra",
        "op": "+",
        "val": 3,
        "badge": "+3",
        "name": "Herb Finish",
        "x": 280,
        "y": 1260,
        "w": 180,
        "h": 160,
        "theme": "purple"
      }
    ],
    "winningFormula": "(5 + 9 = 14) [IF > 13 ➔ YES] × 2 = 28  ✔"
  },
  {
    "id": 59,
    "name": "Level 59: Red Wine Demi-Glace",
    "subtitle": "Target: 48",
    "startValue": 6,
    "targetValue": 48,
    "startBox": {
      "x": 250,
      "y": 380,
      "w": 220,
      "h": 220,
      "label": "INGREDIENT DISPENSER"
    },
    "endBox": {
      "x": 830,
      "y": 1540,
      "w": 270,
      "h": 260,
      "label": "RECIPE COMPUTER"
    },
    "boxes": [
      {
        "id": "box_59_boost",
        "op": "+",
        "val": 10,
        "badge": "+10",
        "name": "Turbo Pod",
        "x": 280,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "orange"
      },
      {
        "id": "box_59_low",
        "op": "+",
        "val": 2,
        "badge": "+2",
        "name": "Simmer Pod",
        "x": 790,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "cyan"
      },
      {
        "id": "box_59_cond",
        "type": "conditional",
        "op": "conditional",
        "condType": "gt",
        "condVal": 15,
        "badge": "IF > 15",
        "name": "⚡ Logic Gate",
        "x": 480,
        "y": 1000,
        "w": 220,
        "h": 180,
        "theme": "quantum"
      },
      {
        "id": "box_59_mul",
        "op": "*",
        "val": 3,
        "badge": "×3",
        "name": "Booster Sizzle",
        "x": 800,
        "y": 1180,
        "w": 180,
        "h": 160,
        "theme": "gold"
      },
      {
        "id": "box_59_extra",
        "op": "+",
        "val": 3,
        "badge": "+3",
        "name": "Herb Finish",
        "x": 280,
        "y": 1260,
        "w": 180,
        "h": 160,
        "theme": "purple"
      }
    ],
    "winningFormula": "(6 + 10 = 16) [IF > 15 ➔ YES] × 3 = 48  ✔"
  },
  {
    "id": 60,
    "name": "Level 60: Gochujang Fire Loop",
    "subtitle": "Target: 16",
    "startValue": 3,
    "targetValue": 16,
    "startBox": {
      "x": 250,
      "y": 380,
      "w": 220,
      "h": 220,
      "label": "INGREDIENT DISPENSER"
    },
    "endBox": {
      "x": 830,
      "y": 1540,
      "w": 270,
      "h": 260,
      "label": "RECIPE COMPUTER"
    },
    "boxes": [
      {
        "id": "box_60_boost",
        "op": "+",
        "val": 5,
        "badge": "+5",
        "name": "Turbo Pod",
        "x": 280,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "orange"
      },
      {
        "id": "box_60_low",
        "op": "+",
        "val": 1,
        "badge": "+1",
        "name": "Simmer Pod",
        "x": 790,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "cyan"
      },
      {
        "id": "box_60_cond",
        "type": "conditional",
        "op": "conditional",
        "condType": "gt",
        "condVal": 7,
        "badge": "IF > 7",
        "name": "⚡ Logic Gate",
        "x": 480,
        "y": 1000,
        "w": 220,
        "h": 180,
        "theme": "quantum"
      },
      {
        "id": "box_60_mul",
        "op": "*",
        "val": 2,
        "badge": "×2",
        "name": "Booster Sizzle",
        "x": 800,
        "y": 1180,
        "w": 180,
        "h": 160,
        "theme": "gold"
      },
      {
        "id": "box_60_extra",
        "op": "+",
        "val": 3,
        "badge": "+3",
        "name": "Herb Finish",
        "x": 280,
        "y": 1260,
        "w": 180,
        "h": 160,
        "theme": "purple"
      }
    ],
    "winningFormula": "(3 + 5 = 8) [IF > 7 ➔ YES] × 2 = 16  ✔"
  },
  {
    "id": 61,
    "name": "Level 61: Yuzu Kosho Zing",
    "subtitle": "Target: 30",
    "startValue": 4,
    "targetValue": 30,
    "startBox": {
      "x": 250,
      "y": 380,
      "w": 220,
      "h": 220,
      "label": "INGREDIENT DISPENSER"
    },
    "endBox": {
      "x": 830,
      "y": 1540,
      "w": 270,
      "h": 260,
      "label": "RECIPE COMPUTER"
    },
    "boxes": [
      {
        "id": "box_61_boost",
        "op": "+",
        "val": 6,
        "badge": "+6",
        "name": "Turbo Pod",
        "x": 280,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "orange"
      },
      {
        "id": "box_61_low",
        "op": "+",
        "val": 2,
        "badge": "+2",
        "name": "Simmer Pod",
        "x": 790,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "cyan"
      },
      {
        "id": "box_61_cond",
        "type": "conditional",
        "op": "conditional",
        "condType": "gt",
        "condVal": 9,
        "badge": "IF > 9",
        "name": "⚡ Logic Gate",
        "x": 480,
        "y": 1000,
        "w": 220,
        "h": 180,
        "theme": "quantum"
      },
      {
        "id": "box_61_mul",
        "op": "*",
        "val": 3,
        "badge": "×3",
        "name": "Booster Sizzle",
        "x": 800,
        "y": 1180,
        "w": 180,
        "h": 160,
        "theme": "gold"
      },
      {
        "id": "box_61_extra",
        "op": "+",
        "val": 3,
        "badge": "+3",
        "name": "Herb Finish",
        "x": 280,
        "y": 1260,
        "w": 180,
        "h": 160,
        "theme": "purple"
      }
    ],
    "winningFormula": "(4 + 6 = 10) [IF > 9 ➔ YES] × 3 = 30  ✔"
  },
  {
    "id": 62,
    "name": "Level 62: Matcha Sea Salt",
    "subtitle": "Target: 24",
    "startValue": 5,
    "targetValue": 24,
    "startBox": {
      "x": 250,
      "y": 380,
      "w": 220,
      "h": 220,
      "label": "INGREDIENT DISPENSER"
    },
    "endBox": {
      "x": 830,
      "y": 1540,
      "w": 270,
      "h": 260,
      "label": "RECIPE COMPUTER"
    },
    "boxes": [
      {
        "id": "box_62_boost",
        "op": "+",
        "val": 7,
        "badge": "+7",
        "name": "Turbo Pod",
        "x": 280,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "orange"
      },
      {
        "id": "box_62_low",
        "op": "+",
        "val": 1,
        "badge": "+1",
        "name": "Simmer Pod",
        "x": 790,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "cyan"
      },
      {
        "id": "box_62_cond",
        "type": "conditional",
        "op": "conditional",
        "condType": "gt",
        "condVal": 11,
        "badge": "IF > 11",
        "name": "⚡ Logic Gate",
        "x": 480,
        "y": 1000,
        "w": 220,
        "h": 180,
        "theme": "quantum"
      },
      {
        "id": "box_62_mul",
        "op": "*",
        "val": 2,
        "badge": "×2",
        "name": "Booster Sizzle",
        "x": 800,
        "y": 1180,
        "w": 180,
        "h": 160,
        "theme": "gold"
      },
      {
        "id": "box_62_extra",
        "op": "+",
        "val": 3,
        "badge": "+3",
        "name": "Herb Finish",
        "x": 280,
        "y": 1260,
        "w": 180,
        "h": 160,
        "theme": "purple"
      }
    ],
    "winningFormula": "(5 + 7 = 12) [IF > 11 ➔ YES] × 2 = 24  ✔"
  },
  {
    "id": 63,
    "name": "Level 63: Miso Glazed Aubergine",
    "subtitle": "Target: 42",
    "startValue": 6,
    "targetValue": 42,
    "startBox": {
      "x": 250,
      "y": 380,
      "w": 220,
      "h": 220,
      "label": "INGREDIENT DISPENSER"
    },
    "endBox": {
      "x": 830,
      "y": 1540,
      "w": 270,
      "h": 260,
      "label": "RECIPE COMPUTER"
    },
    "boxes": [
      {
        "id": "box_63_boost",
        "op": "+",
        "val": 8,
        "badge": "+8",
        "name": "Turbo Pod",
        "x": 280,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "orange"
      },
      {
        "id": "box_63_low",
        "op": "+",
        "val": 2,
        "badge": "+2",
        "name": "Simmer Pod",
        "x": 790,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "cyan"
      },
      {
        "id": "box_63_cond",
        "type": "conditional",
        "op": "conditional",
        "condType": "gt",
        "condVal": 13,
        "badge": "IF > 13",
        "name": "⚡ Logic Gate",
        "x": 480,
        "y": 1000,
        "w": 220,
        "h": 180,
        "theme": "quantum"
      },
      {
        "id": "box_63_mul",
        "op": "*",
        "val": 3,
        "badge": "×3",
        "name": "Booster Sizzle",
        "x": 800,
        "y": 1180,
        "w": 180,
        "h": 160,
        "theme": "gold"
      },
      {
        "id": "box_63_extra",
        "op": "+",
        "val": 3,
        "badge": "+3",
        "name": "Herb Finish",
        "x": 280,
        "y": 1260,
        "w": 180,
        "h": 160,
        "theme": "purple"
      }
    ],
    "winningFormula": "(6 + 8 = 14) [IF > 13 ➔ YES] × 3 = 42  ✔"
  },
  {
    "id": 64,
    "name": "Level 64: Poblano Chili Gate",
    "subtitle": "Target: 24",
    "startValue": 3,
    "targetValue": 24,
    "startBox": {
      "x": 250,
      "y": 380,
      "w": 220,
      "h": 220,
      "label": "INGREDIENT DISPENSER"
    },
    "endBox": {
      "x": 830,
      "y": 1540,
      "w": 270,
      "h": 260,
      "label": "RECIPE COMPUTER"
    },
    "boxes": [
      {
        "id": "box_64_boost",
        "op": "+",
        "val": 9,
        "badge": "+9",
        "name": "Turbo Pod",
        "x": 280,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "orange"
      },
      {
        "id": "box_64_low",
        "op": "+",
        "val": 1,
        "badge": "+1",
        "name": "Simmer Pod",
        "x": 790,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "cyan"
      },
      {
        "id": "box_64_cond",
        "type": "conditional",
        "op": "conditional",
        "condType": "gt",
        "condVal": 11,
        "badge": "IF > 11",
        "name": "⚡ Logic Gate",
        "x": 480,
        "y": 1000,
        "w": 220,
        "h": 180,
        "theme": "quantum"
      },
      {
        "id": "box_64_mul",
        "op": "*",
        "val": 2,
        "badge": "×2",
        "name": "Booster Sizzle",
        "x": 800,
        "y": 1180,
        "w": 180,
        "h": 160,
        "theme": "gold"
      },
      {
        "id": "box_64_extra",
        "op": "+",
        "val": 3,
        "badge": "+3",
        "name": "Herb Finish",
        "x": 280,
        "y": 1260,
        "w": 180,
        "h": 160,
        "theme": "purple"
      }
    ],
    "winningFormula": "(3 + 9 = 12) [IF > 11 ➔ YES] × 2 = 24  ✔"
  },
  {
    "id": 65,
    "name": "Level 65: Turmeric Golden Broth",
    "subtitle": "Target: 42",
    "startValue": 4,
    "targetValue": 42,
    "startBox": {
      "x": 250,
      "y": 380,
      "w": 220,
      "h": 220,
      "label": "INGREDIENT DISPENSER"
    },
    "endBox": {
      "x": 830,
      "y": 1540,
      "w": 270,
      "h": 260,
      "label": "RECIPE COMPUTER"
    },
    "boxes": [
      {
        "id": "box_65_boost",
        "op": "+",
        "val": 10,
        "badge": "+10",
        "name": "Turbo Pod",
        "x": 280,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "orange"
      },
      {
        "id": "box_65_low",
        "op": "+",
        "val": 2,
        "badge": "+2",
        "name": "Simmer Pod",
        "x": 790,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "cyan"
      },
      {
        "id": "box_65_cond",
        "type": "conditional",
        "op": "conditional",
        "condType": "gt",
        "condVal": 13,
        "badge": "IF > 13",
        "name": "⚡ Logic Gate",
        "x": 480,
        "y": 1000,
        "w": 220,
        "h": 180,
        "theme": "quantum"
      },
      {
        "id": "box_65_mul",
        "op": "*",
        "val": 3,
        "badge": "×3",
        "name": "Booster Sizzle",
        "x": 800,
        "y": 1180,
        "w": 180,
        "h": 160,
        "theme": "gold"
      },
      {
        "id": "box_65_extra",
        "op": "+",
        "val": 3,
        "badge": "+3",
        "name": "Herb Finish",
        "x": 280,
        "y": 1260,
        "w": 180,
        "h": 160,
        "theme": "purple"
      }
    ],
    "winningFormula": "(4 + 10 = 14) [IF > 13 ➔ YES] × 3 = 42  ✔"
  },
  {
    "id": 66,
    "name": "Level 66: Kaffir Lime Steam",
    "subtitle": "Target: 20",
    "startValue": 5,
    "targetValue": 20,
    "startBox": {
      "x": 250,
      "y": 380,
      "w": 220,
      "h": 220,
      "label": "INGREDIENT DISPENSER"
    },
    "endBox": {
      "x": 830,
      "y": 1540,
      "w": 270,
      "h": 260,
      "label": "RECIPE COMPUTER"
    },
    "boxes": [
      {
        "id": "box_66_boost",
        "op": "+",
        "val": 5,
        "badge": "+5",
        "name": "Turbo Pod",
        "x": 280,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "orange"
      },
      {
        "id": "box_66_low",
        "op": "+",
        "val": 1,
        "badge": "+1",
        "name": "Simmer Pod",
        "x": 790,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "cyan"
      },
      {
        "id": "box_66_cond",
        "type": "conditional",
        "op": "conditional",
        "condType": "gt",
        "condVal": 9,
        "badge": "IF > 9",
        "name": "⚡ Logic Gate",
        "x": 480,
        "y": 1000,
        "w": 220,
        "h": 180,
        "theme": "quantum"
      },
      {
        "id": "box_66_mul",
        "op": "*",
        "val": 2,
        "badge": "×2",
        "name": "Booster Sizzle",
        "x": 800,
        "y": 1180,
        "w": 180,
        "h": 160,
        "theme": "gold"
      },
      {
        "id": "box_66_extra",
        "op": "+",
        "val": 3,
        "badge": "+3",
        "name": "Herb Finish",
        "x": 280,
        "y": 1260,
        "w": 180,
        "h": 160,
        "theme": "purple"
      }
    ],
    "winningFormula": "(5 + 5 = 10) [IF > 9 ➔ YES] × 2 = 20  ✔"
  },
  {
    "id": 67,
    "name": "Level 67: Porcini Dust Vector",
    "subtitle": "Target: 36",
    "startValue": 6,
    "targetValue": 36,
    "startBox": {
      "x": 250,
      "y": 380,
      "w": 220,
      "h": 220,
      "label": "INGREDIENT DISPENSER"
    },
    "endBox": {
      "x": 830,
      "y": 1540,
      "w": 270,
      "h": 260,
      "label": "RECIPE COMPUTER"
    },
    "boxes": [
      {
        "id": "box_67_boost",
        "op": "+",
        "val": 6,
        "badge": "+6",
        "name": "Turbo Pod",
        "x": 280,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "orange"
      },
      {
        "id": "box_67_low",
        "op": "+",
        "val": 2,
        "badge": "+2",
        "name": "Simmer Pod",
        "x": 790,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "cyan"
      },
      {
        "id": "box_67_cond",
        "type": "conditional",
        "op": "conditional",
        "condType": "gt",
        "condVal": 11,
        "badge": "IF > 11",
        "name": "⚡ Logic Gate",
        "x": 480,
        "y": 1000,
        "w": 220,
        "h": 180,
        "theme": "quantum"
      },
      {
        "id": "box_67_mul",
        "op": "*",
        "val": 3,
        "badge": "×3",
        "name": "Booster Sizzle",
        "x": 800,
        "y": 1180,
        "w": 180,
        "h": 160,
        "theme": "gold"
      },
      {
        "id": "box_67_extra",
        "op": "+",
        "val": 3,
        "badge": "+3",
        "name": "Herb Finish",
        "x": 280,
        "y": 1260,
        "w": 180,
        "h": 160,
        "theme": "purple"
      }
    ],
    "winningFormula": "(6 + 6 = 12) [IF > 11 ➔ YES] × 3 = 36  ✔"
  },
  {
    "id": 68,
    "name": "Level 68: White Truffle Cloud",
    "subtitle": "Target: 20",
    "startValue": 3,
    "targetValue": 20,
    "startBox": {
      "x": 250,
      "y": 380,
      "w": 220,
      "h": 220,
      "label": "INGREDIENT DISPENSER"
    },
    "endBox": {
      "x": 830,
      "y": 1540,
      "w": 270,
      "h": 260,
      "label": "RECIPE COMPUTER"
    },
    "boxes": [
      {
        "id": "box_68_boost",
        "op": "+",
        "val": 7,
        "badge": "+7",
        "name": "Turbo Pod",
        "x": 280,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "orange"
      },
      {
        "id": "box_68_low",
        "op": "+",
        "val": 1,
        "badge": "+1",
        "name": "Simmer Pod",
        "x": 790,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "cyan"
      },
      {
        "id": "box_68_cond",
        "type": "conditional",
        "op": "conditional",
        "condType": "gt",
        "condVal": 9,
        "badge": "IF > 9",
        "name": "⚡ Logic Gate",
        "x": 480,
        "y": 1000,
        "w": 220,
        "h": 180,
        "theme": "quantum"
      },
      {
        "id": "box_68_mul",
        "op": "*",
        "val": 2,
        "badge": "×2",
        "name": "Booster Sizzle",
        "x": 800,
        "y": 1180,
        "w": 180,
        "h": 160,
        "theme": "gold"
      },
      {
        "id": "box_68_extra",
        "op": "+",
        "val": 3,
        "badge": "+3",
        "name": "Herb Finish",
        "x": 280,
        "y": 1260,
        "w": 180,
        "h": 160,
        "theme": "purple"
      }
    ],
    "winningFormula": "(3 + 7 = 10) [IF > 9 ➔ YES] × 2 = 20  ✔"
  },
  {
    "id": 69,
    "name": "Level 69: Smoked Sea Salt",
    "subtitle": "Target: 36",
    "startValue": 4,
    "targetValue": 36,
    "startBox": {
      "x": 250,
      "y": 380,
      "w": 220,
      "h": 220,
      "label": "INGREDIENT DISPENSER"
    },
    "endBox": {
      "x": 830,
      "y": 1540,
      "w": 270,
      "h": 260,
      "label": "RECIPE COMPUTER"
    },
    "boxes": [
      {
        "id": "box_69_boost",
        "op": "+",
        "val": 8,
        "badge": "+8",
        "name": "Turbo Pod",
        "x": 280,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "orange"
      },
      {
        "id": "box_69_low",
        "op": "+",
        "val": 2,
        "badge": "+2",
        "name": "Simmer Pod",
        "x": 790,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "cyan"
      },
      {
        "id": "box_69_cond",
        "type": "conditional",
        "op": "conditional",
        "condType": "gt",
        "condVal": 11,
        "badge": "IF > 11",
        "name": "⚡ Logic Gate",
        "x": 480,
        "y": 1000,
        "w": 220,
        "h": 180,
        "theme": "quantum"
      },
      {
        "id": "box_69_mul",
        "op": "*",
        "val": 3,
        "badge": "×3",
        "name": "Booster Sizzle",
        "x": 800,
        "y": 1180,
        "w": 180,
        "h": 160,
        "theme": "gold"
      },
      {
        "id": "box_69_extra",
        "op": "+",
        "val": 3,
        "badge": "+3",
        "name": "Herb Finish",
        "x": 280,
        "y": 1260,
        "w": 180,
        "h": 160,
        "theme": "purple"
      }
    ],
    "winningFormula": "(4 + 8 = 12) [IF > 11 ➔ YES] × 3 = 36  ✔"
  },
  {
    "id": 70,
    "name": "Level 70: Chimichurri Spark",
    "subtitle": "Target: 28",
    "startValue": 5,
    "targetValue": 28,
    "startBox": {
      "x": 250,
      "y": 380,
      "w": 220,
      "h": 220,
      "label": "INGREDIENT DISPENSER"
    },
    "endBox": {
      "x": 830,
      "y": 1540,
      "w": 270,
      "h": 260,
      "label": "RECIPE COMPUTER"
    },
    "boxes": [
      {
        "id": "box_70_boost",
        "op": "+",
        "val": 9,
        "badge": "+9",
        "name": "Turbo Pod",
        "x": 280,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "orange"
      },
      {
        "id": "box_70_low",
        "op": "+",
        "val": 1,
        "badge": "+1",
        "name": "Simmer Pod",
        "x": 790,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "cyan"
      },
      {
        "id": "box_70_cond",
        "type": "conditional",
        "op": "conditional",
        "condType": "gt",
        "condVal": 13,
        "badge": "IF > 13",
        "name": "⚡ Logic Gate",
        "x": 480,
        "y": 1000,
        "w": 220,
        "h": 180,
        "theme": "quantum"
      },
      {
        "id": "box_70_mul",
        "op": "*",
        "val": 2,
        "badge": "×2",
        "name": "Booster Sizzle",
        "x": 800,
        "y": 1180,
        "w": 180,
        "h": 160,
        "theme": "gold"
      },
      {
        "id": "box_70_extra",
        "op": "+",
        "val": 3,
        "badge": "+3",
        "name": "Herb Finish",
        "x": 280,
        "y": 1260,
        "w": 180,
        "h": 160,
        "theme": "purple"
      }
    ],
    "winningFormula": "(5 + 9 = 14) [IF > 13 ➔ YES] × 2 = 28  ✔"
  },
  {
    "id": 71,
    "name": "Level 71: Black Sesame Crisp",
    "subtitle": "Target: 34",
    "startValue": 4,
    "targetValue": 34,
    "startBox": {
      "x": 250,
      "y": 380,
      "w": 220,
      "h": 220,
      "label": "INGREDIENT DISPENSER"
    },
    "endBox": {
      "x": 830,
      "y": 1540,
      "w": 270,
      "h": 260,
      "label": "RECIPE COMPUTER"
    },
    "boxes": [
      {
        "id": "box_71_add1",
        "op": "+",
        "val": 5,
        "badge": "+5",
        "name": "High Sear",
        "x": 280,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "orange"
      },
      {
        "id": "box_71_cond",
        "type": "conditional",
        "op": "conditional",
        "condType": "gt",
        "condVal": 8,
        "badge": "IF > 8",
        "name": "⚡ Logic Gate",
        "x": 480,
        "y": 1000,
        "w": 220,
        "h": 180,
        "theme": "quantum"
      },
      {
        "id": "box_71_mul",
        "op": "*",
        "val": 3,
        "badge": "×3",
        "name": "Flash Multiplier",
        "x": 790,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "gold"
      },
      {
        "id": "box_71_finish",
        "op": "+",
        "val": 7,
        "badge": "+7",
        "name": "Caviar Finish",
        "x": 800,
        "y": 1180,
        "w": 180,
        "h": 160,
        "theme": "cyan"
      },
      {
        "id": "box_71_decoy",
        "op": "+",
        "val": 3,
        "badge": "+3",
        "name": "Decoy Herb",
        "x": 280,
        "y": 1260,
        "w": 180,
        "h": 160,
        "theme": "purple"
      }
    ],
    "winningFormula": "(4 + 5 = 9) [IF > 8 ➔ YES] × 3 + 7 = 34  ✔"
  },
  {
    "id": 72,
    "name": "Level 72: Saffron Paella Flame",
    "subtitle": "Target: 24",
    "startValue": 5,
    "targetValue": 24,
    "startBox": {
      "x": 250,
      "y": 380,
      "w": 220,
      "h": 220,
      "label": "INGREDIENT DISPENSER"
    },
    "endBox": {
      "x": 830,
      "y": 1540,
      "w": 270,
      "h": 260,
      "label": "RECIPE COMPUTER"
    },
    "boxes": [
      {
        "id": "box_72_add1",
        "op": "+",
        "val": 6,
        "badge": "+6",
        "name": "High Sear",
        "x": 280,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "orange"
      },
      {
        "id": "box_72_cond",
        "type": "conditional",
        "op": "conditional",
        "condType": "gt",
        "condVal": 10,
        "badge": "IF > 10",
        "name": "⚡ Logic Gate",
        "x": 480,
        "y": 1000,
        "w": 220,
        "h": 180,
        "theme": "quantum"
      },
      {
        "id": "box_72_mul",
        "op": "*",
        "val": 2,
        "badge": "×2",
        "name": "Flash Multiplier",
        "x": 790,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "gold"
      },
      {
        "id": "box_72_finish",
        "op": "+",
        "val": 2,
        "badge": "+2",
        "name": "Caviar Finish",
        "x": 800,
        "y": 1180,
        "w": 180,
        "h": 160,
        "theme": "cyan"
      },
      {
        "id": "box_72_decoy",
        "op": "+",
        "val": 4,
        "badge": "+4",
        "name": "Decoy Herb",
        "x": 280,
        "y": 1260,
        "w": 180,
        "h": 160,
        "theme": "purple"
      }
    ],
    "winningFormula": "(5 + 6 = 11) [IF > 10 ➔ YES] × 2 + 2 = 24  ✔"
  },
  {
    "id": 73,
    "name": "Level 73: Ghost Pepper Surge",
    "subtitle": "Target: 55",
    "startValue": 6,
    "targetValue": 55,
    "startBox": {
      "x": 250,
      "y": 380,
      "w": 220,
      "h": 220,
      "label": "INGREDIENT DISPENSER"
    },
    "endBox": {
      "x": 830,
      "y": 1540,
      "w": 270,
      "h": 260,
      "label": "RECIPE COMPUTER"
    },
    "boxes": [
      {
        "id": "box_73_add1",
        "op": "+",
        "val": 7,
        "badge": "+7",
        "name": "High Sear",
        "x": 280,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "orange"
      },
      {
        "id": "box_73_cond",
        "type": "conditional",
        "op": "conditional",
        "condType": "gt",
        "condVal": 12,
        "badge": "IF > 12",
        "name": "⚡ Logic Gate",
        "x": 480,
        "y": 1000,
        "w": 220,
        "h": 180,
        "theme": "quantum"
      },
      {
        "id": "box_73_mul",
        "op": "*",
        "val": 4,
        "badge": "×4",
        "name": "Flash Multiplier",
        "x": 790,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "gold"
      },
      {
        "id": "box_73_finish",
        "op": "+",
        "val": 3,
        "badge": "+3",
        "name": "Caviar Finish",
        "x": 800,
        "y": 1180,
        "w": 180,
        "h": 160,
        "theme": "cyan"
      },
      {
        "id": "box_73_decoy",
        "op": "+",
        "val": 5,
        "badge": "+5",
        "name": "Decoy Herb",
        "x": 280,
        "y": 1260,
        "w": 180,
        "h": 160,
        "theme": "purple"
      }
    ],
    "winningFormula": "(6 + 7 = 13) [IF > 12 ➔ YES] × 4 + 3 = 55  ✔"
  },
  {
    "id": 74,
    "name": "Level 74: Guajillo Chili Net",
    "subtitle": "Target: 49",
    "startValue": 7,
    "targetValue": 49,
    "startBox": {
      "x": 250,
      "y": 380,
      "w": 220,
      "h": 220,
      "label": "INGREDIENT DISPENSER"
    },
    "endBox": {
      "x": 830,
      "y": 1540,
      "w": 270,
      "h": 260,
      "label": "RECIPE COMPUTER"
    },
    "boxes": [
      {
        "id": "box_74_add1",
        "op": "+",
        "val": 8,
        "badge": "+8",
        "name": "High Sear",
        "x": 280,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "orange"
      },
      {
        "id": "box_74_cond",
        "type": "conditional",
        "op": "conditional",
        "condType": "gt",
        "condVal": 14,
        "badge": "IF > 14",
        "name": "⚡ Logic Gate",
        "x": 480,
        "y": 1000,
        "w": 220,
        "h": 180,
        "theme": "quantum"
      },
      {
        "id": "box_74_mul",
        "op": "*",
        "val": 3,
        "badge": "×3",
        "name": "Flash Multiplier",
        "x": 790,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "gold"
      },
      {
        "id": "box_74_finish",
        "op": "+",
        "val": 4,
        "badge": "+4",
        "name": "Caviar Finish",
        "x": 800,
        "y": 1180,
        "w": 180,
        "h": 160,
        "theme": "cyan"
      },
      {
        "id": "box_74_decoy",
        "op": "+",
        "val": 6,
        "badge": "+6",
        "name": "Decoy Herb",
        "x": 280,
        "y": 1260,
        "w": 180,
        "h": 160,
        "theme": "purple"
      }
    ],
    "winningFormula": "(7 + 8 = 15) [IF > 14 ➔ YES] × 3 + 4 = 49  ✔"
  },
  {
    "id": 75,
    "name": "Level 75: Tamarind Glaze Flow",
    "subtitle": "Target: 19",
    "startValue": 3,
    "targetValue": 19,
    "startBox": {
      "x": 250,
      "y": 380,
      "w": 220,
      "h": 220,
      "label": "INGREDIENT DISPENSER"
    },
    "endBox": {
      "x": 830,
      "y": 1540,
      "w": 270,
      "h": 260,
      "label": "RECIPE COMPUTER"
    },
    "boxes": [
      {
        "id": "box_75_add1",
        "op": "+",
        "val": 4,
        "badge": "+4",
        "name": "High Sear",
        "x": 280,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "orange"
      },
      {
        "id": "box_75_cond",
        "type": "conditional",
        "op": "conditional",
        "condType": "gt",
        "condVal": 6,
        "badge": "IF > 6",
        "name": "⚡ Logic Gate",
        "x": 480,
        "y": 1000,
        "w": 220,
        "h": 180,
        "theme": "quantum"
      },
      {
        "id": "box_75_mul",
        "op": "*",
        "val": 2,
        "badge": "×2",
        "name": "Flash Multiplier",
        "x": 790,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "gold"
      },
      {
        "id": "box_75_finish",
        "op": "+",
        "val": 5,
        "badge": "+5",
        "name": "Caviar Finish",
        "x": 800,
        "y": 1180,
        "w": 180,
        "h": 160,
        "theme": "cyan"
      },
      {
        "id": "box_75_decoy",
        "op": "+",
        "val": 2,
        "badge": "+2",
        "name": "Decoy Herb",
        "x": 280,
        "y": 1260,
        "w": 180,
        "h": 160,
        "theme": "purple"
      }
    ],
    "winningFormula": "(3 + 4 = 7) [IF > 6 ➔ YES] × 2 + 5 = 19  ✔"
  },
  {
    "id": 76,
    "name": "Level 76: Habanero Honey Glaze",
    "subtitle": "Target: 42",
    "startValue": 4,
    "targetValue": 42,
    "startBox": {
      "x": 250,
      "y": 380,
      "w": 220,
      "h": 220,
      "label": "INGREDIENT DISPENSER"
    },
    "endBox": {
      "x": 830,
      "y": 1540,
      "w": 270,
      "h": 260,
      "label": "RECIPE COMPUTER"
    },
    "boxes": [
      {
        "id": "box_76_add1",
        "op": "+",
        "val": 5,
        "badge": "+5",
        "name": "High Sear",
        "x": 280,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "orange"
      },
      {
        "id": "box_76_cond",
        "type": "conditional",
        "op": "conditional",
        "condType": "gt",
        "condVal": 8,
        "badge": "IF > 8",
        "name": "⚡ Logic Gate",
        "x": 480,
        "y": 1000,
        "w": 220,
        "h": 180,
        "theme": "quantum"
      },
      {
        "id": "box_76_mul",
        "op": "*",
        "val": 4,
        "badge": "×4",
        "name": "Flash Multiplier",
        "x": 790,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "gold"
      },
      {
        "id": "box_76_finish",
        "op": "+",
        "val": 6,
        "badge": "+6",
        "name": "Caviar Finish",
        "x": 800,
        "y": 1180,
        "w": 180,
        "h": 160,
        "theme": "cyan"
      },
      {
        "id": "box_76_decoy",
        "op": "+",
        "val": 3,
        "badge": "+3",
        "name": "Decoy Herb",
        "x": 280,
        "y": 1260,
        "w": 180,
        "h": 160,
        "theme": "purple"
      }
    ],
    "winningFormula": "(4 + 5 = 9) [IF > 8 ➔ YES] × 4 + 6 = 42  ✔"
  },
  {
    "id": 77,
    "name": "Level 77: Smoked Applewood Crisp",
    "subtitle": "Target: 40",
    "startValue": 5,
    "targetValue": 40,
    "startBox": {
      "x": 250,
      "y": 380,
      "w": 220,
      "h": 220,
      "label": "INGREDIENT DISPENSER"
    },
    "endBox": {
      "x": 830,
      "y": 1540,
      "w": 270,
      "h": 260,
      "label": "RECIPE COMPUTER"
    },
    "boxes": [
      {
        "id": "box_77_add1",
        "op": "+",
        "val": 6,
        "badge": "+6",
        "name": "High Sear",
        "x": 280,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "orange"
      },
      {
        "id": "box_77_cond",
        "type": "conditional",
        "op": "conditional",
        "condType": "gt",
        "condVal": 10,
        "badge": "IF > 10",
        "name": "⚡ Logic Gate",
        "x": 480,
        "y": 1000,
        "w": 220,
        "h": 180,
        "theme": "quantum"
      },
      {
        "id": "box_77_mul",
        "op": "*",
        "val": 3,
        "badge": "×3",
        "name": "Flash Multiplier",
        "x": 790,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "gold"
      },
      {
        "id": "box_77_finish",
        "op": "+",
        "val": 7,
        "badge": "+7",
        "name": "Caviar Finish",
        "x": 800,
        "y": 1180,
        "w": 180,
        "h": 160,
        "theme": "cyan"
      },
      {
        "id": "box_77_decoy",
        "op": "+",
        "val": 4,
        "badge": "+4",
        "name": "Decoy Herb",
        "x": 280,
        "y": 1260,
        "w": 180,
        "h": 160,
        "theme": "purple"
      }
    ],
    "winningFormula": "(5 + 6 = 11) [IF > 10 ➔ YES] × 3 + 7 = 40  ✔"
  },
  {
    "id": 78,
    "name": "Level 78: Caramelized Onion Jam",
    "subtitle": "Target: 28",
    "startValue": 6,
    "targetValue": 28,
    "startBox": {
      "x": 250,
      "y": 380,
      "w": 220,
      "h": 220,
      "label": "INGREDIENT DISPENSER"
    },
    "endBox": {
      "x": 830,
      "y": 1540,
      "w": 270,
      "h": 260,
      "label": "RECIPE COMPUTER"
    },
    "boxes": [
      {
        "id": "box_78_add1",
        "op": "+",
        "val": 7,
        "badge": "+7",
        "name": "High Sear",
        "x": 280,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "orange"
      },
      {
        "id": "box_78_cond",
        "type": "conditional",
        "op": "conditional",
        "condType": "gt",
        "condVal": 12,
        "badge": "IF > 12",
        "name": "⚡ Logic Gate",
        "x": 480,
        "y": 1000,
        "w": 220,
        "h": 180,
        "theme": "quantum"
      },
      {
        "id": "box_78_mul",
        "op": "*",
        "val": 2,
        "badge": "×2",
        "name": "Flash Multiplier",
        "x": 790,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "gold"
      },
      {
        "id": "box_78_finish",
        "op": "+",
        "val": 2,
        "badge": "+2",
        "name": "Caviar Finish",
        "x": 800,
        "y": 1180,
        "w": 180,
        "h": 160,
        "theme": "cyan"
      },
      {
        "id": "box_78_decoy",
        "op": "+",
        "val": 5,
        "badge": "+5",
        "name": "Decoy Herb",
        "x": 280,
        "y": 1260,
        "w": 180,
        "h": 160,
        "theme": "purple"
      }
    ],
    "winningFormula": "(6 + 7 = 13) [IF > 12 ➔ YES] × 2 + 2 = 28  ✔"
  },
  {
    "id": 79,
    "name": "Level 79: Shiitake Glaze Gate",
    "subtitle": "Target: 63",
    "startValue": 7,
    "targetValue": 63,
    "startBox": {
      "x": 250,
      "y": 380,
      "w": 220,
      "h": 220,
      "label": "INGREDIENT DISPENSER"
    },
    "endBox": {
      "x": 830,
      "y": 1540,
      "w": 270,
      "h": 260,
      "label": "RECIPE COMPUTER"
    },
    "boxes": [
      {
        "id": "box_79_add1",
        "op": "+",
        "val": 8,
        "badge": "+8",
        "name": "High Sear",
        "x": 280,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "orange"
      },
      {
        "id": "box_79_cond",
        "type": "conditional",
        "op": "conditional",
        "condType": "gt",
        "condVal": 14,
        "badge": "IF > 14",
        "name": "⚡ Logic Gate",
        "x": 480,
        "y": 1000,
        "w": 220,
        "h": 180,
        "theme": "quantum"
      },
      {
        "id": "box_79_mul",
        "op": "*",
        "val": 4,
        "badge": "×4",
        "name": "Flash Multiplier",
        "x": 790,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "gold"
      },
      {
        "id": "box_79_finish",
        "op": "+",
        "val": 3,
        "badge": "+3",
        "name": "Caviar Finish",
        "x": 800,
        "y": 1180,
        "w": 180,
        "h": 160,
        "theme": "cyan"
      },
      {
        "id": "box_79_decoy",
        "op": "+",
        "val": 6,
        "badge": "+6",
        "name": "Decoy Herb",
        "x": 280,
        "y": 1260,
        "w": 180,
        "h": 160,
        "theme": "purple"
      }
    ],
    "winningFormula": "(7 + 8 = 15) [IF > 14 ➔ YES] × 4 + 3 = 63  ✔"
  },
  {
    "id": 80,
    "name": "Level 80: Ginger Mirin Glaze",
    "subtitle": "Target: 25",
    "startValue": 3,
    "targetValue": 25,
    "startBox": {
      "x": 250,
      "y": 380,
      "w": 220,
      "h": 220,
      "label": "INGREDIENT DISPENSER"
    },
    "endBox": {
      "x": 830,
      "y": 1540,
      "w": 270,
      "h": 260,
      "label": "RECIPE COMPUTER"
    },
    "boxes": [
      {
        "id": "box_80_add1",
        "op": "+",
        "val": 4,
        "badge": "+4",
        "name": "High Sear",
        "x": 280,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "orange"
      },
      {
        "id": "box_80_cond",
        "type": "conditional",
        "op": "conditional",
        "condType": "gt",
        "condVal": 6,
        "badge": "IF > 6",
        "name": "⚡ Logic Gate",
        "x": 480,
        "y": 1000,
        "w": 220,
        "h": 180,
        "theme": "quantum"
      },
      {
        "id": "box_80_mul",
        "op": "*",
        "val": 3,
        "badge": "×3",
        "name": "Flash Multiplier",
        "x": 790,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "gold"
      },
      {
        "id": "box_80_finish",
        "op": "+",
        "val": 4,
        "badge": "+4",
        "name": "Caviar Finish",
        "x": 800,
        "y": 1180,
        "w": 180,
        "h": 160,
        "theme": "cyan"
      },
      {
        "id": "box_80_decoy",
        "op": "+",
        "val": 2,
        "badge": "+2",
        "name": "Decoy Herb",
        "x": 280,
        "y": 1260,
        "w": 180,
        "h": 160,
        "theme": "purple"
      }
    ],
    "winningFormula": "(3 + 4 = 7) [IF > 6 ➔ YES] × 3 + 4 = 25  ✔"
  },
  {
    "id": 81,
    "name": "Level 81: Thai Basil Surge",
    "subtitle": "Target: 23",
    "startValue": 4,
    "targetValue": 23,
    "startBox": {
      "x": 250,
      "y": 380,
      "w": 220,
      "h": 220,
      "label": "INGREDIENT DISPENSER"
    },
    "endBox": {
      "x": 830,
      "y": 1540,
      "w": 270,
      "h": 260,
      "label": "RECIPE COMPUTER"
    },
    "boxes": [
      {
        "id": "box_81_add1",
        "op": "+",
        "val": 5,
        "badge": "+5",
        "name": "High Sear",
        "x": 280,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "orange"
      },
      {
        "id": "box_81_cond",
        "type": "conditional",
        "op": "conditional",
        "condType": "gt",
        "condVal": 8,
        "badge": "IF > 8",
        "name": "⚡ Logic Gate",
        "x": 480,
        "y": 1000,
        "w": 220,
        "h": 180,
        "theme": "quantum"
      },
      {
        "id": "box_81_mul",
        "op": "*",
        "val": 2,
        "badge": "×2",
        "name": "Flash Multiplier",
        "x": 790,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "gold"
      },
      {
        "id": "box_81_finish",
        "op": "+",
        "val": 5,
        "badge": "+5",
        "name": "Caviar Finish",
        "x": 800,
        "y": 1180,
        "w": 180,
        "h": 160,
        "theme": "cyan"
      },
      {
        "id": "box_81_decoy",
        "op": "+",
        "val": 3,
        "badge": "+3",
        "name": "Decoy Herb",
        "x": 280,
        "y": 1260,
        "w": 180,
        "h": 160,
        "theme": "purple"
      }
    ],
    "winningFormula": "(4 + 5 = 9) [IF > 8 ➔ YES] × 2 + 5 = 23  ✔"
  },
  {
    "id": 82,
    "name": "Level 82: Avocado Cilantro Lime",
    "subtitle": "Target: 50",
    "startValue": 5,
    "targetValue": 50,
    "startBox": {
      "x": 250,
      "y": 380,
      "w": 220,
      "h": 220,
      "label": "INGREDIENT DISPENSER"
    },
    "endBox": {
      "x": 830,
      "y": 1540,
      "w": 270,
      "h": 260,
      "label": "RECIPE COMPUTER"
    },
    "boxes": [
      {
        "id": "box_82_add1",
        "op": "+",
        "val": 6,
        "badge": "+6",
        "name": "High Sear",
        "x": 280,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "orange"
      },
      {
        "id": "box_82_cond",
        "type": "conditional",
        "op": "conditional",
        "condType": "gt",
        "condVal": 10,
        "badge": "IF > 10",
        "name": "⚡ Logic Gate",
        "x": 480,
        "y": 1000,
        "w": 220,
        "h": 180,
        "theme": "quantum"
      },
      {
        "id": "box_82_mul",
        "op": "*",
        "val": 4,
        "badge": "×4",
        "name": "Flash Multiplier",
        "x": 790,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "gold"
      },
      {
        "id": "box_82_finish",
        "op": "+",
        "val": 6,
        "badge": "+6",
        "name": "Caviar Finish",
        "x": 800,
        "y": 1180,
        "w": 180,
        "h": 160,
        "theme": "cyan"
      },
      {
        "id": "box_82_decoy",
        "op": "+",
        "val": 4,
        "badge": "+4",
        "name": "Decoy Herb",
        "x": 280,
        "y": 1260,
        "w": 180,
        "h": 160,
        "theme": "purple"
      }
    ],
    "winningFormula": "(5 + 6 = 11) [IF > 10 ➔ YES] × 4 + 6 = 50  ✔"
  },
  {
    "id": 83,
    "name": "Level 83: Roasted Shallot Puree",
    "subtitle": "Target: 46",
    "startValue": 6,
    "targetValue": 46,
    "startBox": {
      "x": 250,
      "y": 380,
      "w": 220,
      "h": 220,
      "label": "INGREDIENT DISPENSER"
    },
    "endBox": {
      "x": 830,
      "y": 1540,
      "w": 270,
      "h": 260,
      "label": "RECIPE COMPUTER"
    },
    "boxes": [
      {
        "id": "box_83_add1",
        "op": "+",
        "val": 7,
        "badge": "+7",
        "name": "High Sear",
        "x": 280,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "orange"
      },
      {
        "id": "box_83_cond",
        "type": "conditional",
        "op": "conditional",
        "condType": "gt",
        "condVal": 12,
        "badge": "IF > 12",
        "name": "⚡ Logic Gate",
        "x": 480,
        "y": 1000,
        "w": 220,
        "h": 180,
        "theme": "quantum"
      },
      {
        "id": "box_83_mul",
        "op": "*",
        "val": 3,
        "badge": "×3",
        "name": "Flash Multiplier",
        "x": 790,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "gold"
      },
      {
        "id": "box_83_finish",
        "op": "+",
        "val": 7,
        "badge": "+7",
        "name": "Caviar Finish",
        "x": 800,
        "y": 1180,
        "w": 180,
        "h": 160,
        "theme": "cyan"
      },
      {
        "id": "box_83_decoy",
        "op": "+",
        "val": 5,
        "badge": "+5",
        "name": "Decoy Herb",
        "x": 280,
        "y": 1260,
        "w": 180,
        "h": 160,
        "theme": "purple"
      }
    ],
    "winningFormula": "(6 + 7 = 13) [IF > 12 ➔ YES] × 3 + 7 = 46  ✔"
  },
  {
    "id": 84,
    "name": "Level 84: Hoisin Plum Matrix",
    "subtitle": "Target: 32",
    "startValue": 7,
    "targetValue": 32,
    "startBox": {
      "x": 250,
      "y": 380,
      "w": 220,
      "h": 220,
      "label": "INGREDIENT DISPENSER"
    },
    "endBox": {
      "x": 830,
      "y": 1540,
      "w": 270,
      "h": 260,
      "label": "RECIPE COMPUTER"
    },
    "boxes": [
      {
        "id": "box_84_add1",
        "op": "+",
        "val": 8,
        "badge": "+8",
        "name": "High Sear",
        "x": 280,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "orange"
      },
      {
        "id": "box_84_cond",
        "type": "conditional",
        "op": "conditional",
        "condType": "gt",
        "condVal": 14,
        "badge": "IF > 14",
        "name": "⚡ Logic Gate",
        "x": 480,
        "y": 1000,
        "w": 220,
        "h": 180,
        "theme": "quantum"
      },
      {
        "id": "box_84_mul",
        "op": "*",
        "val": 2,
        "badge": "×2",
        "name": "Flash Multiplier",
        "x": 790,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "gold"
      },
      {
        "id": "box_84_finish",
        "op": "+",
        "val": 2,
        "badge": "+2",
        "name": "Caviar Finish",
        "x": 800,
        "y": 1180,
        "w": 180,
        "h": 160,
        "theme": "cyan"
      },
      {
        "id": "box_84_decoy",
        "op": "+",
        "val": 6,
        "badge": "+6",
        "name": "Decoy Herb",
        "x": 280,
        "y": 1260,
        "w": 180,
        "h": 160,
        "theme": "purple"
      }
    ],
    "winningFormula": "(7 + 8 = 15) [IF > 14 ➔ YES] × 2 + 2 = 32  ✔"
  },
  {
    "id": 85,
    "name": "Level 85: Ancho Chili Smolder",
    "subtitle": "Target: 31",
    "startValue": 3,
    "targetValue": 31,
    "startBox": {
      "x": 250,
      "y": 380,
      "w": 220,
      "h": 220,
      "label": "INGREDIENT DISPENSER"
    },
    "endBox": {
      "x": 830,
      "y": 1540,
      "w": 270,
      "h": 260,
      "label": "RECIPE COMPUTER"
    },
    "boxes": [
      {
        "id": "box_85_add1",
        "op": "+",
        "val": 4,
        "badge": "+4",
        "name": "High Sear",
        "x": 280,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "orange"
      },
      {
        "id": "box_85_cond",
        "type": "conditional",
        "op": "conditional",
        "condType": "gt",
        "condVal": 6,
        "badge": "IF > 6",
        "name": "⚡ Logic Gate",
        "x": 480,
        "y": 1000,
        "w": 220,
        "h": 180,
        "theme": "quantum"
      },
      {
        "id": "box_85_mul",
        "op": "*",
        "val": 4,
        "badge": "×4",
        "name": "Flash Multiplier",
        "x": 790,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "gold"
      },
      {
        "id": "box_85_finish",
        "op": "+",
        "val": 3,
        "badge": "+3",
        "name": "Caviar Finish",
        "x": 800,
        "y": 1180,
        "w": 180,
        "h": 160,
        "theme": "cyan"
      },
      {
        "id": "box_85_decoy",
        "op": "+",
        "val": 2,
        "badge": "+2",
        "name": "Decoy Herb",
        "x": 280,
        "y": 1260,
        "w": 180,
        "h": 160,
        "theme": "purple"
      }
    ],
    "winningFormula": "(3 + 4 = 7) [IF > 6 ➔ YES] × 4 + 3 = 31  ✔"
  },
  {
    "id": 86,
    "name": "Level 86: Cayenne Flash Sear",
    "subtitle": "Target: 31",
    "startValue": 4,
    "targetValue": 31,
    "startBox": {
      "x": 250,
      "y": 380,
      "w": 220,
      "h": 220,
      "label": "INGREDIENT DISPENSER"
    },
    "endBox": {
      "x": 830,
      "y": 1540,
      "w": 270,
      "h": 260,
      "label": "RECIPE COMPUTER"
    },
    "boxes": [
      {
        "id": "box_86_add1",
        "op": "+",
        "val": 5,
        "badge": "+5",
        "name": "High Sear",
        "x": 280,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "orange"
      },
      {
        "id": "box_86_cond",
        "type": "conditional",
        "op": "conditional",
        "condType": "gt",
        "condVal": 8,
        "badge": "IF > 8",
        "name": "⚡ Logic Gate",
        "x": 480,
        "y": 1000,
        "w": 220,
        "h": 180,
        "theme": "quantum"
      },
      {
        "id": "box_86_mul",
        "op": "*",
        "val": 3,
        "badge": "×3",
        "name": "Flash Multiplier",
        "x": 790,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "gold"
      },
      {
        "id": "box_86_finish",
        "op": "+",
        "val": 4,
        "badge": "+4",
        "name": "Caviar Finish",
        "x": 800,
        "y": 1180,
        "w": 180,
        "h": 160,
        "theme": "cyan"
      },
      {
        "id": "box_86_decoy",
        "op": "+",
        "val": 3,
        "badge": "+3",
        "name": "Decoy Herb",
        "x": 280,
        "y": 1260,
        "w": 180,
        "h": 160,
        "theme": "purple"
      }
    ],
    "winningFormula": "(4 + 5 = 9) [IF > 8 ➔ YES] × 3 + 4 = 31  ✔"
  },
  {
    "id": 87,
    "name": "Level 87: Szechuan Chili Oil",
    "subtitle": "Target: 27",
    "startValue": 5,
    "targetValue": 27,
    "startBox": {
      "x": 250,
      "y": 380,
      "w": 220,
      "h": 220,
      "label": "INGREDIENT DISPENSER"
    },
    "endBox": {
      "x": 830,
      "y": 1540,
      "w": 270,
      "h": 260,
      "label": "RECIPE COMPUTER"
    },
    "boxes": [
      {
        "id": "box_87_add1",
        "op": "+",
        "val": 6,
        "badge": "+6",
        "name": "High Sear",
        "x": 280,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "orange"
      },
      {
        "id": "box_87_cond",
        "type": "conditional",
        "op": "conditional",
        "condType": "gt",
        "condVal": 10,
        "badge": "IF > 10",
        "name": "⚡ Logic Gate",
        "x": 480,
        "y": 1000,
        "w": 220,
        "h": 180,
        "theme": "quantum"
      },
      {
        "id": "box_87_mul",
        "op": "*",
        "val": 2,
        "badge": "×2",
        "name": "Flash Multiplier",
        "x": 790,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "gold"
      },
      {
        "id": "box_87_finish",
        "op": "+",
        "val": 5,
        "badge": "+5",
        "name": "Caviar Finish",
        "x": 800,
        "y": 1180,
        "w": 180,
        "h": 160,
        "theme": "cyan"
      },
      {
        "id": "box_87_decoy",
        "op": "+",
        "val": 4,
        "badge": "+4",
        "name": "Decoy Herb",
        "x": 280,
        "y": 1260,
        "w": 180,
        "h": 160,
        "theme": "purple"
      }
    ],
    "winningFormula": "(5 + 6 = 11) [IF > 10 ➔ YES] × 2 + 5 = 27  ✔"
  },
  {
    "id": 88,
    "name": "Level 88: Black Peppercorn Crust",
    "subtitle": "Target: 58",
    "startValue": 6,
    "targetValue": 58,
    "startBox": {
      "x": 250,
      "y": 380,
      "w": 220,
      "h": 220,
      "label": "INGREDIENT DISPENSER"
    },
    "endBox": {
      "x": 830,
      "y": 1540,
      "w": 270,
      "h": 260,
      "label": "RECIPE COMPUTER"
    },
    "boxes": [
      {
        "id": "box_88_add1",
        "op": "+",
        "val": 7,
        "badge": "+7",
        "name": "High Sear",
        "x": 280,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "orange"
      },
      {
        "id": "box_88_cond",
        "type": "conditional",
        "op": "conditional",
        "condType": "gt",
        "condVal": 12,
        "badge": "IF > 12",
        "name": "⚡ Logic Gate",
        "x": 480,
        "y": 1000,
        "w": 220,
        "h": 180,
        "theme": "quantum"
      },
      {
        "id": "box_88_mul",
        "op": "*",
        "val": 4,
        "badge": "×4",
        "name": "Flash Multiplier",
        "x": 790,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "gold"
      },
      {
        "id": "box_88_finish",
        "op": "+",
        "val": 6,
        "badge": "+6",
        "name": "Caviar Finish",
        "x": 800,
        "y": 1180,
        "w": 180,
        "h": 160,
        "theme": "cyan"
      },
      {
        "id": "box_88_decoy",
        "op": "+",
        "val": 5,
        "badge": "+5",
        "name": "Decoy Herb",
        "x": 280,
        "y": 1260,
        "w": 180,
        "h": 160,
        "theme": "purple"
      }
    ],
    "winningFormula": "(6 + 7 = 13) [IF > 12 ➔ YES] × 4 + 6 = 58  ✔"
  },
  {
    "id": 89,
    "name": "Level 89: Balsamic Fig Reduction",
    "subtitle": "Target: 52",
    "startValue": 7,
    "targetValue": 52,
    "startBox": {
      "x": 250,
      "y": 380,
      "w": 220,
      "h": 220,
      "label": "INGREDIENT DISPENSER"
    },
    "endBox": {
      "x": 830,
      "y": 1540,
      "w": 270,
      "h": 260,
      "label": "RECIPE COMPUTER"
    },
    "boxes": [
      {
        "id": "box_89_add1",
        "op": "+",
        "val": 8,
        "badge": "+8",
        "name": "High Sear",
        "x": 280,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "orange"
      },
      {
        "id": "box_89_cond",
        "type": "conditional",
        "op": "conditional",
        "condType": "gt",
        "condVal": 14,
        "badge": "IF > 14",
        "name": "⚡ Logic Gate",
        "x": 480,
        "y": 1000,
        "w": 220,
        "h": 180,
        "theme": "quantum"
      },
      {
        "id": "box_89_mul",
        "op": "*",
        "val": 3,
        "badge": "×3",
        "name": "Flash Multiplier",
        "x": 790,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "gold"
      },
      {
        "id": "box_89_finish",
        "op": "+",
        "val": 7,
        "badge": "+7",
        "name": "Caviar Finish",
        "x": 800,
        "y": 1180,
        "w": 180,
        "h": 160,
        "theme": "cyan"
      },
      {
        "id": "box_89_decoy",
        "op": "+",
        "val": 6,
        "badge": "+6",
        "name": "Decoy Herb",
        "x": 280,
        "y": 1260,
        "w": 180,
        "h": 160,
        "theme": "purple"
      }
    ],
    "winningFormula": "(7 + 8 = 15) [IF > 14 ➔ YES] × 3 + 7 = 52  ✔"
  },
  {
    "id": 90,
    "name": "Level 90: Wasabi Soy Glaze",
    "subtitle": "Target: 16",
    "startValue": 3,
    "targetValue": 16,
    "startBox": {
      "x": 250,
      "y": 380,
      "w": 220,
      "h": 220,
      "label": "INGREDIENT DISPENSER"
    },
    "endBox": {
      "x": 830,
      "y": 1540,
      "w": 270,
      "h": 260,
      "label": "RECIPE COMPUTER"
    },
    "boxes": [
      {
        "id": "box_90_add1",
        "op": "+",
        "val": 4,
        "badge": "+4",
        "name": "High Sear",
        "x": 280,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "orange"
      },
      {
        "id": "box_90_cond",
        "type": "conditional",
        "op": "conditional",
        "condType": "gt",
        "condVal": 6,
        "badge": "IF > 6",
        "name": "⚡ Logic Gate",
        "x": 480,
        "y": 1000,
        "w": 220,
        "h": 180,
        "theme": "quantum"
      },
      {
        "id": "box_90_mul",
        "op": "*",
        "val": 2,
        "badge": "×2",
        "name": "Flash Multiplier",
        "x": 790,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "gold"
      },
      {
        "id": "box_90_finish",
        "op": "+",
        "val": 2,
        "badge": "+2",
        "name": "Caviar Finish",
        "x": 800,
        "y": 1180,
        "w": 180,
        "h": 160,
        "theme": "cyan"
      },
      {
        "id": "box_90_decoy",
        "op": "+",
        "val": 2,
        "badge": "+2",
        "name": "Decoy Herb",
        "x": 280,
        "y": 1260,
        "w": 180,
        "h": 160,
        "theme": "purple"
      }
    ],
    "winningFormula": "(3 + 4 = 7) [IF > 6 ➔ YES] × 2 + 2 = 16  ✔"
  },
  {
    "id": 91,
    "name": "Level 91: Smoked Provolone Torch",
    "subtitle": "Target: 39",
    "startValue": 4,
    "targetValue": 39,
    "startBox": {
      "x": 250,
      "y": 380,
      "w": 220,
      "h": 220,
      "label": "INGREDIENT DISPENSER"
    },
    "endBox": {
      "x": 830,
      "y": 1540,
      "w": 270,
      "h": 260,
      "label": "RECIPE COMPUTER"
    },
    "boxes": [
      {
        "id": "box_91_add1",
        "op": "+",
        "val": 5,
        "badge": "+5",
        "name": "High Sear",
        "x": 280,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "orange"
      },
      {
        "id": "box_91_cond",
        "type": "conditional",
        "op": "conditional",
        "condType": "gt",
        "condVal": 8,
        "badge": "IF > 8",
        "name": "⚡ Logic Gate",
        "x": 480,
        "y": 1000,
        "w": 220,
        "h": 180,
        "theme": "quantum"
      },
      {
        "id": "box_91_mul",
        "op": "*",
        "val": 4,
        "badge": "×4",
        "name": "Flash Multiplier",
        "x": 790,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "gold"
      },
      {
        "id": "box_91_finish",
        "op": "+",
        "val": 3,
        "badge": "+3",
        "name": "Caviar Finish",
        "x": 800,
        "y": 1180,
        "w": 180,
        "h": 160,
        "theme": "cyan"
      },
      {
        "id": "box_91_decoy",
        "op": "+",
        "val": 3,
        "badge": "+3",
        "name": "Decoy Herb",
        "x": 280,
        "y": 1260,
        "w": 180,
        "h": 160,
        "theme": "purple"
      }
    ],
    "winningFormula": "(4 + 5 = 9) [IF > 8 ➔ YES] × 4 + 3 = 39  ✔"
  },
  {
    "id": 92,
    "name": "Level 92: Truffle Herb Butter",
    "subtitle": "Target: 37",
    "startValue": 5,
    "targetValue": 37,
    "startBox": {
      "x": 250,
      "y": 380,
      "w": 220,
      "h": 220,
      "label": "INGREDIENT DISPENSER"
    },
    "endBox": {
      "x": 830,
      "y": 1540,
      "w": 270,
      "h": 260,
      "label": "RECIPE COMPUTER"
    },
    "boxes": [
      {
        "id": "box_92_add1",
        "op": "+",
        "val": 6,
        "badge": "+6",
        "name": "High Sear",
        "x": 280,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "orange"
      },
      {
        "id": "box_92_cond",
        "type": "conditional",
        "op": "conditional",
        "condType": "gt",
        "condVal": 10,
        "badge": "IF > 10",
        "name": "⚡ Logic Gate",
        "x": 480,
        "y": 1000,
        "w": 220,
        "h": 180,
        "theme": "quantum"
      },
      {
        "id": "box_92_mul",
        "op": "*",
        "val": 3,
        "badge": "×3",
        "name": "Flash Multiplier",
        "x": 790,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "gold"
      },
      {
        "id": "box_92_finish",
        "op": "+",
        "val": 4,
        "badge": "+4",
        "name": "Caviar Finish",
        "x": 800,
        "y": 1180,
        "w": 180,
        "h": 160,
        "theme": "cyan"
      },
      {
        "id": "box_92_decoy",
        "op": "+",
        "val": 4,
        "badge": "+4",
        "name": "Decoy Herb",
        "x": 280,
        "y": 1260,
        "w": 180,
        "h": 160,
        "theme": "purple"
      }
    ],
    "winningFormula": "(5 + 6 = 11) [IF > 10 ➔ YES] × 3 + 4 = 37  ✔"
  },
  {
    "id": 93,
    "name": "Level 93: Bourbon Maple Smoke",
    "subtitle": "Target: 31",
    "startValue": 6,
    "targetValue": 31,
    "startBox": {
      "x": 250,
      "y": 380,
      "w": 220,
      "h": 220,
      "label": "INGREDIENT DISPENSER"
    },
    "endBox": {
      "x": 830,
      "y": 1540,
      "w": 270,
      "h": 260,
      "label": "RECIPE COMPUTER"
    },
    "boxes": [
      {
        "id": "box_93_add1",
        "op": "+",
        "val": 7,
        "badge": "+7",
        "name": "High Sear",
        "x": 280,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "orange"
      },
      {
        "id": "box_93_cond",
        "type": "conditional",
        "op": "conditional",
        "condType": "gt",
        "condVal": 12,
        "badge": "IF > 12",
        "name": "⚡ Logic Gate",
        "x": 480,
        "y": 1000,
        "w": 220,
        "h": 180,
        "theme": "quantum"
      },
      {
        "id": "box_93_mul",
        "op": "*",
        "val": 2,
        "badge": "×2",
        "name": "Flash Multiplier",
        "x": 790,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "gold"
      },
      {
        "id": "box_93_finish",
        "op": "+",
        "val": 5,
        "badge": "+5",
        "name": "Caviar Finish",
        "x": 800,
        "y": 1180,
        "w": 180,
        "h": 160,
        "theme": "cyan"
      },
      {
        "id": "box_93_decoy",
        "op": "+",
        "val": 5,
        "badge": "+5",
        "name": "Decoy Herb",
        "x": 280,
        "y": 1260,
        "w": 180,
        "h": 160,
        "theme": "purple"
      }
    ],
    "winningFormula": "(6 + 7 = 13) [IF > 12 ➔ YES] × 2 + 5 = 31  ✔"
  },
  {
    "id": 94,
    "name": "Level 94: Kimchi Fire Circuit",
    "subtitle": "Target: 66",
    "startValue": 7,
    "targetValue": 66,
    "startBox": {
      "x": 250,
      "y": 380,
      "w": 220,
      "h": 220,
      "label": "INGREDIENT DISPENSER"
    },
    "endBox": {
      "x": 830,
      "y": 1540,
      "w": 270,
      "h": 260,
      "label": "RECIPE COMPUTER"
    },
    "boxes": [
      {
        "id": "box_94_add1",
        "op": "+",
        "val": 8,
        "badge": "+8",
        "name": "High Sear",
        "x": 280,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "orange"
      },
      {
        "id": "box_94_cond",
        "type": "conditional",
        "op": "conditional",
        "condType": "gt",
        "condVal": 14,
        "badge": "IF > 14",
        "name": "⚡ Logic Gate",
        "x": 480,
        "y": 1000,
        "w": 220,
        "h": 180,
        "theme": "quantum"
      },
      {
        "id": "box_94_mul",
        "op": "*",
        "val": 4,
        "badge": "×4",
        "name": "Flash Multiplier",
        "x": 790,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "gold"
      },
      {
        "id": "box_94_finish",
        "op": "+",
        "val": 6,
        "badge": "+6",
        "name": "Caviar Finish",
        "x": 800,
        "y": 1180,
        "w": 180,
        "h": 160,
        "theme": "cyan"
      },
      {
        "id": "box_94_decoy",
        "op": "+",
        "val": 6,
        "badge": "+6",
        "name": "Decoy Herb",
        "x": 280,
        "y": 1260,
        "w": 180,
        "h": 160,
        "theme": "purple"
      }
    ],
    "winningFormula": "(7 + 8 = 15) [IF > 14 ➔ YES] × 4 + 6 = 66  ✔"
  },
  {
    "id": 95,
    "name": "Level 95: Chili Confit Vector",
    "subtitle": "Target: 28",
    "startValue": 3,
    "targetValue": 28,
    "startBox": {
      "x": 250,
      "y": 380,
      "w": 220,
      "h": 220,
      "label": "INGREDIENT DISPENSER"
    },
    "endBox": {
      "x": 830,
      "y": 1540,
      "w": 270,
      "h": 260,
      "label": "RECIPE COMPUTER"
    },
    "boxes": [
      {
        "id": "box_95_add1",
        "op": "+",
        "val": 4,
        "badge": "+4",
        "name": "High Sear",
        "x": 280,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "orange"
      },
      {
        "id": "box_95_cond",
        "type": "conditional",
        "op": "conditional",
        "condType": "gt",
        "condVal": 6,
        "badge": "IF > 6",
        "name": "⚡ Logic Gate",
        "x": 480,
        "y": 1000,
        "w": 220,
        "h": 180,
        "theme": "quantum"
      },
      {
        "id": "box_95_mul",
        "op": "*",
        "val": 3,
        "badge": "×3",
        "name": "Flash Multiplier",
        "x": 790,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "gold"
      },
      {
        "id": "box_95_finish",
        "op": "+",
        "val": 7,
        "badge": "+7",
        "name": "Caviar Finish",
        "x": 800,
        "y": 1180,
        "w": 180,
        "h": 160,
        "theme": "cyan"
      },
      {
        "id": "box_95_decoy",
        "op": "+",
        "val": 2,
        "badge": "+2",
        "name": "Decoy Herb",
        "x": 280,
        "y": 1260,
        "w": 180,
        "h": 160,
        "theme": "purple"
      }
    ],
    "winningFormula": "(3 + 4 = 7) [IF > 6 ➔ YES] × 3 + 7 = 28  ✔"
  },
  {
    "id": 96,
    "name": "Level 96: Yuzu Champagne Emulsion",
    "subtitle": "Target: 20",
    "startValue": 4,
    "targetValue": 20,
    "startBox": {
      "x": 250,
      "y": 380,
      "w": 220,
      "h": 220,
      "label": "INGREDIENT DISPENSER"
    },
    "endBox": {
      "x": 830,
      "y": 1540,
      "w": 270,
      "h": 260,
      "label": "RECIPE COMPUTER"
    },
    "boxes": [
      {
        "id": "box_96_add1",
        "op": "+",
        "val": 5,
        "badge": "+5",
        "name": "High Sear",
        "x": 280,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "orange"
      },
      {
        "id": "box_96_cond",
        "type": "conditional",
        "op": "conditional",
        "condType": "gt",
        "condVal": 8,
        "badge": "IF > 8",
        "name": "⚡ Logic Gate",
        "x": 480,
        "y": 1000,
        "w": 220,
        "h": 180,
        "theme": "quantum"
      },
      {
        "id": "box_96_mul",
        "op": "*",
        "val": 2,
        "badge": "×2",
        "name": "Flash Multiplier",
        "x": 790,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "gold"
      },
      {
        "id": "box_96_finish",
        "op": "+",
        "val": 2,
        "badge": "+2",
        "name": "Caviar Finish",
        "x": 800,
        "y": 1180,
        "w": 180,
        "h": 160,
        "theme": "cyan"
      },
      {
        "id": "box_96_decoy",
        "op": "+",
        "val": 3,
        "badge": "+3",
        "name": "Decoy Herb",
        "x": 280,
        "y": 1260,
        "w": 180,
        "h": 160,
        "theme": "purple"
      }
    ],
    "winningFormula": "(4 + 5 = 9) [IF > 8 ➔ YES] × 2 + 2 = 20  ✔"
  },
  {
    "id": 97,
    "name": "Level 97: Saffron Honey Gold",
    "subtitle": "Target: 47",
    "startValue": 5,
    "targetValue": 47,
    "startBox": {
      "x": 250,
      "y": 380,
      "w": 220,
      "h": 220,
      "label": "INGREDIENT DISPENSER"
    },
    "endBox": {
      "x": 830,
      "y": 1540,
      "w": 270,
      "h": 260,
      "label": "RECIPE COMPUTER"
    },
    "boxes": [
      {
        "id": "box_97_add1",
        "op": "+",
        "val": 6,
        "badge": "+6",
        "name": "High Sear",
        "x": 280,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "orange"
      },
      {
        "id": "box_97_cond",
        "type": "conditional",
        "op": "conditional",
        "condType": "gt",
        "condVal": 10,
        "badge": "IF > 10",
        "name": "⚡ Logic Gate",
        "x": 480,
        "y": 1000,
        "w": 220,
        "h": 180,
        "theme": "quantum"
      },
      {
        "id": "box_97_mul",
        "op": "*",
        "val": 4,
        "badge": "×4",
        "name": "Flash Multiplier",
        "x": 790,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "gold"
      },
      {
        "id": "box_97_finish",
        "op": "+",
        "val": 3,
        "badge": "+3",
        "name": "Caviar Finish",
        "x": 800,
        "y": 1180,
        "w": 180,
        "h": 160,
        "theme": "cyan"
      },
      {
        "id": "box_97_decoy",
        "op": "+",
        "val": 4,
        "badge": "+4",
        "name": "Decoy Herb",
        "x": 280,
        "y": 1260,
        "w": 180,
        "h": 160,
        "theme": "purple"
      }
    ],
    "winningFormula": "(5 + 6 = 11) [IF > 10 ➔ YES] × 4 + 3 = 47  ✔"
  },
  {
    "id": 98,
    "name": "Level 98: Black Gold Caviar Glaze",
    "subtitle": "Target: 43",
    "startValue": 6,
    "targetValue": 43,
    "startBox": {
      "x": 250,
      "y": 380,
      "w": 220,
      "h": 220,
      "label": "INGREDIENT DISPENSER"
    },
    "endBox": {
      "x": 830,
      "y": 1540,
      "w": 270,
      "h": 260,
      "label": "RECIPE COMPUTER"
    },
    "boxes": [
      {
        "id": "box_98_add1",
        "op": "+",
        "val": 7,
        "badge": "+7",
        "name": "High Sear",
        "x": 280,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "orange"
      },
      {
        "id": "box_98_cond",
        "type": "conditional",
        "op": "conditional",
        "condType": "gt",
        "condVal": 12,
        "badge": "IF > 12",
        "name": "⚡ Logic Gate",
        "x": 480,
        "y": 1000,
        "w": 220,
        "h": 180,
        "theme": "quantum"
      },
      {
        "id": "box_98_mul",
        "op": "*",
        "val": 3,
        "badge": "×3",
        "name": "Flash Multiplier",
        "x": 790,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "gold"
      },
      {
        "id": "box_98_finish",
        "op": "+",
        "val": 4,
        "badge": "+4",
        "name": "Caviar Finish",
        "x": 800,
        "y": 1180,
        "w": 180,
        "h": 160,
        "theme": "cyan"
      },
      {
        "id": "box_98_decoy",
        "op": "+",
        "val": 5,
        "badge": "+5",
        "name": "Decoy Herb",
        "x": 280,
        "y": 1260,
        "w": 180,
        "h": 160,
        "theme": "purple"
      }
    ],
    "winningFormula": "(6 + 7 = 13) [IF > 12 ➔ YES] × 3 + 4 = 43  ✔"
  },
  {
    "id": 99,
    "name": "Level 99: Imperial Dragon Feast",
    "subtitle": "Target: 35",
    "startValue": 7,
    "targetValue": 35,
    "startBox": {
      "x": 250,
      "y": 380,
      "w": 220,
      "h": 220,
      "label": "INGREDIENT DISPENSER"
    },
    "endBox": {
      "x": 830,
      "y": 1540,
      "w": 270,
      "h": 260,
      "label": "RECIPE COMPUTER"
    },
    "boxes": [
      {
        "id": "box_99_add1",
        "op": "+",
        "val": 8,
        "badge": "+8",
        "name": "High Sear",
        "x": 280,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "orange"
      },
      {
        "id": "box_99_cond",
        "type": "conditional",
        "op": "conditional",
        "condType": "gt",
        "condVal": 14,
        "badge": "IF > 14",
        "name": "⚡ Logic Gate",
        "x": 480,
        "y": 1000,
        "w": 220,
        "h": 180,
        "theme": "quantum"
      },
      {
        "id": "box_99_mul",
        "op": "*",
        "val": 2,
        "badge": "×2",
        "name": "Flash Multiplier",
        "x": 790,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "gold"
      },
      {
        "id": "box_99_finish",
        "op": "+",
        "val": 5,
        "badge": "+5",
        "name": "Caviar Finish",
        "x": 800,
        "y": 1180,
        "w": 180,
        "h": 160,
        "theme": "cyan"
      },
      {
        "id": "box_99_decoy",
        "op": "+",
        "val": 6,
        "badge": "+6",
        "name": "Decoy Herb",
        "x": 280,
        "y": 1260,
        "w": 180,
        "h": 160,
        "theme": "purple"
      }
    ],
    "winningFormula": "(7 + 8 = 15) [IF > 14 ➔ YES] × 2 + 5 = 35  ✔"
  },
  {
    "id": 100,
    "name": "Level 100: The Century Banquet",
    "subtitle": "Target: 100",
    "startValue": 5,
    "targetValue": 100,
    "startBox": {
      "x": 250,
      "y": 380,
      "w": 220,
      "h": 220,
      "label": "INGREDIENT DISPENSER"
    },
    "endBox": {
      "x": 830,
      "y": 1540,
      "w": 270,
      "h": 260,
      "label": "RECIPE COMPUTER"
    },
    "boxes": [
      {
        "id": "box_100_blaze",
        "op": "+",
        "val": 15,
        "badge": "+15",
        "name": "Imperial Blaze",
        "x": 280,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "orange"
      },
      {
        "id": "box_100_cond",
        "type": "conditional",
        "op": "conditional",
        "condType": "gt",
        "condVal": 18,
        "badge": "IF > 18",
        "name": "⚡ Crown Gate",
        "x": 480,
        "y": 1000,
        "w": 220,
        "h": 180,
        "theme": "quantum"
      },
      {
        "id": "box_100_mul",
        "op": "*",
        "val": 5,
        "badge": "×5",
        "name": "Legendary Core",
        "x": 800,
        "y": 1180,
        "w": 180,
        "h": 160,
        "theme": "gold"
      },
      {
        "id": "box_100_simmer",
        "op": "+",
        "val": 3,
        "badge": "+3",
        "name": "Lotus Simmer",
        "x": 790,
        "y": 720,
        "w": 180,
        "h": 160,
        "theme": "cyan"
      },
      {
        "id": "box_100_gold",
        "op": "+",
        "val": 10,
        "badge": "+10",
        "name": "Gold Leaf",
        "x": 280,
        "y": 1260,
        "w": 180,
        "h": 160,
        "theme": "purple"
      }
    ],
    "winningFormula": "(5 + 15 = 20) [IF > 18 ➔ YES] × 5 = 100  ✔"
  }
];

if (typeof window !== 'undefined') {
  window.GAME_LEVELS = GAME_LEVELS;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GAME_LEVELS;
}
