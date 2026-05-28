import { useEffect, useState } from 'react';
import { createBitmap, type Bitmap } from '../core/bitmap';
import { hasGlyph, renderTextBitmap } from '../core/pixelFont';
import { rasterizeText } from '../core/rasterize';
import styles from './InputPanel.module.css';

type Props = { onBitmap: (b: Bitmap) => void };

type Source = 'auto' | 'pixelfont' | 'rasterize';

export default function TextMode({ onBitmap }: Props) {
  const [text, setText] = useState('GG WP');
  const [scale, setScale] = useState(1);
  const [spacing, setSpacing] = useState(1);
  const [source, setSource] = useState<Source>('auto');
  const [rasterWidth, setRasterWidth] = useState(48);

  useEffect(() => {
    const trimmed = text;
    if (trimmed === '') {
      onBitmap(createBitmap(0, 0));
      return;
    }
    const useFont =
      source === 'pixelfont' || (source === 'auto' && [...trimmed].every(hasGlyph));
    if (useFont) {
      const b = renderTextBitmap(trimmed, { scale, spacing });
      if (b) {
        onBitmap(b);
        return;
      }
    }
    // Fall back to Canvas rasterization for non-ASCII / requested
    const b = rasterizeText({ text: trimmed, targetWidth: rasterWidth, levels: 2 });
    onBitmap(b);
  }, [text, scale, spacing, source, rasterWidth, onBitmap]);

  return (
    <div className={styles.panel}>
      <h2 className={styles.heading}>テキストをピクセルアートに</h2>
      <div className={styles.field}>
        <label htmlFor="txt">テキスト</label>
        <input
          id="txt"
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="GG / NICE / VALORANT など"
        />
      </div>

      <div className={styles.field}>
        <label htmlFor="src">レンダリング方式</label>
        <select id="src" value={source} onChange={(e) => setSource(e.target.value as Source)}>
          <option value="auto">自動（ASCIIはドットフォント、それ以外はCanvas）</option>
          <option value="pixelfont">5×7ドットフォント（ASCIIのみ）</option>
          <option value="rasterize">Canvasラスタライズ（日本語/絵文字OK）</option>
        </select>
      </div>

      {(source === 'pixelfont' || source === 'auto') && (
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

      {source === 'rasterize' && (
        <div className={styles.field}>
          <label htmlFor="rw">解像度（横ピクセル数）</label>
          <input
            id="rw"
            type="number"
            min={8}
            max={120}
            value={rasterWidth}
            onChange={(e) => setRasterWidth(Math.max(8, Math.min(120, Number(e.target.value) || 8)))}
          />
        </div>
      )}

      <p className={styles.hint}>
        英数字・記号は内蔵ドットフォントで綺麗にレンダリングされます。日本語・絵文字を入力するとCanvasでラスタライズします。
      </p>
    </div>
  );
}
