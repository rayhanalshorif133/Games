/**
 * Military Aviation Glass Cockpit HUD (Heads-Up Display) & Avionics System
 * Collimated green phosphor optics, pitch ladder, airspeed/altitude tapes,
 * target lock reticles, and 360-degree Radar Warning Receiver (RWR).
 */
class MilitaryHUD {
  constructor(runtime) {
    this.runtime = runtime;
    this.hudColor = '#00ff66';
    this.hudGlow = 'rgba(0, 255, 102, 0.45)';
    this.warningColor = '#ff3344';
    this.lockColor = '#ffaa00';

    // RWR Radar sweep angle
    this.rwrSweep = 0;
  }

  draw(ctx, fighter, enemySystem, score, kills, waveBanner = null) {
    const W = this.runtime.V_WIDTH;
    const H = this.runtime.V_HEIGHT;
    const enemies = enemySystem ? enemySystem.enemies : [];
    const enemyMissiles = enemySystem ? enemySystem.enemyMissiles : [];

    ctx.save();
    ctx.font = '16px "Share Tech Mono", monospace';
    ctx.fillStyle = this.hudColor;
    ctx.strokeStyle = this.hudColor;
    ctx.shadowColor = this.hudGlow;
    ctx.shadowBlur = 6;
    ctx.lineWidth = 1.5;

    // 1. Heading Compass Tape (Top Center)
    this._drawHeadingTape(ctx, W, fighter);

    // 2. Airspeed Indicator Tape (Left)
    this._drawAirspeedTape(ctx, H, fighter);

    // 3. Altitude Indicator Tape (Right)
    this._drawAltitudeTape(ctx, W, H, fighter);

    // 4. Pitch Ladder & Artificial Horizon Line (Center)
    this._drawPitchLadder(ctx, W, H, fighter);

    // 5. Flight Path Marker (Velocity Vector)
    this._drawFlightPathMarker(ctx, fighter);

    // 6. Target Lock-On Reticle (Fox-2 Tracking)
    this._drawTargetReticle(ctx, fighter);

    // 7. Radar Warning Receiver (RWR) Scope (Bottom Left)
    this._drawRWR(ctx, fighter, enemies, enemyMissiles);

    // 8. Weapon Stores & System Status (Bottom Right)
    this._drawWeaponsStore(ctx, W, H, fighter);

    // 9. Mission Telemetry (Top Left & Top Right)
    this._drawTelemetry(ctx, W, score, kills, fighter);

    // 10. Active Power-Up Systems Status
    this._drawPowerupStatus(ctx, W, H, fighter);

    // 11. Tactical Wave Announcement Banner
    if (waveBanner && waveBanner.timer > 0) {
      this._drawWaveBanner(ctx, W, H, waveBanner);
    }

    // 12. Master Caution & Threat Alerts
    this._drawThreatWarnings(ctx, W, H, fighter, enemyMissiles);

    ctx.restore();
  }

  _drawHeadingTape(ctx, W, fighter) {
    const centerX = W / 2;
    const tapeY = 60;
    const tapeWidth = 320;

    ctx.save();
    // Center indicator chevron
    ctx.beginPath();
    ctx.moveTo(centerX, tapeY + 18);
    ctx.lineTo(centerX - 8, tapeY + 28);
    ctx.lineTo(centerX + 8, tapeY + 28);
    ctx.closePath();
    ctx.fillStyle = this.hudColor;
    ctx.fill();

    // Tape box
    ctx.strokeRect(centerX - tapeWidth / 2, tapeY - 20, tapeWidth, 36);

    // Dynamic heading ticks based on jet horizontal drift
    const baseHeading = (180 + Math.floor(fighter.vx * 0.08)) % 360;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${baseHeading.toString().padStart(3, '0')}°`, centerX, tapeY - 32);

    for (let deg = -40; deg <= 40; deg += 10) {
      const h = (baseHeading + deg + 360) % 360;
      const x = centerX + deg * 3.5;
      if (x > centerX - tapeWidth / 2 + 10 && x < centerX + tapeWidth / 2 - 10) {
        ctx.beginPath();
        ctx.moveTo(x, tapeY - 8);
        ctx.lineTo(x, tapeY + 8);
        ctx.stroke();

        let label = (h / 10).toString();
        if (h === 0) label = 'N';
        else if (h === 90) label = 'E';
        else if (h === 180) label = 'S';
        else if (h === 270) label = 'W';

        ctx.font = '12px "Share Tech Mono"';
        ctx.fillText(label, x, tapeY + 16);
      }
    }
    ctx.restore();
  }

  _drawAirspeedTape(ctx, H, fighter) {
    const x = 70;
    const y = H * 0.45;
    const kts = Math.round(fighter.speed);
    const mach = (fighter.speed / 661).toFixed(2);

    ctx.save();
    // Tape window
    ctx.strokeRect(x - 45, y - 140, 75, 280);

    // Current airspeed readout box
    ctx.fillStyle = 'rgba(0, 20, 10, 0.8)';
    ctx.fillRect(x - 55, y - 22, 95, 44);
    ctx.strokeStyle = this.hudColor;
    ctx.lineWidth = 2;
    ctx.strokeRect(x - 55, y - 22, 95, 44);

    ctx.fillStyle = this.hudColor;
    ctx.font = '22px "Orbitron", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(kts, x - 8, y);

    ctx.font = '12px "Share Tech Mono"';
    ctx.fillText('KTS', x + 25, y + 12);
    ctx.fillText(`M ${mach}`, x - 8, y + 165);

    // Ladder ticks
    ctx.lineWidth = 1.5;
    for (let offset = -100; offset <= 100; offset += 20) {
      const tickKts = Math.round((kts + offset) / 20) * 20;
      const tickY = y - (tickKts - kts) * 1.8;
      if (tickY > y - 130 && tickY < y + 130) {
        ctx.beginPath();
        ctx.moveTo(x + 30, tickY);
        ctx.lineTo(x + 15, tickY);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  _drawAltitudeTape(ctx, W, H, fighter) {
    const x = W - 70;
    const y = H * 0.45;
    const alt = Math.round(18400 + (H * 0.78 - fighter.y) * 8);

    ctx.save();
    // Tape window
    ctx.strokeRect(x - 30, y - 140, 75, 280);

    // Current altitude readout box
    ctx.fillStyle = 'rgba(0, 20, 10, 0.8)';
    ctx.fillRect(x - 40, y - 22, 95, 44);
    ctx.strokeStyle = this.hudColor;
    ctx.lineWidth = 2;
    ctx.strokeRect(x - 40, y - 22, 95, 44);

    ctx.fillStyle = this.hudColor;
    ctx.font = '20px "Orbitron", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(alt, x + 8, y);

    ctx.font = '12px "Share Tech Mono"';
    ctx.fillText('FT', x - 25, y + 12);
    ctx.fillText('R-ALT', x + 8, y + 165);

    // Ladder ticks
    ctx.lineWidth = 1.5;
    for (let offset = -100; offset <= 100; offset += 25) {
      const tickAlt = Math.round((alt + offset) / 50) * 50;
      const tickY = y - (tickAlt - alt) * 0.6;
      if (tickY > y - 130 && tickY < y + 130) {
        ctx.beginPath();
        ctx.moveTo(x - 30, tickY);
        ctx.lineTo(x - 15, tickY);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  _drawPitchLadder(ctx, W, H, fighter) {
    const centerX = W / 2;
    const centerY = H * 0.45;
    const rollAngle = fighter.roll * 0.35; // tilts with banking

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(rollAngle);

    // Artificial Horizon Line
    ctx.strokeStyle = this.hudColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-180, 0);
    ctx.lineTo(-50, 0);
    ctx.moveTo(50, 0);
    ctx.lineTo(180, 0);
    ctx.stroke();

    // Pitch ladder rungs (+10, +20, -10, -20 degrees)
    const pitchOffset = (fighter.vy * 0.15) % 60;

    [-60, 60].forEach((rungY, idx) => {
      const y = rungY + pitchOffset;
      const isPositive = idx === 0;

      ctx.beginPath();
      if (isPositive) {
        // Solid rungs for climb
        ctx.moveTo(-80, y);
        ctx.lineTo(-30, y);
        ctx.lineTo(-30, y + 8);

        ctx.moveTo(80, y);
        ctx.lineTo(30, y);
        ctx.lineTo(30, y + 8);
      } else {
        // Dashed rungs for dive
        ctx.setLineDash([8, 6]);
        ctx.moveTo(-80, y);
        ctx.lineTo(-30, y);
        ctx.lineTo(-30, y - 8);

        ctx.moveTo(80, y);
        ctx.lineTo(30, y);
        ctx.lineTo(30, y - 8);
        ctx.setLineDash([]);
      }
      ctx.stroke();

      ctx.font = '11px "Share Tech Mono"';
      ctx.fillText(isPositive ? '+10' : '-10', -95, y + 4);
      ctx.fillText(isPositive ? '+10' : '-10', 88, y + 4);
    });

    ctx.restore();
  }

  _drawFlightPathMarker(ctx, fighter) {
    // Aircraft velocity vector circle with wings
    const fpmX = fighter.x + fighter.vx * 0.12;
    const fpmY = fighter.y - 120 + fighter.vy * 0.1;

    ctx.save();
    ctx.strokeStyle = this.hudColor;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(fpmX, fpmY, 8, 0, Math.PI * 2);
    // Left wing
    ctx.moveTo(fpmX - 8, fpmY);
    ctx.lineTo(fpmX - 18, fpmY);
    // Right wing
    ctx.moveTo(fpmX + 8, fpmY);
    ctx.lineTo(fpmX + 18, fpmY);
    // Top fin
    ctx.moveTo(fpmX, fpmY - 8);
    ctx.lineTo(fpmX, fpmY - 16);
    ctx.stroke();
    ctx.restore();
  }

  _drawTargetReticle(ctx, fighter) {
    if (!fighter.lockedTarget || !fighter.lockedTarget.isAlive) return;

    const t = fighter.lockedTarget;
    const isLocked = fighter.lockProgress >= 1.0;
    const color = isLocked ? this.warningColor : this.lockColor;
    const distNM = (Math.hypot(t.x - fighter.x, t.y - fighter.y) * 0.005).toFixed(1);

    ctx.save();
    ctx.translate(t.x, t.y);
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.lineWidth = 2.5;

    // Diamond target box
    const boxSize = 46;
    if (!isLocked) {
      ctx.setLineDash([8, 6]);
    }

    ctx.beginPath();
    ctx.moveTo(0, -boxSize);
    ctx.lineTo(boxSize, 0);
    ctx.lineTo(0, boxSize);
    ctx.lineTo(-boxSize, 0);
    ctx.closePath();
    ctx.stroke();
    ctx.setLineDash([]);

    // Range readout & Lock status
    ctx.font = '14px "Orbitron", monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`${distNM} NM`, boxSize + 10, -5);

    if (isLocked) {
      ctx.font = '16px "Orbitron", monospace';
      ctx.fillText('LOCK [FOX-2]', boxSize + 10, 15);
    } else {
      ctx.font = '12px "Share Tech Mono"';
      ctx.fillText('TRACKING...', boxSize + 10, 15);
    }

    ctx.restore();
  }

  _drawRWR(ctx, fighter, enemies, enemyMissiles) {
    // 360 Radar Warning Receiver (tactical round dial)
    const x = 110;
    const y = this.runtime.V_HEIGHT - 130;
    const r = 75;

    this.rwrSweep = (this.rwrSweep + 2.5) % 360;

    ctx.save();
    ctx.translate(x, y);

    // Background dial
    ctx.fillStyle = 'rgba(2, 12, 18, 0.85)';
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();

    // Green radar rings
    ctx.strokeStyle = 'rgba(0, 255, 102, 0.35)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.arc(0, 0, r * 0.65, 0, Math.PI * 2);
    ctx.arc(0, 0, r * 0.3, 0, Math.PI * 2);
    ctx.moveTo(-r, 0); ctx.lineTo(r, 0);
    ctx.moveTo(0, -r); ctx.lineTo(0, r);
    ctx.stroke();

    // Rotating Radar Sweep Line
    const sweepRad = (this.rwrSweep * Math.PI) / 180;
    ctx.strokeStyle = 'rgba(0, 255, 102, 0.6)';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(sweepRad) * r, Math.sin(sweepRad) * r);
    ctx.stroke();

    // Center player blip
    ctx.fillStyle = this.hudColor;
    ctx.beginPath();
    ctx.arc(0, 0, 3, 0, Math.PI * 2);
    ctx.fill();

    // Plot enemy threats on RWR
    for (const e of enemies) {
      if (!e.isAlive) continue;
      const dx = (e.x - fighter.x) * 0.08;
      const dy = (e.y - fighter.y) * 0.08;
      const dist = Math.hypot(dx, dy);

      if (dist < r - 5) {
        ctx.fillStyle = (e.type === 'bomber') ? '#fbbf24' : '#ef4444';
        ctx.beginPath();
        ctx.arc(dx, dy, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Plot incoming guided missiles as blinking markers
    if (enemyMissiles && enemyMissiles.length > 0) {
      for (const m of enemyMissiles) {
        const dx = (m.x - fighter.x) * 0.08;
        const dy = (m.y - fighter.y) * 0.08;
        const dist = Math.hypot(dx, dy);

        if (dist < r - 5) {
          ctx.fillStyle = (Math.floor(Date.now() / 120) % 2 === 0) ? '#ff3344' : '#ffffff';
          ctx.beginPath();
          ctx.arc(dx, dy, 5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // Label
    ctx.font = '11px "Orbitron"';
    ctx.textAlign = 'center';
    ctx.fillStyle = this.hudColor;
    ctx.fillText('RWR TACTICAL', 0, r + 18);

    ctx.restore();
  }

  _drawWeaponsStore(ctx, W, H, fighter) {
    const x = W - 230;
    const y = H - 170;

    ctx.save();
    ctx.fillStyle = 'rgba(2, 12, 18, 0.85)';
    ctx.fillRect(x, y, 210, 140);
    ctx.strokeStyle = this.hudColor;
    ctx.strokeRect(x, y, 210, 140);

    ctx.font = '12px "Orbitron"';
    ctx.fillStyle = this.hudColor;
    ctx.fillText('STORES MANAGEMENT', x + 15, y + 20);

    // 1. 20mm Cannon Ammo
    ctx.font = '12px "Share Tech Mono"';
    ctx.fillText(`M61A2 GUN: ${Math.floor(fighter.cannonAmmo)}`, x + 15, y + 42);
    const ammoRatio = Math.max(0, fighter.cannonAmmo / fighter.maxCannonAmmo);
    ctx.fillStyle = 'rgba(0, 255, 102, 0.2)';
    ctx.fillRect(x + 15, y + 48, 180, 8);
    ctx.fillStyle = this.hudColor;
    ctx.fillRect(x + 15, y + 48, 180 * ammoRatio, 8);

    // 2. Fox-2 Missiles Pylons
    ctx.fillStyle = this.hudColor;
    ctx.fillText('AIM-9X FOX-2:', x + 15, y + 74);
    for (let i = 0; i < fighter.maxMissiles; i++) {
      const mx = x + 110 + i * 14;
      ctx.strokeStyle = (i < fighter.missileCount) ? this.hudColor : 'rgba(0, 255, 102, 0.2)';
      ctx.strokeRect(mx, y + 64, 8, 14);
      if (i < fighter.missileCount) {
        ctx.fillStyle = this.hudColor;
        ctx.fillRect(mx + 2, y + 66, 4, 10);
      }
    }

    // 3. Magnesium Flares
    ctx.fillStyle = this.hudColor;
    ctx.fillText(`FLARES POD: ${Math.floor(fighter.flareCount)} / ${fighter.maxFlares}`, x + 15, y + 98);

    // 4. Airframe Integrity (Health)
    const hp = Math.max(0, Math.round(fighter.health));
    ctx.fillStyle = hp < 40 ? this.warningColor : this.hudColor;
    ctx.fillText(`HULL ARMOR: ${hp}%`, x + 15, y + 120);

    ctx.restore();
  }

  _drawTelemetry(ctx, W, score, kills, fighter) {
    ctx.save();
    // Top Left: Score & Kills
    ctx.font = '18px "Orbitron", monospace';
    ctx.fillStyle = this.hudColor;
    ctx.fillText(`SCORE: ${score.toLocaleString()}`, 30, 42);
    ctx.font = '14px "Share Tech Mono"';
    ctx.fillText(`HOSTILE KILLS: ${kills}`, 30, 68);

    // Top Right: G-Meter & Throttle
    ctx.textAlign = 'right';
    ctx.font = '18px "Orbitron", monospace';
    ctx.fillText(`${fighter.gForce.toFixed(1)} G`, W - 30, 42);
    ctx.font = '14px "Share Tech Mono"';
    ctx.fillText(fighter.isBoosting ? 'AFTERBURNER: MAX' : 'MIL-POWER: 85%', W - 30, 68);

    ctx.restore();
  }

  _drawThreatWarnings(ctx, W, H, fighter, enemyMissiles) {
    const hasIncomingMissile = enemyMissiles && enemyMissiles.length > 0;

    // Flashing Warning Banner
    if (fighter.health < 40 || hasIncomingMissile) {
      if (Math.floor(Date.now() / 250) % 2 === 0) {
        ctx.save();
        ctx.fillStyle = 'rgba(255, 51, 68, 0.2)';
        ctx.fillRect(W / 2 - 220, H * 0.28, 440, 48);
        ctx.strokeStyle = this.warningColor;
        ctx.lineWidth = 2;
        ctx.strokeRect(W / 2 - 220, H * 0.28, 440, 48);

        ctx.font = '22px "Orbitron", monospace';
        ctx.fillStyle = this.warningColor;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        if (hasIncomingMissile) {
          ctx.fillText('WARNING: MISSILE LAUNCH [DEPLOY FLARES]', W / 2, H * 0.28 + 24);
        } else {
          ctx.fillText('MASTER CAUTION: LOW INTEGRITY', W / 2, H * 0.28 + 24);
        }
        ctx.restore();
      }
    }
  }

  _drawPowerupStatus(ctx, W, H, fighter) {
    const startY = 115;
    let offsetY = 0;

    // 1. Plasma Shield Health Bar
    if (fighter.shieldActive && fighter.shieldHealth > 0) {
      const shieldRatio = Math.max(0, fighter.shieldHealth / fighter.shieldMaxHealth);
      ctx.save();
      ctx.fillStyle = 'rgba(2, 18, 28, 0.85)';
      ctx.fillRect(W / 2 - 130, startY + offsetY, 260, 26);
      ctx.strokeStyle = '#00e5ff';
      ctx.strokeRect(W / 2 - 130, startY + offsetY, 260, 26);

      ctx.fillStyle = 'rgba(0, 229, 255, 0.35)';
      ctx.fillRect(W / 2 - 128, startY + offsetY + 2, 256 * shieldRatio, 22);

      ctx.font = 'bold 12px "Orbitron", sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`PLASMA SHIELD: ${Math.round(fighter.shieldHealth)}%`, W / 2, startY + offsetY + 13);
      ctx.restore();
      offsetY += 32;
    }

    // 2. Quad Vulcan Overdrive Bar
    if (fighter.quadCannonTimer > 0) {
      const quadRatio = Math.max(0, fighter.quadCannonTimer / 18.0);
      ctx.save();
      ctx.fillStyle = 'rgba(28, 12, 2, 0.85)';
      ctx.fillRect(W / 2 - 130, startY + offsetY, 260, 26);
      ctx.strokeStyle = '#ff6600';
      ctx.strokeRect(W / 2 - 130, startY + offsetY, 260, 26);

      ctx.fillStyle = 'rgba(255, 102, 0, 0.4)';
      ctx.fillRect(W / 2 - 128, startY + offsetY + 2, 256 * quadRatio, 22);

      ctx.font = 'bold 12px "Orbitron", sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`4x VULCAN OVERDRIVE: ${fighter.quadCannonTimer.toFixed(1)}s`, W / 2, startY + offsetY + 13);
      ctx.restore();
      offsetY += 32;
    }

    // 3. Fox-2 Salvo Bar
    if (fighter.salvoModeTimer > 0) {
      const salvoRatio = Math.max(0, fighter.salvoModeTimer / 16.0);
      ctx.save();
      ctx.fillStyle = 'rgba(28, 24, 2, 0.85)';
      ctx.fillRect(W / 2 - 130, startY + offsetY, 260, 26);
      ctx.strokeStyle = '#facc15';
      ctx.strokeRect(W / 2 - 130, startY + offsetY, 260, 26);

      ctx.fillStyle = 'rgba(250, 204, 21, 0.4)';
      ctx.fillRect(W / 2 - 128, startY + offsetY + 2, 256 * salvoRatio, 22);

      ctx.font = 'bold 12px "Orbitron", sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`FOX-2 TRIPLE SALVO: ${fighter.salvoModeTimer.toFixed(1)}s`, W / 2, startY + offsetY + 13);
      ctx.restore();
    }
  }

  _drawWaveBanner(ctx, W, H, banner) {
    ctx.save();
    const progress = 1 - banner.timer / banner.maxTimer;
    let alpha = 1;
    if (progress < 0.2) alpha = progress / 0.2;
    else if (progress > 0.8) alpha = (1 - progress) / 0.2;

    const bannerY = H * 0.35;
    const bannerH = 76;

    ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
    ctx.fillStyle = 'rgba(3, 10, 22, 0.92)';
    ctx.fillRect(0, bannerY - bannerH / 2, W, bannerH);

    ctx.strokeStyle = '#00f0ff';
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 18;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, bannerY - bannerH / 2);
    ctx.lineTo(W, bannerY - bannerH / 2);
    ctx.moveTo(0, bannerY + bannerH / 2);
    ctx.lineTo(W, bannerY + bannerH / 2);
    ctx.stroke();

    ctx.font = '900 28px "Orbitron", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 15;
    ctx.fillText(banner.title, W / 2, bannerY - 10);

    ctx.font = '14px "Share Tech Mono", monospace';
    ctx.fillStyle = '#38bdf8';
    ctx.fillText(banner.subtitle, W / 2, bannerY + 20);

    ctx.restore();
  }
}

window.MilitaryHUD = MilitaryHUD;
