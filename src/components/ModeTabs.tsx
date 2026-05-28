import styles from './ModeTabs.module.css';

export type Mode = 'text' | 'draw' | 'image' | 'emoji';

const TABS: Array<{ id: Mode; label: string; icon: string }> = [
  { id: 'text', label: 'テキスト', icon: 'A' },
  { id: 'draw', label: 'お絵描き', icon: '✎' },
  { id: 'image', label: '画像', icon: '🖼' },
  { id: 'emoji', label: '絵文字', icon: '☺' },
];

type Props = {
  mode: Mode;
  onChange: (mode: Mode) => void;
};

export default function ModeTabs({ mode, onChange }: Props) {
  return (
    <div className={styles.tabs}>
      {TABS.map((t) => (
        <button
          key={t.id}
          className={`${styles.tab} ${mode === t.id ? styles.active : ''}`}
          onClick={() => onChange(t.id)}
          type="button"
        >
          <span className={styles.icon}>{t.icon}</span>
          <span className={styles.label}>{t.label}</span>
        </button>
      ))}
    </div>
  );
}
