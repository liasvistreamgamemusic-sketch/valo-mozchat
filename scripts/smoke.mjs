// Quick logic smoke test that doesn't need a browser.
// Verifies:
//   - bitmap encoding produces expected block characters
//   - the 5x7 font renders 'GG' into a sensible bitmap
//   - getStats counts correctly
import { createBitmap, setPixel } from '../src/core/bitmap.ts';
import { encodeBitmap, getStats } from '../src/core/blockEncoder.ts';
import { renderTextBitmap } from '../src/core/pixelFont.ts';

let failures = 0;
function expect(label, got, want) {
  const okEq = JSON.stringify(got) === JSON.stringify(want);
  if (!okEq) {
    failures++;
    console.error(`FAIL ${label}:\n  got:  ${JSON.stringify(got)}\n  want: ${JSON.stringify(want)}`);
  } else {
    console.log(`OK   ${label}`);
  }
}

// 1. Encode a 2x2 bitmap: top-left + bottom-right
{
  const b = createBitmap(2, 2);
  setPixel(b, 0, 0, 4);
  setPixel(b, 1, 1, 4);
  const s = encodeBitmap(b, 'halfblock');
  // (0,0): top=on, bot=off -> '▀'   (1,0): top=off, bot=on -> '▄'
  expect('2x2 halfblock', s, '▀▄');
}

// 2. Encode full block 2x2
{
  const b = createBitmap(2, 2);
  for (let i = 0; i < b.data.length; i++) b.data[i] = 4;
  const s = encodeBitmap(b, 'halfblock');
  expect('2x2 full block', s, '██');
}

// 3. Encode empty bitmap (2x2 all zeros) — rtrim should clean trailing spaces, line should remain empty
{
  const b = createBitmap(2, 2);
  const s = encodeBitmap(b, 'halfblock');
  expect('empty 2x2', s, '');
}

// 4. Render 'GG' with the 5x7 font, verify nonzero pixels and dimensions
{
  const bm = renderTextBitmap('GG', { scale: 1, spacing: 1 });
  if (!bm) {
    failures++;
    console.error('FAIL: renderTextBitmap returned null for "GG"');
  } else {
    expect('GG width', bm.width, 5 + 1 + 5);
    expect('GG height', bm.height, 7);
    const nonZero = [...bm.data].filter((v) => v > 0).length;
    if (nonZero > 0) console.log(`OK   GG nonZero=${nonZero}`); else { failures++; console.error('FAIL: GG produced empty bitmap'); }
    const encoded = encodeBitmap(bm, 'halfblock');
    console.log('GG rendered:');
    console.log(encoded);
  }
}

// 5. getStats sanity
{
  const stats = getStats('▄▄\n▀▀▀');
  expect('getStats lines', stats.lines, 2);
  expect('getStats chars', stats.chars, 6);
}

// 6. quad encoding
{
  const b = createBitmap(5, 1);
  b.data[0] = 0; b.data[1] = 1; b.data[2] = 2; b.data[3] = 3; b.data[4] = 4;
  const s = encodeBitmap(b, 'quad');
  expect('quad encoding', s, ' ░▒▓█');
}

if (failures > 0) {
  console.error(`\n${failures} test(s) FAILED`);
  process.exit(1);
} else {
  console.log('\nAll tests passed.');
}
