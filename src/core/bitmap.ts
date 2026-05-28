/**
 * Internal bitmap representation used throughout the app.
 * Each cell holds an intensity 0–4:
 *   0 = empty
 *   1–3 = light/medium/heavy shading (used by 4-level mode)
 *   4 = solid
 *
 * For the default half-block mode only 0 vs >0 matters.
 */
export type Bitmap = {
  width: number;
  height: number;
  data: Uint8Array;
};

export function createBitmap(width: number, height: number): Bitmap {
  return { width, height, data: new Uint8Array(width * height) };
}

export function cloneBitmap(b: Bitmap): Bitmap {
  return { width: b.width, height: b.height, data: new Uint8Array(b.data) };
}

export function getPixel(b: Bitmap, x: number, y: number): number {
  if (x < 0 || y < 0 || x >= b.width || y >= b.height) return 0;
  return b.data[y * b.width + x];
}

export function setPixel(b: Bitmap, x: number, y: number, v: number): void {
  if (x < 0 || y < 0 || x >= b.width || y >= b.height) return;
  b.data[y * b.width + x] = v & 0xff;
}

export function clearBitmap(b: Bitmap): void {
  b.data.fill(0);
}

/** Ensure height is even by appending a blank row (needed for half-block encoding). */
export function padHeightToEven(b: Bitmap): Bitmap {
  if (b.height % 2 === 0) return b;
  const out = createBitmap(b.width, b.height + 1);
  out.data.set(b.data);
  return out;
}

/** Resize the bitmap canvas to the new dimensions, anchoring the existing data to the top-left. */
export function resizeBitmap(b: Bitmap, newW: number, newH: number): Bitmap {
  const out = createBitmap(newW, newH);
  const w = Math.min(b.width, newW);
  const h = Math.min(b.height, newH);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      out.data[y * newW + x] = b.data[y * b.width + x];
    }
  }
  return out;
}

/** 4-connected flood fill. */
export function floodFill(b: Bitmap, sx: number, sy: number, target: number): void {
  const start = getPixel(b, sx, sy);
  if (start === target) return;
  const stack: Array<[number, number]> = [[sx, sy]];
  while (stack.length) {
    const [x, y] = stack.pop()!;
    if (x < 0 || y < 0 || x >= b.width || y >= b.height) continue;
    if (b.data[y * b.width + x] !== start) continue;
    b.data[y * b.width + x] = target;
    stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }
}
