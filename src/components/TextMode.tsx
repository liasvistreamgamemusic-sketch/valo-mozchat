import { useEffect, useRef, useState } from 'react';
import { createBitmap, type Bitmap } from '../core/bitmap';
import { hasGlyph, renderTextBitmap } from '../core/pixelFont';
import { rasterizeText } from '../core/rasterize';
import { EMOJI_CATEGORIES } from '../core/emojiList';
import styles from './InputPanel.module.css';

type Props = { onBitmap: (b: Bitmap) => void };

type Source = 'auto' | 'pixelfont' | 'rasterize';

export default function TextMode({ onBitmap }: Props) {
  const [text, setText] = useState('GG WP');
  const [scale, setScale] = useState(1);
  const [spacing, setSpacing] = useState(1);
  const [source, setSource] = useState<Source>('auto');
  const [rasterWidth, setRasterWidth] = useState(48);
  const [openCategory, setOpenCategory] = useState<string>(EMOJI_CATEGORIES[0].name);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (text === '') {
      onBitmap(createBitmap(0, 0));
      return;
    }
    const allAscii = [...text].every(hasGlyph);
    const useFont = source === 'pixelfont' || (source === 'auto' && allAscii);
    if (useFont) {
      const b = renderTextBitmap(text, { scale, spacing });
      if (b) {
        onBitmap(b);
        return;
      }
    }
    const b = rasterizeText({ text, targetWidth: rasterWidth, levels: 2 });
    onBitmap(b);
  }, [text, scale, spacing, source, rasterWidth, onBitmap]);

  function insertAtCursor(toInsert: string) {
    const el = inputRef.current;
    if (!el) {
      setText((t) => t + toInsert);
      return;
    }
    const start = el.selectionStart ?? text.length;
    const end = el.selectionEnd ?? text.length;
    const next = text.slice(0, start) + toInsert + text.slice(end);
    setText(next);
    // Restore cursor after the inserted text
    requestAnimationFrame(() => {
      el.focus();
      const pos = start + toInsert.length;
      el.setSelectionRange(pos, pos);
    });
  }

  const containsNonAscii = [...text].some((c) => !hasGlyph(c));
  const effectiveSource: Source =
    source === 'auto' ? (containsNonAscii ? 'rasterize' : 'pixelfont') : source;

  return (
    <div className={styles.panel}>
      <h2 className={styles.heading}>テキスト・絵文字をピクセルアートに</h2>

      <div className={styles.field}>
        <label htmlFor="txt">入力（文字 & 絵文字どちらもOK）</label>
        <input
          ref={inputRef}
          id="txt"
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="GG / NICE / 🔥 / こんにちは など"
        />
      </div>

      <div className={styles.emojiPicker}>
        <div className={styles.emojiTabs}>
          {EMOJI_CATEGORIES.map((cat) => (
            <button
              key={cat.name}
              type="button"
              className={`${styles.emojiTab} ${openCategory === cat.name ? styles.emojiTabActive : ''}`}
              onClick={() => setOpenCategory(cat.name)}
            >
              {cat.name}
            </button>
          ))}
        </div>
        <div className={styles.emojiGrid}>
          {EMOJI_CATEGORIES.find((c) => c.name === openCategory)?.emojis.map((e) => (
            <button
              key={e}
              type="button"
              className={styles.emojiBtn}
              onClick={() => insertAtCursor(e)}
              title={`「${e}」を挿入`}
            >
              {e}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.field}>
        <label htmlFor="src">レンダリング方式（自動推奨）</label>
        <select id="src" value={source} onChange={(e) => setSource(e.target.value as Source)}>
          <option value="auto">自動：ASCIIはドットフォント、絵文字/日本語はCanvas</option>
          <option value="pixelfont">5×7ドットフォント（ASCIIのみ・最高画質）</option>
          <option value="rasterize">Canvasラスタライズ（全文字対応）</option>
        </select>
      </div>

      {(effectiveSource === 'pixelfont') && (
        <div className={styles.row}>
          <div className={styles.field}>
            <label htmlFor="scale">スケール</label>
            <input
              id="scale"
              type="number"
              min={1}
              max={4}
              value={scale}
              onChange={(e) => setScale(Math.max(1, Math.min(4, Number(e.target.value) || 1)))}
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="spacing">字間（px）</label>
            <input
              id="spacing"
              type="number"
              min={0}
              max={6}
              value={spacing}
              onChange={(e) => setSpacing(Math.max(0, Math.min(6, Number(e.target.value) || 0)))}
            />
          </div>
        </div>
      )}

      {effectiveSource === 'rasterize' && (
        <div className={styles.field}>
          <label htmlFor="rw">解像度（横ピクセル数）: {rasterWidth}</label>
          <input
            id="rw"
            type="range"
            min={8}
            max={96}
            value={rasterWidth}
            onChange={(e) => setRasterWidth(Number(e.target.value))}
          />
        </div>
      )}

      <p className={styles.hint}>
        英数字・記号は内蔵ドットフォントで綺麗にレンダリングされます。日本語・絵文字を入力するとCanvasラスタライザに自動で切り替わります。
      </p>
    </div>
  );
}
