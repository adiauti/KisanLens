import type { ImageHint } from '@/data/types';

/**
 * Client-side fallback image analyzer. Used only when the server AI route
 * is unavailable. Draws the image to a canvas, samples pixels, and returns
 * a coarse colour-hint summary. NOT a real diagnosis — it nudges ranking
 * but should never be the sole basis for treatment.
 */

const MAX_DIM = 256; // downsample before sampling — speed over precision

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h *= 60;
  }
  return { h, s, l };
}

function classifyPixel(r: number, g: number, b: number): 'green' | 'yellow' | 'brown' | 'white' | 'other' {
  const { h, s, l } = rgbToHsl(r, g, b);
  if (l > 0.85 && s < 0.2) return 'white';
  if (s < 0.12) return 'other';
  if (h >= 60 && h <= 170 && s > 0.2 && l < 0.7) return 'green';
  if (h >= 30 && h < 60 && s > 0.2) return 'yellow';
  if (h < 30 || h >= 330) return 'brown';
  return 'other';
}

function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to decode image'));
    img.src = dataUrl;
  });
}

/**
 * Convert a File to a downscaled data URL (jpeg). Smaller payloads = faster
 * transmission to /api/scan and lower memory use on low-end phones.
 */
export async function fileToDataUrl(file: File, maxDim = 1024, quality = 0.82): Promise<string> {
  const raw = await readFileAsDataUrl(file);
  const img = await loadImage(raw);
  const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
  const w = Math.max(1, Math.round(img.width * scale));
  const h = Math.max(1, Math.round(img.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D not available');
  ctx.drawImage(img, 0, 0, w, h);
  return canvas.toDataURL('image/jpeg', quality);
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Analyse a data-URL image and return an ImageHint. Cheap and offline.
 */
export async function analyzeImage(dataUrl: string): Promise<ImageHint> {
  const img = await loadImage(dataUrl);
  const scale = Math.min(1, MAX_DIM / Math.max(img.width, img.height));
  const w = Math.max(1, Math.round(img.width * scale));
  const h = Math.max(1, Math.round(img.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D not available');
  ctx.drawImage(img, 0, 0, w, h);
  const { data } = ctx.getImageData(0, 0, w, h);

  let total = 0;
  let green = 0;
  let yellow = 0;
  let brown = 0;
  let white = 0;
  let brightSum = 0;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];
    if (a < 128) continue;
    total++;
    brightSum += (r + g + b) / (3 * 255);
    const cls = classifyPixel(r, g, b);
    if (cls === 'green') green++;
    else if (cls === 'yellow') yellow++;
    else if (cls === 'brown') brown++;
    else if (cls === 'white') white++;
  }

  if (total === 0) {
    return { brown: 0, yellow: 0, white: 0, brightness: 0, hue: 'mixed' };
  }

  const frac = (n: number) => n / total;
  const brownFrac = frac(brown);
  const yellowFrac = frac(yellow);
  const whiteFrac = frac(white);
  const greenFrac = frac(green);

  let hue: ImageHint['hue'] = 'mixed';
  if (greenFrac > 0.5) hue = 'green';
  else if (yellowFrac > brownFrac && yellowFrac > whiteFrac) hue = 'yellow';
  else if (brownFrac > whiteFrac) hue = 'brown';

  return {
    brown: brownFrac,
    yellow: yellowFrac,
    white: whiteFrac,
    brightness: brightSum / total,
    hue,
  };
}
