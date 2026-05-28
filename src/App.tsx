import { useMemo, useState } from 'react';
import ModeTabs, { type Mode } from './components/ModeTabs';
import TextMode from './components/TextMode';
import DrawMode from './components/DrawMode';
import ImageMode from './components/ImageMode';
import EmojiMode from './components/EmojiMode';
import Preview from './components/Preview';
import { createBitmap, type Bitmap } from './core/bitmap';
import { encodeBitmap, type EncodeMode } from './core/blockEncoder';
import styles from './App.module.css';

export default function App() {
  const [mode, setMode] = useState<Mode>('text');
  const [bitmap, setBitmap] = useState<Bitmap>(() => createBitmap(0, 0));
  const [encodeMode, setEncodeMode] = useState<EncodeMode>('halfblock');

  const output = useMemo(() => encodeBitmap(bitmap, encodeMode), [bitmap, encodeMode]);

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <h1 className={styles.title}>
          <span className={styles.titleAccent}>VALORANT</span> モザイクチャット
        </h1>
        <p className={styles.subtitle}>
          テキスト・お絵描き・画像・絵文字をピクセルアートに変換してチャットにペースト
        </p>
      </header>

      <ModeTabs mode={mode} onChange={setMode} />

      <div className={styles.workspace}>
        <section className={styles.inputPanel}>
          {mode === 'text' && <TextMode onBitmap={setBitmap} />}
          {mode === 'draw' && <DrawMode bitmap={bitmap} onBitmap={setBitmap} />}
          {mode === 'image' && <ImageMode onBitmap={setBitmap} />}
          {mode === 'emoji' && <EmojiMode onBitmap={setBitmap} />}
        </section>

        <section className={styles.outputPanel}>
          <Preview text={output} encodeMode={encodeMode} onEncodeModeChange={setEncodeMode} />
        </section>
      </div>

      <footer className={styles.footer}>
        <div className={styles.warn}>
          ⚠ VALORANTのAA連投はスパム報告→制限の対象になる可能性があります。カスタム/プラベで先に試してください。
        </div>
        <div className={styles.notes}>
          ピクセルは <code>▀ ▄ █</code> ＋スペースで構成されます（VALORANTチャットで安定して表示できる文字）。
        </div>
      </footer>
    </div>
  );
}
