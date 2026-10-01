// World Map / Level Progression Map Screen for Mad Snake

class WorldMap {
    constructor(game) {
        this.game = game;
        this.scrollY = 0;
        this.targetScrollY = 0;
        this.maxScrollY = 0;
        this.minScrollY = -1200; // Will be computed based on content height
        this.isDragging = false;
        this.lastDragY = 0;
        this.velocity = 0;
        this.time = 0;

        // Level positions on the winding path (from bottom to top)
        // Y coordinates relative to world map space (0 = top/Mad Mode, down to ~2600 = Level 1)
        this.nodes = [
            { levelId: 1, label: "L1 · Green Meadow", icon: "plant", flag: null, x: 540, y: 2600 },
            { levelId: 2, label: "L2 · Flower Fields", icon: "plant", flag: null, x: 340, y: 2420 },
            { levelId: 3, label: "L3 · Vineyard", icon: "plant", flag: null, x: 740, y: 2240 },
            { levelId: 4, label: "L4 · Forest Haven", icon: "plant", flag: null, x: 540, y: 2060 },
            { levelId: 5, label: "L5 · Final Challenge", icon: "num5", flag: null, x: 280, y: 1880 },
            { levelId: 6, label: "L6 · Into the Woods", icon: "mushroom", flag: null, x: 720, y: 1680 },
            { levelId: 7, label: "L7 · Sunny Cove", icon: "shell", flag: null, x: 280, y: 1460 },
            { levelId: 8, label: "L8 · Frozen Pond", icon: "snowflake", flag: null, x: 720, y: 1240 },
            { levelId: 9, label: "L9 · Outback Adventure", icon: "flag_au", flag: "flag_au", x: 280, y: 1020 },
            { levelId: 10, label: "L10 · Stars & Stripes", icon: "flag_us", flag: "flag_us", x: 720, y: 800 },
            { levelId: 11, label: "L11 · Rio Carnival", icon: "flag_br", flag: "flag_br", x: 280, y: 580 },
            { levelId: 12, label: "L12 · Fiesta Grande", icon: "flag_mx", flag: "flag_mx", x: 720, y: 360 },
            { levelId: 13, label: "L13 · Cherry Blossom", icon: "flag_jp", flag: "flag_jp", x: 280, y: 160 },
            { levelId: 99, label: "MAD MODE", icon: "mad_mode", flag: null, x: 540, y: -40 }
        ];

        this.totalHeight = 3100;
        this.scrollToLevel(this.game.levelManager.currentLevelId);
    }

    scrollToLevel(levelId) {
        const node = this.nodes.find(n => n.levelId === levelId) || this.nodes[3]; // default L4
        // Center node in the screen (screen height is 1920)
        this.targetScrollY = -(node.y - 1000);
        this.clampScroll();
        this.scrollY = this.targetScrollY;
    }

    clampScroll() {
        const minScroll = -(this.totalHeight - 1920 + 200);
        const maxScroll = 120;
        if (this.targetScrollY < minScroll) this.targetScrollY = minScroll;
        if (this.targetScrollY > maxScroll) this.targetScrollY = maxScroll;
    }

    handleTouchStart(x, y) {
        this.isDragging = true;
        this.lastDragY = y;
        this.velocity = 0;
    }

    handleTouchMove(x, y) {
        if (!this.isDragging) return;
        const delta = y - this.lastDragY;
        this.scrollY += delta;
        this.targetScrollY = this.scrollY;
        this.velocity = delta;
        this.lastDragY = y;
    }

    handleTouchEnd(x, y) {
        this.isDragging = false;
        this.clampScroll();
    }

    handleClick(x, y) {
        // Check top bar buttons (x, y are in 1080x1920 layout coordinates)
        if (y >= 50 && y <= 150) {
            // Home button (top-left: x 60 to 160)
            if (x >= 50 && x <= 150) {
                this.game.audio.playClick();
                this.game.startLevel(this.game.levelManager.currentLevelId);
                return true;
            }
            // Crown / Trophy button (top-right: x 920 to 1020)
            if (x >= 920 && x <= 1020) {
                this.game.audio.playClick();
                this.game.ui.showTrophyModal();
                return true;
            }
        }

        // Check Endless Mode Button (x: 300 to 780, y: 140 to 220)
        if (x >= 300 && x <= 780 && y >= 140 && y <= 220) {
            this.game.audio.playBonus();
            this.game.startEndlessMode();
            return true;
        }

        // Check level nodes
        const worldY = y - this.scrollY;
        for (const node of this.nodes) {
            const dx = x - node.x;
            const dy = worldY - node.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            // Check click on node circle (radius 80) or pill label
            if (dist < 85 || (Math.abs(dx) < 160 && Math.abs(dy - 85) < 35)) {
                this.selectLevel(node.levelId);
                return true;
            }
        }
        return false;
    }

    selectLevel(levelId) {
        const unlocked = this.game.levelManager.maxUnlockedLevel;
        if (levelId <= unlocked || (levelId === 99 && unlocked >= 13)) {
            this.game.audio.playClick();
            this.game.startLevel(levelId);
        } else {
            this.game.audio.playHit();
            this.game.particles.addFloatingText("LOCKED!", 540, 960, "#f87171", 52);
        }
    }

    update(dt) {
        this.time += dt;

        if (!this.isDragging) {
            // Smooth inertia
            this.scrollY += (this.targetScrollY - this.scrollY) * Math.min(1, dt * 10);
            this.clampScroll();
        }
    }

    draw(ctx, images) {
        ctx.save();
        ctx.translate(0, this.scrollY);

        // Draw Biome Backgrounds
        this.drawBiomes(ctx);

        // Draw Winding Path
        this.drawWindingPath(ctx);

        // Draw Environmental Props (Trees, Snowman, Kangaroos, Landmarks)
        this.drawProps(ctx, images);

        // Draw Nodes
        this.drawNodes(ctx, images);

        ctx.restore();

        // Draw Fixed Top HUD Header on World Map
        this.drawTopHUD(ctx, images);
    }

    drawBiomes(ctx) {
        // Gradient stripes representing each biome
        const biomes = [
            { y1: -200, y2: 100, grad: ['#090514', '#1e0b36', '#4a154b'] }, // Mad Mode Cosmic
            { y1: 100, y2: 320, grad: ['#fbcfe8', '#f472b6', '#fda4af'] },  // Sakura Japan
            { y1: 320, y2: 540, grad: ['#fb923c', '#ea580c', '#c2410c'] },  // Mexico Fiesta
            { y1: 540, y2: 760, grad: ['#10b981', '#059669', '#047857'] },  // Rio Carnival
            { y1: 760, y2: 980, grad: ['#1e3a8a', '#1d4ed8', '#2563eb'] },  // Stars & Stripes USA
            { y1: 980, y2: 1200, grad: ['#b45309', '#92400e', '#78350f'] }, // Outback Australia
            { y1: 1200, y2: 1420, grad: ['#e0f2fe', '#bae6fd', '#7dd3fc'] }, // Frozen Pond
            { y1: 1420, y2: 1640, grad: ['#fef08a', '#fde047', '#eab308'] }, // Sunny Cove Beach
            { y1: 1640, y2: 2800, grad: ['#22c55e', '#16a34a', '#15803d'] }  // Forest Meadow
        ];

        for (const b of biomes) {
            const grad = ctx.createLinearGradient(0, b.y1, 0, b.y2);
            grad.addColorStop(0, b.grad[0]);
            grad.addColorStop(0.5, b.grad[1]);
            grad.addColorStop(1, b.grad[2]);
            ctx.fillStyle = grad;
            ctx.fillRect(0, b.y1, 1080, b.y2 - b.y1 + 4);
        }
    }

    drawWindingPath(ctx) {
        ctx.save();
        ctx.beginPath();
        // Path starts at L1 and curves smoothly through all nodes
        const pts = this.nodes.map(n => ({ x: n.x, y: n.y }));
        
        ctx.moveTo(pts[0].x, pts[0].y + 100);
        for (let i = 0; i < pts.length - 1; i++) {
            const p0 = pts[i];
            const p1 = pts[i + 1];
            const mx = (p0.x + p1.x) / 2;
            const my = (p0.y + p1.y) / 2;
            ctx.quadraticCurveTo(p0.x, p0.y, mx, my);
        }
        const last = pts[pts.length - 1];
        ctx.lineTo(last.x, last.y);

        // Road Outer Border
        ctx.lineWidth = 110;
        ctx.strokeStyle = '#e2d3b3';
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();

        // Road Inner Surface
        ctx.lineWidth = 92;
        ctx.strokeStyle = '#f5efe0';
        ctx.stroke();

        ctx.restore();
    }

    drawProps(ctx, images) {
        ctx.save();

        // 1. Forest Biome: Pine Trees & Stumps (y ~ 1700 - 2400)
        ctx.fillStyle = '#166534';
        for (const [tx, ty] of [[180, 2300], [860, 2200], [220, 1980], [820, 1800], [160, 1720]]) {
            ctx.beginPath();
            ctx.moveTo(tx, ty);
            ctx.lineTo(tx - 36, ty + 64);
            ctx.lineTo(tx + 36, ty + 64);
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(tx, ty + 40);
            ctx.lineTo(tx - 48, ty + 100);
            ctx.lineTo(tx + 48, ty + 100);
            ctx.fill();
        }

        // Tree stumps
        ctx.fillStyle = '#78350f';
        ctx.beginPath();
        ctx.ellipse(540, 1960, 22, 12, 0, 0, Math.PI * 2);
        ctx.fill();

        // 2. Beach Biome (y ~ 1450): Palm Trees & Sun
        ctx.fillStyle = '#fde047';
        ctx.beginPath();
        ctx.arc(820, 1420, 36, 0, Math.PI * 2);
        ctx.fill();

        // Palm trees
        ctx.fillStyle = '#15803d';
        for (const [px, py] of [[680, 1450], [920, 1470]]) {
            ctx.strokeStyle = '#78350f';
            ctx.lineWidth = 8;
            ctx.beginPath();
            ctx.moveTo(px, py + 70);
            ctx.quadraticCurveTo(px + 10, py + 30, px, py);
            ctx.stroke();
            // Fronds
            ctx.beginPath();
            ctx.arc(px, py, 26, 0, Math.PI * 2);
            ctx.fill();
        }

        // 3. Snow Biome (y ~ 1250): Snowman & Snow Pine
        ctx.fillStyle = '#ffffff';
        // Snowman
        ctx.beginPath();
        ctx.arc(140, 1280, 24, 0, Math.PI * 2);
        ctx.arc(140, 1250, 18, 0, Math.PI * 2);
        ctx.fill();

        // 4. Outback Biome (y ~ 1000): Kangaroos (Silhouettes)
        ctx.fillStyle = '#5c2b12';
        for (const [kx, ky] of [[540, 1040], [680, 1010]]) {
            ctx.beginPath();
            ctx.ellipse(kx, ky, 28, 42, 0.2, 0, Math.PI * 2);
            ctx.arc(kx + 12, ky - 48, 16, 0, Math.PI * 2);
            ctx.fill();
        }

        // 5. City Biome (y ~ 780): Skyscrapers & Statue
        ctx.fillStyle = '#334155';
        ctx.fillRect(360, 720, 48, 110);
        ctx.fillRect(420, 700, 56, 130);
        // Golden windows
        ctx.fillStyle = '#fef08a';
        for (let row = 0; row < 5; row++) {
            ctx.fillRect(372, 735 + row * 16, 8, 8);
            ctx.fillRect(436, 715 + row * 16, 8, 8);
            ctx.fillRect(456, 715 + row * 16, 8, 8);
        }

        // 6. Fiesta Biome (y ~ 380): Buntings / Banners
        const colors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#ec4899'];
        for (let b = 0; b < 6; b++) {
            ctx.fillStyle = colors[b % colors.length];
            ctx.fillRect(400 + b * 22, 420, 16, 22);
        }

        // 7. Sakura Biome (y ~ 180): Cherry blossom trees
        ctx.fillStyle = '#f472b6';
        for (const [sx, sy] of [[720, 220], [860, 200]]) {
            ctx.beginPath();
            ctx.arc(sx, sy, 32, 0, Math.PI * 2);
            ctx.arc(sx - 18, sy + 10, 22, 0, Math.PI * 2);
            ctx.arc(sx + 18, sy + 10, 22, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#78350f';
            ctx.fillRect(sx - 4, sy + 25, 8, 30);
            ctx.fillStyle = '#f472b6';
        }

        // 8. Mad Mode Apex Cosmic Vortex (y ~ -40)
        const pulse = Math.sin(this.time * 3) * 8;
        ctx.save();
        ctx.shadowColor = '#c084fc';
        ctx.shadowBlur = 40 + pulse;
        const gradMad = ctx.createRadialGradient(540, -40, 20, 540, -40, 130 + pulse);
        gradMad.addColorStop(0, '#c084fc');
        gradMad.addColorStop(0.5, '#7e22ce');
        gradMad.addColorStop(1, 'rgba(15, 5, 29, 0)');
        ctx.fillStyle = gradMad;
        ctx.beginPath();
        ctx.arc(540, -40, 140 + pulse, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        ctx.restore();
    }

    drawNodes(ctx, images) {
        const maxUnlocked = this.game.levelManager.maxUnlockedLevel;
        const currentActive = this.game.levelManager.currentLevelId;

        for (const node of this.nodes) {
            const isMad = node.levelId === 99;
            const isCompleted = node.levelId < maxUnlocked || (node.levelId === 13 && maxUnlocked > 13);
            const isCurrent = node.levelId === currentActive;
            const isLocked = !isCompleted && !isCurrent && (isMad ? maxUnlocked < 13 : node.levelId > maxUnlocked);

            const nx = node.x;
            const ny = node.y;

            ctx.save();

            // Mad Mode Sphere Special Render
            if (isMad) {
                ctx.beginPath();
                ctx.arc(nx, ny, 110, 0, Math.PI * 2);
                ctx.fillStyle = '#0f051d';
                ctx.fill();
                ctx.lineWidth = 8;
                ctx.strokeStyle = '#a855f7';
                ctx.stroke();

                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 36px "Outfit", sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('MAD', nx, ny - 24);
                ctx.fillText('MODE', nx, ny + 24);

                if (isLocked && images.icon_lock) {
                    ctx.drawImage(images.icon_lock, nx + 40, ny + 20, 48, 48);
                }
                ctx.restore();
                continue;
            }

            // Normal Node Circle Base
            const radius = 64;

            // Pulsing highlight for current active level
            if (isCurrent) {
                const ringPulse = (Math.sin(this.time * 4) + 1) * 12;
                ctx.beginPath();
                ctx.arc(nx, ny, radius + 14 + ringPulse, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(56, 189, 248, 0.35)';
                ctx.fill();
            }

            // Node Outer Golden Ring
            ctx.beginPath();
            ctx.arc(nx, ny, radius, 0, Math.PI * 2);
            ctx.fillStyle = '#fde68a';
            ctx.fill();
            ctx.lineWidth = 7;
            ctx.strokeStyle = '#f59e0b';
            ctx.stroke();

            // Node Inner Circle
            ctx.beginPath();
            ctx.arc(nx, ny, radius - 8, 0, Math.PI * 2);
            if (isCurrent) {
                ctx.fillStyle = '#38bdf8';
            } else if (isCompleted) {
                ctx.fillStyle = '#f59e0b';
            } else {
                ctx.fillStyle = '#e2e8f0';
            }
            ctx.fill();

            // Draw Node Icon / Flag / Number
            if (node.flag && images[node.flag]) {
                ctx.drawImage(images[node.flag], nx - 42, ny - 28, 84, 56);
            } else if (node.icon === 'mushroom' && images.icon_mushroom) {
                ctx.drawImage(images.icon_mushroom, nx - 36, ny - 36, 72, 72);
            } else if (node.icon === 'shell' && images.icon_shell) {
                ctx.drawImage(images.icon_shell, nx - 36, ny - 36, 72, 72);
            } else if (node.icon === 'snowflake' && images.icon_snowflake) {
                ctx.drawImage(images.icon_snowflake, nx - 36, ny - 36, 72, 72);
            } else {
                // Number icon
                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 52px "Outfit", sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(node.levelId.toString(), nx, ny);
            }

            // Status Badge (Checkmark, Lock, or Active)
            if (isCompleted && images.icon_check) {
                ctx.drawImage(images.icon_check, nx + 24, ny + 16, 44, 44);
            } else if (isLocked && images.icon_lock) {
                ctx.drawImage(images.icon_lock, nx + 22, ny + 16, 44, 44);
            }

            // Level Pill Label below node
            const pillY = ny + 85;
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.roundRect(nx - 140, pillY - 24, 280, 48, 24);
            ctx.fill();
            ctx.strokeStyle = '#e2e8f0';
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.fillStyle = '#0f172a';
            ctx.font = '600 24px "Outfit", sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(node.label, nx, pillY);

            // "YOU ARE HERE" badge
            if (isCurrent) {
                const badgeY = pillY + 44;
                ctx.fillStyle = '#0284c7';
                ctx.beginPath();
                ctx.roundRect(nx - 110, badgeY - 18, 220, 36, 18);
                ctx.fill();

                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 18px "Outfit", sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('YOU ARE HERE', nx, badgeY);
            }

            ctx.restore();
        }
    }

    drawTopHUD(ctx, images) {
        ctx.save();
        // Semi-transparent header blur background
        const grad = ctx.createLinearGradient(0, 0, 0, 230);
        grad.addColorStop(0, 'rgba(0, 0, 0, 0.85)');
        grad.addColorStop(0.7, 'rgba(0, 0, 0, 0.6)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 1080, 230);

        // Home Button (Top Left)
        if (images.icon_home) {
            ctx.drawImage(images.icon_home, 60, 50, 76, 76);
        }

        // Crown / Trophy Button (Top Right)
        if (images.icon_crown) {
            ctx.drawImage(images.icon_crown, 944, 50, 76, 76);
        }

        // Title in Top Center
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 36px "Outfit", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = 'rgba(0,0,0,0.8)';
        ctx.shadowBlur = 10;
        ctx.fillText('LEVEL SELECT', 540, 85);

        // Endless Mode Launch Button
        const btnX = 540;
        const btnY = 175;
        const btnW = 440;
        const btnH = 68;

        const pulse = (Math.sin(this.time * 4) + 1) * 3;
        ctx.save();
        ctx.shadowColor = '#f59e0b';
        ctx.shadowBlur = 14 + pulse;

        // Button Gradient
        const btnGrad = ctx.createLinearGradient(btnX - btnW/2, 0, btnX + btnW/2, 0);
        btnGrad.addColorStop(0, '#ea580c');
        btnGrad.addColorStop(0.5, '#f59e0b');
        btnGrad.addColorStop(1, '#eab308');
        ctx.fillStyle = btnGrad;
        ctx.beginPath();
        ctx.roundRect(btnX - btnW/2, btnY - btnH/2, btnW, btnH, 34);
        ctx.fill();

        ctx.strokeStyle = '#fef08a';
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 28px "Outfit", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = 'rgba(0,0,0,0.6)';
        ctx.shadowBlur = 6;
        ctx.fillText('⚡ PLAY ENDLESS MODE', btnX, btnY);
        ctx.restore();

        ctx.restore();
    }
}

window.WorldMap = WorldMap;
