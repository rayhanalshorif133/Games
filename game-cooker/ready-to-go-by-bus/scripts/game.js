// Ready to Go by Bus - Core Game Engine
// Manages vehicle parking jam, raycast unblocking, passenger queue, and boarding mechanics

class GameEngine {
    constructor() {
        this.level = 2; // Default to Level 2 as featured in demo.mp4
        this.levelData = null;
        this.allLevels = [];
        this.state = 'PLAYING'; // 'PLAYING', 'PAUSED', 'LEVEL_WIN', 'GAME_OVER'

        this.queueRemaining = 338;
        this.queue = [];
        this.runningPassengers = []; // Passengers in transit from queue to bus seats

        this.vehicles = [];
        this.bays = [];
        this.activeBayCount = 4;
        this.maxBayCount = 7;

        this.warningBanner = {
            visible: false,
            timer: 0,
            text: "The current parking space is full"
        };

        this.selectedBooster = null;
        this.boosterCounts = {
            refresh: 3,
            vip: 2,
            sort: 3,
            uturn: 3
        };

        this.audio = new AudioManager();
        this.particles = new ParticleSystem();

        this.setupBays();
    }

    setupBays() {
        this.bays = [];
        const bayXs = [190, 310, 430, 550, 670, 790, 910];
        const bayY = 600;
        const angle = -15 * Math.PI / 180;

        for (let i = 0; i < this.maxBayCount; i++) {
            this.bays.push({
                index: i,
                x: bayXs[i],
                y: bayY,
                angle: angle,
                unlocked: i < this.activeBayCount,
                vehicleId: null
            });
        }
    }

    async loadGameData() {
        try {
            const resp = await fetch('data.json');
            const data = await resp.json();
            this.allLevels = data.levels || [];
            this.startLevel(this.level);
        } catch (e) {
            console.error('Failed to load level data, using fallback', e);
            this.startLevel(this.level);
        }
    }

    startLevel(levelNum) {
        this.level = levelNum;
        this.state = 'PLAYING';
        this.selectedBooster = null;
        this.warningBanner.visible = false;
        this.runningPassengers = [];
        this.particles.reset();

        const lData = this.allLevels.find(l => l.id === levelNum) || this.allLevels[0] || {
            totalQueue: 338,
            activeBays: 4,
            vehicles: []
        };

        this.levelData = lData;
        this.queueRemaining = lData.totalQueue || 338;
        this.activeBayCount = lData.activeBays || 4;

        // Reset bays
        this.setupBays();

        // Instantiate vehicles
        this.vehicles = (lData.vehicles || []).map((v, idx) => {
            const cap = v.type === 'bus' ? 10 : (v.type === 'van' ? 6 : 4);
            const len = v.type === 'bus' ? 240 : (v.type === 'van' ? 170 : 120);
            return {
                id: v.id || `v_${idx}`,
                type: v.type,
                color: v.color,
                x: v.x,
                y: v.y,
                initialX: v.x,
                initialY: v.y,
                dir: v.dir,
                length: len,
                width: 96,
                capacity: cap,
                passengers: [], // Colors of boarded passengers
                state: 'IDLE',  // 'IDLE', 'WOBBLE', 'DRIVING_EXIT', 'DRIVING_BAY', 'PARKED', 'DEPARTING', 'REMOVED'
                wobbleTimer: 0,
                pathProgress: 0,
                path: [],
                bayIndex: -1,
                departTimer: 0
            };
        });

        // Initialize pre-parked vehicles if level starts with active buses in bays (like in demo.mp4)
        if (this.level === 2) {
            // Bay 0: Red bus, Bay 1: Purple bus
            const redBus = {
                id: 'starter_red_bus',
                type: 'bus',
                color: 'red',
                x: this.bays[0].x,
                y: this.bays[0].y,
                dir: 'straight',
                length: 240,
                width: 96,
                capacity: 10,
                passengers: [],
                state: 'PARKED',
                bayIndex: 0,
                wobbleTimer: 0,
                pathProgress: 1,
                path: [],
                departTimer: 0
            };
            const purpleBus = {
                id: 'starter_purple_bus',
                type: 'bus',
                color: 'purple',
                x: this.bays[1].x,
                y: this.bays[1].y,
                dir: 'straight',
                length: 240,
                width: 96,
                capacity: 10,
                passengers: [],
                state: 'PARKED',
                bayIndex: 1,
                wobbleTimer: 0,
                pathProgress: 1,
                path: [],
                departTimer: 0
            };
            this.vehicles.unshift(purpleBus);
            this.vehicles.unshift(redBus);
            this.bays[0].vehicleId = redBus.id;
            this.bays[1].vehicleId = purpleBus.id;
        }

        // Generate Passenger Queue matching available vehicles
        this.generatePassengerQueue();

        // Check if initial parked buses can board right away
        this.checkQueueBoarding();
    }

    generatePassengerQueue() {
        this.queue = [];
        // Available vehicle colors in this level
        const colorPool = [];
        this.vehicles.forEach(v => {
            for (let i = 0; i < v.capacity; i++) {
                colorPool.push(v.color);
            }
        });

        // Shuffle with clusters so game has strategic matching rhythm
        let pool = [...colorPool];
        while (this.queue.length < 50 && pool.length > 0) {
            // Pick a color and create a cluster of 3 to 10
            const pickIdx = Math.floor(Math.random() * pool.length);
            const chosenColor = pool[pickIdx];
            const clusterSize = Math.min(pool.filter(c => c === chosenColor).length, 3 + Math.floor(Math.random() * 8));

            for (let i = 0; i < clusterSize; i++) {
                const foundIdx = pool.indexOf(chosenColor);
                if (foundIdx !== -1) {
                    this.queue.push({ color: chosenColor });
                    pool.splice(foundIdx, 1);
                }
            }
        }

        // Fill remaining up to 50 if needed
        const colors = ['red', 'purple', 'pink', 'blue', 'green'];
        while (this.queue.length < 50) {
            this.queue.push({ color: colors[Math.floor(Math.random() * colors.length)] });
        }
    }

    // Direction vector helpers
    getDirVector(dir) {
        switch (dir) {
            case 'nw': return { dx: -0.707, dy: -0.707 };
            case 'ne': return { dx:  0.707, dy: -0.707 };
            case 'se': return { dx:  0.707, dy:  0.707 };
            case 'sw': return { dx: -0.707, dy:  0.707 };
            default:   return { dx:  0,     dy: -1     };
        }
    }

    // Check if vehicle forward path is obstructed
    checkVehicleUnblocked(vehicle) {
        if (vehicle.state !== 'IDLE') return false;

        const vec = this.getDirVector(vehicle.dir);
        const halfW = vehicle.width * 0.45;
        const halfL = vehicle.length * 0.48;

        // Front bumper point
        const frontX = vehicle.x + vec.dx * halfL;
        const frontY = vehicle.y + vec.dy * halfL;

        // Raycast forward along vehicle trajectory to lot boundaries
        for (let step = 30; step < 1100; step += 25) {
            const testX = frontX + vec.dx * step;
            const testY = frontY + vec.dy * step;

            // Check if ray reached exit perimeter road
            if (testX <= 70 || testX >= 1010 || testY <= 870 || testY >= 1710) {
                // Reached open road without hitting any car!
                return true;
            }

            // Check collision against all other vehicles on the lot
            for (const other of this.vehicles) {
                if (other.id === vehicle.id) continue;
                if (other.state === 'REMOVED' || other.state === 'DEPARTING') continue;

                // Simple oriented distance check
                const dist = Math.hypot(testX - other.x, testY - other.y);
                const collisionRadius = (other.length + other.width) * 0.28;

                if (dist < collisionRadius) {
                    // Blocked!
                    return false;
                }
            }
        }

        return true;
    }

    // On player tap / click
    handleVehicleClick(vehicle) {
        if (this.state !== 'PLAYING') return;

        // If U-turn booster active: flip vehicle direction 180 degrees!
        if (this.selectedBooster === 'uturn') {
            const oppDir = {
                'nw': 'se',
                'se': 'nw',
                'ne': 'sw',
                'sw': 'ne'
            };
            vehicle.dir = oppDir[vehicle.dir] || 'nw';
            this.audio.playBooster('uturn');
            this.particles.emitBoardingSparkle(vehicle.x, vehicle.y, '50, 200, 255');
            this.boosterCounts.uturn--;
            this.selectedBooster = null;
            return;
        }

        if (vehicle.state !== 'IDLE') return;

        // Check if there is an empty parking bay available
        const openBay = this.bays.find(b => b.unlocked && b.vehicleId === null);
        if (!openBay) {
            // All parking spaces are full!
            this.showParkingFullWarning();
            this.audio.playWarningAlert();
            return;
        }

        // Check if vehicle has open path
        const isUnblocked = this.checkVehicleUnblocked(vehicle);
        if (!isUnblocked) {
            // Wobble / honk
            vehicle.state = 'WOBBLE';
            vehicle.wobbleTimer = 0.28;
            this.audio.playBlockedBump();
            this.particles.emitBump(vehicle.x, vehicle.y);
            return;
        }

        // Vehicle escapes and drives to parking bay!
        this.audio.playEngineStart();
        this.particles.emitSmoke(vehicle.x, vehicle.y);

        openBay.vehicleId = vehicle.id;
        vehicle.bayIndex = openBay.index;
        vehicle.state = 'DRIVING_EXIT';

        // Plan trajectory path:
        // 1. Forward along direction to perimeter road (X ≈ 50 if left, or X ≈ 1030 if right)
        // 2. Up perimeter road to top road (Y ≈ 780)
        // 3. Along top road to bay entrance
        // 4. Pull into bay slot
        const vec = this.getDirVector(vehicle.dir);
        const exitLeft = vec.dx < 0 || (vec.dx === 0 && vehicle.x < 540);
        const perimeterX = exitLeft ? 50 : 1030;

        const pathPoints = [];
        pathPoints.push({ x: vehicle.x, y: vehicle.y, dir: vehicle.dir });

        // Forward until perimeter road
        const forwardDist = Math.abs((perimeterX - vehicle.x) / (vec.dx || 0.01));
        const reachX = perimeterX;
        const reachY = Math.max(880, Math.min(1680, vehicle.y + vec.dy * forwardDist));
        pathPoints.push({ x: reachX, y: reachY, dir: vehicle.dir });

        // Up along perimeter road
        pathPoints.push({ x: perimeterX, y: 780, dir: 'straight' });

        // Along top road towards bay
        pathPoints.push({ x: openBay.x, y: 780, dir: 'straight' });

        // Pull into bay
        pathPoints.push({ x: openBay.x, y: openBay.y, dir: 'straight' });

        vehicle.path = pathPoints;
        vehicle.pathProgress = 0;
    }

    showParkingFullWarning() {
        this.warningBanner.visible = true;
        this.warningBanner.timer = 2.8;
    }

    // Queue Boarding Logic
    checkQueueBoarding() {
        if (this.queue.length === 0) return;

        // Check if head passenger matches any parked vehicle with space
        const headColor = this.queue[0].color;
        const matchingVehicle = this.vehicles.find(v =>
            v.state === 'PARKED' &&
            v.color === headColor &&
            v.passengers.length < v.capacity
        );

        if (matchingVehicle) {
            // Boarding!
            const passenger = this.queue.shift();
            // Start running passenger animation from queue head to vehicle
            const targetBay = this.bays[matchingVehicle.bayIndex];
            const seatIndex = matchingVehicle.passengers.length;

            this.runningPassengers.push({
                color: passenger.color,
                startX: 300, // Front of queue
                startY: 430,
                targetX: targetBay.x,
                targetY: targetBay.y - 40 + (seatIndex * 15),
                progress: 0,
                vehicleId: matchingVehicle.id,
                seatIndex: seatIndex
            });

            // Prevent overfilling while in-flight
            matchingVehicle.passengers.push(passenger.color);

            // Trigger next check shortly for chain boarding
            setTimeout(() => this.checkQueueBoarding(), 140);
        } else {
            // Check if all bays are occupied and none match
            const activeBays = this.bays.filter(b => b.unlocked);
            const occupiedBays = activeBays.filter(b => b.vehicleId !== null);
            if (occupiedBays.length === activeBays.length && this.runningPassengers.length === 0) {
                // Parking space is full and queue is stalled
                this.showParkingFullWarning();
            }
        }
    }

    // Vehicle full departure
    handleVehicleDepart(vehicle) {
        vehicle.state = 'DEPARTING';
        this.audio.playBusFull();

        setTimeout(() => {
            this.audio.playBusDepart();
            // Free the bay so next vehicle can park!
            if (vehicle.bayIndex !== -1) {
                this.bays[vehicle.bayIndex].vehicleId = null;
            }
        }, 350);
    }

    // Booster Actions
    useRefresh() {
        if (this.boosterCounts.refresh <= 0) return;
        this.boosterCounts.refresh--;
        this.audio.playBooster('refresh');

        // Shuffle directions of blocked idle vehicles
        const dirs = ['nw', 'ne', 'se', 'sw'];
        this.vehicles.forEach(v => {
            if (v.state === 'IDLE') {
                v.dir = dirs[Math.floor(Math.random() * dirs.length)];
                this.particles.emitBoardingSparkle(v.x, v.y, '255, 200, 50');
            }
        });
        this.particles.addFloatingText('SHUFFLED!', 540, 1100, '#ffd166');
    }

    useSort() {
        if (this.boosterCounts.sort <= 0) return;
        this.boosterCounts.sort--;
        this.audio.playBooster('sort');

        // Find colors of vehicles waiting in bays
        const waitingColors = this.vehicles
            .filter(v => v.state === 'PARKED' && v.passengers.length < v.capacity)
            .map(v => v.color);

        if (waitingColors.length > 0) {
            // Move passengers matching waiting buses to front of queue
            const matching = this.queue.filter(p => waitingColors.includes(p.color));
            const nonMatching = this.queue.filter(p => !waitingColors.includes(p.color));
            this.queue = [...matching, ...nonMatching];
        }

        this.particles.addFloatingText('QUEUE SORTED!', 540, 420, '#06d6a0');
        this.checkQueueBoarding();
    }

    useVipCar() {
        if (this.boosterCounts.vip <= 0) return;
        if (this.queue.length === 0) return;

        // Find or unlock an emergency bay
        let openBay = this.bays.find(b => b.unlocked && b.vehicleId === null);
        if (!openBay) {
            // Unlock next locked bay for VIP
            const lockedBay = this.bays.find(b => !b.unlocked);
            if (lockedBay) {
                lockedBay.unlocked = true;
                this.activeBayCount++;
                openBay = lockedBay;
            }
        }

        if (!openBay) {
            this.showParkingFullWarning();
            return;
        }

        this.boosterCounts.vip--;
        this.audio.playBooster('vip');

        const vipColor = this.queue[0].color;
        const vipCar = {
            id: `vip_car_${Date.now()}`,
            type: 'car',
            color: vipColor,
            x: openBay.x,
            y: openBay.y,
            dir: 'straight',
            length: 120,
            width: 96,
            capacity: 4,
            passengers: [],
            state: 'PARKED',
            bayIndex: openBay.index,
            wobbleTimer: 0,
            pathProgress: 1,
            path: [],
            departTimer: 0
        };

        this.vehicles.unshift(vipCar);
        openBay.vehicleId = vipCar.id;

        this.particles.emitBoardingSparkle(openBay.x, openBay.y, '255, 50, 50');
        this.particles.addFloatingText('VIP CAR ARRIVED!', openBay.x, openBay.y - 60, '#ff4757');

        this.checkQueueBoarding();
    }

    useUTurn() {
        if (this.boosterCounts.uturn <= 0) return;
        this.selectedBooster = this.selectedBooster === 'uturn' ? null : 'uturn';
        this.particles.addFloatingText('TAP A CAR TO FLIP!', 540, 1100, '#00d2d3');
    }

    unlockBay(bayIndex) {
        const bay = this.bays[bayIndex];
        if (bay && !bay.unlocked) {
            bay.unlocked = true;
            this.activeBayCount++;
            this.audio.playBooster('vip');
            this.particles.emitBoardingSparkle(bay.x, bay.y, '46, 204, 113');
            this.particles.addFloatingText('BAY UNLOCKED!', bay.x, bay.y - 50, '#2ecc71');
        }
    }

    update(dt) {
        if (this.state !== 'PLAYING') {
            this.particles.update(dt);
            return;
        }

        // Warning banner timer
        if (this.warningBanner.visible) {
            this.warningBanner.timer -= dt;
            if (this.warningBanner.timer <= 0) {
                this.warningBanner.visible = false;
            }
        }

        // Update vehicles
        for (const v of this.vehicles) {
            // Wobble timer
            if (v.state === 'WOBBLE') {
                v.wobbleTimer -= dt;
                if (v.wobbleTimer <= 0) {
                    v.state = 'IDLE';
                }
            }

            // Driving towards parking bay
            if (v.state === 'DRIVING_EXIT') {
                v.pathProgress += dt * 1.8; // Speed

                // Emit tire smoke while driving
                if (Math.random() < 0.4) {
                    this.particles.emitSmoke(v.x, v.y);
                }

                if (v.path && v.path.length >= 2) {
                    const totalSegments = v.path.length - 1;
                    const curProg = Math.min(1.0, v.pathProgress);
                    const segIdx = Math.min(totalSegments - 1, Math.floor(curProg * totalSegments));
                    const localT = (curProg * totalSegments) - segIdx;

                    const p0 = v.path[segIdx];
                    const p1 = v.path[segIdx + 1];

                    v.x = p0.x + (p1.x - p0.x) * localT;
                    v.y = p0.y + (p1.y - p0.y) * localT;
                    v.dir = p1.dir;

                    if (v.pathProgress >= 1.0) {
                        // Arrived in bay!
                        v.state = 'PARKED';
                        v.x = this.bays[v.bayIndex].x;
                        v.y = this.bays[v.bayIndex].y;
                        v.dir = 'straight';
                        this.checkQueueBoarding();
                    }
                }
            }

            // Departing full bus
            if (v.state === 'DEPARTING') {
                v.x += 650 * dt; // Drive fast to the right exit
                this.particles.emitSmoke(v.x - 60, v.y);

                if (v.x > 1250) {
                    v.state = 'REMOVED';
                    // Check level win
                    if (this.queueRemaining <= 0 && this.queue.length === 0) {
                        const activeVehicles = this.vehicles.filter(veh => veh.state !== 'REMOVED');
                        if (activeVehicles.length === 0) {
                            this.state = 'LEVEL_WIN';
                            this.audio.playLevelWin();
                            this.particles.launchConfetti();
                        }
                    }
                }
            }
        }

        // Update running passengers
        for (let i = this.runningPassengers.length - 1; i >= 0; i--) {
            const rp = this.runningPassengers[i];
            rp.progress += dt * 3.2; // Fast cheerful run

            if (rp.progress >= 1.0) {
                // Landed in seat!
                this.runningPassengers.splice(i, 1);
                this.audio.playBoardingPop(rp.seatIndex);
                this.particles.emitBoardingSparkle(rp.targetX, rp.targetY, '255, 230, 80');

                this.queueRemaining = Math.max(0, this.queueRemaining - 1);

                // Check if vehicle is full
                const targetV = this.vehicles.find(v => v.id === rp.vehicleId);
                if (targetV && targetV.passengers.length >= targetV.capacity) {
                    this.handleVehicleDepart(targetV);
                }

                // Continue boarding
                this.checkQueueBoarding();
            }
        }

        this.particles.update(dt);
    }
}

window.GameEngine = GameEngine;
