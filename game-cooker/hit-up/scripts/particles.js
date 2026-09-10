// scripts/particles.js - Visual Effects, Debris Particles, Dialogue Popups, Floating Scores
export class ParticleManager {
  constructor() {
    this.particles = [];
    this.dialogues = [];
    this.floatingTexts = [];
  }

  reset() {
    this.particles = [];
    this.dialogues = [];
    this.floatingTexts = [];
  }

  // Spawn wood crate pieces flying outward
  spawnBoxBreak(x, y, count = 8) {
    const pieceKeys = ['box_piece_1', 'box_piece_2', 'box_piece_3', 'box_piece_4'];
    for (let i = 0; i < count; i++) {
      const angle = (Math.random() * Math.PI) + Math.PI; // upward burst
      const speed = 250 + Math.random() * 450;
      const key = pieceKeys[Math.floor(Math.random() * pieceKeys.length)];

      this.particles.push({
        type: 'box_piece',
        imageKey: key,
        x: x + (Math.random() * 40 - 20),
        y: y + (Math.random() * 40 - 20),
        vx: Math.cos(angle) * speed + (Math.random() * 200 - 100),
        vy: Math.sin(angle) * speed - 200,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() * 10 - 5),
        scale: 2.5 + Math.random() * 1.5,
        life: 0.8 + Math.random() * 0.4,
        maxLife: 1.2,
        gravity: 1200
      });
    }

    // Add dust burst
    this.spawnDust(x, y, 6);
  }

  // Spawn stone/dust puffs
  spawnDust(x, y, count = 6, color = 'rgba(210, 200, 190,') {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 50 + Math.random() * 120;
      this.particles.push({
        type: 'dust',
        x: x + (Math.random() * 20 - 10),
        y: y + (Math.random() * 20 - 10),
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 30,
        radius: 8 + Math.random() * 12,
        growth: 15,
        life: 0.4 + Math.random() * 0.3,
        maxLife: 0.7,
        color: color,
        gravity: -50
      });
    }
  }

  // Sparks when hammer hits wall or enemy
  spawnSparks(x, y, count = 8) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 150 + Math.random() * 250;
      this.particles.push({
        type: 'spark',
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        length: 8 + Math.random() * 8,
        life: 0.25 + Math.random() * 0.2,
        maxLife: 0.45,
        color: Math.random() > 0.5 ? '#f6d32d' : '#ff7800',
        gravity: 800
      });
    }
  }

  // Dialogue popup bubble above characters
  spawnDialogue(imageKey, targetEntity, duration = 1.2) {
    this.dialogues.push({
      imageKey: imageKey,
      target: targetEntity,
      offsetX: 0,
      offsetY: -70,
      life: duration,
      maxLife: duration,
      scale: 2.5
    });
  }

  // Floating text like "+100", "SMASH!", "REPAIRED!"
  spawnText(text, x, y, color = '#ffd700', fontSize = 32) {
    this.floatingTexts.push({
      text: text,
      x: x,
      y: y,
      vy: -90,
      color: color,
      fontSize: fontSize,
      life: 0.9,
      maxLife: 0.9
    });
  }

  update(dt) {
    // Update debris & dust
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      p.x += p.vx * dt;
      p.y += p.vy * dt;

      if (p.gravity) {
        p.vy += p.gravity * dt;
      }
      if (p.rotSpeed) {
        p.rotation += p.rotSpeed * dt;
      }
      if (p.growth) {
        p.radius += p.growth * dt;
      }
    }

    // Update dialogues
    for (let i = this.dialogues.length - 1; i >= 0; i--) {
      const d = this.dialogues[i];
      d.life -= dt;
      if (d.life <= 0 || (d.target && d.target.dead && d.imageKey !== 'dialogue_dead_in')) {
        this.dialogues.splice(i, 1);
      }
    }

    // Update floating texts
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const t = this.floatingTexts[i];
      t.life -= dt;
      if (t.life <= 0) {
        this.floatingTexts.splice(i, 1);
        continue;
      }
      t.y += t.vy * dt;
    }
  }

  draw(ctx, assets, camera) {
    // Draw particles
    for (const p of this.particles) {
      const screenX = p.x - camera.x;
      const screenY = p.y - camera.y;

      const alpha = Math.max(0, p.life / p.maxLife);

      if (p.type === 'box_piece') {
        const img = assets.getImage(p.imageKey);
        if (img) {
          ctx.save();
          ctx.globalAlpha = alpha;
          ctx.translate(screenX, screenY);
          ctx.rotate(p.rotation);
          const w = img.width * p.scale;
          const h = img.height * p.scale;
          ctx.drawImage(img, -w / 2, -h / 2, w, h);
          ctx.restore();
        }
      } else if (p.type === 'dust') {
        ctx.save();
        ctx.globalAlpha = alpha * 0.7;
        ctx.fillStyle = p.color + alpha + ')';
        ctx.beginPath();
        ctx.arc(screenX, screenY, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else if (p.type === 'spark') {
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(screenX, screenY);
        ctx.lineTo(screenX - p.vx * 0.03, screenY - p.vy * 0.03);
        ctx.stroke();
        ctx.restore();
      }
    }

    // Draw dialogues
    for (const d of this.dialogues) {
      const img = assets.getImage(d.imageKey);
      if (!img) continue;

      let posX = d.target ? d.target.x + d.target.width / 2 + d.offsetX : d.offsetX;
      let posY = d.target ? d.target.y + d.offsetY : d.offsetY;

      const screenX = posX - camera.x;
      const screenY = posY - camera.y;

      const alpha = Math.min(1, d.life / (d.maxLife * 0.2));
      const w = img.width * d.scale;
      const h = img.height * d.scale;

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.drawImage(img, screenX - w / 2, screenY - h / 2, w, h);
      ctx.restore();
    }

    // Draw floating texts
    for (const t of this.floatingTexts) {
      const screenX = t.x - camera.x;
      const screenY = t.y - camera.y;
      const alpha = Math.max(0, t.life / t.maxLife);

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.font = `900 ${t.fontSize}px "Segoe UI", Arial, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillStyle = '#000';
      ctx.fillText(t.text, screenX + 2, screenY + 2);
      ctx.fillStyle = t.color;
      ctx.fillText(t.text, screenX, screenY);
      ctx.restore();
    }
  }
}

