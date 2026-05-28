import { createBitmap, type Bitmap } from './bitmap';
import { renderTextBitmap } from './pixelFont';
import { rasterizeText } from './rasterize';

/**
 * A template that produces a Bitmap when invoked.
 *
 * 'text'      → rendered with the bundled 5×7 pixel font (ASCII-only,
 *                crispest output for short phrases like "GG WP")
 * 'rasterize' → rendered via Canvas (emoji / Japanese / arbitrary text)
 * 'pattern'   → hard-coded pixel pattern (use '#' for on, anything else off)
 */
export type Template =
  | { id: string; label: string; category: string; kind: 'text'; text: string; scale?: number; spacing?: number }
  | { id: string; label: string; category: string; kind: 'rasterize'; text: string; width: number }
  | { id: string; label: string; category: string; kind: 'pattern'; pattern: string[] };

export const TEMPLATES: Template[] = [
  // ────────── 定番フレーズ ──────────
  { id: 'gg',      label: 'GG',     category: '定番', kind: 'text', text: 'GG' },
  { id: 'ggwp',    label: 'GG WP',  category: '定番', kind: 'text', text: 'GG WP' },
  { id: 'ggez',    label: 'GG EZ',  category: '定番', kind: 'text', text: 'GG EZ' },
  { id: 'nice',    label: 'NICE',   category: '定番', kind: 'text', text: 'NICE' },
  { id: 'go',      label: 'GO!',    category: '定番', kind: 'text', text: 'GO!' },
  { id: 'win',     label: 'WIN',    category: '定番', kind: 'text', text: 'WIN' },
  { id: 'ace',     label: 'ACE!',   category: '定番', kind: 'text', text: 'ACE!' },
  { id: 'clutch',  label: 'CLUTCH', category: '定番', kind: 'text', text: 'CLUTCH' },
  { id: 'omg',     label: 'OMG',    category: '定番', kind: 'text', text: 'OMG' },
  { id: 'wtf',     label: 'WTF',    category: '定番', kind: 'text', text: 'WTF' },
  { id: 'lol',     label: 'LOL',    category: '定番', kind: 'text', text: 'LOL' },
  { id: 'ff',      label: 'FF',     category: '定番', kind: 'text', text: 'FF' },
  { id: '1v5',     label: '1v5',    category: '定番', kind: 'text', text: '1v5' },
  { id: 'sorry',   label: 'SORRY',  category: '定番', kind: 'text', text: 'SORRY' },
  { id: 'thx',     label: 'THX',    category: '定番', kind: 'text', text: 'THX' },

  // ────────── シンボル絵文字（大） ──────────
  { id: 'heart-emoji', label: '❤ ハート', category: 'シンボル', kind: 'rasterize', text: '❤️', width: 32 },
  { id: 'star-emoji',  label: '⭐ スター', category: 'シンボル', kind: 'rasterize', text: '⭐', width: 32 },
  { id: 'fire-emoji',  label: '🔥 ファイア',category: 'シンボル', kind: 'rasterize', text: '🔥', width: 32 },
  { id: 'skull-emoji', label: '💀 スカル', category: 'シンボル', kind: 'rasterize', text: '💀', width: 32 },
  { id: 'crown-emoji', label: '👑 クラウン',category: 'シンボル', kind: 'rasterize', text: '👑', width: 32 },
  { id: 'diamond-emoji', label: '💎 ダイヤ',category: 'シンボル', kind: 'rasterize', text: '💎', width: 32 },
  { id: 'target-emoji', label: '🎯 ターゲット',category: 'シンボル', kind: 'rasterize', text: '🎯', width: 32 },
  { id: 'trophy-emoji', label: '🏆 トロフィー',category: 'シンボル', kind: 'rasterize', text: '🏆', width: 32 },

  // ────────── パターン（手描き） ──────────
  {
    id: 'heart-small',
    label: '♥ 小ハート',
    category: 'パターン',
    kind: 'pattern',
    pattern: [
      '.##..##.',
      '########',
      '########',
      '.######.',
      '..####..',
      '...##...',
    ],
  },
  {
    id: 'smile-small',
    label: '☺ スマイル',
    category: 'パターン',
    kind: 'pattern',
    pattern: [
      '..######..',
      '.#......#.',
      '#..#..#..#',
      '#........#',
      '#.#....#.#',
      '#..####..#',
      '.#......#.',
      '..######..',
    ],
  },
  {
    id: 'star-small',
    label: '★ 小スター',
    category: 'パターン',
    kind: 'pattern',
    pattern: [
      '......#......',
      '......#......',
      '.....###.....',
      '#############',
      '.###########.',
      '..#########..',
      '...#######...',
      '..##.....##..',
      '.##.......##.',
    ],
  },
  {
    id: 'thumbs-up',
    label: '👍 サムズアップ',
    category: 'パターン',
    kind: 'pattern',
    pattern: [
      '....##....',
      '...#..#...',
      '...#..#...',
      '...#..#...',
      '###...###.',
      '#.......##',
      '#........#',
      '##......##',
      '.#......#.',
      '.########.',
    ],
  },
  {
    id: 'sword',
    label: '🗡 ソード',
    category: 'パターン',
    kind: 'pattern',
    pattern: [
      '...#.',
      '..##.',
      '.###.',
      '####.',
      '####.',
      '####.',
      '####.',
      '####.',
      '.###.',
      '..##.',
      '##.##',
      '.###.',
      '..#..',
    ],
  },
];

/** Resolve a template into a renderable Bitmap. */
export function renderTemplate(t: Template): Bitmap {
  switch (t.kind) {
    case 'text': {
      const bm = renderTextBitmap(t.text, { scale: t.scale ?? 1, spacing: t.spacing ?? 1 });
      if (bm) return bm;
      return rasterizeText({ text: t.text, targetWidth: 48, levels: 2 });
    }
    case 'rasterize':
      return rasterizeText({ text: t.text, targetWidth: t.width, levels: 2 });
    case 'pattern': {
      const h = t.pattern.length;
      const w = Math.max(...t.pattern.map((r) => r.length));
      const b = createBitmap(w, h);
      for (let y = 0; y < h; y++) {
        const row = t.pattern[y];
        for (let x = 0; x < row.length; x++) {
          if (row[x] === '#') b.data[y * w + x] = 4;
        }
      }
      return b;
    }
  }
}
