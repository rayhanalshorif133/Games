/**
 * Cook by Number - High-Resolution 2D Canvas Renderer (1080 x 1920)
 * Renders realistic industrial kitchen pods, retro-futuristic CRT computer,
 * dynamic glowing Bezier cables with energy flow, and glossy 3D numbered balls.
 */
class Renderer {
  constructor(canvas, ctx, game) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.game = game;
    this.time = 0;
  }

  render(deltaTime) {
    this.time += deltaTime;
    const ctx = this.ctx;
    const width = this.canvas.width;
    const height = this.canvas.height;

    ctx.clearRect(0, 0, width, height);

    // 1. Draw High-Tech Culinary Lab Background
    this.drawBackground(ctx, width, height);

    // 2. Draw Installed Cables & Active Cable Draft
    this.drawCables(ctx);

    // 3. Draw All Sockets & Ports
    this.drawPorts(ctx);

    // 4. Draw Start Dispenser Box
    this.drawStartBox(ctx);

    // 5. Draw End Computer Terminal Box
    this.drawEndBox(ctx);

    // 6. Draw Draggable Modifier Boxes
    this.drawModifierBoxes(ctx);

    // 7. Draw Ball (if rolling or resting)
    this.drawBall(ctx);

    // 8. Draw FX: Particles, Steam, Floating Popups, Confetti
    this.drawParticles(ctx);
    this.drawFloatingTexts(ctx);

    // 9. Draw Interactive Tutorial Guidance (Hand & Hints for 1st-time Level 1)
    this.drawTutorialGuidance(ctx);
  }

  /**
   * High-Tech Kitchen Surface with blueprint grid, rivets & ambient glow
   */
  drawBackground(ctx, w, h) {
    // Deep carbon metallic background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
    bgGrad.addColorStop(0, '#0a1017');
    bgGrad.addColorStop(0.5, '#070c12');
    bgGrad.addColorStop(1, '#04070a');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // Cyber grid lines
    ctx.save();
    ctx.strokeStyle = 'rgba(0, 229, 255, 0.035)';
    ctx.lineWidth = 2;
    const gridSize = 80;
    for (let x = 0; x < w; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Circuit track accents in background
    ctx.strokeStyle = 'rgba(255, 123, 37, 0.08)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(120, 200);
    ctx.lineTo(120, 600);
    ctx.lineTo(260, 740);
    ctx.moveTo(960, 300);
    ctx.lineTo(960, 1300);
    ctx.lineTo(820, 1440);
    ctx.stroke();

    // Soft ambient glow spots
    const radial = ctx.createRadialGradient(w / 2, h / 2, 200, w / 2, h / 2, 800);
    radial.addColorStop(0, 'rgba(255, 123, 37, 0.03)');
    radial.addColorStop(1, 'rgba(0, 0, 0, 0.6)');
    ctx.fillStyle = radial;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }

  /**
   * Draw Start Dispenser Box (Realistic Metallic Vault with Glass Porthole)
   */
  drawStartBox(ctx) {
    const box = this.game.startBox;
    if (!box) return;

    ctx.save();
    ctx.translate(box.x, box.y);

    const halfW = box.w / 2;
    const halfH = box.h / 2;
    const isDragging = this.game.dragBox === box;

    // Drop shadow (elevates when dragging)
    ctx.shadowColor = isDragging ? 'rgba(0, 229, 255, 0.45)' : 'rgba(0, 0, 0, 0.7)';
    ctx.shadowBlur = isDragging ? 35 : 22;
    ctx.shadowOffsetY = isDragging ? 18 : 10;

    // Outer Chassis: Heavy Titanium Brushed Metal
    const outerGrad = ctx.createLinearGradient(-halfW, -halfH, halfW, halfH);
    outerGrad.addColorStop(0, '#5a6d80');
    outerGrad.addColorStop(0.3, '#323e4b');
    outerGrad.addColorStop(0.7, '#1f2730');
    outerGrad.addColorStop(1, '#0f141a');

    ctx.fillStyle = outerGrad;
    this.roundRect(ctx, -halfW, -halfH, box.w, box.h, 20);
    ctx.fill();

    // Reset shadow
    ctx.shadowColor = 'transparent';

    // Metallic Bevel Border
    ctx.lineWidth = isDragging ? 4 : 3;
    ctx.strokeStyle = isDragging ? '#00e5ff' : '#8fa6be';
    ctx.stroke();

    // Inner Inset Plate
    ctx.fillStyle = '#0f1721';
    this.roundRect(ctx, -halfW + 10, -halfH + 10, box.w - 20, box.h - 20, 14);
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = isDragging ? 'rgba(0, 229, 255, 0.6)' : 'rgba(0, 229, 255, 0.3)';
    ctx.stroke();

    // Top Vault Name Header
    ctx.fillStyle = '#ff9800';
    ctx.font = '900 11px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('DISPENSER VAULT', 0, -halfH + 14);

    // Status Indicator LED
    const ledGlow = Math.sin(this.time * 4) * 0.2 + 0.8;
    ctx.beginPath();
    ctx.arc(-halfW + 18, -halfH + 20, 4.5, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(0, 230, 118, ${ledGlow})`;
    ctx.fill();
    ctx.strokeStyle = '#b9f6ca';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // 4 Corner Brass Rivets
    const rivetOffsets = [
      [-halfW + 8, -halfH + 8],
      [halfW - 8, -halfH + 8],
      [-halfW + 8, halfH - 8],
      [halfW - 8, halfH - 8]
    ];
    for (const [rx, ry] of rivetOffsets) {
      ctx.beginPath();
      ctx.arc(rx, ry, 3, 0, Math.PI * 2);
      ctx.fillStyle = '#8b6f47';
      ctx.fill();
      ctx.strokeStyle = '#dfba73';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Circular Glass Porthole Chamber
    const chamberR = 38;
    const chamberY = 10;
    ctx.beginPath();
    ctx.arc(0, chamberY, chamberR, 0, Math.PI * 2);
    const chamberGrad = ctx.createRadialGradient(0, chamberY, 6, 0, chamberY, chamberR);
    chamberGrad.addColorStop(0, '#1c2838');
    chamberGrad.addColorStop(0.75, '#0b121a');
    chamberGrad.addColorStop(1, '#05080c');
    ctx.fillStyle = chamberGrad;
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#29b6f6';
    ctx.stroke();

    // Glass Reflection Arch
    ctx.save();
    ctx.beginPath();
    ctx.arc(0, chamberY, chamberR - 4, Math.PI * 1.05, Math.PI * 1.95);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.restore();

    // Hatch Ejection Nozzle on Right
    ctx.fillStyle = '#222d38';
    ctx.fillRect(halfW - 4, chamberY - 10, 10, 20);
    ctx.strokeStyle = '#ff9800';
    ctx.lineWidth = 2;
    ctx.strokeRect(halfW - 4, chamberY - 10, 10, 20);

    // Draggable Sub-label
    ctx.font = '700 8.5px -apple-system, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.textAlign = 'center';
    ctx.fillText('⋮⋮ DRAGGABLE ⋮⋮', 0, halfH - 12);

    ctx.restore();
  }

  /**
   * Draw End Box: High-Tech CRT Computer Terminal (AI Chef Receptor)
   */
  drawEndBox(ctx) {
    const box = this.game.endBox;
    if (!box) return;

    ctx.save();
    ctx.translate(box.x, box.y);

    const halfW = box.w / 2;
    const halfH = box.h / 2;
    const isDragging = this.game.dragBox === box;

    // Drop shadow (elevates when dragging)
    ctx.shadowColor = isDragging ? 'rgba(0, 229, 255, 0.45)' : 'rgba(0, 0, 0, 0.8)';
    ctx.shadowBlur = isDragging ? 35 : 24;
    ctx.shadowOffsetY = isDragging ? 18 : 12;

    // Monitor Cabinet Body (Beige/Graphite Industrial Enclosure)
    const cabinetGrad = ctx.createLinearGradient(-halfW, -halfH, halfW, halfH);
    cabinetGrad.addColorStop(0, '#424f5c');
    cabinetGrad.addColorStop(0.5, '#28323c');
    cabinetGrad.addColorStop(1, '#151b22');

    ctx.fillStyle = cabinetGrad;
    this.roundRect(ctx, -halfW, -halfH, box.w, box.h, 22);
    ctx.fill();

    ctx.shadowColor = 'transparent';
    ctx.lineWidth = isDragging ? 4 : 3;
    ctx.strokeStyle = isDragging ? '#00e5ff' : '#6b7d91';
    ctx.stroke();

    // Side Ventilation Slits on right
    ctx.fillStyle = '#0f141a';
    for (let s = -halfH + 26; s < halfH - 26; s += 12) {
      ctx.fillRect(halfW - 14, s, 7, 5);
    }

    // CRT Screen Bezel
    const screenW = box.w - 34;
    const screenH = box.h - 52;
    const screenX = -halfW + 12;
    const screenY = -halfH + 12;

    ctx.fillStyle = '#0a0d12';
    this.roundRect(ctx, screenX, screenY, screenW, screenH, 12);
    ctx.fill();
    ctx.strokeStyle = '#324152';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Inner CRT Phosphor Display
    const status = this.game.computerStatus; // 'idle' | 'accepted' | 'rejected' | 'evaluating'
    let phosphorColor = '#00e676';
    let screenGlowBg = 'rgba(0, 50, 25, 0.6)';

    if (status === 'accepted') {
      phosphorColor = '#00ff88';
      screenGlowBg = `rgba(0, 180, 80, ${0.4 + Math.sin(this.time * 8) * 0.2})`;
    } else if (status === 'rejected') {
      phosphorColor = '#ff3d00';
      screenGlowBg = `rgba(180, 20, 10, ${0.45 + Math.sin(this.time * 12) * 0.25})`;
    } else if (status === 'evaluating') {
      phosphorColor = '#ffea00';
      screenGlowBg = 'rgba(100, 90, 10, 0.4)';
    }

    ctx.fillStyle = screenGlowBg;
    this.roundRect(ctx, screenX + 4, screenY + 4, screenW - 8, screenH - 8, 8);
    ctx.fill();

    // CRT Scanlines
    ctx.save();
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.lineWidth = 1.5;
    for (let y = screenY + 5; y < screenY + screenH - 5; y += 4) {
      ctx.beginPath();
      ctx.moveTo(screenX + 5, y);
      ctx.lineTo(screenX + screenW - 5, y);
      ctx.stroke();
    }
    ctx.restore();

    // Screen Content
    ctx.textAlign = 'center';

    // Terminal Header
    ctx.font = '800 10px monospace';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.fillText('CHEF COMPUTER AI', screenX + screenW / 2, screenY + 14);

    // Target Value Readout
    ctx.font = '900 10px -apple-system, sans-serif';
    ctx.fillStyle = '#a7ffeb';
    ctx.fillText('RECIPE TARGET', screenX + screenW / 2, screenY + 28);

    // Big Glowing Target Number
    ctx.font = '900 36px -apple-system, sans-serif';
    ctx.fillStyle = phosphorColor;
    ctx.shadowColor = phosphorColor;
    ctx.shadowBlur = 12;
    ctx.fillText(this.game.targetValue, screenX + screenW / 2, screenY + 66);
    ctx.shadowBlur = 0;

    // Terminal Status Line
    ctx.font = '800 9.5px monospace';
    let statusText = 'READY / SCANNING...';
    if (status === 'accepted') statusText = '✔ DISH ACCEPTED!';
    if (status === 'rejected') statusText = '✖ DISH REJECTED!';
    if (status === 'evaluating') statusText = 'ANALYZING VALUE...';

    ctx.fillStyle = phosphorColor;
    ctx.fillText(statusText, screenX + screenW / 2, screenY + 96);

    // Bottom Computer Control Plate (Dial knob & LEDs)
    const plateY = halfH - 26;
    ctx.fillStyle = '#1c242d';
    this.roundRect(ctx, -halfW + 16, plateY, box.w - 32, 18, 6);
    ctx.fill();

    // Dial Knob
    ctx.beginPath();
    ctx.arc(-halfW + 30, plateY + 9, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#516275';
    ctx.fill();
    ctx.strokeStyle = '#8da2b8';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Draggable Sub-label
    ctx.font = '700 8.5px -apple-system, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.textAlign = 'center';
    ctx.fillText('⋮⋮ DRAGGABLE ⋮⋮', 0, plateY + 12);

    // Intake Port Funnel on Left Side
    ctx.fillStyle = '#1e2630';
    ctx.fillRect(-halfW - 10, -16, 14, 32);
    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(-halfW - 10, -16, 14, 32);

    ctx.restore();
  }

  /**
   * Draw Draggable Modifier Boxes (+1, +2, etc.)
   */
  drawModifierBoxes(ctx) {
    for (const box of this.game.modifierBoxes) {
      ctx.save();
      ctx.translate(box.x, box.y);

      const halfW = box.w / 2;
      const halfH = box.h / 2;
      const isDragging = this.game.dragBox === box;
      const isCooking = box.isCooking;

      // Drop shadow (elevates when dragging)
      ctx.shadowColor = isDragging ? 'rgba(0, 229, 255, 0.4)' : 'rgba(0, 0, 0, 0.7)';
      ctx.shadowBlur = isDragging ? 35 : 22;
      ctx.shadowOffsetY = isDragging ? 18 : 10;

      // Theme Colors
      let borderColor = '#ff9800';
      let accentGlow = 'rgba(255, 152, 0, 0.3)';
      if (box.theme === 'cyan') {
        borderColor = '#00e5ff';
        accentGlow = 'rgba(0, 229, 255, 0.3)';
      } else if (box.theme === 'purple') {
        borderColor = '#d500f9';
        accentGlow = 'rgba(213, 0, 249, 0.3)';
      } else if (box.theme === 'quantum' || box.op === 'conditional') {
        borderColor = '#ffd700';
        accentGlow = 'rgba(255, 215, 0, 0.4)';
      } else if (box.theme === 'cooker' || box.op === 'number_cooker') {
        borderColor = '#ff6d00';
        accentGlow = 'rgba(255, 109, 0, 0.55)';
      } else if (box.theme === 'chrono' || box.op === 'time_travel') {
        borderColor = '#b388ff';
        accentGlow = 'rgba(179, 136, 255, 0.5)';
      }

      if (isCooking) {
        borderColor = '#ffffff';
        if (box.theme === 'cooker' || box.op === 'number_cooker') {
          accentGlow = 'rgba(255, 109, 0, 0.95)';
        } else if (box.theme === 'chrono' || box.op === 'time_travel') {
          accentGlow = 'rgba(0, 229, 255, 0.9)';
        } else {
          accentGlow = 'rgba(255, 235, 59, 0.8)';
        }
      }

      // Outer Chassis Gradient (Brushed Steel Pod)
      const chassisGrad = ctx.createLinearGradient(-halfW, -halfH, halfW, halfH);
      if (box.op === 'conditional') {
        chassisGrad.addColorStop(0, '#382f18');
        chassisGrad.addColorStop(0.5, '#1e1c14');
        chassisGrad.addColorStop(1, '#0d0c08');
      } else if (box.theme === 'cooker' || box.op === 'number_cooker') {
        chassisGrad.addColorStop(0, '#4a1e05');
        chassisGrad.addColorStop(0.5, '#240d02');
        chassisGrad.addColorStop(1, '#120500');
      } else if (box.theme === 'chrono' || box.op === 'time_travel') {
        chassisGrad.addColorStop(0, '#2e124d');
        chassisGrad.addColorStop(0.5, '#160829');
        chassisGrad.addColorStop(1, '#090212');
      } else {
        chassisGrad.addColorStop(0, '#3a4754');
        chassisGrad.addColorStop(0.5, '#222b34');
        chassisGrad.addColorStop(1, '#11171d');
      }

      ctx.fillStyle = chassisGrad;
      this.roundRect(ctx, -halfW, -halfH, box.w, box.h, 24);
      ctx.fill();

      // Glowing Rim
      ctx.shadowColor = 'transparent';
      ctx.lineWidth = isDragging ? 4.5 : 3;
      ctx.strokeStyle = borderColor;
      ctx.stroke();

      // Inner Glowing Chamber
      ctx.fillStyle = isCooking ? 'rgba(255, 215, 0, 0.25)' : 'rgba(12, 18, 26, 0.85)';
      this.roundRect(ctx, -halfW + 12, -halfH + 12, box.w - 24, box.h - 24, 16);
      ctx.fill();
      ctx.strokeStyle = accentGlow;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Corner Drag Grip Ridges (indicates draggability)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.lineWidth = 2;
      // Top left grip
      ctx.beginPath();
      ctx.moveTo(-halfW + 18, -halfH + 24);
      ctx.lineTo(-halfW + 28, -halfH + 14);
      ctx.moveTo(-halfW + 24, -halfH + 28);
      ctx.lineTo(-halfW + 34, -halfH + 18);
      // Bottom right grip
      ctx.moveTo(halfW - 28, halfH - 14);
      ctx.lineTo(halfW - 18, halfH - 24);
      ctx.moveTo(halfW - 34, halfH - 18);
      ctx.lineTo(halfW - 24, halfH - 28);
      ctx.stroke();

      if (box.op === 'conditional') {
        // --- DUAL-OUTPUT CONDITIONAL BOX LAYOUT ---
        // Header Tag
        ctx.font = '900 11px -apple-system, sans-serif';
        ctx.fillStyle = '#ffd700';
        ctx.textAlign = 'center';
        ctx.fillText('⚡ LOGIC GATE', 0, -halfH + 24);

        // Branching circuit fork lines in background
        ctx.lineWidth = 2.5;
        // Upper YES track (Green)
        ctx.beginPath();
        ctx.moveTo(-10, 0);
        ctx.quadraticCurveTo(15, -36, halfW - 12, -36);
        ctx.strokeStyle = box.activeBranch === 'yes' ? '#00e676' : 'rgba(0, 230, 118, 0.4)';
        ctx.stroke();

        // Lower NO track (Red)
        ctx.beginPath();
        ctx.moveTo(-10, 0);
        ctx.quadraticCurveTo(15, 36, halfW - 12, 36);
        ctx.strokeStyle = box.activeBranch === 'no' ? '#ff3d00' : 'rgba(255, 61, 0, 0.4)';
        ctx.stroke();

        // Condition Badge (e.g. IF > 7)
        ctx.font = '900 30px -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#ffd700';
        ctx.shadowBlur = isCooking ? 20 : 8;
        ctx.textBaseline = 'middle';
        ctx.fillText(box.badge, -20, 0);
        ctx.shadowBlur = 0;

        // Branch Labels on Right edge
        // YES Arrow Badge (Top-right)
        ctx.font = '900 11px -apple-system, sans-serif';
        ctx.fillStyle = '#00e676';
        ctx.textAlign = 'right';
        ctx.fillText('YES ➔', halfW - 16, -36);

        // NO Arrow Badge (Bottom-right)
        ctx.fillStyle = '#ff3d00';
        ctx.fillText('NO ➔', halfW - 16, 36);

        // Sub-label (DRAG TO MOVE)
        ctx.font = '700 8.5px -apple-system, sans-serif';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.textAlign = 'center';
        ctx.fillText('⋮⋮ DRAGGABLE ⋮⋮', 0, halfH - 10);

        // Scanning laser animation when cooking
        if (isCooking) {
          const scanY = -halfH + 16 + ((this.time * 240) % (box.h - 32));
          ctx.beginPath();
          ctx.moveTo(-halfW + 12, scanY);
          ctx.lineTo(halfW - 12, scanY);
          ctx.strokeStyle = 'rgba(255, 215, 0, 0.9)';
          ctx.lineWidth = 2.5;
          ctx.stroke();
        }
      } else if (box.theme === 'cooker' || box.op === 'number_cooker') {
        // --- NUMBER COOKER / CHEF PRESSURE COOKER LAYOUT ---
        if (box.dualInput || box.inputs === 2) {
          // Dual input convergent tracks on the left
          ctx.strokeStyle = 'rgba(255, 109, 0, 0.55)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(-halfW + 12, -30);
          ctx.quadraticCurveTo(-15, -30, 0, 0);
          ctx.moveTo(-halfW + 12, 30);
          ctx.quadraticCurveTo(-15, 30, 0, 0);
          ctx.stroke();
        }

        // Header Tag
        ctx.font = '900 11px -apple-system, sans-serif';
        ctx.fillStyle = '#ff9800';
        ctx.textAlign = 'center';
        ctx.fillText('🔥 NUMBER COOKER', 0, -halfH + 22);

        // Animated Rotating Molten Cooking Core / Heat Vortex
        ctx.save();
        ctx.translate((box.dualInput || box.inputs === 2) ? 12 : 0, 4);
        ctx.rotate(this.time * 2.5);
        for (let a = 0; a < 4; a++) {
          ctx.rotate(Math.PI / 2);
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.quadraticCurveTo(24, 18, 48, 0);
          ctx.strokeStyle = `rgba(255, 109, 0, ${0.25 + Math.sin(this.time * 8 + a) * 0.15})`;
          ctx.lineWidth = 3;
          ctx.stroke();
        }
        ctx.restore();

        // Concentric Pulsing Heat Dial Rings
        const dialPulse = Math.sin(this.time * 5) * 3;
        ctx.beginPath();
        ctx.arc((box.dualInput || box.inputs === 2) ? 12 : 0, 4, 38 + dialPulse, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255, 193, 7, 0.5)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([6, 6]);
        ctx.stroke();
        ctx.setLineDash([]);

        // Glowing Badge Display ("🔥 COOKER")
        ctx.font = '900 24px -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#ff6d00';
        ctx.shadowBlur = isCooking ? 25 : 12;
        ctx.textBaseline = 'middle';
        ctx.fillText(box.badge || '🔥 COOKER', (box.dualInput || box.inputs === 2) ? 12 : 0, -4);
        ctx.shadowBlur = 0;

        // Dynamic Cooking Progression Sub-indicator
        let cookText = 'READY / RAW (0%)';
        let cookColor = '#ffd54f';
        if (box.warpVisits === 1) {
          cookText = 'SIMMERING: 33%';
          cookColor = '#ffb300';
        } else if (box.warpVisits === 2) {
          cookText = 'BOILING: 66%';
          cookColor = '#ff6d00';
        } else if (box.warpVisits >= 3) {
          cookText = `FULLY COOKED: ${box.val || 100}!`;
          cookColor = '#00e676';
        }

        ctx.font = '800 10px monospace';
        ctx.fillStyle = cookColor;
        ctx.fillText(cookText, (box.dualInput || box.inputs === 2) ? 12 : 0, 20);

        // Sub-label (DUAL IN / NUMBER COOKER)
        ctx.font = '700 8.5px -apple-system, sans-serif';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        const cookerLabel = (box.dualInput || box.inputs === 2) ? '⋮⋮ DUAL IN NUMBER COOKER ⋮⋮' : '⋮⋮ NUMBER COOKER ⋮⋮';
        ctx.fillText(cookerLabel, 0, halfH - 12);
      } else if (box.theme === 'chrono' || box.op === 'time_travel') {
        // --- CHRONO PORTAL / TIME MACHINE POD LAYOUT ---
        if (box.dualInput || box.inputs === 2) {
          // Dual input convergent tracks on the left
          ctx.strokeStyle = 'rgba(179, 136, 255, 0.45)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(-halfW + 12, -30);
          ctx.quadraticCurveTo(-15, -30, 0, 0);
          ctx.moveTo(-halfW + 12, 30);
          ctx.quadraticCurveTo(-15, 30, 0, 0);
          ctx.stroke();
        }

        // Header Tag
        ctx.font = '900 11px -apple-system, sans-serif';
        ctx.fillStyle = '#b388ff';
        ctx.textAlign = 'center';
        ctx.fillText('⏳ TIME MACHINE', 0, -halfH + 22);

        // Animated Rotating Chrono Vortex in the background of the chamber
        ctx.save();
        ctx.translate((box.dualInput || box.inputs === 2) ? 12 : 0, 4);
        ctx.rotate(this.time * 2.2);
        for (let a = 0; a < 4; a++) {
          ctx.rotate(Math.PI / 2);
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.quadraticCurveTo(24, 18, 48, 0);
          ctx.strokeStyle = `rgba(0, 229, 255, ${0.2 + Math.sin(this.time * 6 + a) * 0.12})`;
          ctx.lineWidth = 2.5;
          ctx.stroke();
        }
        ctx.restore();

        // Concentric Pulsing Chrono Dial Rings
        const dialPulse = Math.sin(this.time * 4) * 3;
        ctx.beginPath();
        ctx.arc((box.dualInput || box.inputs === 2) ? 12 : 0, 4, 38 + dialPulse, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(179, 136, 255, 0.45)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([6, 6]);
        ctx.stroke();
        ctx.setLineDash([]);

        // Glowing Badge Display ("⏳ TIME WARP")
        ctx.font = '900 22px -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#b388ff';
        ctx.shadowBlur = isCooking ? 25 : 12;
        ctx.textBaseline = 'middle';
        ctx.fillText(box.badge, (box.dualInput || box.inputs === 2) ? 12 : 0, -4);
        ctx.shadowBlur = 0;

        // Dynamic Temporal Calibration Status Sub-indicator
        let syncText = 'READY / 0% SYNC';
        let syncColor = '#ffd54f';
        if (box.warpVisits === 1) {
          syncText = 'CALIBRATING: 33%';
          syncColor = '#ffb300';
        } else if (box.warpVisits === 2) {
          syncText = 'CALIBRATING: 66%';
          syncColor = '#ff9800';
        } else if (box.warpVisits >= 3) {
          syncText = 'LOCKED: 100% SYNC';
          syncColor = '#00e5ff';
        }

        ctx.font = '800 10px monospace';
        ctx.fillStyle = syncColor;
        ctx.fillText(syncText, (box.dualInput || box.inputs === 2) ? 12 : 0, 20);

        // Sub-label (DUAL IN / CHRONO POD)
        ctx.font = '700 8.5px -apple-system, sans-serif';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        const chronoLabel = (box.dualInput || box.inputs === 2) ? '⋮⋮ DUAL IN CHRONO POD ⋮⋮' : '⋮⋮ CHRONO POD ⋮⋮';
        ctx.fillText(chronoLabel, 0, halfH - 12);
      } else {
        // --- STANDARD OR DUAL-INPUT MODIFIER BOX LAYOUT ---
        if (box.inputs === 3) {
          // Triple input convergent tracks on the left
          ctx.strokeStyle = 'rgba(0, 229, 255, 0.45)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(-halfW + 12, -38);
          ctx.quadraticCurveTo(-15, -20, 0, 0);
          ctx.moveTo(-halfW + 12, 0);
          ctx.lineTo(0, 0);
          ctx.moveTo(-halfW + 12, 38);
          ctx.quadraticCurveTo(-15, 20, 0, 0);
          ctx.stroke();
        } else if (box.dualInput || box.inputs === 2) {
          // Dual input convergent tracks on the left
          ctx.strokeStyle = 'rgba(0, 229, 255, 0.45)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(-halfW + 12, -30);
          ctx.quadraticCurveTo(-15, -30, 0, 0);
          ctx.moveTo(-halfW + 12, 30);
          ctx.quadraticCurveTo(-15, 30, 0, 0);
          ctx.stroke();
        }

        // Badge Name (e.g. MULTIPLIER POD)
        ctx.font = '800 10px -apple-system, sans-serif';
        ctx.fillStyle = '#8fa3b8';
        ctx.textAlign = 'center';
        ctx.fillText(box.name || 'COOKING POD', 0, -halfH + 22);

        // Huge Bold Operation Display: e.g. "+1", "×2"
        ctx.font = '900 40px -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = borderColor;
        ctx.shadowBlur = isCooking ? 22 : 10;
        ctx.textBaseline = 'middle';
        ctx.fillText(box.badge, (box.inputs === 3 || box.dualInput || box.inputs === 2) ? 14 : 0, 4);
        ctx.shadowBlur = 0;

        // Sub-label (DRAG TO MOVE / DUAL INPUT / TRIPLE INPUT)
        ctx.font = '700 8.5px -apple-system, sans-serif';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
        const labelText = box.inputs === 3 ? '⋮⋮ TRIPLE INPUT ⋮⋮' : ((box.dualInput || box.inputs === 2) ? '⋮⋮ DUAL INPUT ⋮⋮' : '⋮⋮ DRAGGABLE ⋮⋮');
        ctx.fillText(labelText, 0, halfH - 12);
      }

      // Cooking sizzle halo effect
      if (isCooking) {
        ctx.beginPath();
        ctx.arc(0, 0, halfW + 15, 0, Math.PI * 2);
        let haloStroke = `rgba(255, 215, 0, ${0.4 + Math.sin(this.time * 20) * 0.3})`;
        if (box.theme === 'cooker' || box.op === 'number_cooker') {
          haloStroke = `rgba(255, 109, 0, ${0.7 + Math.sin(this.time * 22) * 0.3})`;
        } else if (box.theme === 'chrono' || box.op === 'time_travel') {
          haloStroke = `rgba(0, 229, 255, ${0.6 + Math.sin(this.time * 18) * 0.3})`;
        }
        ctx.strokeStyle = haloStroke;
        ctx.lineWidth = 4.5;
        ctx.stroke();
      }

      ctx.restore();
    }
  }

  /**
   * Draw Cable Sockets & Interactive Connection Ports
   */
  drawPorts(ctx) {
    const ports = this.game.wireManager.getAllPorts();
    const draft = this.game.wireManager.activeDraft;

    for (const port of ports) {
      ctx.save();
      ctx.translate(port.x, port.y);

      const isInput = port.type === 'input';
      const isSnapped = draft && draft.snappedTo === port;

      // Glow Halo
      const haloR = isSnapped ? port.radius + 12 : port.radius + 4;
      const haloColor = isInput ? 'rgba(0, 229, 255, 0.4)' : 'rgba(255, 152, 0, 0.4)';

      ctx.beginPath();
      ctx.arc(0, 0, haloR, 0, Math.PI * 2);
      ctx.fillStyle = isSnapped ? 'rgba(0, 230, 118, 0.6)' : haloColor;
      ctx.fill();

      // Outer Metallic Ring
      ctx.beginPath();
      ctx.arc(0, 0, port.radius, 0, Math.PI * 2);
      ctx.fillStyle = '#1a232f';
      ctx.fill();
      ctx.lineWidth = 3.5;
      ctx.strokeStyle = port.color || (isInput ? '#00e5ff' : '#ff9800');
      ctx.stroke();

      // Center Socket Pin/Hole
      ctx.beginPath();
      ctx.arc(0, 0, 9, 0, Math.PI * 2);
      ctx.fillStyle = isInput ? '#090e14' : (port.color || '#ffd54f');
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();

      // Port Label Tag (IN / OUT / YES / NO)
      ctx.font = '900 11px -apple-system, sans-serif';
      ctx.fillStyle = port.color || '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const textOffset = isInput ? -32 : 32;
      ctx.fillText(port.label, textOffset, 0);

      ctx.restore();
    }
  }

  /**
   * Draw Connected Wires with Bezier Curves and Animated Energy Flow
   */
  drawCables(ctx) {
    const wm = this.game.wireManager;

    // 1. Draw established connections
    for (const conn of wm.connections) {
      const p1 = wm.getPort(conn.fromBoxId, 'output', conn.fromPortId);
      const p2 = wm.getPort(conn.toBoxId, 'input', conn.toPortId);
      if (!p1 || !p2) continue;

      let mainColor = '#ff8c00';
      let coreColor = '#00e5ff';
      if (conn.fromPortId === 'yes') {
        mainColor = '#00e676';
        coreColor = '#b9f6ca';
      } else if (conn.fromPortId === 'no') {
        mainColor = '#ff3d00';
        coreColor = '#ff8a80';
      }

      const cp = wm.calculateCurvePoints(p1, p2);
      this.renderSingleCable(ctx, cp, mainColor, coreColor, true);
    }

    // 2. Draw live active wire being dragged by player
    if (wm.activeDraft) {
      const d = wm.activeDraft;
      const p0 = { x: d.fromX, y: d.fromY };
      const p3 = { x: d.curX, y: d.curY };
      const cp = wm.calculateCurvePoints(p0, p3);
      const mainColor = d.color || '#ffd54f';
      this.renderSingleCable(ctx, cp, mainColor, '#ffffff', false, true);
    }
  }

  /**
   * Render single dynamic 3D-styled cable with glow and moving arrows
   */
  renderSingleCable(ctx, cp, mainColor, coreColor, showFlow = true, isDraft = false) {
    ctx.save();

    // Outer Thick Conduit Drop Shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
    ctx.shadowBlur = 12;
    ctx.shadowOffsetY = 6;

    // Outer Conduit (Heavy Industrial Rubber / Braided Wire)
    ctx.beginPath();
    ctx.moveTo(cp.p0.x, cp.p0.y);
    ctx.bezierCurveTo(cp.p1.x, cp.p1.y, cp.p2.x, cp.p2.y, cp.p3.x, cp.p3.y);
    ctx.lineWidth = isDraft ? 12 : 16;
    ctx.strokeStyle = '#182029';
    ctx.lineCap = 'round';
    ctx.stroke();

    // Reset shadow
    ctx.shadowColor = 'transparent';

    // Outer Neon Glow
    ctx.beginPath();
    ctx.moveTo(cp.p0.x, cp.p0.y);
    ctx.bezierCurveTo(cp.p1.x, cp.p1.y, cp.p2.x, cp.p2.y, cp.p3.x, cp.p3.y);
    ctx.lineWidth = isDraft ? 6 : 9;
    ctx.strokeStyle = mainColor;
    ctx.stroke();

    // Inner Radiant Core
    ctx.beginPath();
    ctx.moveTo(cp.p0.x, cp.p0.y);
    ctx.bezierCurveTo(cp.p1.x, cp.p1.y, cp.p2.x, cp.p2.y, cp.p3.x, cp.p3.y);
    ctx.lineWidth = isDraft ? 2 : 3;
    ctx.strokeStyle = coreColor;
    if (isDraft) {
      ctx.setLineDash([12, 10]);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // Animated Energy Flow Pulse (Directional arrows flowing down the wire)
    if (showFlow) {
      const pulseSpeed = 1.2;
      const numPulses = 5;
      for (let i = 0; i < numPulses; i++) {
        const offset = (this.time * pulseSpeed + i / numPulses) % 1.0;
        const pt = this.game.wireManager.sampleBezier(cp.p0, cp.p1, cp.p2, cp.p3, offset);

        ctx.save();
        ctx.translate(pt.x, pt.y);
        ctx.rotate(pt.angle);

        // Glowing Chevron / Flow Indicator
        ctx.beginPath();
        ctx.moveTo(-10, -6);
        ctx.lineTo(2, 0);
        ctx.lineTo(-10, 6);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();

        ctx.restore();
      }
    }

    ctx.restore();
  }

  /**
   * Draw the Glossy 3D Numbered Ingredient Ball
   */
  drawBall(ctx) {
    const ball = this.game.ball;
    if (!ball || !ball.visible) return;

    ctx.save();
    ctx.translate(ball.x, ball.y);
    ctx.rotate(ball.rotation);

    const r = ball.radius;

    // Drop Shadow on Floor
    ctx.shadowColor = 'rgba(0, 0, 0, 0.75)';
    ctx.shadowBlur = 24;
    ctx.shadowOffsetY = 12;

    // Radiant Culinary Aura around Ball if Fully Cooked
    if (ball.isTimeWarped) {
      ctx.beginPath();
      ctx.arc(0, 0, r + 12 + Math.sin(this.time * 10) * 4, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255, 215, 0, ${0.75 + Math.sin(this.time * 8) * 0.25})`;
      ctx.lineWidth = 3.5;
      ctx.shadowColor = '#ffd700';
      ctx.shadowBlur = 18;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(0, 0, r + 20 + Math.cos(this.time * 7) * 5, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255, 109, 0, ${0.5 + Math.cos(this.time * 6) * 0.2})`;
      ctx.lineWidth = 2;
      ctx.shadowColor = '#ff6d00';
      ctx.shadowBlur = 14;
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // Ball Base Radial Gradient (Hyper-Glossy Metallic/Glass Sphere)
    const orbGrad = ctx.createRadialGradient(-r * 0.35, -r * 0.35, r * 0.1, 0, 0, r);
    if (ball.isTimeWarped) {
      // Golden Delicious Master Cooked Sphere
      orbGrad.addColorStop(0, '#ffffff');
      orbGrad.addColorStop(0.25, '#ffe082');
      orbGrad.addColorStop(0.65, '#ff9800');
      orbGrad.addColorStop(1, '#bf360c');
    } else {
      orbGrad.addColorStop(0, '#fff3b0');
      orbGrad.addColorStop(0.2, '#ffb300');
      orbGrad.addColorStop(0.65, '#ff6f00');
      orbGrad.addColorStop(1, '#b71c1c');
    }

    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fillStyle = orbGrad;
    ctx.fill();

    // Reset shadow
    ctx.shadowColor = 'transparent';

    // Specular 3D Glass Reflection Highlight
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(-r * 0.35, -r * 0.35, r * 0.45, r * 0.25, -Math.PI / 4, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.fill();
    ctx.restore();

    // Ball Edge Rim
    ctx.lineWidth = 3;
    ctx.strokeStyle = ball.isTimeWarped ? 'rgba(255, 215, 64, 0.95)' : 'rgba(255, 215, 64, 0.7)';
    ctx.stroke();

    // Un-rotate text so the player can always clearly read the number!
    ctx.rotate(-ball.rotation);

    // Number Printed in Center (scaled dynamically for 3 digits like 100)
    const fontSize = ball.value >= 100 ? 24 : 30;
    ctx.font = `900 ${fontSize}px -apple-system, BlinkMacSystemFont, sans-serif`;
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Text Drop Shadow
    ctx.shadowColor = ball.isTimeWarped ? '#ff6d00' : 'rgba(0, 0, 0, 0.85)';
    ctx.shadowBlur = ball.isTimeWarped ? 14 : 8;
    ctx.shadowOffsetY = 2;
    ctx.fillText(ball.value.toString(), 0, 2);

    ctx.restore();
  }

  /**
   * Draw Particles (Steam puffs, sparks, confetti, chronal vortex rings)
   */
  drawParticles(ctx) {
    for (const p of this.game.particles) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);

      if (p.type === 'steam') {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        const grad = ctx.createRadialGradient(p.x, p.y, 2, p.x, p.y, p.radius);
        grad.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
        grad.addColorStop(0.6, 'rgba(255, 200, 100, 0.4)');
        grad.addColorStop(1, 'rgba(255, 120, 0, 0)');
        ctx.fillStyle = grad;
        ctx.fill();
      } else if (p.type === 'spark') {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color || '#ffd54f';
        ctx.shadowColor = p.color || '#ff9800';
        ctx.shadowBlur = 10;
        ctx.fill();
      } else if (p.type === 'chrono_ring') {
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(1, p.radius), 0, Math.PI * 2);
        ctx.strokeStyle = p.color || '#00e5ff';
        ctx.lineWidth = Math.max(1.5, 6 * p.alpha);
        ctx.shadowColor = p.color || '#00e5ff';
        ctx.shadowBlur = 24;
        ctx.stroke();
      } else if (p.type === 'chrono_spark') {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color || '#b388ff';
        ctx.shadowColor = p.color || '#00e5ff';
        ctx.shadowBlur = 16;
        ctx.fill();
      } else if (p.type === 'confetti') {
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      }

      ctx.restore();
    }
  }

  /**
   * Draw Floating Floating Value Text Popups ("+1", "ACCEPTED!")
   */
  drawFloatingTexts(ctx) {
    for (const ft of this.game.floatingTexts) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, ft.alpha);
      ctx.font = `900 ${ft.size || 40}px -apple-system, BlinkMacSystemFont, sans-serif`;
      ctx.fillStyle = ft.color || '#ffeb3b';
      ctx.textAlign = 'center';
      ctx.shadowColor = ft.color || '#ff9800';
      ctx.shadowBlur = 15;
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    }
  }

  /**
   * Draw Level 1 First-Time Animated Hand Tutorial Guidance
   */
  drawTutorialGuidance(ctx) {
    if (!this.game.tutorialActive || this.game.currentLevelIndex !== 0) return;

    const step = this.game.getTutorialStep();
    if (!step) return;

    ctx.save();

    // If player is actively drafting a wire, fade tutorial to prevent clutter
    const isDrafting = !!this.game.wireManager.activeDraft;
    ctx.globalAlpha = isDrafting ? 0.25 : 1.0;

    if (!step.isCookStep) {
      const pFrom = this.game.wireManager.getPort(step.fromBoxId, 'output', step.fromPortId);
      const pTo = this.game.wireManager.getPort(step.toBoxId, 'input', step.toPortId);
      if (!pFrom || !pTo) {
        ctx.restore();
        return;
      }

      // 1. Source Port Pulsing Wave (Gold/Orange)
      const wave1 = (this.time * 1.8) % 1.0;
      ctx.beginPath();
      ctx.arc(pFrom.x, pFrom.y, pFrom.radius + wave1 * 32, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255, 152, 0, ${(1 - wave1) * 0.8})`;
      ctx.lineWidth = 3;
      ctx.stroke();

      // 2. Target Port Concentric Magnet Ring (Cyan)
      const pulse2 = Math.sin(this.time * 6) * 4 + 8;
      ctx.beginPath();
      ctx.arc(pTo.x, pTo.y, pTo.radius + pulse2, 0, Math.PI * 2);
      ctx.strokeStyle = '#00e5ff';
      ctx.lineWidth = 3;
      ctx.stroke();

      // 3. Guided Bezier Path (Animated Glowing Dashes)
      const cp = this.game.wireManager.calculateCurvePoints(pFrom, pTo);
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(cp.p0.x, cp.p0.y);
      ctx.bezierCurveTo(cp.p1.x, cp.p1.y, cp.p2.x, cp.p2.y, cp.p3.x, cp.p3.y);
      ctx.strokeStyle = 'rgba(0, 229, 255, 0.45)';
      ctx.lineWidth = 4;
      ctx.setLineDash([14, 12]);
      ctx.lineDashOffset = -this.time * 45;
      ctx.stroke();
      ctx.restore();

      // 4. Smooth Hand Movement Loop (~1.6s cycle)
      const cycle = (this.time * 0.62) % 1.0;
      let t = 0;
      let isPressing = false;
      let handScale = 1.0;

      if (cycle < 0.15) {
        // Resting on source port with press effect
        t = 0;
        isPressing = true;
        handScale = 0.9 + Math.sin(cycle / 0.15 * Math.PI) * 0.08;
      } else if (cycle <= 0.82) {
        // Smoothly gliding along cable curve
        const progress = (cycle - 0.15) / (0.82 - 0.15);
        t = 0.5 - 0.5 * Math.cos(progress * Math.PI);
        handScale = 1.0;
      } else {
        // Resting on destination socket with tap connection
        t = 1;
        isPressing = true;
        handScale = 0.92;
      }

      const handPos = this.game.wireManager.sampleBezier(cp.p0, cp.p1, cp.p2, cp.p3, t);

      // Draw vector hand pointer at handPos
      this.drawHandPointer(ctx, handPos.x, handPos.y, -Math.PI / 4, handScale, isPressing);

      // 5. Sleek Tutorial Speech Bubble / Tooltip
      const bannerX = Math.max(260, Math.min(820, (pFrom.x + pTo.x) / 2));
      const bannerY = Math.max(240, Math.min(pFrom.y, pTo.y) - 68);

      this.drawTutorialBanner(
        ctx,
        bannerX,
        bannerY,
        `TUTORIAL • STEP ${step.stepNum} OF 3`,
        step.instruction
      );
    } else {
      // Step 4: All connected! Point at START COOKING button
      const btnX = 540;
      const btnY = 1750;
      const bounce = Math.sin(this.time * 8) * 16;
      const handY = btnY - 70 + bounce;

      // Pulse ring on Cook Button
      ctx.beginPath();
      ctx.arc(btnX, btnY, 48 + Math.sin(this.time * 6) * 8, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 152, 0, 0.7)';
      ctx.lineWidth = 4;
      ctx.stroke();

      // Hand pointing downwards
      this.drawHandPointer(ctx, btnX, handY, Math.PI / 2, 1.15, true);

      // Banner above button
      this.drawTutorialBanner(
        ctx,
        btnX,
        btnY - 180,
        'READY TO COOK!',
        step.instruction,
        '#ff9800'
      );
    }

    ctx.restore();
  }

  /**
   * Draw high-fidelity vector hand pointer glove with touch glow
   */
  drawHandPointer(ctx, x, y, angle = -Math.PI / 4, scale = 1.0, isPressing = false) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.scale(scale, scale);

    // Fingertip Touch Halo Glow
    const glowR = isPressing ? 28 : 18;
    const glowGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, glowR);
    glowGrad.addColorStop(0, 'rgba(0, 229, 255, 0.95)');
    glowGrad.addColorStop(0.5, 'rgba(0, 229, 255, 0.45)');
    glowGrad.addColorStop(1, 'rgba(0, 229, 255, 0)');
    ctx.fillStyle = glowGrad;
    ctx.beginPath();
    ctx.arc(0, 0, glowR, 0, Math.PI * 2);
    ctx.fill();

    // Drop shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.75)';
    ctx.shadowBlur = 20;
    ctx.shadowOffsetY = 12;

    // 1. Pointing Index Finger
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    this.roundRect(ctx, -9, 0, 18, 50, 9);
    ctx.fill();

    ctx.shadowColor = 'transparent';
    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Joint crease
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-6, 22);
    ctx.lineTo(6, 22);
    ctx.stroke();

    // 2. Glove Palm / Hand Base
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    this.roundRect(ctx, -24, 38, 48, 46, 14);
    ctx.fill();
    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = 3;
    ctx.stroke();

    // 3. Folded Other Fingers (Middle, Ring, Pinky)
    ctx.fillStyle = '#e2e8f0';
    for (let f = 0; f < 3; f++) {
      ctx.beginPath();
      this.roundRect(ctx, -21 + f * 11, 42, 10, 26, 5);
      ctx.fill();
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // 4. Thumb Folded
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    this.roundRect(ctx, 13, 46, 16, 22, 7);
    ctx.fill();
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // 5. Glove Cuff (Neon Cyan Tech Band)
    ctx.fillStyle = '#00e5ff';
    this.roundRect(ctx, -26, 80, 52, 12, 5);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.restore();
  }

  /**
   * Draw floating translucent speech bubble / instruction card
   */
  drawTutorialBanner(ctx, x, y, badgeText, mainText, accentColor = '#00e5ff') {
    ctx.save();
    ctx.font = '900 11px -apple-system, sans-serif';
    const textWidth = Math.max(ctx.measureText(mainText).width + 50, 280);
    const boxW = Math.min(textWidth, 540);
    const boxH = 58;
    const halfW = boxW / 2;

    ctx.translate(x, y);

    // Drop shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
    ctx.shadowBlur = 24;
    ctx.shadowOffsetY = 10;

    // Translucent Dark Glass Container
    ctx.fillStyle = 'rgba(8, 16, 26, 0.94)';
    this.roundRect(ctx, -halfW, -boxH / 2, boxW, boxH, 16);
    ctx.fill();

    ctx.shadowColor = 'transparent';
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = accentColor;
    ctx.stroke();

    // Little triangle pointer downwards
    ctx.fillStyle = 'rgba(8, 16, 26, 0.94)';
    ctx.beginPath();
    ctx.moveTo(-10, boxH / 2);
    ctx.lineTo(10, boxH / 2);
    ctx.lineTo(0, boxH / 2 + 10);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-10, boxH / 2);
    ctx.lineTo(0, boxH / 2 + 10);
    ctx.lineTo(10, boxH / 2);
    ctx.stroke();

    // Badge Title
    ctx.font = '900 11px -apple-system, sans-serif';
    ctx.fillStyle = accentColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(badgeText, 0, -boxH / 2 + 10);

    // Main Instruction
    ctx.font = '800 14px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textBaseline = 'bottom';
    ctx.fillText(mainText, 0, boxH / 2 - 10);

    ctx.restore();
  }

  /**
   * Utility to draw rounded rectangle paths
   */
  roundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }
}
if (typeof window !== 'undefined') {
  window.Renderer = Renderer;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Renderer;
}
