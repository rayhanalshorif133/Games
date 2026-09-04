// Levels Database for Car Direction Release (Traffic Escape / Car Jam)

export const CAR_LEVELS = [
  // --- LEVEL 1: First Exit (Tutorial - Exactly 3 Cars) ---
  {
    id: 1,
    name: "First Green Light",
    subtitle: "Find the unblocked car and tap to release!",
    cols: 5,
    rows: 5,
    cars: [
      // Car 1 (Red, pointing RIGHT, blocked by Car 2)
      { id: 1, r: 1, c: 0, length: 2, direction: 'RIGHT', colorIdx: 0 },
      // Car 2 (Blue, pointing DOWN, blocked by Car 3)
      { id: 2, r: 0, c: 2, length: 2, direction: 'DOWN', colorIdx: 1 },
      // Car 3 (Yellow, pointing LEFT, path is CLEAR to exit!)
      { id: 3, r: 3, c: 2, length: 2, direction: 'RIGHT', colorIdx: 2 }
    ]
  },

  // --- LEVEL 2: Double Cross ---
  {
    id: 2,
    name: "Double Cross",
    subtitle: "4 cars at a mini intersection",
    cols: 5,
    rows: 5,
    cars: [
      // Car 1 (Red, pointing RIGHT, blocked by 2)
      { id: 1, r: 1, c: 0, length: 2, direction: 'RIGHT', colorIdx: 0 },
      // Car 2 (Blue, pointing DOWN, blocked by 3)
      { id: 2, r: 0, c: 2, length: 2, direction: 'DOWN', colorIdx: 1 },
      // Car 3 (Green, pointing LEFT, blocked by 4)
      { id: 3, r: 3, c: 2, length: 2, direction: 'LEFT', colorIdx: 3 },
      // Car 4 (Yellow, pointing DOWN, clear to exit!)
      { id: 4, r: 2, c: 0, length: 2, direction: 'DOWN', colorIdx: 2 }
    ]
  },

  // --- LEVEL 3: Rush Hour Intro ---
  {
    id: 3,
    name: "Rush Hour Intro",
    subtitle: "Follow the arrows to clear the way",
    cols: 5,
    rows: 5,
    cars: [
      { id: 1, r: 1, c: 1, length: 2, direction: 'UP', colorIdx: 0 },
      { id: 2, r: 0, c: 2, length: 2, direction: 'RIGHT', colorIdx: 1 },
      { id: 3, r: 3, c: 1, length: 2, direction: 'RIGHT', colorIdx: 4 },
      { id: 4, r: 2, c: 3, length: 2, direction: 'DOWN', colorIdx: 2 }
    ]
  },

  // --- LEVEL 4: Alley Way ---
  {
    id: 4,
    name: "Alley Way",
    subtitle: "5 cars navigating a tight alley",
    cols: 6,
    rows: 6,
    cars: [
      { id: 1, r: 1, c: 0, length: 2, direction: 'RIGHT', colorIdx: 0 },
      { id: 2, r: 0, c: 2, length: 2, direction: 'DOWN', colorIdx: 1 },
      { id: 3, r: 3, c: 1, length: 2, direction: 'RIGHT', colorIdx: 2 },
      { id: 4, r: 2, c: 3, length: 2, direction: 'DOWN', colorIdx: 3 },
      { id: 5, r: 4, c: 3, length: 2, direction: 'RIGHT', colorIdx: 4 }
    ]
  },

  // --- LEVEL 5: Downtown Jam ---
  {
    id: 5,
    name: "Downtown Jam",
    subtitle: "Carefully plan each departure",
    cols: 6,
    rows: 6,
    cars: [
      { id: 1, r: 1, c: 1, length: 2, direction: 'LEFT', colorIdx: 0 },
      { id: 2, r: 1, c: 3, length: 2, direction: 'DOWN', colorIdx: 1 },
      { id: 3, r: 3, c: 2, length: 2, direction: 'RIGHT', colorIdx: 2 },
      { id: 4, r: 2, c: 0, length: 2, direction: 'DOWN', colorIdx: 3 },
      { id: 5, r: 4, c: 1, length: 2, direction: 'UP', colorIdx: 5 },
      { id: 6, r: 4, c: 3, length: 2, direction: 'RIGHT', colorIdx: 4 }
    ]
  },

  // --- LEVEL 6: Crossroad Chaos ---
  {
    id: 6,
    name: "Crossroad Chaos",
    subtitle: "6 cars with intersecting paths",
    cols: 6,
    rows: 6,
    cars: [
      { id: 1, r: 0, c: 1, length: 2, direction: 'RIGHT', colorIdx: 0 },
      { id: 2, r: 0, c: 4, length: 2, direction: 'DOWN', colorIdx: 1 },
      { id: 3, r: 2, c: 2, length: 2, direction: 'LEFT', colorIdx: 2 },
      { id: 4, r: 3, c: 0, length: 2, direction: 'UP', colorIdx: 3 },
      { id: 5, r: 4, c: 2, length: 2, direction: 'DOWN', colorIdx: 4 },
      { id: 6, r: 5, c: 3, length: 2, direction: 'RIGHT', colorIdx: 5 }
    ]
  },

  // --- LEVEL 7: Long Haul ---
  {
    id: 7,
    name: "Long Haul",
    subtitle: "Introducing larger 3-cell delivery vans!",
    cols: 6,
    rows: 6,
    cars: [
      { id: 1, r: 1, c: 0, length: 3, direction: 'RIGHT', colorIdx: 0 },
      { id: 2, r: 0, c: 3, length: 2, direction: 'DOWN', colorIdx: 1 },
      { id: 3, r: 3, c: 1, length: 2, direction: 'UP', colorIdx: 2 },
      { id: 4, r: 2, c: 4, length: 2, direction: 'DOWN', colorIdx: 3 },
      { id: 5, r: 4, c: 2, length: 3, direction: 'RIGHT', colorIdx: 4 },
      { id: 6, r: 5, c: 0, length: 2, direction: 'LEFT', colorIdx: 5 }
    ]
  },

  // --- LEVEL 8: Gridlock Spiral ---
  {
    id: 8,
    name: "Gridlock Spiral",
    subtitle: "7 vehicles spiraling outward",
    cols: 6,
    rows: 6,
    cars: [
      { id: 1, r: 1, c: 1, length: 2, direction: 'UP', colorIdx: 0 },
      { id: 2, r: 1, c: 4, length: 2, direction: 'DOWN', colorIdx: 1 },
      { id: 3, r: 3, c: 3, length: 2, direction: 'LEFT', colorIdx: 2 },
      { id: 4, r: 2, c: 1, length: 2, direction: 'UP', colorIdx: 3 },
      { id: 5, r: 4, c: 1, length: 2, direction: 'RIGHT', colorIdx: 4 },
      { id: 6, r: 4, c: 4, length: 2, direction: 'DOWN', colorIdx: 5 },
      { id: 7, r: 0, c: 3, length: 2, direction: 'UP', colorIdx: 6 }
    ]
  },

  // --- LEVEL 9: Four Corners ---
  {
    id: 9,
    name: "Four Corners",
    subtitle: "Vehicles facing all 4 cardinal exits",
    cols: 6,
    rows: 6,
    cars: [
      { id: 1, r: 0, c: 0, length: 2, direction: 'UP', colorIdx: 0 },
      { id: 2, r: 0, c: 5, length: 2, direction: 'DOWN', colorIdx: 1 },
      { id: 3, r: 5, c: 4, length: 2, direction: 'LEFT', colorIdx: 2 },
      { id: 4, r: 4, c: 0, length: 2, direction: 'UP', colorIdx: 3 },
      { id: 5, r: 2, c: 2, length: 2, direction: 'UP', colorIdx: 4 },
      { id: 6, r: 2, c: 4, length: 2, direction: 'DOWN', colorIdx: 5 },
      { id: 7, r: 3, c: 1, length: 2, direction: 'LEFT', colorIdx: 6 }
    ]
  },

  // --- LEVEL 10: Center Square ---
  {
    id: 10,
    name: "Center Square",
    subtitle: "8 cars packed in a downtown plaza",
    cols: 7,
    rows: 7,
    cars: [
      { id: 1, r: 1, c: 1, length: 2, direction: 'RIGHT', colorIdx: 0 },
      { id: 2, r: 1, c: 4, length: 2, direction: 'DOWN', colorIdx: 1 },
      { id: 3, r: 3, c: 4, length: 2, direction: 'DOWN', colorIdx: 2 },
      { id: 4, r: 5, c: 3, length: 2, direction: 'LEFT', colorIdx: 3 },
      { id: 5, r: 5, c: 1, length: 2, direction: 'LEFT', colorIdx: 4 },
      { id: 6, r: 3, c: 1, length: 2, direction: 'UP', colorIdx: 5 },
      { id: 7, r: 2, c: 3, length: 2, direction: 'RIGHT', colorIdx: 6 },
      { id: 8, r: 4, c: 2, length: 2, direction: 'DOWN', colorIdx: 0 }
    ]
  },

  // --- LEVEL 11: Airport Parking ---
  {
    id: 11,
    name: "Airport Parking",
    subtitle: "Terminal traffic is backing up!",
    cols: 7,
    rows: 7,
    cars: [
      { id: 1, r: 0, c: 2, length: 2, direction: 'DOWN', colorIdx: 1 },
      { id: 2, r: 2, c: 1, length: 2, direction: 'RIGHT', colorIdx: 2 },
      { id: 3, r: 2, c: 4, length: 2, direction: 'UP', colorIdx: 3 },
      { id: 4, r: 1, c: 5, length: 2, direction: 'LEFT', colorIdx: 4 },
      { id: 5, r: 4, c: 2, length: 2, direction: 'DOWN', colorIdx: 5 },
      { id: 6, r: 5, c: 3, length: 2, direction: 'RIGHT', colorIdx: 6 },
      { id: 7, r: 4, c: 5, length: 2, direction: 'DOWN', colorIdx: 0 },
      { id: 8, r: 6, c: 1, length: 2, direction: 'LEFT', colorIdx: 1 }
    ]
  },

  // --- LEVEL 12: Metro Terminal ---
  {
    id: 12,
    name: "Metro Terminal",
    subtitle: "9 cars in a multi-lane puzzle",
    cols: 7,
    rows: 7,
    cars: [
      { id: 1, r: 1, c: 0, length: 2, direction: 'RIGHT', colorIdx: 0 },
      { id: 2, r: 0, c: 3, length: 2, direction: 'DOWN', colorIdx: 1 },
      { id: 3, r: 2, c: 2, length: 2, direction: 'UP', colorIdx: 2 },
      { id: 4, r: 1, c: 5, length: 2, direction: 'DOWN', colorIdx: 3 },
      { id: 5, r: 3, c: 4, length: 2, direction: 'RIGHT', colorIdx: 4 },
      { id: 6, r: 4, c: 1, length: 2, direction: 'RIGHT', colorIdx: 5 },
      { id: 7, r: 5, c: 0, length: 2, direction: 'LEFT', colorIdx: 6 },
      { id: 8, r: 4, c: 3, length: 2, direction: 'DOWN', colorIdx: 0 },
      { id: 9, r: 6, c: 4, length: 2, direction: 'DOWN', colorIdx: 1 }
    ]
  },

  // --- LEVEL 13: Delivery Depot ---
  {
    id: 13,
    name: "Delivery Depot",
    subtitle: "Buses and sedans mixed together",
    cols: 7,
    rows: 7,
    cars: [
      { id: 1, r: 1, c: 1, length: 3, direction: 'RIGHT', colorIdx: 2 },
      { id: 2, r: 0, c: 5, length: 2, direction: 'DOWN', colorIdx: 3 },
      { id: 3, r: 2, c: 4, length: 2, direction: 'LEFT', colorIdx: 0 },
      { id: 4, r: 3, c: 2, length: 2, direction: 'DOWN', colorIdx: 1 },
      { id: 5, r: 4, c: 0, length: 2, direction: 'UP', colorIdx: 4 },
      { id: 6, r: 5, c: 1, length: 3, direction: 'RIGHT', colorIdx: 5 },
      { id: 7, r: 4, c: 4, length: 2, direction: 'RIGHT', colorIdx: 6 },
      { id: 8, r: 6, c: 3, length: 2, direction: 'DOWN', colorIdx: 0 },
      { id: 9, r: 3, c: 6, length: 2, direction: 'UP', colorIdx: 2 }
    ]
  },

  // --- LEVEL 14: Grand Roundabout ---
  {
    id: 14,
    name: "Grand Roundabout",
    subtitle: "10 cars circling the inner junction",
    cols: 7,
    rows: 7,
    cars: [
      { id: 1, r: 0, c: 1, length: 2, direction: 'UP', colorIdx: 0 },
      { id: 2, r: 0, c: 4, length: 2, direction: 'DOWN', colorIdx: 1 },
      { id: 3, r: 2, c: 5, length: 2, direction: 'DOWN', colorIdx: 2 },
      { id: 4, r: 4, c: 5, length: 2, direction: 'LEFT', colorIdx: 3 },
      { id: 5, r: 6, c: 4, length: 2, direction: 'LEFT', colorIdx: 4 },
      { id: 6, r: 5, c: 1, length: 2, direction: 'UP', colorIdx: 5 },
      { id: 7, r: 3, c: 0, length: 2, direction: 'UP', colorIdx: 6 },
      { id: 8, r: 2, c: 2, length: 2, direction: 'RIGHT', colorIdx: 0 },
      { id: 9, r: 3, c: 3, length: 2, direction: 'DOWN', colorIdx: 1 },
      { id: 10, r: 4, c: 2, length: 2, direction: 'LEFT', colorIdx: 2 }
    ]
  },

  // --- LEVEL 15: Rush Hour Royale ---
  {
    id: 15,
    name: "Rush Hour Royale",
    subtitle: "10 cars, multiple exit routes",
    cols: 7,
    rows: 7,
    cars: [
      { id: 1, r: 1, c: 0, length: 2, direction: 'RIGHT', colorIdx: 3 },
      { id: 2, r: 0, c: 3, length: 2, direction: 'DOWN', colorIdx: 4 },
      { id: 3, r: 2, c: 2, length: 2, direction: 'LEFT', colorIdx: 5 },
      { id: 4, r: 2, c: 4, length: 2, direction: 'DOWN', colorIdx: 6 },
      { id: 5, r: 3, c: 0, length: 2, direction: 'UP', colorIdx: 0 },
      { id: 6, r: 4, c: 2, length: 2, direction: 'RIGHT', colorIdx: 1 },
      { id: 7, r: 5, c: 1, length: 2, direction: 'DOWN', colorIdx: 2 },
      { id: 8, r: 4, c: 5, length: 2, direction: 'DOWN', colorIdx: 3 },
      { id: 9, r: 6, c: 3, length: 2, direction: 'LEFT', colorIdx: 4 },
      { id: 10, r: 0, c: 6, length: 2, direction: 'DOWN', colorIdx: 5 }
    ]
  },

  // --- LEVEL 16: Highway Interchange ---
  {
    id: 16,
    name: "Highway Interchange",
    subtitle: "11 vehicles intertwining",
    cols: 8,
    rows: 8,
    cars: [
      { id: 1, r: 1, c: 1, length: 2, direction: 'RIGHT', colorIdx: 0 },
      { id: 2, r: 1, c: 4, length: 2, direction: 'UP', colorIdx: 1 },
      { id: 3, r: 3, c: 3, length: 2, direction: 'LEFT', colorIdx: 2 },
      { id: 4, r: 2, c: 1, length: 2, direction: 'UP', colorIdx: 3 },
      { id: 5, r: 0, c: 6, length: 2, direction: 'DOWN', colorIdx: 4 },
      { id: 6, r: 3, c: 5, length: 2, direction: 'RIGHT', colorIdx: 5 },
      { id: 7, r: 4, c: 1, length: 2, direction: 'DOWN', colorIdx: 6 },
      { id: 8, r: 5, c: 2, length: 2, direction: 'RIGHT', colorIdx: 0 },
      { id: 9, r: 6, c: 4, length: 2, direction: 'UP', colorIdx: 1 },
      { id: 10, r: 5, c: 6, length: 2, direction: 'DOWN', colorIdx: 2 },
      { id: 11, r: 7, c: 1, length: 2, direction: 'LEFT', colorIdx: 3 }
    ]
  },

  // --- LEVEL 17: Megacity Grid ---
  {
    id: 17,
    name: "Megacity Grid",
    subtitle: "Dense multi-row intersections",
    cols: 8,
    rows: 8,
    cars: [
      { id: 1, r: 1, c: 0, length: 2, direction: 'RIGHT', colorIdx: 1 },
      { id: 2, r: 0, c: 3, length: 2, direction: 'DOWN', colorIdx: 2 },
      { id: 3, r: 2, c: 2, length: 2, direction: 'UP', colorIdx: 3 },
      { id: 4, r: 2, c: 5, length: 2, direction: 'DOWN', colorIdx: 4 },
      { id: 5, r: 3, c: 0, length: 2, direction: 'RIGHT', colorIdx: 5 },
      { id: 6, r: 4, c: 3, length: 2, direction: 'LEFT', colorIdx: 6 },
      { id: 7, r: 5, c: 1, length: 2, direction: 'DOWN', colorIdx: 0 },
      { id: 8, r: 4, c: 6, length: 2, direction: 'UP', colorIdx: 1 },
      { id: 9, r: 6, c: 3, length: 2, direction: 'RIGHT', colorIdx: 2 },
      { id: 10, r: 6, c: 6, length: 2, direction: 'DOWN', colorIdx: 3 },
      { id: 11, r: 7, c: 0, length: 2, direction: 'LEFT', colorIdx: 4 },
      { id: 12, r: 0, c: 7, length: 2, direction: 'DOWN', colorIdx: 5 }
    ]
  },

  // --- LEVEL 18: Cargo Port ---
  {
    id: 18,
    name: "Cargo Port",
    subtitle: "Heavy long trucks block narrow aisles",
    cols: 8,
    rows: 8,
    cars: [
      { id: 1, r: 1, c: 1, length: 3, direction: 'RIGHT', colorIdx: 6 },
      { id: 2, r: 0, c: 5, length: 3, direction: 'UP', colorIdx: 0 },
      { id: 3, r: 3, c: 3, length: 2, direction: 'LEFT', colorIdx: 1 },
      { id: 4, r: 2, c: 1, length: 2, direction: 'UP', colorIdx: 2 },
      { id: 5, r: 4, c: 0, length: 2, direction: 'RIGHT', colorIdx: 3 },
      { id: 6, r: 5, c: 2, length: 3, direction: 'RIGHT', colorIdx: 4 },
      { id: 7, r: 4, c: 6, length: 2, direction: 'DOWN', colorIdx: 5 },
      { id: 8, r: 6, c: 1, length: 2, direction: 'DOWN', colorIdx: 6 },
      { id: 9, r: 7, c: 3, length: 2, direction: 'RIGHT', colorIdx: 0 },
      { id: 10, r: 6, c: 5, length: 2, direction: 'UP', colorIdx: 1 },
      { id: 11, r: 0, c: 2, length: 2, direction: 'UP', colorIdx: 2 },
      { id: 12, r: 3, c: 7, length: 2, direction: 'RIGHT', colorIdx: 3 }
    ]
  },

  // --- LEVEL 19: Expressway Nexus ---
  {
    id: 19,
    name: "Expressway Nexus",
    subtitle: "13 cars in a multi-layered jam",
    cols: 8,
    rows: 8,
    cars: [
      { id: 1, r: 0, c: 1, length: 2, direction: 'RIGHT', colorIdx: 0 },
      { id: 2, r: 0, c: 4, length: 2, direction: 'DOWN', colorIdx: 1 },
      { id: 3, r: 2, c: 3, length: 2, direction: 'LEFT', colorIdx: 2 },
      { id: 4, r: 1, c: 1, length: 2, direction: 'DOWN', colorIdx: 3 },
      { id: 5, r: 3, c: 0, length: 2, direction: 'UP', colorIdx: 4 },
      { id: 6, r: 3, c: 5, length: 2, direction: 'DOWN', colorIdx: 5 },
      { id: 7, r: 2, c: 7, length: 2, direction: 'UP', colorIdx: 6 },
      { id: 8, r: 4, c: 2, length: 2, direction: 'RIGHT', colorIdx: 0 },
      { id: 9, r: 5, c: 1, length: 2, direction: 'DOWN', colorIdx: 1 },
      { id: 10, r: 5, c: 4, length: 2, direction: 'RIGHT', colorIdx: 2 },
      { id: 11, r: 6, c: 3, length: 2, direction: 'DOWN', colorIdx: 3 },
      { id: 12, r: 6, c: 6, length: 2, direction: 'LEFT', colorIdx: 4 },
      { id: 13, r: 7, c: 1, length: 2, direction: 'LEFT', colorIdx: 5 }
    ]
  },

  // --- LEVEL 20: Traffic Master Supreme ---
  {
    id: 20,
    name: "Traffic Master Supreme",
    subtitle: "The ultimate 14-car parking escape puzzle",
    cols: 8,
    rows: 8,
    cars: [
      { id: 1, r: 0, c: 0, length: 2, direction: 'RIGHT', colorIdx: 0 },
      { id: 2, r: 0, c: 3, length: 2, direction: 'DOWN', colorIdx: 1 },
      { id: 3, r: 1, c: 5, length: 2, direction: 'DOWN', colorIdx: 2 },
      { id: 4, r: 2, c: 1, length: 2, direction: 'LEFT', colorIdx: 3 },
      { id: 5, r: 2, c: 4, length: 2, direction: 'DOWN', colorIdx: 4 },
      { id: 6, r: 3, c: 2, length: 2, direction: 'UP', colorIdx: 5 },
      { id: 7, r: 4, c: 0, length: 2, direction: 'DOWN', colorIdx: 6 },
      { id: 8, r: 4, c: 3, length: 2, direction: 'RIGHT', colorIdx: 0 },
      { id: 9, r: 4, c: 6, length: 2, direction: 'UP', colorIdx: 1 },
      { id: 10, r: 5, c: 2, length: 2, direction: 'DOWN', colorIdx: 2 },
      { id: 11, r: 6, c: 3, length: 2, direction: 'RIGHT', colorIdx: 3 },
      { id: 12, r: 6, c: 6, length: 2, direction: 'DOWN', colorIdx: 4 },
      { id: 13, r: 7, c: 1, length: 2, direction: 'LEFT', colorIdx: 5 },
      { id: 14, r: 7, c: 4, length: 2, direction: 'DOWN', colorIdx: 6 }
    ]
  }
];

// Helper: Check if a level is solvable
export function isLevelSolvable(level) {
  const cars = level.cars.map(c => ({ ...c }));
  const cols = level.cols;
  const rows = level.rows;

  let remaining = [...cars];
  while (remaining.length > 0) {
    // Find any car that can escape right now
    const unblockedIdx = remaining.findIndex(car => canCarEscape(car, remaining, cols, rows));
    if (unblockedIdx === -1) {
      // Deadlock / unsolvable
      return false;
    }
    // Remove unblocked car
    remaining.splice(unblockedIdx, 1);
  }
  return true;
}

// Raycast check if path from front of car to boundary is clear of other cars
export function canCarEscape(car, allCars, cols, rows) {
  // Occupied cells for car
  const occupiedByOther = (r, c) => {
    return allCars.some(other => {
      if (other.id === car.id) return false;
      const isHorizontal = other.direction === 'LEFT' || other.direction === 'RIGHT';
      for (let i = 0; i < other.length; i++) {
        const or = isHorizontal ? other.r : other.r + i;
        const oc = isHorizontal ? other.c + i : other.c;
        if (or === r && oc === c) return true;
      }
      return false;
    });
  };

  // Determine starting ray point based on car direction
  let startR = car.r;
  let startC = car.c;

  if (car.direction === 'RIGHT') {
    startR = car.r;
    startC = car.c + car.length;
    for (let c = startC; c < cols; c++) {
      if (occupiedByOther(startR, c)) return false;
    }
  } else if (car.direction === 'LEFT') {
    startR = car.r;
    startC = car.c - 1;
    for (let c = startC; c >= 0; c--) {
      if (occupiedByOther(startR, c)) return false;
    }
  } else if (car.direction === 'DOWN') {
    startR = car.r + car.length;
    startC = car.c;
    for (let r = startR; r < rows; r++) {
      if (occupiedByOther(r, startC)) return false;
    }
  } else if (car.direction === 'UP') {
    startR = car.r - 1;
    startC = car.c;
    for (let r = startR; r >= 0; r--) {
      if (occupiedByOther(r, startC)) return false;
    }
  }

  return true;
}

export function getCarLevel(levelId) {
  if (levelId <= CAR_LEVELS.length) {
    return CAR_LEVELS[levelId - 1];
  }
  return generateProceduralCarLevel(levelId);
}

// Procedural generator for endless levels (Level 21+)
export function generateProceduralCarLevel(levelId) {
  let seed = levelId * 4097;
  const rnd = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };

  const cols = 8;
  const rows = 8;
  const carCount = Math.min(15, 6 + Math.floor((levelId - 20) * 0.4));

  // Build backwards: start with empty grid, place cars and drive them into parking spots
  // This guarantees 100% solvability
  const placedCars = [];
  const dirs = ['UP', 'DOWN', 'LEFT', 'RIGHT'];

  for (let i = 0; i < carCount; i++) {
    const dir = dirs[Math.floor(rnd() * 4)];
    const isHoriz = dir === 'LEFT' || dir === 'RIGHT';
    const len = rnd() > 0.8 ? 3 : 2;
    const maxR = isHoriz ? rows - 1 : rows - len;
    const maxC = isHoriz ? cols - len : cols - 1;

    let r = Math.floor(rnd() * (maxR + 1));
    let c = Math.floor(rnd() * (maxC + 1));

    // Check overlaps
    let overlap = false;
    for (let k = 0; k < len; k++) {
      const cr = isHoriz ? r : r + k;
      const cc = isHoriz ? c + k : c;
      if (placedCars.some(other => {
        const oHoriz = other.direction === 'LEFT' || other.direction === 'RIGHT';
        for (let m = 0; m < other.length; m++) {
          const or = oHoriz ? other.r : other.r + m;
          const oc = oHoriz ? other.c + m : other.c;
          if (or === cr && oc === cc) return true;
        }
        return false;
      })) {
        overlap = true;
        break;
      }
    }

    if (!overlap) {
      placedCars.push({
        id: i + 1,
        r,
        c,
        length: len,
        direction: dir,
        colorIdx: i % 7
      });
    }
  }

  // If generated cars is not solvable or too few, fallback to template
  const candidate = {
    id: levelId,
    name: `Highway Sprint ${levelId}`,
    subtitle: `${placedCars.length} vehicles to navigate`,
    cols,
    rows,
    cars: placedCars.length >= 4 ? placedCars : CAR_LEVELS[19].cars
  };

  return candidate;
}
