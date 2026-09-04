import { ANIMATION_DATA } from './frames_data.js';

class AssetManager {
  constructor() {
    this.images = new Map();
    this.animationData = ANIMATION_DATA;
    this.loaded = false;
    this.totalImages = 0;
    this.loadedImages = 0;
  }

  async loadAll(onProgress) {
    const fileSet = new Set();
    for (const obj of Object.values(this.animationData)) {
      for (const anim of Object.values(obj)) {
        for (const frame of anim.frames) {
          fileSet.add(frame.file);
        }
      }
    }

    this.totalImages = fileSet.size;
    this.loadedImages = 0;

    const promises = Array.from(fileSet).map(file => {
      return new Promise((resolve) => {
        const img = new Image();
        img.src = file;
        img.onload = () => {
          this.images.set(file, img);
          this.loadedImages++;
          if (onProgress) {
            onProgress(this.loadedImages / this.totalImages);
          }
          resolve(img);
        };
        img.onerror = () => {
          console.warn(`Failed to load asset: ${file}`);
          this.loadedImages++;
          if (onProgress) {
            onProgress(this.loadedImages / this.totalImages);
          }
          resolve(null);
        };
      });
    });

    await Promise.all(promises);
    this.loaded = true;
  }

  getAnim(objName, animName) {
    const obj = this.animationData[objName];
    if (!obj) return null;
    return obj[animName] || obj['Default'] || null;
  }

  getFrame(objName, animName, frameIndex) {
    const anim = this.getAnim(objName, animName);
    if (!anim || !anim.frames || anim.frames.length === 0) return null;
    const idx = Math.max(0, Math.min(frameIndex, anim.frames.length - 1));
    return anim.frames[idx];
  }

  drawFrame(ctx, objName, animName, frameIndex, x, y, width, height, alpha = 1, rotation = 0) {
    const frame = this.getFrame(objName, animName, frameIndex);
    if (!frame) return;
    const img = this.images.get(frame.file);
    if (!img) return;

    ctx.save();
    if (alpha < 1) ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
    ctx.translate(x, y);
    if (rotation !== 0) ctx.rotate(rotation);

    const drawW = width !== undefined ? width : frame.w;
    const drawH = height !== undefined ? height : frame.h;

    // Construct 3 origin offset
    const ox = frame.ox !== undefined ? frame.ox : 0.5;
    const oy = frame.oy !== undefined ? frame.oy : 0.5;

    const destX = -drawW * ox;
    const destY = -drawH * oy;

    ctx.drawImage(
      img,
      frame.u, frame.v, frame.w, frame.h,
      destX, destY, drawW, drawH
    );

    ctx.restore();
  }
}

export const assets = new AssetManager();

