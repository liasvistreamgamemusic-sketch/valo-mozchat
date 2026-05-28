import { createBitmap, type Bitmap } from './bitmap';

export type ImageProcessOptions = {
  targetWidth: number;
  /** If omitted, height is derived from aspect ratio. */
  targetHeight?: number;
  /** Invert (treat dark = on). */
  invert?: boolean;
  /** 'threshold' = hard binary, 'fs' = Floyd–Steinberg dithering, 'levels' = 4-level quantization. */
  mode?: 'threshold' | 'fs' | 'levels';
  /** Threshold 0–255 used by 'threshold' and 'fs' (for the binary decision). */
  threshold?: number;
};

/**
 * Convert an HTMLImageElement into a Bitmap suitable for the block encoder.
 * Steps: draw at target size on a canvas, take luminance, optionally dither,
 * then return a Bitmap with intensity 0–4.
 */
export function imageToBitmap(img: HTMLImageElement, opts: ImageProcessOptions): Bitmap {
  const tW = Math.max(1, opts.targetWidth);
  const aspect = img.naturalHeight / img.naturalWidth;
  const tH = Math.max(1, opts.targetHeight ?? Math.round(tW * aspect));
  const invert = opts.invert ?? false;
  const mode = opts.mode ?? 'fs';
  const threshold = opts.threshold ?? 128;

  const canvas = document.createElement('canvas');
  canvas.width = tW;
  canvas.height = tH;
  const ctx = canvas.getContext('2d');
  if (!ctx) return createBitmap(tW, tH);
  ctx.imageSmoothingEnabled = true;
  // Fill with white so transparent regions become "blank" by default
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, tW, tH);
  ctx.drawImage(img, 0, 0, tW, tH);
  const id = ctx.getImageData(0, 0, tW, tH);

  // Luminance buffer (0..255), already considering "darker = more on"
  const lum = new Float32Array(tW * tH);
  for (let i = 0, p = 0; p < id.data.length; p += 4, i++) {
    const r = id.data[p];
    const g = id.data[p + 1];
    const b = id.data[p + 2];
    const a = id.data[p + 3] / 255;
    // Premultiply against white background
    const rr = r * a + 255 * (1 - a);
    const gg = g * a + 255 * (1 - a);
    const bb = b * a + 255 * (1 - a);
    // Standard luma
    const y = 0.299 * rr + 0.587 * gg + 0.114 * bb;
    lum[i] = invert ? y : 255 - y; // higher = more "on"
  }

  const out = createBitmap(tW, tH);

  if (mode === 'threshold') {
    for (let i = 0; i < lum.length; i++) {
      out.data[i] = lum[i] >= 255 - threshold ? 4 : 0;
    }
    return out;
  }

  if (mode === 'levels') {
    for (let i = 0; i < lum.length; i++) {
      out.data[i] = quantize5(lum[i]);
    }
    return out;
  }

  // Floyd–Steinberg dithering, binary output
  const target = 255 - threshold;
  for (let y = 0; y < tH; y++) {
    for (let x = 0; x < tW; x++) {
      const i = y * tW + x;
      const old = lum[i];
      const v = old >= target ? 255 : 0;
      out.data[i] = v > 0 ? 4 : 0;
      const err = old - v;
      if (x + 1 < tW) lum[i + 1] += (err * 7) / 16;
      if (y + 1 < tH) {
        if (x > 0) lum[i + tW - 1] += (err * 3) / 16;
        lum[i + tW] += (err * 5) / 16;
        if (x + 1 < tW) lum[i + tW + 1] += (err * 1) / 16;
      }
    }
  }
  return out;
}

function quantize5(v: number): number {
  if (v < 32) return 0;
  if (v < 96) return 1;
  if (v < 160) return 2;
  if (v < 224) return 3;
  return 4;
}

/** Load an HTMLImageElement from a File (returns a promise). */
export function loadImageFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(e);
    };
    img.src = url;
  });
}
