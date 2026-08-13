import React from 'react';
import { Column, Text, Row } from '@expo/ui';
import { Pressable, ScrollView, StyleSheet } from 'react-native';
import type { CalculatorState, Action } from '@/calc';
import type { ThemeColors } from './calculator';
import { formatNumber } from '@/calc/engine';

type PanelBarProps = {
  panel: 'none' | 'history' | 'memory';
  setPanel: (p: 'none' | 'history' | 'memory') => void;
  state: CalculatorState;
  dispatch: (a: Action) => void;
  theme: ThemeColors;
  keypadWidth: number;
};

export function PanelBar({ panel, setPanel, state, dispatch, theme, keypadWidth }: PanelBarProps) {
  const toggle = (mode: 'history' | 'memory') => setPanel(panel === mode ? 'none' : mode);

  return (
    <Column spacing={0} style={{ width: keypadWidth }}>
      <Row alignment="center" spacing={8}>
        <PanelButton
          label="History"
          active={panel === 'history'}
          onPress={() => toggle('history')}
          theme={theme}
        />
        <PanelButton
          label="Memory"
          active={panel === 'memory'}
          onPress={() => toggle('memory')}
          theme={theme}
          hasMemory={state.memory !== null}
        />
        <PanelButton
          label={state.mode === 'basic' ? 'Sci' : 'Basic'}
          active={state.mode === 'scientific'}
          onPress={() => dispatch({ type: 'TOGGLE_SCIENTIFIC' })}
          theme={theme}
        />
      </Row>
      {panel === 'history' && (
        <HistoryPanel state={state} dispatch={dispatch} theme={theme} />
      )}
      {panel === 'memory' && (
        <MemoryPanel state={state} dispatch={dispatch} theme={theme} />
      )}
    </Column>
  );
}

function PanelButton({
  label,
  active,
  onPress,
  theme,
  hasMemory,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  theme: ThemeColors;
  hasMemory?: boolean;
}) {
  return (
    <Pressable onPress={onPress} style={styles.panelButton}>
      <Text
        textStyle={{
          fontSize: 13,
          fontWeight: active ? '700' : '500',
          color: active ? theme.accent : theme.textSecondary,
        }}
      >
        {label + (hasMemory ? ' *' : '')}
      </Text>
    </Pressable>
  );
}

function HistoryPanel({
  state,
  dispatch,
  theme,
}: {
  state: CalculatorState;
  dispatch: (a: Action) => void;
  theme: ThemeColors;
}) {
  if (state.history.length === 0) {
    return (
      <Column alignment="center" spacing={4} style={styles.emptyPanel}>
        <Text textStyle={{ fontSize: 14, color: theme.textSecondary }}>No history yet</Text>
      </Column>
    );
  }

  return (
    <ScrollView style={styles.panelScroll} nestedScrollEnabled>
      <Column spacing={0}>
        {state.history.slice(0, 20).map((entry) => (
          <Pressable
            key={entry.id}
            onPress={() => dispatch({ type: 'HISTORY_REUSE', id: entry.id })}
            style={[styles.historyItem, { borderBottomColor: theme.backgroundElement }]}
          >
            <Row alignment="center" spacing={8}>
              <Column spacing={0} style={{ width: '70%' }}>
                <Text textStyle={{ fontSize: 14, color: theme.textSecondary }}>
                  {String(entry.expression)}
                </Text>
                <Text textStyle={{ fontSize: 20, fontWeight: '600', color: theme.text }}>
                  {'= ' + String(entry.result)}
                </Text>
              </Column>
              <Pressable
                onPress={() => dispatch({ type: 'HISTORY_TOGGLE_FAVORITE', id: entry.id })}
                style={styles.favoriteBtn}
              >
                <Text textStyle={{ fontSize: 18, color: entry.favorite ? theme.favorite : theme.textSecondary }}>
                  {entry.favorite ? '*' : 'o'}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => dispatch({ type: 'HISTORY_DELETE', id: entry.id })}
                style={styles.deleteBtn}
              >
                <Text textStyle={{ fontSize: 14, color: theme.error }}>x</Text>
              </Pressable>
            </Row>
          </Pressable>
        ))}
      </Column>
      {state.history.length > 0 && (
        <Pressable
          onPress={() => dispatch({ type: 'HISTORY_CLEAR' })}
          style={styles.clearHistoryBtn}
        >
          <Text textStyle={{ fontSize: 13, color: theme.error, fontWeight: '500' }}>Clear All</Text>
        </Pressable>
      )}
    </ScrollView>
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
  const memoryValue = state.memory !== null ? formatNumber(state.memory, state.precision) : '0';

  return (
    <Column alignment="center" spacing={8} style={styles.memoryPanel}>
      <Text textStyle={{ fontSize: 14, color: theme.textSecondary }}>
        {'Memory: ' + memoryValue}
      </Text>
      <Row alignment="center" spacing={6}>
        <MemoryButton label="MC" onPress={() => dispatch({ type: 'MEMORY_CLEAR' })} theme={theme} />
        <MemoryButton label="MR" onPress={() => dispatch({ type: 'MEMORY_RECALL' })} theme={theme} />
        <MemoryButton label="M+" onPress={() => dispatch({ type: 'MEMORY_ADD' })} theme={theme} />
        <MemoryButton label="M-" onPress={() => dispatch({ type: 'MEMORY_SUBTRACT' })} theme={theme} />
        <MemoryButton label="MS" onPress={() => dispatch({ type: 'MEMORY_STORE' })} theme={theme} />
      </Row>
    </Column>
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
    <Pressable onPress={onPress} style={[styles.memoryButton, { backgroundColor: theme.backgroundElement }]}>
      <Text textStyle={{ fontSize: 14, fontWeight: '500', color: theme.text }}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  panelButton: {
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  emptyPanel: {
    paddingVertical: 16,
  },
  panelScroll: {
    maxHeight: 200,
  },
  historyItem: {
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
  },
  favoriteBtn: {
    padding: 4,
  },
  deleteBtn: {
    padding: 4,
  },
  clearHistoryBtn: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  memoryPanel: {
    paddingVertical: 12,
  },
  memoryButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
});
