import React, { useState } from 'react';
import { Text } from '@expo/ui';
import { View, useWindowDimensions, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCalculator } from '@/hooks/use-calculator';
import { useTheme } from '@/hooks/use-theme';
import type { CalculatorState, Action } from '@/calc';
import type { Palette } from '@/constants/theme';
import { Display } from './display';
import { Keypad } from './keypad';
import { PanelBar } from './panels';
import { BottomTabInset } from '@/constants/theme';

export type ThemeColors = Palette;

type PanelMode = 'none' | 'history' | 'memory';

export default function Calculator() {
  const { state, dispatch } = useCalculator();
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [panel, setPanel] = useState<PanelMode>('none');

  const keypadWidth = Math.min(width - 16, 500);
  const spacing = 6;
  const buttonSize = (keypadWidth - spacing * 5) / 4;
  const smallBtnSize = (keypadWidth - spacing * 7) / 6;

  return (
    <View style={styles.host}>
      <View style={styles.container}>
        <Display state={state} theme={theme} />
        <PanelBar
          panel={panel}
          setPanel={setPanel}
          state={state}
          dispatch={dispatch}
          theme={theme}
          keypadWidth={keypadWidth}
        />
        <Keypad
          state={state}
          dispatch={dispatch}
          theme={theme}
          buttonSize={buttonSize}
          smallBtnSize={smallBtnSize}
          spacing={spacing}
          keypadWidth={keypadWidth}
          bottomInset={insets.bottom + BottomTabInset}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  host: { flex: 1 },
  container: { flex: 1, alignItems: 'center' },
});
