import { useState } from 'react';
import { copyText } from '../core/clipboard';
import { getStats, type EncodeMode } from '../core/blockEncoder';
import styles from './Preview.module.css';

type Props = {
  text: string;
  encodeMode: EncodeMode;
  onEncodeModeChange: (m: EncodeMode) => void;
};

export default function Preview({ text, encodeMode, onEncodeModeChange }: Props) {
  const [copied, setCopied] = useState<'all' | number | null>(null);
  const stats = getStats(text);
  const lines = text === '' ? [] : text.split('\n');

  const tooManyLines = stats.lines > 15;

  async function copyAll() {
    const ok = await copyText(text);
    if (ok) {
      setCopied('all');
      window.setTimeout(() => setCopied(null), 1500);
    }
  }

  async function copyLine(i: number) {
    const ok = await copyText(lines[i] ?? '');
    if (ok) {
      setCopied(i);
      window.setTimeout(() => setCopied(null), 1500);
    }
  }

  return (
    <div className={styles.preview}>
      <div className={styles.header}>
        <h2 className={styles.heading}>プレビュー</h2>
        <div className={styles.modeSelect}>
          <label htmlFor="encmode">文字セット:</label>
          <select
            id="encmode"
            value={encodeMode}
            onChange={(e) => onEncodeModeChange(e.target.value as EncodeMode)}
          >
            <option value="halfblock">標準（▀▄█ + ░背景）— VALORANT 推奨</option>
            <option value="halfblock-space">スペース背景（▀▄█ + space）</option>
            <option value="quad">4階調（░▒▓█）</option>
            <option value="quad-space">4階調（スペース背景）</option>
          </select>
        </div>
      </div>

      <div className={styles.viewport}>
        {text ? (
          <pre className={styles.pre}>{text}</pre>
        ) : (
          <div className={styles.empty}>
            左のパネルで入力するとここにプレビューが表示されます
          </div>
        )}
      </div>

      <div className={styles.statsRow}>
        <span>
          行: <strong className={tooManyLines ? styles.warn : ''}>{stats.lines}</strong>
          {tooManyLines && <span className={styles.warn}> （15行以上は見切れる可能性）</span>}
        </span>
        <span>文字数: <strong>{stats.chars}</strong></span>
      </div>

      <div className={styles.actions}>
        <button
          type="button"
          className="primary"
          onClick={copyAll}
          disabled={!text}
        >
          {copied === 'all' ? 'コピーしました！' : '全コピー（VALORANTに貼り付け）'}
        </button>
      </div>

      {lines.length > 1 && (
        <details className={styles.details}>
          <summary>1行ずつコピー（改行が反映されない時用）</summary>
          <ul className={styles.lineList}>
            {lines.map((ln, i) => (
              <li key={i} className={styles.lineItem}>
                <span className={styles.lineNo}>{i + 1}</span>
                <code className={styles.lineCode}>{ln || ' '}</code>
                <button type="button" onClick={() => copyLine(i)}>
                  {copied === i ? '✓' : 'コピー'}
                </button>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
