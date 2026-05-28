import { padHeightToEven, type Bitmap } from './bitmap';

export type EncodeMode = 'halfblock' | 'halfblock-space' | 'quad' | 'quad-space';

/**
 * Encode a bitmap into a multi-line string of Unicode block characters.
 *
 * halfblock (default): each output character represents 2 vertical pixels.
 *   '░' (empty) / '▀' (top) / '▄' (bottom) / '█' (both)
 *   '░' (LIGHT SHADE) is used for empty cells instead of ASCII space because
 *   VALORANT's chat font is proportional: ' ' is narrower than '█▀▄', which
 *   collapses empty regions and breaks horizontal alignment. '░' is in the
 *   same Unicode block (U+2580–U+259F) as the other characters and renders at
 *   the same width, so the image stays aligned in the chat.
 *
 * halfblock-space: same as halfblock but uses ASCII space for empty cells.
 *   Looks cleaner in monospace previews; alignment breaks in VALORANT.
 *
 * quad: each output character represents 1 pixel using 4 shading levels.
 *   '░' (very light) / '▒' / '▓' / '█'  — also chat-safe (same width).
 *
 * quad-space: 5 levels including a true ' ' for fully empty cells.
 */
export function encodeBitmap(b: Bitmap, mode: EncodeMode = 'halfblock'): string {
  switch (mode) {
    case 'halfblock-space':
      return encodeHalfBlock(b, ' ');
    case 'quad':
      return encodeQuad(b, '░');
    case 'quad-space':
      return encodeQuad(b, ' ');
    case 'halfblock':
    default:
      return encodeHalfBlock(b, '░');
  }
}

function encodeHalfBlock(input: Bitmap, empty: string): string {
  const b = padHeightToEven(input);
  const rows = b.height / 2;
  const lines: string[] = [];
  for (let row = 0; row < rows; row++) {
    let line = '';
    for (let col = 0; col < b.width; col++) {
      const top = b.data[row * 2 * b.width + col] > 0;
      const bot = b.data[(row * 2 + 1) * b.width + col] > 0;
      if (top && bot) line += '█';
      else if (top) line += '▀';
      else if (bot) line += '▄';
      else line += empty;
    }
    // Trim trailing whitespace only when empty is ASCII space; '░' is
    // visually significant (it's the rendered background) so we keep
    // the full rectangle.
    lines.push(empty === ' ' ? rtrim(line) : line);
  }
  return lines.join('\n');
}

function encodeQuad(b: Bitmap, lvl0: string): string {
  const chars = [lvl0, '░', '▒', '▓', '█'];
  const lines: string[] = [];
  for (let y = 0; y < b.height; y++) {
    let line = '';
    for (let x = 0; x < b.width; x++) {
      const v = b.data[y * b.width + x];
      const idx = Math.max(0, Math.min(4, v));
      line += chars[idx];
    }
    lines.push(lvl0 === ' ' ? rtrim(line) : line);
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
