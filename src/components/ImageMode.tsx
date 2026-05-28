import { useCallback, useEffect, useRef, useState } from 'react';
import { createBitmap, type Bitmap } from '../core/bitmap';
import { imageToBitmap, loadImageFile, type ImageProcessOptions } from '../core/imageProcess';
import styles from './InputPanel.module.css';

type Props = { onBitmap: (b: Bitmap) => void };

export default function ImageMode({ onBitmap }: Props) {
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [width, setWidth] = useState(48);
  const [mode, setMode] = useState<ImageProcessOptions['mode']>('fs');
  const [threshold, setThreshold] = useState(128);
  const [invert, setInvert] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const reprocess = useCallback(() => {
    if (!img) {
      onBitmap(createBitmap(0, 0));
      return;
    }
    const b = imageToBitmap(img, { targetWidth: width, mode, threshold, invert });
    onBitmap(b);
  }, [img, width, mode, threshold, invert, onBitmap]);

  useEffect(() => {
    reprocess();
  }, [reprocess]);

  async function onFile(ev: React.ChangeEvent<HTMLInputElement>) {
    const f = ev.target.files?.[0];
    if (!f) return;
    try {
      const im = await loadImageFile(f);
      setImg(im);
    } catch {
      // ignore
    }
  }

  return (
    <div className={styles.panel}>
      <h2 className={styles.heading}>画像をピクセルアートに</h2>

      <div className={styles.field}>
        <label>画像ファイル（PNG/JPG/GIF/WebP）</label>
        <input ref={fileRef} type="file" accept="image/*" onChange={onFile} />
      </div>

      {img && (
        <>
          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor="iw">横ピクセル数</label>
              <input
                id="iw"
                type="number"
                min={8}
                max={120}
                value={width}
                onChange={(e) => setWidth(Math.max(8, Math.min(120, Number(e.target.value) || 8)))}
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="mode">変換方式</label>
              <select id="mode" value={mode} onChange={(e) => setMode(e.target.value as ImageProcessOptions['mode'])}>
                <option value="fs">ディザリング（Floyd–Steinberg）</option>
                <option value="threshold">2値化（閾値）</option>
                <option value="levels">4階調（▒▓ 等を使用）</option>
              </select>
            </div>
          </div>

          {mode !== 'levels' && (
            <div className={styles.field}>
              <label htmlFor="th">閾値: {threshold}</label>
              <input
                id="th"
                type="range"
                min={0}
                max={255}
                value={threshold}
                onChange={(e) => setThreshold(Number(e.target.value))}
              />
            </div>
          )}

          <div className={styles.field}>
            <label>
              <input
                type="checkbox"
                checked={invert}
                onChange={(e) => setInvert(e.target.checked)}
              />
              {' '}白黒を反転
            </label>
          </div>

          <div className={styles.canvasWrap} style={{ maxHeight: 200 }}>
            <img
              src={img.src}
              alt="プレビュー"
              style={{ maxWidth: '100%', maxHeight: 180, imageRendering: 'auto' }}
            />
          </div>
        </>
      )}

      <p className={styles.hint}>
        4階調モードを選ぶと <code>░ ▒ ▓ █</code> でグラデーション表現になりますが、プレビュー側で「4階調」を選択してください。
      </p>
    </div>
  );
}
