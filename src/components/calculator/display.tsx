import React from 'react';
import { Column, Text } from '@expo/ui';
import { StyleSheet } from 'react-native';
import type { CalculatorState } from '@/calc';
import type { ThemeColors } from './calculator';

type Props = { state: CalculatorState; theme: ThemeColors };

export function Display({ state, theme }: Props) {
  const expression = state.expression || '0';
  const displayResult = state.error
    ? state.error.message
    : state.result ?? state.preview ?? '';

  return (
    <Column alignment="end" spacing={0} style={styles.container}>
      <Text
        numberOfLines={1}
        textStyle={{
          fontSize: 18,
          color: theme.textSecondary,
          textAlign: 'right',
          fontWeight: '400',
        }}
      >
        {expression}
      </Text>
      <Text
        numberOfLines={1}
        textStyle={{
          fontSize: state.error ? 32 : 48,
          color: state.error ? theme.error : theme.text,
          textAlign: 'right',
          fontWeight: '600',
        }}
      >
        {displayResult}
      </Text>
    </Column>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 12,
  },
});
