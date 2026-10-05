// Ready to Go by Bus - High-Performance Canvas 2D Renderer
// Faithful visual recreation of demo.mp4 with 60FPS animations, isometric depth sorting, and particle effects

class GameRenderer {
    constructor(canvas, engine) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.engine = engine;
        this.images = {};
        this.imagesLoaded = false;
        this.animTime = 0;
    }

    async preloadImages() {
        const imageList = [
            'background.png',
            'bus_shelter.png',
            'tree.png',
            'queue_door.png',
            'parking_slot.png',
            'parking_slot_locked.png',
            'stanchion_post.png',
            'badge_level.png',
            'badge_queue.png',
            'btn_pause.png',
            'btn_sound_on.png',
            'btn_sound_off.png',
            'btn_refresh.png',
            'btn_vip.png',
            'btn_sort.png',
            'btn_uturn.png',
            'banner_parking_full.png',
            'popup_win.png',
            'popup_fail.png',
            'particle_smoke.png'
        ];

        // Colors & vehicle types
        const colors = ['red', 'purple', 'pink', 'blue', 'green', 'yellow', 'maroon'];
        const vtypes = ['bus', 'van', 'car'];
        const dirs = ['nw', 'ne', 'se', 'sw', 'straight'];

        colors.forEach(c => {
            imageList.push(`passenger_${c}.png`);
            imageList.push(`seat_passenger_${c}.png`);
            vtypes.forEach(vt => {
                dirs.forEach(d => {
                    imageList.push(`${vt}_${c}_${d}.png`);
                });
            });
        });

        const promises = imageList.map(name => {
            return new Promise((resolve) => {
                const img = new Image();
                img.onload = () => {
                    this.images[name] = img;
                    resolve();
                };
                img.onerror = () => {
                    console.warn(`Could not load image: ${name}`);
                    resolve();
                };
                img.src = `images/${name}`;
            });
        });

        await Promise.all(promises);
        this.imagesLoaded = true;
    }

    getImage(name) {
        return this.images[name] || null;
    }

    render(dt = 0.016) {
        this.animTime += dt;
        const ctx = this.ctx;
        ctx.clearRect(0, 0, 1080, 1920);

        // 1. Base Background
        const bg = this.getImage('background.png');
        if (bg) {
            ctx.drawImage(bg, 0, 0, 1080, 1920);
        } else {
            ctx.fillStyle = '#7ecb47';
            ctx.fillRect(0, 0, 1080, 1920);
        }

        // 2. Bus Station Scenery
        this.renderScenery(ctx);

        // 3. Queue line and passengers
        this.renderQueue(ctx);

        // 4. Parking Bays
        this.renderParkingBays(ctx);

        // 5. Parked & Traveling Vehicles
        this.renderVehicles(ctx);

        // 6. Running In-Flight Passengers
        this.renderRunningPassengers(ctx);

        // 7. Particles & VFX
        this.engine.particles.render(ctx);

        // 8. Warning Banner
        if (this.engine.warningBanner.visible) {
            const warnImg = this.getImage('banner_parking_full.png');
            if (warnImg) {
                ctx.drawImage(warnImg, (1080 - 700) / 2, 790, 700, 120);
            }
        }

        // 9. Top HUD (Level, Queue Badge, Controls)
        this.renderHUD(ctx);

        // 10. Bottom Booster Dock
        this.renderBoosters(ctx);

        // 11. Overlays (Win / Fail)
        this.renderDialogs(ctx);
    }

    renderScenery(ctx) {
        // Doorway at right
        const door = this.getImage('queue_door.png');
        if (door) {
            ctx.drawImage(door, 740, 240, 110, 170);
        }

        // Bus Shelter
        const shelter = this.getImage('bus_shelter.png');
        if (shelter) {
            ctx.drawImage(shelter, 370, 200, 360, 200);
        }

        // Left and Right Trees with subtle breeze swaying
        const tree = this.getImage('tree.png');
        if (tree) {
            const swayL = Math.sin(this.animTime * 1.5) * 4;
            const swayR = Math.cos(this.animTime * 1.8) * 4;
            ctx.drawImage(tree, 80 + swayL, 180, 200, 240);
            ctx.drawImage(tree, 810 + swayR, 180, 200, 240);
        }

        // Queue Sign hanging next to shelter
        const qSign = this.getImage('badge_queue.png');
        if (qSign) {
            ctx.drawImage(qSign, 260, 230, 150, 110);
            // Counter text
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 36px "Segoe UI", Arial, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(this.engine.queueRemaining.toString(), 335, 275);
        }
    }

    renderQueue(ctx) {
        // Red velvet rope connecting stanchions
        ctx.strokeStyle = '#c53030';
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        ctx.beginPath();
        // Path from doorway down and left
        ctx.moveTo(780, 360);
        ctx.quadraticCurveTo(780, 445, 760, 445);
        ctx.lineTo(270, 445);
        ctx.stroke();

        // Stanchion posts
        const post = this.getImage('stanchion_post.png');
        const postPositions = [
            { x: 780, y: 360 },
            { x: 775, y: 410 },
            { x: 750, y: 445 },
            { x: 620, y: 445 },
            { x: 490, y: 445 },
            { x: 360, y: 445 },
            { x: 260, y: 445 }
        ];

        // Draw queue passengers
        const maxVisible = 18;
        const visibleQueue = this.engine.queue.slice(0, maxVisible);

        visibleQueue.forEach((p, idx) => {
            let px, py;
            if (idx < 12) {
                // Horizontal stretch
                px = 300 + idx * 36;
                py = 430;
            } else {
                // Vertical turn stretch towards door
                px = 750;
                py = 430 - (idx - 11) * 32;
            }

            // Cheerful breathing / bobbing
            const bob = Math.sin(this.animTime * 6 + idx * 0.6) * 3;

            const pSprite = this.getImage(`passenger_${p.color}.png`);
            if (pSprite) {
                ctx.drawImage(pSprite, px - 28, py - 40 + bob, 56, 76);
            }
        });

        // Draw stanchion posts on top of queue rope
        if (post) {
            postPositions.forEach(pos => {
                ctx.drawImage(post, pos.x - 15, pos.y - 35, 30, 70);
            });
        }
    }

    renderParkingBays(ctx) {
        const slotImg = this.getImage('parking_slot.png');
        const lockedImg = this.getImage('parking_slot_locked.png');

        this.engine.bays.forEach(bay => {
            ctx.save();
            ctx.translate(bay.x, bay.y);
            ctx.rotate(bay.angle);

            const img = bay.unlocked ? slotImg : lockedImg;
            if (img) {
                ctx.drawImage(img, -65, -110, 130, 220);
            }

            ctx.restore();
        });
    }

    renderVehicles(ctx) {
        // Split vehicles:
        // 1. Parked vehicles (drawn at bay angle)
        // 2. Lot vehicles & traveling vehicles (depth sorted by Y)

        // Depth sort active lot vehicles
        const sortedVehicles = [...this.engine.vehicles]
            .filter(v => v.state !== 'REMOVED')
            .sort((a, b) => a.y - b.y);

        sortedVehicles.forEach(v => {
            if (v.state === 'PARKED') {
                this.renderParkedVehicle(ctx, v);
            } else {
                this.renderLotVehicle(ctx, v);
            }
        });
    }

    renderParkedVehicle(ctx, v) {
        const bay = this.engine.bays[v.bayIndex];
        const angle = bay ? bay.angle : 0;

        ctx.save();
        ctx.translate(v.x, v.y);
        ctx.rotate(angle);

        // Vehicle straight body
        const sprite = this.getImage(`${v.type}_${v.color}_straight.png`);
        if (sprite) {
            ctx.drawImage(sprite, -v.width / 2 - 10, -v.length / 2 - 15, v.width + 20, v.length + 30);
        }

        // Render seated passengers in their designated seat slots!
        const rows = v.type === 'bus' ? 5 : (v.type === 'van' ? 3 : 2);
        const seatW = 26;
        const seatH = 24;
        const startY = -v.length / 2 + 35;
        const rowSpacing = (v.length - 70) / Math.max(1, rows - 1);

        v.passengers.forEach((pColor, idx) => {
            const r = Math.floor(idx / 2);
            const isRight = (idx % 2 === 1);
            const sx = isRight ? 18 : -18 - seatW;
            const sy = startY + r * rowSpacing;

            const pSeat = this.getImage(`seat_passenger_${pColor}.png`);
            if (pSeat) {
                ctx.drawImage(pSeat, sx - 2, sy - 4, 34, 34);
            }
        });

        ctx.restore();
    }

    renderLotVehicle(ctx, v) {
        ctx.save();

        let drawX = v.x;
        let drawY = v.y;

        // Wobble when blocked
        if (v.state === 'WOBBLE') {
            const shake = Math.sin(v.wobbleTimer * 60) * 8;
            drawX += shake;
        }

        ctx.translate(drawX, drawY);

        // Highlight if U-turn booster active
        if (this.engine.selectedBooster === 'uturn' && v.state === 'IDLE') {
            const pulse = 1.0 + Math.sin(this.animTime * 10) * 0.08;
            ctx.strokeStyle = '#00d2d3';
            ctx.lineWidth = 6;
            ctx.strokeRect(-v.width / 2 * pulse - 10, -v.length / 2 * pulse - 10, (v.width + 20) * pulse, (v.length + 20) * pulse);
        }

        const dir = (v.dir === 'straight' || !v.dir) ? 'nw' : v.dir;
        const sprite = this.getImage(`${v.type}_${v.color}_${dir}.png`);

        if (sprite) {
            // Sprites are square bounding boxes
            const size = sprite.width;
            ctx.drawImage(sprite, -size / 2, -size / 2, size, size);
        }

        ctx.restore();
    }

    renderRunningPassengers(ctx) {
        this.engine.runningPassengers.forEach(rp => {
            const t = rp.progress;
            // Arc trajectory
            const curX = rp.startX + (rp.targetX - rp.startX) * t;
            const linearY = rp.startY + (rp.targetY - rp.startY) * t;
            const arcHeight = Math.sin(t * Math.PI) * 90;
            const curY = linearY - arcHeight;

            const sprite = this.getImage(`passenger_${rp.color}.png`);
            if (sprite) {
                ctx.save();
                ctx.translate(curX, curY);
                // Slight celebratory rotation while leaping
                const rot = Math.sin(t * Math.PI * 2) * 0.2;
                ctx.rotate(rot);
                ctx.drawImage(sprite, -28, -38, 56, 76);
                ctx.restore();
            }
        });
    }

    renderHUD(ctx) {
        // Level Badge (Top Center)
        const lvlBadge = this.getImage('badge_level.png');
        if (lvlBadge) {
            ctx.drawImage(lvlBadge, 400, 25, 280, 80);
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 36px "Segoe UI", Arial, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(`Level ${this.engine.level}`, 540, 65);
        }

        // Pause Button (Top Right)
        const pBtn = this.getImage('btn_pause.png');
        if (pBtn) {
            ctx.drawImage(pBtn, 960, 25, 80, 80);
        }

        // Sound Button
        const sndImg = this.getImage(this.engine.audio.muted ? 'btn_sound_off.png' : 'btn_sound_on.png');
        if (sndImg) {
            ctx.drawImage(sndImg, 860, 25, 80, 80);
        }
    }

    renderBoosters(ctx) {
        const boosterConfigs = [
            { key: 'refresh', img: 'btn_refresh.png', x: 130, y: 1730 },
            { key: 'vip',     img: 'btn_vip.png',     x: 390, y: 1730 },
            { key: 'sort',    img: 'btn_sort.png',    x: 650, y: 1730 },
            { key: 'uturn',   img: 'btn_uturn.png',   x: 910, y: 1730 }
        ];

        boosterConfigs.forEach(b => {
            const btnImg = this.getImage(b.img);
            if (btnImg) {
                ctx.save();
                ctx.translate(b.x, b.y);

                // Highlight if active
                if (this.engine.selectedBooster === b.key) {
                    ctx.shadowColor = '#00ffff';
                    ctx.shadowBlur = 20;
                }

                ctx.drawImage(btnImg, -105, -90, 210, 180);
                ctx.restore();
            }
        });
    }

    renderDialogs(ctx) {
        if (this.engine.state === 'LEVEL_WIN') {
            const winImg = this.getImage('popup_win.png');
            if (winImg) {
                ctx.drawImage(winImg, (1080 - 840) / 2, (1920 - 960) / 2, 840, 960);
            }
        } else if (this.engine.state === 'GAME_OVER') {
            const failImg = this.getImage('popup_fail.png');
            if (failImg) {
                ctx.drawImage(failImg, (1080 - 840) / 2, (1920 - 960) / 2, 840, 960);
            }
        }
    }
}

window.GameRenderer = GameRenderer;
