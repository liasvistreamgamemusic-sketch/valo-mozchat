import styles from './ModeTabs.module.css';

export type Mode = 'text' | 'draw' | 'template';

const TABS: Array<{ id: Mode; label: string; icon: string }> = [
  { id: 'text', label: 'テキスト・絵文字', icon: 'A' },
  { id: 'draw', label: 'お絵描き', icon: '✎' },
  { id: 'template', label: 'テンプレート', icon: '★' },
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
