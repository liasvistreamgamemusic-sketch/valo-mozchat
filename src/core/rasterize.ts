import { createBitmap, type Bitmap } from './bitmap';

/**
 * Rasterize arbitrary text (including emoji, CJK, custom fonts) into a bitmap.
 *
 * Approach:
 *   1. Draw the text onto an offscreen canvas at a generous source size
 *      using the user's OS rendering (so emoji = native color emoji).
 *   2. Compute the tight bounding box from alpha values.
 *   3. Down-sample to the requested target dimensions using box-filtering.
 *   4. Quantize alpha to 0–4 intensity per cell.
 *
 * `targetWidth` is the final cell width. Height is derived from the source
 * bbox aspect ratio (or supplied as `targetHeight`).
 */
export type RasterizeOptions = {
  text: string;
  targetWidth: number;
  targetHeight?: number;
  fontFamily?: string;
  /** Source canvas font size in CSS px (large = better fidelity). */
  sourcePx?: number;
  /** Alpha threshold (0–255) for considering a pixel "on" during bbox detection. */
  alphaThreshold?: number;
  /** Output levels: 2 (on/off → 0 or 4) or 5 (0–4 grayscale). */
  levels?: 2 | 5;
};

export function rasterizeText(opts: RasterizeOptions): Bitmap {
  const {
    text,
    targetWidth,
    targetHeight,
    fontFamily = 'system-ui, "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif',
    sourcePx = 128,
    alphaThreshold = 32,
    levels = 2,
  } = opts;

  if (!text || targetWidth <= 0) return createBitmap(0, 0);

  // Measure text with a temporary canvas
  const measureCanvas = document.createElement('canvas');
  const mctx = measureCanvas.getContext('2d');
  if (!mctx) return createBitmap(0, 0);
  mctx.font = `${sourcePx}px ${fontFamily}`;
  mctx.textBaseline = 'alphabetic';
  const metrics = mctx.measureText(text);
  const ascent = metrics.actualBoundingBoxAscent || sourcePx * 0.8;
  const descent = metrics.actualBoundingBoxDescent || sourcePx * 0.25;
  const textW = Math.max(1, Math.ceil(metrics.width));
  const textH = Math.max(1, Math.ceil(ascent + descent));

  // Render with padding so glyph edges are not clipped
  const padding = Math.ceil(sourcePx * 0.1);
  const srcW = textW + padding * 2;
  const srcH = textH + padding * 2;
  const src = document.createElement('canvas');
  src.width = srcW;
  src.height = srcH;
  const sctx = src.getContext('2d');
  if (!sctx) return createBitmap(0, 0);
  sctx.clearRect(0, 0, srcW, srcH);
  sctx.font = `${sourcePx}px ${fontFamily}`;
  sctx.textBaseline = 'alphabetic';
  sctx.fillStyle = '#000';
  sctx.fillText(text, padding, padding + ascent);

  const srcData = sctx.getImageData(0, 0, srcW, srcH);

  // Compute tight bbox over alpha
  let minX = srcW;
  let minY = srcH;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < srcH; y++) {
    for (let x = 0; x < srcW; x++) {
      const a = srcData.data[(y * srcW + x) * 4 + 3];
      if (a >= alphaThreshold) {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) return createBitmap(0, 0);

  const bboxW = maxX - minX + 1;
  const bboxH = maxY - minY + 1;

  const tW = targetWidth;
  const tH = targetHeight ?? Math.max(1, Math.round((bboxH / bboxW) * tW));

  // Box-filter downsample alpha -> intensity 0..255
  const out = createBitmap(tW, tH);
  for (let oy = 0; oy < tH; oy++) {
    const sy0 = minY + Math.floor((oy * bboxH) / tH);
    const sy1 = minY + Math.floor(((oy + 1) * bboxH) / tH);
    for (let ox = 0; ox < tW; ox++) {
      const sx0 = minX + Math.floor((ox * bboxW) / tW);
      const sx1 = minX + Math.floor(((ox + 1) * bboxW) / tW);
      let sum = 0;
      let count = 0;
      for (let y = sy0; y < Math.max(sy0 + 1, sy1); y++) {
        for (let x = sx0; x < Math.max(sx0 + 1, sx1); x++) {
          sum += srcData.data[(y * srcW + x) * 4 + 3];
          count++;
        }
      }
      const avg = count > 0 ? sum / count : 0;
      out.data[oy * tW + ox] = quantize(avg, levels);
    }
  }
  return out;
}

function quantize(alpha: number, levels: 2 | 5): number {
  if (levels === 2) return alpha >= 96 ? 4 : 0;
  // 5 levels: 0..4
  if (alpha < 32) return 0;
  if (alpha < 96) return 1;
  if (alpha < 160) return 2;
  if (alpha < 224) return 3;
  return 4;
}
