import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { CalculatorState } from '@/calc';
import type { ThemeColors } from './calculator';

type Props = { state: CalculatorState; theme: ThemeColors };

/**
 * Fixed height of the display block.
 *
 * It has to be a fixed height rather than a flex share: if the display competed
 * with the keypad for leftover space, the keypad's height would depend on the
 * display, which grew in response to the keypad, and the pair settled at an
 * arbitrary split instead of filling the screen.
 */
export const DISPLAY_HEIGHT = 132;

export function Display({ state, theme }: Props) {
  const expression = state.expression || '0';
  const displayResult = state.error
    ? state.error.message
    : state.preview ?? state.result ?? '0';

  return (
    <View style={styles.container}>
      <Text
        numberOfLines={1}
        ellipsizeMode="head"
        adjustsFontSizeToFit
        minimumFontScale={0.6}
        selectable
        style={[styles.expression, { color: theme.textSecondary }]}
      >
        {expression}
      </Text>
      <Text
        numberOfLines={1}
        ellipsizeMode="tail"
        adjustsFontSizeToFit
        minimumFontScale={0.5}
        selectable
        style={[
          styles.result,
          { color: state.error ? theme.error : theme.text },
          state.error && styles.resultError,
        ]}
      >
        {displayResult}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    // Fixed height, with the keypad as the only flexible sibling, so the result
    // sits directly above the keys and the keypad always gets the rest.
    flexShrink: 0,
    height: DISPLAY_HEIGHT,
    width: '100%',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  expression: {
    fontSize: 18,
    fontWeight: '400',
    textAlign: 'right',
    fontVariant: ['tabular-nums'],
  },
  result: {
    fontSize: 48,
    fontWeight: '600',
    textAlign: 'right',
    fontVariant: ['tabular-nums'],
    minHeight: 58,
  },
  resultError: {
    fontSize: 28,
  },
});
