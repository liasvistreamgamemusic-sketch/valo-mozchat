import { useEffect, useState } from 'react';
import { createBitmap, type Bitmap } from '../core/bitmap';
import { rasterizeText } from '../core/rasterize';
import styles from './InputPanel.module.css';

type Props = { onBitmap: (b: Bitmap) => void };

const SUGGESTIONS = ['😀', '😎', '🤡', '🔥', '💀', '👻', '👑', '🎯', '💎', '⭐', '❤️', '✨', '🚀', '🎮', '🍕', '🍣'];

export default function EmojiMode({ onBitmap }: Props) {
  const [text, setText] = useState('🔥');
  const [width, setWidth] = useState(32);

  useEffect(() => {
    if (!text) {
      onBitmap(createBitmap(0, 0));
      return;
    }
    const b = rasterizeText({ text, targetWidth: width, levels: 2 });
    onBitmap(b);
  }, [text, width, onBitmap]);

  return (
    <div className={styles.panel}>
      <h2 className={styles.heading}>絵文字をピクセルアートに</h2>

      <div className={styles.field}>
        <label htmlFor="emo">絵文字（1つでも複数並べてもOK）</label>
        <input
          id="emo"
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="🔥 や 💀 など"
        />
      </div>

      <div className={styles.field}>
        <label>クリックして入れる</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {SUGGESTIONS.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => setText(e)}
              style={{ fontSize: 18, padding: '6px 10px' }}
            >
              {e}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.field}>
        <label htmlFor="ew">横ピクセル数</label>
        <input
          id="ew"
          type="number"
          min={8}
          max={80}
          value={width}
          onChange={(e) => setWidth(Math.max(8, Math.min(80, Number(e.target.value) || 8)))}
        />
      </div>

      <p className={styles.hint}>
        絵文字はお使いの端末のフォントでレンダリング → ピクセルに量子化されます。
        VALORANTのチャットには生の絵文字は送れない（2026/3のhotfixで無効化）ため、このようにピクセル化する必要があります。
      </p>
    </div>
  );
}
