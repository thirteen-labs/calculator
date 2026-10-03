/**
 * Keypad sizing maths, kept separate from the components so the "it must fit on
 * screen" rule can be unit tested without rendering anything.
 *
 * The scientific keypad stacks 9 button rows instead of 5, so at full width its
 * natural height is far taller than a phone screen and the bottom row used to be
 * pushed off-screen. The keypad is now laid out with `flex: 1`, so it is handed
 * whatever height is genuinely left over by the display and the panel bar; this
 * turns that measured height into a button size that fits.
 *
 * `viewportHeight` is measured from the keypad's own box, never derived from
 * the window: deriving it back out of the container height created a circular
 * dependency (the keypad's height depended on a measurement that depended on
 * the keypad), which collapsed to zero on the first layout pass.
 */

export type KeypadLayout = {
  /** Edge length of a single button. */
  buttonSize: number;
  /** Total height of the rows plus their gaps and bottom padding. */
  contentHeight: number;
  /** True when the rows are taller than the box and the keypad must scroll. */
  scrollable: boolean;
};

export type KeypadLayoutInput = {
  /** Measured height of the keypad's own box. 0 means "not measured yet". */
  viewportHeight: number;
  bottomInset: number;
  rows: number;
  columns: number;
  spacing: number;
  /** Widest the keypad may be (the screen minus its side margins). */
  maxWidth: number;
  /** Smallest button we are willing to draw, even if that means scrolling. */
  minButtonSize: number;
};

export function computeKeypadLayout({
  viewportHeight,
  bottomInset,
  rows,
  columns,
  spacing,
  maxWidth,
  minButtonSize,
}: KeypadLayoutInput): KeypadLayout {
  const rowGap = spacing * (rows - 1);
  // Matches the keypad's `paddingBottom` so it is counted exactly once.
  const bottomPad = bottomInset + spacing;
  const buttonByWidth = Math.max(0, (maxWidth - spacing * (columns - 1)) / columns);

  // Before the first layout pass there is no height to fit into, so size by
  // width alone and let the measurement correct it immediately afterwards.
  if (viewportHeight <= 0) {
    const buttonSize = Math.max(minButtonSize, buttonByWidth);
    const contentHeight = rows * buttonSize + rowGap + bottomPad;
    return { buttonSize, contentHeight, scrollable: false };
  }

  const buttonByHeight = (viewportHeight - bottomPad - rowGap) / rows;
  // Height wins when it is the tighter constraint, width otherwise. The floor
  // only comes into play on very short screens, where the rows scroll rather
  // than shrinking into unusability.
  const buttonSize = Math.max(minButtonSize, Math.min(buttonByWidth, buttonByHeight));
  const contentHeight = rows * buttonSize + rowGap + bottomPad;

  return { buttonSize, contentHeight, scrollable: contentHeight > viewportHeight + 0.5 };
}
