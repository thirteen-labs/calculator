import { describe, it, expect } from '@jest/globals';

import { computeKeypadLayout } from '../layout';

const BASE = {
  bottomInset: 34,
  spacing: 6,
  minButtonSize: 40,
  columns: 4,
};

/** Height a 393pt-wide phone leaves for the keypad, like a real measured box. */
const PHONE_VIEWPORT = 590;
const PHONE_WIDTH = 377;

function layoutFor(overrides: { rows: number } & Partial<typeof BASE> & { maxWidth?: number; viewportHeight?: number }) {
  return computeKeypadLayout({
    viewportHeight: PHONE_VIEWPORT,
    maxWidth: PHONE_WIDTH,
    ...BASE,
    ...overrides,
  });
}

/** Height the rows actually occupy, mirroring the keypad's own box model. */
function contentHeight(buttonSize: number, rows: number, bottomInset = 34, spacing = 6) {
  return rows * buttonSize + spacing * (rows - 1) + bottomInset + spacing;
}

describe('computeKeypadLayout', () => {
  it('fits every row inside the height it was given', () => {
    // The regression this exists for: scientific mode stacked 9 rows sized from
    // window height alone, which pushed the `=` row off the bottom of the screen.
    for (const rows of [5, 9]) {
      const { buttonSize, scrollable } = layoutFor({ rows });
      expect(contentHeight(buttonSize, rows)).toBeLessThanOrEqual(PHONE_VIEWPORT + 0.001);
      expect(scrollable).toBe(false);
    }
  });

  it('shrinks the buttons in scientific mode instead of overflowing', () => {
    const basic = layoutFor({ rows: 5 });
    const scientific = layoutFor({ rows: 9 });
    expect(scientific.buttonSize).toBeLessThan(basic.buttonSize);
  });

  it('never draws a button narrower than the minimum', () => {
    const { buttonSize } = layoutFor({ rows: 9, viewportHeight: 120 });
    expect(buttonSize).toBe(BASE.minButtonSize);
  });

  it('scrolls instead of overflowing when the screen is too short', () => {
    const { buttonSize, scrollable } = layoutFor({ rows: 9, viewportHeight: 120 });
    expect(scrollable).toBe(true);
    // Still larger than the box, so the user scrolls rather than losing the `=`
    // key off the bottom of the screen entirely.
    expect(contentHeight(buttonSize, 9)).toBeGreaterThan(120);
  });

  it('sizes by width when width is the tighter constraint', () => {
    // A tall, narrow viewport: 4 buttons across the width are the limit.
    const { buttonSize } = layoutFor({ rows: 5, viewportHeight: 2000 });
    expect(buttonSize).toBe((PHONE_WIDTH - BASE.spacing * 3) / 4);
  });

  it('stays within the maximum width on a tablet', () => {
    const { buttonSize } = layoutFor({ rows: 9, maxWidth: 500, viewportHeight: 1200 });
    expect(4 * buttonSize + 3 * BASE.spacing).toBeLessThanOrEqual(500);
  });

  it('falls back to a usable size before the first layout pass', () => {
    // No measurement yet must not mean zero-sized buttons.
    for (const rows of [5, 9]) {
      const { buttonSize } = layoutFor({ rows, viewportHeight: 0 });
      expect(buttonSize).toBeGreaterThanOrEqual(BASE.minButtonSize);
      expect(Number.isFinite(buttonSize)).toBe(true);
    }
  });

  it('handles a zero-width container without producing NaN', () => {
    const { buttonSize } = layoutFor({ rows: 9, maxWidth: 0 });
    expect(Number.isFinite(buttonSize)).toBe(true);
    expect(buttonSize).toBe(BASE.minButtonSize);
  });

  it('reports scrollable for a zero-height viewport only once measured', () => {
    expect(layoutFor({ rows: 9, viewportHeight: 0 }).scrollable).toBe(false);
    expect(layoutFor({ rows: 9, viewportHeight: 1 }).scrollable).toBe(true);
  });

  it('is deterministic', () => {
    expect(layoutFor({ rows: 9 })).toEqual(layoutFor({ rows: 9 }));
  });
});
