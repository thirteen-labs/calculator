import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { CalculatorState, Action } from '@/calc';
import type { ThemeColors } from './calculator';
import { formatNumber } from '@/calc/engine';

type PanelMode = 'none' | 'memory';

/**
 * Fixed height of the panel bar with the memory panel closed. The open panel
 * grows the row past this, which the keypad's flex box absorbs by shrinking.
 */
const PANEL_BAR_HEIGHT = 40;

type PanelBarProps = {
  panel: PanelMode;
  setPanel: (p: PanelMode) => void;
  state: CalculatorState;
  dispatch: (a: Action) => void;
  theme: ThemeColors;
  keypadWidth: number;
};

export function PanelBar({ panel, setPanel, state, dispatch, theme, keypadWidth }: PanelBarProps) {
  const toggle = () => setPanel(panel === 'memory' ? 'none' : 'memory');

  return (
    <View style={[styles.root, { width: keypadWidth }]}>
      <View style={styles.tabRow}>
        <PanelButton
          label={state.memory !== null ? 'Memory •' : 'Memory'}
          active={panel === 'memory'}
          onPress={toggle}
          theme={theme}
        />
        <PanelButton
          label={state.mode === 'basic' ? 'Sci' : 'Basic'}
          active={state.mode === 'scientific'}
          onPress={() => dispatch({ type: 'TOGGLE_SCIENTIFIC' })}
          theme={theme}
        />
      </View>
      {panel === 'memory' && <MemoryPanel state={state} dispatch={dispatch} theme={theme} />}
    </View>
  );
}

function PanelButton({
  label,
  active,
  onPress,
  theme,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  theme: ThemeColors;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      hitSlop={8}
      style={({ pressed }) => [
        styles.panelButton,
        { backgroundColor: active ? theme.backgroundSelected : 'transparent', opacity: pressed ? 0.6 : 1 },
      ]}
    >
      <Text
        style={[
          styles.panelLabel,
          { color: active ? theme.text : theme.textSecondary },
          active && styles.panelLabelActive,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function MemoryPanel({
  state,
  dispatch,
  theme,
}: {
  state: CalculatorState;
  dispatch: (a: Action) => void;
  theme: ThemeColors;
}) {
  const memoryValue = state.memory !== null ? formatNumber(state.memory, state.precision) : 'Empty';

  return (
    <View style={styles.memoryPanel}>
      <Text style={[styles.memoryValue, { color: theme.textSecondary }]}>
        {'Memory: ' + memoryValue}
      </Text>
      <View style={styles.memoryRow}>
        <MemoryButton label="MC" onPress={() => dispatch({ type: 'MEMORY_CLEAR' })} theme={theme} />
        <MemoryButton label="MR" onPress={() => dispatch({ type: 'MEMORY_RECALL' })} theme={theme} />
        <MemoryButton label="M+" onPress={() => dispatch({ type: 'MEMORY_ADD' })} theme={theme} />
        <MemoryButton label="M−" onPress={() => dispatch({ type: 'MEMORY_SUBTRACT' })} theme={theme} />
        <MemoryButton label="MS" onPress={() => dispatch({ type: 'MEMORY_STORE' })} theme={theme} />
      </View>
    </View>
  );
}

function MemoryButton({
  label,
  onPress,
  theme,
}: {
  label: string;
  onPress: () => void;
  theme: ThemeColors;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.memoryButton,
        { backgroundColor: theme.backgroundElement, opacity: pressed ? 0.6 : 1 },
      ]}
    >
      <Text style={[styles.memoryLabel, { color: theme.text }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    // Fixed when closed so the display + panel bar + keypad split the screen
    // deterministically; opening the memory panel grows the row and the keypad,
    // being the only flexible child, gives the space back.
    height: PANEL_BAR_HEIGHT,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
  },
  panelButton: {
    paddingVertical: 7,
    paddingHorizontal: 16,
    borderRadius: 16,
    minWidth: 88,
    alignItems: 'center',
  },
  panelLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  panelLabelActive: {
    fontWeight: '700',
  },
  memoryPanel: {
    alignItems: 'center',
    gap: 8,
    paddingTop: 12,
  },
  memoryValue: {
    fontSize: 14,
    fontVariant: ['tabular-nums'],
  },
  memoryRow: {
    flexDirection: 'row',
    gap: 6,
    alignSelf: 'stretch',
  },
  memoryButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memoryLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
});
