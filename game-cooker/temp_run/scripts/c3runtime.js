/**
 * Construct 3 Custom Runtime Engine for "Ninja River Run"
 * Layout Size: Width 1080, Height 1920
 * Follows Construct 3 Web Export Architecture
 */
'use strict';

// Polyfill CanvasRenderingContext2D.prototype.roundRect
if (typeof CanvasRenderingContext2D !== 'undefined' && !CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, radii) {
        const r = typeof radii === 'number' ? radii : 12;
        this.beginPath();
        this.moveTo(x + r, y);
        this.arcTo(x + w, y, x + w, y + h, r);
        this.arcTo(x + w, y + h, x, y + h, r);
        this.arcTo(x, y + h, x, y, r);
        this.arcTo(x, y, x + w, y, r);
        this.closePath();
        return this;
    };
}

class C3Runtime {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d', { alpha: false });
        
        // Construct 3 Target Virtual Layout Dimensions
        this.LAYOUT_WIDTH = 1080;
        this.LAYOUT_HEIGHT = 1920;
        
        // Game States
        this.STATE_MENU = 0;
        this.STATE_PLAYING = 1;
        this.STATE_PAUSED = 2;
        this.STATE_GAMEOVER = 3;
        this.state = this.STATE_MENU;
        
        // Lanes: Left (-1), Center (0), Right (1)
        this.LANE_SPACING = 280;
        this.lanes = [-this.LANE_SPACING, 0, this.LANE_SPACING];
        
        // Player properties
        this.player = {
            lane: 0,
            x: 0,
            targetX: 0,
            y: 0,
            vy: 0,
            z: 0,
            width: 110,
            height: 180,
            baseY: 0,
            isJumping: false,
            isSliding: false,
            slideTimer: 0,
            animTimer: 0,
            animFrame: 0,
            isDead: false,
            invincible: false,
            onPlatform: null // log or train
        };
        
        // World & Camera (Calibrated to match demo.mp4 perspective)
        this.speed = 950; // units per sec
        this.baseSpeed = 950;
        this.maxSpeed = 2100;
        this.distance = 0;
        this.score = 57995; // Starting base score similar to demo video!
        this.coins = 846;   // Starting coins similar to demo video!
        this.highScore = parseInt(localStorage.getItem('ninja_high_score') || '68500', 10);
        
        this.camera = {
            x: 0,
            y: 340,
            z: -280,
            targetY: 340,
            fov: 500,
            horizonY: 640
        };
        
        // Active Powerups
        this.powerups = {
            rocket: { active: false, timer: 0, duration: 8.0 },
            multiplier: { active: false, timer: 0, duration: 10.0 },
            magnet: { active: false, timer: 0, duration: 10.0 }
        };
        
        // World Objects & Spawning
        this.trackChunks = [];
        this.obstacles = [];
        this.coinsList = [];
        this.sceneryList = [];
        this.particles = [];
        this.floatingTexts = [];
        this.nextSpawnZ = 800;
        this.currentBiome = 'river'; // 'river', 'forest', 'bridge', 'train'
        this.biomeDistance = 0;
        
        // Asset Preloader
        this.images = {};
        this.assetsLoaded = false;
        
        // Audio Synthesizer
        this.audio = new ProceduralAudioEngine();
        
        // Screen Shake
        this.screenShake = 0;
        
        // Time tracking
        this.lastTime = performance.now();
        
        // Init systems
        this.initInput();
        this.loadAssets(() => {
            this.assetsLoaded = true;
            this.resetGame();
            requestAnimationFrame((t) => this.gameLoop(t));
        });
    }
    
    loadAssets(onComplete) {
        const manifest = {
            bg_forest: 'images/bg_forest_canopy.png',
            player_run_0: 'images/player_run_0.png',
            player_run_1: 'images/player_run_1.png',
            player_run_2: 'images/player_run_2.png',
            player_run_3: 'images/player_run_3.png',
            player_jump: 'images/player_jump.png',
            player_slide: 'images/player_slide.png',
            player_crash: 'images/player_crash.png',
            coin_sun_0: 'images/coin_sun_0.png',
            coin_sun_1: 'images/coin_sun_1.png',
            coin_sun_2: 'images/coin_sun_2.png',
            coin_sun_3: 'images/coin_sun_3.png',
            obstacle_hurdle: 'images/obstacle_hurdle.png',
            obstacle_barrier: 'images/obstacle_barrier.png',
            obstacle_rock: 'images/obstacle_rock.png',
            obstacle_truck: 'images/obstacle_truck.png',
            obstacle_train_wagon: 'images/obstacle_train_wagon.png',
            obstacle_ramp: 'images/obstacle_ramp.png',
            obstacle_crates: 'images/obstacle_crates.png',
            env_floating_log: 'images/env_floating_log.png',
            env_bridge_planks: 'images/env_bridge_planks.png',
            env_tree_redwood: 'images/env_tree_redwood.png',
            env_mushroom: 'images/env_mushroom.png',
            powerup_rocket: 'images/powerup_rocket.png',
            powerup_2x: 'images/powerup_2x.png',
            powerup_magnet: 'images/powerup_magnet.png',
            ui_pause: 'images/ui_pause.png',
            ui_play: 'images/ui_play.png',
            ui_restart: 'images/ui_restart.png',
            ui_sun_badge: 'images/ui_sun_badge.png',
            surface_water: 'images/surface_water.png',
            surface_dirt: 'images/surface_dirt.png',
            surface_bridge: 'images/surface_bridge.png'
        };
        
        let loadedCount = 0;
        const total = Object.keys(manifest).length;
        
        for (const [key, src] of Object.entries(manifest)) {
            const img = new Image();
            img.src = src;
            img.onload = () => {
                loadedCount++;
                if (loadedCount === total) onComplete();
            };
            img.onerror = () => {
                console.warn(`Asset failed to load: ${src}`);
                loadedCount++;
                if (loadedCount === total) onComplete();
            };
            this.images[key] = img;
        }
    }
    
    initInput() {
        // Keyboard Controls
        window.addEventListener('keydown', (e) => {
            if (this.state === this.STATE_MENU) {
                if (e.code === 'Space' || e.code === 'Enter' || e.key === 'ArrowUp') {
                    this.startGame();
                }
                return;
            }
            
            if (this.state === this.STATE_GAMEOVER) {
                if (e.code === 'Space' || e.code === 'Enter') {
                    this.resetGame();
                    this.state = this.STATE_PLAYING;
                }
                return;
            }
            
            if (e.code === 'KeyP' || e.code === 'Escape') {
                this.togglePause();
                return;
            }
            
            if (this.state !== this.STATE_PLAYING) return;
            
            if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
                this.moveLane(-1);
            } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
                this.moveLane(1);
            } else if (e.code === 'ArrowUp' || e.code === 'KeyW' || e.code === 'Space') {
                this.jump();
            } else if (e.code === 'ArrowDown' || e.code === 'KeyS') {
                this.slide();
            }
        });
        
        // Touch & Swipe Controls
        let touchStartX = 0;
        let touchStartY = 0;
        let touchStartTime = 0;
        
        const handleStart = (clientX, clientY) => {
            touchStartX = clientX;
            touchStartY = clientY;
            touchStartTime = performance.now();
            
            // Check UI button clicks
            const rect = this.canvas.getBoundingClientRect();
            const scaleX = this.LAYOUT_WIDTH / rect.width;
            const scaleY = this.LAYOUT_HEIGHT / rect.height;
            const canvasX = (clientX - rect.left) * scaleX;
            const canvasY = (clientY - rect.top) * scaleY;
            
            // Pause button at top right: (970, 45, 80, 80)
            if (canvasX >= 940 && canvasX <= 1040 && canvasY >= 30 && canvasY <= 130) {
                this.togglePause();
                return true;
            }
            
            // Menu / Game Over buttons
            if (this.state === this.STATE_MENU) {
                if (canvasY >= 1250 && canvasY <= 1450) {
                    this.startGame();
                    return true;
                }
            } else if (this.state === this.STATE_GAMEOVER) {
                if (canvasY >= 1200 && canvasY <= 1400) {
                    this.resetGame();
                    this.state = this.STATE_PLAYING;
                    return true;
                }
            } else if (this.state === this.STATE_PAUSED) {
                if (canvasY >= 850 && canvasY <= 1050) {
                    this.togglePause();
                    return true;
                }
            }
            return false;
        };
        
        const handleEnd = (clientX, clientY) => {
            if (this.state !== this.STATE_PLAYING) return;
            const dx = clientX - touchStartX;
            const dy = clientY - touchStartY;
            const dist = Math.hypot(dx, dy);
            const duration = performance.now() - touchStartTime;
            
            if (dist > 35 && duration < 600) {
                if (Math.abs(dx) > Math.abs(dy)) {
                    if (dx > 0) this.moveLane(1);
                    else this.moveLane(-1);
                } else {
                    if (dy < 0) this.jump();
                    else this.slide();
                }
            }
        };
        
        this.canvas.addEventListener('touchstart', (e) => {
            const t = e.changedTouches[0];
            if (handleStart(t.clientX, t.clientY)) e.preventDefault();
        }, { passive: false });
        
        this.canvas.addEventListener('touchend', (e) => {
            const t = e.changedTouches[0];
            handleEnd(t.clientX, t.clientY);
        }, { passive: false });
        
        this.canvas.addEventListener('mousedown', (e) => {
            handleStart(e.clientX, e.clientY);
        });
        
        this.canvas.addEventListener('mouseup', (e) => {
            handleEnd(e.clientX, e.clientY);
        });
    }
    
    moveLane(dir) {
        const next = this.player.lane + dir;
        if (next >= -1 && next <= 1) {
            this.player.lane = next;
            this.player.targetX = this.lanes[next + 1];
            this.audio.playWhoosh();
        }
    }
    
    jump() {
        if (!this.player.isJumping) {
            this.player.isJumping = true;
            this.player.vy = 840;
            this.player.isSliding = false;
            this.audio.playJump();
            this.spawnDust(12);
        }
    }
    
    slide() {
        if (!this.player.isSliding) {
            this.player.isSliding = true;
            this.player.slideTimer = 0.72;
            if (this.player.isJumping) {
                this.player.vy = -1200; // fast-drop
            }
            this.audio.playSlide();
            this.spawnDust(16);
        }
    }
    
    togglePause() {
        if (this.state === this.STATE_PLAYING) {
            this.state = this.STATE_PAUSED;
            this.audio.stopBGM();
        } else if (this.state === this.STATE_PAUSED) {
            this.state = this.STATE_PLAYING;
            this.audio.startBGM();
            this.lastTime = performance.now();
        }
    }
    
    startGame() {
        this.resetGame();
        this.state = this.STATE_PLAYING;
        this.audio.init();
        this.audio.startBGM();
    }
    
    resetGame() {
        this.distance = 0;
        this.score = 0;
        this.coins = 0;
        this.speed = this.baseSpeed;
        this.currentBiome = 'river';
        this.biomeDistance = 0;
        this.screenShake = 0;
        
        this.player.lane = 0;
        this.player.x = 0;
        this.player.targetX = 0;
        this.player.y = 0;
        this.player.baseY = 0;
        this.player.vy = 0;
        this.player.z = 0;
        this.player.isJumping = false;
        this.player.isSliding = false;
        this.player.slideTimer = 0;
        this.player.animTimer = 0;
        this.player.animFrame = 0;
        this.player.isDead = false;
        this.player.invincible = false;
        this.player.onPlatform = null;
        
        for (const k in this.powerups) {
            this.powerups[k].active = false;
            this.powerups[k].timer = 0;
        }
        
        this.trackChunks = [];
        this.obstacles = [];
        this.coinsList = [];
        this.sceneryList = [];
        this.particles = [];
        this.floatingTexts = [];
        this.nextSpawnZ = 400;
        
        // Initial safe starter track chunks
        for (let z = 0; z < 1800; z += 180) {
            this.trackChunks.push({
                z: z,
                biome: 'river',
                hasLogs: [true, true, true]
            });
        }
        this.nextSpawnZ = 1800;
    }
    
    triggerGameOver() {
        if (this.player.isDead) return;
        this.player.isDead = true;
        this.state = this.STATE_GAMEOVER;
        this.screenShake = 22;
        this.audio.playCrash();
        this.audio.stopBGM();
        
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('ninja_high_score', this.highScore.toString());
        }
        
        this.spawnExplosion(this.player.x, this.player.y + 60, this.player.z);
    }
    
    spawnDust(count) {
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: this.player.x + (Math.random() - 0.5) * 60,
                y: this.player.y + 10,
                z: this.player.z - 20 - Math.random() * 40,
                vx: (Math.random() - 0.5) * 80,
                vy: Math.random() * 60 + 20,
                vz: -Math.random() * 50,
                color: 'rgba(230, 205, 175, 0.7)',
                radius: Math.random() * 8 + 4,
                life: 0.4
            });
        }
    }
    
    spawnSparkles(x, y, z, count = 10) {
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: x + (Math.random() - 0.5) * 50,
                y: y + (Math.random() - 0.5) * 50,
                z: z + (Math.random() - 0.5) * 50,
                vx: (Math.random() - 0.5) * 160,
                vy: (Math.random() - 0.5) * 160 + 50,
                vz: (Math.random() - 0.5) * 100,
                color: 'rgba(255, 230, 60, 0.9)',
                radius: Math.random() * 10 + 6,
                life: 0.6
            });
        }
    }
    
    spawnExplosion(x, y, z) {
        for (let i = 0; i < 35; i++) {
            this.particles.push({
                x: x + (Math.random() - 0.5) * 40,
                y: y + (Math.random() - 0.5) * 40,
                z: z + (Math.random() - 0.5) * 40,
                vx: (Math.random() - 0.5) * 400,
                vy: Math.random() * 400 + 100,
                vz: (Math.random() - 0.5) * 300,
                color: Math.random() > 0.5 ? 'rgba(240, 50, 40, 0.9)' : 'rgba(255, 200, 30, 0.9)',
                radius: Math.random() * 14 + 6,
                life: 0.85
            });
        }
    }
    
    addFloatingText(text, x, y, z, color = '#ffe135') {
        if (this.floatingTexts.length >= 4) {
            this.floatingTexts.shift();
        }
        this.floatingTexts.push({
            text: text,
            x: x,
            y: y + 80,
            z: z,
            alpha: 1.0,
            life: 0.65,
            color: color
        });
    }
    
    spawnTrackAndEntities() {
        const SPAWN_DISTANCE = 3200;
        while (this.nextSpawnZ < this.player.z + SPAWN_DISTANCE) {
            const z = this.nextSpawnZ;
            
            // Biome cycling: river -> forest -> bridge -> train -> river
            this.biomeDistance += 180;
            if (this.biomeDistance > 2400) {
                this.biomeDistance = 0;
                const biomes = ['river', 'forest', 'bridge', 'train'];
                const curIdx = biomes.indexOf(this.currentBiome);
                this.currentBiome = biomes[(curIdx + 1) % biomes.length];
            }
            
            // Track chunk
            const chunk = {
                z: z,
                biome: this.currentBiome,
                hasLogs: [true, true, true]
            };
            
            if (this.currentBiome === 'river') {
                // In river, some lanes have missing logs to force jumping/lane shifts
                if (Math.random() < 0.45) {
                    const emptyLane = Math.floor(Math.random() * 3);
                    chunk.hasLogs[emptyLane] = false;
                }
            }
            this.trackChunks.push(chunk);
            
            // Scenery along borders
            if (Math.random() < 0.5) {
                const side = Math.random() > 0.5 ? -1 : 1;
                this.sceneryList.push({
                    x: side * (520 + Math.random() * 180),
                    y: 0,
                    z: z,
                    type: Math.random() > 0.35 ? 'tree' : 'mushroom',
                    scale: 0.85 + Math.random() * 0.4
                });
            }
            
            // Obstacles & Pickups Spawning (after first 800 units)
            if (z > 800 && Math.random() < 0.65) {
                this.spawnObstaclePattern(z);
            }
            
            this.nextSpawnZ += 240;
        }
    }
    
    spawnObstaclePattern(z) {
        const laneIdx = Math.floor(Math.random() * 3) - 1; // -1, 0, 1
        const laneX = this.lanes[laneIdx + 1];
        const r = Math.random();
        
        if (this.currentBiome === 'train') {
            // Train segment: Ramp in one lane, Train with logs in another!
            if (r < 0.4) {
                // Ramp allows jumping on train roof!
                this.obstacles.push({
                    type: 'ramp',
                    lane: laneIdx,
                    x: laneX,
                    y: 0,
                    z: z,
                    width: 140,
                    height: 90,
                    depth: 180
                });
                // Train wagon right behind ramp
                this.obstacles.push({
                    type: 'train_wagon',
                    lane: laneIdx,
                    x: laneX,
                    y: 0,
                    z: z + 260,
                    width: 170,
                    height: 190,
                    depth: 400
                });
                // High coins on top of the train wagon!
                for (let cz = z + 240; cz <= z + 480; cz += 80) {
                    this.coinsList.push({
                        lane: laneIdx,
                        x: laneX,
                        y: 240, // elevated!
                        z: cz,
                        collected: false
                    });
                }
            } else {
                // Truck obstacle blocking lane
                this.obstacles.push({
                    type: 'truck',
                    lane: laneIdx,
                    x: laneX,
                    y: 0,
                    z: z,
                    width: 180,
                    height: 220,
                    depth: 280
                });
            }
        } else if (this.currentBiome === 'forest' || this.currentBiome === 'bridge') {
            if (r < 0.32) {
                // Hurdle (JUMP OVER)
                this.obstacles.push({
                    type: 'hurdle',
                    lane: laneIdx,
                    x: laneX,
                    y: 0,
                    z: z,
                    width: 190,
                    height: 85,
                    depth: 60
                });
                // Coins above hurdle
                this.coinsList.push({
                    lane: laneIdx,
                    x: laneX,
                    y: 170,
                    z: z,
                    collected: false
                });
            } else if (r < 0.60) {
                // Barrier (SLIDE UNDER)
                this.obstacles.push({
                    type: 'barrier',
                    lane: laneIdx,
                    x: laneX,
                    y: 0,
                    z: z,
                    width: 200,
                    height: 220,
                    depth: 70
                });
                // Coins on ground under barrier
                this.coinsList.push({
                    lane: laneIdx,
                    x: laneX,
                    y: 20,
                    z: z,
                    collected: false
                });
            } else if (r < 0.82) {
                // Boulder Rock (DODGE)
                this.obstacles.push({
                    type: 'rock',
                    lane: laneIdx,
                    x: laneX,
                    y: 0,
                    z: z,
                    width: 150,
                    height: 120,
                    depth: 120
                });
            } else {
                // Purple Crates
                this.obstacles.push({
                    type: 'crates',
                    lane: laneIdx,
                    x: laneX,
                    y: 0,
                    z: z,
                    width: 140,
                    height: 130,
                    depth: 100
                });
            }
        }
        
        // Spawn Coins in remaining free lane
        const freeLane = (laneIdx === 0) ? (Math.random() > 0.5 ? 1 : -1) : 0;
        const freeX = this.lanes[freeLane + 1];
        
        if (Math.random() < 0.7) {
            for (let i = 0; i < 4; i++) {
                this.coinsList.push({
                    lane: freeLane,
                    x: freeX,
                    y: 45,
                    z: z + (i * 70),
                    collected: false
                });
            }
        }
        
        // Powerups (occasional rare spawn)
        if (Math.random() < 0.08) {
            const pTypes = ['rocket', 'multiplier', 'magnet'];
            const pType = pTypes[Math.floor(Math.random() * pTypes.length)];
            this.obstacles.push({
                type: 'powerup',
                powerupType: pType,
                lane: freeLane,
                x: freeX,
                y: 55,
                z: z + 300,
                width: 90,
                height: 90,
                depth: 90
            });
        }
    }
    
    update(dt) {
        if (this.state !== this.STATE_PLAYING) return;
        
        // Dynamic Difficulty Speed curve
        this.speed = Math.min(this.maxSpeed, this.baseSpeed + (this.distance * 0.12));
        const effectiveSpeed = this.powerups.rocket.active ? this.speed * 1.6 : this.speed;
        
        // Progress distance & score
        const forwardStep = effectiveSpeed * dt;
        this.player.z += forwardStep;
        this.distance += forwardStep * 0.1;
        
        const scoreMult = this.powerups.multiplier.active ? 2 : 1;
        this.score += Math.floor((forwardStep * 0.15) * scoreMult);
        
        // Player Lateral Lerp to Target Lane
        this.player.x += (this.player.targetX - this.player.x) * 16 * dt;
        
        // Player Vertical Physics (Jump / Fall / Gravity)
        const gravity = -2600;
        if (this.player.isJumping || this.player.y > this.player.baseY) {
            this.player.vy += gravity * dt;
            this.player.y += this.player.vy * dt;
            
            if (this.player.y <= this.player.baseY) {
                this.player.y = this.player.baseY;
                this.player.vy = 0;
                this.player.isJumping = false;
                this.spawnDust(8);
            }
        }
        
        // Sliding Timer
        if (this.player.isSliding) {
            this.player.slideTimer -= dt;
            if (this.player.slideTimer <= 0) {
                this.player.isSliding = false;
            }
        }
        
        // Running Animation frame cycle
        this.player.animTimer += dt * (effectiveSpeed / 200);
        this.player.animFrame = Math.floor(this.player.animTimer) % 4;
        
        // Power-ups countdown
        for (const [k, p] of Object.entries(this.powerups)) {
            if (p.active) {
                p.timer -= dt;
                if (p.timer <= 0) {
                    p.active = false;
                }
            }
        }
        
        // Camera smooth follow
        this.camera.z = this.player.z - 280;
        this.camera.x += (this.player.x * 0.35 - this.camera.x) * 10 * dt;
        this.camera.targetY = 340 + this.player.y * 0.45;
        this.camera.y += (this.camera.targetY - this.camera.y) * 8 * dt;
        
        // Spawn world ahead
        this.spawnTrackAndEntities();
        
        // Screen shake decay
        if (this.screenShake > 0) {
            this.screenShake = Math.max(0, this.screenShake - 50 * dt);
        }
        
        // Check river log support: if in river biome, player must be jumping or on a log
        if (this.currentBiome === 'river' && !this.player.isJumping && this.player.y <= 10) {
            const curChunk = this.trackChunks.find(c => Math.abs(c.z - this.player.z) < 130);
            if (curChunk && curChunk.biome === 'river') {
                const laneIdx = this.player.lane + 1;
                if (!curChunk.hasLogs[laneIdx]) {
                    // Splashed into water!
                    this.triggerGameOver();
                    return;
                }
            }
        }
        
        // Check Ramp & Platform collisions
        this.updatePlatformsAndObstacles(dt);
        
        // Check Coins collection & Magnet Pull
        this.updateCoins(dt);
        
        // Update particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.z += p.vz * dt;
            p.life -= dt;
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
        
        // Update floating texts
        for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
            const ft = this.floatingTexts[i];
            ft.y += 60 * dt;
            ft.life -= dt;
            ft.alpha = Math.max(0, ft.life / 0.75);
            if (ft.life <= 0) {
                this.floatingTexts.splice(i, 1);
            }
        }
        
        // Cleanup old behind-camera items
        const cullZ = this.player.z - 500;
        this.trackChunks = this.trackChunks.filter(c => c.z > cullZ);
        this.obstacles = this.obstacles.filter(o => o.z > cullZ);
        this.coinsList = this.coinsList.filter(c => c.z > cullZ && !c.collected);
        this.sceneryList = this.sceneryList.filter(s => s.z > cullZ);
    }
    
    updatePlatformsAndObstacles(dt) {
        const pz = this.player.z;
        const px = this.player.x;
        const py = this.player.y;
        
        let onAnyTrain = false;
        
        for (let i = 0; i < this.obstacles.length; i++) {
            const obs = this.obstacles[i];
            
            // Lateral distance check
            const dx = Math.abs(px - obs.x);
            // Longitudinal depth check
            const dz = obs.z - pz;
            
            // Check Ramp Launch
            if (obs.type === 'ramp') {
                if (dx < 90 && dz > -50 && dz < 120) {
                    // Running up the ramp launches player smoothly onto train roof!
                    this.player.isJumping = true;
                    this.player.vy = 880;
                    this.audio.playJump();
                    this.spawnDust(14);
                }
            }
            
            // Check Train Wagon platform top
            if (obs.type === 'train_wagon') {
                if (dx < 110 && pz >= obs.z - 100 && pz <= obs.z + obs.depth) {
                    if (py >= 150) {
                        // Player is running safely on top of the train!
                        this.player.baseY = 190;
                        if (!this.player.isJumping) this.player.y = 190;
                        onAnyTrain = true;
                    }
                }
            }
            
            // Check Powerup Pickups
            if (obs.type === 'powerup') {
                if (dx < 100 && Math.abs(dz) < 70) {
                    this.activatePowerup(obs.powerupType);
                    this.spawnSparkles(obs.x, obs.y + 40, obs.z, 20);
                    this.audio.playPowerup();
                    this.addFloatingText(`${obs.powerupType.toUpperCase()}!`, obs.x, obs.y + 60, obs.z, '#ffea00');
                    this.obstacles.splice(i, 1);
                    i--;
                    continue;
                }
            }
            
            // Hazardous Obstacle Collisions (Ignore if Rocket Booster is active!)
            if (!this.powerups.rocket.active && (obs.type === 'hurdle' || obs.type === 'barrier' || obs.type === 'rock' || obs.type === 'truck' || obs.type === 'crates' || (obs.type === 'train_wagon' && py < 150))) {
                if (dx < 75 && dz > -40 && dz < 70) {
                    let hit = true;
                    
                    if (obs.type === 'hurdle') {
                        // Can jump over hurdle!
                        if (py > 75) hit = false;
                    } else if (obs.type === 'barrier') {
                        // Can slide under barrier!
                        if (this.player.isSliding && py <= 30) hit = false;
                    }
                    
                    if (hit) {
                        this.triggerGameOver();
                        return;
                    }
                }
            }
        }
        
        if (!onAnyTrain && this.player.baseY > 0 && !this.player.isJumping) {
            // Stepped off train wagon back to ground
            this.player.baseY = 0;
            this.player.isJumping = true;
            this.player.vy = 0;
        }
    }
    
    activatePowerup(type) {
        if (type === 'rocket') {
            this.powerups.rocket.active = true;
            this.powerups.rocket.timer = this.powerups.rocket.duration;
            this.screenShake = 10;
        } else if (type === 'multiplier') {
            this.powerups.multiplier.active = true;
            this.powerups.multiplier.timer = this.powerups.multiplier.duration;
        } else if (type === 'magnet') {
            this.powerups.magnet.active = true;
            this.powerups.magnet.timer = this.powerups.magnet.duration;
        }
    }
    
    updateCoins(dt) {
        const pz = this.player.z;
        const px = this.player.x;
        const py = this.player.y;
        const hasMagnet = this.powerups.magnet.active || this.powerups.rocket.active;
        
        for (let i = 0; i < this.coinsList.length; i++) {
            const coin = this.coinsList[i];
            if (coin.collected) continue;
            
            // Magnet Pull towards player
            if (hasMagnet && Math.abs(coin.z - pz) < 900) {
                coin.x += (px - coin.x) * 12 * dt;
                coin.y += (py + 45 - coin.y) * 12 * dt;
                coin.z += (pz - coin.z) * 12 * dt;
            }
            
            const dx = Math.abs(px - coin.x);
            const dy = Math.abs(py + 40 - coin.y);
            const dz = Math.abs(pz - coin.z);
            
            if (dx < 75 && dy < 95 && dz < 70) {
                coin.collected = true;
                const coinVal = this.powerups.multiplier.active ? 2 : 1;
                this.coins += coinVal;
                this.score += 25 * coinVal;
                this.audio.playCoin();
                this.spawnSparkles(coin.x, coin.y, coin.z, 6);
                this.addFloatingText(`+${coinVal}`, coin.x, coin.y, coin.z, '#ffde00');
            }
        }
    }
    
    // 3D Perspective Projection Function
    project3D(wx, wy, wz) {
        const relZ = wz - this.camera.z;
        if (relZ <= 15) return null; // Behind camera
        
        const scale = this.camera.fov / relZ;
        const sx = (this.LAYOUT_WIDTH / 2) + (wx - this.camera.x) * scale;
        const sy = this.camera.horizonY - (wy - this.camera.y) * scale;
        
        return { x: sx, y: sy, scale: scale, relZ: relZ };
    }
    
    render() {
        const ctx = this.ctx;
        const w = this.LAYOUT_WIDTH;
        const h = this.LAYOUT_HEIGHT;
        
        ctx.save();
        
        // Screen Shake offset
        if (this.screenShake > 0) {
            const shakeX = (Math.random() - 0.5) * this.screenShake;
            const shakeY = (Math.random() - 0.5) * this.screenShake;
            ctx.translate(shakeX, shakeY);
        }
        
        // 1. Draw Background (Parallax Forest Canopy)
        if (this.images.bg_forest) {
            ctx.drawImage(this.images.bg_forest, 0, 0, w, h);
        } else {
            ctx.fillStyle = '#1b3b2c';
            ctx.fillRect(0, 0, w, h);
        }
        
        // 2. Render Ground & 3D Tracks
        this.renderGroundAndTracks(ctx);
        
        // 3. Render 3D Scenery, Obstacles, Coins & Player (Sorted by Z back-to-front)
        this.renderWorldEntities(ctx);
        
        // 4. Render 3D Particles
        this.renderParticles(ctx);
        
        // 5. Render Speed Lines (When Rocket Booster is active!)
        if (this.powerups.rocket.active) {
            this.renderSpeedLines(ctx);
        }
        
        // 6. Render HUD & UI Overlays
        this.renderHUD(ctx);
        
        ctx.restore();
    }
    
    renderGroundAndTracks(ctx) {
        const w = this.LAYOUT_WIDTH;
        const h = this.LAYOUT_HEIGHT;
        
        // Horizon line at y = 820
        const horizonY = this.camera.horizonY;
        
        // Water / Ground Base fill below horizon
        const groundGrad = ctx.createLinearGradient(0, horizonY, 0, h);
        groundGrad.addColorStop(0, '#226068');
        groundGrad.addColorStop(1, '#164850');
        ctx.fillStyle = groundGrad;
        ctx.fillRect(0, horizonY, w, h - horizonY);
        
        // Render 3D track chunks back-to-front
        const sortedChunks = [...this.trackChunks].sort((a, b) => b.z - a.z);
        
        for (const chunk of sortedChunks) {
            const p0 = this.project3D(0, 0, chunk.z);
            const p1 = this.project3D(0, 0, chunk.z + 240);
            if (!p0 || !p1) continue;
            
            const roadHalfWidth0 = 420 * p0.scale;
            const roadHalfWidth1 = 420 * p1.scale;
            
            if (chunk.biome === 'river') {
                // Floating Logs in each active lane
                for (let laneIdx = 0; laneIdx < 3; laneIdx++) {
                    if (chunk.hasLogs[laneIdx]) {
                        const laneX = this.lanes[laneIdx];
                        const logP0 = this.project3D(laneX, 10, chunk.z);
                        const logP1 = this.project3D(laneX, 10, chunk.z + 200);
                        if (logP0 && logP1) {
                            const logW = 240 * logP0.scale;
                            const logH = 75 * logP0.scale;
                            if (this.images.env_floating_log) {
                                ctx.drawImage(this.images.env_floating_log, logP0.x - logW/2, logP0.y - logH/2, logW, logH);
                            } else {
                                ctx.fillStyle = '#6d4223';
                                ctx.fillRect(logP0.x - logW/2, logP0.y - logH/2, logW, logH);
                            }
                        }
                    }
                }
            } else if (chunk.biome === 'bridge') {
                // Suspension Bridge Planks
                ctx.fillStyle = '#8b6f4e';
                ctx.beginPath();
                ctx.moveTo(p1.x - roadHalfWidth1, p1.y);
                ctx.lineTo(p1.x + roadHalfWidth1, p1.y);
                ctx.lineTo(p0.x + roadHalfWidth0, p0.y);
                ctx.lineTo(p0.x - roadHalfWidth0, p0.y);
                ctx.closePath();
                ctx.fill();
                
                // Rope Rails
                ctx.strokeStyle = '#d7ba8c';
                ctx.lineWidth = Math.max(3, 10 * p0.scale);
                ctx.beginPath();
                ctx.moveTo(p1.x - roadHalfWidth1, p1.y - 40 * p1.scale);
                ctx.lineTo(p0.x - roadHalfWidth0, p0.y - 40 * p0.scale);
                ctx.moveTo(p1.x + roadHalfWidth1, p1.y - 40 * p1.scale);
                ctx.lineTo(p0.x + roadHalfWidth0, p0.y - 40 * p0.scale);
                ctx.stroke();
            } else {
                // Forest Trail / Train Dirt Road
                ctx.fillStyle = '#c8a478';
                ctx.beginPath();
                ctx.moveTo(p1.x - roadHalfWidth1, p1.y);
                ctx.lineTo(p1.x + roadHalfWidth1, p1.y);
                ctx.lineTo(p0.x + roadHalfWidth0, p0.y);
                ctx.lineTo(p0.x - roadHalfWidth0, p0.y);
                ctx.closePath();
                ctx.fill();
                
                // Track Lane dividers
                for (const lx of [-this.LANE_SPACING/2, this.LANE_SPACING/2]) {
                    const d0 = this.project3D(lx, 0, chunk.z);
                    const d1 = this.project3D(lx, 0, chunk.z + 240);
                    if (d0 && d1) {
                        ctx.strokeStyle = 'rgba(255, 255, 255, 0.28)';
                        ctx.lineWidth = Math.max(2, 6 * d0.scale);
                        ctx.beginPath();
                        ctx.moveTo(d0.x, d0.y);
                        ctx.lineTo(d1.x, d1.y);
                        ctx.stroke();
                    }
                }
            }
        }
    }
    
    renderWorldEntities(ctx) {
        // Collect all entities to render with their Z position
        const renderQueue = [];
        
        // 1. Scenery (Trees, Mushrooms)
        for (const s of this.sceneryList) {
            renderQueue.push({ type: 'scenery', z: s.z, data: s });
        }
        
        // 2. Obstacles
        for (const o of this.obstacles) {
            renderQueue.push({ type: 'obstacle', z: o.z, data: o });
        }
        
        // 3. Coins
        for (const c of this.coinsList) {
            if (!c.collected) {
                renderQueue.push({ type: 'coin', z: c.z, data: c });
            }
        }
        
        // 4. Player
        renderQueue.push({ type: 'player', z: this.player.z, data: this.player });
        
        // Sort back-to-front (largest Z first)
        renderQueue.sort((a, b) => b.z - a.z);
        
        // Render sorted items
        for (const item of renderQueue) {
            if (item.type === 'scenery') {
                this.renderSceneryItem(ctx, item.data);
            } else if (item.type === 'obstacle') {
                this.renderObstacleItem(ctx, item.data);
            } else if (item.type === 'coin') {
                this.renderCoinItem(ctx, item.data);
            } else if (item.type === 'player') {
                this.renderPlayer(ctx);
            }
        }
    }
    
    renderSceneryItem(ctx, s) {
        const proj = this.project3D(s.x, s.y, s.z);
        if (!proj) return;
        
        if (s.type === 'tree') {
            const tw = 200 * proj.scale * s.scale;
            const th = 400 * proj.scale * s.scale;
            if (this.images.env_tree_redwood) {
                ctx.drawImage(this.images.env_tree_redwood, proj.x - tw/2, proj.y - th, tw, th);
            }
        } else {
            const mw = 120 * proj.scale * s.scale;
            const mh = 120 * proj.scale * s.scale;
            if (this.images.env_mushroom) {
                ctx.drawImage(this.images.env_mushroom, proj.x - mw/2, proj.y - mh, mw, mh);
            }
        }
    }
    
    renderObstacleItem(ctx, obs) {
        const proj = this.project3D(obs.x, obs.y, obs.z);
        if (!proj) return;
        
        const ow = obs.width * proj.scale;
        const oh = obs.height * proj.scale;
        
        if (obs.type === 'hurdle') {
            if (this.images.obstacle_hurdle) {
                ctx.drawImage(this.images.obstacle_hurdle, proj.x - ow/2, proj.y - oh, ow, oh);
            }
        } else if (obs.type === 'barrier') {
            if (this.images.obstacle_barrier) {
                ctx.drawImage(this.images.obstacle_barrier, proj.x - ow/2, proj.y - oh, ow, oh);
            }
        } else if (obs.type === 'rock') {
            if (this.images.obstacle_rock) {
                ctx.drawImage(this.images.obstacle_rock, proj.x - ow/2, proj.y - oh, ow, oh);
            }
        } else if (obs.type === 'truck') {
            if (this.images.obstacle_truck) {
                ctx.drawImage(this.images.obstacle_truck, proj.x - ow/2, proj.y - oh, ow, oh);
            }
        } else if (obs.type === 'train_wagon') {
            if (this.images.obstacle_train_wagon) {
                ctx.drawImage(this.images.obstacle_train_wagon, proj.x - ow/2, proj.y - oh, ow, oh);
            }
        } else if (obs.type === 'ramp') {
            if (this.images.obstacle_ramp) {
                ctx.drawImage(this.images.obstacle_ramp, proj.x - ow/2, proj.y - oh, ow, oh);
            }
        } else if (obs.type === 'crates') {
            if (this.images.obstacle_crates) {
                ctx.drawImage(this.images.obstacle_crates, proj.x - ow/2, proj.y - oh, ow, oh);
            }
        } else if (obs.type === 'powerup') {
            // Hover bob
            const bob = Math.sin(performance.now() * 0.006) * 15 * proj.scale;
            const pKey = `powerup_${obs.powerupType}`;
            if (this.images[pKey]) {
                ctx.drawImage(this.images[pKey], proj.x - ow/2, proj.y - oh + bob, ow, oh);
            }
        }
    }
    
    renderCoinItem(ctx, coin) {
        const proj = this.project3D(coin.x, coin.y, coin.z);
        if (!proj) return;
        
        const cw = 110 * proj.scale;
        const ch = 110 * proj.scale;
        
        // Spin animation frame
        const spinFrame = Math.floor(performance.now() * 0.008) % 4;
        const coinImg = this.images[`coin_sun_${spinFrame}`] || this.images.coin_sun_0;
        
        if (coinImg) {
            ctx.drawImage(coinImg, proj.x - cw/2, proj.y - ch/2, cw, ch);
        }
    }
    
    renderPlayer(ctx) {
        const p = this.player;
        const proj = this.project3D(p.x, p.y, p.z);
        if (!proj) return;
        
        // Determine player sprite based on action state
        let spriteKey = `player_run_${p.animFrame}`;
        if (p.isDead) {
            spriteKey = 'player_crash';
        } else if (p.isJumping) {
            spriteKey = 'player_jump';
        } else if (p.isSliding) {
            spriteKey = 'player_slide';
        }
        
        const img = this.images[spriteKey] || this.images.player_run_0;
        const pw = 250 * proj.scale;
        const ph = 310 * proj.scale;
        
        // Ground shadow beneath player
        const groundProj = this.project3D(p.x, p.baseY, p.z);
        if (groundProj) {
            const shadowW = 160 * groundProj.scale;
            const shadowH = 50 * groundProj.scale;
            const shadowAlpha = Math.max(0.15, 0.55 - (p.y - p.baseY) * 0.0015);
            ctx.fillStyle = `rgba(0, 0, 0, ${shadowAlpha})`;
            ctx.beginPath();
            ctx.ellipse(groundProj.x, groundProj.y - 8 * groundProj.scale, shadowW/2, shadowH/2, 0, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Invincible / Boost Gold Aura
        if (this.powerups.rocket.active) {
            ctx.save();
            ctx.shadowColor = '#ffe600';
            ctx.shadowBlur = 35;
            ctx.strokeStyle = 'rgba(255, 230, 40, 0.8)';
            ctx.lineWidth = 6 * proj.scale;
            ctx.beginPath();
            ctx.ellipse(proj.x, proj.y - ph/2, pw/2 + 10, ph/2 + 10, 0, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }
        
        if (img) {
            ctx.drawImage(img, proj.x - pw/2, proj.y - ph, pw, ph);
        }
    }
    
    renderParticles(ctx) {
        for (const p of this.particles) {
            const proj = this.project3D(p.x, p.y, p.z);
            if (!proj) continue;
            
            const r = p.radius * proj.scale;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(proj.x, proj.y, Math.max(1.5, r), 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Floating Text popups
        for (const ft of this.floatingTexts) {
            const proj = this.project3D(ft.x, ft.y, ft.z);
            if (!proj) continue;
            
            ctx.save();
            ctx.font = `bold ${Math.round(48 * proj.scale)}px sans-serif`;
            ctx.fillStyle = ft.color;
            ctx.shadowColor = 'rgba(0,0,0,0.8)';
            ctx.shadowBlur = 6;
            ctx.textAlign = 'center';
            ctx.globalAlpha = ft.alpha;
            ctx.fillText(ft.text, proj.x, proj.y);
            ctx.restore();
        }
    }
    
    renderSpeedLines(ctx) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
        ctx.lineWidth = 3;
        for (let i = 0; i < 16; i++) {
            const x = Math.random() * this.LAYOUT_WIDTH;
            const y0 = Math.random() * this.LAYOUT_HEIGHT * 0.8;
            const len = 120 + Math.random() * 200;
            ctx.beginPath();
            ctx.moveTo(x, y0);
            ctx.lineTo(x + (x - this.LAYOUT_WIDTH/2) * 0.2, y0 + len);
            ctx.stroke();
        }
    }
    
    renderHUD(ctx) {
        const w = this.LAYOUT_WIDTH;
        
        // 1. Top Left: Smiling Sun Coin Badge & Counter
        const coinIcon = this.images.ui_sun_badge || this.images.coin_sun_0;
        if (coinIcon) {
            ctx.drawImage(coinIcon, 35, 35, 100, 100);
        }
        
        ctx.save();
        ctx.font = '900 68px "Arial Black", Impact, sans-serif';
        ctx.fillStyle = '#ffcf1e';
        ctx.strokeStyle = '#5a2e04';
        ctx.lineWidth = 10;
        ctx.lineJoin = 'round';
        ctx.strokeText(this.coins.toString(), 150, 110);
        ctx.fillText(this.coins.toString(), 150, 110);
        
        // 2. Top Center/Right: Distance / Score Counter
        const scoreStr = this.score.toString();
        ctx.font = '900 84px "Arial Black", Impact, sans-serif';
        ctx.fillStyle = '#e86238';
        ctx.strokeStyle = '#481504';
        ctx.lineWidth = 12;
        ctx.strokeText(scoreStr, 620, 115);
        ctx.fillText(scoreStr, 620, 115);
        
        // 3. Top Right: Pause Button
        const pauseBtn = this.images.ui_pause;
        if (pauseBtn) {
            ctx.drawImage(pauseBtn, 940, 45, 95, 95);
        }
        ctx.restore();
        
        // 4. Bottom Left: Active Powerup Badges with Cooldown Pie Ring
        let pBadgeY = 1750;
        for (const [k, p] of Object.entries(this.powerups)) {
            if (p.active) {
                const pImg = this.images[`powerup_${k}`];
                if (pImg) {
                    ctx.drawImage(pImg, 45, pBadgeY, 110, 110);
                    
                    // Cooldown ring
                    const progress = p.timer / p.duration;
                    ctx.strokeStyle = '#ffe600';
                    ctx.lineWidth = 8;
                    ctx.beginPath();
                    ctx.arc(100, pBadgeY + 55, 60, -Math.PI/2, -Math.PI/2 + (Math.PI * 2 * progress));
                    ctx.stroke();
                }
                pBadgeY -= 135;
            }
        }
        
        // 5. State Overlays
        if (this.state === this.STATE_MENU) {
            this.renderMenuOverlay(ctx);
        } else if (this.state === this.STATE_PAUSED) {
            this.renderPauseOverlay(ctx);
        } else if (this.state === this.STATE_GAMEOVER) {
            this.renderGameOverOverlay(ctx);
        }
    }
    
    renderMenuOverlay(ctx) {
        const w = this.LAYOUT_WIDTH;
        const h = this.LAYOUT_HEIGHT;
        
        // Backdrop
        ctx.fillStyle = 'rgba(10, 25, 20, 0.72)';
        ctx.fillRect(0, 0, w, h);
        
        ctx.save();
        ctx.textAlign = 'center';
        
        // Title Banner
        ctx.font = '900 96px "Arial Black", Impact, sans-serif';
        ctx.fillStyle = '#ffcf1e';
        ctx.strokeStyle = '#421a00';
        ctx.lineWidth = 14;
        ctx.strokeText('NINJA RIVER RUN', w/2, 480);
        ctx.fillText('NINJA RIVER RUN', w/2, 480);
        
        // Subtitle
        ctx.font = 'bold 44px sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.fillText('3D Endless River & Forest Runner', w/2, 560);
        
        // Character Banner preview
        const pImg = this.images.player_run_0;
        if (pImg) {
            ctx.drawImage(pImg, w/2 - 140, 680, 280, 350);
        }
        
        // Instructions Card
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.roundRect(w/2 - 400, 1080, 800, 190, 24);
        ctx.fill();
        
        ctx.font = 'bold 36px sans-serif';
        ctx.fillStyle = '#8ce0ff';
        ctx.fillText('CONTROLS', w/2, 1130);
        ctx.fillStyle = '#f0f0f0';
        ctx.font = '32px sans-serif';
        ctx.fillText('← / → Swipe / Keys : Switch Lanes', w/2, 1180);
        ctx.fillText('↑ Swipe / Key / Space : Jump  |  ↓ Swipe / Key : Slide', w/2, 1230);
        
        // Big Start Button
        const btnY = 1350;
        ctx.fillStyle = '#28c460';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.roundRect(w/2 - 260, btnY, 520, 120, 60);
        ctx.fill();
        ctx.stroke();
        
        ctx.font = '900 56px "Arial Black", sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.fillText('START RUN', w/2, btnY + 80);
        
        ctx.restore();
    }
    
    renderPauseOverlay(ctx) {
        const w = this.LAYOUT_WIDTH;
        const h = this.LAYOUT_HEIGHT;
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
        ctx.fillRect(0, 0, w, h);
        
        ctx.save();
        ctx.textAlign = 'center';
        
        ctx.font = '900 96px "Arial Black", Impact, sans-serif';
        ctx.fillStyle = '#14b4d7';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 10;
        ctx.strokeText('PAUSED', w/2, 700);
        ctx.fillText('PAUSED', w/2, 700);
        
        // Resume button
        const btnY = 920;
        ctx.fillStyle = '#28c460';
        ctx.roundRect(w/2 - 240, btnY, 480, 110, 55);
        ctx.fill();
        ctx.font = '900 52px "Arial Black", sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.fillText('RESUME', w/2, btnY + 75);
        
        ctx.restore();
    }
    
    renderGameOverOverlay(ctx) {
        const w = this.LAYOUT_WIDTH;
        const h = this.LAYOUT_HEIGHT;
        
        ctx.fillStyle = 'rgba(30, 8, 8, 0.85)';
        ctx.fillRect(0, 0, w, h);
        
        ctx.save();
        ctx.textAlign = 'center';
        
        // Game Over Title
        ctx.font = '900 100px "Arial Black", Impact, sans-serif';
        ctx.fillStyle = '#e83838';
        ctx.strokeStyle = '#480404';
        ctx.lineWidth = 14;
        ctx.strokeText('GAME OVER', w/2, 520);
        ctx.fillText('GAME OVER', w/2, 520);
        
        // Score Summary Card
        ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
        ctx.roundRect(w/2 - 380, 640, 760, 480, 32);
        ctx.fill();
        
        ctx.font = 'bold 44px sans-serif';
        ctx.fillStyle = '#aaaaaa';
        ctx.fillText('SCORE', w/2, 720);
        
        ctx.font = '900 84px "Arial Black", sans-serif';
        ctx.fillStyle = '#ffcf1e';
        ctx.fillText(this.score.toString(), w/2, 810);
        
        ctx.font = 'bold 40px sans-serif';
        ctx.fillStyle = '#8ce0ff';
        ctx.fillText(`HIGH SCORE : ${this.highScore}`, w/2, 910);
        
        ctx.font = 'bold 44px sans-serif';
        ctx.fillStyle = '#ffd54f';
        ctx.fillText(`SUN COINS : ${this.coins}`, w/2, 1010);
        
        // Replay Button
        const btnY = 1240;
        ctx.fillStyle = '#f58c19';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.roundRect(w/2 - 260, btnY, 520, 120, 60);
        ctx.fill();
        ctx.stroke();
        
        ctx.font = '900 54px "Arial Black", sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.fillText('PLAY AGAIN', w/2, btnY + 80);
        
        ctx.restore();
    }
    
    gameLoop(now) {
        const dt = Math.min(0.1, (now - this.lastTime) / 1000);
        this.lastTime = now;
        
        this.update(dt);
        this.render();
        
        requestAnimationFrame((t) => this.gameLoop(t));
    }
}

/**
 * Procedural Audio Engine using HTML5 Web Audio API
 * Generates crisp runner sound effects and catchy ambient music!
 */
class ProceduralAudioEngine {
    constructor() {
        this.ctx = null;
        this.bgmPlaying = false;
        this.bgmTimer = null;
    }
    
    init() {
        if (!this.ctx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContext();
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }
    
    playCoin() {
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(987.77, now); // B5
        osc.frequency.setValueAtTime(1318.51, now + 0.08); // E6
        
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.28);
    }
    
    playJump() {
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(260, now);
        osc.frequency.exponentialRampToValueAtTime(740, now + 0.18);
        
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.22);
    }
    
    playSlide() {
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(450, now);
        osc.frequency.exponentialRampToValueAtTime(120, now + 0.22);
        
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.24);
    }
    
    playWhoosh() {
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(480, now + 0.08);
        
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.12);
    }
    
    playPowerup() {
        this.init();
        if (!this.ctx) return;
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C - E - G - C
        notes.forEach((freq, idx) => {
            const now = this.ctx.currentTime + (idx * 0.07);
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now);
            gain.gain.setValueAtTime(0.28, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.22);
        });
    }
    
    playCrash() {
        this.init();
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        // Low rumble oscillator
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.exponentialRampToValueAtTime(30, now + 0.45);
        gain.gain.setValueAtTime(0.45, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.5);
    }
    
    startBGM() {
        this.init();
        if (!this.ctx || this.bgmPlaying) return;
        this.bgmPlaying = true;
        
        // Loop upbeat melodic forest sequence
        const bassNotes = [110, 110, 130.81, 146.83, 164.81, 146.83, 130.81, 98];
        const melodyNotes = [440, 523.25, 587.33, 659.25, 587.33, 523.25, 440, 392];
        let step = 0;
        
        this.bgmTimer = setInterval(() => {
            if (!this.bgmPlaying || !this.ctx) return;
            const now = this.ctx.currentTime;
            
            // Bass thump
            const bOsc = this.ctx.createOscillator();
            const bGain = this.ctx.createGain();
            bOsc.type = 'triangle';
            bOsc.frequency.setValueAtTime(bassNotes[step % bassNotes.length], now);
            bGain.gain.setValueAtTime(0.08, now);
            bGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
            bOsc.connect(bGain);
            bGain.connect(this.ctx.destination);
            bOsc.start(now);
            bOsc.stop(now + 0.2);
            
            // Melodic Marimba Chime
            if (step % 2 === 0) {
                const mOsc = this.ctx.createOscillator();
                const mGain = this.ctx.createGain();
                mOsc.type = 'sine';
                mOsc.frequency.setValueAtTime(melodyNotes[(step / 2) % melodyNotes.length], now);
                mGain.gain.setValueAtTime(0.05, now);
                mGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
                mOsc.connect(mGain);
                mGain.connect(this.ctx.destination);
                mOsc.start(now);
                mOsc.stop(now + 0.25);
            }
            
            step++;
        }, 220);
    }
    
    stopBGM() {
        this.bgmPlaying = false;
        if (this.bgmTimer) {
            clearInterval(this.bgmTimer);
            this.bgmTimer = null;
        }
    }
}

window.C3Runtime = C3Runtime;
