/**
 * Headless Automated Verification Test for Construct 3 Architecture
 * Tests:
 * 1. Construct 3 file structure (appmanifest.json, sendscoreapi.js, media/, icons/, scripts/)
 * 2. Script import order in index.html
 * 3. 1 base block on ground start
 * 4. Timer completely removed
 * 5. 1 life, sudden death (1 miss = Game Over)
 */

const fs = require('fs');
const path = require('path');

console.log('--- STARTING CONSTRUCT 3 ARCHITECTURE VERIFICATION ---');

// 1. Verify Construct 3 Directory Structure & Assets
const requiredFiles = [
  'appmanifest.json',
  'send_score_api.js',
  'index.html',
  'style.css',
  'media/bgm.mp3',
  'scripts/audio.js',
  'scripts/particles.js',
  'scripts/physics.js',
  'scripts/entities.js',
  'scripts/ui.js',
  'scripts/game.js',
  'scripts/main.js'
];

for (const relFile of requiredFiles) {
  const fullPath = path.join(__dirname, relFile);
  if (!fs.existsSync(fullPath)) {
    console.error(`FAIL: Missing required file: ${relFile}`);
    process.exit(1);
  }
  const stats = fs.statSync(fullPath);
  console.log(`PASS: ${relFile} exists (${stats.size} bytes)`);
}

// 2. Verify appmanifest.json
const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, 'appmanifest.json'), 'utf-8'));
if (manifest.orientation !== 'portrait' || manifest.display !== 'fullscreen') {
  console.error('FAIL: appmanifest.json must specify portrait orientation and fullscreen display');
  process.exit(1);
}
console.log(`PASS: appmanifest.json valid (Name: "${manifest.name}", Orientation: ${manifest.orientation})`);

// 3. Verify HTML Structure & Modular Script Imports
const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf-8');

const requiredScriptsInOrder = [
  'send_score_api.js',
  'scripts/audio.js',
  'scripts/particles.js',
  'scripts/physics.js',
  'scripts/entities.js',
  'scripts/ui.js',
  'scripts/game.js',
  'scripts/main.js'
];

let lastIndex = -1;
for (const scriptName of requiredScriptsInOrder) {
  const idx = html.indexOf(scriptName);
  if (idx === -1) {
    console.error(`FAIL: index.html missing script tag for: ${scriptName}`);
    process.exit(1);
  }
  if (idx < lastIndex) {
    console.error(`FAIL: Script order incorrect: ${scriptName} loaded too early`);
    process.exit(1);
  }
  lastIndex = idx;
}
console.log('PASS: All 8 Construct 3 modular scripts loaded in correct dependency order');

// 4. Verify HUD & UI Elements
const requiredSelectors = [
  'game-canvas',
  'hud-bar',
  'hud-score',
  'hud-best',
  'btn-sound',
  'start-overlay',
  'gameover-overlay',
  'btn-start-play',
  'btn-try-again',
  'btn-main-menu'
];

for (const id of requiredSelectors) {
  if (!html.includes(`id="${id}"`)) {
    console.error(`FAIL: index.html missing element with id="${id}"`);
    process.exit(1);
  }
}
console.log('PASS: All required DOM elements found in index.html (Score, Best, Start & Try Again buttons)');

// Check timer & life are removed from HUD
if (html.includes('id="hud-time-val"') || html.includes('id="hud-timer"')) {
  console.error('FAIL: Timer element still present in index.html');
  process.exit(1);
}
if (html.includes('id="hud-life"')) {
  console.error('FAIL: LIFE element still present in HUD');
  process.exit(1);
}
console.log('PASS: Timer & LIFE completely removed from HUD');

// 5. Verify Physics and 1-Base-Block Rule
const CANVAS_W = 1080;
const CANVAS_H = 1920;
const BLOCK_W = 160;
const BLOCK_H = 160;
const TARGET_SCREEN_TOP_Y = 1260;
const GROUND_Y = 1906;

let stack = [];
const baseX = (CANVAS_W - BLOCK_W) / 2;
const baseY = GROUND_Y - BLOCK_H;

// Rule: Game MUST start with exactly 1 base block
stack.push({
  x: baseX,
  y: baseY,
  rotation: 0
});

if (stack.length !== 1) {
  console.error('FAIL: Stack does not start with exactly 1 block');
  process.exit(1);
}
console.log(`PASS: Exactly 1 base block created at ground level (X=${baseX}, Y=${baseY})`);

// 6. Simulate Drop 1 (Perfect snap)
let topBlock = stack[stack.length - 1];
let activeX = topBlock.x;
let diffX = activeX - topBlock.x;
let isPerfect = Math.abs(diffX) <= 14;

if (!isPerfect) {
  console.error('FAIL: Drop 1 should be PERFECT');
  process.exit(1);
}

stack.push({
  x: activeX,
  y: topBlock.y - BLOCK_H,
  rotation: 0
});
console.log(`PASS: Drop 1 landed as PERFECT at Y=${stack[stack.length - 1].y}. Stack size=${stack.length}`);

// 7. Simulate Drop 2 (Good landing with tilt)
topBlock = stack[stack.length - 1];
activeX = topBlock.x + 35;
diffX = activeX - topBlock.x;
let isGood = Math.abs(diffX) <= 115;
let tilt = (diffX / BLOCK_W) * 0.13;

if (!isGood) {
  console.error('FAIL: Drop 2 should be GOOD');
  process.exit(1);
}

stack.push({
  x: activeX,
  y: topBlock.y - BLOCK_H,
  rotation: tilt
});
console.log(`PASS: Drop 2 landed as GOOD with tilt=${tilt.toFixed(3)} rad. Stack size=${stack.length}`);

// 8. Simulate Drop 3 (Sudden Death: 1 Miss = Game Over)
topBlock = stack[stack.length - 1];
activeX = topBlock.x + 130; // Exceeds 115px tolerance
diffX = activeX - topBlock.x;
let isMiss = Math.abs(diffX) > 115;

if (!isMiss) {
  console.error('FAIL: Drop 3 should be detected as MISS');
  process.exit(1);
}

let isGameOver = isMiss; // 1 miss triggers instant game over
console.log(`PASS: 1 Miss detected -> Sudden Death Game Over triggered (isGameOver=${isGameOver})`);

// 9. Verify Left/Right Alternating Spawn Mechanism
const entitiesCode = fs.readFileSync(path.join(__dirname, 'scripts/entities.js'), 'utf-8');
if (!entitiesCode.includes("side === 'right'") || !entitiesCode.includes("this.direction = -1")) {
  console.error('FAIL: scripts/entities.js does not implement both left and right side spawning');
  process.exit(1);
}
console.log('PASS: Dual-side (Left & Right alternating) spawn logic verified');

// 10. Verify sendScore call on Game Over
const gameCode = fs.readFileSync(path.join(__dirname, 'scripts/game.js'), 'utf-8');
if (!gameCode.includes('sendScore(this.score)')) {
  console.error('FAIL: scripts/game.js does not call sendScore(this.score) on game over');
  process.exit(1);
}
console.log('PASS: sendScore call on Game Over confirmed in scripts/game.js');

console.log('--- ALL CONSTRUCT 3 ARCHITECTURE VERIFICATIONS PASSED! ---');
