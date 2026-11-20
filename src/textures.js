import * as THREE from 'three';

function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

/**
 * Weathered coastal cedar boardwalk planks (diffuse + bump)
 */
export function createWoodTextures() {
  const w = 512;
  const h = 512;
  const diffCanvas = makeCanvas(w, h);
  const bumpCanvas = makeCanvas(w, h);
  const ctx = diffCanvas.getContext('2d');
  const bCtx = bumpCanvas.getContext('2d');

  // Base warm cedar hue
  ctx.fillStyle = '#9c6e46';
  ctx.fillRect(0, 0, w, h);
  bCtx.fillStyle = '#808080';
  bCtx.fillRect(0, 0, w, h);

  const plankCount = 8;
  const plankH = h / plankCount;

  for (let i = 0; i < plankCount; i++) {
    const y = i * plankH;
    const toneShift = (Math.sin(i * 2.3 + 1.1) * 14) | 0;
    const r = Math.min(255, Math.max(0, 166 + toneShift));
    const g = Math.min(255, Math.max(0, 118 + (toneShift * 0.75) | 0));
    const b = Math.min(255, Math.max(0, 74 + (toneShift * 0.5) | 0));
    ctx.fillStyle = `rgb(${r},${g},${b})`;
    ctx.fillRect(0, y + 2, w, plankH - 4);

    // Subtle sunlit bleach & grain lines
    for (let s = 0; s < 36; s++) {
      const gy = y + 3 + Math.random() * (plankH - 6);
      const alpha = 0.06 + Math.random() * 0.1;
      ctx.strokeStyle = Math.random() > 0.45
        ? `rgba(68, 40, 20, ${alpha})`
        : `rgba(235, 198, 152, ${alpha * 0.85})`;
      ctx.lineWidth = 0.7 + Math.random() * 1.6;
      ctx.beginPath();
      ctx.moveTo(0, gy);
      for (let x = 32; x <= w; x += 32) {
        ctx.lineTo(x, gy + Math.sin(x * 0.02 + s) * 1.4);
      }
      ctx.stroke();

      bCtx.strokeStyle = `rgba(210,210,210,${alpha * 0.8})`;
      bCtx.lineWidth = 1;
      bCtx.beginPath();
      bCtx.moveTo(0, gy);
      bCtx.lineTo(w, gy);
      bCtx.stroke();
    }

    // Plank dark seam
    ctx.fillStyle = '#3b2413';
    ctx.fillRect(0, y, w, 3);
    bCtx.fillStyle = '#181818';
    bCtx.fillRect(0, y, w, 4);

    // Nail heads near ends
    const nailX = [28, w - 28, w * 0.5];
    ctx.fillStyle = '#473326';
    for (const nx of nailX) {
      ctx.beginPath();
      ctx.arc(nx, y + plankH * 0.3, 2.2, 0, Math.PI * 2);
      ctx.arc(nx, y + plankH * 0.7, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const map = new THREE.CanvasTexture(diffCanvas);
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = 8;

  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.wrapT = THREE.RepeatWrapping;
  bumpMap.anisotropy = 4;

  return { map, bumpMap };
}

/**
 * Woven wicker texture for the bicycle front basket
 */
export function createWickerTexture() {
  const w = 256;
  const h = 256;
  const c = makeCanvas(w, h);
  const b = makeCanvas(w, h);
  const ctx = c.getContext('2d');
  const bCtx = b.getContext('2d');

  ctx.fillStyle = '#8b5c2c';
  ctx.fillRect(0, 0, w, h);
  bCtx.fillStyle = '#404040';
  bCtx.fillRect(0, 0, w, h);

  const cell = 16;
  for (let row = 0; row < h / cell; row++) {
    for (let col = 0; col < w / cell; col++) {
      const x = col * cell;
      const y = row * cell;
      const horizontal = (row + col) % 2 === 0;
      const grad = horizontal
        ? ctx.createLinearGradient(x, y, x + cell, y)
        : ctx.createLinearGradient(x, y, x, y + cell);
      grad.addColorStop(0, '#9c6832');
      grad.addColorStop(0.5, '#d7a25c');
      grad.addColorStop(1, '#8c5a27');
      ctx.fillStyle = grad;
      ctx.fillRect(x + 1, y + 1, cell - 2, cell - 2);

      bCtx.fillStyle = horizontal ? '#d8d8d8' : '#b2b2b2';
      bCtx.fillRect(x + 1, y + 1, cell - 2, cell - 2);
    }
  }

  const map = new THREE.CanvasTexture(c);
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(3, 2);
  map.colorSpace = THREE.SRGBColorSpace;

  const bumpMap = new THREE.CanvasTexture(b);
  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.wrapT = THREE.RepeatWrapping;
  bumpMap.repeat.set(3, 2);

  return { map, bumpMap };
}

/**
 * Soft layered plumage texture for the pelican's body & wings
 */
export function createFeatherTexture() {
  const w = 256;
  const h = 256;
  const c = makeCanvas(w, h);
  const b = makeCanvas(w, h);
  const ctx = c.getContext('2d');
  const bCtx = b.getContext('2d');

  ctx.fillStyle = '#fbf7ef';
  ctx.fillRect(0, 0, w, h);
  bCtx.fillStyle = '#808080';
  bCtx.fillRect(0, 0, w, h);

  const rows = 14;
  const cols = 10;
  const rw = w / cols;
  const rh = h / rows;

  for (let r = 0; r < rows + 1; r++) {
    for (let col = 0; col < cols + 1; col++) {
      const cx = col * rw + (r % 2 === 0 ? 0 : rw * 0.5);
      const cy = r * rh;

      ctx.fillStyle = r % 2 === 0 ? 'rgba(255, 250, 240, 0.72)' : 'rgba(241, 233, 219, 0.65)';
      ctx.strokeStyle = 'rgba(186, 174, 158, 0.34)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.ellipse(cx, cy, rw * 0.58, rh * 0.78, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      bCtx.fillStyle = 'rgba(215, 215, 215, 0.5)';
      bCtx.strokeStyle = 'rgba(70, 70, 70, 0.5)';
      bCtx.beginPath();
      bCtx.ellipse(cx, cy, rw * 0.55, rh * 0.75, 0, 0, Math.PI * 2);
      bCtx.fill();
      bCtx.stroke();
    }
  }

  const map = new THREE.CanvasTexture(c);
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(2, 2);
  map.colorSpace = THREE.SRGBColorSpace;

  const bumpMap = new THREE.CanvasTexture(b);
  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.wrapT = THREE.RepeatWrapping;
  bumpMap.repeat.set(2, 2);

  return { map, bumpMap };
}

/**
 * Red & white coastal lighthouse stripe texture
 */
export function createLighthouseTexture() {
  const c = makeCanvas(256, 512);
  const ctx = c.getContext('2d');
  const stripes = 6;
  const sh = 512 / stripes;
  for (let i = 0; i < stripes; i++) {
    ctx.fillStyle = i % 2 === 0 ? '#d9483b' : '#f8f2e6';
    ctx.fillRect(0, i * sh, 256, sh);
  }
  // Subtle stucco grain
  for (let i = 0; i < 1600; i++) {
    ctx.fillStyle = `rgba(0,0,0,${Math.random() * 0.045})`;
    ctx.fillRect(Math.random() * 256, Math.random() * 512, 2, 2);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * Soft glowing particle sprite
 */
export function createGlowSpriteTexture() {
  const c = makeCanvas(128, 128);
  const ctx = c.getContext('2d');
  const grad = ctx.createRadialGradient(64, 64, 2, 64, 64, 64);
  grad.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
  grad.addColorStop(0.28, 'rgba(255, 240, 200, 0.8)');
  grad.addColorStop(0.6, 'rgba(255, 200, 130, 0.25)');
  grad.addColorStop(1, 'rgba(255, 180, 100, 0.0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
