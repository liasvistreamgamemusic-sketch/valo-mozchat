import { padHeightToEven, type Bitmap } from './bitmap';

export type EncodeMode = 'halfblock' | 'quad';

/**
 * Encode a bitmap into a multi-line string of Unicode block characters.
 *
 * halfblock (default): each output character represents 2 vertical pixels
 *   space / ▀ (top) / ▄ (bottom) / █ (both)
 *
 * quad: each output character represents 1 pixel using 4 shading levels
 *   space / ░ / ▒ / ▓ / █
 */
export function encodeBitmap(b: Bitmap, mode: EncodeMode = 'halfblock'): string {
  if (mode === 'quad') return encodeQuad(b);
  return encodeHalfBlock(b);
}

function encodeHalfBlock(input: Bitmap): string {
  const b = padHeightToEven(input);
  const rows = b.height / 2;
  const lines: string[] = [];
  for (let row = 0; row < rows; row++) {
    let line = '';
    for (let col = 0; col < b.width; col++) {
      const top = b.data[row * 2 * b.width + col] > 0;
      const bot = b.data[(row * 2 + 1) * b.width + col] > 0;
      if (top && bot) line += '█'; // █
      else if (top) line += '▀'; // ▀
      else if (bot) line += '▄'; // ▄
      else line += ' ';
    }
    lines.push(rtrim(line));
  }
  return lines.join('\n');
}

const QUAD_CHARS = [' ', '░', '▒', '▓', '█']; // ' ', ░, ▒, ▓, █

function encodeQuad(b: Bitmap): string {
  const lines: string[] = [];
  for (let y = 0; y < b.height; y++) {
    let line = '';
    for (let x = 0; x < b.width; x++) {
      const v = b.data[y * b.width + x];
      const idx = Math.max(0, Math.min(4, v));
      line += QUAD_CHARS[idx];
    }
    lines.push(rtrim(line));
  }
  return lines.join('\n');
}

function rtrim(s: string): string {
  let end = s.length;
  while (end > 0 && s.charCodeAt(end - 1) === 0x20) end--;
  return s.slice(0, end);
}

/** Quick stats for the preview footer. */
export function getStats(text: string): { lines: number; chars: number; nonSpaceChars: number } {
  const lines = text.length === 0 ? 0 : text.split('\n').length;
  const chars = text.length;
  let nonSpaceChars = 0;
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i);
    if (c !== 0x20 && c !== 0x0a) nonSpaceChars++;
  }
  return { lines, chars, nonSpaceChars };
}
