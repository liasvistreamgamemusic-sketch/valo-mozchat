import { useEffect, useMemo, useState } from 'react';
import { type Bitmap, createBitmap } from '../core/bitmap';
import { encodeBitmap } from '../core/blockEncoder';
import { renderTemplate, TEMPLATES, type Template } from '../core/templates';
import styles from './InputPanel.module.css';

type Props = { onBitmap: (b: Bitmap) => void };

export default function TemplateMode({ onBitmap }: Props) {
  const categories = useMemo(() => {
    const out: string[] = [];
    for (const t of TEMPLATES) {
      if (!out.includes(t.category)) out.push(t.category);
    }
    return out;
  }, []);
  const [category, setCategory] = useState<string>(categories[0]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedId) {
      onBitmap(createBitmap(0, 0));
      return;
    }
    const t = TEMPLATES.find((x) => x.id === selectedId);
    if (!t) return;
    onBitmap(renderTemplate(t));
  }, [selectedId, onBitmap]);

  const filtered = TEMPLATES.filter((t) => t.category === category);

  return (
    <div className={styles.panel}>
      <h2 className={styles.heading}>テンプレートから選ぶ</h2>

      <div className={styles.emojiTabs}>
        {categories.map((c) => (
          <button
            key={c}
            type="button"
            className={`${styles.emojiTab} ${category === c ? styles.emojiTabActive : ''}`}
            onClick={() => setCategory(c)}
          >
            {c}
          </button>
        ))}
      </div>

      <div className={styles.templateGrid}>
        {filtered.map((t) => (
          <TemplateCard
            key={t.id}
            template={t}
            selected={selectedId === t.id}
            onClick={() => setSelectedId(t.id)}
          />
        ))}
      </div>

      <p className={styles.hint}>
        テンプレートを選んでプレビューを確認 → 「全コピー」でVALORANTのチャットに貼り付け。
        パターン系（♥ など）はそのまま、フレーズ系は内蔵ドットフォントでレンダリングされます。
      </p>
    </div>
  );
}

function TemplateCard({
  template,
  selected,
  onClick,
}: {
  template: Template;
  selected: boolean;
  onClick: () => void;
}) {
  // Render a small inline preview using the same encoder so the user can see
  // exactly what each template produces before committing.
  const preview = useMemo(() => {
    try {
      const bm = renderTemplate(template);
      return encodeBitmap(bm, 'halfblock');
    } catch {
      return '';
    }
  }, [template]);

  return (
    <button
      type="button"
      className={`${styles.templateCard} ${selected ? styles.templateCardActive : ''}`}
      onClick={onClick}
    >
      <div className={styles.templateLabel}>{template.label}</div>
      <pre className={styles.templatePreview}>{preview}</pre>
    </button>
  );
}
