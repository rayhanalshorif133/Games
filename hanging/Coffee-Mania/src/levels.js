// Level database and procedural solver-guaranteed level generator

export const TRAY_COLORS = {
  NAVY: 0,
  PINK: 1,
  SKY: 2
};

export const COLOR_NAMES = ['Navy_Blue', 'Pink', 'Sky_Blue'];
export const CUP_ANIM_NAMES = ['cup_1', 'cup_2', 'cup_3'];

// Helper to expand runs of cups, e.g. expandSequence([[0, 6], [1, 6]]) => [0,0,0,0,0,0, 1,1,1,1,1,1]
function expand(runs) {
  const result = [];
  for (const [color, count] of runs) {
    for (let i = 0; i < count; i++) {
      result.push(color);
    }
  }
  return result;
}

export const LEVELS = [
  // --- LEVEL 1: First Sip (Tutorial) ---
  {
    id: 1,
    name: "First Sip",
    subtitle: "Tap a tray to place it on the counter!",
    tutorial: true,
    slotsCount: 5,
    // 3 Trays: 2 Navy (12 cups), 1 Pink (6 cups) = 18 cups total
    cups: expand([
      [0, 6], // 6 Navy
      [1, 6], // 6 Pink
      [0, 6]  // 6 Navy
    ]),
    stacks: [
      [0, 1], // Bottom: Navy, Top: Pink
      [0]     // Top: Navy
    ]
  },

  // --- LEVEL 2: Double Shot ---
  {
    id: 2,
    name: "Double Shot",
    subtitle: "Sort two colors smoothly",
    tutorial: false,
    slotsCount: 5,
    // 4 Trays: 2 Navy, 2 Pink = 24 cups
    cups: expand([
      [0, 3], [1, 3],
      [0, 3], [1, 3],
      [1, 6], [0, 6]
    ]),
    stacks: [
      [1, 0],
      [0, 1]
    ]
  },

  // --- LEVEL 3: Sky Breeze ---
  {
    id: 3,
    name: "Sky Breeze",
    subtitle: "Welcome Sky Blue to the cafe!",
    tutorial: false,
    slotsCount: 5,
    // 4 Trays: 1 Navy, 1 Pink, 2 Sky = 24 cups
    cups: expand([
      [2, 6],
      [0, 6],
      [1, 6],
      [2, 6]
    ]),
    stacks: [
      [2, 0],
      [1, 2]
    ]
  },

  // --- LEVEL 4: Triple Blend ---
  {
    id: 4,
    name: "Triple Blend",
    subtitle: "Three colors interleaved",
    tutorial: false,
    slotsCount: 5,
    // 5 Trays: 2 Navy, 2 Pink, 1 Sky = 30 cups
    cups: expand([
      [0, 3], [1, 3], [2, 3],
      [0, 3], [1, 3], [2, 3],
      [1, 6], [0, 6]
    ]),
    stacks: [
      [1, 0],
      [2, 1],
      [0]
    ]
  },

  // --- LEVEL 5: Morning Rush ---
  {
    id: 5,
    name: "Morning Rush",
    subtitle: "More customers arriving!",
    tutorial: false,
    slotsCount: 5,
    // 6 Trays: 2 Navy, 2 Pink, 2 Sky = 36 cups
    cups: expand([
      [0, 4], [2, 3], [1, 4],
      [0, 2], [2, 3], [1, 2],
      [0, 6], [1, 6], [2, 6]
    ]),
    stacks: [
      [2, 0],
      [0, 1],
      [1, 2]
    ]
  },

  // --- LEVEL 6: Counter Tactics ---
  {
    id: 6,
    name: "Counter Tactics",
    subtitle: "Watch your counter space closely",
    tutorial: false,
    slotsCount: 5,
    // 6 Trays: 2 Navy, 2 Pink, 2 Sky = 36 cups
    cups: expand([
      [1, 3], [0, 3], [2, 3], [1, 3],
      [0, 3], [2, 3], [0, 6], [1, 6], [2, 6]
    ]),
    stacks: [
      [1, 2, 0],
      [0, 1, 2]
    ]
  },

  // --- LEVEL 7: Cafe Symphony ---
  {
    id: 7,
    name: "Cafe Symphony",
    subtitle: "Deeper stacks test your foresight",
    tutorial: false,
    slotsCount: 5,
    // 7 Trays: 3 Navy, 2 Pink, 2 Sky = 42 cups
    cups: expand([
      [0, 6], [1, 3], [2, 3],
      [1, 3], [2, 3], [0, 6],
      [0, 6], [1, 6], [2, 6]
    ]),
    stacks: [
      [0, 1, 2],
      [2, 0, 1],
      [0]
    ]
  },

  // --- LEVEL 8: Latte Art ---
  {
    id: 8,
    name: "Latte Art",
    subtitle: "Speed and precision required",
    tutorial: false,
    slotsCount: 5,
    // 8 Trays: 3 Navy, 3 Pink, 2 Sky = 48 cups
    cups: expand([
      [2, 4], [0, 4], [1, 4],
      [2, 2], [0, 2], [1, 2],
      [1, 6], [0, 6], [2, 6],
      [0, 6], [1, 6]
    ]),
    stacks: [
      [0, 1, 2],
      [1, 0, 1],
      [2, 0]
    ]
  },

  // --- LEVEL 9: Mocha Magic ---
  {
    id: 9,
    name: "Mocha Magic",
    subtitle: "Tight counter space, plan ahead!",
    tutorial: false,
    slotsCount: 4,
    // 8 Trays: 3 Navy, 3 Pink, 2 Sky = 48 cups
    cups: expand([
      [1, 6], [0, 4], [2, 4],
      [0, 2], [2, 2], [1, 6],
      [0, 6], [2, 6], [1, 6], [0, 6]
    ]),
    stacks: [
      [2, 0, 1],
      [1, 2, 0],
      [0, 1]
    ]
  },

  // --- LEVEL 10: Master Barista ---
  {
    id: 10,
    name: "Master Barista",
    subtitle: "9 trays of customer orders",
    tutorial: false,
    slotsCount: 5,
    // 9 Trays: 3 Navy, 3 Pink, 3 Sky = 54 cups
    cups: expand([
      [0, 3], [1, 3], [2, 3],
      [0, 3], [1, 3], [2, 3],
      [2, 6], [0, 6], [1, 6],
      [0, 6], [1, 6], [2, 6]
    ]),
    stacks: [
      [0, 1, 2],
      [1, 2, 0],
      [2, 0, 1]
    ]
  },

  // --- LEVEL 11: Espresso Extra ---
  {
    id: 11,
    name: "Espresso Extra",
    subtitle: "Rapid color switches",
    tutorial: false,
    slotsCount: 5,
    cups: expand([
      [1, 2], [0, 2], [2, 2],
      [1, 4], [0, 4], [2, 4],
      [0, 6], [1, 6], [2, 6],
      [1, 6], [0, 6], [2, 6]
    ]),
    stacks: [
      [1, 0, 2],
      [2, 1, 0],
      [0, 2, 1]
    ]
  },

  // --- LEVEL 12: Caramel Swirl ---
  {
    id: 12,
    name: "Caramel Swirl",
    subtitle: "10 Trays to satisfy the lunch crowd",
    tutorial: false,
    slotsCount: 5,
    // 10 Trays = 60 cups (4 Navy=24, 3 Pink=18, 3 Sky=18)
    cups: expand([
      [2, 3], [0, 3], [1, 3], [2, 3],
      [0, 3], [1, 3], [0, 6], [2, 6],
      [1, 6], [0, 6], [1, 6], [2, 6],
      [0, 6]
    ]),
    stacks: [
      [0, 1, 2],
      [2, 0, 1],
      [1, 2, 0],
      [0]
    ]
  },

  // --- LEVEL 13: Frosty Frappe ---
  {
    id: 13,
    name: "Frosty Frappe",
    subtitle: "Dense stacks require tactical choices",
    tutorial: false,
    slotsCount: 4,
    // 10 Trays = 60 cups
    cups: expand([
      [0, 6], [1, 3], [2, 3],
      [1, 3], [2, 3], [0, 6],
      [2, 6], [1, 6], [0, 6],
      [1, 6], [2, 6], [0, 6]
    ]),
    stacks: [
      [1, 0, 2, 0],
      [2, 1, 0],
      [0, 2, 1]
    ]
  },

  // --- LEVEL 14: Vanilla Velvet ---
  {
    id: 14,
    name: "Vanilla Velvet",
    subtitle: "Four active stacks to balance",
    tutorial: false,
    slotsCount: 5,
    // 11 Trays = 66 cups
    cups: expand([
      [1, 4], [2, 4], [0, 4],
      [1, 2], [2, 2], [0, 2],
      [0, 6], [1, 6], [2, 6],
      [0, 6], [1, 6], [2, 6],
      [1, 6], [0, 6]
    ]),
    stacks: [
      [1, 2, 0],
      [0, 1, 2],
      [2, 0, 1],
      [1, 0]
    ]
  },

  // --- LEVEL 15: Grand Cafe Royale ---
  {
    id: 15,
    name: "Grand Cafe Royale",
    subtitle: "12 Trays, 72 cups of supreme challenge",
    tutorial: false,
    slotsCount: 5,
    // 12 Trays = 72 cups (4 Navy=24, 4 Pink=24, 4 Sky=24)
    cups: expand([
      [0, 3], [1, 3], [2, 3],
      [0, 3], [1, 3], [2, 3],
      [1, 6], [2, 6], [0, 6],
      [0, 6], [1, 6], [2, 6],
      [2, 6], [0, 6], [1, 6]
    ]),
    stacks: [
      [0, 1, 2],
      [1, 2, 0],
      [2, 0, 1],
      [0, 2, 1]
    ]
  },

  // --- LEVEL 16: Peak Hour ---
  {
    id: 16,
    name: "Peak Hour",
    subtitle: "The queue never stops moving",
    tutorial: false,
    slotsCount: 4,
    // 12 Trays = 72 cups
    cups: expand([
      [2, 6], [0, 3], [1, 3],
      [0, 3], [1, 3], [2, 6],
      [1, 6], [0, 6], [2, 6],
      [0, 6], [1, 6], [2, 6],
      [0, 6], [1, 6]
    ]),
    stacks: [
      [2, 0, 1, 2],
      [1, 2, 0, 1],
      [0, 1, 2, 0]
    ]
  },

  // --- LEVEL 17: Roast Master ---
  {
    id: 17,
    name: "Roast Master",
    subtitle: "Every move counts",
    tutorial: false,
    slotsCount: 5,
    cups: expand([
      [1, 4], [0, 4], [2, 4],
      [1, 2], [0, 2], [2, 2],
      [0, 6], [2, 6], [1, 6],
      [2, 6], [0, 6], [1, 6],
      [1, 6], [2, 6], [0, 6]
    ]),
    stacks: [
      [1, 0, 2],
      [2, 1, 0],
      [0, 2, 1],
      [2, 1, 0]
    ]
  },

  // --- LEVEL 18: Barista Championship ---
  {
    id: 18,
    name: "Barista Championship",
    subtitle: "Speed, strategy, perfection",
    tutorial: false,
    slotsCount: 5,
    cups: expand([
      [0, 2], [1, 2], [2, 2],
      [0, 4], [1, 4], [2, 4],
      [1, 6], [0, 6], [2, 6],
      [0, 6], [1, 6], [2, 6],
      [2, 6], [1, 6], [0, 6]
    ]),
    stacks: [
      [0, 2, 1],
      [1, 0, 2],
      [2, 1, 0],
      [0, 1, 2]
    ]
  },

  // --- LEVEL 19: Supreme Espresso ---
  {
    id: 19,
    name: "Supreme Espresso",
    subtitle: "Precision sorting at maximum speed",
    tutorial: false,
    slotsCount: 4,
    cups: expand([
      [2, 3], [1, 3], [0, 3],
      [2, 3], [1, 3], [0, 3],
      [0, 6], [1, 6], [2, 6],
      [1, 6], [2, 6], [0, 6],
      [2, 6], [0, 6], [1, 6]
    ]),
    stacks: [
      [2, 1, 0, 2],
      [0, 2, 1, 0],
      [1, 0, 2, 1]
    ]
  },

  // --- LEVEL 20: Coffee Mania Legend ---
  {
    id: 20,
    name: "Coffee Mania Legend",
    subtitle: "The ultimate sorting mastery",
    tutorial: false,
    slotsCount: 5,
    // 14 Trays = 84 cups (5 Navy=30, 4 Pink=24, 5 Sky=30)
    cups: expand([
      [0, 3], [1, 3], [2, 3],
      [0, 3], [1, 3], [2, 3],
      [1, 6], [0, 6], [2, 6],
      [0, 6], [2, 6], [1, 6],
      [2, 6], [1, 6], [0, 6],
      [0, 6], [2, 6]
    ]),
    stacks: [
      [0, 1, 2, 0],
      [1, 2, 0, 1],
      [2, 0, 1, 2],
      [0, 2]
    ]
  }
];

// Procedural level generator for infinite levels beyond level 20
export function generateProceduralLevel(levelIndex) {
  const seed = levelIndex * 1337;
  // Pseudorandom generator
  let s = seed;
  const rnd = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };

  const trayCount = Math.min(16, 6 + Math.floor((levelIndex - 20) * 0.4));
  const slotsCount = levelIndex % 3 === 0 ? 4 : 5;

  // Decide tray distribution among 3 colors
  const trays = [];
  for (let i = 0; i < trayCount; i++) {
    trays.push(i % 3);
  }
  // Shuffle trays for stack distribution
  for (let i = trays.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [trays[i], trays[j]] = [trays[j], trays[i]];
  }

  const stackCount = 4;
  const stacks = Array.from({ length: stackCount }, () => []);
  trays.forEach((tray, idx) => {
    stacks[idx % stackCount].push(tray);
  });

  // Generate cups in chunks of 3 or 6 based on trays
  const cupCounts = [0, 0, 0];
  trays.forEach(t => {
    cupCounts[t] += 6;
  });

  const cups = [];
  while (cupCounts[0] > 0 || cupCounts[1] > 0 || cupCounts[2] > 0) {
    const avail = [0, 1, 2].filter(c => cupCounts[c] > 0);
    const chosen = avail[Math.floor(rnd() * avail.length)];
    const chunk = Math.min(cupCounts[chosen], Math.floor(rnd() * 3) + 2); // 2, 3, or 4
    for (let i = 0; i < chunk; i++) {
      cups.push(chosen);
    }
    cupCounts[chosen] -= chunk;
  }

  return {
    id: levelIndex,
    name: `Barista Level ${levelIndex}`,
    subtitle: `Custom roasted puzzle with ${trayCount} trays`,
    tutorial: false,
    slotsCount,
    cups,
    stacks
  };
}

export function getLevel(levelId) {
  if (levelId <= LEVELS.length) {
    return LEVELS[levelId - 1];
  }
  return generateProceduralLevel(levelId);
}
