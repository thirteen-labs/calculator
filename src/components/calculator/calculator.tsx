import React, { useCallback, useState } from 'react';
import { View, StyleSheet, type LayoutChangeEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCalculator } from '@/hooks/use-calculator';
import { useTheme } from '@/hooks/use-theme';
import { Display, DISPLAY_HEIGHT } from './display';
import { Keypad } from './keypad';
import { PanelBar } from './panels';
import type { Palette } from '@/constants/theme';

export type ThemeColors = Palette;

type PanelMode = 'none' | 'memory';

/** Side margin kept either side of the keypad on narrow screens. */
const SIDE_MARGIN = 16;
/** Widest the keypad is ever allowed to get, so it stays thumb-sized. */
const MAX_KEYPAD_WIDTH = 500;

export default function Calculator() {
  const { state, dispatch } = useCalculator();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [panel, setPanel] = useState<PanelMode>('none');

  // Width is measured from the container rather than taken from `Dimensions`,
  // which is not populated on the first render on every platform. Height is
  // deliberately NOT measured here: the keypad is a flex child and measures its
  // own height, which keeps the sizing free of a circular dependency.
  const [width, setWidth] = useState(0);
  const onLayout = useCallback((event: LayoutChangeEvent) => {
    const next = event.nativeEvent.layout.width;
    setWidth((prev) => (Math.abs(prev - next) < 1 ? prev : next));
  }, []);

  const keypadWidth = Math.max(0, Math.min(width - SIDE_MARGIN, MAX_KEYPAD_WIDTH));

  return (
    <View style={[styles.host, { backgroundColor: theme.background, paddingTop: insets.top }]}>
      {/* A plain column: the display is a fixed height, the panel bar is its
          natural height, and the keypad is a flex child that takes everything
          left over. Scientific mode's extra four rows used to be laid out at
          full width size and ran off the bottom of the screen. */}
      <View style={styles.container} onLayout={onLayout}>
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
          spacing={6}
          keypadWidth={keypadWidth}
          bottomInset={insets.bottom}
          rows={state.mode === 'scientific' ? 9 : 5}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  host: { flex: 1 },
  container: { flex: 1, alignItems: 'center' },
});