// ==========================================================
// NEXUS GAMING - 100 2D HTML GAMES DATA & PLAYER PROFILE
// ==========================================================

const DEFAULT_GAMES = [
  {
    "id": "game-2d-1",
    "title": "Pixel Knight: Shadow Dungeon",
    "category": "Retro Arcade",
    "difficulty": "Casual",
    "isChallenging": false,
    "rating": 4.2,
    "plays": 20000,
    "rewardPoints": 50,
    "featured": true,
    "releaseYear": 2020,
    "developer": "Studio 2D Pixel #1",
    "thumbnail": "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80",
    "banner": "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80",
    "playUrl": "https://play2048.co/",
    "isPlayableWeb": true,
    "platforms": [
      "Web",
      "PC",
      "Mobile"
    ],
    "description": "Experience exhilarating 2D HTML action in Pixel Knight: Shadow Dungeon. Dodge hazards, beat high scores, and master arcade thrills!",
    "systemReq": "Instant play in any modern web browser. Keyboard or touch controls supported.",
    "tags": [
      "2D",
      "HTML5",
      "Retro Arcade",
      "Casual",
      "Arcade"
    ]
  },
  {
    "id": "game-2d-2",
    "title": "Cyber Runner 2099",
    "category": "Platformer",
    "difficulty": "Medium",
    "isChallenging": false,
    "rating": 4.3,
    "plays": 27391,
    "rewardPoints": 100,
    "featured": true,
    "releaseYear": 2021,
    "developer": "Studio 2D Pixel #2",
    "thumbnail": "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=800&q=80",
    "banner": "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=800&q=80",
    "playUrl": "https://hextris.io/",
    "isPlayableWeb": true,
    "platforms": [
      "Web",
      "PC",
      "Console"
    ],
    "description": "Experience exhilarating 2D HTML action in Cyber Runner 2099. Dodge hazards, beat high scores, and master arcade thrills!",
    "systemReq": "Instant play in any modern web browser. Keyboard or touch controls supported.",
    "tags": [
      "2D",
      "HTML5",
      "Platformer",
      "Medium",
      "Arcade"
    ]
  },
  {
    "id": "game-2d-3",
    "title": "Neon Pong X",
    "category": "Puzzle & Brain",
    "difficulty": "Challenging",
    "isChallenging": true,
    "rating": 4.4,
    "plays": 34782,
    "rewardPoints": 150,
    "featured": true,
    "releaseYear": 2022,
    "developer": "Studio 2D Pixel #3",
    "thumbnail": "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=800&q=80",
    "banner": "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=800&q=80",
    "playUrl": "https://freepacman.org/",
    "isPlayableWeb": true,
    "platforms": [
      "Web",
      "PC",
      "Mobile"
    ],
    "description": "Experience exhilarating 2D HTML action in Neon Pong X. Dodge hazards, beat high scores, and master arcade thrills!",
    "systemReq": "Instant play in any modern web browser. Keyboard or touch controls supported.",
    "tags": [
      "2D",
      "HTML5",
      "Puzzle & Brain",
      "Challenging",
      "Arcade"
    ]
  },
  {
    "id": "game-2d-4",
    "title": "Retro Space Invaders",
    "category": "Infinite Runner",
    "difficulty": "Hardcore",
    "isChallenging": true,
    "rating": 4.5,
    "plays": 42173,
    "rewardPoints": 200,
    "featured": true,
    "releaseYear": 2023,
    "developer": "Studio 2D Pixel #4",
    "thumbnail": "https://images.unsplash.com/photo-1614680376593-902f749f7ffc?auto=format&fit=crop&w=800&q=80",
    "banner": "https://images.unsplash.com/photo-1614680376593-902f749f7ffc?auto=format&fit=crop&w=800&q=80",
    "playUrl": "https://play2048.co/",
    "isPlayableWeb": true,
    "platforms": [
      "Web",
      "PC",
      "Console"
    ],
    "description": "Experience exhilarating 2D HTML action in Retro Space Invaders. Dodge hazards, beat high scores, and master arcade thrills!",
    "systemReq": "Instant play in any modern web browser. Keyboard or touch controls supported.",
    "tags": [
      "2D",
      "HTML5",
      "Infinite Runner",
      "Hardcore",
      "Arcade"
    ]
  },
  {
    "id": "game-2d-5",
    "title": "Flappy Cyberbird",
    "category": "2D Shooter",
    "difficulty": "Insane",
    "isChallenging": true,
    "rating": 4.6,
    "plays": 49564,
    "rewardPoints": 250,
    "featured": true,
    "releaseYear": 2024,
    "developer": "Studio 2D Pixel #5",
    "thumbnail": "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=800&q=80",
    "banner": "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=800&q=80",
    "playUrl": "https://hextris.io/",
    "isPlayableWeb": true,
    "platforms": [
      "Web",
      "PC",
      "Mobile"
    ],
    "description": "Experience exhilarating 2D HTML action in Flappy Cyberbird. Dodge hazards, beat high scores, and master arcade thrills!",
    "systemReq": "Instant play in any modern web browser. Keyboard or touch controls supported.",
    "tags": [
      "2D",
      "HTML5",
      "2D Shooter",
      "Insane",
      "Arcade"
    ]
  },
  {
    "id": "game-2d-6",
    "title": "Sonic Pixel Rush",
    "category": "Physics & Casual",
    "difficulty": "Casual",
    "isChallenging": false,
    "rating": 4.7,
    "plays": 56955,
    "rewardPoints": 300,
    "featured": true,
    "releaseYear": 2020,
    "developer": "Studio 2D Pixel #6",
    "thumbnail": "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80",
    "banner": "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80",
    "playUrl": "https://freepacman.org/",
    "isPlayableWeb": true,
    "platforms": [
      "Web",
      "PC",
      "Console"
    ],
    "description": "Experience exhilarating 2D HTML action in Sonic Pixel Rush. Dodge hazards, beat high scores, and master arcade thrills!",
    "systemReq": "Instant play in any modern web browser. Keyboard or touch controls supported.",
    "tags": [
      "2D",
      "HTML5",
      "Physics & Casual",
      "Casual",
      "Arcade"
    ]
  },
  {
    "id": "game-2d-7",
    "title": "Tetris Neon Blocks",
    "category": "Action & Fighting",
    "difficulty": "Medium",
    "isChallenging": false,
    "rating": 4.8,
    "plays": 64346,
    "rewardPoints": 350,
    "featured": true,
    "releaseYear": 2021,
    "developer": "Studio 2D Pixel #7",
    "thumbnail": "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80",
    "banner": "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80",
    "playUrl": "https://play2048.co/",
    "isPlayableWeb": true,
    "platforms": [
      "Web",
      "PC",
      "Mobile"
    ],
    "description": "Experience exhilarating 2D HTML action in Tetris Neon Blocks. Dodge hazards, beat high scores, and master arcade thrills!",
    "systemReq": "Instant play in any modern web browser. Keyboard or touch controls supported.",
    "tags": [
      "2D",
      "HTML5",
      "Action & Fighting",
      "Medium",
      "Arcade"
    ]
  },
  {
    "id": "game-2d-8",
    "title": "Stickman Shadow Archer",
    "category": "Classic Strategy",
    "difficulty": "Challenging",
    "isChallenging": true,
    "rating": 4.9,
    "plays": 71737,
    "rewardPoints": 400,
    "featured": true,
    "releaseYear": 2022,
    "developer": "Studio 2D Pixel #8",
    "thumbnail": "https://images.unsplash.com/photo-1551103782-8ab07afd45c1?auto=format&fit=crop&w=800&q=80",
    "banner": "https://images.unsplash.com/photo-1551103782-8ab07afd45c1?auto=format&fit=crop&w=800&q=80",
    "playUrl": "https://hextris.io/",
    "isPlayableWeb": true,
    "platforms": [
      "Web",
      "PC",
      "Console"
    ],
    "description": "Experience exhilarating 2D HTML action in Stickman Shadow Archer. Dodge hazards, beat high scores, and master arcade thrills!",
    "systemReq": "Instant play in any modern web browser. Keyboard or touch controls supported.",
    "tags": [
      "2D",
      "HTML5",
      "Classic Strategy",
      "Challenging",
      "Arcade"
    ]
  },
  {
    "id": "game-2d-9",
    "title": "Brick Breaker Extreme",
    "category": "Retro Arcade",
    "difficulty": "Hardcore",
    "isChallenging": true,
    "rating": 4.2,
    "plays": 79128,
    "rewardPoints": 450,
    "featured": true,
    "releaseYear": 2023,
    "developer": "Studio 2D Pixel #9",
    "thumbnail": "https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=800&q=80",
    "banner": "https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=800&q=80",
    "playUrl": "https://freepacman.org/",
    "isPlayableWeb": true,
    "platforms": [
      "Web",
      "PC",
      "Mobile"
    ],
    "description": "Experience exhilarating 2D HTML action in Brick Breaker Extreme. Dodge hazards, beat high scores, and master arcade thrills!",
    "systemReq": "Instant play in any modern web browser. Keyboard or touch controls supported.",
    "tags": [
      "2D",
      "HTML5",
      "Retro Arcade",
      "Hardcore",
      "Arcade"
    ]
  },
  {
    "id": "game-2d-10",
    "title": "Galaxy Defense 2D",
    "category": "Platformer",
    "difficulty": "Insane",
    "isChallenging": true,
    "rating": 4.3,
    "plays": 86519,
    "rewardPoints": 50,
    "featured": true,
    "releaseYear": 2024,
    "developer": "Studio 2D Pixel #10",
    "thumbnail": "https://images.unsplash.com/photo-1579373903781-fd5c0c30c4cd?auto=format&fit=crop&w=800&q=80",
    "banner": "https://images.unsplash.com/photo-1579373903781-fd5c0c30c4cd?auto=format&fit=crop&w=800&q=80",
    "playUrl": "https://play2048.co/",
    "isPlayableWeb": true,
    "platforms": [
      "Web",
      "PC",
      "Console"
    ],
    "description": "Experience exhilarating 2D HTML action in Galaxy Defense 2D. Dodge hazards, beat high scores, and master arcade thrills!",
    "systemReq": "Instant play in any modern web browser. Keyboard or touch controls supported.",
    "tags": [
      "2D",
      "HTML5",
      "Platformer",
      "Insane",
      "Arcade"
    ]
  },
  {
    "id": "game-2d-11",
    "title": "2048 Cyber Grid",
    "category": "Puzzle & Brain",
    "difficulty": "Casual",
    "isChallenging": false,
    "rating": 4.4,
    "plays": 93910,
    "rewardPoints": 100,
    "featured": false,
    "releaseYear": 2020,
    "developer": "Studio 2D Pixel #11",
    "thumbnail": "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80",
    "banner": "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80",
    "playUrl": "https://hextris.io/",
    "isPlayableWeb": true,
    "platforms": [
      "Web",
      "PC",
      "Mobile"
    ],
    "description": "Experience exhilarating 2D HTML action in 2048 Cyber Grid. Dodge hazards, beat high scores, and master arcade thrills!",
    "systemReq": "Instant play in any modern web browser. Keyboard or touch controls supported.",
    "tags": [
      "2D",
      "HTML5",
      "Puzzle & Brain",
      "Casual",
      "Arcade"
    ]
  },
  {
    "id": "game-2d-12",
    "title": "Pac-Man Classic 2D",
    "category": "Infinite Runner",
    "difficulty": "Medium",
    "isChallenging": false,
    "rating": 4.5,
    "plays": 101301,
    "rewardPoints": 150,
    "featured": false,
    "releaseYear": 2021,
    "developer": "Studio 2D Pixel #12",
    "thumbnail": "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=800&q=80",
    "banner": "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=800&q=80",
    "playUrl": "https://freepacman.org/",
    "isPlayableWeb": true,
    "platforms": [
      "Web",
      "PC",
      "Console"
    ],
    "description": "Experience exhilarating 2D HTML action in Pac-Man Classic 2D. Dodge hazards, beat high scores, and master arcade thrills!",
    "systemReq": "Instant play in any modern web browser. Keyboard or touch controls supported.",
    "tags": [
      "2D",
      "HTML5",
      "Infinite Runner",
      "Medium",
      "Arcade"
    ]
  },
  {
    "id": "game-2d-13",
    "title": "Snake Quantum",
    "category": "2D Shooter",
    "difficulty": "Challenging",
    "isChallenging": true,
    "rating": 4.6,
    "plays": 108692,
    "rewardPoints": 200,
    "featured": true,
    "releaseYear": 2022,
    "developer": "Studio 2D Pixel #1",
    "thumbnail": "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=800&q=80",
    "banner": "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=800&q=80",
    "playUrl": "https://play2048.co/",
    "isPlayableWeb": true,
    "platforms": [
      "Web",
      "PC",
      "Mobile"
    ],
    "description": "Experience exhilarating 2D HTML action in Snake Quantum. Dodge hazards, beat high scores, and master arcade thrills!",
    "systemReq": "Instant play in any modern web browser. Keyboard or touch controls supported.",
    "tags": [
      "2D",
      "HTML5",
      "2D Shooter",
      "Challenging",
      "Arcade"
    ]
  },
  {
    "id": "game-2d-14",
    "title": "Super Jump Boy",
    "category": "Physics & Casual",
    "difficulty": "Hardcore",
    "isChallenging": true,
    "rating": 4.7,
    "plays": 116083,
    "rewardPoints": 250,
    "featured": true,
    "releaseYear": 2023,
    "developer": "Studio 2D Pixel #2",
    "thumbnail": "https://images.unsplash.com/photo-1614680376593-902f749f7ffc?auto=format&fit=crop&w=800&q=80",
    "banner": "https://images.unsplash.com/photo-1614680376593-902f749f7ffc?auto=format&fit=crop&w=800&q=80",
    "playUrl": "https://hextris.io/",
    "isPlayableWeb": true,
    "platforms": [
      "Web",
      "PC",
      "Console"
    ],
    "description": "Experience exhilarating 2D HTML action in Super Jump Boy. Dodge hazards, beat high scores, and master arcade thrills!",
    "systemReq": "Instant play in any modern web browser. Keyboard or touch controls supported.",
    "tags": [
      "2D",
      "HTML5",
      "Physics & Casual",
      "Hardcore",
      "Arcade"
    ]
  },
  {
    "id": "game-2d-15",
    "title": "Cut the Wire Physics",
    "category": "Action & Fighting",
    "difficulty": "Insane",
    "isChallenging": true,
    "rating": 4.8,
    "plays": 123474,
    "rewardPoints": 300,
    "featured": true,
    "releaseYear": 2024,
    "developer": "Studio 2D Pixel #3",
    "thumbnail": "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=800&q=80",
    "banner": "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=800&q=80",
    "playUrl": "https://freepacman.org/",
    "isPlayableWeb": true,
    "platforms": [
      "Web",
      "PC",
      "Mobile"
    ],
    "description": "Experience exhilarating 2D HTML action in Cut the Wire Physics. Dodge hazards, beat high scores, and master arcade thrills!",
    "systemReq": "Instant play in any modern web browser. Keyboard or touch controls supported.",
    "tags": [
      "2D",
      "HTML5",
      "Action & Fighting",
      "Insane",
      "Arcade"
    ]
  },
  {
    "id": "game-2d-16",
    "title": "Bubble Shooter Galaxy",
    "category": "Classic Strategy",
    "difficulty": "Casual",
    "isChallenging": false,
    "rating": 4.9,
    "plays": 130865,
    "rewardPoints": 350,
    "featured": false,
    "releaseYear": 2020,
    "developer": "Studio 2D Pixel #4",
    "thumbnail": "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80",
    "banner": "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80",
    "playUrl": "https://play2048.co/",
    "isPlayableWeb": true,
    "platforms": [
      "Web",
      "PC",
      "Console"
    ],
    "description": "Experience exhilarating 2D HTML action in Bubble Shooter Galaxy. Dodge hazards, beat high scores, and master arcade thrills!",
    "systemReq": "Instant play in any modern web browser. Keyboard or touch controls supported.",
    "tags": [
      "2D",
      "HTML5",
      "Classic Strategy",
      "Casual",
      "Arcade"
    ]
  },
  {
    "id": "game-2d-17",
    "title": "Zombie Pixel Siege",
    "category": "Retro Arcade",
    "difficulty": "Medium",
    "isChallenging": false,
    "rating": 4.2,
    "plays": 138256,
    "rewardPoints": 400,
    "featured": false,
    "releaseYear": 2021,
    "developer": "Studio 2D Pixel #5",
    "thumbnail": "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80",
    "banner": "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80",
    "playUrl": "https://hextris.io/",
    "isPlayableWeb": true,
    "platforms": [
      "Web",
      "PC",
      "Mobile"
    ],
    "description": "Experience exhilarating 2D HTML action in Zombie Pixel Siege. Dodge hazards, beat high scores, and master arcade thrills!",
    "systemReq": "Instant play in any modern web browser. Keyboard or touch controls supported.",
    "tags": [
      "2D",
      "HTML5",
      "Retro Arcade",
      "Medium",
      "Arcade"
    ]
  },
  {
    "id": "game-2d-18",
    "title": "Tank Wars 1990",
    "category": "Platformer",
    "difficulty": "Challenging",
    "isChallenging": true,
    "rating": 4.3,
    "plays": 145647,
    "rewardPoints": 450,
    "featured": true,
    "releaseYear": 2022,
    "developer": "Studio 2D Pixel #6",
    "thumbnail": "https://images.unsplash.com/photo-1551103782-8ab07afd45c1?auto=format&fit=crop&w=800&q=80",
    "banner": "https://images.unsplash.com/photo-1551103782-8ab07afd45c1?auto=format&fit=crop&w=800&q=80",
    "playUrl": "https://freepacman.org/",
    "isPlayableWeb": true,
    "platforms": [
      "Web",
      "PC",
      "Console"
    ],
    "description": "Experience exhilarating 2D HTML action in Tank Wars 1990. Dodge hazards, beat high scores, and master arcade thrills!",
    "systemReq": "Instant play in any modern web browser. Keyboard or touch controls supported.",
    "tags": [
      "2D",
      "HTML5",
      "Platformer",
      "Challenging",
      "Arcade"
    ]
  },
  {
    "id": "game-2d-19",
    "title": "Crossy Frog 2D",
    "category": "Puzzle & Brain",
    "difficulty": "Hardcore",
    "isChallenging": true,
    "rating": 4.4,
    "plays": 153038,
    "rewardPoints": 50,
    "featured": true,
    "releaseYear": 2023,
    "developer": "Studio 2D Pixel #7",
    "thumbnail": "https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=800&q=80",
    "banner": "https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=800&q=80",
    "playUrl": "https://play2048.co/",
    "isPlayableWeb": true,
    "platforms": [
      "Web",
      "PC",
      "Mobile"
    ],
    "description": "Experience exhilarating 2D HTML action in Crossy Frog 2D. Dodge hazards, beat high scores, and master arcade thrills!",
    "systemReq": "Instant play in any modern web browser. Keyboard or touch controls supported.",
    "tags": [
      "2D",
      "HTML5",
      "Puzzle & Brain",
      "Hardcore",
      "Arcade"
    ]
  },
  {
    "id": "game-2d-20",
    "title": "Ninja Dash Katana",
    "category": "Infinite Runner",
    "difficulty": "Insane",
    "isChallenging": true,
    "rating": 4.5,
    "plays": 160429,
    "rewardPoints": 100,
    "featured": true,
    "releaseYear": 2024,
    "developer": "Studio 2D Pixel #8",
    "thumbnail": "https://images.unsplash.com/photo-1579373903781-fd5c0c30c4cd?auto=format&fit=crop&w=800&q=80",
    "banner": "https://images.unsplash.com/photo-1579373903781-fd5c0c30c4cd?auto=format&fit=crop&w=800&q=80",
    "playUrl": "https://hextris.io/",
    "isPlayableWeb": true,
    "platforms": [
      "Web",
      "PC",
      "Console"
    ],
    "description": "Experience exhilarating 2D HTML action in Ninja Dash Katana. Dodge hazards, beat high scores, and master arcade thrills!",
    "systemReq": "Instant play in any modern web browser. Keyboard or touch controls supported.",
    "tags": [
      "2D",
      "HTML5",
      "Infinite Runner",
      "Insane",
      "Arcade"
    ]
  },
  {
    "id": "game-2d-21",
    "title": "Minesweeper Ultra",
    "category": "2D Shooter",
    "difficulty": "Casual",
    "isChallenging": false,
    "rating": 4.6,
    "plays": 167820,
    "rewardPoints": 150,
    "featured": false,
    "releaseYear": 2020,
    "developer": "Studio 2D Pixel #9",
    "thumbnail": "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80",
    "banner": "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80",
    "playUrl": "https://freepacman.org/",
    "isPlayableWeb": true,
    "platforms": [
      "Web",
      "PC",
      "Mobile"
    ],
    "description": "Experience exhilarating 2D HTML action in Minesweeper Ultra. Dodge hazards, beat high scores, and master arcade thrills!",
    "systemReq": "Instant play in any modern web browser. Keyboard or touch controls supported.",
    "tags": [
      "2D",
      "HTML5",
      "2D Shooter",
      "Casual",
      "Arcade"
    ]
  },
  {
    "id": "game-2d-22",
    "title": "Asteroid Blaster X",
    "category": "Physics & Casual",
    "difficulty": "Medium",
    "isChallenging": false,
    "rating": 4.7,
    "plays": 175211,
    "rewardPoints": 200,
    "featured": false,
    "releaseYear": 2021,
    "developer": "Studio 2D Pixel #10",
    "thumbnail": "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=800&q=80",
    "banner": "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=800&q=80",
    "playUrl": "https://play2048.co/",
    "isPlayableWeb": true,
    "platforms": [
      "Web",
      "PC",
      "Console"
    ],
    "description": "Experience exhilarating 2D HTML action in Asteroid Blaster X. Dodge hazards, beat high scores, and master arcade thrills!",
    "systemReq": "Instant play in any modern web browser. Keyboard or touch controls supported.",
    "tags": [
      "2D",
      "HTML5",
      "Physics & Casual",
      "Medium",
      "Arcade"
    ]
  },
  {
    "id": "game-2d-23",
    "title": "Pinball Cyber Blitz",
    "category": "Action & Fighting",
    "difficulty": "Challenging",
    "isChallenging": true,
    "rating": 4.8,
    "plays": 182602,
    "rewardPoints": 250,
    "featured": true,
    "releaseYear": 2022,
    "developer": "Studio 2D Pixel #11",
    "thumbnail": "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=800&q=80",
    "banner": "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=800&q=80",
    "playUrl": "https://hextris.io/",
    "isPlayableWeb": true,
    "platforms": [
      "Web",
      "PC",
      "Mobile"
    ],
    "description": "Experience exhilarating 2D HTML action in Pinball Cyber Blitz. Dodge hazards, beat high scores, and master arcade thrills!",
    "systemReq": "Instant play in any modern web browser. Keyboard or touch controls supported.",
    "tags": [
      "2D",
      "HTML5",
      "Action & Fighting",
      "Challenging",
      "Arcade"
    ]
  },
  {
    "id": "game-2d-24",
    "title": "Geometry Dash Neo",
    "category": "Classic Strategy",
    "difficulty": "Hardcore",
    "isChallenging": true,
    "rating": 4.9,
    "plays": 189993,
    "rewardPoints": 300,
    "featured": true,
    "releaseYear": 2023,
    "developer": "Studio 2D Pixel #12",
    "thumbnail": "https://images.unsplash.com/photo-1614680376593-902f749f7ffc?auto=format&fit=crop&w=800&q=80",
    "banner": "https://images.unsplash.com/photo-1614680376593-902f749f7ffc?auto=format&fit=crop&w=800&q=80",
    "playUrl": "https://freepacman.org/",
    "isPlayableWeb": true,
    "platforms": [
      "Web",
      "PC",
      "Console"
    ],
    "description": "Experience exhilarating 2D HTML action in Geometry Dash Neo. Dodge hazards, beat high scores, and master arcade thrills!",
    "systemReq": "Instant play in any modern web browser. Keyboard or touch controls supported.",
    "tags": [
      "2D",
      "HTML5",
      "Classic Strategy",
      "Hardcore",
      "Arcade"
    ]
  },
  {
    "id": "game-2d-25",
    "title": "Tower Defense 2D",
    "category": "Retro Arcade",
    "difficulty": "Insane",
    "isChallenging": true,
    "rating": 4.2,
    "plays": 197384,
    "rewardPoints": 350,
    "featured": true,
    "releaseYear": 2024,
    "developer": "Studio 2D Pixel #1",
    "thumbnail": "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=800&q=80",
    "banner": "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=800&q=80",
    "playUrl": "https://play2048.co/",
    "isPlayableWeb": true,
    "platforms": [
      "Web",
      "PC",
      "Mobile"
    ],
    "description": "Experience exhilarating 2D HTML action in Tower Defense 2D. Dodge hazards, beat high scores, and master arcade thrills!",
    "systemReq": "Instant play in any modern web browser. Keyboard or touch controls supported.",
    "tags": [
      "2D",
      "HTML5",
      "Retro Arcade",
      "Insane",
      "Arcade"
    ]
  },
  {
    "id": "game-2d-26",
    "title": "Doodle Bounce Hero",
    "category": "Platformer",
    "difficulty": "Casual",
    "isChallenging": false,
    "rating": 4.3,
    "plays": 204775,
    "rewardPoints": 400,
    "featured": false,
    "releaseYear": 2020,
    "developer": "Studio 2D Pixel #2",
    "thumbnail": "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80",
    "banner": "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80",
    "playUrl": "https://hextris.io/",
    "isPlayableWeb": true,
    "platforms": [
      "Web",
      "PC",
      "Console"
    ],
    "description": "Experience exhilarating 2D HTML action in Doodle Bounce Hero. Dodge hazards, beat high scores, and master arcade thrills!",
    "systemReq": "Instant play in any modern web browser. Keyboard or touch controls supported.",
    "tags": [
      "2D",
      "HTML5",
      "Platformer",
      "Casual",
      "Arcade"
    ]
  },
  {
    "id": "game-2d-27",
    "title": "Angry Slingshot Birds",
    "category": "Puzzle & Brain",
    "difficulty": "Medium",
    "isChallenging": false,
    "rating": 4.4,
    "plays": 212166,
    "rewardPoints": 450,
    "featured": false,
    "releaseYear": 2021,
    "developer": "Studio 2D Pixel #3",
    "thumbnail": "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80",
    "banner": "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80",
    "playUrl": "https://freepacman.org/",
    "isPlayableWeb": true,
    "platforms": [
      "Web",
      "PC",
      "Mobile"
    ],
    "description": "Experience exhilarating 2D HTML action in Angry Slingshot Birds. Dodge hazards, beat high scores, and master arcade thrills!",
    "systemReq": "Instant play in any modern web browser. Keyboard or touch controls supported.",
    "tags": [
      "2D",
      "HTML5",
      "Puzzle & Brain",
      "Medium",
      "Arcade"
    ]
  },
  {
    "id": "game-2d-28",
    "title": "Street Brawler Pixel",
    "category": "Infinite Runner",
    "difficulty": "Challenging",
    "isChallenging": true,
    "rating": 4.5,
    "plays": 219557,
    "rewardPoints": 50,
    "featured": true,
    "releaseYear": 2022,
    "developer": "Studio 2D Pixel #4",
    "thumbnail": "https://images.unsplash.com/photo-1551103782-8ab07afd45c1?auto=format&fit=crop&w=800&q=80",
    "banner": "https://images.unsplash.com/photo-1551103782-8ab07afd45c1?auto=format&fit=crop&w=800&q=80",
    "playUrl": "https://play2048.co/",
    "isPlayableWeb": true,
    "platforms": [
      "Web",
      "PC",
      "Console"
    ],
    "description": "Experience exhilarating 2D HTML action in Street Brawler Pixel. Dodge hazards, beat high scores, and master arcade thrills!",
    "systemReq": "Instant play in any modern web browser. Keyboard or touch controls supported.",
    "tags": [
      "2D",
      "HTML5",
      "Infinite Runner",
      "Challenging",
      "Arcade"
    ]
  },
  {
    "id": "game-2d-29",
    "title": "Ludo Master 2D",
    "category": "2D Shooter",
    "difficulty": "Hardcore",
    "isChallenging": true,
    "rating": 4.6,
    "plays": 226948,
    "rewardPoints": 100,
    "featured": true,
    "releaseYear": 2023,
    "developer": "Studio 2D Pixel #5",
    "thumbnail": "https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=800&q=80",
    "banner": "https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=800&q=80",
    "playUrl": "https://hextris.io/",
    "isPlayableWeb": true,
    "platforms": [
      "Web",
      "PC",
      "Mobile"
    ],
    "description": "Experience exhilarating 2D HTML action in Ludo Master 2D. Dodge hazards, beat high scores, and master arcade thrills!",
    "systemReq": "Instant play in any modern web browser. Keyboard or touch controls supported.",
    "tags": [
      "2D",
      "HTML5",
      "2D Shooter",
      "Hardcore",
      "Arcade"
    ]
  },
  {
    "id": "game-2d-30",
    "title": "Chess Grandmaster 2D",
    "category": "Physics & Casual",
    "difficulty": "Insane",
    "isChallenging": true,
    "rating": 4.7,
    "plays": 234339,
    "rewardPoints": 150,
    "featured": true,
    "releaseYear": 2024,
    "developer": "Studio 2D Pixel #6",
    "thumbnail": "https://images.unsplash.com/photo-1579373903781-fd5c0c30c4cd?auto=format&fit=crop&w=800&q=80",
    "banner": "https://images.unsplash.com/photo-1579373903781-fd5c0c30c4cd?auto=format&fit=crop&w=800&q=80",
    "playUrl": "https://freepacman.org/",
    "isPlayableWeb": true,
    "platforms": [
      "Web",
      "PC",
      "Console"
    ],
    "description": "Experience exhilarating 2D HTML action in Chess Grandmaster 2D. Dodge hazards, beat high scores, and master arcade thrills!",
    "systemReq": "Instant play in any modern web browser. Keyboard or touch controls supported.",
    "tags": [
      "2D",
      "HTML5",
      "Physics & Casual",
      "Insane",
      "Arcade"
    ]
  },
  {
    "id": "game-2d-31",
    "title": "Hextris Hexagonal Reflex",
    "category": "Action & Fighting",
    "difficulty": "Casual",
    "isChallenging": false,
    "rating": 4.8,
    "plays": 241730,
    "rewardPoints": 200,
    "featured": false,
    "releaseYear": 2020,
    "developer": "Studio 2D Pixel #7",
    "thumbnail": "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80",
    "banner": "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80",
    "playUrl": "https://play2048.co/",
    "isPlayableWeb": true,
    "platforms": [
      "Web",
      "PC",
      "Mobile"
    ],
    "description": "Experience exhilarating 2D HTML action in Hextris Hexagonal Reflex. Dodge hazards, beat high scores, and master arcade thrills!",
    "systemReq": "Instant play in any modern web browser. Keyboard or touch controls supported.",
    "tags": [
      "2D",
      "HTML5",
      "Action & Fighting",
      "Casual",
      "Arcade"
    ]
  },
  {
    "id": "game-2d-32",
    "title": "Pixel Dungeon Crawler",
    "category": "Classic Strategy",
    "difficulty": "Medium",
    "isChallenging": false,
    "rating": 4.9,
    "plays": 249121,
    "rewardPoints": 250,
    "featured": false,
    "releaseYear": 2021,
    "developer": "Studio 2D Pixel #8",
    "thumbnail": "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=800&q=80",
    "banner": "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=800&q=80",
    "playUrl": "https://hextris.io/",
    "isPlayableWeb": true,
    "platforms": [
      "Web",
      "PC",
      "Console"
    ],
    "description": "Experience exhilarating 2D HTML action in Pixel Dungeon Crawler. Dodge hazards, beat high scores, and master arcade thrills!",
    "systemReq": "Instant play in any modern web browser. Keyboard or touch controls supported.",
    "tags": [
      "2D",
      "HTML5",
      "Classic Strategy",
      "Medium",
      "Arcade"
    ]
  },
  {
    "id": "game-2d-33",
    "title": "Alien Invaders Strike",
    "category": "Retro Arcade",
    "difficulty": "Challenging",
    "isChallenging": true,
    "rating": 4.2,
    "plays": 256512,
    "rewardPoints": 300,
    "featured": true,
    "releaseYear": 2022,
    "developer": "Studio 2D Pixel #9",
    "thumbnail": "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=800&q=80",
    "banner": "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=800&q=80",
    "playUrl": "https://freepacman.org/",
    "isPlayableWeb": true,
    "platforms": [
      "Web",
      "PC",
      "Mobile"
    ],
    "description": "Experience exhilarating 2D HTML action in Alien Invaders Strike. Dodge hazards, beat high scores, and master arcade thrills!",
    "systemReq": "Instant play in any modern web browser. Keyboard or touch controls supported.",
    "tags": [
      "2D",
      "HTML5",
      "Retro Arcade",
      "Challenging",
      "Arcade"
    ]
  },
  {
    "id": "game-2d-34",
    "title": "Subway Pixel Skater",
    "category": "Platformer",
    "difficulty": "Hardcore",
    "isChallenging": true,
    "rating": 4.3,
    "plays": 263903,
    "rewardPoints": 350,
    "featured": true,
    "releaseYear": 2023,
    "developer": "Studio 2D Pixel #10",
    "thumbnail": "https://images.unsplash.com/photo-1614680376593-902f749f7ffc?auto=format&fit=crop&w=800&q=80",
    "banner": "https://images.unsplash.com/photo-1614680376593-902f749f7ffc?auto=format&fit=crop&w=800&q=80",
    "playUrl": "https://play2048.co/",
    "isPlayableWeb": true,
    "platforms": [
      "Web",
      "PC",
      "Console"
    ],
    "description": "Experience exhilarating 2D HTML action in Subway Pixel Skater. Dodge hazards, beat high scores, and master arcade thrills!",
    "systemReq": "Instant play in any modern web browser. Keyboard or touch controls supported.",
    "tags": [
      "2D",
      "HTML5",
      "Platformer",
      "Hardcore",
      "Arcade"
    ]
  },
  {
    "id": "game-2d-35",
    "title": "Mega Mega Man 2D",
    "category": "Puzzle & Brain",
    "difficulty": "Insane",
    "isChallenging": true,
    "rating": 4.4,
    "plays": 271294,
    "rewardPoints": 400,
    "featured": true,
    "releaseYear": 2024,
    "developer": "Studio 2D Pixel #11",
    "thumbnail": "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=800&q=80",
    "banner": "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=800&q=80",
    "playUrl": "https://hextris.io/",
    "isPlayableWeb": true,
    "platforms": [
      "Web",
      "PC",
      "Mobile"
    ],
    "description": "Experience exhilarating 2D HTML action in Mega Mega Man 2D. Dodge hazards, beat high scores, and master arcade thrills!",
    "systemReq": "Instant play in any modern web browser. Keyboard or touch controls supported.",
    "tags": [
      "2D",
      "HTML5",
      "Puzzle & Brain",
      "Insane",
      "Arcade"
    ]
  },
  {
    "id": "game-2d-36",
    "title": "Candy Crush 2D Blitz",
    "category": "Infinite Runner",
    "difficulty": "Casual",
    "isChallenging": false,
    "rating": 4.5,
    "plays": 278685,
    "rewardPoints": 450,
    "featured": false,
    "releaseYear": 2020,
    "developer": "Studio 2D Pixel #12",
    "thumbnail": "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80",
    "banner": "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80",
    "playUrl": "https://freepacman.org/",
    "isPlayableWeb": true,
    "platforms": [
      "Web",
      "PC",
      "Console"
    ],
    "description": "Experience exhilarating 2D HTML action in Candy Crush 2D Blitz. Dodge hazards, beat high scores, and master arcade thrills!",
    "systemReq": "Instant play in any modern web browser. Keyboard or touch controls supported.",
    "tags": [
      "2D",
      "HTML5",
      "Infinite Runner",
      "Casual",
      "Arcade"
    ]
  },
  {
    "id": "game-2d-37",
    "title": "Fruit Ninja Blade",
    "category": "2D Shooter",
    "difficulty": "Medium",
    "isChallenging": false,
    "rating": 4.6,
    "plays": 286076,
    "rewardPoints": 50,
    "featured": false,
    "releaseYear": 2021,
    "developer": "Studio 2D Pixel #1",
    "thumbnail": "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80",
    "banner": "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80",
    "playUrl": "https://play2048.co/",
    "isPlayableWeb": true,
    "platforms": [
      "Web",
      "PC",
      "Mobile"
    ],
    "description": "Experience exhilarating 2D HTML action in Fruit Ninja Blade. Dodge hazards, beat high scores, and master arcade thrills!",
    "systemReq": "Instant play in any modern web browser. Keyboard or touch controls supported.",
    "tags": [
      "2D",
      "HTML5",
      "2D Shooter",
      "Medium",
      "Arcade"
    ]
  },
  {
    "id": "game-2d-38",
    "title": "Temple Runner 2D",
    "category": "Physics & Casual",
    "difficulty": "Challenging",
    "isChallenging": true,
    "rating": 4.7,
    "plays": 293467,
    "rewardPoints": 100,
    "featured": true,
    "releaseYear": 2022,
    "developer": "Studio 2D Pixel #2",
    "thumbnail": "https://images.unsplash.com/photo-1551103782-8ab07afd45c1?auto=format&fit=crop&w=800&q=80",
    "banner": "https://images.unsplash.com/photo-1551103782-8ab07afd45c1?auto=format&fit=crop&w=800&q=80",
    "playUrl": "https://hextris.io/",
    "isPlayableWeb": true,
    "platforms": [
      "Web",
      "PC",
      "Console"
    ],
    "description": "Experience exhilarating 2D HTML action in Temple Runner 2D. Dodge hazards, beat high scores, and master arcade thrills!",
    "systemReq": "Instant play in any modern web browser. Keyboard or touch controls supported.",
    "tags": [
      "2D",
      "HTML5",
      "Physics & Casual",
      "Challenging",
      "Arcade"
    ]
  },
  {
    "id": "game-2d-39",
    "title": "Stickman Hook Swing",
    "category": "Action & Fighting",
    "difficulty": "Hardcore",
    "isChallenging": true,
    "rating": 4.8,
    "plays": 300858,
    "rewardPoints": 150,
    "featured": true,
    "releaseYear": 2023,
    "developer": "Studio 2D Pixel #3",
    "thumbnail": "https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=800&q=80",
    "banner": "https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=800&q=80",
    "playUrl": "https://freepacman.org/",
    "isPlayableWeb": true,
    "platforms": [
      "Web",
      "PC",
      "Mobile"
    ],
    "description": "Experience exhilarating 2D HTML action in Stickman Hook Swing. Dodge hazards, beat high scores, and master arcade thrills!",
    "systemReq": "Instant play in any modern web browser. Keyboard or touch controls supported.",
    "tags": [
      "2D",
      "HTML5",
      "Action & Fighting",
      "Hardcore",
      "Arcade"
    ]
  },
  {
    "id": "game-2d-40",
    "title": "Hill Climb 2D Pixel",
    "category": "Classic Strategy",
    "difficulty": "Insane",
    "isChallenging": true,
    "rating": 4.9,
    "plays": 308249,
    "rewardPoints": 200,
    "featured": true,
    "releaseYear": 2024,
    "developer": "Studio 2D Pixel #4",
    "thumbnail": "https://images.unsplash.com/photo-1579373903781-fd5c0c30c4cd?auto=format&fit=crop&w=800&q=80",
    "banner": "https://images.unsplash.com/photo-1579373903781-fd5c0c30c4cd?auto=format&fit=crop&w=800&q=80",
    "playUrl": "https://play2048.co/",
    "isPlayableWeb": true,
    "platforms": [
      "Web",
      "PC",
      "Console"
    ],
    "description": "Experience exhilarating 2D HTML action in Hill Climb 2D Pixel. Dodge hazards, beat high scores, and master arcade thrills!",
    "systemReq": "Instant play in any modern web browser. Keyboard or touch controls supported.",
    "tags": [
      "2D",
      "HTML5",
      "Classic Strategy",
      "Insane",
      "Arcade"
    ]
  },
  {
    "id": "game-2d-41",
    "title": "Badland Shadow Forest",
    "category": "Retro Arcade",
    "difficulty": "Casual",
    "isChallenging": false,
    "rating": 4.2,
    "plays": 315640,
    "rewardPoints": 250,
    "featured": false,
    "releaseYear": 2020,
    "developer": "Studio 2D Pixel #5",
    "thumbnail": "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80",
    "banner": "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80",
    "playUrl": "https://hextris.io/",
    "isPlayableWeb": true,
    "platforms": [
      "Web",
      "PC",
      "Mobile"
    ],
    "description": "Experience exhilarating 2D HTML action in Badland Shadow Forest. Dodge hazards, beat high scores, and master arcade thrills!",
    "systemReq": "Instant play in any modern web browser. Keyboard or touch controls supported.",
    "tags": [
      "2D",
      "HTML5",
      "Retro Arcade",
      "Casual",
      "Arcade"
    ]
  },
  {
    "id": "game-2d-42",
    "title": "Limbo Nightmare 2D",
    "category": "Platformer",
    "difficulty": "Medium",
    "isChallenging": false,
    "rating": 4.3,
    "plays": 323031,
    "rewardPoints": 300,
    "featured": false,
    "releaseYear": 2021,
    "developer": "Studio 2D Pixel #6",
    "thumbnail": "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=800&q=80",
    "banner": "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=800&q=80",
    "playUrl": "https://freepacman.org/",
    "isPlayableWeb": true,
    "platforms": [
      "Web",
      "PC",
      "Console"
    ],
    "description": "Experience exhilarating 2D HTML action in Limbo Nightmare 2D. Dodge hazards, beat high scores, and master arcade thrills!",
    "systemReq": "Instant play in any modern web browser. Keyboard or touch controls supported.",
    "tags": [
      "2D",
      "HTML5",
      "Platformer",
      "Medium",
      "Arcade"
    ]
  },
  {
    "id": "game-2d-43",
    "title": "Vampire Pixel Survivors",
    "category": "Puzzle & Brain",
    "difficulty": "Challenging",
    "isChallenging": true,
    "rating": 4.4,
    "plays": 330422,
    "rewardPoints": 350,
    "featured": true,
    "releaseYear": 2022,
    "developer": "Studio 2D Pixel #7",
    "thumbnail": "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=800&q=80",
    "banner": "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=800&q=80",
    "playUrl": "https://play2048.co/",
    "isPlayableWeb": true,
    "platforms": [
      "Web",
      "PC",
      "Mobile"
    ],
    "description": "Experience exhilarating 2D HTML action in Vampire Pixel Survivors. Dodge hazards, beat high scores, and master arcade thrills!",
    "systemReq": "Instant play in any modern web browser. Keyboard or touch controls supported.",
    "tags": [
      "2D",
      "HTML5",
      "Puzzle & Brain",
      "Challenging",
      "Arcade"
    ]
  },
  {
    "id": "game-2d-44",
    "title": "Dead Cells Micro",
    "category": "Infinite Runner",
    "difficulty": "Hardcore",
    "isChallenging": true,
    "rating": 4.5,
    "plays": 337813,
    "rewardPoints": 400,
    "featured": true,
    "releaseYear": 2023,
    "developer": "Studio 2D Pixel #8",
    "thumbnail": "https://images.unsplash.com/photo-1614680376593-902f749f7ffc?auto=format&fit=crop&w=800&q=80",
    "banner": "https://images.unsplash.com/photo-1614680376593-902f749f7ffc?auto=format&fit=crop&w=800&q=80",
    "playUrl": "https://hextris.io/",
    "isPlayableWeb": true,
    "platforms": [
      "Web",
      "PC",
      "Console"
    ],
    "description": "Experience exhilarating 2D HTML action in Dead Cells Micro. Dodge hazards, beat high scores, and master arcade thrills!",
    "systemReq": "Instant play in any modern web browser. Keyboard or touch controls supported.",
    "tags": [
      "2D",
      "HTML5",
      "Infinite Runner",
      "Hardcore",
      "Arcade"
    ]
  },
  {
    "id": "game-2d-45",
    "title": "Celeste Mountain Climb",
    "category": "2D Shooter",
    "difficulty": "Insane",
    "isChallenging": true,
    "rating": 4.6,
    "plays": 345204,
    "rewardPoints": 450,
    "featured": true,
    "releaseYear": 2024,
    "developer": "Studio 2D Pixel #9",
    "thumbnail": "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=800&q=80",
    "banner": "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=800&q=80",
    "playUrl": "https://freepacman.org/",
    "isPlayableWeb": true,
    "platforms": [
      "Web",
      "PC",
      "Mobile"
    ],
    "description": "Experience exhilarating 2D HTML action in Celeste Mountain Climb. Dodge hazards, beat high scores, and master arcade thrills!",
    "systemReq": "Instant play in any modern web browser. Keyboard or touch controls supported.",
    "tags": [
      "2D",
      "HTML5",
      "2D Shooter",
      "Insane",
      "Arcade"
    ]
  },
  {
    "id": "game-2d-46",
    "title": "Braid Time Rewind",
    "category": "Physics & Casual",
    "difficulty": "Casual",
    "isChallenging": false,
    "rating": 4.7,
    "plays": 352595,
    "rewardPoints": 50,
    "featured": false,
    "releaseYear": 2020,
    "developer": "Studio 2D Pixel #10",
    "thumbnail": "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80",
    "banner": "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80",
    "playUrl": "https://play2048.co/",
    "isPlayableWeb": true,
    "platforms": [
      "Web",
      "PC",
      "Console"
    ],
    "description": "Experience exhilarating 2D HTML action in Braid Time Rewind. Dodge hazards, beat high scores, and master arcade thrills!",
    "systemReq": "Instant play in any modern web browser. Keyboard or touch controls supported.",
    "tags": [
      "2D",
      "HTML5",
      "Physics & Casual",
      "Casual",
      "Arcade"
    ]
  },
  {
    "id": "game-2d-47",
    "title": "Spelunky Gold Rush",
    "category": "Action & Fighting",
    "difficulty": "Medium",
    "isChallenging": false,
    "rating": 4.8,
    "plays": 359986,
    "rewardPoints": 100,
    "featured": false,
    "releaseYear": 2021,
    "developer": "Studio 2D Pixel #11",
    "thumbnail": "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80",
    "banner": "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80",
    "playUrl": "https://hextris.io/",
    "isPlayableWeb": true,
    "platforms": [
      "Web",
      "PC",
      "Mobile"
    ],
    "description": "Experience exhilarating 2D HTML action in Spelunky Gold Rush. Dodge hazards, beat high scores, and master arcade thrills!",
    "systemReq": "Instant play in any modern web browser. Keyboard or touch controls supported.",
    "tags": [
      "2D",
      "HTML5",
      "Action & Fighting",
      "Medium",
      "Arcade"
    ]
  },
  {
    "id": "game-2d-48",
    "title": "Broforce 2D Chaos",
    "category": "Classic Strategy",
    "difficulty": "Challenging",
    "isChallenging": true,
    "rating": 4.9,
    "plays": 367377,
    "rewardPoints": 150,
    "featured": true,
    "releaseYear": 2022,
    "developer": "Studio 2D Pixel #12",
    "thumbnail": "https://images.unsplash.com/photo-1551103782-8ab07afd45c1?auto=format&fit=crop&w=800&q=80",
    "banner": "https://images.unsplash.com/photo-1551103782-8ab07afd45c1?auto=format&fit=crop&w=800&q=80",
    "playUrl": "https://freepacman.org/",
    "isPlayableWeb": true,
    "platforms": [
      "Web",
      "PC",
      "Console"
    ],
    "description": "Experience exhilarating 2D HTML action in Broforce 2D Chaos. Dodge hazards, beat high scores, and master arcade thrills!",
    "systemReq": "Instant play in any modern web browser. Keyboard or touch controls supported.",
    "tags": [
      "2D",
      "HTML5",
      "Classic Strategy",
      "Challenging",
      "Arcade"
    ]
  },
  {
    "id": "game-2d-49",
    "title": "Enter The Gungeon 2D",
    "category": "Retro Arcade",
    "difficulty": "Hardcore",
    "isChallenging": true,
    "rating": 4.2,
    "plays": 374768,
    "rewardPoints": 200,
    "featured": true,
    "releaseYear": 2023,
    "developer": "Studio 2D Pixel #1",
    "thumbnail": "https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=800&q=80",
    "banner": "https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=800&q=80",
    "playUrl": "https://play2048.co/",
    "isPlayableWeb": true,
    "platforms": [
      "Web",
      "PC",
      "Mobile"
    ],
    "description": "Experience exhilarating 2D HTML action in Enter The Gungeon 2D. Dodge hazards, beat high scores, and master arcade thrills!",
    "systemReq": "Instant play in any modern web browser. Keyboard or touch controls supported.",
    "tags": [
      "2D",
      "HTML5",
      "Retro Arcade",
      "Hardcore",
      "Arcade"
    ]
  },
  {
    "id": "game-2d-50",
    "title": "Hotline Cyber Miami",
    "category": "Platformer",
    "difficulty": "Insane",
    "isChallenging": true,
    "rating": 4.3,
    "plays": 382159,
    "rewardPoints": 250,
    "featured": true,
    "releaseYear": 2024,
    "developer": "Studio 2D Pixel #2",
    "thumbnail": "https://images.unsplash.com/photo-1579373903781-fd5c0c30c4cd?auto=format&fit=crop&w=800&q=80",
    "banner": "https://images.unsplash.com/photo-1579373903781-fd5c0c30c4cd?auto=format&fit=crop&w=800&q=80",
    "playUrl": "https://hextris.io/",
    "isPlayableWeb": true,
    "platforms": [
      "Web",
      "PC",
      "Console"
    ],
    "description": "Experience exhilarating 2D HTML action in Hotline Cyber Miami. Dodge hazards, beat high scores, and master arcade thrills!",
    "systemReq": "Instant play in any modern web browser. Keyboard or touch controls supported.",
    "tags": [
      "2D",
      "HTML5",
      "Platformer",
      "Insane",
      "Arcade"
    ]
  },
  {
    "id": "game-2d-51",
    "title": "Katana Zero Sprint",
    "category": "Puzzle & Brain",
    "difficulty": "Casual",
    "isChallenging": false,
    "rating": 4.4,
    "plays": 389550,
    "rewardPoints": 300,
    "featured": false,
    "releaseYear": 2020,
    "developer": "Studio 2D Pixel #3",
    "thumbnail": "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80",
    "banner": "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80",
    "playUrl": "https://freepacman.org/",
    "isPlayableWeb": true,
    "platforms": [
      "Web",
      "PC",
      "Mobile"
    ],
    "description": "Experience exhilarating 2D HTML action in Katana Zero Sprint. Dodge hazards, beat high scores, and master arcade thrills!",
    "systemReq": "Instant play in any modern web browser. Keyboard or touch controls supported.",
    "tags": [
      "2D",
      "HTML5",
      "Puzzle & Brain",
      "Casual",
      "Arcade"
    ]
  },
  {
    "id": "game-2d-52",
    "title": "Downwell Gravity Boots",
    "category": "Infinite Runner",
    "difficulty": "Medium",
    "isChallenging": false,
    "rating": 4.5,
    "plays": 396941,
    "rewardPoints": 350,
    "featured": false,
    "releaseYear": 2021,
    "developer": "Studio 2D Pixel #4",
    "thumbnail": "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=800&q=80",
    "banner": "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=800&q=80",
    "playUrl": "https://play2048.co/",
    "isPlayableWeb": true,
    "platforms": [
      "Web",
      "PC",
      "Console"
    ],
    "description": "Experience exhilarating 2D HTML action in Downwell Gravity Boots. Dodge hazards, beat high scores, and master arcade thrills!",
    "systemReq": "Instant play in any modern web browser. Keyboard or touch controls supported.",
    "tags": [
      "2D",
      "HTML5",
      "Infinite Runner",
      "Medium",
      "Arcade"
    ]
  },
  {
    "id": "game-2d-53",
    "title": "Cave Story Classic",
    "category": "2D Shooter",
    "difficulty": "Challenging",
    "isChallenging": true,
    "rating": 4.6,
    "plays": 404332,
    "rewardPoints": 400,
    "featured": true,
    "releaseYear": 2022,
    "developer": "Studio 2D Pixel #5",
    "thumbnail": "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=800&q=80",
    "banner": "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=800&q=80",
    "playUrl": "https://hextris.io/",
    "isPlayableWeb": true,
    "platforms": [
      "Web",
      "PC",
      "Mobile"
    ],
    "description": "Experience exhilarating 2D HTML action in Cave Story Classic. Dodge hazards, beat high scores, and master arcade thrills!",
    "systemReq": "Instant play in any modern web browser. Keyboard or touch controls supported.",
    "tags": [
      "2D",
      "HTML5",
      "2D Shooter",
      "Challenging",
      "Arcade"
    ]
  },
  {
    "id": "game-2d-54",
    "title": "Shovel Knight 2D",
    "category": "Physics & Casual",
    "difficulty": "Hardcore",
    "isChallenging": true,
    "rating": 4.7,
    "plays": 411723,
    "rewardPoints": 450,
    "featured": true,
    "releaseYear": 2023,
    "developer": "Studio 2D Pixel #6",
    "thumbnail": "https://images.unsplash.com/photo-1614680376593-902f749f7ffc?auto=format&fit=crop&w=800&q=80",
    "banner": "https://images.unsplash.com/photo-1614680376593-902f749f7ffc?auto=format&fit=crop&w=800&q=80",
    "playUrl": "https://freepacman.org/",
    "isPlayableWeb": true,
    "platforms": [
      "Web",
      "PC",
      "Console"
    ],
    "description": "Experience exhilarating 2D HTML action in Shovel Knight 2D. Dodge hazards, beat high scores, and master arcade thrills!",
    "systemReq": "Instant play in any modern web browser. Keyboard or touch controls supported.",
    "tags": [
      "2D",
      "HTML5",
      "Physics & Casual",
      "Hardcore",
      "Arcade"
    ]
  },
  {
    "id": "game-2d-55",
    "title": "Super Meat Boy Rush",
    "category": "Action & Fighting",
    "difficulty": "Insane",
    "isChallenging": true,
    "rating": 4.8,
    "plays": 419114,
    "rewardPoints": 50,
    "featured": true,
    "releaseYear": 2024,
    "developer": "Studio 2D Pixel #7",
    "thumbnail": "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=800&q=80",
    "banner": "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=800&q=80",
    "playUrl": "https://play2048.co/",
    "isPlayableWeb": true,
    "platforms": [
      "Web",
      "PC",
      "Mobile"
    ],
    "description": "Experience exhilarating 2D HTML action in Super Meat Boy Rush. Dodge hazards, beat high scores, and master arcade thrills!",
    "systemReq": "Instant play in any modern web browser. Keyboard or touch controls supported.",
    "tags": [
      "2D",
      "HTML5",
      "Action & Fighting",
      "Insane",
      "Arcade"
    ]
  },
  {
    "id": "game-2d-56",
    "title": "The Binding of Isaac 2D",
    "category": "Classic Strategy",
    "difficulty": "Casual",
    "isChallenging": false,
    "rating": 4.9,
    "plays": 426505,
    "rewardPoints": 100,
    "featured": false,
    "releaseYear": 2020,
    "developer": "Studio 2D Pixel #8",
    "thumbnail": "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80",
    "banner": "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80",
    "playUrl": "https://hextris.io/",
    "isPlayableWeb": true,
    "platforms": [
      "Web",
      "PC",
      "Console"
    ],
    "description": "Experience exhilarating 2D HTML action in The Binding of Isaac 2D. Dodge hazards, beat high scores, and master arcade thrills!",
    "systemReq": "Instant play in any modern web browser. Keyboard or touch controls supported.",
    "tags": [
      "2D",
      "HTML5",
      "Classic Strategy",
      "Casual",
      "Arcade"
    ]
  },
  {
    "id": "game-2d-57",
    "title": "Terraria Pixel World",
    "category": "Retro Arcade",
    "difficulty": "Medium",
    "isChallenging": false,
    "rating": 4.2,
    "plays": 433896,
    "rewardPoints": 150,
    "featured": false,
    "releaseYear": 2021,
    "developer": "Studio 2D Pixel #9",
    "thumbnail": "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80",
    "banner": "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80",
    "playUrl": "https://freepacman.org/",
    "isPlayableWeb": true,
    "platforms": [
      "Web",
      "PC",
      "Mobile"
    ],
    "description": "Experience exhilarating 2D HTML action in Terraria Pixel World. Dodge hazards, beat high scores, and master arcade thrills!",
    "systemReq": "Instant play in any modern web browser. Keyboard or touch controls supported.",
    "tags": [
      "2D",
      "HTML5",
      "Retro Arcade",
      "Medium",
      "Arcade"
    ]
  },
  {
    "id": "game-2d-58",
    "title": "Don't Starve 2D Wild",
    "category": "Platformer",
    "difficulty": "Challenging",
    "isChallenging": true,
    "rating": 4.3,
    "plays": 441287,
    "rewardPoints": 200,
    "featured": true,
    "releaseYear": 2022,
    "developer": "Studio 2D Pixel #10",
    "thumbnail": "https://images.unsplash.com/photo-1551103782-8ab07afd45c1?auto=format&fit=crop&w=800&q=80",
    "banner": "https://images.unsplash.com/photo-1551103782-8ab07afd45c1?auto=format&fit=crop&w=800&q=80",
    "playUrl": "https://play2048.co/",
    "isPlayableWeb": true,
    "platforms": [
      "Web",
      "PC",
      "Console"
    ],
    "description": "Experience exhilarating 2D HTML action in Don't Starve 2D Wild. Dodge hazards, beat high scores, and master arcade thrills!",
    "systemReq": "Instant play in any modern web browser. Keyboard or touch controls supported.",
    "tags": [
      "2D",
      "HTML5",
      "Platformer",
      "Challenging",
      "Arcade"
    ]
  },
  {
    "id": "game-2d-59",
    "title": "Cuphead Boss Clash",
    "category": "Puzzle & Brain",
    "difficulty": "Hardcore",
    "isChallenging": true,
    "rating": 4.4,
    "plays": 448678,
    "rewardPoints": 250,
    "featured": true,
    "releaseYear": 2023,
    "developer": "Studio 2D Pixel #11",
    "thumbnail": "https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=800&q=80",
    "banner": "https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=800&q=80",
    "playUrl": "https://hextris.io/",
    "isPlayableWeb": true,
    "platforms": [
      "Web",
      "PC",
      "Mobile"
    ],
    "description": "Experience exhilarating 2D HTML action in Cuphead Boss Clash. Dodge hazards, beat high scores, and master arcade thrills!",
    "systemReq": "Instant play in any modern web browser. Keyboard or touch controls supported.",
    "tags": [
      "2D",
      "HTML5",
      "Puzzle & Brain",
      "Hardcore",
      "Arcade"
    ]
  },
  {
    "id": "game-2d-60",
    "title": "Undertale Soul Fight",
    "category": "Infinite Runner",
    "difficulty": "Insane",
    "isChallenging": true,
    "rating": 4.5,
    "plays": 456069,
    "rewardPoints": 300,
    "featured": true,
    "releaseYear": 2024,
    "developer": "Studio 2D Pixel #12",
    "thumbnail": "https://images.unsplash.com/photo-1579373903781-fd5c0c30c4cd?auto=format&fit=crop&w=800&q=80",
    "banner": "https://images.unsplash.com/photo-1579373903781-fd5c0c30c4cd?auto=format&fit=crop&w=800&q=80",
    "playUrl": "https://freepacman.org/",
    "isPlayableWeb": true,
    "platforms": [
      "Web",
      "PC",
      "Console"
    ],
    "description": "Experience exhilarating 2D HTML action in Undertale Soul Fight. Dodge hazards, beat high scores, and master arcade thrills!",
    "systemReq": "Instant play in any modern web browser. Keyboard or touch controls supported.",
    "tags": [
      "2D",
      "HTML5",
      "Infinite Runner",
      "Insane",
      "Arcade"
    ]
  },
  {
    "id": "game-2d-61",
    "title": "Hollow Knight Micro",
    "category": "2D Shooter",
    "difficulty": "Casual",
    "isChallenging": false,
    "rating": 4.6,
    "plays": 463460,
    "rewardPoints": 350,
    "featured": false,
    "releaseYear": 2020,
    "developer": "Studio 2D Pixel #1",
    "thumbnail": "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80",
    "banner": "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80",
    "playUrl": "https://play2048.co/",
    "isPlayableWeb": true,
    "platforms": [
      "Web",
      "PC",
      "Mobile"
    ],
    "description": "Experience exhilarating 2D HTML action in Hollow Knight Micro. Dodge hazards, beat high scores, and master arcade thrills!",
    "systemReq": "Instant play in any modern web browser. Keyboard or touch controls supported.",
    "tags": [
      "2D",
      "HTML5",
      "2D Shooter",
      "Casual",
      "Arcade"
    ]
  },
  {
    "id": "game-2d-62",
    "title": "Ori Forest Spirit",
    "category": "Physics & Casual",
    "difficulty": "Medium",
    "isChallenging": false,
    "rating": 4.7,
    "plays": 20851,
    "rewardPoints": 400,
    "featured": false,
    "releaseYear": 2021,
    "developer": "Studio 2D Pixel #2",
    "thumbnail": "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=800&q=80",
    "banner": "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=800&q=80",
    "playUrl": "https://hextris.io/",
    "isPlayableWeb": true,
    "platforms": [
      "Web",
      "PC",
      "Console"
    ],
    "description": "Experience exhilarating 2D HTML action in Ori Forest Spirit. Dodge hazards, beat high scores, and master arcade thrills!",
    "systemReq": "Instant play in any modern web browser. Keyboard or touch controls supported.",
    "tags": [
      "2D",
      "HTML5",
      "Physics & Casual",
      "Medium",
      "Arcade"
    ]
  },
  {
    "id": "game-2d-63",
    "title": "Castlevania Retro Quest",
    "category": "Action & Fighting",
    "difficulty": "Challenging",
    "isChallenging": true,
    "rating": 4.8,
    "plays": 28242,
    "rewardPoints": 450,
    "featured": true,
    "releaseYear": 2022,
    "developer": "Studio 2D Pixel #3",
    "thumbnail": "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=800&q=80",
    "banner": "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=800&q=80",
    "playUrl": "https://freepacman.org/",
    "isPlayableWeb": true,
    "platforms": [
      "Web",
      "PC",
      "Mobile"
    ],
    "description": "Experience exhilarating 2D HTML action in Castlevania Retro Quest. Dodge hazards, beat high scores, and master arcade thrills!",
    "systemReq": "Instant play in any modern web browser. Keyboard or touch controls supported.",
    "tags": [
      "2D",
      "HTML5",
      "Action & Fighting",
      "Challenging",
      "Arcade"
    ]
  },
  {
    "id": "game-2d-64",
    "title": "Mega Bomberman 2D",
    "category": "Classic Strategy",
    "difficulty": "Hardcore",
    "isChallenging": true,
    "rating": 4.9,
    "plays": 35633,
    "rewardPoints": 50,
    "featured": true,
    "releaseYear": 2023,
    "developer": "Studio 2D Pixel #4",
    "thumbnail": "https://images.unsplash.com/photo-1614680376593-902f749f7ffc?auto=format&fit=crop&w=800&q=80",
    "banner": "https://images.unsplash.com/photo-1614680376593-902f749f7ffc?auto=format&fit=crop&w=800&q=80",
    "playUrl": "https://play2048.co/",
    "isPlayableWeb": true,
    "platforms": [
      "Web",
      "PC",
      "Console"
    ],
    "description": "Experience exhilarating 2D HTML action in Mega Bomberman 2D. Dodge hazards, beat high scores, and master arcade thrills!",
    "systemReq": "Instant play in any modern web browser. Keyboard or touch controls supported.",
    "tags": [
      "2D",
      "HTML5",
      "Classic Strategy",
      "Hardcore",
      "Arcade"
    ]
  },
  {
    "id": "game-2d-65",
    "title": "Galaga Starfighter",
    "category": "Retro Arcade",
    "difficulty": "Insane",
    "isChallenging": true,
    "rating": 4.2,
    "plays": 43024,
    "rewardPoints": 100,
    "featured": true,
    "releaseYear": 2024,
    "developer": "Studio 2D Pixel #5",
    "thumbnail": "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=800&q=80",
    "banner": "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=800&q=80",
    "playUrl": "https://hextris.io/",
    "isPlayableWeb": true,
    "platforms": [
      "Web",
      "PC",
      "Mobile"
    ],
    "description": "Experience exhilarating 2D HTML action in Galaga Starfighter. Dodge hazards, beat high scores, and master arcade thrills!",
    "systemReq": "Instant play in any modern web browser. Keyboard or touch controls supported.",
    "tags": [
      "2D",
      "HTML5",
      "Retro Arcade",
      "Insane",
      "Arcade"
    ]
  },
  {
    "id": "game-2d-66",
    "title": "Contra Jungle Commando",
    "category": "Platformer",
    "difficulty": "Casual",
    "isChallenging": false,
    "rating": 4.3,
    "plays": 50415,
    "rewardPoints": 150,
    "featured": false,
    "releaseYear": 2020,
    "developer": "Studio 2D Pixel #6",
    "thumbnail": "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80",
    "banner": "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80",
    "playUrl": "https://freepacman.org/",
    "isPlayableWeb": true,
    "platforms": [
      "Web",
      "PC",
      "Console"
    ],
    "description": "Experience exhilarating 2D HTML action in Contra Jungle Commando. Dodge hazards, beat high scores, and master arcade thrills!",
    "systemReq": "Instant play in any modern web browser. Keyboard or touch controls supported.",
    "tags": [
      "2D",
      "HTML5",
      "Platformer",
      "Casual",
      "Arcade"
    ]
  },
  {
    "id": "game-2d-67",
    "title": "Metal Slug 2D Tactics",
    "category": "Puzzle & Brain",
    "difficulty": "Medium",
    "isChallenging": false,
    "rating": 4.4,
    "plays": 57806,
    "rewardPoints": 200,
    "featured": false,
    "releaseYear": 2021,
    "developer": "Studio 2D Pixel #7",
    "thumbnail": "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80",
    "banner": "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80",
    "playUrl": "https://play2048.co/",
    "isPlayableWeb": true,
    "platforms": [
      "Web",
      "PC",
      "Mobile"
    ],
    "description": "Experience exhilarating 2D HTML action in Metal Slug 2D Tactics. Dodge hazards, beat high scores, and master arcade thrills!",
    "systemReq": "Instant play in any modern web browser. Keyboard or touch controls supported.",
    "tags": [
      "2D",
      "HTML5",
      "Puzzle & Brain",
      "Medium",
      "Arcade"
    ]
  },
  {
    "id": "game-2d-68",
    "title": "Golden Axe Pixel Blade",
    "category": "Infinite Runner",
    "difficulty": "Challenging",
    "isChallenging": true,
    "rating": 4.5,
    "plays": 65197,
    "rewardPoints": 250,
    "featured": true,
    "releaseYear": 2022,
    "developer": "Studio 2D Pixel #8",
    "thumbnail": "https://images.unsplash.com/photo-1551103782-8ab07afd45c1?auto=format&fit=crop&w=800&q=80",
    "banner": "https://images.unsplash.com/photo-1551103782-8ab07afd45c1?auto=format&fit=crop&w=800&q=80",
    "playUrl": "https://hextris.io/",
    "isPlayableWeb": true,
    "platforms": [
      "Web",
      "PC",
      "Console"
    ],
    "description": "Experience exhilarating 2D HTML action in Golden Axe Pixel Blade. Dodge hazards, beat high scores, and master arcade thrills!",
    "systemReq": "Instant play in any modern web browser. Keyboard or touch controls supported.",
    "tags": [
      "2D",
      "HTML5",
      "Infinite Runner",
      "Challenging",
      "Arcade"
    ]
  },
  {
    "id": "game-2d-69",
    "title": "Double Dragon Brawler",
    "category": "2D Shooter",
    "difficulty": "Hardcore",
    "isChallenging": true,
    "rating": 4.6,
    "plays": 72588,
    "rewardPoints": 300,
    "featured": true,
    "releaseYear": 2023,
    "developer": "Studio 2D Pixel #9",
    "thumbnail": "https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=800&q=80",
    "banner": "https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=800&q=80",
    "playUrl": "https://freepacman.org/",
    "isPlayableWeb": true,
    "platforms": [
      "Web",
      "PC",
      "Mobile"
    ],
    "description": "Experience exhilarating 2D HTML action in Double Dragon Brawler. Dodge hazards, beat high scores, and master arcade thrills!",
    "systemReq": "Instant play in any modern web browser. Keyboard or touch controls supported.",
    "tags": [
      "2D",
      "HTML5",
      "2D Shooter",
      "Hardcore",
      "Arcade"
    ]
  },
  {
    "id": "game-2d-70",
    "title": "Streets of Rage 2D",
    "category": "Physics & Casual",
    "difficulty": "Insane",
    "isChallenging": true,
    "rating": 4.7,
    "plays": 79979,
    "rewardPoints": 350,
    "featured": true,
    "releaseYear": 2024,
    "developer": "Studio 2D Pixel #10",
    "thumbnail": "https://images.unsplash.com/photo-1579373903781-fd5c0c30c4cd?auto=format&fit=crop&w=800&q=80",
    "banner": "https://images.unsplash.com/photo-1579373903781-fd5c0c30c4cd?auto=format&fit=crop&w=800&q=80",
    "playUrl": "https://play2048.co/",
    "isPlayableWeb": true,
    "platforms": [
      "Web",
      "PC",
      "Console"
    ],
    "description": "Experience exhilarating 2D HTML action in Streets of Rage 2D. Dodge hazards, beat high scores, and master arcade thrills!",
    "systemReq": "Instant play in any modern web browser. Keyboard or touch controls supported.",
    "tags": [
      "2D",
      "HTML5",
      "Physics & Casual",
      "Insane",
      "Arcade"
    ]
  },
  {
    "id": "game-2d-71",
    "title": "Chrono Pixel Trigger",
    "category": "Action & Fighting",
    "difficulty": "Casual",
    "isChallenging": false,
    "rating": 4.8,
    "plays": 87370,
    "rewardPoints": 400,
    "featured": false,
    "releaseYear": 2020,
    "developer": "Studio 2D Pixel #11",
    "thumbnail": "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80",
    "banner": "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80",
    "playUrl": "https://hextris.io/",
    "isPlayableWeb": true,
    "platforms": [
      "Web",
      "PC",
      "Mobile"
    ],
    "description": "Experience exhilarating 2D HTML action in Chrono Pixel Trigger. Dodge hazards, beat high scores, and master arcade thrills!",
    "systemReq": "Instant play in any modern web browser. Keyboard or touch controls supported.",
    "tags": [
      "2D",
      "HTML5",
      "Action & Fighting",
      "Casual",
      "Arcade"
    ]
  },
  {
    "id": "game-2d-72",
    "title": "Final Fantasy 2D Tactics",
    "category": "Classic Strategy",
    "difficulty": "Medium",
    "isChallenging": false,
    "rating": 4.9,
    "plays": 94761,
    "rewardPoints": 450,
    "featured": false,
    "releaseYear": 2021,
    "developer": "Studio 2D Pixel #12",
    "thumbnail": "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=800&q=80",
    "banner": "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=800&q=80",
    "playUrl": "https://freepacman.org/",
    "isPlayableWeb": true,
    "platforms": [
      "Web",
      "PC",
      "Console"
    ],
    "description": "Experience exhilarating 2D HTML action in Final Fantasy 2D Tactics. Dodge hazards, beat high scores, and master arcade thrills!",
    "systemReq": "Instant play in any modern web browser. Keyboard or touch controls supported.",
    "tags": [
      "2D",
      "HTML5",
      "Classic Strategy",
      "Medium",
      "Arcade"
    ]
  },
  {
    "id": "game-2d-73",
    "title": "Pokemon Retro Red",
    "category": "Retro Arcade",
    "difficulty": "Challenging",
    "isChallenging": true,
    "rating": 4.2,
    "plays": 102152,
    "rewardPoints": 50,
    "featured": true,
    "releaseYear": 2022,
    "developer": "Studio 2D Pixel #1",
    "thumbnail": "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=800&q=80",
    "banner": "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=800&q=80",
    "playUrl": "https://play2048.co/",
    "isPlayableWeb": true,
    "platforms": [
      "Web",
      "PC",
      "Mobile"
    ],
    "description": "Experience exhilarating 2D HTML action in Pokemon Retro Red. Dodge hazards, beat high scores, and master arcade thrills!",
    "systemReq": "Instant play in any modern web browser. Keyboard or touch controls supported.",
    "tags": [
      "2D",
      "HTML5",
      "Retro Arcade",
      "Challenging",
      "Arcade"
    ]
  },
  {
    "id": "game-2d-74",
    "title": "Zelda Minish Quest",
    "category": "Platformer",
    "difficulty": "Hardcore",
    "isChallenging": true,
    "rating": 4.3,
    "plays": 109543,
    "rewardPoints": 100,
    "featured": true,
    "releaseYear": 2023,
    "developer": "Studio 2D Pixel #2",
    "thumbnail": "https://images.unsplash.com/photo-1614680376593-902f749f7ffc?auto=format&fit=crop&w=800&q=80",
    "banner": "https://images.unsplash.com/photo-1614680376593-902f749f7ffc?auto=format&fit=crop&w=800&q=80",
    "playUrl": "https://hextris.io/",
    "isPlayableWeb": true,
    "platforms": [
      "Web",
      "PC",
      "Console"
    ],
    "description": "Experience exhilarating 2D HTML action in Zelda Minish Quest. Dodge hazards, beat high scores, and master arcade thrills!",
    "systemReq": "Instant play in any modern web browser. Keyboard or touch controls supported.",
    "tags": [
      "2D",
      "HTML5",
      "Platformer",
      "Hardcore",
      "Arcade"
    ]
  },
  {
    "id": "game-2d-75",
    "title": "Earthbound Pixel Journey",
    "category": "Puzzle & Brain",
    "difficulty": "Insane",
    "isChallenging": true,
    "rating": 4.4,
    "plays": 116934,
    "rewardPoints": 150,
    "featured": true,
    "releaseYear": 2024,
    "developer": "Studio 2D Pixel #3",
    "thumbnail": "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=800&q=80",
    "banner": "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=800&q=80",
    "playUrl": "https://freepacman.org/",
    "isPlayableWeb": true,
    "platforms": [
      "Web",
      "PC",
      "Mobile"
    ],
    "description": "Experience exhilarating 2D HTML action in Earthbound Pixel Journey. Dodge hazards, beat high scores, and master arcade thrills!",
    "systemReq": "Instant play in any modern web browser. Keyboard or touch controls supported.",
    "tags": [
      "2D",
      "HTML5",
      "Puzzle & Brain",
      "Insane",
      "Arcade"
    ]
  },
  {
    "id": "game-2d-76",
    "title": "Fire Emblem 2D Blade",
    "category": "Infinite Runner",
    "difficulty": "Casual",
    "isChallenging": false,
    "rating": 4.5,
    "plays": 124325,
    "rewardPoints": 200,
    "featured": false,
    "releaseYear": 2020,
    "developer": "Studio 2D Pixel #4",
    "thumbnail": "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80",
    "banner": "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80",
    "playUrl": "https://play2048.co/",
    "isPlayableWeb": true,
    "platforms": [
      "Web",
      "PC",
      "Console"
    ],
    "description": "Experience exhilarating 2D HTML action in Fire Emblem 2D Blade. Dodge hazards, beat high scores, and master arcade thrills!",
    "systemReq": "Instant play in any modern web browser. Keyboard or touch controls supported.",
    "tags": [
      "2D",
      "HTML5",
      "Infinite Runner",
      "Casual",
      "Arcade"
    ]
  },
  {
    "id": "game-2d-77",
    "title": "Advance Wars 2D Command",
    "category": "2D Shooter",
    "difficulty": "Medium",
    "isChallenging": false,
    "rating": 4.6,
    "plays": 131716,
    "rewardPoints": 250,
    "featured": false,
    "releaseYear": 2021,
    "developer": "Studio 2D Pixel #5",
    "thumbnail": "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80",
    "banner": "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80",
    "playUrl": "https://hextris.io/",
    "isPlayableWeb": true,
    "platforms": [
      "Web",
      "PC",
      "Mobile"
    ],
    "description": "Experience exhilarating 2D HTML action in Advance Wars 2D Command. Dodge hazards, beat high scores, and master arcade thrills!",
    "systemReq": "Instant play in any modern web browser. Keyboard or touch controls supported.",
    "tags": [
      "2D",
      "HTML5",
      "2D Shooter",
      "Medium",
      "Arcade"
    ]
  },
  {
    "id": "game-2d-78",
    "title": "Secret of Mana 2D",
    "category": "Physics & Casual",
    "difficulty": "Challenging",
    "isChallenging": true,
    "rating": 4.7,
    "plays": 139107,
    "rewardPoints": 300,
    "featured": true,
    "releaseYear": 2022,
    "developer": "Studio 2D Pixel #6",
    "thumbnail": "https://images.unsplash.com/photo-1551103782-8ab07afd45c1?auto=format&fit=crop&w=800&q=80",
    "banner": "https://images.unsplash.com/photo-1551103782-8ab07afd45c1?auto=format&fit=crop&w=800&q=80",
    "playUrl": "https://freepacman.org/",
    "isPlayableWeb": true,
    "platforms": [
      "Web",
      "PC",
      "Console"
    ],
    "description": "Experience exhilarating 2D HTML action in Secret of Mana 2D. Dodge hazards, beat high scores, and master arcade thrills!",
    "systemReq": "Instant play in any modern web browser. Keyboard or touch controls supported.",
    "tags": [
      "2D",
      "HTML5",
      "Physics & Casual",
      "Challenging",
      "Arcade"
    ]
  },
  {
    "id": "game-2d-79",
    "title": "Wonder Boy Dragon",
    "category": "Action & Fighting",
    "difficulty": "Hardcore",
    "isChallenging": true,
    "rating": 4.8,
    "plays": 146498,
    "rewardPoints": 350,
    "featured": true,
    "releaseYear": 2023,
    "developer": "Studio 2D Pixel #7",
    "thumbnail": "https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=800&q=80",
    "banner": "https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=800&q=80",
    "playUrl": "https://play2048.co/",
    "isPlayableWeb": true,
    "platforms": [
      "Web",
      "PC",
      "Mobile"
    ],
    "description": "Experience exhilarating 2D HTML action in Wonder Boy Dragon. Dodge hazards, beat high scores, and master arcade thrills!",
    "systemReq": "Instant play in any modern web browser. Keyboard or touch controls supported.",
    "tags": [
      "2D",
      "HTML5",
      "Action & Fighting",
      "Hardcore",
      "Arcade"
    ]
  },
  {
    "id": "game-2d-80",
    "title": "Metroid Zero 2D",
    "category": "Classic Strategy",
    "difficulty": "Insane",
    "isChallenging": true,
    "rating": 4.9,
    "plays": 153889,
    "rewardPoints": 400,
    "featured": true,
    "releaseYear": 2024,
    "developer": "Studio 2D Pixel #8",
    "thumbnail": "https://images.unsplash.com/photo-1579373903781-fd5c0c30c4cd?auto=format&fit=crop&w=800&q=80",
    "banner": "https://images.unsplash.com/photo-1579373903781-fd5c0c30c4cd?auto=format&fit=crop&w=800&q=80",
    "playUrl": "https://hextris.io/",
    "isPlayableWeb": true,
    "platforms": [
      "Web",
      "PC",
      "Console"
    ],
    "description": "Experience exhilarating 2D HTML action in Metroid Zero 2D. Dodge hazards, beat high scores, and master arcade thrills!",
    "systemReq": "Instant play in any modern web browser. Keyboard or touch controls supported.",
    "tags": [
      "2D",
      "HTML5",
      "Classic Strategy",
      "Insane",
      "Arcade"
    ]
  },
  {
    "id": "game-2d-81",
    "title": "Duck Hunt Retro 2D",
    "category": "Retro Arcade",
    "difficulty": "Casual",
    "isChallenging": false,
    "rating": 4.2,
    "plays": 161280,
    "rewardPoints": 450,
    "featured": false,
    "releaseYear": 2020,
    "developer": "Studio 2D Pixel #9",
    "thumbnail": "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80",
    "banner": "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80",
    "playUrl": "https://freepacman.org/",
    "isPlayableWeb": true,
    "platforms": [
      "Web",
      "PC",
      "Mobile"
    ],
    "description": "Experience exhilarating 2D HTML action in Duck Hunt Retro 2D. Dodge hazards, beat high scores, and master arcade thrills!",
    "systemReq": "Instant play in any modern web browser. Keyboard or touch controls supported.",
    "tags": [
      "2D",
      "HTML5",
      "Retro Arcade",
      "Casual",
      "Arcade"
    ]
  },
  {
    "id": "game-2d-82",
    "title": "Excitebike Stunt Rider",
    "category": "Platformer",
    "difficulty": "Medium",
    "isChallenging": false,
    "rating": 4.3,
    "plays": 168671,
    "rewardPoints": 50,
    "featured": false,
    "releaseYear": 2021,
    "developer": "Studio 2D Pixel #10",
    "thumbnail": "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=800&q=80",
    "banner": "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=800&q=80",
    "playUrl": "https://play2048.co/",
    "isPlayableWeb": true,
    "platforms": [
      "Web",
      "PC",
      "Console"
    ],
    "description": "Experience exhilarating 2D HTML action in Excitebike Stunt Rider. Dodge hazards, beat high scores, and master arcade thrills!",
    "systemReq": "Instant play in any modern web browser. Keyboard or touch controls supported.",
    "tags": [
      "2D",
      "HTML5",
      "Platformer",
      "Medium",
      "Arcade"
    ]
  },
  {
    "id": "game-2d-83",
    "title": "Paperboy Bicycle Rush",
    "category": "Puzzle & Brain",
    "difficulty": "Challenging",
    "isChallenging": true,
    "rating": 4.4,
    "plays": 176062,
    "rewardPoints": 100,
    "featured": true,
    "releaseYear": 2022,
    "developer": "Studio 2D Pixel #11",
    "thumbnail": "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=800&q=80",
    "banner": "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=800&q=80",
    "playUrl": "https://hextris.io/",
    "isPlayableWeb": true,
    "platforms": [
      "Web",
      "PC",
      "Mobile"
    ],
    "description": "Experience exhilarating 2D HTML action in Paperboy Bicycle Rush. Dodge hazards, beat high scores, and master arcade thrills!",
    "systemReq": "Instant play in any modern web browser. Keyboard or touch controls supported.",
    "tags": [
      "2D",
      "HTML5",
      "Puzzle & Brain",
      "Challenging",
      "Arcade"
    ]
  },
  {
    "id": "game-2d-84",
    "title": "Punch-Out Ring Champion",
    "category": "Infinite Runner",
    "difficulty": "Hardcore",
    "isChallenging": true,
    "rating": 4.5,
    "plays": 183453,
    "rewardPoints": 150,
    "featured": true,
    "releaseYear": 2023,
    "developer": "Studio 2D Pixel #12",
    "thumbnail": "https://images.unsplash.com/photo-1614680376593-902f749f7ffc?auto=format&fit=crop&w=800&q=80",
    "banner": "https://images.unsplash.com/photo-1614680376593-902f749f7ffc?auto=format&fit=crop&w=800&q=80",
    "playUrl": "https://freepacman.org/",
    "isPlayableWeb": true,
    "platforms": [
      "Web",
      "PC",
      "Console"
    ],
    "description": "Experience exhilarating 2D HTML action in Punch-Out Ring Champion. Dodge hazards, beat high scores, and master arcade thrills!",
    "systemReq": "Instant play in any modern web browser. Keyboard or touch controls supported.",
    "tags": [
      "2D",
      "HTML5",
      "Infinite Runner",
      "Hardcore",
      "Arcade"
    ]
  },
  {
    "id": "game-2d-85",
    "title": "Balloon Fight 2D Sky",
    "category": "2D Shooter",
    "difficulty": "Insane",
    "isChallenging": true,
    "rating": 4.6,
    "plays": 190844,
    "rewardPoints": 200,
    "featured": true,
    "releaseYear": 2024,
    "developer": "Studio 2D Pixel #1",
    "thumbnail": "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=800&q=80",
    "banner": "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=800&q=80",
    "playUrl": "https://play2048.co/",
    "isPlayableWeb": true,
    "platforms": [
      "Web",
      "PC",
      "Mobile"
    ],
    "description": "Experience exhilarating 2D HTML action in Balloon Fight 2D Sky. Dodge hazards, beat high scores, and master arcade thrills!",
    "systemReq": "Instant play in any modern web browser. Keyboard or touch controls supported.",
    "tags": [
      "2D",
      "HTML5",
      "2D Shooter",
      "Insane",
      "Arcade"
    ]
  },
  {
    "id": "game-2d-86",
    "title": "Ice Climber Mountain",
    "category": "Physics & Casual",
    "difficulty": "Casual",
    "isChallenging": false,
    "rating": 4.7,
    "plays": 198235,
    "rewardPoints": 250,
    "featured": false,
    "releaseYear": 2020,
    "developer": "Studio 2D Pixel #2",
    "thumbnail": "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80",
    "banner": "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80",
    "playUrl": "https://hextris.io/",
    "isPlayableWeb": true,
    "platforms": [
      "Web",
      "PC",
      "Console"
    ],
    "description": "Experience exhilarating 2D HTML action in Ice Climber Mountain. Dodge hazards, beat high scores, and master arcade thrills!",
    "systemReq": "Instant play in any modern web browser. Keyboard or touch controls supported.",
    "tags": [
      "2D",
      "HTML5",
      "Physics & Casual",
      "Casual",
      "Arcade"
    ]
  },
  {
    "id": "game-2d-87",
    "title": "Dig Dug Underground",
    "category": "Action & Fighting",
    "difficulty": "Medium",
    "isChallenging": false,
    "rating": 4.8,
    "plays": 205626,
    "rewardPoints": 300,
    "featured": false,
    "releaseYear": 2021,
    "developer": "Studio 2D Pixel #3",
    "thumbnail": "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80",
    "banner": "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80",
    "playUrl": "https://freepacman.org/",
    "isPlayableWeb": true,
    "platforms": [
      "Web",
      "PC",
      "Mobile"
    ],
    "description": "Experience exhilarating 2D HTML action in Dig Dug Underground. Dodge hazards, beat high scores, and master arcade thrills!",
    "systemReq": "Instant play in any modern web browser. Keyboard or touch controls supported.",
    "tags": [
      "2D",
      "HTML5",
      "Action & Fighting",
      "Medium",
      "Arcade"
    ]
  },
  {
    "id": "game-2d-88",
    "title": "Q*bert Isometric 2D",
    "category": "Classic Strategy",
    "difficulty": "Challenging",
    "isChallenging": true,
    "rating": 4.9,
    "plays": 213017,
    "rewardPoints": 350,
    "featured": true,
    "releaseYear": 2022,
    "developer": "Studio 2D Pixel #4",
    "thumbnail": "https://images.unsplash.com/photo-1551103782-8ab07afd45c1?auto=format&fit=crop&w=800&q=80",
    "banner": "https://images.unsplash.com/photo-1551103782-8ab07afd45c1?auto=format&fit=crop&w=800&q=80",
    "playUrl": "https://play2048.co/",
    "isPlayableWeb": true,
    "platforms": [
      "Web",
      "PC",
      "Console"
    ],
    "description": "Experience exhilarating 2D HTML action in Q*bert Isometric 2D. Dodge hazards, beat high scores, and master arcade thrills!",
    "systemReq": "Instant play in any modern web browser. Keyboard or touch controls supported.",
    "tags": [
      "2D",
      "HTML5",
      "Classic Strategy",
      "Challenging",
      "Arcade"
    ]
  },
  {
    "id": "game-2d-89",
    "title": "Frogger City Crossing",
    "category": "Retro Arcade",
    "difficulty": "Hardcore",
    "isChallenging": true,
    "rating": 4.2,
    "plays": 220408,
    "rewardPoints": 400,
    "featured": true,
    "releaseYear": 2023,
    "developer": "Studio 2D Pixel #5",
    "thumbnail": "https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=800&q=80",
    "banner": "https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=800&q=80",
    "playUrl": "https://hextris.io/",
    "isPlayableWeb": true,
    "platforms": [
      "Web",
      "PC",
      "Mobile"
    ],
    "description": "Experience exhilarating 2D HTML action in Frogger City Crossing. Dodge hazards, beat high scores, and master arcade thrills!",
    "systemReq": "Instant play in any modern web browser. Keyboard or touch controls supported.",
    "tags": [
      "2D",
      "HTML5",
      "Retro Arcade",
      "Hardcore",
      "Arcade"
    ]
  },
  {
    "id": "game-2d-90",
    "title": "Joust Flying Ostrich",
    "category": "Platformer",
    "difficulty": "Insane",
    "isChallenging": true,
    "rating": 4.3,
    "plays": 227799,
    "rewardPoints": 450,
    "featured": true,
    "releaseYear": 2024,
    "developer": "Studio 2D Pixel #6",
    "thumbnail": "https://images.unsplash.com/photo-1579373903781-fd5c0c30c4cd?auto=format&fit=crop&w=800&q=80",
    "banner": "https://images.unsplash.com/photo-1579373903781-fd5c0c30c4cd?auto=format&fit=crop&w=800&q=80",
    "playUrl": "https://freepacman.org/",
    "isPlayableWeb": true,
    "platforms": [
      "Web",
      "PC",
      "Console"
    ],
    "description": "Experience exhilarating 2D HTML action in Joust Flying Ostrich. Dodge hazards, beat high scores, and master arcade thrills!",
    "systemReq": "Instant play in any modern web browser. Keyboard or touch controls supported.",
    "tags": [
      "2D",
      "HTML5",
      "Platformer",
      "Insane",
      "Arcade"
    ]
  },
  {
    "id": "game-2d-91",
    "title": "Rampage City Smash",
    "category": "Puzzle & Brain",
    "difficulty": "Casual",
    "isChallenging": false,
    "rating": 4.4,
    "plays": 235190,
    "rewardPoints": 50,
    "featured": false,
    "releaseYear": 2020,
    "developer": "Studio 2D Pixel #7",
    "thumbnail": "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80",
    "banner": "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80",
    "playUrl": "https://play2048.co/",
    "isPlayableWeb": true,
    "platforms": [
      "Web",
      "PC",
      "Mobile"
    ],
    "description": "Experience exhilarating 2D HTML action in Rampage City Smash. Dodge hazards, beat high scores, and master arcade thrills!",
    "systemReq": "Instant play in any modern web browser. Keyboard or touch controls supported.",
    "tags": [
      "2D",
      "HTML5",
      "Puzzle & Brain",
      "Casual",
      "Arcade"
    ]
  },
  {
    "id": "game-2d-92",
    "title": "OutRun Highway Cruiser",
    "category": "Infinite Runner",
    "difficulty": "Medium",
    "isChallenging": false,
    "rating": 4.5,
    "plays": 242581,
    "rewardPoints": 100,
    "featured": false,
    "releaseYear": 2021,
    "developer": "Studio 2D Pixel #8",
    "thumbnail": "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=800&q=80",
    "banner": "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=800&q=80",
    "playUrl": "https://hextris.io/",
    "isPlayableWeb": true,
    "platforms": [
      "Web",
      "PC",
      "Console"
    ],
    "description": "Experience exhilarating 2D HTML action in OutRun Highway Cruiser. Dodge hazards, beat high scores, and master arcade thrills!",
    "systemReq": "Instant play in any modern web browser. Keyboard or touch controls supported.",
    "tags": [
      "2D",
      "HTML5",
      "Infinite Runner",
      "Medium",
      "Arcade"
    ]
  },
  {
    "id": "game-2d-93",
    "title": "Spy Hunter Road Chase",
    "category": "2D Shooter",
    "difficulty": "Challenging",
    "isChallenging": true,
    "rating": 4.6,
    "plays": 249972,
    "rewardPoints": 150,
    "featured": true,
    "releaseYear": 2022,
    "developer": "Studio 2D Pixel #9",
    "thumbnail": "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=800&q=80",
    "banner": "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=800&q=80",
    "playUrl": "https://freepacman.org/",
    "isPlayableWeb": true,
    "platforms": [
      "Web",
      "PC",
      "Mobile"
    ],
    "description": "Experience exhilarating 2D HTML action in Spy Hunter Road Chase. Dodge hazards, beat high scores, and master arcade thrills!",
    "systemReq": "Instant play in any modern web browser. Keyboard or touch controls supported.",
    "tags": [
      "2D",
      "HTML5",
      "2D Shooter",
      "Challenging",
      "Arcade"
    ]
  },
  {
    "id": "game-2d-94",
    "title": "Bubble Bobble Dinosaurs",
    "category": "Physics & Casual",
    "difficulty": "Hardcore",
    "isChallenging": true,
    "rating": 4.7,
    "plays": 257363,
    "rewardPoints": 200,
    "featured": true,
    "releaseYear": 2023,
    "developer": "Studio 2D Pixel #10",
    "thumbnail": "https://images.unsplash.com/photo-1614680376593-902f749f7ffc?auto=format&fit=crop&w=800&q=80",
    "banner": "https://images.unsplash.com/photo-1614680376593-902f749f7ffc?auto=format&fit=crop&w=800&q=80",
    "playUrl": "https://play2048.co/",
    "isPlayableWeb": true,
    "platforms": [
      "Web",
      "PC",
      "Console"
    ],
    "description": "Experience exhilarating 2D HTML action in Bubble Bobble Dinosaurs. Dodge hazards, beat high scores, and master arcade thrills!",
    "systemReq": "Instant play in any modern web browser. Keyboard or touch controls supported.",
    "tags": [
      "2D",
      "HTML5",
      "Physics & Casual",
      "Hardcore",
      "Arcade"
    ]
  },
  {
    "id": "game-2d-95",
    "title": "Snow Bros Snowball",
    "category": "Action & Fighting",
    "difficulty": "Insane",
    "isChallenging": true,
    "rating": 4.8,
    "plays": 264754,
    "rewardPoints": 250,
    "featured": true,
    "releaseYear": 2024,
    "developer": "Studio 2D Pixel #11",
    "thumbnail": "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=800&q=80",
    "banner": "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=800&q=80",
    "playUrl": "https://hextris.io/",
    "isPlayableWeb": true,
    "platforms": [
      "Web",
      "PC",
      "Mobile"
    ],
    "description": "Experience exhilarating 2D HTML action in Snow Bros Snowball. Dodge hazards, beat high scores, and master arcade thrills!",
    "systemReq": "Instant play in any modern web browser. Keyboard or touch controls supported.",
    "tags": [
      "2D",
      "HTML5",
      "Action & Fighting",
      "Insane",
      "Arcade"
    ]
  },
  {
    "id": "game-2d-96",
    "title": "Sunset Riders Wild West",
    "category": "Classic Strategy",
    "difficulty": "Casual",
    "isChallenging": false,
    "rating": 4.9,
    "plays": 272145,
    "rewardPoints": 300,
    "featured": false,
    "releaseYear": 2020,
    "developer": "Studio 2D Pixel #12",
    "thumbnail": "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80",
    "banner": "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80",
    "playUrl": "https://freepacman.org/",
    "isPlayableWeb": true,
    "platforms": [
      "Web",
      "PC",
      "Console"
    ],
    "description": "Experience exhilarating 2D HTML action in Sunset Riders Wild West. Dodge hazards, beat high scores, and master arcade thrills!",
    "systemReq": "Instant play in any modern web browser. Keyboard or touch controls supported.",
    "tags": [
      "2D",
      "HTML5",
      "Classic Strategy",
      "Casual",
      "Arcade"
    ]
  },
  {
    "id": "game-2d-97",
    "title": "Cadillacs & Dinosaurs 2D",
    "category": "Retro Arcade",
    "difficulty": "Medium",
    "isChallenging": false,
    "rating": 4.2,
    "plays": 279536,
    "rewardPoints": 350,
    "featured": false,
    "releaseYear": 2021,
    "developer": "Studio 2D Pixel #1",
    "thumbnail": "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80",
    "banner": "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80",
    "playUrl": "https://play2048.co/",
    "isPlayableWeb": true,
    "platforms": [
      "Web",
      "PC",
      "Mobile"
    ],
    "description": "Experience exhilarating 2D HTML action in Cadillacs & Dinosaurs 2D. Dodge hazards, beat high scores, and master arcade thrills!",
    "systemReq": "Instant play in any modern web browser. Keyboard or touch controls supported.",
    "tags": [
      "2D",
      "HTML5",
      "Retro Arcade",
      "Medium",
      "Arcade"
    ]
  },
  {
    "id": "game-2d-98",
    "title": "Captain Commando 2D",
    "category": "Platformer",
    "difficulty": "Challenging",
    "isChallenging": true,
    "rating": 4.3,
    "plays": 286927,
    "rewardPoints": 400,
    "featured": true,
    "releaseYear": 2022,
    "developer": "Studio 2D Pixel #2",
    "thumbnail": "https://images.unsplash.com/photo-1551103782-8ab07afd45c1?auto=format&fit=crop&w=800&q=80",
    "banner": "https://images.unsplash.com/photo-1551103782-8ab07afd45c1?auto=format&fit=crop&w=800&q=80",
    "playUrl": "https://hextris.io/",
    "isPlayableWeb": true,
    "platforms": [
      "Web",
      "PC",
      "Console"
    ],
    "description": "Experience exhilarating 2D HTML action in Captain Commando 2D. Dodge hazards, beat high scores, and master arcade thrills!",
    "systemReq": "Instant play in any modern web browser. Keyboard or touch controls supported.",
    "tags": [
      "2D",
      "HTML5",
      "Platformer",
      "Challenging",
      "Arcade"
    ]
  },
  {
    "id": "game-2d-99",
    "title": "Marvel Super Heroes 2D",
    "category": "Puzzle & Brain",
    "difficulty": "Hardcore",
    "isChallenging": true,
    "rating": 4.4,
    "plays": 294318,
    "rewardPoints": 450,
    "featured": true,
    "releaseYear": 2023,
    "developer": "Studio 2D Pixel #3",
    "thumbnail": "https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=800&q=80",
    "banner": "https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=800&q=80",
    "playUrl": "https://freepacman.org/",
    "isPlayableWeb": true,
    "platforms": [
      "Web",
      "PC",
      "Mobile"
    ],
    "description": "Experience exhilarating 2D HTML action in Marvel Super Heroes 2D. Dodge hazards, beat high scores, and master arcade thrills!",
    "systemReq": "Instant play in any modern web browser. Keyboard or touch controls supported.",
    "tags": [
      "2D",
      "HTML5",
      "Puzzle & Brain",
      "Hardcore",
      "Arcade"
    ]
  },
  {
    "id": "game-2d-100",
    "title": "Street Fighter II Retro",
    "category": "Infinite Runner",
    "difficulty": "Insane",
    "isChallenging": true,
    "rating": 4.5,
    "plays": 301709,
    "rewardPoints": 50,
    "featured": true,
    "releaseYear": 2024,
    "developer": "Studio 2D Pixel #4",
    "thumbnail": "https://images.unsplash.com/photo-1579373903781-fd5c0c30c4cd?auto=format&fit=crop&w=800&q=80",
    "banner": "https://images.unsplash.com/photo-1579373903781-fd5c0c30c4cd?auto=format&fit=crop&w=800&q=80",
    "playUrl": "https://play2048.co/",
    "isPlayableWeb": true,
    "platforms": [
      "Web",
      "PC",
      "Console"
    ],
    "description": "Experience exhilarating 2D HTML action in Street Fighter II Retro. Dodge hazards, beat high scores, and master arcade thrills!",
    "systemReq": "Instant play in any modern web browser. Keyboard or touch controls supported.",
    "tags": [
      "2D",
      "HTML5",
      "Infinite Runner",
      "Insane",
      "Arcade"
    ]
  }
];

const DEFAULT_PROFILE = {
  "name": "CyberPhantom",
  "tag": "#NEO2026",
  "avatar": "https://images.unsplash.com/photo-1566492031773-4f4e44671857?auto=format&fit=crop&w=300&q=80",
  "title": "2D Arcade Grandmaster",
  "bio": "Hardcore 2D gamer, speedrunner, and retro enthusiast. Mastering 100 classic HTML collections.",
  "level": 42,
  "xp": 8450,
  "maxXP": 10000,
  "coins": 2450,
  "dailyStreak": 4,
  "claimedDays": [
    1,
    2,
    3,
    4
  ],
  "lastClaimDate": "2026-09-03",
  "totalPlayed": 128,
  "winRate": 74,
  "hoursLogged": 86,
  "badges": [
    {
      "id": "b1",
      "name": "Arcade Pioneer",
      "icon": "fa-gamepad",
      "desc": "Played first 10 2D games",
      "unlocked": true,
      "date": "2026-08-12"
    },
    {
      "id": "b2",
      "name": "Pixel Slayer",
      "icon": "fa-skull",
      "desc": "Completed 5 Hardcore challenges",
      "unlocked": true,
      "date": "2026-08-18"
    },
    {
      "id": "b3",
      "name": "Daily Streak 7",
      "icon": "fa-fire",
      "desc": "Maintained 7 days login streak",
      "unlocked": true,
      "date": "2026-08-25"
    },
    {
      "id": "b4",
      "name": "Speedrunner",
      "icon": "fa-bolt",
      "desc": "Cleared a level under 60 seconds",
      "unlocked": true,
      "date": "2026-08-29"
    },
    {
      "id": "b5",
      "name": "Gift Collector",
      "icon": "fa-gift",
      "desc": "Claimed over 2,000 bonus coins",
      "unlocked": true,
      "date": "2026-09-01"
    },
    {
      "id": "b6",
      "name": "Boss Crusher",
      "icon": "fa-dragon",
      "desc": "Defeated an Insane level boss",
      "unlocked": true,
      "date": "2026-09-02"
    },
    {
      "id": "b7",
      "name": "Century Master",
      "icon": "fa-trophy",
      "desc": "Explore all 100 2D games",
      "unlocked": false,
      "date": null
    },
    {
      "id": "b8",
      "name": "Retro Royalty",
      "icon": "fa-crown",
      "desc": "Reach Level 50 in player rank",
      "unlocked": false,
      "date": null
    }
  ],
  "history": [
    {
      "gameTitle": "Pixel Knight: Shadow Dungeon",
      "category": "Platformer",
      "score": 14250,
      "coinsEarned": 150,
      "time": "20 mins ago"
    },
    {
      "gameTitle": "Cyber Runner 2099",
      "category": "Infinite Runner",
      "score": 8920,
      "coinsEarned": 100,
      "time": "2 hours ago"
    },
    {
      "gameTitle": "Neon Pong X",
      "category": "Retro Arcade",
      "score": 4500,
      "coinsEarned": 50,
      "time": "Yesterday"
    },
    {
      "gameTitle": "Geometry Dash Neo",
      "category": "Platformer",
      "score": 12100,
      "coinsEarned": 200,
      "time": "2 days ago"
    }
  ]
};

// Game Catalog Storage Helper
function getGameCatalog() {
  const stored = localStorage.getItem('nexus_gaming_catalog_v1');
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length >= 100) {
        return parsed;
      }
    } catch (e) {
      console.error('Error parsing catalog:', e);
    }
  }
  localStorage.setItem('nexus_gaming_catalog_v1', JSON.stringify(DEFAULT_GAMES));
  return DEFAULT_GAMES;
}

function saveGameCatalog(catalog) {
  localStorage.setItem('nexus_gaming_catalog_v1', JSON.stringify(catalog));
}

// Player Profile Storage Helper
function getPlayerProfile() {
  const stored = localStorage.getItem('nexus_player_profile');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error('Error parsing profile:', e);
    }
  }
  localStorage.setItem('nexus_player_profile', JSON.stringify(DEFAULT_PROFILE));
  return DEFAULT_PROFILE;
}

function savePlayerProfile(profile) {
  localStorage.setItem('nexus_player_profile', JSON.stringify(profile));
  window.dispatchEvent(new Event('player-profile-updated'));
}

function addPlayerCoins(amount) {
  const profile = getPlayerProfile();
  profile.coins = (profile.coins || 0) + amount;
  profile.xp = (profile.xp || 0) + Math.floor(amount * 1.5);
  if (profile.xp >= profile.maxXP) {
    profile.level += 1;
    profile.xp -= profile.maxXP;
    profile.maxXP = Math.floor(profile.maxXP * 1.25);
  }
  savePlayerProfile(profile);
  return profile;
}
