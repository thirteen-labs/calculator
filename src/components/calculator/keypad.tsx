import React, { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import { nextParen } from '@/calc';
import type { CalculatorState, Action } from '@/calc';
import { computeKeypadLayout } from './layout';
import type { ThemeColors } from './calculator';

/** Smallest button we draw; below this the keypad scrolls instead of shrinking. */
const MIN_BUTTON_SIZE = 40;
/** Button columns; every row in the keypad is this wide. */
const COLUMNS = 4;

type KeypadProps = {
  state: CalculatorState;
  dispatch: (a: Action) => void;
  theme: ThemeColors;
  /** Number of button rows: 5 in basic mode, 9 in scientific. */
  rows: number;
  spacing: number;
  keypadWidth: number;
  bottomInset: number;
};

type Btn = { label: string; action: Action; bg?: 'accent' | 'function' };

const BACKSPACE = '\u232B';
const DIV = String.fromCharCode(247);
const MULT = String.fromCharCode(215);
const MINUS = String.fromCharCode(8722);
const SQRT = String.fromCharCode(8730);
const PI = String.fromCharCode(960);

export function Keypad({
  state,
  dispatch,
  theme,
  rows,
  spacing,
  keypadWidth,
  bottomInset,
}: KeypadProps) {
  // The keypad is a flex child, so this measures the height it was actually
  // given rather than a height guessed from window metrics. That is what keeps
  // the last row on screen once the display and the memory panel are laid out.
  const [viewportHeight, setViewportHeight] = useState(0);
  const onLayout = useCallback((event: LayoutChangeEvent) => {
    const next = event.nativeEvent.layout.height;
    setViewportHeight((prev) => (Math.abs(prev - next) < 1 ? prev : next));
  }, []);

  const { buttonSize, scrollable } = computeKeypadLayout({
    viewportHeight,
    bottomInset,
    rows,
    columns: COLUMNS,
    spacing,
    maxWidth: keypadWidth,
    minButtonSize: MIN_BUTTON_SIZE,
  });

  const sciRows: Btn[][] =
    state.mode === 'scientific'
      ? [
          [
            { label: '+/\u2212', action: { type: 'INPUT_NEGATIVE' } },
            {
              label: state.angleMode,
              action: {
                type: 'SET_ANGLE_MODE',
                mode:
                  state.angleMode === 'DEG'
                    ? 'RAD'
                    : state.angleMode === 'RAD'
                      ? 'GRAD'
                      : 'DEG',
              },
            },
            { label: BACKSPACE, action: { type: 'BACKSPACE' } },
            { label: 'CE', action: { type: 'CLEAR_ENTRY' }, bg: 'function' },
          ],
          [
            { label: 'sin', action: { type: 'INPUT_FUNCTION', fn: 'sin' } },
            { label: 'cos', action: { type: 'INPUT_FUNCTION', fn: 'cos' } },
            { label: 'tan', action: { type: 'INPUT_FUNCTION', fn: 'tan' } },
            { label: PI, action: { type: 'INPUT_CONSTANT', constant: 'PI' } },
          ],
          [
            { label: SQRT, action: { type: 'INPUT_FUNCTION', fn: 'sqrt' } },
            { label: 'x' + String.fromCharCode(178), action: { type: 'INPUT_FUNCTION', fn: 'square' } },
            { label: '1/x', action: { type: 'INPUT_FUNCTION', fn: 'reciprocal' } },
            { label: 'e', action: { type: 'INPUT_CONSTANT', constant: 'E' } },
          ],
          [
            { label: 'log', action: { type: 'INPUT_FUNCTION', fn: 'log' } },
            { label: 'ln', action: { type: 'INPUT_FUNCTION', fn: 'ln' } },
            { label: 'n!', action: { type: 'INPUT_FUNCTION', fn: 'factorial' } },
            { label: 'y' + String.fromCharCode(7506), action: { type: 'INPUT_OPERATOR', operator: '^' } },
          ],
        ]
      : [];

  // One source of truth for the `( )` key, shared with the reducer so the
  // button's label/behaviour can never drift from what the reducer applies.
  const parenAction: Action = { type: 'INPUT_PAREN', paren: nextParen(state.expression) };

  // After a result has settled, `=` should repeat the last operation (the way a
  // hardware calculator's `=` key does) instead of re-evaluating the same
  // string, which is a no-op.
  const canRepeat = state.lastOperation !== undefined && state.result !== null;

  const basicRows: Btn[][] = [
    [
      { label: 'AC', action: { type: 'CLEAR' }, bg: 'function' },
      { label: '( )', action: parenAction, bg: 'function' },
      { label: '%', action: { type: 'INPUT_OPERATOR', operator: '%' }, bg: 'function' },
      { label: DIV, action: { type: 'INPUT_OPERATOR', operator: '÷' }, bg: 'accent' },
    ],
    [
      { label: '7', action: { type: 'INPUT_DIGIT', digit: '7' } },
      { label: '8', action: { type: 'INPUT_DIGIT', digit: '8' } },
      { label: '9', action: { type: 'INPUT_DIGIT', digit: '9' } },
      { label: MULT, action: { type: 'INPUT_OPERATOR', operator: '×' }, bg: 'accent' },
    ],
    [
      { label: '4', action: { type: 'INPUT_DIGIT', digit: '4' } },
      { label: '5', action: { type: 'INPUT_DIGIT', digit: '5' } },
      { label: '6', action: { type: 'INPUT_DIGIT', digit: '6' } },
      { label: MINUS, action: { type: 'INPUT_OPERATOR', operator: '-' }, bg: 'accent' },
    ],
    [
      { label: '1', action: { type: 'INPUT_DIGIT', digit: '1' } },
      { label: '2', action: { type: 'INPUT_DIGIT', digit: '2' } },
      { label: '3', action: { type: 'INPUT_DIGIT', digit: '3' } },
      { label: '+', action: { type: 'INPUT_OPERATOR', operator: '+' }, bg: 'accent' },
    ],
  ];

  const digitBg = theme.backgroundElement;
  const digitText = theme.text;
  const pillWidth = buttonSize * 2 + spacing;

  return (
    <View style={[styles.box, { width: keypadWidth }]} onLayout={onLayout}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.keypad,
          { gap: spacing, paddingBottom: bottomInset + spacing },
        ]}
        // This screen lays out its own insets, and the tab bar already sits
        // below it, so automatic content inset adjustment would inset the rows
        // twice and hide the bottom of the keypad.
        contentInsetAdjustmentBehavior="never"
        showsVerticalScrollIndicator={false}
        bounces={false}
        scrollEnabled={scrollable}
      >
        {sciRows.map((row, ri) => (
          <View key={`sci-${ri}`} style={[styles.row, { gap: spacing }]}>
            {row.map((btn, bi) => (
              <CalcButton
                key={`sci-${ri}-${bi}`}
                label={btn.label}
                onPress={() => dispatch(btn.action)}
                width={buttonSize}
                height={buttonSize}
                bgColor={btn.bg === 'function' ? theme.functionBg : digitBg}
                textColor={btn.bg === 'function' ? theme.functionText : digitText}
              />
            ))}
          </View>
        ))}
        {basicRows.map((row, ri) => (
          <View key={`row-${ri}`} style={[styles.row, { gap: spacing }]}>
            {row.map((btn, bi) => {
              const isOp = btn.bg === 'accent';
              const isFunc = btn.bg === 'function';
              return (
                <CalcButton
                  key={`row-${ri}-${bi}`}
                  label={btn.label}
                  onPress={() => dispatch(btn.action)}
                  width={buttonSize}
                  height={buttonSize}
                  bgColor={isOp ? theme.accent : isFunc ? theme.functionBg : digitBg}
                  textColor={isOp ? theme.accentText : isFunc ? theme.functionText : digitText}
                />
              );
            })}
          </View>
        ))}
        <View style={[styles.row, { gap: spacing }]}>
          <CalcButton
            label="0"
            onPress={() => dispatch({ type: 'INPUT_DIGIT', digit: '0' })}
            width={pillWidth}
            height={buttonSize}
            pill
            bgColor={digitBg}
            textColor={digitText}
          />
          <CalcButton
            label="."
            onPress={() => dispatch({ type: 'INPUT_DECIMAL' })}
            width={buttonSize}
            height={buttonSize}
            bgColor={digitBg}
            textColor={digitText}
          />
          <CalcButton
            label="="
            onPress={() =>
              dispatch({ type: canRepeat ? 'REPEAT_LAST_OPERATION' : 'EVALUATE' })
            }
            width={buttonSize}
            height={buttonSize}
            bgColor={theme.accent}
            textColor={theme.accentText}
          />
        </View>
      </ScrollView>
    </View>
  );
}

function CalcButton({
  label,
  onPress,
  width,
  height,
  bgColor,
  textColor,
  pill,
}: {
  label: string;
  onPress: () => void;
  width: number;
  height: number;
  bgColor: string;
  textColor: string;
  pill?: boolean;
}) {
  // Labels are sized for full-size buttons; shrink them once the vertical
  // fit scales buttons down so longer labels (GRAD, +/−, 1/x) stay inside.
  const labelSize = height >= 72 ? 22 : 18;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.button,
        {
          width,
          height,
          borderRadius: height / 2,
          backgroundColor: bgColor,
          opacity: pressed ? 0.6 : 1,
        },
        // Ties the `0` pill's inset to the button size, so the digit stays
        // optically centred as the keypad scales down for scientific mode.
        pill && { alignItems: 'flex-start', paddingLeft: width * 0.17 },
      ]}
    >
      <Text style={[styles.label, { color: textColor, fontSize: labelSize }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // The only flexible child: it absorbs whatever the fixed-height display and
  // panel bar leave behind, so neither can be pushed off the screen. Sizing the
  // rows from this measured height, rather than from window metrics, is what
  // keeps the last row visible once the memory panel opens.
  box: {
    flex: 1,
    minHeight: 0,
  },
  scroll: {
    flex: 1,
  },
  // No horizontal padding here: every row is exactly
  // 4 * buttonSize + 3 * spacing = keypadWidth wide, so any inset would push
  // the grid 16px past its box (clipped on Android, overhanging on iOS) and
  // the grid could never line up with the PanelBar above it, which spans the
  // full keypadWidth. Screen margins come from keypadWidth = width - 16.
  keypad: {
    // `center` keeps the grid aligned with the PanelBar above it even when the
    // buttons are sized by height and end up narrower than keypadWidth.
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    // Base size; CalcButton overrides it for vertically-shrunk buttons.
    fontSize: 22,
    fontWeight: '500',
    fontVariant: ['tabular-nums'],
  },
});
