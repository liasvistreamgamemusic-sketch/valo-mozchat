import { useCallback, useEffect, useRef, useState } from 'react';
import { cloneBitmap, createBitmap, floodFill, resizeBitmap, type Bitmap } from '../core/bitmap';
import styles from './InputPanel.module.css';

type Props = {
  bitmap: Bitmap;
  onBitmap: (b: Bitmap) => void;
};

type Tool = 'pen' | 'eraser' | 'fill';

type Size = { label: string; w: number; h: number };

const SIZES: Size[] = [
  { label: '小 16×16', w: 16, h: 16 },
  { label: '中 32×16', w: 32, h: 16 },
  { label: '大 48×24', w: 48, h: 24 },
  { label: '横長 64×16', w: 64, h: 16 },
];

const CELL = 18; // pixel size for on-screen rendering

export default function DrawMode({ bitmap, onBitmap }: Props) {
  const [tool, setTool] = useState<Tool>('pen');
  const [size, setSize] = useState<Size>(SIZES[1]);
  const [history, setHistory] = useState<Bitmap[]>([]);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingRef = useRef(false);
  const lastCellRef = useRef<{ x: number; y: number } | null>(null);

  // Initialize / resize when the user picks a different grid size
  useEffect(() => {
    if (bitmap.width !== size.w || bitmap.height !== size.h) {
      onBitmap(resizeBitmap(bitmap, size.w, size.h));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size]);

  // If we're entering this mode with an empty bitmap, fill in
  useEffect(() => {
    if (bitmap.width === 0 || bitmap.height === 0) {
      onBitmap(createBitmap(size.w, size.h));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Render bitmap on canvas
  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const W = bitmap.width * CELL;
    const H = bitmap.height * CELL;
    if (cv.width !== W) cv.width = W;
    if (cv.height !== H) cv.height = H;
    const ctx = cv.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#1a2028';
    ctx.fillRect(0, 0, W, H);
    // Draw cells
    for (let y = 0; y < bitmap.height; y++) {
      for (let x = 0; x < bitmap.width; x++) {
        const v = bitmap.data[y * bitmap.width + x];
        if (v > 0) {
          ctx.fillStyle = '#e6e9ef';
          ctx.fillRect(x * CELL, y * CELL, CELL, CELL);
        }
      }
    }
    // Grid
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 0; x <= bitmap.width; x++) {
      ctx.moveTo(x * CELL + 0.5, 0);
      ctx.lineTo(x * CELL + 0.5, H);
    }
    for (let y = 0; y <= bitmap.height; y++) {
      ctx.moveTo(0, y * CELL + 0.5);
      ctx.lineTo(W, y * CELL + 0.5);
    }
    ctx.stroke();
    // Half-block guide (every 2 rows)
    ctx.strokeStyle = 'rgba(255,70,85,0.18)';
    ctx.beginPath();
    for (let y = 0; y <= bitmap.height; y += 2) {
      ctx.moveTo(0, y * CELL + 0.5);
      ctx.lineTo(W, y * CELL + 0.5);
    }
    ctx.stroke();
  }, [bitmap]);

  const pushHistory = useCallback(() => {
    setHistory((h) => [...h.slice(-49), cloneBitmap(bitmap)]);
  }, [bitmap]);

  function pointerCell(ev: React.PointerEvent<HTMLCanvasElement>): { x: number; y: number } | null {
    const cv = canvasRef.current;
    if (!cv) return null;
    const rect = cv.getBoundingClientRect();
    const scaleX = cv.width / rect.width;
    const scaleY = cv.height / rect.height;
    const px = (ev.clientX - rect.left) * scaleX;
    const py = (ev.clientY - rect.top) * scaleY;
    const cx = Math.floor(px / CELL);
    const cy = Math.floor(py / CELL);
    if (cx < 0 || cy < 0 || cx >= bitmap.width || cy >= bitmap.height) return null;
    return { x: cx, y: cy };
  }

  function paintCell(b: Bitmap, x: number, y: number): void {
    if (tool === 'fill') {
      floodFill(b, x, y, b.data[y * b.width + x] > 0 ? 0 : 4);
    } else {
      b.data[y * b.width + x] = tool === 'eraser' ? 0 : 4;
    }
  }

  // Bresenham-style line so fast drags don't leave gaps
  function paintLine(b: Bitmap, x0: number, y0: number, x1: number, y1: number): void {
    const dx = Math.abs(x1 - x0);
    const dy = -Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    let x = x0;
    let y = y0;
    while (true) {
      b.data[y * b.width + x] = tool === 'eraser' ? 0 : 4;
      if (x === x1 && y === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) { err += dy; x += sx; }
      if (e2 <= dx) { err += dx; y += sy; }
    }
  }

  function onPointerDown(ev: React.PointerEvent<HTMLCanvasElement>) {
    const cell = pointerCell(ev);
    if (!cell) return;
    (ev.target as Element).setPointerCapture?.(ev.pointerId);
    pushHistory();
    drawingRef.current = true;
    const next = cloneBitmap(bitmap);
    paintCell(next, cell.x, cell.y);
    lastCellRef.current = cell;
    onBitmap(next);
  }

  function onPointerMove(ev: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawingRef.current) return;
    const cell = pointerCell(ev);
    if (!cell) return;
    const last = lastCellRef.current;
    if (last && last.x === cell.x && last.y === cell.y) return;
    if (tool === 'fill') return; // fill is one-shot
    const next = cloneBitmap(bitmap);
    if (last) paintLine(next, last.x, last.y, cell.x, cell.y);
    else paintCell(next, cell.x, cell.y);
    lastCellRef.current = cell;
    onBitmap(next);
  }

  function onPointerUp() {
    drawingRef.current = false;
    lastCellRef.current = null;
  }

  function clear() {
    pushHistory();
    onBitmap(createBitmap(bitmap.width, bitmap.height));
  }

  function undo() {
    if (history.length === 0) return;
    const last = history[history.length - 1];
    setHistory((h) => h.slice(0, -1));
    onBitmap(last);
  }

  return (
    <div className={styles.panel}>
      <h2 className={styles.heading}>マウスで描く</h2>

      <div className={styles.toolbar}>
        <button
          type="button"
          className={tool === 'pen' ? styles.active : ''}
          onClick={() => setTool('pen')}
        >
          ✎ ペン
        </button>
        <button
          type="button"
          className={tool === 'eraser' ? styles.active : ''}
          onClick={() => setTool('eraser')}
        >
          ⌫ 消しゴム
        </button>
        <button
          type="button"
          className={tool === 'fill' ? styles.active : ''}
          onClick={() => setTool('fill')}
        >
          ⬛ 塗り
        </button>
        <button type="button" onClick={undo} disabled={history.length === 0}>
          ↶ 元に戻す
        </button>
        <button type="button" onClick={clear}>
          🗑 クリア
        </button>
      </div>

      <div className={styles.sizePicker}>
        <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>サイズ:</span>
        {SIZES.map((s) => (
          <button
            key={s.label}
            type="button"
            className={s.w === size.w && s.h === size.h ? styles.active : ''}
            onClick={() => setSize(s)}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className={styles.canvasWrap}>
        <canvas
          ref={canvasRef}
          className={styles.canvas}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onPointerLeave={onPointerUp}
        />
      </div>

      <p className={styles.hint}>
        薄い赤線は半ブロック（▀/▄）の境界です。隣り合う2行が1文字になります。
      </p>
    </div>
  );
}
